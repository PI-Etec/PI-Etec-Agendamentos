const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Material = require('../model/Material');
const SelecaoKit = require('../model/SelecaoKit');

// GET /selecionar/materials - listar todos os materiais
router.get('/materials', async (req, res, next) => {
  try {
    console.log('[selecionar] GET /materials chamado');
    const materials = await Material.find({}, 'material quantidade').lean();
    res.json({ success: true, materials });
  } catch (err) {
    next(err);
  }
});

// POST /selecionar/selecionar - selecionar uma quantidade de um material
// body: { materialId, quantidade }
router.post('/selecionar', async (req, res, next) => {
  try {
    const { materialId, quantidade } = req.body;

    if (!materialId || typeof quantidade !== 'number') {
      return res.status(400).json({ success: false, message: 'Parâmetros inválidos.' });
    }

    // Operação atômica: decrementa se houver quantidade suficiente
    const updated = await Material.findOneAndUpdate(
      { _id: materialId, quantidade: { $gte: quantidade } },
      { $inc: { quantidade: -quantidade } },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({ success: false, message: 'Quantidade insuficiente ou material não encontrado.' });
    }

    res.json({ success: true, material: { id: updated._id, material: updated.material, quantidade: updated.quantidade } });
  } catch (err) {
    // Caso o ID seja inválido para mongoose
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: 'ID do material inválido.' });
    }
    next(err);
  }
});

module.exports = router;

// POST /selecionar/kits - salvar uma seleção de kit com vários materiais
// body: { selections: [ { materialId, material, quantidade } ] }
router.post('/kits', async (req, res, next) => {
  try {
    const { selections } = req.body;
    if (!Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({ success: false, message: 'Nenhuma seleção fornecida.' });
    }

    // normalizar e validar
    const items = selections.map(s => ({
      materialId: s.materialId,
      material: s.material,
      quantidade: Number(s.quantidade) || 0
    }));

    // Tentativa de aplicar todos os decrementos. Se algum falhar, faz rollback dos anteriores.
    const applied = [];
    try {
      for (const it of items) {
        if (!it.materialId || it.quantidade <= 0) {
          throw { code: 'INVALID', message: 'Item inválido na seleção.' };
        }

        // decrementa somente se houver quantidade suficiente
        const updated = await Material.findOneAndUpdate(
          { _id: it.materialId, quantidade: { $gte: it.quantidade } },
          { $inc: { quantidade: -it.quantidade } },
          { new: true }
        );

        if (!updated) {
          // falta estoque ou material inexistente
          throw { code: 'INSUFFICIENT', message: `Quantidade insuficiente para o material ${it.material || it.materialId}` };
        }

        applied.push({ materialId: it.materialId, quantidade: it.quantidade });
      }
    } catch (applyErr) {
      // rollback das atualizações aplicadas até o momento
      try {
        for (const a of applied) {
          await Material.findByIdAndUpdate(a.materialId, { $inc: { quantidade: a.quantidade } });
        }
      } catch (rbErr) {
        console.error('[selecionar/kits] Erro ao fazer rollback:', rbErr);
        // se rollback falhar, retornar erro crítico
        return res.status(500).json({ success: false, message: 'Erro crítico ao reverter alterações de estoque. Contate o administrador.' });
      }

      if (applyErr && applyErr.code === 'INSUFFICIENT') {
        return res.status(400).json({ success: false, message: applyErr.message });
      }
      if (applyErr && applyErr.code === 'INVALID') {
        return res.status(400).json({ success: false, message: applyErr.message });
      }
      throw applyErr;
    }

    // se chegou até aqui, todos os decrementos foram aplicados com sucesso — salvar o kit
    const kit = new SelecaoKit({ items });
    await kit.save();

    res.json({ success: true, kitId: kit._id });
  } catch (err) {
    // tratar CastError de ObjectId
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: 'ID do material inválido.' });
    }
    next(err);
  }
});

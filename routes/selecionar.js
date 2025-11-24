const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Material = require('../model/Material');
const SelecaoKit = require('../model/SelecaoKit');
const Reagente = require('../model/Reagente');

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
    // garantir que os itens tenham o campo `type` (aqui todos são materiais)
    const itemsWithType = items.map(it => ({ materialId: it.materialId, material: it.material, quantidade: it.quantidade, type: 'material' }));
    const kit = new SelecaoKit({ items: itemsWithType });
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

// POST /selecionar/kits/combined - salvar uma seleção combinada de materiais e reagentes
// body: { materials: [...], reagents: [...] }
router.post('/kits/combined', async (req, res, next) => {
  try {
    const { materials = [], reagents = [] } = req.body;
    const selections = [];
    if (!Array.isArray(materials) && !Array.isArray(reagents)) {
      return res.status(400).json({ success: false, message: 'Nenhuma seleção válida fornecida.' });
    }

    // normalizar itens de materiais
    const mats = (Array.isArray(materials) ? materials : []).map(s => ({
      type: 'material', materialId: s.materialId, material: s.material, quantidade: Number(s.quantidade) || 0
    }));
    const regs = (Array.isArray(reagents) ? reagents : []).map(s => ({
      type: 'reagente', materialId: s.materialId, material: s.material, quantidade: Number(s.quantidade) || 0
    }));

    const items = [...mats, ...regs];
    if (!items.length) return res.status(400).json({ success: false, message: 'Nenhuma seleção fornecida.' });

    const appliedMat = [];
    const appliedReg = [];
    try {
      for (const it of items) {
        if (!it.materialId || it.quantidade <= 0) {
          throw { code: 'INVALID', message: 'Item inválido na seleção.' };
        }

        if (it.type === 'material') {
          const updated = await Material.findOneAndUpdate(
            { _id: it.materialId, quantidade: { $gte: it.quantidade } },
            { $inc: { quantidade: -it.quantidade } },
            { new: true }
          );
          if (!updated) throw { code: 'INSUFFICIENT', message: `Quantidade insuficiente para o material ${it.material || it.materialId}` };
          appliedMat.push({ materialId: it.materialId, quantidade: it.quantidade });
        } else {
          const updated = await Reagente.findOneAndUpdate(
            { _id: it.materialId, quantidade: { $gte: it.quantidade } },
            { $inc: { quantidade: -it.quantidade } },
            { new: true }
          );
          if (!updated) throw { code: 'INSUFFICIENT', message: `Quantidade insuficiente para o reagente ${it.material || it.materialId}` };
          appliedReg.push({ materialId: it.materialId, quantidade: it.quantidade });
        }
      }
    } catch (applyErr) {
      // rollback
      try {
        for (const a of appliedMat) {
          await Material.findByIdAndUpdate(a.materialId, { $inc: { quantidade: a.quantidade } });
        }
        for (const a of appliedReg) {
          await Reagente.findByIdAndUpdate(a.materialId, { $inc: { quantidade: a.quantidade } });
        }
      } catch (rbErr) {
        console.error('[selecionar/kits/combined] Erro ao fazer rollback:', rbErr);
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

    // salvar kit combinado (preservar tipo de cada item)
    const saveItems = items.map(i => ({ materialId: i.materialId, material: i.material, quantidade: i.quantidade, type: i.type || 'item' }));
    const kitName = req.body.name && String(req.body.name).trim();
    // sempre salvar como string (pode ser vazia)
    const kit = new SelecaoKit({ name: kitName !== undefined ? kitName : '', items: saveItems });
    await kit.save();

    console.log('[selecionar/kits/combined] Kit salvo:', { kitId: kit._id, name: kit.name });
    res.json({ success: true, kitId: kit._id, name: kit.name });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: 'ID inválido na seleção.' });
    }
    next(err);
  }
});

// GET /selecionar/kits - listar todos os kits salvos (útil para debug)
router.get('/kits', async (req, res, next) => {
  try {
    let kits = await SelecaoKit.find({}).lean();
    // normalizar para garantir que cada item tenha `type`.
    // Se o tipo estiver ausente ou for 'item', tentamos identificar consultando Material e Reagente.
    const enriched = await Promise.all(kits.map(async k => {
      const items = Array.isArray(k.items) ? await Promise.all(k.items.map(async it => {
        const base = { materialId: it.materialId, material: it.material, quantidade: it.quantidade };
        const currentType = it.type || 'item';
        if (currentType && currentType !== 'item') return { ...base, type: currentType };
        // detectar pelo materialId nas coleções
        try {
          if (it.materialId) {
            const mat = await Material.findById(it.materialId).lean().select('_id');
            if (mat) return { ...base, type: 'material' };
            const reg = await Reagente.findById(it.materialId).lean().select('_id');
            if (reg) return { ...base, type: 'reagente' };
          }
        } catch (e) {
          console.debug('[selecionar/kits] detecção falhou para item', it, e && e.message);
        }
        return { ...base, type: 'item' };
      })) : [];
      return { ...k, items };
    }));
    res.json({ success: true, kits: enriched });
  } catch (err) {
    next(err);
  }
});

// Exportar o router somente após todas as rotas terem sido definidas
module.exports = router;

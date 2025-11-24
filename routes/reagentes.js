const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Reagente = require('../model/Reagente');
const SelecaoKit = require('../model/SelecaoKit');

// GET /reagentes - listar todos os reagentes
router.get('/', async (req, res, next) => {
  try {
    const reagentes = await Reagente.find({}, 'reagente quantidade').lean();
    res.json({ success: true, reagentes });
  } catch (err) {
    next(err);
  }
});

// POST /reagentes - criar um novo reagente
router.post('/', async (req, res, next) => {
  try {
    const { reagente, quantidade } = req.body;
    if (!reagente || typeof quantidade !== 'number') {
      return res.status(400).json({ success: false, message: 'Parâmetros inválidos.' });
    }
    const r = new Reagente({ reagente, quantidade });
    await r.save();
    res.status(201).json({ success: true, reagente: { id: r._id, reagente: r.reagente, quantidade: r.quantidade } });
  } catch (err) {
    next(err);
  }
});

// GET /reagentes/:id - obter um reagente
router.get('/:id', async (req, res, next) => {
  try {
    const r = await Reagente.findById(req.params.id, 'reagente quantidade').lean();
    if (!r) return res.status(404).json({ success: false, message: 'Reagente não encontrado.' });
    res.json({ success: true, reagente: r });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: 'ID do reagente inválido.' });
    }
    next(err);
  }
});

// PUT /reagentes/:id - atualizar um reagente (nome ou quantidade)
router.put('/:id', async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.reagente !== undefined) updates.reagente = req.body.reagente;
    if (req.body.quantidade !== undefined) updates.quantidade = Number(req.body.quantidade);

    const updated = await Reagente.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true, context: 'query' });
    if (!updated) return res.status(404).json({ success: false, message: 'Reagente não encontrado.' });
    res.json({ success: true, reagente: { id: updated._id, reagente: updated.reagente, quantidade: updated.quantidade } });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: 'ID do reagente inválido.' });
    }
    next(err);
  }
});

// DELETE /reagentes/:id - remover um reagente
router.delete('/:id', async (req, res, next) => {
  try {
    const removed = await Reagente.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ success: false, message: 'Reagente não encontrado.' });
    res.json({ success: true, message: 'Reagente removido.' });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: 'ID do reagente inválido.' });
    }
    next(err);
  }
});

// POST /reagentes/selecionar - decrementar quantidade atomically
// body: { reagenteId, quantidade }
router.post('/selecionar', async (req, res, next) => {
  try {
    const { reagenteId, quantidade } = req.body;
    if (!reagenteId || typeof quantidade !== 'number') {
      return res.status(400).json({ success: false, message: 'Parâmetros inválidos.' });
    }

    const updated = await Reagente.findOneAndUpdate(
      { _id: reagenteId, quantidade: { $gte: quantidade } },
      { $inc: { quantidade: -quantidade } },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({ success: false, message: 'Quantidade insuficiente ou reagente não encontrado.' });
    }

    res.json({ success: true, reagente: { id: updated._id, reagente: updated.reagente, quantidade: updated.quantidade } });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: 'ID do reagente inválido.' });
    }
    next(err);
  }
});

module.exports = router;

// POST /reagentes/kits - salvar uma seleção de kit com vários reagentes
// body: { selections: [ { materialId, material, quantidade } ] }
router.post('/kits', async (req, res, next) => {
  try {
    const { selections } = req.body;
    if (!Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({ success: false, message: 'Nenhuma seleção fornecida.' });
    }

    const items = selections.map(s => ({
      materialId: s.materialId,
      material: s.material,
      quantidade: Number(s.quantidade) || 0
    }));

    const applied = [];
    try {
      for (const it of items) {
        if (!it.materialId || it.quantidade <= 0) {
          throw { code: 'INVALID', message: 'Item inválido na seleção.' };
        }

        const updated = await Reagente.findOneAndUpdate(
          { _id: it.materialId, quantidade: { $gte: it.quantidade } },
          { $inc: { quantidade: -it.quantidade } },
          { new: true }
        );

        if (!updated) {
          throw { code: 'INSUFFICIENT', message: `Quantidade insuficiente para o reagente ${it.material || it.materialId}` };
        }

        applied.push({ materialId: it.materialId, quantidade: it.quantidade });
      }
    } catch (applyErr) {
      try {
        for (const a of applied) {
          await Reagente.findByIdAndUpdate(a.materialId, { $inc: { quantidade: a.quantidade } });
        }
      } catch (rbErr) {
        console.error('[reagentes/kits] Erro ao fazer rollback:', rbErr);
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

    const kit = new SelecaoKit({ items });
    await kit.save();

    res.json({ success: true, kitId: kit._id });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: 'ID do reagente inválido.' });
    }
    next(err);
  }
});

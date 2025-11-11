const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Material = require('../model/Material');

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

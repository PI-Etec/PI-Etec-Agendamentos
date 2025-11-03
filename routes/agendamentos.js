// JavaScript
const express = require('express');
const Agendamento = require('../model/Agendamentos');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { data, horario, sala } = req.body;
    if (!data || !horario || !sala) {
      return res.status(400).send({ error: 'Campos obrigatórios: data, horario, sala' });
    }
    const novo = new Agendamento({ data, horario, sala });
    await novo.save();
    res.status(201).send(novo);
  } catch (err) {
    console.error('Erro ao criar agendamento:', err);
    res.status(500).send({ error: 'Erro ao criar agendamento' });
  }
});

module.exports = router;
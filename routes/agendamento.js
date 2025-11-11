const express = require('express');
const router = express.Router();

const Agendamento = require('../model/Agendamentos');


console.log('Schema de Agendamento em uso:', Agendamento.schema.paths);


router.post('/', async (req, res, next) => {
  // --- INÍCIO DO LOG DE DIAGNÓSTICO ---
  console.log('>>> ROTA POST /agendamentos FOI ACIONADA <<<');
  console.log('>>> Corpo da Requisição (req.body):', req.body);
  // --- FIM DO LOG DE DIAGNÓSTICO ---

  try {
    const { sala, data, horario, nome_professor } = req.body;

    // Validação básica de entrada
    if (!sala || !data || !horario || !nome_professor) {
      return res.status(400).json({ message: 'Os campos sala, data, horário e nome do professor são obrigatórios.' });
    }

    // Cria e salva o novo agendamento usando o modelo importado
    const novoAgendamento = new Agendamento({
      sala,
      data,
      horario,
      nome_professor
    });

    const agendamentoSalvo = await novoAgendamento.save();

    // Sucesso!
    res.status(201).json(agendamentoSalvo);

  } catch (error) {
    console.error('FALHA AO CRIAR AGENDAMENTO:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Erro de validação.', details: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Este horário já está agendado para esta sala e data.' });
    }

    res.status(500).json({ message: 'Ocorreu um erro interno no servidor ao tentar criar o agendamento.' });
  }
});

module.exports = router;
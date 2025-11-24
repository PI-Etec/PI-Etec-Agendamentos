const express = require('express');
const router = express.Router();

const Agendamento = require('../model/Agendamentos');

console.log('Schema de Agendamento em uso:', Agendamento.schema.paths);

// ROTA ORIGINAL: cria apenas agendamento simples
router.post('/', async (req, res) => {
  console.log('>>> ROTA POST /agendamentos FOI ACIONADA <<<');
  console.log('>>> Corpo da Requisição (req.body):', req.body);

  try {
    const { sala, data, horario, nome_professor } = req.body;

    if (!sala || !data || !horario || !nome_professor) {
      return res.status(400).json({
        message: 'Os campos sala, data, horário e nome do professor são obrigatórios.'
      });
    }

    const novoAgendamento = new Agendamento({
      sala,
      data,
      horario,
      nome_professor
    });

    const agendamentoSalvo = await novoAgendamento.save();
    console.log('>>> Documento salvo (rota simples):', agendamentoSalvo);
    res.status(201).json(agendamentoSalvo);

  } catch (error) {
    console.error('FALHA AO CRIAR AGENDAMENTO:', error);

    res.status(500).json({
      message: 'Ocorreu um erro interno no servidor ao tentar criar o agendamento.'
    });
  }
});

// NOVA ROTA: recebe agendamento completo (sala/data/hora + kit)
router.post('/completo', async (req, res) => {
  console.log('>>> ROTA POST /agendamentos/completo FOI ACIONADA <<<');
  console.log('>>> Corpo da Requisição (req.body):', JSON.stringify(req.body, null, 2));

  try {
    const {
      sala,
      data,
      horario,
      nome_professor,
      kitName,
      materials,
      reagents
    } = req.body;

    if (!sala || !data || !horario || !nome_professor) {
      return res.status(400).json({
        message: 'Os campos sala, data, horário e nome do professor são obrigatórios.'
      });
    }

    const novoAgendamento = new Agendamento({
      sala,
      data,
      horario,
      nome_professor,
      kitName: kitName || null,
      materials: Array.isArray(materials) ? materials : [],
      reagents: Array.isArray(reagents) ? reagents : []
    });

    console.log('>>> Documento que será salvo:', novoAgendamento);

    const agendamentoSalvo = await novoAgendamento.save();

    console.log('>>> Documento salvo (rota completa):', agendamentoSalvo);

    res.status(201).json({
      message: 'Agendamento completo salvo com sucesso.',
      agendamento: agendamentoSalvo
    });
  } catch (error) {
    console.error('FALHA AO CRIAR AGENDAMENTO COMPLETO:', error);
    res.status(500).json({
      message: 'Erro ao salvar agendamento completo.',
      details: error.message
    });
  }
});

module.exports = router;
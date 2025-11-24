const express = require('express');
const router = express.Router();

const Agendamento = require('../model/Agendamentos');

console.log('Schema de Agendamento em uso:', Agendamento.schema.paths);

// ROTA GET: retorna lista de agendamentos (mapeada para o formato esperado pelo frontend)
router.get('/', async (req, res) => {
  console.log('>>> ROTA GET /agendamentos FOI ACIONADA <<<', 'from', req.ip);
  try {
    const docs = await Agendamento.find().lean().exec();

    const agendamentos = docs.map(doc => {
      const kitName = doc.kitName || '';

      const materialsList = Array.isArray(doc.materials) && doc.materials.length
        ? doc.materials.map(m => (m.material || '').trim()).filter(Boolean).join(', ')
        : '';

      const reagentsList = Array.isArray(doc.reagents) && doc.reagents.length
        ? doc.reagents.map(r => (r.material || '').trim()).filter(Boolean).join(', ')
        : '';

      const detailsParts = [];
      if (materialsList) detailsParts.push(materialsList);
      if (reagentsList) detailsParts.push(reagentsList);
      const combined = detailsParts.join('; ');

      // Novo formato pedido: "Nome do kit (material1, material2, ...)"
      let kitDisplay;
      if (kitName) {
        kitDisplay = combined ? `${kitName} (${combined})` : `${kitName}`;
      } else {
        kitDisplay = combined || '';
      }

      return {
        data: doc.data ? new Date(doc.data).toLocaleDateString('pt-BR') : '',
        hora: doc.horario || '',
        sala: doc.sala || '',
        professor: doc.nome_professor || '',
        kit: kitName,
        kitDisplay
      };
    });

    return res.json({ agendamentos });
  } catch (error) {
    console.error('FALHA AO BUSCAR AGENDAMENTOS:', error);
    return res.status(500).json({ message: 'Erro ao buscar agendamentos', details: error.message });
  }
});

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
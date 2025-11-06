// JavaScript
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// 1. DEFINIÇÃO DO MODELO (SCHEMA)
// Se o seu modelo já estiver em outro arquivo, você pode importar em vez de redefinir.
const agendamentoSchema = new mongoose.Schema({
  sala: {
    type: String,
    required: [true, 'O campo "sala" é obrigatório.'],
    trim: true
  },
  data: {
    type: Date,
    required: [true, 'O campo "data" é obrigatório.']
  },
  horario: {
    type: String,
    required: [true, 'O campo "horario" é obrigatório.'],
    trim: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'O formato do horário deve ser HH:MM']
  },
  // Adicione um campo para o usuário, se aplicável
  // usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Índice único para evitar agendamentos duplicados na mesma sala, data e horário
agendamentoSchema.index({ sala: 1, data: 1, horario: 1 }, { unique: true });

const Agendamento = mongoose.model('Agendamento', agendamentoSchema);

// 2. ROTA POST PARA CRIAR AGENDAMENTOS
router.post('/', async (req, res, next) => {
  // --- INÍCIO DO LOG DE DIAGNÓSTICO ---
  console.log('>>> ROTA POST /agendamentos FOI ACIONADA <<<');
  console.log('>>> Corpo da Requisição (req.body):', req.body);
  // --- FIM DO LOG DE DIAGNÓSTICO ---

  try {
    const { sala, data, horario } = req.body;

    // Validação básica de entrada
    if (!sala || !data || !horario) {
      return res.status(400).json({ message: 'Os campos sala, data e horário são obrigatórios.' });
    }

    // Cria e salva o novo agendamento
    const novoAgendamento = new Agendamento({
      sala,
      data,
      horario
    });

    const agendamentoSalvo = await novoAgendamento.save();

    // Sucesso!
    res.status(201).json(agendamentoSalvo);

  } catch (error) {
    // --- TRATAMENTO DE ERRO CORRETO ---
    // 1. Imprime o erro no console do Node.js para você ver!
    console.error('FALHA AO CRIAR AGENDAMENTO:', error);

    // 2. Envia uma resposta de erro mais útil para o frontend
    if (error.name === 'ValidationError') {
      // Erro de validação do Mongoose (ex: campo obrigatório faltando)
      return res.status(400).json({ message: 'Erro de validação.', details: error.message });
    }
    if (error.code === 11000) {
      // Erro de chave duplicada (agendamento já existe)
      return res.status(409).json({ message: 'Este horário já está agendado para esta sala e data.' });
    }

    // Para todos os outros erros, envia um 500 genérico
    res.status(500).json({ message: 'Ocorreu um erro interno no servidor ao tentar criar o agendamento.' });
  }
});

module.exports = router;
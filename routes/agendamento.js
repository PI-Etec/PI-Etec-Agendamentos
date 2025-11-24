const express = require("express");
const router = express.Router();

const Agendamento = require("../model/Agendamentos");

// Rota: cria agendamento simples
router.post("/", async (req, res) => {
  try {
    const { sala, data, horario, nome_professor } = req.body;

    if (!sala || !data || !horario || !nome_professor) {
      return res.status(400).json({
        message:
          "Os campos sala, data, horário e nome do professor são obrigatórios.",
      });
    }

    const novoAgendamento = new Agendamento({
      sala,
      data,
      horario,
      nome_professor,
    });
    const agendamentoSalvo = await novoAgendamento.save();
    res.status(201).json(agendamentoSalvo);
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    res.status(500).json({ message: "Erro interno ao criar agendamento." });
  }
});

// Rota: cria agendamento completo (com kit)
router.post("/completo", async (req, res) => {
  try {
    const {
      sala,
      data,
      horario,
      nome_professor,
      kitName,
      materials,
      reagents,
    } = req.body;

    if (!sala || !data || !horario || !nome_professor) {
      return res.status(400).json({
        message:
          "Os campos sala, data, horário e nome do professor são obrigatórios.",
      });
    }

    const novoAgendamento = new Agendamento({
      sala,
      data,
      horario,
      nome_professor,
      kitName: kitName || null,
      materials: Array.isArray(materials) ? materials : [],
      reagents: Array.isArray(reagents) ? reagents : [],
    });

    const agendamentoSalvo = await novoAgendamento.save();
    res.status(201).json({
      message: "Agendamento completo salvo com sucesso.",
      agendamento: agendamentoSalvo,
    });
  } catch (error) {
    console.error("Erro ao criar agendamento completo:", error);
    res.status(500).json({
      message: "Erro ao salvar agendamento completo.",
      details: error.message,
    });
  }
});

module.exports = router;

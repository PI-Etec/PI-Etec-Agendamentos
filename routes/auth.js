const express = require('express');
const router = express.Router();
const Professor = require('../model/Professor');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Rota de login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const professor = await Professor.findOne({ email });
  if (!professor) return res.status(404).json({ message: 'Usuário não encontrado' });

  const senhaValida = await bcrypt.compare(senha, professor.senha);
  if (!senhaValida) return res.status(401).json({ message: 'Senha incorreta' });

  const token = jwt.sign({ id: professor._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, nome: professor.nome });
});

// Rota de cadastro
router.post('/register', async (req, res) => {
  const { nome, email, senha } = req.body;

  // Verifica se o email já está cadastrado
  const professorExistente = await Professor.findOne({ email });
  if (professorExistente) {
    return res.status(400).json({ message: 'Este email já está em uso!' });
  }

  // Criptografa a senha
  const hash = await bcrypt.hash(senha, 10);

  try {
    // Cria o novo professor
    const novoProfessor = await Professor.create({ nome, email, senha: hash });
    res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (err) {
    console.error('Erro ao cadastrar professor:', err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
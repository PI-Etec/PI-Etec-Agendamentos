const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Professor = require('../model/Professor');
const Administrador = require('../model/Administrador');
const Tecnico = require('../model/Tecnico');

const router = express.Router();

// Função para escolher modelo pelo e-mail
function definirModeloPorEmail(email) {
  if (email.endsWith('@professor.com')) return Professor;
  if (email.endsWith('@adm.com')) return Administrador;
  if (email.endsWith('@tecnico.com')) return Tecnico;
  return null;
}

// 🟢 Cadastro
router.post('/register', async (req, res) => {
  const { nome, email, senha } = req.body;

  const Modelo = definirModeloPorEmail(email);
  if (!Modelo) {
    return res.status(400).json({ message: 'Domínio inválido. Use @professor.com, @adm.com ou @tecnico.com' });
  }

  const existente = await Modelo.findOne({ email });
  if (existente) return res.status(400).json({ message: 'Usuário já existe!' });

  const hash = await bcrypt.hash(senha, 10);

  try {
    await Modelo.create({ nome, email, senha: hash });
    res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (err) {
    res.status(400).json({ message: 'Erro ao cadastrar usuário.' });
  }
});

// 🔐 Login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  const Modelo = definirModeloPorEmail(email);
  if (!Modelo) {
    return res.status(400).json({ message: 'Domínio de e-mail inválido.' });
  }

  const usuario = await Modelo.findOne({ email });
  if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado' });

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) return res.status(401).json({ message: 'Senha incorreta' });

  const token = jwt.sign({ id: usuario._id, email: usuario.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, nome: usuario.nome });
});

module.exports = router;

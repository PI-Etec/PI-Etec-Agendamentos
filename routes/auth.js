const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Professor = require('../model/Professor');
const Administrador = require('../model/Administrador');
const Tecnico = require('../model/Tecnico');

const router = express.Router();

// 🔹 Log para verificar se o auth.js foi carregado
console.log('🟢 Auth router carregado!');

function definirModeloPorEmail(email) {
  if (email.endsWith('@professor.com')) return Professor;
  if (email.endsWith('@adm.com')) return Administrador;
  if (email.endsWith('@tecnico.com')) return Tecnico;
  return null;
}

// Registro
router.post('/register', async (req, res) => {
  console.log('📌 Rota /register chamada'); // log rota
  const { nome, email, senha } = req.body;
  const Modelo = definirModeloPorEmail(email);

  if (!Modelo) {
    console.log('❌ Domínio inválido:', email);
    return res.status(400).json({ message: 'Domínio inválido. Use @professor.com, @adm.com ou @tecnico.com' });
  }

  try {
    const existente = await Modelo.findOne({ email });
    if (existente) {
      console.log('⚠️ Usuário já existe:', email);
      return res.status(400).json({ message: 'Usuário já existe!' });
    }

    const hash = await bcrypt.hash(senha, 10);
    await Modelo.create({ nome, email, senha: hash });
    console.log('✅ Usuário criado com sucesso:', email);
    res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (err) {
    console.error('❌ Erro ao cadastrar usuário:', err);
    res.status(500).json({ message: 'Erro interno ao cadastrar usuário.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  console.log('📌 Rota /login chamada'); // log rota
  const { email, senha } = req.body;
  const Modelo = definirModeloPorEmail(email);

  if (!Modelo) {
    console.log('❌ Domínio inválido no login:', email);
    return res.status(400).json({ message: 'Domínio de e-mail inválido.' });
  }

  try {
    const usuario = await Modelo.findOne({ email });
    if (!usuario) {
      console.log('⚠️ Usuário não encontrado:', email);
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      console.log('⚠️ Senha incorreta para:', email);
      return res.status(401).json({ message: 'Senha incorreta.' });
    }

    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET não definido no .env');
      return res.status(500).json({ message: 'JWT_SECRET não definido no .env!' });
    }

    const role = email.split('@')[1]; // role baseado no domínio
    const token = jwt.sign({ id: usuario._id, email: usuario.email, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log('✅ Login bem-sucedido:', email);
    res.status(200).json({ token, nome: usuario.nome, role });
  } catch (err) {
    console.error('❌ Erro interno no login:', err);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

module.exports = router;

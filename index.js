const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: '*' })); // Permite requisições do front
app.use(express.json()); // Interpreta JSON do front

// Conexão com o MongoDB
async function conectarBanco() {
  console.log('⏳ Tentando conectar ao MongoDB...');
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado ao MongoDB!');
  } catch (erro) {
    console.error('❌ Erro ao conectar:', erro.message);
    throw erro;
  }
}

// Modelo do Professor
const Professor = mongoose.model('Professor', new mongoose.Schema({
  nome: String,
  email: String,
  senha: String,
}, { collection: 'Professor' }));

// Rota de login
app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body;

  // Verifica se o professor existe
  const professor = await Professor.findOne({ email });
  if (!professor) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  // Verifica se a senha é válida
  const senhaValida = await bcrypt.compare(senha, professor.senha);
  if (!senhaValida) {
    return res.status(401).json({ message: 'Senha incorreta' });
  }

  // Gera o token JWT
  const token = jwt.sign({ id: professor._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, nome: professor.nome });
});

// Rota de cadastro
app.post('/api/auth/register', async (req, res) => {
  const { nome, email, senha } = req.body;

  // Verifica se o email já existe no banco
  const professorExistente = await Professor.findOne({ email });
  if (professorExistente) {
    return res.status(400).json({ message: 'Usuário já existe' });
  }

  // Criptografa a senha
  const hash = await bcrypt.hash(senha, 10);

  // Cria o novo professor
  try {
    const novoProfessor = await Professor.create({ nome, email, senha: hash });
    res.json({ message: 'Usuário criado com sucesso!' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor rodando!');
});

// Função para iniciar servidor após conectar ao banco
async function startServer() {
  try {
    await conectarBanco(); // Conecta ao MongoDB
    app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
  } catch (err) {
    console.error('Erro ao iniciar servidor:', err.message);
  }
}

// Inicia o servidor
startServer();

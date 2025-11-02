const express = require('express');
const cors = require('cors');
require('dotenv').config();
const conectarBanco = require('./conexao_db');

// Importa rotas
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Usa as rotas de autenticação
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.send('Servidor rodando!'));

async function startServer() {
  try {
    await conectarBanco();
    app.listen(3000, () => console.log('🚀 Servidor rodando na porta 3000'));
  } catch (err) {
    console.error('Erro ao iniciar servidor:', err.message);
  }
}

startServer();

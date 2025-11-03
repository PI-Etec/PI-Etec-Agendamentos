const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRouter = require('./routes/auth');
const agendamentosRouter = require('./routes/agendamentos');

const app = express();
app.use(cors({ origin: 'http://localhost:5500', credentials: true }));
app.use(express.json());

// Conexão Mongo (use MONGODB_URI se tiver no .env)
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Etec-BD';
mongoose.connect(uri)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro MongoDB:', err));

app.use('/auth', authRouter);
app.use('/agendamentos', agendamentosRouter);

app.get('/', (req, res) => res.send('Servidor rodando!'));

app.listen(3000, () => console.log('🚀 Servidor rodando na porta 3000'));

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRouter = require('./routes/auth');
const agendamentosRouter = require('./routes/agendamentos');

const app = express();

const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:5500'];

app.use(cors({
  origin: '*',
  credentials: true
}));


app.use(express.json());

// 🔹 Conexão MongoDB
const uri = process.env.MONGO_URI; // Use a variável correta
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Conectado ao MongoDB Atlas'))
  .catch(err => console.error('❌ Erro MongoDB:', err.message));

// Rotas
app.use('/auth', authRouter);
app.use('/agendamentos', agendamentosRouter);

app.get('/', (req, res) => res.send('Servidor rodando!'));

// 🔹 Subir servidor após conexão (opcional para segurança)
app.listen(3000, () => console.log('🚀 Servidor rodando na porta 3000'));

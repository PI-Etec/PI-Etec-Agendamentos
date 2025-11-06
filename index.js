const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRouter = require('./routes/auth');
const agendamentosRouter = require('./routes/agendamento');

const app = express();

// Use a configuração CORS mais simples. Isso aceita qualquer origem.
app.use(cors());
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

// --- INÍCIO DO TESTE DE DIAGNÓSTICO FINAL ---
// Este middleware vai rodar para TODAS as requisições que chegarem.
app.use((req, res, next) => {
  console.log('====================================');
  console.log('NOVA REQUISIÇÃO RECEBIDA:');
  console.log('URL:', req.originalUrl);
  console.log('Método:', req.method);
  console.log('Corpo (Body):', req.body);
  console.log('====================================');
  next(); // Passa a requisição para a próxima rota
});
// --- FIM DO TESTE DE DIAGNÓSTICO FINAL ---

// A URL deve ser no plural para bater com o que o frontend chama.
app.use('/agendamentos', agendamentosRouter);

app.get('/', (req, res) => res.send('Servidor rodando!'));

// Middleware de tratamento de erros. Coloque no final, antes do app.listen.
app.use((err, req, res, next) => {
  console.error('--- ERRO NÃO TRATADO ---');
  console.error(err.stack);
  console.error('------------------------');
  res.status(500).send({ error: 'Algo quebrou no servidor!', details: err.message });
});

// 🔹 Subir servidor após conexão (opcional para segurança)
app.listen(3000, () => console.log('🚀 Servidor rodando na porta 3000'));

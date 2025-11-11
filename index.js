const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRouter = require('./routes/auth');
const agendamentosRouter = require('./routes/agendamento');
const selecionarRouter = require('./routes/selecionar');

const app = express();

const path = require('path');
const http = require('http');

// Use a configuração CORS mais simples. Isso aceita qualquer origem.
app.use(cors());
const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:5500'];

app.use(cors({
  origin: '*',
  credentials: true
}));


app.use(express.json());

// Servir arquivos estáticos (HTML/CSS/JS) a partir da pasta html
app.use(express.static(path.join(__dirname, 'html')));

// 🔹 Conexão MongoDB
const uri = process.env.MONGO_URI; // Use a variável correta
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Conectado ao MongoDB Atlas'))
  .catch(err => console.error('❌ Erro MongoDB:', err.message));

// Rotas
app.use('/auth', authRouter);

// rota para selecionar materiais
app.use('/selecionar', selecionarRouter);

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

// Simple health endpoint for diagnostics
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.get('/', (req, res) => res.send('Servidor rodando!'));

// Middleware de tratamento de erros. Coloque no final, antes do app.listen.
app.use((err, req, res, next) => {
  console.error('--- ERRO NÃO TRATADO ---');
  console.error(err.stack);
  console.error('------------------------');
  res.status(500).send({ error: 'Algo quebrou no servidor!', details: err.message });
});

// 🔹 Subir servidor após conexão (opcional para segurança)
const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';
console.log('>> About to listen:', { host: HOST, port: PORT });
const server = app.listen(PORT, HOST);

server.on('listening', () => {
  const addr = server.address();
  console.log(`🚀 Servidor rodando em http://${addr.address}:${addr.port}`);

  // Self-check: try to call the server from the same process after a short delay
  setTimeout(() => {
    const checkUrl = `http://${HOST}:${PORT}/selecionar/materials`;
    console.log('[self-check] attempting', checkUrl);
    http.get(checkUrl, (res) => {
      console.log('[self-check] statusCode =', res.statusCode);
      let body = '';
      res.on('data', (chunk) => body += chunk.toString());
      res.on('end', () => console.log('[self-check] body (start):', body.slice(0, 400)));
    }).on('error', (err) => {
      console.error('[self-check] error connecting to', checkUrl, err && err.message);
    });
  }, 1500);
});

server.on('error', (err) => {
  console.error('*** Server error during listen:', err && err.message);
});

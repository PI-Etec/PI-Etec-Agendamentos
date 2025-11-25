const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRouter = require('./routes/auth');
const agendamentosRouter = require('./routes/agendamento');
const selecionarRouter = require('./routes/selecionar');
const reagentesRouter = require('./routes/reagentes');

const app = express();

const path = require('path');
const http = require('http');

app.use(cors());
const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:5500'];

app.use(cors({
  origin: '*',
  credentials: true
}));


app.use(express.json());

app.use(express.static(path.join(__dirname, 'html')));

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/javascript', express.static(path.join(__dirname, 'javascript')));
app.use('/img', express.static(path.join(__dirname, 'img')));

const uri = process.env.MONGO_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado ao MongoDB Atlas'))
  .catch(err => console.error('Erro MongoDB:', err.message));


app.use('/auth', authRouter);
app.use('/selecionar', selecionarRouter);
app.use('/reagentes', reagentesRouter);
app.use('/agendamentos', agendamentosRouter);
app.use('/api/agendamentos', agendamentosRouter);
app.use('/routes/agendamentos', agendamentosRouter);

app.get('/__routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((layer) => {
    if (layer.route && layer.route.path) {
      routes.push({ path: layer.route.path, methods: layer.route.methods });
    } else if (layer.name === 'router' && layer.regexp) {
      routes.push({ mount: layer.regexp.toString() });
    }
  });
  res.json(routes);
});
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.get('/', (req, res) => res.send('Servidor rodando!'));

app.use((err, req, res, next) => {
  console.error('--- ERRO NÃO TRATADO ---');
  console.error(err.stack);
  console.error('------------------------');
  res.status(500).send({ error: 'Algo quebrou no servidor!', details: err.message });
});

const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';
console.log('>> About to listen:', { host: HOST, port: PORT });
const server = app.listen(PORT, HOST);

server.on('listening', () => {
  const addr = server.address();
  console.log(`Servidor rodando em http://${addr.address}:${addr.port}`);

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

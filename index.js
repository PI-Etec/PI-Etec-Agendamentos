const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRouter = require("./routes/auth");
const agendamentosRouter = require("./routes/agendamento");
const selecionarRouter = require("./routes/selecionar");
const reagentesRouter = require("./routes/reagentes");

const app = express();

const path = require("path");
const http = require("http");

// Use a configuração CORS mais simples. Isso aceita qualquer origem.
app.use(cors());
const allowedOrigins = ["http://127.0.0.1:5500", "http://localhost:5500"];

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.use(express.json());

// Servir arquivos estáticos (HTML/CSS/JS) a partir da pasta html
app.use(express.static(path.join(__dirname, "html")));

// Servir também outros assets estáticos (CSS, JS e imagens) que ficam fora da pasta `html`
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/javascript", express.static(path.join(__dirname, "javascript")));
app.use("/img", express.static(path.join(__dirname, "img")));

// Conexão MongoDB
const uri = process.env.MONGO_URI;
mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err.message));

// Rotas
app.use("/auth", authRouter);

// rota para selecionar materiais
app.use("/selecionar", selecionarRouter);

// rotas para reagentes
app.use("/reagentes", reagentesRouter);

// Middleware e logs de requisição removidos para evitar saída excessiva em produção.

// A URL deve ser no plural para bater com o que o frontend chama.
app.use("/agendamentos", agendamentosRouter);

// Adicionar aliases para cobrir frontends que usam caminhos diferentes
app.use("/api/agendamentos", agendamentosRouter);
app.use("/routes/agendamentos", agendamentosRouter);

// Rota de debug para inspecionar caminhos registrados (temporária)
app.get("/__routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((layer) => {
    if (layer.route && layer.route.path) {
      routes.push({ path: layer.route.path, methods: layer.route.methods });
    } else if (layer.name === "router" && layer.regexp) {
      routes.push({ mount: layer.regexp.toString() });
    }
  });
  res.json(routes);
});

// Simple health endpoint for diagnostics
app.get("/health", (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() }),
);

app.get("/", (req, res) => res.send("Servidor rodando!"));

// Middleware de tratamento de erros. Coloque no final, antes do app.listen.
app.use((err, req, res, next) => {
  console.error("--- ERRO NÃO TRATADO ---");
  console.error(err.stack);
  console.error("------------------------");
  res
    .status(500)
    .send({ error: "Algo quebrou no servidor!", details: err.message });
});

// 🔹 Subir servidor após conexão (opcional para segurança)
const PORT = process.env.PORT || 3000;
const HOST = "127.0.0.1";
const server = app.listen(PORT, HOST, () => {
  const addr = server.address();
  console.log(`Servidor rodando em http://${addr.address}:${addr.port}`);
});

server.on("error", (err) => {
  console.error("Erro no servidor:", err && err.message);
});

// Endpoint para regenerar os gráficos (executa script Python que cria imagens em /img/charts)
const { exec } = require("child_process");
app.get("/regenerate-charts", (req, res) => {
  const pythonCmd = process.env.PYTHON_CMD || "python";
  const scriptPath = "python/generate_charts.py";
  exec(`${pythonCmd} ${scriptPath}`, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error("Erro ao gerar gráficos:", error.message);
      return res.status(500).json({ ok: false, error: error.message, stderr });
    }
    console.log("Regeneração de gráficos concluída");
    res.json({ ok: true, output: stdout });
  });
});

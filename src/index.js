import express from 'express';
import dotenv from 'dotenv';
import './conexao_db.js'; // conecta ao MongoDB
import professorRoutes from './routes/professor.js';

dotenv.config();

const app = express();
app.use(express.json());

// Rotas
app.use('/professores', professorRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Servidor rodando em http://localhost:${PORT}`));

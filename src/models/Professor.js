import mongoose from '../conexao_db.js';

const professorSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
});

const Professor = mongoose.model('Professor', professorSchema);
export default Professor;

const mongoose = require('mongoose');

const ProfessorSchema = new mongoose.Schema({
  nome: String,
  email: String,
  senha: String,
}, { collection: 'Professor' });

module.exports = mongoose.model('Professor', ProfessorSchema);
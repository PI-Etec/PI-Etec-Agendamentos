const mongoose = require('mongoose');

const TecnicoSchema = new mongoose.Schema({
  nome: String,
  email: String,
  senha: String,
}, { collection: 'Tecnico' });

module.exports = mongoose.model('Tecnico', TecnicoSchema);

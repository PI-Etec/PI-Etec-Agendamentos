const mongoose = require('mongoose');

const AdministradorSchema = new mongoose.Schema({
  nome: String,
  email: String,
  senha: String,
}, { collection: 'Administrador' });

module.exports = mongoose.model('Administrador', AdministradorSchema);

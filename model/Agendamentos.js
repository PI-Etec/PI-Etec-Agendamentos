const mongoose = require('mongoose');

const AgendamentosSchema = new mongoose.Schema({
    data: Date,
    horario: String,
    sala: String,
    nome_professor: String
}, { collection: 'Agendamentos' });

module.exports = mongoose.model('Agendamentos', AgendamentosSchema);
    
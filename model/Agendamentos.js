const mongoose = require('mongoose');

const AgendamentosSchema = new mongoose.Schema({
    data: Date,
    horario: String,
    sala: String,
    nome_professor: String,

    // NOVOS CAMPOS
    kitName: { type: String },
    materials: [{
        materialId: String,
        material: String,
        quantidade: Number
    }],
    reagents: [{
        materialId: String,
        material: String,
        quantidade: Number
    }]
}, { collection: 'Agendamentos' });

module.exports = mongoose.model('Agendamentos', AgendamentosSchema);

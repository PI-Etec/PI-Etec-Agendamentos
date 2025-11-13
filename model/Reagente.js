const mongoose = require('mongoose');

const ReagenteSchema = new mongoose.Schema({
  reagente: { type: String, required: true },
  quantidade: { type: Number, required: true, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Reagente', ReagenteSchema);

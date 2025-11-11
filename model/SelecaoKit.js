const mongoose = require('mongoose');

const SelecaoItemSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  material: { type: String },
  quantidade: { type: Number, required: true, min: 0 }
}, { _id: false });

const SelecaoKitSchema = new mongoose.Schema({
  items: { type: [SelecaoItemSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SelecaoKit', SelecaoKitSchema);

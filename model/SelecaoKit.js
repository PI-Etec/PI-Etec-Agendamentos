const mongoose = require("mongoose");

const SelecaoItemSchema = new mongoose.Schema(
  {
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material" },
    material: { type: String },
    type: {
      type: String,
      enum: ["material", "reagente", "item"],
      default: "item",
    },
    quantidade: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const SelecaoKitSchema = new mongoose.Schema({
  name: { type: String },
  items: { type: [SelecaoItemSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SelecaoKit", SelecaoKitSchema);

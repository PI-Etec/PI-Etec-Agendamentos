const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema(
  {
    material: { type: String, required: true },
    quantidade: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Material", MaterialSchema);

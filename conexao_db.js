const mongoose = require('mongoose');
require('dotenv').config();

async function conectarBanco() {
  console.log('Tentando conectar ao MongoDB...');
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado ao MongoDB Atlas!');
  } catch (erro) {
    console.error('Erro ao conectar:', erro.message);
    throw erro;
  }
}

module.exports = conectarBanco;
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log(' Conectado ao MongoDB'))
.catch((err) => console.error('Erro de conexão:', err));

export default mongoose;

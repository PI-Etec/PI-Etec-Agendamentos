import express from 'express';
import Professor from '../models/Professor.js';

const router = express.Router();

// Listar todos
router.get('/', async (req, res) => {
  try {
    const professores = await Professor.find();
    res.json(professores);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar professores' });
  }
});

// Criar
router.post('/', async (req, res) => {
  try {
    const professor = new Professor(req.body);
    await professor.save();
    res.status(201).json(professor);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar professor' });
  }
});

// Buscar por ID
router.get('/:id', async (req, res) => {
  try {
    const professor = await Professor.findById(req.params.id);
    if (!professor) return res.status(404).json({ error: 'Professor não encontrado' });
    res.json(professor);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar professor' });
  }
});

// Atualizar por ID
router.put('/:id', async (req, res) => {
  try {
    const professor = await Professor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(professor);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar professor' });
  }
});

// Deletar por ID
router.delete('/:id', async (req, res) => {
  try {
    await Professor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Professor deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar professor' });
  }
});

export default router;

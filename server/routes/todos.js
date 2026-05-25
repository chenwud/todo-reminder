import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/todos
router.get('/', async (req, res) => {
  const all = await db.getTodosByUser(req.userId);
  res.json(all);
});

// GET /api/todos/:id
router.get('/:id', async (req, res) => {
  const todo = await db.getTodoById(req.params.id);
  if (!todo || todo.userId !== req.userId) return res.status(404).json({ error: 'Not found' });
  res.json(todo);
});

// POST /api/todos
router.post('/', async (req, res) => {
  const { title, description, priority, due } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const todo = {
    id: uuidv4(),
    userId: req.userId,
    title: title.trim(),
    description: (description || '').trim(),
    priority: priority || 'medium',
    due: due || null,
    completed: false,
    notified: false,
    createdAt: new Date().toISOString(),
  };
  await db.createTodo(todo);
  res.status(201).json(todo);
});

// PUT /api/todos/:id
router.put('/:id', async (req, res) => {
  const todo = await db.getTodoById(req.params.id);
  if (!todo || todo.userId !== req.userId) return res.status(404).json({ error: 'Not found' });
  const updated = await db.updateTodo(req.params.id, req.body);
  res.json(updated);
});

// PATCH /api/todos/:id/toggle
router.patch('/:id/toggle', async (req, res) => {
  const todo = await db.getTodoById(req.params.id);
  if (!todo || todo.userId !== req.userId) return res.status(404).json({ error: 'Not found' });
  const updated = await db.updateTodo(req.params.id, { completed: !todo.completed });
  res.json(updated);
});

// DELETE /api/todos/:id
router.delete('/:id', async (req, res) => {
  const todo = await db.getTodoById(req.params.id);
  if (!todo || todo.userId !== req.userId) return res.status(404).json({ error: 'Not found' });
  await db.deleteTodo(req.params.id);
  res.json({ success: true });
});

// DELETE /api/todos/completed/bulk
router.delete('/completed/bulk', async (req, res) => {
  await db.deleteCompletedTodos(req.userId);
  res.json({ success: true });
});

export default router;

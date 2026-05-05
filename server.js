const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database('tasks.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    text  TEXT    NOT NULL,
    done  INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);
try {
  db.exec(`ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'`);
} catch {}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare('SELECT id, text, done, priority FROM tasks ORDER BY created_at DESC').all();
  res.json(tasks.map(t => ({ ...t, done: t.done === 1 })));
});

app.post('/api/tasks', (req, res) => {
  const { text, priority = 'medium' } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'text required' });
  const { lastInsertRowid } = db.prepare('INSERT INTO tasks (text, priority) VALUES (?, ?)').run(text.trim(), priority);
  const task = db.prepare('SELECT id, text, done, priority FROM tasks WHERE id = ?').get(lastInsertRowid);
  res.status(201).json({ ...task, done: task.done === 1 });
});

app.patch('/api/tasks/:id', (req, res) => {
  const { done, text, priority } = req.body;
  const task = db.prepare('SELECT id, text, done, priority FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'not found' });
  const newDone     = done     !== undefined ? (done ? 1 : 0) : task.done;
  const newText     = text     !== undefined ? text.trim()     : task.text;
  const newPriority = priority !== undefined ? priority        : task.priority;
  if (!newText) return res.status(400).json({ error: 'text required' });
  db.prepare('UPDATE tasks SET done = ?, text = ?, priority = ? WHERE id = ?').run(newDone, newText, newPriority, req.params.id);
  res.json({ id: task.id, text: newText, done: newDone === 1, priority: newPriority });
});

app.delete('/api/tasks/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (!changes) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));

#!/usr/bin/env node
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'tasks.db'));

try { db.exec(`ALTER TABLE tasks ADD COLUMN due_date TEXT`); } catch {}

const PRIORITY_SCORE = { high: 100, medium: 50, low: 10 };
const PRIORITY_LABEL = { high: '高', medium: '中', low: '低' };

function score(task) {
  const priority = PRIORITY_SCORE[task.priority] ?? 50;
  const ageDays  = (Date.now() / 1000 - task.created_at) / 86400;
  const age      = Math.floor(ageDays) * 2;
  let deadline   = 0;
  if (task.due_date) {
    const daysLeft = (new Date(task.due_date) - new Date()) / 86400000;
    deadline = daysLeft < 0 ? 200 : daysLeft <= 3 ? 50 : 0;
  }
  return priority + age + deadline;
}

function fmt(task) {
  const due = task.due_date ? `  期限: ${task.due_date}` : '';
  return `[${PRIORITY_LABEL[task.priority] ?? task.priority}] ${task.text}${due}`;
}

function topTask() {
  return db.prepare('SELECT * FROM tasks WHERE done = 0').all()
    .sort((a, b) => score(b) - score(a))[0];
}

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'add': {
    let text = '', priority = 'medium', due_date = null;
    for (let i = 0; i < args.length; i++) {
      if      (args[i] === '-p') priority = args[++i];
      else if (args[i] === '-d') due_date = args[++i];
      else text = args[i];
    }
    if (!text.trim()) { console.error('タスク名を指定してください'); process.exit(1); }
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO tasks (text, priority, due_date) VALUES (?, ?, ?)'
    ).run(text.trim(), priority, due_date);
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(lastInsertRowid);
    console.log(`追加: ${fmt(task)}`);
    break;
  }

  case 'next': {
    const task = topTask();
    if (!task) { console.log('タスクなし'); break; }
    console.log(`次のタスク (score: ${score(task)})\n  ${fmt(task)}`);
    break;
  }

  case 'done': {
    const task = topTask();
    if (!task) { console.log('タスクなし'); break; }
    db.prepare('UPDATE tasks SET done = 1 WHERE id = ?').run(task.id);
    console.log(`完了: ${fmt(task)}`);
    const next = topTask();
    if (next) console.log(`次のタスク: ${fmt(next)}`);
    break;
  }

  case 'ls': {
    const tasks = db.prepare('SELECT * FROM tasks WHERE done = 0').all()
      .sort((a, b) => score(b) - score(a));
    if (!tasks.length) { console.log('タスクなし'); break; }
    tasks.forEach((t, i) => console.log(`${i + 1}. ${fmt(t)}  (score: ${score(t)})`));
    break;
  }

  default:
    console.log(`使い方:
  tt add "タスク名" [-p high|medium|low] [-d YYYY-MM-DD]
  tt next
  tt done
  tt ls`);
}

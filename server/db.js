import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data.db');

let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');
  createTables();
  return db;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      priority TEXT DEFAULT 'medium',
      due TEXT,
      completed INTEGER DEFAULT 0,
      notified INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_todos_userId ON todos(userId)
  `);
  save();
}

function save() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function rowToObj(row, columns) {
  const obj = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  obj.completed = !!obj.completed;
  obj.notified = !!obj.notified;
  return obj;
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function run(sql, params = []) {
  db.run(sql, params);
  save();
}

// ── Users ──
export async function findUserByUsername(username) {
  await getDb();
  return queryOne('SELECT * FROM users WHERE username = ?', [username]);
}

export async function findUserById(id) {
  await getDb();
  return queryOne('SELECT * FROM users WHERE id = ?', [id]);
}

export async function createUser(user) {
  await getDb();
  run('INSERT INTO users (id, username, password, createdAt) VALUES (?, ?, ?, ?)',
    [user.id, user.username, user.password, user.createdAt]);
  return user;
}

// ── Todos ──
export async function getTodosByUser(userId) {
  await getDb();
  return queryAll('SELECT * FROM todos WHERE userId = ? ORDER BY createdAt DESC', [userId]);
}

export async function getTodoById(id) {
  await getDb();
  return queryOne('SELECT * FROM todos WHERE id = ?', [id]);
}

export async function createTodo(todo) {
  await getDb();
  run('INSERT INTO todos (id, userId, title, description, priority, due, completed, notified, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [todo.id, todo.userId, todo.title, todo.description, todo.priority, todo.due, todo.completed ? 1 : 0, todo.notified ? 1 : 0, todo.createdAt]);
  return todo;
}

export async function updateTodo(id, updates) {
  await getDb();
  const existing = await getTodoById(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates };
  run('UPDATE todos SET title=?, description=?, priority=?, due=?, completed=?, notified=? WHERE id=?',
    [merged.title, merged.description, merged.priority, merged.due, merged.completed ? 1 : 0, merged.notified ? 1 : 0, id]);
  return merged;
}

export async function deleteTodo(id) {
  await getDb();
  const existing = await getTodoById(id);
  if (!existing) return false;
  run('DELETE FROM todos WHERE id = ?', [id]);
  return true;
}

export async function deleteCompletedTodos(userId) {
  await getDb();
  run('DELETE FROM todos WHERE userId = ? AND completed = 1', [userId]);
}

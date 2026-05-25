import { createClient } from '@libsql/client';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data.db');

const TURSO_URL = process.env.TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_TOKEN;

let db = null;
let isTurso = false;

async function getDb() {
  if (db) return db;

  if (TURSO_URL && TURSO_TOKEN) {
    // ── Turso (cloud SQLite) ──
    isTurso = true;
    db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
    await createTables();
    console.log('Database: Turso (cloud)');
    return db;
  }

  // ── Local SQLite (dev fallback) ──
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');
  createTablesLocal();
  saveLocal();
  console.log('Database: SQLite (local)');
  return db;
}

// ── Turso table creation ──
async function createTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);
  await db.execute(`
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
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_todos_userId ON todos(userId)`);
}

// ── Local table creation ──
function createTablesLocal() {
  db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, createdAt TEXT NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS todos (id TEXT PRIMARY KEY, userId TEXT NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '', priority TEXT DEFAULT 'medium', due TEXT, completed INTEGER DEFAULT 0, notified INTEGER DEFAULT 0, createdAt TEXT NOT NULL, FOREIGN KEY (userId) REFERENCES users(id))`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_todos_userId ON todos(userId)`);
}

function saveLocal() {
  if (isTurso || !db) return;
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function boolToNum(v) { return v ? 1 : 0; }

function fixBooleans(obj) {
  if (!obj) return obj;
  obj.completed = !!obj.completed;
  obj.notified = !!obj.notified;
  return obj;
}

// ── Users ──
export async function findUserByUsername(username) {
  await getDb();
  if (isTurso) {
    const r = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] });
    return r.rows.length > 0 ? fixBooleans(r.rows[0]) : null;
  }
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  stmt.bind([username]);
  if (stmt.step()) {
    const obj = stmt.getAsObject();
    stmt.free();
    return fixBooleans(obj);
  }
  stmt.free();
  return null;
}

export async function findUserById(id) {
  await getDb();
  if (isTurso) {
    const r = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
    return r.rows.length > 0 ? fixBooleans(r.rows[0]) : null;
  }
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const obj = stmt.getAsObject();
    stmt.free();
    return fixBooleans(obj);
  }
  stmt.free();
  return null;
}

export async function createUser(user) {
  await getDb();
  if (isTurso) {
    await db.execute({ sql: 'INSERT INTO users (id, username, password, createdAt) VALUES (?, ?, ?, ?)', args: [user.id, user.username, user.password, user.createdAt] });
  } else {
    db.run('INSERT INTO users (id, username, password, createdAt) VALUES (?, ?, ?, ?)', [user.id, user.username, user.password, user.createdAt]);
    saveLocal();
  }
  return user;
}

// ── Todos ──
export async function getTodosByUser(userId) {
  await getDb();
  if (isTurso) {
    const r = await db.execute({ sql: 'SELECT * FROM todos WHERE userId = ? ORDER BY createdAt DESC', args: [userId] });
    return r.rows.map(fixBooleans);
  }
  const stmt = db.prepare('SELECT * FROM todos WHERE userId = ? ORDER BY createdAt DESC');
  stmt.bind([userId]);
  const rows = [];
  while (stmt.step()) rows.push(fixBooleans(stmt.getAsObject()));
  stmt.free();
  return rows;
}

export async function getTodoById(id) {
  await getDb();
  if (isTurso) {
    const r = await db.execute({ sql: 'SELECT * FROM todos WHERE id = ?', args: [id] });
    return r.rows.length > 0 ? fixBooleans(r.rows[0]) : null;
  }
  const stmt = db.prepare('SELECT * FROM todos WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const obj = stmt.getAsObject();
    stmt.free();
    return fixBooleans(obj);
  }
  stmt.free();
  return null;
}

export async function createTodo(todo) {
  await getDb();
  if (isTurso) {
    await db.execute({ sql: 'INSERT INTO todos (id, userId, title, description, priority, due, completed, notified, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [todo.id, todo.userId, todo.title, todo.description, todo.priority, todo.due, boolToNum(todo.completed), boolToNum(todo.notified), todo.createdAt] });
  } else {
    db.run('INSERT INTO todos (id, userId, title, description, priority, due, completed, notified, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [todo.id, todo.userId, todo.title, todo.description, todo.priority, todo.due, boolToNum(todo.completed), boolToNum(todo.notified), todo.createdAt]);
    saveLocal();
  }
  return todo;
}

export async function updateTodo(id, updates) {
  await getDb();
  const existing = await getTodoById(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates };
  if (isTurso) {
    await db.execute({ sql: 'UPDATE todos SET title=?, description=?, priority=?, due=?, completed=?, notified=? WHERE id=?',
      args: [merged.title, merged.description, merged.priority, merged.due, boolToNum(merged.completed), boolToNum(merged.notified), id] });
  } else {
    db.run('UPDATE todos SET title=?, description=?, priority=?, due=?, completed=?, notified=? WHERE id=?',
      [merged.title, merged.description, merged.priority, merged.due, boolToNum(merged.completed), boolToNum(merged.notified), id]);
    saveLocal();
  }
  return merged;
}

export async function deleteTodo(id) {
  await getDb();
  const existing = await getTodoById(id);
  if (!existing) return false;
  if (isTurso) {
    await db.execute({ sql: 'DELETE FROM todos WHERE id = ?', args: [id] });
  } else {
    db.run('DELETE FROM todos WHERE id = ?', [id]);
    saveLocal();
  }
  return true;
}

export async function deleteCompletedTodos(userId) {
  await getDb();
  if (isTurso) {
    await db.execute({ sql: 'DELETE FROM todos WHERE userId = ? AND completed = 1', args: [userId] });
  } else {
    db.run('DELETE FROM todos WHERE userId = ? AND completed = 1', [userId]);
    saveLocal();
  }
}

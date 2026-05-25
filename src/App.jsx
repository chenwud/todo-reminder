import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { todos } from "./api";
import LoginPage from "./LoginPage";
import "./App.css";

const PRIORITY_LABELS = { high: "\uD83D\uDD34 高", medium: "\uD83D\uDFE1 中", low: "\uD83D\uDFE2 低" };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isOverdue(due) {
  if (!due) return false;
  return new Date(due) < new Date();
}

function isDueSoon(due) {
  if (!due) return false;
  const diff = new Date(due) - new Date();
  return diff > 0 && diff < 3600000;
}

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created");
  const [editingId, setEditingId] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", due: "" });
  const inputRef = useRef(null);

  // 登录后加载数据
  useEffect(() => {
    if (!user) return;
    todos.getAll()
      .then(setItems)
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [user]);

  // 提醒检查
  useEffect(() => {
    if (!user || !("Notification" in window) || Notification.permission === "denied") return;
    const interval = setInterval(() => {
      const now = Date.now();
      setItems((prev) => {
        let changed = false;
        const next = prev.map((t) => {
          if (t.completed || !t.due || t.notified) return t;
          const ms = new Date(t.due) - now;
          if (ms <= 0 && ms > -60000) {
            new Notification("\u23F0 待办提醒", { body: `"${t.title}" 已到期！`, icon: "/favicon.svg" });
            todos.update(t.id, { notified: true }).catch(() => {});
            changed = true;
            return { ...t, notified: true };
          }
          return t;
        });
        return changed ? next : prev;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const resetForm = useCallback(() => {
    setForm({ title: "", description: "", priority: "medium", due: "" });
    setEditingId(null);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;

    if (editingId) {
      // 更新：等待后端返回
      const body = { title, description: form.description.trim(), priority: form.priority, due: form.due || null };
      const updated = await todos.update(editingId, { ...body, notified: false });
      setItems((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
    } else {
      // 创建：乐观更新
      const body = { title, description: form.description.trim(), priority: form.priority, due: form.due || null };
      const optimisticId = "optimistic-" + Date.now();
      const optimistic = { id: optimisticId, userId: user.id, completed: false, notified: false, createdAt: new Date().toISOString(), ...body };
      setItems((prev) => [optimistic, ...prev]);
      resetForm();
      inputRef.current?.focus();

      try {
        const created = await todos.create(body);
        setItems((prev) => prev.map((t) => (t.id === optimisticId ? created : t)));
      } catch {
        setItems((prev) => prev.filter((t) => t.id !== optimisticId));
      }
    }
    if (editingId) resetForm();
  };

  const toggleComplete = async (id) => {
    // 乐观切换
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    try {
      await todos.toggle(id);
    } catch {
      // 回滚
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    }
  };

  const deleteTodo = async (id) => {
    const prev = items;
    setItems((p) => p.filter((t) => t.id !== id));
    if (editingId === id) resetForm();
    try {
      await todos.remove(id);
    } catch {
      setItems(prev);
    }
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setForm({ title: todo.title, description: todo.description || "", priority: todo.priority, due: todo.due || "" });
    inputRef.current?.focus();
  };

  const clearCompleted = async () => {
    if (!window.confirm("确定清除所有已完成任务？")) return;
    const prev = items;
    setItems((p) => p.filter((t) => !t.completed));
    try {
      await todos.clearCompleted();
    } catch {
      setItems(prev);
    }
  };

  if (authLoading) return <div className="app"><div className="empty-state">⏳ 加载中…</div></div>;
  if (!user) return <LoginPage />;

  let filtered = items;
  if (filter === "active") filtered = filtered.filter((t) => !t.completed);
  else if (filter === "completed") filtered = filtered.filter((t) => t.completed);

  if (sortBy === "priority") {
    filtered = [...filtered].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  } else if (sortBy === "due") {
    filtered = [...filtered].sort((a, b) => {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(a.due) - new Date(b.due);
    });
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <div>
            <h1>📋 待办提醒</h1>
            <p className="subtitle">{items.filter((t) => !t.completed).length} 项待完成</p>
          </div>
          <div className="header-user">
            <span className="username">👤 {user.username}</span>
            <button className="btn btn-ghost btn-sm" onClick={logout}>退出</button>
          </div>
        </div>
      </header>

      <form className="todo-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input ref={inputRef} className="form-input" type="text" placeholder="添加新的待办…" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="high">🔴 高</option>
            <option value="medium">🟡 中</option>
            <option value="low">🟢 低</option>
          </select>
          <input className="form-date" type="datetime-local" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
          <button className="btn btn-primary" type="submit">{editingId ? "更新" : "添加"}</button>
          {editingId && <button className="btn btn-ghost" type="button" onClick={resetForm}>取消</button>}
        </div>
        <textarea className="form-textarea" placeholder="备注（可选）" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </form>

      <div className="toolbar">
        <div className="filter-group">
          {["all", "active", "completed"].map((f) => (
            <button key={f} className={`btn btn-filter ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {{ all: "全部", active: "进行中", completed: "已完成" }[f]}
            </button>
          ))}
        </div>
        <select className="form-select sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="created">按创建时间</option>
          <option value="priority">按优先级</option>
          <option value="due">按截止时间</option>
        </select>
      </div>

      <div className="todo-list">
        {dataLoading && <div className="empty-state">⏳ 加载中…</div>}
        {!dataLoading && filtered.length === 0 && <div className="empty-state">🎉 {filter === "all" ? "还没有待办事项，添加一个吧！" : filter === "active" ? "所有任务都已完成！" : "还没有已完成的任务"}</div>}
        {filtered.map((todo) => (
          <div key={todo.id} className={`todo-item ${todo.completed ? "completed" : ""} ${isOverdue(todo.due) && !todo.completed ? "overdue" : ""} ${isDueSoon(todo.due) && !todo.completed ? "due-soon" : ""}`}>
            <button className={`btn-check ${todo.completed ? "checked" : ""}`} onClick={() => toggleComplete(todo.id)} title={todo.completed ? "标记未完成" : "标记完成"}>
              {todo.completed ? "✅" : "⬜"}
            </button>
            <div className="todo-body">
              <div className="todo-title-row">
                <span className="todo-title">{todo.title}</span>
                <span className="todo-priority">{PRIORITY_LABELS[todo.priority]}</span>
              </div>
              {todo.description && <p className="todo-desc">{todo.description}</p>}
              <div className="todo-meta">
                {todo.due && (
                  <span className={`todo-due ${isOverdue(todo.due) && !todo.completed ? "text-danger" : isDueSoon(todo.due) && !todo.completed ? "text-warning" : ""}`}>
                    📅 {fmtDate(todo.due)}
                    {isOverdue(todo.due) && !todo.completed && " ⚠️ 已过期"}
                    {isDueSoon(todo.due) && !todo.completed && " ⏰ 即将到期"}
                  </span>
                )}
                <span className="todo-created">创建于 {fmtDate(todo.createdAt)}</span>
              </div>
            </div>
            <div className="todo-actions">
              <button className="btn btn-sm" onClick={() => startEdit(todo)} title="编辑">✏️</button>
              <button className="btn btn-sm btn-danger" onClick={() => deleteTodo(todo.id)} title="删除">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <footer className="app-footer">
          <button className="btn btn-danger-outline" onClick={clearCompleted}>清除已完成</button>
        </footer>
      )}
    </div>
  );
}

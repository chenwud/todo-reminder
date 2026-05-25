const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

// Auth
export const auth = {
  register: (username, password) =>
    api('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login: (username, password) =>
    api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => api('/auth/me'),
};

// Todos
export const todos = {
  getAll: () => api('/todos'),
  create: (body) => api('/todos', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/todos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggle: (id) => api(`/todos/${id}/toggle`, { method: 'PATCH' }),
  remove: (id) => api(`/todos/${id}`, { method: 'DELETE' }),
  clearCompleted: () => api('/todos/completed/bulk', { method: 'DELETE' }),
};

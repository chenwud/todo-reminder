import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('请填写用户名和密码');
      return;
    }
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(username.trim(), password);
      } else {
        if (password.length < 4) {
          setError('密码至少4位');
          setSubmitting(false);
          return;
        }
        await register(username.trim(), password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>📋 待办提醒</h1>
        <p className="auth-subtitle">{isLogin ? '登录你的账号' : '创建新账号'}</p>

        <form onSubmit={handleSubmit}>
          <input
            className="form-input auth-input"
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <input
            className="form-input auth-input"
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="auth-error">{error}</p>}
          <button className="btn btn-primary auth-btn" type="submit" disabled={submitting}>
            {submitting ? '处理中…' : isLogin ? '登录' : '注册'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? '还没有账号？' : '已有账号？'}
          <button className="btn-link" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? '立即注册' : '去登录'}
          </button>
        </p>
      </div>
    </div>
  );
}

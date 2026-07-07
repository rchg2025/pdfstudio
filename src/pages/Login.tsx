import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        throw new Error('Lỗi máy chủ (Server Error). Có thể chưa kết nối được CSDL trên Vercel.');
      }
      
      if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');
      
      login(data.token, data.user);
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', paddingTop: '3rem' }}>
      <div className="tool-header text-center" style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Đăng Nhập Hệ Thống</h1>
        <p className="text-secondary">Quản trị viên và người dùng vui lòng đăng nhập để tiếp tục.</p>
      </div>
      
      <div className="glass-card" style={{ padding: '2.5rem 2rem', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '0 auto' }}>
        {error && (
          <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Tên tài khoản (hoặc Email)</label>
            <input 
              type="text" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              required
              placeholder="VD: quantri"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Mật khẩu</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              required
              placeholder="Nhập mật khẩu..."
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem', fontSize: '1rem', display: 'flex', justifyContent: 'center' }}
          >
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

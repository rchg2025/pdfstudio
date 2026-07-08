import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useNotification } from '../contexts/NotificationContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // States cho Google OTP
  const [showGoogleOtp, setShowGoogleOtp] = useState(false);
  const [googleOtp, setGoogleOtp] = useState('');
  const [googleTempData, setGoogleTempData] = useState<any>(null);

  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const returnUrl = location.state?.returnUrl;

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
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Lỗi từ server:", text);
        throw new Error(`Lỗi máy chủ: API trả về lỗi không phải JSON. Nội dung: ${text.substring(0, 100)}...`);
      }
      
      if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');
      
      login(data.token, data.user);
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate(returnUrl || '/dashboard');
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
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', paddingRight: '3rem', borderRadius: '0.75rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                required
                placeholder="Nhập mật khẩu..."
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Quên mật khẩu?</Link>
            </div>
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

        <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ padding: '0 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>HOẶC</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                setLoading(true);
                const res = await fetch('/api/auth/google', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ credential: credentialResponse.credential })
                });
                const data = await res.json();
                
                if (res.status === 202 && data.requireOtp) {
                  setGoogleTempData(data.tempData);
                  setShowGoogleOtp(true);
                  showToast(data.message, 'success');
                  setLoading(false);
                  return;
                }

                if (!res.ok) throw new Error(data.message || 'Lỗi đăng nhập Google');
                
                login(data.token, data.user);
                navigate(data.user.role === 'ADMIN' ? '/admin' : (returnUrl || '/dashboard'));
              } catch (e: any) {
                setError(e.message);
              } finally {
                setLoading(false);
              }
            }}
            onError={() => setError('Đăng nhập Google thất bại.')}
            useOneTap
          />
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Chưa có tài khoản? </span>
          <Link to="/register" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Đăng ký ngay</Link>
        </div>

      </div>

      {showGoogleOtp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '400px', background: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)', textAlign: 'center' }}>Xác nhận OTP Google</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
              Vui lòng kiểm tra email Google của bạn và nhập mã OTP.
            </p>
            <input 
              type="text" 
              value={googleOtp}
              onChange={e => setGoogleOtp(e.target.value)}
              placeholder="Nhập 6 số mã OTP"
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', textAlign: 'center', fontSize: '1.25rem', letterSpacing: '4px', fontWeight: 'bold', marginBottom: '1.5rem' }}
              maxLength={6}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowGoogleOtp(false)} className="btn" style={{ flex: 1, background: 'transparent', color: 'var(--text-secondary)' }}>Hủy</button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                disabled={loading || !googleOtp}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch('/api/auth/google', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        action: 'VERIFY_OTP', 
                        otp: googleOtp,
                        email: googleTempData.email,
                        name: googleTempData.name,
                        googleId: googleTempData.googleId
                      })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      showToast(data.message, 'success');
                      login(data.token, data.user);
                      navigate(data.user.role === 'ADMIN' ? '/admin' : (returnUrl || '/dashboard'));
                    } else {
                      showToast(data.message || 'OTP không đúng', 'error');
                    }
                  } catch (e: any) {
                    showToast('Lỗi máy chủ', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

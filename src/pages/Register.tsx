import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { ArrowLeft, Mail } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function Register() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // States cho Google Registration & Activation
  const [showGoogleOtp, setShowGoogleOtp] = useState(false);
  const [googleOtp, setGoogleOtp] = useState('');
  const [googleTempData, setGoogleTempData] = useState<any>(null);
  const [resendingGoogleOtp, setResendingGoogleOtp] = useState(false);
  
  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND_OTP', email, name, password })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setStep(2);
      } else {
        showToast(data.message || 'Có lỗi xảy ra', 'error');
      }
    } catch {
      showToast('Không thể kết nối đến máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      showToast('Vui lòng nhập mã OTP', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY_OTP', email, name, password, otp })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Đăng ký và kích hoạt tài khoản thành công', 'success');
        login(data.token, data.user);
        navigate('/');
      } else {
        showToast(data.message || 'Mã OTP không đúng', 'error');
      }
    } catch {
      showToast('Không thể kết nối đến máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 2rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.875rem' }}>
            <ArrowLeft size={18} /> Quay lại đăng nhập
          </Link>
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center' }}>
          Đăng ký tài khoản
        </h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.75rem', fontSize: '0.875rem' }}>
          {step === 1 ? 'Tạo tài khoản mới tại RCHG Studio' : 'Vui lòng nhập mã OTP đã gửi đến email của bạn'}
        </p>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Họ và tên</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Mật khẩu</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mật khẩu của bạn"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  required 
                />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.25rem' }} disabled={loading}>
                {loading ? 'Đang gửi...' : 'Đăng ký bằng Email'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '0.25rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              <span style={{ padding: '0 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>HOẶC ĐĂNG KÝ BẰNG</span>
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

                    if (!res.ok) throw new Error(data.message || 'Lỗi đăng ký Google');
                    
                    login(data.token, data.user);
                    navigate('/');
                  } catch (e: any) {
                    showToast(e.message || 'Lỗi đăng ký Google', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => showToast('Đăng ký Google thất bại', 'error')}
                text="signup_with"
                shape="rectangular"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Mã xác nhận (OTP)</label>
              <input 
                type="text" 
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="Nhập 6 số mã OTP"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', textAlign: 'center', fontSize: '1.25rem', letterSpacing: '4px', fontWeight: 'bold' }}
                required
                maxLength={6}
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Đang xác nhận...' : 'Xác nhận và Hoàn tất'}
            </button>

            <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.875rem', marginTop: '1rem', fontWeight: 500 }}>
              Thay đổi thông tin
            </button>
          </form>
        )}
      </div>

      {/* Modal Kích Hoạt Tài Khoản Google Lần Đầu */}
      {showGoogleOtp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '440px', background: 'var(--bg-primary)', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <Mail size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
                Kích Hoạt Tài Khoản Google
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Bạn đang đăng ký bằng Google lần đầu tiên. Hệ thống đã gửi mã xác nhận kích hoạt đến email:
              </p>
              <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
                {googleTempData?.email}
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              💡 Bạn có thể nhập mã OTP 6 số bên dưới hoặc mở email và nhấn vào <strong>nút kích hoạt trực tiếp</strong>.
            </div>

            <input 
              type="text" 
              value={googleOtp}
              onChange={e => setGoogleOtp(e.target.value)}
              placeholder="Nhập 6 số mã OTP"
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.5rem', border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', textAlign: 'center', fontSize: '1.4rem', letterSpacing: '6px', fontWeight: 'bold', marginBottom: '0.75rem', outline: 'none' }}
              maxLength={6}
              autoFocus
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <button
                type="button"
                disabled={resendingGoogleOtp}
                onClick={async () => {
                  if (!googleTempData?.email) return;
                  setResendingGoogleOtp(true);
                  try {
                    const res = await fetch('/api/auth/google', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'RESEND_OTP', email: googleTempData.email })
                    });
                    const d = await res.json();
                    if (res.ok) {
                      showToast(d.message || 'Đã gửi lại mã kích hoạt!', 'success');
                    } else {
                      showToast(d.message || 'Không thể gửi lại mã', 'error');
                    }
                  } catch {
                    showToast('Lỗi kết nối máy chủ', 'error');
                  } finally {
                    setResendingGoogleOtp(false);
                  }
                }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.82rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                {resendingGoogleOtp ? 'Đang gửi lại...' : 'Chưa nhận được? Gửi lại mã'}
              </button>

              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Hiệu lực 15 phút</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button"
                onClick={() => { setShowGoogleOtp(false); setGoogleOtp(''); }} 
                className="btn btn-outline" 
                style={{ flex: 1 }}
              >
                Hủy
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ flex: 1.5 }}
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
                      showToast(data.message || 'Kích hoạt tài khoản thành công!', 'success');
                      login(data.token, data.user);
                      navigate('/');
                    } else {
                      showToast(data.message || 'Mã OTP không đúng hoặc đã hết hạn', 'error');
                    }
                  } catch {
                    showToast('Lỗi máy chủ', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Đang kích hoạt...' : 'Kích hoạt & Đăng nhập'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { ArrowLeft } from 'lucide-react';

export default function Register() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  
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
    } catch (err) {
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
        showToast('Đăng ký thành công', 'success');
        login(data.token, data.user);
        navigate('/');
      } else {
        showToast(data.message || 'Mã OTP không đúng', 'error');
      }
    } catch (err) {
      showToast('Không thể kết nối đến máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <ArrowLeft size={18} /> Quay lại
          </Link>
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center' }}>
          Đăng ký tài khoản
        </h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.875rem' }}>
          {step === 1 ? 'Tạo tài khoản mới tại RCHG Studio' : 'Vui lòng nhập mã OTP đã gửi đến email của bạn'}
        </p>

        {step === 1 && (
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
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Đang gửi...' : 'Đăng ký'}
            </button>
          </form>
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
    </div>
  );
}

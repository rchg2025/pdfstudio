import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Crown, 
  ShieldCheck, 
  Save, 
  Eye, 
  EyeOff, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import SubscriptionModal from '../components/SubscriptionModal';

export default function Profile() {
  const { user, token, refreshUser, isExpired, remainingDays } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setName(user.name || '');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast('Vui lòng đăng nhập lại.', 'warning');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        showToast('Mật khẩu mới phải có ít nhất 6 ký tự.', 'warning');
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp.', 'warning');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Cập nhật thông tin thành công!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await refreshUser();
      } else {
        showToast(data.message || 'Có lỗi xảy ra khi cập nhật thông tin.', 'error');
      }
    } catch (err: any) {
      showToast('Không thể kết nối đến máy chủ: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlanTitle = () => {
    if (user?.isLifetime) return 'Gói Thành Viên Trọn Đời (Lifetime)';
    if (user?.subscriptionPlan === 'TRIAL_30D') return 'Gói Dùng Thử Miễn Phí (30 Ngày)';
    if (user?.subscriptionPlan === 'PLAN_90D') return 'Gói Tiêu Chuẩn (90 Ngày)';
    if (user?.subscriptionPlan === 'PLAN_180D') return 'Gói Nâng Cao (180 Ngày)';
    if (user?.subscriptionPlan === 'PLAN_365D') return 'Gói Tiết Kiệm (365 Ngày)';
    return 'Gói Thành Viên Tiêu Chuẩn';
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Không giới hạn';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1rem 4rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header trang */}
      <div className="tool-header text-center" style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
          Hồ Sơ & Thông Tin Cá Nhân
        </h1>
        <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
          Xem gói cước, theo dõi thời hạn sử dụng và cập nhật thông tin tài khoản của bạn.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* CỘT 1: THẺ THÔNG TIN GÓI CƯỚC & THỜI HẠN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div 
            className="glass-card" 
            style={{ 
              padding: '1.75rem', 
              background: isExpired 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(245, 158, 11, 0.06) 100%)' 
                : 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: isExpired ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(37, 99, 235, 0.25)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '46px', 
                  height: '46px', 
                  borderRadius: '12px', 
                  background: isExpired ? '#fee2e2' : user?.isLifetime ? '#d1fae5' : '#dbeafe',
                  color: isExpired ? '#dc2626' : user?.isLifetime ? '#059669' : '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Crown size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Gói Cước Đang Dùng
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Mã người dùng: #{user?.id?.slice(-6).toUpperCase()}
                  </span>
                </div>
              </div>

              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                background: isExpired ? '#fef2f2' : '#ecfdf5',
                color: isExpired ? '#dc2626' : '#059669',
                border: isExpired ? '1px solid #fca5a5' : '1px solid #6ee7b7'
              }}>
                {isExpired ? 'Hết hạn' : 'Hoạt động'}
              </span>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem' }}>
                {getPlanTitle()}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ngày hết hạn:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {user?.isLifetime ? 'Vĩnh viễn (Không giới hạn)' : formatDate(user?.subscriptionExpiresAt)}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Thời gian còn lại:</span>
                  {user?.isLifetime ? (
                    <span style={{ color: '#059669', fontWeight: 700 }}>Trọn đời 👑</span>
                  ) : isExpired ? (
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>Đã hết hạn</span>
                  ) : (
                    <span style={{ color: '#2563eb', fontWeight: 700 }}>Còn {remainingDays} ngày</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Vai trò tài khoản:</span>
                  <span style={{ 
                    fontWeight: 600, 
                    color: user?.role === 'ADMIN' ? '#7c3aed' : 'var(--text-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {user?.role === 'ADMIN' ? <ShieldCheck size={15} /> : null}
                    {user?.role === 'ADMIN' ? 'Quản trị viên (ADMIN)' : 'Thành viên (USER)'}
                  </span>
                </div>
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => setIsSubModalOpen(true)}
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Sparkles size={16} />
              {isExpired ? 'Gia Hạn Tài Khoản Ngay' : 'Nâng Cấp / Gia Hạn Thêm Ngày'}
            </button>
          </div>

          {/* Hộp quyền lợi */}
          <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--bg-primary)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="var(--success)" /> Quyền Lợi Tài Khoản
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                <span>Toàn quyền sử dụng bộ 25+ tiện ích sư phạm & số hóa tài liệu.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                <span>Xử lý file PDF, Word, Ảnh không giới hạn dung lượng và số lần.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                <span>Tạo và chia sẻ bài thi trắc nghiệm trực tuyến có tính giờ & bảng điểm.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                <span>Nhúng trực tiếp vào hệ thống LMS, Canvas, Moodle của trường.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CỘT 2: FORM CẬP NHẬT THÔNG TIN CÁ NHÂN & MẬT KHẨU */}
        <div className="glass-card" style={{ padding: '2rem', background: 'var(--bg-primary)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Thông Tin Tài Khoản
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Email (Readonly) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Email đăng nhập
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled 
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-muted)',
                    cursor: 'not-allowed',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Email dùng làm tên tài khoản cố định và không thể đổi.
              </span>
            </div>

            {/* Họ và tên */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Họ và tên
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên hiển thị..."
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px dashed var(--border)', margin: '0.5rem 0' }}></div>

            {/* Đổi mật khẩu */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                Đổi Mật Khẩu
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                (Để trống các ô bên dưới nếu bạn không muốn đổi mật khẩu)
              </p>

              {/* Mật khẩu hiện tại */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Mật khẩu hiện tại
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại để xác thực..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Mật khẩu mới */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Mật khẩu mới
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Xác nhận mật khẩu mới
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSubmitting}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Save size={16} />
                {isSubmitting ? 'Đang lưu thay đổi...' : 'Lưu Thay Đổi Thông Tin'}
              </button>
            </div>
          </form>
        </div>

      </div>

      <SubscriptionModal 
        isOpen={isSubModalOpen} 
        onClose={() => setIsSubModalOpen(false)} 
      />
    </div>
  );
}

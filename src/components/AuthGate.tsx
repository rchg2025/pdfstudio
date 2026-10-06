import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Crown, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SubscriptionModal from './SubscriptionModal';

interface AuthGateProps {
  children: React.ReactNode;
  featureTitle: string;
  featureDescription?: string;
  returnUrl: string;
}

export default function AuthGate({
  children,
  featureTitle,
  featureDescription,
  returnUrl
}: AuthGateProps) {
  const { user, isExpired } = useAuth();
  const navigate = useNavigate();
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  // 1. Trường hợp chưa đăng nhập
  if (!user) {
    return (
      <div className="w-full min-h-[75vh] flex items-center justify-center p-4 animate-fade-in" style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '100%',
          maxWidth: '620px',
          margin: '0 auto',
          background: 'var(--bg-secondary)',
          border: '1.5px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 'var(--radius-xl)',
          padding: '3.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 12px 32px -4px rgba(37, 99, 235, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(79, 70, 229, 0.2))',
            color: 'var(--primary)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.25)'
          }}>
            <Lock size={36} />
          </div>
          <h2 style={{
            fontSize: '1.65rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.85rem'
          }}>
            Yêu Cầu Đăng Nhập
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            marginBottom: '2rem',
            maxWidth: '540px'
          }}>
            {featureDescription || (
              <>Tính năng <strong>{featureTitle}</strong> yêu cầu bạn đăng nhập tài khoản để sử dụng và lưu trữ dữ liệu an toàn.</>
            )}
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/login', { state: { returnUrl } })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.85rem 2.5rem',
                fontSize: '1rem',
                borderRadius: '50px'
              }}
            >
              <LogIn size={18} /> Đăng Nhập Ngay
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/')}
              style={{
                padding: '0.85rem 2rem',
                fontSize: '1rem',
                borderRadius: '50px'
              }}
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Trường hợp đã hết hạn sử dụng
  if (isExpired) {
    return (
      <div className="w-full min-h-[75vh] flex items-center justify-center p-4 animate-fade-in" style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '100%',
          maxWidth: '620px',
          margin: '0 auto',
          background: '#fef2f2',
          border: '1.5px solid #f87171',
          borderRadius: 'var(--radius-xl)',
          padding: '3.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 12px 32px -4px rgba(239, 68, 68, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            border: '1px solid #fca5a5',
            boxShadow: '0 8px 16px -4px rgba(239, 68, 68, 0.2)'
          }}>
            <Crown size={36} />
          </div>
          <h2 style={{
            fontSize: '1.65rem',
            fontWeight: 700,
            color: '#991b1b',
            marginBottom: '0.85rem'
          }}>
            Tài Khoản Đã Hết Hạn Sử Dụng
          </h2>
          <p style={{
            fontSize: '1rem',
            color: '#7f1d1d',
            lineHeight: 1.65,
            marginBottom: '2rem',
            maxWidth: '540px'
          }}>
            Thời hạn dùng thử miễn phí hoặc gói dịch vụ của bạn đã hết. Hãy gia hạn để tiếp tục sử dụng tính năng <strong>{featureTitle}</strong>.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsSubModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.85rem 2.5rem',
                fontSize: '1rem',
                borderRadius: '50px',
                background: '#dc2626'
              }}
            >
              <Crown size={18} /> Gia Hạn Ngay
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '0.85rem 2rem',
                fontSize: '1rem',
                borderRadius: '50px'
              }}
            >
              Xem Thông Tin Tài Khoản
            </button>
          </div>
        </div>

        <SubscriptionModal
          isOpen={isSubModalOpen}
          onClose={() => setIsSubModalOpen(false)}
          reason={`Tài khoản của bạn đã hết hạn dùng. Vui lòng gia hạn để tiếp tục sử dụng tính năng ${featureTitle}.`}
        />
      </div>
    );
  }

  // 3. Đã đăng nhập và còn hạn sử dụng
  return <>{children}</>;
}

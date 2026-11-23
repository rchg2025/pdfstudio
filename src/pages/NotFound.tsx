import { Link } from 'react-router-dom';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '65vh',
      padding: '2rem 1rem',
      textAlign: 'center'
    }}>
      <div style={{
        width: '84px',
        height: '84px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(249, 115, 22, 0.12) 100%)',
        color: '#ef4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        border: '1px solid rgba(239, 68, 68, 0.2)'
      }}>
        <FileQuestion size={44} />
      </div>

      <h1 style={{
        fontSize: 'clamp(1.8rem, 4vw, 2.75rem)',
        fontWeight: 800,
        margin: '0 0 0.5rem 0',
        color: 'var(--text-primary, #0f172a)',
        letterSpacing: '-0.02em'
      }}>
        404 - Không Tìm Thấy Trang
      </h1>

      <p style={{
        fontSize: '1rem',
        color: 'var(--text-secondary, #64748b)',
        maxWidth: '520px',
        lineHeight: 1.6,
        margin: '0 0 2rem 0'
      }}>
        Đường dẫn bạn vừa truy cập không tồn tại, đã được thay đổi hoặc công cụ này đã chuyển sang địa chỉ mới.
      </p>

      <div style={{
        display: 'flex',
        gap: '0.85rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <Link 
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.8rem 1.4rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
            transition: 'transform 0.15s ease'
          }}
        >
          <Home size={18} />
          Về Trang Chủ
        </Link>

        <button 
          type="button"
          onClick={() => window.history.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.8rem 1.25rem',
            borderRadius: '12px',
            background: 'var(--bg-surface, #ffffff)',
            color: 'var(--text-primary, #334155)',
            border: '1px solid var(--border, #cbd5e1)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} />
          Quay Lại Trang Trước
        </button>
      </div>
    </div>
  );
}

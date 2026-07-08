import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, Trash2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

export default function Dashboard() {
  const { user, token } = useAuth();
  const { showToast, showConfirm } = useNotification();
  const navigate = useNavigate();
  const [frames, setFrames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchFrames();
  }, [user]);

  const fetchFrames = async () => {
    try {
      const res = await fetch('/api/frames', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFrames(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteFrame = (id: string) => {
    showConfirm('Bạn có chắc chắn muốn xóa khung hình này? Khách hàng sẽ không thể truy cập vào link khung hình này nữa.', async () => {
      try {
        const res = await fetch(`/api/frames?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          fetchFrames();
          showToast('Xóa khung hình thành công', 'success');
        } else {
          const data = await res.json();
          showToast(data.message || 'Lỗi khi xóa khung hình', 'error');
        }
      } catch (e) {
        console.error(e);
        showToast('Lỗi khi xóa khung hình', 'error');
      }
    });
  };

  const getThumbnailUrl = (imageUrlStr: string) => {
    try {
      const parsed = JSON.parse(imageUrlStr);
      let url = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : imageUrlStr;
      if (url.includes('/uc?id=')) url = url.replace('/uc?id=', '/thumbnail?id=') + '&sz=w500';
      return url;
    } catch {
      let url = imageUrlStr;
      if (url.includes('/uc?id=')) url = url.replace('/uc?id=', '/thumbnail?id=') + '&sz=w500';
      return url;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center mt-12">
        <p className="text-secondary">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="tool-header text-center" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
          Quản Lý Khung Hình Của Tôi
        </h1>
        <p className="text-secondary">Chào mừng, {user?.name || user?.email}!</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate('/tao-khung')}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem' }}
        >
          <PlusCircle size={20} />
          <span>Tạo khung hình mới</span>
        </button>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        {frames.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <ImageIcon size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Chưa có khung hình nào</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Bạn chưa tạo sự kiện hoặc chiến dịch nào.</p>
            <button 
              onClick={() => navigate('/tao-khung')}
              className="btn btn-primary"
            >
              Tạo Khung Hình Đầu Tiên
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {frames.map((frame: any) => (
              <div key={frame.id} style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                
                {/* Ảnh cover (Vuông) */}
                <div style={{ width: '100%', aspectRatio: '1/1', background: '#f1f5f9', position: 'relative' }}>
                  <img src={getThumbnailUrl(frame.imageUrl)} alt={frame.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  
                  {/* Overlay hành động */}
                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => deleteFrame(frame.id)}
                      style={{ background: 'rgba(255,255,255,0.9)', color: '#ef4444', border: 'none', borderRadius: '0.5rem', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                      title="Xóa khung hình"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Thông tin */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {frame.title}
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                    <span style={{ background: 'var(--bg-primary)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)' }}>/f/{frame.slug}</span>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem' }}>
                    <Link 
                      to={`/f/${frame.slug}`} 
                      className="btn btn-primary"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                    >
                      <ExternalLink size={16} />
                      Mở trang sự kiện
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

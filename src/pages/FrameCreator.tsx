import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function FrameCreator() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [previewBase64, setPreviewBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center mt-12">
        <h2 className="text-xl font-medium text-gray-600">Vui lòng đăng nhập để tạo khung hình</h2>
        <button onClick={() => navigate('/login')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">Đăng nhập</button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'image/png') {
        setError('Định dạng bắt buộc là PNG.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('Dung lượng tối đa là 2MB.');
        return;
      }
      setError('');
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviewBase64(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !previewBase64) {
      setError('Vui lòng điền đủ thông tin và tải lên khung hình.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/frames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          slug,
          imageUrl: previewBase64
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi khi tạo khung hình');
      }

      navigate(`/f/${slug}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="tool-header text-center" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
          Tạo Mới Sự Kiện, Hoạt Động, Chiến Dịch
        </h1>
        <p className="text-secondary">Vui lòng tải lên khung hình dạng PNG và điền thông tin sự kiện.</p>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Thêm hình khung</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Định dạng bắt buộc hình khung là <strong>PNG</strong> và phải có <strong>vùng trong suốt</strong>.<br/>
              Kích thước đề xuất là hình vuông cạnh <strong>1080px</strong>.<br/>
              Dung lượng tối đa của hình khung là <strong>2MB</strong>.
            </p>

            <div style={{ 
              width: '100%', 
              aspectRatio: '1/1', 
              border: '2px dashed var(--border)', 
              borderRadius: '1rem', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: 'var(--bg-secondary)', 
              position: 'relative', 
              overflow: 'hidden' 
            }}>
              {previewBase64 ? (
                <img src={previewBase64} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <label className="btn btn-primary" style={{ display: 'inline-block', cursor: 'pointer', marginBottom: '1rem', padding: '0.75rem 1.5rem', borderRadius: '2rem' }}>
                    Thêm hình khung
                    <input type="file" accept="image/png" style={{ display: 'none' }} onChange={handleFileChange} />
                  </label>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>định dạng PNG, tối đa 2MB</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>kích thước cạnh 1080px.</p>
                </div>
              )}
              {previewBase64 && (
                <label style={{ 
                  position: 'absolute', bottom: '1rem', right: '1rem', 
                  background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(4px)', 
                  color: '#1e293b', padding: '0.5rem 1rem', borderRadius: '0.5rem', 
                  fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' 
                }}>
                  Đổi hình khác
                  <input type="file" accept="image/png" style={{ display: 'none' }} onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Thông tin chung</h2>
            
            {error && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Tiêu đề <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tối thiểu 10 ký tự"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Đường dẫn (URL) <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'flex', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <span style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                  {window.location.origin}/f/
                </span>
                <input 
                  type="text" 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="duong-dan"
                  style={{ flex: 1, padding: '0.75rem 1rem', border: 'none', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Đường dẫn để chia sẻ, độ dài tối đa 6 ký tự. (Chỉ cho phép chữ thường, số và dấu gạch ngang)</p>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button 
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', borderRadius: '0.75rem', display: 'flex', justifyContent: 'center' }}
              >
                {loading ? 'Đang xử lý...' : 'Tạo Khung Hình'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

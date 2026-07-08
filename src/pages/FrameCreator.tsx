import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function FrameCreator() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [previewBase64s, setPreviewBase64s] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center mt-12" style={{ padding: '4rem 1rem' }}>
        <h2 className="text-gradient" style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 600 }}>Vui lòng đăng nhập để tạo khung hình</h2>
        <button onClick={() => navigate('/login', { state: { returnUrl: '/tao-khung' } })} className="btn btn-primary">
          Đăng nhập
        </button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (previewBase64s.length + files.length > 10) {
      setError('Bạn chỉ có thể tải lên tối đa 10 khung hình.');
      return;
    }

    const validFiles = files.filter(f => f.type === 'image/png' && f.size <= 2 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      setError('Một số file bị bỏ qua vì không phải định dạng PNG hoặc vượt quá 2MB.');
    }

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviewBase64s(prev => {
          if (prev.length < 10) return [...prev, ev.target?.result as string];
          return prev;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setPreviewBase64s(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || previewBase64s.length === 0) {
      setError('Vui lòng điền tiêu đề và tải lên ít nhất một khung hình.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload images sequentially to avoid Vercel 4.5MB payload limit
      const uploadedUrls: string[] = [];
      const tempSlug = slug || Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6);

      for (let i = 0; i < previewBase64s.length; i++) {
        const base64 = previewBase64s[i];
        if (base64.startsWith('data:image')) {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              imageBase64: base64,
              filename: `${tempSlug}-${Date.now()}-${i}.png`
            })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Lỗi khi upload ảnh');
          uploadedUrls.push(data.url);
        } else {
          uploadedUrls.push(base64);
        }
      }

      // 2. Submit the frame data
      const res = await fetch('/api/frames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          slug: tempSlug,
          imageUrls: uploadedUrls
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi khi tạo khung hình');
      }

      navigate(`/f/${data.slug}`);
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
              {previewBase64s.map((src, idx) => (
                <div key={idx} style={{ 
                  position: 'relative', aspectRatio: '1/1', border: '1px solid var(--border)', 
                  borderRadius: '0.75rem', overflow: 'hidden', background: '#f8fafc' 
                }}>
                  <img src={src} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  <button type="button" onClick={() => removeImage(idx)} style={{ 
                    position: 'absolute', top: '0.25rem', right: '0.25rem', background: '#ef4444', 
                    color: 'white', border: 'none', borderRadius: '50%', width: '1.5rem', height: '1.5rem', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    fontSize: '0.75rem', fontWeight: 'bold'
                  }}>
                    ✕
                  </button>
                </div>
              ))}
              
              {previewBase64s.length < 10 && (
                <label style={{ 
                  aspectRatio: '1/1', border: '2px dashed var(--border)', borderRadius: '0.75rem', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-secondary)'
                }}>
                  <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>+</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Thêm khung</span>
                  <input type="file" multiple accept="image/png" style={{ display: 'none' }} onChange={handleFileChange} />
                </label>
              )}
            </div>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem', textAlign: 'right' }}>
              {previewBase64s.length}/10 khung hình
            </p>
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
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Đường dẫn (URL)</label>
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
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Đường dẫn để chia sẻ (Chỉ cho phép chữ thường, số và dấu gạch ngang). Nếu để trống, hệ thống sẽ tạo đường dẫn ngẫu nhiên.</p>
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

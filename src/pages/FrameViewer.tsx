import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ImageEditorCanvas from '../components/ImageEditorCanvas';
import QRCode from 'qrcode';

interface FrameData {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  views?: number;
  downloads?: number;
  user: {
    name: string;
  };
}

export default function FrameViewer() {
  const { slug } = useParams<{ slug: string }>();
  const [frame, setFrame] = useState<FrameData | null>(null);
  const [frameUrls, setFrameUrls] = useState<string[]>([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/frames/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setFrame(data);
          
          // Track view
          fetch('/api/frames/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: data.id, action: 'view' })
          }).catch(err => console.error('Error tracking view:', err));

          try {
            const parsed = JSON.parse(data.imageUrl);
            let urls = Array.isArray(parsed) ? parsed : [data.imageUrl];
            urls = urls.map((u: string) => {
              let directUrl = u.includes('/uc?id=') ? u.replace('/uc?id=', '/thumbnail?id=') + '&sz=w2000' : u;
              return `/api/utils/proxy-image?url=${encodeURIComponent(directUrl)}`;
            });
            setFrameUrls(urls);
          } catch (e) {
            let u = data.imageUrl;
            if (u.includes('/uc?id=')) u = u.replace('/uc?id=', '/thumbnail?id=') + '&sz=w2000';
            setFrameUrls([`/api/utils/proxy-image?url=${encodeURIComponent(u)}`]);
          }
          // Generate QR code
          QRCode.toDataURL(window.location.href, { width: 150 })
            .then(url => setQrCodeUrl(url))
            .catch(err => console.error(err));
        } else {
          setFrame(null);
        }
      })
      .catch(err => {
        console.error("Error fetching frame:", err);
        setFrame(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!frame) {
    return (
      <div className="container mx-auto p-8 text-center text-red-500">
        <h1 className="text-2xl font-bold">Khung hình không tồn tại hoặc đã bị xóa</h1>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!frame) return;
    fetch('/api/frames/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: frame.id, action: 'download' })
    }).catch(err => console.error('Error tracking download:', err));
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="tool-header text-center" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
          {frame.title}
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          <span title="Lượt xem">👁 {frame.views || 0}</span>
          <span title="Lượt tải">⬇ {frame.downloads || 0}</span>
        </div>
        <p className="text-secondary">Trình tạo ảnh sự kiện với khung hình được thiết kế sẵn</p>
      </div>

      <ImageEditorCanvas frameUrl={frameUrls[selectedFrameIndex] || ''} onDownload={handleDownload} />

      {frameUrls.length > 1 && (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Chọn khung hình khác</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            {frameUrls.map((url, idx) => (
              <button 
                key={idx} 
                onClick={() => setSelectedFrameIndex(idx)}
                style={{ 
                  width: '80px', height: '80px', borderRadius: '0.5rem', border: idx === selectedFrameIndex ? '3px solid var(--primary)' : '1px solid var(--border)',
                  overflow: 'hidden', padding: '4px', background: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <img src={url} alt={`Frame ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '3rem', maxWidth: '1000px', margin: '3rem auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8', fontWeight: 700, fontSize: '1.25rem' }}>
            {frame.user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--text-primary)' }}>{frame.user?.name || 'Admin'}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Tác giả khung hình</p>
          </div>
        </div>

        <div className="glass-card p-4 md:p-8" style={{ width: '100%', marginTop: '1rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'left' }}>Chia sẻ</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Nhấn để sao chép đường dẫn</p>
          
          <div style={{ display: 'flex', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-secondary)', width: '100%' }}>
            <input 
              type="text" 
              readOnly 
              value={window.location.href}
              style={{ flex: 1, minWidth: 0, padding: '0.75rem 1rem', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem' }}
            />
            <button 
              onClick={handleCopyLink}
              style={{ flexShrink: 0, padding: '0 1rem', borderLeft: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
            >
              {copied ? 'Đã chép' : 'Sao chép'}
            </button>
          </div>

          {qrCodeUrl && (
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Mã QR</span>
              <img src={qrCodeUrl} alt="QR Code" style={{ padding: '0.5rem', background: '#fff', borderRadius: '1rem', border: '1px solid var(--border)', width: '150px' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const QrLink = () => {
  const [url, setUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (url) {
      QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        .then(data => setQrCodeUrl(data))
        .catch(err => console.error(err));
    } else {
      setQrCodeUrl('');
    }
  }, [url]);

  return (
    <div className="animate-fade-in">
      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 className="text-gradient" style={{ marginBottom: '1rem' }}>Công cụ rút gọn link và tạo QR</h2>
        <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
          Nhập một đường dẫn URL để tự động tạo mã QR. (Tính năng rút gọn link đang được phát triển).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="url" 
            className="input" 
            placeholder="Nhập URL (VD: https://google.com)" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          
          {qrCodeUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <img src={qrCodeUrl} alt="Mã QR" style={{ borderRadius: '0.5rem', boxShadow: 'var(--shadow-md)' }} />
              <a 
                href={qrCodeUrl} 
                download="qrcode.png" 
                className="btn btn-primary"
              >
                Tải Xuống Mã QR
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrLink;

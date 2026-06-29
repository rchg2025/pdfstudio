import React, { useState } from 'react';
import { Link2, Copy, Download, Check, AlertCircle, Loader2, ArrowRight, Palette, Maximize } from 'lucide-react';
import './QrLink.css';

export default function QrLink() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Thêm state cho đuôi link tùy chỉnh
  const [customAlias, setCustomAlias] = useState('');

  // Thêm state cho màu sắc và khoảng trắng QR
  const [qrColor, setQrColor] = useState('#000000');
  const [qrMargin, setQrMargin] = useState(2);

  // Xử lý tự động chuẩn hóa đuôi link khi người dùng nhập
  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // 1. Chuyển tiếng Việt có dấu thành không dấu
    val = val.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    val = val.replace(/đ/g, 'd').replace(/Đ/g, 'D');
    
    // 2. Thay thế khoảng trắng và dấu gạch ngang bằng dấu gạch dưới (vì is.gd CHỈ hỗ trợ dấu gạch dưới _)
    val = val.replace(/[\s-]/g, '_');
    
    // 3. Xóa các ký tự đặc biệt không hợp lệ cho URL (chỉ giữ lại chữ cái, số và dấu gạch dưới)
    val = val.replace(/[^a-zA-Z0-9_]/g, '');
    
    // 4. Chuyển thành chữ thường để đường link trông đẹp và chuẩn hơn
    setCustomAlias(val.toLowerCase());
  };

  // Xử lý rút gọn link
  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShortenedUrl('');
    setIsCopied(false);

    let urlToProcess = originalUrl.trim();
    if (!urlToProcess) {
      setError('Vui lòng nhập một đường liên kết.');
      return;
    }

    // Tự động thêm https:// nếu người dùng quên
    if (!urlToProcess.startsWith('http://') && !urlToProcess.startsWith('https://')) {
      urlToProcess = 'https://' + urlToProcess;
    }

    // Kiểm tra tính hợp lệ của URL cơ bản
    try {
      new URL(urlToProcess);
    } catch (_) {
      setError('Đường liên kết không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }

    setIsLoading(true);

    try {
      // Xây dựng URL gọi API is.gd
      let apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(urlToProcess)}`;
      
      // Thêm custom alias nếu người dùng có nhập
      if (customAlias.trim()) {
        apiUrl += `&shorturl=${encodeURIComponent(customAlias.trim())}`;
      }

      // Sử dụng CORS Proxy để tránh lỗi trình duyệt chặn Cross-Origin
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;

      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error('Lỗi kết nối đến máy chủ rút gọn.');
      }

      const data = await response.json();

      if (data.shorturl) {
        setShortenedUrl(data.shorturl);
      } else {
        // Dịch một số lỗi phổ biến từ API sang tiếng Việt
        let errorMsg = data.errormessage || 'Không thể rút gọn link này. Vui lòng thử link khác.';
        if (errorMsg.toLowerCase().includes('already taken') || errorMsg.toLowerCase().includes('already used')) {
          errorMsg = 'Đuôi link tùy chỉnh này đã có người sử dụng. Vui lòng chọn đuôi khác.';
        } else if (errorMsg.toLowerCase().includes('must be between')) {
          errorMsg = 'Đuôi link tùy chỉnh phải từ 5 đến 30 ký tự (chỉ gồm chữ, số, dấu gạch dưới).';
        } else if (errorMsg.toLowerCase().includes('invalid')) {
          errorMsg = 'Đuôi link có chứa ký tự không hợp lệ.';
        } else if (errorMsg.toLowerCase().includes('problem with the url')) {
          errorMsg = 'Đường liên kết không hợp lệ hoặc không tồn tại.';
        }
        setError(errorMsg);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi mạng. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý sao chép link
  const handleCopy = () => {
    if (shortenedUrl) {
      const textArea = document.createElement("textarea");
      textArea.value = shortenedUrl;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Không thể sao chép', err);
      }
      document.body.removeChild(textArea);
    }
  };

  // Xử lý tải mã QR
  const handleDownloadQR = async () => {
    if (!shortenedUrl) return;
    
    setIsDownloading(true);
    try {
      // Sử dụng QuickChart API để lấy ảnh QR kèm theo màu và khoảng trắng tùy chỉnh
      const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(shortenedUrl)}&size=500&margin=${qrMargin}&dark=${qrColor.replace('#', '')}`;
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-${Math.random().toString(36).substring(2, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Lỗi khi tải mã QR:", err);
      alert("Đã có lỗi xảy ra khi tải mã QR xuống.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="qr-link-container">
      <div className="qr-link-header">
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Rút Gọn Link & Tạo QR</h1>
        <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Biến các đường liên kết dài, phức tạp thành link ngắn gọn và mã QR dễ dàng chia sẻ.
        </p>
      </div>

      <div className="qr-card-wrapper">
        <div className="glass-card">
          <form onSubmit={handleShorten} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <div className="input-icon-left">
                <Link2 size={20} />
              </div>
              <input
                type="text"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="Dán liên kết dài của bạn vào đây..."
                className="qr-input"
              />
            </div>

            <div className="input-group">
              <div className="input-prefix">
                is.gd/
              </div>
              <input
                type="text"
                value={customAlias}
                onChange={handleAliasChange}
                placeholder="Tùy chỉnh đuôi link (Ví dụ: ten_cua_ban)"
                className="qr-input qr-input-prefix"
              />
            </div>
            
            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !originalUrl.trim()}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Đang xử lý...
                </>
              ) : (
                <>
                  Rút Gọn Ngay
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {shortenedUrl && (
            <div className="result-section animate-fade-in">
              {/* Result Text & Copy */}
              <div className="result-link-box">
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Link đã rút gọn</h3>
                <div className="link-display">
                  <input readOnly value={shortenedUrl} />
                  <button
                    onClick={handleCopy}
                    className={`copy-btn ${isCopied ? 'copied' : ''}`}
                    title="Sao chép"
                  >
                    {isCopied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Bạn có thể sử dụng đường link ngắn này để chia sẻ bất cứ đâu.
                </p>
              </div>

              {/* QR Code */}
              <div className="result-qr-box">
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mã QR</h3>
                
                <div className="qr-image-container">
                  <img 
                    src={`https://quickchart.io/qr?text=${encodeURIComponent(shortenedUrl)}&size=200&margin=${qrMargin}&dark=${qrColor.replace('#', '')}`} 
                    alt="QR Code" 
                  />
                </div>

                <div className="qr-customization">
                  <div className="qr-custom-row">
                    <label>
                      <Palette size={16} /> Màu sắc
                    </label>
                    <input 
                      type="color" 
                      value={qrColor} 
                      onChange={(e) => setQrColor(e.target.value)}
                      className="color-picker"
                      title="Chọn màu mã QR"
                    />
                  </div>
                  <div className="qr-custom-row">
                    <label>
                      <Maximize size={16} /> Viền trắng
                    </label>
                    <input 
                      type="range" 
                      min="0" max="10" 
                      value={qrMargin} 
                      onChange={(e) => setQrMargin(Number(e.target.value))}
                      className="margin-slider"
                      title="Chỉnh độ rộng viền trắng"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleDownloadQR}
                  disabled={isDownloading}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  {isDownloading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Download size={18} />
                  )}
                  Tải ảnh QR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

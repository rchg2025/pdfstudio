import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Link,
  Wifi,
  UserCheck,
  Type,
  Mail,
  Phone,
  Palette,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Sliders
} from 'lucide-react';
import './CustomQrGenerator.css';

type QrType = 'link' | 'wifi' | 'vcard' | 'text' | 'email' | 'phone';
type DotStyle = 'square' | 'rounded' | 'dots';

export default function CustomQrGenerator() {
  // Loại QR đang chọn
  const [activeType, setActiveType] = useState<QrType>('link');

  // Input states theo từng loại
  const [urlInput, setUrlInput] = useState('https://tienich.ite.id.vn');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [wifiType, setWifiType] = useState('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);

  // vCard Contact
  const [vcardName, setVcardName] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');
  const [vcardOrg, setVcardOrg] = useState('');
  const [vcardTitle, setVcardTitle] = useState('');

  // Text
  const [textInput, setTextInput] = useState('');

  // Email
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Phone
  const [phoneNumber, setPhoneNumber] = useState('');

  // Customization Options
  const [dotStyle, setDotStyle] = useState<DotStyle>('rounded');
  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isGradient, setIsGradient] = useState(false);
  const [gradientColor, setGradientColor] = useState('#2563eb');
  const [gradientDirection, setGradientDirection] = useState<'vertical' | 'horizontal' | 'diagonal'>('diagonal');
  const [margin, setMargin] = useState(2);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');

  // Logo in Center
  const [selectedLogoPreset, setSelectedLogoPreset] = useState<string>('none');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);

  // Status
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sinh chuỗi dữ liệu thô tương ứng với từng kiểu QR
  const getRawQrValue = (): string => {
    switch (activeType) {
      case 'link': {
        let u = urlInput.trim();
        if (!u) return 'https://tienich.ite.id.vn';
        if (!u.startsWith('http://') && !u.startsWith('https://')) {
          u = 'https://' + u;
        }
        return u;
      }
      case 'wifi': {
        if (!wifiSsid) return 'WIFI:S:MyWiFi;T:WPA;P:12345678;;';
        const h = wifiHidden ? 'H:true;' : '';
        return `WIFI:S:${wifiSsid};T:${wifiType};P:${wifiPass};${h};`;
      }
      case 'vcard': {
        return `BEGIN:VCARD\nVERSION:3.0\nN:${vcardName || 'Nguyen Van A'}\nFN:${vcardName || 'Nguyen Van A'}\nORG:${vcardOrg || ''}\nTITLE:${vcardTitle || ''}\nTEL:${vcardPhone || ''}\nEMAIL:${vcardEmail || ''}\nEND:VCARD`;
      }
      case 'text':
        return textInput.trim() || 'Xin chào từ TienIch.ite.id.vn';
      case 'email': {
        if (!emailTo) return 'mailto:lienhe@ite.id.vn';
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      }
      case 'phone': {
        return phoneNumber.trim() ? `tel:${phoneNumber.trim()}` : 'tel:0988888888';
      }
      default:
        return 'https://tienich.ite.id.vn';
    }
  };

  // Logo preset SVG / Data URI
  const getLogoImageSource = (): string | null => {
    if (customLogoUrl) return customLogoUrl;
    if (selectedLogoPreset === 'qr') {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%232563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="1.5" fill="%232563eb"/><circle cx="15" cy="9" r="1.5" fill="%232563eb"/><path d="M8 15h8"/></svg>`;
    }
    if (selectedLogoPreset === 'shield') {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="%232563eb" stroke="%23ffffff" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    }
    if (selectedLogoPreset === 'heart') {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="%23ef4444" stroke="%23ffffff" stroke-width="1.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
    }
    return null;
  };

  // Render QR Canvas với Gradient, Bo góc điểm chấm (Rounded/Dots) và Logo trung tâm
  const renderQrCode = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rawValue = getRawQrValue();
    const qrData = QRCode.create(rawValue, {
      errorCorrectionLevel: errorCorrectionLevel,
    });

    const modules = qrData.modules;
    const moduleCount = modules.size;
    const canvasSize = 1000; // Độ phân giải siêu cao 1000px
    const m = margin;
    const totalCells = moduleCount + m * 2;
    const cellSize = canvasSize / totalCells;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Vẽ nền (Background)
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // 2. Tạo Gradient hoặc Solid Fill
    let fillStyle: string | CanvasGradient = fgColor;
    if (isGradient) {
      let grad: CanvasGradient;
      if (gradientDirection === 'vertical') {
        grad = ctx.createLinearGradient(0, 0, 0, canvasSize);
      } else if (gradientDirection === 'horizontal') {
        grad = ctx.createLinearGradient(0, 0, canvasSize, 0);
      } else {
        grad = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
      }
      grad.addColorStop(0, fgColor);
      grad.addColorStop(1, gradientColor);
      fillStyle = grad;
    }
    ctx.fillStyle = fillStyle;

    // Helper: kiểm tra xem điểm tọa độ (r, c) có thuộc 3 góc định vị (Finder Patterns) không
    const isFinderPattern = (r: number, c: number): boolean => {
      // Top-left
      if (r < 7 && c < 7) return true;
      // Top-right
      if (r < 7 && c >= moduleCount - 7) return true;
      // Bottom-left
      if (r >= moduleCount - 7 && c < 7) return true;
      return false;
    };

    // 3. Vẽ các modules (Data & Finder)
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (modules.get(r, c)) {
          const x = (c + m) * cellSize;
          const y = (r + m) * cellSize;

          if (isFinderPattern(r, c)) {
            // Mắt định vị: Vẽ khối vuông góc bo nhẹ tự nhiên
            const cornerRadius = cellSize * 0.25;
            ctx.beginPath();
            ctx.roundRect(x, y, cellSize, cellSize, cornerRadius);
            ctx.fill();
          } else {
            // Dữ liệu bên trong
            if (dotStyle === 'dots') {
              ctx.beginPath();
              ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.42, 0, Math.PI * 2);
              ctx.fill();
            } else if (dotStyle === 'rounded') {
              ctx.beginPath();
              ctx.roundRect(x, y, cellSize, cellSize, cellSize * 0.35);
              ctx.fill();
            } else {
              // Square chuẩn
              ctx.fillRect(x, y, cellSize, cellSize);
            }
          }
        }
      }
    }

    // 4. Nếu có Logo ở giữa: Vẽ đệm nền trắng bo tròn và nhúng Logo
    const logoSrc = getLogoImageSource();
    if (logoSrc) {
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          logoImg.src = logoSrc;
        });

        const logoSize = canvasSize * 0.22; // 22% diện tích QR
        const logoX = (canvasSize - logoSize) / 2;
        const logoY = (canvasSize - logoSize) / 2;

        // Vẽ vòng bo nền trắng viền cho logo
        const badgePadding = 12;
        const badgeSize = logoSize + badgePadding * 2;
        const badgeX = (canvasSize - badgeSize) / 2;
        const badgeY = (canvasSize - badgeSize) / 2;

        ctx.save();
        ctx.fillStyle = bgColor;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 18);
        ctx.fill();
        ctx.restore();

        // Vẽ viền ngoài nhẹ cho logo badge
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 18);
        ctx.stroke();

        // Vẽ ảnh logo
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      } catch (err) {
        console.warn('Không tải được logo:', err);
      }
    }
  };

  useEffect(() => {
    renderQrCode();
  }, [
    activeType,
    urlInput,
    wifiSsid,
    wifiPass,
    wifiType,
    wifiHidden,
    vcardName,
    vcardPhone,
    vcardEmail,
    vcardOrg,
    vcardTitle,
    textInput,
    emailTo,
    emailSubject,
    emailBody,
    phoneNumber,
    dotStyle,
    fgColor,
    bgColor,
    isGradient,
    gradientColor,
    gradientDirection,
    margin,
    errorCorrectionLevel,
    selectedLogoPreset,
    customLogoUrl
  ]);

  // Upload logo từ máy tính
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCustomLogoUrl(ev.target.result as string);
          setSelectedLogoPreset('custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Tải ảnh PNG / SVG
  const handleDownload = (format: 'png' | 'svg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDownloading(true);
    try {
      const link = document.createElement('a');
      link.download = `qrcode-${activeType}-${Date.now()}.${format}`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Sao chép ảnh QR vào Clipboard
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        } else {
          alert('Trình duyệt không hỗ trợ sao chép hình ảnh trực tiếp. Vui lòng nhấn Tải Ảnh.');
        }
      });
    } catch (err) {
      console.error(err);
      alert('Không thể sao chép hình ảnh vào khay nhớ tạm.');
    }
  };

  return (
    <div className="custom-qr-container">
      {/* Header */}
      <div className="custom-qr-header">
        <div className="custom-qr-badge">
          <Sparkles size={14} /> Tiện Ích Đồ Họa Miễn Phí
        </div>
        <h1 className="text-gradient">Tạo Mã QR Nâng Cao & Thiết Kế Đa Năng</h1>
        <p>
          Tạo mã QR Wi-Fi, Danh bạ (vCard), Đường dẫn website, Văn bản với tùy chọn đổi màu gradient,
          bo góc mắt nghệ thuật và chèn logo thương hiệu ở giữa hoàn toàn miễn phí.
        </p>
      </div>

      <div className="qr-workspace">
        {/* Bảng điều khiển cấu hình (Left) */}
        <div className="qr-config-panel">
          {/* Tabs chọn loại QR */}
          <div>
            <div className="qr-input-label" style={{ marginBottom: '0.5rem' }}>
              <span>Loại dữ liệu mã QR:</span>
            </div>
            <div className="qr-type-tabs">
              <button
                type="button"
                className={`qr-type-tab-btn ${activeType === 'link' ? 'active' : ''}`}
                onClick={() => setActiveType('link')}
              >
                <Link size={16} /> Link Web
              </button>
              <button
                type="button"
                className={`qr-type-tab-btn ${activeType === 'wifi' ? 'active' : ''}`}
                onClick={() => setActiveType('wifi')}
              >
                <Wifi size={16} /> Wi-Fi
              </button>
              <button
                type="button"
                className={`qr-type-tab-btn ${activeType === 'vcard' ? 'active' : ''}`}
                onClick={() => setActiveType('vcard')}
              >
                <UserCheck size={16} /> Danh Bạ
              </button>
              <button
                type="button"
                className={`qr-type-tab-btn ${activeType === 'text' ? 'active' : ''}`}
                onClick={() => setActiveType('text')}
              >
                <Type size={16} /> Văn Bản
              </button>
              <button
                type="button"
                className={`qr-type-tab-btn ${activeType === 'email' ? 'active' : ''}`}
                onClick={() => setActiveType('email')}
              >
                <Mail size={16} /> Email
              </button>
              <button
                type="button"
                className={`qr-type-tab-btn ${activeType === 'phone' ? 'active' : ''}`}
                onClick={() => setActiveType('phone')}
              >
                <Phone size={16} /> Điện Thoại
              </button>
            </div>
          </div>

          {/* Form theo Type */}
          <div className="qr-form-section">
            {activeType === 'link' && (
              <div>
                <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                  Địa chỉ liên kết (URL):
                </label>
                <input
                  type="url"
                  className="qr-input-field"
                  placeholder="https://example.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
            )}

            {activeType === 'wifi' && (
              <>
                <div>
                  <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                    Tên mạng Wi-Fi (SSID):
                  </label>
                  <input
                    type="text"
                    className="qr-input-field"
                    placeholder="VD: Quan_Cafe_Goc_Pho"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                  />
                </div>
                <div className="qr-input-row">
                  <div>
                    <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                      Mật khẩu:
                    </label>
                    <input
                      type="text"
                      className="qr-input-field"
                      placeholder="Nhập pass Wi-Fi..."
                      value={wifiPass}
                      onChange={(e) => setWifiPass(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                      Chuẩn mã hóa:
                    </label>
                    <select
                      className="qr-input-field"
                      value={wifiType}
                      onChange={(e) => setWifiType(e.target.value)}
                    >
                      <option value="WPA">WPA/WPA2/WPA3 (Chuẩn)</option>
                      <option value="WEP">WEP (Cũ)</option>
                      <option value="nopass">Không mật khẩu (Mở)</option>
                    </select>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={wifiHidden}
                    onChange={(e) => setWifiHidden(e.target.checked)}
                  />
                  Mạng Wi-Fi ẩn (Hidden SSID)
                </label>
              </>
            )}

            {activeType === 'vcard' && (
              <>
                <div className="qr-input-row">
                  <div>
                    <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                      Họ và Tên:
                    </label>
                    <input
                      type="text"
                      className="qr-input-field"
                      placeholder="Nguyễn Văn A"
                      value={vcardName}
                      onChange={(e) => setVcardName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                      Số điện thoại:
                    </label>
                    <input
                      type="tel"
                      className="qr-input-field"
                      placeholder="0912 345 678"
                      value={vcardPhone}
                      onChange={(e) => setVcardPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="qr-input-row">
                  <div>
                    <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                      Email liên hệ:
                    </label>
                    <input
                      type="email"
                      className="qr-input-field"
                      placeholder="nguyenvana@gmail.com"
                      value={vcardEmail}
                      onChange={(e) => setVcardEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="qr-input-row">
                  <div>
                    <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                      Công ty / Tổ chức:
                    </label>
                    <input
                      type="text"
                      className="qr-input-field"
                      placeholder="Công ty Cổ phần ABC"
                      value={vcardOrg}
                      onChange={(e) => setVcardOrg(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                      Chức vụ / Vị trí:
                    </label>
                    <input
                      type="text"
                      className="qr-input-field"
                      placeholder="Giám đốc kinh doanh"
                      value={vcardTitle}
                      onChange={(e) => setVcardTitle(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {activeType === 'text' && (
              <div>
                <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                  Nội dung đoạn văn:
                </label>
                <textarea
                  rows={4}
                  className="qr-input-field"
                  placeholder="Nhập nội dung văn bản, ghi chú, mã quà tặng..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>
            )}

            {activeType === 'email' && (
              <>
                <div className="qr-input-row">
                  <div>
                    <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                      Gửi tới Email:
                    </label>
                    <input
                      type="email"
                      className="qr-input-field"
                      placeholder="lienhe@doanhnghiep.vn"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                      Tiêu đề thư:
                    </label>
                    <input
                      type="text"
                      className="qr-input-field"
                      placeholder="Hỏi về dịch vụ..."
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                    Nội dung thư mẫu:
                  </label>
                  <textarea
                    rows={2}
                    className="qr-input-field"
                    placeholder="Xin chào, tôi muốn tìm hiểu thêm..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                  />
                </div>
              </>
            )}

            {activeType === 'phone' && (
              <div>
                <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                  Số điện thoại gọi nhanh:
                </label>
                <input
                  type="tel"
                  className="qr-input-field"
                  placeholder="VD: 0988888888 hoặc 19001000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Phần Tùy Biến Thiết Kế & Kiểu Dáng */}
          <div className="qr-design-section">
            <div className="qr-design-title">
              <Sliders size={18} className="text-primary" /> Kiểu dáng chấm mã QR
            </div>

            <div className="style-grid">
              <button
                type="button"
                className={`style-chip ${dotStyle === 'rounded' ? 'active' : ''}`}
                onClick={() => setDotStyle('rounded')}
              >
                Bo tròn mềm mại
              </button>
              <button
                type="button"
                className={`style-chip ${dotStyle === 'dots' ? 'active' : ''}`}
                onClick={() => setDotStyle('dots')}
              >
                Chấm bi (Dots)
              </button>
              <button
                type="button"
                className={`style-chip ${dotStyle === 'square' ? 'active' : ''}`}
                onClick={() => setDotStyle('square')}
              >
                Hình vuông cổ điển
              </button>
            </div>

            {/* Màu sắc & Gradient */}
            <div className="qr-design-title" style={{ marginTop: '0.5rem' }}>
              <Palette size={18} className="text-primary" /> Màu sắc & Hiệu ứng Gradient
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Bảng màu gợi ý:</span>
                <div className="color-presets-row">
                  {[
                    { color: '#0f172a', name: 'Đen than' },
                    { color: '#2563eb', name: 'Xanh dương' },
                    { color: '#059669', name: 'Xanh ngọc' },
                    { color: '#dc2626', name: 'Đỏ ruby' },
                    { color: '#7c3aed', name: 'Tím violet' },
                    { color: '#ea580c', name: 'Cam cháy' },
                  ].map((preset) => (
                    <div
                      key={preset.color}
                      className={`color-circle ${fgColor === preset.color && !isGradient ? 'active' : ''}`}
                      style={{ background: preset.color }}
                      title={preset.name}
                      onClick={() => {
                        setFgColor(preset.color);
                        setIsGradient(false);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="qr-input-row">
                <div className="custom-color-picker-wrap">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                  />
                  <span style={{ fontSize: '0.85rem' }}>Màu chính: {fgColor}</span>
                </div>
                <div className="custom-color-picker-wrap">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                  />
                  <span style={{ fontSize: '0.85rem' }}>Màu nền: {bgColor}</span>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  checked={isGradient}
                  onChange={(e) => setIsGradient(e.target.checked)}
                />
                Kích hoạt chuyển màu Gradient hai tông sắc
              </label>

              {isGradient && (
                <div className="qr-input-row animate-fade-in">
                  <div className="custom-color-picker-wrap">
                    <input
                      type="color"
                      value={gradientColor}
                      onChange={(e) => setGradientColor(e.target.value)}
                    />
                    <span style={{ fontSize: '0.85rem' }}>Màu thứ 2: {gradientColor}</span>
                  </div>
                  <div>
                    <select
                      className="qr-input-field"
                      value={gradientDirection}
                      onChange={(e) => setGradientDirection(e.target.value as any)}
                    >
                      <option value="diagonal">Đường chéo (Đẹp nhất)</option>
                      <option value="vertical">Dọc từ trên xuống</option>
                      <option value="horizontal">Ngang từ trái sang</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Chèn Logo / Biểu tượng trung tâm */}
            <div className="qr-design-title" style={{ marginTop: '0.5rem' }}>
              <ImageIcon size={18} className="text-primary" /> Chèn Logo vào giữa mã QR
            </div>

            <div className="logo-presets">
              <button
                type="button"
                className={`logo-btn ${selectedLogoPreset === 'none' && !customLogoUrl ? 'active' : ''}`}
                onClick={() => {
                  setSelectedLogoPreset('none');
                  setCustomLogoUrl(null);
                }}
              >
                Không có
              </button>
              <button
                type="button"
                className={`logo-btn ${selectedLogoPreset === 'qr' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedLogoPreset('qr');
                  setCustomLogoUrl(null);
                }}
              >
                <QrCode size={15} /> Icon QR
              </button>
              <button
                type="button"
                className={`logo-btn ${selectedLogoPreset === 'shield' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedLogoPreset('shield');
                  setCustomLogoUrl(null);
                }}
              >
                <ShieldCheck size={15} /> Khiên bảo mật
              </button>
              <button
                type="button"
                className={`logo-btn ${selectedLogoPreset === 'heart' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedLogoPreset('heart');
                  setCustomLogoUrl(null);
                }}
              >
                ❤️ Trái tim
              </button>
              <label className={`logo-btn ${customLogoUrl ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
                <ImageIcon size={15} />
                <span>{customLogoUrl ? 'Đã tải ảnh lên' : 'Tải logo của bạn...'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Tùy chỉnh nâng cao (Độ sửa lỗi & Viền) */}
            <div className="qr-input-row" style={{ marginTop: '0.5rem' }}>
              <div>
                <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                  Viền trắng xung quanh:
                </label>
                <select
                  className="qr-input-field"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                >
                  <option value={1}>Rất hẹp (1)</option>
                  <option value={2}>Tiêu chuẩn (2)</option>
                  <option value={3}>Rộng rãi (3)</option>
                  <option value={4}>Rất rộng (4)</option>
                </select>
              </div>
              <div>
                <label className="qr-input-label" style={{ marginBottom: '0.4rem' }}>
                  Mức độ chịu lỗi quét:
                </label>
                <select
                  className="qr-input-field"
                  value={errorCorrectionLevel}
                  onChange={(e) => setErrorCorrectionLevel(e.target.value as any)}
                >
                  <option value="H">Cực cao 30% (Khuyên dùng khi có logo)</option>
                  <option value="Q">Cao 25%</option>
                  <option value="M">Trung bình 15%</option>
                  <option value="L">Thấp 7%</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bảng xem trước trực quan (Right) */}
        <div className="qr-preview-panel">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
            Xem Trước Mã QR Thời Gian Thực
          </h2>

          <div className="qr-canvas-card">
            <canvas ref={canvasRef} />
          </div>

          <div className="qr-download-actions">
            <div className="qr-download-btn-group">
              <button
                type="button"
                onClick={() => handleDownload('png')}
                disabled={isDownloading}
                className="btn btn-primary"
                style={{ justifyContent: 'center' }}
              >
                <Download size={18} /> Tải Ảnh PNG HD
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                className="btn btn-secondary"
                style={{ justifyContent: 'center' }}
              >
                {isCopied ? <Check size={18} color="#059669" /> : <Copy size={18} />}
                {isCopied ? 'Đã chép!' : 'Chép Ảnh'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setUrlInput('https://tienich.ite.id.vn');
                setFgColor('#0f172a');
                setBgColor('#ffffff');
                setIsGradient(false);
                setDotStyle('rounded');
                setSelectedLogoPreset('none');
                setCustomLogoUrl(null);
                setMargin(2);
              }}
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
            >
              <RefreshCw size={15} /> Đặt lại mặc định
            </button>
          </div>

          <div className="qr-badge-info">
            <Sparkles size={14} className="text-primary" />
            <span>Mã QR tự động render với độ nét cao 1000x1000px chuẩn in ấn.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Download, 
  Upload,
  Code,
  Copy,
  Check
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './HotspotStudio.css';

export interface HotspotPin {
  id: string;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  title: string;
  description: string;
  badge?: string;
  link?: string;
}

export default function HotspotStudio() {
  const { showToast } = useNotification();

  // Mẫu ảnh giải phẫu / sơ đồ công nghệ mặc định
  const [imageUrl, setImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80'
  );

  const [pins, setPins] = useState<HotspotPin[]>([
    {
      id: 'pin-1',
      xPercent: 32,
      yPercent: 44,
      title: 'Mạch Vi Điều Khiển Trung Tâm',
      description: 'Chịu trách nhiệm nhận tín hiệu từ các cảm biến ngoại vi và xử lý thuật toán điều khiển.',
      badge: 'Phần cứng'
    },
    {
      id: 'pin-2',
      xPercent: 68,
      yPercent: 55,
      title: 'Khối Nguồn & Biến Áp',
      description: 'Chuyển đổi điện áp 220V AC sang 12V DC cấp nguồn an toàn cho toàn bộ hệ thống mạch.',
      badge: 'Điện năng'
    }
  ]);

  const [activePin, setActivePin] = useState<HotspotPin | null>(null);
  const [selectedPinForEdit, setSelectedPinForEdit] = useState<HotspotPin | null>(null);
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  // Xử lý click lên ảnh để cắm pin
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingPin || !imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const newPin: HotspotPin = {
      id: `pin-${Date.now()}`,
      xPercent: Math.round(x * 10) / 10,
      yPercent: Math.round(y * 10) / 10,
      title: `Điểm chú thích #${pins.length + 1}`,
      description: 'Nhập nội dung giải thích chi tiết cho điểm tương tác này...',
      badge: 'Khái niệm'
    };

    setPins(prev => [...prev, newPin]);
    setSelectedPinForEdit(newPin);
    setActivePin(newPin);
    setIsPlacingPin(false);
    showToast('Đã đánh dấu điểm tương tác mới!', 'success');
  };

  // Upload ảnh tùy chỉnh của giáo viên
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageUrl(event.target.result);
        setPins([]);
        setActivePin(null);
        setSelectedPinForEdit(null);
        showToast('Đã tải ảnh tài liệu lên thành công!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Cập nhật pin đang sửa
  const handleUpdatePin = (updated: HotspotPin) => {
    setPins(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPinForEdit(updated);
    if (activePin?.id === updated.id) {
      setActivePin(updated);
    }
  };

  // Xóa pin
  const handleDeletePin = (id: string) => {
    setPins(prev => prev.filter(p => p.id !== id));
    if (selectedPinForEdit?.id === id) setSelectedPinForEdit(null);
    if (activePin?.id === id) setActivePin(null);
    showToast('Đã xóa điểm tương tác.', 'info');
  };

  // Tạo mã HTML tương tác độc lập (Hiển thị thông tin rõ ràng, tối ưu 100% full màn hình)
  const generateStandaloneHtml = () => {
    const pinsJson = JSON.stringify(pins);
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hình Ảnh Chú Thích Tương Tác</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; margin: 0; }
    .wrapper { width: 100%; max-width: 1100px; background: #1e293b; border-radius: 14px; overflow: hidden; box-shadow: 0 20px 45px rgba(0,0,0,0.6); border: 1px solid #334155; position: relative; }
    .top-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: #0f172a; border-bottom: 1px solid #334155; font-size: 13.5px; }
    .top-bar h3 { font-size: 15px; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px; margin: 0; }
    .top-bar span { color: #94a3b8; font-size: 12.5px; }
    .img-box { position: relative; width: 100%; line-height: 0; user-select: none; background: #020617; }
    .img-box img { width: 100%; height: auto; display: block; object-fit: contain; max-height: 82vh; }
    
    /* Pin markers */
    .pin { position: absolute; width: 34px; height: 34px; border-radius: 50%; background: #ef4444; border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 700; font-size: 13.5px; transform: translate(-50%, -50%); cursor: pointer; animation: pulse 2.2s infinite; z-index: 20; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s; }
    .pin:hover, .pin.active { transform: translate(-50%, -50%) scale(1.22); background: #2563eb; z-index: 30; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 14px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
    
    /* Responsive Info Panel: Guaranteed unclipped, full-width or card display */
    .info-panel { display: none; position: absolute; bottom: 14px; left: 14px; right: 14px; background: rgba(15, 23, 42, 0.95); border: 1.5px solid #38bdf8; border-radius: 12px; padding: 16px 20px; color: #f8fafc; z-index: 99; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); box-shadow: 0 15px 35px rgba(0,0,0,0.7); animation: slideUp 0.25s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .info-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .badge { display: inline-block; background: #0284c7; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.5px; }
    .close-btn { background: #334155; border: none; color: #e2e8f0; width: 26px; height: 26px; border-radius: 50%; font-size: 14px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .close-btn:hover { background: #ef4444; color: #fff; }
    .title { font-size: 17px; font-weight: 700; color: #38bdf8; margin-bottom: 6px; line-height: 1.35; }
    .desc { font-size: 14px; color: #cbd5e1; line-height: 1.55; white-space: pre-line; }
    
    @media (min-width: 768px) {
      .info-panel { max-width: 480px; left: 20px; right: auto; bottom: 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="top-bar">
      <h3>📍 Hình Ảnh Chú Thích Tương Tác</h3>
      <span>Bấm vào các điểm số trên ảnh để xem chú thích</span>
    </div>
    <div class="img-box" id="img-box">
      <img src="${imageUrl}" alt="Interactive Material">
      <div id="pins-container"></div>
      
      <!-- Panel hiển thị chi tiết khi bấm vào pin -->
      <div id="info-panel" class="info-panel">
        <div class="info-header">
          <span id="pin-badge" class="badge"></span>
          <button class="close-btn" onclick="closePanel(event)">✕</button>
        </div>
        <div id="pin-title" class="title"></div>
        <div id="pin-desc" class="desc"></div>
      </div>
    </div>
  </div>

  <script>
    const PINS = ${pinsJson};
    const pinsContainer = document.getElementById('pins-container');
    const infoPanel = document.getElementById('info-panel');
    const pinBadge = document.getElementById('pin-badge');
    const pinTitle = document.getElementById('pin-title');
    const pinDesc = document.getElementById('pin-desc');

    function renderPins() {
      pinsContainer.innerHTML = '';
      PINS.forEach((p, idx) => {
        const pinEl = document.createElement('div');
        pinEl.className = 'pin';
        pinEl.id = 'pin-' + p.id;
        pinEl.style.left = p.xPercent + '%';
        pinEl.style.top = p.yPercent + '%';
        pinEl.innerText = idx + 1;
        pinEl.onclick = function(e) {
          e.stopPropagation();
          selectPin(p);
        };
        pinsContainer.appendChild(pinEl);
      });
    }

    function selectPin(p) {
      document.querySelectorAll('.pin').forEach(el => el.classList.remove('active'));
      const activeEl = document.getElementById('pin-' + p.id);
      if (activeEl) activeEl.classList.add('active');

      if (p.badge) {
        pinBadge.innerText = p.badge;
        pinBadge.style.display = 'inline-block';
      } else {
        pinBadge.style.display = 'none';
      }
      pinTitle.innerText = p.title || 'Điểm Chú Thích';
      pinDesc.innerText = p.description || 'Không có mô tả chi tiết.';
      infoPanel.style.display = 'block';
    }

    function closePanel(e) {
      if (e) e.stopPropagation();
      infoPanel.style.display = 'none';
      document.querySelectorAll('.pin').forEach(el => el.classList.remove('active'));
    }

    document.getElementById('img-box').addEventListener('click', function() {
      closePanel();
    });

    renderPins();
  </script>
</body>
</html>`;
  };

  // Xuất file HTML tương tác độc lập (Có thể tải lên LMS/Moodle)
  const handleExportHtml = () => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anh-tuong-tac-hotspot-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file HTML Hình Ảnh Tương Tác!', 'success');
  };

  // Tạo mã Iframe cho LMS
  const generateIframeCode = () => {
    const html = generateStandaloneHtml();
    const utf8Bytes = new TextEncoder().encode(html);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 = btoa(binary);

    return `<!-- MA NHUNG HINH ANH CHU THICH TUONG TAC HOTSPOT CHO LMS / E-LEARNING (CHUAN 16:9) -->
<div style="position:relative;width:100%;height:auto;aspect-ratio:16/9;padding-top:0;margin:15px auto;background:#0f172a;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.35);">
  <iframe 
    src="data:text/html;charset=utf-8;base64,${b64}" 
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;margin:0;padding:0;" 
    width="100%"
    height="100%"
    allow="fullscreen" 
    allowfullscreen="allowfullscreen">
  </iframe>
</div>
<!-- KET THUC MA NHUNG -->`;
  };

  const handleCopyIframe = async () => {
    try {
      await navigator.clipboard.writeText(generateIframeCode());
      setCopied(true);
      showToast('Đã sao chép mã nhúng Iframe!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Không thể sao chép tự động, vui lòng chọn và copy thủ công.', 'warning');
    }
  };

  return (
    <div className="hotspot-container animate-fade-in">
      <header className="hs-header">
        <div className="hs-title-group">
          <div className="hs-icon">
            <MapPin size={26} />
          </div>
          <div>
            <h1 className="hs-title">Hình Ảnh Chú Thích Tương Tác (Hotspot Studio)</h1>
            <p className="hs-subtitle">
              Biến sơ đồ, bản vẽ kỹ thuật, giải phẫu hay tranh minh họa thành hình ảnh có các điểm chạm (Pin) giải thích thông minh.
            </p>
          </div>
        </div>

        <div className="hs-header-actions">
          <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={15} /> Tải Ảnh Lên
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          </label>
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
            onClick={() => setShowExportModal(true)}
          >
            <Code size={15} /> Lấy Mã Nhúng Iframe
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={handleExportHtml}
            style={{ background: '#10b981', border: 'none' }}
          >
            <Download size={15} /> Tải Tệp HTML
          </button>
        </div>
      </header>

      <div className="hs-layout-grid">
        {/* Left: Interactive Canvas Screen */}
        <div className="hs-stage-panel">
          <div className="hs-bar">
            <span className="hs-hint">
              {isPlacingPin ? '🎯 Bấm chuột vào vị trí bất kỳ trên ảnh để cắm điểm' : '💡 Bấm nút "Cắm Điểm" bên phải để thêm điểm mới, hoặc bấm vào điểm số để xem nội dung'}
            </span>
          </div>

          <div 
            ref={imageContainerRef} 
            className={`hs-canvas-wrap ${isPlacingPin ? 'placing-cursor' : ''}`}
            onClick={handleImageClick}
          >
            <img src={imageUrl} alt="Document" className="hs-image" />

            {pins.map((pin, idx) => (
              <div 
                key={pin.id}
                className={`hs-pin-marker ${activePin?.id === pin.id ? 'active' : ''}`}
                style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePin(activePin?.id === pin.id ? null : pin);
                  setSelectedPinForEdit(pin);
                }}
                title={pin.title}
              >
                <span>{idx + 1}</span>
              </div>
            ))}

            {/* In-app Responsive Pin Detail Panel */}
            {activePin && (
              <div className="hs-detail-panel animate-scale-up" onClick={(e) => e.stopPropagation()}>
                <div className="hs-detail-header">
                  {activePin.badge && <span className="hs-badge">{activePin.badge}</span>}
                  <button 
                    type="button" 
                    className="hs-close-btn"
                    onClick={() => setActivePin(null)}
                  >
                    ✕
                  </button>
                </div>
                <h4 className="hs-bubble-title">{activePin.title}</h4>
                <p className="hs-bubble-desc">{activePin.description}</p>
                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.8rem', padding: '3px 8px' }}
                    onClick={() => setSelectedPinForEdit(activePin)}
                  >
                    Chỉnh Sửa Điểm Này
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Pin List & Details Editor */}
        <div className="hs-edit-panel">
          <div className="hs-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Các Điểm Chú Thích ({pins.length})</h3>
              <button 
                type="button" 
                className={`btn btn-sm ${isPlacingPin ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => setIsPlacingPin(!isPlacingPin)}
              >
                <Plus size={15} /> {isPlacingPin ? 'Hủy Cắm' : 'Cắm Điểm'}
              </button>
            </div>

            {selectedPinForEdit ? (
              <div className="pin-edit-form">
                <span className="form-legend">Chỉnh sửa điểm đang chọn:</span>
                <div className="form-group">
                  <label>Tiêu đề điểm</label>
                  <input 
                    type="text" 
                    className="inter-input" 
                    value={selectedPinForEdit.title}
                    onChange={(e) => handleUpdatePin({ ...selectedPinForEdit, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Thẻ phân loại (Badge)</label>
                  <input 
                    type="text" 
                    className="inter-input" 
                    value={selectedPinForEdit.badge || ''}
                    onChange={(e) => handleUpdatePin({ ...selectedPinForEdit, badge: e.target.value })}
                    placeholder="Ví dụ: Quan trọng, Phần cứng..."
                  />
                </div>

                <div className="form-group">
                  <label>Nội dung giải thích chi tiết</label>
                  <textarea 
                    className="inter-textarea" 
                    rows={3}
                    value={selectedPinForEdit.description}
                    onChange={(e) => handleUpdatePin({ ...selectedPinForEdit, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    style={{ color: '#ef4444' }}
                    onClick={() => handleDeletePin(selectedPinForEdit.id)}
                  >
                    <Trash2 size={14} /> Xóa Điểm Này
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelectedPinForEdit(null)}
                  >
                    Xong
                  </button>
                </div>
              </div>
            ) : (
              <div className="pins-summary-list">
                {pins.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Chưa có điểm nào. Bấm nút <strong>"Cắm Điểm"</strong> rồi click lên ảnh để tạo.
                  </p>
                ) : (
                  pins.map((p, idx) => (
                    <div 
                      key={p.id} 
                      className="pin-item-row"
                      onClick={() => {
                        setSelectedPinForEdit(p);
                        setActivePin(p);
                      }}
                    >
                      <div className="pin-num">{idx + 1}</div>
                      <div className="pin-info">
                        <strong>{p.title}</strong>
                        <span>{p.badge ? `[${p.badge}] ` : ''}{p.description.slice(0, 45)}...</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Xuất Mã Nhúng Iframe LMS */}
      {showExportModal && (
        <div className="modal-backdrop">
          <div className="stop-edit-modal animate-scale-up" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={20} style={{ color: 'var(--primary)' }} />
                <h3>Xuất Mã Nhúng Iframe Cho LMS / Elearning</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowExportModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Sao chép đoạn mã iframe dưới đây và dán vào ô <strong>Mã nguồn (Source / &lt;&gt;)</strong> trong khung soạn thảo bài giảng của LMS (Moodle, Canvas, LMS Cao đẳng Nam Sài Gòn,...).
              </p>

              <div className="export-result-box" style={{ marginTop: '0.5rem' }}>
                <div className="export-result-header">
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>Mã Iframe Chuẩn LMS (Tự chứa toàn bộ dữ liệu &amp; ảnh)</span>
                  <button className="btn btn-primary btn-sm" onClick={handleCopyIframe}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Đã Sao Chép' : 'Sao Chép Mã'}
                  </button>
                </div>
                <pre className="export-code-block" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {generateIframeCode()}
                </pre>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: 1.5 }}>
                💡 <strong>Mẹo:</strong> Bài giảng Hotspot nhúng qua Iframe chạy hoàn toàn độc lập, học sinh có thể click trực tiếp vào các điểm chú thích trên điện thoại lẫn máy tính mà không bị lỗi giao diện.
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowExportModal(false)}>Đóng</button>
              <button type="button" className="btn btn-primary" onClick={handleCopyIframe}>
                {copied ? 'Đã Sao Chép Mã' : 'Sao Chép Mã Nhúng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

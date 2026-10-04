import { useState, useRef } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Download, 
  Upload
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
  };

  // Xóa pin
  const handleDeletePin = (id: string) => {
    setPins(prev => prev.filter(p => p.id !== id));
    if (selectedPinForEdit?.id === id) setSelectedPinForEdit(null);
    if (activePin?.id === id) setActivePin(null);
    showToast('Đã xóa điểm tương tác.', 'info');
  };

  // Xuất file HTML tương tác độc lập (Có thể tải lên LMS/Moodle)
  const handleExportHtml = () => {
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Hình Ảnh Chú Thích Tương Tác</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 15px; }
    .wrapper { max-width: 960px; width: 100%; background: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.5); }
    .img-box { position: relative; width: 100%; line-height: 0; }
    .img-box img { width: 100%; height: auto; display: block; }
    .pin { position: absolute; width: 32px; height: 32px; border-radius: 50%; background: #ef4444; border: 2.5px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 13px; transform: translate(-50%, -50%); cursor: pointer; animation: pulse 2s infinite; z-index: 10; transition: transform 0.2s; }
    .pin:hover { transform: translate(-50%, -50%) scale(1.2); }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
    .card { display: none; position: absolute; background: #0f172a; border: 1.5px solid #38bdf8; border-radius: 8px; padding: 14px 16px; width: 280px; color: #f8fafc; line-height: 1.4; box-shadow: 0 10px 25px rgba(0,0,0,0.7); z-index: 99; transform: translate(-50%, -120%); pointer-events: auto; }
    .badge { display: inline-block; background: #0284c7; color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; margin-bottom: 6px; }
    .title { font-size: 15px; font-weight: 700; color: #38bdf8; margin-bottom: 4px; }
    .desc { font-size: 13px; color: #cbd5e1; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="img-box">
      <img src="${imageUrl}" alt="Interactive Material">
      ${pins.map((p, idx) => `
        <div class="pin" style="left: ${p.xPercent}%; top: ${p.yPercent}%;" onclick="toggleCard(event, 'card-${p.id}')">
          ${idx + 1}
          <div id="card-${p.id}" class="card">
            ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
            <div class="title">${p.title}</div>
            <div class="desc">${p.description}</div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  <script>
    function toggleCard(e, id) {
      e.stopPropagation();
      const el = document.getElementById(id);
      const isShown = el.style.display === 'block';
      document.querySelectorAll('.card').forEach(c => c.style.display = 'none');
      if (!isShown) el.style.display = 'block';
    }
    document.addEventListener('click', () => {
      document.querySelectorAll('.card').forEach(c => c.style.display = 'none');
    });
  </script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anh-tuong-tac-hotspot-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file HTML Hình Ảnh Tương Tác!', 'success');
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
            className="btn btn-primary btn-sm"
            onClick={handleExportHtml}
            style={{ background: '#10b981', border: 'none' }}
          >
            <Download size={15} /> Xuất HTML Nhúng LMS
          </button>
        </div>
      </header>

      <div className="hs-layout-grid">
        {/* Left: Interactive Canvas Screen */}
        <div className="hs-stage-panel">
          <div className="hs-bar">
            <span className="hs-hint">
              {isPlacingPin ? '🎯 Bấm chuột vào vị trí bất kỳ trên ảnh để cắm điểm' : '💡 Bấm nút "Cắm Điểm Chú Thích" bên phải để thêm điểm mới'}
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

                {/* Popover Bubble */}
                {activePin?.id === pin.id && (
                  <div className="hs-bubble animate-scale-up" onClick={(e) => e.stopPropagation()}>
                    {pin.badge && <span className="hs-badge">{pin.badge}</span>}
                    <h4 className="hs-bubble-title">{pin.title}</h4>
                    <p className="hs-bubble-desc">{pin.description}</p>
                  </div>
                )}
              </div>
            ))}
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
    </div>
  );
}

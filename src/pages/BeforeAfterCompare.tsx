import { useState, useRef } from 'react';
import { 
  Columns, 
  Download, 
  Code, 
  Copy, 
  Check, 
  Upload, 
  Sparkles, 
  Sliders,
  Tag,
  Loader2
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import './BeforeAfterCompare.css';

interface PresetItem {
  id: string;
  name: string;
  category: string;
  beforeImg: string;
  afterImg: string;
  beforeLabel: string;
  afterLabel: string;
  title: string;
  desc: string;
  keyPoints: string[];
}

const PRESET_COMPARISONS: PresetItem[] = [
  {
    id: 'beauty-skin',
    category: 'Chăm Sóc Sắc Đẹp',
    name: 'Liệu trình Peel da trị mụn & thâm sau 4 tuần',
    title: 'Đánh giá phục hồi cấu trúc biểu bì da',
    beforeLabel: 'Trước liệu trình (Tuần 0)',
    afterLabel: 'Sau 4 tuần điều trị',
    beforeImg: 'https://images.unsplash.com/photo-1512290900672-1f5be57d34db?auto=format&fit=crop&w=1000&q=80',
    afterImg: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
    desc: 'Quan sát sự thu nhỏ lỗ chân lông, giảm bã nhờn và sắc tố thâm mụn cải thiện rõ rệt.',
    keyPoints: [
      'Lỗ chân lông vùng chữ T se khít đáng kể',
      'Độ ẩm hàng rào sinh học phục hồi 85%',
      'Sắc tố thâm sau mụn (PIH) mờ dần 70%'
    ]
  },
  {
    id: 'mechanical-welding',
    category: 'Cơ Khí - Hàn Kim Loại',
    name: 'Kiểm định mối hàn TIG inox: Lỗi rỗ xỉ vs Mối hàn đạt chuẩn',
    title: 'So sánh chất lượng cơ tính mối hàn kỹ thuật cao',
    beforeLabel: 'Mối hàn lỗi (Rỗ khí & Cháy biên)',
    afterLabel: 'Mối hàn chuẩn kỹ thuật (Vảy cá đều)',
    beforeImg: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1000&q=80',
    afterImg: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80',
    desc: 'Nhận diện hình thái biên hạt hàn, sự đồng nhất chiều dày ngấu và không bị oxy hóa bề mặt kim loại.',
    keyPoints: [
      'Góc vát mép và độ ngấu chân đạt 100%',
      'Không còn vết nứt tế vi dưới chân mối hàn',
      'Bề mặt sáng bóng không ngậm xỉ sunfua'
    ]
  },
  {
    id: 'hospitality-table',
    category: 'Khách Sạn - Du Lịch',
    name: 'Tiêu chuẩn Setup bàn tiệc Âu Fine Dining chuẩn 5 sao',
    title: 'Kiểm tra độ chính xác khoảng cách dao nĩa & ly vang',
    beforeLabel: 'Setup sơ sài / Sai khoảng cách',
    afterLabel: 'Setup chuẩn Fine Dining quốc tế',
    beforeImg: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
    afterImg: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=1000&q=80',
    desc: 'Đo lường cự ly mép bàn 2cm, trình tự dùng dao dĩa từ ngoài vào trong và vị trí ly vang đỏ, vang trắng, nước suối.',
    keyPoints: [
      'Khoảng cách dao nĩa cách mép bàn đồng nhất 2cm',
      'Khăn ăn gấp chuẩn búp măng đặt giữa đĩa chính',
      'Ly nước xếp chéo góc 45 độ theo thứ tự phục vụ rượu'
    ]
  },
  {
    id: 'medical-wound',
    category: 'Y Dược - Điều Dưỡng',
    name: 'Chăm sóc vết mổ vô trùng: Tiến triển liền sẹo',
    title: 'Đánh giá giai đoạn tái sinh biểu mô vết khâu phẫu thuật',
    beforeLabel: 'Vết thương sưng nề ngày thứ 1',
    afterLabel: 'Vết khâu biểu mô hóa ngày thứ 7',
    beforeImg: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80',
    afterImg: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80',
    desc: 'Theo dõi chỉ số chống nhiễm trùng mô mềm, mép da phẳng và hình thành sợi collagen khép kín chân chỉ.',
    keyPoints: [
      'Mép vết khâu áp sát, không chảy dịch rỉ viêm',
      'Xung quanh vết mổ hết sưng đỏ và căng tức',
      'Đủ tiêu chuẩn cắt chỉ ngoại khoa an toàn'
    ]
  }
];

export default function BeforeAfterCompare() {
  const { showToast } = useNotification();
  const { token } = useAuth();

  const [selectedPresetId, setSelectedPresetId] = useState<string>('beauty-skin');
  const currentPreset = PRESET_COMPARISONS.find(p => p.id === selectedPresetId) || PRESET_COMPARISONS[0];

  const [title, setTitle] = useState(currentPreset.title);
  const [desc, setDesc] = useState(currentPreset.desc);
  const [beforeLabel, setBeforeLabel] = useState(currentPreset.beforeLabel);
  const [afterLabel, setAfterLabel] = useState(currentPreset.afterLabel);
  const [beforeImg, setBeforeImg] = useState(currentPreset.beforeImg);
  const [afterImg, setAfterImg] = useState(currentPreset.afterImg);
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 - 100%

  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [isDraggingStage, setIsDraggingStage] = useState(false);

  const handleStagePointerMove = (clientX: number) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;
    const pct = Math.round((x / rect.width) * 100);
    setSliderPos(pct);
  };

  const handleStageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingStage(true);
    handleStagePointerMove(e.clientX);
  };

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingStage) {
      handleStagePointerMove(e.clientX);
    }
  };

  const handleStageMouseUp = () => {
    setIsDraggingStage(false);
  };

  const handleStageTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      handleStagePointerMove(e.touches[0].clientX);
    }
  };

  const [isUploading, setIsUploading] = useState<'before' | 'after' | null>(null);
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);

  // Khi chọn mẫu có sẵn
  const handleSelectPreset = (id: string) => {
    const p = PRESET_COMPARISONS.find(item => item.id === id);
    if (!p) return;
    setSelectedPresetId(id);
    setTitle(p.title);
    setDesc(p.desc);
    setBeforeLabel(p.beforeLabel);
    setAfterLabel(p.afterLabel);
    setBeforeImg(p.beforeImg);
    setAfterImg(p.afterImg);
    setSliderPos(50);
    showToast(`Đã áp dụng mẫu: ${p.name}`, 'info');
  };

  // Upload ảnh lên Google Drive hoặc nạp Base64
  const handleUpload = async (file: File, target: 'before' | 'after') => {
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.', 'warning');
      return;
    }

    setIsUploading(target);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (token) {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              imageBase64: base64Data,
              filename: `compare-${target}-${Date.now()}.png`
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              if (target === 'before') setBeforeImg(data.url);
              else setAfterImg(data.url);
              showToast(`Đã tải ảnh "${target === 'before' ? beforeLabel : afterLabel}" lên Google Drive!`, 'success');
              setIsUploading(null);
              return;
            }
          }
        } catch (uploadErr) {
          console.warn('Lỗi tải Google Drive:', uploadErr);
        }
      }

      // Fallback cục bộ
      if (target === 'before') setBeforeImg(base64Data);
      else setAfterImg(base64Data);
      showToast('Đã tải ảnh lên thành công!', 'success');
    } catch {
      showToast('Không thể đọc file ảnh.', 'error');
    } finally {
      setIsUploading(null);
    }
  };

  // Xuất file HTML độc lập cho LMS
  const generateStandaloneHtml = () => {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'So Sánh Đối Chiếu Trước - Sau'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; }
    .compare-card { width: 100%; max-width: 860px; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 45px rgba(0,0,0,0.6); border: 1px solid #334155; }
    .header { padding: 16px 20px; border-bottom: 1px solid #334155; background: #182234; }
    .title { font-size: 19px; font-weight: 700; color: #38bdf8; margin-bottom: 4px; }
    .desc { font-size: 13.5px; color: #94a3b8; line-height: 1.5; }
    
    .compare-container { position: relative; width: 100%; height: 460px; overflow: hidden; user-select: none; -webkit-user-select: none; background: #020617; }
    .img-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .img-layer img { width: 100%; height: 100%; object-fit: cover; display: block; }
    
    .layer-after { z-index: 1; }
    .layer-before { z-index: 2; clip-path: inset(0 50% 0 0); }
    .layer-before img { width: 100%; height: 100%; object-fit: cover; }
    
    .badge { position: absolute; top: 14px; z-index: 5; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
    .badge-before { left: 14px; background: rgba(239, 68, 68, 0.9); color: #fff; }
    .badge-after { right: 14px; background: rgba(16, 185, 129, 0.9); color: #fff; }
    
    .slider-handle { position: absolute; top: 0; bottom: 0; width: 4px; background: #38bdf8; z-index: 10; cursor: ew-resize; left: 50%; transform: translateX(-50%); }
    .handle-circle { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 42px; height: 42px; background: #38bdf8; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 14px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; font-size: 14px; color: #0f172a; font-weight: 900; }
    
    .footer { padding: 12px 20px; font-size: 12.5px; color: #64748b; text-align: center; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="compare-card">
    <div class="header">
      <div class="title">${title}</div>
      <div class="desc">${desc}</div>
    </div>
    
    <div class="compare-container" id="box">
      <div class="badge badge-before">${beforeLabel}</div>
      <div class="badge badge-after">${afterLabel}</div>

      <div class="img-layer layer-after">
        <img src="${afterImg}" alt="After">
      </div>
      <div class="img-layer layer-before" id="beforeLayer">
        <img src="${beforeImg}" alt="Before">
      </div>
      
      <div class="slider-handle" id="handle">
        <div class="handle-circle">↔</div>
      </div>
    </div>
    <div class="footer">💡 Kéo thanh trượt ngang hoặc chạm giữ ngón tay trên ảnh để đối chiếu từng chi tiết</div>
  </div>

  <script>
    const box = document.getElementById('box');
    const beforeLayer = document.getElementById('beforeLayer');
    const handle = document.getElementById('handle');
    let isDown = false;

    function setPos(clientX) {
      const rect = box.getBoundingClientRect();
      let x = clientX - rect.left;
      if (x < 0) x = 0;
      if (x > rect.width) x = rect.width;
      const pct = (x / rect.width) * 100;
      beforeLayer.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      handle.style.left = pct + '%';
    }

    box.addEventListener('mousedown', (e) => { isDown = true; setPos(e.clientX); });
    window.addEventListener('mousemove', (e) => { if (isDown) setPos(e.clientX); });
    window.addEventListener('mouseup', () => { isDown = false; });

    box.addEventListener('touchstart', (e) => { isDown = true; setPos(e.touches[0].clientX); });
    window.addEventListener('touchmove', (e) => { if (isDown) setPos(e.touches[0].clientX); });
    window.addEventListener('touchend', () => { isDown = false; });
  </script>
</body>
</html>`;
  };

  const handleExportHtml = () => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `so-sanh-truoc-sau-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file HTML đối chiếu trước sau!', 'success');
  };

  const generateIframeCode = () => {
    const html = generateStandaloneHtml();
    const utf8Bytes = new TextEncoder().encode(html);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 = btoa(binary);

    return `<!-- MA NHUNG DOI CHIEU TRUOC SAU CHO LMS (CHUAN 16:9) -->
<div style="position:relative;width:100%;height:auto;aspect-ratio:16/9;padding-top:0;margin:15px auto;background:#0f172a;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.35);">
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
      showToast('Vui lòng copy thủ công', 'warning');
    }
  };

  return (
    <div className="compare-page animate-fade-in">
      {/* Header */}
      <header className="compare-header">
        <div className="compare-title-group">
          <div className="compare-icon">
            <Columns size={26} />
          </div>
          <div>
            <h1 className="compare-title">Bảng Đối Chiếu Trước - Sau (Interactive Before / After)</h1>
            <p className="compare-subtitle">
              So sánh trực quan hai trạng thái bằng thanh trượt gạt ngang. Phù hợp giảng dạy Chăm sóc sắc đẹp, Cơ khí, Y Dược, Khách sạn...
            </p>
          </div>
        </div>

        <div className="compare-actions">
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

      {/* Preset Picker */}
      <div className="compare-presets-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <Sparkles size={16} color="var(--primary)" /> Mẫu chuyên ngành gợi ý:
        </div>
        <div className="compare-presets-chips">
          {PRESET_COMPARISONS.map(p => (
            <button
              key={p.id}
              type="button"
              className={`compare-preset-chip ${selectedPresetId === p.id ? 'active' : ''}`}
              onClick={() => handleSelectPreset(p.id)}
            >
              <Tag size={12} />
              <span>[{p.category}]</span> {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Slider Viewer & Control Panel */}
      <div className="compare-main-grid">
        {/* Cột trái: Trình xem tương tác kéo thanh gạt */}
        <div className="compare-viewer-panel">
          <div className="compare-viewer-header">
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{title}</h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{desc}</span>
          </div>

          <div 
            ref={stageRef}
            className="compare-interactive-stage"
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onMouseLeave={handleStageMouseUp}
            onTouchStart={(e) => handleStagePointerMove(e.touches[0].clientX)}
            onTouchMove={handleStageTouchMove}
            style={{ cursor: 'ew-resize' }}
          >
            <div className="compare-badge compare-badge-before">{beforeLabel}</div>
            <div className="compare-badge compare-badge-after">{afterLabel}</div>

            {/* Layer Sau (Nằm dưới full width) */}
            <div className="compare-img-wrap after-wrap">
              <img src={afterImg} alt={afterLabel} draggable={false} />
            </div>

            {/* Layer Trước (Cắt clip theo slider) */}
            <div 
              className="compare-img-wrap before-wrap" 
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img src={beforeImg} alt={beforeLabel} draggable={false} />
            </div>

            {/* Thanh cầm kéo trượt */}
            <div 
              className="compare-slider-divider" 
              style={{ left: `${sliderPos}%` }}
            >
              <div className="compare-slider-thumb">↔</div>
            </div>
          </div>

          {/* Thanh trượt Range input bên dưới */}
          <div className="compare-range-control">
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{beforeLabel}</span>
            <input 
              type="range" 
              min={0} 
              max={100} 
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="compare-range-slider"
            />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{afterLabel}</span>
          </div>

          {/* Tiêu chí đánh giá chuyên ngành */}
          {currentPreset.keyPoints && currentPreset.keyPoints.length > 0 && (
            <div className="compare-keypoints-box">
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--primary)' }}>
                📌 Tiêu chuẩn đánh giá chuyên môn:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {currentPreset.keyPoints.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Cột phải: Biên tập ảnh và thông tin */}
        <div className="compare-editor-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Sliders size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Tùy Chỉnh So Sánh</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="compare-label">Tiêu đề bài học</label>
              <input 
                type="text" 
                className="bs-input" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>

            <div>
              <label className="compare-label">Mô tả / Hướng dẫn quan sát cho sinh viên</label>
              <textarea 
                className="bs-textarea" 
                rows={2} 
                value={desc} 
                onChange={(e) => setDesc(e.target.value)} 
              />
            </div>

            {/* Khối ảnh TRƯỚC */}
            <div className="compare-image-edit-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ef4444' }}>
                  🔴 Ảnh Trạng Thái "TRƯỚC" (Before)
                </span>
                <button 
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => beforeFileRef.current?.click()}
                  disabled={isUploading === 'before'}
                >
                  {isUploading === 'before' ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Tải ảnh lên Google Drive
                </button>
                <input 
                  type="file" 
                  ref={beforeFileRef} 
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'before')}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>

              <input 
                type="text" 
                className="bs-input" 
                value={beforeLabel} 
                placeholder="Nhãn hiển thị (VD: Trước khi điều trị)"
                onChange={(e) => setBeforeLabel(e.target.value)} 
              />

              <input 
                type="text" 
                className="bs-input" 
                value={beforeImg} 
                placeholder="URL hình ảnh (https://...)"
                onChange={(e) => setBeforeImg(e.target.value)} 
              />
            </div>

            {/* Khối ảnh SAU */}
            <div className="compare-image-edit-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#10b981' }}>
                  🟢 Ảnh Trạng Thái "SAU" (After)
                </span>
                <button 
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => afterFileRef.current?.click()}
                  disabled={isUploading === 'after'}
                >
                  {isUploading === 'after' ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Tải ảnh lên Google Drive
                </button>
                <input 
                  type="file" 
                  ref={afterFileRef} 
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'after')}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>

              <input 
                type="text" 
                className="bs-input" 
                value={afterLabel} 
                placeholder="Nhãn hiển thị (VD: Sau khi gia công)"
                onChange={(e) => setAfterLabel(e.target.value)} 
              />

              <input 
                type="text" 
                className="bs-input" 
                value={afterImg} 
                placeholder="URL hình ảnh (https://...)"
                onChange={(e) => setAfterImg(e.target.value)} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal Xuất Mã Nhúng Iframe */}
      {showExportModal && (
        <div className="modal-backdrop" onClick={() => setShowExportModal(false)}>
          <div className="stop-edit-modal animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={20} style={{ color: 'var(--primary)' }} />
                <h3>Mã Nhúng LMS Cho Bảng Đối Chiếu</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowExportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Dán mã nhúng này vào LMS (Canvas, Moodle, Google Sites, Web trường...). Sinh viên có thể dùng chuột hoặc ngón tay cảm ứng trên điện thoại để kéo thanh gạt đối chiếu trực tiếp!
              </p>
              <div className="export-result-box">
                <div className="export-result-header">
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Mã HTML Iframe độc lập Responsive 100%</span>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-xs"
                    onClick={handleCopyIframe}
                    style={{ background: copied ? '#10b981' : 'var(--primary)' }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
                <pre className="export-code-block">{generateIframeCode()}</pre>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowExportModal(false)}>Đóng</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleCopyIframe}>
                {copied ? 'Đã sao chép' : 'Sao chép mã nhúng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

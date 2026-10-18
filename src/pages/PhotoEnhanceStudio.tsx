import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Download, 
  RotateCcw, 
  Sliders, 
  SlidersHorizontal,
  Sun, 
  Contrast, 
  Layers, 
  Eye, 
  EyeOff,
  Flame,
  Zap,
  Wand2
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import FileUploadZone from '../components/FileUploadZone';
import './PhotoEnhanceStudio.css';

interface Adjustments {
  brightness: number;  // -100 to 100
  contrast: number;    // -100 to 100
  saturation: number;  // -100 to 100
  exposure: number;    // -100 to 100
  highlights: number;  // -100 to 100
  shadows: number;     // -100 to 100
  temperature: number; // -100 (Cool) to 100 (Warm)
  sharpness: number;   // 0 to 100
  vignette: number;    // 0 to 100
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  sharpness: 0,
  vignette: 0
};

interface PresetStyle {
  id: string;
  name: string;
  badge: string;
  desc: string;
  adjustments: Partial<Adjustments>;
}

const PRESETS: PresetStyle[] = [
  {
    id: 'auto-fix',
    name: '✨ Tự Động Phục Hồi (Auto-Fix)',
    badge: 'Khuyên dùng',
    desc: 'Tự động cân bằng sáng, tăng độ no màu và làm rõ nét chi tiết.',
    adjustments: { brightness: 8, contrast: 15, saturation: 18, exposure: 5, sharpness: 30 }
  },
  {
    id: 'hdr-clear',
    name: '⚡ Siêu Sắc Nét HDR',
    badge: 'Cảnh sắc',
    desc: 'Tối ưu độ tương phản vi mô và nổi bật khối chi tiết phong cảnh, kiến trúc.',
    adjustments: { brightness: 5, contrast: 28, saturation: 22, highlights: -15, shadows: 20, sharpness: 50 }
  },
  {
    id: 'warm-portrait',
    name: '☀️ Chân Dung Ấm Áp (Warm Glow)',
    badge: 'Chân dung',
    desc: 'Làm ấm tone màu da, giảm chói sáng và tạo chiều sâu cuốn hút.',
    adjustments: { brightness: 10, contrast: 8, saturation: 12, temperature: 25, shadows: 10, vignette: 15 }
  },
  {
    id: 'night-boost',
    name: '🌙 Cứu Sáng Ảnh Thiếu Sáng / Chụp Đêm',
    badge: 'Cứu sáng',
    desc: 'Nâng sáng vùng tối (shadows) và kéo lại chi tiết vùng thiếu sáng.',
    adjustments: { brightness: 25, exposure: 20, shadows: 40, contrast: 12, saturation: 10, sharpness: 25 }
  },
  {
    id: 'food-vibrant',
    name: '🍔 Ẩm Thực Tươi Sống (Food Vibrant)',
    badge: 'Ẩm thực',
    desc: 'Tăng sắc độ màu tươi rói khiến món ăn ngon mắt và hấp dẫn hơn.',
    adjustments: { brightness: 12, contrast: 20, saturation: 35, temperature: 15, sharpness: 20 }
  }
];

export default function PhotoEnhanceStudio() {
  const { showToast } = useNotification();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'manual'>('presets');

  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load ảnh khi người dùng chọn
  const handleFileSelect = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WebP)!', 'warning');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImageSrc(url);
      const img = new Image();
      img.onload = () => {
        originalImgRef.current = img;
        setAdjustments(DEFAULT_ADJUSTMENTS);
        renderProcessedImage(DEFAULT_ADJUSTMENTS, img);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  // Áp dụng bộ lọc Canvas thời gian thực
  const renderProcessedImage = useCallback((adj: Adjustments, sourceImg?: HTMLImageElement | null) => {
    const img = sourceImg || originalImgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // 1. Vẽ ảnh gốc lên canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tính toán CSS filter cơ bản
    const brightVal = 100 + adj.brightness + adj.exposure * 0.8;
    const contrastVal = 100 + adj.contrast;
    const saturateVal = 100 + adj.saturation;

    ctx.filter = `brightness(${brightVal}%) contrast(${contrastVal}%) saturate(${saturateVal}%)`;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    // 2. Xử lý Cân bằng nhiệt độ màu (Temperature / Warmth)
    if (adj.temperature !== 0) {
      ctx.save();
      if (adj.temperature > 0) {
        // Tông ấm (Cam / Vàng)
        ctx.fillStyle = `rgba(255, 140, 0, ${adj.temperature * 0.002})`;
      } else {
        // Tông mát (Xanh da trời)
        ctx.fillStyle = `rgba(0, 150, 255, ${Math.abs(adj.temperature) * 0.002})`;
      }
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // 3. Xử lý Làm sắc nét (Unsharp Masking đơn giản qua pixel nếu sharpness > 0)
    if (adj.sharpness > 0) {
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const w = canvas.width;
        const h = canvas.height;
        const weight = (adj.sharpness / 100) * 0.45;

        // Kernel convolution làm nét 3x3 nhẹ
        const buff = new Uint8ClampedArray(data);
        for (let y = 1; y < h - 1; y += 2) { // Tối ưu bước nhảy để mượt mà
          for (let x = 1; x < w - 1; x += 2) {
            const idx = (y * w + x) * 4;
            const top = ((y - 1) * w + x) * 4;
            const btm = ((y + 1) * w + x) * 4;
            const lft = (y * w + (x - 1)) * 4;
            const rgt = (y * w + (x + 1)) * 4;

            for (let c = 0; c < 3; c++) {
              const val = buff[idx + c] * (1 + 4 * weight) - 
                          (buff[top + c] + buff[btm + c] + buff[lft + c] + buff[rgt + c]) * weight;
              data[idx + c] = Math.max(0, Math.min(255, val));
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (e) {
        // Bỏ qua nếu lỗi security CORS
      }
    }

    // 4. Xử lý Bo viền tối mờ ảo (Vignette)
    if (adj.vignette > 0) {
      ctx.save();
      const radius = Math.max(canvas.width, canvas.height) * 0.75;
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, radius * 0.3,
        canvas.width / 2, canvas.height / 2, radius
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${adj.vignette * 0.008})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }, []);

  // Cập nhật khi adjustments thay đổi
  useEffect(() => {
    if (originalImgRef.current) {
      renderProcessedImage(adjustments);
    }
  }, [adjustments, renderProcessedImage]);

  // Áp dụng Preset
  const handleApplyPreset = (preset: PresetStyle) => {
    const updated = {
      ...DEFAULT_ADJUSTMENTS,
      ...preset.adjustments
    };
    setAdjustments(updated);
    showToast(`Đã áp dụng công thức: ${preset.name}!`, 'success');
  };

  // Thay đổi từng thông số
  const handleSliderChange = (key: keyof Adjustments, val: number) => {
    setAdjustments(prev => ({ ...prev, [key]: val }));
  };

  // Reset về ban đầu
  const handleReset = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    showToast('Đã khôi phục về ảnh gốc ban đầu!', 'info');
  };

  // Tải ảnh đã xử lý về máy
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageFile) return;

    setIsProcessing(true);
    try {
      const link = document.createElement('a');
      const originalName = imageFile.name.replace(/\.[^/.]+$/, '');
      link.download = `${originalName}-enhanced.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      showToast('Đã tải ảnh chất lượng cao về máy thành công!', 'success');
    } catch {
      showToast('Không thể tải file, vui lòng thử lại!', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="enhance-studio-page animate-fade-in">
      {/* Header */}
      <header className="es-header">
        <div className="es-title-group">
          <div className="es-icon">
            <Sparkles size={28} />
          </div>
          <div>
            <h1 className="es-title">Nâng Cấp & Hiệu Chỉnh Ảnh Đa Năng (Photo Enhance Studio)</h1>
            <p className="es-subtitle">
              Cứu sáng ảnh thiếu sáng, cân bằng sáng tối HDR, làm sắc nét chi tiết và tinh chỉnh thông số chuyên nghiệp 100% bảo mật ngay trên trình duyệt.
            </p>
          </div>
        </div>

        {imageSrc && (
          <div className="es-header-actions">
            <button 
              className="es-btn es-btn-outline"
              onClick={handleReset}
              title="Khôi phục lại thiết lập gốc"
            >
              <RotateCcw size={16} />
              <span>Khôi phục</span>
            </button>

            <button 
              className="es-btn es-btn-primary"
              onClick={handleDownload}
              disabled={isProcessing}
            >
              <Download size={16} />
              <span>Tải Ảnh Chất Lượng Cao</span>
            </button>
          </div>
        )}
      </header>

      {!imageSrc ? (
        <div className="es-upload-container">
          <FileUploadZone 
            onFileSelect={handleFileSelect}
            accept="image/*"
            hintText="Kéo thả hình ảnh (JPG, PNG, WEBP) hoặc bấm để chọn ảnh cần nâng cấp chất lượng"
          />
        </div>
      ) : (
        <div className="es-workspace-grid">
          {/* Cột Bên Trái: Bảng Điều Khiển Nâng Cấp */}
          <div className="es-controls-card">
            {/* Tabs chuyển đổi giữa Preset và Chỉnh tay */}
            <div className="es-tab-toggle">
              <button 
                className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
                onClick={() => setActiveTab('presets')}
              >
                <Wand2 size={16} />
                <span>Công Thức Màu Sẵn (Presets)</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
                onClick={() => setActiveTab('manual')}
              >
                <SlidersHorizontal size={16} />
                <span>Chỉnh Thủ Công</span>
              </button>
            </div>

            {/* TAB 1: DANH SÁCH BỘ LỌC CỨU SÁNG & PHỤC HỒI NHANH */}
            {activeTab === 'presets' && (
              <div className="presets-list animate-fade-in">
                {PRESETS.map(preset => (
                  <div 
                    key={preset.id}
                    className="preset-item-card"
                    onClick={() => handleApplyPreset(preset)}
                  >
                    <div className="preset-item-header">
                      <span className="preset-item-name">{preset.name}</span>
                      <span className="preset-badge">{preset.badge}</span>
                    </div>
                    <p className="preset-item-desc">{preset.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: CÁC THANH TRƯỢT CHỈNH TAY CHUYÊN NGHIỆP */}
            {activeTab === 'manual' && (
              <div className="manual-sliders-list animate-fade-in">
                {/* Độ Sáng */}
                <div className="slider-group">
                  <div className="slider-header">
                    <span className="slider-label"><Sun size={15} /> Độ Sáng (Brightness)</span>
                    <span className="slider-value">{adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}</span>
                  </div>
                  <input 
                    type="range" 
                    min={-100} 
                    max={100} 
                    value={adjustments.brightness}
                    onChange={e => handleSliderChange('brightness', parseInt(e.target.value))}
                    className="es-range"
                  />
                </div>

                {/* Độ Tương Phản */}
                <div className="slider-group">
                  <div className="slider-header">
                    <span className="slider-label"><Contrast size={15} /> Độ Tương Phản (Contrast)</span>
                    <span className="slider-value">{adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}</span>
                  </div>
                  <input 
                    type="range" 
                    min={-100} 
                    max={100} 
                    value={adjustments.contrast}
                    onChange={e => handleSliderChange('contrast', parseInt(e.target.value))}
                    className="es-range"
                  />
                </div>

                {/* Độ Bão Hòa Màu */}
                <div className="slider-group">
                  <div className="slider-header">
                    <span className="slider-label"><Layers size={15} /> Độ Tươi Màu (Saturation)</span>
                    <span className="slider-value">{adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}</span>
                  </div>
                  <input 
                    type="range" 
                    min={-100} 
                    max={100} 
                    value={adjustments.saturation}
                    onChange={e => handleSliderChange('saturation', parseInt(e.target.value))}
                    className="es-range"
                  />
                </div>

                {/* Phơi Sáng */}
                <div className="slider-group">
                  <div className="slider-header">
                    <span className="slider-label"><Zap size={15} /> Phơi Sáng (Exposure)</span>
                    <span className="slider-value">{adjustments.exposure > 0 ? `+${adjustments.exposure}` : adjustments.exposure}</span>
                  </div>
                  <input 
                    type="range" 
                    min={-100} 
                    max={100} 
                    value={adjustments.exposure}
                    onChange={e => handleSliderChange('exposure', parseInt(e.target.value))}
                    className="es-range"
                  />
                </div>

                {/* Cân Bằng Trắng / Nhiệt Độ Màu */}
                <div className="slider-group">
                  <div className="slider-header">
                    <span className="slider-label"><Flame size={15} /> Nhiệt Độ Màu (Warmth / Cold)</span>
                    <span className="slider-value">{adjustments.temperature > 0 ? `+${adjustments.temperature}` : adjustments.temperature}</span>
                  </div>
                  <input 
                    type="range" 
                    min={-100} 
                    max={100} 
                    value={adjustments.temperature}
                    onChange={e => handleSliderChange('temperature', parseInt(e.target.value))}
                    className="es-range"
                  />
                </div>

                {/* Làm Nét Chi Tiết */}
                <div className="slider-group">
                  <div className="slider-header">
                    <span className="slider-label"><Sparkles size={15} /> Làm Nét Chi Tiết (Sharpness)</span>
                    <span className="slider-value">{adjustments.sharpness}</span>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={100} 
                    value={adjustments.sharpness}
                    onChange={e => handleSliderChange('sharpness', parseInt(e.target.value))}
                    className="es-range"
                  />
                </div>

                {/* Bo Viền Tối */}
                <div className="slider-group">
                  <div className="slider-header">
                    <span className="slider-label"><Sliders size={15} /> Bo Viền Tối Nghệ Thuật (Vignette)</span>
                    <span className="slider-value">{adjustments.vignette}</span>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={100} 
                    value={adjustments.vignette}
                    onChange={e => handleSliderChange('vignette', parseInt(e.target.value))}
                    className="es-range"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cột Bên Phải: Khung Xem Trước So Sánh Trực Quan */}
          <div className="es-preview-card">
            <div className="preview-top-bar">
              <span className="preview-meta">
                {imageFile?.name} {originalImgRef.current ? `(${originalImgRef.current.naturalWidth} x ${originalImgRef.current.naturalHeight} px)` : ''}
              </span>

              <button 
                className={`compare-btn ${isComparing ? 'active' : ''}`}
                onMouseDown={() => setIsComparing(true)}
                onMouseUp={() => setIsComparing(false)}
                onTouchStart={() => setIsComparing(true)}
                onTouchEnd={() => setIsComparing(false)}
              >
                {isComparing ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{isComparing ? 'Đang Xem Ảnh Gốc' : 'Giữ Để Xem Ảnh Gốc'}</span>
              </button>
            </div>

            <div className="canvas-viewport-box">
              {/* Canvas hiển thị ảnh sau xử lý */}
              <canvas 
                ref={canvasRef} 
                className={`es-main-canvas ${isComparing ? 'hidden' : ''}`}
              />

              {/* Ảnh gốc hiển thị khi đè nút so sánh */}
              {isComparing && imageSrc && (
                <img 
                  src={imageSrc} 
                  alt="Ảnh gốc" 
                  className="es-original-img animate-fade-in"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

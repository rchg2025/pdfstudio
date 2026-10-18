import React, { useState, useRef } from 'react';
import { 
  Sliders, 
  Sparkles, 
  Download, 
  RotateCcw, 
  Sun, 
  Contrast, 
  Palette, 
  Eye, 
  Image as ImageIcon,
  Flame
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import FileUploadZone from '../components/FileUploadZone';
import './PhotoFilterStudio.css';

interface FilterPreset {
  id: string;
  name: string;
  category: string;
  previewColor: string;
  settings: {
    brightness: number; // 0 - 200 (100 is normal)
    contrast: number;   // 0 - 200 (100 is normal)
    saturation: number; // 0 - 200 (100 is normal)
    sepia: number;      // 0 - 100
    grayscale: number;  // 0 - 100
    invert: number;     // 0 - 100
    hueRotate: number;  // 0 - 360
    blur: number;       // 0 - 20 (px)
    warmth: number;     // -50 -> +50 (custom overlay)
    vignette: number;   // 0 -> 100
  };
}

const PRESETS: FilterPreset[] = [
  {
    id: 'normal',
    name: 'Ảnh Gốc',
    category: 'Mặc định',
    previewColor: 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
    settings: { brightness: 100, contrast: 100, saturation: 100, sepia: 0, grayscale: 0, invert: 0, hueRotate: 0, blur: 0, warmth: 0, vignette: 0 }
  },
  {
    id: 'cinematic-teal-orange',
    name: 'Teal & Orange',
    category: 'Điện ảnh',
    previewColor: 'linear-gradient(135deg, #0ea5e9, #f97316)',
    settings: { brightness: 105, contrast: 125, saturation: 130, sepia: 15, grayscale: 0, invert: 0, hueRotate: 345, blur: 0, warmth: 20, vignette: 25 }
  },
  {
    id: 'vintage-film',
    name: 'Vintage Kodak',
    category: 'Cổ điển',
    previewColor: 'linear-gradient(135deg, #d97706, #78350f)',
    settings: { brightness: 110, contrast: 90, saturation: 85, sepia: 35, grayscale: 0, invert: 0, hueRotate: 10, blur: 0, warmth: 30, vignette: 40 }
  },
  {
    id: 'bw-noir',
    name: 'Đen Trắng Noir',
    category: 'Nghệ thuật',
    previewColor: 'linear-gradient(135deg, #1e293b, #000000)',
    settings: { brightness: 105, contrast: 140, saturation: 0, sepia: 0, grayscale: 100, invert: 0, hueRotate: 0, blur: 0, warmth: 0, vignette: 35 }
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    category: 'Viễn tưởng',
    previewColor: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    settings: { brightness: 115, contrast: 135, saturation: 160, sepia: 10, grayscale: 0, invert: 0, hueRotate: 280, blur: 0, warmth: -15, vignette: 30 }
  },
  {
    id: 'warm-sunset',
    name: 'Hoàng Hôn Ấm',
    category: 'Golden Hour',
    previewColor: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    settings: { brightness: 105, contrast: 110, saturation: 125, sepia: 25, grayscale: 0, invert: 0, hueRotate: 15, blur: 0, warmth: 45, vignette: 15 }
  },
  {
    id: 'cool-breeze',
    name: 'Băng Lạnh',
    category: 'Nordic Cool',
    previewColor: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    settings: { brightness: 105, contrast: 115, saturation: 95, sepia: 0, grayscale: 0, invert: 0, hueRotate: 180, blur: 0, warmth: -40, vignette: 10 }
  },
  {
    id: 'pastel-dream',
    name: 'Pastel Mộng Mơ',
    category: 'Fairy Tale',
    previewColor: 'linear-gradient(135deg, #f472b6, #c084fc)',
    settings: { brightness: 120, contrast: 85, saturation: 115, sepia: 10, grayscale: 0, invert: 0, hueRotate: 320, blur: 0, warmth: 15, vignette: 0 }
  },
  {
    id: 'dramatic-hdr',
    name: 'Tương Phản HDR',
    category: 'Sắc nét',
    previewColor: 'linear-gradient(135deg, #475569, #0f172a)',
    settings: { brightness: 100, contrast: 150, saturation: 140, sepia: 0, grayscale: 0, invert: 0, hueRotate: 0, blur: 0, warmth: 5, vignette: 30 }
  }
];

const PhotoFilterStudio: React.FC = () => {
  const { showAlert } = useNotification();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('normal');
  
  // Custom Controls State
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [sepia, setSepia] = useState<number>(0);
  const [grayscale, setGrayscale] = useState<number>(0);
  const [hueRotate, setHueRotate] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0);
  const [warmth, setWarmth] = useState<number>(0);
  const [vignette, setVignette] = useState<number>(0);
  
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const originalImgRef = useRef<HTMLImageElement | null>(null);

  // Xử lý nạp ảnh vào studio
  const handleFileSelect = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP).', 'Định dạng sai');
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
        resetToDefault();
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  // Áp dụng Preset
  const applyPreset = (preset: FilterPreset) => {
    setSelectedPresetId(preset.id);
    setBrightness(preset.settings.brightness);
    setContrast(preset.settings.contrast);
    setSaturation(preset.settings.saturation);
    setSepia(preset.settings.sepia);
    setGrayscale(preset.settings.grayscale);
    setHueRotate(preset.settings.hueRotate);
    setBlur(preset.settings.blur);
    setWarmth(preset.settings.warmth);
    setVignette(preset.settings.vignette);
  };

  // Đưa về giá trị gốc
  const resetToDefault = () => {
    const normalPreset = PRESETS[0];
    applyPreset(normalPreset);
  };

  // Chuỗi CSS Filter
  const filterStyleString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) grayscale(${grayscale}%) hue-rotate(${hueRotate}deg) blur(${blur}px)`;

  // Vẽ Render ảnh hoàn chỉnh lên Canvas để xuất file
  const renderCanvasOutput = (): HTMLCanvasElement | null => {
    const img = originalImgRef.current;
    if (!img) return null;

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Áp dụng CSS filters lên canvas context
    ctx.filter = filterStyleString;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none'; // reset filter để vẽ overlays tiếp theo

    // 2. Phủ hiệu ứng Warmth (ấm vàng / lạnh xanh dương)
    if (warmth !== 0) {
      ctx.save();
      if (warmth > 0) {
        // Ấm (Cam/Vàng)
        ctx.fillStyle = `rgba(245, 158, 11, ${(warmth / 100) * 0.35})`;
        ctx.globalCompositeOperation = 'color';
      } else {
        // Lạnh (Xanh Dương)
        ctx.fillStyle = `rgba(59, 130, 246, ${(Math.abs(warmth) / 100) * 0.35})`;
        ctx.globalCompositeOperation = 'color';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // 3. Phủ hiệu ứng tối góc Vignette
    if (vignette > 0) {
      ctx.save();
      const radius = Math.max(canvas.width, canvas.height) / 1.5;
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, radius * 0.4,
        canvas.width / 2, canvas.height / 2, radius
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${(vignette / 100) * 0.85})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    return canvas;
  };

  // Tải ảnh đã qua bộ lọc về máy
  const handleDownload = () => {
    if (!imageSrc) return;
    setIsProcessing(true);

    try {
      const canvas = renderCanvasOutput();
      if (!canvas) {
        showAlert('Không thể kết xuất hình ảnh.', 'Lỗi');
        return;
      }

      const quality = 0.95;
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const link = document.createElement('a');
      const originalName = imageFile?.name.replace(/\.[^/.]+$/, "") || 'photo';
      link.download = `${originalName}_filtered_${selectedPresetId}.jpg`;
      link.href = dataUrl;
      link.click();

      showAlert('Đã xuất và tải ảnh xử lý màu điện ảnh thành công!', 'Thành công');
    } catch (err: any) {
      console.error(err);
      showAlert(`Lỗi khi tải ảnh: ${err.message}`, 'Lỗi');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="photo-filter-container">
      {/* HEADER SECTION */}
      <header className="filter-header">
        <div className="filter-badge">
          <Sparkles size={16} />
          <span>Bộ Lọc Màu & Chỉnh Ảnh Điện Ảnh</span>
        </div>
        <h1>Photo Filter & Color Tone Studio</h1>
        <p>
          Biến những bức ảnh thông thường thành kiệt tác điện ảnh với các Filter nghệ thuật (Teal & Orange, Vintage Kodak, B&W Noir, Cyberpunk) và bộ thanh trượt cân chỉnh chuyên nghiệp (Độ sáng, Tương phản, Bão hòa, Nhiệt độ màu, Tối góc Vignette).
        </p>
      </header>

      {!imageSrc ? (
        <div className="upload-wrapper">
          <FileUploadZone 
            onFileSelect={handleFileSelect} 
            accept="image/*"
            hintText="Kéo thả hình ảnh (JPG, PNG, WebP) vào đây hoặc bấm để chọn tệp từ thiết bị"
          />
        </div>
      ) : (
        <div className="filter-workspace">
          {/* CỘT TRÁI: BỘ ĐIỀU KHIỂN & PRESETS */}
          <aside className="filter-sidebar">
            {/* DANH SÁCH BỘ LỌC PRESET CÓ SẴN */}
            <div className="sidebar-card">
              <div className="card-header-flex">
                <h3 className="card-title">
                  <Palette size={16} /> Bộ Lọc Điện Ảnh ({PRESETS.length})
                </h3>
                <button 
                  type="button" 
                  className="btn-reset-filter"
                  onClick={resetToDefault}
                  title="Đặt lại ảnh gốc"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              </div>

              <div className="preset-grid">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`preset-item-btn ${selectedPresetId === p.id ? 'active' : ''}`}
                    onClick={() => applyPreset(p)}
                  >
                    <div 
                      className="preset-thumb-color" 
                      style={{ background: p.previewColor }}
                    />
                    <div className="preset-item-info">
                      <span className="preset-name">{p.name}</span>
                      <span className="preset-cat">{p.category}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* BỘ THANH TRƯỢT TINH CHỈNH CHI TIẾT */}
            <div className="sidebar-card mt-3">
              <h3 className="card-title mb-3">
                <Sliders size={16} /> Tinh Chỉnh Thủ Công
              </h3>

              {/* ĐỘ SÁNG */}
              <div className="control-slider-group">
                <div className="slider-label-row">
                  <span><Sun size={14} /> Độ sáng (Brightness):</span>
                  <strong>{brightness}%</strong>
                </div>
                <input 
                  type="range" 
                  min={20} 
                  max={180} 
                  value={brightness} 
                  onChange={(e) => {
                    setBrightness(Number(e.target.value));
                    setSelectedPresetId('custom');
                  }} 
                  className="range-input"
                />
              </div>

              {/* TƯƠNG PHẢN */}
              <div className="control-slider-group">
                <div className="slider-label-row">
                  <span><Contrast size={14} /> Tương phản (Contrast):</span>
                  <strong>{contrast}%</strong>
                </div>
                <input 
                  type="range" 
                  min={30} 
                  max={180} 
                  value={contrast} 
                  onChange={(e) => {
                    setContrast(Number(e.target.value));
                    setSelectedPresetId('custom');
                  }} 
                  className="range-input"
                />
              </div>

              {/* ĐỘ BÃO HOÀ MÀU */}
              <div className="control-slider-group">
                <div className="slider-label-row">
                  <span><Flame size={14} /> Bão hoà màu (Saturation):</span>
                  <strong>{saturation}%</strong>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={200} 
                  value={saturation} 
                  onChange={(e) => {
                    setSaturation(Number(e.target.value));
                    setSelectedPresetId('custom');
                  }} 
                  className="range-input"
                />
              </div>

              {/* NHIỆT ĐỘ MÀU (WARMTH) */}
              <div className="control-slider-group">
                <div className="slider-label-row">
                  <span>🌡️ Nhiệt độ màu (Warmth):</span>
                  <strong>{warmth > 0 ? `+${warmth} (Ấm)` : warmth < 0 ? `${warmth} (Lạnh)` : 'Chuẩn'}</strong>
                </div>
                <input 
                  type="range" 
                  min={-50} 
                  max={50} 
                  value={warmth} 
                  onChange={(e) => {
                    setWarmth(Number(e.target.value));
                    setSelectedPresetId('custom');
                  }} 
                  className="range-input"
                />
              </div>

              {/* HIỆU ỨNG TỐI GÓC VIGNETTE */}
              <div className="control-slider-group">
                <div className="slider-label-row">
                  <span>📷 Tối góc (Vignette):</span>
                  <strong>{vignette}%</strong>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={80} 
                  value={vignette} 
                  onChange={(e) => {
                    setVignette(Number(e.target.value));
                    setSelectedPresetId('custom');
                  }} 
                  className="range-input"
                />
              </div>

              {/* ĐỘ MỜ BLUR */}
              <div className="control-slider-group">
                <div className="slider-label-row">
                  <span>🌫️ Làm mờ viền (Blur):</span>
                  <strong>{blur}px</strong>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={12} 
                  value={blur} 
                  onChange={(e) => {
                    setBlur(Number(e.target.value));
                    setSelectedPresetId('custom');
                  }} 
                  className="range-input"
                />
              </div>
            </div>

            {/* NÚT THAO TÁC XUẤT ẢNH */}
            <div className="sidebar-action-box mt-3">
              <button 
                type="button" 
                className="btn-download-filtered"
                onClick={handleDownload}
                disabled={isProcessing}
              >
                <Download size={18} />
                <span>Tải Ảnh Chất Lượng Cao (JPG)</span>
              </button>

              <button 
                type="button" 
                className="btn-choose-other-img"
                onClick={() => {
                  setImageSrc(null);
                  setImageFile(null);
                }}
              >
                <ImageIcon size={15} /> Chọn ảnh khác
              </button>
            </div>
          </aside>

          {/* CỘT PHẢI: KHUNG XEM TRỰC TIẾP & NÚT SO SÁNH */}
          <main className="filter-preview-main">
            <div className="preview-toolbar">
              <div className="preview-image-title">
                <strong>{imageFile?.name}</strong> • Filter: <span className="highlight-tag">{PRESETS.find(p => p.id === selectedPresetId)?.name || 'Tuỳ chỉnh'}</span>
              </div>

              {/* NÚT GIỮ ĐỂ SO SÁNH ẢNH GỐC */}
              <button 
                type="button"
                className={`btn-compare-hold ${isComparing ? 'active' : ''}`}
                onMouseDown={() => setIsComparing(true)}
                onMouseUp={() => setIsComparing(false)}
                onMouseLeave={() => setIsComparing(false)}
                onTouchStart={() => setIsComparing(true)}
                onTouchEnd={() => setIsComparing(false)}
                title="Bấm và giữ để so sánh với ảnh gốc"
              >
                <Eye size={15} />
                <span>{isComparing ? 'Đang hiện ảnh gốc' : 'Giữ xem ảnh gốc'}</span>
              </button>
            </div>

            {/* STAGE HIỂN THỊ ẢNH VỚI CSS FILTER & OVERLAYS */}
            <div className="filter-canvas-stage">
              <div className="filter-stage-inner">
                <img 
                  src={imageSrc} 
                  alt="Preview" 
                  className="filter-target-img"
                  style={{
                    filter: isComparing ? 'none' : filterStyleString,
                    transition: 'filter 0.15s ease'
                  }}
                />

                {/* OVERLAY WARMTH */}
                {!isComparing && warmth !== 0 && (
                  <div 
                    className="overlay-warmth" 
                    style={{
                      background: warmth > 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(59, 130, 246, 0.4)',
                      opacity: Math.abs(warmth) / 100
                    }} 
                  />
                )}

                {/* OVERLAY VIGNETTE */}
                {!isComparing && vignette > 0 && (
                  <div 
                    className="overlay-vignette"
                    style={{
                      background: `radial-gradient(circle at center, transparent 40%, rgba(0,0,0,${(vignette / 100) * 0.9}) 100%)`
                    }}
                  />
                )}
              </div>
            </div>

            <div className="preview-footer-note">
              💡 <strong>Mẹo:</strong> Nhấn giữ nút <strong>"Giữ xem ảnh gốc"</strong> ở góc trên bên phải để dễ dàng đối chiếu sự khác biệt giữa ảnh sau khi blend màu và ảnh ban đầu.
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default PhotoFilterStudio;

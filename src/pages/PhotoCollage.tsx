import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutGrid, 
  Upload, 
  Download, 
  Trash2, 
  RotateCw, 
  Sliders, 
  Palette, 
  Image as ImageIcon,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './PhotoCollage.css';

interface CollageCell {
  id: string;
  imgUrl: string | null;
  imgElement: HTMLImageElement | null;
  zoom: number; // 1.0 -> 3.0
  offsetX: number; // px
  offsetY: number; // px
  rotation: number; // 0, 90, 180, 270
}

interface LayoutTemplate {
  id: string;
  name: string;
  photoCount: number;
  // Mảng các ô theo tỷ lệ %: [x, y, width, height]
  cells: Array<{ x: number; y: number; w: number; h: number }>;
}

const TEMPLATES: LayoutTemplate[] = [
  // 2 ảnh
  {
    id: '2-vertical',
    name: '2 Ảnh Cột Dọc (1:1)',
    photoCount: 2,
    cells: [
      { x: 0, y: 0, w: 50, h: 100 },
      { x: 50, y: 0, w: 50, h: 100 }
    ]
  },
  {
    id: '2-horizontal',
    name: '2 Ảnh Hàng Ngang',
    photoCount: 2,
    cells: [
      { x: 0, y: 0, w: 100, h: 50 },
      { x: 0, y: 50, w: 100, h: 50 }
    ]
  },
  // 3 ảnh
  {
    id: '3-tri-left',
    name: '3 Ảnh (1 Lớn Trái + 2 Nhỏ Phải)',
    photoCount: 3,
    cells: [
      { x: 0, y: 0, w: 60, h: 100 },
      { x: 60, y: 0, w: 40, h: 50 },
      { x: 60, y: 50, w: 40, h: 50 }
    ]
  },
  {
    id: '3-columns',
    name: '3 Ảnh Cột Song Song',
    photoCount: 3,
    cells: [
      { x: 0, y: 0, w: 33.333, h: 100 },
      { x: 33.333, y: 0, w: 33.333, h: 100 },
      { x: 66.666, y: 0, w: 33.334, h: 100 }
    ]
  },
  // 4 ảnh
  {
    id: '4-grid',
    name: '4 Ảnh Vuông Cân Đối (2x2)',
    photoCount: 4,
    cells: [
      { x: 0, y: 0, w: 50, h: 50 },
      { x: 50, y: 0, w: 50, h: 50 },
      { x: 0, y: 50, w: 50, h: 50 },
      { x: 50, y: 50, w: 50, h: 50 }
    ]
  },
  {
    id: '4-top-hero',
    name: '4 Ảnh (1 Bìa Trên + 3 Dưới)',
    photoCount: 4,
    cells: [
      { x: 0, y: 0, w: 100, h: 60 },
      { x: 0, y: 60, w: 33.333, h: 40 },
      { x: 33.333, y: 60, w: 33.333, h: 40 },
      { x: 66.666, y: 60, w: 33.334, h: 40 }
    ]
  },
  // 5 ảnh
  {
    id: '5-mosaic',
    name: '5 Ảnh Mosaic Nghệ Thuật',
    photoCount: 5,
    cells: [
      { x: 0, y: 0, w: 50, h: 60 },
      { x: 50, y: 0, w: 50, h: 60 },
      { x: 0, y: 60, w: 33.333, h: 40 },
      { x: 33.333, y: 60, w: 33.333, h: 40 },
      { x: 66.666, y: 60, w: 33.334, h: 40 }
    ]
  },
  // 6 ảnh
  {
    id: '6-grid',
    name: '6 Ảnh Lưới (3x2)',
    photoCount: 6,
    cells: [
      { x: 0, y: 0, w: 33.333, h: 50 },
      { x: 33.333, y: 0, w: 33.333, h: 50 },
      { x: 66.666, y: 0, w: 33.334, h: 50 },
      { x: 0, y: 50, w: 33.333, h: 50 },
      { x: 33.333, y: 50, w: 33.333, h: 50 },
      { x: 66.666, y: 50, w: 33.334, h: 50 }
    ]
  },
  // 9 ảnh
  {
    id: '9-grid',
    name: '9 Ảnh Instagram Grid (3x3)',
    photoCount: 9,
    cells: [
      { x: 0, y: 0, w: 33.333, h: 33.333 },
      { x: 33.333, y: 0, w: 33.333, h: 33.333 },
      { x: 66.666, y: 0, w: 33.334, h: 33.333 },
      { x: 0, y: 33.333, w: 33.333, h: 33.333 },
      { x: 33.333, y: 33.333, w: 33.333, h: 33.333 },
      { x: 66.666, y: 33.333, w: 33.334, h: 33.333 },
      { x: 0, y: 66.666, w: 33.333, h: 33.334 },
      { x: 33.333, y: 66.666, w: 33.333, h: 33.334 },
      { x: 66.666, y: 66.666, w: 33.334, h: 33.334 }
    ]
  }
];

const ASPECT_RATIOS = [
  { id: '1:1', name: '1:1 (Vuông Instagram)', width: 1200, height: 1200 },
  { id: '4:5', name: '4:5 (Dọc Facebook/Insta Feed)', width: 1080, height: 1350 },
  { id: '16:9', name: '16:9 (Ngang Màn Hình/Youtube)', width: 1920, height: 1080 },
  { id: '9:16', name: '9:16 (Story/Reels/TikTok)', width: 1080, height: 1920 },
  { id: '4:3', name: '4:3 (Tiêu Chuẩn Cổ Điển)', width: 1600, height: 1200 }
];

const BORDER_COLORS = [
  '#ffffff',
  '#000000',
  '#f8fafc',
  '#f1f5f9',
  '#e2e8f0',
  '#fef3c7',
  '#fee2e2',
  '#dcfce7',
  '#e0e7ff',
  '#fae8ff'
];

const PhotoCollage: React.FC = () => {
  const { showAlert } = useNotification();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('4-grid');
  const [aspectRatioId, setAspectRatioId] = useState<string>('1:1');
  const [spacing, setSpacing] = useState<number>(12); // Khoảng cách giữa các ảnh (px)
  const [borderRadius, setBorderRadius] = useState<number>(8); // Bo góc
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [activeCellIdx, setActiveCellIdx] = useState<number | null>(null);

  // Danh sách các cell lưu dữ liệu ảnh
  const [cells, setCells] = useState<CollageCell[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[4];
  const currentRatio = ASPECT_RATIOS.find(r => r.id === aspectRatioId) || ASPECT_RATIOS[0];

  // Khởi tạo các cell tương ứng với template được chọn
  useEffect(() => {
    setCells(prevCells => {
      const newCells: CollageCell[] = [];
      for (let i = 0; i < currentTemplate.cells.length; i++) {
        // Giữ lại dữ liệu ảnh cũ nếu còn
        if (prevCells[i]) {
          newCells.push(prevCells[i]);
        } else {
          newCells.push({
            id: `cell-${i}-${Date.now()}`,
            imgUrl: null,
            imgElement: null,
            zoom: 1.0,
            offsetX: 0,
            offsetY: 0,
            rotation: 0
          });
        }
      }
      return newCells;
    });
  }, [selectedTemplateId, currentTemplate.cells.length]);

  // Vẽ Canvas Collage mỗi khi có thay đổi
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Thiết lập kích thước Canvas xuất ảnh chuẩn High-Res
    const canvasW = currentRatio.width;
    const canvasH = currentRatio.height;
    canvas.width = canvasW;
    canvas.height = canvasH;

    // 1. Tô màu nền (Border & Spacing Color)
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // 2. Vẽ từng ô ảnh
    currentTemplate.cells.forEach((layoutCell, index) => {
      const cellData = cells[index];
      
      // Tính toạ độ cell trên Canvas thực tế kèm khoảng cách spacing
      const pad = spacing;
      const left = (layoutCell.x / 100) * canvasW + pad / 2;
      const top = (layoutCell.y / 100) * canvasH + pad / 2;
      const width = (layoutCell.w / 100) * canvasW - pad;
      const height = (layoutCell.h / 100) * canvasH - pad;

      if (width <= 0 || height <= 0) return;

      ctx.save();

      // Tạo đường cắt bo góc cho Cell
      ctx.beginPath();
      const r = Math.min(borderRadius * (canvasW / 800), width / 2, height / 2);
      ctx.roundRect(left, top, width, height, r);
      ctx.clip();

      if (cellData && cellData.imgElement) {
        // Vẽ ảnh fit hoặc fill theo tỉ lệ kèm zoom, offset, xoay
        const img = cellData.imgElement;
        const imgW = img.naturalWidth || img.width;
        const imgH = img.naturalHeight || img.height;

        ctx.save();
        // Tâm ô ảnh
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        ctx.translate(centerX + cellData.offsetX, centerY + cellData.offsetY);
        ctx.rotate((cellData.rotation * Math.PI) / 180);

        // Tính tỉ lệ cover
        const scale = Math.max(width / imgW, height / imgH) * cellData.zoom;
        const drawW = imgW * scale;
        const drawH = imgH * scale;

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      } else {
        // Ô trống: vẽ màu nền xám nhẹ
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(left, top, width, height);

        // Viền đứt nét báo hiệu ô trống
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [cells, currentTemplate, currentRatio, spacing, borderRadius, bgColor]);

  // Upload nhiều ảnh cùng lúc
  const handleMultipleFilesUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    fileArray.forEach((file, fileIdx) => {
      // Tìm ô trống đầu tiên hoặc gán theo thứ tự
      const targetIdx = cells.findIndex((c, idx) => !c.imgUrl && idx >= fileIdx) !== -1 
        ? cells.findIndex((c, idx) => !c.imgUrl && idx >= fileIdx) 
        : fileIdx % cells.length;

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setCells(prev => {
            const next = [...prev];
            if (next[targetIdx]) {
              next[targetIdx] = {
                ...next[targetIdx],
                imgUrl: url,
                imgElement: img,
                zoom: 1.0,
                offsetX: 0,
                offsetY: 0,
                rotation: 0
              };
            }
            return next;
          });
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    });

    showAlert(`Đã nạp ${fileArray.length} hình ảnh vào khung lưới collage!`, 'Thành công');
  };

  // Chọn ảnh cho 1 ô cụ thể
  const handleSelectImageForCell = (index: number) => {
    setActiveCellIdx(index);
    fileInputRef.current?.click();
  };

  const handleCellFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeCellIdx === null) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setCells(prev => {
          const next = [...prev];
          if (next[activeCellIdx]) {
            next[activeCellIdx] = {
              ...next[activeCellIdx],
              imgUrl: url,
              imgElement: img,
              zoom: 1.0,
              offsetX: 0,
              offsetY: 0,
              rotation: 0
            };
          }
          return next;
        });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Xoay ảnh 90 độ
  const handleRotateCell = (index: number) => {
    setCells(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          rotation: (next[index].rotation + 90) % 360
        };
      }
      return next;
    });
  };

  // Xoá ảnh trong 1 ô
  const handleRemoveImageCell = (index: number) => {
    setCells(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          imgUrl: null,
          imgElement: null,
          zoom: 1.0,
          offsetX: 0,
          offsetY: 0,
          rotation: 0
        };
      }
      return next;
    });
  };

  // Tải ảnh Collage hoàn thiện về máy
  const handleDownloadCollage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hasAnyImage = cells.some(c => c.imgUrl !== null);
    if (!hasAnyImage) {
      showAlert('Vui lòng thêm ít nhất 1 ảnh vào khung lưới trước khi tải xuống.', 'Thông báo');
      return;
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `photo_collage_${Date.now()}.jpg`;
    link.href = dataUrl;
    link.click();
    showAlert('Đã xuất và tải ảnh ghép Collage độ nét cao thành công!', 'Thành công');
  };

  // Đổi ngẫu nhiên thứ tự ảnh giữa các ô
  const handleShufflePhotos = () => {
    setCells(prev => {
      const validImages = prev.filter(c => c.imgUrl !== null);
      if (validImages.length < 2) return prev;
      
      const shuffledImages = [...validImages].sort(() => Math.random() - 0.5);
      let imgIdx = 0;
      return prev.map(cell => {
        if (cell.imgUrl !== null) {
          const nextImg = shuffledImages[imgIdx++];
          return {
            ...cell,
            imgUrl: nextImg.imgUrl,
            imgElement: nextImg.imgElement
          };
        }
        return cell;
      });
    });
  };

  return (
    <div className="photo-collage-container">
      {/* ẨN INPUT ĐỂ GỌI TRỰC TIẾP TỪ Ô */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        onChange={handleCellFileInputChange} 
        style={{ display: 'none' }} 
      />

      {/* HEADER SECTION */}
      <header className="collage-header">
        <div className="collage-badge">
          <LayoutGrid size={16} />
          <span>Tiện Ích Thiết Kế Ảnh Collage</span>
        </div>
        <h1>Ghép Ảnh & Tạo Khung Lưới Nghệ Thuật (Photo Grid Studio)</h1>
        <p>
          Ghép nhiều bức ảnh vào các bố cục khung lưới nghệ thuật (2 đến 9 ảnh). Dễ dàng tinh chỉnh viền khung, bo góc tròn, tỷ lệ khung hình đăng Facebook, Story Instagram, TikTok với chất lượng Ultra HD.
        </p>
      </header>

      <div className="collage-workspace">
        {/* CỘT TRÁI: BẢNG CÔNG CỤ ĐIỀU CHỈNH */}
        <aside className="collage-sidebar">
          {/* UPLOAD NHIỀU ẢNH */}
          <div className="sidebar-section">
            <h3 className="section-title">
              <Upload size={16} /> Nạp Ảnh Vào Lưới
            </h3>
            <label className="btn-batch-upload">
              <Plus size={16} />
              <span>Tải Nhiều Ảnh Lên Khung</span>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={(e) => e.target.files && handleMultipleFilesUpload(e.target.files)} 
                style={{ display: 'none' }}
              />
            </label>
            <div className="text-xs text-secondary mt-1">
              💡 Bạn cũng có thể bấm trực tiếp vào từng ô trên bản xem trước để thay ảnh.
            </div>
          </div>

          {/* CHỌN BỐ CỤC LƯỚI */}
          <div className="sidebar-section">
            <h3 className="section-title">
              <LayoutGrid size={16} /> Bố Cục Khung Lưới ({TEMPLATES.length} Mẫu)
            </h3>
            <div className="template-grid">
              {TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  type="button"
                  className={`template-card-btn ${selectedTemplateId === tmpl.id ? 'active' : ''}`}
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                >
                  <div className="template-mini-preview">
                    {tmpl.cells.map((c, i) => (
                      <span 
                        key={i} 
                        style={{
                          left: `${c.x}%`,
                          top: `${c.y}%`,
                          width: `${c.w}%`,
                          height: `${c.h}%`
                        }}
                      />
                    ))}
                  </div>
                  <span className="template-label">{tmpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TỶ LỆ KHUNG HÌNH (ASPECT RATIO) */}
          <div className="sidebar-section">
            <h3 className="section-title">
              <ImageIcon size={16} /> Tỷ Lệ Khung Hình
            </h3>
            <div className="ratio-pills">
              {ASPECT_RATIOS.map(ratio => (
                <button
                  key={ratio.id}
                  type="button"
                  className={`ratio-pill-btn ${aspectRatioId === ratio.id ? 'active' : ''}`}
                  onClick={() => setAspectRatioId(ratio.id)}
                >
                  {ratio.name}
                </button>
              ))}
            </div>
          </div>

          {/* TUỲ CHỈNH VIỀN & BO GÓC */}
          <div className="sidebar-section">
            <h3 className="section-title">
              <Sliders size={16} /> Khoảng Cách & Bo Góc
            </h3>
            <div className="slider-control-group">
              <div className="slider-header">
                <span>Độ dày viền (Spacing):</span>
                <strong>{spacing}px</strong>
              </div>
              <input 
                type="range" 
                min={0} 
                max={40} 
                value={spacing} 
                onChange={(e) => setSpacing(Number(e.target.value))} 
                className="range-input"
              />
            </div>

            <div className="slider-control-group mt-3">
              <div className="slider-header">
                <span>Bo góc ảnh (Radius):</span>
                <strong>{borderRadius}px</strong>
              </div>
              <input 
                type="range" 
                min={0} 
                max={30} 
                value={borderRadius} 
                onChange={(e) => setBorderRadius(Number(e.target.value))} 
                className="range-input"
              />
            </div>
          </div>

          {/* MÀU NỀN KHUNG VIỀN */}
          <div className="sidebar-section">
            <h3 className="section-title">
              <Palette size={16} /> Màu Viền Nền
            </h3>
            <div className="color-palette-row">
              {BORDER_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${bgColor === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setBgColor(c)}
                  title={c}
                />
              ))}
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)} 
                className="color-picker-native"
                title="Tự chọn mã màu bất kỳ"
              />
            </div>
          </div>

          {/* NÚT HOÁN ĐỔI & TẢI VỀ */}
          <div className="sidebar-section">
            <button 
              type="button" 
              className="btn-shuffle-photos"
              onClick={handleShufflePhotos}
            >
              <RefreshCw size={16} /> Đổi Ngẫu Nhiên Thứ Tự Ảnh
            </button>

            <button 
              type="button" 
              className="btn-download-collage"
              onClick={handleDownloadCollage}
            >
              <Download size={18} /> Tải Ảnh Ghép Hoàn Chỉnh (Ultra HD)
            </button>
          </div>
        </aside>

        {/* CỘT PHẢI: BÀN PREVIEW COLLAGE & CHỈNH TỪNG Ô */}
        <main className="collage-preview-main">
          <div className="preview-top-bar">
            <div className="preview-info">
              <span>Đang chọn bố cục: <strong>{currentTemplate.name}</strong></span>
              <span>• Kích cỡ xuất: <strong>{currentRatio.width} x {currentRatio.height}px</strong></span>
            </div>
          </div>

          <div className="canvas-interactive-stage">
            {/* CANVAS ẨN CHUẨN ĐỘ PHÂN GIẢI CAO ĐỂ XUẤT ẢNH */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* GIAO DIỆN TRỰC QUAN CHO NGƯỜI DÙNG XEM & THAO TÁC TRỰC TIẾP TRÊN MÀN HÌNH */}
            <div 
              className="interactive-grid-box"
              style={{
                aspectRatio: `${currentRatio.width} / ${currentRatio.height}`,
                backgroundColor: bgColor,
                padding: `${spacing / 2}px`
              }}
            >
              {currentTemplate.cells.map((layoutCell, idx) => {
                const cellData = cells[idx];
                const hasImg = !!cellData?.imgUrl;

                return (
                  <div
                    key={idx}
                    className={`grid-cell-item ${hasImg ? 'has-image' : 'empty'}`}
                    style={{
                      left: `${layoutCell.x}%`,
                      top: `${layoutCell.y}%`,
                      width: `${layoutCell.w}%`,
                      height: `${layoutCell.h}%`,
                      padding: `${spacing / 2}px`
                    }}
                  >
                    <div 
                      className="cell-inner"
                      style={{ borderRadius: `${borderRadius}px` }}
                      onClick={() => !hasImg && handleSelectImageForCell(idx)}
                    >
                      {hasImg ? (
                        <>
                          <img 
                            src={cellData.imgUrl!} 
                            alt={`Cell ${idx + 1}`} 
                            style={{
                              transform: `rotate(${cellData.rotation}deg) scale(${cellData.zoom})`
                            }}
                          />
                          {/* TOOLBAR THAO TÁC NHANH TRÊN Ô */}
                          <div className="cell-overlay-actions">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRotateCell(idx);
                              }}
                              title="Xoay 90 độ"
                            >
                              <RotateCw size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectImageForCell(idx);
                              }}
                              title="Đổi ảnh khác"
                            >
                              <Upload size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImageCell(idx);
                              }}
                              title="Xóa ảnh khỏi ô"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="empty-cell-placeholder">
                          <Plus size={24} className="text-secondary mb-1" />
                          <span className="text-xs text-secondary font-medium">Bấm chọn ảnh #{idx + 1}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="preview-footer-tip">
            💡 <strong>Mẹo chuyên nghiệp:</strong> Bạn có thể bấm nút Xoay <RotateCw size={12} style={{ display: 'inline' }} /> trên mỗi ô để chỉnh lại góc chụp, hoặc bấm <strong>Đổi Ngẫu Nhiên Thứ Tự Ảnh</strong> để tìm ra bố cục ưng ý nhất trước khi tải về.
          </div>
        </main>
      </div>
    </div>
  );
};

export default PhotoCollage;

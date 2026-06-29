import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, Loader2, UserSquare, Palette, Maximize, SlidersHorizontal } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import './IdPhotoMaker.css';

const BG_COLORS = [
  { id: 'blue', value: '#0b5ab0', label: 'Xanh dương' },
  { id: 'white', value: '#ffffff', label: 'Trắng' },
  { id: 'transparent', value: 'transparent', label: 'Trong suốt' }
];

const SIZES = [
  { id: '3x4', label: '3x4 cm' },
  { id: '4x6', label: '4x6 cm' },
  { id: 'original', label: 'Bản gốc' }
];

export default function IdPhotoMaker() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [bgColor, setBgColor] = useState<string>('#0b5ab0');
  const [photoSize, setPhotoSize] = useState<string>('3x4');
  
  // Customization controls
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
  }, [originalUrl]);

  // Reset controls when size or image changes
  useEffect(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, [photoSize, processedBlob]);

  // Redraw canvas whenever parameters change
  useEffect(() => {
    if (processedBlob && canvasRef.current) {
      drawToCanvas(processedBlob, bgColor, photoSize, zoom, panX, panY);
    }
  }, [processedBlob, bgColor, photoSize, zoom, panX, panY]);

  const drawToCanvas = async (
    imageBlob: Blob, 
    backgroundColor: string, 
    ratio: string,
    currentZoom: number,
    currentPanX: number,
    currentPanY: number
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const blobUrl = URL.createObjectURL(imageBlob);
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = blobUrl;
    });

    let targetWidth = img.width;
    let targetHeight = img.height;
    let destX = 0;
    let destY = 0;
    let destWidth = img.width;
    let destHeight = img.height;

    if (ratio !== 'original') {
      // Create an offscreen canvas to analyze pixels
      const offCanvas = document.createElement('canvas');
      offCanvas.width = img.width;
      offCanvas.height = img.height;
      const offCtx = offCanvas.getContext('2d');
      
      if (offCtx) {
        offCtx.drawImage(img, 0, 0);
        const imageData = offCtx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;
        
        let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
        
        // Scan pixels to find bounding box of the person (non-transparent pixels)
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const alpha = data[(y * img.width + x) * 4 + 3];
            if (alpha > 10) { 
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        
        if (minX <= maxX && minY <= maxY) {
          const bboxWidth = maxX - minX + 1;
          const bboxHeight = maxY - minY + 1;
          
          const targetRatio = ratio === '3x4' ? 3 / 4 : 4 / 6;
          
          // Add 30% padding to width for shoulders
          let calcWidth = bboxWidth * 1.3;
          let calcHeight = calcWidth / targetRatio;
          
          // Ensure height has at least 15% padding
          if (calcHeight < bboxHeight * 1.15) {
            calcHeight = bboxHeight * 1.15;
            calcWidth = calcHeight * targetRatio;
          }
          
          targetWidth = calcWidth;
          targetHeight = calcHeight;
          
          // Top padding for the head is roughly 10% of total height
          const topPadding = targetHeight * 0.1;
          destY = topPadding - minY;
          
          // Horizontally center the bounding box
          const horizontalPadding = (targetWidth - bboxWidth) / 2;
          destX = horizontalPadding - minX;
        }
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Apply custom zoom and pan
    const finalDestWidth = destWidth * currentZoom;
    const finalDestHeight = destHeight * currentZoom;
    
    // Zoom from center of the image bounding box
    const centerX = destX + destWidth / 2;
    const centerY = destY + destHeight / 2;
    
    const finalDestX = centerX - finalDestWidth / 2 + currentPanX;
    const finalDestY = centerY - finalDestHeight / 2 + currentPanY;

    // Draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw foreground (person)
    ctx.drawImage(img, finalDestX, finalDestY, finalDestWidth, finalDestHeight);
    URL.revokeObjectURL(blobUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFileSelection(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = async (file: File) => {
    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    
    // Auto start processing
    processImage(url);
  };

  const processImage = async (imageUrl: string) => {
    setIsProcessing(true);
    setProgress(0);
    setProgressText('Đang tải mô hình AI (chỉ lần đầu)...');

    try {
      const blob = await removeBackground(imageUrl, {
        progress: (key: string, current: number, total: number) => {
          if (key === 'compute:inference') {
            setProgressText('Đang xử lý tách nền...');
            setProgress(Math.round((current / total) * 100));
          } else {
            setProgressText('Đang tải dữ liệu AI...');
          }
        }
      });
      
      setProcessedBlob(blob);
      setProgressText('Hoàn tất!');
    } catch (error) {
      console.error('Lỗi khi tách nền:', error);
      alert('Đã xảy ra lỗi khi tách nền. Vui lòng thử lại với ảnh khác.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startOver = () => {
    setOriginalFile(null);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl('');
    setProcessedBlob(null);
    setProgress(0);
    setProgressText('');
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const format = bgColor === 'transparent' ? 'image/png' : 'image/jpeg';
    const extension = bgColor === 'transparent' ? 'png' : 'jpg';

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Anh_The_${photoSize}_${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, format, 1.0);
  };

  return (
    <div className="id-photo-container animate-fade-in">
      <div className="id-photo-header">
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Tạo Ảnh Thẻ AI</h1>
        <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Tự động tách nền và thay đổi phông màu xanh/trắng chuẩn ảnh thẻ. Hoàn toàn bảo mật vì xử lý 100% trên trình duyệt.
        </p>
      </div>

      {!originalFile ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <div 
            className={`id-photo-dropzone ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UserSquare size={48} className="text-primary" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>Tải ảnh chân dung của bạn lên</h3>
            <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>Hỗ trợ JPG, PNG</p>
            <button className="btn btn-primary">Chọn Ảnh</button>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      ) : (
        <div className="id-photo-layout">
          <div className="id-photo-preview-area">
            {isProcessing ? (
              <div className="progress-overlay">
                <Loader2 size={48} className="text-primary animate-spin" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{progressText}</h3>
                <div style={{ width: '200px', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s' }}></div>
                </div>
                <p className="text-secondary" style={{ marginTop: '1rem', fontSize: '0.875rem', textAlign: 'center', maxWidth: '300px' }}>
                  Lần đầu chạy có thể mất vài chục giây để tải bộ xử lý AI. Các lần sau sẽ rất nhanh.
                </p>
              </div>
            ) : null}
            
            <div className="canvas-container" style={{ display: processedBlob ? 'flex' : 'none' }}>
              <canvas ref={canvasRef}></canvas>
            </div>
          </div>
          
          <div className="id-photo-sidebar">
            <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Palette size={20} className="text-primary" />
              Tuỳ chỉnh Phông Nền
            </h3>
            
            <div className="color-options" style={{ marginBottom: '1rem' }}>
              {BG_COLORS.map(color => (
                <div 
                  key={color.id}
                  className={`color-btn color-${color.id} ${bgColor === color.value ? 'active' : ''}`}
                  onClick={() => setBgColor(color.value)}
                  title={color.label}
                />
              ))}
            </div>

            <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <Maximize size={20} className="text-primary" />
              Kích thước ảnh
            </h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {SIZES.map(size => (
                <button
                  key={size.id}
                  className={`btn ${photoSize === size.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPhotoSize(size.id)}
                  style={{ flex: 1, padding: '0.5rem' }}
                >
                  {size.label}
                </button>
              ))}
            </div>

            <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <SlidersHorizontal size={20} className="text-primary" />
              Căn chỉnh thủ công
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <label>Phóng to / Thu nhỏ</label>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.5" 
                  step="0.05" 
                  value={zoom} 
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <label>Di chuyển Lên / Xuống</label>
                </div>
                <input 
                  type="range" 
                  min="-500" 
                  max="500" 
                  step="10" 
                  value={panY} 
                  onChange={(e) => setPanY(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <label>Di chuyển Trái / Phải</label>
                </div>
                <input 
                  type="range" 
                  min="-500" 
                  max="500" 
                  step="10" 
                  value={panX} 
                  onChange={(e) => setPanX(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={downloadImage}
              disabled={isProcessing || !processedBlob}
            >
              <Download size={20} />
              Tải Ảnh Về Máy
            </button>
            
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={startOver}
              disabled={isProcessing}
            >
              <RefreshCw size={20} />
              Chọn Ảnh Khác
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

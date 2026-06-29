import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, Loader2, UserSquare, Palette } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import './IdPhotoMaker.css';

const BG_COLORS = [
  { id: 'blue', value: '#0b5ab0', label: 'Xanh dương' },
  { id: 'white', value: '#ffffff', label: 'Trắng' },
  { id: 'transparent', value: 'transparent', label: 'Trong suốt' }
];

export default function IdPhotoMaker() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [bgColor, setBgColor] = useState<string>('#0b5ab0');
  
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

  // Redraw canvas whenever processed blob or background color changes
  useEffect(() => {
    if (processedBlob && canvasRef.current) {
      drawToCanvas(processedBlob, bgColor);
    }
  }, [processedBlob, bgColor]);

  const drawToCanvas = async (imageBlob: Blob, backgroundColor: string) => {
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

    canvas.width = img.width;
    canvas.height = img.height;

    // Draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw foreground (person)
    ctx.drawImage(img, 0, 0);
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
      a.download = `Anh_The_${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, format, 0.95);
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
            
            <div className="color-options">
              {BG_COLORS.map(color => (
                <div 
                  key={color.id}
                  className={`color-btn color-${color.id} ${bgColor === color.value ? 'active' : ''}`}
                  onClick={() => setBgColor(color.value)}
                  title={color.label}
                />
              ))}
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

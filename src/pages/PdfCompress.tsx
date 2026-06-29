import React, { useState, useRef } from 'react';
import { Upload, Download, Settings, RefreshCw, CheckCircle2, Info, FileBox } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from "jspdf";
import './PdfCompress.css';

// Set worker path for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function PdfCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState('medium');
  const [targetSizeMB, setTargetSizeMB] = useState(1);
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setOriginalSize(droppedFile.size);
      resetState();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setOriginalSize(selectedFile.size);
      resetState();
    }
  };

  const resetState = () => {
    setResultUrl(null);
    setCompressedSize(0);
    setProgress(0);
  };

  const startOver = () => {
    setFile(null);
    resetState();
  };

  const processPDF = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const typedarray = new Uint8Array(arrayBuffer);
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
      
      const newPdf = new jsPDF({ unit: 'pt', format: 'a4' });
      newPdf.deletePage(1);

      let remainingBytes = compressionLevel === 'target' ? targetSizeMB * 1024 * 1024 * 0.95 : 0; 
      let remainingPages = pdf.numPages;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        
        let initialScale = 1.5;
        let settings: any = null;

        if (compressionLevel !== 'target') {
          settings = {
            small: { scale: 1.0, quality: 0.4 },
            medium: { scale: 1.5, quality: 0.7 },
            high: { scale: 2.0, quality: 0.9 },
            larger: { scale: 3.5, quality: 1.0 },
          }[compressionLevel];
          initialScale = settings.scale;
        } else {
          initialScale = 2.0; 
        }

        const viewport = page.getViewport({ scale: initialScale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport: viewport } as any).promise;

        if (isGrayscale) {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          for (let j = 0; j < data.length; j += 4) {
            let lum = 0.299 * data[j] + 0.587 * data[j+1] + 0.114 * data[j+2];
            if (lum > 200) lum = 255;
            else if (lum < 100) lum = Math.max(0, lum - 30);
            
            data[j] = lum;
            data[j+1] = lum;
            data[j+2] = lum;
          }
          ctx.putImageData(imgData, 0, 0);
        }

        let finalImgData = '';
        let finalWidth = viewport.width;
        let finalHeight = viewport.height;

        if (compressionLevel === 'target') {
          let targetBytesForThisPage = remainingBytes / remainingPages;
          let currentScaleMultiplier = 1.0; 
          let currentQuality = 0.8;

          while (true) {
            let testCanvas = canvas;
            if (currentScaleMultiplier < 1.0) {
              testCanvas = document.createElement('canvas');
              testCanvas.width = Math.floor(canvas.width * currentScaleMultiplier);
              testCanvas.height = Math.floor(canvas.height * currentScaleMultiplier);
              const testCtx = testCanvas.getContext('2d');
              testCtx?.drawImage(canvas, 0, 0, testCanvas.width, testCanvas.height);
            }

            finalImgData = testCanvas.toDataURL('image/jpeg', currentQuality);
            let approxBytes = finalImgData.length * 0.75;

            if (approxBytes <= targetBytesForThisPage || (currentScaleMultiplier <= 0.4 && currentQuality <= 0.2)) {
              finalWidth = testCanvas.width;
              finalHeight = testCanvas.height;
              remainingBytes -= approxBytes;
              remainingPages--;
              break;
            }

            if (currentQuality > 0.4) {
              currentQuality -= 0.15; 
            } else if (currentScaleMultiplier > 0.5) {
              currentScaleMultiplier -= 0.15; 
              currentQuality = 0.5; 
            } else if (currentQuality > 0.2) {
              currentQuality -= 0.1;
            } else {
              currentScaleMultiplier -= 0.1;
            }
          }
        } else {
          finalImgData = canvas.toDataURL('image/jpeg', settings.quality);
        }

        const orientation = finalWidth > finalHeight ? 'l' : 'p';
        newPdf.addPage([finalWidth, finalHeight], orientation);
        newPdf.addImage(finalImgData, 'JPEG', 0, 0, finalWidth, finalHeight);

        setProgress(Math.round((i / pdf.numPages) * 100));
      }

      const pdfBlob = newPdf.output('blob');
      setResultUrl(URL.createObjectURL(pdfBlob));
      setCompressedSize(pdfBlob.size);
      setIsProcessing(false);
      setProgress(100);
      
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      alert("Có lỗi xảy ra trong quá trình chuyển đổi.");
    }
  };

  return (
    <div className="pdf-compress-container animate-fade-in">
      <div className="compress-header">
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Công Cụ Tối Ưu PDF</h1>
        <p className="text-secondary">Nén hoặc tăng dung lượng file PDF trực tiếp trên trình duyệt</p>
      </div>

      {!resultUrl ? (
        <div className="glass-card">
          {!file ? (
            <div 
              className={`dropzone ${isDragging ? 'drag-active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={48} className="text-primary" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>Tải file PDF lên</h3>
              <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>Kéo thả file vào đây hoặc nhấn để chọn file từ máy tính</p>
              <button className="btn btn-secondary">
                Chọn File PDF
              </button>
              <input 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                  <FileBox size={24} className="text-primary" />
                  <div style={{ overflow: 'hidden' }}>
                    <h4 style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</h4>
                    <p className="text-secondary" style={{ fontSize: '0.875rem' }}>{formatBytes(originalSize)}</p>
                  </div>
                </div>
                <button 
                  onClick={startOver}
                  className="icon-btn"
                  disabled={isProcessing}
                  title="Chọn file khác"
                >
                  <RefreshCw size={20} />
                </button>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Tùy chọn xử lý</h3>
              
              <div className="options-grid">
                {[
                  { id: 'small', title: 'Nén Tối Đa', desc: 'Giảm dung lượng xuống mức nhỏ nhất (chất lượng hiển thị giảm).' },
                  { id: 'medium', title: 'Nén Cân Bằng', desc: 'Khuyên dùng. Cân bằng tốt giữa dung lượng và chất lượng.' },
                  { id: 'high', title: 'Chất Lượng Cao', desc: 'Giữ chất lượng hình ảnh nét, mức độ nén thấp.' },
                  { id: 'larger', title: 'Tăng Dung Lượng', desc: 'Phóng to nội dung và tăng kích thước file so với gốc.' }
                ].map(opt => (
                  <div 
                    key={opt.id}
                    className={`option-card ${compressionLevel === opt.id ? 'active' : ''}`}
                    onClick={() => setCompressionLevel(opt.id)}
                  >
                    <div className="option-card-header">
                      <span className="option-card-title">{opt.title}</span>
                      {compressionLevel === opt.id && <CheckCircle2 size={20} className="text-primary" />}
                    </div>
                    <p className="option-card-desc">{opt.desc}</p>
                  </div>
                ))}

                <div 
                  className={`option-card ${compressionLevel === 'target' ? 'active' : ''}`}
                  style={{ gridColumn: '1 / -1' }}
                  onClick={() => setCompressionLevel('target')}
                >
                  <div className="option-card-header">
                    <span className="option-card-title">Ép dung lượng theo ý muốn</span>
                    {compressionLevel === 'target' && <CheckCircle2 size={20} className="text-primary" />}
                  </div>
                  <p className="option-card-desc">Hệ thống sẽ tự động tính toán chất lượng nén từng trang để file xuất ra không vượt quá dung lượng bạn yêu cầu.</p>
                  
                  {compressionLevel === 'target' && (
                    <div className="target-size-input" onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Dung lượng tối đa (MB):</span>
                      <input 
                        type="number" 
                        min="0.1" 
                        step="0.1" 
                        value={targetSizeMB} 
                        onChange={(e) => setTargetSizeMB(Number(e.target.value))} 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div 
                className={`grayscale-option ${isGrayscale ? 'active' : ''}`}
                onClick={() => setIsGrayscale(!isGrayscale)}
              >
                <input 
                  type="checkbox" 
                  checked={isGrayscale}
                  onChange={() => {}} // Handle by wrapper onClick
                />
                <div>
                  <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Tối ưu hóa văn bản (Đen Trắng)</h4>
                  <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Bật tính năng này nếu tài liệu chủ yếu là chữ. Hệ thống sẽ khử màu và tăng độ tương phản, giúp nén file cực nhỏ mà <strong>chữ vẫn sắc nét</strong>.</p>
                </div>
              </div>

              <div className="info-note">
                <Info size={20} />
                <p>
                  <strong>Lưu ý:</strong> Công cụ này hoạt động trực tiếp trên trình duyệt bằng cách render lại các trang PDF dưới dạng hình ảnh. Điều này giúp nén/thay đổi kích thước nhưng <strong>các đoạn văn bản sẽ không thể bôi đen hay copy được nữa</strong>.
                </p>
              </div>

              {isProcessing ? (
                <div className="progress-container">
                  <div className="progress-header">
                    <span>Đang xử lý...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={processPDF}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '1rem' }}
                >
                  <Settings size={20} />
                  Bắt đầu xử lý
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card result-container">
          <div className="result-icon">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="result-title">Đã Xử Lý Thành Công!</h2>
          <p className="result-desc">File PDF của bạn đã sẵn sàng để tải xuống.</p>

          <div className="stats-container">
            <div className="stat-box">
              <p className="stat-label">Dung lượng gốc</p>
              <p className="stat-value">{formatBytes(originalSize)}</p>
            </div>
            
            <div style={{ color: 'var(--border)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>

            <div className="stat-box primary">
              <p className="stat-label">Dung lượng mới</p>
              <p className="stat-value">{formatBytes(compressedSize)}</p>
              {compressedSize > originalSize ? (
                <span className="stat-badge increase">
                  +{(compressedSize / originalSize * 100 - 100).toFixed(0)}%
                </span>
              ) : (
                <span className="stat-badge decrease">
                  -{(100 - compressedSize / originalSize * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>

          <div className="result-actions">
            <a 
              href={resultUrl} 
              download={`processed_${file?.name}`}
              className="btn btn-primary"
              style={{ padding: '1rem 2rem', fontSize: '1.05rem' }}
            >
              <Download size={20} />
              Tải Xuống Ngay
            </a>
            <button 
              onClick={startOver}
              className="btn btn-secondary"
              style={{ padding: '1rem 2rem', fontSize: '1.05rem' }}
            >
              <RefreshCw size={20} />
              Làm Lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

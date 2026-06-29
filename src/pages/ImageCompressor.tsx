import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Download, Settings, RefreshCw, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import FileUploadZone from '../components/FileUploadZone';
import './ImageCompressor.css';

export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [originalStats, setOriginalStats] = useState<{size: number, width: number, height: number, type: string} | null>(null);
  
  const [targetSize, setTargetSize] = useState('');
  const [targetUnit, setTargetUnit] = useState('KB');
  
  const [processedUrl, setProcessedUrl] = useState('');
  const [processedStats, setProcessedStats] = useState<{size: number, width: number, height: number, type: string} | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Byte';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Byte', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const handleFileSelect = (files: FileList | null) => {
    const selectedFile = files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      processInitialFile(selectedFile);
    } else {
      setError('Vui lòng chọn một định dạng ảnh hợp lệ (JPG, PNG, WEBP).');
    }
  };

  const processInitialFile = (selectedFile: File) => {
    setFile(selectedFile);
    setProcessedUrl('');
    setProcessedStats(null);
    setError('');
    setWarning('');

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setOriginalStats({
        size: selectedFile.size,
        width: img.width,
        height: img.height,
        type: selectedFile.type
      });
      
      const suggestedBytes = selectedFile.size * 0.8;
      if (suggestedBytes >= 1024 * 1024) {
        setTargetSize((suggestedBytes / (1024 * 1024)).toFixed(2));
        setTargetUnit('MB');
      } else {
        setTargetSize(Math.round(suggestedBytes / 1024).toString());
        setTargetUnit('KB');
      }
    };
    img.src = url;
  };

  const optimizeImage = async () => {
    if (!file || !targetSize || !originalStats) {
      setError('Vui lòng tải ảnh lên và nhập dung lượng mong muốn.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setWarning('');

    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise(r => img.onload = r);

      const multiplier = targetUnit === 'MB' ? 1024 * 1024 : 1024;
      const targetBytes = parseFloat(targetSize) * multiplier;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context not available");

      let bestBlob: Blob | null = null;

      if (targetBytes >= originalStats.size) {
        let currentScale = 1.0;
        let found = false;
        
        for(let attempt = 0; attempt < 8; attempt++) {
          canvas.width = Math.round(img.width * currentScale);
          canvas.height = Math.round(img.height * currentScale);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const maxBlob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(), 'image/jpeg', 1.0));
          
          if (maxBlob.size >= targetBytes) {
            let minQ = 0.7; 
            let maxQ = 1.0;
            let localBest = maxBlob;
            
            for(let i=0; i<6; i++) {
              let midQ = (minQ + maxQ) / 2;
              let midBlob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(), 'image/jpeg', midQ));
              
              if (midBlob.size >= targetBytes * 0.95) {
                localBest = midBlob;
                if (midBlob.size > targetBytes) {
                  maxQ = midQ; 
                } else {
                  minQ = midQ; 
                }
              } else {
                minQ = midQ; 
              }
            }
            bestBlob = localBest;
            found = true;
            break;
          } else {
            bestBlob = maxBlob; 
            currentScale *= 1.15;
          }
        }
        if (!found) {
          setWarning('Đã tối đa hóa độ sắc nét và kích thước an toàn, nhưng không thể đẩy dung lượng lên mức quá lớn này.');
        }
      } else {
        let currentScale = 1.0;
        let minDiff = Infinity;
        
        for (let scaleAttempt = 0; scaleAttempt < 5; scaleAttempt++) {
          canvas.width = Math.round(img.width * currentScale);
          canvas.height = Math.round(img.height * currentScale);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let minQ = 0.6;
          let maxQ = 1.0;
          let localBestBlob: Blob | null = null;
          
          const minBlob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(), 'image/jpeg', minQ));
          
          if (minBlob.size <= targetBytes) {
            for (let i = 0; i < 8; i++) {
              const midQ = (minQ + maxQ) / 2;
              const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(), 'image/jpeg', midQ));
              
              if (blob.size <= targetBytes) {
                localBestBlob = blob;
                minQ = midQ; 
              } else {
                maxQ = midQ; 
              }
            }
            bestBlob = localBestBlob || minBlob;
            break;
          } else {
            if (!bestBlob || Math.abs(minBlob.size - targetBytes) < minDiff) {
              bestBlob = minBlob;
              minDiff = Math.abs(minBlob.size - targetBytes);
            }
            currentScale *= 0.85; 
            
            if (currentScale < 0.5) {
              setWarning('Đã nén tối đa trong ngưỡng an toàn để bảo vệ cấu trúc ảnh. Không thể nén nhỏ thêm nữa.');
              break;
            }
          }
        }
      }

      if (bestBlob) {
        setProcessedUrl(URL.createObjectURL(bestBlob));
        
        const imgProcessed = new Image();
        imgProcessed.onload = () => {
          setProcessedStats({
            size: bestBlob!.size,
            width: imgProcessed.width,
            height: imgProcessed.height,
            type: 'image/jpeg'
          });
        };
        imgProcessed.src = URL.createObjectURL(bestBlob);
      }

    } catch (err) {
      console.error(err);
      setError('Có lỗi xảy ra trong quá trình xử lý ảnh.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedUrl || !file) return;
    const link = document.createElement('a');
    link.href = processedUrl;
    link.download = `da_toi_uu_${file.name.split('.')[0]}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="image-compress-container">
      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '0.75rem', background: 'var(--primary)', borderRadius: 'var(--radius-md)', color: 'white' }}>
          <ImageIcon size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Tối Ưu Ảnh Chuyên Nghiệp</h1>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Cân chỉnh dung lượng ảnh, giữ nguyên độ sắc nét</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0, flexDirection: 'row', flexWrap: 'wrap' }}>
        
        {/* LEFT COLUMN: CONTROLS */}
        <div style={{ flex: '1 1 300px', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <UploadCloud size={20} className="text-primary" />
              1. Tải ảnh lên
            </h2>
            
            {!file ? (
              <FileUploadZone onFileSelect={handleFileSelect} accept="image/png, image/jpeg, image/webp" hintText="Hỗ trợ JPG, PNG, WEBP" />
            ) : (
              <div 
                className="dropzone"
                onClick={() => setFile(null)}
                style={{ padding: '2rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={32} className="text-primary" />
                  <p style={{ fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                  <p className="text-secondary" style={{ fontSize: '0.75rem' }}>Nhấn để bỏ chọn ảnh</p>
                </div>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', opacity: !file ? 0.5 : 1, pointerEvents: !file ? 'none' : 'auto' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Settings size={20} className="text-primary" />
              2. Thiết lập dung lượng
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                  Dung lượng mong muốn
                </label>
                <div style={{ display: 'flex' }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={targetSize}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      if ((val.match(/\./g) || []).length <= 1) {
                        setTargetSize(val);
                      }
                    }}
                    placeholder="VD: 500"
                    className="input"
                    style={{ borderRight: 'none', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}
                  />
                  <select
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value)}
                    className="select"
                  >
                    <option value="KB">KB</option>
                    <option value="MB">MB</option>
                  </select>
                </div>
                {originalStats && (
                  <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    Gốc: <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{formatBytes(originalStats.size)}</span>
                  </p>
                )}
              </div>

              <button
                onClick={optimizeImage}
                disabled={isProcessing || !file}
                className="btn-primary"
              >
                {isProcessing ? (
                  <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Đang xử lý...</>
                ) : (
                  <><Settings size={18} /> Tối ưu ảnh</>
                )}
              </button>
            </div>
            
            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0 }}>{error}</p>
              </div>
            )}
            
            {warning && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0 }}>{warning}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW */}
        <div className="glass-card" style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <ImageIcon size={20} className="text-primary" />
            So sánh kết quả
          </h2>

          {!file ? (
            <div style={{ flex: 1, border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.3)' }}>
              <p className="text-secondary">Vui lòng tải ảnh lên để xem trước</p>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'row', gap: '1.5rem', flexWrap: 'wrap' }}>
              
              <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column' }}>
                <div className="preview-box">
                  <img src={previewUrl} alt="Bản gốc" className="preview-img" />
                  <div className="badge original">Bản Gốc</div>
                </div>
                {originalStats && (
                  <div className="stats-card">
                    <div className="stat-row">
                      <span className="text-secondary">Dung lượng:</span>
                      <span style={{ fontWeight: 600 }}>{formatBytes(originalStats.size)}</span>
                    </div>
                    <div className="stat-row">
                      <span className="text-secondary">Kích thước:</span>
                      <span style={{ fontWeight: 500 }}>{originalStats.width} x {originalStats.height}</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '50%' }}>
                  <ArrowRight size={24} />
                </div>
              </div>

              <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column' }}>
                <div className="preview-box" style={{ background: 'rgba(139, 92, 246, 0.03)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                  {processedUrl ? (
                    <>
                      <img src={processedUrl} alt="Đã tối ưu" className="preview-img" />
                      <div className="badge processed">Đã tối ưu</div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', opacity: 0.5 }}>
                      <ImageIcon size={32} />
                      <p style={{ fontSize: '0.875rem' }}>Chưa có kết quả</p>
                    </div>
                  )}
                </div>
                
                {processedStats ? (
                  <div className="stats-card" style={{ background: 'rgba(139, 92, 246, 0.03)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                    <div className="stat-row">
                      <span style={{ color: 'var(--primary)' }}>Dung lượng mới:</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary-hover)' }}>{formatBytes(processedStats.size)}</span>
                    </div>
                    <div className="stat-row">
                      <span style={{ color: 'var(--primary)' }}>Kích thước:</span>
                      <span style={{ fontWeight: 500 }}>{processedStats.width} x {processedStats.height}</span>
                    </div>
                    
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(139, 92, 246, 0.2)' }}>
                       <button onClick={handleDownload} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                          <Download size={18} /> Tải ảnh xuống
                        </button>
                    </div>
                  </div>
                ) : (
                  <div className="stats-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', minHeight: '120px' }}>
                    <span style={{ fontSize: '0.875rem' }}>Thông số sẽ hiển thị tại đây</span>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}

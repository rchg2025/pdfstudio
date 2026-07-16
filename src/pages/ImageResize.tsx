import { useState, useEffect } from 'react';
import { Download, X, Lock, FileImage, Loader2 } from 'lucide-react';
import FileUploadZone from '../components/FileUploadZone';
import { useDialogs } from '../components/CustomDialogs';
import './ImageResize.css';

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function ImageResize() {
  const [file, setFile] = useState<File | null>(null);
  const [fileSize, setFileSize] = useState(0);
  
  const [widthPx, setWidthPx] = useState<string>('');
  const [heightPx, setHeightPx] = useState<string>('');
  const [percent, setPercent] = useState<string>('50');
  
  const [originalDim, setOriginalDim] = useState<{w: number, h: number} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<{ url: string, size: number, name: string, w: number, h: number } | null>(null);
  
  const { showAlert } = useDialogs();

  useEffect(() => {
    return () => {
      if (processedFile) URL.revokeObjectURL(processedFile.url);
    };
  }, [processedFile]);

  const handleFileSelect = (files: FileList | null) => {
    const selectedFile = files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setFileSize(selectedFile.size);
      setProcessedFile(null);
      
      // Lấy kích thước gốc
      const img = new Image();
      img.onload = () => {
        setOriginalDim({ w: img.width, h: img.height });
      };
      img.src = URL.createObjectURL(selectedFile);
      
    } else {
      showAlert('Vui lòng chọn file ảnh hợp lệ', 'Lỗi');
    }
  };

  const handleProcess = () => {
    if (!file || !originalDim) return;
    
    setIsProcessing(true);
    setProcessedFile(null);

    const img = new Image();
    img.onload = () => {
      let targetW = originalDim.w;
      let targetH = originalDim.h;

      const p = parseFloat(percent);
      const w = parseInt(widthPx);
      const h = parseInt(heightPx);

      if (widthPx && heightPx && !isNaN(w) && !isNaN(h)) {
        targetW = w;
        targetH = h;
      } else if (widthPx && !isNaN(w)) {
        targetW = w;
        targetH = Math.round((w / originalDim.w) * originalDim.h);
      } else if (heightPx && !isNaN(h)) {
        targetH = h;
        targetW = Math.round((h / originalDim.h) * originalDim.w);
      } else if (percent && !isNaN(p) && p > 0) {
        targetW = Math.round(originalDim.w * (p / 100));
        targetH = Math.round(originalDim.h * (p / 100));
      } else {
        showAlert('Vui lòng nhập kích thước hợp lệ', 'Lỗi');
        setIsProcessing(false);
        return;
      }

      if (targetW <= 0 || targetH <= 0) {
        showAlert('Kích thước đích phải lớn hơn 0', 'Lỗi');
        setIsProcessing(false);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        showAlert('Không thể khởi tạo canvas', 'Lỗi');
        setIsProcessing(false);
        return;
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);
      
      // Determine output format
      let mimeType = file.type;
      if (mimeType !== 'image/jpeg' && mimeType !== 'image/png' && mimeType !== 'image/webp') {
        mimeType = 'image/jpeg';
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const ext = mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/png' ? '.png' : '.webp';
          const newName = file.name.replace(/\.[^/.]+$/, "") + '-resized' + ext;
          
          setProcessedFile({
            url,
            size: blob.size,
            name: newName,
            w: targetW,
            h: targetH
          });
        } else {
          showAlert('Lỗi khi xuất ảnh', 'Lỗi');
        }
        setIsProcessing(false);
      }, mimeType, 0.9);
    };
    img.onerror = () => {
      showAlert('Lỗi khi tải ảnh gốc', 'Lỗi');
      setIsProcessing(false);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleDownload = () => {
    if (processedFile) {
      const a = document.createElement('a');
      a.href = processedFile.url;
      a.download = processedFile.name;
      a.click();
    }
  };

  const resetForm = () => {
    setFile(null);
    setFileSize(0);
    setOriginalDim(null);
    setProcessedFile(null);
  };

  return (
    <div className="image-resize-container">
      <div className="resize-header">
        <h1 className="text-2xl font-bold mb-2">Resize ảnh</h1>
        <p className="text-secondary">Đổi kích thước theo pixel hoặc phần trăm — xử lý ngay trên trình duyệt.</p>
      </div>

      <div className="resize-tool-card">
        <div className="local-processing-notice">
          <Lock size={16} />
          Xử lý ngay trên trình duyệt — ảnh không được tải lên server.
        </div>

        {!file ? (
          <FileUploadZone 
            onFileSelect={handleFileSelect} 
            accept="image/*"
            hintText="Chọn ảnh hoặc kéo thả vào đây · PNG, JPG, WEBP, GIF..."
            multiple={false}
          />
        ) : (
          <>
            <div className="flex justify-between items-center mb-4 p-3 bg-primary rounded border border-border">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileImage className="text-blue-500 shrink-0" />
                <div className="truncate">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-secondary">
                    {formatBytes(fileSize)} {originalDim && `· ${originalDim.w}x${originalDim.h}px`}
                  </p>
                </div>
              </div>
              <button 
                onClick={resetForm}
                className="p-2 hover:bg-secondary rounded-full transition-colors shrink-0"
                title="Xóa ảnh"
              >
                <X size={20} className="text-secondary" />
              </button>
            </div>

            <div className="resize-form">
              <div className="resize-input-group">
                <label>Rộng (px)</label>
                <input 
                  type="number" 
                  className="resize-input"
                  value={widthPx}
                  onChange={(e) => {
                    setWidthPx(e.target.value);
                    setPercent('');
                  }}
                  placeholder={originalDim ? originalDim.w.toString() : ''}
                />
              </div>
              <div className="resize-input-group">
                <label>Cao (px)</label>
                <input 
                  type="number" 
                  className="resize-input"
                  value={heightPx}
                  onChange={(e) => {
                    setHeightPx(e.target.value);
                    setPercent('');
                  }}
                  placeholder={originalDim ? originalDim.h.toString() : ''}
                />
              </div>
              <div className="resize-input-group">
                <label>Hoặc %</label>
                <input 
                  type="number" 
                  className="resize-input"
                  value={percent}
                  onChange={(e) => {
                    setPercent(e.target.value);
                    if (e.target.value) {
                      setWidthPx('');
                      setHeightPx('');
                    }
                  }}
                  min="1"
                />
              </div>
            </div>

            {!processedFile ? (
              <button 
                className="btn-process" 
                onClick={handleProcess}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="animate-spin" size={20} /> Đang xử lý...</>
                ) : (
                  <>Xử lý ngay</>
                )}
              </button>
            ) : (
              <div className="action-buttons">
                <button 
                  className="btn-download" 
                  onClick={handleDownload}
                >
                  <Download size={20} />
                  Tải về ảnh ({processedFile.w}x{processedFile.h}px - {formatBytes(processedFile.size)})
                </button>
              </div>
            )}
          </>
        )}

        {processedFile && (
          <div className="preview-section">
            <p className="text-secondary mb-4 text-center">Ảnh sau khi thu phóng</p>
            <img src={processedFile.url} alt="Resized" className="preview-image" />
          </div>
        )}
      </div>
    </div>
  );
}

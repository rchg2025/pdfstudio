import { useState, useEffect, useRef } from 'react';
import { Download, X, Lock, FileImage, Loader2, Wand2 } from 'lucide-react';
import FileUploadZone from '../components/FileUploadZone';
import { useDialogs } from '../components/CustomDialogs';
import './ImageEnhance.css';

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function ImageEnhance() {
  const [file, setFile] = useState<File | null>(null);
  const [fileSize, setFileSize] = useState(0);
  
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  
  const [originalDim, setOriginalDim] = useState<{w: number, h: number} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Real-time preview URL
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const [processedFile, setProcessedFile] = useState<{ url: string, size: number, name: string } | null>(null);
  
  const { showAlert } = useDialogs();

  useEffect(() => {
    return () => {
      if (processedFile) URL.revokeObjectURL(processedFile.url);
      if (previewUrl && !previewUrl.startsWith('data:')) URL.revokeObjectURL(previewUrl);
    };
  }, [processedFile, previewUrl]);

  const handleFileSelect = (files: FileList | null) => {
    const selectedFile = files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setFileSize(selectedFile.size);
      setProcessedFile(null);
      
      const objectUrl = URL.createObjectURL(selectedFile);
      const img = new Image();
      img.onload = () => {
        setOriginalDim({ w: img.width, h: img.height });
        originalImageRef.current = img;
        updatePreview(img, 100, 100, 100);
      };
      img.src = objectUrl;
      
    } else {
      showAlert('Vui lòng chọn file ảnh hợp lệ', 'Lỗi');
    }
  };

  const updatePreview = (img: HTMLImageElement, b: number, c: number, s: number) => {
    const canvas = document.createElement('canvas');
    // For preview, we can scale down if the image is too large to make it fast
    let targetW = img.width;
    let targetH = img.height;
    const maxPreviewDim = 1200;

    if (targetW > maxPreviewDim || targetH > maxPreviewDim) {
      if (targetW > targetH) {
        targetH = Math.round((maxPreviewDim / targetW) * targetH);
        targetW = maxPreviewDim;
      } else {
        targetW = Math.round((maxPreviewDim / targetH) * targetW);
        targetH = maxPreviewDim;
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
    ctx.drawImage(img, 0, 0, targetW, targetH);
    setPreviewUrl(canvas.toDataURL('image/jpeg', 0.8));
  };

  // Debounce preview update when sliders change
  useEffect(() => {
    if (originalImageRef.current) {
      const timeoutId = setTimeout(() => {
        updatePreview(originalImageRef.current!, brightness, contrast, saturation);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [brightness, contrast, saturation]);

  const handleProcess = () => {
    if (!file || !originalImageRef.current || !originalDim) return;
    
    setIsProcessing(true);
    setProcessedFile(null);

    const img = originalImageRef.current;
    
    const canvas = document.createElement('canvas');
    canvas.width = originalDim.w;
    canvas.height = originalDim.h;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      showAlert('Không thể khởi tạo canvas', 'Lỗi');
      setIsProcessing(false);
      return;
    }

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(img, 0, 0, originalDim.w, originalDim.h);
    
    // Determine output format
    let mimeType = file.type;
    if (mimeType !== 'image/jpeg' && mimeType !== 'image/png' && mimeType !== 'image/webp') {
      mimeType = 'image/jpeg';
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const ext = mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/png' ? '.png' : '.webp';
        const newName = file.name.replace(/\.[^/.]+$/, "") + '-enhanced' + ext;
        
        setProcessedFile({
          url,
          size: blob.size,
          name: newName
        });
      } else {
        showAlert('Lỗi khi xuất ảnh', 'Lỗi');
      }
      setIsProcessing(false);
    }, mimeType, 0.95);
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
    setPreviewUrl(null);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    originalImageRef.current = null;
  };

  return (
    <div className="image-enhance-container">
      <div className="enhance-header">
        <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Wand2 className="text-primary" />
          Tăng độ nét & Chỉnh sửa ảnh
        </h1>
        <p className="text-secondary">Cải thiện chất lượng hình ảnh, độ sáng, độ tương phản ngay trên trình duyệt.</p>
      </div>

      <div className="enhance-tool-card">
        <div className="local-processing-notice">
          <Lock size={16} />
          Xử lý ngay trên trình duyệt — ảnh không được tải lên server.
        </div>

        {!file ? (
          <FileUploadZone 
            onFileSelect={handleFileSelect} 
            accept="image/*"
            hintText="Chọn ảnh hoặc kéo thả vào đây · PNG, JPG, WEBP..."
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

            <div className="enhance-form">
              <div className="enhance-input-group">
                <label>
                  Độ sáng
                  <span className="value">{brightness}%</span>
                </label>
                <input 
                  type="range" 
                  className="enhance-slider"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                />
              </div>
              
              <div className="enhance-input-group">
                <label>
                  Độ tương phản
                  <span className="value">{contrast}%</span>
                </label>
                <input 
                  type="range" 
                  className="enhance-slider"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                />
              </div>

              <div className="enhance-input-group">
                <label>
                  Độ bão hòa (Màu)
                  <span className="value">{saturation}%</span>
                </label>
                <input 
                  type="range" 
                  className="enhance-slider"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                />
              </div>
            </div>

            {previewUrl && !processedFile && (
              <div className="preview-section">
                <p className="text-secondary mb-4 text-center">Xem trước trực tiếp</p>
                <img src={previewUrl} alt="Preview" className="preview-image" />
              </div>
            )}

            {!processedFile ? (
              <div className="action-buttons">
                <button 
                  className="btn-process" 
                  onClick={handleProcess}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <><Loader2 className="animate-spin" size={20} /> Đang xử lý chất lượng cao...</>
                  ) : (
                    <>
                      <Wand2 size={20} />
                      Tạo Ảnh Chất Lượng Cao
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="action-buttons">
                <button 
                  className="btn-download" 
                  onClick={handleDownload}
                >
                  <Download size={20} />
                  Tải về ảnh đã xử lý ({formatBytes(processedFile.size)})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { ArrowRight, Download, Trash2, Image as ImageIcon, Settings, CheckCircle2, RefreshCw } from 'lucide-react';
import heic2any from 'heic2any';
import FileUploadZone from '../components/FileUploadZone';
import './ImageConverter.css';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  resultBlob?: Blob;
  resultUrl?: string;
  error?: string;
}

const ImageConverter: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatLabels: Record<string, string> = {
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WEBP'
  };

  const getExt = () => outputFormat === 'image/jpeg' ? 'jpg' : outputFormat === 'image/png' ? 'png' : 'webp';

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newImages: ImageFile[] = Array.from(files)
      .filter(f => f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.heic'))
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        status: 'pending'
      }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const removed = prev.find(img => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
        if (removed.resultUrl) URL.revokeObjectURL(removed.resultUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const convertImageToFormat = (blob: Blob, format: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas error')); return; }
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(resultBlob => {
          URL.revokeObjectURL(url);
          resultBlob ? resolve(resultBlob) : reject(new Error('Canvas toBlob failed'));
        }, format, 0.92);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không thể đọc ảnh')); };
      img.src = url;
    });
  };

  const convertHeicToBlob = async (blob: Blob, targetType: string): Promise<Blob> => {
    let typeForHeic = targetType === 'image/webp' ? 'image/jpeg' : targetType;
    let converted = await heic2any({ blob, toType: typeForHeic, quality: 0.92 });
    if (Array.isArray(converted)) converted = converted[0];
    if (targetType === 'image/webp') return convertImageToFormat(converted as Blob, 'image/webp');
    return converted as Blob;
  };

  const processImages = async () => {
    if (images.length === 0 || isProcessing) return;
    setIsProcessing(true);
    const updatedImages = [...images];
    for (let i = 0; i < updatedImages.length; i++) {
      const img = updatedImages[i];
      if (img.status === 'done' && img.resultBlob?.type === outputFormat) continue;
      updatedImages[i] = { ...img, status: 'processing' };
      setImages([...updatedImages]);
      try {
        const isHeic = img.file.name.toLowerCase().endsWith('.heic') || img.file.type === 'image/heic';
        const resultBlob = isHeic
          ? await convertHeicToBlob(img.file, outputFormat)
          : await convertImageToFormat(img.file, outputFormat);
        const resultUrl = URL.createObjectURL(resultBlob);
        updatedImages[i] = { ...updatedImages[i], status: 'done', resultBlob, resultUrl };
      } catch (error: any) {
        updatedImages[i] = { ...updatedImages[i], status: 'error', error: error.message || 'Lỗi chuyển đổi' };
      }
      setImages([...updatedImages]);
    }
    setIsProcessing(false);
  };

  const downloadAll = () => {
    const ext = getExt();
    images.forEach(img => {
      if (img.status === 'done' && img.resultUrl) {
        const a = document.createElement('a');
        a.href = img.resultUrl;
        const origName = img.file.name.substring(0, img.file.name.lastIndexOf('.')) || img.file.name;
        a.download = `${origName}_converted.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  };

  const doneCount = images.filter(i => i.status === 'done').length;

  return (
    <div className="ic-page">
      <div className="ic-header-section">
        <h1 className="ic-title">Chuyển Đổi Định Dạng Ảnh</h1>
        <p className="ic-subtitle">
          Chuyển đổi HEIC, JPG, PNG, WEBP ngay trên trình duyệt — bảo mật tuyệt đối, không tải ảnh lên máy chủ.
        </p>
      </div>

      <div className="ic-card">
        {/* Upload zone */}
        <FileUploadZone
          onFileSelect={handleFileSelect}
          accept="image/*,.heic"
          multiple={true}
          hintText="Hỗ trợ HEIC, JPG, PNG, WEBP (chọn nhiều ảnh cùng lúc)"
        />

        {images.length > 0 && (
          <>
            {/* Format selector */}
            <div className="ic-format-bar">
              <div className="ic-format-left">
                <div className="ic-format-icon"><Settings size={18} /></div>
                <div>
                  <div className="ic-format-label">Định dạng đầu ra</div>
                  <div className="ic-format-hint">Chọn định dạng muốn chuyển sang</div>
                </div>
              </div>
              <div className="ic-format-options">
                {(['image/jpeg', 'image/png', 'image/webp'] as const).map(fmt => (
                  <button
                    key={fmt}
                    className={`ic-fmt-btn${outputFormat === fmt ? ' active' : ''}`}
                    onClick={() => setOutputFormat(fmt)}
                    disabled={isProcessing}
                  >
                    {formatLabels[fmt]}
                  </button>
                ))}
              </div>
            </div>

            {/* File list */}
            <div className="ic-list">
              {images.map(img => (
                <div key={img.id} className={`ic-item${img.status === 'done' ? ' done' : ''}`}>
                  {/* Thumbnail */}
                  <div className="ic-thumb">
                    {img.file.name.toLowerCase().endsWith('.heic') && !img.resultUrl
                      ? <ImageIcon size={22} className="ic-thumb-icon" />
                      : <img src={img.resultUrl || img.preview} alt={img.file.name} />
                    }
                  </div>

                  {/* Info */}
                  <div className="ic-info">
                    <div className="ic-name" title={img.file.name}>{img.file.name}</div>
                    <div className="ic-meta">
                      <span className="ic-badge source">{img.file.name.split('.').pop()?.toUpperCase() || 'IMG'}</span>
                      <ArrowRight size={11} className="ic-arrow" />
                      <span className="ic-badge target">{formatLabels[outputFormat]}</span>
                      <span className="ic-dot">•</span>
                      <span className="ic-size">{(img.file.size / 1024).toFixed(0)} KB</span>

                      {img.status === 'processing' && (
                        <span className="ic-status processing">
                          <span className="ic-spinner"></span>Đang xử lý...
                        </span>
                      )}
                      {img.status === 'done' && (
                        <span className="ic-status done">
                          <CheckCircle2 size={13} />Thành công
                        </span>
                      )}
                      {img.status === 'error' && (
                        <span className="ic-status error" title={img.error}>
                          Lỗi: {img.error}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ic-actions">
                    {img.status === 'done' && img.resultUrl && (
                      <a
                        href={img.resultUrl}
                        download={`${img.file.name.substring(0, img.file.name.lastIndexOf('.')) || img.file.name}.${getExt()}`}
                        className="ic-action-btn download"
                        title="Tải ảnh này"
                      >
                        <Download size={15} />
                      </a>
                    )}
                    <button
                      onClick={() => removeImage(img.id)}
                      disabled={isProcessing}
                      className="ic-action-btn delete"
                      title="Xoá"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom action bar */}
            <div className="ic-action-bar">
              <button
                className="ic-convert-btn"
                onClick={processImages}
                disabled={isProcessing || images.length === 0}
              >
                <RefreshCw size={18} className={isProcessing ? 'ic-spin' : ''} />
                {isProcessing ? 'Đang xử lý...' : `Chuyển đổi ${images.length} ảnh`}
              </button>

              {doneCount > 0 && (
                <button className="ic-download-all-btn" onClick={downloadAll}>
                  <Download size={18} />
                  Tải xuống tất cả ({doneCount})
                </button>
              )}

              <button
                className="ic-clear-btn"
                onClick={() => {
                  images.forEach(img => {
                    URL.revokeObjectURL(img.preview);
                    if (img.resultUrl) URL.revokeObjectURL(img.resultUrl);
                  });
                  setImages([]);
                }}
                disabled={isProcessing}
              >
                Xoá tất cả
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageConverter;

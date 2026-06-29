import React, { useState } from 'react';
import { ArrowRight, Download, Trash2, Image as ImageIcon, Settings, CheckCircle2 } from 'lucide-react';
import heic2any from 'heic2any';
import FileUploadZone from '../components/FileUploadZone';

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

  const formatLabels = {
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WEBP'
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newImages: ImageFile[] = Array.from(files)
      .filter(f => f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.heic'))
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file), // Note: HEIC preview might not work natively in some browsers, but we will handle conversion.
        status: 'pending'
      }));
      
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
        if (removed.resultUrl) URL.revokeObjectURL(removed.resultUrl);
      }
      return filtered;
    });
  };

  const convertHeicToBlob = async (blob: Blob, targetType: string): Promise<Blob> => {
    // heic2any only supports image/jpeg, image/png, image/gif.
    let typeForHeic = targetType;
    if (targetType === 'image/webp') {
      typeForHeic = 'image/jpeg'; // Convert to jpeg first, then to webp via canvas
    }
    
    let converted = await heic2any({
      blob,
      toType: typeForHeic,
      quality: 0.9
    });
    
    if (Array.isArray(converted)) {
      converted = converted[0];
    }
    
    if (targetType === 'image/webp') {
      return await convertImageToFormat(converted, 'image/webp');
    }
    return converted as Blob;
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
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // Fill white background for transparent images converted to JPG
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((resultBlob) => {
          URL.revokeObjectURL(url);
          if (resultBlob) {
            resolve(resultBlob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        }, format, 0.9);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
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
        let resultBlob: Blob;
        const isHeic = img.file.name.toLowerCase().endsWith('.heic') || img.file.type === 'image/heic';
        
        if (isHeic) {
          resultBlob = await convertHeicToBlob(img.file, outputFormat);
        } else {
          resultBlob = await convertImageToFormat(img.file, outputFormat);
        }
        
        const resultUrl = URL.createObjectURL(resultBlob);
        
        updatedImages[i] = {
          ...updatedImages[i],
          status: 'done',
          resultBlob,
          resultUrl
        };
      } catch (error: any) {
        console.error('Error converting image:', error);
        updatedImages[i] = {
          ...updatedImages[i],
          status: 'error',
          error: error.message || 'Lỗi chuyển đổi'
        };
      }
      
      setImages([...updatedImages]);
    }
    
    setIsProcessing(false);
  };

  const downloadAll = () => {
    images.forEach(img => {
      if (img.status === 'done' && img.resultUrl) {
        const a = document.createElement('a');
        a.href = img.resultUrl;
        
        const ext = outputFormat === 'image/jpeg' ? 'jpg' : outputFormat === 'image/png' ? 'png' : 'webp';
        const origName = img.file.name.substring(0, img.file.name.lastIndexOf('.')) || img.file.name;
        a.download = `${origName}_converted.${ext}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  };

  return (
    <div className="container py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gradient">Chuyển Đổi Định Dạng Ảnh</h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Chuyển đổi hình ảnh giữa các định dạng HEIC, JPG, PNG, WEBP ngay trên trình duyệt. Bảo mật tuyệt đối, không tải ảnh lên máy chủ.
        </p>
      </div>

      <div className="tool-container">
        <div className="glass-panel p-8">
          <FileUploadZone 
            onFileSelect={handleFileSelect}
            accept="image/*,.heic"
            multiple={true}
            hintText="Hỗ trợ HEIC, JPG, PNG, WEBP..."
          />

          {images.length > 0 && (
            <div className="mt-8" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="ic-format-panel">
                <div className="ic-format-info">
                  <div style={{ color: 'var(--primary)' }}><Settings size={24} /></div>
                  <div>
                    <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Định dạng đầu ra</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Chọn định dạng bạn muốn chuyển đổi sang</p>
                  </div>
                </div>
                
                <select 
                  className="ic-format-select"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as any)}
                  disabled={isProcessing}
                >
                  <option value="image/jpeg">JPG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WEBP</option>
                </select>
              </div>

              <div className="ic-list">
                {images.map(img => (
                  <div key={img.id} className="ic-item">
                    <div className="ic-thumb">
                      {img.file.name.toLowerCase().endsWith('.heic') && !img.resultUrl ? (
                        <ImageIcon size={24} style={{ color: 'var(--text-muted)' }} />
                      ) : (
                        <img src={img.resultUrl || img.preview} alt="preview" />
                      )}
                    </div>
                    
                    <div className="ic-info">
                      <div className="ic-header">
                        <span className="ic-name" title={img.file.name}>
                          {img.file.name}
                        </span>
                        
                        <div className="ic-actions">
                          {img.status === 'done' && img.resultUrl && (
                            <a 
                              href={img.resultUrl}
                              download={`${img.file.name.substring(0, img.file.name.lastIndexOf('.')) || img.file.name}_converted.${outputFormat.split('/')[1]}`}
                              className="ic-btn download"
                              title="Tải ảnh này"
                            >
                              <Download size={16} />
                            </a>
                          )}
                          <button
                            onClick={() => removeImage(img.id)}
                            disabled={isProcessing}
                            className="ic-btn delete"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="ic-meta">
                        <span className="ic-badge source">
                          {img.file.name.split('.').pop() || 'IMG'}
                        </span>
                        <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                        <span className="ic-badge target">
                          {formatLabels[outputFormat]}
                        </span>
                        
                        <span style={{ color: 'var(--text-muted)', margin: '0 0.25rem' }}>•</span>
                        <span className="ic-size">{(img.file.size / 1024).toFixed(1)} KB</span>

                        {img.status === 'processing' && (
                          <span className="ic-status processing">
                            <div className="spinner"></div>
                            Đang xử lý...
                          </span>
                        )}
                        
                        {img.status === 'done' && (
                          <span className="ic-status done">
                            <CheckCircle2 size={14} />
                            Thành công
                          </span>
                        )}

                        {img.status === 'error' && (
                          <span className="ic-status error" title={img.error}>
                            Lỗi: {img.error}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
                <button
                  className="btn-primary flex-1 py-3 text-lg flex justify-center items-center gap-2"
                  onClick={processImages}
                  disabled={isProcessing || images.length === 0}
                >
                  {isProcessing ? 'Đang xử lý...' : 'Chuyển đổi ngay'}
                </button>
                
                {images.some(img => img.status === 'done') && (
                  <button
                    className="btn-outline flex-1 py-3 text-lg flex justify-center items-center gap-2"
                    onClick={downloadAll}
                  >
                    <Download size={20} />
                    Tải xuống tất cả
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageConverter;

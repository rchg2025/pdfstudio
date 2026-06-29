import React, { useState } from 'react';
import { ArrowRight, Download, Trash2, Image as ImageIcon, Settings } from 'lucide-react';
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
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Settings className="text-primary" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground">Định dạng đầu ra</h3>
                    <p className="text-sm text-muted">Chọn định dạng bạn muốn chuyển đổi sang</p>
                  </div>
                </div>
                
                <select 
                  className="px-4 py-2 bg-background border border-input rounded-md text-foreground focus:ring-2 focus:ring-primary outline-none"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as any)}
                  disabled={isProcessing}
                >
                  <option value="image/jpeg">JPG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WEBP</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map(img => (
                  <div key={img.id} className="relative group bg-background border border-border rounded-lg overflow-hidden flex flex-col">
                    <div className="h-40 bg-secondary/20 flex items-center justify-center p-2">
                      {img.file.name.toLowerCase().endsWith('.heic') && !img.resultUrl ? (
                        <div className="text-center text-muted">
                          <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                          <span className="text-sm font-medium">HEIC Image</span>
                        </div>
                      ) : (
                        <img 
                          src={img.resultUrl || img.preview} 
                          alt="preview" 
                          className="max-h-full max-w-full object-contain rounded-md" 
                        />
                      )}
                    </div>
                    
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium truncate" title={img.file.name}>
                          {img.file.name}
                        </span>
                        <button
                          onClick={() => removeImage(img.id)}
                          disabled={isProcessing}
                          className="text-muted hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-secondary rounded text-muted font-medium">
                          {img.file.name.split('.').pop()?.toUpperCase() || 'IMG'}
                        </span>
                        <ArrowRight size={12} className="text-muted" />
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                          {formatLabels[outputFormat]}
                        </span>
                      </div>
                      
                      {img.status === 'processing' && (
                        <div className="mt-3 text-sm text-primary flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                          Đang xử lý...
                        </div>
                      )}
                      
                      {img.status === 'done' && (
                        <div className="mt-3 text-sm text-emerald-500 font-medium">
                          Hoàn tất!
                        </div>
                      )}

                      {img.status === 'error' && (
                        <div className="mt-3 text-sm text-destructive font-medium truncate" title={img.error}>
                          Lỗi: {img.error}
                        </div>
                      )}
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

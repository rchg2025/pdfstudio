import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  Download, X, Eye, EyeOff, Loader2 
} from 'lucide-react';
import FileUploadZone from '../components/FileUploadZone';
import { useDialogs } from '../components/CustomDialogs';
import './JpgToPdf.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ImageFile {
  file: File;
  id: string;
  previewUrl: string;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function JpgToPdf() {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<{ url: string, size: number, name: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  
  const { showAlert } = useDialogs();

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      imageFiles.forEach(img => URL.revokeObjectURL(img.previewUrl));
      if (processedFile) URL.revokeObjectURL(processedFile.url);
    };
  }, [imageFiles, processedFile]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles: ImageFile[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        newFiles.push({
          file,
          id: Math.random().toString(36).substring(7),
          previewUrl: URL.createObjectURL(file)
        });
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      showAlert(`Các file sau không phải là ảnh: ${invalidFiles.join(', ')}`, 'Thông báo');
    }

    if (newFiles.length > 0) {
      setImageFiles(prev => [...prev, ...newFiles]);
      setProcessedFile(null);
      setPreviewDataUrl(null);
      setShowPreview(false);
    }
  };

  const removeFile = (idToRemove: string) => {
    setImageFiles(prev => {
      const fileToRemove = prev.find(f => f.id === idToRemove);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== idToRemove);
    });
    setProcessedFile(null);
  };

  // Convert any image (WEBP, PNG, JPG) to JPEG data URL using Canvas
  const imageToJpegDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 1.0));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleProcess = async () => {
    if (imageFiles.length === 0) return;

    setIsProcessing(true);
    setProcessedFile(null);
    setShowPreview(false);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const imgItem of imageFiles) {
        let jpegDataUrl = '';
        if (imgItem.file.type === 'image/jpeg') {
          // If already JPEG, read as base64 to embed
          const arrayBuffer = await imgItem.file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          jpegDataUrl = `data:image/jpeg;base64,${base64}`;
        } else {
          // Otherwise draw to canvas and get JPEG
          jpegDataUrl = await imageToJpegDataUrl(imgItem.file);
        }

        const jpgImage = await pdfDoc.embedJpg(jpegDataUrl);
        const { width, height } = jpgImage.scale(1);
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setProcessedFile({
        url,
        size: blob.size,
        name: 'anh-ghep.pdf'
      });
      
      generatePreview(pdfBytes);
      
    } catch (error: any) {
      console.error(error);
      showAlert('Không thể tạo file PDF. Vui lòng thử lại với các ảnh khác.', 'Lỗi xử lý');
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePreview = async (pdfBytes: Uint8Array) => {
    setIsPreviewLoading(true);
    try {
      const loadingTask = pdfjsLib.getDocument({ 
        data: pdfBytes,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
      });
      const pdf = await loadingTask.promise;
      
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 }); // Adjust scale for preview
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport } as any).promise;
        setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.8));
      }
      await loadingTask.destroy();
    } catch (error) {
      console.error("Lỗi tạo preview:", error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownload = () => {
    if (processedFile) {
      const a = document.createElement('a');
      a.href = processedFile.url;
      a.download = processedFile.name;
      a.click();
    }
  };

  return (
    <div className="jpg-to-pdf-container">
      <div className="jpg-to-pdf-header">
        <h1 className="text-2xl font-bold mb-2">JPG sang PDF</h1>
        <p className="text-secondary">Gộp nhiều ảnh (JPG, PNG, WEBP...) thành một file PDF, mỗi ảnh một trang.</p>
      </div>

      <div className="jpg-to-pdf-tool-card">
        <FileUploadZone 
          onFileSelect={handleFileSelect} 
          accept="image/*"
          hintText="Chọn các file hoặc kéo thả vào đây"
          multiple={true}
        />

        {imageFiles.length > 0 && (
          <div className="mt-6">
            <div className="file-list">
              {imageFiles.map((img) => (
                <div key={img.id} className="file-item">
                  <div className="file-info">
                    <img src={img.previewUrl} alt="Preview" className="file-preview" />
                    <div className="file-details">
                      <span className="file-name" title={img.file.name}>{img.file.name}</span>
                      <span className="file-size">{formatBytes(img.file.size)}</span>
                    </div>
                  </div>
                  <button 
                    className="remove-file-btn" 
                    onClick={() => removeFile(img.id)}
                    title="Xóa file"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            {!processedFile ? (
              <button 
                className="btn-process" 
                onClick={handleProcess}
                disabled={isProcessing}
                style={{ width: '100%' }}
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
                  Tải về {processedFile.name} ({formatBytes(processedFile.size)})
                </button>
                
                <button 
                  className="btn-preview-toggle"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? (
                    <><EyeOff size={18} /> Ẩn xem trước</>
                  ) : (
                    <><Eye size={18} /> Xem trước kết quả</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {showPreview && (
          <div className="preview-section">
            {isPreviewLoading ? (
              <div className="flex flex-col items-center text-white">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p>Đang tạo bản xem trước...</p>
              </div>
            ) : previewDataUrl ? (
              <div className="preview-canvas-wrapper">
                <img src={previewDataUrl} alt="Preview" />
              </div>
            ) : (
              <p className="text-white">Không thể hiển thị xem trước.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

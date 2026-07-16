import { useState } from 'react';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  Download, FileText, X, Eye, EyeOff, Loader2 
} from 'lucide-react';
import FileUploadZone from '../components/FileUploadZone';
import { useDialogs } from '../components/CustomDialogs';
import './PdfWatermark.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
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

export default function PdfWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [watermarkText, setWatermarkText] = useState('tài liệu nội bộ');
  const [opacity, setOpacity] = useState(15);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<{ url: string, size: number, name: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  
  const { showAlert } = useDialogs();

  const handleFileSelect = (files: FileList | null) => {
    const selectedFile = files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileSize(selectedFile.size);
      setProcessedFile(null);
      setPreviewDataUrl(null);
      setShowPreview(false);
    } else {
      showAlert('Vui lòng chọn file PDF hợp lệ', 'Lỗi');
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    if (!watermarkText.trim()) {
      showAlert('Vui lòng nhập nội dung watermark', 'Lỗi');
      return;
    }

    setIsProcessing(true);
    setProcessedFile(null);
    setShowPreview(false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      pdfDoc.registerFontkit(fontkit);

      // Tải font Roboto hỗ trợ tiếng Việt
      let fontBytes;
      try {
        const fontResponse = await fetch('/fonts/Roboto-Regular.ttf');
        if (fontResponse.ok) {
          fontBytes = await fontResponse.arrayBuffer();
        } else {
           throw new Error('Lỗi lấy font');
        }
      } catch (e) {
         // Fallback nếu không tải được ttf
         console.warn('Không tải được Roboto, dùng font mặc định.');
      }

      let customFont;
      if (fontBytes) {
         customFont = await pdfDoc.embedFont(fontBytes);
      } else {
         // Fallback to standard font if custom font fails, but it might not support full Vietnamese
         customFont = await pdfDoc.embedFont('Helvetica');
      }

      const pages = pdfDoc.getPages();
      const text = watermarkText;
      const opacityValue = opacity / 100;
      
      const textSize = 60;
      const textWidth = customFont.widthOfTextAtSize(text, textSize);
      const textHeight = customFont.heightAtSize(textSize);

      for (const page of pages) {
        const { width, height } = page.getSize();
        
        // Vẽ watermark ở giữa trang, nghiêng 45 độ
        page.drawText(text, {
          x: width / 2 - (textWidth / 2) * Math.cos(Math.PI / 4) + (textHeight / 2) * Math.sin(Math.PI / 4),
          y: height / 2 - (textWidth / 2) * Math.sin(Math.PI / 4) - (textHeight / 2) * Math.cos(Math.PI / 4),
          size: textSize,
          font: customFont,
          color: rgb(0.5, 0.5, 0.5),
          opacity: opacityValue,
          rotate: degrees(45),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setProcessedFile({
        url,
        size: blob.size,
        name: file.name.replace('.pdf', '-watermarked.pdf')
      });
      
      // Tạo preview
      generatePreview(pdfBytes);
      
    } catch (error: any) {
      console.error(error);
      showAlert('Không thể đóng dấu PDF. Có thể file PDF có bảo vệ hoặc định dạng không hợp lệ.', 'Lỗi xử lý');
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
      
      // Lấy trang đầu tiên
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      
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

  const resetForm = () => {
    setFile(null);
    setFileSize(0);
    setProcessedFile(null);
    setPreviewDataUrl(null);
    setShowPreview(false);
  };

  return (
    <div className="pdf-watermark-container">
      <div className="watermark-header">
        <h1 className="text-2xl font-bold mb-2">Đóng dấu PDF</h1>
        <p className="text-secondary">Chèn watermark chữ chéo mờ lên mọi trang.</p>
      </div>

      {!file ? (
        <FileUploadZone 
          onFileSelect={handleFileSelect} 
          accept=".pdf"
          hintText="Kéo thả hoặc nhấn để tải lên file PDF"
        />
      ) : (
        <div className="watermark-tool-card">
          <div className="flex justify-between items-center mb-4 p-3 bg-primary rounded border border-border">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText className="text-blue-500 shrink-0" />
              <div className="truncate">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-secondary">{formatBytes(fileSize)}</p>
              </div>
            </div>
            <button 
              onClick={resetForm}
              className="p-2 hover:bg-secondary rounded-full transition-colors shrink-0"
              title="Xóa file"
            >
              <X size={20} className="text-secondary" />
            </button>
          </div>

          <div className="watermark-form">
            <div className="watermark-input-group">
              <label>Nội dung watermark</label>
              <input 
                type="text" 
                className="watermark-input"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="Nhập nội dung watermark..."
              />
            </div>

            <div className="watermark-input-group">
              <label>Độ đậm ({opacity}-100)</label>
              <input 
                type="number" 
                className="watermark-input"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                min="5" 
                max="100"
              />
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
      )}
    </div>
  );
}

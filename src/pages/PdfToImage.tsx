import { useState, useEffect } from 'react';
import { FileBox, RefreshCw, Download, AlertCircle, Archive, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import JSZip from 'jszip';
import FileUploadZone from '../components/FileUploadZone';
import './PdfToImage.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

interface ImageResult {
  page: number;
  url: string;
  filename: string;
}

const ITEMS_PER_PAGE = 12;

export default function PdfToImage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState('png');
  const [scale, setScale] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    return () => {
      imageResults.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [imageResults]);

  const handleFileSelect = (files: FileList | null) => {
    const selectedFile = files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setError('');
    setFile(selectedFile);
    resetState();
  };

  const resetState = () => {
    setImageResults([]);
    setCurrentPageIndex(1);
    setProgress(0);
    setProgressText('');
    setIsProcessing(false);
    setIsZipping(false);
  };

  const startOver = () => {
    setFile(null);
    resetState();
  };

  const processPDF = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProgress(0);
    setImageResults([]);
    setError('');

    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const fileExtension = format;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const typedarray = new Uint8Array(arrayBuffer);
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
      const numPages = pdf.numPages;
      const results: ImageResult[] = [];

      for (let i = 1; i <= numPages; i++) {
        const percent = Math.round(((i - 1) / numPages) * 100);
        setProgress(percent);
        setProgressText(`Đang xử lý trang ${i}/${numPages} (${percent}%)`);

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (format === 'jpg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        await page.render({ canvasContext: ctx, viewport: viewport } as any).promise;

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), mimeType, 0.95);
        });

        if (blob) {
          const url = URL.createObjectURL(blob);
          const filename = `Trang_${i}.${fileExtension}`;
          results.push({
            page: i,
            url,
            filename
          });
        }
      }

      setImageResults(results);
      setProgress(100);
      setProgressText(`Thành công! Đã xử lý xong ${numPages} trang.`);
      setIsProcessing(false);
      (pdf as any).destroy(); // Free memory
      
    } catch (err) {
      console.error(err);
      setError('Không thể đọc nội dung file PDF. File có thể đang bị đặt mật khẩu mã hóa hoặc đã bị hỏng.');
      setIsProcessing(false);
    }
  };

  const downloadAll = async () => {
    if (imageResults.length === 0) return;
    
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const basePdfName = file?.name.replace(/\.[^/.]+$/, "") || 'PDF';
      
      for (const img of imageResults) {
        const response = await fetch(img.url);
        const blob = await response.blob();
        zip.file(`${basePdfName}_${img.filename}`, blob);
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `${basePdfName}_Hinh_Anh.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
      
    } catch (err) {
      console.error('Lỗi tạo file ZIP:', err);
      setError('Có lỗi xảy ra trong quá trình nén file ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  const totalPages = Math.ceil(imageResults.length / ITEMS_PER_PAGE);
  const startIndex = (currentPageIndex - 1) * ITEMS_PER_PAGE;
  const currentImages = imageResults.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="pdf-to-image-container animate-fade-in">
      <div className="pdf-to-image-header">
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Chuyển PDF sang Hình ảnh</h1>
        <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Chuyển đổi từng trang của tài liệu PDF thành hình ảnh sắc nét (PNG/JPG). Mọi thao tác xử lý hoàn toàn diễn ra trên trình duyệt của bạn.
        </p>
      </div>

      {!imageResults.length && !isProcessing ? (
        <div className="glass-card">
          {!file ? (
            <FileUploadZone onFileSelect={handleFileSelect} accept="application/pdf" />
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                  <FileBox size={24} className="text-primary" />
                  <div style={{ overflow: 'hidden' }}>
                    <h4 style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</h4>
                    <p className="text-secondary" style={{ fontSize: '0.875rem' }}>{(file.size / (1024*1024)).toFixed(2)} MB</p>
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

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <div className="options-grid">
                <div className="option-group">
                  <label>Định dạng ảnh xuất ra</label>
                  <select 
                    className="option-select"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    <option value="png">PNG (Chất lượng cao nhất)</option>
                    <option value="jpg">JPG (Dung lượng nhỏ gọn)</option>
                  </select>
                </div>
                <div className="option-group">
                  <label>Chất lượng (Độ phân giải)</label>
                  <select 
                    className="option-select"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                  >
                    <option value={1}>Tiêu chuẩn (1x)</option>
                    <option value={1.5}>Khá (1.5x)</option>
                    <option value={2}>Chất lượng Cao (2x) - Khuyên dùng</option>
                    <option value={3}>Siêu nét (3x) - Tốn thời gian hơn</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={processPDF}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
              >
                <RefreshCw size={20} />
                Bắt đầu chuyển đổi
              </button>
            </div>
          )}
        </div>
      ) : null}

      {isProcessing && (
        <div className="glass-card progress-container">
          <div className="progress-header">
            <span>Tiến trình xử lý</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {progressText}
          </p>
        </div>
      )}

      {imageResults.length > 0 && (
        <div className="glass-card pdf-result-section">
          <div className="result-header">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Kết quả chuyển đổi</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={startOver}
                className="btn btn-secondary"
              >
                <RefreshCw size={18} />
                Làm Lại
              </button>
              <button 
                onClick={downloadAll}
                className="btn btn-primary"
                disabled={isZipping}
              >
                {isZipping ? <Loader2 className="animate-spin" size={18} /> : <Archive size={18} />}
                Tải tất cả (ZIP)
              </button>
            </div>
          </div>

          <div className="images-grid">
            {currentImages.map((img) => (
              <div key={img.page} className="image-card group">
                <div className="image-wrapper">
                  <img src={img.url} alt={`Trang ${img.page}`} loading="lazy" />
                </div>
                <div className="image-info">
                  <span className="image-title">Trang {img.page}</span>
                  <a 
                    href={img.url}
                    download={`${file?.name.replace(/\.[^/.]+$/, "") || 'PDF'}_${img.filename}`}
                    className="icon-btn"
                    title="Tải ảnh trang này"
                  >
                    <Download size={18} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn btn-secondary"
                disabled={currentPageIndex === 1}
                onClick={() => setCurrentPageIndex(p => p - 1)}
              >
                <ChevronLeft size={18} /> Trước
              </button>
              <span className="page-info">
                Trang {currentPageIndex} / {totalPages}
              </span>
              <button 
                className="btn btn-secondary"
                disabled={currentPageIndex === totalPages}
                onClick={() => setCurrentPageIndex(p => p + 1)}
              >
                Sau <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

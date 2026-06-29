import { useState, useRef } from 'react';
import { Upload, FileText, RotateCcw, RotateCw, Trash2, Download, RefreshCw, FileBox } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import './PdfEditor.css';

// Initialize PDF.js worker via CDN to avoid Vite build issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PageData {
  id: number;
  originalIndex: number;
  dataUrl: string;
  rotation: number;
  isDeleted: boolean;
}

const PdfEditor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || selectedFile.type !== 'application/pdf') return;
    
    setFile(selectedFile);
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const loadedPages: PageData[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport } as any).promise;
          loadedPages.push({
            id: i,
            originalIndex: i - 1,
            dataUrl: canvas.toDataURL('image/jpeg', 0.8),
            rotation: 0,
            isDeleted: false
          });
        }
      }
      setPages(loadedPages);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Đã có lỗi xảy ra khi đọc file PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotateGlobal = (direction: 'cw' | 'ccw') => {
    setPages(pages.map(p => {
      if (p.isDeleted) return p;
      const newRot = direction === 'cw' ? (p.rotation + 90) % 360 : (p.rotation - 90 + 360) % 360;
      return { ...p, rotation: newRot };
    }));
  };

  const handleReset = () => {
    setPages(pages.map(p => ({ ...p, rotation: 0, isDeleted: false })));
  };

  const toggleDelete = (id: number) => {
    setPages(pages.map(p => p.id === id ? { ...p, isDeleted: !p.isDeleted } : p));
  };

  const rotatePage = (id: number, direction: 'cw' | 'ccw') => {
    setPages(pages.map(p => {
      if (p.id === id) {
        const newRot = direction === 'cw' ? (p.rotation + 90) % 360 : (p.rotation - 90 + 360) % 360;
        return { ...p, rotation: newRot };
      }
      return p;
    }));
  };

  const handleExport = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      const activePages = pages.filter(p => !p.isDeleted);
      const indicesToCopy = activePages.map(p => p.originalIndex);
      
      const copiedPages = await newPdf.copyPages(originalPdf, indicesToCopy);
      
      copiedPages.forEach((copiedPage, idx) => {
        const pageState = activePages[idx];
        if (pageState.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRotation + pageState.rotation));
        }
        newPdf.addPage(copiedPage);
      });

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${file.name}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Đã có lỗi khi xuất file.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="pdf-editor-container animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>PDF Editor Studio</h1>
          <p className="text-secondary">Xem trực quan, xoay chiều, xóa trang chuyên nghiệp</p>
        </div>

        <div 
          className="upload-zone"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">
            <Upload size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Kéo & thả file PDF của bạn vào đây</h3>
          <p className="text-secondary" style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
            Hoặc nhấp để chọn tệp từ máy tính của bạn. Mọi thao tác xử lý hoàn toàn trực tiếp trên trình duyệt, an toàn bảo mật tuyệt đối.
          </p>
          <button className="btn btn-primary">
            Chọn tệp tin PDF
          </button>
          <input 
            type="file" 
            accept="application/pdf" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            style={{ display: 'none' }} 
          />
        </div>
      </div>
    );
  }

  const activePagesCount = pages.filter(p => !p.isDeleted).length;

  return (
    <div className="pdf-editor-container animate-fade-in">
      <div className="editor-header">
        <div className="header-title-group">
          <div className="header-icon">
            <FileText size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>PDF Editor Studio</h2>
            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Xem trực quan, xoay chiều, xóa trang</p>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => handleRotateGlobal('ccw')} title="Xoay trái tất cả">
            <RotateCcw size={18} />
          </button>
          <button className="btn btn-secondary" onClick={() => handleRotateGlobal('cw')} title="Xoay phải tất cả">
            <RotateCw size={18} />
          </button>
          <button className="btn btn-secondary" onClick={handleReset}>
            <RefreshCw size={18} /> Reset toàn bộ
          </button>
          <button className="btn btn-primary" onClick={handleExport} disabled={isProcessing || activePagesCount === 0}>
            <Download size={18} /> {isProcessing ? 'Đang xử lý...' : `Xuất File PDF mới (${activePagesCount}/${pages.length})`}
          </button>
        </div>
      </div>

      <div className="file-info-card">
        <div className="file-info-left">
          <div className="file-icon-box">
            <FileBox size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>{file.name}</h4>
            <p className="text-secondary" style={{ fontSize: '0.875rem', margin: 0 }}>
              Kích thước: {(file.size / 1024).toFixed(2)} KB • Tổng cộng: {pages.length} trang ban đầu
            </p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => { setFile(null); setPages([]); }}>
          Đổi file khác
        </button>
      </div>

      <div className="pages-grid">
        {pages.map((page) => (
          <div key={page.id} className={`page-card ${page.isDeleted ? 'deleted' : ''}`}>
            <div className="page-header">
              <span className="page-badge">Trang {page.id}</span>
            </div>
            
            <div className="page-preview">
              <img 
                src={page.dataUrl} 
                alt={`Trang ${page.id}`} 
                style={{ transform: `rotate(${page.rotation}deg)` }} 
              />
            </div>

            <div className="page-actions">
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="action-btn" onClick={() => rotatePage(page.id, 'ccw')} title="Xoay trái">
                  <RotateCcw size={18} />
                </button>
                <button className="action-btn" onClick={() => rotatePage(page.id, 'cw')} title="Xoay phải">
                  <RotateCw size={18} />
                </button>
              </div>
              <button 
                className="action-btn delete" 
                onClick={() => toggleDelete(page.id)}
                title={page.isDeleted ? "Khôi phục" : "Xóa trang"}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {isProcessing && pages.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw size={32} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem' }}>Đang đọc file PDF...</p>
        </div>
      )}
    </div>
  );
};

export default PdfEditor;

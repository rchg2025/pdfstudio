import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Upload, FileText, RotateCcw, RotateCw, Trash2, Download, RefreshCw, 
  FileBox, Eye, X, Undo
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { PDFDocument, degrees } from 'pdf-lib';
import './PdfEditor.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

interface PageData {
  id: number;
  originalIndex: number;
  dataUrl: string;
  rotation: number;
  isDeleted: boolean;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pages, setPages] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewPage, setPreviewPage] = useState<PageData | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pagesPerPage = 12;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      loadPdf(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      loadPdf(selectedFile);
    }
  };

  const loadPdf = async (pdfFile: File) => {
    setFile(pdfFile);
    setFileSize(pdfFile.size);
    setIsLoading(true);
    setPages([]);
    setCurrentPage(1);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const typedarray = new Uint8Array(arrayBuffer);
      const pdf = await pdfjsLib.getDocument({ 
        data: typedarray,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
      }).promise;
      
      const loadedPages: PageData[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
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
      (pdf as any).destroy(); // Free memory
    } catch (error) {
      console.error(error);
      alert('Không thể đọc file PDF. File có thể bị hỏng hoặc đã được mã hóa mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDeletePage = (index: number) => {
    const newPages = [...pages];
    newPages[index].isDeleted = !newPages[index].isDeleted;
    setPages(newPages);
  };

  const rotatePage = (index: number, direction: 'cw' | 'ccw') => {
    const newPages = [...pages];
    let rot = newPages[index].rotation;
    rot = direction === 'cw' ? rot + 90 : rot - 90;
    if (rot >= 360) rot = 0;
    if (rot < 0) rot = 270;
    newPages[index].rotation = rot;
    setPages(newPages);
  };

  const rotateAllPages = (direction: 'cw' | 'ccw') => {
    setPages(prev => prev.map(p => {
      if (p.isDeleted) return p;
      let rot = p.rotation;
      rot = direction === 'cw' ? rot + 90 : rot - 90;
      if (rot >= 360) rot = 0;
      if (rot < 0) rot = 270;
      return { ...p, rotation: rot };
    }));
  };

  const resetAllChanges = () => {
    setPages(prev => prev.map(p => ({ ...p, rotation: 0, isDeleted: false })));
  };

  const exportPdf = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const activePages = pages.filter(p => !p.isDeleted);
      if (activePages.length === 0) {
        alert("Không thể xuất PDF trống.");
        setIsProcessing(false);
        return;
      }

      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      for (const p of activePages) {
        const [copiedPage] = await newPdf.copyPages(originalPdf, [p.originalIndex]);
        const originalRot = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees(originalRot + p.rotation));
        newPdf.addPage(copiedPage);
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi xử lý file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setPages([]);
    setCurrentPage(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const activeCount = pages.filter(p => !p.isDeleted).length;

  return (
    <div className="pdf-editor-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* HEADER */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--primary)', borderRadius: 'var(--radius-md)', color: 'white' }}>
            <FileText size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Công Cụ Chỉnh Sửa PDF 
            </h1>
            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Xem trực quan, xoay chiều và xóa trang</p>
          </div>
        </div>

        {file && !isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="icon-btn" onClick={() => rotateAllPages('ccw')} title="Xoay trái tất cả">
              <RotateCcw size={18} />
            </button>
            <button className="icon-btn" onClick={() => rotateAllPages('cw')} title="Xoay phải tất cả">
              <RotateCw size={18} />
            </button>
            <button onClick={resetAllChanges} title="Khôi phục trạng thái ban đầu" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 500, fontSize: '0.875rem', padding: '0.5rem 0.5rem', whiteSpace: 'nowrap', background: 'transparent', border: 'none', cursor: 'pointer', width: 'auto', height: 'auto' }}>
              <Undo size={16} /> Khôi phục
            </button>
            
            <div className="desktop-divider" style={{ width: '1px', height: '1.5rem', background: 'var(--border)', margin: '0 0.5rem' }}></div>
            
            <button 
              className="btn btn-primary"
              onClick={exportPdf}
              disabled={isProcessing || activeCount === 0}
              style={{ whiteSpace: 'nowrap', width: 'auto', flexShrink: 0 }}
            >
              {isProcessing ? (
                <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang xuất...</>
              ) : (
                <><Download size={16} /> Xuất PDF ({activeCount}/{pages.length})</>
              )}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0, flexDirection: 'row', flexWrap: 'wrap' }}>
        {/* PDF VIEWER/EDITOR */}
        <div style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!file && (
            <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div 
                className={`dropzone ${isDragging ? 'drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', maxWidth: '500px' }}
              >
                <Upload size={48} className="text-primary" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>Tải file PDF lên</h3>
                <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>Kéo thả file vào đây hoặc nhấn để chọn file từ máy tính</p>
                <button className="btn btn-secondary">Chọn File PDF</button>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}

          {isLoading && (
            <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <RefreshCw size={40} className="text-primary" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
              <h4 style={{ fontWeight: 600 }}>Đang phân tích các trang...</h4>
            </div>
          )}

          {!isLoading && file && pages.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
              <div className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                  <FileBox size={24} className="text-primary" />
                  <div style={{ overflow: 'hidden' }}>
                    <h4 style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</h4>
                    <p className="text-secondary" style={{ fontSize: '0.875rem' }}>{formatBytes(fileSize)} • {pages.length} trang</p>
                  </div>
                </div>
                <button className="icon-btn delete" onClick={handleClearFile} title="Đổi file khác">
                  <X size={20} />
                </button>
              </div>

              <div className="pages-grid" style={{ overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1rem' }}>
                {pages.slice((currentPage - 1) * pagesPerPage, currentPage * pagesPerPage).map((page, idx) => {
                  const globalIndex = (currentPage - 1) * pagesPerPage + idx;
                  return (
                  <div key={page.id} className={`page-card ${page.isDeleted ? 'deleted' : ''}`}>
                    <div className="page-header">
                      <span className="page-number">Trang {page.id}</span>
                      <button className="action-btn" onClick={() => setPreviewPage(page)} disabled={page.isDeleted}>
                        <Eye size={16} />
                      </button>
                    </div>
                    
                    <div className="page-preview-container">
                      <div className="page-preview-wrapper" style={{ transform: `rotate(${page.rotation}deg)` }}>
                        <img 
                          src={page.dataUrl} 
                          className="page-preview-img" 
                          alt={`Page ${page.id}`}
                        />
                      </div>
                      {page.isDeleted && (
                        <div className="deleted-overlay">
                          <Trash2 size={24} style={{ marginBottom: '0.5rem' }} />
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Đã xóa</span>
                        </div>
                      )}
                    </div>

                    <div className="page-actions">
                      <button className="action-btn" onClick={() => rotatePage(globalIndex, 'ccw')} disabled={page.isDeleted}>
                        <RotateCcw size={18} />
                      </button>
                      <button className="action-btn" onClick={() => rotatePage(globalIndex, 'cw')} disabled={page.isDeleted}>
                        <RotateCw size={18} />
                      </button>
                      <button className="action-btn delete" onClick={() => toggleDeletePage(globalIndex)}>
                        {page.isDeleted ? <Undo size={18} /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </div>
                )})}
              </div>

              {Math.ceil(pages.length / pagesPerPage) > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Trang trước
                  </button>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {currentPage} / {Math.ceil(pages.length / pagesPerPage)}
                  </span>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(pages.length / pagesPerPage), p + 1))}
                    disabled={currentPage === Math.ceil(pages.length / pagesPerPage)}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Trang sau
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {previewPage && createPortal(
        <div className="preview-modal-overlay" onClick={() => setPreviewPage(null)}>
          <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} className="text-primary" />
                Xem trước trang {previewPage.id}
              </h3>
              <button className="icon-btn delete" onClick={() => setPreviewPage(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="preview-modal-body">
              <div className="preview-modal-img-wrapper" style={{ transform: `rotate(${previewPage.rotation}deg)` }}>
                <img 
                  src={previewPage.dataUrl} 
                  alt="Preview" 
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

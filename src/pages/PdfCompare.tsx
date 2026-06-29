import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileBox, Trash2, GitCompare, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { useDialogs } from '../components/CustomDialogs';
import './PdfCompare.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export default function PdfCompare() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [pdf1, setPdf1] = useState<any>(null);
  const [pdf2, setPdf2] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState<'diff' | 'side' | 'f1' | 'f2'>('diff');

  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const canvasDiffRef = useRef<HTMLCanvasElement>(null);

  const { showAlert, showPrompt, DialogsComponent } = useDialogs();

  const loadPdfDocument = async (file: File, password?: string): Promise<any> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const typedarray = new Uint8Array(arrayBuffer);
      const pdf = await pdfjsLib.getDocument({ 
        data: typedarray,
        password: password,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
      }).promise;
      return pdf;
    } catch (error: any) {
      if (error?.name === 'PasswordException' || error?.message?.toLowerCase().includes('password')) {
        const userPwd = await showPrompt(password ? 'Mật khẩu sai! Vui lòng thử lại:' : `File "${file.name}" yêu cầu mật khẩu để mở:`);
        if (userPwd) {
          return loadPdfDocument(file, userPwd);
        }
      } else {
        showAlert(`Không thể đọc file "${file.name}". File có thể bị hỏng (corrupted) hoặc cấu trúc không được hỗ trợ.`);
      }
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileNum: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    
    setIsProcessing(true);
    const pdf = await loadPdfDocument(file);
    if (pdf) {
      if (fileNum === 1) {
        setFile1(file);
        setPdf1(pdf);
      } else {
        setFile2(file);
        setPdf2(pdf);
      }
    }
    setIsProcessing(false);
  };

  useEffect(() => {
    if (pdf1 || pdf2) {
      const maxPages = Math.max(pdf1?.numPages || 0, pdf2?.numPages || 0);
      setTotalPages(maxPages);
      setCurrentPage(1);
    }
  }, [pdf1, pdf2]);

  useEffect(() => {
    const renderPages = async () => {
      if (!pdf1 && !pdf2) return;
      setIsProcessing(true);

      const renderPageToCanvas = async (pdf: any, pageNum: number, canvas: HTMLCanvasElement | null) => {
        if (!canvas) return null;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;
        
        if (!pdf || pageNum > pdf.numPages) {
          canvas.width = 1;
          canvas.height = 1;
          ctx.clearRect(0, 0, 1, 1);
          return null;
        }

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        await page.render({ canvasContext: ctx, viewport }).promise;
        return { width: canvas.width, height: canvas.height, ctx };
      };

      try {
        const [res1, res2] = await Promise.all([
          renderPageToCanvas(pdf1, currentPage, canvas1Ref.current),
          renderPageToCanvas(pdf2, currentPage, canvas2Ref.current)
        ]);

        if (viewMode === 'diff' && canvasDiffRef.current) {
          const diffCanvas = canvasDiffRef.current;
          const diffCtx = diffCanvas.getContext('2d');
          if (diffCtx) {
            const w = Math.max(res1?.width || 1, res2?.width || 1);
            const h = Math.max(res1?.height || 1, res2?.height || 1);
            diffCanvas.width = w;
            diffCanvas.height = h;

            const img1 = res1?.ctx.getImageData(0, 0, res1.width, res1.height);
            const img2 = res2?.ctx.getImageData(0, 0, res2.width, res2.height);
            const diffData = diffCtx.createImageData(w, h);

            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const idxDiff = (y * w + x) * 4;
                
                const hasP1 = res1 && x < res1.width && y < res1.height;
                const hasP2 = res2 && x < res2.width && y < res2.height;

                if (!hasP1 && !hasP2) continue;

                if (hasP1 && hasP2 && img1 && img2) {
                  const idx1 = (y * res1.width + x) * 4;
                  const idx2 = (y * res2.width + x) * 4;

                  const rDiff = Math.abs(img1.data[idx1] - img2.data[idx2]);
                  const gDiff = Math.abs(img1.data[idx1+1] - img2.data[idx2+1]);
                  const bDiff = Math.abs(img1.data[idx1+2] - img2.data[idx2+2]);

                  if (rDiff > 20 || gDiff > 20 || bDiff > 20) {
                    diffData.data[idxDiff] = 255;
                    diffData.data[idxDiff+1] = 0;
                    diffData.data[idxDiff+2] = 0;
                    diffData.data[idxDiff+3] = 255;
                  } else {
                    diffData.data[idxDiff] = 255 - (255 - img2.data[idx2]) * 0.4;
                    diffData.data[idxDiff+1] = 255 - (255 - img2.data[idx2+1]) * 0.4;
                    diffData.data[idxDiff+2] = 255 - (255 - img2.data[idx2+2]) * 0.4;
                    diffData.data[idxDiff+3] = 255;
                  }
                } else if (hasP1 && img1) {
                  diffData.data[idxDiff] = 255;
                  diffData.data[idxDiff+1] = 0;
                  diffData.data[idxDiff+2] = 0;
                  diffData.data[idxDiff+3] = 255;
                } else if (hasP2 && img2) {
                  diffData.data[idxDiff] = 0;
                  diffData.data[idxDiff+1] = 200;
                  diffData.data[idxDiff+2] = 0;
                  diffData.data[idxDiff+3] = 255;
                }
              }
            }
            diffCtx.putImageData(diffData, 0, 0);
          }
        }
      } catch (err) {
        console.error("Lỗi render trang:", err);
      } finally {
        setIsProcessing(false);
      }
    };

    renderPages();
  }, [currentPage, pdf1, pdf2, viewMode]);

  const removeFile = (fileNum: 1 | 2) => {
    if (fileNum === 1) {
      setFile1(null);
      setPdf1(null);
    } else {
      setFile2(null);
      setPdf2(null);
    }
  };

  return (
    <div className="pdf-compare-container animate-fade-in">
      <div className="compare-header">
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>So Sánh Hai File PDF</h1>
        <p className="text-secondary">Phát hiện mọi sự khác biệt về văn bản và bố cục giữa hai tài liệu một cách trực quan.</p>
      </div>

      {(!pdf1 || !pdf2) && (
        <div className="compare-upload-grid">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: 'var(--primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.875rem' }}>1</span>
              File Gốc
            </h3>
            {!file1 ? (
              <label className="compare-dropzone">
                <Upload size={32} className="text-primary" style={{ marginBottom: '1rem' }} />
                <span style={{ fontWeight: 500 }}>Nhấn để chọn file</span>
                <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFileChange(e, 1)} />
              </label>
            ) : (
              <div className="file-selected-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                  <FileBox size={24} className="text-primary" />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{file1.name}</span>
                </div>
                <button className="icon-btn delete" onClick={() => removeFile(1)}><Trash2 size={18} /></button>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: 'var(--primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.875rem' }}>2</span>
              File Sửa Đổi
            </h3>
            {!file2 ? (
              <label className="compare-dropzone">
                <Upload size={32} className="text-primary" style={{ marginBottom: '1rem' }} />
                <span style={{ fontWeight: 500 }}>Nhấn để chọn file</span>
                <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFileChange(e, 2)} />
              </label>
            ) : (
              <div className="file-selected-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                  <FileBox size={24} className="text-primary" />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{file2.name}</span>
                </div>
                <button className="icon-btn delete" onClick={() => removeFile(2)}><Trash2 size={18} /></button>
              </div>
            )}
          </div>
        </div>
      )}

      {(pdf1 && pdf2) && (
        <div className="viewer-layout">
          <div className="viewer-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="view-mode-tabs">
                <button className={`view-mode-btn ${viewMode === 'diff' ? 'active' : ''}`} onClick={() => setViewMode('diff')}>
                  <GitCompare size={18} /> Điểm khác biệt
                </button>
                <button className={`view-mode-btn ${viewMode === 'side' ? 'active' : ''}`} onClick={() => setViewMode('side')}>
                  Song song
                </button>
                <button className={`view-mode-btn ${viewMode === 'f1' ? 'active' : ''}`} onClick={() => setViewMode('f1')}>
                  Bản gốc
                </button>
                <button className={`view-mode-btn ${viewMode === 'f2' ? 'active' : ''}`} onClick={() => setViewMode('f2')}>
                  Bản sửa đổi
                </button>
              </div>
              {isProcessing && <RefreshCw size={18} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                className="icon-btn" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isProcessing}
              >
                <ChevronLeft size={20} />
              </button>
              <span style={{ fontWeight: 500 }}>Trang {currentPage} / {totalPages}</span>
              <button 
                className="icon-btn" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isProcessing}
              >
                <ChevronRight size={20} />
              </button>
              
              <div style={{ width: '1px', height: '1.5rem', background: 'var(--border)', margin: '0 0.5rem' }}></div>
              <button className="btn btn-secondary" onClick={() => { removeFile(1); removeFile(2); }}>Đổi file</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', overflow: 'auto', paddingBottom: '1rem' }}>
            <div className="diff-canvas-container" style={{ display: viewMode === 'diff' ? 'flex' : 'none' }}>
              <canvas ref={canvasDiffRef}></canvas>
            </div>
            
            <div className="diff-canvas-container" style={{ display: viewMode === 'f1' ? 'flex' : (viewMode === 'side' ? 'flex' : 'none'), flex: 1 }}>
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>Bản gốc</div>
              <canvas ref={canvas1Ref}></canvas>
            </div>
            
            <div className="diff-canvas-container" style={{ display: viewMode === 'f2' ? 'flex' : (viewMode === 'side' ? 'flex' : 'none'), flex: 1 }}>
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>Bản sửa đổi</div>
              <canvas ref={canvas2Ref}></canvas>
            </div>
          </div>
        </div>
      )}
      
      <DialogsComponent />
    </div>
  );
}

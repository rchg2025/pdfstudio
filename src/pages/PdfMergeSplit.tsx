import { useState, useRef } from 'react';
import { 
  Link, Scissors, Upload, FileBox, Eye, ArrowUp, ArrowDown, Trash2, X, RefreshCw
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import './PdfMergeSplit.css';

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const parseRange = (rangeStr: string, maxPages: number): number[] | null => {
  const pages = new Set<number>();
  const parts = rangeStr.split(',');
  
  for (let part of parts) {
      part = part.trim();
      if (!part) continue;
      
      if (part.includes('-')) {
          const [startStr, endStr] = part.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          
          if (isNaN(start) || isNaN(end) || start < 1 || start > end) return null;
          
          for (let i = start; i <= Math.min(end, maxPages); i++) {
              pages.add(i);
          }
      } else {
          const page = parseInt(part, 10);
          if (isNaN(page) || page < 1) return null;
          if (page <= maxPages) pages.add(page);
      }
  }
  return Array.from(pages).sort((a, b) => a - b);
};

const PdfMergeSplit = () => {
  const [activeTab, setActiveTab] = useState<'merge' | 'split'>('merge');
  
  // Merge State
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const mergeInputRef = useRef<HTMLInputElement>(null);
  
  // Split State
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitTotalPages, setSplitTotalPages] = useState(0);
  const [splitRange, setSplitRange] = useState('');
  const splitInputRef = useRef<HTMLInputElement>(null);
  
  // Shared State
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // --- Merge Logic ---
  const handleMergeFiles = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    let files: FileList | File[] | null = null;
    
    if ('dataTransfer' in e) {
      files = e.dataTransfer.files;
    } else if (e.target instanceof HTMLInputElement) {
      files = e.target.files;
    }

    if (files) {
      const validFiles = Array.from(files).filter(f => f.type === 'application/pdf');
      if (validFiles.length > 0) {
        setMergeFiles(prev => [...prev, ...validFiles]);
      } else {
        alert("Chỉ hỗ trợ file định dạng PDF.");
      }
    }
  };

  const moveMergeFile = (index: number, direction: number) => {
    if (index + direction < 0 || index + direction >= mergeFiles.length) return;
    const newFiles = [...mergeFiles];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index + direction];
    newFiles[index + direction] = temp;
    setMergeFiles(newFiles);
  };

  const removeMergeFile = (index: number) => {
    setMergeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processMerge = async () => {
    if (mergeFiles.length < 2) {
      alert('Cần ít nhất 2 file PDF để tiến hành nối.');
      return;
    }

    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of mergeFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      triggerDownload(blob, 'TaiLieu_DaNoi.pdf');
      setMergeFiles([]);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi nối file. File có thể bị hỏng hoặc có mật khẩu.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Split Logic ---
  const handleSplitFile = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    let file: File | null = null;
    
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files[0];
    } else if (e.target instanceof HTMLInputElement) {
      file = e.target.files?.[0] || null;
    }

    if (file) {
      if (file.type !== 'application/pdf') {
        alert("Chỉ hỗ trợ file định dạng PDF.");
        return;
      }
      setSplitFile(file);
      setIsProcessing(true);
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        setSplitTotalPages(pdfDoc.getPageCount());
      } catch (error) {
        console.error(error);
        alert('Không thể đọc file PDF. File có thể bị hỏng hoặc có mật khẩu.');
        setSplitFile(null);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const processSplit = async () => {
    if (!splitFile) return;
    
    const rangeInput = splitRange.trim();
    if (!rangeInput) {
      alert('Vui lòng nhập số trang cần trích xuất.');
      return;
    }

    const pagesToExtract = parseRange(rangeInput, splitTotalPages);
    
    if (!pagesToExtract || pagesToExtract.length === 0) {
      alert('Định dạng trang không hợp lệ. Vui lòng kiểm tra lại cú pháp.');
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await splitFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();
      
      // pdf-lib index is 0-based
      const indices = pagesToExtract.map(p => p - 1);
      
      const copiedPages = await newDoc.copyPages(srcDoc, indices);
      copiedPages.forEach(page => newDoc.addPage(page));

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      
      const originalName = splitFile.name.replace(/\.[^/.]+$/, "");
      triggerDownload(blob, `${originalName}_TrichXuat.pdf`);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi trích xuất. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Common Logic ---
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openPreview = (file: File) => {
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const closePreview = () => {
    setPreviewFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const preventDefaults = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="pdf-merge-container animate-fade-in">
      <div className="merge-header">
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Công Cụ Nối & Tách PDF</h1>
        <p className="text-secondary">Xử lý hoàn toàn trên trình duyệt của bạn, đảm bảo quyền riêng tư tuyệt đối.</p>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'merge' ? 'active' : ''}`}
            onClick={() => setActiveTab('merge')}
          >
            <Link size={18} /> Nối PDF
          </button>
          <button 
            className={`tab-btn ${activeTab === 'split' ? 'active' : ''}`}
            onClick={() => setActiveTab('split')}
          >
            <Scissors size={18} /> Tách PDF
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* MERGE TAB */}
          {activeTab === 'merge' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Gộp nhiều file PDF thành 1 file duy nhất</h2>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Thêm file, sắp xếp lại thứ tự bằng các nút mũi tên và nhấn "Nối file".</p>
              </div>

              <div 
                className="dropzone"
                onDragEnter={preventDefaults}
                onDragOver={preventDefaults}
                onDragLeave={preventDefaults}
                onDrop={handleMergeFiles}
                onClick={() => mergeInputRef.current?.click()}
              >
                <Upload size={40} className="text-primary" style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                  Kéo thả file vào đây hoặc <span className="text-gradient">nhấn để chọn file</span>
                </p>
                <p className="text-secondary" style={{ fontSize: '0.75rem' }}>Chỉ hỗ trợ file .pdf</p>
                <input 
                  type="file" 
                  multiple 
                  accept="application/pdf" 
                  ref={mergeInputRef} 
                  onChange={handleMergeFiles} 
                  style={{ display: 'none' }} 
                />
              </div>

              {mergeFiles.length > 0 && (
                <ul className="file-list" style={{ marginTop: '1.5rem' }}>
                  {mergeFiles.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="file-item">
                      <div className="file-item-info">
                        <FileBox size={20} className="text-primary" />
                        <div style={{ overflow: 'hidden' }}>
                          <p className="file-item-name">{file.name}</p>
                          <p className="file-item-size">{formatBytes(file.size)}</p>
                        </div>
                      </div>
                      <div className="file-item-actions">
                        <button className="icon-btn" onClick={() => openPreview(file)} title="Xem trước file">
                          <Eye size={16} />
                        </button>
                        <div style={{ width: '1px', height: '1rem', background: 'var(--border)', margin: '0 4px' }}></div>
                        <button className="icon-btn" onClick={() => moveMergeFile(index, -1)} disabled={index === 0} title="Lên trên">
                          <ArrowUp size={16} />
                        </button>
                        <button className="icon-btn" onClick={() => moveMergeFile(index, 1)} disabled={index === mergeFiles.length - 1} title="Xuống dưới">
                          <ArrowDown size={16} />
                        </button>
                        <div style={{ width: '1px', height: '1rem', background: 'var(--border)', margin: '0 4px' }}></div>
                        <button className="icon-btn delete" onClick={() => removeMergeFile(index)} title="Xóa file">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {mergeFiles.length > 0 && (
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '1rem' }}
                  onClick={processMerge}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Đang xử lý...</>
                  ) : (
                    <><Link size={18} /> Nối file PDF</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* SPLIT TAB */}
          {activeTab === 'split' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Trích xuất các trang từ file PDF</h2>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Tải lên 1 file PDF và chọn các khoảng trang bạn muốn giữ lại để tạo thành file mới.</p>
              </div>

              {!splitFile ? (
                <div 
                  className="dropzone"
                  onDragEnter={preventDefaults}
                  onDragOver={preventDefaults}
                  onDragLeave={preventDefaults}
                  onDrop={handleSplitFile}
                  onClick={() => splitInputRef.current?.click()}
                >
                  <Upload size={40} className="text-primary" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                    Kéo thả file vào đây hoặc <span className="text-gradient">nhấn để chọn file</span>
                  </p>
                  <p className="text-secondary" style={{ fontSize: '0.75rem' }}>Chỉ hỗ trợ file .pdf</p>
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    ref={splitInputRef} 
                    onChange={handleSplitFile} 
                    style={{ display: 'none' }} 
                  />
                </div>
              ) : (
                <div className="split-controls">
                  <div className="split-file-header">
                    <div className="file-item-info">
                      <FileBox size={24} className="text-primary" />
                      <div>
                        <p className="file-item-name" style={{ fontSize: '1.125rem' }}>{splitFile.name}</p>
                        <p className="file-item-size" style={{ fontSize: '0.875rem' }}>
                          {formatBytes(splitFile.size)} • {splitTotalPages} trang
                        </p>
                      </div>
                    </div>
                    <div className="file-item-actions">
                      <button className="icon-btn" onClick={() => openPreview(splitFile)} title="Xem trước file">
                        <Eye size={20} />
                      </button>
                      <button className="icon-btn delete" onClick={() => { setSplitFile(null); setSplitRange(''); }} title="Xóa file này">
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Các trang cần trích xuất:</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder={`Ví dụ: 1, 3, 5-${Math.min(10, splitTotalPages)}`}
                      value={splitRange}
                      onChange={e => setSplitRange(e.target.value)}
                    />
                    <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                      Nhập số trang cách nhau bằng dấu phẩy, hoặc dùng dấu gạch ngang cho khoảng trang.
                    </p>
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%' }}
                    onClick={processSplit}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Đang xử lý...</>
                    ) : (
                      <><Scissors size={18} /> Trích xuất file PDF</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="merge-preview-modal-overlay" onClick={closePreview}>
          <div className="merge-preview-modal-content" onClick={e => e.stopPropagation()}>
            <div className="merge-preview-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.125rem' }} className="file-item-name">
                Xem trước: {previewFile.name}
              </h3>
              <button className="icon-btn delete" onClick={closePreview}>
                <X size={24} />
              </button>
            </div>
            <iframe className="merge-preview-iframe" src={previewUrl}></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfMergeSplit;

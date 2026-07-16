import { useState } from 'react';
import { Download, Loader2, Trash2, Undo2, FileText, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import FileUploadZone from '../components/FileUploadZone';
import { useDialogs } from '../components/CustomDialogs';
import './DeletePdfPages.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PageData {
  id: number;
  originalIndex: number;
  dataUrl: string;
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

export default function DeletePdfPages() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileSize, setFileSize] = useState(0);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [processedFile, setProcessedFile] = useState<{ url: string, size: number, name: string } | null>(null);

  const { showAlert, showPrompt, DialogsComponent } = useDialogs();

  const handleFileSelect = (files: FileList | null) => {
    const selectedFile = files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      loadPdf(selectedFile);
    } else {
      showAlert('Vui lòng chọn file PDF hợp lệ', 'Lỗi định dạng');
    }
  };

  const loadPdf = async (pdfFile: File, password?: string) => {
    setFile(pdfFile);
    setFileSize(pdfFile.size);
    setIsLoading(true);
    setProcessedFile(null);
    setSelectedPageIndex(0);
    if (!password) {
      setPages([]);
    }

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const typedarray = new Uint8Array(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({ 
        data: typedarray,
        password: password,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
      });
      const pdf = await loadingTask.promise;
      
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
            isDeleted: false
          });
        }
      }
      setPages(loadedPages);
      await loadingTask.destroy();
    } catch (error: any) {
      console.error(error);
      if (error?.name === 'PasswordException' || error?.message?.toLowerCase().includes('password')) {
        const userPwd = await showPrompt(password ? 'Mật khẩu sai! Vui lòng thử lại:' : 'File PDF này yêu cầu mật khẩu để mở:');
        if (userPwd) {
          loadPdf(pdfFile, userPwd);
          return;
        } else {
          setFile(null);
          setPages([]);
        }
      } else {
        showAlert(`Không thể đọc file PDF. File có thể bị hỏng (corrupted).\nChi tiết: ${error?.message || error}`);
        setFile(null);
        setPages([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDeletePage = (index: number) => {
    setProcessedFile(null);
    const newPages = [...pages];
    newPages[index].isDeleted = !newPages[index].isDeleted;
    setPages(newPages);
  };

  const handleProcess = async () => {
    if (!file || pages.length === 0) return;

    const remainingPages = pages.filter(p => !p.isDeleted);
    if (remainingPages.length === 0) {
      showAlert('Bạn đã xóa tất cả các trang. Vui lòng giữ lại ít nhất 1 trang.', 'Lỗi');
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdfDoc = await PDFDocument.create();

      const pageIndicesToKeep = remainingPages.map(p => p.originalIndex);
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndicesToKeep);

      copiedPages.forEach((page) => {
        newPdfDoc.addPage(page);
      });

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const originalName = file.name.replace(/\.pdf$/i, '');
      setProcessedFile({
        url,
        size: blob.size,
        name: `${originalName}-da-xoa-trang.pdf`
      });

    } catch (error) {
      console.error(error);
      showAlert('Đã xảy ra lỗi khi tạo file PDF mới.', 'Lỗi xử lý');
    } finally {
      setIsProcessing(false);
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

  const resetWorkspace = () => {
    setFile(null);
    setPages([]);
    setProcessedFile(null);
  };

  const remainingCount = pages.filter(p => !p.isDeleted).length;
  const deletedCount = pages.length - remainingCount;

  return (
    <div className="delete-pdf-container">
      <DialogsComponent />
      
      <div className="delete-pdf-header">
        <h1 className="text-2xl font-bold mb-2">Xóa trang PDF</h1>
        <p className="text-secondary">Xóa các trang không cần thiết khỏi file PDF một cách trực quan.</p>
      </div>

      {!file && !isLoading ? (
        <div className="delete-pdf-workspace" style={{ padding: '2rem' }}>
          <FileUploadZone 
            onFileSelect={handleFileSelect} 
            accept=".pdf"
            hintText="Chọn file PDF hoặc kéo thả vào đây"
            multiple={false}
          />
        </div>
      ) : isLoading ? (
        <div className="delete-pdf-workspace flex items-center justify-center" style={{ minHeight: '400px' }}>
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-lg">Đang đọc file PDF, vui lòng đợi...</p>
          </div>
        </div>
      ) : (
        <div className="delete-pdf-workspace">
          <div className="flex justify-between items-center mb-2 p-3 bg-primary rounded border border-border">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText className="text-red-500 shrink-0" />
              <div className="truncate">
                <p className="font-medium truncate">{file?.name}</p>
                <p className="text-sm text-secondary">
                  {formatBytes(fileSize)} · {pages.length} trang
                </p>
              </div>
            </div>
            <button 
              onClick={resetWorkspace}
              className="p-2 hover:bg-secondary rounded-full transition-colors shrink-0"
              title="Đóng file"
            >
              <X size={20} className="text-secondary" />
            </button>
          </div>

          <div className="workspace-panels">
            {/* Cột trái: Thumbnails */}
            <div className="sidebar-panel">
              <div className="sidebar-header">
                Danh sách trang
                <span className="text-sm text-secondary font-normal">{pages.length} trang</span>
              </div>
              <div className="thumbnails-list">
                {pages.map((page, index) => (
                  <div 
                    key={page.id} 
                    className={`thumbnail-wrapper ${selectedPageIndex === index ? 'selected' : ''} ${page.isDeleted ? 'deleted' : ''}`}
                    onClick={() => setSelectedPageIndex(index)}
                  >
                    <img src={page.dataUrl} alt={`Page ${page.id}`} />
                    <div className="page-number">{page.id}</div>
                    
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDeletePage(index);
                      }}
                      title={page.isDeleted ? "Hoàn tác xóa" : "Xóa trang này"}
                    >
                      {page.isDeleted ? <Undo2 size={16} /> : <Trash2 size={16} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột phải: Preview */}
            <div className="preview-panel">
              <div className="preview-header">
                Xem trước trang {pages[selectedPageIndex]?.id}
              </div>
              <div className={`preview-content ${pages[selectedPageIndex]?.isDeleted ? 'deleted-preview' : ''}`}>
                {pages[selectedPageIndex] && (
                  <img src={pages[selectedPageIndex].dataUrl} alt={`Preview Page ${pages[selectedPageIndex].id}`} />
                )}
              </div>
            </div>
          </div>

          {/* Footer controls */}
          <div className="workspace-footer">
            <div className="status-text">
              Sẽ giữ lại <span className="highlight">{remainingCount}</span> trang, 
              xóa <span className="highlight-danger">{deletedCount}</span> trang.
            </div>
            
            {!processedFile ? (
              <button 
                className="btn-process" 
                onClick={handleProcess}
                disabled={isProcessing || remainingCount === 0}
              >
                {isProcessing ? (
                  <><Loader2 className="animate-spin" size={20} /> Đang xử lý...</>
                ) : (
                  <>Xử lý ngay</>
                )}
              </button>
            ) : (
              <button 
                className="btn-process" 
                style={{ background: '#28a745' }}
                onClick={handleDownload}
              >
                <Download size={20} />
                Tải về ({formatBytes(processedFile.size)})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

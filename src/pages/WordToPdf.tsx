import { useState, useEffect } from 'react';
import { Download, FileText, Loader2, FileArchive, Trash2, CheckCircle2 } from 'lucide-react';
import FileUploadZone from '../components/FileUploadZone';
import { useDialogs } from '../components/CustomDialogs';
import * as mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';
import JSZip from 'jszip';
import './WordToPdf.css';

interface WordFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  pdfBlob?: Blob;
  pdfUrl?: string;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function WordToPdf() {
  const [files, setFiles] = useState<WordFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { showAlert } = useDialogs();

  useEffect(() => {
    return () => {
      // Cleanup URLs
      files.forEach(f => {
        if (f.pdfUrl) URL.revokeObjectURL(f.pdfUrl);
      });
    };
  }, [files]);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: WordFile[] = [];
    const validTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    Array.from(selectedFiles).forEach((file) => {
      // Validate by extension or mime type
      const isWord = validTypes.includes(file.type) || file.name.endsWith('.doc') || file.name.endsWith('.docx');
      if (isWord) {
        newFiles.push({
          id: Math.random().toString(36).substring(7),
          file,
          status: 'pending'
        });
      }
    });

    if (newFiles.length === 0) {
      showAlert('Vui lòng chọn file Word hợp lệ (.doc, .docx)', 'Lỗi định dạng');
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => {
      if (f.id === id && f.pdfUrl) {
        URL.revokeObjectURL(f.pdfUrl);
      }
      return f.id !== id;
    }));
  };

  const convertFile = async (wordFile: WordFile): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await wordFile.file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;

        const htmlContent = `
          <div style="padding: 20px; font-family: 'Times New Roman', Times, serif; font-size: 14pt; line-height: 1.5; color: #000; width: 800px; max-width: 800px; margin: 0 auto; background: white;">
            ${html || '<i>Tài liệu trống hoặc không thể đọc nội dung chữ.</i>'}
          </div>
        `;

        const opt = {
          margin:       10,
          filename:     'temp.pdf',
          image:        { type: 'jpeg' as const, quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        const pdfBlob = await html2pdf().set(opt).from(htmlContent).output('blob');
        resolve(pdfBlob);
      } catch (err) {
        reject(err);
      }
    });
  };

  const processAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) return;

    setIsProcessing(true);

    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status !== 'pending' && updatedFiles[i].status !== 'error') continue;

      updatedFiles[i] = { ...updatedFiles[i], status: 'processing' };
      setFiles([...updatedFiles]);

      try {
        const pdfBlob = await convertFile(updatedFiles[i]);
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        updatedFiles[i] = { 
          ...updatedFiles[i], 
          status: 'done', 
          pdfBlob, 
          pdfUrl 
        };
      } catch (error) {
        console.error("Lỗi khi chuyển đổi:", error);
        updatedFiles[i] = { ...updatedFiles[i], status: 'error' };
      }
      setFiles([...updatedFiles]);
    }

    setIsProcessing(false);
  };

  const downloadFile = (file: WordFile) => {
    if (!file.pdfUrl) return;
    const a = document.createElement('a');
    a.href = file.pdfUrl;
    a.download = file.file.name.replace(/\.(docx|doc)$/i, '.pdf');
    a.click();
  };

  const downloadAllAsZip = async () => {
    const doneFiles = files.filter(f => f.status === 'done' && f.pdfBlob);
    if (doneFiles.length === 0) return;

    const zip = new JSZip();
    doneFiles.forEach(f => {
      const fileName = f.file.name.replace(/\.(docx|doc)$/i, '.pdf');
      zip.file(fileName, f.pdfBlob!);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = "word_to_pdf_converted.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasPending = files.some(f => f.status === 'pending' || f.status === 'error');
  const hasDone = files.some(f => f.status === 'done');

  return (
    <div className="word-to-pdf-container">
      <div className="word-to-pdf-header">
        <h1 className="text-2xl font-bold mb-2">Chuyển Word sang PDF</h1>
        <p className="text-secondary">Chuyển đổi file văn bản (.docx, .doc) sang PDF hoàn toàn trên trình duyệt.</p>
      </div>

      <div className="word-to-pdf-tool-card">
        <div className="word-to-pdf-workspace">
          
          <FileUploadZone 
            onFileSelect={handleFileSelect} 
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            hintText="Chọn hoặc kéo thả các file Word vào đây"
            multiple={true}
          />

          {files.length > 0 && (
            <div className="file-list-section">
              <div className="file-list-header">
                <h3>Danh sách file ({files.length})</h3>
                <button 
                  className="text-danger hover:underline text-sm font-medium"
                  onClick={() => setFiles([])}
                  disabled={isProcessing}
                >
                  Xóa tất cả
                </button>
              </div>

              <div className="file-list mt-4">
                {files.map(f => (
                  <div key={f.id} className="file-item">
                    <div className="file-info">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                        <FileText size={24} />
                      </div>
                      <div className="file-details">
                        <span className="file-name" title={f.file.name}>{f.file.name}</span>
                        <span className="file-size">{formatBytes(f.file.size)}</span>
                      </div>
                    </div>

                    <div className="file-actions">
                      {f.status === 'pending' && (
                        <span className="text-sm text-secondary px-2">Chờ xử lý</span>
                      )}
                      {f.status === 'processing' && (
                        <Loader2 className="animate-spin text-primary" size={20} />
                      )}
                      {f.status === 'error' && (
                        <span className="text-sm text-danger px-2">Lỗi</span>
                      )}
                      {f.status === 'done' && (
                        <>
                          <CheckCircle2 className="text-success" size={20} />
                          <button 
                            className="btn-icon text-primary" 
                            title="Tải xuống"
                            onClick={() => downloadFile(f)}
                          >
                            <Download size={18} />
                          </button>
                        </>
                      )}
                      
                      {f.status !== 'processing' && (
                        <button 
                          className="btn-icon text-danger" 
                          title="Xóa"
                          onClick={() => removeFile(f.id)}
                          disabled={isProcessing}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="workspace-actions">
                {hasPending && (
                  <button 
                    className="btn-primary" 
                    onClick={processAll}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <><Loader2 className="animate-spin" size={20} /> Đang chuyển đổi...</>
                    ) : (
                      'Chuyển đổi tất cả'
                    )}
                  </button>
                )}
                
                {hasDone && (
                  <button 
                    className="btn-success" 
                    onClick={downloadAllAsZip}
                    disabled={isProcessing}
                  >
                    <FileArchive size={20} />
                    Tải tất cả (ZIP)
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

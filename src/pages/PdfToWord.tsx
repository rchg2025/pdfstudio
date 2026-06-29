import React, { useState, useEffect, useRef } from 'react';
import { FileDown, FileText, Loader2 } from 'lucide-react';
import { Pdf2Docx } from 'pdf2docx-wasm';
import FileUploadZone from '../components/FileUploadZone';
import { useDialogs } from '../components/CustomDialogs';

const PdfToWord: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [engineLoadingError, setEngineLoadingError] = useState<string | null>(null);
  const converterRef = useRef<any>(null);
  const { showAlert, DialogsComponent } = useDialogs();

  useEffect(() => {
    // Khởi tạo engine WASM khi mở trang
    const initEngine = async () => {
      try {
        const converter = new Pdf2Docx(window.location.origin + '/pdf2docx-wasm/');
        // Preload engine in background
        await (converter as any).load();
        converterRef.current = converter;
        setIsEngineReady(true);
      } catch (err: any) {
        console.error('Lỗi tải WASM engine:', err);
        setEngineLoadingError('Không thể tải công cụ chuyển đổi. Vui lòng thử lại sau.');
      }
    };
    initEngine();
  }, []);

  const handleFileSelect = (files: FileList | null) => {
    const selectedFile = files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      showAlert('Vui lòng chọn một file PDF hợp lệ.');
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    
    if (!isEngineReady || !converterRef.current) {
      showAlert('Công cụ chuyển đổi đang được tải, vui lòng đợi trong giây lát...');
      return;
    }

    setIsProcessing(true);
    try {
      // Gọi hàm convert của pdf2docx-wasm
      const docxBlob = await converterRef.current.convert(file);
      
      const url = URL.createObjectURL(docxBlob);
      const a = document.createElement('a');
      a.href = url;
      const origName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      a.download = `${origName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      console.error(error);
      showAlert('Có lỗi xảy ra trong quá trình chuyển đổi: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gradient">Chuyển Đổi PDF sang Word</h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Chuyển đổi file PDF sang Word (.docx) giữ nguyên cấu trúc, bảng biểu và hình ảnh. Quá trình xử lý diễn ra 100% trên trình duyệt của bạn (Offline), bảo mật tuyệt đối!
        </p>
      </div>

      <div className="tool-container">
        <div className="glass-panel p-8">
          
          {engineLoadingError ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6 text-center">
              {engineLoadingError}
            </div>
          ) : !isEngineReady ? (
            <div className="bg-primary/10 text-primary p-4 rounded-lg mb-6 flex items-center justify-center gap-3">
              <Loader2 className="animate-spin" size={24} />
              <div className="text-left">
                <h4 className="font-semibold">Đang tải bộ chuyển đổi AI thông minh (WASM)...</h4>
                <p className="text-sm opacity-80">Quá trình này tải khoảng 50MB tài nguyên và có thể mất một vài phút ở lần đầu tiên. Vui lòng đợi!</p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/10 text-emerald-600 p-4 rounded-lg mb-6 text-center font-medium">
              Công cụ đã sẵn sàng! Có thể chuyển đổi ngay lập tức.
            </div>
          )}

          {!file ? (
            <FileUploadZone 
              onFileSelect={handleFileSelect}
              accept=".pdf,application/pdf"
              hintText="Hoặc click để chọn file PDF"
            />
          ) : (
            <div className="bg-secondary/30 rounded-xl p-8 text-center border border-border transition-all">
              <FileText size={64} className="mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">{file.name}</h3>
              <p className="text-muted mb-6">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  className="btn-outline px-8 py-3 flex items-center justify-center gap-2"
                  onClick={() => setFile(null)}
                  disabled={isProcessing}
                >
                  Chọn file khác
                </button>
                <button
                  className="btn-primary px-8 py-3 flex items-center justify-center gap-2"
                  onClick={handleConvert}
                  disabled={isProcessing || !isEngineReady}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <FileDown size={20} />
                      Chuyển sang Word (.docx)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
        </div>
      </div>
      <DialogsComponent />
    </div>
  );
};

export default PdfToWord;

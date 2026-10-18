import { useState } from 'react';
import { 
  FileText, 
  Download, 
  Loader2, 
  Sparkles, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Palette, 
  Eye, 
  RotateCcw,
  Sliders
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import FileUploadZone from '../components/FileUploadZone';
import { useDialogs } from '../components/CustomDialogs';
import './PdfPageNumber.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PagePreview {
  pageNumber: number;
  dataUrl: string;
}

export default function PdfPageNumber() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Cấu hình đánh số trang
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'>('bottom-center');
  const [format, setFormat] = useState<'{n}' | '{n}/{total}' | 'Trang {n}' | 'Trang {n}/{total}' | '- {n} -'>('Trang {n}/{total}');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [skipFirstPage, setSkipFirstPage] = useState<boolean>(true); // Bỏ qua trang bìa
  const [fontSize, setFontSize] = useState<number>(11);
  const [fontColor, setFontColor] = useState<string>('#475569');
  const [marginOffset, setMarginOffset] = useState<number>(25); // Khoảng cách từ mép trang (points)

  const [processedFile, setProcessedFile] = useState<{ url: string; name: string; size: number } | null>(null);
  const { showAlert, DialogsComponent } = useDialogs();

  // Load PDF và render thumbnail các trang đầu
  const handleFileSelect = async (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected || selected.type !== 'application/pdf') {
      showAlert('Vui lòng chọn một file PDF hợp lệ', 'Lỗi định dạng');
      return;
    }

    setFile(selected);
    setIsLoading(true);
    setProcessedFile(null);
    setPagePreviews([]);

    try {
      const arrayBuffer = await selected.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({
        data: typedArray,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true
      });
      const pdf = await loadingTask.promise;
      setTotalPages(pdf.numPages);

      // Render thumbnail tối đa 6 trang đầu để xem trước
      const previews: PagePreview[] = [];
      const renderCount = Math.min(pdf.numPages, 6);
      for (let i = 1; i <= renderCount; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.6 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport } as any).promise;
          previews.push({
            pageNumber: i,
            dataUrl: canvas.toDataURL('image/jpeg', 0.8)
          });
        }
      }
      setPagePreviews(previews);
    } catch (err: any) {
      console.error(err);
      showAlert('Không thể đọc file PDF này. File có thể bị hỏng hoặc có mật khẩu bảo vệ.', 'Lỗi');
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Tạo chuỗi số trang hiển thị theo định dạng
  const getPageText = (pageIdx: number, total: number) => {
    const n = pageIdx + startNumber;
    switch (format) {
      case '{n}': return `${n}`;
      case '{n}/{total}': return `${n}/${total}`;
      case 'Trang {n}': return `Trang ${n}`;
      case 'Trang {n}/{total}': return `Trang ${n}/${total}`;
      case '- {n} -': return `- ${n} -`;
      default: return `${n}`;
    }
  };

  // Chuyển hex color sang rgb 0..1 của pdf-lib
  const hexToPdfRgb = (hex: string) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return rgb((num >> 16) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
  };

  // Đóng dấu số trang vào file PDF
  const handleApplyPageNumbers = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProcessedFile(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      pdfDoc.registerFontkit(fontkit);

      // Nhúng font Roboto để hỗ trợ hiển thị từ "Trang" tiếng Việt chuẩn không lỗi
      let customFont;
      try {
        const fontRes = await fetch('/fonts/Roboto-Regular.ttf');
        if (fontRes.ok) {
          const fontBytes = await fontRes.arrayBuffer();
          customFont = await pdfDoc.embedFont(fontBytes);
        } else {
          customFont = await pdfDoc.embedFont('Helvetica');
        }
      } catch {
        customFont = await pdfDoc.embedFont('Helvetica');
      }

      const pages = pdfDoc.getPages();
      const totalEffective = skipFirstPage ? pages.length - 1 : pages.length;
      const pdfColor = hexToPdfRgb(fontColor);

      pages.forEach((page, idx) => {
        // Bỏ qua trang đầu nếu bật skipFirstPage
        if (skipFirstPage && idx === 0) return;

        const effectiveIdx = skipFirstPage ? idx - 1 : idx;
        const text = getPageText(effectiveIdx, totalEffective);
        const { width, height } = page.getSize();
        const textWidth = customFont.widthOfTextAtSize(text, fontSize);
        const textHeight = customFont.heightAtSize(fontSize);

        let x = 0;
        let y = 0;

        // Tính tọa độ Y
        if (position.startsWith('top')) {
          y = height - marginOffset - textHeight;
        } else {
          y = marginOffset;
        }

        // Tính tọa độ X
        if (position.endsWith('center')) {
          x = (width - textWidth) / 2;
        } else if (position.endsWith('right')) {
          x = width - marginOffset - textWidth;
        } else {
          x = marginOffset;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font: customFont,
          color: pdfColor
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const originalName = file.name.replace(/\.[^/.]+$/, '');

      setProcessedFile({
        url: downloadUrl,
        name: `${originalName}-danh-so-trang.pdf`,
        size: blob.size
      });
    } catch (err: any) {
      console.error(err);
      showAlert('Đã xảy ra lỗi khi đánh số trang PDF: ' + err.message, 'Lỗi xử lý');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPagePreviews([]);
    setProcessedFile(null);
    setTotalPages(0);
  };

  return (
    <div className="pdf-number-page animate-fade-in">
      <DialogsComponent />

      {/* Header */}
      <header className="pn-header">
        <div className="pn-title-group">
          <div className="pn-icon">
            <FileText size={28} />
          </div>
          <div>
            <h1 className="pn-title">Đánh Số Trang PDF Tự Động (Add Page Numbers to PDF)</h1>
            <p className="pn-subtitle">
              Đánh số thứ tự các trang PDF theo chuẩn in ấn & tài liệu khoa học: Tùy chỉnh vị trí, định dạng, font chữ tiếng Việt và bỏ qua trang bìa.
            </p>
          </div>
        </div>

        {file && (
          <button className="pn-btn pn-btn-outline" onClick={resetAll}>
            <RotateCcw size={16} />
            <span>Chọn file khác</span>
          </button>
        )}
      </header>

      {!file ? (
        <div className="pn-upload-container">
          <FileUploadZone 
            onFileSelect={handleFileSelect}
            accept="application/pdf"
            hintText="Kéo & thả file PDF hoặc bấm để chọn tài liệu từ máy tính"
          />
        </div>
      ) : (
        <div className="pn-workspace-grid">
          {/* Cột Cấu Hình Bên Trái */}
          <div className="pn-controls-card">
            <h2 className="card-heading">
              <Sliders size={20} />
              <span>Tùy Chọn Đánh Số Trang</span>
            </h2>

            {/* Vị trí trên trang */}
            <div className="form-group">
              <label className="form-label">Vị trí hiển thị số trang:</label>
              <div className="position-grid">
                <button 
                  className={`pos-btn ${position === 'top-left' ? 'active' : ''}`}
                  onClick={() => setPosition('top-left')}
                >
                  <AlignLeft size={16} /> Góc trên trái
                </button>
                <button 
                  className={`pos-btn ${position === 'top-center' ? 'active' : ''}`}
                  onClick={() => setPosition('top-center')}
                >
                  <AlignCenter size={16} /> Góc trên giữa
                </button>
                <button 
                  className={`pos-btn ${position === 'top-right' ? 'active' : ''}`}
                  onClick={() => setPosition('top-right')}
                >
                  <AlignRight size={16} /> Góc trên phải
                </button>
                <button 
                  className={`pos-btn ${position === 'bottom-left' ? 'active' : ''}`}
                  onClick={() => setPosition('bottom-left')}
                >
                  <AlignLeft size={16} /> Góc dưới trái
                </button>
                <button 
                  className={`pos-btn ${position === 'bottom-center' ? 'active' : ''}`}
                  onClick={() => setPosition('bottom-center')}
                >
                  <AlignCenter size={16} /> Dưới cùng giữa
                </button>
                <button 
                  className={`pos-btn ${position === 'bottom-right' ? 'active' : ''}`}
                  onClick={() => setPosition('bottom-right')}
                >
                  <AlignRight size={16} /> Góc dưới phải
                </button>
              </div>
            </div>

            {/* Định dạng số trang */}
            <div className="form-group">
              <label className="form-label">Định dạng hiển thị:</label>
              <select 
                className="pn-select"
                value={format}
                onChange={e => setFormat(e.target.value as any)}
              >
                <option value="Trang {n}/{total}">Trang 1/{totalPages} (Khuyên dùng chuẩn văn bản)</option>
                <option value="Trang {n}">Trang 1</option>
                <option value="{n}/{total}">1/{totalPages}</option>
                <option value="{n}">Chỉ hiện số: 1</option>
                <option value="- {n} -">Dạng gạch ngang: - 1 -</option>
              </select>
            </div>

            {/* Tùy chọn trang bìa & số bắt đầu */}
            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Bắt đầu từ số:</label>
                <input 
                  type="number" 
                  min={1} 
                  max={9999}
                  className="pn-input"
                  value={startNumber}
                  onChange={e => setStartNumber(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Cỡ chữ (pt):</label>
                <input 
                  type="number" 
                  min={8} 
                  max={24}
                  className="pn-input"
                  value={fontSize}
                  onChange={e => setFontSize(parseInt(e.target.value) || 11)}
                />
              </div>
            </div>

            {/* Màu sắc & Khoảng cách lề */}
            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">
                  <Palette size={15} /> Màu chữ:
                </label>
                <div className="color-picker-row">
                  <input 
                    type="color" 
                    className="color-input"
                    value={fontColor}
                    onChange={e => setFontColor(e.target.value)}
                  />
                  <span className="color-text">{fontColor}</span>
                </div>
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Cách mép (pt):</label>
                <input 
                  type="number" 
                  min={10} 
                  max={80}
                  className="pn-input"
                  value={marginOffset}
                  onChange={e => setMarginOffset(parseInt(e.target.value) || 25)}
                />
              </div>
            </div>

            {/* Toggle bỏ qua trang đầu (Trang bìa) */}
            <label className="checkbox-toggle">
              <input 
                type="checkbox"
                checked={skipFirstPage}
                onChange={e => setSkipFirstPage(e.target.checked)}
              />
              <div>
                <strong>Bỏ qua trang đầu tiên (Trang bìa)</strong>
                <p>Không in số trang lên trang bìa và bắt đầu đếm số trang từ trang thứ 2.</p>
              </div>
            </label>

            {/* Nút hành động chính */}
            <div className="action-buttons-box">
              <button 
                className="pn-btn pn-btn-primary full-width"
                disabled={isProcessing}
                onClick={handleApplyPageNumbers}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Đang chèn số trang...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Thực Hiện Đánh Số Trang</span>
                  </>
                )}
              </button>

              {processedFile && (
                <a 
                  href={processedFile.url}
                  download={processedFile.name}
                  className="pn-btn pn-btn-success full-width animate-fade-in"
                >
                  <Download size={18} />
                  <span>Tải Về File PDF Đã Đánh Số ({Math.round(processedFile.size / 1024)} KB)</span>
                </a>
              )}
            </div>
          </div>

          {/* Cột Xem Trước Bên Phải */}
          <div className="pn-preview-card">
            <div className="preview-header">
              <div className="preview-title">
                <Eye size={18} />
                <span>Xem Trước Vị Trí Số Trang (Mẫu {pagePreviews.length} Trang Đầu)</span>
              </div>
              <span className="file-info-badge">
                {file.name} • {totalPages} Trang
              </span>
            </div>

            {isLoading ? (
              <div className="preview-loading">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p>Đang kết xuất các trang tài liệu...</p>
              </div>
            ) : (
              <div className="preview-grid">
                {pagePreviews.map(p => {
                  const isSkipped = skipFirstPage && p.pageNumber === 1;
                  const effectiveIdx = skipFirstPage ? p.pageNumber - 2 : p.pageNumber - 1;
                  const sampleText = isSkipped ? null : getPageText(effectiveIdx, skipFirstPage ? totalPages - 1 : totalPages);

                  return (
                    <div key={p.pageNumber} className="page-thumbnail-box">
                      <div className="page-badge">Trang {p.pageNumber}</div>
                      <div className="page-image-wrapper">
                        <img src={p.dataUrl} alt={`Trang ${p.pageNumber}`} className="page-img" />
                        
                        {/* Overlay hiển thị vị trí số trang theo preview */}
                        {sampleText && (
                          <div 
                            className={`page-number-overlay pos-${position}`}
                            style={{
                              color: fontColor,
                              fontSize: `${fontSize * 0.9}px`
                            }}
                          >
                            {sampleText}
                          </div>
                        )}

                        {isSkipped && (
                          <div className="page-skipped-overlay">
                            <span>(Trang bìa - Bỏ qua)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

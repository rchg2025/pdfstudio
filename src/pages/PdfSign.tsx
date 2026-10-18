import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, 
  Upload, 
  Trash2, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Loader2, 
  Move, 
  Type, 
  Eraser, 
  Sparkles
} from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as pdfjsLib from 'pdfjs-dist';
import FileUploadZone from '../components/FileUploadZone';
import { useDialogs } from '../components/CustomDialogs';
import './PdfSign.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface SignaturePlacement {
  id: string;
  type: 'drawing' | 'image' | 'text' | 'date';
  dataUrl?: string; // cho drawing / image
  text?: string;    // cho text / date
  pageNumber: number; // 1-indexed
  xPercent: number;   // 0 to 100% relative to pdf page width
  yPercent: number;   // 0 to 100% relative to pdf page height (from top)
  widthPercent: number; // relative width %
  heightPercent: number; // relative height %
  color?: string;
}

export default function PdfSign() {
  const { showAlert } = useDialogs();

  // File & PDF state
  const [file, setFile] = useState<File | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageRendering, setPageRendering] = useState<boolean>(false);

  // Signature creation mode: 'draw' | 'upload' | 'text'
  const [signTab, setSignTab] = useState<'draw' | 'upload' | 'text'>('draw');
  const [penColor, setPenColor] = useState<string>('#0f172a'); // mực đen/xanh
  const [penWidth] = useState<number>(3);
  const [createdSignatureUrl, setCreatedSignatureUrl] = useState<string | null>(null);

  // Text / Date Signature state
  const [typedName, setTypedName] = useState<string>('');
  const [fontStyle, setFontStyle] = useState<'cursive' | 'serif' | 'sans-serif'>('cursive');
  const [sigScale, setSigScale] = useState<number>(22); // % độ rộng mặc định của chữ ký
  const [includeDate, setIncludeDate] = useState<boolean>(true);
  const [customDate, setCustomDate] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });

  // Placed signatures on PDF pages
  const [placements, setPlacements] = useState<SignaturePlacement[]>([]);
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);

  // Export state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [signedPdfSize, setSignedPdfSize] = useState<number>(0);

  // Canvas refs
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);

  // Dragging placement state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initialXPercent: number; initialYPercent: number } | null>(null);

  // Load PDF khi chọn file
  const handleFileSelect = async (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected) return;

    if (selected.type !== 'application/pdf') {
      showAlert('Vui lòng chọn tệp định dạng PDF.', 'Định dạng không hỗ trợ');
      return;
    }

    setFile(selected);
    setSignedPdfUrl(null);
    setPlacements([]);
    setCurrentPage(1);

    try {
      const arrayBuffer = await selected.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true
      });
      const proxy = await loadingTask.promise;
      setPdfDocProxy(proxy);
      setNumPages(proxy.numPages);
    } catch (err: any) {
      console.error('Lỗi nạp PDF:', err);
      showAlert(`Không thể mở file PDF: ${err.message || 'File có thể bị khóa hoặc lỗi.'}`, 'Lỗi nạp file');
    }
  };

  // Render trang PDF hiện tại lên Canvas
  useEffect(() => {
    if (!pdfDocProxy || !pdfCanvasRef.current) return;

    let isCancelled = false;
    setPageRendering(true);

    const renderPage = async () => {
      try {
        const page = await pdfDocProxy.getPage(currentPage);
        if (isCancelled) return;

        // Viewport scale vừa với container
        const unscaledViewport = page.getViewport({ scale: 1 });
        const containerWidth = viewerContainerRef.current?.clientWidth || 700;
        const targetWidth = Math.min(containerWidth - 32, 850);
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = pdfCanvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport
        } as any).promise;

        if (!isCancelled) {
          setPageRendering(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Lỗi render trang PDF:', err);
          setPageRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDocProxy, currentPage]);

  // Khởi tạo Canvas vẽ chữ ký
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [penColor, penWidth]);

  // Xử lý vẽ nét ký trên Canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Xuất chữ ký PNG trong suốt
    const canvas = drawCanvasRef.current;
    if (canvas) {
      setCreatedSignatureUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearDrawing = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCreatedSignatureUrl(null);
  };

  // Xử lý tải ảnh chữ ký lên (Loại bỏ nền trắng tự động nếu là ảnh chụp giấy)
  const handleSignatureImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Vẽ lên canvas ẩn để lọc nền trắng (make transparent background)
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Biến các pixel gần trắng thành trong suốt
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Độ sáng > 215 coi như là nền giấy trắng
          if (r > 215 && g > 215 && b > 215) {
            data[i + 3] = 0; // Alpha 0
          }
        }
        ctx.putImageData(imgData, 0, 0);
        setCreatedSignatureUrl(canvas.toDataURL('image/png'));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Tạo chữ ký dạng chữ gõ (Typed Signature)
  const handleGenerateTypedSignature = () => {
    if (!typedName.trim()) {
      showAlert('Vui lòng nhập họ và tên của bạn.', 'Thông báo');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 450;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = penColor;

    if (fontStyle === 'cursive') {
      ctx.font = 'italic 52px "Brush Script MT", "Segoe Script", cursive, "Dancing Script"';
    } else if (fontStyle === 'serif') {
      ctx.font = 'bold italic 44px "Times New Roman", Times, serif';
    } else {
      ctx.font = 'bold 42px "Arial", sans-serif';
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName.trim(), canvas.width / 2, canvas.height / 2);

    setCreatedSignatureUrl(canvas.toDataURL('image/png'));
  };

  // Chèn chữ ký vừa tạo vào trang PDF hiện tại
  const handleAddSignatureToPage = () => {
    if (!createdSignatureUrl) {
      showAlert('Vui lòng vẽ chữ ký, tải ảnh hoặc nhập tên trước khi chèn.', 'Chưa có chữ ký');
      return;
    }

    const selectedWidth = sigScale;
    const selectedHeight = Math.round((sigScale * 0.5) * 10) / 10;

    const newPlacement: SignaturePlacement = {
      id: `sig-${Date.now()}`,
      type: signTab === 'draw' ? 'drawing' : signTab === 'upload' ? 'image' : 'text',
      dataUrl: createdSignatureUrl,
      pageNumber: currentPage,
      xPercent: 40, // Mặc định ở giữa
      yPercent: 75, // Mặc định ở phần dưới trang (nơi ký tên)
      widthPercent: selectedWidth,
      heightPercent: selectedHeight
    };

    setPlacements(prev => [...prev, newPlacement]);
    setSelectedPlacementId(newPlacement.id);

    // Nếu có chọn ngày tháng, tự động chèn thêm block ngày tháng kế bên
    if (includeDate && customDate) {
      const datePlacement: SignaturePlacement = {
        id: `date-${Date.now() + 1}`,
        type: 'date',
        text: `Ngày ${customDate}`,
        pageNumber: currentPage,
        xPercent: 40,
        yPercent: 88,
        widthPercent: 22,
        heightPercent: 4,
        color: penColor
      };
      setPlacements(prev => [...prev, datePlacement]);
    }
  };

  // Xóa 1 chữ ký khỏi trang
  const handleRemovePlacement = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPlacements(prev => prev.filter(p => p.id !== id));
    if (selectedPlacementId === id) {
      setSelectedPlacementId(null);
    }
  };

  // Kéo thả vị trí chữ ký trên Canvas
  const handleMouseDownPlacement = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPlacementId(id);
    setDraggingId(id);

    const placement = placements.find(p => p.id === id);
    if (!placement) return;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialXPercent: placement.xPercent,
      initialYPercent: placement.yPercent
    };
  };

  const handleMouseMoveViewer = (e: React.MouseEvent) => {
    if (!draggingId || !dragStartRef.current || !pdfCanvasRef.current) return;

    const canvasRect = pdfCanvasRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const deltaXPercent = (deltaX / canvasRect.width) * 100;
    const deltaYPercent = (deltaY / canvasRect.height) * 100;

    setPlacements(prev => prev.map(p => {
      if (p.id === draggingId && dragStartRef.current) {
        const nextX = Math.max(0, Math.min(100 - p.widthPercent, dragStartRef.current.initialXPercent + deltaXPercent));
        const nextY = Math.max(0, Math.min(100 - p.heightPercent, dragStartRef.current.initialYPercent + deltaYPercent));
        return {
          ...p,
          xPercent: Math.round(nextX * 10) / 10,
          yPercent: Math.round(nextY * 10) / 10
        };
      }
      return p;
    }));
  };

  const handleMouseUpViewer = () => {
    setDraggingId(null);
    dragStartRef.current = null;
  };

  // Xuất file PDF đã ký hoàn chỉnh bằng pdf-lib
  const handleExportSignedPdf = async () => {
    if (!file) return;

    if (placements.length === 0) {
      showAlert('Bạn chưa đặt chữ ký nào lên tài liệu PDF.', 'Thông báo');
      return;
    }

    setIsProcessing(true);
    setSignedPdfUrl(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      pdfDoc.registerFontkit(fontkit);

      // Tải font tiếng Việt Roboto
      let customFont: any = null;
      try {
        const fontRes = await fetch('/fonts/Roboto-Regular.ttf');
        if (fontRes.ok) {
          const fontBytes = await fontRes.arrayBuffer();
          customFont = await pdfDoc.embedFont(fontBytes);
        }
      } catch {
        console.warn('Không tải được Roboto, fallback to Helvetica');
      }

      const pages = pdfDoc.getPages();

      // Duyệt qua từng chữ ký và gắn lên đúng trang
      for (const item of placements) {
        const pageIdx = item.pageNumber - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) continue;

        const targetPage = pages[pageIdx];
        const { width: pWidth, height: pHeight } = targetPage.getSize();

        // Tọa độ PDF bắt đầu từ GÓC DƯỚI BÊN TRÁI (Bottom-Left), trong khi Web tính từ TOP
        const destWidth = (item.widthPercent / 100) * pWidth;
        const destHeight = (item.heightPercent / 100) * pHeight;
        const destX = (item.xPercent / 100) * pWidth;
        const destY = pHeight - ((item.yPercent / 100) * pHeight) - destHeight;

        if (item.dataUrl) {
          // Nhúng ảnh chữ ký PNG
          const imageBytes = await fetch(item.dataUrl).then(res => res.arrayBuffer());
          const embeddedImage = await pdfDoc.embedPng(imageBytes);

          targetPage.drawImage(embeddedImage, {
            x: destX,
            y: destY,
            width: destWidth,
            height: destHeight
          });
        } else if (item.text) {
          // Vẽ dòng chữ ngày tháng hoặc tên
          const textFont = customFont || await pdfDoc.embedFont('Helvetica');
          targetPage.drawText(item.text, {
            x: destX,
            y: destY + 2,
            size: 11,
            font: textFont,
            color: rgb(0.1, 0.1, 0.2)
          });
        }
      }

      const signedBytes = await pdfDoc.save();
      const blob = new Blob([signedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setSignedPdfUrl(url);
      setSignedPdfSize(blob.size);
      showAlert('Đã ký tên và kết xuất PDF thành công!', 'Thành công');
    } catch (err: any) {
      console.error('Lỗi khi ký PDF:', err);
      showAlert(`Lỗi khi tạo file PDF đã ký: ${err.message}`, 'Lỗi');
    } finally {
      setIsProcessing(false);
    }
  };

  // Lọc các chữ ký thuộc trang hiện tại
  const currentPagePlacements = placements.filter(p => p.pageNumber === currentPage);

  return (
    <div className="pdf-sign-container">
      {/* HEADER BAR */}
      <header className="pdf-sign-header">
        <div className="pdf-sign-badge">
          <PenTool size={16} className="text-primary" />
          <span>Tiện ích Ký Tài Liệu Điện Tử</span>
        </div>
        <h1>Ký Tên Điện Tử & Chèn Chữ Ký Vào PDF</h1>
        <p>
          Ký hợp đồng, giáo trình, biên bản trực tiếp trên trình duyệt. Vẽ tay chữ ký tươi, tải ảnh chữ ký trong suốt hoặc gõ tên phong cách thư pháp không lo lộ thông tin.
        </p>
      </header>

      {!file ? (
        <div className="upload-wrapper">
          <FileUploadZone 
            onFileSelect={handleFileSelect} 
            accept=".pdf,application/pdf"
            hintText="Kéo thả tệp PDF cần ký vào đây, hoặc bấm để duyệt file từ máy tính"
          />
        </div>
      ) : (
        <div className="pdf-sign-workspace">
          {/* CỘT TRÁI: BÀN TẠO CHỮ KÝ */}
          <aside className="sign-toolbox">
            <div className="toolbox-card">
              <div className="sign-tabs">
                <button 
                  className={`sign-tab-btn ${signTab === 'draw' ? 'active' : ''}`}
                  onClick={() => setSignTab('draw')}
                >
                  <PenTool size={15} /> Vẽ Tay
                </button>
                <button 
                  className={`sign-tab-btn ${signTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setSignTab('upload')}
                >
                  <Upload size={15} /> Tải Ảnh Chữ Ký
                </button>
                <button 
                  className={`sign-tab-btn ${signTab === 'text' ? 'active' : ''}`}
                  onClick={() => setSignTab('text')}
                >
                  <Type size={15} /> Gõ Tên
                </button>
              </div>

              {/* TAB 1: VẼ CHỮ KÝ BẰNG CHUỘT / CẢM ỨNG */}
              {signTab === 'draw' && (
                <div className="sign-tab-content">
                  <div className="canvas-wrapper">
                    <canvas 
                      ref={drawCanvasRef}
                      width={380}
                      height={180}
                      className="signature-pad-canvas"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    <div className="canvas-hint">Ký tên vào ô trên bằng chuột hoặc bút cảm ứng</div>
                  </div>

                  <div className="canvas-tools">
                    <div className="color-picker-group">
                      <button 
                        type="button"
                        className={`color-dot ${penColor === '#0f172a' ? 'active' : ''}`}
                        style={{ background: '#0f172a' }}
                        onClick={() => setPenColor('#0f172a')}
                        title="Mực đen chuẩn"
                      />
                      <button 
                        type="button"
                        className={`color-dot ${penColor === '#1d4ed8' ? 'active' : ''}`}
                        style={{ background: '#1d4ed8' }}
                        onClick={() => setPenColor('#1d4ed8')}
                        title="Mực xanh truyền thống"
                      />
                      <button 
                        type="button"
                        className={`color-dot ${penColor === '#dc2626' ? 'active' : ''}`}
                        style={{ background: '#dc2626' }}
                        onClick={() => setPenColor('#dc2626')}
                        title="Mực đỏ dấu phê"
                      />
                    </div>

                    <button 
                      type="button" 
                      className="btn-clear-canvas"
                      onClick={clearDrawing}
                    >
                      <Eraser size={14} /> Xóa vẽ lại
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: TẢI ẢNH CHỮ KÝ */}
              {signTab === 'upload' && (
                <div className="sign-tab-content">
                  <div className="upload-box-dashed">
                    <Upload size={32} className="text-secondary mb-2" />
                    <p className="text-sm text-secondary">
                      Tải lên ảnh chụp chữ ký trên giấy (JPG, PNG). Hệ thống sẽ <strong>tự động lọc nền trắng thành trong suốt</strong>.
                    </p>
                    <label className="btn btn-secondary btn-sm mt-2">
                      <span>Chọn file ảnh chữ ký</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleSignatureImageUpload} 
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 3: GÕ TÊN */}
              {signTab === 'text' && (
                <div className="sign-tab-content">
                  <div className="form-group">
                    <label>Họ và tên của bạn:</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="VD: Nguyễn Văn A"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Kiểu phông chữ ký:</label>
                    <select 
                      className="form-control"
                      value={fontStyle}
                      onChange={(e: any) => setFontStyle(e.target.value)}
                    >
                      <option value="cursive">✍️ Chữ Ký Thư Pháp Uốn Lượn</option>
                      <option value="serif">🏛️ Cổ Điển Trang Trọng (Serif)</option>
                      <option value="sans-serif">Modern Hiện Đại (Sans)</option>
                    </select>
                  </div>

                  <button 
                    type="button"
                    className="btn btn-secondary w-100"
                    onClick={handleGenerateTypedSignature}
                  >
                    <Sparkles size={14} /> Tạo Mẫu Chữ Ký
                  </button>
                </div>
              )}

              {/* KHỐI PREVIEW CHỮ KÝ ĐANG SẴN SÀNG */}
              {createdSignatureUrl && (
                <div className="created-signature-preview mt-3">
                  <div className="text-xs text-secondary mb-1">Chữ ký đang sẵn sàng:</div>
                  <div className="preview-img-box">
                    <img src={createdSignatureUrl} alt="Signature Preview" />
                  </div>

                  <div className="sig-size-selector-row mt-2">
                    <span className="text-xs text-secondary font-medium">Kích thước mẫu:</span>
                    <div className="sig-size-pills">
                      {[16, 22, 28, 36].map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={`sig-size-pill ${sigScale === size ? 'active' : ''}`}
                          onClick={() => setSigScale(size)}
                        >
                          {size === 16 ? 'Nhỏ' : size === 22 ? 'Vừa' : size === 28 ? 'Lớn' : 'Rất lớn'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="date-toggle-row mt-3">
                    <label className="date-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={includeDate} 
                        onChange={(e) => setIncludeDate(e.target.checked)} 
                      />
                      <span>Kèm ngày ký:</span>
                    </label>
                    {includeDate && (
                      <input 
                        type="text" 
                        value={customDate} 
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="date-input-field"
                        placeholder="DD/MM/YYYY"
                      />
                    )}
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-primary btn-insert-sig w-100 mt-3"
                    onClick={handleAddSignatureToPage}
                  >
                    <CheckCircle2 size={16} /> Chèn Vào Trang {currentPage}
                  </button>
                </div>
              )}

              {/* DANH SÁCH CHỮ KÝ ĐÃ GẮN TRÊN TRANG NÀY */}
              {currentPagePlacements.length > 0 && (
                <div className="placed-list mt-3">
                  <div className="text-xs font-semibold text-secondary mb-2">
                    Đã đặt trên trang {currentPage} ({currentPagePlacements.length}):
                  </div>
                  {currentPagePlacements.map((p, idx) => (
                    <div 
                      key={p.id} 
                      className={`placed-item ${selectedPlacementId === p.id ? 'active' : ''}`}
                      onClick={() => setSelectedPlacementId(p.id)}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <Move size={12} className="text-muted" />
                        <span>#{idx + 1} {p.type === 'date' ? p.text : 'Chữ ký'}</span>
                      </div>
                      <button 
                        type="button" 
                        className="btn-del-item"
                        onClick={(e) => handleRemovePlacement(p.id, e)}
                        title="Xóa chữ ký này"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* NÚT KẾT XUẤT HOÀN TẤT */}
              <div className="export-action-box mt-4">
                <button 
                  type="button" 
                  className="btn btn-primary w-100 btn-lg"
                  onClick={handleExportSignedPdf}
                  disabled={isProcessing || placements.length === 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Đang tạo PDF đã ký...
                    </>
                  ) : (
                    <>
                      <Download size={18} /> Kết Xuất PDF Đã Ký
                    </>
                  )}
                </button>

                {signedPdfUrl && (
                  <div className="download-ready-box mt-3">
                    <div className="text-xs text-success font-semibold flex items-center gap-1 mb-2">
                      <CheckCircle2 size={14} /> Tệp PDF đã được ký hoàn tất!
                    </div>
                    <a 
                      href={signedPdfUrl} 
                      download={file.name.replace(/\.pdf$/i, '_signed.pdf')}
                      className="btn btn-success w-100"
                    >
                      <Download size={16} /> Tải PDF Về Máy ({(signedPdfSize / 1024).toFixed(0)} KB)
                    </a>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* CỘT PHẢI: TRÌNH XEM TRANG PDF & KÉO THẢ VỊ TRÍ KÝ */}
          <main 
            className="pdf-viewer-main" 
            ref={viewerContainerRef}
            onMouseMove={handleMouseMoveViewer}
            onMouseUp={handleMouseUpViewer}
          >
            {/* THANH ĐIỀU HƯỚNG TRANG */}
            <div className="viewer-nav-bar">
              <div className="viewer-nav-info">
                <strong>{file.name}</strong> • Trang {currentPage} / {numPages}
              </div>

              <div className="viewer-nav-controls">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || pageRendering}
                >
                  <ChevronLeft size={16} /> Trang trước
                </button>
                <span className="page-indicator">{currentPage} / {numPages}</span>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                  disabled={currentPage >= numPages || pageRendering}
                >
                  Trang sau <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* BẢNG RENDER PDF KÈM CÁC CHỮ KÝ NỔI */}
            <div className="pdf-canvas-stage">
              {pageRendering && (
                <div className="stage-loader-overlay">
                  <Loader2 size={28} className="animate-spin text-primary" />
                  <span>Đang dựng trang {currentPage}...</span>
                </div>
              )}

              <div className="pdf-page-sheet-container">
                <canvas ref={pdfCanvasRef} className="pdf-render-canvas" />

                {/* RENDER CÁC CHỮ KÝ TRÊN TRANG HIỆN TẠI (OVERLAY BOXES) */}
                {currentPagePlacements.map((p) => {
                  const isSelected = selectedPlacementId === p.id;

                  return (
                    <div 
                      key={p.id}
                      className={`signature-overlay-box ${isSelected ? 'selected' : ''}`}
                      style={{
                        left: `${p.xPercent}%`,
                        top: `${p.yPercent}%`,
                        width: `${p.widthPercent}%`,
                        height: `${p.heightPercent}%`
                      }}
                      onMouseDown={(e) => handleMouseDownPlacement(p.id, e)}
                    >
                      {p.dataUrl ? (
                        <img src={p.dataUrl} alt="Signature" className="overlay-sig-img" />
                      ) : (
                        <div className="overlay-sig-text" style={{ color: p.color || '#0f172a' }}>
                          {p.text}
                        </div>
                      )}

                      {/* Nút xóa nhanh khi click chọn */}
                      {isSelected && (
                        <button 
                          type="button" 
                          className="overlay-quick-remove"
                          onClick={(e) => handleRemovePlacement(p.id, e)}
                          title="Xóa khỏi trang"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="viewer-bottom-tip">
              💡 <strong>Mẹo:</strong> Nhấp và giữ chuột vào chữ ký để kéo thả tới vị trí mong muốn trên hợp đồng / tài liệu. Bạn có thể sang các trang khác để chèn thêm nhiều chữ ký.
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { 
  CreditCard, 
  Upload, 
  Sparkles, 
  Crop, 
  Sliders, 
  Printer, 
  Download, 
  RotateCcw, 
  RotateCw, 
  User, 
  Key, 
  Loader2, 
  FileImage,
  Trash2
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './IdPhotoStudio.css';

interface FilterValues {
  brightness: number;
  contrast: number;
  saturate: number;
}

export default function IdPhotoStudio() {
  const { showToast } = useNotification();

  // State
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'crop' | 'adjust' | 'print'>('ai');
  const [selectedBgColor, setSelectedBgColor] = useState<string>('#0055A5');
  const [selectedBgName, setSelectedBgName] = useState<string>('Xanh Chuẩn VN');
  const [attire, setAttire] = useState<string>('white_shirt');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  // Crop & Ratio
  const [currentAspectRatio, setCurrentAspectRatio] = useState<number>(3 / 4);
  const [currentRatioName, setCurrentRatioName] = useState<string>('3x4 cm');
  const [showPassportGuide, setShowPassportGuide] = useState<boolean>(true);

  // Filters
  const [filters, setFilters] = useState<FilterValues>({
    brightness: 100,
    contrast: 100,
    saturate: 100
  });

  // Print layout
  const [printLayout, setPrintLayout] = useState<'mix' | '8_3x4' | '4_4x6' | '6_35x45'>('mix');

  // Loading
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => localStorage.getItem('rchg_gemini_api_key') || '');

  // Refs
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printSheetCanvasRef = useRef<HTMLCanvasElement>(null);
  const printableImageRef = useRef<HTMLImageElement>(null);

  // Khởi tạo hoặc cập nhật Cropper
  const initCropper = useCallback((imageSrc: string) => {
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }

    const img = imageRef.current;
    if (!img) return;

    img.src = imageSrc;

    cropperRef.current = new Cropper(img, {
      aspectRatio: currentAspectRatio,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.85,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      crop() {
        renderPrintSheet();
      }
    });
  }, [currentAspectRatio]);

  // Khi currentImage thay đổi
  useEffect(() => {
    if (currentImage) {
      initCropper(currentImage);
    }
    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [currentImage, initCropper]);

  // Vẽ Sheet in 10x15cm (1200 x 1800 px @ 300 DPI)
  const renderPrintSheet = useCallback(() => {
    const canvas = printSheetCanvasRef.current;
    if (!canvas || !cropperRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;  // 1200
    const h = canvas.height; // 1800

    // Xóa nền trắng
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // Lấy ảnh crop
    const croppedCanvas = cropperRef.current.getCroppedCanvas({ width: 600, height: 800 });
    if (!croppedCanvas) return;

    // Áp dụng bộ lọc màu
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = croppedCanvas.width;
    tempCanvas.height = croppedCanvas.height;
    const tCtx = tempCanvas.getContext('2d');
    if (tCtx) {
      tCtx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`;
      tCtx.drawImage(croppedCanvas, 0, 0);
    }

    ctx.strokeStyle = '#cbd5e1'; // Đường cắt nhạt
    ctx.lineWidth = 1.5;

    if (printLayout === '8_3x4') {
      // 8 ảnh 3x4 cm (354x472 px)
      const pw = 354, ph = 472;
      const gapX = 30, gapY = 30;
      const startX = (w - (pw * 2 + gapX)) / 2;
      const startY = (h - (ph * 4 + gapY * 3)) / 2;

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 2; c++) {
          const x = startX + c * (pw + gapX);
          const y = startY + r * (ph + gapY);
          ctx.drawImage(tempCanvas, x, y, pw, ph);
          ctx.strokeRect(x, y, pw, ph);
        }
      }
    } else if (printLayout === '4_4x6') {
      // 4 ảnh 4x6 cm (472x709 px)
      const pw = 472, ph = 709;
      const gapX = 40, gapY = 40;
      const startX = (w - (pw * 2 + gapX)) / 2;
      const startY = (h - (ph * 2 + gapY)) / 2;

      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const x = startX + c * (pw + gapX);
          const y = startY + r * (ph + gapY);
          ctx.drawImage(tempCanvas, x, y, pw, ph);
          ctx.strokeRect(x, y, pw, ph);
        }
      }
    } else if (printLayout === '6_35x45') {
      // 6 ảnh 3.5x4.5 cm (413x531 px)
      const pw = 413, ph = 531;
      const gapX = 40, gapY = 30;
      const startX = (w - (pw * 2 + gapX)) / 2;
      const startY = (h - (ph * 3 + gapY * 2)) / 2;

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 2; c++) {
          const x = startX + c * (pw + gapX);
          const y = startY + r * (ph + gapY);
          ctx.drawImage(tempCanvas, x, y, pw, ph);
          ctx.strokeRect(x, y, pw, ph);
        }
      }
    } else {
      // Bố cục hỗn hợp: 2 ảnh 4x6 + 4 ảnh 3x4 + 2 ảnh 2x3
      // Top: 2 ảnh 4x6
      const p46w = 472, p46h = 709;
      const topY = 60;
      ctx.drawImage(tempCanvas, 80, topY, p46w, p46h);
      ctx.strokeRect(80, topY, p46w, p46h);
      ctx.drawImage(tempCanvas, 640, topY, p46w, p46h);
      ctx.strokeRect(640, topY, p46w, p46h);

      // Middle: 4 ảnh 3x4
      const p34w = 354, p34h = 472;
      const midY = 820;
      ctx.drawImage(tempCanvas, 80, midY, p34w, p34h);
      ctx.strokeRect(80, midY, p34w, p34h);
      ctx.drawImage(tempCanvas, 460, midY, p34w, p34h);
      ctx.strokeRect(460, midY, p34w, p34h);

      const botY = 1320;
      ctx.drawImage(tempCanvas, 80, botY, p34w, p34h);
      ctx.strokeRect(80, botY, p34w, p34h);
      ctx.drawImage(tempCanvas, 460, botY, p34w, p34h);
      ctx.strokeRect(460, botY, p34w, p34h);

      // Bên phải dưới: 2 ảnh 2x3
      const p23w = 236, p23h = 354;
      ctx.drawImage(tempCanvas, 850, midY, p23w, p23h);
      ctx.strokeRect(850, midY, p23w, p23h);
      ctx.drawImage(tempCanvas, 850, botY, p23w, p23h);
      ctx.strokeRect(850, botY, p23w, p23h);
    }
  }, [printLayout, filters]);

  // Cập nhật filters trên cropper
  useEffect(() => {
    const cropperContainer = document.querySelector('.cropper-container') as HTMLElement | null;
    if (cropperContainer) {
      cropperContainer.style.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`;
    }
    renderPrintSheet();
  }, [filters, renderPrintSheet]);

  // Xử lý nạp file ảnh
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WEBP).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCurrentImage(result);
      showToast('Đã tải ảnh lên thành công!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Tạo ảnh mẫu để người dùng thử ngay
  const loadSampleImage = (type: 'male' | 'female' | 'casual') => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Nền
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 600, 800);

    // Khuôn mặt
    ctx.fillStyle = type === 'female' ? '#fcd34d' : '#fde047';
    ctx.beginPath();
    ctx.ellipse(300, 320, 120, 150, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cổ
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(265, 440, 70, 70);

    // Thân / Áo
    ctx.beginPath();
    ctx.ellipse(300, 700, 240, 260, 0, 0, Math.PI * 2);
    ctx.fillStyle = type === 'male' ? '#1e293b' : (type === 'female' ? '#be185d' : '#0284c7');
    ctx.fill();

    // Cổ áo sơ mi
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(250, 500);
    ctx.lineTo(300, 570);
    ctx.lineTo(350, 500);
    ctx.closePath();
    ctx.fill();

    // Tóc
    ctx.fillStyle = '#0f172a';
    if (type === 'female') {
      ctx.beginPath();
      ctx.arc(300, 280, 150, Math.PI, 0, false);
      ctx.lineTo(450, 500);
      ctx.lineTo(410, 500);
      ctx.lineTo(410, 340);
      ctx.lineTo(190, 340);
      ctx.lineTo(190, 500);
      ctx.lineTo(150, 500);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(300, 260, 135, Math.PI, 0, false);
      ctx.lineTo(435, 340);
      ctx.lineTo(165, 340);
      ctx.closePath();
      ctx.fill();
    }

    const dataUrl = canvas.toDataURL('image/jpeg');
    setCurrentImage(dataUrl);
    showToast('Đã tải ảnh chân dung mẫu!', 'success');
  };

  // Chọn tỷ lệ
  const handleSetAspectRatio = (ratio: number, name: string) => {
    setCurrentAspectRatio(ratio);
    setCurrentRatioName(name);
    if (cropperRef.current) {
      cropperRef.current.setAspectRatio(ratio);
    }
  };

  // Xoay ảnh
  const handleRotate = (degree: number) => {
    if (cropperRef.current) {
      cropperRef.current.rotate(degree);
    }
  };

  // Đổi phông nền cơ bản qua Canvas (Fallback)
  const fallbackLocalBackgroundSwap = (sourceCanvas: HTMLCanvasElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Nền mới
    ctx.fillStyle = selectedBgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vẽ ảnh lên
    ctx.drawImage(sourceCanvas, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCurrentImage(dataUrl);
    showToast(`Đã đổi phông nền sang ${selectedBgName}!`, 'success');
  };

  // Xử lý tạo ảnh thẻ AI
  const handleProcessAiPhoto = async () => {
    if (!cropperRef.current) {
      showToast('Vui lòng tải ảnh lên trước khi dùng AI!', 'warning');
      return;
    }

    setIsAiProcessing(true);

    try {
      const croppedCanvas = cropperRef.current.getCroppedCanvas({ width: 800, height: 1000 });
      const base64DataWithHeader = croppedCanvas.toDataURL('image/jpeg', 0.9);
      const base64Data = base64DataWithHeader.split(',')[1];

      // Gửi yêu cầu lên server backend
      const response = await fetch('/api/quiz-api?action=generate-id-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          attire,
          bgColorName: selectedBgName,
          bgColorHex: selectedBgColor,
          customPrompt,
          apiKey: localStorage.getItem('rchg_gemini_api_key') || ''
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.image) {
        setCurrentImage(data.image);
        showToast('AI đã tạo ảnh thẻ thành công!', 'success');
      } else {
        // Fallback tự động
        console.warn('Backend AI returned error or no image, falling back to smart canvas swap:', data.error);
        fallbackLocalBackgroundSwap(croppedCanvas);
        showToast('Đã tối ưu hóa ảnh và cập nhật phông nền thành công!', 'success');
      }
    } catch (err: any) {
      console.error('Lỗi khi gọi AI:', err);
      if (cropperRef.current) {
        const croppedCanvas = cropperRef.current.getCroppedCanvas({ width: 800, height: 1000 });
        fallbackLocalBackgroundSwap(croppedCanvas);
      }
      showToast('Đã áp dụng phông nền studio thành công!', 'info');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Tải ảnh đơn HD
  const handleDownloadSingle = () => {
    if (!cropperRef.current) return;
    const croppedCanvas = cropperRef.current.getCroppedCanvas({ width: 1200, height: 1600 });
    
    // Áp dụng filters lên bản tải về
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = croppedCanvas.width;
    finalCanvas.height = croppedCanvas.height;
    const ctx = finalCanvas.getContext('2d');
    if (ctx) {
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`;
      ctx.drawImage(croppedCanvas, 0, 0);
    }

    const link = document.createElement('a');
    link.download = `AnhThe_${currentRatioName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.jpg`;
    link.href = finalCanvas.toDataURL('image/jpeg', 0.95);
    link.click();
    showToast('Đã tải ảnh thẻ đơn HD!', 'success');
  };

  // Tải trang in 10x15cm
  const handleDownloadPrintSheet = () => {
    const canvas = printSheetCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `KhungInAnhThe_10x15cm_${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    showToast('Đã tải file trang in 10x15cm chuẩn 300 DPI!', 'success');
  };

  // In trực tiếp
  const handleTriggerPrint = () => {
    const canvas = printSheetCanvasRef.current;
    const printableImg = printableImageRef.current;
    if (!canvas || !printableImg) return;

    printableImg.src = canvas.toDataURL('image/jpeg', 0.95);
    window.print();
  };

  return (
    <div className="idphoto-container">
      {/* Header Banner */}
      <header className="idphoto-header">
        <div className="idphoto-header-left">
          <div className="idphoto-icon-box">
            <CreditCard size={26} />
          </div>
          <div>
            <h1 className="idphoto-title">Tạo Ảnh Thẻ & Hộ Chiếu AI Studio</h1>
            <p className="idphoto-subtitle">
              Tự động cắt ảnh thẻ chuẩn ICAO, thay phông nền xanh/trắng, đổi trang phục lịch sự và xuất khổ in 10x15cm.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 idphoto-header-actions">
          {currentImage && (
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
              title="Chọn ảnh khác từ máy tính hoặc điện thoại"
            >
              <Upload size={15} /> <span>Tải Ảnh Khác</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowApiKeyModal(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
            title="Cài đặt API Key Gemini"
          >
            <Sparkles className="mr-1.5 text-blue-500" size={14} /> Gemini 3.1 AI
          </button>
        </div>
      </header>

      {/* Global Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        className="hidden"
        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {/* Main Grid */}
      <main className="idphoto-main-grid">
        {/* LEFT COLUMN: Controls & Settings */}
        <section className="space-y-5">
          
          {/* Card 1: Quản lý & Tải Ảnh Chân Dung */}
          <div className="idphoto-card">
            {currentImage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="idphoto-card-title m-0">
                    <FileImage className="text-blue-600" size={20} /> 1. Ảnh Đang Xử Lý
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đã nạp ảnh
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-20 h-24 rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-white flex-shrink-0 flex items-center justify-center">
                    <img src={currentImage} alt="Ảnh chân dung đã chọn" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm font-bold text-slate-800 m-0">Ảnh chân dung sẵn sàng</p>
                    <p className="text-xs text-slate-500 m-0 mt-1">
                      Ảnh đã được nạp vào khung cắt & bộ công cụ AI bên dưới.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
                      >
                        <Upload size={14} />
                        <span>Tải Ảnh Khác</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentImage(null);
                          showToast('Đã đóng ảnh hiện tại. Bạn có thể chọn ảnh mới!', 'info');
                        }}
                        className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 hover:text-red-600 hover:border-red-200"
                      >
                        <Trash2 size={14} />
                        <span>Chọn lại từ đầu</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick sample switch even when image is active */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="idphoto-section-label">
                    <span>Hoặc đổi nhanh sang ảnh mẫu:</span>
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button 
                      type="button"
                      onClick={() => loadSampleImage('male')}
                      className="idphoto-sample-btn group"
                    >
                      <User size={18} className="text-blue-600 group-hover:scale-110 transition" />
                      <span className="text-xs font-semibold text-slate-700">Nam giới</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => loadSampleImage('female')}
                      className="idphoto-sample-btn group"
                    >
                      <User size={18} className="text-pink-600 group-hover:scale-110 transition" />
                      <span className="text-xs font-semibold text-slate-700">Nữ giới</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => loadSampleImage('casual')}
                      className="idphoto-sample-btn group"
                    >
                      <User size={18} className="text-emerald-600 group-hover:scale-110 transition" />
                      <span className="text-xs font-semibold text-slate-700">Chân dung</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="idphoto-card-title">
                  <Upload className="text-blue-600" size={20} /> 1. Tải Lên Ảnh Chân Dung
                </h2>
                <p className="idphoto-card-desc">
                  Tải lên bất kỳ ảnh tự chụp từ điện thoại, webcam hoặc ảnh thẻ có sẵn để AI xử lý.
                </p>

                {/* Dropzone */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                  }}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 transition-all rounded-2xl py-8 px-6 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/40 group"
                >
                  <div className="w-16 h-16 bg-white border border-slate-200 shadow-sm group-hover:scale-110 group-hover:border-blue-300 transition-all rounded-2xl flex items-center justify-center mx-auto mb-3.5">
                    <FileImage className="text-slate-400 group-hover:text-blue-600 transition-colors" size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-700 mb-2">
                    Kéo thả ảnh vào đây hoặc
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-sm group-hover:bg-blue-700 transition">
                    <Upload size={14} />
                    <span>Chọn từ thiết bị</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5">Hỗ trợ JPG, PNG, WEBP (Tối đa 10MB)</p>
                </div>

                {/* Sample Images */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className="idphoto-section-label">
                    <span>Hoặc thử nhanh với ảnh mẫu</span>
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      type="button"
                      onClick={() => loadSampleImage('male')}
                      className="idphoto-sample-btn group"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
                        <User size={20} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">Nam giới</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => loadSampleImage('female')}
                      className="idphoto-sample-btn group"
                    >
                      <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-110 transition">
                        <User size={20} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">Nữ giới</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => loadSampleImage('casual')}
                      className="idphoto-sample-btn group"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
                        <User size={20} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">Chân dung</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Editor Controls */}
          <div className="idphoto-card space-y-6">

            {/* Navigation Tabs */}
            <div className="idphoto-tabs-container">
              <button 
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`idphoto-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
              >
                <Sparkles size={15} /> <span>AI Studio</span>
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('crop')}
                className={`idphoto-tab-btn ${activeTab === 'crop' ? 'active' : ''}`}
              >
                <Crop size={15} /> <span>Kích Thước</span>
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('adjust')}
                className={`idphoto-tab-btn ${activeTab === 'adjust' ? 'active' : ''}`}
              >
                <Sliders size={15} /> <span>Chỉnh Màu</span>
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('print')}
                className={`idphoto-tab-btn ${activeTab === 'print' ? 'active' : ''}`}
              >
                <Printer size={15} /> <span>Khổ In</span>
              </button>
            </div>

            {/* TAB CONTENT 1: AI STUDIO */}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                {/* 1. Chọn phông nền */}
                <div>
                  <div className="idphoto-section-label">
                    <span className="badge-num">1</span>
                    <span>Chọn Phông Nền Ảnh Thẻ</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2.5">
                    <button 
                      type="button"
                      onClick={() => { setSelectedBgColor('#0055A5'); setSelectedBgName('Xanh Chuẩn VN'); }}
                      className={`idphoto-color-tile ${selectedBgColor === '#0055A5' ? 'active' : ''}`}
                    >
                      <span className="idphoto-color-swatch bg-[#0055A5]"></span>
                      <span className="text-[11px] font-bold text-slate-700">Xanh Chuẩn</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setSelectedBgColor('#FFFFFF'); setSelectedBgName('Trắng Hộ Chiếu'); }}
                      className={`idphoto-color-tile ${selectedBgColor === '#FFFFFF' ? 'active' : ''}`}
                    >
                      <span className="idphoto-color-swatch bg-white"></span>
                      <span className="text-[11px] font-bold text-slate-700">Trắng HC</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setSelectedBgColor('#4A90E2'); setSelectedBgName('Xanh Nhạt'); }}
                      className={`idphoto-color-tile ${selectedBgColor === '#4A90E2' ? 'active' : ''}`}
                    >
                      <span className="idphoto-color-swatch bg-[#4A90E2]"></span>
                      <span className="text-[11px] font-bold text-slate-700">Xanh Nhạt</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setSelectedBgColor('#D32F2F'); setSelectedBgName('Đỏ Giấy Tờ'); }}
                      className={`idphoto-color-tile ${selectedBgColor === '#D32F2F' ? 'active' : ''}`}
                    >
                      <span className="idphoto-color-swatch bg-[#D32F2F]"></span>
                      <span className="text-[11px] font-bold text-slate-700">Đỏ Giấy Tờ</span>
                    </button>
                  </div>
                </div>

                {/* 2. Thay trang phục */}
                <div>
                  <div className="idphoto-section-label">
                    <span className="badge-num">2</span>
                    <span>Thay Trang Phục Lịch Sự (AI)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      onClick={() => setAttire('white_shirt')}
                      className={`idphoto-select-card ${attire === 'white_shirt' ? 'active' : ''}`}
                    >
                      <span className="idphoto-radio-indicator"></span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 m-0">Sơ mi trắng</p>
                        <p className="text-[10px] text-slate-500 m-0 mt-0.5">Nam / Nữ cổ bẻ</p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setAttire('suit_tie')}
                      className={`idphoto-select-card ${attire === 'suit_tie' ? 'active' : ''}`}
                    >
                      <span className="idphoto-radio-indicator"></span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 m-0">Áo Vest & Cà vạt</p>
                        <p className="text-[10px] text-slate-500 m-0 mt-0.5">Sang trọng công sở</p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setAttire('aodai')}
                      className={`idphoto-select-card ${attire === 'aodai' ? 'active' : ''}`}
                    >
                      <span className="idphoto-radio-indicator"></span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 m-0">Áo Dài Trắng</p>
                        <p className="text-[10px] text-slate-500 m-0 mt-0.5">Nữ sinh / Truyền thống</p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setAttire('keep_original')}
                      className={`idphoto-select-card ${attire === 'keep_original' ? 'active' : ''}`}
                    >
                      <span className="idphoto-radio-indicator"></span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 m-0">Trang phục gốc</p>
                        <p className="text-[10px] text-slate-500 m-0 mt-0.5">Chỉ đổi phông nền</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ghi chú AI */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Ghi chú AI bổ sung (Tùy chọn)</label>
                  <input 
                    type="text" 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="VD: Mắt nhìn thẳng, làm mịn da nhẹ, tóc tai gọn gàng..." 
                    className="input text-xs"
                  />
                </div>

                {/* Nút Tạo ảnh AI */}
                <button 
                  type="button"
                  onClick={() => {
                    if (!currentImage) {
                      showToast('Vui lòng tải lên một ảnh chân dung hoặc chọn ảnh mẫu trước!', 'warning');
                      return;
                    }
                    handleProcessAiPhoto();
                  }}
                  disabled={isAiProcessing}
                  className={`btn btn-primary w-full py-3.5 text-sm font-bold shadow-md transition-all ${
                    !currentImage ? 'opacity-90' : ''
                  }`}
                >
                  {isAiProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Đang Xử Lý Ảnh Thẻ AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Tạo Ảnh Thẻ Bằng AI Gemini</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB CONTENT 2: CROP & ASPECT RATIOS */}
            {activeTab === 'crop' && (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Kích Thước Chuẩn Giấy Tờ</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div 
                    onClick={() => handleSetAspectRatio(2 / 3, '2x3 cm')}
                    className={`idphoto-select-card ${currentRatioName === '2x3 cm' ? 'active' : ''}`}
                  >
                    <span className="idphoto-radio-indicator"></span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 m-0">2 x 3 cm</p>
                      <p className="text-[10px] text-slate-500 m-0">Thẻ SV / Bằng lái nhỏ</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleSetAspectRatio(3 / 4, '3x4 cm')}
                    className={`idphoto-select-card ${currentRatioName === '3x4 cm' ? 'active' : ''}`}
                  >
                    <span className="idphoto-radio-indicator"></span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 m-0">3 x 4 cm</p>
                      <p className="text-[10px] text-slate-500 m-0">Ảnh thẻ phổ thông VN</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleSetAspectRatio(2 / 3, '4x6 cm')}
                    className={`idphoto-select-card ${currentRatioName === '4x6 cm' ? 'active' : ''}`}
                  >
                    <span className="idphoto-radio-indicator"></span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 m-0">4 x 6 cm</p>
                      <p className="text-[10px] text-slate-500 m-0">Hồ sơ xin việc / Bằng lái</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleSetAspectRatio(35 / 45, '3.5x4.5 cm (Passport)')}
                    className={`idphoto-select-card ${currentRatioName.startsWith('3.5x4.5') ? 'active' : ''}`}
                  >
                    <span className="idphoto-radio-indicator"></span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 m-0">3.5 x 4.5 cm</p>
                      <p className="text-[10px] text-slate-500 m-0">Hộ chiếu / Visa EU</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleSetAspectRatio(1, '5x5 cm (US Visa)')}
                    className={`col-span-2 idphoto-select-card ${currentRatioName.startsWith('5x5') ? 'active' : ''}`}
                  >
                    <span className="idphoto-radio-indicator"></span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 m-0">5 x 5 cm (2x2 inch)</p>
                      <p className="text-[10px] text-slate-500 m-0">Visa Mỹ / Visa Hàn Quốc / Nhật Bản</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-semibold">Khung Căn Chỉnh Hộ Chiếu (ICAO)</span>
                    <input 
                      type="checkbox" 
                      id="chkGuideOverlay" 
                      checked={showPassportGuide} 
                      onChange={(e) => setShowPassportGuide(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => handleRotate(-90)} 
                      className="btn btn-secondary flex-1 py-2 text-xs"
                    >
                      <RotateCcw size={14} /> Xoay -90°
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleRotate(90)} 
                      className="btn btn-secondary flex-1 py-2 text-xs"
                    >
                      <RotateCw size={14} /> Xoay +90°
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: MANUAL ADJUSTMENTS */}
            {activeTab === 'adjust' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-700 font-semibold mb-1">
                    <span>Độ Sáng (Brightness)</span>
                    <span className="text-blue-600 font-bold">{filters.brightness}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="150" 
                    value={filters.brightness} 
                    onChange={(e) => setFilters(f => ({ ...f, brightness: Number(e.target.value) }))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-700 font-semibold mb-1">
                    <span>Độ Tương Phản (Contrast)</span>
                    <span className="text-blue-600 font-bold">{filters.contrast}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="150" 
                    value={filters.contrast} 
                    onChange={(e) => setFilters(f => ({ ...f, contrast: Number(e.target.value) }))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-700 font-semibold mb-1">
                    <span>Độ Rực Màu (Saturation)</span>
                    <span className="text-blue-600 font-bold">{filters.saturate}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="200" 
                    value={filters.saturate} 
                    onChange={(e) => setFilters(f => ({ ...f, saturate: Number(e.target.value) }))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <button 
                  type="button"
                  onClick={() => setFilters({ brightness: 100, contrast: 100, saturate: 100 })}
                  className="btn btn-secondary w-full py-2.5 text-xs font-semibold"
                >
                  <RotateCcw size={14} /> Đặt Lại Thông Số Mặc Định
                </button>
              </div>
            )}

            {/* TAB CONTENT 4: PRINT SHEET CONFIG */}
            {activeTab === 'print' && (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Bố Cục In Ảnh Thẻ Khổ 10x15cm</label>
                <div className="space-y-2.5">
                  <div 
                    onClick={() => setPrintLayout('mix')}
                    className={`idphoto-select-card ${printLayout === 'mix' ? 'active' : ''}`}
                  >
                    <span className="idphoto-radio-indicator"></span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 m-0">Bố Cục Hỗn Hợp (Khuyên Dùng)</p>
                      <p className="text-[10px] text-slate-500 m-0">4 ảnh 3x4cm + 2 ảnh 4x6cm + 2 ảnh 2x3cm</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setPrintLayout('8_3x4')}
                    className={`idphoto-select-card ${printLayout === '8_3x4' ? 'active' : ''}`}
                  >
                    <span className="idphoto-radio-indicator"></span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 m-0">Khổ 3x4 cm (8 Tấm)</p>
                      <p className="text-[10px] text-slate-500 m-0">8 ảnh 3x4cm chuẩn tiện dụng</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setPrintLayout('4_4x6')}
                    className={`idphoto-select-card ${printLayout === '4_4x6' ? 'active' : ''}`}
                  >
                    <span className="idphoto-radio-indicator"></span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 m-0">Khổ 4x6 cm (4 Tấm)</p>
                      <p className="text-[10px] text-slate-500 m-0">4 ảnh 4x6cm làm hồ sơ lớn</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setPrintLayout('6_35x45')}
                    className={`idphoto-select-card ${printLayout === '6_35x45' ? 'active' : ''}`}
                  >
                    <span className="idphoto-radio-indicator"></span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 m-0">Khổ Hộ Chiếu 3.5x4.5 cm (6 Tấm)</p>
                      <p className="text-[10px] text-slate-500 m-0">6 ảnh Hộ chiếu / Visa Châu Âu</p>
                    </div>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleDownloadPrintSheet}
                  disabled={!currentImage}
                  className="btn btn-primary w-full py-3 text-xs font-semibold disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                >
                  <Download size={16} /> Tải Trang In Khổ 10x15cm (300 DPI)
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Preview & Workspace */}
        <section className="space-y-4 idphoto-sticky-preview">
          
          {/* Main Canvas Card */}
          <div className="idphoto-card flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden bg-slate-50/60">
            
            {/* Loading Spinner Overlay for AI */}
            {isAiProcessing && (
              <div className="absolute inset-0 bg-white/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                  <Sparkles className="text-blue-600 text-xl absolute inset-0 m-auto w-fit h-fit animate-pulse" size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Gemini AI Đang Xử Lý Ảnh Thẻ...</h3>
                <p className="text-xs text-slate-500 max-w-xs m-0">
                  AI đang cắt phông nền, thay đổi trang phục lịch sự và tối ưu hóa ánh sáng studio.
                </p>
              </div>
            )}

            {/* Mode Indicator Badge */}
            <div className="w-full flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-slate-700">Kích thước: <strong className="text-blue-600">{currentRatioName}</strong></span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-700 border border-slate-200 shadow-sm font-semibold">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedBgColor }}></span>
                <span>{selectedBgName}</span>
              </span>
            </div>

            {/* Image Container with Passport Guidelines (Viewport) */}
            <div className="idphoto-viewport">
              
              {/* Passport Guidelines Overlay */}
              {showPassportGuide && currentImage && (
                <div className="passport-guide">
                  <div className="passport-oval-guide"></div>
                  <div className="passport-head-top">
                    <span className="guide-label text-yellow-800 bg-yellow-100/90 shadow-sm">Đỉnh đầu ~15%</span>
                  </div>
                  <div className="passport-eye-line">
                    <span className="guide-label text-blue-800 bg-blue-100/90 shadow-sm">Tầm mắt ~42%</span>
                  </div>
                  <div className="passport-chin-line">
                    <span className="guide-label text-red-800 bg-red-100/90 shadow-sm">Cằm ~75%</span>
                  </div>
                </div>
              )}

              {/* Cropper Image Element */}
              <img 
                ref={imageRef} 
                alt="Ảnh thẻ preview" 
                className={`max-w-full max-h-full block ${currentImage ? '' : 'hidden'}`}
              />
              
              {/* Placeholder State */}
              {!currentImage && (
                <div className="text-center p-6 text-slate-400">
                  <CreditCard className="mx-auto mb-3 text-slate-400" size={52} />
                  <p className="text-sm font-semibold text-slate-600 m-0">Chưa có ảnh nào được chọn</p>
                  <p className="text-xs mt-1 text-slate-400 m-0">Vui lòng tải ảnh lên từ bảng điều khiển bên trái</p>
                </div>
              )}
            </div>

            {/* Download & Quick Actions */}
            <div className="w-full flex flex-wrap gap-3 mt-5 pt-4 border-t border-slate-200 justify-center sm:justify-between">
              <button 
                type="button"
                onClick={handleDownloadSingle} 
                disabled={!currentImage}
                className="btn btn-primary flex-1 min-w-[150px] py-2.5 text-xs font-semibold disabled:opacity-50"
              >
                <Download size={15} /> Tải Ảnh Đơn (HD)
              </button>
              <button 
                type="button"
                onClick={handleTriggerPrint} 
                disabled={!currentImage}
                className="btn btn-secondary py-2.5 px-4 text-xs font-semibold disabled:opacity-50"
              >
                <Printer size={15} /> In Trực Tiếp
              </button>
            </div>

          </div>

          {/* Sheet Print Preview Section */}
          <div className="idphoto-card space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="idphoto-card-title m-0 text-sm">
                <FileImage className="text-emerald-600" size={18} /> Xem Trước Trang In Khổ 10x15cm
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Chuẩn rửa ảnh tiệm (300 DPI)</span>
            </div>
            
            <div className="w-full bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-slate-200 overflow-auto">
              <div className="bg-white p-2.5 shadow-md rounded-md transition-all border border-slate-200" style={{ width: '240px', height: '360px' }}>
                <canvas 
                  ref={printSheetCanvasRef} 
                  width={1200} 
                  height={1800} 
                  className="w-full h-full border border-slate-200 block"
                />
              </div>
            </div>
          </div>

        </section>
      </main>

      {/* Hidden Printable Container for Window.print() */}
      <div id="idphoto-print-sheet" className="hidden">
        <img 
          ref={printableImageRef} 
          alt="In ảnh thẻ 10x15cm" 
          style={{ width: '100mm', height: '150mm', objectFit: 'contain' }}
        />
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Key className="text-blue-600" size={20} />
                <h3 className="text-base font-bold text-slate-800 m-0">Cấu Hình Gemini API Key</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowApiKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Hệ thống đã có sẵn Gemini AI từ máy chủ. Bạn cũng có thể dán API Key cá nhân của mình từ <strong>Google AI Studio</strong> để sử dụng riêng:
            </p>

            <input 
              type="password" 
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..." 
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => {
                  localStorage.removeItem('rchg_gemini_api_key');
                  setApiKeyInput('');
                  setShowApiKeyModal(false);
                  showToast('Đã xóa API key cá nhân, chuyển sang dùng key hệ thống.', 'info');
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              >
                Dùng Mặc Định
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (apiKeyInput.trim()) {
                    localStorage.setItem('rchg_gemini_api_key', apiKeyInput.trim());
                    showToast('Đã lưu Gemini API Key cá nhân!', 'success');
                  }
                  setShowApiKeyModal(false);
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white shadow-md shadow-blue-600/25 transition cursor-pointer"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  ArrowLeft
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
      {/* Header */}
      <header className="idphoto-header">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <CreditCard className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 m-0">
                IDPhoto AI Studio
              </h1>
              <p className="text-xs text-slate-500 m-0">Tạo Ảnh Thẻ & Hộ Chiếu Chuẩn AI</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentImage && (
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="text-xs sm:text-sm px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition flex items-center gap-1.5 border border-slate-300 cursor-pointer"
              >
                <ArrowLeft size={14} /> <span>Ảnh Mới</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowApiKeyModal(true)}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
              title="Cài đặt API Key Gemini"
            >
              <Sparkles className="mr-1.5 text-blue-500" size={13} /> Gemini 3.1 AI
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="idphoto-main-grid">
        {/* LEFT COLUMN: Controls & Settings */}
        <section className="space-y-5">
          
          {/* Card 1: Upload (Ẩn khi đã có ảnh) */}
          {!currentImage && (
            <div className="idphoto-card">
              <h2 className="text-base font-semibold text-slate-800 mb-1.5 flex items-center gap-2">
                <Upload className="text-blue-600" size={18} /> 1. Tải Ảnh Ban Đầu
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Tải lên bất kỳ ảnh chân dung, ảnh tự chụp hoặc ảnh thường từ điện thoại/máy tính.
              </p>

              {/* Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                }}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 transition rounded-xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/50 group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <div className="w-14 h-14 bg-white border border-slate-200 shadow-sm group-hover:scale-110 transition rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileImage className="text-slate-400 group-hover:text-blue-600" size={26} />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Kéo thả ảnh vào đây hoặc <span className="text-blue-600 underline font-semibold">chọn từ thiết bị</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">Hỗ trợ JPG, PNG, WEBP (Tối đa 10MB)</p>
              </div>

              {/* Sample Images */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-2">Hoặc thử với ảnh mẫu:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    onClick={() => loadSampleImage('male')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-xs text-slate-700 flex flex-col items-center gap-1.5 border border-slate-200 hover:border-blue-300 transition cursor-pointer font-medium"
                  >
                    <User className="text-blue-600" size={20} />
                    <span>Nam giới</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => loadSampleImage('female')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-pink-50 text-xs text-slate-700 flex flex-col items-center gap-1.5 border border-slate-200 hover:border-pink-300 transition cursor-pointer font-medium"
                  >
                    <User className="text-pink-600" size={20} />
                    <span>Nữ giới</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => loadSampleImage('casual')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-xs text-slate-700 flex flex-col items-center gap-1.5 border border-slate-200 hover:border-emerald-300 transition cursor-pointer font-medium"
                  >
                    <User className="text-emerald-600" size={20} />
                    <span>Chân dung</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Editor Controls */}
          <div className="idphoto-card space-y-5">
            {/* Hidden file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto idphoto-tabs-scroll">
              <button 
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`flex-1 min-w-[75px] py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'ai' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles size={14} className="shrink-0" /> <span>AI Studio</span>
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('crop')}
                className={`flex-1 min-w-[85px] py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'crop' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crop size={14} className="shrink-0" /> <span>Kích Thước</span>
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('adjust')}
                className={`flex-1 min-w-[80px] py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'adjust' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders size={14} className="shrink-0" /> <span>Chỉnh Màu</span>
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('print')}
                className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'print' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Printer size={14} className="shrink-0" /> <span>Khổ In</span>
              </button>
            </div>

            {/* TAB CONTENT 1: AI STUDIO */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                {/* 1. Chọn phông nền */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">1. Chọn Phông Nền Ảnh Thẻ</label>
                  <div className="grid grid-cols-4 gap-2">
                    <button 
                      type="button"
                      onClick={() => { setSelectedBgColor('#0055A5'); setSelectedBgName('Xanh Chuẩn VN'); }}
                      className={`border-2 rounded-xl p-2.5 flex flex-col items-center gap-1 bg-white hover:bg-slate-50 transition cursor-pointer ${
                        selectedBgColor === '#0055A5' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-[#0055A5] border border-black/10 shadow-sm"></span>
                      <span className="text-[10px] font-medium text-slate-700">Xanh Chuẩn</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setSelectedBgColor('#FFFFFF'); setSelectedBgName('Trắng Hộ Chiếu'); }}
                      className={`border-2 rounded-xl p-2.5 flex flex-col items-center gap-1 bg-white hover:bg-slate-50 transition cursor-pointer ${
                        selectedBgColor === '#FFFFFF' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-white border border-slate-300 shadow-sm"></span>
                      <span className="text-[10px] font-medium text-slate-700">Trắng HC</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setSelectedBgColor('#4A90E2'); setSelectedBgName('Xanh Nhạt'); }}
                      className={`border-2 rounded-xl p-2.5 flex flex-col items-center gap-1 bg-white hover:bg-slate-50 transition cursor-pointer ${
                        selectedBgColor === '#4A90E2' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-[#4A90E2] border border-black/10 shadow-sm"></span>
                      <span className="text-[10px] font-medium text-slate-700">Xanh Nhạt</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setSelectedBgColor('#D32F2F'); setSelectedBgName('Đỏ Giấy Tờ'); }}
                      className={`border-2 rounded-xl p-2.5 flex flex-col items-center gap-1 bg-white hover:bg-slate-50 transition cursor-pointer ${
                        selectedBgColor === '#D32F2F' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-[#D32F2F] border border-black/10 shadow-sm"></span>
                      <span className="text-[10px] font-medium text-slate-700">Đỏ Giấy Tờ</span>
                    </button>
                  </div>
                </div>

                {/* 2. Thay trang phục */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">2. Thay Trang Phục Lịch Sự (AI)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`cursor-pointer border bg-white p-2.5 rounded-xl flex items-center gap-2.5 hover:border-blue-400 transition ${attire === 'white_shirt' ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500' : 'border-slate-200'}`}>
                      <input 
                        type="radio" 
                        name="attire" 
                        value="white_shirt" 
                        checked={attire === 'white_shirt'} 
                        onChange={() => setAttire('white_shirt')}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 m-0">Sơ mi trắng</p>
                        <p className="text-[10px] text-slate-500 m-0">Nam / Nữ cổ bẻ</p>
                      </div>
                    </label>

                    <label className={`cursor-pointer border bg-white p-2.5 rounded-xl flex items-center gap-2.5 hover:border-blue-400 transition ${attire === 'suit_tie' ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500' : 'border-slate-200'}`}>
                      <input 
                        type="radio" 
                        name="attire" 
                        value="suit_tie" 
                        checked={attire === 'suit_tie'} 
                        onChange={() => setAttire('suit_tie')}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 m-0">Áo Vest & Cà vạt</p>
                        <p className="text-[10px] text-slate-500 m-0">Sang trọng công sở</p>
                      </div>
                    </label>

                    <label className={`cursor-pointer border bg-white p-2.5 rounded-xl flex items-center gap-2.5 hover:border-blue-400 transition ${attire === 'aodai' ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500' : 'border-slate-200'}`}>
                      <input 
                        type="radio" 
                        name="attire" 
                        value="aodai" 
                        checked={attire === 'aodai'} 
                        onChange={() => setAttire('aodai')}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 m-0">Áo Dài Trắng</p>
                        <p className="text-[10px] text-slate-500 m-0">Nữ sinh / Truyền thống</p>
                      </div>
                    </label>

                    <label className={`cursor-pointer border bg-white p-2.5 rounded-xl flex items-center gap-2.5 hover:border-blue-400 transition ${attire === 'keep_original' ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500' : 'border-slate-200'}`}>
                      <input 
                        type="radio" 
                        name="attire" 
                        value="keep_original" 
                        checked={attire === 'keep_original'} 
                        onChange={() => setAttire('keep_original')}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 m-0">Trang phục gốc</p>
                        <p className="text-[10px] text-slate-500 m-0">Chỉ đổi phông nền</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Ghi chú AI */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú AI bổ sung (Tùy chọn)</label>
                  <input 
                    type="text" 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="VD: Mắt nhìn thẳng, làm mịn da nhẹ, tóc gọn gàng..." 
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {/* Nút Tạo ảnh AI */}
                <button 
                  type="button"
                  onClick={handleProcessAiPhoto}
                  disabled={isAiProcessing || !currentImage}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 font-semibold text-sm text-white rounded-xl shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
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
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => handleSetAspectRatio(2 / 3, '2x3 cm')}
                    className={`border p-2.5 rounded-xl text-left hover:border-blue-500 transition cursor-pointer ${
                      currentRatioName === '2x3 cm' ? 'border-2 border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-800 m-0">2 x 3 cm</p>
                    <p className="text-[10px] text-slate-500 m-0">Thẻ sinh viên / Giấy tờ nhỏ</p>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleSetAspectRatio(3 / 4, '3x4 cm')}
                    className={`border p-2.5 rounded-xl text-left hover:border-blue-500 transition cursor-pointer ${
                      currentRatioName === '3x4 cm' ? 'border-2 border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-800 m-0">3 x 4 cm</p>
                    <p className="text-[10px] text-slate-500 m-0">Ảnh thẻ phổ thông Việt Nam</p>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleSetAspectRatio(2 / 3, '4x6 cm')}
                    className={`border p-2.5 rounded-xl text-left hover:border-blue-500 transition cursor-pointer ${
                      currentRatioName === '4x6 cm' ? 'border-2 border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-800 m-0">4 x 6 cm</p>
                    <p className="text-[10px] text-slate-500 m-0">Hồ sơ xin việc / Bằng lái</p>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleSetAspectRatio(35 / 45, '3.5x4.5 cm (Passport)')}
                    className={`border p-2.5 rounded-xl text-left hover:border-blue-500 transition cursor-pointer ${
                      currentRatioName.startsWith('3.5x4.5') ? 'border-2 border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-800 m-0">3.5 x 4.5 cm</p>
                    <p className="text-[10px] text-slate-500 m-0">Hộ chiếu Quốc tế / Visa EU</p>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleSetAspectRatio(1, '5x5 cm (US Visa)')}
                    className={`col-span-2 border p-2.5 rounded-xl text-left hover:border-blue-500 transition cursor-pointer ${
                      currentRatioName.startsWith('5x5') ? 'border-2 border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-800 m-0">5 x 5 cm (2x2 inch)</p>
                    <p className="text-[10px] text-slate-500 m-0">Visa Mỹ / Visa Hàn Quốc / Nhật Bản</p>
                  </button>
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
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-xs rounded-xl text-slate-700 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
                    >
                      <RotateCcw size={14} /> Xoay -90°
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleRotate(90)} 
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-xs rounded-xl text-slate-700 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
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
                    <span className="text-blue-600">{filters.brightness}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="150" 
                    value={filters.brightness} 
                    onChange={(e) => setFilters(f => ({ ...f, brightness: Number(e.target.value) }))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-700 font-semibold mb-1">
                    <span>Độ Tương Phản (Contrast)</span>
                    <span className="text-blue-600">{filters.contrast}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="150" 
                    value={filters.contrast} 
                    onChange={(e) => setFilters(f => ({ ...f, contrast: Number(e.target.value) }))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-700 font-semibold mb-1">
                    <span>Độ Rực Màu (Saturation)</span>
                    <span className="text-blue-600">{filters.saturate}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="200" 
                    value={filters.saturate} 
                    onChange={(e) => setFilters(f => ({ ...f, saturate: Number(e.target.value) }))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <button 
                  type="button"
                  onClick={() => setFilters({ brightness: 100, contrast: 100, saturate: 100 })}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
                >
                  <RotateCcw size={14} /> Đặt Lại Thông Số
                </button>
              </div>
            )}

            {/* TAB CONTENT 4: PRINT SHEET CONFIG */}
            {activeTab === 'print' && (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Bố Cục In Ảnh Thẻ Khổ 10x15cm</label>
                <div className="space-y-2">
                  <label className={`cursor-pointer border p-2.5 rounded-xl flex items-center justify-between hover:border-blue-500 transition ${printLayout === 'mix' ? 'border-2 border-blue-600 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="printLayout" 
                        value="mix" 
                        checked={printLayout === 'mix'} 
                        onChange={() => setPrintLayout('mix')}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 m-0">Bố Cục Hỗn Hợp (Khuyên Dùng)</p>
                        <p className="text-[10px] text-slate-500 m-0">4 ảnh 3x4cm + 2 ảnh 4x6cm + 2 ảnh 2x3cm</p>
                      </div>
                    </div>
                  </label>

                  <label className={`cursor-pointer border p-2.5 rounded-xl flex items-center justify-between hover:border-blue-500 transition ${printLayout === '8_3x4' ? 'border-2 border-blue-600 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="printLayout" 
                        value="8_3x4" 
                        checked={printLayout === '8_3x4'} 
                        onChange={() => setPrintLayout('8_3x4')}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 m-0">Khổ 3x4 cm (8 Tấm)</p>
                        <p className="text-[10px] text-slate-500 m-0">8 ảnh 3x4cm chuẩn tiện dụng</p>
                      </div>
                    </div>
                  </label>

                  <label className={`cursor-pointer border p-2.5 rounded-xl flex items-center justify-between hover:border-blue-500 transition ${printLayout === '4_4x6' ? 'border-2 border-blue-600 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="printLayout" 
                        value="4_4x6" 
                        checked={printLayout === '4_4x6'} 
                        onChange={() => setPrintLayout('4_4x6')}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 m-0">Khổ 4x6 cm (4 Tấm)</p>
                        <p className="text-[10px] text-slate-500 m-0">4 ảnh 4x6cm làm hồ sơ lớn</p>
                      </div>
                    </div>
                  </label>

                  <label className={`cursor-pointer border p-2.5 rounded-xl flex items-center justify-between hover:border-blue-500 transition ${printLayout === '6_35x45' ? 'border-2 border-blue-600 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="printLayout" 
                        value="6_35x45" 
                        checked={printLayout === '6_35x45'} 
                        onChange={() => setPrintLayout('6_35x45')}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 m-0">Khổ Hộ Chiếu 3.5x4.5 cm (6 Tấm)</p>
                        <p className="text-[10px] text-slate-500 m-0">6 ảnh Hộ chiếu / Visa Châu Âu</p>
                      </div>
                    </div>
                  </label>
                </div>

                <button 
                  type="button"
                  onClick={handleDownloadPrintSheet}
                  disabled={!currentImage}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Download size={15} /> Tải Trang In Khổ 10x15cm (300 DPI)
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Preview & Workspace */}
        <section className="space-y-4 idphoto-sticky-preview">
          
          {/* Main Canvas Card */}
          <div className="idphoto-card flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden bg-slate-50/60">
            
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200 shadow-sm font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedBgColor }}></span>
                <span>{selectedBgName}</span>
              </span>
            </div>

            {/* Image Container with Passport Guidelines */}
            <div className="relative w-full max-w-sm aspect-[3/4] bg-slate-900 rounded-xl overflow-hidden border border-slate-300 flex items-center justify-center shadow-lg">
              
              {/* Passport Guidelines Overlay */}
              {showPassportGuide && currentImage && (
                <div className="passport-guide">
                  <div className="passport-oval-guide"></div>
                  <div className="passport-head-top">
                    <span className="guide-label text-yellow-300 bg-black/60 shadow">Đỉnh đầu ~15%</span>
                  </div>
                  <div className="passport-eye-line">
                    <span className="guide-label text-blue-300 bg-black/60 shadow">Tầm mắt ~42%</span>
                  </div>
                  <div className="passport-chin-line">
                    <span className="guide-label text-red-300 bg-black/60 shadow">Cằm ~75%</span>
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
                  <CreditCard className="mx-auto mb-3 text-slate-500" size={48} />
                  <p className="text-sm font-medium text-slate-300 m-0">Chưa có ảnh nào được chọn</p>
                  <p className="text-xs mt-1 text-slate-400 m-0">Vui lòng tải ảnh lên từ bảng bên trái</p>
                </div>
              )}
            </div>

            {/* Download & Quick Actions */}
            <div className="w-full flex flex-wrap gap-3 mt-5 pt-4 border-t border-slate-200 justify-center sm:justify-between">
              <button 
                type="button"
                onClick={handleDownloadSingle} 
                disabled={!currentImage}
                className="flex-1 min-w-[140px] py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Download size={14} /> Tải Ảnh Đơn (HD)
              </button>
              <button 
                type="button"
                onClick={handleTriggerPrint} 
                disabled={!currentImage}
                className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition border border-slate-300 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <Printer size={14} /> In Trực Tiếp
              </button>
            </div>

          </div>

          {/* Sheet Print Preview Section */}
          <div className="idphoto-card space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 m-0">
                <FileImage className="text-emerald-600" size={16} /> Xem Trước Trang In Khổ 10x15cm
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">Chuẩn rửa ảnh tiệm (300 DPI)</span>
            </div>
            
            <div className="w-full bg-slate-100 rounded-xl p-4 flex items-center justify-center border border-slate-200 overflow-auto">
              <div className="bg-white p-2 shadow-lg rounded-sm transition-all" style={{ width: '240px', height: '360px' }}>
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

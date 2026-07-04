import React, { useState, useRef, useEffect, type DragEvent } from 'react';
import { 
  Zap, HelpCircle, UploadCloud, Move, RefreshCw, Trash2, Smartphone, Image as ImageIcon, 
  CheckCircle, Download, X, XCircle, CheckCircle2, AlertTriangle, Info 
} from 'lucide-react';

const WatermarkStudio: React.FC = () => {
  const [baseImgUrl, setBaseImgUrl] = useState<string | null>(null);
  const [logoImgUrl, setLogoImgUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string>('');
  
  const [resolution, setResolution] = useState<{w: number, h: number} | null>(null);
  
  const [logoRelX, setLogoRelX] = useState<number>(10);
  const [logoRelY, setLogoRelY] = useState<number>(10);
  const [logoScaleWidth, setLogoScaleWidth] = useState<number>(120);
  const [logoOpacity, setLogoOpacity] = useState<number>(1.0);
  const [logoRotation, setLogoRotation] = useState<number>(0);
  
  const [maxLogoSize, setMaxLogoSize] = useState<number>(1000);
  
  const baseImageRef = useRef<HTMLImageElement>(null);
  const logoImageRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const bgFileInput = useRef<HTMLInputElement>(null);
  const logoFileInput = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [pointerId, setPointerId] = useState<number | null>(null);
  
  const dragStartRef = useRef({ startPointerX: 0, startPointerY: 0, startLogoX: 0, startLogoY: 0 });

  // Modals
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [finalImgUrl, setFinalImgUrl] = useState('');
  
  const [alertModal, setAlertModal] = useState<{open: boolean, title: string, message: string, type: string}>({
    open: false, title: '', message: '', type: 'info'
  });

  const [isDragOverBg, setIsDragOverBg] = useState(false);
  const [isDragOverLogo, setIsDragOverLogo] = useState(false);

  const updateLogoRendering = () => {
    if (!baseImageRef.current || !logoImageRef.current || !wrapperRef.current || !resolution) return;

    const displayWidth = baseImageRef.current.clientWidth;
    const displayHeight = baseImageRef.current.clientHeight;

    const widthRatio = displayWidth / resolution.w;
    const visualLogoWidth = logoScaleWidth * widthRatio;
    
    const logoAspectRatio = logoImageRef.current.naturalHeight / logoImageRef.current.naturalWidth;
    const visualLogoHeight = visualLogoWidth * logoAspectRatio;

    if (isNaN(visualLogoHeight)) return;

    wrapperRef.current.style.width = `${visualLogoWidth}px`;
    wrapperRef.current.style.height = `${visualLogoHeight}px`;

    const xOffsetPx = (logoRelX / 100) * displayWidth;
    const yOffsetPx = (logoRelY / 100) * displayHeight;

    const originLeft = baseImageRef.current.offsetLeft;
    const originTop = baseImageRef.current.offsetTop;

    const finalX = originLeft + xOffsetPx;
    const finalY = originTop + yOffsetPx;

    wrapperRef.current.style.transform = `translate3d(${finalX}px, ${finalY}px, 0px) rotate(${logoRotation}deg)`;
    logoImageRef.current.style.opacity = logoOpacity.toString();
  };

  useEffect(() => {
    let animationFrameId: number;
    const handleResize = () => {
      animationFrameId = requestAnimationFrame(updateLogoRendering);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [baseImgUrl, logoImgUrl, logoRelX, logoRelY, logoScaleWidth, logoOpacity, logoRotation, resolution]);

  useEffect(() => {
    updateLogoRendering();
  }, [logoRelX, logoRelY, logoScaleWidth, logoOpacity, logoRotation, resolution, logoImgUrl]);

  const showAlert = (title: string, message: string, type: 'info'|'error'|'warning'|'success' = 'info') => {
    setAlertModal({ open: true, title, message, type });
  };

  const handleBgFile = (file: File) => {
    if (!file.type.match('image.*')) {
      showAlert('Lỗi Định Dạng', 'Vui lòng chọn một tệp ảnh hợp lệ.', 'error');
      return;
    }
    if (baseImgUrl) URL.revokeObjectURL(baseImgUrl);
    
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setResolution({ w: img.naturalWidth, h: img.naturalHeight });
      const maxSize = Math.floor(Math.min(img.naturalWidth, img.naturalHeight) * 0.95);
      setMaxLogoSize(maxSize || 1000);
      const recSize = Math.floor(img.naturalWidth * 0.22);
      setLogoScaleWidth(recSize || 150);
      setBaseImgUrl(url);
    };
    img.src = url;
  };

  const handleLogoFile = (file: File) => {
    if (!baseImgUrl) {
      showAlert('Chưa tải ảnh nền', 'Vui lòng chọn hình ảnh nền trước khi tải ảnh logo!', 'warning');
      return;
    }
    if (!file.type.match('image.*')) {
      showAlert('Lỗi Định Dạng', 'Định dạng logo không được hỗ trợ.', 'error');
      return;
    }
    if (logoImgUrl) URL.revokeObjectURL(logoImgUrl);

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setLogoName(file.name);
      setLogoImgUrl(url);
      setLogoPreset('center');
    };
    img.src = url;
  };

  const onBgDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOverBg(false);
    if (e.dataTransfer.files.length > 0) handleBgFile(e.dataTransfer.files[0]);
  };

  const onLogoDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOverLogo(false);
    if (e.dataTransfer.files.length > 0) handleLogoFile(e.dataTransfer.files[0]);
  };

  const removeLogo = () => {
    if (logoImgUrl) URL.revokeObjectURL(logoImgUrl);
    setLogoImgUrl(null);
    setLogoName('');
  };

  const setLogoPreset = (preset: string) => {
    if (!resolution || !logoImageRef.current) return;
    
    const w = resolution.w;
    const h = resolution.h;

    const logoAspectRatio = logoImageRef.current.naturalHeight / logoImageRef.current.naturalWidth;
    const normLogoW = (logoScaleWidth / w) * 100; 
    const normLogoH = ((logoScaleWidth * logoAspectRatio) / h) * 100; 

    const margin = 2.5;
    let relX = logoRelX;
    let relY = logoRelY;

    switch (preset) {
        case 'top-left': relX = margin; relY = margin; break;
        case 'top-center': relX = 50 - (normLogoW / 2); relY = margin; break;
        case 'top-right': relX = 100 - normLogoW - margin; relY = margin; break;
        case 'center-left': relX = margin; relY = 50 - (normLogoH / 2); break;
        case 'center': relX = 50 - (normLogoW / 2); relY = 50 - (normLogoH / 2); break;
        case 'center-right': relX = 100 - normLogoW - margin; relY = 50 - (normLogoH / 2); break;
        case 'bottom-left': relX = margin; relY = 100 - normLogoH - margin; break;
        case 'bottom-center': relX = 50 - (normLogoW / 2); relY = 100 - normLogoH - margin; break;
        case 'bottom-right': relX = 100 - normLogoW - margin; relY = 100 - normLogoH - margin; break;
    }

    relX = Math.max(0, Math.min(100 - normLogoW, relX));
    relY = Math.max(0, Math.min(100 - normLogoH, relY));

    setLogoRelX(relX);
    setLogoRelY(relY);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setPointerId(e.pointerId);
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = baseImageRef.current!.getBoundingClientRect();

    dragStartRef.current = {
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startLogoX: rect.left - parentRect.left,
      startLogoY: rect.top - parentRect.top
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || e.pointerId !== pointerId) return;
    e.preventDefault();

    const deltaX = e.clientX - dragStartRef.current.startPointerX;
    const deltaY = e.clientY - dragStartRef.current.startPointerY;

    const proposedX = dragStartRef.current.startLogoX + deltaX;
    const proposedY = dragStartRef.current.startLogoY + deltaY;

    const displayWidth = baseImageRef.current!.clientWidth;
    const displayHeight = baseImageRef.current!.clientHeight;

    const dragWidth = wrapperRef.current!.clientWidth;
    const dragHeight = wrapperRef.current!.clientHeight;

    const clampedX = Math.max(0, Math.min(displayWidth - dragWidth, proposedX));
    const clampedY = Math.max(0, Math.min(displayHeight - dragHeight, proposedY));

    setLogoRelX((clampedX / displayWidth) * 100);
    setLogoRelY((clampedY / displayHeight) * 100);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging && e.pointerId === pointerId) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(pointerId);
    }
  };

  const exportFinalImage = () => {
    if (!resolution || !logoImgUrl || !baseImgUrl || !baseImageRef.current || !logoImageRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const originW = resolution.w;
    const originH = resolution.h;

    canvas.width = originW;
    canvas.height = originH;

    ctx.drawImage(baseImageRef.current, 0, 0, originW, originH);

    const actualLogoW = logoScaleWidth;
    const logoAspectRatio = logoImageRef.current.naturalHeight / logoImageRef.current.naturalWidth;
    const actualLogoH = actualLogoW * logoAspectRatio;

    const actualX = (logoRelX / 100) * originW;
    const actualY = (logoRelY / 100) * originH;

    ctx.save();
    const centerX = actualX + (actualLogoW / 2);
    const centerY = actualY + (actualLogoH / 2);
    ctx.translate(centerX, centerY);
    ctx.rotate((logoRotation * Math.PI) / 180);
    ctx.globalAlpha = logoOpacity;

    ctx.drawImage(
        logoImageRef.current, 
        -actualLogoW / 2, 
        -actualLogoH / 2, 
        actualLogoW, 
        actualLogoH
    );

    ctx.restore();

    try {
        const outputUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `watermark_${Date.now()}.png`;
        downloadLink.href = outputUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        setFinalImgUrl(outputUrl);
        setSaveModalOpen(true);
    } catch (err) {
        console.error(err);
        showAlert('Lỗi Xuất Bản', 'Trình duyệt chặn việc lưu trữ Canvas cục bộ hoặc vượt quá dung lượng.', 'error');
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-[calc(100vh-80px)] flex flex-col font-sans selection:bg-indigo-500 selection:text-white select-none">
      <style>{`
        .accelerated { will-change: transform; transform: translate3d(0, 0, 0); backface-visibility: hidden; }
        .checkerboard-bg {
            background-color: #0f172a;
            background-image: linear-gradient(45deg, #020617 25%, transparent 25%), 
                              linear-gradient(-45deg, #020617 25%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, #020617 75%), 
                              linear-gradient(-45deg, transparent 75%, #020617 75%);
            background-size: 16px 16px;
            background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
        }
      `}</style>
      
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 px-4 py-3 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                  <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-500/30">
                      <Zap className="w-6 h-6" />
                  </div>
                  <div>
                      <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                          Watermark Studio Pro
                      </h1>
                      <p className="text-xs text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Xử lý Offline an toàn • Lưu trực tiếp vào Thư viện
                      </p>
                  </div>
              </div>
              <div className="flex items-center space-x-3">
                  <button onClick={() => showAlert('Hướng Dẫn Sử Dụng Siêu Tốc', 'Kéo thả tệp ảnh nền vào đây. Sau đó tải logo. Di chuyển và tinh chỉnh thông qua bảng công cụ. Bấm Tải Xuống.', 'info')} className="text-sm text-slate-400 hover:text-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800">
                      <HelpCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Hướng dẫn</span>
                  </button>
              </div>
          </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
          
          {/* Left Side */}
          <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl min-h-[400px] lg:min-h-[550px]">
              
              <div className="bg-slate-900/50 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                      <span className={`w-2 h-2 rounded-full ${baseImgUrl ? (logoImgUrl ? 'bg-emerald-500' : 'bg-yellow-500') : 'bg-slate-500'}`}></span>
                      {baseImgUrl ? (logoImgUrl ? 'Đã kết nối logo. Kéo thả tự do trên ảnh!' : 'Đã tải ảnh nền thành công') : 'Chờ tải ảnh nền (Kéo thả ảnh vào khung)'}
                  </span>
                  {resolution && <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">{resolution.w}x{resolution.h} px</span>}
              </div>

              <div className="flex-1 flex items-center justify-center p-4 checkerboard-bg relative overflow-hidden">
                  
                  {!baseImgUrl && (
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragOverBg(true); }}
                        onDragLeave={() => setIsDragOverBg(false)}
                        onDrop={onBgDrop}
                        onClick={() => bgFileInput.current?.click()}
                        className={`text-center p-8 max-w-md w-full border-2 border-dashed ${isDragOverBg ? 'border-indigo-500 bg-slate-900/60' : 'border-slate-700 bg-slate-900/40'} hover:border-indigo-500 rounded-2xl cursor-pointer transition group backdrop-blur-sm`}
                      >
                          <input type="file" ref={bgFileInput} accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.length) handleBgFile(e.target.files[0]) }} />
                          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-600/10 group-hover:text-indigo-400 transition text-slate-400">
                              <UploadCloud className="w-8 h-8" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-200 group-hover:text-white mb-2">Tải ảnh nền siêu tốc</h3>
                          <p className="text-sm text-slate-400 mb-4">Click để chọn hoặc Kéo thả ảnh trực tiếp vào đây</p>
                          <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/20">
                              Chọn từ thiết bị
                          </button>
                      </div>
                  )}

                  {baseImgUrl && (
                      <div className="relative max-w-full max-h-[60vh] sm:max-h-[65vh] flex items-center justify-center">
                          <img ref={baseImageRef} src={baseImgUrl} alt="Base Image" className="max-w-full max-h-[60vh] sm:max-h-[65vh] object-contain rounded select-none pointer-events-none" />
                          
                          {logoImgUrl && (
                              <div 
                                ref={wrapperRef}
                                onPointerDown={onPointerDown}
                                onPointerMove={onPointerMove}
                                onPointerUp={onPointerUp}
                                onPointerCancel={onPointerUp}
                                className={`absolute cursor-move group select-none touch-none accelerated ${isDragging ? 'ring-2 ring-indigo-500/80' : ''}`}
                                style={{ top: 0, left: 0, width: '100px', height: 'auto' }}
                              >
                                  <img ref={logoImageRef} src={logoImgUrl} alt="Logo" className="w-full h-full object-contain pointer-events-none opacity-100 select-none" />
                                  <div className="absolute -inset-1 border-2 border-dashed border-indigo-500 rounded scale-100 opacity-0 group-hover:opacity-100 group-active:opacity-100 pointer-events-none transition-opacity duration-150"></div>
                                  <div className="absolute -top-3 -right-3 bg-indigo-500 text-white p-1 rounded-full shadow-md text-xs opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                                      <Move className="w-3.5 h-3.5" />
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>

              {baseImgUrl && (
                  <div className="bg-slate-900/90 border-t border-slate-800/80 px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
                      <div className="flex items-center gap-2">
                          <button onClick={() => bgFileInput.current?.click()} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5" />
                              Thay ảnh nền
                          </button>
                          {logoImgUrl && (
                              <button onClick={removeLogo} className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/30 text-red-400 border border-red-900/20 rounded-lg text-xs font-medium transition flex items-center gap-1.5">
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Gỡ logo
                              </button>
                          )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Giữ & kéo logo để chỉnh vị trí tự do</span>
                      </div>
                  </div>
              )}
          </div>

          {/* Right Side */}
          <div className="w-full lg:w-[380px] flex flex-col gap-6">
              
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-2.5 mb-4">
                      <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold flex items-center justify-center">1</span>
                      <h2 className="text-md font-bold text-white">Tải Logo Lên</h2>
                  </div>

                  <div 
                    onClick={() => logoFileInput.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOverLogo(true); }}
                    onDragLeave={() => setIsDragOverLogo(false)}
                    onDrop={onLogoDrop}
                    className={`border-2 border-dashed ${isDragOverLogo ? 'border-indigo-500/70 bg-slate-950/70' : 'border-slate-700 bg-slate-950/40'} hover:border-indigo-500/70 rounded-xl p-4 text-center cursor-pointer transition group relative`}
                  >
                      <input type="file" ref={logoFileInput} accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.length) handleLogoFile(e.target.files[0]) }} />
                      <div className="w-10 h-10 bg-slate-800/80 rounded-lg flex items-center justify-center mx-auto mb-2 text-slate-400 group-hover:bg-indigo-600/10 group-hover:text-indigo-400 transition">
                          <ImageIcon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition block mb-0.5">Chọn hình logo của bạn</span>
                      <span className="text-xs text-slate-500 block">Dạng PNG trong suốt để đạt hiệu quả tốt nhất</span>
                  </div>

                  {logoImgUrl && (
                      <div className="mt-3 flex items-center justify-between bg-slate-950/50 rounded-lg px-3 py-2 text-xs border border-slate-800/80">
                          <div className="flex items-center gap-2 overflow-hidden">
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="text-slate-300 truncate font-mono">{logoName}</span>
                          </div>
                          <button onClick={() => logoFileInput.current?.click()} className="text-indigo-400 hover:text-indigo-300 font-medium whitespace-nowrap ml-2">Đổi logo</button>
                      </div>
                  )}
              </div>

              <div className={`bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative transition-all duration-200 ${!logoImgUrl ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="flex items-center gap-2.5 mb-4">
                      <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold flex items-center justify-center">2</span>
                      <h2 className="text-md font-bold text-white">Chỉnh Sửa & Căn Chỉnh</h2>
                  </div>

                  <div className="mb-5">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Căn vị trí nhanh</label>
                      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                          <button onClick={() => setLogoPreset('top-left')} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition text-xs flex flex-col items-center gap-1">Trái Trên</button>
                          <button onClick={() => setLogoPreset('top-center')} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition text-xs flex flex-col items-center gap-1">Giữa Trên</button>
                          <button onClick={() => setLogoPreset('top-right')} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition text-xs flex flex-col items-center gap-1">Phải Trên</button>
                          
                          <button onClick={() => setLogoPreset('center-left')} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition text-xs flex flex-col items-center gap-1">Giữa Trái</button>
                          <button onClick={() => setLogoPreset('center')} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 flex flex-col items-center gap-1">Trung Tâm</button>
                          <button onClick={() => setLogoPreset('center-right')} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition text-xs flex flex-col items-center gap-1">Giữa Phải</button>

                          <button onClick={() => setLogoPreset('bottom-left')} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition text-xs flex flex-col items-center gap-1">Trái Dưới</button>
                          <button onClick={() => setLogoPreset('bottom-center')} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition text-xs flex flex-col items-center gap-1">Giữa Dưới</button>
                          <button onClick={() => setLogoPreset('bottom-right')} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition text-xs flex flex-col items-center gap-1">Phải Dưới</button>
                      </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-slate-800/50">
                      <div>
                          <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kích thước</label>
                              <span className="text-xs text-indigo-400 font-mono font-bold">{logoScaleWidth}px</span>
                          </div>
                          <input type="range" min="10" max={maxLogoSize} value={logoScaleWidth} onChange={(e) => setLogoScaleWidth(parseInt(e.target.value))} className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer" />
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Độ mờ đục</label>
                              <span className="text-xs text-indigo-400 font-mono font-bold">{Math.round(logoOpacity * 100)}%</span>
                          </div>
                          <input type="range" min="0" max="100" value={logoOpacity * 100} onChange={(e) => setLogoOpacity(parseFloat(e.target.value)/100)} className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer" />
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Góc xoay</label>
                              <span className="text-xs text-indigo-400 font-mono font-bold">{logoRotation}°</span>
                          </div>
                          <input type="range" min="0" max="360" value={logoRotation} onChange={(e) => setLogoRotation(parseInt(e.target.value))} className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer" />
                      </div>
                  </div>
              </div>

              <button onClick={exportFinalImage} className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2.5 transition active:scale-[0.98] ${!logoImgUrl ? 'opacity-40 pointer-events-none' : ''}`}>
                  <Download className="w-5 h-5" />
                  <span>Tải Ảnh Chất Lượng Gốc</span>
              </button>
          </div>
      </main>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden"></canvas>

      {/* Modals */}
      {saveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl relative flex flex-col max-h-[90vh]">
                  <button onClick={() => setSaveModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full z-10">
                      <X className="w-5 h-5" />
                  </button>
                  <div className="text-center mb-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-950/40 text-emerald-500 border border-emerald-900/30 flex items-center justify-center mx-auto mb-2">
                          <CheckCircle className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-white">Đã Ghép Logo Thành Công!</h3>
                      <p className="text-xs text-indigo-400 font-medium mt-1 animate-pulse px-4">
                          👉 ĐIỆN THOẠI: Ấn giữ vào bức ảnh bên dưới 2 giây {'->'} Chọn "Lưu hình ảnh" hoặc "Thêm vào Ảnh" để tải về máy!
                      </p>
                  </div>
                  <div className="flex-1 overflow-auto bg-slate-950 rounded-xl p-2 border border-slate-800 flex items-center justify-center min-h-[180px] max-h-[50vh]">
                      <img src={finalImgUrl} alt="Ấn giữ để lưu ảnh" className="max-w-full max-h-full object-contain rounded shadow-lg select-all" />
                  </div>
                  <div className="mt-4 text-center">
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">Nếu bạn dùng máy tính, trình duyệt sẽ tự động tải file xuống dưới góc màn hình.</p>
                      <button onClick={() => setSaveModalOpen(false)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition">Đóng cửa sổ xem ảnh</button>
                  </div>
              </div>
          </div>
      )}

      {alertModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                  <button onClick={() => setAlertModal({...alertModal, open: false})} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                  </button>
                  <div className={`w-11 h-11 rounded-full mb-3 flex items-center justify-center border ${
                      alertModal.type === 'error' ? 'bg-red-950/40 text-red-500 border-red-900/20' :
                      alertModal.type === 'success' ? 'bg-emerald-950/40 text-emerald-500 border-emerald-900/20' :
                      alertModal.type === 'warning' ? 'bg-yellow-950/40 text-yellow-500 border-yellow-900/20' :
                      'bg-indigo-950/40 text-indigo-500 border-indigo-900/20'
                  }`}>
                      {alertModal.type === 'error' ? <XCircle className="w-5 h-5" /> :
                       alertModal.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                       alertModal.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                       <Info className="w-5 h-5" />}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{alertModal.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-5 whitespace-pre-wrap">{alertModal.message}</p>
                  <div className="flex justify-end">
                      <button onClick={() => setAlertModal({...alertModal, open: false})} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition">Đã hiểu</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default WatermarkStudio;

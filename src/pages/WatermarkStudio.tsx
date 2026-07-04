import React, { useState, useRef, useEffect, type DragEvent } from 'react';
import heic2any from 'heic2any';
import { 
  UploadCloud, Move, RefreshCw, Trash2, Smartphone, Image as ImageIcon, 
  CheckCircle, Download, X, XCircle, CheckCircle2, AlertTriangle, Info, Loader2
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
  
  const [isProcessing, setIsProcessing] = useState(false);

  const processImageFile = async (file: File): Promise<File | null> => {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
      try {
        setIsProcessing(true);
        const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
        const convertedBlob = Array.isArray(converted) ? converted[0] : converted;
        setIsProcessing(false);
        return new File([convertedBlob], file.name.replace(/\.hei(c|f)$/i, '.jpg'), { type: 'image/jpeg' });
      } catch (error) {
        console.error(error);
        setIsProcessing(false);
        showAlert('Lỗi', 'Không thể đọc file HEIC/HEIF này.', 'error');
        return null;
      }
    }
    return file;
  };

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

  const handleBgFile = async (file: File) => {
    const processedFile = await processImageFile(file);
    if (!processedFile) return;

    if (!processedFile.type.match('image.*')) {
      showAlert('Lỗi Định Dạng', 'Vui lòng chọn một tệp ảnh hợp lệ.', 'error');
      return;
    }
    if (baseImgUrl) URL.revokeObjectURL(baseImgUrl);
    
    const url = URL.createObjectURL(processedFile);
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

  const handleLogoFile = async (file: File) => {
    if (!baseImgUrl) {
      showAlert('Chưa tải ảnh nền', 'Vui lòng chọn hình ảnh nền trước khi tải ảnh logo!', 'warning');
      return;
    }
    const processedFile = await processImageFile(file);
    if (!processedFile) return;

    if (!processedFile.type.match('image.*')) {
      showAlert('Lỗi Định Dạng', 'Định dạng logo không được hỗ trợ.', 'error');
      return;
    }
    if (logoImgUrl) URL.revokeObjectURL(logoImgUrl);

    const url = URL.createObjectURL(processedFile);
    const img = new Image();
    img.onload = () => {
      setLogoName(processedFile.name);
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
        const outputUrl = canvas.toDataURL('image/jpeg', 0.95);
        const downloadLink = document.createElement('a');
        downloadLink.download = `watermark_${Date.now()}.jpg`;
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
    <div className="animate-fade-in w-full select-none pb-12">
      <style>{`
        .accelerated { will-change: transform; transform: translate3d(0, 0, 0); backface-visibility: hidden; }
        .checkerboard-light {
            background-color: #f8fafc;
            background-image: linear-gradient(45deg, #e2e8f0 25%, transparent 25%), 
                              linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, #e2e8f0 75%), 
                              linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
            background-size: 16px 16px;
            background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
        }
      `}</style>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-2">
          Watermark Studio Pro
        </h1>
        <p className="text-slate-500">
          Chèn logo, đóng dấu bản quyền vào ảnh một cách nhanh chóng và chuyên nghiệp.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full">
          
          {/* Left Side: Workspace */}
          <div className="flex-1 glass-card flex flex-col overflow-hidden min-h-[450px] lg:min-h-[600px] !p-0 shadow-xl border border-slate-200">
              
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium">
                      <span className={`w-2 h-2 rounded-full ${baseImgUrl ? (logoImgUrl ? 'bg-emerald-500' : 'bg-yellow-500') : 'bg-slate-400'}`}></span>
                      {baseImgUrl ? (logoImgUrl ? 'Đã kết nối logo. Kéo thả tự do trên ảnh!' : 'Đã tải ảnh nền thành công') : 'Chờ tải ảnh nền (Kéo thả ảnh vào khung)'}
                  </span>
                  {resolution && <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shadow-sm">{resolution.w}x{resolution.h} px</span>}
              </div>

              <div className="flex-1 flex items-center justify-center p-4 checkerboard-light relative overflow-hidden">
                  
                  {!baseImgUrl && (
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragOverBg(true); }}
                        onDragLeave={() => setIsDragOverBg(false)}
                        onDrop={onBgDrop}
                        onClick={() => bgFileInput.current?.click()}
                        className={`flex flex-col items-center justify-center text-center p-8 max-w-md w-full border-2 border-dashed ${isDragOverBg ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white/60'} hover:border-blue-400 rounded-2xl cursor-pointer transition group backdrop-blur-sm shadow-sm`}
                      >
                          <input type="file" ref={bgFileInput} accept="image/*,.heic,.heif" className="hidden" onChange={(e) => { if(e.target.files?.length) handleBgFile(e.target.files[0]) }} />
                          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 group-hover:text-blue-600 transition text-slate-400 shadow-sm">
                              <UploadCloud className="w-8 h-8" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-700 group-hover:text-blue-600 mb-2">Tải ảnh nền siêu tốc</h3>
                          <p className="text-sm text-slate-500 mb-4">Click để chọn hoặc Kéo thả ảnh trực tiếp vào đây</p>
                          <button className="btn btn-primary px-6 py-2.5 rounded-xl text-sm font-medium transition shadow-md">
                              Chọn từ thiết bị
                          </button>
                      </div>
                  )}

                  {baseImgUrl && (
                      <div className="relative max-w-full max-h-[60vh] sm:max-h-[65vh] flex items-center justify-center shadow-lg rounded ring-1 ring-slate-900/5">
                          <img ref={baseImageRef} src={baseImgUrl} alt="Base Image" className="max-w-full max-h-[60vh] sm:max-h-[65vh] object-contain rounded select-none pointer-events-none bg-white" />
                          
                          {logoImgUrl && (
                              <div 
                                ref={wrapperRef}
                                onPointerDown={onPointerDown}
                                onPointerMove={onPointerMove}
                                onPointerUp={onPointerUp}
                                onPointerCancel={onPointerUp}
                                className={`absolute cursor-move group select-none touch-none accelerated ${isDragging ? 'ring-2 ring-blue-500/80 shadow-2xl' : ''}`}
                                style={{ top: 0, left: 0, width: '100px', height: 'auto' }}
                              >
                                  <img ref={logoImageRef} src={logoImgUrl} alt="Logo" className="w-full h-full object-contain pointer-events-none opacity-100 select-none drop-shadow-sm" />
                                  <div className="absolute -inset-1 border-2 border-dashed border-blue-500 rounded scale-100 opacity-0 group-hover:opacity-100 group-active:opacity-100 pointer-events-none transition-opacity duration-150"></div>
                                  <div className="absolute -top-3 -right-3 bg-blue-600 text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                                      <Move className="w-3 h-3" />
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>

              {baseImgUrl && (
                  <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
                      <div className="flex items-center gap-2">
                          <button onClick={() => bgFileInput.current?.click()} className="btn btn-secondary px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm">
                              <RefreshCw className="w-3.5 h-3.5" />
                              Thay ảnh nền
                          </button>
                          {logoImgUrl && (
                              <button onClick={removeLogo} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-sm">
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Gỡ logo
                              </button>
                          )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-blue-500" />
                          <span>Giữ & kéo logo để chỉnh vị trí tự do</span>
                      </div>
                  </div>
              )}
          </div>

          {/* Right Side: Controls */}
          <div className="w-full lg:w-[380px] flex flex-col gap-6">
              
              <div className="glass-card !p-5 shadow-lg border border-slate-200">
                  <div className="flex items-center gap-2.5 mb-4">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">1</span>
                      <h2 className="text-md font-bold text-slate-800">Tải Logo Lên</h2>
                  </div>

                  <div 
                    onClick={() => logoFileInput.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOverLogo(true); }}
                    onDragLeave={() => setIsDragOverLogo(false)}
                    onDrop={onLogoDrop}
                    className={`flex flex-col items-center justify-center border-2 border-dashed ${isDragOverLogo ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50'} hover:border-blue-400 hover:bg-blue-50/50 rounded-xl p-4 text-center cursor-pointer transition group relative`}
                  >
                      <input type="file" ref={logoFileInput} accept="image/*,.heic,.heif" className="hidden" onChange={(e) => { if(e.target.files?.length) handleLogoFile(e.target.files[0]) }} />
                      <div className="w-10 h-10 bg-white border border-slate-200 shadow-sm rounded-lg flex items-center justify-center mb-2 text-slate-400 group-hover:border-blue-200 group-hover:text-blue-500 transition">
                          <ImageIcon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition block mb-0.5">Chọn hình logo của bạn</span>
                      <span className="text-xs text-slate-500 block">Dạng PNG trong suốt để đạt hiệu quả tốt nhất</span>
                  </div>

                  {logoImgUrl && (
                      <div className="mt-3 flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2 text-xs border border-emerald-100">
                          <div className="flex items-center gap-2 overflow-hidden">
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="text-emerald-800 truncate font-mono font-medium">{logoName}</span>
                          </div>
                          <button onClick={() => logoFileInput.current?.click()} className="btn btn-secondary px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm ml-2 shrink-0">
                              <RefreshCw className="w-3 h-3" />
                              Đổi
                          </button>
                      </div>
                  )}
              </div>

              <div className={`glass-card !p-5 shadow-lg border border-slate-200 relative transition-all duration-300 ${!logoImgUrl ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                  <div className="flex items-center gap-2.5 mb-4">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">2</span>
                      <h2 className="text-md font-bold text-slate-800">Căn Chỉnh Tùy Chỉnh</h2>
                  </div>

                  <div className="mb-6">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Căn vị trí nhanh</label>
                      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
                          <button onClick={() => setLogoPreset('top-left')} className="py-2 px-1 hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800 rounded-lg transition text-xs font-medium">Trái Trên</button>
                          <button onClick={() => setLogoPreset('top-center')} className="py-2 px-1 hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800 rounded-lg transition text-xs font-medium">Giữa Trên</button>
                          <button onClick={() => setLogoPreset('top-right')} className="py-2 px-1 hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800 rounded-lg transition text-xs font-medium">Phải Trên</button>
                          
                          <button onClick={() => setLogoPreset('center-left')} className="py-2 px-1 hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800 rounded-lg transition text-xs font-medium">Giữa Trái</button>
                          <button onClick={() => setLogoPreset('center')} className="py-2 px-1 bg-white shadow-sm text-blue-600 ring-1 ring-blue-500/20 rounded-lg text-xs font-bold">Trung Tâm</button>
                          <button onClick={() => setLogoPreset('center-right')} className="py-2 px-1 hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800 rounded-lg transition text-xs font-medium">Giữa Phải</button>

                          <button onClick={() => setLogoPreset('bottom-left')} className="py-2 px-1 hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800 rounded-lg transition text-xs font-medium">Trái Dưới</button>
                          <button onClick={() => setLogoPreset('bottom-center')} className="py-2 px-1 hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800 rounded-lg transition text-xs font-medium">Giữa Dưới</button>
                          <button onClick={() => setLogoPreset('bottom-right')} className="py-2 px-1 hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800 rounded-lg transition text-xs font-medium">Phải Dưới</button>
                      </div>
                  </div>

                  <div className="space-y-5 pt-4 border-t border-slate-100">
                      <div>
                          <div className="flex justify-between items-center mb-2">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kích thước</label>
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono font-bold">{logoScaleWidth}px</span>
                          </div>
                          <input type="range" min="10" max={maxLogoSize} value={logoScaleWidth} onChange={(e) => setLogoScaleWidth(parseInt(e.target.value))} className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer" />
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-2">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Độ mờ đục</label>
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono font-bold">{Math.round(logoOpacity * 100)}%</span>
                          </div>
                          <input type="range" min="0" max="100" value={logoOpacity * 100} onChange={(e) => setLogoOpacity(parseFloat(e.target.value)/100)} className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer" />
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-2">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Góc xoay</label>
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono font-bold">{logoRotation}°</span>
                          </div>
                          <input type="range" min="0" max="360" value={logoRotation} onChange={(e) => setLogoRotation(parseInt(e.target.value))} className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer" />
                      </div>
                  </div>
              </div>

              <button onClick={exportFinalImage} className={`btn btn-primary w-full py-4 text-base rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition-all ${!logoImgUrl ? 'opacity-50 grayscale pointer-events-none' : 'hover:shadow-blue-500/25 hover:-translate-y-0.5'}`}>
                  <Download className="w-5 h-5" />
                  <span>Tải Ảnh Chất Lượng Gốc</span>
              </button>
          </div>
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden"></canvas>

      {/* Modals */}
      {saveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
                  <button onClick={() => setSaveModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition z-10">
                      <X className="w-5 h-5" />
                  </button>
                  <div className="text-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                          <CheckCircle className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">Đã Ghép Logo Thành Công!</h3>
                      <p className="text-sm text-blue-600 font-medium mt-1.5 px-4 bg-blue-50 py-1.5 rounded-lg inline-block">
                          👉 ĐIỆN THOẠI: Ấn giữ vào bức ảnh bên dưới 2 giây {'->'} Chọn "Lưu hình ảnh" để tải về máy!
                      </p>
                  </div>
                  <div className="flex-1 overflow-auto bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-center min-h-[180px] max-h-[50vh] shadow-inner">
                      <img src={finalImgUrl} alt="Ấn giữ để lưu ảnh" className="max-w-full max-h-full object-contain rounded drop-shadow-md select-all" />
                  </div>
                  <div className="mt-5 text-center space-y-3">
                      <p className="text-xs text-slate-500 leading-relaxed">Trên máy tính, trình duyệt đã tự động tải file xuống.</p>
                      <button onClick={() => setSaveModalOpen(false)} className="btn btn-secondary w-full py-2.5 rounded-xl text-sm">Đóng cửa sổ</button>
                  </div>
              </div>
          </div>
      )}

      {alertModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                  <button onClick={() => setAlertModal({...alertModal, open: false})} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full transition">
                      <X className="w-4 h-4" />
                  </button>
                  <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center shadow-inner ${
                      alertModal.type === 'error' ? 'bg-red-100 text-red-600' :
                      alertModal.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                      alertModal.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                  }`}>
                      {alertModal.type === 'error' ? <XCircle className="w-6 h-6" /> :
                       alertModal.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                       alertModal.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> :
                       <Info className="w-6 h-6" />}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{alertModal.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 whitespace-pre-wrap">{alertModal.message}</p>
                  <div className="flex justify-end">
                      <button onClick={() => setAlertModal({...alertModal, open: false})} className="btn btn-primary px-5 py-2.5 rounded-xl text-sm shadow-md">Đã hiểu</button>
                  </div>
              </div>
          </div>
      )}
      {isProcessing && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                  <h3 className="text-lg font-bold text-slate-800">Đang xử lý ảnh...</h3>
                  <p className="text-sm text-slate-500 mt-1">Đang chuyển đổi định dạng ảnh Apple</p>
              </div>
          </div>
      )}
    </div>
  );
};

export default WatermarkStudio;

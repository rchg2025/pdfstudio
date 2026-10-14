import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Download, X, Lock, FileImage, Loader2, Wand2, 
  Maximize2, Printer, Sparkles, CheckCircle2, Sliders, Layers
} from 'lucide-react';
import FileUploadZone from '../components/FileUploadZone';
import { useDialogs } from '../components/CustomDialogs';
import ImageCompareSlider from '../components/ImageCompareSlider';
import { 
  applySharpen, 
  applyDenoise, 
  scaleCanvasHighQuality, 
  injectDpiToJpegBlob, 
  calculatePrintDimensions 
} from '../utils/imageEnhanceUtils';
import './ImageEnhance.css';

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

type ScaleOption = '1x' | '2x' | '4x' | 'a4_print';

export default function ImageEnhance() {
  const [file, setFile] = useState<File | null>(null);
  const [fileSize, setFileSize] = useState(0);
  
  // Các thông số tinh chỉnh
  const [sharpness, setSharpness] = useState<number>(60); // 0 -> 150% (Độ nét chi tiết)
  const [denoise, setDenoise] = useState<number>(10); // 0 -> 50% (Khử hạt nhiễu)
  const [scaleMode, setScaleMode] = useState<ScaleOption>('2x'); // Phóng to 2X / 4X / Khổ A4
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(105);
  const [saturation, setSaturation] = useState<number>(100);
  
  const [originalDim, setOriginalDim] = useState<{w: number, h: number} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  
  // Real-time preview
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const [processedFile, setProcessedFile] = useState<{ 
    url: string; 
    size: number; 
    name: string;
    width: number;
    height: number;
    printInfo: ReturnType<typeof calculatePrintDimensions>;
  } | null>(null);
  
  const { showAlert } = useDialogs();

  useEffect(() => {
    return () => {
      if (processedFile) URL.revokeObjectURL(processedFile.url);
      if (previewUrl && !previewUrl.startsWith('data:')) URL.revokeObjectURL(previewUrl);
      if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    };
  }, [processedFile, previewUrl, originalImageUrl]);

  const handleFileSelect = (files: FileList | null) => {
    const selectedFile = files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setFileSize(selectedFile.size);
      setProcessedFile(null);
      
      const objectUrl = URL.createObjectURL(selectedFile);
      setOriginalImageUrl(objectUrl);
      const img = new Image();
      img.onload = () => {
        setOriginalDim({ w: img.width, h: img.height });
        originalImageRef.current = img;
        updateFastPreview(img, sharpness, denoise, brightness, contrast, saturation);
      };
      img.src = objectUrl;
    } else {
      showAlert('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, WEBP...)', 'Lỗi định dạng');
    }
  };

  // Tính kích thước đích dự kiến dựa theo scaleMode
  const targetDimensions = useMemo(() => {
    if (!originalDim) return { w: 0, h: 0 };
    if (scaleMode === '1x') return { w: originalDim.w, h: originalDim.h };
    if (scaleMode === '2x') return { w: originalDim.w * 2, h: originalDim.h * 2 };
    if (scaleMode === '4x') return { w: originalDim.w * 4, h: originalDim.h * 4 };
    if (scaleMode === 'a4_print') {
      // Khổ A4 chuẩn 300 DPI: 2480 x 3508 px
      const isLandscape = originalDim.w > originalDim.h;
      const targetMax = 3508;
      if (isLandscape) {
        const h = Math.round((targetMax / originalDim.w) * originalDim.h);
        return { w: targetMax, h };
      } else {
        const w = Math.round((targetMax / originalDim.h) * originalDim.w);
        return { w, h: targetMax };
      }
    }
    return { w: originalDim.w * 2, h: originalDim.h * 2 };
  }, [originalDim, scaleMode]);

  // Thông tin in ấn dự kiến
  const printEstimates = useMemo(() => {
    if (!targetDimensions.w || !targetDimensions.h) return null;
    return calculatePrintDimensions(targetDimensions.w, targetDimensions.h, 300);
  }, [targetDimensions]);

  // Preview nhanh cho người dùng quan sát hiệu quả
  const updateFastPreview = (
    img: HTMLImageElement, 
    shp: number, 
    dns: number, 
    b: number, 
    c: number, 
    s: number
  ) => {
    const canvas = document.createElement('canvas');
    let targetW = img.width;
    let targetH = img.height;
    const maxPreviewDim = 1000;

    if (targetW > maxPreviewDim || targetH > maxPreviewDim) {
      if (targetW > targetH) {
        targetH = Math.round((maxPreviewDim / targetW) * targetH);
        targetW = maxPreviewDim;
      } else {
        targetW = Math.round((maxPreviewDim / targetH) * targetW);
        targetH = maxPreviewDim;
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
    ctx.drawImage(img, 0, 0, targetW, targetH);

    // Áp dụng khử nhiễu nhẹ
    if (dns > 0) {
      applyDenoise(ctx, targetW, targetH, dns / 100);
    }

    // Áp dụng làm nét quang học
    if (shp > 0) {
      applySharpen(ctx, targetW, targetH, shp / 100);
    }

    setPreviewUrl(canvas.toDataURL('image/jpeg', 0.85));
  };

  // Debounce cập nhật preview
  useEffect(() => {
    if (originalImageRef.current) {
      const timeoutId = setTimeout(() => {
        updateFastPreview(originalImageRef.current!, sharpness, denoise, brightness, contrast, saturation);
      }, 120);
      return () => clearTimeout(timeoutId);
    }
  }, [sharpness, denoise, brightness, contrast, saturation]);

  // Xử lý tạo ảnh siêu nét chuẩn in ấn 300 DPI
  const handleProcess = async () => {
    if (!file || !originalImageRef.current || !originalDim) return;
    
    setIsProcessing(true);
    setProcessingStep('Đang chuẩn bị khung xử lý...');
    setProcessedFile(null);

    // Nhường event loop 50ms để UI cập nhật loading
    await new Promise(r => setTimeout(r, 50));

    try {
      const img = originalImageRef.current;
      const { w: targetW, h: targetH } = targetDimensions;

      // Bước 1: Vẽ ảnh gốc ở độ phân giải gốc kèm màu sắc
      setProcessingStep('Đang cân chỉnh màu sắc & tương phản gốc...');
      const baseCanvas = document.createElement('canvas');
      baseCanvas.width = originalDim.w;
      baseCanvas.height = originalDim.h;
      const bCtx = baseCanvas.getContext('2d');
      if (!bCtx) throw new Error('Không thể khởi tạo Canvas Context');

      bCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      bCtx.drawImage(img, 0, 0, originalDim.w, originalDim.h);

      // Bước 2: Phóng to siêu độ phân giải (Super Resolution Multistep)
      setProcessingStep(`Đang nhân độ phân giải siêu nét lên ${targetW}x${targetH}px (300 DPI)...`);
      await new Promise(r => setTimeout(r, 50));
      
      const scaledCanvas = (targetW !== originalDim.w || targetH !== originalDim.h)
        ? scaleCanvasHighQuality(baseCanvas, targetW, targetH)
        : baseCanvas;

      const sCtx = scaledCanvas.getContext('2d');
      if (!sCtx) throw new Error('Lỗi phóng to ảnh');

      // Bước 3: Khử hạt nhiễu (Denoise)
      if (denoise > 0) {
        setProcessingStep('Đang làm mịn & khử hạt nhiễu...');
        await new Promise(r => setTimeout(r, 30));
        applyDenoise(sCtx, targetW, targetH, denoise / 100);
      }

      // Bước 4: Tăng nét quang học (Unsharp Masking viền chi tiết)
      if (sharpness > 0) {
        setProcessingStep('Đang áp dụng bộ lọc Unsharp Masking tái tạo viền sắc nét...');
        await new Promise(r => setTimeout(r, 30));
        applySharpen(sCtx, targetW, targetH, sharpness / 100);
      }

      // Bước 5: Đóng gói ảnh & nhúng Header 300 DPI
      setProcessingStep('Đang nhúng thông số chuẩn in ấn 300 DPI...');
      await new Promise(r => setTimeout(r, 30));

      scaledCanvas.toBlob(async (blob) => {
        if (!blob) {
          showAlert('Lỗi khi xuất ảnh Blob', 'Lỗi');
          setIsProcessing(false);
          return;
        }

        // Nhúng 300 DPI vào JPEG Blob
        const finalBlob = await injectDpiToJpegBlob(blob, 300);
        const url = URL.createObjectURL(finalBlob);
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        const newName = `${cleanName}_SieuNet_300DPI_${scaleMode}.jpg`;

        const printInfo = calculatePrintDimensions(targetW, targetH, 300);

        setProcessedFile({
          url,
          size: finalBlob.size,
          name: newName,
          width: targetW,
          height: targetH,
          printInfo
        });

        setIsProcessing(false);
        setProcessingStep('');
      }, 'image/jpeg', 0.98); // Xuất chất lượng tối đa 98% cho in ấn

    } catch (err: any) {
      console.error(err);
      showAlert(`Lỗi trong quá trình xử lý: ${err.message}`, 'Lỗi');
      setIsProcessing(false);
      setProcessingStep('');
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

  const handlePrintDirect = () => {
    if (!processedFile) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>In ảnh chất lượng cao - ${processedFile.name}</title>
          <style>
            @page { size: auto; margin: 0; }
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
            img { max-width: 100%; max-height: 100vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${processedFile.url}" onload="window.print();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const resetForm = () => {
    setFile(null);
    setFileSize(0);
    setOriginalDim(null);
    setProcessedFile(null);
    setPreviewUrl(null);
    setOriginalImageUrl(null);
    setSharpness(60);
    setDenoise(10);
    setScaleMode('2x');
    setBrightness(100);
    setContrast(105);
    setSaturation(100);
    originalImageRef.current = null;
  };

  return (
    <div className="image-enhance-container">
      <div className="enhance-header">
        <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Wand2 className="text-primary" />
          Tăng Độ Nét Ảnh & Phóng To Chuẩn In Ấn 300 DPI
        </h1>
        <p className="text-secondary">
          Tái tạo độ nét quang học Unsharp Masking, nhân độ phân giải 2X/4X/A4 không vỡ hạt và nhúng thẻ 300 DPI chuẩn tiệm in.
        </p>
      </div>

      <div className="enhance-tool-card">
        <div className="local-processing-notice">
          <Lock size={16} />
          Xử lý trực tiếp trên trình duyệt bằng Canvas Engine & AI Multi-step Interpolation — Ảnh của bạn được bảo mật tuyệt đối.
        </div>

        {!file ? (
          <FileUploadZone 
            onFileSelect={handleFileSelect} 
            accept="image/*"
            hintText="Chọn ảnh hoặc kéo thả vào đây · PNG, JPG, WEBP, HEIC..."
            multiple={false}
          />
        ) : (
          <>
            {/* Thanh thông tin file gốc */}
            <div className="flex justify-between items-center mb-4 p-3 bg-primary rounded border border-border">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileImage className="text-blue-500 shrink-0" size={24} />
                <div className="truncate">
                  <p className="font-semibold text-slate-800 truncate m-0">{file.name}</p>
                  <p className="text-xs text-secondary m-0 mt-0.5">
                    Gốc: <b>{formatBytes(fileSize)}</b> {originalDim && `· ${originalDim.w} x ${originalDim.h} px`}
                  </p>
                </div>
              </div>
              <button 
                onClick={resetForm}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors shrink-0"
                title="Chọn ảnh khác"
              >
                <X size={20} className="text-secondary" />
              </button>
            </div>

            {/* BẢNG ĐIỀU KHIỂN NÂNG CAO CHO IN ẤN */}
            <div className="enhance-print-panel">
              {/* Cột 1: Chọn Chế độ Phóng To */}
              <div className="print-mode-section">
                <label className="section-subtitle">
                  <Maximize2 size={16} className="text-indigo-600" />
                  Mục tiêu in ấn & Độ phân giải:
                </label>
                <div className="scale-mode-grid">
                  <button 
                    type="button" 
                    className={`scale-btn ${scaleMode === '1x' ? 'active' : ''}`}
                    onClick={() => setScaleMode('1x')}
                  >
                    <span className="scale-title">1X Giữ Nguyên</span>
                    <span className="scale-desc">Chỉ làm nét viền</span>
                  </button>

                  <button 
                    type="button" 
                    className={`scale-btn ${scaleMode === '2x' ? 'active' : ''}`}
                    onClick={() => setScaleMode('2x')}
                  >
                    <span className="scale-badge">Khuyên dùng</span>
                    <span className="scale-title">2X Siêu Nét</span>
                    <span className="scale-desc">Tăng gấp đôi chi tiết</span>
                  </button>

                  <button 
                    type="button" 
                    className={`scale-btn ${scaleMode === '4x' ? 'active' : ''}`}
                    onClick={() => setScaleMode('4x')}
                  >
                    <span className="scale-title">4X Cực Đại</span>
                    <span className="scale-desc">In tranh lớn / Banner</span>
                  </button>

                  <button 
                    type="button" 
                    className={`scale-btn ${scaleMode === 'a4_print' ? 'active' : ''}`}
                    onClick={() => setScaleMode('a4_print')}
                  >
                    <span className="scale-title">Chuẩn Khổ A4</span>
                    <span className="scale-desc">Khổ giấy 21x29.7cm</span>
                  </button>
                </div>

                {/* Banner tính toán khổ in thực tế */}
                {printEstimates && (
                  <div className="print-dimension-box">
                    <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
                      <Printer size={17} />
                      {printEstimates.recommendation}
                    </div>
                    <div className="print-meta-grid">
                      <div>
                        Độ phân giải xuất: <b>{targetDimensions.w} x {targetDimensions.h} px</b>
                      </div>
                      <div>
                        Khổ in nét (300 DPI): <b>{printEstimates.widthCm} x {printEstimates.heightCm} cm</b> ({printEstimates.widthInch} x {printEstimates.heightInch}")
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cột 2: Các thanh trượt điều chỉnh */}
              <div className="enhance-sliders-section">
                <label className="section-subtitle">
                  <Sliders size={16} className="text-emerald-600" />
                  Thông số tinh chỉnh quang học:
                </label>
                
                <div className="enhance-form">
                  <div className="enhance-input-group highlight-slider">
                    <label>
                      <span className="flex items-center gap-1 font-semibold text-indigo-700">
                        <Sparkles size={15} /> Độ sắc nét viền (Sharpen)
                      </span>
                      <span className="value text-indigo-600">{sharpness}%</span>
                    </label>
                    <input 
                      type="range" 
                      className="enhance-slider accent-indigo"
                      min="0"
                      max="150"
                      value={sharpness}
                      onChange={(e) => setSharpness(parseInt(e.target.value))}
                    />
                    <span className="slider-hint">Tái tạo cạnh và chi tiết nổi khối</span>
                  </div>

                  <div className="enhance-input-group">
                    <label>
                      <span>Khử hạt nhiễu (Denoise)</span>
                      <span className="value">{denoise}%</span>
                    </label>
                    <input 
                      type="range" 
                      className="enhance-slider"
                      min="0"
                      max="50"
                      value={denoise}
                      onChange={(e) => setDenoise(parseInt(e.target.value))}
                    />
                    <span className="slider-hint">Làm mịn vết rạn hạt vỡ</span>
                  </div>

                  <div className="enhance-input-group">
                    <label>
                      <span>Độ tương phản</span>
                      <span className="value">{contrast}%</span>
                    </label>
                    <input 
                      type="range" 
                      className="enhance-slider"
                      min="80"
                      max="140"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                    />
                    <span className="slider-hint">Tăng độ sâu đen và trong trẻo</span>
                  </div>

                  <div className="enhance-input-group">
                    <label>
                      <span>Độ sáng</span>
                      <span className="value">{brightness}%</span>
                    </label>
                    <input 
                      type="range" 
                      className="enhance-slider"
                      min="80"
                      max="130"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                    />
                    <span className="slider-hint">Cân bằng ánh sáng in ấn</span>
                  </div>

                  <div className="enhance-input-group">
                    <label>
                      <span>Độ tươi màu (Saturate)</span>
                      <span className="value">{saturation}%</span>
                    </label>
                    <input 
                      type="range" 
                      className="enhance-slider"
                      min="70"
                      max="140"
                      value={saturation}
                      onChange={(e) => setSaturation(parseInt(e.target.value))}
                    />
                    <span className="slider-hint">Giúp mực in lên màu rực rỡ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Xem trước so sánh trực tiếp */}
            {previewUrl && originalImageUrl && !processedFile && (
              <div className="preview-section">
                <div className="preview-bar-title">
                  <Layers size={16} />
                  <span>Kéo thanh trượt ở giữa để so sánh ảnh gốc (trái) và ảnh đã tăng nét (phải)</span>
                </div>
                <ImageCompareSlider 
                  beforeImage={originalImageUrl} 
                  afterImage={previewUrl} 
                />
              </div>
            )}

            {/* Các nút xử lý / Tải về */}
            {!processedFile ? (
              <div className="action-buttons">
                <button 
                  className="btn-process" 
                  onClick={handleProcess}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={22} /> Đang xử lý ảnh chất lượng cao...
                      </span>
                      <span className="text-xs font-normal text-white/80">{processingStep}</span>
                    </div>
                  ) : (
                    <>
                      <Wand2 size={22} />
                      Xuất Ảnh Siêu Nét Chuẩn 300 DPI ({targetDimensions.w} x {targetDimensions.h} px)
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="processed-success-panel animate-fade-in">
                <div className="success-header">
                  <CheckCircle2 size={32} className="text-emerald-500 shrink-0" />
                  <div>
                    <h3 className="text-base font-bold text-slate-800 m-0">Đã tăng độ nét & nhúng chuẩn 300 DPI thành công!</h3>
                    <p className="text-xs text-slate-500 m-0 mt-1">
                      Độ phân giải: <b>{processedFile.width} x {processedFile.height} px</b> · Dung lượng: <b>{formatBytes(processedFile.size)}</b>
                    </p>
                  </div>
                </div>

                <div className="success-print-summary">
                  Khổ in khuyến nghị sắc nét nhất: <b>{processedFile.printInfo.widthCm} x {processedFile.printInfo.heightCm} cm</b> ({processedFile.printInfo.recommendation})
                </div>

                <div className="action-buttons-group">
                  <button 
                    className="btn-download" 
                    onClick={handleDownload}
                  >
                    <Download size={20} />
                    Tải File Ảnh HD 300 DPI ({formatBytes(processedFile.size)})
                  </button>

                  <button 
                    className="btn-print-direct" 
                    onClick={handlePrintDirect}
                  >
                    <Printer size={20} />
                    In Ngay Qua Máy In
                  </button>

                  <button 
                    className="btn-re-edit" 
                    onClick={() => setProcessedFile(null)}
                  >
                    <Sliders size={18} />
                    Chỉnh Lại Thông Số
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

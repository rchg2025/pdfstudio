import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Download, X, Loader2, FileImage } from 'lucide-react';
import FileUploadZone from '../components/FileUploadZone';
import { useDialogs } from '../components/CustomDialogs';
import './ImageCrop.css';

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function ImageCrop() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  
  // Pixels logic
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ width: number, height: number, x: number, y: number } | null>(null);
  
  // Inputs state
  const [aspectRatioStr, setAspectRatioStr] = useState('free');
  const [inputX, setInputX] = useState<string>('0');
  const [inputY, setInputY] = useState<string>('0');
  const [inputW, setInputW] = useState<string>('0');
  const [inputH, setInputH] = useState<string>('0');

  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<{ url: string, size: number, name: string } | null>(null);
  
  const { showAlert } = useDialogs();

  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
      if (processedFile) URL.revokeObjectURL(processedFile.url);
    };
  }, [imageSrc, processedFile]);

  const handleFileSelect = (files: FileList | null) => {
    const selectedFile = files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setFileSize(selectedFile.size);
      const url = URL.createObjectURL(selectedFile);
      setImageSrc(url);
      setProcessedFile(null);
    } else {
      showAlert('Vui lòng chọn file ảnh hợp lệ', 'Lỗi');
    }
  };

  const onCropComplete = useCallback((_: any, croppedAreaPixelsData: any) => {
    setCroppedAreaPixels(croppedAreaPixelsData);
    
    // Update inputs based on visual dragging
    setInputX(Math.round(croppedAreaPixelsData.x).toString());
    setInputY(Math.round(croppedAreaPixelsData.y).toString());
    setInputW(Math.round(croppedAreaPixelsData.width).toString());
    setInputH(Math.round(croppedAreaPixelsData.height).toString());
  }, []);

  const handleAspectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setAspectRatioStr(val);
    if (val === 'free') {
      setAspect(undefined);
    } else if (val === '1:1') {
      setAspect(1);
    } else if (val === '16:9') {
      setAspect(16 / 9);
    } else if (val === '4:3') {
      setAspect(4 / 3);
    }
  };

  // Create canvas from image and croppedArea
  const getCroppedImg = async (imageSrcUrl: string, pixelCrop: any): Promise<Blob | null> => {
    const image = new Image();
    const loadPromise = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = imageSrcUrl;
    });
    
    await loadPromise;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      let mimeType = file?.type || 'image/jpeg';
      if (mimeType !== 'image/jpeg' && mimeType !== 'image/png' && mimeType !== 'image/webp') {
        mimeType = 'image/jpeg';
      }
      canvas.toBlob((blob) => {
        resolve(blob);
      }, mimeType, 0.9);
    });
  };

  const handleProcess = async () => {
    if (!imageSrc || !croppedAreaPixels || !file) return;
    
    setIsProcessing(true);
    setProcessedFile(null);

    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const ext = file.type === 'image/jpeg' ? '.jpg' : file.type === 'image/png' ? '.png' : '.webp';
        const newName = file.name.replace(/\.[^/.]+$/, "") + '-cropped' + ext;
        
        setProcessedFile({
          url,
          size: blob.size,
          name: newName
        });
      }
    } catch (e) {
      console.error(e);
      showAlert('Lỗi khi cắt ảnh', 'Lỗi');
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

  const resetForm = () => {
    setFile(null);
    setImageSrc(null);
    setFileSize(0);
    setProcessedFile(null);
  };

  return (
    <div className="image-crop-container">
      <div className="crop-header">
        <h1 className="text-2xl font-bold mb-2">Crop ảnh</h1>
        <p className="text-secondary">Cắt ảnh theo tỉ lệ 1:1, 16:9, 4:3 hoặc vùng tùy chọn.</p>
      </div>

      <div className="crop-tool-card">
        {!imageSrc ? (
          <FileUploadZone 
            onFileSelect={handleFileSelect} 
            accept="image/*"
            hintText="Chọn ảnh hoặc kéo thả vào đây · Tối đa 50MB"
            multiple={false}
          />
        ) : (
          <div className="crop-workspace">
            {!processedFile ? (
              <>
                <div className="crop-preview-area">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
                
                <div className="crop-form-area">
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileImage className="text-blue-500 shrink-0" />
                      <div className="truncate">
                        <p className="font-medium truncate">{file?.name}</p>
                        <p className="text-sm text-secondary">{formatBytes(fileSize)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={resetForm}
                      className="p-2 hover:bg-secondary rounded-full transition-colors shrink-0"
                      title="Xóa ảnh"
                    >
                      <X size={20} className="text-secondary" />
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Tỉ lệ</label>
                    <select 
                      className="form-control" 
                      value={aspectRatioStr}
                      onChange={handleAspectChange}
                    >
                      <option value="free">Tùy chọn (Tự do)</option>
                      <option value="1:1">Vuông 1:1</option>
                      <option value="16:9">16:9</option>
                      <option value="4:3">4:3</option>
                    </select>
                  </div>

                  <div className="crop-coords-grid">
                    <div className="form-group">
                      <label>X</label>
                      <input type="text" className="form-control" value={inputX} readOnly disabled />
                    </div>
                    <div className="form-group">
                      <label>Y</label>
                      <input type="text" className="form-control" value={inputY} readOnly disabled />
                    </div>
                    <div className="form-group">
                      <label>Rộng (px)</label>
                      <input type="text" className="form-control" value={inputW} readOnly disabled />
                    </div>
                    <div className="form-group">
                      <label>Cao (px)</label>
                      <input type="text" className="form-control" value={inputH} readOnly disabled />
                    </div>
                  </div>
                  <p className="text-sm text-secondary italic">
                    Di chuyển và thu phóng vùng chọn trên ảnh để tự động cập nhật thông số kích thước.
                  </p>

                  <button 
                    className="btn-process mt-auto" 
                    onClick={handleProcess}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <><Loader2 className="animate-spin" size={20} /> Đang xử lý...</>
                    ) : (
                      <>Xử lý ngay</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="result-section w-full">
                <div className="flex justify-between w-full mb-4">
                  <h3 className="text-xl font-bold">Kết quả:</h3>
                  <button onClick={() => setProcessedFile(null)} className="text-primary hover:underline">
                    Cắt lại
                  </button>
                </div>
                <img src={processedFile.url} alt="Cropped" className="result-preview" />
                
                <button className="btn-download max-w-sm mt-4" onClick={handleDownload}>
                  <Download size={20} />
                  Tải về ({formatBytes(processedFile.size)})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

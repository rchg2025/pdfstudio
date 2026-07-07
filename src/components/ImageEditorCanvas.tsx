import React, { useRef, useState, useEffect, useCallback } from 'react';

interface Props {
  frameUrl: string;
}

export default function ImageEditorCanvas({ frameUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = frameUrl;
    img.onload = () => setFrameImg(img);
  }, [frameUrl]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frameImg) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Kích thước thật của canvas
    canvas.width = frameImg.width || 1080;
    canvas.height = frameImg.height || 1080;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (userImage) {
      ctx.save();
      
      ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
      ctx.rotate((rotation * Math.PI) / 180);
      if (isFlipped) ctx.scale(-1, 1);
      ctx.scale(zoom, zoom);

      const imgAspect = userImage.width / userImage.height;
      const canvasAspect = canvas.width / canvas.height;
      let drawWidth, drawHeight;

      if (imgAspect > canvasAspect) {
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgAspect;
      } else {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgAspect;
      }

      ctx.drawImage(userImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      
      ctx.restore();
    }

    // Vẽ frame (PNG trong suốt) lên trên cùng
    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
  }, [frameImg, userImage, zoom, rotation, offsetX, offsetY, isFlipped]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setUserImage(img);
          setZoom(1);
          setRotation(0);
          setOffsetX(0);
          setOffsetY(0);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    let clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    let clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !userImage) return;
    let clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    let clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Tỷ lệ khoảng cách chuột / canvas size thực tế
    const rect = canvasRef.current?.getBoundingClientRect();
    const scale = rect ? (canvasRef.current!.width / rect.width) : 1;

    setOffsetX(prev => prev + (clientX - dragStart.x) * scale);
    setOffsetY(prev => prev + (clientY - dragStart.y) * scale);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'avatar-frame.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto gap-6 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
      <div 
        className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden relative cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-contain pointer-events-none"
        />
        {!userImage && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium">
            Kéo thả hoặc tải ảnh lên để bắt đầu
          </div>
        )}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium w-16 text-gray-700">Zoom:</label>
            <input 
              type="range" min="0.1" max="3" step="0.1" value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-blue-600"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium w-16 text-gray-700">Xoay:</label>
            <input 
              type="range" min="-180" max="180" step="1" value={rotation}
              onChange={(e) => setRotation(parseFloat(e.target.value))}
              className="flex-1 accent-blue-600"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <button 
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-5 py-2.5 bg-[#4B5563] text-white rounded-lg font-medium text-sm hover:bg-[#374151] transition-colors shadow-sm"
          >
            Lật ảnh
          </button>
          
          <label className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
            Chọn hình
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
          
          <button 
            onClick={handleDownload}
            className="px-5 py-2.5 bg-[#10B981] text-white rounded-lg font-medium text-sm hover:bg-[#059669] transition-colors shadow-sm"
          >
            Tải về
          </button>
        </div>
      </div>
    </div>
  );
}

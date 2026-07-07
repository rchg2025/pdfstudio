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
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '42rem', margin: '0 auto', gap: '1.5rem', padding: '2rem' }}>
      <div 
        style={{ width: '100%', aspectRatio: '1/1', background: 'var(--bg-secondary)', border: '2px dashed var(--border)', borderRadius: '1rem', overflow: 'hidden', position: 'relative', cursor: 'move' }}
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
          style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
        />
        {!userImage && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Kéo thả hoặc tải ảnh cá nhân lên để ghép
          </div>
        )}
      </div>

      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, width: '4rem', color: 'var(--text-primary)' }}>Thu phóng</label>
            <input 
              type="range" min="0.1" max="3" step="0.1" value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--primary)' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, width: '4rem', color: 'var(--text-primary)' }}>Xoay</label>
            <input 
              type="range" min="-180" max="180" step="1" value={rotation}
              onChange={(e) => setRotation(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--primary)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <label className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            Chọn Hình
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
          
          <button 
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}
          >
            Lật Ảnh
          </button>
          
          <button 
            onClick={handleDownload}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: '#10B981' }}
          >
            Tải Xuống
          </button>
        </div>
      </div>
    </div>
  );
}

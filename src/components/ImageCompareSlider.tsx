import { useState, useRef, useEffect } from 'react';
import { ChevronsLeftRight } from 'lucide-react';
import './ImageCompareSlider.css';

interface ImageCompareSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function ImageCompareSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'TRƯỚC',
  afterLabel = 'SAU'
}: ImageCompareSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current || !isDragging) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    
    setSliderPosition(percent);
  };

  const onMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      className="image-compare-wrapper"
      ref={containerRef}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
      }}
    >
      {/* Before Image (Background) */}
      <img src={beforeImage} alt="Before" className="image-compare-img" draggable={false} />
      
      {/* After Image (Clipped) */}
      <div 
        className="image-compare-after"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <img src={afterImage} alt="After" draggable={false} />
      </div>

      {/* Slider Handle */}
      <div 
        className="image-compare-handle" 
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="image-compare-handle-button">
          <ChevronsLeftRight size={20} />
        </div>
      </div>

      {/* Labels */}
      {sliderPosition > 10 && (
        <div className="image-compare-label before">
          {beforeLabel}
        </div>
      )}
      {sliderPosition < 90 && (
        <div className="image-compare-label after">
          {afterLabel}
        </div>
      )}
    </div>
  );
}

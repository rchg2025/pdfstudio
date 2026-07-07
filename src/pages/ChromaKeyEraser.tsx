import React, { useState, useRef } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import { Eraser, Upload, Sparkles, RotateCcw, Download, Image as ImageIcon, Info } from 'lucide-react';
import './ChromaKeyEraser.css';

const ChromaKeyEraser: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    const [currentImageData, setCurrentImageData] = useState<ImageData | null>(null);
    const [targetColor, setTargetColor] = useState({ r: 255, g: 255, b: 255 });
    const [tolerance, setTolerance] = useState(30);
    const [softness, setSoftness] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const hexToRgb = (hex: string) => {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    const rgbToHex = (r: number, g: number, b: number) => {
        return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
    };

    const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
        const rDiff = r1 - r2;
        const gDiff = g1 - g2;
        const bDiff = b1 - b2;
        return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setOriginalImage(img);
                
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;

                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                setCurrentImageData(imgData);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
        if (!originalImage || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;
            
            const pixelData = ctx.getImageData(x, y, 1, 1).data;
            
            if (pixelData[3] === 0) return;

            setTargetColor({ r: pixelData[0], g: pixelData[1], b: pixelData[2] });
        }
    };

    const removeBackground = () => {
        if (!originalImage || !currentImageData || !canvasRef.current || isProcessing) return;

        setIsProcessing(true);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        
        // Use a copy of the imageData so we don't mutate currentImageData unintentionally before passing
        const imageData = new ImageData(
            new Uint8ClampedArray(currentImageData.data),
            width,
            height
        );

        // Spawn web worker
        const worker = new Worker(new URL('../workers/chromaWorker.ts', import.meta.url), { type: 'module' });
        
        worker.onmessage = (e) => {
            const { processedData } = e.data;
            // Reconstruct ImageData from the buffer returned by worker
            const newImgData = new ImageData(
                new Uint8ClampedArray(processedData.data),
                width,
                height
            );
            ctx.putImageData(newImgData, 0, 0);
            setIsProcessing(false);
            worker.terminate();
        };

        worker.onerror = (err) => {
            console.error("Worker error:", err);
            setIsProcessing(false);
            worker.terminate();
        };

        // Pass array buffer for transfer to avoid structured clone overhead
        worker.postMessage({
            imageData,
            targetColor,
            tolerance,
            softness
        }, [imageData.data.buffer]);
    };

    const handleReset = () => {
        if (originalImage && currentImageData && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
            if (ctx) {
                ctx.putImageData(currentImageData, 0, 0);
            }
        }
    };

    const handleDownload = () => {
        if (!originalImage || !canvasRef.current) {
             alert("Chưa có ảnh để tải xuống.");
             return;
        }
        
        const link = document.createElement('a');
        link.download = 'image-removed-bg.png';
        link.href = canvasRef.current.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const targetHexColor = rgbToHex(targetColor.r, targetColor.g, targetColor.b);

    return (
        <div className="chroma-eraser-container animate-fade-in">
            <header className="chroma-header">
                <div className="chroma-title-group">
                    <div className="chroma-icon">
                        <Eraser size={24} />
                    </div>
                    <h1 className="chroma-title">Xóa Nền Theo Màu</h1>
                </div>
                <div>
                     <label htmlFor="imageUpload" className="btn btn-primary">
                        <Upload size={18} /> Tải Ảnh Lên
                    </label>
                    <input type="file" id="imageUpload" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                </div>
            </header>

            <main className="chroma-main">
                
                {/* Sidebar Controls */}
                <aside className="chroma-sidebar">
                    
                    <div className="chroma-control-group">
                        <h2 className="chroma-control-title">1. Chọn Màu Cần Xóa</h2>
                        <p className="chroma-control-desc">Click vào ảnh hoặc dùng công cụ chọn màu.</p>
                        <div className="chroma-color-picker-wrap">
                            <input 
                                type="color" 
                                value={targetHexColor} 
                                onChange={(e) => {
                                    const rgb = hexToRgb(e.target.value);
                                    if (rgb) setTargetColor(rgb);
                                }}
                                className="chroma-color-picker" 
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Màu Đã Chọn</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{targetHexColor}</span>
                            </div>
                        </div>
                    </div>

                    <div className="chroma-control-group">
                        <h2 className="chroma-control-title">2. Cài Đặt Xóa</h2>
                        
                        {/* Tolerance Slider */}
                        <div className="chroma-slider-group">
                            <div className="chroma-slider-header">
                                <label htmlFor="tolerance" className="chroma-slider-label">Độ Dung Sai (Tolerance)</label>
                                <span className="chroma-slider-value">{tolerance}</span>
                            </div>
                            <input 
                                type="range" 
                                id="tolerance" 
                                min="0" 
                                max="255" 
                                value={tolerance} 
                                onChange={(e) => setTolerance(parseInt(e.target.value))}
                                className="chroma-range" 
                            />
                            <p className="chroma-control-desc" style={{ marginTop: '0.25rem' }}>Tăng lên để xóa các màu gần giống màu đã chọn.</p>
                        </div>

                        {/* Softness Slider */}
                         <div className="chroma-slider-group" style={{ marginBottom: 0 }}>
                            <div className="chroma-slider-header">
                                <label htmlFor="softness" className="chroma-slider-label">Làm Mờ Viền (Softness)</label>
                                <span className="chroma-slider-value">{softness}</span>
                            </div>
                            <input 
                                type="range" 
                                id="softness" 
                                min="0" 
                                max="50" 
                                value={softness} 
                                onChange={(e) => setSoftness(parseInt(e.target.value))}
                                className="chroma-range" 
                            />
                            <p className="chroma-control-desc" style={{ marginTop: '0.25rem', marginBottom: 0 }}>Giúp viền ảnh mượt mà hơn, không bị răng cưa.</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="chroma-actions">
                        <button onClick={removeBackground} disabled={!originalImage || isProcessing} className="btn btn-primary" style={{ width: '100%' }}>
                            <Sparkles size={18} /> Áp Dụng Xóa Nền
                        </button>
                        <button onClick={handleReset} disabled={!originalImage} className="btn btn-secondary" style={{ width: '100%' }}>
                            <RotateCcw size={18} /> Hoàn Tác
                        </button>
                        <button onClick={handleDownload} disabled={!originalImage} className="btn btn-secondary" style={{ width: '100%', borderColor: 'var(--success)', color: 'var(--success)' }}>
                            <Download size={18} /> Tải Ảnh Xuống
                        </button>
                    </div>
                </aside>

                {/* Canvas Area */}
                <div className="chroma-workspace">
                    <div className="canvas-wrapper">
                        {!originalImage && (
                            <div className="chroma-empty-state">
                                <ImageIcon size={64} className="chroma-empty-icon" />
                                <p className="chroma-empty-title">Chưa có ảnh nào được tải lên</p>
                                <p className="chroma-empty-desc">Nhấn "Tải Ảnh Lên" ở góc trên để bắt đầu</p>
                            </div>
                        )}
                        {isProcessing && <div className="chroma-loader"></div>}
                        <canvas 
                            ref={canvasRef} 
                            onClick={handleCanvasClick}
                            className="image-canvas"
                            style={{ display: originalImage ? 'block' : 'none' }}
                        ></canvas>
                    </div>
                    
                    <div className="chroma-footer-info">
                        <Info size={16} style={{ color: 'var(--primary)' }} />
                        Click trực tiếp vào ảnh để nhanh chóng chọn màu nền cần xóa.
                    </div>
                </div>

            </main>
        </div>
    );
};

export default ChromaKeyEraser;

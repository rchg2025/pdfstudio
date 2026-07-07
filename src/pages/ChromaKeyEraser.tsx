import React, { useState, useRef, useEffect, ChangeEvent, MouseEvent } from 'react';
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
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
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
        if (!originalImage || !currentImageData || !canvasRef.current) return;

        setIsProcessing(true);

        setTimeout(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            const width = canvas.width;
            const height = canvas.height;
            
            const imageData = new ImageData(
                new Uint8ClampedArray(currentImageData.data),
                width,
                height
            );
            const data = imageData.data;

            const maxAllowedDistance = (tolerance / 255) * 441.6;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                if (a === 0) continue;

                const distance = colorDistance(r, g, b, targetColor.r, targetColor.g, targetColor.b);

                if (distance <= maxAllowedDistance) {
                    if (softness === 0) {
                        data[i + 3] = 0;
                    } else {
                        const innerThreshold = Math.max(0, maxAllowedDistance - (softness * 2)); 
                        
                        if (distance <= innerThreshold) {
                            data[i + 3] = 0;
                        } else {
                            const range = maxAllowedDistance - innerThreshold;
                            const distInRange = distance - innerThreshold;
                            const ratio = distInRange / range;
                            data[i + 3] = Math.floor(a * ratio);
                        }
                    }
                }
            }

            ctx.putImageData(imageData, 0, 0);
            setIsProcessing(false);
        }, 10);
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
        <div className="chroma-eraser-container animate-fade-in flex flex-col h-[calc(100vh-80px)]">
            <header className="bg-white border-b py-4 px-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500 text-white p-2 rounded-lg">
                        <Eraser size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 m-0">Xóa Nền Theo Màu</h1>
                </div>
                <div>
                     <label htmlFor="imageUpload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition duration-200 flex items-center gap-2 font-medium">
                        <Upload size={18} /> Tải Ảnh Lên
                    </label>
                    <input type="file" id="imageUpload" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
            </header>

            <main className="flex-grow flex flex-col md:flex-row overflow-hidden bg-gray-100">
                
                {/* Sidebar Controls */}
                <aside className="w-full md:w-80 bg-white border-r border-gray-200 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 z-0">
                    
                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold uppercase text-gray-500 tracking-wider">1. Chọn Màu Cần Xóa</h2>
                        <p className="text-xs text-gray-400 mb-2">Click vào ảnh hoặc dùng công cụ chọn màu.</p>
                        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <input 
                                type="color" 
                                value={targetHexColor} 
                                onChange={(e) => {
                                    const rgb = hexToRgb(e.target.value);
                                    if (rgb) setTargetColor(rgb);
                                }}
                                className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent" 
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700">Màu Đã Chọn</span>
                                <span className="text-xs text-gray-500 uppercase">{targetHexColor}</span>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold uppercase text-gray-500 tracking-wider">2. Cài Đặt Xóa</h2>
                        
                        {/* Tolerance Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label htmlFor="tolerance" className="text-sm font-medium text-gray-700">Độ Dung Sai (Tolerance)</label>
                                <span className="text-sm text-blue-600 font-semibold">{tolerance}</span>
                            </div>
                            <input 
                                type="range" 
                                id="tolerance" 
                                min="0" 
                                max="255" 
                                value={tolerance} 
                                onChange={(e) => setTolerance(parseInt(e.target.value))}
                                className="w-full chroma-range" 
                            />
                            <p className="text-xs text-gray-400">Tăng lên để xóa các màu gần giống màu đã chọn.</p>
                        </div>

                        {/* Softness Slider */}
                         <div className="space-y-2">
                            <div className="flex justify-between">
                                <label htmlFor="softness" className="text-sm font-medium text-gray-700">Làm Mờ Viền (Softness)</label>
                                <span className="text-sm text-blue-600 font-semibold">{softness}</span>
                            </div>
                            <input 
                                type="range" 
                                id="softness" 
                                min="0" 
                                max="50" 
                                value={softness} 
                                onChange={(e) => setSoftness(parseInt(e.target.value))}
                                className="w-full chroma-range" 
                            />
                            <p className="text-xs text-gray-400">Giúp viền ảnh mượt mà hơn, không bị răng cưa.</p>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Actions */}
                    <div className="space-y-3 mt-auto pt-4">
                        <button onClick={removeBackground} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg shadow transition duration-200 font-medium flex items-center justify-center gap-2 border-0 cursor-pointer">
                            <Sparkles size={18} /> Áp Dụng Xóa Nền
                        </button>
                        <button onClick={handleReset} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 rounded-lg transition duration-200 font-medium flex items-center justify-center gap-2 border-0 cursor-pointer">
                            <RotateCcw size={18} /> Hoàn Tác
                        </button>
                        <button onClick={handleDownload} className="w-full bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 py-2.5 rounded-lg transition duration-200 font-medium flex items-center justify-center gap-2 mt-4 cursor-pointer">
                            <Download size={18} /> Tải Ảnh Xuống
                        </button>
                    </div>
                </aside>

                {/* Canvas Area */}
                <div className="flex-grow p-6 flex flex-col relative bg-gray-50">
                    {!originalImage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 z-10 pointer-events-none">
                            <ImageIcon size={64} className="mb-4 text-gray-300" />
                            <p className="text-lg font-medium m-0">Chưa có ảnh nào được tải lên</p>
                            <p className="text-sm mt-1">Nhấn "Tải Ảnh Lên" ở góc trên để bắt đầu</p>
                        </div>
                    )}

                    <div className="canvas-wrapper flex-grow shadow-sm">
                        {isProcessing && <div className="chroma-loader"></div>}
                        <canvas 
                            ref={canvasRef} 
                            onClick={handleCanvasClick}
                            className={`image-canvas ${!originalImage ? 'hidden' : ''}`}
                        ></canvas>
                    </div>
                    
                    <div className="text-center mt-3 text-xs text-gray-500 flex items-center justify-center gap-1">
                        <Info size={14} />
                        Click trực tiếp vào ảnh để nhanh chóng chọn màu nền cần xóa.
                    </div>
                </div>

            </main>
        </div>
    );
};

export default ChromaKeyEraser;

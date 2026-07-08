import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

export default function IdPhotoGenerator() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalBase64, setOriginalBase64] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [clothing, setClothing] = useState<string>('original');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [resultWhite, setResultWhite] = useState<string | null>(null);
  const [resultBlue, setResultBlue] = useState<string | null>(null);
  const [printingBg, setPrintingBg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Vui lòng chỉ chọn tệp hình ảnh.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setOriginalBase64(result.split(',')[1]);
      setPreviewUrl(result);
      setError(null);
      setResultWhite(null);
      setResultBlue(null);
    };
    reader.readAsDataURL(selectedFile);
  };

  const processImage = async () => {
    if (!originalBase64) {
      setError("Vui lòng tải ảnh lên trước.");
      return;
    }

    setLoading(true);
    setError(null);

    let clothingPrompt = "Keep the clothing from the original image.";
    if (clothing !== 'original') {
        clothingPrompt = `Change the clothing to ${clothing}.`;
    }

    const basePrompt = `Create a standard 3:4 ratio ID photo from the uploaded image of a ${gender} person. The person must be looking directly at the camera with a neutral, serious expression (mouth closed, not smiling). The cropping should be standard for an ID photo, showing the head and top of the shoulders. ${clothingPrompt} Maintain the original person's facial features, hair, and identity exactly. The final image should be high-resolution and professional.`;

    const promptWhiteBg = `${basePrompt} The background must be solid white (#FFFFFF).`;
    const promptBlueBg = `${basePrompt} The background must be solid royal blue (#4169E1).`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Thiếu API Key cho Gemini (VITE_GEMINI_API_KEY). Vui lòng cấu hình trên Vercel hoặc file .env");
      }

      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;

      const [whiteBgResult, blueBgResult] = await Promise.all([
          callGenerativeApi(API_URL, promptWhiteBg, originalBase64),
          callGenerativeApi(API_URL, promptBlueBg, originalBase64)
      ]);

      const whiteBgData = extractImageData(whiteBgResult);
      const blueBgData = extractImageData(blueBgResult);
      
      if (!whiteBgData || !blueBgData) {
          throw new Error("Không thể tạo ảnh. Vui lòng thử lại với ảnh khác rõ nét hơn.");
      }

      setResultWhite(`data:image/png;base64,${whiteBgData}`);
      setResultBlue(`data:image/png;base64,${blueBgData}`);

    } catch (err: any) {
      console.error("API Error:", err);
      setError(err.message || "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const callGenerativeApi = async (url: string, prompt: string, imageBase64: string, retries = 3, delay = 1000) => {
    const payload = {
        contents: [{
            parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
            ]
        }],
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
        },
    };
    
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error("API HTTP Error:", response.status, errorBody);
                throw new Error(`API trả về lỗi ${response.status}.`);
            }
            
            return await response.json();

        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
        }
    }
  };

  const extractImageData = (result: any) => {
    return result?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
  };

  const generatePrintSheet = (widthCm: number, heightCm: number, sourceSrc: string, bgType: string) => {
    setPrintingBg(`${bgType}-${widthCm}x${heightCm}`);
    const DPI = 300;
    const INCH_TO_CM = 2.54;
    
    const canvasWidth = Math.round((widthCm / INCH_TO_CM) * DPI);
    const canvasHeight = Math.round((heightCm / INCH_TO_CM) * DPI);

    // Standard ID photo size 4x6 cm
    const photoWidthCm = 4;
    const photoHeightCm = 6;
    const photoWidth = Math.round((photoWidthCm / INCH_TO_CM) * DPI);
    const photoHeight = Math.round((photoHeightCm / INCH_TO_CM) * DPI);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setPrintingBg(null);
      return;
    }
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
        const marginCm = 0.3;
        const margin = Math.round(marginCm / INCH_TO_CM * DPI); 
        
        let cols = Math.floor((canvas.width - margin) / (photoWidth + margin));
        let rows = Math.floor((canvas.height - margin) / (photoHeight + margin));
        
        const totalWidth = cols * photoWidth + (cols - 1) * margin;
        const totalHeight = rows * photoHeight + (rows - 1) * margin;
        const offsetX = (canvas.width - totalWidth) / 2;
        const offsetY = (canvas.height - totalHeight) / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let x = offsetX + c * (photoWidth + margin);
                let y = offsetY + r * (photoHeight + margin);
                ctx.drawImage(img, x, y, photoWidth, photoHeight);
            }
        }

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `in-anh-the-${bgType}-${widthCm}x${heightCm}cm.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setPrintingBg(null);
    };

    img.onerror = () => {
        setError("Không thể tải ảnh để tạo file in.");
        setPrintingBg(null);
    };

    img.src = sourceSrc;
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1rem', margin: '0 auto', maxWidth: '1200px' }}>
      <div className="text-center mb-8">
        <h1 className="text-gradient text-3xl md:text-4xl" style={{ marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>Tạo Ảnh Thẻ</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          Tải lên ảnh chân dung của bạn và AI sẽ tạo ra ảnh thẻ chuyên nghiệp nền xanh/trắng chỉ trong vài giây.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left column: Controls */}
        <div className="flex flex-col space-y-6">
          {/* Step 1 */}
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>1. Tải ảnh của bạn lên</h2>
            <div 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-[var(--primary)] bg-[var(--bg-secondary)]"
            >
              <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/png, image/jpeg" 
                onChange={handleFileChange}
              />
              
              {!previewUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <UploadCloud size={48} className="text-[var(--text-secondary)] mb-2" />
                  <p className="text-sm text-[var(--text-primary)]">
                      <span className="font-semibold text-[var(--primary)]">Nhấn để tải ảnh lên</span> hoặc kéo thả
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">PNG, JPG (tối đa 5MB)</p>
                </div>
              ) : (
                <img src={previewUrl} className="max-h-48 mx-auto rounded-lg object-contain" alt="Xem trước" />
              )}
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>2. Chọn giới tính</h2>
            <div className="flex space-x-4">
              <div 
                onClick={() => { setGender('male'); setClothing('original'); }}
                className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${gender === 'male' ? 'border-[var(--primary)] bg-[rgba(59,130,246,0.1)]' : 'border-[var(--border)] bg-white'}`}
              >
                <div className={`w-4 h-4 mr-2 border rounded-full flex items-center justify-center ${gender === 'male' ? 'border-[var(--primary)]' : 'border-gray-400'}`}>
                  {gender === 'male' && <div className="w-2 h-2 rounded-full bg-[var(--primary)]"></div>}
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">Nam</span>
              </div>
              
              <div 
                onClick={() => { setGender('female'); setClothing('original'); }}
                className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${gender === 'female' ? 'border-[var(--primary)] bg-[rgba(59,130,246,0.1)]' : 'border-[var(--border)] bg-white'}`}
              >
                <div className={`w-4 h-4 mr-2 border rounded-full flex items-center justify-center ${gender === 'female' ? 'border-[var(--primary)]' : 'border-gray-400'}`}>
                  {gender === 'female' && <div className="w-2 h-2 rounded-full bg-[var(--primary)]"></div>}
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">Nữ</span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>3. Chọn trang phục</h2>
            <div className="space-y-3">
              {[
                { value: 'original', label: 'Giữ nguyên trang phục', for: 'both' },
                { value: 'a business suit', label: 'Áo vest', for: 'both' },
                { value: 'a formal ao dai', label: 'Áo dài', for: 'female' },
                { value: 'a white collared shirt', label: 'Áo sơ mi trắng', for: 'both' },
              ].filter(c => c.for === 'both' || c.for === gender).map(option => (
                <div 
                  key={option.value} 
                  onClick={() => setClothing(option.value)}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${clothing === option.value ? 'border-[var(--primary)] bg-[rgba(59,130,246,0.1)]' : 'border-[var(--border)] bg-white'}`}
                >
                  <div className={`w-4 h-4 mr-3 border rounded-full flex items-center justify-center ${clothing === option.value ? 'border-[var(--primary)]' : 'border-gray-400'}`}>
                    {clothing === option.value && <div className="w-2 h-2 rounded-full bg-[var(--primary)]"></div>}
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{option.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={processImage}
            disabled={!originalBase64 || loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tạo ảnh thẻ...
              </>
            ) : 'Tạo Ảnh Thẻ'}
          </button>
        </div>

        {/* Right column: Results */}
        <div className="flex flex-col space-y-6">
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 className="text-lg font-semibold mb-3 text-center md:text-left" style={{ color: 'var(--text-primary)' }}>4. Xem trước và Tải về</h2>
            
            {error && (
              <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-4 text-sm text-center">
                  {error}
              </div>
            )}

            {!resultWhite && !loading && (
              <div className="flex-1 border-2 border-dashed border-[var(--border)] rounded-lg flex flex-col justify-center items-center text-center p-8 text-[var(--text-secondary)] min-h-[300px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.5c-4.25.1-7.5-2.25-7.5-5.5s3-5.5 7.5-5.5c4.15 0 7.5 2.25 7.5 5.5 0 2.25-1.5 4-4.5 5"/><path d="M12 4.5c-4.25-.1-7.5 2.25-7.5 5.5s3 5.5 7.5 5.5c4.15 0 7.5-2.25 7.5-5.5 0-2.25-1.5-4-4.5-5"/><path d="M12 4.5V1c-4.25.1-7.5 2.25-7.5 5.5S7.75 12 12 12s7.5-2.25 7.5-5.5S16.25 1.1 12 1v3.5"/><path d="M12 20.5V23c4.25-.1 7.5-2.25 7.5-5.5S16.25 12 12 12s-7.5 2.25-7.5 5.5c0 2.25 1.5 4 4.5 5v-2.5"/></svg>
                <p>Ảnh thẻ của bạn sẽ xuất hiện ở đây.</p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-8 min-h-[300px]">
                 <svg className="animate-spin h-10 w-10 text-[var(--primary)] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-[var(--text-secondary)]">AI đang xử lý, vui lòng chờ trong giây lát...<br/>(Có thể mất 10-20 giây)</p>
              </div>
            )}

            {resultWhite && resultBlue && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Trắng */}
                  <div className="text-center">
                      <div className="bg-gray-100 rounded-lg overflow-hidden aspect-[3/4] flex items-center justify-center border border-[var(--border)]">
                            <img src={resultWhite} className="w-full h-full object-cover" alt="Ảnh thẻ nền trắng" />
                      </div>
                      <a href={resultWhite} download="anh-the-nen-trang.png" className="mt-3 inline-block w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition-all text-sm">
                          Tải về
                      </a>
                      <div className="mt-3 text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-2 rounded-lg border border-[var(--border)]">
                          <span className="font-semibold block mb-1">Tạo file in (4x6cm):</span>
                          <button onClick={() => generatePrintSheet(13, 18, resultWhite, 'nen-trang')} disabled={!!printingBg} className="text-[var(--primary)] hover:underline mx-1">13x18cm</button> |
                          <button onClick={() => generatePrintSheet(20, 30, resultWhite, 'nen-trang')} disabled={!!printingBg} className="text-[var(--primary)] hover:underline mx-1">20x30cm</button>
                          {printingBg?.startsWith('nen-trang') && <span className="block mt-1 text-green-600">Đang tạo...</span>}
                      </div>
                  </div>
                  {/* Xanh */}
                  <div className="text-center">
                      <div className="bg-blue-100 rounded-lg overflow-hidden aspect-[3/4] flex items-center justify-center border border-[var(--border)]">
                            <img src={resultBlue} className="w-full h-full object-cover" alt="Ảnh thẻ nền xanh" />
                      </div>
                      <a href={resultBlue} download="anh-the-nen-xanh.png" className="mt-3 inline-block w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition-all text-sm">
                          Tải về
                      </a>
                      <div className="mt-3 text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-2 rounded-lg border border-[var(--border)]">
                          <span className="font-semibold block mb-1">Tạo file in (4x6cm):</span>
                          <button onClick={() => generatePrintSheet(13, 18, resultBlue, 'nen-xanh')} disabled={!!printingBg} className="text-[var(--primary)] hover:underline mx-1">13x18cm</button> |
                          <button onClick={() => generatePrintSheet(20, 30, resultBlue, 'nen-xanh')} disabled={!!printingBg} className="text-[var(--primary)] hover:underline mx-1">20x30cm</button>
                          {printingBg?.startsWith('nen-xanh') && <span className="block mt-1 text-green-600">Đang tạo...</span>}
                      </div>
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

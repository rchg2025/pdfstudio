import { useState } from 'react';
import { Image as ImageIcon, Sparkles, Download, Square, RectangleHorizontal, RectangleVertical, Loader2, Info } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './AiImageGenerator.css';

const RATIOS = [
  { id: '1:1', name: 'Vuông (1:1)', width: 1024, height: 1024, icon: Square },
  { id: '16:9', name: 'Ngang (16:9)', width: 1024, height: 576, icon: RectangleHorizontal },
  { id: '9:16', name: 'Dọc (9:16)', width: 576, height: 1024, icon: RectangleVertical },
];

export default function AiImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState(RATIOS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const { showAlert } = useDialogs();

  // Dịch câu lệnh Tiếng Việt sang Tiếng Anh để AI hiểu tốt nhất
  const translateToEnglish = async (text: string): Promise<string> => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data[0]) {
        return data[0].map((item: any) => item[0]).join('');
      }
    } catch (err) {
      console.error("Translation error:", err);
    }
    return text;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showAlert('Vui lòng nhập ý tưởng (prompt) để tạo ảnh.', 'Thiếu thông tin');
      return;
    }

    setIsGenerating(true);
    setImageUrl(null);

    try {
      // 1. Dịch Prompt sang Tiếng Anh
      const englishPrompt = await translateToEnglish(prompt.trim());
      
      // 2. Thêm hậu tố tối ưu cho Flux model
      const finalPrompt = `${englishPrompt}, highly detailed, masterpiece, 8k resolution, photorealistic`;

      // 3. Gọi API miễn phí (Pollinations dùng model FLUX)
      const seed = Math.floor(Math.random() * 1000000);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${ratio.width}&height=${ratio.height}&seed=${seed}&nologo=true`;

      // Tải trước ảnh để hiển thị loading mượt mà
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Máy chủ đang quá tải, vui lòng thử lại sau vài giây.');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setImageUrl(objectUrl);

    } catch (err: any) {
      console.error(err);
      showAlert(`Lỗi tạo ảnh: ${err.message}`, 'Lỗi hệ thống');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `ai_image_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="ai-image-container">
      <div className="tool-header text-center mb-8">
        <h1 className="text-gradient text-3xl mb-2">Tạo Ảnh AI (FLUX Pro)</h1>
        <p className="text-secondary">Sử dụng mô hình FLUX siêu nét, miễn phí 100% không cần cài đặt API Key.</p>
      </div>

      <div className="glass-card mb-6 bg-green-50/50 border-green-100 p-4 rounded-xl flex gap-3 text-sm text-green-800">
        <Info className="shrink-0 mt-0.5" size={20} />
        <div>
          <strong>Đã loại bỏ API Key:</strong> Trải nghiệm tạo ảnh giờ đây là tự động hoàn toàn. Bất kỳ ai truy cập website của bạn cũng có thể gõ Tiếng Việt và tạo ảnh ngay lập tức mà không bao giờ gặp lỗi 403 Forbidden!
        </div>
      </div>

      <div className="glass-card">
        <div className="ai-image-layout">
          
          {/* CỘT TRÁI: NHẬP LIỆU */}
          <div className="ai-image-section">
            
            <div className="ai-input-group">
              <label><Sparkles size={18} className="text-primary" /> Ý tưởng của bạn (Prompt):</label>
              <textarea 
                className="ai-textarea"
                style={{ minHeight: '120px' }}
                placeholder="Mô tả bức ảnh bạn muốn vẽ bằng Tiếng Việt. Ví dụ: Tạo ảnh bìa fanpage Facebook, chủ đề công nghệ tương lai..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="ai-input-group mt-6">
              <label>Tỉ lệ ảnh:</label>
              <div className="ai-ratio-grid">
                {RATIOS.map(r => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      className={`ai-ratio-btn ${ratio.id === r.id ? 'active' : ''}`}
                      onClick={() => setRatio(r)}
                    >
                      <Icon size={24} />
                      <span className="text-sm">{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              className="btn btn-primary flex items-center justify-center w-full py-3 px-6 mt-8 shadow-lg"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><Loader2 className="animate-spin mr-2" size={20} /> Đang vẽ ảnh (Mất khoảng 10 giây)...</>
              ) : (
                <><ImageIcon className="mr-2" size={20} /> Tạo Ảnh AI Ngay</>
              )}
            </button>
          </div>

          {/* CỘT PHẢI: KẾT QUẢ */}
          <div className="ai-image-section">
            <div className={`ai-result ${imageUrl ? 'has-image' : ''}`}>
              {!imageUrl && !isGenerating && (
                <div className="text-center text-gray-400 flex flex-col items-center gap-3 p-4">
                  <ImageIcon size={48} className="opacity-50" />
                  <p>Bức tranh của bạn sẽ xuất hiện ở đây.</p>
                </div>
              )}

              {isGenerating && (
                <div className="w-full flex flex-col items-center gap-6 p-4">
                  <div className="text-primary font-bold text-lg flex items-center gap-2">
                    <Loader2 className="animate-spin" size={24} />
                    AI đang phân tích và vẽ...
                  </div>
                  <div className="w-full max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }}></div>
                  </div>
                </div>
              )}

              {imageUrl && !isGenerating && (
                <div className="flex flex-col items-center gap-4 w-full animate-fade-in p-2">
                  <img src={imageUrl} alt="AI Generated" className="ai-generated-image" />
                  <button 
                    className="btn btn-secondary flex items-center gap-2"
                    onClick={downloadImage}
                  >
                    <Download size={18} /> Tải Ảnh Xuống
                  </button>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

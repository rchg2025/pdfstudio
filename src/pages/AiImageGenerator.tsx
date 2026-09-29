import { useState } from 'react';
import { Image as ImageIcon, Sparkles, Download, Square, RectangleHorizontal, RectangleVertical, Loader2 } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './AiImageGenerator.css';

const RATIOS = [
  { id: '1:1', name: 'Vuông (1:1)', width: 1024, height: 1024, icon: Square },
  { id: '16:9', name: 'Ngang (16:9)', width: 1024, height: 576, icon: RectangleHorizontal },
  { id: '9:16', name: 'Dọc (9:16)', width: 576, height: 1024, icon: RectangleVertical },
];

const MODELS = [
  { id: 'flux', name: 'Flux (Mặc định - Cân bằng)' },
  { id: 'flux-realism', name: 'Flux Realism (Tả thực)' },
  { id: 'flux-3d', name: 'Flux 3D (Đồ họa 3D)' },
  { id: 'flux-anime', name: 'Flux Anime (Hoạt hình)' },
  { id: 'turbo', name: 'Turbo (Tốc độ cao)' }
];

export default function AiImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState(RATIOS[0]);
  const [model, setModel] = useState(MODELS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const { showAlert } = useDialogs();

  const translateToEnglish = async (text: string): Promise<string> => {
    try {
      // Very basic heuristic: if it contains a lot of typical English words, maybe skip, 
      // but translating won't hurt much. To be safe, just translate vi -> en.
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
      // Automatically translate Vietnamese prompt to English for better AI understanding
      const englishPrompt = await translateToEnglish(prompt.trim());
      
      const encodedPrompt = encodeURIComponent(englishPrompt);
      const seed = Math.floor(Math.random() * 1000000);
      const targetUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${ratio.width}&height=${ratio.height}&seed=${seed}&nologo=true&model=${model.id}`;

      // Fetch the image as a blob to show loading state properly and allow downloading
      const response = await fetch(targetUrl);
      
      if (!response.ok) {
        throw new Error('Lỗi từ máy chủ AI. Vui lòng thử lại sau.');
      }

      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      setImageUrl(localUrl);

    } catch (err: any) {
      console.error(err);
      showAlert(`Lỗi khi tạo ảnh: ${err.message}`, 'Lỗi hệ thống');
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
        <h1 className="text-gradient text-3xl mb-2">Tạo Ảnh AI Từ Văn Bản</h1>
        <p className="text-secondary">Chuyển đổi ý tưởng của bạn thành hình ảnh tuyệt đẹp bằng công nghệ AI tiên tiến, hoàn toàn miễn phí.</p>
      </div>

      <div className="glass-card">
        <div className="ai-image-layout">
          
          {/* CỘT TRÁI: NHẬP LIỆU */}
          <div className="ai-image-section">
            <div className="ai-input-group">
              <label><Sparkles size={18} className="text-primary" /> Ý tưởng của bạn (Prompt):</label>
              <textarea 
                className="ai-textarea"
                placeholder="Ví dụ: A futuristic city with flying cars at sunset, cyberpunk style, hyper realistic..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <p className="text-xs text-gray-500">* Hệ thống sẽ tự động dịch câu lệnh của bạn sang tiếng Anh để AI hiểu chính xác nhất. (Lưu ý: AI không giỏi viết văn bản/chữ dài vào trong hình).</p>
            </div>

            <div className="ai-input-group mt-2">
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

            <div className="ai-input-group mt-2">
              <label>Mô hình AI (Kiểu vẽ):</label>
              <select 
                className="ai-textarea" 
                style={{ minHeight: 'auto', padding: '0.75rem', cursor: 'pointer' }}
                value={model.id}
                onChange={(e) => setModel(MODELS.find(m => m.id === e.target.value) || MODELS[0])}
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <button 
              className="btn btn-primary flex items-center justify-center w-full py-3 px-6 mt-4 shadow-lg"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><Loader2 className="animate-spin mr-2" size={20} /> Đang vẽ ảnh...</>
              ) : (
                <><ImageIcon className="mr-2" size={20} /> Tạo Ảnh AI Ngay</>
              )}
            </button>
          </div>

          {/* CỘT PHẢI: KẾT QUẢ */}
          <div className="ai-image-section">
            <div className={`ai-result ${imageUrl ? 'has-image' : ''}`}>
              {!imageUrl && !isGenerating && (
                <div className="text-center text-gray-400 flex flex-col items-center gap-3">
                  <ImageIcon size={48} className="opacity-50" />
                  <p>Bức tranh của bạn sẽ xuất hiện ở đây.</p>
                </div>
              )}

              {isGenerating && (
                <div className="w-full flex flex-col items-center gap-6">
                  <div className="text-primary font-bold text-lg flex items-center gap-2">
                    <Loader2 className="animate-spin" size={24} />
                    AI đang sáng tác...
                  </div>
                  <div className="w-full max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }}></div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">Quá trình này thường mất khoảng 5-10 giây.</p>
                </div>
              )}

              {imageUrl && !isGenerating && (
                <div className="flex flex-col items-center gap-4 w-full animate-fade-in">
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

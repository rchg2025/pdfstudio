import { useState, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, Download, Square, RectangleHorizontal, RectangleVertical, Loader2, KeyRound, Info } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './AiImageGenerator.css';

const RATIOS = [
  { id: '1:1', name: 'Vuông (1:1)', width: 1024, height: 1024, icon: Square },
  { id: '16:9', name: 'Ngang (16:9)', width: 1024, height: 576, icon: RectangleHorizontal },
  { id: '9:16', name: 'Dọc (9:16)', width: 576, height: 1024, icon: RectangleVertical },
];

const MODELS = [
  { id: 'black-forest-labs/FLUX.1-schnell', name: 'FLUX.1 Schnell (Nhanh, Siêu nét)' },
  { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'Stable Diffusion XL (Nghệ thuật)' },
  { id: 'prompthero/openjourney', name: 'OpenJourney (Phong cách Midjourney)' }
];

export default function AiImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState(RATIOS[0]);
  const [model, setModel] = useState(MODELS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // API Key State
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  
  const { showAlert } = useDialogs();

  useEffect(() => {
    const savedKey = localStorage.getItem('hf_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setShowKeyInput(true);
    }
  }, []);

  const saveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('hf_api_key', key);
  };

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
    return text; // Fallback
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      showAlert('Vui lòng nhập Hugging Face Access Token để sử dụng tính năng này.', 'Thiếu API Key');
      setShowKeyInput(true);
      return;
    }

    if (!prompt.trim()) {
      showAlert('Vui lòng nhập ý tưởng (prompt) để tạo ảnh.', 'Thiếu thông tin');
      return;
    }

    setIsGenerating(true);
    setImageUrl(null);

    try {
      // Dịch sang Tiếng Anh để model hiểu tốt nhất
      const englishPrompt = await translateToEnglish(prompt.trim());
      
      const response = await fetch(`https://api-inference.huggingface.co/models/${model.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: englishPrompt,
          parameters: {
            width: ratio.width,
            height: ratio.height
          }
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API Key không hợp lệ. Vui lòng kiểm tra lại Token của bạn.');
        } else if (response.status === 503) {
          throw new Error('Mô hình AI đang khởi động, vui lòng thử lại sau 30 giây.');
        }
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
        <h1 className="text-gradient text-3xl mb-2">Tạo Ảnh AI (Hugging Face)</h1>
        <p className="text-secondary">Sử dụng các mô hình AI mã nguồn mở tốt nhất thế giới như FLUX.1 và Stable Diffusion XL.</p>
      </div>

      <div className="glass-card mb-6">
        <div className="p-4 bg-white/50 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <KeyRound size={18} className="text-primary" />
              Cấu hình API Key (Bắt buộc)
            </h3>
            <button 
              className="text-sm text-primary hover:underline"
              onClick={() => setShowKeyInput(!showKeyInput)}
            >
              {showKeyInput ? 'Ẩn cấu hình' : 'Hiện cấu hình'}
            </button>
          </div>
          
          {showKeyInput && (
            <div className="animate-fade-in space-y-3 text-sm text-gray-600">
              <div className="p-3 bg-blue-50 text-blue-800 rounded-lg flex gap-3">
                <Info className="shrink-0 mt-0.5" size={18} />
                <p>
                  API của <strong>Google Gemini (bản miễn phí) hiện tại CHƯA hỗ trợ xuất ra hình ảnh</strong>.
                  Giải pháp mạnh mẽ nhất hiện nay là dùng API của <strong>Hugging Face</strong>. Nó hoàn toàn miễn phí và cho phép bạn dùng mô hình FLUX.1.
                </p>
              </div>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Truy cập <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline">Hugging Face Tokens</a> (Tạo tài khoản nếu chưa có).</li>
                <li>Tạo một <strong>Access Token</strong> mới (loại Read).</li>
                <li>Dán Token vào ô bên dưới. Chìa khóa sẽ được lưu an toàn trên trình duyệt của bạn.</li>
              </ol>
              <input
                type="password"
                className="ai-textarea mt-2"
                style={{ minHeight: '40px', padding: '0.75rem' }}
                placeholder="Ví dụ: hf_xxxx..."
                value={apiKey}
                onChange={(e) => saveKey(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="glass-card">
        <div className="ai-image-layout">
          
          {/* CỘT TRÁI: NHẬP LIỆU */}
          <div className="ai-image-section">
            <div className="ai-input-group">
              <label><Sparkles size={18} className="text-primary" /> Ý tưởng của bạn (Prompt Tiếng Việt):</label>
              <textarea 
                className="ai-textarea"
                placeholder="Ví dụ: Một thành phố tương lai rực rỡ ánh đèn neon dưới trời mưa..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <p className="text-xs text-gray-500">* Lời khuyên: AI chuyên vẽ phong cảnh, đồ vật, con người... Hãy dùng phần mềm ghép chữ sau khi đã có ảnh thay vì ép AI viết chữ.</p>
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

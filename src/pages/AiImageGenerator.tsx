import { useState, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, Download, Square, RectangleHorizontal, RectangleVertical, Loader2, KeyRound, Settings2 } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './AiImageGenerator.css';

const RATIOS = [
  { id: '1:1', name: 'Vuông (1:1)', width: 1024, height: 1024, icon: Square, aspect: '1:1' },
  { id: '16:9', name: 'Ngang (16:9)', width: 1024, height: 576, icon: RectangleHorizontal, aspect: '16:9' },
  { id: '9:16', name: 'Dọc (9:16)', width: 576, height: 1024, icon: RectangleVertical, aspect: '9:16' },
];

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini (Imagen 3)', desc: 'Mô hình tạo ảnh chính chủ từ Google, hỗ trợ xuất ảnh chân thực và chữ siêu việt.' },
  { id: 'huggingface', name: 'Hugging Face (FLUX.1)', desc: 'Nền tảng mã nguồn mở, dùng FLUX.1 mạnh mẽ và hoàn toàn miễn phí.' }
];

export default function AiImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState(RATIOS[0]);
  const [provider, setProvider] = useState(PROVIDERS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // API Key State
  const [geminiKey, setGeminiKey] = useState('');
  const [hfKey, setHfKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  
  const { showAlert } = useDialogs();

  useEffect(() => {
    const savedGemini = localStorage.getItem('gemini_api_key');
    const savedHf = localStorage.getItem('hf_api_key');
    if (savedGemini) setGeminiKey(savedGemini);
    if (savedHf) setHfKey(savedHf);
    
    if (!savedGemini && !savedHf) {
      setShowKeyInput(true);
    }
  }, []);

  const saveGeminiKey = (key: string) => {
    setGeminiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const saveHfKey = (key: string) => {
    setHfKey(key);
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
    return text;
  };

  const generateWithGemini = async (finalPrompt: string) => {
    if (!geminiKey.trim()) {
      setShowKeyInput(true);
      throw new Error('Bạn chưa nhập API Key của Google Gemini!');
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-goog-api-key': geminiKey.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          { prompt: finalPrompt }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: ratio.aspect
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (response.status === 400 || response.status === 403) {
        throw new Error(errorData?.error?.message || 'API Key không hợp lệ, hoặc tài khoản của bạn không được cấp quyền dùng Imagen 3.');
      }
      throw new Error('Lỗi từ máy chủ Google: ' + (errorData?.error?.message || response.statusText));
    }

    const data = await response.json();
    if (data.predictions && data.predictions.length > 0) {
      const base64Img = data.predictions[0].bytesBase64Encoded || data.predictions[0];
      if (typeof base64Img === 'string') {
        const prefix = base64Img.startsWith('iVBORw') ? 'image/png' : 'image/jpeg';
        return `data:${prefix};base64,${base64Img}`;
      }
    }
    throw new Error('Không nhận được ảnh trả về từ Google.');
  };

  const generateWithHuggingFace = async (finalPrompt: string) => {
    if (!hfKey.trim()) {
      setShowKeyInput(true);
      throw new Error('Bạn chưa nhập Access Token của Hugging Face!');
    }

    const response = await fetch(`https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: finalPrompt,
        parameters: {
          width: ratio.width,
          height: ratio.height
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Token Hugging Face không hợp lệ.');
      if (response.status === 503) throw new Error('Mô hình đang khởi động, vui lòng thử lại sau 30 giây.');
      throw new Error('Lỗi từ máy chủ Hugging Face.');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showAlert('Vui lòng nhập ý tưởng (prompt) để tạo ảnh.', 'Thiếu thông tin');
      return;
    }

    setIsGenerating(true);
    setImageUrl(null);

    try {
      let resultUrl = '';
      
      if (provider === 'gemini') {
        // Gemini Imagen 3 hiểu rất tốt tiếng Việt, nhưng dịch ra tiếng Anh vẫn tốt hơn nếu từ vựng quá khó.
        // Tuy nhiên để chân thật theo yêu cầu của bạn, sẽ dùng thẳng prompt người dùng nhập.
        resultUrl = await generateWithGemini(prompt.trim());
      } else {
        // Hugging Face Models (FLUX) cần tiếng Anh
        const englishPrompt = await translateToEnglish(prompt.trim());
        resultUrl = await generateWithHuggingFace(englishPrompt);
      }
      
      setImageUrl(resultUrl);
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
        <h1 className="text-gradient text-3xl mb-2">Tạo Ảnh AI Chuyên Nghiệp</h1>
        <p className="text-secondary">Tích hợp trực tiếp 2 siêu trí tuệ nhân tạo: Google Gemini (Imagen 3) và Hugging Face (FLUX.1)</p>
      </div>

      <div className="glass-card mb-6">
        <div className="p-4 bg-white/50 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <KeyRound size={18} className="text-primary" />
              Cấu hình API Key (Bắt buộc)
            </h3>
            <button 
              className="text-sm text-primary hover:underline flex items-center gap-1"
              onClick={() => setShowKeyInput(!showKeyInput)}
            >
              <Settings2 size={16} />
              {showKeyInput ? 'Thu gọn' : 'Thiết lập'}
            </button>
          </div>
          
          {showKeyInput && (
            <div className="animate-fade-in space-y-4 text-sm text-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* GEMINI KEY */}
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">1. Google Gemini API Key</h4>
                  <p className="text-xs text-gray-600 mb-3">Lấy tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>. (Sử dụng model Imagen 3 mới nhất).</p>
                  <input
                    type="password"
                    className="ai-textarea bg-white"
                    style={{ minHeight: '40px', padding: '0.5rem' }}
                    placeholder="Nhập API Key bắt đầu bằng AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => saveGeminiKey(e.target.value)}
                  />
                </div>

                {/* HUGGING FACE KEY */}
                <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">2. Hugging Face Access Token</h4>
                  <p className="text-xs text-gray-600 mb-3">Lấy tại <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="text-yellow-600 hover:underline">Hugging Face Settings</a>. (Sử dụng model FLUX.1).</p>
                  <input
                    type="password"
                    className="ai-textarea bg-white"
                    style={{ minHeight: '40px', padding: '0.5rem' }}
                    placeholder="Nhập Token bắt đầu bằng hf_..."
                    value={hfKey}
                    onChange={(e) => saveHfKey(e.target.value)}
                  />
                </div>

              </div>
              <p className="text-xs text-gray-400 italic text-center">* Các API Key được lưu trữ an toàn ngay trên trình duyệt của bạn và không bao giờ gửi đi nơi khác (trừ khi gọi đến chính API của AI).</p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card">
        <div className="ai-image-layout">
          
          {/* CỘT TRÁI: NHẬP LIỆU */}
          <div className="ai-image-section">
            
            <div className="ai-input-group">
              <label>Công cụ AI:</label>
              <div className="flex flex-col gap-2">
                {PROVIDERS.map(p => (
                  <label key={p.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${provider === p.id ? 'bg-primary/5 border-primary' : 'hover:bg-gray-50 border-gray-200'}`}>
                    <input 
                      type="radio" 
                      name="provider" 
                      value={p.id}
                      checked={provider === p.id}
                      onChange={(e) => setProvider(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="ai-input-group mt-4">
              <label><Sparkles size={18} className="text-primary" /> Ý tưởng của bạn (Prompt):</label>
              <textarea 
                className="ai-textarea"
                placeholder={provider === 'gemini' ? "Mô tả bức ảnh bạn muốn vẽ bằng Tiếng Việt (Ví dụ: Một chú chó pug đội nón phi hành gia...)" : "Ví dụ: Một thành phố tương lai rực rỡ ánh đèn neon dưới trời mưa..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
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

            <button 
              className="btn btn-primary flex items-center justify-center w-full py-3 px-6 mt-6 shadow-lg"
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
                <div className="text-center text-gray-400 flex flex-col items-center gap-3 p-4">
                  <ImageIcon size={48} className="opacity-50" />
                  <p>Bức tranh của bạn sẽ xuất hiện ở đây.</p>
                </div>
              )}

              {isGenerating && (
                <div className="w-full flex flex-col items-center gap-6 p-4">
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

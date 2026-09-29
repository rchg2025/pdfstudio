import { useState, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, Download, Square, RectangleHorizontal, RectangleVertical, Loader2, KeyRound, Settings2, Check } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './AiImageGenerator.css';

const RATIOS = [
  { id: '1:1', name: 'Vuông (1:1)', width: 1024, height: 1024, icon: Square, aspect: '1:1' },
  { id: '16:9', name: 'Ngang (16:9)', width: 1024, height: 576, icon: RectangleHorizontal, aspect: '16:9' },
  { id: '9:16', name: 'Dọc (9:16)', width: 576, height: 1024, icon: RectangleVertical, aspect: '9:16' },
];

export default function AiImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState(RATIOS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // API Key State
  const [geminiKey, setGeminiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isKeySaved, setIsKeySaved] = useState(false);
  
  const { showAlert } = useDialogs();

  useEffect(() => {
    const savedGemini = localStorage.getItem('gemini_api_key');
    if (savedGemini) {
      setGeminiKey(savedGemini);
      setIsKeySaved(true);
    } else {
      setShowKeyInput(true);
    }
  }, []);

  const saveGeminiKey = () => {
    if (!geminiKey.trim()) {
      showAlert('Vui lòng nhập API Key trước khi lưu.', 'Lỗi');
      return;
    }
    localStorage.setItem('gemini_api_key', geminiKey.trim());
    setIsKeySaved(true);
    setShowKeyInput(false);
    showAlert('Đã lưu Google Gemini API Key thành công vào trình duyệt!', 'Thành công');
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
      if (response.status === 403) {
        throw new Error('Google từ chối quyền truy cập (Lỗi 403). Tài khoản Google AI Studio của bạn chưa được cấp quyền dùng Imagen 3, hoặc Google yêu cầu tài khoản phải bật Thanh toán (Billing) cho dự án này.');
      }
      if (response.status === 400) {
        throw new Error(errorData?.error?.message || 'Lỗi dữ liệu gửi lên. Hoặc API Key không hợp lệ.');
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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showAlert('Vui lòng nhập ý tưởng (prompt) để tạo ảnh.', 'Thiếu thông tin');
      return;
    }

    setIsGenerating(true);
    setImageUrl(null);

    try {
      const resultUrl = await generateWithGemini(prompt.trim());
      setImageUrl(resultUrl);
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
    a.download = `gemini_image_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="ai-image-container">
      <div className="tool-header text-center mb-8">
        <h1 className="text-gradient text-3xl mb-2">Tạo Ảnh AI (Google Gemini)</h1>
        <p className="text-secondary">Sử dụng mô hình Imagen 3 chính chủ từ Google để tạo ra các bức ảnh chân thực nhất.</p>
      </div>

      <div className="glass-card mb-6">
        <div className="p-4 bg-white/50 rounded-xl">
          <div className="flex justify-between items-center">
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
            <div className="animate-fade-in mt-4 text-sm text-gray-700">
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg max-w-2xl mx-auto">
                <h4 className="font-semibold text-blue-800 mb-2">Google Gemini API Key</h4>
                <p className="text-xs text-gray-600 mb-3">Lấy tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">Google AI Studio</a>. Yêu cầu dự án đã được cấp quyền truy cập Imagen 3.</p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    className="ai-textarea bg-white flex-1"
                    style={{ minHeight: '42px', padding: '0.5rem 0.75rem' }}
                    placeholder="Nhập API Key bắt đầu bằng AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => {
                      setGeminiKey(e.target.value);
                      setIsKeySaved(false);
                    }}
                  />
                  <button 
                    className={`btn px-6 flex items-center gap-2 ${isKeySaved ? 'bg-green-500 hover:bg-green-600 text-white' : 'btn-primary'}`}
                    onClick={saveGeminiKey}
                  >
                    {isKeySaved ? <><Check size={18} /> Đã Lưu</> : 'Lưu Key'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 italic text-center mt-3">* Key được lưu trữ an toàn ngay trên trình duyệt của bạn và không bao giờ gửi đi nơi khác.</p>
            </div>
          )}
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
                placeholder="Mô tả bức ảnh bạn muốn vẽ bằng Tiếng Việt (Ví dụ: Một chú chó pug đội nón phi hành gia...)"
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
                <><Loader2 className="animate-spin mr-2" size={20} /> Đang vẽ ảnh...</>
              ) : (
                <><ImageIcon className="mr-2" size={20} /> Tạo Ảnh Bằng Gemini</>
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
                    Gemini đang sáng tác...
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

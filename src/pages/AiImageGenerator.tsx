import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Sparkles, Download, Square, RectangleHorizontal, RectangleVertical, Loader2, Info } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './AiImageGenerator.css';

const RATIOS = [
  { id: '1:1', name: 'Vuông (1:1)', width: 512, height: 512, icon: Square },
  { id: '16:9', name: 'Ngang (16:9)', width: 768, height: 432, icon: RectangleHorizontal },
  { id: '9:16', name: 'Dọc (9:16)', width: 432, height: 768, icon: RectangleVertical },
];

const MODELS = [
  { id: 'Deliberate', name: 'Deliberate (Cân bằng & Tả thực)' },
  { id: 'Dreamshaper', name: 'Dreamshaper (Nghệ thuật)' },
  { id: 'Anything Diffusion', name: 'Anything (Anime/Manga)' },
  { id: 'stable_diffusion', name: 'Stable Diffusion (Mặc định)' }
];

export default function AiImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState(RATIOS[0]);
  const [model, setModel] = useState(MODELS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  
  const { showAlert } = useDialogs();
  const pollInterval = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

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
    setStatusMsg('Đang dịch câu lệnh và khởi tạo...');

    try {
      const englishPrompt = await translateToEnglish(prompt.trim());
      
      // Step 1: Submit to AI Horde (Stable Horde)
      const submitRes = await fetch('https://stablehorde.net/api/v2/generate/async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '0000000000' // Anonymous key (Free & Unlimited)
        },
        body: JSON.stringify({
          prompt: englishPrompt,
          params: {
            width: ratio.width,
            height: ratio.height,
            steps: 25,
            sampler_name: "k_euler_a"
          },
          censor_nsfw: true,
          models: [model.id]
        })
      });

      if (!submitRes.ok) {
        throw new Error('Không thể kết nối đến máy chủ vẽ ảnh.');
      }

      const submitData = await submitRes.json();
      const jobId = submitData.id;

      if (!jobId) {
        throw new Error('Không nhận được ID tiến trình.');
      }

      // Step 2: Poll status
      pollInterval.current = setInterval(async () => {
        try {
          const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${jobId}`, {
            headers: { 'apikey': '0000000000' }
          });
          const checkData = await checkRes.json();

          if (checkData.done) {
            clearInterval(pollInterval.current);
            setStatusMsg('Đã vẽ xong! Đang tải ảnh về...');
            
            // Step 3: Fetch result
            const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${jobId}`, {
              headers: { 'apikey': '0000000000' }
            });
            const statusData = await statusRes.json();
            
            if (statusData.generations && statusData.generations.length > 0) {
              setImageUrl(statusData.generations[0].img);
            } else {
              throw new Error('Máy chủ không trả về ảnh. Hãy thử lại.');
            }
            setIsGenerating(false);
          } else {
            setStatusMsg(`Đang xếp hàng (Vị trí: ${checkData.queue_position}). Thời gian chờ: ~${checkData.wait_time}s...`);
          }
        } catch (pollErr) {
          console.error(pollErr);
          // Don't kill the interval on a single failed fetch, might just be network blip
        }
      }, 5000);

    } catch (err: any) {
      console.error(err);
      if (pollInterval.current) clearInterval(pollInterval.current);
      showAlert(`Lỗi khi tạo ảnh: ${err.message}`, 'Lỗi hệ thống');
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    try {
      // Proxy fetch to avoid CORS issues when downloading external S3 URL
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai_image_${Date.now()}.webp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback
      const a = document.createElement('a');
      a.href = imageUrl;
      a.target = '_blank';
      a.download = `ai_image_${Date.now()}.webp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="ai-image-container">
      <div className="tool-header text-center mb-8">
        <h1 className="text-gradient text-3xl mb-2">Tạo Ảnh AI (AI Horde)</h1>
        <p className="text-secondary">Sử dụng mạng lưới cộng đồng AI mở để tạo ảnh miễn phí và không giới hạn dung lượng.</p>
      </div>

      <div className="glass-card mb-6 bg-blue-50/50 border-blue-100 p-4 rounded-xl flex gap-3 text-sm text-blue-800">
        <Info className="shrink-0 mt-0.5" size={20} />
        <div>
          <strong>Hệ thống mới (AI Horde):</strong> Đã chuyển sang máy chủ mới hoàn toàn miễn phí và không giới hạn số lượt tạo ảnh.
          Vì đây là mạng lưới cộng đồng (như torrent) nên sẽ tốn thời gian "Xếp hàng" từ 30 giây đến vài phút tùy thời điểm. Hãy kiên nhẫn chờ đợi kết quả nhé!
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
                placeholder="Ví dụ: A majestic lion with a glowing mane in a cyberpunk city..."
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
                <><Loader2 className="animate-spin mr-2" size={20} /> Đang xử lý...</>
              ) : (
                <><ImageIcon className="mr-2" size={20} /> Vẽ Ảnh Ngay</>
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
                    {statusMsg}
                  </div>
                  <div className="w-full max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }}></div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">Xin đừng tắt trình duyệt, ảnh sẽ tự hiện ra khi hoàn tất.</p>
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

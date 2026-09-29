import { useState } from 'react';
import { Image as ImageIcon, Sparkles, ExternalLink, Square, RectangleHorizontal, RectangleVertical, Info } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './AiImageGenerator.css';

const RATIOS = [
  { id: '1:1', name: 'Vuông (1:1)', width: 1024, height: 1024, icon: Square, promptExt: '' },
  { id: '16:9', name: 'Ngang (16:9)', width: 1024, height: 576, icon: RectangleHorizontal, promptExt: ', aspect ratio 16:9, wide landscape' },
  { id: '9:16', name: 'Dọc (9:16)', width: 576, height: 1024, icon: RectangleVertical, promptExt: ', aspect ratio 9:16, tall portrait' },
];

export default function AiImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState(RATIOS[0]);
  
  const { showAlert } = useDialogs();

  const handleGenerate = () => {
    if (!prompt.trim()) {
      showAlert('Vui lòng nhập ý tưởng (prompt) để tạo ảnh.', 'Thiếu thông tin');
      return;
    }

    // Combine prompt with ratio instruction
    const finalPrompt = prompt.trim() + ratio.promptExt;
    
    // URL encode the prompt
    const encodedPrompt = encodeURIComponent(finalPrompt);
    
    // Bing Image Creator URL
    const targetUrl = `https://www.bing.com/images/create?q=${encodedPrompt}`;

    // Open in new tab
    window.open(targetUrl, '_blank');
  };

  return (
    <div className="ai-image-container">
      <div className="tool-header text-center mb-8">
        <h1 className="text-gradient text-3xl mb-2">Tạo Ảnh AI (Bing DALL-E 3)</h1>
        <p className="text-secondary">Sử dụng sức mạnh của Microsoft Designer (DALL-E 3) để vẽ ảnh siêu nét và hỗ trợ Tiếng Việt.</p>
      </div>

      <div className="glass-card mb-6 bg-blue-50/50 border-blue-100 p-4 rounded-xl flex gap-3 text-sm text-blue-800">
        <Info className="shrink-0 mt-0.5" size={20} />
        <div>
          <strong>Công nghệ Microsoft DALL-E 3:</strong> Mô hình AI tốt nhất hiện nay, có thể hiểu xuất sắc Tiếng Việt và viết chính xác chữ lên hình ảnh! Yêu cầu bạn phải đăng nhập tài khoản Microsoft (Outlook/Hotmail) để sử dụng miễn phí mỗi ngày.
        </div>
      </div>

      <div className="glass-card">
        <div className="ai-image-layout max-w-3xl mx-auto" style={{ gridTemplateColumns: '1fr' }}>
          
          <div className="ai-image-section">
            <div className="ai-input-group">
              <label><Sparkles size={18} className="text-primary" /> Ý tưởng của bạn (Prompt):</label>
              <textarea 
                className="ai-textarea"
                style={{ minHeight: '120px' }}
                placeholder="Ví dụ: Tạo infographic giáo dục tỷ lệ 16:9, tiêu đề lớn 'CÁC THIẾT LẬP QUAN TRỌNG KHI IN'. Minh họa cửa sổ Print..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">* Mẹo: Khác với các AI khác, Bing DALL-E 3 hiểu Tiếng Việt rất tốt. Bạn cứ tự nhiên miêu tả chi tiết những gì muốn vẽ nhé.</p>
            </div>

            <div className="ai-input-group mt-6">
              <label>Gợi ý Tỉ lệ ảnh (Tùy chọn):</label>
              <div className="ai-ratio-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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

            <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-100 text-center">
              <ImageIcon size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Chuyển hướng đến Microsoft Bing</h3>
              <p className="text-sm text-gray-500 mb-6">Câu lệnh của bạn sẽ được điền tự động. Bạn chỉ cần bấm "Tạo" (Create) trên trang web của Bing.</p>
              
              <button 
                className="btn btn-primary flex items-center justify-center w-full max-w-md mx-auto py-3 px-6 shadow-lg hover:-translate-y-1 transition-transform"
                onClick={handleGenerate}
              >
                <ExternalLink className="mr-2" size={20} /> Mở Bing Image Creator Ngay
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

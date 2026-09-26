import { useState, useEffect } from 'react';
import { Play, Square, Settings2, Mic, Volume2 } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './TextToSpeech.css';

export default function TextToSpeech() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { showAlert } = useDialogs();

  // Load danh sách giọng đọc từ trình duyệt
  useEffect(() => {
    const loadVoices = () => {
      let availableVoices = window.speechSynthesis.getVoices();
      
      // Sắp xếp: Ưu tiên giọng tiếng Việt (vi-VN) lên đầu
      availableVoices.sort((a, b) => {
        if (a.lang.includes('vi') && !b.lang.includes('vi')) return -1;
        if (!a.lang.includes('vi') && b.lang.includes('vi')) return 1;
        return 0;
      });

      setVoices(availableVoices);

      // Mặc định chọn giọng tiếng Việt nếu có
      if (availableVoices.length > 0 && !selectedVoice) {
        const viVoice = availableVoices.find(v => v.lang.includes('vi'));
        setSelectedVoice(viVoice ? viVoice.name : availableVoices[0].name);
      }
    };

    loadVoices();
    // Chrome cần sự kiện này để load danh sách voice asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  const handlePlay = () => {
    if (!text.trim()) {
      showAlert('Vui lòng nhập văn bản cần đọc.', 'Thiếu thông tin');
      return;
    }

    // Dừng âm thanh đang phát (nếu có)
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voiceToUse = voices.find(v => v.name === selectedVoice);
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  // Hủy âm thanh khi rời khỏi trang
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="tts-container">
      <div className="tool-header text-center mb-8">
        <h1 className="text-gradient text-3xl mb-2">Đọc Văn Bản (Web Speech)</h1>
        <p className="text-secondary">Chuyển đổi văn bản thành giọng nói trực tiếp bằng bộ máy của trình duyệt, không cần server.</p>
      </div>

      <div className="glass-card">
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors"
          >
            <Settings2 size={16} /> Tùy chỉnh giọng đọc
          </button>
        </div>

        {showSettings && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn giọng đọc (System Voices):</label>
              <select 
                value={selectedVoice} 
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang}) {v.default ? ' - Mặc định' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tốc độ đọc: {rate}x
                </label>
                <input 
                  type="range" 
                  min="0.5" max="2" step="0.1" 
                  value={rate} 
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Độ thanh/trầm (Pitch): {pitch}
                </label>
                <input 
                  type="range" 
                  min="0" max="2" step="0.1" 
                  value={pitch} 
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        <div className="tts-layout">
          {/* CỘT TRÁI: NHẬP LIỆU */}
          <div className="tts-section">
            <div className="tts-input-group">
              <label><Mic size={18} /> Nhập văn bản cần đọc</label>
              <textarea 
                className="tts-textarea"
                placeholder="Ví dụ: Xin chào, đây là tính năng đọc văn bản tích hợp sẵn trên trình duyệt..."
                value={text}
                onChange={e => setText(e.target.value)}
              ></textarea>
            </div>

            <div className="flex gap-2">
              <button 
                className="btn-primary flex items-center justify-center flex-1 py-3"
                onClick={handlePlay}
                disabled={isPlaying}
              >
                <Play className="mr-2" size={20} /> Phát Âm Thanh
              </button>
              
              <button 
                className="btn flex items-center justify-center py-3 px-6 text-white"
                style={{ background: '#ef4444', opacity: isPlaying ? 1 : 0.5, cursor: isPlaying ? 'pointer' : 'not-allowed' }}
                onClick={handleStop}
                disabled={!isPlaying}
              >
                <Square className="mr-2" size={20} /> Dừng
              </button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              * Tính năng sử dụng Web Speech API của trình duyệt. Không hỗ trợ tải file âm thanh (.wav) về máy.
            </p>
          </div>

          {/* CỘT PHẢI: KẾT QUẢ / TRẠNG THÁI */}
          <div className="tts-section">
            <div className={`tts-result ${isPlaying ? 'has-audio' : ''}`}>
              {!isPlaying ? (
                <div className="text-center text-gray-400 flex flex-col items-center gap-3">
                  <Volume2 size={48} className="opacity-50" />
                  <p>Sẵn sàng đọc văn bản.</p>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-6">
                  <div className="text-blue-500 font-bold text-lg flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                    Đang phát âm thanh...
                  </div>
                  
                  {/* Visualizer giả lập cho đẹp */}
                  <div className="flex gap-1 items-end h-16">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                      <div 
                        key={i} 
                        className="w-2 bg-blue-500 rounded-t-sm"
                        style={{
                          height: `${Math.max(10, Math.random() * 100)}%`,
                          animation: 'pulse 0.5s infinite alternate',
                          animationDelay: `${i * 0.1}s`
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

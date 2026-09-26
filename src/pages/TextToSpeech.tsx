import { useState, useEffect } from 'react';
import { Play, Square, Settings2, Mic, Volume2, Cloud, Download, Loader2, FileAudio } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './TextToSpeech.css';

type Mode = 'browser' | 'cloud';

const FPT_VOICES = [
  { id: 'banmai', name: 'Ban Mai (Nữ - Miền Bắc)' },
  { id: 'thuminh', name: 'Thu Minh (Nữ - Miền Bắc)' },
  { id: 'leminh', name: 'Lê Minh (Nam - Miền Bắc)' },
  { id: 'myan', name: 'Mỹ An (Nữ - Miền Trung)' },
  { id: 'giahuy', name: 'Gia Huy (Nam - Miền Trung)' },
  { id: 'ngoclam', name: 'Ngọc Lam (Nữ - Huế)' },
  { id: 'lannhi', name: 'Lan Nhi (Nữ - Miền Nam)' },
  { id: 'minhquang', name: 'Minh Quang (Nam - Miền Nam)' }
];

export default function TextToSpeech() {
  const [mode, setMode] = useState<Mode>('cloud');
  const [text, setText] = useState('');
  
  // Trạng thái Web Speech API
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Trạng thái FPT AI (Cloud)
  const [fptApiKey, setFptApiKey] = useState(localStorage.getItem('fpt_api_key') || '');
  const [selectedFptVoice, setSelectedFptVoice] = useState('banmai');
  const [fptSpeed, setFptSpeed] = useState(0); // -3 đến 3
  const [isProcessingCloud, setIsProcessingCloud] = useState(false);
  const [cloudAudioUrl, setCloudAudioUrl] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(true); // Hiển thị sẵn cài đặt nếu chưa có key

  const { showAlert } = useDialogs();

  // Load danh sách giọng đọc từ trình duyệt
  useEffect(() => {
    const loadVoices = () => {
      let availableVoices = window.speechSynthesis.getVoices();
      availableVoices.sort((a, b) => {
        if (a.lang.includes('vi') && !b.lang.includes('vi')) return -1;
        if (!a.lang.includes('vi') && b.lang.includes('vi')) return 1;
        return 0;
      });
      setBrowserVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedBrowserVoice) {
        const viVoice = availableVoices.find(v => v.lang.includes('vi'));
        setSelectedBrowserVoice(viVoice ? viVoice.name : availableVoices[0].name);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedBrowserVoice]);

  // Lưu FPT Key vào localStorage
  useEffect(() => {
    if (fptApiKey) {
      localStorage.setItem('fpt_api_key', fptApiKey);
    }
  }, [fptApiKey]);

  // Hủy âm thanh khi rời khỏi trang
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlayBrowser = () => {
    if (!text.trim()) {
      showAlert('Vui lòng nhập văn bản cần đọc.', 'Thiếu thông tin');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceToUse = browserVoices.find(v => v.name === selectedBrowserVoice);
    if (voiceToUse) utterance.voice = voiceToUse;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopBrowser = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const handleGenerateCloud = async () => {
    if (!text.trim()) {
      showAlert('Vui lòng nhập văn bản cần đọc.', 'Thiếu thông tin');
      return;
    }
    if (!fptApiKey.trim()) {
      showAlert('Vui lòng nhập API Key của FPT AI trong phần Cài đặt để sử dụng tính năng này.', 'Thiếu API Key');
      setShowSettings(true);
      return;
    }

    setIsProcessingCloud(true);
    setCloudAudioUrl(null);

    try {
      const response = await fetch('https://api.fpt.ai/hmi/tts/v5', {
        method: 'POST',
        headers: {
          'api-key': fptApiKey,
          'voice': selectedFptVoice,
          'speed': fptSpeed.toString(),
          'format': 'mp3'
        },
        body: text
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || 'Lỗi từ máy chủ FPT AI');
      }

      if (data.async) {
         showAlert('Đoạn văn quá dài đang được xử lý ngầm (Async). Hãy dùng văn bản ngắn hơn để nhận file ngay.', 'Thông báo');
      } else {
         // FPT AI trả về link trong async = false
         setCloudAudioUrl(data.audiourl);
      }
    } catch (err: any) {
      console.error(err);
      showAlert(`Lỗi khi tạo giọng đọc: ${err.message}. Kiểm tra lại API Key hoặc kết nối mạng.`, 'Lỗi API');
    } finally {
      setIsProcessingCloud(false);
    }
  };

  const downloadCloudAudio = async () => {
    if (!cloudAudioUrl) return;
    try {
      const res = await fetch(cloudAudioUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice_${selectedFptVoice}_${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback open in new tab if CORS prevents blob download
      window.open(cloudAudioUrl, '_blank');
    }
  };

  return (
    <div className="tts-container">
      <div className="tool-header text-center mb-8">
        <h1 className="text-gradient text-3xl mb-2">Đọc Văn Bản (Text To Speech)</h1>
        <p className="text-secondary">Hỗ trợ đọc văn bản bằng trình duyệt (Offline) hoặc tạo file MP3 giọng Nam/Nữ cực chuẩn bằng Cloud API.</p>
      </div>

      <div className="glass-card">
        {/* TAB NAVIGATION */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2">
          <button 
            className={`flex items-center gap-2 pb-2 px-4 border-b-2 font-semibold transition-colors ${mode === 'cloud' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setMode('cloud')}
          >
            <Cloud size={18} /> Chế Độ Cloud API (Tải MP3)
          </button>
          <button 
            className={`flex items-center gap-2 pb-2 px-4 border-b-2 font-semibold transition-colors ${mode === 'browser' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setMode('browser')}
          >
            <Mic size={18} /> Chế Độ Trình Duyệt (Offline)
          </button>
        </div>

        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors bg-gray-100 px-3 py-1.5 rounded-full"
          >
            <Settings2 size={16} /> Cài đặt & Chọn giọng
          </button>
        </div>

        {/* SETTINGS PANEL */}
        {showSettings && (
          <div className="mb-6 p-5 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col gap-4">
            
            {mode === 'cloud' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">FPT.AI API Key (Bắt buộc):</label>
                  <input 
                    type="text" 
                    value={fptApiKey} 
                    onChange={(e) => setFptApiKey(e.target.value)}
                    placeholder="Nhập API Key lấy từ console.fpt.ai..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Lấy key miễn phí (100.000 ký tự/tháng) tại <a href="https://console.fpt.ai" target="_blank" className="text-blue-500 hover:underline">console.fpt.ai</a>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn Giọng Tiếng Việt:</label>
                    <select 
                      value={selectedFptVoice} 
                      onChange={(e) => setSelectedFptVoice(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                    >
                      {FPT_VOICES.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tốc độ đọc: {fptSpeed > 0 ? `+${fptSpeed}` : fptSpeed} (Mặc định 0)
                    </label>
                    <input 
                      type="range" 
                      min="-3" max="3" step="0.5" 
                      value={fptSpeed} 
                      onChange={(e) => setFptSpeed(parseFloat(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'browser' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn giọng đọc (Cài sẵn trên máy):</label>
                  <select 
                    value={selectedBrowserVoice} 
                    onChange={(e) => setSelectedBrowserVoice(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                  >
                    {browserVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang}) {v.default ? ' - Mặc định' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tốc độ: {rate}x</label>
                    <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} className="w-full"/>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Độ thanh (Pitch): {pitch}</label>
                    <input type="range" min="0" max="2" step="0.1" value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))} className="w-full"/>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="tts-layout">
          {/* CỘT TRÁI: NHẬP LIỆU */}
          <div className="tts-section">
            <div className="tts-input-group">
              <label><FileAudio size={18} /> Nhập văn bản cần đọc</label>
              <textarea 
                className="tts-textarea"
                placeholder="Ví dụ: Xin chào, tôi đang sử dụng phần mềm đọc văn bản tự động..."
                value={text}
                onChange={e => setText(e.target.value)}
              ></textarea>
            </div>

            {mode === 'browser' ? (
              <div className="flex gap-2">
                <button 
                  className="btn-primary flex items-center justify-center flex-1 py-3"
                  onClick={handlePlayBrowser}
                  disabled={isPlaying}
                >
                  <Play className="mr-2" size={20} /> Phát Âm Thanh
                </button>
                
                <button 
                  className="btn flex items-center justify-center py-3 px-6 text-white bg-red-500 hover:bg-red-600 rounded-xl"
                  style={{ opacity: isPlaying ? 1 : 0.5, cursor: isPlaying ? 'pointer' : 'not-allowed' }}
                  onClick={handleStopBrowser}
                  disabled={!isPlaying}
                >
                  <Square className="mr-2" size={20} /> Dừng
                </button>
              </div>
            ) : (
              <button 
                className="btn-primary flex items-center justify-center w-full py-3"
                onClick={handleGenerateCloud}
                disabled={isProcessingCloud}
              >
                {isProcessingCloud ? (
                  <><Loader2 className="animate-spin mr-2" size={20} /> Đang kết nối AI...</>
                ) : (
                  <><Cloud className="mr-2" size={20} /> Tạo file Âm Thanh MP3</>
                )}
              </button>
            )}
            
            {mode === 'browser' && (
              <p className="text-xs text-gray-500 text-center mt-2">
                * Chế độ trình duyệt phát âm thanh trực tiếp qua loa, không cho phép lưu file MP3.
              </p>
            )}
          </div>

          {/* CỘT PHẢI: KẾT QUẢ / TRẠNG THÁI */}
          <div className="tts-section">
            <div className={`tts-result ${(mode === 'browser' && isPlaying) || (mode === 'cloud' && cloudAudioUrl) ? 'has-audio' : ''}`}>
              
              {mode === 'browser' && !isPlaying && (
                <div className="text-center text-gray-400 flex flex-col items-center gap-3">
                  <Volume2 size={48} className="opacity-50" />
                  <p>Sẵn sàng đọc văn bản (Chế độ Trình duyệt).</p>
                </div>
              )}

              {mode === 'browser' && isPlaying && (
                <div className="w-full flex flex-col items-center gap-6">
                  <div className="text-blue-500 font-bold text-lg flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                    Đang phát âm thanh...
                  </div>
                  <div className="flex gap-1 items-end h-16">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                      <div key={i} className="w-2 bg-blue-500 rounded-t-sm" style={{ height: `${Math.max(10, Math.random() * 100)}%`, animation: 'pulse 0.5s infinite alternate', animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'cloud' && !cloudAudioUrl && (
                <div className="text-center text-gray-400 flex flex-col items-center gap-3">
                  <Cloud size={48} className="opacity-50" />
                  <p>Điền API Key FPT và nhấn "Tạo file Âm Thanh MP3".</p>
                </div>
              )}

              {mode === 'cloud' && cloudAudioUrl && (
                <div className="w-full flex flex-col items-center gap-6">
                  <div className="text-green-500 font-bold text-lg flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    Xử lý AI thành công!
                  </div>
                  
                  <audio src={cloudAudioUrl} controls autoPlay className="w-full rounded-full" />

                  <button 
                    className="btn flex items-center justify-center w-full gap-2 text-white bg-green-500 hover:bg-green-600 py-3 rounded-xl shadow-lg shadow-green-200 transition-transform hover:-translate-y-1"
                    onClick={downloadCloudAudio}
                  >
                    <Download size={20} /> Tải file MP3 về máy
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

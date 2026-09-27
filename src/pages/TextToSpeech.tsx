import { useState, useEffect, useRef } from 'react';
import { Play, Square, Settings2, Mic, Volume2, Cloud, Download, Loader2, FileAudio } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './TextToSpeech.css';

type Mode = 'browser' | 'edge';

const EDGE_VOICES = [
  { id: 'vi-VN-HoaiMyNeural', name: 'Hoài My (Nữ - Microsoft AI)' },
  { id: 'vi-VN-NamMinhNeural', name: 'Nam Minh (Nam - Microsoft AI)' }
];

export default function TextToSpeech() {
  const [mode, setMode] = useState<Mode>('edge');
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);
  const textRef = useRef(text);
  
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Vui lòng dùng Chrome/Edge).");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => { setIsListening(false); setInterimText(''); };
    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
      setInterimText('');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        const currentText = textRef.current;
        setText(currentText + (currentText && !currentText.endsWith(' ') ? ' ' : '') + finalTranscript);
      }
      setInterimText(interim);
    };
    recognition.start();
  };

  
  // Trạng thái Web Speech API
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Trạng thái Edge TTS (Microsoft AI)
  const [selectedEdgeVoice, setSelectedEdgeVoice] = useState('vi-VN-HoaiMyNeural');
  const [edgeSpeed, setEdgeSpeed] = useState(0); // -100% đến +100%
  const [edgePitch, setEdgePitch] = useState(0); // -100Hz đến +100Hz
  const [isProcessingCloud, setIsProcessingCloud] = useState(false);
  const [cloudProgress, setCloudProgress] = useState('');
  const [cloudAudioUrl, setCloudAudioUrl] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);

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

  const handleGenerateEdge = async () => {
    if (!text.trim()) {
      showAlert('Vui lòng nhập văn bản cần đọc.', 'Thiếu thông tin');
      return;
    }

    setIsProcessingCloud(true);
    setCloudAudioUrl(null);

    try {
      const rateStr = edgeSpeed >= 0 ? `+${edgeSpeed}%` : `${edgeSpeed}%`;
      const pitchStr = edgePitch >= 0 ? `+${edgePitch}Hz` : `${edgePitch}Hz`;

      // Split text on the client to avoid 60s Vercel limits and 504 Timeouts
      // Limit each chunk to ~400 characters to prevent Vercel 10s timeout on hobby tier
      const sentences = text.split(/(?<=[.\n!?;])\s+/).filter(s => s.trim().length > 0);
      const chunks = [];
      let currentChunk = '';

      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > 400) {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }
      if (currentChunk) chunks.push(currentChunk);

      const audioBlobs = [];
      setCloudProgress(`Đang xử lý (0/${chunks.length})...`);

      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const response = await fetch('/api/edge-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chunkText,
            voice: selectedEdgeVoice,
            rate: rateStr,
            pitch: pitchStr
          })
        });

        if (!response.ok) {
          throw new Error('Lỗi kết nối tới Microsoft AI ở đoạn ' + (i + 1) + '/' + chunks.length);
        }

        const blob = await response.blob();
        audioBlobs.push(blob);
        setCloudProgress(`Đang xử lý (${i + 1}/${chunks.length})...`);
      }

      setCloudProgress('Đang gộp file âm thanh...');
      const finalBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
      const url = window.URL.createObjectURL(finalBlob);
      setCloudAudioUrl(url);
    } catch (err: any) {
      console.error(err);
      showAlert(`Lỗi khi tạo giọng đọc: ${err.message}.`, 'Lỗi API');
    } finally {
      setIsProcessingCloud(false);
      setCloudProgress('');
    }
  };

  const downloadCloudAudio = async () => {
    if (!cloudAudioUrl) return;
    const a = document.createElement('a');
    a.href = cloudAudioUrl;
    a.download = `voice_microsoft_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="tts-container">
      <div className="tool-header text-center mb-8">
        <h1 className="text-gradient text-3xl mb-2">Đọc Văn Bản (Text To Speech)</h1>
        <p className="text-secondary">Sử dụng Microsoft Edge AI để tạo file MP3 giọng Nam/Nữ chuẩn xác nhất, hoàn toàn miễn phí.</p>
      </div>

      <div className="glass-card">
        {/* TAB NAVIGATION */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2">
          <button 
            className={`flex items-center gap-2 pb-2 px-4 border-b-2 font-semibold transition-colors ${mode === 'edge' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setMode('edge')}
          >
            <Cloud size={18} /> Microsoft Edge AI (Tải MP3)
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
          <div className="mb-6 bg-blue-50 rounded-xl border border-blue-200 shadow-sm flex flex-col gap-4" style={{ padding: '20px' }}>
            
            {mode === 'edge' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">Chọn Giọng Tiếng Việt:</label>
                    <select 
                      value={selectedEdgeVoice} 
                      onChange={(e) => setSelectedEdgeVoice(e.target.value)}
                      className="w-full p-2.5 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 shadow-sm transition-all"
                    >
                      {EDGE_VOICES.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      Tốc độ đọc: {edgeSpeed > 0 ? `+${edgeSpeed}%` : `${edgeSpeed}%`}
                    </label>
                    <input 
                      type="range" 
                      min="-50" max="50" step="5" 
                      value={edgeSpeed} 
                      onChange={(e) => setEdgeSpeed(parseInt(e.target.value))}
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600 my-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      Độ thanh trầm: {edgePitch > 0 ? `+${edgePitch}Hz` : `${edgePitch}Hz`}
                    </label>
                    <input 
                      type="range" 
                      min="-50" max="50" step="5" 
                      value={edgePitch} 
                      onChange={(e) => setEdgePitch(parseInt(e.target.value))}
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600 my-3"
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
              <label style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span><FileAudio size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} /> Nhập văn bản cần đọc</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                  {text.trim() ? text.trim().split(/\s+/).length : 0} từ
                </span>
              </label>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <textarea 
                  className="tts-textarea p-4"
                  placeholder="Ví dụ: Xin chào, tôi đang sử dụng phần mềm đọc văn bản tự động..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  style={{ width: '100%', minHeight: '150px', paddingBottom: '3rem' }}
                ></textarea>
                {isListening && (
                  <div className="absolute bottom-16 left-4 right-4 bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-sm italic shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
                    {interimText || 'Đang nghe... Hãy nói gì đó (Tự động ngắt khi bạn dừng)'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute bottom-4 right-4 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white shadow-md hover:bg-red-600' 
                      : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-300 shadow-sm'
                  }`}
                  title="Nhập bằng giọng nói"
                >
                  <Mic size={16} className={isListening ? 'animate-pulse' : ''} />
                  {isListening ? 'Dừng ghi âm' : 'Nhập bằng giọng nói'}
                </button>
              </div>
            </div>

            {mode === 'browser' ? (
              <div className="flex gap-2">
                <button 
                  className="btn btn-primary flex items-center justify-center flex-1 py-3 px-6"
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
                className="btn btn-primary flex items-center justify-center w-full py-3 px-6"
                onClick={handleGenerateEdge}
                disabled={isProcessingCloud}
              >
                {isProcessingCloud ? (
                  <><Loader2 className="animate-spin mr-2" size={20} /> {cloudProgress || 'Đang kết nối AI...'}</>
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
            <div className={`tts-result ${(mode === 'browser' && isPlaying) || (mode === 'edge' && cloudAudioUrl) ? 'has-audio' : ''}`}>
              
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

              {mode === 'edge' && !cloudAudioUrl && (
                <div className="text-center text-gray-400 flex flex-col items-center gap-3">
                  <Cloud size={48} className="opacity-50" />
                  <p>Chọn giọng Nam/Nữ và nhấn "Tạo file Âm Thanh MP3".</p>
                </div>
              )}

              {mode === 'edge' && cloudAudioUrl && (
                <div className="w-full flex flex-col items-center gap-6">
                  <div className="text-green-500 font-bold text-lg flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    Xử lý AI thành công!
                  </div>
                  
                  <audio src={cloudAudioUrl} controls autoPlay className="w-full rounded-full" />

                  <button 
                    className="btn btn-primary flex items-center justify-center w-full py-3 px-6 gap-2 rounded-xl shadow-lg transition-transform hover:-translate-y-1"
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

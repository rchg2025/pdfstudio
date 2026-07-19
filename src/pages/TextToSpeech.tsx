import { useState, useEffect } from 'react';
import { Volume2, Play, Square, Lock, Pause } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './TextToSpeech.css';

export default function TextToSpeech() {
  const [text, setText] = useState('Chào mừng bạn đến với công cụ chuyển đổi văn bản thành âm thanh.');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const { showAlert } = useDialogs();

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Try to find a Vietnamese voice by default, or just use the first one
      if (availableVoices.length > 0) {
        const viIndex = availableVoices.findIndex(v => v.lang.includes('vi'));
        if (viIndex !== -1) {
          setSelectedVoiceIndex(viIndex);
        } else {
          setSelectedVoiceIndex(0);
        }
      }
    };

    loadVoices();
    
    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel(); // Stop playing when component unmounts
    };
  }, []);

  const handlePlay = () => {
    if (!text.trim()) {
      showAlert('Vui lòng nhập văn bản cần đọc', 'Thông báo');
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (voices.length > 0) {
      utterance.voice = voices[selectedVoiceIndex];
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled') {
        console.error('Speech synthesis error', e);
        setIsPlaying(false);
        setIsPaused(false);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  return (
    <div className="audio-tool-container">
      <div className="audio-header">
        <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Volume2 className="text-primary" />
          Văn Bản thành Âm Thanh
        </h1>
        <p className="text-secondary">Chuyển đổi văn bản thành giọng nói (Text-to-Speech) dễ dàng trực tiếp trên trình duyệt.</p>
      </div>

      <div className="audio-tool-card">
        <div className="local-processing-notice">
          <Lock size={16} />
          Xử lý ngay trên thiết bị của bạn — Không giới hạn ký tự và hoàn toàn bảo mật.
        </div>

        <textarea
          className="audio-textarea"
          placeholder="Nhập hoặc dán văn bản của bạn vào đây..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="audio-controls">
          <div className="audio-input-group">
            <label>Giọng đọc</label>
            <select 
              className="audio-select"
              value={selectedVoiceIndex}
              onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
            >
              {voices.length === 0 ? (
                <option value={0}>Đang tải giọng đọc...</option>
              ) : (
                voices.map((voice, index) => (
                  <option key={voice.name} value={index}>
                    {voice.name} ({voice.lang}) {voice.default ? ' - Mặc định' : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="audio-input-group">
            <label>
              Tốc độ đọc
              <span className="value">{rate}x</span>
            </label>
            <input 
              type="range" 
              className="audio-slider"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
            />
          </div>

          <div className="audio-input-group">
            <label>
              Độ cao (Pitch)
              <span className="value">{pitch}</span>
            </label>
            <input 
              type="range" 
              className="audio-slider"
              min="0"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="audio-action-buttons">
          {!isPlaying ? (
            <button className="btn-audio primary" onClick={handlePlay} disabled={voices.length === 0}>
              <Play size={20} />
              Phát
            </button>
          ) : (
            <button className="btn-audio primary" onClick={handlePause}>
              <Pause size={20} />
              Tạm dừng
            </button>
          )}
          <button className="btn-audio" onClick={handleStop} disabled={!isPlaying && !isPaused}>
            <Square size={20} />
            Dừng
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Volume2, Play, Square, Lock, Pause, FileText, Download } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import VoiceSelector from '../components/VoiceSelector';
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      showAlert('Vui lòng chọn file văn bản (.txt)', 'Lỗi định dạng');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setText(content);
      }
    };
    reader.onerror = () => {
      showAlert('Không thể đọc file. Vui lòng thử lại.', 'Lỗi đọc file');
    };
    reader.readAsText(file);
    
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      
      // Sort voices: Vietnamese first, then alphabetical by name
      const sortedVoices = [...availableVoices].sort((a, b) => {
        const aIsVi = a.lang.toLowerCase().includes('vi');
        const bIsVi = b.lang.toLowerCase().includes('vi');
        if (aIsVi && !bIsVi) return -1;
        if (!aIsVi && bIsVi) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setVoices(sortedVoices);
      
      // Select the first Vietnamese voice (which will now be at the top if it exists)
      if (sortedVoices.length > 0) {
        setSelectedVoiceIndex(0);
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
      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '0.75rem', background: 'var(--primary)', borderRadius: 'var(--radius-md)', color: 'white' }}>
          <Volume2 size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Văn Bản thành Âm Thanh</h1>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Chuyển đổi văn bản thành giọng nói dễ dàng trực tiếp trên trình duyệt</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div className="local-processing-notice">
          <Lock size={16} />
          Xử lý ngay trên thiết bị của bạn — Không giới hạn ký tự và hoàn toàn bảo mật.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500 }}>
            <FileText size={16} />
            Tải lên file .txt
            <input 
              type="file" 
              accept=".txt,text/plain" 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
            />
          </label>
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
            <VoiceSelector 
              voices={voices}
              selectedVoiceIndex={selectedVoiceIndex}
              onSelect={setSelectedVoiceIndex}
            />
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
          <button 
            className="btn-audio" 
            onClick={() => showAlert('Do công cụ hoạt động 100% offline trên trình duyệt để đảm bảo bảo mật tuyệt đối, trình duyệt hiện tại chưa hỗ trợ trích xuất luồng giọng đọc thành file âm thanh. Bạn vui lòng sử dụng phần mềm ghi âm của máy tính/điện thoại để lưu lại đoạn hội thoại nhé!', 'Giới hạn kỹ thuật')}
          >
            <Download size={20} />
            Tải MP3
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Play, 
  Pause, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Loader2
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './SlideDubbing.css';

export interface SlideScript {
  pageNumber: number;
  title: string;
  imagePreview?: string;
  scriptText: string;
}

export default function SlideDubbing() {
  const { showToast } = useNotification();

  const [slides, setSlides] = useState<SlideScript[]>([
    {
      pageNumber: 1,
      title: 'Trang 1: Giới thiệu bài giảng & Mục tiêu bài học',
      scriptText: 'Chào mừng tất cả các em sinh viên đến với bài giảng hôm nay. Trong bài học này, chúng ta sẽ tìm hiểu về các tiêu chuẩn thiết kế bài giảng số trên LMS.'
    },
    {
      pageNumber: 2,
      title: 'Trang 2: Kiến trúc hệ thống LMS và Chuẩn SCORM',
      scriptText: 'Ở trang này, các em cần chú ý đến chuẩn đóng gói SCORM. SCORM giúp bài giảng của chúng ta có thể tương thích và vận hành mượt mà trên bất kỳ nền tảng nào.'
    },
    {
      pageNumber: 3,
      title: 'Trang 3: Tổng kết kiến thức & Bài tập về nhà',
      scriptText: 'Trước khi kết thúc, các em hãy hoàn thành phần mini quiz 5 câu trắc nghiệm bên dưới để hệ thống ghi nhận điểm chuyên cần nhé.'
    }
  ]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('vi-VN');
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const handlePlayVoice = () => {
    if (!synthRef.current) {
      showToast('Trình duyệt không hỗ trợ phát giọng nói.', 'warning');
      return;
    }

    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
      return;
    }

    synthRef.current.cancel();
    const currentScript = slides[currentSlideIndex].scriptText;
    const utterance = new SpeechSynthesisUtterance(currentScript);
    utterance.lang = selectedVoice;
    utterance.pitch = pitch;
    utterance.rate = rate;

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    setIsPlaying(true);
    synthRef.current.speak(utterance);
  };

  // AI Tự động viết kịch bản thuyết minh cho trang slide
  const handleAiGenerateScript = async () => {
    setIsAiGenerating(true);
    try {
      const currentSlide = slides[currentSlideIndex];
      const prompt = `Bạn là giảng viên đại học truyền cảm. Hãy viết 1 đoạn kịch bản lời thoại thuyết trình ngắn (khoảng 3-4 câu, giọng điệu tự nhiên, truyền cảm hứng) để đọc thuyết minh cho slide có tiêu đề: "${currentSlide.title}".
Chỉ trả về đoạn văn bản lời thoại tiếng Việt thuần túy, không có ngoặc kép hay tiêu đề phụ.`;

      const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
      if (!res.ok) throw new Error('Máy chủ AI không phản hồi');
      const text = await res.text();
      const cleaned = text.trim();

      setSlides(prev => prev.map((s, idx) => idx === currentSlideIndex ? { ...s, scriptText: cleaned } : s));
      showToast('AI đã hoàn thành kịch bản thuyết minh!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Không thể tạo lời thoại lúc này, vui lòng thử lại sau.', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="dubbing-container animate-fade-in">
      <header className="dub-header">
        <div className="dub-title-group">
          <div className="dub-icon">
            <Mic size={26} />
          </div>
          <div>
            <h1 className="dub-title">Lồng Tiếng Slide Bài Giảng AI (Slide Voiceover)</h1>
            <p className="dub-subtitle">
              Tự động soạn kịch bản thuyết minh và phát âm chuẩn từng trang slide cho bài giảng điện tử e-Learning.
            </p>
          </div>
        </div>
      </header>

      <div className="dub-grid">
        {/* Left: Slide Preview & Audio Stage */}
        <div className="dub-stage-card">
          <div className="slide-sim-screen">
            <div className="slide-sim-inner">
              <span className="slide-page-badge">Slide {currentSlide.pageNumber} / {slides.length}</span>
              <h2 className="slide-sim-title">{currentSlide.title}</h2>
              <div className="slide-sim-wave">
                {isPlaying && (
                  <div className="sound-wave-bars">
                    <span></span><span></span><span></span><span></span><span></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="slide-playback-bar">
            <button 
              type="button" 
              className="btn btn-outline btn-sm"
              disabled={currentSlideIndex === 0}
              onClick={() => {
                if (synthRef.current) synthRef.current.cancel();
                setIsPlaying(false);
                setCurrentSlideIndex(currentSlideIndex - 1);
              }}
            >
              <ChevronLeft size={16} /> Slide Trước
            </button>

            <button 
              type="button" 
              className={`btn btn-lg ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
              onClick={handlePlayVoice}
              style={{ minWidth: '150px' }}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? 'Dừng Đọc' : 'Phát Thuyết Minh'}
            </button>

            <button 
              type="button" 
              className="btn btn-outline btn-sm"
              disabled={currentSlideIndex === slides.length - 1}
              onClick={() => {
                if (synthRef.current) synthRef.current.cancel();
                setIsPlaying(false);
                setCurrentSlideIndex(currentSlideIndex + 1);
              }}
            >
              Slide Tiếp <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: Script Editor & Voice Settings */}
        <div className="dub-edit-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Lời Thoại Thuyết Minh</h3>
            <button 
              type="button" 
              className="btn btn-outline btn-sm"
              disabled={isAiGenerating}
              onClick={handleAiGenerateScript}
              style={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}
            >
              {isAiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isAiGenerating ? 'Đang viết...' : 'AI Viết Lời Thoại'}
            </button>
          </div>

          <div className="form-group">
            <label>Tiêu đề slide</label>
            <input 
              type="text" 
              className="inter-input" 
              value={currentSlide.title}
              onChange={(e) => {
                const val = e.target.value;
                setSlides(prev => prev.map((s, idx) => idx === currentSlideIndex ? { ...s, title: val } : s));
              }}
            />
          </div>

          <div className="form-group">
            <label>Nội dung kịch bản AI sẽ đọc</label>
            <textarea 
              className="inter-textarea" 
              rows={5}
              value={currentSlide.scriptText}
              onChange={(e) => {
                const val = e.target.value;
                setSlides(prev => prev.map((s, idx) => idx === currentSlideIndex ? { ...s, scriptText: val } : s));
              }}
              placeholder="Nhập lời thoại cần giáo viên/AI đọc ở slide này..."
            />
          </div>

          <div className="voice-controls-box">
            <div className="form-group">
              <label>Ngôn ngữ giọng đọc</label>
              <select 
                className="inter-input"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                <option value="vi-VN">Tiếng Việt (Chuẩn)</option>
                <option value="en-US">Tiếng Anh (US English)</option>
                <option value="en-GB">Tiếng Anh (UK English)</option>
                <option value="fr-FR">Tiếng Pháp (French)</option>
                <option value="ja-JP">Tiếng Nhật (Japanese)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label>Tốc độ đọc: {rate}x</label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.5" 
                  step="0.1" 
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-group">
                <label>Cao độ giọng: {pitch}</label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.5" 
                  step="0.1" 
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

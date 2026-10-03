import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizStop {
  id: string;
  timeSeconds: number;
  question: string;
  options: QuizOption[];
  explanation?: string;
}

interface PlayerConfig {
  src: string;
  type: 'youtube' | 'canva' | 'generic';
  stops: QuizStop[];
  title?: string;
}

export default function EmbedPlayer() {
  const [config, setConfig] = useState<PlayerConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<QuizStop | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [answeredStops, setAnsweredStops] = useState<Set<string>>(new Set());

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(true);
  const currentTimeRef = useRef(0);
  const activeQuizRef = useRef<QuizStop | null>(null);
  const answeredStopsRef = useRef(answeredStops);
  const configRef = useRef<PlayerConfig | null>(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    activeQuizRef.current = activeQuiz;
  }, [activeQuiz]);

  useEffect(() => {
    answeredStopsRef.current = answeredStops;
  }, [answeredStops]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Giải mã dữ liệu cấu hình từ URL hash hoặc search param
  useEffect(() => {
    try {
      let rawData = '';
      if (window.location.hash && window.location.hash.length > 1) {
        rawData = window.location.hash.substring(1);
      } else {
        const params = new URLSearchParams(window.location.search);
        rawData = params.get('data') || '';
      }

      if (!rawData) {
        setError('Không tìm thấy thông tin cấu hình bài giảng!');
        return;
      }

      // Hỗ trợ Base64 UTF-8 an toàn
      let decodedStr = '';
      try {
        const binary = atob(rawData);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        decodedStr = new TextDecoder().decode(bytes);
      } catch (e) {
        decodedStr = decodeURIComponent(escape(atob(rawData)));
      }

      const parsed: PlayerConfig = JSON.parse(decodedStr);
      if (!parsed.src) {
        setError('Nguồn nhúng không hợp lệ!');
        return;
      }
      setConfig(parsed);
    } catch (err: any) {
      console.error('Lỗi nạp cấu hình:', err);
      setError('Dữ liệu bài giảng không hợp lệ hoặc đã bị lỗi định dạng!');
    }
  }, []);

  // Gửi lệnh điều khiển tới iframe (postMessage)
  const sendIframeCommand = (cmd: string) => {
    const iframe = document.getElementById('player-embed-iframe') as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd }), '*');
        iframe.contentWindow.postMessage(JSON.stringify({ method: cmd }), '*');
        iframe.contentWindow.postMessage(cmd, '*');
      } catch (e) {}
    }
  };

  // Đồng hồ chạy & phát hiện điểm dừng
  useEffect(() => {
    if (!config) return;

    timerRef.current = setInterval(() => {
      if (!isPlayingRef.current || activeQuizRef.current) return;

      const next = currentTimeRef.current + 1;
      currentTimeRef.current = next;
      setCurrentTime(next);

      // Kiểm tra xem có mốc dừng nào chưa trả lời không
      const stops = configRef.current?.stops || [];
      const found = stops.find(
        (s) => next >= s.timeSeconds && !answeredStopsRef.current.has(s.id)
      );

      if (found) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setActiveQuiz(found);
        activeQuizRef.current = found;
        setSelectedOptionId(null);
        setAnswerStatus('idle');

        sendIframeCommand('pause');
        sendIframeCommand('pauseVideo');
      }

      // Giữ YouTube Iframe API kết nối nếu có
      if (configRef.current?.type === 'youtube') {
        const iframe = document.getElementById('player-embed-iframe') as HTMLIFrameElement | null;
        if (iframe?.contentWindow) {
          try {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
          } catch (e) {}
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [config]);

  // Nhận thông điệp từ YouTube / Player iframe
  useEffect(() => {
    const handleMsg = (ev: MessageEvent) => {
      if (activeQuizRef.current) return;
      try {
        const d = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
        if (!d) return;

        // Xử lý sự kiện YouTube
        if (d.event === 'infoDelivery' && d.info) {
          if (typeof d.info.currentTime === 'number') {
            const ytSec = Math.floor(d.info.currentTime);
            if (ytSec > 0 && Math.abs(ytSec - currentTimeRef.current) > 1) {
              currentTimeRef.current = ytSec;
              setCurrentTime(ytSec);

              const stops = configRef.current?.stops || [];
              const found = stops.find(
                (s) => ytSec >= s.timeSeconds && !answeredStopsRef.current.has(s.id)
              );
              if (found) {
                setIsPlaying(false);
                isPlayingRef.current = false;
                setActiveQuiz(found);
                activeQuizRef.current = found;
                sendIframeCommand('pauseVideo');
              }
            }
          }
          if (d.info.playerState === 1 && !isPlayingRef.current) {
            setIsPlaying(true);
            isPlayingRef.current = true;
          } else if (d.info.playerState === 2 && isPlayingRef.current) {
            setIsPlaying(false);
            isPlayingRef.current = false;
          }
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePlay = () => {
    if (activeQuiz) return;
    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      sendIframeCommand('pause');
      sendIframeCommand('pauseVideo');
    } else {
      setIsPlaying(true);
      isPlayingRef.current = true;
      sendIframeCommand('play');
      sendIframeCommand('playVideo');
    }
  };

  const handleReset = () => {
    currentTimeRef.current = 0;
    setCurrentTime(0);
    setActiveQuiz(null);
    activeQuizRef.current = null;
    setAnsweredStops(new Set());
    answeredStopsRef.current = new Set();
    setIsPlaying(true);
    isPlayingRef.current = true;

    const iframe = document.getElementById('player-embed-iframe') as HTMLIFrameElement | null;
    if (iframe && config?.src) {
      iframe.src = config.src;
    }
    sendIframeCommand('play');
  };

  const handleCheckAnswer = () => {
    if (!activeQuiz || !selectedOptionId) return;

    const selected = activeQuiz.options.find((o) => o.id === selectedOptionId);
    if (selected?.isCorrect) {
      setAnswerStatus('correct');
      setTimeout(() => {
        const nextSet = new Set(answeredStopsRef.current).add(activeQuiz.id);
        setAnsweredStops(nextSet);
        answeredStopsRef.current = nextSet;

        setActiveQuiz(null);
        activeQuizRef.current = null;
        setSelectedOptionId(null);
        setAnswerStatus('idle');

        setIsPlaying(true);
        isPlayingRef.current = true;
        sendIframeCommand('play');
        sendIframeCommand('playVideo');
      }, 1400);
    } else {
      setAnswerStatus('wrong');
    }
  };

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f172a',
        color: '#f8fafc',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '12px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Không thể tải bài giảng</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '420px', textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid #334155',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#000000',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: '#f8fafc',
      overflow: 'hidden'
    }}>
      {/* Vùng bài giảng chính (iframe) */}
      <div style={{
        position: 'relative',
        flex: 1,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#000000'
      }}>
        <iframe
          id="player-embed-iframe"
          src={config.src}
          title="Interactive Lecture"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            pointerEvents: activeQuiz ? 'none' : 'auto',
            opacity: activeQuiz ? 0.15 : 1,
            transition: 'opacity 0.3s ease'
          }}
          allowFullScreen
          allow="fullscreen; autoplay; encrypted-media"
        />

        {/* Khung câu hỏi trắc nghiệm chặn màn hình */}
        {activeQuiz && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
            boxSizing: 'border-box',
            overflowY: 'auto'
          }}>
            <div style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              boxSizing: 'border-box'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '10px'
              }}>
                <span style={{
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  textTransform: 'uppercase'
                }}>
                  Điểm dừng kiểm tra
                </span>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                  Mốc: {formatTime(activeQuiz.timeSeconds)}
                </span>
              </div>

              <h3 style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.45,
                marginBottom: '16px'
              }}>
                {activeQuiz.question}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {activeQuiz.options.map((opt, idx) => {
                  const isSelected = selectedOptionId === opt.id;
                  const label = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (answerStatus !== 'correct') setSelectedOptionId(opt.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: isSelected ? '#eff6ff' : '#f8fafc',
                        color: isSelected ? '#1d4ed8' : '#1e293b',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: isSelected ? 600 : 400,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isSelected ? '#2563eb' : '#e2e8f0',
                        color: isSelected ? '#ffffff' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {label}
                      </span>
                      <span style={{ flex: 1 }}>{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {answerStatus === 'correct' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: '#dcfce7',
                  color: '#15803d',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '14px'
                }}>
                  <CheckCircle2 size={18} />
                  <span>
                    <strong>Chính xác!</strong> {activeQuiz.explanation || 'Đang tiếp tục bài giảng...'}
                  </span>
                </div>
              )}

              {answerStatus === 'wrong' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: '#fee2e2',
                  color: '#b91c1c',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '14px'
                }}>
                  <XCircle size={18} />
                  <span>
                    <strong>Chưa chính xác!</strong> Vui lòng chọn lại đáp án đúng để tiếp tục.
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckAnswer}
                disabled={!selectedOptionId || answerStatus === 'correct'}
                style={{
                  width: '100%',
                  background: answerStatus === 'correct' ? '#16a34a' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: !selectedOptionId || answerStatus === 'correct' ? 'not-allowed' : 'pointer',
                  opacity: !selectedOptionId ? 0.6 : 1,
                  transition: 'background 0.2s ease'
                }}
              >
                {answerStatus === 'correct' ? 'Đã Trả Lời Đúng' : 'Xác nhận câu trả lời'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Thanh điều khiển tương tác phía dưới */}
      <div style={{
        height: '52px',
        background: '#0f172a',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={!!activeQuiz}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isPlaying ? '#ef4444' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: activeQuiz ? 'not-allowed' : 'pointer'
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Tạm Dừng' : 'Tiếp Tục'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} />
            <span>Xem lại</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            color: '#e2e8f0',
            fontWeight: 700,
            marginLeft: '8px'
          }}>
            <Clock size={16} style={{ color: '#38bdf8' }} />
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: '#94a3b8' }}>
          <span>Điểm dừng: <strong>{config.stops.length}</strong> câu hỏi</span>
        </div>
      </div>
    </div>
  );
}

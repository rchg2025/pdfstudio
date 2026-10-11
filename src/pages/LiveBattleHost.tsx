import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Play, Users, Trophy, Volume2, VolumeX, Flame, 
  RotateCcw, Sparkles, ChevronRight, Award, 
  Clock, ArrowLeft, Plus, Trash2, Layers,
  Copy, Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useDialogs } from '../components/CustomDialogs';
import QRCode from 'qrcode';
import { triggerConfetti } from '../utils/confetti';
import './LiveBattleHost.css';

interface QuestionItem {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0, 1, 2, 3
  explanation?: string;
}

interface PlayerItem {
  id: string;
  nickname: string;
  studentId?: string;
  className?: string;
  avatarEmoji: string;
  totalScore: number;
  streak: number;
  answers?: any[];
}

export default function LiveBattleHost() {
  const { user } = useAuth();
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { showAlert } = useDialogs();

  // Danh sách phòng của GV
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Modal tạo phòng
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [timePerQ, setTimePerQ] = useState(20);
  const [quizSource, setQuizSource] = useState<'bank' | 'manual'>('manual');
  const [myQuizPackages, setMyQuizPackages] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [manualQuestions] = useState<QuestionItem[]>([
    {
      question: 'Câu hỏi mẫu: Đâu là định nghĩa đúng của E-Learning?',
      options: [
        'Học tập trực tuyến qua nền tảng số',
        'Chỉ là việc gửi tài liệu qua Zalo',
        'Học trực tiếp không dùng máy tính',
        'Hình thức thi cử thủ công'
      ],
      correctAnswer: 0
    },
    {
      question: 'Trong cấp cứu cơ bản, ép tim ngoài lồng ngực với tần số chuẩn là bao nhiêu?',
      options: [
        '60 - 80 lần/phút',
        '100 - 120 lần/phút',
        '140 - 160 lần/phút',
        '40 - 60 lần/phút'
      ],
      correctAnswer: 1
    }
  ]);

  // Trạng thái phòng hiện tại đang điều khiển (Host Screen)
  const [currentRoom, setCurrentRoom] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState(20);
  const [copiedPin, setCopiedPin] = useState(false);

  // Audio effects synthesizer (Web Audio API)
  const playSfx = (type: 'countdown' | 'reveal' | 'fanfare' | 'click') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'countdown') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'reveal') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'fanfare') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);
          o.start(ctx.currentTime + idx * 0.1);
          o.stop(ctx.currentTime + idx * 0.1 + 0.3);
        });
      }
    } catch {}
  };

  // Load danh sách phòng của GV
  const loadMyRooms = async () => {
    if (!user) return;
    setLoadingRooms(true);
    try {
      const res = await fetch(`/api/live-battle?action=get-my-rooms&userId=${encodeURIComponent(user.id)}`);
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Load ngân hàng đề thi
  const loadQuizPackages = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/quiz-api?action=list-quizzes&userId=${encodeURIComponent(user.id)}`);
      const data = await res.json();
      if (data.quizzes) {
        setMyQuizPackages(data.quizzes);
      }
    } catch {}
  };

  useEffect(() => {
    if (user) {
      loadMyRooms();
      loadQuizPackages();
    }
  }, [user]);

  // Load chi tiết phòng nếu có roomId trên URL
  const fetchHostRoom = async (id: string) => {
    try {
      const res = await fetch(`/api/live-battle?action=get-host-room&roomId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.success && data.room) {
        setCurrentRoom(data.room);
        // Tạo QR Code link cho học viên
        const joinUrl = `${window.location.origin}/dau-truong/${data.room.pinCode}`;
        QRCode.toDataURL(joinUrl, { width: 300, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } }, (err, url) => {
          if (!err && url) setQrDataUrl(url);
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (roomId) {
      fetchHostRoom(roomId);
    } else {
      setCurrentRoom(null);
    }
  }, [roomId]);

  // Polling cập nhật phòng khi đang ở màn hình Host
  useEffect(() => {
    if (!currentRoom?.id) return;
    const interval = setInterval(() => {
      fetchHostRoom(currentRoom.id);
    }, 2000);
    return () => clearInterval(interval);
  }, [currentRoom?.id]);

  // Đếm ngược thời gian câu hỏi
  useEffect(() => {
    if (currentRoom?.status !== 'QUESTION') return;
    setTimeLeft(currentRoom.timePerQuestion || 20);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          playSfx('reveal');
          // Tự chuyển sang màn hình Leaderboard khi hết giờ
          handleUpdateState('LEADERBOARD');
          return 0;
        }
        if (prev <= 6) {
          playSfx('countdown');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentRoom?.status, currentRoom?.currentQuestionIndex]);

  // Đổi trạng thái phòng
  const handleUpdateState = async (status: string, nextIndex?: number) => {
    if (!currentRoom) return;
    try {
      const res = await fetch('/api/live-battle?action=update-room-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: currentRoom.id,
          status,
          currentQuestionIndex: nextIndex !== undefined ? nextIndex : currentRoom.currentQuestionIndex
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchHostRoom(currentRoom.id);
        if (status === 'FINISHED') {
          triggerConfetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          playSfx('fanfare');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Tạo phòng mới
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newTitle.trim()) {
      showAlert('Vui lòng nhập tên phòng thi!', 'Thiếu thông tin');
      return;
    }

    let finalQuestions: QuestionItem[] = [];
    if (quizSource === 'bank' && selectedPackageId) {
      const pkg = myQuizPackages.find(p => p.id === selectedPackageId);
      if (pkg && Array.isArray(pkg.questions)) {
        finalQuestions = pkg.questions.map((q: any) => ({
          question: q.title || q.question || 'Câu hỏi',
          options: q.options || ['A', 'B', 'C', 'D'],
          correctAnswer: Number(q.correctOption ?? q.correctAnswer ?? 0),
          explanation: q.explanation
        }));
      }
    } else {
      finalQuestions = manualQuestions.filter(q => q.question.trim().length > 0);
    }

    if (finalQuestions.length === 0) {
      showAlert('Vui lòng thêm ít nhất 1 câu hỏi cho phòng thi!', 'Thiếu câu hỏi');
      return;
    }

    try {
      const res = await fetch('/api/live-battle?action=create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: newTitle.trim(),
          timePerQuestion: timePerQ,
          questions: finalQuestions
        })
      });
      const data = await res.json();
      if (data.success && data.room) {
        showToast('Đã tạo phòng đấu trường thành công!', 'success');
        setIsCreatingRoom(false);
        navigate(`/dau-truong-live/${data.room.id}`);
      }
    } catch (err: any) {
      showAlert(err.message || 'Lỗi khi tạo phòng', 'Lỗi');
    }
  };

  // Xóa phòng
  const handleDeleteRoom = async (id: string, title: string) => {
    const ok = window.confirm(`Bạn có chắc muốn xóa phòng "${title}" không?`);
    if (!ok) return;

    try {
      const res = await fetch('/api/live-battle?action=delete-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: id })
      });
      if (res.ok) {
        showToast('Đã xóa phòng!', 'success');
        loadMyRooms();
        if (currentRoom?.id === id) {
          navigate('/dau-truong-live');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyPin = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.pinCode);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
    showToast(`Đã sao chép mã PIN: ${currentRoom.pinCode}`, 'info');
  };

  // -------------------------------------------------------------
  // RENDER MÀN HÌNH ĐIỀU KHIỂN ĐẤU TRƯỜNG CHO MÁY CHIẾU (HOST VIEW)
  // -------------------------------------------------------------
  if (currentRoom) {
    const questions: QuestionItem[] = currentRoom.questions || [];
    const currentQ = questions[currentRoom.currentQuestionIndex];
    const players: PlayerItem[] = currentRoom.players || [];
    const totalQ = questions.length;

    return (
      <div className="battle-host-screen">
        {/* Top Header Bar */}
        <header className="battle-topbar">
          <div className="battle-brand">
            <Link to="/dau-truong-live" className="battle-back-link" title="Quay lại danh sách phòng">
              <ArrowLeft size={20} />
            </Link>
            <div className="battle-logo-badge">⚡ LIVE BATTLE</div>
            <span className="battle-room-title">{currentRoom.title}</span>
          </div>

          <div className="battle-top-actions">
            <button 
              className="battle-btn-sound" 
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            <div className="battle-pin-badge" onClick={copyPin} title="Bấm để sao chép mã PIN">
              <span className="pin-label">MÃ PIN:</span>
              <span className="pin-number">{currentRoom.pinCode}</span>
              {copiedPin ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            </div>
          </div>
        </header>

        {/* 1. MÀN HÌNH CHỜ (LOBBY): Học viên quét mã & vào phòng */}
        {currentRoom.status === 'LOBBY' && (
          <div className="battle-lobby-layout">
            <div className="lobby-left-card">
              <div className="lobby-instruction">
                <h2>Tham gia đấu trường trên điện thoại!</h2>
                <p>1. Quét mã QR hoặc truy cập: <strong>{window.location.host}/dau-truong</strong></p>
                <p>2. Nhập mã PIN phòng: <span className="pin-highlight">{currentRoom.pinCode}</span></p>
              </div>

              {qrDataUrl && (
                <div className="lobby-qr-frame">
                  <img src={qrDataUrl} alt="QR Code Tham Gia" className="lobby-qr-img" />
                  <span className="qr-scan-hint">Dùng camera điện thoại để quét ngay</span>
                </div>
              )}

              <button 
                className="btn-start-battle"
                disabled={players.length === 0}
                onClick={() => {
                  playSfx('fanfare');
                  handleUpdateState('QUESTION', 0);
                }}
              >
                <Play size={24} /> BẮT ĐẦU ĐẤU TRƯỜNG ({players.length} người)
              </button>
            </div>

            <div className="lobby-right-card">
              <div className="lobby-players-header">
                <h3>
                  <Users size={20} /> Học viên đã sẵn sàng ({players.length})
                </h3>
              </div>

              {players.length === 0 ? (
                <div className="lobby-empty-players">
                  <div className="pulse-radar"></div>
                  <p>Đang đợi các dũng sĩ gia nhập phòng...</p>
                </div>
              ) : (
                <div className="lobby-players-grid">
                  {players.map((p, idx) => (
                    <div key={p.id} className="player-lobby-chip" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <span className="player-emoji">{p.avatarEmoji || '🦊'}</span>
                      <span className="player-name">{p.nickname}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. MÀN HÌNH HIỂN THỊ CÂU HỎI TRỰC TIẾP */}
        {currentRoom.status === 'QUESTION' && currentQ && (
          <div className="battle-question-layout">
            <div className="question-info-bar">
              <span className="q-counter">Câu {currentRoom.currentQuestionIndex + 1} / {totalQ}</span>
              <div className="q-timer-badge">
                <Clock size={20} /> {timeLeft}s
              </div>
              <button 
                className="btn-skip-q"
                onClick={() => handleUpdateState('LEADERBOARD')}
              >
                Kết thúc câu hỏi
              </button>
            </div>

            <div className="question-main-box">
              <h1 className="question-text">{currentQ.question}</h1>
            </div>

            <div className="options-grid">
              {currentQ.options.map((opt, idx) => {
                const colors = ['opt-red', 'opt-blue', 'opt-yellow', 'opt-green'];
                const shapes = ['🔺', '🔷', '🟡', '🟩'];
                return (
                  <div key={idx} className={`option-card ${colors[idx % 4]}`}>
                    <span className="option-shape">{shapes[idx % 4]}</span>
                    <span className="option-label">{opt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. MÀN HÌNH BẢNG XẾP HẠNG TẠM THỜI (LEADERBOARD) */}
        {currentRoom.status === 'LEADERBOARD' && (
          <div className="battle-leaderboard-layout">
            <div className="leaderboard-header">
              <h2><Trophy size={28} color="#f59e0b" /> BẢNG XẾP HẠNG VÒNG ĐẤU</h2>
              <p>Top học viên có điểm số cao nhất hiện tại</p>
            </div>

            <div className="leaderboard-list">
              {players.slice(0, 5).map((p, idx) => (
                <div key={p.id} className={`leaderboard-row rank-${idx + 1}`}>
                  <div className="rank-pos">#{idx + 1}</div>
                  <div className="rank-avatar">{p.avatarEmoji || '🦊'}</div>
                  <div className="rank-name-box">
                    <span className="rank-name">{p.nickname}</span>
                    {p.streak > 1 && (
                      <span className="rank-streak"><Flame size={14} /> Chuỗi {p.streak}🔥</span>
                    )}
                  </div>
                  <div className="rank-score">{p.totalScore.toLocaleString()} pts</div>
                </div>
              ))}
            </div>

            <div className="leaderboard-actions">
              {currentRoom.currentQuestionIndex + 1 < totalQ ? (
                <button 
                  className="btn-next-q"
                  onClick={() => handleUpdateState('QUESTION', currentRoom.currentQuestionIndex + 1)}
                >
                  CÂU HỎI TIẾP THEO <ChevronRight size={22} />
                </button>
              ) : (
                <button 
                  className="btn-next-q btn-finish"
                  onClick={() => handleUpdateState('FINISHED')}
                >
                  <Award size={22} /> TỔNG KẾT & TRAO GIẢI
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. MÀN HÌNH TỔNG KẾT & TRAO GIẢI (PODIUM 1 - 2 - 3) */}
        {currentRoom.status === 'FINISHED' && (
          <div className="battle-podium-layout">
            <div className="podium-title">
              <Sparkles size={32} color="#f59e0b" />
              <h1>VINH DANH NHÀ VÔ ĐỊCH ĐẤU TRƯỜNG</h1>
              <p>Xin chúc mừng các học viên xuất sắc nhất của buổi học!</p>
            </div>

            <div className="podium-stage">
              {/* Hạng 2 */}
              {players[1] && (
                <div className="podium-step step-2">
                  <div className="podium-player">
                    <span className="step-medal">🥈 Á Quân</span>
                    <span className="step-emoji">{players[1].avatarEmoji}</span>
                    <span className="step-name">{players[1].nickname}</span>
                    <span className="step-score">{players[1].totalScore.toLocaleString()} pts</span>
                  </div>
                  <div className="step-block block-2">2</div>
                </div>
              )}

              {/* Hạng 1 (Quán Quân) */}
              {players[0] && (
                <div className="podium-step step-1">
                  <div className="crown-icon">👑</div>
                  <div className="podium-player">
                    <span className="step-medal">🥇 Quán Quân</span>
                    <span className="step-emoji">{players[0].avatarEmoji}</span>
                    <span className="step-name">{players[0].nickname}</span>
                    <span className="step-score">{players[0].totalScore.toLocaleString()} pts</span>
                  </div>
                  <div className="step-block block-1">1</div>
                </div>
              )}

              {/* Hạng 3 */}
              {players[2] && (
                <div className="podium-step step-3">
                  <div className="podium-player">
                    <span className="step-medal">🥉 Quý Quân</span>
                    <span className="step-emoji">{players[2].avatarEmoji}</span>
                    <span className="step-name">{players[2].nickname}</span>
                    <span className="step-score">{players[2].totalScore.toLocaleString()} pts</span>
                  </div>
                  <div className="step-block block-3">3</div>
                </div>
              )}
            </div>

            <div className="podium-actions">
              <button 
                className="btn-restart"
                onClick={() => handleUpdateState('LOBBY', 0)}
              >
                <RotateCcw size={18} /> Chơi Lại Từ Đầu
              </button>
              <Link to="/bang-vinh-danh" className="btn-sync-leaderboard">
                <Trophy size={18} /> Mở Bảng Vinh Danh Lớp Học
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // DANH SÁCH PHÒNG CỦA GIẢNG VIÊN & NÚT TẠO PHÒNG MỚI
  // -------------------------------------------------------------
  return (
    <div className="battle-manager-container">
      <div className="battle-manager-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.75rem', fontWeight: 800 }}>
            ⚡ Đấu Trường Đố Vui Trực Tiếp (Live Quiz Battle)
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Tổ chức mini-game kiểm tra kiến thức trực tiếp trong lớp học phong cách Kahoot & Quizizz. Học viên tham gia bằng điện thoại, bảng xếp hạng cập nhật thời gian thực.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setIsCreatingRoom(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
        >
          <Plus size={18} /> Tạo Phòng Đấu Trường Mới
        </button>
      </div>

      {/* Danh sách phòng đã tạo */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={20} color="var(--primary)" /> Danh sách phòng đấu trường của bạn
        </h2>

        {loadingRooms ? (
          <p>Đang tải danh sách phòng...</p>
        ) : rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#fff', borderRadius: '12px', border: '1px dashed var(--border)' }}>
            <Trophy size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Chưa có phòng đấu trường nào</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', marginBottom: '1.2rem' }}>
              Hãy tạo phòng đầu tiên để khuấy động không khí lớp học ngay hôm nay!
            </p>
            <button className="btn btn-primary" onClick={() => setIsCreatingRoom(true)}>
              + Tạo phòng ngay
            </button>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map(r => (
              <div key={r.id} className="room-card">
                <div className="room-card-top">
                  <span className="room-pin-tag">PIN: {r.pinCode}</span>
                  <span className="room-status-badge">{r.status}</span>
                </div>
                <h3 className="room-card-title">{r.title}</h3>
                <div className="room-card-meta">
                  <span>⏱️ {r.timePerQuestion}s/câu</span>
                  <span>❓ {Array.isArray(r.questions) ? r.questions.length : 0} câu hỏi</span>
                  <span>👥 {r._count?.players || 0} học viên</span>
                </div>

                <div className="room-card-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate(`/dau-truong-live/${r.id}`)}
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
                  >
                    <Play size={16} /> Mở Máy Chiếu
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => handleDeleteRoom(r.id, r.title)}
                    style={{ color: '#ef4444' }}
                    title="Xóa phòng"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tạo Phòng */}
      {isCreatingRoom && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Tạo Phòng Đấu Trường Trực Tiếp Mới</h3>
              <button className="btn-close" onClick={() => setIsCreatingRoom(false)}>×</button>
            </div>

            <form onSubmit={handleCreateRoom} style={{ padding: '1.25rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Tiêu đề phòng thi:
                </label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Đấu trường Sinh lý bệnh - Tiết 3" 
                  className="form-input"
                  required 
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Thời gian trả lời mỗi câu (giây):
                </label>
                <select 
                  value={timePerQ} 
                  onChange={e => setTimePerQ(Number(e.target.value))}
                  className="form-input"
                >
                  <option value={10}>10 giây (Rất nhanh)</option>
                  <option value={15}>15 giây (Nhanh)</option>
                  <option value={20}>20 giây (Chuẩn Kahoot)</option>
                  <option value={30}>30 giây (Thoải mái suy nghĩ)</option>
                  <option value={45}>45 giây (Câu hỏi phức tạp)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Nguồn câu hỏi trắc nghiệm:
                </label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="qSource" 
                      checked={quizSource === 'manual'} 
                      onChange={() => setQuizSource('manual')} 
                    />
                    Bộ câu hỏi nhanh (Mặc định)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="qSource" 
                      checked={quizSource === 'bank'} 
                      onChange={() => setQuizSource('bank')} 
                    />
                    Lấy từ Ngân hàng đề thi ({myQuizPackages.length})
                  </label>
                </div>

                {quizSource === 'bank' ? (
                  <select 
                    value={selectedPackageId} 
                    onChange={e => setSelectedPackageId(e.target.value)}
                    className="form-input"
                  >
                    <option value="">-- Chọn đề thi có sẵn --</option>
                    {myQuizPackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.title} ({Array.isArray(pkg.questions) ? pkg.questions.length : 0} câu)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: '8px' }}>
                    💡 Đã có sẵn 2 câu hỏi mẫu khởi động. Bạn có thể bấm tạo ngay để thử nghiệm trải nghiệm cùng lớp học!
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsCreatingRoom(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  ⚡ Khởi Tạo & Mở Máy Chiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

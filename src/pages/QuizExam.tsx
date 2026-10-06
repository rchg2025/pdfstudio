import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Sparkles,
  LayoutGrid,
  Music,
  X,
  Play
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import type { QuizPackage, QuizQuestion, StudentSubmission } from '../types/quiz';
import { quizAudio, type MusicTrack } from '../utils/quizAudio';
import './QuizExam.css';

export default function QuizExam() {
  const { quizId } = useParams<{ quizId: string }>();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizPackage | null>(null);
  const [loading, setLoading] = useState(true);

  // Flow step: 'register' | 'exam' | 'result'
  const [step, setStep] = useState<'register' | 'exam' | 'result'>('register');

  // Thí sinh
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [className, setClassName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  // Exam state
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack>('lofi');
  const [volume, setVolume] = useState<number>(() => Math.round(quizAudio.getVolume() * 100));
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showGridModal, setShowGridModal] = useState(false);

  const [submissionResult, setSubmissionResult] = useState<StudentSubmission | null>(null);
  const [reviewList, setReviewList] = useState<{ q: QuizQuestion; userAns: any; isCorrect: boolean }[]>([]);

  const activeBtnRef = useRef<HTMLButtonElement | null>(null);
  const ribbonRef = useRef<HTMLDivElement | null>(null);

  // Tải dữ liệu đề thi
  useEffect(() => {
    const loadQuizData = async () => {
      setLoading(true);
      try {
        // 1. Kiểm tra localStorage trước
        const local = localStorage.getItem('rchg_quiz_packages');
        if (local) {
          const list: QuizPackage[] = JSON.parse(local);
          const found = list.find(q => q.id === quizId || q.code === quizId);
          if (found) {
            setQuiz(found);
            if (found.settings?.bgMusicType && found.settings.bgMusicType !== 'none') {
              setSelectedTrack(found.settings.bgMusicType);
            }
            setLoading(false);
            return;
          }
        }

        // 2. Tải từ API Backend
        const res = await fetch(`/api/quiz-api?action=get-quizzes&id=${quizId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.quiz) {
            setQuiz(data.quiz);
            if (data.quiz.settings?.bgMusicType && data.quiz.settings.bgMusicType !== 'none') {
              setSelectedTrack(data.quiz.settings.bgMusicType);
            }
            setLoading(false);
            return;
          }
        }
      } catch {}

      // Fallback nếu không tìm thấy
      const fallbackList = localStorage.getItem('rchg_quiz_packages');
      if (fallbackList) {
        try {
          const list: QuizPackage[] = JSON.parse(fallbackList);
          if (list[0]) {
            setQuiz(list[0]);
            setLoading(false);
            return;
          }
        } catch {}
      }
      setLoading(false);
    };

    loadQuizData();

    return () => {
      quizAudio.stopMusic();
    };
  }, [quizId]);

  // Bộ đếm ngược thời gian
  useEffect(() => {
    if (step !== 'exam' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          showToast('Đã hết thời gian làm bài! Hệ thống tự động thu bài.', 'warning');
          handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Cuộn nút câu hỏi đang chọn vào giữa thanh ribbon trên Mobile
  useEffect(() => {
    if (activeBtnRef.current && ribbonRef.current) {
      activeBtnRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIdx]);

  // Bật/tắt hoặc đổi track nhạc nền
  const handleToggleMusic = async () => {
    if (isMusicOn) {
      quizAudio.stopMusic();
      setIsMusicOn(false);
      showToast('Đã tắt nhạc nền.', 'info');
    } else {
      const trackToPlay = selectedTrack === 'none' ? 'lofi' : selectedTrack;
      setSelectedTrack(trackToPlay);
      await quizAudio.startMusic(trackToPlay);
      setIsMusicOn(true);
      showToast('Đã bật nhạc nền thư giãn.', 'success');
    }
  };

  const handleSelectTrack = async (track: MusicTrack) => {
    setSelectedTrack(track);
    if (track === 'none') {
      quizAudio.stopMusic();
      setIsMusicOn(false);
      showToast('Đã tắt nhạc nền.', 'info');
    } else {
      await quizAudio.startMusic(track);
      setIsMusicOn(true);
      showToast(`Đang phát nhạc: ${getTrackLabel(track)}`, 'success');
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    quizAudio.setVolume(newVol / 100);
  };

  const handleTestAudio = async () => {
    const ok = await quizAudio.testSound();
    if (ok) {
      showToast('Đã phát âm thanh thử nghiệm qua loa!', 'success');
    } else {
      showToast('Trình duyệt chưa cho phép phát âm thanh. Vui lòng bấm chạm màn hình!', 'warning');
    }
  };

  const getTrackLabel = (track: MusicTrack) => {
    switch (track) {
      case 'lofi': return 'Lofi Hip-Hop Chill ☕';
      case 'piano': return 'Piano Thư Giãn 🎹';
      case 'ambient': return 'Âm Hưởng Tự Nhiên 🌊';
      default: return 'Không phát nhạc 🔇';
    }
  };

  // Bắt đầu làm bài thi
  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentId.trim()) {
      showToast('Vui lòng nhập họ tên và mã số / lớp!', 'warning');
      return;
    }
    if (!quiz) return;

    if (!quiz.isOpen) {
      showToast('Phòng thi hiện đang tạm khóa!', 'error');
      return;
    }

    // Khởi tạo AudioContext từ user gesture
    await quizAudio.initContext();

    // Chọn câu hỏi theo chiến lược cấu hình
    let pool = [...quiz.questions];
    if (quiz.settings?.questionSelectionMode === 'custom_difficulty' && quiz.settings?.difficultyDistribution) {
      const easyPool = pool.filter(q => q.difficulty === 'easy');
      const medPool = pool.filter(q => q.difficulty === 'medium');
      const hardPool = pool.filter(q => q.difficulty === 'hard');

      const shuffle = (arr: any[]) => [...arr].sort(() => 0.5 - Math.random());
      const selected = [
        ...shuffle(easyPool).slice(0, quiz.settings.difficultyDistribution.easyCount || 0),
        ...shuffle(medPool).slice(0, quiz.settings.difficultyDistribution.mediumCount || 0),
        ...shuffle(hardPool).slice(0, quiz.settings.difficultyDistribution.hardCount || 0)
      ];
      pool = selected.length > 0 ? selected : pool;
    }

    if (quiz.settings?.shuffleQuestions) {
      pool = pool.sort(() => 0.5 - Math.random());
    }

    setActiveQuestions(pool);
    setTimeLeft((quiz.settings?.timeLimitMinutes || 0) * 60);
    setStep('exam');
    setCurrentIdx(0);
    setAnswers({});

    // Bật nhạc nền nếu được cài đặt
    const targetTrack = quiz.settings?.bgMusicType && quiz.settings.bgMusicType !== 'none'
      ? quiz.settings.bgMusicType
      : selectedTrack;
    
    if (targetTrack && targetTrack !== 'none') {
      setSelectedTrack(targetTrack);
      await quizAudio.startMusic(targetTrack);
      setIsMusicOn(true);
    } else {
      quizAudio.playNavSound();
    }
  };

  // Chuyển câu hỏi
  const goToQuestion = (idx: number) => {
    if (idx < 0 || idx >= activeQuestions.length) return;
    setCurrentIdx(idx);
    quizAudio.playNavSound();
  };

  // Nộp bài thi & Chấm điểm tự động
  const handleSubmitExam = (force = false) => {
    if (!force) {
      const unanswered = activeQuestions.filter(q => answers[q.id] === undefined || answers[q.id] === '');
      let confirmMsg = 'Bạn có chắc chắn muốn nộp bài thi?';
      if (unanswered.length > 0) {
        confirmMsg = `CẢNH BÁO: Còn ${unanswered.length} câu hỏi bạn chưa hoàn thành. Bạn có chắc chắn muốn nộp bài?`;
      }
      if (!confirm(confirmMsg)) return;
    }

    quizAudio.stopMusic();
    setIsMusicOn(false);
    quizAudio.playSuccessSound();

    let earned = 0;
    let total = 0;
    const rev: { q: QuizQuestion; userAns: any; isCorrect: boolean }[] = [];

    activeQuestions.forEach(q => {
      const pts = q.points || 1;
      total += pts;
      let isCorrect = false;
      const userAns = answers[q.id];

      if (q.type === 'choice') {
        isCorrect = userAns === q.correctAnswer;
      } else if (q.type === 'multiple_choice') {
        if (Array.isArray(userAns) && Array.isArray(q.correctAnswers)) {
          const s1 = [...userAns].sort().join('|');
          const s2 = [...q.correctAnswers].sort().join('|');
          isCorrect = s1 === s2;
        }
      } else if (q.type === 'fill_blank') {
        const correctList = (q.correctAnswer || '').split(';').map(s => s.trim().toLowerCase());
        const userTrim = (userAns || '').trim().toLowerCase();
        isCorrect = correctList.includes(userTrim);
      } else if (q.type === 'matching') {
        if (typeof userAns === 'object' && userAns !== null && q.matchingPairs) {
          isCorrect = q.matchingPairs.every(p => userAns[p.left] === p.right);
        }
      } else if (q.type === 'essay') {
        const keywords = (q.correctAnswer || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        const userText = (userAns || '').toLowerCase();
        if (keywords.length > 0) {
          const matchCount = keywords.filter(k => userText.includes(k)).length;
          isCorrect = matchCount >= Math.ceil(keywords.length / 2);
        } else {
          isCorrect = (userAns || '').trim().length > 10;
        }
      }

      if (isCorrect) earned += pts;
      rev.push({ q, userAns, isCorrect });
    });

    const finalScore = total > 0 ? Number(((earned / total) * 10).toFixed(1)) : 0;
    const passThreshold = quiz?.settings?.passingScorePercent || 50;
    const isPassed = ((finalScore / 10) * 100) >= passThreshold;

    const totalLimitSec = (quiz?.settings?.timeLimitMinutes || 0) * 60;
    const spentSec = totalLimitSec > 0 ? Math.max(1, totalLimitSec - timeLeft) : 60;

    const sub: StudentSubmission = {
      id: `sub-${Date.now()}`,
      quizId: quiz?.id || '',
      quizTitle: quiz?.title || 'Bài thi trắc nghiệm',
      studentName: studentName.trim(),
      studentId: studentId.trim(),
      className: className.trim() || 'Tự do',
      email: studentEmail.trim() || undefined,
      score: finalScore,
      totalPoints: total,
      percentage: Math.round((finalScore / 10) * 100),
      passed: isPassed,
      timeSpentSeconds: spentSec,
      submittedAt: new Date().toISOString(),
      answers
    };

    setSubmissionResult(sub);
    setReviewList(rev);
    setStep('result');

    // Lưu vào localStorage
    try {
      const prev = localStorage.getItem('rchg_quiz_submissions');
      const list = prev ? JSON.parse(prev) : [];
      list.unshift(sub);
      localStorage.setItem('rchg_quiz_submissions', JSON.stringify(list));
    } catch {}

    // Lưu vào Neon Postgres
    fetch('/api/quiz-api?action=save-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub)
    }).catch(() => {});
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = activeQuestions.filter(q => answers[q.id] !== undefined && answers[q.id] !== '').length;
  const progressPercent = activeQuestions.length > 0 ? Math.round((answeredCount / activeQuestions.length) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div className="spinner" style={{ width: 44, height: 44, border: '4px solid rgba(99, 102, 241, 0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Đang nạp đề thi trực tuyến...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="exam-page-container">
        <div className="exam-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Không tìm thấy đề thi!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Đề thi có thể đã bị xóa hoặc đường dẫn không chính xác.</p>
          <button className="btn btn-primary" onClick={() => navigate('/quan-ly-thi-trac-nghiem')}>
            Về Trang Quản Trị
          </button>
        </div>
      </div>
    );
  }

  const currentQ = activeQuestions[currentIdx];

  return (
    <div className="exam-page-container">
      {/* HEADER PHÒNG THI */}
      <header className="exam-header">
        <div className="exam-header-left">
          <h1 className="exam-title-text" title={quiz.title}>
            {quiz.title}
          </h1>
          <p className="exam-sub-text">
            <span>{quiz.subject}</span> • <span>{activeQuestions.length || quiz.questions.length} câu hỏi</span>
          </p>
        </div>

        <div className="exam-header-right">
          {step === 'exam' && timeLeft > 0 && (
            <div className={`exam-timer-box ${timeLeft < 60 ? 'urgent' : ''}`}>
              <Clock size={15} /> <span>{formatTimer(timeLeft)}</span>
            </div>
          )}

          {/* Nút Xem Lưới Câu Hỏi trên Mobile */}
          {step === 'exam' && (
            <button
              type="button"
              className="btn btn-outline btn-icon-round"
              onClick={() => setShowGridModal(true)}
              title="Danh sách câu hỏi"
            >
              <LayoutGrid size={16} />
            </button>
          )}

          {/* Nút Âm Thanh / Nhạc Nền */}
          <button 
            type="button" 
            className={`btn btn-outline btn-icon-round ${isMusicOn ? 'active-audio' : ''}`}
            onClick={() => setShowAudioModal(true)}
            title="Cài đặt âm thanh & nhạc nền"
          >
            {isMusicOn ? <Volume2 size={16} color="var(--primary)" /> : <VolumeX size={16} />}
          </button>
        </div>
      </header>

      {/* THANH TIẾN ĐỘ LÀM BÀI TRÊN MOBILE */}
      {step === 'exam' && (
        <div className="exam-progress-bar-wrap">
          <div className="exam-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      )}

      {/* BƯỚC 1: ĐIỀN THÔNG TIN THÍ SINH */}
      {step === 'register' && (
        <div className="exam-panel animate-fade-in">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--primary)" /> Thông Tin Thí Sinh & Quy Chế Thi
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            {quiz.description || 'Chào mừng bạn tham gia bài thi. Vui lòng nhập đầy đủ thông tin bên dưới để bắt đầu.'}
          </p>

          <form onSubmit={handleStartExam}>
            <div className="exam-form-grid">
              <div className="exam-form-group">
                <label className="exam-label">Họ và tên thí sinh *</label>
                <input 
                  type="text" 
                  className="exam-input" 
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              <div className="exam-form-group">
                <label className="exam-label">Lớp / Khóa học</label>
                <input 
                  type="text" 
                  className="exam-input" 
                  placeholder="Ví dụ: DƯỢC-K18"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>

              <div className="exam-form-group">
                <label className="exam-label">Mã sinh viên (MSSV / SBD) *</label>
                <input 
                  type="text" 
                  className="exam-input" 
                  required
                  placeholder="Ví dụ: 20240199 hoặc SBD"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>

              <div className="exam-form-group">
                <label className="exam-label">Email sinh viên (Tùy chọn)</label>
                <input 
                  type="email" 
                  className="exam-input" 
                  placeholder="name@student.edu.vn"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="exam-rules-box">
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                📋 Tóm tắt quy chế thi:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <li>Thời gian làm bài: <strong>{(quiz.settings?.timeLimitMinutes || 0) > 0 ? `${quiz.settings.timeLimitMinutes} phút` : 'Không giới hạn thời gian'}</strong>.</li>
                <li>Điểm chuẩn đạt yêu cầu: <strong>{quiz.settings?.passingScorePercent || 50}%</strong> trở lên.</li>
                <li>Hệ thống tự động chấm điểm và công bố kết quả ngay khi nộp bài.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', maxWidth: '320px' }}>
                🚀 Bắt Đầu Làm Bài Thi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BƯỚC 2: MÀN HÌNH LÀM BÀI THI */}
      {step === 'exam' && currentQ && (
        <div className="exam-panel exam-question-box animate-fade-in">
          {/* Thanh cuộn ngang các câu hỏi (Mobile Ribbon) */}
          <div className="exam-palette-container">
            <div className="exam-palette-header">
              <span className="exam-palette-count">
                Đã hoàn thành: <strong>{answeredCount}/{activeQuestions.length}</strong> câu ({progressPercent}%)
              </span>
              <button 
                type="button" 
                className="exam-palette-view-all-btn"
                onClick={() => setShowGridModal(true)}
              >
                <LayoutGrid size={13} /> Danh sách 30 câu
              </button>
            </div>

            <div className="exam-palette-ribbon" ref={ribbonRef}>
              {activeQuestions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                const isCur = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    ref={isCur ? activeBtnRef : null}
                    type="button"
                    className={`exam-palette-btn ${isCur ? 'active' : ''} ${isAnswered ? 'answered' : ''}`}
                    onClick={() => goToQuestion(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chi tiết câu hỏi */}
          <div className="exam-q-content">
            <div className="exam-q-meta">
              <span className="exam-badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                Câu {currentIdx + 1}/{activeQuestions.length}
              </span>
              <span className={`exam-badge exam-badge-${currentQ.difficulty}`}>
                {currentQ.difficulty === 'easy' ? 'DỄ' : (currentQ.difficulty === 'medium' ? 'TRUNG BÌNH' : 'KHÓ')}
              </span>
              <span className="exam-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                {currentQ.type === 'choice' ? 'TRẮC NGHIỆM ABCD' : (currentQ.type === 'multiple_choice' ? 'CHỌN NHIỀU ĐÁP ÁN' : (currentQ.type === 'fill_blank' ? 'ĐIỀN KHUYẾT' : (currentQ.type === 'matching' ? 'GHÉP NỐI' : 'TỰ LUẬN')))}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                ({currentQ.points || 1} điểm)
              </span>
            </div>

            <div className="exam-q-title">{currentQ.question}</div>

            {/* Hiển thị hình ảnh câu hỏi nếu có */}
            {currentQ.imageUrl && (
              <div className="exam-q-image-wrap">
                <img 
                  src={currentQ.imageUrl} 
                  alt="Hình ảnh câu hỏi" 
                  className="exam-q-image" 
                  onClick={() => window.open(currentQ.imageUrl, '_blank')} 
                />
                <span className="exam-q-image-hint">🔍 Nhấp vào ảnh để xem kích thước lớn</span>
              </div>
            )}

            {/* Trắc nghiệm ABCD */}
            {currentQ.type === 'choice' && currentQ.options && (
              <div className="exam-options-grid">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = answers[currentQ.id] === opt;
                  const char = String.fromCharCode(65 + idx);
                  return (
                    <div 
                      key={idx}
                      className={`exam-opt-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setAnswers(prev => ({ ...prev, [currentQ.id]: opt }));
                        quizAudio.playClickSound();
                      }}
                    >
                      <span className="exam-opt-char">{char}</span>
                      <span className="exam-opt-text">{opt}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Chọn nhiều đáp án */}
            {currentQ.type === 'multiple_choice' && currentQ.options && (
              <div className="exam-options-grid">
                {currentQ.options.map((opt, idx) => {
                  const currentSelected = answers[currentQ.id] || [];
                  const isSelected = currentSelected.includes(opt);
                  const char = String.fromCharCode(65 + idx);
                  return (
                    <div 
                      key={idx}
                      className={`exam-opt-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        const updated = isSelected 
                          ? currentSelected.filter((x: string) => x !== opt)
                          : [...currentSelected, opt];
                        setAnswers(prev => ({ ...prev, [currentQ.id]: updated }));
                        quizAudio.playClickSound();
                      }}
                    >
                      <span className="exam-opt-char">{char}</span>
                      <span className="exam-opt-text">{opt}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Điền khuyết */}
            {currentQ.type === 'fill_blank' && (
              <div>
                <input 
                  type="text" 
                  className="exam-input" 
                  placeholder="Gõ câu trả lời của bạn vào đây..."
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                />
              </div>
            )}

            {/* Ghép nối cặp */}
            {currentQ.type === 'matching' && currentQ.matchingPairs && (
              <div>
                {(() => {
                  const userMatches = answers[currentQ.id] || {};
                  const rights = currentQ.matchingPairs.map(p => p.right).sort();
                  return currentQ.matchingPairs.map((pair, pIdx) => (
                    <div key={pIdx} className="exam-match-row">
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pair.left}</div>
                      <select 
                        className="exam-select"
                        value={userMatches[pair.left] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAnswers(prev => ({
                            ...prev,
                            [currentQ.id]: { ...(prev[currentQ.id] || {}), [pair.left]: val }
                          }));
                          quizAudio.playClickSound();
                        }}
                      >
                        <option value="">-- Chọn ghép nối --</option>
                        {rights.map((r, rIdx) => (
                          <option key={rIdx} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* Tự luận ngắn */}
            {currentQ.type === 'essay' && (
              <div>
                <textarea 
                  className="exam-textarea" 
                  rows={4}
                  placeholder="Nhập câu trả lời tự luận ngắn của bạn..."
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                />
              </div>
            )}
          </div>

          {/* THANH ĐIỀU HƯỚNG CÂU HỎI TRÊN DESKTOP */}
          <div className="exam-nav-desktop">
            <button 
              type="button" 
              className="btn btn-outline"
              disabled={currentIdx === 0}
              onClick={() => goToQuestion(currentIdx - 1)}
            >
              <ArrowLeft size={16} /> Câu trước
            </button>

            <button 
              type="button" 
              className="btn btn-primary"
              style={{ background: '#10b981', border: 'none', padding: '0.75rem 2rem' }}
              onClick={() => handleSubmitExam(false)}
            >
              <CheckCircle2 size={18} /> Nộp Bài Thi
            </button>

            <button 
              type="button" 
              className="btn btn-outline"
              disabled={currentIdx === activeQuestions.length - 1}
              onClick={() => goToQuestion(currentIdx + 1)}
            >
              Câu sau <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* THANH ĐIỀU HƯỚNG CỐ ĐỊNH Ở ĐÁY MÀN HÌNH CHO MOBILE (STICKY BOTTOM BAR) */}
      {step === 'exam' && (
        <div className="exam-bottom-sticky-bar">
          <button 
            type="button" 
            className="btn btn-outline exam-mobile-btn"
            disabled={currentIdx === 0}
            onClick={() => goToQuestion(currentIdx - 1)}
          >
            <ArrowLeft size={16} /> Trước
          </button>

          <button 
            type="button" 
            className="btn btn-primary exam-mobile-btn-submit"
            onClick={() => handleSubmitExam(false)}
          >
            <CheckCircle2 size={16} /> Nộp bài
          </button>

          <button 
            type="button" 
            className="btn btn-outline exam-mobile-btn"
            disabled={currentIdx === activeQuestions.length - 1}
            onClick={() => goToQuestion(currentIdx + 1)}
          >
            Sau <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* BƯỚC 3: KẾT QUẢ & CHỨNG NHẬN ĐIỂM SỐ */}
      {step === 'result' && submissionResult && (
        <div className="exam-panel animate-fade-in" style={{ textAlign: 'center' }}>
          <div className={`exam-score-circle ${submissionResult.passed ? 'passed' : 'failed'}`}>
            {submissionResult.score}
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
            {submissionResult.passed ? '🎉 CHÚC MỪNG: BẠN ĐÃ ĐẠT!' : '⚠️ KẾT QUẢ CHƯA ĐẠT CHUẨN'}
          </h2>

          <div style={{ display: 'inline-block', background: 'var(--bg-primary)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
            Thí sinh: <strong>{submissionResult.studentName}</strong> • SBD: <strong>{submissionResult.studentId}</strong>
          </div>

          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: '0 0 1.75rem' }}>
            Điểm số: <strong>{submissionResult.score}/10 điểm ({submissionResult.percentage}%)</strong> • Chuẩn qua môn: {quiz.settings?.passingScorePercent || 50}%.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={() => setStep('register')}>
              <RotateCcw size={16} /> Làm Lại Bài Thi
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/quan-ly-thi-trac-nghiem')}>
              Về Trang Quản Trị
            </button>
          </div>

          {/* Chi tiết lời giải & đối chiếu đáp án (Chỉ hiển thị khi giáo viên cho phép) */}
          {quiz.settings?.showCorrectAnswersAfterSubmit ? (
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                📋 Chi Tiết Từng Câu Hỏi:
              </h3>

              {reviewList.map((item, idx) => {
                let correctDisplay = item.q.correctAnswer || (item.q.correctAnswers || []).join(', ');
                if (item.q.type === 'matching' && item.q.matchingPairs) {
                  correctDisplay = item.q.matchingPairs.map(p => `${p.left} ➔ ${p.right}`).join(' | ');
                }

                return (
                  <div key={item.q.id} className={`exam-review-card ${item.isCorrect ? 'is-correct' : 'is-wrong'}`}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                      Câu {idx + 1}: {item.q.question}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: item.isCorrect ? '#10b981' : '#ef4444' }}>
                      {item.isCorrect ? '✅ Bạn đã trả lời chính xác!' : `❌ Câu trả lời của bạn: ${typeof item.userAns === 'object' ? JSON.stringify(item.userAns) : (item.userAns || 'Chưa trả lời')}`}
                    </div>
                    {!item.isCorrect && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                        💡 Đáp án đúng: <strong>{correctDisplay}</strong>
                      </div>
                    )}
                    {item.q.explanation && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.3rem' }}>
                        Giải thích: {item.q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ 
              margin: '1.5rem auto 0', 
              padding: '1.25rem 1.5rem', 
              background: 'var(--bg-primary)', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--border)',
              maxWidth: '540px',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>🔒</div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                Không hiển thị chi tiết bài làm
              </strong>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                Giáo viên đã cấu hình không hiển thị chi tiết các câu hỏi và đáp án cho bài thi này để bảo mật đề thi.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL CÀI ĐẶT ÂM THANH & NHẠC NỀN */}
      {showAudioModal && (
        <div className="exam-modal-overlay" onClick={() => setShowAudioModal(false)}>
          <div className="exam-modal-card" onClick={e => e.stopPropagation()}>
            <div className="exam-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <Music size={18} color="var(--primary)" /> Âm Thanh & Nhạc Nền Thư Giãn
              </h3>
              <button 
                type="button" 
                className="btn btn-outline btn-icon-round"
                style={{ width: 32, height: 32 }}
                onClick={() => setShowAudioModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="exam-modal-body">
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="exam-label" style={{ marginBottom: '0.6rem' }}>Chọn bản nhạc nền:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(['lofi', 'piano', 'ambient', 'none'] as MusicTrack[]).map(t => {
                    const isCur = selectedTrack === t && (t === 'none' ? !isMusicOn : isMusicOn);
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`exam-track-btn ${isCur ? 'active' : ''}`}
                        onClick={() => handleSelectTrack(t)}
                      >
                        <span>{getTrackLabel(t)}</span>
                        {isCur && <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>Đang phát</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="exam-label" style={{ margin: 0 }}>Âm lượng nhạc & hiệu ứng:</label>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{volume}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, fontSize: '0.88rem' }}
                  onClick={handleTestAudio}
                >
                  <Play size={14} /> Thử loa (Test)
                </button>
                <button
                  type="button"
                  className={`btn ${isMusicOn ? 'btn-outline' : 'btn-primary'}`}
                  style={{ flex: 1, fontSize: '0.88rem' }}
                  onClick={handleToggleMusic}
                >
                  {isMusicOn ? 'Tắt nhạc' : 'Bật nhạc ngay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM TOÀN BỘ 30 CÂU HỎI TRÊN MOBILE */}
      {showGridModal && (
        <div className="exam-modal-overlay" onClick={() => setShowGridModal(false)}>
          <div className="exam-modal-card exam-modal-grid-card" onClick={e => e.stopPropagation()}>
            <div className="exam-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <LayoutGrid size={18} color="var(--primary)" /> Danh Sách Câu Hỏi ({activeQuestions.length})
              </h3>
              <button 
                type="button" 
                className="btn btn-outline btn-icon-round"
                style={{ width: 32, height: 32 }}
                onClick={() => setShowGridModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="exam-modal-body">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981', display: 'inline-block' }} /> Đã làm ({answeredCount})
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--bg-primary)', border: '1.5px solid var(--border)', display: 'inline-block' }} /> Chưa làm ({activeQuestions.length - answeredCount})
                </span>
              </div>

              <div className="exam-full-grid">
                {activeQuestions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                  const isCur = idx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      className={`exam-grid-btn ${isCur ? 'active' : ''} ${isAnswered ? 'answered' : ''}`}
                      onClick={() => {
                        goToQuestion(idx);
                        setShowGridModal(false);
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

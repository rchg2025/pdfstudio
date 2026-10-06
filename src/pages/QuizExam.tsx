import { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import type { QuizPackage, QuizQuestion, StudentSubmission } from '../types/quiz';
import { quizAudio } from '../utils/quizAudio';
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
  const [submissionResult, setSubmissionResult] = useState<StudentSubmission | null>(null);
  const [reviewList, setReviewList] = useState<{ q: QuizQuestion; userAns: any; isCorrect: boolean }[]>([]);

  // Tải dữ liệu đề thi
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        // 1. Kiểm tra localStorage trước
        const local = localStorage.getItem('rchg_quiz_packages');
        if (local) {
          const list: QuizPackage[] = JSON.parse(local);
          const found = list.find(q => q.id === quizId || q.code === quizId);
          if (found) {
            setQuiz(found);
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

  // Bật/tắt nhạc nền
  const toggleMusic = () => {
    if (!quiz) return;
    if (isMusicOn) {
      quizAudio.stopMusic();
      setIsMusicOn(false);
    } else {
      const track = quiz.settings.bgMusicType === 'none' ? 'lofi' : quiz.settings.bgMusicType;
      quizAudio.startMusic(track);
      setIsMusicOn(true);
    }
  };

  // Bắt đầu làm bài thi
  const handleStartExam = (e: React.FormEvent) => {
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

    // Chọn câu hỏi theo chiến lược cấu hình
    let pool = [...quiz.questions];
    if (quiz.settings.questionSelectionMode === 'custom_difficulty' && quiz.settings.difficultyDistribution) {
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

    if (quiz.settings.shuffleQuestions) {
      pool = pool.sort(() => 0.5 - Math.random());
    }

    setActiveQuestions(pool);
    setTimeLeft((quiz.settings.timeLimitMinutes || 0) * 60);
    setStep('exam');
    setCurrentIdx(0);
    setAnswers({});

    // Bật nhạc nền tự động nếu được cấu hình
    if (quiz.settings.bgMusicType !== 'none') {
      quizAudio.startMusic(quiz.settings.bgMusicType);
      setIsMusicOn(true);
    }
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
        const u = (userAns || []).sort().join('|');
        const c = (q.correctAnswers || []).sort().join('|');
        isCorrect = u === c;
      } else if (q.type === 'fill_blank') {
        const cleanUser = (userAns || '').trim().toLowerCase();
        const cleanCorrect = (q.correctAnswer || '').split(/[;/]+/).map(s => s.trim().toLowerCase());
        isCorrect = cleanCorrect.includes(cleanUser);
      } else if (q.type === 'matching') {
        let allMatch = true;
        (q.matchingPairs || []).forEach(p => {
          if ((userAns || {})[p.left] !== p.right) allMatch = false;
        });
        isCorrect = allMatch && (q.matchingPairs || []).length > 0;
      } else if (q.type === 'essay') {
        const keywords = (q.correctAnswer || '').toLowerCase().split(/[,;]+/).map(s => s.trim());
        const userText = (userAns || '').toLowerCase();
        isCorrect = keywords.some(k => k && userText.includes(k));
      }

      if (isCorrect) earned += pts;
      rev.push({ q, userAns, isCorrect });
    });

    const score10 = Math.round((earned / (total || 1)) * 100) / 10;
    const percentage = Math.round((earned / (total || 1)) * 100);
    const passed = percentage >= (quiz?.settings.passingScorePercent || 50);

    const sub: StudentSubmission = {
      id: `sub-${Date.now()}`,
      quizId: quiz?.id || '',
      quizTitle: quiz?.title || '',
      studentName: studentName.trim(),
      studentId: studentId.trim(),
      className: className.trim(),
      email: studentEmail.trim() || undefined,
      score: score10,
      totalPoints: 10,
      percentage,
      passed,
      timeSpentSeconds: ((quiz?.settings.timeLimitMinutes || 0) * 60) - timeLeft,
      submittedAt: new Date().toISOString(),
      answers
    };

    setSubmissionResult(sub);
    setReviewList(rev);
    setStep('result');

    // Lưu vào localStorage
    try {
      const stored = localStorage.getItem('rchg_quiz_submissions');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(sub);
      localStorage.setItem('rchg_quiz_submissions', JSON.stringify(list));
    } catch {}

    // Lưu lên API Backend
    fetch('/api/quiz-api?action=submit-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub)
    }).catch(() => {});

    quizAudio.playSuccessSound();
    showToast(`Nộp bài thành công! Điểm số: ${score10}/10 điểm (${percentage}%)`, passed ? 'success' : 'info');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
        Đang tải dữ liệu đề thi...
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="exam-page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ color: 'var(--text-primary)' }}>Không tìm thấy phòng thi</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Mã phòng thi không tồn tại hoặc đã bị xóa.</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/quan-ly-thi-trac-nghiem')}>
          Về trang Quản lý đề thi
        </button>
      </div>
    );
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const currentQ = activeQuestions[currentIdx];

  return (
    <div className="exam-page-container animate-fade-in">
      {/* Top Header */}
      <header className="exam-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {quiz.title}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
            {quiz.subject} • {activeQuestions.length || quiz.questions.length} câu hỏi
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {step === 'exam' && timeLeft > 0 && (
            <div className={`exam-timer-box ${timeLeft < 60 ? 'urgent' : ''}`}>
              <Clock size={16} /> {formatTimer(timeLeft)}
            </div>
          )}

          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            onClick={toggleMusic}
            title={isMusicOn ? 'Tắt nhạc nền' : 'Bật nhạc thư giãn'}
            style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
          >
            {isMusicOn ? <Volume2 size={16} color="var(--primary)" /> : <VolumeX size={16} />}
          </button>
        </div>
      </header>

      {/* BƯỚC 1: ĐIỀN THÔNG TIN THÍ SINH */}
      {step === 'register' && (
        <div className="exam-panel animate-fade-in">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--primary)" /> Thông Tin Thí Sinh & Quy Chế Thi
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {quiz.description || 'Chào mừng bạn tham gia bài thi. Vui lòng nhập đầy đủ thông tin bên dưới để bắt đầu.'}
          </p>

          <form onSubmit={handleStartExam}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="qm-label">Họ và tên thí sinh *</label>
                <input 
                  type="text" 
                  className="qm-input" 
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              <div>
                <label className="qm-label">Lớp / Khóa học</label>
                <input 
                  type="text" 
                  className="qm-input" 
                  placeholder="Ví dụ: DƯỢC-K18"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>

              <div>
                <label className="qm-label">Mã sinh viên (MSSV) *</label>
                <input 
                  type="text" 
                  className="qm-input" 
                  required
                  placeholder="Ví dụ: 20240199 hoặc SBD"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>

              <div>
                <label className="qm-label">Email sinh viên (Tùy chọn)</label>
                <input 
                  type="email" 
                  className="qm-input" 
                  placeholder="name@student.edu.vn"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                📋 Tóm tắt quy chế thi:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <li>Thời gian làm bài: <strong>{quiz.settings.timeLimitMinutes > 0 ? `${quiz.settings.timeLimitMinutes} phút` : 'Không giới hạn thời gian'}</strong>.</li>
                <li>Điểm chuẩn đạt yêu cầu: <strong>{quiz.settings.passingScorePercent}%</strong> trở lên.</li>
                <li>Hệ thống tự động chấm điểm và công bố kết quả ngay khi bấm nộp bài hoặc hết thời gian.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">
                🚀 Bắt Đầu Làm Bài Thi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BƯỚC 2: MÀN HÌNH LÀM BÀI THI */}
      {step === 'exam' && currentQ && (
        <div className="exam-panel animate-fade-in">
          {/* Palette câu hỏi */}
          <div className="exam-palette">
            {activeQuestions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
              const isCur = idx === currentIdx;
              return (
                <button
                  key={q.id}
                  type="button"
                  className={`exam-palette-btn ${isCur ? 'active' : ''} ${isAnswered ? 'answered' : ''}`}
                  onClick={() => setCurrentIdx(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Chi tiết câu hỏi */}
          <div>
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

            {/* Trắc nghiệm ABCD */}
            {currentQ.type === 'choice' && currentQ.options && (
              <div className="exam-options-grid">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = answers[currentQ.id] === opt;
                  const char = ['A', 'B', 'C', 'D', 'E', 'F'][idx] || idx + 1;
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
                      <span>{opt}</span>
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
                  const char = ['A', 'B', 'C', 'D', 'E', 'F'][idx] || idx + 1;
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
                      <span>{opt}</span>
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
                  className="qm-input" 
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
                        className="qm-select"
                        value={userMatches[pair.left] || ''}
                        onChange={(e) => {
                          const updated = { ...userMatches, [pair.left]: e.target.value };
                          setAnswers(prev => ({ ...prev, [currentQ.id]: updated }));
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
                  className="qm-textarea" 
                  rows={4}
                  placeholder="Nhập câu trả lời tự luận ngắn của bạn..."
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                />
              </div>
            )}
          </div>

          {/* Thanh điều hướng câu hỏi */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <button 
              type="button" 
              className="btn btn-outline btn-sm"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
            >
              <ArrowLeft size={15} /> Câu trước
            </button>

            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              style={{ background: '#10b981', border: 'none' }}
              onClick={() => handleSubmitExam(false)}
            >
              <CheckCircle2 size={16} /> Nộp Bài Thi
            </button>

            <button 
              type="button" 
              className="btn btn-outline btn-sm"
              disabled={currentIdx === activeQuestions.length - 1}
              onClick={() => setCurrentIdx(prev => prev + 1)}
            >
              Câu sau <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* BƯỚC 3: KẾT QUẢ & CHỨNG NHẬN ĐIỂM SỐ */}
      {step === 'result' && submissionResult && (
        <div className="exam-panel animate-fade-in" style={{ textAlign: 'center' }}>
          <div className={`exam-score-circle ${submissionResult.passed ? 'passed' : 'failed'}`}>
            {submissionResult.score}
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
            {submissionResult.passed ? '🎉 CHÚC MỪNG: BẠN ĐÃ ĐẠT!' : '⚠️ KẾT QUẢ CHƯA ĐẠT CHUẨN'}
          </h2>

          <div style={{ display: 'inline-block', background: 'var(--bg-primary)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
            Thí sinh: <strong>{submissionResult.studentName}</strong> • Lớp/MSSV: <strong>{submissionResult.studentId}</strong>
          </div>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0 0 2rem' }}>
            Điểm số: <strong>{submissionResult.score}/10 điểm ({submissionResult.percentage}%)</strong> • Chuẩn qua môn: {quiz.settings.passingScorePercent}%.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setStep('register')}>
              <RotateCcw size={15} /> Làm Lại Bài Thi
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/quan-ly-thi-trac-nghiem')}>
              Về Trang Quản Trị
            </button>
          </div>

          {/* Chi tiết lời giải & đối chiếu đáp án */}
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              📋 Chi Tiết Từng Câu Hỏi:
            </h3>

            {reviewList.map((item, idx) => {
              let correctDisplay = item.q.correctAnswer || (item.q.correctAnswers || []).join(', ');
              if (item.q.type === 'matching' && item.q.matchingPairs) {
                correctDisplay = item.q.matchingPairs.map(p => `${p.left} ➔ ${p.right}`).join(' | ');
              }

              return (
                <div key={item.q.id} className={`exam-review-card ${item.isCorrect ? 'is-correct' : 'is-wrong'}`}>
                  <div style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    Câu {idx + 1}: {item.q.question}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: item.isCorrect ? '#10b981' : '#ef4444' }}>
                    {item.isCorrect ? '✅ Bạn đã trả lời chính xác!' : `❌ Câu trả lời của bạn: ${typeof item.userAns === 'object' ? JSON.stringify(item.userAns) : (item.userAns || 'Chưa trả lời')}`}
                  </div>
                  {!item.isCorrect && (
                    <div style={{ fontSize: '0.88rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                      💡 Đáp án đúng: <strong>{correctDisplay}</strong>
                    </div>
                  )}
                  {item.q.explanation && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.35rem' }}>
                      Giải thích: {item.q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

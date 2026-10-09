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
  Sparkles,
  LayoutGrid,
  Music,
  X,
  Play,
  ShieldAlert,
  AlertTriangle,
  Maximize2,
  Upload,
  Loader2,
  Paperclip,
  ExternalLink,
  Check,
  Trash2
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import type { QuizPackage, QuizQuestion, StudentSubmission } from '../types/quiz';
import { quizAudio, type MusicTrack } from '../utils/quizAudio';
import { getSafeImageUrl, handleImageError, extractQuestionImage } from '../utils/imageUrl';
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
  const [uploadingQId, setUploadingQId] = useState<string | null>(null);

  // Chống gian lận / Khóa chuyển tab & ứng dụng
  const [violationCount, setViolationCount] = useState<number>(0);
  const [violationReason, setViolationReason] = useState<string>('');
  const [showViolationModal, setShowViolationModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const activeBtnRef = useRef<HTMLButtonElement | null>(null);
  const ribbonRef = useRef<HTMLDivElement | null>(null);

  // Tải dữ liệu đề thi
  useEffect(() => {
    const loadQuizData = async () => {
      setLoading(true);
      try {
        // 1. Quét tất cả các key localStorage (bao gồm rchg_quiz_packages_* của từng user)
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('rchg_quiz_packages')) {
            try {
              const val = localStorage.getItem(key);
              if (val) {
                const list: QuizPackage[] = JSON.parse(val);
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
            } catch {}
          }
        }

        // 2. Tải từ API Backend (Neon Postgres) bằng id hoặc mã code phòng thi
        const isCodeParam = quizId && /^\d{6}$/.test(quizId);
        const endpoint = isCodeParam 
          ? `/api/quiz-api?action=get-quizzes&code=${encodeURIComponent(quizId)}`
          : `/api/quiz-api?action=get-quizzes&id=${encodeURIComponent(quizId || '')}`;
        
        const res = await fetch(endpoint);
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
      } catch (err) {
        console.error('Lỗi khi nạp dữ liệu đề thi:', err);
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
      const trackToPlay = selectedTrack === 'none' 
        ? (quiz?.settings?.bgMusicType && quiz.settings.bgMusicType !== 'none' ? quiz.settings.bgMusicType : 'lofi') 
        : selectedTrack;
      setSelectedTrack(trackToPlay);
      await quizAudio.startMusic(trackToPlay, quiz?.settings?.bgMusicUrl);
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
      await quizAudio.startMusic(track, quiz?.settings?.bgMusicUrl);
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
      case 'custom': return 'Nhạc Tùy Chỉnh (Link giáo viên) 🎶';
      default: return 'Không phát nhạc 🔇';
    }
  };

  // === BẢO MẬT & CHỐNG GIAN LẬN: KHÓA CHUYỂN TRANG / CHUYỂN APP ===
  const triggerViolation = (reason: string) => {
    setViolationReason(reason);
    setViolationCount(prev => prev + 1);
    setShowViolationModal(true);
    quizAudio.playWarningSound();
  };

  const handleRequestFullscreen = async () => {
    try {
      const docEl = document.documentElement as any;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (e) {
      console.warn('Fullscreen request blocked or unsupported:', e);
    }
  };

  const handleExitFullscreen = async () => {
    try {
      const doc = document as any;
      if (document.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        }
      }
      setIsFullscreen(false);
    } catch (e) {
      console.warn('Exit fullscreen error:', e);
    }
  };

  const handleResumeExam = async () => {
    setShowViolationModal(false);
    await handleRequestFullscreen();
    quizAudio.playClickSound();
  };

  // Lắng nghe sự kiện chuyển tab, rời ứng dụng, reload, back history khi đang trong quá trình thi
  useEffect(() => {
    if (step !== 'exam') return;

    // 1. Chặn đóng tab / tải lại trang (F5, Ctrl+R, đóng trình duyệt)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Bạn đang trong quá trình làm bài thi! Rời khỏi hoặc tải lại trang có thể làm mất kết quả.';
      return e.returnValue;
    };

    // 2. Chặn nút Back / Forward trên trình duyệt
    window.history.pushState(null, '', window.location.href);
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
      triggerViolation('bấm nút quay lại (Back) của trình duyệt');
    };

    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    // 3. Bắt sự kiện chuyển tab hoặc ẩn trình duyệt (visibilitychange)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerViolation('chuyển sang tab khác hoặc thu nhỏ trình duyệt');
      }
    };

    // 4. Bắt sự kiện mất focus cửa sổ khi chuyển sang app khác (Zalo, Word, trình duyệt khác, v.v.)
    const handleWindowBlur = () => {
      // Khi đang nhúng trong iframe LMS, nếu sinh viên click vào khung LMS bên ngoài iframe thì không tính là rời app
      if (isInIframe) {
        setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            triggerViolation('chuyển sang tab khác hoặc thu nhỏ trình duyệt');
          }
        }, 300);
        return;
      }
      // Đợi nhẹ để tránh false positive từ các dropdown native
      setTimeout(() => {
        if (document.visibilityState === 'hidden' || !document.hasFocus()) {
          triggerViolation('rời khỏi cửa sổ bài thi hoặc mở ứng dụng khác');
        }
      }, 300);
    };

    // 5. Kiểm tra thoát chế độ toàn màn hình
    const handleFullscreenChange = () => {
      if (isInIframe) return; // Không bắt buộc toàn màn hình đối với sinh viên thi qua khung nhúng Iframe trên LMS
      const isFull = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFull);
      if (!isFull) {
        triggerViolation('thoát chế độ làm bài toàn màn hình');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [step]);

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

    // Bật Fullscreen để khóa không gian thi
    await handleRequestFullscreen();

    // Reset đếm vi phạm
    setViolationCount(0);
    setShowViolationModal(false);

    // Chọn câu hỏi theo chiến lược cấu hình & hình thức bài thi
    let pool = [...quiz.questions];

    // 1. Lọc theo hình thức thi nếu có cấu hình (Trắc nghiệm riêng / Tự luận, thực hành riêng / Hỗn hợp)
    const examFmt = quiz.settings?.questionFormatFilter || quiz.settings?.examFormat;
    const isChoiceType = (t: string) => ['choice', 'multiple_choice', 'fill_blank', 'matching'].includes(t);
    const isEssayOrPractical = (t: string) => t === 'essay' || t === 'practical';

    if (examFmt === 'choice_only') {
      pool = pool.filter(q => isChoiceType(q.type));
    } else if (examFmt === 'essay_practical_only') {
      pool = pool.filter(q => isEssayOrPractical(q.type));
    } else if (examFmt === 'mixed_custom' && quiz.settings?.formatDistribution) {
      const choicePool = pool.filter(q => isChoiceType(q.type));
      const essayPool = pool.filter(q => isEssayOrPractical(q.type));
      const shuffle = (arr: any[]) => [...arr].sort(() => 0.5 - Math.random());
      const selectedChoices = shuffle(choicePool).slice(0, Number(quiz.settings.formatDistribution.choiceCount) || 0);
      const selectedEssays = shuffle(essayPool).slice(0, Number(quiz.settings.formatDistribution.essayCount) || 0);
      const mixedSelected = [...selectedChoices, ...selectedEssays];
      if (mixedSelected.length > 0) {
        pool = mixedSelected;
      }
    }

    // 2. Lọc theo độ khó nếu chọn chế độ custom_difficulty
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
      await quizAudio.startMusic(targetTrack, quiz.settings?.bgMusicUrl);
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

  // Xử lý tải file đính kèm câu hỏi tự luận/thực hành lên Google Drive của hệ thống
  const handleFileUpload = async (qId: string, file: File) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      showToast('Kích thước file vượt quá giới hạn cho phép (tối đa 25MB).', 'error');
      return;
    }

    setUploadingQId(qId);
    showToast(`Đang tải file "${file.name}" lên Google Drive của hệ thống...`, 'info');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const res = await fetch('/api/qa-wall?action=upload-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64Data,
          filename: file.name,
          mimeType: file.type || 'application/octet-stream'
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Tải file thất bại');
      }

      const data = await res.json();
      const currentAns = answers[qId];
      let existingText = '';
      if (typeof currentAns === 'string') {
        existingText = currentAns;
      } else if (typeof currentAns === 'object' && currentAns !== null) {
        existingText = currentAns.text || '';
      }

      setAnswers(prev => ({
        ...prev,
        [qId]: {
          text: existingText,
          fileUrl: data.webViewLink || data.url,
          fileName: data.fileName || file.name,
          webContentLink: data.webContentLink
        }
      }));

      showToast(`Đã tải file "${file.name}" lên Google Drive thành công!`, 'success');
      quizAudio.playSuccessSound();
    } catch (err: any) {
      console.error('Lỗi khi tải file bài tập:', err);
      showToast('Lỗi khi tải file lên hệ thống: ' + (err.message || 'Vui lòng thử lại'), 'error');
    } finally {
      setUploadingQId(null);
    }
  };

  const handleRemoveFile = (qId: string) => {
    const currentAns = answers[qId];
    if (typeof currentAns === 'object' && currentAns !== null) {
      setAnswers(prev => ({
        ...prev,
        [qId]: {
          text: currentAns.text || '',
          fileUrl: undefined,
          fileName: undefined
        }
      }));
      showToast('Đã hủy đính kèm tệp tin.', 'info');
    }
  };

  // Nộp bài thi & Chấm điểm tự động
  const handleSubmitExam = (force = false) => {
    if (!force) {
      const unanswered = activeQuestions.filter(q => {
        const ans = answers[q.id];
        if (ans === undefined || ans === null || ans === '') return true;
        if (typeof ans === 'object' && !ans.text?.trim() && !ans.fileUrl) return true;
        return false;
      });

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
    let hasManualGrading = false;
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
        const userTrim = (typeof userAns === 'string' ? userAns : (userAns?.text || '')).trim().toLowerCase();
        isCorrect = correctList.includes(userTrim);
      } else if (q.type === 'matching') {
        if (typeof userAns === 'object' && userAns !== null && q.matchingPairs) {
          isCorrect = q.matchingPairs.every(p => userAns[p.left] === p.right);
        }
      } else if (q.type === 'essay' || q.type === 'practical') {
        // Đề thi có câu tự luận hoặc thực hành: KHÔNG TỰ ĐỘNG CHẤM ĐIỂM, để giảng viên tự chấm sau
        hasManualGrading = true;
        isCorrect = false; // Chờ giáo viên đánh giá
      }

      if (isCorrect) earned += pts;
      rev.push({ q, userAns, isCorrect });
    });

    const finalScore = total > 0 ? Number(((earned / total) * 10).toFixed(1)) : 0;
    const passThreshold = quiz?.settings?.passingScorePercent || 50;
    const isPassed = !hasManualGrading && ((finalScore / 10) * 100) >= passThreshold;

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
      percentage: hasManualGrading ? 0 : Math.round((finalScore / 10) * 100),
      passed: isPassed,
      timeSpentSeconds: spentSec,
      submittedAt: new Date().toISOString(),
      answers,
      violationCount,
      status: hasManualGrading ? 'PENDING_GRADING' : 'GRADED',
      hasManualGrading
    };

    setSubmissionResult(sub);
    setReviewList(rev);
    setStep('result');
    setShowViolationModal(false);
    handleExitFullscreen();

    // Lưu vào localStorage đa key để bất kể user nào mở trang quản lý đều xem được bài nộp
    try {
      const prev = localStorage.getItem('rchg_quiz_submissions');
      const list = prev ? JSON.parse(prev) : [];
      list.unshift(sub);
      localStorage.setItem('rchg_quiz_submissions', JSON.stringify(list));

      // Quét và cập nhật luôn vào các key rchg_quiz_submissions_* của giáo viên
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('rchg_quiz_submissions_')) {
          try {
            const userSubStr = localStorage.getItem(k);
            const userSubs = userSubStr ? JSON.parse(userSubStr) : [];
            userSubs.unshift(sub);
            localStorage.setItem(k, JSON.stringify(userSubs));
          } catch {}
        }
      }
    } catch {}

    // Lưu vào Neon Postgres qua backend API
    fetch('/api/quiz-api?action=submit-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub)
    }).then(async res => {
      if (!res.ok) {
        console.warn('Không thể lưu kết quả thi lên server:', await res.text());
      }
    }).catch(err => {
      console.error('Lỗi mạng khi lưu kết quả thi:', err);
    });
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

  // Tính số câu hỏi của bài thi thực tế mà thí sinh sẽ làm
  const examQuestionCount = activeQuestions.length > 0 
    ? activeQuestions.length 
    : (() => {
        if (!quiz) return 0;
        const examFmt = quiz.settings?.questionFormatFilter || quiz.settings?.examFormat;
        const isChoiceType = (t: string) => ['choice', 'multiple_choice', 'fill_blank', 'matching'].includes(t);
        const isEssayOrPractical = (t: string) => t === 'essay' || t === 'practical';

        let targetQuestions = quiz.questions;
        if (examFmt === 'choice_only') {
          targetQuestions = quiz.questions.filter(q => isChoiceType(q.type));
        } else if (examFmt === 'essay_practical_only') {
          targetQuestions = quiz.questions.filter(q => isEssayOrPractical(q.type));
        } else if (examFmt === 'mixed_custom' && quiz.settings?.formatDistribution) {
          const cCount = Number(quiz.settings.formatDistribution.choiceCount) || 0;
          const eCount = Number(quiz.settings.formatDistribution.essayCount) || 0;
          return cCount + eCount;
        }

        if (quiz.settings?.questionSelectionMode === 'custom_difficulty' && quiz.settings?.difficultyDistribution) {
          const totalFromDiff = (Number(quiz.settings.difficultyDistribution.easyCount) || 0) +
            (Number(quiz.settings.difficultyDistribution.mediumCount) || 0) +
            (Number(quiz.settings.difficultyDistribution.hardCount) || 0);
          return Math.min(totalFromDiff || targetQuestions.length, targetQuestions.length);
        }
        return targetQuestions.length;
      })();

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
            <span>{quiz.subject}</span> • <span>{examQuestionCount} câu hỏi</span>
          </p>
        </div>

        <div className="exam-header-right">
          {step === 'exam' && timeLeft > 0 && (
            <div className={`exam-timer-box ${timeLeft < 60 ? 'urgent' : ''}`}>
              <Clock size={15} /> <span>{formatTimer(timeLeft)}</span>
            </div>
          )}

          {/* Huy hiệu cảnh báo vi phạm */}
          {step === 'exam' && violationCount > 0 && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.35rem 0.65rem',
                borderRadius: '30px',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
              title="Số lần rời khỏi trang thi"
            >
              <AlertTriangle size={14} /> <span>{violationCount} vi phạm</span>
            </div>
          )}

          {/* Nút Toàn Màn Hình */}
          {step === 'exam' && (
            <button
              type="button"
              className={`btn btn-outline btn-icon-round ${isFullscreen ? 'active-audio' : ''}`}
              onClick={isFullscreen ? handleExitFullscreen : handleRequestFullscreen}
              title={isFullscreen ? 'Thu nhỏ màn hình' : 'Chế độ toàn màn hình'}
            >
              <Maximize2 size={16} />
            </button>
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
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldAlert size={16} color="var(--primary)" /> 📋 Quy chế thi & Giám sát phòng thi:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <li>Số lượng câu hỏi làm bài: <strong>{examQuestionCount} câu</strong>.</li>
                <li>Thời gian làm bài: <strong>{(quiz.settings?.timeLimitMinutes || 0) > 0 ? `${quiz.settings.timeLimitMinutes} phút` : 'Không giới hạn thời gian'}</strong>.</li>
                <li>Điểm chuẩn đạt yêu cầu: <strong>{quiz.settings?.passingScorePercent || 50}%</strong> trở lên.</li>
                <li style={{ color: '#ef4444', fontWeight: 600 }}>
                  ⚠️ Hệ thống khóa chuyển tab/ứng dụng: Rời khỏi màn hình bài thi hoặc chuyển sang cửa sổ khác sẽ bị ghi nhận vi phạm quy chế.
                </li>
                <li>
                  {(quiz.settings?.questionFormatFilter === 'essay_practical_only' || (!quiz.settings?.questionFormatFilter && quiz.questions.some(q => q.type === 'essay' || q.type === 'practical')))
                    ? '📝 Bài thi có phần Tự luận / Thực hành: Sau khi nộp bài, kết quả sẽ chuyển sang Chờ Giảng Viên Chấm Điểm.'
                    : '⚡ Hệ thống tự động chấm điểm và công bố kết quả ngay khi nộp bài.'}
                </li>
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
                <LayoutGrid size={13} /> Danh sách {activeQuestions.length} câu
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
          {(() => {
            const { cleanText, imageUrl: resolvedImageUrl } = extractQuestionImage(currentQ.question, currentQ.imageUrl);

            return (
              <div className="exam-q-content">
                <div className="exam-q-meta">
                  <span className="exam-badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    Câu {currentIdx + 1}/{activeQuestions.length}
                  </span>
                  <span className={`exam-badge exam-badge-${currentQ.difficulty}`}>
                    {currentQ.difficulty === 'easy' ? 'DỄ' : (currentQ.difficulty === 'medium' ? 'TRUNG BÌNH' : 'KHÓ')}
                  </span>
                  <span className="exam-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                    {currentQ.type === 'choice' ? 'TRẮC NGHIỆM ABCD' : (currentQ.type === 'multiple_choice' ? 'CHỌN NHIỀU ĐÁP ÁN' : (currentQ.type === 'fill_blank' ? 'ĐIỀN KHUYẾT' : (currentQ.type === 'matching' ? 'GHÉP NỐI' : (currentQ.type === 'practical' ? 'BÀI THỰC HÀNH' : 'TỰ LUẬN'))))}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    ({currentQ.points || 1} điểm)
                  </span>
                </div>

                {/* HIỂN THỊ HÌNH ẢNH Ở PHÍA TRÊN NỘI DUNG CÂU HỎI */}
                {resolvedImageUrl && (
                  <div className="exam-q-image-wrap">
                    <img 
                      src={getSafeImageUrl(resolvedImageUrl)} 
                      alt="Hình ảnh câu hỏi" 
                      className="exam-q-image" 
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, resolvedImageUrl)}
                      onClick={() => window.open(resolvedImageUrl, '_blank')} 
                    />
                    <span className="exam-q-image-hint">🔍 Nhấp vào ảnh để xem kích thước lớn</span>
                  </div>
                )}

                <div className="exam-q-title">{cleanText}</div>

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

            {/* Tự luận hoặc Bài thực hành */}
            {(currentQ.type === 'essay' || currentQ.type === 'practical') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <textarea 
                  className="exam-textarea" 
                  rows={currentQ.type === 'practical' ? 6 : 4}
                  placeholder={currentQ.type === 'practical' 
                    ? "Nhập câu trả lời, lời giải chi tiết, đoạn mã (code) hoặc mô tả các bước thực hành của bạn..." 
                    : "Nhập bài làm tự luận của bạn vào đây..."}
                  value={typeof answers[currentQ.id] === 'object' && answers[currentQ.id] !== null ? (answers[currentQ.id].text || '') : (answers[currentQ.id] || '')}
                  onChange={(e) => {
                    const textVal = e.target.value;
                    const prevAns = answers[currentQ.id];
                    if (typeof prevAns === 'object' && prevAns !== null) {
                      setAnswers(prev => ({ ...prev, [currentQ.id]: { ...prevAns, text: textVal } }));
                    } else {
                      setAnswers(prev => ({ ...prev, [currentQ.id]: textVal }));
                    }
                  }}
                />

                {/* Vùng tải lên tệp tin đính kèm (cho phép cả trong iframe LMS) */}
                <div style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Paperclip size={16} color="var(--primary)" />
                      <span>Đính kèm file bài làm (Google Drive của hệ thống)</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Hỗ trợ: PDF, Word (.docx), Excel, ZIP, Ảnh, Code (tối đa 25MB)
                    </span>
                  </div>

                  {/* Hiển thị file đã upload */}
                  {typeof answers[currentQ.id] === 'object' && answers[currentQ.id]?.fileUrl ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.85rem',
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #10b981'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        <Check size={16} color="#10b981" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                          {answers[currentQ.id].fileName || 'Tệp đính kèm bài làm'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                        <a
                          href={answers[currentQ.id].fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline btn-xs"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                          title="Xem tệp trên Google Drive"
                        >
                          <ExternalLink size={12} /> Xem file
                        </a>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          style={{ color: '#ef4444', borderColor: '#ef4444' }}
                          onClick={() => handleRemoveFile(currentQ.id)}
                          title="Xóa tệp đính kèm này"
                        >
                          <Trash2 size={12} /> Xóa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input 
                        type="file" 
                        id={`file-input-${currentQ.id}`}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(currentQ.id, file);
                          }
                          e.target.value = '';
                        }}
                      />
                      <label 
                        htmlFor={`file-input-${currentQ.id}`}
                        className="btn btn-outline btn-sm"
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.45rem', 
                          cursor: uploadingQId === currentQ.id ? 'not-allowed' : 'pointer',
                          opacity: uploadingQId === currentQ.id ? 0.7 : 1
                        }}
                      >
                        {uploadingQId === currentQ.id ? (
                          <>
                            <Loader2 size={14} className="spinner" /> Đang tải file lên Google Drive...
                          </>
                        ) : (
                          <>
                            <Upload size={14} /> Chọn tệp tin để tải lên Google Drive
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
          <div className={`exam-score-circle ${submissionResult.hasManualGrading ? 'pending' : (submissionResult.passed ? 'passed' : 'failed')}`}
            style={submissionResult.hasManualGrading ? { borderColor: '#f59e0b', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' } : undefined}
          >
            {submissionResult.hasManualGrading ? '⏳' : submissionResult.score}
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
            {submissionResult.hasManualGrading 
              ? '📝 ĐÃ NỘP BÀI - CHỜ GIẢNG VIÊN CHẤM ĐIỂM' 
              : (submissionResult.passed ? '🎉 CHÚC MỪNG: BẠN ĐÃ ĐẠT!' : '⚠️ KẾT QUẢ CHƯA ĐẠT CHUẨN')}
          </h2>

          <div style={{ display: 'inline-block', background: 'var(--bg-primary)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
            Thí sinh: <strong>{submissionResult.studentName}</strong> • SBD: <strong>{submissionResult.studentId}</strong>
          </div>

          {submissionResult.violationCount && submissionResult.violationCount > 0 ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.35rem 0.85rem', borderRadius: '16px', fontSize: '0.86rem', fontWeight: 600, marginBottom: '1rem' }}>
              <AlertTriangle size={15} /> Ghi nhận {submissionResult.violationCount} lần rời khỏi màn hình bài thi
            </div>
          ) : null}

          {submissionResult.hasManualGrading ? (
            <div style={{
              maxWidth: '560px',
              margin: '0 auto 1.5rem',
              padding: '0.85rem 1.25rem',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#d97706',
              fontSize: '0.9rem',
              lineHeight: 1.5
            }}>
              💡 <strong>Lưu ý:</strong> Đề thi có câu hỏi <strong>Tự luận hoặc Bài thực hành</strong>. Hệ thống đã lưu lại nội dung và file bài làm của bạn để Giảng viên trực tiếp xem và chấm điểm bằng tay sau.
              {submissionResult.totalPoints > 0 && submissionResult.score > 0 && (
                <div style={{ marginTop: '0.4rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  Điểm trắc nghiệm tạm tính: <strong>{submissionResult.score} điểm</strong> (chưa bao gồm điểm các câu tự luận/thực hành).
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: '0 0 1.75rem' }}>
              Điểm số: <strong>{submissionResult.score}/10 điểm ({submissionResult.percentage}%)</strong> • Chuẩn qua môn: {quiz.settings?.passingScorePercent || 50}%.
            </p>
          )}

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
                    {item.q.imageUrl && (
                      <div style={{ margin: '0.5rem 0', maxWidth: '320px' }}>
                        <img 
                          src={getSafeImageUrl(item.q.imageUrl)} 
                          alt="Ảnh minh họa" 
                          referrerPolicy="no-referrer"
                          onError={(e) => handleImageError(e, item.q.imageUrl)}
                          style={{ maxHeight: '150px', maxWidth: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', objectFit: 'contain', background: 'rgba(0,0,0,0.06)', cursor: 'pointer' }}
                          onClick={() => window.open(item.q.imageUrl, '_blank')}
                          title="Bấm để phóng to ảnh"
                        />
                      </div>
                    )}
                    {item.q.type === 'essay' || item.q.type === 'practical' ? (
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>
                          ⏳ Câu hỏi {item.q.type === 'practical' ? 'thực hành' : 'tự luận'}: Chờ giảng viên chấm điểm.
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                          Bài làm của bạn: <strong>{typeof item.userAns === 'object' && item.userAns !== null ? (item.userAns.text || 'Không có văn bản') : (item.userAns || 'Chưa trả lời')}</strong>
                        </div>
                        {typeof item.userAns === 'object' && item.userAns?.fileUrl && (
                          <div style={{ marginTop: '0.35rem' }}>
                            <a 
                              href={item.userAns.fileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--primary)', textDecoration: 'underline' }}
                            >
                              <Paperclip size={13} /> Tệp đính kèm: {item.userAns.fileName || 'Xem file bài làm'}
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '0.85rem', color: item.isCorrect ? '#10b981' : '#ef4444' }}>
                          {item.isCorrect ? '✅ Bạn đã trả lời chính xác!' : `❌ Câu trả lời của bạn: ${typeof item.userAns === 'object' ? JSON.stringify(item.userAns) : (item.userAns || 'Chưa trả lời')}`}
                        </div>
                        {!item.isCorrect && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                            💡 Đáp án đúng: <strong>{correctDisplay}</strong>
                          </div>
                        )}
                      </>
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
                  {(['lofi', 'piano', 'ambient', 'none'] as MusicTrack[]).concat(
                    quiz?.settings?.bgMusicUrl ? (['custom'] as MusicTrack[]) : []
                  ).map(t => {
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

      {/* MODAL CẢNH BÁO VI PHẠM QUY CHẾ THI (KHÓA CHUYỂN TAB / MỞ APP KHÁC) */}
      {showViolationModal && step === 'exam' && (
        <div 
          className="exam-modal-overlay" 
          style={{ 
            zIndex: 999999, 
            background: 'rgba(15, 23, 42, 0.92)', 
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            className="exam-modal-card animate-scale-up" 
            style={{ 
              maxWidth: 480, 
              width: '100%', 
              textAlign: 'center', 
              padding: '2rem 1.75rem',
              border: '2px solid #ef4444',
              boxShadow: '0 20px 50px rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-secondary)'
            }}
          >
            <div 
              style={{ 
                width: 68, 
                height: 68, 
                borderRadius: '50%', 
                background: 'rgba(239, 68, 68, 0.15)', 
                color: '#ef4444',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                border: '2px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <ShieldAlert size={36} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ef4444', margin: '0 0 0.5rem' }}>
              CẢNH BÁO VI PHẠM QUY CHẾ
            </h3>

            <div style={{ display: 'inline-block', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 700, padding: '0.3rem 0.85rem', borderRadius: 20, fontSize: '0.88rem', marginBottom: '1rem' }}>
              Số lần vi phạm phát hiện: {violationCount}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              Hệ thống phát hiện bạn vừa {violationReason ? <strong>{violationReason}</strong> : <strong>rời khỏi màn hình bài thi</strong>}. Hành vi này đã được ghi nhận vào nhật ký bài thi của thí sinh.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-primary btn-lg" 
                style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, background: '#ef4444', borderColor: '#dc2626' }}
                onClick={handleResumeExam}
              >
                Tôi Đã Hiểu - Tiếp Tục Làm Bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

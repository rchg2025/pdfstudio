import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  Download, 
  Code, 
  Copy, 
  Check, 
  Play, 
  Edit3, 
  Sparkles, 
  Layers, 
  Clock, 
  FileText, 
  Settings2, 
  Users, 
  Award, 
  HelpCircle, 
  Upload, 
  Share2, 
  CheckCircle2, 
  Music,
  Shuffle,
  FileSpreadsheet,
  LogIn
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { 
  QuizPackage, 
  QuizQuestion, 
  Difficulty, 
  QuestionType, 
  StudentSubmission 
} from '../types/quiz';
import { generateStandaloneQuizHtml } from '../utils/quizHtmlGenerator';
import './QuizManager.css';

const DEFAULT_QUIZ: QuizPackage = {
  id: 'qz-demo-01',
  title: 'Bài Kiểm Tra Đánh Giá Kiến Thức Tổng Hợp',
  subject: 'Kỹ Năng & Kiến Thức Chuyên Môn',
  description: 'Đề thi trắc nghiệm kết hợp đa dạng câu hỏi: ABCD, điền khuyết, nối cặp và tự luận ngắn có chấm điểm tự động.',
  code: '839201',
  isOpen: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  settings: {
    timeLimitMinutes: 15,
    passingScorePercent: 60,
    shuffleQuestions: true,
    shuffleOptions: true,
    questionSelectionMode: 'all',
    difficultyDistribution: {
      easyCount: 2,
      mediumCount: 2,
      hardCount: 1
    },
    requireStudentInfo: true,
    studentFields: {
      fullName: true,
      studentId: true,
      className: true,
      email: false
    },
    bgMusicType: 'lofi',
    enableSounds: true,
    showResultsImmediately: true,
    showCorrectAnswersAfterSubmit: true
  },
  questions: [
    {
      id: 'q1',
      type: 'choice',
      difficulty: 'easy',
      question: 'Hệ thống LMS viết tắt của cụm từ tiếng Anh nào dưới đây?',
      options: [
        'Learning Management System',
        'Local Machine Server',
        'Logical Model Software',
        'Latest Media Studio'
      ],
      correctAnswer: 'Learning Management System',
      points: 1,
      explanation: 'LMS là viết tắt của Learning Management System - Hệ thống quản lý học tập và đào tạo trực tuyến.'
    },
    {
      id: 'q2',
      type: 'fill_blank',
      difficulty: 'medium',
      question: 'Thủ đô hành chính của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam là thành phố nào?',
      correctAnswer: 'Hà Nội;Ha Noi;Hanoi',
      points: 1,
      explanation: 'Thành phố Hà Nội là thủ đô của nước Việt Nam từ năm 1976 đến nay.'
    },
    {
      id: 'q3',
      type: 'matching',
      difficulty: 'medium',
      question: 'Hãy ghép nối các giao thức mạng phổ biến với cổng (port) mặc định tương ứng:',
      matchingPairs: [
        { id: 'm1', left: 'HTTP', right: 'Cổng 80' },
        { id: 'm2', left: 'HTTPS', right: 'Cổng 443' },
        { id: 'm3', left: 'FTP', right: 'Cổng 21' },
        { id: 'm4', left: 'DNS', right: 'Cổng 53' }
      ],
      points: 2,
      explanation: 'HTTP chạy cổng 80, HTTPS mã hóa cổng 443, FTP truyền file cổng 21 và DNS phân giải tên miền cổng 53.'
    },
    {
      id: 'q4',
      type: 'multiple_choice',
      difficulty: 'hard',
      question: 'Những nền tảng nào sau đây là hệ thống quản lý học tập (LMS) mã nguồn mở hoặc phổ biến toàn cầu? (Chọn tất cả đáp án đúng)',
      options: [
        'Moodle',
        'Canvas LMS',
        'Adobe Photoshop',
        'Blackboard Learn'
      ],
      correctAnswers: ['Moodle', 'Canvas LMS', 'Blackboard Learn'],
      points: 2,
      explanation: 'Moodle, Canvas và Blackboard là các hệ quả LMS hàng đầu thế giới; Adobe Photoshop là phần mềm đồ họa.'
    },
    {
      id: 'q5',
      type: 'essay',
      difficulty: 'hard',
      question: 'Nêu ngắn gọn vai trò quan trọng nhất của việc đánh giá thường xuyên (formative assessment) trong giảng dạy?',
      correctAnswer: 'phản hồi,tiến bộ,điều chỉnh,nắm bắt,kịp thời',
      points: 2,
      explanation: 'Đánh giá thường xuyên giúp giáo viên nắm bắt mức độ hiểu bài kịp thời và người học tự điều chỉnh phương pháp học tập.'
    }
  ]
};

export default function QuizManager() {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // Danh sách các bộ đề thi
  const [quizzes, setQuizzes] = useState<QuizPackage[]>(() => {
    try {
      const saved = localStorage.getItem('rchg_quiz_packages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [DEFAULT_QUIZ];
  });

  const [activeQuizId, setActiveQuizId] = useState<string>(DEFAULT_QUIZ.id);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'questions' | 'settings' | 'submissions'>('quizzes');

  // Lọc ngân hàng câu hỏi
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Modal tạo đề thi mới
  const [showNewQuizModal, setShowNewQuizModal] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizSubject, setNewQuizSubject] = useState('');
  const [newQuizDesc, setNewQuizDesc] = useState('');

  // Modal thêm/sửa câu hỏi thủ công
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [formQType, setFormQType] = useState<QuestionType>('choice');
  const [formQDiff, setFormQDiff] = useState<Difficulty>('medium');
  const [formQText, setFormQText] = useState('');
  const [formQPoints, setFormQPoints] = useState(1);
  const [formQExpl, setFormQExpl] = useState('');
  const [formQOptions, setFormQOptions] = useState<string[]>(['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D']);
  const [formQCorrectAnswer, setFormQCorrectAnswer] = useState('Đáp án A');
  const [formQMatchingPairs, setFormQMatchingPairs] = useState<{ left: string; right: string }[]>([
    { left: 'Khái niệm 1', right: 'Định nghĩa 1' },
    { left: 'Khái niệm 2', right: 'Định nghĩa 2' }
  ]);

  // Modal tạo câu hỏi bằng AI
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty | 'mixed'>('mixed');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Modal nạp câu hỏi nhanh (Bulk Text Import)
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Modal Export Iframe & Link
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);

  // Danh sách bài nộp của sinh viên
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('rchg_quiz_submissions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const activeQuiz = quizzes.find(q => q.id === activeQuizId) || quizzes[0] || DEFAULT_QUIZ;

  // Lưu vào localStorage khi có thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('rchg_quiz_packages', JSON.stringify(quizzes));
    } catch {}
  }, [quizzes]);

  useEffect(() => {
    try {
      localStorage.setItem('rchg_quiz_submissions', JSON.stringify(submissions));
    } catch {}
  }, [submissions]);

  // Đồng bộ với API Backend Neon Postgres
  useEffect(() => {
    const fetchApiQuizzes = async () => {
      try {
        const res = await fetch(`/api/quiz-api?action=get-quizzes${user ? `&userId=${user.id}` : ''}`);
        if (res.ok) {
          const data = await res.json();
          if (data.quizzes && data.quizzes.length > 0) {
            setQuizzes(data.quizzes);
          }
        }
        // Tải submissions
        const subRes = await fetch('/api/quiz-api?action=get-submissions');
        if (subRes.ok) {
          const subData = await subRes.json();
          if (subData.submissions && subData.submissions.length > 0) {
            setSubmissions(subData.submissions);
          }
        }
      } catch {}
    };
    fetchApiQuizzes();
  }, [user]);

  // Cập nhật bộ đề active
  const updateActiveQuiz = (updated: Partial<QuizPackage>) => {
    setQuizzes(prev => prev.map(q => q.id === activeQuiz.id ? { ...q, ...updated, updatedAt: new Date().toISOString() } : q));
  };

  // Tạo bộ đề mới
  const handleCreateQuiz = () => {
    if (!newQuizTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề bộ đề thi!', 'warning');
      return;
    }
    const newQ: QuizPackage = {
      id: `qz-${Date.now()}`,
      userId: user?.id,
      title: newQuizTitle.trim(),
      subject: newQuizSubject.trim() || 'Chung',
      description: newQuizDesc.trim(),
      code: Math.floor(100000 + Math.random() * 900000).toString(),
      isOpen: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: { ...DEFAULT_QUIZ.settings },
      questions: []
    };
    setQuizzes(prev => [newQ, ...prev]);
    setActiveQuizId(newQ.id);
    setShowNewQuizModal(false);
    setNewQuizTitle('');
    setNewQuizSubject('');
    setNewQuizDesc('');
    setActiveTab('questions');
    showToast('Đã tạo bộ đề thi mới thành công!', 'success');

    // Lưu vào backend
    fetch('/api/quiz-api?action=save-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQ)
    }).catch(() => {});
  };

  // Xóa bộ đề thi
  const handleDeleteQuiz = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (quizzes.length <= 1) {
      showToast('Cần giữ lại ít nhất 1 bộ đề trong hệ thống!', 'warning');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xóa bộ đề này và các câu hỏi đi kèm?')) {
      const filtered = quizzes.filter(q => q.id !== id);
      setQuizzes(filtered);
      if (activeQuizId === id) setActiveQuizId(filtered[0].id);
      showToast('Đã xóa bộ đề thi.', 'info');
      fetch('/api/quiz-api?action=delete-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(() => {});
    }
  };

  // Lưu câu hỏi thủ công
  const handleSaveQuestion = () => {
    if (!formQText.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi!', 'warning');
      return;
    }
    const qData: QuizQuestion = {
      id: editingQuestion ? editingQuestion.id : `q-${Date.now()}`,
      type: formQType,
      difficulty: formQDiff,
      question: formQText.trim(),
      points: Number(formQPoints) || 1,
      explanation: formQExpl.trim() || undefined,
      options: (formQType === 'choice' || formQType === 'multiple_choice') ? formQOptions.filter(o => o.trim()) : undefined,
      correctAnswer: (formQType === 'choice' || formQType === 'fill_blank' || formQType === 'essay') ? formQCorrectAnswer.trim() : undefined,
      correctAnswers: formQType === 'multiple_choice' ? [formQCorrectAnswer.trim()] : undefined,
      matchingPairs: formQType === 'matching' ? formQMatchingPairs.map((p, idx) => ({ id: `m-${idx}`, left: p.left.trim(), right: p.right.trim() })) : undefined
    };

    let updatedQuestions: QuizQuestion[];
    if (editingQuestion) {
      updatedQuestions = activeQuiz.questions.map(q => q.id === editingQuestion.id ? qData : q);
      showToast('Đã cập nhật câu hỏi!', 'success');
    } else {
      updatedQuestions = [...activeQuiz.questions, qData];
      showToast('Đã thêm câu hỏi vào ngân hàng!', 'success');
    }

    updateActiveQuiz({ questions: updatedQuestions });
    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  // Mở modal sửa câu hỏi
  const handleOpenEditQuestion = (q: QuizQuestion) => {
    setEditingQuestion(q);
    setFormQType(q.type);
    setFormQDiff(q.difficulty);
    setFormQText(q.question);
    setFormQPoints(q.points || 1);
    setFormQExpl(q.explanation || '');
    setFormQOptions(q.options || ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D']);
    setFormQCorrectAnswer(q.correctAnswer || (q.correctAnswers ? q.correctAnswers[0] : ''));
    setFormQMatchingPairs(q.matchingPairs ? q.matchingPairs.map(p => ({ left: p.left, right: p.right })) : [{ left: '', right: '' }]);
    setShowQuestionModal(true);
  };

  // Xóa câu hỏi khỏi ngân hàng
  const handleDeleteQuestion = (qId: string) => {
    const updated = activeQuiz.questions.filter(q => q.id !== qId);
    updateActiveQuiz({ questions: updated });
    showToast('Đã xóa câu hỏi khỏi bộ đề.', 'info');
  };

  // AI Tự Động Sinh Câu Hỏi Trắc Nghiệm
  const handleGenerateAiQuestions = async () => {
    if (!aiTopic.trim()) {
      showToast('Vui lòng nhập chủ đề bài học để AI tạo câu hỏi!', 'warning');
      return;
    }
    setIsGeneratingAi(true);
    try {
      const prompt = `Bạn là chuyên gia khảo thí sư phạm. Hãy tạo ${aiCount} câu hỏi trắc nghiệm và đánh giá về chủ đề: "${aiTopic.trim()}".
Yêu cầu độ khó: ${aiDifficulty === 'mixed' ? 'Hỗn hợp các mức Dễ, Trung bình, Khó' : aiDifficulty}.
BẮT BUỘC trả về đúng định dạng JSON thuần túy (không markdown \`\`\`json, không lời dẫn):
[
  {
    "type": "choice",
    "difficulty": "easy",
    "question": "Nội dung câu hỏi...",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctAnswer": "Phương án đúng chính xác",
    "explanation": "Giải thích chi tiết vì sao đúng...",
    "points": 1
  }
]`;

      const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?json=true`);
      if (!res.ok) throw new Error('Máy chủ AI bận');
      const text = await res.text();
      let parsed: any[] = [];
      try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (err) {
        const m = text.match(/\[[\s\S]*\]/);
        if (m) parsed = JSON.parse(m[0]);
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        const newQs: QuizQuestion[] = parsed.map((item, idx) => ({
          id: `ai-q-${Date.now()}-${idx}`,
          type: item.type || 'choice',
          difficulty: (item.difficulty as Difficulty) || 'medium',
          question: item.question || `Câu hỏi AI ${idx + 1}`,
          options: item.options || ['A', 'B', 'C', 'D'],
          correctAnswer: item.correctAnswer || (item.options ? item.options[0] : 'A'),
          explanation: item.explanation || 'Lời giải thích của câu hỏi.',
          points: item.points || 1
        }));

        updateActiveQuiz({ questions: [...activeQuiz.questions, ...newQs] });
        setShowAiModal(false);
        setAiTopic('');
        showToast(`AI đã tạo thành công ${newQs.length} câu hỏi vào ngân hàng!`, 'success');
      } else {
        throw new Error('Dữ liệu AI không đúng cấu trúc JSON');
      }
    } catch (err: any) {
      showToast('Không thể tạo câu hỏi AI: ' + (err.message || 'Lỗi mạng'), 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Nạp câu hỏi nhanh bằng Text (Bulk Import)
  const handleBulkImport = () => {
    if (!bulkText.trim()) {
      showToast('Vui lòng dán văn bản câu hỏi cần nạp!', 'warning');
      return;
    }
    const blocks = bulkText.split(/(?:Câu\s*\d+[:.]|\n\s*\n)/i).map(b => b.trim()).filter(Boolean);
    const parsedQuestions: QuizQuestion[] = [];

    blocks.forEach((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        const qTitle = lines[0].replace(/^Câu\s*\d+[:.]\s*/i, '');
        const options: string[] = [];
        let correct = '';
        let expl = '';

        lines.slice(1).forEach(line => {
          if (/^[A-D][.:)]\s*/i.test(line)) {
            options.push(line.replace(/^[A-D][.:)]\s*/i, ''));
          } else if (/^Đáp án[:.]\s*/i.test(line)) {
            const rawAns = line.replace(/^Đáp án[:.]\s*/i, '').trim();
            const charIdx = ['A', 'B', 'C', 'D'].indexOf(rawAns.toUpperCase());
            if (charIdx >= 0 && options[charIdx]) correct = options[charIdx];
            else correct = rawAns;
          } else if (/^Giải thích[:.]\s*/i.test(line)) {
            expl = line.replace(/^Giải thích[:.]\s*/i, '');
          }
        });

        if (qTitle && options.length >= 2) {
          parsedQuestions.push({
            id: `bulk-${Date.now()}-${idx}`,
            type: 'choice',
            difficulty: 'medium',
            question: qTitle,
            options,
            correctAnswer: correct || options[0],
            explanation: expl || undefined,
            points: 1
          });
        }
      }
    });

    if (parsedQuestions.length > 0) {
      updateActiveQuiz({ questions: [...activeQuiz.questions, ...parsedQuestions] });
      setShowBulkModal(false);
      setBulkText('');
      showToast(`Đã nạp thành công ${parsedQuestions.length} câu hỏi vào ngân hàng!`, 'success');
    } else {
      showToast('Không nhận diện được câu hỏi. Hãy kiểm tra lại định dạng mẫu!', 'warning');
    }
  };

  // Tải file HTML độc lập
  const handleExportHtml = () => {
    const html = generateStandaloneQuizHtml(activeQuiz);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `de-thi-${activeQuiz.code}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file HTML Đề Thi Độc Lập!', 'success');
  };

  // Tạo mã Iframe nhúng LMS
  const generateIframeCode = () => {
    const html = generateStandaloneQuizHtml(activeQuiz);
    const utf8Bytes = new TextEncoder().encode(html);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 = btoa(binary);

    return `<!-- MA NHUNG BAI THI TRAC NGHIEM CHO LMS / CANVAS / MOODLE -->
<div style="position:relative;width:100%;max-width:920px;margin:15px auto;padding-top:72%;background:#090d16;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.45);">
  <iframe 
    src="data:text/html;charset=utf-8;base64,${b64}" 
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;margin:0;padding:0;" 
    allow="fullscreen" 
    allowfullscreen="allowfullscreen">
  </iframe>
</div>
<!-- KET THUC MA NHUNG -->`;
  };

  const getDirectExamLink = () => {
    return `${window.location.origin}/phong-thi/${activeQuiz.id}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getDirectExamLink());
      setCopiedLink(true);
      showToast('Đã sao chép link phòng thi!', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleCopyIframe = async () => {
    try {
      await navigator.clipboard.writeText(generateIframeCode());
      setCopiedIframe(true);
      showToast('Đã sao chép mã nhúng Iframe!', 'success');
      setTimeout(() => setCopiedIframe(false), 2000);
    } catch {}
  };

  // Lọc câu hỏi hiển thị
  const filteredQuestions = activeQuiz.questions.filter(q => {
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false;
    if (filterType !== 'all' && q.type !== filterType) return false;
    return true;
  });

  // Tính toán thống kê
  const activeQuizSubmissions = submissions.filter(s => s.quizId === activeQuiz.id);
  const avgScore = activeQuizSubmissions.length > 0 
    ? (activeQuizSubmissions.reduce((acc, cur) => acc + cur.score, 0) / activeQuizSubmissions.length).toFixed(1)
    : '0';
  const passCount = activeQuizSubmissions.filter(s => s.passed).length;
  const passRate = activeQuizSubmissions.length > 0 
    ? Math.round((passCount / activeQuizSubmissions.length) * 100) 
    : 0;

  return (
    <div className="quiz-manager-container animate-fade-in">
      {/* Auth Banner if not logged in */}
      {!user && (
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 'var(--radius-xl)', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LogIn size={22} color="var(--primary)" />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Bạn đang sử dụng ở chế độ Khách (Guest Demo)</strong>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Đăng nhập tài khoản để đồng bộ ngân hàng câu hỏi vĩnh viễn và lưu trữ điểm số thi của sinh viên trên đám mây.
              </p>
            </div>
          </div>
          <Link to="/login" className="btn btn-primary btn-sm">
            <LogIn size={15} /> Đăng nhập ngay
          </Link>
        </div>
      )}

      {/* Main Header */}
      <header className="qm-header">
        <div className="qm-title-group">
          <div className="qm-icon">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1 className="qm-title">Khảo Thí & Ngân Hàng Câu Hỏi Trắc Nghiệm Thông Minh</h1>
            <p className="qm-subtitle">
              Quản lý bộ đề thi, tạo câu hỏi AI, tự động chấm điểm, cấu hình nhạc nền và xuất mã nhúng Iframe cho LMS.
            </p>
          </div>
        </div>

        <div className="qm-header-actions">
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            onClick={() => setShowExportModal(true)}
            style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
          >
            <Code size={15} /> Lấy Mã Nhúng / Link Thi
          </button>
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            onClick={handleExportHtml}
          >
            <Download size={15} /> Xuất Tệp HTML
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={() => navigate(`/phong-thi/${activeQuiz.id}`)}
            style={{ background: '#10b981', border: 'none' }}
          >
            <Play size={15} /> Bắt Đầu Thi Thử
          </button>
        </div>
      </header>

      {/* Overview Stats */}
      <div className="qm-stats-grid">
        <div className="qm-stat-card">
          <div className="qm-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
            <Layers size={24} />
          </div>
          <div>
            <div className="qm-stat-val">{quizzes.length}</div>
            <div className="qm-stat-lbl">Bộ đề thi hiện có</div>
          </div>
        </div>
        <div className="qm-stat-card">
          <div className="qm-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <HelpCircle size={24} />
          </div>
          <div>
            <div className="qm-stat-val">{activeQuiz.questions.length}</div>
            <div className="qm-stat-lbl">Câu hỏi trong ngân hàng ({activeQuiz.title})</div>
          </div>
        </div>
        <div className="qm-stat-card">
          <div className="qm-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="qm-stat-val">{activeQuizSubmissions.length}</div>
            <div className="qm-stat-lbl">Lượt sinh viên đã thi</div>
          </div>
        </div>
        <div className="qm-stat-card">
          <div className="qm-stat-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="qm-stat-val">{passRate}%</div>
            <div className="qm-stat-lbl">Tỷ lệ đạt chuẩn ({avgScore}/10 đ)</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="qm-tabs-bar">
        <button 
          type="button" 
          className={`qm-tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          <Layers size={17} /> Danh Sách Bộ Đề ({quizzes.length})
        </button>
        <button 
          type="button" 
          className={`qm-tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          <FileText size={17} /> Ngân Hàng Câu Hỏi ({activeQuiz.questions.length})
        </button>
        <button 
          type="button" 
          className={`qm-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings2 size={17} /> Cấu Hình Thi & Âm Nhạc
        </button>
        <button 
          type="button" 
          className={`qm-tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          <Users size={17} /> Bảng Điểm & Sinh Viên ({activeQuizSubmissions.length})
        </button>
      </div>

      {/* TAB 1: DANH SÁCH BỘ ĐỀ */}
      {activeTab === 'quizzes' && (
        <div className="qm-panel animate-fade-in">
          <div className="qm-panel-header">
            <div>
              <h2 className="qm-panel-title">
                <Layers size={20} color="var(--primary)" /> Danh Sách Các Bộ Đề Thi
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Chọn bộ đề đang soạn để thêm câu hỏi, chỉnh sửa cài đặt hoặc lấy mã nhúng cho lớp học.
              </p>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowNewQuizModal(true)}>
              <Plus size={16} /> Tạo Bộ Đề Mới
            </button>
          </div>

          <div className="qm-quiz-grid">
            {quizzes.map(q => {
              const isSelected = q.id === activeQuiz.id;
              return (
                <div 
                  key={q.id}
                  className={`qm-quiz-card ${isSelected ? 'active-selected' : ''}`}
                  onClick={() => setActiveQuizId(q.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div className="qm-quiz-meta">
                      <span className="qm-badge qm-badge-subject">{q.subject}</span>
                      <span className="qm-badge" style={{ background: q.isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: q.isOpen ? '#10b981' : '#ef4444' }}>
                        {q.isOpen ? 'Đang mở thi' : 'Đang khóa'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>Mã: #{q.code}</span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.75rem 0 0.4rem', color: 'var(--text-primary)' }}>
                      {q.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {q.description || 'Chưa có mô tả cho đề thi này.'}
                    </p>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                      <span>📚 <strong>{q.questions.length}</strong> câu hỏi</span>
                      <span>⏱️ <strong>{q.settings.timeLimitMinutes > 0 ? q.settings.timeLimitMinutes + ' phút' : 'Tự do'}</strong></span>
                    </div>

                    <div className="qm-quiz-actions">
                      <button 
                        type="button" 
                        className="btn btn-primary btn-xs"
                        onClick={(e) => { e.stopPropagation(); setActiveQuizId(q.id); setActiveTab('questions'); }}
                      >
                        <Edit3 size={13} /> Soạn câu hỏi
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-xs"
                        onClick={(e) => { e.stopPropagation(); setActiveQuizId(q.id); setShowExportModal(true); }}
                      >
                        <Share2 size={13} /> Chia sẻ / Nhúng
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-xs"
                        style={{ color: 'var(--danger)', marginLeft: 'auto' }}
                        onClick={(e) => handleDeleteQuiz(q.id, e)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: NGÂN HÀNG CÂU HỎI */}
      {activeTab === 'questions' && (
        <div className="qm-panel animate-fade-in">
          <div className="qm-panel-header">
            <div>
              <h2 className="qm-panel-title">
                <FileText size={20} color="var(--primary)" /> Ngân Hàng Câu Hỏi: {activeQuiz.title}
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Tổng cộng {activeQuiz.questions.length} câu hỏi. Hỗ trợ trắc nghiệm ABCD, kéo thả, điền khuyết và tự luận ngắn.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                onClick={() => setShowAiModal(true)}
              >
                <Sparkles size={16} /> Tạo Bằng AI
              </button>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => setShowBulkModal(true)}
              >
                <Upload size={16} /> Nạp Nhanh Text
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={() => { setEditingQuestion(null); setFormQText(''); setShowQuestionModal(true); }}
              >
                <Plus size={16} /> Thêm Câu Hỏi
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="qm-label">Độ khó:</span>
              <select 
                className="qm-select" 
                style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
              >
                <option value="all">Tất cả ({activeQuiz.questions.length})</option>
                <option value="easy">Dễ ({activeQuiz.questions.filter(q => q.difficulty === 'easy').length})</option>
                <option value="medium">Trung bình ({activeQuiz.questions.filter(q => q.difficulty === 'medium').length})</option>
                <option value="hard">Khó ({activeQuiz.questions.filter(q => q.difficulty === 'hard').length})</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="qm-label">Hình thức:</span>
              <select 
                className="qm-select" 
                style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Tất cả hình thức</option>
                <option value="choice">Trắc nghiệm 1 đáp án (ABCD)</option>
                <option value="multiple_choice">Chọn nhiều đáp án</option>
                <option value="fill_blank">Điền khuyết</option>
                <option value="matching">Kéo thả / Nối cặp</option>
                <option value="essay">Tự luận ngắn</option>
              </select>
            </div>
          </div>

          {/* List of Questions */}
          <div className="qm-q-list">
            {filteredQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <HelpCircle size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <p>Không có câu hỏi nào khớp với bộ lọc. Hãy bấm <strong>Tạo Bằng AI</strong> hoặc <strong>Thêm Câu Hỏi</strong> để bổ sung!</p>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div key={q.id} className="qm-q-card">
                  <div className="qm-q-header">
                    <div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span className="qm-badge" style={{ background: '#374151', color: '#fff' }}>Câu #{idx + 1}</span>
                        <span className={`qm-badge qm-badge-${q.difficulty}`}>
                          {q.difficulty === 'easy' ? 'DỄ' : (q.difficulty === 'medium' ? 'TRUNG BÌNH' : 'KHÓ')}
                        </span>
                        <span className="qm-badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                          {q.type === 'choice' ? 'TRẮC NGHIỆM ABCD' : (q.type === 'multiple_choice' ? 'CHỌN NHIỀU ĐÁP ÁN' : (q.type === 'fill_blank' ? 'ĐIỀN KHUYẾT' : (q.type === 'matching' ? 'NỐI CẶP' : 'TỰ LUẬN NGẮN')))}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({q.points || 1} điểm)</span>
                      </div>
                      <div className="qm-q-title">{q.question}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button type="button" className="btn btn-outline btn-xs" onClick={() => handleOpenEditQuestion(q)}>
                        <Edit3 size={13} /> Sửa
                      </button>
                      <button type="button" className="btn btn-outline btn-xs" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteQuestion(q.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Options display */}
                  {(q.type === 'choice' || q.type === 'multiple_choice') && q.options && (
                    <div className="qm-q-options">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.type === 'choice' ? q.correctAnswer === opt : (q.correctAnswers || []).includes(opt);
                        return (
                          <div key={oIdx} className={`qm-q-opt-item ${isCorrect ? 'is-correct' : ''}`}>
                            {isCorrect ? '✓ ' : '○ '} {opt}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'fill_blank' && (
                    <div style={{ fontSize: '0.88rem', color: '#10b981' }}>
                      Đáp án đúng chấp nhận: <strong>{q.correctAnswer}</strong>
                    </div>
                  )}

                  {q.type === 'matching' && q.matchingPairs && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {q.matchingPairs.map((p, pIdx) => (
                        <span key={pIdx} className="qm-q-opt-item">
                          <strong>{p.left}</strong> ➔ {p.right}
                        </span>
                      ))}
                    </div>
                  )}

                  {q.type === 'essay' && (
                    <div style={{ fontSize: '0.88rem', color: '#38bdf8' }}>
                      Từ khóa chấm điểm: <em>{q.correctAnswer}</em>
                    </div>
                  )}

                  {q.explanation && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px dashed var(--border)', paddingTop: '0.4rem' }}>
                      💡 Giải thích: {q.explanation}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CẤU HÌNH THI & ÂM NHẠC */}
      {activeTab === 'settings' && (
        <div className="qm-panel animate-fade-in">
          <div className="qm-panel-header">
            <div>
              <h2 className="qm-panel-title">
                <Settings2 size={20} color="var(--primary)" /> Cấu Hình Phòng Thi & Trải Nghiệm Thí Sinh
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Thiết lập thời gian làm bài, phân bổ độ khó khi rút đề, âm nhạc thư giãn và biểu mẫu sinh viên.
              </p>
            </div>
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={() => showToast('Đã lưu cấu hình phòng thi thành công!', 'success')}
            >
              <CheckCircle2 size={16} /> Lưu Cài Đặt
            </button>
          </div>

          <div className="qm-settings-grid">
            {/* Cột trái: Thời gian & Rút đề */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={18} color="var(--primary)" /> Thời Gian & Chiến Lược Đề Thi
              </h3>

              <div className="qm-form-group">
                <label className="qm-label">Thời gian làm bài thi (Phút - 0 = Không giới hạn)</label>
                <input 
                  type="number" 
                  min={0} 
                  max={180}
                  className="qm-input" 
                  value={activeQuiz.settings.timeLimitMinutes}
                  onChange={(e) => updateActiveQuiz({ settings: { ...activeQuiz.settings, timeLimitMinutes: Number(e.target.value) } })}
                />
              </div>

              <div className="qm-form-group">
                <label className="qm-label">Điểm chuẩn qua môn (%)</label>
                <input 
                  type="number" 
                  min={10} 
                  max={100}
                  className="qm-input" 
                  value={activeQuiz.settings.passingScorePercent}
                  onChange={(e) => updateActiveQuiz({ settings: { ...activeQuiz.settings, passingScorePercent: Number(e.target.value) } })}
                />
              </div>

              <div className="qm-form-group">
                <label className="qm-label">Chế độ chọn câu hỏi khi bắt đầu thi</label>
                <select 
                  className="qm-select"
                  value={activeQuiz.settings.questionSelectionMode}
                  onChange={(e) => updateActiveQuiz({ settings: { ...activeQuiz.settings, questionSelectionMode: e.target.value as any } })}
                >
                  <option value="all">Toàn bộ ngân hàng ({activeQuiz.questions.length} câu)</option>
                  <option value="custom_difficulty">Rút ngẫu nhiên theo phân bổ độ khó (Dễ / Vừa / Khó)</option>
                </select>
              </div>

              {activeQuiz.settings.questionSelectionMode === 'custom_difficulty' && (
                <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    Phân bổ số lượng câu hỏi trong mỗi đề thi:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label className="qm-label" style={{ color: '#10b981' }}>Số câu DỄ</label>
                      <input 
                        type="number" 
                        min={0}
                        className="qm-input" 
                        value={activeQuiz.settings.difficultyDistribution?.easyCount || 0}
                        onChange={(e) => updateActiveQuiz({ settings: { ...activeQuiz.settings, difficultyDistribution: { ...activeQuiz.settings.difficultyDistribution, easyCount: Number(e.target.value) } } })}
                      />
                    </div>
                    <div>
                      <label className="qm-label" style={{ color: '#f59e0b' }}>Số câu VỪA</label>
                      <input 
                        type="number" 
                        min={0}
                        className="qm-input" 
                        value={activeQuiz.settings.difficultyDistribution?.mediumCount || 0}
                        onChange={(e) => updateActiveQuiz({ settings: { ...activeQuiz.settings, difficultyDistribution: { ...activeQuiz.settings.difficultyDistribution, mediumCount: Number(e.target.value) } } })}
                      />
                    </div>
                    <div>
                      <label className="qm-label" style={{ color: '#ef4444' }}>Số câu KHÓ</label>
                      <input 
                        type="number" 
                        min={0}
                        className="qm-input" 
                        value={activeQuiz.settings.difficultyDistribution?.hardCount || 0}
                        onChange={(e) => updateActiveQuiz({ settings: { ...activeQuiz.settings, difficultyDistribution: { ...activeQuiz.settings.difficultyDistribution, hardCount: Number(e.target.value) } } })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="checkbox" 
                    checked={activeQuiz.settings.shuffleQuestions}
                    onChange={(e) => updateActiveQuiz({ settings: { ...activeQuiz.settings, shuffleQuestions: e.target.checked } })}
                  />
                  <span><Shuffle size={14} /> Xáo trộn thứ tự các câu hỏi (Shuffle Questions)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="checkbox" 
                    checked={activeQuiz.settings.shuffleOptions}
                    onChange={(e) => updateActiveQuiz({ settings: { ...activeQuiz.settings, shuffleOptions: e.target.checked } })}
                  />
                  <span>Xáo trộn thứ tự các phương án ABCD</span>
                </label>
              </div>
            </div>

            {/* Cột phải: Nhạc nền & Form sinh viên */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Music size={18} color="var(--primary)" /> Nhạc Nền Thư Giãn & Form Thí Sinh
              </h3>

              <div className="qm-form-group">
                <label className="qm-label">Âm nhạc thư giãn trong lúc thi (Web Audio Generator)</label>
                <select 
                  className="qm-select"
                  value={activeQuiz.settings.bgMusicType}
                  onChange={(e) => updateActiveQuiz({ settings: { ...activeQuiz.settings, bgMusicType: e.target.value as any } })}
                >
                  <option value="none">Tắt nhạc nền</option>
                  <option value="lofi">Lofi Chill (Giai điệu thư thái, tập trung cao)</option>
                  <option value="piano">Piano êm dịu (Giảm căng thẳng áp lực phòng thi)</option>
                  <option value="ambient">Ambient tự nhiên (Sóng biển & đệm êm dịu)</option>
                </select>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  * Nhạc nền được tạo trực tiếp bằng Web Audio API, không tốn mạng và không lo lỗi bản quyền.
                </span>
              </div>

              <div className="qm-form-group">
                <label className="qm-label">Biểu mẫu thu thập thông tin thí sinh trước khi vào thi</label>
                <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                    <input type="checkbox" checked={true} disabled />
                    Họ và tên thí sinh (Bắt buộc)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                    <input 
                      type="checkbox" 
                      checked={activeQuiz.settings.studentFields?.studentId} 
                      onChange={(e) => updateActiveQuiz({ settings: { ...activeQuiz.settings, studentFields: { ...activeQuiz.settings.studentFields, studentId: e.target.checked } } })}
                    />
                    Lớp / Mã số sinh viên (MSSV)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                    <input 
                      type="checkbox" 
                      checked={activeQuiz.settings.studentFields?.email} 
                      onChange={(e) => updateActiveQuiz({ settings: { ...activeQuiz.settings, studentFields: { ...activeQuiz.settings.studentFields, email: e.target.checked } } })}
                    />
                    Địa chỉ Email sinh viên
                  </label>
                </div>
              </div>

              <div className="qm-form-group">
                <label className="qm-label">Trạng thái phòng thi</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    className={`btn btn-sm ${activeQuiz.isOpen ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => updateActiveQuiz({ isOpen: true })}
                  >
                    Đang mở thi
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm ${!activeQuiz.isOpen ? 'btn-danger' : 'btn-outline'}`}
                    style={!activeQuiz.isOpen ? { background: '#ef4444', color: '#fff', border: 'none' } : {}}
                    onClick={() => updateActiveQuiz({ isOpen: false })}
                  >
                    Tạm khóa phòng thi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BẢNG ĐIỂM & SINH VIÊN */}
      {activeTab === 'submissions' && (
        <div className="qm-panel animate-fade-in">
          <div className="qm-panel-header">
            <div>
              <h2 className="qm-panel-title">
                <Users size={20} color="var(--primary)" /> Bảng Điểm & Lịch Sử Bài Thi: {activeQuiz.title}
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Đã ghi nhận {activeQuizSubmissions.length} lượt nộp bài. Tỷ lệ đạt: {passRate}% • Điểm trung bình: {avgScore}/10.
              </p>
            </div>
            <button 
              type="button" 
              className="btn btn-outline btn-sm"
              onClick={() => {
                if (activeQuizSubmissions.length === 0) {
                  showToast('Chưa có dữ liệu bài nộp để xuất!', 'warning');
                  return;
                }
                const csvHeader = 'Họ tên,MSSV / Lớp,Điểm số,Tổng điểm,Tỷ lệ %,Kết quả,Thời gian nộp\n';
                const rows = activeQuizSubmissions.map(s => 
                  `"${s.studentName}","${s.studentId || s.className}","${s.score}","${s.totalPoints}","${s.percentage}%","${s.passed ? 'Đạt' : 'Chưa đạt'}","${new Date(s.submittedAt).toLocaleString('vi-VN')}"`
                ).join('\n');
                const blob = new Blob([csvHeader + rows], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bang-diem-${activeQuiz.code}-${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('Đã xuất bảng điểm CSV thành công!', 'success');
              }}
            >
              <FileSpreadsheet size={16} /> Xuất Bảng Điểm CSV
            </button>
          </div>

          <div className="qm-table-wrap">
            {activeQuizSubmissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <Users size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <p>Chưa có sinh viên nào tham gia bài thi này.</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/phong-thi/${activeQuiz.id}`)}>
                  <Play size={15} /> Làm bài thi thử ngay
                </button>
              </div>
            ) : (
              <table className="qm-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Họ và tên thí sinh</th>
                    <th>Lớp / MSSV</th>
                    <th>Điểm số</th>
                    <th>Tỷ lệ %</th>
                    <th>Xếp loại</th>
                    <th>Thời gian nộp</th>
                  </tr>
                </thead>
                <tbody>
                  {activeQuizSubmissions.map((sub, idx) => (
                    <tr key={sub.id}>
                      <td>#{idx + 1}</td>
                      <td><strong>{sub.studentName}</strong></td>
                      <td>{sub.studentId || sub.className}</td>
                      <td><span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>{sub.score}/{sub.totalPoints}</span></td>
                      <td>{sub.percentage}%</td>
                      <td>
                        <span className="qm-badge" style={{ background: sub.passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: sub.passed ? '#10b981' : '#ef4444' }}>
                          {sub.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {new Date(sub.submittedAt).toLocaleTimeString('vi-VN')} {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL TẠO BỘ ĐỀ MỚI */}
      {showNewQuizModal && (
        <div className="modal-overlay" onClick={() => setShowNewQuizModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Plus size={18} color="var(--primary)" /> Tạo Bộ Đề Thi Mới</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowNewQuizModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="qm-form-group">
                <label className="qm-label">Tên bộ đề thi *</label>
                <input 
                  type="text" 
                  className="qm-input" 
                  placeholder="Ví dụ: Kiểm tra giữa kỳ môn Dược lý học"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                />
              </div>
              <div className="qm-form-group">
                <label className="qm-label">Môn học / Chuyên mục</label>
                <input 
                  type="text" 
                  className="qm-input" 
                  placeholder="Ví dụ: Y Dược, Ngoại ngữ, Tin học..."
                  value={newQuizSubject}
                  onChange={(e) => setNewQuizSubject(e.target.value)}
                />
              </div>
              <div className="qm-form-group">
                <label className="qm-label">Mô tả / Hướng dẫn thi</label>
                <textarea 
                  className="qm-textarea" 
                  rows={3}
                  placeholder="Hướng dẫn cho sinh viên trước khi bắt đầu..."
                  value={newQuizDesc}
                  onChange={(e) => setNewQuizDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowNewQuizModal(false)}>Hủy</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleCreateQuiz}>Tạo Bộ Đề</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO CÂU HỎI BẰNG AI */}
      {showAiModal && (
        <div className="modal-overlay" onClick={() => !isGeneratingAi && setShowAiModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Sparkles size={18} color="var(--primary)" /> Tạo Bộ Câu Hỏi Tự Động Bằng AI</h3>
              <button type="button" className="modal-close-btn" onClick={() => !isGeneratingAi && setShowAiModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Nhập chủ đề bất kỳ, trí tuệ nhân tạo sẽ tự động biên soạn các câu hỏi trắc nghiệm kèm 4 phương án, đáp án đúng và lời giải thích chi tiết.
              </p>

              <div className="qm-form-group">
                <label className="qm-label">Chủ đề bài học / Chuyên môn *</label>
                <textarea 
                  className="qm-textarea" 
                  rows={3}
                  placeholder="Ví dụ: Kỹ thuật đặt ống thông dạ dày cho người bệnh; hoặc Các thì trong tiếng Anh; hoặc Lịch sử Đảng Cộng sản Việt Nam..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  disabled={isGeneratingAi}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="qm-form-group">
                  <label className="qm-label">Số lượng câu hỏi</label>
                  <select 
                    className="qm-select"
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    disabled={isGeneratingAi}
                  >
                    <option value={3}>3 câu hỏi nhanh</option>
                    <option value={5}>5 câu hỏi chuẩn</option>
                    <option value={10}>10 câu hỏi đầy đủ</option>
                  </select>
                </div>
                <div className="qm-form-group">
                  <label className="qm-label">Độ khó mong muốn</label>
                  <select 
                    className="qm-select"
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value as any)}
                    disabled={isGeneratingAi}
                  >
                    <option value="mixed">Hỗn hợp (Dễ, Vừa, Khó)</option>
                    <option value="easy">Cơ bản (Dễ)</option>
                    <option value="medium">Thông hiểu (Trung bình)</option>
                    <option value="hard">Vận dụng cao (Khó)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAiModal(false)} disabled={isGeneratingAi}>Đóng</button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={handleGenerateAiQuestions}
                disabled={isGeneratingAi}
              >
                {isGeneratingAi ? 'Đang tạo câu hỏi bằng AI...' : 'Tạo Câu Hỏi Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NẠP NHANH TỪ TEXT (BULK IMPORT) */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Upload size={18} color="var(--primary)" /> Nạp Nhanh Câu Hỏi Từ Văn Bản</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowBulkModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Dán danh sách câu hỏi dạng văn bản theo cú pháp chuẩn bên dưới:
              </p>
              <div style={{ background: '#090d16', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#93c5fd', marginBottom: '0.75rem', fontFamily: 'monospace' }}>
                Câu 1: Thủ đô của Việt Nam là gì?<br />
                A. Hà Nội<br />
                B. TP. Hồ Chí Minh<br />
                C. Đà Nẵng<br />
                D. Cần Thơ<br />
                Đáp án: A<br />
                Giải thích: Hà Nội là thủ đô của Việt Nam.
              </div>

              <textarea 
                className="qm-textarea" 
                rows={9}
                placeholder="Dán nội dung các câu hỏi vào đây..."
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowBulkModal(false)}>Hủy</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleBulkImport}>Nạp Vào Ngân Hàng</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA CÂU HỎI THỦ CÔNG */}
      {showQuestionModal && (
        <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Edit3 size={18} color="var(--primary)" /> {editingQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowQuestionModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.6fr', gap: '0.75rem' }}>
                <div className="qm-form-group">
                  <label className="qm-label">Hình thức câu hỏi</label>
                  <select 
                    className="qm-select"
                    value={formQType}
                    onChange={(e) => setFormQType(e.target.value as any)}
                  >
                    <option value="choice">Trắc nghiệm ABCD (1 đáp án)</option>
                    <option value="multiple_choice">Chọn nhiều đáp án đúng</option>
                    <option value="fill_blank">Điền khuyết (Fill-in-the-blank)</option>
                    <option value="matching">Kéo thả / Ghép nối cặp</option>
                    <option value="essay">Tự luận ngắn (Từ khóa)</option>
                  </select>
                </div>
                <div className="qm-form-group">
                  <label className="qm-label">Độ khó</label>
                  <select 
                    className="qm-select"
                    value={formQDiff}
                    onChange={(e) => setFormQDiff(e.target.value as any)}
                  >
                    <option value="easy">Dễ (Nhận biết)</option>
                    <option value="medium">Trung bình (Thông hiểu)</option>
                    <option value="hard">Khó (Vận dụng)</option>
                  </select>
                </div>
                <div className="qm-form-group">
                  <label className="qm-label">Điểm số</label>
                  <input 
                    type="number" 
                    min={0.5} 
                    step={0.5}
                    className="qm-input" 
                    value={formQPoints}
                    onChange={(e) => setFormQPoints(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="qm-form-group">
                <label className="qm-label">Nội dung câu hỏi *</label>
                <textarea 
                  className="qm-textarea" 
                  rows={3}
                  value={formQText}
                  onChange={(e) => setFormQText(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                />
              </div>

              {/* Options for ABCD */}
              {(formQType === 'choice' || formQType === 'multiple_choice') && (
                <div className="qm-form-group">
                  <label className="qm-label">Các phương án lựa chọn:</label>
                  {formQOptions.map((opt, oIdx) => (
                    <div key={oIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, width: '24px', color: 'var(--text-secondary)' }}>
                        {['A', 'B', 'C', 'D', 'E', 'F'][oIdx] || oIdx + 1}.
                      </span>
                      <input 
                        type="text" 
                        className="qm-input" 
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...formQOptions];
                          newOpts[oIdx] = e.target.value;
                          setFormQOptions(newOpts);
                        }}
                      />
                      <input 
                        type="radio" 
                        name="correctOpt" 
                        checked={formQCorrectAnswer === opt}
                        onChange={() => setFormQCorrectAnswer(opt)}
                        title="Đánh dấu đáp án đúng"
                      />
                    </div>
                  ))}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>* Bấm vào nút tròn bên phải phương án để chọn đáp án đúng.</span>
                </div>
              )}

              {/* Matching Pairs */}
              {formQType === 'matching' && (
                <div className="qm-form-group">
                  <label className="qm-label">Các cặp ghép nối tương ứng:</label>
                  {formQMatchingPairs.map((pair, pIdx) => (
                    <div key={pIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <input 
                        type="text" 
                        className="qm-input" 
                        placeholder="Vế trái (Khái niệm)"
                        value={pair.left}
                        onChange={(e) => {
                          const newPairs = [...formQMatchingPairs];
                          newPairs[pIdx].left = e.target.value;
                          setFormQMatchingPairs(newPairs);
                        }}
                      />
                      <input 
                        type="text" 
                        className="qm-input" 
                        placeholder="Vế phải (Khớp với vế trái)"
                        value={pair.right}
                        onChange={(e) => {
                          const newPairs = [...formQMatchingPairs];
                          newPairs[pIdx].right = e.target.value;
                          setFormQMatchingPairs(newPairs);
                        }}
                      />
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className="btn btn-outline btn-xs"
                    onClick={() => setFormQMatchingPairs([...formQMatchingPairs, { left: '', right: '' }])}
                    style={{ width: 'fit-content', marginTop: '0.25rem' }}
                  >
                    + Thêm cặp ghép nối
                  </button>
                </div>
              )}

              {/* Fill blank or Essay */}
              {(formQType === 'fill_blank' || formQType === 'essay') && (
                <div className="qm-form-group">
                  <label className="qm-label">
                    {formQType === 'fill_blank' ? 'Đáp án đúng (chấp nhận nhiều đáp án cách nhau bằng dấu chấm phẩy ;)' : 'Các từ khóa trọng tâm để tự động chấm điểm (cách nhau bằng dấu phẩy)'}
                  </label>
                  <input 
                    type="text" 
                    className="qm-input" 
                    value={formQCorrectAnswer}
                    placeholder="Ví dụ: Hà Nội;Ha Noi;Hanoi"
                    onChange={(e) => setFormQCorrectAnswer(e.target.value)}
                  />
                </div>
              )}

              <div className="qm-form-group">
                <label className="qm-label">Lời giải thích chi tiết (Hiện khi xem lại bài)</label>
                <textarea 
                  className="qm-textarea" 
                  rows={2}
                  value={formQExpl}
                  onChange={(e) => setFormQExpl(e.target.value)}
                  placeholder="Giải thích vì sao đáp án này đúng..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowQuestionModal(false)}>Hủy</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveQuestion}>Lưu Câu Hỏi</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LẤY MÃ NHÚNG IFRAME & LINK THI */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Share2 size={18} color="var(--primary)" /> Chia Sẻ & Nhúng Đề Thi: {activeQuiz.title}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowExportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Direct link */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="qm-label">1. Link làm bài trực tiếp cho sinh viên:</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <input type="text" className="qm-input" readOnly value={getDirectExamLink()} />
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleCopyLink}>
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />} {copiedLink ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              {/* LMS Iframe code */}
              <div>
                <label className="qm-label">2. Mã nhúng Iframe cho LMS (Canvas, Moodle, Google Sites...):</label>
                <div className="export-result-box">
                  <div className="export-result-header">
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Mã HTML Iframe độc lập tự động chấm điểm & phát nhạc nền</span>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-xs"
                      onClick={handleCopyIframe}
                      style={{ background: copiedIframe ? '#10b981' : 'var(--primary)' }}
                    >
                      {copiedIframe ? <Check size={13} /> : <Copy size={13} />} {copiedIframe ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                  <pre className="export-code-block">{generateIframeCode()}</pre>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowExportModal(false)}>Đóng</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/phong-thi/${activeQuiz.id}`)}>
                <Play size={14} /> Mở Trang Thi Thử
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

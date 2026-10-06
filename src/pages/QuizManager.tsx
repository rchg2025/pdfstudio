import { useState, useEffect, useRef } from 'react';
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
  LogIn,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileUp,
  Image as ImageIcon,
  Cloud,
  ExternalLink,
  ShieldCheck,
  Save,
  Loader2,
  Eye,
  Monitor,
  Smartphone,
  RotateCcw,
  AlertCircle,
  Crown,
  Calendar,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import SubscriptionModal from '../components/SubscriptionModal';
import type { 
  QuizPackage, 
  QuizQuestion, 
  Difficulty, 
  QuestionType, 
  StudentSubmission 
} from '../types/quiz';
import { generateStandaloneQuizHtml } from '../utils/quizHtmlGenerator';
import { parseExamFile, type ParsedExamResult } from '../utils/examDocParser';
import { getSafeImageUrl, handleImageError } from '../utils/imageUrl';
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
    showCorrectAnswersAfterSubmit: false
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
  const { user, token, isExpired } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  // Storage key riêng biệt cho từng người dùng
  const storageKey = user ? `rchg_quiz_packages_${user.id}` : 'rchg_quiz_packages_guest';
  const subStorageKey = user ? `rchg_quiz_submissions_${user.id}` : 'rchg_quiz_submissions_guest';

  // Danh sách các bộ đề thi (cô lập theo từng người dùng)
  const [quizzes, setQuizzes] = useState<QuizPackage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [{
      ...DEFAULT_QUIZ,
      userId: user?.id
    }];
  });

  const [activeQuizId, setActiveQuizId] = useState<string>(() => {
    return quizzes[0]?.id || DEFAULT_QUIZ.id;
  });
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
  const [formQCorrectAnswers, setFormQCorrectAnswers] = useState<string[]>(['Đáp án A']);
  const [formQImageUrl, setFormQImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

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
  const [customAiKey, setCustomAiKey] = useState(() => {
    return localStorage.getItem('rchg_gemini_api_key') || '';
  });
  const [showKeySetting, setShowKeySetting] = useState(false);

  // Modal nạp câu hỏi nhanh (Bulk Text Import)
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Tìm kiếm thông minh và Phân trang câu hỏi
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modal Import File Word / Docx / HTML
  const [showDocImportModal, setShowDocImportModal] = useState(false);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [parsedDocResult, setParsedDocResult] = useState<ParsedExamResult | null>(null);
  const [editDocTitle, setEditDocTitle] = useState('');
  const [editDocSubject, setEditDocSubject] = useState('');
  const [editDocTime, setEditDocTime] = useState(60);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Modal Export Iframe & Link
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);

  // Xem trước câu hỏi và giao diện thi
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewShowCorrect, setPreviewShowCorrect] = useState(false);
  const [previewUserAnswer, setPreviewUserAnswer] = useState<any>(null);
  const [previewAnswerChecked, setPreviewAnswerChecked] = useState<boolean | null>(null);

  // Danh sách bài nộp của sinh viên
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    try {
      const saved = localStorage.getItem(subStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Tìm kiếm thông minh & Lọc bảng điểm sinh viên
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subResultFilter, setSubResultFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [subDateFilter, setSubDateFilter] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [subStartDate, setSubStartDate] = useState('');
  const [subEndDate, setSubEndDate] = useState('');
  const [subPage, setSubPage] = useState(1);
  const [subPageSize, setSubPageSize] = useState(10);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [isDeletingSubs, setIsDeletingSubs] = useState(false);

  const activeQuiz = quizzes.find(q => q.id === activeQuizId) || quizzes[0] || DEFAULT_QUIZ;

  // Trạng thái lưu trữ PostgreSQL
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Hàm đồng bộ và lưu bộ đề trực tiếp vào PostgreSQL
  const saveQuizToBackend = async (quizToSave: QuizPackage, showSuccessToast = false) => {
    if (!user) return null;
    setIsSavingDb(true);
    try {
      const payload = {
        ...quizToSave,
        userId: user.id
      };
      const res = await fetch('/api/quiz-api?action=save-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
        if (showSuccessToast) {
          showToast('Đã lưu thành công bộ đề vào cơ sở dữ liệu!', 'success');
        }
        return data.quiz;
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`Không thể lưu vào database: ${err.error || 'Lỗi máy chủ'}`, 'error');
      }
    } catch (err: any) {
      console.error('Lỗi khi lưu quiz vào database:', err);
      showToast('Lỗi kết nối cơ sở dữ liệu khi lưu bộ đề!', 'error');
    } finally {
      setIsSavingDb(false);
    }
    return null;
  };

  // Lưu vào localStorage dự phòng theo tài khoản người dùng
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(`rchg_quiz_packages_${user.id}`, JSON.stringify(quizzes));
    } catch {}
  }, [quizzes, user]);

  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(`rchg_quiz_submissions_${user.id}`, JSON.stringify(submissions));
    } catch {}
  }, [submissions, user]);

  // Đồng bộ với API Backend Neon Postgres (Chỉ tải bộ đề của chính user này)
  useEffect(() => {
    const fetchApiQuizzes = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/quiz-api?action=get-quizzes&userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.quizzes)) {
            if (data.quizzes.length > 0) {
              setQuizzes(data.quizzes);
              setActiveQuizId(prev => {
                const exists = data.quizzes.some((q: any) => q.id === prev);
                return exists ? prev : data.quizzes[0].id;
              });
            } else {
              // Kiểm tra xem trong localStorage của user này đã có bộ đề nào trước đó chưa
              const localSaved = localStorage.getItem(`rchg_quiz_packages_${user.id}`);
              let localList: QuizPackage[] = [];
              try {
                if (localSaved) localList = JSON.parse(localSaved);
              } catch {}

              if (Array.isArray(localList) && localList.length > 0) {
                // Tự động đẩy dữ liệu từ localStorage lên database cho user này
                setQuizzes(localList);
                setActiveQuizId(localList[0].id);
                for (const lq of localList) {
                  saveQuizToBackend(lq);
                }
              } else {
                // Người dùng mới chưa có bộ đề nào: Tạo bộ đề đầu tiên và lưu vào database
                const initialUserQuiz: QuizPackage = {
                  ...DEFAULT_QUIZ,
                  id: `qz-${user.id}-${Date.now()}`,
                  userId: user.id
                };
                setQuizzes([initialUserQuiz]);
                setActiveQuizId(initialUserQuiz.id);
                saveQuizToBackend(initialUserQuiz);
              }
            }
          }
        }
        // Tải submissions cho các bộ đề của user này
        const subRes = await fetch(`/api/quiz-api?action=get-submissions&userId=${user.id}`);
        if (subRes.ok) {
          const subData = await subRes.json();
          if (Array.isArray(subData.submissions)) {
            setSubmissions(subData.submissions);
          }
        }
      } catch {}
    };
    fetchApiQuizzes();
  }, [user]);

  // Tải ảnh câu hỏi lên Google Drive qua /api/upload
  const handleUploadQuestionImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP)!', 'warning');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa là 8MB!', 'warning');
      return;
    }

    setIsUploadingImage(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Tải lên Google Drive qua /api/upload nếu có token
      if (token) {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              imageBase64: base64Data,
              filename: `quiz-q-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              setFormQImageUrl(data.url);
              showToast('Đã tải và đồng bộ ảnh lên Google Drive thành công!', 'success');
              return;
            }
          }
        } catch (uploadErr) {
          console.warn('Drive upload error:', uploadErr);
        }
      }

      // Fallback lưu ảnh dạng Data URL nếu không tải được lên Drive
      setFormQImageUrl(base64Data);
      showToast('Đã lưu ảnh cho câu hỏi!', 'info');
    } catch (err: any) {
      showToast('Lỗi khi đọc file ảnh: ' + (err.message || 'Lỗi không xác định'), 'error');
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Cập nhật bộ đề active và tự động đồng bộ ngay vào Database
  const updateActiveQuiz = (updated: Partial<QuizPackage>, autoSave = true) => {
    setQuizzes(prev => {
      let targetUpdated: QuizPackage | null = null;
      const next = prev.map(q => {
        if (q.id === activeQuiz.id) {
          targetUpdated = {
            ...q,
            ...updated,
            userId: user?.id || q.userId,
            updatedAt: new Date().toISOString()
          };
          return targetUpdated;
        }
        return q;
      });
      if (autoSave && targetUpdated) {
        saveQuizToBackend(targetUpdated);
      }
      return next;
    });
  };

  // Tạo bộ đề mới
  const handleCreateQuiz = async () => {
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
    showToast('Đang tạo và lưu bộ đề mới vào cơ sở dữ liệu...', 'info');
    await saveQuizToBackend(newQ, true);
  };

  // Xóa bộ đề thi
  const handleDeleteQuiz = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (quizzes.length <= 1) {
      showToast('Cần giữ lại ít nhất 1 bộ đề trong hệ thống!', 'warning');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xóa bộ đề này và các câu hỏi đi kèm khỏi hệ thống?')) {
      const filtered = quizzes.filter(q => q.id !== id);
      setQuizzes(filtered);
      if (activeQuizId === id) setActiveQuizId(filtered[0].id);
      showToast('Đang xóa bộ đề khỏi database...', 'info');
      try {
        const res = await fetch('/api/quiz-api?action=delete-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        if (res.ok) {
          showToast('Đã xóa bộ đề thi thành công!', 'success');
        } else {
          showToast('Lỗi khi xóa bộ đề trên database.', 'error');
        }
      } catch {
        showToast('Lỗi kết nối khi xóa bộ đề.', 'error');
      }
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
      imageUrl: formQImageUrl.trim() || undefined,
      points: Number(formQPoints) || 1,
      explanation: formQExpl.trim() || undefined,
      options: (formQType === 'choice' || formQType === 'multiple_choice') ? formQOptions.filter(o => o.trim()) : undefined,
      correctAnswer: (formQType === 'choice' || formQType === 'fill_blank' || formQType === 'essay') ? formQCorrectAnswer.trim() : undefined,
      correctAnswers: formQType === 'multiple_choice' ? (formQCorrectAnswers.length > 0 ? formQCorrectAnswers : [formQCorrectAnswer.trim()]) : undefined,
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
    setFormQImageUrl('');
  };

  // Mở modal sửa câu hỏi
  const handleOpenEditQuestion = (q: QuizQuestion) => {
    setEditingQuestion(q);
    setFormQType(q.type);
    setFormQDiff(q.difficulty);
    setFormQText(q.question);
    setFormQPoints(q.points || 1);
    setFormQExpl(q.explanation || '');
    setFormQOptions(q.options && q.options.length > 0 ? [...q.options] : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D']);
    setFormQCorrectAnswer(q.correctAnswer || (q.correctAnswers ? q.correctAnswers[0] : ''));
    setFormQCorrectAnswers(q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : ['Đáp án A']));
    setFormQImageUrl(q.imageUrl || '');
    setFormQMatchingPairs(q.matchingPairs ? q.matchingPairs.map(p => ({ left: p.left, right: p.right })) : [{ left: '', right: '' }]);
    setShowQuestionModal(true);
  };

  // Mở modal tạo câu hỏi mới
  const handleOpenNewQuestion = () => {
    setEditingQuestion(null);
    setFormQType('choice');
    setFormQDiff('medium');
    setFormQText('');
    setFormQPoints(1);
    setFormQExpl('');
    setFormQOptions(['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D']);
    setFormQCorrectAnswer('Đáp án A');
    setFormQCorrectAnswers(['Đáp án A']);
    setFormQImageUrl('');
    setFormQMatchingPairs([{ left: 'Khái niệm 1', right: 'Định nghĩa 1' }, { left: 'Khái niệm 2', right: 'Định nghĩa 2' }]);
    setShowQuestionModal(true);
  };

  // Thêm phương án trắc nghiệm (cho phép linh hoạt 2, 3, 4, 5, 6... đáp án)
  const handleAddOption = () => {
    if (formQOptions.length >= 10) {
      showToast('Tối đa 10 phương án lựa chọn!', 'warning');
      return;
    }
    const nextChar = String.fromCharCode(65 + formQOptions.length);
    setFormQOptions(prev => [...prev, `Đáp án ${nextChar}`]);
  };

  // Xóa bớt phương án trắc nghiệm
  const handleDeleteOption = (indexToRemove: number) => {
    if (formQOptions.length <= 2) {
      showToast('Cần có ít nhất 2 phương án lựa chọn!', 'warning');
      return;
    }
    const removedOpt = formQOptions[indexToRemove];
    const newOpts = formQOptions.filter((_, idx) => idx !== indexToRemove);
    setFormQOptions(newOpts);
    if (formQCorrectAnswer === removedOpt) {
      setFormQCorrectAnswer(newOpts[0] || '');
    }
    setFormQCorrectAnswers(prev => prev.filter(a => a !== removedOpt));
  };

  // Mở modal xem trước từng câu hỏi
  const handleOpenPreviewQuestion = (q: QuizQuestion) => {
    const idx = activeQuiz.questions.findIndex(item => item.id === q.id);
    setPreviewQuestionIndex(idx >= 0 ? idx : 0);
    setPreviewShowCorrect(false);
    setPreviewUserAnswer(null);
    setPreviewAnswerChecked(null);
    setShowPreviewModal(true);
  };

  // Mở modal xem trước toàn bộ đề thi (bắt đầu từ câu 1)
  const handleOpenPreviewExam = () => {
    if (!activeQuiz.questions || activeQuiz.questions.length === 0) {
      showToast('Bộ đề hiện chưa có câu hỏi nào để xem trước!', 'warning');
      return;
    }
    setPreviewQuestionIndex(0);
    setPreviewShowCorrect(false);
    setPreviewUserAnswer(null);
    setPreviewAnswerChecked(null);
    setShowPreviewModal(true);
  };

  // Chọn câu hỏi trong modal xem trước
  const handleSelectPreviewQuestion = (idx: number) => {
    if (idx < 0 || idx >= activeQuiz.questions.length) return;
    setPreviewQuestionIndex(idx);
    setPreviewShowCorrect(false);
    setPreviewUserAnswer(null);
    setPreviewAnswerChecked(null);
  };

  // Thử nghiệm kiểm tra đáp án trong modal xem trước
  const handleTestPreviewAnswer = (currentQ: QuizQuestion) => {
    if (previewUserAnswer === null || previewUserAnswer === undefined || previewUserAnswer === '') {
      showToast('Vui lòng chọn hoặc nhập đáp án để thử nghiệm!', 'warning');
      return;
    }

    let isCorrect = false;
    if (currentQ.type === 'choice') {
      isCorrect = previewUserAnswer === currentQ.correctAnswer;
    } else if (currentQ.type === 'multiple_choice') {
      const userArr: string[] = Array.isArray(previewUserAnswer) ? previewUserAnswer : [];
      const correctArr: string[] = currentQ.correctAnswers && currentQ.correctAnswers.length > 0
        ? currentQ.correctAnswers
        : (currentQ.correctAnswer ? [currentQ.correctAnswer] : []);
      isCorrect = userArr.length === correctArr.length && 
        userArr.every(ans => correctArr.includes(ans)) && 
        correctArr.every(ans => userArr.includes(ans));
    } else if (currentQ.type === 'fill_blank') {
      const userText = (previewUserAnswer || '').toString().trim().toLowerCase();
      const targetText = (currentQ.correctAnswer || '').toString().trim().toLowerCase();
      isCorrect = userText === targetText;
    } else if (currentQ.type === 'matching') {
      const userMatches = previewUserAnswer || {};
      const pairs = currentQ.matchingPairs || [];
      if (pairs.length === 0) isCorrect = true;
      else {
        isCorrect = pairs.every(p => userMatches[p.left] === p.right);
      }
    } else if (currentQ.type === 'essay') {
      const keywords = (currentQ.correctAnswer || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const userText = (previewUserAnswer || '').toString().toLowerCase();
      isCorrect = keywords.length > 0 ? keywords.some(kw => userText.includes(kw)) : true;
    }

    setPreviewAnswerChecked(isCorrect);
  };

  // Xuất bảng điểm chi tiết dạng Excel (.xlsx)
  const handleExportExcel = () => {
    const targetSubmissions = filteredSubmissions.length > 0 ? filteredSubmissions : activeQuizSubmissions;
    if (targetSubmissions.length === 0) {
      showToast('Chưa có dữ liệu bài nộp để xuất Excel!', 'warning');
      return;
    }

    const exportPassCount = targetSubmissions.filter(s => s.passed).length;
    const exportPassRate = targetSubmissions.length > 0 ? Math.round((exportPassCount / targetSubmissions.length) * 100) : 0;
    const exportAvg = targetSubmissions.length > 0 ? (targetSubmissions.reduce((acc, cur) => acc + cur.score, 0) / targetSubmissions.length).toFixed(1) : '0';

    const headerInfo = [
      ['BẢNG ĐIỂM CHI TIẾT BÀI THI TRẮC NGHIỆM'],
      ['Tên bộ đề:', activeQuiz.title],
      ['Môn học:', activeQuiz.subject],
      ['Mã phòng thi:', activeQuiz.code],
      ['Số lượng câu hỏi:', activeQuiz.questions.length],
      ['Thời gian làm bài:', `${activeQuiz.settings.timeLimitMinutes} phút`],
      ['Tổng số lượt nộp:', `${targetSubmissions.length} lượt${filteredSubmissions.length !== activeQuizSubmissions.length ? ' (Đã áp dụng bộ lọc)' : ''}`],
      ['Tỷ lệ đạt:', `${exportPassRate}%`],
      ['Điểm trung bình:', `${exportAvg}/10`],
      ['Thời điểm xuất file:', new Date().toLocaleString('vi-VN')],
      []
    ];

    const tableHeader = [
      'STT',
      'Họ và tên thí sinh',
      'MSSV / Mã SV',
      'Lớp / Đơn vị',
      'Điểm số (/10)',
      'Tổng điểm đạt',
      'Tỷ lệ %',
      'Xếp loại',
      'Thời gian làm bài (giây)',
      'Thời gian nộp bài'
    ];

    const tableRows = targetSubmissions.map((s, idx) => [
      idx + 1,
      s.studentName,
      s.studentId || '',
      s.className || '',
      s.score,
      `${s.score}/${s.totalPoints}`,
      `${s.percentage}%`,
      s.passed ? 'ĐẠT' : 'CHƯA ĐẠT',
      s.timeSpentSeconds || 0,
      new Date(s.submittedAt).toLocaleString('vi-VN')
    ]);

    const worksheetData = [...headerInfo, tableHeader, ...tableRows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws['!cols'] = [
      { wch: 6 },
      { wch: 26 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 },
      { wch: 15 },
      { wch: 12 },
      { wch: 14 },
      { wch: 22 },
      { wch: 22 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bảng Điểm');

    const fileName = `BangDiem_${activeQuiz.code}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast('Đã xuất file Excel bảng điểm thành công!', 'success');
  };

  // Chọn hoặc bỏ chọn một bài nộp của sinh viên
  const handleToggleSelectSub = (id: string) => {
    setSelectedSubIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Chọn hoặc bỏ chọn tất cả bài nộp trong trang hoặc trong danh sách lọc
  const handleToggleSelectAllSubs = (subList: StudentSubmission[]) => {
    const listIds = subList.map(s => s.id);
    const allSelected = listIds.length > 0 && listIds.every(id => selectedSubIds.includes(id));
    if (allSelected) {
      setSelectedSubIds(prev => prev.filter(id => !listIds.includes(id)));
    } else {
      setSelectedSubIds(prev => Array.from(new Set([...prev, ...listIds])));
    }
  };

  // Xóa 1 hoặc nhiều bài nộp đã chọn
  const handleDeleteSubmissions = async (idsToDelete: string[]) => {
    if (!idsToDelete || idsToDelete.length === 0) {
      showToast('Vui lòng chọn ít nhất một sinh viên / bài thi để xóa!', 'warning');
      return;
    }

    const count = idsToDelete.length;
    const confirmMsg = count === 1
      ? 'Bạn có chắc chắn muốn xóa thông tin bài thi của sinh viên này?'
      : `Bạn có chắc chắn muốn xóa ${count} bài thi của các sinh viên đã chọn?`;

    if (!window.confirm(confirmMsg)) return;

    setIsDeletingSubs(true);
    try {
      // 1. Gọi backend API xóa trong Database
      await fetch('/api/quiz-api?action=delete-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToDelete })
      });

      // 2. Cập nhật state local
      setSubmissions(prev => prev.filter(s => !idsToDelete.includes(s.id)));
      setSelectedSubIds(prev => prev.filter(id => !idsToDelete.includes(id)));

      // 3. Cập nhật localStorage
      if (user) {
        try {
          const currentLocal = localStorage.getItem(`rchg_quiz_submissions_${user.id}`);
          if (currentLocal) {
            const parsed: StudentSubmission[] = JSON.parse(currentLocal);
            const remaining = parsed.filter(s => !idsToDelete.includes(s.id));
            localStorage.setItem(`rchg_quiz_submissions_${user.id}`, JSON.stringify(remaining));
          }
        } catch {}
      }

      showToast(`Đã xóa thành công ${count} thông tin bài thi của sinh viên!`, 'success');
    } catch (err) {
      console.error('Delete submissions error:', err);
      // Vẫn cập nhật client nếu API gặp trục trặc mạng
      setSubmissions(prev => prev.filter(s => !idsToDelete.includes(s.id)));
      setSelectedSubIds(prev => prev.filter(id => !idsToDelete.includes(id)));
      showToast(`Đã xóa ${count} thông tin sinh viên khỏi danh sách!`, 'success');
    } finally {
      setIsDeletingSubs(false);
    }
  };

  // Xóa câu hỏi khỏi ngân hàng
  const handleDeleteQuestion = (qId: string) => {
    const updated = activeQuiz.questions.filter(q => q.id !== qId);
    updateActiveQuiz({ questions: updated });
    showToast('Đã xóa câu hỏi khỏi bộ đề.', 'info');
  };

  // AI Tự Động Sinh Câu Hỏi Trắc Nghiệm Qua Gemini API với cơ chế xoay vòng model
  const handleGenerateAiQuestions = async () => {
    if (!aiTopic.trim()) {
      showToast('Vui lòng nhập chủ đề bài học để AI tạo câu hỏi!', 'warning');
      return;
    }
    setIsGeneratingAi(true);
    try {
      if (customAiKey.trim()) {
        localStorage.setItem('rchg_gemini_api_key', customAiKey.trim());
      }

      const res = await fetch('/api/quiz-api?action=generate-ai-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          count: aiCount,
          difficulty: aiDifficulty,
          customApiKey: customAiKey.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi tạo câu hỏi AI');
      }

      if (Array.isArray(data.questions) && data.questions.length > 0) {
        updateActiveQuiz({ questions: [...activeQuiz.questions, ...data.questions] });
        setShowAiModal(false);
        setAiTopic('');
        showToast(`AI (${data.modelUsed || 'Gemini'}) đã tạo thành công ${data.questions.length} câu hỏi vào ngân hàng!`, 'success');
      } else {
        throw new Error('Dữ liệu AI trả về không có câu hỏi hợp lệ.');
      }
    } catch (err: any) {
      showToast(err.message || 'Không thể tạo câu hỏi AI', 'error');
      // Nếu là lỗi thiếu API key, tự mở form nhập key cho người dùng
      if ((err.message || '').includes('Chưa cấu hình Google Gemini API Key')) {
        setShowKeySetting(true);
      }
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
<div style="position:relative;width:100%;max-width:920px;margin:15px auto;padding-top:72%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.06);">
  <iframe 
    src="data:text/html;charset=utf-8;base64,${b64}" 
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;margin:0;padding:0;background:#f8fafc;" 
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

  // Xử lý tệp đề thi Word / HTML / Text
  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsingDoc(true);
    try {
      const res = await parseExamFile(file);
      if (!res.questions || res.questions.length === 0) {
        showToast('Không nhận diện được câu hỏi nào từ tệp. Vui lòng kiểm tra định dạng!', 'error');
        return;
      }
      setParsedDocResult(res);
      setEditDocTitle(res.title || file.name.replace(/\.[^/.]+$/, ''));
      setEditDocSubject(res.subject || 'Chung');
      setEditDocTime(res.timeLimitMinutes || 60);
      showToast(`Đã nhận diện thành công ${res.questions.length} câu hỏi từ tệp!`, 'success');
    } catch (err: any) {
      showToast('Lỗi khi đọc file: ' + (err.message || 'Không thể giải mã tệp'), 'error');
    } finally {
      setIsParsingDoc(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleApplyDocAsNewQuiz = async () => {
    if (!parsedDocResult) return;
    const newQuiz: QuizPackage = {
      id: `qz-${Date.now()}`,
      userId: user?.id,
      title: editDocTitle.trim() || 'Bộ Đề Thi Mới',
      subject: editDocSubject.trim() || 'Chung',
      description: `Đề thi nhập tự động từ tệp. Đã phân tích ${parsedDocResult.questions.length} câu hỏi.`,
      code: Math.floor(100000 + Math.random() * 900000).toString(),
      isOpen: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        ...DEFAULT_QUIZ.settings,
        timeLimitMinutes: editDocTime || 60,
        difficultyDistribution: {
          easyCount: parsedDocResult.questions.filter(q => q.difficulty === 'easy').length,
          mediumCount: parsedDocResult.questions.filter(q => q.difficulty === 'medium').length,
          hardCount: parsedDocResult.questions.filter(q => q.difficulty === 'hard').length
        }
      },
      questions: parsedDocResult.questions
    };

    setQuizzes(prev => [newQuiz, ...prev]);
    setActiveQuizId(newQuiz.id);
    setShowDocImportModal(false);
    setParsedDocResult(null);
    setActiveTab('questions');
    showToast(`Đang lưu bộ đề mới "${newQuiz.title}" (${newQuiz.questions.length} câu hỏi) vào database...`, 'info');
    await saveQuizToBackend(newQuiz, true);
  };

  const handleAppendDocToActiveQuiz = () => {
    if (!parsedDocResult) return;
    const updated = [...activeQuiz.questions, ...parsedDocResult.questions];
    updateActiveQuiz({ questions: updated });
    setShowDocImportModal(false);
    setParsedDocResult(null);
    setActiveTab('questions');
    showToast(`Đã bổ sung ${parsedDocResult.questions.length} câu hỏi vào bộ đề "${activeQuiz.title}"!`, 'success');
  };

  // Helper xóa dấu tiếng Việt phục vụ tìm kiếm thông minh
  const removeAccents = (str: string) => {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  };

  // Lọc câu hỏi hiển thị & Tìm kiếm thông minh
  const filteredQuestions = activeQuiz.questions.filter(q => {
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false;
    if (filterType !== 'all' && q.type !== filterType) return false;

    if (searchQuery.trim()) {
      const qNorm = removeAccents(searchQuery);
      const questionMatch = removeAccents(q.question).includes(qNorm);
      const optionsMatch = (q.options || []).some(opt => removeAccents(opt).includes(qNorm));
      const answerMatch = removeAccents(String(q.correctAnswer || '')).includes(qNorm);
      const explanationMatch = removeAccents(q.explanation || '').includes(qNorm);
      const matchingMatch = (q.matchingPairs || []).some(
        p => removeAccents(p.left).includes(qNorm) || removeAccents(p.right).includes(qNorm)
      );

      if (!questionMatch && !optionsMatch && !answerMatch && !explanationMatch && !matchingMatch) {
        return false;
      }
    }
    return true;
  });

  // Tự động trở về trang 1 khi thay đổi điều kiện tìm kiếm hoặc phân loại
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDifficulty, filterType, pageSize, activeQuizId]);

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const paginatedQuestions = filteredQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const startIndex = filteredQuestions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filteredQuestions.length);

  // Tính toán thống kê toàn bộ bài nộp của bộ đề đang chọn
  const activeQuizSubmissions = submissions.filter(s => s.quizId === activeQuiz.id);
  const avgScore = activeQuizSubmissions.length > 0 
    ? (activeQuizSubmissions.reduce((acc, cur) => acc + cur.score, 0) / activeQuizSubmissions.length).toFixed(1)
    : '0';
  const passCount = activeQuizSubmissions.filter(s => s.passed).length;
  const passRate = activeQuizSubmissions.length > 0 
    ? Math.round((passCount / activeQuizSubmissions.length) * 100) 
    : 0;

  // Lọc thông minh danh sách bài nộp & sinh viên
  const filteredSubmissions = activeQuizSubmissions.filter(s => {
    // 1. Lọc theo kết quả Đạt / Chưa đạt
    if (subResultFilter === 'passed' && !s.passed) return false;
    if (subResultFilter === 'failed' && s.passed) return false;

    // 2. Lọc theo khoảng thời gian
    const subDate = new Date(s.submittedAt);
    const now = new Date();

    if (subDateFilter === 'today') {
      const isToday = subDate.toDateString() === now.toDateString();
      if (!isToday) return false;
    } else if (subDateFilter === '7days') {
      const diffDays = (now.getTime() - subDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays > 7) return false;
    } else if (subDateFilter === '30days') {
      const diffDays = (now.getTime() - subDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays > 30) return false;
    } else if (subDateFilter === 'custom') {
      if (subStartDate) {
        const start = new Date(`${subStartDate}T00:00:00`);
        if (subDate < start) return false;
      }
      if (subEndDate) {
        const end = new Date(`${subEndDate}T23:59:59.999`);
        if (subDate > end) return false;
      }
    }

    // 3. Tìm kiếm thông minh theo từ khóa (Tên sinh viên, MSSV, Lớp, Điểm)
    if (subSearchQuery.trim()) {
      const queryNorm = removeAccents(subSearchQuery);
      const nameMatch = removeAccents(s.studentName).includes(queryNorm);
      const idMatch = removeAccents(s.studentId || '').includes(queryNorm);
      const classMatch = removeAccents(s.className || '').includes(queryNorm);
      const scoreMatch = String(s.score).includes(subSearchQuery.trim());
      const emailMatch = removeAccents(s.email || '').includes(queryNorm);

      if (!nameMatch && !idMatch && !classMatch && !scoreMatch && !emailMatch) {
        return false;
      }
    }

    return true;
  });

  // Tự động reset trang bảng điểm về 1 khi điều kiện lọc thay đổi
  useEffect(() => {
    setSubPage(1);
  }, [subSearchQuery, subResultFilter, subDateFilter, subStartDate, subEndDate, activeQuizId, subPageSize]);

  // Phân trang danh sách bài nộp
  const totalSubPages = Math.max(1, Math.ceil(filteredSubmissions.length / subPageSize));
  const paginatedSubmissions = filteredSubmissions.slice((subPage - 1) * subPageSize, subPage * subPageSize);

  if (!user) {
    return (
      <div className="quiz-manager-container animate-fade-in" style={{ maxWidth: 640, margin: '60px auto', padding: '1rem' }}>
        <div style={{
          background: 'var(--surface)',
          padding: '2.5rem 2rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center'
        }}>
          <div style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.12)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: '2px solid rgba(99, 102, 241, 0.25)'
          }}>
            <ShieldCheck size={36} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Yêu Cầu Đăng Nhập Hệ Thống
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Hệ thống Quản lý Khảo thí & Bộ đề trắc nghiệm yêu cầu bạn đăng nhập tài khoản để bảo mật dữ liệu. 
            Mỗi người dùng sẽ chỉ có quyền xem, chỉnh sửa và quản lý ngân hàng câu hỏi cùng bảng điểm của chính mình.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontWeight: 600 }}>
              <LogIn size={18} /> Đăng Nhập Ngay
            </Link>
            <Link to="/" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="quiz-manager-container animate-fade-in" style={{ maxWidth: 640, margin: '60px auto', padding: '1rem' }}>
        <div style={{
          background: 'var(--surface)',
          padding: '2.5rem 2rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid #f87171',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center'
        }}>
          <div style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: '2px solid #fca5a5'
          }}>
            <Crown size={36} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: '0.75rem', color: '#991b1b' }}>
            Thời Gian Sử Dụng Của Bạn Đã Hết
          </h2>
          <p style={{ color: '#7f1d1d', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Thời hạn dùng thử miễn phí hoặc gói sử dụng đã kết thúc. Vui lòng gia hạn tài khoản để tiếp tục tạo đề thi, quản lý bài làm và xuất mã nhúng khảo thí.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={() => setIsSubModalOpen(true)} 
              className="btn btn-primary" 
              style={{ padding: '0.75rem 1.75rem', fontWeight: 600, background: '#dc2626' }}
            >
              <Crown size={18} /> Gia Hạn Ngay
            </button>
            <Link to="/" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
              Về Trang Chủ
            </Link>
          </div>
        </div>

        <SubscriptionModal
          isOpen={isSubModalOpen}
          onClose={() => setIsSubModalOpen(false)}
          reason="Tài khoản của bạn đã hết hạn dùng. Vui lòng gia hạn để tiếp tục sử dụng hệ thống Quản lý đề thi."
        />
      </div>
    );
  }

  return (
    <div className="quiz-manager-container animate-fade-in">

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
            className="btn btn-sm"
            disabled={isSavingDb}
            onClick={() => saveQuizToBackend(activeQuiz, true)}
            style={{
              background: isSavingDb ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: isSavingDb ? 'var(--primary)' : '#10b981',
              border: `1px solid ${isSavingDb ? 'var(--primary)' : '#10b981'}`,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            title={lastSavedTime ? `Đã đồng bộ lên Database lúc ${lastSavedTime}` : 'Bấm để đồng bộ và lưu bộ đề vào Database'}
          >
            {isSavingDb ? (
              <>
                <Loader2 className="animate-spin" size={15} /> Đang lưu DB...
              </>
            ) : (
              <>
                <Save size={15} /> {lastSavedTime ? `Đã lưu DB (${lastSavedTime})` : 'Lưu Vào Database'}
              </>
            )}
          </button>
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
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                onClick={() => { setParsedDocResult(null); setShowDocImportModal(true); }}
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                <Upload size={15} /> Nhập File Word / Doc
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowNewQuizModal(true)}>
                <Plus size={16} /> Tạo Bộ Đề Mới
              </button>
            </div>
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
                onClick={handleOpenPreviewExam}
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                title="Xem trước toàn bộ câu hỏi và giao diện làm bài"
              >
                <Eye size={15} /> Xem Trước Đề Thi
              </button>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => { setParsedDocResult(null); setShowDocImportModal(true); }}
                style={{ borderColor: '#10b981', color: '#10b981' }}
              >
                <Upload size={15} /> Import File Word / Doc
              </button>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                onClick={() => setShowAiModal(true)}
              >
                <Sparkles size={15} /> Tạo Bằng AI
              </button>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => setShowBulkModal(true)}
              >
                <FileText size={15} /> Nạp Nhanh Text
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={handleOpenNewQuestion}
              >
                <Plus size={15} /> Thêm Câu Hỏi
              </button>
            </div>
          </div>

          {/* Smart Search & Filters Bar */}
          <div className="qm-filters-bar">
            {/* Search Input */}
            <div className="qm-search-wrapper">
              <Search size={16} className="qm-search-icon" />
              <input
                type="text"
                className="qm-search-input"
                placeholder="Tìm kiếm thông minh: nội dung câu hỏi, phương án, đáp án đúng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="qm-search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="qm-filter-controls">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="qm-label-inline">Độ khó:</span>
                <select 
                  className="qm-select qm-select-compact" 
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                >
                  <option value="all">Tất cả ({activeQuiz.questions.length})</option>
                  <option value="easy">Dễ ({activeQuiz.questions.filter(q => q.difficulty === 'easy').length})</option>
                  <option value="medium">Trung bình ({activeQuiz.questions.filter(q => q.difficulty === 'medium').length})</option>
                  <option value="hard">Khó ({activeQuiz.questions.filter(q => q.difficulty === 'hard').length})</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="qm-label-inline">Hình thức:</span>
                <select 
                  className="qm-select qm-select-compact" 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Tất cả hình thức</option>
                  <option value="choice">Trắc nghiệm ABCD</option>
                  <option value="multiple_choice">Chọn nhiều đáp án</option>
                  <option value="fill_blank">Điền khuyết</option>
                  <option value="matching">Kéo thả / Nối cặp</option>
                  <option value="essay">Tự luận ngắn</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="qm-label-inline">Hiển thị:</span>
                <select 
                  className="qm-select qm-select-compact" 
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value={5}>5 câu / trang</option>
                  <option value={10}>10 câu / trang</option>
                  <option value={20}>20 câu / trang</option>
                  <option value={50}>50 câu / trang</option>
                </select>
              </div>
            </div>
          </div>

          {/* List of Questions */}
          <div className="qm-q-list">
            {paginatedQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <HelpCircle size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <p>
                  {searchQuery 
                    ? `Không tìm thấy câu hỏi nào phù hợp với từ khóa "${searchQuery}".` 
                    : 'Không có câu hỏi nào khớp với bộ lọc. Hãy bấm Tạo Bằng AI hoặc Import File để bổ sung!'}
                </p>
              </div>
            ) : (
              paginatedQuestions.map((q, idx) => {
                const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <div key={q.id} className="qm-q-card">
                    <div className="qm-q-header">
                      <div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span className="qm-badge" style={{ background: '#374151', color: '#fff' }}>Câu #{globalIdx}</span>
                          <span className={`qm-badge qm-badge-${q.difficulty}`}>
                            {q.difficulty === 'easy' ? 'DỄ' : (q.difficulty === 'medium' ? 'TRUNG BÌNH' : 'KHÓ')}
                          </span>
                          <span className="qm-badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            {q.type === 'choice' ? 'TRẮC NGHIỆM ABCD' : (q.type === 'multiple_choice' ? 'CHỌN NHIỀU ĐÁP ÁN' : (q.type === 'fill_blank' ? 'ĐIỀN KHUYẾT' : (q.type === 'matching' ? 'NỐI CẶP' : 'TỰ LUẬN NGẮN')))}
                          </span>
                          {q.imageUrl && (
                            <span className="qm-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <ImageIcon size={11} /> Có ảnh đính kèm
                            </span>
                          )}
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({q.points || 1} điểm)</span>
                        </div>
                        <div className="qm-q-title">{q.question}</div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button 
                          type="button" 
                          className="btn btn-outline btn-xs" 
                          style={{ color: 'var(--primary)', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                          onClick={() => handleOpenPreviewQuestion(q)}
                          title="Xem trước nội dung và cách hiển thị khi thí sinh làm bài"
                        >
                          <Eye size={13} /> Xem trước
                        </button>
                        <button type="button" className="btn btn-outline btn-xs" onClick={() => handleOpenEditQuestion(q)}>
                          <Edit3 size={13} /> Sửa
                        </button>
                        <button type="button" className="btn btn-outline btn-xs" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteQuestion(q.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Hiển thị hình ảnh minh họa câu hỏi nếu có */}
                    {q.imageUrl && (
                      <div style={{ margin: '0.65rem 0', maxWidth: '340px' }}>
                        <img 
                          src={getSafeImageUrl(q.imageUrl)} 
                          alt="Ảnh câu hỏi" 
                          referrerPolicy="no-referrer"
                          onError={(e) => handleImageError(e, q.imageUrl)}
                          style={{ maxHeight: '180px', width: 'auto', maxWidth: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', objectFit: 'contain', background: 'rgba(0,0,0,0.08)', cursor: 'pointer', display: 'block' }}
                          onClick={() => window.open(q.imageUrl, '_blank')}
                          title="Bấm để mở ảnh gốc trong tab mới"
                        />
                      </div>
                    )}

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
                );
              })
            )}
          </div>

          {/* Pagination Bar */}
          {filteredQuestions.length > 0 && (
            <div className="qm-pagination-bar">
              <div className="qm-pagination-info">
                Hiển thị <strong>{startIndex} - {endIndex}</strong> trong tổng số <strong>{filteredQuestions.length}</strong> câu hỏi
                {searchQuery && ` (theo từ khóa "${searchQuery}")`}
              </div>

              <div className="qm-pagination-actions">
                <button
                  type="button"
                  className="qm-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  title="Về trang đầu"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  type="button"
                  className="qm-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  title="Trang trước"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((p, pIdx, arr) => {
                    const prevP = arr[pIdx - 1];
                    const hasGap = prevP && p - prevP > 1;
                    return (
                      <span key={p} style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {hasGap && <span className="qm-page-ellipsis">...</span>}
                        <button
                          type="button"
                          className={`qm-page-btn ${p === currentPage ? 'active' : ''}`}
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </button>
                      </span>
                    );
                  })}

                <button
                  type="button"
                  className="qm-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  title="Trang sau"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  className="qm-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Đến trang cuối"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          )}
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
              disabled={isSavingDb}
              onClick={() => saveQuizToBackend(activeQuiz, true)}
            >
              {isSavingDb ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Lưu Cấu Hình Vào Database
            </button>
          </div>

          <div className="qm-settings-grid">
            {/* Thông tin cơ bản bộ đề thi */}
            <div style={{ gridColumn: '1 / -1', background: 'var(--surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Edit3 size={18} color="var(--primary)" /> Thông Tin Bộ Đề Thi (Tự động đồng bộ Database)
                </h3>
                <span style={{ fontSize: '0.82rem', color: lastSavedTime ? '#10b981' : 'var(--text-muted)', fontWeight: 500 }}>
                  {isSavingDb ? '⏳ Đang lưu...' : (lastSavedTime ? `✓ Đã lưu DB lúc ${lastSavedTime}` : '• Chưa lưu')}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div className="qm-form-group" style={{ margin: 0 }}>
                  <label className="qm-label">Tên bộ đề thi *</label>
                  <input
                    type="text"
                    className="qm-input"
                    value={activeQuiz.title}
                    onChange={(e) => updateActiveQuiz({ title: e.target.value })}
                    placeholder="Nhập tên bộ đề thi..."
                  />
                </div>
                <div className="qm-form-group" style={{ margin: 0 }}>
                  <label className="qm-label">Môn học / Chuyên mục</label>
                  <input
                    type="text"
                    className="qm-input"
                    value={activeQuiz.subject}
                    onChange={(e) => updateActiveQuiz({ subject: e.target.value })}
                    placeholder="Ví dụ: Công nghệ chế tạo máy, Toán, Tin học..."
                  />
                </div>
                <div className="qm-form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                  <label className="qm-label">Mô tả / Hướng dẫn thi cho thí sinh</label>
                  <textarea
                    rows={2}
                    className="qm-textarea"
                    value={activeQuiz.description}
                    onChange={(e) => updateActiveQuiz({ description: e.target.value })}
                    placeholder="Mô tả tóm tắt nội dung bài thi hoặc hướng dẫn cho thí sinh trước khi bấm bắt đầu..."
                  />
                </div>
              </div>
            </div>

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
                <label className="qm-label">Âm nhạc thư giãn trong lúc thi</label>
                <select 
                  className="qm-select"
                  value={activeQuiz.settings.bgMusicType || 'lofi'}
                  onChange={(e) => updateActiveQuiz({ settings: { ...activeQuiz.settings, bgMusicType: e.target.value as any } })}
                >
                  <option value="none">Tắt nhạc nền</option>
                  <option value="lofi">Lofi Chill (Web Audio - Thư thái, tập trung cao)</option>
                  <option value="piano">Piano êm dịu (Web Audio - Giảm căng thẳng)</option>
                  <option value="ambient">Ambient tự nhiên (Web Audio - Sóng biển & đệm êm)</option>
                  <option value="custom">🎵 Nhập link file nhạc tùy chỉnh (.mp3, Google Drive, v.v.)</option>
                </select>

                {activeQuiz.settings.bgMusicType === 'custom' && (
                  <div style={{ marginTop: '0.6rem' }}>
                    <input 
                      type="url"
                      className="qm-input"
                      placeholder="Dán link file nhạc (VD: https://.../audio.mp3 hoặc link Google Drive)"
                      value={activeQuiz.settings.bgMusicUrl || ''}
                      onChange={(e) => updateActiveQuiz({ settings: { ...activeQuiz.settings, bgMusicUrl: e.target.value } })}
                    />
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                      💡 <strong>Hỗ trợ:</strong> Link trực tiếp file <code>.mp3</code>, <code>.ogg</code>, <code>.wav</code> hoặc link chia sẻ từ <strong>Google Drive</strong> (hệ thống sẽ tự động chuyển đổi phát mượt mà).
                    </div>
                  </div>
                )}

                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                  * Nhạc nền sẽ tự động phát lặp lại trong suốt buổi thi giúp thí sinh tập trung và thư giãn tinh thần.
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

              {/* Phản hồi kết quả sau khi thi */}
              <div className="qm-form-group">
                <label className="qm-label">Quyền xem lại bài làm sau khi nộp</label>
                <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <input 
                      type="checkbox" 
                      checked={Boolean(activeQuiz.settings.showCorrectAnswersAfterSubmit)} 
                      onChange={(e) => updateActiveQuiz({ settings: { ...activeQuiz.settings, showCorrectAnswersAfterSubmit: e.target.checked } })}
                    />
                    <span>Cho phép thí sinh xem chi tiết bài làm & đáp án đúng</span>
                  </label>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.6rem', lineHeight: 1.5 }}>
                    {activeQuiz.settings.showCorrectAnswersAfterSubmit ? (
                      <span style={{ color: '#10b981', fontWeight: 500 }}>
                        ✓ Đang bật: Sau khi nộp bài, thí sinh sẽ xem được chi tiết từng câu hỏi, đáp án đã chọn, đáp án đúng và lời giải thích.
                      </span>
                    ) : (
                      <span>
                        🔒 <strong>Mặc định tắt</strong>: Sau khi nộp bài, thí sinh chỉ xem được tổng điểm và xếp loại Đạt/Chưa đạt (hoàn toàn không lộ đề thi và đáp án).
                      </span>
                    )}
                  </p>
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
          <div className="qm-panel-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h2 className="qm-panel-title">
                <Users size={20} color="var(--primary)" /> Bảng Điểm & Lịch Sử Bài Thi: {activeQuiz.title}
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Tổng cộng {activeQuizSubmissions.length} lượt nộp bài • Tỷ lệ đạt chuẩn: {passRate}% • Điểm trung bình: {avgScore}/10.
                {filteredSubmissions.length !== activeQuizSubmissions.length && (
                  <span style={{ color: 'var(--primary)', fontWeight: 600, marginLeft: '0.5rem' }}>
                    (Đang hiển thị {filteredSubmissions.length} kết quả khớp bộ lọc)
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {selectedSubIds.length > 0 && (
                <button 
                  type="button" 
                  className="btn btn-sm"
                  onClick={() => handleDeleteSubmissions(selectedSubIds)}
                  disabled={isDeletingSubs}
                  style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
                  title="Xóa tất cả thí sinh đã chọn"
                >
                  <Trash2 size={15} /> Xóa ({selectedSubIds.length}) sinh viên đã chọn
                </button>
              )}
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={handleExportExcel}
                style={{ background: '#10b981', borderColor: '#10b981' }}
                title="Tải bảng điểm Excel của danh sách đang hiển thị"
              >
                <FileSpreadsheet size={16} /> Xuất Bảng Điểm Excel (.xlsx)
              </button>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => {
                  const targetList = filteredSubmissions.length > 0 ? filteredSubmissions : activeQuizSubmissions;
                  if (targetList.length === 0) {
                    showToast('Chưa có dữ liệu bài nộp để xuất!', 'warning');
                    return;
                  }
                  const csvHeader = 'Họ tên,MSSV / Lớp,Điểm số,Tổng điểm,Tỷ lệ %,Kết quả,Thời gian nộp\n';
                  const rows = targetList.map(s => 
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
                <Download size={15} /> Xuất CSV
              </button>
            </div>
          </div>

          {/* BỘ CÔNG CỤ TÌM KIẾM THÔNG MINH & BỘ LỌC KHOẢNG THỜI GIAN */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            {/* Hàng 1: Ô tìm kiếm thông minh + Lọc kết quả */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  className="qm-input"
                  style={{ paddingLeft: '2.4rem', height: '40px', fontSize: '0.88rem' }}
                  placeholder="Tìm kiếm thông minh: Tên sinh viên, MSSV, Lớp học, Điểm số..."
                  value={subSearchQuery}
                  onChange={(e) => setSubSearchQuery(e.target.value)}
                />
                {subSearchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSubSearchQuery('')}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Lọc theo Kết quả thi */}
              <div style={{ minWidth: '160px' }}>
                <select 
                  className="qm-select"
                  style={{ height: '40px', fontSize: '0.88rem' }}
                  value={subResultFilter}
                  onChange={(e) => setSubResultFilter(e.target.value as any)}
                >
                  <option value="all">Tất cả xếp loại</option>
                  <option value="passed">✅ Đạt chuẩn (Pass)</option>
                  <option value="failed">❌ Chưa đạt (Fail)</option>
                </select>
              </div>

              {/* Lọc nhanh theo Mốc thời gian */}
              <div style={{ minWidth: '170px' }}>
                <select 
                  className="qm-select"
                  style={{ height: '40px', fontSize: '0.88rem' }}
                  value={subDateFilter}
                  onChange={(e) => setSubDateFilter(e.target.value as any)}
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="7days">7 ngày qua</option>
                  <option value="30days">30 ngày qua</option>
                  <option value="custom">Tùy chọn khoảng ngày...</option>
                </select>
              </div>

              {(subSearchQuery || subResultFilter !== 'all' || subDateFilter !== 'all') && (
                <button 
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ height: '40px' }}
                  onClick={() => {
                    setSubSearchQuery('');
                    setSubResultFilter('all');
                    setSubDateFilter('all');
                    setSubStartDate('');
                    setSubEndDate('');
                  }}
                  title="Đặt lại toàn bộ bộ lọc"
                >
                  <RotateCcw size={14} /> Xóa bộ lọc
                </button>
              )}
            </div>

            {/* Hàng 2: Chọn khoảng thời gian tùy chỉnh (Từ ngày - Đến ngày) nếu chọn custom */}
            {subDateFilter === 'custom' && (
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                paddingTop: '0.5rem',
                borderTop: '1px dashed var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={15} color="var(--primary)" />
                  <span>Khoảng ngày nộp bài:</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Từ ngày:</label>
                  <input 
                    type="date"
                    className="qm-input"
                    style={{ width: '160px', height: '36px', fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                    value={subStartDate}
                    onChange={(e) => setSubStartDate(e.target.value)}
                  />
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Đến ngày:</label>
                  <input 
                    type="date"
                    className="qm-input"
                    style={{ width: '160px', height: '36px', fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                    value={subEndDate}
                    onChange={(e) => setSubEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
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
            ) : filteredSubmissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
                <Filter size={36} style={{ margin: '0 auto 0.6rem', opacity: 0.4 }} />
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>Không tìm thấy lượt nộp bài nào khớp với điều kiện lọc!</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Hãy thử thay đổi từ khóa tìm kiếm hoặc mở rộng khoảng thời gian.
                </p>
                <button 
                  type="button" 
                  className="btn btn-outline btn-xs" 
                  style={{ marginTop: '0.85rem' }}
                  onClick={() => {
                    setSubSearchQuery('');
                    setSubResultFilter('all');
                    setSubDateFilter('all');
                    setSubStartDate('');
                    setSubEndDate('');
                  }}
                >
                  <RotateCcw size={12} /> Bỏ lọc và xem tất cả
                </button>
              </div>
            ) : (
              <>
                <table className="qm-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input 
                          type="checkbox"
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          title="Chọn/Bỏ chọn tất cả trang này"
                          checked={paginatedSubmissions.length > 0 && paginatedSubmissions.every(s => selectedSubIds.includes(s.id))}
                          onChange={() => handleToggleSelectAllSubs(paginatedSubmissions)}
                        />
                      </th>
                      <th>STT</th>
                      <th>Họ và tên thí sinh</th>
                      <th>Lớp / MSSV</th>
                      <th>Điểm số</th>
                      <th>Tỷ lệ %</th>
                      <th>Xếp loại</th>
                      <th>Thời gian nộp</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSubmissions.map((sub, idx) => {
                      const globalIdx = (subPage - 1) * subPageSize + idx + 1;
                      const isSelected = selectedSubIds.includes(sub.id);
                      return (
                        <tr key={sub.id} style={{ background: isSelected ? 'rgba(79, 70, 229, 0.08)' : undefined }}>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox"
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                              checked={isSelected}
                              onChange={() => handleToggleSelectSub(sub.id)}
                            />
                          </td>
                          <td>#{globalIdx}</td>
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
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={() => handleDeleteSubmissions([sub.id])}
                              style={{ color: '#ef4444', borderColor: '#ef4444', padding: '4px 8px' }}
                              title="Xóa bài thi của thí sinh này"
                              disabled={isDeletingSubs}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Thanh Phân Trang Bảng Điểm */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 0.5rem 0.25rem',
                  borderTop: '1px solid var(--border)',
                  marginTop: '0.75rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Hiển thị <strong>{filteredSubmissions.length === 0 ? 0 : (subPage - 1) * subPageSize + 1} - {Math.min(subPage * subPageSize, filteredSubmissions.length)}</strong> trên tổng số <strong>{filteredSubmissions.length}</strong> bài nộp
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <span>Hiển thị:</span>
                      <select 
                        className="qm-select qm-select-compact"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.82rem' }}
                        value={subPageSize}
                        onChange={(e) => { setSubPageSize(Number(e.target.value)); setSubPage(1); }}
                      >
                        <option value={10}>10 / trang</option>
                        <option value={25}>25 / trang</option>
                        <option value={50}>50 / trang</option>
                        <option value={100}>100 / trang</option>
                      </select>
                    </div>

                    {totalSubPages > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          disabled={subPage <= 1}
                          onClick={() => setSubPage(prev => Math.max(prev - 1, 1))}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, padding: '0 0.4rem', color: 'var(--text-primary)' }}>
                          Trang {subPage} / {totalSubPages}
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          disabled={subPage >= totalSubPages}
                          onClick={() => setSubPage(prev => Math.min(prev + 1, totalSubPages))}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
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

              {/* Gemini Key Config Toggle */}
              <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-xs"
                    onClick={() => setShowKeySetting(!showKeySetting)}
                    style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                  >
                    ⚙️ {showKeySetting ? 'Ẩn cấu hình Gemini API Key' : 'Tùy chỉnh Gemini API Key cá nhân'}
                  </button>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Mặc định dùng key từ Quản trị viên
                  </span>
                </div>

                {showKeySetting && (
                  <div style={{ marginTop: '0.75rem', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <label className="qm-label" style={{ fontSize: '0.82rem' }}>
                      Gemini API Key (Tùy chọn ghi đè):
                    </label>
                    <input 
                      type="password" 
                      className="qm-input" 
                      placeholder="AIzaSy... (Để trống nếu dùng cấu hình chung của Admin)"
                      value={customAiKey}
                      onChange={(e) => setCustomAiKey(e.target.value)}
                      style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Lấy miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Google AI Studio</a>. Key này sẽ lưu tại máy bạn.
                    </div>
                  </div>
                )}
              </div>

              {isGeneratingAi && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.25)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Sparkles size={20} color="var(--primary)" style={{ animation: 'spin 2s linear infinite' }} />
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    <strong>Đang kết nối Google Gemini AI...</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Hệ thống tự động xoay vòng qua các model (2.5 Flash, 2.0 Flash, 1.5 Flash, 1.5 Flash 8B, 1.5 Pro) để đảm bảo có kết quả.
                    </div>
                  </div>
                </div>
              )}
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
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      setFormQType(newType);
                      if (newType === 'multiple_choice') {
                        if (!formQCorrectAnswers || formQCorrectAnswers.length === 0) {
                          setFormQCorrectAnswers(formQCorrectAnswer ? [formQCorrectAnswer] : [formQOptions[0] || 'Đáp án A']);
                        }
                      } else if (newType === 'choice') {
                        if (!formQCorrectAnswer && formQCorrectAnswers && formQCorrectAnswers.length > 0) {
                          setFormQCorrectAnswer(formQCorrectAnswers[0]);
                        }
                      }
                    }}
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

              {/* Hình ảnh minh họa cho câu hỏi & Đồng bộ Google Drive */}
              <div className="qm-form-group" style={{ background: 'var(--bg-tertiary)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="qm-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ImageIcon size={15} color="var(--primary)" /> Hình ảnh minh họa câu hỏi (Tùy chọn)
                  </label>
                  {formQImageUrl && (
                    <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Cloud size={13} /> {formQImageUrl.includes('drive.google.com') ? 'Đã đồng bộ Google Drive' : 'Đã có ảnh'}
                    </span>
                  )}
                </div>

                <input 
                  type="file" 
                  ref={imageFileInputRef} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleUploadQuestionImage} 
                />

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm" 
                    onClick={() => imageFileInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    <Cloud size={15} /> {isUploadingImage ? 'Đang tải lên Drive...' : 'Tải ảnh & Đồng bộ Google Drive'}
                  </button>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <input 
                      type="text" 
                      className="qm-input" 
                      placeholder="Hoặc dán URL ảnh trực tiếp..."
                      value={formQImageUrl}
                      onChange={(e) => setFormQImageUrl(e.target.value)}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                  {formQImageUrl && (
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm" 
                      style={{ color: 'var(--danger)' }}
                      onClick={() => setFormQImageUrl('')}
                      title="Gỡ ảnh khỏi câu hỏi"
                    >
                      <Trash2 size={14} /> Xóa ảnh
                    </button>
                  )}
                </div>

                {formQImageUrl && (
                  <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img 
                      src={getSafeImageUrl(formQImageUrl)} 
                      alt="Xem trước ảnh câu hỏi" 
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, formQImageUrl)}
                      style={{ maxHeight: '140px', maxWidth: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', objectFit: 'contain', background: 'rgba(0,0,0,0.06)' }} 
                    />
                    <a 
                      href={formQImageUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-outline btn-xs"
                      style={{ height: 'fit-content' }}
                    >
                      <ExternalLink size={12} /> Mở ảnh gốc
                    </a>
                  </div>
                )}
              </div>

              {/* Options for ABCD / Dynamic options */}
              {(formQType === 'choice' || formQType === 'multiple_choice') && (
                <div className="qm-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="qm-label" style={{ margin: 0 }}>
                      Các phương án lựa chọn ({formQOptions.length} phương án):
                    </label>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-xs"
                      onClick={handleAddOption}
                      style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                    >
                      <Plus size={13} /> Thêm phương án ({String.fromCharCode(65 + formQOptions.length)})
                    </button>
                  </div>

                  {formQOptions.map((opt, oIdx) => {
                    const charLabel = String.fromCharCode(65 + oIdx);
                    const isMultiple = formQType === 'multiple_choice';
                    const isChecked = isMultiple ? formQCorrectAnswers.includes(opt) : formQCorrectAnswer === opt;

                    return (
                      <div key={oIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.45rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, width: '24px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                          {charLabel}.
                        </span>
                        <input 
                          type="text" 
                          className="qm-input" 
                          value={opt}
                          placeholder={`Nội dung phương án ${charLabel}...`}
                          onChange={(e) => {
                            const val = e.target.value;
                            const oldVal = formQOptions[oIdx];
                            const newOpts = [...formQOptions];
                            newOpts[oIdx] = val;
                            setFormQOptions(newOpts);
                            if (formQCorrectAnswer === oldVal) {
                              setFormQCorrectAnswer(val);
                            }
                            if (formQCorrectAnswers.includes(oldVal)) {
                              setFormQCorrectAnswers(prev => prev.map(a => a === oldVal ? val : a));
                            }
                          }}
                        />

                        {isMultiple ? (
                          <button 
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setFormQCorrectAnswers(prev => prev.filter(a => a !== opt));
                              } else {
                                setFormQCorrectAnswers(prev => [...prev, opt]);
                              }
                            }}
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.45rem', 
                              cursor: 'pointer', 
                              padding: '0.45rem 0.8rem', 
                              borderRadius: '6px', 
                              background: isChecked ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-tertiary)',
                              border: isChecked ? '1.5px solid #10b981' : '1px solid var(--border)',
                              fontSize: '0.82rem',
                              whiteSpace: 'nowrap',
                              color: isChecked ? '#10b981' : 'var(--text-secondary)',
                              fontWeight: isChecked ? 700 : 500,
                              transition: 'all 0.15s ease'
                            }}
                            title="Bấm để đánh dấu hoặc bỏ chọn đáp án đúng này"
                          >
                            <span style={{ fontSize: '1.15rem', lineHeight: 1, color: isChecked ? '#10b981' : 'inherit' }}>
                              {isChecked ? '☑' : '☐'}
                            </span>
                            <span>{isChecked ? 'Đáp án đúng' : 'Đánh dấu đúng'}</span>
                          </button>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => setFormQCorrectAnswer(opt)}
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.45rem', 
                              cursor: 'pointer', 
                              padding: '0.45rem 0.8rem', 
                              borderRadius: '6px', 
                              background: isChecked ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-tertiary)',
                              border: isChecked ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                              fontSize: '0.82rem',
                              whiteSpace: 'nowrap',
                              color: isChecked ? 'var(--primary)' : 'var(--text-secondary)',
                              fontWeight: isChecked ? 700 : 500,
                              transition: 'all 0.15s ease'
                            }}
                            title="Bấm để chọn làm đáp án đúng duy nhất"
                          >
                            <span style={{ fontSize: '1.15rem', lineHeight: 1, color: isChecked ? 'var(--primary)' : 'inherit' }}>
                              {isChecked ? '🔘' : '⚪'}
                            </span>
                            <span>{isChecked ? 'Đáp án đúng' : 'Chọn đúng'}</span>
                          </button>
                        )}

                        {formQOptions.length > 2 && (
                          <button 
                            type="button" 
                            className="btn btn-outline btn-xs" 
                            style={{ color: 'var(--danger)', padding: '0.45rem 0.55rem' }}
                            onClick={() => handleDeleteOption(oIdx)}
                            title="Xóa bớt phương án này"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: formQType === 'multiple_choice' ? '#10b981' : 'var(--primary)', fontWeight: 600 }}>
                      {formQType === 'multiple_choice' 
                        ? '☑️ Đang ở chế độ Chọn Nhiều Đáp Án: Bấm nút "Đánh dấu đúng" ở các phương án để chọn 2, 3 hoặc nhiều đáp án đúng cùng lúc.' 
                        : '🔘 Đang ở chế độ 1 Đáp Án Đúng: Bấm nút "Chọn đúng" ở phương án là đáp án chính xác duy nhất.'}
                    </span>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-xs"
                      onClick={handleAddOption}
                      style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                    >
                      <Plus size={13} /> Thêm phương án ({String.fromCharCode(65 + formQOptions.length)})
                    </button>
                  </div>
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

      {/* MODAL IMPORT FILE WORD / DOC / HTML */}
      {showDocImportModal && (
        <div className="modal-overlay" onClick={() => !isParsingDoc && setShowDocImportModal(false)}>
          <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FileUp size={20} color="var(--primary)" /> Nhập Đề Thi Từ File Word / Docx / HTML
              </h3>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => !isParsingDoc && setShowDocImportModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <input
                type="file"
                ref={docFileInputRef}
                accept=".docx,.doc,.html,.htm,.txt"
                style={{ display: 'none' }}
                onChange={handleDocFileUpload}
              />

              {!parsedDocResult ? (
                <div>
                  <div 
                    className="qm-dropzone" 
                    onClick={() => docFileInputRef.current?.click()}
                  >
                    <FileUp size={44} color="var(--primary)" style={{ opacity: 0.8 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {isParsingDoc ? 'Đang phân tích cấu trúc đề thi...' : 'Bấm vào đây để tải lên hoặc kéo thả tệp vào'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Hỗ trợ file Microsoft Word (.docx, .doc), HTML hoặc Text (.txt)
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" disabled={isParsingDoc}>
                      {isParsingDoc ? 'Đang xử lý...' : 'Chọn Tệp Đề Thi'}
                    </button>
                  </div>

                  <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                      💡 Cấu trúc tệp được hỗ trợ tự động:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <li><strong>Tiêu đề & Môn học:</strong> Tự động nhận diện từ thẻ tiêu đề (Đề thi..., Môn học...).</li>
                      <li><strong>Thời gian làm bài:</strong> Tự động phát hiện (ví dụ: <em>"Thời gian làm bài: 90 phút"</em>).</li>
                      <li><strong>Câu hỏi trắc nghiệm:</strong> Nhận dạng các câu hỏi <code>Câu 1:</code>, <code>Câu 2:</code> kèm các phương án <code>A.</code>, <code>B.</code>, <code>C.</code>, <code>D.</code></li>
                      <li><strong>Bảng đáp án:</strong> Tự động nhận diện bảng đáp án dạng <code>STT | Đáp án</code> ở cuối đề thi và gán đáp án chính xác cho từng câu!</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Metadata Editor */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="qm-form-group">
                      <label className="qm-label">Tên đề thi *</label>
                      <input
                        type="text"
                        className="qm-input"
                        value={editDocTitle}
                        onChange={(e) => setEditDocTitle(e.target.value)}
                      />
                    </div>
                    <div className="qm-form-group">
                      <label className="qm-label">Môn học</label>
                      <input
                        type="text"
                        className="qm-input"
                        value={editDocSubject}
                        onChange={(e) => setEditDocSubject(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="qm-label" style={{ margin: 0 }}>Thời gian:</span>
                      <input
                        type="number"
                        min={0}
                        max={180}
                        className="qm-input"
                        style={{ width: '90px' }}
                        value={editDocTime}
                        onChange={(e) => setEditDocTime(Number(e.target.value))}
                      />
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>phút</span>
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                      <span className="qm-badge" style={{ background: '#10b981', color: '#fff', padding: '6px 12px', fontSize: '0.85rem' }}>
                        ✓ Đã bóc tách {parsedDocResult.questions.length} câu hỏi
                      </span>
                      {Object.keys(parsedDocResult.answerMap).length > 0 && (
                        <span className="qm-badge" style={{ background: 'var(--primary)', color: '#fff', padding: '6px 12px', fontSize: '0.85rem' }}>
                          ✓ Khớp {Object.keys(parsedDocResult.answerMap).length} đáp án từ bảng cuối đề
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preview list */}
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    Xem trước danh sách câu hỏi ({parsedDocResult.questions.length} câu):
                  </div>
                  <div className="qm-doc-preview-list">
                    {parsedDocResult.questions.map((q, idx) => (
                      <div key={q.id} className="qm-doc-preview-item">
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)' }}>
                            Câu {idx + 1}:
                          </span>
                          <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            {q.question}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem', fontSize: '0.82rem' }}>
                          {q.options?.map((opt, oIdx) => {
                            const isCorrect = q.correctAnswer === opt;
                            return (
                              <div 
                                key={oIdx} 
                                style={{ 
                                  color: isCorrect ? '#10b981' : 'var(--text-secondary)',
                                  fontWeight: isCorrect ? 700 : 400
                                }}
                              >
                                {['A', 'B', 'C', 'D'][oIdx] || oIdx + 1}. {opt} {isCorrect && '✓ (Đúng)'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                onClick={() => { setShowDocImportModal(false); setParsedDocResult(null); }}
              >
                Hủy
              </button>

              {parsedDocResult && (
                <>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm" 
                    onClick={() => { setParsedDocResult(null); docFileInputRef.current?.click(); }}
                  >
                    Chọn file khác
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    onClick={handleAppendDocToActiveQuiz}
                  >
                    Bổ Sung Vào Đề Hiện Tại
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm"
                    onClick={handleApplyDocAsNewQuiz}
                  >
                    Tạo Bộ Đề Mới Tự Động
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM TRƯỚC NỘI DUNG VÀ CÁCH HIỂN THỊ CÂU HỎI */}
      {showPreviewModal && activeQuiz.questions && activeQuiz.questions.length > 0 && (() => {
        const currentQ = activeQuiz.questions[previewQuestionIndex] || activeQuiz.questions[0];
        const totalQ = activeQuiz.questions.length;

        return (
          <div className="modal-overlay" onClick={() => setShowPreviewModal(false)} style={{ zIndex: 1200, padding: '1rem' }}>
            <div 
              className="modal-content" 
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: previewDevice === 'mobile' ? '460px' : '840px',
                width: '100%',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                padding: '0',
                overflow: 'hidden',
                borderRadius: '1.25rem',
                border: '1px solid var(--border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
                transition: 'max-width 0.25s ease'
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Eye size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Xem Trước Giao Diện & Câu Hỏi
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Câu {previewQuestionIndex + 1} / {totalQ} • {activeQuiz.title}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Device View Mode Switch */}
                  <div style={{
                    display: 'flex',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    padding: '2px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className="btn"
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.78rem',
                        borderRadius: '0.35rem',
                        border: 'none',
                        background: previewDevice === 'desktop' ? 'var(--primary)' : 'transparent',
                        color: previewDevice === 'desktop' ? '#fff' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer'
                      }}
                      title="Chế độ màn hình Máy tính (Desktop)"
                    >
                      <Monitor size={14} /> Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className="btn"
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.78rem',
                        borderRadius: '0.35rem',
                        border: 'none',
                        background: previewDevice === 'mobile' ? 'var(--primary)' : 'transparent',
                        color: previewDevice === 'mobile' ? '#fff' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer'
                      }}
                      title="Mô phỏng màn hình Điện thoại (Mobile)"
                    >
                      <Smartphone size={14} /> Mobile
                    </button>
                  </div>

                  <button 
                    type="button" 
                    className="modal-close" 
                    onClick={() => setShowPreviewModal(false)}
                    style={{ margin: 0, padding: '0.35rem' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body Content */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: previewDevice === 'mobile' ? '1.25rem 0.75rem' : '1.5rem',
                background: previewDevice === 'mobile' ? 'rgba(0,0,0,0.08)' : 'var(--bg-primary)',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '100%',
                  maxWidth: previewDevice === 'mobile' ? '375px' : '100%',
                  background: 'var(--bg-primary)',
                  borderRadius: previewDevice === 'mobile' ? '28px' : '0.85rem',
                  border: previewDevice === 'mobile' ? '6px solid #1e293b' : '1px solid var(--border)',
                  boxShadow: previewDevice === 'mobile' ? '0 12px 32px rgba(0,0,0,0.3)' : 'var(--shadow-sm)',
                  padding: previewDevice === 'mobile' ? '1.25rem 1rem 1.75rem' : '1.5rem',
                  boxSizing: 'border-box',
                  position: 'relative'
                }}>
                  {/* Simulated Mobile Speaker & Camera Bar */}
                  {previewDevice === 'mobile' && (
                    <div style={{
                      width: '90px',
                      height: '14px',
                      background: '#1e293b',
                      borderRadius: '10px',
                      margin: '-0.5rem auto 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}>
                      <div style={{ width: '40px', height: '4px', background: '#334155', borderRadius: '2px' }}></div>
                      <div style={{ width: '5px', height: '5px', background: '#475569', borderRadius: '50%' }}></div>
                    </div>
                  )}

                  {/* Question Meta Badges */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="qm-badge" style={{ background: 'var(--primary)', color: '#fff', fontWeight: 700 }}>
                        Câu #{previewQuestionIndex + 1}
                      </span>
                      <span className={`qm-badge qm-badge-${currentQ.difficulty}`}>
                        {currentQ.difficulty === 'easy' ? 'DỄ' : (currentQ.difficulty === 'medium' ? 'TRUNG BÌNH' : 'KHÓ')}
                      </span>
                      <span className="qm-badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        {currentQ.type === 'choice' ? 'TRẮC NGHIỆM ABCD' : (currentQ.type === 'multiple_choice' ? 'CHỌN NHIỀU ĐÁP ÁN' : (currentQ.type === 'fill_blank' ? 'ĐIỀN KHUYẾT' : (currentQ.type === 'matching' ? 'KÉO THẢ / NỐI CẶP' : 'TỰ LUẬN NGẮN')))}
                      </span>
                      {currentQ.imageUrl && (
                        <span className="qm-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <ImageIcon size={11} /> Có ảnh minh họa
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {currentQ.points || 1} điểm
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div style={{
                    fontSize: previewDevice === 'mobile' ? '1rem' : '1.15rem',
                    fontWeight: 600,
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    marginBottom: '1rem',
                    whiteSpace: 'pre-line'
                  }}>
                    {currentQ.question}
                  </div>

                  {/* Question Image (if any) */}
                  {currentQ.imageUrl && (
                    <div style={{
                      textAlign: 'center',
                      margin: '1rem 0 1.25rem',
                      background: 'rgba(0,0,0,0.04)',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)'
                    }}>
                      <img
                        src={getSafeImageUrl(currentQ.imageUrl)}
                        alt="Hình ảnh minh họa câu hỏi"
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageError(e, currentQ.imageUrl)}
                        style={{
                          maxWidth: '100%',
                          maxHeight: previewDevice === 'mobile' ? '200px' : '320px',
                          height: 'auto',
                          borderRadius: '0.35rem',
                          objectFit: 'contain',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(currentQ.imageUrl, '_blank')}
                        title="Bấm để phóng to ảnh trong tab mới"
                      />
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        🔍 Bấm vào ảnh để xem kích thước gốc
                      </div>
                    </div>
                  )}

                  {/* Interactive Question Types Simulation */}
                  <div style={{ marginTop: '1rem' }}>
                    {/* Choice ABCD */}
                    {currentQ.type === 'choice' && currentQ.options && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {currentQ.options.map((opt, oIdx) => {
                          const char = String.fromCharCode(65 + oIdx);
                          const isSelected = previewUserAnswer === opt;
                          const isCorrectTarget = currentQ.correctAnswer === opt;
                          
                          let bg = 'var(--bg-secondary)';
                          let border = '1px solid var(--border)';
                          let color = 'var(--text-primary)';

                          if (previewShowCorrect && isCorrectTarget) {
                            bg = 'rgba(16, 185, 129, 0.15)';
                            border = '1.5px solid #10b981';
                          } else if (previewShowCorrect && isSelected && !isCorrectTarget) {
                            bg = 'rgba(239, 68, 68, 0.15)';
                            border = '1.5px solid #ef4444';
                          } else if (isSelected) {
                            bg = 'rgba(99, 102, 241, 0.12)';
                            border = '1.5px solid var(--primary)';
                          }

                          return (
                            <div
                              key={oIdx}
                              onClick={() => {
                                setPreviewUserAnswer(opt);
                                setPreviewAnswerChecked(null);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: previewDevice === 'mobile' ? '0.7rem 0.85rem' : '0.85rem 1.1rem',
                                borderRadius: '0.65rem',
                                background: bg,
                                border: border,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                color: color,
                                userSelect: 'none'
                              }}
                            >
                              <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                flexShrink: 0,
                                background: isSelected ? 'var(--primary)' : 'var(--bg-tertiary)',
                                color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                              }}>
                                {char}
                              </div>
                              <div style={{ flex: 1, fontSize: '0.92rem', lineHeight: 1.45 }}>
                                {opt}
                              </div>
                              {previewShowCorrect && isCorrectTarget && (
                                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.8rem' }}>✓ Đáp án đúng</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Multiple Choice (Checkboxes) */}
                    {currentQ.type === 'multiple_choice' && currentQ.options && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                          💡 Chọn một hoặc nhiều đáp án bên dưới:
                        </div>
                        {currentQ.options.map((opt, oIdx) => {
                          const char = String.fromCharCode(65 + oIdx);
                          const currentArr: string[] = Array.isArray(previewUserAnswer) ? previewUserAnswer : [];
                          const isSelected = currentArr.includes(opt);
                          const correctArr: string[] = currentQ.correctAnswers && currentQ.correctAnswers.length > 0 
                            ? currentQ.correctAnswers 
                            : (currentQ.correctAnswer ? [currentQ.correctAnswer] : []);
                          const isCorrectTarget = correctArr.includes(opt);

                          let bg = 'var(--bg-secondary)';
                          let border = '1px solid var(--border)';

                          if (previewShowCorrect && isCorrectTarget) {
                            bg = 'rgba(16, 185, 129, 0.15)';
                            border = '1.5px solid #10b981';
                          } else if (previewShowCorrect && isSelected && !isCorrectTarget) {
                            bg = 'rgba(239, 68, 68, 0.15)';
                            border = '1.5px solid #ef4444';
                          } else if (isSelected) {
                            bg = 'rgba(99, 102, 241, 0.12)';
                            border = '1.5px solid var(--primary)';
                          }

                          return (
                            <div
                              key={oIdx}
                              onClick={() => {
                                const nextArr = isSelected ? currentArr.filter(x => x !== opt) : [...currentArr, opt];
                                setPreviewUserAnswer(nextArr);
                                setPreviewAnswerChecked(null);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: previewDevice === 'mobile' ? '0.7rem 0.85rem' : '0.85rem 1.1rem',
                                borderRadius: '0.65rem',
                                background: bg,
                                border: border,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                userSelect: 'none'
                              }}
                            >
                              <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                flexShrink: 0,
                                border: isSelected ? 'none' : '1.5px solid var(--border)',
                                background: isSelected ? 'var(--primary)' : 'var(--bg-primary)',
                                color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                              }}>
                                {isSelected ? '✓' : ''}
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{char}.</span>
                              <div style={{ flex: 1, fontSize: '0.92rem', lineHeight: 1.45 }}>
                                {opt}
                              </div>
                              {previewShowCorrect && isCorrectTarget && (
                                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.8rem' }}>✓ Đáp án đúng</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Fill in the blank */}
                    {currentQ.type === 'fill_blank' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Nhập từ/cụm từ điền vào chỗ trống:
                        </label>
                        <input
                          type="text"
                          className="qm-input"
                          style={{
                            padding: '0.85rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '0.6rem',
                            border: '1.5px solid var(--border)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                          placeholder="Nhập câu trả lời của bạn..."
                          value={previewUserAnswer || ''}
                          onChange={(e) => {
                            setPreviewUserAnswer(e.target.value);
                            setPreviewAnswerChecked(null);
                          }}
                        />
                      </div>
                    )}

                    {/* Matching Pairs */}
                    {currentQ.type === 'matching' && currentQ.matchingPairs && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          💡 Ghép cặp các vế tương ứng bên dưới:
                        </div>
                        {(() => {
                          const userMatches = previewUserAnswer || {};
                          const rightOptions = currentQ.matchingPairs.map(p => p.right);
                          return currentQ.matchingPairs.map((pair, pIdx) => (
                            <div
                              key={pIdx}
                              style={{
                                display: 'flex',
                                flexDirection: previewDevice === 'mobile' ? 'column' : 'row',
                                alignItems: previewDevice === 'mobile' ? 'stretch' : 'center',
                                justifyContent: 'space-between',
                                gap: '0.5rem',
                                padding: '0.75rem 1rem',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: '0.6rem'
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                {pair.left}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>➔</span>
                                <select
                                  className="qm-select"
                                  value={userMatches[pair.left] || ''}
                                  onChange={(e) => {
                                    setPreviewUserAnswer({ ...userMatches, [pair.left]: e.target.value });
                                    setPreviewAnswerChecked(null);
                                  }}
                                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', flex: 1 }}
                                >
                                  <option value="">-- Chọn ghép nối --</option>
                                  {rightOptions.map((r, rIdx) => (
                                    <option key={rIdx} value={r}>{r}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}

                    {/* Essay */}
                    {currentQ.type === 'essay' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Nhập câu trả lời tự luận ngắn:
                        </label>
                        <textarea
                          rows={4}
                          className="qm-textarea"
                          style={{
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '0.6rem',
                            border: '1.5px solid var(--border)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            resize: 'vertical'
                          }}
                          placeholder="Nhập nội dung trả lời..."
                          value={previewUserAnswer || ''}
                          onChange={(e) => {
                            setPreviewUserAnswer(e.target.value);
                            setPreviewAnswerChecked(null);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Feedback / Result of checking */}
                  {previewAnswerChecked !== null && (
                    <div style={{
                      marginTop: '1.25rem',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      background: previewAnswerChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: `1.5px solid ${previewAnswerChecked ? '#10b981' : '#ef4444'}`,
                      color: previewAnswerChecked ? '#047857' : '#b91c1c',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}>
                      {previewAnswerChecked ? (
                        <>
                          <CheckCircle2 size={18} color="#10b981" />
                          <span>Chính xác! Thí sinh sẽ đạt trọn vẹn điểm câu này ({currentQ.points || 1} điểm).</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={18} color="#ef4444" />
                          <span>Chưa chính xác! Thí sinh sẽ không đạt điểm với câu trả lời này.</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Revealed Answer & Explanation */}
                  {previewShowCorrect && (
                    <div style={{
                      marginTop: '1.25rem',
                      padding: '1rem',
                      borderRadius: '0.65rem',
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px dashed var(--primary)',
                      fontSize: '0.88rem'
                    }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={16} /> Đáp án chuẩn & Hướng dẫn chấm:
                      </div>
                      <div style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                        {currentQ.type === 'choice' && `Đáp án đúng: ${currentQ.correctAnswer}`}
                        {currentQ.type === 'multiple_choice' && `Các đáp án đúng: ${(currentQ.correctAnswers || [currentQ.correctAnswer]).join(', ')}`}
                        {currentQ.type === 'fill_blank' && `Đáp án được chấp nhận: ${currentQ.correctAnswer}`}
                        {currentQ.type === 'matching' && (
                          <div>
                            Cặp nối chính xác:
                            <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.25rem' }}>
                              {currentQ.matchingPairs?.map((p, idx) => (
                                <li key={idx}><strong>{p.left}</strong> ➔ {p.right}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {currentQ.type === 'essay' && `Từ khóa chấm điểm: ${currentQ.correctAnswer}`}
                      </div>

                      {currentQ.explanation ? (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', borderTop: '1px solid rgba(99,102,241,0.2)', paddingTop: '0.4rem' }}>
                          💡 Giải thích chi tiết: {currentQ.explanation}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          (Chưa có nội dung giải thích chi tiết cho câu hỏi này)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={previewQuestionIndex === 0}
                    onClick={() => handleSelectPreviewQuestion(previewQuestionIndex - 1)}
                  >
                    <ChevronLeft size={15} /> Câu trước
                  </button>

                  <select
                    className="qm-select qm-select-compact"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
                    value={previewQuestionIndex}
                    onChange={(e) => handleSelectPreviewQuestion(Number(e.target.value))}
                  >
                    {activeQuiz.questions.map((_, qIdx) => (
                      <option key={qIdx} value={qIdx}>
                        Câu #{qIdx + 1}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={previewQuestionIndex >= totalQ - 1}
                    onClick={() => handleSelectPreviewQuestion(previewQuestionIndex + 1)}
                  >
                    Câu sau <ChevronRight size={15} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleTestPreviewAnswer(currentQ)}
                    style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  >
                    <Play size={14} /> Thử trả lời
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setPreviewShowCorrect(!previewShowCorrect)}
                    style={{
                      borderColor: previewShowCorrect ? '#10b981' : 'var(--border)',
                      color: previewShowCorrect ? '#10b981' : 'var(--text-secondary)'
                    }}
                  >
                    <Eye size={14} /> {previewShowCorrect ? 'Ẩn đáp án' : 'Hiện đáp án & Lời giải'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setPreviewUserAnswer(null);
                      setPreviewAnswerChecked(null);
                    }}
                    title="Đặt lại câu trả lời thử nghiệm"
                  >
                    <RotateCcw size={14} /> Làm lại
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  Pin,
  CheckCircle2,
  Trash2,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  RefreshCw,
  Filter,
  Plus,
  Sparkles,
  Award,
  HelpCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './AnonymousQaWall.css';

interface QuestionItem {
  id: string;
  roomId: string;
  content: string;
  authorAlias: string;
  category: string;
  upvotes: number;
  isAnswered: boolean;
  isPinned: boolean;
  answerNote?: string | null;
  createdAt: string;
}

interface RoomInfo {
  id: string;
  code: string;
  title: string;
  subject?: string | null;
  teacherName?: string | null;
  isOpen: boolean;
  createdAt: string;
  questions?: QuestionItem[];
}

const CATEGORIES = [
  'Thắc mắc chung',
  'Lý thuyết & Bài học',
  'Thực hành & Kỹ thuật',
  'Đồ án & Bài tập',
  'Thi cử & Điểm số',
  'Góp ý tiết học'
];

export default function AnonymousQaWall() {
  const { showToast } = useNotification();
  const showSuccess = (msg: string) => showToast(msg, 'success');
  const showError = (msg: string) => showToast(msg, 'error');
  const showInfo = (msg: string) => showToast(msg, 'info');
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'home' (chưa vào phòng) | 'teacher' (màn hình điều hành giảng viên / máy chiếu) | 'student' (giao diện sinh viên gửi câu hỏi)
  const [viewRole, setViewRole] = useState<'teacher' | 'student'>('teacher');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form tạo phòng mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('Thảo luận & Giải đáp thắc mắc buổi học');
  const [newSubject, setNewSubject] = useState('');
  const [newTeacher, setNewTeacher] = useState('');

  // Sinh viên đặt câu hỏi
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [newAuthorAlias, setNewAuthorAlias] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Thắc mắc chung');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [votedQuestionIds, setVotedQuestionIds] = useState<Set<string>>(new Set());

  // Trình chiếu toàn màn hình
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter & Sort
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unanswered' | 'answered'>('all');
  const [sortBy, setSortBy] = useState<'upvotes' | 'newest'>('upvotes');
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Đọc params từ URL
  useEffect(() => {
    const codeParam = searchParams.get('room');
    const roleParam = searchParams.get('role');
    if (roleParam === 'student') {
      setViewRole('student');
    }
    if (codeParam) {
      setRoomCodeInput(codeParam);
      fetchRoomData(codeParam, true);
    }
  }, [searchParams]);

  // Tạo QR Code khi currentRoom thay đổi
  useEffect(() => {
    if (currentRoom) {
      const studentUrl = `${window.location.origin}/buc-tuong-cau-hoi?room=${currentRoom.code}&role=student`;
      QRCode.toDataURL(studentUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).then(url => setQrDataUrl(url)).catch(err => console.error('Lỗi tạo QR:', err));
    }
  }, [currentRoom]);

  // Polling tự động lấy câu hỏi mới mỗi 3 giây nếu đang trong phòng
  useEffect(() => {
    if (!currentRoom?.code) return;

    const interval = setInterval(() => {
      fetchRoomData(currentRoom.code, false);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentRoom?.code]);

  // Load danh sách đã vote từ LocalStorage
  useEffect(() => {
    try {
      const savedVotes = localStorage.getItem('qa_upvoted_questions');
      if (savedVotes) {
        setVotedQuestionIds(new Set(JSON.parse(savedVotes)));
      }
    } catch {
      // ignore
    }
  }, []);

  // Fullscreen listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Fetch room data
  const fetchRoomData = async (code: string, isInitial = false) => {
    if (isInitial) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(`/api/qa-wall?action=get-room&code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (res.ok && data.success && data.room) {
        setCurrentRoom(data.room);
        setQuestions(data.room.questions || []);
      } else {
        if (isInitial) {
          showError(data.error || 'Không tìm thấy phòng!');
        }
      }
    } catch {
      if (isInitial) showError('Không thể kết nối máy chủ!');
    } finally {
      if (isInitial) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // API Call: Tạo phòng mới
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showError('Vui lòng nhập chủ đề phòng hỏi đáp!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/qa-wall?action=create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          subject: newSubject,
          teacherName: newTeacher
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.room) {
        showSuccess(`Tạo phòng thành công! Mã PIN: ${data.room.code}`);
        setCurrentRoom(data.room);
        setQuestions([]);
        setViewRole('teacher');
        setShowCreateModal(false);
        setSearchParams({ room: data.room.code, role: 'teacher' });
      } else {
        showError(data.error || 'Không thể tạo phòng');
      }
    } catch {
      showError('Lỗi kết nối máy chủ khi tạo phòng!');
    } finally {
      setIsLoading(false);
    }
  };

  // Vào phòng bằng mã PIN
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCodeInput.trim();
    if (!cleanCode) {
      showError('Vui lòng nhập mã phòng gồm 6 chữ số!');
      return;
    }
    fetchRoomData(cleanCode, true);
    setSearchParams({ room: cleanCode, role: viewRole });
  };

  // Sinh viên gửi câu hỏi
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom) return;
    if (!newQuestionContent.trim()) {
      showError('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    setIsSubmittingQuestion(true);
    try {
      const res = await fetch('/api/qa-wall?action=ask-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentRoom.code,
          content: newQuestionContent,
          authorAlias: newAuthorAlias.trim() || 'Ẩn danh',
          category: selectedCategory
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess('Đã gửi câu hỏi lên bức tường lớp học!');
        setNewQuestionContent('');
        fetchRoomData(currentRoom.code, false);
      } else {
        showError(data.error || 'Không thể gửi câu hỏi!');
      }
    } catch {
      showError('Lỗi kết nối khi gửi câu hỏi!');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  // Upvote câu hỏi
  const handleUpvote = async (qId: string) => {
    if (votedQuestionIds.has(qId)) {
      showInfo('Bạn đã bình chọn cho câu hỏi này rồi!');
      return;
    }

    // Cập nhật UI lạc quan (Optimistic update)
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, upvotes: q.upvotes + 1 } : q));
    const nextVotes = new Set(votedQuestionIds);
    nextVotes.add(qId);
    setVotedQuestionIds(nextVotes);
    try {
      localStorage.setItem('qa_upvoted_questions', JSON.stringify(Array.from(nextVotes)));
    } catch {
      // ignore
    }

    try {
      await fetch('/api/qa-wall?action=upvote-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: qId })
      });
    } catch {
      // rollback if needed
    }
  };

  // Quản lý: Đổi trạng thái phòng (Mở / Tạm khóa)
  const handleToggleRoomLock = async () => {
    if (!currentRoom) return;
    const newOpenState = !currentRoom.isOpen;
    setCurrentRoom(prev => prev ? { ...prev, isOpen: newOpenState } : null);

    try {
      const res = await fetch('/api/qa-wall?action=manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'toggle-room-open',
          roomId: currentRoom.id,
          isOpen: newOpenState
        })
      });
      if (res.ok) {
        showSuccess(newOpenState ? 'Đã mở nhận câu hỏi' : 'Đã khóa phòng nhận câu hỏi');
      }
    } catch {
      showError('Lỗi cập nhật trạng thái phòng!');
    }
  };

  // Quản lý: Ghim câu hỏi
  const handleTogglePin = async (q: QuestionItem) => {
    const nextPin = !q.isPinned;
    setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, isPinned: nextPin } : item));

    try {
      await fetch('/api/qa-wall?action=manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'toggle-pin',
          questionId: q.id,
          isPinned: nextPin
        })
      });
      showSuccess(nextPin ? 'Đã ghim câu hỏi lên nổi bật!' : 'Đã bỏ ghim');
    } catch {
      showError('Lỗi cập nhật!');
    }
  };

  // Quản lý: Đánh dấu đã giải đáp
  const handleToggleAnswered = async (q: QuestionItem) => {
    const nextAnswered = !q.isAnswered;
    setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, isAnswered: nextAnswered } : item));

    try {
      await fetch('/api/qa-wall?action=manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'toggle-answered',
          questionId: q.id,
          isAnswered: nextAnswered
        })
      });
      showSuccess(nextAnswered ? 'Đã đánh dấu: Đã giải đáp xong ✓' : 'Đánh dấu: Chưa giải đáp');
    } catch {
      showError('Lỗi cập nhật!');
    }
  };

  // Quản lý: Xóa câu hỏi
  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm('Thầy/Cô có chắc chắn muốn xóa câu hỏi này khỏi bức tường?')) return;
    setQuestions(prev => prev.filter(item => item.id !== qId));

    try {
      await fetch('/api/qa-wall?action=manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'delete-question',
          questionId: qId
        })
      });
      showSuccess('Đã xóa câu hỏi');
    } catch {
      showError('Lỗi xóa câu hỏi!');
    }
  };

  // Sao chép link tham gia
  const handleCopyLink = () => {
    if (!currentRoom) return;
    const studentUrl = `${window.location.origin}/buc-tuong-cau-hoi?room=${currentRoom.code}&role=student`;
    navigator.clipboard.writeText(studentUrl);
    setCopiedLink(true);
    showSuccess('Đã sao chép đường link tham gia cho sinh viên!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Lọc & sắp xếp câu hỏi hiển thị
  const filteredQuestions = questions
    .filter(q => {
      if (filterCategory !== 'all' && q.category !== filterCategory) return false;
      if (filterStatus === 'unanswered' && q.isAnswered) return false;
      if (filterStatus === 'answered' && !q.isAnswered) return false;
      return true;
    })
    .sort((a, b) => {
      // Ghim luôn lên đầu
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'upvotes') {
        return b.upvotes - a.upvotes;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className={`qa-wall-container ${isFullscreen ? 'fullscreen-mode' : ''}`} ref={containerRef}>
      {/* HEADER BAR */}
      <header className="qa-header">
        <div className="qa-header-left">
          <div className="qa-brand-badge">
            <MessageSquare size={22} className="qa-brand-icon" />
          </div>
          <div>
            <h1 className="qa-main-title">
              {viewRole === 'student' ? 'Hộp Đặt Câu Hỏi Ẩn Danh' : 'Bức Tường Câu Hỏi Vô Danh & Hộp Thắc Mắc'}
            </h1>
            <p className="qa-main-sub">
              {currentRoom 
                ? `${currentRoom.title} ${currentRoom.subject ? `• Môn: ${currentRoom.subject}` : ''} ${currentRoom.teacherName ? `• GV: ${currentRoom.teacherName}` : ''}`
                : 'Đặt câu hỏi ẩn danh, bình chọn thắc mắc chung và giải đáp trực tiếp trên lớp học'}
            </p>
            {currentRoom && (
              <div className="qa-room-info-badge">
                Mã phòng PIN: <strong>{currentRoom.code}</strong> • {currentRoom.isOpen ? '🟢 Đang mở nhận câu hỏi' : '🔴 Tạm khóa nhận câu hỏi'}
              </div>
            )}
          </div>
        </div>

        <div className="qa-header-actions">
          {/* Switch Role Tabs */}
          {currentRoom && (
            <div className="qa-role-switcher">
              <button
                type="button"
                className={`qa-role-btn ${viewRole === 'teacher' ? 'active' : ''}`}
                onClick={() => {
                  setViewRole('teacher');
                  setSearchParams({ room: currentRoom.code, role: 'teacher' });
                }}
              >
                <Award size={15} /> Giảng viên / Máy chiếu
              </button>
              <button
                type="button"
                className={`qa-role-btn ${viewRole === 'student' ? 'active' : ''}`}
                onClick={() => {
                  setViewRole('student');
                  setSearchParams({ room: currentRoom.code, role: 'student' });
                }}
              >
                <HelpCircle size={15} /> Sinh viên hỏi
              </button>
            </div>
          )}

          {currentRoom && viewRole === 'teacher' && (
            <>
              <button
                type="button"
                className={`btn btn-sm ${currentRoom.isOpen ? 'btn-outline' : 'btn-danger'}`}
                onClick={handleToggleRoomLock}
                title={currentRoom.isOpen ? 'Nhấp để tạm dừng nhận câu hỏi' : 'Nhấp để mở lại phòng'}
              >
                {currentRoom.isOpen ? <><Unlock size={16} /> Đang mở nhận câu hỏi</> : <><Lock size={16} /> Đã khóa phòng</>}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleCopyLink}
                title="Sao chép link sinh viên"
              >
                {copiedLink ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                {copiedLink ? 'Đã chép link' : 'Chép link tham gia'}
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={toggleFullscreen}
                title="Toàn màn hình máy chiếu"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              </button>
            </>
          )}

          {!currentRoom && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} /> Tạo Phòng Hỏi Đáp Mới
            </button>
          )}
        </div>
      </header>

      {/* NẾU CHƯA VÀO PHÒNG -> HIỂN THỊ MÀN HÌNH CHÀO VÀ NHẬP MÃ PIN */}
      {!currentRoom && !isLoading && (
        <div className="qa-welcome-hero">
          <div className="qa-welcome-card">
            <div className="qa-welcome-badge">Lớp Học Tương Tác Trực Tuyến</div>
            <h2>Tham Gia Phòng Hỏi Đáp Hoặc Tạo Phòng Mới</h2>
            <p>
              Giảng viên tạo phòng để sinh viên quét mã QR đặt câu hỏi ẩn danh trên giảng đường.
              Sinh viên có mã phòng 6 chữ số có thể nhập vào bên dưới để bắt đầu đặt câu hỏi ngay.
            </p>

            <form className="qa-join-box" onSubmit={handleJoinRoom}>
              <input
                type="text"
                placeholder="Nhập mã PIN 6 số (VD: 829104)..."
                maxLength={8}
                value={roomCodeInput}
                onChange={e => setRoomCodeInput(e.target.value.replace(/\D/g, ''))}
                className="qa-code-input"
              />
              <button type="submit" className="btn btn-primary btn-lg">
                Vào Phòng Học
              </button>
            </form>

            <div className="qa-quick-divider">hoặc</div>

            <button
              type="button"
              className="btn btn-outline btn-lg"
              onClick={() => setShowCreateModal(true)}
            >
              <Sparkles size={18} color="var(--primary)" /> Tôi là Giảng viên (Tạo phòng mới)
            </button>
          </div>
        </div>
      )}

      {/* KHI ĐÃ CÓ PHÒNG HỌC */}
      {currentRoom && (
        <div className={`qa-workspace ${viewRole === 'student' ? 'student-view' : ''}`}>
          {/* CỘT BÊN TRÁI: THÔNG TIN PHÒNG, MÃ QR & QUÉT MÃ (Cho Projector / Teacher) */}
          {viewRole === 'teacher' && (
            <aside className="qa-sidebar">
              <div className="qa-qr-card">
                <div className="qa-qr-label">📱 Quét mã để gửi câu hỏi ẩn danh:</div>
                <div className="qa-qr-wrapper">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Mã QR tham gia" className="qa-qr-img" />
                  ) : (
                    <div className="qa-qr-placeholder">Đang tạo mã QR...</div>
                  )}
                </div>

                <div className="qa-pin-display">
                  <div className="qa-pin-title">MÃ PHÒNG PIN</div>
                  <div className="qa-pin-number">{currentRoom.code}</div>
                  <div className="qa-pin-url">
                    tienich.ite.id.vn/buc-tuong-cau-hoi
                  </div>
                </div>

                <div className="qa-stats-row">
                  <div className="qa-stat-item">
                    <span className="qa-stat-val">{questions.length}</span>
                    <span className="qa-stat-sub">Câu hỏi</span>
                  </div>
                  <div className="qa-stat-item">
                    <span className="qa-stat-val">
                      {questions.filter(q => q.isAnswered).length}
                    </span>
                    <span className="qa-stat-sub">Đã giải đáp</span>
                  </div>
                  <div className="qa-stat-item">
                    <span className="qa-stat-val">
                      {questions.reduce((acc, q) => acc + q.upvotes, 0)}
                    </span>
                    <span className="qa-stat-sub">Lượt quan tâm</span>
                  </div>
                </div>
              </div>

              {/* Hướng dẫn nhanh cho giảng viên */}
              <div className="qa-quick-tips">
                <h4>💡 Mẹo điều hành lớp học:</h4>
                <ul>
                  <li><strong>Ghim (Pin):</strong> Đưa câu hỏi quan trọng lên màn hình lớn để cả lớp cùng tranh luận.</li>
                  <li><strong>Bình chọn (Upvote):</strong> Ưu tiên giải đáp các câu hỏi có nhiều bạn bấm thích nhất.</li>
                  <li><strong>Tạm khóa nhận câu:</strong> Bấm nút khóa khi bắt đầu phần giảng bài hoặc hết giờ.</li>
                </ul>
              </div>
            </aside>
          )}

          {/* KHU VỰC CHÍNH: FORM ĐẶT CÂU HỎI (Cho SV) VÀ BỨC TƯỜNG CÂU HỎI */}
          <main className="qa-main-wall">
            {/* GIAO DIỆN SINH VIÊN: FORM ĐẶT CÂU HỎI */}
            {viewRole === 'student' && (
              <div className="qa-ask-box">
                <div className="qa-ask-header">
                  <h3>💬 Đặt câu hỏi cho Thầy/Cô</h3>
                  <span className="qa-anon-badge">
                    <UserCheck size={14} /> Hoàn toàn ẩn danh
                  </span>
                </div>

                {!currentRoom.isOpen ? (
                  <div className="qa-closed-alert">
                    <Lock size={20} />
                    <span>Thầy/Cô hiện đang tạm khóa phòng nhận câu hỏi mới. Bạn vẫn có thể xem và bấm bình chọn (upvote) cho các câu hỏi bên dưới.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitQuestion} className="qa-ask-form">
                    <div className="qa-form-row">
                      <div className="qa-form-group flex-1">
                        <label>Danh mục / Nội dung thắc mắc:</label>
                        <select
                          value={selectedCategory}
                          onChange={e => setSelectedCategory(e.target.value)}
                          className="qa-select"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="qa-form-group flex-1">
                        <label>Biệt danh của bạn (không bắt buộc):</label>
                        <input
                          type="text"
                          placeholder="Mặc định: Ẩn danh (hoặc gõ Nickname vui)..."
                          value={newAuthorAlias}
                          onChange={e => setNewAuthorAlias(e.target.value)}
                          className="qa-input"
                          maxLength={30}
                        />
                      </div>
                    </div>

                    <div className="qa-form-group">
                      <label>Nội dung câu hỏi hoặc thắc mắc của bạn:</label>
                      <textarea
                        rows={3}
                        placeholder="Hãy đặt câu hỏi ngắn gọn, rõ ràng về phần kiến thức bạn chưa hiểu hoặc muốn thầy/cô giảng lại..."
                        value={newQuestionContent}
                        onChange={e => setNewQuestionContent(e.target.value)}
                        className="qa-textarea"
                        required
                      />
                    </div>

                    <div className="qa-ask-actions">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmittingQuestion}
                      >
                        <Send size={16} /> {isSubmittingQuestion ? 'Đang gửi...' : 'Gửi Câu Hỏi Lên Bảng'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* THANH BỘ LỌC VÀ SẮP XẾP */}
            <div className="qa-controls-bar">
              <div className="qa-filters-group">
                <Filter size={16} className="qa-filter-icon" />
                <button
                  type="button"
                  className={`qa-filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterCategory('all')}
                >
                  Tất cả ({questions.length})
                </button>
                {CATEGORIES.map(cat => {
                  const count = questions.filter(q => q.category === cat).length;
                  if (count === 0 && filterCategory !== cat) return null;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`qa-filter-chip ${filterCategory === cat ? 'active' : ''}`}
                      onClick={() => setFilterCategory(cat)}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="qa-sort-group">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as any)}
                  className="qa-select-sm"
                >
                  <option value="all">Mọi trạng thái</option>
                  <option value="unanswered">Chưa giải đáp</option>
                  <option value="answered">Đã giải đáp</option>
                </select>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="qa-select-sm"
                >
                  <option value="upvotes">Quan tâm nhất (Nhiều vote)</option>
                  <option value="newest">Mới nhất vừa gửi</option>
                </select>

                <button
                  type="button"
                  className="qa-refresh-btn"
                  onClick={() => currentRoom && fetchRoomData(currentRoom.code, false)}
                  title="Làm mới câu hỏi"
                >
                  <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
                </button>
              </div>
            </div>

            {/* DANH SÁCH CÁC CÂU HỎI TRÊN BỨC TƯỜNG (CARD GRID) */}
            {filteredQuestions.length === 0 ? (
              <div className="qa-empty-state">
                <MessageSquare size={48} className="qa-empty-icon" />
                <h3>Chưa có câu hỏi nào trong danh mục này</h3>
                <p>
                  {viewRole === 'student'
                    ? 'Hãy là người đầu tiên đặt câu hỏi thắc mắc cho Thầy/Cô nhé!'
                    : 'Hãy hướng dẫn sinh viên quét mã QR trên bảng để gửi thắc mắc của mình.'}
                </p>
              </div>
            ) : (
              <div className="qa-cards-grid">
                {filteredQuestions.map(q => {
                  const hasVoted = votedQuestionIds.has(q.id);
                  return (
                    <div
                      key={q.id}
                      className={`qa-card ${q.isPinned ? 'qa-pinned' : ''} ${q.isAnswered ? 'qa-answered' : ''}`}
                    >
                      {q.isPinned && (
                        <div className="qa-pin-badge">
                          <Pin size={13} /> Đang thảo luận trực tiếp
                        </div>
                      )}

                      <div className="qa-card-header">
                        <span className="qa-card-category">{q.category}</span>
                        <div className="qa-card-meta">
                          <Clock size={12} />
                          <span>
                            {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="qa-card-body">
                        <p className="qa-card-content">{q.content}</p>
                      </div>

                      <div className="qa-card-footer">
                        <div className="qa-author-badge">
                          👤 {q.authorAlias}
                        </div>

                        <div className="qa-card-actions">
                          {/* NÚT UPVOTE */}
                          <button
                            type="button"
                            className={`qa-upvote-btn ${hasVoted ? 'voted' : ''}`}
                            onClick={() => handleUpvote(q.id)}
                            title={hasVoted ? 'Bạn đã bình chọn' : 'Đồng ý / Tôi cũng thắc mắc điều này'}
                          >
                            <ThumbsUp size={16} />
                            <span>{q.upvotes}</span>
                          </button>

                          {/* CÁC NÚT ĐIỀU HÀNH CỦA GIẢNG VIÊN */}
                          {viewRole === 'teacher' && (
                            <div className="qa-teacher-tools">
                              <button
                                type="button"
                                className={`qa-tool-btn ${q.isPinned ? 'active-pin' : ''}`}
                                onClick={() => handleTogglePin(q)}
                                title={q.isPinned ? 'Bỏ ghim' : 'Ghim nổi bật lên bảng'}
                              >
                                <Pin size={16} />
                              </button>

                              <button
                                type="button"
                                className={`qa-tool-btn ${q.isAnswered ? 'active-check' : ''}`}
                                onClick={() => handleToggleAnswered(q)}
                                title={q.isAnswered ? 'Bỏ đánh dấu đã trả lời' : 'Đánh dấu đã giải đáp xong'}
                              >
                                <CheckCircle2 size={16} />
                              </button>

                              <button
                                type="button"
                                className="qa-tool-btn delete"
                                onClick={() => handleDeleteQuestion(q.id)}
                                title="Xóa câu hỏi này"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      )}

      {/* MODAL TẠO PHÒNG MỚI */}
      {showCreateModal && (
        <div className="qa-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="qa-modal-content" onClick={e => e.stopPropagation()}>
            <div className="qa-modal-header">
              <h3>Tạo Phòng Hỏi Đáp Lớp Học Mới</h3>
              <button
                type="button"
                className="qa-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="qa-modal-body">
              <div className="qa-form-group">
                <label>Chủ đề phòng hỏi / Tên buổi học: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  placeholder="VD: Thảo luận Bài 4: Quy trình kiểm tra an toàn hệ thống phanh..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="qa-input"
                  required
                />
              </div>

              <div className="qa-form-group">
                <label>Tên môn học / Chuyên ngành:</label>
                <input
                  type="text"
                  placeholder="VD: Bảo dưỡng ô tô / Dược lý học / Kế toán tài chính..."
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="qa-input"
                />
              </div>

              <div className="qa-form-group">
                <label>Tên Giảng viên:</label>
                <input
                  type="text"
                  placeholder="VD: Thầy Luyến / Cô Lan..."
                  value={newTeacher}
                  onChange={e => setNewTeacher(e.target.value)}
                  className="qa-input"
                />
              </div>

              <div className="qa-modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang tạo...' : 'Tạo Phòng & Lấy Mã QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

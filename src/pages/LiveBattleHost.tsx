import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Play, Users, Trophy, Volume2, VolumeX, Flame, 
  RotateCcw, Sparkles, ChevronRight, Award, 
  Clock, ArrowLeft, Plus, Trash2, Layers,
  Copy, Check, Swords, AlertCircle, ArrowUpRight, ListOrdered,
  Maximize, Minimize, Eye, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
  teamId?: string;
  teamName?: string;
  totalScore: number;
  streak: number;
  answers?: any[];
}

export const PRESET_TEAMS = [
  { id: 'red', name: 'Team Đỏ 🔴', color: '#ef4444', mascot: '🦁' },
  { id: 'blue', name: 'Team Xanh 🔵', color: '#3b82f6', mascot: '🦅' },
  { id: 'yellow', name: 'Team Vàng 🟡', color: '#f59e0b', mascot: '🐯' },
  { id: 'green', name: 'Team Lục 🟢', color: '#10b981', mascot: '🐲' },
  { id: 'purple', name: 'Team Tím 🟣', color: '#8b5cf6', mascot: '🦄' }
];

export default function LiveBattleHost() {
  const { user, token } = useAuth();
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { showAlert } = useDialogs();

  // Danh sách phòng của GV
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Danh sách nhóm bảng vinh danh để chọn đồng bộ
  const [leaderboardGroups, setLeaderboardGroups] = useState<any[]>([]);
  const [isSyncingLeaderboard, setIsSyncingLeaderboard] = useState(false);
  const [selectedLeaderboardGroupId, setSelectedLeaderboardGroupId] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Xem danh sách học viên của phòng trực tiếp từ Dashboard
  const [inspectingRoom, setInspectingRoom] = useState<any | null>(null);

  // Modal tạo phòng
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [timePerQ, setTimePerQ] = useState(20);
  const [battleMode, setBattleMode] = useState<'individual' | 'team'>('individual');
  const [teamCount, setTeamCount] = useState<number>(3);
  const [quizSource, setQuizSource] = useState<'bank' | 'manual' | 'custom'>('manual');
  const [myQuizPackages, setMyQuizPackages] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [customQuestionsText, setCustomQuestionsText] = useState('');
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lắng nghe sự kiện Fullscreen thay đổi từ trình duyệt (hoặc khi bấm phím ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Không thể bật toàn màn hình:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error('Không thể thoát toàn màn hình:', err);
        });
      }
    }
  };

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

  // Load ngân hàng đề thi (cả từ DB và LocalStorage)
  const loadQuizPackages = async () => {
    let combinedPackages: any[] = [];
    
    // 1. Đọc từ LocalStorage (đồng bộ với Quản lý Đề Thi - /tao-de-thi)
    if (user) {
      try {
        const localData = localStorage.getItem(`rchg_quiz_packages_${user.id}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            combinedPackages = [...parsed];
          }
        }
      } catch (err) {
        console.error('Lỗi đọc local packages:', err);
      }
    }

    // 2. Fetch từ API Backend (/api/quiz-api?action=get-quizzes)
    if (user) {
      try {
        const res = await fetch(`/api/quiz-api?action=get-quizzes&userId=${encodeURIComponent(user.id)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.quizzes)) {
          data.quizzes.forEach((apiPkg: any) => {
            if (!combinedPackages.some(p => p.id === apiPkg.id)) {
              combinedPackages.push(apiPkg);
            }
          });
        }
      } catch (err) {
        console.error('Lỗi tải đề thi từ API:', err);
      }
    }

    setMyQuizPackages(combinedPackages);
    if (combinedPackages.length > 0) {
      setSelectedPackageId(combinedPackages[0].id);
    }
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

  const handleBackToDashboard = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setCurrentRoom(null);
    navigate('/dau-truong-live');
    if (user) {
      loadMyRooms();
    }
  };

  useEffect(() => {
    if (roomId) {
      fetchHostRoom(roomId);
    } else {
      setCurrentRoom(null);
      if (user) {
        loadMyRooms();
      }
    }
  }, [roomId, user]);

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

  // Tải danh sách nhóm Bảng Vinh Danh
  const loadLeaderboardGroups = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/leaderboard?action=get-my-groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboardGroups(data.groups || []);
        if (data.groups && data.groups.length > 0) {
          setSelectedLeaderboardGroupId(data.groups[0].id);
        }
      }
    } catch (err) {
      console.error('Lỗi tải nhóm vinh danh:', err);
    }
  };

  // Đồng bộ kết quả đấu trường sang Bảng Vinh Danh
  const handleSyncToLeaderboard = async () => {
    if (!currentRoom) return;
    setIsSyncingLeaderboard(true);
    try {
      const res = await fetch('/api/live-battle?action=sync-to-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: currentRoom.id,
          targetGroupId: selectedLeaderboardGroupId || undefined,
          targetGroupName: `${currentRoom.title} (Đấu trường)`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã đồng bộ sang Bảng Vinh Danh!', 'success');
        setShowSyncModal(false);
      } else {
        showAlert(data.message || 'Không thể đồng bộ', 'Lỗi đồng bộ');
      }
    } catch (err: any) {
      showAlert(err.message || 'Lỗi kết nối máy chủ', 'Lỗi đồng bộ');
    } finally {
      setIsSyncingLeaderboard(false);
    }
  };

  // Hàm parse câu hỏi nhập nhanh từ text
  const parseCustomTextQuestions = (text: string): QuestionItem[] => {
    if (!text.trim()) return [];
    const blocks = text.split(/(?:Câu\s*\d+[:.]|\n\s*\n)/i).map(b => b.trim()).filter(Boolean);
    const parsedQuestions: QuestionItem[] = [];

    blocks.forEach((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        const qTitle = lines[0].replace(/^Câu\s*\d+[:.]\s*/i, '');
        const options: string[] = [];
        let correctIdx = 0;

        lines.slice(1).forEach(line => {
          if (/^[A-D][.:)]\s*/i.test(line)) {
            options.push(line.replace(/^[A-D][.:)]\s*/i, '').trim());
          } else if (/^Đáp án[:.]\s*/i.test(line)) {
            const rawAns = line.replace(/^Đáp án[:.]\s*/i, '').trim().toUpperCase();
            const charIdx = ['A', 'B', 'C', 'D'].indexOf(rawAns);
            if (charIdx >= 0) {
              correctIdx = charIdx;
            } else {
              const matchedOptionIdx = options.findIndex((o: string) => o.toLowerCase() === rawAns.toLowerCase());
              if (matchedOptionIdx >= 0) correctIdx = matchedOptionIdx;
            }
          }
        });

        if (qTitle && options.length >= 2) {
          parsedQuestions.push({
            id: `q-${Date.now()}-${idx}`,
            question: qTitle,
            options: options.slice(0, 4),
            correctAnswer: correctIdx < options.length ? correctIdx : 0
          });
        }
      }
    });

    return parsedQuestions;
  };

  // Tạo phòng mới
  const handleCreateRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      showAlert('Vui lòng đăng nhập để tạo phòng đấu trường!', 'Chưa đăng nhập');
      return;
    }
    if (!newTitle.trim()) {
      showAlert('Vui lòng nhập tên phòng thi!', 'Thiếu thông tin');
      return;
    }

    let finalQuestions: QuestionItem[] = [];

    if (quizSource === 'bank') {
      if (!selectedPackageId) {
        showAlert('Vui lòng chọn một đề thi từ danh sách ngân hàng đề thi!', 'Chưa chọn đề');
        return;
      }
      const pkg = myQuizPackages.find(p => p.id === selectedPackageId);
      if (pkg && Array.isArray(pkg.questions) && pkg.questions.length > 0) {
        finalQuestions = pkg.questions
          .filter((q: any) => q.type === 'choice' || !q.type || (Array.isArray(q.options) && q.options.length >= 2))
          .map((q: any) => {
            const opts: string[] = Array.isArray(q.options) && q.options.length >= 2
              ? q.options.map((opt: any) => String(opt).trim())
              : ['A', 'B', 'C', 'D'];

            let correctNum = 0;
            if (typeof q.correctAnswer === 'number') {
              correctNum = q.correctAnswer;
            } else if (typeof q.correctOption === 'number') {
              correctNum = q.correctOption;
            } else if (typeof q.correctAnswer === 'string') {
              const str = q.correctAnswer.trim();
              const matchedIndex = opts.findIndex((o: string) => o.toLowerCase() === str.toLowerCase());
              if (matchedIndex >= 0) {
                correctNum = matchedIndex;
              } else if (/^[A-D]$/i.test(str)) {
                correctNum = ['A', 'B', 'C', 'D'].indexOf(str.toUpperCase());
              }
            }

            return {
              id: q.id || `q-${Math.random()}`,
              question: q.title || q.question || 'Câu hỏi trắc nghiệm',
              options: opts.slice(0, 4),
              correctAnswer: correctNum >= 0 && correctNum < opts.length ? correctNum : 0,
              explanation: q.explanation || ''
            };
          });
      }

      if (finalQuestions.length === 0) {
        showAlert('Bộ đề thi bạn chọn không có câu hỏi trắc nghiệm hợp lệ!', 'Bộ đề rỗng');
        return;
      }
    } else if (quizSource === 'custom') {
      finalQuestions = parseCustomTextQuestions(customQuestionsText);
      if (finalQuestions.length === 0) {
        showAlert('Không nhận diện được câu hỏi trắc nghiệm từ văn bản bạn dán. Vui lòng kiểm tra định dạng mẫu: Câu 1, A, B, C, D, Đáp án: A', 'Lỗi định dạng');
        return;
      }
    } else {
      finalQuestions = manualQuestions.filter(q => q.question.trim().length > 0);
    }

    if (finalQuestions.length === 0) {
      showAlert('Vui lòng thêm ít nhất 1 câu hỏi cho phòng thi!', 'Thiếu câu hỏi');
      return;
    }

    setIsSubmittingRoom(true);
    try {
      const res = await fetch('/api/live-battle?action=create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: newTitle.trim(),
          timePerQuestion: timePerQ,
          questions: finalQuestions,
          settings: {
            battleMode,
            teamCount: battleMode === 'team' ? teamCount : undefined,
            teams: battleMode === 'team' ? PRESET_TEAMS.slice(0, teamCount) : undefined
          }
        })
      });
      const data = await res.json();
      if (data.success && data.room) {
        showToast('Đã tạo phòng đấu trường thành công!', 'success');
        setIsCreatingRoom(false);
        navigate(`/dau-truong-live/${data.room.id}`);
      } else {
        showAlert(data.message || 'Lỗi khi tạo phòng', 'Lỗi');
      }
    } catch (err: any) {
      showAlert(err.message || 'Lỗi khi tạo phòng', 'Lỗi');
    } finally {
      setIsSubmittingRoom(false);
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

  // Mở modal xem danh sách học viên của một phòng
  const handleInspectRoom = async (roomId: string) => {
    try {
      const res = await fetch(`/api/live-battle?action=get-host-room&roomId=${encodeURIComponent(roomId)}`);
      const data = await res.json();
      if (data.success && data.room) {
        setInspectingRoom(data.room);
      } else {
        showAlert('Không tìm thấy thông tin phòng hoặc học viên!', 'Thông báo');
      }
    } catch (e: any) {
      console.error(e);
      showAlert(e.message || 'Lỗi khi tải danh sách học viên', 'Lỗi');
    }
  };

  // Xuất file Excel (.xlsx) danh sách học viên tham gia đấu trường
  const exportPlayersExcel = (room: any) => {
    if (!room || !Array.isArray(room.players) || room.players.length === 0) {
      showAlert('Phòng này chưa có học viên nào tham gia để xuất file!', 'Chưa có dữ liệu');
      return;
    }

    const totalQ = Array.isArray(room.questions) ? room.questions.length : 0;
    
    const isTeamRoom = room.settings?.battleMode === 'team';
    
    // Header thông tin chung
    const headerInfo = [
      ['BẢNG XẾP HẠNG & DANH SÁCH HỌC VIÊN - ĐẤU TRƯỜNG TRỰC TIẾP'],
      ['Tên phòng thi:', room.title],
      ['Hình thức thi đấu:', isTeamRoom ? 'Đấu Đội Kháng Chiến (Team Battle)' : 'Cá Nhân Tự Do (Free For All)'],
      ['Mã PIN phòng:', room.pinCode],
      ['Thời gian mỗi câu:', `${room.timePerQuestion || 20} giây/câu`],
      ['Tổng số câu hỏi:', `${totalQ} câu`],
      ['Tổng số học viên tham gia:', `${room.players.length} học viên`],
      ['Thời gian xuất file:', new Date().toLocaleString('vi-VN')],
      []
    ];

    const tableHeaders = [
      'Thứ hạng',
      'Họ và tên học viên',
      ...(isTeamRoom ? ['Đội thi đấu'] : []),
      'Mã số sinh viên (MSSV)',
      'Lớp học',
      'Tổng điểm (pts)',
      'Chuỗi trả lời đúng (Streak)',
      'Số câu đúng / Tổng số',
      'Tỷ lệ đúng (%)'
    ];

    const tableRows = room.players.map((p: any, idx: number) => {
      const correctCount = (p.answers || []).filter((a: any) => a.isCorrect).length;
      const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
      return [
        idx === 0 ? 'Hạng 1 (Quán quân)' : idx === 1 ? 'Hạng 2 (Á quân)' : idx === 2 ? 'Hạng 3 (Quý quân)' : `Hạng ${idx + 1}`,
        p.nickname,
        ...(isTeamRoom ? [p.teamName || 'Chưa vào đội'] : []),
        p.studentId || '',
        p.className || '',
        p.totalScore,
        p.streak,
        `${correctCount}/${totalQ}`,
        `${accuracy}%`
      ];
    });

    const worksheetData = [...headerInfo, tableHeaders, ...tableRows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Cài đặt độ rộng cột chuẩn
    ws['!cols'] = [
      { wch: 20 }, // Thứ hạng
      { wch: 28 }, // Họ và tên
      ...(isTeamRoom ? [{ wch: 20 }] : []), // Đội
      { wch: 22 }, // MSSV
      { wch: 18 }, // Lớp học
      { wch: 18 }, // Tổng điểm
      { wch: 25 }, // Chuỗi đúng
      { wch: 22 }, // Số câu đúng
      { wch: 16 }  // Tỷ lệ đúng
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BangXepHang');

    const cleanTitle = (room.title || 'DauTruong').replace(/[\/\\:*?"<>|]/g, '_');
    const fileName = `DauTruong_${room.pinCode}_${cleanTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast('Đã xuất và tải xuống file Excel (.xlsx) thành công!', 'success');
  };

  // -------------------------------------------------------------
  // RENDER MÀN HÌNH ĐIỀU KHIỂN ĐẤU TRƯỜNG CHO MÁY CHIẾU (HOST VIEW)
  // -------------------------------------------------------------
  if (currentRoom) {
    const questions: QuestionItem[] = currentRoom.questions || [];
    const currentQ = questions[currentRoom.currentQuestionIndex];
    const players: PlayerItem[] = currentRoom.players || [];
    const totalQ = questions.length;
    const isTeamMode = currentRoom.settings?.battleMode === 'team';
    const roomTeams: any[] = currentRoom.settings?.teams || PRESET_TEAMS.slice(0, 3);

    // Tính toán tổng điểm và điểm trung bình cho từng đội
    const teamStats = roomTeams.map(t => {
      const teamPlayers = players.filter(p => p.teamId === t.id);
      const totalScore = teamPlayers.reduce((acc, cur) => acc + (cur.totalScore || 0), 0);
      const avgScore = teamPlayers.length > 0 ? Math.round(totalScore / teamPlayers.length) : 0;
      return {
        ...t,
        players: teamPlayers,
        playerCount: teamPlayers.length,
        totalScore,
        avgScore
      };
    }).sort((a, b) => b.totalScore - a.totalScore);

    return (
      <div className="battle-host-screen">
        {/* Top Header Bar */}
        <header className="battle-topbar">
          <div className="battle-brand">
            <button 
              type="button" 
              onClick={handleBackToDashboard} 
              className="battle-back-link" 
              title="Quay lại danh sách phòng"
              style={{ cursor: 'pointer', border: 'none' }}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="battle-logo-badge">⚡ LIVE BATTLE</div>
            <span className="battle-room-title">{currentRoom.title}</span>
          </div>

          <div className="battle-top-actions">
            <button 
              className="battle-btn-sound" 
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Thu nhỏ cửa sổ (ESC)' : 'Phóng to toàn màn hình máy chiếu'}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>

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
              ) : isTeamMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {teamStats.map(team => (
                    <div key={team.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '0.75rem 1rem', border: `1.5px solid ${team.color}50` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 800, color: team.color, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>{team.mascot}</span> {team.name}
                        </span>
                        <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '0.15rem 0.5rem', borderRadius: 20 }}>
                          {team.playerCount} thành viên
                        </span>
                      </div>
                      <div className="lobby-players-grid">
                        {team.players.map((p: any) => (
                          <div key={p.id} className="player-lobby-chip" style={{ borderLeft: `3px solid ${team.color}` }}>
                            <span className="player-emoji">{p.avatarEmoji || '🦊'}</span>
                            <span className="player-name">{p.nickname}</span>
                          </div>
                        ))}
                        {team.playerCount === 0 && (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có thành viên</span>
                        )}
                      </div>
                    </div>
                  ))}
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

            {/* NẾU LÀ ĐẤU ĐỘI: HIỂN THỊ BẢNG ĐIỂM CÁC ĐỘI LIÊN MINH */}
            {isTeamMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '800px', margin: '0 auto 1.5rem' }}>
                {teamStats.map((team, idx) => (
                  <div 
                    key={team.id} 
                    style={{ 
                      background: 'rgba(15, 23, 42, 0.75)', 
                      borderRadius: 16, 
                      padding: '1.25rem 1.5rem', 
                      border: `2px solid ${team.color}`,
                      boxShadow: `0 8px 25px ${team.color}30`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.75rem' }}>{team.mascot}</span>
                        <div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: team.color }}>
                            #{idx + 1} {team.name}
                          </div>
                          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                            {team.playerCount} thành viên • Điểm TB: {team.avgScore} pts
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8' }}>
                          {team.totalScore.toLocaleString()} pts
                        </div>
                      </div>
                    </div>

                    {/* Thanh năng lượng điểm số */}
                    <div style={{ height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${teamStats[0]?.totalScore > 0 ? Math.min(100, (team.totalScore / teamStats[0].totalScore) * 100) : 0}%`, 
                          background: team.color,
                          borderRadius: 9999,
                          transition: 'width 0.8s ease'
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="leaderboard-list">
                {players.slice(0, 5).map((p, idx) => (
                  <div key={p.id} className={`leaderboard-row rank-${idx + 1}`}>
                    <div className="rank-pos">#{idx + 1}</div>
                    <div className="rank-avatar">{p.avatarEmoji || '🦊'}</div>
                    <div className="rank-name-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span className="rank-name">{p.nickname}</span>
                        {p.studentId && (
                          <span className="rank-badge-sub">MSSV: {p.studentId}</span>
                        )}
                        {p.className && (
                          <span className="rank-badge-sub">Lớp: {p.className}</span>
                        )}
                      </div>
                      {p.streak > 1 && (
                        <span className="rank-streak"><Flame size={14} /> Chuỗi đúng {p.streak} câu liên tiếp 🔥</span>
                      )}
                    </div>
                    <div className="rank-score">{p.totalScore.toLocaleString()} pts</div>
                  </div>
                ))}
              </div>
            )}

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

            {/* BỤC VINH DANH ĐỘI VÔ ĐỊCH (NẾU LÀ ĐẤU ĐỘI) */}
            {isTeamMode && teamStats.length > 0 && (
              <div className="team-podium-section" style={{ marginBottom: '2.5rem', width: '100%', maxWidth: '800px' }}>
                <h3 style={{ textAlign: 'center', color: '#f59e0b', fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span>🛡️</span> LIÊN MINH ĐỘI QUÁN QUÂN <span>🏆</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(teamStats.length, 3)}, 1fr)`, gap: '1rem' }}>
                  {teamStats.slice(0, 3).map((team, idx) => (
                    <div 
                      key={team.id}
                      style={{
                        background: idx === 0 
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(15, 23, 42, 0.9))' 
                          : 'rgba(30, 41, 59, 0.85)',
                        border: `2px solid ${idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#cd7f32'}`,
                        borderRadius: '16px',
                        padding: '1.25rem 1rem',
                        textAlign: 'center',
                        position: 'relative',
                        boxShadow: idx === 0 ? '0 10px 25px -5px rgba(245, 158, 11, 0.3)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '1.8rem', position: 'absolute', top: '-14px', right: '12px' }}>
                        {idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉'}
                      </div>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>{team.mascot}</div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: team.color }}>{team.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0.5rem' }}>{team.count} thành viên</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fef08a' }}>
                        {team.totalScore.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>pts</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.25rem' }}>
                        ĐTB: {team.avgScore.toLocaleString()} pts/người
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="podium-stage">
              {/* Hạng 2 */}
              {players[1] && (
                <div className="podium-step step-2">
                  <div className="podium-player">
                    <span className="step-medal">🥈 Á Quân</span>
                    <span className="step-emoji">{players[1].avatarEmoji}</span>
                    <span className="step-name">{players[1].nickname}</span>
                    {isTeamMode && players[1].teamName && (
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                        {players[1].teamName}
                      </span>
                    )}
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
                    {isTeamMode && players[0].teamName && (
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                        {players[0].teamName}
                      </span>
                    )}
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
                    {isTeamMode && players[2].teamName && (
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                        {players[2].teamName}
                      </span>
                    )}
                    <span className="step-score">{players[2].totalScore.toLocaleString()} pts</span>
                  </div>
                  <div className="step-block block-3">3</div>
                </div>
              )}
            </div>

            {/* BẢNG TỔNG SẮP TOÀN BỘ HỌC VIÊN THAM GIA ĐẤU TRƯỜNG */}
            <div className="battle-all-players-card">
              <div className="all-players-header">
                <h3>
                  <ListOrdered size={22} color="#f59e0b" />
                  Bảng Tổng Sắp & Danh Sách Học Viên Tham Gia ({players.length} dũng sĩ)
                </h3>
                <span className="all-players-hint">Toàn bộ kết quả, điểm số và chuỗi trả lời đúng</span>
              </div>

              {players.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  Chưa có thông tin học viên nào tham gia vòng đấu này.
                </div>
              ) : (
                <div className="all-players-table-wrapper">
                  <table className="battle-players-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>Hạng</th>
                        <th>Học viên</th>
                        {isTeamMode && <th>Đội</th>}
                        <th>MSSV</th>
                        <th>Lớp</th>
                        <th style={{ textAlign: 'center' }}>Chuỗi đúng</th>
                        <th style={{ textAlign: 'center' }}>Đúng/Tổng</th>
                        <th style={{ textAlign: 'right' }}>Tổng điểm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p, idx) => {
                        const correctCount = (p.answers || []).filter((a: any) => a.isCorrect).length;
                        return (
                          <tr key={p.id} className={idx < 3 ? `top-rank-row rank-${idx + 1}` : ''}>
                            <td style={{ textAlign: 'center', fontWeight: 800 }}>
                              {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ fontSize: '1.4rem' }}>{p.avatarEmoji || '🦊'}</span>
                                <span style={{ fontWeight: 700 }}>{p.nickname}</span>
                              </div>
                            </td>
                            {isTeamMode && (
                              <td>
                                <span style={{ 
                                  display: 'inline-block',
                                  padding: '2px 8px', 
                                  borderRadius: '6px', 
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  background: 'rgba(255,255,255,0.08)',
                                  color: '#e2e8f0',
                                  border: '1px solid rgba(255,255,255,0.15)'
                                }}>
                                  {p.teamName || '—'}
                                </span>
                              </td>
                            )}
                            <td style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{p.studentId || '—'}</td>
                            <td style={{ color: '#cbd5e1' }}>{p.className || '—'}</td>
                            <td style={{ textAlign: 'center' }}>
                              {p.streak > 1 ? (
                                <span className="streak-tag">🔥 {p.streak}</span>
                              ) : (
                                <span style={{ color: '#64748b' }}>—</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>
                              <span style={{ color: '#10b981' }}>{correctCount}</span> / {totalQ}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#f59e0b', fontSize: '1.1rem' }}>
                              {p.totalScore.toLocaleString()} pts
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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

              <button 
                className="btn-sync-leaderboard"
                onClick={() => {
                  loadLeaderboardGroups();
                  setShowSyncModal(true);
                }}
              >
                <Trophy size={18} /> Lưu & Vinh Danh Vào Bảng Điểm Lớp
              </button>

              <button
                type="button"
                className="btn-sync-leaderboard"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff' }}
                onClick={() => exportPlayersExcel(currentRoom)}
                disabled={players.length === 0}
                title="Tải bảng điểm xếp hạng định dạng Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet size={18} /> Xuất File Excel (.xlsx)
              </button>

              <Link to="/bang-vinh-danh" className="btn-view-leaderboard-link">
                <ArrowUpRight size={18} /> Xem Trang Bảng Vinh Danh
              </Link>
            </div>

            {/* MODAL XÁC NHẬN ĐỒNG BỘ VÀO BẢNG VINH DANH */}
            {showSyncModal && (
              <div className="battle-modal-overlay" onClick={() => setShowSyncModal(false)}>
                <div className="battle-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                  <div className="battle-modal-header">
                    <div className="battle-modal-title-group">
                      <div className="battle-modal-icon-badge" style={{ background: '#f59e0b', color: '#000' }}>
                        <Trophy size={22} />
                      </div>
                      <div>
                        <h3 className="battle-modal-title">Lưu Vào Bảng Vinh Danh Lớp</h3>
                        <p className="battle-modal-subtitle">Cộng điểm tích lũy thi đua học tập cho toàn bộ học viên</p>
                      </div>
                    </div>
                    <button type="button" className="battle-modal-close" onClick={() => setShowSyncModal(false)}>✕</button>
                  </div>

                  <div className="battle-modal-body" style={{ padding: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.9rem', color: '#fef08a' }}>
                      ✨ <strong>Cơ chế cộng điểm thi đua:</strong><br />
                      • Top 1 (Quán Quân): +10đ thưởng<br />
                      • Top 2 (Á Quân): +7đ thưởng<br />
                      • Top 3 (Quý Quân): +5đ thưởng<br />
                      • Tất cả dũng sĩ: Quy đổi 100 điểm đấu trường = 1 điểm tích lũy học tập.
                    </div>

                    <div className="battle-form-group">
                      <label className="battle-form-label">
                        <span>Chọn nhóm / lớp thi đua nhận điểm:</span>
                      </label>
                      <select 
                        value={selectedLeaderboardGroupId} 
                        onChange={e => setSelectedLeaderboardGroupId(e.target.value)}
                        className="battle-modal-select"
                        style={{ color: '#fff', background: '#1e293b' }}
                      >
                        <option value="">+ Tự động tạo nhóm mới: "{currentRoom.title} (Đấu trường)"</option>
                        {leaderboardGroups.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.name} {g.className ? `(Lớp: ${g.className})` : ''} - {g._count?.students || 0} SV
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowSyncModal(false)}>
                        Hủy
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-primary" 
                        onClick={handleSyncToLeaderboard}
                        disabled={isSyncingLeaderboard}
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#000', fontWeight: 800 }}
                      >
                        {isSyncingLeaderboard ? 'Đang lưu...' : '⚡ Xác Nhận Lưu & Cộng Điểm'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                    type="button"
                    className="room-btn-open"
                    onClick={() => navigate(`/dau-truong-live/${r.id}`)}
                    title="Mở màn hình máy chiếu cho lớp học"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Mở Máy Chiếu</span>
                  </button>

                  <button 
                    type="button"
                    className="room-btn-players"
                    onClick={() => handleInspectRoom(r.id)}
                    title="Xem chi tiết danh sách học viên & bảng điểm"
                  >
                    <Eye size={15} />
                    <span>Học viên ({r._count?.players || 0})</span>
                  </button>

                  <button 
                    type="button"
                    className="room-btn-delete"
                    onClick={() => handleDeleteRoom(r.id, r.title)}
                    title="Xóa phòng thi này"
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
        <div className="battle-modal-overlay" onClick={() => setIsCreatingRoom(false)}>
          <div className="battle-modal-card" onClick={e => e.stopPropagation()}>
            <div className="battle-modal-header">
              <div className="battle-modal-title-group">
                <div className="battle-modal-icon-badge">
                  <Swords size={22} />
                </div>
                <div>
                  <h3 className="battle-modal-title">Tạo Phòng Đấu Trường Trực Tiếp</h3>
                  <p className="battle-modal-subtitle">Thiết lập phòng thi thời gian thực kiểu Kahoot</p>
                </div>
              </div>
              <button 
                type="button" 
                className="battle-modal-close" 
                onClick={() => setIsCreatingRoom(false)}
                title="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="battle-modal-body">
                <div className="battle-form-group">
                  <label className="battle-form-label">
                    <span>Tiêu đề phòng thi <span style={{ color: '#ef4444' }}>*</span></span>
                    <span className="battle-form-label-hint">Tên lớp hoặc chủ đề thi</span>
                  </label>
                  <input 
                    type="text" 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ví dụ: Đấu trường Sinh lý bệnh - Tiết 3" 
                    className="battle-modal-input"
                    autoFocus
                    required 
                  />
                </div>

                <div className="battle-form-group">
                  <label className="battle-form-label">
                    <span>Thời gian trả lời mỗi câu</span>
                    <span className="battle-form-label-hint">Đếm ngược trực tiếp</span>
                  </label>
                  <select 
                    value={timePerQ} 
                    onChange={e => setTimePerQ(Number(e.target.value))}
                    className="battle-modal-select"
                  >
                    <option value={10}>⚡ 10 giây (Rất nhanh)</option>
                    <option value={15}>⏱️ 15 giây (Nhanh)</option>
                    <option value={20}>🎯 20 giây (Chuẩn Kahoot - Khuyên dùng)</option>
                    <option value={30}>🕒 30 giây (Thoải mái suy nghĩ)</option>
                    <option value={45}>⌛ 45 giây (Câu hỏi phức tạp, tính toán)</option>
                  </select>
                </div>

                {/* CHỌN HÌNH THỨC THI ĐẤU: CÁ NHÂN HOẶC ĐỘI NHÓM */}
                <div className="battle-form-group">
                  <label className="battle-form-label">
                    <span>Hình thức thi đấu</span>
                    <span className="battle-form-label-hint">Cá nhân hoặc Đội nhóm đối kháng</span>
                  </label>
                  <div className="battle-source-options" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '0.6rem' }}>
                    <div 
                      className={`battle-source-card ${battleMode === 'individual' ? 'active' : ''}`}
                      onClick={() => setBattleMode('individual')}
                      style={{ cursor: 'pointer' }}
                    >
                      <input 
                        type="radio" 
                        name="battleMode" 
                        checked={battleMode === 'individual'} 
                        onChange={() => setBattleMode('individual')} 
                      />
                      <div className="battle-source-card-text">
                        <span className="battle-source-card-title">👤 Cá Nhân (FFA)</span>
                        <span className="battle-source-card-desc">Từng học viên đua top</span>
                      </div>
                    </div>

                    <div 
                      className={`battle-source-card ${battleMode === 'team' ? 'active' : ''}`}
                      onClick={() => setBattleMode('team')}
                      style={{ cursor: 'pointer' }}
                    >
                      <input 
                        type="radio" 
                        name="battleMode" 
                        checked={battleMode === 'team'} 
                        onChange={() => setBattleMode('team')} 
                      />
                      <div className="battle-source-card-text">
                        <span className="battle-source-card-title">⚔️ Đấu Đội (Team vs Team)</span>
                        <span className="battle-source-card-desc">Thi đấu theo nhóm liên minh</span>
                      </div>
                    </div>
                  </div>

                  {battleMode === 'team' && (
                    <div style={{ padding: '0.85rem 1rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 10, border: '1px solid rgba(59, 130, 246, 0.25)', marginTop: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Số lượng đội thi đấu:</span>
                        <select 
                          value={teamCount} 
                          onChange={e => setTeamCount(Number(e.target.value))}
                          className="battle-modal-select"
                          style={{ width: 'auto', padding: '0.3rem 0.75rem', fontSize: '0.85rem' }}
                        >
                          <option value={2}>2 Đội (Đỏ vs Xanh)</option>
                          <option value={3}>3 Đội (Đỏ, Xanh, Vàng)</option>
                          <option value={4}>4 Đội (Đỏ, Xanh, Vàng, Lục)</option>
                          <option value={5}>5 Đội (Đỏ, Xanh, Vàng, Lục, Tím)</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {PRESET_TEAMS.slice(0, teamCount).map(t => (
                          <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#fff', border: `1.5px solid ${t.color}`, color: t.color, fontWeight: 700, fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: 9999 }}>
                            <span>{t.mascot}</span> {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="battle-form-group">
                  <label className="battle-form-label">
                    <span>Nguồn câu hỏi trắc nghiệm</span>
                    <span className="battle-form-label-hint">Chọn cách nạp đề thi</span>
                  </label>
                  
                  <div className="battle-source-options" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div 
                      className={`battle-source-card ${quizSource === 'manual' ? 'active' : ''}`}
                      onClick={() => setQuizSource('manual')}
                    >
                      <input 
                        type="radio" 
                        name="qSource" 
                        checked={quizSource === 'manual'} 
                        onChange={() => setQuizSource('manual')} 
                      />
                      <div className="battle-source-card-text">
                        <span className="battle-source-card-title">Bộ câu mẫu</span>
                        <span className="battle-source-card-desc">2 câu khởi động</span>
                      </div>
                    </div>

                    <div 
                      className={`battle-source-card ${quizSource === 'custom' ? 'active' : ''}`}
                      onClick={() => setQuizSource('custom')}
                    >
                      <input 
                        type="radio" 
                        name="qSource" 
                        checked={quizSource === 'custom'} 
                        onChange={() => setQuizSource('custom')} 
                      />
                      <div className="battle-source-card-text">
                        <span className="battle-source-card-title">Dán câu hỏi</span>
                        <span className="battle-source-card-desc">Nhập văn bản ABCD</span>
                      </div>
                    </div>

                    <div 
                      className={`battle-source-card ${quizSource === 'bank' ? 'active' : ''}`}
                      onClick={() => setQuizSource('bank')}
                    >
                      <input 
                        type="radio" 
                        name="qSource" 
                        checked={quizSource === 'bank'} 
                        onChange={() => setQuizSource('bank')} 
                      />
                      <div className="battle-source-card-text">
                        <span className="battle-source-card-title">Ngân hàng đề</span>
                        <span className="battle-source-card-desc">{myQuizPackages.length} đề thi sẵn có</span>
                      </div>
                    </div>
                  </div>

                  {quizSource === 'bank' ? (
                    <div style={{ marginTop: '0.85rem' }}>
                      {myQuizPackages.length === 0 ? (
                        <div className="battle-info-banner" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#b45309' }}>
                          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong>Bạn chưa có bộ đề nào trong ngân hàng đề thi!</strong>
                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem' }}>
                              Bạn có thể chọn <strong>"Dán câu hỏi"</strong> ở trên để nạp ngay, hoặc bấm vào <Link to="/tao-de-thi" target="_blank" style={{ color: '#4f46e5', textDecoration: 'underline', fontWeight: 700 }}>Quản lý Đề Thi</Link> để tạo đề trắc nghiệm bằng AI.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                            Chọn đề thi từ Ngân hàng của bạn:
                          </label>
                          <select 
                            value={selectedPackageId} 
                            onChange={e => setSelectedPackageId(e.target.value)}
                            className="battle-modal-select"
                          >
                            <option value="">-- Chọn đề thi --</option>
                            {myQuizPackages.map(pkg => (
                              <option key={pkg.id} value={pkg.id}>
                                📖 {pkg.title} ({Array.isArray(pkg.questions) ? pkg.questions.length : 0} câu hỏi)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ) : quizSource === 'custom' ? (
                    <div style={{ marginTop: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                          Dán câu hỏi trắc nghiệm (Định dạng ABCD):
                        </label>
                        <button 
                          type="button" 
                          onClick={() => setCustomQuestionsText(
`Câu 1: Thủ đô của Việt Nam là thành phố nào?
A. Hà Nội
B. Đà Nẵng
C. TP Hồ Chí Minh
D. Hải Phòng
Đáp án: A

Câu 2: Đơn vị tiền tệ chính thức của Việt Nam là gì?
A. Dollar
B. Đồng
C. Yen
D. Euro
Đáp án: B`
                          )}
                          style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Điền mẫu thử
                        </button>
                      </div>
                      <textarea
                        rows={6}
                        className="battle-modal-input"
                        style={{ fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }}
                        value={customQuestionsText}
                        onChange={e => setCustomQuestionsText(e.target.value)}
                        placeholder={`Câu 1: Câu hỏi của bạn là gì?
A. Lựa chọn thứ nhất
B. Lựa chọn thứ hai
C. Lựa chọn thứ ba
D. Lựa chọn thứ tư
Đáp án: A`}
                      />
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>
                        💡 Tự động nhận diện các dòng <strong>Câu 1, A, B, C, D</strong> và <strong>Đáp án: A</strong>.
                      </div>
                    </div>
                  ) : (
                    <div className="battle-info-banner" style={{ marginTop: '0.85rem' }}>
                      <Sparkles size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#3b82f6' }} />
                      <div>
                        <strong>Khởi động tức thì:</strong> Đã có sẵn 2 câu hỏi mẫu khởi động. Bạn có thể bấm tạo ngay để mở máy chiếu và thử nghiệm trải nghiệm cùng lớp học!
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="battle-modal-footer">
                <button type="button" className="btn-battle-cancel" onClick={() => setIsCreatingRoom(false)}>
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn-battle-submit" 
                  disabled={isSubmittingRoom}
                >
                  {isSubmittingRoom ? (
                    <span>Đang khởi tạo...</span>
                  ) : (
                    <>
                      <Play size={18} /> Khởi Tạo & Mở Máy Chiếu
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem Danh Sách Học Viên Đã Tham Gia Phòng */}
      {inspectingRoom && (
        <div className="battle-modal-overlay" onClick={() => setInspectingRoom(null)}>
          <div className="battle-modal-card" style={{ maxWidth: '820px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="battle-modal-header">
              <div className="battle-modal-title-group">
                <div className="battle-modal-icon-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="battle-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Danh Sách Học Viên ({inspectingRoom.players?.length || 0} người)
                    <span className="room-pin-tag" style={{ fontSize: '0.78rem' }}>PIN: {inspectingRoom.pinCode}</span>
                  </h3>
                  <p className="battle-modal-subtitle">
                    Phòng: <strong>{inspectingRoom.title}</strong> • Trạng thái: {inspectingRoom.status}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="battle-modal-close" 
                onClick={() => setInspectingRoom(null)}
                title="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            <div className="battle-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', padding: '1.25rem' }}>
              {!inspectingRoom.players || inspectingRoom.players.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                  <Users size={44} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ fontWeight: 600, fontSize: '1rem', color: '#334155' }}>Chưa có học viên nào tham gia phòng này</p>
                  <p style={{ fontSize: '0.85rem' }}>Khi học viên quét mã QR hoặc nhập PIN vào phòng, danh sách và điểm số sẽ được lưu tự động tại đây.</p>
                </div>
              ) : (
                <div className="all-players-table-wrapper" style={{ maxHeight: '420px', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <table className="battle-players-table" style={{ color: '#1e293b' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ width: '60px', textAlign: 'center', color: '#64748b' }}>Hạng</th>
                        <th style={{ color: '#64748b' }}>Học viên</th>
                        {inspectingRoom.settings?.battleMode === 'team' && (
                          <th style={{ color: '#64748b' }}>Đội</th>
                        )}
                        <th style={{ color: '#64748b' }}>MSSV</th>
                        <th style={{ color: '#64748b' }}>Lớp</th>
                        <th style={{ textAlign: 'center', color: '#64748b' }}>Chuỗi đúng</th>
                        <th style={{ textAlign: 'center', color: '#64748b' }}>Đúng/Tổng</th>
                        <th style={{ textAlign: 'right', color: '#64748b' }}>Tổng điểm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectingRoom.players.map((p: any, idx: number) => {
                        const totalQ = Array.isArray(inspectingRoom.questions) ? inspectingRoom.questions.length : 0;
                        const correctCount = (p.answers || []).filter((a: any) => a.isCorrect).length;
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ textAlign: 'center', fontWeight: 800 }}>
                              {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ fontSize: '1.3rem' }}>{p.avatarEmoji || '🦊'}</span>
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>{p.nickname}</span>
                              </div>
                            </td>
                            {inspectingRoom.settings?.battleMode === 'team' && (
                              <td>
                                <span style={{ 
                                  display: 'inline-block',
                                  padding: '2px 8px', 
                                  borderRadius: '6px', 
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  background: '#f1f5f9',
                                  color: '#334155',
                                  border: '1px solid #cbd5e1'
                                }}>
                                  {p.teamName || '—'}
                                </span>
                              </td>
                            )}
                            <td style={{ color: '#64748b', fontFamily: 'monospace' }}>{p.studentId || '—'}</td>
                            <td style={{ color: '#475569' }}>{p.className || '—'}</td>
                            <td style={{ textAlign: 'center' }}>
                              {p.streak > 1 ? (
                                <span className="streak-tag">🔥 {p.streak}</span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>—</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>
                              <span style={{ color: '#16a34a' }}>{correctCount}</span> / {totalQ}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#d97706', fontSize: '1rem' }}>
                              {p.totalScore.toLocaleString()} pts
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="battle-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.25rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="btn btn-outline"
                disabled={!inspectingRoom.players || inspectingRoom.players.length === 0}
                onClick={() => exportPlayersExcel(inspectingRoom)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5' }}
                title="Tải bảng điểm học viên định dạng Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet size={17} color="#059669" /> Xuất File Excel (.xlsx)
              </button>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    navigate(`/dau-truong-live/${inspectingRoom.id}`);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Play size={15} /> Mở Phòng Máy Chiếu
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setInspectingRoom(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

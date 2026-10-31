import { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, 
  Sparkles, 
  RotateCcw, 
  Trophy, 
  Clock, 
  Volume2, 
  VolumeX, 
  Download, 
  Copy, 
  Check, 
  Play, 
  Eye, 
  Maximize2, 
  Minimize2,
  Shuffle,
  Flame,
  Award,
  BookOpen,
  HelpCircle,
  Zap,
  Star,
  Calendar,
  FileText,
  Upload,
  Brain,
  Wand2,
  Loader2
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './TeachingGamesStudio.css';

export interface MysteryBox {
  id: number;
  question: string;
  points: number; // Điểm cộng hoặc trừ hoặc nhân đôi
  specialType?: 'normal' | 'bomb' | 'bonus' | 'double' | 'swap';
  explanation?: string;
  isOpen: boolean;
  openedByTeam?: string | null;
}

export interface MemoryCard {
  id: string;
  pairId: string;
  text: string;
  type: 'concept' | 'definition';
  isFlipped: boolean;
  isMatched: boolean;
  color?: string;
}

export interface WordScramble {
  id: string;
  scrambled: string;
  original: string;
  hint: string;
  category: string;
  points: number;
}

export interface TeamScore {
  id: string;
  name: string;
  score: number;
  color: string;
}

// Bộ câu hỏi mẫu Hộp Quà Bí Mật
const PRESET_MYSTERY_BOXES: Omit<MysteryBox, 'id' | 'isOpen' | 'openedByTeam'>[] = [
  { question: 'Thủ đô của Việt Nam là gì?', points: 10, specialType: 'normal', explanation: 'Hà Nội là thủ đô của nước CHXHCN Việt Nam.' },
  { question: 'Virus có phải là sinh vật có cấu tạo tế bào không?', points: 15, specialType: 'normal', explanation: 'Virus chưa có cấu tạo tế bào hoàn chỉnh, chỉ gồm vỏ protein và vật chất di truyền.' },
  { question: '💣 HỘP BOM BÍ ẨN! Trả lời sai bị trừ 10 điểm. CPU là viết tắt của từ gì?', points: 20, specialType: 'bomb', explanation: 'Central Processing Unit (Bộ vi xử lý trung tâm).' },
  { question: '🌟 HỘP KIM CƯƠNG MAY MẮN! Tặng ngay 30 điểm cho đội nếu trả lời đúng: Nước sôi ở bao nhiêu độ C (áp suất chuẩn)?', points: 30, specialType: 'bonus', explanation: 'Nước tinh khiết sôi ở 100°C tại áp suất 1 atm.' },
  { question: 'Quy tắc 5K trong phòng chống dịch gồm những yếu tố nào?', points: 15, specialType: 'normal', explanation: 'Khẩu trang - Khử khuẩn - Khoảng cách - Không tụ tập - Khai báo y tế.' },
  { question: '✨ HỘP NHÂN ĐÔI ĐIỂM! Trả lời đúng nhận x2 điểm câu này (40 điểm): Tác giả bài thơ "Đoàn thuyền đánh cá" là ai?', points: 40, specialType: 'double', explanation: 'Nhà thơ Huy Cận sáng tác năm 1958.' },
  { question: 'Định luật I Newton còn được gọi là định luật gì?', points: 15, specialType: 'normal', explanation: 'Định luật Quán tính.' },
  { question: 'Trong kế toán, nguyên tắc cơ bản là: TỔNG TÀI SẢN luôn bằng gì?', points: 20, specialType: 'normal', explanation: 'Tổng Tài Sản = Nợ Phải Trả + Vốn Chủ Sở Hữu.' },
  { question: '🔄 HỘP HOÁN ĐỔI VỊ TRÍ! Trả lời đúng được hoán đổi điểm với đội dẫn đầu: DNA có cấu trúc xoắn kép do ai phát hiện?', points: 25, specialType: 'swap', explanation: 'James Watson và Francis Crick phát hiện năm 1953.' },
  { question: 'Kim loại nào dẫn điện tốt nhất ở điều kiện thường?', points: 15, specialType: 'normal', explanation: 'Bạc (Ag), sau đó đến Đồng (Cu), Vàng (Au) và Nhôm (Al).' },
  { question: 'Trong tiếng Anh, thì hiện tại hoàn thành dùng trợ động từ nào?', points: 10, specialType: 'normal', explanation: 'Have / Has + V3/ed.' },
  { question: 'Một tam giác có các góc là 60°, 60°, 60° là tam giác gì?', points: 10, specialType: 'normal', explanation: 'Tam giác đều.' }
];

// Bộ thẻ Lật Hình Ghi Nhớ mẫu
const PRESET_MEMORY_PAIRS = [
  { pairId: 'p1', concept: 'Photosynthesis', definition: 'Quang hợp: Cây xanh dùng ánh sáng mặt trời tổng hợp chất hữu cơ', color: '#10b981' },
  { pairId: 'p2', concept: 'Mitochondria', definition: 'Ti thể: Nhà máy năng lượng của tế bào, sản xuất ATP', color: '#f59e0b' },
  { pairId: 'p3', concept: 'Osmosis', definition: 'Thẩm thấu: Sự khuếch tán của phân tử nước qua màng bán thấm', color: '#06b6d4' },
  { pairId: 'p4', concept: 'Ecosystem', definition: 'Hệ sinh thái: Quần xã sinh vật và môi trường sống xung quanh', color: '#8b5cf6' },
  { pairId: 'p5', concept: 'Catalyst', definition: 'Chất xúc tác: Làm tăng tốc độ phản ứng mà không bị tiêu hao', color: '#ec4899' },
  { pairId: 'p6', concept: 'Newton', definition: 'Đơn vị đo lực trong hệ đo lường quốc tế SI (N)', color: '#3b82f6' }
];

// Bộ từ Giải Mã Đảo Chữ mẫu
const PRESET_SCRAMBLES: WordScramble[] = [
  { id: 'w1', scrambled: 'H-A-O-N-C-G-I', original: 'CON GÁI', hint: 'Từ chỉ giới tính nữ lúc còn trẻ tuổi', category: 'Tiếng Việt', points: 10 },
  { id: 'w2', scrambled: 'C-O-M-P-U-T-E-R', original: 'COMPUTER', hint: 'Thiết bị điện tử xử lý dữ liệu và tính toán', category: 'Tin Học', points: 15 },
  { id: 'w3', scrambled: 'Q-U-A-N-G-H-O-P', original: 'QUANG HỢP', hint: 'Hiện tượng lá cây hấp thụ CO2 thải Oxy dưới ánh nắng', category: 'Sinh Học', points: 20 },
  { id: 'w4', scrambled: 'G-I-A-O-D-U-C', original: 'GIÁO DỤC', hint: 'Quá trình truyền dạy và tiếp thu kiến thức nhân loại', category: 'Đời Sống', points: 15 },
  { id: 'w5', scrambled: 'D-I-E-N-T-H-O-A-I', original: 'ĐIỆN THOẠI', hint: 'Thiết bị liên lạc di động thông minh cầm tay', category: 'Công Nghệ', points: 10 }
];

const DEFAULT_TEAMS: TeamScore[] = [
  { id: 't1', name: 'Đội Rồng Đỏ 🐉', score: 0, color: '#ef4444' },
  { id: 't2', name: 'Đội Hổ Xanh 🐅', score: 0, color: '#3b82f6' },
  { id: 't3', name: 'Đội Phượng Hoàng 🦅', score: 0, color: '#f59e0b' },
  { id: 't4', name: 'Đội Sư Tử Vàng 🦁', score: 0, color: '#10b981' }
];

export default function TeachingGamesStudio() {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'boxes' | 'memory' | 'scramble' | 'lesson_plan'>('lesson_plan');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement | null>(null);

  // Scoreboard chung cho lớp học
  const [teams, setTeams] = useState<TeamScore[]>(DEFAULT_TEAMS);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('t1');

  // ---------- GAME 1: HỘP QUÀ BÍ MẬT (LUCKY BOXES) ----------
  const [boxes, setBoxes] = useState<MysteryBox[]>(() => 
    PRESET_MYSTERY_BOXES.map((b, idx) => ({ ...b, id: idx + 1, isOpen: false, openedByTeam: null }))
  );
  const [activeBox, setActiveBox] = useState<MysteryBox | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // ---------- GAME 2: LẬT HÌNH GHÉP ĐÔI (MEMORY MATCH) ----------
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([]);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryTimer, setMemoryTimer] = useState(0);
  const [isMemoryRunning, setIsMemoryRunning] = useState(false);

  // ---------- GAME 3: GIẢI MÃ ĐẢO CHỮ (WORD SCRAMBLE) ----------
  const [scrambles, setScrambles] = useState<WordScramble[]>(PRESET_SCRAMBLES);
  const [currentScrambleIdx, setCurrentScrambleIdx] = useState(0);
  const [userGuess, setUserGuess] = useState('');
  const [scrambleShowHint, setScrambleShowHint] = useState(false);
  const [scrambleSolved, setScrambleSolved] = useState(false);

  // ---------- TÍCH HỢP AI GENERATOR CHO TRÒ CHƠI ----------
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiSubject, setAiSubject] = useState('Chuyên ngành Cao đẳng / Đại học');
  const [aiBoxCount, setAiBoxCount] = useState(12);
  const [aiRawContent, setAiRawContent] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState('');

  // Export Iframe / HTML modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Audio Synthesizer
  const playSound = (type: 'open' | 'correct' | 'wrong' | 'flip' | 'victory' | 'bomb') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (type === 'flip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'open') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else if (type === 'correct') {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
        notes.forEach((freq, i) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.08);
          g.gain.setValueAtTime(0.12, audioCtx.currentTime + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.08 + 0.25);
          o.connect(g);
          g.connect(audioCtx.destination);
          o.start(audioCtx.currentTime + i * 0.08);
          o.stop(audioCtx.currentTime + i * 0.08 + 0.25);
        });
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(140, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (type === 'bomb') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } else if (type === 'victory') {
        const notes = [440, 554, 659, 880, 1108];
        notes.forEach((freq, idx) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
          g.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.4);
          o.connect(g);
          g.connect(audioCtx.destination);
          o.start(audioCtx.currentTime + idx * 0.1);
          o.stop(audioCtx.currentTime + idx * 0.1 + 0.4);
        });
      }
    } catch {}
  };

  // Khởi tạo thẻ Memory Match
  const initMemoryGame = () => {
    const rawCards: MemoryCard[] = [];
    PRESET_MEMORY_PAIRS.forEach(pair => {
      rawCards.push({
        id: `${pair.pairId}-c`,
        pairId: pair.pairId,
        text: pair.concept,
        type: 'concept',
        isFlipped: false,
        isMatched: false,
        color: pair.color
      });
      rawCards.push({
        id: `${pair.pairId}-d`,
        pairId: pair.pairId,
        text: pair.definition,
        type: 'definition',
        isFlipped: false,
        isMatched: false,
        color: pair.color
      });
    });

    // Xáo bài
    const shuffled = [...rawCards].sort(() => Math.random() - 0.5);
    setMemoryCards(shuffled);
    setFlippedCards([]);
    setMatchedPairsCount(0);
    setMemoryMoves(0);
    setMemoryTimer(0);
    setIsMemoryRunning(true);
  };

  useEffect(() => {
    initMemoryGame();
  }, []);

  // Timer cho Memory Match
  useEffect(() => {
    let interval: any = null;
    if (isMemoryRunning) {
      interval = setInterval(() => {
        setMemoryTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMemoryRunning]);

  // Xử lý Lật thẻ Memory
  const handleCardClick = (card: MemoryCard) => {
    if (!isMemoryRunning || card.isFlipped || card.isMatched || flippedCards.length >= 2) {
      return;
    }

    playSound('flip');
    const newCards = memoryCards.map(c => c.id === card.id ? { ...c, isFlipped: true } : c);
    setMemoryCards(newCards);

    const nextFlipped = [...flippedCards, card];
    setFlippedCards(nextFlipped);

    if (nextFlipped.length === 2) {
      setMemoryMoves(prev => prev + 1);
      const [c1, c2] = nextFlipped;

      if (c1.pairId === c2.pairId && c1.id !== c2.id) {
        // Đúng cặp
        setTimeout(() => {
          playSound('correct');
          setMemoryCards(prev => prev.map(c => c.pairId === c1.pairId ? { ...c, isMatched: true } : c));
          setFlippedCards([]);
          const newMatched = matchedPairsCount + 1;
          setMatchedPairsCount(newMatched);

          // Cộng điểm cho đội đang chọn
          adjustTeamScore(selectedTeamId, 15);
          showToast(`Chính xác! +15 điểm cho ${teams.find(t => t.id === selectedTeamId)?.name}`, 'success');

          if (newMatched === PRESET_MEMORY_PAIRS.length) {
            setIsMemoryRunning(false);
            playSound('victory');
            showToast('🎉 XUẤT SẮC! Đã hoàn thành thử thách Lật Thẻ!', 'success');
          }
        }, 600);
      } else {
        // Sai cặp
        setTimeout(() => {
          playSound('wrong');
          setMemoryCards(prev => prev.map(c => (c.id === c1.id || c.id === c2.id) ? { ...c, isFlipped: false } : c));
          setFlippedCards([]);
        }, 1200);
      }
    }
  };

  // Điều chỉnh điểm số của đội
  const adjustTeamScore = (teamId: string, delta: number) => {
    setTeams(prev => prev.map(t => {
      if (t.id === teamId) {
        return { ...t, score: Math.max(0, t.score + delta) };
      }
      return t;
    }));
  };

  // Mở hộp quà bí mật
  const handleOpenBox = (box: MysteryBox) => {
    if (box.isOpen) return;
    playSound('open');
    setActiveBox(box);
    setShowAnswer(false);
  };

  // Chấm điểm khi mở hộp bí mật
  const handleBoxResult = (isCorrect: boolean) => {
    if (!activeBox) return;

    const currentTeam = teams.find(t => t.id === selectedTeamId);
    const boxId = activeBox.id;

    if (isCorrect) {
      playSound('correct');
      let pointsWon = activeBox.points;

      if (activeBox.specialType === 'double') {
        showToast(`💥 X2 ĐIỂM! ${currentTeam?.name} nhận +${pointsWon} điểm!`, 'success');
      } else if (activeBox.specialType === 'bonus') {
        showToast(`💎 KIM CƯƠNG! ${currentTeam?.name} nhận +${pointsWon} điểm!`, 'success');
      } else if (activeBox.specialType === 'swap') {
        // Hoán đổi điểm với đội cao nhất
        const highestTeam = [...teams].sort((a, b) => b.score - a.score)[0];
        if (highestTeam && highestTeam.id !== selectedTeamId) {
          const oldScore = currentTeam?.score || 0;
          setTeams(prev => prev.map(t => {
            if (t.id === selectedTeamId) return { ...t, score: highestTeam.score };
            if (t.id === highestTeam.id) return { ...t, score: oldScore };
            return t;
          }));
          showToast(`🔄 HOÁN ĐỔI THÀNH CÔNG! Đổi điểm với ${highestTeam.name}!`, 'success');
        } else {
          adjustTeamScore(selectedTeamId, pointsWon);
        }
      } else {
        showToast(`Chính xác! +${pointsWon} điểm cho ${currentTeam?.name}`, 'success');
        adjustTeamScore(selectedTeamId, pointsWon);
      }
    } else {
      if (activeBox.specialType === 'bomb') {
        playSound('bomb');
        adjustTeamScore(selectedTeamId, -10);
        showToast(`💣 BÙM! Trúng bom trừ 10 điểm của ${currentTeam?.name}!`, 'error');
      } else {
        playSound('wrong');
        showToast(`Rất tiếc! Chưa có điểm trong câu này`, 'warning');
      }
    }

    // Đánh dấu hộp đã mở
    setBoxes(prev => prev.map(b => b.id === boxId ? { ...b, isOpen: true, openedByTeam: currentTeam?.name } : b));
    setActiveBox(null);
  };

  // Kiểm tra đáp án giải mã từ
  const handleCheckScramble = () => {
    const current = scrambles[currentScrambleIdx];
    const cleanedGuess = userGuess.trim().toUpperCase().replace(/[\s\-_]/g, '');
    const cleanedOriginal = current.original.trim().toUpperCase().replace(/[\s\-_]/g, '');

    if (cleanedGuess === cleanedOriginal) {
      playSound('correct');
      setScrambleSolved(true);
      adjustTeamScore(selectedTeamId, current.points);
      showToast(`🎉 XUẤT SẮC! Giải mã chính xác: ${current.original} (+${current.points} điểm)`, 'success');
    } else {
      playSound('wrong');
      showToast('Chưa đúng! Thử lại hoặc nhấn xem gợi ý', 'error');
    }
  };

  const handleNextScramble = () => {
    setUserGuess('');
    setScrambleShowHint(false);
    setScrambleSolved(false);
    if (currentScrambleIdx < scrambles.length - 1) {
      setCurrentScrambleIdx(currentScrambleIdx + 1);
    } else {
      setCurrentScrambleIdx(0);
      showToast('Đã hoàn thành vòng giải mã từ!', 'success');
    }
  };

  // Toàn màn hình
  const toggleFullscreen = () => {
    if (!gameContainerRef.current) return;
    if (!document.fullscreenElement) {
      gameContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Reset toàn bộ trò chơi
  const handleResetGame = () => {
    if (window.confirm('Bạn có chắc muốn làm mới lại dữ liệu và điểm số không?')) {
      setBoxes(PRESET_MYSTERY_BOXES.map((b, idx) => ({ ...b, id: idx + 1, isOpen: false, openedByTeam: null })));
      initMemoryGame();
      setTeams(DEFAULT_TEAMS);
      setCurrentScrambleIdx(0);
      setUserGuess('');
      setScrambleSolved(false);
      showToast('Đã làm mới dữ liệu trò chơi!', 'success');
    }
  };

  // Xuất file HTML độc lập nhúng LMS
  const generateStandaloneHtml = () => {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trò Chơi Tương Tác Giảng Dạy - RCHG Studio</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; padding: 20px; display: flex; flex-direction: column; align-items: center; }
    .game-wrapper { width: 100%; max-width: 900px; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { text-align: center; margin-bottom: 24px; }
    .title { font-size: 24px; font-weight: 800; color: #38bdf8; margin-bottom: 8px; }
    .grid-boxes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .box-card { background: #334155; border: 2px solid #475569; border-radius: 12px; padding: 24px 12px; text-align: center; font-size: 22px; font-weight: 800; cursor: pointer; transition: all 0.2s; color: #f8fafc; }
    .box-card:hover { transform: translateY(-4px); border-color: #38bdf8; background: #1e293b; }
    .box-card.opened { background: #0f172a; border-color: #10b981; color: #64748b; cursor: default; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal-content { background: #1e293b; border-radius: 16px; border: 1px solid #475569; width: 100%; max-width: 500px; padding: 24px; text-align: center; }
    .btn { padding: 10px 20px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; margin: 6px; }
    .btn-green { background: #10b981; color: white; }
    .btn-red { background: #ef4444; color: white; }
    .btn-blue { background: #38bdf8; color: #0f172a; }
  </style>
</head>
<body>
  <div class="game-wrapper">
    <div class="header">
      <h1 class="title">🎁 Hộp Quà Bí Mật Khởi Động Lớp Học</h1>
      <p style="color:#94a3b8;font-size:14px;">Chọn một hộp quà bất kỳ để mở thử thách và nhận điểm thưởng.</p>
    </div>
    <div class="grid-boxes" id="boxesGrid"></div>
  </div>

  <div class="modal-overlay" id="modal" style="display:none;">
    <div class="modal-content">
      <h2 id="modalBoxNumber" style="color:#38bdf8;margin-bottom:12px;">Hộp Quà</h2>
      <p id="modalQuestion" style="font-size:18px;margin-bottom:20px;line-height:1.5;"></p>
      <div id="answerSection" style="display:none;background:#0f172a;padding:12px;border-radius:8px;margin-bottom:16px;color:#34d399;font-weight:600;"></div>
      <button class="btn btn-blue" id="btnToggleAnswer" onclick="toggleAnswer()">Xem Đáp Án</button>
      <button class="btn btn-green" onclick="closeBox(true)">Trả Lời Đúng (+Điểm)</button>
      <button class="btn btn-red" onclick="closeBox(false)">Chưa Đúng</button>
    </div>
  </div>

  <script>
    const data = ${JSON.stringify(PRESET_MYSTERY_BOXES)};
    let activeIdx = -1;
    let opened = {};

    function render() {
      const container = document.getElementById('boxesGrid');
      container.innerHTML = '';
      data.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'box-card ' + (opened[idx] ? 'opened' : '');
        div.innerHTML = opened[idx] ? '✓' : (idx + 1);
        if (!opened[idx]) {
          div.onclick = () => openModal(idx);
        }
        container.appendChild(div);
      });
    }

    function openModal(idx) {
      activeIdx = idx;
      document.getElementById('modalBoxNumber').innerText = 'Hộp Quà Số ' + (idx + 1);
      document.getElementById('modalQuestion').innerText = data[idx].question;
      document.getElementById('answerSection').innerText = 'Đáp án: ' + data[idx].explanation;
      document.getElementById('answerSection').style.display = 'none';
      document.getElementById('btnToggleAnswer').innerText = 'Xem Đáp Án';
      document.getElementById('modal').style.display = 'flex';
    }

    function toggleAnswer() {
      const sec = document.getElementById('answerSection');
      if (sec.style.display === 'none') {
        sec.style.display = 'block';
        document.getElementById('btnToggleAnswer').innerText = 'Ẩn Đáp Án';
      } else {
        sec.style.display = 'none';
        document.getElementById('btnToggleAnswer').innerText = 'Xem Đáp Án';
      }
    }

    function closeBox(isCorrect) {
      if (activeIdx !== -1) {
        opened[activeIdx] = true;
      }
      document.getElementById('modal').style.display = 'none';
      render();
    }

    render();
  </script>
</body>
</html>`;
  };

  const generateIframeCode = () => {
    const html = generateStandaloneHtml();
    const utf8Bytes = new TextEncoder().encode(html);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 = btoa(binary);

    return `<!-- MA NHUNG TRO CHOI GIANG DAY LMS (CHUAN 16:9) -->
<div style="position:relative;width:100%;height:auto;aspect-ratio:16/9;margin:15px auto;background:#0f172a;border-radius:16px;overflow:hidden;box-shadow:0 12px 35px rgba(0,0,0,0.4);">
  <iframe 
    src="data:text/html;charset=utf-8;base64,${b64}" 
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;margin:0;padding:0;" 
    width="100%"
    height="100%"
    allow="fullscreen" 
    allowfullscreen="allowfullscreen">
  </iframe>
</div>
<!-- KET THUC MA NHUNG -->`;
  };

  const handleCopyIframe = async () => {
    try {
      await navigator.clipboard.writeText(generateIframeCode());
      setCopied(true);
      showToast('Đã sao chép mã nhúng Iframe!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Vui lòng copy thủ công', 'warning');
    }
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([generateStandaloneHtml()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tro-Choi-Giang-Day-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file HTML độc lập!', 'success');
  };

  // 6. Xử lý tạo Game bằng AI
  const handleGenerateAiGame = async () => {
    if (!aiTopic.trim()) {
      showToast('Vui lòng nhập chủ đề hoặc bài học cần tạo game.', 'warning');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/qa-wall?action=generate-interactive-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          subject: aiSubject.trim(),
          boxCount: aiBoxCount,
          rawContent: aiRawContent.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi gọi AI sinh trò chơi.');
      }

      const gameData = data.game;
      if (gameData?.mysteryBoxes?.length) {
        const newBoxes: MysteryBox[] = gameData.mysteryBoxes.map((b: any, idx: number) => ({
          id: idx + 1,
          question: b.question,
          points: b.points || 15,
          specialType: b.specialType || 'normal',
          explanation: b.explanation || '',
          isOpen: false,
          openedByTeam: null
        }));
        setBoxes(newBoxes);
      }

      if (gameData?.memoryPairs?.length) {
        const rawCards: MemoryCard[] = [];
        gameData.memoryPairs.forEach((pair: any) => {
          rawCards.push({
            id: `${pair.pairId}-c`,
            pairId: pair.pairId,
            text: pair.concept,
            type: 'concept',
            isFlipped: false,
            isMatched: false,
            color: pair.color || '#3b82f6'
          });
          rawCards.push({
            id: `${pair.pairId}-d`,
            pairId: pair.pairId,
            text: pair.definition,
            type: 'definition',
            isFlipped: false,
            isMatched: false,
            color: pair.color || '#3b82f6'
          });
        });
        const shuffled = [...rawCards].sort(() => Math.random() - 0.5);
        setMemoryCards(shuffled);
        setFlippedCards([]);
        setMatchedPairsCount(0);
      }

      if (gameData?.wordScrambles?.length) {
        setScrambles(gameData.wordScrambles);
        setCurrentScrambleIdx(0);
        setUserGuess('');
        setScrambleSolved(false);
      }

      showToast(`Đã dùng AI tạo thành công gói trò chơi cho chủ đề "${aiTopic}"!`, 'success');
      setShowAiModal(false);
      setActiveTab('boxes');
      playSound('victory');
    } catch (err: any) {
      alert(err.message || 'Không thể tạo trò chơi, vui lòng thử lại.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // 7. Đọc tệp giáo trình Word (.docx) hoặc Text (.txt) cho AI
  const handleUploadSyllabus = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedDocName(file.name);
    try {
      let content = '';
      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        const { default: mammoth } = await import('mammoth');
        const buffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer: buffer });
        content = res.value || '';
      } else {
        content = await file.text();
      }

      if (content.trim()) {
        setAiRawContent(content);
        const autoTopic = file.name.replace(/\.[^/.]+$/, '');
        if (!aiTopic) setAiTopic(autoTopic);
        showToast(`Đã đọc xong nội dung tệp "${file.name}"!`, 'success');
      }
    } catch (err: any) {
      alert('Lỗi đọc tài liệu: ' + (err.message || 'Thử lại.'));
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="teaching-games-page animate-fade-in" ref={gameContainerRef}>
      {/* Header */}
      <header className="tg-header">
        <div className="tg-title-group">
          <div className="tg-icon">
            <Gamepad2 size={28} />
          </div>
          <div>
            <h1 className="tg-title">Trò Chơi Giảng Dạy & Hoạt Náo Lớp Học (Classroom Games Studio)</h1>
            <p className="tg-subtitle">
              Tổ chức minigame khởi động bài học, củng cố kiến thức: Hộp quà bí mật, Lật hình ghép đôi và Giải mã đảo chữ tích hợp tính điểm theo đội.
            </p>
          </div>
        </div>

        <div className="tg-actions">
          <button 
            className="tg-btn tg-btn-outline" 
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>{soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</span>
          </button>

          <button 
            className="tg-btn" 
            style={{ 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', 
              color: 'white',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
            }}
            onClick={() => setShowAiModal(true)}
            title="Dùng AI tạo trò chơi từ giáo trình"
          >
            <Brain size={18} />
            <span>AI Tạo Trò Chơi</span>
          </button>

          <button 
            className="tg-btn tg-btn-outline"
            onClick={toggleFullscreen}
            title="Toàn màn hình trình chiếu"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            <span>{isFullscreen ? 'Thu nhỏ' : 'Trình chiếu'}</span>
          </button>

          <button 
            className="tg-btn tg-btn-outline"
            onClick={handleResetGame}
            title="Làm mới trò chơi"
          >
            <RotateCcw size={18} />
            <span>Làm mới</span>
          </button>

          <button 
            className="tg-btn tg-btn-primary"
            onClick={() => setShowExportModal(true)}
          >
            <Download size={18} />
            <span>Xuất Nhúng LMS</span>
          </button>
        </div>
      </header>

      {/* Bảng điểm đội nhóm (Gamification Teams) */}
      <section className="tg-scoreboard-card">
        <div className="tg-scoreboard-header">
          <div className="tg-sb-title">
            <Trophy size={20} className="text-warning" />
            <span>BẢNG ĐIỂM HOẠT ĐỘNG NHÓM (CHỌN ĐỘI ĐỂ CỘNG ĐIỂM)</span>
          </div>
          <span className="tg-sb-guide">Click vào thẻ đội để chọn đội đang trả lời</span>
        </div>

        <div className="tg-teams-grid">
          {teams.map(team => {
            const isSelected = team.id === selectedTeamId;
            return (
              <div 
                key={team.id} 
                className={`tg-team-card ${isSelected ? 'selected' : ''}`}
                style={{ borderColor: isSelected ? team.color : undefined }}
                onClick={() => setSelectedTeamId(team.id)}
              >
                <div className="tg-team-info">
                  <span className="tg-team-name">{team.name}</span>
                  <span className="tg-team-score" style={{ color: team.color }}>{team.score} đ</span>
                </div>
                <div className="tg-team-btns" onClick={e => e.stopPropagation()}>
                  <button className="tg-score-btn minus" onClick={() => adjustTeamScore(team.id, -5)}>-5</button>
                  <button className="tg-score-btn plus" onClick={() => adjustTeamScore(team.id, 5)}>+5</button>
                  <button className="tg-score-btn plus10" onClick={() => adjustTeamScore(team.id, 10)}>+10</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tabs chuyển đổi giữa Kế hoạch bài dạy và các trò chơi */}
      <div className="tg-tabs-nav">
        <button 
          className={`tg-tab-btn ${activeTab === 'lesson_plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('lesson_plan')}
        >
          <Calendar size={18} />
          <span>📋 Kế Hoạch Tổ Chức Tiết Học (Lesson Flow)</span>
        </button>

        <button 
          className={`tg-tab-btn ${activeTab === 'boxes' ? 'active' : ''}`}
          onClick={() => setActiveTab('boxes')}
        >
          <Sparkles size={18} />
          <span>1. Hộp Quà Bí Mật (Lucky Boxes)</span>
        </button>

        <button 
          className={`tg-tab-btn ${activeTab === 'memory' ? 'active' : ''}`}
          onClick={() => setActiveTab('memory')}
        >
          <BookOpen size={18} />
          <span>2. Lật Hình Ghép Đôi (Memory Match)</span>
        </button>

        <button 
          className={`tg-tab-btn ${activeTab === 'scramble' ? 'active' : ''}`}
          onClick={() => setActiveTab('scramble')}
        >
          <Zap size={18} />
          <span>3. Giải Mã Đảo Chữ (Word Scramble)</span>
        </button>
      </div>

      {/* NỘI DUNG TRÒ CHƠI & KẾ HOẠCH BÀI DẠY */}
      <main className="tg-game-content">
        {/* TAB 0: KẾ HOẠCH TỔ CHỨC TIẾT HỌC TỔNG THỂ */}
        {activeTab === 'lesson_plan' && (
          <div className="tg-tab-pane animate-fade-in">
            <div className="tg-pane-header">
              <div>
                <h2>Kế Hoạch Tổ Chức Hoạt Động Giảng Dạy & Trò Chơi Tương Tác</h2>
                <p>Kịch bản sư phạm 4 pha chuẩn hóa: Khởi động, Khám phá kiến thức, Luyện tập tương tác và Củng cố vinh danh.</p>
              </div>
              <div className="tg-plan-quick-stats">
                <span className="stat-pill"><Clock size={16} /> Thời lượng chuẩn: 45 - 90 Phút</span>
                <span className="stat-pill"><Trophy size={16} /> Phương pháp: Gamification</span>
              </div>
            </div>

            <div className="tg-lesson-flow-timeline">
              {/* Pha 1 */}
              <div className="tg-flow-step">
                <div className="step-indicator">
                  <div className="step-circle step-1">1</div>
                  <div className="step-line"></div>
                </div>
                <div className="step-content-card">
                  <div className="step-card-header">
                    <span className="step-phase-badge badge-p1">Pha 1: KHỞI ĐỘNG & BỐC THĂM (5 - 10 PHÚT)</span>
                    <span className="step-tool-badge">Tích hợp: Hộp Quà Bí Mật / Vòng Quay May Mắn</span>
                  </div>
                  <h3 className="step-title">Khơi Gợi Hứng Thú & Kiểm Tra Bài Cũ</h3>
                  <p className="step-desc">
                    Giáo viên chia lớp thành 4 đội (sử dụng bảng điểm gamification phía trên). Mời đại diện từng đội chọn ngẫu nhiên một hộp quà bí mật để trả lời câu hỏi khởi động hoặc bốc thăm người thuyết trình.
                  </p>
                  <div className="step-actions-bar">
                    <button className="tg-btn-sm" onClick={() => setActiveTab('boxes')}>
                      <Sparkles size={14} /> Mở trò chơi Hộp Quà Bí Mật
                    </button>
                    <a href="/vong-quay-lop-hoc" target="_blank" rel="noreferrer" className="tg-btn-sm">
                      <Play size={14} /> Mở Vòng Quay May Mắn
                    </a>
                  </div>
                </div>
              </div>

              {/* Pha 2 */}
              <div className="tg-flow-step">
                <div className="step-indicator">
                  <div className="step-circle step-2">2</div>
                  <div className="step-line"></div>
                </div>
                <div className="step-content-card">
                  <div className="step-card-header">
                    <span className="step-phase-badge badge-p2">Pha 2: KHÁM PHÁ KIẾN THỨC MỚI (15 - 20 PHÚT)</span>
                    <span className="step-tool-badge">Tích hợp: Trợ lý Hỏi Đáp PDF AI / Flashcards 3D</span>
                  </div>
                  <h3 className="step-title">Giảng Dạy & Trực Quan Hóa Khái Niệm Chuyên Ngành</h3>
                  <p className="step-desc">
                    Trình chiếu sơ đồ chú thích tương tác hoặc tóm tắt tài liệu giáo trình bằng AI. Học sinh theo dõi trên máy chiếu và đặt câu hỏi qua Bức tường câu hỏi ẩn danh nếu chưa hiểu bài.
                  </p>
                  <div className="step-actions-bar">
                    <a href="/hoi-dap-pdf-ai" target="_blank" rel="noreferrer" className="tg-btn-sm">
                      <FileText size={14} /> Mở Trợ Lý Hỏi Đáp PDF AI
                    </a>
                    <a href="/the-ghi-nho-flashcard" target="_blank" rel="noreferrer" className="tg-btn-sm">
                      <BookOpen size={14} /> Xem Thẻ Flashcards 3D
                    </a>
                    <a href="/buc-tuong-cau-hoi" target="_blank" rel="noreferrer" className="tg-btn-sm">
                      <HelpCircle size={14} /> Bức Tường Câu Hỏi Ẩn Danh
                    </a>
                  </div>
                </div>
              </div>

              {/* Pha 3 */}
              <div className="tg-flow-step">
                <div className="step-indicator">
                  <div className="step-circle step-3">3</div>
                  <div className="step-line"></div>
                </div>
                <div className="step-content-card">
                  <div className="step-card-header">
                    <span className="step-phase-badge badge-p3">Pha 3: LUYỆN TẬP TƯƠNG TÁC THEO NHÓM (15 - 20 PHÚT)</span>
                    <span className="step-tool-badge">Tích hợp: Lật Hình Ghép Đôi / Đảo Chữ / Đấu Trí Tia Chớp</span>
                  </div>
                  <h3 className="step-title">Thực Hành Nối Cặp Khái Niệm & Giải Mã Từ Khóa</h3>
                  <p className="step-desc">
                    Các đội thảo luận nhanh và cử đại diện lên bảng thực hiện thử thách Lật thẻ ghép đôi thuật ngữ hoặc gõ giải mã từ khóa xáo trộn. Tích hợp chuông bấm (Buzzer) để bấm chuông giành quyền trả lời thời gian thực.
                  </p>
                  <div className="step-actions-bar">
                    <button className="tg-btn-sm" onClick={() => setActiveTab('memory')}>
                      <BookOpen size={14} /> Mở Lật Hình Ghép Đôi
                    </button>
                    <button className="tg-btn-sm" onClick={() => setActiveTab('scramble')}>
                      <Zap size={14} /> Mở Giải Mã Đảo Chữ
                    </button>
                    <a href="/dong-ho-hoat-dong" target="_blank" rel="noreferrer" className="tg-btn-sm">
                      <Clock size={14} /> Đồng Hồ Hoạt Động & Chuông Bấm
                    </a>
                  </div>
                </div>
              </div>

              {/* Pha 4 */}
              <div className="tg-flow-step">
                <div className="step-indicator">
                  <div className="step-circle step-4">4</div>
                </div>
                <div className="step-content-card">
                  <div className="step-card-header">
                    <span className="step-phase-badge badge-p4">Pha 4: CỦNG CỐ & BẢNG VINH DANH (10 PHÚT)</span>
                    <span className="step-tool-badge">Tích hợp: Đấu Trường Live Quiz Battle / Bảng Vinh Danh</span>
                  </div>
                  <h3 className="step-title">Tổng Kết Điểm Số, Trao Huy Hiệu & Giao Bài Về Nhà</h3>
                  <p className="step-desc">
                    Tổ chức minigame trắc nghiệm Live Battle kiểu Kahoot để học sinh dùng điện thoại quét mã thi đua trực tiếp, sau đó công bố Top 1-2-3 lên Bục Vinh Danh và xuất mã nhúng bài tập về nhà lên LMS.
                  </p>
                  <div className="step-actions-bar">
                    <a href="/dau-truong-live" target="_blank" rel="noreferrer" className="tg-btn-sm">
                      <Flame size={14} /> Mở Đấu Trường Live Battle
                    </a>
                    <a href="/bang-vinh-danh" target="_blank" rel="noreferrer" className="tg-btn-sm">
                      <Trophy size={14} /> Chiếu Bảng Vinh Danh Top 1-2-3
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: HỘP QUÀ BÍ MẬT */}
        {activeTab === 'boxes' && (
          <div className="tg-tab-pane animate-fade-in">
            <div className="tg-pane-header">
              <div>
                <h2>Hộp Quà May Mắn & Thử Thách Bất Ngờ</h2>
                <p>12 chiếc hộp chứa câu hỏi ôn tập, hộp kim cương (+30đ), hộp nhân đôi điểm (x2) và hộp bom (-10đ)!</p>
              </div>
              <div className="tg-legend">
                <span className="legend-item"><Star size={14} color="#f59e0b" /> Kim Cương</span>
                <span className="legend-item"><Flame size={14} color="#ef4444" /> Bom Bí Ẩn</span>
                <span className="legend-item"><Shuffle size={14} color="#8b5cf6" /> Hoán Đổi</span>
              </div>
            </div>

            <div className="tg-boxes-grid">
              {boxes.map(box => (
                <div 
                  key={box.id} 
                  className={`tg-box-card ${box.isOpen ? 'opened' : ''} ${box.specialType || 'normal'}`}
                  onClick={() => handleOpenBox(box)}
                >
                  <div className="tg-box-inner">
                    <div className="tg-box-front">
                      <div className="tg-box-badge">#{box.id}</div>
                      <div className="tg-box-icon">🎁</div>
                      <span className="tg-box-title">Hộp Số {box.id}</span>
                    </div>
                    <div className="tg-box-back">
                      <Check size={28} className="text-success" />
                      <span className="opened-by">Đã mở</span>
                      {box.openedByTeam && <span className="opened-team">{box.openedByTeam}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: LẬT HÌNH GHÉP ĐÔI */}
        {activeTab === 'memory' && (
          <div className="tg-tab-pane animate-fade-in">
            <div className="tg-pane-header">
              <div>
                <h2>Lật Thẻ Ghi Nhớ & Nối Khái Niệm Chuyên Ngành</h2>
                <p>Lật mở các cặp thẻ tương ứng giữa Thuật ngữ tiếng Anh & Định nghĩa tiếng Việt để ghi điểm.</p>
              </div>
              <div className="tg-memory-stats">
                <span className="stat-pill"><Clock size={16} /> Thời gian: {memoryTimer}s</span>
                <span className="stat-pill"><Shuffle size={16} /> Lượt lật: {memoryMoves}</span>
                <span className="stat-pill"><Check size={16} /> Đã ghép: {matchedPairsCount}/{PRESET_MEMORY_PAIRS.length} cặp</span>
                <button className="tg-btn-sm" onClick={initMemoryGame}>
                  <RotateCcw size={14} /> Xáo lại bài
                </button>
              </div>
            </div>

            <div className="tg-memory-grid">
              {memoryCards.map(card => {
                const isFlipped = card.isFlipped || card.isMatched;
                return (
                  <div 
                    key={card.id} 
                    className={`tg-memory-card ${isFlipped ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
                    onClick={() => handleCardClick(card)}
                  >
                    <div className="tg-memory-inner">
                      <div className="tg-memory-front">
                        <Award size={32} />
                        <span>LẬT THẺ</span>
                      </div>
                      <div className="tg-memory-back" style={{ borderTop: `4px solid ${card.color || '#3b82f6'}` }}>
                        <span className="card-badge">{card.type === 'concept' ? 'Thuật ngữ' : 'Định nghĩa'}</span>
                        <p className="card-text">{card.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: GIẢI MÃ ĐẢO CHỮ */}
        {activeTab === 'scramble' && (
          <div className="tg-tab-pane animate-fade-in">
            <div className="tg-pane-header">
              <div>
                <h2>Giải Mã Đảo Chữ Bí Ẩn (Word Scramble Challenge)</h2>
                <p>Quan sát các chữ cái bị xáo trộn và gợi ý để ghép lại thành từ khóa hoàn chỉnh.</p>
              </div>
              <span className="tg-level-badge">Câu {currentScrambleIdx + 1} / {scrambles.length}</span>
            </div>

            <div className="tg-scramble-arena">
              {scrambles[currentScrambleIdx] && (
                <div className="tg-scramble-card">
                  <div className="scramble-meta">
                    <span className="category-tag">{scrambles[currentScrambleIdx].category}</span>
                    <span className="points-tag">+{scrambles[currentScrambleIdx].points} Điểm</span>
                  </div>

                  {/* Ký tự xáo trộn */}
                  <div className="scramble-letters-box">
                    {scrambles[currentScrambleIdx].scrambled.split('-').map((letter, i) => (
                      <span key={i} className="letter-tile animate-bounce-in" style={{ animationDelay: `${i * 0.05}s` }}>
                        {letter}
                      </span>
                    ))}
                  </div>

                  {/* Gợi ý */}
                  <div className="scramble-hint-box">
                    <button 
                      className="hint-toggle-btn"
                      onClick={() => setScrambleShowHint(!scrambleShowHint)}
                    >
                      <HelpCircle size={18} />
                      <span>{scrambleShowHint ? 'Ẩn gợi ý' : 'Bấm xem gợi ý bí mật'}</span>
                    </button>
                    {scrambleShowHint && (
                      <p className="hint-content animate-fade-in">
                        💡 <strong>Gợi ý:</strong> {scrambles[currentScrambleIdx].hint}
                      </p>
                    )}
                  </div>

                  {/* Ô nhập đáp án */}
                  <div className="scramble-input-group">
                    <input 
                      type="text"
                      className="scramble-input"
                      placeholder="Nhập từ khóa đã giải mã..."
                      value={userGuess}
                      onChange={e => setUserGuess(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCheckScramble(); }}
                      disabled={scrambleSolved}
                    />
                    {!scrambleSolved ? (
                      <button className="tg-btn tg-btn-primary" onClick={handleCheckScramble}>
                        <Check size={18} />
                        <span>Kiểm Tra</span>
                      </button>
                    ) : (
                      <button className="tg-btn tg-btn-success" onClick={handleNextScramble}>
                        <span>Câu Tiếp Theo</span>
                        <Play size={18} />
                      </button>
                    )}
                  </div>

                  {scrambleSolved && (
                    <div className="solved-alert animate-fade-in">
                      <Check size={24} />
                      <span>Chính xác! Đáp án đúng là: <strong>{scrambles[currentScrambleIdx].original}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL CÂU HỎI HỘP BÍ MẬT */}
      {activeBox && (
        <div className="tg-modal-overlay animate-fade-in" onClick={() => setActiveBox(null)}>
          <div className="tg-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <span className="box-badge">HỘP SỐ {activeBox.id}</span>
                <span className="points-badge">+{activeBox.points} ĐIỂM</span>
                {activeBox.specialType === 'bomb' && <span className="type-badge bomb">💣 HỘP BOM</span>}
                {activeBox.specialType === 'bonus' && <span className="type-badge bonus">🌟 KIM CƯƠNG</span>}
                {activeBox.specialType === 'double' && <span className="type-badge double">✨ NHÂN ĐÔI</span>}
                {activeBox.specialType === 'swap' && <span className="type-badge swap">🔄 HOÁN ĐỔI</span>}
              </div>
              <button className="modal-close" onClick={() => setActiveBox(null)}>×</button>
            </div>

            <div className="modal-body">
              <h3 className="modal-question">{activeBox.question}</h3>

              {showAnswer ? (
                <div className="modal-answer-box animate-fade-in">
                  <span className="answer-label">Đáp án giải thích:</span>
                  <p className="answer-text">{activeBox.explanation || 'Không có giải thích thêm.'}</p>
                </div>
              ) : (
                <button className="tg-btn tg-btn-outline" onClick={() => setShowAnswer(true)}>
                  <Eye size={18} />
                  <span>Hiển thị đáp án</span>
                </button>
              )}
            </div>

            <div className="modal-footer">
              <div className="awarding-team">
                <span>Cộng điểm cho: </span>
                <strong>{teams.find(t => t.id === selectedTeamId)?.name}</strong>
              </div>
              <div className="footer-btns">
                <button className="tg-btn tg-btn-danger" onClick={() => handleBoxResult(false)}>
                  Chưa Đúng
                </button>
                <button className="tg-btn tg-btn-success" onClick={() => handleBoxResult(true)}>
                  <Check size={18} />
                  Chính Xác (+Điểm)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XUẤT NHÚNG LMS */}
      {showExportModal && (
        <div className="tg-modal-overlay animate-fade-in" onClick={() => setShowExportModal(false)}>
          <div className="tg-modal-card export-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xuất Bản Trò Chơi Giảng Dạy Lên LMS</h3>
              <button className="modal-close" onClick={() => setShowExportModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <p className="export-desc">
                Nhúng trực tiếp minigame này vào Moodle, Canvas, Google Classroom hoặc bài giảng điện tử không cần server!
              </p>

              <div className="export-code-box">
                <div className="code-header">
                  <span>MÃ NHÚNG IFRAME (HTML5 CHUẨN 16:9)</span>
                  <button className="copy-btn" onClick={handleCopyIframe}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép mã'}</span>
                  </button>
                </div>
                <textarea 
                  className="code-textarea"
                  readOnly
                  rows={6}
                  value={generateIframeCode()}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="tg-btn tg-btn-outline" onClick={() => setShowExportModal(false)}>
                Đóng
              </button>
              <button className="tg-btn tg-btn-primary" onClick={handleDownloadHtml}>
                <Download size={18} />
                <span>Tải File .HTML Độc Lập</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AI SOẠN TRÒ CHƠI TỰ ĐỘNG TỪ GIÁO TRÌNH */}
      {showAiModal && (
        <div className="tg-modal-overlay animate-fade-in" onClick={() => !isGeneratingAi && setShowAiModal(false)}>
          <div className="tg-modal-card" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Brain size={22} className="text-primary" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  AI Soạn Bộ Trò Chơi Tương Tác Lớp Học
                </h3>
              </div>
              {!isGeneratingAi && (
                <button className="modal-close" onClick={() => setShowAiModal(false)}>×</button>
              )}
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Gemini AI sẽ tự động phân tích bài học và sinh trọn bộ: <strong>Hộp Quà Bí Mật</strong> (có bom, kim cương, x2 điểm), <strong>Thẻ Lật Ghép Đôi Thuật Ngữ</strong> và <strong>Đảo Chữ Chuyên Ngành</strong>.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Tên môn học / Chuyên ngành:
                </label>
                <input 
                  type="text"
                  className="code-textarea"
                  style={{ height: 'auto', padding: '0.6rem 0.8rem', resize: 'none' }}
                  value={aiSubject}
                  onChange={e => setAiSubject(e.target.value)}
                  placeholder="Ví dụ: Lập trình Web, Dược lý học, Quản trị mạng, Kế toán..."
                  disabled={isGeneratingAi}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Bài học / Chủ đề trò chơi (*):
                </label>
                <input 
                  type="text"
                  className="code-textarea"
                  style={{ height: 'auto', padding: '0.6rem 0.8rem', resize: 'none' }}
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  placeholder="Ví dụ: Kiến trúc máy tính, Thuật toán sắp xếp, Pháp luật đại cương..."
                  disabled={isGeneratingAi}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Số lượng hộp quà bí mật:
                  </label>
                  <select 
                    className="code-textarea"
                    style={{ height: 'auto', padding: '0.6rem 0.8rem', resize: 'none' }}
                    value={aiBoxCount}
                    onChange={e => setAiBoxCount(Number(e.target.value))}
                    disabled={isGeneratingAi}
                  >
                    <option value={8}>8 Hộp (Tiết ngắn 45p)</option>
                    <option value={12}>12 Hộp (Chuẩn 2 tiết)</option>
                    <option value={16}>16 Hộp (Quy mô lớp lớn)</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Tải giáo trình (Word / Text):
                  </label>
                  <label 
                    className="tg-btn tg-btn-outline" 
                    style={{ width: '100%', justifyContent: 'center', cursor: isGeneratingAi ? 'not-allowed' : 'pointer' }}
                  >
                    <Upload size={16} />
                    <span>{uploadedDocName ? 'Đổi tệp khác' : 'Chọn tệp...'}</span>
                    <input 
                      type="file" 
                      style={{ display: 'none' }} 
                      accept=".docx,.doc,.txt"
                      onChange={handleUploadSyllabus}
                      disabled={isGeneratingAi}
                    />
                  </label>
                </div>
              </div>

              {uploadedDocName && (
                <div style={{ fontSize: '0.825rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem 0.8rem', borderRadius: 6 }}>
                  ✓ Đã nạp tài liệu: <strong>{uploadedDocName}</strong> ({aiRawContent.length} ký tự)
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button 
                className="tg-btn tg-btn-outline" 
                onClick={() => setShowAiModal(false)}
                disabled={isGeneratingAi}
              >
                Hủy bỏ
              </button>
              
              <button 
                className="tg-btn" 
                style={{ 
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', 
                  color: 'white',
                  fontWeight: 600,
                  boxShadow: '0 2px 10px rgba(139, 92, 246, 0.4)'
                }}
                onClick={handleGenerateAiGame}
                disabled={isGeneratingAi || !aiTopic.trim()}
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span>AI Đang Soạn Trò Chơi (10s)...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    <span>Tạo Trò Chơi Ngay Bằng AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

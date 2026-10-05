import { useState, useEffect, useRef } from 'react';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Code, 
  Download, 
  Sparkles, 
  Trophy, 
  Radio, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  Flame,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './ClassroomActivityTimer.css';

interface TeamItem {
  id: string;
  name: string;
  score: number;
  color: string;
  keyShort: string;
}

interface ActivityPreset {
  id: string;
  name: string;
  duration: number; // in seconds
  phaseTitle: string;
  desc: string;
  category: string;
}

const PRESET_ACTIVITIES: ActivityPreset[] = [
  {
    id: 'group-discussion-5m',
    name: 'Thảo luận nhóm 5 phút',
    duration: 300,
    phaseTitle: 'Thời Gian Thảo Luận Nhóm Chuyên Sâu',
    desc: 'Các nhóm phối hợp phân tích tình huống bệnh án / hạch toán nghiệp vụ và thống nhất giải pháp.',
    category: 'Thảo Luận'
  },
  {
    id: 'blitz-quiz-30s',
    name: 'Đấu trí tia chớp 30s',
    duration: 30,
    phaseTitle: 'Bấm Chuông Giành Quyền Trả Lời Tia Chớp',
    desc: '30 giây bấm chuông nhanh trả lời từ vựng tiếng Anh chuyên ngành hoặc mã linh kiện cơ khí.',
    category: 'Đấu Trí'
  },
  {
    id: 'case-study-3m',
    name: 'Xử lý tình huống 3 phút',
    duration: 180,
    phaseTitle: 'Giải Quyết Sự Cố Khách Hàng / Cấp Cứu Ban Đầu',
    desc: 'Các đội đóng vai phân tích phương án phản ứng nhanh theo quy trình SOP.',
    category: 'Thực Hành'
  },
  {
    id: 'mini-game-60s',
    name: 'Thử thách 60 giây (1 phút)',
    duration: 60,
    phaseTitle: 'Vòng Đối Đầu 60 Giây Bứt Phá Điểm Số',
    desc: 'Tính nhanh định khoản kế toán hoặc liệt kê các bước pha chế cocktail trước khi hết giờ.',
    category: 'Khởi Động'
  },
  {
    id: 'presentation-2m',
    name: 'Thuyết trình 2 phút (Elevator Pitch)',
    duration: 120,
    phaseTitle: 'Đại Diện Nhóm Báo Cáo Sản Phẩm',
    desc: 'Trình bày súc tích giải pháp thiết kế hoặc kết quả bài tập nhóm trong đúng 2 phút.',
    category: 'Thuyết Trình'
  }
];

const DEFAULT_TEAMS: TeamItem[] = [
  { id: 't1', name: 'Đội Đỏ (Red Star)', score: 0, color: '#ef4444', keyShort: '1' },
  { id: 't2', name: 'Đội Xanh (Blue Sky)', score: 0, color: '#3b82f6', keyShort: '2' },
  { id: 't3', name: 'Đội Vàng (Golden Sun)', score: 0, color: '#f59e0b', keyShort: '3' },
  { id: 't4', name: 'Đội Xanh Lá (Emerald)', score: 0, color: '#10b981', keyShort: '4' }
];

export default function ClassroomActivityTimer() {
  const { showToast } = useNotification();

  const [selectedPresetId, setSelectedPresetId] = useState<string>('group-discussion-5m');
  const [totalSeconds, setTotalSeconds] = useState<number>(300);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [phaseTitle, setPhaseTitle] = useState<string>('Thời Gian Thảo Luận Nhóm Chuyên Sâu');
  const [phaseDesc, setPhaseDesc] = useState<string>('Các nhóm phối hợp phân tích tình huống bệnh án / hạch toán nghiệp vụ và thống nhất giải pháp.');

  // Teams & Buzzer state
  const [teams, setTeams] = useState<TeamItem[]>(DEFAULT_TEAMS);
  const [buzzerWinner, setBuzzerWinner] = useState<TeamItem | null>(null);
  const [buzzerLocked, setBuzzerLocked] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // New team form
  const [newTeamName, setNewTeamName] = useState<string>('');

  // Modal
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Interval timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerCardRef = useRef<HTMLDivElement | null>(null);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (timerCardRef.current?.requestFullscreen) {
          await timerCardRef.current.requestFullscreen();
        } else if ((timerCardRef.current as any)?.webkitRequestFullscreen) {
          await (timerCardRef.current as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any)?.webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      showToast('Trình duyệt chặn mở toàn màn hình', 'warning');
    }
  };

  // Web Audio Context Synthesizer
  const playBeep = (freq: number = 600, duration: number = 0.1, type: OscillatorType = 'triangle') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {}
  };

  const playBuzzerSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + idx * 0.08 + 0.25);
      });
    } catch {}
  };

  const playTimesUpSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      [587.33, 440, 349.23, 293.66].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.16);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.16 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.16);
        osc.stop(audioCtx.currentTime + idx * 0.16 + 0.4);
      });
    } catch {}
  };

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playTimesUpSound();
            showToast('HẾT GIỜ! Xin mời các nhóm dừng bút và báo cáo!', 'warning');
            return 0;
          }
          if (prev <= 6 && prev > 1) {
            playBeep(880, 0.08, 'sine');
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled]);

  // Keyboard shortcut listener for Buzzers (Phím 1, 2, 3, 4...)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const targetTeam = teams.find(t => t.keyShort === e.key);
      if (targetTeam && !buzzerLocked) {
        handlePressBuzzer(targetTeam);
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [teams, buzzerLocked, isRunning]);

  const toggleTimer = () => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(totalSeconds);
    }
    setIsRunning(prev => !prev);
    playBeep(520, 0.1);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
    playBeep(350, 0.1);
  };

  const handleSelectPreset = (p: ActivityPreset) => {
    setSelectedPresetId(p.id);
    setTotalSeconds(p.duration);
    setRemainingSeconds(p.duration);
    setPhaseTitle(p.phaseTitle);
    setPhaseDesc(p.desc);
    setIsRunning(false);
    showToast(`Đã nạp mẫu: ${p.name}`, 'info');
  };

  const handleQuickAddSeconds = (secs: number) => {
    setTotalSeconds(prev => prev + secs);
    setRemainingSeconds(prev => prev + secs);
    showToast(`Đã cộng thêm ${secs}s`, 'success');
  };

  // Buzzer actions
  const handlePressBuzzer = (team: TeamItem) => {
    if (buzzerLocked) return;
    setBuzzerWinner(team);
    setBuzzerLocked(true);
    playBuzzerSound();
    showToast(`🎉 ${team.name} ĐÃ BẤM CHUÔNG ĐẦU TIÊN!`, 'success');
  };

  const handleResetBuzzer = () => {
    setBuzzerWinner(null);
    setBuzzerLocked(false);
    playBeep(400, 0.08);
  };

  // Scoreboard actions
  const handleScoreChange = (teamId: string, delta: number) => {
    setTeams(prev => prev.map(t => {
      if (t.id === teamId) {
        const nextScore = Math.max(0, t.score + delta);
        return { ...t, score: nextScore };
      }
      return t;
    }));
    playBeep(delta > 0 ? 660 : 330, 0.08);
  };

  const handleAddTeam = () => {
    const name = newTeamName.trim();
    if (!name) return;
    const colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316'];
    const newTeam: TeamItem = {
      id: `team-${Date.now()}`,
      name,
      score: 0,
      color: colors[teams.length % colors.length],
      keyShort: String(teams.length + 1)
    };
    setTeams(prev => [...prev, newTeam]);
    setNewTeamName('');
    showToast(`Đã thêm đội: "${name}"`, 'success');
  };

  const handleDeleteTeam = (id: string) => {
    if (teams.length <= 2) {
      showToast('Nên duy trì ít nhất 2 đội thi!', 'warning');
      return;
    }
    setTeams(prev => prev.filter(t => t.id !== id));
  };

  // Formatting mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  const isDangerTime = remainingSeconds <= 10 && remainingSeconds > 0;
  const isWarningTime = remainingSeconds <= 30 && remainingSeconds > 10;

  // Standalone HTML Generator for LMS (Canvas, Moodle, Google Sites)
  const generateStandaloneHtml = () => {
    const teamsData = JSON.stringify(teams);
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${phaseTitle || 'Đồng Hồ Hoạt Động & Chuông Bấm Đấu Trí'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; padding: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .wrapper { width: 100%; max-width: 840px; background: #1e293b; border-radius: 20px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 25px 50px rgba(0,0,0,0.6); }
    .header { padding: 18px 24px; background: #182234; border-bottom: 1px solid #334155; text-align: center; }
    .title { font-size: 20px; font-weight: 700; color: #38bdf8; margin-bottom: 4px; }
    .desc { font-size: 13.5px; color: #94a3b8; }
    .content { padding: 24px; }
    .timer-box { background: #0b1120; border-radius: 16px; padding: 24px; text-align: center; border: 2px solid #334155; margin-bottom: 20px; position: relative; }
    .timer-box:fullscreen { width: 100vw; height: 100vh; border-radius: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; box-sizing: border-box; }
    .timer-box:fullscreen .digits { font-size: min(20vw, 160px); margin: 20px 0; }
    .timer-box:fullscreen .track { max-width: 900px; height: 14px; }
    .digits { font-family: monospace; font-size: 64px; font-weight: 900; letter-spacing: 2px; color: #f8fafc; }
    .digits.danger { color: #ef4444; }
    .digits.warning { color: #f59e0b; }
    .fs-btn { position: absolute; top: 12px; right: 12px; background: #1e293b; border: 1px solid #475569; color: #94a3b8; border-radius: 8px; width: 34px; height: 34px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; }
    .fs-btn:hover { background: #38bdf8; color: #0f172a; }
    .track { width: 100%; height: 8px; background: #1e293b; border-radius: 99px; margin-top: 16px; overflow: hidden; }
    .fill { height: 100%; background: linear-gradient(90deg, #10b981, #38bdf8); transition: width 0.25s linear; }
    .timer-ctrls { display: flex; justify-content: center; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
    .btn { padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; border: none; }
    .btn-main { background: #38bdf8; color: #0f172a; }
    .btn-reset { background: transparent; border: 1px solid #475569; color: #cbd5e1; }
    .buzzer-box { background: #0f172a; border-radius: 14px; padding: 16px; border: 1px solid #334155; }
    .buzzer-title { font-size: 14px; font-weight: 700; color: #cbd5e1; margin-bottom: 12px; text-align: center; }
    .buzzer-winner { background: rgba(239, 68, 68, 0.2); border: 2px dashed #ef4444; padding: 12px; border-radius: 10px; margin-bottom: 12px; text-align: center; font-weight: 700; font-size: 16px; color: #fca5a5; display: none; }
    .buzzer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
    .buzzer-btn { padding: 16px; border-radius: 12px; border: none; font-weight: 700; color: #fff; cursor: pointer; text-align: center; font-size: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: transform 0.1s; }
    .buzzer-btn:active { transform: scale(0.95); }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="title">${phaseTitle}</div>
      <div class="desc">${phaseDesc}</div>
    </div>
    <div class="content">
      <div class="timer-box" id="timerBox">
        <button class="fs-btn" onclick="toggleFs()" title="Toàn màn hình">⛶</button>
        <div class="digits" id="timeDigits">${formatTime(totalSeconds)}</div>
        <div class="track">
          <div class="fill" id="trackFill" style="width: 0%;"></div>
        </div>
        <div class="timer-ctrls">
          <button class="btn btn-main" id="startBtn" onclick="toggleTimer()">Bắt Đầu / Tạm Dừng (Space)</button>
          <button class="btn btn-reset" onclick="resetTimer()">Đặt Lại</button>
          <button class="btn btn-reset" onclick="toggleFs()">⛶ Toàn Màn Hình</button>
        </div>
      </div>

      <div class="buzzer-box">
        <div class="buzzer-title">🚨 Bấm Chuông Giành Quyền Trả Lời (Nhấp hoặc bấm phím số 1, 2, 3, 4...)</div>
        <div class="buzzer-winner" id="winnerBox"></div>
        <div class="buzzer-grid" id="buzzerGrid"></div>
        <div style="text-align:center;margin-top:12px;">
          <button class="btn btn-reset" onclick="resetBuzzer()" style="font-size:12px;padding:6px 14px;">Mở Lại Chuông</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const TEAMS = ${teamsData};
    let totalSecs = ${totalSeconds};
    let remSecs = ${totalSeconds};
    let isRunning = false;
    let timerId = null;
    let winner = null;

    function renderBuzzer() {
      const grid = document.getElementById('buzzerGrid');
      grid.innerHTML = '';
      TEAMS.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'buzzer-btn';
        btn.style.background = t.color;
        btn.innerHTML = t.name + '<br><small style="opacity:0.8;font-size:11px;">(Phím ' + t.keyShort + ')</small>';
        btn.onclick = () => pressBuzzer(t);
        grid.appendChild(btn);
      });
    }

    function playTone(freq, dur) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.1, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + dur);
      } catch(e){}
    }

    function toggleTimer() {
      isRunning = !isRunning;
      if (isRunning) {
        if (remSecs === 0) remSecs = totalSecs;
        timerId = setInterval(() => {
          if (remSecs <= 1) {
            clearInterval(timerId);
            isRunning = false;
            remSecs = 0;
            updateUI();
            playTone(280, 0.6);
            alert('HẾT GIỜ!');
            return;
          }
          remSecs--;
          if (remSecs <= 5) playTone(880, 0.08);
          updateUI();
        }, 1000);
      } else {
        clearInterval(timerId);
      }
      playTone(520, 0.1);
      updateUI();
    }

    function resetTimer() {
      isRunning = false;
      clearInterval(timerId);
      remSecs = totalSecs;
      updateUI();
    }

    function updateUI() {
      const m = Math.floor(remSecs / 60).toString().padStart(2, '0');
      const s = (remSecs % 60).toString().padStart(2, '0');
      const digits = document.getElementById('timeDigits');
      digits.innerText = m + ':' + s;
      digits.className = 'digits' + (remSecs <= 10 ? ' danger' : (remSecs <= 30 ? ' warning' : ''));

      const pct = ((totalSecs - remSecs) / totalSecs) * 100;
      document.getElementById('trackFill').style.width = pct + '%';
    }

    function pressBuzzer(team) {
      if (winner) return;
      winner = team;
      const box = document.getElementById('winnerBox');
      box.innerText = '🎉 ' + team.name + ' ĐÃ BẤM CHUÔNG ĐẦU TIÊN!';
      box.style.display = 'block';
      playTone(660, 0.3);
    }

    function resetBuzzer() {
      winner = null;
      document.getElementById('winnerBox').style.display = 'none';
      playTone(400, 0.08);
    }

    function toggleFs() {
      const box = document.getElementById('timerBox');
      if (!document.fullscreenElement) {
        if (box.requestFullscreen) box.requestFullscreen();
        else if (box.webkitRequestFullscreen) box.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); toggleTimer(); }
      const t = TEAMS.find(x => x.keyShort === e.key);
      if (t) pressBuzzer(t);
    });

    renderBuzzer();
    updateUI();
  </script>
</body>
</html>`;
  };

  const handleExportHtml = () => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dong-ho-hoat-dong-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file HTML Đồng Hồ Đếm Ngược & Chuông Bấm!', 'success');
  };

  const generateIframeCode = () => {
    const html = generateStandaloneHtml();
    const utf8Bytes = new TextEncoder().encode(html);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 = btoa(binary);

    return `<!-- MA NHUNG DONG HO HOAT DONG & BUZZER CHO LMS -->
<div style="position:relative;width:100%;max-width:880px;margin:15px auto;padding-top:72%;background:#0f172a;border-radius:16px;overflow:hidden;box-shadow:0 12px 35px rgba(0,0,0,0.4);">
  <iframe 
    src="data:text/html;charset=utf-8;base64,${b64}" 
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;margin:0;padding:0;" 
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

  return (
    <div className="buzzer-timer-page animate-fade-in">
      {/* Header */}
      <header className="bt-header">
        <div className="bt-title-group">
          <div className="bt-icon">
            <Flame size={28} />
          </div>
          <div>
            <h1 className="bt-title">Đồng Hồ Hoạt Động & Chuông Bấm Đấu Trí (Classroom Timer & Buzzer)</h1>
            <p className="bt-subtitle">
              Đồng hồ đếm ngược thảo luận nhóm, thi tình huống tia chớp và chuông bấm giành quyền trả lời thời gian thực.
            </p>
          </div>
        </div>

        <div className="bt-actions">
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 size={16} color="var(--primary)" /> : <VolumeX size={16} color="var(--danger)" />}
            <span>{soundEnabled ? 'Âm thanh: BẬT' : 'Âm thanh: TẮT'}</span>
          </button>
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
            onClick={() => setShowExportModal(true)}
          >
            <Code size={16} /> Lấy Mã Nhúng Iframe
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={handleExportHtml}
            style={{ background: '#10b981', border: 'none' }}
          >
            <Download size={16} /> Tải Tệp HTML
          </button>
        </div>
      </header>

      {/* Presets Bar */}
      <div className="bt-presets-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <Sparkles size={16} color="var(--primary)" /> Mẫu hoạt động lớp học:
        </div>
        <div className="bt-presets-chips">
          {PRESET_ACTIVITIES.map(p => (
            <button
              key={p.id}
              type="button"
              className={`bt-preset-chip ${selectedPresetId === p.id ? 'active' : ''}`}
              onClick={() => handleSelectPreset(p)}
            >
              <span>[{p.category}]</span> {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="bt-main-grid">
        {/* Left Column: Timer & Buzzer Arena */}
        <div className="bt-arena-panel">
          {/* Timer Card */}
          <div 
            ref={timerCardRef}
            className={`bt-timer-card ${isDangerTime ? 'danger' : ''} ${isFullscreen ? 'is-fullscreen' : ''}`}
          >
            {/* Nút Toàn màn hình góc trên bên phải */}
            <button 
              type="button" 
              className="bt-fullscreen-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Thu nhỏ lại (Esc)' : 'Mở rộng toàn màn hình cho máy chiếu'}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>

            <div className="bt-timer-phase-title">{phaseTitle}</div>
            <div className="bt-timer-desc">{phaseDesc}</div>

            <div className={`bt-time-digits ${isDangerTime ? 'danger' : (isWarningTime ? 'warning' : '')}`}>
              {formatTime(remainingSeconds)}
            </div>

            {/* Progress track */}
            <div className="bt-progress-track">
              <div 
                className={`bt-progress-fill ${isDangerTime || isWarningTime ? 'warning' : ''}`} 
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Điều khiển khi ở chế độ Fullscreen máy chiếu */}
            {isFullscreen && (
              <div className="bt-fullscreen-ctrls animate-fade-in">
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={toggleTimer}
                  style={{ minWidth: '180px', fontSize: '1.1rem', padding: '0.85rem 1.75rem' }}
                >
                  {isRunning ? <><Pause size={20} /> Tạm Dừng</> : <><Play size={20} /> Bắt Đầu (Space)</>}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={handleResetTimer}
                  style={{ color: '#fff', borderColor: '#475569', padding: '0.85rem 1.5rem', fontSize: '1.05rem' }}
                >
                  <RotateCcw size={18} /> Đặt Lại
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={toggleFullscreen}
                  style={{ color: '#94a3b8', borderColor: '#334155', padding: '0.85rem 1.25rem' }}
                >
                  <Minimize2 size={18} /> Thoát Toàn Màn Hình
                </button>
              </div>
            )}
          </div>

          {/* Quick Add Time */}
          <div className="bt-quick-seconds">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center', fontWeight: 600 }}>
              Cộng nhanh:
            </span>
            <button type="button" className="bt-quick-btn" onClick={() => handleQuickAddSeconds(30)}>+30 giây</button>
            <button type="button" className="bt-quick-btn" onClick={() => handleQuickAddSeconds(60)}>+1 phút</button>
            <button type="button" className="bt-quick-btn" onClick={() => handleQuickAddSeconds(120)}>+2 phút</button>
            <button type="button" className="bt-quick-btn" onClick={() => handleQuickAddSeconds(300)}>+5 phút</button>
          </div>

          {/* Controls */}
          <div className="bt-timer-buttons">
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={toggleTimer}
              style={{ minWidth: '160px', fontSize: '1rem', padding: '0.75rem 1.5rem' }}
            >
              {isRunning ? <><Pause size={18} /> Tạm Dừng</> : <><Play size={18} /> Bắt Đầu (Space)</>}
            </button>
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={handleResetTimer}
              style={{ padding: '0.75rem 1.25rem' }}
            >
              <RotateCcw size={16} /> Đặt Lại
            </button>
          </div>

          {/* Buzzer Arena */}
          <div className="bt-buzzer-arena">
            <div className="bt-buzzer-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
                <Radio size={18} color="#ef4444" /> Chuông Giành Quyền Trả Lời (Buzzer):
              </div>
              {buzzerWinner && (
                <button type="button" className="btn btn-outline btn-xs" onClick={handleResetBuzzer}>
                  <RotateCcw size={12} /> Mở lại chuông
                </button>
              )}
            </div>

            {buzzerWinner && (
              <div className="bt-winner-banner">
                <div>
                  <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--danger)', fontWeight: 700 }}>
                    ⚡ Chuông phát tín hiệu đầu tiên:
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: buzzerWinner.color, marginTop: '2px' }}>
                    {buzzerWinner.name} (Bấm phím {buzzerWinner.keyShort})
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm"
                    style={{ background: '#10b981', border: 'none' }}
                    onClick={() => {
                      handleScoreChange(buzzerWinner.id, 10);
                      handleResetBuzzer();
                    }}
                  >
                    +10đ (Đúng)
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                    onClick={handleResetBuzzer}
                  >
                    Bỏ qua (Sai)
                  </button>
                </div>
              </div>
            )}

            {/* Grid of Team Buzzers */}
            <div className="bt-buzzer-grid">
              {teams.map(t => {
                const isWon = buzzerWinner?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`bt-buzzer-btn ${isWon ? 'buzzer-won' : ''}`}
                    style={{ background: t.color }}
                    onClick={() => handlePressBuzzer(t)}
                    disabled={buzzerLocked && !isWon}
                  >
                    <span className="bt-buzzer-key">Phím {t.keyShort}</span>
                    <Radio size={22} style={{ marginBottom: '6px' }} />
                    <span>{t.name}</span>
                    <small style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '4px' }}>
                      Điểm: {t.score}đ
                    </small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Settings, Scoreboard & Config */}
        <div className="bt-side-panel">
          {/* Bảng Điểm & Quản Lý Đội */}
          <div className="bt-card">
            <div className="bt-card-header">
              <h3 className="bt-card-title">
                <Trophy size={18} color="#f59e0b" /> Bảng Điểm Thi Đấu ({teams.length} đội)
              </h3>
            </div>

            <div className="bt-teams-list">
              {teams.map(t => (
                <div key={t.id} className="bt-team-row">
                  <div className="bt-team-info">
                    <div className="bt-team-color-dot" style={{ background: t.color }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {t.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      [Phím {t.keyShort}]
                    </span>
                  </div>

                  <div className="bt-team-score-ctrl">
                    <button 
                      type="button" 
                      className="bt-score-btn"
                      onClick={() => handleScoreChange(t.id, -5)}
                      title="Trừ 5 điểm"
                    >
                      -
                    </button>
                    <span className="bt-score-val">{t.score}</span>
                    <button 
                      type="button" 
                      className="bt-score-btn"
                      onClick={() => handleScoreChange(t.id, 10)}
                      title="Cộng 10 điểm"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(t.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Xóa đội"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Form thêm đội mới */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <input 
                type="text" 
                className="bs-input" 
                placeholder="Tên đội thi mới..."
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddTeam(); }}
              />
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={handleAddTeam}
                disabled={!newTeamName.trim()}
              >
                <Plus size={15} /> Thêm
              </button>
            </div>
          </div>

          {/* Cấu hình thời gian tùy chỉnh */}
          <div className="bt-card">
            <div className="bt-card-header">
              <h3 className="bt-card-title">
                <Timer size={18} color="var(--primary)" /> Tùy Chỉnh Hoạt Động
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Tiêu đề hoạt động:
                </label>
                <input 
                  type="text" 
                  className="bs-input" 
                  value={phaseTitle} 
                  onChange={(e) => setPhaseTitle(e.target.value)} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Mục tiêu / Yêu cầu nhiệm vụ:
                </label>
                <textarea 
                  className="bs-textarea" 
                  rows={2} 
                  value={phaseDesc} 
                  onChange={(e) => setPhaseDesc(e.target.value)} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Thời lượng đếm ngược (giây):
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    className="bs-input" 
                    value={totalSeconds} 
                    min={5}
                    max={3600}
                    onChange={(e) => {
                      const val = Math.max(5, parseInt(e.target.value) || 5);
                      setTotalSeconds(val);
                      if (!isRunning) setRemainingSeconds(val);
                    }} 
                  />
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setRemainingSeconds(totalSeconds);
                      showToast('Đã áp dụng thời gian mới', 'info');
                    }}
                  >
                    Áp Dụng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Iframe */}
      {showExportModal && (
        <div className="modal-backdrop" onClick={() => setShowExportModal(false)}>
          <div className="stop-edit-modal animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={20} style={{ color: 'var(--primary)' }} />
                <h3>Mã Nhúng LMS Cho Đồng Hồ & Chuông Bấm</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowExportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Dán mã nhúng này vào Canvas, Moodle, Google Sites hoặc hiển thị toàn màn hình trên máy chiếu lớp học để tổ chức hoạt động thi đấu đếm ngược sinh động!
              </p>
              <div className="export-result-box">
                <div className="export-result-header">
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Mã HTML Iframe độc lập Responsive 100%</span>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-xs"
                    onClick={handleCopyIframe}
                    style={{ background: copied ? '#10b981' : 'var(--primary)' }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
                <pre className="export-code-block">{generateIframeCode()}</pre>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowExportModal(false)}>Đóng</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleCopyIframe}>
                {copied ? 'Đã sao chép' : 'Sao chép mã nhúng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

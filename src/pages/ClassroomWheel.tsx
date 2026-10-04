import { useState, useRef, useEffect } from 'react';
import { 
  Compass, 
  Play, 
  Users, 
  Volume2, 
  VolumeX,
  Shuffle,
  Award
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './ClassroomWheel.css';

const DEFAULT_NAMES = [
  'Nguyễn Văn An',
  'Trần Thị Bích',
  'Lê Hoàng Cường',
  'Phạm Minh Dũng',
  'Đỗ Thùy Dung',
  'Hoàng Tuấn Em',
  'Vũ Thị Giang',
  'Bùi Đức Hải',
  'Ngô Phương Lan',
  'Đặng Quang Minh'
];

const COLORS = [
  '#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', 
  '#ec4899', '#3b82f6', '#14b8a6', '#84cc16', '#f97316',
  '#6366f1', '#a855f7', '#0ea5e9', '#22c55e', '#eab308'
];

export default function ClassroomWheel() {
  const { showToast } = useNotification();
  const [itemsText, setItemsText] = useState(DEFAULT_NAMES.join('\n'));
  const [items, setItems] = useState<string[]>(DEFAULT_NAMES);
  const [winner, setWinner] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [teamSize, setTeamSize] = useState(2);
  const [teams, setTeams] = useState<string[][]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Parse items from text input
  useEffect(() => {
    const list = itemsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    setItems(list.length > 0 ? list : ['Chưa có dữ liệu']);
  }, [itemsText]);

  // Draw Canvas Wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 15;
    const total = items.length;
    const arc = (2 * Math.PI) / total;

    ctx.clearRect(0, 0, size, size);

    // Draw slices
    items.forEach((item, i) => {
      const angle = i * arc;
      ctx.beginPath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.lineTo(center, center);
      ctx.fill();
      ctx.stroke();

      // Slices border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      
      const truncated = item.length > 18 ? item.slice(0, 16) + '...' : item;
      ctx.fillText(truncated, radius - 20, 5);
      ctx.restore();
    });

    // Draw Center Circle
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Center star / text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QUAY', center, center + 4);
  }, [items]);

  // Audio Beep
  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}
  };

  const playWinSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.12);
        osc.stop(audioCtx.currentTime + idx * 0.12 + 0.35);
      });
    } catch (e) {}
  };

  // Spin Action
  const handleSpin = () => {
    if (isSpinning || items.length < 2) {
      if (items.length < 2) showToast('Cần ít nhất 2 mục để quay!', 'warning');
      return;
    }

    setIsSpinning(true);
    setWinner(null);

    const spinDegrees = 1800 + Math.floor(Math.random() * 1800); // 5 to 10 full turns
    const targetRotation = rotation + spinDegrees;
    setRotation(targetRotation);

    // Sound ticks simulation
    const interval = setInterval(() => {
      playTickSound();
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setIsSpinning(false);

      // Determine slice winner (arrow is at right side 0 rad or top)
      const degreesMod = targetRotation % 360;
      // pointer is at top: 270 deg (or 90 deg counter)
      const sliceSize = 360 / items.length;
      // Canvas starts at 0 rad (right), arrow is at right:
      const winningIndex = Math.floor(((360 - (degreesMod % 360)) % 360) / sliceSize);
      const chosen = items[winningIndex % items.length];
      setWinner(chosen);
      playWinSound();
      showToast(`🎉 Xin chúc mừng: ${chosen}!`, 'success');
    }, 4500);
  };

  // Chia nhóm ngẫu nhiên
  const handleGenerateTeams = () => {
    if (items.length < 2) {
      showToast('Cần ít nhất 2 học sinh để chia nhóm!', 'warning');
      return;
    }
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const result: string[][] = [];
    for (let i = 0; i < shuffled.length; i += teamSize) {
      result.push(shuffled.slice(i, i + teamSize));
    }
    setTeams(result);
    showToast(`Đã chia thành ${result.length} nhóm học tập ngẫu nhiên!`, 'success');
  };

  // Xóa người trúng khỏi danh sách
  const handleRemoveWinner = () => {
    if (!winner) return;
    const updated = items.filter(s => s !== winner);
    setItemsText(updated.join('\n'));
    setWinner(null);
    showToast(`Đã loại bỏ ${winner} khỏi danh sách quay tiếp theo!`, 'info');
  };

  return (
    <div className="wheel-container animate-fade-in">
      <header className="wheel-header">
        <div className="wheel-title-group">
          <div className="wheel-icon">
            <Compass size={26} />
          </div>
          <div>
            <h1 className="wheel-title">Vòng Quay May Mắn & Bốc Thăm Lớp Học</h1>
            <p className="wheel-subtitle">
              Công cụ gọi tên ngẫu nhiên, trả lời câu hỏi và chia nhóm học tập sôi động trong giờ giảng dạy LMS/Online.
            </p>
          </div>
        </div>

        <div className="wheel-header-actions">
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {soundEnabled ? 'Bật âm thanh' : 'Tắt âm thanh'}
          </button>
        </div>
      </header>

      <div className="wheel-grid">
        {/* Left Column: Wheel Display */}
        <div className="wheel-left-panel">
          <div className="wheel-stage-card">
            <div className="wheel-wrapper">
              {/* Pointer indicator arrow */}
              <div className="wheel-pointer">▼</div>
              
              <canvas 
                ref={canvasRef} 
                width={420} 
                height={420} 
                className="wheel-canvas"
                style={{ 
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none'
                }}
              />
            </div>

            <div className="wheel-controls">
              <button 
                type="button" 
                className="btn btn-primary btn-lg spin-btn"
                disabled={isSpinning || items.length < 2}
                onClick={handleSpin}
              >
                <Play size={20} /> {isSpinning ? 'Đang quay...' : 'QUAY NGAY'}
              </button>
            </div>

            {/* Winner Announcement Card */}
            {winner && (
              <div className="winner-popup animate-scale-up">
                <Award size={36} style={{ color: '#fbbf24', margin: '0 auto 8px' }} />
                <span className="winner-label">NGƯỜI ĐƯỢC CHỌN</span>
                <h2 className="winner-name">{winner}</h2>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    onClick={handleRemoveWinner}
                  >
                    Loại khỏi lượt sau
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm"
                    onClick={() => setWinner(null)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Name List & Team Generator */}
        <div className="wheel-right-panel">
          <div className="wheel-card">
            <h3>Danh Sách Tên / Câu Hỏi ({items.length})</h3>
            <p className="field-hint">Mỗi dòng tương ứng với 1 người hoặc 1 câu hỏi trên vòng quay.</p>
            <textarea 
              className="inter-textarea" 
              rows={8}
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              placeholder="Nhập họ và tên học sinh (mỗi người 1 dòng)..."
            />
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => setItemsText(DEFAULT_NAMES.join('\n'))}
              >
                Nạp mẫu lớp học
              </button>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => setItemsText('')}
              >
                Xóa tất cả
              </button>
            </div>
          </div>

          {/* Random Team Generator */}
          <div className="wheel-card" style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Users size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0 }}>Chia Nhóm Ngẫu Nhiên</h3>
            </div>
            <p className="field-hint">Tự động xáo trộn danh sách trên thành các nhóm nhỏ để hoạt động nhóm.</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <label style={{ fontSize: '0.88rem' }}>Số người mỗi nhóm:</label>
              <input 
                type="number" 
                min={2} 
                max={10} 
                value={teamSize}
                onChange={(e) => setTeamSize(Math.max(2, parseInt(e.target.value, 10) || 2))}
                className="inter-input"
                style={{ width: '70px', padding: '4px 8px' }}
              />
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={handleGenerateTeams}
              >
                <Shuffle size={14} /> Chia Nhóm
              </button>
            </div>

            {teams.length > 0 && (
              <div className="teams-grid">
                {teams.map((group, idx) => (
                  <div key={idx} className="team-box">
                    <span className="team-badge">Nhóm {idx + 1} ({group.length})</span>
                    <ul className="team-members">
                      {group.map((m, mIdx) => (
                        <li key={mIdx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

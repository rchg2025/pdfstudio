import { useState, useRef, useEffect } from 'react';
import { 
  Compass, 
  Play, 
  Users, 
  Volume2, 
  VolumeX,
  Shuffle,
  Award,
  Copy,
  History
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

  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [splitMode, setSplitMode] = useState<'byMembers' | 'byGroups'>('byMembers');
  const [groupCount, setGroupCount] = useState(3);
  const [history, setHistory] = useState<string[]>([]);

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

  // Spin Action: Tính toán góc chính xác tuyệt đối với kim chỉ phía trên (270 độ / 3π/2)
  const handleSpin = () => {
    if (isSpinning || items.length < 2) {
      if (items.length < 2) showToast('Cần ít nhất 2 mục để quay!', 'warning');
      return;
    }

    setIsSpinning(true);
    setWinner(null);

    // Random số vòng quay (từ 5 đến 10 vòng đầy đủ)
    const spinDegrees = 1800 + Math.floor(Math.random() * 1800);
    const targetRotation = rotation + spinDegrees;
    setRotation(targetRotation);

    // Sound ticks simulation
    const interval = setInterval(() => {
      playTickSound();
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setIsSpinning(false);

      // Kim chỉ ▼ nằm ở đỉnh trên cùng (top: 270 deg / -90 deg trong hệ tọa độ Canvas tiêu chuẩn)
      // Khi canvas quay góc targetRotation theo chiều kim đồng hồ:
      // Góc tương đối của lát cắt nằm dưới con trỏ top:
      const total = items.length;
      const sliceSize = 360 / total;
      const normalizedRotation = targetRotation % 360;
      // pointerAngle = 270°. Góc trong canvas = (270 - normalizedRotation) mod 360
      const effectiveAngle = ((270 - normalizedRotation) % 360 + 360) % 360;
      const winningIndex = Math.floor(effectiveAngle / sliceSize) % total;
      const chosen = items[winningIndex];

      setWinner(chosen);
      setHistory(prev => [chosen, ...prev.slice(0, 19)]);
      playWinSound();
      showToast(`🎉 Xin chúc mừng: ${chosen}!`, 'success');

      // Nếu không cho phép dùng lại tên đã chọn: tự động loại bỏ
      if (!allowDuplicates) {
        setTimeout(() => {
          setItemsText(prev => {
            const lines = prev.split('\n').map(s => s.trim()).filter(Boolean);
            const idx = lines.indexOf(chosen);
            if (idx !== -1) {
              lines.splice(idx, 1);
            }
            return lines.join('\n');
          });
        }, 1200);
      }
    }, 4500);
  };

  // Chia nhóm ngẫu nhiên linh động (Theo số người mỗi nhóm HOẶC theo tổng số nhóm)
  const handleGenerateTeams = () => {
    const validItems = items.filter(i => i !== 'Chưa có dữ liệu');
    if (validItems.length < 2) {
      showToast('Cần ít nhất 2 học sinh để chia nhóm!', 'warning');
      return;
    }

    const shuffled = [...validItems].sort(() => Math.random() - 0.5);
    const result: string[][] = [];

    if (splitMode === 'byMembers') {
      // Chia theo số lượng người mỗi nhóm
      const size = Math.max(2, teamSize);
      for (let i = 0; i < shuffled.length; i += size) {
        result.push(shuffled.slice(i, i + size));
      }
    } else {
      // Chia theo tổng số nhóm cố định
      const count = Math.max(2, Math.min(groupCount, shuffled.length));
      for (let i = 0; i < count; i++) {
        result.push([]);
      }
      shuffled.forEach((person, idx) => {
        result[idx % count].push(person);
      });
    }

    setTeams(result);
    showToast(`Đã chia thành công ${result.length} nhóm học tập!`, 'success');
  };

  // Xóa thủ công người trúng khỏi danh sách
  const handleRemoveWinner = () => {
    if (!winner) return;
    const lines = itemsText.split('\n').map(s => s.trim()).filter(Boolean);
    const idx = lines.indexOf(winner);
    if (idx !== -1) {
      lines.splice(idx, 1);
    }
    setItemsText(lines.join('\n'));
    setWinner(null);
    showToast(`Đã loại bỏ "${winner}" khỏi danh sách quay!`, 'info');
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
          <label className="wheel-toggle-label" title="Bật nếu muốn người đã quay trúng vẫn có thể được quay tiếp ở các lượt sau">
            <input 
              type="checkbox" 
              checked={allowDuplicates} 
              onChange={(e) => setAllowDuplicates(e.target.checked)} 
            />
            <span>Cho phép dùng lại tên đã chọn</span>
          </label>

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

          {/* Lịch sử quay trúng gần đây */}
          {history.length > 0 && (
            <div className="wheel-history-card">
              <div className="history-header">
                <History size={16} style={{ color: 'var(--primary)' }} />
                <strong>Lịch sử quay trúng gần nhất ({history.length}):</strong>
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm" 
                  style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '0.75rem' }}
                  onClick={() => setHistory([])}
                >
                  Xóa lịch sử
                </button>
              </div>
              <div className="history-tags">
                {history.map((h, i) => (
                  <span key={i} className="history-tag">
                    #{i + 1} {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Name List & Team Generator */}
        <div className="wheel-right-panel">
          <div className="wheel-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <h3 style={{ margin: 0 }}>Danh Sách Tên / Câu Hỏi ({items.length})</h3>
              <span style={{ fontSize: '0.8rem', color: allowDuplicates ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                {allowDuplicates ? '✓ Giữ tên sau khi quay' : '⚡ Tự loại bỏ sau khi trúng'}
              </span>
            </div>
            <p className="field-hint">Mỗi dòng tương ứng với 1 người hoặc 1 câu hỏi trên vòng quay.</p>
            <textarea 
              className="inter-textarea" 
              rows={7}
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              placeholder="Nhập họ và tên học sinh (mỗi người 1 dòng)..."
            />
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0 }}>Chia Nhóm Học Tập Linh Hoạt</h3>
              </div>
              {teams.length > 0 && (
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.8rem', padding: '3px 8px' }}
                  onClick={() => {
                    const text = teams.map((g, idx) => `[Nhóm ${idx + 1} - ${g.length} thành viên]:\n` + g.map((m, mIdx) => `  ${mIdx + 1}. ${m}`).join('\n')).join('\n\n');
                    navigator.clipboard.writeText(text);
                    showToast('Đã sao chép danh sách chia nhóm vào clipboard!', 'success');
                  }}
                >
                  <Copy size={13} /> Sao Chép Danh Sách
                </button>
              )}
            </div>
            <p className="field-hint">Tự động xáo trộn danh sách người học thành các nhóm nhỏ kèm số thứ tự rõ ràng.</p>

            {/* Chế độ chia nhóm */}
            <div className="team-mode-tabs">
              <button 
                type="button"
                className={`team-mode-tab ${splitMode === 'byMembers' ? 'active' : ''}`}
                onClick={() => setSplitMode('byMembers')}
              >
                Chia theo số người mỗi nhóm
              </button>
              <button 
                type="button"
                className={`team-mode-tab ${splitMode === 'byGroups' ? 'active' : ''}`}
                onClick={() => setSplitMode('byGroups')}
              >
                Chia đều theo tổng số nhóm
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {splitMode === 'byMembers' ? (
                <>
                  <label style={{ fontSize: '0.88rem' }}>Số người mỗi nhóm:</label>
                  <input 
                    type="number" 
                    min={2} 
                    max={20} 
                    value={teamSize}
                    onChange={(e) => setTeamSize(Math.max(2, parseInt(e.target.value, 10) || 2))}
                    className="inter-input"
                    style={{ width: '70px', padding: '5px 8px' }}
                  />
                </>
              ) : (
                <>
                  <label style={{ fontSize: '0.88rem' }}>Chia thành bao nhiêu nhóm:</label>
                  <input 
                    type="number" 
                    min={2} 
                    max={20} 
                    value={groupCount}
                    onChange={(e) => setGroupCount(Math.max(2, parseInt(e.target.value, 10) || 2))}
                    className="inter-input"
                    style={{ width: '70px', padding: '5px 8px' }}
                  />
                </>
              )}

              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={handleGenerateTeams}
              >
                <Shuffle size={14} /> Xáo Trộn &amp; Chia Nhóm
              </button>
            </div>

            {teams.length > 0 && (
              <div className="teams-grid">
                {teams.map((group, idx) => (
                  <div key={idx} className="team-box">
                    <div className="team-header">
                      <span className="team-badge">Nhóm {idx + 1}</span>
                      <span className="team-count">{group.length} bạn</span>
                    </div>
                    <ol className="team-members">
                      {group.map((m, mIdx) => (
                        <li key={mIdx}>
                          <span className="member-index">{mIdx + 1}.</span>
                          <span className="member-name">{m}</span>
                        </li>
                      ))}
                    </ol>
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

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Trophy, Flame, CheckCircle, XCircle, 
  Sparkles
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import './LiveBattlePlayer.css';

const EMOJI_LIST = ['🦊', '🐼', '🦁', '🐯', '🦄', '🐲', '🚀', '⚡', '🌟', '🎯'];

export default function LiveBattlePlayer() {
  const { pinCode: initialPin } = useParams<{ pinCode?: string }>();

  // Trạng thái gia nhập
  const [pinCode, setPinCode] = useState(initialPin || '');
  const [nickname, setNickname] = useState('');
  const [studentId, setStudentId] = useState('');
  const [className, setClassName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState(EMOJI_LIST[0]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('red');
  const [roomPreview, setRoomPreview] = useState<any | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tự động kiểm tra phòng khi mã PIN đủ 6 số
  useEffect(() => {
    const cleanPin = pinCode.trim();
    if (cleanPin.length === 6) {
      fetch(`/api/live-battle?action=find-by-pin&pinCode=${encodeURIComponent(cleanPin)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.room) {
            setRoomPreview(data.room);
            const rSettings = data.room.settings || {};
            if (rSettings.battleMode === 'team' && Array.isArray(rSettings.teams) && rSettings.teams.length > 0) {
              setSelectedTeamId(rSettings.teams[0].id);
            }
          } else {
            setRoomPreview(null);
          }
        })
        .catch(() => setRoomPreview(null));
    } else {
      setRoomPreview(null);
    }
  }, [pinCode]);

  // Thông tin sau khi vào phòng
  const [player, setPlayer] = useState<any | null>(null);
  const [room, setRoom] = useState<any | null>(null);

  // Trạng thái làm bài câu hỏi hiện tại
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerResult, setAnswerResult] = useState<{
    answered: boolean;
    isCorrect?: boolean;
    scoreAwarded?: number;
    newStreak?: number;
  } | null>(null);

  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Lưu thông tin học viên vào localStorage
  useEffect(() => {
    const savedNick = localStorage.getItem('live_battle_nickname');
    const savedId = localStorage.getItem('live_battle_studentid');
    const savedClass = localStorage.getItem('live_battle_classname');
    const savedEmoji = localStorage.getItem('live_battle_emoji');
    if (savedNick) setNickname(savedNick);
    if (savedId) setStudentId(savedId);
    if (savedClass) setClassName(savedClass);
    if (savedEmoji) setAvatarEmoji(savedEmoji);
  }, []);

  // Xử lý tham gia phòng
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode.trim() || !nickname.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Mã PIN và Biệt danh!');
      return;
    }

    setIsJoining(true);
    setErrorMsg('');

    try {
      const roomTeams = roomPreview?.settings?.teams || [];
      const currentTeam = roomTeams.find((t: any) => t.id === selectedTeamId);

      const res = await fetch('/api/live-battle?action=join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pinCode: pinCode.trim(),
          nickname: nickname.trim(),
          studentId: studentId.trim() || undefined,
          className: className.trim() || undefined,
          avatarEmoji,
          teamId: currentTeam?.id || undefined,
          teamName: currentTeam?.name || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể tham gia phòng này');
      }

      setPlayer(data.player);
      setRoom(data.room);

      // Lưu cache
      localStorage.setItem('live_battle_nickname', nickname.trim());
      if (studentId) localStorage.setItem('live_battle_studentid', studentId.trim());
      if (className) localStorage.setItem('live_battle_classname', className.trim());
      localStorage.setItem('live_battle_emoji', avatarEmoji);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối tới máy chủ');
    } finally {
      setIsJoining(false);
    }
  };

  // Polling cập nhật trạng thái từ Host
  useEffect(() => {
    if (!room?.id || !player?.id) return;

    let prevQIndex = room.currentQuestionIndex;

    const poll = async () => {
      try {
        const res = await fetch(`/api/live-battle?action=get-player-room-state&roomId=${encodeURIComponent(room.id)}&playerId=${encodeURIComponent(player.id)}`);
        const data = await res.json();
        if (data.success) {
          const newRoom = data.room;
          const newPlayer = data.player;

          // Nếu chuyển sang câu hỏi mới, reset lựa chọn
          if (newRoom.currentQuestionIndex !== prevQIndex) {
            prevQIndex = newRoom.currentQuestionIndex;
            setSelectedOption(null);
            setAnswerResult(null);
            setQuestionStartTime(Date.now());
          }

          setRoom(newRoom);
          setPlayer((prev: any) => ({ ...prev, ...newPlayer }));

          if (newPlayer.hasAnsweredCurrent && newPlayer.currentAnswer) {
            setSelectedOption(newPlayer.currentAnswer.selectedOption);
            setAnswerResult({
              answered: true,
              isCorrect: newPlayer.currentAnswer.isCorrect,
              scoreAwarded: newPlayer.currentAnswer.scoreAwarded
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    poll();
    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, [room?.id, player?.id]);

  // Gửi câu trả lời khi bấm vào 1 trong 4 màu
  const handleSelectOption = async (optionIndex: number) => {
    if (selectedOption !== null || isSubmitting || !player || !room) return;

    const timeSpentMs = Date.now() - questionStartTime;
    setSelectedOption(optionIndex);
    setIsSubmitting(true);

    // Rung điện thoại phản hồi (Haptic feedback nếu có)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      const res = await fetch('/api/live-battle?action=submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: player.id,
          roomId: room.id,
          questionIndex: room.currentQuestionIndex,
          selectedOption: optionIndex,
          timeSpentMs
        })
      });

      const data = await res.json();
      if (data.success) {
        setAnswerResult({
          answered: true,
          isCorrect: data.isCorrect,
          scoreAwarded: data.scoreAwarded,
          newStreak: data.newStreak
        });

        if (data.isCorrect) {
          triggerConfetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 1. MÀN HÌNH NHẬP MÃ PIN & TÊN ĐỂ THAM GIA PHÒNG
  // -------------------------------------------------------------
  if (!player || !room) {
    return (
      <div className="player-join-screen">
        <div className="join-card">
          <div className="join-header">
            <div className="join-logo">⚡</div>
            <h1>ĐẤU TRƯỜNG LIVE</h1>
            <p>Tham gia phòng thi đố vui trực tiếp cùng lớp học</p>
          </div>

          {errorMsg && <div className="join-error-box">{errorMsg}</div>}

          <form onSubmit={handleJoin} className="join-form">
            <div className="form-group">
              <label>Mã PIN Phòng:</label>
              <input 
                type="text" 
                value={pinCode}
                onChange={e => setPinCode(e.target.value)}
                placeholder="Nhập 6 số PIN (Ví dụ: 839102)"
                className="input-pin"
                maxLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label>Biệt danh hiển thị:</label>
              <input 
                type="text" 
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Ví dụ: Hoàng Long, Bảo Trâm..."
                className="input-text"
                required
              />
            </div>

            <div className="form-group">
              <label>Mã số sinh viên (Tùy chọn):</label>
              <input 
                type="text" 
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="Ví dụ: 22D18012"
                className="input-text"
              />
            </div>

            <div className="form-group">
              <label>Lớp học (Tùy chọn):</label>
              <input 
                type="text" 
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="Ví dụ: TC26-CSNDT, Dược K18..."
                className="input-text"
              />
            </div>

            {/* CHỌN ĐỘI KHI PHÒNG BẬT CHẾ ĐỘ TEAM BATTLE */}
            {roomPreview?.settings?.battleMode === 'team' && Array.isArray(roomPreview.settings.teams) && roomPreview.settings.teams.length > 0 && (
              <div className="form-group" style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '12px', border: '1.5px dashed #cbd5e1' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1e293b', fontWeight: 800 }}>
                  <span>⚔️ CHỌN ĐỘI LIÊN MINH:</span>
                  <span style={{ fontSize: '0.78rem', color: '#3b82f6' }}>Team Battle</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {roomPreview.settings.teams.map((t: any) => {
                    const isSelected = selectedTeamId === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTeamId(t.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          padding: '0.55rem 0.65rem',
                          borderRadius: '8px',
                          border: `2px solid ${isSelected ? t.color : '#e2e8f0'}`,
                          background: isSelected ? `${t.color}15` : '#fff',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          color: isSelected ? t.color : '#475569',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{t.mascot}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Chọn linh vật Avatar:</label>
              <div className="emoji-picker-row">
                {EMOJI_LIST.map(em => (
                  <button 
                    type="button" 
                    key={em}
                    className={`emoji-btn ${avatarEmoji === em ? 'active' : ''}`}
                    onClick={() => setAvatarEmoji(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-join-room" disabled={isJoining}>
              {isJoining ? 'Đang gia nhập...' : '⚡ VÀO ĐẤU TRƯỜNG'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. MÀN HÌNH CHỜ BẮT ĐẦU (LOBBY WAIT)
  // -------------------------------------------------------------
  if (room.status === 'LOBBY') {
    return (
      <div className="player-wait-screen">
        <div className="player-header-bar">
          <div className="p-brand">⚡ {room.title}</div>
          <div className="p-pin">PIN: {room.pinCode}</div>
        </div>

        <div className="wait-center-box">
          <div className="wait-avatar-box">
            <span className="wait-emoji">{player.avatarEmoji}</span>
            <h2 className="wait-name">{player.nickname}</h2>
            {player.teamName && (
              <span style={{ 
                marginTop: '0.35rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 800,
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                ⚔️ {player.teamName}
              </span>
            )}
            {player.studentId && <span className="wait-mssv">MSSV: {player.studentId}</span>}
          </div>

          <div className="wait-status-chip">
            <span className="dot-pulse"></span> Bạn đã sẵn sàng!
          </div>

          <p className="wait-instruction">
            Hãy nhìn lên màn hình máy chiếu của Thầy/Cô.<br />
            Trận đấu sẽ bắt đầu bất cứ lúc nào!
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. MÀN HÌNH BẤM CHỌN ĐÁP ÁN (4 KHỐI MÀU SẮC LỚN)
  // -------------------------------------------------------------
  if (room.status === 'QUESTION') {
    const currentQ = room.currentQuestion;

    return (
      <div className="player-game-screen">
        {/* Top Info Bar */}
        <div className="player-stats-bar">
          <div className="p-stat-item">
            <span className="p-avatar">{player.avatarEmoji}</span>
            <span className="p-name">{player.nickname}</span>
            {player.teamName && (
              <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.15)', padding: '0.15rem 0.45rem', borderRadius: 9999, fontWeight: 700 }}>
                {player.teamName}
              </span>
            )}
          </div>

          <div className="p-stat-item">
            <Trophy size={16} color="#f59e0b" />
            <span className="p-score">{player.totalScore || 0} pts</span>
          </div>

          {player.streak > 1 && (
            <div className="p-streak-badge">
              <Flame size={14} /> Chuỗi {player.streak}🔥
            </div>
          )}
        </div>

        {/* Khi học viên đã bấm câu trả lời -> Hiện trạng thái đợi */}
        {selectedOption !== null ? (
          <div className="player-answered-box">
            <div className="answered-icon-pulse">
              <CheckCircle size={56} color="#10b981" />
            </div>
            <h2>Đã gửi câu trả lời!</h2>
            <p>Hãy chờ xem đáp án chính xác trên máy chiếu...</p>
          </div>
        ) : (
          <div className="player-buttons-grid">
            <button 
              className="game-btn btn-red"
              onClick={() => handleSelectOption(0)}
              disabled={isSubmitting}
            >
              <span className="btn-shape">🔺</span>
              {currentQ?.options?.[0] && <span className="btn-label">{currentQ.options[0]}</span>}
            </button>

            <button 
              className="game-btn btn-blue"
              onClick={() => handleSelectOption(1)}
              disabled={isSubmitting}
            >
              <span className="btn-shape">🔷</span>
              {currentQ?.options?.[1] && <span className="btn-label">{currentQ.options[1]}</span>}
            </button>

            <button 
              className="game-btn btn-yellow"
              onClick={() => handleSelectOption(2)}
              disabled={isSubmitting}
            >
              <span className="btn-shape">🟡</span>
              {currentQ?.options?.[2] && <span className="btn-label">{currentQ.options[2]}</span>}
            </button>

            <button 
              className="game-btn btn-green"
              onClick={() => handleSelectOption(3)}
              disabled={isSubmitting}
            >
              <span className="btn-shape">🟩</span>
              {currentQ?.options?.[3] && <span className="btn-label">{currentQ.options[3]}</span>}
            </button>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. MÀN HÌNH KẾT QUẢ CÂU VỪA RỒI & THỨ HẠNG (LEADERBOARD PHASE)
  // -------------------------------------------------------------
  if (room.status === 'LEADERBOARD') {
    const isCorrect = answerResult?.isCorrect;

    return (
      <div className={`player-result-screen ${isCorrect ? 'bg-success-gradient' : 'bg-wrong-gradient'}`}>
        <div className="result-center-card">
          <div className="result-icon-circle">
            {isCorrect ? (
              <CheckCircle size={64} color="#10b981" />
            ) : (
              <XCircle size={64} color="#ef4444" />
            )}
          </div>

          <h1 className="result-title">
            {isCorrect ? 'CHÍNH XÁC! 🎉' : 'RẤT TIẾC, CHƯA ĐÚNG!'}
          </h1>

          {isCorrect && answerResult?.scoreAwarded && (
            <div className="score-awarded-pill">
              +{answerResult.scoreAwarded} điểm
            </div>
          )}

          <div className="player-rank-box">
            <span className="rank-text">Vị trí hiện tại của bạn:</span>
            <div className="rank-num">Hạng #{player.rank || 1}</div>
            <div className="rank-total-score">Tổng điểm: {player.totalScore || 0} pts</div>
          </div>

          <p className="next-q-hint">Chuẩn bị cho câu hỏi tiếp theo...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 5. MÀN HÌNH TỔNG KẾT CUỐI CÙNG (FINISHED)
  // -------------------------------------------------------------
  return (
    <div className="player-finished-screen">
      <div className="finished-card">
        <Sparkles size={48} color="#f59e0b" />
        <h1>KẾT THÚC ĐẤU TRƯỜNG!</h1>
        <p>Cảm ơn bạn đã thi đấu hết mình cùng lớp học!</p>

        <div className="final-podium-rank">
          <span className="final-emoji">{player.avatarEmoji}</span>
          <span className="final-name">{player.nickname}</span>
          <div className="final-rank-tag">Thứ Hạng: #{player.rank || 1}</div>
          <div className="final-score-tag">Tổng điểm: {player.totalScore || 0} pts</div>
        </div>

        <button 
          className="btn-play-again"
          onClick={() => {
            setPlayer(null);
            setRoom(null);
          }}
        >
          Tham gia phòng khác
        </button>
      </div>
    </div>
  );
}

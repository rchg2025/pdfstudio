import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { AttendanceSession, AttendanceRecord } from '../types/attendance';
import { 
  QrCode, 
  Plus, 
  Calendar, 
  FileSpreadsheet, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  Lock, 
  Unlock, 
  MapPin, 
  Search, 
  UserCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import './AttendanceManager.css';

export default function AttendanceManager() {
  const { token } = useAuth();
  const { showToast } = useNotification();

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [sessionRecords, setSessionRecords] = useState<AttendanceRecord[]>([]);

  // Modal tạo buổi điểm danh mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newRequireGps, setNewRequireGps] = useState(false);
  const [newLat, setNewLat] = useState<number | null>(null);
  const [newLng, setNewLng] = useState<number | null>(null);
  const [newMaxDistance, setNewMaxDistance] = useState(100);
  const [newRefreshSec, setNewRefreshSec] = useState(8);
  const [newAllowMultiple, setNewAllowMultiple] = useState(false);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Màn hình Máy chiếu chiếu QR Động (Projector Fullscreen Mode)
  const [showProjector, setShowProjector] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrCountdown, setQrCountdown] = useState(8);

  // Bộ lọc tìm kiếm bảng danh sách sinh viên
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Tải danh sách buổi điểm danh của giảng viên
  const fetchSessions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/attendance?action=get-my-sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        if (data.sessions?.length > 0 && !activeSession) {
          fetchSessionDetails(data.sessions[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [token]);

  // 2. Lấy chi tiết buổi điểm danh (kèm danh sách sinh viên đã điểm danh)
  const fetchSessionDetails = async (sessionId: string, silent = false) => {
    try {
      const res = await fetch(`/api/attendance?action=get-session-details&sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session);
        setSessionRecords(data.session?.records || []);
      }
    } catch (e) {
      if (!silent) console.error(e);
    }
  };

  // 3. Tự động cập nhật danh sách sinh viên mỗi 4 giây khi đang mở phòng
  useEffect(() => {
    if (!activeSession || !activeSession.isOpen) return;
    const interval = setInterval(() => {
      fetchSessionDetails(activeSession.id, true);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeSession?.id, activeSession?.isOpen]);

  // 4. Lấy vị trí GPS hiện tại của Giảng viên khi tạo phòng
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast('Trình duyệt của bạn không hỗ trợ định vị GPS!', 'error');
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewLat(Number(pos.coords.latitude.toFixed(6)));
        setNewLng(Number(pos.coords.longitude.toFixed(6)));
        setIsGettingGps(false);
        showToast('Đã lấy tọa độ GPS giảng đường thành công!', 'success');
      },
      (err) => {
        setIsGettingGps(false);
        showToast(`Không thể lấy vị trí: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 5. Tạo buổi điểm danh
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Vui lòng nhập tên môn học / chủ đề buổi điểm danh!', 'warning');
      return;
    }
    if (newRequireGps && (!newLat || !newLng)) {
      showToast('Vui lòng bấm lấy tọa độ GPS của bạn trước khi bật giới hạn vị trí!', 'warning');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/attendance?action=create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          className: newClassName.trim() || undefined,
          requireGps: newRequireGps,
          latitude: newLat,
          longitude: newLng,
          maxDistanceMeters: Number(newMaxDistance) || 100,
          refreshSeconds: Number(newRefreshSec) || 8,
          allowMultiplePerDevice: newAllowMultiple
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast('Đã tạo buổi điểm danh thành công!', 'success');
        setShowCreateModal(false);
        setNewTitle('');
        setNewClassName('');
        setNewRequireGps(false);
        setNewLat(null);
        setNewLng(null);
        fetchSessions();
        if (data.session) {
          setActiveSession(data.session);
          setSessionRecords([]);
          // Tự động mở máy chiếu cho giảng viên chiếu lên lớp
          setShowProjector(true);
        }
      } else {
        const err = await res.json();
        showToast(err.message || 'Lỗi khi tạo buổi điểm danh', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Lỗi mạng', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // 6. Cơ chế Dynamic QR Token Loop: Tự động đổi mã sau mỗi chu kỳ giây
  useEffect(() => {
    if (!showProjector || !activeSession || !activeSession.isOpen) return;

    let countdownTimer: any = null;

    const refreshQrToken = async () => {
      try {
        const res = await fetch(`/api/attendance?action=get-dynamic-qr&sessionId=${activeSession.id}`);
        if (res.ok) {
          const data = await res.json();
          setQrCountdown(data.refreshSeconds || activeSession.refreshSeconds || 8);

          // Tạo URL điểm danh chứa dynamic token
          const origin = window.location.origin;
          const checkinUrl = `${origin}/diem-danh/${activeSession.code}?t=${data.token}`;

          // Render QR code ra DataURL
          const url = await QRCode.toDataURL(checkinUrl, {
            width: 480,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });
          setQrDataUrl(url);
        }
      } catch (e) {
        console.error('Lỗi refresh dynamic QR:', e);
      }
    };

    // Lần đầu mở máy chiếu
    refreshQrToken();

    // Timer đếm ngược giây hiển thị trên vòng tròn
    countdownTimer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          refreshQrToken();
          return activeSession.refreshSeconds || 8;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownTimer);
    };
  }, [showProjector, activeSession?.id, activeSession?.isOpen]);

  // 7. Khóa / Mở khóa buổi điểm danh
  const handleToggleOpen = async () => {
    if (!activeSession) return;
    try {
      const nextOpen = !activeSession.isOpen;
      const res = await fetch('/api/attendance?action=toggle-session-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSession.id, isOpen: nextOpen })
      });
      if (res.ok) {
        setActiveSession({ ...activeSession, isOpen: nextOpen });
        setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, isOpen: nextOpen } : s));
        showToast(nextOpen ? 'Đã mở lại buổi điểm danh!' : 'Đã khóa buổi điểm danh thành công!', 'info');
      }
    } catch {}
  };

  // 8. Xóa buổi điểm danh
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa buổi điểm danh này cùng tất cả dữ liệu sinh viên đã điểm danh?')) return;
    try {
      const res = await fetch('/api/attendance?action=delete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      if (res.ok) {
        showToast('Đã xóa buổi điểm danh thành công!', 'success');
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (activeSession?.id === sessionId) {
          setActiveSession(null);
          setSessionRecords([]);
        }
      }
    } catch {}
  };

  // 9. Xóa 1 bản ghi sinh viên
  const handleDeleteRecord = async (recordId: string) => {
    try {
      const res = await fetch('/api/attendance?action=delete-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId })
      });
      if (res.ok) {
        setSessionRecords(prev => prev.filter(r => r.id !== recordId));
        showToast('Đã xóa lượt điểm danh này!', 'info');
      }
    } catch {}
  };

  // 10. Xuất file Excel bảng điểm danh (.xlsx)
  const handleExportExcel = () => {
    if (!activeSession || sessionRecords.length === 0) {
      showToast('Chưa có dữ liệu sinh viên điểm danh để xuất file!', 'warning');
      return;
    }

    const header = [
      ['BẢNG ĐIỂM DANH SINH VIÊN - THỜI GIAN THỰC'],
      ['Môn học / Chủ đề:', activeSession.title],
      ['Lớp học:', activeSession.className || 'Tự do'],
      ['Mã phòng:', activeSession.code],
      ['Tổng số sinh viên có mặt:', `${sessionRecords.length} sinh viên`],
      ['Thời gian xuất file:', new Date().toLocaleString('vi-VN')],
      []
    ];

    const tableHeaders = [
      'STT',
      'Họ và tên sinh viên',
      'Mã sinh viên (MSSV)',
      'Lớp',
      'Thời gian điểm danh',
      'Khoảng cách GPS (mét)',
      'Trạng thái'
    ];

    const tableRows = sessionRecords.map((r, idx) => [
      idx + 1,
      r.studentName,
      r.studentId,
      r.className || '',
      new Date(r.checkedInAt).toLocaleString('vi-VN'),
      r.distanceMeters !== null ? `${r.distanceMeters}m` : 'Không bắt buộc',
      r.status === 'PRESENT' ? 'Có mặt' : (r.status === 'LATE' ? 'Đi muộn' : 'Có phép')
    ]);

    const worksheetData = [...header, tableHeaders, ...tableRows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 18 },
      { wch: 16 },
      { wch: 24 },
      { wch: 22 },
      { wch: 16 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DiemDanh');

    const fileName = `DiemDanh_${activeSession.code}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast('Đã xuất file Excel bảng điểm danh thành công!', 'success');
  };

  const filteredRecords = sessionRecords.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.studentId.toLowerCase().includes(q) ||
      (r.className && r.className.toLowerCase().includes(q))
    );
  });

  return (
    <div className="attendance-container animate-fade-in">
      {/* HEADER */}
      <div className="attendance-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.12)', borderRadius: '0.75rem', color: 'var(--primary)' }}>
              <QrCode size={26} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Điểm Danh Bằng QR Động
            </h1>
            <span style={{ fontSize: '0.75rem', background: 'var(--gradient-primary)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '30px', fontWeight: 700 }}>
              AI Smart
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.92rem' }}>
            Mã QR tự động đổi sau mỗi 8 giây chống chụp ảnh điểm danh hộ, nhận diện thiết bị duy nhất và khóa định vị GPS.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '50px', padding: '0.65rem 1.4rem' }}
          >
            <Plus size={18} /> Tạo Buổi Điểm Danh
          </button>
        </div>
      </div>

      {/* DANH SÁCH CÁC BUỔI ĐIỂM DANH */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} color="var(--primary)" /> Danh sách phòng điểm danh của bạn ({sessions.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách phòng...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
            <QrCode size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Chưa có buổi điểm danh nào</h4>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 1.5rem' }}>
              Bấm nút <strong>Tạo Buổi Điểm Danh</strong> để bắt đầu tạo mã PIN và chiếu QR động cho sinh viên trên lớp.
            </p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Bắt đầu tạo ngay
            </button>
          </div>
        ) : (
          <div className="attendance-grid">
            {sessions.map((s) => {
              const isSelected = activeSession?.id === s.id;
              return (
                <div 
                  key={s.id} 
                  className="attendance-card" 
                  style={{ 
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--primary)' : undefined,
                    background: isSelected ? 'rgba(99, 102, 241, 0.04)' : undefined
                  }}
                  onClick={() => fetchSessionDetails(s.id)}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '20px',
                        background: s.isOpen ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: s.isOpen ? '#10b981' : '#ef4444'
                      }}>
                        {s.isOpen ? '● ĐANG MỞ' : '○ ĐÃ KHÓA'}
                      </span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '2px' }}>
                        PIN: {s.code}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      {s.title}
                    </h4>
                    {s.className && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>
                        Lớp: <strong>{s.className}</strong>
                      </p>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.65rem' }}>
                      {s.requireGps && (
                        <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '0.15rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} /> GPS &lt;{s.maxDistanceMeters}m
                        </span>
                      )}
                      <span style={{ fontSize: '0.72rem', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        QR đổi mỗi {s.refreshSeconds}s
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <UserCheck size={16} color="var(--primary)" />
                      <span>{s._count?.records || 0} đã điểm danh</span>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(s.id);
                      }}
                      title="Xóa buổi này"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CHI TIẾT BUỔI ĐANG CHỌN & BẢNG DANH SÁCH SINH VIÊN */}
      {activeSession && (
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {activeSession.title}
                </h2>
                <span style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 700, 
                  padding: '0.2rem 0.65rem', 
                  borderRadius: '30px',
                  background: activeSession.isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: activeSession.isOpen ? '#10b981' : '#ef4444'
                }}>
                  {activeSession.isOpen ? '● ĐANG NHẬN ĐIỂM DANH' : '○ ĐÃ TẠM KHÓA'}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: '0.35rem 0 0', fontSize: '0.88rem' }}>
                Mã PIN: <strong style={{ color: 'var(--primary)', fontSize: '1rem', letterSpacing: '1px' }}>{activeSession.code}</strong> • 
                Tạo lúc: {new Date(activeSession.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {/* Nút Chiếu QR Lên Máy Chiếu Toàn Màn Hình */}
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setShowProjector(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, padding: '0.65rem 1.25rem', borderRadius: '50px' }}
              >
                <Maximize2 size={16} /> Mở Máy Chiếu QR Động
              </button>

              {/* Nút Khóa / Mở phòng */}
              <button 
                type="button" 
                className={`btn ${activeSession.isOpen ? 'btn-outline' : 'btn-primary'}`}
                onClick={handleToggleOpen}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '50px' }}
              >
                {activeSession.isOpen ? <Lock size={15} /> : <Unlock size={15} />}
                {activeSession.isOpen ? 'Tạm Khóa Phòng' : 'Mở Lại Phòng'}
              </button>

              {/* Nút Xuất Excel */}
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={handleExportExcel}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '50px' }}
              >
                <FileSpreadsheet size={15} color="#10b981" /> Xuất Excel ({sessionRecords.length})
              </button>
            </div>
          </div>

          {/* THANH THỐNG KÊ NHANH */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="attendance-stat-box">
              <div className="attendance-stat-number">{sessionRecords.length}</div>
              <div className="attendance-stat-label">Sinh viên đã có mặt</div>
            </div>
            <div className="attendance-stat-box">
              <div className="attendance-stat-number" style={{ color: '#10b981' }}>{activeSession.code}</div>
              <div className="attendance-stat-label">Mã PIN phòng học</div>
            </div>
            <div className="attendance-stat-box">
              <div className="attendance-stat-number" style={{ color: '#3b82f6' }}>{activeSession.refreshSeconds}s</div>
              <div className="attendance-stat-label">Chu kỳ đổi mã QR</div>
            </div>
            <div className="attendance-stat-box">
              <div className="attendance-stat-number" style={{ color: activeSession.requireGps ? '#eab308' : 'var(--text-muted)' }}>
                {activeSession.requireGps ? `< ${activeSession.maxDistanceMeters}m` : 'Tắt'}
              </div>
              <div className="attendance-stat-label">Khóa vị trí GPS</div>
            </div>
          </div>

          {/* TÌM KIẾM & BẢNG SINH VIÊN */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Tìm theo tên, MSSV, lớp..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 1rem 0.55rem 2.2rem',
                  borderRadius: '30px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Đang hiển thị: <strong>{filteredRecords.length}</strong> / {sessionRecords.length} lượt điểm danh
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1.5px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem', width: 60 }}>STT</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Họ và tên sinh viên</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Mã SV (MSSV)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Lớp</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Thời gian</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Định vị GPS</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: 80 }}>Xóa</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      Chưa có sinh viên nào điểm danh trong buổi học này. Bật máy chiếu QR để sinh viên quét mã!
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, idx) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{r.studentName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--primary)' }}>{r.studentId}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{r.className || '-'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                        {new Date(r.checkedInAt).toLocaleTimeString('vi-VN')} ({new Date(r.checkedInAt).toLocaleDateString('vi-VN')})
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {r.distanceMeters !== null ? (
                          <span style={{ 
                            fontSize: '0.78rem', 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '4px',
                            background: r.distanceMeters <= (activeSession.maxDistanceMeters || 100) ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: r.distanceMeters <= (activeSession.maxDistanceMeters || 100) ? '#10b981' : '#ef4444',
                            fontWeight: 600
                          }}>
                            {r.distanceMeters}m
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Không đo</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button 
                          type="button" 
                          className="btn btn-outline btn-xs"
                          onClick={() => handleDeleteRecord(r.id)}
                          style={{ color: '#ef4444' }}
                          title="Xóa lượt này"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL MÁY CHIẾU FULLSCREEN CHO GIẢNG VIÊN CHIẾU LÊN BẢNG */}
      {showProjector && activeSession && (
        <div className="attendance-projector-modal animate-fade-in">
          {/* Header máy chiếu */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
                HỆ THỐNG ĐIỂM DANH THỜI GIAN THỰC
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: '0.25rem 0 0', color: '#ffffff' }}>
                {activeSession.title}
              </h2>
              {activeSession.className && (
                <p style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem', fontWeight: 600 }}>
                  Lớp: {activeSession.className}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="attendance-pin-badge">
                <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>MÃ PIN:</span>
                <span>{activeSession.code}</span>
              </div>
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowProjector(false)}
                style={{ borderRadius: '50%', width: 44, height: 44, padding: 0, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                title="Đóng chế độ máy chiếu"
              >
                <Minimize2 size={20} />
              </button>
            </div>
          </div>

          {/* Vùng trung tâm: QR Code động & Đếm ngược */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
            <div className="attendance-qr-box">
              <div className="attendance-progress-circle" title="Thời gian đổi mã QR tiếp theo">
                {qrCountdown}s
              </div>

              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="Dynamic QR Code" 
                  style={{ width: '320px', height: '320px', borderRadius: '0.75rem', display: 'block' }}
                />
              ) : (
                <div style={{ width: 320, height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner" style={{ width: 44, height: 44 }} />
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  QUÉT MÃ QR BẰNG CAMERA ĐIỆN THOẠI
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Mã QR đổi mới sau mỗi {activeSession.refreshSeconds} giây • Không thể chụp ảnh gửi từ xa
                </div>
              </div>
            </div>

            {/* Hoặc truy cập bằng link / PIN */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.08)', padding: '0.75rem 1.5rem', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Hoặc truy cập: </span>
              <strong style={{ color: '#38bdf8', fontSize: '1.05rem' }}>{window.location.host}/diem-danh</strong>
              <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}> nhập mã PIN: </span>
              <strong style={{ color: '#38bdf8', fontSize: '1.2rem', letterSpacing: '2px' }}>{activeSession.code}</strong>
            </div>
          </div>

          {/* Footer máy chiếu: Số lượng sinh viên có mặt cập nhật Live */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981' }} />
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0' }}>
                Đã có mặt: <strong style={{ color: '#10b981', fontSize: '1.4rem' }}>{sessionRecords.length}</strong> sinh viên
              </span>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
              💡 Nhấn phím <strong>ESC</strong> hoặc nút thu nhỏ ở góc trên để quay lại bảng quản trị
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO BUỔI ĐIỂM DANH */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '520px', borderRadius: 'var(--radius-xl)', background: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={22} color="var(--primary)" /> Tạo Buổi Điểm Danh Mới
            </h3>

            <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Tên môn học / Chủ đề buổi học *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Dược lý học - Buổi 4"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Lớp / Khóa học (Tùy chọn)
                </label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: DƯỢC-K18A"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Chu kỳ đổi QR (giây)
                  </label>
                  <select 
                    value={newRefreshSec}
                    onChange={e => setNewRefreshSec(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.6rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value={5}>5 giây (Rất nhanh)</option>
                    <option value={8}>8 giây (Khuyên dùng)</option>
                    <option value={10}>10 giây (Chuẩn)</option>
                    <option value={15}>15 giây</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Cho phép nhiều SV/1 máy
                  </label>
                  <select 
                    value={newAllowMultiple ? 'yes' : 'no'}
                    onChange={e => setNewAllowMultiple(e.target.value === 'yes')}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.6rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="no">Khóa (Chống điểm danh hộ)</option>
                    <option value="yes">Cho phép (Nhiều SV mượn máy)</option>
                  </select>
                </div>
              </div>

              {/* TÙY CHỌN KHÓA GPS BÁN KÍNH LỚP HỌC */}
              <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  <input 
                    type="checkbox" 
                    checked={newRequireGps}
                    onChange={e => {
                      setNewRequireGps(e.target.checked);
                      if (e.target.checked && (!newLat || !newLng)) {
                        handleGetLocation();
                      }
                    }}
                  />
                  <span>Bật khóa vị trí GPS (Chỉ cho phép sinh viên ở phòng học điểm danh)</span>
                </label>

                {newRequireGps && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-xs"
                        onClick={handleGetLocation}
                        disabled={isGettingGps}
                      >
                        <MapPin size={12} /> {isGettingGps ? 'Đang lấy vị trí...' : 'Cập nhật tọa độ GPS'}
                      </button>
                      <span style={{ fontSize: '0.78rem', color: newLat ? '#10b981' : '#ef4444' }}>
                        {newLat ? `Đã lưu: [${newLat}, ${newLng}]` : 'Chưa có tọa độ GPS'}
                      </span>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bán kính cho phép tối đa:</label>
                      <select 
                        value={newMaxDistance}
                        onChange={e => setNewMaxDistance(Number(e.target.value))}
                        style={{ marginLeft: '0.5rem', padding: '0.35rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                      >
                        <option value={50}>50 mét (Trong phòng)</option>
                        <option value={100}>100 mét (Toàn bộ tòa nhà)</option>
                        <option value={200}>200 mét (Khuôn viên)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreating}>
                  {isCreating ? 'Đang tạo phòng...' : '🚀 Bắt Đầu Điểm Danh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

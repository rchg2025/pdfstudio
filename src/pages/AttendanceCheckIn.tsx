import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  ArrowRight
} from 'lucide-react';
import type { AttendanceSession } from '../types/attendance';

/**
 * Sinh chuỗi fingerprint định danh thiết bị nhẹ từ canvas/audio/screen
 */
function getDeviceFingerprint(): string {
  try {
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const navInfo = `${navigator.userAgent}_${navigator.language}`;
    let hash = 0;
    const str = `${screenInfo}_${navInfo}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `dev-${Math.abs(hash).toString(36)}`;
  } catch {
    return `dev-${Math.random().toString(36).substring(2, 10)}`;
  }
}

export default function AttendanceCheckIn() {
  const { code: paramCode } = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('t') || '';

  const { showToast } = useNotification();

  const [inputCode, setInputCode] = useState(paramCode || '');
  const [studentName, setStudentName] = useState(() => localStorage.getItem('rchg_last_student_name') || '');
  const [studentId, setStudentId] = useState(() => localStorage.getItem('rchg_last_student_id') || '');
  const [className, setClassName] = useState(() => localStorage.getItem('rchg_last_class_name') || '');

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [scanSessionToken, setScanSessionToken] = useState<string>('');
  const [isScanVerified, setIsScanVerified] = useState<boolean>(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Tọa độ GPS của sinh viên nếu phòng yêu cầu
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  // Nạp thông tin phòng điểm danh theo mã PIN
  useEffect(() => {
    const targetCode = paramCode || inputCode;
    if (targetCode && targetCode.length >= 6) {
      loadSessionInfo(targetCode);
    }
  }, [paramCode]);

  const loadSessionInfo = async (codeToFetch: string) => {
    setLoadingSession(true);
    setErrorMsg('');
    try {
      let url = `/api/attendance?action=get-session-details&code=${encodeURIComponent(codeToFetch.trim())}`;
      if (tokenFromUrl) {
        url += `&token=${encodeURIComponent(tokenFromUrl.trim())}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        if (data.scanSessionToken) {
          setScanSessionToken(data.scanSessionToken);
          setIsScanVerified(true);
        }
        if (data.session?.className && !className) {
          setClassName(data.session.className);
        }
        if (data.session?.requireGps) {
          requestStudentLocation();
        }
      } else {
        const err = await res.json();
        setErrorMsg(err.message || 'Mã phòng điểm danh không tồn tại!');
        setSession(null);
      }
    } catch (e: any) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setLoadingSession(false);
    }
  };

  const requestStudentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetCode = (paramCode || inputCode).trim();
    if (!targetCode) {
      showToast('Vui lòng nhập mã phòng điểm danh!', 'warning');
      return;
    }
    if (!studentName.trim() || !studentId.trim()) {
      showToast('Vui lòng điền Họ tên và Mã số sinh viên (MSSV)!', 'warning');
      return;
    }

    if (session?.requireGps && (!userLat || !userLng)) {
      showToast('Buổi học yêu cầu vị trí GPS. Vui lòng cho phép quyền vị trí trên trình duyệt!', 'warning');
      requestStudentLocation();
      return;
    }

    setSubmitting(true);
    try {
      const deviceHash = getDeviceFingerprint();

      const res = await fetch('/api/attendance?action=check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: targetCode,
          token: tokenFromUrl,
          scanSessionToken,
          studentName: studentName.trim(),
          studentId: studentId.trim(),
          className: className.trim(),
          deviceHash,
          latitude: userLat,
          longitude: userLng
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessResult(data);
        localStorage.setItem('rchg_last_student_name', studentName.trim());
        localStorage.setItem('rchg_last_student_id', studentId.trim());
        if (className) localStorage.setItem('rchg_last_class_name', className.trim());
        showToast(data.message || 'Điểm danh thành công!', 'success');
      } else {
        setErrorMsg(data.message || 'Điểm danh thất bại');
        showToast(data.message || 'Không thể điểm danh', 'error');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Lỗi mạng khi gửi thông tin điểm danh');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="attendance-container animate-fade-in" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="attendance-student-checkin">
        {/* TIÊU ĐỀ */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.12)',
            color: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <QrCode size={28} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.4rem', color: 'var(--text-primary)' }}>
            Điểm Danh Trực Tuyến
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
            Hệ thống xác thực sinh viên có mặt tại lớp học bằng mã QR thông minh.
          </p>
        </div>

        {/* NẾU ĐÃ ĐIỂM DANH THÀNH CÔNG */}
        {successResult ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <CheckCircle2 size={40} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', marginBottom: '0.5rem' }}>
              {successResult.isAlreadyCheckedIn ? 'Đã Ghi Nhận Điểm Danh' : 'Điểm Danh Thành Công!'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
              {successResult.message}
            </p>

            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-lg)', textAlign: 'left', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div>Sinh viên: <strong style={{ color: 'var(--text-primary)' }}>{studentName}</strong></div>
              <div>MSSV: <strong style={{ color: 'var(--primary)' }}>{studentId}</strong></div>
              <div>Lớp: <strong>{className || session?.className || 'Lớp học'}</strong></div>
              <div>Môn học: <strong>{session?.title || 'Buổi học'}</strong></div>
              <div>Thời gian: <strong>{new Date().toLocaleTimeString('vi-VN')}</strong></div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => {
                setSuccessResult(null);
                window.location.reload();
              }}
              style={{ width: '100%', borderRadius: '50px' }}
            >
              Hoàn Tất
            </button>
          </div>
        ) : (
          /* FORM NHẬP THÔNG TIN ĐIỂM DANH */
          <form onSubmit={handleCheckInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {errorMsg && (
              <div style={{ padding: '0.85rem 1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Thông tin phòng học nhận diện được */}
            {session ? (
              <div style={{ padding: '0.85rem 1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                {isScanVerified && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <CheckCircle2 size={16} />
                    <span>Đã quét mã QR thành công (Hợp lệ trong 20 phút)</span>
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Buổi học đang điểm danh:
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {session.title}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  Mã PIN: <strong style={{ color: 'var(--primary)' }}>{session.code}</strong> {session.className && `• Lớp: ${session.className}`}
                </div>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Mã PIN phòng học (6 số) *
                </label>
                <input 
                  type="text" 
                  maxLength={6}
                  required
                  placeholder="Nhập 6 số mã PIN trên máy chiếu"
                  value={inputCode}
                  onChange={e => {
                    setInputCode(e.target.value);
                    if (e.target.value.length === 6) {
                      loadSessionInfo(e.target.value);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    letterSpacing: '4px',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Họ và tên của bạn *
              </label>
              <input 
                type="text" 
                required
                placeholder="Ví dụ: Nguyễn Văn A"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Mã sinh viên (MSSV) *
              </label>
              <input 
                type="text" 
                required
                placeholder="Ví dụ: 20240199 hoặc SBD"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Lớp / Khóa học
              </label>
              <input 
                type="text" 
                placeholder="Ví dụ: DƯỢC-K18"
                value={className}
                onChange={e => setClassName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            {/* Trạng thái vị trí GPS nếu giảng viên yêu cầu */}
            {session?.requireGps && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: userLat ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                  <MapPin size={16} />
                  <span>{userLat ? 'Đã nhận tọa độ GPS của bạn' : 'Yêu cầu định vị GPS lớp học'}</span>
                </div>
                {!userLat && (
                  <button 
                    type="button" 
                    className="btn btn-outline btn-xs"
                    onClick={requestStudentLocation}
                  >
                    Bật GPS
                  </button>
                )}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting || loadingSession}
              style={{ width: '100%', padding: '0.85rem', borderRadius: '50px', fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {submitting ? 'Đang gửi thông tin...' : 'Xác Nhận Có Mặt Tại Lớp'} <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

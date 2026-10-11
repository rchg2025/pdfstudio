import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { LeaderboardGroup, StudentScore, Badge } from '../types/leaderboard';
import { 
  Trophy, 
  Medal, 
  Plus, 
  Flame, 
  Maximize2, 
  Minimize2, 
  FileSpreadsheet, 
  UserPlus, 
  Trash2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Crown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import './LeaderboardManager.css';

export default function LeaderboardManager() {
  const { token } = useAuth();
  const { showToast } = useNotification();

  const [groups, setGroups] = useState<LeaderboardGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<LeaderboardGroup | null>(null);
  const [students, setStudents] = useState<StudentScore[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);

  // Phân trang danh sách nhóm thi đua (hiển thị 1 hàng ngang)
  const [groupPage, setGroupPage] = useState(1);
  const groupsPerPage = 4;

  // Phân trang danh sách học viên
  const [studentPage, setStudentPage] = useState(1);
  const studentsPerPage = 10;

  // Tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');

  // Chế độ máy chiếu vinh danh toàn màn hình (Projector Mode)
  const [showProjector, setShowProjector] = useState(false);

  // Modal tạo nhóm mới
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupClass, setNewGroupClass] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Modal thêm học viên / import từ điểm danh
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [inputStudentText, setInputStudentText] = useState('');
  const [importAttendanceList, setImportAttendanceList] = useState<any[]>([]);

  // 1. Tải danh sách nhóm thi đua của giảng viên
  const fetchGroups = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard?action=get-my-groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
        if (data.groups?.length > 0 && !activeGroup) {
          fetchGroupDetails(data.groups[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [token]);

  // 2. Lấy chi tiết nhóm thi đua & bảng điểm học viên
  const fetchGroupDetails = async (groupId: string) => {
    try {
      const res = await fetch(`/api/leaderboard?action=get-group-details&groupId=${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveGroup(data.group);
        setStudents(data.group?.students || []);
        setAvailableBadges(data.badges || []);
        setStudentPage(1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Tạo nhóm thi đua mới
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      showToast('Vui lòng nhập tên lớp/nhóm thi đua', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/leaderboard?action=create-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newGroupName.trim(),
          className: newGroupClass.trim() || null,
          description: newGroupDesc.trim() || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast('Đã tạo nhóm thi đua thành công!', 'success');
        setGroups(prev => [data.group, ...prev]);
        setActiveGroup(data.group);
        setStudents([]);
        setShowCreateGroupModal(false);
        setNewGroupName('');
        setNewGroupClass('');
        setNewGroupDesc('');
      } else {
        const err = await res.json();
        showToast(err.message || 'Lỗi khi tạo nhóm', 'error');
      }
    } catch {
      showToast('Lỗi mạng', 'error');
    }
  };

  // 4. Cộng / Trừ điểm nhanh cho học viên
  const handleAdjustPoints = async (studentScoreId: string, points: number, defaultReason?: string) => {
    try {
      const res = await fetch('/api/leaderboard?action=adjust-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentScoreId,
          points,
          reason: defaultReason || (points > 0 ? 'Phát biểu đóng góp xây dựng bài' : 'Nhắc nhở nội quy')
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message, points > 0 ? 'success' : 'info');
        
        // Cập nhật state trực tiếp và sắp xếp lại bảng xếp hạng
        setStudents(prev => {
          const updated = prev.map(s => s.id === studentScoreId ? {
            ...s,
            totalPoints: data.studentScore.totalPoints,
            level: data.studentScore.level,
            streak: data.studentScore.streak
          } : s);
          return updated.sort((a, b) => b.totalPoints - a.totalPoints || a.studentName.localeCompare(b.studentName));
        });
      }
    } catch {
      showToast('Lỗi khi điều chỉnh điểm', 'error');
    }
  };

  // 5. Trao huy hiệu cho học viên
  const handleAwardBadge = async (studentScoreId: string, badgeId: string) => {
    try {
      const res = await fetch('/api/leaderboard?action=award-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentScoreId, badgeId })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message, 'success');
        if (activeGroup) fetchGroupDetails(activeGroup.id);
      } else {
        const err = await res.json();
        showToast(err.message, 'warning');
      }
    } catch {}
  };

  // 6. Xóa học viên khỏi nhóm
  const handleDeleteStudent = async (studentScoreId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học viên này khỏi bảng thi đua?')) return;
    try {
      const res = await fetch('/api/leaderboard?action=delete-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentScoreId })
      });
      if (res.ok) {
        setStudents(prev => prev.filter(s => s.id !== studentScoreId));
        showToast('Đã xóa học viên', 'info');
      }
    } catch {}
  };

  // 7. Thêm học viên bằng paste danh sách (hoặc từ buổi điểm danh)
  const handleAddStudentsSubmit = async () => {
    if (!activeGroup) return;

    const listToAdd: { studentName: string; studentId: string; className?: string }[] = [];

    // Parse từ text
    if (inputStudentText.trim()) {
      const lines = inputStudentText.split('\n');
      for (const line of lines) {
        const parts = line.split(/[,\t|]/).map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          listToAdd.push({
            studentName: parts[0],
            studentId: parts[1],
            className: parts[2] || activeGroup.className || undefined
          });
        } else if (parts.length === 1 && parts[0]) {
          // Chỉ có tên, sinh mã tạm
          listToAdd.push({
            studentName: parts[0],
            studentId: `SV${Math.floor(1000 + Math.random() * 9000)}`,
            className: activeGroup.className || undefined
          });
        }
      }
    }

    if (listToAdd.length === 0) {
      showToast('Vui lòng nhập ít nhất 1 học viên (Định dạng: Họ tên, MSSV, Lớp)', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/leaderboard?action=add-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: activeGroup.id,
          students: listToAdd
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message, 'success');
        setShowAddStudentModal(false);
        setInputStudentText('');
        fetchGroupDetails(activeGroup.id);
      }
    } catch {
      showToast('Lỗi khi nạp danh sách học viên', 'error');
    }
  };

  // 8. Đồng bộ danh sách học viên từ Buổi Điểm Danh QR
  const loadAttendanceSessions = async () => {
    try {
      const res = await fetch('/api/attendance?action=get-my-sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setImportAttendanceList(data.sessions || []);
      }
    } catch {}
  };

  const importFromAttendance = async (sessionId: string) => {
    if (!activeGroup) return;
    try {
      const res = await fetch(`/api/attendance?action=get-session-details&sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        const records = data.session?.records || [];
        if (records.length === 0) {
          showToast('Buổi điểm danh này chưa có sinh viên nào!', 'warning');
          return;
        }

        const studentsToAdd = records.map((r: any) => ({
          studentName: r.studentName,
          studentId: r.studentId,
          className: r.className || activeGroup.className
        }));

        const addRes = await fetch('/api/leaderboard?action=add-students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId: activeGroup.id,
            students: studentsToAdd
          })
        });

        if (addRes.ok) {
          const resData = await addRes.json();
          showToast(resData.message, 'success');
          setShowAddStudentModal(false);
          fetchGroupDetails(activeGroup.id);
        }
      }
    } catch {
      showToast('Lỗi đồng bộ từ điểm danh', 'error');
    }
  };

  // 9. Xuất file Excel bảng vinh danh & điểm tích lũy
  const handleExportExcel = () => {
    if (!activeGroup || students.length === 0) {
      showToast('Chưa có dữ liệu học viên để xuất file!', 'warning');
      return;
    }

    const header = [
      ['BẢNG VINH DANH & TỔNG KẾT ĐIỂM THI ĐUA HỌC TẬP'],
      ['Lớp / Nhóm thi đua:', activeGroup.name],
      ['Lớp học:', activeGroup.className || 'Tự do'],
      ['Tổng số học viên:', `${students.length} học viên`],
      ['Thời gian xuất file:', new Date().toLocaleString('vi-VN')],
      []
    ];

    const tableHeaders = [
      'Hạng (Rank)',
      'Họ và tên học viên',
      'Mã SV (MSSV)',
      'Lớp',
      'Tổng điểm tích lũy',
      'Cấp độ (Level)',
      'Chuỗi phát biểu',
      'Danh hiệu / Huy hiệu đạt được'
    ];

    const tableRows = students.map((s, idx) => [
      idx + 1,
      s.studentName,
      s.studentId,
      s.className || '',
      s.totalPoints,
      `Lv.${s.level}`,
      s.streak,
      s.badges?.map(b => b.badge.name).join(', ') || 'Chưa có'
    ]);

    const worksheetData = [...header, tableHeaders, ...tableRows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws['!cols'] = [
      { wch: 12 },
      { wch: 28 },
      { wch: 18 },
      { wch: 16 },
      { wch: 20 },
      { wch: 14 },
      { wch: 16 },
      { wch: 40 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VinhDanh');

    const fileName = `VinhDanh_${activeGroup.name}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast('Đã xuất file Excel bảng vinh danh thành công!', 'success');
  };

  // Lọc tìm kiếm học viên
  const filteredStudents = students.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.studentName.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      (s.className && s.className.toLowerCase().includes(q))
    );
  });

  // Phân trang
  const totalGroupPages = Math.ceil(groups.length / groupsPerPage) || 1;
  const currentGroups = groups.slice((groupPage - 1) * groupsPerPage, groupPage * groupsPerPage);

  const totalStudentPages = Math.ceil(filteredStudents.length / studentsPerPage) || 1;
  const currentStudents = filteredStudents.slice((studentPage - 1) * studentsPerPage, studentPage * studentsPerPage);

  // Top 1, 2, 3 cho bục vinh danh (Podium)
  const top1 = students[0] || null;
  const top2 = students[1] || null;
  const top3 = students[2] || null;

  return (
    <div className="leaderboard-container animate-fade-in">
      {/* HEADER */}
      <div className="leaderboard-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '0.75rem', color: '#f59e0b' }}>
              <Trophy size={28} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Bảng Vinh Danh & Tích Điểm
            </h1>
            <span style={{ fontSize: '0.75rem', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', padding: '0.2rem 0.65rem', borderRadius: '30px', fontWeight: 800 }}>
              Gamification
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.92rem' }}>
            Cộng điểm phát biểu, vinh danh Top 1-2-3 và trao huy hiệu học tập hào hứng cho sinh viên.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => setShowCreateGroupModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '50px', padding: '0.65rem 1.4rem' }}
          >
            <Plus size={18} /> Tạo Lớp Thi Đua Mới
          </button>
        </div>
      </div>

      {/* DANH SÁCH LỚP / NHÓM THI ĐUA HIỂN THỊ TRÊN 1 DÒNG CÓ PHÂN TRANG */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Medal size={18} color="#f59e0b" /> Danh sách lớp thi đua của bạn ({groups.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách lớp thi đua...</p>
          </div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
            <Trophy size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Chưa có lớp thi đua nào</h4>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 1.5rem' }}>
              Hãy bấm <strong>Tạo Lớp Thi Đua Mới</strong> để bắt đầu tích điểm phát biểu và vinh danh học viên xuất sắc.
            </p>
            <button className="btn btn-primary" onClick={() => setShowCreateGroupModal(true)}>
              <Plus size={16} /> Bắt đầu tạo ngay
            </button>
          </div>
        ) : (
          <div>
            <div className="leaderboard-groups-row">
              {currentGroups.map((g) => {
                const isSelected = activeGroup?.id === g.id;
                return (
                  <div
                    key={g.id}
                    className="leaderboard-group-card"
                    style={{
                      cursor: 'pointer',
                      borderColor: isSelected ? 'var(--primary)' : undefined,
                      background: isSelected ? 'rgba(99, 102, 241, 0.05)' : undefined
                    }}
                    onClick={() => fetchGroupDetails(g.id)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
                          🏆 THI ĐUA
                        </span>
                        {g.className && (
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {g.className}
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0 0.35rem' }}>
                        {g.name}
                      </h4>
                      {g.description && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {g.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        👥 {g._count?.students || 0} học viên
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(g.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phân trang nhóm */}
            {totalGroupPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '0.5rem 0.25rem', marginTop: '-0.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Trang <strong>{groupPage}</strong> / {totalGroupPages} (Hiển thị {currentGroups.length} / {groups.length} lớp)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    disabled={groupPage <= 1}
                    onClick={() => setGroupPage(prev => Math.max(1, prev - 1))}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.7rem' }}
                  >
                    <ChevronLeft size={14} /> Trước
                  </button>
                  {Array.from({ length: totalGroupPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`btn btn-xs ${groupPage === p ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setGroupPage(p)}
                      style={{ minWidth: 28, padding: '0.25rem 0.5rem', fontWeight: groupPage === p ? 800 : 500 }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    disabled={groupPage >= totalGroupPages}
                    onClick={() => setGroupPage(prev => Math.min(totalGroupPages, prev + 1))}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.7rem' }}
                  >
                    Sau <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CHI TIẾT BẢNG VINH DANH LỚP ĐANG CHỌN */}
      {activeGroup && (
        <div className="glass-card animate-fade-in" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
          {/* Header thanh hành động */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {activeGroup.name}
                </h2>
                {activeGroup.className && (
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '30px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)' }}>
                    Lớp: {activeGroup.className}
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.88rem' }}>
                Tổng cộng: <strong style={{ color: 'var(--primary)' }}>{students.length}</strong> học viên đang tham gia tích điểm
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {/* Nút Chiếu Toàn Màn Hình Máy Chiếu */}
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setShowProjector(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, borderRadius: '50px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none' }}
              >
                <Maximize2 size={16} /> Chiếu Bục Vinh Danh (Full)
              </button>

              {/* Nút Nạp học viên */}
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => {
                  setShowAddStudentModal(true);
                  loadAttendanceSessions();
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '50px' }}
              >
                <UserPlus size={16} /> Thêm Học Viên
              </button>

              {/* Nút Xuất Excel */}
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={handleExportExcel}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '50px' }}
              >
                <FileSpreadsheet size={16} color="#10b981" /> Xuất Excel
              </button>
            </div>
          </div>

          {/* BỤC VINH DANH TOP 1 - TOP 2 - TOP 3 (PODIUM) TRỰC QUAN */}
          {students.length > 0 && (
            <div className="leaderboard-podium-container">
              {/* TOP 2 - HẠNG NHÌ (BẠC) */}
              <div className="podium-pillar">
                {top2 ? (
                  <>
                    <div className="podium-avatar" style={{ borderColor: '#cbd5e1' }}>
                      🥈
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {top2.studentName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {top2.studentId} • <strong style={{ color: '#64748b' }}>{top2.totalPoints}đ</strong>
                    </div>
                    <div className="podium-box podium-silver">
                      <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff' }}>2</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#e2e8f0', letterSpacing: '1px' }}>HẠNG NHÌ</span>
                    </div>
                  </>
                ) : (
                  <div style={{ height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>-</div>
                )}
              </div>

              {/* TOP 1 - QUÁN QUÂN (VÀNG) */}
              <div className="podium-pillar">
                {top1 ? (
                  <>
                    <div style={{ position: 'relative' }}>
                      <Crown size={28} color="#f59e0b" style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', filter: 'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.6))' }} />
                      <div className="podium-avatar" style={{ borderColor: '#fbbf24', transform: 'scale(1.1)' }}>
                        🥇
                      </div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#f59e0b', marginBottom: '0.2rem' }}>
                      {top1.studentName}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {top1.studentId} • <strong style={{ color: '#d97706', fontSize: '1rem' }}>{top1.totalPoints}đ</strong>
                    </div>
                    <div className="podium-box podium-gold">
                      <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>1</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fef3c7', letterSpacing: '2px' }}>QUÁN QUÂN</span>
                    </div>
                  </>
                ) : (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chưa có học viên</div>
                )}
              </div>

              {/* TOP 3 - HẠNG BA (ĐỒNG) */}
              <div className="podium-pillar">
                {top3 ? (
                  <>
                    <div className="podium-avatar" style={{ borderColor: '#f59e0b' }}>
                      🥉
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {top3.studentName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {top3.studentId} • <strong style={{ color: '#b45309' }}>{top3.totalPoints}đ</strong>
                    </div>
                    <div className="podium-box podium-bronze">
                      <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff' }}>3</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffedd5', letterSpacing: '1px' }}>HẠNG BA</span>
                    </div>
                  </>
                ) : (
                  <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>-</div>
                )}
              </div>
            </div>
          )}

          {/* TÌM KIẾM & BẢNG ĐIỂM CHI TIẾT */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Tìm học viên theo tên, MSSV..."
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
              Đang hiển thị: <strong>{filteredStudents.length}</strong> / {students.length} học viên
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1.5px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem', width: 70, textAlign: 'center' }}>Hạng</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Học viên</th>
                  <th style={{ padding: '0.75rem 1rem' }}>MSSV</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Cấp độ (Level)</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Tổng điểm</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Huy hiệu</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Cộng điểm nhanh</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: 60 }}>Xóa</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      Chưa có học viên nào trong danh sách. Hãy nhấn <strong>Thêm Học Viên</strong> để bắt đầu!
                    </td>
                  </tr>
                ) : (
                  currentStudents.map((s, idx) => {
                    const rank = (studentPage - 1) * studentsPerPage + idx + 1;
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                        {/* Cột Hạng */}
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          {rank === 1 ? (
                            <span style={{ fontSize: '1.25rem' }}>🥇</span>
                          ) : rank === 2 ? (
                            <span style={{ fontSize: '1.25rem' }}>🥈</span>
                          ) : rank === 3 ? (
                            <span style={{ fontSize: '1.25rem' }}>🥉</span>
                          ) : (
                            <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{rank}</span>
                          )}
                        </td>

                        {/* Học viên */}
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{s.studentName}</div>
                          {s.className && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lớp: {s.className}</div>}
                        </td>

                        {/* MSSV */}
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {s.studentId}
                        </td>

                        {/* Cấp độ */}
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)' }}>
                            Lv.{s.level}
                          </span>
                          {s.streak > 1 && (
                            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, marginLeft: '0.4rem', display: 'inline-flex', alignItems: 'center' }}>
                              <Flame size={13} fill="#f59e0b" /> {s.streak}
                            </span>
                          )}
                        </td>

                        {/* Tổng điểm */}
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <strong style={{ fontSize: '1.15rem', color: '#f59e0b' }}>{s.totalPoints}</strong>
                        </td>

                        {/* Huy hiệu */}
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                            {s.badges && s.badges.length > 0 ? (
                              s.badges.map(b => (
                                <span key={b.id} className="badge-pill" title={b.badge.description} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                                  <span>{b.badge.icon}</span>
                                  <span>{b.badge.name}</span>
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chưa có</span>
                            )}

                            {/* Dropdown trao thêm huy hiệu */}
                            <select
                              defaultValue=""
                              onChange={e => {
                                if (e.target.value) {
                                  handleAwardBadge(s.id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.15rem 0.35rem',
                                borderRadius: '4px',
                                border: '1px dashed var(--border)',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="" disabled>+ Trao huy hiệu</option>
                              {availableBadges.map(b => (
                                <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* Nút cộng điểm nhanh */}
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              type="button"
                              className="quick-point-btn btn-point-plus"
                              onClick={() => handleAdjustPoints(s.id, 1, 'Phát biểu đúng (+1)')}
                              title="Cộng 1 điểm phát biểu"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              className="quick-point-btn btn-point-plus"
                              onClick={() => handleAdjustPoints(s.id, 2, 'Bài tập xuất sắc (+2)')}
                              title="Cộng 2 điểm làm bài tốt"
                            >
                              +2
                            </button>
                            <button
                              type="button"
                              className="quick-point-btn btn-point-plus"
                              onClick={() => handleAdjustPoints(s.id, 5, 'Thành tích vượt trội (+5)')}
                              title="Cộng 5 điểm vượt trội"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              className="quick-point-btn btn-point-minus"
                              onClick={() => handleAdjustPoints(s.id, -1, 'Mất trật tự / Vi phạm (-1)')}
                              title="Trừ 1 điểm vi phạm"
                            >
                              -1
                            </button>
                          </div>
                        </td>

                        {/* Xóa */}
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => handleDeleteStudent(s.id)}
                            style={{ color: '#ef4444' }}
                            title="Xóa học viên"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang danh sách học viên */}
          {totalStudentPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Hiển thị <strong>{currentStudents.length}</strong> / <strong>{filteredStudents.length}</strong> học viên (Trang <strong>{studentPage}</strong> / {totalStudentPages})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  disabled={studentPage <= 1}
                  onClick={() => setStudentPage(prev => Math.max(1, prev - 1))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.7rem' }}
                >
                  <ChevronLeft size={14} /> Trước
                </button>
                {Array.from({ length: totalStudentPages }, (_, i) => i + 1).map((p) => {
                  if (totalStudentPages > 7 && Math.abs(p - studentPage) > 2 && p !== 1 && p !== totalStudentPages) {
                    if (p === 2 || p === totalStudentPages - 1) {
                      return <span key={p} style={{ padding: '0 0.2rem', color: 'var(--text-muted)' }}>...</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`btn btn-xs ${studentPage === p ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setStudentPage(p)}
                      style={{ minWidth: 28, padding: '0.25rem 0.5rem', fontWeight: studentPage === p ? 800 : 500 }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  disabled={studentPage >= totalStudentPages}
                  onClick={() => setStudentPage(prev => Math.min(totalStudentPages, prev + 1))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.7rem' }}
                >
                  Sau <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL MÁY CHIẾU TOÀN MÀN HÌNH (PROJECTOR FULLSCREEN LEADERBOARD) */}
      {showProjector && activeGroup && (
        <div className="leaderboard-projector-modal animate-fade-in">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.9rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}>
                BẢNG VINH DANH HỌC TẬP THỜI GIAN THỰC
              </span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0.25rem 0 0', color: '#ffffff' }}>
                {activeGroup.name}
              </h2>
              {activeGroup.className && (
                <p style={{ margin: 0, color: '#93c5fd', fontSize: '1.15rem', fontWeight: 600 }}>
                  Lớp: {activeGroup.className}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowProjector(false)}
                style={{ borderRadius: '50%', width: 48, height: 48, padding: 0, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                title="Đóng chế độ máy chiếu"
              >
                <Minimize2 size={22} />
              </button>
            </div>
          </div>

          {/* VÙNG PODIUM TOP 1-2-3 MÁY CHIẾU LỘNG LẪY */}
          <div style={{ margin: 'auto', width: '100%', maxWidth: '1000px' }}>
            <div className="leaderboard-podium-container" style={{ margin: '0 0 2rem' }}>
              {/* TOP 2 */}
              <div className="podium-pillar" style={{ width: '220px' }}>
                {top2 && (
                  <>
                    <div className="podium-avatar" style={{ width: 84, height: 84, fontSize: '2.5rem', borderColor: '#cbd5e1' }}>
                      🥈
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.2rem' }}>
                      {top2.studentName}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                      {top2.studentId} • <strong style={{ color: '#e2e8f0', fontSize: '1.1rem' }}>{top2.totalPoints}đ</strong>
                    </div>
                    <div className="podium-box podium-silver" style={{ height: 210 }}>
                      <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#ffffff' }}>2</span>
                      <span style={{ fontSize: '1rem', fontWeight: 900, color: '#f1f5f9', letterSpacing: '2px' }}>HẠNG NHÌ</span>
                    </div>
                  </>
                )}
              </div>

              {/* TOP 1 */}
              <div className="podium-pillar" style={{ width: '250px' }}>
                {top1 && (
                  <>
                    <div style={{ position: 'relative' }}>
                      <Crown size={38} color="#fbbf24" style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', filter: 'drop-shadow(0 4px 10px rgba(251, 191, 36, 0.8))' }} />
                      <div className="podium-avatar" style={{ width: 100, height: 100, fontSize: '3rem', borderColor: '#fbbf24', transform: 'scale(1.15)' }}>
                        👑
                      </div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.45rem', color: '#fbbf24', margin: '0.5rem 0 0.2rem' }}>
                      {top1.studentName}
                    </div>
                    <div style={{ fontSize: '0.95rem', color: '#fef3c7', marginBottom: '0.75rem' }}>
                      {top1.studentId} • <strong style={{ color: '#fbbf24', fontSize: '1.35rem' }}>{top1.totalPoints}đ</strong>
                    </div>
                    <div className="podium-box podium-gold" style={{ height: 270 }}>
                      <span style={{ fontSize: '4.8rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>1</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fef3c7', letterSpacing: '3px' }}>QUÁN QUÂN</span>
                    </div>
                  </>
                )}
              </div>

              {/* TOP 3 */}
              <div className="podium-pillar" style={{ width: '220px' }}>
                {top3 && (
                  <>
                    <div className="podium-avatar" style={{ width: 84, height: 84, fontSize: '2.5rem', borderColor: '#f59e0b' }}>
                      🥉
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.2rem' }}>
                      {top3.studentName}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                      {top3.studentId} • <strong style={{ color: '#ffedd5', fontSize: '1.1rem' }}>{top3.totalPoints}đ</strong>
                    </div>
                    <div className="podium-box podium-bronze" style={{ height: 170 }}>
                      <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#ffffff' }}>3</span>
                      <span style={{ fontSize: '1rem', fontWeight: 900, color: '#ffedd5', letterSpacing: '2px' }}>HẠNG BA</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* TOP 4 ĐẾN TOP 10 HIỂN THỊ DƯỚI DẠNG THẺ */}
            {students.length > 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', padding: '0.5rem' }}>
                {students.slice(3, 10).map((s, idx) => (
                  <div key={s.id} style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '1rem', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: 900, fontSize: '1rem', color: '#94a3b8' }}>#{idx + 4}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>{s.studentName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.studentId}</div>
                      </div>
                    </div>
                    <strong style={{ fontSize: '1.1rem', color: '#fbbf24' }}>{s.totalPoints}đ</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.95rem', color: '#94a3b8' }}>
              ✨ Thi đua học tập tích cực • Tích lũy điểm đổi phần thưởng và huy hiệu danh dự
            </div>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
              Nhấn <strong>ESC</strong> hoặc nút thu nhỏ ở góc trên để quay lại
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO LỚP THI ĐUA MỚI */}
      {showCreateGroupModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '480px', borderRadius: 'var(--radius-xl)', background: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy size={22} color="#f59e0b" /> Tạo Lớp Thi Đua Mới
            </h3>

            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Tên lớp / Nhóm thi đua *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Dược K18 - Học kỳ 1"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Tên lớp học (Tùy chọn)
                </label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: TC26-CSNDT"
                  value={newGroupClass}
                  onChange={e => setNewGroupClass(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Mô tả / Thể lệ thi đua (Tùy chọn)
                </label>
                <textarea 
                  rows={3}
                  placeholder="Ví dụ: Tích điểm phát biểu (+1đ), bài kiểm tra tốt (+2đ). Cuối kỳ Top 3 nhận quà."
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateGroupModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Tạo Nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM HỌC VIÊN HOẶC ĐỒNG BỘ TỪ ĐIỂM DANH */}
      {showAddStudentModal && activeGroup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '580px', borderRadius: 'var(--radius-xl)', background: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={22} color="var(--primary)" /> Thêm Học Viên Vào Bảng Thi Đua
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Bạn có thể nhập danh sách hoặc chọn đồng bộ nhanh từ buổi điểm danh QR đã có.
            </p>

            {/* Cách 1: Đồng bộ từ buổi điểm danh */}
            <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem' }}>
                ⚡ Cách 1: Lấy danh sách từ Buổi Điểm Danh QR
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  id="import-session-select"
                  style={{ flex: 1, padding: '0.65rem 0.75rem', borderRadius: '0.6rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none' }}
                >
                  <option value="">-- Chọn buổi điểm danh để lấy sinh viên --</option>
                  {importAttendanceList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.code}) - {s._count?.records || 0} SV
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const sel = document.getElementById('import-session-select') as HTMLSelectElement;
                    if (sel && sel.value) {
                      importFromAttendance(sel.value);
                    } else {
                      showToast('Vui lòng chọn 1 buổi điểm danh', 'warning');
                    }
                  }}
                >
                  Đồng bộ ngay
                </button>
              </div>
            </div>

            {/* Cách 2: Paste danh sách text */}
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                📝 Cách 2: Dán danh sách học viên (Mỗi dòng 1 học viên)
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.4rem' }}>
                Định dạng: <code>Họ và tên, Mã SV, Lớp</code> (hoặc copy từ Excel sang)
              </p>
              <textarea 
                rows={6}
                placeholder="Nguyễn Văn A, 202401, Dược-K18&#10;Trần Thị B, 202402, Dược-K18&#10;Lê Hoàng C, 202403"
                value={inputStudentText}
                onChange={e => setInputStudentText(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowAddStudentModal(false)}>
                Đóng
              </button>
              <button type="button" className="btn btn-primary" onClick={handleAddStudentsSubmit}>
                Nạp Danh Sách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

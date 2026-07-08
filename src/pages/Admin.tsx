import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

export default function Admin() {
  const { user, token } = useAuth();
  const { showToast, showConfirm } = useNotification();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('frames');
  
  // States cho Khung hình
  const [frames, setFrames] = useState<any[]>([]);
  const [loadingFrames, setLoadingFrames] = useState(false);
  const [framesPage, setFramesPage] = useState(1);
  const [editingFrame, setEditingFrame] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');

  // States cho Người dùng
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userTimeFilter, setUserTimeFilter] = useState('all');

  // States cho Cấu hình
  const [settings, setSettings] = useState({
    smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '',
    googleClientId: '', googleClientSecret: '',
    googleDriveFolderId: '', googleDriveServiceJson: ''
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingDrive, setTestingDrive] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('google');

  const itemsPerPage = 10;

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    
    if (activeTab === 'frames') fetchFrames();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab]);

  const fetchFrames = async () => {
    setLoadingFrames(true);
    try {
      const res = await fetch('/api/admin/frames', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setFrames(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFrames(false);
    }
  };

  const deleteFrame = (id: string) => {
    showConfirm('Bạn có chắc chắn muốn xóa khung hình này?', async () => {
      try {
        const res = await fetch(`/api/admin/frames?id=${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchFrames();
          showToast('Xóa khung hình thành công', 'success');
        } else {
          showToast('Xóa khung hình thất bại', 'error');
        }
      } catch (e) {
        console.error(e);
        showToast('Lỗi khi xóa khung hình', 'error');
      }
    });
  };

  const saveFrame = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/frames', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editingFrame)
      });
      if (res.ok) {
        setEditingFrame(null);
        fetchFrames();
        showToast('Lưu khung hình thành công', 'success');
      } else {
        const d = await res.json();
        showToast(d.message || 'Lỗi khi lưu khung hình', 'error');
      }
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const deleteUser = (id: string) => {
    showConfirm('Bạn có chắc chắn muốn xóa tài khoản này?', async () => {
      try {
        const res = await fetch(`/api/admin/users?id=${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchUsers();
          showToast('Xóa tài khoản thành công', 'success');
        } else {
          showToast('Xóa tài khoản thất bại', 'error');
        }
      } catch (e) {
        console.error(e);
        showToast('Lỗi khi xóa tài khoản', 'error');
      }
    });
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isNew = !editingUser.id;
      const res = await fetch('/api/admin/users', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editingUser)
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
        showToast('Lưu người dùng thành công', 'success');
      } else {
        const d = await res.json();
        showToast(d.message || 'Lỗi khi lưu người dùng', 'error');
      }
    } catch (e) { console.error(e); }
  };

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const newSettings = { ...settings };
        data.forEach((s: any) => {
          if (newSettings.hasOwnProperty(s.key)) {
            (newSettings as any)[s.key] = s.value;
          }
        });
        setSettings(newSettings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSettings(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const settingsArray = Object.keys(settings).map(key => ({
        key,
        value: (settings as any)[key]
      }));

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ settings: settingsArray })
      });
      
      if (res.ok) {
        showToast('Lưu cấu hình thành công!', 'success');
      } else {
        showToast('Lưu thất bại!', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Lưu thất bại!', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestDrive = async () => {
    setTestingDrive(true);
    try {
      const res = await fetch('/api/admin/test-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          googleDriveFolderId: settings.googleDriveFolderId, 
          googleDriveServiceJson: settings.googleDriveServiceJson 
        })
      });
      const data = await res.json();
      if (res.ok) showToast(`Thành công: ${data.message}\nThư mục: ${data.folderName}`, 'success');
      else showToast(`Lỗi: ${data.message}\n${data.error || ''}`, 'error');
    } catch (err) {
      showToast('Lỗi kết nối API', 'error');
    } finally {
      setTestingDrive(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    try {
      const res = await fetch('/api/admin/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          smtpHost: settings.smtpHost, 
          smtpPort: settings.smtpPort,
          smtpUser: settings.smtpUser,
          smtpPass: settings.smtpPass
        })
      });
      const data = await res.json();
      if (res.ok) showToast(`Thành công: ${data.message}`, 'success');
      else showToast(`Lỗi: ${data.message}\n${data.error || ''}`, 'error');
    } catch (err) {
      showToast('Lỗi kết nối API', 'error');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Pagination & Filtering Logic
  const filteredFrames = frames.filter((frame: any) => {
    // 1. Search Query
    const query = searchQuery.toLowerCase();
    const matchSearch = !query || 
      frame.title?.toLowerCase().includes(query) || 
      frame.slug?.toLowerCase().includes(query) || 
      frame.user?.name?.toLowerCase().includes(query) || 
      frame.user?.email?.toLowerCase().includes(query);

    // 2. Time Filter
    let matchTime = true;
    if (timeFilter !== 'all' && frame.createdAt) {
      const createdDate = new Date(frame.createdAt);
      const now = new Date();
      if (timeFilter === 'today') {
        matchTime = createdDate.toDateString() === now.toDateString();
      } else if (timeFilter === 'week') {
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        matchTime = diffDays <= 7;
      } else if (timeFilter === 'month') {
        matchTime = createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
      }
    }
    return matchSearch && matchTime;
  });

  const paginatedFrames = filteredFrames.slice((framesPage - 1) * itemsPerPage, framesPage * itemsPerPage);
  const totalFramePages = Math.ceil(filteredFrames.length / itemsPerPage);

  const filteredUsers = users.filter((u: any) => {
    // Search
    const query = userSearchQuery.toLowerCase();
    const matchSearch = !query || 
      u.email?.toLowerCase().includes(query) || 
      u.name?.toLowerCase().includes(query);

    // Role Filter
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;

    // Time Filter
    let matchTime = true;
    if (userTimeFilter !== 'all' && u.createdAt) {
      const createdDate = new Date(u.createdAt);
      const now = new Date();
      if (userTimeFilter === 'today') {
        matchTime = createdDate.toDateString() === now.toDateString();
      } else if (userTimeFilter === 'week') {
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        matchTime = diffDays <= 7;
      } else if (userTimeFilter === 'month') {
        matchTime = createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
      }
    }
    
    return matchSearch && matchRole && matchTime;
  });

  const paginatedUsers = filteredUsers.slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage);
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getThumbnailUrl = (imageUrlStr: string) => {
    try {
      const parsed = JSON.parse(imageUrlStr);
      let url = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : imageUrlStr;
      if (url.includes('/uc?id=')) url = url.replace('/uc?id=', '/thumbnail?id=') + '&sz=w500';
      return url;
    } catch {
      let url = imageUrlStr;
      if (url.includes('/uc?id=')) url = url.replace('/uc?id=', '/thumbnail?id=') + '&sz=w500';
      return url;
    }
  };

  return (
    <div className="animate-fade-in mx-auto relative px-4 py-6 md:p-8" style={{ maxWidth: '1200px' }}>
      
      {/* MODALS */}
      {editingFrame && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '90%', maxWidth: '500px', background: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Sửa Khung Hình</h3>
            <form onSubmit={saveFrame} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Tiêu đề</label>
                <input type="text" value={editingFrame.title} onChange={e => setEditingFrame({...editingFrame, title: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Đường dẫn (Slug)</label>
                <input type="text" value={editingFrame.slug} onChange={e => setEditingFrame({...editingFrame, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Hình ảnh (URL hoặc Base64)</label>
                <textarea value={editingFrame.imageUrl} onChange={e => setEditingFrame({...editingFrame, imageUrl: e.target.value})} rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditingFrame(null)} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '90%', maxWidth: '500px', background: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              {editingUser.id ? 'Sửa Người Dùng' : 'Tạo Người Dùng Mới'}
            </h3>
            <form onSubmit={saveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Email</label>
                <input type="email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Tên</label>
                <input type="text" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Vai trò</label>
                <select value={editingUser.role || 'USER'} onChange={e => setEditingUser({...editingUser, role: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Mật khẩu {editingUser.id ? '(Bỏ trống nếu không đổi)' : ''}</label>
                <input type="password" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} required={!editingUser.id} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}


      <div className="tool-header text-center mb-8 md:mb-10 mt-4 md:mt-0">
        <h1 className="text-gradient text-2xl md:text-3xl mb-2 uppercase">
          Bảng Điều Khiển Quản Trị
        </h1>
        <p className="text-secondary text-sm md:text-base">Quản lý hệ thống RCHG Studio, người dùng và khung hình.</p>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Tabs Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {[
            { id: 'frames', label: 'Quản Lý Khung Hình' },
            { id: 'users', label: 'Quản Lý Tài Khoản' },
            { id: 'settings', label: 'Cấu Hình Hệ Thống' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '0 0 auto', padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                border: 'none', outline: 'none', background: 'transparent',
                borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem 2rem' }}>
          
          {/* TAB: FRAMES */}
          {activeTab === 'frames' && (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-wrap gap-4">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Danh sách Khung Hình ({filteredFrames.length})</h2>
                <button onClick={fetchFrames} className="btn" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>Tải lại</button>
              </div>

              {/* BỘ LỌC VÀ TÌM KIẾM */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm tiêu đề, link, email..." 
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setFramesPage(1); }}
                  className="input flex-1 min-w-[250px]"
                />
                <select 
                  value={timeFilter}
                  onChange={e => { setTimeFilter(e.target.value); setFramesPage(1); }}
                  className="input min-w-[180px]"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="week">Trong 7 ngày qua</option>
                  <option value="month">Trong tháng này</option>
                </select>
              </div>
              
              {loadingFrames ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Đang tải dữ liệu...</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Ảnh</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Tiêu đề</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Đường dẫn</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Người tạo</th>
                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {frames.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chưa có khung hình nào.</td></tr>
                      ) : paginatedFrames.map((frame: any) => (
                        <tr key={frame.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem 1rem' }}><img src={getThumbnailUrl(frame.imageUrl)} alt={frame.title} style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '0.5rem', background: '#f1f5f9' }} /></td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', fontWeight: 500 }}>{frame.title}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>/f/{frame.slug}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{frame.user?.name || frame.user?.email || 'N/A'}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <a href={`/f/${frame.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', marginRight: '1rem', textDecoration: 'none' }}>Xem</a>
                            <button onClick={() => navigate('/tao-khung', { state: { frame, isAdminEdit: true } })} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', marginRight: '1rem' }}>Sửa</button>
                            <button onClick={() => deleteFrame(frame.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>Xóa</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination Frames */}
                  {totalFramePages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                      {Array.from({ length: totalFramePages }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setFramesPage(idx + 1)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            background: framesPage === idx + 1 ? 'var(--primary)' : 'var(--bg-secondary)',
                            color: framesPage === idx + 1 ? '#fff' : 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Danh sách Người Dùng ({filteredUsers.length})</h2>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-start' }} className="md:w-auto md:justify-end">
                  <button onClick={() => setEditingUser({ role: 'USER' })} className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>+ Tạo mới</button>
                  <button onClick={fetchUsers} className="btn" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>Tải lại</button>
                </div>
              </div>

              {/* BỘ LỌC VÀ TÌM KIẾM TÀI KHOẢN */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm email, tên người dùng..." 
                  value={userSearchQuery}
                  onChange={e => { setUserSearchQuery(e.target.value); setUsersPage(1); }}
                  className="input flex-1 min-w-[250px]"
                />
                <select 
                  value={userRoleFilter}
                  onChange={e => { setUserRoleFilter(e.target.value); setUsersPage(1); }}
                  className="input"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="ADMIN">Quản trị (ADMIN)</option>
                  <option value="USER">Người dùng (USER)</option>
                </select>
                <select 
                  value={userTimeFilter}
                  onChange={e => { setUserTimeFilter(e.target.value); setUsersPage(1); }}
                  className="input"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="week">Trong 7 ngày qua</option>
                  <option value="month">Trong tháng này</option>
                </select>
              </div>
              
              {loadingUsers ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Đang tải dữ liệu...</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Email</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Tên</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Vai trò</th>
                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có người dùng.</td></tr>
                      ) : paginatedUsers.map((u: any) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>{u.email}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.name || 'N/A'}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '0.25rem 0.5rem', background: u.role === 'ADMIN' ? '#dbeafe' : '#f1f5f9', color: u.role === 'ADMIN' ? '#1d4ed8' : '#475569', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <button onClick={() => setEditingUser(u)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', marginRight: '1rem' }}>Sửa</button>
                            {u.id !== user?.id && (
                              <button onClick={() => deleteUser(u.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>Xóa</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Users */}
                  {totalUserPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                      {Array.from({ length: totalUserPages }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setUsersPage(idx + 1)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            background: usersPage === idx + 1 ? 'var(--primary)' : 'var(--bg-secondary)',
                            color: usersPage === idx + 1 ? '#fff' : 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Cấu Hình Hệ Thống</h2>
              
              {/* Setting Sub Tabs */}
              <div className="flex gap-2 mb-8 border-b border-[var(--border)] overflow-x-auto whitespace-nowrap">
                {[
                  { id: 'google', label: 'Đăng Nhập Google' },
                  { id: 'drive', label: 'Google Drive' },
                  { id: 'email', label: 'Cấu hình Email (SMTP)' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSettingsTab(tab.id)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeSettingsTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                      color: activeSettingsTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: activeSettingsTab === tab.id ? 600 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {loadingSettings ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Đang tải dữ liệu...</p> : (
                <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  
                  {/* Google OAuth Section */}
                  {activeSettingsTab === 'google' && (
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', paddingBottom: '0.5rem' }}>Đăng nhập Google (OAuth 2.0)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Client ID</label>
                        <input type="text" value={settings.googleClientId} onChange={e => handleSettingChange('googleClientId', e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }} placeholder="GCP Client ID..." />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Client Secret</label>
                        <input type="password" value={settings.googleClientSecret} onChange={e => handleSettingChange('googleClientSecret', e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }} placeholder="GCP Client Secret..." />
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Google Drive Section */}
                  {activeSettingsTab === 'drive' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary)' }}>Lưu trữ Google Share Team Drive</h3>
                      <button type="button" onClick={handleTestDrive} disabled={testingDrive} className="btn" style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                        {testingDrive ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Folder ID (ID Thư mục)</label>
                        <input type="text" value={settings.googleDriveFolderId} onChange={e => handleSettingChange('googleDriveFolderId', e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }} placeholder="1A2B3C..." />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Service Account JSON</label>
                        <textarea value={settings.googleDriveServiceJson} onChange={e => handleSettingChange('googleDriveServiceJson', e.target.value)} rows={6} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'monospace' }} placeholder='{ "type": "service_account", ... }' />
                      </div>
                    </div>
                  </div>
                  )}

                  {/* SMTP Section */}
                  {activeSettingsTab === 'email' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary)' }}>Cấu hình Email (SMTP Gmail)</h3>
                      <button type="button" onClick={handleTestSmtp} disabled={testingSmtp} className="btn" style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                        {testingSmtp ? 'Đang gửi mail...' : 'Gửi Test Mail'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Máy chủ SMTP (Host)</label>
                        <input type="text" value={settings.smtpHost} onChange={e => handleSettingChange('smtpHost', e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }} placeholder="smtp.gmail.com" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Cổng (Port)</label>
                        <input type="text" value={settings.smtpPort} onChange={e => handleSettingChange('smtpPort', e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }} placeholder="465 hoặc 587" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Email đăng nhập (Username)</label>
                        <input type="email" value={settings.smtpUser} onChange={e => handleSettingChange('smtpUser', e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }} placeholder="email@gmail.com" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Mật khẩu ứng dụng (Password)</label>
                        <input type="password" value={settings.smtpPass} onChange={e => handleSettingChange('smtpPass', e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }} placeholder="Mật khẩu ứng dụng Gmail 16 số" />
                      </div>
                    </div>
                  </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <button type="submit" disabled={savingSettings} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600, borderRadius: '0.5rem' }}>
                      {savingSettings ? 'Đang lưu...' : 'Lưu Cấu Hình'}
                    </button>
                  </div>

                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

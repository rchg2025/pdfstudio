import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('frames');
  
  // States cho Khung hình
  const [frames, setFrames] = useState<any[]>([]);
  const [loadingFrames, setLoadingFrames] = useState(false);
  const [framesPage, setFramesPage] = useState(1);
  const [editingFrame, setEditingFrame] = useState<any>(null);

  // States cho Người dùng
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [editingUser, setEditingUser] = useState<any>(null);

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

  const deleteFrame = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khung hình này?')) return;
    try {
      const res = await fetch(`/api/admin/frames?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchFrames();
    } catch (e) {
      console.error(e);
    }
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
      } else {
        const d = await res.json();
        alert(d.message || 'Lỗi khi lưu khung hình');
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

  const deleteUser = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error(e);
    }
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
      } else {
        const d = await res.json();
        alert(d.message || 'Lỗi khi lưu người dùng');
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
        alert('Lưu cấu hình thành công!');
      } else {
        alert('Lưu thất bại!');
      }
    } catch (err) {
      console.error(err);
      alert('Lưu thất bại!');
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
      if (res.ok) alert(`Thành công: ${data.message}\nThư mục: ${data.folderName}`);
      else alert(`Lỗi: ${data.message}\n${data.error || ''}`);
    } catch (err) {
      alert('Lỗi kết nối API');
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
      if (res.ok) alert(`Thành công: ${data.message}`);
      else alert(`Lỗi: ${data.message}\n${data.error || ''}`);
    } catch (err) {
      alert('Lỗi kết nối API');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Pagination Logic
  const paginatedFrames = frames.slice((framesPage - 1) * itemsPerPage, framesPage * itemsPerPage);
  const totalFramePages = Math.ceil(frames.length / itemsPerPage);

  const paginatedUsers = users.slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage);
  const totalUserPages = Math.ceil(users.length / itemsPerPage);

  const getThumbnailUrl = (imageUrlStr: string) => {
    try {
      const parsed = JSON.parse(imageUrlStr);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      return imageUrlStr;
    } catch {
      return imageUrlStr;
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      
      {/* MODALS */}
      {editingFrame && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '500px', background: 'var(--bg-primary)' }}>
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
          <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '500px', background: 'var(--bg-primary)' }}>
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


      <div className="tool-header text-center" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
          Bảng Điều Khiển Quản Trị
        </h1>
        <p className="text-secondary">Quản lý hệ thống PDF Studio, người dùng và khung hình.</p>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Tabs Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          {[
            { id: 'frames', label: 'Quản Lý Khung Hình' },
            { id: 'users', label: 'Quản Lý Tài Khoản' },
            { id: 'settings', label: 'Cấu Hình Hệ Thống' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '1rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
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
        <div style={{ padding: '2rem' }}>
          
          {/* TAB: FRAMES */}
          {activeTab === 'frames' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Danh sách Khung Hình</h2>
                <button onClick={fetchFrames} className="btn" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>Tải lại</button>
              </div>
              
              {loadingFrames ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Đang tải dữ liệu...</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
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
                            <button onClick={() => setEditingFrame(frame)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', marginRight: '1rem' }}>Sửa</button>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Danh sách Người Dùng</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setEditingUser({ role: 'USER' })} className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>+ Tạo mới</button>
                  <button onClick={fetchUsers} className="btn" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>Tải lại</button>
                </div>
              </div>
              
              {loadingUsers ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Đang tải dữ liệu...</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
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
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary)' }}>Lưu trữ Google Share Team Drive</h3>
                      <button type="button" onClick={handleTestDrive} disabled={testingDrive} className="btn" style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                        {testingDrive ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary)' }}>Cấu hình Email (SMTP Gmail)</h3>
                      <button type="button" onClick={handleTestSmtp} disabled={testingSmtp} className="btn" style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                        {testingSmtp ? 'Đang gửi mail...' : 'Gửi Test Mail'}
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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

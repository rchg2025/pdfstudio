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

  // States cho Người dùng
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // States cho Cấu hình
  const [settings, setSettings] = useState({
    smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '',
    googleClientId: '', googleClientSecret: '',
    googleDriveFolderId: '', googleDriveServiceJson: ''
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

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

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
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
                      ) : frames.map((frame: any) => (
                        <tr key={frame.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem 1rem' }}><img src={frame.imageUrl} alt={frame.title} style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '0.5rem', background: '#f1f5f9' }} /></td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', fontWeight: 500 }}>{frame.title}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>/f/{frame.slug}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{frame.user?.name || frame.user?.email || 'N/A'}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <button onClick={() => deleteFrame(frame.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>Xóa</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Danh sách Người Dùng</h2>
                <button onClick={fetchUsers} className="btn" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>Tải lại</button>
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
                      ) : users.map((u: any) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>{u.email}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.name || 'N/A'}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '0.25rem 0.5rem', background: u.role === 'ADMIN' ? '#dbeafe' : '#f1f5f9', color: u.role === 'ADMIN' ? '#1d4ed8' : '#475569', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            {u.id !== user?.id && (
                              <button onClick={() => deleteUser(u.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>Xóa</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Cấu Hình Hệ Thống</h2>
              
              {loadingSettings ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Đang tải dữ liệu...</p> : (
                <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  
                  {/* Google OAuth Section */}
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Đăng nhập Google (OAuth 2.0)</h3>
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

                  {/* Google Drive Section */}
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Lưu trữ Google Share Team Drive</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Folder ID (ID Thư mục)</label>
                        <input type="text" value={settings.googleDriveFolderId} onChange={e => handleSettingChange('googleDriveFolderId', e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }} placeholder="1A2B3C..." />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Service Account JSON</label>
                        <textarea value={settings.googleDriveServiceJson} onChange={e => handleSettingChange('googleDriveServiceJson', e.target.value)} rows={4} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'monospace' }} placeholder='{ "type": "service_account", ... }' />
                      </div>
                    </div>
                  </div>

                  {/* SMTP Section */}
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Cấu hình Email (SMTP Gmail)</h3>
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

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
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

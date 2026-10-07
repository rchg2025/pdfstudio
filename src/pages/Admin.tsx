import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { Eye, Edit, Trash2, ExternalLink, UserCheck, UserX, ShieldCheck, ShieldAlert, Crown, CheckCircle, XCircle, Clock, Check, X } from "lucide-react";


export default function Admin() {
  const { user, token } = useAuth();
  const { showToast, showConfirm } = useNotification();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('frames');
  
  // States cho Link Rút gọn
  const [urls, setUrls] = useState<any[]>([]);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [urlsPage, setUrlsPage] = useState(1);
  const [editingUrl, setEditingUrl] = useState<any>(null);
  const [urlSearchQuery, setUrlSearchQuery] = useState('');
  
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

  // States cho Gia Hạn & Chuyển Khoản
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Quick Extend Modal for User
  const [quickExtendUser, setQuickExtendUser] = useState<any>(null);
  const [extendDaysInput, setExtendDaysInput] = useState<number>(30);

  // States cho Cấu hình
  const [settings, setSettings] = useState({
    smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '', adminNotificationEmail: '',
    googleClientId: '', googleClientSecret: '',
    googleDriveFolderId: '', googleDriveServiceJson: '',
    geminiApiKey: '', geminiCustomModel: 'auto',
    bankId: 'MB', bankAccountNo: '', bankAccountName: '',
    price_90d: '99000', price_180d: '180000', price_365d: '299000', price_lifetime: '699000'
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingDrive, setTestingDrive] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('google');

  const itemsPerPage = 10;

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    
    if (activeTab === 'frames') fetchFrames();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'urls') fetchUrls();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/admin/subscription-orders', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) setOrders(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: 'APPROVED' | 'REJECTED', note?: string) => {
    const actionLabel = status === 'APPROVED' ? 'Phê duyệt & Kích hoạt gói' : 'Từ chối đơn';
    showConfirm(`Bạn có chắc chắn muốn ${actionLabel} cho yêu cầu này?`, async () => {
      try {
        const res = await fetch('/api/admin/subscription-orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ id: orderId, status, note })
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message || 'Cập nhật trạng thái thành công', 'success');
          fetchOrders();
          fetchUsers();
        } else {
          showToast(data.message || 'Thao tác thất bại', 'error');
        }
      } catch (err: any) {
        showToast('Lỗi kết nối máy chủ', 'error');
      }
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    showConfirm('Bạn có chắc muốn xóa lịch sử đơn gia hạn này?', async () => {
      try {
        const res = await fetch(`/api/admin/subscription-orders?id=${orderId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          showToast('Đã xóa đơn gia hạn', 'success');
          fetchOrders();
        } else {
          showToast('Xóa đơn thất bại', 'error');
        }
      } catch (e) {
        showToast('Lỗi khi xóa đơn', 'error');
      }
    });
  };

  const handleQuickExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickExtendUser || !extendDaysInput) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id: quickExtendUser.id,
          extendDays: Number(extendDaysInput)
        })
      });
      if (res.ok) {
        showToast(`Đã cộng thêm ${extendDaysInput} ngày thành công cho ${quickExtendUser.email}!`, 'success');
        setQuickExtendUser(null);
        fetchUsers();
      } else {
        const d = await res.json();
        showToast(d.message || 'Gia hạn thất bại', 'error');
      }
    } catch (err) {
      showToast('Lỗi khi gia hạn cho người dùng', 'error');
    }
  };

  const fetchUrls = async () => {
    setLoadingUrls(true);
    try {
      const res = await fetch('/api/admin/urls', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setUrls(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUrls(false);
    }
  };

  const deleteUrl = (id: number) => {
    showConfirm('Bạn có chắc chắn muốn xóa link này?', async () => {
      try {
        const res = await fetch(`/api/admin/urls?id=${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchUrls();
          showToast('Xóa link thành công', 'success');
        } else {
          showToast('Xóa link thất bại', 'error');
        }
      } catch (e) {
        showToast('Lỗi khi xóa link', 'error');
      }
    });
  };

  const saveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/urls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editingUrl)
      });
      if (res.ok) {
        setEditingUrl(null);
        fetchUrls();
        showToast('Lưu link thành công', 'success');
      } else {
        const d = await res.json();
        showToast(d.message || 'Lỗi khi lưu link', 'error');
      }
    } catch (e) {
      showToast('Lỗi hệ thống', 'error');
    }
  };

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

  const toggleUserStatus = (targetUser: any) => {
    const isCurrentlyDisabled = targetUser.role === 'DISABLED';
    const newRole = isCurrentlyDisabled ? 'USER' : 'DISABLED';
    const actionLabel = isCurrentlyDisabled ? 'Kích hoạt' : 'Vô hiệu hóa';

    showConfirm(`Bạn có chắc chắn muốn ${actionLabel} tài khoản "${targetUser.email}"?`, async () => {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            id: targetUser.id,
            email: targetUser.email,
            name: targetUser.name,
            role: newRole
          })
        });

        if (res.ok) {
          fetchUsers();
          showToast(`Đã ${actionLabel.toLowerCase()} tài khoản thành công!`, 'success');
        } else {
          const d = await res.json();
          showToast(d.message || `Lỗi khi ${actionLabel.toLowerCase()} tài khoản`, 'error');
        }
      } catch (e) {
        console.error(e);
        showToast(`Lỗi khi ${actionLabel.toLowerCase()} tài khoản`, 'error');
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

  const handleTestGemini = async () => {
    setTestingGemini(true);
    try {
      const res = await fetch('/api/quiz-api?action=test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: settings.geminiApiKey })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Kết nối Gemini thành công! (Model: ${data.model})`, 'success');
      } else {
        showToast(data.error || 'Kiểm tra kết nối thất bại!', 'error');
      }
    } catch {
      showToast('Lỗi khi kiểm tra kết nối Gemini', 'error');
    } finally {
      setTestingGemini(false);
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

  const filteredOrders = orders.filter((o: any) => {
    const q = orderSearchQuery.toLowerCase();
    const matchSearch = !q || 
      o.transferCode?.toLowerCase().includes(q) || 
      o.user?.email?.toLowerCase().includes(q) ||
      o.planTitle?.toLowerCase().includes(q);
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return matchSearch && matchStatus;
  });

  const paginatedOrders = filteredOrders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage);
  const totalOrderPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const filteredUrls = urls.filter((u: any) => {
    const query = urlSearchQuery.toLowerCase();
    return !query || 
      u.original_url?.toLowerCase().includes(query) || 
      u.alias?.toLowerCase().includes(query);
  });
  
  const paginatedUrls = filteredUrls.slice((urlsPage - 1) * itemsPerPage, urlsPage * itemsPerPage);
  const totalUrlPages = Math.ceil(filteredUrls.length / itemsPerPage);

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
    <div className="animate-fade-in mx-auto relative px-4 py-6 md:p-8" style={{ width: '100%' }}>
      
      {/* MODALS */}
      {editingFrame && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-primary)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Sửa Khung Hình</h3>
              <button 
                type="button" 
                onClick={() => setEditingFrame(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.75rem', width: '100%', maxWidth: '540px', maxHeight: '88vh', overflowY: 'auto', background: 'var(--bg-primary)', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {editingUser.id ? 'Cập Nhật Người Dùng' : 'Tạo Người Dùng Mới'}
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingUser(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
                title="Đóng cửa sổ"
              >
                <X size={20} />
              </button>
            </div>
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
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Vai trò & Trạng thái</label>
                <select value={editingUser.role || 'USER'} onChange={e => setEditingUser({...editingUser, role: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <option value="USER">USER (Người dùng - Kích hoạt)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên)</option>
                  <option value="DISABLED">DISABLED (Vô hiệu hóa tài khoản)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Gói cước & Hạn sử dụng</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <input 
                      type="checkbox" 
                      checked={!!editingUser.isLifetime} 
                      onChange={e => {
                        const checked = e.target.checked;
                        setEditingUser({
                          ...editingUser, 
                          isLifetime: checked,
                          subscriptionExpiresAt: checked ? null : (editingUser.subscriptionExpiresAt || new Date(Date.now() + 30*24*60*60*1000).toISOString())
                        });
                      }}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>Kích hoạt Gói Vĩnh Viễn (Lifetime - Không giới hạn thời gian)</span>
                  </label>

                  {!editingUser.isLifetime && (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        Chọn ngày hết hạn sử dụng:
                      </div>
                      <input 
                        type="date" 
                        value={editingUser.subscriptionExpiresAt ? (typeof editingUser.subscriptionExpiresAt === 'string' ? editingUser.subscriptionExpiresAt.split('T')[0] : new Date(editingUser.subscriptionExpiresAt).toISOString().split('T')[0]) : ''} 
                        onChange={e => {
                          const dateVal = e.target.value;
                          setEditingUser({
                            ...editingUser,
                            subscriptionExpiresAt: dateVal ? new Date(`${dateVal}T23:59:59.999Z`).toISOString() : null
                          });
                        }} 
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }} 
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <button 
                          type="button" 
                          className="btn btn-outline btn-xs"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 30);
                            setEditingUser({ ...editingUser, isLifetime: false, subscriptionExpiresAt: d.toISOString() });
                          }}
                        >
                          +30 ngày
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline btn-xs"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 90);
                            setEditingUser({ ...editingUser, isLifetime: false, subscriptionExpiresAt: d.toISOString() });
                          }}
                        >
                          +90 ngày
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline btn-xs"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 180);
                            setEditingUser({ ...editingUser, isLifetime: false, subscriptionExpiresAt: d.toISOString() });
                          }}
                        >
                          +180 ngày
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline btn-xs"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 365);
                            setEditingUser({ ...editingUser, isLifetime: false, subscriptionExpiresAt: d.toISOString() });
                          }}
                        >
                          +365 ngày
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Mật khẩu {editingUser.id ? '(Bỏ trống nếu không đổi)' : ''}</label>
                <input type="password" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} required={!editingUser.id} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-primary)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Sửa Link Rút Gọn</h3>
              <button 
                type="button" 
                onClick={() => setEditingUrl(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveUrl} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Link nguồn (URL ban đầu)</label>
                <input type="text" value={editingUrl.original_url || ''} onChange={e => setEditingUrl({...editingUrl, original_url: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Tên rút gọn (Alias)</label>
                <input type="text" value={editingUrl.alias || ''} onChange={e => setEditingUrl({...editingUrl, alias: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditingUrl(null)} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GIA HẠN NHANH NGÀY SỬ DỤNG CHO NGƯỜI DÙNG */}
      {quickExtendUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-primary)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <Crown size={22} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Gia Hạn Ngày Sử Dụng</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setQuickExtendUser(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Tài khoản: <strong>{quickExtendUser.email}</strong>
            </p>

            <form onSubmit={handleQuickExtend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  Chọn số ngày cộng thêm:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {[30, 90, 180, 365].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendDaysInput(d)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '0.4rem',
                        border: extendDaysInput === d ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: extendDaysInput === d ? 'rgba(37,99,235,0.1)' : 'var(--bg-secondary)',
                        color: extendDaysInput === d ? 'var(--primary)' : 'var(--text-primary)',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      +{d} ngày
                    </button>
                  ))}
                </div>
                <input 
                  type="number" 
                  min="1" 
                  value={extendDaysInput} 
                  onChange={e => setExtendDaysInput(parseInt(e.target.value, 10) || 1)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  placeholder="Nhập số ngày cụ thể..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setQuickExtendUser(null)} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Crown size={16} /> Kích hoạt ngay
                </button>
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
            { id: 'orders', label: 'Quản Lý Gia Hạn & Chuyển Khoản' },
            { id: 'urls', label: 'Quản Lý Link Rút Gọn' },
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Danh sách Khung Hình ({filteredFrames.length})</h2>
                <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
                  <button onClick={fetchFrames} className="btn" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>Tải lại</button>
                </div>
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
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Lượt xem</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Lượt tải</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Người tạo</th>
                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', position: 'sticky', right: 0, background: 'var(--bg-secondary)', zIndex: 1, borderLeft: '1px solid var(--border)' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {frames.length === 0 ? (
                        <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chưa có khung hình nào.</td></tr>
                      ) : paginatedFrames.map((frame: any) => (
                        <tr key={frame.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem 1rem' }}><img src={getThumbnailUrl(frame.imageUrl)} alt={frame.title} style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '0.5rem', background: '#f1f5f9' }} /></td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', fontWeight: 500 }}>{frame.title}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>/f/{frame.slug}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{frame.views || 0}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{frame.downloads || 0}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{frame.user?.name || frame.user?.email || 'N/A'}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', position: 'sticky', right: 0, background: 'var(--bg-primary)', zIndex: 1, borderLeft: '1px solid var(--border)' }}>
                            <a href={`/f/${frame.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', marginRight: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Eye size={16} /><span className="action-text">Xem</span></a>
                            <button onClick={() => navigate('/tao-khung', { state: { frame, isAdminEdit: true } })} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', marginRight: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Edit size={16} /><span className="action-text">Sửa</span></button>
                            <button onClick={() => deleteFrame(frame.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Trash2 size={16} /><span className="action-text">Xóa</span></button>
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
                <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
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
                  <option value="all">Tất cả vai trò & trạng thái</option>
                  <option value="ADMIN">Quản trị (ADMIN)</option>
                  <option value="USER">Người dùng hoạt động (USER)</option>
                  <option value="DISABLED">Đã vô hiệu hóa (DISABLED)</option>
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
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Hạn Sử Dụng</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Trạng thái</th>
                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', position: 'sticky', right: 0, background: 'var(--bg-secondary)', zIndex: 1, borderLeft: '1px solid var(--border)' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có người dùng.</td></tr>
                      ) : paginatedUsers.map((u: any) => {
                        const isDisabled = u.role === 'DISABLED';
                        
                        let uExpired = false;
                        let uDays = 0;
                        if (u.role === 'ADMIN' || u.isLifetime) {
                          uDays = 99999;
                          uExpired = false;
                        } else if (u.subscriptionExpiresAt) {
                          const diff = new Date(u.subscriptionExpiresAt).getTime() - Date.now();
                          uDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
                          if (uDays <= 0) {
                            uDays = 0;
                            uExpired = true;
                          }
                        } else {
                          uExpired = true;
                        }

                        return (
                          <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: isDisabled ? 0.75 : 1 }}>
                            <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                              {u.email}
                              {isDisabled && <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#ef4444', fontWeight: 600 }}>(Khóa)</span>}
                            </td>
                            <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.name || 'N/A'}</td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ 
                                padding: '0.25rem 0.5rem', 
                                background: u.role === 'ADMIN' ? '#dbeafe' : isDisabled ? '#fee2e2' : '#f1f5f9', 
                                color: u.role === 'ADMIN' ? '#1d4ed8' : isDisabled ? '#b91c1c' : '#475569', 
                                borderRadius: '0.25rem', 
                                fontSize: '0.75rem', 
                                fontWeight: 600 
                              }}>
                                {u.role === 'ADMIN' ? 'ADMIN' : isDisabled ? 'DISABLED' : 'USER'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              {u.isLifetime ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#059669', fontWeight: 700, fontSize: '0.8rem', background: '#ecfdf5', padding: '0.2rem 0.55rem', borderRadius: '0.25rem' }}>
                                  <Crown size={13} /> Vĩnh Viễn
                                </span>
                              ) : u.role === 'ADMIN' ? (
                                <span style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.8rem' }}>Không giới hạn</span>
                              ) : (
                                <div>
                                  <span style={{ 
                                    display: 'inline-block',
                                    fontWeight: 700, 
                                    fontSize: '0.78rem',
                                    color: uExpired ? '#dc2626' : '#1d4ed8',
                                    background: uExpired ? '#fef2f2' : '#eff6ff',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    border: uExpired ? '1px solid #fecaca' : '1px solid #bfdbfe'
                                  }}>
                                    {uExpired ? 'Hết hạn' : `Còn ${uDays} ngày`}
                                  </span>
                                  {u.subscriptionExpiresAt && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      {new Date(u.subscriptionExpiresAt).toLocaleDateString('vi-VN')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.25rem 0.6rem', 
                                background: isDisabled ? '#fee2e2' : '#dcfce7', 
                                color: isDisabled ? '#dc2626' : '#15803d', 
                                borderRadius: '999px', 
                                fontSize: '0.75rem', 
                                fontWeight: 700 
                              }}>
                                {isDisabled ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                {isDisabled ? 'Đã Vô Hiệu Hóa' : 'Đang Hoạt Động'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', position: 'sticky', right: 0, background: 'var(--bg-primary)', zIndex: 1, borderLeft: '1px solid var(--border)' }}>
                              {u.role !== 'ADMIN' && (
                                <button
                                  onClick={() => { setQuickExtendUser(u); setExtendDaysInput(30); }}
                                  style={{
                                    color: '#059669',
                                    background: '#ecfdf5',
                                    border: '1px solid #a7f3d0',
                                    borderRadius: '0.35rem',
                                    padding: '0.25rem 0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.78rem',
                                    marginRight: '0.65rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                  title="Gia hạn thêm ngày sử dụng cho tài khoản này"
                                >
                                  <Crown size={14} /> +Ngày
                                </button>
                              )}
                              {u.id !== user?.id && (
                                <button 
                                  onClick={() => toggleUserStatus(u)} 
                                  style={{ 
                                    color: isDisabled ? '#16a34a' : '#ea580c', 
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer', 
                                    fontWeight: 600, 
                                    fontSize: '0.875rem', 
                                    marginRight: '0.85rem', 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '0.25rem' 
                                  }}
                                  title={isDisabled ? 'Bấm để kích hoạt tài khoản' : 'Bấm để vô hiệu hóa tài khoản'}
                                >
                                  {isDisabled ? <UserCheck size={16} /> : <UserX size={16} />}
                                  <span className="action-text">{isDisabled ? 'Kích hoạt' : 'Khóa'}</span>
                                </button>
                              )}
                              <button onClick={() => setEditingUser(u)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', marginRight: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Edit size={16} /><span className="action-text">Sửa</span></button>
                              {u.id !== user?.id && (
                                <button onClick={() => deleteUser(u.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Trash2 size={16} /><span className="action-text">Xóa</span></button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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

          {/* TAB: ORDERS (QUẢN LÝ GIA HẠN & CHUYỂN KHOẢN) */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    Yêu Cầu Gia Hạn & Chuyển Khoản ({orders.length})
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    Kiểm tra sao kê tài khoản ngân hàng khớp với <strong>Mã Chuyển Khoản</strong> và bấm <strong>Duyệt</strong> để hệ thống tự động cộng hạn dùng cho thành viên.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
                  <button onClick={fetchOrders} className="btn" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>Tải lại</button>
                </div>
              </div>

              {/* BỘ LỌC VÀ TÌM KIẾM ĐƠN HÀNG */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input 
                  type="text" 
                  placeholder="Tìm theo mã chuyển khoản (GH...), email, tên gói..." 
                  value={orderSearchQuery}
                  onChange={e => { setOrderSearchQuery(e.target.value); setOrdersPage(1); }}
                  className="input flex-1 min-w-[250px]"
                />
                <select 
                  value={orderStatusFilter}
                  onChange={e => { setOrderStatusFilter(e.target.value); setOrdersPage(1); }}
                  className="input"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ xác nhận (PENDING)</option>
                  <option value="APPROVED">Đã duyệt (APPROVED)</option>
                  <option value="REJECTED">Đã từ chối (REJECTED)</option>
                </select>
              </div>

              {loadingOrders ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Đang tải danh sách đơn...</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Mã CK</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Người mua</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Gói đăng ký</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Số tiền</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Thời gian tạo</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Trạng thái</th>
                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', position: 'sticky', right: 0, background: 'var(--bg-secondary)', zIndex: 1, borderLeft: '1px solid var(--border)' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.map((order: any) => {
                          const isPending = order.status === 'PENDING';
                          const isApproved = order.status === 'APPROVED';
                          const isRejected = order.status === 'REJECTED';

                          return (
                            <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '1rem' }}>
                                <span style={{ 
                                  fontFamily: 'monospace', 
                                  fontWeight: 700, 
                                  color: '#dc2626', 
                                  background: '#fef2f2', 
                                  padding: '0.2rem 0.5rem', 
                                  borderRadius: '0.25rem',
                                  border: '1px dashed #fca5a5'
                                }}>
                                  {order.transferCode}
                                </span>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.user?.email || 'N/A'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user?.name}</div>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{order.planTitle}</span>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  {order.planDays >= 99999 ? 'Vĩnh viễn' : `+${order.planDays} ngày`}
                                </div>
                              </td>
                              <td style={{ padding: '1rem', fontWeight: 700, color: '#059669' }}>
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amount)}
                              </td>
                              <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                {new Date(order.createdAt).toLocaleString('vi-VN')}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef9c3',
                                  color: isApproved ? '#15803d' : isRejected ? '#b91c1c' : '#a16207',
                                  border: isApproved ? '1px solid #86efac' : isRejected ? '1px solid #fca5a5' : '1px solid #fde047'
                                }}>
                                  {isApproved && <CheckCircle size={12} />}
                                  {isRejected && <XCircle size={12} />}
                                  {isPending && <Clock size={12} />}
                                  {isApproved ? 'ĐÃ DUYỆT' : isRejected ? 'TỪ CHỐI' : 'CHỜ DUYỆT'}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right', position: 'sticky', right: 0, background: 'var(--bg-primary)', zIndex: 1, borderLeft: '1px solid var(--border)' }}>
                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.id, 'APPROVED')}
                                      style={{
                                        color: '#15803d',
                                        background: '#dcfce7',
                                        border: '1px solid #86efac',
                                        borderRadius: '0.35rem',
                                        padding: '0.3rem 0.65rem',
                                        fontWeight: 600,
                                        fontSize: '0.78rem',
                                        cursor: 'pointer',
                                        marginRight: '0.5rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                      }}
                                      title="Duyệt đơn và kích hoạt ngày dùng cho tài khoản"
                                    >
                                      <Check size={14} /> Duyệt đơn
                                    </button>
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.id, 'REJECTED')}
                                      style={{
                                        color: '#b91c1c',
                                        background: '#fee2e2',
                                        border: '1px solid #fca5a5',
                                        borderRadius: '0.35rem',
                                        padding: '0.3rem 0.65rem',
                                        fontWeight: 600,
                                        fontSize: '0.78rem',
                                        cursor: 'pointer',
                                        marginRight: '0.5rem'
                                      }}
                                    >
                                      Từ chối
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  style={{
                                    color: '#ef4444',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.3rem',
                                    display: 'inline-flex',
                                    alignItems: 'center'
                                  }}
                                  title="Xóa đơn"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  {orders.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                      Chưa có yêu cầu gia hạn nào từ người dùng.
                    </div>
                  )}

                  {/* Pagination Orders */}
                  {totalOrderPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                      {Array.from({ length: totalOrderPages }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setOrdersPage(idx + 1)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            background: ordersPage === idx + 1 ? 'var(--primary)' : 'var(--bg-secondary)',
                            color: ordersPage === idx + 1 ? '#fff' : 'var(--text-primary)',
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

          {/* TAB: URLS */}
          {activeTab === 'urls' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Tìm kiếm link..."
                    value={urlSearchQuery}
                    onChange={(e) => { setUrlSearchQuery(e.target.value); setUrlsPage(1); }}
                    style={{ flex: 1, minWidth: '200px', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {loadingUrls ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải dữ liệu...</div>
              ) : paginatedUrls.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Không tìm thấy link nào</div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-secondary)' }}>
                      <tr>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-secondary)' }}>ID</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-secondary)' }}>Link nguồn</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-secondary)' }}>Rút gọn (Alias)</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-secondary)' }}>Ngày tạo</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-secondary)' }}>Lượt click</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-secondary)', position: 'sticky', right: 0, background: 'var(--bg-secondary)', zIndex: 1, borderLeft: '1px solid var(--border)' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUrls.map((u: any) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '1rem' }}>{u.id}</td>
                          <td style={{ padding: '1rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={u.original_url}>{u.original_url}</td>
                          <td style={{ padding: '1rem', fontWeight: 'bold' }}>{u.alias}</td>
                          <td style={{ padding: '1rem' }}>{u.created_at ? new Date(u.created_at).toLocaleString('vi-VN') : '-'}</td>
                          <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary)' }}>{u.clicks || 0}</td>
                          <td style={{ padding: '1rem', position: 'sticky', right: 0, background: 'var(--bg-primary)', zIndex: 1, borderLeft: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <a href={`/${u.alias}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ padding: '0.5rem', background: '#10b981', color: 'white', borderRadius: '0.375rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><ExternalLink size={16} /><span className="action-text">Truy cập</span></a>
                              <button onClick={() => setEditingUrl(u)} className="btn" style={{ padding: '0.5rem', background: '#3b82f6', color: 'white', borderRadius: '0.375rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Edit size={16} /><span className="action-text">Sửa</span></button>
                              <button onClick={() => deleteUrl(u.id)} className="btn" style={{ padding: '0.5rem', background: '#ef4444', color: 'white', borderRadius: '0.375rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Trash2 size={16} /><span className="action-text">Xóa</span></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalUrlPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                  <button 
                    onClick={() => setUrlsPage(p => Math.max(1, p - 1))} 
                    disabled={urlsPage === 1}
                    className="btn" style={{ background: 'var(--bg-primary)', opacity: urlsPage === 1 ? 0.5 : 1 }}
                  >Trước</button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Trang {urlsPage} / {totalUrlPages}
                  </span>
                  <button 
                    onClick={() => setUrlsPage(p => Math.min(totalUrlPages, p + 1))} 
                    disabled={urlsPage === totalUrlPages}
                    className="btn" style={{ background: 'var(--bg-primary)', opacity: urlsPage === totalUrlPages ? 0.5 : 1 }}
                  >Sau</button>
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
                  { id: 'email', label: 'Cấu hình Email (SMTP)' },
                  { id: 'gemini', label: 'Cấu hình AI (Gemini)' },
                  { id: 'payment', label: 'Ngân Hàng & Bảng Giá Gói' }
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
                      <div className="md:col-span-2">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          Email nhận thông báo Admin khi có người đăng ký mới (Tùy chọn)
                        </label>
                        <input 
                          type="text" 
                          value={settings.adminNotificationEmail} 
                          onChange={e => handleSettingChange('adminNotificationEmail', e.target.value)} 
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }} 
                          placeholder="Mặc định gửi cho tất cả Admin. Nhập thêm email phụ phân cách bằng dấu phẩy (,)" 
                        />
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                          Khi có thành viên mới kích hoạt tài khoản qua Google hoặc Đăng ký thông thường, hệ thống sẽ tự động gửi email thông báo chi tiết đến danh sách này.
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Gemini AI Section */}
                  {activeSettingsTab === 'gemini' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>Cấu hình Google Gemini AI</h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Sử dụng cho tính năng Tạo câu hỏi thi trắc nghiệm bằng AI, tự động đổi model khi gặp lỗi.
                        </p>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleTestGemini} 
                        disabled={testingGemini} 
                        className="btn" 
                        style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}
                      >
                        {testingGemini ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          Google Gemini API Key *
                        </label>
                        <input 
                          type="password" 
                          value={settings.geminiApiKey} 
                          onChange={e => handleSettingChange('geminiApiKey', e.target.value)} 
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }} 
                          placeholder="AIzaSy..." 
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                          Lấy khóa API miễn phí từ <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Google AI Studio</a>.
                        </span>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          Chiến lược Model AI
                        </label>
                        <select
                          value={settings.geminiCustomModel || 'auto'}
                          onChange={e => handleSettingChange('geminiCustomModel', e.target.value)}
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                        >
                          <option value="auto">Tự động chọn model mới nhất & xoay vòng khi lỗi (Khuyên dùng)</option>
                          <option value="gemini-3.8-flash">Ưu tiên Gemini 3.8 Flash (Thế hệ mới nhất)</option>
                          <option value="gemini-3.0-flash">Ưu tiên Gemini 3.0 Flash</option>
                          <option value="gemini-2.5-flash">Ưu tiên Gemini 2.5 Flash</option>
                          <option value="gemini-2.0-flash">Ưu tiên Gemini 2.0 Flash</option>
                          <option value="gemini-1.5-flash">Ưu tiên Gemini 1.5 Flash</option>
                          <option value="gemini-1.5-flash-8b">Ưu tiên Gemini 1.5 Flash 8B</option>
                          <option value="gemini-1.5-pro">Ưu tiên Gemini 1.5 Pro</option>
                        </select>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                          Hệ thống sẽ tự động quét danh sách model được Google hỗ trợ cho API Key này và tự xoay vòng thử các model khác khi gặp lỗi đến khi có kết quả.
                        </span>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Payment & Bank Pricing Section */}
                  {activeSettingsTab === 'payment' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                      <Crown size={20} className="text-primary" />
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>
                        Cấu hình Tài Khoản Ngân Hàng Nhận Chuyển Khoản & Bảng Giá
                      </h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                      Các thông tin này sẽ được dùng để tự động tạo mã <strong>VietQR</strong> chuẩn xác khi người dùng chọn gia hạn thời gian sử dụng.
                    </p>

                    {/* Thông tin ngân hàng */}
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      1. Thông Tin Tài Khoản Ngân Hàng
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          Mã Ngân Hàng (Bank BIN / ID) *
                        </label>
                        <input 
                          type="text" 
                          value={settings.bankId} 
                          onChange={e => handleSettingChange('bankId', e.target.value.toUpperCase())} 
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }} 
                          placeholder="Ví dụ: MB, VCB, TCB, ACB, VPB, TPB..." 
                          required
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                          Tên viết tắt ngân hàng theo chuẩn VietQR (MB, VCB, ACB...)
                        </span>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          Số Tài Khoản Ngân Hàng *
                        </label>
                        <input 
                          type="text" 
                          value={settings.bankAccountNo} 
                          onChange={e => handleSettingChange('bankAccountNo', e.target.value)} 
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }} 
                          placeholder="Nhập số tài khoản..." 
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          Tên Chủ Tài Khoản (Không dấu) *
                        </label>
                        <input 
                          type="text" 
                          value={settings.bankAccountName} 
                          onChange={e => handleSettingChange('bankAccountName', e.target.value.toUpperCase())} 
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }} 
                          placeholder="Ví dụ: NGUYEN VAN A" 
                          required
                        />
                      </div>
                    </div>

                    {/* Bảng giá các gói gia hạn */}
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      2. Cấu Hình Giá Các Gói Sử Dụng (VNĐ)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          Gói 90 Ngày (3 Tháng)
                        </label>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Thử nghiệm ngắn hạn</p>
                        <input 
                          type="number" 
                          value={settings.price_90d} 
                          onChange={e => handleSettingChange('price_90d', e.target.value)} 
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700 }} 
                          placeholder="99000" 
                        />
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          Gói 180 Ngày (6 Tháng)
                        </label>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Gói 1 học kỳ</p>
                        <input 
                          type="number" 
                          value={settings.price_180d} 
                          onChange={e => handleSettingChange('price_180d', e.target.value)} 
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700 }} 
                          placeholder="180000" 
                        />
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #818cf8' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Gói 365 Ngày (1 Năm)
                          </label>
                          <span style={{ fontSize: '0.7rem', background: '#e0e7ff', color: '#4338ca', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 700 }}>Phổ biến</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Gói trọn vẹn 1 năm học</p>
                        <input 
                          type="number" 
                          value={settings.price_365d} 
                          onChange={e => handleSettingChange('price_365d', e.target.value)} 
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700 }} 
                          placeholder="299000" 
                        />
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #34d399' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Gói Vĩnh Viễn (Lifetime)
                          </label>
                          <span style={{ fontSize: '0.7rem', background: '#d1fae5', color: '#065f46', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 700 }}>VIP</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Trọn đời, cập nhật miễn phí</p>
                        <input 
                          type="number" 
                          value={settings.price_lifetime} 
                          onChange={e => handleSettingChange('price_lifetime', e.target.value)} 
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700 }} 
                          placeholder="699000" 
                        />
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

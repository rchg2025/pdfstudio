import { useState } from 'react';
import { useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { Copy, HardDrive, CheckCircle2, AlertTriangle, Loader2, Link2 } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './DriveCopy.css';

// Extract folder ID from URL
const extractFolderId = (url: string) => {
  const regex = /[-\w]{25,}/;
  const match = url.match(regex);
  return match ? match[0] : '';
};

function DriveCopyContent() {
  const [sourceUrl, setSourceUrl] = useState('');
  const [destUrl, setDestUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [logs, setLogs] = useState<{ id: number; text: string; type: 'info' | 'success' | 'error' }[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const { showAlert } = useDialogs();

  const addLog = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev, { id: Date.now(), text, type }]);
  };

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      addLog('Đăng nhập thành công! Đã cấp quyền truy cập Drive đích.', 'success');
    },
    onError: () => {
      showAlert('Đăng nhập thất bại. Vui lòng thử lại!', 'Lỗi đăng nhập');
    },
    scope: 'https://www.googleapis.com/auth/drive.file'
  });

  const getFiles = async (folderId: string, token: string) => {
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Không thể quét thư mục nguồn. Hãy chắc chắn link đã được bật "Bất kỳ ai có liên kết đều có thể xem".');
    }
    
    const data = await response.json();
    return data.files || [];
  };

  const copyFile = async (fileId: string, fileName: string, destFolderId: string, token: string) => {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/copy`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: fileName,
        parents: destFolderId ? [destFolderId] : undefined
      })
    });

    if (!response.ok) {
      throw new Error(`Sao chép thất bại: ${fileName}`);
    }
  };

  const startCopy = async () => {
    const sourceId = extractFolderId(sourceUrl);
    const destId = destUrl ? extractFolderId(destUrl) : 'root'; // default to root if empty

    if (!sourceId) {
      showAlert('Link thư mục nguồn (A) không hợp lệ!', 'Lỗi Link');
      return;
    }
    if (destUrl && !extractFolderId(destUrl)) {
      showAlert('Link thư mục đích (B) không hợp lệ!', 'Lỗi Link');
      return;
    }

    if (!accessToken) {
      showAlert('Vui lòng đăng nhập Google trước!', 'Thiếu quyền truy cập');
      return;
    }

    setIsCopying(true);
    setLogs([]);
    setProgress({ current: 0, total: 0 });

    try {
      addLog('Đang quét thư mục nguồn...', 'info');
      const files = await getFiles(sourceId, accessToken);
      
      if (files.length === 0) {
        addLog('Thư mục nguồn trống hoặc không có quyền truy cập.', 'error');
        setIsCopying(false);
        return;
      }

      setProgress({ current: 0, total: files.length });
      addLog(`Tìm thấy ${files.length} file. Đang bắt đầu sao chép...`, 'info');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Skip subfolders in this basic version
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          addLog(`Bỏ qua thư mục con: ${file.name}`, 'info');
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
          continue;
        }

        addLog(`Đang sao chép: ${file.name}`, 'info');
        
        try {
          await copyFile(file.id, file.name, destId === 'root' ? '' : destId, accessToken);
          addLog(`Thành công: ${file.name}`, 'success');
        } catch (err: any) {
          addLog(err.message, 'error');
        }
        
        setProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }

      addLog('Hoàn tất sao chép thư mục!', 'success');
      showAlert('Đã sao chép toàn bộ dữ liệu thành công!', 'Hoàn thành');

    } catch (err: any) {
      addLog(`Lỗi: ${err.message}`, 'error');
      showAlert(err.message, 'Lỗi hệ thống');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="drive-copy-container">
      <div className="drive-copy-header">
        <h1 className="text-2xl font-bold mb-2">Sao Chép Google Drive</h1>
        <p className="text-secondary">Chuyển toàn bộ dữ liệu từ Drive A sang Drive B siêu tốc mà không tốn dung lượng tải xuống.</p>
      </div>

      <div className="drive-copy-card">
        
        <div className="drive-section">
          <h3><Link2 size={20} className="text-blue-500" /> Thư Mục Nguồn (A)</h3>
          <div className="input-group">
            <label>Link Google Drive chứa file cần copy (Phải bật chế độ "Bất kỳ ai có liên kết")</label>
            <input 
              type="text" 
              placeholder="Ví dụ: https://drive.google.com/drive/folders/1A2b3C..."
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              disabled={isCopying}
            />
          </div>
        </div>

        <div className="drive-section">
          <h3><HardDrive size={20} className="text-green-500" /> Thư Mục Đích (B)</h3>
          
          <div className="input-group">
            <label>Link Google Drive nhận file (Để trống nếu muốn lưu vào thư mục gốc)</label>
            <input 
              type="text" 
              placeholder="Ví dụ: https://drive.google.com/drive/folders/XyZ987..."
              value={destUrl}
              onChange={e => setDestUrl(e.target.value)}
              disabled={isCopying}
            />
          </div>

          <div className="login-btn-wrapper">
            {!accessToken ? (
              <>
                <button className="btn-primary" onClick={() => login()} disabled={isCopying}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" style={{ width: 18, height: 18, marginRight: 8, background: 'white', borderRadius: '50%', padding: 2 }} />
                  Đăng nhập tài khoản Google (Drive Đích)
                </button>
                <div className="auth-warning">
                  <AlertTriangle size={16} /> Bắt buộc: Đăng nhập để cấp quyền lưu file vào Drive của bạn.
                </div>
              </>
            ) : (
              <div className="auth-warning success">
                <CheckCircle2 size={16} /> Đã cấp quyền truy cập Drive thành công!
              </div>
            )}
          </div>
        </div>

        <button 
          className="btn-start-copy" 
          onClick={startCopy}
          disabled={isCopying || !accessToken || !sourceUrl}
        >
          {isCopying ? <Loader2 className="animate-spin" size={20} /> : <Copy size={20} />}
          {isCopying ? 'Đang sao chép dữ liệu...' : 'Bắt Đầu Sao Chép'}
        </button>

        {progress.total > 0 && (
          <div className="progress-container">
            <div className="progress-header">
              <span>Tiến độ</span>
              <span>{progress.current} / {progress.total} file</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div className="logs-container">
            {logs.map(log => (
              <div key={log.id} className={`log-item ${log.type}`}>
                {log.type === 'success' && '✓ '}
                {log.type === 'error' && '✗ '}
                {log.type === 'info' && '➤ '}
                {log.text}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default function DriveCopy() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '123456789-placeholder.apps.googleusercontent.com';

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
    return (
      <div className="drive-copy-container">
        <div className="drive-copy-header">
          <h1 className="text-2xl font-bold mb-2">Sao Chép Google Drive</h1>
        </div>
        <div className="drive-copy-card">
          <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
            <h3 className="font-bold flex items-center gap-2 mb-2"><AlertTriangle size={20}/> Thiếu Cấu Hình API</h3>
            <p className="mb-2">Tính năng này yêu cầu phải thiết lập <strong>Google OAuth Client ID</strong> để hoạt động. Vui lòng thực hiện các bước sau:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Truy cập Google Cloud Console và tạo dự án mới.</li>
              <li>Bật thư viện <strong>Google Drive API</strong>.</li>
              <li>Tạo thông tin xác thực <strong>OAuth 2.0 Client ID</strong> (Loại: Ứng dụng web).</li>
              <li>Mở file <code>.env</code> trong thư mục gốc của dự án và cập nhật biến <code>VITE_GOOGLE_CLIENT_ID</code>.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <DriveCopyContent />
    </GoogleOAuthProvider>
  );
}

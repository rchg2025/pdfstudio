import { useState } from 'react';
import { Lock, Unlock, FileBox, X, RefreshCw, ShieldCheck } from 'lucide-react';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';
import { useDialogs } from '../components/CustomDialogs';
import FileUploadZone from '../components/FileUploadZone';
import './PdfSecurity.css';

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function PdfSecurity() {
  const [activeTab, setActiveTab] = useState<'lock' | 'unlock'>('lock');
  const { showAlert, DialogsComponent } = useDialogs();

  // Common state
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Lock state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Unlock state
  const [unlockPassword, setUnlockPassword] = useState('');

  const handleFileSelect = (files: FileList | null) => {
    const selectedFile = files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        showAlert("Chỉ hỗ trợ file định dạng PDF.");
        return;
      }
      setFile(selectedFile);
      setPassword('');
      setConfirmPassword('');
      setUnlockPassword('');
    }
  };

  const clearFile = () => {
    setFile(null);
    setPassword('');
    setConfirmPassword('');
    setUnlockPassword('');
  };

  const triggerDownload = (uint8Array: Uint8Array, filename: string) => {
    const blob = new Blob([uint8Array as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLock = async () => {
    if (!file) return;
    if (!password) {
      showAlert('Vui lòng nhập mật khẩu.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const encryptedPdf = await encryptPDF(uint8Array, password);
      
      const originalName = file.name.replace(/\.[^/.]+$/, "");
      triggerDownload(encryptedPdf, `${originalName}_DaKhoa.pdf`);
      clearFile();
    } catch (error) {
      console.error(error);
      showAlert('Có lỗi xảy ra khi mã hóa file PDF. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlock = async () => {
    if (!file) return;
    if (!unlockPassword) {
      showAlert('Vui lòng nhập mật khẩu của file.');
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const decryptedPdf = await decryptPDF(uint8Array, unlockPassword);
      
      const originalName = file.name.replace(/\.[^/.]+$/, "");
      triggerDownload(decryptedPdf, `${originalName}_DaMoKhoa.pdf`);
      clearFile();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.message || '';
      if (errMsg.toLowerCase().includes('password')) {
        showAlert('Mật khẩu không chính xác.');
      } else if (errMsg.includes('not encrypted')) {
        showAlert('File PDF này không có mật khẩu bảo vệ.');
      } else {
        showAlert('Có lỗi xảy ra: ' + errMsg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pdf-security-container animate-fade-in">
      <div className="security-header">
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Bảo Mật PDF</h1>
        <p className="text-secondary">Đặt mật khẩu bảo vệ hoặc gỡ bỏ lớp bảo mật cho file PDF của bạn một cách dễ dàng.</p>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'lock' ? 'active' : ''}`}
            onClick={() => { setActiveTab('lock'); clearFile(); }}
          >
            <Lock size={18} /> Khóa PDF
          </button>
          <button 
            className={`tab-btn ${activeTab === 'unlock' ? 'active' : ''}`}
            onClick={() => { setActiveTab('unlock'); clearFile(); }}
          >
            <Unlock size={18} /> Mở Khóa PDF
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          {!file ? (
            <div>
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                  {activeTab === 'lock' ? 'Mã hóa file PDF của bạn' : 'Gỡ bỏ mật khẩu file PDF'}
                </h2>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                  {activeTab === 'lock' 
                    ? 'Thêm mật khẩu để bảo vệ file PDF của bạn khỏi việc truy cập trái phép.'
                    : 'Gỡ bỏ mật khẩu bảo vệ để bạn có thể xem và chỉnh sửa file dễ dàng hơn.'}
                </p>
              </div>
              <FileUploadZone onFileSelect={handleFileSelect} accept="application/pdf" />
              
              <div className="security-info-box" style={{ marginTop: '2rem' }}>
                <ShieldCheck size={24} />
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0' }}>An toàn và bảo mật 100%</h4>
                  <p>Mọi quá trình {activeTab === 'lock' ? 'mã hóa' : 'giải mã'} đều diễn ra ngay trên trình duyệt của bạn. File không bao giờ được gửi lên máy chủ của chúng tôi.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="security-controls">
              <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="file-item-info">
                  <FileBox size={32} className="text-primary" />
                  <div style={{ overflow: 'hidden' }}>
                    <p className="file-item-name" style={{ fontSize: '1.125rem' }}>{file.name}</p>
                    <p className="file-item-size">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button className="icon-btn delete" onClick={clearFile} title="Xóa file">
                  <X size={20} />
                </button>
              </div>

              {activeTab === 'lock' ? (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={20} className="text-primary" /> 
                    Tạo Mật Khẩu
                  </h3>
                  
                  <div className="password-input-group">
                    <label>Mật khẩu mới</label>
                    <input 
                      type="password" 
                      placeholder="Nhập mật khẩu..." 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="password-input-group">
                    <label>Xác nhận mật khẩu</label>
                    <input 
                      type="password" 
                      placeholder="Nhập lại mật khẩu..." 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '1rem' }}
                    onClick={handleLock}
                    disabled={isProcessing || !password || !confirmPassword}
                  >
                    {isProcessing ? (
                      <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Đang mã hóa...</>
                    ) : (
                      <><Lock size={18} /> Đặt Mật Khẩu</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Unlock size={20} className="text-primary" /> 
                    Gỡ Bỏ Mật Khẩu
                  </h3>
                  
                  <div className="password-input-group">
                    <label>Mật khẩu hiện tại của file</label>
                    <input 
                      type="password" 
                      placeholder="Nhập mật khẩu của PDF..." 
                      value={unlockPassword}
                      onChange={e => setUnlockPassword(e.target.value)}
                    />
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '1rem' }}
                    onClick={handleUnlock}
                    disabled={isProcessing || !unlockPassword}
                  >
                    {isProcessing ? (
                      <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Đang giải mã...</>
                    ) : (
                      <><Unlock size={18} /> Mở Khóa PDF</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <DialogsComponent />
    </div>
  );
}

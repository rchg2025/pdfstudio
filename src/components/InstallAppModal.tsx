import { useState, useEffect } from 'react';
import { Smartphone, Apple, Download, Check, X, Info } from 'lucide-react';
import './InstallAppModal.css';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'android' | 'ios';
}

export default function InstallAppModal({ isOpen, onClose, defaultTab = 'android' }: InstallAppModalProps) {
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(defaultTab);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Hướng dẫn nếu trình duyệt không tự kích hoạt prompt
      alert('Để cài đặt: Bấm vào biểu tượng ⋮ (Menu) ở góc trên bên phải trình duyệt Chrome/Cốc Cốc ➔ Chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".');
    }
  };

  return (
    <div className="install-modal-overlay" onClick={onClose}>
      <div className="install-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="install-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="install-modal-header">
          <div className="install-app-icon">
            <img src="/logo.webp" alt="Tiện ích ITE" width={56} height={56} />
          </div>
          <div>
            <h2 className="install-modal-title">Cài Đặt Ứng Dụng Tiện Ích ITE</h2>
            <p className="install-modal-subtitle">Sử dụng mượt mà, mở nhanh trong 1 giây không cần gõ địa chỉ web</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="install-tab-switcher">
          <button 
            className={`install-tab-btn ${activeTab === 'android' ? 'active' : ''}`}
            onClick={() => setActiveTab('android')}
          >
            <Smartphone size={18} />
            <span>Android (APK / PWA)</span>
          </button>
          <button 
            className={`install-tab-btn ${activeTab === 'ios' ? 'active' : ''}`}
            onClick={() => setActiveTab('ios')}
          >
            <Apple size={18} />
            <span>iPhone / iPad (iOS)</span>
          </button>
        </div>

        {/* Tab Content Android */}
        {activeTab === 'android' && (
          <div className="install-tab-body">
            <div className="install-quick-action">
              <div className="quick-action-text">
                <strong>Cài Đặt Nhanh Vào Màn Hình Chính</strong>
                <span>Ứng dụng chạy độc lập, toàn màn hình, mượt mà như app gốc</span>
              </div>
              <button 
                className="btn-install-primary"
                onClick={handleInstallClick}
                disabled={isInstalled}
              >
                {isInstalled ? (
                  <>
                    <Check size={18} /> Đã Cài Đặt
                  </>
                ) : (
                  <>
                    <Download size={18} /> Cài Đặt Ngay
                  </>
                )}
              </button>
            </div>

            <div className="install-steps-box">
              <h4 className="steps-title"><Info size={16} /> Cách cài đặt thủ công trên Android (Chrome, Cốc Cốc, Brave):</h4>
              <ol className="install-steps-list">
                <li>Mở trang web bằng trình duyệt <strong>Google Chrome</strong> hoặc <strong>Cốc Cốc</strong>.</li>
                <li>Nhấn vào biểu tượng <strong>3 dấu chấm ⋮</strong> ở góc trên bên phải màn hình.</li>
                <li>Chọn <strong>"Cài đặt ứng dụng"</strong> (hoặc <strong>"Thêm vào Màn hình chính"</strong>).</li>
                <li>Nhấn <strong>"Cài đặt"</strong> để hoàn tất. Biểu tượng ứng dụng sẽ xuất hiện ngay trên màn hình điện thoại!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab Content iOS */}
        {activeTab === 'ios' && (
          <div className="install-tab-body">
            <div className="ios-badge-note">
              <span>💡 Dành riêng cho trình duyệt Safari trên iPhone / iPad</span>
            </div>

            <div className="install-steps-box" style={{ marginTop: '0.5rem' }}>
              <h4 className="steps-title"><Apple size={16} /> Các bước cài đặt lên iPhone / iPad:</h4>
              <ol className="install-steps-list">
                <li>Mở liên kết <strong>https://tienich.ite.id.vn</strong> bằng trình duyệt <strong>Safari</strong>.</li>
                <li>Bấm vào biểu tượng <strong>Chia sẻ</strong> (ô vuông có mũi tên chỉ lên ⬆️) ở thanh công cụ dưới đáy màn hình.</li>
                <li>Cuộn xuống danh sách tùy chọn và nhấn chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>.</li>
                <li>Nhấn nút <strong>"Thêm" (Add)</strong> ở góc trên bên phải để xác nhận.</li>
              </ol>
            </div>

            <div className="ios-feature-card">
              <Check size={16} color="#16a34a" />
              <span>Sau khi thêm, mở ứng dụng từ Màn hình chính sẽ có giao diện toàn màn hình, không bị vướng thanh địa chỉ Safari!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

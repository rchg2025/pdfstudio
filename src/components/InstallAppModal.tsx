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
      alert('Để cài đặt PWA: Bấm vào biểu tượng ⋮ (Menu) ở góc trên bên phải trình duyệt Chrome/Cốc Cốc ➔ Chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính". Hoặc bấm nút "Tải File APK" ở trên!');
    }
  };

  return (
    <div className="install-modal-overlay" onClick={onClose}>
      <div className="install-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="install-modal-close" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>

        <div className="install-modal-header">
          <div className="install-app-icon">
            <img src="/logo.webp" alt="Tiện ích ITE" width={56} height={56} />
          </div>
          <div>
            <h2 className="install-modal-title">Cài Đặt Ứng Dụng Tiện Ích ITE</h2>
            <p className="install-modal-subtitle">Trải nghiệm mượt mà, khởi động ngay tức thì không cần gõ web</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="install-tab-switcher">
          <button 
            className={`install-tab-btn ${activeTab === 'android' ? 'active' : ''}`}
            onClick={() => setActiveTab('android')}
          >
            <Smartphone size={18} />
            <span>Android</span>
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
            {/* Header Preview App Android */}
            <div className="ios-app-preview-card" style={{ background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.08), rgba(2, 132, 199, 0.06))', borderColor: 'rgba(22, 163, 74, 0.2)' }}>
              <div className="ios-preview-icon-wrapper">
                <img src="/icon-192.png" alt="Logo Tiện ích ITE" className="ios-preview-app-icon" />
              </div>
              <div className="ios-preview-info">
                <div className="ios-preview-title">Tiện ích ITE</div>
                <div className="ios-preview-desc">Ứng dụng màn hình chính cho điện thoại Android</div>
                <div className="ios-preview-status">
                  <span className="ios-badge-ready" style={{ background: '#dcfce7', color: '#16a34a' }}>✓ Sẵn sàng cài đặt</span>
                  <span className="ios-badge-free">Toàn màn hình</span>
                </div>
              </div>
            </div>

            <div className="install-quick-action" style={{ marginTop: '0.85rem' }}>
              <div className="quick-action-text">
                <strong>Cài Đặt Vào Màn Hình Chính</strong>
                <span>Khởi động siêu tốc trong 1 giây, mở toàn màn hình không vướng thanh web</span>
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

            <div className="install-steps-box" style={{ marginTop: '0.85rem' }}>
              <h4 className="steps-title"><Info size={16} /> Cách thêm thủ công nếu trình duyệt không tự hiện:</h4>
              <ol className="install-steps-list">
                <li>Mở web bằng trình duyệt <strong>Chrome</strong> hoặc <strong>Cốc Cốc</strong>.</li>
                <li>Nhấn vào biểu tượng <strong>3 dấu chấm ⋮</strong> ở góc trên bên phải màn hình.</li>
                <li>Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.</li>
                <li>Biểu tượng <strong>Tiện ích ITE</strong> sẽ xuất hiện ngay trên màn hình điện thoại!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab Content iOS */}
        {activeTab === 'ios' && (
          <div className="install-tab-body">
            {/* Header Preview App trên iPhone */}
            <div className="ios-app-preview-card">
              <div className="ios-preview-icon-wrapper">
                <img src="/apple-touch-icon.png" alt="Logo Tiện ích ITE" className="ios-preview-app-icon" />
              </div>
              <div className="ios-preview-info">
                <div className="ios-preview-title">Tiện ích ITE</div>
                <div className="ios-preview-desc">Ứng dụng web toàn màn hình cho iPhone & iPad</div>
                <div className="ios-preview-status">
                  <span className="ios-badge-ready">✓ Đã sẵn sàng cài đặt</span>
                  <span className="ios-badge-free">Miễn phí 100%</span>
                </div>
              </div>
            </div>

            <div className="ios-badge-note">
              <span>💡 Dành riêng cho trình duyệt Safari trên iPhone / iPad (iOS)</span>
            </div>

            <div className="install-steps-box" style={{ marginTop: '0.5rem' }}>
              <h4 className="steps-title"><Apple size={16} /> 3 bước cài đặt vào màn hình iPhone cực nhanh:</h4>
              <ol className="install-steps-list-ios">
                <li>
                  <div className="step-num">1</div>
                  <div className="step-desc">
                    Mở trang web bằng trình duyệt <strong>Safari</strong> trên iPhone.
                  </div>
                </li>
                <li>
                  <div className="step-num">2</div>
                  <div className="step-desc">
                    Nhấn vào nút <strong>Chia sẻ</strong> <span className="safari-share-icon">⎙ / ⬆️</span> ở thanh công cụ dưới đáy Safari.
                  </div>
                </li>
                <li>
                  <div className="step-num">3</div>
                  <div className="step-desc">
                    Cuộn xuống và chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong> ➔ Nhấn <strong>"Thêm" (Add)</strong>.
                  </div>
                </li>
              </ol>
            </div>

            <div className="ios-feature-card">
              <Check size={18} color="#16a34a" style={{ flexShrink: 0 }} />
              <span>Biểu tượng <strong>Tiện ích ITE</strong> sẽ xuất hiện ngay trên màn hình iPhone với logo chuẩn sắc nét, mở lên chạy toàn màn hình siêu mượt!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

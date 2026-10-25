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
            <span>Android (APK & PWA)</span>
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
            {/* Lựa chọn 1: Tải APK trực tiếp */}
            <div className="install-quick-action" style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(59, 130, 246, 0.03))', borderColor: 'rgba(37, 99, 235, 0.25)' }}>
              <div className="quick-action-text">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong>Cài Đặt Bằng File APK</strong>
                  <span style={{ fontSize: '11px', background: '#2563eb', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Khuyên dùng</span>
                </div>
                <span>Tải trực tiếp file .apk cài đặt vào điện thoại Android</span>
              </div>
              <a 
                href="/download/tienich-ite.apk" 
                download="tienich-ite.apk"
                className="btn-install-primary"
                style={{ textDecoration: 'none' }}
              >
                <Download size={18} /> Tải File APK
              </a>
            </div>

            {/* Lựa chọn 2: Cài PWA nhanh */}
            <div className="install-quick-action" style={{ marginTop: '0.75rem' }}>
              <div className="quick-action-text">
                <strong>Thêm Nhanh (PWA Web App)</strong>
                <span>Thêm trực tiếp vào màn hình chính mà không cần tải file</span>
              </div>
              <button 
                className="btn-install-primary"
                style={{ background: '#475569' }}
                onClick={handleInstallClick}
                disabled={isInstalled}
              >
                {isInstalled ? (
                  <>
                    <Check size={18} /> Đã Cài Đặt
                  </>
                ) : (
                  <>
                    <Smartphone size={18} /> Thêm Vào MH
                  </>
                )}
              </button>
            </div>

            <div className="install-steps-box" style={{ marginTop: '0.85rem' }}>
              <h4 className="steps-title"><Info size={16} /> Lưu ý khi cài file APK trên Android:</h4>
              <ol className="install-steps-list">
                <li>Sau khi bấm <strong>"Tải File APK"</strong>, mở file vừa tải về từ thông báo điện thoại.</li>
                <li>Nếu điện thoại hỏi <em>"Cho phép cài đặt ứng dụng từ nguồn này"</em>, hãy bật <strong>Cho phép</strong>.</li>
                <li>Bấm <strong>Cài đặt</strong> và mở ứng dụng Tiện Ích ITE để trải nghiệm ngay!</li>
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

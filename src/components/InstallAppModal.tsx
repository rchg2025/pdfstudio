import { useState, useEffect } from 'react';
import { Smartphone, Apple, Monitor, Download, Check, X, Info, Laptop } from 'lucide-react';
import './InstallAppModal.css';

export type InstallTabType = 'android' | 'ios' | 'desktop';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: InstallTabType;
}

// Lưu trữ event beforeinstallprompt toàn cục để không bị mất khi modal mount/unmount
let globalDeferredPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    globalDeferredPrompt = e;
  });
}

export default function InstallAppModal({ isOpen, onClose, defaultTab = 'android' }: InstallAppModalProps) {
  const [activeTab, setActiveTab] = useState<InstallTabType>(defaultTab);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => {
    return (typeof window !== 'undefined' && (window as any).__pwaInstallPrompt) || globalDeferredPrompt;
  });
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    const checkPrompt = () => {
      const p = (window as any).__pwaInstallPrompt || globalDeferredPrompt;
      if (p) setDeferredPrompt(p);
    };

    checkPrompt();

    const handlePromptReady = () => {
      checkPrompt();
    };

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      (window as any).__pwaInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      globalDeferredPrompt = null;
      (window as any).__pwaInstallPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installed', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, []);

  // Tự động kích hoạt hộp thoại cài đặt ngay khi mở modal nếu có prompt sẵn sàng
  useEffect(() => {
    const promptObj = deferredPrompt || (typeof window !== 'undefined' && (window as any).__pwaInstallPrompt) || globalDeferredPrompt;
    if (isOpen && (activeTab === 'android' || activeTab === 'desktop') && promptObj && !isInstalled) {
      promptObj.prompt().catch(() => {});
      promptObj.userChoice.then((choice: any) => {
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        globalDeferredPrompt = null;
        if (typeof window !== 'undefined') (window as any).__pwaInstallPrompt = null;
        setDeferredPrompt(null);
      }).catch(() => {});
    }
  }, [isOpen, activeTab, deferredPrompt, isInstalled]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const promptObj = deferredPrompt || (typeof window !== 'undefined' && (window as any).__pwaInstallPrompt) || globalDeferredPrompt;
    if (promptObj) {
      try {
        await promptObj.prompt();
        const choice = await promptObj.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        globalDeferredPrompt = null;
        if (typeof window !== 'undefined') (window as any).__pwaInstallPrompt = null;
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Lỗi kích hoạt prompt:', err);
      }
    } else {
      if (activeTab === 'desktop') {
        alert('Trình duyệt của bạn đang kiểm tra điều kiện cài đặt:\n\n1. Nhìn ngay lên thanh địa chỉ (URL) của trình duyệt ở góc trên cùng bên phải (cạnh biểu tượng dấu sao ⭐).\n2. Nhấn vào biểu tượng "Cài đặt ứng dụng" (Hình máy tính có mũi tên xuống ⤓ hoặc dấu cộng ⊕).\n3. Nhấn "Cài đặt" để hoàn tất.');
      } else {
        alert('Để thêm ứng dụng vào màn hình:\nNhấn biểu tượng 3 chấm ⋮ góc phải trình duyệt ➔ Chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".');
      }
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
            <Smartphone size={17} />
            <span>Android</span>
          </button>
          <button 
            className={`install-tab-btn ${activeTab === 'ios' ? 'active' : ''}`}
            onClick={() => setActiveTab('ios')}
          >
            <Apple size={17} />
            <span>iPhone / iOS</span>
          </button>
          <button 
            className={`install-tab-btn ${activeTab === 'desktop' ? 'active' : ''}`}
            onClick={() => setActiveTab('desktop')}
          >
            <Monitor size={17} />
            <span>PC / Mac / Linux</span>
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

        {/* Tab Content Desktop (Windows, MacOS, Linux) */}
        {activeTab === 'desktop' && (
          <div className="install-tab-body">
            {/* Header Preview App Desktop */}
            <div className="ios-app-preview-card" style={{ background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(99, 102, 241, 0.08))', borderColor: 'rgba(2, 132, 199, 0.2)' }}>
              <div className="ios-preview-icon-wrapper">
                <img src="/icon-192.png" alt="Logo Tiện ích ITE" className="ios-preview-app-icon" />
              </div>
              <div className="ios-preview-info">
                <div className="ios-preview-title">Tiện ích ITE - Desktop App</div>
                <div className="ios-preview-desc">Ứng dụng cửa sổ độc lập cho Windows, Mac & Linux</div>
                <div className="ios-preview-status">
                  <span className="ios-badge-ready" style={{ background: '#e0f2fe', color: '#0284c7' }}>✓ Chạy độc lập</span>
                  <span className="ios-badge-free">Ghim Taskbar / Dock</span>
                </div>
              </div>
            </div>

            <div className="install-quick-action" style={{ marginTop: '0.85rem' }}>
              <div className="quick-action-text">
                <strong>Cài Đặt Thành Ứng Dụng Máy Tính</strong>
                <span>Mở trong cửa sổ riêng, có phím tắt trên Desktop, ghim vào thanh Taskbar / Dock</span>
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
                    <Laptop size={18} /> Cài Vào Máy Tính
                  </>
                )}
              </button>
            </div>

            <div className="install-steps-box" style={{ marginTop: '0.85rem' }}>
              <h4 className="steps-title"><Monitor size={16} /> Cách cài nhanh trên máy tính (Chrome, Edge, Cốc Cốc, Brave):</h4>
              <ol className="install-steps-list-ios">
                <li>
                  <div className="step-num">1</div>
                  <div className="step-desc">
                    Nhìn vào <strong>thanh địa chỉ URL</strong> của trình duyệt (phía bên phải, cạnh biểu tượng dấu sao ⭐).
                  </div>
                </li>
                <li>
                  <div className="step-num">2</div>
                  <div className="step-desc">
                    Nhấn vào biểu tượng <strong>"Cài đặt Tiện ích ITE"</strong> (hình máy tính có mũi tên xuống ⤓ hoặc biểu tượng dấu cộng ⊕).
                  </div>
                </li>
                <li>
                  <div className="step-num">3</div>
                  <div className="step-desc">
                    Bấm <strong>"Cài đặt" (Install)</strong>. Ứng dụng sẽ xuất hiện trên Desktop và thanh Taskbar (Windows) hoặc Launchpad / Dock (MacBook)!
                  </div>
                </li>
              </ol>
            </div>

            <div className="ios-feature-card">
              <Check size={18} color="#0284c7" style={{ flexShrink: 0 }} />
              <span>Chạy nhanh như app phần mềm cài đặt thật, không tốn ram trình duyệt, tự động cập nhật phiên bản mới nhất!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

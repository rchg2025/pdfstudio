import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Layers, Menu, X, ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SubscriptionModal from './SubscriptionModal';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  
  const location = useLocation();
  const { user, logout, isExpired, remainingDays } = useAuth();
  const navRef = useRef<HTMLElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        isMobileMenuOpen &&
        mobileNavRef.current &&
        !mobileNavRef.current.contains(target) &&
        !(target as Element).closest('.mobile-menu-btn')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const checkScroll = () => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scrollNav = (direction: 'left' | 'right') => {
    if (navRef.current) {
      const scrollAmount = 250;
      navRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <Layers size={18} />
          </div>
          RCHG Studio
        </Link>
        <div className="navbar-scroll-container">
          <button 
            className={`scroll-btn left ${canScrollLeft ? 'visible' : ''}`}
            onClick={() => scrollNav('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>

          <nav 
            className="navbar-links-desktop"
            ref={navRef}
            onScroll={checkScroll}
          >
            <NavLink to="/pdf-editor" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Chỉnh sửa PDF</NavLink>
            <NavLink to="/pdf-merge-split" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Nối tách PDF</NavLink>
            <NavLink to="/xoa-trang-pdf" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Xóa trang PDF</NavLink>
            <NavLink to="/pdf-compare" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>So sánh PDF</NavLink>
            <NavLink to="/pdf-compressor" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Nén PDF</NavLink>
            <NavLink to="/pdf-to-image" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>PDF sang Ảnh</NavLink>
            <NavLink to="/jpg-sang-pdf" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>JPG sang PDF</NavLink>
            <NavLink to="/dong-dau-pdf" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Đóng Dấu PDF</NavLink>
            <NavLink to="/bao-mat-pdf" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Bảo mật PDF</NavLink>
            <NavLink to="/image-converter" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Đổi Đuôi Ảnh</NavLink>
            <NavLink to="/image-compressor" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Nén Ảnh</NavLink>
            <NavLink to="/crop-anh" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Crop ảnh</NavLink>
            <NavLink to="/resize-anh" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Resize ảnh</NavLink>
            <NavLink to="/tang-do-net-anh" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Tăng độ nét</NavLink>
            <NavLink to="/xoa-nen-mau" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Xóa Nền Màu</NavLink>
            <NavLink to="/qr-link" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>QR & Link</NavLink>
            <NavLink to="/xoa-dau-tieng-viet" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Xóa Dấu File</NavLink>
            <NavLink to="/sao-chep-drive" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Sao chép Drive</NavLink>
            <NavLink to="/cat-ghep-am-thanh" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Cắt Ghép Audio</NavLink>
            <NavLink to="/doc-van-ban" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Đọc Văn Bản</NavLink>
            <NavLink to="/xuat-ma-nhung" className={({isActive}) => isActive ? "nav-link active font-medium text-emerald-600" : "nav-link font-medium text-emerald-600"}>Xuất Mã Nhúng</NavLink>
            <NavLink to="/the-ghi-nho-flashcard" className={({isActive}) => isActive ? "nav-link active font-medium text-indigo-600" : "nav-link font-medium text-indigo-600"}>Flashcards</NavLink>
            <NavLink to="/anh-tuong-tac-hotspot" className={({isActive}) => isActive ? "nav-link active font-medium text-teal-600" : "nav-link font-medium text-teal-600"}>Ảnh Tương Tác</NavLink>
            <NavLink to="/vong-quay-lop-hoc" className={({isActive}) => isActive ? "nav-link active font-medium text-amber-600" : "nav-link font-medium text-amber-600"}>Vòng Quay</NavLink>
            <NavLink to="/phieu-bai-tap-tuong-tac" className={({isActive}) => isActive ? "nav-link active font-medium text-blue-600" : "nav-link font-medium text-blue-600"}>Phiếu Bài Tập</NavLink>
            <NavLink to="/tinh-huong-phan-nhanh" className={({isActive}) => isActive ? "nav-link active font-medium text-fuchsia-600" : "nav-link font-medium text-fuchsia-600"}>Tình Huống Phân Nhánh</NavLink>
            <NavLink to="/quan-ly-thi-trac-nghiem" className={({isActive}) => isActive ? "nav-link active font-medium text-violet-600" : "nav-link font-medium text-violet-600"}>Thi Trắc Nghiệm</NavLink>
            <NavLink to="/tao-anh-ai" className={({isActive}) => isActive ? "nav-link active font-medium text-purple-600" : "nav-link font-medium text-purple-600"}>Tạo Ảnh AI</NavLink>
            <NavLink to="/tao-khung" className={({isActive}) => isActive ? "nav-link active font-medium text-blue-600" : "nav-link font-medium text-blue-600"}>Khung Hình</NavLink>
          </nav>

          <button 
            className={`scroll-btn right ${canScrollRight ? 'visible' : ''}`}
            onClick={() => scrollNav('right')}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Mobile Navigation Drawer / Menu */}
        <nav 
          ref={mobileNavRef}
          className={`navbar-links-mobile ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        >
          <div className="mobile-user-status-card">
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tài khoản:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name || user.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Gói cước:</span>
                  <button 
                    type="button" 
                    onClick={() => { setIsMobileMenuOpen(false); setIsSubscriptionModalOpen(true); }}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.35rem', 
                      padding: '0.3rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: isExpired ? '1px solid #f87171' : user.isLifetime ? '1px solid #34d399' : '1px solid #93c5fd',
                      background: isExpired ? '#fef2f2' : user.isLifetime ? '#ecfdf5' : '#eff6ff',
                      color: isExpired ? '#dc2626' : user.isLifetime ? '#059669' : '#1d4ed8',
                      cursor: 'pointer'
                    }}
                  >
                    <Crown size={14} />
                    {user.isLifetime ? 'Gói Vĩnh Viễn' : isExpired ? 'Hết hạn (Gia hạn)' : `Còn ${remainingDays} ngày`}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', width: '100%', marginBottom: '0.5rem' }}>
                <NavLink 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.6rem 1rem', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  Đăng nhập tài khoản
                </NavLink>
              </div>
            )}
          </div>

          <div className="mobile-links-grid">
            <NavLink to="/pdf-editor" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Chỉnh sửa PDF</NavLink>
            <NavLink to="/pdf-merge-split" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Nối tách PDF</NavLink>
            <NavLink to="/xoa-trang-pdf" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Xóa trang PDF</NavLink>
            <NavLink to="/pdf-compare" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>So sánh PDF</NavLink>
            <NavLink to="/pdf-compressor" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Nén PDF</NavLink>
            <NavLink to="/pdf-to-image" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>PDF sang Ảnh</NavLink>
            <NavLink to="/jpg-sang-pdf" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>JPG sang PDF</NavLink>
            <NavLink to="/dong-dau-pdf" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Đóng Dấu PDF</NavLink>
            <NavLink to="/bao-mat-pdf" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Bảo mật PDF</NavLink>
            <NavLink to="/image-converter" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Đổi Đuôi Ảnh</NavLink>
            <NavLink to="/image-compressor" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Nén Ảnh</NavLink>
            <NavLink to="/crop-anh" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Crop ảnh</NavLink>
            <NavLink to="/resize-anh" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Resize ảnh</NavLink>
            <NavLink to="/tang-do-net-anh" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Tăng độ nét</NavLink>
            <NavLink to="/xoa-nen-mau" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Xóa Nền Màu</NavLink>
            <NavLink to="/qr-link" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>QR & Link</NavLink>
            <NavLink to="/xoa-dau-tieng-viet" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Xóa Dấu File</NavLink>
            <NavLink to="/sao-chep-drive" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Sao chép Drive</NavLink>
            <NavLink to="/cat-ghep-am-thanh" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Cắt Ghép Audio</NavLink>
            <NavLink to="/doc-van-ban" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Đọc Văn Bản</NavLink>
            <NavLink to="/xuat-ma-nhung" className={({isActive}) => isActive ? "nav-link active font-medium text-emerald-600" : "nav-link font-medium text-emerald-600"}>Xuất Mã Nhúng</NavLink>
            <NavLink to="/the-ghi-nho-flashcard" className={({isActive}) => isActive ? "nav-link active font-medium text-indigo-600" : "nav-link font-medium text-indigo-600"}>Flashcards</NavLink>
            <NavLink to="/anh-tuong-tac-hotspot" className={({isActive}) => isActive ? "nav-link active font-medium text-teal-600" : "nav-link font-medium text-teal-600"}>Ảnh Tương Tác</NavLink>
            <NavLink to="/vong-quay-lop-hoc" className={({isActive}) => isActive ? "nav-link active font-medium text-amber-600" : "nav-link font-medium text-amber-600"}>Vòng Quay</NavLink>
            <NavLink to="/phieu-bai-tap-tuong-tac" className={({isActive}) => isActive ? "nav-link active font-medium text-blue-600" : "nav-link font-medium text-blue-600"}>Phiếu Bài Tập</NavLink>
            <NavLink to="/tinh-huong-phan-nhanh" className={({isActive}) => isActive ? "nav-link active font-medium text-fuchsia-600" : "nav-link font-medium text-fuchsia-600"}>Tình Huống Phân Nhánh</NavLink>
            <NavLink to="/quan-ly-thi-trac-nghiem" className={({isActive}) => isActive ? "nav-link active font-medium text-violet-600" : "nav-link font-medium text-violet-600"}>Thi Trắc Nghiệm</NavLink>
            <NavLink to="/tao-anh-ai" className={({isActive}) => isActive ? "nav-link active font-medium text-purple-600" : "nav-link font-medium text-purple-600"}>Tạo Ảnh AI</NavLink>
            <NavLink to="/tao-khung" className={({isActive}) => isActive ? "nav-link active font-medium text-blue-600" : "nav-link font-medium text-blue-600"}>Khung Hình</NavLink>
          </div>

          {user && (
            <div className="mobile-auth-footer">
              <div className="nav-divider" style={{ margin: '0.75rem 0' }}></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {user.role === 'ADMIN' && (
                  <NavLink to="/admin" onClick={() => setIsMobileMenuOpen(false)} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                    Quản trị
                  </NavLink>
                )}
                {(!user.role || user.role === 'USER') && (
                  <NavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                    Bảng điều khiển
                  </NavLink>
                )}
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); logout(); }} 
                  className="nav-link logout-btn" 
                  style={{ color: '#ef4444' }}
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Auth Links - Desktop Only */}
        <div className="desktop-auth-links" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <>
              {/* Subscription Pill */}
              <button
                type="button"
                onClick={() => setIsSubscriptionModalOpen(true)}
                title="Bấm để xem thông tin gói cước và gia hạn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isExpired ? '1px solid #f87171' : user.isLifetime ? '1px solid #34d399' : '1px solid #93c5fd',
                  background: isExpired ? '#fef2f2' : user.isLifetime ? '#ecfdf5' : '#eff6ff',
                  color: isExpired ? '#dc2626' : user.isLifetime ? '#059669' : '#1d4ed8',
                  transition: 'all 0.2s'
                }}
              >
                <Crown size={15} />
                {user.isLifetime ? 'Vĩnh Viễn' : isExpired ? 'Hết hạn (Gia hạn)' : `Còn ${remainingDays} ngày`}
              </button>

              {user.role === 'ADMIN' && <NavLink to="/admin" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Quản trị</NavLink>}
              {(!user.role || user.role === 'USER') && <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Bảng điều khiển</NavLink>}
              <button onClick={logout} className="nav-link logout-btn" style={{ color: '#ef4444' }}>Đăng xuất</button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600 }}>Đăng nhập</NavLink>
          )}
        </div>

        {/* Mobile Status + Menu Trigger Area */}
        <div className="mobile-header-right" style={{ display: 'none', alignItems: 'center', gap: '0.5rem' }}>
          {user && (
            <button
              type="button"
              onClick={() => setIsSubscriptionModalOpen(true)}
              title="Bấm để xem thông tin gói cước và gia hạn"
              className="mobile-status-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.28rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: isExpired ? '1px solid #f87171' : user.isLifetime ? '1px solid #34d399' : '1px solid #93c5fd',
                background: isExpired ? '#fef2f2' : user.isLifetime ? '#ecfdf5' : '#eff6ff',
                color: isExpired ? '#dc2626' : user.isLifetime ? '#059669' : '#1d4ed8',
                whiteSpace: 'nowrap'
              }}
            >
              <Crown size={13} />
              <span>{user.isLifetime ? 'Vĩnh Viễn' : isExpired ? 'Hết hạn' : `${remainingDays} ngày`}</span>
            </button>
          )}

          <button className="mobile-menu-btn" onClick={toggleMobileMenu} aria-label="Toggle navigation menu">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <SubscriptionModal 
        isOpen={isSubscriptionModalOpen} 
        onClose={() => setIsSubscriptionModalOpen(false)} 
      />
    </header>
  );
};

export default Navbar;

import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Layers, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const location = useLocation();
  const { user, logout } = useAuth();
  const navRef = useRef<HTMLElement>(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // If menu is open and click is outside the nav links and not on the toggle button
      if (
        isMobileMenuOpen &&
        navRef.current &&
        !navRef.current.contains(target) &&
        !(target as Element).closest('.mobile-menu-btn')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
            className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}
            ref={navRef}
            onScroll={checkScroll}
          >
            <NavLink to="/pdf-editor" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Chỉnh sửa PDF</NavLink>
            <NavLink to="/pdf-merge-split" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Nối/Tách PDF</NavLink>
            <NavLink to="/pdf-compare" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>So sánh PDF</NavLink>
            <NavLink to="/pdf-compressor" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Nén PDF</NavLink>
            <NavLink to="/pdf-to-image" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>PDF sang Ảnh</NavLink>
            <NavLink to="/bao-mat-pdf" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Bảo mật PDF</NavLink>
            <NavLink to="/image-converter" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Đổi Đuôi Ảnh</NavLink>
            <NavLink to="/image-compressor" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Nén Ảnh</NavLink>
            <NavLink to="/xoa-nen-mau" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Xóa Nền Màu</NavLink>
            <NavLink to="/qr-link" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>QR & Link</NavLink>
            
            <div className="nav-divider"></div>
            
            <NavLink to="/tao-khung" className={({isActive}) => isActive ? "nav-link active font-medium text-blue-600" : "nav-link font-medium text-blue-600"}>Khung Hình</NavLink>
            
            {/* Auth Links - Mobile Only */}
            <div className="mobile-auth-links">
              {user ? (
                <>
                  {user.role === 'ADMIN' && <NavLink to="/admin" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Quản trị</NavLink>}
                  {(!user.role || user.role === 'USER') && <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>}
                  <button onClick={logout} className="nav-link logout-btn">Đăng xuất</button>
                </>
              ) : (
                <NavLink to="/login" className={({isActive}) => isActive ? "nav-link active font-medium" : "nav-link font-medium"}>Đăng nhập</NavLink>
              )}
            </div>
          </nav>

          <button 
            className={`scroll-btn right ${canScrollRight ? 'visible' : ''}`}
            onClick={() => scrollNav('right')}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Auth Links - Desktop Only */}
        <div className="desktop-auth-links">
          {user ? (
            <>
              {user.role === 'ADMIN' && <NavLink to="/admin" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Quản trị</NavLink>}
              {(!user.role || user.role === 'USER') && <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>}
              <button onClick={logout} className="nav-link logout-btn" style={{ color: '#ef4444' }}>Đăng xuất</button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600 }}>Đăng nhập</NavLink>
          )}
        </div>

        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;

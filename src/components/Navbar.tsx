import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Layers, Menu, X } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <Layers size={18} />
          </div>
          PDF Studio
        </Link>
        
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
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
          
          <div className="nav-divider" style={{ borderLeft: '1px solid var(--border)', height: '24px', margin: '0 8px' }}></div>
          
          <NavLink to="/tao-khung" className={({isActive}) => isActive ? "nav-link active font-medium text-blue-600" : "nav-link font-medium text-blue-600"}>Khung Hình</NavLink>
          
          {user ? (
            <>
              {user.role === 'ADMIN' && <NavLink to="/admin" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Quản trị</NavLink>}
              {!user.role || user.role === 'USER' && <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>}
              <button onClick={logout} className="nav-link" style={{background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold'}}>Đăng xuất</button>
            </>
          ) : (
            <NavLink to="/login" className={({isActive}) => isActive ? "nav-link active font-medium" : "nav-link font-medium"}>Đăng nhập</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

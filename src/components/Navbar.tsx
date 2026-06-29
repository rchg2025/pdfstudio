import { Link, NavLink } from 'react-router-dom';
import { Layers } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <Layers size={18} />
          </div>
          PDF Studio
        </Link>
        <nav className="navbar-links">
          <NavLink to="/pdf-editor" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Chỉnh sửa PDF</NavLink>
          <NavLink to="/pdf-merge-split" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Nối/Tách PDF</NavLink>
          <NavLink to="/pdf-compressor" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Nén PDF</NavLink>
          <NavLink to="/pdf-to-image" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>PDF sang Ảnh</NavLink>
          <NavLink to="/image-compressor" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Nén Ảnh</NavLink>
          <NavLink to="/qr-link" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>QR & Link</NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

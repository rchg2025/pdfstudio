import { Link } from 'react-router-dom';
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
          <a href="https://github.com/rchg2025/pdfstudio" target="_blank" rel="noreferrer" className="nav-link">
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

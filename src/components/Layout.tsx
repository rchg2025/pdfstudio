import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import VisitorTracker from './VisitorTracker';

const Layout = () => {
  const location = useLocation();
  const isExamRoom = location.pathname.startsWith('/phong-thi');

  if (isExamRoom) {
    return (
      <main style={{ minHeight: '100vh', width: '100%', background: 'var(--bg-primary)' }}>
        <Outlet />
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ flex: 1, position: 'relative', zIndex: 1, width: '100%' }}>
        <Outlet />
      </main>
      <footer className="container footer-layout" style={{ borderTop: '1px solid var(--border)' }}>
        <VisitorTracker />
        <p>© 2026 RCHG Studio by <a href="https://rongcon.net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Rồng Con HG</a>.</p>
      </footer>
    </>
  );
};

export default Layout;

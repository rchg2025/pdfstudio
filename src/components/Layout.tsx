import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: '2.5rem 1.5rem', flex: 1, position: 'relative', zIndex: 1 }}>
        <Outlet />
      </main>
      <footer className="container" style={{ padding: '2rem 1.5rem', textAlign: 'center', marginTop: 'auto', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
        <p>© 2026 PDF Studio by <a href="https://rongcon.net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Rồng Con HG</a>.</p>
      </footer>
    </>
  );
};

export default Layout;

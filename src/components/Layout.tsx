import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
        <Outlet />
      </main>
      <footer className="container" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--border)', marginTop: 'auto', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        <p>© 2026 PDF Studio by <a href="https://rongcon.net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>Rồng Con HG</a>.</p>
      </footer>
    </>
  );
};

export default Layout;

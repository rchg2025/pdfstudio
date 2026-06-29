import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
        <Outlet />
      </main>
      <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <p>© 2026 PDF Studio by rchg2025. All rights reserved.</p>
      </footer>
    </>
  );
};

export default Layout;

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import GoogleAuthProviderWrapper from './components/GoogleAuthProviderWrapper';

// Lazy load heavy components
const PdfEditor = React.lazy(() => import('./pages/PdfEditor'));
const PdfMergeSplit = React.lazy(() => import('./pages/PdfMergeSplit'));
const PdfToImage = React.lazy(() => import('./pages/PdfToImage'));
const PdfCompressor = React.lazy(() => import('./pages/PdfCompressor'));
const ImageCompressor = React.lazy(() => import('./pages/ImageCompressor'));
const ImageConverter = React.lazy(() => import('./pages/ImageConverter'));
const QrLink = React.lazy(() => import('./pages/QrLink'));
const PdfCompare = React.lazy(() => import('./pages/PdfCompare'));
const PdfSecurity = React.lazy(() => import('./pages/PdfSecurity'));
const WatermarkStudio = React.lazy(() => import('./pages/WatermarkStudio'));
const ChromaKeyEraser = React.lazy(() => import('./pages/ChromaKeyEraser'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Admin = React.lazy(() => import('./pages/Admin'));
const FrameCreator = React.lazy(() => import('./pages/FrameCreator'));
const FrameViewer = React.lazy(() => import('./pages/FrameViewer'));

const FallbackLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <div className="text-secondary" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ fontWeight: 500 }}>Đang tải công cụ...</p>
    </div>
  </div>
);

function App() {
  return (
    <GoogleAuthProviderWrapper>
      <NotificationProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="pdf-editor" element={
              <Suspense fallback={<FallbackLoader />}><PdfEditor /></Suspense>
            } />
            <Route path="pdf-merge-split" element={
              <Suspense fallback={<FallbackLoader />}><PdfMergeSplit /></Suspense>
            } />
            <Route path="pdf-to-image" element={
              <Suspense fallback={<FallbackLoader />}><PdfToImage /></Suspense>
            } />
            <Route path="pdf-compare" element={
              <Suspense fallback={<FallbackLoader />}><PdfCompare /></Suspense>
            } />
            <Route path="pdf-compressor" element={
              <Suspense fallback={<FallbackLoader />}><PdfCompressor /></Suspense>
            } />
            <Route path="image-compressor" element={
              <Suspense fallback={<FallbackLoader />}><ImageCompressor /></Suspense>
            } />
            <Route path="image-converter" element={
              <Suspense fallback={<FallbackLoader />}><ImageConverter /></Suspense>
            } />
            <Route path="qr-link" element={
              <Suspense fallback={<FallbackLoader />}><QrLink /></Suspense>
            } />
            <Route path="bao-mat-pdf" element={
              <Suspense fallback={<FallbackLoader />}><PdfSecurity /></Suspense>
            } />
            <Route path="watermark-studio" element={
              <Suspense fallback={<FallbackLoader />}><WatermarkStudio /></Suspense>
            } />
            <Route path="xoa-nen-mau" element={
              <Suspense fallback={<FallbackLoader />}><ChromaKeyEraser /></Suspense>
            } />
            <Route path="login" element={
              <Suspense fallback={<FallbackLoader />}><Login /></Suspense>
            } />
            <Route path="register" element={
              <Suspense fallback={<FallbackLoader />}><Register /></Suspense>
            } />
            <Route path="forgot-password" element={
              <Suspense fallback={<FallbackLoader />}><ForgotPassword /></Suspense>
            } />
            <Route path="dashboard" element={
              <Suspense fallback={<FallbackLoader />}><Dashboard /></Suspense>
            } />
            <Route path="admin" element={
              <Suspense fallback={<FallbackLoader />}><Admin /></Suspense>
            } />
            <Route path="tao-khung" element={
              <Suspense fallback={<FallbackLoader />}><FrameCreator /></Suspense>
            } />
            <Route path="f/:slug" element={
              <Suspense fallback={<FallbackLoader />}><FrameViewer /></Suspense>
            } />
          </Route>
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </GoogleAuthProviderWrapper>
  );
}

export default App;

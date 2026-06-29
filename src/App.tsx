import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';

// Lazy load heavy components
const PdfEditor = React.lazy(() => import('./pages/PdfEditor'));
const PdfMergeSplit = React.lazy(() => import('./pages/PdfMergeSplit'));
const PdfToImage = React.lazy(() => import('./pages/PdfToImage'));
const PdfCompressor = React.lazy(() => import('./pages/PdfCompressor'));
const ImageCompressor = React.lazy(() => import('./pages/ImageCompressor'));
const QrLink = React.lazy(() => import('./pages/QrLink'));
const PdfCompare = React.lazy(() => import('./pages/PdfCompare'));
const PdfSecurity = React.lazy(() => import('./pages/PdfSecurity'));

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
          <Route path="qr-link" element={
            <Suspense fallback={<FallbackLoader />}><QrLink /></Suspense>
          } />
          <Route path="bao-mat-pdf" element={
            <Suspense fallback={<FallbackLoader />}><PdfSecurity /></Suspense>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

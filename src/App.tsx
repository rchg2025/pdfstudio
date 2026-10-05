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
const ImageCrop = React.lazy(() => import('./pages/ImageCrop'));
const ImageResize = React.lazy(() => import('./pages/ImageResize'));
const ImageEnhance = React.lazy(() => import('./pages/ImageEnhance'));
const DeletePdfPages = React.lazy(() => import('./pages/DeletePdfPages'));
const QrLink = React.lazy(() => import('./pages/QrLink'));
const PdfCompare = React.lazy(() => import('./pages/PdfCompare'));
const PdfSecurity = React.lazy(() => import('./pages/PdfSecurity'));
const JpgToPdf = React.lazy(() => import('./pages/JpgToPdf'));
const WatermarkStudio = React.lazy(() => import('./pages/WatermarkStudio'));
const PdfWatermark = React.lazy(() => import('./pages/PdfWatermark'));
const ChromaKeyEraser = React.lazy(() => import('./pages/ChromaKeyEraser'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Admin = React.lazy(() => import('./pages/Admin'));
const FrameCreator = React.lazy(() => import('./pages/FrameCreator'));
const FrameViewer = React.lazy(() => import('./pages/FrameViewer'));
const RemoveAccents = React.lazy(() => import('./pages/RemoveAccents'));
const DriveCopy = React.lazy(() => import('./pages/DriveCopy'));
const AudioEditor = React.lazy(() => import('./pages/AudioEditor'));
const TextToSpeech = React.lazy(() => import('./pages/TextToSpeech'));
const AiImageGenerator = React.lazy(() => import('./pages/AiImageGenerator'));
const InteractiveEmbed = React.lazy(() => import('./pages/InteractiveEmbed'));
const EmbedPlayer = React.lazy(() => import('./pages/EmbedPlayer'));
const FlashcardDeck = React.lazy(() => import('./pages/FlashcardDeck'));
const ClassroomWheel = React.lazy(() => import('./pages/ClassroomWheel'));
const HotspotStudio = React.lazy(() => import('./pages/HotspotStudio'));
const InteractiveWorksheet = React.lazy(() => import('./pages/InteractiveWorksheet'));
const BranchingScenario = React.lazy(() => import('./pages/BranchingScenario'));
const BeforeAfterCompare = React.lazy(() => import('./pages/BeforeAfterCompare'));
const ProcessOrdering = React.lazy(() => import('./pages/ProcessOrdering'));
const SortingGame = React.lazy(() => import('./pages/SortingGame'));
const FormulaCalculator = React.lazy(() => import('./pages/FormulaCalculator'));
const ClassroomActivityTimer = React.lazy(() => import('./pages/ClassroomActivityTimer'));

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
            <Route path="xoa-trang-pdf" element={
              <Suspense fallback={<FallbackLoader />}><DeletePdfPages /></Suspense>
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
            <Route path="crop-anh" element={
              <Suspense fallback={<FallbackLoader />}><ImageCrop /></Suspense>
            } />
            <Route path="resize-anh" element={
              <Suspense fallback={<FallbackLoader />}><ImageResize /></Suspense>
            } />
            <Route path="tang-do-net-anh" element={
              <Suspense fallback={<FallbackLoader />}><ImageEnhance /></Suspense>
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
            <Route path="dong-dau-pdf" element={
              <Suspense fallback={<FallbackLoader />}><PdfWatermark /></Suspense>
            } />

            <Route path="jpg-sang-pdf" element={
              <Suspense fallback={<FallbackLoader />}><JpgToPdf /></Suspense>
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
            <Route path="xoa-dau-tieng-viet" element={
              <Suspense fallback={<FallbackLoader />}><RemoveAccents /></Suspense>
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
            <Route path="sao-chep-drive" element={
              <Suspense fallback={<FallbackLoader />}><DriveCopy /></Suspense>
            } />
            <Route path="cat-ghep-am-thanh" element={
              <Suspense fallback={<FallbackLoader />}><AudioEditor /></Suspense>
            } />
            <Route path="doc-van-ban" element={
              <Suspense fallback={<FallbackLoader />}><TextToSpeech /></Suspense>
            } />
            <Route path="tao-anh-ai" element={
              <Suspense fallback={<FallbackLoader />}><AiImageGenerator /></Suspense>
            } />
            <Route path="xuat-ma-nhung" element={
              <Suspense fallback={<FallbackLoader />}><InteractiveEmbed /></Suspense>
            } />
            <Route path="the-ghi-nho-flashcard" element={
              <Suspense fallback={<FallbackLoader />}><FlashcardDeck /></Suspense>
            } />
            <Route path="anh-tuong-tac-hotspot" element={
              <Suspense fallback={<FallbackLoader />}><HotspotStudio /></Suspense>
            } />
            <Route path="vong-quay-lop-hoc" element={
              <Suspense fallback={<FallbackLoader />}><ClassroomWheel /></Suspense>
            } />
            <Route path="phieu-bai-tap-tuong-tac" element={
              <Suspense fallback={<FallbackLoader />}><InteractiveWorksheet /></Suspense>
            } />
            <Route path="tinh-huong-phan-nhanh" element={
              <Suspense fallback={<FallbackLoader />}><BranchingScenario /></Suspense>
            } />
            <Route path="doi-chieu-truoc-sau" element={
              <Suspense fallback={<FallbackLoader />}><BeforeAfterCompare /></Suspense>
            } />
            <Route path="quy-trinh-sop" element={
              <Suspense fallback={<FallbackLoader />}><ProcessOrdering /></Suspense>
            } />
            <Route path="phan-loai-ghep-noi" element={
              <Suspense fallback={<FallbackLoader />}><SortingGame /></Suspense>
            } />
            <Route path="bang-tinh-chuyen-nganh" element={
              <Suspense fallback={<FallbackLoader />}><FormulaCalculator /></Suspense>
            } />
            <Route path="dong-ho-hoat-dong" element={
              <Suspense fallback={<FallbackLoader />}><ClassroomActivityTimer /></Suspense>
            } />
          </Route>
          {/* Dedicated Embed Player (No Navbar, No Footer for LMS/Iframe) */}
          <Route path="embed-player" element={
            <Suspense fallback={<FallbackLoader />}><EmbedPlayer /></Suspense>
          } />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </GoogleAuthProviderWrapper>
  );
}

export default App;

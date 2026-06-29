import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import PdfEditor from './pages/PdfEditor';
import PdfMergeSplit from './pages/PdfMergeSplit';
import PdfToImage from './pages/PdfToImage';
import PdfCompressor from './pages/PdfCompressor';
import ImageCompressor from './pages/ImageCompressor';
import QrLink from './pages/QrLink';
import AiImage from './pages/AiImage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="pdf-editor" element={<PdfEditor />} />
          <Route path="pdf-merge-split" element={<PdfMergeSplit />} />
          <Route path="pdf-to-image" element={<PdfToImage />} />
          <Route path="pdf-compressor" element={<PdfCompressor />} />
          <Route path="image-compressor" element={<ImageCompressor />} />
          <Route path="qr-link" element={<QrLink />} />
          <Route path="ai-image" element={<AiImage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ImageEditorCanvas from '../components/ImageEditorCanvas';
import QRCode from 'qrcode';

interface FrameData {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  user: {
    name: string;
  };
}

export default function FrameViewer() {
  const { slug } = useParams<{ slug: string }>();
  const [frame, setFrame] = useState<FrameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/frames/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setFrame(data);
          // Generate QR code
          QRCode.toDataURL(window.location.href, { width: 150 })
            .then(url => setQrCodeUrl(url))
            .catch(err => console.error(err));
        } else {
          setFrame(null);
        }
      })
      .catch(err => {
        console.error("Error fetching frame:", err);
        setFrame(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!frame) {
    return (
      <div className="container mx-auto p-8 text-center text-red-500">
        <h1 className="text-2xl font-bold">Khung hình không tồn tại hoặc đã bị xóa</h1>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl py-12">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 uppercase tracking-wide">
        {frame.title}
      </h1>

      <ImageEditorCanvas frameUrl={frame.imageUrl} />

      <div className="mt-12 max-w-2xl mx-auto flex flex-col items-center">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
            {frame.user?.name?.charAt(0) || 'U'}
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg text-gray-800">{frame.user?.name || 'Thành viên'}</h3>
            <p className="text-sm text-gray-500">Tác giả khung hình</p>
          </div>
        </div>

        <div className="w-full border border-gray-200 rounded-xl p-6 bg-white relative">
          <h4 className="text-gray-600 font-medium absolute -top-3 left-6 bg-white px-2">Chia sẻ</h4>
          <p className="text-sm text-gray-500 mb-2">Nhấn để sao chép đường dẫn</p>
          
          <div className="flex bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            <input 
              type="text" 
              readOnly 
              value={window.location.href}
              className="flex-1 bg-transparent px-4 py-3 outline-none text-gray-600 font-mono text-sm"
            />
            <button 
              onClick={handleCopyLink}
              className="px-6 bg-white border-l border-gray-200 hover:bg-gray-50 transition-colors font-medium text-blue-600"
            >
              {copied ? 'Đã chép' : 'Sao chép'}
            </button>
          </div>

          {qrCodeUrl && (
            <div className="mt-6 flex flex-col items-center">
              <span className="text-sm text-gray-500 mb-2">Mã QR</span>
              <img src={qrCodeUrl} alt="QR Code" className="border border-gray-200 rounded-lg p-1" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

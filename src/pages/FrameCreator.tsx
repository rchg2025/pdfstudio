import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function FrameCreator() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [previewBase64, setPreviewBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center mt-12">
        <h2 className="text-xl font-medium text-gray-600">Vui lòng đăng nhập để tạo khung hình</h2>
        <button onClick={() => navigate('/login')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">Đăng nhập</button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'image/png') {
        setError('Định dạng bắt buộc là PNG.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('Dung lượng tối đa là 2MB.');
        return;
      }
      setError('');
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviewBase64(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !previewBase64) {
      setError('Vui lòng điền đủ thông tin và tải lên khung hình.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/frames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          slug,
          imageUrl: previewBase64
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi khi tạo khung hình');
      }

      navigate(`/f/${slug}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl py-12">
      <h1 className="text-3xl font-bold text-center mb-12 text-gray-800 uppercase tracking-wide">
        TẠO MỚI SỰ KIỆN, HOẠT ĐỘNG, CHIẾN DỊCH
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-[#1e293b]">Thêm hình khung</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Định dạng bắt buộc hình khung là <strong>PNG</strong> và phải có <strong>vùng trong suốt</strong>.<br/>
            Kích thước đề xuất là hình vuông cạnh <strong>1080px</strong>.<br/>
            Dung lượng tối đa của hình khung là <strong>2MB</strong>.
          </p>

          <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-[#f8fafc] relative overflow-hidden">
            {previewBase64 ? (
              <img src={previewBase64} alt="Preview" className="w-full h-full object-contain p-4" />
            ) : (
              <div className="text-center p-6">
                <label className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium cursor-pointer hover:bg-blue-700 transition inline-block mb-4 shadow-sm">
                  Thêm hình khung
                  <input type="file" accept="image/png" className="hidden" onChange={handleFileChange} />
                </label>
                <p className="text-gray-400 text-sm">định dạng PNG, tối đa 2MB</p>
                <p className="text-gray-400 text-sm">kích thước cạnh 1080px.</p>
              </div>
            )}
            {previewBase64 && (
              <label className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-lg font-medium cursor-pointer shadow-sm text-sm border border-gray-200">
                Đổi hình khác
                <input type="file" accept="image/png" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-6 text-[#1e293b]">Thông tin chung</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tối thiểu 10 ký tự"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Đường dẫn (URL) <span className="text-red-500">*</span></label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-shadow">
              <span className="bg-gray-100 px-4 py-3 text-gray-500 text-sm border-r border-gray-200">
                {window.location.origin}/f/
              </span>
              <input 
                type="text" 
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="duong-dan-khung-hinh"
                className="flex-1 px-4 py-3 outline-none text-sm"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">Đường dẫn để chia sẻ, độ dài tối đa 6 ký tự. (Chỉ cho phép chữ thường, số và dấu gạch ngang)</p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-semibold text-white uppercase tracking-wider transition-all shadow-md
              ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Đang xử lý...' : 'Tạo Khung Hình'}
          </button>
        </div>
      </form>
    </div>
  );
}

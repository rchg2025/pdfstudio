import { useState, useEffect } from 'react';
import { Copy, Check, Type, FileText, Calendar, Hash } from 'lucide-react';
import './RemoveAccents.css';

export default function RemoveAccents() {
  const [time, setTime] = useState('');
  const [version, setVersion] = useState('1');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    setTime(`${month}-${year}`);
  }, []);

  const removeVietnameseTones = (str: string) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
    str = str.replace(/\u02C6|\u0306|\u031B/g, "");
    return str;
  };

  const handleProcess = () => {
    const lines = input.split('\n');
    const processedLines = lines.map(line => {
      if (!line.trim()) return '';
      const noAccent = removeVietnameseTones(line).trim();
      return `${time}_${noAccent}-Phien ban so ${version}`;
    });
    setOutput(processedLines.join('\n'));
  };

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div className="text-center mb-8">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '1rem', borderRadius: '50%' }}>
            <Type size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-gradient">Công Cụ Đổi Tên File Chuẩn</h1>
        <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Xóa dấu tiếng Việt và tạo tên file chuẩn theo định dạng khoa học để tránh lỗi hiển thị khi upload.
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} /> Thời gian
            </label>
            <input 
              type="text" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="VD: 08-2026"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Hash size={16} /> Phiên bản số
            </label>
            <input 
              type="text" 
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="VD: 1"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} /> Tên file / Tiêu đề gốc (Mỗi dòng 1 tên)
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={4}
            placeholder="Kế hoạch Khảo sát Workshop chuyên đề AI đợt 1/2026"
          ></textarea>
        </div>

        <button 
          onClick={handleProcess}
          className="w-full btn btn-primary flex justify-center items-center py-3 rounded-lg font-medium text-lg mb-6"
        >
          Tạo Tên File Chuẩn
        </button>

        {output && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Kết quả</label>
              <button 
                onClick={copyToClipboard}
                className="text-sm flex items-center gap-1 text-primary hover:text-primary-dark transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Đã copy!' : 'Copy'}
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none"
              rows={4}
            ></textarea>
          </div>
        )}
      </div>
    </div>
  );
}

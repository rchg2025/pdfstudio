import { useState, useEffect } from 'react';
import { Download, RefreshCw, FileBox, Calendar, Hash, X, Archive } from 'lucide-react';
import JSZip from 'jszip';
import FileUploadZone from '../components/FileUploadZone';
import './RemoveAccents.css';

export default function RemoveAccents() {
  const [files, setFiles] = useState<File[]>([]);
  const [time, setTime] = useState('');
  const [version, setVersion] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    setTime(`${month}-${year}`);
  }, []);

  const removeVietnameseTones = (str: string) => {
    let newStr = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    newStr = newStr.replace(/đ/g, 'd').replace(/Đ/g, 'D');
    // Replace all whitespace sequences with a single underscore
    newStr = newStr.replace(/\s+/g, '_');
    return newStr;
  };

  const getNewFileName = (originalName: string) => {
    const lastDotIndex = originalName.lastIndexOf('.');
    let nameWithoutExt = originalName;
    let ext = '';
    
    if (lastDotIndex !== -1) {
      nameWithoutExt = originalName.substring(0, lastDotIndex);
      ext = originalName.substring(lastDotIndex);
    }

    const noAccent = removeVietnameseTones(nameWithoutExt).trim();
    // Return formatted name based on time and version
    return `${time}_${noAccent}-Phien ban so ${version}${ext}`;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = Array.from(selectedFiles);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startOver = () => {
    setFiles([]);
  };

  const downloadFile = (file: File, newName: string) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = newName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    if (files.length === 0) return;
    
    if (files.length === 1) {
      downloadFile(files[0], getNewFileName(files[0].name));
      return;
    }

    setIsProcessing(true);
    try {
      const zip = new JSZip();
      
      files.forEach(file => {
        const newName = getNewFileName(file.name);
        zip.file(newName, file);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Renamed_Files_${time}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error zipping files:', error);
      alert('Có lỗi xảy ra khi nén file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="remove-accents-container animate-fade-in">
      <div className="ra-header">
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Đổi Tên File Chuẩn Khoa Học</h1>
        <p className="text-secondary">Xóa dấu Tiếng Việt tự động và đổi tên hàng loạt file để tránh lỗi tải lên</p>
      </div>

      <div className="glass-card">
        <div className="settings-grid">
          <div className="setting-group">
            <label className="setting-label">
              <Calendar size={16} /> Thời gian
            </label>
            <input 
              type="text" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="setting-input"
              placeholder="VD: 08-2026"
            />
          </div>
          <div className="setting-group">
            <label className="setting-label">
              <Hash size={16} /> Phiên bản số
            </label>
            <input 
              type="text" 
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="setting-input"
              placeholder="VD: 1"
            />
          </div>
        </div>

        {files.length === 0 ? (
          <FileUploadZone 
            onFileSelect={handleFileSelect} 
            accept="*/*" 
            hintText="Hỗ trợ mọi định dạng file (PDF, Word, Excel, Ảnh...)"
            multiple={true}
          />
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Danh sách File ({files.length})</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => document.getElementById('add-more-files')?.click()}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Thêm file
                </button>
                <input 
                  id="add-more-files"
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={(e) => handleFileSelect(e.target.files)}
                  style={{ display: 'none' }}
                />
                <button 
                  onClick={startOver}
                  className="icon-btn"
                  title="Xóa tất cả"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>

            <div className="file-list-container">
              {files.map((file, index) => {
                const newName = getNewFileName(file.name);
                return (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <div className="file-icon">
                        <FileBox size={24} />
                      </div>
                      <div className="file-names">
                        <span className="file-name-old">{file.name}</span>
                        <span className="file-name-new" title={newName}>{newName}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(index)}
                      className="icon-btn"
                      style={{ color: 'var(--error)' }}
                      title="Xóa file này"
                    >
                      <X size={20} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button 
                onClick={downloadAll}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : files.length > 1 ? (
                  <Archive size={20} />
                ) : (
                  <Download size={20} />
                )}
                {isProcessing 
                  ? 'Đang nén file...' 
                  : files.length > 1 
                    ? 'Tải Xuống Tất Cả (.zip)' 
                    : 'Tải Xuống File'
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

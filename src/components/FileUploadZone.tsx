import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadZoneProps {
  onFileSelect: (files: FileList | null) => void;
  accept?: string;
  hintText?: string;
  multiple?: boolean;
}

export default function FileUploadZone({ 
  onFileSelect, 
  accept = "application/pdf", 
  hintText = "Chỉ hỗ trợ file .pdf",
  multiple = false
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
    }
    // Reset input value so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className={`upload-zone-standard ${isDragging ? 'drag-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      style={{
        border: '2px dashed var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '3.5rem 2rem',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        background: isDragging ? 'rgba(37, 99, 235, 0.03)' : 'transparent',
        borderColor: isDragging ? 'var(--primary)' : 'var(--border)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.background = 'rgba(37, 99, 235, 0.02)';
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      <Upload size={32} style={{ margin: '0 auto 1rem', color: '#1e293b' }} />
      <p style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        Kéo thả file vào đây hoặc <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>nhấn để chọn file</span>
      </p>
      <p className="text-secondary" style={{ fontSize: '0.875rem' }}>{hintText}</p>
      <input 
        type="file" 
        accept={accept} 
        multiple={multiple}
        className="hidden" 
        ref={fileInputRef}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}

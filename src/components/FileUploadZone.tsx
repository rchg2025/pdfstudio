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
        border: '2px dashed',
        borderColor: isDragging ? 'var(--primary)' : 'var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '4rem 2rem',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all var(--transition-normal)',
        background: isDragging 
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))' 
          : 'var(--bg-secondary)',
        boxShadow: isDragging ? 'inset 0 0 0 2px var(--primary-glow)' : 'var(--shadow-sm)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.transform = 'none';
        }
      }}
    >
      <div style={{
        width: '4rem', height: '4rem', 
        borderRadius: '50%', 
        background: 'var(--bg-tertiary)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.25rem',
        transition: 'transform var(--transition-normal)',
        transform: isDragging ? 'scale(1.1) translateY(-4px)' : 'none',
        color: 'var(--primary)'
      }}>
        <Upload size={32} />
      </div>
      <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
        Kéo thả file vào đây hoặc <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>chọn file</span>
      </p>
      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>{hintText}</p>
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

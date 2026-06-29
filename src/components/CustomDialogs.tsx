import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Lock, X } from 'lucide-react';

export const useDialogs = () => {
  const [alertConfig, setAlertConfig] = useState<{ message: string, title?: string } | null>(null);
  const [promptConfig, setPromptConfig] = useState<{ message: string, resolve: (val: string | null) => void, title?: string } | null>(null);

  const showAlert = (message: string, title: string = 'Thông báo') => {
    setAlertConfig({ message, title });
  };

  const showPrompt = async (message: string, title: string = 'Yêu cầu nhập mật khẩu'): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      setPromptConfig({ message, title, resolve });
    });
  };

  const closeAlert = () => setAlertConfig(null);
  const closePrompt = (val: string | null) => {
    if (promptConfig) promptConfig.resolve(val);
    setPromptConfig(null);
  };

  const DialogsComponent = () => (
    <>
      {alertConfig && (
        <AlertModal 
          title={alertConfig.title || 'Thông báo'} 
          message={alertConfig.message} 
          onClose={closeAlert} 
        />
      )}
      {promptConfig && (
        <PromptModal 
          title={promptConfig.title || 'Yêu cầu nhập mật khẩu'} 
          message={promptConfig.message} 
          onSubmit={(val) => closePrompt(val)} 
          onCancel={() => closePrompt(null)} 
        />
      )}
    </>
  );

  return { showAlert, showPrompt, DialogsComponent };
};

const AlertModal = ({ title, message, onClose }: { title: string, message: string, onClose: () => void }) => {
  return createPortal(
    <div className="preview-modal-overlay" style={{ zIndex: 99999 }} onClick={onClose}>
      <div className="preview-modal-content" style={{ maxWidth: '400px', width: '90%', background: 'var(--bg-primary)' }} onClick={e => e.stopPropagation()}>
        <div className="preview-modal-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <AlertCircle size={20} className="text-primary" />
            {title}
          </h3>
          <button className="icon-btn delete" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '1.5rem', fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {message}
        </div>
        <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <button className="btn btn-primary" onClick={onClose} style={{ minWidth: '100px' }}>OK</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const PromptModal = ({ title, message, onSubmit, onCancel }: { title: string, message: string, onSubmit: (val: string) => void, onCancel: () => void }) => {
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim()) {
      onSubmit(val);
    }
  };

  return createPortal(
    <div className="preview-modal-overlay" style={{ zIndex: 99999 }} onClick={onCancel}>
      <div className="preview-modal-content" style={{ maxWidth: '400px', width: '90%', background: 'var(--bg-primary)' }} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="preview-modal-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Lock size={20} className="text-primary" />
              {title}
            </h3>
            <button type="button" className="icon-btn delete" onClick={onCancel}>
              <X size={20} />
            </button>
          </div>
          <div style={{ padding: '1.5rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
            <p style={{ marginBottom: '1rem' }}>{message}</p>
            <input 
              ref={inputRef}
              type="password" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              value={val} 
              onChange={e => setVal(e.target.value)} 
              placeholder="Nhập mật khẩu..." 
            />
          </div>
          <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={!val.trim()}>Xác nhận</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

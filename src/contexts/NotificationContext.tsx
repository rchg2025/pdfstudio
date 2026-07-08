import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationContextType {
  showToast: (message: string, type?: NotificationType) => void;
  showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
  showAlert: (title: string, message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Toast State
  const [toast, setToast] = useState<{ message: string; type: NotificationType; id: number } | null>(null);
  
  // Confirm State
  const [confirmConfig, setConfirmConfig] = useState<{ message: string; title: string; onConfirm: () => void } | null>(null);
  
  // Alert State
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: NotificationType } | null>(null);

  const showToast = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3000);
  }, []);

  const showConfirm = useCallback((message: string, onConfirm: () => void, title: string = 'Xác nhận') => {
    setConfirmConfig({ message, onConfirm, title });
  }, []);

  const showAlert = useCallback((title: string, message: string, type: NotificationType = 'info') => {
    setAlertConfig({ title, message, type });
  }, []);

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm, showAlert }}>
      {children}
      
      {/* Toast Render */}
      {toast && createPortal(
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 99999,
          background: 'var(--bg-primary)', padding: '1rem 1.5rem', borderRadius: '0.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          borderLeft: `4px solid ${
            toast.type === 'success' ? '#10b981' : 
            toast.type === 'error' ? '#ef4444' : 
            toast.type === 'warning' ? '#f59e0b' : '#3b82f6'
          }`,
          animation: 'slideInRight 0.3s ease-out'
        }}>
          {toast.type === 'success' && <CheckCircle size={20} color="#10b981" />}
          {toast.type === 'error' && <AlertCircle size={20} color="#ef4444" />}
          {toast.type === 'warning' && <AlertTriangle size={20} color="#f59e0b" />}
          {toast.type === 'info' && <Info size={20} color="#3b82f6" />}
          <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{toast.message}</p>
        </div>,
        document.body
      )}

      {/* Confirm Modal Render */}
      {confirmConfig && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConfirmConfig(null)}>
          <div className="glass-card" style={{ padding: '2rem', width: '90%', maxWidth: '400px', background: 'var(--bg-primary)', animation: 'popIn 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={24} color="#f59e0b" />
              {confirmConfig.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>{confirmConfig.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setConfirmConfig(null)} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Hủy</button>
              <button onClick={() => { confirmConfig.onConfirm(); setConfirmConfig(null); }} className="btn btn-primary" style={{ background: '#ef4444' }}>Xác nhận</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Alert Modal Render */}
      {alertConfig && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setAlertConfig(null)}>
          <div className="glass-card" style={{ padding: '2rem', width: '90%', maxWidth: '400px', background: 'var(--bg-primary)', animation: 'popIn 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {alertConfig.type === 'error' ? <AlertCircle size={24} color="#ef4444" /> : <Info size={24} color="#3b82f6" />}
              {alertConfig.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>{alertConfig.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setAlertConfig(null)} className="btn btn-primary">Đóng</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </NotificationContext.Provider>
  );
};

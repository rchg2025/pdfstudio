import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Copy, Download, Lock, AlertTriangle } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './TextToSpeech.css'; // Reuse container styles
import './SpeechToText.css';

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function SpeechToText() {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('vi-VN');
  const [status, setStatus] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const { showAlert, DialogsComponent } = useDialogs();

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Show results while speaking
    
    recognition.onstart = () => {
      setIsRecording(true);
      setStatus('Đang lắng nghe...');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setText(prev => prev + finalTranscript);
      }
      
      // If we want to show interim results, we could set it to a separate state,
      // but for simplicity, we'll just wait for final or let the user type over it.
      if (interimTranscript) {
        setStatus(`Đang nghe: ${interimTranscript}`);
      } else {
        setStatus('Đang lắng nghe...');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
      
      if (event.error === 'not-allowed') {
        setStatus('Lỗi: Cần cấp quyền sử dụng Microphone.');
        showAlert('Vui lòng cấp quyền truy cập Microphone cho trình duyệt.', 'Lỗi Quyền');
      } else if (event.error === 'network') {
        setStatus('Lỗi: Cần kết nối Internet (đối với một số trình duyệt).');
      } else {
        setStatus(`Lỗi: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // If we stopped it manually, don't restart.
      // If it stopped automatically (e.g., silence), we could theoretically restart it,
      // but standard behavior is to just stop recording.
      setIsRecording(false);
      setStatus('Đã dừng ghi âm.');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [showAlert]);

  // Update language when changed
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
      // If recording, we need to restart it to apply language change
      if (isRecording) {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current.start();
        }, 100);
      }
    }
  }, [language]);

  const toggleRecording = () => {
    if (!isSupported) {
      showAlert('Trình duyệt của bạn không hỗ trợ tính năng Nhận diện giọng nói. Vui lòng sử dụng Google Chrome hoặc Microsoft Edge.', 'Lỗi');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      // Add a space if there's already text to separate new sentences
      if (text && !text.endsWith(' ') && !text.endsWith('\n')) {
        setText(prev => prev + ' ');
      }
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e); // Might throw if already started
      }
    }
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setStatus('Đã sao chép vào bộ nhớ tạm!');
    setTimeout(() => {
      if (isRecording) setStatus('Đang lắng nghe...');
      else setStatus('');
    }, 2000);
  };

  const handleDownload = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ghi-am.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="audio-tool-container">
      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '0.75rem', background: 'var(--primary)', borderRadius: 'var(--radius-md)', color: 'white' }}>
          <Mic size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Âm Thanh thành Văn Bản</h1>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Nhận diện giọng nói và chuyển đổi thành văn bản theo thời gian thực</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div className="local-processing-notice">
          <Lock size={16} />
          Xử lý trực tiếp trên trình duyệt của bạn — Giọng nói không được lưu trữ hay gửi đi đâu khác.
        </div>

        {!isSupported && (
          <div className="local-processing-notice" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertTriangle size={16} />
            Trình duyệt của bạn không hỗ trợ API Nhận diện giọng nói. Vui lòng sử dụng Google Chrome hoặc Edge.
          </div>
        )}

        <div className="record-btn-container">
          <button 
            className={`btn-record ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            disabled={!isSupported}
          >
            {isRecording ? (
              <>
                <MicOff size={24} />
                Dừng Ghi Âm
              </>
            ) : (
              <>
                <Mic size={24} />
                Bắt Đầu Ghi Âm
              </>
            )}
          </button>
        </div>

        <textarea
          className={`stt-textarea ${isRecording ? 'recording' : ''}`}
          placeholder={isRecording ? "Đang nghe... hãy bắt đầu nói" : "Văn bản sẽ xuất hiện ở đây. Bạn cũng có thể gõ thêm văn bản bằng bàn phím."}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="stt-status">
          {status}
        </div>

        <div className="stt-actions">
          <div className="audio-input-group" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <label style={{ marginRight: '1rem', marginBottom: 0 }}>Ngôn ngữ:</label>
            <select 
              className="stt-language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="vi-VN">Tiếng Việt (Việt Nam)</option>
              <option value="en-US">English (United States)</option>
              <option value="en-GB">English (United Kingdom)</option>
              <option value="fr-FR">Français (France)</option>
              <option value="ja-JP">日本語 (Nhật Bản)</option>
              <option value="ko-KR">한국어 (Hàn Quốc)</option>
              <option value="zh-CN">中文 (Tiếng Trung)</option>
            </select>
          </div>

          <div className="stt-right-actions">
            <button className="btn-icon-text" onClick={handleCopy} disabled={!text}>
              <Copy size={18} />
              Sao chép
            </button>
            <button className="btn-icon-text" onClick={handleDownload} disabled={!text}>
              <Download size={18} />
              Tải .txt
            </button>
          </div>
        </div>
      </div>
      <DialogsComponent />
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { 
  FileText, Upload, Sparkles, Send, Bot, User, 
  BookOpen, Key, Check
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useDialogs } from '../components/CustomDialogs';
import './ChatWithPdf.css';

// Khởi tạo worker pdfjs
try {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }
} catch {}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ChatWithPdf() {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const { showAlert } = useDialogs();

  // Trạng thái tài liệu PDF
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);

  // Phiên chat với AI
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // API Key Gemini riêng (nếu người dùng muốn dùng key riêng)
  const [customApiKey, setCustomApiKey] = useState(() => {
    return localStorage.getItem('rchg_gemini_api_key') || '';
  });
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Câu hỏi trắc nghiệm tự sinh từ PDF
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any[] | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tự cuộn xuống đáy khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAsking]);

  // Xử lý nạp file PDF và trích xuất text từng trang bằng pdfjs-dist
  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      showAlert('Vui lòng chọn file định dạng PDF (.pdf)', 'File không hợp lệ');
      return;
    }

    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setIsExtracting(true);
    setExtractProgress(10);
    setMessages([]);
    setSessionId(null);
    setGeneratedQuiz(null);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const totalPages = pdf.numPages;
      setPageCount(totalPages);

      let fullText = '';
      // Trích xuất tối đa 50 trang đầu để tránh vượt dung lượng RAM trình duyệt
      const maxPagesToRead = Math.min(totalPages, 50);

      for (let i = 1; i <= maxPagesToRead; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        fullText += `\n--- [TRANG ${i}] ---\n` + pageText;
        setExtractProgress(Math.round(10 + (i / maxPagesToRead) * 70));
      }

      setExtractedText(fullText);
      setExtractProgress(90);

      // Gửi lên backend để tạo phiên chat & tóm tắt
      const res = await fetch('/api/pdf-chat?action=create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
          pageCount: totalPages,
          extractedText: fullText,
          customApiKey: customApiKey.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.session) {
        setSessionId(data.session.id);
        setMessages(data.session.messages || []);
        showToast('Đã đọc và tóm tắt tài liệu PDF thành công!', 'success');
      } else {
        throw new Error(data.message || 'Không thể tạo phiên chat AI');
      }
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || 'Lỗi khi đọc file PDF', 'Lỗi xử lý');
    } finally {
      setIsExtracting(false);
      setExtractProgress(100);
    }
  };

  // Gửi câu hỏi cho AI
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText.trim();
    if (!textToSend || !sessionId || isAsking) return;

    if (!customPrompt) setInputText('');

    const newMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);
    setIsAsking(true);

    try {
      const res = await fetch('/api/pdf-chat?action=ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          question: textToSend,
          customApiKey: customApiKey.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(data.messages || []);
      } else {
        throw new Error(data.message || 'AI không thể phản hồi lúc này');
      }
    } catch (err: any) {
      showAlert(err.message || 'Lỗi kết nối tới AI', 'Lỗi AI');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Xin lỗi, đã xảy ra lỗi khi trao đổi với AI. Bạn vui lòng kiểm tra lại API Key hoặc đặt lại câu hỏi ngắn hơn.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  // Tạo trắc nghiệm nhanh từ PDF
  const handleGenerateQuiz = async () => {
    if (!sessionId || isGeneratingQuiz) return;
    setIsGeneratingQuiz(true);
    try {
      const res = await fetch('/api/pdf-chat?action=generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          count: 5,
          customApiKey: customApiKey.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.quiz) && data.quiz.length > 0) {
        setGeneratedQuiz(data.quiz);
        showToast('Đã tạo 5 câu trắc nghiệm từ tài liệu thành công!', 'success');
      } else {
        showAlert('AI không thể trích xuất câu hỏi từ đoạn văn bản này.', 'Thông báo');
      }
    } catch (e: any) {
      showAlert(e.message || 'Lỗi khi tạo câu hỏi ôn tập', 'Lỗi');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="pdf-chat-page">
      {/* Top Header */}
      <header className="pdf-chat-header">
        <div className="pdf-chat-brand">
          <div className="pdf-brand-icon">
            <Bot size={22} color="#fff" />
          </div>
          <div>
            <h1>Trợ Lý Hỏi Đáp Với Tài Liệu PDF (Chat with PDF)</h1>
            <p>Đọc hiểu giáo trình, tài liệu chuyên ngành và giải đáp thắc mắc bằng Google Gemini AI</p>
          </div>
        </div>

        <div className="pdf-header-actions">
          <button 
            className="btn-api-key"
            onClick={() => setShowKeyModal(true)}
            title="Cài đặt API Key riêng"
          >
            <Key size={16} /> {customApiKey ? 'Đã có API Key' : 'Nhập API Key'}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="pdf-chat-container">
        {/* CỘT TRÁI: TÀI LIỆU PDF & THÔNG TIN */}
        <div className="pdf-doc-panel">
          <div className="doc-panel-header">
            <h3><BookOpen size={18} /> Tài Liệu Đang Xử Lý</h3>
            <button 
              className="btn-change-file"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} /> Tải file khác
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".pdf"
              onChange={e => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
            />
          </div>

          {!file ? (
            <div 
              className="upload-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
            >
              <div className="dropzone-icon">📄</div>
              <h4>Kéo thả hoặc chọn file PDF tại đây</h4>
              <p>Hỗ trợ giáo trình, bài giảng, slide bài tập, hợp đồng (tối đa 50 trang)</p>
              <button type="button" className="btn btn-primary" style={{ marginTop: '1rem', fontWeight: 600 }}>
                Chọn File PDF Từ Máy
              </button>
            </div>
          ) : (
            <div className="doc-content-view">
              <div className="doc-info-badge">
                <FileText size={18} color="#2563eb" />
                <div className="doc-meta">
                  <span className="doc-name">{fileName}</span>
                  <span className="doc-pages">{pageCount} trang • {(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>

              {isExtracting && (
                <div className="extract-progress-box">
                  <div className="extract-label">
                    <span>Đang bóc tách và phân tích văn bản PDF...</span>
                    <span>{extractProgress}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${extractProgress}%` }}></div>
                  </div>
                </div>
              )}

              {/* Nút hành động nhanh */}
              <div className="quick-actions-bar">
                <button 
                  className="quick-btn"
                  onClick={() => handleSendMessage('Hãy tóm tắt ngắn gọn 3 luận điểm cốt lõi nhất của tài liệu này.')}
                  disabled={isAsking || !sessionId}
                >
                  ⚡ Tóm tắt 3 ý chính
                </button>
                <button 
                  className="quick-btn"
                  onClick={() => handleSendMessage('Hãy liệt kê các từ khóa hoặc thuật ngữ chuyên ngành quan trọng xuất hiện trong tài liệu kèm giải thích.')}
                  disabled={isAsking || !sessionId}
                >
                  🔑 Thuật ngữ chính
                </button>
                <button 
                  className="quick-btn btn-highlight"
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz || !sessionId}
                >
                  <Sparkles size={14} /> {isGeneratingQuiz ? 'Đang tạo câu hỏi...' : 'Tạo 5 câu trắc nghiệm'}
                </button>
              </div>

              {/* Khung xem trước câu hỏi trắc nghiệm nếu đã sinh */}
              {generatedQuiz && (
                <div className="quiz-generated-box">
                  <h4>📝 Câu hỏi ôn tập do AI sinh ra:</h4>
                  {generatedQuiz.map((q, qIdx) => (
                    <div key={qIdx} className="quiz-item-card">
                      <div className="q-title"><strong>Câu {qIdx + 1}:</strong> {q.question}</div>
                      <div className="q-opts">
                        {q.options?.map((opt: string, optIdx: number) => (
                          <div 
                            key={optIdx} 
                            className={`q-opt-line ${optIdx === q.correctAnswer ? 'opt-correct' : ''}`}
                          >
                            <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                            {optIdx === q.correctAnswer && <Check size={14} color="#059669" />}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="q-explain">💡 <em>{q.explanation}</em></div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Preview nội dung text trích xuất */}
              <div className="doc-text-preview">
                <div className="preview-heading">Văn bản đã bóc tách từ PDF:</div>
                <div className="preview-body">{extractedText || 'Chưa có nội dung văn bản.'}</div>
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: KHUNG TRÒ CHUYỆN VỚI AI */}
        <div className="pdf-chat-panel">
          <div className="chat-messages-scroll">
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <Bot size={48} color="#94a3b8" />
                <h3>Chưa có câu hỏi nào</h3>
                <p>Hãy tải lên tài liệu PDF ở cột bên trái để bắt đầu trò chuyện và tra cứu thông tin với AI!</p>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div key={idx} className={`chat-message-row ${m.role === 'user' ? 'msg-user' : 'msg-ai'}`}>
                  <div className="msg-avatar">
                    {m.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  <div className="msg-bubble">
                    <div className="msg-text" style={{ whiteSpace: 'pre-wrap' }}>
                      {m.content}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isAsking && (
              <div className="chat-message-row msg-ai">
                <div className="msg-avatar"><Bot size={18} /></div>
                <div className="msg-bubble msg-typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="chat-input-bar">
            <form 
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', width: '100%', gap: '0.6rem' }}
            >
              <input 
                type="text" 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={sessionId ? "Đặt câu hỏi về nội dung tài liệu này..." : "Vui lòng tải file PDF lên trước..."}
                disabled={!sessionId || isAsking}
                className="chat-text-input"
              />
              <button 
                type="submit" 
                className="btn-send-message"
                disabled={!sessionId || !inputText.trim() || isAsking}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal Cài Đặt Gemini API Key */}
      {showKeyModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} color="var(--primary)" /> Cài Đặt Google Gemini API Key
              </h3>
              <button className="btn-close" onClick={() => setShowKeyModal(false)}>×</button>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Mặc định hệ thống dùng chung API Key máy chủ. Nếu muốn tăng tốc độ xử lý hoặc tránh giới hạn hạn mức trong giờ cao điểm, bạn có thể nhập Gemini API Key miễn phí của riêng bạn.
              </p>
              <input 
                type="password"
                value={customApiKey}
                onChange={e => setCustomApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="form-input"
                style={{ marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    localStorage.removeItem('rchg_gemini_api_key');
                    setCustomApiKey('');
                    showToast('Đã xóa API Key cá nhân', 'info');
                    setShowKeyModal(false);
                  }}
                >
                  Dùng Key Mặc Định
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    localStorage.setItem('rchg_gemini_api_key', customApiKey.trim());
                    showToast('Đã lưu API Key thành công!', 'success');
                    setShowKeyModal(false);
                  }}
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

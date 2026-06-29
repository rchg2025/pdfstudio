import React, { useState, useRef, useEffect, type FormEvent } from 'react';
import { 
  Upload, FileText, RotateCcw, RotateCw, Trash2, Download, RefreshCw, 
  FileBox, Eye, Sparkles, BookOpen, MessageSquare, Volume2, VolumeX, Send, X, Undo
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import './PdfEditor.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

function pcmToWav(pcmBuffer: Uint8Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + pcmBuffer.length);
  const view = new DataView(buffer);
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmBuffer.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); 
  view.setUint16(22, 1, true); 
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); 
  view.setUint16(32, 2, true); 
  view.setUint16(34, 16, true); 
  writeString(view, 36, 'data');
  view.setUint32(40, pcmBuffer.length, true);

  for (let i = 0; i < pcmBuffer.length; i++) {
    view.setUint8(44 + i, pcmBuffer[i]);
  }
  return buffer;
}

interface PageData {
  id: number;
  originalIndex: number;
  dataUrl: string;
  rotation: number;
  isDeleted: boolean;
  text: string;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pages, setPages] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewPage, setPreviewPage] = useState<PageData | null>(null);
  const [fileSize, setFileSize] = useState(0);

  // AI State
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
  const [aiActiveTab, setAiActiveTab] = useState<'summary' | 'chat'>('summary');
  const [aiSummary, setAiSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState('');
  const [isPlayingTts, setIsPlayingTts] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatLoading]);

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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      loadPdf(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      loadPdf(selectedFile);
    }
  };

  const loadPdf = async (pdfFile: File) => {
    setFile(pdfFile);
    setFileSize(pdfFile.size);
    setIsLoading(true);
    setPages([]);
    setAiSummary('');
    setChatHistory([]);
    setTtsAudioUrl('');
    setIsPlayingTts(false);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const typedarray = new Uint8Array(arrayBuffer);
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
      
      const loadedPages: PageData[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport } as any).promise;
          
          let pageText = "";
          try {
            const textContent = await page.getTextContent();
            pageText = textContent.items.map((item: any) => item.str).join(' ');
          } catch (e) {
            console.warn(`Không thể trích xuất văn bản trang ${i}:`, e);
          }

          loadedPages.push({
            id: i,
            originalIndex: i - 1,
            dataUrl: canvas.toDataURL('image/jpeg', 0.8),
            rotation: 0,
            isDeleted: false,
            text: pageText
          });
        }
      }
      setPages(loadedPages);
    } catch (error) {
      console.error(error);
      alert('Không thể đọc file PDF. File có thể bị hỏng hoặc đã được mã hóa mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  const callGeminiApi = async (payload: any, systemPrompt = "", modelName = "gemini-2.5-flash") => {
    if (!apiKey) {
      throw new Error("Vui lòng cung cấp API Key Gemini trong file .env.local (VITE_GEMINI_API_KEY).");
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    let retries = 3;
    let delay = 1000;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const requestBody: any = { contents: payload };
        if (systemPrompt) {
          requestBody.systemInstruction = { parts: [{ text: systemPrompt }] };
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          return await response.json();
        }
        
        const errText = await response.text();
        console.warn(`Yêu cầu Gemini thất bại lần ${attempt}: ${errText}`);
      } catch (err) {
        console.warn(`Lỗi kết nối Gemini lần ${attempt}:`, err);
      }

      if (attempt < retries) {
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
      }
    }
    throw new Error("Không thể kết nối với dịch vụ AI. Vui lòng kiểm tra lại kết nối mạng hoặc API Key.");
  };

  const handleGenerateSummary = async () => {
    const activePages = pages.filter(p => !p.isDeleted);
    const combinedText = activePages.map(p => `[Trang ${p.id}]: ${p.text}`).join('\n\n');

    if (!combinedText.trim()) {
      alert("Không tìm thấy dữ liệu văn bản để tóm tắt.");
      return;
    }

    setIsSummaryLoading(true);
    setAiSummary('');

    const systemPrompt = "Bạn là một trợ lý tài liệu thông minh chuyên nghiệp. Hãy phân tích tài liệu PDF được cung cấp và viết một bản tóm tắt cực kỳ trực quan, khoa học, phân chia các mục rõ ràng bằng tiếng Việt dạng Markdown.";
    const payload = [{
      parts: [{ text: `Dưới đây là nội dung trích xuất từ tài liệu PDF có tên là "${file?.name}". Hãy tóm tắt nó:\n\n${combinedText}` }]
    }];

    try {
      const data = await callGeminiApi(payload, systemPrompt);
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không thể tạo tóm tắt.";
      setAiSummary(textResponse);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleSendChatMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsChatLoading(true);

    const activePages = pages.filter(p => !p.isDeleted);
    const combinedText = activePages.map(p => `[Trang ${p.id}]: ${p.text}`).join('\n\n');
    const systemPrompt = `Bạn là trợ lý phân tích PDF. Trả lời trực tiếp và chính xác vào nội dung văn bản sau. \n\nNội dung tài liệu:\n${combinedText}`;
    
    const historyPayload = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    historyPayload.push({ role: 'user', parts: [{ text: userMessage }] });

    try {
      const data = await callGeminiApi(historyPayload, systemPrompt);
      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Tôi không tìm thấy câu trả lời phù hợp trong tài liệu này.";
      setChatHistory(prev => [...prev, { role: 'model', text: aiReply }]);
    } catch (err: any) {
      alert(err.message);
      // rollback
      setChatHistory(prev => prev.slice(0, -1));
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleTtsPlayback = async () => {
    if (!aiSummary) return;

    if (ttsAudioUrl) {
      if (isPlayingTts) {
        audioRef.current?.pause();
        setIsPlayingTts(false);
      } else {
        audioRef.current?.play();
        setIsPlayingTts(true);
      }
      return;
    }

    setIsTtsLoading(true);
    const cleanTextToRead = aiSummary.replace(/[*#_`~[\]()]/g, '').substring(0, 1000); 

    try {
      if (!apiKey) throw new Error("Vui lòng cung cấp API Key.");
      
      const ttsPayload = [{ parts: [{ text: `Hãy đọc diễn cảm bằng tiếng Việt đoạn văn sau: ${cleanTextToRead}` }] }];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: ttsPayload,
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Aoede"
                }
              }
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error("Không thể chuyển đổi văn bản thành giọng nói. Model có thể chưa hỗ trợ trả về AUDIO ở region này.");
      }

      const result = await response.json();
      const base64Audio = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("Dữ liệu âm thanh trả về từ AI bị trống.");
      }

      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const wavBuffer = pcmToWav(bytes, 24000);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      setTtsAudioUrl(audioUrl);
      setIsPlayingTts(true);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
        }
      }, 100);

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Tính năng TTS tạm thời gián đoạn.");
    } finally {
      setIsTtsLoading(false);
    }
  };

  const toggleDeletePage = (index: number) => {
    const newPages = [...pages];
    newPages[index].isDeleted = !newPages[index].isDeleted;
    setPages(newPages);
  };

  const rotatePage = (index: number, direction: 'cw' | 'ccw') => {
    const newPages = [...pages];
    let rot = newPages[index].rotation;
    rot = direction === 'cw' ? rot + 90 : rot - 90;
    if (rot >= 360) rot = 0;
    if (rot < 0) rot = 270;
    newPages[index].rotation = rot;
    setPages(newPages);
  };

  const rotateAllPages = (direction: 'cw' | 'ccw') => {
    setPages(prev => prev.map(p => {
      if (p.isDeleted) return p;
      let rot = p.rotation;
      rot = direction === 'cw' ? rot + 90 : rot - 90;
      if (rot >= 360) rot = 0;
      if (rot < 0) rot = 270;
      return { ...p, rotation: rot };
    }));
  };

  const resetAllChanges = () => {
    setPages(prev => prev.map(p => ({ ...p, rotation: 0, isDeleted: false })));
  };

  const exportPdf = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const activePages = pages.filter(p => !p.isDeleted);
      if (activePages.length === 0) {
        alert("Không thể xuất PDF trống.");
        setIsProcessing(false);
        return;
      }

      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      for (const p of activePages) {
        const [copiedPage] = await newPdf.copyPages(originalPdf, [p.originalIndex]);
        const originalRot = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees(originalRot + p.rotation));
        newPdf.addPage(copiedPage);
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi xử lý file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setPages([]);
    setAiSummary('');
    setChatHistory([]);
    setTtsAudioUrl('');
    setIsPlayingTts(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const activeCount = pages.filter(p => !p.isDeleted).length;

  return (
    <div className="pdf-editor-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {ttsAudioUrl && (
        <audio 
          ref={audioRef} 
          src={ttsAudioUrl} 
          onEnded={() => setIsPlayingTts(false)} 
          className="hidden" 
        />
      )}

      {/* HEADER */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--primary)', borderRadius: 'var(--radius-md)', color: 'white' }}>
            <FileText size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              PDF Editor Studio 
              <span style={{ fontSize: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', padding: '0.25rem 0.5rem', borderRadius: '1rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>PRO + ✨ AI</span>
            </h1>
            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Xem trực quan, xoay chiều, xóa trang và AI Assistant</p>
          </div>
        </div>

        {file && !isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="icon-btn" onClick={() => rotateAllPages('ccw')} title="Xoay trái tất cả">
              <RotateCcw size={18} />
            </button>
            <button className="icon-btn" onClick={() => rotateAllPages('cw')} title="Xoay phải tất cả">
              <RotateCw size={18} />
            </button>
            <button className="icon-btn" onClick={resetAllChanges} title="Khôi phục trạng thái ban đầu" style={{ color: 'var(--primary)', fontWeight: 500, fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              <Undo size={16} /> Reset
            </button>
            
            <div style={{ width: '1px', height: '1.5rem', background: 'var(--border)', margin: '0 0.5rem' }}></div>
            
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
              style={{ borderColor: isAiPanelOpen ? 'var(--primary)' : 'var(--border)', color: isAiPanelOpen ? 'var(--primary)' : 'var(--text-primary)', background: isAiPanelOpen ? 'rgba(139,92,246,0.05)' : 'var(--bg-secondary)' }}
            >
              <Sparkles size={16} />
              {isAiPanelOpen ? 'Ẩn AI' : 'Hiện AI'}
            </button>

            <button 
              className="btn btn-primary"
              onClick={exportPdf}
              disabled={isProcessing || activeCount === 0}
            >
              {isProcessing ? (
                <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang xuất...</>
              ) : (
                <><Download size={16} /> Xuất PDF ({activeCount}/{pages.length})</>
              )}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0, flexDirection: 'row', flexWrap: 'wrap' }}>
        {/* LEFT COLUMN: PDF VIEWER/EDITOR */}
        <div style={{ flex: '1 1 0%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!file && (
            <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div 
                className={`dropzone ${isDragging ? 'drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', maxWidth: '500px' }}
              >
                <Upload size={48} className="text-primary" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>Tải file PDF lên</h3>
                <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>Kéo thả file vào đây hoặc nhấn để chọn file từ máy tính</p>
                <button className="btn btn-secondary">Chọn File PDF</button>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}

          {isLoading && (
            <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <RefreshCw size={40} className="text-primary" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
              <h4 style={{ fontWeight: 600 }}>Đang phân tích các trang...</h4>
            </div>
          )}

          {!isLoading && file && pages.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
              <div className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                  <FileBox size={24} className="text-primary" />
                  <div style={{ overflow: 'hidden' }}>
                    <h4 style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</h4>
                    <p className="text-secondary" style={{ fontSize: '0.875rem' }}>{formatBytes(fileSize)} • {pages.length} trang</p>
                  </div>
                </div>
                <button className="icon-btn delete" onClick={handleClearFile} title="Đổi file khác">
                  <X size={20} />
                </button>
              </div>

              <div className="pages-grid" style={{ overflowY: 'auto', paddingRight: '0.5rem' }}>
                {pages.map((page, index) => (
                  <div key={page.id} className={`page-card ${page.isDeleted ? 'deleted' : ''}`}>
                    <div className="page-header">
                      <span className="page-number">Trang {page.id}</span>
                      <button className="action-btn" onClick={() => setPreviewPage(page)} disabled={page.isDeleted}>
                        <Eye size={16} />
                      </button>
                    </div>
                    
                    <div className="page-preview-container">
                      <img 
                        src={page.dataUrl} 
                        className="page-preview" 
                        style={{ transform: `rotate(${page.rotation}deg)` }}
                        alt={`Page ${page.id}`}
                      />
                      {page.isDeleted && (
                        <div className="deleted-overlay">
                          <Trash2 size={24} style={{ marginBottom: '0.5rem' }} />
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Đã xóa</span>
                        </div>
                      )}
                    </div>

                    <div className="page-actions">
                      <button className="action-btn" onClick={() => rotatePage(index, 'ccw')} disabled={page.isDeleted}>
                        <RotateCcw size={18} />
                      </button>
                      <button className="action-btn" onClick={() => rotatePage(index, 'cw')} disabled={page.isDeleted}>
                        <RotateCw size={18} />
                      </button>
                      <button className="action-btn delete" onClick={() => toggleDeletePage(index)}>
                        {page.isDeleted ? <Undo size={18} /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI PANEL */}
        {file && pages.length > 0 && isAiPanelOpen && (
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', flex: '1 1 300px' }}>
            <div style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))', padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--primary)', borderRadius: 'var(--radius-sm)', color: 'white' }}>
                <Sparkles size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Trợ lý PDF AI</h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 500 }}>Powered by Gemini 2.5</p>
              </div>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              <button 
                onClick={() => setAiActiveTab('summary')}
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600, background: aiActiveTab === 'summary' ? 'var(--bg-secondary)' : 'transparent', color: aiActiveTab === 'summary' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: aiActiveTab === 'summary' ? '2px solid var(--primary)' : '2px solid transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                <BookOpen size={16} /> Tóm tắt
              </button>
              <button 
                onClick={() => setAiActiveTab('chat')}
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600, background: aiActiveTab === 'chat' ? 'var(--bg-secondary)' : 'transparent', color: aiActiveTab === 'chat' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: aiActiveTab === 'chat' ? '2px solid var(--primary)' : '2px solid transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                <MessageSquare size={16} /> Hỏi đáp
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
              {/* SUMMARY TAB */}
              {aiActiveTab === 'summary' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {!aiSummary && !isSummaryLoading ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                      <Sparkles size={40} style={{ color: 'var(--primary)', marginBottom: '1rem', opacity: 0.5 }} />
                      <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Cần tóm tắt nội dung?</h4>
                      <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>Trích xuất văn bản từ các trang PDF và tạo bản tóm tắt siêu tốc.</p>
                      <button className="btn btn-primary" onClick={handleGenerateSummary}>
                        <Sparkles size={16} /> Tóm tắt PDF Ngay
                      </button>
                    </div>
                  ) : isSummaryLoading ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <RefreshCw size={32} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                      <p className="text-secondary" style={{ fontSize: '0.875rem' }}>AI đang đọc dữ liệu & tóm tắt...</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.1)', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Volume2 size={16} className="text-primary" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Nghe bản tóm tắt:</span>
                        </div>
                        <button 
                          onClick={handleTtsPlayback}
                          disabled={isTtsLoading}
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          {isTtsLoading ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : 
                           isPlayingTts ? <><VolumeX size={12} /> Dừng đọc</> : 
                           <><Volume2 size={12} /> Đọc diễn cảm AI</>}
                        </button>
                      </div>

                      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {aiSummary}
                      </div>

                      <button onClick={handleGenerateSummary} className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }}>
                        <RefreshCw size={16} /> Tạo lại tóm tắt mới
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* CHAT TAB */}
              {aiActiveTab === 'chat' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {chatHistory.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <MessageSquare size={40} style={{ color: 'var(--border)', marginBottom: '0.5rem' }} />
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Chưa có câu hỏi nào</h4>
                        <p className="text-secondary" style={{ fontSize: '0.75rem' }}>Nhập câu hỏi để hỏi về nội dung PDF.</p>
                      </div>
                    ) : (
                      chatHistory.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                          <div style={{ 
                            maxWidth: '85%', padding: '0.75rem', borderRadius: '1rem', fontSize: '0.875rem', lineHeight: 1.5,
                            background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-secondary)',
                            color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                            borderTopRightRadius: msg.role === 'user' ? 0 : '1rem',
                            borderTopLeftRadius: msg.role === 'user' ? '1rem' : 0,
                            border: msg.role === 'user' ? 'none' : '1px solid var(--border)'
                          }}>
                            {msg.text}
                          </div>
                        </div>
                      ))
                    )}
                    {isChatLoading && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '1rem', borderTopLeftRadius: 0, border: '1px solid var(--border)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> AI đang suy nghĩ...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Hỏi về nội dung của PDF..." 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      disabled={isChatLoading}
                      style={{ flex: 1, padding: '0.75rem' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem' }} disabled={!chatInput.trim() || isChatLoading}>
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {previewPage && (
        <div className="preview-modal-overlay" onClick={() => setPreviewPage(null)}>
          <div className="preview-modal-content" style={{ maxWidth: '800px', height: 'auto', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} className="text-primary" />
                Xem trước trang {previewPage.id}
              </h3>
              <button className="icon-btn delete" onClick={() => setPreviewPage(null)}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
              <img 
                src={previewPage.dataUrl} 
                style={{ transform: `rotate(${previewPage.rotation}deg)`, maxHeight: '70vh', maxWidth: '100%', objectFit: 'contain', boxShadow: 'var(--shadow-lg)' }} 
                alt="Preview" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Download, 
  BookOpen, 
  Check, 
  Volume2,
  Wand2,
  Loader2,
  Sparkles,
  Code,
  Copy
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './FlashcardDeck.css';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  example?: string;
  memorized?: boolean;
}

export default function FlashcardDeck() {
  const { showToast } = useNotification();

  const [cards, setCards] = useState<Flashcard[]>([
    {
      id: 'c1',
      front: 'LMS là viết tắt của từ gì?',
      back: 'Learning Management System (Hệ thống quản lý học tập).',
      example: 'Ví dụ: Moodle, Canvas, Blackboard, LMS Nam Sài Gòn.'
    },
    {
      id: 'c2',
      front: 'SCORM trong E-learning là gì?',
      back: 'Bộ các tiêu chuẩn kỹ thuật đóng gói bài giảng điện tử để có thể chạy trên nhiều nền tảng LMS khác nhau.',
      example: 'SCORM 1.2 và SCORM 2004 là 2 chuẩn thông dụng nhất.'
    },
    {
      id: 'c3',
      front: 'Spaced Repetition (Lặp lại ngắt quãng) là gì?',
      back: 'Kỹ thuật ghi nhớ dựa trên việc ôn tập lại kiến thức theo các khoảng thời gian tăng dần để củng cố trí nhớ dài hạn.',
      example: 'Áp dụng hiệu quả nhất với thẻ Flashcards từ vựng và công thức.'
    }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [deckTitle, setDeckTitle] = useState('Bộ Thẻ Ôn Tập LMS & Giáo Dục');
  
  // AI generation
  const [aiInputText, setAiInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Manual Add Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newExample, setNewExample] = useState('');

  // Export Iframe Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Lật thẻ
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Tiến / lùi
  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  // Đọc to nội dung
  const handleSpeak = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      window.speechSynthesis.speak(utterance);
    } else {
      showToast('Trình duyệt không hỗ trợ đọc văn bản tự động.', 'warning');
    }
  };

  // Đánh dấu đã nhớ
  const handleToggleMemorized = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCards(prev => prev.map(c => c.id === id ? { ...c, memorized: !c.memorized } : c));
  };

  // Xóa thẻ
  const handleDeleteCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cards.length <= 1) {
      showToast('Cần ít nhất 1 thẻ trong bộ sưu tập!', 'warning');
      return;
    }
    const filtered = cards.filter(c => c.id !== id);
    setCards(filtered);
    if (currentIndex >= filtered.length) {
      setCurrentIndex(filtered.length - 1);
    }
    setIsFlipped(false);
    showToast('Đã xóa thẻ.', 'info');
  };

  // Thêm thẻ thủ công
  const handleAddManualCard = () => {
    if (!newFront.trim() || !newBack.trim()) {
      showToast('Vui lòng nhập cả mặt trước và mặt sau!', 'warning');
      return;
    }
    const newCard: Flashcard = {
      id: `c-${Date.now()}`,
      front: newFront.trim(),
      back: newBack.trim(),
      example: newExample.trim() || undefined
    };
    setCards(prev => [...prev, newCard]);
    setNewFront('');
    setNewBack('');
    setNewExample('');
    setShowAddModal(false);
    setCurrentIndex(cards.length);
    setIsFlipped(false);
    showToast('Đã thêm thẻ mới!', 'success');
  };

  // AI Tạo bộ thẻ
  const handleAiGenerate = async () => {
    if (!aiInputText.trim()) {
      showToast('Vui lòng dán nội dung bài học để AI tạo thẻ!', 'warning');
      return;
    }
    setIsGenerating(true);
    try {
      const prompt = `Bạn là chuyên gia sư phạm. Hãy trích xuất từ văn bản sau thành 5 thẻ ghi nhớ Flashcards (mỗi thẻ gồm thuật ngữ/câu hỏi ở mặt trước, giải thích súc tích ở mặt sau, và 1 ví dụ cụ thể nếu có).
Văn bản: "${aiInputText.trim()}".
BẮT BUỘC trả về đúng định dạng JSON Array thuần túy (không markdown \`\`\`json):
[
  { "front": "Thuật ngữ 1 hoặc Câu hỏi 1", "back": "Định nghĩa hoặc câu trả lời", "example": "Ví dụ cụ thể" }
]`;
      const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?json=true`);
      if (!res.ok) throw new Error('Máy chủ AI không phản hồi');
      const text = await res.text();
      let parsed: any[] = [];
      try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (err) {
        const m = text.match(/\[[\s\S]*\]/);
        if (m) parsed = JSON.parse(m[0]);
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        const newCards: Flashcard[] = parsed.map((item, idx) => ({
          id: `ai-${Date.now()}-${idx}`,
          front: item.front || `Thuật ngữ ${idx + 1}`,
          back: item.back || `Định nghĩa ${idx + 1}`,
          example: item.example
        }));
        setCards(newCards);
        setCurrentIndex(0);
        setIsFlipped(false);
        setShowAiModal(false);
        setAiInputText('');
        showToast(`AI đã tạo thành công ${newCards.length} thẻ ghi nhớ!`, 'success');
      } else {
        throw new Error('Dữ liệu không đúng định dạng');
      }
    } catch (e) {
      console.error(e);
      showToast('Không thể tạo tự động lúc này. Vui lòng thử lại với đoạn văn bản ngắn hơn.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Xuất file HTML tương tác độc lập (Có thể nhúng vào LMS hoặc chạy offline)
  const handleExportHtml = () => {
    const jsonStr = JSON.stringify(cards);
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${deckTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card-box { width: 100%; max-width: 560px; height: 320px; perspective: 1000px; cursor: pointer; margin-bottom: 20px; }
    .card-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 16px; box-shadow: 0 15px 35px rgba(0,0,0,0.5); }
    .card-inner.flipped { transform: rotateY(180deg); }
    .face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center; border: 1.5px solid #334155; }
    .face-front { background: #1e293b; color: #f8fafc; }
    .face-back { background: #1e1b4b; color: #c7d2fe; transform: rotateY(180deg); border-color: #4f46e5; }
    .badge { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,0.1); margin-bottom: 15px; }
    .text { font-size: 20px; font-weight: 700; line-height: 1.45; }
    .example { margin-top: 15px; font-size: 13.5px; opacity: 0.8; font-style: italic; }
    .ctrls { display: flex; align-items: center; gap: 15px; }
    button { background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #1d4ed8; }
    .info { font-size: 14px; color: #94a3b8; font-weight: 600; }
  </style>
</head>
<body>
  <h2 style="margin-bottom: 20px; text-align: center;">${deckTitle}</h2>
  <div class="card-box" onclick="toggleFlip()">
    <div id="card-inner" class="card-inner">
      <div class="face face-front">
        <span class="badge">Mặt trước (Bấm để lật)</span>
        <div id="q-front" class="text"></div>
      </div>
      <div class="face face-back">
        <span class="badge">Mặt sau (Giải nghĩa)</span>
        <div id="q-back" class="text"></div>
        <div id="q-ex" class="example"></div>
      </div>
    </div>
  </div>
  <div class="ctrls">
    <button onclick="prevCard()">◀ Thẻ trước</button>
    <span id="counter" class="info"></span>
    <button onclick="nextCard()">Thẻ tiếp ▶</button>
  </div>
  <script>
    const CARDS = ${jsonStr};
    let idx = 0;
    let flipped = false;
    const inner = document.getElementById('card-inner');
    const qFront = document.getElementById('q-front');
    const qBack = document.getElementById('q-back');
    const qEx = document.getElementById('q-ex');
    const counter = document.getElementById('counter');

    function render() {
      flipped = false;
      inner.classList.remove('flipped');
      const c = CARDS[idx];
      qFront.innerText = c.front;
      qBack.innerText = c.back;
      qEx.innerText = c.example ? ('Ví dụ: ' + c.example) : '';
      counter.innerText = (idx + 1) + ' / ' + CARDS.length;
    }

    function toggleFlip() {
      flipped = !flipped;
      if (flipped) inner.classList.add('flipped');
      else inner.classList.remove('flipped');
    }

    function nextCard() {
      if (idx < CARDS.length - 1) { idx++; render(); }
    }
    function prevCard() {
      if (idx > 0) { idx--; render(); }
    }
    render();
  </script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file HTML Flashcard thành công!', 'success');
  };

  // Tạo mã nhúng Iframe an toàn cho LMS
  const generateIframeCode = () => {
    const payload = JSON.stringify({ title: deckTitle, cards });
    // UTF-8 to Base64
    const utf8Bytes = new TextEncoder().encode(payload);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 = btoa(binary);
    const playerUrl = `${window.location.origin}/embed-player#flashcard:${b64}`;

    return `<!-- MA NHUNG THE GHI NHO FLASHCARD CHO LMS / E-LEARNING -->
<div style="position:relative;width:100%;max-width:920px;margin:15px auto;padding-top:56.25%;background:#0f172a;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.3);">
  <iframe 
    src="${playerUrl}" 
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;margin:0;padding:0;" 
    allow="fullscreen" 
    allowfullscreen="allowfullscreen">
  </iframe>
</div>
<!-- KET THUC MA NHUNG -->`;
  };

  const handleCopyIframe = async () => {
    try {
      await navigator.clipboard.writeText(generateIframeCode());
      setCopied(true);
      showToast('Đã sao chép mã nhúng Iframe!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Không thể sao chép tự động, vui lòng chọn và copy thủ công.', 'warning');
    }
  };

  const currentCard = cards[currentIndex] || cards[0];

  return (
    <div className="flashcard-container animate-fade-in">
      <header className="fc-header">
        <div className="fc-title-group">
          <div className="fc-icon">
            <BookOpen size={26} />
          </div>
          <div>
            <h1 className="fc-title">Thẻ Ghi Nhớ AI (Flashcard Deck)</h1>
            <p className="fc-subtitle">
              Tự động trích xuất thuật ngữ, công thức từ bài học thành bộ thẻ nhớ lật 3D tương tác. Xuất file HTML để nhúng vào LMS.
            </p>
          </div>
        </div>

        <div className="fc-header-actions">
          <button 
            type="button" 
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', border: 'none' }}
            onClick={() => setShowAiModal(true)}
          >
            <Wand2 size={16} /> AI Tạo Bộ Thẻ
          </button>
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} /> Thêm Thẻ
          </button>
          <button 
            type="button" 
            className="btn btn-outline"
            style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
            onClick={() => setShowExportModal(true)}
          >
            <Code size={16} /> Lấy Mã Nhúng Iframe
          </button>
          <button 
            type="button" 
            className="btn btn-outline"
            style={{ color: '#10b981', borderColor: '#10b981' }}
            onClick={handleExportHtml}
          >
            <Download size={16} /> Tải Tệp HTML
          </button>
        </div>
      </header>

      {/* Main Flashcard Stage */}
      <div className="fc-stage">
        <div className="fc-deck-info">
          <input 
            type="text" 
            className="fc-deck-title-input" 
            value={deckTitle}
            onChange={(e) => setDeckTitle(e.target.value)}
            title="Bấm để đổi tên bộ thẻ"
          />
          <span className="fc-counter">
            Thẻ {currentIndex + 1} / {cards.length}
          </span>
        </div>

        {/* 3D Flip Card */}
        <div className="fc-card-perspective" onClick={handleFlip}>
          <div className={`fc-card-inner ${isFlipped ? 'flipped' : ''}`}>
            {/* Front */}
            <div className="fc-card-face fc-card-front">
              <div className="fc-face-top">
                <span className="fc-badge front">Mặt Trước (Câu hỏi / Thuật ngữ)</span>
                <div className="fc-card-tools">
                  <button 
                    type="button" 
                    className="fc-tool-btn" 
                    title="Đọc to" 
                    onClick={(e) => handleSpeak(currentCard.front, e)}
                  >
                    <Volume2 size={16} />
                  </button>
                  <button 
                    type="button" 
                    className={`fc-tool-btn ${currentCard.memorized ? 'memorized' : ''}`} 
                    title={currentCard.memorized ? 'Đã thuộc thẻ này' : 'Đánh dấu đã thuộc'}
                    onClick={(e) => handleToggleMemorized(currentCard.id, e)}
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>

              <div className="fc-card-body">
                <p className="fc-main-text">{currentCard.front}</p>
              </div>

              <div className="fc-face-bottom">
                <span>💡 Bấm vào thẻ để lật xem đáp án</span>
              </div>
            </div>

            {/* Back */}
            <div className="fc-card-face fc-card-back">
              <div className="fc-face-top">
                <span className="fc-badge back">Mặt Sau (Định nghĩa / Lời giải)</span>
                <div className="fc-card-tools">
                  <button 
                    type="button" 
                    className="fc-tool-btn" 
                    title="Đọc to" 
                    onClick={(e) => handleSpeak(currentCard.back, e)}
                  >
                    <Volume2 size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="fc-tool-btn" 
                    title="Xóa thẻ này" 
                    onClick={(e) => handleDeleteCard(currentCard.id, e)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="fc-card-body">
                <p className="fc-main-text">{currentCard.back}</p>
                {currentCard.example && (
                  <p className="fc-example-text">
                    <strong>Ví dụ: </strong>{currentCard.example}
                  </p>
                )}
              </div>

              <div className="fc-face-bottom">
                <span>🔄 Bấm để lật lại mặt trước</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="fc-nav-controls">
          <button 
            type="button" 
            className="btn btn-outline"
            disabled={currentIndex === 0}
            onClick={handlePrev}
          >
            <ChevronLeft size={18} /> Thẻ Trước
          </button>
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={handleFlip}
          >
            <RotateCw size={16} /> Lật Thẻ (Space)
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            disabled={currentIndex === cards.length - 1}
            onClick={handleNext}
          >
            Thẻ Tiếp <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* AI Generate Modal */}
      {showAiModal && (
        <div className="modal-backdrop">
          <div className="stop-edit-modal animate-scale-up" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: '#ec4899' }} />
                <h3>AI Trích Xuất Bộ Thẻ Flashcard</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAiModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Dán nội dung tài liệu, đoạn tóm tắt bài giảng hoặc danh sách định nghĩa. AI sẽ tự động phân tách thành các cặp thuật ngữ - định nghĩa ngắn gọn.
              </p>
              <textarea 
                className="inter-textarea" 
                rows={5}
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder="Dán nội dung bài học tại đây (ví dụ: Các thì trong tiếng Anh, Các thuật ngữ mạng máy tính, Lịch sử...)"
              />
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline"
                disabled={isGenerating}
                onClick={() => setShowAiModal(false)}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                disabled={isGenerating || !aiInputText.trim()}
                onClick={handleAiGenerate}
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', border: 'none' }}
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {isGenerating ? 'Đang trích xuất thẻ...' : 'Bắt Đầu Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="stop-edit-modal animate-scale-up" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Thêm Thẻ Ghi Nhớ Mới</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Mặt trước (Khái niệm / Câu hỏi)</label>
                <textarea 
                  className="inter-textarea" 
                  rows={2}
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="Nhập câu hỏi hoặc từ vựng..."
                />
              </div>

              <div className="form-group">
                <label>Mặt sau (Giải nghĩa / Đáp án)</label>
                <textarea 
                  className="inter-textarea" 
                  rows={3}
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="Nhập định nghĩa hoặc câu trả lời đầy đủ..."
                />
              </div>

              <div className="form-group">
                <label>Ví dụ minh họa (Tùy chọn)</label>
                <input 
                  type="text" 
                  className="inter-input"
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="Ví dụ câu áp dụng..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Hủy</button>
              <button type="button" className="btn btn-primary" onClick={handleAddManualCard}>Lưu Thẻ</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xuất Mã Nhúng Iframe LMS */}
      {showExportModal && (
        <div className="modal-backdrop">
          <div className="stop-edit-modal animate-scale-up" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={20} style={{ color: 'var(--primary)' }} />
                <h3>Xuất Mã Nhúng Iframe Cho LMS / Elearning</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowExportModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Sao chép đoạn mã iframe dưới đây và dán vào ô <strong>Mã nguồn (Source / &lt;&gt;)</strong> trong khung soạn thảo bài giảng của LMS (Moodle, Canvas, LMS Cao đẳng Nam Sài Gòn,...).
              </p>

              <div className="export-result-box" style={{ marginTop: '0.5rem' }}>
                <div className="export-result-header">
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>Mã Iframe Chuẩn LMS (100% không bị lọc)</span>
                  <button className="btn btn-primary btn-sm" onClick={handleCopyIframe}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Đã Sao Chép' : 'Sao Chép Mã'}
                  </button>
                </div>
                <pre className="export-code-block" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {generateIframeCode()}
                </pre>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: 1.5 }}>
                💡 <strong>Mẹo:</strong> Bài giảng Flashcard nhúng qua Iframe có thể hoạt động hoàn toàn độc lập, học sinh có thể lật thẻ, bấm nghe phát âm trực tiếp ngay trên trang LMS mà không cần rời website.
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowExportModal(false)}>Đóng</button>
              <button type="button" className="btn btn-primary" onClick={handleCopyIframe}>
                {copied ? 'Đã Sao Chép Mã' : 'Sao Chép Mã Nhúng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

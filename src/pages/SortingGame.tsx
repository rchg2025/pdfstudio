import { useState } from 'react';
import { 
  Boxes, 
  Download, 
  Code, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Tag, 
  CheckCircle2, 
  Volume2,
  Plus,
  Trash2,
  Edit3,
  Play
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './SortingGame.css';

export interface CardItem {
  id: string;
  text: string;
  category: string;
  hint?: string;
  pronounce?: string;
}

export interface SortingPreset {
  id: string;
  subject: string;
  title: string;
  desc: string;
  categories: string[];
  cards: CardItem[];
}

const PRESET_SORTING: SortingPreset[] = [
  {
    id: 'accounting-balance',
    subject: 'Kế Toán Doanh Nghiệp',
    title: 'Phân loại Tài Khoản: TÀI SẢN vs NGUỒN VỐN vs CHI PHÍ',
    desc: 'Kéo thả các tài khoản kế toán thông dụng vào đúng nhóm bảng cân đối tài chính.',
    categories: ['Tài Sản (TK Loại 1, 2)', 'Nợ Phải Trả & Nguồn Vốn (TK 3, 4)', 'Chi Phí Hoạt Động (TK 6, 8)'],
    cards: [
      { id: 'acc1', text: 'Tiền mặt & Tiền gửi ngân hàng (TK 111, 112)', category: 'Tài Sản (TK Loại 1, 2)', hint: 'Thuộc tài sản ngắn hạn có tính thanh khoản cao nhất' },
      { id: 'acc2', text: 'Hàng tồn kho & Nguyên vật liệu (TK 152, 156)', category: 'Tài Sản (TK Loại 1, 2)' },
      { id: 'acc3', text: 'Tài sản cố định hữu hình (TK 211)', category: 'Tài Sản (TK Loại 1, 2)' },
      { id: 'acc4', text: 'Phải trả người bán (TK 331)', category: 'Nợ Phải Trả & Nguồn Vốn (TK 3, 4)', hint: 'Nghĩa vụ nợ của doanh nghiệp đối với nhà cung cấp' },
      { id: 'acc5', text: 'Vốn đầu tư của chủ sở hữu (TK 411)', category: 'Nợ Phải Trả & Nguồn Vốn (TK 3, 4)' },
      { id: 'acc6', text: 'Vay và nợ thuê tài chính (TK 341)', category: 'Nợ Phải Trả & Nguồn Vốn (TK 3, 4)' },
      { id: 'acc7', text: 'Chi phí giá vốn hàng bán (TK 632)', category: 'Chi Phí Hoạt Động (TK 6, 8)' },
      { id: 'acc8', text: 'Chi phí quản lý doanh nghiệp (TK 642)', category: 'Chi Phí Hoạt Động (TK 6, 8)' }
    ]
  },
  {
    id: 'english-medical-vocab',
    subject: 'Tiếng Anh Y Dược',
    title: 'Phân loại Thuật ngữ Y khoa: Triệu chứng vs Dụng cụ vs Khoa phòng',
    desc: 'Luyện tập phân nhóm từ vựng tiếng Anh chuyên ngành Y Dược (Medical English).',
    categories: ['Symptoms (Triệu chứng)', 'Medical Equipment (Dụng cụ)', 'Hospital Wards (Khoa phòng)'],
    cards: [
      { id: 'en1', text: 'Shortness of breath (Khó thở)', category: 'Symptoms (Triệu chứng)', pronounce: 'Shortness of breath' },
      { id: 'en2', text: 'Fever & chills (Sốt gai rét)', category: 'Symptoms (Triệu chứng)', pronounce: 'Fever and chills' },
      { id: 'en3', text: 'Stethoscope (Ống nghe y tế)', category: 'Medical Equipment (Dụng cụ)', pronounce: 'Stethoscope' },
      { id: 'en4', text: 'Sphygmomanometer (Máy đo huyết áp)', category: 'Medical Equipment (Dụng cụ)', pronounce: 'Sphygmomanometer' },
      { id: 'en5', text: 'Syringe & needle (Bơm kim tiêm)', category: 'Medical Equipment (Dụng cụ)', pronounce: 'Syringe and needle' },
      { id: 'en6', text: 'Emergency Room - ER (Khoa Cấp Cứu)', category: 'Hospital Wards (Khoa phòng)', pronounce: 'Emergency Room' },
      { id: 'en7', text: 'Intensive Care Unit - ICU (Khoa Hồi Sức Tích Cực)', category: 'Hospital Wards (Khoa phòng)', pronounce: 'Intensive Care Unit' }
    ]
  },
  {
    id: 'hospitality-beverage',
    subject: 'Khách Sạn & Nhà Hàng',
    title: 'Phân loại Đồ uống Bar: Rượu Mạnh (Spirits) vs Vang vs Cocktail',
    desc: 'Nhận diện và phân nhóm các loại thức uống trong nghiệp vụ Bartender / Phục vụ bàn tiệc.',
    categories: ['Rượu Mạnh (Spirits)', 'Rượu Vang & Lên men', 'Cocktail Pha Chế'],
    cards: [
      { id: 'h1', text: 'Vodka, Whisky, Gin, Rum, Tequila', category: 'Rượu Mạnh (Spirits)', hint: '6 dòng rượu nền chưng cất cơ bản' },
      { id: 'h2', text: 'Cognac & Brandy', category: 'Rượu Mạnh (Spirits)' },
      { id: 'h3', text: 'Vang đỏ Cabernet Sauvignon', category: 'Rượu Vang & Lên men' },
      { id: 'h4', text: 'Champagne & Vang nổ Sparkling', category: 'Rượu Vang & Lên men' },
      { id: 'h5', text: 'Mojito (Rum + Chanh + Bạc hà)', category: 'Cocktail Pha Chế' },
      { id: 'h6', text: 'Margarita (Tequila + Triple Sec + Muối)', category: 'Cocktail Pha Chế' },
      { id: 'h7', text: 'Old Fashioned (Bourbon + Bitters + Cam)', category: 'Cocktail Pha Chế' }
    ]
  }
];

export default function SortingGame() {
  const { showToast } = useNotification();

  const [selectedPresetId, setSelectedPresetId] = useState<string>('accounting-balance');
  const currentPreset = PRESET_SORTING.find(p => p.id === selectedPresetId) || PRESET_SORTING[0];

  const [title, setTitle] = useState(currentPreset.title);
  const [desc, setDesc] = useState(currentPreset.desc);
  const [categories, setCategories] = useState<string[]>(currentPreset.categories);
  const [cards, setCards] = useState<CardItem[]>(currentPreset.cards);

  // Mode: Trải nghiệm chơi vs Soạn bài tập
  const [mode, setMode] = useState<'play' | 'editor'>('play');

  // Input soạn thẻ/nhóm mới
  const [newCatName, setNewCatName] = useState('');
  const [newCardText, setNewCardText] = useState('');
  const [newCardCat, setNewCardCat] = useState('');
  const [newCardHint, setNewCardHint] = useState('');

  // Trạng thái chơi (Phân nhóm kéo thả / bấm chọn)
  const [userAssignments, setUserAssignments] = useState<Record<string, string>>({}); // cardId -> category
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number>(0);

  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectPreset = (id: string) => {
    const p = PRESET_SORTING.find(item => item.id === id);
    if (!p) return;
    setSelectedPresetId(id);
    setTitle(p.title);
    setDesc(p.desc);
    setCategories(p.categories);
    setCards(p.cards);
    setUserAssignments({});
    setIsSubmitted(false);
    showToast(`Đã áp dụng mẫu: ${p.title}`, 'info');
  };

  // Quản lý Nhóm danh mục
  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) {
      showToast('Vui lòng nhập tên nhóm danh mục', 'warning');
      return;
    }
    if (categories.includes(name)) {
      showToast('Nhóm danh mục này đã tồn tại!', 'warning');
      return;
    }
    setCategories(prev => [...prev, name]);
    setNewCatName('');
    showToast(`Đã thêm nhóm: "${name}"`, 'success');
  };

  const handleDeleteCategory = (catName: string) => {
    if (categories.length <= 1) {
      showToast('Cần giữ lại ít nhất 1 nhóm danh mục', 'warning');
      return;
    }
    setCategories(prev => prev.filter(c => c !== catName));
    // Xóa hoặc unassign các thẻ thuộc nhóm này
    setCards(prev => prev.filter(c => c.category !== catName));
    setUserAssignments(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (next[k] === catName) delete next[k];
      });
      return next;
    });
    showToast(`Đã xóa nhóm "${catName}"`, 'info');
  };

  // Quản lý Thẻ câu hỏi
  const handleAddCard = () => {
    const txt = newCardText.trim();
    if (!txt) {
      showToast('Vui lòng nhập nội dung thẻ cần xếp', 'warning');
      return;
    }
    const cat = newCardCat || categories[0];
    if (!cat) {
      showToast('Vui lòng tạo ít nhất 1 nhóm danh mục trước', 'warning');
      return;
    }
    const newCard: CardItem = {
      id: `custom-${Date.now()}`,
      text: txt,
      category: cat,
      hint: newCardHint.trim() || undefined
    };
    setCards(prev => [...prev, newCard]);
    setNewCardText('');
    setNewCardHint('');
    showToast('Đã thêm thẻ mới vào bài tập!', 'success');
  };

  const handleDeleteCard = (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    setUserAssignments(prev => {
      const next = { ...prev };
      delete next[cardId];
      return next;
    });
    showToast('Đã xóa thẻ', 'info');
  };

  const handleAssign = (cardId: string, category: string) => {
    if (isSubmitted) return;
    setUserAssignments(prev => ({
      ...prev,
      [cardId]: category
    }));
  };

  const handleUnassign = (cardId: string) => {
    if (isSubmitted) return;
    setUserAssignments(prev => {
      const next = { ...prev };
      delete next[cardId];
      return next;
    });
  };

  const handleCheckAnswers = () => {
    let correct = 0;
    cards.forEach(c => {
      if (userAssignments[c.id] === c.category) correct++;
    });

    const finalScore = Math.round((correct / cards.length) * 100);
    setScore(finalScore);
    setIsSubmitted(true);

    if (finalScore === 100) {
      showToast('Tuyệt vời! Bạn phân loại chính xác 100%!', 'success');
    } else {
      showToast(`Bạn đạt ${finalScore} điểm. Đã đánh dấu câu sai màu đỏ!`, 'warning');
    }
  };

  const handleReset = () => {
    setUserAssignments({});
    setIsSubmitted(false);
    setScore(0);
  };

  // Đọc phát âm tiếng Anh
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Thẻ chưa được phân loại
  const unassignedCards = cards.filter(c => !userAssignments[c.id]);

  // Xuất file HTML độc lập cho LMS
  const generateStandaloneHtml = () => {
    const dataJson = JSON.stringify({ title, desc, categories, cards });
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; padding: 16px; display: flex; flex-direction: column; align-items: center; }
    .wrapper { width: 100%; max-width: 900px; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 20px 45px rgba(0,0,0,0.6); }
    .header { padding: 18px 24px; background: #182234; border-bottom: 1px solid #334155; }
    .title { font-size: 20px; font-weight: 700; color: #38bdf8; margin-bottom: 6px; }
    .desc { font-size: 13.5px; color: #94a3b8; }
    .content { padding: 20px; }
    .unassigned-box { background: #0f172a; padding: 16px; border-radius: 12px; border: 1px dashed #475569; margin-bottom: 20px; min-height: 80px; }
    .unassigned-title { font-size: 13px; font-weight: 700; color: #cbd5e1; margin-bottom: 10px; }
    .cards-pool { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { background: #334155; color: #fff; padding: 8px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; user-select: none; border: 1px solid transparent; transition: all 0.2s; }
    .chip:hover { border-color: #38bdf8; transform: translateY(-2px); }
    .categories-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .cat-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 14px; min-height: 220px; display: flex; flex-direction: column; }
    .cat-title { font-size: 14px; font-weight: 700; color: #38bdf8; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 8px; }
    .cat-cards { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .assigned-chip { background: #1e293b; border: 1px solid #475569; padding: 8px 12px; border-radius: 6px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
    .chip-correct { border-color: #10b981 !important; background: rgba(16, 185, 129, 0.15) !important; color: #34d399 !important; }
    .chip-wrong { border-color: #ef4444 !important; background: rgba(239, 68, 68, 0.15) !important; color: #f87171 !important; }
    .actions { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #334155; padding-top: 16px; }
    .btn { padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; border: none; font-size: 14px; }
    .btn-submit { background: #10b981; color: #fff; }
    .btn-reset { background: transparent; border: 1px solid #475569; color: #94a3b8; }
    .score-view { font-size: 16px; font-weight: 700; color: #38bdf8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="title">${title}</div>
      <div class="desc">${desc}</div>
    </div>
    <div class="content">
      <div class="unassigned-box">
        <div class="unassigned-title">📦 Nhấp vào thẻ để chọn nhóm cần xếp vào:</div>
        <div class="cards-pool" id="pool"></div>
      </div>
      <div class="categories-grid" id="catGrid"></div>
      <div class="actions">
        <button class="btn btn-reset" onclick="resetAll()">Làm lại từ đầu</button>
        <div class="score-view" id="scoreBox"></div>
        <button class="btn btn-submit" id="submitBtn" onclick="checkAll()">Nộp Bài & Chấm Điểm</button>
      </div>
    </div>
  </div>

  <script>
    const DATA = ${dataJson};
    let userAssigned = {};
    let isChecked = false;

    function render() {
      const pool = document.getElementById('pool');
      pool.innerHTML = '';
      
      DATA.cards.forEach(c => {
        if (!userAssigned[c.id]) {
          const div = document.createElement('div');
          div.className = 'chip';
          div.innerText = c.text;
          div.onclick = () => {
            if (isChecked) return;
            showPickCategory(c);
          };
          pool.appendChild(div);
        }
      });

      const catGrid = document.getElementById('catGrid');
      catGrid.innerHTML = '';
      DATA.categories.forEach(cat => {
        const catBox = document.createElement('div');
        catBox.className = 'cat-box';
        catBox.innerHTML = '<div class="cat-title">' + cat + '</div><div class="cat-cards" id="cat-' + encodeURIComponent(cat) + '"></div>';
        catGrid.appendChild(catBox);

        const container = catBox.querySelector('.cat-cards');
        DATA.cards.forEach(c => {
          if (userAssigned[c.id] === cat) {
            const item = document.createElement('div');
            let cls = 'assigned-chip';
            if (isChecked) {
              cls += (c.category === cat ? ' chip-correct' : ' chip-wrong');
            }
            item.className = cls;
            item.innerHTML = '<span>' + c.text + '</span>' + (!isChecked ? '<span style="color:#ef4444;margin-left:6px;">✕</span>' : (c.category === cat ? ' ✓' : ' ✕'));
            item.onclick = () => {
              if (isChecked) return;
              delete userAssigned[c.id];
              render();
            };
            container.appendChild(item);
          }
        });
      });
    }

    function showPickCategory(card) {
      const catNames = DATA.categories.map((c, i) => (i + 1) + '. ' + c).join('\\n');
      const pick = prompt('Chọn nhóm cho: "' + card.text + '"\\nNhập số tương ứng:\\n' + catNames);
      if (pick) {
        const idx = parseInt(pick.trim(), 10) - 1;
        if (idx >= 0 && idx < DATA.categories.length) {
          userAssigned[card.id] = DATA.categories[idx];
          render();
        }
      }
    }

    function checkAll() {
      isChecked = true;
      let correct = 0;
      DATA.cards.forEach(c => {
        if (userAssigned[c.id] === c.category) correct++;
      });
      const sc = Math.round((correct / DATA.cards.length) * 100);
      document.getElementById('scoreBox').innerText = 'Điểm số: ' + sc + ' / 100 điểm';
      document.getElementById('submitBtn').style.display = 'none';
      render();
    }

    function resetAll() {
      isChecked = false;
      userAssigned = {};
      document.getElementById('scoreBox').innerText = '';
      document.getElementById('submitBtn').style.display = 'block';
      render();
    }

    render();
  </script>
</body>
</html>`;
  };

  const handleExportHtml = () => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tro-choi-phan-loai-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file HTML trò chơi phân loại!', 'success');
  };

  const generateIframeCode = () => {
    const html = generateStandaloneHtml();
    const utf8Bytes = new TextEncoder().encode(html);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 = btoa(binary);

    return `<!-- MA NHUNG TRO CHOI PHAN LOAI CHO LMS -->
<div style="position:relative;width:100%;max-width:880px;margin:15px auto;padding-top:75%;background:#0f172a;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.35);">
  <iframe 
    src="data:text/html;charset=utf-8;base64,${b64}" 
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
      showToast('Vui lòng copy thủ công', 'warning');
    }
  };

  return (
    <div className="sorting-page animate-fade-in">
      {/* Header */}
      <header className="sorting-header">
        <div className="sorting-title-group">
          <div className="sorting-icon">
            <Boxes size={26} />
          </div>
          <div>
            <h1 className="sorting-title">Ghép Nối & Phân Loại Kéo Thả (Sorting & Matching Game)</h1>
            <p className="sorting-subtitle">
              Tạo hoạt động phân nhóm thuật ngữ, phân loại tài khoản kế toán, dụng cụ chuyên ngành sinh động cho LMS.
            </p>
          </div>
        </div>

        <div className="sorting-actions">
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
            onClick={() => setShowExportModal(true)}
          >
            <Code size={15} /> Lấy Mã Nhúng Iframe
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={handleExportHtml}
            style={{ background: '#10b981', border: 'none' }}
          >
            <Download size={15} /> Tải Tệp HTML
          </button>
        </div>
      </header>

      {/* Preset bar */}
      <div className="sorting-presets-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <Sparkles size={16} color="var(--primary)" /> Mẫu bài tập chuyên ngành:
        </div>
        <div className="sorting-presets-chips">
          {PRESET_SORTING.map(p => (
            <button
              key={p.id}
              type="button"
              className={`sorting-preset-chip ${selectedPresetId === p.id ? 'active' : ''}`}
              onClick={() => handleSelectPreset(p.id)}
            >
              <Tag size={12} />
              <span>[{p.subject}]</span> {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Switcher: Luyện tập vs Soạn bài tập */}
      <div className="sorting-mode-tabs">
        <button 
          type="button" 
          className={`sorting-tab-btn ${mode === 'play' ? 'active' : ''}`}
          onClick={() => setMode('play')}
        >
          <Play size={15} /> Sinh viên Luyện tập ({cards.length} thẻ)
        </button>
        <button 
          type="button" 
          className={`sorting-tab-btn ${mode === 'editor' ? 'active' : ''}`}
          onClick={() => setMode('editor')}
        >
          <Edit3 size={15} /> Giảng viên Soạn nội dung ({categories.length} nhóm)
        </button>
      </div>

      {/* Main Interactive Stage */}
      {mode === 'play' && (
        <div className="sorting-play-wrap">
          <div className="sorting-intro">
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{title}</h2>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{desc}</p>
          </div>

        {/* Thùng chứa các thẻ chưa xếp */}
        <div className="sorting-unassigned-zone">
          <div className="sorting-zone-title">
            <span>🏷️ Các mục cần phân loại ({unassignedCards.length}):</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Bấm vào các nút nhóm bên dưới thẻ để xếp</span>
          </div>

          <div className="sorting-unassigned-list">
            {unassignedCards.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                Đã xếp hết các mục vào các nhóm bên dưới! Hãy bấm "Kiểm tra kết quả".
              </div>
            ) : (
              unassignedCards.map(c => (
                <div key={c.id} className="sorting-card-item">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{c.text}</span>
                    {c.pronounce && (
                      <button 
                        type="button" 
                        onClick={() => speakText(c.pronounce!)} 
                        className="sorting-sound-btn"
                        title="Nghe phát âm chuẩn"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>
                  {c.hint && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      💡 {c.hint}
                    </div>
                  )}

                  {/* Nút chọn nhóm nhanh */}
                  {!isSubmitted && (
                    <div className="sorting-quick-buttons">
                      {categories.map((cat, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="sorting-assign-btn"
                          onClick={() => handleAssign(c.id, cat)}
                        >
                          → {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Các cột nhóm phân loại */}
        <div className="sorting-categories-grid">
          {categories.map((cat, cIdx) => {
            const assignedHere = cards.filter(c => userAssignments[c.id] === cat);

            return (
              <div key={cIdx} className="sorting-cat-column">
                <div className="sorting-cat-header">
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--primary)' }}>{cat}</h3>
                  <span className="sorting-cat-count">{assignedHere.length} mục</span>
                </div>

                <div className="sorting-cat-items-list">
                  {assignedHere.map(c => {
                    const isCorrect = isSubmitted && c.category === cat;
                    const isWrong = isSubmitted && c.category !== cat;

                    return (
                      <div 
                        key={c.id} 
                        className={`sorting-assigned-item ${isCorrect ? 'item-correct' : ''} ${isWrong ? 'item-wrong' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{c.text}</span>
                          {!isSubmitted ? (
                            <button 
                              type="button" 
                              className="sorting-remove-btn"
                              onClick={() => handleUnassign(c.id)}
                              title="Gỡ ra xếp lại"
                            >
                              ✕
                            </button>
                          ) : (
                            isCorrect ? (
                              <CheckCircle2 size={16} color="#10b981" />
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>
                                Sai (Nhóm đúng: {c.category})
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

          {/* Footer Actions */}
          <div className="sorting-footer-bar">
            <button type="button" className="btn btn-outline btn-sm" onClick={handleReset}>
              <RotateCcw size={14} /> Bắt đầu lại
            </button>

            {isSubmitted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: score >= 80 ? '#10b981' : '#f59e0b' }}>
                  Điểm số: {score} / 100 điểm
                </span>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleReset}>
                  Làm lại lần nữa
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleCheckAnswers}
                disabled={Object.keys(userAssignments).length === 0}
              >
                <Check size={16} /> Kiểm Tra Kết Quả & Chấm Điểm
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mode EDITOR: Thầy cô tự thêm nhóm và thẻ câu hỏi */}
      {mode === 'editor' && (
        <div className="sorting-editor-wrap animate-fade-in">
          {/* Tiêu đề & mô tả bài tập */}
          <div className="sorting-panel">
            <h3 className="sorting-panel-title">✏️ Thông Tin Hoạt Động Phân Loại</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Tiêu đề hoạt động:
                </label>
                <input 
                  type="text" 
                  className="bs-input" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Mô tả / Yêu cầu bài tập:
                </label>
                <textarea 
                  className="bs-textarea" 
                  rows={2} 
                  value={desc} 
                  onChange={(e) => setDesc(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Quản lý các nhóm danh mục */}
          <div className="sorting-panel">
            <div className="sorting-panel-header">
              <h3 className="sorting-panel-title">🗂️ Các Nhóm Danh Mục Cần Phân Loại ({categories.length})</h3>
            </div>
            
            <div className="sorting-cat-editor-list" style={{ marginBottom: '1.25rem' }}>
              {categories.map((cat, idx) => (
                <div key={idx} className="sorting-cat-edit-tag">
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat}</span>
                  <button 
                    type="button" 
                    className="sorting-cat-del-btn" 
                    onClick={() => handleDeleteCategory(cat)}
                    title="Xóa nhóm này"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input 
                type="text" 
                className="bs-input" 
                placeholder="Nhập tên nhóm mới (VD: Tài sản ngắn hạn, Dụng cụ vô khuẩn...)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); }}
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={handleAddCategory}
              >
                <Plus size={15} /> Thêm Nhóm
              </button>
            </div>
          </div>

          {/* Quản lý các thẻ câu hỏi */}
          <div className="sorting-panel">
            <div className="sorting-panel-header">
              <h3 className="sorting-panel-title">🏷️ Danh Sách Thẻ Cần Xếp ({cards.length})</h3>
            </div>

            {/* Form thêm thẻ mới */}
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                + Thêm Thẻ Câu Hỏi / Thuật Ngữ Mới:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <input 
                  type="text" 
                  className="bs-input" 
                  placeholder="Nội dung thẻ (VD: Paracetamol 500mg, Vốn chủ sở hữu...)"
                  value={newCardText}
                  onChange={(e) => setNewCardText(e.target.value)}
                />
                <select 
                  className="bs-input" 
                  value={newCardCat || (categories[0] || '')} 
                  onChange={(e) => setNewCardCat(e.target.value)}
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>Nhóm: {cat}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  className="bs-input" 
                  placeholder="Gợi ý chuyên môn cho sinh viên (tùy chọn)..."
                  value={newCardHint}
                  onChange={(e) => setNewCardHint(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm"
                  onClick={handleAddCard}
                >
                  <Plus size={15} /> Thêm Thẻ
                </button>
              </div>
            </div>

            {/* Grid các thẻ hiện tại */}
            <div className="sorting-cards-editor-grid">
              {cards.map(c => (
                <div key={c.id} className="sorting-card-edit-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{c.text}</span>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteCard(c.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                      title="Xóa thẻ này"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                    🎯 Nhóm đúng: {c.category}
                  </div>
                  {c.hint && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      💡 {c.hint}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Iframe */}
      {showExportModal && (
        <div className="modal-backdrop" onClick={() => setShowExportModal(false)}>
          <div className="stop-edit-modal animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={20} style={{ color: 'var(--primary)' }} />
                <h3>Mã Nhúng LMS Trò Chơi Phân Loại</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowExportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Nhúng trò chơi phân loại này vào Canvas, Moodle, Google Sites để sinh viên tương tác trực tiếp trên bài giảng điện tử!
              </p>
              <div className="export-result-box">
                <div className="export-result-header">
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Mã HTML Iframe độc lập Responsive 100%</span>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-xs"
                    onClick={handleCopyIframe}
                    style={{ background: copied ? '#10b981' : 'var(--primary)' }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
                <pre className="export-code-block">{generateIframeCode()}</pre>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowExportModal(false)}>Đóng</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleCopyIframe}>
                {copied ? 'Đã sao chép' : 'Sao chép mã nhúng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

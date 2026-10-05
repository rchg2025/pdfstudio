import { useState, useRef } from 'react';
import { 
  FileCheck2, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Code, 
  Copy, 
  Check, 
  Play, 
  Edit3, 
  RotateCcw,
  Sparkles,
  HelpCircle,
  Award
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './InteractiveWorksheet.css';

export type QuestionType = 'text' | 'select' | 'choice';

export interface WorksheetZone {
  id: string;
  type: QuestionType;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  widthPercent: number;
  heightPercent: number;
  label: string;
  correctAnswer: string; // Cho phép nhiều đáp án cách nhau bằng ; (ví dụ: cat;a cat)
  options?: string[]; // Dùng cho loại 'select' hoặc 'choice'
  explanation?: string;
}

export default function InteractiveWorksheet() {
  const { showToast } = useNotification();

  // Phiếu bài tập mẫu mặc định (Tiếng Anh & Khoa học tương tác)
  const [imageUrl, setImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80'
  );

  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [zones, setZones] = useState<WorksheetZone[]>([
    {
      id: 'zone-1',
      type: 'text',
      xPercent: 18,
      yPercent: 28,
      widthPercent: 22,
      heightPercent: 6,
      label: 'Câu 1: Điền tên hiện tượng',
      correctAnswer: 'Quang hợp;quang hop;photosynthesis',
      explanation: 'Quang hợp là quá trình thực vật hấp thụ ánh sáng mặt trời tạo diệp lục và oxy.'
    },
    {
      id: 'zone-2',
      type: 'select',
      xPercent: 55,
      yPercent: 42,
      widthPercent: 25,
      heightPercent: 6,
      label: 'Câu 2: Chọn khí thải ra',
      correctAnswer: 'Khí Oxy (O2)',
      options: ['Khí Oxy (O2)', 'Khí Carbonic (CO2)', 'Khí Nito (N2)', 'Khí Methane'],
      explanation: 'Sản phẩm giải phóng từ quá trình quang hợp là khí Oxy.'
    },
    {
      id: 'zone-3',
      type: 'choice',
      xPercent: 30,
      yPercent: 68,
      widthPercent: 38,
      heightPercent: 7,
      label: 'Câu 3: Bộ phận hấp thụ nước',
      correctAnswer: 'Rễ cây',
      options: ['Rễ cây', 'Thân cây', 'Lá cây', 'Hoa'],
      explanation: 'Rễ cây chịu trách nhiệm hút nước và muối khoáng từ đất nuôi cây.'
    }
  ]);

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('zone-1');
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [selectedZoneType, setSelectedZoneType] = useState<QuestionType>('text');

  // Trạng thái cho chế độ học sinh làm bài (preview)
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [gradedResult, setGradedResult] = useState<{
    submitted: boolean;
    score: number;
    total: number;
    details: Record<string, boolean>;
  } | null>(null);

  // Modal export
  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAnswersAfterGrading, setShowAnswersAfterGrading] = useState(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const selectedZone = zones.find(z => z.id === selectedZoneId) || null;

  // Xử lý click tạo ô mới trên ảnh
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingZone || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));

    const defaultWidth = selectedZoneType === 'choice' ? 32 : 24;
    const defaultHeight = 6.5;

    const newZone: WorksheetZone = {
      id: `zone-${Date.now()}`,
      type: selectedZoneType,
      xPercent: Math.round(x * 10) / 10,
      yPercent: Math.round(y * 10) / 10,
      widthPercent: defaultWidth,
      heightPercent: defaultHeight,
      label: `Câu hỏi #${zones.length + 1}`,
      correctAnswer: selectedZoneType === 'select' ? 'Đáp án A' : (selectedZoneType === 'choice' ? 'A' : 'đáp án đúng'),
      options: selectedZoneType !== 'text' ? ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'] : undefined,
      explanation: 'Giải thích cho câu trả lời này...'
    };

    setZones(prev => [...prev, newZone]);
    setSelectedZoneId(newZone.id);
    setIsAddingZone(false);
    showToast(`Đã thêm ô tương tác mới (${selectedZoneType})!`, 'success');
  };

  // Upload ảnh bài tập của giáo viên
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageUrl(event.target.result);
        setZones([]);
        setSelectedZoneId(null);
        setStudentAnswers({});
        setGradedResult(null);
        showToast('Đã tải hình ảnh bài tập lên thành công!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Cập nhật thuộc tính của ô đang chọn
  const handleUpdateZone = (updated: Partial<WorksheetZone>) => {
    if (!selectedZoneId) return;
    setZones(prev => prev.map(z => z.id === selectedZoneId ? { ...z, ...updated } : z));
  };

  // Xóa ô đang chọn
  const handleDeleteZone = (id: string) => {
    setZones(prev => prev.filter(z => z.id !== id));
    if (selectedZoneId === id) setSelectedZoneId(null);
    showToast('Đã xóa ô tương tác.', 'info');
  };

  // Kiểm tra câu trả lời của học sinh
  const checkAnswer = (zone: WorksheetZone, answer: string): boolean => {
    if (!answer) return false;
    const cleanAns = answer.trim().toLowerCase();
    const correctList = zone.correctAnswer.split(/[;/]+/).map(s => s.trim().toLowerCase());
    return correctList.includes(cleanAns);
  };

  // Nộp bài và chấm điểm
  const handleGrade = () => {
    let score = 0;
    const details: Record<string, boolean> = {};

    zones.forEach(z => {
      const isCorrect = checkAnswer(z, studentAnswers[z.id] || '');
      details[z.id] = isCorrect;
      if (isCorrect) score += 1;
    });

    setGradedResult({
      submitted: true,
      score,
      total: zones.length,
      details
    });

    const percent = Math.round((score / (zones.length || 1)) * 100);
    showToast(`Chấm điểm hoàn tất: ${score}/${zones.length} câu đúng (${percent}%)!`, score === zones.length ? 'success' : 'info');
  };

  // Làm lại bài
  const handleReset = () => {
    setStudentAnswers({});
    setGradedResult(null);
    setShowAnswersAfterGrading(false);
  };

  // Tạo file HTML độc lập cho LMS
  const generateStandaloneHtml = () => {
    const zonesJson = JSON.stringify(zones);
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phiếu Bài Tập Tương Tác</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; margin: 0; }
    .wrapper { width: 100%; max-width: 1080px; background: #1e293b; border-radius: 14px; overflow: hidden; box-shadow: 0 20px 45px rgba(0,0,0,0.6); border: 1px solid #334155; position: relative; }
    .top-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: #0f172a; border-bottom: 1px solid #334155; font-size: 14px; }
    .top-bar h3 { font-size: 16px; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px; margin: 0; }
    .score-badge { background: #10b981; color: #fff; font-weight: 700; padding: 4px 12px; border-radius: 20px; font-size: 13px; display: none; }
    
    .canvas-box { position: relative; width: 100%; line-height: 0; user-select: none; background: #020617; }
    .canvas-box img { width: 100%; height: auto; display: block; object-fit: contain; }
    
    .ws-field { position: absolute; z-index: 20; display: flex; align-items: center; line-height: normal; }
    .ws-input { width: 100%; height: 100%; border: 2px solid #38bdf8; background: #ffffff; color: #0f172a; font-size: 14px; font-weight: 600; padding: 0 8px; border-radius: 6px; outline: none; box-shadow: 0 3px 8px rgba(0,0,0,0.25); }
    .ws-select { width: 100%; height: 100%; border: 2px solid #38bdf8; background: #ffffff; color: #0f172a; font-size: 13px; font-weight: 600; padding: 0 6px; border-radius: 6px; outline: none; box-shadow: 0 3px 8px rgba(0,0,0,0.25); }
    
    .ws-choice-group { display: flex; gap: 4px; width: 100%; height: 100%; }
    .ws-btn-choice { flex: 1; height: 100%; background: #ffffff; border: 1.5px solid #94a3b8; border-radius: 6px; font-weight: 700; color: #1e293b; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; }
    .ws-btn-choice.active { background: #2563eb; color: #ffffff; border-color: #1d4ed8; }
    
    /* Correct/Wrong states */
    .is-correct { border-color: #10b981 !important; background: #ecfdf5 !important; color: #065f46 !important; }
    .is-wrong { border-color: #ef4444 !important; background: #fef2f2 !important; color: #991b1b !important; }
    
    .bottom-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: #0f172a; border-top: 1px solid #334155; }
    .btn { padding: 9px 18px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; border: none; transition: 0.15s; }
    .btn-submit { background: #10b981; color: #fff; }
    .btn-submit:hover { background: #059669; }
    .btn-reset { background: #475569; color: #fff; }
    .btn-reset:hover { background: #334155; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="top-bar">
      <h3>📝 Phiếu Bài Tập Tương Tác</h3>
      <div id="score-badge" class="score-badge"></div>
    </div>
    
    <div class="canvas-box" id="canvas-box">
      <img src="${imageUrl}" alt="Worksheet Background">
      <div id="fields-container"></div>
    </div>
    
    <div class="bottom-bar">
      <button class="btn btn-reset" onclick="resetForm()">Làm lại bài</button>
      <button class="btn btn-submit" id="btn-submit" onclick="submitWorksheet()">Nộp bài & Chấm điểm</button>
    </div>
  </div>

  <script>
    const ZONES = ${zonesJson};
    const answers = {};
    const container = document.getElementById('fields-container');
    const scoreBadge = document.getElementById('score-badge');

    function renderFields() {
      container.innerHTML = '';
      ZONES.forEach((z) => {
        const wrap = document.createElement('div');
        wrap.className = 'ws-field';
        wrap.id = 'wrap-' + z.id;
        wrap.style.left = z.xPercent + '%';
        wrap.style.top = z.yPercent + '%';
        wrap.style.width = z.widthPercent + '%';
        wrap.style.height = z.heightPercent + '%';

        if (z.type === 'text') {
          const input = document.createElement('input');
          input.className = 'ws-input';
          input.id = 'input-' + z.id;
          input.placeholder = 'Gõ đáp án...';
          input.oninput = (e) => { answers[z.id] = e.target.value; };
          wrap.appendChild(input);
        } else if (z.type === 'select') {
          const select = document.createElement('select');
          select.className = 'ws-select';
          select.id = 'input-' + z.id;
          const defOpt = document.createElement('option');
          defOpt.value = '';
          defOpt.innerText = '-- Chọn đáp án --';
          select.appendChild(defOpt);
          (z.options || []).forEach(opt => {
            const o = document.createElement('option');
            o.value = opt;
            o.innerText = opt;
            select.appendChild(o);
          });
          select.onchange = (e) => { answers[z.id] = e.target.value; };
          wrap.appendChild(select);
        } else if (z.type === 'choice') {
          const grp = document.createElement('div');
          grp.className = 'ws-choice-group';
          grp.id = 'grp-' + z.id;
          (z.options || []).forEach(opt => {
            const b = document.createElement('button');
            b.className = 'ws-btn-choice';
            b.innerText = opt;
            b.onclick = () => {
              answers[z.id] = opt;
              grp.querySelectorAll('.ws-btn-choice').forEach(el => el.classList.remove('active'));
              b.classList.add('active');
            };
            grp.appendChild(b);
          });
          wrap.appendChild(grp);
        }

        container.appendChild(wrap);
      });
    }

    function checkAnswer(zone, ans) {
      if (!ans) return false;
      const clean = ans.trim().toLowerCase();
      const list = zone.correctAnswer.split(/[;/]+/).map(s => s.trim().toLowerCase());
      return list.includes(clean);
    }

    function submitWorksheet() {
      let score = 0;
      ZONES.forEach(z => {
        const val = answers[z.id] || '';
        const isOk = checkAnswer(z, val);
        if (isOk) score++;

        const inputEl = document.getElementById('input-' + z.id);
        const grpEl = document.getElementById('grp-' + z.id);

        if (inputEl) {
          inputEl.classList.remove('is-correct', 'is-wrong');
          inputEl.classList.add(isOk ? 'is-correct' : 'is-wrong');
        }
        if (grpEl) {
          grpEl.querySelectorAll('.ws-btn-choice').forEach(b => {
            if (b.innerText === z.correctAnswer) b.classList.add('is-correct');
            else if (b.innerText === val && !isOk) b.classList.add('is-wrong');
          });
        }
      });

      const pct = Math.round((score / ZONES.length) * 100);
      scoreBadge.style.display = 'block';
      scoreBadge.innerText = 'Điểm: ' + score + '/' + ZONES.length + ' (' + pct + '%)';
      scoreBadge.style.background = score === ZONES.length ? '#10b981' : (score > 0 ? '#f59e0b' : '#ef4444');
    }

    function resetForm() {
      for (const k in answers) delete answers[k];
      scoreBadge.style.display = 'none';
      renderFields();
    }

    renderFields();
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
    a.download = `phieu-bai-tap-tuong-tac-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file HTML Phiếu Bài Tập!', 'success');
  };

  const generateIframeCode = () => {
    const html = generateStandaloneHtml();
    const utf8Bytes = new TextEncoder().encode(html);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 = btoa(binary);

    return `<!-- MA NHUNG PHIEU BAI TAP TUONG TAC CHO LMS / E-LEARNING -->
<div style="position:relative;width:100%;max-width:1080px;margin:15px auto;padding-top:68%;background:#0f172a;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.35);">
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
      showToast('Không thể sao chép tự động, vui lòng copy thủ công.', 'warning');
    }
  };

  return (
    <div className="worksheet-container animate-fade-in">
      <header className="ws-header">
        <div className="ws-title-group">
          <div className="ws-icon">
            <FileCheck2 size={26} />
          </div>
          <div>
            <h1 className="ws-title">Phiếu Bài Tập Tương Tác (Worksheet Builder)</h1>
            <p className="ws-subtitle">
              Biến bài tập PDF, sơ đồ hay hình ảnh thành phiếu điền từ, trắc nghiệm và chấm điểm trực tiếp trên LMS.
            </p>
          </div>
        </div>

        <div className="ws-header-actions">
          <div className="ws-mode-tabs">
            <button 
              type="button" 
              className={`ws-tab-btn ${mode === 'edit' ? 'active' : ''}`}
              onClick={() => { setMode('edit'); handleReset(); }}
            >
              <Edit3 size={15} /> Thiết kế
            </button>
            <button 
              type="button" 
              className={`ws-tab-btn ${mode === 'preview' ? 'active' : ''}`}
              onClick={() => setMode('preview')}
            >
              <Play size={15} /> Học sinh làm thử
            </button>
          </div>

          <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={15} /> Tải Ảnh Lên
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          </label>
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

      {/* Grid thiết kế & tương tác */}
      <div className="ws-layout-grid">
        {/* Canvas bài tập */}
        <div className="ws-stage-panel">
          <div className="ws-bar">
            {mode === 'edit' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span className="ws-hint">
                  {isAddingZone ? '👉 Hãy click vào vị trí trên ảnh bài tập để đặt ô tương tác' : 'Bấm nút dưới để thêm ô:'}
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button 
                    type="button" 
                    className={`btn btn-xs ${isAddingZone && selectedZoneType === 'text' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => { setIsAddingZone(true); setSelectedZoneType('text'); }}
                  >
                    + Ô Điền Từ
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-xs ${isAddingZone && selectedZoneType === 'select' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => { setIsAddingZone(true); setSelectedZoneType('select'); }}
                  >
                    + Hộp Chọn (Select)
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-xs ${isAddingZone && selectedZoneType === 'choice' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => { setIsAddingZone(true); setSelectedZoneType('choice'); }}
                  >
                    + Nút Trắc Nghiệm (A/B/C)
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span className="ws-hint"><Play size={15} /> Chế độ học sinh làm bài & chấm điểm tự động</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-outline btn-xs" onClick={handleReset}>
                    <RotateCcw size={13} /> Làm lại
                  </button>
                  <button type="button" className="btn btn-primary btn-xs" style={{ background: '#10b981', border: 'none' }} onClick={handleGrade}>
                    <Award size={13} /> Nộp bài & Chấm điểm
                  </button>
                </div>
              </div>
            )}
          </div>

          <div 
            ref={canvasRef}
            className={`ws-canvas-wrap ${isAddingZone ? 'placing-cursor' : ''}`}
            onClick={handleCanvasClick}
          >
            <img src={imageUrl} alt="Worksheet" className="ws-canvas-img" />

            {/* Chế độ thiết kế: hiển thị các vùng bounding box */}
            {mode === 'edit' && zones.map((z, idx) => (
              <div 
                key={z.id}
                className={`ws-zone-marker ${selectedZoneId === z.id ? 'selected' : ''}`}
                style={{
                  left: `${z.xPercent}%`,
                  top: `${z.yPercent}%`,
                  width: `${z.widthPercent}%`,
                  height: `${z.heightPercent}%`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedZoneId(z.id);
                }}
              >
                <span className="ws-zone-badge">#{idx + 1} {z.type.toUpperCase()}</span>
              </div>
            ))}

            {/* Chế độ xem trước: hiển thị controls tương tác cho học sinh */}
            {mode === 'preview' && zones.map(z => {
              const isGraded = gradedResult?.submitted;
              const isOk = isGraded ? gradedResult.details[z.id] : undefined;

              return (
                <div 
                  key={z.id}
                  className="ws-interactive-field"
                  style={{
                    left: `${z.xPercent}%`,
                    top: `${z.yPercent}%`,
                    width: `${z.widthPercent}%`,
                    height: `${z.heightPercent}%`
                  }}
                >
                  {z.type === 'text' && (
                    <input 
                      type="text"
                      className={`ws-interactive-input ${isGraded ? (isOk ? 'ws-field-correct' : 'ws-field-wrong') : ''}`}
                      placeholder="Gõ đáp án..."
                      value={studentAnswers[z.id] || ''}
                      onChange={(e) => setStudentAnswers(prev => ({ ...prev, [z.id]: e.target.value }))}
                      disabled={isGraded}
                    />
                  )}

                  {z.type === 'select' && (
                    <select 
                      className={`ws-interactive-select ${isGraded ? (isOk ? 'ws-field-correct' : 'ws-field-wrong') : ''}`}
                      value={studentAnswers[z.id] || ''}
                      onChange={(e) => setStudentAnswers(prev => ({ ...prev, [z.id]: e.target.value }))}
                      disabled={isGraded}
                    >
                      <option value="">-- Chọn đáp án --</option>
                      {(z.options || []).map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {z.type === 'choice' && (
                    <div className="ws-interactive-choice">
                      {(z.options || []).map((opt, i) => {
                        const isSelected = studentAnswers[z.id] === opt;
                        let extraClass = '';
                        if (isSelected) extraClass = 'selected';
                        if (isGraded) {
                          if (opt === z.correctAnswer) extraClass += ' ws-field-correct';
                          else if (isSelected && !isOk) extraClass += ' ws-field-wrong';
                        }
                        return (
                          <button
                            key={i}
                            type="button"
                            className={`ws-choice-btn ${extraClass}`}
                            onClick={() => !isGraded && setStudentAnswers(prev => ({ ...prev, [z.id]: opt }))}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar điều khiển */}
        <div className="ws-edit-panel">
          {mode === 'preview' ? (
            <div>
              {gradedResult?.submitted ? (
                <div className="ws-score-banner animate-fade-in">
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Kết quả làm bài</h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                      Đúng {gradedResult.score} trên {gradedResult.total} câu
                    </p>
                  </div>
                  <div className="ws-score-num">
                    {Math.round((gradedResult.score / (gradedResult.total || 1)) * 100)}%
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <HelpCircle size={36} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                  <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Hướng dẫn học sinh</h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Điền câu trả lời vào các ô màu xanh trên bài tập, sau đó bấm <strong>Nộp bài & Chấm điểm</strong> để kiểm tra kết quả ngay lập tức.
                  </p>
                </div>
              )}

              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 className="ws-label" style={{ margin: 0 }}>Danh sách câu hỏi ({zones.length})</h4>
                  {gradedResult?.submitted && (
                    <button 
                      type="button" 
                      className="btn btn-outline btn-xs"
                      onClick={() => setShowAnswersAfterGrading(prev => !prev)}
                    >
                      {showAnswersAfterGrading ? 'Ẩn đáp án' : 'Xem đáp án chi tiết'}
                    </button>
                  )}
                </div>
                <div className="ws-items-list">
                  {zones.map((z, idx) => {
                    const ans = studentAnswers[z.id];
                    const isGraded = gradedResult?.submitted;
                    const isOk = isGraded ? gradedResult.details[z.id] : undefined;

                    return (
                      <div key={z.id} className="ws-item-card">
                        <div className="ws-item-info">
                          <span className="ws-item-name">#{idx + 1}. {z.label}</span>
                          <span className="ws-item-type">
                            {!isGraded ? (
                              ans ? (
                                <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
                                  Đã trả lời: <strong>{ans}</strong>
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>Chưa điền câu trả lời</span>
                              )
                            ) : (
                              <span>
                                {isOk ? (
                                  <strong style={{ color: '#10b981' }}>✅ Đúng</strong>
                                ) : (
                                  <strong style={{ color: '#ef4444' }}>❌ Chưa chính xác</strong>
                                )}
                                {showAnswersAfterGrading && (
                                  <div style={{ marginTop: '0.25rem', color: '#10b981', fontSize: '0.82rem' }}>
                                    Đáp án đúng: <strong>{z.correctAnswer}</strong>
                                    {z.explanation && <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>💡 {z.explanation}</div>}
                                  </div>
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              {selectedZone ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="ws-panel-title">
                      <Sparkles size={18} color="var(--primary)" /> Cài đặt ô #{zones.findIndex(z => z.id === selectedZone.id) + 1}
                    </h3>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-xs" 
                      style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}
                      onClick={() => handleDeleteZone(selectedZone.id)}
                    >
                      <Trash2 size={13} /> Xóa
                    </button>
                  </div>

                  <div className="ws-form-group">
                    <label className="ws-label">Tiêu đề câu hỏi / Nhãn</label>
                    <input 
                      type="text" 
                      className="ws-input" 
                      value={selectedZone.label}
                      onChange={(e) => handleUpdateZone({ label: e.target.value })}
                    />
                  </div>

                  <div className="ws-form-group">
                    <label className="ws-label">Loại câu hỏi</label>
                    <select 
                      className="ws-select"
                      value={selectedZone.type}
                      onChange={(e) => {
                        const newType = e.target.value as QuestionType;
                        handleUpdateZone({ 
                          type: newType,
                          options: newType !== 'text' && !selectedZone.options ? ['A', 'B', 'C', 'D'] : selectedZone.options
                        });
                      }}
                    >
                      <option value="text">Ô Điền từ (Text Input)</option>
                      <option value="select">Menu chọn (Dropdown Select)</option>
                      <option value="choice">Nút chọn trắc nghiệm (Single Choice)</option>
                    </select>
                  </div>

                  <div className="ws-form-group">
                    <label className="ws-label">
                      Đáp án đúng {selectedZone.type === 'text' && '(Chấp nhận nhiều đáp án cách nhau bằng dấu chấm phẩy ;)'}
                    </label>
                    <input 
                      type="text" 
                      className="ws-input" 
                      value={selectedZone.correctAnswer}
                      placeholder="ví dụ: 12;mười hai;twelve"
                      onChange={(e) => handleUpdateZone({ correctAnswer: e.target.value })}
                    />
                  </div>

                  {selectedZone.type !== 'text' && (
                    <div className="ws-form-group">
                      <label className="ws-label">Các lựa chọn (Mỗi lựa chọn một dòng)</label>
                      <textarea 
                        className="ws-textarea" 
                        rows={3}
                        value={(selectedZone.options || []).join('\n')}
                        onChange={(e) => handleUpdateZone({ options: e.target.value.split('\n').filter(s => s.trim()) })}
                      />
                    </div>
                  )}

                  <div className="ws-form-group">
                    <label className="ws-label">Giải thích chi tiết (Feedback)</label>
                    <textarea 
                      className="ws-textarea" 
                      rows={2}
                      value={selectedZone.explanation || ''}
                      placeholder="Hiện khi học sinh xem lại bài..."
                      onChange={(e) => handleUpdateZone({ explanation: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="ws-form-group">
                      <label className="ws-label">Độ rộng ô (%)</label>
                      <input 
                        type="number" 
                        min={10} 
                        max={90}
                        className="ws-input" 
                        value={selectedZone.widthPercent}
                        onChange={(e) => handleUpdateZone({ widthPercent: Number(e.target.value) })}
                      />
                    </div>
                    <div className="ws-form-group">
                      <label className="ws-label">Chiều cao ô (%)</label>
                      <input 
                        type="number" 
                        min={3} 
                        max={30}
                        className="ws-input" 
                        value={selectedZone.heightPercent}
                        onChange={(e) => handleUpdateZone({ heightPercent: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                  <Plus size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p>Hãy bấm vào các nút "Thêm ô" bên trên và click vào ảnh để tạo câu hỏi đầu tiên.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Lấy mã nhúng Iframe */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Code size={18} color="var(--primary)" /> Mã Nhúng LMS Cho Phiếu Bài Tập</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowExportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Sao chép đoạn mã bên dưới và dán vào phần HTML/Source Code trên LMS của trường bạn (Canvas, Moodle, Google Sites, Blackboard, v.v.). Học sinh sẽ làm bài trực tiếp và nhận điểm số ngay trên bài giảng!
              </p>
              <div className="export-result-box">
                <div className="export-result-header">
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Mã HTML Iframe độc lập (Tự động chấm điểm)</span>
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

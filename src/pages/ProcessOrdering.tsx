import { useState } from 'react';
import { 
  ListOrdered, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Code, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Tag, 
  ShieldAlert,
  Play
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './ProcessOrdering.css';

export interface StepItem {
  id: string;
  order: number;
  title: string;
  desc: string;
  dangerNote?: string;
  critical?: boolean;
}

export interface ProcessTemplate {
  id: string;
  category: string;
  name: string;
  title: string;
  desc: string;
  steps: StepItem[];
}

const PRESET_PROCESSES: ProcessTemplate[] = [
  {
    id: 'med-handwash',
    category: 'Y Dược - Điều Dưỡng',
    name: 'Quy trình 6 bước rửa tay ngoại khoa thường quy',
    title: 'Thực hành Chuẩn Vô Trùng trong Bệnh Viện',
    desc: 'Sinh viên sắp xếp lại đúng 6 bước rửa tay theo chuẩn Bộ Y Tế trước khi bước vào phòng phẫu thuật.',
    steps: [
      { id: 's1', order: 1, title: 'Bước 1: Làm ướt và chà xát hai lòng bàn tay', desc: 'Làm ướt tay bằng nước sạch, thoa dung dịch xà phòng và chà sát hai lòng bàn tay vào nhau.', critical: false },
      { id: 's2', order: 2, title: 'Bước 2: Chà lòng bàn tay này lên mu bàn tay kia', desc: 'Cuộn và miết kỹ từng ngón tay và kẽ ngón tay của bàn tay bên kia, sau đó đổi bên.', critical: false },
      { id: 's3', order: 3, title: 'Bước 3: Chà hai lòng bàn tay vào nhau, miết mạnh kẽ ngón', desc: 'Đan các ngón tay và miết mạnh các kẽ ngón tay từ dưới lên đầu ngón.', critical: false },
      { id: 's4', order: 4, title: 'Bước 4: Chà mặt ngoài các ngón tay vào lòng bàn tay kia', desc: 'Khum bàn tay và miết sạch mặt ngoài của các đốt ngón tay.', critical: false },
      { id: 's5', order: 5, title: 'Bước 5: Xoay ngón tay cái vào lòng bàn tay kia', desc: 'Nắm chặt ngón tay cái và xoay đều để làm sạch triệt để vùng ngón cái.', critical: false },
      { id: 's6', order: 6, title: 'Bước 6: Xoay các đầu ngón tay vào lòng bàn tay kia', desc: 'Chụm các đầu ngón tay và xoay tròn trong lòng bàn tay kia để làm sạch móng tay, sau đó xả sạch và làm khô.', dangerNote: 'Cực kỳ quan trọng: Đầu ngón tay và kẽ móng là nơi tích tụ vi khuẩn nhiều nhất.', critical: true }
    ]
  },
  {
    id: 'mech-cnc-safety',
    category: 'Cơ Khí Chế Tạo',
    name: 'Quy trình an toàn vận hành máy tiện phay CNC',
    title: 'Kiểm tra Trình Tự Khởi Động & Gia Công Cơ Khí',
    desc: 'Sắp xếp chuẩn xác các thao tác chuẩn bị và chạy thử trước khi cho dao ăn phôi.',
    steps: [
      { id: 'm1', order: 1, title: 'Bước 1: Kiểm tra an toàn bảo hộ lao động (BHLĐ)', desc: 'Đeo kính bảo hộ, mặc quần áo gọn gàng, tuyệt đối không đeo găng tay len khi vận hành máy quay.', dangerNote: 'Tuyệt đối cấm đeo găng tay khi đứng máy tiện mâm cặp quay!', critical: true },
      { id: 'm2', order: 2, title: 'Bước 2: Kiểm tra dầu bôi trơn và mức nước làm mát', desc: 'Đảm bảo áp suất khí nén và bình bôi trơn ray trượt đủ định mức cho máy hoạt động liên tục.', critical: false },
      { id: 'm3', order: 3, title: 'Bước 3: Gá đặt phôi và so dao (Set Zero WCS)', desc: 'Kẹp chặt phôi bằng mâm cặp, kiểm tra độ đồng tâm bằng đồng hồ so và thiết lập tọa độ G54.', critical: false },
      { id: 'm4', order: 4, title: 'Bước 4: Nạp chương trình G-code & Mô phỏng 2D/3D (Dry Run)', desc: 'Chạy thử mô phỏng không phôi trên màn hình điều khiển để kiểm tra va chạm dao.', critical: false },
      { id: 'm5', order: 5, title: 'Bước 5: Đóng cửa chắn phoi và nhấn CYCLE START với bước tiến F thấp', desc: 'Theo dõi hành trình dao cắt lát đầu tiên, sẵn sàng tay giữ nút Feed Hold hoặc E-STOP.', critical: true }
    ]
  },
  {
    id: 'beauty-facial',
    category: 'Chăm Sóc Sắc Đẹp',
    name: 'Quy trình liệu trình chăm sóc da mặt chuyên sâu 7 bước',
    title: 'Quy Trình Chăm Sóc Da Chuẩn Spa & Thẩm Mỹ Viện',
    desc: 'Đảm bảo đúng nguyên tắc làm sạch sâu -> đẩy dưỡng chất -> bảo vệ màng sinh học.',
    steps: [
      { id: 'b1', order: 1, title: 'Bước 1: Tẩy trang và làm sạch da bằng sữa rửa mặt dịu nhẹ', desc: 'Loại bỏ lớp makeup, kem chống nắng và bụi bẩn bề mặt.', critical: false },
      { id: 'b2', order: 2, title: 'Bước 2: Tẩy tế bào chết enzyme / sinh học', desc: 'Làm mềm lớp sừng già cỗi giúp lỗ chân lông thông thoáng.', critical: false },
      { id: 'b3', order: 3, title: 'Bước 3: Xông hơi ấm & hút dầu thừa bã nhờn', desc: 'Giãn nở lỗ chân lông với tinh dầu sả chanh, hút sạch cặn bã vùng cánh mũi.', critical: false },
      { id: 'b4', order: 4, title: 'Bước 4: Sát khuẩn da bằng cồn đỏ Povidine / Tia điện tím Ozone', desc: 'Khử trùng tuyệt đối trước khi can thiệp lấy nhân mụn.', dangerNote: 'Bắt buộc sát khuẩn để tránh nhiễm trùng huyết và lây lan vi khuẩn P.Acnes.', critical: true },
      { id: 'b5', order: 5, title: 'Bước 5: Lấy nhân mụn chuẩn y khoa bằng tăm bông / kim vô trùng', desc: 'Chỉ nặn các mụn đã gom cồi, không đè nát mô liên kết biểu bì.', critical: false },
      { id: 'b6', order: 6, title: 'Bước 6: Đắp mặt nạ làm dịu da & Chiếu đèn sinh học ánh sáng xanh', desc: 'Kháng viêm, giảm sưng đỏ tức thì sau nặn.', critical: false },
      { id: 'b7', order: 7, title: 'Bước 7: Điện di tinh chất phục hồi (HA/B5) & Thoa kem chống nắng', desc: 'Khóa ẩm và bảo vệ da tuyệt đối trước ánh sáng mặt trời.', critical: false }
    ]
  },
  {
    id: 'childcare-heimlich',
    category: 'Nuôi Dưỡng Trẻ',
    name: 'Thủ thuật sơ cứu trẻ bị hóc dị vật đường thở (Heimlich)',
    title: 'Quy Trình Cấp Cứu Sống Còn Cho Trẻ Dưới 1 Tuổi',
    desc: 'Thao tác vàng trong 3 phút đầu khi trẻ có biểu hiện nghẹt thở, tím tái do hóc thức ăn/đồ chơi.',
    steps: [
      { id: 'c1', order: 1, title: 'Bước 1: Đánh giá nhanh tình trạng tắc nghẽn và gọi hỗ trợ', desc: 'Quan sát trẻ có ho khóc được không. Nếu im lặng, môi tím tái lập tức hô hoán gọi người hỗ trợ.', critical: false },
      { id: 'c2', order: 2, title: 'Bước 2: Đặt trẻ nằm sấp dọc theo cẳng tay người lớn, đầu dốc xuống thấp', desc: 'Dùng một bàn tay giữ chặt cằm và nâng đỡ vùng đầu cổ của trẻ.', dangerNote: 'Luôn giữ đầu trẻ thấp hơn ngực để dị vật theo trọng lực rơi ra ngoài.', critical: true },
      { id: 'c3', order: 3, title: 'Bước 3: Dùng gót bàn tay vỗ 5 lần dứt khoát vào giữa hai xương bả vai', desc: 'Vỗ theo hướng từ sau ra trước, từ dưới lên trên để tạo áp lực đẩy dị vật.', critical: true },
      { id: 'c4', order: 4, title: 'Bước 4: Lật ngửa trẻ sang cẳng tay kia, kiểm tra khoang miệng', desc: 'Chỉ dùng ngón tay quét lấy dị vật nếu nhìn thấy rõ ràng ở mép miệng, không chọc mò vào họng.', dangerNote: 'Tuyệt đối không chọc ngón tay mò mẫm sâu vào họng vì sẽ đẩy dị vật tụt sâu hơn.', critical: true },
      { id: 'c5', order: 5, title: 'Bước 5: Dùng 2 ngón tay ấn ngực 5 lần ở vị trí dưới đường nối 2 núm vú 1 khoát ngón tay', desc: 'Nếu trẻ vẫn chưa thở được, thực hiện 5 lần ép ngực dứt khoát và lặp lại chu kỳ.', critical: true }
    ]
  }
];

export default function ProcessOrdering() {
  const { showToast } = useNotification();

  const [selectedPresetId, setSelectedPresetId] = useState<string>('med-handwash');
  const currentPreset = PRESET_PROCESSES.find(p => p.id === selectedPresetId) || PRESET_PROCESSES[0];

  const [title, setTitle] = useState(currentPreset.title);
  const [desc, setDesc] = useState(currentPreset.desc);
  const [steps, setSteps] = useState<StepItem[]>(currentPreset.steps);

  // Chế độ Simulator (Trải nghiệm làm bài tập sắp xếp của sinh viên)
  const [mode, setMode] = useState<'editor' | 'play'>('play');
  const [shuffledSteps, setShuffledSteps] = useState<StepItem[]>(() => {
    return [...currentPreset.steps].sort(() => Math.random() - 0.5);
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number>(0);

  // Modal nhúng
  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectPreset = (id: string) => {
    const p = PRESET_PROCESSES.find(item => item.id === id);
    if (!p) return;
    setSelectedPresetId(id);
    setTitle(p.title);
    setDesc(p.desc);
    setSteps(p.steps);
    setShuffledSteps([...p.steps].sort(() => Math.random() - 0.5));
    setIsSubmitted(false);
    showToast(`Đã nạp mẫu: ${p.name}`, 'info');
  };

  // Di chuyển bước trong chế độ Play (Kéo thả/Bấm lên xuống)
  const handleMovePlayStep = (index: number, direction: 'up' | 'down') => {
    if (isSubmitted) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= shuffledSteps.length) return;

    const list = [...shuffledSteps];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setShuffledSteps(list);
  };

  // Nộp bài kiểm tra kết quả
  const handleCheckOrder = () => {
    let correctCount = 0;
    shuffledSteps.forEach((st, idx) => {
      if (st.order === idx + 1) correctCount++;
    });

    const finalScore = Math.round((correctCount / shuffledSteps.length) * 100);
    setScore(finalScore);
    setIsSubmitted(true);

    if (finalScore === 100) {
      showToast('Xuất sắc! Bạn đã sắp xếp chuẩn xác 100% quy trình SOP!', 'success');
    } else {
      showToast(`Bạn đạt ${finalScore} điểm. Hãy kiểm tra lại các bước sai màu đỏ nhé!`, 'warning');
    }
  };

  const handleResetPlay = () => {
    setShuffledSteps([...steps].sort(() => Math.random() - 0.5));
    setIsSubmitted(false);
    setScore(0);
  };

  // Editor thao tác thêm/xóa bước
  const handleAddStep = () => {
    const newStep: StepItem = {
      id: `s-${Date.now()}`,
      order: steps.length + 1,
      title: `Bước ${steps.length + 1}: Thao tác mới...`,
      desc: 'Mô tả chi tiết kỹ thuật thực hiện bước này...'
    };
    const updated = [...steps, newStep];
    setSteps(updated);
    setShuffledSteps([...updated].sort(() => Math.random() - 0.5));
    showToast('Đã thêm bước mới!', 'success');
  };

  const handleDeleteStep = (id: string) => {
    const updated = steps.filter(s => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(updated);
    setShuffledSteps([...updated].sort(() => Math.random() - 0.5));
    showToast('Đã xóa bước.', 'info');
  };

  const handleUpdateStep = (id: string, partial: Partial<StepItem>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...partial } : s));
  };

  // Xuất file HTML độc lập
  const generateStandaloneHtml = () => {
    const stepsJson = JSON.stringify(steps);
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; }
    .card { width: 100%; max-width: 820px; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 45px rgba(0,0,0,0.6); border: 1px solid #334155; }
    .header { padding: 18px 24px; background: #182234; border-bottom: 1px solid #334155; }
    .title { font-size: 20px; font-weight: 700; color: #38bdf8; margin-bottom: 6px; }
    .desc { font-size: 14px; color: #94a3b8; line-height: 1.5; }
    .body { padding: 20px; }
    .steps-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .step-item { display: flex; align-items: center; gap: 12px; background: #0f172a; border: 1px solid #334155; padding: 12px 16px; border-radius: 12px; transition: all 0.2s; }
    .step-num { width: 32px; height: 32px; border-radius: 50%; background: #334155; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .step-content { flex: 1; }
    .step-title { font-size: 15px; font-weight: 600; color: #f8fafc; margin-bottom: 3px; }
    .step-desc { font-size: 13px; color: #94a3b8; }
    .step-danger { font-size: 12px; color: #f87171; font-weight: 500; margin-top: 4px; }
    .btn-group { display: flex; flex-direction: column; gap: 4px; }
    .btn-move { background: #1e293b; border: 1px solid #475569; color: #cbd5e1; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .btn-move:hover { background: #38bdf8; color: #0f172a; border-color: #38bdf8; }
    .correct { border-color: #10b981 !important; background: rgba(16, 185, 129, 0.1) !important; }
    .wrong { border-color: #ef4444 !important; background: rgba(239, 68, 68, 0.1) !important; }
    .footer-actions { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #334155; padding-top: 16px; }
    .btn-check { background: #10b981; color: #fff; font-weight: 700; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 15px; }
    .btn-reset { background: transparent; border: 1px solid #475569; color: #cbd5e1; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; }
    .score-badge { font-size: 16px; font-weight: 700; color: #38bdf8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">${title}</div>
      <div class="desc">${desc}</div>
    </div>
    <div class="body">
      <div class="steps-list" id="list"></div>
      <div class="footer-actions">
        <button class="btn-reset" onclick="resetOrder()">Đảo thứ tự ngẫu nhiên</button>
        <span class="score-badge" id="scoreEl"></span>
        <button class="btn-check" id="checkBtn" onclick="checkOrder()">Kiểm Tra Kết Quả</button>
      </div>
    </div>
  </div>

  <script>
    const ORIGINAL_STEPS = ${stepsJson};
    let currentSteps = [...ORIGINAL_STEPS].sort(() => Math.random() - 0.5);
    let isChecked = false;

    function render() {
      const container = document.getElementById('list');
      container.innerHTML = '';
      currentSteps.forEach((st, idx) => {
        const item = document.createElement('div');
        let statusClass = '';
        if (isChecked) {
          statusClass = st.order === idx + 1 ? 'correct' : 'wrong';
        }
        item.className = 'step-item ' + statusClass;
        item.innerHTML = \`
          <div class="step-num">\${idx + 1}</div>
          <div class="step-content">
            <div class="step-title">\${st.title}</div>
            <div class="step-desc">\${st.desc || ''}</div>
            \${st.dangerNote ? '<div class="step-danger">⚠️ ' + st.dangerNote + '</div>' : ''}
          </div>
          \${!isChecked ? \`
            <div class="btn-group">
              <button class="btn-move" onclick="move(\${idx}, -1)">▲</button>
              <button class="btn-move" onclick="move(\${idx}, 1)">▼</button>
            </div>
          \` : (st.order === idx + 1 ? '<span style="color:#10b981;font-weight:bold;font-size:18px;">✓</span>' : '<span style="color:#ef4444;font-weight:bold;font-size:18px;">✕ Đúng là: Bước ' + st.order + '</span>')}
        \`;
        container.appendChild(item);
      });
    }

    function move(index, direction) {
      if (isChecked) return;
      const target = index + direction;
      if (target < 0 || target >= currentSteps.length) return;
      const temp = currentSteps[index];
      currentSteps[index] = currentSteps[target];
      currentSteps[target] = temp;
      render();
    }

    function checkOrder() {
      isChecked = true;
      let count = 0;
      currentSteps.forEach((st, idx) => {
        if (st.order === idx + 1) count++;
      });
      const score = Math.round((count / currentSteps.length) * 100);
      document.getElementById('scoreEl').innerText = 'Điểm số: ' + score + ' / 100 điểm';
      document.getElementById('checkBtn').style.display = 'none';
      render();
    }

    function resetOrder() {
      isChecked = false;
      document.getElementById('scoreEl').innerText = '';
      document.getElementById('checkBtn').style.display = 'inline-block';
      currentSteps = [...ORIGINAL_STEPS].sort(() => Math.random() - 0.5);
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
    a.download = `quy-trinh-sop-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file HTML Quy Trình Thực Hành!', 'success');
  };

  const generateIframeCode = () => {
    const html = generateStandaloneHtml();
    const utf8Bytes = new TextEncoder().encode(html);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 = btoa(binary);

    return `<!-- MA NHUNG QUY TRINH THUC HANH CHO LMS -->
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
    <div className="process-page animate-fade-in">
      {/* Header */}
      <header className="process-header">
        <div className="process-title-group">
          <div className="process-icon">
            <ListOrdered size={26} />
          </div>
          <div>
            <h1 className="process-title">Mô Phỏng Quy Trình Tuân Thủ (Process & SOP Ordering)</h1>
            <p className="process-subtitle">
              Tạo bài tập sắp xếp thứ tự các bước thao tác kỹ thuật, kiểm định quy trình thực hành chuẩn an toàn cho sinh viên.
            </p>
          </div>
        </div>

        <div className="process-actions">
          <div className="process-mode-tabs">
            <button 
              type="button" 
              className={`process-tab-btn ${mode === 'play' ? 'active' : ''}`}
              onClick={() => { setMode('play'); handleResetPlay(); }}
            >
              <Play size={14} /> Sinh viên làm bài
            </button>
            <button 
              type="button" 
              className={`process-tab-btn ${mode === 'editor' ? 'active' : ''}`}
              onClick={() => setMode('editor')}
            >
              <BookOpen size={14} /> Soạn các bước
            </button>
          </div>

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

      {/* Preset Chips */}
      <div className="process-presets-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <Sparkles size={16} color="var(--primary)" /> Mẫu quy trình chuyên ngành:
        </div>
        <div className="process-presets-chips">
          {PRESET_PROCESSES.map(p => (
            <button
              key={p.id}
              type="button"
              className={`process-preset-chip ${selectedPresetId === p.id ? 'active' : ''}`}
              onClick={() => handleSelectPreset(p.id)}
            >
              <Tag size={12} />
              <span>[{p.category}]</span> {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mode PLAY: Sinh viên thực hành sắp xếp */}
      {mode === 'play' && (
        <div className="process-play-container animate-fade-in">
          <div className="process-play-header">
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-primary)' }}>{title}</h2>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>{desc}</p>
          </div>

          <div className="process-steps-play-list">
            {shuffledSteps.map((st, idx) => {
              const isCorrect = isSubmitted && st.order === idx + 1;
              const isWrong = isSubmitted && st.order !== idx + 1;

              return (
                <div 
                  key={st.id} 
                  className={`process-step-play-card ${isCorrect ? 'step-correct' : ''} ${isWrong ? 'step-wrong' : ''}`}
                >
                  <div className="process-step-badge">
                    Vị trí #{idx + 1}
                  </div>

                  <div className="process-step-main">
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {st.title}
                    </div>
                    {st.desc && (
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {st.desc}
                      </div>
                    )}
                    {st.dangerNote && (
                      <div className="process-step-danger-note">
                        <AlertTriangle size={13} /> {st.dangerNote}
                      </div>
                    )}
                  </div>

                  {!isSubmitted ? (
                    <div className="process-step-controls">
                      <button 
                        type="button" 
                        className="process-ctrl-btn" 
                        onClick={() => handleMovePlayStep(idx, 'up')}
                        disabled={idx === 0}
                        title="Đẩy lên trước"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button 
                        type="button" 
                        className="process-ctrl-btn" 
                        onClick={() => handleMovePlayStep(idx, 'down')}
                        disabled={idx === shuffledSteps.length - 1}
                        title="Đẩy xuống dưới"
                      >
                        <ArrowDown size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="process-step-result">
                      {isCorrect ? (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
                          <CheckCircle2 size={18} /> Chính xác
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
                          <ShieldAlert size={18} /> Vị trí đúng: Bước {st.order}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="process-play-footer">
            <button type="button" className="btn btn-outline btn-sm" onClick={handleResetPlay}>
              <RotateCcw size={14} /> Xáo trộn lại
            </button>

            {isSubmitted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: score >= 80 ? '#10b981' : '#f59e0b' }}>
                  Điểm số: {score} / 100 điểm
                </span>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleResetPlay}>
                  Làm lại bài này
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleCheckOrder}>
                <Check size={16} /> Kiểm Tra Trình Tự & Chấm Điểm
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mode EDITOR: Thầy cô sửa nội dung */}
      {mode === 'editor' && (
        <div className="process-editor-grid animate-fade-in">
          <div className="process-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Danh Sách Các Bước Chuẩn ({steps.length} bước)
              </h3>
              <button type="button" className="btn btn-primary btn-xs" onClick={handleAddStep}>
                <Plus size={13} /> Thêm bước mới
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="compare-label">Tên quy trình / Bài thực hành</label>
                <input 
                  type="text" 
                  className="bs-input" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                />
              </div>

              <div>
                <label className="compare-label">Yêu cầu & Hướng dẫn sinh viên</label>
                <textarea 
                  className="bs-textarea" 
                  rows={2} 
                  value={desc} 
                  onChange={(e) => setDesc(e.target.value)} 
                />
              </div>
            </div>

            <div className="process-editor-steps-list">
              {steps.map((st, idx) => (
                <div key={st.id} className="process-edit-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)' }}>
                      Thứ tự chuẩn #{idx + 1}
                    </span>
                    {steps.length > 2 && (
                      <button 
                        type="button" 
                        className="btn btn-outline btn-xs" 
                        style={{ color: 'var(--danger)', border: 'none' }}
                        onClick={() => handleDeleteStep(st.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <input 
                    type="text" 
                    className="bs-input" 
                    value={st.title} 
                    placeholder="Tên bước..."
                    onChange={(e) => handleUpdateStep(st.id, { title: e.target.value })} 
                  />

                  <textarea 
                    className="bs-textarea" 
                    rows={2}
                    value={st.desc} 
                    placeholder="Mô tả kỹ thuật..."
                    onChange={(e) => handleUpdateStep(st.id, { desc: e.target.value })} 
                  />

                  <input 
                    type="text" 
                    className="bs-input" 
                    value={st.dangerNote || ''} 
                    placeholder="Cảnh báo an toàn / Lưu ý nguy hiểm (nếu có)..."
                    onChange={(e) => handleUpdateStep(st.id, { dangerNote: e.target.value })} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Iframe */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Code size={18} color="var(--primary)" /> Mã Nhúng LMS Cho Bài Tập Quy Trình</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowExportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Sao chép mã nhúng bên dưới để đưa bài tập sắp xếp quy trình SOP vào Canvas, Moodle hoặc Google Sites. Sinh viên có thể bấm di chuyển các bước và xem điểm số trực tiếp!
              </p>
              <div className="export-result-box">
                <div className="export-result-header">
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Mã HTML Iframe độc lập tự chấm điểm</span>
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

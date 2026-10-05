import { useState } from 'react';
import { 
  GitFork, 
  Plus, 
  Trash2, 
  Download, 
  Code, 
  Copy, 
  Check, 
  Play, 
  Edit3, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  Trophy, 
  AlertCircle 
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './BranchingScenario.css';

export interface ScenarioOption {
  id: string;
  text: string;
  targetNodeId: string;
  feedback?: string;
  score?: number;
}

export interface ScenarioNode {
  id: string;
  title: string;
  story: string;
  imageUrl?: string;
  isEnd?: boolean;
  endType?: 'success' | 'failure' | 'neutral';
  options: ScenarioOption[];
}

export default function BranchingScenario() {
  const { showToast } = useNotification();

  // Kịch bản mẫu: Tình huống giải quyết tranh chấp trong giờ học
  const [nodes, setNodes] = useState<ScenarioNode[]>([
    {
      id: 'start',
      title: 'Tình huống 1: Hai học sinh to tiếng trong giờ thảo luận',
      story: 'Trong lúc cả lớp đang làm việc nhóm, bạn An và bạn Bình bất ngờ tranh cãi gay gắt về việc ai là người trình bày slide. Bình tức giận đập bàn và từ chối tiếp tục làm việc. Bạn sẽ xử lý thế nào?',
      imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1000&q=80',
      isEnd: false,
      options: [
        {
          id: 'opt-1-1',
          text: 'Phương án A: Quát lớn yêu cầu cả hai trật tự ngay lập tức và dọa trừ điểm hạnh kiểm.',
          targetNodeId: 'node-escalate',
          feedback: 'Hành động này làm căng thẳng leo thang và khiến học sinh cảm thấy bị áp đặt, không giải quyết được gốc rễ vấn đề.',
          score: -5
        },
        {
          id: 'opt-1-2',
          text: 'Phương án B: Nhẹ nhàng bước tới, tạm thời tách hai bạn ra và đề nghị lắng nghe lý do từ từng bạn.',
          targetNodeId: 'node-listen',
          feedback: 'Rất chuẩn xác! Sự bình tĩnh của giáo viên giúp hạ nhiệt cảm xúc và tạo không gian an toàn cho đối thoại.',
          score: 10
        }
      ]
    },
    {
      id: 'node-escalate',
      title: 'Hệ quả: Căng thẳng leo thang',
      story: 'Bình cảm thấy bất công và bức xúc bỏ ra khỏi lớp học. Giờ học bị gián đoạn và không khí lớp học trở nên ngột ngạt.',
      imageUrl: 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?auto=format&fit=crop&w=1000&q=80',
      isEnd: true,
      endType: 'failure',
      options: []
    },
    {
      id: 'node-listen',
      title: 'Tình huống 2: Tìm tiếng nói chung cho nhóm',
      story: 'Khi lắng nghe, bạn phát hiện An đã chuẩn bị nội dung rất kỹ, còn Bình là người thiết kế slide chính. Cả hai đều muốn đóng góp cho nhóm nhưng thiếu sự phân công rõ ràng. Bước tiếp theo bạn chọn là gì?',
      imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80',
      isEnd: false,
      options: [
        {
          id: 'opt-2-1',
          text: 'Gợi ý chia đôi phần thuyết trình: An mở đầu & nội dung, Bình kết luận & phản biện Q&A.',
          targetNodeId: 'node-success',
          feedback: 'Tuyệt vời! Giải pháp win-win tôn trọng công sức của cả hai bạn và rèn luyện kỹ năng làm việc nhóm thực tế.',
          score: 15
        },
        {
          id: 'opt-2-2',
          text: 'Quyết định bốc thăm ngẫu nhiên để chọn ra một bạn duy nhất trình bày.',
          targetNodeId: 'node-neutral',
          feedback: 'Bốc thăm giải quyết được tranh chấp tạm thời nhưng chưa phát huy tối đa tinh thần hợp tác của cả nhóm.',
          score: 5
        }
      ]
    },
    {
      id: 'node-success',
      title: 'Kết quả: Nhóm thuyết trình xuất sắc!',
      story: 'Cả An và Bình đều hoàn thành phần việc của mình một cách tự tin. Cả lớp dành tràng pháo tay lớn, hai bạn vui vẻ bắt tay làm hòa và đạt điểm tối đa!',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
      isEnd: true,
      endType: 'success',
      options: []
    },
    {
      id: 'node-neutral',
      title: 'Kết quả: Bài học kết thúc an toàn',
      story: 'Nhóm hoàn thành bài thuyết trình đúng hạn, tuy nhiên không khí giữa các thành viên vẫn còn chút gượng gạo. Bạn cần thêm thời gian để gắn kết nhóm sau giờ học.',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80',
      isEnd: true,
      endType: 'neutral',
      options: []
    }
  ]);

  const [mode, setMode] = useState<'editor' | 'simulator'>('simulator');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('start');

  // Trạng thái khi người học trải nghiệm trong Simulator
  const [currentNodeId, setCurrentNodeId] = useState<string>('start');
  const [historyLog, setHistoryLog] = useState<{
    nodeTitle: string;
    chosenText: string;
    feedback?: string;
    score: number;
  }[]>([]);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  // Modal export
  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];
  const currentNode = nodes.find(n => n.id === currentNodeId) || nodes[0];

  // Xử lý khi người học chọn 1 phương án trong Simulator
  const handleSelectOption = (opt: ScenarioOption) => {
    const nextScore = currentScore + (opt.score || 0);
    setCurrentScore(nextScore);
    setLastFeedback(opt.feedback || null);

    setHistoryLog(prev => [
      ...prev,
      {
        nodeTitle: currentNode.title,
        chosenText: opt.text,
        feedback: opt.feedback,
        score: opt.score || 0
      }
    ]);

    setCurrentNodeId(opt.targetNodeId);
  };

  // Khởi động lại simulator
  const handleRestartSimulator = () => {
    setCurrentNodeId('start');
    setCurrentScore(0);
    setHistoryLog([]);
    setLastFeedback(null);
  };

  // Thêm Node mới
  const handleAddNode = () => {
    const newId = `node-${Date.now()}`;
    const newNode: ScenarioNode = {
      id: newId,
      title: `Nút tình huống #${nodes.length + 1}`,
      story: 'Nhập nội dung câu chuyện / bối cảnh tình huống tại đây...',
      imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1000&q=80',
      isEnd: false,
      options: [
        {
          id: `opt-${Date.now()}-1`,
          text: 'Lựa chọn 1...',
          targetNodeId: 'start',
          score: 5
        }
      ]
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newId);
    showToast('Đã thêm nút tình huống mới!', 'success');
  };

  // Cập nhật node đang chọn
  const handleUpdateNode = (updated: Partial<ScenarioNode>) => {
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, ...updated } : n));
  };

  // Xóa node
  const handleDeleteNode = (id: string) => {
    if (id === 'start') {
      showToast('Không thể xóa nút khởi đầu (start)!', 'warning');
      return;
    }
    setNodes(prev => prev.filter(n => n.id !== id));
    setSelectedNodeId('start');
    showToast('Đã xóa nút tình huống.', 'info');
  };

  // Thêm phương án lựa chọn cho node đang chọn
  const handleAddOption = () => {
    const newOpt: ScenarioOption = {
      id: `opt-${Date.now()}`,
      text: 'Lựa chọn phương án mới...',
      targetNodeId: nodes.find(n => n.id !== selectedNodeId)?.id || 'start',
      score: 5,
      feedback: 'Giải thích tác động của lựa chọn này...'
    };
    handleUpdateNode({
      options: [...(selectedNode.options || []), newOpt]
    });
  };

  // Cập nhật phương án
  const handleUpdateOption = (optId: string, updated: Partial<ScenarioOption>) => {
    const newOpts = (selectedNode.options || []).map(o => o.id === optId ? { ...o, ...updated } : o);
    handleUpdateNode({ options: newOpts });
  };

  // Xóa phương án
  const handleDeleteOption = (optId: string) => {
    const newOpts = (selectedNode.options || []).filter(o => o.id !== optId);
    handleUpdateNode({ options: newOpts });
  };

  // Tạo file HTML độc lập cho LMS
  const generateStandaloneHtml = () => {
    const nodesJson = JSON.stringify(nodes);
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mô Phỏng Tình Huống Phân Nhánh (Branching Scenario)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; margin: 0; }
    .wrapper { width: 100%; max-width: 860px; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 45px rgba(0,0,0,0.6); border: 1px solid #334155; position: relative; }
    
    .sim-hero { position: relative; width: 100%; height: 260px; background: #020617; }
    .sim-hero img { width: 100%; height: 100%; object-fit: cover; opacity: 0.85; }
    .sim-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15, 23, 42, 0.1) 0%, rgba(15, 23, 42, 0.95) 100%); display: flex; flex-direction: column; justify-content: flex-end; padding: 20px; }
    .sim-badge { background: #8b5cf6; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; width: fit-content; margin-bottom: 8px; }
    .sim-title { font-size: 20px; font-weight: 700; color: #ffffff; line-height: 1.3; }
    
    .sim-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .sim-story { font-size: 16px; line-height: 1.65; color: #e2e8f0; background: #0f172a; padding: 18px 20px; border-radius: 12px; border: 1px solid #334155; white-space: pre-line; }
    
    .options-list { display: flex; flex-direction: column; gap: 12px; }
    .btn-opt { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: #0f172a; border: 1.5px solid #334155; border-radius: 10px; color: #f8fafc; font-size: 15px; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.2s; }
    .btn-opt:hover { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.15); transform: translateX(4px); }
    
    .feedback-box { padding: 14px 18px; border-radius: 10px; background: rgba(59, 130, 246, 0.12); border: 1px solid #3b82f6; color: #93c5fd; font-size: 14.5px; line-height: 1.5; display: none; }
    
    .end-screen { text-align: center; padding: 30px 20px; display: none; flex-direction: column; align-items: center; gap: 16px; }
    .trophy-icon { font-size: 54px; }
    .btn-restart { padding: 10px 24px; background: #8b5cf6; border: none; border-radius: 8px; color: #fff; font-weight: 700; font-size: 15px; cursor: pointer; }
    .btn-restart:hover { background: #7c3aed; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="sim-hero">
      <img id="sim-img" src="" alt="Scene">
      <div class="sim-overlay">
        <div id="sim-badge" class="sim-badge">TÌNH HUỐNG THỰC TẾ</div>
        <div id="sim-title" class="sim-title"></div>
      </div>
    </div>
    
    <div class="sim-body">
      <div id="sim-story" class="sim-story"></div>
      <div id="feedback-box" class="feedback-box"></div>
      <div id="options-list" class="options-list"></div>
      
      <div id="end-screen" class="end-screen">
        <div class="trophy-icon">🏆</div>
        <h2 id="end-title" style="color: #38bdf8;">Hoàn thành tình huống!</h2>
        <p id="end-desc" style="color: #cbd5e1; max-width: 500px; line-height: 1.6;"></p>
        <button class="btn-restart" onclick="restart()">Thử lại từ đầu</button>
      </div>
    </div>
  </div>

  <script>
    const NODES = ${nodesJson};
    let currentId = 'start';
    let score = 0;

    const imgEl = document.getElementById('sim-img');
    const titleEl = document.getElementById('sim-title');
    const storyEl = document.getElementById('sim-story');
    const optList = document.getElementById('options-list');
    const feedbackBox = document.getElementById('feedback-box');
    const endScreen = document.getElementById('end-screen');
    const endTitle = document.getElementById('end-title');
    const endDesc = document.getElementById('end-desc');

    function renderNode(nodeId) {
      const node = NODES.find(n => n.id === nodeId) || NODES[0];
      currentId = node.id;

      if (node.imageUrl) {
        imgEl.src = node.imageUrl;
        imgEl.style.display = 'block';
      } else {
        imgEl.style.display = 'none';
      }

      titleEl.innerText = node.title;
      storyEl.innerText = node.story;

      if (node.isEnd) {
        optList.style.display = 'none';
        endScreen.style.display = 'flex';
        endTitle.innerText = node.endType === 'success' ? '🎉 Xuất Sắc!' : (node.endType === 'failure' ? '⚠️ Chưa Tối Ưu!' : 'Đã Hoàn Thành');
        endDesc.innerText = 'Tổng điểm tích lũy: ' + score + ' điểm. Bạn đã đưa ra các quyết định xử lý tình huống thực tế.';
      } else {
        optList.style.display = 'flex';
        endScreen.style.display = 'none';
        optList.innerHTML = '';

        (node.options || []).forEach(opt => {
          const btn = document.createElement('button');
          btn.className = 'btn-opt';
          btn.innerHTML = '<span>' + opt.text + '</span> <span>→</span>';
          btn.onclick = function() {
            score += (opt.score || 0);
            if (opt.feedback) {
              feedbackBox.style.display = 'block';
              feedbackBox.innerText = '💡 Nhận xét: ' + opt.feedback;
            } else {
              feedbackBox.style.display = 'none';
            }
            renderNode(opt.targetNodeId);
          };
          optList.appendChild(btn);
        });
      }
    }

    function restart() {
      score = 0;
      feedbackBox.style.display = 'none';
      renderNode('start');
    }

    renderNode('start');
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
    a.download = `tinh-huong-phan-nhanh-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file HTML Tình Huống Phân Nhánh!', 'success');
  };

  const generateIframeCode = () => {
    const html = generateStandaloneHtml();
    const utf8Bytes = new TextEncoder().encode(html);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 = btoa(binary);

    return `<!-- MA NHUNG TINH HUONG PHAN NHANH CHO LMS / E-LEARNING -->
<div style="position:relative;width:100%;max-width:880px;margin:15px auto;padding-top:72%;background:#0f172a;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.35);">
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
    <div className="scenario-container animate-fade-in">
      <header className="bs-header">
        <div className="bs-title-group">
          <div className="bs-icon">
            <GitFork size={26} />
          </div>
          <div>
            <h1 className="bs-title">Mô Phỏng Tình Huống Phân Nhánh (Branching Scenario)</h1>
            <p className="bs-subtitle">
              Thiết kế kịch bản học tập theo cây quyết định, đưa người học vào tình huống thực tế và rèn luyện kỹ năng giải quyết vấn đề.
            </p>
          </div>
        </div>

        <div className="bs-header-actions">
          <div className="bs-mode-tabs">
            <button 
              type="button" 
              className={`bs-tab-btn ${mode === 'simulator' ? 'active' : ''}`}
              onClick={() => { setMode('simulator'); handleRestartSimulator(); }}
            >
              <Play size={15} /> Người học thử nghiệm
            </button>
            <button 
              type="button" 
              className={`bs-tab-btn ${mode === 'editor' ? 'active' : ''}`}
              onClick={() => setMode('editor')}
            >
              <Edit3 size={15} /> Soạn kịch bản
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

      {/* Chế độ Simulator (Người học trải nghiệm) */}
      {mode === 'simulator' && (
        <div className="bs-simulator-wrap animate-fade-in">
          <div className="bs-sim-hero">
            {currentNode.imageUrl ? (
              <img src={currentNode.imageUrl} alt="Scene" className="bs-sim-img" />
            ) : null}
            <div className="bs-sim-overlay">
              <span className="bs-sim-badge">
                <Sparkles size={13} /> {currentNode.isEnd ? 'KẾT THÚC KỊCH BẢN' : 'TÌNH HUỐNG THỰC TẾ'}
              </span>
              <h2 className="bs-sim-node-title">{currentNode.title}</h2>
            </div>
          </div>

          <div className="bs-sim-content">
            <div className="bs-sim-story">
              {currentNode.story}
            </div>

            {lastFeedback && (
              <div className="bs-feedback-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <AlertCircle size={16} /> Nhận xét phản hồi:
                </div>
                <div>{lastFeedback}</div>
              </div>
            )}

            {!currentNode.isEnd ? (
              <div>
                <h4 className="bs-label" style={{ marginBottom: '0.75rem' }}>
                  👉 Bạn sẽ quyết định xử lý như thế nào?
                </h4>
                <div className="bs-sim-options-list">
                  {currentNode.options.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      className="bs-sim-opt-btn"
                      onClick={() => handleSelectOption(opt)}
                    >
                      <span>{opt.text}</span>
                      <ArrowRight size={18} color="var(--primary)" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bs-end-screen animate-fade-in">
                <div 
                  className="bs-end-trophy"
                  style={{
                    background: currentNode.endType === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: currentNode.endType === 'success' ? '#10b981' : '#ef4444'
                  }}
                >
                  {currentNode.endType === 'success' ? <Trophy size={38} /> : <AlertCircle size={38} />}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                  {currentNode.endType === 'success' ? 'Chúc mừng! Bạn đã giải quyết xuất sắc' : 'Bài học chưa đạt hiệu quả tối ưu'}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.5 }}>
                  Điểm số tích lũy: <strong>{currentScore} điểm</strong> qua {historyLog.length} bước ra quyết định.
                </p>
                <button type="button" className="btn btn-primary" onClick={handleRestartSimulator}>
                  <RotateCcw size={15} /> Thử lại với phương án khác
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chế độ Editor (Soạn kịch bản) */}
      {mode === 'editor' && (
        <div className="bs-layout-grid animate-fade-in">
          {/* Cột trái: Danh sách các nút tình huống */}
          <div className="bs-panel">
            <div className="bs-panel-header">
              <h3 className="bs-label" style={{ fontSize: '1.05rem', margin: 0 }}>
                Cây tình huống ({nodes.length})
              </h3>
              <button type="button" className="btn btn-outline btn-xs" onClick={handleAddNode}>
                <Plus size={13} /> Thêm nút
              </button>
            </div>

            <div className="bs-nodes-list">
              {nodes.map(n => (
                <div 
                  key={n.id}
                  className={`bs-node-item ${selectedNodeId === n.id ? 'active' : ''}`}
                  onClick={() => setSelectedNodeId(n.id)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      ID: {n.id} • {n.isEnd ? 'Điểm kết thúc' : `${n.options.length} lựa chọn`}
                    </div>
                  </div>
                  <span className={`bs-node-tag ${n.id === 'start' ? 'bs-tag-start' : (n.isEnd ? 'bs-tag-end' : 'bs-tag-branch')}`}>
                    {n.id === 'start' ? 'Bắt đầu' : (n.isEnd ? 'Kết thúc' : 'Nhánh')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Biên tập chi tiết node đang chọn */}
          <div className="bs-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={18} color="var(--primary)" /> Chỉnh sửa: {selectedNode.title}
              </h3>
              {selectedNode.id !== 'start' && (
                <button 
                  type="button" 
                  className="btn btn-outline btn-xs" 
                  style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}
                  onClick={() => handleDeleteNode(selectedNode.id)}
                >
                  <Trash2 size={13} /> Xóa nút
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="bs-label">Tiêu đề tình huống</label>
                <input 
                  type="text" 
                  className="bs-input" 
                  value={selectedNode.title}
                  onChange={(e) => handleUpdateNode({ title: e.target.value })}
                />
              </div>

              <div>
                <label className="bs-label">Nội dung câu chuyện / Bối cảnh</label>
                <textarea 
                  className="bs-textarea" 
                  rows={4}
                  value={selectedNode.story}
                  onChange={(e) => handleUpdateNode({ story: e.target.value })}
                />
              </div>

              <div>
                <label className="bs-label">Link ảnh minh họa (URL)</label>
                <input 
                  type="text" 
                  className="bs-input" 
                  value={selectedNode.imageUrl || ''}
                  placeholder="https://..."
                  onChange={(e) => handleUpdateNode({ imageUrl: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <input 
                    type="checkbox" 
                    checked={!!selectedNode.isEnd}
                    onChange={(e) => handleUpdateNode({ isEnd: e.target.checked })}
                  />
                  Đặt đây là nút kết thúc kịch bản
                </label>

                {selectedNode.isEnd && (
                  <select 
                    className="bs-select"
                    style={{ width: 'auto' }}
                    value={selectedNode.endType || 'success'}
                    onChange={(e) => handleUpdateNode({ endType: e.target.value as any })}
                  >
                    <option value="success">Kết thúc thành công (Tốt)</option>
                    <option value="failure">Kết thúc thất bại (Cần rút kinh nghiệm)</option>
                    <option value="neutral">Kết thúc trung tính</option>
                  </select>
                )}
              </div>

              {/* Danh sách lựa chọn của node */}
              {!selectedNode.isEnd && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label className="bs-label" style={{ margin: 0 }}>
                      Các phương án lựa chọn ({selectedNode.options.length})
                    </label>
                    <button type="button" className="btn btn-outline btn-xs" onClick={handleAddOption}>
                      <Plus size={13} /> Thêm phương án
                    </button>
                  </div>

                  {selectedNode.options.map((opt, idx) => (
                    <div key={opt.id} className="bs-opt-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                          Phương án #{idx + 1}
                        </span>
                        <button 
                          type="button" 
                          className="btn btn-outline btn-xs" 
                          style={{ color: 'var(--danger)', border: 'none', padding: '2px' }}
                          onClick={() => handleDeleteOption(opt.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <input 
                        type="text" 
                        className="bs-input" 
                        value={opt.text}
                        placeholder="Nội dung người học chọn..."
                        onChange={(e) => handleUpdateOption(opt.id, { text: e.target.value })}
                      />

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.5rem' }}>
                        <div>
                          <label className="bs-label" style={{ fontSize: '0.78rem' }}>Chuyển tới nút:</label>
                          <select 
                            className="bs-select"
                            value={opt.targetNodeId}
                            onChange={(e) => handleUpdateOption(opt.id, { targetNodeId: e.target.value })}
                          >
                            {nodes.map(n => (
                              <option key={n.id} value={n.id}>{n.title} ({n.id})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="bs-label" style={{ fontSize: '0.78rem' }}>Điểm cộng/trừ:</label>
                          <input 
                            type="number" 
                            className="bs-input" 
                            value={opt.score ?? 0}
                            onChange={(e) => handleUpdateOption(opt.id, { score: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      <input 
                        type="text" 
                        className="bs-input" 
                        value={opt.feedback || ''}
                        placeholder="Lời nhận xét khi học sinh chọn cách này..."
                        onChange={(e) => handleUpdateOption(opt.id, { feedback: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Lấy mã nhúng Iframe */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Code size={18} color="var(--primary)" /> Mã Nhúng LMS Cho Tình Huống Phân Nhánh</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowExportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Sao chép đoạn mã bên dưới để nhúng kịch bản mô phỏng tương tác này vào LMS của trường bạn (Canvas, Moodle, Blackboard, Google Sites...). Người học có thể tương tác và ra quyết định trực tiếp trên bài giảng!
              </p>
              <div className="export-result-box">
                <div className="export-result-header">
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Mã HTML Iframe độc lập (Tự chuyển kịch bản & tính điểm)</span>
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

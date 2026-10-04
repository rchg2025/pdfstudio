import { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Wand2, 
  Loader2 
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './WorksheetMaker.css';

export default function WorksheetMaker() {
  const { showToast } = useNotification();

  const [topic, setTopic] = useState('Định dạng văn bản & Soạn thảo Microsoft Word');
  const [grade] = useState('Cao đẳng / Đại học');
  const [schoolName, setSchoolName] = useState('TRƯỜNG CAO ĐẲNG BÁCH KHOA NAM SÀI GÒN');
  const [worksheetTitle, setWorksheetTitle] = useState('PHIẾU BÀI TẬP THỰC HÀNH SỐ 01');
  const [timeLimit, setTimeLimit] = useState('45 phút');

  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState<any[]>([
    {
      title: 'PHẦN I: TRẮC NGHIỆM KHÁCH QUAN (4.0 ĐIỂM)',
      questions: [
        {
          id: 'q1',
          content: 'Phím tắt nào được sử dụng để căn lề giữa (Center Align) trong Microsoft Word?',
          options: ['A. Ctrl + L', 'B. Ctrl + E', 'C. Ctrl + R', 'D. Ctrl + J']
        },
        {
          id: 'q2',
          content: 'Để ngắt trang mới ngay lập tức tại vị trí con trỏ chuột, ta nhấn tổ hợp phím nào?',
          options: ['A. Shift + Enter', 'B. Ctrl + Enter', 'C. Alt + Enter', 'D. Ctrl + Shift + Enter']
        }
      ]
    },
    {
      title: 'PHẦN II: THỰC HÀNH TỰ LUẬN (6.0 ĐIỂM)',
      tasks: [
        'Câu 1 (3.0đ): Trình bày các bước tạo bảng gồm 4 cột, 6 dòng và định dạng viền ngoài màu xanh lam đậm.',
        'Câu 2 (3.0đ): Nêu cú pháp và quy tắc chia cột văn bản (Columns) khi văn bản có tiêu đề lớn ở trên cùng.'
      ]
    }
  ]);

  // In ấn phiếu bài tập trực tiếp (Khổ A4 chuẩn)
  const handlePrint = () => {
    window.print();
  };

  // AI Tạo Phiếu học tập tự động
  const handleAiGenerate = async () => {
    if (!topic.trim()) {
      showToast('Vui lòng nhập chủ đề bài học!', 'warning');
      return;
    }
    setIsGenerating(true);
    try {
      const prompt = `Bạn là giảng viên sư phạm xuất sắc. Hãy thiết kế một PHIẾU BÀI TẬP HỌC TẬP (Worksheet) hoàn chỉnh cho chủ đề: "${topic.trim()}", đối tượng: "${grade}".
Gồm 2 phần:
Phần 1: 4 câu trắc nghiệm (mỗi câu 4 lựa chọn A, B, C, D).
Phần 2: 2 câu hỏi thực hành / bài tập tự luận có kẻ dòng chấm chấm để sinh viên làm bài.
BẮT BUỘC trả về đúng cấu trúc JSON sau (không markdown \`\`\`json):
{
  "title": "Tên phiếu học tập",
  "sections": [
    {
      "title": "PHẦN I: TRẮC NGHIỆM KHÁCH QUAN",
      "questions": [
        { "id": "1", "content": "Nội dung câu hỏi 1?", "options": ["A. ...", "B. ...", "C. ...", "D. ..."] }
      ]
    },
    {
      "title": "PHẦN II: TỰ LUẬN & THỰC HÀNH",
      "tasks": [
        "Câu 1: Yêu cầu bài tập 1...",
        "Câu 2: Yêu cầu bài tập 2..."
      ]
    }
  ]
}`;
      const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?json=true`);
      if (!res.ok) throw new Error('Máy chủ AI không phản hồi');
      const text = await res.text();
      let data: any = null;
      try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        data = JSON.parse(cleaned);
      } catch (err) {
        const m = text.match(/\{[\s\S]*\}/);
        if (m) data = JSON.parse(m[0]);
      }

      if (data && data.sections) {
        if (data.title) setWorksheetTitle(data.title.toUpperCase());
        setSections(data.sections);
        showToast('AI đã tạo phiếu học tập thành công!', 'success');
      } else {
        throw new Error('Dữ liệu không khớp');
      }
    } catch (e) {
      console.error(e);
      showToast('Tạo tự động không thành công. Hãy thử lại với chủ đề ngắn gọn hơn.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="worksheet-container animate-fade-in">
      {/* Non-printable Editor Header & Settings */}
      <div className="no-print">
        <header className="ws-header">
          <div className="ws-title-group">
            <div className="ws-icon">
              <FileText size={26} />
            </div>
            <div>
              <h1 className="ws-title">Tạo Phiếu Học Tập & Đề Thi A4 (AI Worksheet)</h1>
              <p className="ws-subtitle">
                Tự động tạo ma trận bài tập, trắc nghiệm và tự luận chuẩn A4 có phần chấm điểm, lời phê để in trực tiếp hoặc lưu PDF.
              </p>
            </div>
          </div>

          <div className="ws-header-actions">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={handlePrint}
            >
              <Printer size={16} /> In Phiếu / Lưu PDF (A4)
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              disabled={isGenerating}
              onClick={handleAiGenerate}
              style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none' }}
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {isGenerating ? 'AI đang thiết kế...' : 'AI Tạo Đề Mới'}
            </button>
          </div>
        </header>

        {/* Input Settings Card */}
        <div className="ws-settings-card">
          <div className="ws-form-grid">
            <div className="form-group">
              <label>Tên Trường / Khoa / Đơn vị</label>
              <input 
                type="text" 
                className="inter-input" 
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Tiêu đề phiếu bài tập</label>
              <input 
                type="text" 
                className="inter-input" 
                value={worksheetTitle}
                onChange={(e) => setWorksheetTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Chủ đề kiến thức cần tạo bài tập</label>
              <input 
                type="text" 
                className="inter-input" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Lập trình Python, Giải tích, An toàn lao động..."
              />
            </div>
            <div className="form-group">
              <label>Thời lượng làm bài</label>
              <input 
                type="text" 
                className="inter-input" 
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable A4 Sheet */}
      <div className="ws-a4-sheet">
        {/* Header School & Student info */}
        <div className="a4-header">
          <div className="a4-school-col">
            <p className="school-name">{schoolName}</p>
            <p className="sub-dept">KHOA CÔNG NGHỆ THÔNG TIN</p>
            <div className="divider-line"></div>
          </div>
          <div className="a4-exam-col">
            <p className="exam-flag">HỌC KỲ I - NĂM HỌC 2026 - 2027</p>
            <p className="time-badge">Thời gian làm bài: {timeLimit}</p>
          </div>
        </div>

        <h2 className="a4-main-title">{worksheetTitle}</h2>
        <p className="a4-topic-line">Chuyên đề: <strong>{topic}</strong></p>

        {/* Student Meta Table */}
        <table className="a4-student-table">
          <tbody>
            <tr>
              <td style={{ width: '60%' }}>Họ và tên: .....................................................................</td>
              <td style={{ width: '40%' }}>Lớp: ......................... Mã SV: ....................</td>
            </tr>
            <tr>
              <td>Ngày làm bài: ...... / ...... / 2026</td>
              <td>Phòng thi / Ca học: .......................................</td>
            </tr>
          </tbody>
        </table>

        {/* Score & Teacher Note Box */}
        <div className="a4-grading-box">
          <div className="score-col">
            <div className="score-header">ĐIỂM SỐ</div>
            <div className="score-body"></div>
          </div>
          <div className="comment-col">
            <div className="comment-header">LỜI PHÊ & CHỮ KÝ CỦA GIẢNG VIÊN</div>
            <div className="comment-body"></div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="a4-content">
          {sections.map((sec, sIdx) => (
            <div key={sIdx} className="a4-section">
              <h3 className="a4-section-title">{sec.title}</h3>
              
              {/* Multiple Choice Questions */}
              {sec.questions && sec.questions.length > 0 && (
                <div className="a4-questions-list">
                  {sec.questions.map((q: any, qIdx: number) => (
                    <div key={q.id || qIdx} className="a4-q-item">
                      <p className="a4-q-text">
                        <strong>Câu {qIdx + 1}: </strong>{q.content}
                      </p>
                      <div className="a4-options-grid">
                        {q.options.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className="a4-opt-item">
                            <span className="circle-checkbox"></span>
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Free-text Essay Tasks */}
              {sec.tasks && sec.tasks.length > 0 && (
                <div className="a4-tasks-list">
                  {sec.tasks.map((task: string, tIdx: number) => (
                    <div key={tIdx} className="a4-task-item">
                      <p className="a4-task-text"><strong>{task}</strong></p>
                      {/* Dotted lines for student answer */}
                      <div className="dotted-lines">
                        <div className="dot-line"></div>
                        <div className="dot-line"></div>
                        <div className="dot-line"></div>
                        <div className="dot-line"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="a4-footer">
          <span>--- HẾT (Cán bộ coi thi không giải thích gì thêm) ---</span>
        </div>
      </div>
    </div>
  );
}

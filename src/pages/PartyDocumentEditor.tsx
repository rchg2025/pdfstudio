import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Sparkles, 
  RotateCcw, 
  Printer, 
  Building2, 
  Award,
  ArrowLeft,
  Wand2,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { 
  ALL_PARTY_TEMPLATES, 
  type PartyDocumentTemplate 
} from '../data/partyTemplatesCatalog';
import { 
  type PartyDocumentFormData, 
  defaultPartyDocumentFormData, 
  getInitialTemplateContent, 
  exportPartyDocxBlob 
} from '../utils/partyGeneralEditorHelper';
import './PartyDocumentEditor.css';

export default function PartyDocumentEditor() {
  const { templateId } = useParams<{ templateId: string }>();

  // Tìm biểu mẫu trong catalog
  const currentTemplate: PartyDocumentTemplate = useMemo(() => {
    const found = ALL_PARTY_TEMPLATES.find(t => t.id === templateId);
    if (found) return found;
    return {
      id: templateId || 'bieu-mau-dang',
      title: 'VĂN BẢN / BIỂU MẪU CÔNG TÁC ĐẢNG',
      code: 'Mẫu Đảng',
      category: 'kiem-diem',
      categoryLabel: 'Công Tác Đảng',
      desc: 'Soạn thảo văn bản và biểu mẫu nghiệp vụ xây dựng Đảng trực tiếp trên Web với trợ lý AI.',
      guidance: 'Quy định Ban Bí thư & Hướng dẫn Ban Tổ chức Trung ương',
      status: 'ready'
    };
  }, [templateId]);

  const storageKey = `rchg_party_doc_draft_${currentTemplate.id}`;

  const [formData, setFormData] = useState<PartyDocumentFormData>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu lưu nháp biểu mẫu Đảng:', e);
    }
    return {
      ...defaultPartyDocumentFormData,
      tieuDeVanBan: currentTemplate.title,
      canCuVanBan: currentTemplate.guidance || 'Theo quy định của Đảng Cộng sản Việt Nam',
      noiDungChinh: getInitialTemplateContent(currentTemplate)
    };
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');

  // Tự động lưu nháp
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    } catch (e) {
      console.warn('Lỗi ghi dữ liệu nháp:', e);
    }
  }, [formData, storageKey]);

  // Cập nhật khi đổi templateId
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setFormData(JSON.parse(saved));
      } else {
        setFormData({
          ...defaultPartyDocumentFormData,
          tieuDeVanBan: currentTemplate.title,
          canCuVanBan: currentTemplate.guidance || '',
          noiDungChinh: getInitialTemplateContent(currentTemplate)
        });
      }
    } catch (e) {
      console.warn('Lỗi chuyển template:', e);
    }
  }, [currentTemplate, storageKey]);

  const handleChange = (field: keyof PartyDocumentFormData, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại nội dung mẫu ban đầu?')) {
      const initData: PartyDocumentFormData = {
        ...defaultPartyDocumentFormData,
        tieuDeVanBan: currentTemplate.title,
        canCuVanBan: currentTemplate.guidance || '',
        noiDungChinh: getInitialTemplateContent(currentTemplate)
      };
      setFormData(initData);
      localStorage.removeItem(storageKey);
    }
  };

  const handleDownloadDoc = () => {
    exportPartyDocxBlob(formData, currentTemplate.title, currentTemplate.code);
  };

  const handlePrint = () => {
    window.print();
  };

  // Trợ lý AI soạn thảo / chuẩn hóa nội dung văn bản
  const handleAiGenerate = async () => {
    setIsAiGenerating(true);
    setAiSuccessMsg('');
    try {
      const promptInstruction = `
Bạn là chuyên gia thư ký xây dựng Đảng giàu kinh nghiệm và uyên thâm về lý luận, nghiệp vụ công tác Đảng. Hãy soạn thảo chi tiết, toàn diện, dài dặn và mẫu mực toàn bộ nội dung văn bản cho biểu mẫu Đảng sau:
Tên biểu mẫu: "${formData.tieuDeVanBan || currentTemplate.title}"
Mã số/Căn cứ: "${currentTemplate.code || ''}" (${formData.canCuVanBan || 'Quy định Đảng'})
Thông tin người lập/cơ quan: Đồng chí ${formData.hoVaTen || 'cán bộ, đảng viên'}, Chức danh: ${formData.chucVuChinhQuyen || 'Giảng viên/Chuyên viên'}, Đơn vị: ${formData.donViCongTac || 'Trường Cao đẳng Bách khoa Nam Sài Gòn'}, Chi bộ: ${formData.chiBo}.

YÊU CẦU ĐẶC BIỆT VỀ CHẤT LƯỢNG VĂN BẢN VÀ NGÔN PHONG:
1. Độ dài và tính hệ thống: Viết dài hơn, bố cục chặt chẽ gồm các phần (Căn cứ chính trị/pháp lý, Tình hình thực tế, Nội dung cụ thể, Đánh giá kết quả, Đề xuất kiến nghị hoặc Lời cam kết), mỗi phần có các gạch đầu dòng hoặc đánh số rõ ràng (1., 2., 3.). Tuyệt đối không viết ngắn, hời hợt.
2. Ngôn phong chính trị của Đảng: Nghiêm túc, trang trọng, lập trường tư tưởng kiên định, tuân thủ đúng Cương lĩnh, Điều lệ Đảng và thể thức văn bản của Ban Chấp hành Trung ương Đảng.
3. Nội dung hiện tại cần phát triển / nâng cao:
"""
${formData.noiDungChinh}
"""

Yêu cầu hoặc thông tin tóm tắt bổ sung từ người dùng:
"""
${aiPrompt || 'Hãy soạn thảo văn bản hoàn chỉnh, dài dặn, sâu sắc, chuẩn thể thức và nội dung theo đúng nghiệp vụ xây dựng Đảng.'}
"""

Trả về duy nhất chuỗi JSON hợp lệ không có markdown bọc ngoài: {"content": "toàn bộ nội dung văn bản hoàn chỉnh, dài dặn, chuẩn mực, có đề mục rõ ràng, các đoạn xuống dòng bằng \\n"}
      `;

      const customKey = localStorage.getItem('rchg_gemini_api_key') || '';
      const response = await fetch('/api/qa-wall?action=generate-ai-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: promptInstruction,
          count: 1,
          customApiKey: customKey || undefined
        })
      });

      const resData = await response.json();
      const rawText = resData?.questions?.[0]?.question || resData?.text || resData?.data || '';
      let cleanText = '';
      try {
        const parsed = JSON.parse(rawText.replace(/```json\s*|```/g, '').trim());
        cleanText = parsed.content || parsed.text || '';
      } catch {
        cleanText = rawText.replace(/```json\s*|```/g, '').trim();
      }

      if (cleanText) {
        handleChange('noiDungChinh', cleanText);
        setAiSuccessMsg('AI đã soạn thảo và chuẩn hoá nội dung thành công!');
        setTimeout(() => setAiSuccessMsg(''), 4000);
      }
    } catch (e) {
      console.error('Lỗi AI:', e);
      alert('Không thể kết nối trợ lý AI lúc này. Bạn vẫn có thể tự soạn thảo và gõ nội dung trực tiếp trên web.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="party-editor-page">
      {/* Header Banner */}
      <div className="party-editor-header">
        <div className="party-editor-header-left">
          <Link to="/cong-tac-dang" className="party-editor-back-link">
            <ArrowLeft size={16} /> Quay lại Danh mục Công tác Đảng
          </Link>
          <h1>
            <FileText size={24} />
            {currentTemplate.title}
          </h1>
          <p>
            {currentTemplate.desc || 'Soạn thảo trực tiếp trên Web với sự hỗ trợ của trợ lý AI và xem trước A4 trực quan.'}
          </p>
        </div>

        <div className="party-editor-header-actions">
          <button 
            type="button" 
            className="btn-editor-action ai"
            onClick={handleAiGenerate}
            disabled={isAiGenerating}
          >
            {isAiGenerating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
            <span>{isAiGenerating ? 'AI đang soạn thảo...' : 'AI Viết / Chuẩn Hóa'}</span>
          </button>
          <button 
            type="button" 
            className="btn-editor-action primary"
            onClick={handleDownloadDoc}
          >
            <Download size={16} /> Tải File Word (.doc)
          </button>
          <button 
            type="button" 
            className="btn-editor-action secondary"
            onClick={handlePrint}
          >
            <Printer size={16} /> In Văn Bản
          </button>
          <button 
            type="button" 
            className="btn-editor-action secondary"
            onClick={handleReset}
            title="Đặt lại nội dung gốc"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* 2 Cột: Form Soạn Thảo & Live Preview A4 */}
      <div className="party-editor-grid">
        {/* CỘT TRÁI: FORM SOẠN THẢO TRỰC TIẾP */}
        <div className="party-editor-form">
          {/* Card 1: Khung Thông Tin Cấp Ủy */}
          <div className="editor-card-section">
            <div className="editor-sec-badge">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={18} /> 1. Thông Tin Cấp Ủy & Ban Hành Văn Bản
              </span>
            </div>



            <div className="editor-form-row">
              <div className="editor-field">
                <label>Đảng bộ cơ sở</label>
                <input 
                  type="text" 
                  value={formData.dangBoCoSo} 
                  onChange={e => handleChange('dangBoCoSo', e.target.value)} 
                />
              </div>
              <div className="editor-field">
                <label>Chi bộ sinh hoạt / ban hành</label>
                <input 
                  type="text" 
                  value={formData.chiBo} 
                  onChange={e => handleChange('chiBo', e.target.value)} 
                />
              </div>
            </div>

            <div className="editor-form-row">
              <div className="editor-field">
                <label>Địa danh</label>
                <input 
                  type="text" 
                  value={formData.diaDanh} 
                  onChange={e => handleChange('diaDanh', e.target.value)} 
                />
              </div>
              <div className="editor-field">
                <label>Ngày tháng ban hành</label>
                <input 
                  type="text" 
                  value={formData.ngayThang} 
                  onChange={e => handleChange('ngayThang', e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Card 2: Thông tin Đảng viên / Cán bộ lập */}
          <div className="editor-card-section">
            <div className="editor-sec-badge">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} /> 2. Thông Tin Đảng Viên / Cán Bộ Lập Văn Bản
              </span>
            </div>

            <div className="editor-form-row">
              <div className="editor-field">
                <label>Họ và tên (In hoa)</label>
                <input 
                  type="text" 
                  value={formData.hoVaTen} 
                  onChange={e => handleChange('hoVaTen', e.target.value.toUpperCase())} 
                />
              </div>
              <div className="editor-field">
                <label>Ngày, tháng, năm sinh</label>
                <input 
                  type="text" 
                  value={formData.namSinh} 
                  onChange={e => handleChange('namSinh', e.target.value)} 
                />
              </div>
            </div>

            <div className="editor-form-row">
              <div className="editor-field">
                <label>Chức vụ Đảng</label>
                <input 
                  type="text" 
                  value={formData.chucVuDang} 
                  onChange={e => handleChange('chucVuDang', e.target.value)} 
                />
              </div>
              <div className="editor-field">
                <label>Chức vụ chính quyền / Chuyên môn</label>
                <input 
                  type="text" 
                  value={formData.chucVuChinhQuyen} 
                  onChange={e => handleChange('chucVuChinhQuyen', e.target.value)} 
                />
              </div>
            </div>

            <div className="editor-field">
              <label>Đơn vị công tác</label>
              <input 
                type="text" 
                value={formData.donViCongTac} 
                onChange={e => handleChange('donViCongTac', e.target.value)} 
              />
            </div>
          </div>

          {/* Card 3: Soạn Thảo Nội Dung Văn Bản (Trọng Tâm) */}
          <div className="editor-card-section">
            <div className="editor-sec-badge">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={18} /> 3. Soạn Thảo Nội Dung Chi Tiết Trên Web
              </span>
              {aiSuccessMsg && (
                <span style={{ color: '#16a34a', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={15} /> {aiSuccessMsg}
                </span>
              )}
            </div>

            {/* AI Generator Helper Tool - Phong cách Latendoc "Kể bằng lời / Gợi ý thông minh" */}
            <div className="editor-ai-box">
              <div className="editor-ai-box-head">
                <span className="editor-ai-title">
                  <Sparkles size={16} /> Trợ lý Thư ký AI (Kể bằng lời / Soạn thảo tự động)
                </span>
                <button 
                  type="button" 
                  className="btn-trigger-ai"
                  disabled={isAiGenerating}
                  onClick={handleAiGenerate}
                >
                  {isAiGenerating ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>{isAiGenerating ? 'AI đang viết văn bản...' : 'AI Điền Mẫu & Viết Lại'}</span>
                </button>
              </div>
              <p className="editor-ai-sub-desc">
                Nhập hoặc mô tả thông tin bằng lời tự nhiên (lý do, mốc thời gian, kết quả đạt được, định mức giảng dạy...). AI sẽ tự động phân tích và điền chuẩn xác vào cấu trúc văn bản.
              </p>
              <textarea 
                rows={3}
                className="editor-ai-input"
                placeholder="Ví dụ: Soạn thảo cho giảng viên Khoa CNTT hoàn thành 100% giờ giảng 2026, ứng dụng AI và LMS trong bài giảng, cam kết rèn luyện tư tưởng bám sát Nghị quyết TW 4 và Chỉ thị 05..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
              />
              <div className="editor-ai-quick-tags">
                <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>Gợi ý nhanh:</span>
                <button 
                  type="button" 
                  className="btn-ai-quick-tag"
                  onClick={() => setAiPrompt(prev => prev ? `${prev}, bám sát Nghị quyết TW 4 khóa XII, XIII` : 'Bám sát Nghị quyết TW 4 khóa XII, XIII')}
                >
                  + Nghị quyết TW 4
                </button>
                <button 
                  type="button" 
                  className="btn-ai-quick-tag"
                  onClick={() => setAiPrompt(prev => prev ? `${prev}, đẩy mạnh học tập và làm theo tư tưởng đạo đức Hồ Chí Minh theo Kết luận 01-KL/TW` : 'Đẩy mạnh học theo Bác (KL 01-KL/TW)')}
                >
                  + Học theo Bác (KL 01)
                </button>
                <button 
                  type="button" 
                  className="btn-ai-quick-tag"
                  onClick={() => setAiPrompt(prev => prev ? `${prev}, hoàn thành 100% định mức giờ giảng và NCKH năm 2026` : 'Hoàn thành 100% giờ giảng & NCKH')}
                >
                  + Đạt 100% chỉ tiêu 2026
                </button>
                <button 
                  type="button" 
                  className="btn-ai-quick-tag"
                  onClick={() => setAiPrompt(prev => prev ? `${prev}, gương mẫu nơi cư trú theo Quy định 213-QĐ/TW` : 'Gương mẫu nơi cư trú (QĐ 213)')}
                >
                  + Nơi cư trú (QĐ 213)
                </button>
                <button 
                  type="button" 
                  className="btn-ai-quick-tag"
                  onClick={() => setAiPrompt(prev => prev ? `${prev}, viết dài dặn, chi tiết, có đánh số 1., 2., 3.` : 'Viết dài dặn, có đánh số 1., 2., 3.')}
                >
                  + Viết dài & đánh số 1, 2, 3
                </button>
              </div>
            </div>

            <div className="editor-field">
              <label>Tiêu đề văn bản</label>
              <input 
                type="text" 
                value={formData.tieuDeVanBan} 
                onChange={e => handleChange('tieuDeVanBan', e.target.value)} 
              />
            </div>

            <div className="editor-field">
              <label>Căn cứ / Trích yếu văn bản (nếu có)</label>
              <input 
                type="text" 
                value={formData.canCuVanBan} 
                onChange={e => handleChange('canCuVanBan', e.target.value)} 
              />
            </div>

            <div className="editor-field">
              <div className="editor-field-head">
                <label>Nội dung văn bản (soạn thảo và chỉnh sửa trực tiếp, hỗ trợ xuống dòng nhiều đoạn):</label>
              </div>
              <textarea 
                rows={16}
                value={formData.noiDungChinh}
                onChange={e => handleChange('noiDungChinh', e.target.value)}
                placeholder="Nhập toàn bộ nội dung văn bản tại đây..."
              />
            </div>

            <div className="editor-form-row">
              <div className="editor-field">
                <label>Chức danh ký bên trái (ví dụ: T/M CHI BỘ)</label>
                <input 
                  type="text" 
                  value={formData.nguoiKyBenTrai} 
                  onChange={e => handleChange('nguoiKyBenTrai', e.target.value)} 
                />
              </div>
              <div className="editor-field">
                <label>Chức danh ký bên phải (ví dụ: NGƯỜI LẬP / ĐẢNG VIÊN)</label>
                <input 
                  type="text" 
                  value={formData.nguoiKyBenPhai} 
                  onChange={e => handleChange('nguoiKyBenPhai', e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: LIVE PREVIEW TỜ A4 TRỰC QUAN */}
        <div className="party-editor-sticky">
          <div className="editor-preview-bar">
            <span className="editor-preview-title">
              <FileText size={16} color="#b91c1c" />
              Xem Trước Bản In A4 Chuẩn Thể Thức Đảng
            </span>
            <button 
              type="button" 
              className="btn-trigger-ai"
              onClick={handleDownloadDoc}
            >
              <Download size={13} /> Tải .doc
            </button>
          </div>

          <div className="editor-paper-viewport">
            <div className="editor-paper-sheet">
              {/* Quốc hiệu / Đảng hiệu & Cấp ủy */}
              <table className="paper-head-table">
                <tbody>
                  <tr>
                    <td className="paper-org-col" style={{ width: '48%' }}>
                      <p className="org-upper" style={{ fontSize: '11pt' }}>
                        <strong>{formData.dangBoCoSo}</strong>
                      </p>
                      <p className="org-upper" style={{ fontSize: '10.5pt' }}>
                        <strong>{formData.chiBo}</strong>
                      </p>
                      <div style={{ width: '80px', height: '1px', background: '#000', margin: '4px auto 0 auto' }}></div>
                      <p style={{ margin: '2px 0 0 0', fontSize: '10pt' }}>*</p>
                    </td>
                    <td className="paper-motto-col" style={{ width: '52%' }}>
                      <p className="motto-main"><u>ĐẢNG CỘNG SẢN VIỆT NAM</u></p>
                      {currentTemplate.code && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '10.5pt', fontWeight: 'bold' }}>
                          {currentTemplate.code}
                        </p>
                      )}
                      <p className="motto-date">
                        {formData.diaDanh}, {formData.ngayThang}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Tiêu đề văn bản */}
              <div className="paper-main-title">
                {formData.tieuDeVanBan || currentTemplate.title}
              </div>
              {formData.canCuVanBan && (
                <div className="paper-cancu">
                  ({formData.canCuVanBan})
                </div>
              )}

              {/* Thông tin cá nhân người khai */}
              <div style={{ margin: '15px 0' }}>
                <p className="paper-line-p">
                  Họ và tên: <strong>{(formData.hoVaTen || '...................................................').toUpperCase()}</strong>
                </p>
                <p className="paper-line-p">
                  Sinh ngày: <strong>{formData.namSinh || '..../..../19....'}</strong>. Chức vụ Đảng: <strong>{formData.chucVuDang}</strong>
                </p>
                <p className="paper-line-p">
                  Chức vụ chính quyền / chuyên môn: <strong>{formData.chucVuChinhQuyen}</strong>
                </p>
                <p className="paper-line-p">
                  Đơn vị công tác: <strong>{formData.donViCongTac}</strong>
                </p>
                <p className="paper-line-p">
                  Sinh hoạt tại: <strong>{formData.chiBo}</strong> thuộc <strong>{formData.dangBoCoSo}</strong>
                </p>
              </div>

              {/* Nội dung chi tiết văn bản */}
              <div style={{ margin: '20px 0' }}>
                {formData.noiDungChinh ? (
                  formData.noiDungChinh.split('\n').map((paragraph, idx) => {
                    if (!paragraph.trim()) return <div key={idx} style={{ height: '8px' }}></div>;
                    const isHeading = paragraph.match(/^[I|V|X]+\.|\d+\.\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/);
                    return (
                      <p 
                        key={idx} 
                        className="paper-line-p"
                        style={{
                          fontWeight: isHeading ? 'bold' : 'normal',
                          textIndent: isHeading ? '0' : '10mm',
                          margin: isHeading ? '10px 0 4px 0' : '5px 0'
                        }}
                      >
                        {paragraph}
                      </p>
                    );
                  })
                ) : (
                  <p className="paper-line-p" style={{ fontStyle: 'italic', color: '#64748b' }}>
                    (Chưa có nội dung, vui lòng nhập nội dung ở khung soạn thảo bên trái hoặc nhờ AI viết...)
                  </p>
                )}
              </div>

              {/* Khối chữ ký hai bên chuẩn thể thức Đảng */}
              <table className="paper-sign-table">
                <tbody>
                  <tr>
                    <td>
                      {formData.nguoiKyBenTrai && (
                        <>
                          <p style={{ fontWeight: 'bold', margin: '0', whiteSpace: 'pre-line' }}>
                            {formData.nguoiKyBenTrai}
                          </p>
                          <p style={{ fontStyle: 'italic', fontSize: '10.5pt', margin: '3px 0 65px 0' }}>
                            {formData.chucDanhBenTrai}
                          </p>
                          <p style={{ fontWeight: 'bold', margin: '0' }}>
                            ...................................................
                          </p>
                        </>
                      )}
                    </td>
                    <td>
                      <p style={{ fontStyle: 'italic', fontSize: '10.5pt', margin: '0' }}>
                        {formData.diaDanh}, {formData.ngayThang}
                      </p>
                      <p style={{ fontWeight: 'bold', margin: '4px 0 0 0', whiteSpace: 'pre-line' }}>
                        {formData.nguoiKyBenPhai}
                      </p>
                      <p style={{ fontStyle: 'italic', fontSize: '10.5pt', margin: '3px 0 65px 0' }}>
                        {formData.chucDanhBenPhai}
                      </p>
                      <p style={{ fontWeight: 'bold', margin: '0' }}>
                        {(formData.hoVaTen || '').toUpperCase()}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

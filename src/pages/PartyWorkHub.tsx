import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  CheckSquare, 
  ShieldCheck, 
  ArrowRight, 
  FolderOpen, 
  Search,
  Download,
  BookOpen,
  X,
  Award,
  Sparkles,
  Wand2,
  Loader2
} from 'lucide-react';
import { 
  ALL_PARTY_TEMPLATES, 
  PARTY_DOCUMENT_CATEGORIES, 
  type PartyDocumentTemplate 
} from '../data/partyTemplatesCatalog';
import { generatePartyDocHtml } from '../utils/partyGeneralDocGenerator';
import './PartyWorkHub.css';

export default function PartyWorkHub() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<PartyDocumentTemplate | null>(null);
  const [customInfo, setCustomInfo] = useState({
    hoVaTen: '',
    namSinh: '',
    chucVu: '',
    donVi: 'Trường Cao đẳng Bách khoa Nam Sài Gòn'
  });
  const [customBody, setCustomBody] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Mở modal soạn thảo & gán nội dung mẫu ban đầu
  const handleOpenTemplateModal = (tmpl: PartyDocumentTemplate) => {
    setSelectedTemplate(tmpl);
    setCustomBody(tmpl.desc || '');
    setAiPrompt('');
  };

  // Trợ lý AI viết lại / tạo mới nội dung chuyên biệt cho biểu mẫu
  const handleAiGenerateDoc = async () => {
    if (!selectedTemplate) return;
    setIsAiGenerating(true);
    try {
      const promptInstruction = `
Bạn là chuyên gia thư ký xây dựng Đảng giàu kinh nghiệm và uyên thâm về lý luận, nghiệp vụ công tác Đảng. Hãy soạn thảo chi tiết, toàn diện, dài dặn và mẫu mực toàn bộ nội dung văn bản cho biểu mẫu Đảng sau:
Tên biểu mẫu: "${selectedTemplate.title}"
Mã số/Căn cứ: "${selectedTemplate.code || ''}" (${selectedTemplate.guidance || 'Quy định Đảng'})
Thông tin người lập/cơ quan: Đồng chí ${customInfo.hoVaTen || 'cán bộ, đảng viên'}, Chức danh: ${customInfo.chucVu || 'Giảng viên/Chuyên viên'}, Đơn vị: ${customInfo.donVi || 'Trường Cao đẳng Bách khoa Nam Sài Gòn'}.

YÊU CẦU ĐẶC BIỆT VỀ CHẤT LƯỢNG VĂN BẢN VÀ NGÔN PHONG:
1. Độ dài và tính hệ thống: Viết dài hơn, bố cục chặt chẽ gồm các phần (Căn cứ chính trị/pháp lý, Tình hình thực tế, Nội dung cụ thể, Đánh giá kết quả, Đề xuất kiến nghị hoặc Lời cam kết), mỗi phần có các gạch đầu dòng hoặc đánh số rõ ràng. Tuyệt đối không viết ngắn, hời hợt.
2. Ngôn phong chính trị của Đảng: Nghiêm túc, trang trọng, lập trường tư tưởng kiên định, tuân thủ đúng Cương lĩnh, Điều lệ Đảng và thể thức văn bản của Ban Chấp hành Trung ương Đảng.

Yêu cầu hoặc thông tin tóm tắt bổ sung từ người dùng:
"""
${aiPrompt || 'Hãy soạn thảo văn bản hoàn chỉnh, dài dặn, sâu sắc, chuẩn thể thức và nội dung theo đúng nghiệp vụ xây dựng Đảng.'}
"""

Trả về duy nhất chuỗi JSON: {"content": "toàn bộ nội dung văn bản hoàn chỉnh, dài dặn, chuẩn mực, có đề mục rõ ràng"}
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
        setCustomBody(cleanText);
      }
    } catch (e) {
      console.error('Lỗi AI soạn biểu mẫu:', e);
      alert('Không thể kết nối trợ lý AI lúc này. Bạn vẫn có thể tự chỉnh sửa nội dung trong ô bên dưới.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Bộ lọc biểu mẫu
  const filteredTemplates = useMemo(() => {
    return ALL_PARTY_TEMPLATES.filter(item => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch = searchQuery.trim() === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  // Xuất file Word (.doc) chuẩn thể thức và nội dung chuyên biệt cho từng biểu mẫu
  const handleExportQuickDoc = (template: PartyDocumentTemplate) => {
    setIsExporting(true);
    try {
      const htmlContent = generatePartyDocHtml(template, {
        hoVaTen: customInfo.hoVaTen,
        namSinh: customInfo.namSinh,
        chucVu: customInfo.chucVu,
        donVi: customInfo.donVi,
        chiBo: 'Chi bộ 1',
        dangBoCoSo: 'Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn',
        huyenUy: 'ĐẢNG BỘ CÁC TRƯỜNG CAO ĐẲNG ĐẠI HỌC TP.HCM',
        tinhUy: 'ĐẢNG BỘ THÀNH PHỐ HỒ CHÍ MINH',
        diaDanh: 'Thành phố Hồ Chí Minh',
        customBody: customBody
      });

      const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.id}_Chuan_The_Thuc_Dang.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Lỗi xuất word:', e);
      alert('Không thể tạo file Word. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="party-hub-container">
      {/* HERO SECTION */}
      <div className="party-hub-hero">
        <div className="party-hub-hero-content">
          <div className="party-hub-badge">
            <ShieldCheck size={16} />
            HỆ THỐNG BIỂU MẪU & CÔNG CỤ VĂN BẢN ĐẢNG CHUẨN HOÁ
          </div>
          <h1>Trung Tâm Quản Lý Văn Bản & Công Tác Đảng</h1>
          <p>
            Tổng hợp và số hóa toàn bộ hệ thống biểu mẫu văn bản Đảng theo Quy định Ban Bí thư, Ban Tổ chức Trung ương: 
            Bản kiểm điểm Mẫu 02A, Mẫu 02B, Phiếu bổ sung hồ sơ Mẫu 3-HSĐV quy chuẩn chữ "K", hồ sơ kết nạp Đảng, đảng viên dự bị, 
            sinh hoạt chi bộ, chuyển sinh hoạt đảng và đại hội. Tích hợp xem trước A4 trực quan, trợ lý AI và xuất file Word (.doc) 100% chuẩn thể thức.
          </p>
        </div>
      </div>

      {/* TOP STATS & QUICK HIGHLIGHTS */}
      <div className="party-stats-bar">
        <div className="party-stat-item">
          <div className="party-stat-num">200+</div>
          <div className="party-stat-label">Biểu mẫu Đảng chuẩn</div>
        </div>
        <div className="party-stat-item">
          <div className="party-stat-num">100%</div>
          <div className="party-stat-label">Chuẩn thể thức Word A4</div>
        </div>
        <div className="party-stat-item">
          <div className="party-stat-num">AI</div>
          <div className="party-stat-label">Trợ lý thư ký tự động</div>
        </div>
        <div className="party-stat-item">
          <div className="party-stat-num">02A & 02B</div>
          <div className="party-stat-label">Kiểm điểm Đảng viên 2026</div>
        </div>
      </div>

      {/* CÁC CÔNG CỤ ĐÃ SẴN SÀNG (FEATURED CARDS) */}
      <div className="party-section-heading">
        <Award size={22} color="#b91c1c" />
        <h2>Công Cụ Trực Tuyến Nổi Bật (Sẵn Sàng Sử Dụng Ngay)</h2>
      </div>

      <div className="party-tools-grid">
        {/* Card 1: Mẫu 02A */}
        <Link to="/ban-kiem-diem-dang-vien-mau-02a" className="party-tool-card featured">
          <div className="party-tool-top">
            <div className="party-tool-icon">
              <CheckSquare size={26} color="#dc2626" />
            </div>
            <span className="party-tool-badge" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' }}>
              MỚI 2026
            </span>
          </div>
          <h3 className="party-tool-title">Bản Kiểm Điểm Đảng Viên Cuối Năm (Mẫu 02A - Lãnh Đạo, Quản Lý)</h3>
          <p className="party-tool-desc">
            Bản tự đánh giá, xếp loại chất lượng năm 2026 dành riêng cho cán bộ giữ chức vụ lãnh đạo, quản lý 
            theo Hướng dẫn 43-HD/BTCTW và Công văn 2772-CV/BTCTW; có trợ lý AI và xuất Word (.doc).
          </p>
          <div className="party-tool-footer">
            <span className="party-tool-btn">Sử dụng ngay <ArrowRight size={16} /></span>
          </div>
        </Link>

        {/* Card 2: Mẫu 02B */}
        <Link to="/ban-kiem-diem-dang-vien-mau-02b" className="party-tool-card featured">
          <div className="party-tool-top">
            <div className="party-tool-icon">
              <Award size={26} color="#ea580c" />
            </div>
            <span className="party-tool-badge" style={{ background: '#fff7ed', color: '#ea580c', borderColor: '#fdba74' }}>
              MỚI 2026
            </span>
          </div>
          <h3 className="party-tool-title">Bản Kiểm Điểm Đảng Viên Cuối Năm (Mẫu 02B - Cá Nhân)</h3>
          <p className="party-tool-desc">
            Dành cho giảng viên, giáo viên, chuyên viên, nhân viên không giữ chức vụ lãnh đạo, quản lý; 
            tự xếp loại chất lượng viên chức và đảng viên theo đúng HD 43 & CV 2772.
          </p>
          <div className="party-tool-footer">
            <span className="party-tool-btn">Sử dụng ngay <ArrowRight size={16} /></span>
          </div>
        </Link>

        {/* Card 3: Mẫu 3-HSĐV */}
        <Link to="/bo-sung-ho-so-dang-vien" className="party-tool-card featured">
          <div className="party-tool-top">
            <div className="party-tool-icon">
              <FileText size={26} color="#b91c1c" />
            </div>
            <span className="party-tool-badge" style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' }}>
              ĐÃ SẴN SÀNG
            </span>
          </div>
          <h3 className="party-tool-title">Phiếu Bổ Sung Hồ Sơ Đảng Viên (Mẫu 3-HSĐV)</h3>
          <p className="party-tool-desc">
            Soạn thảo chuẩn hóa quy chuẩn chữ "K" theo Ban Tổ chức Trung ương, dàn trang in A4 và xuất file Word (.doc) 
            100% chuẩn thể thức quy định của Ban Bí thư.
          </p>
          <div className="party-tool-footer">
            <span className="party-tool-btn">Sử dụng ngay <ArrowRight size={16} /></span>
          </div>
        </Link>

        {/* Card 4: Bản Cam Kết Tu Dưỡng Đảng Viên */}
        <Link to="/ban-cam-ket-tu-duong-ren-luyen-dang-vien" className="party-tool-card featured">
          <div className="party-tool-top">
            <div className="party-tool-icon">
              <CheckSquare size={26} color="#16a34a" />
            </div>
            <span className="party-tool-badge" style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' }}>
              MỚI 2026
            </span>
          </div>
          <h3 className="party-tool-title">Bản Cam Kết Tu Dưỡng, Rèn Luyện, Phấn Đấu (Đầu Năm)</h3>
          <p className="party-tool-desc">
            Đăng ký và cam kết rèn luyện 5 nhóm nội dung trọng tâm theo Nghị quyết TW 4 khóa XII, XIII và Chỉ thị 05-CT/TW; 
            tích hợp trợ lý AI gợi ý viết lại từng phần và xuất file Word (.doc).
          </p>
          <div className="party-tool-footer">
            <span className="party-tool-btn">Sử dụng ngay <ArrowRight size={16} /></span>
          </div>
        </Link>
      </div>

      {/* TRA CỨU & DANH MỤC ĐẦY ĐỦ CÁC MẪU VĂN BẢN ĐẢNG */}
      <div className="party-catalog-section">
        <div className="party-section-heading">
          <FolderOpen size={22} color="#b91c1c" />
          <h2>Toàn Bộ Biểu Mẫu Công Tác Đảng Chuẩn (Theo Latendoc & BTCTW)</h2>
        </div>

        {/* Search & Category Pills */}
        <div className="party-filter-container">
          <div className="party-search-box">
            <Search size={18} color="#64748b" />
            <input 
              type="text"
              placeholder="Tìm kiếm mẫu văn bản Đảng (VD: Đơn xin vào Đảng, Biên bản họp, Mẫu 10-KNĐ, Chuyển sinh hoạt...)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="party-category-pills">
            {PARTY_DOCUMENT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách Catalog biểu mẫu */}
        <div className="party-templates-list">
          {filteredTemplates.length === 0 ? (
            <div className="party-empty-search">
              <FolderOpen size={48} color="#cbd5e1" />
              <p>Không tìm thấy biểu mẫu phù hợp với từ khóa "{searchQuery}". Vui lòng thử từ khóa khác!</p>
            </div>
          ) : (
            filteredTemplates.map(tmpl => (
              <div key={tmpl.id} className="party-template-row">
                <div className="template-row-left">
                  <div className="template-code-badge">
                    {tmpl.code || 'Mẫu Đảng'}
                  </div>
                  <div>
                    <h4 className="template-row-title">{tmpl.title}</h4>
                    <p className="template-row-desc">{tmpl.desc}</p>
                    {tmpl.guidance && (
                      <span className="template-guidance-tag">
                        <BookOpen size={13} /> {tmpl.guidance}
                      </span>
                    )}
                  </div>
                </div>

                <div className="template-row-right">
                  <Link 
                    to={tmpl.targetPath ? tmpl.targetPath : `/soan-thao-bieu-mau-dang/${tmpl.id}`} 
                    className="btn-tmpl-act primary"
                  >
                    Soạn thảo trên Web với AI <ArrowRight size={15} />
                  </Link>
                  <button 
                    type="button" 
                    className="btn-tmpl-act outline"
                    style={{ marginLeft: '6px' }}
                    onClick={() => handleOpenTemplateModal(tmpl)}
                    title="Mở nhanh bảng mẫu"
                  >
                    <Sparkles size={14} color="#b91c1c" /> Xuất nhanh
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* THÔNG TIN THỂ THỨC VĂN BẢN ĐẢNG */}
      <div className="party-info-card">
        <div className="party-info-title">
          <FolderOpen size={20} color="#b91c1c" />
          Quy Chuẩn Thể Thức Văn Bản Trong Công Tác Đảng
        </div>
        <ul className="party-info-list">
          <li>
            <strong>Font chữ & Định dạng:</strong> Sử dụng phông chữ Times New Roman (bộ mã Unicode), cỡ chữ từ 13pt - 14pt, giãn dòng 1.3 - 1.4 chuẩn theo Quy định số 66-QĐ/TW.
          </li>
          <li>
            <strong>Quy tắc ghi chữ "K":</strong> Tại Phiếu bổ sung hồ sơ đảng viên (Mẫu 3-HSĐV), chỉ khai các nội dung có thay đổi so với năm trước. Trường nào không có biến động, bắt buộc ghi vào mục đó chữ "K".
          </li>
          <li>
            <strong>Bộ thông tin Cấp ủy chuẩn:</strong> ĐẢNG BỘ THÀNH PHỐ HỒ CHÍ MINH, ĐẢNG BỘ CÁC TRƯỜNG CAO ĐẲNG ĐẠI HỌC THÀNH PHỐ HỒ CHÍ MINH, Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn, Chi bộ 1.
          </li>
          <li>
            <strong>Xuất tài liệu:</strong> Hệ thống tự động tạo file Word (.doc) giữ nguyên định dạng trang in A4, căn lề và khối chữ ký chuẩn của tổ chức Đảng.
          </li>
        </ul>
      </div>

      {/* MODAL SOẠN THẢO VÀ XUẤT BIỂU MẪU VỚI TRỢ LÝ AI */}
      {selectedTemplate && (
        <div className="party-modal-backdrop" onClick={() => setSelectedTemplate(null)}>
          <div className="party-modal-card party-modal-large" onClick={e => e.stopPropagation()}>
            <div className="party-modal-header">
              <div className="modal-title-wrap">
                <FileText size={22} color="#b91c1c" />
                <div>
                  <h3>Soạn Thảo Biểu Mẫu: {selectedTemplate.code || 'Văn bản Đảng'}</h3>
                  <p>{selectedTemplate.title}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedTemplate(null)}>✕</button>
            </div>

            <div className="party-modal-body">
              {/* Box hướng dẫn & AI Generator */}
              <div className="modal-ai-box">
                <div className="modal-ai-box-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#991b1b', fontSize: '0.88rem' }}>
                    <Sparkles size={16} />
                    Trợ lý AI viết lại / tạo mới nội dung chuẩn thể thức Đảng
                  </div>
                  <button 
                    type="button" 
                    className="btn-modal-ai-action"
                    disabled={isAiGenerating}
                    onClick={handleAiGenerateDoc}
                  >
                    {isAiGenerating ? <Loader2 size={14} className="spin" /> : <Wand2 size={14} />}
                    <span>{isAiGenerating ? 'AI đang soạn...' : 'AI Viết / Chuẩn hóa nội dung'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  className="modal-ai-input"
                  placeholder="Nhập thông tin cốt lõi (VD: Lý do, nội dung chính, kết quả đạt được, thời gian... để AI viết chi tiết)"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                />
              </div>

              {/* Ô soạn thảo nội dung văn bản */}
              <div className="modal-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Nội dung chi tiết văn bản (có thể tự chỉnh sửa hoặc nhờ AI viết ở trên):</label>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Đồng bộ vào file Word</span>
                </div>
                <textarea 
                  rows={6}
                  className="modal-body-textarea"
                  value={customBody}
                  onChange={e => setCustomBody(e.target.value)}
                  placeholder="Nhập hoặc để AI soạn thảo nội dung đầy đủ của biểu mẫu..."
                />
              </div>

              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label>Họ và tên cán bộ / đảng viên</label>
                  <input 
                    type="text" 
                    placeholder="NGUYỄN VĂN A" 
                    value={customInfo.hoVaTen}
                    onChange={e => setCustomInfo({ ...customInfo, hoVaTen: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Ngày sinh (dd/mm/yyyy)</label>
                  <input 
                    type="text" 
                    placeholder="12/04/1988" 
                    value={customInfo.namSinh}
                    onChange={e => setCustomInfo({ ...customInfo, namSinh: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label>Chức vụ chính quyền / chuyên môn</label>
                  <input 
                    type="text" 
                    placeholder="Giảng viên / Chuyên viên" 
                    value={customInfo.chucVu}
                    onChange={e => setCustomInfo({ ...customInfo, chucVu: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Đơn vị công tác</label>
                  <input 
                    type="text" 
                    value={customInfo.donVi}
                    onChange={e => setCustomInfo({ ...customInfo, donVi: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-preview-box">
                <p><strong>Cấp ủy áp dụng chuẩn:</strong></p>
                <p>• Đảng ủy cấp trên: ĐẢNG BỘ THÀNH PHỐ HỒ CHÍ MINH</p>
                <p>• Đảng ủy trực thuộc: ĐẢNG BỘ CÁC TRƯỜNG CAO ĐẲNG ĐẠI HỌC THÀNH PHỐ HỒ CHÍ MINH</p>
                <p>• Đảng bộ cơ sở: Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn — Chi bộ: Chi bộ 1</p>
              </div>
            </div>

            <div className="party-modal-footer">
              <button className="btn-modal-cancel" onClick={() => setSelectedTemplate(null)}>Đóng</button>
              <button 
                className="btn-modal-download" 
                onClick={() => handleExportQuickDoc(selectedTemplate)}
                disabled={isExporting}
              >
                <Download size={16} />
                {isExporting ? 'Đang tạo file...' : 'Tải File Word (.doc) Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  Award
} from 'lucide-react';
import { 
  ALL_PARTY_TEMPLATES, 
  PARTY_DOCUMENT_CATEGORIES, 
  type PartyDocumentTemplate 
} from '../data/partyTemplatesCatalog';
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
  const [isExporting, setIsExporting] = useState(false);

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

  // Xuất file Word (.doc) nhanh cho biểu mẫu bất kỳ
  const handleExportQuickDoc = (template: PartyDocumentTemplate) => {
    setIsExporting(true);
    try {
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${template.title}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm 15mm 20mm 25mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 13pt;
              line-height: 1.35;
              color: #000000;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .header-table td {
              vertical-align: top;
            }
            .org-upper {
              font-size: 11pt;
              font-weight: bold;
              text-transform: uppercase;
              text-align: center;
              margin: 0;
            }
            .doc-title {
              font-size: 15pt;
              font-weight: bold;
              text-align: center;
              text-transform: uppercase;
              margin: 25px 0 10px 0;
            }
            .doc-sub {
              font-size: 13pt;
              font-style: italic;
              text-align: center;
              margin-bottom: 25px;
            }
            .content-p {
              text-indent: 10mm;
              margin: 8px 0;
              text-align: justify;
            }
            .dotted-line {
              border-bottom: 1px dotted #888;
              height: 22px;
              margin-bottom: 6px;
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="width: 48%; text-align: center;">
                <p class="org-upper">ĐẢNG BỘ THÀNH PHỐ HỒ CHÍ MINH</p>
                <p class="org-upper" style="font-size: 10pt;">ĐẢNG BỘ CÁC TRƯỜNG CAO ĐẲNG ĐẠI HỌC TP.HCM</p>
                <p class="org-upper" style="font-size: 10.5pt; text-transform: none;"><strong>Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn</strong></p>
                <p class="org-upper"><strong>Chi bộ 1</strong></p>
                <div style="width: 80px; height: 1px; background: #000; margin: 4px auto 0 auto;"></div>
                <p style="margin: 2px 0 0 0; font-size: 10pt;">*</p>
              </td>
              <td style="width: 52%; text-align: center;">
                <p style="font-weight: bold; text-transform: uppercase; margin: 0; font-size: 11.5pt;"><u>ĐẢNG CỘNG SẢN VIỆT NAM</u></p>
                ${template.code ? `<p style="margin: 4px 0 0 0; font-size: 11pt; font-weight: bold;">${template.code}</p>` : ''}
                <p style="font-style: italic; margin: 10px 0 0 0; font-size: 11pt;">Thành phố Hồ Chí Minh, ngày ...... tháng ...... năm 2026</p>
              </td>
            </tr>
          </table>

          <div class="doc-title">${template.title}</div>
          ${template.guidance ? `<div class="doc-sub">(${template.guidance})</div>` : '<div style="height: 15px;"></div>'}

          <div style="margin: 15px 0;">
            <p class="content-p">Họ và tên: <strong>${customInfo.hoVaTen || '...........................................................................................'}</strong></p>
            <p class="content-p">Ngày, tháng, năm sinh: ${customInfo.namSinh || '........................................................'} Giới tính: .........................</p>
            <p class="content-p">Chức vụ Đảng: ....................................... Chức vụ chuyên môn: ${customInfo.chucVu || '...........................................'}</p>
            <p class="content-p">Đơn vị công tác: <strong>${customInfo.donVi || 'Trường Cao đẳng Bách khoa Nam Sài Gòn'}</strong></p>
            <p class="content-p">Chi bộ sinh hoạt: <strong>Chi bộ 1</strong></p>
          </div>

          <div style="margin: 25px 0;">
            <p><strong>NỘI DUNG VĂN BẢN:</strong></p>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
          </div>

          <table style="width: 100%; margin-top: 40px; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; text-align: center; vertical-align: top;">
                <p style="font-weight: bold; margin: 0;">T/M CHI ỦY CHI BỘ</p>
                <p style="font-style: italic; font-size: 11pt; margin: 2px 0 60px 0;">(Ký, ghi rõ họ tên)</p>
              </td>
              <td style="width: 50%; text-align: center; vertical-align: top;">
                <p style="font-style: italic; font-size: 11pt; margin: 0;">TP. Hồ Chí Minh, ngày ..... tháng ..... năm 2026</p>
                <p style="font-weight: bold; margin: 4px 0 0 0;">NGƯỜI KHAI / NGƯỜI LÀM ĐƠN</p>
                <p style="font-style: italic; font-size: 11pt; margin: 2px 0 60px 0;">(Ký, ghi rõ họ tên)</p>
                <p style="font-weight: bold; margin: 0;">${customInfo.hoVaTen || ''}</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
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
          <div className="party-stat-num">35+</div>
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
                  {tmpl.status === 'ready' && tmpl.targetPath ? (
                    <Link to={tmpl.targetPath} className="btn-tmpl-act primary">
                      Soạn thảo ngay <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <button 
                      type="button" 
                      className="btn-tmpl-act outline"
                      onClick={() => setSelectedTemplate(tmpl)}
                    >
                      <Download size={15} /> Xuất Word (.doc)
                    </button>
                  )}
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

      {/* MODAL TẢI BIỂU MẪU NHANH */}
      {selectedTemplate && (
        <div className="party-modal-backdrop" onClick={() => setSelectedTemplate(null)}>
          <div className="party-modal-card" onClick={e => e.stopPropagation()}>
            <div className="party-modal-header">
              <div className="modal-title-wrap">
                <FileText size={22} color="#b91c1c" />
                <div>
                  <h3>Xuất Biểu Mẫu: {selectedTemplate.code || 'Văn bản Đảng'}</h3>
                  <p>{selectedTemplate.title}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedTemplate(null)}>✕</button>
            </div>

            <div className="party-modal-body">
              <p className="modal-intro">
                Điền nhanh thông tin của đồng chí để hệ thống tự động điền sẵn vào biểu mẫu Word (.doc) chuẩn thể thức Đảng:
              </p>

              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label>Họ và tên (chữ in hoa)</label>
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
                <p>• Đảng bộ cơ sở: Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn</p>
                <p>• Chi bộ: Chi bộ 1</p>
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

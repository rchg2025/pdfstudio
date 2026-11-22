import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Printer, 
  Building2, 
  UserCheck, 
  Award,
  AlertCircle
} from 'lucide-react';
import { 
  type PartySelfReview02BData, 
  defaultPartySelfReview02BData, 
  exportPartySelfReview02BDocx 
} from '../utils/partySelfReview02BExport';
import './PartyMemberSelfReview02B.css';

const STORAGE_KEY = 'rchg_party_self_review_02b_draft_v1';

export default function PartyMemberSelfReview02B() {
  const [formData, setFormData] = useState<PartySelfReview02BData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu kiểm điểm 02B lưu nháp:', e);
    }
    return defaultPartySelfReview02BData;
  });

  const [savedToast, setSavedToast] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiError, setAiError] = useState('');

  // Tự động lưu nháp
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('Lỗi ghi dữ liệu lưu nháp:', e);
    }
  }, [formData]);

  const handleChange = (field: keyof PartySelfReview02BData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại bản kiểm điểm Mẫu 02B về nội dung chuẩn mặc định?')) {
      setFormData(defaultPartySelfReview02BData);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleDownloadDocx = () => {
    exportPartySelfReview02BDocx(formData);
  };

  const handlePrint = () => {
    window.print();
  };

  // Trợ lý AI Viết / Hoàn thiện bản kiểm điểm Mẫu 02B (Đảng viên không giữ chức vụ lãnh đạo)
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiError('');

    try {
      const customKey = localStorage.getItem('rchg_gemini_api_key') || '';
      const promptInstruction = `
Bạn là chuyên gia thư ký xây dựng Đảng cấp cao. Nhiệm vụ của bạn là dựa vào tóm tắt hoạt động trong năm của một Đảng viên KHÔNG giữ chức vụ lãnh đạo (giảng viên, giáo viên, chuyên viên, nhân viên...) để viết và hoàn thiện "Bản kiểm điểm, tự đánh giá, xếp loại cá nhân Mẫu 02B (dùng cho kiểm điểm năm 2026, Hướng dẫn 43-HD/BTCTW, Công văn 2772-CV/BTCTW)".
Văn phong: Chính trị chuẩn mực, trang trọng, thẳng thắn, đúng tinh thần tự phê bình và phê bình của Đảng.
Trả về DUY NHẤT một chuỗi JSON hợp lệ không có giải thích thêm với cấu trúc:
{
  "uuDiemPhamChatChinhTri": "Nội dung phẩm chất chính trị, đạo đức, lối sống, ý thức tổ chức kỷ luật, đoàn kết nội bộ, phòng chống suy thoái...",
  "uuDiemThucHienNhiemVu": "Nội dung thực hiện chức trách chuyên môn, giảng dạy/công tác, hoàn thành chỉ tiêu nhiệm vụ được giao trong năm...",
  "uuDiemCamKetTuDuong": "Nội dung thực hiện cam kết tu dưỡng rèn luyện, liên hệ chi ủy nơi cư trú theo Quy định 213-QĐ/TW...",
  "hanCheKhuyetDiem": "Chỉ ra 1-2 hạn chế khuyết điểm thực tế của cá nhân (ví dụ: phát biểu thảo luận sinh hoạt chi bộ, ứng dụng CNTT...)...",
  "nguyenNhanKhachQuan": "Nguyên nhân khách quan...",
  "nguyenNhanChuQuan": "Nguyên nhân chủ quan...",
  "ketQuaKhacPhucNamTruoc": "Kết quả khắc phục hạn chế năm trước (nếu có)...",
  "giaiTrinhTrachNhiem": "Giải trình trách nhiệm cá nhân đối với hạn chế của tập thể hoặc vấn đề gợi ý kiểm điểm...",
  "phuongHuongKhacPhuc": "3 phương hướng giải pháp cụ thể cho năm tới..."
}

THÔNG TIN HOẠT ĐỘNG VÀ VỊ TRÍ CHUYÊN MÔN:
"""
${aiPrompt}
"""
      `;

      const response = await fetch('/api/qa-wall?action=generate-ai-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: promptInstruction,
          count: 1,
          customApiKey: customKey || undefined
        })
      });

      if (!response.ok) throw new Error('Không thể kết nối đến máy chủ AI');

      const resData = await response.json();
      const rawText = resData?.questions?.[0]?.question || resData?.text || '';
      const cleanJsonStr = rawText.replace(/```json\s*|```/g, '').trim();
      const match = cleanJsonStr.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setFormData(prev => ({
          ...prev,
          ...parsed
        }));
        setShowAiModal(false);
        setAiPrompt('');
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2500);
      } else {
        throw new Error('AI trả về định dạng chưa khớp JSON');
      }
    } catch (err: any) {
      console.error('Lỗi AI hỗ trợ kiểm điểm 02B:', err);
      setAiError(err.message || 'Có lỗi xảy ra khi gọi AI. Vui lòng kiểm tra API Key hoặc thử lại.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="party-review-container">
      {/* HEADER BANNER */}
      <div className="party-review-header">
        <div className="party-review-title">
          <h1>
            <Award size={26} />
            Bản Kiểm Điểm Đảng Viên Cuối Năm (Mẫu 02B - Không Giữ Chức Vụ Lãnh Đạo)
          </h1>
          <p>
            Tự đánh giá, xếp loại chất lượng năm 2026 dành riêng cho đảng viên không giữ chức vụ lãnh đạo, quản lý 
            (giảng viên, giáo viên, chuyên viên, nhân viên) theo Hướng dẫn 43-HD/BTCTW và Công văn 2772-CV/BTCTW.
          </p>
        </div>
        <div className="party-review-actions">
          <button 
            type="button" 
            className="btn-review-act secondary"
            onClick={() => setShowAiModal(true)}
          >
            <Sparkles size={16} />
            Trợ Lý AI Viết Hộ
          </button>
          <button 
            type="button" 
            className="btn-review-act danger"
            onClick={handleReset}
            title="Đặt lại bản kiểm điểm về chuẩn mặc định"
          >
            <RotateCcw size={16} />
            Đặt lại mẫu
          </button>
          <button 
            type="button" 
            className="btn-review-act outline"
            onClick={handlePrint}
          >
            <Printer size={16} />
            In A4
          </button>
          <button 
            type="button" 
            className="btn-review-act primary"
            onClick={handleDownloadDocx}
          >
            <Download size={16} />
            Tải File Word (.doc)
          </button>
        </div>
      </div>

      {savedToast && (
        <div className="toast-notify">
          <Check size={16} /> Đã áp dụng gợi ý soạn thảo từ AI thành công!
        </div>
      )}

      {/* WORKSPACE: FORM + LIVE PAPER PREVIEW */}
      <div className="party-review-body">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className="review-editor-column">
          {/* KHỐI 1: TỔ CHỨC ĐẢNG */}
          <div className="review-card-section">
            <div className="section-heading">
              <Building2 size={18} />
              <h3>1. Thông Tin Cấp Ủy & Hồ Sơ</h3>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Tỉnh ủy / Đảng ủy cấp trên trực tiếp</label>
                <input 
                  type="text" 
                  value={formData.tinhUy} 
                  onChange={e => handleChange('tinhUy', e.target.value)} 
                  placeholder="Ví dụ: ĐẢNG BỘ THÀNH PHỐ HỒ CHÍ MINH"
                />
              </div>
              <div className="form-group">
                <label>Huyện ủy / Đảng ủy trực thuộc</label>
                <input 
                  type="text" 
                  value={formData.huyenUy} 
                  onChange={e => handleChange('huyenUy', e.target.value)} 
                  placeholder="Ví dụ: ĐẢNG BỘ CÁC TRƯỜNG CAO ĐẲNG ĐẠI HỌC THÀNH PHỐ HỒ CHÍ MINH"
                />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Đảng bộ cơ sở</label>
                <input 
                  type="text" 
                  value={formData.dangBoCoSo} 
                  onChange={e => handleChange('dangBoCoSo', e.target.value)} 
                  placeholder="Ví dụ: Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn"
                />
              </div>
              <div className="form-group">
                <label>Chi bộ trực thuộc</label>
                <input 
                  type="text" 
                  value={formData.chiBo} 
                  onChange={e => handleChange('chiBo', e.target.value)} 
                  placeholder="Ví dụ: Chi bộ 1"
                />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Năm kiểm điểm</label>
                <input 
                  type="text" 
                  value={formData.namKiemDiem} 
                  onChange={e => handleChange('namKiemDiem', e.target.value)} 
                  placeholder="2026"
                />
              </div>
              <div className="form-group">
                <label>Địa danh lập bản kiểm điểm</label>
                <input 
                  type="text" 
                  value={formData.diaDanh} 
                  onChange={e => handleChange('diaDanh', e.target.value)} 
                  placeholder="Thành phố Hồ Chí Minh"
                />
              </div>
            </div>
          </div>

          {/* KHỐI 2: THÔNG TIN CÁ NHÂN */}
          <div className="review-card-section">
            <div className="section-heading">
              <UserCheck size={18} />
              <h3>2. Thông Tin Đảng Viên Tự Kiểm Điểm</h3>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Họ và tên (chữ in hoa)</label>
                <input 
                  type="text" 
                  value={formData.hoVaTen} 
                  onChange={e => handleChange('hoVaTen', e.target.value)} 
                  placeholder="NGUYỄN VĂN A"
                  style={{ fontWeight: 600, textTransform: 'uppercase' }}
                />
              </div>
              <div className="form-group">
                <label>Ngày tháng năm sinh</label>
                <input 
                  type="text" 
                  value={formData.namSinh} 
                  onChange={e => handleChange('namSinh', e.target.value)} 
                  placeholder="dd/mm/yyyy"
                />
              </div>
            </div>
            <div className="form-grid-3">
              <div className="form-group">
                <label>Chức vụ Đảng</label>
                <input 
                  type="text" 
                  value={formData.chucVuDang} 
                  onChange={e => handleChange('chucVuDang', e.target.value)} 
                  placeholder="Đảng viên"
                />
              </div>
              <div className="form-group">
                <label>Chức vụ chính quyền / Chuyên môn</label>
                <input 
                  type="text" 
                  value={formData.chucVuChinhQuyen} 
                  onChange={e => handleChange('chucVuChinhQuyen', e.target.value)} 
                  placeholder="Giảng viên, Chuyên viên..."
                />
              </div>
              <div className="form-group">
                <label>Chức vụ đoàn thể</label>
                <input 
                  type="text" 
                  value={formData.chucVuDoanThe} 
                  onChange={e => handleChange('chucVuDoanThe', e.target.value)} 
                  placeholder="Đoàn viên công đoàn..."
                />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Đơn vị công tác</label>
                <input 
                  type="text" 
                  value={formData.donViCongTac} 
                  onChange={e => handleChange('donViCongTac', e.target.value)} 
                  placeholder="Khoa/Phòng... Trường Cao đẳng Bách khoa Nam Sài Gòn"
                />
              </div>
              <div className="form-group">
                <label>Chi bộ sinh hoạt</label>
                <input 
                  type="text" 
                  value={formData.chiBoSinhHoat} 
                  onChange={e => handleChange('chiBoSinhHoat', e.target.value)} 
                  placeholder="Chi bộ 1"
                />
              </div>
            </div>
          </div>

          {/* KHỐI 3: I. ƯU ĐIỂM, KẾT QUẢ ĐẠT ĐƯỢC (3 MỤC CHUẨN MẪU 02B) */}
          <div className="review-card-section">
            <div className="section-heading">
              <FileText size={18} />
              <h3>I. Ưu Điểm, Kết Quả Đạt Được (Mẫu 02B)</h3>
            </div>
            <div className="form-group">
              <label>1. Phẩm chất chính trị, đạo đức, lối sống, ý thức tổ chức kỷ luật, trách nhiệm nêu gương</label>
              <span className="field-hint">
                Tư tưởng chính trị, đạo đức, lối sống, giữ gìn đoàn kết nội bộ, chấp hành kỷ luật, đấu tranh chống suy thoái, "tự diễn biến", "tự chuyển hóa".
              </span>
              <textarea 
                rows={6}
                value={formData.uuDiemPhamChatChinhTri}
                onChange={e => handleChange('uuDiemPhamChatChinhTri', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>2. Thực hiện nhiệm vụ, quyền hạn và kết quả thực hiện các chỉ tiêu, nhiệm vụ được giao trong năm</label>
              <span className="field-hint">
                Khối lượng, chất lượng, tiến độ thực hiện chức trách chuyên môn giảng dạy, công tác; tinh thần trách nhiệm, đổi mới, chuyển đổi số.
              </span>
              <textarea 
                rows={6}
                value={formData.uuDiemThucHienNhiemVu}
                onChange={e => handleChange('uuDiemThucHienNhiemVu', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu hằng năm</label>
              <span className="field-hint">
                Đối chiếu với bản cam kết đầu năm và giữ mối liên hệ với cấp ủy nơi cư trú (Quy định 213-QĐ/TW).
              </span>
              <textarea 
                rows={4}
                value={formData.uuDiemCamKetTuDuong}
                onChange={e => handleChange('uuDiemCamKetTuDuong', e.target.value)}
              />
            </div>
          </div>

          {/* KHỐI 4: HẠN CHẾ, KHUYẾT ĐIỂM & NGUYÊN NHÂN */}
          <div className="review-card-section">
            <div className="section-heading">
              <AlertCircle size={18} />
              <h3>II. Hạn Chế, Khuyết Điểm Và Nguyên Nhân</h3>
            </div>
            <div className="form-group">
              <label>1. Hạn chế, khuyết điểm (chỉ ra thẳng thắn)</label>
              <textarea 
                rows={4}
                value={formData.hanCheKhuyetDiem}
                onChange={e => handleChange('hanCheKhuyetDiem', e.target.value)}
              />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>2.1. Nguyên nhân khách quan</label>
                <textarea 
                  rows={3}
                  value={formData.nguyenNhanKhachQuan}
                  onChange={e => handleChange('nguyenNhanKhachQuan', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>2.2. Nguyên nhân chủ quan (chủ yếu)</label>
                <textarea 
                  rows={3}
                  value={formData.nguyenNhanChuQuan}
                  onChange={e => handleChange('nguyenNhanChuQuan', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* KHỐI 5: KHẮC PHỤC, GIẢI TRÌNH & PHƯƠNG HƯỚNG */}
          <div className="review-card-section">
            <div className="section-heading">
              <FileText size={18} />
              <h3>III, IV & V. Khắc Phục, Giải Trình & Phương Hướng</h3>
            </div>
            <div className="form-group">
              <label>III. Kết quả khắc phục hạn chế, khuyết điểm đã được chỉ ra ở các kỳ kiểm điểm trước (năm 2025)</label>
              <textarea 
                rows={3}
                value={formData.ketQuaKhacPhucNamTruoc}
                onChange={e => handleChange('ketQuaKhacPhucNamTruoc', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>IV. Giải trình / Làm rõ trách nhiệm cá nhân đối với hạn chế của tập thể (nếu có)</label>
              <textarea 
                rows={3}
                value={formData.giaiTrinhTrachNhiem}
                onChange={e => handleChange('giaiTrinhTrachNhiem', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>V. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm trong thời gian tới</label>
              <textarea 
                rows={4}
                value={formData.phuongHuongKhacPhuc}
                onChange={e => handleChange('phuongHuongKhacPhuc', e.target.value)}
              />
            </div>
          </div>

          {/* KHỐI 6: TỰ XẾP LOẠI CHẤT LƯỢNG */}
          <div className="review-card-section">
            <div className="section-heading">
              <Award size={18} />
              <h3>B. Tự Đánh Giá, Xếp Loại Chất Lượng</h3>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>1. Tự xếp loại chất lượng Đảng viên</label>
                <select 
                  value={formData.tuXepLoaiDangVien}
                  onChange={e => handleChange('tuXepLoaiDangVien', e.target.value)}
                >
                  <option value="Hoàn thành xuất sắc nhiệm vụ">Hoàn thành xuất sắc nhiệm vụ</option>
                  <option value="Hoàn thành tốt nhiệm vụ">Hoàn thành tốt nhiệm vụ</option>
                  <option value="Hoàn thành nhiệm vụ">Hoàn thành nhiệm vụ</option>
                  <option value="Không hoàn thành nhiệm vụ">Không hoàn thành nhiệm vụ</option>
                </select>
              </div>
              <div className="form-group">
                <label>2. Tự xếp loại chất lượng Viên chức / Người lao động</label>
                <select 
                  value={formData.tuXepLoaiVienChuc}
                  onChange={e => handleChange('tuXepLoaiVienChuc', e.target.value)}
                >
                  <option value="Hoàn thành xuất sắc nhiệm vụ">Hoàn thành xuất sắc nhiệm vụ</option>
                  <option value="Hoàn thành tốt nhiệm vụ">Hoàn thành tốt nhiệm vụ</option>
                  <option value="Hoàn thành nhiệm vụ">Hoàn thành nhiệm vụ</option>
                  <option value="Không hoàn thành nhiệm vụ">Không hoàn thành nhiệm vụ</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TRANG GIẤY A4 XEM TRƯỚC (LIVE PAPER VIEW) */}
        <div className="review-preview-column">
          <div className="paper-controls">
            <span className="paper-badge">
              <FileText size={14} /> Mẫu 02B-HD KĐ.ĐG (Chuẩn A4)
            </span>
            <div className="paper-btns">
              <button onClick={handlePrint} className="btn-sm"><Printer size={14} /> In</button>
              <button onClick={handleDownloadDocx} className="btn-sm primary"><Download size={14} /> Tải .doc</button>
            </div>
          </div>

          <div className="paper-a4 printable-area">
            {/* Header Mẫu 02B */}
            <div className="doc-header-table">
              <div className="doc-header-col left">
                <p className="org-upper">{formData.tinhUy || 'ĐẢNG BỘ THÀNH PHỐ HỒ CHÍ MINH'}</p>
                <p className="org-upper">{formData.huyenUy || 'ĐẢNG BỘ CÁC TRƯỜNG CAO ĐẲNG ĐẠI HỌC THÀNH PHỐ HỒ CHÍ MINH'}</p>
                <p className="org-name">{formData.dangBoCoSo || 'Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn'}</p>
                <p className="org-name"><strong>{formData.chiBo || 'Chi bộ 1'}</strong></p>
                <div className="dash-line"></div>
                <p className="doc-num">*</p>
              </div>
              <div className="doc-header-col right">
                <p className="motto-top"><strong><u>ĐẢNG CỘNG SẢN VIỆT NAM</u></strong></p>
                <p className="doc-template-code">
                  <strong>Mẫu 02B-HD KĐ.ĐG</strong><br />
                  <em>(Dành cho cá nhân không giữ chức vụ lãnh đạo, quản lý)</em>
                </p>
                <p className="doc-date">
                  <em>{formData.diaDanh || 'Thành phố Hồ Chí Minh'}, ngày {formData.ngayKhai} tháng {formData.thangKhai} năm {formData.namKhai}</em>
                </p>
              </div>
            </div>

            <div className="doc-title-block">
              <h2 className="doc-main-title">BẢN KIỂM ĐIỂM CÁ NHÂN</h2>
              <h3 className="doc-sub-title">Năm {formData.namKiemDiem || '2026'}</h3>
            </div>

            <div className="doc-personal-info">
              <p>Họ và tên: <strong>{formData.hoVaTen || '....................................................................'}</strong>. Ngày sinh: {formData.namSinh || '................................'}</p>
              <p>Chức vụ Đảng: {formData.chucVuDang || 'Đảng viên'}</p>
              <p>Chức vụ chính quyền, chuyên môn: {formData.chucVuChinhQuyen || 'Giảng viên'}</p>
              <p>Chức vụ đoàn thể: {formData.chucVuDoanThe || 'Đoàn viên công đoàn'}</p>
              <p>Đơn vị công tác: {formData.donViCongTac || 'Trường Cao đẳng Bách khoa Nam Sài Gòn'}</p>
              <p>Chi bộ sinh hoạt: {formData.chiBoSinhHoat || 'Chi bộ 1'}</p>
            </div>

            <div className="doc-content-body">
              <p className="doc-heading-level-1"><strong>A. NỘI DUNG KIỂM ĐIỂM</strong></p>
              
              <p className="doc-heading-level-2"><strong>I. Ưu điểm, kết quả đạt được</strong></p>
              <p className="doc-heading-level-3"><strong>1. Phẩm chất chính trị, đạo đức, lối sống; ý thức tổ chức kỷ luật, trách nhiệm nêu gương</strong></p>
              <div className="doc-text-paragraph">{formData.uuDiemPhamChatChinhTri}</div>

              <p className="doc-heading-level-3"><strong>2. Thực hiện nhiệm vụ, quyền hạn và kết quả thực hiện các chỉ tiêu, nhiệm vụ được giao trong năm</strong></p>
              <div className="doc-text-paragraph">{formData.uuDiemThucHienNhiemVu}</div>

              <p className="doc-heading-level-3"><strong>3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu hằng năm</strong></p>
              <div className="doc-text-paragraph">{formData.uuDiemCamKetTuDuong}</div>

              <p className="doc-heading-level-2"><strong>II. Hạn chế, khuyết điểm và nguyên nhân</strong></p>
              <p className="doc-heading-level-3"><strong>1. Hạn chế, khuyết điểm:</strong></p>
              <div className="doc-text-paragraph">{formData.hanCheKhuyetDiem}</div>

              <p className="doc-heading-level-3"><strong>2. Nguyên nhân của hạn chế, khuyết điểm:</strong></p>
              <p><em>- Nguyên nhân khách quan:</em> {formData.nguyenNhanKhachQuan}</p>
              <p><em>- Nguyên nhân chủ quan:</em> {formData.nguyenNhanChuQuan}</p>

              <p className="doc-heading-level-2"><strong>III. Kết quả khắc phục hạn chế, khuyết điểm đã được chỉ ra ở các kỳ kiểm điểm trước</strong></p>
              <div className="doc-text-paragraph">{formData.ketQuaKhacPhucNamTruoc}</div>

              <p className="doc-heading-level-2"><strong>IV. Giải trình / Làm rõ trách nhiệm cá nhân đối với hạn chế của tập thể (nếu có)</strong></p>
              <div className="doc-text-paragraph">{formData.giaiTrinhTrachNhiem}</div>

              <p className="doc-heading-level-2"><strong>V. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm</strong></p>
              <div className="doc-text-paragraph">{formData.phuongHuongKhacPhuc}</div>

              <p className="doc-heading-level-1" style={{ marginTop: '16px' }}><strong>B. TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG</strong></p>
              
              <p className="doc-heading-level-2"><strong>1. Tự đánh giá, xếp loại chất lượng đảng viên:</strong></p>
              <div className="checkbox-list">
                <span className={formData.tuXepLoaiDangVien === 'Hoàn thành xuất sắc nhiệm vụ' ? 'checked' : ''}>[ {formData.tuXepLoaiDangVien === 'Hoàn thành xuất sắc nhiệm vụ' ? 'X' : '  '} ] Hoàn thành xuất sắc nhiệm vụ</span><br />
                <span className={formData.tuXepLoaiDangVien === 'Hoàn thành tốt nhiệm vụ' ? 'checked' : ''}>[ {formData.tuXepLoaiDangVien === 'Hoàn thành tốt nhiệm vụ' ? 'X' : '  '} ] Hoàn thành tốt nhiệm vụ</span><br />
                <span className={formData.tuXepLoaiDangVien === 'Hoàn thành nhiệm vụ' ? 'checked' : ''}>[ {formData.tuXepLoaiDangVien === 'Hoàn thành nhiệm vụ' ? 'X' : '  '} ] Hoàn thành nhiệm vụ</span><br />
                <span className={formData.tuXepLoaiDangVien === 'Không hoàn thành nhiệm vụ' ? 'checked' : ''}>[ {formData.tuXepLoaiDangVien === 'Không hoàn thành nhiệm vụ' ? 'X' : '  '} ] Không hoàn thành nhiệm vụ</span>
              </div>

              <p className="doc-heading-level-2"><strong>2. Tự đánh giá, xếp loại chất lượng viên chức / người lao động:</strong></p>
              <div className="checkbox-list">
                <span className={formData.tuXepLoaiVienChuc === 'Hoàn thành xuất sắc nhiệm vụ' ? 'checked' : ''}>[ {formData.tuXepLoaiVienChuc === 'Hoàn thành xuất sắc nhiệm vụ' ? 'X' : '  '} ] Hoàn thành xuất sắc nhiệm vụ</span><br />
                <span className={formData.tuXepLoaiVienChuc === 'Hoàn thành tốt nhiệm vụ' ? 'checked' : ''}>[ {formData.tuXepLoaiVienChuc === 'Hoàn thành tốt nhiệm vụ' ? 'X' : '  '} ] Hoàn thành tốt nhiệm vụ</span><br />
                <span className={formData.tuXepLoaiVienChuc === 'Hoàn thành nhiệm vụ' ? 'checked' : ''}>[ {formData.tuXepLoaiVienChuc === 'Hoàn thành nhiệm vụ' ? 'X' : '  '} ] Hoàn thành nhiệm vụ</span><br />
                <span className={formData.tuXepLoaiVienChuc === 'Không hoàn thành nhiệm vụ' ? 'checked' : ''}>[ {formData.tuXepLoaiVienChuc === 'Không hoàn thành nhiệm vụ' ? 'X' : '  '} ] Không hoàn thành nhiệm vụ</span>
              </div>
            </div>

            {/* Chữ ký văn bản Đảng Mẫu 02B */}
            <div className="doc-signature-table">
              <div className="doc-sig-col">
                <p><strong>ĐÁNH GIÁ, XẾP LOẠI CỦA CHI BỘ</strong></p>
                <p className="sig-sub"><em>(Xếp loại chất lượng đảng viên)</em></p>
                <div style={{ height: '70px' }}></div>
                <p><strong>T/M CHI ỦY</strong></p>
                <p className="sig-sub"><em>(Ký, ghi rõ họ tên)</em></p>
              </div>
              <div className="doc-sig-col">
                <p className="sig-date"><em>{formData.diaDanh || 'Thành phố Hồ Chí Minh'}, ngày {formData.ngayKhai} tháng {formData.thangKhai} năm {formData.namKhai}</em></p>
                <p><strong>NGƯỜI TỰ KIỂM ĐIỂM</strong></p>
                <p className="sig-sub"><em>(Ký, ghi rõ họ tên)</em></p>
                <div style={{ height: '70px' }}></div>
                <p><strong>{formData.hoVaTen || '...........................................'}</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL TRỢ LÝ AI SOẠN THẢO */}
      {showAiModal && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            <div className="modal-header">
              <div className="modal-icon"><Sparkles size={22} /></div>
              <div>
                <h3>Trợ Lý AI Viết Bản Kiểm Điểm (Mẫu 02B)</h3>
                <p>Nhập vị trí chuyên môn, khối lượng công việc, ưu điểm hoặc một vài gạch đầu dòng để AI chuẩn hóa văn phong Đảng.</p>
              </div>
            </div>
            
            <div className="modal-body">
              <label>Mô tả ngắn gọn công tác trong năm 2026 của bạn:</label>
              <textarea 
                rows={5}
                placeholder="Ví dụ: Tôi là Giảng viên Khoa Công nghệ thông tin, hoàn thành 100% giờ giảng dạy chuyên môn, tham gia nghiên cứu đề tài khoa học, tích cực xây dựng bài giảng số. Tinh thần đóng góp ý kiến đôi khi còn ít, chưa chủ động ngoại ngữ..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
              />
              {aiError && (
                <div className="ai-error-box">
                  <AlertCircle size={16} /> {aiError}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-modal cancel" 
                onClick={() => setShowAiModal(false)}
                disabled={isAiLoading}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="btn-modal submit" 
                onClick={handleAiGenerate}
                disabled={isAiLoading || !aiPrompt.trim()}
              >
                {isAiLoading ? 'Đang soạn thảo...' : 'Tạo nội dung kiểm điểm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

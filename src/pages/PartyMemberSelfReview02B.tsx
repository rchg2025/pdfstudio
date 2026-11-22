import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Printer, 
  Building2, 
  Award,
  AlertCircle,
  Wand2,
  Loader2
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

  // Trạng thái AI viết lại theo từng mục (field-level AI loading)
  const [loadingField, setLoadingField] = useState<keyof PartySelfReview02BData | null>(null);

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

  // Trợ lý AI Viết Lại Từng Mục Cụ Thể (Field-level AI Rewrite)
  const handleRewriteSection = async (field: keyof PartySelfReview02BData, fieldLabel: string) => {
    setLoadingField(field);
    try {
      const currentValue = formData[field] as string;
      const promptInstruction = `
Bạn là chuyên gia thư ký xây dựng Đảng cấp cao. Nhiệm vụ của bạn là viết lại và chuẩn hóa nội dung mục "${fieldLabel}" trong "Bản kiểm điểm đảng viên cuối năm Mẫu 02B (năm 2026, Hướng dẫn 43-HD/BTCTW & Công văn 2772-CV/BTCTW)".
Chức danh người kiểm điểm: ${formData.chucVuChinhQuyen || 'Giảng viên/Nhân viên'}, Chức vụ Đảng: ${formData.chucVuDang || 'Đảng viên'}, Đơn vị: ${formData.donViCongTac || 'Trường Cao đẳng Bách khoa Nam Sài Gòn'}.
Yêu cầu văn phong: Chuẩn mực, trang trọng, thẳng thắn, đúng nguyên tắc tự phê bình và phê bình của Đảng.

Nội dung hiện tại hoặc ý chính cần viết lại:
"""
${currentValue || 'Hãy viết nội dung chuẩn mực, đầy đủ và nêu cao tinh thần trách nhiệm của người đảng viên.'}
"""

Trả về duy nhất JSON hợp lệ theo định dạng: {"content": "đoạn văn bản đã hoàn thiện chuẩn xác theo đúng ngôn phong của Đảng"}
      `;

      const response = await fetch('/api/qa-wall?action=generate-ai-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: promptInstruction,
          count: 1
        })
      });

      if (!response.ok) throw new Error('Không thể kết nối đến máy chủ AI');

      const resData = await response.json();
      const rawText = resData?.questions?.[0]?.question || resData?.text || '';
      let cleanText = '';
      try {
        const parsed = JSON.parse(rawText.replace(/```json\s*|```/g, '').trim());
        cleanText = parsed.content || parsed.text || '';
      } catch {
        cleanText = rawText.replace(/```json\s*|```/g, '').trim();
      }
      
      if (cleanText) {
        setFormData(prev => ({
          ...prev,
          [field]: cleanText
        }));
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2500);
      }
    } catch (err: any) {
      console.error(`Lỗi AI viết mục ${field}:`, err);
      alert('Có lỗi khi gọi AI viết lại mục này. Vui lòng thử lại!');
    } finally {
      setLoadingField(null);
    }
  };

  // Trợ lý AI Toàn Diện (Modal)
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
      setAiError(err.message || 'Có lỗi xảy ra khi gọi AI. Vui lòng thử lại.');
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
            <Sparkles size={18} />
            AI Soạn Thảo Toàn Bản
          </button>
          <button 
            type="button" 
            className="btn-review-act primary"
            onClick={handleDownloadDocx}
          >
            <Download size={18} />
            Tải File Word (.doc)
          </button>
          <button 
            type="button" 
            className="btn-review-act secondary"
            onClick={handlePrint}
          >
            <Printer size={18} />
            In Bản Kiểm Điểm
          </button>
        </div>
      </div>

      {savedToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#059669',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 9999,
          fontWeight: 600
        }}>
          <Check size={18} /> Đã cập nhật và tự động lưu nháp!
        </div>
      )}

      {/* 2-COLUMN SPLIT: FORM TRÁI - PREVIEW PHẢI */}
      <div className="party-review-grid">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className="party-review-form">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button 
              type="button" 
              onClick={handleReset}
              className="btn-quick-k"
              style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}
            >
              <RotateCcw size={15} /> Đặt lại mẫu mặc định
            </button>
          </div>

          {/* 1. THÔNG TIN CẤP ỦY & CÁ NHÂN */}
          <div className="review-section">
            <div className="review-sec-badge">
              <Building2 size={18} />
              1. Thông Tin Cấp Ủy & Đảng Viên Tự Kiểm Điểm
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Đảng bộ cấp trên / Tỉnh ủy</label>
                <input 
                  type="text" 
                  value={formData.tinhUy} 
                  onChange={e => handleChange('tinhUy', e.target.value)} 
                  placeholder="Ví dụ: ĐẢNG BỘ THÀNH PHỐ HỒ CHÍ MINH"
                />
              </div>
              <div className="review-field">
                <label>Huyện ủy / Đảng ủy trực thuộc</label>
                <input 
                  type="text" 
                  value={formData.huyenUy} 
                  onChange={e => handleChange('huyenUy', e.target.value)} 
                  placeholder="Ví dụ: ĐẢNG BỘ CÁC TRƯỜNG CAO ĐẲNG ĐẠI HỌC THÀNH PHỐ HỒ CHÍ MINH"
                />
              </div>
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Đảng bộ cơ sở</label>
                <input 
                  type="text" 
                  value={formData.dangBoCoSo} 
                  onChange={e => handleChange('dangBoCoSo', e.target.value)} 
                  placeholder="Ví dụ: Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn"
                />
              </div>
              <div className="review-field">
                <label>Chi bộ trực thuộc</label>
                <input 
                  type="text" 
                  value={formData.chiBo} 
                  onChange={e => handleChange('chiBo', e.target.value)} 
                  placeholder="Ví dụ: Chi bộ 1"
                />
              </div>
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Năm kiểm điểm</label>
                <input 
                  type="text" 
                  value={formData.namKiemDiem} 
                  onChange={e => handleChange('namKiemDiem', e.target.value)} 
                  placeholder="2026"
                />
              </div>
              <div className="review-field">
                <label>Địa danh lập bản kiểm điểm</label>
                <input 
                  type="text" 
                  value={formData.diaDanh} 
                  onChange={e => handleChange('diaDanh', e.target.value)} 
                  placeholder="Thành phố Hồ Chí Minh"
                />
              </div>
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Họ và tên (chữ in hoa)</label>
                <input 
                  type="text" 
                  value={formData.hoVaTen} 
                  onChange={e => handleChange('hoVaTen', e.target.value.toUpperCase())} 
                  placeholder="NGUYỄN VĂN A"
                  style={{ fontWeight: 'bold' }}
                />
              </div>
              <div className="review-field">
                <label>Ngày, tháng, năm sinh</label>
                <input 
                  type="text" 
                  value={formData.namSinh} 
                  onChange={e => handleChange('namSinh', e.target.value)} 
                  placeholder="dd/mm/yyyy"
                />
              </div>
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Chức vụ Đảng</label>
                <input 
                  type="text" 
                  value={formData.chucVuDang} 
                  onChange={e => handleChange('chucVuDang', e.target.value)} 
                  placeholder="Đảng viên"
                />
              </div>
              <div className="review-field">
                <label>Chức vụ chuyên môn / Giảng dạy</label>
                <input 
                  type="text" 
                  value={formData.chucVuChinhQuyen} 
                  onChange={e => handleChange('chucVuChinhQuyen', e.target.value)} 
                  placeholder="Giảng viên, Chuyên viên..."
                />
              </div>
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Chức vụ đoàn thể</label>
                <input 
                  type="text" 
                  value={formData.chucVuDoanThe} 
                  onChange={e => handleChange('chucVuDoanThe', e.target.value)} 
                  placeholder="Đoàn viên công đoàn..."
                />
              </div>
              <div className="review-field">
                <label>Chi bộ sinh hoạt</label>
                <input 
                  type="text" 
                  value={formData.chiBoSinhHoat} 
                  onChange={e => handleChange('chiBoSinhHoat', e.target.value)} 
                  placeholder="Chi bộ 1"
                />
              </div>
            </div>

            <div className="review-field">
              <label>Đơn vị công tác</label>
              <input 
                type="text" 
                value={formData.donViCongTac} 
                onChange={e => handleChange('donViCongTac', e.target.value)} 
                placeholder="Trường Cao đẳng Bách khoa Nam Sài Gòn"
              />
            </div>
          </div>

          {/* 2. I. ƯU ĐIỂM, KẾT QUẢ ĐẠT ĐƯỢC (3 MỤC CHUẨN MẪU 02B) */}
          <div className="review-section">
            <div className="review-sec-badge">
              <FileText size={18} />
              I. Ưu Điểm, Kết Quả Đạt Được (Mẫu 02B)
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>1. Phẩm chất chính trị, đạo đức, lối sống, ý thức tổ chức kỷ luật, trách nhiệm nêu gương</label>
                <button 
                  type="button" 
                  className="btn-field-ai"
                  onClick={() => handleRewriteSection('uuDiemPhamChatChinhTri', 'Phẩm chất chính trị, đạo đức, lối sống, ý thức tổ chức kỷ luật')}
                  disabled={loadingField === 'uuDiemPhamChatChinhTri'}
                >
                  {loadingField === 'uuDiemPhamChatChinhTri' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  AI Viết lại mục này
                </button>
              </div>
              <textarea 
                rows={6}
                value={formData.uuDiemPhamChatChinhTri}
                onChange={e => handleChange('uuDiemPhamChatChinhTri', e.target.value)}
              />
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>2. Thực hiện nhiệm vụ, quyền hạn và chỉ tiêu chuyên môn được giao trong năm</label>
                <button 
                  type="button" 
                  className="btn-field-ai"
                  onClick={() => handleRewriteSection('uuDiemThucHienNhiemVu', 'Thực hiện nhiệm vụ, quyền hạn và chỉ tiêu chuyên môn, giảng dạy/công tác')}
                  disabled={loadingField === 'uuDiemThucHienNhiemVu'}
                >
                  {loadingField === 'uuDiemThucHienNhiemVu' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  AI Viết lại mục này
                </button>
              </div>
              <textarea 
                rows={6}
                value={formData.uuDiemThucHienNhiemVu}
                onChange={e => handleChange('uuDiemThucHienNhiemVu', e.target.value)}
              />
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu hằng năm (theo Quy định 213-QĐ/TW)</label>
                <button 
                  type="button" 
                  className="btn-field-ai"
                  onClick={() => handleRewriteSection('uuDiemCamKetTuDuong', 'Thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu và mối liên hệ nơi cư trú theo Quy định 213')}
                  disabled={loadingField === 'uuDiemCamKetTuDuong'}
                >
                  {loadingField === 'uuDiemCamKetTuDuong' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  AI Viết lại mục này
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.uuDiemCamKetTuDuong}
                onChange={e => handleChange('uuDiemCamKetTuDuong', e.target.value)}
              />
            </div>
          </div>

          {/* 3. II. HẠN CHẾ, KHUYẾT ĐIỂM VÀ NGUYÊN NHÂN */}
          <div className="review-section">
            <div className="review-sec-badge">
              <AlertCircle size={18} />
              II. Hạn Chế, Khuyết Điểm Và Nguyên Nhân
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>1. Hạn chế, khuyết điểm</label>
                <button 
                  type="button" 
                  className="btn-field-ai"
                  onClick={() => handleRewriteSection('hanCheKhuyetDiem', 'Chỉ ra hạn chế, khuyết điểm cụ thể của đảng viên')}
                  disabled={loadingField === 'hanCheKhuyetDiem'}
                >
                  {loadingField === 'hanCheKhuyetDiem' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  AI Viết lại mục này
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.hanCheKhuyetDiem}
                onChange={e => handleChange('hanCheKhuyetDiem', e.target.value)}
              />
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <div className="review-field-header">
                  <label>2.1. Nguyên nhân khách quan</label>
                  <button 
                    type="button" 
                    className="btn-field-ai"
                    onClick={() => handleRewriteSection('nguyenNhanKhachQuan', 'Nguyên nhân khách quan của hạn chế')}
                    disabled={loadingField === 'nguyenNhanKhachQuan'}
                  >
                    {loadingField === 'nguyenNhanKhachQuan' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                    AI
                  </button>
                </div>
                <textarea 
                  rows={3}
                  value={formData.nguyenNhanKhachQuan}
                  onChange={e => handleChange('nguyenNhanKhachQuan', e.target.value)}
                />
              </div>

              <div className="review-field">
                <div className="review-field-header">
                  <label>2.2. Nguyên nhân chủ quan (chủ yếu)</label>
                  <button 
                    type="button" 
                    className="btn-field-ai"
                    onClick={() => handleRewriteSection('nguyenNhanChuQuan', 'Nguyên nhân chủ quan xuất phát từ bản thân đảng viên')}
                    disabled={loadingField === 'nguyenNhanChuQuan'}
                  >
                    {loadingField === 'nguyenNhanChuQuan' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                    AI
                  </button>
                </div>
                <textarea 
                  rows={3}
                  value={formData.nguyenNhanChuQuan}
                  onChange={e => handleChange('nguyenNhanChuQuan', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 4. III, IV & V. KHẮC PHỤC & PHƯƠNG HƯỚNG */}
          <div className="review-section">
            <div className="review-sec-badge">
              <FileText size={18} />
              III, IV & V. Khắc Phục, Giải Trình & Phương Hướng
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>III. Kết quả khắc phục hạn chế, khuyết điểm năm trước (năm 2025)</label>
                <button 
                  type="button" 
                  className="btn-field-ai"
                  onClick={() => handleRewriteSection('ketQuaKhacPhucNamTruoc', 'Kết quả khắc phục những hạn chế, khuyết điểm đã chỉ ra ở kỳ kiểm điểm năm trước')}
                  disabled={loadingField === 'ketQuaKhacPhucNamTruoc'}
                >
                  {loadingField === 'ketQuaKhacPhucNamTruoc' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  AI Viết lại mục này
                </button>
              </div>
              <textarea 
                rows={3}
                value={formData.ketQuaKhacPhucNamTruoc}
                onChange={e => handleChange('ketQuaKhacPhucNamTruoc', e.target.value)}
              />
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>IV. Giải trình / Làm rõ trách nhiệm cá nhân đối với hạn chế của tập thể (nếu có)</label>
                <button 
                  type="button" 
                  className="btn-field-ai"
                  onClick={() => handleRewriteSection('giaiTrinhTrachNhiem', 'Giải trình làm rõ trách nhiệm cá nhân đối với hạn chế của tập thể hoặc vấn đề gợi ý kiểm điểm')}
                  disabled={loadingField === 'giaiTrinhTrachNhiem'}
                >
                  {loadingField === 'giaiTrinhTrachNhiem' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  AI Viết lại mục này
                </button>
              </div>
              <textarea 
                rows={3}
                value={formData.giaiTrinhTrachNhiem}
                onChange={e => handleChange('giaiTrinhTrachNhiem', e.target.value)}
              />
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>V. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm</label>
                <button 
                  type="button" 
                  className="btn-field-ai"
                  onClick={() => handleRewriteSection('phuongHuongKhacPhuc', 'Phương hướng, giải pháp cụ thể khắc phục hạn chế trong năm tới')}
                  disabled={loadingField === 'phuongHuongKhacPhuc'}
                >
                  {loadingField === 'phuongHuongKhacPhuc' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  AI Viết lại mục này
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.phuongHuongKhacPhuc}
                onChange={e => handleChange('phuongHuongKhacPhuc', e.target.value)}
              />
            </div>
          </div>

          {/* 5. TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG */}
          <div className="review-section">
            <div className="review-sec-badge">
              <Award size={18} />
              B. Tự Đánh Giá, Xếp Loại Chất Lượng
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>1. Tự xếp loại chất lượng Đảng viên</label>
                <select 
                  value={formData.tuXepLoaiDangVien}
                  onChange={e => handleChange('tuXepLoaiDangVien', e.target.value as any)}
                >
                  <option value="Hoàn thành xuất sắc nhiệm vụ">Hoàn thành xuất sắc nhiệm vụ</option>
                  <option value="Hoàn thành tốt nhiệm vụ">Hoàn thành tốt nhiệm vụ</option>
                  <option value="Hoàn thành nhiệm vụ">Hoàn thành nhiệm vụ</option>
                  <option value="Không hoàn thành nhiệm vụ">Không hoàn thành nhiệm vụ</option>
                </select>
              </div>

              <div className="review-field">
                <label>2. Tự xếp loại chất lượng Viên chức / Người lao động</label>
                <select 
                  value={formData.tuXepLoaiVienChuc}
                  onChange={e => handleChange('tuXepLoaiVienChuc', e.target.value as any)}
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

        {/* CỘT PHẢI: XEM TRƯỚC PAPER VIEW A4 */}
        <div className="party-review-sticky">
          <div className="review-preview-toolbar">
            <div className="review-preview-title">
              <FileText size={18} color="#b91c1c" />
              Xem Trước Bản Kiểm Điểm A4 (Chuẩn Mẫu 02B)
            </div>
            <button 
              type="button" 
              className="btn-quick-k"
              onClick={handleDownloadDocx}
            >
              <Download size={14} /> Tải .doc
            </button>
          </div>

          <div className="review-paper-viewport">
            <div className="review-paper-sheet">
              {/* Header 2 cột */}
              <div className="paper-header-grid">
                <div className="paper-org-left">
                  <div className="org-upper">{formData.tinhUy || 'ĐẢNG BỘ THÀNH PHỐ HỒ CHÍ MINH'}</div>
                  <div className="org-upper">{formData.huyenUy || 'ĐẢNG BỘ CÁC TRƯỜNG CAO ĐẲNG ĐẠI HỌC THÀNH PHỐ HỒ CHÍ MINH'}</div>
                  <div style={{ fontWeight: 'bold' }}>{formData.dangBoCoSo || 'Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn'}</div>
                  <div>Chi bộ: <strong>{formData.chiBo || 'Chi bộ 1'}</strong></div>
                </div>
                <div className="paper-motto-right">
                  <div className="motto-main">ĐẢNG CỘNG SẢN VIỆT NAM</div>
                  <div className="motto-stars">***</div>
                  <div className="motto-date">
                    {formData.diaDanh || 'Thành phố Hồ Chí Minh'}, ngày {formData.ngayKhai || '....'} tháng {formData.thangKhai || '....'} năm {formData.namKhai || '2026'}
                  </div>
                </div>
              </div>

              {/* Tiêu đề */}
              <div className="paper-title-block">
                <div style={{ fontSize: '11pt', fontWeight: 'bold', textAlign: 'right', marginBottom: '4px' }}>Mẫu 02B-HD KĐ.ĐG</div>
                <h2 className="paper-title-main">BẢN KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CỦA CÁ NHÂN</h2>
                <div className="paper-title-sub">Năm {formData.namKiemDiem || '2026'}</div>
                <div className="paper-note">
                  (Dành cho cá nhân không giữ chức vụ lãnh đạo, quản lý; dùng cho kiểm điểm năm 2026 theo Hướng dẫn số 43-HD/BTCTW và Công văn số 2772-CV/BTCTW)
                </div>
              </div>

              {/* Thông tin */}
              <div className="paper-p">
                Họ và tên: <strong style={{ textTransform: 'uppercase' }}>{formData.hoVaTen || '....................................................................'}</strong>. Ngày sinh: {formData.namSinh || '................................'}
              </div>
              <div className="paper-p">
                Chức vụ Đảng: {formData.chucVuDang || 'Đảng viên'}
              </div>
              <div className="paper-p">
                Chức vụ chính quyền, chuyên môn: {formData.chucVuChinhQuyen || 'Giảng viên'}
              </div>
              <div className="paper-p">
                Chức vụ đoàn thể: {formData.chucVuDoanThe || 'Đoàn viên công đoàn'}
              </div>
              <div className="paper-p">
                Đơn vị công tác: {formData.donViCongTac || 'Trường Cao đẳng Bách khoa Nam Sài Gòn'}
              </div>
              <div className="paper-p">
                Chi bộ sinh hoạt: {formData.chiBoSinhHoat || 'Chi bộ 1'}
              </div>

              <div className="paper-heading-1">A. NỘI DUNG KIỂM ĐIỂM</div>

              <div className="paper-heading-2">I. Ưu điểm, kết quả đạt được</div>
              <div className="paper-heading-3">1. Phẩm chất chính trị, đạo đức, lối sống; ý thức tổ chức kỷ luật, trách nhiệm nêu gương</div>
              <div className="paper-text-block">{formData.uuDiemPhamChatChinhTri}</div>

              <div className="paper-heading-3">2. Thực hiện nhiệm vụ, quyền hạn và kết quả thực hiện các chỉ tiêu, nhiệm vụ được giao trong năm</div>
              <div className="paper-text-block">{formData.uuDiemThucHienNhiemVu}</div>

              <div className="paper-heading-3">3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu hằng năm</div>
              <div className="paper-text-block">{formData.uuDiemCamKetTuDuong}</div>

              <div className="paper-heading-2">II. Hạn chế, khuyết điểm và nguyên nhân</div>
              <div className="paper-heading-3">1. Hạn chế, khuyết điểm:</div>
              <div className="paper-text-block">{formData.hanCheKhuyetDiem}</div>

              <div className="paper-heading-3">2. Nguyên nhân của hạn chế, khuyết điểm:</div>
              <div className="paper-p"><em>- Nguyên nhân khách quan:</em> {formData.nguyenNhanKhachQuan}</div>
              <div className="paper-p"><em>- Nguyên nhân chủ quan:</em> {formData.nguyenNhanChuQuan}</div>

              <div className="paper-heading-2">III. Kết quả khắc phục hạn chế, khuyết điểm đã được chỉ ra ở các kỳ kiểm điểm trước</div>
              <div className="paper-text-block">{formData.ketQuaKhacPhucNamTruoc}</div>

              <div className="paper-heading-2">IV. Giải trình / Làm rõ trách nhiệm cá nhân đối với hạn chế của tập thể (nếu có)</div>
              <div className="paper-text-block">{formData.giaiTrinhTrachNhiem}</div>

              <div className="paper-heading-2">V. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm</div>
              <div className="paper-text-block">{formData.phuongHuongKhacPhuc}</div>

              <div className="paper-heading-1" style={{ marginTop: '16px' }}>B. TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG</div>
              
              <div className="paper-heading-2">1. Tự đánh giá, xếp loại chất lượng đảng viên:</div>
              <div style={{ marginLeft: '10mm', marginTop: '4px', marginBottom: '4px' }}>
                <div>[{formData.tuXepLoaiDangVien === 'Hoàn thành xuất sắc nhiệm vụ' ? 'X' : ' '}] Hoàn thành xuất sắc nhiệm vụ</div>
                <div>[{formData.tuXepLoaiDangVien === 'Hoàn thành tốt nhiệm vụ' ? 'X' : ' '}] Hoàn thành tốt nhiệm vụ</div>
                <div>[{formData.tuXepLoaiDangVien === 'Hoàn thành nhiệm vụ' ? 'X' : ' '}] Hoàn thành nhiệm vụ</div>
                <div>[{formData.tuXepLoaiDangVien === 'Không hoàn thành nhiệm vụ' ? 'X' : ' '}] Không hoàn thành nhiệm vụ</div>
              </div>

              <div className="paper-heading-2" style={{ marginTop: '8px' }}>2. Tự đánh giá, xếp loại chất lượng viên chức, người lao động:</div>
              <div style={{ marginLeft: '10mm', marginTop: '4px', marginBottom: '4px' }}>
                <div>[{formData.tuXepLoaiVienChuc === 'Hoàn thành xuất sắc nhiệm vụ' ? 'X' : ' '}] Hoàn thành xuất sắc nhiệm vụ</div>
                <div>[{formData.tuXepLoaiVienChuc === 'Hoàn thành tốt nhiệm vụ' ? 'X' : ' '}] Hoàn thành tốt nhiệm vụ</div>
                <div>[{formData.tuXepLoaiVienChuc === 'Hoàn thành nhiệm vụ' ? 'X' : ' '}] Hoàn thành nhiệm vụ</div>
                <div>[{formData.tuXepLoaiVienChuc === 'Không hoàn thành nhiệm vụ' ? 'X' : ' '}] Không hoàn thành nhiệm vụ</div>
              </div>

              {/* Chữ ký 2 bên */}
              <div className="paper-signature-grid">
                <div className="sig-col-center">
                  <div style={{ fontWeight: 'bold' }}>ĐÁNH GIÁ, XẾP LOẠI CỦA CHI BỘ</div>
                  <div style={{ fontStyle: 'italic', fontSize: '10pt', marginBottom: '50px' }}>(Xếp loại chất lượng đảng viên)</div>
                  <div style={{ fontWeight: 'bold' }}>T/M CHI ỦY (CHI BỘ)</div>
                  <div style={{ fontStyle: 'italic', fontSize: '10pt' }}>(Ký, ghi rõ họ tên)</div>
                </div>

                <div className="sig-col-center">
                  <div style={{ fontStyle: 'italic', fontSize: '11pt' }}>
                    {formData.diaDanh || 'Thành phố Hồ Chí Minh'}, ngày {formData.ngayKhai || '....'} tháng {formData.thangKhai || '....'} năm {formData.namKhai || '2026'}
                  </div>
                  <div style={{ fontWeight: 'bold', marginTop: '2px' }}>NGƯỜI TỰ KIỂM ĐIỂM</div>
                  <div style={{ fontStyle: 'italic', fontSize: '10pt', marginBottom: '55px' }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{formData.hoVaTen || '...........................................'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL TRỢ LÝ AI SOẠN THẢO */}
      {showAiModal && (
        <div className="review-modal-backdrop" onClick={() => setShowAiModal(false)}>
          <div className="review-ai-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: 800, fontSize: '1.15rem' }}>
                <Sparkles size={22} />
                Trợ Lý AI Soạn Bản Kiểm Điểm (Mẫu 02B)
              </div>
              <button 
                type="button" 
                onClick={() => setShowAiModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
              Nhập tóm tắt công tác chuyên môn, giảng dạy, ưu khuyết điểm trong năm 2026. Trợ lý AI của dự án sẽ tự động chuẩn hóa đúng thể thức văn phong xây dựng Đảng.
            </p>

            <textarea 
              rows={5}
              placeholder="Ví dụ: Tôi là Giảng viên Khoa Công nghệ thông tin, hoàn thành 100% giờ chuẩn giảng dạy, tích cực ứng dụng LMS và chuyển đổi số bài giảng, có 1 bài báo khoa học. Hạn chế: Ít phát biểu trong sinh hoạt chi bộ..."
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />

            {aiError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '0.85rem' }}>
                <AlertCircle size={16} /> {aiError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn-quick-k" 
                onClick={() => setShowAiModal(false)}
                disabled={isAiLoading}
                style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="btn-review-act primary" 
                onClick={handleAiGenerate}
                disabled={isAiLoading || !aiPrompt.trim()}
                style={{ background: '#b91c1c', color: '#ffffff' }}
              >
                {isAiLoading ? 'AI đang soạn...' : 'Tạo nội dung kiểm điểm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

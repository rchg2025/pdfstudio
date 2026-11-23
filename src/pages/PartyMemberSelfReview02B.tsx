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
  Loader2,
  Table
} from 'lucide-react';
import { 
  type PartySelfReview02BData, 
  type QuarterlyKpiRow,
  defaultPartySelfReview02BData, 
  exportPartySelfReview02BDocx 
} from '../utils/partySelfReview02BExport';
import './PartyMemberSelfReview02B.css';

const STORAGE_KEY = 'rchg_party_self_review_02b_draft_v2';

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
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'chiBo') {
        next.chiBoSinhHoat = value;
      }
      if (field === 'diemTieuChiChung' || field === 'diemThucHienNhiemVu') {
        const chung = field === 'diemTieuChiChung' ? Number(value) : prev.diemTieuChiChung;
        const nv = field === 'diemThucHienNhiemVu' ? Number(value) : prev.diemThucHienNhiemVu;
        next.tongDiemTuCham = (chung || 0) + (nv || 0);
      }
      return next;
    });
  };

  const handleKpiRowChange = (index: number, key: keyof QuarterlyKpiRow, value: string) => {
    setFormData(prev => {
      const nextRows = [...prev.kpiRows];
      nextRows[index] = { ...nextRows[index], [key]: value };
      return { ...prev, kpiRows: nextRows };
    });
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản nháp và đặt lại nội dung mẫu chuẩn 02B-HD KĐ.ĐG 2026?')) {
      setFormData(defaultPartySelfReview02BData);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleManualSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleDownloadDocx = () => {
    exportPartySelfReview02BDocx(formData);
  };

  const handlePrint = () => {
    window.print();
  };

  // AI viết lại từng trường
  const handleAiRewriteField = async (
    fieldKey: keyof PartySelfReview02BData,
    fieldTitle: string,
    currentValue: string
  ) => {
    setLoadingField(fieldKey);
    try {
      const systemInstruction = `Bạn là chuyên gia cố vấn công tác Đảng và xây dựng tổ chức Đảng cho Trường Cao đẳng Bách khoa Nam Sài Gòn. Hãy biên soạn hoặc nâng cấp nội dung mục "${fieldTitle}" cho bản kiểm điểm cá nhân không giữ chức vụ lãnh đạo (Mẫu 02B-HD KĐ.ĐG 2026). Đảm bảo thể thức trang trọng, khách quan, cầu thị, bám sát nhiệm vụ chuyên môn và tiêu chí 2026. Chỉ trả về nội dung trực tiếp không thêm lời mở đầu hay kết thúc.`;
      const prompt = `Nâng cấp hoặc trau chuốt nội dung sau cho mục "${fieldTitle}":\n"${currentValue || 'Chưa có nội dung, hãy viết mới mẫu mực cho giảng viên/nhân viên trường cao đẳng.'}"`;

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction })
      });

      if (!res.ok) {
        throw new Error('Không thể kết nối đến máy chủ AI');
      }

      const json = await res.json();
      if (json?.text) {
        handleChange(fieldKey, json.text.trim());
      }
    } catch (err: any) {
      alert(`Lỗi trợ lý AI: ${err.message || 'Vui lòng thử lại sau'}`);
    } finally {
      setLoadingField(null);
    }
  };

  // AI soạn thảo toàn bộ bản kiểm điểm
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiError('');

    try {
      const systemInstruction = `Bạn là chuyên gia công tác tổ chức Đảng ủy Trường Cao đẳng Bách khoa Nam Sài Gòn.
Dựa trên thông tin đầu vào của cá nhân (đảng viên không giữ chức vụ lãnh đạo), hãy soạn thảo bản tự kiểm điểm cuối năm theo Mẫu 02B-HD KĐ.ĐG 2026.
Bắt buộc trả về đúng định dạng JSON hợp lệ (không kèm Markdown block backticks \`\`\`json) với các trường sau:
{
  "uuDiemPhamChatChinhTri": "chuỗi",
  "uuDiemThucHienNhiemVu": "chuỗi",
  "uuDiemCamKetTuDuong": "chuỗi",
  "hanCheKhuyetDiem": "chuỗi",
  "nguyenNhanKhachQuan": "chuỗi",
  "nguyenNhanChuQuan": "chuỗi",
  "ketQuaKhacPhucNamTruoc": "chuỗi",
  "giaiTrinhGoiYKiemDiem": "chuỗi",
  "trachNhiemTapThe": "chuỗi",
  "phuongHuongKhacPhuc": "chuỗi"
}`;

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, systemInstruction })
      });

      if (!res.ok) throw new Error('Không thể tạo phản hồi từ AI');
      const data = await res.json();
      const rawText = data?.text || '';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      setFormData(prev => ({
        ...prev,
        ...parsed
      }));
      setShowAiModal(false);
      setAiPrompt('');
    } catch (err: any) {
      setAiError('Không thể tạo nội dung: ' + (err.message || 'Lỗi xử lý JSON'));
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="review-02b-page-container">
      {/* HEADER THANH CÔNG CỤ */}
      <div className="review-top-banner">
        <div className="review-banner-left">
          <div className="review-badge-tag">Mẫu 02B-HD KĐ.ĐG 2026</div>
          <h1 className="review-page-heading">
            Bản Kiểm Điểm, Tự Đánh Giá, Xếp Loại Của Cá Nhân (Mẫu 02B)
          </h1>
          <p className="review-page-desc">
            Áp dụng cho cá nhân không giữ chức vụ lãnh đạo, quản lý — Theo Hướng dẫn 397-HD/ĐU của Đảng ủy Trường CĐ Bách khoa Nam Sài Gòn. Tích hợp bảng KPI các quý, chấm điểm 100đ và xuất file Word chuẩn thể thức.
          </p>
        </div>

        <div className="review-banner-actions">
          <button 
            type="button" 
            className="btn-review-act ai"
            onClick={() => setShowAiModal(true)}
            title="Sử dụng trí tuệ nhân tạo để tự động soạn toàn bộ bản kiểm điểm 02B"
          >
            <Sparkles size={16} /> Soạn Bằng AI
          </button>
          <button 
            type="button" 
            className="btn-review-act reset" 
            onClick={handleReset}
            title="Đặt lại mẫu chuẩn nguyên bản"
          >
            <RotateCcw size={16} /> Mẫu Chuẩn
          </button>
          <button 
            type="button" 
            className="btn-review-act save" 
            onClick={handleManualSave}
            title="Lưu bản nháp vào trình duyệt"
          >
            <Check size={16} /> Lưu Nháp
          </button>
          <button 
            type="button" 
            className="btn-review-act print" 
            onClick={handlePrint}
            title="In trực tiếp ra giấy khổ A4"
          >
            <Printer size={16} /> In A4
          </button>
          <button 
            type="button" 
            className="btn-review-act primary" 
            onClick={handleDownloadDocx}
            title="Tải về máy file Microsoft Word (.doc)"
          >
            <Download size={16} /> Tải File Word
          </button>
        </div>
      </div>

      {savedToast && (
        <div className="review-save-toast">
          <Check size={18} /> Đã lưu bản nháp Mẫu 02B thành công vào máy của bạn!
        </div>
      )}

      {/* 2-COLUMN SPLIT: FORM TRÁI - PREVIEW PHẢI */}
      <div className="review-workspace-grid">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className="review-form-column">
          {/* KHỐI 1: TỔ CHỨC & ĐỊA DANH */}
          <div className="form-card-section">
            <div className="card-section-header">
              <Building2 size={18} color="#b91c1c" />
              <h3>1. Đơn Vị Đảng & Cơ Quan</h3>
            </div>
            <div className="card-form-grid">
              <div className="field-group span-2">
                <label>Đảng bộ cơ sở</label>
                <input 
                  type="text" 
                  value={formData.dangBoCoSo} 
                  onChange={e => handleChange('dangBoCoSo', e.target.value)}
                  placeholder="ĐẢNG BỘ TRƯỜNG CAO ĐẲNG BÁCH KHOA NAM SÀI GÒN"
                />
              </div>
              <div className="field-group">
                <label>Chi bộ trực thuộc</label>
                <input 
                  type="text" 
                  value={formData.chiBo} 
                  onChange={e => handleChange('chiBo', e.target.value)}
                  placeholder="Chi bộ 1, Chi bộ 2..."
                />
              </div>
              <div className="field-group">
                <label>Địa danh lập bản kiểm điểm</label>
                <input 
                  type="text" 
                  value={formData.diaDanh} 
                  onChange={e => handleChange('diaDanh', e.target.value)}
                  placeholder="Chánh Hưng, TP. Hồ Chí Minh..."
                />
              </div>
              <div className="field-group">
                <label>Năm kiểm điểm</label>
                <input 
                  type="text" 
                  value={formData.namKiemDiem} 
                  onChange={e => handleChange('namKiemDiem', e.target.value)}
                  placeholder="2026"
                />
              </div>
              <div className="field-group">
                <label>Ngày ký (dd/mm/yyyy)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '6px' }}>
                  <input 
                    type="text" 
                    value={formData.ngayKhai} 
                    onChange={e => handleChange('ngayKhai', e.target.value)}
                    placeholder="Ngày"
                  />
                  <input 
                    type="text" 
                    value={formData.thangKhai} 
                    onChange={e => handleChange('thangKhai', e.target.value)}
                    placeholder="Tháng"
                  />
                  <input 
                    type="text" 
                    value={formData.namKhai} 
                    onChange={e => handleChange('namKhai', e.target.value)}
                    placeholder="Năm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI 2: THÔNG TIN CÁ NHÂN */}
          <div className="form-card-section">
            <div className="card-section-header">
              <Award size={18} color="#b91c1c" />
              <h3>2. Thông Tin Đảng Viên</h3>
            </div>
            <div className="card-form-grid">
              <div className="field-group span-2">
                <label>Họ và tên (chữ in hoa)</label>
                <input 
                  type="text" 
                  style={{ textTransform: 'uppercase', fontWeight: 600 }}
                  value={formData.hoVaTen} 
                  onChange={e => handleChange('hoVaTen', e.target.value)}
                  placeholder="NGUYỄN VĂN A"
                />
              </div>
              <div className="field-group">
                <label>Ngày sinh</label>
                <input 
                  type="text" 
                  value={formData.namSinh} 
                  onChange={e => handleChange('namSinh', e.target.value)}
                  placeholder="01/01/1988"
                />
              </div>
              <div className="field-group">
                <label>Đơn vị công tác</label>
                <input 
                  type="text" 
                  value={formData.donViCongTac} 
                  onChange={e => handleChange('donViCongTac', e.target.value)}
                  placeholder="Khoa Công nghệ thông tin..."
                />
              </div>
              <div className="field-group span-2">
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

          {/* KHỐI 3: A. NỘI DUNG KIỂM ĐIỂM */}
          <div className="form-card-section">
            <div className="card-section-header">
              <FileText size={18} color="#b91c1c" />
              <h3>A. Nội Dung Kiểm Điểm</h3>
            </div>

            <div className="sub-section-title">I. Ưu điểm, kết quả đạt được</div>

            {/* I.1 */}
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>1. Về phẩm chất chính trị, đạo đức, lối sống, trách nhiệm nêu gương...</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('uuDiemPhamChatChinhTri', 'Phẩm chất chính trị, đạo đức, lối sống', formData.uuDiemPhamChatChinhTri)}
                  disabled={loadingField === 'uuDiemPhamChatChinhTri'}
                >
                  {loadingField === 'uuDiemPhamChatChinhTri' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={6}
                value={formData.uuDiemPhamChatChinhTri}
                onChange={e => handleChange('uuDiemPhamChatChinhTri', e.target.value)}
              />
            </div>

            {/* I.2 */}
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>2. Việc thực hiện nhiệm vụ, quyền hạn và kết quả thực hiện các chỉ tiêu...</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('uuDiemThucHienNhiemVu', 'Kết quả thực hiện nhiệm vụ, quyền hạn', formData.uuDiemThucHienNhiemVu)}
                  disabled={loadingField === 'uuDiemThucHienNhiemVu'}
                >
                  {loadingField === 'uuDiemThucHienNhiemVu' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={6}
                value={formData.uuDiemThucHienNhiemVu}
                onChange={e => handleChange('uuDiemThucHienNhiemVu', e.target.value)}
              />
            </div>

            {/* I.3 */}
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu của cá nhân</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('uuDiemCamKetTuDuong', 'Thực hiện cam kết tu dưỡng', formData.uuDiemCamKetTuDuong)}
                  disabled={loadingField === 'uuDiemCamKetTuDuong'}
                >
                  {loadingField === 'uuDiemCamKetTuDuong' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.uuDiemCamKetTuDuong}
                onChange={e => handleChange('uuDiemCamKetTuDuong', e.target.value)}
              />
            </div>

            <div className="sub-section-title" style={{ marginTop: '1.25rem' }}>II. Hạn chế, khuyết điểm và nguyên nhân</div>

            {/* II.1 */}
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>1. Hạn chế, khuyết điểm</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('hanCheKhuyetDiem', 'Hạn chế khuyết điểm', formData.hanCheKhuyetDiem)}
                  disabled={loadingField === 'hanCheKhuyetDiem'}
                >
                  {loadingField === 'hanCheKhuyetDiem' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.hanCheKhuyetDiem}
                onChange={e => handleChange('hanCheKhuyetDiem', e.target.value)}
              />
            </div>

            {/* II.2 */}
            <div className="card-form-grid" style={{ marginTop: '0.5rem' }}>
              <div className="field-group span-2">
                <label>2.1. Nguyên nhân khách quan</label>
                <textarea 
                  rows={2}
                  value={formData.nguyenNhanKhachQuan}
                  onChange={e => handleChange('nguyenNhanKhachQuan', e.target.value)}
                />
              </div>
              <div className="field-group span-2">
                <label>2.2. Nguyên nhân chủ quan</label>
                <textarea 
                  rows={2}
                  value={formData.nguyenNhanChuQuan}
                  onChange={e => handleChange('nguyenNhanChuQuan', e.target.value)}
                />
              </div>
            </div>

            {/* III */}
            <div className="sub-section-title" style={{ marginTop: '1.25rem' }}>III. Kết quả khắc phục hạn chế, khuyết điểm kỳ trước</div>
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>Kiểm điểm rõ từng hạn chế đã được khắc phục, đang khắc phục hoặc chưa khắc phục</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('ketQuaKhacPhucNamTruoc', 'Khắc phục hạn chế kỳ trước', formData.ketQuaKhacPhucNamTruoc)}
                  disabled={loadingField === 'ketQuaKhacPhucNamTruoc'}
                >
                  {loadingField === 'ketQuaKhacPhucNamTruoc' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={3}
                value={formData.ketQuaKhacPhucNamTruoc}
                onChange={e => handleChange('ketQuaKhacPhucNamTruoc', e.target.value)}
              />
            </div>

            {/* IV */}
            <div className="sub-section-title" style={{ marginTop: '1.25rem' }}>IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)</div>
            <div className="textarea-group">
              <textarea 
                rows={2}
                value={formData.giaiTrinhGoiYKiemDiem}
                onChange={e => handleChange('giaiTrinhGoiYKiemDiem', e.target.value)}
                placeholder="Giải trình từng vấn đề được gợi ý kiểm điểm (nếu không có thì ghi: Không có)..."
              />
            </div>

            {/* V */}
            <div className="sub-section-title" style={{ marginTop: '1.25rem' }}>V. Làm rõ trách nhiệm cá nhân đối với hạn chế của tập thể (nếu có)</div>
            <div className="textarea-group">
              <textarea 
                rows={2}
                value={formData.trachNhiemTapThe}
                onChange={e => handleChange('trachNhiemTapThe', e.target.value)}
                placeholder="Làm rõ trách nhiệm cá nhân (nếu không có thì ghi: Không có)..."
              />
            </div>

            {/* VI */}
            <div className="sub-section-title" style={{ marginTop: '1.25rem' }}>VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm</div>
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>Nội dung, biện pháp, thời gian thực hiện và trách nhiệm cá nhân</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('phuongHuongKhacPhuc', 'Phương hướng khắc phục hạn chế', formData.phuongHuongKhacPhuc)}
                  disabled={loadingField === 'phuongHuongKhacPhuc'}
                >
                  {loadingField === 'phuongHuongKhacPhuc' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.phuongHuongKhacPhuc}
                onChange={e => handleChange('phuongHuongKhacPhuc', e.target.value)}
              />
            </div>
          </div>

          {/* KHỐI 4: B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI */}
          <div className="form-card-section">
            <div className="card-section-header">
              <Table size={18} color="#b91c1c" />
              <h3>B. Nội Dung Tự Đánh Giá, Xếp Loại</h3>
            </div>

            <div className="sub-section-title">I. Kết quả thực hiện nhiệm vụ được giao (Bảng tổng hợp KPI các quý)</div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic', marginBottom: '0.75rem' }}>
              Hệ thống tổng hợp từ danh mục nhiệm vụ, kết quả các quý và minh chứng đã được phê duyệt. Cá nhân kiểm tra, xác nhận; trường hợp có sai lệch thì giải trình ngắn gọn.
            </p>

            <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#334155' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Nội dung</th>
                    <th style={{ padding: '8px', width: '12%' }}>Quý I</th>
                    <th style={{ padding: '8px', width: '12%' }}>Quý II</th>
                    <th style={{ padding: '8px', width: '12%' }}>Quý III</th>
                    <th style={{ padding: '8px', width: '12%' }}>Quý IV</th>
                    <th style={{ padding: '8px', width: '14%' }}>Cả năm</th>
                    <th style={{ padding: '8px', width: '18%' }}>Cá nhân xác nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.kpiRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', fontWeight: 500 }}>{row.content}</td>
                      <td style={{ padding: '4px' }}>
                        <input 
                          type="text" 
                          value={row.q1} 
                          onChange={e => handleKpiRowChange(idx, 'q1', e.target.value)}
                          style={{ width: '100%', textAlign: 'center', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input 
                          type="text" 
                          value={row.q2} 
                          onChange={e => handleKpiRowChange(idx, 'q2', e.target.value)}
                          style={{ width: '100%', textAlign: 'center', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input 
                          type="text" 
                          value={row.q3} 
                          onChange={e => handleKpiRowChange(idx, 'q3', e.target.value)}
                          style={{ width: '100%', textAlign: 'center', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input 
                          type="text" 
                          value={row.q4} 
                          onChange={e => handleKpiRowChange(idx, 'q4', e.target.value)}
                          style={{ width: '100%', textAlign: 'center', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input 
                          type="text" 
                          value={row.year} 
                          onChange={e => handleKpiRowChange(idx, 'year', e.target.value)}
                          style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', padding: '4px', border: '1px solid #94a3b8', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <select 
                          value={row.confirmed}
                          onChange={e => handleKpiRowChange(idx, 'confirmed', e.target.value as any)}
                          style={{ width: '100%', padding: '4px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        >
                          <option value="Đúng">Đúng</option>
                          <option value="Có sai lệch">Có sai lệch</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card-form-grid" style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <div className="field-group">
                <label style={{ color: '#991b1b', fontWeight: 600 }}>1. Điểm tiêu chí chung (tối đa 30đ)</label>
                <input 
                  type="number" 
                  min={0} 
                  max={30}
                  value={formData.diemTieuChiChung} 
                  onChange={e => handleChange('diemTieuChiChung', Number(e.target.value))}
                />
              </div>
              <div className="field-group">
                <label style={{ color: '#991b1b', fontWeight: 600 }}>2. Điểm kết quả thực hiện nhiệm vụ (tối đa 70đ)</label>
                <input 
                  type="number" 
                  min={0} 
                  max={70}
                  value={formData.diemThucHienNhiemVu} 
                  onChange={e => handleChange('diemThucHienNhiemVu', Number(e.target.value))}
                />
              </div>
              <div className="field-group span-2">
                <div style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '1rem' }}>
                  Tổng điểm tự chấm: {(formData.diemTieuChiChung || 0) + (formData.diemThucHienNhiemVu || 0)} / 100 điểm
                </div>
              </div>
            </div>

            <div className="sub-section-title" style={{ marginTop: '1.25rem' }}>II. Đề xuất xếp loại mức chất lượng</div>
            <div className="field-group span-2">
              <label>Đề xuất 01 mức chất lượng</label>
              <select 
                value={formData.tuXepLoaiDangVien}
                onChange={e => handleChange('tuXepLoaiDangVien', e.target.value as any)}
                style={{ fontWeight: 600, color: '#b91c1c' }}
              >
                <option value="Hoàn thành xuất sắc nhiệm vụ">Hoàn thành xuất sắc nhiệm vụ</option>
                <option value="Hoàn thành tốt nhiệm vụ">Hoàn thành tốt nhiệm vụ</option>
                <option value="Hoàn thành nhiệm vụ">Hoàn thành nhiệm vụ</option>
                <option value="Không hoàn thành nhiệm vụ">Không hoàn thành nhiệm vụ</option>
              </select>
            </div>

            <div className="field-group span-2" style={{ marginTop: '0.5rem' }}>
              <label>Giải trình ngắn gọn (nếu mức tự đề xuất khác đáng kể so với diễn biến KPI các quý):</label>
              <input 
                type="text"
                value={formData.giaiTrinhMucXepLoai}
                onChange={e => handleChange('giaiTrinhMucXepLoai', e.target.value)}
                placeholder="Ghi giải trình nếu cần..."
              />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: XEM TRƯỚC PAPER VIEW A4 */}
        <div className="review-preview-column">
          <div className="review-preview-toolbar">
            <div className="review-preview-title">
              <FileText size={18} color="#b91c1c" />
              Xem Trước Bản Kiểm Điểm A4 (Chuẩn Mẫu 02B-HD KĐ.ĐG 2026)
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
              {/* Header 2 cột chuẩn văn bản Đảng */}
              <div className="paper-header-grid">
                <div className="paper-org-left">
                  <div className="org-upper" style={{ fontWeight: 'bold' }}>{formData.dangBoCoSo || 'ĐẢNG BỘ TRƯỜNG CAO ĐẲNG BÁCH KHOA NAM SÀI GÒN'}</div>
                  <div style={{ fontWeight: 'bold' }}>CHI BỘ: {formData.chiBo || '………..'}</div>
                  <div style={{ width: '80px', height: '1px', background: '#000', margin: '3px auto 0 auto' }}></div>
                </div>
                <div className="paper-motto-right">
                  <div style={{ fontSize: '11pt', fontWeight: 'bold', textAlign: 'right', marginBottom: '2px' }}>Mẫu 02B-HD KĐ.ĐG 2026</div>
                  <div className="motto-main">ĐẢNG CỘNG SẢN VIỆT NAM</div>
                  <div className="motto-date">
                    {formData.diaDanh || 'Chánh Hưng'}, ngày {formData.ngayKhai || '…'} tháng {formData.thangKhai || '…'} năm {formData.namKhai || '2026'}
                  </div>
                </div>
              </div>

              {/* Tiêu đề */}
              <div className="paper-title-block">
                <h2 className="paper-title-main">BẢN KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CỦA CÁ NHÂN</h2>
                <div className="paper-title-sub">Năm {formData.namKiemDiem || '2026'}</div>
                <div className="paper-note">
                  (Cá nhân không giữ chức vụ lãnh đạo, quản lý)
                </div>
              </div>

              {/* Thông tin */}
              <div className="paper-p">
                Họ và tên: <strong style={{ textTransform: 'uppercase' }}>{formData.hoVaTen || '…………………………..……..'}</strong> &nbsp;&nbsp;&nbsp;&nbsp; Ngày sinh: {formData.namSinh || '……………………'}
              </div>
              <div className="paper-p">
                Đơn vị công tác: {formData.donViCongTac || '……………………'} &nbsp;&nbsp;&nbsp;&nbsp; Chi bộ: {formData.chiBoSinhHoat || formData.chiBo || '……………………'}
              </div>

              <div className="paper-heading-1">A. NỘI DUNG KIỂM ĐIỂM</div>

              <div className="paper-heading-2">I. Ưu điểm, kết quả đạt được</div>
              <div className="paper-heading-3">1. Về phẩm chất chính trị, đạo đức, lối sống; tinh thần đoàn kết, thống nhất trong nội bộ; ý thức tổ chức kỷ luật, trách nhiệm nêu gương, việc thực hiện những điều đảng viên không được làm; tác phong, lề lối làm việc. việc đấu tranh phòng, chống tham nhũng, tiêu cực, lãng phí và ngăn chặn, đẩy lùi những biểu hiện suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hoá"; việc học tập, thực hành tư tưởng, đạo đức, phương pháp, phong cách Hồ Chí Minh; việc nghiên cứu, học tập và triển khai nghị quyết:</div>
              <div className="paper-text-block">{formData.uuDiemPhamChatChinhTri}</div>

              <div className="paper-heading-3">2. Việc thực hiện nhiệm vụ, quyền hạn và kết quả thực hiện các chỉ tiêu, nhiệm vụ được giao trong năm, gắn với hiệu quả, tiến độ, chất lượng công việc:</div>
              <div className="paper-text-block">{formData.uuDiemThucHienNhiemVu}</div>

              <div className="paper-heading-3">3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu của cá nhân theo quy định:</div>
              <div className="paper-text-block">{formData.uuDiemCamKetTuDuong}</div>

              <div className="paper-heading-2">II. Hạn chế, khuyết điểm và nguyên nhân</div>
              <div className="paper-heading-3">1. Hạn chế, khuyết điểm:</div>
              <div className="paper-text-block">{formData.hanCheKhuyetDiem}</div>

              <div className="paper-heading-3">2. Nguyên nhân của hạn chế, khuyết điểm:</div>
              <div className="paper-p"><em>- Nguyên nhân khách quan:</em> {formData.nguyenNhanKhachQuan}</div>
              <div className="paper-p"><em>- Nguyên nhân chủ quan:</em> {formData.nguyenNhanChuQuan}</div>

              <div className="paper-heading-2">III. Kết quả khắc phục những hạn chế, khuyết điểm đã được cấp có thẩm quyền kết luận hoặc được chỉ ra ở các kỳ kiểm điểm trước</div>
              <div className="paper-p" style={{ fontStyle: 'italic', fontSize: '10pt', color: '#555' }}>
                (Kiểm điểm rõ từng hạn chế, khuyết điểm (đã được khắc phục; đang khắc phục, mức độ khắc phục; chưa được khắc phục); những khó khăn, vướng mắc (nếu có); trách nhiệm của cá nhân).
              </div>
              <div className="paper-text-block">{formData.ketQuaKhacPhucNamTruoc}</div>

              <div className="paper-heading-2">IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)</div>
              <div className="paper-p" style={{ fontStyle: 'italic', fontSize: '10pt', color: '#555' }}>
                (Giải trình từng vấn đề được gợi ý kiểm điểm, nêu nguyên nhân, xác định trách nhiệm của cá nhân đối với từng vấn đề được gợi ý kiểm điểm).
              </div>
              <div className="paper-text-block">{formData.giaiTrinhGoiYKiemDiem}</div>

              <div className="paper-heading-2">V. Làm rõ trách nhiệm của cá nhân đối với những hạn chế, khuyết điểm của tập thể (nếu có)</div>
              <div className="paper-text-block">{formData.trachNhiemTapThe}</div>

              <div className="paper-heading-2">VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm</div>
              <div className="paper-p" style={{ fontStyle: 'italic', fontSize: '10pt', color: '#555' }}>
                (xác định rõ nội dung, biện pháp, thời gian thực hiện và trách nhiệm của cá nhân).
              </div>
              <div className="paper-text-block">{formData.phuongHuongKhacPhuc}</div>

              <div className="paper-heading-1" style={{ marginTop: '16px' }}>B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI</div>
              
              <div className="paper-heading-2">I. Kết quả thực hiện nhiệm vụ được giao</div>
              <div className="paper-p" style={{ fontStyle: 'italic', fontSize: '10pt' }}>
                Hệ thống tổng hợp từ danh mục nhiệm vụ, kết quả các quý và minh chứng đã được phê duyệt. Cá nhân kiểm tra, xác nhận; trường hợp có sai lệch thì giải trình ngắn gọn và đề nghị điều chỉnh theo thẩm quyền.
              </div>

              {/* BẢNG KPI PREVIEW */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', margin: '8px 0', fontSize: '10.5pt' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', textAlign: 'center', fontWeight: 'bold' }}>
                    <th style={{ border: '1px solid #000', padding: '4px' }}>Nội dung</th>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '10%' }}>Quý I</th>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '10%' }}>Quý II</th>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '10%' }}>Quý III</th>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '10%' }}>Quý IV</th>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '12%' }}>Cả năm</th>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '18%' }}>Cá nhân xác nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.kpiRows.map((r, i) => (
                    <tr key={i} style={{ textAlign: 'center' }}>
                      <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>{r.content}</td>
                      <td style={{ border: '1px solid #000', padding: '4px' }}>{r.q1}</td>
                      <td style={{ border: '1px solid #000', padding: '4px' }}>{r.q2}</td>
                      <td style={{ border: '1px solid #000', padding: '4px' }}>{r.q3}</td>
                      <td style={{ border: '1px solid #000', padding: '4px' }}>{r.q4}</td>
                      <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>{r.year}</td>
                      <td style={{ border: '1px solid #000', padding: '4px', fontSize: '9.5pt' }}>
                        {r.confirmed === 'Đúng' ? '☑ Đúng  ☐ Sai lệch' : '☐ Đúng  ☑ Sai lệch'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="paper-p" style={{ fontStyle: 'italic', fontSize: '10pt', color: '#555' }}>
                Gửi kèm bảng chấm điểm và minh chứng sản phẩm cụ thể. Kết quả KPI là căn cứ hỗ trợ đánh giá, không thay thế việc thảo luận, nhận xét và quyết định của cấp có thẩm quyền.
              </div>

              <div className="paper-p" style={{ marginTop: '6px' }}>
                <strong>Tổng điểm đánh giá:</strong><br />
                1. Nhóm tiêu chí chung: <strong>{formData.diemTieuChiChung}/30</strong><br />
                2. Nhóm tiêu chí về kết quả thực hiện nhiệm vụ: <strong>{formData.diemThucHienNhiemVu}/70</strong><br />
                <strong>Tổng điểm: {(formData.diemTieuChiChung || 0) + (formData.diemThucHienNhiemVu || 0)}/100</strong>
              </div>

              <div className="paper-heading-2" style={{ marginTop: '10px' }}>II. Đề xuất xếp loại mức chất lượng:</div>
              <div style={{ marginLeft: '10mm', marginTop: '4px', marginBottom: '4px' }}>
                <div>[{formData.tuXepLoaiDangVien === 'Hoàn thành xuất sắc nhiệm vụ' ? 'X' : ' '}] Hoàn thành xuất sắc nhiệm vụ</div>
                <div>[{formData.tuXepLoaiDangVien === 'Hoàn thành tốt nhiệm vụ' ? 'X' : ' '}] Hoàn thành tốt nhiệm vụ</div>
                <div>[{formData.tuXepLoaiDangVien === 'Hoàn thành nhiệm vụ' ? 'X' : ' '}] Hoàn thành nhiệm vụ</div>
                <div>[{formData.tuXepLoaiDangVien === 'Không hoàn thành nhiệm vụ' ? 'X' : ' '}] Không hoàn thành nhiệm vụ</div>
              </div>

              <div className="paper-p" style={{ fontStyle: 'italic', fontSize: '10pt', color: '#555' }}>
                Chỉ đánh dấu 01 mức. Nếu mức tự đề xuất khác đáng kể so với diễn biến kết quả các quý hoặc dữ liệu KPI, cá nhân phải giải trình ngắn gọn: {formData.giaiTrinhMucXepLoai || '...................................................'}
              </div>
              <div className="paper-p" style={{ fontStyle: 'italic', fontSize: '10pt', color: '#555' }}>
                Gửi kèm Phụ lục về kết quả thực hiện nhiệm vụ trong đó thể hiện sản phẩm tiến độ, chất lượng cụ thể (theo Mẫu 05).
              </div>

              {/* Chữ ký Người tự kiểm điểm */}
              <div className="paper-signature-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '15px' }}>
                <div></div>
                <div className="sig-col-center">
                  <div style={{ fontWeight: 'bold' }}>NGƯỜI TỰ KIỂM ĐIỂM</div>
                  <div style={{ fontStyle: 'italic', fontSize: '10pt', marginBottom: '50px' }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{formData.hoVaTen || '...........................................'}</div>
                </div>
              </div>

              {/* C. KẾT QUẢ ĐÁNH GIÁ, XẾP LOẠI */}
              <div className="paper-heading-1" style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px dashed #cbd5e1' }}>
                C. KẾT QUẢ ĐÁNH GIÁ, XẾP LOẠI
              </div>

              <div className="paper-heading-2">I. Đánh giá, xếp loại chất lượng cán bộ, công chức, viên chức</div>
              <div className="paper-p">- Tổng điểm: ……/100 điểm.</div>
              <div className="paper-p">- Nhận xét, đánh giá của người quản lý, sử dụng cán bộ, công chức, viên chức: ………………………………………………………………………………………………………..</div>
              <div className="paper-p">- Mức xếp loại chất lượng công chức, viên chức: ……………………………</div>

              <div className="paper-signature-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '10px' }}>
                <div></div>
                <div className="sig-col-center">
                  <div style={{ fontWeight: 'bold' }}>THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ</div>
                  <div style={{ fontStyle: 'italic', fontSize: '9.5pt', marginBottom: '45px' }}>(Xác lập thời điểm, ký, ghi rõ họ tên và đóng dấu)</div>
                  <div>...................................................</div>
                </div>
              </div>

              <div className="paper-heading-2" style={{ marginTop: '15px' }}>II. Đánh giá, xếp loại chất lượng đảng viên</div>
              <div className="paper-p">- Nhận xét, đánh giá của chi ủy: ………………………………………………</div>
              <div className="paper-p">- Chi bộ đề xuất xếp loại mức chất lượng: ……………………………………</div>

              <div className="paper-signature-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '10px' }}>
                <div></div>
                <div className="sig-col-center">
                  <div style={{ fontWeight: 'bold' }}>T/M CHI ỦY (CHI BỘ)</div>
                  <div style={{ fontStyle: 'italic', fontSize: '9.5pt', marginBottom: '45px' }}>(Xác lập thời điểm, ký, ghi rõ họ tên)</div>
                  <div>...................................................</div>
                </div>
              </div>

              <div className="paper-p" style={{ marginTop: '15px' }}>
                - Đảng ủy trực thuộc cơ sở/Ban Thường vụ Đảng ủy cơ sở hoặc đảng ủy cơ sở nơi không có ban thường vụ quyết định mức xếp loại chất lượng: ………………………………………………………………………………………………………..
              </div>

              <div className="paper-signature-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '10px' }}>
                <div></div>
                <div className="sig-col-center">
                  <div style={{ fontWeight: 'bold' }}>T/M BAN THƯỜNG VỤ ĐẢNG ỦY</div>
                  <div style={{ fontStyle: 'italic', fontSize: '9.5pt', marginBottom: '45px' }}>(Xác lập thời điểm, ký, ghi rõ họ tên và đóng dấu)</div>
                  <div>...................................................</div>
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
                Trợ Lý AI Soạn Bản Kiểm Điểm (Mẫu 02B-2026)
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
              Nhập tóm tắt công tác chuyên môn, giảng dạy, ưu khuyết điểm trong năm 2026. Trợ lý AI của dự án sẽ tự động chuẩn hóa đúng thể thức văn bản Đảng theo Hướng dẫn 397-HD/ĐU.
            </p>

            <textarea 
              rows={5}
              placeholder="Ví dụ: Tôi là Giảng viên Khoa Điện - Điện tử, hoàn thành 100% giờ chuẩn giảng dạy, tích cực ứng dụng LMS và chuyển đổi số bài giảng, có 1 đề tài NCKH cấp trường. Hạn chế: Ít phát biểu trong sinh hoạt chi bộ định kỳ..."
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

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Download, 
  Check, 
  RotateCcw, 
  Printer, 
  FileText,
  Award,
  Users,
  Sparkles,
  Loader2,
  Wand2
} from 'lucide-react';
import { 
  type PartyReview01CollectiveData, 
  defaultPartyReview01CollectiveData, 
  exportPartyReview01CollectiveDocx 
} from '../utils/party397ExportHelper';
import './PartyMemberSelfReview02A.css';

const STORAGE_KEY = 'rchg_party_review_01_collective_draft';

export default function PartyCollectiveReview01() {
  const [formData, setFormData] = useState<PartyReview01CollectiveData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu kiểm điểm tập thể:', e);
    }
    return defaultPartyReview01CollectiveData;
  });

  const [savedToast, setSavedToast] = useState(false);
  const [loadingField, setLoadingField] = useState<keyof PartyReview01CollectiveData | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('Lỗi lưu nháp:', e);
    }
  }, [formData]);

  const handleChange = (field: keyof PartyReview01CollectiveData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn đặt lại toàn bộ nội dung bản kiểm điểm tập thể về mẫu chuẩn?')) {
      setFormData(defaultPartyReview01CollectiveData);
    }
  };

  const handleDownloadDocx = () => {
    exportPartyReview01CollectiveDocx(formData);
  };

  const handlePrint = () => {
    window.print();
  };

  // AI viết lại từng mục
  const handleAiRewriteField = async (
    fieldKey: keyof PartyReview01CollectiveData,
    fieldTitle: string,
    currentValue: string
  ) => {
    setLoadingField(fieldKey);
    try {
      const customKey = localStorage.getItem('rchg_gemini_api_key') || '';
      const promptInstruction = `
Bạn là chuyên gia cố vấn công tác Đảng và xây dựng tổ chức Đảng cho Trường Cao đẳng Bách khoa Nam Sài Gòn.
Hãy biên soạn hoặc nâng cấp nội dung mục "${fieldTitle}" cho Báo cáo kiểm điểm, tự đánh giá, xếp loại tập thể (Mẫu 01-HD KĐ.ĐG 2026).
Đảm bảo thể thức trang trọng, khách quan, cầu thị, thể hiện rõ vai trò tập thể lãnh đạo, quản lý, đổi mới sáng tạo, bám sát các nghị quyết của Đảng và tiêu chí đánh giá năm 2026.
Phân chia các ý rõ ràng có đánh số (1., 2., 3.), nêu rõ hành động, kết quả và giải pháp cụ thể.

Nội dung hiện tại hoặc ý chính cần viết lại:
"""
${currentValue || 'Chưa có nội dung, hãy viết mới mẫu mực cho tập thể Chi ủy/Lãnh đạo đơn vị trường cao đẳng.'}
"""

Trả về duy nhất JSON hợp lệ theo định dạng: {"content": "đoạn văn bản hoàn chỉnh, dài dặn, chuẩn xác theo đúng ngôn phong công tác Đảng"}
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

      if (!response.ok) {
        throw new Error('Máy chủ AI hiện đang bận hoặc quá tải, vui lòng thử lại sau giây lát!');
      }

      const resText = await response.text();
      let resData: any = {};
      try {
        resData = JSON.parse(resText);
      } catch {
        throw new Error('Máy chủ AI phản hồi định dạng chưa phù hợp, vui lòng thử lại!');
      }

      const rawText = resData?.questions?.[0]?.question || resData?.text || resData?.data || '';
      let cleanText = '';
      try {
        const parsed = JSON.parse(rawText.replace(/```json\s*|```/g, '').trim());
        cleanText = parsed.content || parsed.text || '';
      } catch {
        cleanText = rawText.replace(/```json\s*|```/g, '').trim();
      }

      if (cleanText) {
        handleChange(fieldKey, cleanText);
      }
    } catch (err: any) {
      alert(`Lỗi trợ lý AI: ${err.message || 'Vui lòng thử lại sau'}`);
    } finally {
      setLoadingField(null);
    }
  };

  // AI soạn thảo toàn bộ bản kiểm điểm tập thể
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiError('');

    try {
      const customKey = localStorage.getItem('rchg_gemini_api_key') || '';
      const promptInstruction = `
Bạn là chuyên gia công tác tổ chức Đảng ủy Trường Cao đẳng Bách khoa Nam Sài Gòn.
Dựa trên thông tin tóm tắt sau đây của tập thể lãnh đạo/chi ủy, hãy soạn thảo hoàn chỉnh, dài dặn, mẫu mực toàn bộ các mục của Báo cáo kiểm điểm tập thể Mẫu 01-HD KĐ.ĐG 2026.
Bắt buộc trả về DUY NHẤT một chuỗi JSON hợp lệ không có giải thích thêm:
{
  "uuDiemChapHanhDuongLoi": "chuỗi dài dặn về chấp hành Cương lĩnh, Điều lệ Đảng, Nghị quyết, nguyên tắc tập trung dân chủ, quy chế làm việc...",
  "uuDiemThucHienMucTieu": "chuỗi dài dặn về kết quả lãnh đạo thực hiện mục tiêu, chỉ tiêu nhiệm vụ chính trị và chuyên môn năm 2026...",
  "uuDiemXayDungChinhDonDang": "chuỗi về công tác xây dựng chỉnh đốn Đảng, tinh gọn bộ máy, cải cách hành chính, chuyển đổi số (NQ 57-NQ/TW), phòng chống tham nhũng, nêu gương...",
  "uuDiemTrachNhiemLanhDao": "chuỗi về trách nhiệm tập thể lãnh đạo quản lý trong điều hành...",
  "hanCheKhuyetDiem": "chuỗi nêu rõ hạn chế, khuyết điểm của tập thể...",
  "nguyenNhanKhachQuan": "chuỗi nguyên nhân khách quan...",
  "nguyenNhanChuQuan": "chuỗi nguyên nhân chủ quan...",
  "ketQuaKhacPhucNamTruoc": "chuỗi kết quả khắc phục hạn chế kỳ trước...",
  "giaiTrinhGoiYKiemDiem": "Không có.",
  "trachNhiemTapTheCaNhan": "Tập thể Chi ủy/Lãnh đạo nghiêm túc nhận trách nhiệm và phân công rõ từng đồng chí phụ trách khắc phục.",
  "phuongHuongKhacPhuc": "chuỗi phương hướng, biện pháp, sản phẩm kết quả cần đạt và thời hạn hoàn thành cụ thể..."
}

THÔNG TIN TẬP THỂ CUNG CẤP:
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

      if (!response.ok) throw new Error('Máy chủ AI hiện đang bận, vui lòng thử lại sau giây lát!');
      const resText = await response.text();
      let resData: any = {};
      try {
        resData = JSON.parse(resText);
      } catch {
        throw new Error('Máy chủ phản hồi định dạng chưa phù hợp, vui lòng thử lại!');
      }

      const rawText = resData?.questions?.[0]?.question || resData?.text || resData?.data || '';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const match = cleanJson.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Phản hồi từ AI không đúng cấu trúc JSON');
      const parsed = JSON.parse(match[0]);

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
    <div className="party-review-page-container">
      {/* HEADER BANNER */}
      <div className="party-top-banner">
        <div className="party-banner-info">
          <div className="party-badge-tag">
            <Award size={14} /> Mẫu 01-HD KĐ.ĐG 2026
          </div>
          <h1 className="party-page-heading">
            <Building2 size={26} />
            Báo Cáo Kiểm Điểm, Tự Đánh Giá Xếp Loại Tập Thể (Mẫu 01)
          </h1>
          <p className="party-page-desc">
            Dành cho Cấp ủy, Chi bộ, Tập thể Lãnh đạo quản lý — Theo Hướng dẫn số 397-HD/ĐU ngày 20/11/2026 của Đảng ủy Trường CĐ Bách khoa Nam Sài Gòn. Hỗ trợ trợ lý AI hoàn thiện báo cáo và xuất Word chuẩn thể thức.
          </p>
        </div>
        <div className="party-banner-actions">
          <button 
            type="button" 
            className="btn-review-act ai"
            onClick={() => setShowAiModal(true)}
            title="Sử dụng trí tuệ nhân tạo để soạn thảo nhanh báo cáo kiểm điểm tập thể"
          >
            <Sparkles size={16} /> Soạn Bằng AI
          </button>
          <button 
            type="button" 
            className="btn-review-act primary"
            onClick={handleDownloadDocx}
            title="Tải về file Microsoft Word (.doc) chuẩn thể thức Đảng"
          >
            <Download size={16} /> Tải File Word
          </button>
          <button 
            type="button" 
            className="btn-review-act print"
            onClick={handlePrint}
            title="In trực tiếp báo cáo ra giấy A4"
          >
            <Printer size={16} /> In Báo Cáo
          </button>
          <button 
            type="button" 
            className="btn-review-act reset"
            onClick={handleReset}
            title="Khôi phục lại nội dung mẫu chuẩn"
          >
            <RotateCcw size={16} /> Mẫu Chuẩn
          </button>
        </div>
      </div>

      {savedToast && (
        <div className="review-save-toast">
          <Check size={18} /> Đã cập nhật và tự động lưu nháp Mẫu 01!
        </div>
      )}

      {/* 2-COLUMN SPLIT: FORM TRÁI - PREVIEW PHẢI */}
      <div className="party-workspace-grid">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className="party-form-column">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
            <button 
              type="button" 
              onClick={handleReset}
              className="btn-quick-k"
              style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}
            >
              <RotateCcw size={14} /> Đặt lại mẫu mặc định
            </button>
          </div>

          {/* 1. THÔNG TIN TẬP THỂ */}
          <div className="form-card-section">
            <div className="card-section-header">
              <Building2 size={18} color="#b91c1c" />
              <h3>1. Đơn Vị Đảng & Tập Thể Kiểm Điểm</h3>
            </div>

            <div className="card-form-grid">
              <div className="field-group span-2">
                <label>Đảng bộ cơ sở</label>
                <input 
                  type="text" 
                  value={formData.dangBoCoSo || 'Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn'} 
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
                  placeholder="Ví dụ: Chi bộ 1"
                />
              </div>

              <div className="field-group">
                <label>Tên tập thể kiểm điểm</label>
                <input 
                  type="text" 
                  value={formData.tenTapThe} 
                  onChange={e => handleChange('tenTapThe', e.target.value)}
                  placeholder="Ví dụ: Chi ủy Chi bộ 1, Ban Giám hiệu..."
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div className="field-group">
                <label>Địa danh ban hành</label>
                <input 
                  type="text" 
                  value={formData.diaDanh} 
                  onChange={e => handleChange('diaDanh', e.target.value)}
                  placeholder="Chánh Hưng"
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
            </div>
          </div>

          {/* 2. ƯU ĐIỂM, KẾT QUẢ ĐẠT ĐƯỢC */}
          <div className="form-card-section">
            <div className="card-section-header">
              <Check size={18} color="#b91c1c" />
              <h3>2. A.I - Ưu Điểm, Kết Quả Đạt Được Của Tập Thể</h3>
            </div>

            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>1. Chấp hành Cương lĩnh, Điều lệ Đảng, Nghị quyết, nguyên tắc tập trung dân chủ</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('uuDiemChapHanhDuongLoi', 'Chấp hành Cương lĩnh, Điều lệ, Nghị quyết', formData.uuDiemChapHanhDuongLoi)}
                  disabled={loadingField === 'uuDiemChapHanhDuongLoi'}
                >
                  {loadingField === 'uuDiemChapHanhDuongLoi' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.uuDiemChapHanhDuongLoi}
                onChange={e => handleChange('uuDiemChapHanhDuongLoi', e.target.value)}
              />
            </div>

            <div className="textarea-group" style={{ marginTop: '0.85rem' }}>
              <div className="textarea-label-row">
                <label>2. Kết quả thực hiện mục tiêu, chỉ tiêu nhiệm vụ chính trị và chuyên môn trong năm</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('uuDiemThucHienMucTieu', 'Kết quả thực hiện mục tiêu nhiệm vụ chính trị', formData.uuDiemThucHienMucTieu)}
                  disabled={loadingField === 'uuDiemThucHienMucTieu'}
                >
                  {loadingField === 'uuDiemThucHienMucTieu' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.uuDiemThucHienMucTieu}
                onChange={e => handleChange('uuDiemThucHienMucTieu', e.target.value)}
              />
            </div>

            <div className="textarea-group" style={{ marginTop: '0.85rem' }}>
              <div className="textarea-label-row">
                <label>3. Xây dựng, chỉnh đốn Đảng; tinh gọn bộ máy; cải cách hành chính & chuyển đổi số (NQ 57-NQ/TW)</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('uuDiemXayDungChinhDonDang', 'Xây dựng chỉnh đốn Đảng, tinh gọn bộ máy, chuyển đổi số', formData.uuDiemXayDungChinhDonDang)}
                  disabled={loadingField === 'uuDiemXayDungChinhDonDang'}
                >
                  {loadingField === 'uuDiemXayDungChinhDonDang' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.uuDiemXayDungChinhDonDang}
                onChange={e => handleChange('uuDiemXayDungChinhDonDang', e.target.value)}
              />
            </div>

            <div className="textarea-group" style={{ marginTop: '0.85rem' }}>
              <div className="textarea-label-row">
                <label>4. Trách nhiệm của tập thể lãnh đạo, quản lý trong điều hành</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('uuDiemTrachNhiemLanhDao', 'Trách nhiệm tập thể lãnh đạo quản lý', formData.uuDiemTrachNhiemLanhDao)}
                  disabled={loadingField === 'uuDiemTrachNhiemLanhDao'}
                >
                  {loadingField === 'uuDiemTrachNhiemLanhDao' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={3}
                value={formData.uuDiemTrachNhiemLanhDao}
                onChange={e => handleChange('uuDiemTrachNhiemLanhDao', e.target.value)}
              />
            </div>
          </div>

          {/* 3. HẠN CHẾ & NGUYÊN NHÂN */}
          <div className="form-card-section">
            <div className="card-section-header">
              <Users size={18} color="#b91c1c" />
              <h3>3. A.II - Hạn Chế, Khuyết Điểm Và Nguyên Nhân</h3>
            </div>

            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>Hạn chế, khuyết điểm của tập thể</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('hanCheKhuyetDiem', 'Hạn chế khuyết điểm tập thể', formData.hanCheKhuyetDiem)}
                  disabled={loadingField === 'hanCheKhuyetDiem'}
                >
                  {loadingField === 'hanCheKhuyetDiem' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={3}
                value={formData.hanCheKhuyetDiem}
                onChange={e => handleChange('hanCheKhuyetDiem', e.target.value)}
              />
            </div>

            <div className="card-form-grid" style={{ marginTop: '0.65rem' }}>
              <div className="field-group span-2">
                <div className="textarea-label-row">
                  <label>Nguyên nhân khách quan</label>
                  <button
                    type="button"
                    className="btn-ai-field-opt"
                    onClick={() => handleAiRewriteField('nguyenNhanKhachQuan', 'Nguyên nhân khách quan', formData.nguyenNhanKhachQuan)}
                    disabled={loadingField === 'nguyenNhanKhachQuan'}
                  >
                    {loadingField === 'nguyenNhanKhachQuan' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                    Viết lại AI
                  </button>
                </div>
                <textarea 
                  rows={2}
                  value={formData.nguyenNhanKhachQuan}
                  onChange={e => handleChange('nguyenNhanKhachQuan', e.target.value)}
                />
              </div>

              <div className="field-group span-2">
                <div className="textarea-label-row">
                  <label>Nguyên nhân chủ quan</label>
                  <button
                    type="button"
                    className="btn-ai-field-opt"
                    onClick={() => handleAiRewriteField('nguyenNhanChuQuan', 'Nguyên nhân chủ quan', formData.nguyenNhanChuQuan)}
                    disabled={loadingField === 'nguyenNhanChuQuan'}
                  >
                    {loadingField === 'nguyenNhanChuQuan' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                    Viết lại AI
                  </button>
                </div>
                <textarea 
                  rows={2}
                  value={formData.nguyenNhanChuQuan}
                  onChange={e => handleChange('nguyenNhanChuQuan', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 4. KHẮC PHỤC, GIẢI TRÌNH & PHƯƠNG HƯỚNG */}
          <div className="form-card-section">
            <div className="card-section-header">
              <RotateCcw size={18} color="#b91c1c" />
              <h3>4. A.III - VI. Khắc Phục, Giải Trình & Phương Hướng</h3>
            </div>

            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>III. Kết quả khắc phục các hạn chế kỳ kiểm điểm trước</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('ketQuaKhacPhucNamTruoc', 'Kết quả khắc phục hạn chế kỳ trước', formData.ketQuaKhacPhucNamTruoc)}
                  disabled={loadingField === 'ketQuaKhacPhucNamTruoc'}
                >
                  {loadingField === 'ketQuaKhacPhucNamTruoc' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={2}
                value={formData.ketQuaKhacPhucNamTruoc}
                onChange={e => handleChange('ketQuaKhacPhucNamTruoc', e.target.value)}
              />
            </div>

            <div className="textarea-group" style={{ marginTop: '0.85rem' }}>
              <div className="textarea-label-row">
                <label>IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('giaiTrinhGoiYKiemDiem', 'Giải trình vấn đề được gợi ý kiểm điểm', formData.giaiTrinhGoiYKiemDiem)}
                  disabled={loadingField === 'giaiTrinhGoiYKiemDiem'}
                >
                  {loadingField === 'giaiTrinhGoiYKiemDiem' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={2}
                value={formData.giaiTrinhGoiYKiemDiem}
                onChange={e => handleChange('giaiTrinhGoiYKiemDiem', e.target.value)}
              />
            </div>

            <div className="textarea-group" style={{ marginTop: '0.85rem' }}>
              <div className="textarea-label-row">
                <label>V. Trách nhiệm của tập thể, cá nhân</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('trachNhiemTapTheCaNhan', 'Trách nhiệm của tập thể, cá nhân', formData.trachNhiemTapTheCaNhan)}
                  disabled={loadingField === 'trachNhiemTapTheCaNhan'}
                >
                  {loadingField === 'trachNhiemTapTheCaNhan' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={2}
                value={formData.trachNhiemTapTheCaNhan}
                onChange={e => handleChange('trachNhiemTapTheCaNhan', e.target.value)}
              />
            </div>

            <div className="textarea-group" style={{ marginTop: '0.85rem' }}>
              <div className="textarea-label-row">
                <label>VI. Phương hướng, biện pháp khắc phục</label>
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
                rows={3}
                value={formData.phuongHuongKhacPhuc}
                onChange={e => handleChange('phuongHuongKhacPhuc', e.target.value)}
              />
            </div>
          </div>

          {/* 5. TỰ ĐÁNH GIÁ, XẾP LOẠI */}
          <div className="form-card-section">
            <div className="card-section-header">
              <Award size={18} color="#b91c1c" />
              <h3>5. B. Tự Đánh Giá, Chấm Điểm & Đề Xuất Xếp Loại (Phụ lục 1, 2)</h3>
            </div>

            <div className="card-form-grid">
              <div className="field-group">
                <label>Điểm tiêu chí chung (/30 điểm)</label>
                <input 
                  type="number" 
                  min={0} 
                  max={30}
                  value={formData.diemTieuChiChung}
                  onChange={e => handleChange('diemTieuChiChung', Number(e.target.value))}
                />
              </div>

              <div className="field-group">
                <label>Điểm kết quả nhiệm vụ (/70 điểm)</label>
                <input 
                  type="number" 
                  min={0} 
                  max={70}
                  value={formData.diemThucHienNhiemVu}
                  onChange={e => handleChange('diemThucHienNhiemVu', Number(e.target.value))}
                />
              </div>

              <div className="field-group span-2">
                <label>Tự đề xuất xếp loại mức chất lượng tập thể</label>
                <select 
                  value={formData.tuXepLoaiTapThe}
                  onChange={e => handleChange('tuXepLoaiTapThe', e.target.value as any)}
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

        {/* CỘT PHẢI: XEM TRƯỚC VĂN BẢN A4 TRỰC QUAN */}
        <div className="party-preview-column">
          <div className="review-preview-toolbar">
            <div className="review-preview-title">
              <FileText size={18} color="#b91c1c" />
              <span>Xem Trước Báo Cáo Kiểm Điểm Tập Thể (Mẫu 01)</span>
            </div>
            <button 
              type="button" 
              className="btn-quick-k"
              onClick={handleDownloadDocx}
            >
              <Download size={15} /> Tải .doc
            </button>
          </div>

          <div className="review-paper-viewport">
            <div className="review-paper-sheet">
              {/* Header 2 cột */}
              <div className="paper-header-grid">
                <div className="paper-org-left">
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>ĐẢNG BỘ TRƯỜNG CAO ĐẲNG</div>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>BÁCH KHOA NAM SÀI GÒN</div>
                  <div style={{ fontWeight: 'bold' }}>CHI BỘ: {(formData.chiBo || '………..').toUpperCase()}</div>
                  <div style={{ width: '80px', height: '1px', background: '#000', margin: '3px auto 0 auto' }}></div>
                </div>
                <div className="paper-motto-right">
                  <div className="motto-main">ĐẢNG CỘNG SẢN VIỆT NAM</div>
                  <div className="motto-stars">***</div>
                  <div className="motto-date">
                    {formData.diaDanh || 'Chánh Hưng'}, ngày {formData.ngayKhai} tháng {formData.thangKhai} năm {formData.namKhai}
                  </div>
                </div>
              </div>

              {/* Tiêu đề */}
              <div className="paper-title-block">
                <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '11pt' }}>Mẫu 01-HD KĐ.ĐG 2026</div>
                <div className="paper-title-main">BÁO CÁO KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG</div>
                <div className="paper-title-sub">CỦA TẬP THỂ {(formData.tenTapThe || '…………').toUpperCase()}</div>
                <div className="paper-title-sub">Năm {formData.namKiemDiem || '2026'}</div>
                <div className="paper-note">(Kèm theo Hướng dẫn số 397-HD/ĐU ngày 20/11/2026 của Đảng ủy Trường Cao đẳng Bách khoa Nam Sài Gòn)</div>
              </div>

              <div className="paper-p" style={{ fontStyle: 'italic', marginBottom: '10px' }}>
                Căn cứ kết quả lãnh đạo, chỉ đạo thực hiện nhiệm vụ chính trị tại địa phương (cơ quan, đơn vị); tập thể {formData.tenTapThe || '……'} kiểm điểm, tự đánh giá, xếp loại chất lượng với các nội dung chủ yếu sau:
              </div>

              <div className="paper-heading-1">A. NỘI DUNG KIỂM ĐIỂM</div>
              <div className="paper-heading-2">I. Ưu điểm, kết quả đạt được</div>
              <div className="paper-p"><strong>1. Việc chấp hành Cương lĩnh chính trị, Điều lệ Đảng, nghị quyết, chỉ thị, kết luận của Đảng, pháp luật của Nhà nước; nguyên tắc tổ chức và hoạt động của Đảng, nhất là nguyên tắc tập trung dân chủ; thực hiện quy chế làm việc:</strong></div>
              <div className="paper-text-block">{formData.uuDiemChapHanhDuongLoi}</div>

              <div className="paper-p"><strong>2. Kết quả thực hiện các mục tiêu, chỉ tiêu, nhiệm vụ được đề ra trong nghị quyết đại hội nhiệm kỳ, kế hoạch, chương trình công tác năm, được cấp có thẩm quyền giao, phê duyệt:</strong></div>
              <div className="paper-text-block">{formData.uuDiemThucHienMucTieu}</div>

              <div className="paper-p"><strong>3. Công tác xây dựng, chỉnh đốn Đảng và hệ thống chính trị; tinh gọn tổ chức bộ máy; cải cách hành chính và chuyển đổi số:</strong></div>
              <div className="paper-text-block">{formData.uuDiemXayDungChinhDonDang}</div>

              <div className="paper-p"><strong>4. Trách nhiệm của tập thể lãnh đạo, quản lý trong triển khai thực hiện nhiệm vụ chính trị:</strong></div>
              <div className="paper-text-block">{formData.uuDiemTrachNhiemLanhDao}</div>

              <div className="paper-heading-2">II. Hạn chế, khuyết điểm và nguyên nhân</div>
              <div className="paper-p"><strong>1. Hạn chế, khuyết điểm:</strong></div>
              <div className="paper-text-block">{formData.hanCheKhuyetDiem}</div>
              <div className="paper-p"><strong>2. Nguyên nhân của hạn chế, khuyết điểm:</strong></div>
              <div className="paper-text-block">
                - <em>Nguyên nhân khách quan:</em> {formData.nguyenNhanKhachQuan}<br />
                - <em>Nguyên nhân chủ quan:</em> {formData.nguyenNhanChuQuan}
              </div>

              <div className="paper-heading-2">III. Kết quả khắc phục những hạn chế, khuyết điểm đã được cấp có thẩm quyền kết luận hoặc chỉ ra ở các kỳ kiểm điểm trước</div>
              <div className="paper-text-block">{formData.ketQuaKhacPhucNamTruoc}</div>

              <div className="paper-heading-2">IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)</div>
              <div className="paper-text-block">{formData.giaiTrinhGoiYKiemDiem || 'Không có.'}</div>

              <div className="paper-heading-2">V. Trách nhiệm của tập thể, cá nhân</div>
              <div className="paper-text-block">{formData.trachNhiemTapTheCaNhan || 'Tập thể lãnh đạo nghiêm túc tiếp thu và chịu trách nhiệm.'}</div>

              <div className="paper-heading-2">VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm</div>
              <div className="paper-text-block">{formData.phuongHuongKhacPhuc}</div>

              <div className="paper-heading-1">B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI</div>
              <div className="paper-heading-2">I. Đánh giá theo các nhóm tiêu chí</div>
              <div className="paper-p">
                - Nhóm tiêu chí chung: <strong>{formData.diemTieuChiChung}/30 điểm</strong><br />
                - Nhóm tiêu chí về kết quả thực hiện nhiệm vụ: <strong>{formData.diemThucHienNhiemVu}/70 điểm</strong><br />
                - <strong>Tổng điểm: {formData.diemTieuChiChung + formData.diemThucHienNhiemVu}/100 điểm</strong>
              </div>

              <div className="paper-heading-2">II. Đề xuất xếp loại mức chất lượng:</div>
              <div className="paper-p">
                - Mức đề xuất: <strong>{formData.tuXepLoaiTapThe}</strong>
              </div>

              {/* Chữ ký */}
              <div className="paper-signature-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '30px' }}>
                <div></div>
                <div className="sig-col-center">
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>T/M TẬP THỂ LÃNH ĐẠO, QUẢN LÝ</div>
                  <div style={{ fontStyle: 'italic', fontSize: '11pt' }}>(Ký, ghi rõ họ tên và đóng dấu)</div>
                  <div style={{ height: '70px' }}></div>
                  <div style={{ fontWeight: 'bold' }}>...................................................</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL TRỢ LÝ AI SOẠN THẢO */}
      {showAiModal && (
        <div className="review-ai-modal-overlay">
          <div className="review-ai-modal-card">
            <div className="review-ai-modal-header">
              <div className="review-ai-modal-title">
                <Sparkles size={20} color="#b91c1c" />
                <span>Trợ Lý AI Soạn Thảo Kiểm Điểm Tập Thể (Mẫu 01)</span>
              </div>
              <button 
                type="button" 
                className="btn-review-modal-close" 
                onClick={() => setShowAiModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="review-ai-modal-body">
              <p className="review-ai-desc">
                Nhập sơ lược tình hình hoạt động, thành tích đạt được, một số khó khăn hạn chế của Chi bộ/Tập thể trong năm 2026. AI sẽ tự động phân tích và hoàn thiện đầy đủ toàn bộ các mục theo thể thức chuẩn của Đảng.
              </p>

              <textarea 
                className="review-ai-textarea"
                rows={5}
                placeholder="Ví dụ: Chi ủy Chi bộ 1 năm 2026 lãnh đạo hoàn thành 100% nhiệm vụ đào tạo, 100% đảng viên hoàn thành tốt nhiệm vụ, phát triển 2 đảng viên mới, ứng dụng chuyển đổi số và LMS tốt, hạn chế là sinh hoạt chuyên đề đôi lúc còn khô khan..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
              />

              {aiError && (
                <div className="review-ai-error">
                  {aiError}
                </div>
              )}
            </div>

            <div className="review-ai-modal-footer">
              <button 
                type="button" 
                className="btn-review-act secondary"
                onClick={() => setShowAiModal(false)}
                disabled={isAiLoading}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="btn-review-act ai"
                onClick={handleAiGenerate}
                disabled={isAiLoading || !aiPrompt.trim()}
              >
                {isAiLoading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                {isAiLoading ? 'AI đang soạn...' : 'Tạo Báo Cáo Kiểm Điểm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

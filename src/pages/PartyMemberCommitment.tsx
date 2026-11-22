import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Sparkles, 
  RotateCcw, 
  Printer, 
  Building2, 
  Award,
  AlertCircle,
  Wand2,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { 
  type PartyCommitmentData, 
  defaultPartyCommitmentData, 
  exportPartyCommitmentDocx 
} from '../utils/partyCommitmentExport';
import './PartyMemberCommitment.css';

const STORAGE_KEY = 'rchg_party_commitment_draft_v1';

export default function PartyMemberCommitment() {
  const [formData, setFormData] = useState<PartyCommitmentData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu cam kết đảng viên lưu nháp:', e);
    }
    return defaultPartyCommitmentData;
  });

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiError, setAiError] = useState('');
  const [loadingField, setLoadingField] = useState<keyof PartyCommitmentData | null>(null);

  // Tự động lưu nháp
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('Lỗi ghi dữ liệu lưu nháp:', e);
    }
  }, [formData]);

  const handleChange = (field: keyof PartyCommitmentData, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'chiBo') {
        next.chiBoSinhHoat = value;
      }
      return next;
    });
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại bản cam kết tu dưỡng về nội dung chuẩn mặc định?')) {
      setFormData(defaultPartyCommitmentData);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleDownloadDocx = () => {
    exportPartyCommitmentDocx(formData);
  };

  const handlePrint = () => {
    window.print();
  };

  // Trợ lý AI viết lại từng mục cụ thể
  const handleRewriteSection = async (field: keyof PartyCommitmentData, fieldLabel: string) => {
    setLoadingField(field);
    try {
      const currentValue = formData[field] as string;
      const promptInstruction = `
Bạn là chuyên gia thư ký xây dựng Đảng cấp cao. Nhiệm vụ của bạn là viết lại, diễn giải sâu sắc, dài dặn và nâng tầm nội dung mục "${fieldLabel}" trong "Bản cam kết tu dưỡng, rèn luyện, phấn đấu năm ${formData.namCamKet || '2026'}" của cán bộ, đảng viên.
Chức danh người cam kết: ${formData.chucVuChinhQuyen || 'Giảng viên/Chuyên viên'}, Chức vụ Đảng: ${formData.chucVuDang || 'Đảng viên'}, Đơn vị: ${formData.donViCongTac || 'Trường Cao đẳng Bách khoa Nam Sài Gòn'}.

YÊU CẦU ĐẶC BIỆT VỀ CHẤT LƯỢNG VĂN BẢN VÀ NGÔN PHONG ĐẢNG:
1. Độ dài và chi tiết: Viết dài hơn, gồm các điều khoản rõ ràng có đánh số (1., 2., 3., 4.), diễn đạt khúc chiết, súc tích nhưng đầy đủ chiều sâu lý luận và tính khả thi trong thực tiễn. Tuyệt đối không viết ngắn, hời hợt.
2. Ngôn phong chính trị của Đảng: Thể hiện tính tiền phong, gương mẫu, kiên định lập trường chủ nghĩa Mác - Lênin và tư tưởng Hồ Chí Minh; bám sát tinh thần Nghị quyết Trung ương 4 khóa XII, XIII, Kết luận số 01-KL/TW (đẩy mạnh học tập và làm theo Bác), Quy định số 37-QĐ/TW (những điều đảng viên không được làm) và Quy định số 213-QĐ/TW (mối liên hệ nơi cư trú).
3. Tính hành động cụ thể: Gắn liền với đạo đức nghề nghiệp, hoàn thành xuất sắc chức trách chuyên môn năm 2026, tinh thần đổi mới sáng tạo, chuyển đổi số và phục vụ nhân dân, học sinh - sinh viên.

Nội dung hiện tại hoặc ý chính cần viết lại:
"""
${currentValue || 'Hãy viết nội dung cam kết toàn diện, dài dặn, sâu sắc và có tính hành động cao.'}
"""

Trả về duy nhất JSON hợp lệ theo định dạng: {"content": "đoạn văn bản hoàn chỉnh, dài dặn, chuẩn xác theo đúng ngôn phong công tác Đảng"}
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
        handleChange(field, cleanText);
      }
    } catch (err: any) {
      console.error('Lỗi AI viết lại mục:', err);
      alert('Không thể kết nối trợ lý AI lúc này. Vui lòng thử lại!');
    } finally {
      setLoadingField(null);
    }
  };

  // Trợ lý AI soạn thảo toàn bộ bản cam kết
  const handleAiFullGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiError('');

    try {
      const customKey = localStorage.getItem('rchg_gemini_api_key') || '';
      const promptInstruction = `
Bạn là chuyên gia thư ký xây dựng Đảng cấp cao. Dựa vào tóm tắt thông tin của đảng viên, hãy soạn thảo hoàn chỉnh, dài dặn, mẫu mực và sâu sắc toàn bộ 5 phần của "Bản cam kết tu dưỡng, rèn luyện, phấn đấu năm ${formData.namCamKet || '2026'}".

YÊU CẦU ĐẶC BIỆT:
1. Độ dài và chi tiết: Mỗi mục cam kết phải viết dài dặn, phân thành các ý có đánh số 1., 2., 3., nêu rõ mục tiêu, hành động cụ thể, quyết tâm chính trị cao.
2. Ngôn phong chính trị của Đảng: Bám sát Nghị quyết Trung ương 4 khóa XII, Kết luận 21-KL/TW (khóa XIII), Chỉ thị 05-CT/TW, Kết luận 01-KL/TW và Quy định 37-QĐ/TW.

Trả về DUY NHẤT một chuỗi JSON hợp lệ không có giải thích thêm:
{
  "camKetTuTuongChinhTri": "Nội dung chi tiết dài dặn về kiên định chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh, tuyệt đối chấp hành Cương lĩnh, Điều lệ Đảng, đấu tranh phản bác luận điệu sai trái, chống tự diễn biến tự chuyển hóa...",
  "camKetDaoDucLoiSong": "Nội dung chi tiết về tu dưỡng đạo đức cách mạng, cần kiệm liêm chính, khiêm tốn giản dị, thực hiện 19 điều đảng viên không được làm, gương mẫu nơi cư trú theo Quy định 213-QĐ/TW, chống tham nhũng tiêu cực lãng phí...",
  "camKetThucHienNhiemVu": "Nội dung chi tiết về nêu cao tinh thần trách nhiệm, hoàn thành 100% định mức giảng dạy/chuyên môn năm 2026, đổi mới sáng tạo, chuyển đổi số, tận tụy phục vụ nhân dân và người học...",
  "camKetYThucKyLuat": "Nội dung chi tiết về chấp hành nguyên tắc tập trung dân chủ, tự phê bình và phê bình, kỷ luật lao động, văn hóa công sở, sinh hoạt chi bộ và đóng đảng phí đúng quy định...",
  "camKetKhacPhucHanChe": "Nội dung chi tiết về biện pháp và lộ trình khắc phục dứt điểm những hạn chế năm trước (như tính e dè ngại va chạm, dồn việc cuối kỳ...)..."
}

THÔNG TIN VÀ YÊU CẦU:
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

      const resData = await response.json();
      const rawText = resData?.questions?.[0]?.question || resData?.text || resData?.data || '';
      const cleanJsonStr = rawText.replace(/```json\s*|```/g, '').trim();
      const match = cleanJsonStr.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setFormData(prev => ({
          ...prev,
          camKetTuTuongChinhTri: parsed.camKetTuTuongChinhTri || prev.camKetTuTuongChinhTri,
          camKetDaoDucLoiSong: parsed.camKetDaoDucLoiSong || prev.camKetDaoDucLoiSong,
          camKetThucHienNhiemVu: parsed.camKetThucHienNhiemVu || prev.camKetThucHienNhiemVu,
          camKetYThucKyLuat: parsed.camKetYThucKyLuat || prev.camKetYThucKyLuat,
          camKetKhacPhucHanChe: parsed.camKetKhacPhucHanChe || prev.camKetKhacPhucHanChe
        }));
        setShowAiModal(false);
        setAiPrompt('');
      } else {
        throw new Error('Định dạng AI trả về chưa khớp JSON');
      }
    } catch (err: any) {
      console.error('Lỗi AI viết bản cam kết:', err);
      setAiError(err.message || 'Lỗi kết nối AI. Vui lòng kiểm tra lại!');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="review-page-container">
      {/* HEADER CARD */}
      <div className="review-header-card">
        <div>
          <div className="review-header-title">
            <Award size={26} />
            Bản Cam Kết Tu Dưỡng, Rèn Luyện, Phấn Đấu Đảng Viên Năm {formData.namCamKet || '2026'}
          </div>
          <p className="review-header-sub">
            Đăng ký và cam kết rèn luyện tư tưởng chính trị, đạo đức lối sống, thực hiện chức trách và khắc phục hạn chế 
            theo Nghị quyết Trung ương 4 khóa XII, XIII gắn với Chỉ thị số 05-CT/TW và Kết luận số 01-KL/TW.
          </p>
        </div>

        <div className="review-header-actions">
          <button 
            type="button" 
            className="btn-header-act ai"
            onClick={() => setShowAiModal(true)}
          >
            <Sparkles size={16} /> AI Gợi Ý Soạn Thảo
          </button>
          <button 
            type="button" 
            className="btn-header-act primary"
            onClick={handleDownloadDocx}
          >
            <Download size={16} /> Tải File Word (.doc)
          </button>
          <button 
            type="button" 
            className="btn-header-act outline"
            onClick={handlePrint}
          >
            <Printer size={16} /> In Bản Cam Kết
          </button>
        </div>
      </div>

      {/* 2 CỘT CHÍNH: FORM NHẬP LIỆU & LIVE PREVIEW A4 */}
      <div className="review-main-grid">
        {/* CỘT 1: FORM NHẬP LIỆU */}
        <div className="review-form-column">
          {/* 1. THÔNG TIN CẤP ỦY & ĐẢNG VIÊN */}
          <div className="review-section">
            <div className="review-sec-badge" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} />
                1. Thông Tin Cấp Ủy & Đảng Viên Cam Kết
              </div>
              <button 
                type="button" 
                onClick={handleReset} 
                style={{ fontSize: '0.8rem', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RotateCcw size={13} /> Đặt lại mặc định
              </button>
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Đảng bộ cấp trên / Tỉnh ủy</label>
                <input 
                  type="text" 
                  value={formData.tinhUy} 
                  onChange={e => handleChange('tinhUy', e.target.value)}
                />
              </div>
              <div className="review-field">
                <label>Đảng ủy cấp trên trực tiếp</label>
                <input 
                  type="text" 
                  value={formData.huyenUy} 
                  onChange={e => handleChange('huyenUy', e.target.value)}
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
                />
              </div>
              <div className="review-field">
                <label>Chi bộ sinh hoạt</label>
                <input 
                  type="text" 
                  value={formData.chiBo} 
                  onChange={e => handleChange('chiBo', e.target.value)}
                />
              </div>
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Họ và tên đảng viên (In hoa)</label>
                <input 
                  type="text" 
                  value={formData.hoVaTen} 
                  onChange={e => handleChange('hoVaTen', e.target.value.toUpperCase())}
                  style={{ fontWeight: 700 }}
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
                />
              </div>
              <div className="review-field">
                <label>Chức vụ chính quyền / chuyên môn</label>
                <input 
                  type="text" 
                  value={formData.chucVuChinhQuyen} 
                  onChange={e => handleChange('chucVuChinhQuyen', e.target.value)}
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
                />
              </div>
              <div className="review-field">
                <label>Đơn vị công tác</label>
                <input 
                  type="text" 
                  value={formData.donViCongTac} 
                  onChange={e => handleChange('donViCongTac', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 2. CÁC NỘI DUNG CAM KẾT (CÓ NÚT AI VIẾT LẠI TỪNG MỤC) */}
          <div className="review-section">
            <div className="review-sec-badge">
              <CheckCircle2 size={18} />
              2. Nội Dung Đăng Ký, Cam Kết Tu Dưỡng
            </div>

            {/* Mục 1 */}
            <div className="review-field">
              <div className="review-field-header">
                <label>1. Về tư tưởng chính trị</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'camKetTuTuongChinhTri'}
                  onClick={() => handleRewriteSection('camKetTuTuongChinhTri', 'Về tư tưởng chính trị')}
                  title="Nhờ AI viết lại hoặc nâng cấp mục này"
                >
                  {loadingField === 'camKetTuTuongChinhTri' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Gợi ý mục này</span>
                </button>
              </div>
              <textarea 
                rows={5}
                value={formData.camKetTuTuongChinhTri}
                onChange={e => handleChange('camKetTuTuongChinhTri', e.target.value)}
              />
            </div>

            {/* Mục 2 */}
            <div className="review-field">
              <div className="review-field-header">
                <label>2. Về phẩm chất đạo đức, lối sống</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'camKetDaoDucLoiSong'}
                  onClick={() => handleRewriteSection('camKetDaoDucLoiSong', 'Về phẩm chất đạo đức, lối sống')}
                  title="Nhờ AI viết lại hoặc nâng cấp mục này"
                >
                  {loadingField === 'camKetDaoDucLoiSong' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Gợi ý mục này</span>
                </button>
              </div>
              <textarea 
                rows={5}
                value={formData.camKetDaoDucLoiSong}
                onChange={e => handleChange('camKetDaoDucLoiSong', e.target.value)}
              />
            </div>

            {/* Mục 3 */}
            <div className="review-field">
              <div className="review-field-header">
                <label>3. Về thực hiện chức trách, nhiệm vụ được giao</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'camKetThucHienNhiemVu'}
                  onClick={() => handleRewriteSection('camKetThucHienNhiemVu', 'Về thực hiện chức trách nhiệm vụ')}
                  title="Nhờ AI viết lại hoặc nâng cấp mục này"
                >
                  {loadingField === 'camKetThucHienNhiemVu' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Gợi ý mục này</span>
                </button>
              </div>
              <textarea 
                rows={5}
                value={formData.camKetThucHienNhiemVu}
                onChange={e => handleChange('camKetThucHienNhiemVu', e.target.value)}
              />
            </div>

            {/* Mục 4 */}
            <div className="review-field">
              <div className="review-field-header">
                <label>4. Về tổ chức kỷ luật và ý thức tổ chức kỷ luật</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'camKetYThucKyLuat'}
                  onClick={() => handleRewriteSection('camKetYThucKyLuat', 'Về tổ chức kỷ luật')}
                  title="Nhờ AI viết lại hoặc nâng cấp mục này"
                >
                  {loadingField === 'camKetYThucKyLuat' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Gợi ý mục này</span>
                </button>
              </div>
              <textarea 
                rows={5}
                value={formData.camKetYThucKyLuat}
                onChange={e => handleChange('camKetYThucKyLuat', e.target.value)}
              />
            </div>

            {/* Mục 5 */}
            <div className="review-field">
              <div className="review-field-header">
                <label>5. Về khắc phục, sửa chữa hạn chế, khuyết điểm năm trước</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'camKetKhacPhucHanChe'}
                  onClick={() => handleRewriteSection('camKetKhacPhucHanChe', 'Về khắc phục hạn chế khuyết điểm')}
                  title="Nhờ AI viết lại hoặc nâng cấp mục này"
                >
                  {loadingField === 'camKetKhacPhucHanChe' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Gợi ý mục này</span>
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.camKetKhacPhucHanChe}
                onChange={e => handleChange('camKetKhacPhucHanChe', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* CỘT 2: LIVE PAPER SHEET A4 */}
        <div className="review-preview-column">
          <div className="review-preview-topbar">
            <div className="preview-title-tag">
              <FileText size={16} color="#b91c1c" />
              Xem Trước Bản Cam Kết A4 (Chuẩn Thể Thức Đảng)
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
                  <div className="org-upper">{formData.tinhUy}</div>
                  <div className="org-upper">{formData.huyenUy}</div>
                  <div style={{ fontWeight: 'bold' }}>{formData.dangBoCoSo}</div>
                  <div>Chi bộ: {formData.chiBo || formData.chiBoSinhHoat}</div>
                </div>
                <div className="paper-motto-right">
                  <div className="motto-main">ĐẢNG CỘNG SẢN VIỆT NAM</div>
                  <div className="motto-date">
                    {formData.diaDanh}, ngày {formData.ngayKhai} tháng {formData.thangKhai} năm {formData.namKhai}
                  </div>
                </div>
              </div>

              {/* Tiêu đề */}
              <div className="paper-title-block">
                <h2 className="paper-title-main">BẢN CAM KẾT<br/>TU DƯỠNG, RÈN LUYỆN, PHẤN ĐẤU NĂM {formData.namCamKet || '2026'}</h2>
                <div className="paper-title-sub">
                  (Thực hiện Nghị quyết Trung ương 4 khóa XII, XIII gắn với Chỉ thị số 05-CT/TW, Kết luận số 01-KL/TW và Quy định số 37-QĐ/TW)
                </div>
              </div>

              {/* Thông tin */}
              <div className="paper-p">
                - Họ và tên: <strong style={{ textTransform: 'uppercase', fontSize: '13pt' }}>{formData.hoVaTen}</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', margin: '3px 0' }}>
                <div>- Ngày sinh: <strong>{formData.namSinh}</strong></div>
                <div>- Chi bộ sinh hoạt: <strong>{formData.chiBo || formData.chiBoSinhHoat}</strong></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', margin: '3px 0' }}>
                <div>- Chức vụ Đảng: <strong>{formData.chucVuDang}</strong></div>
                <div>- Chức vụ chính quyền: <strong>{formData.chucVuChinhQuyen}</strong></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', margin: '3px 0' }}>
                <div>- Chức vụ đoàn thể: <strong>{formData.chucVuDoanThe || 'Không'}</strong></div>
                <div>- Đơn vị công tác: <strong>{formData.donViCongTac}</strong></div>
              </div>

              <div className="paper-p indent" style={{ marginTop: '12px' }}>
                Sau khi học tập, quán triệt các Nghị quyết, Chỉ thị, Kết luận và Quy định của Đảng, căn cứ vào chức trách, nhiệm vụ được giao trong năm {formData.namCamKet || '2026'}, bản thân tôi xin đăng ký, cam kết tu dưỡng, rèn luyện, phấn đấu cụ thể như sau:
              </div>

              <div className="paper-sec-head">1. Về tư tưởng chính trị</div>
              <div className="paper-p" style={{ whiteSpace: 'pre-line' }}>{formData.camKetTuTuongChinhTri}</div>

              <div className="paper-sec-head">2. Về phẩm chất đạo đức, lối sống</div>
              <div className="paper-p" style={{ whiteSpace: 'pre-line' }}>{formData.camKetDaoDucLoiSong}</div>

              <div className="paper-sec-head">3. Về thực hiện chức trách, nhiệm vụ được giao</div>
              <div className="paper-p" style={{ whiteSpace: 'pre-line' }}>{formData.camKetThucHienNhiemVu}</div>

              <div className="paper-sec-head">4. Về tổ chức kỷ luật và ý thức tổ chức kỷ luật</div>
              <div className="paper-p" style={{ whiteSpace: 'pre-line' }}>{formData.camKetYThucKyLuat}</div>

              <div className="paper-sec-head">5. Về khắc phục, sửa chữa hạn chế, khuyết điểm năm trước</div>
              <div className="paper-p" style={{ whiteSpace: 'pre-line' }}>{formData.camKetKhacPhucHanChe}</div>

              <div className="paper-p indent" style={{ marginTop: '14px' }}>
                Bản cam kết này được làm thành 02 bản: 01 bản cá nhân lưu giữ để phấn đấu thực hiện, 01 bản gửi Chi ủy Chi bộ theo dõi, giám sát và làm cơ sở kiểm điểm, đánh giá, xếp loại chất lượng đảng viên cuối năm {formData.namCamKet || '2026'}.
              </div>

              {/* Chữ ký 2 bên */}
              <div className="paper-signature-grid">
                <div>
                  <div style={{ fontWeight: 'bold' }}>Ý KIẾN CỦA CHI ỦY CHI BỘ</div>
                  <div style={{ fontStyle: 'italic', fontSize: '9.5pt', marginBottom: '60px' }}>(Ký, ghi rõ họ tên và chức vụ)</div>
                  <div style={{ fontWeight: 'bold' }}>................................................</div>
                </div>
                <div>
                  <div style={{ fontStyle: 'italic', fontSize: '9.5pt' }}>
                    {formData.diaDanh}, ngày {formData.ngayKhai} tháng {formData.thangKhai} năm {formData.namKhai}
                  </div>
                  <div style={{ fontWeight: 'bold' }}>NGƯỜI CAM KẾT</div>
                  <div style={{ fontStyle: 'italic', fontSize: '9.5pt', marginBottom: '60px' }}>(Ký và ghi rõ họ tên)</div>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{formData.hoVaTen}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL TRỢ LÝ AI SOẠN THẢO BẢN CAM KẾT */}
      {showAiModal && (
        <div className="ai-modal-backdrop" onClick={() => setShowAiModal(false)}>
          <div className="ai-modal-card" onClick={e => e.stopPropagation()}>
            <div className="ai-modal-header">
              <div className="ai-modal-title">
                <Sparkles size={20} color="#b91c1c" />
                Trợ Lý AI Soạn Thảo Bản Cam Kết Tu Dưỡng Đảng Viên
              </div>
              <button className="ai-modal-close" onClick={() => setShowAiModal(false)}>✕</button>
            </div>

            <div className="ai-modal-body">
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                Mô tả ngắn gọn vị trí chuyên môn, các nhiệm vụ trọng tâm và những điểm cần khắc phục trong năm {formData.namCamKet || '2026'}. 
                Trợ lý AI sẽ tự động điền trọn vẹn cả 5 mục cam kết theo đúng chuẩn ngôn phong của Đảng:
              </p>

              <textarea
                className="ai-modal-prompt"
                rows={4}
                placeholder="Ví dụ: Tôi là giảng viên khoa CNTT, nhiệm vụ năm nay là dạy tốt 100% tiết chuẩn, tham gia viết 1 bài báo khoa học và hỗ trợ chuyển đổi số của trường. Cần khắc phục việc còn ngại phát biểu trong sinh hoạt chi bộ..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
              />

              {aiError && (
                <div style={{ marginTop: '10px', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} /> {aiError}
                </div>
              )}
            </div>

            <div className="ai-modal-footer">
              <button 
                type="button" 
                style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setShowAiModal(false)}
              >
                Đóng
              </button>
              <button 
                type="button" 
                style={{ padding: '8px 18px', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleAiFullGenerate}
                disabled={isAiLoading}
              >
                {isAiLoading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                {isAiLoading ? 'AI Đang viết...' : 'AI Tạo Nội Dung Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

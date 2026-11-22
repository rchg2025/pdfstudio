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
  AlertCircle,
  Wand2,
  Loader2
} from 'lucide-react';
import { 
  type PartySelfReview02AData, 
  defaultPartySelfReview02AData, 
  exportPartySelfReview02ADocx 
} from '../utils/partySelfReview02AExport';
import './PartyMemberSelfReview02A.css';

const STORAGE_KEY = 'rchg_party_self_review_02a_draft_v1';

export default function PartyMemberSelfReview02A() {
  const [formData, setFormData] = useState<PartySelfReview02AData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu kiểm điểm lưu nháp:', e);
    }
    return defaultPartySelfReview02AData;
  });

  const [savedToast, setSavedToast] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [loadingField, setLoadingField] = useState<keyof PartySelfReview02AData | null>(null);
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

  const handleChange = (field: keyof PartySelfReview02AData, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'chiBo') {
        next.chiBoSinhHoat = value;
      }
      return next;
    });
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại bản kiểm điểm về nội dung chuẩn mặc định?')) {
      setFormData(defaultPartySelfReview02AData);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleDownloadDocx = () => {
    exportPartySelfReview02ADocx(formData);
  };

  const handlePrint = () => {
    window.print();
  };

  // Trợ lý AI Viết Lại Từng Mục Cụ Thể (Field-level AI Rewrite)
  const handleRewriteSection = async (field: keyof PartySelfReview02AData, fieldLabel: string) => {
    setLoadingField(field);
    try {
      const currentValue = formData[field] as string;
      const customKey = localStorage.getItem('rchg_gemini_api_key') || '';
      const promptInstruction = `
Bạn là chuyên gia thư ký xây dựng Đảng cấp cao. Nhiệm vụ của bạn là viết lại, mở rộng sâu sắc và chuẩn hóa nội dung mục "${fieldLabel}" trong "Bản kiểm điểm cán bộ lãnh đạo, quản lý cuối năm Mẫu 02A (năm 2026, Hướng dẫn 43-HD/BTCTW & Công văn 2772-CV/BTCTW)".
Chức vụ chính quyền/lãnh đạo: ${formData.chucVuChinhQuyen || 'Trưởng phòng/Trưởng khoa/Cán bộ quản lý'}, Chức vụ Đảng: ${formData.chucVuDang || 'Chi ủy viên/Bí thư'}, Đơn vị: ${formData.donViCongTac || 'Trường Cao đẳng Bách khoa Nam Sài Gòn'}.

YÊU CẦU ĐẶC BIỆT VỀ CHẤT LƯỢNG VĂN BẢN:
1. Độ dài và chi tiết: Viết dài hơn, sâu sắc, phân tích có luận cứ, dẫn chứng mạch lạc (đạt từ 3 đến 5 đoạn văn hoặc các ý có đánh số 1., 2., 3. rõ ràng). Tuyệt đối không viết ngắn ngủi, chung chung, sáo rỗng.
2. Ngôn phong công tác Đảng: Sử dụng thuật ngữ chính trị chuẩn mực, trang trọng, lập trường tư tưởng kiên định, thể hiện rõ tính đảng, tính chiến đấu, tinh thần tự phê bình và phê bình nghiêm túc.
3. Đặc thù lãnh đạo, quản lý: Nêu bật tinh thần trách nhiệm nêu gương của người đứng đầu, năng động, sáng tạo, dám nghĩ, dám làm, dám chịu trách nhiệm vì lợi ích chung; công tác xây dựng khối đại đoàn kết nội bộ, chỉ đạo chuyên môn, phòng chống tham nhũng, lãng phí, tiêu cực và cải cách hành chính, chuyển đổi số.

Nội dung hiện tại hoặc ý chính cần viết lại:
"""
${currentValue || 'Hãy viết nội dung toàn diện, sâu sắc, mẫu mực và nêu cao tinh thần trách nhiệm của cán bộ lãnh đạo quản lý.'}
"""

Trả về duy nhất JSON hợp lệ theo định dạng: {"content": "đoạn văn bản hoàn chỉnh, dài dặn, chuẩn mực, giàu tính thuyết phục theo đúng ngôn phong công tác Đảng"}
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
      const rawText = resData?.questions?.[0]?.question || resData?.text || resData?.data || '';
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

  // Trợ lý AI Viết / Hoàn thiện bản kiểm điểm Mẫu 02A
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiError('');

    try {
      const customKey = localStorage.getItem('rchg_gemini_api_key') || '';
      const promptInstruction = `
Bạn là chuyên gia thư ký xây dựng Đảng cấp cao. Nhiệm vụ của bạn là dựa vào tóm tắt hoạt động trong năm của một cán bộ lãnh đạo/quản lý để soạn thảo hoàn chỉnh, sâu sắc và toàn diện "Bản kiểm điểm, tự đánh giá, xếp loại cá nhân Mẫu 02A (năm 2026, Hướng dẫn 43-HD/BTCTW, Công văn 2772-CV/BTCTW)".

YÊU CẦU ĐẶC BIỆT VỀ CHẤT LƯỢNG NỘI DUNG VÀ NGÔN PHONG:
1. Độ dài và tính sâu sắc: Mỗi mục ưu điểm cần viết từ 2 đến 4 ý cụ thể (đánh số 1., 2., 3.), có dẫn chứng thực tế, phân tích thuyết phục, tuyệt đối không viết ngắn cụt lủn hay sao chép chung chung.
2. Ngôn phong chính trị của Đảng: Nghiêm túc, trang trọng, thẳng thắn, có tính tự phê bình và phê bình sâu sắc; bám sát các tiêu chí Quy định 124-QĐ/TW, Quy định 37-QĐ/TW, Kết luận 01-KL/TW.
3. Vai trò người đứng đầu/quản lý: Nêu bật tính tiền phong gương mẫu, năng lực đổi mới sáng tạo, chuyển đổi số, dám nghĩ dám làm, tinh thần trách nhiệm xây dựng khối đoàn kết nội bộ và lãnh đạo đơn vị hoàn thành xuất sắc nhiệm vụ.

Trả về DUY NHẤT một chuỗi JSON hợp lệ không có giải thích thêm với cấu trúc:
{
  "uuDiemPhamChatChinhTri": "Nội dung chi tiết dài dặn về phẩm chất chính trị, đạo đức, lối sống, giữ gìn đoàn kết, phòng chống tự diễn biến tự chuyển hóa...",
  "uuDiemThucHienNhiemVu": "Nội dung chi tiết về lãnh đạo thực hiện nhiệm vụ chuyên môn, chỉ tiêu công tác năm 2026, cải tiến quy trình...",
  "uuDiemCamKetTuDuong": "Nội dung chi tiết việc thực hiện cam kết tu dưỡng, giữ mối liên hệ nơi cư trú theo Quy định 213-QĐ/TW...",
  "uuDiemLanhDaoQuanLy": "Nội dung sâu sắc về năng lực quản lý điều hành, dân chủ cơ sở, phân công giao việc và kiểm tra đôn đốc...",
  "uuDiemTrachNhiemDoiMoi": "Nội dung về tinh thần đổi mới, dám nghĩ dám làm, cải cách hành chính, chuyển đổi số, ứng dụng công nghệ...",
  "uuDiemTrachNhiemNeuGuong": "Nội dung về trách nhiệm nêu gương của người lãnh đạo đối với cấp dưới và quần chúng, phòng chống tham nhũng tiêu cực...",
  "hanCheKhuyetDiem": "Chỉ rõ 2-3 hạn chế, tồn tại mang tính xây dựng trong quản lý điều hành...",
  "nguyenNhanKhachQuan": "Phân tích nguyên nhân khách quan một cách thấu đáo...",
  "nguyenNhanChuQuan": "Phân tích nguyên nhân chủ quan trung thực, thẳng thắn...",
  "ketQuaKhacPhucNamTruoc": "Nêu rõ kết quả và tiến bộ đã khắc phục so với hạn chế của năm trước...",
  "giaiTrinhGoiYKiemDiem": "Giải trình trách nhiệm rõ ràng hoặc ghi không có gợi ý kiểm điểm...",
  "phuongHuongKhacPhuc": "3-4 phương hướng, biện pháp, lộ trình khắc phục cụ thể, khả thi cho năm 2027..."
}

THÔNG TIN HOẠT ĐỘNG VÀ VỊ TRÍ CỦA CÁN BỘ LÃNH ĐẠO:
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
      console.error('Lỗi AI hỗ trợ kiểm điểm:', err);
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
            Bản Kiểm Điểm Đảng Viên Cuối Năm (Mẫu 02A - Lãnh Đạo, Quản Lý)
          </h1>
          <p>
            Tự đánh giá, xếp loại chất lượng năm 2026 dành riêng cho cá nhân giữ chức vụ lãnh đạo, quản lý 
            theo Hướng dẫn số 43-HD/BTCTW và Công văn số 2772-CV/BTCTW của Ban Tổ chức Trung ương.
          </p>
        </div>
        <div className="party-review-actions">
          <button 
            type="button" 
            className="btn-review-act secondary"
            onClick={() => setShowAiModal(true)}
          >
            <Sparkles size={18} />
            AI Soạn Thảo / Chuẩn Hóa
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
              1. Thông Tin Cấp Ủy & Cán Bộ Lãnh Đạo
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
                <label>Huyện ủy / Đảng ủy cấp trên trực tiếp</label>
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
                <label>Họ và tên cán bộ (In hoa)</label>
                <input 
                  type="text" 
                  value={formData.hoVaTen} 
                  onChange={e => handleChange('hoVaTen', e.target.value.toUpperCase())}
                  placeholder="NGUYỄN VĂN A"
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
                  placeholder="Bí thư Chi bộ, Đảng ủy viên..."
                />
              </div>
              <div className="review-field">
                <label>Chức vụ chính quyền / chuyên môn</label>
                <input 
                  type="text" 
                  value={formData.chucVuChinhQuyen} 
                  onChange={e => handleChange('chucVuChinhQuyen', e.target.value)}
                  placeholder="Trưởng khoa, Trưởng phòng, Hiệu trưởng..."
                />
              </div>
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Chức vụ đoàn thể (nếu có)</label>
                <input 
                  type="text" 
                  value={formData.chucVuDoanThe} 
                  onChange={e => handleChange('chucVuDoanThe', e.target.value)}
                  placeholder="Chủ tịch Công đoàn, Bí thư Đoàn TN..."
                />
              </div>
              <div className="review-field">
                <label>Đơn vị công tác</label>
                <input 
                  type="text" 
                  value={formData.donViCongTac} 
                  onChange={e => handleChange('donViCongTac', e.target.value)}
                  placeholder="Khoa Công nghệ Thông tin..."
                />
              </div>
            </div>
          </div>

          {/* 2. PHẦN A.I: ƯU ĐIỂM, KẾT QUẢ ĐẠT ĐƯỢC */}
          <div className="review-section">
            <div className="review-sec-badge">
              <UserCheck size={18} />
              I. Ưu Điểm, Kết Quả Đạt Được (6 Tiêu Chí)
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>1. Về phẩm chất chính trị, đạo đức, lối sống, ý thức tổ chức kỷ luật</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'uuDiemPhamChatChinhTri'}
                  onClick={() => handleRewriteSection('uuDiemPhamChatChinhTri', 'Phẩm chất chính trị, đạo đức, lối sống')}
                  title="Nhờ AI viết lại hoặc trau chuốt mục này"
                >
                  {loadingField === 'uuDiemPhamChatChinhTri' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Viết lại mục này</span>
                </button>
              </div>
              <textarea 
                rows={5}
                value={formData.uuDiemPhamChatChinhTri}
                onChange={e => handleChange('uuDiemPhamChatChinhTri', e.target.value)}
              />
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>2. Về thực hiện nhiệm vụ, quyền hạn và chỉ tiêu chuyên môn trong năm</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'uuDiemThucHienNhiemVu'}
                  onClick={() => handleRewriteSection('uuDiemThucHienNhiemVu', 'Thực hiện nhiệm vụ chuyên môn và quyền hạn')}
                  title="Nhờ AI viết lại hoặc trau chuốt mục này"
                >
                  {loadingField === 'uuDiemThucHienNhiemVu' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Viết lại mục này</span>
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.uuDiemThucHienNhiemVu}
                onChange={e => handleChange('uuDiemThucHienNhiemVu', e.target.value)}
              />
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'uuDiemCamKetTuDuong'}
                  onClick={() => handleRewriteSection('uuDiemCamKetTuDuong', 'Thực hiện cam kết tu dưỡng, rèn luyện')}
                  title="Nhờ AI viết lại hoặc trau chuốt mục này"
                >
                  {loadingField === 'uuDiemCamKetTuDuong' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Viết lại mục này</span>
                </button>
              </div>
              <textarea 
                rows={3}
                value={formData.uuDiemCamKetTuDuong}
                onChange={e => handleChange('uuDiemCamKetTuDuong', e.target.value)}
              />
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>4. Kết quả công tác lãnh đạo, chỉ đạo, quản lý, điều hành & đoàn kết nội bộ (Đặc thù Lãnh đạo)</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'uuDiemLanhDaoQuanLy'}
                  onClick={() => handleRewriteSection('uuDiemLanhDaoQuanLy', 'Kết quả công tác lãnh đạo chỉ đạo quản lý điều hành')}
                  title="Nhờ AI viết lại hoặc trau chuốt mục này"
                >
                  {loadingField === 'uuDiemLanhDaoQuanLy' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Viết lại mục này</span>
                </button>
              </div>
              <textarea 
                rows={5}
                value={formData.uuDiemLanhDaoQuanLy}
                onChange={e => handleChange('uuDiemLanhDaoQuanLy', e.target.value)}
              />
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>5. Trách nhiệm đổi mới sáng tạo, dám nghĩ dám làm, cải cách hành chính & chuyển đổi số</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'uuDiemTrachNhiemDoiMoi'}
                  onClick={() => handleRewriteSection('uuDiemTrachNhiemDoiMoi', 'Trách nhiệm đổi mới sáng tạo dám nghĩ dám làm chuyển đổi số')}
                  title="Nhờ AI viết lại hoặc trau chuốt mục này"
                >
                  {loadingField === 'uuDiemTrachNhiemDoiMoi' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Viết lại mục này</span>
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.uuDiemTrachNhiemDoiMoi}
                onChange={e => handleChange('uuDiemTrachNhiemDoiMoi', e.target.value)}
              />
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>6. Trách nhiệm nêu gương bản thân và gia đình; phòng chống tham nhũng, tiêu cực</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'uuDiemTrachNhiemNeuGuong'}
                  onClick={() => handleRewriteSection('uuDiemTrachNhiemNeuGuong', 'Trách nhiệm nêu gương bản thân và gia đình')}
                  title="Nhờ AI viết lại hoặc trau chuốt mục này"
                >
                  {loadingField === 'uuDiemTrachNhiemNeuGuong' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Viết lại mục này</span>
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.uuDiemTrachNhiemNeuGuong}
                onChange={e => handleChange('uuDiemTrachNhiemNeuGuong', e.target.value)}
              />
            </div>
          </div>

          {/* 3. PHẦN A.II: HẠN CHẾ, KHUYẾT ĐIỂM & NGUYÊN NHÂN */}
          <div className="review-section">
            <div className="review-sec-badge">
              <AlertCircle size={18} />
              II. Hạn Chế, Khuyết Điểm & Nguyên Nhân
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>1. Hạn chế, khuyết điểm</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'hanCheKhuyetDiem'}
                  onClick={() => handleRewriteSection('hanCheKhuyetDiem', 'Hạn chế khuyết điểm')}
                  title="Nhờ AI viết lại hoặc trau chuốt mục này"
                >
                  {loadingField === 'hanCheKhuyetDiem' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Viết lại mục này</span>
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.hanCheKhuyetDiem}
                onChange={e => handleChange('hanCheKhuyetDiem', e.target.value)}
              />
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>2a. Nguyên nhân khách quan</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'nguyenNhanKhachQuan'}
                  onClick={() => handleRewriteSection('nguyenNhanKhachQuan', 'Nguyên nhân khách quan')}
                  title="Nhờ AI viết lại hoặc trau chuốt mục này"
                >
                  {loadingField === 'nguyenNhanKhachQuan' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Viết lại mục này</span>
                </button>
              </div>
              <textarea 
                rows={2}
                value={formData.nguyenNhanKhachQuan}
                onChange={e => handleChange('nguyenNhanKhachQuan', e.target.value)}
              />
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>2b. Nguyên nhân chủ quan (chú trọng tự soi rọi)</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'nguyenNhanChuQuan'}
                  onClick={() => handleRewriteSection('nguyenNhanChuQuan', 'Nguyên nhân chủ quan')}
                  title="Nhờ AI viết lại hoặc trau chuốt mục này"
                >
                  {loadingField === 'nguyenNhanChuQuan' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Viết lại mục này</span>
                </button>
              </div>
              <textarea 
                rows={2}
                value={formData.nguyenNhanChuQuan}
                onChange={e => handleChange('nguyenNhanChuQuan', e.target.value)}
              />
            </div>
          </div>

          {/* 4. PHẦN A.III, IV, V: KHẮC PHỤC, GIẢI TRÌNH & PHƯƠNG HƯỚNG */}
          <div className="review-section">
            <div className="review-sec-badge">
              <FileText size={18} />
              III, IV, V. Khắc Phục, Giải Trình & Phương Hướng
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>III. Kết quả khắc phục các hạn chế, khuyết điểm kỳ kiểm điểm trước (2025)</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'ketQuaKhacPhucNamTruoc'}
                  onClick={() => handleRewriteSection('ketQuaKhacPhucNamTruoc', 'Kết quả khắc phục hạn chế năm trước')}
                  title="Nhờ AI viết lại hoặc trau chuốt mục này"
                >
                  {loadingField === 'ketQuaKhacPhucNamTruoc' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Viết lại mục này</span>
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
                <label>IV. Giải trình những vấn đề được cấp có thẩm quyền gợi ý kiểm điểm (nếu có)</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'giaiTrinhGoiYKiemDiem'}
                  onClick={() => handleRewriteSection('giaiTrinhGoiYKiemDiem', 'Giải trình vấn đề được gợi ý kiểm điểm')}
                  title="Nhờ AI viết lại hoặc trau chuốt mục này"
                >
                  {loadingField === 'giaiTrinhGoiYKiemDiem' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Viết lại mục này</span>
                </button>
              </div>
              <textarea 
                rows={2}
                value={formData.giaiTrinhGoiYKiemDiem}
                onChange={e => handleChange('giaiTrinhGoiYKiemDiem', e.target.value)}
                placeholder="Ghi 'Không có' nếu không thuộc diện gợi ý kiểm điểm"
              />
            </div>

            <div className="review-field">
              <div className="review-field-header">
                <label>V. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm thời gian tới</label>
                <button
                  type="button"
                  className="btn-field-ai"
                  disabled={loadingField === 'phuongHuongKhacPhuc'}
                  onClick={() => handleRewriteSection('phuongHuongKhacPhuc', 'Phương hướng biện pháp khắc phục hạn chế thời gian tới')}
                  title="Nhờ AI viết lại hoặc trau chuốt mục này"
                >
                  {loadingField === 'phuongHuongKhacPhuc' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  <span>AI Viết lại mục này</span>
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.phuongHuongKhacPhuc}
                onChange={e => handleChange('phuongHuongKhacPhuc', e.target.value)}
              />
            </div>
          </div>

          {/* 5. TỰ NHẬN MỨC XẾP LOẠI CHẤT LƯỢNG */}
          <div className="review-section">
            <div className="review-sec-badge">
              <Award size={18} />
              VI. Tự Nhận Mức Xếp Loại Chất Lượng
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>1. Xếp loại Cán bộ Lãnh đạo, Quản lý</label>
                <select 
                  value={formData.tuXepLoaiCanBo}
                  onChange={e => handleChange('tuXepLoaiCanBo', e.target.value)}
                >
                  <option value="Hoàn thành xuất sắc nhiệm vụ">Hoàn thành xuất sắc nhiệm vụ</option>
                  <option value="Hoàn thành tốt nhiệm vụ">Hoàn thành tốt nhiệm vụ</option>
                  <option value="Hoàn thành nhiệm vụ">Hoàn thành nhiệm vụ</option>
                  <option value="Không hoàn thành nhiệm vụ">Không hoàn thành nhiệm vụ</option>
                </select>
              </div>

              <div className="review-field">
                <label>2. Xếp loại Chất lượng Đảng viên</label>
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
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Địa danh</label>
                <input 
                  type="text" 
                  value={formData.diaDanh} 
                  onChange={e => handleChange('diaDanh', e.target.value)}
                />
              </div>
              <div className="review-field">
                <label>Thời gian ký</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '0.4rem' }}>
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

        </div>

        {/* CỘT PHẢI: XEM TRƯỚC PAPER VIEW A4 */}
        <div className="party-review-sticky">
          <div className="review-preview-toolbar">
            <div className="review-preview-title">
              <FileText size={18} color="#b91c1c" />
              Xem Trước Bản Kiểm Điểm A4 (Chuẩn Mẫu 02A)
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
                  <div className="org-upper">{formData.tinhUy || 'ĐẢNG BỘ ...................................'}</div>
                  <div className="org-upper">{formData.huyenUy || '.......................................................'}</div>
                  <div style={{ fontWeight: 'bold' }}>{formData.dangBoCoSo || 'Đảng bộ cơ sở .................................'}</div>
                  <div>Chi bộ: {formData.chiBo || '............................................'}</div>
                </div>
                <div className="paper-motto-right">
                  <div className="motto-main">ĐẢNG CỘNG SẢN VIỆT NAM</div>
                  <div className="motto-stars">***</div>
                  <div className="motto-date">
                    {formData.diaDanh || '.........'}, ngày {formData.ngayKhai || '....'} tháng {formData.thangKhai || '....'} năm {formData.namKhai || '202...'}
                  </div>
                </div>
              </div>

              {/* Tiêu đề */}
              <div className="paper-title-block">
                <div style={{ fontSize: '11pt', fontWeight: 'bold', textAlign: 'right', marginBottom: '4px' }}>Mẫu 02A-HD KĐ.ĐG</div>
                <h2 className="paper-title-main">BẢN KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CỦA CÁ NHÂN</h2>
                <div className="paper-title-sub">Năm {formData.namKiemDiem || '2026'}</div>
                <div className="paper-note">
                  (Dành cho cá nhân giữ chức vụ lãnh đạo, quản lý; dùng cho kiểm điểm năm 2026 theo Hướng dẫn số 43-HD/BTCTW và Công văn số 2772-CV/BTCTW)
                </div>
              </div>

              {/* Thông tin */}
              <div className="paper-p">
                - Họ và tên: <strong style={{ textTransform: 'uppercase', fontSize: '13pt' }}>
                  {formData.hoVaTen || '...........................................................................'}
                </strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', margin: '3px 0' }}>
                <div>- Ngày sinh: <strong>{formData.namSinh || '................................'}</strong></div>
                <div>- Chi bộ sinh hoạt: <strong>{formData.chiBo || formData.chiBoSinhHoat || '................................'}</strong></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', margin: '3px 0' }}>
                <div>- Chức vụ Đảng: <strong>{formData.chucVuDang || '................................'}</strong></div>
                <div>- Chức vụ chính quyền: <strong>{formData.chucVuChinhQuyen || '................................'}</strong></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', margin: '3px 0' }}>
                <div>- Chức vụ đoàn thể: <strong>{formData.chucVuDoanThe || 'Không'}</strong></div>
                <div>- Đơn vị công tác: <strong>{formData.donViCongTac || '................................'}</strong></div>
              </div>

              <div className="paper-sec-head" style={{ textAlign: 'center', marginTop: '16px' }}>A. NỘI DUNG KIỂM ĐIỂM</div>

              <div className="paper-p"><strong>I. Ưu điểm, kết quả đạt được</strong></div>
              
              <div className="paper-p" style={{ paddingLeft: '12px' }}>
                <strong>1. Về phẩm chất chính trị, đạo đức, lối sống; tinh thần đoàn kết, thống nhất; ý thức tổ chức kỷ luật:</strong>
              </div>
              <div className="paper-indent" style={{ whiteSpace: 'pre-line', marginBottom: '8px' }}>
                {formData.uuDiemPhamChatChinhTri}
              </div>

              <div className="paper-p" style={{ paddingLeft: '12px' }}>
                <strong>2. Về thực hiện nhiệm vụ, quyền hạn và kết quả thực hiện các chỉ tiêu, nhiệm vụ:</strong>
              </div>
              <div className="paper-indent" style={{ whiteSpace: 'pre-line', marginBottom: '8px' }}>
                {formData.uuDiemThucHienNhiemVu}
              </div>

              <div className="paper-p" style={{ paddingLeft: '12px' }}>
                <strong>3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu của cá nhân:</strong>
              </div>
              <div className="paper-indent" style={{ whiteSpace: 'pre-line', marginBottom: '8px' }}>
                {formData.uuDiemCamKetTuDuong}
              </div>

              <div className="paper-p" style={{ paddingLeft: '12px' }}>
                <strong>4. Kết quả công tác lãnh đạo, chỉ đạo, quản lý, điều hành và xây dựng đoàn kết nội bộ:</strong>
              </div>
              <div className="paper-indent" style={{ whiteSpace: 'pre-line', marginBottom: '8px' }}>
                {formData.uuDiemLanhDaoQuanLy}
              </div>

              <div className="paper-p" style={{ paddingLeft: '12px' }}>
                <strong>5. Trách nhiệm trong công việc, năng động, đổi mới sáng tạo, dám nghĩ dám làm, cải cách hành chính, chuyển đổi số:</strong>
              </div>
              <div className="paper-indent" style={{ whiteSpace: 'pre-line', marginBottom: '8px' }}>
                {formData.uuDiemTrachNhiemDoiMoi}
              </div>

              <div className="paper-p" style={{ paddingLeft: '12px' }}>
                <strong>6. Trách nhiệm nêu gương bản thân và gia đình; phòng chống tham nhũng, tiêu cực; sự tín nhiệm:</strong>
              </div>
              <div className="paper-indent" style={{ whiteSpace: 'pre-line', marginBottom: '8px' }}>
                {formData.uuDiemTrachNhiemNeuGuong}
              </div>

              <div className="paper-p" style={{ marginTop: '12px' }}><strong>II. Hạn chế, khuyết điểm và nguyên nhân</strong></div>
              <div className="paper-indent" style={{ whiteSpace: 'pre-line' }}>
                <strong>1. Hạn chế, khuyết điểm:</strong><br />
                {formData.hanCheKhuyetDiem}
              </div>
              <div className="paper-indent" style={{ whiteSpace: 'pre-line', marginTop: '6px' }}>
                <strong>2. Nguyên nhân:</strong><br />
                - <em>Khách quan:</em> {formData.nguyenNhanKhachQuan}<br />
                - <em>Chủ quan:</em> {formData.nguyenNhanChuQuan}
              </div>

              <div className="paper-p" style={{ marginTop: '12px' }}>
                <strong>III. Kết quả khắc phục các hạn chế, khuyết điểm kỳ kiểm điểm trước</strong>
              </div>
              <div className="paper-indent" style={{ whiteSpace: 'pre-line' }}>
                {formData.ketQuaKhacPhucNamTruoc || 'Không có.'}
              </div>

              <div className="paper-p" style={{ marginTop: '12px' }}>
                <strong>IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)</strong>
              </div>
              <div className="paper-indent" style={{ whiteSpace: 'pre-line' }}>
                {formData.giaiTrinhGoiYKiemDiem || 'Không có.'}
              </div>

              <div className="paper-p" style={{ marginTop: '12px' }}>
                <strong>V. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm</strong>
              </div>
              <div className="paper-indent" style={{ whiteSpace: 'pre-line' }}>
                {formData.phuongHuongKhacPhuc}
              </div>

              <div className="paper-p" style={{ marginTop: '12px' }}>
                <strong>VI. Tự nhận mức xếp loại chất lượng</strong>
              </div>
              <div className="paper-indent">
                1. Xếp loại của người đứng đầu/cán bộ lãnh đạo, quản lý: <strong>{formData.tuXepLoaiCanBo}</strong><br />
                2. Xếp loại chất lượng đảng viên: <strong>{formData.tuXepLoaiDangVien}</strong>
              </div>

              <div className="paper-sec-head" style={{ textAlign: 'center', marginTop: '20px' }}>B. Ý KIẾN ĐÁNH GIÁ, XẾP LOẠI</div>

              <div className="paper-p"><strong>1. Ý kiến của tập thể lãnh đạo cơ quan, đơn vị nơi công tác:</strong></div>
              <div className="paper-indent" style={{ fontStyle: 'italic' }}>
                ..........................................................................................................................................................................<br />
                - Đánh giá, xếp loại cán bộ: .................................................................................................
              </div>

              <div className="paper-p" style={{ marginTop: '8px' }}><strong>2. Ý kiến của tập thể chi bộ nơi sinh hoạt:</strong></div>
              <div className="paper-indent" style={{ fontStyle: 'italic' }}>
                ..........................................................................................................................................................................<br />
                - Chi bộ xếp loại chất lượng đảng viên: ......................................................................................
              </div>

              {/* Chữ ký 2 cột */}
              <div className="paper-signature-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '25px' }}>
                <div className="paper-sign-col">
                  <div className="sign-title">T/M CHI ỦY (CHI BỘ)</div>
                  <div className="sign-sub">(Ký, ghi rõ họ tên)</div>
                  <div className="sign-space"></div>
                  <div className="sign-name">...................................................</div>
                </div>

                <div className="paper-sign-col">
                  <div className="sign-title">NGƯỜI TỰ KIỂM ĐIỂM</div>
                  <div className="sign-sub">(Ký, ghi rõ họ tên)</div>
                  <div className="sign-space"></div>
                  <div className="sign-name">
                    {(formData.hoVaTen || '...................................................').toUpperCase()}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* MODAL AI THƯ KÝ ĐẢNG SOẠN KIỂM ĐIỂM */}
      {showAiModal && (
        <div className="review-ai-backdrop" onClick={() => setShowAiModal(false)}>
          <div className="review-ai-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} />
                Trợ Lý AI Soạn Bản Kiểm Điểm Lãnh Đạo Mẫu 02A
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAiModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
              Nhập tóm tắt chức vụ lãnh đạo (ví dụ Bí thư, Trưởng khoa), các kết quả nổi bật trong năm 2026, các dự án chuyển đổi số đã làm và những mặt cần khắc phục. 
              AI sẽ chuẩn hóa toàn bộ văn phong theo chuẩn Hướng dẫn 43-HD/BTCTW và Công văn 2772-CV/BTCTW.
            </p>

            <textarea 
              rows={6}
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Ví dụ: Tôi là Trưởng khoa kiêm Bí thư Chi bộ Khoa CNTT. Trong năm 2026, khoa tôi đã hoàn thành kiểm định chương trình đào tạo, mở thêm ngành mới, ứng dụng LMS toàn khoa, đoàn kết nội bộ tốt. Tuy nhiên việc đôn đốc giáo viên NCKH đôi lúc còn chậm..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            {aiError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{aiError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                onClick={() => setShowAiModal(false)}
                className="btn-review-act secondary"
                style={{ color: '#475569', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                onClick={handleAiGenerate}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="btn-review-act primary"
                style={{ background: '#b91c1c', color: '#ffffff' }}
              >
                {isAiLoading ? 'AI Đang Soạn Thảo...' : 'Soạn Thảo & Chuẩn Hóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

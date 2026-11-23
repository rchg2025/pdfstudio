import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
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
  type PartyReview02CStudentData, 
  defaultPartyReview02CStudentData, 
  exportPartyReview02CStudentDocx 
} from '../utils/party397ExportHelper';
import './PartyMemberSelfReview02A.css';

const STORAGE_KEY = 'rchg_party_review_02c_student_draft';

export default function PartyStudentReview02C() {
  const [formData, setFormData] = useState<PartyReview02CStudentData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu kiểm điểm HSSV:', e);
    }
    return defaultPartyReview02CStudentData;
  });

  const [savedToast, setSavedToast] = useState(false);
  const [loadingField, setLoadingField] = useState<keyof PartyReview02CStudentData | null>(null);
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

  const handleChange = (field: keyof PartyReview02CStudentData, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'diemTieuChiChung' || field === 'diemThucHienNhiemVu') {
        const chung = field === 'diemTieuChiChung' ? Number(value) : (prev.diemTieuChiChung || 0);
        const nv = field === 'diemThucHienNhiemVu' ? Number(value) : (prev.diemThucHienNhiemVu || 0);
        const total = (chung || 0) + (nv || 0);
        // Tự động gợi ý mức xếp loại nếu chưa chọn thủ công
        if (total >= 90) next.tuXepLoaiDangVien = 'Hoàn thành xuất sắc nhiệm vụ';
        else if (total >= 70) next.tuXepLoaiDangVien = 'Hoàn thành tốt nhiệm vụ';
        else if (total >= 50) next.tuXepLoaiDangVien = 'Hoàn thành nhiệm vụ';
        else if (total > 0) next.tuXepLoaiDangVien = 'Không hoàn thành nhiệm vụ';
      }
      return next;
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn đặt lại toàn bộ nội dung về mẫu chuẩn Mẫu 02C?')) {
      setFormData(defaultPartyReview02CStudentData);
    }
  };

  const handleDownloadDocx = () => {
    exportPartyReview02CStudentDocx(formData);
  };

  const handlePrint = () => {
    window.print();
  };

  // AI viết lại từng mục cho sinh viên
  const handleAiRewriteField = async (
    fieldKey: keyof PartyReview02CStudentData,
    fieldTitle: string,
    currentValue: string
  ) => {
    setLoadingField(fieldKey);
    try {
      const customKey = localStorage.getItem('rchg_gemini_api_key') || '';
      const promptInstruction = `
Bạn là chuyên gia cố vấn công tác Đảng và xây dựng tổ chức Đảng cho Trường Cao đẳng Bách khoa Nam Sài Gòn.
Hãy biên soạn hoặc nâng cấp nội dung mục "${fieldTitle}" cho Bản kiểm điểm cá nhân đảng viên là học sinh, sinh viên (Mẫu 02C-HD KĐ.ĐG 2026).
Đảm bảo thể thức trang trọng, khách quan, cầu thị, bám sát việc học tập, rèn luyện, hoạt động Đoàn - Hội và tu dưỡng đạo đức theo tiêu chí năm 2026.
Phân chia các ý rõ ràng có đánh số (1., 2., 3.), nêu rõ hành động, kết quả và giải pháp cụ thể.

Nội dung hiện tại hoặc ý chính cần viết lại:
"""
${currentValue || 'Chưa có nội dung, hãy viết mới mẫu mực cho đảng viên là sinh viên trường cao đẳng.'}
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

  // AI soạn thảo toàn bộ bản kiểm điểm sinh viên
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiError('');

    try {
      const customKey = localStorage.getItem('rchg_gemini_api_key') || '';
      const promptInstruction = `
Bạn là chuyên gia công tác tổ chức Đảng ủy Trường Cao đẳng Bách khoa Nam Sài Gòn.
Dựa trên thông tin tóm tắt sau đây của đảng viên là học sinh, sinh viên, hãy soạn thảo hoàn chỉnh, dài dặn, mẫu mực toàn bộ các mục của Bản kiểm điểm Mẫu 02C-HD KĐ.ĐG 2026.
Bắt buộc trả về DUY NHẤT một chuỗi JSON hợp lệ không có giải thích thêm:
{
  "uuDiemPhamChatChinhTri": "chuỗi dài dặn về phẩm chất chính trị, đạo đức lối sống, ý thức tổ chức kỷ luật, văn hóa học đường, học tập và làm theo Bác...",
  "uuDiemThucHienNhiemVu": "chuỗi dài dặn về kết quả học tập, rèn luyện, phong trào Đoàn - Hội, tham gia sinh hoạt chi bộ, mối liên hệ nơi cư trú...",
  "uuDiemCamKetTuDuong": "chuỗi về thực hiện cam kết tu dưỡng, tự soi, tự sửa...",
  "hanCheKhuyetDiem": "chuỗi nêu hạn chế, khuyết điểm trong học tập, sinh hoạt...",
  "nguyenNhanKhachQuan": "chuỗi nguyên nhân khách quan...",
  "nguyenNhanChuQuan": "chuỗi nguyên nhân chủ quan...",
  "ketQuaKhacPhucNamTruoc": "chuỗi kết quả khắc phục hạn chế kỳ trước...",
  "giaiTrinhGoiYKiemDiem": "Không có.",
  "trachNhiemCaNhan": "Không có.",
  "phuongHuongKhacPhuc": "chuỗi phương hướng, biện pháp rèn luyện, kết quả cần đạt và thời hạn hoàn thành cụ thể..."
}

THÔNG TIN SINH VIÊN CUNG CẤP:
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
      const rawParsed = JSON.parse(match[0]);

      // Chuẩn hóa tên khóa để đảm bảo không bị mất nội dung nếu AI trả về key có dấu cách
      const normalizedParsed: Record<string, any> = {};
      for (const [k, v] of Object.entries(rawParsed)) {
        const cleanKey = k.replace(/[\s\-_]/g, '');
        normalizedParsed[cleanKey] = v;
      }

      setFormData(prev => ({
        ...prev,
        uuDiemPhamChatChinhTri: normalizedParsed['uuDiemPhamChatChinhTri'] || rawParsed['uuDiemPhamChatChinhTri'] || prev.uuDiemPhamChatChinhTri,
        uuDiemThucHienNhiemVu: normalizedParsed['uuDiemThucHienNhiemVu'] || rawParsed['uuDiemThucHienNhiemVu'] || prev.uuDiemThucHienNhiemVu,
        uuDiemCamKetTuDuong: normalizedParsed['uuDiemCamKetTuDuong'] || rawParsed['uuDiemCamKetTuDuong'] || prev.uuDiemCamKetTuDuong,
        hanCheKhuyetDiem: normalizedParsed['hanCheKhuyetDiem'] || rawParsed['hanCheKhuyetDiem'] || prev.hanCheKhuyetDiem,
        nguyenNhanKhachQuan: normalizedParsed['nguyenNhanKhachQuan'] || rawParsed['nguyenNhanKhachQuan'] || prev.nguyenNhanKhachQuan,
        nguyenNhanChuQuan: normalizedParsed['nguyenNhanChuQuan'] || rawParsed['nguyenNhanChuQuan'] || prev.nguyenNhanChuQuan,
        ketQuaKhacPhucNamTruoc: normalizedParsed['ketQuaKhacPhucNamTruoc'] || rawParsed['ketQuaKhacPhucNamTruoc'] || prev.ketQuaKhacPhucNamTruoc,
        giaiTrinhGoiYKiemDiem: normalizedParsed['giaiTrinhGoiYKiemDiem'] || rawParsed['giaiTrinhGoiYKiemDiem'] || prev.giaiTrinhGoiYKiemDiem,
        trachNhiemCaNhan: normalizedParsed['trachNhiemCaNhan'] || rawParsed['trachNhiemCaNhan'] || prev.trachNhiemCaNhan,
        phuongHuongKhacPhuc: normalizedParsed['phuongHuongKhacPhuc'] || rawParsed['phuongHuongKhacPhuc'] || prev.phuongHuongKhacPhuc
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
            <Award size={14} /> Mẫu 02C-HD KĐ.ĐG 2026
          </div>
          <h1 className="party-page-heading">
            <GraduationCap size={26} />
            Bản Kiểm Điểm, Tự Đánh Giá Xếp Loại Đảng Viên Học Sinh, Sinh Viên (Mẫu 02C)
          </h1>
          <p className="party-page-desc">
            Dành cho Đảng viên là học sinh, sinh viên — Theo Hướng dẫn số 397-HD/ĐU ngày 20/11/2026 của Đảng ủy Trường CĐ Bách khoa Nam Sài Gòn. Tích hợp đánh giá kết quả học tập, rèn luyện và xuất file Word chuẩn thể thức.
          </p>
        </div>
        <div className="party-banner-actions">
          <button 
            type="button" 
            className="btn-review-act ai"
            onClick={() => setShowAiModal(true)}
            title="Sử dụng trí tuệ nhân tạo để soạn thảo nhanh bản kiểm điểm đảng viên sinh viên"
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
            title="In trực tiếp ra giấy khổ A4"
          >
            <Printer size={16} /> In Bản Kiểm Điểm
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
          <Check size={18} /> Đã cập nhật và tự động lưu nháp Mẫu 02C!
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

          {/* 1. THÔNG TIN SINH VIÊN */}
          <div className="form-card-section">
            <div className="card-section-header">
              <GraduationCap size={18} color="#b91c1c" />
              <h3>1. Thông Tin Đảng Viên Học Sinh, Sinh Viên</h3>
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
                  placeholder="Chi bộ Sinh viên..."
                />
              </div>

              <div className="field-group">
                <label>Họ và tên khai sinh (viết hoa)</label>
                <input 
                  type="text" 
                  value={formData.hoVaTen} 
                  onChange={e => handleChange('hoVaTen', e.target.value.toUpperCase())}
                  placeholder="Ví dụ: NGUYỄN VĂN AN"
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div className="field-group">
                <label>Ngày, tháng, năm sinh</label>
                <input 
                  type="text" 
                  value={formData.namSinh} 
                  onChange={e => handleChange('namSinh', e.target.value)}
                  placeholder="dd/mm/yyyy (ví dụ: 15/08/2005)"
                />
              </div>

              <div className="field-group">
                <label>Lớp học</label>
                <input 
                  type="text" 
                  value={formData.lop} 
                  onChange={e => handleChange('lop', e.target.value)}
                  placeholder="Ví dụ: CĐ-CNTT 24A"
                />
              </div>

              <div className="field-group">
                <label>Khoa chuyên môn</label>
                <input 
                  type="text" 
                  value={formData.khoa} 
                  onChange={e => handleChange('khoa', e.target.value)}
                  placeholder="Ví dụ: Khoa Công Nghệ Thông Tin"
                />
              </div>

              <div className="field-group span-2">
                <label>Đơn vị công tác / học tập</label>
                <input 
                  type="text" 
                  value={formData.donViCongTac} 
                  onChange={e => handleChange('donViCongTac', e.target.value)}
                  placeholder="Trường Cao đẳng Bách khoa Nam Sài Gòn"
                />
              </div>
            </div>
          </div>

          {/* 2. ƯU ĐIỂM, KẾT QUẢ ĐẠT ĐƯỢC */}
          <div className="form-card-section">
            <div className="card-section-header">
              <Check size={18} color="#b91c1c" />
              <h3>2. A.I - Ưu Điểm, Kết Quả Đạt Được Trong Năm</h3>
            </div>

            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>1. Phẩm chất chính trị, đạo đức, lối sống, ý thức tổ chức kỷ luật, văn hóa học đường</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('uuDiemPhamChatChinhTri', 'Phẩm chất chính trị, đạo đức, lối sống, văn hóa học đường', formData.uuDiemPhamChatChinhTri)}
                  disabled={loadingField === 'uuDiemPhamChatChinhTri'}
                >
                  {loadingField === 'uuDiemPhamChatChinhTri' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.uuDiemPhamChatChinhTri}
                onChange={e => handleChange('uuDiemPhamChatChinhTri', e.target.value)}
              />
            </div>

            <div className="textarea-group" style={{ marginTop: '0.85rem' }}>
              <div className="textarea-label-row">
                <label>2. Quyền và nghĩa vụ đảng viên; kết quả học tập, rèn luyện; phong trào Đoàn - Hội</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('uuDiemThucHienNhiemVu', 'Kết quả học tập, rèn luyện, phong trào Đoàn Hội', formData.uuDiemThucHienNhiemVu)}
                  disabled={loadingField === 'uuDiemThucHienNhiemVu'}
                >
                  {loadingField === 'uuDiemThucHienNhiemVu' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.uuDiemThucHienNhiemVu}
                onChange={e => handleChange('uuDiemThucHienNhiemVu', e.target.value)}
              />
            </div>

            <div className="textarea-group" style={{ marginTop: '0.85rem' }}>
              <div className="textarea-label-row">
                <label>3. Thực hiện cam kết tu dưỡng, rèn luyện; tự soi, tự sửa</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('uuDiemCamKetTuDuong', 'Thực hiện cam kết tu dưỡng, tự soi tự sửa', formData.uuDiemCamKetTuDuong)}
                  disabled={loadingField === 'uuDiemCamKetTuDuong'}
                >
                  {loadingField === 'uuDiemCamKetTuDuong' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={3}
                value={formData.uuDiemCamKetTuDuong}
                onChange={e => handleChange('uuDiemCamKetTuDuong', e.target.value)}
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
                <label>Hạn chế, khuyết điểm trong học tập và sinh hoạt</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('hanCheKhuyetDiem', 'Hạn chế khuyết điểm trong học tập, sinh hoạt', formData.hanCheKhuyetDiem)}
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
                <label>III. Kết quả khắc phục hạn chế kỳ kiểm điểm trước</label>
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
                <label>V. Làm rõ trách nhiệm cá nhân đối với hạn chế của tập thể (nếu có)</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('trachNhiemCaNhan', 'Trách nhiệm cá nhân đối với hạn chế tập thể', formData.trachNhiemCaNhan)}
                  disabled={loadingField === 'trachNhiemCaNhan'}
                >
                  {loadingField === 'trachNhiemCaNhan' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={2}
                value={formData.trachNhiemCaNhan}
                onChange={e => handleChange('trachNhiemCaNhan', e.target.value)}
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

          {/* 5. TỰ ĐÁNH GIÁ, CHẤM ĐIỂM */}
          <div className="form-card-section">
            <div className="card-section-header">
              <Award size={18} color="#b91c1c" />
              <h3>5. B. Tự Đánh Giá, Chấm Điểm (Phụ lục 5)</h3>
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
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Tổng điểm KPI tự chấm:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#b91c1c' }}>
                    {(Number(formData.diemTieuChiChung) || 0) + (Number(formData.diemThucHienNhiemVu) || 0)} / 100 điểm
                  </span>
                </div>
              </div>

              <div className="field-group span-2">
                <label>Tự đề xuất xếp loại mức chất lượng đảng viên</label>
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
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: XEM TRƯỚC VĂN BẢN A4 TRỰC QUAN */}
        <div className="party-preview-column">
          <div className="review-preview-toolbar">
            <div className="review-preview-title">
              <FileText size={18} color="#b91c1c" />
              <span>Xem Trước Mẫu 02C (Đảng Viên HSSV)</span>
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
                  <div style={{ fontWeight: 'bold' }}>CHI BỘ: {(formData.chiBo || formData.chiBoSinhHoat || '………..').toUpperCase()}</div>
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
                <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '11pt' }}>Mẫu 02C-HD KĐ.ĐG 2026</div>
                <div className="paper-title-main">BẢN KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CỦA CÁ NHÂN</div>
                <div className="paper-title-sub">Năm {formData.namKiemDiem || '2026'}</div>
                <div className="paper-title-sub">(Đảng viên là học sinh, sinh viên)</div>
                <div className="paper-note">(Kèm theo Hướng dẫn số 397-HD/ĐU ngày 20/11/2026 của Đảng ủy Trường Cao đẳng Bách khoa Nam Sài Gòn)</div>
              </div>

              <div className="paper-p">
                - Họ và tên: <strong style={{ textTransform: 'uppercase' }}>{formData.hoVaTen || '...........................................'}</strong> &nbsp;&nbsp;&nbsp;&nbsp; - Ngày sinh: <strong>{formData.namSinh || '................'}</strong><br />
                - Lớp: <strong>{formData.lop}</strong> ({formData.khoa}) &nbsp;&nbsp;&nbsp;&nbsp; - Chi bộ: <strong>{formData.chiBo || formData.chiBoSinhHoat}</strong><br />
                - Đơn vị công tác/học tập: <strong>{formData.donViCongTac}</strong>
              </div>

              <div className="paper-heading-1">A. NỘI DUNG KIỂM ĐIỂM</div>
              <div className="paper-heading-2">I. Ưu điểm, kết quả đạt được</div>
              <div className="paper-p"><strong>1. Về phẩm chất chính trị, đạo đức, lối sống, ý thức tổ chức kỷ luật:</strong></div>
              <div className="paper-text-block">{formData.uuDiemPhamChatChinhTri}</div>

              <div className="paper-p"><strong>2. Thực hiện quyền và nghĩa vụ đảng viên; kết quả học tập, rèn luyện; phong trào Đoàn - Hội:</strong></div>
              <div className="paper-text-block">{formData.uuDiemThucHienNhiemVu}</div>

              <div className="paper-p"><strong>3. Thực hiện cam kết tu dưỡng, rèn luyện; nội dung tự soi, tự sửa:</strong></div>
              <div className="paper-text-block">{formData.uuDiemCamKetTuDuong}</div>

              <div className="paper-heading-2">II. Hạn chế, khuyết điểm và nguyên nhân</div>
              <div className="paper-p"><strong>1. Hạn chế, khuyết điểm:</strong></div>
              <div className="paper-text-block">{formData.hanCheKhuyetDiem}</div>
              <div className="paper-p"><strong>2. Nguyên nhân của hạn chế, khuyết điểm:</strong></div>
              <div className="paper-text-block">
                - <em>Nguyên nhân khách quan:</em> {formData.nguyenNhanKhachQuan}<br />
                - <em>Nguyên nhân chủ quan:</em> {formData.nguyenNhanChuQuan}
              </div>

              <div className="paper-heading-2">III. Kết quả khắc phục hạn chế kỳ kiểm điểm trước</div>
              <div className="paper-text-block">{formData.ketQuaKhacPhucNamTruoc}</div>

              <div className="paper-heading-2">IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)</div>
              <div className="paper-text-block">{formData.giaiTrinhGoiYKiemDiem || 'Không có.'}</div>

              <div className="paper-heading-2">V. Làm rõ trách nhiệm của cá nhân đối với hạn chế của tập thể (nếu có)</div>
              <div className="paper-text-block">{formData.trachNhiemCaNhan || 'Không có.'}</div>

              <div className="paper-heading-2">VI. Phương hướng, biện pháp khắc phục</div>
              <div className="paper-text-block">{formData.phuongHuongKhacPhuc}</div>

              <div className="paper-heading-1">B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI</div>
              <div className="paper-heading-2">I. Đánh giá theo các nhóm tiêu chí (Phụ lục 5)</div>
              <div className="paper-p">
                - Nhóm tiêu chí chung: <strong>{formData.diemTieuChiChung}/30 điểm</strong><br />
                - Nhóm tiêu chí về kết quả thực hiện nhiệm vụ: <strong>{formData.diemThucHienNhiemVu}/70 điểm</strong><br />
                - <strong>Tổng điểm tự chấm: {formData.diemTieuChiChung + formData.diemThucHienNhiemVu}/100 điểm</strong>
              </div>

              <div className="paper-heading-2">II. Đề xuất xếp loại mức chất lượng:</div>
              <div className="paper-p">
                - Mức đề xuất: <strong>{formData.tuXepLoaiDangVien}</strong>
              </div>

              {/* Chữ ký người tự kiểm điểm */}
              <div className="paper-signature-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '20px' }}>
                <div></div>
                <div className="sig-col-center">
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>NGƯỜI TỰ KIỂM ĐIỂM</div>
                  <div style={{ fontStyle: 'italic', fontSize: '11pt' }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ height: '70px' }}></div>
                  <div style={{ fontWeight: 'bold' }}>{(formData.hoVaTen || '...........................................').toUpperCase()}</div>
                </div>
              </div>

              {/* PHẦN C: KẾT QUẢ ĐÁNH GIÁ XẾP LOẠI CỦA CẤP CÓ THẨM QUYỀN */}
              <div className="paper-heading-1" style={{ marginTop: '24px' }}>C. KẾT QUẢ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG ĐẢNG VIÊN</div>
              <div className="paper-p">
                - Nhận xét, đánh giá của chi ủy: ..........................................................................................................................<br />
                - Chi bộ đề xuất xếp loại mức chất lượng: ..........................................................................................................
              </div>

              <div className="paper-signature-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '16px' }}>
                <div></div>
                <div className="sig-col-center">
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>T/M CHI ỦY (CHI BỘ)</div>
                  <div style={{ fontStyle: 'italic', fontSize: '11pt' }}>(Xác lập thời điểm, ký, ghi rõ họ tên)</div>
                  <div style={{ height: '70px' }}></div>
                  <div style={{ fontWeight: 'bold' }}>...................................................</div>
                </div>
              </div>

              <div className="paper-p" style={{ marginTop: '16px' }}>
                - Ban Thường vụ Đảng ủy cơ sở quyết định mức xếp loại chất lượng: ...................................................................
              </div>

              <div className="paper-signature-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '16px' }}>
                <div></div>
                <div className="sig-col-center">
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>T/M BAN THƯỜNG VỤ ĐẢNG ỦY</div>
                  <div style={{ fontStyle: 'italic', fontSize: '11pt' }}>(Xác lập thời điểm, ký, ghi rõ họ tên và đóng dấu)</div>
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
                <span>Trợ Lý AI Soạn Thảo Kiểm Điểm HSSV (Mẫu 02C)</span>
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
                Nhập sơ lược về kết quả học tập (điểm GPA, rèn luyện), hoạt động phong trào Đoàn - Hội, chiến dịch tình nguyện và một số hạn chế cần khắc phục trong năm 2026. AI sẽ tự động phân tích và tạo toàn bộ bản kiểm điểm hoàn chỉnh.
              </p>

              <textarea 
                className="review-ai-textarea"
                rows={5}
                placeholder="Ví dụ: Sinh viên năm 2 Khoa CNTT, kết quả học tập Xuất sắc (GPA 3.6), tích cực tham gia Mùa hè xanh, hiến máu tình nguyện, hạn chế là đôi lúc chưa cân đối tốt giữa thời gian học và phong trào..."
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
                {isAiLoading ? 'AI đang soạn...' : 'Tạo Bản Kiểm Điểm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

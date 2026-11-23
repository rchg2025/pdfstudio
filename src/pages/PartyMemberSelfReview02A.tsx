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
  type PartySelfReview02AData, 
  type QuarterlyKpiRow,
  defaultPartySelfReview02AData, 
  exportPartySelfReview02ADocx 
} from '../utils/partySelfReview02AExport';
import './PartyMemberSelfReview02A.css';

const STORAGE_KEY = 'rchg_party_self_review_02a_draft_v2';

export default function PartyMemberSelfReview02A() {
  const [formData, setFormData] = useState<PartySelfReview02AData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu kiểm điểm 02A lưu nháp:', e);
    }
    return defaultPartySelfReview02AData;
  });

  const [savedToast, setSavedToast] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiError, setAiError] = useState('');

  // Trạng thái AI viết lại theo từng mục
  const [loadingField, setLoadingField] = useState<keyof PartySelfReview02AData | null>(null);

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
      if (field === 'diemTieuChiChung' || field === 'diemThucHienNhiemVu') {
        const chung = field === 'diemTieuChiChung' ? Number(value) : prev.diemTieuChiChung;
        const nv = field === 'diemThucHienNhiemVu' ? Number(value) : prev.diemThucHienNhiemVu;
        next.tongDiemTuCham = (chung || 0) + (nv || 0);
      }
      return next;
    });
  };

  // Helper tính toán tự động hàng Tổng điểm KPI và Cả năm
  const recalculateKpiRows = (rows: QuarterlyKpiRow[]): QuarterlyKpiRow[] => {
    const nextRows = rows.map(r => ({ ...r }));
    if (nextRows.length < 3) return nextRows;

    const calcAverage = (vals: (string | number)[]): string => {
      const nums = vals.map(v => parseFloat(String(v))).filter(v => !isNaN(v));
      if (nums.length === 0) return '';
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      return Math.round(avg * 100) / 100 === Math.round(avg) ? avg.toFixed(0) : avg.toFixed(2).replace(/\.?0+$/, '');
    };

    // Hàng 0: Điểm tiêu chí chung
    nextRows[0].year = calcAverage([nextRows[0].q1, nextRows[0].q2, nextRows[0].q3, nextRows[0].q4]);

    // Hàng 1: Điểm tiêu chí về kết quả thực hiện nhiệm vụ
    nextRows[1].year = calcAverage([nextRows[1].q1, nextRows[1].q2, nextRows[1].q3, nextRows[1].q4]);

    // Hàng 2: Tổng điểm KPI = Hàng 0 + Hàng 1
    const quarters = ['q1', 'q2', 'q3', 'q4'] as const;
    quarters.forEach(q => {
      const v0 = parseFloat(String(nextRows[0][q])) || 0;
      const v1 = parseFloat(String(nextRows[1][q])) || 0;
      const sum = v0 + v1;
      nextRows[2][q] = sum > 0 ? (Math.round(sum * 100) / 100).toString() : '';
    });
    // Cả năm của Tổng điểm KPI = Trung bình cộng 4 quý của Tổng điểm KPI (hoặc Tổng điểm Cả năm)
    nextRows[2].year = calcAverage([nextRows[2].q1, nextRows[2].q2, nextRows[2].q3, nextRows[2].q4]);

    // Hàng 3 nếu là Mức xếp loại quý thì suy luận mức xếp loại theo điểm
    if (nextRows[3]) {
      const getRank = (scoreStr: string) => {
        const s = parseFloat(scoreStr);
        if (isNaN(s) || s === 0) return '';
        if (s >= 90) return 'HTXSNV';
        if (s >= 70) return 'HTTNV';
        if (s >= 50) return 'HTNV';
        return 'KHTNV';
      };
      quarters.forEach(q => {
        if (!nextRows[3][q] || ['HTXSNV', 'HTTNV', 'HTNV', 'KHTNV'].includes(nextRows[3][q])) {
          nextRows[3][q] = getRank(nextRows[2][q]);
        }
      });
      if (!nextRows[3].year || ['HTXSNV', 'HTTNV', 'HTNV', 'KHTNV'].includes(nextRows[3].year)) {
        nextRows[3].year = getRank(nextRows[2].year);
      }
    }

    return nextRows;
  };

  const handleKpiRowChange = (index: number, key: keyof QuarterlyKpiRow, value: string) => {
    setFormData(prev => {
      let nextRows = [...prev.kpiRows];
      nextRows[index] = { ...nextRows[index], [key]: value };
      nextRows = recalculateKpiRows(nextRows);

      // Tự động lấy điểm cả năm từ bảng KPI nhập vào 2 mục tự chấm
      const yearChung = parseFloat(nextRows[0]?.year) || 0;
      const yearNv = parseFloat(nextRows[1]?.year) || 0;
      const total = yearChung + yearNv;

      let suggestedRank = prev.tuXepLoaiDangVien;
      if (total >= 90) suggestedRank = 'Hoàn thành xuất sắc nhiệm vụ';
      else if (total >= 70) suggestedRank = 'Hoàn thành tốt nhiệm vụ';
      else if (total >= 50) suggestedRank = 'Hoàn thành nhiệm vụ';
      else if (total > 0) suggestedRank = 'Không hoàn thành nhiệm vụ';

      return { 
        ...prev, 
        kpiRows: nextRows,
        diemTieuChiChung: yearChung > 0 ? Math.round(yearChung * 100) / 100 : prev.diemTieuChiChung,
        diemThucHienNhiemVu: yearNv > 0 ? Math.round(yearNv * 100) / 100 : prev.diemThucHienNhiemVu,
        tongDiemTuCham: total > 0 ? Math.round(total * 100) / 100 : prev.tongDiemTuCham,
        tuXepLoaiDangVien: suggestedRank
      };
    });
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản nháp và đặt lại nội dung mẫu chuẩn 02A-HD KĐ.ĐG 2026?')) {
      setFormData(defaultPartySelfReview02AData);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleManualSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleDownloadDocx = () => {
    exportPartySelfReview02ADocx(formData);
  };

  const handlePrint = () => {
    window.print();
  };

  // AI viết lại từng trường
  const handleAiRewriteField = async (
    fieldKey: keyof PartySelfReview02AData,
    fieldTitle: string,
    currentValue: string
  ) => {
    setLoadingField(fieldKey);
    try {
      const customKey = localStorage.getItem('rchg_gemini_api_key') || '';
      const promptInstruction = `
Bạn là chuyên gia cố vấn công tác Đảng và xây dựng tổ chức Đảng cho Trường Cao đẳng Bách khoa Nam Sài Gòn.
Hãy biên soạn hoặc nâng cấp nội dung mục "${fieldTitle}" cho bản kiểm điểm cá nhân giữ chức vụ lãnh đạo, quản lý (Mẫu 02A-HD KĐ.ĐG 2026).
Đảm bảo thể thức trang trọng, khách quan, cầu thị, thể hiện rõ vai trò người đứng đầu, đổi mới sáng tạo, dám nghĩ dám làm và tinh thần trách nhiệm gắn với tiêu chí năm 2026.
Phân chia các ý rõ ràng có đánh số (1., 2., 3.), nêu rõ hành động, kết quả và giải pháp cụ thể.

Nội dung hiện tại hoặc ý chính cần viết lại:
"""
${currentValue || 'Chưa có nội dung, hãy viết mới mẫu mực cho cán bộ lãnh đạo cấp khoa/phòng trường cao đẳng.'}
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

  // AI soạn thảo toàn bộ bản kiểm điểm 02A
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiError('');

    try {
      const customKey = localStorage.getItem('rchg_gemini_api_key') || '';
      const promptInstruction = `
Bạn là chuyên gia công tác tổ chức Đảng ủy Trường Cao đẳng Bách khoa Nam Sài Gòn.
Dựa trên thông tin tóm tắt sau đây của cá nhân (cán bộ lãnh đạo, quản lý), hãy soạn thảo hoàn chỉnh, dài dặn, mẫu mực toàn bộ các mục của Bản kiểm điểm Mẫu 02A-HD KĐ.ĐG 2026.
Bắt buộc trả về DUY NHẤT một chuỗi JSON hợp lệ không có giải thích thêm:
{
  "uuDiemPhamChatChinhTri": "chuỗi dài dặn về phẩm chất chính trị, đạo đức lối sống, đoàn kết nội bộ...",
  "uuDiemThucHienNhiemVu": "chuỗi dài dặn về kết quả hoàn thành 100% nhiệm vụ chuyên môn được giao năm 2026...",
  "uuDiemCamKetTuDuong": "chuỗi về thực hiện cam kết tu dưỡng 2026, mối liên hệ nơi cư trú theo Quy định 213-QĐ/TW...",
  "uuDiemCongTacLanhDao": "chuỗi phân tích kết quả lãnh đạo, chỉ đạo, quản lý đơn vị/chi bộ...",
  "uuDiemTrachNhiemDoiMoi": "chuỗi thể hiện tinh thần năng động, dám nghĩ dám làm, đổi mới sáng tạo, chuyển đổi số...",
  "uuDiemTrachNhiemNeuGuong": "chuỗi về trách nhiệm nêu gương của người đứng đầu, phòng chống tham nhũng, lãng phí, tiêu cực...",
  "hanCheKhuyetDiem": "chuỗi nêu rõ các hạn chế khuyết điểm của bản thân trong lãnh đạo, chỉ đạo...",
  "nguyenNhanKhachQuan": "chuỗi nguyên nhân khách quan...",
  "nguyenNhanChuQuan": "chuỗi nguyên nhân chủ quan...",
  "ketQuaKhacPhucNamTruoc": "chuỗi kết quả khắc phục hạn chế kỳ trước...",
  "giaiTrinhGoiYKiemDiem": "Không có.",
  "trachNhiemTapTheCaNhan": "Không có.",
  "phuongHuongKhacPhuc": "chuỗi phương hướng, biện pháp, sản phẩm kết quả cần đạt và thời hạn hoàn thành cụ thể..."
}

THÔNG TIN ĐẢNG VIÊN CUNG CẤP:
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

      // Chuẩn hóa tên khóa để đảm bảo không bị mất nội dung nếu AI trả về key có dấu cách hoặc sai chính tả nhẹ
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
        uuDiemCongTacLanhDao: normalizedParsed['uuDiemCongTacLanhDao'] || rawParsed['uuDiemCongTacLanhDao'] || normalizedParsed['uuDiemCongTacLanh Dao'] || prev.uuDiemCongTacLanhDao,
        uuDiemTrachNhiemDoiMoi: normalizedParsed['uuDiemTrachNhiemDoiMoi'] || rawParsed['uuDiemTrachNhiemDoiMoi'] || prev.uuDiemTrachNhiemDoiMoi,
        uuDiemTrachNhiemNeuGuong: normalizedParsed['uuDiemTrachNhiemNeuGuong'] || rawParsed['uuDiemTrachNhiemNeuGuong'] || prev.uuDiemTrachNhiemNeuGuong,
        hanCheKhuyetDiem: normalizedParsed['hanCheKhuyetDiem'] || rawParsed['hanCheKhuyetDiem'] || prev.hanCheKhuyetDiem,
        nguyenNhanKhachQuan: normalizedParsed['nguyenNhanKhachQuan'] || rawParsed['nguyenNhanKhachQuan'] || prev.nguyenNhanKhachQuan,
        nguyenNhanChuQuan: normalizedParsed['nguyenNhanChuQuan'] || rawParsed['nguyenNhanChuQuan'] || prev.nguyenNhanChuQuan,
        ketQuaKhacPhucNamTruoc: normalizedParsed['ketQuaKhacPhucNamTruoc'] || rawParsed['ketQuaKhacPhucNamTruoc'] || prev.ketQuaKhacPhucNamTruoc,
        giaiTrinhGoiYKiemDiem: normalizedParsed['giaiTrinhGoiYKiemDiem'] || rawParsed['giaiTrinhGoiYKiemDiem'] || prev.giaiTrinhGoiYKiemDiem,
        trachNhiemTapTheCaNhan: normalizedParsed['trachNhiemTapTheCaNhan'] || rawParsed['trachNhiemTapTheCaNhan'] || prev.trachNhiemTapTheCaNhan,
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
      {/* HEADER THANH CÔNG CỤ */}
      <div className="party-top-banner">
        <div className="party-banner-info">
          <div className="party-badge-tag">
            <Award size={14} /> Mẫu 02A-HD KĐ.ĐG 2026
          </div>
          <h1 className="party-page-heading">
            <Building2 size={26} />
            Bản Kiểm Điểm, Tự Đánh Giá Xếp Loại Cá Nhân Lãnh Đạo (Mẫu 02A)
          </h1>
          <p className="party-page-desc">
            Dành cho Đảng viên giữ chức vụ lãnh đạo, quản lý — Theo Hướng dẫn số 397-HD/ĐU của Đảng ủy Trường CĐ Bách khoa Nam Sài Gòn. Tự động tính điểm KPI 4 quý, tự chấm 100 điểm và xuất văn bản Word chuẩn thể thức.
          </p>
        </div>

        <div className="party-banner-actions">
          <button 
            type="button" 
            className="btn-review-act ai"
            onClick={() => setShowAiModal(true)}
            title="Sử dụng trí tuệ nhân tạo để tự động soạn toàn bộ bản kiểm điểm 02A"
          >
            <Sparkles size={16} /> Soạn Bằng AI
          </button>
          <button 
            type="button" 
            className="btn-review-act primary" 
            onClick={handleDownloadDocx}
            title="Tải về máy file Microsoft Word (.doc) chuẩn thể thức"
          >
            <Download size={16} /> Tải File Word
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
            className="btn-review-act save" 
            onClick={handleManualSave}
            title="Lưu bản nháp vào trình duyệt"
          >
            <Check size={16} /> Lưu Nháp
          </button>
          <button 
            type="button" 
            className="btn-review-act reset" 
            onClick={handleReset}
            title="Đặt lại mẫu chuẩn nguyên bản"
          >
            <RotateCcw size={16} /> Mẫu Chuẩn
          </button>
        </div>
      </div>

      {savedToast && (
        <div className="review-save-toast">
          <Check size={18} /> Đã lưu bản nháp Mẫu 02A thành công vào máy của bạn!
        </div>
      )}

      {/* 2-COLUMN SPLIT: FORM TRÁI - PREVIEW PHẢI */}
      <div className="party-workspace-grid">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className="party-form-column">
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

          {/* KHỐI 2: THÔNG TIN CÁN BỘ LÃNH ĐẠO */}
          <div className="form-card-section">
            <div className="card-section-header">
              <Award size={18} color="#b91c1c" />
              <h3>2. Thông Tin Cán Bộ Lãnh Đạo, Quản Lý</h3>
            </div>
            <div className="card-form-grid">
              <div className="field-group">
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
                  placeholder="01/01/1980"
                />
              </div>
              <div className="field-group span-2">
                <label>Chức vụ Đảng</label>
                <input 
                  type="text" 
                  value={formData.chucVuDang} 
                  onChange={e => handleChange('chucVuDang', e.target.value)}
                  placeholder="Bí thư Chi bộ, Phó Bí thư, Chi ủy viên..."
                />
              </div>
              <div className="field-group span-2">
                <label>Chức vụ chính quyền</label>
                <input 
                  type="text" 
                  value={formData.chucVuChinhQuyen} 
                  onChange={e => handleChange('chucVuChinhQuyen', e.target.value)}
                  placeholder="Trưởng Khoa, Phó Trưởng phòng, Giảng viên chính..."
                />
              </div>
              <div className="field-group span-2">
                <label>Chức vụ đoàn thể</label>
                <input 
                  type="text" 
                  value={formData.chucVuDoanThe} 
                  onChange={e => handleChange('chucVuDoanThe', e.target.value)}
                  placeholder="Chủ tịch Công đoàn bộ phận, Bí thư Đoàn..."
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
              <div className="field-group">
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

          {/* KHỐI 3: A. NỘI DUNG KIỂM ĐIỂM (6 MỤC ƯU ĐIỂM + CÁC MỤC HẠN CHẾ) */}
          <div className="form-card-section">
            <div className="card-section-header">
              <FileText size={18} color="#b91c1c" />
              <h3>A. Nội Dung Kiểm Điểm</h3>
            </div>

            <div className="sub-section-title">I. Ưu điểm, kết quả đạt được</div>

            {/* I.1 */}
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>1. Phẩm chất chính trị, đạo đức, lối sống, ý thức tổ chức kỷ luật...</label>
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
                rows={5}
                value={formData.uuDiemPhamChatChinhTri}
                onChange={e => handleChange('uuDiemPhamChatChinhTri', e.target.value)}
              />
            </div>

            {/* I.2 */}
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>2. Thực hiện nhiệm vụ, quyền hạn và chỉ tiêu chuyên môn được giao...</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('uuDiemThucHienNhiemVu', 'Kết quả thực hiện nhiệm vụ, chỉ tiêu', formData.uuDiemThucHienNhiemVu)}
                  disabled={loadingField === 'uuDiemThucHienNhiemVu'}
                >
                  {loadingField === 'uuDiemThucHienNhiemVu' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={5}
                value={formData.uuDiemThucHienNhiemVu}
                onChange={e => handleChange('uuDiemThucHienNhiemVu', e.target.value)}
              />
            </div>

            {/* I.3 */}
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu cá nhân</label>
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
                rows={3}
                value={formData.uuDiemCamKetTuDuong}
                onChange={e => handleChange('uuDiemCamKetTuDuong', e.target.value)}
              />
            </div>

            {/* I.4 */}
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>4. Kết quả công tác lãnh đạo, chỉ đạo, quản lý, điều hành; quy tụ đoàn kết</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('uuDiemCongTacLanhDao', 'Công tác lãnh đạo, chỉ đạo, quản lý', formData.uuDiemCongTacLanhDao)}
                  disabled={loadingField === 'uuDiemCongTacLanhDao'}
                >
                  {loadingField === 'uuDiemCongTacLanhDao' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={5}
                value={formData.uuDiemCongTacLanhDao}
                onChange={e => handleChange('uuDiemCongTacLanhDao', e.target.value)}
              />
            </div>

            {/* I.5 */}
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>5. Tinh thần năng động, đổi mới sáng tạo, dám nghĩ dám làm, chuyển đổi số</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('uuDiemTrachNhiemDoiMoi', 'Năng động, đổi mới sáng tạo, chuyển đổi số', formData.uuDiemTrachNhiemDoiMoi)}
                  disabled={loadingField === 'uuDiemTrachNhiemDoiMoi'}
                >
                  {loadingField === 'uuDiemTrachNhiemDoiMoi' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={5}
                value={formData.uuDiemTrachNhiemDoiMoi}
                onChange={e => handleChange('uuDiemTrachNhiemDoiMoi', e.target.value)}
              />
            </div>

            {/* I.6 */}
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>6. Trách nhiệm nêu gương bản thân và gia đình; phòng chống tham nhũng, lãng phí</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('uuDiemTrachNhiemNeuGuong', 'Trách nhiệm nêu gương, phòng chống tham nhũng', formData.uuDiemTrachNhiemNeuGuong)}
                  disabled={loadingField === 'uuDiemTrachNhiemNeuGuong'}
                >
                  {loadingField === 'uuDiemTrachNhiemNeuGuong' ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />}
                  Viết lại AI
                </button>
              </div>
              <textarea 
                rows={5}
                value={formData.uuDiemTrachNhiemNeuGuong}
                onChange={e => handleChange('uuDiemTrachNhiemNeuGuong', e.target.value)}
              />
            </div>

            <div className="sub-section-title" style={{ marginTop: '1.25rem' }}>II. Hạn chế, khuyết điểm và nguyên nhân</div>

            {/* II.1 */}
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>1. Hạn chế, khuyết điểm (gắn với nhiệm vụ lãnh đạo chưa hoàn thành)</label>
                <button
                  type="button"
                  className="btn-ai-field-opt"
                  onClick={() => handleAiRewriteField('hanCheKhuyetDiem', 'Hạn chế khuyết điểm lãnh đạo', formData.hanCheKhuyetDiem)}
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
                <div className="textarea-label-row">
                  <label>2.1. Nguyên nhân khách quan</label>
                  <button
                    type="button"
                    className="btn-ai-field-opt"
                    onClick={() => handleAiRewriteField('nguyenNhanKhachQuan', 'Nguyên nhân khách quan của hạn chế lãnh đạo', formData.nguyenNhanKhachQuan)}
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
                  <label>2.2. Nguyên nhân chủ quan (chủ yếu)</label>
                  <button
                    type="button"
                    className="btn-ai-field-opt"
                    onClick={() => handleAiRewriteField('nguyenNhanChuQuan', 'Nguyên nhân chủ quan của hạn chế lãnh đạo', formData.nguyenNhanChuQuan)}
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

            {/* III */}
            <div className="sub-section-title" style={{ marginTop: '1.25rem' }}>III. Kết quả khắc phục hạn chế các kỳ kiểm điểm trước</div>
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>Đã khắc phục, đang khắc phục, chưa khắc phục; khó khăn và trách nhiệm cá nhân</label>
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
            <div className="sub-section-title" style={{ marginTop: '1.25rem' }}>IV. Giải trình những vấn đề được gợi ý kiểm điểm nếu có</div>
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>Giải trình những vấn đề được gợi ý</label>
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
                placeholder="Giải trình từng vấn đề (nếu không có thì ghi: Không có)..."
              />
            </div>

            {/* V */}
            <div className="sub-section-title" style={{ marginTop: '1.25rem' }}>V. Trách nhiệm của tập thể, cá nhân</div>
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>Làm rõ trách nhiệm lãnh đạo, chỉ đạo, quản lý điều hành cơ quan/đơn vị</label>
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
                rows={3}
                value={formData.trachNhiemTapTheCaNhan}
                onChange={e => handleChange('trachNhiemTapTheCaNhan', e.target.value)}
                placeholder="Làm rõ trách nhiệm lãnh đạo, chỉ đạo, quản lý điều hành cơ quan/đơn vị (nếu không có thì ghi: Không có)..."
              />
            </div>

            {/* VI */}
            <div className="sub-section-title" style={{ marginTop: '1.25rem' }}>VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm</div>
            <div className="textarea-group">
              <div className="textarea-label-row">
                <label>Nội dung, biện pháp, sản phẩm kết quả cần đạt, thời hạn hoàn thành</label>
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
                          readOnly={idx === 2 || idx === 3}
                          style={{ 
                            width: '100%', 
                            textAlign: 'center', 
                            padding: '4px', 
                            border: idx === 2 ? '1.5px solid #f87171' : '1px solid #cbd5e1', 
                            background: idx === 2 ? '#fef2f2' : (idx === 3 ? '#f8fafc' : '#ffffff'),
                            fontWeight: idx >= 2 ? 'bold' : 'normal',
                            color: idx === 2 ? '#b91c1c' : 'inherit',
                            borderRadius: '4px' 
                          }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input 
                          type="text" 
                          value={row.q2} 
                          onChange={e => handleKpiRowChange(idx, 'q2', e.target.value)}
                          readOnly={idx === 2 || idx === 3}
                          style={{ 
                            width: '100%', 
                            textAlign: 'center', 
                            padding: '4px', 
                            border: idx === 2 ? '1.5px solid #f87171' : '1px solid #cbd5e1', 
                            background: idx === 2 ? '#fef2f2' : (idx === 3 ? '#f8fafc' : '#ffffff'),
                            fontWeight: idx >= 2 ? 'bold' : 'normal',
                            color: idx === 2 ? '#b91c1c' : 'inherit',
                            borderRadius: '4px' 
                          }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input 
                          type="text" 
                          value={row.q3} 
                          onChange={e => handleKpiRowChange(idx, 'q3', e.target.value)}
                          readOnly={idx === 2 || idx === 3}
                          style={{ 
                            width: '100%', 
                            textAlign: 'center', 
                            padding: '4px', 
                            border: idx === 2 ? '1.5px solid #f87171' : '1px solid #cbd5e1', 
                            background: idx === 2 ? '#fef2f2' : (idx === 3 ? '#f8fafc' : '#ffffff'),
                            fontWeight: idx >= 2 ? 'bold' : 'normal',
                            color: idx === 2 ? '#b91c1c' : 'inherit',
                            borderRadius: '4px' 
                          }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input 
                          type="text" 
                          value={row.q4} 
                          onChange={e => handleKpiRowChange(idx, 'q4', e.target.value)}
                          readOnly={idx === 2 || idx === 3}
                          style={{ 
                            width: '100%', 
                            textAlign: 'center', 
                            padding: '4px', 
                            border: idx === 2 ? '1.5px solid #f87171' : '1px solid #cbd5e1', 
                            background: idx === 2 ? '#fef2f2' : (idx === 3 ? '#f8fafc' : '#ffffff'),
                            fontWeight: idx >= 2 ? 'bold' : 'normal',
                            color: idx === 2 ? '#b91c1c' : 'inherit',
                            borderRadius: '4px' 
                          }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input 
                          type="text" 
                          value={row.year} 
                          onChange={e => handleKpiRowChange(idx, 'year', e.target.value)}
                          placeholder="Tự động"
                          title="Điểm cả năm tự động tính bằng trung bình cộng 4 quý (Quý I, II, III, IV)"
                          style={{ 
                            width: '100%', 
                            textAlign: 'center', 
                            fontWeight: 'bold', 
                            padding: '4px', 
                            border: idx === 2 ? '2px solid #b91c1c' : '1px solid #94a3b8', 
                            background: idx === 2 ? '#fef2f2' : '#ffffff',
                            color: idx === 2 ? '#b91c1c' : 'inherit',
                            borderRadius: '4px' 
                          }}
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

            <div className="sub-section-title" style={{ marginTop: '1.25rem' }}>II. Tự đề xuất xếp loại mức chất lượng</div>
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
        <div className="party-preview-column">
          <div className="review-preview-toolbar">
            <div className="review-preview-title">
              <FileText size={18} color="#b91c1c" />
              Xem Trước Bản Kiểm Điểm A4 (Chuẩn MẪU 02A-HD KĐ.ĐG 2026)
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
                  <div className="org-upper" style={{ fontWeight: 'bold' }}>{formData.dangBoCoSo || 'ĐẢNG BỘ TRƯỜNG CAO ĐẲNG BÁCH KHOA NAM SÀI GÒN'}</div>
                  <div style={{ fontWeight: 'bold' }}>CHI BỘ: {formData.chiBo || '………..'}</div>
                  <div style={{ width: '80px', height: '1px', background: '#000', margin: '3px auto 0 auto' }}></div>
                </div>
                <div className="paper-motto-right">
                  <div style={{ fontSize: '11pt', fontWeight: 'bold', textAlign: 'right', marginBottom: '2px' }}>MẪU 02A-HD KĐ.ĐG 2026</div>
                  <div className="motto-main">ĐẢNG CỘNG SẢN VIỆT NAM</div>
                  <div className="motto-date">
                    {formData.diaDanh || 'Chánh Hưng'}, ngày {formData.ngayKhai || '…'} tháng {formData.thangKhai || '…'} năm {formData.namKhai || '2026'}
                  </div>
                </div>
              </div>

              {/* Tiêu đề */}
              <div className="paper-title-block">
                <h2 className="paper-title-main">BẢN KIỂM ĐIỂM TỰ ĐÁNH GIÁ, XẾP LOẠI CÁ NHÂN</h2>
                <div className="paper-title-sub">Năm {formData.namKiemDiem || '2026'}</div>
                <div className="paper-note">
                  (Cá nhân giữ chức vụ lãnh đạo, quản lý)
                </div>
              </div>

              {/* Bảng thông tin cá nhân chuẩn theo file Word gốc */}
              <table style={{ width: '100%', border: 'none', margin: '8px 0 12px 0', fontSize: '12pt' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '60%', padding: '2px 0' }}>
                      Họ và tên: <strong style={{ textTransform: 'uppercase' }}>{formData.hoVaTen || '...........................................................'}</strong>
                    </td>
                    <td style={{ width: '40%', padding: '2px 0' }}>
                      Ngày sinh: {formData.namSinh || '......................................'}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ padding: '2px 0' }}>
                      Chức vụ Đảng: {formData.chucVuDang || '.................................................................................................'}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ padding: '2px 0' }}>
                      Chức vụ chính quyền: {formData.chucVuChinhQuyen || '..................................................................................................'}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ padding: '2px 0' }}>
                      Chức vụ đoàn thể: {formData.chucVuDoanThe || '..................................................................................................'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 0' }}>
                      Đơn vị công tác: {formData.donViCongTac || '..................................................'}
                    </td>
                    <td style={{ padding: '2px 0' }}>
                      Chi bộ: {formData.chiBoSinhHoat || formData.chiBo || '.............................................'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="paper-heading-1">A. NỘI DUNG KIỂM ĐIỂM</div>

              <div className="paper-heading-2">I. Ưu điểm, kết quả đạt được</div>
              <div className="paper-heading-3">1. Về phẩm chất chính trị, đạo đức, lối sống; tinh thần đoàn kết, thống nhất trong nội bộ; ý thức tổ chức kỷ luật, việc thực hiện những điều đảng viên không được làm; tác phong, lề lối làm việc:</div>
              <div className="paper-text-block">{formData.uuDiemPhamChatChinhTri}</div>

              <div className="paper-heading-3">2. Việc thực hiện nhiệm vụ, quyền hạn và kết quả thực hiện các chỉ tiêu, nhiệm vụ được giao trong năm, gắn với hiệu quả, tiến độ, chất lượng công việc:</div>
              <div className="paper-text-block">{formData.uuDiemThucHienNhiemVu}</div>

              <div className="paper-heading-3">3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu của cá nhân theo quy định:</div>
              <div className="paper-text-block">{formData.uuDiemCamKetTuDuong}</div>

              <div className="paper-heading-3">4. Kết quả công tác lãnh đạo, chỉ đạo, quản lý, điều hành; thực hiện chức trách, nhiệm vụ; mức độ hoàn thành nhiệm vụ của các cấp ủy, tổ chức đảng trực thuộc, địa phương, tổ chức, cơ quan, đơn vị thuộc quyền quản lý; khả năng quy tụ, xây dựng đoàn kết nội bộ:</div>
              <div className="paper-text-block">{formData.uuDiemCongTacLanhDao}</div>

              <div className="paper-heading-3">5. Trách nhiệm trong công việc; tinh thần năng động, đổi mới sáng tạo, dám nghĩ, dám nói, dám làm, nói đi đôi với làm, dám chịu trách nhiệm, dám đương đầu với khó khăn, thử thách, dám hành động, dám hy sinh lợi ích cá nhân vì lợi ích chung; trách nhiệm trong xây dựng đội ngũ cán bộ, kiểm soát quyền lực, phòng, chống tiêu cực trong phạm vi chức trách, nhiệm vụ được giao; trách nhiệm trong lãnh đạo, chỉ đạo hoàn thiện thể chế góp phần phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số, về mở rộng hợp tác, hội nhập quốc tế, về đổi mới tư duy quản trị, tạo điều kiện phát triển kinh tế tư nhân; xử lý những vấn đề khó, phức tạp, nhạy cảm trong thực hiện nhiệm vụ:</div>
              <div className="paper-text-block">{formData.uuDiemTrachNhiemDoiMoi}</div>

              <div className="paper-heading-3">6. Trách nhiệm nêu gương của bản thân và gia đình; việc đấu tranh phòng, chống tham nhũng, tiêu cực, lãng phí và ngăn chặn, đẩy lùi những biểu hiện suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hoá"; sự tín nhiệm của cán bộ, đảng viên; việc học tập, thực hành tư tưởng, đạo đức, phương pháp, phong cách Hồ Chí Minh; việc nghiên cứu, học tập và triển khai nghị quyết; việc xây dựng phong cách lãnh đạo đổi mới, gần dân, sát dân, trọng dân, thường xuyên nắm bắt tâm tư, nguyện vọng của Nhân dân:</div>
              <div className="paper-text-block">{formData.uuDiemTrachNhiemNeuGuong}</div>

              <div className="paper-heading-2">II. Hạn chế, khuyết điểm và nguyên nhân</div>
              <div className="paper-heading-3">1. Hạn chế, khuyết điểm (nêu đúng trọng tâm, gắn với tiêu chí chưa đáp ứng hoặc nhiệm vụ chưa hoàn thành):</div>
              <div className="paper-text-block">{formData.hanCheKhuyetDiem}</div>

              <div className="paper-heading-3">2. Nguyên nhân (phân định rõ nguyên nhân chủ quan, khách quan; không dùng nguyên nhân khách quan để thay thế trách nhiệm cá nhân):</div>
              <div className="paper-p"><em>- Nguyên nhân khách quan:</em> {formData.nguyenNhanKhachQuan}</div>
              <div className="paper-p"><em>- Nguyên nhân chủ quan:</em> {formData.nguyenNhanChuQuan}</div>

              <div className="paper-heading-2">III. Kết quả khắc phục những hạn chế, khuyết điểm đã được kết luận hoặc chỉ ra ở các kỳ kiểm điểm trước</div>
              <div className="paper-p" style={{ fontStyle: 'italic', fontSize: '10pt', color: '#555' }}>
                (Kiểm điểm rõ từng hạn chế, khuyết điểm (đã được khắc phục; đang khắc phục, mức độ khắc phục; chưa được khắc phục); những khó khăn, vướng mắc (nếu có); trách nhiệm của cá nhân).
              </div>
              <div className="paper-text-block">{formData.ketQuaKhacPhucNamTruoc}</div>

              <div className="paper-heading-2">IV. Giải trình những vấn đề được gợi ý kiểm điểm nếu có</div>
              <div className="paper-p" style={{ fontStyle: 'italic', fontSize: '10pt', color: '#555' }}>
                (Giải trình từng vấn đề được gợi ý kiểm điểm, nêu nguyên nhân, xác định trách nhiệm của cá nhân đối với từng vấn đề được gợi ý kiểm điểm).
              </div>
              <div className="paper-text-block">{formData.giaiTrinhGoiYKiemDiem}</div>

              <div className="paper-heading-2">V. Trách nhiệm của tập thể, cá nhân</div>
              <div className="paper-p" style={{ fontStyle: 'italic', fontSize: '10pt', color: '#555' }}>
                (Làm rõ trách nhiệm lãnh đạo, chỉ đạo, quản lý, điều hành; trách nhiệm đối với lĩnh vực, cơ quan, đơn vị hoặc cá nhân thuộc quyền quản lý. Kiểm điểm các vấn đề bức xúc, phức tạp, đơn thư, mất đoàn kết, vi phạm, trì trệ hoặc không hoàn thành nhiệm vụ nếu có).
              </div>
              <div className="paper-text-block">{formData.trachNhiemTapTheCaNhan}</div>

              <div className="paper-heading-2">VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm</div>
              <div className="paper-p" style={{ fontStyle: 'italic', fontSize: '10pt', color: '#555' }}>
                (Mỗi hạn chế phải gắn với một biện pháp, sản phẩm hoặc kết quả cần đạt, thời hạn hoàn thành và trách nhiệm thực hiện; bảo đảm có thể theo dõi, kiểm tra trong kỳ tiếp theo).
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

              <div className="paper-heading-2" style={{ marginTop: '10px' }}>II. Tự đề xuất xếp loại mức chất lượng</div>
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
                Gửi kèm Phụ lục về kết quả thực hiện nhiệm vụ trong đó thể hiện sản phẩm, tiến độ, chất lượng cụ thể (theo Mẫu 05).
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
              <div className="paper-p">- Mức xếp loại chất lượng: ……………………………</div>
              <div className="paper-p">- Dự kiến phân nhóm cán bộ: ……………………………</div>

              <div className="paper-signature-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '10px' }}>
                <div></div>
                <div className="sig-col-center">
                  <div style={{ fontWeight: 'bold' }}>THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ</div>
                  <div style={{ fontStyle: 'italic', fontSize: '9.5pt', marginBottom: '45px' }}>(Xác lập thời điểm, ký, ghi rõ họ tên và đóng dấu)</div>
                  <div>...................................................</div>
                </div>
              </div>

              <div className="paper-heading-2" style={{ marginTop: '15px' }}>II. Đánh giá, xếp loại chất lượng đảng viên</div>
              <div className="paper-p" style={{ fontStyle: 'italic', fontSize: '10pt', color: '#555' }}>
                (Phần này chỉ thực hiện đối với cá nhân là đảng viên; cá nhân không là đảng viên không phải kê khai và không xem là thiếu hồ sơ).
              </div>
              <div className="paper-p">- Nhận xét, đánh giá của chi ủy: ………………………………………………</div>
              <div className="paper-p">- Chi bộ đề xuất mức xếp loại chất lượng: ……………………………………</div>

              <div className="paper-signature-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '10px' }}>
                <div></div>
                <div className="sig-col-center">
                  <div style={{ fontWeight: 'bold' }}>T/M CHI ỦY (CHI BỘ)</div>
                  <div style={{ fontStyle: 'italic', fontSize: '9.5pt', marginBottom: '45px' }}>(Xác lập thời điểm, ký, ghi rõ họ tên)</div>
                  <div>...................................................</div>
                </div>
              </div>

              <div className="paper-p" style={{ marginTop: '15px' }}>
                - Đảng ủy trực thuộc cơ sở/Ban Thường vụ đảng ủy cơ sở hoặc đảng ủy cơ sở nơi không có ban thường vụ quyết định mức xếp loại chất lượng: ………………………………………………………………………………………………………..
              </div>

              <div className="paper-signature-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '10px' }}>
                <div></div>
                <div className="sig-col-center">
                  <div style={{ fontWeight: 'bold' }}>T/M BAN THƯỜNG VỤ (ĐẢNG ỦY)</div>
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
                Trợ Lý AI Soạn Bản Kiểm Điểm Lãnh Đạo (Mẫu 02A-2026)
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
              Nhập tóm tắt công tác lãnh đạo, quản lý đơn vị (Bí thư, Trưởng khoa, Trưởng phòng...), các chỉ tiêu hoàn thành và phương hướng năm 2026. AI sẽ tự động chuẩn hóa văn phong chuẩn thể thức Đảng.
            </p>

            <textarea 
              rows={5}
              placeholder="Ví dụ: Tôi là Trưởng khoa kiêm Bí thư Chi bộ Khoa Công nghệ thông tin. Trong năm 2026 đã lãnh đạo hoàn thành 100% chỉ tiêu đào tạo, mở thêm ngành AI, kiểm định chất lượng đạt chuẩn, nội bộ đoàn kết..."
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

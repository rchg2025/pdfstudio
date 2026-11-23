import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Printer, 
  Info, 
  Shield, 
  Building2, 
  UserCheck, 
  Coins, 
  Users, 
  AlertCircle
} from 'lucide-react';
import { 
  type PartyMemberProfileData, 
  defaultPartyProfileData, 
  exportPartyMemberProfileDocx 
} from '../utils/partyDocumentExport';
import './PartyMemberProfileUpdate.css';

const STORAGE_KEY = 'rchg_party_member_profile_draft_v1';

export default function PartyMemberProfileUpdate() {
  const [formData, setFormData] = useState<PartyMemberProfileData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu lưu nháp:', e);
    }
    return defaultPartyProfileData;
  });

  const [savedToast, setSavedToast] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiError, setAiError] = useState('');

  // Tự động lưu nháp vào LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('Lỗi ghi dữ liệu lưu nháp:', e);
    }
  }, [formData]);

  const handleChange = (field: keyof PartyMemberProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Điền K cho 1 trường cụ thể
  const setFieldToK = (field: keyof PartyMemberProfileData) => {
    handleChange(field, 'K');
  };

  // Nút bấm "Điền K cho toàn bộ các mục thay đổi chưa có thông tin"
  const handleFillAllK = () => {
    setFormData(prev => {
      const updated = { ...prev };
      const changeKeys: (keyof PartyMemberProfileData)[] = [
        'noiOHienNay', 'queQuanMoi',
        'ngheNghiepMoi', 'donViCongTacMoi',
        'chucVuDangMoi', 'chucVuChinhQuyenMoi', 'chucVuDoanTheMoi',
        'giaoDucPhoThongMoi', 'chuyenMonNghiepVuMoi', 'hocHamHocViMoi', 'lyLuanChinhTriMoi', 'ngoaiNguTinHocMoi',
        'khenThuongMoi', 'kyLuatMoi',
        'tongThuNhapNam', 'binhQuanThuNhap', 'nhaOMoi', 'datOMoi', 'taiSanMoi',
        'quanHeChaMe', 'quanHeVoChong', 'quanHeConCai'
      ];
      changeKeys.forEach(key => {
        if (!updated[key] || !updated[key].trim()) {
          updated[key] = 'K';
        }
      });
      return updated;
    });

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  // Reset về mặc định
  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại biểu mẫu về mặc định? Các nội dung vừa nhập sẽ bị xóa.')) {
      setFormData(defaultPartyProfileData);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Tải file Word (.doc)
  const handleDownloadDocx = () => {
    exportPartyMemberProfileDocx(formData);
  };

  // In trực tiếp
  const handlePrint = () => {
    window.print();
  };

  // AI Hỗ trợ chuẩn hóa câu chữ / dán văn bản tự động phân bổ
  const handleAiAutoFill = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiError('');

    try {
      const customKey = localStorage.getItem('rchg_gemini_api_key') || '';
      const promptInstruction = `
Bạn là chuyên gia thư ký văn phòng Đảng ủy. Nhiệm vụ của bạn là bóc tách thông tin từ văn bản của đảng viên và điền vào mẫu "Phiếu bổ sung hồ sơ đảng viên (Mẫu 3-HSĐV)".
Quy tắc:
1. Nếu mục nào KHÔNG THAY ĐỔI hoặc không được đề cập, bắt buộc ghi giá trị là chữ "K".
2. Văn phong chuẩn mực, đúng thể thức của Ban Tổ chức Trung ương Đảng.
3. Trả về DUY NHẤT một chuỗi JSON hợp lệ với cấu trúc sau, không kèm bất kỳ giải thích nào:
{
  "hoVaTen": "Họ và tên in hoa",
  "namSinh": "ngày tháng năm sinh",
  "gioiTinh": "Nam hoặc Nữ",
  "soLyLich": "số lý lịch nếu có",
  "soTheDangVien": "số thẻ đảng viên nếu có",
  "noiOHienNay": "K hoặc địa chỉ mới",
  "queQuanMoi": "K hoặc quê quán mới",
  "ngheNghiepMoi": "K hoặc nghề mới",
  "donViCongTacMoi": "K hoặc đơn vị mới",
  "chucVuDangMoi": "K hoặc chức vụ Đảng mới",
  "chucVuChinhQuyenMoi": "K hoặc chức vụ chính quyền mới",
  "chucVuDoanTheMoi": "K hoặc chức vụ đoàn thể mới",
  "giaoDucPhoThongMoi": "K hoặc 12/12",
  "chuyenMonNghiepVuMoi": "K hoặc trình độ chuyên môn mới",
  "hocHamHocViMoi": "K hoặc học vị mới",
  "lyLuanChinhTriMoi": "K hoặc trình độ LLCT mới",
  "ngoaiNguTinHocMoi": "K hoặc ngoại ngữ tin học mới",
  "khenThuongMoi": "K hoặc hình thức khen thưởng",
  "kyLuatMoi": "K hoặc hình thức kỷ luật",
  "tongThuNhapNam": "K hoặc tổng thu nhập",
  "binhQuanThuNhap": "K hoặc bình quân/tháng",
  "nhaOMoi": "K hoặc nhà ở mới",
  "datOMoi": "K hoặc đất ở mới",
  "taiSanMoi": "K hoặc tài sản > 50 triệu",
  "quanHeChaMe": "K hoặc thay đổi cha mẹ",
  "quanHeVoChong": "K hoặc thay đổi vợ/chồng",
  "quanHeConCai": "K hoặc thay đổi con cái"
}

VĂN BẢN ĐẢNG VIÊN CUNG CẤP:
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

      if (!response.ok) {
        throw new Error('Không thể kết nối đến AI');
      }

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
      console.error('Lỗi AI hỗ trợ:', err);
      setAiError(err.message || 'Có lỗi xảy ra khi gọi AI. Vui lòng kiểm tra API Key hoặc thử lại.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="party-profile-container">
      {/* HEADER BANNER */}
      <div className="party-header-banner">
        <div className="party-banner-text">
          <h1>
            <FileText size={28} />
            Phiếu Bổ Sung Hồ Sơ Đảng Viên (Mẫu 3-HSĐV)
          </h1>
          <p>
            Soạn thảo, chuẩn hóa quy chuẩn "K" theo Hướng dẫn Ban Tổ chức Trung ương Đảng, 
            xem trước trực quan thời gian thực và xuất file Word (.doc) chuẩn 100% không bị nhảy dòng, lệch lề.
          </p>
        </div>
        <div className="party-banner-actions">
          <button 
            type="button" 
            className="btn-party-action secondary"
            onClick={() => setShowAiModal(true)}
          >
            <Sparkles size={18} />
            AI Phân Tích & Điền Nhanh
          </button>
          <button 
            type="button" 
            className="btn-party-action primary"
            onClick={handleDownloadDocx}
          >
            <Download size={18} />
            Tải File Word (.doc)
          </button>
          <button 
            type="button" 
            className="btn-party-action secondary"
            onClick={handlePrint}
          >
            <Printer size={18} />
            In Bản Khai
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

      {/* 2-COLUMN LAYOUT: FORM TRÁI - PREVIEW PHẢI */}
      <div className="party-grid-layout">
        
        {/* CỘT TRÁI: NHẬP LIỆU */}
        <div className="party-form-card">
          <div className="quick-toolbar">
            <button 
              type="button" 
              className="btn-quick-k"
              onClick={handleFillAllK}
              title="Tất cả các mục thay đổi đang trống sẽ tự động điền chữ K"
            >
              <Check size={16} />
              Tự động điền "K" cho toàn bộ mục không đổi
            </button>
            <button 
              type="button" 
              className="btn-quick-k"
              onClick={handleReset}
              style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}
            >
              <RotateCcw size={15} />
              Đặt lại mẫu
            </button>
          </div>

          {/* 1. KHỐI TỔ CHỨC ĐẢNG & NĂM */}
          <div className="form-group-section">
            <div className="section-title-badge">
              <Building2 size={18} />
              1. Thông Tin Cấp Ủy & Hồ Sơ
            </div>



            <div className="party-form-row">
              <div className="party-field">
                <label>Đảng bộ cơ sở</label>
                <input 
                  type="text" 
                  value={formData.dangBoCoSo} 
                  onChange={e => handleChange('dangBoCoSo', e.target.value)}
                  placeholder="Ví dụ: Đảng bộ Trường Cao đẳng Hậu Giang"
                />
              </div>
              <div className="party-field">
                <label>Chi bộ trực thuộc</label>
                <input 
                  type="text" 
                  value={formData.chiBo} 
                  onChange={e => handleChange('chiBo', e.target.value)}
                  placeholder="Ví dụ: Chi bộ Khoa Công nghệ Thông tin"
                />
              </div>
            </div>

            <div className="party-form-row">
              <div className="party-field">
                <label>Năm bổ sung hồ sơ</label>
                <input 
                  type="text" 
                  value={formData.namBoSung} 
                  onChange={e => handleChange('namBoSung', e.target.value)}
                />
              </div>
              <div className="party-field">
                <label>Số LL (Số Lý Lịch)</label>
                <input 
                  type="text" 
                  value={formData.soLyLich} 
                  onChange={e => handleChange('soLyLich', e.target.value)}
                  placeholder="Ví dụ: 0312/LL-ĐV"
                />
              </div>
            </div>

            <div className="party-form-row">
              <div className="party-field">
                <label>Số TĐV (Số Thẻ Đảng Viên)</label>
                <input 
                  type="text" 
                  value={formData.soTheDangVien} 
                  onChange={e => handleChange('soTheDangVien', e.target.value)}
                  placeholder="Ví dụ: 31.012345"
                />
              </div>
            </div>
          </div>

          {/* 2. THÔNG TIN ĐẢNG VIÊN */}
          <div className="form-group-section">
            <div className="section-title-badge">
              <UserCheck size={18} />
              2. Thông Tin Đảng Viên
            </div>

            <div className="party-field">
              <label>Họ và tên khai sinh (In hoa)</label>
              <input 
                type="text" 
                value={formData.hoVaTen} 
                onChange={e => handleChange('hoVaTen', e.target.value.toUpperCase())}
                placeholder="Ví dụ: NGUYỄN VĂN AN"
                style={{ fontWeight: 700 }}
              />
            </div>

            <div className="party-form-row">
              <div className="party-field">
                <label>Ngày, tháng, năm sinh</label>
                <input 
                  type="text" 
                  value={formData.namSinh} 
                  onChange={e => handleChange('namSinh', e.target.value)}
                  placeholder="dd/mm/yyyy (Ví dụ: 19/05/1990)"
                />
              </div>
              <div className="party-field">
                <label>Giới tính</label>
                <select 
                  value={formData.gioiTinh} 
                  onChange={e => handleChange('gioiTinh', e.target.value)}
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. MỤC I: THAY ĐỔI VỀ CÁ NHÂN */}
          <div className="form-group-section">
            <div className="section-title-badge">
              <Info size={18} />
              I. Thay Đổi Về Cá Nhân
            </div>

            <div className="party-field">
              <label>
                <span>1. Nơi thường trú hoặc tạm trú mới</span>
                <button type="button" className="label-quick-k" onClick={() => setFieldToK('noiOHienNay')}>Điền K</button>
              </label>
              <input 
                type="text" 
                value={formData.noiOHienNay} 
                onChange={e => handleChange('noiOHienNay', e.target.value)}
                placeholder="Nhập địa chỉ mới hoặc ghi K nếu không đổi"
              />
            </div>

            <div className="party-field">
              <label>
                <span>Quê quán (nếu thay đổi địa giới hành chính)</span>
                <button type="button" className="label-quick-k" onClick={() => setFieldToK('queQuanMoi')}>Điền K</button>
              </label>
              <input 
                type="text" 
                value={formData.queQuanMoi} 
                onChange={e => handleChange('queQuanMoi', e.target.value)}
                placeholder="Ghi rõ hoặc K"
              />
            </div>

            <div className="party-form-row">
              <div className="party-field">
                <label>
                  <span>2. Nghề nghiệp mới</span>
                  <button type="button" className="label-quick-k" onClick={() => setFieldToK('ngheNghiepMoi')}>Điền K</button>
                </label>
                <input 
                  type="text" 
                  value={formData.ngheNghiepMoi} 
                  onChange={e => handleChange('ngheNghiepMoi', e.target.value)}
                />
              </div>
              <div className="party-field">
                <label>
                  <span>Đơn vị công tác mới</span>
                  <button type="button" className="label-quick-k" onClick={() => setFieldToK('donViCongTacMoi')}>Điền K</button>
                </label>
                <input 
                  type="text" 
                  value={formData.donViCongTacMoi} 
                  onChange={e => handleChange('donViCongTacMoi', e.target.value)}
                />
              </div>
            </div>

            <div className="party-field">
              <label>
                <span>3. Chức vụ mới về Đảng (bầu, bổ nhiệm)</span>
                <button type="button" className="label-quick-k" onClick={() => setFieldToK('chucVuDangMoi')}>Điền K</button>
              </label>
              <input 
                type="text" 
                value={formData.chucVuDangMoi} 
                onChange={e => handleChange('chucVuDangMoi', e.target.value)}
              />
            </div>

            <div className="party-form-row">
              <div className="party-field">
                <label>
                  <span>Chức vụ chính quyền / chuyên môn mới</span>
                  <button type="button" className="label-quick-k" onClick={() => setFieldToK('chucVuChinhQuyenMoi')}>Điền K</button>
                </label>
                <input 
                  type="text" 
                  value={formData.chucVuChinhQuyenMoi} 
                  onChange={e => handleChange('chucVuChinhQuyenMoi', e.target.value)}
                />
              </div>
              <div className="party-field">
                <label>
                  <span>Chức vụ đoàn thể mới</span>
                  <button type="button" className="label-quick-k" onClick={() => setFieldToK('chucVuDoanTheMoi')}>Điền K</button>
                </label>
                <input 
                  type="text" 
                  value={formData.chucVuDoanTheMoi} 
                  onChange={e => handleChange('chucVuDoanTheMoi', e.target.value)}
                />
              </div>
            </div>

            <div className="party-form-row">
              <div className="party-field">
                <label>
                  <span>4. Giáo dục phổ thông mới</span>
                  <button type="button" className="label-quick-k" onClick={() => setFieldToK('giaoDucPhoThongMoi')}>Điền K</button>
                </label>
                <input 
                  type="text" 
                  value={formData.giaoDucPhoThongMoi} 
                  onChange={e => handleChange('giaoDucPhoThongMoi', e.target.value)}
                />
              </div>
              <div className="party-field">
                <label>
                  <span>Chuyên môn nghiệp vụ mới</span>
                  <button type="button" className="label-quick-k" onClick={() => setFieldToK('chuyenMonNghiepVuMoi')}>Điền K</button>
                </label>
                <input 
                  type="text" 
                  value={formData.chuyenMonNghiepVuMoi} 
                  onChange={e => handleChange('chuyenMonNghiepVuMoi', e.target.value)}
                />
              </div>
            </div>

            <div className="party-form-row">
              <div className="party-field">
                <label>
                  <span>Học hàm, học vị mới</span>
                  <button type="button" className="label-quick-k" onClick={() => setFieldToK('hocHamHocViMoi')}>Điền K</button>
                </label>
                <input 
                  type="text" 
                  value={formData.hocHamHocViMoi} 
                  onChange={e => handleChange('hocHamHocViMoi', e.target.value)}
                />
              </div>
              <div className="party-field">
                <label>
                  <span>Lý luận chính trị mới</span>
                  <button type="button" className="label-quick-k" onClick={() => setFieldToK('lyLuanChinhTriMoi')}>Điền K</button>
                </label>
                <input 
                  type="text" 
                  value={formData.lyLuanChinhTriMoi} 
                  onChange={e => handleChange('lyLuanChinhTriMoi', e.target.value)}
                />
              </div>
            </div>

            <div className="party-field">
              <label>
                <span>Ngoại ngữ, tin học mới</span>
                <button type="button" className="label-quick-k" onClick={() => setFieldToK('ngoaiNguTinHocMoi')}>Điền K</button>
              </label>
              <input 
                type="text" 
                value={formData.ngoaiNguTinHocMoi} 
                onChange={e => handleChange('ngoaiNguTinHocMoi', e.target.value)}
              />
            </div>

            <div className="party-field">
              <label>
                <span>5. Khen thưởng trong năm</span>
                <button type="button" className="label-quick-k" onClick={() => setFieldToK('khenThuongMoi')}>Điền K</button>
              </label>
              <textarea 
                rows={2}
                value={formData.khenThuongMoi} 
                onChange={e => handleChange('khenThuongMoi', e.target.value)}
                placeholder="Ví dụ: Bằng khen của Chủ tịch UBND tỉnh, Chiến sĩ thi đua cơ sở..."
              />
            </div>

            <div className="party-field">
              <label>
                <span>6. Kỷ luật trong năm</span>
                <button type="button" className="label-quick-k" onClick={() => setFieldToK('kyLuatMoi')}>Điền K</button>
              </label>
              <input 
                type="text" 
                value={formData.kyLuatMoi} 
                onChange={e => handleChange('kyLuatMoi', e.target.value)}
                placeholder="Ghi rõ hình thức hoặc K"
              />
            </div>
          </div>

          {/* 4. MỤC II: HOÀN CẢNH KINH TẾ */}
          <div className="form-group-section">
            <div className="section-title-badge">
              <Coins size={18} />
              II. Thay Đổi Hoàn Cảnh Kinh Tế
            </div>

            <div className="party-form-row">
              <div className="party-field">
                <label>
                  <span>1. Tổng mức thu nhập gia đình</span>
                  <button type="button" className="label-quick-k" onClick={() => setFieldToK('tongThuNhapNam')}>Điền K</button>
                </label>
                <input 
                  type="text" 
                  value={formData.tongThuNhapNam} 
                  onChange={e => handleChange('tongThuNhapNam', e.target.value)}
                  placeholder="Ví dụ: 250.000.000 đồng/năm"
                />
              </div>
              <div className="party-field">
                <label>
                  <span>Bình quân thu nhập/người/tháng</span>
                  <button type="button" className="label-quick-k" onClick={() => setFieldToK('binhQuanThuNhap')}>Điền K</button>
                </label>
                <input 
                  type="text" 
                  value={formData.binhQuanThuNhap} 
                  onChange={e => handleChange('binhQuanThuNhap', e.target.value)}
                  placeholder="Ví dụ: 6.500.000 đồng/tháng"
                />
              </div>
            </div>

            <div className="party-form-row">
              <div className="party-field">
                <label>
                  <span>2. Nhà ở mới (tạo lập, sang nhượng)</span>
                  <button type="button" className="label-quick-k" onClick={() => setFieldToK('nhaOMoi')}>Điền K</button>
                </label>
                <input 
                  type="text" 
                  value={formData.nhaOMoi} 
                  onChange={e => handleChange('nhaOMoi', e.target.value)}
                  placeholder="Ví dụ: K hoặc Nhà cấp 3, 100m2..."
                />
              </div>
              <div className="party-field">
                <label>
                  <span>Đất ở mới tạo lập</span>
                  <button type="button" className="label-quick-k" onClick={() => setFieldToK('datOMoi')}>Điền K</button>
                </label>
                <input 
                  type="text" 
                  value={formData.datOMoi} 
                  onChange={e => handleChange('datOMoi', e.target.value)}
                  placeholder="Ví dụ: K hoặc 120m2 đất ở đô thị..."
                />
              </div>
            </div>

            <div className="party-field">
              <label>
                <span>3. Tài sản mới giá trị lớn (≥ 50 triệu)</span>
                <button type="button" className="label-quick-k" onClick={() => setFieldToK('taiSanMoi')}>Điền K</button>
              </label>
              <input 
                type="text" 
                value={formData.taiSanMoi} 
                onChange={e => handleChange('taiSanMoi', e.target.value)}
                placeholder="Ví dụ: K hoặc Ô tô con 5 chỗ trị giá 600 triệu..."
              />
            </div>
          </div>

          {/* 5. MỤC III: QUAN HỆ GIA ĐÌNH */}
          <div className="form-group-section">
            <div className="section-title-badge">
              <Users size={18} />
              III. Thay Đổi Về Quan Hệ Gia Đình
            </div>

            <div className="party-field">
              <label>
                <span>1. Cha, mẹ đẻ; cha, mẹ vợ (chồng)</span>
                <button type="button" className="label-quick-k" onClick={() => setFieldToK('quanHeChaMe')}>Điền K</button>
              </label>
              <textarea 
                rows={2}
                value={formData.quanHeChaMe} 
                onChange={e => handleChange('quanHeChaMe', e.target.value)}
                placeholder="Ghi rõ biến động (kết nạp Đảng, chuyển nơi ở, qua đời, vi phạm pháp luật...) hoặc K"
              />
            </div>

            <div className="party-field">
              <label>
                <span>2. Vợ (hoặc chồng)</span>
                <button type="button" className="label-quick-k" onClick={() => setFieldToK('quanHeVoChong')}>Điền K</button>
              </label>
              <textarea 
                rows={2}
                value={formData.quanHeVoChong} 
                onChange={e => handleChange('quanHeVoChong', e.target.value)}
                placeholder="Ghi rõ biến động (kết hôn, chuyển công tác, vi phạm...) hoặc K"
              />
            </div>

            <div className="party-field">
              <label>
                <span>3. Các con</span>
                <button type="button" className="label-quick-k" onClick={() => setFieldToK('quanHeConCai')}>Điền K</button>
              </label>
              <textarea 
                rows={2}
                value={formData.quanHeConCai} 
                onChange={e => handleChange('quanHeConCai', e.target.value)}
                placeholder="Ghi rõ biến động (sinh con, học đại học, tốt nghiệp, đi làm...) hoặc K"
              />
            </div>
          </div>

          {/* 6. ĐỊA DANH & NGÀY KHAI */}
          <div className="form-group-section">
            <div className="section-title-badge">
              <Shield size={18} />
              Địa Danh & Ngày Ký Khai
            </div>

            <div className="party-form-row">
              <div className="party-field">
                <label>Địa danh</label>
                <input 
                  type="text" 
                  value={formData.diaDanh} 
                  onChange={e => handleChange('diaDanh', e.target.value)}
                  placeholder="Ví dụ: Vị Thanh, Hậu Giang, TP. Hồ Chí Minh"
                />
              </div>
              <div className="party-field">
                <label>Thời gian khai</label>
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

        {/* CỘT PHẢI: XEM TRƯỚC BẢN IN A4 (PAPER VIEW) */}
        <div className="party-preview-sticky">
          <div className="preview-toolbar">
            <div className="preview-title">
              <FileText size={18} color="#b91c1c" />
              Xem Trước Trang In A4 (Thể thức Đảng)
            </div>
            <button 
              type="button" 
              className="btn-quick-k"
              onClick={handleDownloadDocx}
            >
              <Download size={14} /> Tải .doc
            </button>
          </div>

          <div className="paper-a4-viewport">
            <div className="paper-sheet" id="printable-party-document">
              
              {/* Header 2 cột */}
              <div className="paper-header-grid">
                <div className="paper-org-left">
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{formData.dangBoCoSo || 'ĐẢNG BỘ TRƯỜNG CAO ĐẲNG BÁCH KHOA NAM SÀI GÒN'}</div>
                  <div style={{ fontWeight: 'bold' }}>CHI BỘ: {formData.chiBo || '………..'}</div>
                  <div style={{ width: '80px', height: '1px', background: '#000', margin: '3px auto 0 auto' }}></div>
                </div>
                <div className="paper-motto-right">
                  <div className="motto-main">ĐẢNG CỘNG SẢN VIỆT NAM</div>
                  <div className="motto-stars">***</div>
                  <div className="motto-date">
                    {formData.diaDanh || '.........'}, ngày {formData.ngayKhai || '....'} tháng {formData.thangKhai || '....'} năm {formData.namKhai || '202...'}
                  </div>
                </div>
              </div>

              {/* Số LL và Số TĐV */}
              <div className="paper-serial-row">
                <div>Số LL: <strong>{formData.soLyLich || '................................'}</strong></div>
                <div>Số TĐV: <strong>{formData.soTheDangVien || '................................'}</strong></div>
              </div>

              {/* Tiêu đề */}
              <div className="paper-title-block">
                <h2 className="paper-title-main">PHIẾU BỔ SUNG HỒ SƠ ĐẢNG VIÊN</h2>
                <div className="paper-title-sub">(Năm {formData.namBoSung || new Date().getFullYear().toString()})</div>
                <div className="paper-note">
                  (Ghi chú: Chỉ ghi những mục có nội dung thay đổi so với năm trước; nếu không thay đổi thì ghi vào mục đó chữ "K")
                </div>
              </div>

              {/* Họ tên và sinh nhật */}
              <div className="paper-p">
                - Họ và tên khai sinh: <strong style={{ textTransform: 'uppercase', fontSize: '13pt' }}>
                  {formData.hoVaTen || '...........................................................................'}
                </strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', margin: '4px 0' }}>
                <div>- Ngày, tháng, năm sinh: <strong>{formData.namSinh || '................................'}</strong></div>
                <div>- Giới tính: <strong>{formData.gioiTinh || 'Nam'}</strong></div>
              </div>

              {/* I. Cá nhân */}
              <div className="paper-sec-head">I. THAY ĐỔI VỀ CÁ NHÂN:</div>

              <div className="paper-p"><strong>1. Nơi ở mới:</strong></div>
              <div className="paper-p paper-indent">- Nơi thường trú hoặc tạm trú mới: <strong>{formData.noiOHienNay || 'K'}</strong></div>
              <div className="paper-p paper-indent">- Quê quán (nếu có điều chỉnh thay đổi địa giới hành chính): <strong>{formData.queQuanMoi || 'K'}</strong></div>

              <div className="paper-p"><strong>2. Nghề nghiệp, đơn vị công tác mới:</strong></div>
              <div className="paper-p paper-indent">- Nghề nghiệp: <strong>{formData.ngheNghiepMoi || 'K'}</strong></div>
              <div className="paper-p paper-indent">- Đơn vị công tác mới: <strong>{formData.donViCongTacMoi || 'K'}</strong></div>

              <div className="paper-p"><strong>3. Chức vụ mới được giao (bầu cử, bổ nhiệm):</strong></div>
              <div className="paper-p paper-indent">- Về Đảng: <strong>{formData.chucVuDangMoi || 'K'}</strong></div>
              <div className="paper-p paper-indent">- Về chính quyền, chuyên môn: <strong>{formData.chucVuChinhQuyenMoi || 'K'}</strong></div>
              <div className="paper-p paper-indent">- Về đoàn thể: <strong>{formData.chucVuDoanTheMoi || 'K'}</strong></div>

              <div className="paper-p"><strong>4. Trình độ học vấn, chuyên môn nghiệp vụ mới:</strong></div>
              <div className="paper-p paper-indent">- Giáo dục phổ thông: <strong>{formData.giaoDucPhoThongMoi || 'K'}</strong></div>
              <div className="paper-p paper-indent">- Chuyên môn nghiệp vụ: <strong>{formData.chuyenMonNghiepVuMoi || 'K'}</strong></div>
              <div className="paper-p paper-indent">- Học hàm, học vị mới: <strong>{formData.hocHamHocViMoi || 'K'}</strong></div>
              <div className="paper-p paper-indent">- Lý luận chính trị: <strong>{formData.lyLuanChinhTriMoi || 'K'}</strong></div>
              <div className="paper-p paper-indent">- Ngoại ngữ, tin học: <strong>{formData.ngoaiNguTinHocMoi || 'K'}</strong></div>

              <div className="paper-p"><strong>5. Khen thưởng trong năm:</strong> <strong>{formData.khenThuongMoi || 'K'}</strong></div>
              <div className="paper-p"><strong>6. Kỷ luật trong năm:</strong> <strong>{formData.kyLuatMoi || 'K'}</strong></div>

              {/* II. Kinh tế */}
              <div className="paper-sec-head">II. THAY ĐỔI VỀ HOÀN CẢNH KINH TẾ (Bản thân và gia đình):</div>

              <div className="paper-p"><strong>1. Mức thu nhập trong năm:</strong></div>
              <div className="paper-p paper-indent">- Tổng mức thu nhập của hộ gia đình: <strong>{formData.tongThuNhapNam || 'K'}</strong></div>
              <div className="paper-p paper-indent">- Bình quân thu nhập đầu người/tháng: <strong>{formData.binhQuanThuNhap || 'K'}</strong></div>

              <div className="paper-p"><strong>2. Nhà ở, đất ở mới tạo lập hoặc chuyển nhượng:</strong></div>
              <div className="paper-p paper-indent">- Nhà ở mới: <strong>{formData.nhaOMoi || 'K'}</strong></div>
              <div className="paper-p paper-indent">- Đất ở mới: <strong>{formData.datOMoi || 'K'}</strong></div>

              <div className="paper-p"><strong>3. Tài sản mới có giá trị lớn (từ 50 triệu đồng trở lên):</strong> <strong>{formData.taiSanMoi || 'K'}</strong></div>

              {/* III. Quan hệ gia đình */}
              <div className="paper-sec-head">III. THAY ĐỔI VỀ QUAN HỆ GIA ĐÌNH:</div>

              <div className="paper-p"><strong>1. Về cha, mẹ đẻ, cha, mẹ vợ (hoặc chồng):</strong> <strong>{formData.quanHeChaMe || 'K'}</strong></div>
              <div className="paper-p"><strong>2. Về vợ (hoặc chồng):</strong> <strong>{formData.quanHeVoChong || 'K'}</strong></div>
              <div className="paper-p"><strong>3. Về các con:</strong> <strong>{formData.quanHeConCai || 'K'}</strong></div>

              {/* Chữ ký 3 bên */}
              <div className="paper-signature-grid">
                <div className="paper-sign-col">
                  <div className="sign-title">Ý KIẾN XÁC NHẬN<br />CỦA CHI ỦY CHI BỘ</div>
                  <div className="sign-sub">(Ký, ghi rõ họ tên)</div>
                  <div className="sign-space"></div>
                  <div className="sign-name">.........................................</div>
                </div>

                <div className="paper-sign-col">
                  <div className="sign-title">XÁC NHẬN CỦA<br />CẤP ỦY CƠ SỞ</div>
                  <div className="sign-sub">(Ký tên, đóng dấu)</div>
                  <div className="sign-space"></div>
                  <div className="sign-name">.........................................</div>
                </div>

                <div className="paper-sign-col">
                  <div className="sign-title">NGƯỜI KHAI</div>
                  <div className="sign-sub">(Ký, ghi rõ họ tên)</div>
                  <div className="sign-space"></div>
                  <div className="sign-name">
                    {(formData.hoVaTen || '.........................................').toUpperCase()}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* MODAL AI THƯ KÝ ĐẢNG */}
      {showAiModal && (
        <div className="party-ai-modal-backdrop" onClick={() => setShowAiModal(false)}>
          <div className="party-ai-modal" onClick={e => e.stopPropagation()}>
            <div className="party-ai-modal-header">
              <h3>
                <Sparkles size={20} />
                Trợ Lý Thư Ký AI - Bóc Tách Tự Động
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
              Dán đoạn văn bản ghi chép của đồng chí đảng viên (ví dụ: họ tên, ngày sinh, các thay đổi trong năm về học vị mới, chức vụ mới, khen thưởng, thu nhập...). 
              AI sẽ tự động đọc hiểu, bóc tách và phân bổ vào đúng các mục; các mục không đổi sẽ tự động gán chữ "K".
            </p>

            <textarea 
              rows={6}
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Ví dụ: Tôi là Nguyễn Văn Bình, sinh ngày 12/04/1988, nam. Trong năm 2026 tôi vừa tốt nghiệp Thạc sĩ Công nghệ Thông tin, được bầu làm Bí thư Chi bộ Khoa CNTT và nhận Bằng khen của UBND tỉnh..."
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
                <AlertCircle size={16} />
                <span>{aiError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                onClick={() => setShowAiModal(false)}
                className="btn-party-action secondary"
                style={{ color: '#475569', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                onClick={handleAiAutoFill}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="btn-party-action primary"
                style={{ background: '#b91c1c', color: '#ffffff' }}
              >
                {isAiLoading ? 'AI Đang Bóc Tách...' : 'Bắt Đầu Bóc Tách & Điền Form'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

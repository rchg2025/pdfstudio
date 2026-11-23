import { useState, useEffect } from 'react';
import { 
  Building2, 
  Download, 
  Check, 
  RotateCcw, 
  Printer, 
  FileText,
  Award,
  Users
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

  return (
    <div className="party-review-container">
      {/* HEADER BANNER */}
      <div className="party-review-header">
        <div className="party-review-title">
          <h1>
            <Building2 size={26} />
            Báo Cáo Kiểm Điểm, Tự Đánh Giá Xếp Loại Tập Thể (Mẫu 01)
          </h1>
          <p>
            Dành cho Cấp ủy, Chi bộ, Tập thể Lãnh đạo quản lý theo Hướng dẫn số 397-HD/ĐU ngày 20/11/2026 của Đảng ủy Trường CĐ Bách khoa Nam Sài Gòn.
          </p>
        </div>
        <div className="party-review-actions">
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
            In Báo Cáo
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

          {/* 1. THÔNG TIN TẬP THỂ */}
          <div className="review-section">
            <div className="review-sec-badge">
              <Building2 size={18} />
              1. Thông Tin Cấp Ủy & Tập Thể Kiểm Điểm
            </div>

            <div className="review-form-row">
              <div className="review-field" style={{ flex: 1 }}>
                <label>Đảng bộ cơ sở</label>
                <input 
                  type="text" 
                  value={formData.huyenUy} 
                  onChange={e => handleChange('huyenUy', e.target.value)}
                />
              </div>
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Tên tập thể kiểm điểm</label>
                <input 
                  type="text" 
                  value={formData.tenTapThe} 
                  onChange={e => handleChange('tenTapThe', e.target.value)}
                  placeholder="Ví dụ: Chi ủy Chi bộ 1, Ban Giám hiệu..."
                  style={{ fontWeight: 700 }}
                />
              </div>
              <div className="review-field">
                <label>Chi bộ trực thuộc</label>
                <input 
                  type="text" 
                  value={formData.chiBo} 
                  onChange={e => handleChange('chiBo', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 2. ƯU ĐIỂM, KẾT QUẢ ĐẠT ĐƯỢC */}
          <div className="review-section">
            <div className="review-sec-badge">
              <Check size={18} />
              2. Ưu Điểm, Kết Quả Đạt Được Của Tập Thể
            </div>

            <div className="review-field">
              <label>1. Chấp hành Cương lĩnh, Điều lệ Đảng, Nghị quyết, nguyên tắc tập trung dân chủ</label>
              <textarea 
                rows={4}
                value={formData.uuDiemChapHanhDuongLoi}
                onChange={e => handleChange('uuDiemChapHanhDuongLoi', e.target.value)}
              />
            </div>

            <div className="review-field">
              <label>2. Kết quả thực hiện mục tiêu, chỉ tiêu nhiệm vụ chính trị và chuyên môn trong năm</label>
              <textarea 
                rows={4}
                value={formData.uuDiemThucHienMucTieu}
                onChange={e => handleChange('uuDiemThucHienMucTieu', e.target.value)}
              />
            </div>

            <div className="review-field">
              <label>3. Xây dựng, chỉnh đốn Đảng; tinh gọn bộ máy; cải cách hành chính & chuyển đổi số (NQ 57-NQ/TW)</label>
              <textarea 
                rows={4}
                value={formData.uuDiemXayDungChinhDonDang}
                onChange={e => handleChange('uuDiemXayDungChinhDonDang', e.target.value)}
              />
            </div>

            <div className="review-field">
              <label>4. Trách nhiệm của tập thể lãnh đạo, quản lý trong điều hành</label>
              <textarea 
                rows={3}
                value={formData.uuDiemTrachNhiemLanhDao}
                onChange={e => handleChange('uuDiemTrachNhiemLanhDao', e.target.value)}
              />
            </div>
          </div>

          {/* 3. HẠN CHẾ & NGUYÊN NHÂN */}
          <div className="review-section">
            <div className="review-sec-badge">
              <Users size={18} />
              3. Hạn Chế, Khuyết Điểm Và Nguyên Nhân
            </div>

            <div className="review-field">
              <label>Hạn chế, khuyết điểm của tập thể</label>
              <textarea 
                rows={3}
                value={formData.hanCheKhuyetDiem}
                onChange={e => handleChange('hanCheKhuyetDiem', e.target.value)}
              />
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Nguyên nhân khách quan</label>
                <textarea 
                  rows={2}
                  value={formData.nguyenNhanKhachQuan}
                  onChange={e => handleChange('nguyenNhanKhachQuan', e.target.value)}
                />
              </div>
              <div className="review-field">
                <label>Nguyên nhân chủ quan</label>
                <textarea 
                  rows={2}
                  value={formData.nguyenNhanChuQuan}
                  onChange={e => handleChange('nguyenNhanChuQuan', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 4. KHẮC PHỤC & PHƯƠNG HƯỚNG */}
          <div className="review-section">
            <div className="review-sec-badge">
              <RotateCcw size={18} />
              4. Khắc Phục Hạn Chế & Phương Hướng
            </div>

            <div className="review-field">
              <label>Kết quả khắc phục các hạn chế kỳ kiểm điểm trước</label>
              <textarea 
                rows={2}
                value={formData.ketQuaKhacPhucNamTruoc}
                onChange={e => handleChange('ketQuaKhacPhucNamTruoc', e.target.value)}
              />
            </div>

            <div className="review-field">
              <label>Phương hướng, biện pháp khắc phục</label>
              <textarea 
                rows={3}
                value={formData.phuongHuongKhacPhuc}
                onChange={e => handleChange('phuongHuongKhacPhuc', e.target.value)}
              />
            </div>
          </div>

          {/* 5. TỰ ĐÁNH GIÁ, XẾP LOẠI */}
          <div className="review-section">
            <div className="review-sec-badge">
              <Award size={18} />
              5. Tự Đánh Giá, Chấm Điểm & Đề Xuất Xếp Loại (Phụ lục 2)
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Điểm tiêu chí chung (/30 điểm)</label>
                <input 
                  type="number" 
                  min={0} 
                  max={30}
                  value={formData.diemTieuChiChung}
                  onChange={e => handleChange('diemTieuChiChung', Number(e.target.value))}
                />
              </div>
              <div className="review-field">
                <label>Điểm kết quả nhiệm vụ (/70 điểm)</label>
                <input 
                  type="number" 
                  min={0} 
                  max={70}
                  value={formData.diemThucHienNhiemVu}
                  onChange={e => handleChange('diemThucHienNhiemVu', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="review-field">
              <label>Tự đề xuất xếp loại mức chất lượng tập thể</label>
              <select 
                value={formData.tuXepLoaiTapThe}
                onChange={e => handleChange('tuXepLoaiTapThe', e.target.value)}
              >
                <option value="Hoàn thành xuất sắc nhiệm vụ">Hoàn thành xuất sắc nhiệm vụ</option>
                <option value="Hoàn thành tốt nhiệm vụ">Hoàn thành tốt nhiệm vụ</option>
                <option value="Hoàn thành nhiệm vụ">Hoàn thành nhiệm vụ</option>
                <option value="Không hoàn thành nhiệm vụ">Không hoàn thành nhiệm vụ</option>
              </select>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: XEM TRƯỚC VĂN BẢN A4 TRỰC QUAN */}
        <div className="party-review-sticky">
          <div className="review-preview-toolbar">
            <div className="review-preview-title">
              <FileText size={18} className="text-danger" />
              <span>Xem Trước Báo Cáo Kiểm Điểm Tập Thể (Mẫu 01)</span>
            </div>
            <button 
              type="button" 
              className="btn-review-act primary"
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
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{formData.huyenUy}</div>
                  <div style={{ fontWeight: 'bold' }}>CHI BỘ: {formData.chiBo.toUpperCase()}</div>
                  <div style={{ width: '80px', height: '1px', background: '#000', margin: '3px auto 0 auto' }}></div>
                </div>
                <div className="paper-motto-right">
                  <div className="motto-main">ĐẢNG CỘNG SẢN VIỆT NAM</div>
                  <div className="motto-stars">***</div>
                  <div className="motto-date">
                    {formData.diaDanh}, ngày {formData.ngayKhai} tháng {formData.thangKhai} năm {formData.namKhai}
                  </div>
                </div>
              </div>

              {/* Tiêu đề */}
              <div className="paper-title-block">
                <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '11pt' }}>Mẫu 01-HD KĐ.ĐG 2026</div>
                <div className="paper-title-main">BÁO CÁO KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG</div>
                <div className="paper-title-sub">CỦA TẬP THỂ {formData.tenTapThe.toUpperCase()}</div>
                <div className="paper-title-sub">Năm {formData.namKiemDiem}</div>
                <div className="paper-note">(Kèm theo Hướng dẫn số 397-HD/ĐU ngày 20/11/2026 của Đảng ủy Trường Cao đẳng Bách khoa Nam Sài Gòn)</div>
              </div>

              <div className="paper-heading-1">A. NỘI DUNG KIỂM ĐIỂM</div>
              <div className="paper-heading-2">I. Ưu điểm, kết quả đạt được</div>
              <div className="paper-p"><strong>1. Chấp hành Cương lĩnh, Điều lệ Đảng, nghị quyết, pháp luật, nguyên tắc tập trung dân chủ:</strong></div>
              <div className="paper-text-block">{formData.uuDiemChapHanhDuongLoi}</div>

              <div className="paper-p"><strong>2. Kết quả thực hiện mục tiêu, chỉ tiêu nhiệm vụ chính trị trong năm:</strong></div>
              <div className="paper-text-block">{formData.uuDiemThucHienMucTieu}</div>

              <div className="paper-p"><strong>3. Xây dựng, chỉnh đốn Đảng; tinh gọn bộ máy; cải cách hành chính & chuyển đổi số:</strong></div>
              <div className="paper-text-block">{formData.uuDiemXayDungChinhDonDang}</div>

              <div className="paper-p"><strong>4. Trách nhiệm của tập thể lãnh đạo, quản lý:</strong></div>
              <div className="paper-text-block">{formData.uuDiemTrachNhiemLanhDao}</div>

              <div className="paper-heading-2">II. Hạn chế, khuyết điểm và nguyên nhân</div>
              <div className="paper-text-block">{formData.hanCheKhuyetDiem}</div>

              <div className="paper-heading-2">III. Kết quả khắc phục hạn chế kỳ kiểm điểm trước</div>
              <div className="paper-text-block">{formData.ketQuaKhacPhucNamTruoc}</div>

              <div className="paper-heading-2">IV. Phương hướng, biện pháp khắc phục</div>
              <div className="paper-text-block">{formData.phuongHuongKhacPhuc}</div>

              <div className="paper-heading-1">B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI</div>
              <div className="paper-p">
                - Nhóm tiêu chí chung: <strong>{formData.diemTieuChiChung}/30 điểm</strong><br />
                - Nhóm tiêu chí về kết quả thực hiện nhiệm vụ: <strong>{formData.diemThucHienNhiemVu}/70 điểm</strong><br />
                - <strong>Tổng điểm: {formData.diemTieuChiChung + formData.diemThucHienNhiemVu}/100 điểm</strong><br />
                - Tự đề xuất xếp loại mức chất lượng: <strong>{formData.tuXepLoaiTapThe}</strong>
              </div>

              {/* Chữ ký */}
              <div className="paper-signature-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
    </div>
  );
}

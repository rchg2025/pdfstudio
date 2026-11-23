import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Download, 
  Check, 
  RotateCcw, 
  Printer, 
  FileText,
  Award
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('Lỗi lưu nháp:', e);
    }
  }, [formData]);

  const handleChange = (field: keyof PartyReview02CStudentData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  return (
    <div className="party-review-container">
      {/* HEADER BANNER */}
      <div className="party-review-header">
        <div className="party-review-title">
          <h1>
            <GraduationCap size={26} />
            Bản Kiểm Điểm, Tự Đánh Giá Xếp Loại Đảng Viên Học Sinh, Sinh Viên (Mẫu 02C)
          </h1>
          <p>
            Dành cho Đảng viên là học sinh, sinh viên theo Hướng dẫn số 397-HD/ĐU ngày 20/11/2026 của Đảng ủy Trường CĐ Bách khoa Nam Sài Gòn.
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

          {/* 1. THÔNG TIN SINH VIÊN */}
          <div className="review-section">
            <div className="review-sec-badge">
              <GraduationCap size={18} />
              1. Thông Tin Đảng Viên Học Sinh, Sinh Viên
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Họ và tên khai sinh (viết hoa)</label>
                <input 
                  type="text" 
                  value={formData.hoVaTen} 
                  onChange={e => handleChange('hoVaTen', e.target.value.toUpperCase())}
                  placeholder="Ví dụ: NGUYỄN VĂN AN"
                  style={{ fontWeight: 700 }}
                />
              </div>
              <div className="review-field">
                <label>Ngày, tháng, năm sinh</label>
                <input 
                  type="text" 
                  value={formData.namSinh} 
                  onChange={e => handleChange('namSinh', e.target.value)}
                  placeholder="dd/mm/yyyy (ví dụ: 15/08/2005)"
                />
              </div>
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Lớp học</label>
                <input 
                  type="text" 
                  value={formData.lop} 
                  onChange={e => handleChange('lop', e.target.value)}
                  placeholder="Ví dụ: CĐ-CNTT 24A"
                />
              </div>
              <div className="review-field">
                <label>Khoa chuyên môn</label>
                <input 
                  type="text" 
                  value={formData.khoa} 
                  onChange={e => handleChange('khoa', e.target.value)}
                  placeholder="Ví dụ: Khoa Công Nghệ Thông Tin"
                />
              </div>
            </div>

            <div className="review-form-row">
              <div className="review-field">
                <label>Chi bộ sinh hoạt</label>
                <input 
                  type="text" 
                  value={formData.chiBoSinhHoat} 
                  onChange={e => handleChange('chiBoSinhHoat', e.target.value)}
                  placeholder="Chi bộ Sinh viên hoặc Chi bộ Khoa..."
                />
              </div>
              <div className="review-field">
                <label>Nơi học tập / công tác</label>
                <input 
                  type="text" 
                  value={formData.donViCongTac} 
                  onChange={e => handleChange('donViCongTac', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 2. ƯU ĐIỂM, KẾT QUẢ ĐẠT ĐƯỢC */}
          <div className="review-section">
            <div className="review-sec-badge">
              <Check size={18} />
              2. Ưu Điểm, Kết Quả Đạt Được Trong Năm
            </div>

            <div className="review-field">
              <label>1. Phẩm chất chính trị, đạo đức, lối sống, ý thức tổ chức kỷ luật, văn hóa học đường</label>
              <textarea 
                rows={4}
                value={formData.uuDiemPhamChatChinhTri}
                onChange={e => handleChange('uuDiemPhamChatChinhTri', e.target.value)}
              />
            </div>

            <div className="review-field">
              <label>2. Quyền và nghĩa vụ đảng viên; kết quả học tập, rèn luyện; phong trào Đoàn - Hội</label>
              <textarea 
                rows={4}
                value={formData.uuDiemThucHienNhiemVu}
                onChange={e => handleChange('uuDiemThucHienNhiemVu', e.target.value)}
              />
            </div>

            <div className="review-field">
              <label>3. Thực hiện cam kết tu dưỡng, rèn luyện; tự soi, tự sửa</label>
              <textarea 
                rows={3}
                value={formData.uuDiemCamKetTuDuong}
                onChange={e => handleChange('uuDiemCamKetTuDuong', e.target.value)}
              />
            </div>
          </div>

          {/* 3. HẠN CHẾ & NGUYÊN NHÂN */}
          <div className="review-section">
            <div className="review-sec-badge">
              <Award size={18} />
              3. Hạn Chế, Khuyết Điểm Và Nguyên Nhân
            </div>

            <div className="review-field">
              <label>Hạn chế, khuyết điểm trong học tập và sinh hoạt</label>
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

          {/* 4. PHƯƠNG HƯỚNG KHẮC PHỤC */}
          <div className="review-section">
            <div className="review-sec-badge">
              <RotateCcw size={18} />
              4. Phương Hướng, Biện Pháp Khắc Phục
            </div>

            <div className="review-field">
              <label>Phương hướng, biện pháp rèn luyện trong năm tiếp theo</label>
              <textarea 
                rows={3}
                value={formData.phuongHuongKhacPhuc}
                onChange={e => handleChange('phuongHuongKhacPhuc', e.target.value)}
              />
            </div>
          </div>

          {/* 5. TỰ ĐÁNH GIÁ, CHẤM ĐIỂM */}
          <div className="review-section">
            <div className="review-sec-badge">
              <Award size={18} />
              5. Tự Đánh Giá, Chấm Điểm (Phụ lục 5)
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
              <label>Tự đề xuất xếp loại mức chất lượng đảng viên</label>
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
        </div>

        {/* CỘT PHẢI: XEM TRƯỚC VĂN BẢN A4 TRỰC QUAN */}
        <div className="party-review-sticky">
          <div className="review-preview-toolbar">
            <div className="review-preview-title">
              <FileText size={18} className="text-danger" />
              <span>Xem Trước Mẫu 02C (Đảng Viên HSSV)</span>
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
                <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '11pt' }}>Mẫu 02C-HD KĐ.ĐG 2026</div>
                <div className="paper-title-main">BẢN KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CỦA CÁ NHÂN</div>
                <div className="paper-title-sub">Năm {formData.namKiemDiem}</div>
                <div className="paper-title-sub">(Đảng viên là học sinh, sinh viên)</div>
                <div className="paper-note">(Kèm theo Hướng dẫn số 397-HD/ĐU ngày 20/11/2026 của Đảng ủy Trường Cao đẳng Bách khoa Nam Sài Gòn)</div>
              </div>

              <div className="paper-p">
                - Họ và tên: <strong style={{ textTransform: 'uppercase' }}>{formData.hoVaTen || '...........................................'}</strong> &nbsp;&nbsp;&nbsp;&nbsp; - Ngày sinh: <strong>{formData.namSinh || '................'}</strong><br />
                - Lớp: <strong>{formData.lop}</strong> ({formData.khoa}) &nbsp;&nbsp;&nbsp;&nbsp; - Chi bộ: <strong>{formData.chiBoSinhHoat}</strong><br />
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
              <div className="paper-text-block">{formData.hanCheKhuyetDiem}</div>

              <div className="paper-heading-2">III. Kết quả khắc phục hạn chế kỳ kiểm điểm trước</div>
              <div className="paper-text-block">{formData.ketQuaKhacPhucNamTruoc}</div>

              <div className="paper-heading-2">IV. Phương hướng, biện pháp khắc phục</div>
              <div className="paper-text-block">{formData.phuongHuongKhacPhuc}</div>

              <div className="paper-heading-1">B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI</div>
              <div className="paper-p">
                - Nhóm tiêu chí chung: <strong>{formData.diemTieuChiChung}/30 điểm</strong><br />
                - Nhóm tiêu chí về kết quả thực hiện nhiệm vụ: <strong>{formData.diemThucHienNhiemVu}/70 điểm</strong><br />
                - <strong>Tổng điểm tự chấm: {formData.diemTieuChiChung + formData.diemThucHienNhiemVu}/100 điểm</strong><br />
                - Tự đề xuất xếp loại mức chất lượng: <strong>{formData.tuXepLoaiDangVien}</strong>
              </div>

              {/* Chữ ký */}
              <div className="paper-signature-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div></div>
                <div className="sig-col-center">
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>NGƯỜI TỰ KIỂM ĐIỂM</div>
                  <div style={{ fontStyle: 'italic', fontSize: '11pt' }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ height: '70px' }}></div>
                  <div style={{ fontWeight: 'bold' }}>{(formData.hoVaTen || '').toUpperCase()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

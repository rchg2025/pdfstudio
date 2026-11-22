export interface PartyMemberProfileData {
  // Tiêu đề & Tổ chức Đảng
  tinhUy: string;           // ĐẢNG BỘ TỈNH / ĐẢNG BỘ ...
  huyenUy: string;          // HUYỆN ỦY / ĐẢNG ỦY KHỐI ...
  dangBoCoSo: string;       // Đảng bộ cơ sở ...
  chiBo: string;            // Chi bộ ...
  namBoSung: string;         // Năm bổ sung hồ sơ, ví dụ: 2026
  soLyLich: string;         // Số LL
  soTheDangVien: string;    // Số TĐV

  // Thông tin cá nhân
  hoVaTen: string;          // Viết in hoa: NGUYỄN VĂN A
  namSinh: string;          // Ngày tháng năm sinh (dd/mm/yyyy)
  gioiTinh: string;         // Nam / Nữ

  // I. THAY ĐỔI VỀ CÁ NHÂN
  // 1. Nơi ở mới
  noiOHienNay: string;      // Nơi ở hiện nay (nếu đổi)
  queQuanMoi: string;       // Quê quán (nếu thay đổi / điều chỉnh theo địa giới hành chính)

  // 2. Nghề nghiệp, đơn vị công tác mới
  ngheNghiepMoi: string;    // Nghề nghiệp mới
  donViCongTacMoi: string;  // Cơ quan, đơn vị công tác mới

  // 3. Chức vụ mới được giao (Đảng, chính quyền, đoàn thể...)
  chucVuDangMoi: string;        // Chức vụ Đảng mới bổ nhiệm/bầu
  chucVuChinhQuyenMoi: string;  // Chức vụ chính quyền / chuyên môn mới
  chucVuDoanTheMoi: string;     // Chức vụ đoàn thể mới

  // 4. Trình độ học vấn, chuyên môn nghiệp vụ, lý luận chính trị
  giaoDucPhoThongMoi: string;   // GD phổ thông (12/12...)
  chuyenMonNghiepVuMoi: string; // Cử nhân, Thạc sĩ, Tiến sĩ... chuyên ngành...
  hocHamHocViMoi: string;       // Giáo sư, Phó Giáo sư, Tiến sĩ...
  lyLuanChinhTriMoi: string;    // Sơ cấp, Trung cấp, Cao cấp LLCT
  ngoaiNguTinHocMoi: string;    // Ngoại ngữ, Tin học đạt chuẩn mới

  // 5. Khen thưởng trong năm
  khenThuongMoi: string;        // Huân huy chương, Bằng khen, Chiến sĩ thi đua, Đảng viên hoàn thành xuất sắc Nv...

  // 6. Kỷ luật trong năm
  kyLuatMoi: string;            // Hình thức kỷ luật Đảng, chính quyền, pháp luật (nếu có)

  // II. THAY ĐỔI VỀ HOÀN CẢNH KINH TẾ (Bản thân và gia đình)
  // 1. Thu nhập
  tongThuNhapNam: string;       // Tổng mức thu nhập trong năm của hộ gia đình
  binhQuanThuNhap: string;      // Bình quân thu nhập đầu người/tháng

  // 2. Nhà ở, đất ở mới tạo lập hoặc chuyển nhượng
  nhaOMoi: string;              // Loại nhà, cấp nhà, diện tích xây dựng, giá trị
  datOMoi: string;              // Diện tích đất ở, nguồn gốc, giá trị

  // 3. Tài sản mới có giá trị lớn (từ 50 triệu đồng trở lên)
  taiSanMoi: string;            // Ô tô, tàu thuyền, cổ phiếu, kim khí quý...

  // III. THAY ĐỔI VỀ QUAN HỆ GIA ĐÌNH
  // 1. Cha, mẹ đẻ, cha, mẹ vợ (chồng)
  quanHeChaMe: string;          // Thay đổi (mất, chuyển nơi ở, vào Đảng, vi phạm pháp luật...)
  // 2. Vợ (hoặc chồng)
  quanHeVoChong: string;        // Kết hôn, ly hôn, thay đổi nghề nghiệp, vi phạm...
  // 3. Các con
  quanHeConCai: string;         // Sinh con, học tập, nghề nghiệp, kết hôn, vi phạm...

  // Địa danh và ngày ký
  diaDanh: string;              // Ví dụ: TP. Hồ Chí Minh, Hà Nội, Hậu Giang...
  ngayKhai: string;             // Ngày khai (dd)
  thangKhai: string;            // Tháng khai (mm)
  namKhai: string;              // Năm khai (yyyy)
}

export const defaultPartyProfileData: PartyMemberProfileData = {
  tinhUy: 'TỈNH ỦY HẬU GIANG',
  huyenUy: 'THÀNH ỦY VỊ THANH',
  dangBoCoSo: 'Đảng bộ Trường Cao đẳng Hậu Giang',
  chiBo: 'Chi bộ Khoa Công nghệ Thông tin',
  namBoSung: new Date().getFullYear().toString(),
  soLyLich: '',
  soTheDangVien: '',

  hoVaTen: '',
  namSinh: '',
  gioiTinh: 'Nam',

  noiOHienNay: 'K',
  queQuanMoi: 'K',

  ngheNghiepMoi: 'K',
  donViCongTacMoi: 'K',

  chucVuDangMoi: 'K',
  chucVuChinhQuyenMoi: 'K',
  chucVuDoanTheMoi: 'K',

  giaoDucPhoThongMoi: 'K',
  chuyenMonNghiepVuMoi: 'K',
  hocHamHocViMoi: 'K',
  lyLuanChinhTriMoi: 'K',
  ngoaiNguTinHocMoi: 'K',

  khenThuongMoi: 'K',
  kyLuatMoi: 'K',

  tongThuNhapNam: 'K',
  binhQuanThuNhap: 'K',
  nhaOMoi: 'K',
  datOMoi: 'K',
  taiSanMoi: 'K',

  quanHeChaMe: 'K',
  quanHeVoChong: 'K',
  quanHeConCai: 'K',

  diaDanh: 'Hậu Giang',
  ngayKhai: new Date().getDate().toString().padStart(2, '0'),
  thangKhai: (new Date().getMonth() + 1).toString().padStart(2, '0'),
  namKhai: new Date().getFullYear().toString(),
};

/**
 * Xuất file Word (.doc) tương thích 100% chuẩn Microsoft Word / WPS Office
 * Định dạng thể thức văn bản Đảng theo Quy định Ban Bí thư / Ban Tổ chức Trung ương
 */
export function exportPartyMemberProfileDocx(data: PartyMemberProfileData) {
  const sanitize = (val?: string) => {
    if (!val || !val.trim()) return 'K';
    return val.trim();
  };

  const hoTenInHoa = (data.hoVaTen || '...........................................').toUpperCase();

  const htmlDoc = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>Phiếu Bổ sung hồ sơ Đảng viên - ${hoTenInHoa}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page {
        size: 210mm 297mm; /* Khổ A4 */
        margin: 20mm 15mm 20mm 20mm; /* Chuẩn thể thức Đảng */
      }
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 13pt;
        line-height: 1.35;
        color: #000000;
        background: #ffffff;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      .table-header {
        margin-bottom: 8px;
        border: none;
      }
      .table-header td {
        border: none;
        padding: 1px 4px;
        vertical-align: top;
      }
      .title-box {
        text-align: center;
        margin-top: 10px;
        margin-bottom: 12px;
      }
      .title-main {
        font-size: 14pt;
        font-weight: bold;
        text-transform: uppercase;
        margin: 0;
      }
      .title-sub {
        font-size: 13pt;
        font-style: italic;
        margin: 4px 0 0 0;
      }
      .note-guidance {
        font-size: 11pt;
        font-style: italic;
        text-align: center;
        margin: 4px 0 14px 0;
        color: #222;
      }
      .content-p {
        margin: 4px 0;
        text-align: justify;
      }
      .section-heading {
        font-weight: bold;
        margin-top: 10px;
        margin-bottom: 4px;
        text-transform: uppercase;
      }
      .sub-heading {
        font-weight: bold;
      }
      .dots-val {
        border-bottom: 1px dotted #000;
        padding: 0 4px;
      }
      .signature-table {
        margin-top: 25px;
        border: none;
        page-break-inside: avoid;
      }
      .signature-table td {
        border: none;
        padding: 4px;
        text-align: center;
        vertical-align: top;
      }
      .sign-title {
        font-weight: bold;
        font-size: 12pt;
        text-transform: uppercase;
      }
      .sign-sub {
        font-style: italic;
        font-size: 11pt;
        margin-top: 2px;
      }
      .sign-space {
        height: 75px;
      }
      .sign-name {
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <!-- HEADER 2 CỘT -->
    <table class="table-header">
      <tr>
        <td style="width: 50%; text-align: left;">
          <div style="font-weight: bold; text-transform: uppercase; font-size: 12pt;">${data.tinhUy || 'ĐẢNG BỘ ...................................'}</div>
          <div style="font-weight: bold; text-transform: uppercase; font-size: 12pt;">${data.huyenUy || '.......................................................'}</div>
          <div style="font-weight: bold; font-size: 12pt;">${data.dangBoCoSo || 'Đảng bộ cơ sở .................................'}</div>
          <div style="font-size: 12pt;">Chi bộ: ${data.chiBo || '............................................'}</div>
        </td>
        <td style="width: 50%; text-align: center;">
          <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase;">ĐẢNG CỘNG SẢN VIỆT NAM</div>
          <div style="font-size: 13pt; margin-top: 2px;">***</div>
          <div style="font-style: italic; font-size: 12pt; margin-top: 4px;">
            ${data.diaDanh || '.........'}, ngày ${data.ngayKhai || '....'} tháng ${data.thangKhai || '....'} năm ${data.namKhai || '202...'}
          </div>
        </td>
      </tr>
    </table>

    <div style="margin-top: 6px; font-size: 12pt;">
      <span>Số LL: <strong>${data.soLyLich || '..............................'}</strong></span>
      <span style="margin-left: 50px;">Số TĐV: <strong>${data.soTheDangVien || '..............................'}</strong></span>
    </div>

    <!-- TIÊU ĐỀ CHÍNH -->
    <div class="title-box">
      <h1 class="title-main">PHIẾU BỔ SUNG HỒ SƠ ĐẢNG VIÊN</h1>
      <div class="title-sub">(Năm ${data.namBoSung || new Date().getFullYear().toString()})</div>
      <div class="note-guidance">(Ghi chú: Chỉ ghi những mục có nội dung thay đổi so với năm trước; nếu không thay đổi thì ghi vào mục đó chữ "K")</div>
    </div>

    <!-- THÔNG TIN CÁ NHÂN CƠ BẢN -->
    <div class="content-p">
      - Họ và tên khai sinh: <strong style="text-transform: uppercase; font-size: 13pt;">${hoTenInHoa}</strong>
    </div>
    <table style="width: 100%; border: none; margin: 3px 0;">
      <tr>
        <td style="width: 50%; border: none; padding: 0;">- Ngày, tháng, năm sinh: <strong>${data.namSinh || '...........................................'}</strong></td>
        <td style="width: 50%; border: none; padding: 0;">- Giới tính: <strong>${data.gioiTinh || 'Nam'}</strong></td>
      </tr>
    </table>

    <!-- MỤC I: THAY ĐỔI VỀ CÁ NHÂN -->
    <div class="section-heading">I. THAY ĐỔI VỀ CÁ NHÂN:</div>

    <div class="content-p">
      <strong>1. Nơi ở mới:</strong>
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Nơi thường trú hoặc tạm trú mới: ${sanitize(data.noiOHienNay)}
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Quê quán (nếu có điều chỉnh thay đổi địa giới hành chính): ${sanitize(data.queQuanMoi)}
    </div>

    <div class="content-p">
      <strong>2. Nghề nghiệp, đơn vị công tác mới:</strong>
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Nghề nghiệp: ${sanitize(data.ngheNghiepMoi)}
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Đơn vị công tác mới: ${sanitize(data.donViCongTacMoi)}
    </div>

    <div class="content-p">
      <strong>3. Chức vụ mới được giao (bầu cử, bổ nhiệm):</strong>
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Về Đảng: ${sanitize(data.chucVuDangMoi)}
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Về chính quyền, chuyên môn: ${sanitize(data.chucVuChinhQuyenMoi)}
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Về đoàn thể (Công đoàn, Đoàn TN...): ${sanitize(data.chucVuDoanTheMoi)}
    </div>

    <div class="content-p">
      <strong>4. Trình độ học vấn, chuyên môn nghiệp vụ mới:</strong>
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Giáo dục phổ thông: ${sanitize(data.giaoDucPhoThongMoi)}
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Chuyên môn nghiệp vụ: ${sanitize(data.chuyenMonNghiepVuMoi)}
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Học hàm, học vị mới: ${sanitize(data.hocHamHocViMoi)}
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Lý luận chính trị: ${sanitize(data.lyLuanChinhTriMoi)}
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Ngoại ngữ, tin học: ${sanitize(data.ngoaiNguTinHocMoi)}
    </div>

    <div class="content-p">
      <strong>5. Khen thưởng trong năm:</strong> ${sanitize(data.khenThuongMoi)}
    </div>

    <div class="content-p">
      <strong>6. Kỷ luật trong năm:</strong> ${sanitize(data.kyLuatMoi)}
    </div>

    <!-- MỤC II: THAY ĐỔI VỀ HOÀN CẢNH KINH TẾ -->
    <div class="section-heading">II. THAY ĐỔI VỀ HOÀN CẢNH KINH TẾ (Bản thân và gia đình):</div>

    <div class="content-p">
      <strong>1. Mức thu nhập trong năm:</strong>
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Tổng mức thu nhập của hộ gia đình: ${sanitize(data.tongThuNhapNam)}
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Bình quân thu nhập đầu người/tháng: ${sanitize(data.binhQuanThuNhap)}
    </div>

    <div class="content-p">
      <strong>2. Nhà ở, đất ở mới tạo lập hoặc chuyển nhượng:</strong>
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Nhà ở mới: ${sanitize(data.nhaOMoi)}
    </div>
    <div class="content-p" style="padding-left: 20px;">
      - Đất ở mới: ${sanitize(data.datOMoi)}
    </div>

    <div class="content-p">
      <strong>3. Tài sản mới có giá trị lớn (từ 50 triệu đồng trở lên):</strong> ${sanitize(data.taiSanMoi)}
    </div>

    <!-- MỤC III: THAY ĐỔI VỀ QUAN HỆ GIA ĐÌNH -->
    <div class="section-heading">III. THAY ĐỔI VỀ QUAN HỆ GIA ĐÌNH:</div>

    <div class="content-p">
      <strong>1. Về cha, mẹ đẻ, cha, mẹ vợ (hoặc chồng):</strong> ${sanitize(data.quanHeChaMe)}
    </div>

    <div class="content-p">
      <strong>2. Về vợ (hoặc chồng):</strong> ${sanitize(data.quanHeVoChong)}
    </div>

    <div class="content-p">
      <strong>3. Về các con:</strong> ${sanitize(data.quanHeConCai)}
    </div>

    <!-- KHỐI CHỮ KÝ 3 CỘT -->
    <table class="signature-table">
      <tr>
        <td style="width: 33.3%;">
          <div class="sign-title">Ý KIẾN XÁC NHẬN<br>CỦA CHI ỦY CHI BỘ</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
          <div class="sign-name">...................................................</div>
        </td>
        <td style="width: 33.3%;">
          <div class="sign-title">XÁC NHẬN CỦA<br>CẤP ỦY CƠ SỞ</div>
          <div class="sign-sub">(Ký tên, đóng dấu)</div>
          <div class="sign-space"></div>
          <div class="sign-name">...................................................</div>
        </td>
        <td style="width: 33.4%;">
          <div class="sign-title">NGƯỜI KHAI</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
          <div class="sign-name">${hoTenInHoa}</div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  // Tạo Blob dạng Word Document với encoding UTF-8
  const blob = new Blob(['\ufeff' + htmlDoc], {
    type: 'application/msword;charset=utf-8'
  });

  const fileName = `Phieu_Bo_Sung_Ho_So_Dang_Vien_${(data.hoVaTen || 'Mau_3_HSDV').replace(/\s+/g, '_')}_${data.namBoSung || '2026'}.doc`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

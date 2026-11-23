export interface QuarterlyKpiRow {
  content: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  year: string;
  confirmed: 'Đúng' | 'Có sai lệch';
}

export interface PartySelfReview02AData {
  // Cấp ủy & Tiêu đề
  dangBoCoSo: string;         // ĐẢNG BỘ TRƯỜNG CAO ĐẲNG BÁCH KHOA NAM SÀI GÒN
  chiBo: string;              // Chi bộ trực thuộc (vd: Chi bộ 1)
  diaDanh: string;            // Chánh Hưng (theo mẫu) hoặc TP. Hồ Chí Minh
  ngayKhai: string;
  thangKhai: string;
  namKhai: string;
  namKiemDiem: string;        // 2026

  // Thông tin cá nhân
  hoVaTen: string;            // Họ và tên
  namSinh: string;            // Ngày, tháng, năm sinh
  chucVuDang: string;         // Bí thư Chi bộ, Phó Bí thư, Chi ủy viên...
  chucVuChinhQuyen: string;   // Trưởng khoa, Phó Trưởng phòng, Giảng viên...
  chucVuDoanThe: string;      // Chủ tịch Công đoàn bộ phận, Bí thư Đoàn...
  donViCongTac: string;       // Khoa/Phòng... Trường Cao đẳng Bách khoa Nam Sài Gòn
  chiBoSinhHoat: string;      // Chi bộ

  // A. NỘI DUNG KIỂM ĐIỂM
  // I. Ưu điểm, kết quả đạt được
  // 1. Phẩm chất chính trị, đạo đức, lối sống; đoàn kết thống nhất; ý thức tổ chức kỷ luật...
  uuDiemPhamChatChinhTri: string;
  // 2. Thực hiện nhiệm vụ, quyền hạn và chỉ tiêu được giao trong năm...
  uuDiemThucHienNhiemVu: string;
  // 3. Thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu...
  uuDiemCamKetTuDuong: string;
  // 4. Kết quả công tác lãnh đạo, chỉ đạo, quản lý, điều hành...
  uuDiemCongTacLanhDao: string;
  // 5. Trách nhiệm trong công việc, tinh thần năng động đổi mới sáng tạo, dám nghĩ dám làm...
  uuDiemTrachNhiemDoiMoi: string;
  // 6. Trách nhiệm nêu gương của bản thân và gia đình; phòng chống tham nhũng tiêu cực...
  uuDiemTrachNhiemNeuGuong: string;

  // II. Hạn chế, khuyết điểm và nguyên nhân
  // 1. Hạn chế, khuyết điểm
  hanCheKhuyetDiem: string;
  // 2. Nguyên nhân
  nguyenNhanKhachQuan: string;
  nguyenNhanChuQuan: string;

  // III. Kết quả khắc phục hạn chế các kỳ trước
  ketQuaKhacPhucNamTruoc: string;

  // IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)
  giaiTrinhGoiYKiemDiem: string;

  // V. Trách nhiệm của tập thể, cá nhân
  trachNhiemTapTheCaNhan: string;

  // VI. Phương hướng, biện pháp khắc phục
  phuongHuongKhacPhuc: string;

  // B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI
  // I. Kết quả thực hiện nhiệm vụ được giao (Bảng KPI các quý)
  kpiRows: QuarterlyKpiRow[];
  diemTieuChiChung: number;          // Tối đa 30đ
  diemThucHienNhiemVu: number;        // Tối đa 70đ
  tongDiemTuCham: number;             // Tối đa 100đ

  // II. Tự đề xuất xếp loại mức chất lượng
  tuXepLoaiDangVien: 'Hoàn thành xuất sắc nhiệm vụ' | 'Hoàn thành tốt nhiệm vụ' | 'Hoàn thành nhiệm vụ' | 'Không hoàn thành nhiệm vụ';
  giaiTrinhMucXepLoai: string;

  // C. KẾT QUẢ ĐÁNH GIÁ, XẾP LOẠI
  diemToChucDanhGia: string;
  nhanXetNguoiQuanLy: string;
  mucXepLoaiCanBo: string;
  duKienPhanNhom: string;
  nhanXetChiUy: string;
  chiBoDeXuatXepLoai: string;
  dangUyQuyetDinh: string;
}

export const defaultPartySelfReview02AData: PartySelfReview02AData = {
  dangBoCoSo: 'ĐẢNG BỘ TRƯỜNG CAO ĐẲNG BÁCH KHOA NAM SÀI GÒN',
  chiBo: 'Chi bộ 1',
  diaDanh: 'Chánh Hưng',
  ngayKhai: new Date().getDate().toString().padStart(2, '0'),
  thangKhai: (new Date().getMonth() + 1).toString().padStart(2, '0'),
  namKhai: new Date().getFullYear().toString(),
  namKiemDiem: '2026',

  hoVaTen: '',
  namSinh: '',
  chucVuDang: 'Bí thư Chi bộ',
  chucVuChinhQuyen: 'Trưởng Khoa',
  chucVuDoanThe: 'Đoàn viên công đoàn',
  donViCongTac: 'Khoa Công nghệ thông tin',
  chiBoSinhHoat: 'Chi bộ 1',

  uuDiemPhamChatChinhTri: `1. Luôn kiên định chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh và đường lối đổi mới của Đảng; chấp hành nghiêm Cương lĩnh chính trị, Điều lệ Đảng, các nghị quyết, chỉ thị của Đảng, chính sách, pháp luật của Nhà nước.
2. Giữ gìn phẩm chất đạo đức cách mạng trong sáng, lối sống giản dị, lành mạnh, khiêm tốn; gương mẫu thực hiện Quy định về những điều đảng viên không được làm. Kiên quyết ngăn chặn, đẩy lùi các biểu hiện suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hoá".
3. Tôn trọng và giữ gìn sự đoàn kết thống nhất trong nội bộ Chi bộ và tập thể đơn vị; thực hiện nghiêm nguyên tắc tập trung dân chủ, tự phê bình và phê bình. Tác phong công tác sâu sát, dân chủ, đúng giờ và khoa học.`,

  uuDiemThucHienNhiemVu: `1. Nêu cao tinh thần trách nhiệm trong công tác lãnh đạo, quản lý và điều hành Khoa; chỉ đạo triển khai hoàn thành xuất sắc 100% các chỉ tiêu kế hoạch năm 2026 của Nhà trường giao đúng tiến độ, chất lượng cao.
2. Tích cực tham gia trực tiếp giảng dạy đạt và vượt định mức giờ chuẩn; tổ chức hiệu quả hoạt động nghiên cứu khoa học, cải tiến chương trình đào tạo tiếp cận chuẩn đầu ra quốc tế và chuyển đổi số bài giảng LMS.
3. Giải quyết công việc linh hoạt, quyết đoán trên cơ sở quy chế cơ quan và lợi ích chung của tập thể cán bộ, viên chức và người học.`,

  uuDiemCamKetTuDuong: `Thực hiện nghiêm túc và trọn vẹn các nội dung đã cam kết trong Bản cam kết tu dưỡng, rèn luyện, phấn đấu năm 2026; giữ mối liên hệ mật thiết với chi ủy nơi cư trú và gương mẫu thực hiện nghĩa vụ công dân nơi cư trú theo Quy định 213-QĐ/TW.`,

  uuDiemCongTacLanhDao: `1. Chủ động cùng Chi ủy và Ban Chủ nhiệm Khoa xây dựng kế hoạch công tác cụ thể theo từng tháng, quý; phân công nhiệm vụ rõ người, rõ việc, rõ thời gian và sản phẩm đầu ra.
2. Lãnh đạo xây dựng khối đoàn kết nội bộ vững chắc, tạo môi trường làm việc công tâm, minh bạch, khuyến khích giảng viên, chuyên viên phát huy năng lực sở trường.
3. Mức độ hoàn thành nhiệm vụ của tập thể đơn vị Khoa trong năm 2026 đạt danh hiệu Tập thể Lao động Xuất sắc, Chi bộ đạt danh hiệu "Hoàn thành xuất sắc nhiệm vụ".`,

  uuDiemTrachNhiemDoiMoi: `1. Thể hiện tinh thần năng động, dám nghĩ, dám nói, dám làm, nói đi đôi với làm và dám chịu trách nhiệm vì lợi ích chung.
2. Tiên phong chỉ đạo ứng dụng công nghệ thông tin, trí tuệ nhân tạo (AI) và chuyển đổi số toàn diện vào công tác quản trị, giảng dạy và kiểm tra đánh giá tại đơn vị.
3. Chủ động mở rộng hợp tác với các doanh nghiệp, hiệp hội ngành nghề nhằm nâng cao chất lượng thực tập và cơ hội việc làm cho học sinh, sinh viên.`,

  uuDiemTrachNhiemNeuGuong: `1. Bản thân và gia đình luôn gương mẫu chấp hành tốt chủ trương của Đảng, chính sách pháp luật của Nhà nước và các quy định của địa phương nơi cư trú.
2. Luôn giữ mối quan hệ chuẩn mực, gần gũi, lắng nghe tâm tư, nguyện vọng chính đáng của cán bộ, đảng viên, giảng viên và sinh viên để kịp thời tháo gỡ khó khăn, vướng mắc.
3. Không để xảy ra tình trạng tham nhũng, lãng phí, tiêu cực tại đơn vị thuộc phạm vi quản lý phụ trách; nhận được sự tín nhiệm cao của tập thể.`,

  hanCheKhuyetDiem: `1. Công tác đôn đốc, kiểm tra một số đầu việc chuyên môn và tiến độ nghiên cứu khoa học của giảng viên trẻ có thời điểm chưa thật sự thường xuyên, liên tục.
2. Do khối lượng công tác quản lý điều hành nhiều nên thời gian dành cho việc nghiên cứu chuyên sâu các chuyên đề học thuật mới đôi khi còn hạn hẹp.`,

  nguyenNhanKhachQuan: `Quy mô đào tạo và các nhiệm vụ đột xuất trong năm tăng cao; lịch họp và công tác phối hợp đa bên chiếm nhiều thời gian.`,

  nguyenNhanChuQuan: `Bản thân đôi lúc chưa phân cấp, phân quyền triệt để cho cấp phó và các bộ môn trực thuộc; phương pháp phân bổ quỹ thời gian cá nhân có lúc chưa thật sự tối ưu.`,

  ketQuaKhacPhucNamTruoc: `Đã khắc phục dứt điểm các tồn tại chỉ ra trong đợt kiểm điểm năm 2025: Đã hoàn tất 100% việc số hóa đề thi, ngân hàng câu hỏi và tổ chức thành công 02 hội thảo chuyên môn cấp trường trong năm 2026.`,

  giaiTrinhGoiYKiemDiem: `Bản thân không có nội dung thuộc diện cấp có thẩm quyền gợi ý kiểm điểm.`,

  trachNhiemTapTheCaNhan: `Với cương vị là người đứng đầu đơn vị, bản thân luôn chịu trách nhiệm cao nhất trước Đảng ủy và Ban Giám hiệu về mọi mặt hoạt động của Khoa và Chi bộ; tại đơn vị không có đơn thư khiếu nại, khiếu kiện hay vụ việc vi phạm kỷ luật.`,

  phuongHuongKhacPhuc: `1. Tăng cường phân quyền và phát huy vai trò chủ động của các Phó Trưởng khoa và Trưởng bộ môn trong công tác đôn đốc chuyên môn thường nhật.
2. Ứng dụng dashboard điều hành số để theo dõi tiến độ các chỉ tiêu KPI tự động, giảm tải thời gian họp báo cáo trực tiếp.
3. Tiếp tục duy trì phong cách lãnh đạo dân chủ, gần gũi, nêu gương và xây dựng Chi bộ, Khoa ngày càng phát triển vững mạnh toàn diện.`,

  kpiRows: [
    {
      content: 'Điểm tiêu chí chung',
      q1: '28.5',
      q2: '29',
      q3: '29',
      q4: '29.5',
      year: '29',
      confirmed: 'Đúng'
    },
    {
      content: 'Điểm tiêu chí về kết quả thực hiện nhiệm vụ',
      q1: '67',
      q2: '68',
      q3: '68',
      q4: '68.5',
      year: '67.9',
      confirmed: 'Đúng'
    },
    {
      content: 'Tổng điểm KPI',
      q1: '95.5',
      q2: '97',
      q3: '97',
      q4: '98',
      year: '96.9',
      confirmed: 'Đúng'
    },
    {
      content: 'Mức xếp loại quý',
      q1: 'HTXSNV',
      q2: 'HTXSNV',
      q3: 'HTXSNV',
      q4: 'HTXSNV',
      year: 'HTXSNV',
      confirmed: 'Đúng'
    }
  ],
  diemTieuChiChung: 29,
  diemThucHienNhiemVu: 68,
  tongDiemTuCham: 97,

  tuXepLoaiDangVien: 'Hoàn thành xuất sắc nhiệm vụ',
  giaiTrinhMucXepLoai: '',

  diemToChucDanhGia: '',
  nhanXetNguoiQuanLy: '',
  mucXepLoaiCanBo: 'Hoàn thành xuất sắc nhiệm vụ',
  duKienPhanNhom: 'Cán bộ lãnh đạo, quản lý hoàn thành xuất sắc nhiệm vụ',
  nhanXetChiUy: '',
  chiBoDeXuatXepLoai: 'Hoàn thành xuất sắc nhiệm vụ',
  dangUyQuyetDinh: ''
};

export function exportPartySelfReview02ADocx(data: PartySelfReview02AData) {
  const hoTenInHoa = (data.hoVaTen || '...........................................').toUpperCase();
  const tongDiem = (data.diemTieuChiChung || 0) + (data.diemThucHienNhiemVu || 0);

  const htmlDoc = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>Mẫu 02A - Bản kiểm điểm cán bộ lãnh đạo - ${hoTenInHoa}</title>
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
        size: 210mm 297mm;
        margin: 20mm 15mm 20mm 20mm;
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
        margin-top: 14px;
        margin-bottom: 16px;
      }
      .title-main {
        font-size: 14pt;
        font-weight: bold;
        text-transform: uppercase;
        margin: 0;
      }
      .title-sub {
        font-size: 13pt;
        font-weight: bold;
        margin: 3px 0;
      }
      .title-desc {
        font-size: 12pt;
        font-style: italic;
        margin: 2px 0 0 0;
      }
      .info-table {
        width: 100%;
        border: none;
        margin: 8px 0 12px 0;
      }
      .info-table td {
        border: none;
        padding: 3px 2px;
        font-size: 13pt;
      }
      .content-p {
        margin: 5px 0;
        text-align: justify;
      }
      .section-heading {
        font-weight: bold;
        font-size: 13.5pt;
        margin-top: 14px;
        margin-bottom: 6px;
        text-transform: uppercase;
      }
      .sub-heading {
        font-weight: bold;
        font-size: 13pt;
        margin-top: 8px;
        margin-bottom: 4px;
      }
      .indent-p {
        margin: 4px 0 6px 0;
        padding-left: 20px;
        text-align: justify;
        white-space: pre-line;
      }
      .kpi-table {
        width: 100%;
        border: 1px solid #000;
        margin: 10px 0;
      }
      .kpi-table th, .kpi-table td {
        border: 1px solid #000;
        padding: 5px;
        font-size: 12pt;
        text-align: center;
      }
      .kpi-table td:first-child {
        text-align: left;
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
        font-size: 12.5pt;
        text-transform: uppercase;
      }
      .sign-sub {
        font-style: italic;
        font-size: 11pt;
      }
      .sign-space {
        height: 65px;
      }
      .sign-name {
        font-weight: bold;
        font-size: 12.5pt;
      }
    </style>
  </head>
  <body>
    <!-- HEADER 2 CỘT -->
    <table class="table-header">
      <tr>
        <td style="width: 50%; text-align: center;">
          <div style="font-size: 12pt; font-weight: bold;">${data.dangBoCoSo || 'ĐẢNG BỘ TRƯỜNG CAO ĐẲNG<br>BÁCH KHOA NAM SÀI GÒN'}</div>
          <div style="font-size: 12pt; font-weight: bold; margin-top: 2px;">CHI BỘ: ${data.chiBo || '………..'}</div>
          <div style="width: 100px; height: 1px; background: #000; margin: 4px auto;"></div>
        </td>
        <td style="width: 50%; text-align: center;">
          <div style="font-size: 11pt; font-weight: bold; text-align: right; margin-bottom: 4px;">MẪU 02A-HD KĐ.ĐG 2026</div>
          <div style="font-size: 12.5pt; font-weight: bold;">ĐẢNG CỘNG SẢN VIỆT NAM</div>
          <div style="font-size: 11.5pt; font-style: italic; margin-top: 4px;">
            ${data.diaDanh || 'Chánh Hưng'}, ngày ${data.ngayKhai || '…'} tháng ${data.thangKhai || '…'} năm ${data.namKhai || '2026'}
          </div>
        </td>
      </tr>
    </table>

    <!-- TIÊU ĐỀ BẢN KIỂM ĐIỂM -->
    <div class="title-box">
      <h1 class="title-main">BẢN KIỂM ĐIỂM TỰ ĐÁNH GIÁ, XẾP LOẠI CÁ NHÂN</h1>
      <div class="title-sub">Năm ${data.namKiemDiem || '2026'}</div>
      <div class="title-desc">(Cá nhân giữ chức vụ lãnh đạo, quản lý)</div>
    </div>

    <!-- BẢNG THÔNG TIN CÁ NHÂN THEO FILE WORD GỐC -->
    <table class="info-table">
      <tr>
        <td style="width: 60%;">Họ và tên: <strong style="text-transform: uppercase;">${hoTenInHoa}</strong></td>
        <td style="width: 40%;">Ngày sinh: ${data.namSinh || '......................................'}</td>
      </tr>
      <tr>
        <td colspan="2">Chức vụ Đảng: ${data.chucVuDang || '.................................................................................................'}</td>
      </tr>
      <tr>
        <td colspan="2">Chức vụ chính quyền: ${data.chucVuChinhQuyen || '..................................................................................................'}</td>
      </tr>
      <tr>
        <td colspan="2">Chức vụ đoàn thể: ${data.chucVuDoanThe || '..................................................................................................'}</td>
      </tr>
      <tr>
        <td>Đơn vị công tác: ${data.donViCongTac || '..................................................'}</td>
        <td>Chi bộ: ${data.chiBoSinhHoat || data.chiBo || '.............................................'}</td>
      </tr>
    </table>

    <!-- A. NỘI DUNG KIỂM ĐIỂM -->
    <div class="section-heading">A. NỘI DUNG KIỂM ĐIỂM</div>

    <!-- I. ƯU ĐIỂM -->
    <div class="sub-heading">I. Ưu điểm, kết quả đạt được</div>
    <div class="content-p"><strong>1. Về phẩm chất chính trị, đạo đức, lối sống; tinh thần đoàn kết, thống nhất trong nội bộ; ý thức tổ chức kỷ luật, việc thực hiện những điều đảng viên không được làm; tác phong, lề lối làm việc:</strong></div>
    <div class="indent-p">${data.uuDiemPhamChatChinhTri || '...'}</div>

    <div class="content-p"><strong>2. Việc thực hiện nhiệm vụ, quyền hạn và kết quả thực hiện các chỉ tiêu, nhiệm vụ được giao trong năm, gắn với hiệu quả, tiến độ, chất lượng công việc:</strong></div>
    <div class="indent-p">${data.uuDiemThucHienNhiemVu || '...'}</div>

    <div class="content-p"><strong>3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu của cá nhân theo quy định:</strong></div>
    <div class="indent-p">${data.uuDiemCamKetTuDuong || '...'}</div>

    <div class="content-p"><strong>4. Kết quả công tác lãnh đạo, chỉ đạo, quản lý, điều hành; thực hiện chức trách, nhiệm vụ; mức độ hoàn thành nhiệm vụ của các cấp ủy, tổ chức đảng trực thuộc, địa phương, tổ chức, cơ quan, đơn vị thuộc quyền quản lý; khả năng quy tụ, xây dựng đoàn kết nội bộ:</strong></div>
    <div class="indent-p">${data.uuDiemCongTacLanhDao || '...'}</div>

    <div class="content-p"><strong>5. Trách nhiệm trong công việc; tinh thần năng động, đổi mới sáng tạo, dám nghĩ, dám nói, dám làm, nói đi đôi với làm, dám chịu trách nhiệm, dám đương đầu với khó khăn, thử thách, dám hành động, dám hy sinh lợi ích cá nhân vì lợi ích chung; trách nhiệm trong xây dựng đội ngũ cán bộ, kiểm soát quyền lực, phòng, chống tiêu cực trong phạm vi chức trách, nhiệm vụ được giao; trách nhiệm trong lãnh đạo, chỉ đạo hoàn thiện thể chế góp phần phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số, về mở rộng hợp tác, hội nhập quốc tế, về đổi mới tư duy quản trị, tạo điều kiện phát triển kinh tế tư nhân; xử lý những vấn đề khó, phức tạp, nhạy cảm trong thực hiện nhiệm vụ:</strong></div>
    <div class="indent-p">${data.uuDiemTrachNhiemDoiMoi || '...'}</div>

    <div class="content-p"><strong>6. Trách nhiệm nêu gương của bản thân và gia đình; việc đấu tranh phòng, chống tham nhũng, tiêu cực, lãng phí và ngăn chặn, đẩy lùi những biểu hiện suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hoá"; sự tín nhiệm của cán bộ, đảng viên; việc học tập, thực hành tư tưởng, đạo đức, phương pháp, phong cách Hồ Chí Minh; việc nghiên cứu, học tập và triển khai nghị quyết; việc xây dựng phong cách lãnh đạo đổi mới, gần dân, sát dân, trọng dân, thường xuyên nắm bắt tâm tư, nguyện vọng của Nhân dân:</strong></div>
    <div class="indent-p">${data.uuDiemTrachNhiemNeuGuong || '...'}</div>

    <!-- II. HẠN CHẾ -->
    <div class="sub-heading">II. Hạn chế, khuyết điểm và nguyên nhân</div>
    <div class="content-p"><strong>1. Hạn chế, khuyết điểm</strong> (nêu đúng trọng tâm, gắn với tiêu chí chưa đáp ứng hoặc nhiệm vụ chưa hoàn thành):</div>
    <div class="indent-p">${data.hanCheKhuyetDiem || '...'}</div>

    <div class="content-p"><strong>2. Nguyên nhân</strong> (phân định rõ nguyên nhân chủ quan, khách quan; không dùng nguyên nhân khách quan để thay thế trách nhiệm cá nhân):</div>
    <div class="indent-p">
      <em>- Nguyên nhân khách quan:</em> ${data.nguyenNhanKhachQuan || '...'}<br>
      <em>- Nguyên nhân chủ quan:</em> ${data.nguyenNhanChuQuan || '...'}
    </div>

    <!-- III. KHẮC PHỤC -->
    <div class="sub-heading">III. Kết quả khắc phục những hạn chế, khuyết điểm đã được kết luận hoặc chỉ ra ở các kỳ kiểm điểm trước</div>
    <div class="content-p" style="font-style: italic; font-size: 11.5pt;">(Kiểm điểm rõ từng hạn chế, khuyết điểm (đã được khắc phục; đang khắc phục, mức độ khắc phục; chưa được khắc phục); những khó khăn, vướng mắc (nếu có); trách nhiệm của cá nhân):</div>
    <div class="indent-p">${data.ketQuaKhacPhucNamTruoc || 'Không có.'}</div>

    <!-- IV. GIẢI TRÌNH -->
    <div class="sub-heading">IV. Giải trình những vấn đề được gợi ý kiểm điểm nếu có</div>
    <div class="content-p" style="font-style: italic; font-size: 11.5pt;">(Giải trình từng vấn đề được gợi ý kiểm điểm, nêu nguyên nhân, xác định trách nhiệm của cá nhân đối với từng vấn đề được gợi ý kiểm điểm):</div>
    <div class="indent-p">${data.giaiTrinhGoiYKiemDiem || 'Không có.'}</div>

    <!-- V. TRÁCH NHIỆM TẬP THỂ -->
    <div class="sub-heading">V. Trách nhiệm của tập thể, cá nhân</div>
    <div class="content-p" style="font-style: italic; font-size: 11.5pt;">(Làm rõ trách nhiệm lãnh đạo, chỉ đạo, quản lý, điều hành; trách nhiệm đối với lĩnh vực, cơ quan, đơn vị hoặc cá nhân thuộc quyền quản lý. Kiểm điểm các vấn đề bức xúc, phức tạp, đơn thư, mất đoàn kết, vi phạm, trì trệ hoặc không hoàn thành nhiệm vụ nếu có):</div>
    <div class="indent-p">${data.trachNhiemTapTheCaNhan || 'Không có.'}</div>

    <!-- VI. PHƯƠNG HƯỚNG -->
    <div class="sub-heading">VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm</div>
    <div class="content-p" style="font-style: italic; font-size: 11.5pt;">(Mỗi hạn chế phải gắn với một biện pháp, sản phẩm hoặc kết quả cần đạt, thời hạn hoàn thành và trách nhiệm thực hiện; bảo đảm có thể theo dõi, kiểm tra trong kỳ tiếp theo):</div>
    <div class="indent-p">${data.phuongHuongKhacPhuc || '...'}</div>

    <!-- B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI -->
    <div class="section-heading">B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI</div>
    <div class="sub-heading">I. Kết quả thực hiện nhiệm vụ được giao</div>
    <div class="content-p" style="font-style: italic;">
      Hệ thống tổng hợp từ danh mục nhiệm vụ, kết quả các quý và minh chứng đã được phê duyệt. Cá nhân kiểm tra, xác nhận; trường hợp có sai lệch thì giải trình ngắn gọn và đề nghị điều chỉnh theo thẩm quyền.
    </div>

    <!-- BẢNG KPI CÁC QUÝ -->
    <table class="kpi-table">
      <thead>
        <tr style="background: #f2f2f2; font-weight: bold;">
          <th style="width: 32%;">Nội dung</th>
          <th style="width: 10%;">Quý I</th>
          <th style="width: 10%;">Quý II</th>
          <th style="width: 10%;">Quý III</th>
          <th style="width: 10%;">Quý IV</th>
          <th style="width: 12%;">Cả năm</th>
          <th style="width: 16%;">Cá nhân xác nhận</th>
        </tr>
      </thead>
      <tbody>
        ${(data.kpiRows || defaultPartySelfReview02AData.kpiRows).map(row => `
          <tr>
            <td>${row.content}</td>
            <td>${row.q1}</td>
            <td>${row.q2}</td>
            <td>${row.q3}</td>
            <td>${row.q4}</td>
            <td><strong>${row.year}</strong></td>
            <td>${row.confirmed === 'Đúng' ? '☑ Đúng  ☐ Có sai lệch' : '☐ Đúng  ☑ Có sai lệch'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="content-p" style="font-style: italic; font-size: 11pt;">
      Gửi kèm bảng chấm điểm và minh chứng sản phẩm cụ thể. Kết quả KPI là căn cứ hỗ trợ đánh giá, không thay thế việc thảo luận, nhận xét và quyết định của cấp có thẩm quyền.
    </div>

    <div class="content-p" style="margin-top: 8px;"><strong>Tổng điểm đánh giá:</strong></div>
    <div class="content-p" style="padding-left: 20px;">
      1. Nhóm tiêu chí chung: <strong>${data.diemTieuChiChung ?? 30}/30</strong><br>
      2. Nhóm tiêu chí về kết quả thực hiện nhiệm vụ: <strong>${data.diemThucHienNhiemVu ?? 70}/70</strong><br>
      <strong>Tổng điểm: ${tongDiem ?? 100}/100</strong>
    </div>

    <!-- II. TỰ ĐỀ XUẤT XẾP LOẠI MỨC CHẤT LƯỢNG -->
    <div class="sub-heading">II. Tự đề xuất xếp loại mức chất lượng</div>
    <div class="content-p" style="padding-left: 20px;">
      <div>${data.tuXepLoaiDangVien === 'Hoàn thành xuất sắc nhiệm vụ' ? '☑' : '☐'} Hoàn thành xuất sắc nhiệm vụ</div>
      <div>${data.tuXepLoaiDangVien === 'Hoàn thành tốt nhiệm vụ' ? '☑' : '☐'} Hoàn thành tốt nhiệm vụ</div>
      <div>${data.tuXepLoaiDangVien === 'Hoàn thành nhiệm vụ' ? '☑' : '☐'} Hoàn thành nhiệm vụ</div>
      <div>${data.tuXepLoaiDangVien === 'Không hoàn thành nhiệm vụ' ? '☑' : '☐'} Không hoàn thành nhiệm vụ</div>
    </div>

    <div class="content-p" style="font-style: italic; font-size: 11pt; margin-top: 5px;">
      Chỉ đánh dấu 01 mức. Nếu mức tự đề xuất khác đáng kể so với diễn biến kết quả các quý hoặc dữ liệu KPI, cá nhân phải giải trình ngắn gọn: ${data.giaiTrinhMucXepLoai ? `<strong>${data.giaiTrinhMucXepLoai}</strong>` : '....................................................................'}
    </div>
    <div class="content-p" style="font-style: italic; font-size: 11pt;">
      Gửi kèm Phụ lục về kết quả thực hiện nhiệm vụ trong đó thể hiện sản phẩm, tiến độ, chất lượng cụ thể (theo Mẫu 05).
    </div>

    <!-- CHỮ KÝ NGƯỜI TỰ KIỂM ĐIỂM -->
    <table class="signature-table">
      <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%;">
          <div class="sign-title">NGƯỜI TỰ KIỂM ĐIỂM</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
          <div class="sign-name">${hoTenInHoa}</div>
        </td>
      </tr>
    </table>

    <div style="page-break-before: always;"></div>

    <!-- C. KẾT QUẢ ĐÁNH GIÁ, XẾP LOẠI -->
    <div class="section-heading">C. KẾT QUẢ ĐÁNH GIÁ, XẾP LOẠI</div>

    <div class="sub-heading">I. Đánh giá, xếp loại chất lượng cán bộ, công chức, viên chức</div>
    <div class="content-p">- Tổng điểm: ${data.diemToChucDanhGia || '……'}/100 điểm.</div>
    <div class="content-p">- Nhận xét, đánh giá của người quản lý, sử dụng cán bộ, công chức, viên chức: ${data.nhanXetNguoiQuanLy || '……………………………………………………………………………………………..'}</div>
    <div class="content-p">- Mức xếp loại chất lượng: <strong>${data.mucXepLoaiCanBo || '……………………………'}</strong></div>
    <div class="content-p">- Dự kiến phân nhóm cán bộ: <strong>${data.duKienPhanNhom || '……………………………'}</strong></div>

    <!-- CHỮ KÝ THỦ TRƯỞNG CƠ QUAN -->
    <table class="signature-table" style="margin-top: 15px;">
      <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%;">
          <div class="sign-title">THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ</div>
          <div class="sign-sub">(Xác lập thời điểm, ký, ghi rõ họ tên và đóng dấu)</div>
          <div class="sign-space"></div>
          <div class="sign-name">...................................................</div>
        </td>
      </tr>
    </table>

    <div class="sub-heading" style="margin-top: 20px;">II. Đánh giá, xếp loại chất lượng đảng viên</div>
    <div class="content-p" style="font-style: italic; font-size: 11pt;">
      Phần này chỉ thực hiện đối với cá nhân là đảng viên; cá nhân không là đảng viên không phải kê khai và không xem là thiếu hồ sơ.
    </div>
    <div class="content-p">- Nhận xét, đánh giá của chi ủy: ${data.nhanXetChiUy || '………………………………………………'}</div>
    <div class="content-p">- Chi bộ đề xuất mức xếp loại chất lượng: <strong>${data.chiBoDeXuatXepLoai || '……………………………………'}</strong></div>

    <!-- CHỮ KÝ CHI BỘ -->
    <table class="signature-table" style="margin-top: 15px;">
      <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%;">
          <div class="sign-title">T/M CHI ỦY (CHI BỘ)</div>
          <div class="sign-sub">(Xác lập thời điểm, ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
          <div class="sign-name">...................................................</div>
        </td>
      </tr>
    </table>

    <div class="content-p" style="margin-top: 18px;">
      - Đảng ủy trực thuộc cơ sở/Ban Thường vụ đảng ủy cơ sở hoặc đảng ủy cơ sở nơi không có ban thường vụ quyết định mức xếp loại chất lượng: ${data.dangUyQuyetDinh || '……………………………………………………………………………………………..'}
    </div>

    <!-- CHỮ KÝ BAN THƯỜNG VỤ ĐẢNG ỦY -->
    <table class="signature-table" style="margin-top: 15px;">
      <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%;">
          <div class="sign-title">T/M BAN THƯỜNG VỤ (ĐẢNG ỦY)</div>
          <div class="sign-sub">(Xác lập thời điểm, ký, ghi rõ họ tên và đóng dấu)</div>
          <div class="sign-space"></div>
          <div class="sign-name">...................................................</div>
        </td>
      </tr>
    </table>

  </body>
  </html>
  `;

  const blob = new Blob(['\ufeff' + htmlDoc], {
    type: 'application/msword;charset=utf-8'
  });

  const fileName = `Mau_02A_Kiem_Diem_Can_Bo_Lanh_Dao_${(data.hoVaTen || 'Can_Bo').replace(/\s+/g, '_')}_${data.namKiemDiem || '2026'}.doc`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface QuarterlyKpiRow {
  content: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  year: string;
  confirmed: 'Đúng' | 'Có sai lệch';
}

export interface PartySelfReview02BData {
  // Cấp ủy & Tiêu đề
  dangBoCoSo: string;         // ĐẢNG BỘ TRƯỜNG CAO ĐẲNG BÁCH KHOA NAM SÀI GÒN
  chiBo: string;              // Chi bộ trực thuộc (vd: Chi bộ 1)
  diaDanh: string;            // Chánh Hưng (theo mẫu) hoặc Thành phố Hồ Chí Minh
  ngayKhai: string;
  thangKhai: string;
  namKhai: string;
  namKiemDiem: string;        // 2026

  // Thông tin cá nhân
  hoVaTen: string;            // Họ và tên
  namSinh: string;            // Ngày, tháng, năm sinh
  donViCongTac: string;       // Đơn vị công tác
  chiBoSinhHoat: string;      // Chi bộ

  // A. NỘI DUNG KIỂM ĐIỂM
  // I. Ưu điểm, kết quả đạt được
  // 1. Về phẩm chất chính trị, đạo đức, lối sống; tinh thần đoàn kết, thống nhất trong nội bộ; ý thức tổ chức kỷ luật, trách nhiệm nêu gương, việc thực hiện những điều đảng viên không được làm; tác phong, lề lối làm việc...
  uuDiemPhamChatChinhTri: string;
  // 2. Việc thực hiện nhiệm vụ, quyền hạn và kết quả thực hiện các chỉ tiêu, nhiệm vụ được giao trong năm...
  uuDiemThucHienNhiemVu: string;
  // 3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu của cá nhân theo quy định
  uuDiemCamKetTuDuong: string;

  // II. Hạn chế, khuyết điểm và nguyên nhân
  // 1. Hạn chế, khuyết điểm
  hanCheKhuyetDiem: string;
  // 2. Nguyên nhân của hạn chế, khuyết điểm
  nguyenNhanKhachQuan: string;
  nguyenNhanChuQuan: string;

  // III. Kết quả khắc phục những hạn chế, khuyết điểm đã được cấp có thẩm quyền kết luận hoặc được chỉ ra ở các kỳ kiểm điểm trước
  ketQuaKhacPhucNamTruoc: string;

  // IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)
  giaiTrinhGoiYKiemDiem: string;

  // V. Làm rõ trách nhiệm của cá nhân đối với những hạn chế, khuyết điểm của tập thể (nếu có)
  trachNhiemTapThe: string;

  // VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm
  phuongHuongKhacPhuc: string;

  // B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI
  // I. Kết quả thực hiện nhiệm vụ được giao (Bảng KPI các quý)
  kpiRows: QuarterlyKpiRow[];
  diemTieuChiChung: number;          // Tối đa 30 điểm
  diemThucHienNhiemVu: number;        // Tối đa 70 điểm
  tongDiemTuCham: number;             // Tối đa 100 điểm

  // II. Đề xuất xếp loại mức chất lượng
  tuXepLoaiDangVien: 'Hoàn thành xuất sắc nhiệm vụ' | 'Hoàn thành tốt nhiệm vụ' | 'Hoàn thành nhiệm vụ' | 'Không hoàn thành nhiệm vụ';
  giaiTrinhMucXepLoai: string;       // Giải trình ngắn gọn nếu mức tự đề xuất khác đáng kể

  // C. KẾT QUẢ ĐÁNH GIÁ, XẾP LOẠI (Dành cho tổ chức, lưu thông tin nếu cần)
  diemToChucDanhGia: string;
  nhanXetThuTruong: string;
  mucXepLoaiVienChuc: string;
  nhanXetChiUy: string;
  chiBoDeXuatXepLoai: string;
  dangUyQuyetDinh: string;
}

export const defaultPartySelfReview02BData: PartySelfReview02BData = {
  dangBoCoSo: 'ĐẢNG BỘ TRƯỜNG CAO ĐẲNG BÁCH KHOA NAM SÀI GÒN',
  chiBo: 'Chi bộ 1',
  diaDanh: 'Chánh Hưng',
  ngayKhai: new Date().getDate().toString().padStart(2, '0'),
  thangKhai: (new Date().getMonth() + 1).toString().padStart(2, '0'),
  namKhai: new Date().getFullYear().toString(),
  namKiemDiem: '2026',

  hoVaTen: '',
  namSinh: '',
  donViCongTac: 'Trường Cao đẳng Bách khoa Nam Sài Gòn',
  chiBoSinhHoat: 'Chi bộ 1',

  uuDiemPhamChatChinhTri: `1. Về phẩm chất chính trị, tư tưởng: Bản thân luôn kiên định chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh, đường lối đổi mới của Đảng; chấp hành nghiêm Cương lĩnh chính trị, Điều lệ Đảng, các nghị quyết, chỉ thị của Đảng, chính sách, pháp luật của Nhà nước. Nghiêm túc tham gia đầy đủ các đợt học tập, nghiên cứu và quán triệt nghị quyết.
2. Về đạo đức, lối sống, tác phong, lề lối làm việc: Giữ gìn phẩm chất đạo đức trong sáng, lối sống giản dị, khiêm tốn; thực hiện nghiêm Quy định về những điều đảng viên không được làm và trách nhiệm nêu gương. Kiên quyết phòng, chống tham nhũng, lãng phí, tiêu cực và ngăn chặn những biểu hiện suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hoá".
3. Về tinh thần đoàn kết, ý thức tổ chức kỷ luật: Có tinh thần đoàn kết, thống nhất nội bộ; phục tùng tuyệt đối sự phân công, điều động của tổ chức và lãnh đạo; chấp hành nghiêm quy chế làm việc, sinh hoạt chi bộ định kỳ đầy đủ, đúng giờ và đóng đảng phí đúng quy định.`,

  uuDiemThucHienNhiemVu: `1. Luôn nêu cao tinh thần trách nhiệm trong công việc chuyên môn, bám sát kế hoạch năm học 2026 của Nhà trường, chủ động hoàn thành 100% định mức giờ giảng và chỉ tiêu nhiệm vụ được giao đảm bảo tiến độ, chất lượng và hiệu quả cao.
2. Tích cực đổi mới phương pháp giảng dạy, ứng dụng mạnh mẽ công nghệ thông tin, bài giảng điện tử tương tác và chuyển đổi số trong quản lý, dạy học.
3. Tham gia đầy đủ, nhiệt tình các hoạt động phong trào, nghiên cứu khoa học, hoạt động chuyên môn của Khoa và Nhà trường.`,

  uuDiemCamKetTuDuong: `Thực hiện nghiêm túc, đầy đủ các nội dung trong Bản cam kết tu dưỡng, rèn luyện, phấn đấu năm 2026 đã đăng ký với Chi bộ; giữ mối liên hệ chặt chẽ với chi ủy nơi cư trú và gương mẫu thực hiện nghĩa vụ công dân nơi cư trú theo Quy định số 213-QĐ/TW.`,

  hanCheKhuyetDiem: `1. Tinh thần tham gia đóng góp thảo luận, phát biểu ý kiến xây dựng trong một số buổi sinh hoạt chi bộ định kỳ đôi lúc còn rụt rè, chưa phát huy tối đa tinh thần phản biện.
2. Việc sắp xếp thời gian tự học tập, nghiên cứu sâu một số văn bản chính sách chuyên ngành mới đôi khi chưa thật sự khoa học do khối lượng công việc chuyên môn dồn dập vào các đợt cao điểm.`,

  nguyenNhanKhachQuan: `Lịch công tác giảng dạy, chấm thi và các hoạt động chuyên môn kiêm nhiệm trong năm nhiều và liên tục.`,

  nguyenNhanChuQuan: `Bản thân chưa thật sự linh hoạt, phân bổ thời gian hợp lý; còn tâm lý e ngại, chưa mạnh dạn bày tỏ chính kiến trong sinh hoạt tập thể.`,

  ketQuaKhacPhucNamTruoc: `Đã khắc phục hoàn toàn những hạn chế đã chỉ ra ở kỳ kiểm điểm năm trước: Đã chủ động số hóa 100% giáo án, tham gia đầy đủ các buổi sinh hoạt chuyên đề và hoàn thành vượt định mức giờ chuẩn được giao.`,

  giaiTrinhGoiYKiemDiem: `Bản thân không có vấn đề nào thuộc diện cấp có thẩm quyền gợi ý kiểm điểm.`,

  trachNhiemTapThe: `Bản thân luôn nghiêm túc phối hợp, đóng góp xây dựng tập thể Khoa và Chi bộ; không có sai sót hay vi phạm gây ảnh hưởng đến kết quả chung của tập thể.`,

  phuongHuongKhacPhuc: `1. Tích cực, mạnh dạn hơn nữa trong việc phát biểu, đóng góp ý kiến xây dựng Nghị quyết Chi bộ và nâng cao chất lượng sinh hoạt chi bộ.
2. Tiếp tục khoa học hóa kế hoạch làm việc, tăng cường tự bồi dưỡng nâng cao trình độ lý luận chính trị và chuyên môn nghiệp vụ sư phạm.
3. Luôn giữ vững tính tiền phong, gương mẫu của người đảng viên trong mọi hoạt động tại đơn vị.`,

  kpiRows: [
    {
      content: 'Điểm tiêu chí chung',
      q1: '28',
      q2: '29',
      q3: '28.5',
      q4: '29',
      year: '28.6',
      confirmed: 'Đúng'
    },
    {
      content: 'Điểm tiêu chí về kết quả thực hiện nhiệm vụ',
      q1: '66',
      q2: '67',
      q3: '68',
      q4: '68',
      year: '67.25',
      confirmed: 'Đúng'
    },
    {
      content: 'Tổng điểm KPI',
      q1: '94',
      q2: '96',
      q3: '96.5',
      q4: '97',
      year: '95.85',
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
  diemThucHienNhiemVu: 67,
  tongDiemTuCham: 96,

  tuXepLoaiDangVien: 'Hoàn thành tốt nhiệm vụ',
  giaiTrinhMucXepLoai: '',

  diemToChucDanhGia: '',
  nhanXetThuTruong: '',
  mucXepLoaiVienChuc: 'Hoàn thành tốt nhiệm vụ',
  nhanXetChiUy: '',
  chiBoDeXuatXepLoai: 'Hoàn thành tốt nhiệm vụ',
  dangUyQuyetDinh: ''
};

export function exportPartySelfReview02BDocx(data: PartySelfReview02BData) {
  const hoTenInHoa = (data.hoVaTen || '...........................................').toUpperCase();
  const tongDiem = (data.diemTieuChiChung || 0) + (data.diemThucHienNhiemVu || 0);

  const htmlDoc = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>Mẫu 02B - Bản kiểm điểm Đảng viên - ${hoTenInHoa}</title>
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
        size: 210mm 297mm; /* A4 */
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
    <!-- HEADER 2 CỘT CHUẨN THỂ THỨC -->
    <table class="table-header">
      <tr>
        <td style="width: 50%; text-align: center;">
          <div style="font-size: 12pt; font-weight: bold;">${data.dangBoCoSo || 'ĐẢNG BỘ TRƯỜNG CAO ĐẲNG<br>BÁCH KHOA NAM SÀI GÒN'}</div>
          <div style="font-size: 12pt; font-weight: bold; margin-top: 2px;">CHI BỘ: ${data.chiBo || '………..'}</div>
          <div style="width: 100px; height: 1px; background: #000; margin: 4px auto;"></div>
        </td>
        <td style="width: 50%; text-align: center;">
          <div style="font-size: 11pt; font-weight: bold; text-align: right; margin-bottom: 4px;">Mẫu 02B-HD KĐ.ĐG 2026</div>
          <div style="font-size: 12.5pt; font-weight: bold;">ĐẢNG CỘNG SẢN VIỆT NAM</div>
          <div style="font-size: 11.5pt; font-style: italic; margin-top: 4px;">
            ${data.diaDanh || 'Chánh Hưng'}, ngày ${data.ngayKhai || '…'} tháng ${data.thangKhai || '…'} năm ${data.namKhai || '2026'}
          </div>
        </td>
      </tr>
    </table>

    <!-- TIÊU ĐỀ BẢN KIỂM ĐIỂM -->
    <div class="title-box">
      <h1 class="title-main">BẢN KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CỦA CÁ NHÂN</h1>
      <div class="title-sub">Năm ${data.namKiemDiem || '2026'}</div>
      <div class="title-desc">(Cá nhân không giữ chức vụ lãnh đạo, quản lý)</div>
    </div>

    <!-- THÔNG TIN ĐẢNG VIÊN -->
    <div class="content-p">
      Họ và tên: <strong style="text-transform: uppercase;">${hoTenInHoa}</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Ngày sinh: ${data.namSinh || '…………………….'}
    </div>
    <div class="content-p">
      Đơn vị công tác: ${data.donViCongTac || '……………………'} &nbsp;&nbsp;&nbsp;&nbsp; Chi bộ: ${data.chiBoSinhHoat || data.chiBo || '……………………'}
    </div>

    <!-- A. NỘI DUNG KIỂM ĐIỂM -->
    <div class="section-heading">A. NỘI DUNG KIỂM ĐIỂM</div>

    <!-- I. ƯU ĐIỂM -->
    <div class="sub-heading">I. Ưu điểm, kết quả đạt được</div>
    <div class="content-p"><strong>1. Về phẩm chất chính trị, đạo đức, lối sống; tinh thần đoàn kết, thống nhất trong nội bộ; ý thức tổ chức kỷ luật, trách nhiệm nêu gương, việc thực hiện những điều đảng viên không được làm; tác phong, lề lối làm việc. việc đấu tranh phòng, chống tham nhũng, tiêu cực, lãng phí và ngăn chặn, đẩy lùi những biểu hiện suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hoá"; việc học tập, thực hành tư tưởng, đạo đức, phương pháp, phong cách Hồ Chí Minh; việc nghiên cứu, học tập và triển khai nghị quyết:</strong></div>
    <div class="indent-p">${data.uuDiemPhamChatChinhTri || '...'}</div>

    <div class="content-p"><strong>2. Việc thực hiện nhiệm vụ, quyền hạn và kết quả thực hiện các chỉ tiêu, nhiệm vụ được giao trong năm, gắn với hiệu quả, tiến độ, chất lượng công việc:</strong></div>
    <div class="indent-p">${data.uuDiemThucHienNhiemVu || '...'}</div>

    <div class="content-p"><strong>3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu của cá nhân theo quy định:</strong></div>
    <div class="indent-p">${data.uuDiemCamKetTuDuong || '...'}</div>

    <!-- II. HẠN CHẾ -->
    <div class="sub-heading">II. Hạn chế, khuyết điểm và nguyên nhân</div>
    <div class="content-p"><strong>1. Hạn chế, khuyết điểm:</strong></div>
    <div class="indent-p">${data.hanCheKhuyetDiem || '...'}</div>

    <div class="content-p"><strong>2. Nguyên nhân của hạn chế, khuyết điểm:</strong></div>
    <div class="indent-p">
      <em>- Nguyên nhân khách quan:</em> ${data.nguyenNhanKhachQuan || '...'}<br>
      <em>- Nguyên nhân chủ quan:</em> ${data.nguyenNhanChuQuan || '...'}
    </div>

    <!-- III. KHẮC PHỤC HẠN CHẾ TRƯỚC -->
    <div class="sub-heading">III. Kết quả khắc phục những hạn chế, khuyết điểm đã được cấp có thẩm quyền kết luận hoặc được chỉ ra ở các kỳ kiểm điểm trước</div>
    <div class="content-p" style="font-style: italic; font-size: 11.5pt;">(Kiểm điểm rõ từng hạn chế, khuyết điểm (đã được khắc phục; đang khắc phục, mức độ khắc phục; chưa được khắc phục); những khó khăn, vướng mắc (nếu có); trách nhiệm của cá nhân):</div>
    <div class="indent-p">${data.ketQuaKhacPhucNamTruoc || 'Không có.'}</div>

    <!-- IV. GIẢI TRÌNH GỢI Ý -->
    <div class="sub-heading">IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)</div>
    <div class="content-p" style="font-style: italic; font-size: 11.5pt;">(Giải trình từng vấn đề được gợi ý kiểm điểm, nêu nguyên nhân, xác định trách nhiệm của cá nhân đối với từng vấn đề được gợi ý kiểm điểm):</div>
    <div class="indent-p">${data.giaiTrinhGoiYKiemDiem || 'Không có.'}</div>

    <!-- V. TRÁCH NHIỆM TẬP THỂ -->
    <div class="sub-heading">V. Làm rõ trách nhiệm của cá nhân đối với những hạn chế, khuyết điểm của tập thể (nếu có)</div>
    <div class="indent-p">${data.trachNhiemTapThe || 'Không có.'}</div>

    <!-- VI. PHƯƠNG HƯỚNG KHẮC PHỤC -->
    <div class="sub-heading">VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm (xác định rõ nội dung, biện pháp, thời gian thực hiện và trách nhiệm của cá nhân)</div>
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
        ${(data.kpiRows || defaultPartySelfReview02BData.kpiRows).map(row => `
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

    <!-- II. ĐỀ XUẤT XẾP LOẠI MỨC CHẤT LƯỢNG -->
    <div class="sub-heading">II. Đề xuất xếp loại mức chất lượng:</div>
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
      Gửi kèm Phụ lục về kết quả thực hiện nhiệm vụ trong đó thể hiện sản phẩm tiến độ, chất lượng cụ thể (theo Mẫu 05).
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
    <div class="content-p">- Nhận xét, đánh giá của người quản lý, sử dụng cán bộ, công chức, viên chức: ${data.nhanXetThuTruong || '……………………………………………………………………………………………..'}</div>
    <div class="content-p">- Mức xếp loại chất lượng công chức, viên chức: <strong>${data.mucXepLoaiVienChuc || '……………………………'}</strong></div>

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
    <div class="content-p">- Nhận xét, đánh giá của chi ủy: ${data.nhanXetChiUy || '………………………………………………'}</div>
    <div class="content-p">- Chi bộ đề xuất xếp loại mức chất lượng: <strong>${data.chiBoDeXuatXepLoai || '……………………………………'}</strong></div>

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
      - Đảng ủy trực thuộc cơ sở/Ban Thường vụ Đảng ủy cơ sở hoặc đảng ủy cơ sở nơi không có ban thường vụ quyết định mức xếp loại chất lượng: ${data.dangUyQuyetDinh || '……………………………………………………………………………………………..'}
    </div>

    <!-- CHỮ KÝ BAN THƯỜNG VỤ ĐẢNG ỦY -->
    <table class="signature-table" style="margin-top: 15px;">
      <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%;">
          <div class="sign-title">T/M BAN THƯỜNG VỤ ĐẢNG ỦY</div>
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

  const fileName = `Mau_02B_Kiem_Diem_Dang_Vien_${(data.hoVaTen || 'Dang_Vien').replace(/\s+/g, '_')}_${data.namKiemDiem || '2026'}.doc`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

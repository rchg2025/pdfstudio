export interface PartySelfReview02BData {
  // Cấp ủy & Tiêu đề
  tinhUy: string;             // ĐẢNG BỘ THÀNH PHỐ HỒ CHÍ MINH
  huyenUy: string;            // ĐẢNG BỘ PHƯỜNG CHÁNH HƯNG
  dangBoCoSo: string;         // Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn
  chiBo: string;              // Chi bộ 1
  namKiemDiem: string;        // Năm kiểm điểm (ví dụ: 2026)

  // Thông tin cá nhân
  hoVaTen: string;            // Họ và tên khai sinh (viết in hoa)
  namSinh: string;            // Ngày, tháng, năm sinh (dd/mm/yyyy)
  chucVuDang: string;         // Đảng viên
  chucVuChinhQuyen: string;   // Giảng viên, Giáo viên, Chuyên viên, Nhân viên...
  chucVuDoanThe: string;      // Đoàn viên, Công đoàn viên...
  donViCongTac: string;       // Khoa/Phòng... Trường Cao đẳng Bách khoa Nam Sài Gòn
  chiBoSinhHoat: string;      // Chi bộ 1

  // A. NỘI DUNG KIỂM ĐIỂM
  // I. Ưu điểm, kết quả đạt được
  // 1. Phẩm chất chính trị, đạo đức, lối sống, ý thức tổ chức kỷ luật, trách nhiệm nêu gương
  uuDiemPhamChatChinhTri: string;
  // 2. Thực hiện nhiệm vụ, quyền hạn và chỉ tiêu chuyên môn được giao trong năm
  uuDiemThucHienNhiemVu: string;
  // 3. Thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu
  uuDiemCamKetTuDuong: string;

  // II. Hạn chế, khuyết điểm và nguyên nhân
  hanCheKhuyetDiem: string;
  nguyenNhanKhachQuan: string;
  nguyenNhanChuQuan: string;

  // III. Kết quả khắc phục hạn chế kỳ kiểm điểm trước (năm 2025)
  ketQuaKhacPhucNamTruoc: string;

  // IV. Giải trình / Làm rõ trách nhiệm cá nhân đối với hạn chế của tập thể (nếu có)
  giaiTrinhTrachNhiem: string;

  // V. Phương hướng, biện pháp khắc phục
  phuongHuongKhacPhuc: string;

  // B. TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG
  tuXepLoaiDangVien: 'Hoàn thành xuất sắc nhiệm vụ' | 'Hoàn thành tốt nhiệm vụ' | 'Hoàn thành nhiệm vụ' | 'Không hoàn thành nhiệm vụ';
  tuXepLoaiVienChuc: 'Hoàn thành xuất sắc nhiệm vụ' | 'Hoàn thành tốt nhiệm vụ' | 'Hoàn thành nhiệm vụ' | 'Không hoàn thành nhiệm vụ';

  // Địa danh và ngày tháng
  diaDanh: string;
  ngayKhai: string;
  thangKhai: string;
  namKhai: string;
}

export const defaultPartySelfReview02BData: PartySelfReview02BData = {
  tinhUy: 'ĐẢNG BỘ THÀNH PHỐ HỒ CHÍ MINH',
  huyenUy: 'ĐẢNG BỘ PHƯỜNG CHÁNH HƯNG',
  dangBoCoSo: 'Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn',
  chiBo: 'Chi bộ 1',
  namKiemDiem: '2026',

  hoVaTen: '',
  namSinh: '',
  chucVuDang: 'Đảng viên',
  chucVuChinhQuyen: 'Giảng viên',
  chucVuDoanThe: 'Đoàn viên công đoàn',
  donViCongTac: 'Trường Cao đẳng Bách khoa Nam Sài Gòn',
  chiBoSinhHoat: 'Chi bộ 1',

  uuDiemPhamChatChinhTri: `1. Về tư tưởng chính trị: Luôn kiên định với mục tiêu lý tưởng của Đảng, chủ nghĩa Mác - Lênin và tư tưởng Hồ Chí Minh; chấp hành nghiêm Cương lĩnh, Điều lệ Đảng, các nghị quyết, chỉ thị của Đảng, chính sách, pháp luật của Nhà nước. Không ngừng tự học tập, bồi dưỡng nâng cao trình độ lý luận chính trị và chuyên môn nghiệp vụ.

2. Về phẩm chất đạo đức, lối sống: Luôn giữ gìn đạo đức trong sáng, lối sống giản dị, lành mạnh, khiêm tốn; gương mẫu chấp hành Quy định về những điều đảng viên không được làm. Luôn tự giác rèn luyện, đối chiếu bản thân để không có biểu hiện suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hóa".

3. Về tinh thần đoàn kết, ý thức tổ chức kỷ luật: Có tinh thần xây dựng và giữ gìn khối đoàn kết thống nhất trong Chi bộ và đơn vị; phục tùng sự phân công, điều động của tổ chức và lãnh đạo; tham gia sinh hoạt chi bộ đầy đủ, đóng đảng phí đúng hạn; tích cực đấu tranh tự phê bình và phê bình với tinh thần thẳng thắn, xây dựng.`,

  uuDiemThucHienNhiemVu: `1. Trong công tác chuyên môn: Luôn nêu cao tinh thần trách nhiệm, chủ động xây dựng kế hoạch giảng dạy, hoàn thành 100% định mức giờ chuẩn giảng dạy và khối lượng công việc được giao trong năm 2026 đảm bảo chất lượng, đúng tiến độ.
2. Tích cực tham gia nghiên cứu khoa học, cải tiến phương pháp giảng dạy, ứng dụng chuyển đổi số và hệ thống bài giảng điện tử tương tác (LMS) phục vụ người học.
3. Chấp hành nghiêm kỷ luật lao động, văn hóa công sở, nhiệt tình hỗ trợ đồng nghiệp và hoàn thành tốt các nhiệm vụ đột xuất khi được Chi bộ, Khoa phân công.`,

  uuDiemCamKetTuDuong: `Thực hiện nghiêm túc và đầy đủ các nội dung trong Bản cam kết tu dưỡng, rèn luyện, phấn đấu năm 2026 đã đăng ký với Chi bộ; giữ mối liên hệ chặt chẽ với cấp ủy cơ sở và gương mẫu thực hiện nghĩa vụ công dân nơi cư trú theo Quy định số 213-QĐ/TW.`,

  hanCheKhuyetDiem: `1. Tinh thần phát biểu ý kiến, tham gia đóng góp thảo luận trong một số buổi sinh hoạt chi bộ định kỳ đôi lúc còn rụt rè, chưa thật sự sôi nổi.
2. Việc nghiên cứu, cập nhật các văn bản quy phạm pháp luật mới và ứng dụng các công cụ công nghệ mới trong chuyên môn đôi khi chưa kịp thời.`,

  nguyenNhanKhachQuan: `Khối lượng công việc giảng dạy và công tác kiêm nhiệm trong năm nhiều, lịch học tập và giảng dạy thường xuyên liên tục.`,

  nguyenNhanChuQuan: `Bản thân chưa thật sự chủ động, linh hoạt trong việc sắp xếp thời gian tự học, tự nghiên cứu; còn e ngại, chưa mạnh dạn bày tỏ quan điểm cá nhân trong sinh hoạt tập thể.`,

  ketQuaKhacPhucNamTruoc: `Đã khắc phục tốt những hạn chế của năm 2025: Trong năm 2026 đã hoàn thành vượt chỉ tiêu giờ giảng, tích cực cập nhật giáo án số hóa và tham gia đầy đủ các buổi sinh hoạt chuyên đề.`,

  giaiTrinhTrachNhiem: `Bản thân không có vấn đề thuộc diện cấp có thẩm quyền gợi ý kiểm điểm. Luôn nghiêm túc tiếp thu các ý kiến đóng góp của đồng chí trong Chi bộ và chịu trách nhiệm với phần việc cá nhân được giao.`,

  phuongHuongKhacPhuc: `1. Nâng cao hơn nữa tính chủ động, tích cực tham gia thảo luận, đóng góp ý kiến trong các buổi sinh hoạt chi bộ và hội nghị chuyên môn.
2. Tăng cường tự học tập, nâng cao trình độ chuyên môn, ngoại ngữ và kỹ năng ứng dụng công nghệ thông tin trong giảng dạy.
3. Tiếp tục rèn luyện phẩm chất đạo đức, lối sống, giữ vững tinh thần trách nhiệm và tính tiền phong, gương mẫu của người đảng viên.`,

  tuXepLoaiDangVien: 'Hoàn thành tốt nhiệm vụ',
  tuXepLoaiVienChuc: 'Hoàn thành tốt nhiệm vụ',

  diaDanh: 'Thành phố Hồ Chí Minh',
  ngayKhai: new Date().getDate().toString().padStart(2, '0'),
  thangKhai: (new Date().getMonth() + 1).toString().padStart(2, '0'),
  namKhai: new Date().getFullYear().toString()
};

/**
 * Xuất file Word (.doc) Bản kiểm điểm Mẫu 02B chuẩn theo Hướng dẫn 43-HD/BTCTW và Công văn 2772-CV/BTCTW
 */
export function exportPartySelfReview02BDocx(data: PartySelfReview02BData) {
  const hoTenInHoa = (data.hoVaTen || '...........................................').toUpperCase();

  const htmlDoc = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>Bản kiểm điểm Đảng viên Mẫu 02B - ${hoTenInHoa}</title>
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

    <!-- TIÊU ĐỀ CHÍNH -->
    <div class="title-box">
      <div style="font-size: 11pt; font-weight: bold; text-align: right; margin-bottom: 4px;">Mẫu 02B-HD KĐ.ĐG</div>
      <h1 class="title-main">BẢN KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CỦA CÁ NHÂN</h1>
      <div class="title-sub">Năm ${data.namKiemDiem || '2026'}</div>
      <div class="title-desc">(Dành cho cá nhân không giữ chức vụ lãnh đạo, quản lý; dùng cho kiểm điểm năm 2026 theo Hướng dẫn số 43-HD/BTCTW và Công văn số 2772-CV/BTCTW)</div>
    </div>

    <!-- THÔNG TIN ĐẢNG VIÊN -->
    <div class="content-p">- Họ và tên: <strong style="text-transform: uppercase; font-size: 13pt;">${hoTenInHoa}</strong></div>
    <table style="width: 100%; border: none; margin: 2px 0;">
      <tr>
        <td style="width: 50%; border: none; padding: 0;">- Ngày, tháng, năm sinh: <strong>${data.namSinh || '................................'}</strong></td>
        <td style="width: 50%; border: none; padding: 0;">- Chi bộ sinh hoạt: <strong>${data.chiBoSinhHoat || data.chiBo || '................................'}</strong></td>
      </tr>
      <tr>
        <td style="width: 50%; border: none; padding: 0;">- Chức vụ Đảng: <strong>${data.chucVuDang || 'Đảng viên'}</strong></td>
        <td style="width: 50%; border: none; padding: 0;">- Chức danh chuyên môn: <strong>${data.chucVuChinhQuyen || 'Giảng viên'}</strong></td>
      </tr>
      <tr>
        <td style="width: 50%; border: none; padding: 0;">- Chức vụ đoàn thể: <strong>${data.chucVuDoanThe || 'Đoàn viên'}</strong></td>
        <td style="width: 50%; border: none; padding: 0;">- Đơn vị công tác: <strong>${data.donViCongTac || '................................'}</strong></td>
      </tr>
    </table>

    <div class="section-heading" style="text-align: center; margin-top: 14px;">A. NỘI DUNG KIỂM ĐIỂM</div>

    <!-- I. ƯU ĐIỂM, KẾT QUẢ ĐẠT ĐƯỢC -->
    <div class="sub-heading">I. Ưu điểm, kết quả đạt được</div>

    <div class="content-p"><strong>1. Về phẩm chất chính trị, đạo đức, lối sống; tinh thần đoàn kết, thống nhất trong nội bộ; ý thức tổ chức kỷ luật, trách nhiệm nêu gương, việc thực hiện những điều đảng viên không được làm; tác phong, lề lối làm việc:</strong></div>
    <div class="indent-p">${data.uuDiemPhamChatChinhTri || '...'}</div>

    <div class="content-p"><strong>2. Việc thực hiện nhiệm vụ, quyền hạn và kết quả thực hiện các chỉ tiêu, nhiệm vụ được giao trong năm:</strong></div>
    <div class="indent-p">${data.uuDiemThucHienNhiemVu || '...'}</div>

    <div class="content-p"><strong>3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu của cá nhân:</strong></div>
    <div class="indent-p">${data.uuDiemCamKetTuDuong || '...'}</div>

    <!-- II. HẠN CHẾ, KHUYẾT ĐIỂM VÀ NGUYÊN NHÂN -->
    <div class="sub-heading">II. Hạn chế, khuyết điểm và nguyên nhân</div>
    <div class="content-p"><strong>1. Hạn chế, khuyết điểm:</strong></div>
    <div class="indent-p">${data.hanCheKhuyetDiem || '...'}</div>
    <div class="content-p"><strong>2. Nguyên nhân của hạn chế, khuyết điểm:</strong></div>
    <div class="indent-p">
      <em>- Nguyên nhân khách quan:</em> ${data.nguyenNhanKhachQuan || '...'}<br>
      <em>- Nguyên nhân chủ quan:</em> ${data.nguyenNhanChuQuan || '...'}
    </div>

    <!-- III. KẾT QUẢ KHẮC PHỤC -->
    <div class="sub-heading">III. Kết quả khắc phục những hạn chế, khuyết điểm đã được cấp có thẩm quyền kết luận hoặc chỉ ra ở kỳ kiểm điểm trước</div>
    <div class="indent-p">${data.ketQuaKhacPhucNamTruoc || 'Không có.'}</div>

    <!-- IV. GIẢI TRÌNH -->
    <div class="sub-heading">IV. Giải trình những vấn đề được gợi ý kiểm điểm / Làm rõ trách nhiệm cá nhân đối với hạn chế của tập thể (nếu có)</div>
    <div class="indent-p">${data.giaiTrinhTrachNhiem || 'Không có.'}</div>

    <!-- V. PHƯƠNG HƯỚNG, BIỆN PHÁP KHẮC PHỤC -->
    <div class="sub-heading">V. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm</div>
    <div class="indent-p">${data.phuongHuongKhacPhuc || '...'}</div>

    <!-- B. TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG -->
    <div class="section-heading" style="text-align: center; margin-top: 14px;">B. TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG</div>
    <div class="content-p" style="padding-left: 20px;">
      1. Tự nhận mức xếp loại chất lượng cán bộ, viên chức/người lao động: <strong>${data.tuXepLoaiVienChuc}</strong>
    </div>
    <div class="content-p" style="padding-left: 20px;">
      2. Tự nhận mức xếp loại chất lượng đảng viên: <strong>${data.tuXepLoaiDangVien}</strong>
    </div>

    <!-- C. Ý KIẾN ĐÁNH GIÁ, XẾP LOẠI -->
    <div class="section-heading" style="text-align: center; margin-top: 18px;">C. ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG</div>

    <div class="content-p"><strong>1. Ý kiến của tập thể đơn vị công tác:</strong></div>
    <div class="content-p" style="padding-left: 20px; font-style: italic;">
      ..........................................................................................................................................................................<br>
      - Đánh giá, xếp loại cán bộ, công chức, viên chức: .........................................................................................
    </div>

    <div class="content-p" style="margin-top: 8px;"><strong>2. Ý kiến của tập thể chi bộ nơi sinh hoạt:</strong></div>
    <div class="content-p" style="padding-left: 20px; font-style: italic;">
      ..........................................................................................................................................................................<br>
      - Chi bộ xếp loại chất lượng đảng viên: .......................................................................................................
    </div>

    <!-- KHỐI CHỮ KÝ 2 CỘT -->
    <table class="signature-table">
      <tr>
        <td style="width: 50%;">
          <div class="sign-title">T/M CHI ỦY CHI BỘ</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
          <div class="sign-name">...................................................</div>
        </td>
        <td style="width: 50%;">
          <div class="sign-title">NGƯỜI TỰ KIỂM ĐIỂM</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
          <div class="sign-name">${hoTenInHoa}</div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const blob = new Blob(['\ufeff' + htmlDoc], {
    type: 'application/msword;charset=utf-8'
  });

  const fileName = `Ban_Kiem_Diem_Dang_Vien_Mau_02B_${(data.hoVaTen || 'Dang_Vien').replace(/\s+/g, '_')}_${data.namKiemDiem || '2026'}.doc`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

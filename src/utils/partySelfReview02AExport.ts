export interface PartySelfReview02AData {
  // Cấp ủy & Tiêu đề
  tinhUy: string;             // ĐẢNG BỘ TỈNH / ĐẢNG BỘ ...
  huyenUy: string;            // HUYỆN ỦY / ĐẢNG ỦY ...
  dangBoCoSo: string;         // ĐẢNG BỘ CƠ SỞ ...
  chiBo: string;              // CHI BỘ ...
  namKiemDiem: string;        // Năm kiểm điểm (ví dụ: 2026)

  // Thông tin cá nhân
  hoVaTen: string;            // Họ và tên khai sinh (viết in hoa)
  namSinh: string;            // Ngày, tháng, năm sinh (dd/mm/yyyy)
  chucVuDang: string;         // Bí thư Chi bộ, Chi ủy viên, Đảng ủy viên...
  chucVuChinhQuyen: string;   // Trưởng khoa, Hiệu trưởng, Giám đốc, Trưởng phòng...
  chucVuDoanThe: string;      // Chủ tịch Công đoàn, Bí thư Đoàn TN...
  donViCongTac: string;       // Khoa CNTT, Phòng Đào tạo, Trường CĐ...
  chiBoSinhHoat: string;      // Chi bộ sinh hoạt

  // I. ƯU ĐIỂM, KẾT QUẢ ĐẠT ĐƯỢC
  // 1. Phẩm chất chính trị, đạo đức, lối sống, ý thức tổ chức kỷ luật
  uuDiemPhamChatChinhTri: string;
  // 2. Thực hiện nhiệm vụ, quyền hạn và kết quả chỉ tiêu chuyên môn
  uuDiemThucHienNhiemVu: string;
  // 3. Thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu
  uuDiemCamKetTuDuong: string;
  // 4. Kết quả công tác lãnh đạo, chỉ đạo, quản lý, điều hành (Đặc thù lãnh đạo)
  uuDiemLanhDaoQuanLy: string;
  // 5. Trách nhiệm trong công việc, tinh thần đổi mới sáng tạo, dám nghĩ dám làm, cải cách hành chính, chuyển đổi số
  uuDiemTrachNhiemDoiMoi: string;
  // 6. Trách nhiệm nêu gương của bản thân và gia đình, phòng chống tham nhũng lãng phí, uy tín tín nhiệm
  uuDiemTrachNhiemNeuGuong: string;

  // II. HẠN CHẾ, KHUYẾT ĐIỂM VÀ NGUYÊN NHÂN
  hanCheKhuyetDiem: string;
  nguyenNhanKhachQuan: string;
  nguyenNhanChuQuan: string;

  // III. KẾT QUẢ KHẮC PHỤC CÁC HẠN CHẾ, KHUYẾT ĐIỂM KỲ KIỂM ĐIỂM TRƯỚC
  ketQuaKhacPhucNamTruoc: string;

  // IV. GIẢI TRÌNH NHỮNG VẤN ĐỀ ĐƯỢC GỢI Ý KIỂM ĐIỂM (NẾU CÓ)
  giaiTrinhGoiYKiemDiem: string;

  // V. PHƯƠNG HƯỚNG, BIỆN PHÁP KHẮC PHỤC HẠN CHẾ, KHUYẾT ĐIỂM
  phuongHuongKhacPhuc: string;

  // VI. TỰ NHẬN MỨC XẾP LOẠI CHẤT LƯỢNG
  // 1. Tự nhận mức xếp loại lãnh đạo, quản lý
  tuXepLoaiCanBo: 'Hoàn thành xuất sắc nhiệm vụ' | 'Hoàn thành tốt nhiệm vụ' | 'Hoàn thành nhiệm vụ' | 'Không hoàn thành nhiệm vụ';
  // 2. Tự nhận mức xếp loại chất lượng đảng viên
  tuXepLoaiDangVien: 'Hoàn thành xuất sắc nhiệm vụ' | 'Hoàn thành tốt nhiệm vụ' | 'Hoàn thành nhiệm vụ' | 'Không hoàn thành nhiệm vụ';

  // Địa danh và ngày tháng
  diaDanh: string;
  ngayKhai: string;
  thangKhai: string;
  namKhai: string;
}

export const defaultPartySelfReview02AData: PartySelfReview02AData = {
  tinhUy: 'ĐẢNG BỘ THÀNH PHỐ HỒ CHÍ MINH',
  huyenUy: 'ĐẢNG BỘ CÁC TRƯỜNG CAO ĐẲNG ĐẠI HỌC THÀNH PHỐ HỒ CHÍ MINH',
  dangBoCoSo: 'Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn',
  chiBo: 'Chi bộ 1',
  namKiemDiem: '2026',

  hoVaTen: '',
  namSinh: '',
  chucVuDang: 'Bí thư Chi bộ',
  chucVuChinhQuyen: 'Trưởng khoa',
  chucVuDoanThe: '',
  donViCongTac: 'Trường Cao đẳng Bách khoa Nam Sài Gòn',
  chiBoSinhHoat: 'Chi bộ 1',

  uuDiemPhamChatChinhTri: `1. Về tư tưởng chính trị: Luôn kiên định với chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh và đường lối đổi mới của Đảng; chấp hành nghiêm Cương lĩnh chính trị, Điều lệ Đảng, các nghị quyết, chỉ thị, kết luận của Ban Chấp hành Trung ương, Bộ Chính trị, Ban Bí thư và cấp ủy các cấp. Thường xuyên tự giác học tập, nghiên cứu nâng cao trình độ lý luận chính trị và chuyên môn nghiệp vụ.

2. Về phẩm chất đạo đức, lối sống: Giữ gìn phẩm chất đạo đức trong sáng, lối sống giản dị, khiêm tốn, trung thực; không có biểu hiện suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hóa". Thực hiện nghiêm quy định những điều đảng viên không được làm.

3. Về ý thức tổ chức kỷ luật: Chấp hành tuyệt đối sự phân công của tổ chức Đảng và lãnh đạo cấp trên; thực hiện nghiêm nguyên tắc tập trung dân chủ, tập thể lãnh đạo, cá nhân phụ trách; tích cực tham gia sinh hoạt chi bộ định kỳ và đóng đảng phí đầy đủ, đúng hạn.`,

  uuDiemThucHienNhiemVu: `Chủ động xây dựng kế hoạch công tác khoa học, bám sát nhiệm vụ trọng tâm năm 2026 của đơn vị. Trực tiếp chỉ đạo hoàn thành 100% các chỉ tiêu công tác chuyên môn được giao với chất lượng cao; đảm bảo tiến độ, chất lượng giảng dạy, nghiên cứu khoa học, cải tiến chương trình đào tạo và quản lý tốt sinh viên, học viên.`,

  uuDiemCamKetTuDuong: `Thực hiện nghiêm túc, đầy đủ các nội dung trong Bản cam kết tu dưỡng, rèn luyện, phấn đấu năm 2026 đã ký nộp Chi bộ; luôn tự giác đối chiếu, soi rọi bản thân hàng tháng để kịp thời chấn chỉnh lề lối, tác phong làm việc.`,

  uuDiemLanhDaoQuanLy: `Với cương vị là người đứng đầu/cán bộ lãnh đạo quản lý:
- Đã cùng tập thể cấp ủy, lãnh đạo đơn vị giữ vững sự đoàn kết, thống nhất cao trong nội bộ; lãnh đạo chi bộ và tập thể đơn vị hoàn thành xuất sắc các chỉ tiêu công tác năm 2026.
- Thực hiện nghiêm quy chế làm việc, đề cao vai trò trách nhiệm của từng cá nhân; sâu sát cơ sở, lắng nghe và kịp thời tháo gỡ khó khăn, vướng mắc cho viên chức, giảng viên và người lao động.
- Phát huy năng lực quy tụ, tạo môi trường làm việc dân chủ, văn minh, gắn kết các thành viên trong tập thể.`,

  uuDiemTrachNhiemDoiMoi: `Gương mẫu, tích cực đổi mới phương pháp làm việc; thể hiện tinh thần năng động, dám nghĩ, dám làm, dám chịu trách nhiệm vì lợi ích chung. Chủ động đẩy mạnh chuyển đổi số trong công tác quản lý, điều hành, ứng dụng công nghệ thông tin trong chuyên môn và cải cách thủ tục hành chính tại đơn vị, giúp tiết kiệm thời gian và nâng cao năng suất làm việc.`,

  uuDiemTrachNhiemNeuGuong: `Luôn đề cao trách nhiệm nêu gương của người cán bộ lãnh đạo theo Quy định số 08-QĐi/TW và Quy định số 37-QĐ/TW. Bản thân và gia đình luôn gương mẫu chấp hành tốt chủ trương của Đảng, pháp luật của Nhà nước và các quy định của địa phương nơi cư trú; kiên quyết đấu tranh phòng, chống tham nhũng, lãng phí, tiêu cực; nhận được sự tin tưởng, tín nhiệm cao từ tập thể cán bộ, đảng viên và quần chúng.`,

  hanCheKhuyetDiem: `1. Trong công tác chỉ đạo, điều hành đôi lúc việc đôn đốc, kiểm tra tiến độ thực hiện một vài nhiệm vụ chuyên môn chưa thật sự thường xuyên, liên tục.
2. Việc tổ chức các buổi sinh hoạt chuyên đề tại Chi bộ đôi khi nội dung còn nặng tính phổ biến văn bản, thời gian dành cho thảo luận, tranh luận phản biện của đảng viên trẻ chưa nhiều.`,

  nguyenNhanKhachQuan: `Khối lượng công việc quản lý chuyên môn và công tác Đảng kiêm nhiệm ngày càng tăng, nhiều văn bản chỉ đạo mới đòi hỏi tiến độ hoàn thành gấp trong cùng một thời điểm.`,

  nguyenNhanChuQuan: `Kỹ năng sắp xếp, phân bổ thời gian giữa công tác quản lý điều hành và nghiên cứu chuyên sâu có lúc chưa thật sự khoa học, chưa quyết liệt giao quyền triệt để cho cấp dưới.`,

  ketQuaKhacPhucNamTruoc: `Các hạn chế được chỉ ra trong đợt kiểm điểm năm 2025 (về việc sắp xếp thời gian sinh hoạt chuyên môn và tăng cường ứng dụng CNTT) đã được bản thân tập trung khắc phục triệt để trong năm 2026: 100% các cuộc họp và giáo án đều được số hóa, sinh hoạt chuyên đề được lên kế hoạch cụ thể từ đầu quý.`,

  giaiTrinhGoiYKiemDiem: `Không có vấn đề cấp có thẩm quyền gợi ý kiểm điểm riêng đối với cá nhân.`,

  phuongHuongKhacPhuc: `1. Tiếp tục tăng cường công tác kiểm tra, giám sát, đôn đốc tiến độ thực hiện nhiệm vụ của các bộ phận; phân công công việc cụ thể, rõ người, rõ việc, rõ tiến độ và kết quả đầu ra.
2. Đổi mới mạnh mẽ nội dung và hình thức sinh hoạt chi bộ, tăng cường các chuyên đề gắn liền với thực tiễn chuyển đổi số và nâng cao năng lực chuyên môn của đảng viên.
3. Tiếp tục rèn luyện tác phong khoa học, sâu sát cơ sở, nâng cao hơn nữa tính tiên phong, gương mẫu của người đứng đầu.`,

  tuXepLoaiCanBo: 'Hoàn thành xuất sắc nhiệm vụ',
  tuXepLoaiDangVien: 'Hoàn thành xuất sắc nhiệm vụ',

  diaDanh: 'Thành phố Hồ Chí Minh',
  ngayKhai: new Date().getDate().toString().padStart(2, '0'),
  thangKhai: (new Date().getMonth() + 1).toString().padStart(2, '0'),
  namKhai: new Date().getFullYear().toString()
};

/**
 * Xuất file Word (.doc) Bản kiểm điểm Mẫu 02A chuẩn theo Hướng dẫn 43-HD/BTCTW và Công văn 2772-CV/BTCTW
 */
export function exportPartySelfReview02ADocx(data: PartySelfReview02AData) {
  const hoTenInHoa = (data.hoVaTen || '...........................................').toUpperCase();

  const htmlDoc = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>Bản kiểm điểm Đảng viên Mẫu 02A - ${hoTenInHoa}</title>
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
      <div style="font-size: 11pt; font-weight: bold; text-align: right; margin-bottom: 4px;">Mẫu 02A-HD KĐ.ĐG</div>
      <h1 class="title-main">BẢN KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CỦA CÁ NHÂN</h1>
      <div class="title-sub">Năm ${data.namKiemDiem || '2026'}</div>
      <div class="title-desc">(Dành cho cá nhân giữ chức vụ lãnh đạo, quản lý; dùng cho kiểm điểm năm 2026 theo Hướng dẫn số 43-HD/BTCTW và Công văn số 2772-CV/BTCTW)</div>
    </div>

    <!-- THÔNG TIN ĐẢNG VIÊN -->
    <div class="content-p">- Họ và tên: <strong style="text-transform: uppercase; font-size: 13pt;">${hoTenInHoa}</strong></div>
    <table style="width: 100%; border: none; margin: 2px 0;">
      <tr>
        <td style="width: 50%; border: none; padding: 0;">- Ngày, tháng, năm sinh: <strong>${data.namSinh || '................................'}</strong></td>
        <td style="width: 50%; border: none; padding: 0;">- Chi bộ sinh hoạt: <strong>${data.chiBo || data.chiBoSinhHoat || '................................'}</strong></td>
      </tr>
      <tr>
        <td style="width: 50%; border: none; padding: 0;">- Chức vụ Đảng: <strong>${data.chucVuDang || '................................'}</strong></td>
        <td style="width: 50%; border: none; padding: 0;">- Chức vụ chính quyền: <strong>${data.chucVuChinhQuyen || '................................'}</strong></td>
      </tr>
      <tr>
        <td style="width: 50%; border: none; padding: 0;">- Chức vụ đoàn thể: <strong>${data.chucVuDoanThe || 'Không'}</strong></td>
        <td style="width: 50%; border: none; padding: 0;">- Đơn vị công tác: <strong>${data.donViCongTac || '................................'}</strong></td>
      </tr>
    </table>

    <div class="section-heading" style="text-align: center; margin-top: 14px;">A. NỘI DUNG KIỂM ĐIỂM</div>

    <!-- I. ƯU ĐIỂM, KẾT QUẢ ĐẠT ĐƯỢC -->
    <div class="sub-heading">I. Ưu điểm, kết quả đạt được</div>

    <div class="content-p"><strong>1. Về phẩm chất chính trị, đạo đức, lối sống; tinh thần đoàn kết, thống nhất trong nội bộ; ý thức tổ chức kỷ luật, việc thực hiện những điều đảng viên không được làm; tác phong, lề lối làm việc:</strong></div>
    <div class="indent-p">${data.uuDiemPhamChatChinhTri || '...'}</div>

    <div class="content-p"><strong>2. Việc thực hiện nhiệm vụ, quyền hạn và kết quả thực hiện các chỉ tiêu, nhiệm vụ được giao trong năm:</strong></div>
    <div class="indent-p">${data.uuDiemThucHienNhiemVu || '...'}</div>

    <div class="content-p"><strong>3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu của cá nhân:</strong></div>
    <div class="indent-p">${data.uuDiemCamKetTuDuong || '...'}</div>

    <div class="content-p"><strong>4. Kết quả công tác lãnh đạo, chỉ đạo, quản lý, điều hành; thực hiện chức trách, nhiệm vụ; mức độ hoàn thành nhiệm vụ của các cấp ủy, tổ chức đảng trực thuộc, địa phương, cơ quan, đơn vị thuộc quyền quản lý; khả năng quy tụ, xây dựng đoàn kết nội bộ:</strong></div>
    <div class="indent-p">${data.uuDiemLanhDaoQuanLy || '...'}</div>

    <div class="content-p"><strong>5. Trách nhiệm trong công việc; tinh thần năng động, đổi mới sáng tạo, dám nghĩ, dám nói, dám làm, nói đi đôi với làm, dám chịu trách nhiệm; trách nhiệm trong cải cách hành chính, chuyển đổi số:</strong></div>
    <div class="indent-p">${data.uuDiemTrachNhiemDoiMoi || '...'}</div>

    <div class="content-p"><strong>6. Trách nhiệm nêu gương của bản thân và gia đình; việc đấu tranh phòng, chống tham nhũng, lãng phí, tiêu cực; sự tín nhiệm của cán bộ, đảng viên và quần chúng:</strong></div>
    <div class="indent-p">${data.uuDiemTrachNhiemNeuGuong || '...'}</div>

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
    <div class="sub-heading">III. Kết quả khắc phục các hạn chế, khuyết điểm đã được cấp có thẩm quyền kết luận hoặc chỉ ra ở kỳ kiểm điểm trước</div>
    <div class="indent-p">${data.ketQuaKhacPhucNamTruoc || 'Không có.'}</div>

    <!-- IV. GIẢI TRÌNH -->
    <div class="sub-heading">IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)</div>
    <div class="indent-p">${data.giaiTrinhGoiYKiemDiem || 'Không có.'}</div>

    <!-- V. PHƯƠNG HƯỚNG, BIỆN PHÁP KHẮC PHỤC -->
    <div class="sub-heading">V. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm</div>
    <div class="indent-p">${data.phuongHuongKhacPhuc || '...'}</div>

    <!-- VI. TỰ NHẬN MỨC XẾP LOẠI CHẤT LƯỢNG -->
    <div class="sub-heading">VI. Tự nhận mức xếp loại chất lượng</div>
    <div class="content-p" style="padding-left: 20px;">
      1. Tự nhận mức xếp loại của người đứng đầu/cán bộ lãnh đạo, quản lý: <strong>${data.tuXepLoaiCanBo}</strong>
    </div>
    <div class="content-p" style="padding-left: 20px;">
      2. Tự nhận mức xếp loại chất lượng đảng viên: <strong>${data.tuXepLoaiDangVien}</strong>
    </div>

    <!-- B. Ý KIẾN ĐÁNH GIÁ, XẾP LOẠI -->
    <div class="section-heading" style="text-align: center; margin-top: 18px;">B. Ý KIẾN ĐÁNH GIÁ, XẾP LOẠI</div>

    <div class="content-p"><strong>1. Ý kiến của tập thể lãnh đạo cơ quan, đơn vị nơi công tác:</strong></div>
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

  const fileName = `Ban_Kiem_Diem_Dang_Vien_Mau_02A_${(data.hoVaTen || 'Lanh_Dao_Quan_Ly').replace(/\s+/g, '_')}_${data.namKiemDiem || '2026'}.doc`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

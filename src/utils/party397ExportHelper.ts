// ==========================================
// 1. MẪU 01: BÁO CÁO KIỂM ĐIỂM TẬP THỂ
// ==========================================
export interface PartyReview01CollectiveData {
  tinhUy: string;
  huyenUy: string;
  dangBoCoSo: string;
  chiBo: string;
  tenTapThe: string;           // Ví dụ: Chi ủy Chi bộ 1, Ban Giám hiệu...
  namKiemDiem: string;         // 2026
  
  // A. NỘI DUNG KIỂM ĐIỂM
  // I. Ưu điểm, kết quả đạt được
  uuDiemChapHanhDuongLoi: string;    // 1. Chấp hành Cương lĩnh, Điều lệ, Nghị quyết...
  uuDiemThucHienMucTieu: string;      // 2. Kết quả thực hiện mục tiêu, chỉ tiêu nhiệm vụ...
  uuDiemXayDungChinhDonDang: string;  // 3. Xây dựng, chỉnh đốn Đảng, phòng chống suy thoái, tinh gọn bộ máy...
  uuDiemTrachNhiemLanhDao: string;    // 4. Trách nhiệm của tập thể lãnh đạo, quản lý...
  
  // II. Hạn chế, khuyết điểm và nguyên nhân
  hanCheKhuyetDiem: string;
  nguyenNhanKhachQuan: string;
  nguyenNhanChuQuan: string;
  
  // III. Khắc phục hạn chế kỳ trước
  ketQuaKhacPhucNamTruoc: string;
  
  // IV. Giải trình gợi ý kiểm điểm
  giaiTrinhGoiYKiemDiem: string;
  
  // V. Trách nhiệm tập thể, cá nhân
  trachNhiemTapTheCaNhan: string;
  
  // VI. Phương hướng, biện pháp khắc phục
  phuongHuongKhacPhuc: string;

  // B. TỰ ĐÁNH GIÁ, XẾP LOẠI
  diemTieuChiChung: number;       // Tối đa 30
  diemThucHienNhiemVu: number;    // Tối đa 70
  tuXepLoaiTapThe: 'Hoàn thành xuất sắc nhiệm vụ' | 'Hoàn thành tốt nhiệm vụ' | 'Hoàn thành nhiệm vụ' | 'Không hoàn thành nhiệm vụ';

  diaDanh: string;
  ngayKhai: string;
  thangKhai: string;
  namKhai: string;
}

export const defaultPartyReview01CollectiveData: PartyReview01CollectiveData = {
  tinhUy: 'ĐẢNG BỘ CÁC TRƯỜNG ĐẠI HỌC, CAO ĐẲNG THÀNH PHỐ HỒ CHÍ MINH',
  huyenUy: 'ĐẢNG ỦY TRƯỜNG CAO ĐẲNG BÁCH KHOA NAM SÀI GÒN',
  dangBoCoSo: 'Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn',
  chiBo: 'Chi bộ 1',
  tenTapThe: 'Chi bộ 1',
  namKiemDiem: '2026',

  uuDiemChapHanhDuongLoi: `1. Chấp hành nghiêm Cương lĩnh chính trị, Điều lệ Đảng, các nghị quyết, chỉ thị, kết luận của Ban Chấp hành Trung ương, Thành ủy và Đảng ủy Khối. 
2. Thực hiện nghiêm nguyên tắc tập trung dân chủ, tập thể lãnh đạo, cá nhân phụ trách; duy trì nền nếp sinh hoạt chi bộ hằng tháng và sinh hoạt chuyên đề theo đúng quy định.
3. Ban hành và thực hiện đúng quy chế làm việc, phân công nhiệm vụ cụ thể, rõ ràng cho từng chi ủy viên và đảng viên.`,

  uuDiemThucHienMucTieu: `Lãnh đạo, chỉ đạo hoàn thành 100% các mục tiêu, nhiệm vụ chính trị, kế hoạch đào tạo và công tác chuyên môn được Đảng ủy và Nhà trường giao trong năm 2026. Các chỉ tiêu về tuyển sinh, chất lượng giảng dạy, nghiên cứu khoa học và phục vụ cộng đồng đều đạt và vượt mức kế hoạch đề ra.`,

  uuDiemXayDungChinhDonDang: `1. Công tác chính trị, tư tưởng được chú trọng; 100% cán bộ, đảng viên học tập nghiêm túc các nghị quyết của Đảng, không có biểu hiện suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hóa".
2. Thực hiện nghiêm trách nhiệm nêu gương của cấp ủy viên và người đứng đầu; tăng cường chuyển đổi số, tinh gọn quy trình làm việc theo tinh thần Nghị quyết số 57-NQ/TW.
3. Làm tốt công tác kiểm tra, giám sát, giữ gìn kỷ luật Đảng, phòng chống tham nhũng, lãng phí và xây dựng khối đoàn kết nội bộ vững chắc.`,

  uuDiemTrachNhiemLanhDao: `Tập thể Chi ủy/Lãnh đạo luôn chủ động, quyết liệt, dám nghĩ dám làm, sâu sát với thực tiễn; kịp thời nắm bắt tâm tư, nguyện vọng của cán bộ, giảng viên, nhân viên và người học để tháo gỡ khó khăn, tạo môi trường làm việc dân chủ, tích cực.`,

  hanCheKhuyetDiem: `1. Nội dung sinh hoạt chuyên đề đôi lúc chưa thật sự phong phú; việc ứng dụng công nghệ thông tin vào quản lý hồ sơ đảng vụ có lúc còn chậm so với yêu cầu đổi mới.
2. Công tác tạo nguồn phát triển đảng viên mới ở khối học sinh, sinh viên tuy có chuyển biến nhưng chưa đạt mục tiêu đề ra ban đầu.`,

  nguyenNhanKhachQuan: `Khối lượng công việc chuyên môn đào tạo, kiểm định chất lượng và nghiên cứu khoa học của các thành viên rất lớn, áp lực thời gian cao.`,
  nguyenNhanChuQuan: `Chi ủy đôi khi chưa dành nhiều thời gian nghiên cứu sâu về phương pháp đổi mới sinh hoạt đảng trong môi trường số; công tác tuyên truyền, định hướng bồi dưỡng quần chúng ưu tú có lúc chưa liên tục.`,

  ketQuaKhacPhucNamTruoc: `Đã khắc phục triệt để các hạn chế của năm 2025: 100% cuộc họp chi bộ được chuẩn bị tài liệu trước; ứng dụng phần mềm quản lý sổ tay đảng viên điện tử đồng bộ.`,

  giaiTrinhGoiYKiemDiem: `Không có vấn đề cấp trên gợi ý kiểm điểm riêng đối với tập thể.`,

  trachNhiemTapTheCaNhan: `Tập thể Chi ủy xin nghiêm túc tiếp thu các ý kiến đóng góp, nhận trách nhiệm tập thể về các hạn chế nêu trên và phân công các đồng chí trong cấp ủy phụ trách từng phần việc cụ thể để khắc phục dứt điểm.`,

  phuongHuongKhacPhuc: `1. Đổi mới mạnh mẽ nội dung sinh hoạt chi bộ gắn với chuyển đổi số và nâng cao chất lượng đào tạo nghề.
2. Tăng cường phân công đảng viên chính thức theo dõi, giúp đỡ quần chúng ưu tú để đẩy mạnh công tác phát triển Đảng.
3. Nâng cao chất lượng công tác tự phê bình và phê bình trong sinh hoạt cấp ủy.`,

  diemTieuChiChung: 29,
  diemThucHienNhiemVu: 68,
  tuXepLoaiTapThe: 'Hoàn thành xuất sắc nhiệm vụ',

  diaDanh: 'Chánh Hưng',
  ngayKhai: new Date().getDate().toString().padStart(2, '0'),
  thangKhai: (new Date().getMonth() + 1).toString().padStart(2, '0'),
  namKhai: new Date().getFullYear().toString()
};

// ==========================================
// 2. MẪU 02C: BẢN KIỂM ĐIỂM ĐẢNG VIÊN HỌC SINH, SINH VIÊN
// ==========================================
export interface PartyReview02CStudentData {
  tinhUy: string;
  huyenUy: string;
  dangBoCoSo: string;
  chiBo: string;
  namKiemDiem: string;

  hoVaTen: string;
  namSinh: string;
  lop: string;
  khoa: string;
  donViCongTac: string;
  chiBoSinhHoat: string;

  // A. NỘI DUNG KIỂM ĐIỂM
  // I. Ưu điểm, kết quả đạt được
  uuDiemPhamChatChinhTri: string;    // 1. Phẩm chất chính trị, đạo đức, lối sống, văn hóa học đường...
  uuDiemThucHienNhiemVu: string;      // 2. Kết quả học tập, rèn luyện, nghĩa vụ công dân, phong trào Đoàn - Hội...
  uuDiemCamKetTuDuong: string;        // 3. Thực hiện cam kết tu dưỡng, tự soi tự sửa...

  // II. Hạn chế, khuyết điểm
  hanCheKhuyetDiem: string;
  nguyenNhanKhachQuan: string;
  nguyenNhanChuQuan: string;

  // III. Khắc phục hạn chế
  ketQuaKhacPhucNamTruoc: string;
  // IV. Giải trình
  giaiTrinhGoiYKiemDiem: string;
  // V. Trách nhiệm cá nhân với tập thể
  trachNhiemCaNhan: string;
  // VI. Phương hướng khắc phục
  phuongHuongKhacPhuc: string;

  // B. TỰ ĐÁNH GIÁ, XẾP LOẠI
  diemTieuChiChung: number;       // Tối đa 30 (Phụ lục 5)
  diemThucHienNhiemVu: number;    // Tối đa 70 (Phụ lục 5)
  tuXepLoaiDangVien: 'Hoàn thành xuất sắc nhiệm vụ' | 'Hoàn thành tốt nhiệm vụ' | 'Hoàn thành nhiệm vụ' | 'Không hoàn thành nhiệm vụ';

  diaDanh: string;
  ngayKhai: string;
  thangKhai: string;
  namKhai: string;
}

export const defaultPartyReview02CStudentData: PartyReview02CStudentData = {
  tinhUy: 'ĐẢNG BỘ CÁC TRƯỜNG ĐẠI HỌC, CAO ĐẲNG THÀNH PHỐ HỒ CHÍ MINH',
  huyenUy: 'ĐẢNG ỦY TRƯỜNG CAO ĐẲNG BÁCH KHOA NAM SÀI GÒN',
  dangBoCoSo: 'Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn',
  chiBo: 'Chi bộ Sinh viên',
  namKiemDiem: '2026',

  hoVaTen: '',
  namSinh: '',
  lop: 'CĐ-CNTT 24A',
  khoa: 'Khoa Công Nghệ Thông Tin',
  donViCongTac: 'Trường Cao đẳng Bách khoa Nam Sài Gòn',
  chiBoSinhHoat: 'Chi bộ Sinh viên',

  uuDiemPhamChatChinhTri: `1. Có lập trường tư tưởng chính trị kiên định, vững vàng; chấp hành tuyệt đối chủ trương của Đảng, chính sách pháp luật của Nhà nước và quy chế học tập, rèn luyện của Nhà trường.
2. Giữ gìn đạo đức trong sáng, lối sống lành mạnh, trung thực, khiêm tốn; gương mẫu trong xây dựng văn hóa học đường, tích cực đấu tranh ngăn chặn các hiện tượng tiêu cực trong thi cử và học tập.
3. Tham gia sinh hoạt chi bộ đầy đủ, đóng đảng phí đúng hạn; có mối quan hệ chan hòa, đoàn kết, giúp đỡ bạn bè trong học tập và sinh hoạt.`,

  uuDiemThucHienNhiemVu: `1. Nỗ lực học tập đạt kết quả học tập xếp loại Giỏi/Xuất sắc; tích cực tham gia các kỳ thi tay nghề, hội thi sáng tạo kỹ thuật và chuyển đổi số.
2. Gương mẫu, đi đầu trong các hoạt động phong trào Đoàn Thanh niên, Hội Sinh viên, chiến dịch tình nguyện Mùa hè xanh, Tiếp sức mùa thi.
3. Hoàn thành tốt các nhiệm vụ do Chi bộ và Đoàn trường phân công; giữ mối liên hệ mật thiết với tổ chức đoàn thể và nơi cư trú.`,

  uuDiemCamKetTuDuong: `Thực hiện nghiêm túc các nội dung đã cam kết tu dưỡng, rèn luyện đầu năm; chủ động tự soi, tự sửa trong phong cách, tác phong sinh viên để giữ vững phẩm chất người đảng viên trẻ.`,

  hanCheKhuyetDiem: `1. Đôi lúc việc phân bổ thời gian giữa học tập chuyên môn trên lớp và tham gia các hoạt động phong trào ngoại khóa còn chưa thật sự cân đối.
2. Kỹ năng giao tiếp ngoại ngữ và đóng góp ý kiến phản biện tại các buổi sinh hoạt chi bộ đôi khi còn rụt rè.`,

  nguyenNhanKhachQuan: `Chương trình học thực hành tại xưởng và các đồ án môn học có yêu cầu chuyên môn cao, thời lượng dồn vào cuối học kỳ.`,
  nguyenNhanChuQuan: `Chưa chủ động rèn luyện kỹ năng quản lý thời gian cá nhân và kỹ năng thuyết trình trước đám đông.`,

  ketQuaKhacPhucNamTruoc: `Đã khắc phục được việc thiếu tự tin trong phát biểu xây dựng bài học; kết quả học tập kỳ này đã nâng từ Khá lên Giỏi.`,

  giaiTrinhGoiYKiemDiem: `Không có vấn đề gợi ý kiểm điểm riêng.`,
  trachNhiemCaNhan: `Bản thân xin nhận trách nhiệm về các hạn chế trên và quyết tâm rèn luyện tốt hơn trong năm tới.`,

  phuongHuongKhacPhuc: `1. Lập kế hoạch học tập chi tiết theo từng tuần, từng tháng để vừa đảm bảo kết quả học tập xuất sắc vừa hoàn thành tốt nhiệm vụ chi bộ giao.
2. Tích cực tham gia câu lạc bộ học thuật, câu lạc bộ tiếng Anh và chủ động phát biểu ý kiến trong sinh hoạt Đảng.
3. Hỗ trợ các bạn học sinh, sinh viên trong lớp cùng tiến bộ trong học tập và rèn luyện.`,

  diemTieuChiChung: 29,
  diemThucHienNhiemVu: 68,
  tuXepLoaiDangVien: 'Hoàn thành xuất sắc nhiệm vụ',

  diaDanh: 'Chánh Hưng',
  ngayKhai: new Date().getDate().toString().padStart(2, '0'),
  thangKhai: (new Date().getMonth() + 1).toString().padStart(2, '0'),
  namKhai: new Date().getFullYear().toString()
};

// ==========================================
// 3. XUẤT WORD MẪU 01 & MẪU 02C CHUẨN HD 397/ĐU
// ==========================================
export function exportPartyReview01CollectiveDocx(data: PartyReview01CollectiveData) {
  const tenInHoa = (data.tenTapThe || 'TẬP THỂ ...').toUpperCase();
  const htmlDoc = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>Báo cáo kiểm điểm tập thể Mẫu 01 - ${tenInHoa}</title>
    <!--[if gte mso 9]>
    <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml>
    <![endif]-->
    <style>
      @page { size: 210mm 297mm; margin: 20mm 15mm 20mm 20mm; }
      body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.35; color: #000; }
      table { width: 100%; border-collapse: collapse; }
      .table-header td { border: none; padding: 1px 4px; vertical-align: top; }
      .title-box { text-align: center; margin: 15px 0 20px 0; }
      .title-main { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 4px 0; }
      .title-sub { font-size: 13pt; font-weight: bold; margin-bottom: 4px; }
      .section-heading { font-weight: bold; font-size: 13pt; text-transform: uppercase; margin-top: 14px; margin-bottom: 6px; }
      .sub-heading { font-weight: bold; font-size: 13pt; margin-top: 10px; margin-bottom: 4px; }
      .indent-p { margin: 4px 0 6px 0; padding-left: 20px; text-align: justify; white-space: pre-line; }
      .signature-table { margin-top: 25px; border: none; }
      .signature-table td { border: none; padding: 4px; text-align: center; vertical-align: top; }
    </style>
  </head>
  <body>
    <table class="table-header">
      <tr>
        <td style="width: 50%; text-align: left;">
          <div style="font-weight: bold; font-size: 11pt;">${data.tinhUy}</div>
          <div style="font-weight: bold; font-size: 11.5pt;">${data.huyenUy}</div>
          <div style="font-size: 12pt;">CHI BỘ: ${data.chiBo}</div>
        </td>
        <td style="width: 50%; text-align: center;">
          <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase;">ĐẢNG CỘNG SẢN VIỆT NAM</div>
          <div style="font-style: italic; font-size: 12pt; margin-top: 4px;">${data.diaDanh}, ngày ${data.ngayKhai} tháng ${data.thangKhai} năm ${data.namKhai}</div>
        </td>
      </tr>
    </table>

    <div class="title-box">
      <div style="font-size: 11pt; font-weight: bold; text-align: right;">Mẫu 01-HD KĐ.ĐG 2026</div>
      <h1 class="title-main">BÁO CÁO KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG<br>CỦA TẬP THỂ ${tenInHoa}</h1>
      <div class="title-sub">Năm ${data.namKiemDiem}</div>
      <div style="font-style: italic; font-size: 11pt;">(Ban hành kèm theo Hướng dẫn số 397-HD/ĐU ngày 20/11/2026 của Đảng ủy Trường Cao đẳng Bách khoa Nam Sài Gòn)</div>
    </div>

    <p style="text-align: justify;">Căn cứ kết quả lãnh đạo, chỉ đạo thực hiện nhiệm vụ chính trị tại đơn vị, tập thể <strong>${data.tenTapThe}</strong> kiểm điểm, tự đánh giá, xếp loại chất lượng với các nội dung chủ yếu sau:</p>

    <div class="section-heading">A. NỘI DUNG KIỂM ĐIỂM</div>
    <div class="sub-heading">I. Ưu điểm, kết quả đạt được</div>
    <p><strong>1. Việc chấp hành Cương lĩnh chính trị, Điều lệ Đảng, nghị quyết, chỉ thị của Đảng, pháp luật của Nhà nước; nguyên tắc tập trung dân chủ:</strong></p>
    <div class="indent-p">${data.uuDiemChapHanhDuongLoi}</div>

    <p><strong>2. Kết quả thực hiện các mục tiêu, chỉ tiêu, nhiệm vụ được giao trong năm:</strong></p>
    <div class="indent-p">${data.uuDiemThucHienMucTieu}</div>

    <p><strong>3. Công tác xây dựng, chỉnh đốn Đảng và hệ thống chính trị; xây dựng bộ máy tinh gọn, hiệu lực, hiệu quả gắn với cải cách hành chính, chuyển đổi số (Nghị quyết 57-NQ/TW):</strong></p>
    <div class="indent-p">${data.uuDiemXayDungChinhDonDang}</div>

    <p><strong>4. Trách nhiệm của tập thể lãnh đạo, quản lý trong triển khai thực hiện nhiệm vụ chính trị:</strong></p>
    <div class="indent-p">${data.uuDiemTrachNhiemLanhDao}</div>

    <div class="sub-heading">II. Hạn chế, khuyết điểm và nguyên nhân</div>
    <p><strong>1. Hạn chế, khuyết điểm:</strong></p>
    <div class="indent-p">${data.hanCheKhuyetDiem}</div>
    <p><strong>2. Nguyên nhân:</strong></p>
    <div class="indent-p">- Nguyên nhân khách quan: ${data.nguyenNhanKhachQuan}<br>- Nguyên nhân chủ quan: ${data.nguyenNhanChuQuan}</div>

    <div class="sub-heading">III. Kết quả khắc phục những hạn chế, khuyết điểm ở kỳ kiểm điểm trước</div>
    <div class="indent-p">${data.ketQuaKhacPhucNamTruoc}</div>

    <div class="sub-heading">IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)</div>
    <div class="indent-p">${data.giaiTrinhGoiYKiemDiem}</div>

    <div class="sub-heading">V. Trách nhiệm của tập thể, cá nhân</div>
    <div class="indent-p">${data.trachNhiemTapTheCaNhan}</div>

    <div class="sub-heading">VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm</div>
    <div class="indent-p">${data.phuongHuongKhacPhuc}</div>

    <div class="section-heading" style="margin-top: 16px;">B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI</div>
    <div class="sub-heading">I. Đánh giá theo các nhóm tiêu chí (Phụ lục 2 - Hướng dẫn 397-HD/ĐU)</div>
    <p style="padding-left: 20px;">
      1. Nhóm tiêu chí chung: <strong>${data.diemTieuChiChung}/30 điểm</strong><br>
      2. Nhóm tiêu chí về kết quả thực hiện nhiệm vụ: <strong>${data.diemThucHienNhiemVu}/70 điểm</strong><br>
      => <strong>Tổng điểm đánh giá: ${data.diemTieuChiChung + data.diemThucHienNhiemVu}/100 điểm</strong>
    </p>

    <div class="sub-heading">II. Đề xuất xếp loại mức chất lượng</div>
    <p style="padding-left: 20px; font-weight: bold; font-size: 13.5pt; color: #b91c1c;">
      ☑ ${data.tuXepLoaiTapThe}
    </p>

    <table class="signature-table">
      <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%;">
          <div style="font-weight: bold; text-transform: uppercase;">T/M TẬP THỂ LÃNH ĐẠO, QUẢN LÝ</div>
          <div style="font-style: italic;">(Ký, ghi rõ họ tên và đóng dấu)</div>
          <div style="height: 75px;"></div>
          <div style="font-weight: bold;">...................................................</div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
  triggerDownload(htmlDoc, `Bao_Cao_Kiem_Diem_Tap_The_Mau_01_${data.tenTapThe.replace(/\s+/g, '_')}_${data.namKiemDiem}.doc`);
}

export function exportPartyReview02CStudentDocx(data: PartyReview02CStudentData) {
  const hoTenInHoa = (data.hoVaTen || '...........................................').toUpperCase();
  const htmlDoc = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>Bản kiểm điểm Đảng viên Học sinh Sinh viên Mẫu 02C - ${hoTenInHoa}</title>
    <!--[if gte mso 9]>
    <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml>
    <![endif]-->
    <style>
      @page { size: 210mm 297mm; margin: 20mm 15mm 20mm 20mm; }
      body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.35; color: #000; }
      table { width: 100%; border-collapse: collapse; }
      .table-header td { border: none; padding: 1px 4px; vertical-align: top; }
      .title-box { text-align: center; margin: 15px 0 20px 0; }
      .title-main { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 4px 0; }
      .title-sub { font-size: 13pt; font-weight: bold; margin-bottom: 4px; }
      .section-heading { font-weight: bold; font-size: 13pt; text-transform: uppercase; margin-top: 14px; margin-bottom: 6px; }
      .sub-heading { font-weight: bold; font-size: 13pt; margin-top: 10px; margin-bottom: 4px; }
      .indent-p { margin: 4px 0 6px 0; padding-left: 20px; text-align: justify; white-space: pre-line; }
      .signature-table { margin-top: 25px; border: none; }
      .signature-table td { border: none; padding: 4px; text-align: center; vertical-align: top; }
    </style>
  </head>
  <body>
    <table class="table-header">
      <tr>
        <td style="width: 50%; text-align: left;">
          <div style="font-weight: bold; font-size: 11pt;">${data.tinhUy}</div>
          <div style="font-weight: bold; font-size: 11.5pt;">${data.huyenUy}</div>
          <div style="font-size: 12pt;">Chi bộ: ${data.chiBo}</div>
        </td>
        <td style="width: 50%; text-align: center;">
          <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase;">ĐẢNG CỘNG SẢN VIỆT NAM</div>
          <div style="font-style: italic; font-size: 12pt; margin-top: 4px;">${data.diaDanh}, ngày ${data.ngayKhai} tháng ${data.thangKhai} năm ${data.namKhai}</div>
        </td>
      </tr>
    </table>

    <div class="title-box">
      <div style="font-size: 11pt; font-weight: bold; text-align: right;">Mẫu 02C-HD KĐ.ĐG 2026</div>
      <h1 class="title-main">BẢN KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CÁ NHÂN</h1>
      <div class="title-sub">Năm ${data.namKiemDiem}</div>
      <div style="font-weight: bold; font-size: 12.5pt;">(Đảng viên là học sinh, sinh viên)</div>
      <div style="font-style: italic; font-size: 11pt;">(Ban hành kèm theo Hướng dẫn số 397-HD/ĐU ngày 20/11/2026 của Đảng ủy Trường Cao đẳng Bách khoa Nam Sài Gòn)</div>
    </div>

    <table style="width: 100%; border: none; margin: 4px 0;">
      <tr>
        <td style="width: 50%; border: none;">- Họ và tên: <strong style="text-transform: uppercase;">${hoTenInHoa}</strong></td>
        <td style="width: 50%; border: none;">- Ngày sinh: <strong>${data.namSinh || '................'}</strong></td>
      </tr>
      <tr>
        <td style="width: 50%; border: none;">- Lớp: <strong>${data.lop}</strong> (${data.khoa})</td>
        <td style="width: 50%; border: none;">- Chi bộ: <strong>${data.chiBoSinhHoat || data.chiBo}</strong></td>
      </tr>
      <tr>
        <td colspan="2" style="border: none;">- Đơn vị học tập/công tác: <strong>${data.donViCongTac}</strong></td>
      </tr>
    </table>

    <div class="section-heading">A. NỘI DUNG KIỂM ĐIỂM</div>
    <div class="sub-heading">I. Ưu điểm, kết quả đạt được</div>
    <p><strong>1. Về phẩm chất chính trị, đạo đức, lối sống; ý thức tổ chức kỷ luật, trách nhiệm nêu gương; tác phong, lề lối làm việc:</strong></p>
    <div class="indent-p">${data.uuDiemPhamChatChinhTri}</div>

    <p><strong>2. Việc thực hiện quyền và nghĩa vụ đảng viên; tinh thần trách nhiệm, gương mẫu trong học tập và rèn luyện:</strong></p>
    <div class="indent-p">${data.uuDiemThucHienNhiemVu}</div>

    <p><strong>3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu; nội dung tự soi, tự sửa:</strong></p>
    <div class="indent-p">${data.uuDiemCamKetTuDuong}</div>

    <div class="sub-heading">II. Hạn chế, khuyết điểm và nguyên nhân</div>
    <p><strong>1. Hạn chế, khuyết điểm:</strong></p>
    <div class="indent-p">${data.hanCheKhuyetDiem}</div>
    <p><strong>2. Nguyên nhân:</strong></p>
    <div class="indent-p">- Nguyên nhân khách quan: ${data.nguyenNhanKhachQuan}<br>- Nguyên nhân chủ quan: ${data.nguyenNhanChuQuan}</div>

    <div class="sub-heading">III. Kết quả khắc phục hạn chế kỳ kiểm điểm trước</div>
    <div class="indent-p">${data.ketQuaKhacPhucNamTruoc}</div>

    <div class="sub-heading">IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)</div>
    <div class="indent-p">${data.giaiTrinhGoiYKiemDiem}</div>

    <div class="sub-heading">V. Làm rõ trách nhiệm cá nhân đối với hạn chế của tập thể (nếu có)</div>
    <div class="indent-p">${data.trachNhiemCaNhan}</div>

    <div class="sub-heading">VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm</div>
    <div class="indent-p">${data.phuongHuongKhacPhuc}</div>

    <div class="section-heading" style="margin-top: 16px;">B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI</div>
    <div class="sub-heading">I. Đánh giá theo các nhóm tiêu chí (Phụ lục 5 - Hướng dẫn 397-HD/ĐU)</div>
    <p style="padding-left: 20px;">
      1. Nhóm tiêu chí chung: <strong>${data.diemTieuChiChung}/30 điểm</strong><br>
      2. Nhóm tiêu chí về kết quả thực hiện nhiệm vụ: <strong>${data.diemThucHienNhiemVu}/70 điểm</strong><br>
      => <strong>Tổng điểm tự chấm: ${data.diemTieuChiChung + data.diemThucHienNhiemVu}/100 điểm</strong>
    </p>

    <div class="sub-heading">II. Đề xuất xếp loại mức chất lượng</div>
    <p style="padding-left: 20px; font-weight: bold; font-size: 13.5pt; color: #b91c1c;">
      ☑ ${data.tuXepLoaiDangVien}
    </p>

    <table class="signature-table">
      <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%;">
          <div style="font-weight: bold; text-transform: uppercase;">NGƯỜI TỰ KIỂM ĐIỂM</div>
          <div style="font-style: italic;">(Ký, ghi rõ họ tên)</div>
          <div style="height: 75px;"></div>
          <div style="font-weight: bold;">${hoTenInHoa}</div>
        </td>
      </tr>
    </table>

    <div class="section-heading" style="margin-top: 24px;">C. KẾT QUẢ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG ĐẢNG VIÊN</div>
    <p>- Nhận xét, đánh giá của chi ủy: ......................................................................................................................</p>
    <p>- Chi bộ đề xuất xếp loại mức chất lượng: ..........................................................................................................</p>
    
    <table class="signature-table" style="margin-top: 15px;">
      <tr>
        <td style="width: 50%;">
          <div style="font-weight: bold; text-transform: uppercase;">T/M CHI ỦY (CHI BỘ)</div>
          <div style="font-style: italic;">(Xác lập thời điểm, ký, ghi rõ họ tên)</div>
          <div style="height: 65px;"></div>
          <div style="font-weight: bold;">...................................................</div>
        </td>
        <td style="width: 50%;">
          <div style="font-weight: bold; text-transform: uppercase;">T/M BAN THƯỜNG VỤ ĐẢNG ỦY</div>
          <div style="font-style: italic;">(Xác lập thời điểm, ký, ghi rõ họ tên và đóng dấu)</div>
          <div style="height: 65px;"></div>
          <div style="font-weight: bold;">...................................................</div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
  triggerDownload(htmlDoc, `Ban_Kiem_Diem_Dang_Vien_HSSV_Mau_02C_${(data.hoVaTen || 'Sinh_Vien').replace(/\s+/g, '_')}_${data.namKiemDiem}.doc`);
}

function triggerDownload(htmlContent: string, fileName: string) {
  const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

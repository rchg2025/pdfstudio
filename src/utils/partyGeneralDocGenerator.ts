import { type PartyDocumentTemplate } from '../data/partyTemplatesCatalog';

interface DocumentExportOptions {
  hoVaTen?: string;
  namSinh?: string;
  chucVu?: string;
  donVi?: string;
  chiBo?: string;
  dangBoCoSo?: string;
  huyenUy?: string;
  tinhUy?: string;
  diaDanh?: string;
  customBody?: string;
}

export function generatePartyDocHtml(template: PartyDocumentTemplate, options: DocumentExportOptions = {}): string {
  const huyenUy = options.huyenUy || 'ĐẢNG BỘ CÁC TRƯỜNG CAO ĐẲNG ĐẠI HỌC TP.HCM';
  const dangBoCoSo = options.dangBoCoSo || 'Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn';
  const chiBo = options.chiBo || 'Chi bộ 1';
  const diaDanh = options.diaDanh || 'Thành phố Hồ Chí Minh';
  const hoVaTen = (options.hoVaTen || '...................................................').toUpperCase();
  const namSinh = options.namSinh || '..../..../19....';
  const chucVu = options.chucVu || '...................................................';
  const donVi = options.donVi || 'Trường Cao đẳng Bách khoa Nam Sài Gòn';

  let specificBodyContent = '';
  let rightSignTitle = 'NGƯỜI LÀM ĐƠN / NGƯỜI KHAI';
  let leftSignTitle = 'T/M CHI ỦY CHI BỘ';
  let leftSignSub = '(Ký, ghi rõ họ tên)';

  switch (template.id) {
    // 1. Bản cam kết tu dưỡng rèn luyện phấn đấu
    case 'ban-cam-ket-tu-duong':
      rightSignTitle = 'ĐẢNG VIÊN CAM KẾT';
      leftSignTitle = 'Ý KIẾN CỦA CHI ỦY / CHI BỘ';
      specificBodyContent = `
        <div style="margin: 15px 0;">
          <p class="content-p">Họ và tên: <strong>${hoVaTen}</strong></p>
          <p class="content-p">Ngày, tháng, năm sinh: <strong>${namSinh}</strong></p>
          <p class="content-p">Chức vụ Đảng: <strong>Đảng viên</strong>. Chức vụ chính quyền/chuyên môn: <strong>${chucVu}</strong></p>
          <p class="content-p">Sinh hoạt tại Chi bộ: <strong>${chiBo}</strong> thuộc <strong>${dangBoCoSo}</strong></p>
        </div>

        <p class="content-p">Sau khi nghiên cứu, học tập các nghị quyết, quy định của Đảng, Điều lệ Đảng và căn cứ vào chức trách, nhiệm vụ chuyên môn được giao năm 2026, tôi xin cam kết tu dưỡng, rèn luyện, phấn đấu cụ thể như sau:</p>

        <p class="doc-sec-h">1. Về tư tưởng chính trị</p>
        <p class="content-p">- Tuyệt đối trung thành với chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh và đường lối đổi mới của Đảng; kiên định mục tiêu độc lập dân tộc và chủ nghĩa xã hội.</p>
        <p class="content-p">- Chấp hành nghiêm Cương lĩnh chính trị, Điều lệ Đảng, các nghị quyết, chỉ thị của Đảng, chính sách, pháp luật của Nhà nước.</p>
        <p class="content-p">- Tích cực tự giác học tập nâng cao trình độ lý luận chính trị, chuyên môn nghiệp vụ. Kiên quyết đấu tranh phản bác các quan điểm sai trái, thù địch; phòng chống suy thoái về tư tưởng chính trị, "tự diễn biến", "tự chuyển hóa" trong nội bộ.</p>

        <p class="doc-sec-h">2. Về phẩm chất đạo đức, lối sống, tác phong</p>
        <p class="content-p">- Tích cực học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh theo Kết luận số 01-KL/TW gắn với việc thực hiện Nghị quyết Trung ương 4 khóa XII, XIII.</p>
        <p class="content-p">- Giữ gìn phẩm chất đạo đức trong sáng, lối sống giản dị, khiêm tốn, trung thực, lành mạnh; thực hiện cần, kiệm, liêm, chính, chí công vô tư.</p>
        <p class="content-p">- Gương mẫu thực hiện nghĩa vụ công dân nơi cư trú theo Quy định số 213-QĐ/TW; chấp hành nghiêm Quy định số 37-QĐ/TW về những điều đảng viên không được làm.</p>
        <p class="content-p">- Kiên quyết đấu tranh phòng, chống tham nhũng, lãng phí, tiêu cực; giữ gìn đoàn kết nội bộ.</p>

        <p class="doc-sec-h">3. Về thực hiện chức trách, nhiệm vụ được giao</p>
        <p class="content-p">- Nêu cao tinh thần trách nhiệm, tận tụy, chủ động, sáng tạo trong giảng dạy, nghiên cứu khoa học và công tác chuyên môn tại đơn vị <strong>${donVi}</strong>.</p>
        <p class="content-p">- Hoàn thành 100% định mức chỉ tiêu khối lượng công việc năm 2026 với chất lượng cao; tích cực đổi mới phương pháp làm việc và ứng dụng chuyển đổi số.</p>

        <p class="doc-sec-h">4. Về ý thức tổ chức kỷ luật</p>
        <p class="content-p">- Chấp hành nghiêm nguyên tắc tập trung dân chủ, tập thể lãnh đạo, cá nhân phụ trách; thực hiện tốt tự phê bình và phê bình.</p>
        <p class="content-p">- Chấp hành tuyệt đối sự phân công của tổ chức Đảng và lãnh đạo đơn vị; tham gia đầy đủ các buổi sinh hoạt chi bộ định kỳ và đóng đảng phí đúng quy định.</p>

        <p class="doc-sec-h">5. Kế hoạch khắc phục hạn chế, khuyết điểm năm trước</p>
        <p class="content-p">- Chủ động sắp xếp thời gian làm việc khoa học, khắc phục tình trạng nể nang, e ngại; tích cực phát biểu thảo luận và đóng góp ý kiến xây dựng Nghị quyết Chi bộ.</p>

        <p class="content-p">Tôi xin nghiêm túc thực hiện bản cam kết này; thường xuyên để Chi bộ, đoàn thể và đồng nghiệp giám sát, đánh giá làm cơ sở kiểm điểm, xếp loại đảng viên cuối năm.</p>
      `;
      break;

    // 2. Đơn xin vào Đảng (Mẫu 1-KNĐ)
    case 'don-xin-vao-dang':
      rightSignTitle = 'NGƯỜI LÀM ĐƠN';
      leftSignTitle = '';
      specificBodyContent = `
        <div style="text-align: center; margin: 15px 0;">
          <p style="margin: 3px 0;"><strong>Kính gửi:</strong></p>
          <p style="margin: 3px 0;">- Chi ủy: <strong>${chiBo}</strong></p>
          <p style="margin: 3px 0;">- Đảng ủy: <strong>${dangBoCoSo}</strong></p>
        </div>

        <p class="content-p">Tôi là: <strong>${hoVaTen}</strong>. Sinh ngày: <strong>${namSinh}</strong></p>
        <p class="content-p">Nơi sinh: ................................................................. Quê quán: .................................................................</p>
        <p class="content-p">Nơi cư trú: ..................................................................................................................................................</p>
        <p class="content-p">Nghề nghiệp: ........................................................... Đơn vị công tác: <strong>${donVi}</strong></p>
        <p class="content-p">Chức vụ chính quyền, đoàn thể: <strong>${chucVu}</strong></p>
        <p class="content-p">Vào Đoàn TNCS Hồ Chí Minh ngày: ....../....../.......... Tại: .......................................................................</p>
        <p class="content-p">Được công nhận là người cảm tình Đảng ngày: ....../....../.......... Tại Chi bộ: <strong>${chiBo}</strong></p>

        <p class="content-p">Qua quá trình tìm hiểu về Điều lệ Đảng Cộng sản Việt Nam; được sự giáo dục, bồi dưỡng của Chi bộ, các đoàn thể và đồng chí đảng viên được phân công giúp đỡ, tôi nhận thức sâu sắc rằng: Đảng Cộng sản Việt Nam là đội tiên phong của giai cấp công nhân, đại biểu trung thành lợi ích của nhân dân lao động và của toàn dân tộc Việt Nam. Mục đích của Đảng là xây dựng một nước Việt Nam độc lập, dân chủ, giàu mạnh, xã hội công bằng, văn minh, thực hiện thành công chủ nghĩa xã hội và chủ nghĩa cộng sản.</p>

        <p class="content-p">Bản thân tôi luôn rèn luyện, giữ gìn đạo đức lối sống lành mạnh, hoàn thành tốt nhiệm vụ chuyên môn được giao. Nay có đủ điều kiện và với nguyện vọng tha thiết được cống hiến lâu dài dưới cờ Đảng, tôi làm đơn này kính đề nghị Chi ủy <strong>${chiBo}</strong> và Đảng ủy <strong>${dangBoCoSo}</strong> xem xét, kết nạp tôi vào hàng ngũ của Đảng Cộng sản Việt Nam.</p>

        <p class="content-p"><strong>Tôi xin hứa:</strong></p>
        <p class="content-p">1. Tuyệt đối trung thành với mục đích lý tưởng cách mạng của Đảng, chấp hành nghiêm chỉnh Cương lĩnh chính trị, Điều lệ Đảng, nghị quyết, chỉ thị của Đảng, pháp luật của Nhà nước; phục tùng tuyệt đối sự phân công và điều động của Đảng.</p>
        <p class="content-p">2. Không ngừng học tập, rèn luyện nâng cao trình độ chuyên môn, phẩm chất chính trị, đạo đức cách mạng.</p>
        <p class="content-p">3. Giữ mối liên hệ mật thiết với nhân dân, tôn trọng và phát huy quyền làm chủ của nhân dân.</p>
        <p class="content-p">4. Tích cực tham gia xây dựng, bảo vệ tổ chức Đảng; giữ gìn đoàn kết thống nhất trong Đảng.</p>

        <p class="content-p">Kính mong Chi bộ và Đảng ủy xem xét, tạo điều kiện giúp đỡ!</p>
      `;
      break;

    // 3. Bản tự kiểm điểm đảng viên dự bị sau 12 tháng (Mẫu 10-KNĐ)
    case 'ban-tu-kiem-diem-dang-vien-du-bi':
      rightSignTitle = 'NGƯỜI TỰ KIỂM ĐIỂM';
      leftSignTitle = 'Ý KIẾN CỦA CHI BỘ';
      leftSignSub = '(Tóm tắt ý kiến nhận xét và biểu quyết)';
      specificBodyContent = `
        <div style="text-align: center; margin: 15px 0;">
          <p style="margin: 3px 0;"><strong>Kính gửi:</strong></p>
          <p style="margin: 3px 0;">- Chi ủy: <strong>${chiBo}</strong></p>
          <p style="margin: 3px 0;">- Đảng ủy: <strong>${dangBoCoSo}</strong></p>
        </div>

        <p class="content-p">Tôi là: <strong>${hoVaTen}</strong>. Sinh ngày: <strong>${namSinh}</strong></p>
        <p class="content-p">Chức vụ chuyên môn: <strong>${chucVu}</strong>. Đơn vị công tác: <strong>${donVi}</strong></p>
        <p class="content-p">Được kết nạp vào Đảng ngày: ....../....../2025. Tại Chi bộ: <strong>${chiBo}</strong></p>
        <p class="content-p">Hiện sinh hoạt tại Chi bộ: <strong>${chiBo}</strong> thuộc <strong>${dangBoCoSo}</strong></p>

        <p class="content-p">Trải qua thời gian 12 tháng dự bị rèn luyện và phấn đấu, tôi xin tự kiểm điểm trước Chi bộ các mặt công tác như sau:</p>

        <p class="doc-sec-h">I. Ưu điểm</p>
        <p class="content-p"><strong>1. Về tư tưởng chính trị:</strong> Tuyệt đối kiên định chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh; chấp hành nghiêm túc mọi chủ trương, đường lối, nghị quyết của Đảng và chính sách, pháp luật của Nhà nước. Thường xuyên nghiên cứu, học tập nâng cao bản lĩnh chính trị.</p>
        <p class="content-p"><strong>2. Về phẩm chất đạo đức, lối sống:</strong> Luôn giữ gìn đạo đức trong sáng, lối sống lành mạnh; trung thực, khiêm tốn; chấp hành nghiêm Quy định về những điều đảng viên không được làm. Luôn có tinh thần đoàn kết, giúp đỡ đồng nghiệp, giữ mối liên hệ tốt với nhân dân nơi cư trú.</p>
        <p class="content-p"><strong>3. Về thực hiện nhiệm vụ được giao:</strong> Nêu cao tinh thần trách nhiệm, hoàn thành 100% nhiệm vụ chuyên môn và công việc đột xuất do đơn vị, khoa, chi bộ phân công với chất lượng tốt.</p>
        <p class="content-p"><strong>4. Về ý thức tổ chức kỷ luật:</strong> Chấp hành nghiêm sự lãnh đạo của Chi ủy, Chi bộ; dự sinh hoạt chi bộ đầy đủ, đúng giờ; đóng đảng phí đầy đủ, đúng kỳ hạn.</p>

        <p class="doc-sec-h">II. Khuyết điểm, hạn chế</p>
        <p class="content-p">- Đôi lúc trong sinh hoạt chi bộ còn e dè, chưa tích cực phát biểu tranh luận sâu.</p>
        <p class="content-p">- Cần nâng cao hơn nữa kỹ năng nghiên cứu khoa học và ứng dụng công nghệ mới.</p>

        <p class="doc-sec-h">III. Phương hướng khắc phục</p>
        <p class="content-p">- Chủ động nghiên cứu tài liệu trước mỗi kỳ sinh hoạt để tích cực đóng góp ý kiến; không ngừng học hỏi từ các đồng chí đảng viên đi trước.</p>

        <p class="content-p">Căn cứ quá trình rèn luyện, tôi nhận thấy mình đã đủ điều kiện chuyển thành đảng viên chính thức. Kính đề nghị Chi bộ và Đảng ủy cấp trên xem xét quyết định công nhận tôi là <strong>Đảng viên chính thức</strong>.</p>
      `;
      break;

    // 4. Biên bản sinh hoạt chi bộ thường kỳ
    case 'bien-ban-sinh-hoat-chi-bo':
      rightSignTitle = 'THƯ KÝ HỘI NGHỊ';
      leftSignTitle = 'CHỦ TRÌ HỘI NGHỊ / BÍ THƯ';
      specificBodyContent = `
        <div style="margin: 15px 0;">
          <p class="content-p">Hôm nay, vào hồi ...... giờ ...... ngày ...... tháng ...... năm 2026.</p>
          <p class="content-p">Tại phòng họp: <strong>${donVi}</strong></p>
          <p class="content-p">Chi bộ: <strong>${chiBo}</strong> thuộc <strong>${dangBoCoSo}</strong> tiến hành kỳ họp sinh hoạt chi bộ định kỳ tháng ...... năm 2026.</p>
        </div>

        <p class="doc-sec-h">I. Thành phần tham dự</p>
        <p class="content-p">- Tổng số đảng viên của Chi bộ: ...... đồng chí (Chính thức: ......, Dự bị: ......)</p>
        <p class="content-p">- Số đảng viên có mặt: ...... đồng chí. Số vắng mặt: ...... đồng chí (Có lý do: ......, Không lý do: ......)</p>
        <p class="content-p">- Chủ trì hội nghị: Đồng chí ............................................. - Bí thư Chi bộ</p>
        <p class="content-p">- Thư ký hội nghị: Đồng chí ............................................. - Đảng viên</p>

        <p class="doc-sec-h">II. Nội dung cuộc họp</p>
        <p class="content-p"><strong>1. Thông tin thời sự, phổ biến văn bản cấp trên:</strong> Quán triệt các chỉ thị, nghị quyết của Đảng ủy cấp trên; tình hình chính trị - xã hội trong tháng.</p>
        <p class="content-p"><strong>2. Đánh giá công tác lãnh đạo tháng qua:</strong> Chi bộ đánh giá toàn diện công tác tư tưởng chính trị, đạo đức lối sống, kết quả hoàn thành nhiệm vụ chuyên môn, công tác phát triển Đảng và sinh hoạt chi bộ.</p>
        <p class="content-p"><strong>3. Triển khai phương hướng, nhiệm vụ tháng tới:</strong> Đề ra các chỉ tiêu trọng tâm về đào tạo, quản lý sinh viên/học viên, chuyên môn, kiểm tra giám sát và phân công đảng viên phụ trách.</p>
        <p class="content-p"><strong>4. Ý kiến thảo luận:</strong> Hội nghị đã có ...... lượt ý kiến phát biểu đóng góp sôi nổi, dân chủ, thẳng thắn của các đồng chí đảng viên.</p>

        <p class="doc-sec-h">III. Kết luận và biểu quyết</p>
        <p class="content-p">- Đồng chí Bí thư Chi bộ kết luận, tiếp thu toàn bộ ý kiến thảo luận và chỉ đạo kế hoạch thực hiện nhiệm vụ tháng tới.</p>
        <p class="content-p">- Toàn thể đảng viên dự họp tiến hành biểu quyết thông qua Nghị quyết Chi bộ với tỷ lệ tán thành: <strong>100%</strong>.</p>
        <p class="content-p">Cuộc họp bế mạc vào lúc ...... giờ ...... cùng ngày; biên bản đã được đọc lại cho toàn thể hội nghị nghe và nhất trí thông qua.</p>
      `;
      break;

    // 5. Đơn xin chuyển sinh hoạt Đảng
    case 'don-xin-chuyen-sinh-hoat-dang':
      rightSignTitle = 'NGƯỜI LÀM ĐƠN';
      leftSignTitle = 'Ý KIẾN XÁC NHẬN CỦA CHI BỘ';
      specificBodyContent = `
        <div style="text-align: center; margin: 15px 0;">
          <p style="margin: 3px 0;"><strong>Kính gửi:</strong></p>
          <p style="margin: 3px 0;">- Chi ủy Chi bộ: <strong>${chiBo}</strong></p>
          <p style="margin: 3px 0;">- Đảng ủy: <strong>${dangBoCoSo}</strong></p>
        </div>

        <p class="content-p">Tôi là: <strong>${hoVaTen}</strong>. Sinh ngày: <strong>${namSinh}</strong></p>
        <p class="content-p">Ngày vào Đảng: ....../....../.......... Ngày chính thức: ....../....../..........</p>
        <p class="content-p">Số thẻ đảng viên: ............................................ Số lý lịch đảng viên: ............................................</p>
        <p class="content-p">Hiện đang sinh hoạt tại Chi bộ: <strong>${chiBo}</strong> thuộc Đảng bộ: <strong>${dangBoCoSo}</strong></p>

        <p class="doc-sec-h">LÝ DO XIN CHUYỂN SINH HOẠT ĐẢNG:</p>
        <p class="content-p">Do thay đổi vị trí công tác / nơi ở mới / phân công nhiệm vụ mới, tôi làm đơn này kính đề nghị Chi ủy và Đảng ủy làm thủ tục cho tôi được chuyển sinh hoạt Đảng chính thức đến:</p>
        <p class="content-p">- Chi bộ mới: .........................................................................................................................................</p>
        <p class="content-p">- Trực thuộc Đảng bộ: ............................................................................................................................</p>

        <p class="content-p">Tôi đã hoàn thành mọi nghĩa vụ đảng viên, đóng đảng phí đầy đủ đến tháng ...... năm 2026 và xin bàn giao hồ sơ theo đúng quy định.</p>
        <p class="content-p">Kính mong Chi ủy và Đảng ủy quan tâm giải quyết!</p>
      `;
      break;

    // 6. Tờ khai đề nghị tặng Huy hiệu Đảng
    case 'to-khai-de-nghi-tang-huy-hieu-dang':
      rightSignTitle = 'NGƯỜI KÊ KHAI';
      leftSignTitle = 'XÁC NHẬN CỦA CHI BỘ';
      leftSignSub = '(Ký, ghi rõ họ tên và chức vụ)';
      specificBodyContent = `
        <div style="text-align: center; margin: 15px 0;">
          <p style="margin: 3px 0;"><strong>Kính gửi:</strong></p>
          <p style="margin: 3px 0;">- Chi ủy: <strong>${chiBo}</strong></p>
          <p style="margin: 3px 0;">- Ban Thường vụ Đảng ủy: <strong>${huyenUy}</strong></p>
        </div>

        <p class="content-p">Tôi là: <strong>${hoVaTen}</strong>. Giới tính: ....................</p>
        <p class="content-p">Sinh ngày: <strong>${namSinh}</strong>. Quê quán: ..................................................................................</p>
        <p class="content-p">Ngày vào Đảng: ....../....../.......... Ngày chính thức: ....../....../..........</p>
        <p class="content-p">Số thẻ đảng viên: ............................................ Số lý lịch: ............................................</p>
        <p class="content-p">Hiện đang sinh hoạt tại Chi bộ: <strong>${chiBo}</strong> thuộc <strong>${dangBoCoSo}</strong></p>

        <p class="doc-sec-h">TÓM TẮT QUÁ TRÌNH HOẠT ĐỘNG CÁCH MẠNG VÀ CÔNG TÁC:</p>
        <p class="content-p">- Tính đến ngày ...... tháng ...... năm 2026, bản thân tôi có đủ ...... năm tuổi Đảng liên tục.</p>
        <p class="content-p">- Trong suốt quá trình sinh hoạt Đảng, bản thân luôn giữ vững phẩm chất chính trị, đạo đức lối sống, chấp hành nghiêm Điều lệ Đảng và pháp luật của Nhà nước, không bị kỷ luật.</p>
        <p class="content-p">Đối chiếu với Quy định của Ban Chấp hành Trung ương Đảng, tôi làm bản khai này kính đề nghị các cấp ủy Đảng xem xét, quyết định trao tặng <strong>Huy hiệu ...... năm tuổi Đảng</strong> cho bản thân tôi.</p>
      `;
      break;

    // Mẫu tổng quát chuẩn thể thức cho các biểu mẫu còn lại
    default:
      if (options.customBody && options.customBody.trim()) {
        specificBodyContent = `
          <div style="margin: 15px 0;">
            <p class="content-p">Họ và tên: <strong>${hoVaTen}</strong></p>
            <p class="content-p">Ngày, tháng, năm sinh: <strong>${namSinh}</strong></p>
            <p class="content-p">Chức vụ Đảng: ....................................... Chức vụ chính quyền/chuyên môn: <strong>${chucVu}</strong></p>
            <p class="content-p">Đơn vị công tác: <strong>${donVi}</strong></p>
            <p class="content-p">Sinh hoạt tại Chi bộ: <strong>${chiBo}</strong> thuộc <strong>${dangBoCoSo}</strong></p>
          </div>

          <div style="margin: 20px 0;">
            <p class="doc-sec-h">NỘI DUNG VĂN BẢN (DO TRỢ LÝ AI SOẠN THẢO / CHUẨN HOÁ):</p>
            <div style="text-align: justify; line-height: 1.5;">
              ${options.customBody.replace(/\n/g, '<br/>')}
            </div>
          </div>
        `;
      } else {
        specificBodyContent = `
          <div style="margin: 15px 0;">
            <p class="content-p">Họ và tên: <strong>${hoVaTen}</strong></p>
            <p class="content-p">Ngày, tháng, năm sinh: <strong>${namSinh}</strong></p>
            <p class="content-p">Chức vụ Đảng: ....................................... Chức vụ chính quyền/chuyên môn: <strong>${chucVu}</strong></p>
            <p class="content-p">Đơn vị công tác: <strong>${donVi}</strong></p>
            <p class="content-p">Sinh hoạt tại Chi bộ: <strong>${chiBo}</strong> thuộc <strong>${dangBoCoSo}</strong></p>
          </div>

          <div style="margin: 20px 0;">
            <p class="doc-sec-h">NỘI DUNG VĂN BẢN VÀ CĂN CỨ THỰC HIỆN:</p>
            <p class="content-p">${template.desc}</p>
            <p class="content-p">Thực hiện theo đúng hướng dẫn: <strong>${template.guidance || 'Quy định Ban Bí thư & Hướng dẫn Ban Tổ chức Trung ương'}</strong>.</p>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
          </div>
        `;
      }
      break;
  }

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${template.title}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm 15mm 20mm 25mm;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 13pt;
          line-height: 1.35;
          color: #000000;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .header-table td {
          vertical-align: top;
        }
        .org-upper {
          font-size: 11pt;
          font-weight: bold;
          text-transform: uppercase;
          text-align: center;
          margin: 0;
        }
        .doc-title {
          font-size: 15pt;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          margin: 20px 0 6px 0;
        }
        .doc-sub {
          font-size: 12pt;
          font-style: italic;
          text-align: center;
          margin-bottom: 20px;
        }
        .doc-sec-h {
          font-size: 13pt;
          font-weight: bold;
          margin: 14px 0 6px 0;
          text-transform: uppercase;
        }
        .content-p {
          text-indent: 10mm;
          margin: 6px 0;
          text-align: justify;
        }
        .dotted-line {
          border-bottom: 1px dotted #888;
          height: 22px;
          margin-bottom: 6px;
        }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td style="width: 48%; text-align: center;">
            <p class="org-upper" style="font-size: 11pt;"><strong>${dangBoCoSo}</strong></p>
            <p class="org-upper"><strong>${chiBo}</strong></p>
            <div style="width: 80px; height: 1px; background: #000; margin: 4px auto 0 auto;"></div>
            <p style="margin: 2px 0 0 0; font-size: 10pt;">*</p>
          </td>
          <td style="width: 52%; text-align: center;">
            <p style="font-weight: bold; text-transform: uppercase; margin: 0; font-size: 11.5pt;"><u>ĐẢNG CỘNG SẢN VIỆT NAM</u></p>
            ${template.code ? `<p style="margin: 4px 0 0 0; font-size: 11pt; font-weight: bold;">${template.code}</p>` : ''}
            <p style="font-style: italic; margin: 8px 0 0 0; font-size: 11pt;">${diaDanh}, ngày ...... tháng ...... năm 2026</p>
          </td>
        </tr>
      </table>

      <div class="doc-title">${template.title}</div>
      ${template.guidance ? `<div class="doc-sub">(${template.guidance})</div>` : '<div style="height: 15px;"></div>'}

      ${specificBodyContent}

      <table style="width: 100%; margin-top: 35px; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; text-align: center; vertical-align: top;">
            ${leftSignTitle ? `
              <p style="font-weight: bold; margin: 0;">${leftSignTitle}</p>
              <p style="font-style: italic; font-size: 11pt; margin: 2px 0 65px 0;">${leftSignSub}</p>
              <p style="font-weight: bold; margin: 0;">...................................................</p>
            ` : ''}
          </td>
          <td style="width: 50%; text-align: center; vertical-align: top;">
            <p style="font-style: italic; font-size: 11pt; margin: 0;">${diaDanh}, ngày ..... tháng ..... năm 2026</p>
            <p style="font-weight: bold; margin: 4px 0 0 0;">${rightSignTitle}</p>
            <p style="font-style: italic; font-size: 11pt; margin: 2px 0 65px 0;">(Ký, ghi rõ họ tên)</p>
            <p style="font-weight: bold; margin: 0;">${options.hoVaTen ? options.hoVaTen.toUpperCase() : ''}</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

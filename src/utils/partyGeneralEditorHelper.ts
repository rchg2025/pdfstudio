import { type PartyDocumentTemplate } from '../data/partyTemplatesCatalog';

export interface PartyDocumentFormData {
  // Cấp ủy & hành chính
  tinhUy: string;
  huyenUy: string;
  dangBoCoSo: string;
  chiBo: string;
  diaDanh: string;
  ngayThang: string;

  // Cá nhân / Người lập
  hoVaTen: string;
  namSinh: string;
  chucVuDang: string;
  chucVuChinhQuyen: string;
  donViCongTac: string;
  ngayVaoDang: string;
  ngayChinhThuc: string;
  soTheDangVien: string;

  // Nội dung văn bản
  tieuDeVanBan: string;
  canCuVanBan: string;
  noiNhan: string;
  nguoiKyBenTrai: string;
  chucDanhBenTrai: string;
  nguoiKyBenPhai: string;
  chucDanhBenPhai: string;

  // Nội dung soạn thảo chi tiết (có thể sửa trực tiếp hoặc AI sinh)
  noiDungChinh: string;
}

export const defaultPartyDocumentFormData: PartyDocumentFormData = {
  tinhUy: 'THÀNH ỦY THÀNH PHỐ HỒ CHÍ MINH',
  huyenUy: 'ĐẢNG ỦY KHỐI ĐẠI HỌC, CAO ĐẲNG TP. HỒ CHÍ MINH',
  dangBoCoSo: 'Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn',
  chiBo: 'Chi bộ 5',
  diaDanh: 'Thành phố Hồ Chí Minh',
  ngayThang: 'ngày 22 tháng 11 năm 2026',

  hoVaTen: 'NGUYỄN VĂN A',
  namSinh: '15/08/1988',
  chucVuDang: 'Đảng viên',
  chucVuChinhQuyen: 'Giảng viên',
  donViCongTac: 'Khoa Công nghệ thông tin',
  ngayVaoDang: '03/02/2018',
  ngayChinhThuc: '03/02/2019',
  soTheDangVien: '12345678',

  tieuDeVanBan: '',
  canCuVanBan: '',
  noiNhan: '- Chi ủy Chi bộ;\n- Đảng ủy cơ sở;\n- Lưu chi bộ.',
  nguoiKyBenTrai: 'T/M CHI BỘ\nBÍ THƯ',
  chucDanhBenTrai: '(Ký, ghi rõ họ tên)',
  nguoiKyBenPhai: 'NGƯỜI LÀM ĐƠN / LẬP VĂN BẢN',
  chucDanhBenPhai: '(Ký, ghi rõ họ tên)',

  noiDungChinh: ''
};

// Gợi ý nội dung ban đầu theo template
export function getInitialTemplateContent(tmpl: PartyDocumentTemplate): string {
  // Bản mẫu chi tiết gợi ý sẵn cho một số nhóm thường dùng
  if (tmpl.id.includes('don-xin-vao-dang')) {
    return `Kính gửi: Chi ủy Chi bộ và Đảng ủy cơ sở.\n\nTôi là: NGUYỄN VĂN A, sinh ngày 15/08/1988.\nQuê quán: Xã Tân Kiên, Huyện Bình Chánh, TP. Hồ Chí Minh.\nNơi cư trú: Số 123 đường Cao Lỗ, Phường 4, Quận 8, TP. Hồ Chí Minh.\nTrình độ chuyên môn: Thạc sĩ Khoa học Máy tính.\nĐơn vị công tác: Khoa Công nghệ thông tin - Trường Cao đẳng Bách khoa Nam Sài Gòn.\n\nQua quá trình phấn đấu, rèn luyện và nghiên cứu Điều lệ Đảng Cộng sản Việt Nam, được sự giúp đỡ, giáo dục của Chi bộ và các đoàn thể, tôi nhận thức sâu sắc rằng:\n1. Đảng Cộng sản Việt Nam là đội tiên phong của giai cấp công nhân, đại biểu trung thành lợi ích của nhân dân lao động và của toàn dân tộc Việt Nam.\n2. Bản thân tôi luôn kiên định lý tưởng cách mạng, hoàn thành tốt nhiệm vụ giảng dạy và phục vụ người học, giữ gìn đạo đức lối sống lành mạnh, có tinh thần đoàn kết nội bộ.\n\nTôi làm đơn này tha thiết kính đề nghị Chi bộ và Ban Thường vụ Đảng ủy xem xét, kết nạp tôi vào hàng ngũ Đảng Cộng sản Việt Nam.\n\nTôi xin hứa:\n- Tuyệt đối trung thành với mục đích lý tưởng của Đảng, chấp hành nghiêm Cương lĩnh chính trị, Điều lệ Đảng, nghị quyết, chỉ thị của Đảng, chính sách, pháp luật của Nhà nước.\n- Không ngừng tự học tập, rèn luyện nâng cao trình độ chính trị và chuyên môn; giữ gìn đoàn kết thống nhất trong Đảng.\n- Gắn bó mật thiết với nhân dân, tôn trọng và phục vụ người học tận tụy; phục tùng tuyệt đối sự phân công của tổ chức Đảng.`;
  }

  if (tmpl.id.includes('kiem-diem-dang-vien-du-bi') || tmpl.id.includes('chuyen-chinh-thuc')) {
    return `Kính gửi: Chi ủy Chi bộ và Đảng ủy cơ sở.\n\nTôi được kết nạp vào Đảng ngày 03/02/2025 tại Chi bộ. Qua 12 tháng dự bị rèn luyện, tôi xin tự kiểm điểm như sau:\n\nI. ƯU ĐIỂM, KẾT QUẢ ĐẠT ĐƯỢC:\n1. Về tư tưởng chính trị: Luôn kiên định mục tiêu độc lập dân tộc và chủ nghĩa xã hội, chấp hành nghiêm túc mọi chủ trương, đường lối, chỉ thị, nghị quyết của Đảng, pháp luật của Nhà nước; không ngừng tự học tập bồi dưỡng lý luận chính trị.\n2. Về phẩm chất đạo đức, lối sống: Giữ gìn tác phong gương mẫu, khiêm tốn, trung thực, lành mạnh; chấp hành nghiêm Quy định 37-QĐ/TW về 19 điều đảng viên không được làm; gương mẫu nơi cư trú theo Quy định 213-QĐ/TW.\n3. Về thực hiện nhiệm vụ: Hoàn thành 100% khối lượng giờ giảng và nghiên cứu khoa học được giao, tích cực đổi mới phương pháp giảng dạy tương tác LMS.\n4. Về tổ chức kỷ luật: Dự sinh hoạt chi bộ đầy đủ, nghiêm túc chấp hành sự lãnh đạo của Chi ủy, đóng đảng phí đúng thời gian quy định.\n\nII. HẠN CHẾ VÀ PHƯƠNG HƯỚNG KHẮC PHỤC:\n- Hạn chế: Trong các buổi sinh hoạt chi bộ đôi lúc còn rụt rè, chưa phát biểu đóng góp nhiều ý kiến sâu sắc.\n- Phương hướng: Tích cực nghiên cứu tài liệu trước mỗi buổi sinh hoạt để đóng góp ý kiến xây dựng chi bộ vững mạnh hơn.\n\nTôi nhận thấy mình đã đủ điều kiện trở thành đảng viên chính thức, kính đề nghị Chi bộ xem xét và biểu quyết đề nghị chuyển đảng chính thức cho tôi.`;
  }

  if (tmpl.id.includes('sinh-hoat-chi-bo') || tmpl.id.includes('bien-ban-hop')) {
    return `I. THỜI GIAN, ĐỊA ĐIỂM, THÀNH PHẦN:\n- Thời gian: Vào hồi 14h00 ngày 22 tháng 11 năm 2026.\n- Địa điểm: Phòng họp Chi bộ, Trường Cao đẳng Bách khoa Nam Sài Gòn.\n- Thành phần: Tổng số đảng viên: 15 đồng chí (Chính thức: 14, Dự bị: 01). Có mặt: 15 đồng chí; Vắng mặt: 0.\n- Chủ trì: Đồng chí Bí thư Chi bộ.\n- Thư ký: Đồng chí Nguyễn Văn A.\n\nII. NỘI DUNG SINH HOẠT:\n1. Công tác tư tưởng chính trị: Quán triệt văn bản chỉ đạo của Đảng ủy cấp trên; học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh theo Kết luận số 01-KL/TW.\n2. Đánh giá tình hình công tác tháng qua: Chi bộ lãnh đạo hoàn thành xuất sắc tiến độ đào tạo, giảng dạy và công tác quản lý sinh viên.\n3. Phương hướng, nhiệm vụ trọng tâm tháng tới: Tổ chức kiểm tra chuyên đề, chuẩn bị kế hoạch công tác kiểm điểm đảng viên cuối năm, đôn đốc các tổ bộ môn hoàn thành định mức giờ giảng.\n4. Ý kiến thảo luận: Đã có 6 ý kiến thảo luận sôi nổi, tập trung vào giải pháp nâng cao chất lượng sinh hoạt chi bộ và chuyển đổi số trong quản lý sinh viên.\n\nIII. KẾT LUẬN VÀ BIỂU QUYẾT:\n- Đồng chí Bí thư Chi bộ tổng kết ý kiến, giao nhiệm vụ cho từng đồng chí đảng viên phụ trách.\n- Hội nghị tiến hành biểu quyết thông qua Nghị quyết kết luận với tỷ lệ: 100% tán thành.`;
  }

  if (tmpl.id.includes('chuyen-sinh-hoat')) {
    return `Kính gửi: Chi ủy Chi bộ và Đảng ủy cơ sở.\n\nTôi là: NGUYỄN VĂN A. Sinh ngày: 15/08/1988.\nNgày vào Đảng: 03/02/2018. Ngày chính thức: 03/02/2019.\nSố thẻ đảng viên: 12345678.\nHiện đang sinh hoạt tại Chi bộ 5 thuộc Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn.\n\nLÝ DO XIN CHUYỂN SINH HOẠT ĐẢNG:\nDo có sự điều động và thay đổi vị trí công tác (hoặc thay đổi nơi cư trú mới), tôi kính đề nghị Chi ủy và Ban Thường vụ Đảng ủy làm thủ tục cho tôi được chuyển sinh hoạt Đảng chính thức đến:\n- Chi bộ tiếp nhận mới: Chi bộ Cơ sở trực thuộc Đảng ủy Quận/Huyện ủy...\n- Địa chỉ nơi đến: TP. Hồ Chí Minh.\n\nTôi đã hoàn thành đầy đủ nghĩa vụ đảng viên, đóng đảng phí đầy đủ và bàn giao công việc theo đúng quy định. Kính mong cấp ủy xem xét giải quyết.`;
  }

  // Khung mặc định tiêu chuẩn cho các mẫu còn lại
  return `CĂN CỨ VÀ NỘI DUNG VĂN BẢN:\n1. Căn cứ Điều lệ Đảng Cộng sản Việt Nam và các Quy định, Hướng dẫn của Ban Bí thư, Ban Tổ chức Trung ương Đảng.\n2. Căn cứ Nghị quyết lãnh đạo của Đảng bộ cơ sở và Chương trình công tác năm 2026 của Chi bộ.\n3. Căn cứ chức trách, nhiệm vụ chuyên môn và vị trí việc làm được giao.\n\nNỘI DUNG THỰC HIỆN CHI TIẾT:\n- Mục đích, yêu cầu: Thực hiện nghiêm túc quy trình công tác nghiệp vụ xây dựng Đảng, bảo đảm tính dân chủ, kỷ cương và đúng thẩm quyền theo quy định.\n- Nội dung trọng tâm: Triển khai toàn diện theo đúng hướng dẫn nghiệp vụ: "${tmpl.title}".\n- Trách nhiệm của cán bộ, đảng viên: Nêu cao tinh thần trách nhiệm, tính tiền phong gương mẫu, hoàn thành đúng tiến độ và bảo đảm chất lượng văn bản theo quy chuẩn thể thức của Đảng.`;
}

// Hàm xuất văn bản HTML sang Word (.doc)
export function exportPartyDocxBlob(formData: PartyDocumentFormData, tmplTitle: string, tmplCode?: string): void {
  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${formData.tieuDeVanBan || tmplTitle}</title>
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
        .content-p {
          text-indent: 10mm;
          margin: 6px 0;
          text-align: justify;
          line-height: 1.4;
        }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td style="width: 48%; text-align: center;">
            <p class="org-upper">${formData.tinhUy}</p>
            <p class="org-upper" style="font-size: 10pt;">${formData.huyenUy}</p>
            <p class="org-upper" style="font-size: 10.5pt; text-transform: none;"><strong>${formData.dangBoCoSo}</strong></p>
            <p class="org-upper"><strong>${formData.chiBo}</strong></p>
            <div style="width: 80px; height: 1px; background: #000; margin: 4px auto 0 auto;"></div>
            <p style="margin: 2px 0 0 0; font-size: 10pt;">*</p>
          </td>
          <td style="width: 52%; text-align: center;">
            <p style="font-weight: bold; text-transform: uppercase; margin: 0; font-size: 11.5pt;"><u>ĐẢNG CỘNG SẢN VIỆT NAM</u></p>
            ${tmplCode ? `<p style="margin: 4px 0 0 0; font-size: 11pt; font-weight: bold;">${tmplCode}</p>` : ''}
            <p style="font-style: italic; margin: 8px 0 0 0; font-size: 11pt;">${formData.diaDanh}, ${formData.ngayThang}</p>
          </td>
        </tr>
      </table>

      <div class="doc-title">${(formData.tieuDeVanBan || tmplTitle).toUpperCase()}</div>
      ${formData.canCuVanBan ? `<div class="doc-sub">(${formData.canCuVanBan})</div>` : '<div style="height: 15px;"></div>'}

      <div style="margin: 15px 0;">
        <p class="content-p">Họ và tên người lập / đối tượng: <strong>${(formData.hoVaTen || '').toUpperCase()}</strong></p>
        <p class="content-p">Sinh ngày: <strong>${formData.namSinh}</strong>. Chức vụ Đảng: <strong>${formData.chucVuDang}</strong></p>
        <p class="content-p">Chức vụ chính quyền / chuyên môn: <strong>${formData.chucVuChinhQuyen}</strong></p>
        <p class="content-p">Đơn vị công tác: <strong>${formData.donViCongTac}</strong></p>
        <p class="content-p">Sinh hoạt tại: <strong>${formData.chiBo}</strong> thuộc <strong>${formData.dangBoCoSo}</strong></p>
      </div>

      <div style="margin: 20px 0;">
        ${(formData.noiDungChinh || '').split('\n').map(p => p.trim() ? `<p class="content-p">${p}</p>` : '').join('')}
      </div>

      <table style="width: 100%; margin-top: 35px; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; text-align: center; vertical-align: top;">
            ${formData.nguoiKyBenTrai ? `
              <p style="font-weight: bold; margin: 0; white-space: pre-line;">${formData.nguoiKyBenTrai}</p>
              <p style="font-style: italic; font-size: 11pt; margin: 2px 0 65px 0;">${formData.chucDanhBenTrai}</p>
              <p style="font-weight: bold; margin: 0;">...................................................</p>
            ` : ''}
          </td>
          <td style="width: 50%; text-align: center; vertical-align: top;">
            <p style="font-style: italic; font-size: 11pt; margin: 0;">${formData.diaDanh}, ${formData.ngayThang}</p>
            <p style="font-weight: bold; margin: 4px 0 0 0; white-space: pre-line;">${formData.nguoiKyBenPhai}</p>
            <p style="font-style: italic; font-size: 11pt; margin: 2px 0 65px 0;">${formData.chucDanhBenPhai}</p>
            <p style="font-weight: bold; margin: 0;">${(formData.hoVaTen || '').toUpperCase()}</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docHtml], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = (formData.tieuDeVanBan || tmplTitle).replace(/[^a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ_ -]/g, '').trim().replace(/\s+/g, '_');
  link.download = `${fileName}_Chuan_The_Thuc_Dang.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface PartyCommitmentData {
  tinhUy: string;
  huyenUy: string;
  dangBoCoSo: string;
  chiBo: string;
  chiBoSinhHoat: string;
  diaDanh: string;
  ngayKhai: string;
  thangKhai: string;
  namKhai: string;
  namCamKet: string;

  // Thông tin đảng viên
  hoVaTen: string;
  namSinh: string;
  chucVuDang: string;
  chucVuChinhQuyen: string;
  chucVuDoanThe: string;
  donViCongTac: string;

  // Nội dung cam kết 5 phần
  camKetTuTuongChinhTri: string;
  camKetDaoDucLoiSong: string;
  camKetThucHienNhiemVu: string;
  camKetYThucKyLuat: string;
  camKetKhacPhucHanChe: string;
}

export const defaultPartyCommitmentData: PartyCommitmentData = {
  tinhUy: 'THÀNH ỦY THÀNH PHỐ HỒ CHÍ MINH',
  huyenUy: 'ĐẢNG BỘ KHỐI ĐẠI HỌC CAO ĐẲNG TP.HCM',
  dangBoCoSo: 'Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn',
  chiBo: 'Chi bộ 1',
  chiBoSinhHoat: 'Chi bộ 1',
  diaDanh: 'Thành phố Hồ Chí Minh',
  ngayKhai: '15',
  thangKhai: '01',
  namKhai: '2026',
  namCamKet: '2026',

  hoVaTen: 'NGUYỄN VĂN A',
  namSinh: '15/08/1988',
  chucVuDang: 'Đảng viên',
  chucVuChinhQuyen: 'Giảng viên',
  chucVuDoanThe: 'Đoàn viên Công đoàn',
  donViCongTac: 'Khoa Công nghệ Thông tin',

  camKetTuTuongChinhTri: `1. Tuyệt đối trung thành với chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh và đường lối đổi mới của Đảng; kiên định mục tiêu độc lập dân tộc và chủ nghĩa xã hội.
2. Chấp hành nghiêm chỉnh Cương lĩnh chính trị, Điều lệ Đảng, các nghị quyết, chỉ thị, kết luận của Ban Chấp hành Trung ương, Bộ Chính trị, Ban Bí thư và chính sách, pháp luật của Nhà nước.
3. Không ngừng học tập nâng cao trình độ lý luận chính trị và năng lực chuyên môn nghiệp vụ; kiên quyết đấu tranh phản bác các quan điểm sai trái, thù địch; phòng chống suy thoái về tư tưởng chính trị, "tự diễn biến", "tự chuyển hóa" trong nội bộ.`,

  camKetDaoDucLoiSong: `1. Tích cực học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh theo Kết luận số 01-KL/TW của Bộ Chính trị gắn với việc thực hiện Kết luận số 21-KL/TW của Ban Chấp hành Trung ương Đảng khóa XIII.
2. Giữ gìn phẩm chất đạo đức cách mạng trong sáng, lối sống giản dị, lành mạnh, khiêm tốn, trung thực, thẳng thắn; thực hiện cần, kiệm, liêm, chính, chí công vô tư.
3. Luôn gương mẫu trong thực hiện nghĩa vụ công dân nơi cư trú theo Quy định số 213-QĐ/TW của Bộ Chính trị; giữ mối quan hệ gắn bó mật thiết với nhân dân.
4. Nghiêm túc thực hiện Quy định số 37-QĐ/TW về những điều đảng viên không được làm; kiên quyết đấu tranh phòng, chống quan liêu, tham nhũng, lãng phí, tiêu cực và các biểu hiện chủ nghĩa cá nhân, bè phái, cục bộ.`,

  camKetThucHienNhiemVu: `1. Nêu cao tinh thần trách nhiệm, chủ động, sáng tạo và tận tụy trong thực hiện chức trách, nhiệm vụ chuyên môn được giao tại đơn vị; hoàn thành 100% chỉ tiêu khối lượng và chất lượng công tác trong năm 2026.
2. Tích cực đổi mới phương pháp giảng dạy và nghiên cứu khoa học; đi đầu trong ứng dụng chuyển đổi số, xây dựng học liệu điện tử phục vụ người học.
3. Tinh thần phục vụ nhân dân tận tụy; tôn trọng và lắng nghe ý kiến của đồng nghiệp, sinh viên; đoàn kết, tương trợ, giúp đỡ đồng chí trong chi bộ và đơn vị cùng tiến bộ.`,

  camKetYThucKyLuat: `1. Tuyệt đối chấp hành nguyên tắc tập trung dân chủ, tập thể lãnh đạo, cá nhân phụ trách; thực hiện nghiêm túc chế độ tự phê bình và phê bình trong sinh hoạt Đảng.
2. Chấp hành nghiêm kỷ luật lao động, văn hóa công sở, quy chế làm việc của Nhà trường và sự phân công của cấp ủy Chi bộ, Ban Giám hiệu.
3. Tham gia đầy đủ, đúng giờ các buổi sinh hoạt Chi bộ thường kỳ và sinh hoạt chuyên đề; đóng đảng phí đầy đủ theo quy định.`,

  camKetKhacPhucHanChe: `1. Khắc phục triệt để tính e dè, ngại va chạm trong việc đóng góp ý kiến xây dựng nghị quyết Chi bộ; tích cực phát biểu thảo luận sôi nổi và sâu sát hơn trong từng kỳ sinh hoạt.
2. Chủ động sắp xếp thời gian biểu một cách khoa học giữa công tác giảng dạy, nghiên cứu khoa học và các hoạt động kiêm nhiệm, tránh tình trạng bị động, dồn việc vào cuối kỳ.`
};

export function exportPartyCommitmentDocx(data: PartyCommitmentData) {
  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Bản cam kết tu dưỡng, rèn luyện, phấn đấu năm ${data.namCamKet || '2026'}</title>
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
          margin-bottom: 18px;
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
          margin: 18px 0 4px 0;
        }
        .doc-sub {
          font-size: 11pt;
          font-style: italic;
          text-align: center;
          margin-bottom: 18px;
        }
        .doc-sec-h {
          font-size: 13pt;
          font-weight: bold;
          margin: 12px 0 4px 0;
        }
        .content-p {
          text-indent: 10mm;
          margin: 5px 0;
          text-align: justify;
        }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td style="width: 48%; text-align: center;">
            <p class="org-upper">${data.tinhUy || 'THÀNH ỦY THÀNH PHỐ HỒ CHÍ MINH'}</p>
            <p class="org-upper" style="font-size: 10pt;">${data.huyenUy || 'ĐẢNG BỘ KHỐI ĐẠI HỌC CAO ĐẲNG TP.HCM'}</p>
            <p class="org-upper" style="font-size: 10.5pt; text-transform: none;"><strong>${data.dangBoCoSo || 'Đảng bộ Trường Cao đẳng Bách khoa Nam Sài Gòn'}</strong></p>
            <p class="org-upper"><strong>${data.chiBo || 'Chi bộ 1'}</strong></p>
            <div style="width: 80px; height: 1px; background: #000; margin: 4px auto 0 auto;"></div>
            <p style="margin: 2px 0 0 0; font-size: 10pt;">*</p>
          </td>
          <td style="width: 52%; text-align: center;">
            <p style="font-weight: bold; text-transform: uppercase; margin: 0; font-size: 11.5pt;"><u>ĐẢNG CỘNG SẢN VIỆT NAM</u></p>
            <p style="font-style: italic; margin: 10px 0 0 0; font-size: 11pt;">${data.diaDanh || 'Thành phố Hồ Chí Minh'}, ngày ${data.ngayKhai || '15'} tháng ${data.thangKhai || '01'} năm ${data.namKhai || '2026'}</p>
          </td>
        </tr>
      </table>

      <div class="doc-title">BẢN CAM KẾT<br/>TU DƯỠNG, RÈN LUYỆN, PHẤN ĐẤU NĂM ${data.namCamKet || '2026'}</div>
      <div class="doc-sub">(Thực hiện Nghị quyết Trung ương 4 khóa XII, XIII gắn với Chỉ thị số 05-CT/TW, Kết luận số 01-KL/TW và Quy định số 37-QĐ/TW)</div>

      <div style="margin: 15px 0;">
        <p style="margin: 4px 0;">- Họ và tên: <strong style="text-transform: uppercase; font-size: 13pt;">${data.hoVaTen}</strong></p>
        <p style="margin: 4px 0;">- Ngày, tháng, năm sinh: <strong>${data.namSinh}</strong></p>
        <p style="margin: 4px 0;">- Chức vụ Đảng: <strong>${data.chucVuDang}</strong></p>
        <p style="margin: 4px 0;">- Chức vụ chính quyền/chuyên môn: <strong>${data.chucVuChinhQuyen}</strong></p>
        <p style="margin: 4px 0;">- Chức vụ đoàn thể: <strong>${data.chucVuDoanThe || 'Không'}</strong></p>
        <p style="margin: 4px 0;">- Đơn vị công tác: <strong>${data.donViCongTac}</strong></p>
        <p style="margin: 4px 0;">- Sinh hoạt tại Chi bộ: <strong>${data.chiBo || data.chiBoSinhHoat}</strong> thuộc <strong>${data.dangBoCoSo}</strong></p>
      </div>

      <p class="content-p">Sau khi học tập, quán triệt các Nghị quyết, Chỉ thị, Kết luận và Quy định của Đảng, căn cứ vào chức trách, nhiệm vụ được giao trong năm ${data.namCamKet || '2026'}, bản thân tôi xin đăng ký, cam kết tu dưỡng, rèn luyện, phấn đấu cụ thể như sau:</p>

      <div class="doc-sec-h">1. Về tư tưởng chính trị</div>
      <div class="content-p">${(data.camKetTuTuongChinhTri || '').replace(/\n/g, '<br/>')}</div>

      <div class="doc-sec-h">2. Về phẩm chất đạo đức, lối sống</div>
      <div class="content-p">${(data.camKetDaoDucLoiSong || '').replace(/\n/g, '<br/>')}</div>

      <div class="doc-sec-h">3. Về thực hiện chức trách, nhiệm vụ được giao</div>
      <div class="content-p">${(data.camKetThucHienNhiemVu || '').replace(/\n/g, '<br/>')}</div>

      <div class="doc-sec-h">4. Về tổ chức kỷ luật và ý thức tổ chức kỷ luật</div>
      <div class="content-p">${(data.camKetYThucKyLuat || '').replace(/\n/g, '<br/>')}</div>

      <div class="doc-sec-h">5. Về khắc phục, sửa chữa hạn chế, khuyết điểm năm trước</div>
      <div class="content-p">${(data.camKetKhacPhucHanChe || '').replace(/\n/g, '<br/>')}</div>

      <p class="content-p" style="margin-top: 15px;">Bản cam kết này được làm thành 02 bản: 01 bản cá nhân lưu giữ để phấn đấu thực hiện, 01 bản gửi Chi ủy Chi bộ theo dõi, giám sát và làm cơ sở kiểm điểm, đánh giá, xếp loại chất lượng đảng viên cuối năm ${data.namCamKet || '2026'}.</p>

      <table style="width: 100%; margin-top: 30px; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; text-align: center; vertical-align: top;">
            <p style="font-weight: bold; margin: 0; text-transform: uppercase;">Ý KIẾN CỦA CHI ỦY CHI BỘ</p>
            <p style="font-style: italic; font-size: 11pt; margin: 2px 0 65px 0;">(Ký, ghi rõ họ tên và chức vụ)</p>
            <p style="font-weight: bold; margin: 0;">...................................................</p>
          </td>
          <td style="width: 50%; text-align: center; vertical-align: top;">
            <p style="font-style: italic; font-size: 11pt; margin: 0;">${data.diaDanh || 'Thành phố Hồ Chí Minh'}, ngày ${data.ngayKhai || '15'} tháng ${data.thangKhai || '01'} năm ${data.namKhai || '2026'}</p>
            <p style="font-weight: bold; margin: 4px 0 0 0; text-transform: uppercase;">NGƯỜI CAM KẾT</p>
            <p style="font-style: italic; font-size: 11pt; margin: 2px 0 65px 0;">(Ký và ghi rõ họ tên)</p>
            <p style="font-weight: bold; margin: 0; text-transform: uppercase;">${data.hoVaTen}</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', content], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Ban_Cam_Ket_Tu_Duong_${(data.hoVaTen || 'Dang_Vien').replace(/\s+/g, '_')}_${data.namCamKet || '2026'}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

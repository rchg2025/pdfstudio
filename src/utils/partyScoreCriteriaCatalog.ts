export interface CriteriaItem {
  id: string;
  stt: string;
  label: string;
  maxScore: number;
  selfScore: number;
  note?: string;
  isHeader?: boolean;
}

// ===============================================
// PHỤ LỤC 2: KHUNG TIÊU CHÍ, BIỂU ĐIỂM TẬP THỂ (100 ĐIỂM)
// ===============================================
export const DEFAULT_APPENDIX_2_COLLECTIVE: CriteriaItem[] = [
  // I. NHÓM TIÊU CHÍ CHUNG (30 ĐIỂM)
  {
    id: 'i-chung',
    stt: 'I',
    label: 'NHÓM TIÊU CHÍ CHUNG',
    maxScore: 30,
    selfScore: 30,
    isHeader: true
  },
  {
    id: 'i-1',
    stt: '1',
    label: 'Kết quả công tác xây dựng, chỉnh đốn Đảng; củng cố, xây dựng tổ chức đảng và hệ thống chính trị; nâng cao chất lượng đội ngũ cán bộ, đảng viên; thực hiện trách nhiệm nêu gương, học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh.',
    maxScore: 5,
    selfScore: 5
  },
  {
    id: 'i-2',
    stt: '2',
    label: 'Năng lực lãnh đạo của cấp uỷ; hiệu quả lãnh đạo, chỉ đạo của cấp uỷ đối với chính quyền, các tổ chức đoàn thể; hiệu quả phối hợp, đoàn kết nội bộ; trách nhiệm giải trình của tập thể và người đứng đầu.',
    maxScore: 5,
    selfScore: 5
  },
  {
    id: 'i-3',
    stt: '3',
    label: 'Hiệu quả công tác kiểm tra, giám sát, kỷ luật đảng; kiểm soát quyền lực; phòng, chống tham nhũng, lãng phí, tiêu cực, "tự diễn biến", "tự chuyển hoá"; công tác tiếp công dân, giải quyết khiếu nại, tố cáo.',
    maxScore: 5,
    selfScore: 5
  },
  {
    id: 'i-4',
    stt: '4',
    label: 'Thực hiện nguyên tắc tổ chức và hoạt động của Đảng, nhất là nguyên tắc tập trung dân chủ, tự phê bình và phê bình; chấp hành quy chế làm việc, chế độ công tác.',
    maxScore: 5,
    selfScore: 5
  },
  {
    id: 'i-5-1',
    stt: '5.1',
    label: 'Lãnh đạo, chỉ đạo thực hiện nhiệm vụ chính trị; xây dựng bộ máy tinh gọn, xây dựng văn hoá công vụ; chất lượng quản lý, điều hành, tự chủ và trách nhiệm người đứng đầu.',
    maxScore: 3,
    selfScore: 3
  },
  {
    id: 'i-5-2',
    stt: '5.2',
    label: 'Lãnh đạo thực hiện cải cách hành chính và Nghị quyết số 57-NQ/TW về đột phá phát triển KHCN, đổi mới sáng tạo, chuyển đổi số quốc gia; hiệu quả phục vụ người dân, doanh nghiệp.',
    maxScore: 2,
    selfScore: 2
  },
  {
    id: 'i-6',
    stt: '6',
    label: 'Tinh thần tự phê bình và phê bình, tự soi, tự sửa của tập thể; kết quả khắc phục hạn chế, yếu kém đã được chỉ ra trong các kỳ kiểm điểm trước.',
    maxScore: 5,
    selfScore: 5
  },

  // II. KẾT QUẢ THỰC HIỆN NHIỆM VỤ (70 ĐIỂM)
  {
    id: 'ii-nhiem-vu',
    stt: 'II',
    label: 'NHÓM TIÊU CHÍ VỀ KẾT QUẢ THỰC HIỆN NHIỆM VỤ',
    maxScore: 70,
    selfScore: 70,
    isHeader: true
  },
  {
    id: 'ii-1-1-a',
    stt: '1.1a',
    label: 'Cụ thể hóa các Nghị quyết, kết luận của Trung ương, Thành ủy và các kết luận của Tổng Bí thư.',
    maxScore: 5,
    selfScore: 5
  },
  {
    id: 'ii-1-1-b',
    stt: '1.1b',
    label: 'Xây dựng hoặc tham mưu, đóng góp vào các cơ chế, chính sách đặc thù, các đề án, chương trình phù hợp với cơ quan, đơn vị; tính khả thi và tác động thực tiễn.',
    maxScore: 5,
    selfScore: 5
  },
  {
    id: 'ii-1-1-c',
    stt: '1.1c',
    label: 'Thực hiện, tham gia đẩy mạnh phân cấp, ủy quyền các nhiệm vụ của Thành ủy phù hợp chính quyền địa phương.',
    maxScore: 5,
    selfScore: 5
  },
  {
    id: 'ii-1-2-a',
    stt: '1.2a',
    label: 'Thực hiện cải cách hành chính và Nghị quyết 57-NQ/TW về KHCN, đổi mới sáng tạo và chuyển đổi số (có sản phẩm cụ thể, vượt tiến độ, chất lượng).',
    maxScore: 10,
    selfScore: 10
  },
  {
    id: 'ii-1-2-b',
    stt: '1.2b',
    label: 'Tổ chức thực hiện các chỉ tiêu, nhiệm vụ theo lĩnh vực chuyên môn (đơn vị sự nghiệp công lập: chất lượng dịch vụ giáo dục, nghiên cứu, chương trình đào tạo, mức độ hoàn thành nhiệm vụ trọng tâm).',
    maxScore: 15,
    selfScore: 15
  },
  {
    id: 'ii-2',
    stt: '2',
    label: 'Kết quả đánh giá, xếp loại đối với các lĩnh vực, bộ phận, cá nhân trực thuộc do tập thể phụ trách.',
    maxScore: 20,
    selfScore: 20
  },
  {
    id: 'ii-3-1',
    stt: '3.1',
    label: 'Điểm đổi mới, sáng tạo: Hoàn thành 100% nhiệm vụ theo kế hoạch, trong đó có ≥30% công việc vượt tiến độ, có đổi mới sáng tạo đem lại giá trị mới áp dụng rộng rãi.',
    maxScore: 3,
    selfScore: 3
  },
  {
    id: 'ii-3-2',
    stt: '3.2',
    label: 'Điểm đổi mới, sáng tạo: Hoàn thành vượt mức ít nhất từ 02 chỉ tiêu cơ bản trở lên được cấp có thẩm quyền giao.',
    maxScore: 4,
    selfScore: 4
  },
  {
    id: 'ii-3-3',
    stt: '3.3',
    label: 'Điểm đổi mới, sáng tạo: Tham mưu cơ chế chính sách đặc thù, giải pháp đột phá tháo gỡ điểm nghẽn, tạo chuyển biến tích cực rõ nét.',
    maxScore: 3,
    selfScore: 3
  }
];

// ===============================================
// PHỤ LỤC 4: BIỂU ĐIỂM CÁ NHÂN KHÔNG GIỮ CHỨC VỤ LÃNH ĐẠO (100 ĐIỂM)
// ===============================================
export const DEFAULT_APPENDIX_4_NON_LEADER: CriteriaItem[] = [
  {
    id: 'i-chung',
    stt: 'I',
    label: 'NHÓM TIÊU CHÍ CHUNG (30 ĐIỂM)',
    maxScore: 30,
    selfScore: 30,
    isHeader: true
  },
  {
    id: 'i-1-1',
    stt: '1.1',
    label: 'Bản lĩnh chính trị vững vàng; kiên định lập trường; nghiên cứu học tập chủ nghĩa Mác-Lênin, tư tưởng Hồ Chí Minh, nghị quyết của Đảng.',
    maxScore: 2,
    selfScore: 2
  },
  {
    id: 'i-1-2',
    stt: '1.2',
    label: 'Thực hiện nghiêm nguyên tắc tập trung dân chủ, tự phê bình và phê bình; chấp hành kỷ luật phát ngôn, bảo vệ bí mật nhà nước.',
    maxScore: 2,
    selfScore: 2
  },
  {
    id: 'i-1-3',
    stt: '1.3',
    label: 'Giữ gìn đạo đức, lối sống trong sạch, trung thực, khiêm tốn; không tham nhũng, lãng phí, tiêu cực; không vi phạm quy định những điều đảng viên không được làm.',
    maxScore: 2,
    selfScore: 2
  },
  {
    id: 'i-1-4',
    stt: '1.4',
    label: 'Ý thức tổ chức kỷ luật, tinh thần trách nhiệm; chấp hành sự phân công, nội quy, quy chế của Nhà trường và đơn vị.',
    maxScore: 2,
    selfScore: 2
  },
  {
    id: 'i-1-5',
    stt: '1.5',
    label: 'Thực hiện kê khai tài sản, thu nhập theo quy định (nếu thuộc diện kê khai).',
    maxScore: 2,
    selfScore: 2
  },
  {
    id: 'i-1-6',
    stt: '1.6',
    label: 'Báo cáo trung thực, cung cấp thông tin chính xác, khách quan về thực hiện chức trách nhiệm vụ.',
    maxScore: 2,
    selfScore: 2
  },
  {
    id: 'i-1-7',
    stt: '1.7',
    label: 'Giữ gìn đoàn kết nội bộ; quan hệ tốt với đồng chí, đồng nghiệp; tích cực tham gia phong trào, hoạt động đoàn thể.',
    maxScore: 2,
    selfScore: 2
  },
  {
    id: 'i-1-8',
    stt: '1.8',
    label: 'Gần gũi quần chúng; giữ mối liên hệ mật thiết với cấp ủy và nhân dân nơi cư trú theo Quy định 213-QĐ/TW.',
    maxScore: 1,
    selfScore: 1
  },
  {
    id: 'i-2-1',
    stt: '2.1',
    label: 'Năng lực chuyên môn nghiệp vụ theo vị trí việc làm; kỹ năng công nghệ thông tin, chuyển đổi số trong giảng dạy/công tác.',
    maxScore: 4,
    selfScore: 4
  },
  {
    id: 'i-2-2',
    stt: '2.2',
    label: 'Khả năng đáp ứng yêu cầu thực thi nhiệm vụ thường xuyên và nhiệm vụ đột xuất phát sinh.',
    maxScore: 3,
    selfScore: 3
  },
  {
    id: 'i-2-3',
    stt: '2.3',
    label: 'Thái độ công tác: Trách nhiệm, tích cực, lề lối hành chính chuyên nghiệp, văn minh; phối hợp hiệu quả.',
    maxScore: 3,
    selfScore: 3
  },
  {
    id: 'i-2-4',
    stt: '2.4',
    label: 'Tinh thần đổi mới sáng tạo, dám nghĩ dám làm vì lợi ích chung; sẵn sàng nhận nhiệm vụ khó; có giải pháp sáng tạo theo NQ 57-NQ/TW.',
    maxScore: 3,
    selfScore: 3
  },
  {
    id: 'i-3',
    stt: '3',
    label: 'Về tự phê bình và phê bình, khắc phục hạn chế, khuyết điểm; tinh thần tự soi, tự sửa.',
    maxScore: 5,
    selfScore: 5
  },

  // II. KẾT QUẢ THỰC HIỆN NHIỆM VỤ (70 ĐIỂM)
  {
    id: 'ii-nhiem-vu',
    stt: 'II',
    label: 'NHÓM TIÊU CHÍ VỀ KẾT QUẢ THỰC HIỆN NHIỆM VỤ (70 ĐIỂM)',
    maxScore: 70,
    selfScore: 70,
    isHeader: true
  },
  {
    id: 'ii-1',
    stt: '1',
    label: 'Khối đơn vị sự nghiệp giáo dục: Mức độ hoàn thành nhiệm vụ giảng dạy, nghiên cứu, kế hoạch chuyên môn được giao đúng hạn, chất lượng cao; đáp ứng kế hoạch thực hiện Nghị quyết 57-NQ/TW.',
    maxScore: 35,
    selfScore: 35
  },
  {
    id: 'ii-2',
    stt: '2',
    label: 'Tích cực tham gia bồi dưỡng nghiệp vụ, cập nhật kiến thức, đổi mới phương pháp giảng dạy/chuyên môn; không để xảy ra sai sót ảnh hưởng đến uy tín nhà trường.',
    maxScore: 20,
    selfScore: 20
  },
  {
    id: 'ii-3',
    stt: '3',
    label: 'Văn hóa ứng xử, giao tiếp chuẩn mực văn minh; hợp tác tốt với đồng nghiệp; hướng dẫn, phục vụ sinh viên tận tâm, chu đáo.',
    maxScore: 15,
    selfScore: 15
  }
];

// ===============================================
// PHỤ LỤC 3: BIỂU ĐIỂM CÁN BỘ LÃNH ĐẠO, QUẢN LÝ (100 ĐIỂM)
// ===============================================
export const DEFAULT_APPENDIX_3_LEADER: CriteriaItem[] = [
  {
    id: 'i-chung',
    stt: 'I',
    label: 'NHÓM TIÊU CHÍ CHUNG (30 ĐIỂM)',
    maxScore: 30,
    selfScore: 30,
    isHeader: true
  },
  {
    id: 'i-1',
    stt: '1',
    label: 'Chính trị, tư tưởng: Trung thành với Tổ quốc, Đảng, Nhân dân; bản lĩnh chính trị; bảo vệ nền tảng tư tưởng Đảng; kỷ luật phát ngôn; học tập nghiên cứu nghị quyết và tư duy tầm nhìn.',
    maxScore: 5,
    selfScore: 5
  },
  {
    id: 'i-2',
    stt: '2',
    label: 'Phẩm chất đạo đức và kỷ luật: Cần kiệm liêm chính; nêu gương; không tham nhũng, bè phái; nguyên tắc tập trung dân chủ; kê khai tài sản; báo cáo trung thực.',
    maxScore: 5,
    selfScore: 5
  },
  {
    id: 'i-3-1',
    stt: '3.1',
    label: 'Năng lực lãnh đạo, quản lý: Hoạch định chính sách; phương pháp khoa học; tổ chức thực hiện đường lối; chỉ đạo điều hành và giữ nghiêm kỷ cương kỷ luật.',
    maxScore: 4,
    selfScore: 4
  },
  {
    id: 'i-3-2',
    stt: '3.2',
    label: 'Năng lực chuyên môn nghiệp vụ theo vị trí việc làm; xử lý công việc độc lập và làm việc nhóm hiệu quả; tháo gỡ điểm nghẽn.',
    maxScore: 3,
    selfScore: 3
  },
  {
    id: 'i-3-3',
    stt: '3.3',
    label: 'Khả năng đáp ứng thực thi nhiệm vụ thường xuyên và nhiệm vụ đột xuất phát sinh.',
    maxScore: 2,
    selfScore: 2
  },
  {
    id: 'i-3-4',
    stt: '3.4',
    label: 'Thái độ công tác trong thực hiện nhiệm vụ: Tinh thần trách nhiệm cao; phong cách làm việc chuẩn mực; phối hợp chặt chẽ.',
    maxScore: 3,
    selfScore: 3
  },
  {
    id: 'i-3-5',
    stt: '3.5',
    label: 'Tinh thần đổi mới sáng tạo, dám nghĩ dám làm dám chịu trách nhiệm vì lợi ích chung; có giải pháp mang tính đột phá.',
    maxScore: 4,
    selfScore: 4
  },
  {
    id: 'i-4',
    stt: '4',
    label: 'Mức độ tín nhiệm, uy tín trong nội bộ và khả năng quy tụ đoàn kết tập thể.',
    maxScore: 2,
    selfScore: 2
  },
  {
    id: 'i-5',
    stt: '5',
    label: 'Về tự phê bình và phê bình, tự soi tự sửa; khắc phục hạn chế, khuyết điểm.',
    maxScore: 2,
    selfScore: 2
  },

  // II. KẾT QUẢ THỰC HIỆN CHỨC TRÁCH NHIỆM VỤ (70 ĐIỂM)
  {
    id: 'ii-nhiem-vu',
    stt: 'II',
    label: 'NHÓM TIÊU CHÍ VỀ KẾT QUẢ THỰC HIỆN CHỨC TRÁCH, NHIỆM VỤ (70 ĐIỂM)',
    maxScore: 70,
    selfScore: 70,
    isHeader: true
  },
  {
    id: 'ii-1',
    stt: '1',
    label: 'Kết quả thực hiện chức trách: Lãnh đạo xây dựng chương trình kế hoạch; hoàn thành ≥95% nhiệm vụ trọng tâm đúng hạn; giải quyết dứt điểm tồn đọng; thực hiện Nghị quyết 57-NQ/TW; tinh gọn bộ máy; cải cách hành chính.',
    maxScore: 40,
    selfScore: 40
  },
  {
    id: 'ii-2',
    stt: '2',
    label: 'Kết quả lãnh đạo điều hành: Xây dựng quy chế làm việc khoa học; môi trường dân chủ đoàn kết; quyết đoán đúng thẩm quyền; sử dụng hiệu quả nguồn lực không lãng phí.',
    maxScore: 20,
    selfScore: 20
  },
  {
    id: 'ii-3',
    stt: '3',
    label: 'Kết quả đánh giá, xếp loại chất lượng của tập thể cơ quan, đơn vị và đội ngũ cán bộ, đảng viên thuộc quyền quản lý trực tiếp.',
    maxScore: 10,
    selfScore: 10
  }
];

// ===============================================
// PHỤ LỤC 5: BIỂU ĐIỂM ĐẢNG VIÊN HỌC SINH, SINH VIÊN (100 ĐIỂM)
// ===============================================
export const DEFAULT_APPENDIX_5_STUDENT: CriteriaItem[] = [
  {
    id: 'i-chung',
    stt: 'I',
    label: 'NHÓM TIÊU CHÍ CHUNG (30 ĐIỂM)',
    maxScore: 30,
    selfScore: 30,
    isHeader: true
  },
  {
    id: 'i-1-1',
    stt: '1.1',
    label: 'Lập trường tư tưởng chính trị vững vàng; chấp hành chủ trương của Đảng, chính sách pháp luật của Nhà nước và quy chế học tập, rèn luyện của Nhà trường.',
    maxScore: 7,
    selfScore: 7
  },
  {
    id: 'i-1-2',
    stt: '1.2',
    label: 'Phẩm chất đạo đức tốt, lối sống trung thực, giản dị; không vi phạm quy định những điều đảng viên không được làm; văn hóa ứng xử nơi học tập và cư trú.',
    maxScore: 7,
    selfScore: 7
  },
  {
    id: 'i-1-3',
    stt: '1.3',
    label: 'Chấp hành nghiêm các nguyên tắc tổ chức, sinh hoạt đảng; nghiêm túc trong tự phê bình và phê bình; giữ gìn đoàn kết nội bộ trong chi bộ và lớp học.',
    maxScore: 7,
    selfScore: 7
  },
  {
    id: 'i-2',
    stt: '2',
    label: 'Tinh thần tự phê bình, tự soi, tự sửa của cá nhân; tự giác nhận diện hạn chế, khuyết điểm của bản thân và kết quả khắc phục.',
    maxScore: 9,
    selfScore: 9
  },

  // II. KẾT QUẢ THỰC HIỆN NHIỆM VỤ (70 ĐIỂM)
  {
    id: 'ii-nhiem-vu',
    stt: 'II',
    label: 'NHÓM TIÊU CHÍ VỀ KẾT QUẢ THỰC HIỆN NHIỆM VỤ (70 ĐIỂM)',
    maxScore: 70,
    selfScore: 70,
    isHeader: true
  },
  {
    id: 'ii-1',
    stt: '1',
    label: 'Thực hiện đầy đủ quyền và nghĩa vụ đảng viên; kết quả học tập và rèn luyện tại trường; hoàn thành các nhiệm vụ chính trị do cấp ủy, chi bộ phân công.',
    maxScore: 25,
    selfScore: 25
  },
  {
    id: 'ii-2',
    stt: '2',
    label: 'Tham gia học tập nghị quyết, các văn bản chỉ đạo của cấp trên đầy đủ; phát huy vai trò tiên phong của đảng viên trẻ, tích cực phát biểu xây dựng chi bộ.',
    maxScore: 20,
    selfScore: 20
  },
  {
    id: 'ii-3',
    stt: '3',
    label: 'Hoàn thành các nhiệm vụ đột xuất; tích cực tham gia phong trào tình nguyện, chiến dịch Đoàn - Hội (Mùa hè xanh, Tiếp sức mùa thi...) và hoạt động xã hội.',
    maxScore: 25,
    selfScore: 25
  }
];

export function exportAppendixTableDocx(
  appendixTitle: string,
  docSub: string,
  hoTen: string,
  chiBo: string,
  items: CriteriaItem[]
) {
  const totalScore = items
    .filter(i => !i.isHeader)
    .reduce((sum, i) => sum + (Number(i.selfScore) || 0), 0);

  const tableRows = items.map(item => {
    if (item.isHeader) {
      return `
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td style="text-align: center; border: 1px solid #000; padding: 6px;">${item.stt}</td>
          <td style="border: 1px solid #000; padding: 6px; text-transform: uppercase;">${item.label}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 6px;">${item.maxScore}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 6px;"></td>
        </tr>
      `;
    }
    return `
      <tr>
        <td style="text-align: center; border: 1px solid #000; padding: 6px; vertical-align: top;">${item.stt}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: justify;">${item.label}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 6px; vertical-align: top; font-weight: bold;">${item.maxScore}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 6px; vertical-align: top; font-weight: bold; color: #b91c1c;">${item.selfScore}</td>
      </tr>
    `;
  }).join('');

  const htmlDoc = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>${appendixTitle} - ${hoTen}</title>
    <!--[if gte mso 9]>
    <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml>
    <![endif]-->
    <style>
      @page { size: 210mm 297mm; margin: 20mm 15mm 20mm 20mm; }
      body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.35; color: #000; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #000; padding: 6px; }
      th { background-color: #e2e8f0; font-weight: bold; text-align: center; }
    </style>
  </head>
  <body>
    <div style="text-align: center; font-weight: bold; font-size: 12pt; text-transform: uppercase;">${appendixTitle}</div>
    <div style="text-align: center; font-weight: bold; font-size: 13pt; text-transform: uppercase; margin: 4px 0;">${docSub}</div>
    <div style="text-align: center; font-style: italic; font-size: 11pt; margin-bottom: 12px;">
      (Ban hành kèm theo Hướng dẫn số 397-HD/ĐU ngày 20 tháng 11 năm 2026 của Đảng ủy Trường Cao đẳng Bách khoa Nam Sài Gòn)
    </div>
    <div style="text-align: center; margin-bottom: 15px;">-----</div>

    <table style="width: 100%; border: none; margin-bottom: 12px;">
      <tr style="border: none;">
        <td style="border: none; padding: 2px 0;">Họ và tên: <strong style="text-transform: uppercase;">${hoTen || '...........................................'}</strong></td>
        <td style="border: none; padding: 2px 0;">Chi bộ: <strong>${chiBo || '...........................................'}</strong></td>
      </tr>
    </table>

    <table>
      <thead>
        <tr>
          <th style="width: 8%;">TT</th>
          <th style="width: 66%;">TIÊU CHÍ</th>
          <th style="width: 13%;">ĐIỂM TỐI ĐA</th>
          <th style="width: 13%;">ĐIỂM TỰ CHẤM</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
        <tr style="font-weight: bold; background-color: #fef08a;">
          <td colspan="2" style="text-align: right; border: 1px solid #000; padding: 8px;">TỔNG ĐIỂM TỰ CHẤM:</td>
          <td style="text-align: center; border: 1px solid #000; padding: 8px;">100</td>
          <td style="text-align: center; border: 1px solid #000; padding: 8px; font-size: 14pt; color: #b91c1c;">${totalScore}</td>
        </tr>
      </tbody>
    </table>

    <table style="width: 100%; border: none; margin-top: 25px;">
      <tr style="border: none;">
        <td style="width: 50%; border: none;"></td>
        <td style="width: 50%; border: none; text-align: center;">
          <div style="font-style: italic; margin-bottom: 4px;">Chánh Hưng, ngày .... tháng .... năm 2026</div>
          <div style="font-weight: bold; text-transform: uppercase;">NGƯỜI TỰ CHẤM ĐIỂM</div>
          <div style="font-style: italic;">(Ký, ghi rõ họ tên)</div>
          <div style="height: 70px;"></div>
          <div style="font-weight: bold;">${(hoTen || '').toUpperCase()}</div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const blob = new Blob(['\ufeff' + htmlDoc], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${appendixTitle.replace(/\s+/g, '_')}_${(hoTen || 'BieuDiem').replace(/\s+/g, '_')}_2026.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

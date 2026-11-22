export interface PartyDocumentTemplate {
  id: string;
  title: string;
  code?: string;
  category: 'ket-nap' | 'dang-vien-du-bi' | 'kiem-diem' | 'sinh-hoat' | 'dai-hoi' | 'chuyen-sinh-hoat' | 'ho-so-the' | 'khen-thuong-ky-luat';
  categoryLabel: string;
  desc: string;
  guidance?: string;
  isPopular?: boolean;
  status: 'ready' | 'generator';
  targetPath?: string;
}

export const PARTY_DOCUMENT_CATEGORIES = [
  { id: 'all', label: 'Tất cả biểu mẫu' },
  { id: 'kiem-diem', label: '⭐ Bản Kiểm Điểm & Đánh Giá' },
  { id: 'ho-so-the', label: '📋 Quản Lý Hồ Sơ & Thẻ Đảng' },
  { id: 'ket-nap', label: '🌱 Hồ Sơ Kết Nạp Đảng' },
  { id: 'dang-vien-du-bi', label: '🎖️ Đảng Viên Dự Bị' },
  { id: 'sinh-hoat', label: '👥 Sinh Hoạt Chi Bộ Hằng Tháng' },
  { id: 'chuyen-sinh-hoat', label: '🔄 Chuyển Sinh Hoạt Đảng' },
  { id: 'dai-hoi', label: '🏛️ Đại Hội Chi Bộ / Đảng Bộ' },
  { id: 'khen-thuong-ky-luat', label: '⚖️ Khen Thưởng & Kỷ Luật' }
];

export const ALL_PARTY_TEMPLATES: PartyDocumentTemplate[] = [
  // 1. KIỂM ĐIỂM & ĐÁNH GIÁ
  {
    id: 'mau-02a-lanh-dao',
    title: 'Bản kiểm điểm cá nhân cuối năm (Mẫu 02A - Lãnh đạo, quản lý)',
    code: 'Mẫu 02A-HD KĐ.ĐG',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Bản tự đánh giá, xếp loại chất lượng năm 2026 dành cho cá nhân giữ chức vụ lãnh đạo, quản lý theo Hướng dẫn 43-HD/BTCTW và Công văn 2772-CV/BTCTW.',
    guidance: 'HD 43-HD/BTCTW & CV 2772-CV/BTCTW',
    isPopular: true,
    status: 'ready',
    targetPath: '/ban-kiem-diem-dang-vien-mau-02a'
  },
  {
    id: 'mau-02b-khong-chuc-vu',
    title: 'Bản kiểm điểm cá nhân cuối năm (Mẫu 02B - Không giữ chức vụ lãnh đạo)',
    code: 'Mẫu 02B-HD KĐ.ĐG',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Dành riêng cho giảng viên, giáo viên, chuyên viên, nhân viên không giữ chức danh lãnh đạo, quản lý; tự xếp loại viên chức và đảng viên.',
    guidance: 'HD 43-HD/BTCTW & CV 2772-CV/BTCTW',
    isPopular: true,
    status: 'ready',
    targetPath: '/ban-kiem-diem-dang-vien-mau-02b'
  },
  {
    id: 'ban-cam-ket-tu-duong',
    title: 'Bản cam kết tu dưỡng, rèn luyện, phấn đấu của đảng viên (đầu năm)',
    code: 'Cam kết đầu năm',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Đăng ký rèn luyện tư tưởng chính trị, đạo đức lối sống, thực hiện nhiệm vụ và khắc phục hạn chế năm trước; chi ủy theo dõi và xác nhận.',
    guidance: 'Nghị quyết Trung ương 4 & Chỉ thị 05-CT/TW',
    isPopular: true,
    status: 'ready',
    targetPath: '/ban-cam-ket-tu-duong-ren-luyen-dang-vien'
  },
  {
    id: 'phieu-danh-gia-chat-luong-dv',
    title: 'Phiếu đánh giá, xếp loại chất lượng đảng viên',
    code: 'Mẫu ĐGCL-ĐV',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Phiếu phát cho đảng viên trong chi bộ bỏ phiếu xếp loại chất lượng đảng viên cuối năm theo 4 mức.',
    guidance: 'Hướng dẫn số 25-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'bien-ban-kiem-phieu-xep-loai',
    title: 'Biên bản kiểm phiếu xếp loại chất lượng đảng viên hằng năm',
    code: 'Mẫu BB-KP',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Biên bản của Ban kiểm phiếu tại cuộc họp chi bộ kiểm điểm cuối năm tổng hợp kết quả bỏ phiếu phân loại đảng viên.',
    guidance: 'Quy định số 124-QĐ/TW',
    status: 'generator'
  },
  {
    id: 'bao-cao-kiem-diem-tap-the-chi-bo',
    title: 'Báo cáo kiểm điểm tự phê bình và phê bình của tập thể Chi bộ',
    code: 'Mẫu 01-HD KĐ.ĐG',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Bản kiểm điểm công tác lãnh đạo, chỉ đạo của Chi ủy, Chi bộ trong năm đánh giá kết quả thực hiện nhiệm vụ chính trị.',
    guidance: 'Hướng dẫn số 25-HD/BTCTW',
    isPopular: true,
    status: 'generator'
  },

  // 2. QUẢN LÝ HỒ SƠ & THẺ ĐẢNG
  {
    id: 'bo-sung-ho-so-dang-vien',
    title: 'Phiếu bổ sung hồ sơ đảng viên hằng năm (Mẫu 3-HSĐV)',
    code: 'Mẫu 3-HSĐV',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Soạn thảo nhanh, chuẩn hóa quy tắc chữ "K" theo Ban Tổ chức Trung ương Đảng, xem trước trực quan tờ A4 và xuất file Word (.doc).',
    guidance: 'HD 38-HD/BTCTW & HD 01-HD/TW',
    isPopular: true,
    status: 'ready',
    targetPath: '/bo-sung-ho-so-dang-vien'
  },
  {
    id: 'phieu-dang-vien',
    title: 'Phiếu đảng viên (Mẫu 2-HSĐV)',
    code: 'Mẫu 2-HSĐV',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Phiếu lưu trong túi hồ sơ đảng viên quản lý tại cấp ủy cơ sở, chứa toàn bộ quá trình công tác và thay đổi của người đảng viên.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'muc-luc-ho-so-dang-vien',
    title: 'Mục lục tài liệu trong hồ sơ đảng viên (Mẫu 12-HSĐV)',
    code: 'Mẫu 12-HSĐV',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Bảng kê danh mục toàn bộ tài liệu có trong túi hồ sơ đảng viên (đơn xin vào Đảng, lý lịch, quyết định kết nạp, nghị quyết công nhận...).',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'so-danh-sach-dang-vien',
    title: 'Sổ danh sách đảng viên chi bộ (Mẫu 7-HSĐV)',
    code: 'Mẫu 7-HSĐV',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Sổ theo dõi danh sách toàn bộ đảng viên chính thức, dự bị, biến động tăng giảm đảng số trong chi bộ.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'don-de-nghi-cap-lai-the-dang',
    title: 'Đơn đề nghị cấp lại thẻ đảng viên bị mất hoặc đổi thẻ bị hỏng',
    code: 'Mẫu 8-TĐV',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Đảng viên viết đơn báo cáo lý do mất, hỏng thẻ và đề nghị cấp lại thẻ đảng viên mới.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },

  // 3. HỒ SƠ KẾT NẠP ĐẢNG
  {
    id: 'don-xin-vao-dang',
    title: 'Đơn xin vào Đảng (Mẫu 1-KNĐ)',
    code: 'Mẫu 1-KNĐ',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Người xin vào Đảng bày tỏ nhận thức về tôn chỉ, mục đích của Đảng, động cơ phấn đấu và lời hứa khi được đứng trong hàng ngũ của Đảng.',
    guidance: 'Hướng dẫn số 01-HD/TW',
    isPopular: true,
    status: 'generator'
  },
  {
    id: 'ly-lich-nguoi-xin-vao-dang',
    title: 'Lý lịch của người xin vào Đảng (Mẫu 2-KNĐ)',
    code: 'Mẫu 2-KNĐ',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Bản khai chi tiết toàn diện về lịch sử bản thân, quan hệ gia đình (cha mẹ, vợ/chồng, anh chị em, gia đình bên vợ/chồng) phục vụ thẩm tra.',
    guidance: 'Quy định 24-QĐ/TW & HD 01-HD/TW',
    isPopular: true,
    status: 'generator'
  },
  {
    id: 'giay-gioi-thieu-nguoi-uu-tu',
    title: 'Giấy giới thiệu người ưu tú vào Đảng (Mẫu 3-KNĐ)',
    code: 'Mẫu 3-KNĐ',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Đảng viên chính thức được phân công giúp đỡ nhận xét phẩm chất, năng lực và bày tỏ sự tín nhiệm giới thiệu quần chúng vào Đảng.',
    guidance: 'Điều 4 Điều lệ Đảng',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-gioi-thieu-doan-thanh-nien',
    title: 'Nghị quyết giới thiệu đoàn viên ưu tú vào Đảng của Đoàn Thanh niên / Công đoàn',
    code: 'Mẫu 4-KNĐ',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Biên bản và nghị quyết của Ban Chấp hành Đoàn thanh niên hoặc Công đoàn cơ sở giới thiệu quần chúng ưu tú cho chi bộ kết nạp.',
    guidance: 'Điều lệ Đoàn TNCS Hồ Chí Minh',
    status: 'generator'
  },
  {
    id: 'nhan-xet-chi-uy-noi-cu-tru',
    title: 'Ý kiến nhận xét của chi ủy nơi cư trú đối với người xin vào Đảng (Mẫu 5C-KNĐ)',
    code: 'Mẫu 5C-KNĐ',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Lấy ý kiến nhận xét của Cấp ủy khu phố, thôn ấp nơi cư trú về việc chấp hành chủ trương, nghĩa vụ công dân của người xin vào Đảng.',
    guidance: 'Quy định số 213-QĐ/TW',
    status: 'generator'
  },
  {
    id: 'tong-hop-y-kien-doan-the-noi-cu-tru',
    title: 'Tổng hợp ý kiến nhận xét của đoàn thể và chi ủy nơi cư trú (Mẫu 5-KNĐ)',
    code: 'Mẫu 5-KNĐ',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Chi bộ tổng hợp kết quả lấy ý kiến của các đoàn thể chính trị - xã hội nơi làm việc và chi ủy nơi cư trú.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-chi-bo-ket-nap',
    title: 'Nghị quyết của chi bộ đề nghị kết nạp đảng viên (Mẫu 6-KNĐ)',
    code: 'Mẫu 6-KNĐ',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Nghị quyết hội nghị chi bộ biểu quyết kết nạp quần chúng ưu tú vào Đảng (ghi rõ số phiếu tán thành, không tán thành).',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-dang-uy-co-so-ket-nap',
    title: 'Nghị quyết đề nghị kết nạp đảng viên của Đảng ủy cơ sở (Mẫu 8-KNĐ)',
    code: 'Mẫu 8-KNĐ',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Nghị quyết của Đảng bộ Trường/Đảng bộ cơ sở gửi Đảng bộ cấp trên đề nghị ra quyết định kết nạp đảng viên.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },

  // 4. ĐẢNG VIÊN DỰ BỊ & CÔNG NHẬN CHÍNH THỨC
  {
    id: 'ban-tu-kiem-diem-dang-vien-du-bi',
    title: 'Bản tự kiểm điểm của đảng viên dự bị sau 12 tháng (Mẫu 10-KNĐ)',
    code: 'Mẫu 10-KNĐ',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Đảng viên dự bị tự đánh giá kết quả phấn đấu, rèn luyện sau 12 tháng dự bị để chi bộ xem xét công nhận đảng viên chính thức.',
    guidance: 'Khoản 1 Điều 5 Điều lệ Đảng',
    isPopular: true,
    status: 'generator'
  },
  {
    id: 'ban-nhan-xet-dang-vien-du-bi',
    title: 'Bản nhận xét đảng viên dự bị của người hướng dẫn (Mẫu 11-KNĐ)',
    code: 'Mẫu 11-KNĐ',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Đảng viên chính thức được phân công giúp đỡ nhận xét ưu khuyết điểm và đề nghị chuyển đảng chính thức cho đảng viên dự bị.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'y-kien-chi-uy-noi-cu-tru-du-bi',
    title: 'Ý kiến nhận xét của chi ủy nơi cư trú đối với đảng viên dự bị (Mẫu 12B-KNĐ)',
    code: 'Mẫu 12B-KNĐ',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Phiếu lấy ý kiến nhận xét của chi ủy nơi cư trú về sự gương mẫu chấp hành nghĩa vụ công dân của đảng viên dự bị.',
    guidance: 'Quy định số 213-QĐ/TW',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-chi-bo-cong-nhan-chinh-thuc',
    title: 'Nghị quyết chi bộ đề nghị công nhận đảng viên chính thức (Mẫu 13-KNĐ)',
    code: 'Mẫu 13-KNĐ',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Nghị quyết hội nghị chi bộ biểu quyết chuyển đảng chính thức cho đảng viên dự bị khi hết thời gian thử thách 12 tháng.',
    guidance: 'HD 38-HD/BTCTW',
    isPopular: true,
    status: 'generator'
  },

  // 5. SINH HOẠT CHI BỘ HẰNG THÁNG
  {
    id: 'bien-ban-sinh-hoat-chi-bo',
    title: 'Biên bản sinh hoạt chi bộ hằng tháng (định kỳ)',
    code: 'Biên bản họp Chi bộ',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Biên bản ghi chép diễn biến cuộc họp chi bộ thường kỳ: quân số, đánh giá công tác tháng qua, thảo luận, kết luận và biểu quyết nghị quyết.',
    guidance: 'Chỉ thị số 10-CT/TW & Hướng dẫn 12-HD/BTCTW',
    isPopular: true,
    status: 'generator'
  },
  {
    id: 'nghi-quyet-chi-bo-hang-thang',
    title: 'Nghị quyết chi bộ tháng (Nghị quyết sinh hoạt thường kỳ)',
    code: 'Nghị quyết tháng',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Văn kiện ban hành phương hướng, nhiệm vụ trọng tâm và phân công đảng viên phụ trách thực hiện trong tháng tiếp theo.',
    guidance: 'Quy định 66-QĐ/TW',
    status: 'generator'
  },
  {
    id: 'bien-ban-sinh-hoat-chuyen-de',
    title: 'Biên bản sinh hoạt chuyên đề của chi bộ',
    code: 'Sinh hoạt chuyên đề',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Ghi chép nội dung sinh hoạt chuyên đề mỗi quý một lần (về học tập Bác Hồ, chuyển đổi số, chuyên môn nghiệp vụ...).',
    guidance: 'Hướng dẫn số 12-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'khung-tieu-chi-danh-gia-buoi-hop',
    title: 'Khung tiêu chí đánh giá chất lượng sinh hoạt chi bộ',
    code: 'Khung tiêu chí',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Bảng chấm điểm 100 điểm đánh giá chất lượng kỳ họp chi bộ (tỷ lệ đảng viên dự họp, chuẩn bị nội dung, dân chủ thảo luận...).',
    guidance: 'Hướng dẫn số 12-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'don-xin-mien-sinh-hoat-dang',
    title: 'Đơn xin miễn công tác và sinh hoạt Đảng (do tuổi cao, sức khỏe, đi xa)',
    code: 'Mẫu Đơn miễn SHĐ',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Đảng viên làm đơn trình bày lý do sức khỏe hoặc đi làm việc xa nơi cư trú xin miễn sinh hoạt Đảng theo quy định.',
    guidance: 'Quy định số 24-QĐ/TW',
    status: 'generator'
  },

  // 6. CHUYỂN SINH HOẠT ĐẢNG
  {
    id: 'don-xin-chuyen-sinh-hoat-dang',
    title: 'Đơn xin chuyển sinh hoạt đảng (chính thức / tạm thời)',
    code: 'Đơn chuyển SHĐ',
    category: 'chuyen-sinh-hoat',
    categoryLabel: 'Chuyển Sinh Hoạt Đảng',
    desc: 'Đảng viên làm đơn khi thay đổi nơi cư trú, chuyển công tác sang đơn vị mới hoặc đi học tập, công tác dài ngày.',
    guidance: 'Hướng dẫn số 01-HD/TW',
    isPopular: true,
    status: 'generator'
  },
  {
    id: 'ban-kiem-diem-chuyen-sinh-hoat-dang',
    title: 'Bản kiểm điểm đảng viên khi chuyển sinh hoạt đảng',
    code: 'Kiểm điểm chuyển Đảng',
    category: 'chuyen-sinh-hoat',
    categoryLabel: 'Chuyển Sinh Hoạt Đảng',
    desc: 'Bản tự kiểm điểm quá trình công tác, tu dưỡng tại chi bộ cũ trước khi bàn giao hồ sơ chuyển sang chi bộ mới.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'giay-gioi-thieu-sinh-hoat-dang-chinh-thuc',
    title: 'Giấy giới thiệu sinh hoạt đảng chính thức (Mẫu 1-SHĐ)',
    code: 'Mẫu 1-SHĐ',
    category: 'chuyen-sinh-hoat',
    categoryLabel: 'Chuyển Sinh Hoạt Đảng',
    desc: 'Giấy giới thiệu niêm phong kèm hồ sơ đảng viên để chuyển sinh hoạt đảng trọn vẹn sang đảng bộ mới.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'giay-gioi-thieu-sinh-hoat-dang-tam-thoi',
    title: 'Giấy giới thiệu sinh hoạt đảng tạm thời (Mẫu 2-SHĐ)',
    code: 'Mẫu 2-SHĐ',
    category: 'chuyen-sinh-hoat',
    categoryLabel: 'Chuyển Sinh Hoạt Đảng',
    desc: 'Dành cho đảng viên đi công tác, học tập, làm việc có thời hạn từ 3 đến 12 tháng tại nơi khác nhưng vẫn giữ biên chế và đóng đảng phí tại chi bộ gốc.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },

  // 7. ĐẠI HỘI CHI BỘ / ĐẢNG BỘ
  {
    id: 'chuong-trinh-dai-hoi-chi-bo',
    title: 'Chương trình chi tiết và Kịch bản điều hành Đại hội Chi bộ',
    code: 'Kịch bản Đại hội',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Khung chương trình Đại hội chi bộ nhiệm kỳ mới, phân vai Đoàn Chủ tịch, Ban Thư ký, Ban thẩm tra tư cách đại biểu và Ban kiểm phiếu.',
    guidance: 'Chỉ thị số 35-CT/TW',
    isPopular: true,
    status: 'generator'
  },
  {
    id: 'de-an-nhan-su-cap-uy-chi-bo',
    title: 'Đề án nhân sự cấp ủy, Bí thư, Phó Bí thư chi bộ nhiệm kỳ mới',
    code: 'Đề án nhân sự',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Xác định tiêu chuẩn, cơ cấu, độ tuổi, tỷ lệ nữ, số lượng cấp ủy viên và quy trình nhân sự trước Đại hội.',
    guidance: 'Chỉ thị số 35-CT/TW',
    status: 'generator'
  },
  {
    id: 'bien-ban-kiem-phieu-bau-cu-dai-hoi',
    title: 'Biên bản kiểm phiếu bầu cử Cấp ủy, Bí thư, Phó Bí thư tại Đại hội',
    code: 'Mẫu BB-KPĐH',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Biên bản kiểm phiếu bầu Ban Chấp hành Chi bộ, bầu Bí thư, Phó bí thư chi bộ theo quy chế bầu cử trong Đảng.',
    guidance: 'Quy chế bầu cử trong Đảng (QĐ 244-QĐ/TW)',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-dai-hoi-chi-bo',
    title: 'Nghị quyết Đại hội Chi bộ nhiệm kỳ mới',
    code: 'Nghị quyết Đại hội',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Văn kiện chính thức của Đại hội thông qua các chỉ tiêu nhiệm vụ chính trị, công tác xây dựng Đảng và kết quả bầu cử.',
    guidance: 'Chỉ thị số 35-CT/TW',
    status: 'generator'
  },
  {
    id: 'to-trinh-de-nghi-chuan-y-ket-qua-bau-cu',
    title: 'Tờ trình đề nghị Đảng ủy cấp trên chuẩn y kết quả bầu cử Chi bộ',
    code: 'Tờ trình chuẩn y',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Chi bộ báo cáo kết quả Đại hội và kính trình Đảng ủy cơ sở / Đảng ủy Khối ra quyết định chuẩn y Chi ủy, Bí thư, Phó Bí thư.',
    guidance: 'Quy chế bầu cử trong Đảng',
    status: 'generator'
  },

  // 8. KHEN THƯỞNG & KỶ LUẬT
  {
    id: 'to-khai-de-nghi-tang-huy-hieu-dang',
    title: 'Bản khai quá trình hoạt động cách mạng đề nghị tặng Huy hiệu Đảng',
    code: 'Mẫu 3-HHĐ',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Đảng viên đủ tuổi Đảng (30, 40, 45, 50, 55, 60, 65... năm tuổi Đảng) kê khai quá trình rèn luyện để đề nghị xét tặng Huy hiệu.',
    guidance: 'HD 38-HD/BTCTW',
    isPopular: true,
    status: 'generator'
  },
  {
    id: 'ke-hoach-kiem-tra-giam-sat-chi-bo',
    title: 'Kế hoạch công tác kiểm tra, giám sát đảng viên của chi bộ trong năm',
    code: 'Kế hoạch KT-GS',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Xác định đối tượng đảng viên được kiểm tra chấp hành Điều lệ Đảng, kiểm tra thực hiện cam kết tu dưỡng trong năm.',
    guidance: 'Quy định số 22-QĐ/TW',
    status: 'generator'
  },
  {
    id: 'bien-ban-hop-xem-xet-ky-luat',
    title: 'Biên bản hội nghị chi bộ xem xét, đề nghị thi hành kỷ luật đảng viên',
    code: 'Mẫu BB-KL',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Ghi nhận quá trình kiểm điểm của đảng viên vi phạm, ý kiến thảo luận của chi bộ và kết quả bỏ phiếu kín đề nghị hình thức kỷ luật.',
    guidance: 'Quy định số 69-QĐ/TW',
    status: 'generator'
  },

  // --- BIỂU MẪU ĐƯỢC TỔNG HỢP BỔ SUNG TỪ NỀN TẢNG LATENDOC ---
  {
    id: 'ban-cam-ket-tu-duong-ren-luyen-phan-dau-dang-vien',
    title: 'bản cam kết tu dưỡng, rèn luyện, phấn đấu của đảng viên (đầu năm)',
    code: 'Mẫu b',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Bản cam kết rèn luyện, tu dưỡng, phấn đấu đầu năm của cán bộ, đảng viên (phiếu phấn đấu đầu năm, bản đăng ký phấn đấu của đảng viên)… Tải file Word miễn phí.',
    guidance: 'Nghị quyết TW 4 & Chỉ thị 05-CT/TW',
    status: 'ready',
    targetPath: '/ban-cam-ket-tu-duong-ren-luyen-dang-vien'
  },
  {
    id: 'ban-dang-ky-chuong-trinh-hanh-dong-ca-nhan-dang-vien',
    title: 'Kế hoạch cá nhân học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh',
    code: 'Kế hoạch học tập Bác',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Cán bộ, giáo viên, nhân viên, đảng viên lập kế hoạch hành động thực hiện học tập và làm theo Bác theo chuyên đề hằng năm.',
    guidance: 'Chỉ thị 05-CT/TW & Kết luận 01-KL/TW',
    isPopular: true,
    status: 'ready',
    targetPath: '/soan-thao-bieu-mau-dang/ban-dang-ky-chuong-trinh-hanh-dong-ca-nhan-dang-vien'
  },
  {
    id: 'ke-hoach-ca-nhan-hoc-tap-theo-bac',
    title: 'Kế hoạch cá nhân học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh (Chuyên đề năm)',
    code: 'Mẫu KH-HTB',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Kế hoạch đăng ký nội dung “làm theo” Bác về đạo đức lối sống, nâng cao nghiệp vụ, tính tiên phong gương mẫu và biện pháp thực hiện.',
    guidance: 'Kết luận số 01-KL/TW',
    isPopular: true,
    status: 'ready',
    targetPath: '/soan-thao-bieu-mau-dang/ke-hoach-ca-nhan-hoc-tap-theo-bac'
  },
  {
    id: 'ban-kiem-diem-dang-vien-duong-chuc',
    title: 'bản tự kiểm điểm đảng viên khi chuyển sinh hoạt (đảng viên đang công tác)',
    code: 'Mẫu b',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Bản tự kiểm điểm về tư tưởng, đạo đức, nhiệm vụ của đảng viên khi chuyển sinh hoạt đảng, có nhận xét của chi bộ. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'ban-kiem-diem-dang-vien-khong-lam-viec-he-thong-chinh-tri-02c-hd43',
    title: 'bản kiểm điểm đảng viên cuối năm, tự đánh giá, xếp loại Mẫu 02C (đảng viên không làm việc trong hệ thống chính trị; dùng cho kiểm điểm năm 2026, HD 43, CV 2772)',
    code: 'Mẫu 02C',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Mẫu 02C-HD KĐ.ĐG theo Hướng dẫn 43-HD/BTCTW ngày 31/10/2025 và Quy định 366-QĐ/TW, dùng cho kiểm điểm, đánh giá, xếp loại đảng viên… Tải file Word miễn phí.',
    guidance: 'HD 43-HD/BTCTW & CV 2772-CV/BTCTW',
    status: 'generator'
  },
  {
    id: 'ban-tu-kiem-diem-dang-vien-du-bi-10-knd',
    title: 'bản tự kiểm điểm của đảng viên dự bị (Mẫu 10-KNĐ)',
    code: 'Mẫu 10-KN',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Đảng viên dự bị tự kiểm điểm trước khi hết thời gian dự bị: ưu điểm, khuyết điểm, biện pháp khắc phục. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'ban-tuong-trinh-mat-the-dang-vien',
    title: 'bản tường trình về việc mất thẻ đảng viên',
    code: 'Mẫu b',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Mẫu bản tường trình của đảng viên về việc làm mất thẻ đảng, kính gửi Đảng ủy, cấp ủy chi bộ và cấp ủy cấp trên, đề nghị cấp lại thẻ… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bang-cham-diem-tap-the-chi-bo-truong-dai-hoc-thang-100-diem',
    title: 'bảng tự chấm điểm tập thể chi bộ, đảng bộ trường đại học, cao đẳng (100 điểm, cụ thể hoá Quy định 366)',
    code: 'Mẫu b',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Bảng tiêu chí có điểm tối đa và cột điểm tự chấm để chi bộ, đảng bộ bộ phận trong trường đại học, cao đẳng tự đánh giá, xếp loại chất… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bang-diem-danh-gia-chi-bo-bon-tot',
    title: 'bảng điểm đánh giá, công nhận "chi bộ bốn tốt", "đảng bộ cơ sở bốn tốt" (100 điểm)',
    code: 'Mẫu b',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Bảng tiêu chí có điểm tối đa, điểm tự chấm và điểm tổ thẩm định chấm cho bốn nhóm: hoàn thành tốt nhiệm vụ chính trị, chất lượng sinh… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bao-cao-chinh-tri-dai-hoi-chi-bo',
    title: 'báo cáo chính trị trình đại hội chi bộ',
    code: 'Mẫu b',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Chi uỷ kiểm điểm nhiệm kỳ, nêu phương hướng nhiệm vụ nhiệm kỳ mới, trình đại hội chi bộ. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bao-cao-chinh-tri-trinh-dai-hoi-chi-bo-truong-hoc',
    title: 'báo cáo chính trị trình Đại hội chi bộ nhà trường',
    code: 'Mẫu b',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Chi bộ trường học dùng làm báo cáo chính trị trình đại hội nhiệm kỳ. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bao-cao-cong-tac-chuan-bi-dai-hoi-chi-bo',
    title: 'báo cáo công tác chuẩn bị đại hội chi bộ',
    code: 'Mẫu b',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Chi bộ dùng để báo cáo đảng ủy cấp trên về việc chuẩn bị đại hội. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bao-cao-ket-qua-cong-tac-kiem-tra-giam-sat-cua-chi-bo',
    title: 'báo cáo kết quả công tác kiểm tra, giám sát của chi bộ',
    code: 'Mẫu b',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Mẫu báo cáo năm của chi bộ về kiểm tra, giám sát đảng viên, thi hành kỷ luật, giải quyết đơn thư tố cáo khiếu nại, kiểm tra tài chính… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bao-cao-ket-qua-cong-tac-kiem-tra-giam-sat-ky-luat-dang-cua-dang-uy',
    title: 'báo cáo kết quả công tác kiểm tra, giám sát, kỷ luật đảng của đảng ủy',
    code: 'Mẫu b',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Mẫu báo cáo năm của đảng ủy về kiểm tra, giám sát của cấp ủy và UBKT, thi hành kỷ luật, giải quyết đơn thư tố cáo khiếu nại, kiểm tra… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bao-cao-ket-qua-kiem-tra-dang-vien-cua-chi-bo',
    title: 'báo cáo kết quả kiểm tra đối với đảng viên (tổ kiểm tra của chi bộ)',
    code: 'Mẫu b',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Tổ kiểm tra lập sau khi kiểm tra một đảng viên: lý lịch, nội dung, kết quả và đề nghị. Gửi chi bộ để xem xét ra thông báo kết luận. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bao-cao-ket-qua-xay-dung-chi-bo-bon-tot',
    title: 'báo cáo kết quả xây dựng "chi bộ bốn tốt", "đảng bộ cơ sở bốn tốt"',
    code: 'Mẫu b',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Chi bộ, đảng bộ cơ sở báo cáo cấp ủy cấp trên kết quả xây dựng mô hình "chi bộ bốn tốt": tình hình chi bộ; kết quả lãnh đạo thực hiện… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bao-cao-ket-qua-xem-xet-de-nghi-thi-hanh-ky-luat-dang-vien-cua-chi-bo',
    title: 'báo cáo kết quả xem xét, đề nghị thi hành kỷ luật đảng viên (tổ kiểm tra của chi bộ)',
    code: 'Mẫu b',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Tổ kiểm tra của chi bộ lập sau khi xem xét đảng viên vi phạm, trình hội nghị chi bộ xem xét kỷ luật (họp chi bộ xét kỷ luật đảng… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bao-cao-kiem-diem-tap-the-ban-thuong-vu-dang-uy-mau-01',
    title: 'báo cáo kiểm điểm tập thể Ban Thường vụ Đảng uỷ cuối năm (Mẫu 01, CV 2772)',
    code: 'Mẫu 01',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Ban Thường vụ Đảng uỷ (và các tập thể lãnh đạo, quản lý khác) kiểm điểm, tự đánh giá, xếp loại chất lượng cuối năm theo Mẫu 01-HD… Tải file Word miễn phí.',
    guidance: 'HD 01-HD/TW',
    status: 'generator'
  },
  {
    id: 'bao-cao-kiem-diem-tap-the-chi-bo-2025',
    title: 'báo cáo kiểm điểm, tự đánh giá, xếp loại chất lượng của tập thể chi bộ',
    code: 'Mẫu b',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Chi bộ, tập thể lãnh đạo kiểm điểm cuối năm: nội dung kiểm điểm, kết quả, tự xếp loại. Chi uỷ lập, gửi đảng uỷ cấp trên. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bao-cao-sinh-hoat-chi-bo-hang-thang-2026',
    title: 'báo cáo công tác lãnh đạo của chi bộ hàng tháng',
    code: 'Mẫu b',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Báo cáo kết quả nhiệm vụ tháng và phương hướng tháng sau, do chi uỷ hoặc bí thư chi bộ lập để trình bày trước chi bộ. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bao-cao-tham-dinh-nghi-quyet-cong-nhan-dang-vien-chinh-thuc-14-knd',
    title: 'báo cáo thẩm định nghị quyết đề nghị công nhận đảng viên chính thức (Mẫu 14-KNĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 14-KN',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Đảng uỷ bộ phận lập báo cáo này gửi đảng uỷ cơ sở sau khi thẩm định nghị quyết của chi bộ đề nghị công nhận đảng viên dự bị thành đảng… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'bao-cao-tham-dinh-nghi-quyet-de-nghi-ket-nap-dang-vien-7-knd-hd38',
    title: 'báo cáo thẩm định nghị quyết đề nghị kết nạp đảng viên của đảng uỷ bộ phận (Mẫu 7-KNĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 7-KN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Đảng uỷ bộ phận dùng mẫu này để báo cáo đảng uỷ cơ sở kết quả thẩm định nghị quyết đề nghị kết nạp đảng viên của chi bộ: thành phần… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'bao-cao-tong-ket-cong-tac-nam-chi-bo',
    title: 'báo cáo tổng kết công tác năm và phương hướng nhiệm vụ của chi bộ',
    code: 'Mẫu b',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Báo cáo của chi bộ, đảng ủy cơ sở tổng kết công tác lãnh đạo chính trị tư tưởng, nhiệm vụ chính trị, xây dựng chi bộ trong năm, nêu… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bao-cao-tong-ket-cong-tac-xay-dung-dang-nam-cua-dang-uy-co-so',
    title: 'báo cáo tổng kết công tác xây dựng Đảng năm của đảng ủy cơ sở',
    code: 'Mẫu b',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Đảng ủy xã, phường dùng để tổng kết cuối năm và đề ra phương hướng năm sau. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bao-cao-xem-xet-cho-ra-khoi-dang-cua-chi-bo',
    title: 'báo cáo của chi bộ về việc xem xét cho ra khỏi Đảng',
    code: 'Mẫu b',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Chi bộ báo cáo lên đảng ủy cấp trên quá trình tiếp nhận đơn, tiếp xúc, giải quyết và đề xuất việc cho đảng viên ra khỏi Đảng. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bao-cao-xem-xet-xoa-ten-dang-vien',
    title: 'báo cáo của chi bộ về việc xem xét xóa tên đảng viên',
    code: 'Mẫu b',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Chi bộ báo cáo lên đảng ủy cấp trên việc đề nghị xóa tên đảng viên, nêu thông tin đảng viên, lý do và quá trình xem xét. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-dai-hoi-chi-bo-mau-so-9',
    title: 'biên bản đại hội chi bộ (Mẫu số 9)',
    code: 'Mẫu s',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Thư ký đại hội chi bộ dùng để ghi biên bản đại hội. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-giao-nhan-so-danh-sach-va-ho-so-dang-vien-9-shd-hd38',
    title: 'biên bản giao nhận sổ danh sách đảng viên và hồ sơ đảng viên khi chia tách, sáp nhập (Mẫu 9-SHĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 9-SH',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Tổ chức đảng chia tách, sáp nhập hoặc giải thể dùng biên bản này khi bàn giao sổ danh sách đảng viên và hồ sơ đảng viên cho tổ chức… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'bien-ban-hoi-nghi-chi-bo-danh-gia-xep-loai-chat-luong-cuoi-nam',
    title: 'biên bản hội nghị chi bộ kiểm điểm, đánh giá, xếp loại chất lượng tổ chức đảng, đảng viên cuối năm',
    code: 'Mẫu bi',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Thư ký ghi biên bản hội nghị chi bộ cuối năm: thời gian, địa điểm, số đảng viên dự, chủ tọa, thư ký; nội dung triển khai; phân tích… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-hoi-nghi-dang-uy-chi-bo-uy-ban-kiem-tra',
    title: 'biên bản hội nghị Đảng ủy/Chi bộ/Ủy ban Kiểm tra (Mẫu số 12)',
    code: 'Mẫu s',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Mẫu biên bản hội nghị của Đảng ủy, Chi bộ hoặc Ủy ban Kiểm tra khi xem xét báo cáo kết quả giám sát, có phần thành phần, ý kiến tham… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-hop-chi-bo',
    title: 'biên bản họp chi bộ',
    code: 'Mẫu bi',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Mẫu biên bản sinh hoạt chi bộ hằng tháng của Đảng, gồm phần mở đầu, nội dung (thông tin thời sự, đánh giá nghị quyết, học tập và làm… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-hop-chi-bo-de-nghi-cong-nhan-dang-vien-chinh-thuc',
    title: 'biên bản họp chi bộ xét đề nghị công nhận đảng viên chính thức',
    code: 'Mẫu bi',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Chi bộ ghi lại cuộc họp xét, đề nghị công nhận đảng viên dự bị thành đảng viên chính thức theo Điều 5 Điều lệ Đảng: số đảng viên có… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-hop-lay-y-kien-dang-vien-du-bi-chuyen-chinh-thuc',
    title: 'biên bản họp chi đoàn lấy ý kiến đảng viên dự bị chuyển chính thức',
    code: 'Mẫu bi',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Chi đoàn nơi đảng viên dự bị sinh hoạt ghi biên bản góp ý khi xét chuyển Đảng chính thức. Gửi chi bộ để làm hồ sơ. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-hop-uy-ban-kiem-tra-dang-uy',
    title: 'biên bản họp định kỳ Ủy ban kiểm tra Đảng ủy (kèm biểu quyết kỷ luật)',
    code: 'Mẫu bi',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Thư ký Ủy ban kiểm tra Đảng ủy ghi biên bản họp định kỳ hằng quý: thành phần, nội dung, ý kiến thảo luận, kết quả bỏ phiếu hình thức… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-hop-xet-ket-nap-doan-vien',
    title: 'biên bản họp xét kết nạp đoàn viên',
    code: 'Mẫu bi',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Chi đoàn ghi lại cuộc họp xét kết nạp thanh niên vào Đoàn: người giới thiệu, ý kiến thảo luận, kết quả biểu quyết. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-kiem-phieu-bau-chi-uy-vien-bi-thu-pho-bi-thu-chi-bo',
    title: 'biên bản kiểm phiếu bầu chi uỷ, bí thư, phó bí thư chi bộ',
    code: 'Mẫu bi',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Ban kiểm phiếu lập sau khi bầu cử tại đại hội chi bộ: số phiếu phát ra, thu vào, hợp lệ, kết quả. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-kiem-phieu-xep-loai-dang-vien-hang-nam',
    title: 'biên bản kiểm phiếu xếp loại đảng viên hằng năm',
    code: 'Mẫu bi',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Chi bộ lập sau hội nghị bỏ phiếu kín xếp loại đảng viên cuối năm. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-kiem-phieu-xin-y-kien-nguoi-ung-cu-de-cu-ban-chap-hanh-chi-bo',
    title: 'biên bản kiểm phiếu xin ý kiến về người ứng cử, được đề cử vào Ban chấp hành chi bộ',
    code: 'Mẫu bi',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Tổ kiểm phiếu lập biên bản tại đại hội chi bộ: thành viên tổ, danh sách xin ý kiến, số phiếu phát ra thu về, kết quả và danh sách đưa… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-lam-viec-chi-uy-voi-dang-vien-xin-ra-khoi-dang',
    title: 'biên bản làm việc của chi ủy với đảng viên xin ra khỏi Đảng',
    code: 'Mẫu bi',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Chi ủy ghi lại buổi trao đổi với đảng viên xin ra khỏi Đảng để tìm hiểu lý do, nguyện vọng và khó khăn. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-sinh-hoat-chi-bo-hang-thang-2026',
    title: 'biên bản sinh hoạt chi bộ hàng tháng',
    code: 'Mẫu bi',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Biên bản họp chi bộ thường kỳ hàng tháng (sinh hoạt chi bộ thường lệ) của chi bộ ấp, thôn, khu phố, cơ quan, trường học: số đảng viên… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-sinh-hoat-chuyen-de-chi-bo',
    title: 'biên bản sinh hoạt chuyên đề của chi bộ',
    code: 'Mẫu bi',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Thư ký ghi lại buổi sinh hoạt chuyên đề theo tháng hoặc quý: thành phần dự, nội dung báo cáo, thảo luận và kết luận. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'bien-ban-to-kiem-tra-rut-kinh-nghiem-cong-tac-kiem-tra-chi-bo',
    title: 'biên bản Tổ Kiểm tra rút kinh nghiệm công tác kiểm tra (Chi bộ)',
    code: 'Mẫu bi',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Mẫu biên bản họp rút kinh nghiệm của Tổ Kiểm tra Chi bộ sau kiểm tra: thành phần, mặt làm được và mặt hạn chế. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'chi-bo-dang-vien',
    title: 'Biểu mẫu công tác đảng, chi bộ theo từng bước',
    code: 'mẫu c',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: '132 biểu mẫu công tác đảng, chi bộ chia theo bước: kết nạp, chuyển chính thức, sinh hoạt tháng, đại hội, kiểm điểm, kỷ luật, thẻ đảng.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'chuong-trinh-hoi-nghi-kiem-diem-tap-the-ca-nhan-dang-uy-chi-uy-mau-04',
    title: 'chương trình hội nghị kiểm điểm tập thể, cá nhân đảng ủy, chi ủy cuối năm (Mẫu 04)',
    code: 'Mẫu 04',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Chương trình điều hành hội nghị kiểm điểm cuối năm của đảng ủy, chi ủy, chi bộ: đặt vấn đề, giới thiệu đại biểu; kiểm điểm tập thể… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'chuong-trinh-lam-viec-nam-cua-ban-thuong-vu-dang-uy-xa',
    title: 'chương trình làm việc năm của Ban Thường vụ Đảng ủy xã',
    code: 'Mẫu ch',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Chương trình làm việc cả năm của Ban Thường vụ Đảng ủy cấp xã: căn cứ, nhiệm vụ trọng tâm và nội dung cụ thể từng tháng, kèm đơn vị… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'cong-van-chi-bo-de-nghi-kien-toan-nhan-su-chi-uy',
    title: 'công văn của chi bộ đề nghị xem xét kiện toàn nhân sự chi ủy',
    code: 'Mẫu c',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Chi bộ gửi Ban Thường vụ Đảng ủy cấp trên đề nghị chấp thuận cho chi ủy viên thôi tham gia chi ủy và giới thiệu nhân sự bổ sung. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'cong-van-chi-dao-lam-lai-thu-tuc-ket-nap-dang-vien-mau-1a-hkn',
    title: 'công văn chỉ đạo làm lại thủ tục kết nạp đảng viên (Mẫu 1A-HKN)',
    code: 'Mẫu 1A-HKN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Công văn của Ban Thường vụ yêu cầu đảng ủy làm lại hoặc bổ sung thủ tục xét kết nạp đảng viên có sai sót về thẩm quyền hoặc thủ tục. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'cong-van-de-nghi-cong-nhan-dang-vien-chinh-thuc-2025',
    title: 'công văn đề nghị xét công nhận đảng viên chính thức',
    code: 'Mẫu c',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Chi bộ gửi ban thường vụ đảng uỷ cấp trên đề nghị công nhận đảng viên chính thức, kèm hồ sơ. Bí thư chi bộ ký. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'cong-van-de-nghi-in-the-dang-vien-2-tdv-hd38',
    title: 'công văn đề nghị in thẻ đảng viên, cấp lại, đổi thẻ đảng viên (Mẫu 2-TĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 2-T',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Ban tổ chức tỉnh uỷ và tương đương gửi công văn này đề nghị Ban Tổ chức Trung ương in thẻ đảng viên để phát mới, cấp lại thẻ bị mất… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'cong-van-gioi-thieu-dang-vien-chuyen-sinh-hoat-dang-tiep-12-shd',
    title: 'công văn giới thiệu đảng viên do yêu cầu phải chuyển sinh hoạt đảng tiếp (Mẫu 12-SHĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 12-SH',
    category: 'chuyen-sinh-hoat',
    categoryLabel: 'Chuyển Sinh Hoạt Đảng',
    desc: 'Cấp uỷ đã tiếp nhận đảng viên dùng công văn này giới thiệu đảng viên chuyển tiếp sinh hoạt đảng đến tổ chức đảng khác khi đảng viên… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'cong-van-gioi-thieu-nguoi-da-co-quyet-dinh-ket-nap-dang-17c-knd',
    title: 'công văn giới thiệu người đã có quyết định kết nạp vào Đảng nhưng chuyển nơi khác (Mẫu 17C-KNĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 17C-KN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Ban thường vụ cấp uỷ dùng mẫu này giới thiệu người đã có quyết định kết nạp vào Đảng nhưng chưa tổ chức lễ kết nạp mà chuyển học tập… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'cong-van-gioi-thieu-nguoi-vao-dang-da-lam-thu-tuc-ket-nap-17a-knd',
    title: 'công văn giới thiệu người vào Đảng đã được chi bộ, đảng uỷ cơ sở làm thủ tục đề nghị kết nạp (Mẫu 17A-KNĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 17A-KN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Cấp uỷ cơ sở dùng công văn này giới thiệu người vào Đảng đã được chi bộ, đảng uỷ cơ sở làm xong thủ tục đề nghị kết nạp nhưng chuyển… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'cong-van-gui-de-cuong-tai-lieu-dai-hoi-dang-bo-chi-bo',
    title: 'công văn gửi đề cương, tài liệu phục vụ đại hội đảng bộ, chi bộ',
    code: 'Mẫu c',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Đảng ủy cấp trên dùng gửi các đảng bộ, chi bộ trực thuộc dự thảo đề cương báo cáo, đề án nhân sự và tài liệu phục vụ đại hội nhiệm kỳ… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'cong-van-lay-y-kien-chi-uy-noi-cu-tru-dang-vien-du-bi-2025',
    title: 'công văn lấy ý kiến nhận xét của chi uỷ nơi cư trú đối với đảng viên dự bị',
    code: 'Mẫu c',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Chi bộ nơi công tác gửi chi uỷ nơi cư trú để đề nghị nhận xét đảng viên dự bị trước khi xét chuyển chính thức. Bí thư chi bộ ký. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'danh-sach-dang-vien-de-nghi-tang-huy-hieu-dang-4-hhd-hd38',
    title: 'danh sách đảng viên đề nghị tặng Huy hiệu Đảng (Mẫu 4-HHĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 4-HH',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Đảng uỷ cấp xã hoặc tương đương lập danh sách đảng viên đủ tuổi đảng đề nghị tặng Huy hiệu Đảng gửi ban thường vụ cấp trên; ghi họ… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'danh-sach-dang-vien-de-nghi-truy-tang-huy-hieu-dang-4b-hhd-hd38',
    title: 'danh sách đảng viên đề nghị truy tặng Huy hiệu Đảng (Mẫu 4B-HHĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 4B-HH',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Đảng uỷ cấp xã hoặc tương đương lập danh sách đảng viên đã từ trần nhưng đủ tuổi đảng chưa được tặng huy hiệu, đề nghị cấp trên truy… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'danh-sach-de-nghi-phat-the-dang-vien-1-tdv-hd38',
    title: 'danh sách đề nghị phát thẻ đảng viên (Mẫu 1-TĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 1-T',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Cấp uỷ có thẩm quyền lập danh sách đảng viên đủ điều kiện được phát thẻ đảng viên gửi ban tổ chức cấp tỉnh; ghi họ tên, ngày sinh, quê… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'danh-sach-trich-ngang-ket-qua-bau-cu-ban-chap-hanh-chi-bo',
    title: 'danh sách trích ngang kết quả bầu cử ban chấp hành chi bộ',
    code: 'Mẫu danh',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Chi bộ dùng để gửi đảng ủy cấp trên chuẩn y kết quả bầu cử. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'de-an-nhan-su-cap-uy-dai-hoi-dang-bo-chi-bo-nhiem-ky-moi',
    title: 'đề án nhân sự cấp ủy nhiệm kỳ mới',
    code: 'Mẫu Đảng',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Cấp ủy dùng xây dựng đề án nhân sự ban chấp hành, ban thường vụ, bí thư, phó bí thư nhiệm kỳ mới: đánh giá nhiệm kỳ cũ, tiêu chuẩn, cơ… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'de-an-nhan-su-doan-dai-bieu-du-dai-hoi-dang-bo-cap-tren',
    title: 'đề án nhân sự đoàn đại biểu dự đại hội đảng bộ cấp trên',
    code: 'Mẫu Đảng',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Đảng bộ, chi bộ dùng để xây dựng đề án nhân sự đại biểu dự đại hội cấp trên. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'de-cuong-bao-cao-chinh-tri-dai-hoi-dang-bo-chi-bo',
    title: 'đề cương báo cáo chính trị trình đại hội đảng bộ, chi bộ',
    code: 'Mẫu Đảng',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Đảng bộ, chi bộ dùng làm khung xây dựng báo cáo chính trị trình đại hội: đánh giá nhiệm kỳ cũ, phương hướng, nhiệm vụ và giải pháp… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'de-nghi-ket-nap-doan-vien-moi-cua-bch-chi-doan',
    title: 'văn bản đề nghị kết nạp đoàn viên mới của Ban chấp hành chi đoàn',
    code: 'Mẫu v',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Ban chấp hành chi đoàn gửi Đoàn cấp trên để đề nghị chuẩn y kết nạp đoàn viên mới sau khi hội nghị chi đoàn biểu quyết. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'don-de-nghi-cap-lai-chung-chi-boi-duong-phap-luat-giao-thong-tt17-2026',
    title: 'đơn đề nghị cấp lại chứng chỉ bồi dưỡng kiến thức pháp luật về giao thông đường bộ (Phụ lục XVI, TT 17/2026/TT-BXD)',
    code: 'Mẫu Đảng',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Người bị mất hoặc hỏng chứng chỉ bồi dưỡng kiến thức pháp luật về giao thông đường bộ dùng đơn này đề nghị cơ sở đào tạo cấp lại; kê… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'don-xin-vao-dang-1-knd',
    title: 'đơn xin vào Đảng (Mẫu 1-KNĐ)',
    code: 'Mẫu 1-KN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Người xin vào Đảng viết tay hoặc đánh máy, nêu nhận thức về Đảng và lời hứa khi được kết nạp. Gửi chi uỷ hoặc chi bộ nơi mình sinh hoạt. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'giay-chung-nhan-hoc-lop-boi-duong-dang-vien-moi-cn-dvm-hd38',
    title: 'giấy chứng nhận học lớp bồi dưỡng đảng viên mới (Mẫu CN-ĐVM, HD 38-HD/BTCTW)',
    code: 'Mẫu CN-',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Trung tâm chính trị cấp xã cấp giấy này cho đảng viên dự bị đã hoàn thành lớp bồi dưỡng lý luận chính trị dành cho đảng viên mới; ghi… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'giay-chung-nhan-nguoi-vao-dang-dang-duoc-giup-do-17-knd-hd38',
    title: 'giấy chứng nhận người vào Đảng đang được tổ chức đảng giúp đỡ, xem xét kết nạp (Mẫu 17-KNĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 17-KN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Cấp uỷ cơ sở cấp giấy này cho quần chúng đang được chi bộ giúp đỡ, xem xét kết nạp nhưng chuyển nơi học tập, công tác; giấy giúp tổ… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'giay-gioi-thieu-di-tham-tra-ly-lich-nguoi-vao-dang-19-knd-hd38',
    title: 'giấy giới thiệu cử đảng viên đi thẩm tra lý lịch người xin vào Đảng (Mẫu 19-KNĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 19-KN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Cấp uỷ cơ sở cấp giấy này cho đảng viên hoặc cấp uỷ viên được cử đi thẩm tra, xác minh lý lịch của người xin vào Đảng và người thân… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'giay-gioi-thieu-nguoi-uu-tu-vao-dang-3-knd',
    title: 'giấy giới thiệu người ưu tú vào Đảng (Mẫu 3-KNĐ)',
    code: 'Mẫu 3-KN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Đảng viên chính thức được phân công giúp đỡ quần chúng nêu lý lịch, ưu khuyết điểm và giới thiệu vào Đảng. Gửi chi bộ xem xét kết nạp. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'giay-gioi-thieu-sinh-hoat-dang-chinh-thuc-1-shd-hd38',
    title: 'giấy giới thiệu sinh hoạt đảng chính thức (Mẫu 1-SHĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 1-SH',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Cấp uỷ dùng giấy giới thiệu loại 10 ô này khi đảng viên chuyển sinh hoạt đảng chính thức sang đảng bộ khác do chuyển công tác, nghỉ… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'giay-gioi-thieu-sinh-hoat-dang-noi-bo-4-shd-hd38',
    title: 'giấy giới thiệu sinh hoạt đảng nội bộ (Mẫu 4-SHĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 4-SH',
    category: 'chuyen-sinh-hoat',
    categoryLabel: 'Chuyển Sinh Hoạt Đảng',
    desc: 'Cấp uỷ dùng giấy loại 7 ô này khi đảng viên chuyển sinh hoạt đảng giữa các chi bộ, đảng bộ trong nội bộ cùng một đảng bộ tỉnh hoặc… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'giay-gioi-thieu-sinh-hoat-dang-ra-ngoai-nuoc-mau-3-shd',
    title: 'giấy giới thiệu sinh hoạt đảng ra ngoài nước (Mẫu 3-SHĐ)',
    code: 'Mẫu 3-SH',
    category: 'chuyen-sinh-hoat',
    categoryLabel: 'Chuyển Sinh Hoạt Đảng',
    desc: 'Giấy giới thiệu đảng viên sinh hoạt đảng ra ngoài nước hai ô, gồm phần giấy giới thiệu và phần đề nghị tiếp nhận. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'giay-gioi-thieu-sinh-hoat-dang-tam-thoi-2-shd-hd38',
    title: 'giấy giới thiệu sinh hoạt đảng tạm thời (Mẫu 2-SHĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 2-SH',
    category: 'chuyen-sinh-hoat',
    categoryLabel: 'Chuyển Sinh Hoạt Đảng',
    desc: 'Chi uỷ, đảng uỷ cơ sở cấp giấy loại 8 ô này cho đảng viên đi học, đi công tác, điều trị dài ngày từ 3 tháng trở lên để sinh hoạt đảng… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'giay-moi-dai-hoi-chi-bo',
    title: 'giấy mời dự đại hội chi bộ',
    code: 'Mẫu gi',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Giấy mời dự đại hội chi bộ nhiệm kỳ, nêu mục đích đại hội (tổng kết nghị quyết nhiệm kỳ trước, xây dựng nghị quyết nhiệm kỳ mới)… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'giay-moi-du-hoi-nghi-dang-uy',
    title: 'giấy mời dự hội nghị (văn bản của Đảng ủy, chi bộ)',
    code: 'Mẫu gi',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Giấy mời của đảng ủy, chi ủy hoặc chi bộ mời từng đồng chí dự hội nghị tổng kết, sơ kết, hội nghị học tập, quán triệt nghị quyết, hội… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'giay-moi-du-sinh-hoat-chi-bo',
    title: 'giấy mời dự sinh hoạt chi bộ',
    code: 'Mẫu gi',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Chi bộ dùng mời đảng viên và thành phần liên quan dự sinh hoạt hoặc họp chi bộ, gồm thành phần, nội dung, thời gian, địa điểm và nơi… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'ke-hoach-chuong-trinh-cong-tac-chi-bo-nam-2026',
    title: 'kế hoạch, chương trình thực hiện nhiệm vụ của chi bộ năm 2026',
    code: 'Mẫu k',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Kế hoạch công tác cả năm của chi bộ: đánh giá năm trước, nhiệm vụ trọng tâm và lịch triển khai. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'ke-hoach-khac-phuc-han-che-khuyet-diem-sau-kiem-diem-chi-bo',
    title: 'kế hoạch khắc phục hạn chế, khuyết điểm sau kiểm điểm, đánh giá, xếp loại chất lượng của chi bộ',
    code: 'Mẫu k',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Chi bộ lập sau hội nghị kiểm điểm cuối năm, căn cứ thông báo kết luận của Đảng ủy: mục đích, yêu cầu; từng hạn chế, khuyết điểm với… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'ke-hoach-kiem-diem-danh-gia-xep-loai-chat-luong-cuoi-nam-dang-uy',
    title: 'kế hoạch kiểm điểm và đánh giá, xếp loại chất lượng đối với tập thể, cá nhân trong hệ thống chính trị cuối năm (của Ban Thường vụ Đảng ủy)',
    code: 'Mẫu k',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Ban Thường vụ Đảng ủy xã, phường, đặc khu ban hành để tổ chức kiểm điểm, đánh giá, xếp loại chất lượng cuối năm theo Quy định… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'ke-hoach-kiem-tra-giam-sat-dang-vien-chi-bo-2026',
    title: 'kế hoạch kiểm tra, giám sát đảng viên của chi bộ năm 2026',
    code: 'Mẫu k',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Bảng kế hoạch kiểm tra, giám sát đảng viên theo quý của chi bộ: thời gian, đối tượng, nội dung, người thực hiện. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'ke-hoach-sinh-hoat-chuyen-de-chi-bo-2026',
    title: 'kế hoạch sinh hoạt chuyên đề của chi bộ năm 2026',
    code: 'Mẫu k',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Bảng lịch sinh hoạt chuyên đề theo tháng hoặc quý: nội dung và người phụ trách. Chi uỷ lập đầu năm, chi bộ thông qua. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'ke-hoach-tu-duong-ren-luyen-phan-dau-cua-dang-vien',
    title: 'kế hoạch tu dưỡng, rèn luyện, phấn đấu của đảng viên',
    code: 'Mẫu k',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Bản kế hoạch cá nhân của đảng viên nộp chi bộ về tu dưỡng, rèn luyện trong năm. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'ket-luan-cua-chi-bo-tai-ky-sinh-hoat-thuong-ky',
    title: 'kết luận của chi bộ tại kỳ sinh hoạt thường kỳ',
    code: 'Mẫu k',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Mẫu kết luận của chi bộ sau sinh hoạt thường kỳ: đánh giá nhiệm vụ kỳ trước, nội dung đã thống nhất, bảng phân công nhiệm vụ và theo… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'khung-tieu-chi-danh-gia-chat-luong-sinh-hoat-chi-bo-2026',
    title: 'khung tiêu chí đánh giá chất lượng sinh hoạt chi bộ hàng tháng (7 tiêu chí, 100 điểm)',
    code: 'Mẫu khung',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Bảng chấm điểm 7 tiêu chí để chi bộ tự đánh giá chất lượng buổi sinh hoạt tháng: thời gian, tỷ lệ dự họp, chuẩn bị nội dung, thảo luận. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'kich-ban-hoi-nghi-tong-ket-cong-tac-dang-dang-uy-don-vi',
    title: 'Kich Ban Hoi Nghi Tong Ket Cong Tac Dang Dang Uy Don Vi',
    code: 'Mẫu Đảng',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Biểu mẫu chuẩn văn bản Đảng: Kich Ban Hoi Nghi Tong Ket Cong Tac Dang Dang Uy Don Vi, hỗ trợ xem trước và xuất file Word chuẩn thể thức theo quy định.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'ly-lich-nguoi-xin-vao-dang-2-knd',
    title: 'lý lịch của người xin vào Đảng (Mẫu 2-KNĐ)',
    code: 'Mẫu 2-KN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Quần chúng ưu tú khai lý lịch bản thân, gia đình, quá trình học tập, công tác. Nộp cùng đơn xin vào Đảng và được cấp uỷ thẩm tra. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'muc-luc-tai-lieu-trong-ho-so-dang-vien-12-hsdv-hd38',
    title: 'mục lục tài liệu trong hồ sơ đảng viên (Mẫu 12-HSĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 12-HS',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Chi bộ, đảng uỷ cơ sở lập mục lục này đặt ở đầu hồ sơ của từng đảng viên, liệt kê các tài liệu có trong hồ sơ: tên tài liệu, số và… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-chi-bo-hang-thang-2026',
    title: 'nghị quyết chi bộ hàng tháng',
    code: 'Mẫu ngh',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Nghị quyết chi bộ ban hành sau cuộc họp tháng, nêu kết quả, nhiệm vụ trọng tâm và phân công thực hiện. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-chi-bo-mien-sinh-hoat-dang-suc-khoe-2025',
    title: 'nghị quyết chi bộ miễn sinh hoạt, miễn công tác đảng viên',
    code: 'Mẫu ngh',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Chi bộ ghi kết quả họp xét miễn sinh hoạt, miễn công tác cho đảng viên do sức khoẻ. Bí thư ký, gửi ban xây dựng Đảng cấp trên. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-cong-nhan-dang-vien-chinh-thuc-13-knd',
    title: 'nghị quyết của chi bộ đề nghị công nhận đảng viên chính thức (Mẫu 13-KNĐ)',
    code: 'Mẫu 13-KN',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Chi bộ ghi kết quả họp đề nghị công nhận đảng viên dự bị thành đảng viên chính thức, kèm tỷ lệ tán thành. Gửi cấp uỷ cấp trên xét. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-cong-nhan-dang-vien-chinh-thuc-dang-uy-co-so-15-knd-hd38',
    title: 'nghị quyết đề nghị công nhận đảng viên chính thức của đảng uỷ cơ sở (Mẫu 15-KNĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 15-KN',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Ban chấp hành đảng bộ cơ sở lập nghị quyết sau khi xét đề nghị của chi bộ về việc công nhận đảng viên chính thức; ghi thành phần họp… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-dai-hoi-dang-bo-chi-bo',
    title: 'nghị quyết đại hội đảng bộ, chi bộ (hai mẫu)',
    code: 'Mẫu ngh',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Đảng bộ, chi bộ dùng để ban hành nghị quyết sau đại hội. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-de-nghi-cong-nhan-dang-vien-chinh-thuc-cua-doan',
    title: 'nghị quyết đề nghị công nhận đảng viên chính thức của Đoàn thanh niên',
    code: 'Mẫu ngh',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'BCH Đoàn khoa ra nghị quyết đề nghị công nhận đảng viên dự bị thành chính thức, gửi chi ủy chi bộ sinh viên và Đảng ủy trường. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-de-nghi-ket-nap-dang-vien-6-knd',
    title: 'nghị quyết của chi bộ đề nghị kết nạp đảng viên (Mẫu 6-KNĐ)',
    code: 'Mẫu 6-KN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Chi bộ ghi kết quả họp xét đề nghị kết nạp quần chúng vào Đảng, kèm số phiếu tán thành. Bí thư ký, gửi cấp uỷ cấp trên. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-de-nghi-ket-nap-dang-vien-cua-dang-uy-co-so-8-knd-hd38',
    title: 'nghị quyết đề nghị kết nạp đảng viên của đảng uỷ cơ sở (Mẫu 8-KNĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 8-KN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Ban chấp hành đảng bộ cơ sở lập nghị quyết này sau khi họp xét hồ sơ người vào Đảng do chi bộ đề nghị; ghi số cấp uỷ viên dự họp, nhận… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-gioi-thieu-doan-vien-cong-doan-vao-dang-4a-knd-hd38',
    title: 'nghị quyết giới thiệu đoàn viên công đoàn vào Đảng (Mẫu 4A-KNĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 4A-KN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Ban chấp hành công đoàn cơ sở ban hành sau khi họp xét, giới thiệu đoàn viên công đoàn ưu tú với chi ủy, đảng ủy để xem xét kết nạp… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'nghi-quyet-gioi-thieu-doan-vien-uu-tu-ket-nap-dang',
    title: 'nghị quyết giới thiệu đoàn viên ưu tú vào Đảng của Ban chấp hành Đoàn',
    code: 'Mẫu ngh',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'BCH Đoàn cơ sở ra nghị quyết giới thiệu đoàn viên ưu tú cho chi ủy chi bộ xem xét kết nạp Đảng. Gửi chi ủy và Đảng ủy cấp trên. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'nhan-xet-dang-vien-du-bi',
    title: 'bản nhận xét đảng viên dự bị (Mẫu 11-KNĐ)',
    code: 'Mẫu 11-KN',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Bản nhận xét của đảng viên chính thức được phân công giúp đỡ đảng viên dự bị. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'phieu-bao-dang-vien-chuyen-sinh-hoat-dang-chinh-thuc-11-shd-hd38',
    title: 'phiếu báo đảng viên chuyển sinh hoạt đảng chính thức (Mẫu 11-SHĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 11-SH',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Cấp uỷ cấp trên trực tiếp của tổ chức cơ sở đảng lập phiếu báo này gửi nơi đảng viên chuyển đến khi làm thủ tục chuyển sinh hoạt đảng… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'phieu-bao-dang-vien-duoc-cong-nhan-chinh-thuc-4-hsdv-hd38',
    title: 'phiếu báo đảng viên được công nhận chính thức (Mẫu 4-HSĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 4-HS',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Đảng uỷ cơ sở lập phiếu báo này gửi cấp uỷ cấp trên khi đảng viên dự bị được công nhận chính thức, để cập nhật cơ sở dữ liệu đảng… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'phieu-bao-dang-vien-ra-khoi-dang-5-hsdv-hd38',
    title: 'phiếu báo đảng viên ra khỏi Đảng (Mẫu 5-HSĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 5-HS',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Đảng uỷ cơ sở dùng phiếu này báo cấp uỷ cấp trên việc đảng viên ra khỏi Đảng do xin ra, bị xoá tên hoặc khai trừ; ghi họ tên, ngày… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'phieu-bao-dang-vien-tu-tran-6-hsdv-hd38',
    title: 'phiếu báo đảng viên từ trần (Mẫu 6-HSĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 6-HS',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Khi đảng viên từ trần, đảng uỷ cơ sở lập phiếu báo này gửi cấp uỷ cấp trên để cập nhật danh sách và cơ sở dữ liệu đảng viên; ghi họ… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'phieu-bau-chi-uy-vien-bi-thu-pho-bi-thu-chi-bo-tai-dai-hoi',
    title: 'phiếu bầu cử chi uỷ, bí thư, phó bí thư tại đại hội chi bộ',
    code: 'Mẫu phi',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Phiếu bầu dùng tại đại hội chi bộ: bầu chi uỷ viên, bí thư, phó bí thư, có số dư. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'phieu-bau-cu-uy-ban-kiem-tra-dang-uy',
    title: 'phiếu bầu Ủy ban kiểm tra Đảng ủy',
    code: 'Mẫu phi',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Phiếu bầu cử không có số dư tại hội nghị Ban Chấp hành Đảng bộ, gồm ba phiếu: Ủy viên, Chủ nhiệm và Phó Chủ nhiệm Ủy ban kiểm tra Đảng… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'phieu-bieu-quyet-danh-gia-xep-loai-chat-luong-dang-vien',
    title: 'phiếu biểu quyết đánh giá, xếp loại chất lượng đảng viên',
    code: 'Mẫu phi',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Phiếu chi bộ dùng khi họp cuối năm để biểu quyết mức xếp loại chất lượng từng đảng viên: họ tên, chức vụ, điểm và mức đảng viên tự… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'phieu-bieu-quyet-de-nghi-xep-loai-dang-bo-chi-bo-mau-6a',
    title: 'phiếu biểu quyết đề nghị xếp loại đảng bộ, chi bộ (Mẫu 6A)',
    code: 'Mẫu 6A',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Phiếu bỏ phiếu kín tại hội nghị kiểm điểm cuối năm để đề nghị mức xếp loại chất lượng của đảng bộ, chi bộ: Hoàn thành xuất sắc, Hoàn… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'phieu-bieu-quyet-de-nghi-xep-loai-dang-vien-mau-6d',
    title: 'phiếu biểu quyết đề nghị xếp loại đảng viên (Mẫu 6D)',
    code: 'Mẫu 6D',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Phiếu chi bộ dùng để biểu quyết đề nghị mức xếp loại chất lượng từng đảng viên cuối năm: họ tên, bốn mức Hoàn thành xuất sắc, Hoàn… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'phieu-bieu-quyet-thi-hanh-ky-luat-dang-vien',
    title: 'phiếu biểu quyết thi hành kỷ luật đối với đảng viên (Mẫu 10A)',
    code: 'Mẫu 10A',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Mẫu phiếu biểu quyết các hình thức kỷ luật đối với đảng viên: không kỷ luật, khiển trách, cảnh cáo, cách chức, khai trừ, kèm ghi chú… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'phieu-bieu-quyet-xep-loai-dang-vien-thuoc-tham-quyen-mau-6e',
    title: 'phiếu biểu quyết xếp loại đảng viên thuộc thẩm quyền của đảng ủy, chi bộ cơ sở (Mẫu 6E)',
    code: 'Mẫu 6E',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Phiếu đảng ủy, chi bộ cơ sở biểu quyết xếp loại chất lượng đảng viên thuộc thẩm quyền quyết định của mình cuối năm, theo bốn mức, đánh… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'phieu-dang-vien-2025',
    title: 'phiếu đảng viên (Mẫu 2-HSĐV)',
    code: 'Mẫu 2-HS',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Phiếu đảng viên khai thông tin cá nhân, quá trình học tập, công tác, gia đình (hồ sơ đảng viên). Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'phieu-de-xuat-tu-danh-gia-xep-loai-chat-luong-chi-bo',
    title: 'phiếu đề xuất tự đánh giá, xếp loại chất lượng chi bộ',
    code: 'Mẫu phi',
    category: 'kiem-diem',
    categoryLabel: 'Bản Kiểm Điểm & Đánh Giá',
    desc: 'Đảng viên trong chi bộ chấm điểm tự đánh giá tập thể chi bộ theo nhóm tiêu chí chung (30 điểm) và nhóm tiêu chí về kết quả thực hiện… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'phieu-nhan-xet-dang-vien-mien-sinh-hoat-noi-cu-tru-mau-1-qd221',
    title: 'phiếu nhận xét đối với đảng viên giới thiệu nhưng được miễn sinh hoạt nơi cư trú (Mẫu 1, Quy định 221-QĐ/TW)',
    code: 'Mẫu 1',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Chi uỷ nơi cư trú, sau khi họp với ban công tác mặt trận thôn, tổ dân phố, nhận xét đảng viên được miễn sinh hoạt nơi cư trú: nêu… Tải file Word miễn phí.',
    guidance: 'Quy định số 221-QĐ/TW',
    status: 'generator'
  },
  {
    id: 'phieu-nhan-xet-trach-nhiem-dang-vien-noi-cu-tru-mau-2-qd221',
    title: 'phiếu nhận xét trách nhiệm của đảng viên đang công tác đối với tổ chức đảng và Nhân dân nơi cư trú (Mẫu 2, Quy định 221-QĐ/TW)',
    code: 'Mẫu 2',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Chi uỷ nơi cư trú nhận xét đảng viên đang công tác hằng năm: nêu gương, giữ mối liên hệ và dự họp định kỳ, góp ý xây dựng tổ chức… Tải file Word miễn phí.',
    guidance: 'Quy định số 221-QĐ/TW',
    status: 'generator'
  },
  {
    id: 'phieu-xin-y-kien-nguoi-ung-cu-de-cu-vao-ban-chap-hanh-chi-bo',
    title: 'phiếu xin ý kiến về người ứng cử, được đề cử vào Ban chấp hành chi bộ tại đại hội',
    code: 'Mẫu phi',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Chi bộ dùng tại đại hội để đại biểu cho ý kiến đồng ý hoặc không đồng ý đối với từng người trong danh sách ứng cử, đề cử vào Ban chấp… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'quy-che-lam-viec-cua-dai-hoi-dang-bo-chi-bo',
    title: 'quy chế làm việc của đại hội đảng bộ, chi bộ',
    code: 'Mẫu quy',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Đảng bộ, chi bộ dùng để trình đại hội thông qua quy chế làm việc. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-ban-hanh-quy-che-lam-viec-cua-chi-uy-chi-bo-mau-2-qclv',
    title: 'quyết định ban hành quy chế làm việc của chi ủy, chi bộ (Mẫu 2-QCLV)',
    code: 'Mẫu 2-QCLV',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Chi bộ cơ sở dùng để ban hành quy chế làm việc theo khung của Ban Tổ chức Trung ương. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-cap-lai-the-dang-vien-bi-mat-5-tdv-hd38',
    title: 'quyết định cấp lại thẻ đảng viên bị mất cho cá nhân (Mẫu 5-TĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 5-T',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Ban thường vụ cấp uỷ ra quyết định này cấp lại thẻ đảng viên cho cá nhân đảng viên làm mất thẻ; ghi họ tên, ngày sinh, ngày vào Đảng… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-chi-dinh-bi-thu-chi-bo',
    title: 'quyết định chỉ định Chi uỷ viên, Bí thư, Phó Bí thư chi bộ',
    code: 'Mẫu quy',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Đảng uỷ cấp trên chỉ định chi uỷ viên, bí thư, phó bí thư chi bộ mới thành lập hoặc sau sắp xếp. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-cho-dang-vien-ra-khoi-dang-1-crkd-hd38',
    title: 'quyết định cho đảng viên ra khỏi Đảng của đảng uỷ cấp xã (Mẫu 1-CRKĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 1-CRK',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Ban thường vụ đảng uỷ cấp xã hoặc tương đương dùng mẫu này khi xem xét đơn và cho đảng viên xin ra khỏi Đảng; ghi họ tên, ngày sinh… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-chuan-y-ket-qua-bau-cu-chi-bo',
    title: 'quyết định chuẩn y kết quả bầu cử Chi bộ',
    code: 'Mẫu quy',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Quyết định của Đảng ủy cấp trên chuẩn y kết quả bầu cử Chi bộ, nêu danh sách Bí thư, Phó Bí thư, Chi ủy viên, căn cứ Điều lệ Đảng và… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-chuyen-giao-to-chuc-co-so-dang-va-dang-vien-7-shd-hd38',
    title: 'quyết định chuyển giao tổ chức cơ sở đảng và đảng viên khi chia tách, sáp nhập (Mẫu 7-SHĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 7-SH',
    category: 'chuyen-sinh-hoat',
    categoryLabel: 'Chuyển Sinh Hoạt Đảng',
    desc: 'Ban thường vụ đảng uỷ cấp xã hoặc tương đương dùng mẫu này khi chia tách, sáp nhập tổ chức cơ sở đảng trong phạm vi đảng bộ, để chuyển… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-chuyen-giao-to-chuc-va-dang-vien-chi-bo-5-shd-hd38',
    title: 'quyết định chuyển giao tổ chức và đảng viên khi chia tách, sáp nhập chi bộ (Mẫu 5-SHĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 5-SH',
    category: 'chuyen-sinh-hoat',
    categoryLabel: 'Chuyển Sinh Hoạt Đảng',
    desc: 'Đảng uỷ cơ sở dùng quyết định này khi chia tách, sáp nhập các chi bộ trực thuộc trong phạm vi đảng bộ cơ sở, để chuyển giao tổ chức và… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-cong-nhan-chi-bo-bon-tot',
    title: 'quyết định công nhận "chi bộ bốn tốt", "đảng bộ cơ sở bốn tốt"',
    code: 'Mẫu quy',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Ban Thường vụ cấp ủy cấp trên (hoặc đảng ủy cơ sở với chi bộ trực thuộc) quyết định công nhận chi bộ, đảng bộ cơ sở đạt "bốn tốt" năm… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-cong-nhan-chi-bo-hoan-thanh-xuat-sac-nhiem-vu-6-kt-hd38',
    title: 'quyết định công nhận chi bộ trực thuộc đạt tiêu chuẩn hoàn thành xuất sắc nhiệm vụ (Mẫu 6-KT, HD 38-HD/BTCTW)',
    code: 'Mẫu 6-KT',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Đảng uỷ cơ sở dùng mẫu này công nhận các chi bộ trực thuộc đạt tiêu chuẩn hoàn thành xuất sắc nhiệm vụ trong năm sau khi đánh giá, xếp… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-cong-nhan-dang-vien-chinh-thuc-16-knd-hd38',
    title: 'quyết định công nhận đảng viên chính thức (Mẫu 16-KNĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 16-KN',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Ban thường vụ cấp uỷ có thẩm quyền ra quyết định này công nhận đảng viên dự bị đã hết 12 tháng thử thách trở thành đảng viên chính… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-cong-nhan-dang-vien-sau-khi-khac-phuc-thu-tuc-2a-hkn',
    title: 'quyết định công nhận đảng viên sau khi khắc phục đúng thẩm quyền, thủ tục kết nạp (Mẫu 2A-HKN, HD 38-HD/BTCTW)',
    code: 'Mẫu 2A-HKN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Khi việc kết nạp đảng viên trước đó sai thẩm quyền hoặc thiếu thủ tục nhưng người được kết nạp đủ tiêu chuẩn, sau khi tổ chức đảng làm… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-doi-lai-the-dang-vien-bi-hong-6-tdv-hd38',
    title: 'quyết định đổi lại thẻ đảng viên bị hỏng cho cá nhân (Mẫu 6-TĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 6-T',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Ban thường vụ cấp uỷ ra quyết định này đổi lại thẻ đảng viên cho đảng viên có thẻ bị hỏng hoặc ghi sai thông tin; ghi họ tên, ngày… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-huy-cong-nhan-dang-vien-chinh-thuc-sai-quy-dinh-mau-4-hkn',
    title: 'quyết định hủy quyết định công nhận đảng viên chính thức sai quy định (Mẫu 4-HKN)',
    code: 'Mẫu 4-HKN',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Quyết định của Ban Thường vụ hủy quyết định công nhận đảng viên chính thức không đúng quy định, tiêu chuẩn, điều kiện và xóa tên trong… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-huy-quyet-dinh-ket-nap-dang-vien-sai-quy-dinh-3a-hkn',
    title: 'quyết định hủy quyết định kết nạp đảng viên sai quy định, không đúng tiêu chuẩn (Mẫu 3A-HKN, HD 38-HD/BTCTW)',
    code: 'Mẫu 3A-HKN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Cấp uỷ có thẩm quyền dùng mẫu này khi phát hiện việc kết nạp đảng viên sai quy định, người được kết nạp không đúng tiêu chuẩn, điều… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-ket-nap-dang-vien-9-knd-hd38',
    title: 'quyết định kết nạp đảng viên của cấp uỷ có thẩm quyền (Mẫu 9-KNĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 9-KN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Ban thường vụ cấp uỷ có thẩm quyền ban hành quyết định này để kết nạp quần chúng vào Đảng Cộng sản Việt Nam; ghi họ tên, ngày sinh… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-ket-nap-lai-dang-vien-9a-knd-hd38',
    title: 'quyết định kết nạp lại đảng viên (Mẫu 9A-KNĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 9A-KN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Cấp uỷ có thẩm quyền dùng mẫu này khi kết nạp lại người trước đây đã là đảng viên nay đủ điều kiện được xem xét kết nạp lại vào Đảng… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-khoi-phuc-quyen-dang-vien-1-kpdv-hd38',
    title: 'quyết định khôi phục quyền của đảng viên (Mẫu 1-KPĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 1-KP',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Cấp uỷ có thẩm quyền dùng quyết định này để khôi phục quyền của đảng viên sau khi hết thời hạn tạm đình chỉ sinh hoạt, hoặc được xác… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-kiem-tra-dang-vien-cua-chi-bo-2026',
    title: 'quyết định kiểm tra đảng viên của chi bộ',
    code: 'Mẫu quy',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Chi bộ ra quyết định kiểm tra một đảng viên kèm kế hoạch chi tiết, thành lập tổ kiểm tra. Bí thư chi bộ ký, gửi đảng viên được kiểm tra. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-phat-the-dang-vien-3-tdv-hd38',
    title: 'quyết định phát thẻ đảng viên, cấp lại, đổi lại thẻ đảng viên (Mẫu 3-TĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 3-T',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Đảng uỷ cấp xã hoặc cấp uỷ có thẩm quyền ban hành quyết định chung phát thẻ đảng viên (hoặc cấp lại thẻ bị mất, đổi thẻ bị hỏng) cho… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-phat-the-dang-vien-mau-4-tdv',
    title: 'quyết định phát thẻ đảng viên (Mẫu 4-TĐV)',
    code: 'Mẫu 4-T',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Quyết định của Ban Thường vụ Đảng ủy phát thẻ đảng viên cho một đảng viên, có ngày sinh, ngày vào Đảng, ngày chính thức và số thẻ. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-thanh-lap-chi-bo',
    title: 'quyết định thành lập Chi bộ',
    code: 'Mẫu quy',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Mẫu quyết định của Đảng ủy về việc thành lập Chi bộ, chỉ định Chi ủy nhiệm kỳ và giao nhiệm vụ tổ chức sinh hoạt, phát triển đảng viên. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-thi-hanh-ky-luat-dang-vien-cua-chi-bo',
    title: 'quyết định thi hành kỷ luật đảng viên của chi bộ',
    code: 'Mẫu quy',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Chi bộ ban hành sau hội nghị chi bộ xem xét kỷ luật đảng viên vi phạm (đảng viên đã tự kiểm điểm, chi bộ thảo luận và bỏ phiếu biểu… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-xoa-ten-dang-vien-du-bi-21-xtdv-hd38',
    title: 'quyết định xoá tên đảng viên trong danh sách đảng viên dự bị (Mẫu 21-XTĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 21-XT',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Ban thường vụ cấp uỷ có thẩm quyền dùng mẫu này để xoá tên đảng viên dự bị không đủ điều kiện công nhận chính thức khỏi danh sách đảng… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'quyet-dinh-xoa-ten-trong-danh-sach-dang-vien-1-xtdv-hd38',
    title: 'quyết định xoá tên trong danh sách đảng viên (Mẫu 1-XTĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 1-XT',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Ban thường vụ cấp uỷ có thẩm quyền ra quyết định xoá tên đảng viên chính thức trong danh sách đảng viên theo Điều 8 Điều lệ Đảng (bỏ… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'so-cho-muon-doc-ho-so-dang-vien-11-hsdv-hd38',
    title: 'sổ cho mượn đọc hồ sơ đảng viên (Mẫu 11-HSĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 11-HS',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Cán bộ quản lý hồ sơ đảng viên ghi sổ này mỗi lần cho người có thẩm quyền mượn đọc hồ sơ: ngày mượn, họ tên người mượn, hồ sơ của ai… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'so-dang-vien-da-tu-tran-mau-9-hsdv',
    title: 'sổ đảng viên đã từ trần (Mẫu 9-HSĐV)',
    code: 'Mẫu 9-HS',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Bảng sổ theo dõi đảng viên đã từ trần gồm họ tên, ngày sinh, ngày vào Đảng, ngày chính thức, số thẻ, ngày và lý do từ trần. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'so-dang-vien-du-bi-18-knd-hd38',
    title: 'sổ đảng viên dự bị (Mẫu 18-KNĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 18-KN',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Đảng uỷ cơ sở và chi bộ dùng sổ này để theo dõi đảng viên dự bị: họ tên, giới tính, số lý lịch, ngày sinh, ngày kết nạp, chi bộ, ngày… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'so-dang-vien-ra-khoi-dang-mau-8-hsdv',
    title: 'sổ đảng viên ra khỏi Đảng (Mẫu 8-HSĐV)',
    code: 'Mẫu 8-HS',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Bảng sổ theo dõi đảng viên ra khỏi Đảng gồm họ tên, ngày sinh, ngày vào Đảng, số thẻ, ngày quyết định, hình thức xin ra, xoá tên, khai… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'so-danh-sach-dang-vien-7-hsdv-hd38',
    title: 'sổ danh sách đảng viên (Mẫu 7-HSĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 7-HS',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Chi uỷ, đảng uỷ cơ sở dùng sổ này ghi danh sách đảng viên của đảng bộ, chi bộ: họ tên, giới tính, dân tộc, quê quán, trình độ, ngày… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'so-giao-nhan-ho-so-dang-vien-10-hsdv-hd38',
    title: 'sổ giao nhận hồ sơ đảng viên (Mẫu 10-HSĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 10-HS',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Cấp uỷ và cán bộ làm công tác tổ chức dùng sổ này ghi lại mỗi lần giao, nhận hồ sơ đảng viên khi chuyển sinh hoạt hoặc bàn giao: ngày… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'so-giao-nhan-the-dang-vien-mau-7-tdv',
    title: 'sổ giao nhận thẻ đảng viên (Mẫu 7-TĐV)',
    code: 'Mẫu 7-T',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Sổ giao nhận thẻ đảng viên cho ban tổ chức tỉnh ủy và cơ quan tham mưu cấp ủy, chia phát mới, cấp lại, đổi lại. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'so-gioi-thieu-sinh-hoat-dang-mau-10-shd',
    title: 'sổ giới thiệu sinh hoạt đảng (Mẫu 10-SHĐ)',
    code: 'Mẫu 10-SH',
    category: 'chuyen-sinh-hoat',
    categoryLabel: 'Chuyển Sinh Hoạt Đảng',
    desc: 'Sổ theo dõi giới thiệu và tiếp nhận đảng viên chuyển sinh hoạt đảng, 20 cột, kèm hướng dẫn cách ghi. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'so-phat-the-dang-vien-8-tdv-hd38',
    title: 'sổ phát thẻ đảng viên (Mẫu 8-TĐV, HD 38-HD/BTCTW)',
    code: 'Mẫu 8-T',
    category: 'ho-so-the',
    categoryLabel: 'Quản Lý Hồ Sơ & Thẻ Đảng',
    desc: 'Cấp uỷ cơ sở và cấp trên trực tiếp dùng sổ này ghi đảng viên được phát thẻ: ngày quyết định, số thẻ, họ tên, ngày sinh, ngày vào Đảng… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'so-theo-doi-khen-thuong-to-chuc-dang-dang-vien-4-kt-hd38',
    title: 'sổ theo dõi khen thưởng tổ chức đảng và đảng viên (Mẫu 4-KT, HD 38-HD/BTCTW)',
    code: 'Mẫu 4-KT',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Cấp uỷ cơ sở trở lên dùng sổ này ghi nhận tổ chức đảng và đảng viên được khen thưởng: tên đơn vị, cá nhân, đảng bộ trực thuộc, thành… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'thong-bao-ket-luan-kiem-tra-dang-vien-cua-chi-bo',
    title: 'thông báo kết luận kiểm tra đối với đảng viên',
    code: 'Mẫu th',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Chi bộ thông báo kết luận sau kiểm tra: ưu điểm, hạn chế, nguyên nhân và kiến nghị. Bí thư ký, gửi đảng viên được kiểm tra và lưu hồ sơ. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'to-trinh-chi-bo-de-nghi-cong-nhan-chat-luong-khen-thuong-chi-bo-dang-vien',
    title: 'tờ trình của chi bộ đề nghị công nhận chất lượng, khen thưởng chi bộ và đảng viên cuối năm',
    code: 'Mẫu t',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Chi bộ gửi Ban Thường vụ Đảng ủy cấp trên sau hội nghị kiểm điểm cuối năm, đề nghị công nhận chất lượng chi bộ và tặng giấy khen cho… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'to-trinh-chi-bo-de-nghi-xem-xet-thi-hanh-ky-luat-dang-vien',
    title: 'tờ trình của chi bộ đề nghị xem xét, thi hành kỷ luật đảng viên',
    code: 'Mẫu t',
    category: 'khen-thuong-ky-luat',
    categoryLabel: 'Khen Thưởng & Kỷ Luật',
    desc: 'Chi bộ trình đảng ủy cấp trên khi việc kỷ luật không thuộc thẩm quyền của chi bộ (cấp ủy viên, cán bộ thuộc diện cấp trên quản lý)… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'to-trinh-de-nghi-bo-sung-cap-uy-va-chi-dinh-bi-thu-phu-bi-thu-chi-bo',
    title: 'tờ trình đề nghị bổ sung cấp ủy và chỉ định bí thư, phó bí thư chi bộ',
    code: 'Mẫu t',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Chi bộ dùng để trình đảng ủy cấp trên xin bổ sung cấp ủy, chỉ định bí thư hoặc phó bí thư. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'to-trinh-de-nghi-chuan-y-ket-qua-bau-cu-chi-bo-so-2',
    title: 'tờ trình đề nghị chuẩn y kết quả bầu cử Ban Chấp hành, Bí thư, Phó Bí thư Chi bộ',
    code: 'Mẫu t',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Tờ trình của chi bộ gửi Đảng ủy đề nghị chuẩn y kết quả đại hội chi bộ, gồm các bảng kết quả bầu Ban Chấp hành, Bí thư, Phó Bí thư và… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'to-trinh-de-nghi-chuan-y-ket-qua-dai-hoi-chi-bo-dang-bo-bo-phan',
    title: 'tờ trình đề nghị chuẩn y kết quả bầu cử Ban chấp hành, Bí thư, Phó Bí thư Đảng bộ bộ phận/Chi bộ',
    code: 'Mẫu t',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Tờ trình của đảng bộ bộ phận hoặc chi bộ gửi Đảng ủy đề nghị chuẩn y kết quả đại hội, kèm ba bảng kết quả bầu Ban chấp hành, Bí thư… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'to-trinh-de-nghi-chuan-y-ket-qua-dai-hoi-chi-bo-dang-uy-khoi',
    title: 'tờ trình đề nghị chuẩn y kết quả đại hội chi bộ gửi Đảng ủy Khối',
    code: 'Mẫu t',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Tờ trình của chi bộ thuộc Đảng bộ Khối gửi Ban Thường vụ Đảng ủy Khối đề nghị chuẩn y kết quả bầu cấp ủy, bí thư, phó bí thư và đoàn… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'to-trinh-de-nghi-chuan-y-ket-qua-dai-hoi-dang-bo-chi-bo',
    title: 'tờ trình đề nghị chuẩn y kết quả đại hội đảng bộ, chi bộ',
    code: 'Mẫu t',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Đảng bộ, chi bộ dùng để báo cáo kết quả đại hội và đề nghị cấp trên chuẩn y cấp ủy mới. Kèm danh mục văn bản phải nộp sau đại hội. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'to-trinh-de-nghi-phe-duyet-de-an-nhan-su-dai-hoi-dang-bo-chi-bo',
    title: 'tờ trình đề nghị phê duyệt đề án nhân sự đại hội đảng bộ, chi bộ',
    code: 'Mẫu t',
    category: 'dai-hoi',
    categoryLabel: 'Đại Hội Chi Bộ / Đảng Bộ',
    desc: 'Đảng ủy, chi ủy trình ban thường vụ cấp trên phê duyệt đề án nhân sự cấp ủy, ủy ban kiểm tra và đại biểu dự đại hội nhiệm kỳ mới. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'to-trinh-kien-toan-chi-uy-chi-bo',
    title: 'tờ trình đề nghị kiện toàn chi ủy, chỉ định bí thư, phó bí thư chi bộ',
    code: 'Mẫu t',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Chi bộ trình đảng ủy cấp trên cho kiện toàn cấp ủy hoặc chỉ định bí thư, phó bí thư. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'tong-hop-de-xuat-muc-chat-luong-dang-vien-mau-6f',
    title: 'tổng hợp đề xuất mức chất lượng đảng viên cuối năm (Mẫu 6F)',
    code: 'Mẫu 6F',
    category: 'sinh-hoat',
    categoryLabel: 'Sinh Hoạt Chi Bộ Hằng Tháng',
    desc: 'Bảng chi bộ, đảng ủy cơ sở tổng hợp xếp loại từng đảng viên: tự đánh giá, ý kiến nơi cư trú, đánh giá công chức viên chức, chi ủy nơi… Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
  {
    id: 'tong-hop-y-kien-doan-the-va-chi-uy-noi-cu-tru-dang-vien-du-bi-12-knd',
    title: 'tổng hợp ý kiến nhận xét của đoàn thể và chi uỷ nơi cư trú đối với đảng viên dự bị (Mẫu 12-KNĐ)',
    code: 'Mẫu 12-KN',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Chi uỷ tổng hợp ý kiến đoàn thể nơi công tác và chi uỷ nơi cư trú về đảng viên dự bị, kèm số người tán thành. Tải file Word miễn phí.',
    guidance: 'Hướng dẫn số 12-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'tong-hop-y-kien-nhan-xet-doan-the-chi-uy-nguoi-vao-dang-5-knd-hd38',
    title: 'tổng hợp ý kiến nhận xét của đoàn thể và chi ủy nơi cư trú đối với người vào Đảng (Mẫu 5-KNĐ, HD 38-HD/BTCTW)',
    code: 'Mẫu 5-KN',
    category: 'ket-nap',
    categoryLabel: 'Hồ Sơ Kết Nạp Đảng',
    desc: 'Chi ủy hoặc chi bộ lập khi xét kết nạp đảng viên, tổng hợp ý kiến của các đoàn thể chính trị - xã hội nơi quần chúng ưu tú sinh hoạt… Tải file Word miễn phí.',
    guidance: 'HD 38-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'y-kien-chi-uy-noi-cu-tru-dang-vien-du-bi-12b-knd',
    title: 'ý kiến nhận xét của chi uỷ nơi cư trú đối với đảng viên dự bị (Mẫu 12B-KNĐ)',
    code: 'Mẫu 12B-KN',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Chi uỷ nơi cư trú tổng hợp nhận xét về đảng viên dự bị và số người tán thành công nhận chính thức. Gửi chi bộ nơi đảng viên sinh hoạt. Tải file Word miễn phí.',
    guidance: 'Hướng dẫn số 12-HD/BTCTW',
    status: 'generator'
  },
  {
    id: 'y-kien-nhan-xet-chi-uy-noi-cu-tru-dang-vien-du-bi-2025',
    title: 'ý kiến nhận xét của chi uỷ hoặc chi bộ nơi cư trú đối với đảng viên dự bị',
    code: 'Mẫu Đảng',
    category: 'dang-vien-du-bi',
    categoryLabel: 'Đảng Viên Dự Bị',
    desc: 'Chi uỷ hoặc chi bộ nơi cư trú tổng hợp nhận xét theo phẩm chất, đạo đức, quan hệ quần chúng, thực hiện nhiệm vụ và số phiếu tán thành. Tải file Word miễn phí.',
    guidance: '',
    status: 'generator'
  },
];

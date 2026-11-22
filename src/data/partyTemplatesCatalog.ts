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
    targetPath: '/ban-kiem-diem-dang-vien-mau-02b'
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
  }
];

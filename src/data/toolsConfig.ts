export interface ToolItem {
  path: string;
  title: string;
  desc: string;
  category: 'edtech' | 'pdf' | 'image' | 'media' | 'other';
  isHot?: boolean;
  keywords?: string[];
  priority?: number;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

export const ALL_TOOLS: ToolItem[] = [
  // ================= CÔNG CỤ GIẢNG DẠY & LMS (EDTECH) =================
  {
    path: '/kiem-tra-dao-van-chinh-ta',
    title: '📝 Rà Soát Bản Quyền, Đạo Văn, Chính Tả & Ngữ Pháp Văn Bản (Doc Compliance)',
    desc: 'Thẩm định bản quyền, nguy cơ đạo văn & chuẩn trích dẫn theo Luật SHTT 2022. Rà soát lỗi chính tả, ngữ pháp tiếng Việt & tiếng Anh cho giáo trình, giáo án và xuất bản hoàn thiện (.doc).',
    category: 'edtech',
    isHot: true,
    keywords: ['kiểm tra đạo văn', 'kiểm tra bản quyền giáo trình', 'luật sở hữu trí tuệ', 'kiểm tra chính tả tiếng việt', 'kiểm tra ngữ pháp tiếng anh', 'chỉnh sửa giáo án', 'doc compliance'],
    priority: 0.95,
    changefreq: 'weekly'
  },
  {
    path: '/tro-choi-giang-day',
    title: '🎮 Trò Chơi Giảng Dạy & Hoạt Náo Lớp Học (Classroom Games)',
    desc: 'Tổ chức minigame khởi động bài học và củng cố kiến thức: Hộp quà bí mật (Lucky Boxes), Lật hình ghép đôi (Memory Match) và Giải mã đảo chữ (Word Scramble) tích hợp tính điểm theo đội và xuất nhúng LMS.',
    category: 'edtech',
    isHot: true,
    keywords: ['trò chơi giảng dạy', 'classroom games', 'hộp quà bí mật', 'lucky boxes', 'lật hình ghép đôi', 'memory match', 'giải mã đảo chữ', 'hoạt náo lớp học', 'gamification giáo dục'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/dau-truong-live',
    title: '⚡ Đấu Trường Đố Vui Trực Tiếp (Live Quiz Battle)',
    desc: 'Tổ chức minigame trắc nghiệm trực tiếp phong cách Kahoot & Quizizz. Học viên quét mã QR tham gia bằng điện thoại, bảng xếp hạng Top 1-2-3 cập nhật kịch tính trên máy chiếu.',
    category: 'edtech',
    isHot: true,
    keywords: ['đấu trường trực tiếp', 'live quiz battle', 'kahoot tiếng việt', 'quizizz tiếng việt', 'trò chơi trắc nghiệm lớp học', 'bảng xếp hạng trực tiếp'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/dau-truong',
    title: 'Tham Gia Đấu Trường Trắc Nghiệm Trực Tiếp',
    desc: 'Cổng nhập mã PIN tham gia minigame trắc nghiệm trực tiếp dành cho học viên trên điện thoại và máy tính.',
    category: 'edtech',
    keywords: ['nhập mã pin', 'tham gia trắc nghiệm', 'live battle student'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/hoi-dap-pdf-ai',
    title: '🤖 Trợ Lý Hỏi Đáp Với Tài Liệu PDF (Chat with PDF AI)',
    desc: 'Đọc hiểu tài liệu giáo trình chuyên ngành bằng Google Gemini AI, tự động tóm tắt 3 ý chính và sinh 5 câu trắc nghiệm kiểm tra độ hiểu bài ngay lập tức.',
    category: 'edtech',
    isHot: true,
    keywords: ['hỏi đáp pdf ai', 'chat with pdf', 'tóm tắt giáo trình ai', 'gemini ai đọc pdf', 'trợ lý học tập ai'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/quan-ly-diem-danh',
    title: 'Điểm Danh Sinh Viên Bằng QR Động (Dynamic QR Attendance)',
    desc: 'Mã QR đổi mới sau mỗi 8 giây chống chụp ảnh điểm danh hộ, nhận diện thiết bị duy nhất và khóa định vị GPS phòng học.',
    category: 'edtech',
    isHot: true,
    keywords: ['điểm danh qr động', 'điểm danh sinh viên', 'chống gian lận điểm danh', 'định vị gps lớp học', 'dynamic qr code'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/diem-danh',
    title: 'Cổng Quét Mã Điểm Danh Sinh Viên',
    desc: 'Cổng quét mã QR và xác nhận điểm danh sinh viên bằng GPS và nhận diện thiết bị duy nhất.',
    category: 'edtech',
    keywords: ['quét mã điểm danh', 'check in lớp học'],
    priority: 0.7,
    changefreq: 'weekly'
  },
  {
    path: '/bang-vinh-danh',
    title: 'Bảng Vinh Danh & Tích Điểm (Gamification)',
    desc: 'Cộng điểm phát biểu 1-click, bục vinh danh Quán quân Top 1-2-3 lộng lẫy trên máy chiếu và trao huy hiệu học tập hào hứng.',
    category: 'edtech',
    isHot: true,
    keywords: ['bảng vinh danh', 'gamification giáo dục', 'cộng điểm học viên', 'bục vinh danh top 3'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/quan-ly-thi-trac-nghiem',
    title: 'Khảo Thí & Ngân Hàng Câu Hỏi Trắc Nghiệm',
    desc: 'Quản lý ngân hàng câu hỏi, tạo đề thi AI, hỗ trợ trắc nghiệm, tự luận & thực hành, chấm điểm linh hoạt trên LMS.',
    category: 'edtech',
    isHot: true,
    keywords: ['khảo thí trực tuyến', 'ngân hàng câu hỏi trắc nghiệm', 'tạo đề thi trắc nghiệm', 'chấm thi online'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/soan-de-thi-ai',
    title: 'Soạn Đề Thi Giáo Trình AI & Cây Mục Lục',
    desc: 'Bóc tách đề mục (Chương/Bài/Sub) từ Word/PDF/Drive/Web, sinh đề trắc nghiệm & tự luận theo phạm vi chọn lọc, xuất Word chuẩn mẫu.',
    category: 'edtech',
    keywords: ['soạn đề thi ai', 'bóc tách giáo trình', 'tạo câu hỏi từ word pdf', 'xuất đề thi word'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/phong-thi',
    title: 'Phòng Thi Trắc Nghiệm Trực Tuyến',
    desc: 'Giao diện làm bài thi trực tuyến, hỗ trợ đếm ngược thời gian, chống gian lận và tự động chấm điểm.',
    category: 'edtech',
    keywords: ['phòng thi trực tuyến', 'làm bài thi online', 'thi trắc nghiệm trực tuyến'],
    priority: 0.7,
    changefreq: 'weekly'
  },
  {
    path: '/kich-ban-video-ai',
    title: '🎬 AI Video Script Continuity Studio (Kịch Bản 6-10s)',
    desc: 'Biên kịch video bài giảng & mô phỏng thao tác: Phân cảnh 6-10s liền mạch góc quay, prompt tiếng Anh chuẩn Runway/Kling/Luma và thuyết minh tiếng Việt.',
    category: 'edtech',
    isHot: true,
    keywords: ['kịch bản video ai', 'ai video script', 'prompt video kling runway luma', 'tạo video bài giảng ai', 'thuyết minh giọng ai'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/ai-podcast-studio',
    title: '🎙️ AI Voiceover Studio & Trợ Lý Tạo Podcast Bài Giảng',
    desc: 'Tự động biên kịch đối thoại 2 người (Thầy & Trò / Chuyên gia), phân vai lồng tiếng Microsoft Edge TTS chuẩn cảm xúc và hòa âm nhạc nền Lofi thư giãn xuất MP3/WAV hoàn chỉnh.',
    category: 'edtech',
    isHot: true,
    keywords: ['ai podcast studio', 'tạo podcast bài giảng', 'lồng tiếng đối thoại ai', 'edge tts tiếng việt', 'podcast giáo dục', 'podcast đối thoại thầy trò'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/the-ghi-nho-flashcard',
    title: 'Thẻ Ghi Nhớ AI (Flashcards 3D)',
    desc: '1-click tạo bộ thẻ lật 3D ôn tập kiến thức từ bài học bằng AI, xuất HTML nhúng LMS học tập.',
    category: 'edtech',
    keywords: ['thẻ ghi nhớ flashcard', 'flashcards 3d', 'ôn tập kiến thức ai', 'thẻ lật từ vựng'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/xuat-ma-nhung',
    title: 'Xuất Mã Nhúng LMS Tương Tác',
    desc: 'Tự động dừng bài giảng Canva/YouTube để trả lời trắc nghiệm, xuất file HTML độc lập và mã nhúng LMS.',
    category: 'edtech',
    keywords: ['mã nhúng lms', 'video canva tương tác', 'chèn câu hỏi vào video youtube'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/anh-tuong-tac-hotspot',
    title: 'Hình Ảnh Chú Thích Tương Tác (Hotspot Studio)',
    desc: 'Đính kèm các điểm chạm (Pin) giải thích thông minh lên sơ đồ, bản đồ, tranh minh họa học tập.',
    category: 'edtech',
    keywords: ['ảnh tương tác hotspot', 'ghim chú thích hình ảnh', 'interactive image pin'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/vong-quay-lop-hoc',
    title: 'Vòng Quay May Mắn & Bốc Thăm Lớp Học',
    desc: 'Gọi tên ngẫu nhiên, tạo câu hỏi khởi động và tự động chia nhóm học tập sôi động trong giờ học.',
    category: 'edtech',
    keywords: ['vòng quay may mắn', 'gọi tên ngẫu nhiên', 'bốc thăm học sinh', 'chia nhóm học tập'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/phieu-bai-tap-tuong-tac',
    title: 'Phiếu Bài Tập Tương Tác (Worksheet Online)',
    desc: 'Biến tài liệu PDF/ảnh bài tập thành phiếu điền từ, trắc nghiệm và tự động chấm điểm trên LMS.',
    category: 'edtech',
    keywords: ['phiếu bài tập tương tác', 'interactive worksheet', 'chấm điểm phiếu bài tập online'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/tinh-huong-phan-nhanh',
    title: 'Mô Phỏng Tình Huống Phân Nhánh (Branching Scenario)',
    desc: 'Xây dựng bài học tương tác theo cây quyết định, rèn luyện kỹ năng giải quyết tình huống thực tế.',
    category: 'edtech',
    keywords: ['tình huống phân nhánh', 'cây quyết định', 'mô phỏng tình huống thực tế'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/doi-chieu-truoc-sau',
    title: 'Bảng Đối Chiếu Trước - Sau (Before & After Slider)',
    desc: 'So sánh trực quan hai trạng thái bằng thanh gạt ngang: Chăm sóc da, mối hàn cơ khí, setup buồng phòng.',
    category: 'edtech',
    keywords: ['so sánh trước sau', 'before after slider', 'thanh gạt đối chiếu'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/quy-trinh-sop',
    title: 'Mô Phỏng Quy Trình Tuân Thủ (SOP)',
    desc: 'Bài tập kéo thả sắp xếp đúng trình tự các bước thực hành y tế, an toàn vận hành cơ khí và mầm non.',
    category: 'edtech',
    keywords: ['quy trình chuẩn sop', 'kéo thả trình tự các bước', 'thực hành y tế cơ khí mầm non'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/phan-loai-ghep-noi',
    title: 'Ghép Nối & Phân Loại Kéo Thả',
    desc: 'Phân nhóm tài khoản kế toán (Nợ/Có), thuật ngữ tiếng Anh chuyên ngành y dược, quầy bar khách sạn.',
    category: 'edtech',
    keywords: ['ghép nối kéo thả', 'phân loại bài tập', 'kế toán tiếng anh y dược'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/bang-tinh-chuyen-nganh',
    title: 'Bảng Tra Cứu & Tính Toán Tương Tác',
    desc: 'Tự động tính liều thuốc, tốc độ truyền dịch, khấu hao TSCĐ và chế độ cắt gọt cơ khí có diễn giải chi tiết.',
    category: 'edtech',
    keywords: ['bảng tính chuyên ngành', 'tính liều thuốc', 'tốc độ truyền dịch', 'khấu hao tscđ'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/dong-ho-hoat-dong',
    title: 'Đồng Hồ Hoạt Động & Chuông Bấm Đấu Trí',
    desc: 'Đồng hồ đếm ngược thảo luận nhóm, thi tình huống tia chớp và chuông bấm (Buzzer) giành quyền trả lời thời gian thực.',
    category: 'edtech',
    keywords: ['đồng hồ bấm giờ lớp học', 'chuông bấm buzzer', 'đếm ngược thảo luận nhóm'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/buc-tuong-cau-hoi',
    title: 'Bức Tường Câu Hỏi Vô Danh & Hộp Thắc Mắc',
    desc: 'Quét mã QR đặt câu hỏi ẩn danh, bình chọn (Upvote) thắc mắc chung và chiếu trực tiếp lên bảng/máy chiếu lớp học.',
    category: 'edtech',
    keywords: ['bức tường câu hỏi', 'qa wall ẩn danh', 'quét mã qr đặt câu hỏi', 'hộp thắc mắc trực tiếp'],
    priority: 0.8,
    changefreq: 'weekly'
  },

  // ================= CÔNG CỤ PDF =================
  {
    path: '/danh-so-trang-pdf',
    title: '🔢 Đánh Số Trang PDF Tự Động (Add Page Numbers)',
    desc: 'Đánh số thứ tự các trang PDF theo chuẩn in ấn & tài liệu khoa học: Tùy chỉnh vị trí góc trang, định dạng "Trang X/Y", font chữ tiếng Việt và bỏ qua trang bìa.',
    category: 'pdf',
    isHot: true,
    keywords: ['đánh số trang pdf', 'add page numbers to pdf', 'chèn số trang pdf online', 'đánh số trang báo cáo', 'bỏ qua trang bìa pdf'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/pdf-editor',
    title: 'Công cụ chỉnh sửa PDF Trực Tuyến Miễn Phí',
    desc: 'Xem, xoay và xóa các trang trong file PDF của bạn dễ dàng trực tiếp trên trình duyệt, không cần cài đặt phần mềm.',
    category: 'pdf',
    keywords: ['chỉnh sửa pdf', 'pdf editor online', 'xoay trang pdf', 'xóa trang pdf online', 'edit pdf miễn phí'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/pdf-merge-split',
    title: 'Công Cụ Nối Tách File PDF Siêu Tốc',
    desc: 'Gộp nhiều file PDF lại với nhau hoặc trích xuất các trang cụ thể thành file PDF mới an toàn và bảo mật.',
    category: 'pdf',
    keywords: ['gộp pdf', 'nối file pdf', 'tách file pdf', 'merge pdf', 'split pdf'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/pdf-compare',
    title: 'So Sánh PDF Trực Quan',
    desc: 'Phát hiện mọi sự khác biệt về văn bản và bố cục giữa hai tài liệu một cách trực quan ngay trên trình duyệt.',
    category: 'pdf',
    keywords: ['so sánh file pdf', 'compare pdf', 'tìm điểm khác biệt văn bản'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/pdf-compressor',
    title: 'Công Cụ Nén File PDF Giảm Dung Lượng',
    desc: 'Tối ưu hóa dung lượng file PDF để dễ dàng chia sẻ qua email, Zalo và tải lên các cổng thông tin.',
    category: 'pdf',
    keywords: ['nén pdf', 'giảm dung lượng pdf', 'compress pdf online', 'tối ưu hóa pdf'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/pdf-to-image',
    title: 'Công Cụ Chuyển PDF Thành Ảnh JPG, PNG',
    desc: 'Chuyển đổi từng trang của file PDF thành các định dạng ảnh độ nét cao JPG, PNG nhanh chóng.',
    category: 'pdf',
    keywords: ['chuyển pdf sang ảnh', 'pdf to jpg', 'pdf to png', 'trích xuất ảnh từ pdf'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/dong-dau-pdf',
    title: 'Đóng Dấu Bản Quyền PDF (Watermark PDF)',
    desc: 'Chèn chữ, logo watermark vào tài liệu PDF của bạn một cách nhanh chóng và an toàn.',
    category: 'pdf',
    keywords: ['đóng dấu pdf', 'chèn logo watermark pdf', 'bảo vệ bản quyền pdf'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/ky-ten-pdf',
    title: '✍️ Ký Tên Điện Tử & Chèn Chữ Ký Vào PDF',
    desc: 'Ký tên trực tuyến trên tài liệu PDF: Vẽ tay chữ ký tươi, tải ảnh chữ ký trong suốt, chèn họ tên và ngày tháng, kéo thả chính xác vị trí cần ký.',
    category: 'pdf',
    isHot: true,
    keywords: ['ký tên pdf', 'chèn chữ ký vào pdf', 'chữ ký điện tử online', 'sign pdf online', 'vẽ chữ ký pdf', 'ký hợp đồng online'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/jpg-sang-pdf',
    title: 'Chuyển Đổi JPG Sang PDF Hàng Loạt',
    desc: 'Gộp nhiều ảnh (JPG, PNG, WEBP...) thành một file PDF duy nhất chất lượng cao.',
    category: 'pdf',
    keywords: ['jpg sang pdf', 'chuyển ảnh sang pdf', 'ghép ảnh thành pdf'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/bao-mat-pdf',
    title: 'Công Cụ Bảo Mật & Mở Khóa Mật Khẩu PDF',
    desc: 'Đặt mật khẩu bảo vệ hoặc gỡ bỏ lớp bảo mật cho file PDF một cách dễ dàng và an toàn tuyệt đối.',
    category: 'pdf',
    keywords: ['đặt mật khẩu pdf', 'gỡ mật khẩu pdf', 'mở khóa file pdf', 'bảo mật pdf'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/xoa-trang-pdf',
    title: 'Xóa Trang PDF Chọn Lọc',
    desc: 'Loại bỏ các trang không cần thiết khỏi file PDF dễ dàng qua giao diện trực quan.',
    category: 'pdf',
    keywords: ['xóa trang pdf', 'bỏ bớt trang pdf', 'delete pdf pages'],
    priority: 0.8,
    changefreq: 'weekly'
  },

  // ================= XỬ LÝ ẢNH & AI =================
  {
    path: '/photo-enhancer',
    title: '✨ Nâng Cấp & Hiệu Chỉnh Màu Sắc Ảnh (Photo Enhancer Studio)',
    desc: 'Cứu sáng ảnh chụp đêm/ngược sáng, cân bằng sáng tối HDR, làm sắc nét vi mô và tinh chỉnh nhiệt độ màu chuyên nghiệp 100% trên trình duyệt.',
    category: 'image',
    isHot: true,
    keywords: ['nâng cấp ảnh', 'cứu sáng ảnh', 'photo enhancer', 'làm rõ ảnh mờ', 'chỉnh màu ảnh', 'cân bằng sáng tối ảnh', 'unsharp mask'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/tao-anh-ai',
    title: 'Công Cụ Tạo Ảnh AI Tiên Tiến (AI Image Generator)',
    desc: 'Biến ý tưởng của bạn thành hình ảnh tuyệt đẹp bằng công nghệ AI tiên tiến, hoàn toàn miễn phí.',
    category: 'image',
    keywords: ['tạo ảnh ai', 'vẽ tranh ai', 'ai text to image', 'sinh ảnh bằng trí tuệ nhân tạo'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/tao-anh-the',
    title: 'Tạo Ảnh Thẻ & Hộ Chiếu AI Chuẩn Quốc Tế',
    desc: 'Tự động tạo ảnh thẻ 2x3, 3x4, 4x6, Visa hộ chiếu, đổi phông xanh/trắng, thay trang phục vest/áo dài và dàn trang in 10x15cm.',
    category: 'image',
    isHot: true,
    keywords: ['tạo ảnh thẻ online', 'ảnh thẻ 3x4 4x6', 'ảnh thẻ visa hộ chiếu', 'đổi phông xanh trắng', 'thay áo vest ảnh thẻ'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/tao-khung',
    title: 'Công Cụ Tạo Khung Ảnh & Avatar Sự Kiện (Twibbon)',
    desc: 'Tạo và quản lý các khung ảnh sự kiện, chiến dịch truyền thông, lồng avatar người tham gia nhanh chóng.',
    category: 'image',
    keywords: ['tạo khung ảnh', 'khung avatar facebook', 'lồng ảnh sự kiện twibbon'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/image-compressor',
    title: 'Công Cụ Nén Ảnh Giảm Dung Lượng Đỉnh Cao',
    desc: 'Giảm kích thước file ảnh JPG, PNG, WEBP nhanh chóng mà vẫn giữ nguyên chất lượng cao nhất.',
    category: 'image',
    keywords: ['nén ảnh', 'giảm dung lượng ảnh', 'compress image', 'tối ưu ảnh web'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/image-converter',
    title: 'Chuyển Đổi Định Dạng Ảnh HEIC, JPG, PNG, WEBP',
    desc: 'Chuyển đổi qua lại giữa các định dạng ảnh HEIC (iPhone), JPG, PNG, WEBP siêu tốc.',
    category: 'image',
    keywords: ['chuyển đuôi ảnh', 'heic sang jpg', 'png sang jpg', 'webp sang jpg', 'image converter'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/resize-anh',
    title: 'Thay Đổi Kích Thước Ảnh (Resize Image)',
    desc: 'Đổi kích thước ảnh theo pixel hoặc phần trăm cực nhanh ngay trên trình duyệt.',
    category: 'image',
    keywords: ['resize ảnh', 'đổi kích thước ảnh', 'chỉnh cỡ ảnh pixel'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/crop-anh',
    title: 'Cắt Ảnh Trực Quan (Crop Image)',
    desc: 'Cắt ảnh trực quan theo tỉ lệ 1:1, 16:9, 4:3 hoặc tự do chọn vùng bất kỳ.',
    category: 'image',
    keywords: ['cắt ảnh', 'crop ảnh', 'cắt hình tròn', 'tỉ lệ 1:1 16:9'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/tang-do-net-anh',
    title: 'Tăng Độ Nét Ảnh & Phóng To Chuẩn In Ấn 300 DPI',
    desc: 'Làm nét ảnh mờ bằng Unsharp Masking, nhân độ phân giải 2X/4X/A4 không vỡ hạt và nhúng thẻ 300 DPI chuẩn tiệm in.',
    category: 'image',
    isHot: true,
    keywords: ['tăng độ nét ảnh', 'làm rõ ảnh mờ', 'phóng to ảnh in ấn 300 dpi', 'ảnh in khổ a4 a3', 'unsharp mask online'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/watermark-studio',
    title: 'Chèn Logo & Đóng Dấu Bản Quyền Ảnh Hàng Loạt',
    desc: 'Chèn logo, đóng dấu bản quyền vào ảnh của bạn một cách nhanh chóng, chất lượng cao.',
    category: 'image',
    keywords: ['chèn logo vào ảnh', 'watermark ảnh', 'đóng dấu bản quyền hình ảnh'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/xoa-nen-mau',
    title: 'Xóa Nền Theo Màu & Phông Xanh (Chroma Key)',
    desc: 'Tự động chọn và xóa phông nền theo màu sắc với công cụ Chroma Key chuyên nghiệp.',
    category: 'image',
    keywords: ['xóa phông nền', 'xóa phông xanh', 'chroma key eraser', 'tách nền ảnh'],
    priority: 0.8,
    changefreq: 'weekly'
  },

  // ================= TIỆN ÍCH KHÁC =================
  {
    path: '/qr-link',
    title: 'Công Cụ Rút Gọn Link & Tạo Mã QR Code Động',
    desc: 'Rút gọn các đường dẫn URL dài và tự động tạo mã QR đẹp mắt để dễ dàng quét bằng điện thoại.',
    category: 'other',
    keywords: ['rút gọn link', 'short link', 'tạo mã qr', 'qr code generator'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/xoa-dau-tieng-viet',
    title: 'Xóa Dấu Tiếng Việt Tên File & Văn Bản',
    desc: 'Chuyển đổi tên file và văn bản có dấu thành không dấu chuẩn định dạng khoa học để tránh lỗi khi upload.',
    category: 'other',
    keywords: ['xóa dấu tiếng việt', 'đổi tên file không dấu', 'bỏ dấu tiếng việt'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/sao-chep-drive',
    title: 'Sao Chép Dữ Liệu Google Drive Siêu Tốc',
    desc: 'Chuyển toàn bộ dữ liệu từ Drive A sang Drive B siêu tốc mà không tốn băng thông máy.',
    category: 'other',
    keywords: ['sao chép google drive', 'copy google drive', 'chuyển drive sang drive khác'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/cat-ghep-am-thanh',
    title: 'Cắt Ghép Âm Thanh & Audio MP3 Trực Tuyến',
    desc: 'Cắt, chia nhỏ hoặc ghép nối nhiều file âm thanh lại với nhau trực tiếp trên trình duyệt.',
    category: 'media',
    keywords: ['cắt nhạc mp3', 'ghép âm thanh', 'cắt nhạc chuông online'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/doc-van-ban',
    title: 'Chuyển Đổi Văn Bản Thành Giọng Nói (Text To Speech)',
    desc: 'Chuyển đổi văn bản thành giọng nói tiếng Việt mượt mà với công nghệ AI Edge, tải file MP3 miễn phí.',
    category: 'media',
    keywords: ['đọc văn bản', 'text to speech tiếng việt', 'chuyển văn bản thành mp3', 'giọng đọc hoài my'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/tai-video-am-thanh',
    title: 'Tải Video & Âm Thanh Đa Nền Tảng (Media Downloader)',
    desc: 'Tải video Full HD không logo watermark, tách âm thanh MP3 320kbps từ YouTube, TikTok, Facebook Reels, Instagram, CapCut, SoundCloud.',
    category: 'media',
    isHot: true,
    keywords: ['tải video youtube', 'tải video tiktok không logo', 'tách mp3 youtube', 'tải facebook reels', 'media downloader'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/quay-man-hinh',
    title: 'Quay Video Màn Hình & Âm Thanh Trực Tuyến (Screen Recorder)',
    desc: 'Quay video màn hình, webcam hoặc lồng tiếng trực tiếp trên trình duyệt, không cần cài phần mềm, chất lượng Full HD, bảo mật 100%.',
    category: 'media',
    isHot: true,
    keywords: ['quay màn hình máy tính', 'screen recorder online', 'quay video webcam', 'quay bài giảng trực tuyến', 'ghi hình màn hình không cài app'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/tao-ma-qr-nang-cao',
    title: 'Tạo Mã QR Nâng Cao Đa Năng (Custom QR Code Generator)',
    desc: 'Tạo mã QR Wi-Fi, danh bạ vCard, liên kết website, văn bản với tùy chọn đổi màu gradient, chèn logo thương hiệu ở giữa và bo góc mắt mã QR chất lượng cao.',
    category: 'other',
    isHot: true,
    keywords: ['tạo mã qr nâng cao', 'qr code generator', 'tạo qr wifi', 'tạo qr danh bạ vcard', 'chèn logo vào qr', 'đổi màu mã qr gradient'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/cat-video',
    title: 'Cắt Video Nhanh Trực Tuyến (Fast Video Cutter & Trimmer)',
    desc: 'Cắt tỉa phân đoạn video MP4, WebM, MOV theo mốc thời gian chính xác, xem trước trực quan, xử lý 100% bảo mật ngay trên trình duyệt mà không cần tải lên máy chủ.',
    category: 'media',
    isHot: true,
    keywords: ['cắt video online', 'video cutter', 'trim video online', 'cắt mp4 không mất tiếng', 'cắt video trực tuyến'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/tim-file-trung',
    title: '🔍 Rà Soát & Quét Tệp Trùng Tên Trong Thư Mục (Duplicate File Finder)',
    desc: 'Quét toàn bộ thư mục và các thư mục con trên máy tính của bạn để tìm các tệp trùng tên hoặc trùng dung lượng, hiển thị cây đường dẫn tương đối và xuất báo cáo CSV chi tiết.',
    category: 'other',
    isHot: true,
    keywords: ['tìm file trùng tên', 'rà soát file trùng lặp', 'duplicate file finder', 'quét tệp trùng lặp thư mục máy tính', 'lọc file trùng nhau'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/toi-uu-may-tinh',
    title: '⚡ Tối Ưu Hiệu Suất & Dọn Dẹp Bộ Nhớ Tạm Máy Tính (System Optimizer)',
    desc: 'Giải phóng bộ nhớ RAM, xóa sạch cache web, sinh kịch bản dọn dẹp file rác hệ thống Windows (%TEMP%, Prefetch, Thùng rác) và macOS an toàn, siêu nhanh.',
    category: 'other',
    isHot: true,
    keywords: ['dọn dẹp bộ nhớ tạm', 'xóa file rác máy tính', 'tăng tốc máy tính', 'giải phóng ram', 'system optimizer', 'xóa temp windows', 'flush dns'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/kiem-tra-ban-quyen-video',
    title: '⚖️ Thẩm Định Bản Quyền, Kỹ Thuật & Pháp Lý Video (Video Compliance Checker)',
    desc: 'Kiểm tra nội dung, kỹ thuật, bản quyền đối với video không tự xây dựng lấy từ không gian mạng hoặc chia sẻ theo Luật Bản Quyền SHTT 2022 và Luật Báo Chí Việt Nam mới nhất.',
    category: 'media',
    isHot: true,
    keywords: ['kiểm tra bản quyền video', 'thẩm định video không tự xây dựng', 'luật bản quyền video', 'luật sở hữu trí tuệ video', 'luật báo chí video', 'video compliance checker'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/noi-video',
    title: '🎬 Ghép Nối Video Trực Tuyến Thành 2 Video Dài (Dual Video Merger)',
    desc: 'Tải lên hàng loạt video clip ngắn, linh hoạt phân bổ vào Video 1 và Video 2 (hoặc tự động chia đều/xen kẽ), sắp xếp thứ tự và render xuất 2 video dài độc lập trực tiếp trên trình duyệt.',
    category: 'media',
    isHot: true,
    keywords: ['nối video online', 'ghép video thành 2 video', 'gộp video ngắn', 'video merger', 'nối video trực tuyến', 'ghép clip mp4 webm'],
    priority: 0.9,
    changefreq: 'weekly'
  },
  {
    path: '/tao-phu-de-video',
    title: '📝 Tạo Phụ Đề Video Tự Động & Chèn Phụ Đề (Auto Subtitle Studio)',
    desc: 'Tự động nhận diện lời thoại video sang phụ đề tiếng Việt, chỉnh sửa timecode trực quan, tùy biến font/màu sắc/nền mờ, xuất file SRT và render chèn phụ đề trực tiếp trên trình duyệt.',
    category: 'media',
    isHot: true,
    keywords: ['tạo phụ đề video', 'auto subtitle', 'chèn phụ đề vào video', 'hard sub online', 'chèn phụ đề video', 'nhận diện giọng nói thành văn bản srt', 'tạo srt tiếng việt'],
    priority: 0.95,
    changefreq: 'weekly'
  },
  {
    path: '/tach-am-thanh-video',
    title: '🎵 Trích Xuất Âm Thanh Từ Video & Chuyển Sang MP3/WAV (Video Audio Extractor)',
    desc: 'Trích xuất âm thanh lossless chuẩn phòng thu từ MP4, MOV, WebM, hỗ trợ cắt đoạn âm thanh theo mốc giây, khuếch đại âm lượng (gain boost lên 200%), chạy 100% trên máy không tải file lên server.',
    category: 'media',
    isHot: true,
    keywords: ['tách âm thanh từ video', 'trích xuất mp3 từ mp4', 'chuyển video sang wav', 'video to audio converter', 'lấy nhạc từ video', 'tách tiếng video'],
    priority: 0.95,
    changefreq: 'weekly'
  }
];

export const BASE_SITE_URL = 'https://tienich.ite.id.vn';

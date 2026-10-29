import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileEdit, 
  FileStack, 
  ImageMinus, 
  FileArchive, 
  Image as ImageIcon, 
  Link as LinkIcon,
  SplitSquareHorizontal,
  ShieldCheck,
  RefreshCw,
  Stamp,
  Eraser,
  ImagePlus,
  PenTool,
  Images,
  Maximize,
  FileMinus,
  Crop,
  Wand2,
  Type,
  HardDrive,
  Music,
  Mic,
  Sparkles,
  Presentation,
  Code,
  GraduationCap,
  Compass,
  BookOpen,
  MapPin,
  FileCheck2,
  GitFork,
  Columns,
  ListOrdered,
  Boxes,
  Calculator,
  Timer,
  MessageSquare,
  CheckSquare,
  CreditCard,
  QrCode,
  Trophy,
  Grid,
  Bot,
  Film,
  Video,
  Scissors,
  Gamepad2,
  FileText,
  FolderSearch,
  Zap,
  Scale,
  ArrowRight,
  Search,
  X,
  Smartphone,
  Apple,
  Monitor,
  DownloadCloud
} from 'lucide-react';
import InstallAppModal, { type InstallTabType } from '../components/InstallAppModal';
import './Home.css';

const pdfTools = [
  {
    path: '/danh-so-trang-pdf',
    icon: <FileText size={24} color="#0284c7" />,
    title: 'Đánh Số Trang PDF Tự Động',
    desc: 'Đánh số trang PDF chuẩn in ấn: Tùy chỉnh vị trí góc trang, định dạng "Trang X/Y", font chữ tiếng Việt và bỏ qua trang bìa.',
    isHot: true
  },
  {
    path: '/pdf-editor',
    icon: <FileEdit size={24} />,
    title: 'Công cụ chỉnh sửa PDF',
    desc: 'Xem, xoay và xóa các trang trong file PDF của bạn dễ dàng trực tiếp trên trình duyệt.'
  },
  {
    path: '/pdf-merge-split',
    icon: <FileStack size={24} />,
    title: 'Công Cụ Nối Tách File PDF',
    desc: 'Gộp nhiều file PDF lại với nhau hoặc trích xuất các trang cụ thể thành file PDF mới.'
  },
  {
    path: '/pdf-compare',
    icon: <SplitSquareHorizontal size={24} />,
    title: 'So Sánh PDF',
    desc: 'Phát hiện mọi sự khác biệt về văn bản và bố cục giữa hai tài liệu một cách trực quan.'
  },
  {
    path: '/pdf-compressor',
    icon: <FileArchive size={24} />,
    title: 'Công cụ nén file PDF',
    desc: 'Tối ưu hóa dung lượng file PDF để dễ dàng chia sẻ và tải lên các hệ thống.'
  },
  {
    path: '/pdf-to-image',
    icon: <ImageIcon size={24} />,
    title: 'Công Cụ Chuyển PDF Thành Ảnh',
    desc: 'Chuyển đổi từng trang của file PDF thành các định dạng ảnh phổ biến như JPG, PNG.'
  },
  {
    path: '/dong-dau-pdf',
    icon: <PenTool size={24} />,
    title: 'Đóng Dấu PDF',
    desc: 'Chèn chữ, logo watermark vào tài liệu PDF của bạn một cách nhanh chóng và an toàn.'
  },
  {
    path: '/ky-ten-pdf',
    icon: <PenTool size={24} color="#6366f1" />,
    title: '✍️ Ký Tên Điện Tử PDF',
    desc: 'Ký tên trực tiếp trên tài liệu PDF: Vẽ tay chữ ký tươi, tải ảnh chữ ký trong suốt, chèn họ tên & ngày tháng, kéo thả chính xác vị trí cần ký.'
  },
  {
    path: '/jpg-sang-pdf',
    icon: <Images size={24} />,
    title: 'JPG sang PDF',
    desc: 'Gộp nhiều ảnh (JPG, PNG, WEBP...) thành một file PDF duy nhất dễ dàng.'
  },
  {
    path: '/bao-mat-pdf',
    icon: <ShieldCheck size={24} />,
    title: 'Công Cụ Bảo Mật PDF',
    desc: 'Đặt mật khẩu bảo vệ hoặc gỡ bỏ lớp bảo mật cho file PDF một cách dễ dàng và an toàn.'
  },
  {
    path: '/xoa-trang-pdf',
    icon: <FileMinus size={24} />,
    title: 'Xóa trang PDF',
    desc: 'Loại bỏ các trang không cần thiết khỏi file PDF dễ dàng qua giao diện trực quan.'
  },

];

const imageTools = [
  {
    path: '/photo-enhancer',
    icon: <Sparkles size={24} color="#f59e0b" />,
    title: 'Nâng Cấp & Cứu Sáng Ảnh',
    desc: 'Cứu sáng ảnh thiếu sáng/chụp đêm, cân bằng tương phản HDR, làm nét vi mô và tinh chỉnh màu sắc chuyên nghiệp.',
    isHot: true
  },
  {
    path: '/tao-anh-ai',
    icon: <Sparkles size={24} />,
    title: 'Công Cụ Tạo Ảnh AI',
    desc: 'Biến ý tưởng của bạn thành hình ảnh tuyệt đẹp bằng công nghệ AI tiên tiến, hoàn toàn miễn phí.'
  },
  {
    path: '/tao-khung',
    icon: <ImagePlus size={24} />,
    title: 'Công Cụ Tạo Khung Ảnh',
    desc: 'Tạo và quản lý các khung ảnh sự kiện, chiến dịch truyền thông của riêng bạn.'
  },
  {
    path: '/bo-loc-anh',
    icon: <Sparkles size={24} />,
    title: 'Bộ Lọc Màu & Chỉnh Ảnh Điện Ảnh (Color Tone Studio)',
    desc: 'Filter màu điện ảnh (Teal & Orange, Vintage, Cyberpunk, B&W), chỉnh sáng, tương phản, độ bão hòa và tối góc vignette.'
  },
  {
    path: '/ghep-anh-nghe-thuat',
    icon: <Grid size={24} />,
    title: 'Ghép Ảnh & Tạo Khung Lưới (Photo Collage)',
    desc: 'Ghép 2 đến 9 ảnh vào các bố cục khung lưới nghệ thuật, chỉnh viền, bo góc tròn và tỷ lệ khung hình chuẩn mạng xã hội.'
  },
  {
    path: '/image-compressor',
    icon: <ImageMinus size={24} />,
    title: 'Công cụ nén ảnh theo dung lượng',
    desc: 'Giảm kích thước file ảnh nhanh chóng mà vẫn giữ nguyên chất lượng cao nhất.'
  },
  {
    path: '/image-converter',
    icon: <RefreshCw size={24} />,
    title: 'Chuyển Đổi Định Dạng Ảnh',
    desc: 'Chuyển đổi ảnh giữa các định dạng HEIC, JPG, PNG, WEBP một cách nhanh chóng.'
  },
  {
    path: '/resize-anh',
    icon: <Maximize size={24} />,
    title: 'Resize ảnh',
    desc: 'Đổi kích thước ảnh theo pixel hoặc phần trăm cực nhanh ngay trên trình duyệt.'
  },
  {
    path: '/crop-anh',
    icon: <Crop size={24} />,
    title: 'Crop ảnh',
    desc: 'Cắt ảnh trực quan theo tỉ lệ 1:1, 16:9, 4:3 hoặc chọn vùng bất kỳ.'
  },
  {
    path: '/tang-do-net-anh',
    icon: <Wand2 size={24} />,
    title: 'Tăng Độ Nét Ảnh & Chuẩn In Ấn 300 DPI',
    desc: 'Làm nét ảnh mờ bằng Unsharp Masking, nhân độ phân giải 2X/4X/A4 không vỡ hạt và nhúng thẻ 300 DPI chuẩn tiệm in.'
  },
  {
    path: '/watermark-studio',
    icon: <Stamp size={24} />,
    title: 'Công cụ chèn Logo vào ảnh',
    desc: 'Chèn logo, đóng dấu bản quyền vào ảnh của bạn một cách nhanh chóng, chất lượng cao.'
  },
  {
    path: '/xoa-nen-mau',
    icon: <Eraser size={24} />,
    title: 'Công Cụ Xóa Nền Theo Màu',
    desc: 'Tự động chọn và xóa phông nền theo màu sắc với công cụ Chroma Key.'
  },
  {
    path: '/tao-anh-the',
    icon: <CreditCard size={24} />,
    title: 'Tạo Ảnh Thẻ & Hộ Chiếu AI',
    desc: 'Tự động tạo ảnh thẻ 2x3, 3x4, 4x6, Visa hộ chiếu, đổi phông xanh/trắng, thay trang phục vest/áo dài và dàn trang in 10x15cm.'
  }
];

const mediaTools = [
  {
    path: '/tai-video-am-thanh',
    icon: <Film size={24} color="#ec4899" />,
    title: 'Tải Video & Âm Thanh Đa Nền Tảng (Media Downloader)',
    desc: 'Tải video Full HD không logo watermark, tách âm thanh MP3 320kbps từ YouTube, TikTok, Facebook Reels, Instagram, CapCut, SoundCloud.',
    isHot: true
  },
  {
    path: '/cat-video',
    icon: <Scissors size={24} color="#f43f5e" />,
    title: 'Cắt Video Nhanh Trực Tuyến (Fast Video Cutter)',
    desc: 'Cắt tỉa phân đoạn video MP4, WebM, MOV theo mốc thời gian chính xác, xem trước trực quan, xử lý 100% bảo mật ngay trên trình duyệt.',
    isHot: true
  },
  {
    path: '/noi-video',
    icon: <Film size={24} color="#8b5cf6" />,
    title: '🎬 Ghép Nối Video Thành 2 Video Dài',
    desc: 'Tải nhiều clip ngắn, phân bổ sang 2 luồng Video 1 và Video 2 (hoặc tự động chia đều/xen kẽ), render xuất 2 video dài độc lập trực tiếp trên trình duyệt.',
    isHot: true
  },
  {
    path: '/tao-phu-de-video',
    icon: <Type size={24} color="#06b6d4" />,
    title: '📝 Tạo Phụ Đề Video Tự Động & Chèn Phụ Đề',
    desc: 'Nhận diện lời thoại video tự động (Speech-to-Text), tinh chỉnh timecode, đổi kiểu chữ/màu sắc/nền mờ, xuất file SRT và chèn phụ đề trực tiếp vào video.',
    isHot: true
  },
  {
    path: '/tach-am-thanh-video',
    icon: <Music size={24} color="#0284c7" />,
    title: '🎵 Trích Xuất Âm Thanh Từ Video & Sang MP3/WAV',
    desc: 'Tách trọn vẹn dải âm thanh lossless từ MP4, MOV, WebM, hỗ trợ cắt đoạn âm thanh yêu thích và tăng âm lượng (Audio Boost).',
    isHot: true
  },
  {
    path: '/quay-man-hinh',
    icon: <Video size={24} color="#0284c7" />,
    title: 'Quay Video Màn Hình & Âm Thanh Trực Tuyến (Screen Recorder)',
    desc: 'Quay video màn hình, webcam hoặc lồng tiếng trực tiếp trên trình duyệt, không cần cài phần mềm, chất lượng Full HD, bảo mật 100%.',
    isHot: true
  },
  {
    path: '/cat-ghep-am-thanh',
    icon: <Music size={24} color="#10b981" />,
    title: 'Cắt Ghép Âm Thanh & Audio MP3',
    desc: 'Cắt, chia nhỏ hoặc ghép nối nhiều file âm thanh lại với nhau trực tiếp trên trình duyệt.'
  },
  {
    path: '/doc-van-ban',
    icon: <Mic size={24} color="#6366f1" />,
    title: 'Chuyển Đổi Văn Bản Thành Giọng Nói (Text To Speech)',
    desc: 'Chuyển đổi văn bản thành giọng nói tiếng Việt mượt mà với công nghệ AI Edge, tải file MP3 miễn phí.'
  },
  {
    path: '/ai-podcast-studio',
    icon: <Mic size={24} color="#9333ea" />,
    title: '🎙️ AI Voiceover Studio & Tạo Podcast Bài Giảng',
    desc: 'Tự động biên kịch đối thoại 2 người, phân vai lồng tiếng Edge TTS cảm xúc và hòa âm nhạc nền Lofi thư giãn xuất MP3/WAV hoàn chỉnh.',
    isHot: true
  },
  {
    path: '/kich-ban-video-ai',
    icon: <Film size={24} color="#f43f5e" />,
    title: '🎬 AI Video Script Studio (Kịch Bản 6-10s)',
    desc: 'Biên kịch video bài giảng & mô phỏng thao tác: Phân cảnh 6-10s liền mạch góc quay, prompt tiếng Anh chuẩn Runway/Kling và thuyết minh tiếng Việt.',
    isHot: true
  },
  {
    path: '/kiem-tra-ban-quyen-video',
    icon: <Scale size={24} color="#4f46e5" />,
    title: '⚖️ Thẩm Định Bản Quyền & Kỹ Thuật Video',
    desc: 'Kiểm tra nội dung, kỹ thuật, bản quyền đối với video không tự xây dựng theo Luật Bản Quyền SHTT 2022 và Luật Báo Chí Việt Nam mới nhất.',
    isHot: true
  }
];

const otherTools = [
  {
    path: '/qr-link',
    icon: <LinkIcon size={24} />,
    title: 'Công cụ rút gọn link và tạo QR',
    desc: 'Rút gọn các đường dẫn URL dài và tự động tạo mã QR để dễ dàng quét bằng điện thoại.'
  },
  {
    path: '/xoa-dau-tieng-viet',
    icon: <Type size={24} />,
    title: 'Xóa Dấu Tên File',
    desc: 'Chuyển đổi tên file có dấu thành không dấu chuẩn định dạng khoa học để tránh lỗi hiển thị khi upload.'
  },
  {
    path: '/sao-chep-drive',
    icon: <HardDrive size={24} />,
    title: 'Sao Chép Google Drive',
    desc: 'Chuyển toàn bộ dữ liệu từ Drive A sang Drive B siêu tốc mà không tốn mạng.'
  },
  {
    path: '/tao-ma-qr-nang-cao',
    icon: <QrCode size={24} />,
    title: 'Tạo Mã QR Nâng Cao Đa Năng (Custom QR Code)',
    desc: 'Tạo mã QR Wi-Fi, danh bạ vCard, đường dẫn, văn bản với tùy chọn màu gradient, bo góc mắt mã QR và chèn logo thương hiệu ở giữa.'
  },
  {
    path: '/tim-file-trung',
    icon: <FolderSearch size={24} color="#0284c7" />,
    title: '🔍 Rà Soát Tệp Trùng Tên Trong Thư Mục (Duplicate Finder)',
    desc: 'Quét toàn bộ thư mục và cây thư mục con trên máy tính của bạn để tìm các tệp trùng tên hoặc trùng dung lượng, hiển thị đường dẫn chi tiết và xuất báo cáo CSV.',
    isHot: true
  },
  {
    path: '/toi-uu-may-tinh',
    icon: <Zap size={24} color="#10b981" />,
    title: '⚡ Tối Ưu Hiệu Suất & Dọn Dẹp Bộ Nhớ Tạm (System Optimizer)',
    desc: 'Giải phóng bộ nhớ RAM, xóa sạch cache web, sinh kịch bản dọn dẹp file rác hệ thống Windows (%TEMP%, Prefetch, Thùng rác) và macOS an toàn.',
    isHot: true
  }
];

const edTechTools = [
  {
    path: '/kiem-tra-dao-van-chinh-ta',
    icon: <FileCheck2 size={24} color="#059669" />,
    title: '📝 Rà Soát Bản Quyền, Đạo Văn, Chính Tả & Ngữ Pháp (Doc Compliance)',
    desc: 'Thẩm định bản quyền, nguy cơ đạo văn & trích dẫn theo Luật SHTT 2022. Rà soát lỗi chính tả, ngữ pháp tiếng Việt & tiếng Anh cho giáo trình, giáo án và xuất bản hoàn thiện (.doc).',
    isHot: true
  },
  {
    path: '/kiem-tra-ban-quyen-video',
    icon: <Scale size={24} color="#4f46e5" />,
    title: '⚖️ Thẩm Định Bản Quyền & Kỹ Thuật Video Không Tự Xây Dựng',
    desc: 'Kiểm tra nội dung, kỹ thuật, bản quyền đối với video tải từ mạng xã hội, chia sẻ theo Luật Bản Quyền SHTT 2022 và Luật Báo Chí Việt Nam mới nhất.',
    isHot: true
  },
  {
    path: '/tro-choi-giang-day',
    icon: <Gamepad2 size={24} color="#ec4899" />,
    title: '🎮 Trò Chơi Giảng Dạy & Hoạt Náo (Classroom Games)',
    desc: 'Tổ chức minigame khởi động bài học: Hộp quà bí mật, Lật hình ghép đôi, Giải mã đảo chữ tích hợp tính điểm theo đội và xuất nhúng LMS.',
    isHot: true
  },
  {
    path: '/dau-truong-live',
    icon: <Sparkles size={24} color="#ef4444" />,
    title: '⚡ Đấu Trường Đố Vui Trực Tiếp (Live Quiz Battle)',
    desc: 'Tổ chức minigame trắc nghiệm trực tiếp phong cách Kahoot & Quizizz. Học viên quét mã QR tham gia bằng điện thoại, bảng xếp hạng Top 1-2-3 cập nhật kịch tính trên máy chiếu.',
    isHot: true
  },
  {
    path: '/hoi-dap-pdf-ai',
    icon: <Bot size={24} color="#2563eb" />,
    title: '🤖 Trợ Lý Hỏi Đáp Với Tài Liệu PDF (Chat with PDF)',
    desc: 'Đọc hiểu tài liệu giáo trình chuyên ngành bằng Google Gemini AI, tự động tóm tắt 3 ý chính và sinh 5 câu trắc nghiệm kiểm tra độ hiểu bài ngay lập tức.',
    isHot: true
  },
  {
    path: '/quan-ly-diem-danh',
    icon: <QrCode size={24} />,
    title: 'Điểm Danh Sinh Viên Bằng QR Động (Dynamic QR)',
    desc: 'Mã QR đổi mới sau mỗi 8 giây chống chụp ảnh điểm danh hộ, nhận diện thiết bị duy nhất và khóa định vị GPS phòng học.',
    isHot: true
  },
  {
    path: '/bang-vinh-danh',
    icon: <Trophy size={24} />,
    title: 'Bảng Vinh Danh & Tích Điểm (Gamification)',
    desc: 'Cộng điểm phát biểu 1-click, bục vinh danh Quán quân Top 1-2-3 lộng lẫy trên máy chiếu và trao huy hiệu học tập hào hứng.',
    isHot: true
  },
  {
    path: '/soan-bai-giang-ai',
    icon: <Presentation size={24} color="#3b82f6" />,
    title: '📊 AI Soạn Bài Giảng & Slide PPTX Tự Động (EdTech Copilot)',
    desc: 'Lập dàn bài sư phạm thông minh, thiết kế bộ slide trình chiếu 16:9 sắc nét, tải file PowerPoint .pptx kèm Giáo án Word chuẩn 5512 BGD&ĐT chỉ với 1 cú click.',
    isHot: true
  },
  {
    path: '/quan-ly-thi-trac-nghiem',
    icon: <CheckSquare size={24} />,
    title: 'Khảo Thí & Ngân Hàng Câu Hỏi Trắc Nghiệm',
    desc: 'Quản lý ngân hàng câu hỏi, tạo đề thi AI, hỗ trợ trắc nghiệm, tự luận & thực hành, chấm điểm linh hoạt trên LMS.',
    isHot: true
  },
  {
    path: '/soan-de-thi-ai',
    icon: <BookOpen size={24} />,
    title: 'Soạn Đề Thi Giáo Trình AI & Cây Mục Lục',
    desc: 'Bóc tách đề mục (Chương/Bài/Sub) từ Word/PDF/Drive/Web, sinh đề trắc nghiệm & tự luận theo phạm vi chọn lọc, xuất Word chuẩn mẫu.'
  },
  {
    path: '/kich-ban-video-ai',
    icon: <Film size={24} color="#f43f5e" />,
    title: '🎬 AI Video Script Continuity Studio (Kịch Bản 6-10s)',
    desc: 'Biên kịch video bài giảng & mô phỏng thao tác: Phân cảnh 6-10s liền mạch góc quay, prompt tiếng Anh chuẩn Runway/Kling/Luma và thuyết minh tiếng Việt.',
    isHot: true
  },
  {
    path: '/ai-podcast-studio',
    icon: <Mic size={24} color="#9333ea" />,
    title: '🎙️ AI Voiceover Studio & Trợ Lý Tạo Podcast Bài Giảng',
    desc: 'Tự động biên kịch đối thoại 2 người (Thầy & Trò / Chuyên gia), phân vai lồng tiếng Microsoft Edge TTS chuẩn cảm xúc và hòa âm nhạc nền Lofi thư giãn xuất MP3/WAV hoàn chỉnh.',
    isHot: true
  },
  {
    path: '/the-ghi-nho-flashcard',
    icon: <BookOpen size={24} />,
    title: 'Thẻ Ghi Nhớ AI (Flashcards)',
    desc: '1-click tạo bộ thẻ lật 3D ôn tập kiến thức từ bài học bằng AI, xuất HTML nhúng LMS học tập.'
  },
  {
    path: '/xuat-ma-nhung',
    icon: <Code size={24} />,
    title: 'Xuất Mã Nhúng LMS Tương Tác',
    desc: 'Tự động dừng bài giảng Canva/YouTube để trả lời trắc nghiệm, xuất file HTML độc lập và mã nhúng LMS.'
  },
  {
    path: '/anh-tuong-tac-hotspot',
    icon: <MapPin size={24} />,
    title: 'Hình Ảnh Chú Thích Tương Tác',
    desc: 'Đính kèm các điểm chạm (Pin) giải thích thông minh lên sơ đồ, bản đồ, tranh minh họa học tập.'
  },
  {
    path: '/vong-quay-lop-hoc',
    icon: <Compass size={24} />,
    title: 'Vòng Quay May Mắn & Bốc Thăm',
    desc: 'Gọi tên ngẫu nhiên, tạo câu hỏi khởi động và tự động chia nhóm học tập sôi động trong giờ học.'
  },
  {
    path: '/phieu-bai-tap-tuong-tac',
    icon: <FileCheck2 size={24} />,
    title: 'Phiếu Bài Tập Tương Tác (Worksheet)',
    desc: 'Biến tài liệu PDF/ảnh bài tập thành phiếu điền từ, trắc nghiệm và tự động chấm điểm trên LMS.'
  },
  {
    path: '/tinh-huong-phan-nhanh',
    icon: <GitFork size={24} />,
    title: 'Mô Phỏng Tình Huống Phân Nhánh',
    desc: 'Xây dựng bài học tương tác theo cây quyết định, rèn luyện kỹ năng giải quyết tình huống thực tế.'
  },
  {
    path: '/doi-chieu-truoc-sau',
    icon: <Columns size={24} />,
    title: 'Bảng Đối Chiếu Trước - Sau (Slider)',
    desc: 'So sánh trực quan hai trạng thái bằng thanh gạt ngang: Chăm sóc da, mối hàn cơ khí, setup buồng phòng.'
  },
  {
    path: '/quy-trinh-sop',
    icon: <ListOrdered size={24} />,
    title: 'Mô Phỏng Quy Trình Tuân Thủ (SOP)',
    desc: 'Bài tập kéo thả sắp xếp đúng trình tự các bước thực hành y tế, an toàn vận hành cơ khí và mầm non.'
  },
  {
    path: '/phan-loai-ghep-noi',
    icon: <Boxes size={24} />,
    title: 'Ghép Nối & Phân Loại Kéo Thả',
    desc: 'Phân nhóm tài khoản kế toán (Nợ/Có), thuật ngữ tiếng Anh chuyên ngành y dược, quầy bar khách sạn.'
  },
  {
    path: '/bang-tinh-chuyen-nganh',
    icon: <Calculator size={24} />,
    title: 'Bảng Tra Cứu & Tính Toán Tương Tác',
    desc: 'Tự động tính liều thuốc, tốc độ truyền dịch, khấu hao TSCĐ và chế độ cắt gọt cơ khí có diễn giải chi tiết.'
  },
  {
    path: '/dong-ho-hoat-dong',
    icon: <Timer size={24} />,
    title: 'Đồng Hồ Hoạt Động & Chuông Bấm Đấu Trí',
    desc: 'Đồng hồ đếm ngược thảo luận nhóm, thi tình huống tia chớp và chuông bấm (Buzzer) giành quyền trả lời thời gian thực.'
  },
  {
    path: '/buc-tuong-cau-hoi',
    icon: <MessageSquare size={24} />,
    title: 'Bức Tường Câu Hỏi Vô Danh & Hộp Thắc Mắc',
    desc: 'Quét mã QR đặt câu hỏi ẩn danh, bình chọn (Upvote) thắc mắc chung và chiếu trực tiếp lên bảng/máy chiếu lớp học.'
  }
];


// Hàm chuyển tiếng Việt có dấu thành không dấu để tìm kiếm thông minh
const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

const Home = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'edtech' | 'pdf' | 'image' | 'media' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [installDefaultTab, setInstallDefaultTab] = useState<InstallTabType>('android');

  const openInstallApp = (tab: InstallTabType) => {
    setInstallDefaultTab(tab);
    setInstallModalOpen(true);
  };

  // Lọc công cụ theo từ khóa tìm kiếm
  const filterTools = <T extends { title: string; desc: string; path: string }>(tools: T[]): T[] => {
    if (!searchQuery.trim()) return tools;
    const query = removeVietnameseTones(searchQuery.trim());
    return tools.filter(tool => {
      const title = removeVietnameseTones(tool.title);
      const desc = removeVietnameseTones(tool.desc);
      const path = removeVietnameseTones(tool.path);
      return title.includes(query) || desc.includes(query) || path.includes(query);
    });
  };

  const filteredEdTechTools = filterTools(edTechTools);
  const filteredPdfTools = filterTools(pdfTools);
  const filteredImageTools = filterTools(imageTools);
  const filteredMediaTools = filterTools(mediaTools);
  const filteredOtherTools = filterTools(otherTools);

  const totalFilteredCount = 
    filteredEdTechTools.length + 
    filteredPdfTools.length + 
    filteredImageTools.length + 
    filteredMediaTools.length + 
    filteredOtherTools.length;

  return (
    <div className="animate-fade-in home-container">
      <section className="home-hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img 
          src="/logo.webp" 
          alt="RCHG Studio Logo" 
          width={120}
          height={120}
          fetchPriority="high"
          style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }} 
        />
        <h1 className="home-title text-gradient">
          Công Cụ PDF & Tiện Ích <span style={{ whiteSpace: 'nowrap' }}>Trực Tuyến</span>
        </h1>
        <p className="home-subtitle">
          Nền tảng tất cả trong một phục vụ công việc văn phòng, xử lý PDF, đồ họa hình ảnh và bộ công cụ số hóa giảng dạy trực quan.
        </p>

        {/* NÚT CÀI ĐẶT ỨNG DỤNG CHO ANDROID, IOS VÀ MÁY TÍNH (WINDOWS, MACBOOK, LINUX) */}
        <div className="home-app-install-bar">
          <span className="install-bar-label">
            <DownloadCloud size={16} /> Cài đặt ứng dụng:
          </span>
          <button 
            type="button" 
            className="btn-install-badge android"
            onClick={() => openInstallApp('android')}
            title="Cài đặt ứng dụng trên điện thoại Android"
          >
            <Smartphone size={16} />
            <span>Android</span>
          </button>
          <button 
            type="button" 
            className="btn-install-badge ios"
            onClick={() => openInstallApp('ios')}
            title="Cài đặt ứng dụng trên iPhone / iPad (iOS)"
          >
            <Apple size={16} />
            <span>iPhone / iPad</span>
          </button>
          <button 
            type="button" 
            className="btn-install-badge desktop"
            onClick={() => openInstallApp('desktop')}
            title="Cài đặt ứng dụng trên máy tính Windows, MacBook, Linux"
          >
            <Monitor size={16} />
            <span>PC / Mac / Linux</span>
          </button>
        </div>

        {/* Nổi bật: Truy cập nhanh các tính năng Giáo Dục / LMS hàng đầu */}
        <div className="hero-quick-shortcuts">
          <Link to="/quan-ly-diem-danh" className="quick-shortcut-pill featured-qr">
            <span className="qsp-icon">📍</span>
            <div className="qsp-text">
              <span className="qsp-title">
                Điểm Danh QR Động
                <span className="hot-tag">MỚI</span>
              </span>
              <span className="qsp-sub">Chống gian lận, GPS & đổi mã 8s</span>
            </div>
            <ArrowRight size={18} className="qsp-arrow" />
          </Link>

          <Link to="/quan-ly-thi-trac-nghiem" className="quick-shortcut-pill featured-exam">
            <span className="qsp-icon">📝</span>
            <div className="qsp-text">
              <span className="qsp-title">Khảo Thí & Thi Trắc Nghiệm</span>
              <span className="qsp-sub">Tự luận, thực hành, xuất LMS</span>
            </div>
            <ArrowRight size={18} className="qsp-arrow" />
          </Link>

          <Link to="/soan-bai-giang-ai" className="quick-shortcut-pill featured-ai">
            <span className="qsp-icon">📊</span>
            <div className="qsp-text">
              <span className="qsp-title">Soạn Slide PPTX AI</span>
              <span className="qsp-sub">Tạo slide & giáo án 5512</span>
            </div>
            <ArrowRight size={18} className="qsp-arrow" />
          </Link>

          <Link to="/soan-de-thi-ai" className="quick-shortcut-pill featured-ai">
            <span className="qsp-icon">✨</span>
            <div className="qsp-text">
              <span className="qsp-title">Soạn Đề Thi AI</span>
              <span className="qsp-sub">Bóc tách giáo trình ra đề</span>
            </div>
            <ArrowRight size={18} className="qsp-arrow" />
          </Link>
        </div>

        {/* Thanh tìm kiếm nhanh trực tiếp trên trang chủ */}
        <div className="home-search-container">
          <div className="home-search-box">
            <Search size={20} className="home-search-icon" />
            <input 
              type="text" 
              className="home-search-input"
              placeholder="Tìm kiếm công cụ: PDF, đạo văn, nén ảnh, tạo đề thi, điểm danh, âm thanh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="home-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa tìm kiếm"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="home-search-status">
              Tìm thấy <strong>{totalFilteredCount}</strong> công cụ phù hợp với "{searchQuery}"
              <button 
                type="button" 
                onClick={() => setSearchQuery('')} 
                className="home-search-reset-link"
              >
                Xem tất cả
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Thanh tab điều hướng danh mục mượt mà trên Desktop và Mobile */}
      <div className="category-filter-bar">
        <button 
          type="button" 
          onClick={() => setActiveCategory('all')} 
          className={`category-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
        >
          <Grid size={16} /> Tất cả công cụ
        </button>

        <button 
          type="button" 
          onClick={() => setActiveCategory('edtech')} 
          className={`category-tab-btn ${activeCategory === 'edtech' ? 'active' : ''}`}
        >
          <GraduationCap size={16} /> 
          Giảng Dạy & LMS
          <span className="tab-pill-badge">Hot</span>
        </button>

        <button 
          type="button" 
          onClick={() => setActiveCategory('pdf')} 
          className={`category-tab-btn ${activeCategory === 'pdf' ? 'active' : ''}`}
        >
          <FileEdit size={16} /> Chỉnh sửa PDF
        </button>

        <button 
          type="button" 
          onClick={() => setActiveCategory('image')} 
          className={`category-tab-btn ${activeCategory === 'image' ? 'active' : ''}`}
        >
          <ImageIcon size={16} /> Xử lý Ảnh & AI
        </button>

        <button 
          type="button" 
          onClick={() => setActiveCategory('media')} 
          className={`category-tab-btn ${activeCategory === 'media' ? 'active' : ''}`}
        >
          <Video size={16} /> 
          Âm Thanh & Video
          <span className="tab-pill-badge" style={{ background: '#ec4899' }}>MỚI</span>
        </button>

        <button 
          type="button" 
          onClick={() => setActiveCategory('other')} 
          className={`category-tab-btn ${activeCategory === 'other' ? 'active' : ''}`}
        >
          <LinkIcon size={16} /> Tiện ích Khác
        </button>
      </div>

      {/* SECTION 1: CÔNG CỤ GIẢNG DẠY & LMS */}
      {(activeCategory === 'all' || activeCategory === 'edtech') && filteredEdTechTools.length > 0 && (
        <section style={{ marginTop: '2.5rem' }}>
          <h2 className="text-2xl font-bold mb-8 text-gradient section-header-title">
            <GraduationCap size={28} /> Công Cụ Giảng Dạy & E-Learning LMS
          </h2>
          <div className="tools-grid">
            {filteredEdTechTools.map((tool, index) => (
              <Link 
                to={tool.path} 
                key={index} 
                className={`tool-card ${tool.isHot ? 'tool-card-highlight' : ''}`} 
                style={{ borderColor: tool.isHot ? '#10b981' : 'rgba(99, 102, 241, 0.25)' }}
              >
                {tool.isHot && (
                  <div className="tool-card-badge">MỚI & HOT</div>
                )}
                <div className="tool-card-bg-icon">
                  {tool.icon}
                </div>
                <div className="tool-icon" style={{ 
                  background: tool.isHot ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.1)', 
                  color: tool.isHot ? '#059669' : 'var(--primary)' 
                }}>
                  {tool.icon}
                </div>
                <div className="tool-content">
                  <h3 className="tool-title">{tool.title}</h3>
                  <p className="tool-desc">{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: CÔNG CỤ PDF */}
      {(activeCategory === 'all' || activeCategory === 'pdf') && filteredPdfTools.length > 0 && (
        <section style={{ marginTop: activeCategory === 'all' ? '4.5rem' : '2.5rem' }}>
          <h2 className="text-2xl font-bold mb-8 text-gradient section-header-title">
            <FileEdit size={28} /> Công Cụ PDF
          </h2>
          <div className="tools-grid">
            {filteredPdfTools.map((tool, index) => (
              <Link to={tool.path} key={index} className="tool-card">
                <div className="tool-card-bg-icon">
                  {tool.icon}
                </div>
                <div className="tool-icon">
                  {tool.icon}
                </div>
                <div className="tool-content">
                  <h3 className="tool-title">{tool.title}</h3>
                  <p className="tool-desc">{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: CÔNG CỤ ẢNH & AI */}
      {(activeCategory === 'all' || activeCategory === 'image') && filteredImageTools.length > 0 && (
        <section style={{ marginTop: activeCategory === 'all' ? '4.5rem' : '2.5rem' }}>
          <h2 className="text-2xl font-bold mb-8 text-gradient section-header-title">
            <ImageIcon size={28} /> Xử Lý Ảnh & AI
          </h2>
          <div className="tools-grid">
            {filteredImageTools.map((tool, index) => (
              <Link to={tool.path} key={index} className="tool-card">
                <div className="tool-card-bg-icon">
                  {tool.icon}
                </div>
                <div className="tool-icon">
                  {tool.icon}
                </div>
                <div className="tool-content">
                  <h3 className="tool-title">{tool.title}</h3>
                  <p className="tool-desc">{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 4: ÂM THANH & VIDEO */}
      {(activeCategory === 'all' || activeCategory === 'media') && filteredMediaTools.length > 0 && (
        <section style={{ marginTop: activeCategory === 'all' ? '4.5rem' : '2.5rem' }}>
          <h2 className="text-2xl font-bold mb-8 text-gradient section-header-title">
            <Video size={28} /> Âm Thanh & Video Trực Tuyến
          </h2>
          <div className="tools-grid">
            {filteredMediaTools.map((tool, index) => (
              <Link 
                to={tool.path} 
                key={index} 
                className={`tool-card ${tool.isHot ? 'tool-card-highlight' : ''}`}
                style={{ borderColor: tool.isHot ? '#ec4899' : 'rgba(236, 72, 153, 0.25)' }}
              >
                {tool.isHot && (
                  <div className="tool-card-badge" style={{ background: '#ec4899' }}>MỚI & HOT</div>
                )}
                <div className="tool-card-bg-icon">
                  {tool.icon}
                </div>
                <div className="tool-icon" style={{ 
                  background: tool.isHot ? 'rgba(236, 72, 153, 0.12)' : 'rgba(236, 72, 153, 0.1)', 
                  color: tool.isHot ? '#db2777' : '#ec4899' 
                }}>
                  {tool.icon}
                </div>
                <div className="tool-content">
                  <h3 className="tool-title">{tool.title}</h3>
                  <p className="tool-desc">{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 5: TIỆN ÍCH KHÁC */}
      {(activeCategory === 'all' || activeCategory === 'other') && filteredOtherTools.length > 0 && (
        <section style={{ marginTop: activeCategory === 'all' ? '4.5rem' : '2.5rem', marginBottom: '4rem' }}>
          <h2 className="text-2xl font-bold mb-8 text-gradient section-header-title">
            <LinkIcon size={28} /> Tiện Ích Khác
          </h2>
          <div className="tools-grid">
            {filteredOtherTools.map((tool, index) => (
              <Link to={tool.path} key={index} className="tool-card">
                <div className="tool-card-bg-icon">
                  {tool.icon}
                </div>
                <div className="tool-icon">
                  {tool.icon}
                </div>
                <div className="tool-content">
                  <h3 className="tool-title">{tool.title}</h3>
                  <p className="tool-desc">{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Khi tìm kiếm không ra kết quả nào */}
      {searchQuery && totalFilteredCount === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Không tìm thấy công cụ nào với từ khóa "{searchQuery}"
          </h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Vui lòng thử từ khóa khác hoặc bấm nút bên dưới để xem toàn bộ danh mục.
          </p>
          <button 
            type="button" 
            onClick={() => setSearchQuery('')}
            className="btn btn-primary"
            style={{ borderRadius: '9999px', padding: '0.6rem 1.5rem' }}
          >
            Hiển thị tất cả công cụ
          </button>
        </div>
      )}

      {/* Modal hướng dẫn cài đặt ứng dụng cho Android & iOS */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        defaultTab={installDefaultTab}
      />
    </div>
  );
};

export default Home;

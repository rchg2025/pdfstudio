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
  ArrowRight
} from 'lucide-react';
import './Home.css';

const pdfTools = [
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
    title: 'Tăng độ nét ảnh',
    desc: 'Cải thiện chất lượng hình ảnh, độ sáng, độ tương phản ngay trên trình duyệt.'
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
    path: '/cat-ghep-am-thanh',
    icon: <Music size={24} />,
    title: 'Cắt Ghép Âm Thanh',
    desc: 'Cắt, chia nhỏ hoặc ghép nối nhiều file âm thanh lại với nhau trực tiếp trên trình duyệt.'
  },
  {
    path: '/doc-van-ban',
    icon: <Mic size={24} />,
    title: 'Đọc Văn Bản (Trình Duyệt)',
    desc: 'Chuyển đổi văn bản thành giọng nói bằng bộ máy của trình duyệt, không cần tải server.'
  }
];

const edTechTools = [
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


const Home = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'edtech' | 'pdf' | 'image' | 'other'>('all');

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
        <h1 className="home-title text-gradient">Công Cụ PDF & Tiện Ích Trực Tuyến</h1>
        <p className="home-subtitle">
          Nền tảng tất cả trong một phục vụ công việc văn phòng, xử lý PDF, đồ họa hình ảnh và bộ công cụ số hóa giảng dạy trực quan.
        </p>

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

          <Link to="/soan-de-thi-ai" className="quick-shortcut-pill featured-ai">
            <span className="qsp-icon">✨</span>
            <div className="qsp-text">
              <span className="qsp-title">Soạn Đề Thi AI</span>
              <span className="qsp-sub">Bóc tách giáo trình ra đề</span>
            </div>
            <ArrowRight size={18} className="qsp-arrow" />
          </Link>
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
          onClick={() => setActiveCategory('other')} 
          className={`category-tab-btn ${activeCategory === 'other' ? 'active' : ''}`}
        >
          <LinkIcon size={16} /> Tiện ích Khác
        </button>
      </div>

      {/* SECTION 1: CÔNG CỤ GIẢNG DẠY & LMS */}
      {(activeCategory === 'all' || activeCategory === 'edtech') && (
        <section style={{ marginTop: '2.5rem' }}>
          <h2 className="text-2xl font-bold mb-8 text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <GraduationCap size={28} /> Công Cụ Giảng Dạy & E-Learning LMS
          </h2>
          <div className="tools-grid">
            {edTechTools.map((tool, index) => (
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
      {(activeCategory === 'all' || activeCategory === 'pdf') && (
        <section style={{ marginTop: activeCategory === 'all' ? '4.5rem' : '2.5rem' }}>
          <h2 className="text-2xl font-bold mb-8 text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileEdit size={28} /> Công Cụ PDF
          </h2>
          <div className="tools-grid">
            {pdfTools.map((tool, index) => (
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
      {(activeCategory === 'all' || activeCategory === 'image') && (
        <section style={{ marginTop: activeCategory === 'all' ? '4.5rem' : '2.5rem' }}>
          <h2 className="text-2xl font-bold mb-8 text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ImageIcon size={28} /> Xử Lý Ảnh & AI
          </h2>
          <div className="tools-grid">
            {imageTools.map((tool, index) => (
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

      {/* SECTION 4: TIỆN ÍCH KHÁC */}
      {(activeCategory === 'all' || activeCategory === 'other') && (
        <section style={{ marginTop: activeCategory === 'all' ? '4.5rem' : '2.5rem', marginBottom: '4rem' }}>
          <h2 className="text-2xl font-bold mb-8 text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <LinkIcon size={28} /> Tiện Ích Khác
          </h2>
          <div className="tools-grid">
            {otherTools.map((tool, index) => (
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
    </div>
  );
};

export default Home;

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
  FileCheck,
  MapPin,
  Mic2
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
  },
  {
    path: '/xuat-ma-nhung',
    icon: <Code size={24} />,
    title: 'Xuất Mã Nhúng HTML5 Tương Tác',
    desc: 'Tự động dừng Canva/YouTube theo thời gian để trả lời câu hỏi trắc nghiệm rồi mới xem tiếp.'
  }
];

const edTechTools = [
  {
    path: '/xuat-ma-nhung',
    icon: <Code size={24} />,
    title: 'Xuất Mã Nhúng LMS Tương Tác',
    desc: 'Tự động dừng bài giảng Canva/YouTube để trả lời trắc nghiệm, xuất file HTML độc lập và mã nhúng LMS.'
  },
  {
    path: '/the-ghi-nho-flashcard',
    icon: <BookOpen size={24} />,
    title: 'Thẻ Ghi Nhớ AI (Flashcards)',
    desc: '1-click tạo bộ thẻ lật 3D ôn tập kiến thức từ bài học bằng AI, xuất HTML nhúng LMS học tập.'
  },
  {
    path: '/vong-quay-lop-hoc',
    icon: <Compass size={24} />,
    title: 'Vòng Quay May Mắn & Bốc Thăm',
    desc: 'Gọi tên ngẫu nhiên, tạo câu hỏi khởi động và tự động chia nhóm học tập sôi động trong giờ học.'
  },
  {
    path: '/tao-phieu-hoc-tap',
    icon: <FileCheck size={24} />,
    title: 'Tạo Phiếu Học Tập & Đề Thi A4',
    desc: 'AI thiết kế đề thi trắc nghiệm & tự luận chuẩn A4 có phần chấm điểm, lời phê in ấn sắc nét.'
  },
  {
    path: '/anh-tuong-tac-hotspot',
    icon: <MapPin size={24} />,
    title: 'Hình Ảnh Chú Thích Tương Tác',
    desc: 'Đính kèm các điểm chạm (Pin) giải thích thông minh lên sơ đồ, bản đồ, tranh minh họa học tập.'
  },
  {
    path: '/long-tieng-slide',
    icon: <Mic2 size={24} />,
    title: 'Lồng Tiếng Slide Bài Giảng AI',
    desc: 'AI viết kịch bản thuyết minh và phát âm lồng tiếng chuẩn từng trang slide cho bài giảng số.'
  }
];


const Home = () => {
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
        <h1 className="home-title text-gradient">Công Cụ PDF & Tiện Ích</h1>
        <p className="home-subtitle">
          Một nền tảng duy nhất giúp bạn xử lý file PDF, tối ưu hóa hình ảnh và nhiều hơn thế nữa. 
          Tất cả đều được thực hiện ngay trên trình duyệt, đảm bảo an toàn tuyệt đối.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileEdit size={20} /> Chỉnh sửa PDF</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ImageIcon size={20} /> Xử lý hình ảnh</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><LinkIcon size={20} /> Chia sẻ dễ dàng</li>
        </ul>
      </section>

      <section style={{ marginTop: '4rem' }}>
        <h2 className="text-2xl font-bold mb-10 text-center text-gradient" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', paddingBottom: '20px' }}>
          <GraduationCap size={28} /> Công Cụ Giảng Dạy & E-Learning LMS
        </h2>
        <div className="tools-grid">
          {edTechTools.map((tool, index) => (
            <Link to={tool.path} key={index} className="tool-card" style={{ borderColor: 'rgba(99, 102, 241, 0.25)' }}>
              <div className="tool-card-bg-icon">
                {tool.icon}
              </div>
              <div className="tool-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
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

      <section style={{ marginTop: '5rem' }}>
        <h2 className="text-2xl font-bold mb-10 text-center text-gradient" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', paddingBottom: '20px' }}>
          <FileEdit size={28} /> Công cụ PDF
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

      <section style={{ marginTop: '5rem' }}>
        <h2 className="text-2xl font-bold mb-10 text-center text-gradient" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', paddingBottom: '20px' }}>
          <ImageIcon size={28} /> Công cụ Ảnh
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


      <section style={{ marginTop: '5rem', marginBottom: '4rem' }}>
        <h2 className="text-2xl font-bold mb-10 text-center text-gradient" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', paddingBottom: '20px' }}>
          <LinkIcon size={28} /> Tiện ích Khác
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
    </div>
  );
};

export default Home;

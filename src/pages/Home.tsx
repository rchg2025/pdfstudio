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
  ImagePlus
} from 'lucide-react';
import './Home.css';

const tools = [
  {
    path: '/dashboard',
    icon: <ImagePlus size={24} />,
    title: 'Công Cụ Tạo Khung Ảnh',
    desc: 'Tạo và quản lý các khung ảnh sự kiện, chiến dịch truyền thông của riêng bạn.'
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
    path: '/image-compressor',
    icon: <ImageMinus size={24} />,
    title: 'Công cụ nén ảnh theo dung lượng',
    desc: 'Giảm kích thước file ảnh nhanh chóng mà vẫn giữ nguyên chất lượng cao nhất.'
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
    path: '/qr-link',
    icon: <LinkIcon size={24} />,
    title: 'Công cụ rút gọn link và tạo QR',
    desc: 'Rút gọn các đường dẫn URL dài và tự động tạo mã QR để dễ dàng quét bằng điện thoại.'
  },
  {
    path: '/image-converter',
    icon: <RefreshCw size={24} />,
    title: 'Chuyển Đổi Định Dạng Ảnh',
    desc: 'Chuyển đổi ảnh giữa các định dạng HEIC, JPG, PNG, WEBP một cách nhanh chóng.'
  },
  {
    path: '/bao-mat-pdf',
    icon: <ShieldCheck size={24} />,
    title: 'Công Cụ Bảo Mật PDF',
    desc: 'Đặt mật khẩu bảo vệ hoặc gỡ bỏ lớp bảo mật cho file PDF một cách dễ dàng và an toàn.'
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

const Home = () => {
  return (
    <div className="animate-fade-in home-container">
      <section className="home-hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img 
          src="/logo.jpg" 
          alt="RCHG Studio Logo" 
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

      <section className="tools-grid">
        {tools.map((tool, index) => (
          <Link to={tool.path} key={index} className="tool-card">
            <div className="tool-card-bg-icon">
              {tool.icon}
            </div>
            <div className="tool-icon">
              {tool.icon}
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 className="tool-title">{tool.title}</h3>
              <p className="tool-desc">{tool.desc}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
};

export default Home;

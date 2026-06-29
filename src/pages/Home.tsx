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
  FileText
} from 'lucide-react';
import './Home.css';

const tools = [
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
    path: '/pdf-to-word',
    icon: <FileText size={24} />,
    title: 'PDF sang Word',
    desc: 'Chuyển đổi PDF sang file Word (.docx) giữ nguyên cấu trúc và định dạng.'
  },
  {
    path: '/bao-mat-pdf',
    icon: <ShieldCheck size={24} />,
    title: 'Công Cụ Bảo Mật PDF',
    desc: 'Đặt mật khẩu bảo vệ hoặc gỡ bỏ lớp bảo mật cho file PDF một cách dễ dàng và an toàn.'
  }
];

const Home = () => {
  return (
    <div className="animate-fade-in">
      <section className="home-hero">
        <h1 className="home-title text-gradient">Công Cụ PDF & Tiện Ích</h1>
        <p className="home-subtitle">
          Một nền tảng duy nhất giúp bạn xử lý file PDF, tối ưu hóa hình ảnh và nhiều hơn thế nữa. 
          Tất cả đều được thực hiện ngay trên trình duyệt, đảm bảo an toàn tuyệt đối.
        </p>
      </section>

      <section className="tools-grid">
        {tools.map((tool, index) => (
          <Link to={tool.path} key={index} className="tool-card">
            <div className="tool-icon">
              {tool.icon}
            </div>
            <div>
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

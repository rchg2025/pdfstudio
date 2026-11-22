import type React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  CheckSquare, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  FolderOpen, 
  CalendarCheck 
} from 'lucide-react';
import './PartyWorkHub.css';

interface PartyToolItem {
  id: string;
  title: string;
  desc: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  isAvailable: boolean;
}

export default function PartyWorkHub() {
  const tools: PartyToolItem[] = [
    {
      id: 'ban-kiem-diem-02a',
      title: 'Bản Kiểm Điểm Đảng Viên Cuối Năm (Mẫu 02A - Lãnh Đạo, Quản Lý)',
      desc: 'Bản tự đánh giá, xếp loại chất lượng năm 2026 dành cho cá nhân giữ chức vụ lãnh đạo, quản lý theo Hướng dẫn 43-HD/BTCTW và Công văn 2772-CV/BTCTW, xem trước A4 và xuất Word (.doc).',
      path: '/ban-kiem-diem-dang-vien-mau-02a',
      icon: <CheckSquare size={28} color="#dc2626" />,
      badge: 'MỚI 2026',
      badgeColor: '#dc2626',
      isAvailable: true
    },
    {
      id: 'bo-sung-ho-so',
      title: 'Phiếu Bổ Sung Hồ Sơ Đảng Viên (Mẫu 3-HSĐV)',
      desc: 'Soạn thảo nhanh, chuẩn hóa quy chuẩn chữ "K" theo Ban Tổ chức Trung ương, tự động dàn trang in A4 và xuất file Word (.doc) 100% chuẩn thể thức Đảng.',
      path: '/bo-sung-ho-so-dang-vien',
      icon: <FileText size={28} color="#b91c1c" />,
      badge: 'ĐÃ SẴN SÀNG',
      badgeColor: '#b91c1c',
      isAvailable: true
    },
    {
      id: 'ban-kiem-diem-dang-vien',
      title: 'Bản Kiểm Điểm Đảng Viên Cuối Năm (Mẫu 02)',
      desc: 'Khung gợi ý tự kiểm điểm phẩm chất chính trị, đạo đức, kết quả thực hiện chức trách nhiệm vụ, phương hướng khắc phục và đề xuất xếp loại.',
      path: '/bo-sung-ho-so-dang-vien',
      icon: <CheckSquare size={28} color="#d97706" />,
      badge: 'CÔNG CỤ NỔI BẬT',
      badgeColor: '#d97706',
      isAvailable: true
    },
    {
      id: 'don-chuyen-sinh-hoat-dang',
      title: 'Giấy Giới Thiệu & Đơn Chuyển Sinh Hoạt Đảng',
      desc: 'Mẫu chuyển sinh hoạt đảng chính thức, chuyển sinh hoạt đảng tạm thời khi thay đổi nơi cư trú hoặc đơn vị công tác mới.',
      path: '/bo-sung-ho-so-dang-vien',
      icon: <Users size={28} color="#059669" />,
      badge: 'TIỆN ÍCH',
      badgeColor: '#059669',
      isAvailable: true
    },
    {
      id: 'bien-ban-hop-chi-bo',
      title: 'Biên Bản Họp Chi Bộ Định Kỳ & Chuyên Đề',
      desc: 'Biên bản sinh hoạt chi bộ hàng tháng, kiểm tra đảng viên chấp hành Điều lệ Đảng, ghi chép nội dung thảo luận và nghị quyết chi bộ.',
      path: '/bo-sung-ho-so-dang-vien',
      icon: <CalendarCheck size={28} color="#2563eb" />,
      badge: 'BIỂU MẪU CHUẨN',
      badgeColor: '#2563eb',
      isAvailable: true
    },
    {
      id: 'tra-cuu-dieu-le-ai',
      title: 'Trợ Lý AI Thư Ký Tra Cứu Điều Lệ & Hướng Dẫn Đảng',
      desc: 'Hỏi đáp các quy định của Điều lệ Đảng, Hướng dẫn 01-HD/TW, Quy định 24-QĐ/TW về thi hành Điều lệ Đảng nhanh chóng, chuẩn xác.',
      path: '/hoi-dap-pdf-ai',
      icon: <Sparkles size={28} color="#7c3aed" />,
      badge: 'TRỢ LÝ AI',
      badgeColor: '#7c3aed',
      isAvailable: true
    }
  ];

  return (
    <div className="party-hub-container">
      {/* HERO SECTION */}
      <div className="party-hub-hero">
        <div className="party-hub-hero-content">
          <div className="party-hub-badge">
            <ShieldCheck size={16} />
            HỆ THỐNG BIỂU MẪU & CÔNG CỤ VĂN BẢN ĐẢNG CHUẨN HOÁ
          </div>
          <h1>Nhóm Chức Năng Công Tác Đảng</h1>
          <p>
            Bộ công cụ số hóa quy trình công tác Đảng dành cho Cấp ủy cơ sở, Chi ủy chi bộ và Đảng viên: 
            Khai báo bổ sung hồ sơ định kỳ Mẫu 3-HSĐV, kiểm điểm đảng viên, biên bản sinh hoạt chi bộ, 
            xuất văn bản Word chuẩn thể thức theo Quy định Ban Bí thư và Ban Tổ chức Trung ương.
          </p>
        </div>
      </div>

      {/* DANH SÁCH CÔNG CỤ */}
      <div className="party-tools-grid">
        {tools.map(tool => (
          <Link to={tool.path} key={tool.id} className="party-tool-card">
            <div className="party-tool-top">
              <div className="party-tool-icon">
                {tool.icon}
              </div>
              {tool.badge && (
                <span 
                  className="party-tool-badge" 
                  style={{ background: `${tool.badgeColor}15`, color: tool.badgeColor, borderColor: `${tool.badgeColor}40` }}
                >
                  {tool.badge}
                </span>
              )}
            </div>

            <h3 className="party-tool-title">{tool.title}</h3>
            <p className="party-tool-desc">{tool.desc}</p>

            <div className="party-tool-footer">
              <span className="party-tool-btn">
                Sử dụng ngay <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* THÔNG TIN THỂ THỨC VĂN BẢN ĐẢNG */}
      <div className="party-info-card">
        <div className="party-info-title">
          <FolderOpen size={20} color="#b91c1c" />
          Quy Chuẩn Thể Thức Văn Bản Trong Công Tác Đảng
        </div>
        <ul className="party-info-list">
          <li>
            <strong>Font chữ & Định dạng:</strong> Sử dụng phông chữ Times New Roman (bộ mã Unicode), cỡ chữ từ 13pt - 14pt, giãn dòng 1.3 - 1.4 chuẩn theo Quy định số 66-QĐ/TW.
          </li>
          <li>
            <strong>Quy tắc ghi chữ "K":</strong> Tại Phiếu bổ sung hồ sơ đảng viên (Mẫu 3-HSĐV), chỉ khai các nội dung có thay đổi so với năm trước. Trường nào không có biến động, bắt buộc ghi vào mục đó chữ "K".
          </li>
          <li>
            <strong>Xuất tài liệu:</strong> Hệ thống tự động tạo file Word (.doc) giữ nguyên định dạng trang in A4, căn lề và khối chữ ký 3 bên (Chi ủy chi bộ, Cấp ủy cơ sở, Người khai).
          </li>
        </ul>
      </div>
    </div>
  );
}

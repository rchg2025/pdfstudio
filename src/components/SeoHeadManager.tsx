import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ALL_TOOLS, BASE_SITE_URL } from '../data/toolsConfig';

const DEFAULT_TITLE = 'RCHG Studio - Các công cụ PDF, Xử lý ảnh & Tiện ích Giảng dạy Trực Tuyến';
const DEFAULT_DESC = 'Nền tảng trực tuyến tất cả trong một: Xử lý PDF, đồ họa hình ảnh AI, phòng thi trắc nghiệm, điểm danh QR động và kịch bản video AI liền mạch.';

export default function SeoHeadManager() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    const currentTool = ALL_TOOLS.find(t => t.path === pathname);

    let pageTitle = DEFAULT_TITLE;
    let pageDesc = DEFAULT_DESC;
    let pageKeywords = 'công cụ pdf, xử lý ảnh, tiện ích giảng dạy, thi trắc nghiệm online, điểm danh qr động, kịch bản video ai, rchg studio';

    if (currentTool) {
      pageTitle = `${currentTool.title} | RCHG Studio`;
      pageDesc = currentTool.desc;
      if (currentTool.keywords && currentTool.keywords.length > 0) {
        pageKeywords = currentTool.keywords.join(', ') + ', rchg studio, tienich ite';
      }
    } else if (pathname === '/login') {
      pageTitle = 'Đăng Nhập | RCHG Studio';
      pageDesc = 'Đăng nhập vào hệ thống tiện ích RCHG Studio.';
    } else if (pathname === '/register') {
      pageTitle = 'Đăng Ký Tài Khoản | RCHG Studio';
      pageDesc = 'Đăng ký tài khoản miễn phí để sử dụng trọn bộ công cụ tiện ích tại RCHG Studio.';
    }

    // 1. Cập nhật Title
    document.title = pageTitle;

    // 2. Cập nhật Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', pageDesc);

    // 3. Cập nhật Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', pageKeywords);

    // 4. Cập nhật OpenGraph Tags
    const updateOrCreateMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateOrCreateMeta('og:title', pageTitle);
    updateOrCreateMeta('og:description', pageDesc);
    updateOrCreateMeta('og:url', `${BASE_SITE_URL}${pathname}`);
    updateOrCreateMeta('twitter:title', pageTitle);
    updateOrCreateMeta('twitter:description', pageDesc);

    // 5. Cập nhật Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${BASE_SITE_URL}${pathname}`);

  }, [location.pathname]);

  return null;
}

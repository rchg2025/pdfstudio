/**
 * Helper utility để xử lý URL hình ảnh trong Quiz và Frame
 * Giúp tối ưu hiển thị ảnh từ Google Drive thông qua API proxy nội bộ
 * và tránh lỗi referrer/CORS của trình duyệt.
 */

export function getSafeImageUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URLs (base64) hoặc SVG hoặc Blob URL -> giữ nguyên
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Nếu là ảnh từ Google Drive
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    // Trích xuất fileId nếu có
    let directUrl = trimmed;
    if (directUrl.includes('/uc?id=')) {
      directUrl = directUrl.replace('/uc?id=', '/thumbnail?id=') + '&sz=w2000';
    }

    // Nếu đã bọc proxy-image rồi thì giữ nguyên
    if (trimmed.includes('/api/utils/proxy-image')) {
      return trimmed;
    }

    return `/api/utils/proxy-image?url=${encodeURIComponent(directUrl)}`;
  }

  return trimmed;
}

/**
 * Fallback handler cho thẻ img khi proxy hoặc direct url gặp sự cố
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, originalUrl?: string) {
  const target = e.currentTarget;
  if (!originalUrl) return;

  // Nếu đang gọi qua proxy mà lỗi -> fallback về direct URL với Google Drive
  if (target.src.includes('/api/utils/proxy-image')) {
    if (originalUrl !== target.src) {
      target.src = originalUrl;
    }
  } else if (originalUrl.includes('drive.google.com')) {
    // Nếu direct lỗi -> thử proxy
    const proxyUrl = `/api/utils/proxy-image?url=${encodeURIComponent(originalUrl)}`;
    if (target.src !== proxyUrl) {
      target.src = proxyUrl;
    }
  }
}

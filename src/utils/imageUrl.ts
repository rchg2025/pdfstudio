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

/**
 * Tách và làm sạch câu hỏi nếu trong nội dung câu hỏi có chứa URL hình ảnh hoặc thẻ Markdown/HTML img
 * Trả về: { cleanText: string, imageUrl?: string }
 */
export function extractQuestionImage(text: string, existingImageUrl?: string): { cleanText: string; imageUrl?: string } {
  if (!text) return { cleanText: '', imageUrl: existingImageUrl };

  let imageUrl = existingImageUrl || '';
  let cleanText = text;

  // 1. Kiểm tra Markdown image: ![...](url)
  const mdMatch = cleanText.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/i);
  if (mdMatch) {
    if (!imageUrl) imageUrl = mdMatch[1];
    cleanText = cleanText.replace(mdMatch[0], '').trim();
  }

  // 2. Kiểm tra thẻ HTML img: <img ... src="url" ... />
  const htmlImgMatch = cleanText.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/i);
  if (htmlImgMatch) {
    if (!imageUrl) imageUrl = htmlImgMatch[1];
    cleanText = cleanText.replace(htmlImgMatch[0], '').trim();
  }

  // 3. Kiểm tra link hình ảnh trực tiếp (đứng riêng hoặc nằm trong câu hỏi):
  // URL kết thúc bằng .png, .jpg, .jpeg, .webp, .gif hoặc link drive.google.com / docs.google.com
  const directUrlRegex = /(https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|webp|gif|svg)(?:\?[^\s"']*)?)|(https?:\/\/(?:drive|docs)\.google\.com\/[^\s"']+)/i;
  const urlMatch = cleanText.match(directUrlRegex);
  if (urlMatch) {
    const foundUrl = urlMatch[0];
    if (!imageUrl) imageUrl = foundUrl;
    // Bỏ link ảnh ra khỏi văn bản câu hỏi để không bị hiển thị chuỗi link thô
    cleanText = cleanText.replace(foundUrl, '').trim();
  }

  // Làm sạch các ký tự dư thừa sau khi gỡ link (ví dụ: [Ảnh: ], Hình ảnh: , v.v.)
  cleanText = cleanText
    .replace(/(?:\[?\s*(?:Hình ảnh|Ảnh|Image|Hình minh họa)[:.]?\s*\]?)\s*$/i, '')
    .replace(/^\s*(?:\[?\s*(?:Hình ảnh|Ảnh|Image|Hình minh họa)[:.]?\s*\]?)\s*/i, '')
    .trim();

  return {
    cleanText: cleanText || text,
    imageUrl: imageUrl || undefined
  };
}

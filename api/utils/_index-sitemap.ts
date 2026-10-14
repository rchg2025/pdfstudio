import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Endpoint thông báo (ping) Googlebot về sitemap mới nhất và hướng dẫn sử dụng Google Indexing API / Search Console
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sitemapUrl = 'https://tienich.ite.id.vn/sitemap.xml';

  try {
    const results: any = {
      sitemapUrl,
      timestamp: new Date().toISOString(),
      pingStatus: {}
    };

    // 1. Gửi Ping đến Google Sitemap Ping (nếu khả dụng)
    try {
      const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      const googleRes = await fetch(googlePingUrl);
      results.pingStatus.google = {
        status: googleRes.status,
        statusText: googleRes.statusText
      };
    } catch (e: any) {
      results.pingStatus.google = { error: e.message };
    }

    // 2. Gửi Ping đến Bing Sitemap Ping (Bing & Yahoo Webmaster)
    try {
      const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      const bingRes = await fetch(bingPingUrl);
      results.pingStatus.bing = {
        status: bingRes.status,
        statusText: bingRes.statusText
      };
    } catch (e: any) {
      results.pingStatus.bing = { error: e.message };
    }

    results.instructions = {
      googleSearchConsole: 'Truy cập https://search.google.com/search-console -> Chọn Sitemaps -> Nhập "sitemap.xml" và nhấn Submit để Google thu thập toàn bộ 40+ công cụ.',
      urlInspection: 'Để index một công cụ cụ thể ngay tức khắc: Dán link (ví dụ: https://tienich.ite.id.vn/kich-ban-video-ai) vào thanh tìm kiếm trên cùng của Google Search Console và nhấn "Yêu cầu lập chỉ mục" (Request Indexing).'
    };

    return res.status(200).json({
      success: true,
      message: 'Đã phát tín hiệu thông báo sitemap tới các công cụ tìm kiếm',
      data: results
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kích hoạt index sitemap',
      error: error.message
    });
  }
}

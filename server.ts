import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import all API handlers
import authHandler from './api/auth/[action].js';
import adminHandler from './api/admin/[action].js';
import subscriptionHandler from './api/subscription.js';
import qaWallHandler from './api/qa-wall.js';
import redirectHandler from './api/redirect.js';
import frameOgHandler from './api/frame-og.js';
import framesIndexHandler from './api/frames/index.js';
import framesPublicHandler from './api/frames/public.js';
import framesTrackHandler from './api/frames/track.js';
import framesSlugHandler from './api/frames/[slug].js';
import utilsActionHandler from './api/utils/[action].js';
import uploadHandler from './api/upload/index.js';
import edgeTtsHandler from './api/edge-tts.js';
import attendanceHandler from './api/attendance.js';
import liveBattleHandler from './api/live-battle.js';
import pdfChatHandler from './api/pdf-chat.js';
import mediaDownloadHandler from './api/media-download.js';
import { prisma } from './api/_lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to adapt Express req/res to Vercel Serverless Function signature
function adaptVercelHandler(handler: any, extraQuery: Record<string, any> = {}) {
  return async (req: express.Request, res: express.Response) => {
    try {
      if (req.params) {
        for (const [k, v] of Object.entries(req.params)) {
          (req.query as any)[k] = v;
        }
      }
      if (extraQuery) {
        for (const [k, v] of Object.entries(extraQuery)) {
          (req.query as any)[k] = v;
        }
      }
      if (req.params && req.params.action) {
        (req.query as any).action = req.params.action;
      }
      await handler(req, res);
    } catch (err: any) {
      console.error('Server Handler Error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
      }
    }
  };
}

// ---------------- API ROUTES ----------------

// Auth
app.all('/api/auth/:action', adaptVercelHandler(authHandler));

// Admin
app.all('/api/admin/:action', adaptVercelHandler(adminHandler));

// Subscription
app.all('/api/subscription', adaptVercelHandler(subscriptionHandler));

// QA Wall & Quiz API
app.all('/api/quiz-api', adaptVercelHandler(qaWallHandler));
app.all('/api/qa-wall', adaptVercelHandler(qaWallHandler));

// Frames API
app.all('/api/frames/public', adaptVercelHandler(framesPublicHandler));
app.all('/api/frames/track', adaptVercelHandler(framesTrackHandler));
app.all('/api/frames', adaptVercelHandler(framesIndexHandler));
app.all('/api/frames/:slug', adaptVercelHandler(framesSlugHandler));

// Frame OpenGraph
app.get('/f/:slug', adaptVercelHandler(frameOgHandler));

// Upload
app.all('/api/upload', adaptVercelHandler(uploadHandler));

// Utils
app.all('/api/utils/:action', adaptVercelHandler(utilsActionHandler));

// Edge TTS
app.all('/api/edge-tts', adaptVercelHandler(edgeTtsHandler));

// Short URL Redirect
app.get('/api/redirect', adaptVercelHandler(redirectHandler));

// Attendance API (Điểm danh QR động)
app.all('/api/attendance', adaptVercelHandler(attendanceHandler));

// Live Battle API (Đấu trường trắc nghiệm Kahoot)
app.all('/api/live-battle', adaptVercelHandler(liveBattleHandler));

// Chat with PDF API (Hỏi đáp tài liệu PDF bằng AI)
app.all('/api/pdf-chat', adaptVercelHandler(pdfChatHandler));

// Media Downloader API (Tải Video & Âm thanh Youtube, TikTok, Facebook, Instagram...)
app.all('/api/media-download', adaptVercelHandler(mediaDownloadHandler));

// Sitemaps XML Route (Tự động phục vụ file sitemap.xml cập nhật mới nhất cho Googlebot)
app.get('/sitemap.xml', (_req, res) => {
  const publicSitemap = path.join(__dirname, 'public', 'sitemap.xml');
  const distSitemap = path.join(__dirname, 'dist', 'sitemap.xml');
  const targetPath = fs.existsSync(distSitemap) ? distSitemap : (fs.existsSync(publicSitemap) ? publicSitemap : null);

  if (targetPath) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.sendFile(targetPath);
  }
  return res.status(404).send('Sitemap not found');
});

// Static files from Vite build
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: '1y',
    immutable: true,
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));

  // Handle SPA routes
  const spaRoutes = [
    '/',
    '/dashboard',
    '/admin',
    '/thong-tin-ca-nhan',
    '/profile',
    '/login',
    '/register',
    '/forgot-password',
    '/tao-khung',
    '/pdf-editor',
    '/pdf-merge-split',
    '/pdf-compressor',
    '/pdf-to-image',
    '/image-compressor',
    '/image-converter',
    '/crop-anh',
    '/resize-anh',
    '/tang-do-net-anh',
    '/qr-link',
    '/tao-ma-qr-nang-cao',
    '/custom-qr',
    '/cat-video',
    '/video-cutter',
    '/tai-video-am-thanh',
    '/tai-video',
    '/media-downloader',
    '/quay-man-hinh',
    '/screen-recorder',
    '/sao-chep-drive',
    '/cat-ghep-am-thanh',
    '/doc-van-ban',
    '/xuat-ma-nhung',
    '/doi-chieu-truoc-sau',
    '/quy-trinh-sop',
    '/phan-loai-ghep-noi',
    '/bang-tinh-chuyen-nganh',
    '/tinh-huong-phan-nhanh',
    '/the-ghi-nho-flashcard',
    '/anh-tuong-tac-hotspot',
    '/vong-quay-lop-hoc',
    '/dong-ho-hoat-dong',
    '/buc-tuong-cau-hoi',
    '/phieu-bai-tap-tuong-tac',
    '/quan-ly-thi-trac-nghiem',
    '/soan-de-thi-ai',
    '/phong-thi',
    '/phong-thi/:quizId',
    '/diem-danh',
    '/diem-danh/:code',
    '/quan-ly-diem-danh',
    '/bang-vinh-danh',
    '/dau-truong-live',
    '/dau-truong-live/:roomId',
    '/dau-truong',
    '/dau-truong/:pinCode',
    '/kich-ban-video-ai',
    '/ai-video-script',
    '/tao-anh-ai',
    '/tao-anh-the',
    '/anh-the-ai',
    '/xoa-dau-tieng-viet',
    '/xoa-trang-pdf',
    '/watermark-studio',
    '/dong-dau-pdf',
    '/ky-ten-pdf',
    '/sign-pdf',
    '/bao-mat-pdf',
    '/jpg-sang-pdf',
    '/xoa-nen-mau',
    '/ghep-anh-nghe-thuat',
    '/photo-collage',
    '/bo-loc-anh',
    '/photo-filter',
    '/pdf-compare',
    '/hoi-dap-pdf-ai',
    '/ai-podcast-studio',
    '/podcast-ai',
    '/embed-player'
  ];

  spaRoutes.forEach(route => {
    app.get(route, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  });

  // Short link alias wildcard or SPA fallback
  app.get('/:alias', async (req, res, next) => {
    const alias = req.params.alias?.trim();
    // If it's a file request that wasn't found in static files, return 404
    if (!alias || alias.includes('.')) {
      return next();
    }

    try {
      const record = await prisma.urls.findFirst({
        where: {
          alias: {
            equals: alias,
            mode: 'insensitive'
          }
        }
      });

      if (record && record.original_url) {
        // Tăng clicks trong background
        prisma.urls.update({
          where: { id: record.id },
          data: { clicks: { increment: 1 } }
        }).catch(err => console.error('Error updating clicks:', err));

        return res.redirect(301, record.original_url);
      }
    } catch (err) {
      console.error('Error checking short link alias:', err);
    }

    // Nếu không phải là short link có trong DB, trả về SPA index.html để React Router xử lý
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // Catch-all fallback for SPA client-side routing
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn('⚠️ Warning: dist/ folder not found. Please run "npm run build" first.');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PDFStudio server running at http://0.0.0.0:${PORT}`);

  // Chạy background worker kiểm tra hạn dùng & gửi email cảnh báo (20 ngày, 10 ngày, hết hạn)
  const runExpirationCheck = async () => {
    try {
      const { prisma } = await import('./api/_lib/prisma.js');
      const now = new Date();
      const users = await prisma.user.findMany({
        where: {
          role: { not: 'ADMIN' },
          isLifetime: false,
          subscriptionExpiresAt: { not: null }
        },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionExpiresAt: true
        }
      });

      const { sendExpirationWarningEmail } = await import('./api/_lib/email.js');
      for (const u of users) {
        if (!u.subscriptionExpiresAt) continue;
        const diffMs = new Date(u.subscriptionExpiresAt).getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          // Tự động chuyển trạng thái thành DISABLED nếu hết hạn
          await prisma.user.update({
            where: { id: u.id },
            data: { role: 'DISABLED' }
          }).catch(e => console.error(`[ExpirationJob] Lỗi cập nhật DISABLED cho user ${u.email}:`, e.message));
        }

        if (diffDays === 20 || diffDays === 10 || diffDays <= 0) {
          const dateStr = now.toISOString().split('T')[0];
          const tagDays = diffDays <= 0 ? 0 : diffDays;
          const trackKey = `warn_email_${u.id}_${tagDays}d_${dateStr}`;
          const existingTrack = await prisma.setting.findUnique({
            where: { key: trackKey }
          });

          if (!existingTrack) {
            await sendExpirationWarningEmail(u, tagDays, u.subscriptionExpiresAt);
            await prisma.setting.create({
              data: { key: trackKey, value: new Date().toISOString() }
            });
            console.log(`[ExpirationJob] Đã gửi email cảnh báo ${tagDays} ngày cho ${u.email}`);
          }
        }
      }
    } catch (err: any) {
      console.error('[ExpirationJob] Lỗi kiểm tra hết hạn tự động:', err.message);
    }
  };

  // Chạy sau khi server khởi động 15 giây và lặp lại mỗi 6 tiếng
  setTimeout(runExpirationCheck, 15000);
  setInterval(runExpirationCheck, 6 * 60 * 60 * 1000);
});

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
      if (req.params && req.params.action) {
        (req.query as any).action = req.params.action;
      }
      Object.assign(req.query, req.params, extraQuery);
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

// Static files from Vite build
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: '1y',
    immutable: true,
    index: false
  }));

  // Handle SPA routes
  const spaRoutes = [
    '/',
    '/dashboard',
    '/admin',
    '/login',
    '/register',
    '/tao-khung',
    '/pdf-editor',
    '/pdf-merge-split',
    '/pdf-compressor',
    '/pdf-to-image',
    '/image-compressor',
    '/qr-link',
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
    '/phong-thi',
    '/phong-thi/:id',
    '/embed-player'
  ];

  spaRoutes.forEach(route => {
    app.get(route, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  });

  // Short link alias wildcard or 404 fallback
  app.get('/:alias', async (req, res, next) => {
    const alias = req.params.alias;
    // If it's a file request that wasn't found in static files, return 404
    if (alias.includes('.')) {
      return next();
    }
    // Otherwise try redirect handler
    Object.assign(req.query, { alias });
    try {
      await redirectHandler(req as any, res as any);
    } catch {
      res.sendFile(path.join(distPath, 'index.html'));
    }
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

        if (diffDays === 20 || diffDays === 10 || diffDays === 0) {
          const dateStr = now.toISOString().split('T')[0];
          const trackKey = `warn_email_${u.id}_${diffDays}d_${dateStr}`;
          const existingTrack = await prisma.setting.findUnique({
            where: { key: trackKey }
          });

          if (!existingTrack) {
            await sendExpirationWarningEmail(u, diffDays, u.subscriptionExpiresAt);
            await prisma.setting.create({
              data: { key: trackKey, value: new Date().toISOString() }
            });
            console.log(`[ExpirationJob] Đã gửi email cảnh báo ${diffDays} ngày cho ${u.email}`);
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

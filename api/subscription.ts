import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, getUserFromRequest } from './_lib/auth.js';

let cachedPricingAndBank: { data: any; expiry: number } | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  try {
    const prismaModule = await import('./_lib/prisma.js');
    const prisma = prismaModule.prisma;

    // 1. Lấy thông tin cấu hình tài khoản ngân hàng & bảng giá các gói (Cached 60s)
    if (action === 'pricing-and-bank' && req.method === 'GET') {
      const now = Date.now();
      if (cachedPricingAndBank && cachedPricingAndBank.expiry > now) {
        return res.status(200).json(cachedPricingAndBank.data);
      }
      const settings = await prisma.setting.findMany({
        where: {
          key: {
            in: [
              'bankId',
              'bankAccountNo',
              'bankAccountName',
              'price_90d',
              'price_180d',
              'price_365d',
              'price_lifetime'
            ]
          }
        }
      });

      const config: Record<string, string> = {};
      settings.forEach((s: any) => {
        config[s.key] = s.value;
      });

      // Bảng giá mặc định nếu admin chưa cấu hình
      const plans = [
        {
          key: 'plan_90d',
          days: 90,
          title: 'Gói 90 Ngày (3 Tháng)',
          description: 'Truy cập đầy đủ toàn bộ tính năng và tiện ích giảng dạy',
          price: parseInt(config.price_90d || '99000', 10),
          popular: false
        },
        {
          key: 'plan_180d',
          days: 180,
          title: 'Gói 180 Ngày (6 Tháng)',
          description: 'Tiết kiệm hơn, phù hợp một học kỳ giảng dạy liên tục',
          price: parseInt(config.price_180d || '180000', 10),
          popular: false
        },
        {
          key: 'plan_365d',
          days: 365,
          title: 'Gói 365 Ngày (1 Năm)',
          description: 'Lựa chọn phổ biến nhất cho giáo viên & giảng viên trọn năm học',
          price: parseInt(config.price_365d || '299000', 10),
          popular: true
        },
        {
          key: 'plan_lifetime',
          days: 99999,
          title: 'Gói Vĩnh Viễn (Lifetime)',
          description: 'Sử dụng trọn đời, cập nhật miễn phí tất cả tính năng mới trong tương lai',
          price: parseInt(config.price_lifetime || '699000', 10),
          popular: false
        }
      ];

      const responseData = {
        bank: {
          bankId: config.bankId || 'MB',
          bankAccountNo: config.bankAccountNo || '0988888888',
          bankAccountName: config.bankAccountName || 'NGUYEN VAN LUYEN'
        },
        plans
      };

      cachedPricingAndBank = {
        data: responseData,
        expiry: now + 60 * 1000 // Cache 60s
      };

      return res.status(200).json(responseData);
    }

    // 2. Lấy thông tin hạn dùng của User hiện tại & lịch sử đơn hàng
    if (action === 'my-subscription' && req.method === 'GET') {
      const user = requireAuth(req);
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          subscriptionPlan: true,
          subscriptionExpiresAt: true,
          isLifetime: true
        }
      });

      if (!dbUser) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      // Lấy danh sách các đơn gia hạn gần đây của user
      const orders = await prisma.subscriptionOrder.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // Tính số ngày còn lại
      let remainingDays = 0;
      let isExpired = false;

      if (dbUser.role === 'ADMIN' || dbUser.isLifetime) {
        remainingDays = 99999;
        isExpired = false;
      } else if (dbUser.subscriptionExpiresAt) {
        const diffMs = new Date(dbUser.subscriptionExpiresAt).getTime() - Date.now();
        remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (remainingDays <= 0) {
          remainingDays = 0;
          isExpired = true;
        }
      } else {
        isExpired = true;
      }

      return res.status(200).json({
        user: dbUser,
        remainingDays,
        isExpired,
        orders
      });
    }

    // 3. Tạo yêu cầu gia hạn (Tạo đơn chuyển khoản & lấy mã VietQR)
    if (action === 'create-order' && req.method === 'POST') {
      const user = requireAuth(req);
      const { planKey } = req.body;

      if (!planKey) {
        return res.status(400).json({ message: 'Vui lòng chọn gói gia hạn' });
      }

      // Đọc cấu hình ngân hàng & giá
      const settings = await prisma.setting.findMany({
        where: {
          key: {
            in: [
              'bankId',
              'bankAccountNo',
              'bankAccountName',
              'price_90d',
              'price_180d',
              'price_365d',
              'price_lifetime'
            ]
          }
        }
      });

      const config: Record<string, string> = {};
      settings.forEach((s: any) => {
        config[s.key] = s.value;
      });

      const bankId = config.bankId || 'MB';
      const bankAccountNo = config.bankAccountNo || '0988888888';
      const bankAccountName = config.bankAccountName || 'NGUYEN VAN LUYEN';

      const planMap: Record<string, { days: number; title: string; defaultPrice: number }> = {
        plan_90d: { days: 90, title: 'Gói 90 Ngày (3 Tháng)', defaultPrice: 99000 },
        plan_180d: { days: 180, title: 'Gói 180 Ngày (6 Tháng)', defaultPrice: 180000 },
        plan_365d: { days: 365, title: 'Gói 365 Ngày (1 Năm)', defaultPrice: 299000 },
        plan_lifetime: { days: 99999, title: 'Gói Vĩnh Viễn (Lifetime)', defaultPrice: 699000 }
      };

      const selectedPlan = planMap[planKey];
      if (!selectedPlan) {
        return res.status(400).json({ message: 'Gói không hợp lệ' });
      }

      const amount = parseInt(config[planKey.replace('plan_', 'price_')] || String(selectedPlan.defaultPrice), 10);

      // Tạo mã chuyển khoản độc nhất: GH + 6 số ngẫu nhiên
      const randDigits = Math.floor(100000 + Math.random() * 900000);
      const transferCode = `GH${randDigits}`;

      const order = await prisma.subscriptionOrder.create({
        data: {
          userId: user.userId,
          planKey,
          planDays: selectedPlan.days,
          planTitle: selectedPlan.title,
          amount,
          transferCode,
          status: 'PENDING'
        }
      });

      // Gửi email thông báo cho Admin (bất đồng bộ để không chặn phản hồi của user)
      (async () => {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { email: true, name: true }
          });
          if (dbUser) {
            const { sendNewOrderAdminNotification } = await import('./_lib/email.js');
            await sendNewOrderAdminNotification(order, dbUser);
          }
        } catch (err: any) {
          console.error('Lỗi khi kích hoạt gửi email thông báo đơn mới:', err.message);
        }
      })();

      // Tạo link VietQR chuẩn QuickLink
      const encodedContent = encodeURIComponent(transferCode);
      const encodedAccountName = encodeURIComponent(bankAccountName);
      const qrUrl = `https://img.vietqr.io/image/${bankId}-${bankAccountNo}-compact2.png?amount=${amount}&addInfo=${encodedContent}&accountName=${encodedAccountName}`;

      return res.status(201).json({
        message: 'Tạo đơn gia hạn thành công',
        order,
        bank: {
          bankId,
          bankAccountNo,
          bankAccountName
        },
        qrUrl
      });
    }

    // 4. Kiểm tra và gửi email cảnh báo hết hạn (trước 20 ngày, trước 10 ngày, và ngày hết hạn)
    if (action === 'check-expirations') {
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

      const { sendExpirationWarningEmail } = await import('./_lib/email.js');
      let sentCount = 0;

      for (const u of users) {
        if (!u.subscriptionExpiresAt) continue;
        const diffMs = new Date(u.subscriptionExpiresAt).getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Kiểm tra đúng mốc 20 ngày, 10 ngày hoặc 0 ngày (đã hết hạn)
        if (diffDays === 20 || diffDays === 10 || diffDays === 0) {
          // Lưu tracking vào Setting để không gửi trùng lặp trong ngày
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
            sentCount++;
          }
        }
      }

      return res.status(200).json({
        message: `Đã kiểm tra thời hạn và gửi ${sentCount} email cảnh báo.`,
        sentCount
      });
    }

    return res.status(404).json({ message: 'Action not found' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    console.error('Subscription API Error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi máy chủ' });
  }
}

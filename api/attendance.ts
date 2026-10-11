import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

/**
 * Tính khoảng cách giữa 2 tọa độ GPS theo công thức Haversine (trả về mét)
 */
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Bán kính Trái Đất (mét)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Tạo token HMAC động dựa trên secretKey và time-window (chu kỳ)
 */
function generateDynamicToken(secretKey: string, periodSeconds: number, windowOffset = 0): { token: string; expiresAt: number } {
  const now = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(now / periodSeconds) + windowOffset;
  const token = crypto
    .createHmac('sha256', secretKey)
    .update(`step:${timeStep}`)
    .digest('hex')
    .substring(0, 16);
  const expiresAt = (timeStep + 1) * periodSeconds * 1000;
  return { token, expiresAt };
}

/**
 * Xác thực token: chấp nhận cửa sổ hiện tại và cửa sổ trước đó để bù độ trễ mạng
 */
function verifyDynamicToken(secretKey: string, periodSeconds: number, clientToken: string): boolean {
  if (!clientToken || !secretKey) return false;
  const current = generateDynamicToken(secretKey, periodSeconds, 0).token;
  const prev = generateDynamicToken(secretKey, periodSeconds, -1).token;
  const next = generateDynamicToken(secretKey, periodSeconds, 1).token;
  return clientToken === current || clientToken === prev || clientToken === next;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query?.action || (req as any).params?.action;
  const { prisma } = await import('./_lib/prisma.js');

  try {
    // -------------------------------------------------------------
    // 1. TẠO BUỔI ĐIỂM DANH MỚI (Dành cho Giảng viên)
    // -------------------------------------------------------------
    if (action === 'create-session') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      
      const { getUserFromRequest } = await import('./_lib/auth.js');
      const user = getUserFromRequest(req);
      if (!user) return res.status(401).json({ message: 'Vui lòng đăng nhập tài khoản giảng viên.' });

      const {
        title,
        className,
        requireGps,
        latitude,
        longitude,
        maxDistanceMeters,
        refreshSeconds,
        allowMultiplePerDevice
      } = req.body || {};

      if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Tiêu đề buổi điểm danh là bắt buộc' });
      }

      // Tạo mã PIN 6 số duy nhất
      let code = '';
      for (let i = 0; i < 5; i++) {
        const rand = Math.floor(100000 + Math.random() * 900000).toString();
        const existing = await prisma.attendanceSession.findUnique({ where: { code: rand } });
        if (!existing) {
          code = rand;
          break;
        }
      }
      if (!code) code = Math.floor(100000 + Math.random() * 900000).toString();

      const secretKey = crypto.randomBytes(32).toString('hex');

      const session = await prisma.attendanceSession.create({
        data: {
          userId: user.userId,
          title: title.trim(),
          className: className ? className.trim() : null,
          code,
          secretKey,
          isOpen: true,
          requireGps: Boolean(requireGps),
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          maxDistanceMeters: maxDistanceMeters ? Number(maxDistanceMeters) : 100,
          refreshSeconds: Math.max(5, Math.min(30, Number(refreshSeconds) || 8)),
          allowMultiplePerDevice: Boolean(allowMultiplePerDevice)
        }
      });

      return res.status(201).json({ success: true, session });
    }

    // -------------------------------------------------------------
    // 2. LẤY DANH SÁCH BUỔI ĐIỂM DANH CỦA GIẢNG VIÊN
    // -------------------------------------------------------------
    if (action === 'get-my-sessions') {
      const { getUserFromRequest } = await import('./_lib/auth.js');
      const user = getUserFromRequest(req);
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const sessions = await prisma.attendanceSession.findMany({
        where: { userId: user.userId },
        include: {
          _count: { select: { records: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({ success: true, sessions });
    }

    // -------------------------------------------------------------
    // 3. LẤY CHI TIẾT BUỔI ĐIỂM DANH (Bảng điểm danh & Mã QR)
    // -------------------------------------------------------------
    if (action === 'get-session-details') {
      const sessionId = req.query.sessionId as string;
      const code = req.query.code as string;

      if (!sessionId && !code) {
        return res.status(400).json({ message: 'Thiếu sessionId hoặc mã PIN code' });
      }

      const session = await prisma.attendanceSession.findFirst({
        where: sessionId ? { id: sessionId } : { code },
        include: {
          records: {
            orderBy: { checkedInAt: 'desc' }
          }
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Không tìm thấy buổi điểm danh' });
      }

      return res.status(200).json({ success: true, session });
    }

    // -------------------------------------------------------------
    // 4. LẤY MÃ DYNAMIC QR TOKEN MỚI NHẤT CHO MÁY CHIẾU GIẢNG VIÊN
    // -------------------------------------------------------------
    if (action === 'get-dynamic-qr') {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) return res.status(400).json({ message: 'Thiếu sessionId' });

      const session = await prisma.attendanceSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) return res.status(404).json({ message: 'Không tìm thấy buổi điểm danh' });
      if (!session.isOpen) return res.status(400).json({ message: 'Buổi điểm danh hiện đang khóa' });

      const { token, expiresAt } = generateDynamicToken(session.secretKey, session.refreshSeconds);

      return res.status(200).json({
        success: true,
        sessionId: session.id,
        code: session.code,
        token,
        refreshSeconds: session.refreshSeconds,
        expiresAt
      });
    }

    // -------------------------------------------------------------
    // 5. SINH VIÊN QUÉT QR VÀ GỬI THÔNG TIN ĐIỂM DANH
    // -------------------------------------------------------------
    if (action === 'check-in') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

      const {
        code,
        token,
        studentName,
        studentId,
        className,
        email,
        deviceHash,
        latitude,
        longitude
      } = req.body || {};

      if (!code || !studentName?.trim() || !studentId?.trim()) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Họ tên và Mã số sinh viên (MSSV)!' });
      }

      const session = await prisma.attendanceSession.findUnique({
        where: { code: String(code).trim() }
      });

      if (!session) {
        return res.status(404).json({ message: 'Mã phòng điểm danh không tồn tại!' });
      }

      if (!session.isOpen) {
        return res.status(403).json({ message: 'Giảng viên đã kết thúc hoặc tạm khóa buổi điểm danh này!' });
      }

      // Kiểm tra Dynamic QR Token (chống chụp ảnh mã QR gửi đi xa)
      if (token) {
        const isValidToken = verifyDynamicToken(session.secretKey, session.refreshSeconds, String(token).trim());
        if (!isValidToken) {
          return res.status(400).json({
            message: 'Mã QR đã hết hạn! Vui lòng nhìn máy chiếu và quét lại mã mới nhất đang hiển thị.'
          });
        }
      }

      // Kiểm tra GPS nếu giảng viên yêu cầu
      let distanceMeters: number | null = null;
      if (session.requireGps) {
        if (!latitude || !longitude || !session.latitude || !session.longitude) {
          return res.status(400).json({
            message: 'Buổi học yêu cầu chia sẻ vị trí GPS. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt!'
          });
        }

        distanceMeters = getDistanceMeters(
          Number(latitude),
          Number(longitude),
          session.latitude,
          session.longitude
        );

        const allowedDistance = session.maxDistanceMeters || 100;
        if (distanceMeters > allowedDistance) {
          return res.status(403).json({
            message: `Bạn đang ở cách phòng học ${distanceMeters}m (vượt quá bán kính cho phép ${allowedDistance}m). Không thể điểm danh từ xa!`
          });
        }
      }

      // Kiểm tra trùng thiết bị (Device Fingerprint) chống điểm danh hộ nếu không bật allowMultiplePerDevice
      if (!session.allowMultiplePerDevice && deviceHash) {
        const existingDevice = await prisma.attendanceRecord.findFirst({
          where: {
            sessionId: session.id,
            deviceHash: String(deviceHash),
            NOT: { studentId: String(studentId).trim() }
          }
        });
        if (existingDevice) {
          return res.status(403).json({
            message: `Thiết bị này đã được dùng để điểm danh cho sinh viên "${existingDevice.studentName}" (${existingDevice.studentId}). Mỗi thiết bị chỉ được điểm danh cho 1 sinh viên duy nhất!`
          });
        }
      }

      // Kiểm tra xem sinh viên đã điểm danh chưa
      const existingRecord = await prisma.attendanceRecord.findUnique({
        where: {
          sessionId_studentId: {
            sessionId: session.id,
            studentId: String(studentId).trim()
          }
        }
      });

      if (existingRecord) {
        return res.status(200).json({
          success: true,
          isAlreadyCheckedIn: true,
          message: `Bạn đã điểm danh thành công lúc ${new Date(existingRecord.checkedInAt).toLocaleTimeString('vi-VN')}!`,
          record: existingRecord
        });
      }

      // Ghi nhận điểm danh
      const record = await prisma.attendanceRecord.create({
        data: {
          sessionId: session.id,
          studentName: String(studentName).trim(),
          studentId: String(studentId).trim(),
          className: className ? String(className).trim() : (session.className || null),
          email: email ? String(email).trim() : null,
          deviceHash: deviceHash ? String(deviceHash) : null,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          distanceMeters,
          status: 'PRESENT'
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Điểm danh thành công! Thông tin của bạn đã được ghi nhận vào hệ thống.',
        record
      });
    }

    // -------------------------------------------------------------
    // 6. KHÓA / MỞ KHÓA HOẶC XÓA BUỔI ĐIỂM DANH
    // -------------------------------------------------------------
    if (action === 'toggle-session-status') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { sessionId, isOpen } = req.body || {};
      const updated = await prisma.attendanceSession.update({
        where: { id: sessionId },
        data: { isOpen: Boolean(isOpen) }
      });
      return res.status(200).json({ success: true, session: updated });
    }

    if (action === 'delete-session') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { sessionId } = req.body || {};
      await prisma.attendanceSession.delete({
        where: { id: sessionId }
      });
      return res.status(200).json({ success: true, message: 'Đã xóa buổi điểm danh' });
    }

    // -------------------------------------------------------------
    // 7. XÓA / ĐỔI TRẠNG THÁI 1 BẢN GHI ĐIỂM DANH
    // -------------------------------------------------------------
    if (action === 'update-record-status') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { recordId, status, note } = req.body || {};
      const record = await prisma.attendanceRecord.update({
        where: { id: recordId },
        data: {
          status: status || undefined,
          note: note !== undefined ? note : undefined
        }
      });
      return res.status(200).json({ success: true, record });
    }

    if (action === 'delete-record') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { recordId } = req.body || {};
      await prisma.attendanceRecord.delete({
        where: { id: recordId }
      });
      return res.status(200).json({ success: true, message: 'Đã xóa bản ghi' });
    }

    return res.status(404).json({ message: 'Attendance API Action Not Found' });
  } catch (error: any) {
    console.error('Attendance API Error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi xử lý điểm danh' });
  }
}

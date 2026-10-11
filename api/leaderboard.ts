import type { VercelRequest, VercelResponse } from '@vercel/node';

// Danh sách các huy hiệu mặc định của hệ thống
const DEFAULT_BADGES = [
  { code: 'speech_master', name: 'Chiến Thần Phát Biểu', description: 'Tích cực phát biểu xây dựng bài trên lớp', icon: '🎤', minPoints: 10 },
  { code: 'speed_demon', name: 'Tốc Độ Ánh Sáng', description: 'Hoàn thành bài tập hoặc trả lời nhanh nhất', icon: '⚡', minPoints: 20 },
  { code: 'top_performer', name: 'Bậc Thầy Lý Thuyết', description: 'Đạt điểm số kiểm tra hoặc thi đua xuất sắc', icon: '🏆', minPoints: 30 },
  { code: 'full_attendance', name: 'Chuyên Cần Kim Cương', description: 'Tham gia học tập đầy đủ không vắng buổi nào', icon: '🛡️', minPoints: 15 },
  { code: 'rising_star', name: 'Ngôi Sao Tiến Bộ', description: 'Có sự bứt phá và tiến bộ vượt bậc trong học tập', icon: '🌟', minPoints: 25 },
  { code: 'team_player', name: 'Đồng Đội Mẫu Mực', description: 'Hỗ trợ nhóm và đồng đội xuất sắc trong buổi học', icon: '🤝', minPoints: 15 }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query?.action || (req as any).params?.action;
  const { prisma } = await import('./_lib/prisma.js');

  try {
    // Đảm bảo các huy hiệu mặc định luôn tồn tại trong DB
    const ensureDefaultBadges = async () => {
      for (const b of DEFAULT_BADGES) {
        await prisma.badge.upsert({
          where: { code: b.code },
          update: { name: b.name, description: b.description, icon: b.icon, minPoints: b.minPoints },
          create: b
        });
      }
    };

    // -------------------------------------------------------------
    // 1. LẤY DANH SÁCH NHÓM / LỚP THI ĐUA CỦA GIẢNG VIÊN
    // -------------------------------------------------------------
    if (action === 'get-my-groups') {
      const { getUserFromRequest } = await import('./_lib/auth.js');
      const user = getUserFromRequest(req);
      if (!user) return res.status(401).json({ message: 'Vui lòng đăng nhập tài khoản giảng viên.' });

      await ensureDefaultBadges();

      const groups = await prisma.leaderboardGroup.findMany({
        where: { userId: user.userId },
        include: {
          _count: { select: { students: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({ success: true, groups });
    }

    // -------------------------------------------------------------
    // 2. TẠO NHÓM / LỚP THI ĐUA MỚI
    // -------------------------------------------------------------
    if (action === 'create-group') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

      const { getUserFromRequest } = await import('./_lib/auth.js');
      const user = getUserFromRequest(req);
      if (!user) return res.status(401).json({ message: 'Vui lòng đăng nhập tài khoản giảng viên.' });

      const { name, className, description, theme } = req.body || {};
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Tên nhóm/lớp thi đua là bắt buộc' });
      }

      const group = await prisma.leaderboardGroup.create({
        data: {
          userId: user.userId,
          name: name.trim(),
          className: className ? className.trim() : null,
          description: description ? description.trim() : null,
          theme: theme || 'default'
        }
      });

      return res.status(201).json({ success: true, group });
    }

    // -------------------------------------------------------------
    // 3. LẤY CHI TIẾT NHÓM & BẢNG XẾP HẠNG SINH VIÊN
    // -------------------------------------------------------------
    if (action === 'get-group-details') {
      const groupId = req.query.groupId as string;
      if (!groupId) return res.status(400).json({ message: 'Thiếu groupId' });

      const group = await prisma.leaderboardGroup.findUnique({
        where: { id: groupId },
        include: {
          students: {
            include: {
              badges: {
                include: { badge: true }
              },
              transactions: {
                orderBy: { createdAt: 'desc' },
                take: 10
              }
            },
            orderBy: [
              { totalPoints: 'desc' },
              { studentName: 'asc' }
            ]
          }
        }
      });

      if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm thi đua' });

      const allBadges = await prisma.badge.findMany({ orderBy: { minPoints: 'asc' } });

      return res.status(200).json({ success: true, group, badges: allBadges });
    }

    // -------------------------------------------------------------
    // 4. THÊM HỌC VIÊN HOẶC IMPORT TỪ DANH SÁCH / BUỔI ĐIỂM DANH
    // -------------------------------------------------------------
    if (action === 'add-students') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

      const { groupId, students } = req.body || {};
      if (!groupId || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ message: 'Dữ liệu học viên không hợp lệ' });
      }

      let addedCount = 0;
      for (const st of students) {
        if (!st.studentName?.trim() || !st.studentId?.trim()) continue;

        const sName = st.studentName.trim();
        const sId = st.studentId.trim();
        const cName = st.className ? st.className.trim() : null;

        await prisma.studentScore.upsert({
          where: {
            groupId_studentId: {
              groupId,
              studentId: sId
            }
          },
          update: {
            studentName: sName,
            className: cName
          },
          create: {
            groupId,
            studentName: sName,
            studentId: sId,
            className: cName,
            totalPoints: 0,
            level: 1
          }
        });
        addedCount++;
      }

      return res.status(200).json({
        success: true,
        message: `Đã nạp thành công ${addedCount} học viên vào bảng thi đua!`,
        addedCount
      });
    }

    // -------------------------------------------------------------
    // 5. CỘNG / TRỪ ĐIỂM HỌC VIÊN (QUICK POINT TRANSACTION)
    // -------------------------------------------------------------
    if (action === 'adjust-points') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

      const { studentScoreId, points, reason } = req.body || {};
      const numPoints = Number(points);

      if (!studentScoreId || isNaN(numPoints) || numPoints === 0) {
        return res.status(400).json({ message: 'Dữ liệu cộng/trừ điểm không hợp lệ' });
      }

      const reasonText = reason?.trim() || (numPoints > 0 ? 'Phát biểu đóng góp ý kiến' : 'Vi phạm nội quy lớp học');

      // Tạo transaction điểm
      const tx = await prisma.pointTransaction.create({
        data: {
          studentScoreId,
          points: numPoints,
          reason: reasonText
        }
      });

      // Cập nhật tổng điểm và tính cấp độ (level = floor(totalPoints / 10) + 1)
      const current = await prisma.studentScore.findUnique({ where: { id: studentScoreId } });
      if (!current) return res.status(404).json({ message: 'Học viên không tồn tại' });

      const newTotal = Math.max(0, current.totalPoints + numPoints);
      const newLevel = Math.max(1, Math.floor(newTotal / 10) + 1);

      const updated = await prisma.studentScore.update({
        where: { id: studentScoreId },
        data: {
          totalPoints: newTotal,
          level: newLevel,
          streak: numPoints > 0 ? current.streak + 1 : current.streak
        }
      });

      // Tự động kiểm tra và trao huy hiệu nếu đạt mốc điểm minPoints
      const badgesToAward = await prisma.badge.findMany({
        where: {
          minPoints: { lte: newTotal, gt: 0 }
        }
      });

      for (const b of badgesToAward) {
        try {
          await prisma.studentBadge.create({
            data: {
              studentScoreId,
              badgeId: b.id
            }
          });
        } catch {}
      }

      return res.status(200).json({
        success: true,
        message: numPoints > 0 ? `Đã cộng +${numPoints} điểm!` : `Đã trừ ${numPoints} điểm!`,
        studentScore: updated,
        transaction: tx
      });
    }

    // -------------------------------------------------------------
    // 6. TRAO HUY HIỆU THỦ CÔNG (AWARD BADGE)
    // -------------------------------------------------------------
    if (action === 'award-badge') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

      const { studentScoreId, badgeId } = req.body || {};
      if (!studentScoreId || !badgeId) {
        return res.status(400).json({ message: 'Thiếu thông tin học viên hoặc huy hiệu' });
      }

      const existing = await prisma.studentBadge.findUnique({
        where: {
          studentScoreId_badgeId: { studentScoreId, badgeId }
        }
      });

      if (existing) {
        return res.status(400).json({ message: 'Học viên đã nhận huy hiệu này rồi!' });
      }

      const awarded = await prisma.studentBadge.create({
        data: { studentScoreId, badgeId },
        include: { badge: true }
      });

      return res.status(201).json({
        success: true,
        message: `Đã vinh danh và trao huy hiệu "${awarded.badge.name}"!`,
        awarded
      });
    }

    // -------------------------------------------------------------
    // 7. XÓA NHÓM THI ĐUA HOẶC HỌC VIÊN
    // -------------------------------------------------------------
    if (action === 'delete-group') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { groupId } = req.body || {};
      if (!groupId) return res.status(400).json({ message: 'Thiếu groupId' });

      await prisma.leaderboardGroup.delete({ where: { id: groupId } });
      return res.status(200).json({ success: true, message: 'Đã xóa nhóm thi đua thành công!' });
    }

    if (action === 'delete-student') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { studentScoreId } = req.body || {};
      if (!studentScoreId) return res.status(400).json({ message: 'Thiếu studentScoreId' });

      await prisma.studentScore.delete({ where: { id: studentScoreId } });
      return res.status(200).json({ success: true, message: 'Đã xóa học viên khỏi nhóm!' });
    }

    return res.status(400).json({ message: 'Hành động không hợp lệ' });
  } catch (error: any) {
    console.error('Leaderboard API Error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi xử lý bảng vinh danh' });
  }
}

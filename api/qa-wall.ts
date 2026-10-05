import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './_lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // 1. TẠO PHÒNG MỚI (Dành cho Giảng viên)
    if (req.method === 'POST' && action === 'create-room') {
      const { title, subject, teacherName } = req.body || {};
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Tiêu đề buổi học/chủ đề là bắt buộc' });
      }

      // Tạo mã PIN 6 số ngẫu nhiên không trùng lặp
      let code = '';
      for (let i = 0; i < 5; i++) {
        const rand = Math.floor(100000 + Math.random() * 900000).toString();
        const existing = await prisma.qaRoom.findUnique({ where: { code: rand } });
        if (!existing) {
          code = rand;
          break;
        }
      }
      if (!code) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
      }

      const room = await prisma.qaRoom.create({
        data: {
          code,
          title: title.trim(),
          subject: subject ? String(subject).trim() : null,
          teacherName: teacherName ? String(teacherName).trim() : null,
          isOpen: true,
        },
      });

      return res.status(201).json({ success: true, room });
    }

    // 2. LẤY THÔNG TIN PHÒNG & DANH SÁCH CÂU HỎI (Cho cả Giảng viên & Sinh viên)
    if (req.method === 'GET' && action === 'get-room') {
      const code = String(req.query.code || '').trim();
      if (!code) {
        return res.status(400).json({ error: 'Mã phòng không hợp lệ' });
      }

      const room = await prisma.qaRoom.findUnique({
        where: { code },
        include: {
          questions: {
            orderBy: [
              { isPinned: 'desc' },
              { upvotes: 'desc' },
              { createdAt: 'desc' },
            ],
          },
        },
      });

      if (!room) {
        return res.status(404).json({ error: 'Không tìm thấy phòng hỏi đáp với mã này' });
      }

      return res.status(200).json({ success: true, room });
    }

    // 3. GỬI CÂU HỎI MỚI (Dành cho Sinh viên hoặc Giảng viên)
    if (req.method === 'POST' && action === 'ask-question') {
      const { code, content, authorAlias, category } = req.body || {};
      if (!code || !content || !content.trim()) {
        return res.status(400).json({ error: 'Nội dung câu hỏi không được để trống' });
      }

      const room = await prisma.qaRoom.findUnique({ where: { code: String(code).trim() } });
      if (!room) {
        return res.status(404).json({ error: 'Phòng không tồn tại' });
      }

      if (!room.isOpen) {
        return res.status(403).json({ error: 'Phòng hỏi đáp hiện đang tạm khóa nhận câu hỏi' });
      }

      const question = await prisma.qaQuestion.create({
        data: {
          roomId: room.id,
          content: String(content).trim(),
          authorAlias: authorAlias && String(authorAlias).trim() ? String(authorAlias).trim() : 'Ẩn danh',
          category: category ? String(category).trim() : 'Thắc mắc chung',
        },
      });

      return res.status(201).json({ success: true, question });
    }

    // 4. BÌNH CHỌN / UPVOTE CÂU HỎI
    if (req.method === 'POST' && action === 'upvote-question') {
      const { questionId } = req.body || {};
      if (!questionId) {
        return res.status(400).json({ error: 'Thiếu questionId' });
      }

      const updated = await prisma.qaQuestion.update({
        where: { id: String(questionId) },
        data: { upvotes: { increment: 1 } },
      });

      return res.status(200).json({ success: true, question: updated });
    }

    // 5. GIẢNG VIÊN ĐIỀU HÀNH (Đổi trạng thái: Ghim, Đã trả lời, Ghi chú, Xóa, Bật/Tắt phòng)
    if (req.method === 'POST' && action === 'manage') {
      const { type, questionId, roomId, isOpen, isPinned, isAnswered, answerNote } = req.body || {};

      if (type === 'toggle-room-open') {
        const room = await prisma.qaRoom.update({
          where: { id: String(roomId) },
          data: { isOpen: Boolean(isOpen) },
        });
        return res.status(200).json({ success: true, room });
      }

      if (type === 'toggle-pin') {
        const question = await prisma.qaQuestion.update({
          where: { id: String(questionId) },
          data: { isPinned: Boolean(isPinned) },
        });
        return res.status(200).json({ success: true, question });
      }

      if (type === 'toggle-answered') {
        const question = await prisma.qaQuestion.update({
          where: { id: String(questionId) },
          data: { 
            isAnswered: Boolean(isAnswered),
            answerNote: answerNote !== undefined ? answerNote : undefined
          },
        });
        return res.status(200).json({ success: true, question });
      }

      if (type === 'delete-question') {
        await prisma.qaQuestion.delete({
          where: { id: String(questionId) },
        });
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Hành động không hợp lệ' });
    }

    return res.status(400).json({ error: 'Không tìm thấy action' });
  } catch (error: any) {
    console.error('Lỗi API qa-wall:', error);
    return res.status(500).json({ error: error.message || 'Lỗi máy chủ nội bộ' });
  }
}

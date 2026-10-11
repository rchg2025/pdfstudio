import type { VercelRequest, VercelResponse } from '@vercel/node';

// Auto-create table LiveBattleRoom, LiveBattlePlayer, LiveBattleAnswer if not exists via SQL
let tablesEnsured = false;
async function ensureTables(prisma: any) {
  if (tablesEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LiveBattleRoom" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "pinCode" TEXT UNIQUE NOT NULL,
        "title" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'LOBBY',
        "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
        "timePerQuestion" INTEGER NOT NULL DEFAULT 20,
        "questionStartedAt" TIMESTAMP(3),
        "questions" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "settings" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LiveBattlePlayer" (
        "id" TEXT PRIMARY KEY,
        "roomId" TEXT NOT NULL,
        "nickname" TEXT NOT NULL,
        "studentId" TEXT,
        "className" TEXT,
        "avatarEmoji" TEXT NOT NULL DEFAULT '🦊',
        "totalScore" INTEGER NOT NULL DEFAULT 0,
        "streak" INTEGER NOT NULL DEFAULT 0,
        "isOnline" BOOLEAN NOT NULL DEFAULT true,
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LiveBattlePlayer_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "LiveBattleRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "LiveBattlePlayer_roomId_nickname_key" UNIQUE ("roomId", "nickname")
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LiveBattleAnswer" (
        "id" TEXT PRIMARY KEY,
        "playerId" TEXT NOT NULL,
        "questionIndex" INTEGER NOT NULL,
        "selectedOption" INTEGER NOT NULL,
        "isCorrect" BOOLEAN NOT NULL DEFAULT false,
        "timeSpentMs" INTEGER NOT NULL DEFAULT 0,
        "scoreAwarded" INTEGER NOT NULL DEFAULT 0,
        "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LiveBattleAnswer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "LiveBattlePlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "LiveBattleAnswer_playerId_questionIndex_key" UNIQUE ("playerId", "questionIndex")
      )
    `);
    tablesEnsured = true;
  } catch (e) {
    console.error('[LiveBattle] Ensure tables error:', e);
  }
}

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query?.action || (req as any).params?.action;
  const { prisma } = await import('./_lib/prisma.js');

  try {
    await ensureTables(prisma);

    // 1. TẠO PHÒNG ĐẤU TRƯỜNG (Dành cho Giảng viên / Host)
    if (action === 'create-room') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { userId, title, questions, timePerQuestion, settings } = req.body;

      if (!userId || !title) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (userId, title)' });
      }

      // Tạo mã PIN 6 số không trùng lặp
      let pinCode = generatePin();
      let exists = await (prisma as any).liveBattleRoom.findUnique({ where: { pinCode } });
      while (exists) {
        pinCode = generatePin();
        exists = await (prisma as any).liveBattleRoom.findUnique({ where: { pinCode } });
      }

      const room = await (prisma as any).liveBattleRoom.create({
        data: {
          userId,
          title,
          pinCode,
          questions: questions || [],
          timePerQuestion: Number(timePerQuestion) || 20,
          settings: settings || {},
          status: 'LOBBY',
          currentQuestionIndex: 0
        }
      });

      return res.status(200).json({ success: true, room });
    }

    // 2. LẤY DANH SÁCH PHÒNG CỦA GIẢNG VIÊN
    if (action === 'get-my-rooms') {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ message: 'Thiếu userId' });

      const rooms = await (prisma as any).liveBattleRoom.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          _count: {
            select: { players: true }
          }
        }
      });

      return res.status(200).json({ success: true, rooms });
    }

    // 3. LẤY CHI TIẾT PHÒNG CHO GIẢNG VIÊN (Host Room State)
    if (action === 'get-host-room') {
      const roomId = req.query.roomId as string;
      if (!roomId) return res.status(400).json({ message: 'Thiếu roomId' });

      const room = await (prisma as any).liveBattleRoom.findUnique({
        where: { id: roomId },
        include: {
          players: {
            orderBy: { totalScore: 'desc' },
            include: {
              answers: true
            }
          }
        }
      });

      if (!room) return res.status(404).json({ message: 'Không tìm thấy phòng' });
      return res.status(200).json({ success: true, room });
    }

    // 4. SINH VIÊN TÌM PHÒNG THEO MÃ PIN
    if (action === 'find-by-pin') {
      const pinCode = (req.query.pinCode as string)?.trim();
      if (!pinCode) return res.status(400).json({ message: 'Thiếu mã PIN' });

      const room = await (prisma as any).liveBattleRoom.findUnique({
        where: { pinCode },
        select: {
          id: true,
          pinCode: true,
          title: true,
          status: true,
          timePerQuestion: true,
          currentQuestionIndex: true
        }
      });

      if (!room) return res.status(404).json({ message: 'Không tìm thấy phòng có mã PIN này!' });
      return res.status(200).json({ success: true, room });
    }

    // 5. SINH VIÊN THAM GIA PHÒNG (JOIN ROOM)
    if (action === 'join-room') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { pinCode, nickname, studentId, className, avatarEmoji } = req.body;

      if (!pinCode || !nickname) {
        return res.status(400).json({ message: 'Vui lòng nhập Mã PIN và Biệt danh' });
      }

      const cleanPin = pinCode.trim();
      const cleanNick = nickname.trim();

      const room = await (prisma as any).liveBattleRoom.findUnique({
        where: { pinCode: cleanPin }
      });

      if (!room) {
        return res.status(404).json({ message: 'Mã PIN phòng không hợp lệ' });
      }

      // Upsert player trong phòng
      const player = await (prisma as any).liveBattlePlayer.upsert({
        where: {
          roomId_nickname: {
            roomId: room.id,
            nickname: cleanNick
          }
        },
        update: {
          studentId: studentId?.trim() || undefined,
          className: className?.trim() || undefined,
          avatarEmoji: avatarEmoji || '🦊',
          isOnline: true
        },
        create: {
          roomId: room.id,
          nickname: cleanNick,
          studentId: studentId?.trim() || null,
          className: className?.trim() || null,
          avatarEmoji: avatarEmoji || '🦊',
          totalScore: 0,
          streak: 0,
          isOnline: true
        }
      });

      return res.status(200).json({
        success: true,
        player,
        room: {
          id: room.id,
          pinCode: room.pinCode,
          title: room.title,
          status: room.status,
          currentQuestionIndex: room.currentQuestionIndex,
          timePerQuestion: room.timePerQuestion
        }
      });
    }

    // 6. CẬP NHẬT TRẠNG THÁI PHÒNG (Dành cho Giảng viên: Bắt đầu câu hỏi, Show Leaderboard, Câu tiếp theo, Kết thúc)
    if (action === 'update-room-state') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { roomId, status, currentQuestionIndex } = req.body;

      if (!roomId) return res.status(400).json({ message: 'Thiếu roomId' });

      const dataToUpdate: any = {};
      if (status) dataToUpdate.status = status;
      if (currentQuestionIndex !== undefined) {
        dataToUpdate.currentQuestionIndex = Number(currentQuestionIndex);
      }
      if (status === 'QUESTION') {
        dataToUpdate.questionStartedAt = new Date();
      }

      const updated = await (prisma as any).liveBattleRoom.update({
        where: { id: roomId },
        data: dataToUpdate
      });

      return res.status(200).json({ success: true, room: updated });
    }

    // 7. SINH VIÊN GỬI CÂU TRẢ LỜI (SUBMIT ANSWER)
    if (action === 'submit-answer') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { playerId, roomId, questionIndex, selectedOption, timeSpentMs } = req.body;

      if (!playerId || !roomId || questionIndex === undefined || selectedOption === undefined) {
        return res.status(400).json({ message: 'Thiếu dữ liệu câu trả lời' });
      }

      const room = await (prisma as any).liveBattleRoom.findUnique({
        where: { id: roomId }
      });
      if (!room) return res.status(404).json({ message: 'Phòng không tồn tại' });

      const questions = Array.isArray(room.questions) ? room.questions : [];
      const currentQ = questions[questionIndex];
      if (!currentQ) return res.status(400).json({ message: 'Câu hỏi không tồn tại' });

      const isCorrect = Number(selectedOption) === Number(currentQ.correctOption ?? currentQ.correctAnswer ?? 0);

      // Cách tính điểm tương tự Kahoot:
      // Điểm tối đa 1000 điểm. Trả lời càng nhanh điểm càng cao:
      // Score = 1000 * (1 - (timeSpent / totalTime) * 0.5)
      let scoreAwarded = 0;
      if (isCorrect) {
        const totalDurationMs = (room.timePerQuestion || 20) * 1000;
        const actualTime = Math.min(Math.max(Number(timeSpentMs) || 1000, 500), totalDurationMs);
        const speedRatio = actualTime / totalDurationMs;
        scoreAwarded = Math.round(1000 * (1 - speedRatio * 0.5));
      }

      // Lưu câu trả lời
      const answer = await (prisma as any).liveBattleAnswer.upsert({
        where: {
          playerId_questionIndex: {
            playerId,
            questionIndex: Number(questionIndex)
          }
        },
        update: {
          selectedOption: Number(selectedOption),
          isCorrect,
          timeSpentMs: Number(timeSpentMs) || 0,
          scoreAwarded
        },
        create: {
          playerId,
          questionIndex: Number(questionIndex),
          selectedOption: Number(selectedOption),
          isCorrect,
          timeSpentMs: Number(timeSpentMs) || 0,
          scoreAwarded
        }
      });

      // Cập nhật tổng điểm và chuỗi streak của người chơi
      const player = await (prisma as any).liveBattlePlayer.findUnique({ where: { id: playerId } });
      const newStreak = isCorrect ? (player?.streak || 0) + 1 : 0;
      const streakBonus = isCorrect && newStreak > 1 ? (newStreak - 1) * 50 : 0;
      const totalGain = scoreAwarded + streakBonus;

      const updatedPlayer = await (prisma as any).liveBattlePlayer.update({
        where: { id: playerId },
        data: {
          totalScore: { increment: totalGain },
          streak: newStreak
        }
      });

      return res.status(200).json({
        success: true,
        answer,
        isCorrect,
        scoreAwarded: totalGain,
        newStreak,
        totalScore: updatedPlayer.totalScore
      });
    }

    // 8. SINH VIÊN LẤY TRẠNG THÁI HIỆN TẠI (POLL ROOM STATE)
    if (action === 'get-player-room-state') {
      const roomId = req.query.roomId as string;
      const playerId = req.query.playerId as string;

      if (!roomId || !playerId) {
        return res.status(400).json({ message: 'Thiếu roomId hoặc playerId' });
      }

      const room = await (prisma as any).liveBattleRoom.findUnique({
        where: { id: roomId },
        select: {
          id: true,
          status: true,
          currentQuestionIndex: true,
          timePerQuestion: true,
          questionStartedAt: true,
          questions: true
        }
      });

      if (!room) return res.status(404).json({ message: 'Phòng không tồn tại' });

      const player = await (prisma as any).liveBattlePlayer.findUnique({
        where: { id: playerId },
        include: {
          answers: {
            where: { questionIndex: room.currentQuestionIndex }
          }
        }
      });

      // Đếm thứ hạng của player trong phòng
      const rank = await (prisma as any).liveBattlePlayer.count({
        where: {
          roomId,
          totalScore: { gt: player?.totalScore || 0 }
        }
      });

      const questions = Array.isArray(room.questions) ? room.questions : [];
      const currentQ = questions[room.currentQuestionIndex];

      return res.status(200).json({
        success: true,
        room: {
          id: room.id,
          status: room.status,
          currentQuestionIndex: room.currentQuestionIndex,
          totalQuestions: questions.length,
          timePerQuestion: room.timePerQuestion,
          questionStartedAt: room.questionStartedAt,
          // Ẩn đáp án đúng gửi về client học viên để tránh gian lận
          currentQuestion: currentQ
            ? {
                title: currentQ.title || currentQ.question,
                options: currentQ.options || [],
                image: currentQ.image
              }
            : null
        },
        player: {
          id: player?.id,
          nickname: player?.nickname,
          totalScore: player?.totalScore || 0,
          streak: player?.streak || 0,
          hasAnsweredCurrent: (player?.answers && player.answers.length > 0) || false,
          currentAnswer: player?.answers?.[0] || null,
          rank: rank + 1
        }
      });
    }

    // 9. XÓA PHÒNG ĐẤU TRƯỜNG
    if (action === 'delete-room') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { roomId } = req.body;
      if (!roomId) return res.status(400).json({ message: 'Thiếu roomId' });

      await (prisma as any).liveBattleRoom.delete({ where: { id: roomId } });
      return res.status(200).json({ success: true, message: 'Đã xóa phòng đấu trường' });
    }

    return res.status(404).json({ message: 'Không tìm thấy action API LiveBattle' });
  } catch (error: any) {
    console.error('[LiveBattle API Error]', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
}

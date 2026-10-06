import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';

const dbUrl = process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  "postgresql://neondb_owner:npg_Yvd4phsckal3@ep-quiet-king-atdwf3ey-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";

// Pool kết nối PostgreSQL an toàn cho Serverless
function getDbPool() {
  return createPool({
    connectionString: dbUrl,
  });
}

function generateCuidLike() {
  return 'c' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Auto-create tables for Quiz if not exists
async function ensureQuizTables(pool: any) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "QuizPackage" (
        id VARCHAR(64) PRIMARY KEY,
        "userId" VARCHAR(64),
        title VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        description TEXT,
        code VARCHAR(32) UNIQUE,
        "isOpen" BOOLEAN DEFAULT true,
        questions JSONB NOT NULL DEFAULT '[]'::jsonb,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "QuizSubmission" (
        id VARCHAR(64) PRIMARY KEY,
        "quizId" VARCHAR(64) NOT NULL,
        "quizTitle" VARCHAR(255),
        "studentName" VARCHAR(255) NOT NULL,
        "studentId" VARCHAR(100) NOT NULL,
        "className" VARCHAR(100),
        email VARCHAR(255),
        score NUMERIC(5,2) DEFAULT 0,
        "totalPoints" NUMERIC(5,2) DEFAULT 0,
        percentage NUMERIC(5,2) DEFAULT 0,
        passed BOOLEAN DEFAULT false,
        "timeSpentSeconds" INT DEFAULT 0,
        answers JSONB DEFAULT '{}'::jsonb,
        "submittedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (e) {
    console.error('Lỗi khởi tạo bảng Quiz:', e);
  }
}

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
  const pool = getDbPool();

  try {
    // ------------------- QA WALL ACTIONS -------------------
    // 1. TẠO PHÒNG MỚI (Dành cho Giảng viên)
    if (req.method === 'POST' && action === 'create-room') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { title, subject, teacherName } = body || {};
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Tiêu đề buổi học/chủ đề là bắt buộc' });
      }

      let code = '';
      for (let i = 0; i < 5; i++) {
        const rand = Math.floor(100000 + Math.random() * 900000).toString();
        const checkRes = await pool.query('SELECT code FROM "QaRoom" WHERE code = $1 LIMIT 1', [rand]);
        if (checkRes.rows.length === 0) {
          code = rand;
          break;
        }
      }
      if (!code) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
      }

      const id = generateCuidLike();
      const insertRes = await pool.query(
        `INSERT INTO "QaRoom" (id, code, title, subject, "teacherName", "isOpen", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [
          id,
          code,
          title.trim(),
          subject ? String(subject).trim() : null,
          teacherName ? String(teacherName).trim() : null,
          true
        ]
      );

      return res.status(201).json({ success: true, room: insertRes.rows[0] });
    }

    // 2. LẤY THÔNG TIN PHÒNG & DANH SÁCH CÂU HỎI
    if (req.method === 'GET' && action === 'get-room') {
      const { code, roomId } = req.query;
      let roomRes;
      if (code) {
        roomRes = await pool.query('SELECT * FROM "QaRoom" WHERE code = $1 LIMIT 1', [String(code)]);
      } else if (roomId) {
        roomRes = await pool.query('SELECT * FROM "QaRoom" WHERE id = $1 LIMIT 1', [String(roomId)]);
      } else {
        return res.status(400).json({ error: 'Cần cung cấp mã PIN hoặc roomId' });
      }

      if (roomRes.rows.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy phòng hỏi đáp với mã PIN này' });
      }

      const room = roomRes.rows[0];
      const questionsRes = await pool.query(
        `SELECT * FROM "QaQuestion" 
         WHERE "roomId" = $1 
         ORDER BY "isPinned" DESC, upvotes DESC, "createdAt" DESC`,
        [room.id]
      );

      return res.status(200).json({
        success: true,
        room,
        questions: questionsRes.rows
      });
    }

    // 3. SINH VIÊN GỬI CÂU HỎI
    if (req.method === 'POST' && action === 'add-question') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { code, roomId, content, authorAlias, category } = body || {};
      if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: 'Nội dung câu hỏi không được để trống' });
      }

      let roomRes;
      if (roomId) {
        roomRes = await pool.query('SELECT * FROM "QaRoom" WHERE id = $1 LIMIT 1', [String(roomId)]);
      } else if (code) {
        roomRes = await pool.query('SELECT * FROM "QaRoom" WHERE code = $1 LIMIT 1', [String(code)]);
      } else {
        return res.status(400).json({ error: 'Thiếu mã phòng hoặc roomId' });
      }

      if (roomRes.rows.length === 0) {
        return res.status(404).json({ error: 'Phòng không tồn tại' });
      }

      const room = roomRes.rows[0];
      if (!room.isOpen) {
        return res.status(403).json({ error: 'Phòng hỏi đáp hiện đang tạm khóa nhận câu hỏi' });
      }

      const id = generateCuidLike();
      const insertQ = await pool.query(
        `INSERT INTO "QaQuestion" (id, "roomId", content, "authorAlias", category, upvotes, "isAnswered", "isPinned", "createdAt")
         VALUES ($1, $2, $3, $4, $5, 0, false, false, NOW())
         RETURNING *`,
        [
          id,
          room.id,
          String(content).trim(),
          authorAlias && String(authorAlias).trim() ? String(authorAlias).trim() : 'Ẩn danh',
          category ? String(category).trim() : 'Thắc mắc chung'
        ]
      );

      return res.status(201).json({ success: true, question: insertQ.rows[0] });
    }

    // 4. BÌNH CHỌN / UPVOTE CÂU HỎI
    if (req.method === 'POST' && action === 'upvote-question') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { questionId } = body || {};
      if (!questionId) {
        return res.status(400).json({ error: 'Thiếu questionId' });
      }

      const updateRes = await pool.query(
        `UPDATE "QaQuestion" SET upvotes = upvotes + 1 WHERE id = $1 RETURNING *`,
        [String(questionId)]
      );

      return res.status(200).json({ success: true, question: updateRes.rows[0] });
    }

    // 5. GIẢNG VIÊN ĐIỀU HÀNH
    if (req.method === 'POST' && action === 'manage') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { type, questionId, roomId, isOpen, isPinned, isAnswered, answerNote } = body || {};

      if (type === 'toggle-room-open') {
        const updateRes = await pool.query(
          `UPDATE "QaRoom" SET "isOpen" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *`,
          [Boolean(isOpen), String(roomId)]
        );
        return res.status(200).json({ success: true, room: updateRes.rows[0] });
      }

      if (type === 'toggle-pin') {
        const updateRes = await pool.query(
          `UPDATE "QaQuestion" SET "isPinned" = $1 WHERE id = $2 RETURNING *`,
          [Boolean(isPinned), String(questionId)]
        );
        return res.status(200).json({ success: true, question: updateRes.rows[0] });
      }

      if (type === 'toggle-answered') {
        const updateRes = await pool.query(
          `UPDATE "QaQuestion" 
           SET "isAnswered" = $1, "answerNote" = COALESCE($2, "answerNote") 
           WHERE id = $3 RETURNING *`,
          [Boolean(isAnswered), answerNote !== undefined ? answerNote : null, String(questionId)]
        );
        return res.status(200).json({ success: true, question: updateRes.rows[0] });
      }

      if (type === 'delete-question') {
        await pool.query('DELETE FROM "QaQuestion" WHERE id = $1', [String(questionId)]);
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Hành động không hợp lệ' });
    }

    // ------------------- QUIZ ASSESSMENT ACTIONS -------------------
    await ensureQuizTables(pool);

    // 6. LẤY DANH SÁCH BỘ ĐỀ QUIZ
    if (req.method === 'GET' && action === 'get-quizzes') {
      const { userId, code, id } = req.query;
      if (id) {
        const queryRes = await pool.query('SELECT * FROM "QuizPackage" WHERE id = $1 LIMIT 1', [String(id)]);
        return res.status(200).json({ success: true, quiz: queryRes.rows[0] || null });
      }
      if (code) {
        const queryRes = await pool.query('SELECT * FROM "QuizPackage" WHERE code = $1 LIMIT 1', [String(code)]);
        return res.status(200).json({ success: true, quiz: queryRes.rows[0] || null });
      }
      let queryRes;
      if (userId) {
        queryRes = await pool.query('SELECT * FROM "QuizPackage" WHERE "userId" = $1 ORDER BY "updatedAt" DESC', [String(userId)]);
      } else {
        queryRes = await pool.query('SELECT * FROM "QuizPackage" ORDER BY "updatedAt" DESC LIMIT 50');
      }
      return res.status(200).json({ success: true, quizzes: queryRes.rows });
    }

    // 7. LƯU / CẬP NHẬT BỘ ĐỀ QUIZ
    if (req.method === 'POST' && action === 'save-quiz') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { id, userId, title, subject, description, code, isOpen, questions, settings } = body || {};
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Tiêu đề bộ đề là bắt buộc' });
      }

      const quizId = id || generateCuidLike();
      const quizCode = code || Math.floor(100000 + Math.random() * 900000).toString();

      const upsertQuery = `
        INSERT INTO "QuizPackage" (id, "userId", title, subject, description, code, "isOpen", questions, settings, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          subject = EXCLUDED.subject,
          description = EXCLUDED.description,
          "isOpen" = EXCLUDED."isOpen",
          questions = EXCLUDED.questions,
          settings = EXCLUDED.settings,
          "updatedAt" = NOW()
        RETURNING *;
      `;

      const result = await pool.query(upsertQuery, [
        quizId,
        userId || null,
        title.trim(),
        subject ? String(subject).trim() : 'Tổng hợp',
        description ? String(description).trim() : '',
        quizCode,
        isOpen !== undefined ? Boolean(isOpen) : true,
        JSON.stringify(questions || []),
        JSON.stringify(settings || {})
      ]);

      return res.status(200).json({ success: true, quiz: result.rows[0] });
    }

    // 8. XÓA BỘ ĐỀ QUIZ
    if (req.method === 'POST' && action === 'delete-quiz') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { id } = body || {};
      if (!id) return res.status(400).json({ error: 'Thiếu ID bộ đề' });
      await pool.query('DELETE FROM "QuizPackage" WHERE id = $1', [String(id)]);
      await pool.query('DELETE FROM "QuizSubmission" WHERE "quizId" = $1', [String(id)]);
      return res.status(200).json({ success: true });
    }

    // 9. NỘP BÀI THI QUIZ
    if (req.method === 'POST' && action === 'submit-exam') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { quizId, quizTitle, studentName, studentId, className, email, score, totalPoints, percentage, passed, timeSpentSeconds, answers } = body || {};
      if (!quizId || !studentName) {
        return res.status(400).json({ error: 'Thiếu thông tin nộp bài' });
      }

      const subId = generateCuidLike();
      const insertQuery = `
        INSERT INTO "QuizSubmission" (
          id, "quizId", "quizTitle", "studentName", "studentId", "className", email,
          score, "totalPoints", percentage, passed, "timeSpentSeconds", answers, "submittedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        RETURNING *;
      `;

      const result = await pool.query(insertQuery, [
        subId,
        quizId,
        quizTitle || '',
        studentName.trim(),
        studentId ? String(studentId).trim() : '',
        className ? String(className).trim() : '',
        email ? String(email).trim() : null,
        Number(score) || 0,
        Number(totalPoints) || 0,
        Number(percentage) || 0,
        Boolean(passed),
        Number(timeSpentSeconds) || 0,
        JSON.stringify(answers || {})
      ]);

      return res.status(201).json({ success: true, submission: result.rows[0] });
    }

    // 10. LẤY BÀI NỘP CỦA BỘ ĐỀ QUIZ
    if (req.method === 'GET' && action === 'get-submissions') {
      const { quizId } = req.query;
      let queryRes;
      if (quizId) {
        queryRes = await pool.query('SELECT * FROM "QuizSubmission" WHERE "quizId" = $1 ORDER BY "submittedAt" DESC', [String(quizId)]);
      } else {
        queryRes = await pool.query('SELECT * FROM "QuizSubmission" ORDER BY "submittedAt" DESC LIMIT 100');
      }
      return res.status(200).json({ success: true, submissions: queryRes.rows });
    }

    return res.status(400).json({ error: 'Không tìm thấy action' });
  } catch (error: any) {
    console.error('Lỗi API qa-wall / quiz:', error);
    return res.status(500).json({ error: error.message || 'Lỗi máy chủ nội bộ' });
  }
}

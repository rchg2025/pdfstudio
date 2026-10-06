import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';

const dbUrl = process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  "postgresql://neondb_owner:npg_Yvd4phsckal3@ep-quiet-king-atdwf3ey-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";

function getDbPool() {
  return createPool({
    connectionString: dbUrl,
  });
}

function generateCuidLike() {
  return 'qz_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Auto-create tables if they don't exist
async function ensureTables(pool: any) {
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
  await ensureTables(pool);

  try {
    // 1. LẤY DANH SÁCH BỘ ĐỀ
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

    // 2. LƯU / CẬP NHẬT BỘ ĐỀ
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

    // 3. XÓA BỘ ĐỀ
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

    // 4. SINH VIÊN NỘP BÀI THI
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

    // 5. LẤY DANH SÁCH BÀI NỘP
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

    return res.status(400).json({ error: 'Action không hợp lệ' });
  } catch (error: any) {
    console.error('Lỗi api quiz-api:', error);
    return res.status(500).json({ error: error.message || 'Lỗi server nội bộ' });
  }
}

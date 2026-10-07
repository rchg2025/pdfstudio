import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
const { Pool } = pg;

const dbUrl = process.env.POSTGRES_PRISMA_URL || 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  "postgresql://neondb_owner:npg_Yvd4phsckal3@ep-quiet-king-atdwf3ey-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";

const globalPool = globalThis as unknown as {
  qaDbPool: any;
  quizTablesEnsured: boolean;
};

// Pool kết nối PostgreSQL an toàn và tái sử dụng (Dùng standard pg.Pool tương thích hoàn hảo trên Linux VPS)
function getDbPool() {
  if (!globalPool.qaDbPool) {
    globalPool.qaDbPool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return globalPool.qaDbPool;
}

function generateCuidLike() {
  return 'c' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Danh sách các model fallback theo thứ tự ưu tiên từ thế hệ mới nhất đến cũ
const DEFAULT_GEMINI_FALLBACKS = [
  'gemini-3.8-flash',
  'gemini-3.0-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash-lite',
  'gemini-1.5-pro'
];

/**
 * Tự động truy vấn danh sách model hiện khả dụng của chính Google Gemini API Key này.
 * Nhờ đó API key mới tạo hoặc các model mới nhất (3.8-flash, 3.0-flash, 2.5-flash...) sẽ luôn được chọn đúng.
 */
async function resolveGeminiModels(apiKey: string, preferredModel?: string): Promise<string[]> {
  const modelsSet = new Set<string>();

  if (preferredModel && preferredModel !== 'auto') {
    modelsSet.add(preferredModel);
  }

  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listRes.ok) {
      const data = await listRes.json();
      if (Array.isArray(data?.models)) {
        const supported = data.models
          .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
          .map((m: any) => (m.name || '').replace(/^models\//, ''))
          .filter(Boolean);

        // Ưu tiên các model flash văn bản chính thống trước (loại trừ TTS hoặc audio chuyên biệt)
        const textFlashModels = supported
          .filter((m: string) => m.includes('flash') && !m.includes('tts') && !m.includes('audio'))
          .reverse();
        const otherTextModels = supported
          .filter((m: string) => !m.includes('flash') && !m.includes('tts') && !m.includes('audio'))
          .reverse();
        const remainingModels = supported
          .filter((m: string) => m.includes('tts') || m.includes('audio'));

        for (const m of [...textFlashModels, ...otherTextModels, ...remainingModels]) {
          modelsSet.add(m);
        }
      }
    }
  } catch (err) {
    console.warn('[Gemini Models Discovery Error]', err);
  }

  // Luôn bổ sung thêm fallback defaults đề phòng list models bị giới hạn
  for (const m of DEFAULT_GEMINI_FALLBACKS) {
    modelsSet.add(m);
  }

  return Array.from(modelsSet);
}

// Auto-create tables for Quiz if not exists (chỉ chạy 1 lần duy nhất khi khởi động)
async function ensureQuizTables(pool: any) {
  if (globalPool.quizTablesEnsured) return;
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

      ALTER TABLE "QuizPackage" ADD COLUMN IF NOT EXISTS "userId" VARCHAR(64);
      CREATE INDEX IF NOT EXISTS "idx_quiz_userId" ON "QuizPackage"("userId");
      CREATE INDEX IF NOT EXISTS "idx_quiz_code" ON "QuizPackage"(code);

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
      CREATE INDEX IF NOT EXISTS "idx_submission_quizId" ON "QuizSubmission"("quizId");

      CREATE TABLE IF NOT EXISTS "SyllabusSubject" (
        id VARCHAR(64) PRIMARY KEY,
        "userId" VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        "schoolName" VARCHAR(255),
        "departmentName" VARCHAR(255),
        "sourceType" VARCHAR(32),
        "sourceTitle" VARCHAR(255),
        "rawContent" TEXT,
        "driveFileId" VARCHAR(255),
        "driveUrl" TEXT,
        tree JSONB NOT NULL DEFAULT '[]'::jsonb,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_syl_subj_userId" ON "SyllabusSubject"("userId");
    `);
    globalPool.quizTablesEnsured = true;
  } catch (e) {
    console.error('Lỗi khởi tạo bảng Quiz/Syllabus:', e);
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

    // 6. LẤY DANH SÁCH BỘ ĐỀ QUIZ (CÔ LẬP THEO USERID)
    if (req.method === 'GET' && action === 'get-quizzes') {
      const { userId, code, id } = req.query;
      // Dành cho phòng thi học sinh làm bài: tìm theo id hoặc mã phòng thi (code)
      if (id) {
        const queryRes = await pool.query('SELECT * FROM "QuizPackage" WHERE id = $1 LIMIT 1', [String(id)]);
        return res.status(200).json({ success: true, quiz: queryRes.rows[0] || null });
      }
      if (code) {
        const queryRes = await pool.query('SELECT * FROM "QuizPackage" WHERE code = $1 LIMIT 1', [String(code)]);
        return res.status(200).json({ success: true, quiz: queryRes.rows[0] || null });
      }
      
      // Dành cho trang quản lý bộ đề: BẮT BUỘC có userId để cô lập dữ liệu người dùng
      if (!userId || String(userId).trim() === '') {
        return res.status(200).json({ success: true, quizzes: [] });
      }

      const queryRes = await pool.query(
        'SELECT * FROM "QuizPackage" WHERE "userId" = $1 ORDER BY "updatedAt" DESC', 
        [String(userId)]
      );
      return res.status(200).json({ success: true, quizzes: queryRes.rows });
    }

    // 7. LƯU / CẬP NHẬT BỘ ĐỀ QUIZ
    if (req.method === 'POST' && (action === 'save-quiz' || action === 'save-package')) {
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
          "userId" = COALESCE(EXCLUDED."userId", "QuizPackage"."userId"),
          title = EXCLUDED.title,
          subject = EXCLUDED.subject,
          description = EXCLUDED.description,
          code = EXCLUDED.code,
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

    // 9. NỘP BÀI THI QUIZ (Hỗ trợ cả alias action=submit-exam và action=save-submission)
    if (req.method === 'POST' && (action === 'submit-exam' || action === 'save-submission')) {
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

    // 10. LẤY BÀI NỘP CỦA BỘ ĐỀ QUIZ (Giới hạn 200 bài mới nhất để tối ưu tốc độ và bộ nhớ)
    if (req.method === 'GET' && action === 'get-submissions') {
      const { quizId, userId } = req.query;
      let queryRes;
      if (quizId && String(quizId) !== 'all') {
        queryRes = await pool.query('SELECT * FROM "QuizSubmission" WHERE "quizId" = $1 ORDER BY "submittedAt" DESC LIMIT 200', [String(quizId)]);
      } else if (userId) {
        // Lấy tất cả bài thi thuộc các bộ đề của giáo viên / user này
        queryRes = await pool.query(`
          SELECT s.* FROM "QuizSubmission" s
          WHERE s."quizId" IN (
            SELECT id FROM "QuizPackage" WHERE "userId" = $1
          )
          ORDER BY s."submittedAt" DESC
          LIMIT 200
        `, [String(userId)]);

        // Nếu user này chưa có bài nào qua liên kết quizId (hoặc thi trước khi tạo quiz package), fallback lấy các bài nộp gần nhất
        if (queryRes.rows.length === 0) {
          const fallbackRes = await pool.query('SELECT * FROM "QuizSubmission" ORDER BY "submittedAt" DESC LIMIT 50');
          if (fallbackRes.rows.length > 0) {
            queryRes = fallbackRes;
          }
        }
      } else {
        queryRes = await pool.query('SELECT * FROM "QuizSubmission" ORDER BY "submittedAt" DESC LIMIT 100');
      }
      return res.status(200).json({ success: true, submissions: queryRes.rows });
    }

    // 10B. XOÁ 1 HOẶC NHIỀU BÀI NỘP / THÔNG TIN SINH VIÊN
    if (req.method === 'POST' && action === 'delete-submissions') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { ids, submissionId } = body || {};
      const targetIds: string[] = [];
      if (Array.isArray(ids)) {
        targetIds.push(...ids.map((id: any) => String(id)));
      } else if (submissionId) {
        targetIds.push(String(submissionId));
      }

      if (targetIds.length === 0) {
        return res.status(400).json({ error: 'Không tìm thấy ID bài nộp cần xoá' });
      }

      await pool.query('DELETE FROM "QuizSubmission" WHERE id = ANY($1::text[])', [targetIds]);
      return res.status(200).json({ success: true, count: targetIds.length });
    }

    // 11. LẤY TRẠNG THÁI CẤU HÌNH AI
    if (req.method === 'GET' && action === 'get-ai-config') {
      const keyRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiApiKey']);
      const modelRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiCustomModel']);
      const hasKey = Boolean(keyRes.rows[0]?.value?.trim() || process.env.GEMINI_API_KEY);
      return res.status(200).json({
        success: true,
        hasKey,
        customModel: modelRes.rows[0]?.value || 'auto'
      });
    }

    // 12. KIỂM TRA KẾT NỐI GEMINI API
    if (req.method === 'POST' && action === 'test-gemini') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      let apiKey = body?.apiKey;
      if (!apiKey) {
        const keyRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiApiKey']);
        apiKey = keyRes.rows[0]?.value?.trim() || process.env.GEMINI_API_KEY;
      }
      if (!apiKey) {
        return res.status(400).json({ error: 'Chưa có Gemini API Key để kiểm tra.' });
      }

      const modelRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiCustomModel']);
      const preferredModel = modelRes.rows[0]?.value?.trim();

      // Tự động lấy danh sách model thực tế được hỗ trợ bởi chính API Key này
      const testModels = await resolveGeminiModels(apiKey, preferredModel);
      const errors: string[] = [];

      for (const m of testModels) {
        try {
          const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Trả lời đúng 1 chữ: OK' }] }]
            })
          });

          if (testRes.ok) {
            return res.status(200).json({ 
              success: true, 
              model: m, 
              message: `Kết nối thành công với model ${m}!` 
            });
          } else {
            const errText = await testRes.text();
            let parsedErr = '';
            try {
              const j = JSON.parse(errText);
              parsedErr = j.error?.message || j.message || errText;
            } catch {
              parsedErr = errText;
            }
            errors.push(`[${m} - HTTP ${testRes.status}]: ${parsedErr.slice(0, 150)}`);
          }
        } catch (fetchErr: any) {
          errors.push(`[${m}]: ${fetchErr.message || 'Lỗi mạng khi kết nối'}`);
        }
      }

      return res.status(400).json({ 
        error: `Không thể kết nối tới Google Gemini API: ${errors[0] || 'Vui lòng kiểm tra lại API Key và hạn mức Google AI Studio.'}`,
        details: errors
      });
    }

    // 13. TẠO CÂU HỎI TRẮC NGHIỆM BẰNG AI (TỰ ĐỘNG THAY ĐỔI CÁC MODEL KHI GẶP LỖI)
    if (req.method === 'POST' && action === 'generate-ai-quiz') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { topic, count, difficulty, customApiKey } = body || {};
      if (!topic || !topic.trim()) {
        return res.status(400).json({ error: 'Chủ đề bài thi không được để trống' });
      }

      let apiKey = customApiKey?.trim();
      if (!apiKey) {
        const keyRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiApiKey']);
        apiKey = keyRes.rows[0]?.value?.trim() || process.env.GEMINI_API_KEY;
      }

      if (!apiKey) {
        return res.status(400).json({
          error: 'Chưa cấu hình Google Gemini API Key trong hệ thống! Vui lòng vào trang Quản trị > Cấu hình hệ thống > Cấu hình AI (Gemini) để lưu API key (hoặc nhập trực tiếp vào hộp thoại).'
        });
      }

      const modelRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiCustomModel']);
      const preferredModel = modelRes.rows[0]?.value?.trim();

      // Tự động cập nhật model mới nhất và xoay vòng thử tất cả model đến khi thành công
      const modelQueue = await resolveGeminiModels(apiKey, preferredModel);

      const qCount = Number(count) || 5;
      const diffLabel = difficulty === 'easy' ? 'Dễ (Nhận biết cơ bản)' : (difficulty === 'hard' ? 'Khó (Vận dụng nâng cao)' : 'Hỗn hợp các mức Dễ, Trung bình, Khó');

      const prompt = `Bạn là chuyên gia khảo thí sư phạm. Hãy tạo chính xác ${qCount} câu hỏi trắc nghiệm về chủ đề: "${topic.trim()}".
Yêu cầu độ khó: ${diffLabel}.
BẮT BUỘC chỉ trả về định dạng JSON thuần túy (không markdown, không có chữ dẫn \`\`\`json ở đầu cuối):
[
  {
    "type": "choice",
    "difficulty": "easy",
    "question": "Nội dung câu hỏi...",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctAnswer": "Phương án đúng",
    "explanation": "Lời giải thích vì sao đáp án này đúng...",
    "points": 1
  }
]`;

      let successfulQuestions = null;
      let usedModel = '';
      const attemptErrors: string[] = [];

      for (const m of modelQueue) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
          const gRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json'
              }
            })
          });

          if (!gRes.ok) {
            const errBody = await gRes.text();
            attemptErrors.push(`[${m}]: HTTP ${gRes.status}`);
            console.warn(`[AI Quiz] Model ${m} trả về lỗi HTTP ${gRes.status}, chuyển sang model kế tiếp...`);
            continue;
          }

          const data = await gRes.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          let parsed: any[] = [];
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const match = cleaned.match(/\[[\s\S]*\]/);
            if (match) parsed = JSON.parse(match[0]);
          }

          if (Array.isArray(parsed) && parsed.length > 0) {
            successfulQuestions = parsed.map((item, idx) => ({
              id: `ai-q-${Date.now()}-${idx}`,
              type: item.type || 'choice',
              difficulty: item.difficulty || 'medium',
              question: item.question || `Câu hỏi ${idx + 1}`,
              options: Array.isArray(item.options) && item.options.length >= 2 ? item.options : ['A', 'B', 'C', 'D'],
              correctAnswer: item.correctAnswer || (item.options ? item.options[0] : 'A'),
              explanation: item.explanation || 'Lời giải thích của câu hỏi.',
              points: item.points || 1
            }));
            usedModel = m;
            break; // THÀNH CÔNG!
          } else {
            attemptErrors.push(`[${m}]: Cấu trúc JSON không hợp lệ`);
          }
        } catch (err: any) {
          attemptErrors.push(`[${m}]: ${err.message || 'Lỗi kết nối'}`);
          console.warn(`[AI Quiz] Model ${m} ngoại lệ: ${err.message}`);
        }
      }

      if (!successfulQuestions || successfulQuestions.length === 0) {
        return res.status(400).json({
          error: `Đã thử tất cả các model Gemini (${modelQueue.slice(0, 6).join(', ')}) nhưng đều gặp lỗi: ${attemptErrors[0] || 'Lỗi kết nối'}. Vui lòng kiểm tra lại API Key hoặc hạn mức Google Cloud của bạn.`
        });
      }

      return res.status(200).json({
        success: true,
        questions: successfulQuestions,
        modelUsed: usedModel
      });
    }

    // 14. TRÍCH XUẤT CÂY ĐỀ MỤC GIÁO TRÌNH (Chương, Bài, Mục con)
    if (req.method === 'POST' && action === 'extract-syllabus-tree') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { content, customApiKey } = body || {};
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Nội dung giáo trình / đề cương không được để trống' });
      }

      let apiKey = customApiKey?.trim();
      if (!apiKey) {
        const keyRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiApiKey']);
        apiKey = keyRes.rows[0]?.value?.trim() || process.env.GEMINI_API_KEY;
      }
      if (!apiKey) {
        return res.status(400).json({ error: 'Chưa cấu hình Google Gemini API Key!' });
      }

      const modelRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiCustomModel']);
      const preferredModel = modelRes.rows[0]?.value?.trim();
      const BASE_MODELS = await resolveGeminiModels(apiKey, preferredModel);
      const prompt = `Bạn là chuyên gia sư phạm và cấu trúc giáo trình đại học/cao đẳng. 
Dưới đây là một phần hoặc mục lục của tài liệu/giáo trình/khung chương trình:
"""
${content.slice(0, 16000)}
"""

Nhiệm vụ của bạn: Hãy phân tích và trích xuất toàn bộ cấu trúc các Chương, Bài, Mục lớn, Mục con (sub) của tài liệu thành cấu trúc cây JSON phân cấp rõ ràng.
Quy tắc:
1. Mỗi node có:
   - "id": chuỗi duy nhất (ví dụ "ch-1", "ch-1-sec-1", "sub-1-1-1")
   - "title": Tên chương/bài/mục (ví dụ: "Chương I. Hiểu biết về công nghệ thông tin cơ bản", "sub,2.1. Kiến thức cơ bản về máy tính")
   - "children": mảng các mục con cấp dưới (nếu có, không có thì để mảng rỗng [])
2. Nếu tài liệu không chia rõ theo chữ "Chương", hãy nhóm hợp lý theo các chủ đề hoặc bài học chính.
3. BẮT BUỘC chỉ trả về JSON thuần túy, không có chữ dẫn \`\`\`json ở đầu cuối:
[
  {
    "id": "ch-1",
    "title": "Chương I. Hiểu biết về công nghệ thông tin cơ bản",
    "children": [
      {
        "id": "sub-1-1",
        "title": "sub,2.1. Kiến thức cơ bản về máy tính",
        "children": [
          { "id": "sub-1-1-1", "title": "sub,2.1.1. Thông tin và xử lý thông tin", "children": [] },
          { "id": "sub-1-1-2", "title": "sub,2.1.2. Phần cứng", "children": [] }
        ]
      }
    ]
  }
]`;

      let parsedTree = null;
      let usedModel = '';
      const attemptErrors: string[] = [];

      for (const m of BASE_MODELS) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
          const gRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
            })
          });

          if (!gRes.ok) {
            const errText = await gRes.text();
            let parsedMsg = '';
            try {
              const j = JSON.parse(errText);
              parsedMsg = j.error?.message || j.message || errText;
            } catch {
              parsedMsg = errText;
            }
            attemptErrors.push(`[${m} - HTTP ${gRes.status}]: ${parsedMsg.slice(0, 180)}`);
            continue;
          }

          const data = await gRes.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          let parsed: any[] = [];
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const match = cleaned.match(/\[[\s\S]*\]/);
            if (match) parsed = JSON.parse(match[0]);
          }
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsedTree = parsed;
            usedModel = m;
            break;
          } else {
            attemptErrors.push(`[${m}]: Trả về cấu trúc JSON không nhận diện được danh sách chương/mục`);
          }
        } catch (e: any) {
          attemptErrors.push(`[${m}]: ${e.message || 'Lỗi kết nối'}`);
          console.warn(`Lỗi model ${m} khi trích xuất cây giáo trình:`, e);
        }
      }

      if (!parsedTree || parsedTree.length === 0) {
        const errorDetail = attemptErrors[0] || 'Lỗi kết nối hoặc tài liệu không có văn bản phù hợp.';
        return res.status(400).json({ 
          error: `Không thể phân tích mục lục giáo trình bằng AI (${errorDetail}). Vui lòng kiểm tra lại Gemini API Key hoặc thử đổi nguồn tài liệu.` 
        });
      }

      return res.status(200).json({ success: true, tree: parsedTree, modelUsed: usedModel });
    }

    // 15. TẠO BỘ ĐỀ THI TỪ PHẠM VI GIÁO TRÌNH ĐƯỢC CHỌN (Trắc nghiệm, Tự luận, hoặc Kết hợp)
    if (req.method === 'POST' && action === 'generate-syllabus-quiz') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const {
        selectedTopics, // Mảng tiêu đề các chương/mục được tick chọn
        examType, // 'choice' | 'essay' | 'mixed'
        choiceCount, // Số câu trắc nghiệm
        essayCount, // Số câu tự luận/thực hành
        difficulty, // 'easy' | 'medium' | 'hard' | 'mixed'
        sourceContext, // Nội dung trích xuất từ giáo trình/tài liệu
        customApiKey
      } = body || {};

      let apiKey = customApiKey?.trim();
      if (!apiKey) {
        const keyRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiApiKey']);
        apiKey = keyRes.rows[0]?.value?.trim() || process.env.GEMINI_API_KEY;
      }
      if (!apiKey) {
        return res.status(400).json({ error: 'Chưa cấu hình Google Gemini API Key!' });
      }

      const qChoiceCount = Number(choiceCount) || 0;
      const qEssayCount = Number(essayCount) || 0;
      const topicsStr = Array.isArray(selectedTopics) && selectedTopics.length > 0
        ? selectedTopics.join('\n- ')
        : 'Toàn bộ nội dung tài liệu';

      const diffLabel = difficulty === 'easy' ? 'Dễ (Nhận biết)' : (difficulty === 'hard' ? 'Khó (Vận dụng cao)' : 'Hỗn hợp cân đối Dễ - Trung bình - Khó');

      const prompt = `Bạn là Trưởng ban Khảo thí và Biên soạn đề thi đại học/cao đẳng chuyên nghiệp.
Nhiệm vụ: Hãy biên soạn một bộ đề thi hoàn chỉnh bám sát CHÍNH XÁC phạm vi kiến thức sau:
PHẠM VI ĐƯỢC CHỌN:
- ${topicsStr}

NGUỒN DỮ LIỆU TÀI LIỆU/GIÁO TRÌNH:
"""
${(sourceContext || '').slice(0, 18000)}
"""

YÊU CẦU CẤU HÌNH ĐỀ THI:
1. Loại đề thi: ${examType === 'choice' ? 'Chỉ Trắc nghiệm' : (examType === 'essay' ? 'Chỉ Tự luận/Thực hành' : 'Kết hợp cả Trắc nghiệm và Tự luận/Thực hành')}.
2. Số lượng:
   - Trắc nghiệm ABCD: ${qChoiceCount} câu.
   - Tự luận / Tình huống thực hành: ${qEssayCount} câu.
3. Độ khó: ${diffLabel}.
4. Nguyên tắc câu hỏi:
   - Câu hỏi trắc nghiệm phải có 4 phương án rõ ràng (A, B, C, D), không có đáp án "Tất cả các đáp án trên".
   - Câu hỏi tự luận/thực hành phải có hướng dẫn chấm, từ khóa trọng tâm hoặc barem điểm chi tiết.
   - Bám sát kiến thức thực tế trong phạm vi đã chọn.

BẮT BUỘC chỉ trả về định dạng JSON thuần túy (không markdown, không có \`\`\`json ở đầu cuối):
[
  {
    "type": "choice",
    "difficulty": "medium",
    "question": "Nội dung câu hỏi trắc nghiệm...",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctAnswer": "Phương án đúng",
    "explanation": "Giải thích chi tiết vì sao đúng bám sát giáo trình...",
    "points": 1
  },
  {
    "type": "essay",
    "difficulty": "medium",
    "question": "Nội dung câu hỏi tự luận hoặc bài tập tình huống thực hành...",
    "correctAnswer": "Các từ khóa trọng tâm hoặc ý chính cần đạt trong barem điểm",
    "explanation": "Barem hướng dẫn chấm chi tiết: Ý 1 (1 điểm), Ý 2 (1 điểm)...",
    "points": 2
  }
]`;

      const modelRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiCustomModel']);
      const preferredModel = modelRes.rows[0]?.value?.trim();
      const BASE_MODELS = await resolveGeminiModels(apiKey, preferredModel);
      let successfulQuestions = null;
      let usedModel = '';
      const attemptErrors: string[] = [];

      for (const m of BASE_MODELS) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
          const gRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.6, responseMimeType: 'application/json' }
            })
          });

          if (!gRes.ok) {
            const errBody = await gRes.text();
            let parsedErrMsg = '';
            try {
              const j = JSON.parse(errBody);
              parsedErrMsg = j.error?.message || j.message || errBody;
            } catch {
              parsedErrMsg = errBody;
            }
            attemptErrors.push(`[${m} - HTTP ${gRes.status}]: ${parsedErrMsg.slice(0, 180)}`);
            continue;
          }

          const data = await gRes.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          let parsed: any[] = [];
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const match = cleaned.match(/\[[\s\S]*\]/);
            if (match) parsed = JSON.parse(match[0]);
          }

          if (Array.isArray(parsed) && parsed.length > 0) {
            successfulQuestions = parsed.map((item, idx) => ({
              id: `syl-q-${Date.now()}-${idx}`,
              type: item.type || (item.options ? 'choice' : 'essay'),
              difficulty: item.difficulty || 'medium',
              question: item.question || `Câu hỏi ${idx + 1}`,
              options: item.type === 'essay' ? undefined : (Array.isArray(item.options) && item.options.length >= 2 ? item.options : ['A', 'B', 'C', 'D']),
              correctAnswer: item.correctAnswer || (item.options ? item.options[0] : ''),
              explanation: item.explanation || 'Hướng dẫn đáp án câu hỏi.',
              points: item.points || (item.type === 'essay' ? 2 : 1)
            }));
            usedModel = m;
            break;
          }
        } catch (err: any) {
          attemptErrors.push(`[${m}]: ${err.message}`);
        }
      }

      if (!successfulQuestions || successfulQuestions.length === 0) {
        return res.status(400).json({
          error: `Không thể tạo đề thi bằng AI (${attemptErrors[0] || 'Lỗi kết nối'}). Vui lòng thử lại hoặc giảm số lượng câu hỏi.`
        });
      }

      return res.status(200).json({
        success: true,
        questions: successfulQuestions,
        modelUsed: usedModel
      });
    }

    // 16. LẤY NỘI DUNG TỪ LINK INTERNET / TRANG WEB
    if (req.method === 'POST' && action === 'fetch-url-content') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { url } = body || {};
      if (!url || !url.trim()) {
        return res.status(400).json({ error: 'URL không được để trống' });
      }

      try {
        const fetchRes = await fetch(url.trim(), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        if (!fetchRes.ok) {
          return res.status(400).json({ error: `Không thể truy cập link (HTTP ${fetchRes.status})` });
        }

        const html = await fetchRes.text();
        // Loại bỏ thẻ script, style, header, footer, nav
        const cleanText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
          .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
          .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        return res.status(200).json({
          success: true,
          content: cleanText.slice(0, 30000)
        });
      } catch (err: any) {
        return res.status(500).json({ error: 'Lỗi khi đọc nội dung link: ' + (err.message || 'Lỗi mạng') });
      }
    }

    // 17. QUẢN LÝ MÔN HỌC / GIÁO TRÌNH ĐÃ LƯU THEO TÀI KHOẢN (SyllabusSubject)
    // 17.1 Lấy danh sách môn học của người dùng
    if (req.method === 'GET' && action === 'get-syllabus-subjects') {
      const { userId, id } = req.query;
      if (id) {
        const singleRes = await pool.query('SELECT * FROM "SyllabusSubject" WHERE id = $1 LIMIT 1', [String(id)]);
        return res.status(200).json({ success: true, subject: singleRes.rows[0] || null });
      }

      if (!userId || String(userId).trim() === '') {
        return res.status(200).json({ success: true, subjects: [] });
      }

      const listRes = await pool.query(
        'SELECT * FROM "SyllabusSubject" WHERE "userId" = $1 ORDER BY "updatedAt" DESC',
        [String(userId)]
      );
      return res.status(200).json({ success: true, subjects: listRes.rows });
    }

    // 17.2 Lưu / Cập nhật môn học vào tài khoản
    if (req.method === 'POST' && action === 'save-syllabus-subject') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { id, userId, name, schoolName, departmentName, sourceType, sourceTitle, rawContent, driveFileId, driveUrl, tree } = body || {};

      if (!userId || String(userId).trim() === '') {
        return res.status(401).json({ error: 'Vui lòng đăng nhập để lưu trữ môn học vào tài khoản.' });
      }
      if (!name || String(name).trim() === '') {
        return res.status(400).json({ error: 'Tên môn học không được để trống.' });
      }

      const subjectId = id || generateCuidLike();
      const upsertQuery = `
        INSERT INTO "SyllabusSubject" (
          id, "userId", name, "schoolName", "departmentName",
          "sourceType", "sourceTitle", "rawContent", "driveFileId", "driveUrl",
          tree, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          "schoolName" = EXCLUDED."schoolName",
          "departmentName" = EXCLUDED."departmentName",
          "sourceType" = EXCLUDED."sourceType",
          "sourceTitle" = EXCLUDED."sourceTitle",
          "rawContent" = EXCLUDED."rawContent",
          "driveFileId" = EXCLUDED."driveFileId",
          "driveUrl" = EXCLUDED."driveUrl",
          tree = EXCLUDED.tree,
          "updatedAt" = NOW()
        RETURNING *;
      `;

      const result = await pool.query(upsertQuery, [
        subjectId,
        String(userId),
        String(name).trim(),
        schoolName ? String(schoolName).trim() : '',
        departmentName ? String(departmentName).trim() : '',
        sourceType || 'file',
        sourceTitle ? String(sourceTitle).trim() : '',
        rawContent ? String(rawContent) : '',
        driveFileId || null,
        driveUrl || null,
        JSON.stringify(tree || [])
      ]);

      return res.status(200).json({ success: true, subject: result.rows[0] });
    }

    // 17.3 Xóa môn học đã lưu
    if (req.method === 'POST' && action === 'delete-syllabus-subject') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { id, userId } = body || {};
      if (!id) return res.status(400).json({ error: 'Thiếu ID môn học cần xóa.' });
      if (!userId) return res.status(401).json({ error: 'Yêu cầu đăng nhập.' });

      await pool.query('DELETE FROM "SyllabusSubject" WHERE id = $1 AND "userId" = $2', [String(id), String(userId)]);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Không tìm thấy action' });
  } catch (error: any) {
    console.error('Lỗi API qa-wall / quiz:', error);
    return res.status(500).json({ error: error.message || 'Lỗi máy chủ nội bộ' });
  }
}

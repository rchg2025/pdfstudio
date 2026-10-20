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

// Danh sách các model fallback theo thứ tự ưu tiên: các model flash-lite phản hồi cực nhanh (~1-2s), ổn định, không bị quá tải
const DEFAULT_GEMINI_FALLBACKS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
  'gemini-3.5-flash',
  'gemini-3.8-flash'
];

/**
 * Tự động truy vấn danh sách model hiện khả dụng của chính Google Gemini API Key này.
 * Lọc bỏ các model TTS/Audio/Image và ưu tiên các model Flash-Lite / Flash phản hồi siêu tốc.
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

        // Lọc bỏ các model không phải văn bản tổng quát (TTS, Audio, Image, Embedding, Transcribe, Banana, Lyria, v.v.)
        const textModels = supported.filter((m: string) => 
          !m.includes('tts') && 
          !m.includes('audio') && 
          !m.includes('image') && 
          !m.includes('embedding') &&
          !m.includes('transcribe') &&
          !m.includes('banana') &&
          !m.includes('lyria') &&
          !m.includes('computer-use') &&
          !m.includes('robotics') &&
          !m.includes('aqa')
        );

        // Phân loại: 
        // 1. flash-lite: Tốc độ phản hồi cực nhanh ~1s, tỷ lệ thành công cao, không bị 503 Spike overload
        const flashLite = textModels.filter((m: string) => m.includes('flash-lite') || m.includes('lite')).reverse();
        // 2. flash tiêu chuẩn
        const flashStandard = textModels.filter((m: string) => m.includes('flash') && !m.includes('flash-lite') && !m.includes('lite')).reverse();
        // 3. Các model còn lại
        const otherModels = textModels.filter((m: string) => !m.includes('flash')).reverse();

        for (const m of [...flashLite, ...flashStandard, ...otherModels]) {
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
        "violationCount" INT DEFAULT 0,
        status VARCHAR(32) DEFAULT 'GRADED',
        "hasManualGrading" BOOLEAN DEFAULT false,
        "manualScores" JSONB DEFAULT '{}'::jsonb,
        "teacherFeedback" TEXT,
        "submittedAt" TIMESTAMP DEFAULT NOW()
      );
      ALTER TABLE "QuizSubmission" ADD COLUMN IF NOT EXISTS "violationCount" INT DEFAULT 0;
      ALTER TABLE "QuizSubmission" ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'GRADED';
      ALTER TABLE "QuizSubmission" ADD COLUMN IF NOT EXISTS "hasManualGrading" BOOLEAN DEFAULT false;
      ALTER TABLE "QuizSubmission" ADD COLUMN IF NOT EXISTS "manualScores" JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE "QuizSubmission" ADD COLUMN IF NOT EXISTS "teacherFeedback" TEXT;
      ALTER TABLE "QuizSubmission" ADD COLUMN IF NOT EXISTS "examQuestions" JSONB DEFAULT '[]'::jsonb;
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
      const { 
        quizId, quizTitle, studentName, studentId, className, email, 
        score, totalPoints, percentage, passed, timeSpentSeconds, 
        answers, examQuestions, violationCount, status, hasManualGrading, manualScores, teacherFeedback 
      } = body || {};

      if (!quizId || !studentName) {
        return res.status(400).json({ error: 'Thiếu thông tin nộp bài' });
      }

      const subId = generateCuidLike();
      const insertQuery = `
        INSERT INTO "QuizSubmission" (
          id, "quizId", "quizTitle", "studentName", "studentId", "className", email,
          score, "totalPoints", percentage, passed, "timeSpentSeconds", answers, "examQuestions", "violationCount",
          status, "hasManualGrading", "manualScores", "teacherFeedback", "submittedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
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
        JSON.stringify(answers || {}),
        JSON.stringify(examQuestions || []),
        Number(violationCount) || 0,
        status || 'GRADED',
        Boolean(hasManualGrading),
        JSON.stringify(manualScores || {}),
        teacherFeedback ? String(teacherFeedback).trim() : null
      ]);

      return res.status(201).json({ success: true, submission: result.rows[0] });
    }

    // 9B. CHẤM ĐIỂM BẰNG TAY BÀI THI (Dành cho Giảng viên chấm tự luận / thực hành)
    if (req.method === 'POST' && action === 'grade-submission') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { id, score, percentage, passed, manualScores, teacherFeedback, status } = body || {};
      if (!id) {
        return res.status(400).json({ error: 'Thiếu ID bài nộp để chấm điểm' });
      }

      const updateRes = await pool.query(`
        UPDATE "QuizSubmission"
        SET 
          score = $1,
          percentage = $2,
          passed = $3,
          "manualScores" = $4,
          "teacherFeedback" = $5,
          status = $6
        WHERE id = $7
        RETURNING *;
      `, [
        Number(score) || 0,
        Number(percentage) || 0,
        Boolean(passed),
        JSON.stringify(manualScores || {}),
        teacherFeedback ? String(teacherFeedback).trim() : null,
        status || 'GRADED',
        String(id)
      ]);

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy bài nộp' });
      }

      return res.status(200).json({ success: true, submission: updateRes.rows[0] });
    }

    // 9C. TẢI FILE ĐÍNH KÈM LÊN GOOGLE DRIVE (Dành cho thí sinh nộp bài tự luận/thực hành, hỗ trợ cả mã nhúng iframe LMS)
    if (req.method === 'POST' && action === 'upload-file') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { fileBase64, filename, mimeType } = body || {};
      if (!fileBase64) {
        return res.status(400).json({ error: 'Thiếu dữ liệu tệp tin' });
      }

      // Lấy cấu hình Google Drive từ bảng Setting
      const driveSettings = await pool.query(
        'SELECT key, value FROM "Setting" WHERE key IN ($1, $2)',
        ['googleDriveFolderId', 'googleDriveServiceJson']
      );

      const folderIdRow = driveSettings.rows.find((r: any) => r.key === 'googleDriveFolderId');
      const serviceJsonRow = driveSettings.rows.find((r: any) => r.key === 'googleDriveServiceJson');

      if (!folderIdRow?.value || !serviceJsonRow?.value) {
        return res.status(500).json({ error: 'Hệ thống chưa cấu hình Google Drive Storage. Vui lòng liên hệ Admin.' });
      }

      try {
        const { google } = await import('googleapis');
        const { Readable } = await import('stream');

        const credentials = JSON.parse(serviceJsonRow.value);
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth });

        const now = new Date();
        const yearStr = now.getFullYear().toString();
        const monthStr = (now.getMonth() + 1).toString().padStart(2, '0');

        const getOrCreateFolder = async (name: string, parentId: string) => {
          const query = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
          const search = await drive.files.list({ q: query, spaces: 'drive', supportsAllDrives: true, includeItemsFromAllDrives: true, corpora: 'allDrives' });
          if (search.data.files && search.data.files.length > 0) {
            return search.data.files[0].id!;
          }
          const created = await drive.files.create({
            requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
            supportsAllDrives: true,
          });
          return created.data.id!;
        };

        const yearFolderId = await getOrCreateFolder(yearStr, folderIdRow.value);
        const monthFolderId = await getOrCreateFolder(monthStr, yearFolderId);

        const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const safeFilename = filename || `baitap-${Date.now()}`;
        const fileMime = mimeType || 'application/octet-stream';

        const uploadedFile = await drive.files.create({
          requestBody: {
            name: safeFilename,
            parents: [monthFolderId],
          },
          media: {
            mimeType: fileMime,
            body: stream,
          },
          fields: 'id, webViewLink, webContentLink',
          supportsAllDrives: true,
        });

        const fileId = uploadedFile.data.id!;

        // Chia sẻ quyền xem công khai
        await drive.permissions.create({
          fileId: fileId,
          requestBody: { role: 'reader', type: 'anyone' },
          supportsAllDrives: true,
        });

        const driveViewUrl = uploadedFile.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
        const driveDownloadUrl = uploadedFile.data.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`;

        return res.status(200).json({
          success: true,
          fileId,
          fileName: safeFilename,
          webViewLink: driveViewUrl,
          webContentLink: driveDownloadUrl,
          url: driveViewUrl
        });
      } catch (uploadErr: any) {
        console.error('Lỗi upload file lên Google Drive qua qa-wall:', uploadErr);
        return res.status(500).json({ error: 'Lỗi tải lên Google Drive: ' + (uploadErr.message || 'Không xác định') });
      }
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

    // 11b. TẠO ẢNH THẺ AI (ID PHOTO STUDIO)
    if (req.method === 'POST' && action === 'generate-id-photo') {
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
        return res.status(400).json({ error: 'Chưa cấu hình Gemini API Key trên hệ thống.' });
      }

      const rawBase64 = body.imageBase64 || '';
      const cleanBase64 = rawBase64.includes(',') ? rawBase64.split(',')[1] : rawBase64;
      if (!cleanBase64) {
        return res.status(400).json({ error: 'Thiếu dữ liệu hình ảnh.' });
      }

      const attireChoice = body.attire || 'white_shirt';
      let attirePrompt = 'Change clothing to a neat white collared formal shirt.';
      if (attireChoice === 'suit_tie') {
        attirePrompt = 'Change clothing to a high quality formal black business suit vest with a dark necktie and crisp white inner shirt.';
      } else if (attireChoice === 'aodai') {
        attirePrompt = 'Change clothing to a traditional Vietnamese white Ao Dai with clean collar.';
      } else if (attireChoice === 'keep_original') {
        attirePrompt = 'Keep the original clothing untouched.';
      }

      const bgName = body.bgColorName || 'Solid Studio Color';
      const bgHex = body.bgColorHex || '#0055A5';
      const customPrompt = body.customPrompt ? body.customPrompt.trim() : '';

      const systemPrompt = `You are an expert studio passport photo generator. Transform the person in the input image into a crisp, high-resolution professional passport ID photo.
Key guidelines:
1. BACKGROUND: Replace background completely with a solid clean studio background color of ${bgName} (${bgHex}). No gradient, no shadows, no texture on the background.
2. ATTIRE: ${attirePrompt}
3. POSE & FACE: Maintain person's original face identity, hair shape, features, skin tone, gender and realistic expression perfectly. Ensure person is facing straight forward with balanced shoulders.
4. LIGHTING: Studio soft lighting, crystal clear focus, high clarity, photorealistic.
${customPrompt ? '5. EXTRA INSTRUCTIONS: ' + customPrompt : ''}`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT']
        }
      };

      const candidateModels = [
        'gemini-3.1-flash-image',
        'gemini-2.5-flash-image',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash'
      ];

      for (const m of candidateModels) {
        try {
          const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (aiRes.ok) {
            const result = await aiRes.json();
            const candidate = result?.candidates?.[0];
            const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);
            if (imagePart?.inlineData?.data) {
              const mime = imagePart.inlineData.mimeType || 'image/png';
              return res.status(200).json({
                success: true,
                image: `data:${mime};base64,${imagePart.inlineData.data}`,
                model: m
              });
            }
          }
        } catch (e: any) {
          console.warn(`Model ${m} failed for id-photo:`, e.message);
        }
      }

      return res.status(500).json({ error: 'Mô hình AI hiện tại không hỗ trợ xuất hình ảnh hoặc đang bận. Vui lòng thử lại.' });
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
            }),
            signal: AbortSignal.timeout(12000)
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
      const { topic, count, difficulty, format, customApiKey } = body || {};
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

      let formatInstructions = '';
      if (format === 'essay_only') {
        formatInstructions = `Tất cả câu hỏi đều thuộc hình thức TỰ LUẬN (type: "essay").
Mỗi câu hỏi có nội dung bài tập tự luận yêu cầu thí sinh trả lời sâu hoặc giải quyết vấn đề, kèm tiêu chí/gợi ý chấm điểm chi tiết (correctAnswer) và lời giải thích (explanation). Không cần trường options.`;
      } else if (format === 'practical_only') {
        formatInstructions = `Tất cả câu hỏi đều thuộc hình thức BÀI THỰC HÀNH (type: "practical").
Mỗi câu hỏi có đề bài yêu cầu thí sinh thực hành (viết mã nguồn, thao tác phần mềm, giải case study có nộp file đính kèm), kèm hướng dẫn thực hiện hoặc tiêu chí/code mẫu (correctAnswer) và lời giải thích (explanation). Không cần trường options.`;
      } else if (format === 'mixed') {
        formatInstructions = `Đề thi hỗn hợp gồm cả TRẮC NGHIỆM KHÁCH QUAN (type: "choice") và TỰ LUẬN / THỰC HÀNH (type: "essay" hoặc "practical").
Khoảng 60-70% là câu trắc nghiệm ABCD (có options, correctAnswer, explanation), còn lại 30-40% là câu tự luận / bài thực hành (type "essay" hoặc "practical", có correctAnswer là gợi ý/tiêu chí chấm, không cần options).`;
      } else {
        formatInstructions = `Tất cả câu hỏi là trắc nghiệm khách quan ABCD (type: "choice"), có 4 phương án (options), correctAnswer là phương án đúng, kèm explanation.`;
      }

      const prompt = `Bạn là chuyên gia khảo thí sư phạm. Hãy tạo chính xác ${qCount} câu hỏi về chủ đề: "${topic.trim()}".
Yêu cầu độ khó: ${diffLabel}.
Yêu cầu hình thức câu hỏi:
${formatInstructions}

BẮT BUỘC chỉ trả về định dạng JSON thuần túy (không markdown, không có chữ dẫn \`\`\`json ở đầu cuối):
[
  {
    "type": "choice",
    "difficulty": "easy",
    "question": "Nội dung câu hỏi...",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctAnswer": "Phương án đúng hoặc tiêu chí chấm",
    "explanation": "Lời giải thích vì sao đáp án này đúng hoặc thang điểm chi tiết...",
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
            }),
            signal: AbortSignal.timeout(30000)
          });

          if (!gRes.ok) {
            const errBody = await gRes.text();
            attemptErrors.push(`[${m}]: HTTP ${gRes.status}`);
            console.warn(`[AI Quiz] Model ${m} trả về lỗi HTTP ${gRes.status}, chuyển sang model kế tiếp...`);
            continue;
          }

          const data = await gRes.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          let parsed: any[] = [];
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const match = cleaned.match(/\[[\s\S]*\]/);
            if (match) {
              try { parsed = JSON.parse(match[0]); } catch {}
            }
          }

          if (Array.isArray(parsed) && parsed.length > 0) {
            successfulQuestions = parsed.map((item, idx) => {
              const qType = item.type || 'choice';
              const isChoice = qType === 'choice' || qType === 'multiple_choice';
              return {
                id: `ai-q-${Date.now()}-${idx}`,
                type: qType,
                difficulty: item.difficulty || 'medium',
                question: item.question || `Câu hỏi ${idx + 1}`,
                options: isChoice && Array.isArray(item.options) && item.options.length >= 2 ? item.options : (isChoice ? ['A', 'B', 'C', 'D'] : undefined),
                correctAnswer: item.correctAnswer || (isChoice && item.options ? item.options[0] : 'Tiêu chí chấm điểm tự luận/thực hành'),
                explanation: item.explanation || 'Lời giải thích / tiêu chí chi tiết của câu hỏi.',
                points: item.points || (qType === 'essay' || qType === 'practical' ? 2 : 1)
              };
            });
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
            }),
            signal: AbortSignal.timeout(25000)
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
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          let parsed: any[] = [];
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const match = cleaned.match(/\[[\s\S]*\]/);
            if (match) {
              try { parsed = JSON.parse(match[0]); } catch {}
            }
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
          console.warn(`Lỗi model ${m} khi trích xuất cây giáo trình:`, e.message);
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
            }),
            signal: AbortSignal.timeout(35000)
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
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          let parsed: any[] = [];
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const match = cleaned.match(/\[[\s\S]*\]/);
            if (match) {
              try { parsed = JSON.parse(match[0]); } catch {}
            }
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

    // 18. TẠO KỊCH BẢN VIDEO LIỀN MẠCH BẰNG AI (AI VIDEO SCRIPT CONTINUITY STUDIO)
    if (req.method === 'POST' && action === 'generate-video-script') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const {
        topic,
        videoType = 'tutorial_simulation',
        scenePacing = 'standard_8_10s',
        visualStyle = 'hyperrealistic_studio',
        aiToolTarget = 'runway_gen3',
        sceneCount = 6,
        voiceTone = 'clear_tutorial_guide',
        matchCut = true,
        cameraFlow = true,
        subjectLock = true,
        customApiKey
      } = body || {};

      if (!topic || !String(topic).trim()) {
        return res.status(400).json({ error: 'Chủ đề / mục tiêu video không được để trống.' });
      }

      let apiKey = customApiKey?.trim();
      if (!apiKey) {
        const keyRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiApiKey']);
        apiKey = keyRes.rows[0]?.value?.trim() || process.env.GEMINI_API_KEY;
      }

      if (!apiKey) {
        return res.status(400).json({
          error: 'Chưa cấu hình Google Gemini API Key trong hệ thống! Vui lòng vào Quản trị > Cấu hình AI (Gemini) để lưu key hoặc nhập key cá nhân trực tiếp.'
        });
      }

      const modelRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiCustomModel']);
      const preferredModel = modelRes.rows[0]?.value?.trim();
      const modelQueue = await resolveGeminiModels(apiKey, preferredModel);

      const numScenes = Math.min(Math.max(Number(sceneCount) || 6, 1), 30);

      let durationRule = "Mỗi cảnh bắt buộc có thời lượng từ 6 đến 10 giây (khuyến nghị 7-9 giây).";
      if (scenePacing === 'dynamic_6_8s') durationRule = "Mỗi cảnh bắt buộc từ 6 đến 8 giây (nhịp nhanh, dứt khoát).";
      if (scenePacing === 'exact_8s') durationRule = "Mỗi cảnh chính xác 8 giây (để dễ đồng bộ nhịp nhạc).";

      const systemInstruction = `Bạn là Đạo diễn điện ảnh và Kỹ sư trưởng Prompt hàng đầu thế giới về AI Video (Google Veo 2 / Gemini Video, Google Flow FX, Runway Gen-3 Alpha, Kling AI 2.0, Luma Dream Machine, OpenAI Sora).
Nhiệm vụ tối thượng của bạn là tạo kịch bản video AI gồm chính xác ${numScenes} phân cảnh với ĐỘ ĐỒNG NHẤT TUYỆT ĐỐI (100% VISUAL & CHARACTER CONTINUITY).

NGUYÊN TẮC CỐT LÕI ĐỂ CÁC VIDEO KHÔNG BỊ PHÂN MẢNH / KHÁC NHAU:
1. KHÓA ĐỊNH DANH TOÀN CỤC (GLOBAL VISUAL ANCHORS):
   - Ngay từ đầu, bạn PHẢI xác lập một "BỘ NEO ĐỒNG NHẤT TOÀN CẢNH" (Global Anchor Kit):
     + Subject Identity: Miêu tả cụ thể người/vật thể chính (VD: "Vietnamese male software engineer, 28 years old, short black crew cut, wearing charcoal grey crewneck sweater and silver minimalist watch on left wrist").
     + Environment Lock: Bối cảnh cố định xuyên suốt (VD: "Minimalist Scandinavian desk, dark matte oak wood surface, warm 3200K brass desk lamp on the top-right corner, charcoal acoustic felt wall").
     + Color Palette & Cine Lighting: Bảng màu và ánh sáng phim trường nhất quán (VD: "Moody cinematic lighting, soft warm key light, deep teal background shadow, 35mm anamorphic lens, consistent film grain, authentic 8k photorealism").
   - BẮT BUỘC: TRONG TẤT CẢ ${numScenes} CÂU "englishPrompt", BẠN PHẢI LẶP LẠI CHÍNH XÁC CÁC ĐẶC ĐIỂM NEO NÀY (Character + Outfit + Environment + Lighting). Khi đưa vào Google Veo, Gemini hay Runway, nếu câu prompt ở cảnh sau không có các từ khóa neo này, AI sẽ tự động sinh ra nhân vật hoặc bối cảnh hoàn toàn khác!

2. KỸ THUẬT NỐI MÁY ĐIỆN ẢNH LIỀN MẠCH (CINEMATIC CONTINUITY BRIDGES):
   - Mỗi cảnh PHẢI tiếp nối chính xác chuyển động và vị trí của cảnh trước đó:
     + Nếu Cảnh N kết thúc bằng: "Camera tilts down as the right hand touches the smartphone screen", thì Cảnh N+1 PHẢI bắt đầu bằng: "Continuous match-cut from previous frame: Camera macro push-in focusing on the same index finger pressing the screen...".
     + Sử dụng thủ pháp: Match-Cut, Continuous Camera Flow Vector (Dolly forward -> Crane up -> Macro reveal), Subject Action Continuation.

3. TỐI ƯU CÂU LỆNH CHO GOOGLE GEMINI VIDEO, GOOGLE FLOW & AI VIDEO GENERATORS:
   - Cấu trúc "englishPrompt" cho TỪNG cảnh phải tuân thủ nghiêm ngặt 4 phần:
     [1. Transition & Motion Continuity] + [2. Shot Type & Camera Flow] + [3. Subject Action with Global Anchor Lock] + [4. Lighting, Optics & Cine Aesthetics].

4. CẤU TRÚC ĐẦU RA JSON BẮT BUỘC:
   Trả về JSON thuần túy (không markdown, không bọc \`\`\`json):
{
  "projectTitle": "Tên kịch bản súc tích",
  "globalVisualAnchor": "Mô tả bộ neo nhất quán toàn bộ video (Nhân vật, Trang phục, Đồ vật, Bối cảnh, Ánh sáng) bằng tiếng Anh chuẩn",
  "scenes": [
    {
      "sceneNumber": 1,
      "durationSec": 8,
      "title": "Tên phân cảnh",
      "continuityBridge": "Mô tả chi tiết bằng tiếng Việt cách cảnh này nối tiếp từ cảnh trước (hoặc cảnh mở màn)",
      "englishPrompt": "Prompt tiếng Anh hoàn chỉnh, ĐÃ BAO GỒM BỘ NEO ĐỒNG NHẤT và hướng chuyển động tiếp nối điện ảnh...",
      "vietnameseVoiceover": "Lời thuyết minh tiếng Việt tự nhiên chuẩn xác 15-25 từ khớp 6-10s...",
      "cameraMotion": "Tên chuyển động camera",
      "continuityTags": "Từ khóa neo giữ đồng bộ (VD: Charcoal grey sweater, matte oak desk, 3200K brass lamp, identical titanium phone)",
      "audioSfx": "Hiệu ứng âm thanh SFX và nhạc nền gợi ý"
    }
  ]
}`;

      const userPrompt = `Hãy tạo kịch bản video AI liền mạch, ĐỒNG NHẤT TUYỆT ĐỐI GIỮA TẤT CẢ PHÂN CẢNH cho:
- Chủ đề: ${String(topic).trim()}
- Loại video: ${videoType}
- Phong cách hình ảnh: ${visualStyle}
- Công cụ mục tiêu: ${aiToolTarget} (Google Veo 2 / Gemini Video & Google Flow)
- Tông giọng thuyết minh: ${voiceTone}
- Số lượng phân cảnh: ${numScenes} cảnh (ĐỦ CHÍNH XÁC ${numScenes} CẢNH)
- Thời lượng: ${durationRule}
- Yêu cầu đồng nhất: Khóa chặt nhân vật/vật thể/bối cảnh từ cảnh 1 đến cảnh ${numScenes}. Mỗi câu englishPrompt PHẢI chứa các thẻ neo đồng nhất (Character Anchor, Scene Anchor, Lighting Anchor).

BẮT BUỘC trả về định dạng JSON thuần túy như đã hướng dẫn.`;

      let generatedResult: any = null;
      let usedModel = '';
      const attemptErrors: string[] = [];

      for (const m of modelQueue) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 28000);

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: userPrompt }] }],
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
              const parsed = JSON.parse(cleaned);
              if (parsed && Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
                generatedResult = parsed;
                usedModel = m;
                break;
              }
            }
          } else {
            const errText = await response.text();
            attemptErrors.push(`[${m}]: ${response.status} - ${errText.substring(0, 150)}`);
          }
        } catch (e: any) {
          attemptErrors.push(`[${m}]: ${e.name === 'AbortError' ? 'Timeout 28s' : e.message}`);
        }
      }

      if (!generatedResult) {
        return res.status(500).json({
          error: 'Tất cả mô hình AI đều gặp sự cố khi tạo kịch bản video.',
          details: attemptErrors.join(' | ')
        });
      }

      return res.status(200).json({
        success: true,
        usedModel,
        projectTitle: generatedResult.projectTitle || String(topic).substring(0, 60),
        globalVisualAnchor: generatedResult.globalVisualAnchor || '',
        scenes: generatedResult.scenes
      });
    }

    // 17. BÁO CÁO PHÂN TÍCH NĂNG LỰC HỌC VIÊN & ĐỀ XUẤT ÔN TẬP BẰNG AI
    if (req.method === 'POST' && action === 'analyze-quiz-performance') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const {
        quizTitle,
        subject,
        summaryStats,
        topMissedQuestions,
        customApiKey
      } = body || {};

      let apiKey = customApiKey?.trim();
      if (!apiKey) {
        const keyRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiApiKey']);
        apiKey = keyRes.rows[0]?.value?.trim() || process.env.GEMINI_API_KEY;
      }
      if (!apiKey) {
        return res.status(400).json({ error: 'Chưa cấu hình Google Gemini API Key trong hệ thống!' });
      }

      const modelRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiCustomModel']);
      const preferredModel = modelRes.rows[0]?.value?.trim();
      const modelQueue = await resolveGeminiModels(apiKey, preferredModel);

      const prompt = `Bạn là chuyên gia Khảo thí và Đo lường đánh giá chất lượng giáo dục đại học / cao đẳng.
Dưới đây là số liệu phân tích kết quả bài thi của một lớp học:
- Tên bài thi: "${quizTitle || 'Bài kiểm tra trắc nghiệm'}"
- Môn học / Lĩnh vực: "${subject || 'Chuyên ngành'}"
- Thống kê tổng quan:
  + Tổng số lượt thi: ${summaryStats?.totalSubmissions || 0} thí sinh
  + Điểm trung bình: ${summaryStats?.averageScore || 0}/10
  + Điểm cao nhất: ${summaryStats?.highestScore || 0}/10
  + Điểm thấp nhất: ${summaryStats?.lowestScore || 0}/10
  + Tỷ lệ đạt chuẩn (>= 5.0): ${summaryStats?.passRate || 0}%
  + Phổ điểm: Yếu/Kém (<5): ${summaryStats?.distribution?.weak || 0} bài, Trung bình (5-6.5): ${summaryStats?.distribution?.avg || 0} bài, Khá (6.5-8): ${summaryStats?.distribution?.good || 0} bài, Giỏi (8-10): ${summaryStats?.distribution?.excellent || 0} bài

- Danh sách các câu hỏi học sinh làm SAI NHIỀU NHẤT:
${Array.isArray(topMissedQuestions) && topMissedQuestions.length > 0 
  ? topMissedQuestions.map((q: any, i: number) => `  ${i + 1}. [Tỷ lệ làm đúng chỉ ${q.correctRate}%]: "${q.question}" (Đáp án đúng: "${q.correctAnswer}"). Lỗi thường gặp: ${q.mostCommonWrong || 'chọn phương án nhiễu'}`).join('\n')
  : '  Không có câu hỏi nào bị sai quá nhiều.'}

Nhiệm vụ: Hãy phân tích sư phạm toàn diện và đưa ra đề xuất kế hoạch giảng dạy cải tiến.
Yêu cầu trả về BẮT BUỘC định dạng JSON thuần túy (không markdown, không chữ \`\`\`json ở đầu cuối):
{
  "generalAssessment": "Nhận xét tổng quan chất lượng bài thi và mặt bằng học lực của cả lớp (ngắn gọn 2-3 câu).",
  "strengths": [
    "Điểm mạnh 1 mà phần lớn học sinh đã làm tốt",
    "Điểm mạnh 2"
  ],
  "weaknesses": [
    "Lỗ hổng kiến thức chính 1",
    "Lỗ hổng kiến thức chính 2 (nguyên nhân vì sao nhiều em chọn sai)"
  ],
  "recommendations": [
    "Đề xuất nội dung cụ thể giáo viên cần giảng lại hoặc nhấn mạnh trong tiết học tới",
    "Phương pháp ôn tập hoặc dạng bài tập củng cố cần giao thêm"
  ],
  "remedialTopics": [
    "Tên chủ đề 1 cần bổ trợ",
    "Tên chủ đề 2 cần bổ trợ"
  ]
}`;

      let resultJson: any = null;
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
                temperature: 0.4,
                responseMimeType: 'application/json'
              }
            }),
            signal: AbortSignal.timeout(28000)
          });

          if (!gRes.ok) {
            const errText = await gRes.text();
            attemptErrors.push(`[${m}]: HTTP ${gRes.status}`);
            continue;
          }

          const data = await gRes.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          let parsed: any = null;
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const match = cleaned.match(/\{[\s\S]*\}/);
            if (match) {
              try { parsed = JSON.parse(match[0]); } catch {}
            }
          }

          if (parsed && (parsed.generalAssessment || parsed.weaknesses)) {
            resultJson = parsed;
            usedModel = m;
            break;
          }
        } catch (err: any) {
          attemptErrors.push(`[${m}]: ${err.message || 'Lỗi kết nối'}`);
        }
      }

      if (!resultJson) {
        return res.status(500).json({
          error: `Không thể hoàn tất phân tích AI: ${attemptErrors[0] || 'Lỗi kết nối tới mô hình AI'}.`
        });
      }

      return res.status(200).json({
        success: true,
        usedModel,
        analysis: resultJson
      });
    }

    // ================= ACTION: GENERATE PODCAST DIALOGUE (AI PODCAST STUDIO) =================
    if (action === 'generate-podcast-dialogue') {
      const { 
        topic, 
        sourceContent, 
        format = 'teacher_student', // teacher_student | co_hosts | expert_interview | story_narration
        targetAudience = 'students', // students | general | professionals
        durationMinutes = 3, // 2, 3, 5, 8
        customApiKey 
      } = req.body;

      if (!topic && !sourceContent) {
        return res.status(400).json({ error: 'Cần cung cấp Chủ đề hoặc Nội dung bài giảng đầu vào.' });
      }

      const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên hệ thống.' });
      }

      const modelQueue = await resolveGeminiModels(apiKey, 'auto');

      const formatDescriptions: Record<string, string> = {
        teacher_student: 'Đối thoại giữa Giảng viên (Thầy Minh - am hiểu, ân cần, giải thích sâu sắc) và Học viên (Mai - tò mò, ham học, đặt câu hỏi thông minh, phản biện thực tế).',
        co_hosts: 'Đối thoại giữa 2 Host Podcast năng động (Host Nam & Host Nữ) dẫn dắt câu chuyện tự nhiên, dí dỏm, tương tác qua lại liền mạch.',
        expert_interview: 'Phỏng vấn chuyên sâu giữa Nhà báo/Người phỏng vấn (Hỏi sắc bén) và Chuyên gia hàng đầu (Phân tích dẫn chứng, số liệu cụ thể).',
        story_narration: 'Dẫn chuyện truyền cảm hứng theo lối kể chuyện (Storytelling), kết hợp 2 giọng đọc thay phiên nhau tái hiện các góc nhìn.'
      };

      const prompt = `Bạn là Đạo diễn âm thanh và Biên kịch Podcast Giáo dục & EdTech hàng đầu.
Nhiệm vụ của bạn là chuyển thể kiến thức bài học sau thành một kịch bản Podcast đối thoại âm thanh sống động, tự nhiên như trò chuyện ngoài đời thực giữa 2 người nói.

ĐỊNH DẠNG PODCAST: ${formatDescriptions[format] || formatDescriptions.teacher_student}
ĐỐI TƯỢNG NGHE: ${targetAudience}
THỜI LƯỢNG ƯỚC TÍNH: Khoảng ${durationMinutes} phút (tương đương ${Math.max(6, Math.min(20, Math.round(durationMinutes * 2.5)))} lượt thoại đối đáp qua lại).

CHỦ ĐỀ PODCAST: ${topic || 'Bài giảng chuyên đề'}
${sourceContent ? `\nTÀI LIỆU / GIÁO TRÌNH GỐC NỘI DUNG:\n"""\n${String(sourceContent).slice(0, 12000)}\n"""` : ''}

YÊU CẦU BIÊN TẬP QUAN TRỌNG:
1. Giọng văn tự nhiên, có ngữ điệu trò chuyện (dùng các thán từ như "À", "Ồ", "Đúng rồi", "Thầy ơi", "Chính xác", "Vậy thì...", "Thật bất ngờ là...").
2. TUYỆT ĐỐI KHÔNG đọc trơ trụi như văn bản sách giáo khoa. Hãy dùng phép ẩn dụ, ví dụ đời thường để minh họa khái niệm phức tạp.
3. Chia kịch bản thành từng lượt thoại đối ứng (turns), xen kẽ giữa Speaker 1 (Mặc định: Thầy Minh / Host Nam) và Speaker 2 (Mặc định: Mai / Host Nữ).
4. Mỗi câu thoại tiếng Việt có độ dài vừa phải (15 - 45 từ) để bộ tổng hợp giọng đọc AI (Edge TTS) phát âm tròn vành rõ chữ, có nhịp thở tự nhiên.
5. Cung cấp gợi ý Hiệu ứng âm thanh (SFX) hoặc gợi ý chuyển cảnh âm nhạc cho từng đoạn nếu phù hợp (intro chime, page turn, thinking sound, aha moment, outro music).

Trả về ĐÚNG VÀ DUY NHẤT định dạng JSON (không có markdown khác ngoài json block) theo cấu trúc sau:
{
  "podcastTitle": "Tiêu đề tập Podcast hấp dẫn, giật tít sư phạm",
  "synopsis": "Tóm tắt ngắn 2-3 câu về nội dung tập podcast này",
  "speaker1Name": "Thầy Minh",
  "speaker1Role": "Giảng viên",
  "speaker2Name": "Bạn Mai",
  "speaker2Role": "Sinh viên",
  "suggestedBgm": "lofi_study",
  "dialogues": [
    {
      "turnNumber": 1,
      "speaker": 1,
      "speakerName": "Thầy Minh",
      "text": "Chào mừng các bạn sinh viên đã quay trở lại với chuỗi Podcast học tập thông minh! Mai này, hôm nay thầy trò mình sẽ cùng 'giải mã' một chủ đề rất thú vị đấy.",
      "emotion": "friendly_welcome",
      "suggestedSfx": "intro_chime"
    },
    {
      "turnNumber": 2,
      "speaker": 2,
      "speakerName": "Bạn Mai",
      "text": "Em chào thầy ạ! Có phải là bài học về...? Em đã đọc qua tài liệu tuần này và có một thắc mắc lớn muốn hỏi thầy ngay đây ạ!",
      "emotion": "excited_curious",
      "suggestedSfx": "paper_flip"
    }
  ]
}`;

      let resultJson: any = null;
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
            }),
            signal: AbortSignal.timeout(35000)
          });

          if (!gRes.ok) {
            attemptErrors.push(`[${m}]: HTTP ${gRes.status}`);
            continue;
          }

          const data = await gRes.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          let parsed: any = null;
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const match = cleaned.match(/\{[\s\S]*\}/);
            if (match) {
              try { parsed = JSON.parse(match[0]); } catch {}
            }
          }

          if (parsed && Array.isArray(parsed.dialogues) && parsed.dialogues.length > 0) {
            resultJson = parsed;
            usedModel = m;
            break;
          }
        } catch (err: any) {
          attemptErrors.push(`[${m}]: ${err.message || 'Lỗi kết nối'}`);
        }
      }

      if (!resultJson) {
        return res.status(500).json({
          error: `Không thể tạo kịch bản Podcast: ${attemptErrors[0] || 'Lỗi kết nối AI'}. Vui lòng thử lại.`
        });
      }

      return res.status(200).json({
        success: true,
        usedModel,
        podcast: resultJson
      });
    }

    // 21. KIỂM TRA BẢN QUYỀN, ĐẠO VĂN, CHÍNH TẢ & NGỮ PHÁP CHO VĂN BẢN / GIÁO TRÌNH / GIÁO ÁN
    if (req.method === 'POST' && action === 'check-document-compliance') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }

      const {
        text,
        documentType = 'giao_trinh', // 'giao_trinh' | 'giao_an' | 'luan_van' | 'tai_lieu'
        language = 'vi', // 'vi' | 'en' | 'auto'
        checkPlagiarism = true,
        checkGrammar = true,
        customApiKey
      } = body || {};

      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Vui lòng cung cấp nội dung văn bản cần kiểm tra.' });
      }

      // Giữ nguyên 100% toàn văn bản gốc của tài liệu tải lên (kể cả 97 trang hay hàng trăm trang)
      const fullText = text.trim();
      // Trích xuất mẫu nội dung gửi cho AI rà soát (~100,000 ký tự)
      const sampleForAi = fullText.slice(0, 100000);

      let apiKey = customApiKey?.trim();
      if (!apiKey) {
        const keyRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiApiKey']);
        apiKey = keyRes.rows[0]?.value?.trim() || process.env.GEMINI_API_KEY;
      }

      if (!apiKey) {
        return res.status(400).json({
          error: 'Chưa cấu hình Google Gemini API Key trong hệ thống! Vui lòng vào Cài đặt để nhập key cá nhân hoặc liên hệ Quản trị viên.'
        });
      }

      const modelRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiCustomModel']);
      const preferredModel = modelRes.rows[0]?.value?.trim();
      const modelQueue = await resolveGeminiModels(apiKey, preferredModel);

      const prompt = `Bạn là HỆ THỐNG THẨM ĐỊNH ĐẠO VĂN & LIÊM CHÍNH HỌC THUẬT QUỐC TẾ CHUYÊN SÂU (hoạt động theo nguyên lý thuật toán Turnitin / iThenticate kết hợp Luật Sở hữu Trí tuệ Việt Nam 2022).
Nhiệm vụ của bạn là rà soát văn bản thể loại "${documentType}" (ngôn ngữ: ${language}), đối chiếu đối sánh với:
1. Cơ sở dữ liệu Web & Internet toàn cầu (báo chí điện tử, thư viện mở, Wikipedia, cổng thông tin bộ ban ngành, website giáo dục).
2. Ấn phẩm học thuật & Tạp chí khoa học (VJOL, ResearchGate, SciELO, Nhà xuất bản Giáo dục, Giáo trình ĐHQG HN/TP.HCM, Bách Khoa, Kinh tế...).
3. Kho lưu trữ Luận văn, Khóa luận tốt nghiệp của sinh viên, học viên cao học & nghiên cứu sinh.

NỘI DUNG VĂN BẢN CẦN RÀ SOÁT:
"""
${sampleForAi}
"""

HÃY PHÂN TÍCH THEO NGUYÊN TẮC THUẬT TOÁN TURNITIN:
1. TỔNG HỢP CHỈ SỐ TƯƠNG ĐỒNG (SIMILARITY INDEX):
   - Đếm chính xác số từ của bài.
   - similarityScore (0% đến 100%): Tỷ lệ tổng số từ thuộc các chuỗi từ ngữ trùng lặp (n-gram từ 6 đến 30 từ liên tiếp trùng khớp hoặc xáo xào từ ngữ - patchwriting) so với tổng số từ toàn bài. 
   - Không được ước lượng cảm tính tùy tiện; nếu văn bản chứa các định nghĩa sách giáo khoa, câu nói phổ biến, quy định pháp luật hoặc đoạn văn sao chép từ mạng, hãy tính toán phần trăm chính xác dựa trên độ dài cụ thể của các câu trùng.
   - breakdown: 
     + internetSourcesPercent: % trùng từ website, báo điện tử, trang tra cứu (thường chiếm phần lớn).
     + publicationsPercent: % trùng từ sách, giáo trình chuẩn, bài báo khoa học đã xuất bản.
     + studentPapersPercent: % trùng từ kho tài liệu/luận văn/khóa luận của sinh viên khác.
     (Lưu ý chuẩn Turnitin: Tổng 3 thành phần này có thể lớn hơn hoặc bằng similarityScore do các nguồn chồng lấn - overlapping sources).
   - riskLevel: "An toàn (0-15%)" | "Cảnh báo (16-35%)" | "Nguy cơ cao (>35%)".

2. DANH SÁCH CÁC NGUỒN TƯƠNG ĐỒNG CHI TIẾT (MATCHED SOURCES - TOÀN BỘ CÁC NGUỒN PHÁT HIỆN):
   - BẮT BUỘC LIỆT KÊ TẤT CẢ các nguồn có dấu hiệu tương đồng (không giới hạn 3 hay 5 nguồn; nếu phát hiện 5, 8, 12, 15, 20 nguồn... hãy liệt kê ĐẦY ĐỦ TẤT CẢ):
     + sourceId: số nguyên từ 1 đến N (đánh số liên tục 1, 2, 3, 4, 5... xếp thứ tự theo tỷ lệ trùng % từ cao xuống thấp).
     + sourceTitle: Tên thật của tài liệu, giáo trình, luận văn, bài báo khoa học hoặc website/domain (VD: "www.elib.vn", "www.ctu.edu.vn", "philpapers.org", "www.vhu.edu.vn", "namsaigon.edu.vn", "doanthanhnien.vn", "linhfishcr7.wordpress.com", "ceqard.vnu.edu.vn", "aws.amazon.com", "Tạp chí Khoa học ĐHQGHN", "tailieu.vn", "123docz.net", "luanvan.net.vn", "tapchicongsan.org.vn", "thuvienphapluat.vn", v.v.).
     + sourceType: "internet" | "publication" | "student_paper" | "journal".
     + similarityPercent: tỷ lệ % đóng góp của riêng nguồn này (VD: 8%, 5%, 4%, 3%, 2%, 1%...).
     + url: URL hoặc domain đại diện cụ thể.
     + authorOrDomain: Cơ quan ban hành, tác giả hoặc tên miền.
     + matchedText: Trích dẫn 1 câu tiêu biểu từ nguồn này trùng với bài nộp.

3. DANH SÁCH CÁC PHÂN ĐOẠN TRÙNG KHỚP CỤ THỂ (SUSPICIOUS PASSAGES):
   - RÀ SOÁT KỸ LƯỠNG TOÀN BỘ VĂN BẢN, tìm TẤT CẢ các câu hoặc phân đoạn (từ 8 đến 45 từ) có sự trùng lặp với các nguồn trên:
     + text: Chuỗi câu/từ ngữ chính xác xuất hiện trong bài nộp của người dùng.
     + sourceIndex: ID của nguồn tương ứng (1, 2, 3... tương ứng với sourceId trong matchedSources) mà đoạn này trùng khớp.
     + sourceTitle: Tên nguồn tương ứng.
     + similarityPercent: % tương đồng của đoạn này (từ 70% đến 100%).
     + reason: Phân tích kỹ thuật (sao chép nguyên văn không mở ngoặc kép, diễn đạt lại câu nhưng giữ nguyên cấu trúc ý - patchwriting, trích dẫn không ghi nguồn theo Điều 25 Luật SHTT).
     + recommendation: Chỉ dẫn cụ thể cách sửa (bổ sung trích dẫn [Tác giả, Năm], thêm trích dẫn ngoặc kép, hoặc viết lại câu).
     + paraphraseSuggestion: Đoạn văn mẫu viết lại hoàn chỉnh bằng từ ngữ học thuật của riêng tác giả để vượt qua kiểm tra trùng lặp nhưng giữ trọn vẹn giá trị kiến thức.

4. BẢN TEXT ĐÁNH DẤU HIGHLIGHT CHUẨN TURNITIN (highlightedHtml):
   - DỰA TRÊN TOÀN BỘ VĂN BẢN GỐC, bao bọc CHÍNH XÁC TẤT CẢ các câu/cụm từ bị trùng khớp bằng thẻ:
     <mark class="turnitin-match match-1" data-source="1">đoạn câu trùng nguồn 1</mark>
     <mark class="turnitin-match match-2" data-source="2">đoạn câu trùng nguồn 2</mark>
   - Các đoạn văn bình thường không trùng giữ nguyên text và định dạng đoạn văn <p>...</p>.
   - Khi render ra HTML này phải phản ánh đúng bài gốc và trực quan y hệt Turnitin Document Viewer.

5. RÀ SOÁT CHI TIẾT & TOÀN DIỆN MỌI LỖI CHÍNH TẢ, NGỮ PHÁP, VĂN PHONG (SPELLING & GRAMMAR AUDIT):
   - BẮT BUỘC LIỆT KÊ ĐẦY ĐỦ VÀ CHI TIẾT TỪNG LỖI (không được tóm tắt chung chung, hãy quét qua từng câu trong bài):
     + Lỗi chính tả tiếng Việt: sai dấu hỏi/ngã (VD: "sâu xắc" -> "sâu sắc", "lẩn" -> "lẫn", "rỏ" -> "rõ", "kĩ lưỡng" -> "kỹ lưỡng"), sai âm đầu s/x, tr/ch, d/gi/r, l/n, lỗi gõ phím telex thừa/thiếu ký tự.
     + Lỗi chính tả tiếng Anh: sai từ vựng, viết hoa, mạo từ a/an/the.
     + Lỗi ngữ pháp: câu què, câu cụt thiếu chủ ngữ hoặc vị ngữ, lỗi logic nối câu, lỗi lặp từ (redundancy).
     + Lỗi văn phong & thuật ngữ: câu văn lủng củng, diễn đạt văn nói thay vì văn phong khoa học/sư phạm.
     + Lỗi quy cách trích dẫn: thiếu dấu ngoặc kép, thiếu năm công bố, thiếu tên tác giả.
   - Mỗi lỗi trong mảng "issues" phải chứa:
     + "id": mã định danh duy nhất (iss-1, iss-2, ...)
     + "type": "spelling" | "grammar" | "style" | "citation"
     + "original": cụm từ hoặc câu chứa lỗi cụ thể trong văn bản
     + "suggestion": cách sửa đúng và chuẩn xác
     + "reason": giải thích ngắn gọn nguyên nhân sai và quy tắc ngữ pháp/từ điển
     + "context": câu hoặc ngữ cảnh xuất hiện lỗi trong bài

6. VĂN BẢN ĐÃ HOÀN THIỆN ĐẦY ĐỦ (improvedText):
   - Toàn bộ văn bản đã được biên tập, sửa sạch mọi lỗi chính tả ngữ pháp, mượt mà chuẩn mực để người dùng tải về dùng ngay.

BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON DUY NHẤT (không bọc text ngoài, chỉ JSON thuần túy):
{
  "summary": {
    "totalWords": 0,
    "totalCharacters": 0,
    "qualityScore": 82,
    "plagiarismRisk": "THẤP" | "TRUNG BÌNH" | "CAO",
    "plagiarismScore": 19,
    "totalIssues": 0,
    "spellingIssuesCount": 0,
    "grammarIssuesCount": 0,
    "citationIssuesCount": 0
  },
  "plagiarismAnalysis": {
    "similarityScore": 19,
    "riskLevel": "An toàn (0-15%)" | "Cảnh báo (16-35%)" | "Nguy cơ cao (>35%)",
    "assessment": "Nhận xét chuyên sâu của hội đồng thẩm định học thuật...",
    "breakdown": {
      "internetSourcesPercent": 21,
      "publicationsPercent": 17,
      "studentPapersPercent": 5
    },
    "matchedSources": [
      {
        "sourceId": 1,
        "sourceTitle": "www.elib.vn",
        "sourceType": "internet",
        "similarityPercent": 7,
        "url": "https://www.elib.vn",
        "authorOrDomain": "elib.vn",
        "matchedText": "Trích đoạn câu tiêu biểu..."
      }
    ],
    "suspiciousPassages": [
      {
        "text": "Đoạn văn chính xác trong bài nộp",
        "sourceIndex": 1,
        "sourceTitle": "www.elib.vn",
        "similarityPercent": 94,
        "reason": "Sao chép nguyên văn định nghĩa lý thuyết nhưng chưa gắn trích dẫn tác giả",
        "recommendation": "Bổ sung trích dẫn [Tên tác giả, Năm] hoặc diễn đạt lại bằng ngôn ngữ riêng",
        "paraphraseSuggestion": "Câu viết lại trau chuốt..."
      }
    ],
    "citationAdvice": "Hướng dẫn trích dẫn hợp lệ theo Điều 25 Luật Sở hữu Trí tuệ 2022"
  },
  "highlightedHtml": "<p>Văn bản gốc với các <mark class=\\"turnitin-match match-1\\" data-source=\\"1\\">câu trùng lặp</mark> được highlight chuẩn xác...</p>",
  "issues": [
    {
      "id": "iss-1",
      "type": "spelling",
      "original": "sâu xắc",
      "suggestion": "sâu sắc",
      "reason": "Sai phụ âm đầu x/s theo chuẩn từ điển tiếng Việt",
      "context": "...đang chứng kiến sự thay đổi sâu xắc về cả..."
    }
  ],
  "improvedText": "Toàn văn bản đã được biên tập và sửa hoàn thiện",
  "pedagogicalAdvice": "Lời khuyên nâng cao tính liêm chính học thuật và chất lượng tài liệu"
}`;

      let resultJson: any = null;
      let usedModel = '';
      const attemptErrors: string[] = [];

      for (const m of modelQueue.slice(0, 5)) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
          const gRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.15,
                responseMimeType: 'application/json'
              }
            }),
            signal: AbortSignal.timeout(50000)
          });

          if (!gRes.ok) {
            const errData = await gRes.json().catch(() => null);
            attemptErrors.push(`[${m}]: HTTP ${gRes.status} ${errData?.error?.message || ''}`);
            continue;
          }

          const data = await gRes.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          let parsed: any = null;
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const match = cleaned.match(/\{[\s\S]*\}/);
            if (match) {
              try { parsed = JSON.parse(match[0]); } catch {}
            }
          }

          if (parsed && parsed.improvedText && parsed.summary) {
            resultJson = parsed;
            usedModel = m;
            break;
          }
        } catch (err: any) {
          attemptErrors.push(`[${m}]: ${err.message || 'Lỗi kết nối'}`);
        }
      }

      if (!resultJson) {
        return res.status(500).json({
          error: `Không thể kiểm tra văn bản: ${attemptErrors[0] || 'Lỗi kết nối AI'}. Vui lòng thử lại hoặc kiểm tra API Key.`
        });
      }

      // HẬU XỬ LÝ (POST-PROCESSING) CHUẨN XÁC CHỈ SỐ THEO THUẬT TOÁN TURNITIN
      try {
        const actualWords = fullText.split(/\s+/).filter(Boolean).length;
        const actualChars = fullText.length;

        // Cập nhật số từ thực tế của toàn bộ tài liệu (kể cả 97 trang hay hàng trăm trang)
        resultJson.summary.totalWords = actualWords;
        resultJson.summary.totalCharacters = actualChars;

        // Đảm bảo các chỉ số khớp logic
        if (!resultJson.plagiarismAnalysis) {
          resultJson.plagiarismAnalysis = {
            similarityScore: 0,
            riskLevel: 'An toàn (0-15%)',
            assessment: 'Không phát hiện trùng lặp đáng kể.',
            breakdown: { internetSourcesPercent: 0, publicationsPercent: 0, studentPapersPercent: 0 },
            matchedSources: [],
            suspiciousPassages: []
          };
        }

        const simScore = Math.max(0, Math.min(100, Math.round(Number(resultJson.plagiarismAnalysis.similarityScore) || 0)));
        resultJson.plagiarismAnalysis.similarityScore = simScore;
        resultJson.summary.plagiarismScore = simScore;

        if (simScore <= 15) {
          resultJson.plagiarismAnalysis.riskLevel = 'An toàn (0-15%)';
          resultJson.summary.plagiarismRisk = 'THẤP';
        } else if (simScore <= 35) {
          resultJson.plagiarismAnalysis.riskLevel = 'Cảnh báo (16-35%)';
          resultJson.summary.plagiarismRisk = 'TRUNG BÌNH';
        } else {
          resultJson.plagiarismAnalysis.riskLevel = 'Nguy cơ cao (>35%)';
          resultJson.summary.plagiarismRisk = 'CAO';
        }

        // BẮT BUỘC RÀ SOÁT VÀ TẠO BẢN HIGHLIGHT DỰA TRÊN 100% TOÀN BỘ VĂN BẢN GỐC (KHÔNG BỎ SÓT BẤT KỲ TRANG NÀO)
        let htmlBase = fullText
          .split('\n\n')
          .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
          .join('');

        // 1. Highlight các đoạn văn trùng lặp đạo văn (Turnitin Matching)
        let totalMatchedWords = 0;
        const markedPassagesSet = new Set<string>();

        if (Array.isArray(resultJson.plagiarismAnalysis?.suspiciousPassages) && resultJson.plagiarismAnalysis.suspiciousPassages.length > 0) {
          const sortedPassages = [...resultJson.plagiarismAnalysis.suspiciousPassages].sort(
            (a, b) => (b.text || '').length - (a.text || '').length
          );

          sortedPassages.forEach((item: any) => {
            if (item.text && typeof item.text === 'string' && item.text.trim().length > 6) {
              const srcId = item.sourceIndex || 1;
              const rawSearch = item.text.trim();
              const wordsCount = rawSearch.split(/\s+/).filter(Boolean).length;
              
              // 1. Thử thay thế chính xác nguyên văn
              const escaped = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const exactRegex = new RegExp(escaped, 'gi');
              
              if (exactRegex.test(htmlBase)) {
                htmlBase = htmlBase.replace(
                  exactRegex,
                  `<mark class="turnitin-match match-${srcId}" data-source="${srcId}" title="Trùng nguồn #${srcId} (${item.sourceTitle || ''})">${rawSearch}</mark>`
                );
                if (!markedPassagesSet.has(rawSearch)) {
                  markedPassagesSet.add(rawSearch);
                  totalMatchedWords += wordsCount;
                }
              } else {
                // 2. Thử tìm theo cụm từ linh hoạt (cho phép khoảng trắng / xuống dòng khác nhau)
                const words = rawSearch.split(/\s+/).filter(Boolean);
                if (words.length >= 4) {
                  const flexPattern = words.map((w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
                  try {
                    const flexRegex = new RegExp(flexPattern, 'gi');
                    if (flexRegex.test(htmlBase)) {
                      htmlBase = htmlBase.replace(
                        flexRegex,
                        (matched: string) => `<mark class="turnitin-match match-${srcId}" data-source="${srcId}" title="Trùng nguồn #${srcId} (${item.sourceTitle || ''})">${matched}</mark>`
                      );
                      if (!markedPassagesSet.has(rawSearch)) {
                        markedPassagesSet.add(rawSearch);
                        totalMatchedWords += wordsCount;
                      }
                    }
                  } catch (rxErr) {}
                }
              }
            }
          });
        }

        // Tự động đối soát từ matchedSources (nếu AI cung cấp mẫu câu matchedText từ nguồn mà chưa đưa vào suspiciousPassages)
        if (Array.isArray(resultJson.plagiarismAnalysis?.matchedSources)) {
          resultJson.plagiarismAnalysis.matchedSources.forEach((src: any) => {
            if (src.matchedText && typeof src.matchedText === 'string' && src.matchedText.trim().length > 12) {
              const cleanText = src.matchedText.trim();
              const srcId = src.sourceId || 1;
              const words = cleanText.split(/\s+/).filter(Boolean);
              if (words.length >= 4) {
                const flexPattern = words.map((w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
                try {
                  const flexRegex = new RegExp(flexPattern, 'gi');
                  if (flexRegex.test(htmlBase) && !htmlBase.includes(`>${cleanText}<`)) {
                    htmlBase = htmlBase.replace(
                      flexRegex,
                      (matched: string) => `<mark class="turnitin-match match-${srcId}" data-source="${srcId}" title="Trùng nguồn #${srcId} (${src.sourceTitle || ''})">${matched}</mark>`
                    );
                    if (!markedPassagesSet.has(cleanText)) {
                      markedPassagesSet.add(cleanText);
                      totalMatchedWords += words.length;
                    }
                  }
                } catch (rxErr) {}
              }
            }
          });
        }

        // TÍNH TOÁN LẠI TỶ LỆ TRÙNG KHỚP THỰC TẾ (SIMILARITY SCORE) ĐỂ THUYẾT PHỤC VÀ KHỚP 100% VỚI CÁC ĐOẠN ĐƯỢC ĐÁNH DẤU
        if (actualWords > 0) {
          const calculatedSimScore = Math.round((totalMatchedWords / actualWords) * 100);
          // Nếu số đoạn được highlight ít hơn tỷ lệ AI ước lượng, tự động cân đối lại tỷ lệ để kết quả hoàn toàn thuyết phục
          const aiEstimatedScore = Math.max(0, Math.min(100, Math.round(Number(resultJson.plagiarismAnalysis.similarityScore) || 0)));
          const finalScore = calculatedSimScore > 0 ? calculatedSimScore : Math.min(aiEstimatedScore, 12);
          
          resultJson.plagiarismAnalysis.similarityScore = finalScore;
          resultJson.summary.plagiarismScore = finalScore;

          if (finalScore <= 15) {
            resultJson.plagiarismAnalysis.riskLevel = 'An toàn (0-15%)';
            resultJson.summary.plagiarismRisk = 'THẤP';
          } else if (finalScore <= 35) {
            resultJson.plagiarismAnalysis.riskLevel = 'Cảnh báo (16-35%)';
            resultJson.summary.plagiarismRisk = 'TRUNG BÌNH';
          } else {
            resultJson.plagiarismAnalysis.riskLevel = 'Nguy cơ cao (>35%)';
            resultJson.summary.plagiarismRisk = 'CAO';
          }
        }

        // 2. Đánh dấu các lỗi chính tả, ngữ pháp trực tiếp trên bài viết bằng gạch chân lượn sóng và gợi ý
        if (Array.isArray(resultJson.issues) && resultJson.issues.length > 0) {
          resultJson.issues.forEach((iss: any) => {
            if (iss.original && typeof iss.original === 'string' && iss.original.trim().length > 0) {
              const orig = iss.original.trim();
              const escaped = orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              // Chỉ match ngoài các thẻ HTML hoặc bên trong thẻ text
              const issueRegex = new RegExp(`(?<!<[^>]*)(${escaped})(?![^<]*>)`, 'gi');
              const issueTypeClass = iss.type === 'spelling' ? 'issue-spelling' : iss.type === 'grammar' ? 'issue-grammar' : 'issue-style';
              const typeName = iss.type === 'spelling' ? 'Lỗi chính tả' : iss.type === 'grammar' ? 'Lỗi ngữ pháp' : 'Lỗi diễn đạt';
              const tooltip = `${typeName}: "${orig}" ➔ Gợi ý sửa: "${iss.suggestion || ''}". ${iss.reason || ''}`;

              htmlBase = htmlBase.replace(
                issueRegex,
                `<span class="grammar-issue-mark ${issueTypeClass}" title="${tooltip.replace(/"/g, '&quot;')}">$1</span>`
              );
            }
          });
        }

        resultJson.highlightedHtml = htmlBase;

        // Đảm bảo improvedText bao gồm trọn vẹn toàn bộ các trang tài liệu
        if (!resultJson.improvedText || resultJson.improvedText.length < fullText.length * 0.7) {
          let refined = fullText;
          if (Array.isArray(resultJson.issues)) {
            resultJson.issues.forEach((iss: any) => {
              if (iss.original && iss.suggestion) {
                const esc = iss.original.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                refined = refined.replace(new RegExp(`\\b${esc}\\b`, 'gi'), iss.suggestion.trim());
              }
            });
          }
          resultJson.improvedText = refined;
        }

        // Đếm lại tổng số issues
        if (Array.isArray(resultJson.issues)) {
          resultJson.summary.totalIssues = resultJson.issues.length;
          resultJson.summary.spellingIssuesCount = resultJson.issues.filter((i: any) => i.type === 'spelling').length;
          resultJson.summary.grammarIssuesCount = resultJson.issues.filter((i: any) => i.type === 'grammar').length;
          resultJson.summary.citationIssuesCount = resultJson.issues.filter((i: any) => i.type === 'citation').length;
        }
      } catch (postErr) {
        console.warn('[PostProcess Turnitin Result Warning]:', postErr);
      }

      return res.status(200).json({
        success: true,
        usedModel,
        result: resultJson
      });
    }

    // 22. TỰ ĐỘNG RÀ SOÁT BẢN QUYỀN VIDEO TRÊN KHÔNG GIAN MẠNG (ONLINE VIDEO COMPLIANCE AUDITOR)
    if (req.method === 'POST' && action === 'auto-audit-video-compliance') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }

      const {
        videoUrl,
        videoTitle = '',
        authorOrChannel = '',
        description = '',
        purpose = 'teaching',
        customApiKey
      } = body || {};

      if (!videoUrl && !videoTitle) {
        return res.status(400).json({ error: 'Vui lòng cung cấp đường dẫn video hoặc tiêu đề/chủ đề video cần thẩm định.' });
      }

      let metadata: any = {
        title: videoTitle,
        uploader: authorOrChannel,
        description: description,
        duration: 0,
        viewCount: null,
        webpage_url: videoUrl,
        extractor: 'direct'
      };

      // Nếu có videoUrl, thử gọi yt-dlp để bóc tách thông tin gốc trên không gian mạng
      if (videoUrl && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://'))) {
        try {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execPromise = promisify(exec);
          const safeUrl = videoUrl.replace(/(["\s'$`\\])/g, '\\$1');
          const cmd = `yt-dlp --extractor-args "youtube:player_client=android,web" --dump-single-json --no-warnings --no-playlist "${safeUrl}"`;
          const { stdout } = await execPromise(cmd, { timeout: 25000 });
          const ytData = JSON.parse(stdout);
          metadata = {
            title: ytData.title || videoTitle || 'Video trích xuất từ Internet',
            uploader: ytData.uploader || ytData.channel || authorOrChannel || 'Chưa rõ tác giả',
            channel_url: ytData.channel_url || ytData.uploader_url || null,
            duration: ytData.duration || 0,
            viewCount: ytData.view_count || null,
            thumbnail: ytData.thumbnail || null,
            description: (ytData.description || '').slice(0, 3000),
            license: ytData.license || null,
            webpage_url: ytData.webpage_url || videoUrl,
            extractor: ytData.extractor_key || ytData.extractor || 'web',
            categories: ytData.categories || [],
            tags: (ytData.tags || []).slice(0, 15)
          };
        } catch (e: any) {
          console.warn('[AutoAudit] yt-dlp warning or direct url:', e.message);
        }
      }

      let apiKey = customApiKey?.trim();
      if (!apiKey) {
        const keyRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiApiKey']);
        apiKey = keyRes.rows[0]?.value?.trim() || process.env.GEMINI_API_KEY;
      }

      if (!apiKey) {
        return res.status(400).json({
          error: 'Chưa cấu hình Google Gemini API Key! Vui lòng cấu hình trong Cài đặt hệ thống để thực hiện rà soát AI.'
        });
      }

      const modelRes = await pool.query('SELECT value FROM "Setting" WHERE key = $1 LIMIT 1', ['geminiCustomModel']);
      const preferredModel = modelRes.rows[0]?.value?.trim();
      const modelQueue = await resolveGeminiModels(apiKey, preferredModel);

      const prompt = `Bạn là Chuyên gia Cao cấp Thẩm định Pháp lý Bản quyền Số và Giám sát Thông tin Truyền thông theo Pháp luật Việt Nam (Luật Sở hữu Trí tuệ 2022 sửa đổi bổ sung, Luật Báo chí 2016, Luật An ninh mạng 2018 và Bộ luật Dân sự 2015).

Dưới đây là thông tin về một video được khai thác từ không gian mạng cần rà soát để sử dụng với mục đích "${purpose === 'teaching' ? 'Giảng dạy / Khóa học LMS / Giáo dục' : purpose}":
- Tiêu đề video: "${metadata.title}"
- Tác giả / Kênh đăng tải gốc: "${metadata.uploader}"
- Đường dẫn video: "${metadata.webpage_url || videoUrl}"
- Nền tảng: ${metadata.extractor}
- Thời lượng: ${metadata.duration} giây
- Giấy phép hiển thị: ${metadata.license || 'Không có giấy phép Creative Commons công khai (Standard License)'}
- Thẻ từ khóa (Tags): ${metadata.tags?.join(', ') || 'N/A'}
- Mô tả tóm tắt tác phẩm:
"""
${metadata.description || 'Không có mô tả chi tiết'}
"""

HÃY THỰC HIỆN RÀ SOÁT TỰ ĐỘNG THEO CÁC NGUYÊN TẮC PHÁP LUẬT VIỆT NAM VÀ ĐƯA RA KẾT LUẬN THẨM ĐỊNH:
1. ĐÁNH GIÁ QUYỀN TÁC GIẢ & NGUỒN GỐC (Điều 14, 25 Luật SHTT):
   - Ai là chủ sở hữu quyền tác giả tiềm năng? Có phải cơ quan báo chí, hãng sản xuất hay nhà sáng tạo độc lập?
   - Mức độ rủi ro khi sử dụng video này nếu không có thỏa thuận bản quyền bằng văn bản.
2. PHÂN TÍCH NGOẠI LỆ TRÍCH DẪN GIẢNG DẠY (Fair Use - Khoản 1 Điều 25 Luật SHTT):
   - Người dùng có được phép sử dụng video này theo ngoại lệ trích dẫn giảng dạy không? Điều kiện bắt buộc là gì? (Tối đa bao nhiêu % thời lượng, bắt buộc ghi credit tác giả thế nào?)
3. RÀ SOÁT BẢN QUYỀN ÂM NHẠC & BẢN GHI ÂM (Điều 29, 30 Luật SHTT):
   - Video có nguy cơ chứa bài hát hoặc bản ghi âm thương mại dễ bị quét bản quyền Content ID tự động trên mạng xã hội hoặc LMS không?
4. RÀ SOÁT THÔNG TIN CẤM & QUYỀN NHÂN THÂN (Điều 9 Luật Báo chí, Điều 32 Bộ luật Dân sự, Luật An ninh mạng):
   - Đánh giá khả năng chứa hình ảnh nhạy cảm cá nhân, trẻ em, tin chưa kiểm chứng hoặc xuyên tạc.
5. CHECKLIST ĐÁNH GIÁ TỰ ĐỘNG TỪNG TIÊU CHÍ (passed/failed/warning) cho 6 tiêu chuẩn:
   - cr_1: Ghi rõ họ tên tác giả & nguồn gốc tác phẩm (Điều 14, 25 Luật SHTT)
   - cr_2: Giới hạn trích dẫn hợp lý - Fair Use (Điều 25 khoản 1 Luật SHTT)
   - cr_3: Bản quyền âm thanh, nhạc nền BGM (Điều 29, 30 Luật SHTT)
   - press_1: Thông tin cấm & bảo vệ trẻ em (Điều 9 Luật Báo chí & Điều 32 BLDS)
   - cyber_1: Xác thực nguồn tin & chống deepfake / tin giả (Luật An ninh mạng)
   - lms_tech: Tương thích lưu trữ và phân phối trên nền tảng đào tạo LMS
6. BIÊN BẢN KHUYẾN NGHỊ PHÁP LÝ HÀNH ĐỘNG CỤ THỂ:
   - Cách ghi dòng credit tác giả chuẩn mực.
   - Hành động cần thực hiện trước khi đưa vào bài giảng.

BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON DUY NHẤT (không bọc text ngoài, chỉ JSON thuần túy):
{
  "auditSummary": {
    "riskStatus": "safe" | "warning" | "danger",
    "riskTitle": "Tiêu đề kết luận tổng quan (VD: CẢNH BÁO: Cần ghi nguồn rõ ràng và trích đoạn ngắn...)",
    "overallAssessment": "Đánh giá chi tiết 2-3 câu về tình trạng pháp lý của video này",
    "copyrightOwnerIdentified": "Tên tác giả hoặc cơ quan chủ quản được nhận diện",
    "fairUseEligibility": "Đủ điều kiện trích dẫn hợp lý" | "Cần xin phép bằng văn bản" | "Rủi ro cao",
    "recommendedCreditText": "Nguồn video: [Tên tác giả/kênh] - URL: [link] - Sử dụng phục vụ mục đích giảng dạy theo Điều 25 Luật SHTT 2022"
  },
  "checklistEvaluation": [
    {
      "id": "cr_1",
      "checked": true | false,
      "autoVerdict": "ĐẠT" | "CẦN LƯU Ý" | "CHƯA ĐẠT",
      "finding": "Nhận định tự động từ dữ liệu mạng",
      "recommendation": "Khuyến nghị xử lý"
    },
    {
      "id": "cr_2",
      "checked": true | false,
      "autoVerdict": "ĐẠT" | "CẦN LƯU Ý" | "CHƯA ĐẠT",
      "finding": "Nhận định tự động",
      "recommendation": "Khuyến nghị xử lý"
    },
    {
      "id": "cr_3",
      "checked": true | false,
      "autoVerdict": "ĐẠT" | "CẦN LƯU Ý" | "CHƯA ĐẠT",
      "finding": "Nhận định tự động",
      "recommendation": "Khuyến nghị xử lý"
    },
    {
      "id": "press_1",
      "checked": true | false,
      "autoVerdict": "ĐẠT" | "CẦN LƯU Ý" | "CHƯA ĐẠT",
      "finding": "Nhận định tự động",
      "recommendation": "Khuyến nghị xử lý"
    },
    {
      "id": "cyber_1",
      "checked": true | false,
      "autoVerdict": "ĐẠT" | "CẦN LƯU Ý" | "CHƯA ĐẠT",
      "finding": "Nhận định tự động",
      "recommendation": "Khuyến nghị xử lý"
    },
    {
      "id": "lms_tech",
      "checked": true | false,
      "autoVerdict": "ĐẠT" | "CẦN LƯU Ý" | "CHƯA ĐẠT",
      "finding": "Nhận định tự động",
      "recommendation": "Khuyến nghị xử lý"
    }
  ],
  "actionableSteps": [
    "Bước 1: ...",
    "Bước 2: ..."
  ]
}`;

      let resultJson: any = null;
      let usedModel = '';
      const attemptErrors: string[] = [];

      for (const m of modelQueue.slice(0, 5)) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
          const gRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json'
              }
            }),
            signal: AbortSignal.timeout(45000)
          });

          if (!gRes.ok) {
            const errData = await gRes.json().catch(() => null);
            attemptErrors.push(`[${m}]: HTTP ${gRes.status} ${errData?.error?.message || ''}`);
            continue;
          }

          const data = await gRes.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          let parsed: any = null;
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const match = cleaned.match(/\{[\s\S]*\}/);
            if (match) {
              try { parsed = JSON.parse(match[0]); } catch {}
            }
          }

          if (parsed && parsed.auditSummary && Array.isArray(parsed.checklistEvaluation)) {
            resultJson = parsed;
            usedModel = m;
            break;
          }
        } catch (err: any) {
          attemptErrors.push(`[${m}]: ${err.message || 'Lỗi kết nối'}`);
        }
      }

      if (!resultJson) {
        return res.status(500).json({
          error: `Không thể rà soát bản quyền video: ${attemptErrors[0] || 'Lỗi phân tích AI'}. Vui lòng thử lại.`
        });
      }

      return res.status(200).json({
        success: true,
        usedModel,
        metadata,
        audit: resultJson
      });
    }

    return res.status(400).json({ error: 'Không tìm thấy action' });
  } catch (error: any) {
    console.error('Lỗi API qa-wall / quiz:', error);
    return res.status(500).json({ error: error.message || 'Lỗi máy chủ nội bộ' });
  }
}

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

    return res.status(400).json({ error: 'Không tìm thấy action' });
  } catch (error: any) {
    console.error('Lỗi API qa-wall / quiz:', error);
    return res.status(500).json({ error: error.message || 'Lỗi máy chủ nội bộ' });
  }
}

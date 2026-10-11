import type { VercelRequest, VercelResponse } from '@vercel/node';

let pdfChatTablesEnsured = false;
async function ensurePdfChatTables(prisma: any) {
  if (pdfChatTablesEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PdfChatSession" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT,
        "fileName" TEXT NOT NULL,
        "fileSize" INTEGER NOT NULL DEFAULT 0,
        "pageCount" INTEGER NOT NULL DEFAULT 0,
        "summary" TEXT,
        "extractedText" TEXT,
        "messages" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    pdfChatTablesEnsured = true;
  } catch (e) {
    console.error('[PdfChat] Ensure tables error:', e);
  }
}

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

async function resolveGeminiModels(apiKey: string): Promise<string[]> {
  const modelsSet = new Set<string>();
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listRes.ok) {
      const data = await listRes.json();
      if (Array.isArray(data?.models)) {
        const supported = data.models
          .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
          .map((m: any) => (m.name || '').replace(/^models\//, ''))
          .filter(Boolean);

        const textFlashModels = supported
          .filter((m: string) => m.includes('flash') && !m.includes('tts') && !m.includes('audio'))
          .reverse();
        const otherTextModels = supported
          .filter((m: string) => !m.includes('flash') && !m.includes('tts') && !m.includes('audio'))
          .reverse();

        for (const m of [...textFlashModels, ...otherTextModels]) {
          modelsSet.add(m);
        }
      }
    }
  } catch (err) {
    console.warn('[PdfChat Gemini Discovery Error]', err);
  }

  for (const m of DEFAULT_GEMINI_FALLBACKS) {
    modelsSet.add(m);
  }

  return Array.from(modelsSet);
}

async function getEffectiveApiKey(prisma: any, customApiKey?: string): Promise<string> {
  if (customApiKey && customApiKey.trim().length > 0) {
    return customApiKey.trim();
  }

  // Fallback 1: Biến môi trường
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    return process.env.GEMINI_API_KEY.trim();
  }
  if (process.env.VITE_GEMINI_API_KEY && process.env.VITE_GEMINI_API_KEY.trim().length > 0) {
    return process.env.VITE_GEMINI_API_KEY.trim();
  }

  // Fallback 2: Lấy từ cấu hình Admin trong Database (Bảng Setting: key='geminiApiKey')
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'geminiApiKey' }
    });
    if (setting?.value && setting.value.trim().length > 0) {
      return setting.value.trim();
    }
  } catch (err) {
    console.warn('[PdfChat] Failed to read Setting geminiApiKey:', err);
  }

  return '';
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('Chưa cấu hình Google Gemini API Key trong hệ thống. Vui lòng nhập API Key riêng ở phần Cài đặt.');
  }

  const models = await resolveGeminiModels(apiKey);
  let lastError = '';

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2500
          }
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        lastError = errJson?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        continue;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e: any) {
      lastError = e?.message || 'Network error';
    }
  }

  throw new Error(`Không thể kết nối tới Google Gemini AI (${lastError || 'Tất cả model đều từ chối hoặc hết quota'}). Vui lòng kiểm tra lại API Key.`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query?.action || (req as any).params?.action;
  const { prisma } = await import('./_lib/prisma.js');

  try {
    await ensurePdfChatTables(prisma);

    // 1. TẠO PHIÊN CHAT VỚI PDF MỚI (LƯU NỘI DUNG VÀ TẠO TÓM TẮT BAN ĐẦU)
    if (action === 'create-session') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { userId, fileName, fileSize, pageCount, extractedText, customApiKey } = req.body;

      if (!fileName || !extractedText) {
        return res.status(400).json({ message: 'Thiếu nội dung văn bản PDF' });
      }

      // Giới hạn độ dài nội dung để tối ưu token (lấy tối đa 120,000 ký tự đầu tiên)
      const trimmedText = extractedText.substring(0, 120000);

      // Nhờ Gemini tóm tắt tài liệu ban đầu
      let summary = '';
      try {
        const apiKey = await getEffectiveApiKey(prisma, customApiKey);
        const summaryPrompt = `Bạn là một trợ lý AI thông minh, chuyên phân tích và giải thích tài liệu học tập, giáo trình, báo cáo cho người Việt Nam.
Dưới đây là nội dung của tài liệu PDF tên là: "${fileName}".

TÀI LIỆU TRÍCH XUẤT:
"""
${trimmedText.substring(0, 30000)}
"""

YÊU CẦU:
1. Viết một đoạn tóm tắt súc tích, chuyên nghiệp (khoảng 3 - 5 gạch đầu dòng) về chủ đề chính, mục tiêu và những nội dung quan trọng nhất trong tài liệu.
2. Đề xuất 3 câu hỏi gợi ý hay nhất mà người đọc nên hỏi về tài liệu này (định dạng: "❓ Gợi ý: ...").
3. Trả lời bằng tiếng Việt chuẩn xác, thân thiện, định dạng Markdown rõ ràng.`;

        summary = await callGemini(summaryPrompt, apiKey);
      } catch (err: any) {
        summary = `Đã tải tài liệu "${fileName}" (${pageCount} trang). Bạn có thể đặt bất kỳ câu hỏi nào để tôi giải đáp ngay!`;
      }

      const initialMessage = {
        role: 'assistant',
        content: summary,
        timestamp: new Date().toISOString()
      };

      const session = await (prisma as any).pdfChatSession.create({
        data: {
          userId: userId || null,
          fileName,
          fileSize: Number(fileSize) || 0,
          pageCount: Number(pageCount) || 1,
          summary,
          extractedText: trimmedText,
          messages: [initialMessage]
        }
      });

      return res.status(200).json({ success: true, session });
    }

    // 2. GỬI CÂU HỎI TRONG PHIÊN CHAT (ASK AI)
    if (action === 'ask') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { sessionId, question, customApiKey } = req.body;

      if (!sessionId || !question) {
        return res.status(400).json({ message: 'Thiếu sessionId hoặc câu hỏi' });
      }

      const session = await (prisma as any).pdfChatSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) return res.status(404).json({ message: 'Không tìm thấy phiên chat này' });

      const currentMessages = Array.isArray(session.messages) ? session.messages : [];
      const userMessage = {
        role: 'user',
        content: question.trim(),
        timestamp: new Date().toISOString()
      };

      // Xây dựng Prompt phân tích ngữ cảnh từ tài liệu
      const prompt = `Bạn là trợ lý AI chuyên nghiệp đang hỗ trợ người dùng đọc hiểu tài liệu PDF "${session.fileName}".
Dưới đây là một phần nội dung trích xuất từ tài liệu:

"""
${(session.extractedText || '').substring(0, 45000)}
"""

LỊCH SỬ HỘI THOẠI GẦN ĐÂY:
${currentMessages.slice(-4).map((m: any) => `${m.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${m.content}`).join('\n')}

CÂU HỎI MỚI CỦA NGƯỜI DÙNG:
"${question.trim()}"

QUY TẮC TRẢ LỜI:
1. Trả lời căn cứ chính xác theo nội dung có trong tài liệu trên. Nếu tài liệu có đề cập đến phần nào hoặc trang nào, hãy trích dẫn cụ thể.
2. Nếu thông tin không có trong tài liệu, hãy thành thật nêu rõ "Tài liệu không trực tiếp đề cập..." và sau đó có thể bổ sung kiến thức chuyên môn hữu ích (nếu phù hợp).
3. Sử dụng Markdown đẹp mắt: in đậm từ khóa, dùng danh sách có thứ tự hoặc gạch đầu dòng, giải thích ngắn gọn, xúc tích, dễ hiểu.`;

      const apiKey = await getEffectiveApiKey(prisma, customApiKey);
      const aiReplyText = await callGemini(prompt, apiKey);

      const aiMessage = {
        role: 'assistant',
        content: aiReplyText,
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [...currentMessages, userMessage, aiMessage];

      await (prisma as any).pdfChatSession.update({
        where: { id: sessionId },
        data: {
          messages: updatedMessages
        }
      });

      return res.status(200).json({
        success: true,
        answer: aiReplyText,
        messages: updatedMessages
      });
    }

    // 3. TẠO CÂU HỎI ÔN TẬP TỪ TÀI LIỆU PDF
    if (action === 'generate-quiz') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { sessionId, count = 5, customApiKey } = req.body;

      const session = await (prisma as any).pdfChatSession.findUnique({
        where: { id: sessionId }
      });
      if (!session) return res.status(404).json({ message: 'Không tìm thấy tài liệu' });

      const prompt = `Dựa vào nội dung tài liệu PDF "${session.fileName}":
"""
${(session.extractedText || '').substring(0, 40000)}
"""

Hãy tạo ${count} câu hỏi trắc nghiệm kiểm tra độ hiểu bài (gồm 4 lựa chọn A, B, C, D và 1 đáp án đúng).
Yêu cầu trả về DUY NHẤT một chuỗi JSON hợp lệ theo schema sau (không thêm bất kỳ lời dẫn nào ngoài JSON):
[
  {
    "question": "Nội dung câu hỏi?",
    "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
    "correctAnswer": 0,
    "explanation": "Giải thích ngắn gọn tại sao đáp án này đúng theo tài liệu"
  }
]`;

      const apiKey = await getEffectiveApiKey(prisma, customApiKey);
      const aiReply = await callGemini(prompt, apiKey);
      let quizData: any[] = [];
      try {
        const cleanJson = aiReply.replace(/```json/g, '').replace(/```/g, '').trim();
        quizData = JSON.parse(cleanJson);
      } catch {
        quizData = [];
      }

      return res.status(200).json({ success: true, quiz: quizData, raw: aiReply });
    }

    // 4. LẤY CHI TIẾT PHIÊN CHAT
    if (action === 'get-session') {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) return res.status(400).json({ message: 'Thiếu sessionId' });

      const session = await (prisma as any).pdfChatSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) return res.status(404).json({ message: 'Không tìm thấy phiên chat' });
      return res.status(200).json({ success: true, session });
    }

    return res.status(404).json({ message: 'Không tìm thấy action ChatWithPdf' });
  } catch (error: any) {
    console.error('[PdfChat API Error]', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
}

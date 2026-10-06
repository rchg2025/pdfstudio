import mammoth from 'mammoth';
import type { QuizQuestion, Difficulty } from '../types/quiz';

export interface ParsedExamResult {
  title: string;
  subject: string;
  timeLimitMinutes: number;
  questions: QuizQuestion[];
  answerMap: Record<number, string>; // Map từ số thứ tự câu -> đáp án (vd: 1 -> "A")
  totalDetected: number;
}

/**
 * Trích xuất bảng đáp án nếu nằm ở cuối đề thi
 * Hỗ trợ bảng <table> (như file doc xuất HTML) hoặc bảng chữ dạng 1-A 2-B 3-C
 */
function extractAnswerMapFromHtml(doc: Document): Record<number, string> {
  const map: Record<number, string> = {};

  // 1. Tìm trong các thẻ <table>
  const tables = doc.querySelectorAll('table');
  tables.forEach(table => {
    const text = table.textContent || '';
    if (text.includes('STT') || text.includes('Đáp án') || text.includes('ĐÁP ÁN') || text.includes('Câu')) {
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td, th')).map(c => (c.textContent || '').trim());
        // Bảng thường có các cặp cột: [STT1, ĐA1, STT2, ĐA2, STT3, ĐA3]
        for (let i = 0; i < cells.length - 1; i++) {
          const num = parseInt(cells[i], 10);
          const ansCandidate = cells[i + 1].toUpperCase();
          if (!isNaN(num) && num > 0 && /^[A-D]$/.test(ansCandidate)) {
            map[num] = ansCandidate;
            i++; // Nhảy qua cột đáp án
          }
        }
      });
    }
  });

  return map;
}

/**
 * Phân tích file tài liệu (HTML / Word HTML / Text / Docx)
 */
export async function parseExamFile(file: File): Promise<ParsedExamResult> {
  let htmlContent = '';
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.docx')) {
    // Xử lý file .docx bằng mammoth
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    htmlContent = result.value;
  } else {
    // Đọc dưới dạng text (cho .doc, .html, .htm, .txt)
    htmlContent = await file.text();
  }

  return parseExamFromHtmlString(htmlContent, file.name);
}

/**
 * Parse chuỗi HTML hoặc văn bản đề thi
 */
export function parseExamFromHtmlString(rawContent: string, defaultName = 'Đề thi import'): ParsedExamResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawContent, 'text/html');

  let title = '';
  let subject = '';
  let timeLimitMinutes = 0;

  // 1. Tìm tiêu đề và môn học từ các thẻ tiêu đề (h2, h3, title)
  const h2List = Array.from(doc.querySelectorAll('h2, h1, h3'));
  for (const h of h2List) {
    const text = (h.textContent || '').trim();
    if (!title && (text.includes('ĐỀ THI') || text.includes('BÀI KIỂM TRA') || text.includes('ĐÁNH GIÁ'))) {
      title = text;
    } else if (!subject && (text.includes('MÔN') || text.includes('HỌC PHẦN') || text.includes('CHỦ ĐỀ'))) {
      subject = text.replace(/^(?:MÔN HỌC|MÔN|HỌC PHẦN)[:.]\s*/i, '').trim();
    }
  }

  if (!title) {
    const pageTitle = doc.querySelector('title')?.textContent?.trim();
    if (pageTitle && !pageTitle.toLowerCase().includes('export')) title = pageTitle;
    else title = defaultName.replace(/\.[^/.]+$/, '');
  }

  // 2. Tìm thời gian làm bài (ví dụ: "Thời gian làm bài: 90 phút")
  const allText = doc.body ? doc.body.textContent || '' : rawContent;
  const timeMatch = allText.match(/Thời gian(?:\s+làm bài)?[:.]?\s*(\d+)\s*phút/i);
  if (timeMatch && timeMatch[1]) {
    timeLimitMinutes = parseInt(timeMatch[1], 10);
  }

  // 3. Trích xuất Bảng Đáp Án ở cuối đề thi
  const answerMap = extractAnswerMapFromHtml(doc);

  // Cũng hỗ trợ regex trích xuất bảng đáp án từ văn bản thuần (vd: "1. A  2. B  3. C")
  if (Object.keys(answerMap).length === 0) {
    const tableRegex = /(?:BẢNG ĐÁP ÁN|ĐÁP ÁN VÀ THANG ĐIỂM)[\s\S]*$/i;
    const endSection = allText.match(tableRegex);
    if (endSection) {
      const pairRegex = /(\d+)[\s.:/-]+([A-D])\b/gi;
      let m;
      while ((m = pairRegex.exec(endSection[0])) !== null) {
        const qNum = parseInt(m[1], 10);
        const ans = m[2].toUpperCase();
        if (qNum > 0 && !answerMap[qNum]) {
          answerMap[qNum] = ans;
        }
      }
    }
  }

  // 4. Tìm và bóc tách các câu hỏi
  const questions: QuizQuestion[] = [];

  // Cách A: Tìm theo cấu trúc <div class="question"> (như tệp Word HTML mẫu)
  const questionDivs = doc.querySelectorAll('.question');
  if (questionDivs.length > 0) {
    questionDivs.forEach((qDiv, idx) => {
      const qNum = idx + 1;
      const paragraphs = Array.from(qDiv.querySelectorAll('p'));
      let questionText = '';
      const options: string[] = [];

      paragraphs.forEach(p => {
        const text = (p.textContent || '').trim();
        if (p.classList.contains('options')) {
          // Lấy các options từ span hoặc dòng text
          const spans = p.querySelectorAll('span');
          if (spans.length > 0) {
            spans.forEach(sp => {
              const optText = (sp.textContent || '').trim().replace(/^[A-D][.:)]\s*/i, '');
              if (optText) options.push(optText);
            });
          } else {
            // Tách options qua regex A. B. C. D.
            const optMatches = text.split(/(?=[A-D][.:)])/);
            optMatches.forEach(o => {
              const optText = o.trim().replace(/^[A-D][.:)]\s*/i, '');
              if (optText) options.push(optText);
            });
          }
        } else if (/^Câu\s*\d+[:.]/i.test(text) || !questionText) {
          questionText = text.replace(/^Câu\s*\d+[:.]\s*/i, '').trim();
        }
      });

      // Nếu p không có class options, tìm span options trực tiếp
      if (options.length === 0) {
        const spans = qDiv.querySelectorAll('span');
        spans.forEach(sp => {
          const t = (sp.textContent || '').trim();
          if (/^[A-D][.:)]/i.test(t)) {
            options.push(t.replace(/^[A-D][.:)]\s*/i, ''));
          }
        });
      }

      if (questionText && options.length >= 2) {
        const correctLetter = answerMap[qNum];
        let correctAnswer = options[0];
        if (correctLetter) {
          const letterIdx = ['A', 'B', 'C', 'D'].indexOf(correctLetter);
          if (letterIdx >= 0 && options[letterIdx]) {
            correctAnswer = options[letterIdx];
          }
        }

        questions.push({
          id: `imp-${Date.now()}-${qNum}`,
          type: 'choice',
          difficulty: assignSmartDifficulty(qNum, questionDivs.length),
          question: questionText,
          options,
          correctAnswer,
          points: 1,
          explanation: `Đáp án đúng là phương án ${correctLetter || 'A'}: ${correctAnswer}.`
        });
      }
    });
  }

  // Cách B: Fallback duyệt tuần tự các đoạn văn <p> hoặc phân tích văn bản thuần
  if (questions.length === 0) {
    const rawParagraphs = Array.from(doc.querySelectorAll('p, div, li'))
      .map(el => (el.textContent || '').trim())
      .filter(Boolean);

    let currentQText = '';
    let currentOptions: string[] = [];
    let currentQNum = 0;

    const finalizeCurrent = () => {
      if (currentQText && currentOptions.length >= 2) {
        const qNum = currentQNum || questions.length + 1;
        const correctLetter = answerMap[qNum];
        let correctAnswer = currentOptions[0];
        if (correctLetter) {
          const letterIdx = ['A', 'B', 'C', 'D'].indexOf(correctLetter);
          if (letterIdx >= 0 && currentOptions[letterIdx]) {
            correctAnswer = currentOptions[letterIdx];
          }
        }

        questions.push({
          id: `imp-${Date.now()}-${qNum}`,
          type: 'choice',
          difficulty: 'medium',
          question: currentQText,
          options: [...currentOptions],
          correctAnswer,
          points: 1,
          explanation: `Đáp án đúng là phương án ${correctLetter || 'A'}: ${correctAnswer}.`
        });
      }
      currentQText = '';
      currentOptions = [];
    };

    rawParagraphs.forEach(pText => {
      // Dừng nếu bắt đầu vào bảng đáp án
      if (/^ĐÁP ÁN VÀ THANG ĐIỂM/i.test(pText) || /^BẢNG ĐÁP ÁN/i.test(pText)) {
        finalizeCurrent();
        return;
      }

      const qMatch = pText.match(/^Câu\s*(\d+)[:.]\s*(.+)/i);
      if (qMatch) {
        finalizeCurrent();
        currentQNum = parseInt(qMatch[1], 10);
        currentQText = qMatch[2].trim();
      } else if (/^[A-D][.:)]\s*/i.test(pText)) {
        // Dòng chứa một phương án
        const optClean = pText.replace(/^[A-D][.:)]\s*/i, '').trim();
        if (optClean) currentOptions.push(optClean);
      } else if (pText.includes('A.') && pText.includes('B.')) {
        // Dòng chứa nhiều phương án A. ... B. ...
        const parts = pText.split(/(?=[A-D][.:)])/);
        parts.forEach(part => {
          const optClean = part.replace(/^[A-D][.:)]\s*/i, '').trim();
          if (optClean) currentOptions.push(optClean);
        });
      }
    });

    finalizeCurrent();
  }

  return {
    title: title || 'Bộ đề thi trắc nghiệm',
    subject: subject || 'Chung',
    timeLimitMinutes: timeLimitMinutes || 60,
    questions,
    answerMap,
    totalDetected: questions.length
  };
}

/**
 * Tự động phân chia độ khó thông minh nếu đề thi không ghi rõ:
 * - 40% câu đầu: Dễ (Nhận biết)
 * - 40% câu giữa: Trung bình (Thông hiểu)
 * - 20% câu cuối: Khó (Vận dụng)
 */
function assignSmartDifficulty(index: number, total: number): Difficulty {
  if (total <= 3) return 'medium';
  const ratio = index / total;
  if (ratio <= 0.4) return 'easy';
  if (ratio <= 0.8) return 'medium';
  return 'hard';
}

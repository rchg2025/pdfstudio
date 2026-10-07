import mammoth from 'mammoth';
import type { QuizQuestion, Difficulty, QuestionType } from '../types/quiz';
import { extractQuestionImage } from './imageUrl';

export interface ParsedExamResult {
  title: string;
  subject: string;
  timeLimitMinutes: number;
  questions: QuizQuestion[];
  answerMap: Record<number, string>; // Map từ số thứ tự câu -> đáp án (vd: 1 -> "A")
  totalDetected: number;
}

/**
 * Làm sạch chuỗi HTML thành văn bản thuần, giải mã các ký tự html entities
 */
function cleanHtmlText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Trích xuất bảng đáp án nếu nằm ở cuối đề thi
 * Hỗ trợ bảng <table> (chuẩn Office Word HTML) với nhiều hàng STT / Đáp án,
 * hoặc danh sách chữ cuối đề thi: 1-A 2-B 3-C, Câu 1: A...
 */
function extractAnswerMapFromHtml(doc: Document, rawContent: string): Record<number, string> {
  const map: Record<number, string> = {};

  // 1. Quét tất cả các thẻ <table> trong tài liệu
  const tables = Array.from(doc.querySelectorAll('table'));
  tables.forEach(table => {
    const tableText = (table.textContent || '').trim();
    if (
      table.classList.contains('answers-table') ||
      tableText.includes('BẢNG ĐÁP ÁN') ||
      tableText.includes('Đáp án') ||
      tableText.includes('ĐÁP ÁN') ||
      tableText.includes('STT') ||
      tableText.includes('Đ/A') ||
      (tableText.includes('Câu 1') && tableText.includes('Câu 2'))
    ) {
      const rows = Array.from(table.querySelectorAll('tr'));
      for (let r = 0; r < rows.length; r++) {
        const rowCells = Array.from(rows[r].querySelectorAll('td, th')).map(c => cleanHtmlText(c.innerHTML || c.textContent || ''));

        // Trường hợp bảng dạng Lưới 2 hàng liên tiếp: Hàng r là Tiêu đề Câu (Câu 1, Câu 2...), Hàng r+1 là Đáp án (A, B, C...)
        if (r + 1 < rows.length) {
          const nextRowCells = Array.from(rows[r + 1].querySelectorAll('td, th')).map(c => cleanHtmlText(c.innerHTML || c.textContent || ''));
          const isHeaderNumberRow = rowCells.length > 0 && rowCells.every(c => !c || /^(?:Câu\s*)?\d+$/i.test(c));
          const isAnswerRow = nextRowCells.length > 0 && nextRowCells.some(c => /^[A-D]$/i.test(c));

          if (isHeaderNumberRow && isAnswerRow) {
            rowCells.forEach((hCell, colIdx) => {
              const numMatch = hCell.match(/\d+/);
              const ansVal = nextRowCells[colIdx]?.trim().toUpperCase();
              if (numMatch && ansVal && /^[A-D]$/.test(ansVal)) {
                map[parseInt(numMatch[0], 10)] = ansVal;
              }
            });
            r++; // Đã xử lý xong cặp hàng này, nhảy cóc hàng tiếp theo
            continue;
          }
        }

        // Trường hợp ô trong bảng chứa cả số thứ tự và đáp án: "1. C", "1-C", "Câu 1: C"
        for (let i = 0; i < rowCells.length; i++) {
          const cellText = rowCells[i];
          const singleMatch = cellText.match(/^(?:Câu\s*)?(\d+)[\s.:/-]+([A-D])$/i);
          if (singleMatch) {
            const num = parseInt(singleMatch[1], 10);
            const ans = singleMatch[2].toUpperCase();
            if (num > 0) map[num] = ans;
            continue;
          }

          // Cặp 2 ô liên tiếp: [STT, Đáp án]
          if (i < rowCells.length - 1) {
            const num = parseInt(cellText, 10);
            const nextCandidate = rowCells[i + 1].toUpperCase();
            if (!isNaN(num) && num > 0 && /^[A-D]$/.test(nextCandidate)) {
              map[num] = nextCandidate;
              i++; // Nhảy qua cột đáp án
            }
          }
        }
      }
    }
  });

  // 2. Tìm trong văn bản cuối đề thi (Regex trích xuất danh sách đáp án dạng "1. A  2. B  3. C" hoặc "1-A, 2-B")
  const allText = doc.body ? (doc.body.textContent || '') : rawContent;
  const answerSectionMatch = allText.match(/(?:BẢNG ĐÁP ÁN|ĐÁP ÁN VÀ THANG ĐIỂM|HƯỚNG DẪN CHẤM)[\s\S]*$/i);
  if (answerSectionMatch) {
    const pairRegex = /(?:Câu\s*)?(\d+)[\s.:/-]+([A-D])\b/gi;
    let m;
    while ((m = pairRegex.exec(answerSectionMatch[0])) !== null) {
      const qNum = parseInt(m[1], 10);
      const ans = m[2].toUpperCase();
      if (qNum > 0 && !map[qNum]) {
        map[qNum] = ans;
      }
    }
  }

  return map;
}

/**
 * Trích xuất bản đồ Lời giải chi tiết & Đáp án từ phần HƯỚNG DẪN CHẤM & LỜI GIẢI CHI TIẾT
 */
function extractExplanationsMap(rawContent: string): Record<number, { correctText: string; explanation: string }> {
  const map: Record<number, { correctText: string; explanation: string }> = {};
  const explSectionMatch = rawContent.split(/(?:HƯỚNG DẪN CHẤM &amp; LỜI GIẢI CHI TIẾT|HƯỚNG DẪN CHẤM & LỜI GIẢI CHI TIẾT|HƯỚNG DẪN CHẤM)/i);
  if (explSectionMatch.length > 1) {
    const explSection = explSectionMatch[1];
    const explBlocks = [...explSection.matchAll(/<strong>\s*Câu\s*(\d+)\s*:\s*<\/strong>([\s\S]*?)(?=(?:<strong>\s*Câu\s*\d+\s*:|<\/body|<\/html|$))/gi)];
    explBlocks.forEach(eb => {
      const num = parseInt(eb[1], 10);
      const blockHtml = eb[2];
      const ansMatch = blockHtml.match(/Đáp án đúng:\s*<strong[^>]*>([\s\S]*?)<\/strong>/i);
      const expMatch = blockHtml.match(/<em>([\s\S]*?)<\/em>/i);
      map[num] = {
        correctText: ansMatch ? cleanHtmlText(ansMatch[1]) : '',
        explanation: expMatch ? cleanHtmlText(expMatch[1]) : ''
      };
    });
  }
  return map;
}

/**
 * Phân tích file tài liệu (HTML / Word HTML / Text / Docx)
 */
export async function parseExamFile(file: File): Promise<ParsedExamResult> {
  let htmlContent = '';
  const fileName = file.name.toLowerCase();

  try {
    // Kiểm tra header binary xem có phải file ZIP / DOCX hay không (kể cả khi file có đuôi .doc)
    const headerSlice = await file.slice(0, 4).arrayBuffer();
    const headerBytes = new Uint8Array(headerSlice);
    const isZipDocx = headerBytes[0] === 0x50 && headerBytes[1] === 0x4B && headerBytes[2] === 0x03 && headerBytes[3] === 0x04;

    if (fileName.endsWith('.docx') || isZipDocx) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      htmlContent = result.value;
    } else {
      // Đọc dưới dạng text (cho Word HTML .doc, .html, .htm, .txt)
      htmlContent = await file.text();
    }
  } catch {
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

  // 1. Tìm tiêu đề và môn học từ file Word HTML (cấu trúc xuất bản hệ thống hoặc Office)
  const systemTitleMatch = rawContent.match(/<strong style=["']color:#1e3a8a;["']>([\s\S]*?)<\/strong>/i);
  if (systemTitleMatch) {
    title = cleanHtmlText(systemTitleMatch[1]);
  }

  const systemSubjMatch = rawContent.match(/Môn(?:\s+học)?[:.]?\s*<strong>([\s\S]*?)<\/strong>/i);
  if (systemSubjMatch) {
    subject = cleanHtmlText(systemSubjMatch[1]);
  }

  // Nếu chưa có, quét các thẻ tiêu đề (h1, h2, h3, h4)
  if (!title || !subject) {
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, strong, b'));
    for (const h of headings) {
      const text = cleanHtmlText(h.innerHTML || h.textContent || '');
      if (!title && (text.includes('ĐỀ THI') || text.includes('BÀI KIỂM TRA') || text.includes('ĐÁNH GIÁ'))) {
        title = text;
      } else if (!subject && (text.includes('MÔN') || text.includes('HỌC PHẦN') || text.includes('CHỦ ĐỀ'))) {
        subject = text.replace(/^(?:MÔN HỌC|MÔN|HỌC PHẦN)[:.]\s*/i, '').trim();
      }
    }
  }

  if (!title) {
    const pageTitle = doc.querySelector('title')?.textContent?.trim();
    if (pageTitle && !pageTitle.toLowerCase().includes('export')) {
      title = pageTitle;
    } else {
      title = defaultName.replace(/\.[^/.]+$/, '');
    }
  }

  // 2. Tìm thời gian làm bài (ví dụ: "Thời gian làm bài: 90 phút")
  const allText = doc.body ? (doc.body.textContent || '') : rawContent;
  const timeMatch = allText.match(/Thời gian(?:\s+làm bài)?[:.]?\s*(\d+)\s*phút/i);
  if (timeMatch && timeMatch[1]) {
    timeLimitMinutes = parseInt(timeMatch[1], 10);
  }

  // 3. Trích xuất Bảng Đáp Án & Lời giải chi tiết ở cuối đề thi
  const answerMap = extractAnswerMapFromHtml(doc, rawContent);
  const explMap = extractExplanationsMap(rawContent);

  // 4. Tìm và bóc tách các câu hỏi
  let questions: QuizQuestion[] = [];

  // === CHIẾN LƯỢC ĐẶC BIỆT (ƯU TIÊN SỐ 1): Nhận diện mẫu Word HTML hệ thống xuất bản ===
  // Cấu trúc: Các khối có `<strong>Câu \d+...:</strong>` kèm bảng phương án A/B/C/D hoặc tự luận
  const mainExamHtml = rawContent.split(/(?:BẢNG ĐÁP ÁN|HƯỚNG DẪN CHẤM|-------- HẾT --------)/i)[0];
  const exportedQuestionRegex = /<strong>\s*Câu\s*(\d+)(?:\s*\(([^)]+)\))?\s*:\s*<\/strong>([\s\S]*?)(?=(?:<strong>\s*Câu\s*\d+|PHẦN II|<\/body|$))/gi;
  const exportedMatches = [...mainExamHtml.matchAll(exportedQuestionRegex)];

  if (exportedMatches.length >= 2) {
    exportedMatches.forEach(m => {
      const qNum = parseInt(m[1], 10);
      const typeHint = (m[2] || '').trim().toLowerCase();
      const blockHtml = m[3];

      // Điểm số nếu có (vd: "(0.5 điểm)")
      let points = 1;
      const ptsMatch = blockHtml.match(/\((\d+(?:\.\d+)?)\s*điểm\)/i);
      if (ptsMatch) points = parseFloat(ptsMatch[1]);

      // Tách nội dung câu hỏi (lấy phần trước <table> hoặc thẻ dòng kẻ tự luận)
      const qTextRaw = blockHtml.split(/<table|<div\s+style=|<p\s+style=["']margin:4px\s+0\s+8px\s+0/i)[0];
      let cleanQText = cleanHtmlText(qTextRaw);
      cleanQText = cleanQText.replace(/\(\d+(?:\.\d+)?\s*điểm\)/i, '').trim();

      // Kiểm tra ảnh nếu có
      let detectedImageUrl: string | undefined = undefined;
      const imgMatch = blockHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) {
        detectedImageUrl = imgMatch[1];
      }

      // Trích xuất các lựa chọn A., B., C., D. từ bảng <td> hoặc các dòng văn bản
      const options: string[] = [];
      const tdMatches = [...blockHtml.matchAll(/<td[^>]*>[\s\S]*?<strong>\s*([A-D])\.\s*<\/strong>([\s\S]*?)<\/td>/gi)];
      if (tdMatches.length > 0) {
        tdMatches.forEach(tdm => {
          options.push(cleanHtmlText(tdm[2]));
        });
      } else {
        // Fallback: Tìm các ô td bắt đầu bằng A., B., C., D.
        const generalTdMatches = [...blockHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
        generalTdMatches.forEach(tdm => {
          const t = cleanHtmlText(tdm[1]);
          if (/^[A-D][.:)]/i.test(t)) {
            options.push(t.replace(/^[A-D][.:)]\s*/i, '').trim());
          }
        });
      }

      // Xác định loại câu hỏi
      let qType: QuestionType = 'choice';
      if (typeHint.includes('tự luận') || typeHint.includes('essay')) {
        qType = 'essay';
      } else if (typeHint.includes('nối') || typeHint.includes('matching')) {
        qType = 'matching';
      } else if (typeHint.includes('điền') || typeHint.includes('fill')) {
        qType = 'fill_blank';
      } else if (options.length === 0) {
        qType = 'essay';
      }

      // Xác định đáp án đúng & Lời giải
      const correctLetter = answerMap[qNum];
      let correctAnswer = '';
      if (qType === 'choice') {
        if (correctLetter) {
          const lIdx = ['A', 'B', 'C', 'D'].indexOf(correctLetter);
          if (lIdx >= 0 && options[lIdx]) {
            correctAnswer = options[lIdx];
          }
        }
        if (!correctAnswer && explMap[qNum]?.correctText) {
          correctAnswer = explMap[qNum].correctText;
        }
        if (!correctAnswer && options.length > 0) {
          correctAnswer = options[0];
        }
      } else {
        correctAnswer = explMap[qNum]?.correctText || '';
      }

      const explanation = explMap[qNum]?.explanation ||
        (correctLetter ? `Đáp án đúng là phương án ${correctLetter}: ${correctAnswer}.` : undefined);

      if (cleanQText) {
        const { cleanText: finalQText, imageUrl: finalImgUrl } = extractQuestionImage(cleanQText, detectedImageUrl);
        questions.push({
          id: `imp-${Date.now()}-${qNum}`,
          type: qType,
          difficulty: assignSmartDifficulty(qNum, exportedMatches.length),
          question: finalQText,
          imageUrl: finalImgUrl || undefined,
          options: options.length >= 2 ? options : undefined,
          correctAnswer: correctAnswer || undefined,
          points,
          explanation
        });
      }
    });
  }

  // === CHIẾN LƯỢC 1: Cấu trúc danh sách <ol> (Rất phổ biến trong file Word thông thường) ===
  if (questions.length === 0) {
    const olElements = Array.from(doc.querySelectorAll('ol'));
    for (const ol of olElements) {
      const directLis = Array.from(ol.children).filter(el => el.tagName.toLowerCase() === 'li');
      if (directLis.length === 0) continue;

      const olQuestions: QuizQuestion[] = [];
      directLis.forEach((li) => {
        const qNum = questions.length + olQuestions.length + 1;
        let options: string[] = [];
        let detectedAnswerLetter = '';

        // Kiểm tra xem li có chứa danh sách con ul / ol làm phương án lựa chọn không
        const nestedList = li.querySelector('ul, ol');
        if (nestedList) {
          const optLis = Array.from(nestedList.querySelectorAll('li'));
          options = optLis.map(optLi => {
            const raw = (optLi.textContent || '').trim();
            if (optLi.querySelector('b, strong, u') || raw.startsWith('*')) {
              const letterMatch = raw.match(/^[*]?\s*([A-D])[.:)]/i);
              if (letterMatch) detectedAnswerLetter = letterMatch[1].toUpperCase();
            }
            return raw.replace(/^[A-D][.:)]\s*/i, '').trim();
          }).filter(Boolean);
        } else {
          // Tìm các thẻ con p, div, span bắt đầu bằng A., B., C., D.
          const childNodes = Array.from(li.querySelectorAll('p, div, span, li, td'));
          childNodes.forEach(node => {
            const txt = (node.textContent || '').trim();
            if (/^[A-D][.:)]\s*/i.test(txt)) {
              if (node.querySelector('b, strong, u') || txt.startsWith('*')) {
                const letterMatch = txt.match(/^[*]?\s*([A-D])[.:)]/i);
                if (letterMatch) detectedAnswerLetter = letterMatch[1].toUpperCase();
              }
              options.push(txt.replace(/^[A-D][.:)]\s*/i, '').trim());
            }
          });

          // Nếu vẫn chưa có options, tìm dạng inline A. ... B. ... C. ... D. ...
          if (options.length === 0) {
            const liText = (li.textContent || '').trim();
            if (liText.includes('A.') && liText.includes('B.')) {
              const parts = liText.split(/(?=[A-D][.:)])/);
              parts.forEach(part => {
                if (/^[A-D][.:)]/i.test(part.trim())) {
                  options.push(part.trim().replace(/^[A-D][.:)]\s*/i, ''));
                }
              });
            }
          }
        }

        // Kiểm tra xem trong li có ảnh hay không
        const imgEl = li.querySelector('img');
        const detectedImageUrl = imgEl ? (imgEl.getAttribute('src') || '') : '';

        // Lấy nội dung câu hỏi: clone thẻ li và loại bỏ các thẻ ul, ol, table
        const cloneLi = li.cloneNode(true) as HTMLElement;
        cloneLi.querySelectorAll('ul, ol, table').forEach(n => n.remove());
        const qText = (cloneLi.textContent || '')
          .trim()
          .replace(/^Câu\s*\d+[:.]\s*/i, '')
          .replace(/^\d+[:.)/]\s*/i, '')
          .trim();

        // Kiểm tra đáp án ghi chú trực tiếp trong câu: ví dụ "Đáp án: B"
        const inlineAnsMatch = (li.textContent || '').match(/(?:Đáp án|Đ\/A|Key|Answer)[:.]?\s*([A-D])\b/i);
        if (inlineAnsMatch) {
          detectedAnswerLetter = inlineAnsMatch[1].toUpperCase();
        }

        if (qText && options.length >= 2) {
          const { cleanText: finalQText, imageUrl: finalImgUrl } = extractQuestionImage(qText, detectedImageUrl);
          const correctLetter = answerMap[qNum] || detectedAnswerLetter;
          let correctAnswer = options[0];
          if (correctLetter) {
            const letterIdx = ['A', 'B', 'C', 'D'].indexOf(correctLetter);
            if (letterIdx >= 0 && options[letterIdx]) {
              correctAnswer = options[letterIdx];
            }
          }

          olQuestions.push({
            id: `imp-${Date.now()}-${qNum}`,
            type: 'choice',
            difficulty: assignSmartDifficulty(qNum, directLis.length),
            question: finalQText,
            imageUrl: finalImgUrl || undefined,
            options,
            correctAnswer,
            points: 1,
            explanation: `Đáp án đúng là phương án ${correctLetter || 'A'}: ${correctAnswer}.`
          });
        }
      });

      if (olQuestions.length >= 2) {
        questions = [...questions, ...olQuestions];
      }
    }
  }

  // === CHIẾN LƯỢC 2: Thẻ có class .question hoặc [data-question] ===
  if (questions.length === 0) {
    const questionDivs = Array.from(doc.querySelectorAll('.question, [data-question]'));
    if (questionDivs.length > 0) {
      questionDivs.forEach((qDiv, idx) => {
        const qNum = idx + 1;
        const paragraphs = Array.from(qDiv.querySelectorAll('p'));
        let questionText = '';
        const options: string[] = [];

        paragraphs.forEach(p => {
          const text = (p.textContent || '').trim();
          if (p.classList.contains('options')) {
            const spans = p.querySelectorAll('span, td');
            if (spans.length > 0) {
              spans.forEach(sp => {
                const optText = (sp.textContent || '').trim().replace(/^[A-D][.:)]\s*/i, '');
                if (optText) options.push(optText);
              });
            } else {
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

        if (options.length === 0) {
          const spans = qDiv.querySelectorAll('span, td');
          spans.forEach(sp => {
            const t = (sp.textContent || '').trim();
            if (/^[A-D][.:)]/i.test(t)) {
              options.push(t.replace(/^[A-D][.:)]\s*/i, ''));
            }
          });
        }

        const imgEl = qDiv.querySelector('img');
        const detectedImageUrl = imgEl ? (imgEl.getAttribute('src') || '') : '';

        if (questionText && options.length >= 2) {
          const { cleanText: finalQText, imageUrl: finalImgUrl } = extractQuestionImage(questionText, detectedImageUrl);
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
            question: finalQText,
            imageUrl: finalImgUrl || undefined,
            options,
            correctAnswer,
            points: 1,
            explanation: `Đáp án đúng là phương án ${correctLetter || 'A'}: ${correctAnswer}.`
          });
        }
      });
    }
  }

  // === CHIẾN LƯỢC 3: Quét theo các khối Câu 1: / 1. / Bài 1: qua danh sách thẻ văn bản ===
  if (questions.length === 0) {
    const rawParagraphs = Array.from(doc.querySelectorAll('p, div, li, h3, h4'))
      .map(el => (el.textContent || '').trim())
      .filter(Boolean);

    let currentQText = '';
    let currentOptions: string[] = [];
    let currentQNum = 0;
    let detectedAnswer = '';

    const finalizeCurrent = () => {
      if (currentQText && currentOptions.length >= 2) {
        const { cleanText: finalQText, imageUrl: finalImgUrl } = extractQuestionImage(currentQText);
        const qNum = currentQNum || questions.length + 1;
        const correctLetter = answerMap[qNum] || detectedAnswer;
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
          difficulty: assignSmartDifficulty(qNum, Math.max(10, questions.length + 1)),
          question: finalQText,
          imageUrl: finalImgUrl || undefined,
          options: [...currentOptions],
          correctAnswer,
          points: 1,
          explanation: `Đáp án đúng là phương án ${correctLetter || 'A'}: ${correctAnswer}.`
        });
      }
      currentQText = '';
      currentOptions = [];
      detectedAnswer = '';
    };

    rawParagraphs.forEach(pText => {
      // Dừng nếu bắt đầu vào bảng đáp án
      if (/^ĐÁP ÁN VÀ THANG ĐIỂM/i.test(pText) || /^BẢNG ĐÁP ÁN/i.test(pText)) {
        finalizeCurrent();
        return;
      }

      const qMatch = pText.match(/^(?:Câu|Bài|Question|Q)\s*(\d+)[:.]\s*(.+)/i) || pText.match(/^(\d+)[\.:\)]\s+(.+)/);
      if (qMatch) {
        finalizeCurrent();
        currentQNum = parseInt(qMatch[1], 10);
        currentQText = qMatch[2].trim();
      } else if (/^[A-D][.:)]\s*/i.test(pText)) {
        currentOptions.push(pText.replace(/^[A-D][.:)]\s*/i, '').trim());
      } else if (pText.includes('A.') && pText.includes('B.')) {
        const parts = pText.split(/(?=[A-D][.:)])/);
        parts.forEach(part => {
          const optClean = part.replace(/^[A-D][.:)]\s*/i, '').trim();
          if (optClean) currentOptions.push(optClean);
        });
      } else if (/(?:Đáp án|Đ\/A|Key)[:.]?\s*([A-D])\b/i.test(pText)) {
        const m = pText.match(/(?:Đáp án|Đ\/A|Key)[:.]?\s*([A-D])\b/i);
        if (m) detectedAnswer = m[1].toUpperCase();
      }
    });

    finalizeCurrent();
  }

  // Cập nhật lại phân bổ độ khó theo tỷ lệ tổng số câu hỏi đã tìm thấy
  if (questions.length > 0) {
    questions = questions.map((q, idx) => ({
      ...q,
      difficulty: q.difficulty || assignSmartDifficulty(idx + 1, questions.length)
    }));
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

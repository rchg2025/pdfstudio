import type { QuizQuestion } from '../types/quiz';

export interface ExamExportOptions {
  title: string;
  subject: string;
  timeLimitMinutes: number;
  schoolName?: string;
  departmentName?: string;
  examCode?: string;
  note?: string;
  includeAnswersTable?: boolean;
  includeExplanations?: boolean;
}

/**
 * Tạo file Word (.doc) tương thích 100% với MS Word và trình parser của hệ thống.
 * Sử dụng định dạng HTML chuẩn Office (MIME: application/msword) có đầy đủ xmlns và css chuẩn in ấn.
 */
export function generateExamWordDoc(
  questions: QuizQuestion[],
  options: ExamExportOptions
): Blob {
  const {
    title = 'BÀI THI / KIỂM TRA ĐÁNH GIÁ',
    subject = 'Chung',
    timeLimitMinutes = 60,
    schoolName = 'BỘ GIÁO DỤC VÀ ĐÀO TẠO',
    departmentName = 'TRƯỜNG ĐẠI HỌC / CAO ĐẲNG',
    examCode = Math.floor(100 + Math.random() * 900).toString(),
    note = 'Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.',
    includeAnswersTable = true,
    includeExplanations = true
  } = options;

  // Phân loại câu hỏi: trắc nghiệm (choice, multiple_choice) và tự luận / thực hành / điền khuyết / nối
  const choiceQuestions = questions.filter(q => q.type === 'choice' || q.type === 'multiple_choice');
  const otherQuestions = questions.filter(q => q.type !== 'choice' && q.type !== 'multiple_choice');

  let bodyHtml = `
    <!-- PHẦN TIÊU ĐỀ ĐỀ THI CHUẨN SƯ PHẠM -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
      <tr>
        <td style="width:45%;text-align:center;vertical-align:top;font-size:13pt;">
          <strong>${escapeXml(schoolName)}</strong><br/>
          <strong>${escapeXml(departmentName)}</strong><br/>
          <div style="margin:4px auto;width:120px;border-bottom:1px solid #000;"></div>
        </td>
        <td style="width:55%;text-align:center;vertical-align:top;font-size:13pt;">
          <strong>ĐỀ THI KIỂM TRA ĐÁNH GIÁ</strong><br/>
          <strong style="color:#1e3a8a;">${escapeXml(title.toUpperCase())}</strong><br/>
          <span>Môn học: <strong>${escapeXml(subject)}</strong></span><br/>
          <span>Thời gian làm bài: <strong>${timeLimitMinutes} phút</strong></span><br/>
          <span style="font-size:11pt;font-style:italic;">Mã đề thi: <strong>${examCode}</strong></span>
        </td>
      </tr>
    </table>

    <div style="margin-bottom:14px;padding:6px 10px;border:1px dashed #64748b;font-size:11pt;font-style:italic;background-color:#f8fafc;">
      * Lưu ý: ${escapeXml(note)}
    </div>
  `;

  // === PHẦN I: TRẮC NGHIỆM KHÁCH QUAN ===
  if (choiceQuestions.length > 0) {
    bodyHtml += `
      <div style="font-size:13pt;font-weight:bold;margin:16px 0 10px;color:#1e3a8a;border-bottom:1.5px solid #1e3a8a;padding-bottom:3px;">
        PHẦN I. TRẮC NGHIỆM KHÁCH QUAN (${choiceQuestions.length} câu)
      </div>
    `;

    choiceQuestions.forEach((q, idx) => {
      const qNum = idx + 1;
      const opts = q.options && q.options.length > 0 ? q.options : ['A', 'B', 'C', 'D'];

      bodyHtml += `
        <div class="question question-choice" data-question="${qNum}" data-type="choice" style="margin-bottom:12px;font-size:12pt;line-height:1.4;">
          <p class="question-text" style="margin:0 0 4px 0;">
            <strong>Câu ${qNum}:</strong> ${escapeXml(q.question)}
            ${q.points ? `<span style="font-size:10pt;color:#64748b;"> (${q.points} điểm)</span>` : ''}
          </p>
      `;

      if (q.imageUrl) {
        bodyHtml += `
          <p style="margin:4px 0 8px 0;text-align:center;">
            <img src="${q.imageUrl}" alt="Hình ảnh câu hỏi ${qNum}" style="max-width:480px;height:auto;border:1px solid #ccc;" />
          </p>
        `;
      }

      // Bố trí đáp án dạng bảng 2 hoặc 4 cột tùy độ dài phương án
      const isLongOptions = opts.some(o => o.length > 35);
      if (isLongOptions) {
        // Mỗi phương án 1 dòng
        bodyHtml += `<table class="options-table" style="width:100%;border-collapse:collapse;margin:4px 0;">`;
        opts.forEach((opt, oIdx) => {
          const char = String.fromCharCode(65 + oIdx);
          bodyHtml += `
            <tr>
              <td class="option-cell" style="padding:2px 8px;vertical-align:top;width:100%;">
                <strong>${char}.</strong> ${escapeXml(opt)}
              </td>
            </tr>
          `;
        });
        bodyHtml += `</table>`;
      } else {
        // 2 cột / dòng (hoặc 4 cột)
        bodyHtml += `<table class="options-table" style="width:100%;border-collapse:collapse;margin:4px 0;"><tr>`;
        opts.forEach((opt, oIdx) => {
          const char = String.fromCharCode(65 + oIdx);
          bodyHtml += `
            <td class="option-cell" style="padding:2px 6px;vertical-align:top;width:25%;">
              <strong>${char}.</strong> ${escapeXml(opt)}
            </td>
          `;
          if ((oIdx + 1) % 4 === 0 && oIdx + 1 < opts.length) {
            bodyHtml += `</tr><tr>`;
          }
        });
        bodyHtml += `</tr></table>`;
      }

      bodyHtml += `</div>`;
    });
  }

  // === PHẦN II: TỰ LUẬN / THỰC HÀNH ===
  if (otherQuestions.length > 0) {
    bodyHtml += `
      <div style="font-size:13pt;font-weight:bold;margin:24px 0 10px;color:#1e3a8a;border-bottom:1.5px solid #1e3a8a;padding-bottom:3px;">
        PHẦN II. TỰ LUẬN / THỰC HÀNH / TÌNH HUỐNG (${otherQuestions.length} câu)
      </div>
    `;

    otherQuestions.forEach((q, idx) => {
      const qNum = choiceQuestions.length + idx + 1;
      const typeLabel = q.type === 'essay' ? 'Tự luận' : (q.type === 'matching' ? 'Nối cặp' : 'Điền khuyết');

      bodyHtml += `
        <div class="question question-${q.type}" data-question="${qNum}" data-type="${q.type}" style="margin-bottom:14px;font-size:12pt;line-height:1.5;">
          <p class="question-text" style="margin:0 0 4px 0;">
            <strong>Câu ${qNum} (${typeLabel}):</strong> ${escapeXml(q.question)}
            ${q.points ? `<span style="font-size:10pt;color:#64748b;"> (${q.points} điểm)</span>` : ''}
          </p>
      `;

      if (q.imageUrl) {
        bodyHtml += `
          <p style="margin:4px 0 8px 0;text-align:center;">
            <img src="${q.imageUrl}" alt="Hình ảnh minh họa" style="max-width:480px;height:auto;border:1px solid #ccc;" />
          </p>
        `;
      }

      if (q.type === 'matching' && q.matchingPairs && q.matchingPairs.length > 0) {
        bodyHtml += `
          <table style="width:100%;border-collapse:collapse;margin:6px 0;border:1px solid #cbd5e1;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:6px;border:1px solid #cbd5e1;text-align:left;width:50%;">Cột A (Vấn đề / Khái niệm)</th>
                <th style="padding:6px;border:1px solid #cbd5e1;text-align:left;width:50%;">Cột B (Mô tả / Ghép cặp)</th>
              </tr>
            </thead>
            <tbody>
        `;
        q.matchingPairs.forEach((p, pIdx) => {
          bodyHtml += `
            <tr>
              <td style="padding:6px;border:1px solid #cbd5e1;">${pIdx + 1}. ${escapeXml(p.left)}</td>
              <td style="padding:6px;border:1px solid #cbd5e1;">${String.fromCharCode(65 + pIdx)}. ${escapeXml(p.right)}</td>
            </tr>
          `;
        });
        bodyHtml += `</tbody></table>`;
      } else {
        // Dòng kẻ tự luận cho sinh viên làm bài
        bodyHtml += `
          <div style="margin:8px 0 16px 0;color:#94a3b8;font-style:italic;">
            (Thí sinh làm bài vào khoảng trống dưới đây)
            <div style="margin-top:6px;border-bottom:1px dotted #cbd5e1;height:24px;"></div>
            <div style="margin-top:6px;border-bottom:1px dotted #cbd5e1;height:24px;"></div>
            <div style="margin-top:6px;border-bottom:1px dotted #cbd5e1;height:24px;"></div>
            <div style="margin-top:6px;border-bottom:1px dotted #cbd5e1;height:24px;"></div>
          </div>
        `;
      }

      bodyHtml += `</div>`;
    });
  }

  bodyHtml += `
    <div style="text-align:center;margin:28px 0 20px;font-size:12pt;font-weight:bold;letter-spacing:2px;">
      -------------------- HẾT --------------------
    </div>
  `;

  // === PHẦN BẢNG ĐÁP ÁN VÀ THANG ĐIỂM CHUẨN ĐỂ IMPORT LẠI VÀO PHẦN MỀM ===
  if (includeAnswersTable && choiceQuestions.length > 0) {
    bodyHtml += `
      <div style="page-break-before:always;margin-top:30px;">
        <h3 style="text-align:center;font-size:14pt;font-weight:bold;margin-bottom:6px;color:#1e3a8a;">
          BẢNG ĐÁP ÁN VÀ THANG ĐIỂM
        </h3>
        <p style="text-align:center;font-size:11pt;font-style:italic;margin-top:0;margin-bottom:14px;color:#64748b;">
          (Mã đề: ${examCode} - Dành cho Giảng viên / Cán bộ chấm thi)
        </p>

        <table class="answers-table" style="width:100%;border-collapse:collapse;margin:10px auto;border:1px solid #000;text-align:center;font-size:11pt;">
          <thead>
            <tr style="background-color:#e2e8f0;font-weight:bold;">
    `;

    // Tạo hàng tiêu đề bảng đáp án: STT | Đ/A (chia nhóm 10 câu / bảng hoặc lưới ngang)
    const totalCols = Math.min(choiceQuestions.length, 10);
    for (let c = 1; c <= totalCols; c++) {
      bodyHtml += `<th style="padding:6px;border:1px solid #000;width:${100/totalCols}%;">Câu ${c}</th>`;
    }
    bodyHtml += `</tr></thead><tbody><tr>`;

    choiceQuestions.slice(0, totalCols).forEach((q) => {
      let ansLetter = 'A';
      if (q.options && q.correctAnswer) {
        const cIdx = q.options.indexOf(q.correctAnswer);
        if (cIdx >= 0) ansLetter = String.fromCharCode(65 + cIdx);
        else ansLetter = q.correctAnswer;
      }
      bodyHtml += `<td style="padding:6px;border:1px solid #000;font-weight:bold;color:#b91c1c;">${escapeXml(ansLetter)}</td>`;
    });
    bodyHtml += `</tr>`;

    // Nếu có nhiều hơn 10 câu, tiếp tục in các hàng kế tiếp
    if (choiceQuestions.length > 10) {
      for (let start = 10; start < choiceQuestions.length; start += 10) {
        const chunk = choiceQuestions.slice(start, start + 10);
        bodyHtml += `<tr style="background-color:#e2e8f0;font-weight:bold;">`;
        for (let i = 0; i < 10; i++) {
          if (i < chunk.length) {
            bodyHtml += `<th style="padding:6px;border:1px solid #000;">Câu ${start + i + 1}</th>`;
          } else {
            bodyHtml += `<th style="padding:6px;border:1px solid #000;"></th>`;
          }
        }
        bodyHtml += `</tr><tr>`;
        for (let i = 0; i < 10; i++) {
          if (i < chunk.length) {
            const q = chunk[i];
            let ansLetter = 'A';
            if (q.options && q.correctAnswer) {
              const cIdx = q.options.indexOf(q.correctAnswer);
              if (cIdx >= 0) ansLetter = String.fromCharCode(65 + cIdx);
              else ansLetter = q.correctAnswer;
            }
            bodyHtml += `<td style="padding:6px;border:1px solid #000;font-weight:bold;color:#b91c1c;">${escapeXml(ansLetter)}</td>`;
          } else {
            bodyHtml += `<td style="padding:6px;border:1px solid #000;"></td>`;
          }
        }
        bodyHtml += `</tr>`;
      }
    }

    bodyHtml += `</tbody></table>`;
  }

  // Hướng dẫn giải chi tiết
  if (includeExplanations && questions.some(q => q.explanation || q.correctAnswer)) {
    bodyHtml += `
      <div class="explanations-section" style="margin-top:20px;">
        <h4 style="font-size:12pt;font-weight:bold;color:#1e3a8a;margin-bottom:8px;">
          HƯỚNG DẪN CHẤM & LỜI GIẢI CHI TIẾT:
        </h4>
    `;

    questions.forEach((q, idx) => {
      if (q.explanation || q.type !== 'choice') {
        bodyHtml += `
          <div class="explanation-item" data-question="${idx + 1}" style="margin-bottom:8px;font-size:11pt;line-height:1.4;">
            <strong>Câu ${idx + 1}:</strong> 
            ${q.correctAnswer ? `Đáp án đúng: <strong style="color:#b91c1c;">${escapeXml(q.correctAnswer)}</strong>. ` : ''}
            ${q.explanation ? `<em>${escapeXml(q.explanation)}</em>` : ''}
          </div>
        `;
      }
    });

    bodyHtml += `</div>`;
  }

  // Cấu trúc file MS Word HTML đầy đủ
  const fullDocument = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${escapeXml(title)}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: A4;
            margin: 2cm 2cm 2cm 2cm;
            mso-page-orientation: portrait;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            color: #000000;
            line-height: 1.35;
          }
          p { margin: 0 0 6pt 0; }
          table { font-family: 'Times New Roman', Times, serif; }
        </style>
      </head>
      <body>
        ${bodyHtml}
      </body>
    </html>
  `;

  return new Blob(['\ufeff', fullDocument], {
    type: 'application/msword;charset=utf-8'
  });
}

function escapeXml(unsafe?: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Tải file Word (.doc) về máy người dùng
 */
export function downloadExamDocFile(
  questions: QuizQuestion[],
  options: ExamExportOptions,
  filename?: string
) {
  const blob = generateExamWordDoc(questions, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = filename || `DeThi_${options.subject || 'MonHoc'}_${new Date().toISOString().slice(0, 10)}.doc`;
  a.download = safeName.endsWith('.doc') || safeName.endsWith('.docx') ? safeName : `${safeName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

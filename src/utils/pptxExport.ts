import pptxgen from 'pptxgenjs';

export interface SlideData {
  slideNumber: number;
  layout: 'title' | 'content' | 'two_column' | 'quiz' | 'quote' | 'summary';
  title: string;
  subtitle?: string;
  bullets?: string[];
  secondaryContent?: string[];
  quiz?: {
    question: string;
    options: string[];
    answer?: string;
    explanation?: string;
  };
  teacherNotes?: string;
  visualKeyword?: string;
}

export interface SlideDeckData {
  deckTitle: string;
  subject: string;
  gradeLevel: string;
  moduleType?: string;
  summary?: string;
  slides: SlideData[];
  lessonPlanOutline?: {
    objectives?: string;
    preparation?: string;
    timeline?: string;
  };
}

export interface ThemeConfig {
  id: string;
  name: string;
  primary: string; // Hex without #
  secondary: string;
  accent: string;
  background: string;
  cardBg: string;
  textColor: string;
  subTextColor: string;
  fontFace: string;
}

export const SLIDE_THEMES: Record<string, ThemeConfig> = {
  ocean_blue: {
    id: 'ocean_blue',
    name: 'Xanh Đại Dương (Trang Nhã)',
    primary: '1E3A8A', // Deep blue
    secondary: '3B82F6', // Blue
    accent: '06B6D4', // Cyan
    background: 'F8FAFC', // Slate 50
    cardBg: 'FFFFFF',
    textColor: '0F172A', // Slate 900
    subTextColor: '475569', // Slate 600
    fontFace: 'Arial'
  },
  emerald_forest: {
    id: 'emerald_forest',
    name: 'Xanh Lá Tươi Sáng (Môi Trường / Tự Nhiên)',
    primary: '065F46', // Emerald 800
    secondary: '10B981', // Emerald 500
    accent: 'F59E0B', // Amber
    background: 'F0FDF4', // Emerald 50
    cardBg: 'FFFFFF',
    textColor: '064E3B',
    subTextColor: '374151',
    fontFace: 'Arial'
  },
  sunset_orange: {
    id: 'sunset_orange',
    name: 'Cam Hoàng Hôn (Năng Động / Sáng Tạo)',
    primary: '9A3412', // Orange 800
    secondary: 'F97316', // Orange 500
    accent: 'E11D48', // Rose
    background: 'FFF7ED', // Orange 50
    cardBg: 'FFFFFF',
    textColor: '431407',
    subTextColor: '57534E',
    fontFace: 'Arial'
  },
  royal_purple: {
    id: 'royal_purple',
    name: 'Tím Quý Phái (Văn Học / Nghệ Thuật)',
    primary: '581C87', // Purple 900
    secondary: '8B5CF6', // Purple 500
    accent: 'EC4899', // Pink
    background: 'FAF5FF', // Purple 50
    cardBg: 'FFFFFF',
    textColor: '3B0764',
    subTextColor: '4B5563',
    fontFace: 'Arial'
  },
  dark_slate: {
    id: 'dark_slate',
    name: 'Dark Mode Hiện Đại (Công Nghệ)',
    primary: '38BDF8', // Sky 400
    secondary: '818CF8', // Indigo 400
    accent: '34D399', // Emerald 400
    background: '0F172A', // Slate 900
    cardBg: '1E293B', // Slate 800
    textColor: 'F8FAFC', // White
    subTextColor: '94A3B8', // Slate 400
    fontFace: 'Arial'
  }
};

/**
 * Xuất file PowerPoint chuẩn 16:9 (.pptx)
 */
export async function exportToPowerPoint(deck: SlideDeckData, themeId = 'ocean_blue') {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Tiện Ích ITE - AI Lesson Slide Studio';
  pptx.company = 'ITE Education';
  pptx.title = deck.deckTitle || 'Bài Giảng Điện Tử';

  const theme = SLIDE_THEMES[themeId] || SLIDE_THEMES.ocean_blue;

  deck.slides.forEach((slideItem, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: theme.background };

    // Header bar (trừ slide trang bìa nếu là title)
    if (slideItem.layout !== 'title' || index > 0) {
      // Dải trang trí trên đỉnh
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.12,
        fill: { color: theme.secondary }
      });

      // Số trang & watermark
      slide.addText(`Trang ${slideItem.slideNumber || index + 1} | ${deck.subject} - ${deck.gradeLevel}`, {
        x: 0.8,
        y: 7.0,
        w: 11.5,
        h: 0.35,
        fontSize: 10,
        fontFace: theme.fontFace,
        color: theme.subTextColor,
        align: 'left'
      });

      slide.addText('Hệ Thống Giáo Dục Cao Đẳng • Tiện Ích ITE', {
        x: 8.0,
        y: 7.0,
        w: 4.5,
        h: 0.35,
        fontSize: 10,
        fontFace: theme.fontFace,
        color: theme.subTextColor,
        align: 'right'
      });
    }

    // Ghi chú giảng viên (Speaker Notes)
    if (slideItem.teacherNotes) {
      slide.addNotes(slideItem.teacherNotes);
    }

    // LAYOUT 1: TITLE SLIDE
    if (slideItem.layout === 'title' && index === 0) {
      // Box trang trí nền
      slide.addShape(pptx.ShapeType.rect, {
        x: 1.0,
        y: 1.0,
        w: 11.33,
        h: 5.5,
        fill: { color: theme.cardBg },
        line: { color: theme.secondary, width: 2 }
      });

      // Tag môn học & khối lớp
      slide.addText(`BÀI GIẢNG HỆ CAO ĐẲNG • ${deck.subject.toUpperCase()} • ${deck.gradeLevel.toUpperCase()}`, {
        x: 1.5,
        y: 1.6,
        w: 10.33,
        h: 0.5,
        fontSize: 13,
        fontFace: theme.fontFace,
        color: theme.secondary,
        bold: true,
        align: 'center'
      });

      // Tiêu đề chính
      slide.addText(slideItem.title || deck.deckTitle, {
        x: 1.5,
        y: 2.3,
        w: 10.33,
        h: 1.8,
        fontSize: 32,
        fontFace: theme.fontFace,
        color: theme.primary,
        bold: true,
        align: 'center',
        valign: 'middle'
      });

      // Phụ đề
      if (slideItem.subtitle) {
        slide.addText(slideItem.subtitle, {
          x: 1.8,
          y: 4.3,
          w: 9.73,
          h: 0.8,
          fontSize: 16,
          fontFace: theme.fontFace,
          color: theme.subTextColor,
          italic: true,
          align: 'center'
        });
      }

      // Footer trang bìa
      slide.addText(`GIÁO TRÌNH ĐÀO TẠO NGHỀ BẬC CAO ĐẲNG • ${deck.moduleType || 'MÔ-ĐUN TÍCH HỢP'}`, {
        x: 1.5,
        y: 5.4,
        w: 10.33,
        h: 0.4,
        fontSize: 11,
        fontFace: theme.fontFace,
        color: theme.subTextColor,
        align: 'center'
      });
      return;
    }

    // CÁC LAYOUT NỘI DUNG THƯỜNG GẶP
    // 1. Tiêu đề slide
    slide.addText(slideItem.title, {
      x: 0.8,
      y: 0.5,
      w: 11.5,
      h: 0.8,
      fontSize: 24,
      fontFace: theme.fontFace,
      color: theme.primary,
      bold: true
    });

    if (slideItem.subtitle) {
      slide.addText(slideItem.subtitle, {
        x: 0.8,
        y: 1.25,
        w: 11.5,
        h: 0.4,
        fontSize: 13,
        fontFace: theme.fontFace,
        color: theme.subTextColor,
        italic: true
      });
    }

    const contentStartY = slideItem.subtitle ? 1.8 : 1.5;

    // LAYOUT 2: TWO_COLUMN
    if (slideItem.layout === 'two_column') {
      const colWidth = 5.5;

      // Cột 1
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: contentStartY,
        w: colWidth,
        h: 5.0,
        fill: { color: theme.cardBg },
        line: { color: theme.secondary, width: 1 },
        rectRadius: 0.1
      });

      const bullets1 = (slideItem.bullets || []).map((b) => ({
        text: b,
        options: {
          fontSize: 14,
          fontFace: theme.fontFace,
          color: theme.textColor,
          bullet: true,
          breakLine: true,
          spaceAfter: 12
        }
      }));

      slide.addText(bullets1.length ? bullets1 : [{ text: 'Nội dung cột trái', options: { fontSize: 14 } }], {
        x: 1.1,
        y: contentStartY + 0.3,
        w: colWidth - 0.6,
        h: 4.4,
        valign: 'top'
      });

      // Cột 2
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.8,
        y: contentStartY,
        w: colWidth,
        h: 5.0,
        fill: { color: theme.cardBg },
        line: { color: theme.accent, width: 1 },
        rectRadius: 0.1
      });

      const bullets2 = (slideItem.secondaryContent || []).map((b) => ({
        text: b,
        options: {
          fontSize: 14,
          fontFace: theme.fontFace,
          color: theme.textColor,
          bullet: true,
          breakLine: true,
          spaceAfter: 12
        }
      }));

      slide.addText(bullets2.length ? bullets2 : [{ text: 'Nội dung cột phải', options: { fontSize: 14 } }], {
        x: 7.1,
        y: contentStartY + 0.3,
        w: colWidth - 0.6,
        h: 4.4,
        valign: 'top'
      });
      return;
    }

    // LAYOUT 3: QUIZ / CÂU HỎI TRẮC NGHIỆM
    if (slideItem.layout === 'quiz' && slideItem.quiz) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: contentStartY,
        w: 11.5,
        h: 5.0,
        fill: { color: theme.cardBg },
        line: { color: theme.secondary, width: 1.5 },
        rectRadius: 0.1
      });

      // Câu hỏi
      slide.addText(`❓ Câu Hỏi Tương Tác: ${slideItem.quiz.question}`, {
        x: 1.2,
        y: contentStartY + 0.4,
        w: 10.7,
        h: 1.0,
        fontSize: 18,
        fontFace: theme.fontFace,
        color: theme.primary,
        bold: true
      });

      // Các phương án
      const optionsText = (slideItem.quiz.options || []).map((opt) => ({
        text: opt,
        options: {
          fontSize: 15,
          fontFace: theme.fontFace,
          color: theme.textColor,
          breakLine: true,
          spaceAfter: 10
        }
      }));

      slide.addText(optionsText, {
        x: 1.5,
        y: contentStartY + 1.5,
        w: 10.0,
        h: 2.2,
        valign: 'top'
      });

      // Đáp án gợi ý (ẩn hoặc để nhỏ ở góc)
      if (slideItem.quiz.answer) {
        slide.addText(`💡 Đáp án đúng: ${slideItem.quiz.answer} ${slideItem.quiz.explanation ? `(${slideItem.quiz.explanation})` : ''}`, {
          x: 1.5,
          y: contentStartY + 4.0,
          w: 10.0,
          h: 0.6,
          fontSize: 12,
          fontFace: theme.fontFace,
          color: theme.secondary,
          italic: true
        });
      }
      return;
    }

    // LAYOUT 4: QUOTE / THÔNG ĐIỆP
    if (slideItem.layout === 'quote') {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.5,
        y: contentStartY + 0.5,
        w: 10.33,
        h: 4.0,
        fill: { color: theme.cardBg },
        line: { color: theme.accent, width: 2 },
        rectRadius: 0.15
      });

      const quoteText = slideItem.bullets?.[0] || slideItem.title;
      slide.addText(`“ ${quoteText} ”`, {
        x: 2.0,
        y: contentStartY + 1.0,
        w: 9.33,
        h: 2.0,
        fontSize: 22,
        fontFace: theme.fontFace,
        color: theme.primary,
        italic: true,
        align: 'center',
        valign: 'middle'
      });

      if (slideItem.subtitle) {
        slide.addText(`— ${slideItem.subtitle}`, {
          x: 2.0,
          y: contentStartY + 3.1,
          w: 9.33,
          h: 0.5,
          fontSize: 14,
          fontFace: theme.fontFace,
          color: theme.subTextColor,
          bold: true,
          align: 'right'
        });
      }
      return;
    }

    // LAYOUT 5: TIÊU CHUẨN (CONTENT / SUMMARY)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: contentStartY,
      w: 11.5,
      h: 5.0,
      fill: { color: theme.cardBg },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.1
    });

    const bulletElements = (slideItem.bullets || []).map((bullet) => ({
      text: bullet,
      options: {
        fontSize: 16,
        fontFace: theme.fontFace,
        color: theme.textColor,
        bullet: true,
        breakLine: true,
        spaceAfter: 14
      }
    }));

    slide.addText(bulletElements.length ? bulletElements : [{ text: 'Nội dung bài học', options: { fontSize: 16 } }], {
      x: 1.2,
      y: contentStartY + 0.4,
      w: 10.7,
      h: 4.2,
      valign: 'top'
    });
  });

  const fileName = `${(deck.deckTitle || 'Bai_Giang_Dien_Tu').replace(/[\s/\\?%*:|"<>]/g, '_')}.pptx`;
  await pptx.writeFile({ fileName });
}

/**
 * Xuất kế hoạch bài dạy / Giáo án Word (.doc HTML định dạng tải về) chuẩn đào tạo Cao Đẳng
 */
export function exportLessonPlanDocx(deck: SlideDeckData) {
  const htmlContent = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>Giáo án bài giảng - ${deck.deckTitle}</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #000; }
      h1 { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 4px; text-transform: uppercase; }
      h2 { font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 20px; }
      h3 { font-size: 13pt; font-weight: bold; color: #1e3a8a; margin-top: 16px; margin-bottom: 6px; }
      p { margin: 4px 0; }
      ul { margin: 4px 0 10px 24px; padding: 0; }
      li { margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; }
      th, td { border: 1px solid #333; padding: 6px 10px; font-size: 12pt; vertical-align: top; }
      th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
      .header-table { width: 100%; margin-bottom: 18px; border: none; }
      .header-table td { border: none; padding: 2px; }
    </style>
  </head>
  <body>
    <table class="header-table">
      <tr>
        <td style="text-align: left; width: 50%;"><strong>TRƯỜNG CAO ĐẲNG:</strong> .....................................<br><strong>KHOA / BỘ MÔN:</strong> ..............................</td>
        <td style="text-align: right; width: 50%;"><strong>GIẢNG VIÊN:</strong> ....................................<br><strong>MÔN / MÔ-ĐUN:</strong> ${deck.subject}<br><strong>BẬC ĐÀO TẠO:</strong> ${deck.gradeLevel}</td>
      </tr>
    </table>

    <h1>GIÁO ÁN BÀI GIẢNG HỆ CAO ĐẲNG</h1>
    <h2>BÀI DẠY: ${deck.deckTitle.toUpperCase()}</h2>
    <p style="text-align: center; font-style: italic;">Hình thức: ${deck.moduleType || 'Tích hợp Lý thuyết - Thực hành'} | Thời lượng: Theo đề cương môn học</p>

    <h3>I. MỤC TIÊU BÀI DẠY (CHUẨN ĐẦU RA CAO ĐẲNG)</h3>
    <p><strong>1. Kiến thức nghề:</strong></p>
    <p>${deck.lessonPlanOutline?.objectives || deck.summary || 'Trang bị các kiến thức chuyên môn, nguyên lý hoạt động và quy trình kỹ thuật chuẩn nghề.'}</p>
    <p><strong>2. Kỹ năng thực hành:</strong></p>
    <ul>
      <li>Thực hiện thành thạo các bước thao tác kỹ thuật theo đúng quy trình công nghệ.</li>
      <li>Vận dụng phân tích, chẩn đoán và khắc phục sự cố / lỗi kỹ thuật phát sinh trong thực tế.</li>
      <li>Sử dụng đúng cách và an toàn các trang thiết bị, công cụ, phần mềm chuyên dụng.</li>
    </ul>
    <p><strong>3. Năng lực tự chủ và trách nhiệm:</strong> Tuân thủ nghiêm ngặt quy định an toàn lao động, tác phong công nghiệp và tinh thần làm việc nhóm.</p>

    <h3>II. ĐIỀU KIỆN THỰC HIỆN BÀI DẠY</h3>
    <p><strong>1. Phòng học & Thiết bị dạy học:</strong> ${deck.lessonPlanOutline?.preparation || 'Phòng học lý thuyết / Phòng Lab máy tính / Xưởng thực hành, máy chiếu, bộ slide bài giảng PPTX điện tử, phiếu giao việc.'}</p>
    <p><strong>2. Học liệu & Tài liệu tham khảo:</strong> Giáo trình môn học / Mô-đun đào tạo hệ Cao đẳng, tiêu chuẩn kỹ thuật liên quan.</p>

    <h3>III. TIẾN TRÌNH THỰC HIỆN BÀI DẠY</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 15%;">Nội dung / Hoạt động</th>
          <th style="width: 30%;">Nội dung trọng tâm & Quy trình</th>
          <th style="width: 35%;">Hoạt động dạy học (Giảng viên thị phạm / Sinh viên thực hành)</th>
          <th style="width: 20%;">Thời gian & Đánh giá</th>
        </tr>
      </thead>
      <tbody>
        ${deck.slides.map((s) => `
          <tr>
            <td><strong>Slide ${s.slideNumber}: ${s.layout.toUpperCase()}</strong></td>
            <td><strong>${s.title}</strong><br>${s.subtitle ? `<em>${s.subtitle}</em><br>` : ''}${s.bullets ? s.bullets.join('<br>') : ''}</td>
            <td>
              <strong>Hướng dẫn giảng viên:</strong><br>
              ${s.teacherNotes || 'Giảng giải nguyên lý, thị phạm thao tác mẫu và hướng dẫn sinh viên thực hiện.'}
              ${s.quiz ? `<br><br><strong>Tình huống / Kiểm tra:</strong> ${s.quiz.question}<br>Đáp án: ${s.quiz.answer}` : ''}
            </td>
            <td>Sinh viên quan sát, ghi nhớ quy trình và thao tác thực hành.</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h3>IV. ĐÁNH GIÁ VÀ HƯỚNG DẪN TỰ HỌC</h3>
    <p>- Nhận xét thái độ, kết quả thao tác thực hành của các nhóm sinh viên tại xưởng/phòng Lab.</p>
    <p>- Giao phiếu bài tập thực hành nâng cao và dặn dò chuẩn bị cho bài học tiếp theo.</p>
  </body>
  </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Giao_An_Cao_Dang_${(deck.deckTitle || 'Bai_Day').replace(/[\s/\\?%*:|"<>]/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

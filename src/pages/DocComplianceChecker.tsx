import React, { useState, useRef, useEffect } from 'react';
import {
  FileCheck2,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  ShieldCheck,
  SpellCheck,
  RefreshCw,
  Search,
  ArrowRight,
  Info,
  Check,
  Key,
  Trash2,
  ExternalLink,
  Layers,
  Globe,
  BookOpen,
  PieChart,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { useNotification } from '../contexts/NotificationContext';
import type { DocumentComplianceResult, PlagiarismSourceMatch, SuspiciousPassage } from '../types/docCompliance';
import './DocComplianceChecker.css';

// Thiết lập worker pdfjs an toàn
try {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }
} catch {}

const SAMPLE_TEXT = `NGHIÊN CỨU VỀ PHÁT TRIỂN KINH TẾ SỐ VÀ CÁC THÁCH THỨC ĐẶT RA

1. Đặt vấn đề và bối cảnh nghiên cứu
Trong bối cảnh toàn cầu hóa và cách mạng công nghiệp lần thứ tư, nền kinh tế số đang chứng kiến sự thay đổi sâu xắc về cả phương thức sản xuất lẩn mô hình quản trị. Kinh tế số không chỉ đơn thuần là việc số hoá các hoạt động kinh doanh truyền thống mà là sự tái cấu trúc toàn diện chuỗi giá trị nhằm tối ưu hóa nguồn lực xã hội.

2. Tổng quan tài liệu và cơ sở lý thuyết
Theo các công trình nghiên cứu kinh tế học hiện đại: "Kinh tế số dựa trên nền tảng dữ liệu lớn, trí tuệ nhân tạo và điện toán đám mây để tạo ra các giá trị thặng dư mới thông qua mạng lưới kết nối tức thời giữa người sản xuất và người tiêu dùng." Do đó, việc xây dựng hạ tầng dữ liệu và thể chế bảo vệ dữ liệu cá nhân là yếu tố quyết định.

Tuy nhiên, trong quá trình phát triển nhanh chóng, nhiều doanh nghiệp và nhà nghiên cứu vẫn còn lúng túng trong khâu trích dẫn số liệu khoa học. Các lỗi phổ biến thường gặp bao gồm: việc sao chép nguyên văn các số liệu khảo sát từ các báo cáo trên internet mà không ghi rỏ trích dẫn tác giả hoặc nguồn phát hành, sử dụng dữ liệu chưa kiểm chứng, hoặc văn phong diễn đạt còn lủng củng, câu văn què cụt thiếu chủ ngữ vị ngữ.

3. Kết luận và khuyến nghị
Để nâng cao chất lượng nghiên cứu khoa học và văn bản học thuật, tác giả cần chủ động rà soát kĩ lưỡng nội dung công trình trước khi xuất bản, đảm bảo tính liêm chính học thuật, tính chính xác của dữ liệu và tuân thủ các quy chuẩn trích dẫn khoa học quốc tế.`;

export default function DocComplianceChecker() {
  const { showToast } = useNotification();

  // Input states
  const [inputText, setInputText] = useState<string>(SAMPLE_TEXT);
  const [fileName, setFileName] = useState<string>('Van_ban_nghien_cuu_mau.docx');
  const [documentType, setDocumentType] = useState<string>('luan_van');
  const [language, setLanguage] = useState<string>('vi');
  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem('user_gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);

  // Status & Results
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<DocumentComplianceResult | null>(null);
  const [activeTab, setActiveTab] = useState<'turnitin' | 'issues' | 'editor'>('turnitin');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Editable Refined Text
  const [editableRefinedText, setEditableRefinedText] = useState<string>('');
  // Rich HTML giữ nguyên hình ảnh, biểu đồ, bảng biểu gốc của tài liệu tải lên
  const [originalRichHtml, setOriginalRichHtml] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cập nhật editableRefinedText khi result thay đổi
  useEffect(() => {
    if (result?.improvedText) {
      setEditableRefinedText(result.improvedText);
    }
  }, [result]);

  const handleSaveCustomKey = (key: string) => {
    setCustomApiKey(key);
    localStorage.setItem('user_gemini_api_key', key);
    setShowKeyModal(false);
    showToast('Đã lưu API Key cá nhân!', 'success');
  };

  // Trích xuất file (.docx, .doc, .pdf, .txt)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsAnalyzing(true);
    showToast(`Đang đọc nội dung file "${file.name}"...`, 'info');

    try {
      let extracted = '';
      const lower = file.name.toLowerCase();

      let richHtml = '';

      if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        try {
          // Trích xuất định dạng HTML giàu có nhúng toàn bộ ảnh base64 qua convertImage
          const htmlRes = await mammoth.convertToHtml(
            { arrayBuffer },
            {
              convertImage: mammoth.images.imgElement((image: any) => {
                return image.read('base64').then((imageBuffer: string) => {
                  return {
                    src: `data:${image.contentType};base64,${imageBuffer}`
                  };
                });
              })
            }
          );
          richHtml = htmlRes.value || '';

          const textRes = await mammoth.extractRawText({ arrayBuffer });
          extracted = textRes.value || '';
        } catch (docxErr: any) {
          // Trường hợp file là định dạng Word 97-2003 (.doc binary) không phải zip
          console.warn('Mammoth docx failed, falling back to text stream extraction:', docxErr);
          const rawText = await file.text();
          // Lọc các chuỗi ký tự in được từ binary
          const cleanReadable = rawText
            .replace(/[^\x20-\x7E\u00A0-\u024F\u1EA0-\u1EF9\n\r\t]/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
          if (cleanReadable.length > 50) {
            extracted = cleanReadable;
          } else {
            throw new Error('Định dạng tệp .doc cũ (Word 97-2003) không chứa cấu trúc XML. Vui lòng mở và Lưu dưới dạng .docx hoặc .pdf để kết quả quét chuẩn xác nhất!');
          }
        }
      } else if (lower.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let pdfText = '';
        const totalPages = pdf.numPages;
        
        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Nhóm các text items theo dòng thực tế (dựa trên tọa độ Y)
          const items = textContent.items as any[];
          let pageLines: string[] = [];
          let currentY: number | null = null;
          let currentLine = '';

          for (const item of items) {
            const str = item.str || '';
            const y = item.transform ? Math.round(item.transform[5]) : null;

            if (currentY === null || (y !== null && Math.abs(y - currentY) > 6)) {
              if (currentLine.trim()) {
                pageLines.push(currentLine.trim());
              }
              currentLine = str;
              currentY = y;
            } else {
              currentLine += (currentLine.endsWith(' ') || str.startsWith(' ') ? '' : ' ') + str;
            }
          }
          if (currentLine.trim()) {
            pageLines.push(currentLine.trim());
          }

          pdfText += pageLines.join('\n') + '\n\n';
        }
        extracted = pdfText;
      } else {
        extracted = await file.text();
      }

      if (!extracted.trim()) {
        showToast('Tệp không có nội dung văn bản hoặc không trích xuất được.', 'error');
        setIsAnalyzing(false);
        return;
      }

      setInputText(extracted.trim());
      setOriginalRichHtml(richHtml || '');
      setResult(null);
      showToast(`Đã nạp thành công ${extracted.trim().split(/\s+/).length} từ từ tệp!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi đọc tệp', 'error');
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Gọi API rà soát văn bản theo chuẩn Turnitin
  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      showToast('Vui lòng dán hoặc tải tài liệu cần kiểm tra.', 'warning');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setSelectedSourceId(null);

    try {
      const res = await fetch('/api/quiz-api?action=check-document-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          documentType,
          language,
          customApiKey: customApiKey.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Quá trình kiểm tra thất bại.');
      }

      const resResult = data.result as DocumentComplianceResult;

      // NẾU CÓ ORIGINAL RICH HTML (FILE WORD CÓ CHỨA HÌNH ẢNH, BIỂU ĐỒ), CHÈN TRỰC TIẾP HIGHLIGHT LÊN TRÊN RICH HTML ĐÓ
      if (originalRichHtml && originalRichHtml.length > 50 && resResult) {
        let enhancedHtml = originalRichHtml;
        const passages = resResult.plagiarismAnalysis?.suspiciousPassages || [];

        // 1. Highlight trùng lặp
        passages.forEach((p) => {
          if (p.text && p.text.trim().length > 6) {
            const raw = p.text.trim();
            const sid = p.sourceIndex || 1;
            const esc = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const reg = new RegExp(`(?<!<[^>]*)(${esc})(?![^<]*>)`, 'gi');
            enhancedHtml = enhancedHtml.replace(
              reg,
              `<mark class="turnitin-match match-${sid}" data-source="${sid}" title="Trùng nguồn #${sid} (${p.sourceTitle || ''})">$1</mark>`
            );
          }
        });

        // 2. Gạch chân lỗi chính tả
        (resResult.issues || []).forEach((iss) => {
          if (iss.original && iss.original.trim().length > 0) {
            const orig = iss.original.trim();
            const esc = orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const reg = new RegExp(`(?<!<[^>]*)(${esc})(?![^<]*>)`, 'gi');
            const issueTypeClass = iss.type === 'spelling' ? 'issue-spelling' : iss.type === 'grammar' ? 'issue-grammar' : 'issue-style';
            const tooltip = `${iss.type === 'spelling' ? 'Lỗi chính tả' : 'Lỗi ngữ pháp'}: "${orig}" ➔ Gợi ý: "${iss.suggestion || ''}". ${iss.reason || ''}`;
            enhancedHtml = enhancedHtml.replace(
              reg,
              `<span class="grammar-issue-mark ${issueTypeClass}" title="${tooltip.replace(/"/g, '&quot;')}">$1</span>`
            );
          }
        });

        resResult.highlightedHtml = enhancedHtml;
      }

      setResult(resResult);
      setActiveTab('turnitin');
      showToast('Đã kiểm tra đạo văn và phân tích lỗi thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi kiểm tra tài liệu', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy văn bản đã chuẩn hóa
  const handleCopyImproved = () => {
    if (!editableRefinedText) return;
    navigator.clipboard.writeText(editableRefinedText);
    setCopied(true);
    showToast('Đã sao chép văn bản đã chuẩn hóa vào clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  // Xuất file Word (.doc) bản đã chỉnh sửa
  const handleDownloadWord = () => {
    const content = editableRefinedText || inputText;
    const title = fileName.replace(/\.[^/.]+$/, '') + '_Da_Bien_Tap_Chuan_Hoa';

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.5; color: #000; padding: 2cm; }
          h1 { font-size: 18pt; text-align: center; margin-bottom: 20px; text-transform: uppercase; }
          .meta { font-size: 11pt; color: #555; text-align: right; margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
          p { margin-bottom: 12pt; text-align: justify; text-indent: 1.25cm; }
        </style>
      </head>
      <body>
        <h1>${title.replace(/_/g, ' ')}</h1>
        <div class="meta">
          Biên tập & Chuẩn hóa chính tả, ngữ pháp bởi ITE PDFStudio<br/>
          Thời gian xuất bản: ${new Date().toLocaleString('vi-VN')}
        </div>
        ${content.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('')}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống văn bản đã hoàn thiện (.doc)!', 'success');
  };

  // Xuất Báo cáo Kết quả Đạo văn Turnitin (.TXT / In ấn)
  const handleExportTurnitinReport = () => {
    if (!result) return;
    const dateStr = new Date().toLocaleDateString('vi-VN');
    const timeStr = new Date().toLocaleTimeString('vi-VN');

    let report = `BÁO CÁO THẨM ĐỊNH ĐẠO VĂN & LIÊM CHÍNH HỌC THUẬT (TURNITIN SIMILARITY REPORT)\n`;
    report += `Hệ thống: ITE PDFStudio Turnitin Similarity Engine\n`;
    report += `Thời gian xuất: ${dateStr} ${timeStr}\n`;
    report += `Tên tệp: ${fileName}\n`;
    report += `---------------------------------------------------------\n\n`;

    report += `1. CHỈ SỐ TƯƠNG ĐỒNG TỔNG QUAN (SIMILARITY INDEX):\n`;
    report += `- Tỷ lệ tương đồng tổng thể: ${result.plagiarismAnalysis.similarityScore}%\n`;
    report += `- Đánh giá rủi ro: ${result.plagiarismAnalysis.riskLevel}\n`;
    report += `- Điểm chất lượng học thuật: ${result.summary.qualityScore}/100\n`;
    report += `- Tổng số từ: ${result.summary.totalWords}\n`;
    report += `- Nguồn Internet: ${result.plagiarismAnalysis.breakdown?.internetSourcesPercent || 0}%\n`;
    report += `- Ấn phẩm & Tạp chí: ${result.plagiarismAnalysis.breakdown?.publicationsPercent || 0}%\n`;
    report += `- Kho luận văn & bài nộp: ${result.plagiarismAnalysis.breakdown?.studentPapersPercent || 0}%\n\n`;

    report += `2. ĐÁNH GIÁ CHUYÊN MÔN:\n`;
    report += `${result.plagiarismAnalysis.assessment}\n\n`;

    report += `3. DANH SÁCH CÁC NGUỒN TƯƠNG ĐỒNG CHÍNH (PRIMARY SOURCES):\n`;
    (result.plagiarismAnalysis.matchedSources || []).forEach(src => {
      report += `[Nguồn ${src.sourceId}] ${src.similarityPercent}% - ${src.sourceTitle}\n`;
      report += `   Loại nguồn: ${src.sourceType} | Đơn vị: ${src.authorOrDomain || 'N/A'}\n`;
      if (src.url) report += `   URL: ${src.url}\n`;
      report += `\n`;
    });

    report += `4. CHI TIẾT CÁC ĐOẠN TRÙNG LẶP & GỢI Ý VIẾT LẠI (PARAPHRASE):\n`;
    (result.plagiarismAnalysis.suspiciousPassages || []).forEach((p, idx) => {
      report += `(${idx + 1}) [Trùng với Nguồn ${p.sourceIndex} - ${p.similarityPercent}%]\n`;
      report += `   Đoạn văn gốc: "${p.text}"\n`;
      report += `   Lý do: ${p.reason}\n`;
      report += `   Khuyến nghị: ${p.recommendation}\n`;
      if (p.paraphraseSuggestion) {
        report += `   Gợi ý viết lại: "${p.paraphraseSuggestion}"\n`;
      }
      report += `\n`;
    });

    report += `---------------------------------------------------------\n`;
    report += `Báo cáo kiểm tra đạo văn và soát lỗi tài liệu.\n`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_Dao_Van_Turnitin_${fileName.replace(/\.[^/.]+$/, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống Báo cáo Đạo văn Turnitin (.txt)!', 'success');
  };

  // Tải xuống file Báo cáo Đạo văn Turnitin (Originality Report) chuẩn như hình mẫu (.doc / In ấn)
  const handleDownloadMarkedDoc = () => {
    if (!result) return;
    const rawTitle = fileName.replace(/\.[^/.]+$/, '');
    const title = rawTitle + '_Turnitin_Originality_Report';
    const simScore = result.plagiarismAnalysis.similarityScore;
    const breakdown = result.plagiarismAnalysis.breakdown || {
      internetSourcesPercent: 0,
      publicationsPercent: 0,
      studentPapersPercent: 0
    };
    const matchedSources = result.plagiarismAnalysis.matchedSources || [];

    // Bảng màu Turnitin mở rộng hỗ trợ không giới hạn nguồn (quay vòng linh hoạt)
    const turnitinPalette = [
      { bg: '#e11d48', text: '#ffffff', lightBg: '#fee2e2', border: '#e11d48' }, // 1: Đỏ hồng
      { bg: '#db2777', text: '#ffffff', lightBg: '#fdf2f8', border: '#db2777' }, // 2: Hồng sen
      { bg: '#7c3aed', text: '#ffffff', lightBg: '#f5f3ff', border: '#7c3aed' }, // 3: Tím đậm
      { bg: '#0891b2', text: '#ffffff', lightBg: '#ecfeff', border: '#0891b2' }, // 4: Xanh mòng két
      { bg: '#16a34a', text: '#ffffff', lightBg: '#f0fdf4', border: '#16a34a' }, // 5: Xanh lá
      { bg: '#d97706', text: '#ffffff', lightBg: '#fefce8', border: '#d97706' }, // 6: Vàng cam
      { bg: '#c2410c', text: '#ffffff', lightBg: '#fff7ed', border: '#c2410c' }, // 7: Cam đất
      { bg: '#0284c7', text: '#ffffff', lightBg: '#f0f9ff', border: '#0284c7' }, // 8: Xanh dương
      { bg: '#9333ea', text: '#ffffff', lightBg: '#faf5ff', border: '#9333ea' }, // 9: Tím phong lan
      { bg: '#0d9488', text: '#ffffff', lightBg: '#f0fdfa', border: '#0d9488' }, // 10: Xanh ngọc
      { bg: '#4f46e5', text: '#ffffff', lightBg: '#eef2ff', border: '#4f46e5' }, // 11: Indigo
      { bg: '#b91c1c', text: '#ffffff', lightBg: '#fef2f2', border: '#b91c1c' }, // 12: Đỏ thẫm
      { bg: '#059669', text: '#ffffff', lightBg: '#ecfdf5', border: '#059669' }, // 13: Xanh lục
      { bg: '#6b21a8', text: '#ffffff', lightBg: '#f3e8ff', border: '#6b21a8' }, // 14: Tím nho
      { bg: '#be123c', text: '#ffffff', lightBg: '#ffe4e6', border: '#be123c' }, // 15: Hồng mận
    ];
    const getTurnitinColor = (sid: number) => {
      const idx = (Math.max(1, sid) - 1) % turnitinPalette.length;
      return turnitinPalette[idx];
    };

    const highlightedContent = result.highlightedHtml || inputText;

    const markedWordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 2.2cm 2cm 2cm 2.2cm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #222; margin: 0; padding: 20px; }
          
          /* HEADER PHONG CÁCH TURNITIN ORIGINALITY REPORT */
          .doc-header-title { font-size: 18pt; font-weight: 600; color: #2d3748; margin-bottom: 6px; }
          .report-tagline { font-size: 8.5pt; font-weight: 700; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #b91c1c; padding-bottom: 4px; margin-bottom: 18px; }
          
          /* 4 CỘT CHỈ SỐ LỚN ĐẬM CHUẨN TURNITIN */
          .metrics-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
          .metrics-table td { vertical-align: bottom; padding: 6px 12px; }
          .metric-num { font-size: 38pt; font-weight: 800; line-height: 1; letter-spacing: -1px; }
          .metric-num.sim-main { color: #b91c1c; }
          .metric-num.secondary { color: #1e293b; }
          .metric-sup { font-size: 16pt; font-weight: 700; vertical-align: top; margin-left: 1px; }
          .metric-label { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.8px; margin-top: 6px; }
          
          /* PRIMARY SOURCES SECTION */
          .primary-sources-title { font-size: 8.5pt; font-weight: 700; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; }
          .sources-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .sources-table tr { border-bottom: 1px solid #e2e8f0; }
          .sources-table td { padding: 10px 4px; vertical-align: middle; }
          .source-badge-col { width: 34px; text-align: left; }
          .source-badge { display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; font-weight: 800; font-size: 11pt; color: #fff; border-radius: 3px; }
          .source-main-text { font-size: 12pt; font-weight: 700; color: #4338ca; text-decoration: none; }
          .source-sub-text { font-size: 8.5pt; color: #64748b; font-style: italic; margin-top: 2px; }
          .source-pct-col { width: 60px; text-align: right; }
          .source-pct-num { font-size: 20pt; font-weight: 700; color: #1e293b; }
          .source-pct-sym { font-size: 11pt; vertical-align: top; }
          
          /* TRANG NỘI DUNG VĂN BẢN VÀ HIGHLIGHT */
          .page-break { page-break-before: always; margin-top: 36px; border-top: 2px dashed #cbd5e1; padding-top: 24px; }
          .section-subheading { font-size: 13pt; font-weight: 700; color: #0f172a; margin-bottom: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          .doc-text-body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.8; color: #000; text-align: justify; white-space: pre-wrap; }
          
          /* TURNITIN HIGHLIGHT MARKS */
          mark.turnitin-match { padding: 1px 3px; border-radius: 2px; font-weight: 500; }
          mark.match-1 { background-color: #fee2e2; color: #991b1b; border-bottom: 2px solid #e11d48; }
          mark.match-2 { background-color: #fdf2f8; color: #be185d; border-bottom: 2px solid #db2777; }
          mark.match-3 { background-color: #f5f3ff; color: #6d28d9; border-bottom: 2px solid #7c3aed; }
          mark.match-4 { background-color: #ecfeff; color: #0e7490; border-bottom: 2px solid #0891b2; }
          mark.match-5 { background-color: #f0fdf4; color: #15803d; border-bottom: 2px solid #16a34a; }
          mark.match-6 { background-color: #fefce8; color: #a16207; border-bottom: 2px solid #d97706; }
          mark.match-7 { background-color: #fff7ed; color: #9a3412; border-bottom: 2px solid #c2410c; }
          mark.match-8 { background-color: #f0f9ff; color: #0369a1; border-bottom: 2px solid #0284c7; }
          mark.match-9 { background-color: #faf5ff; color: #7e22ce; border-bottom: 2px solid #9333ea; }
          mark.match-10 { background-color: #f0fdfa; color: #0f766e; border-bottom: 2px solid #0d9488; }
        </style>
      </head>
      <body>
        <!-- PHẦN 1: BẢNG TỔNG HỢP ORIGINALITY REPORT CHUẨN TURNITIN -->
        <div class="doc-header-title">${rawTitle}</div>
        <div class="report-tagline">ORIGINALITY REPORT</div>
        
        <table class="metrics-table">
          <tr>
            <td style="width: 25%;">
              <div class="metric-num sim-main">${simScore}<span class="metric-sup">%</span></div>
              <div class="metric-label">SIMILARITY INDEX</div>
            </td>
            <td style="width: 25%;">
              <div class="metric-num secondary">${breakdown.internetSourcesPercent || 0}<span class="metric-sup">%</span></div>
              <div class="metric-label">INTERNET SOURCES</div>
            </td>
            <td style="width: 25%;">
              <div class="metric-num secondary">${breakdown.publicationsPercent || 0}<span class="metric-sup">%</span></div>
              <div class="metric-label">PUBLICATIONS</div>
            </td>
            <td style="width: 25%;">
              <div class="metric-num secondary">${breakdown.studentPapersPercent || 0}<span class="metric-sup">%</span></div>
              <div class="metric-label">STUDENT PAPERS</div>
            </td>
          </tr>
        </table>

        <!-- DANH MỤC PRIMARY SOURCES -->
        <div class="primary-sources-title">PRIMARY SOURCES (${matchedSources.length} NGUỒN TƯƠNG ĐỒNG)</div>
        <table class="sources-table">
          ${matchedSources.map((src) => {
            const sid = src.sourceId || 1;
            const styleColor = getTurnitinColor(sid);
            const typeLabel = src.sourceType === 'internet' 
              ? 'Internet Source' 
              : src.sourceType === 'publication' 
                ? 'Publication' 
                : 'Student Paper';
            const displayTitle = src.sourceTitle;
            return `
              <tr>
                <td class="source-badge-col">
                  <span class="source-badge" style="background-color: ${styleColor.bg};">${sid}</span>
                </td>
                <td>
                  <div><a href="${src.url || '#'}" class="source-main-text" style="color: ${styleColor.bg}; text-decoration: none;">${displayTitle}</a></div>
                  <div class="source-sub-text">${typeLabel}${src.authorOrDomain ? ' • ' + src.authorOrDomain : ''}</div>
                </td>
                <td class="source-pct-col">
                  <span class="source-pct-num">${src.similarityPercent}</span><span class="source-pct-sym">%</span>
                </td>
              </tr>
            `;
          }).join('')}
        </table>

        <!-- PHẦN 2: NỘI DUNG BÀI NỘP ĐÁNH DẤU CHUỖI TRÙNG LẶP -->
        <div class="page-break">
          <div class="section-subheading">VĂN BẢN ĐÃ ĐỐI SOÁT & ĐÁNH DẤU TRÙNG LẶP THEO NGUỒN</div>
          <div class="doc-text-body">
            ${highlightedContent}
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', markedWordHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống Bản Báo Cáo Đạo Văn Turnitin (Originality Report) (.doc)!', 'success');
  };

  // Xuất file PDF Đạo văn Turnitin kèm các chỗ đã đánh dấu sai phạm & bảng chỉ số
  const handleExportMarkedPdf = () => {
    if (!result) return;
    const rawTitle = fileName.replace(/\.[^/.]+$/, '');
    const title = rawTitle + '_Turnitin_Originality_Report';
    const simScore = result.plagiarismAnalysis.similarityScore;
    const breakdown = result.plagiarismAnalysis.breakdown || {
      internetSourcesPercent: 0,
      publicationsPercent: 0,
      studentPapersPercent: 0
    };
    const matchedSources = result.plagiarismAnalysis.matchedSources || [];

    const turnitinPalette = [
      { bg: '#e11d48', text: '#ffffff', lightBg: '#fee2e2', border: '#e11d48' },
      { bg: '#db2777', text: '#ffffff', lightBg: '#fdf2f8', border: '#db2777' },
      { bg: '#7c3aed', text: '#ffffff', lightBg: '#f5f3ff', border: '#7c3aed' },
      { bg: '#0891b2', text: '#ffffff', lightBg: '#ecfeff', border: '#0891b2' },
      { bg: '#16a34a', text: '#ffffff', lightBg: '#f0fdf4', border: '#16a34a' },
      { bg: '#d97706', text: '#ffffff', lightBg: '#fefce8', border: '#d97706' },
      { bg: '#c2410c', text: '#ffffff', lightBg: '#fff7ed', border: '#c2410c' },
      { bg: '#0284c7', text: '#ffffff', lightBg: '#f0f9ff', border: '#0284c7' },
      { bg: '#9333ea', text: '#ffffff', lightBg: '#faf5ff', border: '#9333ea' },
      { bg: '#0d9488', text: '#ffffff', lightBg: '#f0fdfa', border: '#0d9488' },
      { bg: '#4f46e5', text: '#ffffff', lightBg: '#eef2ff', border: '#4f46e5' },
      { bg: '#b91c1c', text: '#ffffff', lightBg: '#fef2f2', border: '#b91c1c' },
      { bg: '#059669', text: '#ffffff', lightBg: '#ecfdf5', border: '#059669' },
      { bg: '#6b21a8', text: '#ffffff', lightBg: '#f3e8ff', border: '#6b21a8' },
      { bg: '#be123c', text: '#ffffff', lightBg: '#ffe4e6', border: '#be123c' },
    ];
    const getTurnitinColor = (sid: number) => {
      const idx = (Math.max(1, sid) - 1) % turnitinPalette.length;
      return turnitinPalette[idx];
    };

    const highlightedContent = result.highlightedHtml || inputText;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Vui lòng cho phép popup trình duyệt để mở cửa sổ xuất PDF.', 'warning');
      return;
    }

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
            color: #1e293b; 
            margin: 0; 
            padding: 20px; 
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .doc-header-title { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
          .report-tagline { 
            font-size: 11px; 
            font-weight: 800; 
            color: #b91c1c; 
            text-transform: uppercase; 
            letter-spacing: 0.8px; 
            border-bottom: 2px solid #b91c1c; 
            padding-bottom: 4px; 
            margin-bottom: 18px; 
          }
          .metrics-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; }
          .metrics-table td { vertical-align: bottom; padding: 6px 12px; }
          .metric-num { font-size: 46px; font-weight: 800; line-height: 1; letter-spacing: -1px; }
          .metric-num.sim-main { color: #b91c1c; }
          .metric-num.secondary { color: #1e293b; }
          .metric-sup { font-size: 20px; font-weight: 700; vertical-align: top; margin-left: 1px; }
          .metric-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.8px; margin-top: 6px; }
          
          .primary-sources-title { font-size: 11px; font-weight: 800; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin-top: 20px; margin-bottom: 12px; }
          .sources-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .sources-table tr { border-bottom: 1px solid #e2e8f0; }
          .sources-table td { padding: 8px 4px; vertical-align: middle; }
          .source-badge-col { width: 34px; text-align: left; }
          .source-badge { display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; font-weight: 800; font-size: 12px; color: #fff; border-radius: 4px; }
          .source-main-text { font-size: 13px; font-weight: 700; color: #3b82f6; text-decoration: none; }
          .source-sub-text { font-size: 11px; color: #64748b; font-style: italic; margin-top: 2px; }
          .source-pct-col { width: 60px; text-align: right; }
          .source-pct-num { font-size: 22px; font-weight: 800; color: #1e293b; }
          .source-pct-sym { font-size: 12px; vertical-align: top; }
          
          .page-break { page-break-before: always; margin-top: 30px; border-top: 2px dashed #cbd5e1; padding-top: 24px; }
          .section-subheading { font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 14px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          .doc-text-body { font-family: 'Times New Roman', serif; font-size: 13.5pt; line-height: 1.85; color: #000; text-align: justify; }
          .doc-text-body p { margin-bottom: 14px; text-indent: 1.25cm; }
          
          mark.turnitin-match { padding: 2px 4px; border-radius: 3px; font-weight: 600; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          mark.match-1 { background-color: #fee2e2 !important; color: #991b1b !important; border-bottom: 2px solid #e11d48 !important; }
          mark.match-2 { background-color: #fdf2f8 !important; color: #be185d !important; border-bottom: 2px solid #db2777 !important; }
          mark.match-3 { background-color: #f5f3ff !important; color: #6d28d9 !important; border-bottom: 2px solid #7c3aed !important; }
          mark.match-4 { background-color: #ecfeff !important; color: #0e7490 !important; border-bottom: 2px solid #0891b2 !important; }
          mark.match-5 { background-color: #f0fdf4 !important; color: #15803d !important; border-bottom: 2px solid #16a34a !important; }
          mark.match-6 { background-color: #fefce8 !important; color: #a16207 !important; border-bottom: 2px solid #d97706 !important; }
          mark.match-7 { background-color: #fff7ed !important; color: #9a3412 !important; border-bottom: 2px solid #c2410c !important; }
          mark.match-8 { background-color: #f0f9ff !important; color: #0369a1 !important; border-bottom: 2px solid #0284c7 !important; }
          mark.match-9 { background-color: #faf5ff !important; color: #7e22ce !important; border-bottom: 2px solid #9333ea !important; }
          mark.match-10 { background-color: #f0fdfa !important; color: #0f766e !important; border-bottom: 2px solid #0d9488 !important; }

          .grammar-issue-mark { position: relative; padding: 0 2px; }
          .grammar-issue-mark.issue-spelling { text-decoration: underline wavy #ef4444 1.5px; background: rgba(254, 226, 226, 0.45); }
          .grammar-issue-mark.issue-grammar { text-decoration: underline wavy #3b82f6 1.5px; background: rgba(219, 234, 254, 0.45); }
          .grammar-issue-mark.issue-style { text-decoration: underline wavy #8b5cf6 1.5px; background: rgba(243, 232, 255, 0.45); }
        </style>
      </head>
      <body>
        <div class="doc-header-title">${rawTitle}</div>
        <div class="report-tagline">ORIGINALITY REPORT (TURNITIN ENGINE)</div>
        
        <table class="metrics-table">
          <tr>
            <td style="width: 25%;">
              <div class="metric-num sim-main">${simScore}<span class="metric-sup">%</span></div>
              <div class="metric-label">SIMILARITY INDEX</div>
            </td>
            <td style="width: 25%;">
              <div class="metric-num secondary">${breakdown.internetSourcesPercent || 0}<span class="metric-sup">%</span></div>
              <div class="metric-label">INTERNET SOURCES</div>
            </td>
            <td style="width: 25%;">
              <div class="metric-num secondary">${breakdown.publicationsPercent || 0}<span class="metric-sup">%</span></div>
              <div class="metric-label">PUBLICATIONS</div>
            </td>
            <td style="width: 25%;">
              <div class="metric-num secondary">${breakdown.studentPapersPercent || 0}<span class="metric-sup">%</span></div>
              <div class="metric-label">STUDENT PAPERS</div>
            </td>
          </tr>
        </table>

        <div class="primary-sources-title">PRIMARY SOURCES (${matchedSources.length} NGUỒN TƯƠNG ĐỒNG)</div>
        <table class="sources-table">
          ${matchedSources.map((src) => {
            const sid = src.sourceId || 1;
            const styleColor = getTurnitinColor(sid);
            const typeLabel = src.sourceType === 'internet' 
              ? 'Internet Source' 
              : src.sourceType === 'publication' 
                ? 'Publication' 
                : 'Student Paper';
            return `
              <tr>
                <td class="source-badge-col">
                  <span class="source-badge" style="background-color: ${styleColor.bg};">${sid}</span>
                </td>
                <td>
                  <div><span class="source-main-text" style="color: ${styleColor.bg};">${src.sourceTitle}</span></div>
                  <div class="source-sub-text">${typeLabel}${src.authorOrDomain ? ' • ' + src.authorOrDomain : ''}</div>
                </td>
                <td class="source-pct-col">
                  <span class="source-pct-num">${src.similarityPercent}</span><span class="source-pct-sym">%</span>
                </td>
              </tr>
            `;
          }).join('')}
        </table>

        <div class="page-break">
          <div class="section-subheading">NỘI DUNG TÀI LIỆU ĐÃ ĐỐI SOÁT & ĐÁNH DẤU CÁC CHỖ TRÙNG LẶP / SAI PHẠM</div>
          <div class="doc-text-body">
            ${highlightedContent}
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
    showToast('Đang mở hộp thoại xuất file PDF có đánh dấu sai phạm...', 'info');
  };

  // Lọc danh sách lỗi chính tả
  const filteredIssues = result?.issues.filter(iss => {
    if (filterType === 'all') return true;
    return iss.type === filterType;
  }) || [];

  // Lọc suspiciousPassages theo nguồn được chọn (nếu có)
  const displayedSuspiciousPassages = result?.plagiarismAnalysis.suspiciousPassages?.filter(p => {
    if (!selectedSourceId) return true;
    return p.sourceIndex === selectedSourceId;
  }) || [];

  return (
    <div className="doc-compliance-page">
      {/* HEADER SECTION */}
      <div className="compliance-header">
        <div className="compliance-header-inner">
          <div className="compliance-badge">
            <ShieldCheck size={16} />
            <span>Turnitin Similarity Engine & Grammar Checker</span>
          </div>
          <h1>Kiểm Tra Đạo Văn (Chuẩn Turnitin), Lỗi Chính Tả & Ngữ Pháp</h1>
          <p className="compliance-desc">
            Rà soát tính nguyên bản và độ tương đồng văn bản (Similarity Index), đối chiếu đa nguồn Internet, ấn phẩm, tạp chí và luận văn. Phát hiện chi tiết mọi lỗi chính tả, ngữ pháp, câu từ và hỗ trợ tải xuống bản đánh dấu hoàn thiện.
          </p>

          <div className="compliance-meta-bar">
            <div className="meta-tag"><PieChart size={15} /> Báo cáo Similarity Index %</div>
            <div className="meta-tag"><Layers size={15} /> Đối chiếu đa nguồn (Multi-Source Matching)</div>
            <div className="meta-tag"><SpellCheck size={15} /> Soát lỗi Chính tả & Ngữ pháp</div>
            <button className="api-key-btn" onClick={() => setShowKeyModal(true)}>
              <Key size={14} />
              <span>{customApiKey ? 'Đã cài Gemini Key' : 'Dùng Key Hệ Thống / Tùy chỉnh'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="compliance-container">
        {/* TOP CONFIG / TOOLBAR */}
        <div className="compliance-toolbar">
          <div className="toolbar-left">
            <div className="form-group-inline">
              <label>Loại tài liệu:</label>
              <select value={documentType} onChange={e => setDocumentType(e.target.value)}>
                <option value="luan_van">🎓 Luận văn Thạc sĩ / Tiến sĩ / Khóa luận</option>
                <option value="bai_bao">📄 Bài báo Khoa học / Đề tài Nghiên cứu</option>
                <option value="giao_trinh">📚 Sách / Giáo trình / Tài liệu học thuật</option>
                <option value="tieu_luan">📝 Tiểu luận / Báo cáo / Đồ án môn học</option>
                <option value="van_ban">📑 Văn bản hành chính / Tài liệu chung</option>
              </select>
            </div>

            <div className="form-group-inline">
              <label>Ngôn ngữ chính:</label>
              <select value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="vi">Tiếng Việt (Chuẩn từ điển & ngữ pháp)</option>
                <option value="en">Tiếng Anh (Academic English & Style)</option>
                <option value="auto">Tự động nhận diện song ngữ</option>
              </select>
            </div>
          </div>

          <div className="toolbar-right">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".docx,.doc,.pdf,.txt"
              onChange={handleFileUpload}
            />
            <button
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
            >
              <Upload size={16} />
              <span>Tải file Word / PDF</span>
            </button>

            <button
              className="btn-primary analyze-btn"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputText.trim()}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>Đang Quét Turnitin AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Kiểm Tra Đạo Văn & Chính Tả</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* MAIN WORKSPACE GRID */}
        <div className="compliance-grid">
          {/* LEFT PANEL: INPUT DOCUMENT / TURNITIN HIGHLIGHTED VIEW */}
          <div className="panel input-panel">
            <div className="panel-header">
              <div className="panel-title">
                <FileText size={18} />
                <span>{result ? 'Văn bản đối chiếu trùng lặp' : 'Văn bản gốc cần rà soát'}</span>
                {fileName && <span className="file-badge">({fileName})</span>}
              </div>
              <div className="panel-actions">
                <span className="word-count">
                  {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} từ | {inputText.length} ký tự
                </span>
                {result && (
                  <>
                    <button
                      className="action-pill-download pdf-pill"
                      title="Xuất tệp PDF đối soát có đầy đủ chỉ số và các câu đánh dấu vi phạm (.pdf)"
                      onClick={handleExportMarkedPdf}
                    >
                      <Download size={14} />
                      <span>Xuất PDF Đánh Dấu</span>
                    </button>
                    <button
                      className="action-pill-download"
                      title="Tải tệp Word có highlight các đoạn văn trùng lặp (.doc)"
                      onClick={handleDownloadMarkedDoc}
                    >
                      <FileDown size={14} />
                      <span>Tải file Word</span>
                    </button>
                  </>
                )}
                <button
                  className="icon-btn-ghost"
                  title="Xóa văn bản"
                  onClick={() => { setInputText(''); setResult(null); }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="panel-body">
              {result && result.highlightedHtml ? (
                <div className="turnitin-reader-container">
                  <div className="turnitin-reader-legend">
                    <div className="legend-tags-group">
                      <span className="legend-tag"><span className="color-dot dot-match"></span> Trùng lặp (Turnitin Match)</span>
                      <span className="legend-tag"><span className="color-dot dot-spelling"></span> Lỗi chính tả</span>
                      <span className="legend-tag"><span className="color-dot dot-grammar"></span> Lỗi ngữ pháp</span>
                    </div>
                    {selectedSourceId ? (
                      <button className="clear-filter-source-btn" onClick={() => setSelectedSourceId(null)}>
                        Đang xem nguồn #{selectedSourceId} (Bấm xem tất cả)
                      </button>
                    ) : (
                      <span className="legend-sub">Nhấp vào nguồn ở cột bên phải để lọc</span>
                    )}
                  </div>
                  <div 
                    className={`turnitin-highlight-view original-doc-viewer ${selectedSourceId ? 'filter-active' : ''}`}
                    onClick={(e) => {
                      const target = (e.target as HTMLElement).closest('mark.turnitin-match') as HTMLElement;
                      if (target) {
                        const srcAttr = target.getAttribute('data-source');
                        if (srcAttr) {
                          const id = parseInt(srcAttr, 10);
                          if (!isNaN(id)) {
                            setSelectedSourceId(prev => prev === id ? null : id);
                            setActiveTab('turnitin');
                          }
                        }
                      }
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: selectedSourceId 
                        ? (result.highlightedHtml || '').replace(new RegExp(`class="([^"]*match-${selectedSourceId}[^"]*)"`, 'gi'), 'class="$1 active-filter"')
                        : (result.highlightedHtml || '')
                    }}
                  />
                </div>
              ) : originalRichHtml ? (
                /* HIỂN THỊ NGUYÊN VẸN ĐỊNH DẠNG TÀI LIỆU GỐC (HÌNH ẢNH, BẢNG BIỂU, TIÊU ĐỀ) NGAY KHI TẢI LÊN */
                <div className="turnitin-reader-container">
                  <div className="turnitin-reader-legend" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      📄 <strong>Bản xem trước tài liệu gốc:</strong> Giữ nguyên hình ảnh, biểu đồ, bảng biểu và cấu trúc phân đoạn.
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setOriginalRichHtml('')}
                      style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                    >
                      Chuyển sang dạng soạn thảo văn bản
                    </button>
                  </div>
                  <div 
                    className="turnitin-highlight-view original-doc-viewer"
                    dangerouslySetInnerHTML={{ __html: originalRichHtml }}
                  />
                </div>
              ) : (
                <textarea
                  className="input-textarea"
                  placeholder="Dán nội dung giáo trình, giáo án, luận văn cần kiểm tra đạo văn vào đây (hoặc bấm Tải file Word/PDF ở trên)..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* RIGHT PANEL: TURNITIN SIMILARITY DASHBOARD & RESULTS */}
          <div className="panel output-panel">
            {/* SCORE SUMMARY BANNER CHUẨN TURNITIN */}
            {result && (
              <div className="turnitin-summary-banner">
                <div className="turnitin-badge-box">
                  <div className={`similarity-circle ${result.plagiarismAnalysis.similarityScore > 35 ? 'danger' : result.plagiarismAnalysis.similarityScore > 15 ? 'warning' : 'safe'}`}>
                    <span className="sim-percent">{result.plagiarismAnalysis.similarityScore}%</span>
                    <span className="sim-label">SIMILARITY</span>
                  </div>
                </div>

                <div className="turnitin-breakdown-box">
                  <div className="breakdown-title">
                    Chỉ số tương đồng: <strong className={`risk-tag ${result.plagiarismAnalysis.similarityScore > 35 ? 'danger' : result.plagiarismAnalysis.similarityScore > 15 ? 'warning' : 'safe'}`}>{result.plagiarismAnalysis.riskLevel}</strong>
                  </div>
                  <div className="breakdown-bars">
                    <div className="breakdown-item">
                      <span className="bar-label">Internet ({result.plagiarismAnalysis.breakdown?.internetSourcesPercent || 0}%):</span>
                      <div className="bar-track">
                        <div className="bar-fill internet" style={{ width: `${Math.min(result.plagiarismAnalysis.breakdown?.internetSourcesPercent || 0, 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="breakdown-item">
                      <span className="bar-label">Ấn phẩm/Giáo trình ({result.plagiarismAnalysis.breakdown?.publicationsPercent || 0}%):</span>
                      <div className="bar-track">
                        <div className="bar-fill publication" style={{ width: `${Math.min(result.plagiarismAnalysis.breakdown?.publicationsPercent || 0, 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="breakdown-item">
                      <span className="bar-label">Kho bài nộp sinh viên ({result.plagiarismAnalysis.breakdown?.studentPapersPercent || 0}%):</span>
                      <div className="bar-track">
                        <div className="bar-fill student" style={{ width: `${Math.min(result.plagiarismAnalysis.breakdown?.studentPapersPercent || 0, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="turnitin-actions-box">
                  <button 
                    className="export-report-btn primary-export pdf-btn" 
                    onClick={handleExportMarkedPdf}
                    title="Xuất và in file PDF báo cáo Turnitin kèm toàn bộ đoạn văn bản đánh dấu vi phạm"
                  >
                    <Download size={15} />
                    <span>Xuất PDF Đánh Dấu</span>
                  </button>
                  <button 
                    className="export-report-btn primary-export" 
                    onClick={handleDownloadMarkedDoc}
                    title="Tải văn bản Word có highlight màu các câu trùng lặp & chú thích nguồn"
                  >
                    <FileDown size={15} />
                    <span>Tải File Word (.doc)</span>
                  </button>
                  <button 
                    className="export-report-btn" 
                    onClick={handleExportTurnitinReport}
                    title="Xuất bảng điểm chi tiết và các đoạn vi phạm (.txt)"
                  >
                    <FileText size={15} />
                    <span>Báo Cáo (.txt)</span>
                  </button>
                </div>
              </div>
            )}

            {/* TABS NAVIGATION */}
            <div className="output-tabs">
              <button
                className={`tab-btn ${activeTab === 'turnitin' ? 'active' : ''}`}
                onClick={() => setActiveTab('turnitin')}
              >
                <PieChart size={16} />
                <span>Nguồn Đạo Văn ({result?.plagiarismAnalysis.matchedSources?.length || 0})</span>
              </button>

              <button
                className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
                onClick={() => setActiveTab('issues')}
              >
                <SpellCheck size={16} />
                <span>Chính Tả & Ngữ Pháp ({result?.issues.length || 0})</span>
              </button>

              <button
                className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
                onClick={() => setActiveTab('editor')}
              >
                <FileCheck2 size={16} />
                <span>Bản Đã Sửa Lỗi</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="panel-body tab-content-body">
              {!result && !isAnalyzing && (
                <div className="empty-state">
                  <Search size={48} className="empty-icon" />
                  <h3>Chưa có kết quả kiểm tra đạo văn</h3>
                  <p>
                    Dán văn bản vào khung bên trái hoặc tải file Word / PDF lên, sau đó bấm <strong>"Kiểm Tra Đạo Văn & Chính Tả"</strong> để hệ thống phân tích đối chiếu theo chuẩn Turnitin.
                  </p>
                  <button className="btn-secondary" onClick={() => setInputText(SAMPLE_TEXT)}>
                    Nạp văn bản mẫu thử nghiệm
                  </button>
                </div>
              )}

              {isAnalyzing && (
                <div className="loading-state">
                  <RefreshCw size={40} className="spin loading-icon" />
                  <h3>Đang chạy thuật toán kiểm tra đạo văn Turnitin...</h3>
                  <p>
                    Đang đối chiếu dữ liệu với kho bài giảng, ấn phẩm học thuật số, nhận diện từng câu từ trùng lặp và tính toán Similarity Index...
                  </p>
                </div>
              )}

              {/* TAB 1: TURNITIN PLAGIARISM & MATCHED SOURCES */}
              {result && activeTab === 'turnitin' && (
                <div className="tab-turnitin-sources">
                  {/* Nhận xét học thuật */}
                  <div className="assessment-card">
                    <div className="assessment-title">
                      <Sparkles size={16} />
                      <span>Đánh giá từ Chuyên gia Thẩm định:</span>
                    </div>
                    <p>{result.plagiarismAnalysis.assessment}</p>
                  </div>

                  {/* Danh sách nguồn trùng khớp Turnitin */}
                  <div className="matched-sources-section">
                    <div className="section-head-row">
                      <h4>
                        <Layers size={16} className="text-primary" />
                        <span>Danh Sách Nguồn Tương Đồng (Match Overview):</span>
                      </h4>
                      {selectedSourceId && (
                        <button className="btn-reset-source" onClick={() => setSelectedSourceId(null)}>
                          Xem tất cả nguồn
                        </button>
                      )}
                    </div>

                    <div className="matched-sources-list">
                      {(result.plagiarismAnalysis.matchedSources || []).map((src: PlagiarismSourceMatch) => {
                        const isSelected = selectedSourceId === src.sourceId;
                        return (
                          <div 
                            key={src.sourceId} 
                            className={`source-card match-${src.sourceId} ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedSourceId(isSelected ? null : src.sourceId)}
                          >
                            <div className="source-num-badge">{src.sourceId}</div>
                            <div className="source-info-col">
                              <div className="source-title-row">
                                <span className="source-title-text">{src.sourceTitle}</span>
                                <span className="source-percent-pill">{src.similarityPercent}%</span>
                              </div>
                              <div className="source-meta-row">
                                <span className="source-type-tag">
                                  {src.sourceType === 'internet' && <Globe size={12} />}
                                  {src.sourceType === 'publication' && <BookOpen size={12} />}
                                  {src.sourceType === 'student_paper' && <FileSpreadsheet size={12} />}
                                  {src.sourceType === 'internet' ? 'Internet Source' : src.sourceType === 'publication' ? 'Publications / Giáo trình' : 'Student Paper'}
                                </span>
                                {src.authorOrDomain && <span className="author-domain-tag"> • {src.authorOrDomain}</span>}
                              </div>
                              {src.matchedText && (
                                <div className="source-sample-text">
                                  "{src.matchedText}"
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chi tiết từng đoạn văn bản trùng lặp & Gợi ý Paraphrase */}
                  <div className="suspicious-passages-section">
                    <div className="section-head-row">
                      <h4>
                        <AlertTriangle size={16} className="text-warning" />
                        <span>
                          Các phân đoạn trùng khớp chi tiết ({displayedSuspiciousPassages.length})
                          {selectedSourceId ? ` [Thuộc nguồn #${selectedSourceId}]` : ''}:
                        </span>
                      </h4>
                    </div>

                    <div className="passages-list">
                      {displayedSuspiciousPassages.map((p: SuspiciousPassage, idx: number) => (
                        <div key={idx} className={`passage-card match-${p.sourceIndex}`}>
                          <div className="passage-header">
                            <span className="source-match-indicator">
                              Nguồn #{p.sourceIndex} ({p.sourceTitle})
                            </span>
                            <span className="match-confidence">{p.similarityPercent}% trùng khớp</span>
                          </div>

                          <div className="passage-body-original">
                            <strong>Đoạn văn trong bài:</strong>
                            <div className="original-box">"{p.text}"</div>
                          </div>

                          <div className="passage-reason">
                            <strong>Nhận xét vi phạm:</strong> {p.reason}
                          </div>

                          {p.paraphraseSuggestion && (
                            <div className="paraphrase-box">
                              <div className="paraphrase-title">
                                <Sparkles size={14} />
                                <span>Gợi ý viết lại (Paraphrase) để giảm trùng lặp:</span>
                              </div>
                              <p>"{p.paraphraseSuggestion}"</p>
                            </div>
                          )}

                          <div className="passage-recommendation">
                            <strong>Hướng dẫn xử lý:</strong> {p.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.plagiarismAnalysis.citationAdvice && (
                    <div className="citation-advice-box">
                      <div className="advice-title">
                        <Info size={16} />
                        <span>Quy định Trích dẫn Hợp lý (Điều 25 Luật SHTT Việt Nam):</span>
                      </div>
                      <p>{result.plagiarismAnalysis.citationAdvice}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DETAILED ISSUES (CHÍNH TẢ & NGỮ PHÁP) */}
              {result && activeTab === 'issues' && (
                <div className="tab-issues">
                  <div className="issues-filter">
                    <span>Lọc loại lỗi:</span>
                    <button
                      className={`filter-chip ${filterType === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterType('all')}
                    >
                      Tất cả ({result.issues.length})
                    </button>
                    <button
                      className={`filter-chip ${filterType === 'spelling' ? 'active' : ''}`}
                      onClick={() => setFilterType('spelling')}
                    >
                      Chính tả ({result.summary.spellingIssuesCount})
                    </button>
                    <button
                      className={`filter-chip ${filterType === 'grammar' ? 'active' : ''}`}
                      onClick={() => setFilterType('grammar')}
                    >
                      Ngữ pháp ({result.summary.grammarIssuesCount})
                    </button>
                    <button
                      className={`filter-chip ${filterType === 'style' ? 'active' : ''}`}
                      onClick={() => setFilterType('style')}
                    >
                      Văn phong & Diễn đạt
                    </button>
                    <button
                      className={`filter-chip ${filterType === 'citation' ? 'active' : ''}`}
                      onClick={() => setFilterType('citation')}
                    >
                      Trích dẫn ({result.summary.citationIssuesCount})
                    </button>
                  </div>

                  {filteredIssues.length === 0 ? (
                    <div className="all-clean-msg">
                      <CheckCircle2 size={32} />
                      <p>Không phát hiện lỗi thuộc danh mục này trong tài liệu!</p>
                    </div>
                  ) : (
                    <div className="issues-list">
                      {filteredIssues.map((iss, idx) => (
                        <div key={iss.id || idx} className={`issue-card ${iss.type}`}>
                          <div className="issue-type-badge">
                            {iss.type === 'spelling' && 'Lỗi chính tả'}
                            {iss.type === 'grammar' && 'Lỗi ngữ pháp'}
                            {iss.type === 'style' && 'Văn phong / Diễn đạt'}
                            {iss.type === 'citation' && 'Trích dẫn nguồn'}
                          </div>
                          
                          <div className="issue-comparison">
                            <span className="issue-bad">{iss.original}</span>
                            <ArrowRight size={16} className="arrow" />
                            <span className="issue-good">{iss.suggestion}</span>
                          </div>

                          {iss.reason && (
                            <div className="issue-reason">
                              <strong>Lý do:</strong> {iss.reason}
                            </div>
                          )}

                          {iss.context && (
                            <div className="issue-context">
                              <em>"...{iss.context}..."</em>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {result.pedagogicalAdvice && (
                    <div className="pedagogical-box">
                      <div className="pedagogical-title">
                        <Sparkles size={16} />
                        <span>Lời khuyên nâng cấp chuẩn mực học thuật:</span>
                      </div>
                      <p>{result.pedagogicalAdvice}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: REFINED & EDITABLE TEXT */}
              {result && activeTab === 'editor' && (
                <div className="tab-editor">
                  <div className="editor-toolbar">
                    <div className="editor-toolbar-hint">
                      <CheckCircle2 size={16} />
                      <span>Văn bản đã được sửa tự động. Bạn có thể chỉnh sửa thêm trực tiếp vào ô bên dưới trước khi lưu.</span>
                    </div>
                    <div className="editor-btns">
                      <button className="btn-secondary" onClick={handleCopyImproved}>
                        {copied ? <Check size={16} className="text-green" /> : <Copy size={16} />}
                        <span>{copied ? 'Đã sao chép' : 'Sao chép văn bản'}</span>
                      </button>
                      <button className="btn-primary" onClick={handleDownloadWord}>
                        <Download size={16} />
                        <span>Lưu file Word (.doc)</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    className="improved-textarea"
                    value={editableRefinedText}
                    onChange={e => setEditableRefinedText(e.target.value)}
                    placeholder="Nội dung văn bản đã hoàn thiện..."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CÀI ĐẶT API KEY */}
      {showKeyModal && (
        <div className="key-modal-overlay" onClick={() => setShowKeyModal(false)}>
          <div className="key-modal-content" onClick={e => e.stopPropagation()}>
            <div className="key-modal-header">
              <h3>Cấu hình Google Gemini API Key</h3>
              <button className="close-btn" onClick={() => setShowKeyModal(false)}>×</button>
            </div>
            <div className="key-modal-body">
              <p>
                Hệ thống mặc định sử dụng API Key máy chủ. Nếu muốn sử dụng hạn mức riêng không giới hạn, bạn có thể nhập Gemini API Key cá nhân của mình tại đây:
              </p>
              <input
                type="text"
                placeholder="AIzaSy..."
                defaultValue={customApiKey}
                id="customKeyInput"
                className="key-input"
              />
              <div className="key-hint">
                Chưa có khóa? Lấy miễn phí tại{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
                  Google AI Studio <ExternalLink size={12} />
                </a>
              </div>
            </div>
            <div className="key-modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  handleSaveCustomKey('');
                }}
              >
                Xóa Key (Dùng mặc định)
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  const input = document.getElementById('customKeyInput') as HTMLInputElement;
                  handleSaveCustomKey(input?.value || '');
                }}
              >
                Lưu API Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  FileSpreadsheet
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

const SAMPLE_TEXT = `KỶ NGUYÊN SỐ VÀ PHƯƠNG PHÁP GIẢNG DẠY ĐẠI HỌC HIỆN ĐẠI

1. Đặt vấn đề và bối cảnh chuyển đổi số
Trong bối cảnh công nghệ thông tin phát triển mạnh mẽ, giáo dục đại học đang chứng kiến sự thay đổi sâu xắc về cả phương pháp lẩn công cụ truyền tải tri thức. Chuyển đổi số không chỉ đơn thuần là việc số hoá các tài liệu giấy mà là sự tái cấu trúc toàn diện quy trình dạy và học nhằm nâng cao hiệu quả đào tạo.

2. Trích dẫn nguyên lý học tập tích cực
Theo các nghiên cứu về giáo dục học: "Người học chỉ thực sự làm chủ kiến thức khi họ được chủ động tham gia vào quá trình khám phá, thảo luận và giải quyết các bài toán thực tiễn thay vì tiếp nhận thụ động từ một phía." Do đó, việc ứng dụng hệ thống quản lý học tập (LMS) kết hợp với các công cụ tương tác trực quan là một xu hướng tất yếu.

Tuy nhiên, nhiều giảng viên vẫn còn lúng túng trong khâu thiết kế bài giảng điện tử. Các lỗi phổ biến thường gặp bao gồm: việc sao chép nguyên văn các đoạn tài liệu trên mạng internet mà không ghi rỏ trích dẫn nguồn gốc tác giả, sử dụng hình ảnh minh hoạ chưa được phép, hoặc văn phong diễn đạt còn lủng củng, câu văn què cụt thiếu chủ ngữ vị ngữ.

3. Kết luận và định hướng
Để nâng cao chất lượng đào tạo, mỗi nhà giáo cần chủ động rà soát kĩ lưỡng nội dung giáo trình, giáo án trước khi xuất bản hoặc đưa lên môi trường trực tuyến, đảm bảo tính liêm chính học thuật và tuân thủ nghiêm ngặt Luật Sở hữu Trí tuệ.`;

export default function DocComplianceChecker() {
  const { showToast } = useNotification();

  // Input states
  const [inputText, setInputText] = useState<string>(SAMPLE_TEXT);
  const [fileName, setFileName] = useState<string>('Van_ban_mau_kiem_tra.docx');
  const [documentType, setDocumentType] = useState<string>('giao_trinh');
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

      if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        extracted = res.value || '';
      } else if (lower.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let pdfText = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageStr = textContent.items.map((item: any) => item.str).join(' ');
          pdfText += pageStr + '\n\n';
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

      setResult(data.result);
      setActiveTab('turnitin');
      showToast('Đã thẩm định đạo văn và phân tích nguồn trùng lặp thành công!', 'success');
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
          Biên tập & Kiểm tra chuẩn mực học thuật bởi ITE PDFStudio (Luật SHTT 2022 & Quy chuẩn Ngôn ngữ)<br/>
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
    report += `Hệ thống: ITE PDFStudio Academic Integrity Engine (Luật SHTT 2022)\n`;
    report += `Thời gian xuất: ${dateStr} ${timeStr}\n`;
    report += `Tên tệp: ${fileName}\n`;
    report += `---------------------------------------------------------\n\n`;

    report += `1. CHỈ SỐ TƯƠNG ĐỒNG TỔNG QUAN (SIMILARITY INDEX):\n`;
    report += `- Tỷ lệ tương đồng tổng thể: ${result.plagiarismAnalysis.similarityScore}%\n`;
    report += `- Đánh giá rủi ro: ${result.plagiarismAnalysis.riskLevel}\n`;
    report += `- Điểm chuẩn mực học thuật: ${result.summary.qualityScore}/100\n`;
    report += `- Tổng số từ: ${result.summary.totalWords}\n`;
    report += `- Nguồn Internet: ${result.plagiarismAnalysis.breakdown?.internetSourcesPercent || 0}%\n`;
    report += `- Ấn phẩm & Giáo trình: ${result.plagiarismAnalysis.breakdown?.publicationsPercent || 0}%\n`;
    report += `- Kho luận văn người học: ${result.plagiarismAnalysis.breakdown?.studentPapersPercent || 0}%\n\n`;

    report += `2. ĐÁNH GIÁ CHUYÊN MÔN:\n`;
    report += `${result.plagiarismAnalysis.assessment}\n\n`;

    report += `3. DANH SÁCH CÁC NGUỒN TƯƠNG ĐỒNG CHÍNH (PRIMARY SOURCES):\n`;
    (result.plagiarismAnalysis.matchedSources || []).forEach(src => {
      report += `[Nguồn ${src.sourceId}] ${src.similarityPercent}% - ${src.sourceTitle}\n`;
      report += `   Loại nguồn: ${src.sourceType} | Đơn vị: ${src.authorOrDomain || 'N/A'}\n`;
      if (src.url) report += `   URL: ${src.url}\n`;
      report += `\n`;
    });

    report += `4. CHI TIẾT CÁC ĐOẠN NGHI VẤN ĐẠO VĂN & GỢI Ý PARAPHRASE:\n`;
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
    report += `Biên bản kiểm tra hợp chuẩn phục vụ đào tạo và giảng dạy LMS.\n`;

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
            <span>Turnitin Similarity Engine & Thẩm Định Bản Quyền Số</span>
          </div>
          <h1>Hệ Thống Kiểm Tra Đạo Văn Chuyên Dụng (Chuẩn Turnitin) & Biên Tập Ngôn Ngữ</h1>
          <p className="compliance-desc">
            Bóc tách chỉ số trùng lặp (Similarity Index), đối chiếu kho dữ liệu ấn phẩm, internet và luận văn. Đánh dấu highlight trực quan từng nguồn tương đồng, hỗ trợ viết lại (paraphrase) và rà soát lỗi chính tả theo Luật SHTT 2022.
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
                <option value="giao_trinh">📚 Giáo trình Đại học / Cao đẳng</option>
                <option value="giao_an">📝 Kế hoạch bài dạy / Giáo án (KHBD)</option>
                <option value="luan_van">🎓 Luận văn Thạc sĩ / Khóa luận tốt nghiệp</option>
                <option value="bai_bao">📄 Bài báo Khoa học / Đề tài Nghiên cứu</option>
                <option value="tai_lieu">📑 Tài liệu đào tạo / Báo cáo chuyên đề</option>
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
                    <span className="legend-tag"><span className="color-dot dot-match"></span> Đoạn trùng khớp có màu</span>
                    {selectedSourceId ? (
                      <button className="clear-filter-source-btn" onClick={() => setSelectedSourceId(null)}>
                        Đang xem nguồn #{selectedSourceId} (Bấm xem tất cả)
                      </button>
                    ) : (
                      <span className="legend-sub">Nhấp vào nguồn ở cột bên phải để lọc</span>
                    )}
                  </div>
                  <div 
                    className="turnitin-highlight-view"
                    dangerouslySetInnerHTML={{ __html: result.highlightedHtml }}
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
                  <div className="similarity-circle">
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
                  <button className="export-report-btn" onClick={handleExportTurnitinReport}>
                    <Download size={15} />
                    <span>Xuất Báo Cáo (.txt)</span>
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

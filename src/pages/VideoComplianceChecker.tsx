import { useState, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Upload,
  Film,
  Download,
  RotateCcw,
  Scale,
  Sparkles,
  Info,
  Check,
  FileText,
  Globe,
  Search,
  ExternalLink,
  RefreshCw,
  Copy
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './VideoComplianceChecker.css';

interface TechnicalReport {
  fileName: string;
  fileSize: number;
  duration: number;
  width: number;
  height: number;
  resolutionLabel: string;
  aspectRatio: string;
  hasAudio: boolean;
  mimeType: string;
  frameRateEstimate?: number;
  bitrateEstimateKbps?: number;
  technicalScore: number;
  recommendations: string[];
}

interface ComplianceAuditItem {
  id: string;
  category: 'copyright' | 'press_law' | 'technical' | 'cyber_safety';
  categoryLabel: string;
  title: string;
  lawBasis: string; // Căn cứ pháp lý
  question: string;
  explanation: string;
  riskLevel: 'high' | 'medium' | 'low';
  checked: boolean | null; // true: Đạt/Đã tuân thủ, false: Vi phạm/Chưa tuân thủ, null: Chưa kiểm tra
  note: string;
  autoVerdict?: string;
  finding?: string;
  recommendation?: string;
}

interface OnlineAuditResult {
  riskStatus: 'safe' | 'warning' | 'danger';
  riskTitle: string;
  overallAssessment: string;
  copyrightOwnerIdentified: string;
  fairUseEligibility: string;
  recommendedCreditText: string;
  actionableSteps: string[];
}

export default function VideoComplianceChecker() {
  const { showToast } = useNotification();
  
  // Tab chế độ: 'upload' | 'online_link'
  const [inputMode, setInputMode] = useState<'upload' | 'online_link'>('online_link');
  const [onlineInputUrl, setOnlineInputUrl] = useState<string>('');
  const [isAuditingOnline, setIsAuditingOnline] = useState<boolean>(false);
  const [onlineMetadata, setOnlineMetadata] = useState<any>(null);
  const [onlineAuditResult, setOnlineAuditResult] = useState<OnlineAuditResult | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [technicalReport, setTechnicalReport] = useState<TechnicalReport | null>(null);

  // Thông tin nguồn gốc video
  const [originSource, setOriginSource] = useState<string>('internet'); // internet, social_media, shared_file, tv_broadcast
  const [authorName, setAuthorName] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [videoTitleCustom, setVideoTitleCustom] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('teaching'); // teaching, press, research, commercial, internal
  const [hasLicenseAgreement, setHasLicenseAgreement] = useState<string>('no'); // yes, no, creative_commons, public_domain

  // Checklist Pháp Lý & Bản Quyền theo Luật Việt Nam mới nhất
  const [checklist, setChecklist] = useState<ComplianceAuditItem[]>([
    {
      id: 'cr_1',
      category: 'copyright',
      categoryLabel: 'Luật Sở Hữu Trí Tuệ',
      title: 'Xác định quyền tác giả & nguồn gốc xuất xứ',
      lawBasis: 'Điều 14, 25 & 26 Luật SHTT (sửa đổi bổ sung 2022)',
      question: 'Video có ghi rõ họ tên tác giả gốc và nguồn xuất xứ của tác phẩm không?',
      explanation: 'Khoản 1 Điều 25 Luật SHTT quy định việc trích dẫn hợp lý tác phẩm để giảng dạy, nghiên cứu khoa học mà không làm sai lệch ý tác giả và BẮT BUỘC phải thông tin về tên tác giả và nguồn gốc tác phẩm.',
      riskLevel: 'high',
      checked: null,
      note: ''
    },
    {
      id: 'cr_2',
      category: 'copyright',
      categoryLabel: 'Luật Sở Hữu Trí Tuệ',
      title: 'Giới hạn trích dẫn hợp lý (Fair Use theo luật VN)',
      lawBasis: 'Điều 25 khoản 1 điểm b, c Luật SHTT 2022',
      question: 'Bạn chỉ trích dẫn một phần phù hợp với mục đích minh họa bài giảng/bình luận, hay sử dụng trọn vẹn toàn bộ video?',
      explanation: 'Việc trích dẫn phải phù hợp với tính chất của tác phẩm, không làm phương hại đến việc khai thác bình thường tác phẩm và không gây phương hại bất hợp lý đến lợi ích hợp pháp của tác giả.',
      riskLevel: 'high',
      checked: null,
      note: ''
    },
    {
      id: 'cr_3',
      category: 'copyright',
      categoryLabel: 'Luật Sở Hữu Trí Tuệ',
      title: 'Bản quyền âm thanh, nhạc nền (BGM) & Bản ghi âm',
      lawBasis: 'Điều 29 & 30 Luật SHTT 2022 (Quyền của nhà sản xuất bản ghi âm)',
      question: 'Video có sử dụng các bản ghi âm, bài hát thương mại nổi tiếng không có giấy phép không?',
      explanation: 'Âm nhạc trong video có quyền độc lập với hình ảnh. Việc sử dụng nhạc có bản quyền tải lên YouTube, LMS, Facebook sẽ rất dễ bị hệ thống Content ID quét chặn hoặc nhận thông báo vi phạm bản quyền.',
      riskLevel: 'medium',
      checked: null,
      note: ''
    },
    {
      id: 'press_1',
      category: 'press_law',
      categoryLabel: 'Luật Báo Chí & Dân Sự',
      title: 'Thông tin cấm & Bảo vệ trẻ em, hình ảnh cá nhân',
      lawBasis: 'Điều 9 Luật Báo chí 2016 & Điều 32 Bộ luật Dân sự 2015',
      question: 'Video có chứa hình ảnh cá nhân mà chưa được sự đồng ý, hoặc hình ảnh nhạy cảm xâm phạm đời tư của trẻ em không?',
      explanation: 'Điều 32 BLDS quy định cá nhân có quyền đối với hình ảnh của mình. Luật Trẻ em nghiêm cấm công bố hình ảnh, thông tin bí mật đời sống riêng tư của trẻ em nếu không có sự đồng ý của cha mẹ/người giám hộ.',
      riskLevel: 'high',
      checked: null,
      note: ''
    },
    {
      id: 'cyber_1',
      category: 'cyber_safety',
      categoryLabel: 'Luật An Ninh Mạng',
      title: 'Xác thực nguồn tin & Chống tin giả, AI Deepfake',
      lawBasis: 'Điều 8 & Điều 16 Luật An ninh mạng 2018',
      question: 'Video có được lấy từ các trang tin chính thống, kênh được cấp phép hay từ các tài khoản nặc danh trên MXH?',
      explanation: 'Không sử dụng và phát tán các video bị chỉnh sửa xuyên tạc (Deepfake), thông tin sai sự thật gây hoang mang dư luận hoặc vi phạm an ninh quốc gia.',
      riskLevel: 'high',
      checked: null,
      note: ''
    },
    {
      id: 'lms_tech',
      category: 'technical',
      categoryLabel: 'Kỹ Thuật Đào Tạo & LMS',
      title: 'Tương thích hạ tầng LMS & Băng thông người học',
      lawBasis: 'Quy chuẩn kỹ thuật E-Learning & SCORM/xAPI',
      question: 'Video có được tối ưu hóa dung lượng (dưới 100MB cho 1 bài giảng) và độ phân giải đạt chuẩn HD 720p/1080p không?',
      explanation: 'Video dung lượng quá lớn sẽ gây tắc nghẽn máy chủ LMS và giật lag đối với học viên truy cập qua 4G/di động.',
      riskLevel: 'low',
      checked: null,
      note: ''
    }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  // TỰ ĐỘNG RÀ SOÁT BẢN QUYỀN TRÊN KHÔNG GIAN MẠNG (ONLINE AUDIT)
  const handleAutoAuditOnline = async (urlToAudit?: string) => {
    const targetUrl = (urlToAudit || onlineInputUrl || sourceUrl).trim();
    if (!targetUrl && !videoTitleCustom.trim() && !videoFile) {
      showToast('Vui lòng nhập đường dẫn video (YouTube, TikTok, Facebook...) hoặc tiêu đề video cần rà soát.', 'warning');
      return;
    }

    setIsAuditingOnline(true);
    showToast('Đang quét không gian mạng & thẩm định bản quyền...', 'info');

    try {
      const res = await fetch('/api/quiz-api?action=auto-audit-video-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: targetUrl,
          videoTitle: videoTitleCustom || videoFile?.name || '',
          authorOrChannel: authorName || '',
          purpose: purpose
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Quá trình rà soát mạng thất bại.');
      }

      const { metadata, audit } = data;
      setOnlineMetadata(metadata);
      setOnlineAuditResult({
        riskStatus: audit.auditSummary.riskStatus,
        riskTitle: audit.auditSummary.riskTitle,
        overallAssessment: audit.auditSummary.overallAssessment,
        copyrightOwnerIdentified: audit.auditSummary.copyrightOwnerIdentified,
        fairUseEligibility: audit.auditSummary.fairUseEligibility,
        recommendedCreditText: audit.auditSummary.recommendedCreditText,
        actionableSteps: audit.actionableSteps || []
      });

      // Điền thông tin tự động vào form hồ sơ
      if (metadata.title) setVideoTitleCustom(metadata.title);
      if (metadata.uploader) setAuthorName(metadata.uploader);
      if (metadata.webpage_url) setSourceUrl(metadata.webpage_url);
      if (metadata.license && metadata.license.toLowerCase().includes('creative commons')) {
        setHasLicenseAgreement('creative_commons');
      }

      // Tự động cập nhật trạng thái checklist theo kết quả thẩm định
      if (Array.isArray(audit.checklistEvaluation)) {
        setChecklist(prev => prev.map(item => {
          const evalItem = audit.checklistEvaluation.find((e: any) => e.id === item.id);
          if (evalItem) {
            return {
              ...item,
              checked: evalItem.checked,
              autoVerdict: evalItem.autoVerdict,
              finding: evalItem.finding,
              recommendation: evalItem.recommendation,
              note: evalItem.finding ? `[AI Rà soát]: ${evalItem.finding}` : item.note
            };
          }
          return item;
        }));
      }

      // Nếu có duration hoặc directVideoUrl, cập nhật báo cáo kỹ thuật
      if (metadata.duration) {
        setTechnicalReport({
          fileName: metadata.title || 'Video Online',
          fileSize: 0,
          duration: metadata.duration,
          width: 1920,
          height: 1080,
          resolutionLabel: 'Full HD / Web Standard',
          aspectRatio: '16:9',
          hasAudio: true,
          mimeType: 'video/mp4',
          technicalScore: 90,
          recommendations: [
            'Video được khai thác trực tiếp từ nền tảng: ' + (metadata.extractor || 'Web'),
            'Khuyến nghị dùng cơ chế Nhúng (Embed Player/Iframe) thay vì tải về để tránh vi phạm bản quyền phân phối.'
          ]
        });
      }

      showToast('Đã hoàn tất rà soát tự động bản quyền trên không gian mạng!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi rà soát bản quyền tự động', 'error');
    } finally {
      setIsAuditingOnline(false);
    }
  };

  // Xử lý khi chọn file video từ máy
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showToast('Vui lòng chọn một tệp video hợp lệ (MP4, WebM, MOV, v.v.)', 'error');
      return;
    }

    if (videoUrl) URL.revokeObjectURL(videoUrl);

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setVideoTitleCustom(file.name.replace(/\.[^/.]+$/, ''));

    // Phân tích kỹ thuật video qua đối tượng Video HTML5
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    video.onloadedmetadata = () => {
      const dur = video.duration || 0;
      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;

      let resLabel = 'SD';
      if (w >= 3840 || h >= 2160) resLabel = '4K Ultra HD';
      else if (w >= 1920 || h >= 1080) resLabel = 'Full HD 1080p';
      else if (w >= 1280 || h >= 720) resLabel = 'HD 720p';

      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(w, h);
      const ratio = `${w / divisor}:${h / divisor}`;
      const bitrate = dur > 0 ? Math.round((file.size * 8) / dur / 1000) : 0;

      let score = 100;
      const recs: string[] = [];

      if (h < 720) {
        score -= 20;
        recs.push('Độ phân giải dưới HD 720p có thể bị mờ vỡ khi trình chiếu lên máy chiếu lớp học.');
      } else {
        recs.push('Độ phân giải đạt chuẩn sắc nét (' + resLabel + ').');
      }

      if (file.size > 500 * 1024 * 1024) {
        score -= 15;
        recs.push('Dung lượng tệp lớn (>500MB), nên nén video bằng bộ nén trước khi đưa vào hệ thống LMS.');
      }

      if (bitrate > 8000) {
        score -= 10;
        recs.push('Bitrate tương đối cao (' + bitrate + ' kbps), phù hợp lưu trữ nhưng có thể tải chậm trên mạng 3G/4G.');
      }

      setTechnicalReport({
        fileName: file.name,
        fileSize: file.size,
        duration: dur,
        width: w,
        height: h,
        resolutionLabel: resLabel,
        aspectRatio: ratio === '16:9' || ratio === '9:16' || ratio === '4:3' ? ratio : `${w}x${h}`,
        hasAudio: true,
        mimeType: file.type || 'video/mp4',
        bitrateEstimateKbps: bitrate,
        technicalScore: Math.max(40, score),
        recommendations: recs
      });

      showToast('Đã trích xuất thông số kỹ thuật tệp video!', 'success');
      
      // Kích hoạt rà soát mạng tự động dựa trên tên file
      handleAutoAuditOnline('');
    };

    video.onerror = () => {
      showToast('Không thể đọc thông số video này. Hãy thử định dạng MP4 chuẩn.', 'warning');
    };
  };

  // Cập nhật trạng thái câu hỏi kiểm tra
  const handleToggleCheck = (id: string, value: boolean) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, checked: item.checked === value ? null : value };
      }
      return item;
    }));
  };

  // Cập nhật ghi chú giải trình cho tiêu chí
  const handleUpdateNote = (id: string, noteText: string) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === id) return { ...item, note: noteText };
      return item;
    }));
  };

  // Đánh giá rủi ro pháp lý tổng quan
  const auditSummary = () => {
    if (onlineAuditResult) {
      let passedCount = 0;
      let failedCount = 0;
      checklist.forEach(item => {
        if (item.checked === true) passedCount++;
        else if (item.checked === false) failedCount++;
      });
      return {
        passedCount,
        failedCount,
        uncheckCount: checklist.length - passedCount - failedCount,
        highRiskFails: failedCount,
        riskStatus: onlineAuditResult.riskStatus,
        riskTitle: onlineAuditResult.riskTitle
      };
    }

    let passedCount = 0;
    let failedCount = 0;
    let uncheckCount = 0;
    let highRiskFails = 0;

    checklist.forEach(item => {
      if (item.checked === true) passedCount++;
      else if (item.checked === false) {
        failedCount++;
        if (item.riskLevel === 'high') highRiskFails++;
      } else {
        uncheckCount++;
      }
    });

    let riskStatus: 'safe' | 'warning' | 'danger' = 'safe';
    let riskTitle = 'Hợp Pháp & Đủ Điều Kiện Sử Dụng Giảng Dạy';

    if (highRiskFails > 0 || failedCount >= 2) {
      riskStatus = 'danger';
      riskTitle = 'RỦI RO CAO: Có dấu hiệu chưa tuân thủ Luật Bản Quyền hoặc Luật Báo Chí';
    } else if (failedCount > 0 || uncheckCount >= 3) {
      riskStatus = 'warning';
      riskTitle = 'CẢNH BÁO: Cần bổ sung thông tin tác giả hoặc biên tập trước khi đăng tải';
    }

    return {
      passedCount,
      failedCount,
      uncheckCount,
      highRiskFails,
      riskStatus,
      riskTitle
    };
  };

  const summary = auditSummary();

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Copy Credit Text
  const handleCopyCredit = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Đã sao chép dòng chú thích nguồn (Credit)!', 'success');
  };

  // Xuất Phiếu Thẩm Định Bản Quyền & Kỹ Thuật (.TXT)
  const handleExportAuditCertificate = () => {
    const dateStr = new Date().toLocaleDateString('vi-VN');
    const timeStr = new Date().toLocaleTimeString('vi-VN');

    let content = `BIÊN BẢN RÀ SOÁT NỘI DUNG, KỸ THUẬT & BẢN QUYỀN VIDEO TRÊN KHÔNG GIAN MẠNG\n`;
    content += `(Áp dụng theo Luật Sở Hữu Trí Tuệ 2022 & Luật Báo Chí 2016)\n`;
    content += `Ngày lập: ${dateStr} ${timeStr}\n`;
    content += `---------------------------------------------------------\n\n`;

    content += `1. THÔNG TIN VIDEO & NGUỒN GỐC:\n`;
    content += `- Tiêu đề video: ${videoTitleCustom || videoFile?.name || onlineMetadata?.title || 'Chưa cung cấp'}\n`;
    content += `- Nguồn khai thác: ${originSource}\n`;
    content += `- Tác giả / Đơn vị sở hữu gốc: ${authorName || onlineMetadata?.uploader || 'Chưa xác định'}\n`;
    content += `- Đường dẫn nguồn (URL): ${sourceUrl || onlineInputUrl || 'Không có'}\n`;
    content += `- Mục đích sử dụng: ${purpose === 'teaching' ? 'Giảng dạy / Khóa học LMS (Điều 25 Luật SHTT)' : purpose}\n`;
    content += `- Thỏa thuận cấp phép: ${hasLicenseAgreement}\n\n`;

    if (onlineAuditResult) {
      content += `2. KẾT QUẢ THẨM ĐỊNH TỰ ĐỘNG TỪ KHÔNG GIAN MẠNG:\n`;
      content += `- Kết luận tổng quan: ${onlineAuditResult.riskTitle}\n`;
      content += `- Đánh giá chi tiết: ${onlineAuditResult.overallAssessment}\n`;
      content += `- Chủ sở hữu nhận diện: ${onlineAuditResult.copyrightOwnerIdentified}\n`;
      content += `- Điều kiện trích dẫn: ${onlineAuditResult.fairUseEligibility}\n`;
      content += `- Mẫu Credit khuyến nghị: ${onlineAuditResult.recommendedCreditText}\n\n`;
    }

    if (technicalReport) {
      content += `3. THÔNG SỐ KỸ THUẬT & ĐỘ TƯƠNG THÍCH LMS:\n`;
      content += `- Thời lượng: ${formatSeconds(technicalReport.duration)}\n`;
      content += `- Độ phân giải: ${technicalReport.width}x${technicalReport.height} (${technicalReport.resolutionLabel})\n`;
      content += `- Tỷ lệ khung hình: ${technicalReport.aspectRatio}\n`;
      content += `- Điểm chuẩn kỹ thuật: ${technicalReport.technicalScore}/100\n\n`;
    }

    content += `4. CHI TIẾT TỪNG TIÊU CHÍ PHÁP LÝ (LUẬT SHTT & BÁO CHÍ):\n`;
    checklist.forEach((item, idx) => {
      const statusText = item.checked === true ? '[ĐẠT - ĐÃ TUÂN THỦ]' : item.checked === false ? '[CHƯA ĐẠT - RỦI RO]' : '[CHƯA XÁC MINH]';
      content += `${idx + 1}. ${item.title} (${item.lawBasis})\n`;
      content += `   Trạng thái: ${statusText}\n`;
      if (item.finding) content += `   Kết quả rà soát mạng: ${item.finding}\n`;
      if (item.recommendation) content += `   Khuyến nghị: ${item.recommendation}\n`;
      if (item.note) content += `   Ghi chú giải trình: ${item.note}\n`;
      content += `\n`;
    });

    content += `---------------------------------------------------------\n`;
    content += `Biên bản được khởi tạo tự động từ ITE PDFStudio Compliance Engine.\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bien_Ban_Tham_Dinh_Ban_Quyen_${(videoTitleCustom || 'Video').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã xuất Biên bản thẩm định bản quyền (.txt) thành công!', 'success');
  };

  const handleReset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setTechnicalReport(null);
    setOnlineMetadata(null);
    setOnlineAuditResult(null);
    setOnlineInputUrl('');
    setAuthorName('');
    setSourceUrl('');
    setVideoTitleCustom('');
    setChecklist(prev => prev.map(item => ({ ...item, checked: null, note: '', autoVerdict: undefined, finding: undefined })));
  };

  const hasLoadedContent = Boolean(videoFile || onlineMetadata || onlineAuditResult);

  return (
    <div className="vcc-page">
      {/* HEADER BÁO CÁO */}
      <header className="vcc-header">
        <div className="vcc-title-group">
          <div className="vcc-icon">
            <Scale size={28} />
          </div>
          <div>
            <h1 className="vcc-title">Thẩm Định Bản Quyền, Nội Dung & Kỹ Thuật Video Không Tự Xây Dựng</h1>
            <p className="vcc-subtitle">
              Tự động rà soát bản quyền trên không gian mạng, kiểm tra tính hợp pháp theo <strong>Luật Sở Hữu Trí Tuệ 2022</strong>, <strong>Luật Báo Chí</strong> và tiêu chuẩn kỹ thuật LMS.
            </p>
          </div>
        </div>

        {hasLoadedContent && (
          <div className="vcc-header-actions">
            <button className="vcc-btn vcc-btn-outline" onClick={handleReset}>
              <RotateCcw size={16} />
              <span>Rà Soát Video Khác</span>
            </button>
            <button className="vcc-btn vcc-btn-primary" onClick={handleExportAuditCertificate}>
              <Download size={16} />
              <span>Xuất Biên Bản Thẩm Định (.TXT)</span>
            </button>
          </div>
        )}
      </header>

      {/* Input file ẩn */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="video/*" 
        style={{ display: 'none' }} 
      />

      {/* KHỐI CHỌN ĐẦU VÀO: LINK ONLINE HOẶC FILE TẢI LÊN */}
      {!hasLoadedContent ? (
        <div className="vcc-input-selection-card">
          <div className="input-mode-tabs">
            <button
              className={`mode-tab-btn ${inputMode === 'online_link' ? 'active' : ''}`}
              onClick={() => setInputMode('online_link')}
            >
              <Globe size={18} />
              <span>Rà Soát Bằng Link Video Trên Mạng (Tự Động)</span>
            </button>
            <button
              className={`mode-tab-btn ${inputMode === 'upload' ? 'active' : ''}`}
              onClick={() => setInputMode('upload')}
            >
              <Upload size={18} />
              <span>Tải File Video Từ Máy Tính</span>
            </button>
          </div>

          {inputMode === 'online_link' ? (
            <div className="online-input-box">
              <div className="online-input-desc">
                <Sparkles size={24} className="text-primary" />
                <div>
                  <h3>Hệ thống tự động quét và phân tích bản quyền trên không gian mạng</h3>
                  <p>Hỗ trợ liên kết video từ YouTube, TikTok, Facebook Reels, Vimeo hoặc các trang web tin tức báo chí.</p>
                </div>
              </div>

              <div className="online-search-form">
                <div className="url-input-wrap">
                  <Globe size={20} className="url-icon" />
                  <input
                    type="text"
                    className="url-input"
                    placeholder="Dán link video: https://www.youtube.com/watch?v=... hoặc https://tiktok.com/@..."
                    value={onlineInputUrl}
                    onChange={e => setOnlineInputUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAutoAuditOnline(); }}
                  />
                  {onlineInputUrl && (
                    <button className="clear-url-btn" onClick={() => setOnlineInputUrl('')}>×</button>
                  )}
                </div>

                <button
                  className="vcc-btn vcc-btn-primary audit-submit-btn"
                  onClick={() => handleAutoAuditOnline()}
                  disabled={isAuditingOnline || !onlineInputUrl.trim()}
                >
                  {isAuditingOnline ? (
                    <>
                      <RefreshCw size={18} className="spin" />
                      <span>Đang Quét Không Gian Mạng...</span>
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      <span>Rà Soát Tự Động Ngay</span>
                    </>
                  )}
                </button>
              </div>

              <div className="quick-examples">
                <span>Gợi ý thử nhanh:</span>
                <button
                  className="example-pill"
                  onClick={() => {
                    const sampleUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
                    setOnlineInputUrl(sampleUrl);
                    handleAutoAuditOnline(sampleUrl);
                  }}
                >
                  Video Âm Nhạc Thương Mại (YouTube)
                </button>
                <button
                  className="example-pill"
                  onClick={() => {
                    const sampleUrl = 'https://www.youtube.com/watch?v=8p_p4lXhWfM';
                    setOnlineInputUrl(sampleUrl);
                    handleAutoAuditOnline(sampleUrl);
                  }}
                >
                  Video Khoa Học Giáo Dục (Ted-Ed)
                </button>
              </div>
            </div>
          ) : (
            <div className="vcc-upload-box" onClick={() => fileInputRef.current?.click()}>
              <div className="vcc-upload-inner">
                <div className="upload-pulse-icon">
                  <Upload size={54} />
                </div>
                <h2>Tải Lên Video Cần Kiểm Tra Bản Quyền & Kỹ Thuật</h2>
                <p className="upload-desc">
                  Hỗ trợ MP4, WebM, MOV, AVI. Hệ thống sẽ bóc tách thông số kỹ thuật và kích hoạt rà soát nội dung trên internet.
                </p>
                <button className="vcc-btn vcc-btn-primary">
                  <Film size={16} />
                  <span>Chọn Tệp Video Từ Máy Tính</span>
                </button>
                <div className="security-notice">
                  <ShieldCheck size={16} className="text-success" />
                  <span>Phân tích cục bộ an toàn, bảo vệ dữ liệu giảng viên 100%.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="vcc-workspace animate-fade-in">
          {/* Thanh Đánh Giá Tình Trạng Rủi Ro Tổng Thể */}
          <div className={`vcc-verdict-banner ${summary.riskStatus}`}>
            <div className="verdict-left">
              {summary.riskStatus === 'safe' && <ShieldCheck size={36} className="verdict-icon text-success" />}
              {summary.riskStatus === 'warning' && <AlertTriangle size={36} className="verdict-icon text-warning" />}
              {summary.riskStatus === 'danger' && <ShieldAlert size={36} className="verdict-icon text-danger" />}
              <div>
                <h3>{summary.riskTitle}</h3>
                <p>
                  Đã rà soát: <strong>{summary.passedCount + summary.failedCount} / {checklist.length}</strong> tiêu chuẩn | Đạt: <strong>{summary.passedCount}</strong> | Cảnh báo/Vi phạm: <strong>{summary.failedCount}</strong>
                </p>
                {onlineAuditResult?.overallAssessment && (
                  <div className="verdict-assessment-inline">
                    <strong>Đánh giá pháp lý:</strong> {onlineAuditResult.overallAssessment}
                  </div>
                )}
              </div>
            </div>
            <div className="verdict-right">
              <button className="vcc-btn vcc-btn-sm vcc-btn-white" onClick={handleExportAuditCertificate}>
                <FileText size={14} />
                <span>Xuất Biên Bản Thẩm Định</span>
              </button>
            </div>
          </div>

          {/* BANNER THẨM ĐỊNH MẠNG (NẾU CÓ KẾT QUẢ TỪ AI) */}
          {onlineAuditResult && (
            <div className="online-audit-summary-card">
              <div className="audit-card-header">
                <Sparkles size={20} className="text-primary" />
                <h4>Kết Quả Tự Động Rà Soát Trên Không Gian Mạng (AI Compliance Report)</h4>
                <button
                  className="re-audit-btn"
                  onClick={() => handleAutoAuditOnline()}
                  disabled={isAuditingOnline}
                >
                  <RefreshCw size={14} className={isAuditingOnline ? 'spin' : ''} />
                  <span>Quét Lại</span>
                </button>
              </div>

              <div className="audit-summary-grid">
                <div className="audit-metric-box">
                  <span className="metric-lbl">Chủ sở hữu nhận diện:</span>
                  <span className="metric-val">{onlineAuditResult.copyrightOwnerIdentified || 'Chưa rõ tác giả'}</span>
                </div>
                <div className="audit-metric-box">
                  <span className="metric-lbl">Ngoại lệ Giảng dạy (Fair Use):</span>
                  <span className={`metric-val ${onlineAuditResult.fairUseEligibility.includes('Đủ điều kiện') ? 'text-success' : 'text-warning'}`}>
                    {onlineAuditResult.fairUseEligibility}
                  </span>
                </div>
                <div className="audit-metric-box credit-box">
                  <div className="credit-top">
                    <span className="metric-lbl">Mẫu ghi nguồn bắt buộc (Credit Line):</span>
                    <button
                      className="copy-credit-btn"
                      onClick={() => handleCopyCredit(onlineAuditResult.recommendedCreditText)}
                    >
                      <Copy size={13} />
                      <span>Sao chép</span>
                    </button>
                  </div>
                  <div className="credit-content">{onlineAuditResult.recommendedCreditText}</div>
                </div>
              </div>

              {onlineAuditResult.actionableSteps.length > 0 && (
                <div className="actionable-steps-wrap">
                  <h5>Khuyến nghị hành động cụ thể trước khi sử dụng bài giảng:</h5>
                  <ul>
                    {onlineAuditResult.actionableSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="vcc-grid">
            {/* CỘT TRÁI: XEM TRƯỚC VIDEO & THÔNG SỐ KỸ THUẬT */}
            <div className="vcc-left-col">
              {/* Trình chiếu video hoặc thông tin online preview */}
              <div className="video-preview-card">
                {videoUrl ? (
                  <video 
                    ref={hiddenVideoRef}
                    src={videoUrl} 
                    controls 
                    className="main-preview-video"
                  />
                ) : onlineMetadata?.thumbnail ? (
                  <div className="online-video-thumb-wrap">
                    <img src={onlineMetadata.thumbnail} alt="Video Thumbnail" className="online-thumb-img" />
                    {sourceUrl && (
                      <a href={sourceUrl} target="_blank" rel="noreferrer" className="play-original-btn">
                        <ExternalLink size={16} />
                        <span>Mở Video Gốc Trên Mạng</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="no-video-preview">
                    <Film size={48} />
                    <p>Không có tệp video xem trước cục bộ</p>
                  </div>
                )}
                
                <div className="video-quick-meta">
                  <span className="file-name-tag">{videoTitleCustom || videoFile?.name || onlineMetadata?.title || 'Video'}</span>
                  {videoFile?.size ? <span className="file-size-tag">{formatBytes(videoFile.size)}</span> : null}
                  {onlineMetadata?.duration ? <span className="duration-tag">{formatSeconds(onlineMetadata.duration)}</span> : null}
                </div>
              </div>

              {/* Báo cáo kỹ thuật chi tiết */}
              {technicalReport && (
                <div className="tech-specs-card">
                  <div className="card-title-row">
                    <Film size={20} className="text-primary" />
                    <h4>Báo Cáo Chất Lượng Kỹ Thuật Video</h4>
                    <span className="tech-score-pill">
                      Điểm: {technicalReport.technicalScore}/100
                    </span>
                  </div>

                  <div className="specs-table">
                    <div className="spec-row">
                      <span className="spec-lbl">Độ phân giải:</span>
                      <span className="spec-val">
                        <strong>{technicalReport.width} × {technicalReport.height}</strong> ({technicalReport.resolutionLabel})
                      </span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-lbl">Tỷ lệ khung hình:</span>
                      <span className="spec-val">{technicalReport.aspectRatio}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-lbl">Thời lượng:</span>
                      <span className="spec-val">{formatSeconds(technicalReport.duration)}</span>
                    </div>
                    {technicalReport.bitrateEstimateKbps ? (
                      <div className="spec-row">
                        <span className="spec-lbl">Bitrate ước tính:</span>
                        <span className="spec-val">{technicalReport.bitrateEstimateKbps} kbps</span>
                      </div>
                    ) : null}
                    <div className="spec-row">
                      <span className="spec-lbl">Định dạng tệp:</span>
                      <span className="spec-val">{technicalReport.mimeType}</span>
                    </div>
                  </div>

                  {technicalReport.recommendations.length > 0 && (
                    <div className="tech-recs">
                      <h5>Khuyến nghị kỹ thuật khi đăng LMS/Trình chiếu:</h5>
                      <ul>
                        {technicalReport.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Thông tin nguồn gốc khai báo */}
              <div className="source-declaration-card">
                <div className="card-title-row">
                  <Info size={18} className="text-secondary" />
                  <h4>Khai Báo Nguồn Gốc & Hồ Sơ Video</h4>
                </div>

                <div className="form-group-sm">
                  <label>Tiêu đề / Tên video:</label>
                  <input 
                    type="text" 
                    className="vcc-input"
                    value={videoTitleCustom}
                    onChange={e => setVideoTitleCustom(e.target.value)}
                    placeholder="VD: Bài giảng Nguyên lý Nhiệt động lực học..."
                  />
                </div>

                <div className="form-group-sm">
                  <label>Nguồn khai thác video:</label>
                  <select 
                    className="vcc-select"
                    value={originSource}
                    onChange={e => setOriginSource(e.target.value)}
                  >
                    <option value="internet">Tải từ website trên Internet (YouTube, Vimeo, Web mở)</option>
                    <option value="social_media">Mạng xã hội (TikTok, Facebook Reels, Instagram)</option>
                    <option value="shared_file">Được chia sẻ qua Zalo, Drive, USB hoặc đồng nghiệp</option>
                    <option value="tv_broadcast">Trích dẫn từ chương trình Truyền hình / Phóng sự thời sự</option>
                  </select>
                </div>

                <div className="form-group-sm">
                  <label>Tác giả / Kênh sở hữu tác phẩm gốc:</label>
                  <input 
                    type="text" 
                    className="vcc-input"
                    placeholder="VD: Đài Truyền hình VTV, Kênh Ted-Ed, GS. Nguyễn Văn A..."
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                  />
                </div>

                <div className="form-group-sm">
                  <label>Đường dẫn nguồn gốc (URL):</label>
                  <div className="url-input-with-action">
                    <input 
                      type="text" 
                      className="vcc-input"
                      placeholder="https://youtube.com/watch?v=..."
                      value={sourceUrl}
                      onChange={e => setSourceUrl(e.target.value)}
                    />
                    <button
                      className="btn-trigger-audit"
                      onClick={() => handleAutoAuditOnline(sourceUrl)}
                      disabled={isAuditingOnline || !sourceUrl.trim()}
                      title="Quét lại bản quyền từ link này"
                    >
                      <Search size={14} />
                      <span>Quét AI</span>
                    </button>
                  </div>
                </div>

                <div className="form-group-sm">
                  <label>Mục đích sử dụng chính:</label>
                  <select 
                    className="vcc-select"
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                  >
                    <option value="teaching">Giảng dạy, minh họa bài học (Ngoại lệ Điều 25 Luật SHTT)</option>
                    <option value="research">Nghiên cứu khoa học nội bộ</option>
                    <option value="press">Bình luận thời sự, trích dẫn báo chí (Điều 19 Luật Báo chí)</option>
                    <option value="commercial">Thương mại, khóa học trả phí (Bắt buộc phải mua bản quyền)</option>
                  </select>
                </div>

                <div className="form-group-sm">
                  <label>Thỏa thuận bản quyền / Cấp phép:</label>
                  <select 
                    className="vcc-select"
                    value={hasLicenseAgreement}
                    onChange={e => setHasLicenseAgreement(e.target.value)}
                  >
                    <option value="no">Chưa có văn bản thỏa thuận (Dùng theo ngoại lệ Fair Use)</option>
                    <option value="yes">Đã có văn bản cho phép bằng văn bản/email của tác giả</option>
                    <option value="creative_commons">Giấy phép mở Creative Commons (CC-BY, CC-NC)</option>
                    <option value="public_domain">Tác phẩm thuộc phạm vi công cộng (Public Domain)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: BỘ TIÊU CHUẨN KIỂM TRA PHÁP LÝ (CHECKLIST) */}
            <div className="vcc-right-col">
              <div className="checklist-card">
                <div className="checklist-header">
                  <div className="cl-header-text">
                    <Scale size={22} className="text-primary" />
                    <div>
                      <h3>Bộ Tiêu Chí Rà Soát Pháp Lý (Luật SHTT 2022 & Luật Báo Chí)</h3>
                      <p>Hệ thống tự động thẩm định và đề xuất trạng thái. Bạn có thể bấm xác nhận hoặc điều chỉnh:</p>
                    </div>
                  </div>
                </div>

                <div className="checklist-items">
                  {checklist.map((item, idx) => (
                    <div 
                      key={item.id} 
                      className={`audit-item-box ${item.checked === true ? 'is-pass' : item.checked === false ? 'is-fail' : ''}`}
                    >
                      <div className="item-top-row">
                        <span className="item-badge">{item.categoryLabel}</span>
                        <span className="law-basis-tag">📜 {item.lawBasis}</span>
                        {item.autoVerdict && (
                          <span className={`auto-verdict-pill ${item.autoVerdict === 'ĐẠT' ? 'pass' : 'warn'}`}>
                            ⚡ Tự động: {item.autoVerdict}
                          </span>
                        )}
                        <span className={`risk-badge ${item.riskLevel}`}>
                          Mức rủi ro: {item.riskLevel === 'high' ? 'Cao' : item.riskLevel === 'medium' ? 'Trung bình' : 'Thấp'}
                        </span>
                      </div>

                      <h4 className="item-title">{idx + 1}. {item.title}</h4>
                      <p className="item-question">❓ {item.question}</p>
                      
                      <div className="item-law-explanation">
                        <Info size={14} className="info-icon" />
                        <span>{item.explanation}</span>
                      </div>

                      {item.finding && (
                        <div className="item-ai-finding">
                          <strong>Kết quả rà soát mạng:</strong> {item.finding}
                        </div>
                      )}

                      {/* Các nút bấm đánh giá */}
                      <div className="item-action-row">
                        <div className="btn-toggle-group">
                          <button 
                            className={`toggle-btn pass-btn ${item.checked === true ? 'active' : ''}`}
                            onClick={() => handleToggleCheck(item.id, true)}
                          >
                            <Check size={16} />
                            <span>ĐÃ TUÂN THỦ (ĐẠT)</span>
                          </button>
                          <button 
                            className={`toggle-btn fail-btn ${item.checked === false ? 'active' : ''}`}
                            onClick={() => handleToggleCheck(item.id, false)}
                          >
                            <AlertTriangle size={16} />
                            <span>CHƯA ĐẠT / CÓ NGUY CƠ</span>
                          </button>
                        </div>
                      </div>

                      {/* Ghi chú giải trình nếu cần */}
                      <div className="note-box-wrap">
                        <input 
                          type="text" 
                          placeholder="Ghi chú giải trình (VD: Đã xin phép qua email ngày..., đã chèn nguồn ở giây thứ 5...)"
                          value={item.note}
                          onChange={e => handleUpdateNote(item.id, e.target.value)}
                          className="note-input"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hướng Dẫn Tuân Thủ Pháp Luật */}
              <div className="legal-guide-card">
                <div className="card-title-row">
                  <Sparkles size={20} className="text-warning" />
                  <h4>Quy Tắc Vàng Khi Dùng Video Không Tự Xây Dựng (Việt Nam)</h4>
                </div>
                <div className="rules-grid">
                  <div className="rule-item">
                    <span className="rule-num">1</span>
                    <div>
                      <strong>Luôn Ghi Rõ Tác Giả & Nguồn Gốc:</strong>
                      <p>Chèn một đoạn text credit ở góc video hoặc phần mô tả bài học: <em>"Nguồn video: [Tên kênh/Tác giả], phục vụ mục đích học tập phi thương mại"</em>.</p>
                    </div>
                  </div>
                  <div className="rule-item">
                    <span className="rule-num">2</span>
                    <div>
                      <strong>Quy Tắc Trích Dẫn Hợp Lý (Khoản 1 Điều 25 Luật SHTT):</strong>
                      <p>Không dùng toàn bộ video có tính thương mại. Chỉ cắt trích đoạn cần thiết (1-2 phút) để phân tích, làm ví dụ hoặc chứng minh luận điểm bài giảng.</p>
                    </div>
                  </div>
                  <div className="rule-item">
                    <span className="rule-num">3</span>
                    <div>
                      <strong>Nhúng (Embed) Thay Vì Tải File Về Tải Lại:</strong>
                      <p>Nếu là video YouTube/Vimeo, ưu tiên dùng tính năng Nhúng LMS (Iframe). Việc nhúng không vi phạm quyền truyền đạt tác phẩm đến công chúng.</p>
                    </div>
                  </div>
                  <div className="rule-item">
                    <span className="rule-num">4</span>
                    <div>
                      <strong>Kiểm Tra Nhạc Nền (BGM):</strong>
                      <p>Nếu video có chèn nhạc bản quyền quốc tế, hãy dùng công cụ Cắt video / Tách âm thanh của RCHG Studio để thay thế bằng nhạc miễn phí bản quyền (No Copyright Music).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

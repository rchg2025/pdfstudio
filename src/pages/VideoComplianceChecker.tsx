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
  FileText
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
}

export default function VideoComplianceChecker() {
  const { showToast } = useNotification();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [technicalReport, setTechnicalReport] = useState<TechnicalReport | null>(null);

  // Thông tin nguồn gốc video nhập tay
  const [originSource, setOriginSource] = useState<string>('internet'); // internet, social_media, shared_file, tv_broadcast
  const [authorName, setAuthorName] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('teaching'); // teaching, press, research, commercial, internal
  const [hasLicenseAgreement, setHasLicenseAgreement] = useState<string>('no'); // yes, no, creative_commons, public_domain

  // Checklist Pháp Lý & Bản Quyền theo Luật Việt Nam mới nhất
  const [checklist, setChecklist] = useState<ComplianceAuditItem[]>([
    {
      id: 'cr_1',
      category: 'copyright',
      categoryLabel: 'Luật Sở Hữu Trí Tuệ',
      title: 'Xác định quyền tác giả & quyền liên quan',
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
      title: 'Bản quyền âm thanh, nhạc nền (BGM)',
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
      categoryLabel: 'Luật Báo Chí & Quản Lý Nội Dung',
      title: 'Quy định về thông tin cấm truyền tải',
      lawBasis: 'Điều 9 Luật Báo chí 2016 & Nghị định 72/2013/NĐ-CP',
      question: 'Nội dung video có chứa thông tin sai sự thật, xúc phạm uy tín tổ chức, danh dự nhân phẩm cá nhân, hoặc bí mật đời tư không?',
      explanation: 'Điều 9 Luật Báo chí và Luật An ninh mạng nghiêm cấm việc đăng tải, lan truyền thông tin sai lệch, xuyên tạc lịch sử, kích động bạo lực hoặc thông tin chưa được kiểm chứng.',
      riskLevel: 'high',
      checked: null,
      note: ''
    },
    {
      id: 'press_2',
      category: 'press_law',
      categoryLabel: 'Luật Báo Chí & Trẻ Em',
      title: 'Bảo vệ quyền hình ảnh trẻ em & nhân vật',
      lawBasis: 'Điều 32 Bộ luật Dân sự 2015 & Luật Trẻ em 2016',
      question: 'Nếu video có hình ảnh trẻ em hoặc cá nhân khác, bạn đã có sự đồng ý của họ hoặc người đại diện theo pháp luật chưa?',
      explanation: 'Nghiêm cấm công bố hình ảnh, đời tư của trẻ em nếu không được sự đồng ý của cha, mẹ hoặc người giám hộ. Sử dụng hình ảnh của cá nhân phải được người đó đồng ý.',
      riskLevel: 'medium',
      checked: null,
      note: ''
    },
    {
      id: 'press_3',
      category: 'press_law',
      categoryLabel: 'Luật Báo Chí & Bản Quyền',
      title: 'Logo đài truyền hình, Watermark & Thương hiệu',
      lawBasis: 'Khoản 2 Điều 35 Luật SHTT & Luật Quảng cáo',
      question: 'Video có còn dính logo kênh truyền hình (VTV, HTV...), watermark sàn thương mại hoặc tên đơn vị khác không?',
      explanation: 'Để nguyên logo của cơ quan báo chí khác khi sử dụng lại trong sản phẩm của mình mà không trích dẫn nguồn có thể gây hiểu nhầm về nguồn gốc nội dung hoặc vi phạm quy định tiếp sóng/trích dẫn báo chí.',
      riskLevel: 'low',
      checked: null,
      note: ''
    },
    {
      id: 'cyber_1',
      category: 'cyber_safety',
      categoryLabel: 'Luật An Ninh Mạng',
      title: 'Xác thực nguồn tin & Tránh tin giả (Fake News / Deepfake)',
      lawBasis: 'Điều 8 & 16 Luật An ninh mạng 2018',
      question: 'Video có nguồn gốc từ cơ quan chính thống, cổng giáo dục uy tín hay tài khoản mạng xã hội không xác định danh tính?',
      explanation: 'Tránh sử dụng các video cắt ghép giật gân, video AI Deepfake mạo danh hoặc thông tin giả mạo chưa được kiểm chứng từ các tài khoản ẩn danh trên TikTok, Facebook.',
      riskLevel: 'high',
      checked: null,
      note: ''
    }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  // Xử lý khi chọn file video
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
    setAuthorName('');
    setSourceUrl('');

    // Phân tích kỹ thuật video qua đối tượng Video HTML5
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    video.onloadedmetadata = () => {
      const dur = video.duration || 0;
      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;

      // Độ phân giải
      let resLabel = 'SD';
      if (w >= 3840 || h >= 2160) resLabel = '4K Ultra HD';
      else if (w >= 1920 || h >= 1080) resLabel = 'Full HD 1080p';
      else if (w >= 1280 || h >= 720) resLabel = 'HD 720p';

      // Tỷ lệ khung hình
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(w, h);
      const ratio = `${w / divisor}:${h / divisor}`;

      // Ước tính bitrate (kbps)
      const bitrate = dur > 0 ? Math.round((file.size * 8) / dur / 1000) : 0;

      // Đánh giá điểm kỹ thuật & khuyến nghị
      let score = 100;
      const recs: string[] = [];

      if (h < 720) {
        score -= 20;
        recs.push('Độ phân giải dưới HD 720p có thể bị mờ vỡ khi trình chiếu lên máy chiếu lớp học hoặc màn hình lớn.');
      } else {
        recs.push('Độ phân giải đạt chuẩn sắc nét (' + resLabel + ').');
      }

      if (file.size > 500 * 1024 * 1024) {
        score -= 15;
        recs.push('Dung lượng tệp lớn (>500MB), nên nén video bằng bộ nén trước khi đưa vào hệ thống LMS để tránh giật lag đường truyền sinh viên.');
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

      showToast('Đã trích xuất xong các thông số kỹ thuật của video!', 'success');
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

  // Xuất Phiếu Thẩm Định Bản Quyền & Kỹ Thuật (PDF / Báo cáo in ấn)
  const handleExportAuditCertificate = () => {
    const dateStr = new Date().toLocaleDateString('vi-VN');
    const timeStr = new Date().toLocaleTimeString('vi-VN');

    let content = `BIÊN BẢN RÀ SOÁT NỘI DUNG, KỸ THUẬT & BẢN QUYỀN VIDEO\n`;
    content += `(Áp dụng theo Luật Sở Hữu Trí Tuệ 2022 & Luật Báo Chí 2016)\n`;
    content += `Ngày lập: ${dateStr} ${timeStr}\n`;
    content += `---------------------------------------------------------\n\n`;

    content += `1. THÔNG TIN VIDEO & NGUỒN GỐC:\n`;
    content += `- Tên tệp video: ${videoFile?.name || 'Chưa cung cấp'}\n`;
    content += `- Nguồn khai thác: ${originSource}\n`;
    content += `- Tác giả / Đơn vị sở hữu gốc: ${authorName || 'Chưa xác định'}\n`;
    content += `- Đường dẫn nguồn (URL): ${sourceUrl || 'Không có'}\n`;
    content += `- Mục đích sử dụng: ${purpose === 'teaching' ? 'Giảng dạy / Nghiên cứu học tập (Fair Use)' : purpose}\n`;
    content += `- Thỏa thuận cấp phép: ${hasLicenseAgreement}\n\n`;

    if (technicalReport) {
      content += `2. BÁO CÁO THÔNG SỐ KỸ THUẬT:\n`;
      content += `- Thời lượng: ${formatSeconds(technicalReport.duration)}\n`;
      content += `- Độ phân giải: ${technicalReport.width}x${technicalReport.height} (${technicalReport.resolutionLabel})\n`;
      content += `- Tỷ lệ khung hình: ${technicalReport.aspectRatio}\n`;
      content += `- Dung lượng tệp: ${formatBytes(technicalReport.fileSize)}\n`;
      content += `- Bitrate ước tính: ${technicalReport.bitrateEstimateKbps} kbps\n`;
      content += `- Điểm chuẩn kỹ thuật: ${technicalReport.technicalScore}/100\n\n`;
    }

    content += `3. KẾT QUẢ RÀ SOÁT PHÁP LÝ (LUẬT SHTT & BÁO CHÍ):\n`;
    content += `- Kết luận tổng thể: ${summary.riskTitle}\n`;
    content += `- Số tiêu chuẩn ĐẠT: ${summary.passedCount}/${checklist.length}\n`;
    content += `- Số tiêu chuẩn VI PHẠM/CHƯA ĐẠT: ${summary.failedCount}/${checklist.length}\n\n`;

    content += `CHI TIẾT TỪNG TIÊU CHÍ:\n`;
    checklist.forEach((item, idx) => {
      const st = item.checked === true ? '[ĐẠT]' : item.checked === false ? '[CẢNH BÁO/CHƯA ĐẠT]' : '[CHƯA KIỂM TRA]';
      content += `${idx + 1}. ${st} ${item.title}\n`;
      content += `   + Căn cứ: ${item.lawBasis}\n`;
      content += `   + Câu hỏi: ${item.question}\n`;
      if (item.note) content += `   + Ghi chú giải trình: ${item.note}\n`;
    });

    content += `\n---------------------------------------------------------\n`;
    content += `Được tạo bởi: Tiện Ích ITE - Hệ thống Hỗ Trợ Đào Tạo & Pháp Lý Số\n`;
    content += `Website: https://tienich.ite.id.vn\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bien-Ban-Kiem-Tra-Ban-Quyen-Video-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất biên bản thẩm định pháp lý thành công!', 'success');
  };

  const handleReset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setTechnicalReport(null);
    setChecklist(prev => prev.map(item => ({ ...item, checked: null, note: '' })));
  };

  return (
    <div className="vcc-page animate-fade-in">
      {/* Header */}
      <header className="vcc-header">
        <div className="vcc-title-group">
          <div className="vcc-icon">
            <Scale size={28} />
          </div>
          <div>
            <h1 className="vcc-title">Thẩm Định Bản Quyền, Nội Dung & Kỹ Thuật Video Không Tự Xây Dựng</h1>
            <p className="vcc-subtitle">
              Công cụ rà soát tính hợp pháp của video sưu tầm, tải từ mạng xã hội hoặc chia sẻ dùng trong giảng dạy & báo chí theo <strong>Luật Sở Hữu Trí Tuệ 2022</strong> và <strong>Luật Báo Chí Việt Nam</strong>.
            </p>
          </div>
        </div>

        {videoFile && (
          <div className="vcc-header-actions">
            <button className="vcc-btn vcc-btn-outline" onClick={handleReset}>
              <RotateCcw size={16} />
              <span>Kiểm Tra Video Khác</span>
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

      {/* KHỐI 1: TẢI VIDEO LÊN */}
      {!videoFile ? (
        <div className="vcc-upload-box" onClick={() => fileInputRef.current?.click()}>
          <div className="vcc-upload-inner">
            <div className="upload-pulse-icon">
              <Upload size={54} />
            </div>
            <h2>Tải Lên Video Cần Kiểm Tra Bản Quyền & Kỹ Thuật</h2>
            <p className="upload-desc">
              Hỗ trợ tệp MP4, WebM, MOV, AVI, MKV. Quá trình phân tích thông số diễn ra 100% trên trình duyệt của bạn, hoàn toàn bảo mật.
            </p>
            <button className="vcc-btn vcc-btn-primary">
              <Film size={16} />
              <span>Chọn Tệp Video Từ Máy Tính</span>
            </button>
            <div className="security-notice">
              <ShieldCheck size={16} className="text-success" />
              <span>Phân tích cục bộ an toàn, không sao chép hay lưu trữ video lên máy chủ công cộng.</span>
            </div>
          </div>
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
                  Đã kiểm tra: <strong>{summary.passedCount + summary.failedCount} / {checklist.length}</strong> tiêu chuẩn | Đạt: <strong>{summary.passedCount}</strong> | Cảnh báo/Vi phạm: <strong>{summary.failedCount}</strong>
                </p>
              </div>
            </div>
            <div className="verdict-right">
              <button className="vcc-btn vcc-btn-sm vcc-btn-white" onClick={handleExportAuditCertificate}>
                <FileText size={14} />
                <span>Xuất Biên Bản Thẩm Định</span>
              </button>
            </div>
          </div>

          <div className="vcc-grid">
            {/* CỘT TRÁI: XEM TRƯỚC VIDEO & THÔNG SỐ KỸ THUẬT */}
            <div className="vcc-left-col">
              {/* Trình chiếu video */}
              <div className="video-preview-card">
                <video 
                  ref={hiddenVideoRef}
                  src={videoUrl || undefined} 
                  controls 
                  className="main-preview-video"
                />
                <div className="video-quick-meta">
                  <span className="file-name-tag">{videoFile.name}</span>
                  <span className="file-size-tag">{formatBytes(videoFile.size)}</span>
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
                    <div className="spec-row">
                      <span className="spec-lbl">Bitrate ước tính:</span>
                      <span className="spec-val">{technicalReport.bitrateEstimateKbps} kbps</span>
                    </div>
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
                  <label>Tác giả / Cơ quan sở hữu tác phẩm gốc:</label>
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
                  <input 
                    type="text" 
                    className="vcc-input"
                    placeholder="https://youtube.com/watch?v=..."
                    value={sourceUrl}
                    onChange={e => setSourceUrl(e.target.value)}
                  />
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
                      <p>Nhấp chọn <strong>ĐẠT</strong> hoặc <strong>CHƯA ĐẠT</strong> cho từng điều khoản:</p>
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

import { useState } from 'react';
import { 
  Calculator, 
  Download, 
  Code, 
  Copy, 
  Check, 
  Sparkles, 
  Tag, 
  FileSpreadsheet
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './FormulaCalculator.css';

interface CalcTemplate {
  id: string;
  category: string;
  name: string;
  title: string;
  desc: string;
  fields: {
    id: string;
    label: string;
    unit: string;
    defaultVal: number;
    step?: number;
    desc: string;
  }[];
  calculate: (vals: Record<string, number>) => {
    mainResult: { label: string; value: string | number; unit: string };
    steps: { title: string; formula: string; result: string }[];
    evaluation: string;
  };
}

const TEMPLATES: CalcTemplate[] = [
  {
    id: 'med-dose',
    category: 'Y Dược - Điều Dưỡng',
    name: 'Tính liều dùng thuốc & Tốc độ truyền dịch (Dose & IV Flow Rate)',
    title: 'Tính Toán Dược Lâm Sàng & Tốc Độ Giọt Truyền',
    desc: 'Hỗ trợ điều dưỡng tính chuẩn xác tốc độ giọt/phút và liều lượng thuốc theo cân nặng của bệnh nhân.',
    fields: [
      { id: 'volume', label: 'Thể tích dịch truyền', unit: 'ml', defaultVal: 500, step: 50, desc: 'Dung tích chai dịch truyền (NaCl 0.9%, Ringer Lactate...)' },
      { id: 'hours', label: 'Thời gian truyền chỉ định', unit: 'giờ', defaultVal: 4, step: 0.5, desc: 'Bác sĩ chỉ định truyền hết trong bao nhiêu giờ' },
      { id: 'dropFactor', label: 'Hệ số giọt của dây truyền', unit: 'giọt/ml', defaultVal: 20, step: 1, desc: 'Dây truyền người lớn thông thường: 20 giọt/ml, dây nhi khoa: 60 giọt/ml' }
    ],
    calculate: (v) => {
      const totalMinutes = v.hours * 60;
      const rate = Math.round((v.volume * v.dropFactor) / totalMinutes);
      const mlPerHour = Math.round(v.volume / v.hours);

      return {
        mainResult: { label: 'Tốc độ nhỏ giọt chỉ định', value: rate, unit: 'giọt / phút' },
        steps: [
          { title: 'Bước 1: Quy đổi thời gian ra phút', formula: `${v.hours} giờ × 60 phút`, result: `${totalMinutes} phút` },
          { title: 'Bước 2: Tính tổng số giọt trong chai dịch', formula: `${v.volume} ml × ${v.dropFactor} giọt/ml`, result: `${v.volume * v.dropFactor} giọt` },
          { title: 'Bước 3: Tốc độ truyền trung bình', formula: `${v.volume * v.dropFactor} giọt ÷ ${totalMinutes} phút`, result: `${rate} giọt/phút (tương đương ${mlPerHour} ml/h)` }
        ],
        evaluation: rate > 60 
          ? '⚠️ Lưu ý lâm sàng: Tốc độ truyền nhanh (>60 giọt/phút), cần theo dõi sát áp lực tĩnh mạch trung tâm và nguy cơ quá tải tuần hoàn.' 
          : '✅ Tốc độ truyền nằm trong khoảng an toàn cho bệnh nhân thông thường.'
      };
    }
  },
  {
    id: 'acc-vat-depreciation',
    category: 'Kế Toán Doanh Nghiệp',
    name: 'Tính Khấu hao TSCĐ (Đường thẳng) & Bóc tách Thuế GTGT',
    title: 'Bảng Tính Khấu Hao Tài Sản Cố Định & Thuế',
    desc: 'Hỗ trợ sinh viên kế toán tính mức trích khấu hao hàng tháng và tách thuế GTGT (VAT) tự động.',
    fields: [
      { id: 'originalCost', label: 'Nguyên giá tài sản cố định', unit: 'VNĐ', defaultVal: 120000000, step: 1000000, desc: 'Giá mua chưa thuế + chi phí lắp đặt, chạy thử' },
      { id: 'years', label: 'Thời gian trích khấu hao', unit: 'năm', defaultVal: 5, step: 1, desc: 'Theo khung quy định của Thông tư 45/2013/TT-BTC' },
      { id: 'vatRate', label: 'Thuế suất GTGT đầu vào', unit: '%', defaultVal: 10, step: 1, desc: 'Mức thuế suất 8% hoặc 10%' }
    ],
    calculate: (v) => {
      const annualDep = v.originalCost / v.years;
      const monthlyDep = Math.round(annualDep / 12);
      const vatAmount = Math.round((v.originalCost * v.vatRate) / 100);
      const totalPayment = v.originalCost + vatAmount;

      return {
        mainResult: { label: 'Mức trích khấu hao hàng tháng', value: monthlyDep.toLocaleString('vi-VN'), unit: 'VNĐ / tháng' },
        steps: [
          { title: 'Bước 1: Tính thuế GTGT được khấu trừ', formula: `${v.originalCost.toLocaleString('vi-VN')} × ${v.vatRate}%`, result: `${vatAmount.toLocaleString('vi-VN')} VNĐ (Nợ TK 133)` },
          { title: 'Bước 2: Tổng giá thanh toán bao gồm VAT', formula: `${v.originalCost.toLocaleString('vi-VN')} + ${vatAmount.toLocaleString('vi-VN')}`, result: `${totalPayment.toLocaleString('vi-VN')} VNĐ (Có TK 112/331)` },
          { title: 'Bước 3: Khấu hao năm', formula: `${v.originalCost.toLocaleString('vi-VN')} ÷ ${v.years} năm`, result: `${annualDep.toLocaleString('vi-VN')} VNĐ / năm` },
          { title: 'Bước 4: Khấu hao tháng đưa vào chi phí', formula: `${annualDep.toLocaleString('vi-VN')} ÷ 12 tháng`, result: `${monthlyDep.toLocaleString('vi-VN')} VNĐ / tháng (Nợ TK 627/641/642, Có TK 214)` }
        ],
        evaluation: '📌 Ghi nhận kế toán: Định kỳ hàng tháng lập Bảng phân bổ khấu hao TSCĐ để hạch toán vào chi phí sản xuất kinh doanh theo quy định.'
      };
    }
  },
  {
    id: 'mech-cutting-speed',
    category: 'Cơ Khí Chế Tạo',
    name: 'Tính Tốc độ quay trục chính (n) & Vận tốc cắt gọt (V) máy tiện',
    title: 'Tính Chế Độ Cắt Gọt Gia Công Cơ Khí',
    desc: 'Xác định số vòng quay trục chính n (vòng/phút) khi tiện ngoài chi tiết phôi tròn.',
    fields: [
      { id: 'cuttingSpeed', label: 'Vận tốc cắt định mức (V)', unit: 'm/phút', defaultVal: 120, step: 5, desc: 'Tra bảng theo vật liệu dao (Hợp kim cứng/Thép gió) và phôi (Thép C45, Nhôm...)' },
      { id: 'diameter', label: 'Đường kính phôi tiện (D)', unit: 'mm', defaultVal: 40, step: 2, desc: 'Đường kính ngoài của chi tiết trước khi gia công' }
    ],
    calculate: (v) => {
      // n = (1000 * V) / (pi * D)
      const n = Math.round((1000 * v.cuttingSpeed) / (Math.PI * v.diameter));

      return {
        mainResult: { label: 'Tốc độ quay trục chính (n)', value: n, unit: 'vòng / phút (RPM)' },
        steps: [
          { title: 'Công thức tiêu chuẩn', formula: `n = (1000 × V) ÷ (π × D)`, result: `n = (1000 × ${v.cuttingSpeed}) ÷ (3.1416 × ${v.diameter})` },
          { title: 'Kết quả tính toán', formula: `Số vòng quay lý thuyết`, result: `${n} vòng/phút` }
        ],
        evaluation: `💡 Hướng dẫn xưởng: Khi gạt cần số trên máy tiện cơ, hãy chọn cấp tốc độ gần nhất với ${n} RPM (thường ưu tiên chọn cấp thấp hơn gần nhất để bảo vệ tuổi thọ dao).`
      };
    }
  }
];

export default function FormulaCalculator() {
  const { showToast } = useNotification();

  const [selectedId, setSelectedId] = useState<string>('med-dose');
  const activeTemplate = TEMPLATES.find(t => t.id === selectedId) || TEMPLATES[0];

  const [inputVals, setInputVals] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    activeTemplate.fields.forEach(f => {
      init[f.id] = f.defaultVal;
    });
    return init;
  });

  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectTemplate = (id: string) => {
    const t = TEMPLATES.find(item => item.id === id);
    if (!t) return;
    setSelectedId(id);
    const newVals: Record<string, number> = {};
    t.fields.forEach(f => {
      newVals[f.id] = f.defaultVal;
    });
    setInputVals(newVals);
    showToast(`Đã nạp công cụ: ${t.name}`, 'info');
  };

  const handleChangeVal = (fieldId: string, val: number) => {
    setInputVals(prev => ({
      ...prev,
      [fieldId]: val
    }));
  };

  const calcResult = activeTemplate.calculate(inputVals);

  // Xuất file HTML độc lập cho LMS
  const generateStandaloneHtml = () => {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${activeTemplate.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; padding: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .calc-card { width: 100%; max-width: 760px; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 20px 45px rgba(0,0,0,0.6); }
    .header { padding: 18px 24px; background: #182234; border-bottom: 1px solid #334155; }
    .title { font-size: 20px; font-weight: 700; color: #38bdf8; margin-bottom: 6px; }
    .desc { font-size: 13.5px; color: #94a3b8; line-height: 1.5; }
    .body { padding: 20px; }
    .inputs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px; }
    .input-box { background: #0f172a; border: 1px solid #334155; padding: 12px; border-radius: 10px; }
    .label { font-size: 13px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px; display: block; }
    .field-wrap { display: flex; align-items: center; gap: 8px; }
    .field-wrap input { width: 100%; background: #1e293b; border: 1px solid #475569; padding: 8px 12px; border-radius: 6px; color: #fff; font-size: 15px; font-weight: 700; outline: none; }
    .unit { font-size: 13px; color: #38bdf8; font-weight: 600; }
    .result-banner { background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(99, 102, 241, 0.15)); border: 1px solid #0284c7; border-radius: 12px; padding: 16px 20px; text-align: center; margin-bottom: 20px; }
    .res-label { font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .res-val { font-size: 28px; font-weight: 900; color: #38bdf8; }
    .steps-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .steps-title { font-size: 14px; font-weight: 700; color: #e2e8f0; margin-bottom: 10px; }
    .step-line { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #334155; font-size: 13.5px; }
    .step-line:last-child { border-bottom: none; }
    .eval-box { font-size: 13px; color: #cbd5e1; background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8; padding: 10px 14px; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="calc-card">
    <div class="header">
      <div class="title">${activeTemplate.title}</div>
      <div class="desc">${activeTemplate.desc}</div>
    </div>
    <div class="body">
      <div class="result-banner">
        <div class="res-label">${calcResult.mainResult.label}</div>
        <div class="res-val">${calcResult.mainResult.value} <span style="font-size:16px;font-weight:600;">${calcResult.mainResult.unit}</span></div>
      </div>
      <div class="steps-box">
        <div class="steps-title">📐 Các bước tính toán diễn giải:</div>
        ${calcResult.steps.map(s => `
          <div class="step-line">
            <span style="color:#94a3b8;">${s.title}:</span>
            <span style="color:#f8fafc;font-weight:600;">${s.formula} = <strong style="color:#38bdf8;">${s.result}</strong></span>
          </div>
        `).join('')}
      </div>
      <div class="eval-box">${calcResult.evaluation}</div>
    </div>
  </div>
</body>
</html>`;
  };

  const handleExportHtml = () => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bang-tinh-chuyen-nganh-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file HTML Bảng Tính Chuyên Ngành!', 'success');
  };

  const generateIframeCode = () => {
    const html = generateStandaloneHtml();
    const utf8Bytes = new TextEncoder().encode(html);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 = btoa(binary);

    return `<!-- MA NHUNG BANG TINH CHUYEN NGANH CHO LMS (CHUAN 16:9) -->
<div style="position:relative;width:100%;height:auto;aspect-ratio:16/9;padding-top:0;margin:15px auto;background:#0f172a;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.35);">
  <iframe 
    src="data:text/html;charset=utf-8;base64,${b64}" 
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;margin:0;padding:0;" 
    width="100%"
    height="100%"
    allow="fullscreen" 
    allowfullscreen="allowfullscreen">
  </iframe>
</div>
<!-- KET THUC MA NHUNG -->`;
  };

  const handleCopyIframe = async () => {
    try {
      await navigator.clipboard.writeText(generateIframeCode());
      setCopied(true);
      showToast('Đã sao chép mã nhúng Iframe!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Vui lòng copy thủ công', 'warning');
    }
  };

  return (
    <div className="calc-page animate-fade-in">
      {/* Header */}
      <header className="calc-header">
        <div className="calc-title-group">
          <div className="calc-icon">
            <Calculator size={26} />
          </div>
          <div>
            <h1 className="calc-title">Bảng Tính & Tra Cứu Tương Tác (Interactive Formula Guide)</h1>
            <p className="calc-subtitle">
              Công cụ tính nhanh liều lượng thuốc, khấu hao kế toán, chế độ cắt gọt cơ khí tự động diễn giải từng bước trên LMS.
            </p>
          </div>
        </div>

        <div className="calc-actions">
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
            onClick={() => setShowExportModal(true)}
          >
            <Code size={15} /> Lấy Mã Nhúng Iframe
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={handleExportHtml}
            style={{ background: '#10b981', border: 'none' }}
          >
            <Download size={15} /> Tải Tệp HTML
          </button>
        </div>
      </header>

      {/* Preset Chips */}
      <div className="calc-presets-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <Sparkles size={16} color="var(--primary)" /> Bảng tính chuyên ngành có sẵn:
        </div>
        <div className="calc-presets-chips">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              type="button"
              className={`calc-preset-chip ${selectedId === t.id ? 'active' : ''}`}
              onClick={() => handleSelectTemplate(t.id)}
            >
              <Tag size={12} />
              <span>[{t.category}]</span> {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Calculation Stage */}
      <div className="calc-main-card">
        <div className="calc-intro">
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{activeTemplate.title}</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{activeTemplate.desc}</p>
        </div>

        {/* Inputs */}
        <div className="calc-inputs-grid">
          {activeTemplate.fields.map(f => (
            <div key={f.id} className="calc-input-box">
              <label className="calc-input-label">{f.label}</label>
              <div className="calc-field-row">
                <input 
                  type="number" 
                  step={f.step || 1}
                  className="calc-num-input" 
                  value={inputVals[f.id] ?? f.defaultVal}
                  onChange={(e) => handleChangeVal(f.id, parseFloat(e.target.value) || 0)}
                />
                <span className="calc-unit-tag">{f.unit}</span>
              </div>
              <span className="calc-field-desc">{f.desc}</span>
            </div>
          ))}
        </div>

        {/* Big Result Card */}
        <div className="calc-result-banner">
          <div className="calc-res-label">{calcResult.mainResult.label}</div>
          <div className="calc-res-value">
            {calcResult.mainResult.value} 
            <span style={{ fontSize: '1.1rem', fontWeight: 600, marginLeft: '0.5rem' }}>
              {calcResult.mainResult.unit}
            </span>
          </div>
        </div>

        {/* Detailed Calculation Steps */}
        <div className="calc-steps-box">
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileSpreadsheet size={16} color="var(--primary)" /> Diễn giải các bước tính toán chi tiết:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {calcResult.steps.map((st, idx) => (
              <div key={idx} className="calc-step-row">
                <span style={{ color: 'var(--text-secondary)' }}>{st.title}:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {st.formula} = <strong style={{ color: 'var(--primary)' }}>{st.result}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Professional Evaluation */}
        <div className="calc-eval-box">
          {calcResult.evaluation}
        </div>
      </div>

      {/* Modal Iframe */}
      {showExportModal && (
        <div className="modal-backdrop" onClick={() => setShowExportModal(false)}>
          <div className="stop-edit-modal animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={20} style={{ color: 'var(--primary)' }} />
                <h3>Mã Nhúng LMS Bảng Tính Chuyên Ngành</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowExportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Sao chép mã nhúng bên dưới để đưa bảng tính tương tác trực quan này vào Canvas, Moodle hoặc Google Sites!
              </p>
              <div className="export-result-box">
                <div className="export-result-header">
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Mã HTML Iframe độc lập Responsive 100%</span>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-xs"
                    onClick={handleCopyIframe}
                    style={{ background: copied ? '#10b981' : 'var(--primary)' }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
                <pre className="export-code-block">{generateIframeCode()}</pre>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowExportModal(false)}>Đóng</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleCopyIframe}>
                {copied ? 'Đã sao chép' : 'Sao chép mã nhúng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { 
  Building2, 
  UserCheck, 
  GraduationCap, 
  Award, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  type CriteriaItem, 
  DEFAULT_APPENDIX_2_COLLECTIVE, 
  DEFAULT_APPENDIX_3_LEADER, 
  DEFAULT_APPENDIX_4_NON_LEADER, 
  DEFAULT_APPENDIX_5_STUDENT, 
  exportAppendixTableDocx 
} from '../utils/partyScoreCriteriaCatalog';
import './PartyScoreEvaluator.css';

type AppendixType = 'app-2' | 'app-3' | 'app-4' | 'app-5';

export default function PartyScoreEvaluator() {
  const [activeTab, setActiveTab] = useState<AppendixType>('app-4');
  const [hoTen, setHoTen] = useState('');
  const [chiBo, setChiBo] = useState('Chi bộ 1');

  // Quản lý state chấm điểm cho từng phụ lục
  const [items2, setItems2] = useState<CriteriaItem[]>(DEFAULT_APPENDIX_2_COLLECTIVE);
  const [items3, setItems3] = useState<CriteriaItem[]>(DEFAULT_APPENDIX_3_LEADER);
  const [items4, setItems4] = useState<CriteriaItem[]>(DEFAULT_APPENDIX_4_NON_LEADER);
  const [items5, setItems5] = useState<CriteriaItem[]>(DEFAULT_APPENDIX_5_STUDENT);

  const currentConfig = useMemo(() => {
    switch (activeTab) {
      case 'app-2':
        return {
          title: 'PHỤ LỤC 2',
          sub: 'KHUNG TIÊU CHÍ, BIỂU ĐIỂM ĐÁNH GIÁ CHẤT LƯỢNG ĐỐI VỚI TẬP THỂ',
          desc: 'Áp dụng đánh giá chất lượng tập thể Chi bộ, Chi ủy, Ban Giám hiệu theo Hướng dẫn số 397-HD/ĐU ngày 20/11/2026',
          items: items2,
          setItems: setItems2,
          defaultItems: DEFAULT_APPENDIX_2_COLLECTIVE
        };
      case 'app-3':
        return {
          title: 'PHỤ LỤC 3',
          sub: 'KHUNG TIÊU CHÍ, BIỂU ĐIỂM ĐÁNH GIÁ ĐỐI VỚI CÁ NHÂN GIỮ CHỨC VỤ LÃNH ĐẠO, QUẢN LÝ',
          desc: 'Áp dụng cho Bí thư, Phó Bí thư, Chi ủy viên, Hiệu trưởng, Phó Hiệu trưởng, Trưởng/Phó Khoa, Trưởng/Phó Phòng',
          items: items3,
          setItems: setItems3,
          defaultItems: DEFAULT_APPENDIX_3_LEADER
        };
      case 'app-5':
        return {
          title: 'PHỤ LỤC 5',
          sub: 'KHUNG TIÊU CHÍ, BIỂU ĐIỂM ĐÁNH GIÁ ĐỐI VỚI ĐẢNG VIÊN HỌC SINH, SINH VIÊN',
          desc: 'Áp dụng cho Đảng viên là học sinh, sinh viên không làm việc trong hệ thống chính trị',
          items: items5,
          setItems: setItems5,
          defaultItems: DEFAULT_APPENDIX_5_STUDENT
        };
      case 'app-4':
      default:
        return {
          title: 'PHỤ LỤC 4',
          sub: 'KHUNG TIÊU CHÍ, BIỂU ĐIỂM ĐÁNH GIÁ ĐỐI VỚI CÁ NHÂN KHÔNG GIỮ CHỨC VỤ LÃNH ĐẠO, QUẢN LÝ',
          desc: 'Áp dụng cho giảng viên, giáo viên, chuyên viên, nhân viên không giữ chức vụ quản lý',
          items: items4,
          setItems: setItems4,
          defaultItems: DEFAULT_APPENDIX_4_NON_LEADER
        };
    }
  }, [activeTab, items2, items3, items4, items5]);

  // Tính tổng điểm
  const totalScore = useMemo(() => {
    return currentConfig.items
      .filter(i => !i.isHeader)
      .reduce((sum, i) => sum + (Number(i.selfScore) || 0), 0);
  }, [currentConfig.items]);

  // Xếp loại đề xuất dựa trên điểm số
  const suggestedRank = useMemo(() => {
    if (totalScore >= 90) return { rank: 'Hoàn thành xuất sắc nhiệm vụ', color: '#16a34a' };
    if (totalScore >= 70) return { rank: 'Hoàn thành tốt nhiệm vụ', color: '#0284c7' };
    if (totalScore >= 50) return { rank: 'Hoàn thành nhiệm vụ', color: '#d97706' };
    return { rank: 'Không hoàn thành nhiệm vụ', color: '#dc2626' };
  }, [totalScore]);

  // Cập nhật điểm cho từng mục
  const handleScoreChange = (id: string, val: number, max: number) => {
    const safeVal = Math.max(0, Math.min(val, max));
    currentConfig.setItems((prev: CriteriaItem[]) => 
      prev.map(item => item.id === id ? { ...item, selfScore: safeVal } : item)
    );
  };

  // Tự động cho điểm tối đa
  const handleSetMaxAll = () => {
    currentConfig.setItems((prev: CriteriaItem[]) => 
      prev.map(item => ({ ...item, selfScore: item.maxScore }))
    );
  };

  // Đặt lại mặc định
  const handleReset = () => {
    currentConfig.setItems(currentConfig.defaultItems);
  };

  // Xuất file Word (.doc)
  const handleExportDocx = () => {
    exportAppendixTableDocx(
      currentConfig.title,
      currentConfig.sub,
      hoTen,
      chiBo,
      currentConfig.items
    );
  };

  return (
    <div className="party-evaluator-container">
      {/* HEADER BANNER */}
      <div className="evaluator-hero">
        <div className="evaluator-badge">
          <Award size={16} />
          <span>Hướng dẫn số 397-HD/ĐU • Đảng ủy Trường CĐ Bách khoa Nam Sài Gòn</span>
        </div>
        <h1>Hệ Thống Chấm Điểm & Tự Đánh Giá Xếp Loại Đảng Viên 2026</h1>
        <p>
          Công cụ tính điểm trực tuyến tự động theo <strong>Phụ lục 2, 3, 4, 5</strong> ban hành kèm theo Hướng dẫn số 397-HD/ĐU ngày 20/11/2026. 
          Tự động cộng dồn điểm số KPI 100 điểm, gợi ý mức xếp loại và xuất file Word (.doc) nộp Chi bộ.
        </p>

        {/* TAB CHỌN PHỤ LỤC */}
        <div className="evaluator-tabs">
          <button 
            type="button" 
            className={`eval-tab-btn ${activeTab === 'app-4' ? 'active' : ''}`}
            onClick={() => setActiveTab('app-4')}
          >
            <UserCheck size={18} />
            <span>Phụ lục 4: Không giữ chức vụ</span>
          </button>

          <button 
            type="button" 
            className={`eval-tab-btn ${activeTab === 'app-3' ? 'active' : ''}`}
            onClick={() => setActiveTab('app-3')}
          >
            <Award size={18} />
            <span>Phụ lục 3: Cán bộ lãnh đạo</span>
          </button>

          <button 
            type="button" 
            className={`eval-tab-btn ${activeTab === 'app-2' ? 'active' : ''}`}
            onClick={() => setActiveTab('app-2')}
          >
            <Building2 size={18} />
            <span>Phụ lục 2: Đánh giá tập thể</span>
          </button>

          <button 
            type="button" 
            className={`eval-tab-btn ${activeTab === 'app-5' ? 'active' : ''}`}
            onClick={() => setActiveTab('app-5')}
          >
            <GraduationCap size={18} />
            <span>Phụ lục 5: Đảng viên HSSV</span>
          </button>
        </div>
      </div>

      {/* TOP STATS & THÔNG TIN ĐẢNG VIÊN */}
      <div className="evaluator-card info-card">
        <div className="info-grid">
          <div className="info-field">
            <label>Họ và tên Đảng viên / Tập thể:</label>
            <input 
              type="text" 
              value={hoTen}
              onChange={e => setHoTen(e.target.value)}
              placeholder="Ví dụ: NGUYỄN VĂN A hoặc Chi ủy Chi bộ 1"
              className="eval-input"
            />
          </div>

          <div className="info-field">
            <label>Chi bộ trực thuộc:</label>
            <input 
              type="text" 
              value={chiBo}
              onChange={e => setChiBo(e.target.value)}
              placeholder="Ví dụ: Chi bộ Khoa Công nghệ Thông tin"
              className="eval-input"
            />
          </div>

          <div className="score-summary-box">
            <div className="score-main">
              <span className="score-label">TỔNG ĐIỂM TỰ CHẤM:</span>
              <span className="score-number">{totalScore}<span className="score-max">/100</span></span>
            </div>
            <div className="rank-badge" style={{ backgroundColor: `${suggestedRank.color}15`, color: suggestedRank.color, border: `1px solid ${suggestedRank.color}35` }}>
              <CheckCircle2 size={16} />
              <span>{suggestedRank.rank}</span>
            </div>
          </div>
        </div>

        <div className="toolbar-actions">
          <button type="button" className="btn-eval secondary" onClick={handleSetMaxAll}>
            <Sparkles size={16} /> Chấm điểm tối đa (100đ)
          </button>
          <button type="button" className="btn-eval outline" onClick={handleReset}>
            <RotateCcw size={16} /> Đặt lại mẫu
          </button>
          <button type="button" className="btn-eval primary" onClick={handleExportDocx}>
            <Download size={16} /> Xuất Phiếu Chấm Điểm (.doc)
          </button>
        </div>
      </div>

      {/* BẢNG BIỂU ĐIỂM TIÊU CHÍ */}
      <div className="evaluator-card table-card">
        <div className="table-header-title">
          <div>
            <h3>{currentConfig.title}: {currentConfig.sub}</h3>
            <p className="text-secondary">{currentConfig.desc}</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="criteria-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>TT</th>
                <th>Nội Dung Tiêu Chí Đánh Giá</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Điểm Tối Đa</th>
                <th style={{ width: '150px', textAlign: 'center' }}>Điểm Tự Chấm</th>
              </tr>
            </thead>
            <tbody>
              {currentConfig.items.map((item) => {
                if (item.isHeader) {
                  return (
                    <tr key={item.id} className="header-row">
                      <td style={{ textAlign: 'center' }}>{item.stt}</td>
                      <td>{item.label}</td>
                      <td style={{ textAlign: 'center' }}>{item.maxScore}</td>
                      <td style={{ textAlign: 'center' }}>-</td>
                    </tr>
                  );
                }
                return (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.stt}</td>
                    <td className="criteria-text">{item.label}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#475569' }}>
                      {item.maxScore}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="score-input-wrapper">
                        <input 
                          type="number"
                          step={item.maxScore <= 2 ? '0.5' : '1'}
                          min={0}
                          max={item.maxScore}
                          value={item.selfScore}
                          onChange={e => handleScoreChange(item.id, Number(e.target.value), item.maxScore)}
                          className="score-input"
                        />
                        <span className="score-unit">/ {item.maxScore}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td colSpan={2} style={{ textAlign: 'right', paddingRight: '20px' }}>
                  TỔNG CỘNG ĐIỂM TỰ ĐÁNH GIÁ (TIÊU CHÍ CHUNG + KẾT QUẢ NHIỆM VỤ):
                </td>
                <td style={{ textAlign: 'center' }}>100</td>
                <td style={{ textAlign: 'center', fontSize: '1.25rem', color: '#b91c1c' }}>
                  {totalScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* LIÊN KẾT NHANH SANG CÁC BẢN KIỂM ĐIỂM TƯƠNG ỨNG */}
      <div className="related-links-grid">
        <Link to="/ban-kiem-diem-dang-vien-mau-02a" className="related-card">
          <div className="related-icon">⭐</div>
          <div>
            <h4>Bản Kiểm Điểm Mẫu 02A (Lãnh Đạo)</h4>
            <p>Dành cho cán bộ giữ chức vụ lãnh đạo, quản lý</p>
          </div>
          <ArrowRight size={18} className="related-arrow" />
        </Link>

        <Link to="/ban-kiem-diem-dang-vien-mau-02b" className="related-card">
          <div className="related-icon">📝</div>
          <div>
            <h4>Bản Kiểm Điểm Mẫu 02B (Không Giữ Chức Vụ)</h4>
            <p>Dành cho giảng viên, giáo viên, chuyên viên, nhân viên</p>
          </div>
          <ArrowRight size={18} className="related-arrow" />
        </Link>

        <Link to="/cong-tac-dang" className="related-card">
          <div className="related-icon">🏛️</div>
          <div>
            <h4>Trung Tâm Quản Lý Văn Bản & Công Tác Đảng</h4>
            <p>Tổng hợp các biểu mẫu, quy định, hướng dẫn của Đảng ủy</p>
          </div>
          <ArrowRight size={18} className="related-arrow" />
        </Link>
      </div>
    </div>
  );
}

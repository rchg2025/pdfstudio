import React, { useState } from 'react';
import {
  Sparkles,
  Presentation,
  Download,
  FileText,
  Palette,
  Layers,
  Lightbulb,
  Edit3,
  Trash2,
  Plus,
  RefreshCw
} from 'lucide-react';
import {
  type SlideDeckData,
  type SlideData,
  SLIDE_THEMES,
  exportToPowerPoint,
  exportLessonPlanDocx
} from '../utils/pptxExport';
import './AiLessonSlideStudio.css';

export default function AiLessonSlideStudio() {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Toán học');
  const [gradeLevel, setGradeLevel] = useState('Lớp 10');
  const [slideCount, setSlideCount] = useState<number>(8);
  const [themeId, setThemeId] = useState<string>('ocean_blue');
  const [teachingMethod, setTeachingMethod] = useState<string>('5e_model');
  const [outlineDetail, setOutlineDetail] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [exportingPptx, setExportingPptx] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckData, setDeckData] = useState<SlideDeckData | null>(null);

  // Chỉnh sửa slide đang chọn
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Vui lòng nhập tên bài học hoặc chủ đề cần soạn slide.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/qa-wall?action=generate-ai-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          subject,
          gradeLevel,
          slideCount,
          themeColor: themeId,
          teachingMethod,
          outlineDetail: outlineDetail.trim(),
          customApiKey: customApiKey.trim() || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi tạo slide.');
      }

      if (data.data) {
        setDeckData(data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Không thể kết nối đến máy chủ AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPptx = async () => {
    if (!deckData) return;
    setExportingPptx(true);
    try {
      await exportToPowerPoint(deckData, themeId);
    } catch (err: any) {
      alert('Lỗi xuất PowerPoint: ' + (err.message || 'Thử lại sau.'));
    } finally {
      setExportingPptx(false);
    }
  };

  const handleExportDocx = () => {
    if (!deckData) return;
    try {
      exportLessonPlanDocx(deckData);
    } catch (err: any) {
      alert('Lỗi xuất kế hoạch bài dạy: ' + (err.message || 'Thử lại sau.'));
    }
  };

  const handleUpdateSlide = (index: number, updated: Partial<SlideData>) => {
    if (!deckData) return;
    const newSlides = [...deckData.slides];
    newSlides[index] = { ...newSlides[index], ...updated };
    setDeckData({ ...deckData, slides: newSlides });
  };

  const handleDeleteSlide = (index: number) => {
    if (!deckData) return;
    if (deckData.slides.length <= 1) {
      alert('Bộ bài giảng cần ít nhất 1 trang slide.');
      return;
    }
    const newSlides = deckData.slides.filter((_, i) => i !== index);
    // Cập nhật lại số thứ tự
    const reindexed = newSlides.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    setDeckData({ ...deckData, slides: reindexed });
    setEditingIndex(null);
  };

  const handleAddSlide = () => {
    if (!deckData) return;
    const newSlide: SlideData = {
      slideNumber: deckData.slides.length + 1,
      layout: 'content',
      title: 'Tiêu Đề Slide Mới',
      subtitle: 'Phụ đề tóm tắt',
      bullets: ['Nội dung gạch đầu dòng 1', 'Nội dung gạch đầu dòng 2'],
      teacherNotes: 'Gợi ý giảng dạy cho slide này...'
    };
    setDeckData({ ...deckData, slides: [...deckData.slides, newSlide] });
    setEditingIndex(deckData.slides.length);
  };

  return (
    <div className="ai-slide-studio">
      <div className="studio-header">
        <div className="studio-badge">
          <Sparkles size={16} />
          <span>EdTech AI Copilot 2.0</span>
        </div>
        <h1 className="studio-title">AI Soạn Bài Giảng & Slide PPTX Tự Động</h1>
        <p className="studio-desc">
          Biến ý tưởng hoặc đề cương bài dạy thành bộ trình chiếu PowerPoint chuyên nghiệp chuẩn 16:9,
          kèm kế hoạch bài dạy (giáo án) Word theo chuẩn Công văn 5512 BGD&ĐT chỉ trong vài giây.
        </p>
      </div>

      <div className="studio-grid">
        {/* Cột trái: Form nhập liệu & Tùy biến */}
        <div className="studio-panel">
          <h2 className="panel-title">
            <Presentation size={20} className="text-blue-500" />
            <span>Thiết Lập Bài Giảng</span>
          </h2>

          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label">Tên bài học / Chủ đề (*)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Định luật II Newton, Quang hợp ở thực vật..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 form-group">
              <div>
                <label className="form-label">Môn học</label>
                <select
                  className="form-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Sinh học">Sinh học</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Lịch sử & Địa lý">Lịch sử & Địa lý</option>
                  <option value="Tin học & STEM">Tin học & STEM</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Giáo dục công dân">Giáo dục kinh tế & pháp luật</option>
                  <option value="Kỹ năng mềm">Kỹ năng mềm / Kỹ năng sống</option>
                </select>
              </div>

              <div>
                <label className="form-label">Khối lớp / Cấp độ</label>
                <select
                  className="form-select"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                >
                  <option value="Tiểu học (Lớp 1-5)">Tiểu học (Lớp 1-5)</option>
                  <option value="Lớp 6">Lớp 6</option>
                  <option value="Lớp 7">Lớp 7</option>
                  <option value="Lớp 8">Lớp 8</option>
                  <option value="Lớp 9">Lớp 9</option>
                  <option value="Lớp 10">Lớp 10</option>
                  <option value="Lớp 11">Lớp 11</option>
                  <option value="Lớp 12">Lớp 12</option>
                  <option value="Đại học / Cao đẳng">Đại học / Cao đẳng</option>
                  <option value="Khóa đào tạo nội bộ">Khóa đào tạo nội bộ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 form-group">
              <div>
                <label className="form-label">Số trang slide</label>
                <select
                  className="form-select"
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                >
                  <option value={6}>6 trang (Bài ngắn / 1 tiết)</option>
                  <option value={8}>8 trang (Tiêu chuẩn / 1 tiết)</option>
                  <option value={10}>10 trang (Đầy đủ / 2 tiết)</option>
                  <option value={12}>12 trang (Chuyên sâu / Chuyên đề)</option>
                  <option value={15}>15 trang (Toàn diện)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Mô hình sư phạm</label>
                <select
                  className="form-select"
                  value={teachingMethod}
                  onChange={(e) => setTeachingMethod(e.target.value)}
                >
                  <option value="5e_model">Mô hình 5E (Khám phá & Kiến tạo)</option>
                  <option value="active_learning">Dạy học tích cực & Tương tác</option>
                  <option value="project_based">Dạy học dự án & Thực tiễn</option>
                  <option value="standard">Tiêu chuẩn truyền thống (Lý thuyết - Bài tập)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Palette size={14} className="inline mr-1" />
                Chủ đề màu sắc slide
              </label>
              <div className="theme-options">
                {Object.values(SLIDE_THEMES).map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    className={`theme-btn ${themeId === th.id ? 'active' : ''}`}
                    onClick={() => setThemeId(th.id)}
                  >
                    <span
                      className="theme-color-dot"
                      style={{ backgroundColor: `#${th.primary}` }}
                    />
                    <span className="truncate">{th.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Đề cương bài học / Yêu cầu chi tiết (Tùy chọn)
              </label>
              <textarea
                className="form-textarea"
                placeholder="Dán các ý chính cần đưa vào, link tài liệu hoặc mục tiêu bài học đặc thù của bạn..."
                value={outlineDetail}
                onChange={(e) => setOutlineDetail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label text-xs text-gray-500">
                Gemini API Key riêng (Tùy chọn, để trống sẽ dùng Key hệ thống)
              </label>
              <input
                type="password"
                className="form-input text-xs"
                placeholder="AIzaSy..."
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="generate-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>AI Đang Thiết Kế Bài Giảng...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Tạo Slide & Giáo Án Bằng AI</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Cột phải: Xem trước bài giảng & Xuất file */}
        <div className="studio-preview-section">
          {deckData ? (
            <div>
              {/* Action Bar */}
              <div className="deck-action-bar">
                <div className="deck-meta">
                  <div className="deck-headline">{deckData.deckTitle}</div>
                  <div className="deck-subinfo">
                    <span>{deckData.subject}</span>
                    <span>•</span>
                    <span>{deckData.gradeLevel}</span>
                    <span>•</span>
                    <span>{deckData.slides.length} trang slide</span>
                  </div>
                </div>

                <div className="deck-buttons">
                  <button
                    type="button"
                    className="btn-export-pptx"
                    onClick={handleExportPptx}
                    disabled={exportingPptx}
                  >
                    {exportingPptx ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    <span>Tải PowerPoint (.pptx)</span>
                  </button>

                  <button
                    type="button"
                    className="btn-export-docx"
                    onClick={handleExportDocx}
                  >
                    <FileText size={16} />
                    <span>Tải Giáo Án (.doc 5512)</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600 transition-all"
                    onClick={handleAddSlide}
                  >
                    <Plus size={16} />
                    <span>Thêm Slide</span>
                  </button>
                </div>
              </div>

              {/* Danh sách các Slide Preview */}
              <div className="slide-deck-container">
                {deckData.slides.map((slide, idx) => {
                  const isEditing = editingIndex === idx;

                  return (
                    <div key={idx} className="slide-item-card">
                      <div className="slide-header-bar">
                        <div className="flex items-center gap-2">
                          <Layers size={16} className="text-blue-500" />
                          <span>
                            Slide {slide.slideNumber || idx + 1}: Layout {slide.layout.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-blue-600 rounded transition-colors"
                            title="Chỉnh sửa nội dung"
                            onClick={() => setEditingIndex(isEditing ? null : idx)}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-red-600 rounded transition-colors"
                            title="Xóa slide này"
                            onClick={() => handleDeleteSlide(idx)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Modal Chỉnh Sửa Trực Tiếp */}
                      {isEditing && (
                        <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-900/50">
                          <div className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-300">
                            Chỉnh sửa Slide {idx + 1}:
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400">Tiêu đề slide</label>
                              <input
                                type="text"
                                className="form-input text-sm py-1.5"
                                value={slide.title}
                                onChange={(e) => handleUpdateSlide(idx, { title: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400">Phụ đề</label>
                              <input
                                type="text"
                                className="form-input text-sm py-1.5"
                                value={slide.subtitle || ''}
                                onChange={(e) => handleUpdateSlide(idx, { subtitle: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="text-xs text-gray-600 dark:text-gray-400">
                              Các ý chính (Mỗi dòng là 1 gạch đầu dòng)
                            </label>
                            <textarea
                              className="form-textarea text-sm"
                              rows={3}
                              value={(slide.bullets || []).join('\n')}
                              onChange={(e) =>
                                handleUpdateSlide(idx, {
                                  bullets: e.target.value.split('\n').filter((l) => l.trim())
                                })
                              }
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 dark:text-gray-400">Ghi chú giáo viên (Teacher Notes)</label>
                            <input
                              type="text"
                              className="form-input text-sm py-1.5"
                              value={slide.teacherNotes || ''}
                              onChange={(e) => handleUpdateSlide(idx, { teacherNotes: e.target.value })}
                            />
                          </div>
                        </div>
                      )}

                      {/* Khung Canvas Giả Lập Slide 16:9 */}
                      <div className="slide-canvas">
                        <div>
                          <h3 className="slide-canvas-title">{slide.title}</h3>
                          {slide.subtitle && (
                            <div className="slide-canvas-subtitle">{slide.subtitle}</div>
                          )}
                        </div>

                        <div className="slide-canvas-body">
                          {slide.layout === 'two_column' ? (
                            <div className="slide-two-col">
                              <div className="slide-col-card">
                                <ul>
                                  {(slide.bullets || []).map((b, bIdx) => (
                                    <li key={bIdx}>
                                      <span className="slide-bullet-dot" />
                                      <span>{b}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="slide-col-card">
                                <ul>
                                  {(slide.secondaryContent || []).map((b, bIdx) => (
                                    <li key={bIdx}>
                                      <span className="slide-bullet-dot" style={{ backgroundColor: '#10b981' }} />
                                      <span>{b}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ) : slide.layout === 'quiz' && slide.quiz ? (
                            <div className="slide-quiz-box">
                              <div className="quiz-question">
                                ❓ {slide.quiz.question}
                              </div>
                              <div className="quiz-options-list">
                                {(slide.quiz.options || []).map((opt, oIdx) => (
                                  <div key={oIdx} className="quiz-option-item">
                                    {opt}
                                  </div>
                                ))}
                              </div>
                              {slide.quiz.answer && (
                                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  💡 Đáp án: {slide.quiz.answer} ({slide.quiz.explanation || 'Chính xác'})
                                </div>
                              )}
                            </div>
                          ) : (
                            <ul>
                              {(slide.bullets || []).map((bullet, bIdx) => (
                                <li key={bIdx}>
                                  <span className="slide-bullet-dot" />
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Gợi ý sư phạm cho giáo viên */}
                      {slide.teacherNotes && (
                        <div className="slide-teacher-notes">
                          <Lightbulb size={18} className="flex-shrink-0 mt-0.5" />
                          <div>
                            <strong>Gợi ý sư phạm cho thầy cô:</strong> {slide.teacherNotes}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="studio-empty">
              <Presentation className="empty-icon" />
              <h3 className="empty-title">Chưa có nội dung bài giảng</h3>
              <p className="empty-desc">
                Nhập tên bài học và bấm nút <strong>"Tạo Slide & Giáo Án Bằng AI"</strong> ở khung bên trái.
                AI sẽ tự động lập dàn ý sư phạm, thiết kế nội dung từng slide chuẩn 16:9 và lập giáo án cho bạn.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

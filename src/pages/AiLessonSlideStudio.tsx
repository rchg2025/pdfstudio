import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  FolderOpen,
  Upload,
  FileUp,
  ListTree,
  ChevronDown,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import {
  type SlideDeckData,
  type SlideData,
  SLIDE_THEMES,
  exportToPowerPoint,
  exportLessonPlanDocx
} from '../utils/pptxExport';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import './AiLessonSlideStudio.css';

// Cấu hình worker pdfjs
try {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }
} catch {}

interface TreeNode {
  id: string;
  title: string;
  children?: TreeNode[];
}

export default function AiLessonSlideStudio() {
  const { user } = useAuth();
  const { showToast } = useNotification();

  // Môn học & Đối tượng đào tạo
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Công nghệ thông tin');
  const [gradeLevel, setGradeLevel] = useState('Cao đẳng Năm 1 (Học kỳ 1)');
  const [moduleType, setModuleType] = useState('Tích hợp (Lý thuyết & Thực hành nghề)');
  const [slideCount, setSlideCount] = useState<number>(8);
  const [themeId, setThemeId] = useState<string>('ocean_blue');
  const [teachingMethod] = useState<string>('vocational_practical');
  const [outlineDetail, setOutlineDetail] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');

  // Nguồn giáo trình: 'saved_subject' | 'upload_file'
  const [sourceMode, setSourceMode] = useState<'saved_subject' | 'upload_file'>('saved_subject');
  const [savedSubjects, setSavedSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [isLoadingSavedSubjects, setIsLoadingSavedSubjects] = useState(false);

  // File upload & Raw text
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [rawSyllabusContent, setRawSyllabusContent] = useState('');

  // Cây đề mục của giáo trình
  const [syllabusTree, setSyllabusTree] = useState<TreeNode[]>([]);
  const [isExtractingTree, setIsExtractingTree] = useState(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(true);

  // Trạng thái AI sinh Slide
  const [loading, setLoading] = useState(false);
  const [exportingPptx, setExportingPptx] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckData, setDeckData] = useState<SlideDeckData | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Lấy toàn bộ ID node
  const getAllNodeIds = (nodes: TreeNode[]): string[] => {
    let ids: string[] = [];
    nodes.forEach((n) => {
      ids.push(n.id);
      if (n.children && n.children.length > 0) {
        ids = ids.concat(getAllNodeIds(n.children));
      }
    });
    return ids;
  };

  // Lấy tiêu đề các node đã chọn
  const getSelectedNodeTitles = (nodes: TreeNode[], selectedIds: Set<string>): string[] => {
    let titles: string[] = [];
    nodes.forEach((n) => {
      if (selectedIds.has(n.id)) {
        titles.push(n.title);
      }
      if (n.children && n.children.length > 0) {
        titles = titles.concat(getSelectedNodeTitles(n.children, selectedIds));
      }
    });
    return titles;
  };

  // 1. Tải danh sách môn học / giáo trình đã lưu từ kho khảo thí
  useEffect(() => {
    const fetchSavedSubjects = async () => {
      setIsLoadingSavedSubjects(true);
      try {
        const userId = user?.id || 'guest';
        const res = await fetch(`/api/quiz-api?action=get-syllabus-subjects&userId=${encodeURIComponent(userId)}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.subjects)) {
          setSavedSubjects(data.subjects);
          if (data.subjects.length > 0) {
            handleSelectSavedSubject(data.subjects[0]);
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh sách giáo trình đã lưu:', err);
      } finally {
        setIsLoadingSavedSubjects(false);
      }
    };

    fetchSavedSubjects();
  }, [user]);

  // Khi chọn một môn học đã lưu
  const handleSelectSavedSubject = (subjectItem: any) => {
    setSelectedSubjectId(subjectItem.id);
    if (subjectItem.name) {
      setSubject(subjectItem.name);
      setTopic(subjectItem.name);
    }
    if (subjectItem.rawContent) {
      setRawSyllabusContent(subjectItem.rawContent);
    }
    const tree = subjectItem.tree || [];
    setSyllabusTree(tree);
    const allIds = getAllNodeIds(tree);
    setSelectedNodeIds(new Set(allIds));
    setExpandedNodeIds(new Set(allIds));
    setSelectAll(true);
  };

  // 2. Trích xuất text từ file upload (.docx, .pdf, .txt)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsReadingFile(true);
    try {
      let extracted = '';
      const name = file.name.toLowerCase();
      if (name.endsWith('.docx') || name.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        extracted = res.value || '';
      } else if (name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let pdfText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageStr = textContent.items.map((item: any) => item.str).join(' ');
          pdfText += pageStr + '\n';
        }
        extracted = pdfText;
      } else {
        extracted = await file.text();
      }

      if (!extracted.trim()) {
        showToast('Tệp không có nội dung chữ hoặc bị mã hóa.', 'warning');
        setIsReadingFile(false);
        return;
      }

      setRawSyllabusContent(extracted);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
      setSubject(cleanTitle);
      setTopic(cleanTitle);
      showToast(`Đã đọc xong giáo trình "${file.name}"!`, 'success');

      // Tự động phân tích cây mục lục
      handleExtractTreeFromContent(extracted);
    } catch (err: any) {
      alert('Lỗi đọc file: ' + (err.message || 'Thử lại với tệp khác.'));
    } finally {
      setIsReadingFile(false);
      if (e.target) e.target.value = '';
    }
  };

  // 3. Phân tích Cây Mục Lục Giáo Trình bằng AI
  const handleExtractTreeFromContent = async (contentToExtract?: string) => {
    const content = contentToExtract || rawSyllabusContent.trim();
    if (!content) {
      alert('Vui lòng chọn hoặc tải lên tài liệu giáo trình!');
      return;
    }

    setIsExtractingTree(true);
    try {
      const res = await fetch('/api/quiz-api?action=extract-syllabus-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          customApiKey: customApiKey.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi bóc tách mục lục.');
      }

      const tree: TreeNode[] = data.tree || [];
      setSyllabusTree(tree);
      const allIds = getAllNodeIds(tree);
      setSelectedNodeIds(new Set(allIds));
      setExpandedNodeIds(new Set(allIds));
      setSelectAll(true);
      showToast(`Đã bóc tách thành công ${allIds.length} đề mục từ giáo trình!`, 'success');
    } catch (err: any) {
      alert(err.message || 'Không thể bóc tách đề mục từ giáo trình này.');
    } finally {
      setIsExtractingTree(false);
    }
  };

  // 4. Toggle tick chọn Node cây mục lục
  const handleToggleNode = (node: TreeNode) => {
    const newSelected = new Set(selectedNodeIds);
    const nodeIds = [node.id, ...getAllNodeIds(node.children || [])];
    const isCurrentlySelected = newSelected.has(node.id);

    if (isCurrentlySelected) {
      nodeIds.forEach((id) => newSelected.delete(id));
      setSelectAll(false);
    } else {
      nodeIds.forEach((id) => newSelected.add(id));
      const allIds = getAllNodeIds(syllabusTree);
      if (allIds.every((id) => newSelected.has(id))) {
        setSelectAll(true);
      }
    }
    setSelectedNodeIds(newSelected);
  };

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedNodeIds(new Set());
      setSelectAll(false);
    } else {
      const allIds = getAllNodeIds(syllabusTree);
      setSelectedNodeIds(new Set(allIds));
      setSelectAll(true);
    }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedNodeIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodeIds(next);
  };

  // Render đệ quy Tree Node
  const renderTreeNodes = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodeIds.has(node.id);
      const isSelected = selectedNodeIds.has(node.id);

      return (
        <div key={node.id} style={{ marginLeft: `${depth * 14}px` }} className="py-1">
          <div className="flex items-center gap-1.5 hover:bg-blue-50/60 dark:hover:bg-slate-700/50 p-1 rounded transition-colors">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="p-0.5 text-gray-500 hover:text-blue-600 focus:outline-none"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-4" />
            )}

            <input
              type="checkbox"
              id={`node-${node.id}`}
              checked={isSelected}
              onChange={() => handleToggleNode(node)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
            />

            <label
              htmlFor={`node-${node.id}`}
              className="text-xs font-medium text-gray-700 dark:text-gray-200 cursor-pointer select-none truncate"
            >
              {node.title}
            </label>
          </div>

          {hasChildren && isExpanded && (
            <div className="border-l border-gray-200 dark:border-slate-700 ml-2 pl-1">
              {renderTreeNodes(node.children!, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // 5. Gửi yêu cầu sinh Slide AI
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Vui lòng nhập tên môn học hoặc bài dạy cần soạn slide.');
      return;
    }

    const selectedTitles = getSelectedNodeTitles(syllabusTree, selectedNodeIds);

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
          moduleType,
          slideCount,
          themeColor: themeId,
          teachingMethod,
          outlineDetail: outlineDetail.trim(),
          selectedChapters: selectedTitles,
          rawSyllabusContent: rawSyllabusContent.substring(0, 5000),
          customApiKey: customApiKey.trim() || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi tạo slide bài giảng.');
      }

      if (data.data) {
        setDeckData(data.data);
        showToast('Đã soạn xong bộ Slide PowerPoint hệ Cao đẳng!', 'success');
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
      showToast('Đã tải xuống file PowerPoint thành công!', 'success');
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
      showToast('Đã tải xuống giáo án Word hệ Cao đẳng!', 'success');
    } catch (err: any) {
      alert('Lỗi xuất giáo án: ' + (err.message || 'Thử lại sau.'));
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
    const reindexed = newSlides.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    setDeckData({ ...deckData, slides: reindexed });
    setEditingIndex(null);
  };

  const handleAddSlide = () => {
    if (!deckData) return;
    const newSlide: SlideData = {
      slideNumber: deckData.slides.length + 1,
      layout: 'content',
      title: 'Tiêu Đề Slide Mới (Thao Tác Kỹ Thuật)',
      subtitle: 'Quy trình thực hành',
      bullets: ['Bước 1: Chuẩn bị thiết bị và vật tư', 'Bước 2: Tiến hành thao tác theo tiêu chuẩn', 'Bước 3: Kiểm tra thông số và bàn giao'],
      teacherNotes: 'Giảng viên thị phạm trực quan tại xưởng / phòng Lab...'
    };
    setDeckData({ ...deckData, slides: [...deckData.slides, newSlide] });
    setEditingIndex(deckData.slides.length);
  };

  return (
    <div className="ai-slide-studio">
      <div className="studio-header">
        <div className="studio-badge">
          <Sparkles size={16} />
          <span>Hệ Thống Đào Tạo Nghề & Cao Đẳng 2.0</span>
        </div>
        <h1 className="studio-title">AI Biên Soạn Slide Bài Giảng Từ Giáo Trình Cao Đẳng</h1>
        <p className="studio-desc">
          Bóc tách cây đề mục (Chương / Bài / Mục con) từ giáo trình môn học hoặc mô-đun nghề,
          tự động thiết kế bộ trình chiếu PowerPoint 16:9 gắn liền thực hành và xuất giáo án chuẩn bậc Cao đẳng.
        </p>
      </div>

      <div className="studio-grid">
        {/* CỘT TRÁI: FORM THIẾT LẬP & CHỌN ĐỀ MỤC GIÁO TRÌNH */}
        <div className="studio-panel">
          <h2 className="panel-title">
            <Presentation size={20} className="text-blue-500" />
            <span>Nguồn Giáo Trình & Cấu Hình</span>
          </h2>

          {/* Chọn nguồn Giáo trình */}
          <div className="mb-4">
            <label className="form-label font-semibold text-xs text-blue-600 uppercase tracking-wider mb-2 block">
              1. Chọn nguồn tài liệu giáo trình:
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                className={`source-tab-btn ${sourceMode === 'saved_subject' ? 'active' : ''}`}
                onClick={() => setSourceMode('saved_subject')}
              >
                <FolderOpen size={15} />
                <span>Giáo trình đã lưu ({savedSubjects.length})</span>
              </button>

              <button
                type="button"
                className={`source-tab-btn ${sourceMode === 'upload_file' ? 'active' : ''}`}
                onClick={() => setSourceMode('upload_file')}
              >
                <FileUp size={15} />
                <span>Tải tệp (.docx, .pdf)</span>
              </button>
            </div>

            {/* Chi tiết từng nguồn */}
            {sourceMode === 'saved_subject' && (
              <div className="source-box-card">
                {isLoadingSavedSubjects ? (
                  <div className="text-xs text-gray-500 flex items-center gap-1.5 py-1">
                    <RefreshCw size={13} className="animate-spin text-blue-600" /> Đang tải danh mục giáo trình...
                  </div>
                ) : savedSubjects.length > 0 ? (
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                      Chọn giáo trình môn học:
                    </label>
                    <select
                      className="form-select text-xs py-2 bg-white"
                      value={selectedSubjectId}
                      onChange={(e) => {
                        const found = savedSubjects.find((s) => s.id === e.target.value);
                        if (found) handleSelectSavedSubject(found);
                      }}
                    >
                      {savedSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.tree?.length || 0} chương/đề mục)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 leading-relaxed py-1">
                    Chưa có giáo trình lưu sẵn trong tài khoản. Hãy bấm tab <strong>"Tải tệp"</strong> ở trên để nạp giáo trình Word/PDF!
                  </div>
                )}
              </div>
            )}

            {sourceMode === 'upload_file' && (
              <div className="source-box-card">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".docx,.doc,.pdf,.txt"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isReadingFile}
                  className="upload-dropzone-btn"
                >
                  {isReadingFile ? (
                    <>
                      <RefreshCw size={15} className="animate-spin text-blue-600" /> Đang đọc tài liệu giáo trình...
                    </>
                  ) : (
                    <>
                      <Upload size={15} /> Tải tệp Giáo trình Word / PDF (.docx, .pdf)
                    </>
                  )}
                </button>
                {uploadedFileName && (
                  <div className="mt-2 text-xs text-emerald-600 font-semibold truncate flex items-center gap-1">
                    <span>✓ Đã nạp thành công:</span>
                    <span className="underline">{uploadedFileName}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CÂY ĐỀ MỤC GIÁO TRÌNH (CHO PHÉP CHỌN PHẠM VI SOẠN BÀI GIẢNG) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="form-label font-semibold text-xs text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <ListTree size={15} />
                <span>2. Chọn phạm vi đề mục soạn slide:</span>
              </label>

              {syllabusTree.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold px-2 py-0.5 rounded bg-blue-50"
                >
                  {selectAll ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                </button>
              )}
            </div>

            <div className="syllabus-tree-container">
              {isExtractingTree ? (
                <div className="py-5 text-center text-gray-600 flex flex-col items-center gap-2">
                  <RefreshCw size={20} className="animate-spin text-blue-600" />
                  <span className="font-medium text-xs">AI đang phân tích cấu trúc chương & đề mục giáo trình...</span>
                </div>
              ) : syllabusTree.length > 0 ? (
                <div>
                  <div className="text-[11px] font-semibold text-blue-800 mb-1.5 pb-1 border-b border-gray-200">
                    Đã chọn {selectedNodeIds.size} / {getAllNodeIds(syllabusTree).length} đề mục:
                  </div>
                  {renderTreeNodes(syllabusTree)}
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500 leading-relaxed">
                  Chưa có cây đề mục. Vui lòng nạp tệp giáo trình ở bước trên hoặc dán nội dung.
                  {rawSyllabusContent && (
                    <button
                      type="button"
                      onClick={() => handleExtractTreeFromContent()}
                      className="block mx-auto mt-2 text-blue-600 font-bold text-xs bg-white px-3 py-1.5 rounded-md border border-blue-200 shadow-sm hover:bg-blue-50"
                    >
                      ✨ Bóc tách đề mục ngay
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label">Tên bài giảng / Bài học trong Mô-đun (*)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Bài 3: Kỹ thuật Định tuyến và Cấu hình VLAN..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 form-group">
              <div>
                <label className="form-label">Môn học / Mô-đun</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Quản trị mạng Linux"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Bậc & Năm đào tạo</label>
                <select
                  className="form-select"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                >
                  <option value="Cao đẳng Năm 1 (Học kỳ 1)">Cao đẳng Năm 1 (Học kỳ 1)</option>
                  <option value="Cao đẳng Năm 1 (Học kỳ 2)">Cao đẳng Năm 1 (Học kỳ 2)</option>
                  <option value="Cao đẳng Năm 2 (Chuyên ngành)">Cao đẳng Năm 2 (Chuyên ngành)</option>
                  <option value="Cao đẳng Năm 3 (Thực tập & Đồ án)">Cao đẳng Năm 3 (Thực tập & Đồ án)</option>
                  <option value="Hệ Trung cấp nghề">Hệ Trung cấp nghề</option>
                  <option value="Liên thông Đại học">Liên thông Đại học</option>
                  <option value="Khóa đào tạo ngắn hạn / Chứng chỉ nghề">Khóa đào tạo ngắn hạn / Chứng chỉ nghề</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 form-group">
              <div>
                <label className="form-label">Hình thức mô-đun</label>
                <select
                  className="form-select"
                  value={moduleType}
                  onChange={(e) => setModuleType(e.target.value)}
                >
                  <option value="Tích hợp (Lý thuyết kết hợp Thực hành nghề)">Tích hợp (Lý thuyết & Thực hành nghề)</option>
                  <option value="Thực hành chuyên sâu (Phòng Lab / Xưởng nghề)">Thực hành chuyên sâu (Phòng Lab / Xưởng)</option>
                  <option value="Lý thuyết chuyên ngành cơ sở">Lý thuyết chuyên ngành cơ sở</option>
                  <option value="Đồ án môn học / Dự án thực tế">Đồ án môn học / Dự án thực tế</option>
                </select>
              </div>

              <div>
                <label className="form-label">Số trang slide</label>
                <select
                  className="form-select"
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                >
                  <option value={6}>6 trang (Bài ngắn / 1 tiết)</option>
                  <option value={8}>8 trang (Tiêu chuẩn / 2 tiết)</option>
                  <option value={10}>10 trang (Đầy đủ / 3 tiết)</option>
                  <option value={12}>12 trang (Chuyên sâu / 4 tiết tích hợp)</option>
                  <option value={16}>16 trang (Toàn diện toàn bài học)</option>
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
                    <span className="theme-btn-text">{th.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Yêu cầu trọng tâm của Giảng viên (Tùy chọn)
              </label>
              <textarea
                className="form-textarea"
                placeholder="Nhấn mạnh quy trình thực hành, các lỗi sinh viên hay gặp khi cấu hình, hoặc công thức/sơ đồ kỹ thuật cần có..."
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
                  <span>AI Đang Soạn Slide Theo Giáo Trình...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Biên Soạn Slide PPTX & Giáo Án Cao Đẳng</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* CỘT PHẢI: XEM TRƯỚC BÀI GIẢNG 16:9 & XUẤT FILE */}
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
                    <span>Tải Giáo Án (.doc Cao Đẳng)</span>
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
                              Các ý chính kỹ thuật (Mỗi dòng là 1 gạch đầu dòng)
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
                            <label className="text-xs text-gray-600 dark:text-gray-400">Ghi chú giảng viên (Thị phạm / Quản lý thực hành)</label>
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

                      {/* Gợi ý sư phạm nghề cho giảng viên */}
                      {slide.teacherNotes && (
                        <div className="slide-teacher-notes">
                          <Lightbulb size={18} className="flex-shrink-0 mt-0.5" />
                          <div>
                            <strong>Hướng dẫn giảng viên & thị phạm nghề:</strong> {slide.teacherNotes}
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
              <BookOpen className="empty-icon text-blue-500" />
              <h3 className="empty-title">Chưa có nội dung bài giảng</h3>
              <p className="empty-desc">
                Chọn giáo trình đã lưu hoặc tải lên tệp giáo trình Word/PDF.
                Sau đó chọn các đề mục (Chương / Bài) ở khung bên trái và bấm <strong>"Biên Soạn Slide PPTX & Giáo Án Cao Đẳng"</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

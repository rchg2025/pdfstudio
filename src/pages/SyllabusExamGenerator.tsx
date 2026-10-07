import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Globe,
  Upload,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  FileDown,
  Cloud,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Settings,
  PlusCircle,
  Loader2,
  Check,
  AlertCircle,
  Key,
  RefreshCw,
  Bookmark,
  Trash2,
  ShieldCheck,
  LogIn
} from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { useAuth } from '../contexts/AuthContext';
import { useDialogs } from '../components/CustomDialogs';
import { useNotification } from '../contexts/NotificationContext';
import type { QuizQuestion, QuizPackage, SavedSyllabusSubject } from '../types/quiz';
import { downloadExamDocFile } from '../utils/wordExport';
import './SyllabusExamGenerator.css';

// Khởi tạo worker pdfjs an toàn
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

export default function SyllabusExamGenerator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showAlert } = useDialogs();
  const { showToast } = useNotification();

  // Quy trình 3 bước
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Tab nguồn dữ liệu ở Bước 1: 'file' | 'url' | 'text' | 'drive'
  const [sourceTab, setSourceTab] = useState<'file' | 'url' | 'text' | 'drive'>('file');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [webUrl, setWebUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [isProcessingSource, setIsProcessingSource] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drive Lưu trữ
  const [driveFileInfo, setDriveFileInfo] = useState<{
    fileId?: string;
    webViewLink?: string;
    fileName?: string;
  } | null>(null);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);

  // Bước 2: Cây cấu trúc mục lục
  const [syllabusTree, setSyllabusTree] = useState<TreeNode[]>([]);
  const [isExtractingTree, setIsExtractingTree] = useState(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(true);

  // Bước 3: Cấu hình đề thi
  const [examType, setExamType] = useState<'mixed' | 'choice' | 'essay'>('mixed');
  const [choiceCount, setChoiceCount] = useState<number>(30);
  const [essayCount, setEssayCount] = useState<number>(2);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(90);
  const [difficulty, setDifficulty] = useState<'medium' | 'easy' | 'hard' | 'mixed'>('medium');
  const [examSubject, setExamSubject] = useState<string>('Công nghệ thông tin');
  const [schoolName, setSchoolName] = useState<string>('BỘ GIÁO DỤC VÀ ĐÀO TẠO');
  const [departmentName, setDepartmentName] = useState<string>('KHOA CÔNG NGHỆ THÔNG TIN');

  // Đề thi được AI sinh ra
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([]);
  const [modelUsed, setModelUsed] = useState<string>('');

  // Tùy chỉnh Gemini API Key
  const [customApiKey, setCustomApiKey] = useState(() => {
    return localStorage.getItem('rchg_gemini_api_key') || '';
  });
  const [showKeySetting, setShowKeySetting] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Tiến trình phân tích bóc tách cây giáo trình
  const [analyzeProgressText, setAnalyzeProgressText] = useState('Đang khởi động phân tích cấu trúc giáo trình...');
  // Tiến trình sinh câu hỏi đề thi
  const [examProgressText, setExamProgressText] = useState('Đang khởi tạo đề thi với Google Gemini AI...');

  // Quản lý Môn học lưu theo tài khoản trong Database
  const [savedSubjects, setSavedSubjects] = useState<SavedSyllabusSubject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [currentSubjectId, setCurrentSubjectId] = useState<string | null>(null);
  const [isSavingSubject, setIsSavingSubject] = useState(false);

  // Tải danh sách môn học đã lưu của người dùng
  const loadSavedSubjects = async () => {
    if (!user) return;
    setIsLoadingSubjects(true);
    try {
      const res = await fetch(`/api/quiz-api?action=get-syllabus-subjects&userId=${encodeURIComponent(user.id)}`);
      const data = await res.json();
      if (res.ok && data.subjects) {
        setSavedSubjects(data.subjects);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách môn học:', err);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSavedSubjects();
    }
  }, [user]);

  // Lưu môn học hiện tại vào tài khoản
  const handleSaveCurrentSubject = async (customName?: string) => {
    if (!user) {
      showAlert('Vui lòng đăng nhập để lưu trữ môn học vào tài khoản!', 'Yêu cầu đăng nhập');
      return;
    }
    const nameToSave = customName?.trim() || examSubject.trim() || sourceTitle.trim() || 'Môn học mới';
    setIsSavingSubject(true);

    try {
      const payload = {
        id: currentSubjectId || undefined,
        userId: user.id,
        name: nameToSave,
        schoolName,
        departmentName,
        sourceType: sourceTab,
        sourceTitle,
        rawContent,
        driveFileId: driveFileInfo?.fileId,
        driveUrl: driveFileInfo?.webViewLink,
        tree: syllabusTree
      };

      const res = await fetch('/api/quiz-api?action=save-syllabus-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể lưu môn học vào tài khoản');
      }

      setCurrentSubjectId(data.subject.id);
      showToast(`Đã lưu môn học "${data.subject.name}" vào tài khoản của bạn!`, 'success');
      loadSavedSubjects();
    } catch (err: any) {
      showAlert(err.message || 'Lỗi khi lưu môn học', 'Lỗi lưu trữ');
    } finally {
      setIsSavingSubject(false);
    }
  };

  // Nạp lại môn học đã lưu để tiếp tục làm việc
  const handleLoadSubject = (subject: SavedSyllabusSubject) => {
    setCurrentSubjectId(subject.id);
    setExamSubject(subject.name || '');
    if (subject.schoolName) setSchoolName(subject.schoolName);
    if (subject.departmentName) setDepartmentName(subject.departmentName);
    if (subject.sourceType) setSourceTab(subject.sourceType);
    if (subject.sourceTitle) setSourceTitle(subject.sourceTitle);
    if (subject.rawContent) setRawContent(subject.rawContent);
    if (subject.driveFileId || subject.driveUrl) {
      setDriveFileInfo({
        fileId: subject.driveFileId,
        webViewLink: subject.driveUrl,
        fileName: subject.sourceTitle
      });
    }

    const tree = subject.tree || [];
    setSyllabusTree(tree);
    const allIds = getAllNodeIds(tree);
    setSelectedNodeIds(new Set(allIds));
    setExpandedNodeIds(new Set(allIds));
    setSelectAll(true);
    setCurrentStep(3); // Vào thẳng màn hình cấu hình & sinh đề thi
    showToast(`Đã nạp môn "${subject.name}" cùng cây đề mục thành công!`, 'success');
  };

  // Xóa môn học đã lưu
  const handleDeleteSubject = async (e: React.MouseEvent, subjectId: string, subjectName: string) => {
    e.stopPropagation();
    if (!user) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa môn học "${subjectName}" khỏi tài khoản không?`)) {
      return;
    }

    try {
      const res = await fetch('/api/quiz-api?action=delete-syllabus-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subjectId, userId: user.id })
      });
      if (res.ok) {
        showToast(`Đã xóa môn "${subjectName}"`, 'success');
        if (currentSubjectId === subjectId) {
          setCurrentSubjectId(null);
        }
        loadSavedSubjects();
      } else {
        const d = await res.json();
        showAlert(d.error || 'Không thể xóa môn học', 'Lỗi');
      }
    } catch (err: any) {
      showAlert(err.message || 'Lỗi khi xóa môn học', 'Lỗi');
    }
  };


  const handleTestApiKey = async () => {
    setIsTestingKey(true);
    setKeyTestStatus(null);
    try {
      const res = await fetch('/api/quiz-api?action=test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: customApiKey.trim() || undefined })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKeyTestStatus({
          success: true,
          message: data.message || `Kết nối thành công với model ${data.model}!`
        });
        showToast(data.message || 'Kết nối Gemini API thành công!', 'success');
      } else {
        setKeyTestStatus({
          success: false,
          message: data.error || 'API Key không hợp lệ hoặc vượt hạn mức.'
        });
        showAlert(data.error || 'API Key không hợp lệ hoặc vượt hạn mức.', 'Kiểm tra thất bại');
      }
    } catch (e: any) {
      setKeyTestStatus({
        success: false,
        message: e.message || 'Lỗi mạng khi kiểm tra API Key.'
      });
      showAlert(e.message || 'Lỗi mạng khi kiểm tra API Key.', 'Lỗi kết nối');
    } finally {
      setIsTestingKey(false);
    }
  };

  // Quét toàn bộ ID của các node trong cây
  const getAllNodeIds = (nodes: TreeNode[]): string[] => {
    let ids: string[] = [];
    nodes.forEach(n => {
      ids.push(n.id);
      if (n.children && n.children.length > 0) {
        ids = ids.concat(getAllNodeIds(n.children));
      }
    });
    return ids;
  };

  // Lấy danh sách tên các mục đã được chọn
  const getSelectedNodeTitles = (nodes: TreeNode[], selectedIds: Set<string>): string[] => {
    let titles: string[] = [];
    nodes.forEach(n => {
      if (selectedIds.has(n.id)) {
        titles.push(n.title);
      }
      if (n.children && n.children.length > 0) {
        titles = titles.concat(getSelectedNodeTitles(n.children, selectedIds));
      }
    });
    return titles;
  };

  // Upload file lên Google Drive tự động
  const uploadDocToDrive = async (file: File) => {
    if (!user) return;
    setIsUploadingToDrive(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({
              fileBase64: base64,
              filename: file.name,
              mimeType: file.type || 'application/octet-stream'
            })
          });
          const data = await res.json();
          if (res.ok && data.fileId) {
            setDriveFileInfo({
              fileId: data.fileId,
              webViewLink: data.webViewLink,
              fileName: file.name
            });
            showToast('Đã lưu tài liệu an toàn vào Google Drive của bạn!', 'success');
          }
        } catch (e) {
          console.warn('Drive upload error:', e);
        } finally {
          setIsUploadingToDrive(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingToDrive(false);
    }
  };

  // Trích xuất văn bản từ File (.docx, .pdf, .txt)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileToUpload(file);
    setSourceTitle(file.name.replace(/\.[^/.]+$/, ''));
    setIsProcessingSource(true);

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
        // Txt hoặc file văn bản thường
        extracted = await file.text();
      }

      if (!extracted.trim()) {
        showAlert('Tệp tin không có văn bản hoặc không đọc được nội dung.', 'Lỗi đọc tệp');
        setIsProcessingSource(false);
        return;
      }

      setRawContent(extracted);
      showToast(`Đã đọc xong tài liệu "${file.name}" (${extracted.length} ký tự)`, 'success');

      // Tự động upload lên Drive lưu trữ
      uploadDocToDrive(file);
    } catch (err: any) {
      showAlert('Lỗi khi đọc file: ' + (err.message || 'Không thể giải mã tệp'), 'Lỗi');
    } finally {
      setIsProcessingSource(false);
      if (e.target) e.target.value = '';
    }
  };

  // Đọc nội dung từ URL Internet
  const handleFetchUrl = async () => {
    if (!webUrl.trim()) {
      showAlert('Vui lòng nhập đường link URL của bài viết hoặc tài liệu giáo trình.', 'Thiếu URL');
      return;
    }
    setIsProcessingSource(true);
    try {
      const res = await fetch('/api/quiz-api?action=fetch-url-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể lấy nội dung từ link này.');
      }
      setRawContent(data.content);
      setSourceTitle(webUrl.replace(/^https?:\/\//i, '').slice(0, 40));
      showToast(`Đã lấy thành công nội dung từ Internet (${data.content.length} ký tự)!`, 'success');
    } catch (err: any) {
      showAlert(err.message || 'Lỗi kết nối khi quét link.', 'Lỗi tải trang');
    } finally {
      setIsProcessingSource(false);
    }
  };

  // Bước 1 -> Bước 2: Phân tích Cây Mục Lục Giáo Trình bằng AI
  const handleAnalyzeSyllabus = async () => {
    const content = rawContent.trim() || pastedText.trim();
    if (!content) {
      showAlert('Vui lòng tải tệp giáo trình, lấy dữ liệu từ link hoặc dán văn bản bài học!', 'Chưa có dữ liệu');
      return;
    }

    setIsExtractingTree(true);
    setAnalyzeProgressText('Đang gửi nội dung tài liệu tới Google Gemini AI...');

    const progressSteps = [
      'Đang trích xuất cấu trúc đề mục, các chương, bài học và mục con...',
      'Đang tự động xoay vòng qua các Model (3.6 Flash, 2.5 Flash, 2.0 Flash, 1.5 Flash)...',
      'Đang đối soát định dạng cây phân cấp JSON chuẩn...',
      'Gần hoàn tất, đang chuẩn bị cây đề mục kiến thức...'
    ];
    let stepIndex = 0;
    const progressTimer = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setAnalyzeProgressText(progressSteps[stepIndex]);
        stepIndex++;
      }
    }, 2500);

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
        throw new Error(data.error || 'Lỗi khi trích xuất mục lục giáo trình.');
      }

      const tree: TreeNode[] = data.tree || [];
      if (tree.length === 0) {
        throw new Error('AI không nhận diện được cấu trúc chương/mục trong văn bản này.');
      }

      setSyllabusTree(tree);
      const allIds = getAllNodeIds(tree);
      setSelectedNodeIds(new Set(allIds));
      setExpandedNodeIds(new Set(allIds));
      setSelectAll(true);
      setCurrentStep(3); // Chuyển thẳng sang Bước 3 hiển thị giao diện 2 cột như ảnh của người dùng!
      showToast(`Đã phân tích xong mục lục giáo trình bằng model ${data.modelUsed || 'Gemini'}!`, 'success');

      // Tự động lưu môn học vào database nếu đã đăng nhập
      if (user) {
        const autoName = examSubject.trim() || sourceTitle.trim() || 'Giáo trình mới';
        handleSaveCurrentSubject(autoName);
      }
    } catch (err: any) {
      const msg = err.message || 'Không thể phân tích mục lục giáo trình';
      showAlert(msg, 'Lỗi phân tích đề mục');
      if (msg.includes('Google Gemini API Key') || msg.includes('API Key') || msg.includes('hạn mức')) {
        setShowKeySetting(true);
      }
    } finally {
      clearInterval(progressTimer);
      setIsExtractingTree(false);
    }
  };

  // Xử lý tick chọn node trong cây
  const handleToggleNode = (node: TreeNode) => {
    const newSelected = new Set(selectedNodeIds);
    const nodeIds = [node.id, ...getAllNodeIds(node.children || [])];
    const isCurrentlySelected = newSelected.has(node.id);

    if (isCurrentlySelected) {
      nodeIds.forEach(id => newSelected.delete(id));
      setSelectAll(false);
    } else {
      nodeIds.forEach(id => newSelected.add(id));
      const allIds = getAllNodeIds(syllabusTree);
      if (allIds.every(id => newSelected.has(id))) {
        setSelectAll(true);
      }
    }
    setSelectedNodeIds(newSelected);
  };

  // Toggle Chọn tất cả / Bỏ chọn tất cả
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

  // Đóng/Mở nhánh con
  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedNodeIds);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedNodeIds(newExpanded);
  };

  // Render từng Node trong Cây phân cấp
  const renderTreeNode = (node: TreeNode, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNodeIds.has(node.id);
    const isExpanded = expandedNodeIds.has(node.id);

    return (
      <div key={node.id} className={`syl-tree-node syl-tree-level-${Math.min(level, 3)}`}>
        <div className="syl-tree-node-row">
          {hasChildren ? (
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              style={{ padding: 2, height: 'auto', minWidth: 'unset', color: 'var(--text-muted)' }}
              onClick={() => handleToggleExpand(node.id)}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span style={{ width: 14, display: 'inline-block' }} />
          )}

          <input
            type="checkbox"
            id={`node-${node.id}`}
            checked={isSelected}
            onChange={() => handleToggleNode(node)}
          />

          <label htmlFor={`node-${node.id}`} className="syl-tree-node-label">
            {node.title}
          </label>
        </div>

        {hasChildren && isExpanded && (
          <div className="syl-tree-children">
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Thực hiện sinh đề thi bằng AI
  const handleGenerateExam = async () => {
    const selectedTitles = getSelectedNodeTitles(syllabusTree, selectedNodeIds);
    if (selectedTitles.length === 0) {
      showAlert('Vui lòng tick chọn ít nhất một chương, bài hoặc mục con trong cây kiến thức!', 'Chưa chọn phạm vi');
      return;
    }

    if (examType === 'choice' && choiceCount <= 0) {
      showAlert('Vui lòng nhập số câu trắc nghiệm lớn hơn 0', 'Cấu hình chưa đúng');
      return;
    }
    if (examType === 'essay' && essayCount <= 0) {
      showAlert('Vui lòng nhập số câu tự luận lớn hơn 0', 'Cấu hình chưa đúng');
      return;
    }

    setIsGeneratingExam(true);
    setExamProgressText(`Đang kết nối AI để biên soạn đề thi (${examType === 'choice' ? `${choiceCount} câu trắc nghiệm` : examType === 'essay' ? `${essayCount} câu tự luận` : `${choiceCount} TN + ${essayCount} TL`})...`);

    const progressSteps = [
      'Đang trích xuất nội dung giáo trình bám sát các chương đã chọn...',
      'Đang tự động kết nối và xoay vòng các Model (Gemini 3.6 Flash, 2.5 Flash, 2.0 Flash)...',
      'Đang biên soạn các câu hỏi, phân loại 4 đáp án A, B, C, D và barem điểm chi tiết...',
      'Đang chuẩn hóa đề thi theo mẫu quy chuẩn sư phạm...',
      'Gần hoàn tất, đang kết xuất tờ đề thi...'
    ];
    let stepIdx = 0;
    const examTimer = setInterval(() => {
      if (stepIdx < progressSteps.length) {
        setExamProgressText(progressSteps[stepIdx]);
        stepIdx++;
      }
    }, 2800);

    try {
      const res = await fetch('/api/quiz-api?action=generate-syllabus-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedTopics: selectedTitles,
          examType,
          choiceCount: examType === 'essay' ? 0 : choiceCount,
          essayCount: examType === 'choice' ? 0 : essayCount,
          difficulty,
          sourceContext: rawContent || pastedText,
          customApiKey: customApiKey.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi AI tạo đề thi.');
      }

      setGeneratedQuestions(data.questions || []);
      setModelUsed(data.modelUsed || 'Gemini');
      showToast(`AI (${data.modelUsed}) đã soạn thành công đề thi với ${data.questions.length} câu hỏi!`, 'success');
    } catch (err: any) {
      const msg = err.message || 'Không thể tạo đề thi';
      showAlert(msg, 'Lỗi biên soạn đề thi AI');
      if (msg.includes('Google Gemini API Key') || msg.includes('API Key') || msg.includes('hạn mức')) {
        setShowKeySetting(true);
      }
    } finally {
      clearInterval(examTimer);
      setIsGeneratingExam(false);
    }
  };

  // Xuất file Word (.doc) đúng chuẩn mẫu để có thể import ngược vào /quan-ly-thi-trac-nghiem
  const handleExportWord = () => {
    if (generatedQuestions.length === 0) {
      showAlert('Chưa có câu hỏi nào để xuất file Word! Vui lòng bấm tạo đề thi trước.', 'Chưa có đề');
      return;
    }

    downloadExamDocFile(
      generatedQuestions,
      {
        title: sourceTitle || 'ĐỀ THI KIỂM TRA ĐÁNH GIÁ',
        subject: examSubject || 'Chung',
        timeLimitMinutes: timeLimitMinutes || 90,
        schoolName,
        departmentName,
        includeAnswersTable: true,
        includeExplanations: true
      },
      `DeThi_${(examSubject || 'MonHoc').replace(/\s+/g, '_')}_${Date.now()}.doc`
    );

    showToast('Đã xuất file Word chuẩn mẫu thành công!', 'success');
  };

  // Thêm trực tiếp bộ đề này vào Quản lý thi trắc nghiệm (tienich.ite.id.vn/quan-ly-thi-trac-nghiem)
  const handleImportToQuizManager = async () => {
    if (generatedQuestions.length === 0) {
      showAlert('Chưa có câu hỏi nào để chuyển vào hệ thống thi!', 'Thông báo');
      return;
    }

    const confirm = window.confirm(
      `Bạn có muốn tạo ngay bộ đề thi mới "${sourceTitle || 'Bộ đề thi mới'}" vào hệ thống Quản lý thi trắc nghiệm không?`
    );
    if (!confirm) return;

    const newQuizId = `qz-${Date.now()}`;
    const newQuizCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newQuiz: QuizPackage = {
      id: newQuizId,
      userId: user?.id,
      title: sourceTitle ? `Đề thi: ${sourceTitle}` : 'Đề thi tạo từ Giáo trình',
      subject: examSubject || 'Chung',
      description: `Bộ đề sinh tự động từ giáo trình bám sát ${getSelectedNodeTitles(syllabusTree, selectedNodeIds).length} chuyên đề mục lục.`,
      code: newQuizCode,
      isOpen: true,
      questions: generatedQuestions,
      settings: {
        timeLimitMinutes: timeLimitMinutes || 90,
        passingScorePercent: 50,
        shuffleQuestions: true,
        shuffleOptions: true,
        questionSelectionMode: 'all',
        difficultyDistribution: {
          easyCount: generatedQuestions.filter(q => q.difficulty === 'easy').length,
          mediumCount: generatedQuestions.filter(q => q.difficulty === 'medium').length,
          hardCount: generatedQuestions.filter(q => q.difficulty === 'hard').length
        },
        requireStudentInfo: true,
        studentFields: {
          fullName: true,
          studentId: true,
          className: true,
          email: false
        },
        bgMusicType: 'lofi',
        enableSounds: true,
        showResultsImmediately: true,
        showCorrectAnswersAfterSubmit: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Lưu vào Database backend
      await fetch('/api/quiz-api?action=save-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuiz)
      });

      // 2. Lưu vào LocalStorage
      if (user) {
        try {
          const currentLocal = localStorage.getItem(`rchg_quiz_packages_${user.id}`);
          const parsed = currentLocal ? JSON.parse(currentLocal) : [];
          localStorage.setItem(`rchg_quiz_packages_${user.id}`, JSON.stringify([newQuiz, ...parsed]));
        } catch {}
      }

      showToast(`Đã thêm bộ đề thi (Mã: #${newQuizCode}) vào Quản lý thi trắc nghiệm! Đang chuyển hướng...`, 'success');
      setTimeout(() => {
        navigate('/quan-ly-thi-trac-nghiem');
      }, 1200);
    } catch (err: any) {
      showAlert('Lỗi khi lưu bộ đề: ' + err.message, 'Lỗi');
    }
  };

  // 1. Kiểm tra yêu cầu Đăng nhập hệ thống (Bảo vệ dữ liệu & lưu trữ môn học theo tài khoản)
  if (!user) {
    return (
      <div className="syl-page animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{
          maxWidth: 620,
          width: '100%',
          margin: '40px auto',
          background: 'var(--bg-secondary)',
          padding: '3rem 2rem',
          borderRadius: 'var(--radius-xl)',
          border: '1.5px solid rgba(99, 102, 241, 0.25)',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center'
        }}>
          <div style={{
            width: 70,
            height: 70,
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.12)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: '2px solid rgba(99, 102, 241, 0.25)'
          }}>
            <ShieldCheck size={38} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Yêu Cầu Đăng Nhập Tài Khoản
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Hệ thống bóc tách cây giáo trình và soạn đề thi tự động AI yêu cầu đăng nhập tài khoản 
            để quản lý, lưu trữ các Môn học và ngân hàng đề thi riêng biệt theo từng người dùng.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontWeight: 700 }}>
              <LogIn size={18} /> Đăng Nhập Ngay
            </Link>
            <Link to="/" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="syl-page animate-fade-in">
      {/* Main Banner / Header (Matching QuizManager qm-header) */}
      <header className="syl-header-banner">
        <div className="syl-title-group">
          <div className="syl-icon-box">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="syl-title">Soạn Đề Thi Từ Giáo Trình & Khung Chương Trình AI</h1>
            <p className="syl-subtitle">
              Tự động bóc tách cây đề mục (Chương / Bài / Sub) từ Word, PDF, Drive hoặc Link Web để sinh đề trắc nghiệm & tự luận theo phạm vi chọn lọc.
            </p>
          </div>
        </div>

        <div className="syl-header-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/quan-ly-thi-trac-nghiem')}
            style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
          >
            <ArrowLeft size={15} /> Về Quản Lý Thi
          </button>
        </div>
      </header>

      {/* Stepper Bar Full Width */}
      <div className="syl-stepper-bar">
        <div
          className={`syl-step-card ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
          onClick={() => setCurrentStep(1)}
        >
          <div className="syl-step-badge">1</div>
          <div>
            <div className="syl-step-info-title">Bước 1: Nguồn Giáo Trình</div>
            <div className="syl-step-info-desc">Tải Word, PDF, Drive hoặc Link Internet</div>
          </div>
        </div>

        <div
          className={`syl-step-card ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
          onClick={() => syllabusTree.length > 0 && setCurrentStep(2)}
        >
          <div className="syl-step-badge">2</div>
          <div>
            <div className="syl-step-info-title">Bước 2: Cây Đề Mục Kiến Thức</div>
            <div className="syl-step-info-desc">Trích xuất chương/bài & chọn phạm vi</div>
          </div>
        </div>

        <div
          className={`syl-step-card ${currentStep === 3 ? 'active' : ''}`}
          onClick={() => syllabusTree.length > 0 && setCurrentStep(3)}
        >
          <div className="syl-step-badge">3</div>
          <div>
            <div className="syl-step-info-title">Bước 3: Cấu Hình & Sinh Đề</div>
            <div className="syl-step-info-desc">Biên soạn câu hỏi & xuất file Word chuẩn</div>
          </div>
        </div>
      </div>

      {/* BƯỚC 1: CHỌN NGUỒN TÀI LIỆU HOẶC MỞ MÔN HỌC ĐÃ LƯU */}
      {currentStep === 1 && (
        <div className="syl-panel animate-fade-in">
          {/* MÔN HỌC ĐÃ LƯU CỦA TÔI */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(124, 58, 237, 0.05))',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid rgba(99, 102, 241, 0.25)',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bookmark size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Môn Học & Giáo Trình Đã Lưu Của Bạn ({savedSubjects.length})
                </h3>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Bấm vào một môn học để tải lại ngay cấu trúc đề mục và tiếp tục soạn đề
              </span>
            </div>

            {isLoadingSubjects ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <Loader2 size={16} className="spin" style={{ display: 'inline', marginRight: 6 }} />
                Đang tải danh sách môn học của bạn...
              </div>
            ) : savedSubjects.length === 0 ? (
              <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.86rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Bạn chưa lưu môn học nào. Sau khi tải tệp và bóc tách cây giáo trình bên dưới, hệ thống sẽ tự động lưu môn vào tài khoản để bạn tái sử dụng bất cứ lúc nào!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {savedSubjects.map((subj) => {
                  const nodeCount = getAllNodeIds(subj.tree || []).length;
                  return (
                    <div
                      key={subj.id}
                      onClick={() => handleLoadSubject(subj)}
                      style={{
                        padding: '0.85rem 1rem',
                        background: currentSubjectId === subj.id ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary)',
                        border: currentSubjectId === subj.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        position: 'relative'
                      }}
                      className="syl-subject-card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                          📚 {subj.name}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSubject(e, subj.id, subj.name)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Xóa môn này khỏi tài khoản"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        {nodeCount > 0 ? `${nodeCount} đề mục kiến thức` : 'Chưa có cây đề mục'}
                        {subj.schoolName ? ` • ${subj.schoolName}` : ''}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>{subj.updatedAt ? new Date(subj.updatedAt).toLocaleDateString('vi-VN') : ''}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Tiếp tục soạn đề →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="syl-source-tabs">
            <button
              type="button"
              className={`syl-source-tab-btn ${sourceTab === 'file' ? 'active' : ''}`}
              onClick={() => setSourceTab('file')}
            >
              <FileText size={16} /> Tải file Word (.docx, .doc) / PDF
            </button>
            <button
              type="button"
              className={`syl-source-tab-btn ${sourceTab === 'url' ? 'active' : ''}`}
              onClick={() => setSourceTab('url')}
            >
              <Globe size={16} /> Lấy nội dung từ Link Internet
            </button>
            <button
              type="button"
              className={`syl-source-tab-btn ${sourceTab === 'text' ? 'active' : ''}`}
              onClick={() => setSourceTab('text')}
            >
              <BookOpen size={16} /> Dán văn bản Giáo trình / Đề cương
            </button>
          </div>

          {/* Tab 1: File Upload */}
          {sourceTab === 'file' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".docx,.doc,.pdf,.txt"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              <div
                className="syl-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="syl-dropzone-icon">
                  <Upload size={32} />
                </div>
                <div className="syl-dropzone-title">
                  {isProcessingSource ? 'Đang đọc và giải mã tệp...' : 'Bấm vào đây để tải lên hoặc kéo thả tệp giáo trình vào'}
                </div>
                <div className="syl-dropzone-sub">
                  Hỗ trợ tài liệu Microsoft Word (.docx, .doc), PDF hoặc văn bản (.txt)
                </div>
              </div>

              {fileToUpload && (
                <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <FileText size={22} color="var(--primary)" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fileToUpload.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {(fileToUpload.size / 1024 / 1024).toFixed(2)} MB • {rawContent.length} ký tự đã sẵn sàng
                      </div>
                    </div>
                  </div>

                  {driveFileInfo?.webViewLink ? (
                    <a
                      href={driveFileInfo.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="syl-badge-saved-drive"
                      style={{ textDecoration: 'none' }}
                    >
                      <Cloud size={13} /> Đã lưu trữ Google Drive <ExternalLink size={12} />
                    </a>
                  ) : isUploadingToDrive ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <Loader2 size={13} className="spin" /> Đang đồng bộ Drive...
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: URL Internet */}
          {sourceTab === 'url' && (
            <div style={{ width: '100%' }}>
              <label className="qm-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Đường dẫn URL bài giảng / trang web tài liệu tham khảo:
              </label>
              <div className="syl-url-input-group">
                <input
                  type="url"
                  className="qm-input syl-url-field"
                  placeholder="https://example.com/bai-giang-chuong-1..."
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  disabled={isProcessingSource}
                />
                <button
                  type="button"
                  className="btn btn-primary syl-url-btn"
                  onClick={handleFetchUrl}
                  disabled={isProcessingSource}
                >
                  {isProcessingSource ? <Loader2 size={16} className="spin" /> : <Globe size={16} />} Quét Link
                </button>
              </div>

              {rawContent && sourceTab === 'url' && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                  ✓ Đã trích xuất <strong>{rawContent.length}</strong> ký tự văn bản từ link trang web.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Paste Text */}
          {sourceTab === 'text' && (
            <div style={{ width: '100%' }}>
              <label className="qm-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Dán đề cương, mục lục hoặc nội dung văn bản giáo trình:
              </label>
              <textarea
                className="qm-textarea syl-source-textarea"
                rows={11}
                placeholder="Dán nội dung chương trình khung, giáo trình môn học hoặc đề cương chi tiết vào đây..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
            </div>
          )}

          {/* Footer nút hành động Bước 1 */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setShowKeySetting(!showKeySetting)}
                style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
              >
                <Settings size={13} /> {showKeySetting ? 'Ẩn cấu hình Gemini API Key' : 'Tùy chỉnh Gemini API Key cá nhân'}
              </button>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={isProcessingSource || isExtractingTree || (!rawContent.trim() && !pastedText.trim())}
              onClick={handleAnalyzeSyllabus}
            >
              {isExtractingTree ? (
                <>
                  <Loader2 size={16} className="spin" /> Đang Phân Tích Cây Mục Lục...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Phân Tích Mục Lục Giáo Trình & Đi Tiếp <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Banner Thông báo tiến trình khi AI đang phân tích */}
          {isExtractingTree && (
            <div style={{
              marginTop: '1.25rem',
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(124, 58, 237, 0.08))',
              border: '1.5px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Loader2 size={24} color="var(--primary)" className="spin" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                  Hệ thống đang phân tích cây mục lục giáo trình...
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {analyzeProgressText}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  💡 Vui lòng giữ cửa sổ trình duyệt, quá trình bóc tách chương/mục tự động mất khoảng 5 - 15 giây tùy độ dài tài liệu.
                </div>
              </div>
            </div>
          )}

          {/* Cấu hình Gemini Key */}
          {showKeySetting && (
            <div style={{
              marginTop: '1.25rem',
              background: 'var(--bg-secondary)',
              padding: '1.15rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label className="qm-label" style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Key size={14} color="var(--primary)" /> Tùy chỉnh Google Gemini API Key cá nhân:
                </label>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  (Để trống sẽ dùng Key hệ thống mặc định của Quản trị viên)
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 320px' }}>
                  <input
                    type="password"
                    className="qm-input"
                    placeholder="AIzaSy... hoặc dán API Key của bạn"
                    value={customApiKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomApiKey(val);
                      localStorage.setItem('rchg_gemini_api_key', val);
                      setKeyTestStatus(null);
                    }}
                    style={{ fontSize: '0.88rem', width: '100%', paddingRight: '2.5rem' }}
                  />
                  {customApiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomApiKey('');
                        localStorage.removeItem('rchg_gemini_api_key');
                        setKeyTestStatus(null);
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                      title="Xóa key cá nhân"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleTestApiKey}
                  disabled={isTestingKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.82rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isTestingKey ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
                  {isTestingKey ? 'Đang kiểm tra...' : 'Kiểm Tra Key'}
                </button>
              </div>

              {keyTestStatus && (
                <div style={{
                  marginTop: '0.65rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: keyTestStatus.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: keyTestStatus.success ? '#059669' : '#dc2626',
                  border: `1px solid ${keyTestStatus.success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                }}>
                  {keyTestStatus.success ? <Check size={15} /> : <AlertCircle size={15} />}
                  <span>{keyTestStatus.message}</span>
                </div>
              )}

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.6rem', lineHeight: 1.5 }}>
                • Lấy API Key miễn phí tại: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Google AI Studio (aistudio.google.com)</a>.<br />
                • Hệ thống tự động phát hiện và luân chuyển các Model mới nhất (Gemini 3.6 Flash, 2.5 Flash, 2.0 Flash, 1.5 Flash...) để đảm bảo luôn tạo được đề thi thành công.
              </div>
            </div>
          )}
        </div>
      )}

      {/* BƯỚC 3 (HOẶC 2): GIAO DIỆN CHÍNH 2 CỘT TƯƠNG TỰ HÌNH ẢNH MẪU */}
      {(currentStep === 2 || currentStep === 3) && (
        <div className="syl-full-grid animate-fade-in">
          {/* CỘT TRÁI: CẤU HÌNH ĐỀ THI & CÂY CHỌN MỤC LỤC */}
          <div className="syl-config-col">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-primary)' }}>
                <Settings size={18} color="var(--primary)" /> CẤU HÌNH ĐỀ THI
              </h2>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => handleSaveCurrentSubject()}
                  disabled={isSavingSubject}
                  style={{ borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 600 }}
                  title="Lưu môn học và cây đề mục vào database tài khoản"
                >
                  {isSavingSubject ? <Loader2 size={13} className="spin" /> : <Bookmark size={13} />}
                  {isSavingSubject ? 'Đang lưu...' : 'Lưu Môn Học'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => setCurrentStep(1)}
                >
                  Đổi nguồn tài liệu
                </button>
              </div>
            </div>

            {/* Khối Cây Kiến thức */}
            <div className="qm-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="qm-label" style={{ margin: 0 }}>
                  Phạm vi kiến thức (Chọn các chương/bài):
                </label>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={handleToggleSelectAll}
                  style={{ fontSize: '0.78rem', color: 'var(--primary)', padding: '2px 6px' }}
                >
                  {selectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>

              {/* Box Cây Thư Mục Phân Cấp */}
              <div className="syl-tree-box">
                {/* Checkbox Tổng */}
                <div
                  className="syl-tree-node-row"
                  style={{
                    background: selectAll ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.5rem',
                    fontWeight: 700
                  }}
                >
                  <input
                    type="checkbox"
                    id="select-all-nodes"
                    checked={selectAll}
                    onChange={handleToggleSelectAll}
                  />
                  <label htmlFor="select-all-nodes" className="syl-tree-node-label" style={{ fontWeight: 700 }}>
                    Chọn tất cả các chương/bài ({syllabusTree.length} chương)
                  </label>
                </div>

                {/* Danh sách các node */}
                {syllabusTree.map(node => renderTreeNode(node, 0))}
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Đã chọn <strong>{getSelectedNodeTitles(syllabusTree, selectedNodeIds).length}</strong> mục kiến thức để AI biên soạn đề.
              </div>
            </div>

            {/* Loại đề thi */}
            <div className="qm-form-group">
              <label className="qm-label">Loại đề thi</label>
              <select
                className="qm-select"
                value={examType}
                onChange={(e) => setExamType(e.target.value as any)}
                disabled={isGeneratingExam}
              >
                <option value="mixed">Kết hợp (Trắc nghiệm & Tự luận / Thực hành)</option>
                <option value="choice">Chỉ Trắc nghiệm (ABCD)</option>
                <option value="essay">Chỉ Tự luận / Tình huống thực hành</option>
              </select>
            </div>

            {/* Số lượng câu hỏi */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {(examType === 'mixed' || examType === 'choice') && (
                <div className="qm-form-group">
                  <label className="qm-label">Số câu Trắc nghiệm</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="qm-input"
                    value={choiceCount}
                    onChange={(e) => setChoiceCount(Number(e.target.value))}
                    disabled={isGeneratingExam}
                  />
                </div>
              )}

              {(examType === 'mixed' || examType === 'essay') && (
                <div className="qm-form-group">
                  <label className="qm-label">Câu Thực hành/Tự luận</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="qm-input"
                    value={essayCount}
                    onChange={(e) => setEssayCount(Number(e.target.value))}
                    disabled={isGeneratingExam}
                  />
                </div>
              )}
            </div>

            {/* Thời gian làm bài & Độ khó */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="qm-form-group">
                <label className="qm-label">Thời gian làm bài (phút)</label>
                <input
                  type="number"
                  min={10}
                  max={240}
                  step={5}
                  className="qm-input"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  disabled={isGeneratingExam}
                />
              </div>

              <div className="qm-form-group">
                <label className="qm-label">Mức độ khó</label>
                <select
                  className="qm-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  disabled={isGeneratingExam}
                >
                  <option value="medium">Trung bình</option>
                  <option value="easy">Cơ bản (Dễ)</option>
                  <option value="hard">Nâng cao (Khó)</option>
                  <option value="mixed">Cân đối phân loại</option>
                </select>
              </div>
            </div>

            {/* Thông tin môn & Đơn vị đào tạo (Cho file Word) */}
            <div style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
              <div className="qm-form-group">
                <label className="qm-label" style={{ fontSize: '0.82rem' }}>Tên môn học / Học phần</label>
                <input
                  type="text"
                  className="qm-input"
                  value={examSubject}
                  onChange={(e) => setExamSubject(e.target.value)}
                  placeholder="Ví dụ: Công nghệ thông tin cơ bản"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="qm-form-group">
                  <label className="qm-label" style={{ fontSize: '0.82rem' }}>Cơ quan chủ quản</label>
                  <input
                    type="text"
                    className="qm-input"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
                <div className="qm-form-group">
                  <label className="qm-label" style={{ fontSize: '0.82rem' }}>Khoa / Bộ môn</label>
                  <input
                    type="text"
                    className="qm-input"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Nút Kích hoạt Sinh Đề AI */}
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
              onClick={handleGenerateExam}
              disabled={isGeneratingExam}
            >
              {isGeneratingExam ? (
                <>
                  <Loader2 size={18} className="spin" /> Đang Biên Soạn Đề Thi Bằng AI...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> BẮT ĐẦU TẠO ĐỀ KIỂM TRA
                </>
              )}
            </button>
          </div>

          {/* CỘT PHẢI: XEM TRƯỚC ĐỀ THI & XUẤT FILE WORD / NẠP HỆ THỐNG */}
          <div className="syl-preview-col">
            <div className="syl-preview-toolbar">
              <div className="syl-preview-title">
                <FileText size={20} color="var(--primary)" /> XEM TRƯỚC ĐỀ THI
                {generatedQuestions.length > 0 && (
                  <>
                    <span className="qm-badge" style={{ background: '#10b981', color: '#fff', fontSize: '0.78rem' }}>
                      {generatedQuestions.length} câu hỏi
                    </span>
                    {modelUsed && (
                      <span className="qm-badge" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', fontSize: '0.78rem' }}>
                        Model: {modelUsed}
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className="syl-actions-row">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleExportWord}
                  disabled={generatedQuestions.length === 0}
                  style={{ background: '#2563eb', borderColor: '#2563eb' }}
                  title="Xuất đề thi ra file Word (.doc) đúng chuẩn để in hoặc import"
                >
                  <FileDown size={15} /> Xuất Word
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleImportToQuizManager}
                  disabled={generatedQuestions.length === 0}
                  style={{ color: '#10b981', borderColor: '#10b981' }}
                  title="Tạo phòng thi trực tiếp trong trang Quản lý thi trắc nghiệm"
                >
                  <PlusCircle size={15} /> Nạp Vào Phòng Thi
                </button>
              </div>
            </div>

            {/* Vùng hiển thị tờ đề thi */}
            {isGeneratingExam ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5rem 2rem',
                textAlign: 'center',
                flex: 1
              }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}>
                  <Loader2 size={36} color="var(--primary)" className="spin" />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Đang biên soạn bộ đề kiểm tra...
                </div>
                <div style={{ fontSize: '0.92rem', color: 'var(--primary)', fontWeight: 600, maxWidth: '520px', lineHeight: 1.5 }}>
                  {examProgressText}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.75rem', maxWidth: '480px' }}>
                  💡 Hệ thống tự động sử dụng Gemini API Key và xoay vòng các model mới nhất. Đề thi sẽ tự động xuất hiện ngay bên dưới khi hoàn tất.
                </div>
              </div>
            ) : generatedQuestions.length === 0 ? (
              <div className="syl-exam-empty">
                <FileText size={56} />
                <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                  Đề thi sẽ hiển thị tại đây sau khi AI xử lý xong...
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  Hãy tick chọn phạm vi kiến thức ở cột trái và bấm nút "Bắt đầu tạo đề kiểm tra".
                </div>
              </div>
            ) : (
              <div className="syl-exam-sheet animate-fade-in">
                {/* Header Tiêu đề trường & môn thi */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '45%', textAlign: 'center', verticalAlign: 'top', fontSize: '13pt' }}>
                        <strong>{schoolName}</strong><br />
                        <strong>{departmentName}</strong><br />
                        <div style={{ margin: '4px auto', width: '120px', borderBottom: '1px solid #000' }} />
                      </td>
                      <td style={{ width: '55%', textAlign: 'center', verticalAlign: 'top', fontSize: '13pt' }}>
                        <strong>ĐỀ THI KIỂM TRA ĐÁNH GIÁ</strong><br />
                        <strong style={{ color: '#1e3a8a' }}>{(sourceTitle || 'MÔN HỌC').toUpperCase()}</strong><br />
                        <span>Môn học: <strong>{examSubject}</strong></span><br />
                        <span>Thời gian làm bài: <strong>{timeLimitMinutes} phút</strong></span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* PHẦN I: TRẮC NGHIỆM */}
                {generatedQuestions.filter(q => q.type === 'choice' || q.type === 'multiple_choice').length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '1.5px solid #1e3a8a', paddingBottom: '3px', margin: '16px 0 10px' }}>
                      PHẦN I. TRẮC NGHIỆM KHÁCH QUAN ({generatedQuestions.filter(q => q.type === 'choice' || q.type === 'multiple_choice').length} câu)
                    </h3>

                    {generatedQuestions
                      .filter(q => q.type === 'choice' || q.type === 'multiple_choice')
                      .map((q, idx) => (
                        <div key={q.id} style={{ marginBottom: '14px', lineHeight: 1.45 }}>
                          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>
                            Câu {idx + 1}: <span style={{ fontWeight: 400 }}>{q.question}</span>
                            <span style={{ fontSize: '0.85em', color: '#64748b', fontWeight: 400 }}> ({q.points || 1} điểm)</span>
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4px 12px', paddingLeft: '8px' }}>
                            {(q.options || []).map((opt, oIdx) => {
                              const char = String.fromCharCode(65 + oIdx);
                              const isCorrect = q.correctAnswer === opt;
                              return (
                                <div key={oIdx} style={{ color: isCorrect ? '#b91c1c' : 'inherit' }}>
                                  <strong>{char}.</strong> {opt} {isCorrect && <span style={{ fontSize: '0.8em', fontWeight: 'bold' }}>(✓)</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* PHẦN II: TỰ LUẬN / THỰC HÀNH */}
                {generatedQuestions.filter(q => q.type !== 'choice' && q.type !== 'multiple_choice').length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '1.5px solid #1e3a8a', paddingBottom: '3px', margin: '24px 0 10px' }}>
                      PHẦN II. TỰ LUẬN / THỰC HÀNH TÌNH HUỐNG ({generatedQuestions.filter(q => q.type !== 'choice' && q.type !== 'multiple_choice').length} câu)
                    </h3>

                    {generatedQuestions
                      .filter(q => q.type !== 'choice' && q.type !== 'multiple_choice')
                      .map((q, idx) => (
                        <div key={q.id} style={{ marginBottom: '16px', lineHeight: 1.5 }}>
                          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>
                            Câu {generatedQuestions.filter(x => x.type === 'choice' || x.type === 'multiple_choice').length + idx + 1}: <span style={{ fontWeight: 400 }}>{q.question}</span>
                            <span style={{ fontSize: '0.85em', color: '#64748b', fontWeight: 400 }}> ({q.points || 2} điểm)</span>
                          </p>
                          {q.explanation && (
                            <div style={{ margin: '4px 0', padding: '6px 10px', background: '#f8fafc', borderLeft: '3px solid #3b82f6', fontSize: '0.9em', fontStyle: 'italic', color: '#334155' }}>
                              💡 <strong>Hướng dẫn chấm / Barem điểm:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                {/* BẢNG ĐÁP ÁN CUỐI ĐỀ */}
                <div style={{ marginTop: '28px', borderTop: '2px solid #cbd5e1', paddingTop: '16px' }}>
                  <h4 style={{ textAlign: 'center', margin: '0 0 8px', fontSize: '12pt', color: '#1e3a8a' }}>
                    BẢNG ĐÁP ÁN TRẮC NGHIỆM CHUẨN
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                    {generatedQuestions
                      .filter(q => q.type === 'choice' || q.type === 'multiple_choice')
                      .map((q, idx) => {
                        let ansChar = 'A';
                        if (q.options && q.correctAnswer) {
                          const cIdx = q.options.indexOf(q.correctAnswer);
                          if (cIdx >= 0) ansChar = String.fromCharCode(65 + cIdx);
                          else ansChar = q.correctAnswer;
                        }
                        return (
                          <div
                            key={q.id}
                            style={{
                              border: '1px solid #cbd5e1',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.88em',
                              background: '#f8fafc',
                              minWidth: '55px',
                              textAlign: 'center'
                            }}
                          >
                            <span style={{ color: '#64748b' }}>{idx + 1}:</span> <strong style={{ color: '#b91c1c' }}>{ansChar}</strong>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

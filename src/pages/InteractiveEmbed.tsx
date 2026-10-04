import { useState, useEffect, useRef } from 'react';
import { 
  Code, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  HelpCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  CheckCircle2, 
  XCircle,
  FileCode,
  Sparkles,
  Globe,
  ExternalLink,
  LogIn,
  Lock,
  Download,
  Loader2,
  Wand2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import './InteractiveEmbed.css';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizStop {
  id: string;
  timeSeconds: number; // Điểm dừng tính theo giây
  question: string;
  options: QuizOption[];
  explanation?: string;
  triggered?: boolean;
}

export type EmbedPlatformType = 'youtube' | 'canva' | 'drive' | 'generic';

export interface ParsedEmbed {
  type: EmbedPlatformType;
  platformName: string;
  iframeSrc: string;
  originalHtml: string;
}

export function parseEmbedInput(input: string): ParsedEmbed | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Kiểm tra nếu có thẻ <iframe ... src="...">
  const srcMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  let rawSrc = srcMatch ? srcMatch[1].trim() : '';

  // 2. Nếu không có thẻ iframe, trích xuất URL trực tiếp từ input
  if (!rawSrc) {
    // Tìm URL đầu tiên trong chuỗi (kể cả khi dán kèm văn bản hoặc dán trong dấu ngoặc)
    const urlMatch = trimmed.match(/(https?:\/\/[^\s"'<>]+)/i);
    if (urlMatch) {
      rawSrc = urlMatch[1];
    } else if (trimmed.startsWith('//')) {
      rawSrc = 'https:' + trimmed;
    } else if (
      trimmed.startsWith('drive.google.com') || 
      trimmed.startsWith('docs.google.com') || 
      trimmed.startsWith('youtube.com') || 
      trimmed.startsWith('youtu.be') || 
      trimmed.startsWith('canva.com')
    ) {
      rawSrc = 'https://' + trimmed;
    }
  }

  if (!rawSrc) return null;

  // Xóa các ký tự thừa ở cuối URL nếu có (dấu ngoặc, dấu chấm, phẩy)
  rawSrc = rawSrc.replace(/[.,;'">)]+$/, '');

  // 3. XỬ LÝ GOOGLE DRIVE & GOOGLE WORKSPACE
  // 3.1. Google Drive File (Video, PDF, Audio, v.v.)
  // Hỗ trợ các link:
  // - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // - https://drive.google.com/file/d/FILE_ID/preview
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID
  const driveFileMatch = rawSrc.match(/drive\.google\.com\/(?:file\/(?:u\/\d+\/)?d\/|open\?[^#]*id=|uc\?[^#]*id=)([a-zA-Z0-9_-]+)/i);
  if (driveFileMatch) {
    const fileId = driveFileMatch[1];
    const resKeyMatch = rawSrc.match(/[?&]resourcekey=([^&]+)/);
    const resKeyParam = resKeyMatch ? `?resourcekey=${resKeyMatch[1]}` : '';
    return {
      type: 'drive',
      platformName: 'Google Drive (Tệp / Video)',
      iframeSrc: `https://drive.google.com/file/d/${fileId}/preview${resKeyParam}`,
      originalHtml: trimmed
    };
  }

  // 3.2. Google Slides (Trình chiếu Google)
  const gSlidesMatch = rawSrc.match(/docs\.google\.com\/presentation\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/i);
  if (gSlidesMatch) {
    const presId = gSlidesMatch[1];
    return {
      type: 'drive',
      platformName: 'Google Slides (Trình chiếu)',
      iframeSrc: `https://docs.google.com/presentation/d/${presId}/embed?start=false&loop=false&delayms=3000`,
      originalHtml: trimmed
    };
  }

  // 3.3. Google Docs (Tài liệu văn bản)
  const gDocsMatch = rawSrc.match(/docs\.google\.com\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/i);
  if (gDocsMatch) {
    const docId = gDocsMatch[1];
    return {
      type: 'drive',
      platformName: 'Google Docs (Tài liệu)',
      iframeSrc: `https://docs.google.com/document/d/${docId}/preview`,
      originalHtml: trimmed
    };
  }

  // 3.4. Google Sheets (Bảng tính)
  const gSheetsMatch = rawSrc.match(/docs\.google\.com\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/i);
  if (gSheetsMatch) {
    const sheetId = gSheetsMatch[1];
    return {
      type: 'drive',
      platformName: 'Google Sheets (Bảng tính)',
      iframeSrc: `https://docs.google.com/spreadsheets/d/${sheetId}/preview`,
      originalHtml: trimmed
    };
  }

  // 3.5. Google Forms (Biểu mẫu)
  const gFormsMatch = rawSrc.match(/docs\.google\.com\/forms\/(?:d\/e\/|d\/)?([a-zA-Z0-9_-]+)/i);
  if (gFormsMatch) {
    const base = rawSrc.split('?')[0].replace(/\/viewform$/, '');
    return {
      type: 'drive',
      platformName: 'Google Forms (Biểu mẫu)',
      iframeSrc: `${base}/viewform?embedded=true`,
      originalHtml: trimmed
    };
  }

  // 4. XỬ LÝ YOUTUBE (Watch, Shorts, Live, Embed, youtu.be)
  let ytId = '';
  if (rawSrc.includes('youtube.com/watch')) {
    const m = rawSrc.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (m) ytId = m[1];
  } else if (rawSrc.includes('youtu.be/')) {
    const m = rawSrc.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (m) ytId = m[1];
  } else if (rawSrc.includes('youtube.com/shorts/')) {
    const m = rawSrc.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (m) ytId = m[1];
  } else if (rawSrc.includes('youtube.com/live/')) {
    const m = rawSrc.match(/youtube\.com\/live\/([a-zA-Z0-9_-]+)/);
    if (m) ytId = m[1];
  } else if (rawSrc.includes('youtube.com/embed/')) {
    const m = rawSrc.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (m) ytId = m[1];
  }

  if (ytId) {
    return {
      type: 'youtube',
      platformName: 'YouTube Video',
      iframeSrc: `https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=1&mute=0`,
      originalHtml: trimmed
    };
  }

  // 5. XỬ LÝ CANVA (Thuyết trình / Video)
  if (rawSrc.includes('canva.com/design/')) {
    const cleanUrl = rawSrc.split('?')[0].replace(/\/watch$/, '').replace(/\/view$/, '');
    let finalCanva = `${cleanUrl}/watch?embed`;
    if (!finalCanva.includes('autoplay=1')) {
      finalCanva += (finalCanva.includes('?') ? '&' : '?') + 'autoplay=1&auto=1';
    }
    return {
      type: 'canva',
      platformName: 'Canva Presentation',
      iframeSrc: finalCanva,
      originalHtml: trimmed
    };
  }

  // 6. XỬ LÝ VIMEO
  const vimeoMatch = rawSrc.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch) {
    return {
      type: 'generic',
      platformName: 'Vimeo Video',
      iframeSrc: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      originalHtml: trimmed
    };
  }

  // 7. XỬ LÝ LOOM
  const loomMatch = rawSrc.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9_-]+)/i);
  if (loomMatch) {
    return {
      type: 'generic',
      platformName: 'Loom Video',
      iframeSrc: `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1`,
      originalHtml: trimmed
    };
  }

  // 8. XỬ LÝ WORDWALL
  const wwMatch = rawSrc.match(/wordwall\.net\/(?:resource|play|embed)\/([0-9]+)/i);
  if (wwMatch) {
    return {
      type: 'generic',
      platformName: 'Wordwall Trò Chơi',
      iframeSrc: `https://wordwall.net/embed/${wwMatch[1]}`,
      originalHtml: trimmed
    };
  }

  // 9. XỬ LÝ GENIALLY
  const genialMatch = rawSrc.match(/view\.genial\.ly\/([a-zA-Z0-9_-]+)/i);
  if (genialMatch) {
    return {
      type: 'generic',
      platformName: 'Genially Interactive',
      iframeSrc: `https://view.genial.ly/${genialMatch[1]}`,
      originalHtml: trimmed
    };
  }

  // 10. BẤT KỲ ĐƯỜNG DẪN / TRANG WEB NÀO KHÁC (Generic Web / Direct Video)
  let genericSrc = rawSrc;
  if (!genericSrc.startsWith('http://') && !genericSrc.startsWith('https://')) {
    genericSrc = 'https://' + genericSrc;
  }

  const isVideoDirect = /\.(mp4|webm|ogg)(\?.*)?$/i.test(genericSrc);
  const platformName = srcMatch 
    ? 'Mã Nhúng Iframe Tùy Chọn' 
    : isVideoDirect 
      ? 'Tệp Video Trực Tiếp' 
      : 'Liên Kết Trang Web / Iframe';

  return {
    type: 'generic',
    platformName,
    iframeSrc: genericSrc,
    originalHtml: trimmed
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseFloat(parts[1]) || 0;
    return Math.max(0, Math.floor(m * 60 + s));
  }
  return Math.max(0, parseInt(timeStr, 10) || 0);
}

export default function InteractiveEmbed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  // Input ban đầu
  const defaultSample = `<div style="position: relative; width: 100%; height: 0; padding-top: 56.2500%;
 padding-bottom: 0; box-shadow: 0 2px 8px 0 rgba(63,69,81,0.16); margin-top: 1.6em; margin-bottom: 0.9em; overflow: hidden;
 border-radius: 8px; will-change: transform;">
  <iframe loading="lazy" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; border: none; padding: 0;margin: 0;"
    src="https://www.canva.com/design/DAHW2VClI4g/_6rh4Vt8XaD3VFE1PMJrew/watch?embed" allowfullscreen="allowfullscreen" allow="fullscreen">
  </iframe>
</div>`;

  const [rawEmbedCode, setRawEmbedCode] = useState(defaultSample);
  const [parsedEmbed, setParsedEmbed] = useState<ParsedEmbed | null>(() => parseEmbedInput(defaultSample));

  // Danh sách câu hỏi dừng
  const [quizStops, setQuizStops] = useState<QuizStop[]>([
    {
      id: 'stop-1',
      timeSeconds: 15,
      question: 'Phím tắt nào dùng để lưu văn bản trong Microsoft Word?',
      options: [
        { id: 'opt-1-1', text: 'Ctrl + S', isCorrect: true },
        { id: 'opt-1-2', text: 'Ctrl + C', isCorrect: false },
        { id: 'opt-1-3', text: 'Ctrl + P', isCorrect: false },
        { id: 'opt-1-4', text: 'Ctrl + V', isCorrect: false },
      ],
      explanation: 'Tổ hợp phím Ctrl + S (Save) dùng để lưu lại tệp văn bản hiện hành.'
    }
  ]);

  // Player preview & timer state
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeQuiz, setActiveQuiz] = useState<QuizStop | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [answeredStops, setAnsweredStops] = useState<Set<string>>(new Set());

  // Export code state
  const [exportMode, setExportMode] = useState<'player-iframe' | 'standard' | 'html5'>('player-iframe');
  const [exportedCode, setExportedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [hasStartedPresentation, setHasStartedPresentation] = useState(false);

  // Editing stop modal / form
  const [editingStop, setEditingStop] = useState<QuizStop | null>(null);
  const [timeInput, setTimeInput] = useState('00:15');

  // Ref cho iframe và timer interval
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(true);
  const currentTimeRef = useRef(0);
  const quizStopsRef = useRef(quizStops);
  const answeredStopsRef = useRef(answeredStops);
  const activeQuizRef = useRef<QuizStop | null>(null);
  const ytPlayerRef = useRef<any>(null);

  // Đồng bộ refs với states
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    quizStopsRef.current = quizStops;
  }, [quizStops]);

  useEffect(() => {
    answeredStopsRef.current = answeredStops;
  }, [answeredStops]);

  useEffect(() => {
    activeQuizRef.current = activeQuiz;
  }, [activeQuiz]);

  // Xử lý nạp YouTube Iframe API nếu là YouTube
  useEffect(() => {
    if (parsedEmbed?.type === 'youtube') {
      if (!(window as any).YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }
  }, [parsedEmbed]);

  // Timer đồng hồ theo dõi tiến trình liên tục
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!isPlayingRef.current || activeQuizRef.current) return;

      const next = currentTimeRef.current + 1;
      currentTimeRef.current = next;
      setCurrentTime(next);

      // Kiểm tra xem có điểm dừng nào tại hoặc trước mốc này mà chưa trả lời không
      const foundStop = quizStopsRef.current.find(
        (stop) => next >= stop.timeSeconds && !answeredStopsRef.current.has(stop.id)
      );

      if (foundStop) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setActiveQuiz(foundStop);
        activeQuizRef.current = foundStop;
        setSelectedOptionId(null);
        setAnswerStatus('idle');

        // Freeze Canva iframe in live preview
        const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement | null;
        if (iframe) {
          if (parsedEmbed?.type === 'canva') {
            iframe.setAttribute('data-original-src', iframe.src);
            iframe.src = 'about:blank';
          }
          try {
            iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pause' }), '*');
            iframe.contentWindow?.postMessage(JSON.stringify({ method: 'pause' }), '*');
            iframe.contentWindow?.postMessage('pause', '*');
          } catch (e) {}
        }

        // Nếu là YouTube thì pause qua API
        if (ytPlayerRef.current?.pauseVideo) {
          try { ytPlayerRef.current.pauseVideo(); } catch (e) {}
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [parsedEmbed]);

  // Tự động phân tích và nạp mã nhúng khi người dùng gõ / dán ở Bước 1
  useEffect(() => {
    const parsed = parseEmbedInput(rawEmbedCode);
    if (parsed) {
      setParsedEmbed(parsed);
      setHasStartedPresentation(false);
    }
  }, [rawEmbedCode]);

  // Cập nhật thủ công khi bấm nút Nạp Khung Trình Chiếu ở Bước 1
  const handleApplyEmbed = () => {
    const parsed = parseEmbedInput(rawEmbedCode);
    if (!parsed) {
      showToast('Mã nhúng không hợp lệ! Vui lòng dán thẻ iframe Canva, YouTube hoặc URL.', 'error');
      return;
    }
    setParsedEmbed(parsed);
    setIsPlaying(true);
    isPlayingRef.current = true;
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setActiveQuiz(null);
    activeQuizRef.current = null;
    setAnsweredStops(new Set());
    answeredStopsRef.current = new Set();
    setHasStartedPresentation(false);
    
    // Tạo lại mã xuất tương ứng ngay lập tức
    const code = exportMode === 'standard' ? generateStandardHtmlCode() : generateHtml5AdvancedCode();
    if (code) setExportedCode(code);

    showToast('Đã nạp mã nhúng mới và cập nhật toàn bộ Bước 2, Bước 3 thành công!', 'success');
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (activeQuiz) return;
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    isPlayingRef.current = nextState;
    if (nextState && !hasStartedPresentation) {
      setHasStartedPresentation(true);
    }
    if (parsedEmbed?.type === 'youtube' && ytPlayerRef.current) {
      try {
        if (nextState) ytPlayerRef.current.playVideo();
        else ytPlayerRef.current.pauseVideo();
      } catch (e) {}
    }
  };

  const handleResetTimeline = () => {
    setIsPlaying(true);
    isPlayingRef.current = true;
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setActiveQuiz(null);
    activeQuizRef.current = null;
    setAnsweredStops(new Set());
    answeredStopsRef.current = new Set();
    setSelectedOptionId(null);
    setAnswerStatus('idle');
    setHasStartedPresentation(true);

    // Reload iframe để trở về đầu bài giảng
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement | null;
    if (iframe && parsedEmbed) {
      iframe.src = parsedEmbed.iframeSrc;
    }

    if (parsedEmbed?.type === 'youtube' && ytPlayerRef.current?.seekTo) {
      try {
        ytPlayerRef.current.seekTo(0, true);
        ytPlayerRef.current.playVideo();
      } catch (e) {}
    }
  };

  // Kiểm tra câu trả lời
  const handleCheckAnswer = () => {
    if (!activeQuiz || !selectedOptionId) {
      showToast('Vui lòng chọn một đáp án!', 'warning');
      return;
    }

    const selected = activeQuiz.options.find(o => o.id === selectedOptionId);
    if (selected?.isCorrect) {
      setAnswerStatus('correct');
      showToast('Chính xác! Bạn có thể tiếp tục xem bài giảng.', 'success');
      setTimeout(() => {
        const nextSet = new Set(answeredStopsRef.current).add(activeQuiz.id);
        setAnsweredStops(nextSet);
        answeredStopsRef.current = nextSet;
        setActiveQuiz(null);
        activeQuizRef.current = null;
        setSelectedOptionId(null);
        setAnswerStatus('idle');
        setIsPlaying(true);
        isPlayingRef.current = true;

        const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement | null;
        if (iframe) {
          if (parsedEmbed?.iframeSrc) {
            const originalSrc = iframe.getAttribute('data-original-src') || parsedEmbed.iframeSrc;
            if (iframe.src.includes('about:blank')) {
              iframe.src = originalSrc;
            }
          }
          if (iframe.contentWindow) {
            try {
              iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'play' }), '*');
              iframe.contentWindow.postMessage(JSON.stringify({ method: 'play' }), '*');
              iframe.contentWindow.postMessage('play', '*');
            } catch (e) {}
          }
        }

        if (parsedEmbed?.type === 'youtube' && ytPlayerRef.current?.playVideo) {
          try { ytPlayerRef.current.playVideo(); } catch (e) {}
        }
      }, 1500);
    } else {
      setAnswerStatus('wrong');
      showToast('Chưa chính xác! Vui lòng chọn lại đáp án đúng để tiếp tục.', 'error');
    }
  };

  // Thêm / Lưu câu hỏi
  const handleOpenAddStop = () => {
    const newStop: QuizStop = {
      id: `stop-${Date.now()}`,
      timeSeconds: currentTime > 0 ? currentTime : 30,
      question: '',
      options: [
        { id: `opt-${Date.now()}-1`, text: '', isCorrect: true },
        { id: `opt-${Date.now()}-2`, text: '', isCorrect: false },
        { id: `opt-${Date.now()}-3`, text: '', isCorrect: false },
        { id: `opt-${Date.now()}-4`, text: '', isCorrect: false }
      ],
      explanation: ''
    };
    setEditingStop(newStop);
    setTimeInput(formatTime(newStop.timeSeconds));
  };

  const handleEditStop = (stop: QuizStop) => {
    setEditingStop(JSON.parse(JSON.stringify(stop)));
    setTimeInput(formatTime(stop.timeSeconds));
  };

  const handleDeleteStop = (id: string) => {
    setQuizStops(prev => prev.filter(s => s.id !== id));
    showToast('Đã xóa điểm dừng câu hỏi!', 'info');
  };

  const handleSaveStop = () => {
    if (!editingStop) return;
    if (!editingStop.question.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi!', 'warning');
      return;
    }
    const validOptions = editingStop.options.filter(o => o.text.trim().length > 0);
    if (validOptions.length < 2) {
      showToast('Cần ít nhất 2 phương án trả lời!', 'warning');
      return;
    }
    const hasCorrect = validOptions.some(o => o.isCorrect);
    if (!hasCorrect) {
      showToast('Vui lòng chọn ít nhất 1 đáp án đúng!', 'warning');
      return;
    }

    const seconds = parseTimeToSeconds(timeInput);
    const updated: QuizStop = {
      ...editingStop,
      timeSeconds: seconds,
      options: validOptions
    };

    setQuizStops(prev => {
      const exists = prev.some(s => s.id === updated.id);
      let list = exists ? prev.map(s => s.id === updated.id ? updated : s) : [...prev, updated];
      return list.sort((a, b) => a.timeSeconds - b.timeSeconds);
    });

    setEditingStop(null);
    showToast('Đã lưu câu hỏi trắc nghiệm thành công!', 'success');
  };

  // Tạo URL chạy Player tương tác độc lập (Mã hóa UTF-8 an toàn)
  const getPlayerUrl = () => {
    if (!parsedEmbed) return '';
    const payload = JSON.stringify({
      src: parsedEmbed.iframeSrc,
      type: parsedEmbed.type,
      stops: quizStops
    });
    // UTF-8 to Base64
    const utf8Bytes = new TextEncoder().encode(payload);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 = btoa(binary);
    return `${window.location.origin}/embed-player#${b64}`;
  };

  // AI Gen Quiz state
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiTopicPrompt, setAiTopicPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  // Tạo tệp HTML độc lập chạy offline / tải lên LMS như SCORM/Website (Giống tienich.ite.id.vn)
  const generateStandaloneHtmlFile = () => {
    if (!parsedEmbed) return '';
    const configData = JSON.stringify({
      src: parsedEmbed.iframeSrc,
      type: parsedEmbed.type,
      stops: quizStops,
      title: 'Bài Giảng Tương Tác E-Learning LMS'
    });

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bài Giảng Tương Tác LMS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
    }
    .player-container {
      width: 100%;
      max-width: 980px;
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 35px -10px rgba(0,0,0,0.6);
      position: relative;
    }
    .media-wrap {
      position: relative;
      width: 100%;
      padding-top: 56.25%;
      background: #000;
    }
    .media-wrap iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      transition: opacity 0.25s ease;
    }
    .quiz-overlay {
      display: none;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.95);
      z-index: 9999;
      padding: 20px;
      overflow-y: auto;
      backdrop-filter: blur(8px);
    }
    .quiz-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      max-width: 580px;
      margin: 15px auto;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      animation: popIn 0.25s ease-out;
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.94); }
      to { opacity: 1; transform: scale(1); }
    }
    .badge {
      display: inline-block;
      background: #ef4444;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .q-title {
      font-size: 17px;
      font-weight: 700;
      margin: 14px 0 16px;
      color: #f1f5f9;
      line-height: 1.45;
    }
    .opt-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      margin-bottom: 8px;
      background: #0f172a;
      border: 1.5px solid #334155;
      border-radius: 8px;
      cursor: pointer;
      color: #cbd5e1;
      font-size: 14.5px;
      transition: all 0.15s ease;
    }
    .opt-item:hover {
      background: #1e293b;
      border-color: #64748b;
    }
    .opt-item.selected {
      background: rgba(37, 99, 235, 0.2);
      border-color: #3b82f6;
      color: #60a5fa;
      font-weight: 600;
    }
    .opt-letter {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #334155;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
    .opt-item.selected .opt-letter {
      background: #2563eb;
    }
    .feedback-box {
      display: none;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 13.5px;
      margin-bottom: 14px;
      line-height: 1.4;
    }
    .feedback-box.correct {
      background: rgba(22, 163, 74, 0.2);
      border: 1px solid #16a34a;
      color: #4ade80;
    }
    .feedback-box.wrong {
      background: rgba(220, 38, 38, 0.2);
      border: 1px solid #dc2626;
      color: #f87171;
    }
    .submit-btn {
      width: 100%;
      padding: 12px;
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .submit-btn:hover {
      background: #1d4ed8;
    }
    .control-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: #0f172a;
      border-top: 1px solid #1e293b;
      font-size: 13.5px;
    }
    .left-ctrl {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-act {
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-play { background: #ef4444; color: #fff; }
    .btn-reset { background: #334155; color: #e2e8f0; }
    .clock-display {
      font-weight: 700;
      color: #38bdf8;
      margin-left: 8px;
    }
  </style>
</head>
<body>
  <div class="player-container">
    <div class="media-wrap">
      <iframe id="main-frame" src="${parsedEmbed.iframeSrc}" allowfullscreen allow="fullscreen; autoplay; encrypted-media"></iframe>
      
      <div id="quiz-overlay" class="quiz-overlay">
        <div class="quiz-card">
          <span class="badge">ĐIỂM DỪNG BẮT BUỘC</span>
          <span id="time-badge" style="font-size: 12px; color: #94a3b8; margin-left: 8px; font-weight: 600;"></span>
          <div id="q-title" class="q-title"></div>
          <div id="opts-container"></div>
          <div id="feedback" class="feedback-box"></div>
          <button id="sub-btn" class="submit-btn" type="button">Xác nhận đáp án</button>
        </div>
      </div>
    </div>

    <div class="control-bar">
      <div class="left-ctrl">
        <button id="play-btn" class="btn-act btn-play" type="button">Tạm Dừng</button>
        <button id="reset-btn" class="btn-act btn-reset" type="button">Xem Lại</button>
        <span class="clock-display">⏱ <span id="clock">00:00</span></span>
      </div>
      <div style="color: #94a3b8;">
        Có <strong>${quizStops.length}</strong> câu hỏi kiểm tra
      </div>
    </div>
  </div>

  <script>
    (function() {
      const DATA = ${configData};
      let curr = 0;
      let playing = true;
      let curStop = null;
      let selOpt = null;
      const answered = new Set();
      let timer = null;

      const frame = document.getElementById('main-frame');
      const overlay = document.getElementById('quiz-overlay');
      const timeBadge = document.getElementById('time-badge');
      const qTitle = document.getElementById('q-title');
      const optsContainer = document.getElementById('opts-container');
      const feedback = document.getElementById('feedback');
      const subBtn = document.getElementById('sub-btn');
      const playBtn = document.getElementById('play-btn');
      const resetBtn = document.getElementById('reset-btn');
      const clock = document.getElementById('clock');

      function fmt(s) {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
      }

      function sendMsg(cmd) {
        if (!frame || !frame.contentWindow) return;
        try {
          frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd }), '*');
          frame.contentWindow.postMessage(JSON.stringify({ method: cmd }), '*');
          frame.contentWindow.postMessage(cmd, '*');
        } catch (e) {}
      }

      function checkStops(t) {
        for (let i = 0; i < DATA.stops.length; i++) {
          const s = DATA.stops[i];
          if (t >= s.timeSeconds && !answered.has(s.id)) {
            pauseVideo();
            triggerQuiz(s);
            return true;
          }
        }
        return false;
      }

      function doTick() {
        if (!playing || curStop) return;
        curr++;
        clock.innerText = fmt(curr);
        checkStops(curr);
      }

      function playVideo() {
        if (curStop) return;
        playing = true;
        playBtn.innerText = 'Tạm Dừng';
        playBtn.style.background = '#ef4444';
        sendMsg('play');
        sendMsg('playVideo');
      }

      function pauseVideo() {
        playing = false;
        playBtn.innerText = 'Tiếp Tục';
        playBtn.style.background = '#2563eb';
        sendMsg('pause');
        sendMsg('pauseVideo');
      }

      function triggerQuiz(stop) {
        curStop = stop;
        selOpt = null;
        timeBadge.innerText = 'Mốc: ' + fmt(stop.timeSeconds);
        qTitle.innerText = stop.question;
        feedback.style.display = 'none';
        subBtn.disabled = false;
        subBtn.innerText = 'Xác nhận đáp án';
        subBtn.style.background = '#2563eb';

        optsContainer.innerHTML = '';
        stop.options.forEach((opt, idx) => {
          const div = document.createElement('div');
          div.className = 'opt-item';
          div.innerHTML = '<span class="opt-letter">' + String.fromCharCode(65 + idx) + '</span><span>' + opt.text + '</span>';
          div.onclick = function() {
            selOpt = opt.id;
            const items = optsContainer.querySelectorAll('.opt-item');
            items.forEach(it => it.classList.remove('selected'));
            div.classList.add('selected');
          };
          optsContainer.appendChild(div);
        });

        overlay.style.display = 'block';
        frame.style.pointerEvents = 'none';
        frame.style.opacity = '0.15';
        if (DATA.type === 'canva') {
          frame.setAttribute('data-orig-src', frame.src);
          frame.src = 'about:blank';
        }
      }

      subBtn.onclick = function() {
        if (!curStop || !selOpt) {
          alert('Vui lòng chọn một phương án trả lời!');
          return;
        }
        const found = curStop.options.find(o => o.id === selOpt);
        if (found && found.isCorrect) {
          feedback.className = 'feedback-box correct';
          feedback.style.display = 'block';
          feedback.innerText = '✓ Chính xác! ' + (curStop.explanation || '');
          subBtn.disabled = true;
          subBtn.style.background = '#16a34a';
          subBtn.innerText = 'Đúng rồi! Đang mở tiếp bài học...';
          answered.add(curStop.id);
          setTimeout(() => {
            overlay.style.display = 'none';
            frame.style.pointerEvents = 'auto';
            frame.style.opacity = '1';
            if (frame.src.indexOf('about:blank') !== -1) {
              frame.src = frame.getAttribute('data-orig-src') || DATA.src;
            }
            curStop = null;
            playVideo();
          }, 1500);
        } else {
          feedback.className = 'feedback-box wrong';
          feedback.style.display = 'block';
          feedback.innerText = '✕ Sai rồi! Vui lòng chọn lại đáp án đúng để tiếp tục.';
        }
      };

      playBtn.onclick = function() {
        if (playing) pauseVideo();
        else playVideo();
      };

      resetBtn.onclick = function() {
        curr = 0;
        clock.innerText = '00:00';
        curStop = null;
        answered.clear();
        overlay.style.display = 'none';
        frame.style.pointerEvents = 'auto';
        frame.style.opacity = '1';
        frame.src = DATA.src;
        playVideo();
      };

      window.addEventListener('message', function(ev) {
        if (curStop) return;
        try {
          const d = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
          if (d && d.event === 'infoDelivery' && d.info && typeof d.info.currentTime === 'number') {
            const ytSec = Math.floor(d.info.currentTime);
            if (ytSec > 0 && Math.abs(ytSec - curr) > 1) {
              curr = ytSec;
              clock.innerText = fmt(curr);
              checkStops(curr);
            }
          }
        } catch (e) {}
      });

      timer = setInterval(doTick, 1000);
    })();
  </script>
</body>
</html>`;
  };

  // Tải file HTML về máy tính
  const handleDownloadHtmlFile = () => {
    const htmlContent = generateStandaloneHtmlFile();
    if (!htmlContent) {
      showToast('Chưa có nội dung mã nhúng để xuất file!', 'error');
      return;
    }
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bai-giang-tuong-tac-lms-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã tải tệp HTML bài giảng tương tác thành công!', 'success');
  };

  // Tự động sinh câu hỏi bằng AI Co-pilot từ nội dung / chủ đề
  const handleAiGenerateQuiz = async (topicText: string) => {
    if (!topicText.trim()) {
      showToast('Vui lòng nhập chủ đề hoặc đoạn trích bài giảng để AI phân tích!', 'warning');
      return;
    }

    setIsAiGenerating(true);
    try {
      const promptText = `Bạn là trợ lý soạn bài giảng LMS giáo dục chuyên nghiệp.
Hãy đọc nội dung/chủ đề sau: "${topicText.trim()}".
Tạo DUY NHẤT 1 câu hỏi trắc nghiệm kiểm tra độ hiểu bài, gồm 4 lựa chọn A, B, C, D (trong đó chỉ có 1 phương án đúng), và 1 câu giải thích ngắn.
BẮT BUỘC trả về định dạng JSON thuần túy (không kèm markdown \`\`\`json) với cấu trúc sau:
{
  "question": "Nội dung câu hỏi?",
  "options": [
    { "text": "Phương án 1", "isCorrect": true },
    { "text": "Phương án 2", "isCorrect": false },
    { "text": "Phương án 3", "isCorrect": false },
    { "text": "Phương án 4", "isCorrect": false }
  ],
  "explanation": "Lời giải thích ngắn gọn vì sao đáp án đó đúng."
}`;

      // Gọi API AI
      const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(promptText)}?json=true`);
      if (!res.ok) throw new Error('Máy chủ AI không phản hồi');
      
      const rawText = await res.text();
      let parsedJson: any = null;
      try {
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedJson = JSON.parse(cleaned);
      } catch (err) {
        // Fallback match JSON
        const m = rawText.match(/\{[\s\S]*\}/);
        if (m) {
          parsedJson = JSON.parse(m[0]);
        }
      }

      if (parsedJson && parsedJson.question && Array.isArray(parsedJson.options) && parsedJson.options.length >= 2) {
        const newStop: QuizStop = {
          id: `stop-${Date.now()}`,
          timeSeconds: currentTime > 0 ? currentTime : 30,
          question: parsedJson.question,
          options: parsedJson.options.map((opt: any, idx: number) => ({
            id: `opt-${Date.now()}-${idx + 1}`,
            text: opt.text || `Lựa chọn ${idx + 1}`,
            isCorrect: !!opt.isCorrect
          })),
          explanation: parsedJson.explanation || ''
        };

        // Đảm bảo ít nhất 1 đáp án đúng
        if (!newStop.options.some(o => o.isCorrect)) {
          newStop.options[0].isCorrect = true;
        }

        setEditingStop(newStop);
        setTimeInput(formatTime(newStop.timeSeconds));
        setShowAiModal(false);
        setAiTopicPrompt('');
        showToast('AI đã tạo câu hỏi trắc nghiệm thành công!', 'success');
      } else {
        throw new Error('Dữ liệu AI trả về không đúng cấu trúc trắc nghiệm');
      }
    } catch (e: any) {
      console.error(e);
      // Fallback câu hỏi thông minh nếu mạng gặp trục trặc
      const fallbackStop: QuizStop = {
        id: `stop-${Date.now()}`,
        timeSeconds: currentTime > 0 ? currentTime : 30,
        question: `Nội dung cốt lõi của phần "${topicText.slice(0, 50)}..." là gì?`,
        options: [
          { id: `opt-${Date.now()}-1`, text: 'Nắm vững kiến thức trọng tâm và thao tác mẫu', isCorrect: true },
          { id: `opt-${Date.now()}-2`, text: 'Bỏ qua bước thực hành', isCorrect: false },
          { id: `opt-${Date.now()}-3`, text: 'Không cần ghi nhớ kết quả', isCorrect: false },
          { id: `opt-${Date.now()}-4`, text: 'Không liên quan đến nội dung bài', isCorrect: false },
        ],
        explanation: 'Học viên cần theo dõi sát các bước hướng dẫn để áp dụng chính xác.'
      };
      setEditingStop(fallbackStop);
      setTimeInput(formatTime(fallbackStop.timeSeconds));
      setShowAiModal(false);
      showToast('Đã tạo câu hỏi theo gợi ý bài giảng!', 'success');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // 0. Tạo mã Iframe Player Chuẩn LMS (Khuyên dùng - 100% không bị lọc script hay lỗi thời gian)
  const generateIframePlayerCode = () => {
    const playerUrl = getPlayerUrl();
    if (!playerUrl) return '';

    return `<!-- MA NHUNG TRINH PHAT TUONG TAC LMS / E-LEARNING (100% HOAT DONG) -->
<div style="position:relative;width:100%;max-width:960px;margin:15px auto;padding-top:56.25%;background:#000000;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
  <iframe 
    src="${playerUrl}" 
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;margin:0;padding:0;" 
    allow="fullscreen; autoplay; encrypted-media" 
    allowfullscreen="allowfullscreen">
  </iframe>
</div>
<!-- KET THUC MA NHUNG -->`;
  };

  // 1. Tạo mã HTML Thường (Tương thích 100% Elearning, Moodle, CKEditor, LMS trường học)
  const generateStandardHtmlCode = () => {
    if (!parsedEmbed) return;
    const uid = Math.random().toString(36).substring(2, 8);
    const embedJson = JSON.stringify({
      src: parsedEmbed.iframeSrc,
      type: parsedEmbed.type,
      stops: quizStops
    });

    return `<!-- MA NHUNG TUONG TAC LMS / E-LEARNING (CHUAN HTML TUONG THICH) -->
<div id="elearn-box-${uid}" style="position:relative;width:100%;max-width:960px;margin:20px auto;font-family:Arial,Helvetica,sans-serif;color:#1e293b;box-sizing:border-box;">
  <div style="position:relative;width:100%;padding-top:56.25%;background:#000000;border:1px solid #cbd5e1;overflow:hidden;">
    <iframe id="elearn-frame-${uid}" src="${parsedEmbed.iframeSrc}"
      style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;margin:0;padding:0;"
      allowfullscreen="allowfullscreen" allow="fullscreen; autoplay; encrypted-media">
    </iframe>

    <!-- Khung cau hoi dung lai -->
    <div id="elearn-overlay-${uid}" style="display:none;position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.92);z-index:99999;box-sizing:border-box;padding:15px;overflow-y:auto;">
      <div style="background:#ffffff;margin:20px auto;max-width:540px;padding:24px;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
        <div style="margin-bottom:12px;">
          <span style="background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:bold;padding:4px 8px;border-radius:4px;text-transform:uppercase;">Câu hỏi dừng lại</span>
          <span id="elearn-time-badge-${uid}" style="font-size:13px;color:#64748b;margin-left:8px;font-weight:bold;"></span>
        </div>
        <div id="elearn-qtitle-${uid}" style="font-size:16px;font-weight:bold;color:#0f172a;line-height:1.4;margin-bottom:16px;"></div>
        <div id="elearn-opts-${uid}" style="margin-bottom:16px;"></div>
        <div id="elearn-alert-${uid}" style="display:none;padding:10px;margin-bottom:14px;border-radius:4px;font-size:14px;"></div>
        <button id="elearn-subbtn-${uid}" type="button" style="width:100%;background:#2563eb;color:#ffffff;border:none;padding:12px;font-size:15px;font-weight:bold;border-radius:6px;cursor:pointer;">
          Xác nhận câu trả lời
        </button>
      </div>
    </div>
  </div>

  <div style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;padding:10px 14px;border:1px solid #cbd5e1;border-top:0;">
    <div style="display:flex;align-items:center;gap:10px;">
      <button id="elearn-playbtn-${uid}" type="button" style="background:#ef4444;color:#ffffff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:13px;">
        Tạm Dừng
      </button>
      <button id="elearn-resetbtn-${uid}" type="button" style="background:#e2e8f0;color:#334155;border:1px solid #cbd5e1;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px;">
        Xem Lại Từ Đầu
      </button>
      <span style="font-size:14px;font-weight:bold;color:#0f172a;margin-left:6px;">
        Thời gian: <span id="elearn-clock-${uid}">00:00</span>
      </span>
    </div>
    <div style="font-size:13px;color:#64748b;">
      Có <strong>${quizStops.length}</strong> điểm dừng kiểm tra
    </div>
  </div>

  <!-- Kích hoạt khởi động chắc chắn không bị LMS loại bỏ -->
  <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" style="display:none;" onload="if(!window.initElearn_${uid}){window.initElearn_${uid}=true;(function(){
    var cfg=${embedJson};
    var curr=0;
    var playing=true;
    var curStop=null;
    var selOpt=null;
    var answered={};
    var timer=null;

    var frame=document.getElementById('elearn-frame-${uid}');
    var overlay=document.getElementById('elearn-overlay-${uid}');
    var qTitle=document.getElementById('elearn-qtitle-${uid}');
    var optsBox=document.getElementById('elearn-opts-${uid}');
    var alertBox=document.getElementById('elearn-alert-${uid}');
    var subBtn=document.getElementById('elearn-subbtn-${uid}');
    var playBtn=document.getElementById('elearn-playbtn-${uid}');
    var resetBtn=document.getElementById('elearn-resetbtn-${uid}');
    var clock=document.getElementById('elearn-clock-${uid}');
    var timeBadge=document.getElementById('elearn-time-badge-${uid}');

    function fmt(s){
      var m=Math.floor(s/60);
      var sec=Math.floor(s%60);
      return (m<10?'0':'')+m+':'+(sec<10?'0':'')+sec;
    }

    function postMsg(cmd){
      if(!frame||!frame.contentWindow)return;
      try{
        frame.contentWindow.postMessage(JSON.stringify({event:'command',func:cmd}),'*');
        frame.contentWindow.postMessage(JSON.stringify({method:cmd}),'*');
        frame.contentWindow.postMessage(cmd,'*');
      }catch(e){}
    }

    function checkStops(t){
      for(var i=0;i<cfg.stops.length;i++){
        var s=cfg.stops[i];
        if(t>=s.timeSeconds&&!answered[s.id]){
          pause();
          showQuiz(s);
          return true;
        }
      }
      return false;
    }

    function doTick(){
      if(!playing||curStop)return;
      curr++;
      if(clock)clock.innerText=fmt(curr);
      checkStops(curr);
      if(cfg.type==='youtube'&&frame&&frame.contentWindow){
        try{frame.contentWindow.postMessage(JSON.stringify({event:'listening'}),'*');}catch(e){}
      }
    }

    function play(){
      if(curStop)return;
      playing=true;
      if(playBtn){
        playBtn.innerText='Tạm Dừng';
        playBtn.style.background='#ef4444';
      }
      postMsg('play');
      postMsg('playVideo');
      if(!timer)timer=setInterval(doTick,1000);
    }

    function pause(){
      playing=false;
      if(playBtn){
        playBtn.innerText='Tiếp Tục';
        playBtn.style.background='#2563eb';
      }
      postMsg('pause');
      postMsg('pauseVideo');
    }

    function showQuiz(stop){
      curStop=stop;
      selOpt=null;
      if(timeBadge)timeBadge.innerText='Mốc: '+fmt(stop.timeSeconds);
      if(qTitle)qTitle.innerText=stop.question;
      if(alertBox)alertBox.style.display='none';

      if(optsBox){
        optsBox.innerHTML='';
        for(var j=0;j<stop.options.length;j++){
          (function(opt,idx){
            var label=String.fromCharCode(65+idx);
            var div=document.createElement('div');
            div.style.cssText='padding:10px 12px;margin-bottom:8px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:6px;cursor:pointer;font-size:14px;';
            div.innerHTML='<strong>'+label+'.</strong> '+opt.text;
            div.onclick=function(){
              selOpt=opt.id;
              var children=optsBox.children;
              for(var c=0;c<children.length;c++){
                children[c].style.background='#f8fafc';
                children[c].style.borderColor='#cbd5e1';
                children[c].style.color='#1e293b';
              }
              div.style.background='#eff6ff';
              div.style.borderColor='#2563eb';
              div.style.color='#1d4ed8';
            };
            optsBox.appendChild(div);
          })(stop.options[j],j);
        }
      }

      if(subBtn){
        subBtn.innerText='Xác nhận câu trả lời';
        subBtn.style.background='#2563eb';
        subBtn.disabled=false;
      }
      if(overlay)overlay.style.display='block';
      if(frame){
        frame.style.pointerEvents='none';
        frame.style.opacity='0.2';
        if(cfg.type==='canva'){
          frame.setAttribute('data-orig-src', frame.src);
          frame.src='about:blank';
        }
      }
    }

    window.addEventListener('message',function(ev){
      if(curStop)return;
      try{
        var d=typeof ev.data==='string'?JSON.parse(ev.data):ev.data;
        if(!d)return;
        if(d.event==='infoDelivery'&&d.info){
          if(typeof d.info.currentTime==='number'){
            var ytSec=Math.floor(d.info.currentTime);
            if(ytSec>0&&Math.abs(ytSec-curr)>1){
              curr=ytSec;
              if(clock)clock.innerText=fmt(curr);
              checkStops(curr);
            }
          }
          if(d.info.playerState===1&&!playing)play();
          else if(d.info.playerState===2&&playing)pause();
        }
        if((d.event==='play'||d.type==='play'||d.status==='playing')&&!playing)play();
        else if((d.event==='pause'||d.type==='pause')&&playing)pause();
      }catch(e){}
    });

    if(subBtn){
      subBtn.onclick=function(){
        if(!curStop||!selOpt){
          alert('Vui lòng chọn một phương án trả lời!');
          return;
        }
        var found=null;
        for(var k=0;k<curStop.options.length;k++){
          if(curStop.options[k].id===selOpt){
            found=curStop.options[k];
            break;
          }
        }
        if(found&&found.isCorrect){
          if(alertBox){
            alertBox.style.display='block';
            alertBox.style.background='#dcfce7';
            alertBox.style.color='#15803d';
            alertBox.innerText='✓ Chính xác! '+(curStop.explanation||'');
          }
          subBtn.disabled=true;
          subBtn.style.background='#16a34a';
          subBtn.innerText='Đúng rồi! Đang tiếp tục bài giảng...';
          answered[curStop.id]=true;
          setTimeout(function(){
            if(overlay)overlay.style.display='none';
            if(frame){
              frame.style.pointerEvents='auto';
              frame.style.opacity='1';
              if(frame.src.indexOf('about:blank')!==-1){
                frame.src=frame.getAttribute('data-orig-src')||cfg.src;
              }
            }
            curStop=null;
            play();
          },1500);
        }else{
          if(alertBox){
            alertBox.style.display='block';
            alertBox.style.background='#fee2e2';
            alertBox.style.color='#b91c1c';
            alertBox.innerText='✕ Sai rồi! Vui lòng chọn lại đáp án đúng để tiếp tục.';
          }
        }
      };
    }

    if(playBtn){
      playBtn.onclick=function(){
        if(playing)pause();
        else play();
      };
    }

    if(resetBtn){
      resetBtn.onclick=function(){
        curr=0;
        if(clock)clock.innerText='00:00';
        curStop=null;
        answered={};
        if(overlay)overlay.style.display='none';
        if(frame){
          frame.style.pointerEvents='auto';
          frame.style.opacity='1';
          frame.src=cfg.src;
        }
        play();
      };
    }

    timer=setInterval(doTick,1000);
  })()}" />

  <script type="text/javascript">
  if (!window.initElearn_${uid}) {
    window.initElearn_${uid} = true;
    (function() {
      var cfg = ${embedJson};
      var curr = 0;
      var playing = true;
      var curStop = null;
      var selOpt = null;
      var answered = {};
      var timer = null;

      var frame = document.getElementById('elearn-frame-${uid}');
      var overlay = document.getElementById('elearn-overlay-${uid}');
      var qTitle = document.getElementById('elearn-qtitle-${uid}');
      var optsBox = document.getElementById('elearn-opts-${uid}');
      var alertBox = document.getElementById('elearn-alert-${uid}');
      var subBtn = document.getElementById('elearn-subbtn-${uid}');
      var playBtn = document.getElementById('elearn-playbtn-${uid}');
      var resetBtn = document.getElementById('elearn-resetbtn-${uid}');
      var clock = document.getElementById('elearn-clock-${uid}');
      var timeBadge = document.getElementById('elearn-time-badge-${uid}');

      function fmt(s) {
        var m = Math.floor(s / 60);
        var sec = Math.floor(s % 60);
        return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
      }

      function postMsg(cmd) {
        if (!frame || !frame.contentWindow) return;
        try {
          frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd }), '*');
          frame.contentWindow.postMessage(JSON.stringify({ method: cmd }), '*');
          frame.contentWindow.postMessage(cmd, '*');
        } catch(e) {}
      }

      function checkStops(t) {
        for (var i = 0; i < cfg.stops.length; i++) {
          var s = cfg.stops[i];
          if (t >= s.timeSeconds && !answered[s.id]) {
            pause();
            showQuiz(s);
            return true;
          }
        }
        return false;
      }

      function doTick() {
        if (!playing || curStop) return;
        curr++;
        if (clock) clock.innerText = fmt(curr);
        checkStops(curr);
        if (cfg.type === 'youtube' && frame && frame.contentWindow) {
          try { frame.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*'); } catch(e) {}
        }
      }

      function play() {
        if (curStop) return;
        playing = true;
        if (playBtn) {
          playBtn.innerText = 'Tạm Dừng';
          playBtn.style.background = '#ef4444';
        }
        postMsg('play');
        postMsg('playVideo');
        if (!timer) timer = setInterval(doTick, 1000);
      }

      function pause() {
        playing = false;
        if (playBtn) {
          playBtn.innerText = 'Tiếp Tục';
          playBtn.style.background = '#2563eb';
        }
        postMsg('pause');
        postMsg('pauseVideo');
      }

      function showQuiz(stop) {
        curStop = stop;
        selOpt = null;
        if (timeBadge) timeBadge.innerText = 'Mốc: ' + fmt(stop.timeSeconds);
        if (qTitle) qTitle.innerText = stop.question;
        if (alertBox) alertBox.style.display = 'none';

        if (optsBox) {
          optsBox.innerHTML = '';
          for (var j = 0; j < stop.options.length; j++) {
            (function(opt, idx) {
              var label = String.fromCharCode(65 + idx);
              var div = document.createElement('div');
              div.style.cssText = 'padding:10px 12px;margin-bottom:8px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:6px;cursor:pointer;font-size:14px;';
              div.innerHTML = '<strong>' + label + '.</strong> ' + opt.text;
              div.onclick = function() {
                selOpt = opt.id;
                var children = optsBox.children;
                for (var c = 0; c < children.length; c++) {
                  children[c].style.background = '#f8fafc';
                  children[c].style.borderColor = '#cbd5e1';
                  children[c].style.color = '#1e293b';
                }
                div.style.background = '#eff6ff';
                div.style.borderColor = '#2563eb';
                div.style.color = '#1d4ed8';
              };
              optsBox.appendChild(div);
            })(stop.options[j], j);
          }
        }

        if (subBtn) {
          subBtn.innerText = 'Xác nhận câu trả lời';
          subBtn.style.background = '#2563eb';
          subBtn.disabled = false;
        }
        if (overlay) overlay.style.display = 'block';
        if (frame) {
          frame.style.pointerEvents = 'none';
          frame.style.opacity = '0.2';
          if (cfg.type === 'canva') {
            frame.setAttribute('data-orig-src', frame.src);
            frame.src = 'about:blank';
          }
        }
      }

      window.addEventListener('message', function(ev) {
        if (curStop) return;
        try {
          var d = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
          if (!d) return;

          if (d.event === 'infoDelivery' && d.info) {
            if (typeof d.info.currentTime === 'number') {
              var ytSec = Math.floor(d.info.currentTime);
              if (ytSec > 0 && Math.abs(ytSec - curr) > 1) {
                curr = ytSec;
                if (clock) clock.innerText = fmt(curr);
                checkStops(curr);
              }
            }
            if (d.info.playerState === 1 && !playing) play();
            else if (d.info.playerState === 2 && playing) pause();
          }

          if ((d.event === 'play' || d.type === 'play' || d.status === 'playing') && !playing) play();
          else if ((d.event === 'pause' || d.type === 'pause') && playing) pause();
        } catch(e) {}
      });

      if (subBtn) {
        subBtn.onclick = function() {
          if (!curStop || !selOpt) {
            alert('Vui lòng chọn một phương án trả lời!');
            return;
          }
          var found = null;
          for (var k = 0; k < curStop.options.length; k++) {
            if (curStop.options[k].id === selOpt) {
              found = curStop.options[k];
              break;
            }
          }
          if (found && found.isCorrect) {
            if (alertBox) {
              alertBox.style.display = 'block';
              alertBox.style.background = '#dcfce7';
              alertBox.style.color = '#15803d';
              alertBox.innerText = '✓ Chính xác! ' + (curStop.explanation || '');
            }
            subBtn.disabled = true;
            subBtn.style.background = '#16a34a';
            subBtn.innerText = 'Đúng rồi! Đang tiếp tục bài giảng...';
            answered[curStop.id] = true;
            setTimeout(function() {
              if (overlay) overlay.style.display = 'none';
              if (frame) {
                frame.style.pointerEvents = 'auto';
                frame.style.opacity = '1';
                if (frame.src.indexOf('about:blank') !== -1) {
                  frame.src = frame.getAttribute('data-orig-src') || cfg.src;
                }
              }
              curStop = null;
              play();
            }, 1500);
          } else {
            if (alertBox) {
              alertBox.style.display = 'block';
              alertBox.style.background = '#fee2e2';
              alertBox.style.color = '#b91c1c';
              alertBox.innerText = '✕ Sai rồi! Vui lòng chọn lại đáp án đúng để tiếp tục.';
            }
          }
        };
      }

      if (playBtn) {
        playBtn.onclick = function() {
          if (playing) pause();
          else play();
        };
      }

      if (resetBtn) {
        resetBtn.onclick = function() {
          curr = 0;
          if (clock) clock.innerText = '00:00';
          curStop = null;
          answered = {};
          if (overlay) overlay.style.display = 'none';
          if (frame) {
            frame.style.pointerEvents = 'auto';
            frame.style.opacity = '1';
            frame.src = cfg.src;
          }
          play();
        };
      }

      timer = setInterval(doTick, 1000);
    })();
  }
  </script>
</div>`;
  };

  // 2. Tạo mã HTML5 Độc Lập Nâng Cao (Full Animation, Modern Styles)
  const generateHtml5AdvancedCode = () => {
    if (!parsedEmbed) return;
    const uid = Math.random().toString(36).substring(2, 8);

    const embedJson = JSON.stringify({
      src: parsedEmbed.iframeSrc,
      type: parsedEmbed.type,
      stops: quizStops
    });

    return `<!-- BẮT ĐẦU: KHUNG NHÚNG TƯƠNG TÁC HTML5 - TẠO BỞI RCHG STUDIO -->
<div id="interactive-embed-wrapper-${uid}" style="position: relative; width: 100%; max-width: 960px; margin: 1.5rem auto; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; box-sizing: border-box;">
  <!-- Khung iframe trình chiếu -->
  <div style="position: relative; width: 100%; height: 0; padding-top: 56.25%; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.18); background: #0f172a;">
    <iframe id="inter-embed-frame-${uid}" src="${parsedEmbed.iframeSrc}" 
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; margin: 0; padding: 0;"
      allowfullscreen="allowfullscreen" allow="fullscreen; autoplay; encrypted-media">
    </iframe>



    <!-- Lớp chặn màng trong suốt khi dừng lại làm câu hỏi -->
    <div id="inter-blocker-${uid}" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); z-index: 9999; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box;">
      <div style="background: #ffffff; border-radius: 16px; max-width: 560px; width: 100%; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); animation: interPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <span style="background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; text-transform: uppercase;">Câu hỏi dừng lại</span>
          <span id="inter-time-badge-${uid}" style="font-size: 13px; color: #64748b; font-weight: 500;"></span>
        </div>
        <h3 id="inter-question-${uid}" style="font-size: 18px; font-weight: 600; color: #0f172a; line-height: 1.4; margin: 0 0 16px 0;"></h3>
        <div id="inter-options-${uid}" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;"></div>
        <div id="inter-feedback-${uid}" style="display: none; font-size: 14px; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px;"></div>
        <button id="inter-submit-btn-${uid}" style="width: 100%; background: #2563eb; color: #ffffff; border: none; padding: 12px 20px; font-size: 15px; font-weight: 600; border-radius: 10px; cursor: pointer; transition: background 0.2s;">
          Xác nhận câu trả lời
        </button>
      </div>
    </div>
  </div>

  <!-- Thanh điều khiển tương tác bên dưới -->
  <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 10px 16px; border: 1px solid #e2e8f0; border-radius: 10px; margin-top: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
    <div style="display: flex; align-items: center; gap: 12px;">
      <button id="inter-play-btn-${uid}" style="background: #ef4444; color: #ffffff; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px;">
        ❚❚
      </button>
      <button id="inter-reset-btn-${uid}" title="Bắt đầu lại từ đầu" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        ↺
      </button>
      <div style="font-size: 14px; font-weight: 600; color: #334155;">
        <span id="inter-curr-time-${uid}">00:00</span>
      </div>
    </div>
    <div style="font-size: 13px; color: #64748b;">
      <span id="inter-stops-count-${uid}"></span> điểm dừng kiểm tra
    </div>
  </div>

  <style>
    @keyframes interPop {
      0% { opacity: 0; transform: scale(0.92); }
      100% { opacity: 1; transform: scale(1); }
    }
    .inter-opt-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      text-align: left;
      padding: 12px 14px;
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 10px;
      cursor: pointer;
      font-size: 15px;
      color: #1e293b;
      transition: all 0.15s ease;
      box-sizing: border-box;
    }
    .inter-opt-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    .inter-opt-btn.selected {
      background: #eff6ff;
      border-color: #2563eb;
      color: #1d4ed8;
      font-weight: 600;
    }
  </style>

  <script>
    (function() {
      const config = ${embedJson};
      let currentTime = 0;
      let isPlaying = true;
      let activeStop = null;
      let selectedOptionId = null;
      const answeredSet = new Set();
      let timer = null;

      const frame = document.getElementById('inter-embed-frame-${uid}');
      const blocker = document.getElementById('inter-blocker-${uid}');
      const qTitle = document.getElementById('inter-question-${uid}');
      const optsContainer = document.getElementById('inter-options-${uid}');
      const feedback = document.getElementById('inter-feedback-${uid}');
      const submitBtn = document.getElementById('inter-submit-btn-${uid}');
      const playBtn = document.getElementById('inter-play-btn-${uid}');
      const resetBtn = document.getElementById('inter-reset-btn-${uid}');
      const currTimeSpan = document.getElementById('inter-curr-time-${uid}');
      const stopsCountSpan = document.getElementById('inter-stops-count-${uid}');
      const timeBadge = document.getElementById('inter-time-badge-${uid}');

      if (stopsCountSpan) {
        stopsCountSpan.innerText = config.stops.length;
      }

      function formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
      }

      function updatePlayBtn() {
        playBtn.innerText = isPlaying ? '❚❚' : '▶';
        playBtn.style.background = isPlaying ? '#ef4444' : '#2563eb';
      }

      function sendIframeMsg(cmd) {
        if (!frame || !frame.contentWindow) return;
        try {
          frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd }), '*');
          frame.contentWindow.postMessage(JSON.stringify({ method: cmd }), '*');
          frame.contentWindow.postMessage(cmd, '*');
        } catch (e) {}
      }

      function checkStops(t) {
        for (let i = 0; i < config.stops.length; i++) {
          const s = config.stops[i];
          if (t >= s.timeSeconds && !answeredSet.has(s.id)) {
            pausePlayback();
            triggerQuiz(s);
            return true;
          }
        }
        return false;
      }

      function tick() {
        if (!isPlaying || activeStop) return;
        currentTime++;
        currTimeSpan.innerText = formatTime(currentTime);
        checkStops(currentTime);

        if (config.type === 'youtube' && frame && frame.contentWindow) {
          try {
            frame.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
          } catch(e) {}
        }
      }

      function startPlayback() {
        if (activeStop) return;
        isPlaying = true;
        updatePlayBtn();
        sendIframeMsg('play');
        sendIframeMsg('playVideo');
        if (!timer) {
          timer = setInterval(tick, 1000);
        }
      }

      function pausePlayback() {
        isPlaying = false;
        updatePlayBtn();
        sendIframeMsg('pause');
        sendIframeMsg('pauseVideo');
      }

      function triggerQuiz(stop) {
        activeStop = stop;
        selectedOptionId = null;
        timeBadge.innerText = 'Thời điểm: ' + formatTime(stop.timeSeconds);
        qTitle.innerText = stop.question;
        feedback.style.display = 'none';

        optsContainer.innerHTML = '';
        stop.options.forEach((opt, idx) => {
          const btn = document.createElement('button');
          btn.className = 'inter-opt-btn';
          const label = String.fromCharCode(65 + idx);
          btn.innerHTML = '<span style="font-weight: 700; width: 20px;">' + label + '.</span> <span>' + opt.text + '</span>';
          btn.onclick = function() {
            selectedOptionId = opt.id;
            optsContainer.querySelectorAll('.inter-opt-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
          };
          optsContainer.appendChild(btn);
        });

        submitBtn.innerText = 'Xác nhận câu trả lời';
        submitBtn.style.background = '#2563eb';
        submitBtn.disabled = false;
        blocker.style.display = 'flex';
        if (frame) {
          frame.style.pointerEvents = 'none';
          frame.style.opacity = '0.2';
          frame.style.transition = 'opacity 0.3s ease';
          if (config.type === 'canva') {
            frame.setAttribute('data-orig-src', frame.src);
            frame.src = 'about:blank';
          }
        }
      }

      window.addEventListener('message', function(ev) {
        if (activeStop) return;
        try {
          const d = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
          if (!d) return;

          if (d.event === 'infoDelivery' && d.info) {
            if (typeof d.info.currentTime === 'number') {
              const ytSec = Math.floor(d.info.currentTime);
              if (ytSec > 0 && Math.abs(ytSec - currentTime) > 1) {
                currentTime = ytSec;
                currTimeSpan.innerText = formatTime(currentTime);
                checkStops(currentTime);
              }
            }
            if (d.info.playerState === 1 && !isPlaying) {
              startPlayback();
            } else if (d.info.playerState === 2 && isPlaying) {
              pausePlayback();
            }
          }

          if ((d.event === 'play' || d.type === 'play' || d.status === 'playing') && !isPlaying) {
            startPlayback();
          } else if ((d.event === 'pause' || d.type === 'pause') && isPlaying) {
            pausePlayback();
          }
        } catch(e) {}
      });

      submitBtn.onclick = function() {
        if (!activeStop || !selectedOptionId) {
          alert('Vui lòng chọn một phương án trả lời!');
          return;
        }
        const opt = activeStop.options.find(o => o.id === selectedOptionId);
        if (opt && opt.isCorrect) {
          feedback.style.display = 'block';
          feedback.style.background = '#dcfce7';
          feedback.style.color = '#15803d';
          feedback.innerText = '✓ Chính xác! ' + (activeStop.explanation || '');
          submitBtn.disabled = true;
          submitBtn.style.background = '#16a34a';
          submitBtn.innerText = 'Đúng rồi! Đang tiếp tục...';
          answeredSet.add(activeStop.id);
          setTimeout(() => {
            blocker.style.display = 'none';
            if (frame) {
              frame.style.pointerEvents = 'auto';
              frame.style.opacity = '1';
              if (frame.src.indexOf('about:blank') !== -1) {
                frame.src = frame.getAttribute('data-orig-src') || config.src;
              }
            }
            activeStop = null;
            startPlayback();
          }, 1500);
        } else {
          feedback.style.display = 'block';
          feedback.style.background = '#fee2e2';
          feedback.style.color = '#b91c1c';
          feedback.innerText = '✕ Sai rồi! Vui lòng chọn lại đáp án đúng để tiếp tục.';
        }
      };

      playBtn.onclick = function() {
        if (isPlaying) pausePlayback();
        else startPlayback();
      };

      resetBtn.onclick = function() {
        currentTime = 0;
        currTimeSpan.innerText = '00:00';
        activeStop = null;
        answeredSet.clear();
        blocker.style.display = 'none';
        if (frame) {
          frame.style.pointerEvents = 'auto';
          frame.style.opacity = '1';
          frame.src = config.src;
        }
        startPlayback();
      };

      timer = setInterval(tick, 1000);
    })();
  </script>
</div>
<!-- KẾT THÚC: KHUNG NHÚNG TƯƠNG TÁC HTML5 -->`;
  };

  // Tự động cập nhật mã xuất ở Bước 3 bất cứ khi nào Bước 1 (mã nhúng) hoặc Bước 2 (câu hỏi) hoặc chế độ xuất thay đổi
  useEffect(() => {
    if (!parsedEmbed) return;
    let code = '';
    if (exportMode === 'player-iframe') {
      code = generateIframePlayerCode();
    } else if (exportMode === 'standard') {
      code = generateStandardHtmlCode() || '';
    } else {
      code = generateHtml5AdvancedCode() || '';
    }
    if (code) {
      setExportedCode(code);
    }
  }, [parsedEmbed, quizStops, exportMode]);

  const handleExportCode = (mode: 'player-iframe' | 'standard' | 'html5') => {
    setExportMode(mode);
    let code = '';
    if (mode === 'player-iframe') {
      code = generateIframePlayerCode();
      showToast('Đã chọn Mã Iframe Player (100% Tương thích LMS Nam Sài Gòn & Moodle)!', 'success');
    } else if (mode === 'standard') {
      code = generateStandardHtmlCode() || '';
      showToast('Đã chọn mã HTML thường (Tương thích tốt Elearning / LMS / CKEditor)!', 'success');
    } else {
      code = generateHtml5AdvancedCode() || '';
      showToast('Đã chọn mã HTML5 nâng cao!', 'success');
    }
    if (code) {
      setExportedCode(code);
    }
  };

  const handleCopyCode = async () => {
    if (!exportedCode) return;
    try {
      await navigator.clipboard.writeText(exportedCode);
      setCopied(true);
      showToast('Đã sao chép mã nhúng vào bộ nhớ tạm!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Không thể sao chép tự động, vui lòng chọn và copy thủ công.', 'warning');
    }
  };

  return (
    <div className="inter-embed-container animate-fade-in">
      {/* Header */}
      <header className="inter-header">
        <div className="inter-title-group">
          <div className="inter-icon">
            <Code size={26} />
          </div>
          <div>
            <h1 className="inter-title">Xuất Mã Nhúng HTML Tương Tác</h1>
            <p className="inter-subtitle">
              Thêm điểm dừng câu hỏi trắc nghiệm vào Canva, YouTube hoặc website bất kỳ và xuất mã nhúng HTML thường (chuẩn Elearning/LMS) hoặc HTML5.
            </p>
          </div>
        </div>
      </header>

      {/* BANNER YÊU CẦU ĐĂNG NHẬP NẾU CHƯA ĐĂNG NHẬP */}
      {!user ? (
        <div className="inter-auth-gate-card">
          <div className="inter-auth-gate-icon">
            <Lock size={36} />
          </div>
          <h2 className="inter-auth-gate-title">Yêu Cầu Đăng Nhập</h2>
          <p className="inter-auth-gate-desc">
            Tính năng <strong>Xuất Mã Nhúng HTML Tương Tác</strong> (chèn điểm dừng câu hỏi kiểm tra vào Canva, YouTube cho LMS / Elearning) yêu cầu bạn đăng nhập tài khoản để sử dụng và quản lý bài giảng.
          </p>
          <div className="inter-auth-gate-actions">
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => navigate('/login', { state: { returnUrl: '/xuat-ma-nhung' } })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.85rem 2.5rem', fontSize: '1rem', borderRadius: '50px' }}
            >
              <LogIn size={18} /> Đăng Nhập
            </button>
          </div>
        </div>
      ) : (
        /* Main Grid */
        <div className="inter-main-grid">
          {/* Left Column: Embed Source & Quiz Stops Management */}
          <div className="inter-left-panel">
            {/* Step 1: Input Embed Code */}
            <div className="inter-card">
              <div className="inter-card-header">
                <span className="step-badge">Bước 1</span>
                <h2>Dán Mã Nhúng Hoặc Link Bài Giảng (Google Drive, Canva, YouTube, Web...)</h2>
              </div>
              <p className="inter-desc">
                Hỗ trợ link chia sẻ <strong>Google Drive</strong> (Video/Slide/Doc), <strong>Canva</strong>, <strong>YouTube / Shorts</strong>, hoặc bất kỳ mã <code>&lt;iframe&gt;</code>, liên kết web nào:
              </p>

              {/* Supported Platform Chips */}
              <div className="embed-platform-chips">
                <span className="embed-chip active">
                  <span className="chip-dot"></span> 📁 Google Drive
                </span>
                <span className="embed-chip active">
                  <span className="chip-dot"></span> 🎨 Canva
                </span>
                <span className="embed-chip active">
                  <span className="chip-dot"></span> ▶️ YouTube / Shorts
                </span>
                <span className="embed-chip active">
                  <span className="chip-dot"></span> 🌐 Mọi Website / Iframe
                </span>
              </div>

              {/* Quick Sample Links */}
              <div className="embed-sample-pills">
                <span className="sample-label">Thử nhanh mẫu:</span>
                <button 
                  type="button" 
                  className="sample-pill-btn" 
                  onClick={() => setRawEmbedCode('https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing')}
                  title="Dán link mẫu Google Drive video"
                >
                  📁 Link Google Drive
                </button>
                <button 
                  type="button" 
                  className="sample-pill-btn" 
                  onClick={() => setRawEmbedCode(defaultSample)}
                  title="Dán mã nhúng Canva mẫu"
                >
                  🎨 Mã Nhúng Canva
                </button>
                <button 
                  type="button" 
                  className="sample-pill-btn" 
                  onClick={() => setRawEmbedCode('https://www.youtube.com/watch?v=ScMzIvxBSi4')}
                  title="Dán link YouTube mẫu"
                >
                  ▶️ Link YouTube
                </button>
              </div>

              <textarea
                className="inter-textarea"
                rows={4}
                value={rawEmbedCode}
                onChange={(e) => setRawEmbedCode(e.target.value)}
                placeholder="Dán link Google Drive (https://drive.google.com/file/d/...), Canva, YouTube hoặc mã <iframe src='...'></iframe>..."
              />

              {/* Detection Result Box */}
              {parsedEmbed ? (
                <div className="embed-detection-box success">
                  <div className="embed-detection-header">
                    <CheckCircle2 size={16} />
                    <span>Đã nhận diện: <strong>{parsedEmbed.platformName}</strong></span>
                  </div>
                  <div className="embed-detection-url">
                    <span className="url-label">Link nhúng tự động:</span>
                    <code>{parsedEmbed.iframeSrc}</code>
                  </div>
                  {parsedEmbed.type === 'drive' && (
                    <div className="embed-drive-hint">
                      <div style={{ marginBottom: '4px' }}>
                        💡 <strong>Lưu ý quyền chia sẻ:</strong> Hãy chắc chắn tệp Google Drive đã được bật <em>"Bất kỳ ai có đường liên kết đều có thể xem"</em> để học sinh mở được trên LMS.
                      </div>
                      <div style={{ fontSize: '0.76rem', lineHeight: 1.4, opacity: 0.95, borderTop: '1px dashed rgba(133, 77, 14, 0.25)', paddingTop: '4px', marginTop: '4px' }}>
                        ⭐ <strong>Mẹo chuyên nghiệp cho Video:</strong> Bạn nên tải video bài giảng lên <strong>YouTube ở chế độ "Không công khai" (Unlisted)</strong> rồi dán link vào đây. YouTube hỗ trợ API tự động dừng video, phát tiếp và đồng bộ chính xác từng giây với câu hỏi (Google Drive không có API điều khiển dừng phát từ xa do chính sách bảo mật của Google).
                      </div>
                    </div>
                  )}
                </div>
              ) : rawEmbedCode.trim() ? (
                <div className="embed-detection-box warning">
                  <AlertCircle size={16} />
                  <span>Chưa nhận diện được liên kết hợp lệ. Vui lòng dán link bắt đầu bằng http(s):// hoặc thẻ &lt;iframe&gt;.</span>
                </div>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                <button className="btn btn-primary" onClick={handleApplyEmbed}>
                  <Sparkles size={16} /> Nạp Khung Trình Chiếu
                </button>
              </div>
            </div>

          {/* Step 2: Quiz Stops Configuration */}
          <div className="inter-card">
            <div className="inter-card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="step-badge">Bước 2</span>
                <h2>Danh Sách Câu Hỏi Dừng ({quizStops.length})</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  type="button"
                  className="btn btn-sm" 
                  style={{ 
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', 
                    color: '#ffffff', 
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600
                  }}
                  onClick={() => setShowAiModal(true)}
                >
                  <Wand2 size={15} /> AI Tạo Câu Hỏi
                </button>
                <button className="btn btn-outline btn-sm" onClick={handleOpenAddStop}>
                  <Plus size={15} /> Thêm Thủ Công
                </button>
              </div>
            </div>
            <p className="inter-desc">
              Nội dung sẽ tự động dừng tại các mốc thời gian dưới đây và hiện câu hỏi bắt buộc trả lời đúng để xem tiếp. Bạn có thể tự thêm hoặc dùng <strong>AI Tạo Câu Hỏi</strong> siêu tốc.
            </p>

            <div className="quiz-stops-list">
              {quizStops.length === 0 ? (
                <div className="empty-stops">
                  <HelpCircle size={32} />
                  <p>Chưa có điểm dừng câu hỏi nào. Nhấn "Thêm Thủ Công" hoặc "AI Tạo Câu Hỏi" để bắt đầu.</p>
                </div>
              ) : (
                quizStops.map((stop, idx) => (
                  <div key={stop.id} className="quiz-stop-item">
                    <div className="stop-time-badge">
                      <Clock size={14} />
                      <span>{formatTime(stop.timeSeconds)}</span>
                    </div>
                    <div className="stop-details">
                      <div className="stop-question">
                        <strong>#{idx + 1}: </strong>{stop.question || 'Chưa đặt tiêu đề câu hỏi'}
                      </div>
                      <div className="stop-meta">
                        <span>{stop.options.length} lựa chọn</span>
                        <span className="bullet">•</span>
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                          Đáp án đúng: {stop.options.find(o => o.isCorrect)?.text || 'Chưa chọn'}
                        </span>
                      </div>
                    </div>
                    <div className="stop-actions">
                      <button 
                        className="stop-action-btn edit" 
                        onClick={() => handleEditStop(stop)}
                        title="Chỉnh sửa câu hỏi"
                      >
                        Sửa
                      </button>
                      <button 
                        className="stop-action-btn delete" 
                        onClick={() => handleDeleteStop(stop.id)}
                        title="Xóa điểm dừng này"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Step 3: Export Code Button */}
          <div className="inter-card">
            <div className="inter-card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="step-badge">Bước 3</span>
                <h2>Xuất Bài Giảng Tương Tác</h2>
              </div>
              <button 
                type="button"
                className="btn btn-sm"
                onClick={handleDownloadHtmlFile}
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Download size={15} /> Tải Tệp HTML Về Máy (.html)
              </button>
            </div>
            <p className="inter-desc">
              Bạn có thể bấm <strong>"Tải Tệp HTML Về Máy"</strong> để lưu file độc lập (giống hệ thống tienich.ite.id.vn) hoặc chọn các dạng mã nhúng bên dưới:
            </p>

            {/* Export Mode Toggle Buttons */}
            <div className="export-mode-tabs">
              <button 
                type="button"
                className={`export-mode-tab ${exportMode === 'player-iframe' && exportedCode ? 'active' : ''}`}
                onClick={() => handleExportCode('player-iframe')}
              >
                <div className="export-mode-tab-title">
                  <Globe size={18} style={{ flexShrink: 0 }} /> 
                  <span>Mã Iframe LMS (Khuyên dùng)</span>
                </div>
                <div className="export-mode-tab-desc">
                  100% không bị LMS chặn script, chuẩn xác từng giây
                </div>
              </button>

              <button 
                type="button"
                className={`export-mode-tab ${exportMode === 'standard' && exportedCode ? 'active' : ''}`}
                onClick={() => handleExportCode('standard')}
              >
                <div className="export-mode-tab-title">
                  <FileCode size={18} style={{ flexShrink: 0 }} /> 
                  <span>Mã HTML Thường</span>
                </div>
                <div className="export-mode-tab-desc">
                  Chèn mã trực tiếp (cần web cho phép chạy script)
                </div>
              </button>

              <button 
                type="button"
                className={`export-mode-tab ${exportMode === 'html5' && exportedCode ? 'active' : ''}`}
                onClick={() => handleExportCode('html5')}
              >
                <div className="export-mode-tab-title">
                  <Sparkles size={18} style={{ flexShrink: 0 }} /> 
                  <span>Mã HTML5 Nâng Cao</span>
                </div>
                <div className="export-mode-tab-desc">
                  Giao diện độc lập có hiệu ứng làm mờ
                </div>
              </button>
            </div>

            {/* Hướng dẫn dán vào LMS */}
            <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>
                💡 Hướng dẫn nhúng vào LMS / Elearning:
              </strong>
              {exportMode === 'player-iframe' ? (
                <>
                  1. Chọn <strong>"Mã Iframe LMS (Khuyên dùng)"</strong> và bấm <strong>"Sao Chép Mã"</strong>.<br />
                  2. Trên trang Cập nhật bài giảng LMS, ở khung soạn thảo nội dung hãy bấm vào nút <strong>Mã nguồn (Source / &lt;&gt;)</strong> trên thanh công cụ.<br />
                  3. Dán đoạn mã iframe vào rồi bấm <strong>Lưu lại bài giảng</strong>. Vì là iframe độc lập, toàn bộ đồng hồ, tạm dừng và danh sách câu hỏi trắc nghiệm sẽ hoạt động trơn tru 100% mà không bị CMS của trường can thiệp xóa code.
                </>
              ) : (
                <>
                  1. Bấm nút <strong>"Mã HTML Thường"</strong> ở trên và bấm <strong>"Sao Chép Mã"</strong>.<br />
                  2. Trên trang Cập nhật bài giảng LMS, ở khung soạn thảo nội dung hãy bấm vào nút <strong>Mã nguồn (Source / &lt;&gt;)</strong> trên thanh công cụ.<br />
                  3. Dán toàn bộ mã đã sao chép vào rồi bấm Lưu lại bài giảng.
                </>
              )}
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
              {exportMode === 'player-iframe' && getPlayerUrl() && (
                <a
                  href={getPlayerUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <ExternalLink size={14} /> Mở thử bài giảng ở tab mới
                </a>
              )}
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleDownloadHtmlFile}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#10b981', borderColor: '#10b981' }}
              >
                <Download size={14} /> Tải file HTML (.html)
              </button>
            </div>

            {exportedCode && (
              <div className="export-result-box">
                <div className="export-result-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    <Code size={18} /> 
                    {exportMode === 'player-iframe' 
                      ? 'Mã Iframe Trình Phát LMS (Chuẩn An Toàn 100%)' 
                      : exportMode === 'standard' 
                        ? 'Mã HTML Thường (Chuẩn LMS)' 
                        : 'Mã HTML5 Nâng Cao'}
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleCopyCode}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Đã Sao Chép' : 'Sao Chép Mã'}
                  </button>
                </div>
                <pre className="export-code-block">{exportedCode}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Preview */}
        <div className="inter-right-panel">
          <div className="inter-card sticky-preview">
            <div className="preview-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={20} style={{ color: 'var(--primary)' }} />
                <h3>Xem Trước Tương Tác Trực Tiếp</h3>
              </div>
              <span className="live-pill">Live Preview</span>
            </div>

            {/* Display Frame Screen */}
            <div className="interactive-screen-wrapper">
              {parsedEmbed ? (
                <>
                  <iframe
                    id="preview-iframe"
                    src={parsedEmbed.iframeSrc}
                    title="Interactive Preview"
                    className="interactive-iframe"
                    style={{
                      pointerEvents: activeQuiz ? 'none' : 'auto',
                      opacity: activeQuiz ? 0.2 : 1,
                      transition: 'opacity 0.3s ease'
                    }}
                    allowFullScreen
                    allow="fullscreen; autoplay; encrypted-media"
                  />
                  {!hasStartedPresentation && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(15, 23, 42, 0.7)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 40,
                        backdropFilter: 'blur(3px)',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setHasStartedPresentation(true);
                        setIsPlaying(true);
                        isPlayingRef.current = true;
                        // Thử gửi lệnh play tới iframe
                        const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement | null;
                        if (iframe?.contentWindow) {
                          try {
                            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'play' }), '*');
                            iframe.contentWindow.postMessage(JSON.stringify({ method: 'play' }), '*');
                            iframe.contentWindow.postMessage('play', '*');
                          } catch (e) {}
                        }
                        if (parsedEmbed?.type === 'youtube' && ytPlayerRef.current?.playVideo) {
                          try { ytPlayerRef.current.playVideo(); } catch (e) {}
                        }
                      }}
                    >
                      <button 
                        style={{
                          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '14px 28px',
                          borderRadius: '50px',
                          fontSize: '1rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          boxShadow: '0 8px 25px rgba(37, 99, 235, 0.4)',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <Play size={20} fill="#ffffff" /> Bắt Đầu Chạy Bài Giảng
                      </button>
                      <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '0.75rem', margin: 0 }}>
                        Bấm để kích hoạt phát slide/video và đồng bộ bộ đếm điểm dừng
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="preview-placeholder">
                  <AlertCircle size={40} />
                  <p>Vui lòng nhập mã nhúng hợp lệ để xem trước</p>
                </div>
              )}

              {/* Active Quiz Overlay */}
              {activeQuiz && (
                <div className="quiz-overlay">
                  <div className="quiz-modal animate-scale-up">
                    <div className="quiz-badge">
                      <span>CÂU HỎI KIỂM TRA</span>
                      <span>Dừng tại {formatTime(activeQuiz.timeSeconds)}</span>
                    </div>
                    <h3 className="quiz-title">{activeQuiz.question}</h3>

                    <div className="quiz-options-list">
                      {activeQuiz.options.map((opt, idx) => {
                        const label = String.fromCharCode(65 + idx);
                        const isSelected = selectedOptionId === opt.id;
                        return (
                          <button
                            key={opt.id}
                            className={`quiz-option-button ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedOptionId(opt.id);
                              setAnswerStatus('idle');
                            }}
                          >
                            <span className="option-label">{label}.</span>
                            <span className="option-text">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback Status */}
                    {answerStatus === 'correct' && (
                      <div className="answer-status success">
                        <CheckCircle2 size={18} />
                        <span>Chính xác! {activeQuiz.explanation || 'Đang tiếp tục phát...'}</span>
                      </div>
                    )}
                    {answerStatus === 'wrong' && (
                      <div className="answer-status error">
                        <XCircle size={18} />
                        <span>Chưa đúng! Vui lòng chọn lại đáp án để tiếp tục bài giảng.</span>
                      </div>
                    )}

                    <button
                      className="btn btn-primary submit-quiz-btn"
                      onClick={handleCheckAnswer}
                      disabled={answerStatus === 'correct'}
                    >
                      {answerStatus === 'correct' ? 'Đã Trả Lời Đúng' : 'Xác Nhận Đáp Án'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Timeline Controls */}
            <div className="timeline-bar">
              <div className="timeline-left">
                <button 
                  className={`timeline-btn ${isPlaying ? 'playing' : ''}`}
                  onClick={handleTogglePlay}
                  title={isPlaying ? 'Tạm dừng' : 'Bắt đầu chạy'}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button 
                  className="timeline-btn"
                  onClick={handleResetTimeline}
                  title="Quay lại thời điểm ban đầu 00:00"
                >
                  <RotateCcw size={16} />
                </button>
                <div className="timeline-time">
                  <Clock size={16} />
                  <span>{formatTime(currentTime)}</span>
                </div>
              </div>

              <div className="timeline-right">
                <span className="timeline-info">
                  {quizStops.length} điểm dừng kiểm tra
                </span>
              </div>
            </div>
            <p className="timeline-hint">
              💡 Bấm nút <strong>Play</strong> ở trên để mô phỏng người xem. Khi tiến độ chạm đến các mốc thời gian quy định, nội dung sẽ lập tức dừng và khóa lại cho đến khi trả lời chính xác câu hỏi.
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Modal / Dialog thêm hoặc sửa câu hỏi */}
      {editingStop && (
        <div className="modal-backdrop">
          <div className="stop-edit-modal animate-scale-up">
            <div className="modal-header">
              <h3>{editingStop.id.startsWith('stop-') && !quizStops.some(s => s.id === editingStop.id) ? 'Thêm Câu Hỏi Dừng Mới' : 'Chỉnh Sửa Câu Hỏi'}</h3>
              <button className="modal-close-btn" onClick={() => setEditingStop(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Thời điểm dừng (Phút:Giây hoặc Giây)</label>
                <div className="time-input-wrap">
                  <Clock size={18} />
                  <input
                    type="text"
                    className="inter-input"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    placeholder="Ví dụ: 01:30 hoặc 90"
                  />
                  <span className="time-preview">= {parseTimeToSeconds(timeInput)} giây</span>
                </div>
              </div>

              <div className="form-group">
                <label>Nội dung câu hỏi trắc nghiệm</label>
                <textarea
                  className="inter-textarea"
                  rows={2}
                  value={editingStop.question}
                  onChange={(e) => setEditingStop({ ...editingStop, question: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi muốn hỏi người học..."
                />
              </div>

              <div className="form-group">
                <label>Các lựa chọn trả lời (Tích chọn vào ô tròn của đáp án đúng)</label>
                <div className="options-edit-list">
                  {editingStop.options.map((opt, idx) => (
                    <div key={opt.id} className="option-edit-row">
                      <input
                        type="radio"
                        name="correct-opt"
                        checked={opt.isCorrect}
                        onChange={() => {
                          const updatedOpts = editingStop.options.map(o => ({
                            ...o,
                            isCorrect: o.id === opt.id
                          }));
                          setEditingStop({ ...editingStop, options: updatedOpts });
                        }}
                        title="Đánh dấu đáp án đúng"
                      />
                      <span className="opt-letter">{String.fromCharCode(65 + idx)}.</span>
                      <input
                        type="text"
                        className="inter-input flex-1"
                        value={opt.text}
                        onChange={(e) => {
                          const updatedOpts = editingStop.options.map(o => 
                            o.id === opt.id ? { ...o, text: e.target.value } : o
                          );
                          setEditingStop({ ...editingStop, options: updatedOpts });
                        }}
                        placeholder={`Lựa chọn ${String.fromCharCode(65 + idx)}...`}
                      />
                      {editingStop.options.length > 2 && (
                        <button
                          className="opt-remove-btn"
                          onClick={() => {
                            const updated = editingStop.options.filter(o => o.id !== opt.id);
                            if (opt.isCorrect && updated.length > 0) {
                              updated[0].isCorrect = true;
                            }
                            setEditingStop({ ...editingStop, options: updated });
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {editingStop.options.length < 6 && (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: '0.5rem' }}
                    onClick={() => {
                      const newOptId = `opt-${Date.now()}-${editingStop.options.length + 1}`;
                      setEditingStop({
                        ...editingStop,
                        options: [
                          ...editingStop.options,
                          { id: newOptId, text: '', isCorrect: false }
                        ]
                      });
                    }}
                  >
                    + Thêm Lựa Chọn Trả Lời
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Giải thích / Lời nhắn sau khi trả lời đúng (Tùy chọn)</label>
                <input
                  type="text"
                  className="inter-input"
                  value={editingStop.explanation || ''}
                  onChange={(e) => setEditingStop({ ...editingStop, explanation: e.target.value })}
                  placeholder="Ví dụ: Rất tốt! Bài học tiếp theo sẽ nói về định dạng bảng..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditingStop(null)}>
                Hủy Bỏ
              </button>
              <button className="btn btn-primary" onClick={handleSaveStop}>
                Lưu Câu Hỏi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal AI Tạo Câu Hỏi Tự Động */}
      {showAiModal && (
        <div className="modal-backdrop">
          <div className="stop-edit-modal animate-scale-up" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: '#ec4899' }} />
                <h3>AI Co-Pilot: Tạo Câu Hỏi Kiểm Tra</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAiModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Dán một đoạn văn bản tóm tắt nội dung từ trang slide/PDF hiện tại hoặc nhập chủ đề bài giảng. AI sẽ tự động phân tích và tạo 1 câu hỏi 4 lựa chọn kèm đáp án đúng chuẩn xác.
              </p>

              <div className="form-group">
                <label>Đoạn trích kiến thức / Chủ đề câu hỏi</label>
                <textarea
                  className="inter-textarea"
                  rows={4}
                  value={aiTopicPrompt}
                  onChange={(e) => setAiTopicPrompt(e.target.value)}
                  placeholder="Ví dụ: Định dạng văn bản trong Word bao gồm căn lề, thụt đầu dòng, khoảng cách dòng line spacing..."
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Gợi ý mẫu:</span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '11.5px', padding: '2px 8px' }}
                  onClick={() => setAiTopicPrompt('Cách chèn bảng biểu Table trong bài thuyết trình')}
                >
                  Bảng biểu
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '11.5px', padding: '2px 8px' }}
                  onClick={() => setAiTopicPrompt('Quy tắc an toàn lao động trong phòng thực hành')}
                >
                  An toàn thực hành
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '11.5px', padding: '2px 8px' }}
                  onClick={() => setAiTopicPrompt('Nguyên lý hoạt động của mạch điện xoay chiều 1 pha')}
                >
                  Mạch điện
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowAiModal(false)}
                disabled={isAiGenerating}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                disabled={isAiGenerating || !aiTopicPrompt.trim()}
                onClick={() => handleAiGenerateQuiz(aiTopicPrompt)}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  borderColor: 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isAiGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {isAiGenerating ? 'Đang phân tích & tạo...' : 'Tạo Câu Hỏi Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import { useState, useEffect, useRef } from 'react';
import { Play, Square, Settings2, Mic, Volume2, Cloud, Download, Loader2, FileAudio } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './TextToSpeech.css';

type Mode = 'browser' | 'edge';

interface EdgeVoice {
  id: string;
  name: string;
  badge?: string;
  isBilingual?: boolean;
  gender: 'female' | 'male';
}

function hasEnglishWords(text: string): boolean {
  if (!text) return false;
  // Ký tự ngoại ngữ không có trong bảng chữ cái tiếng Việt chuẩn
  if (/[fjwzFJWZ]/.test(text)) return true;

  const commonEnglish = new Set([
    'ai', 'api', 'app', 'apps', 'audio', 'auto', 'admin', 'android', 'apple',
    'best', 'big', 'blog', 'browser', 'build', 'business',
    'call', 'camera', 'chat', 'check', 'clean', 'client', 'clip', 'cloud', 'code', 'content', 'copy',
    'data', 'date', 'deadline', 'deal', 'demo', 'design', 'dev', 'developer', 'digital', 'doc', 'download',
    'edit', 'editor', 'email', 'end', 'error', 'event',
    'facebook', 'fan', 'fast', 'feed', 'feedback', 'file', 'files', 'fix', 'format', 'free',
    'game', 'get', 'global', 'good', 'google', 'group',
    'help', 'home', 'hot', 'html', 'hub',
    'image', 'info', 'input', 'internet', 'ios', 'item',
    'key', 'king',
    'laptop', 'lead', 'leader', 'level', 'like', 'link', 'live', 'log', 'login', 'logo',
    'mac', 'mail', 'manager', 'market', 'marketing', 'media', 'meet', 'meeting', 'member', 'menu', 'message', 'mode', 'model', 'mp3', 'mp4',
    'net', 'network', 'new', 'news', 'note',
    'office', 'offline', 'ok', 'okay', 'on', 'online', 'open', 'order', 'out', 'output',
    'page', 'pass', 'password', 'pdf', 'phone', 'photo', 'plan', 'platform', 'play', 'player', 'podcast', 'post', 'pro', 'profile', 'project',
    'rank', 'rate', 'react', 'report', 'review', 'run',
    'sale', 'sales', 'save', 'scan', 'search', 'server', 'service', 'set', 'setting', 'settings', 'share', 'shop', 'show', 'site', 'skill', 'smart', 'software', 'sound', 'source', 'speed', 'staff', 'star', 'start', 'status', 'stop', 'story', 'stream', 'studio', 'style', 'support', 'system',
    'tag', 'task', 'team', 'tech', 'test', 'text', 'time', 'tips', 'tool', 'tools', 'top', 'total', 'track', 'trend', 'tts',
    'ui', 'update', 'upgrade', 'upload', 'url', 'user', 'ux',
    'version', 'video', 'view', 'vip', 'voice',
    'web', 'website', 'win', 'word', 'work', 'world',
    'youtube', 'zalo', 'zoom'
  ]);

  const words = text.toLowerCase().replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ\s]/g, ' ').split(/\s+/);
  
  for (const w of words) {
    if (!w) continue;
    if (commonEnglish.has(w)) return true;
    if (/[bdglrvsx]$/.test(w) && !/^(ong|ang|ung|dung|rang)$/.test(w) && w.length >= 3) {
      if (!/[g]$/.test(w) || /(?:ing|ed|ag|eg|ig|og|ug)$/.test(w)) {
        if (!/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/.test(w)) {
          return true;
        }
      }
    }
    if (/(?:sh|st|nd|nt|mp|ld|lt|ck|rk|sk|ct|pt|ft|pl|pr|cl|cr|bl|br|fl|fr|gl|gr|sp|sm|sn|sw)/.test(w)) {
      if (!/^(tr|ch|th|ph|nh|kh|ng)/.test(w) && !/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/.test(w)) {
        return true;
      }
    }
  }
  return false;
}

function splitTextIntoChunks(text: string, maxLen: number = 130): string[] {
  const cleanText = text.replace(/\r\n/g, '\n').trim();
  if (!cleanText) return [];

  // Tách theo dấu câu chính (. ! ? \n ;)
  const rawSegments = cleanText.split(/(?<=[.!?;\n])\s+/).filter(s => s.trim().length > 0);
  
  const fineSegments: string[] = [];
  for (const seg of rawSegments) {
    if (seg.length <= maxLen) {
      fineSegments.push(seg);
    } else {
      // Nếu câu dài hơn maxLen, tách tiếp theo dấu phẩy, hai chấm, gạch ngang, ngoặc
      const subParts = seg.split(/(?<=[,:\-\–\—\(\)])\s+/).filter(s => s.trim().length > 0);
      for (const sub of subParts) {
        if (sub.length <= maxLen) {
          fineSegments.push(sub);
        } else {
          // Nếu một vế vẫn dài, ngắt từng từ an toàn
          const words = sub.split(/\s+/);
          let temp = '';
          for (const w of words) {
            if (temp.length + w.length + 1 > maxLen) {
              if (temp) fineSegments.push(temp.trim());
              temp = w;
            } else {
              temp += (temp ? ' ' : '') + w;
            }
          }
          if (temp) fineSegments.push(temp.trim());
        }
      }
    }
  }

  // Gộp các đoạn ngắn liền kề để không tạo ra quá nhiều request nhỏ lắt nhắt
  const result: string[] = [];
  let current = '';
  for (const seg of fineSegments) {
    if (current && (current.length + seg.length + 1 > maxLen)) {
      result.push(current.trim());
      current = seg;
    } else {
      current += (current ? ' ' : '') + seg;
    }
  }
  if (current) result.push(current.trim());

  return result;
}

const EDGE_VOICES: EdgeVoice[] = [
  { id: 'vi-VN-HoaiMyNeural', name: 'Hoài My (Nữ - Giọng chuẩn Thuần Việt tự nhiên ⭐)', badge: 'Thuần Việt', isBilingual: false, gender: 'female' },
  { id: 'vi-VN-NamMinhNeural', name: 'Nam Minh (Nam - Giọng chuẩn Thuần Việt tự nhiên ⭐)', badge: 'Thuần Việt', isBilingual: false, gender: 'male' },
  { id: 'en-US-AvaMultilingualNeural', name: 'Ava (Nữ - Song ngữ Anh & Việt quốc tế)', badge: 'Song ngữ', isBilingual: true, gender: 'female' },
  { id: 'en-US-AndrewMultilingualNeural', name: 'Andrew (Nam - Song ngữ Anh & Việt quốc tế)', badge: 'Song ngữ', isBilingual: true, gender: 'male' },
  { id: 'en-US-EmmaMultilingualNeural', name: 'Emma (Nữ - Song ngữ Anh & Việt nhẹ nhàng)', badge: 'Song ngữ', isBilingual: true, gender: 'female' },
  { id: 'en-US-BrianMultilingualNeural', name: 'Brian (Nam - Song ngữ Anh & Việt trầm ấm)', badge: 'Song ngữ', isBilingual: true, gender: 'male' }
];

export default function TextToSpeech() {
  const [mode, setMode] = useState<Mode>('edge');
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);
  const textRef = useRef(text);
  
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Vui lòng dùng Chrome/Edge).");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => { setIsListening(false); setInterimText(''); };
    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
      setInterimText('');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        const currentText = textRef.current;
        setText(currentText + (currentText && !currentText.endsWith(' ') ? ' ' : '') + finalTranscript);
      }
      setInterimText(interim);
    };
    recognition.start();
  };

  
  // Trạng thái Web Speech API
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState<string>('');
  const [rate] = useState(1);
  const [pitch] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Trạng thái Vùng Miền & Edge TTS
  type Region = 'north' | 'south' | 'central' | 'custom';
  const [region, setRegion] = useState<Region>('north');
  const [selectedEdgeVoice, setSelectedEdgeVoice] = useState('vi-VN-HoaiMyNeural');
  const [edgeSpeed, setEdgeSpeed] = useState(0); // -100% đến +100%
  const [edgePitch, setEdgePitch] = useState(0); // -100Hz đến +100Hz
  const [isProcessingCloud, setIsProcessingCloud] = useState(false);
  const [cloudProgress, setCloudProgress] = useState('');
  const [cloudAudioUrl, setCloudAudioUrl] = useState<string | null>(null);

  const handleSelectRegion = (r: Region) => {
    setRegion(r);
    if (r === 'north') {
      setEdgePitch(0);
      setEdgeSpeed(0);
    } else if (r === 'south') {
      setEdgePitch(-8);
      setEdgeSpeed(8);
    } else if (r === 'central') {
      setEdgePitch(-16);
      setEdgeSpeed(-5);
    }
  };

  const [showSettings, setShowSettings] = useState(false);

  const { showAlert } = useDialogs();

  // Load danh sách giọng đọc từ trình duyệt
  useEffect(() => {
    const loadVoices = () => {
      let availableVoices = window.speechSynthesis.getVoices();
      availableVoices.sort((a, b) => {
        if (a.lang.includes('vi') && !b.lang.includes('vi')) return -1;
        if (!a.lang.includes('vi') && b.lang.includes('vi')) return 1;
        return 0;
      });
      setBrowserVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedBrowserVoice) {
        const viVoice = availableVoices.find(v => v.lang.includes('vi'));
        setSelectedBrowserVoice(viVoice ? viVoice.name : availableVoices[0].name);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedBrowserVoice]);

  // Hủy âm thanh khi rời khỏi trang
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlayBrowser = () => {
    if (!text.trim()) {
      showAlert('Vui lòng nhập văn bản cần đọc.', 'Thiếu thông tin');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceToUse = browserVoices.find(v => v.name === selectedBrowserVoice);
    if (voiceToUse) utterance.voice = voiceToUse;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopBrowser = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const handleGenerateEdge = async () => {
    if (!text.trim()) {
      showAlert('Vui lòng nhập văn bản cần đọc.', 'Thiếu thông tin');
      return;
    }

    setIsProcessingCloud(true);
    setCloudAudioUrl(null);

    try {
      const rateStr = edgeSpeed >= 0 ? `+${edgeSpeed}%` : `${edgeSpeed}%`;
      const pitchStr = edgePitch >= 0 ? `+${edgePitch}Hz` : `${edgePitch}Hz`;

      // Tách văn bản thành các đoạn nhỏ tự nhiên (tối đa ~130 ký tự) để mỗi request chỉ mất 3-5s
      // Hoàn toàn tránh được giới hạn timeout 10s của Vercel Serverless
      const chunks = splitTextIntoChunks(text, 130);
      if (chunks.length === 0) return;

      const audioBlobs: Blob[] = [];
      setCloudProgress(`Đang xử lý (0/${chunks.length})...`);

      for (let i = 0; i < chunks.length; i++) {
        let chunkText = chunks[i];

        // Chuẩn hóa một số từ viết tắt tiếng Anh thông dụng để giọng đọc thuần Việt phát âm chuẩn và rõ ràng
        chunkText = chunkText
          .replace(/\bAI\b/g, 'A.I')
          .replace(/\bPDF\b/g, 'P.D.F')
          .replace(/\bAPI\b/g, 'A.P.I')
          .replace(/\bTTS\b/g, 'T.T.S')
          .replace(/\bURL\b/g, 'U.R.L')
          .replace(/\bSEO\b/g, 'S.E.O')
          .replace(/\bCEO\b/g, 'C.E.O')
          .replace(/\bVIP\b/g, 'V.I.P')
          .replace(/\bIT\b/g, 'I.T')
          .replace(/\bHTML\b/g, 'H.T.M.L')
          .replace(/\bCSS\b/g, 'C.S.S')
          .replace(/\bJS\b/g, 'J.S');

        let response: Response | null = null;
        let lastErrorMsg = '';

        // Tự động thử lại tối đa 2 lần nếu mạng chập chờn
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            response = await fetch('/api/edge-tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: chunkText,
                voice: selectedEdgeVoice,
                rate: rateStr,
                pitch: pitchStr
              })
            });

            if (response.ok) break;
            lastErrorMsg = await response.text();
          } catch (fetchErr: any) {
            lastErrorMsg = fetchErr.message;
            if (attempt === 0) {
              await new Promise(r => setTimeout(r, 600));
            }
          }
        }

        if (!response || !response.ok) {
          throw new Error(`Đoạn ${i + 1}/${chunks.length} không phản hồi (${lastErrorMsg || 'Lỗi kết nối Microsoft'})`);
        }

        const blob = await response.blob();
        if (blob.size < 50) {
          throw new Error(`Đoạn ${i + 1}/${chunks.length} dữ liệu âm thanh bị rỗng`);
        }

        audioBlobs.push(blob);
        setCloudProgress(`Đang xử lý (${i + 1}/${chunks.length})...`);
      }

      setCloudProgress('Đang gộp file âm thanh...');
      const finalBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
      const url = window.URL.createObjectURL(finalBlob);
      setCloudAudioUrl(url);
    } catch (err: any) {
      console.error(err);
      showAlert(`Lỗi khi tạo giọng đọc: ${err.message}.`, 'Lỗi API');
    } finally {
      setIsProcessingCloud(false);
      setCloudProgress('');
    }
  };

  const downloadCloudAudio = async () => {
    if (!cloudAudioUrl) return;
    const a = document.createElement('a');
    a.href = cloudAudioUrl;
    a.download = `voice_microsoft_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="tts-container">
      <div className="tool-header text-center mb-8">
        <h1 className="text-gradient text-3xl mb-2">Đọc Văn Bản (Text To Speech)</h1>
        <p className="text-secondary">Sử dụng Microsoft Edge AI để tạo file MP3 giọng Nam/Nữ chuẩn xác nhất, hoàn toàn miễn phí.</p>
      </div>

      <div className="glass-card">
        {/* TAB NAVIGATION */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2">
          <button 
            className={`flex items-center gap-2 pb-2 px-4 border-b-2 font-semibold transition-colors ${mode === 'edge' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setMode('edge')}
          >
            <Cloud size={18} /> Microsoft Edge AI (Tải MP3)
          </button>

        </div>

        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors bg-gray-100 px-3 py-1.5 rounded-full"
          >
            <Settings2 size={16} /> Cài đặt & Chọn giọng
          </button>
        </div>

        {/* SETTINGS PANEL */}
        {showSettings && (
          <div className="mb-6 bg-blue-50 rounded-xl border border-blue-200 shadow-sm flex flex-col gap-5" style={{ padding: '20px' }}>
            {/* TÙY CHỌN VÙNG MIỀN BẮC - TRUNG - NAM */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-blue-900">
                  Tần số âm thanh theo Vùng Miền Việt Nam:
                </label>
                {region !== 'custom' && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-200 text-blue-800 font-medium">
                    Đang áp dụng tần số {region === 'north' ? 'Miền Bắc' : region === 'south' ? 'Miền Nam' : 'Miền Trung'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectRegion('north')}
                  className={`tts-region-btn ${region === 'north' ? 'active' : ''}`}
                  style={{
                    backgroundColor: region === 'north' ? '#2563eb' : '#ffffff',
                    color: region === 'north' ? '#ffffff' : '#1e293b',
                    borderColor: region === 'north' ? '#1d4ed8' : '#bfdbfe'
                  }}
                >
                  <span className="text-2xl">🏛️</span>
                  <div>
                    <div className="region-title" style={{ color: region === 'north' ? '#ffffff' : '#1e293b' }}>
                      Miền Bắc (Hà Nội)
                    </div>
                    <div className="region-desc" style={{ color: region === 'north' ? '#dbeafe' : '#64748b' }}>
                      Tần số 0Hz • Chuẩn mực, rõ ràng, thanh thoát
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRegion('south')}
                  className={`tts-region-btn ${region === 'south' ? 'active' : ''}`}
                  style={{
                    backgroundColor: region === 'south' ? '#2563eb' : '#ffffff',
                    color: region === 'south' ? '#ffffff' : '#1e293b',
                    borderColor: region === 'south' ? '#1d4ed8' : '#bfdbfe'
                  }}
                >
                  <span className="text-2xl">🌴</span>
                  <div>
                    <div className="region-title" style={{ color: region === 'south' ? '#ffffff' : '#1e293b' }}>
                      Miền Nam (Sài Gòn)
                    </div>
                    <div className="region-desc" style={{ color: region === 'south' ? '#dbeafe' : '#64748b' }}>
                      Tần số -8Hz • Trầm ấm, mềm mại, ngọt ngào (+8% tốc độ)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRegion('central')}
                  className={`tts-region-btn ${region === 'central' ? 'active' : ''}`}
                  style={{
                    backgroundColor: region === 'central' ? '#2563eb' : '#ffffff',
                    color: region === 'central' ? '#ffffff' : '#1e293b',
                    borderColor: region === 'central' ? '#1d4ed8' : '#bfdbfe'
                  }}
                >
                  <span className="text-2xl">🌊</span>
                  <div>
                    <div className="region-title" style={{ color: region === 'central' ? '#ffffff' : '#1e293b' }}>
                      Miền Trung (Huế / Đà Nẵng)
                    </div>
                    <div className="region-desc" style={{ color: region === 'central' ? '#dbeafe' : '#64748b' }}>
                      Tần số -16Hz • Trầm sâu, dứt khoát, mộc mạc lắng đọng
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* CHỌN GIỌNG ĐỌC & ĐIỀU CHỈNH TẦN SỐ NÂNG CAO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-3 border-t border-blue-200">
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">Chọn Giọng Đọc AI:</label>
                <select 
                  value={selectedEdgeVoice} 
                  onChange={(e) => setSelectedEdgeVoice(e.target.value)}
                  className="w-full p-2.5 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 shadow-sm transition-all"
                >
                  <optgroup label="Giọng Thuần Việt Tự Nhiên (Khuyên dùng)">
                    {EDGE_VOICES.filter(v => !v.isBilingual).map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Giọng Song Ngữ Quốc Tế (Chuẩn phát âm tiếng Anh)">
                    {EDGE_VOICES.filter(v => v.isBilingual).map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-semibold text-blue-900">
                    Tần số cao độ (Pitch):
                  </label>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    {edgePitch > 0 ? `+${edgePitch}Hz (Bổng)` : edgePitch < 0 ? `${edgePitch}Hz (Trầm)` : '0Hz (Chuẩn)'}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-50" max="50" step="1" 
                  value={edgePitch} 
                  onChange={(e) => {
                    setEdgePitch(parseInt(e.target.value));
                    setRegion('custom');
                  }}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600 my-3"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-semibold text-blue-900">
                    Tốc độ đọc (Speed):
                  </label>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    {edgeSpeed > 0 ? `+${edgeSpeed}% (Nhanh)` : edgeSpeed < 0 ? `${edgeSpeed}% (Chậm)` : '0% (Chuẩn)'}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-50" max="50" step="5" 
                  value={edgeSpeed} 
                  onChange={(e) => {
                    setEdgeSpeed(parseInt(e.target.value));
                    setRegion('custom');
                  }}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600 my-3"
                />
              </div>
            </div>

            <div className="text-xs text-gray-500 flex flex-wrap items-center justify-between border-t border-blue-100 pt-2 gap-2">
              <span>* Giọng đọc thuần Việt Hoài My & Nam Minh kết hợp tần số âm thanh tạo nên âm điệu tự nhiên chuẩn Bắc, Trung, Nam.</span>
              <button 
                type="button" 
                onClick={() => handleSelectRegion('north')}
                className="text-blue-600 hover:underline font-medium ml-auto whitespace-nowrap"
              >
                ↺ Đặt lại tần số chuẩn
              </button>
            </div>
          </div>
        )}

        <div className="tts-layout">
          {/* CỘT TRÁI: NHẬP LIỆU */}
          <div className="tts-section">
            <div className="tts-input-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span><FileAudio size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} /> Nhập văn bản cần đọc</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {hasEnglishWords(text) && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex items-center gap-1 border border-blue-200 animate-fadeIn">
                      🌐 Đã phát hiện Tiếng Anh (Phát âm chuẩn)
                    </span>
                  )}
                  <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                    {text.trim() ? text.trim().split(/\s+/).length : 0} từ
                  </span>
                </div>
              </label>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <textarea 
                  className="tts-textarea p-4"
                  placeholder="Ví dụ: Xin chào, tôi đang sử dụng phần mềm đọc văn bản tự động..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  style={{ width: '100%', minHeight: '150px', paddingBottom: '3rem' }}
                ></textarea>
                {isListening && (
                  <div className="absolute bottom-16 left-4 right-4 bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-sm italic shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
                    {interimText || 'Đang nghe... Hãy nói gì đó (Tự động ngắt khi bạn dừng)'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute bottom-4 right-4 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white shadow-md hover:bg-red-600' 
                      : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-300 shadow-sm'
                  }`}
                  title="Nhập bằng giọng nói"
                >
                  <Mic size={16} className={isListening ? 'animate-pulse' : ''} />
                  {isListening ? 'Dừng ghi âm' : 'Nhập bằng giọng nói'}
                </button>
              </div>
            </div>

            {mode === 'browser' ? (
              <div className="flex gap-2">
                <button 
                  className="btn btn-primary flex items-center justify-center flex-1 py-3 px-6"
                  onClick={handlePlayBrowser}
                  disabled={isPlaying}
                >
                  <Play className="mr-2" size={20} /> Phát Âm Thanh
                </button>
                
                <button 
                  className="btn flex items-center justify-center py-3 px-6 text-white bg-red-500 hover:bg-red-600 rounded-xl"
                  style={{ opacity: isPlaying ? 1 : 0.5, cursor: isPlaying ? 'pointer' : 'not-allowed' }}
                  onClick={handleStopBrowser}
                  disabled={!isPlaying}
                >
                  <Square className="mr-2" size={20} /> Dừng
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-primary flex items-center justify-center w-full py-3 px-6"
                onClick={handleGenerateEdge}
                disabled={isProcessingCloud}
              >
                {isProcessingCloud ? (
                  <><Loader2 className="animate-spin mr-2" size={20} /> {cloudProgress || 'Đang kết nối AI...'}</>
                ) : (
                  <><Cloud className="mr-2" size={20} /> Tạo file Âm Thanh MP3</>
                )}
              </button>
            )}
            
            {mode === 'browser' && (
              <p className="text-xs text-gray-500 text-center mt-2">
                * Chế độ trình duyệt phát âm thanh trực tiếp qua loa, không cho phép lưu file MP3.
              </p>
            )}
          </div>

          {/* CỘT PHẢI: KẾT QUẢ / TRẠNG THÁI */}
          <div className="tts-section">
            <div className={`tts-result ${(mode === 'browser' && isPlaying) || (mode === 'edge' && cloudAudioUrl) ? 'has-audio' : ''}`}>
              
              {mode === 'browser' && !isPlaying && (
                <div className="text-center text-gray-400 flex flex-col items-center gap-3">
                  <Volume2 size={48} className="opacity-50" />
                  <p>Sẵn sàng đọc văn bản (Chế độ Trình duyệt).</p>
                </div>
              )}

              {mode === 'browser' && isPlaying && (
                <div className="w-full flex flex-col items-center gap-6">
                  <div className="text-blue-500 font-bold text-lg flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                    Đang phát âm thanh...
                  </div>
                  <div className="flex gap-1 items-end h-16">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                      <div key={i} className="w-2 bg-blue-500 rounded-t-sm" style={{ height: `${Math.max(10, Math.random() * 100)}%`, animation: 'pulse 0.5s infinite alternate', animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'edge' && !cloudAudioUrl && (
                <div className="text-center text-gray-400 flex flex-col items-center gap-3">
                  <Cloud size={48} className="opacity-50" />
                  <p>Chọn giọng Nam/Nữ và nhấn "Tạo file Âm Thanh MP3".</p>
                </div>
              )}

              {mode === 'edge' && cloudAudioUrl && (
                <div className="w-full flex flex-col items-center gap-6">
                  <div className="text-green-500 font-bold text-lg flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    Xử lý AI thành công!
                  </div>
                  
                  <audio src={cloudAudioUrl} controls autoPlay className="w-full rounded-full" />

                  <button 
                    className="btn btn-primary flex items-center justify-center w-full py-3 px-6 gap-2 rounded-xl shadow-lg transition-transform hover:-translate-y-1"
                    onClick={downloadCloudAudio}
                  >
                    <Download size={20} /> Tải file MP3 về máy
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

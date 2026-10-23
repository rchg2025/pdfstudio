import React, { useState, useRef, useEffect } from 'react';
import {
  Subtitles,
  Upload,
  Play,
  Pause,
  Download,
  Sparkles,
  Trash2,
  Type,
  Palette,
  FileText,
  CheckCircle2,
  Plus,
  Film
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './AutoSubtitleStudio.css';

// Helper chuyển AudioBuffer thành WAV Blob chuẩn PCM 16-bit
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new ArrayBuffer(length);
  const view = new DataView(out);
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function writeString(s: string) {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(pos++, s.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF header
  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');

  // fmt sub-chunk
  writeString('fmt ');
  setUint32(16);
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);

  // data sub-chunk
  writeString('data');
  setUint32(length - pos - 4);

  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

export interface SubtitleItem {
  id: string;
  start: number; // giây
  end: number;   // giây
  text: string;
}

export default function AutoSubtitleStudio() {
  const { showToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const srtInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Subtitles State
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  // AI & Processing State
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [recognitionProgress, setRecognitionProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [burnProgress, setBurnProgress] = useState<number>(0);
  const [burnedVideoUrl, setBurnedVideoUrl] = useState<string>('');

  // Subtitle Style Customization
  const [fontSize, setFontSize] = useState<number>(24);
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [bgColor, setBgColor] = useState<string>('rgba(0,0,0,0.75)');
  const [subtitlePosition, setSubtitlePosition] = useState<'bottom' | 'top' | 'middle'>('bottom');
  const [fontStyle] = useState<'sans' | 'serif' | 'mono'>('sans');

  // Helper format time MM:SS.mmm hoặc HH:MM:SS,mmm
  const formatTime = (seconds: number, includeMs: boolean = false): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    const pad = (n: number, size = 2) => String(n).padStart(size, '0');
    if (includeMs) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
    }
    return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
  };

  // Parse time string sang giây
  const parseTimeString = (timeStr: string): number => {
    const parts = timeStr.trim().replace(',', '.').split(':');
    if (parts.length === 3) {
      return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    }
    if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(timeStr) || 0;
  };

  // Xử lý chọn video
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showToast('Vui lòng chọn tệp định dạng video (.mp4, .webm, .mov,...)', 'error');
      return;
    }

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    if (burnedVideoUrl) {
      URL.revokeObjectURL(burnedVideoUrl);
      setBurnedVideoUrl('');
    }

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setSubtitles([]);
    setSelectedSubId(null);
    setActiveSubId(null);
    setCurrentTime(0);
    showToast(`Đã nạp video "${file.name}" thành công!`, 'success');
  };

  // Cập nhật currentTime và activeSubId khi video phát
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);

    const currentSub = subtitles.find(s => t >= s.start && t <= s.end);
    setActiveSubId(currentSub ? currentSub.id : null);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(seconds, duration));
    setCurrentTime(videoRef.current.currentTime);
  };

  // Thêm dòng phụ đề thủ công
  const handleAddSubtitle = () => {
    const newStart = Math.round(currentTime * 10) / 10;
    const newEnd = Math.min(duration || newStart + 3, Math.round((newStart + 3) * 10) / 10);
    const newSub: SubtitleItem = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      start: newStart,
      end: newEnd,
      text: 'Nhập nội dung phụ đề...'
    };
    const updated = [...subtitles, newSub].sort((a, b) => a.start - b.start);
    setSubtitles(updated);
    setSelectedSubId(newSub.id);
  };

  // Cập nhật phụ đề
  const handleUpdateSubtitle = (id: string, field: 'start' | 'end' | 'text', value: any) => {
    setSubtitles(prev => prev.map(s => {
      if (s.id !== id) return s;
      return { ...s, [field]: value };
    }).sort((a, b) => a.start - b.start));
  };

  // Xóa phụ đề
  const handleDeleteSubtitle = (id: string) => {
    setSubtitles(prev => prev.filter(s => s.id !== id));
    if (selectedSubId === id) setSelectedSubId(null);
  };

  // TỰ ĐỘNG NHẬN DIỆN LỜI THOẠI BẰNG AI GEMINI MULTIMODAL KẾT HỢP TRÍCH XUẤT AUDIO TOÀN DIỆN
  const handleAutoSpeechToText = async () => {
    if (!videoRef.current || !videoFile) {
      showToast('Vui lòng chọn video trước khi nhận diện giọng nói.', 'warning');
      return;
    }

    setIsRecognizing(true);
    setStatusMessage('Đang trích xuất dải âm thanh chất lượng cao từ toàn bộ video...');
    setRecognitionProgress(5);

    try {
      // 1. Trích xuất toàn bộ âm thanh video bằng AudioContext
      const arrayBuffer = await videoFile.arrayBuffer();
      setRecognitionProgress(15);
      setStatusMessage('Đang giải mã âm thanh toàn bộ video...');

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const totalAudioDuration = decodedBuffer.duration;
      const sampleRate = 16000; // 16kHz chuẩn tối ưu nhận diện giọng nói Speech-to-Text

      // 2. Chia âm thanh thành các block vừa phải (~60s đến 90s mỗi block) để AI bóc tách chi tiết 100% không sót từ
      const CHUNK_DURATION = 75; // 75 giây mỗi phân đoạn
      const totalChunks = Math.ceil(totalAudioDuration / CHUNK_DURATION);
      const allRecognizedSubs: SubtitleItem[] = [];

      for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        const chunkStart = chunkIdx * CHUNK_DURATION;
        const chunkEnd = Math.min(totalAudioDuration, (chunkIdx + 1) * CHUNK_DURATION);
        const chunkLength = chunkEnd - chunkStart;

        const currentPct = Math.round(((chunkIdx) / totalChunks) * 80) + 15;
        setRecognitionProgress(currentPct);
        setStatusMessage(`Đang bóc tách âm thanh phần ${chunkIdx + 1}/${totalChunks} (${Math.round(chunkStart)}s - ${Math.round(chunkEnd)}s)...`);

        // Kết xuất phân đoạn âm thanh này sang mono 16kHz
        const offlineCtx = new OfflineAudioContext(1, Math.ceil(sampleRate * chunkLength), sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = decodedBuffer;
        source.connect(offlineCtx.destination);
        source.start(0, chunkStart, chunkLength);

        const renderedMonoBuffer = await offlineCtx.startRendering();
        const wavBlob = audioBufferToWavBlob(renderedMonoBuffer);

        // Chuyển sang Base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(wavBlob);
        const audioBase64 = await base64Promise;

        // Gọi AI nhận diện từng phân đoạn
        const res = await fetch('/api/qa-wall?action=transcribe-video-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64,
            mimeType: 'audio/wav',
            duration: chunkLength,
            chunkOffset: chunkStart,
            contextHint: videoFile.name.replace(/\.[^/.]+$/, '')
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Lỗi bóc tách phần ${chunkIdx + 1}`);
        }

        if (Array.isArray(data.subtitles) && data.subtitles.length > 0) {
          data.subtitles.forEach((s: any, idx: number) => {
            const rawStart = Number(s.start ?? chunkStart);
            const rawEnd = Number(s.end ?? (rawStart + 3));
            const subText = String(s.text || '').trim();

            if (subText.length > 0) {
              allRecognizedSubs.push({
                id: `sub-ai-${chunkIdx}-${idx}-${Date.now()}`,
                start: Math.round(Math.max(chunkStart, Math.min(chunkEnd, rawStart)) * 10) / 10,
                end: Math.round(Math.max(rawStart + 0.5, Math.min(totalAudioDuration, rawEnd)) * 10) / 10,
                text: subText
              });
            }
          });

          // Cập nhật liên tục lên UI để người dùng thấy phụ đề xuất hiện dần dần
          setSubtitles([...allRecognizedSubs].sort((a, b) => a.start - b.start));
        }
      }

      setRecognitionProgress(100);
      setStatusMessage('');
      if (allRecognizedSubs.length > 0) {
        showToast(`Đã nhận diện hoàn tất toàn bộ video với ${allRecognizedSubs.length} mốc phụ đề!`, 'success');
      } else {
        showToast('Không tìm thấy lời thoại rõ ràng trong video.', 'warning');
      }
    } catch (err: any) {
      console.error('AI Transcribe error:', err);
      showToast('Lỗi nhận diện AI: ' + (err.message || 'Không thể kết nối dịch vụ'), 'error');
    } finally {
      setIsRecognizing(false);
      setStatusMessage('');
    }
  };

  // Nhập file .SRT có sẵn
  const handleImportSrt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        const blocks = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n\n');
        const parsed: SubtitleItem[] = [];

        blocks.forEach((b, i) => {
          const lines = b.trim().split('\n');
          if (lines.length >= 2) {
            // Dòng timecode thường là dòng 1 hoặc 2
            const timeLine = lines.find(l => l.includes('-->'));
            if (timeLine) {
              const [startStr, endStr] = timeLine.split('-->');
              const textLines = lines.slice(lines.indexOf(timeLine) + 1).join(' ').trim();
              if (startStr && endStr && textLines) {
                parsed.push({
                  id: 'sub-srt-' + i,
                  start: Math.round(parseTimeString(startStr) * 10) / 10,
                  end: Math.round(parseTimeString(endStr) * 10) / 10,
                  text: textLines
                });
              }
            }
          }
        });

        if (parsed.length > 0) {
          setSubtitles(parsed);
          showToast(`Đã nhập thành công ${parsed.length} câu phụ đề từ file .SRT!`, 'success');
        } else {
          showToast('Không tìm thấy định dạng SRT hợp lệ.', 'warning');
        }
      } catch (err: any) {
        showToast('Lỗi khi đọc file .SRT: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    if (srtInputRef.current) srtInputRef.current.value = '';
  };

  // Xuất file phụ đề .SRT chuẩn
  const handleExportSrt = () => {
    if (subtitles.length === 0) {
      showToast('Chưa có phụ đề để xuất file .SRT.', 'warning');
      return;
    }

    let srtContent = '';
    subtitles.forEach((s, idx) => {
      srtContent += `${idx + 1}\n`;
      srtContent += `${formatTime(s.start, true)} --> ${formatTime(s.end, true)}\n`;
      srtContent += `${s.text.trim()}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (videoFile?.name.replace(/\.[^/.]+$/, '') || 'Phu_de') + '.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã xuất file phụ đề .SRT thành công!', 'success');
  };

  // ĐỐT SUB / HARD-SUB TỰ ĐỘNG VÀO VIDEO BẰNG CANVAS & MEDIARECORDER
  const handleBurnSubtitlesToVideo = async () => {
    if (!videoRef.current || !videoFile) {
      showToast('Vui lòng chọn video trước khi đốt sub.', 'warning');
      return;
    }

    if (subtitles.length === 0) {
      showToast('Vui lòng thêm ít nhất một câu phụ đề để nhúng vào video.', 'warning');
      return;
    }

    setIsBurning(true);
    setBurnProgress(0);
    setStatusMessage('Đang chuẩn bị render và đốt chữ phụ đề vào khung hình video...');

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsBurning(false);
      showToast('Trình duyệt không hỗ trợ Canvas 2D.', 'error');
      return;
    }

    // Thiết lập kích thước canvas theo độ phân giải video gốc
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    // Thiết lập stream từ canvas và audio từ video
    const canvasStream = canvas.captureStream(30);
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    let combinedStream: MediaStream = canvasStream;

    try {
      const source = audioCtx.createMediaElementSource(video);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioCtx.destination);
      combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);
    } catch (e) {
      console.warn('Audio capture note:', e);
    }

    // MediaRecorder
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 3500000 // 3.5 Mbps cho chất lượng HD nét căng
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setBurnedVideoUrl(url);
      setIsBurning(false);
      setStatusMessage('');
      showToast('Đã đốt phụ đề vào video thành công! Bạn có thể xem thử và tải về ngay.', 'success');
    };

    recorder.start(100);

    // Bắt đầu phát từ giây 0 để render từng frame
    video.currentTime = 0;
    video.muted = false;

    let renderActive = true;
    const totalDuration = video.duration || duration;

    const renderFrame = () => {
      if (!renderActive) return;

      // 1. Vẽ khung hình video
      ctx.drawImage(video, 0, 0, width, height);

      // 2. Tìm phụ đề hiện tại
      const curT = video.currentTime;
      const activeSub = subtitles.find(s => curT >= s.start && curT <= s.end);

      if (activeSub && activeSub.text) {
        ctx.save();

        // Tính tỉ lệ font chữ theo resolution video
        const scale = width / 1280;
        const actualFontSize = Math.round(fontSize * scale);
        const fontFamily = fontStyle === 'serif' ? 'Georgia, serif' : fontStyle === 'mono' ? 'Courier New, monospace' : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.font = `bold ${actualFontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Tính vị trí Y
        let yPos = height - actualFontSize * 2.5; // Bottom
        if (subtitlePosition === 'top') yPos = actualFontSize * 2.5;
        if (subtitlePosition === 'middle') yPos = height / 2;

        const text = activeSub.text;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const paddingX = actualFontSize * 0.7;
        const paddingY = actualFontSize * 0.4;
        const boxHeight = actualFontSize + paddingY * 2;
        const boxWidth = textWidth + paddingX * 2;
        const xPos = width / 2;

        // Vẽ nền mờ bo góc cho phụ đề
        if (bgColor && bgColor !== 'transparent') {
          ctx.fillStyle = bgColor;
          const rx = xPos - boxWidth / 2;
          const ry = yPos - boxHeight / 2;
          const radius = 8 * scale;

          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(rx, ry, boxWidth, boxHeight, radius) : ctx.rect(rx, ry, boxWidth, boxHeight);
          ctx.fill();
        }

        // Đổ bóng viền chữ để dễ đọc trên nền sáng/tối
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 6 * scale;
        ctx.shadowOffsetX = 2 * scale;
        ctx.shadowOffsetY = 2 * scale;

        // Vẽ chữ chính
        ctx.fillStyle = textColor;
        ctx.fillText(text, xPos, yPos);

        ctx.restore();
      }

      // Cập nhật tiến độ
      if (totalDuration > 0) {
        const pct = Math.min(99, Math.round((video.currentTime / totalDuration) * 100));
        setBurnProgress(pct);
        setStatusMessage(`Đang kết xuất video nhúng phụ đề... (${pct}%)`);
      }

      if (video.currentTime < totalDuration && !video.ended) {
        requestAnimationFrame(renderFrame);
      }
    };

    video.onended = () => {
      renderActive = false;
      setBurnProgress(100);
      setTimeout(() => recorder.stop(), 300);
    };

    video.play().then(() => {
      renderFrame();
    }).catch(err => {
      setIsBurning(false);
      showToast('Lỗi phát video để ghi hình: ' + err.message, 'error');
    });
  };

  // Dọn dẹp URL khi unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (burnedVideoUrl) URL.revokeObjectURL(burnedVideoUrl);
    };
  }, []);

  return (
    <div className="auto-sub-page">
      {/* HEADER SECTION */}
      <div className="sub-header">
        <div className="sub-header-inner">
          <div className="sub-badge">
            <Sparkles size={16} />
            <span>AI Video Subtitle Studio</span>
          </div>
          <h1>Tạo Phụ Đề Tự Động & Chèn Phụ Đề Vào Video Trực Tuyến</h1>
          <p className="sub-desc">
            Nhận diện lời thoại tự động, khớp mốc thời gian chính xác, tùy biến phong cách chữ <strong>Karaoke / Reels / TikTok</strong> và <strong>chèn thẳng chữ vào video</strong> trực tiếp trên trình duyệt, không cần cài app, bảo mật 100%.
          </p>

          <div className="sub-meta-bar">
            <div className="meta-tag"><Subtitles size={15} /> Nhận diện giọng nói tiếng Việt chuẩn AI</div>
            <div className="meta-tag"><FileText size={15} /> Nhập / Xuất file .SRT chuẩn</div>
            <div className="meta-tag"><Palette size={15} /> Tùy chỉnh màu sắc, cỡ chữ & vị trí</div>
            <div className="meta-tag"><Film size={15} /> Xuất video Full HD nhúng sẵn Sub</div>
          </div>
        </div>
      </div>

      <div className="sub-container">
        {/* TOP TOOLBAR: NẠP FILE & NHẬN DIỆN */}
        <div className="sub-toolbar">
          <div className="toolbar-left">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="video/*"
              onChange={handleVideoSelect}
            />
            <button
              className="btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRecognizing || isBurning}
            >
              <Upload size={16} />
              <span>{videoFile ? 'Đổi Video Khác' : 'Tải Video Lên (.mp4, .mov, .webm)'}</span>
            </button>

            <button
              className="btn-accent-ai"
              onClick={handleAutoSpeechToText}
              disabled={!videoFile || isRecognizing || isBurning}
              title="AI tự động nghe nhận diện giọng nói tiếng Việt và sinh các mốc phụ đề"
            >
              <Sparkles size={16} />
              <span>{isRecognizing ? 'Đang Nhận Diện Lời Thoại...' : 'Tự Động Sinh Phụ Đề Bằng AI'}</span>
            </button>

            <input
              type="file"
              ref={srtInputRef}
              style={{ display: 'none' }}
              accept=".srt"
              onChange={handleImportSrt}
            />
            <button
              className="btn-secondary"
              onClick={() => srtInputRef.current?.click()}
              disabled={isRecognizing || isBurning}
              title="Nạp phụ đề từ file .SRT có sẵn"
            >
              <FileText size={16} />
              <span>Nạp File .SRT</span>
            </button>
          </div>

          <div className="toolbar-right">
            <button
              className="btn-secondary"
              onClick={handleExportSrt}
              disabled={subtitles.length === 0}
              title="Tải về file phụ đề rời .SRT"
            >
              <Download size={16} />
              <span>Tải File .SRT</span>
            </button>

            <button
              className="btn-burn-video"
              onClick={handleBurnSubtitlesToVideo}
              disabled={!videoFile || subtitles.length === 0 || isBurning}
              title="Ghép chữ phụ đề vĩnh viễn vào khung hình video để đăng TikTok, Facebook, YouTube"
            >
              <Film size={16} />
              <span>{isBurning ? `Đang Render (${burnProgress}%)...` : 'Chèn Phụ Đề & Xuất Video MP4'}</span>
            </button>
          </div>
        </div>

        {/* TIẾN TRÌNH TRẠNG THÁI */}
        {(isRecognizing || isBurning) && (
          <div className="progress-banner">
            <div className="progress-text-row">
              <span className="p-msg">{statusMessage}</span>
              <span className="p-num">{isBurning ? `${burnProgress}%` : ''}</span>
            </div>
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${isBurning ? burnProgress : recognitionProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* WORKSPACE 2 CỘT: TRÁI LÀ VIDEO PREVIEW, PHẢI LÀ DANH SÁCH SUBTITLE */}
        <div className="sub-workspace-grid">
          {/* CỘT TRÁI: VIDEO PLAYER & PREVIEW PHỤ ĐỀ */}
          <div className="workspace-left-panel">
            <div className="video-player-card">
              <div className="player-viewport">
                {videoUrl ? (
                  <>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="main-video-el"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onClick={togglePlay}
                    />
                    {/* OVERLAY HIỂN THỊ PHỤ ĐỀ THỜI GIAN THỰC */}
                    {activeSubId && (
                      <div className={`subtitle-overlay-box pos-${subtitlePosition}`}>
                        <div 
                          className={`subtitle-rendered-text font-${fontStyle}`}
                          style={{
                            fontSize: `${fontSize}px`,
                            color: textColor,
                            backgroundColor: bgColor
                          }}
                        >
                          {subtitles.find(s => s.id === activeSubId)?.text}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-player-placeholder" onClick={() => fileInputRef.current?.click()}>
                    <Film size={48} className="placeholder-icon" />
                    <h3>Chưa có video nào được chọn</h3>
                    <p>Bấm vào đây để tải video (.mp4, .mov, .webm) cần tạo phụ đề</p>
                    <button className="btn-primary" style={{ marginTop: '1rem' }}>
                      <Upload size={16} /> Chọn Video Ngay
                    </button>
                  </div>
                )}
              </div>

              {/* VIDEO CONTROLS */}
              {videoUrl && (
                <div className="player-controls-bar">
                  <button className="ctrl-btn-play" onClick={togglePlay}>
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>

                  <span className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>

                  <input
                    type="range"
                    className="timeline-slider"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  />

                  <button className="ctrl-btn-add-sub" onClick={handleAddSubtitle} title="Thêm phụ đề tại mốc giây hiện tại">
                    <Plus size={16} />
                    <span>Thêm Sub</span>
                  </button>
                </div>
              )}
            </div>

            {/* BẢNG TÙY BIẾN GIAO DIỆN PHỤ ĐỀ */}
            <div className="styling-panel-card">
              <div className="card-title">
                <Palette size={18} />
                <span>Tùy Biến Phong Cách Phụ Đề (Style Customizer)</span>
              </div>

              <div className="styling-grid">
                <div className="style-group">
                  <label><Type size={14} /> Cỡ chữ: <strong>{fontSize}px</strong></label>
                  <input
                    type="range"
                    min={16}
                    max={48}
                    value={fontSize}
                    onChange={e => setFontSize(parseInt(e.target.value))}
                  />
                </div>

                <div className="style-group">
                  <label>Màu chữ chính:</label>
                  <div className="color-picker-row">
                    <input 
                      type="color" 
                      value={textColor} 
                      onChange={e => setTextColor(e.target.value)} 
                    />
                    <span>{textColor}</span>
                  </div>
                </div>

                <div className="style-group">
                  <label>Màu nền mờ:</label>
                  <div className="color-picker-row">
                    <select 
                      value={bgColor} 
                      onChange={e => setBgColor(e.target.value)}
                      className="style-select"
                    >
                      <option value="rgba(0,0,0,0.8)">Đen mờ 80% (Chuẩn)</option>
                      <option value="rgba(0,0,0,0.5)">Đen mờ nhẹ 50%</option>
                      <option value="#000000">Đen tuyền 100%</option>
                      <option value="rgba(37,99,235,0.85)">Xanh dương nổi bật</option>
                      <option value="rgba(220,38,38,0.85)">Đỏ cảnh báo</option>
                      <option value="transparent">Không nền (Chữ bóng)</option>
                    </select>
                  </div>
                </div>

                <div className="style-group">
                  <label>Vị trí hiển thị:</label>
                  <div className="btn-toggle-group">
                    <button 
                      className={`btn-pos ${subtitlePosition === 'bottom' ? 'active' : ''}`}
                      onClick={() => setSubtitlePosition('bottom')}
                    >
                      Dưới Đáy
                    </button>
                    <button 
                      className={`btn-pos ${subtitlePosition === 'middle' ? 'active' : ''}`}
                      onClick={() => setSubtitlePosition('middle')}
                    >
                      Ở Giữa
                    </button>
                    <button 
                      className={`btn-pos ${subtitlePosition === 'top' ? 'active' : ''}`}
                      onClick={() => setSubtitlePosition('top')}
                    >
                      Trên Cùng
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* VIDEO KẾT QUẢ ĐÃ ĐỐT SUB */}
            {burnedVideoUrl && (
              <div className="burned-result-card">
                <div className="card-title">
                  <CheckCircle2 size={18} color="#16a34a" />
                  <span>Video Đã Nhúng Phụ Đề Hoàn Tất!</span>
                </div>
                <video src={burnedVideoUrl} controls className="burned-preview-video" />
                <div className="burned-actions">
                  <a 
                    href={burnedVideoUrl} 
                    download={(videoFile?.name.replace(/\.[^/.]+$/, '') || 'Video') + '_Co_Phu_De.webm'}
                    className="btn-download-burned"
                  >
                    <Download size={18} />
                    <span>Tải Video Đã Chèn Phụ Đề Về Máy</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: DANH SÁCH PHỤ ĐỀ TIMECODE & CHỈNH SỬA TỪNG CÂU */}
          <div className="workspace-right-panel">
            <div className="subtitles-list-header">
              <div className="header-info">
                <h3>Danh Sách Phụ Đề ({subtitles.length} câu)</h3>
                <span className="header-hint">Bấm vào câu bất kỳ để tua video tới mốc thời gian đó</span>
              </div>
              <button className="btn-add-sub-compact" onClick={handleAddSubtitle}>
                <Plus size={15} /> Thêm Câu Mới
              </button>
            </div>

            <div className="subtitles-scroll-list">
              {subtitles.length > 0 ? (
                subtitles.map((sub, idx) => {
                  const isActive = activeSubId === sub.id;
                  const isSelected = selectedSubId === sub.id;
                  return (
                    <div 
                      key={sub.id} 
                      className={`sub-item-card ${isActive ? 'is-active' : ''} ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSelectedSubId(sub.id);
                        handleSeek(sub.start);
                      }}
                    >
                      <div className="sub-card-top">
                        <span className="sub-index">#{idx + 1}</span>

                        <div className="timecode-inputs">
                          <input
                            type="text"
                            className="time-field"
                            value={formatTime(sub.start, false)}
                            onChange={(e) => handleUpdateSubtitle(sub.id, 'start', parseTimeString(e.target.value))}
                            title="Thời gian bắt đầu (phút:giây)"
                          />
                          <span className="time-sep">➔</span>
                          <input
                            type="text"
                            className="time-field"
                            value={formatTime(sub.end, false)}
                            onChange={(e) => handleUpdateSubtitle(sub.id, 'end', parseTimeString(e.target.value))}
                            title="Thời gian kết thúc (phút:giây)"
                          />
                        </div>

                        <button 
                          className="btn-del-sub" 
                          onClick={(e) => { e.stopPropagation(); handleDeleteSubtitle(sub.id); }}
                          title="Xóa câu này"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="sub-card-body">
                        <textarea
                          className="sub-text-editor"
                          value={sub.text}
                          onChange={(e) => handleUpdateSubtitle(sub.id, 'text', e.target.value)}
                          rows={2}
                          placeholder="Nhập lời thoại..."
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-subs-placeholder">
                  <Subtitles size={40} className="empty-sub-icon" />
                  <h4>Chưa có phụ đề nào</h4>
                  <p>Bấm nút <strong>"Tự Động Sinh Phụ Đề Bằng AI"</strong> ở trên hoặc nhấn <strong>"Thêm Sub"</strong> để bắt đầu soạn phụ đề.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
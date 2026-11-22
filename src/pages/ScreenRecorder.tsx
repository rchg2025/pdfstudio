import { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Mic, 
  Monitor, 
  Camera, 
  Play, 
  Pause, 
  Square, 
  Download, 
  RotateCcw, 
  Clock, 
  FileVideo, 
  CheckCircle2, 
  Layers,
  Sparkles,
  Palette
} from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import { 
  type RecordlyStudioConfig, 
  defaultRecordlyConfig, 
  RECORDLY_GRADIENTS 
} from '../utils/recordlyStudioHelper';
import './ScreenRecorder.css';
import './RecordlyStudio.css';

export default function ScreenRecorder() {
  const { showAlert } = useDialogs();

  // Chế độ ghi: 'screen' (màn hình) | 'camera' (webcam) | 'both' (màn hình + webcam PIP) | 'audio' (chỉ âm thanh)
  const [recordMode, setRecordMode] = useState<'screen' | 'camera' | 'both' | 'audio'>('screen');
  
  // Tùy chọn âm thanh & độ phân giải
  const [enableMic, setEnableMic] = useState<boolean>(true);
  const [enableSystemAudio, setEnableSystemAudio] = useState<boolean>(true);
  const [videoQuality, setVideoQuality] = useState<'4k' | '2k' | '1080p' | '720p'>('1080p');
  const [frameRate, setFrameRate] = useState<number>(60);

  // Trạng thái thu
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [duration, setDuration] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Stream & MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);

  // Video Preview Refs
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipCameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);

  // Active stream state để render preview video phản ứng tức thì
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [activeCamStream, setActiveCamStream] = useState<MediaStream | null>(null);

  // Recorded video blob url
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlobSize, setRecordedBlobSize] = useState<number>(0);

  // Cấu hình Recordly Studio Effects
  const [studioConfig, setStudioConfig] = useState<RecordlyStudioConfig>(defaultRecordlyConfig);
  const [isHoveredPreview, setIsHoveredPreview] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [clickRipples, setClickRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  // Tương tác Auto-Zoom & Click Ripple kiểu Recordly
  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!studioConfig.enableAutoZoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!studioConfig.enableCursorHighlight) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { id: Date.now(), x, y };
    setClickRipples(prev => [...prev.slice(-4), newRipple]);
    setTimeout(() => {
      setClickRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 450);
  };

  // Tự động gán stream vào previewVideoRef khi component render
  useEffect(() => {
    if (previewVideoRef.current && activeStream) {
      previewVideoRef.current.srcObject = activeStream;
      previewVideoRef.current.play().catch((err) => console.log('Preview play error:', err));
    }
  }, [activeStream, recordingStatus]);

  // Tự động gán cam stream vào PIP video khi bật chế độ màn hình + camera
  useEffect(() => {
    if (pipCameraVideoRef.current && activeCamStream) {
      pipCameraVideoRef.current.srcObject = activeCamStream;
      pipCameraVideoRef.current.play().catch((err) => console.log('PIP cam play error:', err));
    }
  }, [activeCamStream, recordingStatus]);

  // Timer counter
  useEffect(() => {
    if (recordingStatus === 'recording') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingStatus]);

  // Clean up streams khi rời trang
  useEffect(() => {
    return () => {
      stopAllMediaTracks();
    };
  }, []);

  const stopAllMediaTracks = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (combinedStreamRef.current) {
      combinedStreamRef.current.getTracks().forEach(track => track.stop());
      combinedStreamRef.current = null;
    }
    setActiveStream(null);
    setActiveCamStream(null);
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    if (hours > 0) {
      return `${hours}:${remainingMins < 10 ? '0' : ''}${remainingMins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
    }
    return `${remainingMins < 10 ? '0' : ''}${remainingMins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Format kích thước file
  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // Bắt đầu quay
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        showAlert('Trình duyệt của bạn không hỗ trợ tính năng chia sẻ màn hình getDisplayMedia hoặc bạn đang duyệt ở kết nối không bảo mật.', 'Thiết Bị Không Hỗ Trợ');
        return;
      }

      stopAllMediaTracks();
      recordedChunksRef.current = [];

      let finalStream: MediaStream;

      // Tính toán kích thước theo độ phân giải được chọn
      let targetWidth = 1920;
      let targetHeight = 1080;
      let targetBitrate = 8000000; // 8 Mbps mặc định cho 1080p

      if (videoQuality === '4k') {
        targetWidth = 3840;
        targetHeight = 2160;
        targetBitrate = 25000000; // 25 Mbps cho 4K Ultra HD
      } else if (videoQuality === '2k') {
        targetWidth = 2560;
        targetHeight = 1440;
        targetBitrate = 14000000; // 14 Mbps cho 2K QHD
      } else if (videoQuality === '720p') {
        targetWidth = 1280;
        targetHeight = 720;
        targetBitrate = 4000000; // 4 Mbps cho 720p HD
      }

      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: targetWidth, max: targetWidth },
        height: { ideal: targetHeight, max: targetHeight },
        frameRate: { ideal: frameRate, max: 60 }
      };

      if (recordMode === 'camera') {
        // Chỉ quay Camera Webcam
        finalStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: enableMic
        });
        cameraStreamRef.current = finalStream;
        setActiveStream(finalStream);
      } else if (recordMode === 'audio') {
        // Chỉ thu Mic âm thanh
        finalStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        setActiveStream(finalStream);
      } else {
        // Quay màn hình (screen hoặc both)
        // Lưu ý: constraints getDisplayMedia không được ép chặt displaySurface hoặc monitor vì nhiều trình duyệt sẽ quăng lỗi OverconstrainedError
        let screenStream: MediaStream;
        try {
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: targetWidth, max: targetWidth },
              height: { ideal: targetHeight, max: targetHeight },
              frameRate: { ideal: frameRate, max: 60 }
            },
            audio: enableSystemAudio
          });
        } catch (firstErr: any) {
          console.warn('Fallback getDisplayMedia với cấu hình tối giản:', firstErr);
          // Fallback thử gọi getDisplayMedia video: true thuần túy nếu trình duyệt không hỗ trợ ràng buộc resolution
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: enableSystemAudio
          });
        }

        screenStreamRef.current = screenStream;

        // Nếu bật cả Mic
        if (enableMic) {
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true
              }
            });
            // Hợp nhất các audio track
            const audioTracks = [...screenStream.getAudioTracks(), ...micStream.getAudioTracks()];
            finalStream = new MediaStream([...screenStream.getVideoTracks(), ...audioTracks]);
          } catch (micErr) {
            console.warn('Không thể bật mic đồng thời:', micErr);
            // Không mở được mic thì lấy nguyên screen stream
            finalStream = screenStream;
          }
        } else {
          finalStream = screenStream;
        }

        // Nếu bật camera PIP
        if (recordMode === 'both') {
          try {
            const camStream = await navigator.mediaDevices.getUserMedia({
              video: { width: 480, height: 360 },
              audio: false
            });
            cameraStreamRef.current = camStream;
            setActiveCamStream(camStream);
          } catch {
            console.warn('Không thể truy cập camera cho PIP overlay.');
          }
        }

        // Tự động dừng khi người dùng bấm "Stop sharing" trên thanh công cụ của trình duyệt
        if (screenStream.getVideoTracks().length > 0) {
          screenStream.getVideoTracks()[0].onended = () => {
            stopRecording();
          };
        }

        setActiveStream(finalStream);
      }

      combinedStreamRef.current = finalStream;

      // Tìm codec MIME Type được trình duyệt hỗ trợ tốt nhất
      const candidateTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4'
      ];
      let selectedMimeType = '';
      if (recordMode === 'audio') {
        const audioCandidateTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
        selectedMimeType = audioCandidateTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
      } else {
        selectedMimeType = candidateTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
      }

      const recorderOptions: MediaRecorderOptions = {};
      if (selectedMimeType) {
        recorderOptions.mimeType = selectedMimeType;
      }
      if (recordMode !== 'audio' && targetBitrate) {
        recorderOptions.videoBitsPerSecond = targetBitrate;
      }

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(finalStream, recorderOptions);
      } catch (optErr) {
        console.warn('MediaRecorder khởi tạo với option thất bại, thử chế độ mặc định:', optErr);
        recorder = new MediaRecorder(finalStream);
      }

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, { 
          type: selectedMimeType || (recordMode === 'audio' ? 'audio/webm' : 'video/webm') 
        });
        const url = URL.createObjectURL(fullBlob);
        setRecordedVideoUrl(url);
        setRecordedBlobSize(fullBlob.size);
        setRecordingStatus('stopped');
        stopAllMediaTracks();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Lưu chunk mỗi 1s

      setDuration(0);
      setRecordedVideoUrl(null);
      setRecordingStatus('recording');
    } catch (err: any) {
      console.error('Lỗi khởi động quay:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showAlert('Bạn đã từ chối hoặc hủy cấp quyền chia sẻ màn hình. Vui lòng bấm "Bắt Đầu Ghi Màn Hình" và chọn màn hình hoặc thẻ tab cần quay trong cửa sổ nhắc của trình duyệt.', 'Chưa Cấp Quyền Chia Sẻ');
      } else {
        showAlert(`Không thể bắt đầu ghi: ${err.message || err.name || 'Lỗi không xác định'}`, 'Lỗi Thu Hình');
      }
    }
  };

  // Tạm dừng
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingStatus('paused');
    }
  };

  // Tiếp tục
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingStatus('recording');
    }
  };

  // Dừng & Hoàn tất
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setRecordingStatus('stopped');
      stopAllMediaTracks();
    }
  };

  // Tải tệp đã quay về máy
  const handleDownload = () => {
    if (!recordedVideoUrl) return;
    const a = document.createElement('a');
    a.href = recordedVideoUrl;
    const isAudio = recordMode === 'audio';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `recording_${timestamp}.${isAudio ? 'webm' : 'webm'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showAlert('Đã tải video/bản ghi thành công về thư mục Downloads!', 'Thành công');
  };

  // Quay lại từ đầu
  const handleReset = () => {
    const ok = window.confirm('Bạn có chắc muốn xóa bản ghi hiện tại để quay phiên mới?');
    if (ok) {
      setRecordedVideoUrl(null);
      setRecordedBlobSize(0);
      setDuration(0);
      setRecordingStatus('idle');
      stopAllMediaTracks();
    }
  };

  return (
    <div className="screen-recorder-container">
      {/* HEADER BAR */}
      <header className="recorder-header">
        <div className="recorder-badge">
          <Video size={16} />
          <span>Tiện Ích Ghi Hình Trực Tuyến</span>
        </div>
        <h1>Quay Video Màn Hình & Âm Thanh Trực Tuyến</h1>
        <p>
          Quay lại toàn bộ màn hình, cửa sổ ứng dụng hoặc camera kèm giọng nói trực tiếp trên trình duyệt. Không cần cài đặt phần mềm, chất lượng Full HD, bảo mật 100% trên máy của bạn.
        </p>
      </header>

      {/* WORKSPACE: CỘT ĐIỀU KHIỂN & CỘT MÀN HÌNH QUAY */}
      <div className="recorder-workspace">
        {/* CỘT TRÁI: BẢNG ĐIỀU KHIỂN THU */}
        <aside className="recorder-control-panel">
          <h2 className="panel-title">
            <Monitor size={20} className="text-primary" />
            Nguồn Thu Hình Ảnh
          </h2>

          <div className="source-selector-grid">
            <button
              type="button"
              className={`source-opt-btn ${recordMode === 'screen' ? 'active' : ''}`}
              onClick={() => setRecordMode('screen')}
              disabled={recordingStatus !== 'idle'}
            >
              <Monitor size={24} />
              <span className="source-label">Màn Hình</span>
            </button>

            <button
              type="button"
              className={`source-opt-btn ${recordMode === 'both' ? 'active' : ''}`}
              onClick={() => setRecordMode('both')}
              disabled={recordingStatus !== 'idle'}
            >
              <Layers size={24} />
              <span className="source-label">Màn Hình + Cam</span>
            </button>

            <button
              type="button"
              className={`source-opt-btn ${recordMode === 'camera' ? 'active' : ''}`}
              onClick={() => setRecordMode('camera')}
              disabled={recordingStatus !== 'idle'}
            >
              <Camera size={24} />
              <span className="source-label">Chỉ Webcam</span>
            </button>

            <button
              type="button"
              className={`source-opt-btn ${recordMode === 'audio' ? 'active' : ''}`}
              onClick={() => setRecordMode('audio')}
              disabled={recordingStatus !== 'idle'}
            >
              <Mic size={24} />
              <span className="source-label">Chỉ Âm Thanh</span>
            </button>
          </div>

          {/* TÙY CHỌN ÂM THANH & CHẤT LƯỢNG */}
          <div className="settings-group">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">Thu Micro Giọng Nói</span>
                <span className="setting-desc">Thuyết minh bài giảng, lồng tiếng</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={enableMic} 
                  onChange={(e) => setEnableMic(e.target.checked)}
                  disabled={recordingStatus !== 'idle'}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {recordMode !== 'camera' && recordMode !== 'audio' && (
              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-name">Âm Thanh Hệ Thống</span>
                  <span className="setting-desc">Âm thanh phát ra từ tab, video đang mở</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={enableSystemAudio} 
                    onChange={(e) => setEnableSystemAudio(e.target.checked)}
                    disabled={recordingStatus !== 'idle'}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            )}

            {recordMode !== 'audio' && (
              <>
                <div className="setting-field-col">
                  <div className="setting-header-line">
                    <span className="setting-name">Độ Phân Giải</span>
                    <span className="setting-desc">Độ nét hình ảnh</span>
                  </div>
                  <select 
                    value={videoQuality}
                    onChange={(e) => setVideoQuality(e.target.value as any)}
                    disabled={recordingStatus !== 'idle'}
                    className="setting-select-control"
                  >
                    <option value="4k">4K (2160p Ultra HD)</option>
                    <option value="2k">2K (1440p QHD)</option>
                    <option value="1080p">1080p (Full HD Chuẩn)</option>
                    <option value="720p">720p (HD Tiết Kiệm)</option>
                  </select>
                </div>

                <div className="setting-field-col">
                  <div className="setting-header-line">
                    <span className="setting-name">Tốc Độ Khung Hình</span>
                    <span className="setting-desc">Độ mượt chuyển động</span>
                  </div>
                  <select 
                    value={frameRate}
                    onChange={(e) => setFrameRate(Number(e.target.value))}
                    disabled={recordingStatus !== 'idle'}
                    className="setting-select-control"
                  >
                    <option value={60}>60 FPS (Siêu Mượt)</option>
                    <option value={30}>30 FPS (Tiêu Chuẩn)</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* RECORDLY STUDIO CONTROL PANEL */}
          <div className="recordly-studio-card">
            <div className="recordly-title">
              <span className="flex items-center gap-1.5">
                <Sparkles size={18} className="text-primary" />
                Recordly Studio Mode
              </span>
              <span className="recordly-badge-pill">Pro Style</span>
            </div>

            <div className="setting-row" style={{ marginBottom: '1rem' }}>
              <div className="setting-info">
                <span className="setting-name">Khung Nền Canvas Nghệ Thuật</span>
                <span className="setting-desc">Tạo khung viền gradient & đổ bóng như Screen Studio</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={studioConfig.enableStudioMode} 
                  onChange={(e) => setStudioConfig(prev => ({ ...prev, enableStudioMode: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {studioConfig.enableStudioMode && (
              <div className="recordly-control-grid animate-fade-in">
                <div className="recordly-field" style={{ gridColumn: 'span 2' }}>
                  <label>
                    <span className="flex items-center gap-1"><Palette size={14} /> Bảng Màu Nền Studio</span>
                    <span className="text-xs text-muted">Gradient & Solid</span>
                  </label>
                  <div className="recordly-palettes">
                    {RECORDLY_GRADIENTS.map(g => (
                      <button
                        key={g.id}
                        type="button"
                        className={`palette-btn ${studioConfig.backgroundGradient === g.value ? 'active' : ''}`}
                        style={{ background: g.value }}
                        title={g.label}
                        onClick={() => setStudioConfig(prev => ({ ...prev, backgroundGradient: g.value }))}
                      />
                    ))}
                  </div>
                </div>

                <div className="recordly-field">
                  <label>
                    <span>Viền Lề (Padding)</span>
                    <span className="text-xs font-mono">{studioConfig.padding}px</span>
                  </label>
                  <input 
                    type="range" 
                    min={8} 
                    max={64} 
                    value={studioConfig.padding}
                    onChange={(e) => setStudioConfig(prev => ({ ...prev, padding: Number(e.target.value) }))}
                    className="recordly-range"
                  />
                </div>

                <div className="recordly-field">
                  <label>
                    <span>Bo Góc Video</span>
                    <span className="text-xs font-mono">{studioConfig.borderRadius}px</span>
                  </label>
                  <input 
                    type="range" 
                    min={0} 
                    max={28} 
                    value={studioConfig.borderRadius}
                    onChange={(e) => setStudioConfig(prev => ({ ...prev, borderRadius: Number(e.target.value) }))}
                    className="recordly-range"
                  />
                </div>

                <div className="recordly-field">
                  <label>
                    <span>Độ Đổ Bóng (Shadow)</span>
                    <span className="text-xs font-mono">{studioConfig.shadowBlur}px</span>
                  </label>
                  <input 
                    type="range" 
                    min={0} 
                    max={50} 
                    value={studioConfig.shadowBlur}
                    onChange={(e) => setStudioConfig(prev => ({ ...prev, shadowBlur: Number(e.target.value) }))}
                    className="recordly-range"
                  />
                </div>

                <div className="recordly-field">
                  <label>
                    <span>Tỉ Lệ Phóng To (Zoom)</span>
                    <span className="text-xs font-mono">{studioConfig.zoomScale}x</span>
                  </label>
                  <input 
                    type="range" 
                    min={1.1} 
                    max={1.8} 
                    step={0.05}
                    value={studioConfig.zoomScale}
                    onChange={(e) => setStudioConfig(prev => ({ ...prev, zoomScale: Number(e.target.value) }))}
                    className="recordly-range"
                  />
                </div>

                <div className="recordly-field" style={{ gridColumn: 'span 2' }}>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Hiển thị thanh tiêu đề macOS</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={studioConfig.showWindowHeader} 
                        onChange={(e) => setStudioConfig(prev => ({ ...prev, showWindowHeader: e.target.checked }))}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Auto-Zoom theo con trỏ chuột</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={studioConfig.enableAutoZoom} 
                        onChange={(e) => setStudioConfig(prev => ({ ...prev, enableAutoZoom: e.target.checked }))}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Hiệu ứng Cursor Ripple khi click</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={studioConfig.enableCursorHighlight} 
                        onChange={(e) => setStudioConfig(prev => ({ ...prev, enableCursorHighlight: e.target.checked }))}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* KHỐI ĐỒNG HỒ & TRẠNG THÁI */}
          {(recordingStatus === 'recording' || recordingStatus === 'paused') && (
            <div className="recording-status-box animate-fade-in">
              <div className="live-indicator">
                <span className="pulse-dot"></span>
                <span>{recordingStatus === 'recording' ? 'Đang Ghi Trực Tiếp' : 'Đang Tạm Dừng'}</span>
              </div>
              <div className="timer-digits">{formatTime(duration)}</div>
            </div>
          )}

          {/* CÁC NÚT ĐIỀU KHIỂN CHÍNH */}
          <div className="action-buttons-group">
            {recordingStatus === 'idle' && (
              <button 
                type="button" 
                className="btn-start-record"
                onClick={startRecording}
              >
                <div className="pulse-dot" style={{ background: '#ffffff' }}></div>
                <span>Bắt Đầu Ghi Màn Hình</span>
              </button>
            )}

            {recordingStatus === 'recording' && (
              <>
                <button 
                  type="button" 
                  className="btn-record-control btn-pause"
                  onClick={pauseRecording}
                >
                  <Pause size={18} />
                  <span>Tạm Dừng</span>
                </button>
                <button 
                  type="button" 
                  className="btn-record-control btn-stop"
                  onClick={stopRecording}
                >
                  <Square size={18} />
                  <span>Dừng & Hoàn Tất</span>
                </button>
              </>
            )}

            {recordingStatus === 'paused' && (
              <>
                <button 
                  type="button" 
                  className="btn-record-control btn-resume"
                  onClick={resumeRecording}
                >
                  <Play size={18} />
                  <span>Tiếp Tục Quay</span>
                </button>
                <button 
                  type="button" 
                  className="btn-record-control btn-stop"
                  onClick={stopRecording}
                >
                  <Square size={18} />
                  <span>Dừng & Hoàn Tất</span>
                </button>
              </>
            )}
          </div>
        </aside>

        {/* CỘT PHẢI: MÀN HÌNH PREVIEW HOẶC XEM LẠI BẢN QUAY */}
        <main className="recorder-preview-stage">
          <div className="stage-header">
            <h2 className="stage-title">
              <FileVideo size={20} className="text-primary" />
              {recordedVideoUrl ? 'Xem Lại Bản Ghi Hoàn Tất' : 'Màn Hình Trực Tiếp'}
            </h2>
            {recordedVideoUrl && (
              <span className="text-success font-semibold text-sm flex items-center gap-1">
                <CheckCircle2 size={16} /> Đã sẵn sàng tải về
              </span>
            )}
          </div>

          <div 
            className="video-display-area"
            onMouseEnter={() => setIsHoveredPreview(true)}
            onMouseLeave={() => setIsHoveredPreview(false)}
            onMouseMove={handleStageMouseMove}
            onClick={handleStageClick}
          >
            {/* Nếu bật Studio Mode và có video (live hoặc playback) thì bọc khung Canvas & Mockup Window */}
            {studioConfig.enableStudioMode && (recordedVideoUrl || (recordingStatus !== 'idle' && recordMode !== 'audio')) ? (
              <div 
                className="recordly-canvas-wrapper"
                style={{
                  background: studioConfig.backgroundGradient,
                  padding: `${studioConfig.padding}px`
                }}
              >
                <div 
                  className="recordly-mockup-frame"
                  style={{
                    borderRadius: `${studioConfig.borderRadius}px`,
                    boxShadow: `0 20px ${studioConfig.shadowBlur}px rgba(0, 0, 0, 0.45)`,
                    transform: (studioConfig.enableAutoZoom && isHoveredPreview) 
                      ? `scale(${studioConfig.zoomScale})` 
                      : 'scale(1)',
                    transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                  }}
                >
                  {/* macOS Mockup Window Header */}
                  {studioConfig.showWindowHeader && (
                    <div className="mockup-window-header">
                      <span className="mac-dot red"></span>
                      <span className="mac-dot yellow"></span>
                      <span className="mac-dot green"></span>
                      <span className="mockup-window-title">
                        {recordedVideoUrl ? 'Recordly Export Player • 1080p' : 'Studio Screen Recording Session'}
                      </span>
                    </div>
                  )}

                  {/* Player hoặc Live Stream */}
                  {recordedVideoUrl ? (
                    <video 
                      ref={playbackVideoRef} 
                      src={recordedVideoUrl} 
                      controls 
                      autoPlay 
                      className="live-video-player"
                      style={{ borderRadius: studioConfig.showWindowHeader ? '0 0 12px 12px' : `${studioConfig.borderRadius}px` }}
                    />
                  ) : (
                    <video 
                      ref={previewVideoRef} 
                      autoPlay 
                      muted 
                      playsInline 
                      className="live-video-player"
                      style={{ borderRadius: studioConfig.showWindowHeader ? '0 0 12px 12px' : `${studioConfig.borderRadius}px` }}
                      onLoadedMetadata={() => {
                        if (previewVideoRef.current) {
                          previewVideoRef.current.play().catch(() => {});
                        }
                      }}
                    />
                  )}

                  {/* Pip Camera Bubble kiểu Recordly */}
                  {recordMode === 'both' && (
                    <div 
                      className="recordly-camera-bubble"
                      style={{
                        bottom: '24px',
                        right: '24px',
                        width: `${studioConfig.cameraBubbleSize}px`,
                        height: `${studioConfig.cameraBubbleSize}px`
                      }}
                    >
                      <video 
                        ref={pipCameraVideoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        onLoadedMetadata={() => {
                          if (pipCameraVideoRef.current) {
                            pipCameraVideoRef.current.play().catch(() => {});
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Click Ripple Effect */}
                {clickRipples.map(ripple => (
                  <div 
                    key={ripple.id}
                    className="cursor-ripple"
                    style={{ left: ripple.x, top: ripple.y }}
                  />
                ))}
              </div>
            ) : (
              /* Màn hình thông thường khi tắt Studio Mode hoặc chế độ Audio / Màn hình chờ */
              <>
                {/* 1. Màn hình playback xem lại sau khi quay xong */}
                {recordedVideoUrl ? (
                  <video 
                    ref={playbackVideoRef} 
                    src={recordedVideoUrl} 
                    controls 
                    autoPlay 
                    className="live-video-player"
                  />
                ) : recordingStatus !== 'idle' ? (
                  /* 2. Màn hình live stream trong lúc đang quay */
                  <>
                    {recordMode === 'audio' ? (
                      <div className="empty-stage-state animate-fade-in">
                        <Mic size={64} className="text-primary animate-pulse" />
                        <h3 style={{ color: '#ffffff' }}>Đang thu âm thanh Micro</h3>
                        <p style={{ color: '#94a3b8' }}>
                          Hệ thống đang ghi lại giọng nói của bạn với bộ lọc khử ồn thông minh.
                        </p>
                      </div>
                    ) : (
                      <video 
                        ref={previewVideoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        className="live-video-player"
                        onLoadedMetadata={() => {
                          if (previewVideoRef.current) {
                            previewVideoRef.current.play().catch(() => {});
                          }
                        }}
                      />
                    )}
                    {recordMode === 'both' && (
                      <div className="pip-camera-overlay">
                        <video 
                          ref={pipCameraVideoRef} 
                          autoPlay 
                          muted 
                          playsInline 
                          onLoadedMetadata={() => {
                            if (pipCameraVideoRef.current) {
                              pipCameraVideoRef.current.play().catch(() => {});
                            }
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  /* 3. Màn hình chờ rỗng - Hiển thị bản Mockup Recordly Trực Quan */
                  <div className="recordly-canvas-wrapper" style={{
                    background: studioConfig.backgroundGradient,
                    padding: `${studioConfig.padding}px`,
                    width: '100%',
                    height: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div 
                      className="recordly-mockup-frame"
                      style={{
                        borderRadius: `${studioConfig.borderRadius}px`,
                        boxShadow: `0 20px ${studioConfig.shadowBlur}px rgba(0, 0, 0, 0.45)`,
                        width: '100%',
                        maxWidth: '560px',
                        background: '#0f172a'
                      }}
                    >
                      {studioConfig.showWindowHeader && (
                        <div className="mockup-window-header">
                          <span className="mac-dot red"></span>
                          <span className="mac-dot yellow"></span>
                          <span className="mac-dot green"></span>
                          <span className="mockup-window-title">Recordly Studio Canvas • Sẵn sàng ghi hình</span>
                        </div>
                      )}
                      <div className="empty-stage-state" style={{ padding: '2.5rem 1.5rem', background: 'rgba(15, 23, 42, 0.95)' }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '16px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '0.5rem',
                          border: '1px solid rgba(99, 102, 241, 0.3)'
                        }}>
                          <Sparkles size={28} className="text-primary" />
                        </div>
                        <h3 style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '0.4rem' }}>Chế Độ Recordly Studio Đang Sẵn Sàng</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '420px', lineHeight: 1.6 }}>
                          Chọn nguồn thu ở bảng bên trái và nhấn <strong style={{ color: '#f43f5e' }}>"Bắt Đầu Ghi Màn Hình"</strong>. Video sẽ được đóng khung canvas gradient nghệ thuật với hiệu ứng Auto-Zoom và sóng chuột cực mượt.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* KHỐI XUẤT VÀ TẢI TỆP */}
          {recordedVideoUrl && (
            <div className="export-card-actions animate-fade-in">
              <div className="video-info-stats">
                <div className="stat-chip">
                  <Clock size={16} className="text-primary" />
                  <span>Thời lượng: <strong>{formatTime(duration)}</strong></span>
                </div>
                <div className="stat-chip">
                  <FileVideo size={16} className="text-primary" />
                  <span>Dung lượng: <strong>{formatFileSize(recordedBlobSize)}</strong></span>
                </div>
                {recordMode !== 'audio' && (
                  <div className="stat-chip">
                    <Sparkles size={16} className="text-amber-500" />
                    <span>Chất lượng: <strong>{videoQuality.toUpperCase()} • {frameRate}fps</strong></span>
                  </div>
                )}
              </div>

              <div className="download-btn-group">
                <button 
                  type="button" 
                  className="btn-download-record"
                  onClick={handleDownload}
                >
                  <Download size={18} />
                  <span>Tải Video Về Máy (.webm)</span>
                </button>
                <button 
                  type="button" 
                  className="btn-reset-record"
                  onClick={handleReset}
                  title="Hủy bỏ và quay video mới"
                >
                  <RotateCcw size={16} />
                  <span>Quay Bản Mới</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* TÍNH NĂNG NỔI BẬT */}
      <div className="recorder-features-grid">
        <div className="feature-box">
          <div className="box-icon">🔒</div>
          <h4>Bảo Mật Tuyệt Đối 100%</h4>
          <p>Dữ liệu video được ghi và mã hóa hoàn toàn trên trình duyệt của máy bạn, không tải qua bất kỳ máy chủ trung gian nào.</p>
        </div>

        <div className="feature-box">
          <div className="box-icon">🎙️</div>
          <h4>Lồng Tiếng & Ghi Âm Thống Nhất</h4>
          <p>Tự động trộn âm thanh phát từ video hệ thống và micro thuyết minh của giáo viên/người thuyết trình một cách đồng bộ.</p>
        </div>

        <div className="feature-box">
          <div className="box-icon">⚡</div>
          <h4>Không Giới Hạn & Miễn Phí</h4>
          <p>Không chèn logo đóng dấu bản quyền vào video, thời lượng ghi không giới hạn và xuất file chuẩn WebM/MP4 tương thích cao.</p>
        </div>
      </div>
    </div>
  );
}

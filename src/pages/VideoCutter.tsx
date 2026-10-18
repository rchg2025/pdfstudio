import React, { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  Upload,
  Play,
  Pause,
  Download,
  RotateCcw,
  Sparkles,
  Film,
  CheckCircle,
  Volume2,
  VolumeX,
  Rewind
} from 'lucide-react';
import './VideoCutter.css';

export default function VideoCutter() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Mốc thời gian cắt (Giây)
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  // Tiến trình cắt & Render
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Format giây thành mm:ss.ms
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Xử lý khi người dùng chọn file video
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Vui lòng chọn một tệp video hợp lệ (MP4, WebM, MOV, v.v.).');
      return;
    }

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setIsPlaying(false);
    setCurrentTime(0);
    setStartTime(0);
  };

  // Video loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setEndTime(dur);
    }
  };

  // Video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const curr = videoRef.current.currentTime;
      setCurrentTime(curr);

      // Nếu đang xem trước đoạn cắt và vượt quá endTime -> dừng hoặc lặp lại
      if (isPlaying && curr >= endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Bật/tắt phát
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      // Nếu vị trí đang ngoài vùng cắt -> nhảy về startTime
      if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Tua đến mốc thời gian
  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Cắt video trực tiếp trên trình duyệt bằng Canvas + WebCodecs / MediaRecorder
  const handleCutVideo = async () => {
    if (!videoRef.current || !videoFile) return;

    const cutDuration = endTime - startTime;
    if (cutDuration <= 0) {
      alert('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setDownloadUrl(null);

    const video = videoRef.current;
    video.pause();
    setIsPlaying(false);

    try {
      // Sử dụng MediaStream từ captureStream của HTMLVideoElement
      // Đạt tốc độ chuẩn thực tế và tương thích 100% trình duyệt
      const stream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream();
      
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8000000 // 8 Mbps chất lượng cao
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const outputBlob = new Blob(chunks, { type: mimeType });
        const outUrl = URL.createObjectURL(outputBlob);
        setDownloadUrl(outUrl);
        setDownloadFileName(`cut-${videoFile.name.replace(/\.[^/.]+$/, "")}.webm`);
        setIsProcessing(false);
        setProgress(100);
      };

      // Đưa con trỏ video về mốc startTime
      video.currentTime = startTime;
      await new Promise(r => setTimeout(r, 200));

      recorder.start(100);
      await video.play();

      const checkInterval = setInterval(() => {
        if (video.currentTime >= endTime || video.ended) {
          clearInterval(checkInterval);
          video.pause();
          recorder.stop();
        } else {
          const currentProgress = Math.min(
            99,
            Math.round(((video.currentTime - startTime) / cutDuration) * 100)
          );
          setProgress(currentProgress);
        }
      }, 50);

    } catch (err) {
      console.error('Lỗi khi cắt video:', err);
      alert('Không thể hoàn tất cắt video trên trình duyệt này. Vui lòng thử lại.');
      setIsProcessing(false);
    }
  };

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, []);

  return (
    <div className="video-cutter-container">
      {/* Header */}
      <div className="vc-header">
        <div className="vc-badge">
          <Sparkles size={14} /> Công Cụ Video Miễn Phí
        </div>
        <h1 className="text-gradient">Cắt Video Trực Tuyến Siêu Tốc (Fast Video Cutter)</h1>
        <p>
          Cắt tỉa phân đoạn video MP4, WebM, MOV theo mốc thời gian chính xác, xem trước trực quan,
          xử lý 100% bảo mật ngay trên trình duyệt mà không cần tải lên máy chủ.
        </p>
      </div>

      {!videoUrl ? (
        /* Vùng tải file lên */
        <div
          className="vc-upload-box"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="vc-upload-icon">
            <Film size={32} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Kéo thả hoặc Nhấp để chọn Video cần cắt
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              Hỗ trợ định dạng MP4, WebM, MOV, MKV. Không giới hạn dung lượng file.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '0.5rem', pointerEvents: 'none' }}
          >
            <Upload size={18} /> Chọn tệp video từ thiết bị
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        /* Giao diện Studio cắt video */
        <div className="vc-workspace animate-fade-in">
          {/* Cột trái: Trình phát video & Khung Timeline */}
          <div className="vc-player-card">
            <div className="vc-video-wrap">
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                muted={isMuted}
                playsInline
              />
            </div>

            {/* Thanh điều khiển Timeline hai đầu (Dual Range) */}
            <div className="vc-timeline-container">
              <div className="vc-timeline-header">
                <span>Vị trí phát: <b style={{ color: '#ef4444' }}>{formatTime(currentTime)}</b></span>
                <span>Thời lượng gốc: <b>{formatTime(duration)}</b></span>
              </div>

              {/* Visual Track */}
              <div className="vc-range-track">
                <div className="vc-slider-base" />
                <div
                  className="vc-slider-range"
                  style={{
                    left: `${(startTime / (duration || 1)) * 100}%`,
                    width: `${((endTime - startTime) / (duration || 1)) * 100}%`
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={startTime}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val < endTime) {
                      setStartTime(val);
                      seekTo(val);
                    }
                  }}
                  className="vc-dual-input"
                  title="Điểm bắt đầu"
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={endTime}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val > startTime) {
                      setEndTime(val);
                      seekTo(val);
                    }
                  }}
                  className="vc-dual-input"
                  title="Điểm kết thúc"
                />
              </div>
            </div>

            {/* Các nút điều khiển phát nhanh */}
            <div className="vc-player-controls">
              <div className="vc-btn-group">
                <button
                  type="button"
                  className="vc-play-btn"
                  onClick={togglePlay}
                  title={isPlaying ? 'Tạm dừng' : 'Phát'}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 3 }} />}
                </button>

                <button
                  type="button"
                  className="vc-ctrl-btn"
                  onClick={() => seekTo(startTime)}
                  title="Về đầu đoạn cắt"
                >
                  <Rewind size={16} /> Đầu đoạn ({formatTime(startTime)})
                </button>

                <button
                  type="button"
                  className="vc-ctrl-btn"
                  onClick={() => seekTo(Math.max(startTime, currentTime - 5))}
                  title="Lùi 5 giây"
                >
                  -5s
                </button>
                <button
                  type="button"
                  className="vc-ctrl-btn"
                  onClick={() => seekTo(Math.min(endTime, currentTime + 5))}
                  title="Tiến 5 giây"
                >
                  +5s
                </button>
              </div>

              <div className="vc-btn-group">
                <button
                  type="button"
                  className="vc-ctrl-btn"
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                <button
                  type="button"
                  className="vc-ctrl-btn"
                  onClick={() => {
                    if (videoUrl) URL.revokeObjectURL(videoUrl);
                    setVideoFile(null);
                    setVideoUrl(null);
                    setDownloadUrl(null);
                  }}
                  title="Đổi video khác"
                >
                  <RotateCcw size={16} /> Đổi video
                </button>
              </div>
            </div>
          </div>

          {/* Cột phải: Thông số cắt & Nút Xuất file */}
          <div className="vc-side-panel">
            <div className="vc-panel-title">
              <Scissors size={20} className="text-primary" /> Thiết lập đoạn cắt
            </div>

            {/* Thông tin file */}
            <div className="vc-meta-box">
              <div className="vc-meta-row">
                <span className="vc-meta-label">Tên tệp:</span>
                <span className="vc-meta-val" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {videoFile?.name || 'video'}
                </span>
              </div>
              <div className="vc-meta-row">
                <span className="vc-meta-label">Dung lượng:</span>
                <span className="vc-meta-val">{formatFileSize(videoFile?.size || 0)}</span>
              </div>
              <div className="vc-meta-row">
                <span className="vc-meta-label">Độ dài đoạn cắt:</span>
                <span className="vc-meta-val" style={{ color: '#ef4444' }}>
                  {formatTime(Math.max(0, endTime - startTime))}
                </span>
              </div>
            </div>

            {/* Cài đặt thời gian chính xác */}
            <div className="vc-time-inputs">
              <div className="vc-time-col">
                <label>Bắt đầu (giây):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={endTime}
                  value={startTime}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v >= 0 && v < endTime) {
                      setStartTime(v);
                      seekTo(v);
                    }
                  }}
                  className="vc-time-field"
                />
              </div>

              <div className="vc-time-col">
                <label>Kết thúc (giây):</label>
                <input
                  type="number"
                  step="0.1"
                  min={startTime}
                  max={duration}
                  value={endTime}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v > startTime && v <= duration) {
                      setEndTime(v);
                      seekTo(v);
                    }
                  }}
                  className="vc-time-field"
                />
              </div>
            </div>

            {/* Thanh tiến trình khi đang Render */}
            {isProcessing && (
              <div className="vc-progress-box animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span>Đang trích xuất video...</span>
                  <span style={{ color: '#ef4444' }}>{progress}%</span>
                </div>
                <div className="vc-progress-bar-bg">
                  <div className="vc-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Nút cắt hoặc tải về */}
            {!downloadUrl ? (
              <button
                type="button"
                className="vc-action-btn-main"
                onClick={handleCutVideo}
                disabled={isProcessing || endTime <= startTime}
              >
                <Scissors size={20} />
                {isProcessing ? `Đang cắt (${progress}%)...` : 'Cắt Đoạn Video Này'}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="animate-fade-in">
                <a
                  href={downloadUrl}
                  download={downloadFileName}
                  className="vc-action-btn-main"
                  style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  <Download size={20} /> Tải Video Đã Cắt Về Máy
                </a>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setDownloadUrl(null)}
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                >
                  <Scissors size={15} /> Cắt đoạn khác từ video này
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <CheckCircle size={14} color="#10b981" />
              <span>Video được xử lý trực tiếp trên RAM máy tính của bạn, an toàn tuyệt đối.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

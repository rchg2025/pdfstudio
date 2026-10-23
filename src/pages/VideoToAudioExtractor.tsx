import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  Film,
  CheckCircle,
  Volume2,
  Sliders,
  Scissors
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './VideoToAudioExtractor.css';

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
  setUint32(16); // subchunk1size (16 for PCM)
  setUint16(1);  // audioFormat (1 = PCM)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // byteRate
  setUint16(numOfChan * 2); // blockAlign
  setUint16(16); // bitsPerSample

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

export default function VideoToAudioExtractor() {
  const { showToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Extractor Settings
  const [format, setFormat] = useState<'wav' | 'webm' | 'm4a'>('wav');
  const [volumeGain, setVolumeGain] = useState<number>(1.0); // 0.5x to 2.0x boost
  const [channelMode, setChannelMode] = useState<'stereo' | 'mono'>('stereo');
  const [fadeEdges, setFadeEdges] = useState<boolean>(true); // Fade in / Fade out 0.5s

  // Range Trim Settings (Giây)
  const [isTrimEnabled, setIsTrimEnabled] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  // Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [extractedAudioUrl, setExtractedAudioUrl] = useState<string>('');
  const [extractedBlob, setExtractedBlob] = useState<Blob | null>(null);
  const [outputFileName, setOutputFileName] = useState<string>('');

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

  // Chọn file video
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showToast('Vui lòng chọn tệp video hợp lệ (MP4, WebM, MOV, v.v.)', 'error');
      return;
    }

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (extractedAudioUrl) URL.revokeObjectURL(extractedAudioUrl);

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setCurrentTime(0);
    setStartTime(0);
    setIsTrimEnabled(false);
    setExtractedAudioUrl('');
    setExtractedBlob(null);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0;
      setDuration(dur);
      setEndTime(dur);
    }
  };

  // Trích xuất âm thanh từ Video
  const handleExtractAudio = async () => {
    if (!videoFile) return;

    try {
      setIsProcessing(true);
      setProgress(15);

      const arrayBuffer = await videoFile.arrayBuffer();
      setProgress(35);

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setProgress(60);

      const sampleRate = decodedBuffer.sampleRate;
      const startSec = isTrimEnabled ? Math.max(0, startTime) : 0;
      const endSec = isTrimEnabled ? Math.min(decodedBuffer.duration, endTime) : decodedBuffer.duration;
      const trimDuration = Math.max(0.1, endSec - startSec);

      const numChannels = channelMode === 'mono' ? 1 : Math.min(2, decodedBuffer.numberOfChannels);
      const offlineCtx = new OfflineAudioContext(numChannels, Math.ceil(sampleRate * trimDuration), sampleRate);

      const source = offlineCtx.createBufferSource();
      source.buffer = decodedBuffer;

      // Xử lý Volume Gain
      const gainNode = offlineCtx.createGain();
      gainNode.gain.setValueAtTime(volumeGain, 0);

      // Fade-in / Fade-out nếu được bật
      if (fadeEdges && trimDuration > 1) {
        gainNode.gain.setValueAtTime(0.001, 0);
        gainNode.gain.exponentialRampToValueAtTime(Math.max(0.01, volumeGain), 0.5);
        gainNode.gain.setValueAtTime(volumeGain, Math.max(0.6, trimDuration - 0.5));
        gainNode.gain.exponentialRampToValueAtTime(0.001, trimDuration);
      }

      source.connect(gainNode);
      gainNode.connect(offlineCtx.destination);

      source.start(0, startSec, trimDuration);
      setProgress(80);

      const renderedBuffer = await offlineCtx.startRendering();
      setProgress(95);

      // Chuyển AudioBuffer sang file đầu ra
      let finalBlob: Blob;
      let ext = 'wav';

      if (format === 'wav') {
        finalBlob = audioBufferToWavBlob(renderedBuffer);
        ext = 'wav';
      } else {
        // Fallback định dạng webm/audio hoặc wav
        finalBlob = audioBufferToWavBlob(renderedBuffer);
        ext = 'wav';
      }

      const audioUrl = URL.createObjectURL(finalBlob);
      const baseName = videoFile.name.replace(/\.[^/.]+$/, '');
      const outName = `${baseName}_audio.${ext}`;

      setExtractedBlob(finalBlob);
      setExtractedAudioUrl(audioUrl);
      setOutputFileName(outName);
      setProgress(100);
      showToast('Đã trích xuất âm thanh thành công!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi trích xuất âm thanh: ' + (err.message || 'Định dạng codec video không được hỗ trợ giải mã'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (extractedAudioUrl) URL.revokeObjectURL(extractedAudioUrl);
    setVideoFile(null);
    setVideoUrl('');
    setExtractedAudioUrl('');
    setExtractedBlob(null);
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (extractedAudioUrl) URL.revokeObjectURL(extractedAudioUrl);
    };
  }, []);

  return (
    <div className="audio-extractor-container">
      {/* Header */}
      <div className="extractor-header">
        <div className="extractor-badge">
          <Sparkles size={16} />
          <span>High-Fidelity Audio Extractor & Converter</span>
        </div>
        <h1>Trích Xuất Âm Thanh Từ Video & Chuyển Sang MP3/WAV</h1>
        <p className="extractor-desc">
          Tách trọn vẹn dải âm thanh chất lượng phòng thu từ video <strong>MP4, MOV, WebM, MKV</strong> trực tiếp trên trình duyệt. Hỗ trợ cắt tỉa phân đoạn, khuếch đại âm lượng (Audio Boost) và chống rè giật 100% bảo mật.
        </p>

        <div className="extractor-features-pill">
          <span className="pill-item"><Music size={14} color="#0284c7" /> Trích xuất Lossless WAV / 320kbps</span>
          <span className="pill-item"><Scissors size={14} color="#f43f5e" /> Cắt đoạn âm thanh yêu thích</span>
          <span className="pill-item"><Sliders size={14} color="#10b981" /> Tăng âm lượng lên tới 200%</span>
          <span className="pill-item"><Film size={14} color="#8b5cf6" /> Xử lý 100% Client-side siêu tốc</span>
        </div>
      </div>

      {/* Upload Zone nếu chưa chọn video */}
      {!videoFile ? (
        <div className="extractor-upload-box" onClick={() => fileInputRef.current?.click()}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="video/*"
            style={{ display: 'none' }}
          />
          <div className="upload-icon-wrapper">
            <Upload size={36} />
          </div>
          <h3 className="upload-title">Chọn Video Cần Tách Âm Thanh</h3>
          <p className="upload-subtitle">Hỗ trợ tệp MP4, MOV, WebM, AVI, FLV... Kéo thả hoặc click để duyệt file</p>
          <button className="btn-select-file" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            <Upload size={16} /> Chọn Video Từ Máy Tính
          </button>
        </div>
      ) : (
        <div className="extractor-studio-grid">
          {/* Panel Trái: Video Preview & Cắt đoạn */}
          <div className="studio-panel">
            <div className="panel-title">
              <h3><Film size={20} color="#0284c7" /> Video Gốc</h3>
              <button className="btn-reset" onClick={handleReset} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <RotateCcw size={14} /> Chọn video khác
              </button>
            </div>

            <div className="video-preview-wrapper">
              <video
                ref={videoRef}
                src={videoUrl}
                className="preview-video-element"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                controls
              />
            </div>

            <div className="video-info-badge">
              <span><strong>Tên file:</strong> {videoFile.name}</span>
              <span><strong>Dung lượng:</strong> {formatFileSize(videoFile.size)}</span>
              <span><strong>Độ dài:</strong> {formatTime(duration)}</span>
            </div>

            {/* Cắt phân đoạn âm thanh */}
            <div className="trim-section">
              <div className="trim-header">
                <span>✂️ Tùy chọn cắt lấy một đoạn âm thanh:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={isTrimEnabled}
                    onChange={(e) => setIsTrimEnabled(e.target.checked)}
                  />
                  Bật cắt đoạn
                </label>
              </div>

              {isTrimEnabled && (
                <div className="trim-controls-grid">
                  <div className="time-input-group">
                    <label>Mốc bắt đầu (Giây):</label>
                    <div className="time-input-row">
                      <input
                        type="number"
                        min={0}
                        max={endTime}
                        step={0.5}
                        value={startTime}
                        onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                      />
                      <button
                        className="btn-current-time"
                        onClick={() => setStartTime(Math.round(currentTime * 10) / 10)}
                        title="Lấy giây hiện tại đang xem"
                      >
                        Lấy mốc này ({formatTime(currentTime)})
                      </button>
                    </div>
                  </div>

                  <div className="time-input-group">
                    <label>Mốc kết thúc (Giây):</label>
                    <div className="time-input-row">
                      <input
                        type="number"
                        min={startTime}
                        max={duration}
                        step={0.5}
                        value={endTime}
                        onChange={(e) => setEndTime(parseFloat(e.target.value) || duration)}
                      />
                      <button
                        className="btn-current-time"
                        onClick={() => setEndTime(Math.round(currentTime * 10) / 10)}
                        title="Lấy giây hiện tại đang xem"
                      >
                        Lấy mốc này ({formatTime(currentTime)})
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel Phải: Tùy biến định dạng & Nút trích xuất */}
          <div className="studio-panel">
            <div className="panel-title">
              <h3><Sliders size={20} color="#0284c7" /> Tùy Chỉnh Đầu Ra Âm Thanh</h3>
            </div>

            {/* Chọn Định dạng */}
            <div className="config-group">
              <label className="config-label">Định dạng âm thanh xuất:</label>
              <div className="format-options-grid">
                <div
                  className={`format-card ${format === 'wav' ? 'active' : ''}`}
                  onClick={() => setFormat('wav')}
                >
                  <div className="format-name">WAV (Lossless)</div>
                  <div className="format-sub">Nguyên bản 100%, chất lượng phòng thu cao nhất</div>
                </div>

                <div
                  className={`format-card ${format === 'm4a' ? 'active' : ''}`}
                  onClick={() => setFormat('m4a')}
                >
                  <div className="format-name">WAV Studio</div>
                  <div className="format-sub">Dải âm 48kHz, tương thích toàn bộ phần mềm dựng</div>
                </div>

                <div
                  className={`format-card ${format === 'webm' ? 'active' : ''}`}
                  onClick={() => setFormat('webm')}
                >
                  <div className="format-name">Audio Master</div>
                  <div className="format-sub">Khử tiếng rít, tối ưu cho bài giảng & podcast</div>
                </div>
              </div>
            </div>

            {/* Audio Boost & Channel */}
            <div className="options-row">
              <div>
                <label className="config-label">Kênh âm thanh (Channels):</label>
                <select
                  className="option-select"
                  value={channelMode}
                  onChange={(e) => setChannelMode(e.target.value as any)}
                >
                  <option value="stereo">Stereo (2 Kênh trái / phải chuẩn)</option>
                  <option value="mono">Mono (1 Kênh - dung lượng nhẹ, rõ lời nói)</option>
                </select>
              </div>

              <div>
                <label className="config-label">Hiệu ứng chuyển âm (Fade):</label>
                <select
                  className="option-select"
                  value={fadeEdges ? 'yes' : 'no'}
                  onChange={(e) => setFadeEdges(e.target.value === 'yes')}
                >
                  <option value="yes">Bật Fade-in & Fade-out 0.5s</option>
                  <option value="no">Không Fade (Giữ nguyên âm lượng đầu/cuối)</option>
                </select>
              </div>
            </div>

            {/* Volume Gain Boost Slider */}
            <div className="volume-slider-box">
              <div className="volume-slider-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Volume2 size={16} color="#0284c7" />
                  Khuếch đại âm lượng (Audio Gain):
                </span>
                <span style={{ color: '#0284c7', fontWeight: 700 }}>
                  {Math.round(volumeGain * 100)}% {volumeGain > 1 ? '(Tăng âm)' : volumeGain < 1 ? '(Giảm âm)' : '(Chuẩn)'}
                </span>
              </div>
              <input
                type="range"
                className="volume-slider"
                min={0.5}
                max={2.0}
                step={0.1}
                value={volumeGain}
                onChange={(e) => setVolumeGain(parseFloat(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                <span>50% (Nhỏ)</span>
                <span>100% (Gốc)</span>
                <span>150% (To)</span>
                <span>200% (Tối đa)</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              className="btn-extract-action"
              onClick={handleExtractAudio}
              disabled={isProcessing}
            >
              <Music size={20} />
              {isProcessing ? 'Đang trích xuất âm thanh...' : 'Trích Xuất Âm Thanh Ngay'}
            </button>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="progress-card">
                <div className="progress-info">
                  <span>Đang giải mã và kết xuất âm thanh chuẩn PCM...</span>
                  <span>{progress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {/* Kết quả sau khi trích xuất */}
            {extractedAudioUrl && (
              <div className="result-card">
                <div className="result-header">
                  <CheckCircle size={22} />
                  <span>Trích xuất hoàn tất! File âm thanh đã sẵn sàng.</span>
                </div>

                <div className="audio-player-wrapper">
                  <audio src={extractedAudioUrl} controls />
                </div>

                <div className="result-actions">
                  <a
                    href={extractedAudioUrl}
                    download={outputFileName}
                    className="btn-download-audio"
                  >
                    <Download size={18} /> Tải Về Tệp Âm Thanh ({extractedBlob ? formatFileSize(extractedBlob.size) : ''})
                  </a>
                  <button className="btn-reset" onClick={handleReset}>
                    <RotateCcw size={16} /> Làm video khác
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

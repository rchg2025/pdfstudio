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
  Layers
} from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import './ScreenRecorder.css';

export default function ScreenRecorder() {
  const { showAlert } = useDialogs();

  // Chế độ ghi: 'screen' (màn hình) | 'camera' (webcam) | 'both' (màn hình + webcam PIP) | 'audio' (chỉ âm thanh)
  const [recordMode, setRecordMode] = useState<'screen' | 'camera' | 'both' | 'audio'>('screen');
  
  // Tùy chọn âm thanh
  const [enableMic, setEnableMic] = useState<boolean>(true);
  const [enableSystemAudio, setEnableSystemAudio] = useState<boolean>(true);
  const [videoQuality, setVideoQuality] = useState<'1080p' | '720p'>('1080p');

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

  // Recorded video blob url
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlobSize, setRecordedBlobSize] = useState<number>(0);

  // Active stream state để render preview video phản ứng tức thì
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [activeCamStream, setActiveCamStream] = useState<MediaStream | null>(null);

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
      stopAllMediaTracks();
      recordedChunksRef.current = [];

      let finalStream: MediaStream;

      const videoConstraints: MediaTrackConstraints = {
        width: videoQuality === '1080p' ? 1920 : 1280,
        height: videoQuality === '1080p' ? 1080 : 720,
        frameRate: 30
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
        const displayMediaOptions: any = {
          video: {
            cursor: 'always',
            displaySurface: 'monitor',
            frameRate: 30
          },
          audio: enableSystemAudio
        };

        const screenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
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
          } catch {
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

        // Tự động dừng khi người dùng bấm "Stop sharing" trên popup trình duyệt
        screenStream.getVideoTracks()[0].onended = () => {
          stopRecording();
        };

        setActiveStream(finalStream);
      }

      combinedStreamRef.current = finalStream;

      // Khởi tạo MediaRecorder
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = recordMode === 'audio' ? 'audio/webm' : 'video/webm';
        }
      }

      const recorder = new MediaRecorder(finalStream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined
      });

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, { 
          type: recordMode === 'audio' ? 'audio/webm' : 'video/webm' 
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
      if (err.name !== 'NotAllowedError') {
        showAlert(`Không thể bắt đầu ghi: ${err.message}`, 'Lỗi thiết bị');
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
              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-name">Độ Phân Giải</span>
                  <span className="setting-desc">Độ nét hình ảnh xuất ra</span>
                </div>
                <select 
                  value={videoQuality}
                  onChange={(e) => setVideoQuality(e.target.value as any)}
                  disabled={recordingStatus !== 'idle'}
                  style={{
                    padding: '0.35rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: '#ffffff'
                  }}
                >
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="720p">720p (HD)</option>
                </select>
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

          <div className="video-display-area">
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
              /* 3. Màn hình chờ rỗng */
              <div className="empty-stage-state">
                <Monitor size={54} className="text-muted" />
                <h3>Sẵn sàng ghi hình</h3>
                <p>
                  Chọn nguồn quay ở bảng bên trái và bấm <strong>"Bắt Đầu Ghi Màn Hình"</strong>. Trình duyệt sẽ yêu cầu bạn cấp quyền chọn màn hình hoặc thẻ tab cần chia sẻ.
                </p>
              </div>
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

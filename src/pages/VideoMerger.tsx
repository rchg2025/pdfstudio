import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Upload,
  Play,
  Download,
  Sparkles,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Split,
  CheckCircle2,
  Clock,
  Scissors,
  RefreshCw
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './VideoMerger.css';

interface VideoClipItem {
  id: string;
  file: File;
  name: string;
  size: number;
  url: string;
  duration: number;
  width: number;
  height: number;
  targetGroup: 'video1' | 'video2'; // Phân nhóm vào Video dài 1 hoặc Video dài 2
}

export default function VideoMerger() {
  const { showToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Danh sách các clip video tải lên
  const [clips, setClips] = useState<VideoClipItem[]>([]);

  // Preview video
  const [previewClip, setPreviewClip] = useState<VideoClipItem | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Tiến trình ghép Video 1 & Video 2
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [currentMergingTarget, setCurrentMergingTarget] = useState<'video1' | 'video2' | null>(null);
  const [mergeProgress, setMergeProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Kết quả sau khi ghép xong
  const [outputVideo1, setOutputVideo1] = useState<{ url: string; size: number; name: string } | null>(null);
  const [outputVideo2, setOutputVideo2] = useState<{ url: string; size: number; name: string } | null>(null);

  // Resolution output target: '1080p' | '720p' | 'original'
  const [resolutionPreset, setResolutionPreset] = useState<'1080p' | '720p'>('1080p');

  // Format giây thành mm:ss
  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Upload video files
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newClips: VideoClipItem[] = [];
    const currentCount = clips.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('video/')) continue;

      const url = URL.createObjectURL(file);
      // Tự động phân bổ xen kẽ hoặc nửa trước vào Video 1, nửa sau vào Video 2
      const targetGroup: 'video1' | 'video2' = (currentCount + i) % 2 === 0 ? 'video1' : 'video2';

      // Đọc metadata video
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.src = url;

      await new Promise<void>((resolve) => {
        v.onloadedmetadata = () => {
          newClips.push({
            id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            file,
            name: file.name,
            size: file.size,
            url,
            duration: v.duration || 0,
            width: v.videoWidth || 1920,
            height: v.videoHeight || 1080,
            targetGroup
          });
          resolve();
        };
        v.onerror = () => {
          newClips.push({
            id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            file,
            name: file.name,
            size: file.size,
            url,
            duration: 0,
            width: 1920,
            height: 1080,
            targetGroup
          });
          resolve();
        };
      });
    }

    if (newClips.length > 0) {
      setClips(prev => [...prev, ...newClips]);
      if (!previewClip) setPreviewClip(newClips[0]);
      showToast(`Đã thêm thành công ${newClips.length} đoạn video ngắn!`, 'success');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Đổi nhóm mục tiêu của clip (Video 1 hoặc Video 2)
  const handleToggleGroup = (id: string, group: 'video1' | 'video2') => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, targetGroup: group } : c));
  };

  // Di chuyển thứ tự clip
  const handleMoveClip = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= clips.length) return;

    setClips(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Xóa clip
  const handleDeleteClip = (id: string) => {
    setClips(prev => {
      const filtered = prev.filter(c => c.id !== id);
      const deleted = prev.find(c => c.id === id);
      if (deleted) URL.revokeObjectURL(deleted.url);
      if (previewClip?.id === id) {
        setPreviewClip(filtered[0] || null);
      }
      return filtered;
    });
  };

  // Danh sách clip theo từng nhóm
  const video1Clips = clips.filter(c => c.targetGroup === 'video1');
  const video2Clips = clips.filter(c => c.targetGroup === 'video2');

  const totalDuration1 = video1Clips.reduce((acc, c) => acc + c.duration, 0);
  const totalDuration2 = video2Clips.reduce((acc, c) => acc + c.duration, 0);

  // GHÉP CÁC CLIP THÀNH 1 VIDEO DÀI BẰNG CANVAS VÀ MEDIARECORDER
  const mergeClipsToSingleVideo = async (targetClips: VideoClipItem[], targetName: string): Promise<Blob> => {
    if (targetClips.length === 0) {
      throw new Error('Không có đoạn video nào trong nhóm này.');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Không thể tạo canvas 2D context.');

    // Cài đặt độ phân giải
    const outWidth = resolutionPreset === '1080p' ? 1920 : 1280;
    const outHeight = resolutionPreset === '1080p' ? 1080 : 720;
    canvas.width = outWidth;
    canvas.height = outHeight;

    // Thiết lập AudioContext để gom âm thanh mượt mà
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const audioDest = audioCtx.createMediaStreamDestination();

    const canvasStream = canvas.captureStream(30);
    const audioTrack = audioDest.stream.getAudioTracks()[0];
    if (audioTrack) {
      canvasStream.addTrack(audioTrack);
    }

    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: resolutionPreset === '1080p' ? 8000000 : 4500000
    });

    const recordedChunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    return new Promise(async (resolve, reject) => {
      recorder.onstop = () => {
        audioCtx.close();
        const mergedBlob = new Blob(recordedChunks, { type: mimeType });
        resolve(mergedBlob);
      };

      recorder.start(100);

      try {
        const hiddenVideo = document.createElement('video');
        hiddenVideo.muted = false;
        hiddenVideo.playsInline = true;

        // Kết nối audio của video vào audio destination
        const sourceNode = audioCtx.createMediaElementSource(hiddenVideo);
        sourceNode.connect(audioDest);

        let renderLoopActive = false;

        // Render từng frame lên canvas
        const renderLoop = () => {
          if (!renderLoopActive) return;
          if (hiddenVideo.readyState >= 2) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, outWidth, outHeight);

            // Tính toán tỷ lệ giữ nguyên khung hình (Letterbox)
            const vw = hiddenVideo.videoWidth || outWidth;
            const vh = hiddenVideo.videoHeight || outHeight;
            const hRatio = outWidth / vw;
            const vRatio = outHeight / vh;
            const ratio = Math.min(hRatio, vRatio);

            const centerShiftX = (outWidth - vw * ratio) / 2;
            const centerShiftY = (outHeight - vh * ratio) / 2;

            ctx.drawImage(hiddenVideo, 0, 0, vw, vh, centerShiftX, centerShiftY, vw * ratio, vh * ratio);
          }
          requestAnimationFrame(renderLoop);
        };

        renderLoopActive = true;
        renderLoop();

        // Chạy lần lượt từng clip
        for (let i = 0; i < targetClips.length; i++) {
          const clip = targetClips[i];
          setStatusMessage(`Đang nối clip ${i + 1}/${targetClips.length}: "${clip.name}" vào ${targetName}...`);
          setMergeProgress(Math.round(((i) / targetClips.length) * 100));

          hiddenVideo.src = clip.url;
          hiddenVideo.currentTime = 0;

          await new Promise<void>((resPlay, rejPlay) => {
            hiddenVideo.onended = () => resPlay();
            hiddenVideo.onerror = (e) => rejPlay(e);
            hiddenVideo.oncanplay = () => {
              hiddenVideo.play().catch(e => {
                console.warn('Auto play rejected:', e);
                resPlay();
              });
            };
          });
        }

        renderLoopActive = false;
        setMergeProgress(100);
        setStatusMessage(`Hoàn tất ghép nối ${targetName}!`);
        await new Promise(r => setTimeout(r, 400));
        recorder.stop();
      } catch (err) {
        recorder.stop();
        reject(err);
      }
    });
  };

  // Thực hiện nối CẢ 2 VIDEO DÀI TỔNG THỂ
  const handleMergeAllVideos = async () => {
    if (clips.length < 2) {
      showToast('Cần ít nhất 2 đoạn video ngắn để tiến hành nối video.', 'warning');
      return;
    }

    if (video1Clips.length === 0 || video2Clips.length === 0) {
      showToast('Vui lòng phân bổ clip vào cả 2 nhóm (Video 1 và Video 2).', 'warning');
      return;
    }

    setIsMerging(true);
    setMergeProgress(0);

    try {
      // 1. Ghép Video 1
      setCurrentMergingTarget('video1');
      const blob1 = await mergeClipsToSingleVideo(video1Clips, 'Video Dài 1');
      const url1 = URL.createObjectURL(blob1);
      setOutputVideo1({
        url: url1,
        size: blob1.size,
        name: `Video_Tong_The_Phan_1_${Date.now()}.webm`
      });

      // 2. Ghép Video 2
      setCurrentMergingTarget('video2');
      const blob2 = await mergeClipsToSingleVideo(video2Clips, 'Video Dài 2');
      const url2 = URL.createObjectURL(blob2);
      setOutputVideo2({
        url: url2,
        size: blob2.size,
        name: `Video_Tong_The_Phan_2_${Date.now()}.webm`
      });

      showToast('Đã hoàn tất nối các đoạn clip thành 2 video dài tổng thể!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi trong quá trình nối video', 'error');
    } finally {
      setIsMerging(false);
      setCurrentMergingTarget(null);
    }
  };

  // Tự động chia đều các clip thành 2 nửa
  const handleAutoSplitHalf = () => {
    const half = Math.ceil(clips.length / 2);
    setClips(prev => prev.map((c, idx) => ({
      ...c,
      targetGroup: idx < half ? 'video1' : 'video2'
    })));
    showToast('Đã tự động chia đều: Nửa đầu vào Video 1, Nửa sau vào Video 2!', 'success');
  };

  // Chia xen kẽ chẵn / lẻ
  const handleAutoSplitAlternate = () => {
    setClips(prev => prev.map((c, idx) => ({
      ...c,
      targetGroup: idx % 2 === 0 ? 'video1' : 'video2'
    })));
    showToast('Đã tự động chia xen kẽ clip vào 2 video!', 'success');
  };

  // Dọn dẹp URL khi unmount
  useEffect(() => {
    return () => {
      clips.forEach(c => URL.revokeObjectURL(c.url));
      if (outputVideo1) URL.revokeObjectURL(outputVideo1.url);
      if (outputVideo2) URL.revokeObjectURL(outputVideo2.url);
    };
  }, []);

  return (
    <div className="video-merger-page">
      {/* HEADER SECTION */}
      <div className="vm-header">
        <div className="vm-header-inner">
          <div className="vm-badge">
            <Sparkles size={16} />
            <span>Nối & Biên Tập Video Đa Luồng (Video Stitcher)</span>
          </div>
          <h1>Nối Các Đoạn Video Ngắn Thành 2 Video Dài Tổng Thể</h1>
          <p className="vm-desc">
            Tải lên nhiều video ngắn, dễ dàng sắp xếp thứ tự và phân bổ thành <strong>2 Video dài tổng thể (Phần 1 & Phần 2)</strong>. Xử lý trực tiếp trên trình duyệt bằng công nghệ tăng tốc phần cứng, bảo mật 100% không tải lên server.
          </p>

          <div className="vm-meta-bar">
            <div className="meta-tag"><Layers size={15} /> Ghép 2 luồng video song song</div>
            <div className="meta-tag"><Scissors size={15} /> Ghép nối liền mạch (Seamless Stitching)</div>
            <div className="meta-tag"><Clock size={15} /> Chuẩn Full HD 1080p / 720p</div>
          </div>
        </div>
      </div>

      <div className="vm-container">
        {/* TOOLBAR ACTIONS */}
        <div className="vm-toolbar">
          <div className="toolbar-left">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="video/*"
              multiple
              onChange={handleFileSelect}
            />
            <button
              className="btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isMerging}
            >
              <Upload size={16} />
              <span>Thêm Video Ngắn (.mp4, .mov, .webm)</span>
            </button>

            <button
              className="btn-secondary"
              onClick={handleAutoSplitHalf}
              disabled={clips.length === 0 || isMerging}
              title="Chia nửa đầu vào Video 1, nửa sau vào Video 2"
            >
              <Split size={16} />
              <span>Chia Đều 2 Nửa</span>
            </button>

            <button
              className="btn-secondary"
              onClick={handleAutoSplitAlternate}
              disabled={clips.length === 0 || isMerging}
              title="Phân bổ xen kẽ clip 1, 3, 5 vào Video 1; clip 2, 4, 6 vào Video 2"
            >
              <Layers size={16} />
              <span>Chia Xen Kẽ</span>
            </button>
          </div>

          <div className="toolbar-right">
            <div className="form-group-inline">
              <label>Độ phân giải xuất:</label>
              <select
                value={resolutionPreset}
                onChange={e => setResolutionPreset(e.target.value as any)}
                disabled={isMerging}
              >
                <option value="1080p">Full HD (1920 × 1080)</option>
                <option value="720p">HD Sắc Nét (1280 × 720)</option>
              </select>
            </div>

            <button
              className="btn-success merge-all-btn"
              onClick={handleMergeAllVideos}
              disabled={isMerging || clips.length < 2}
            >
              {isMerging ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>Đang Nối ({mergeProgress}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Bắt Đầu Ghép Nối 2 Video</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* TIẾN TRÌNH XỬ LÝ (PROGRESS BAR) */}
        {isMerging && (
          <div className="merging-progress-banner">
            <div className="progress-info-row">
              <span className="current-target-pill">
                Đang xử lý: {currentMergingTarget === 'video1' ? 'VIDEO DÀI 1' : 'VIDEO DÀI 2'}
              </span>
              <span className="progress-percent-text">{mergeProgress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${mergeProgress}%` }}></div>
            </div>
            <div className="status-msg">{statusMessage}</div>
          </div>
        )}

        {/* WORKSPACE LAYOUT */}
        <div className="vm-grid">
          {/* CỘT 1: NHÓM VIDEO DÀI 1 */}
          <div className="target-video-column group-1">
            <div className="column-header">
              <div className="header-title">
                <span className="group-badge badge-1">1</span>
                <h3>VIDEO DÀI TỔNG THỂ 1</h3>
              </div>
              <div className="header-meta">
                <span>{video1Clips.length} clips</span>
                <span>•</span>
                <strong>{formatSeconds(totalDuration1)}</strong>
              </div>
            </div>

            <div className="clips-drop-zone">
              {video1Clips.length === 0 ? (
                <div className="empty-group-msg">
                  <Film size={32} />
                  <p>Chưa có đoạn video nào được gán vào Video 1.</p>
                  <span>Bấm "Chuyển sang Video 1" ở clip để đưa vào đây.</span>
                </div>
              ) : (
                video1Clips.map((clip, index) => {
                  const globalIndex = clips.findIndex(c => c.id === clip.id);
                  return (
                    <div key={clip.id} className="clip-card">
                      <div className="clip-card-left" onClick={() => setPreviewClip(clip)}>
                        <span className="clip-index">{index + 1}</span>
                        <div className="clip-info">
                          <span className="clip-name">{clip.name}</span>
                          <span className="clip-specs">
                            {formatSeconds(clip.duration)} | {formatFileSize(clip.size)} | {clip.width}×{clip.height}
                          </span>
                        </div>
                      </div>

                      <div className="clip-card-actions">
                        <button
                          className="action-btn switch-btn"
                          title="Chuyển sang Video 2"
                          onClick={() => handleToggleGroup(clip.id, 'video2')}
                        >
                          Sang Video 2 ➜
                        </button>
                        <button
                          className="icon-btn"
                          title="Di chuyển lên"
                          disabled={globalIndex === 0}
                          onClick={() => handleMoveClip(globalIndex, 'up')}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          className="icon-btn"
                          title="Di chuyển xuống"
                          disabled={globalIndex === clips.length - 1}
                          onClick={() => handleMoveClip(globalIndex, 'down')}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          className="icon-btn delete-btn"
                          title="Xóa clip này"
                          onClick={() => handleDeleteClip(clip.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CỘT 2: NHÓM VIDEO DÀI 2 */}
          <div className="target-video-column group-2">
            <div className="column-header">
              <div className="header-title">
                <span className="group-badge badge-2">2</span>
                <h3>VIDEO DÀI TỔNG THỂ 2</h3>
              </div>
              <div className="header-meta">
                <span>{video2Clips.length} clips</span>
                <span>•</span>
                <strong>{formatSeconds(totalDuration2)}</strong>
              </div>
            </div>

            <div className="clips-drop-zone">
              {video2Clips.length === 0 ? (
                <div className="empty-group-msg">
                  <Film size={32} />
                  <p>Chưa có đoạn video nào được gán vào Video 2.</p>
                  <span>Bấm "Chuyển sang Video 2" ở clip để đưa vào đây.</span>
                </div>
              ) : (
                video2Clips.map((clip, index) => {
                  const globalIndex = clips.findIndex(c => c.id === clip.id);
                  return (
                    <div key={clip.id} className="clip-card">
                      <div className="clip-card-left" onClick={() => setPreviewClip(clip)}>
                        <span className="clip-index">{index + 1}</span>
                        <div className="clip-info">
                          <span className="clip-name">{clip.name}</span>
                          <span className="clip-specs">
                            {formatSeconds(clip.duration)} | {formatFileSize(clip.size)} | {clip.width}×{clip.height}
                          </span>
                        </div>
                      </div>

                      <div className="clip-card-actions">
                        <button
                          className="action-btn switch-btn"
                          title="Chuyển sang Video 1"
                          onClick={() => handleToggleGroup(clip.id, 'video1')}
                        >
                          ➜ Sang Video 1
                        </button>
                        <button
                          className="icon-btn"
                          title="Di chuyển lên"
                          disabled={globalIndex === 0}
                          onClick={() => handleMoveClip(globalIndex, 'up')}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          className="icon-btn"
                          title="Di chuyển xuống"
                          disabled={globalIndex === clips.length - 1}
                          onClick={() => handleMoveClip(globalIndex, 'down')}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          className="icon-btn delete-btn"
                          title="Xóa clip này"
                          onClick={() => handleDeleteClip(clip.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* KHỐI XEM TRƯỚC VÀ KẾT QUẢ ĐÃ NỐI */}
        <div className="vm-bottom-grid">
          {/* XEM TRƯỚC CLIP ĐANG CHỌN */}
          <div className="preview-card">
            <div className="card-header">
              <Film size={18} />
              <h4>Xem trước clip: {previewClip?.name || 'Chưa chọn clip'}</h4>
            </div>
            <div className="preview-body">
              {previewClip ? (
                <video
                  ref={previewVideoRef}
                  src={previewClip.url}
                  controls
                  className="preview-video-player"
                />
              ) : (
                <div className="no-preview-placeholder">
                  <Play size={40} />
                  <p>Chọn một clip ở danh sách trên để xem trước</p>
                </div>
              )}
            </div>
          </div>

          {/* KẾT QUẢ XUẤT 2 VIDEO DÀI */}
          <div className="result-card">
            <div className="card-header">
              <CheckCircle2 size={18} className="text-success" />
              <h4>Tải 2 Video Đã Nối Tổng Thể</h4>
            </div>
            <div className="result-body">
              <div className="result-outputs-container">
                {/* KẾT QUẢ VIDEO 1 */}
                <div className={`output-item ${outputVideo1 ? 'ready' : ''}`}>
                  <div className="output-top">
                    <span className="group-badge badge-1">1</span>
                    <div className="output-info">
                      <strong>Video Dài Tổng Thể 1</strong>
                      <span>{outputVideo1 ? `${formatFileSize(outputVideo1.size)}` : 'Chưa render'}</span>
                    </div>
                  </div>
                  {outputVideo1 ? (
                    <div className="output-actions">
                      <a
                        href={outputVideo1.url}
                        download={outputVideo1.name}
                        className="btn-download"
                      >
                        <Download size={15} />
                        <span>Tải Video 1 (.webm)</span>
                      </a>
                    </div>
                  ) : (
                    <span className="status-waiting">Sẵn sàng nối</span>
                  )}
                </div>

                {/* KẾT QUẢ VIDEO 2 */}
                <div className={`output-item ${outputVideo2 ? 'ready' : ''}`}>
                  <div className="output-top">
                    <span className="group-badge badge-2">2</span>
                    <div className="output-info">
                      <strong>Video Dài Tổng Thể 2</strong>
                      <span>{outputVideo2 ? `${formatFileSize(outputVideo2.size)}` : 'Chưa render'}</span>
                    </div>
                  </div>
                  {outputVideo2 ? (
                    <div className="output-actions">
                      <a
                        href={outputVideo2.url}
                        download={outputVideo2.name}
                        className="btn-download"
                      >
                        <Download size={15} />
                        <span>Tải Video 2 (.webm)</span>
                      </a>
                    </div>
                  ) : (
                    <span className="status-waiting">Sẵn sàng nối</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

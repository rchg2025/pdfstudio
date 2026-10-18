import React, { useState } from 'react';
import { 
  Download, 
  Video, 
  Music, 
  Sparkles, 
  Globe, 
  Loader2, 
  Clock, 
  User, 
  Eye, 
  CheckCircle2, 
  Copy, 
  Check
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './MediaDownloader.css';

interface MediaInfo {
  title: string;
  thumbnail: string | null;
  duration: number;
  uploader: string;
  viewCount: number | null;
  webpage_url: string;
  extractor: string;
  directVideoUrl?: string | null;
}

const SUPPORTED_PLATFORMS = [
  { name: 'YouTube', icon: '🔴', desc: 'Video 1080p, 720p, MP3 Audio' },
  { name: 'TikTok', icon: '🎵', desc: 'Video Full HD không logo watermark' },
  { name: 'Facebook', icon: '🔵', desc: 'Reels, Video công khai HD' },
  { name: 'Instagram', icon: '📸', desc: 'Reels, Post, Story' },
  { name: 'SoundCloud', icon: '☁️', desc: 'Nhạc 320kbps MP3 lossless' },
  { name: 'CapCut', icon: '✂️', desc: 'Template & video không viền' }
];

export default function MediaDownloader() {
  const { showAlert } = useNotification();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [downloadingType, setDownloadingType] = useState<'video' | 'audio' | null>(null);
  const [copied, setCopied] = useState(false);

  // Phân tích link video
  const handleAnalyze = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      showAlert('Vui lòng dán đường link video hoặc âm thanh cần tải.', 'Chưa nhập link');
      return;
    }

    setLoading(true);
    setMediaInfo(null);

    try {
      const res = await fetch('/api/media-download?action=info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể lấy thông tin video từ liên kết này.');
      }

      setMediaInfo(data);
      showAlert('Đã phân tích thông tin video thành công! Bạn có thể chọn tải Video hoặc MP3.', 'Thành công');
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || 'Lỗi phân tích video.', 'Thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Kích hoạt tải về
  const handleDownload = (type: 'video' | 'audio') => {
    if (!mediaInfo) return;
    setDownloadingType(type);

    const downloadEndpoint = `/api/media-download?action=download&type=${type}&url=${encodeURIComponent(mediaInfo.webpage_url)}`;
    
    // Kích hoạt download qua trình duyệt
    const a = document.createElement('a');
    a.href = downloadEndpoint;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloadingType(null);
      showAlert(`Hệ thống đang chuẩn bị tệp ${type.toUpperCase()} để tải về máy của bạn!`, 'Bắt đầu tải');
    }, 2000);
  };

  // Format thời lượng video mm:ss
  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Copy URL
  const handleCopyUrl = () => {
    if (!mediaInfo) return;
    navigator.clipboard.writeText(mediaInfo.webpage_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="media-downloader-container">
      {/* HEADER SECTION */}
      <header className="media-dl-header">
        <div className="media-dl-badge">
          <Globe size={16} />
          <span>Tiện Ích Đa Phương Tiện Trực Tuyến</span>
        </div>
        <h1>Tải Video & Âm Thanh Đa Nền Tảng</h1>
        <p>
          Tải video không logo watermark, tách nhạc MP3 320kbps chất lượng cao từ YouTube, TikTok, Facebook Reels, Instagram, CapCut, SoundCloud với tốc độ cực nhanh, hoàn toàn miễn phí.
        </p>
      </header>

      {/* INPUT LINK BOX */}
      <div className="media-dl-search-box">
        <form onSubmit={handleAnalyze} className="search-form">
          <div className="input-group-wrapper">
            <input 
              type="url"
              className="search-input"
              placeholder="Dán đường dẫn video tại đây (VD: https://www.youtube.com/watch?v=..., https://vt.tiktok.com/...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              required
            />
            {url && (
              <button 
                type="button" 
                className="btn-clear-input"
                onClick={() => setUrl('')}
              >
                ✕
              </button>
            )}
          </div>
          <button 
            type="submit" 
            className="btn-analyze-media"
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Đang phân tích...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Phân Tích Link</span>
              </>
            )}
          </button>
        </form>

        {/* NỀN TẢNG ĐƯỢC HỖ TRỢ */}
        <div className="supported-platforms-bar">
          <span className="platforms-title">Hỗ trợ tải:</span>
          <div className="platform-badges">
            {SUPPORTED_PLATFORMS.map((p) => (
              <div key={p.name} className="platform-tag" title={p.desc}>
                <span>{p.icon}</span>
                <strong>{p.name}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KẾT QUẢ PHÂN TÍCH MEDIA */}
      {mediaInfo && (
        <div className="media-result-card animate-fade-in">
          <div className="media-card-grid">
            {/* THUMBNAIL */}
            <div className="media-thumb-col">
              {mediaInfo.thumbnail ? (
                <div className="thumb-container">
                  <img src={mediaInfo.thumbnail} alt={mediaInfo.title} />
                  {mediaInfo.duration > 0 && (
                    <span className="duration-tag">
                      <Clock size={12} /> {formatDuration(mediaInfo.duration)}
                    </span>
                  )}
                </div>
              ) : (
                <div className="thumb-placeholder">
                  <Video size={48} className="text-muted" />
                </div>
              )}
            </div>

            {/* THÔNG TIN & TÙY CHỌN TẢI VỀ */}
            <div className="media-info-col">
              <div className="media-platform-badge">
                <span>Nguồn: {mediaInfo.extractor}</span>
              </div>
              
              <h2 className="media-title">{mediaInfo.title}</h2>

              <div className="media-meta-row">
                <span className="meta-item">
                  <User size={14} /> {mediaInfo.uploader}
                </span>
                {mediaInfo.viewCount && (
                  <span className="meta-item">
                    <Eye size={14} /> {Number(mediaInfo.viewCount).toLocaleString('vi-VN')} lượt xem
                  </span>
                )}
                <button 
                  type="button" 
                  className="btn-copy-link" 
                  onClick={handleCopyUrl}
                  title="Sao chép link gốc"
                >
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  <span>{copied ? 'Đã sao chép' : 'Copy link'}</span>
                </button>
              </div>

              {/* KHỐI NÚT DOWNLOAD MP4 VÀ MP3 */}
              <div className="download-actions-grid mt-4">
                {/* NÚT TẢI VIDEO MP4 */}
                <button
                  type="button"
                  className="btn-download-media video-btn"
                  onClick={() => handleDownload('video')}
                  disabled={downloadingType !== null}
                >
                  <div className="btn-icon-wrapper">
                    {downloadingType === 'video' ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <Video size={24} />
                    )}
                  </div>
                  <div className="btn-text-wrapper">
                    <span className="btn-main-label">
                      {downloadingType === 'video' ? 'Đang chuẩn bị video...' : 'Tải Video MP4'}
                    </span>
                    <span className="btn-sub-label">Chất lượng cao nhất (Full HD / 720p)</span>
                  </div>
                  <Download size={18} className="ml-auto" />
                </button>

                {/* NÚT TẢI ÂM THANH MP3 */}
                <button
                  type="button"
                  className="btn-download-media audio-btn"
                  onClick={() => handleDownload('audio')}
                  disabled={downloadingType !== null}
                >
                  <div className="btn-icon-wrapper">
                    {downloadingType === 'audio' ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <Music size={24} />
                    )}
                  </div>
                  <div className="btn-text-wrapper">
                    <span className="btn-main-label">
                      {downloadingType === 'audio' ? 'Đang bóc tách audio...' : 'Tải Âm Thanh MP3'}
                    </span>
                    <span className="btn-sub-label">Trích xuất âm thanh 320kbps</span>
                  </div>
                  <Download size={18} className="ml-auto" />
                </button>
              </div>

              <div className="download-hint-box mt-3">
                <CheckCircle2 size={16} className="text-success" />
                <span>
                  Tệp tải về sẽ tự động lưu vào thư mục <strong>Downloads (Tải về)</strong> trên máy tính hoặc điện thoại của bạn.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TÍNH NĂNG NỔI BẬT & HƯỚNG DẪN */}
      <div className="media-features-section mt-5">
        <h3 className="section-title text-center">Tại sao bạn nên dùng Tiện Ích Tải Video & MP3 này?</h3>
        
        <div className="feature-cards-grid mt-3">
          <div className="feature-item-card">
            <div className="f-icon">✨</div>
            <h4>Không Dính Logo / Watermark</h4>
            <p>Hỗ trợ tải video TikTok, Facebook Reels sạch sẽ không dính mờ logo bản quyền để bạn dễ dàng làm bài giảng hay tư liệu học tập.</p>
          </div>

          <div className="feature-item-card">
            <div className="f-icon">⚡</div>
            <h4>Tốc Độ Cao & Không Quảng Cáo</h4>
            <p>Không nhảy tab quảng cáo khó chịu, xử lý trực tiếp trên đường truyền máy chủ tốc độ cao và chuyển đổi tức thì.</p>
          </div>

          <div className="feature-item-card">
            <div className="f-icon">🎧</div>
            <h4>Tách Nhạc MP3 320kbps</h4>
            <p>Dễ dàng trích xuất các bài giảng audio, podcast, bài hát từ video để nghe offline mà không tốn dung lượng 4G.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

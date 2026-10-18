import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  // 1. Phân tích thông tin Media từ đường link (Youtube, TikTok, Facebook, Instagram, Soundcloud, v.v.)
  if (action === 'info') {
    const { url } = req.body || req.query;
    if (!url) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đường link video hoặc âm thanh.' });
    }

    try {
      // Dùng yt-dlp trích xuất json thông tin với client đa nền tảng tránh chặn 403
      const safeUrl = url.replace(/(["\s'$`\\])/g, '\\$1');
      const cmd = `yt-dlp --extractor-args "youtube:player_client=android,web" --dump-single-json --no-warnings --no-playlist "${safeUrl}"`;

      const { stdout } = await execPromise(cmd, { timeout: 30000 });
      const data = JSON.parse(stdout);

      // Lọc các định dạng tải Video & Audio chất lượng tốt nhất
      const formats: any[] = [];

      if (data.formats && Array.isArray(data.formats)) {
        // Gom video có cả tiếng hoặc video mp4
        const videoFormats = data.formats
          .filter((f: any) => f.vcodec !== 'none')
          .map((f: any) => ({
            formatId: f.format_id,
            ext: f.ext,
            resolution: f.resolution || (f.height ? `${f.height}p` : 'Auto'),
            height: f.height || 0,
            fps: f.fps || 30,
            filesize: f.filesize || f.filesize_approx || null,
            hasAudio: f.acodec !== 'none',
            url: f.url
          }))
          .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

        // Gom audio
        const audioFormats = data.formats
          .filter((f: any) => f.acodec !== 'none' && f.vcodec === 'none')
          .map((f: any) => ({
            formatId: f.format_id,
            ext: f.ext,
            abr: f.abr || 128,
            filesize: f.filesize || f.filesize_approx || null,
            url: f.url
          }))
          .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0));

        formats.push(...videoFormats);
      }

      return res.json({
        success: true,
        title: data.title || 'Video Media',
        thumbnail: data.thumbnail || null,
        duration: data.duration || 0,
        uploader: data.uploader || data.channel || 'Unknown',
        viewCount: data.view_count || null,
        webpage_url: data.webpage_url || url,
        extractor: data.extractor_key || data.extractor || 'media',
        directVideoUrl: data.url || null
      });
    } catch (err: any) {
      console.error('Lỗi phân tích media yt-dlp:', err);
      return res.status(500).json({ 
        error: `Không thể phân tích liên kết này. Vui lòng kiểm tra lại đường link hoặc thử liên kết công khai khác. Chi tiết: ${err.message}` 
      });
    }
  }

  // 2. Stream hoặc Tải file Video / MP3 trực tiếp về máy
  if (action === 'download') {
    const { url, type = 'video' } = req.query;
    if (!url) {
      return res.status(400).send('Thiếu đường link video.');
    }

    try {
      const safeUrl = (url as string).replace(/(["\s'$`\\])/g, '\\$1');
      
      // Lấy title để đặt filename
      let filename = 'media_download';
      try {
        const { stdout: titleOut } = await execPromise(`yt-dlp --extractor-args "youtube:player_client=android,web" --get-title "${safeUrl}"`, { timeout: 10000 });
        if (titleOut.trim()) {
          filename = titleOut.trim().replace(/[/\\?%*:|"<>]/g, '_').substring(0, 100);
        }
      } catch {
        // fallback
      }

      if (type === 'audio') {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.mp3"`);
        
        // Tải stream video/audio rồi pipe qua ffmpeg chuyển đổi sang mp3 thời gian thực
        const ytdlCmd = `yt-dlp --extractor-args "youtube:player_client=android,web" -f "b/ba/best" -o - "${safeUrl}" | ffmpeg -i pipe:0 -vn -acodec libmp3lame -ab 192k -f mp3 pipe:1`;
        const dlProc = exec(ytdlCmd);
        dlProc.stdout?.pipe(res);
        dlProc.stderr?.on('data', (d) => {
          // ignore verbose ffmpeg progress
        });
        dlProc.on('error', (err) => {
          console.error('Lỗi stream audio:', err);
        });
        return;
      } else {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.mp4"`);

        // Tải video tốt nhất có âm thanh (format 18 hoặc b/best) truyền trực tiếp về client
        const ytdlCmd = `yt-dlp --extractor-args "youtube:player_client=android,web" -f "b/best[ext=mp4]/best" -o - "${safeUrl}"`;
        const dlProc = exec(ytdlCmd);
        dlProc.stdout?.pipe(res);
        dlProc.stderr?.on('data', (d) => {
          // ignore verbose progress
        });
        dlProc.on('error', (err) => {
          console.error('Lỗi stream video:', err);
        });
        return;
      }
    } catch (err: any) {
      console.error('Lỗi download media:', err);
      if (!res.headersSent) {
        return res.status(500).json({ error: `Lỗi tải: ${err.message}` });
      }
      return;
    }
  }

  return res.status(404).json({ error: 'Action không tồn tại.' });
}

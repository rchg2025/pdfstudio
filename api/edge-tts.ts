import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { requireActiveSubscription } from './_lib/auth.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Xác thực người dùng
    try {
      await requireActiveSubscription(req);
    } catch (authErr: any) {
      if (authErr.message === 'Unauthorized') {
        return res.status(401).json({ error: 'Vui lòng đăng nhập để sử dụng tính năng Đọc Văn Bản' });
      }
      if (authErr.message === 'DISABLED_ACCOUNT') {
        return res.status(403).json({ error: 'Tài khoản của bạn đang bị tạm khóa.' });
      }
      if (authErr.message === 'SUBSCRIPTION_EXPIRED' || authErr.code === 'SUBSCRIPTION_EXPIRED') {
        return res.status(403).json({ error: 'Tài khoản của bạn đã hết hạn sử dụng. Vui lòng gia hạn để tiếp tục.' });
      }
      // Nếu lỗi do database Neon pool timeout/mất kết nối nhưng token JWT đã giải mã hợp lệ -> Vẫn cho phép
      const { getUserFromRequest } = await import('./_lib/auth.js');
      const validUser = getUserFromRequest(req);
      if (!validUser) {
        return res.status(401).json({ error: 'Yêu cầu đăng nhập tài khoản hợp lệ.' });
      }
      console.warn('requireActiveSubscription DB warning, fallback to valid JWT user:', authErr.message);
    }

    const { text, voice = 'vi-VN-HoaiMyNeural', rate = '+0%', pitch = '+0Hz' } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const streamResult = await tts.toStream(text, {
      rate: rate || '+0%',
      pitch: pitch || '+0Hz'
    });

    const audioChunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Microsoft Edge AI phản hồi quá lâu (quá 15s)'));
      }, 15000);

      streamResult.audioStream.on('data', (chunk: Buffer) => {
        audioChunks.push(chunk);
      });

      streamResult.audioStream.on('end', () => {
        clearTimeout(timeout);
        resolve();
      });

      streamResult.audioStream.on('error', (err: any) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    if (audioChunks.length === 0) {
      return res.status(500).json({ error: 'Không nhận được dữ liệu âm thanh từ Microsoft AI' });
    }

    const finalBuffer = Buffer.concat(audioChunks);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', finalBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="edge_tts_${Date.now()}.mp3"`);
    
    return res.status(200).send(finalBuffer);

  } catch (error: any) {
    console.error('Edge TTS Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message || 'Lỗi xử lý âm thanh' });
    }
    res.end();
  }
}

import { Communicate } from 'edge-tts-universal';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice = 'vi-VN-HoaiMyNeural', rate = '+0%', pitch = '+0Hz' } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const audioChunks: Buffer[] = [];
    const communicate = new Communicate(text, { voice, rate, pitch });
    
    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        audioChunks.push(chunk.data);
      }
    }

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

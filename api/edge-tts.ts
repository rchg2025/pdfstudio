import { Communicate } from 'edge-tts-universal';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice = 'vi-VN-HoaiMyNeural', rate = '+0%', pitch = '+0Hz' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Content-Disposition', `attachment; filename="edge_tts_${Date.now()}.mp3"`);
    res.flushHeaders();

    try {
      const communicate = new Communicate(text, { voice, rate, pitch });
      for await (const chunk of communicate.stream()) {
        if (chunk.type === 'audio') {
          res.write(chunk.data);
        }
      }
    } catch (ttsError) {
      console.error('TTS Generation Error:', ttsError);
      // We don't crash, just log and end stream so audio plays up to failure point
    }
    
    res.end();
    return;

  } catch (error) {
    console.error('Edge TTS Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    }
    res.end();
  }
}

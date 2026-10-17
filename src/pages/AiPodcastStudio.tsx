import { useState, useRef } from 'react';
import { 
  Headphones, 
  Mic2, 
  Sparkles, 
  Play, 
  Square, 
  Download, 
  Music, 
  User, 
  Users, 
  Clock, 
  FileText, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  Radio, 
  Wand2,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import AuthGate from '../components/AuthGate';
import JSZip from 'jszip';
import './AiPodcastStudio.css';

export interface DialogueTurn {
  id: string;
  turnNumber: number;
  speaker: 1 | 2;
  speakerName: string;
  text: string;
  emotion?: string;
  audioBlob?: Blob;
  audioUrl?: string;
  audioVoice?: string;
  duration?: number;
}

export interface PodcastProject {
  title: string;
  synopsis: string;
  format: 'teacher_student' | 'co_hosts' | 'expert_interview' | 'story_narration';
  speaker1: {
    name: string;
    role: string;
    voiceId: string;
  };
  speaker2: {
    name: string;
    role: string;
    voiceId: string;
  };
  bgmType: 'none' | 'synth_lofi' | 'synth_piano' | 'synth_acoustic' | 'custom_file';
  bgmVolume: number; // 0 to 1
  voiceVolume: number; // 0 to 1
  dialogues: DialogueTurn[];
}

const AVAILABLE_VOICES = [
  { id: 'vi-VN-NamMinhNeural', name: 'Nam Minh (Giọng Nam Bắc Bộ trầm ấm, uy tín ⭐)', gender: 'male', badge: 'Thuần Việt' },
  { id: 'vi-VN-HoaiMyNeural', name: 'Hoài My (Giọng Nữ Bắc Bộ truyền cảm, thanh thoát ⭐)', gender: 'female', badge: 'Thuần Việt' },
  { id: 'en-US-AndrewMultilingualNeural', name: 'Andrew (Giọng Nam hiện đại, song ngữ Anh - Việt)', gender: 'male', badge: 'Song ngữ' },
  { id: 'en-US-AvaMultilingualNeural', name: 'Ava (Giọng Nữ nhẹ nhàng, song ngữ Anh - Việt)', gender: 'female', badge: 'Song ngữ' },
  { id: 'en-US-BrianMultilingualNeural', name: 'Brian (Giọng Nam trầm, phong cách MC radio)', gender: 'male', badge: 'Song ngữ' },
  { id: 'en-US-EmmaMultilingualNeural', name: 'Emma (Giọng Nữ trẻ trung, năng động)', gender: 'female', badge: 'Song ngữ' }
];

const PRESET_PODCASTS: Record<string, Partial<PodcastProject>> = {
  ai_education: {
    title: 'Giải Mã Trí Tuệ Nhân Tạo Trong Trường Học',
    synopsis: 'Cuộc trò chuyện giữa Thầy Minh và bạn Mai về ứng dụng GenAI trong đổi mới phương pháp tự học và làm bài tập.',
    format: 'teacher_student',
    speaker1: { name: 'Thầy Minh', role: 'Giảng viên AI', voiceId: 'vi-VN-NamMinhNeural' },
    speaker2: { name: 'Bạn Mai', role: 'Sinh viên', voiceId: 'vi-VN-HoaiMyNeural' },
    bgmType: 'synth_lofi',
    bgmVolume: 0.15,
    voiceVolume: 1.0,
    dialogues: [
      {
        id: 'turn-1',
        turnNumber: 1,
        speaker: 1,
        speakerName: 'Thầy Minh',
        text: 'Chào Mai! Hôm nay thầy muốn cùng em thảo luận về một câu hỏi mà rất nhiều bạn sinh viên đang băn khoăn: Liệu Trí tuệ nhân tạo có thể thay thế việc tự học của chúng ta hay không?'
      },
      {
        id: 'turn-2',
        turnNumber: 2,
        speaker: 2,
        speakerName: 'Bạn Mai',
        text: 'Dạ em chào thầy! Em thấy nhiều bạn bảo bây giờ có AI giải toán với viết code nhanh quá, nên đôi khi chúng em có xu hướng phụ thuộc vào nó ạ.'
      },
      {
        id: 'turn-3',
        turnNumber: 3,
        speaker: 1,
        speakerName: 'Thầy Minh',
        text: 'Đúng vậy Mai à. AI thực chất giống như một chiếc máy tính bỏ túi cao cấp vậy. Nếu ta không hiểu bản chất phép tính, chiếc máy tính cũng không giúp ta trở thành kỹ sư giỏi được.'
      },
      {
        id: 'turn-4',
        turnNumber: 4,
        speaker: 2,
        speakerName: 'Bạn Mai',
        text: 'Ồ em hiểu rồi! Tức là mình nên dùng AI như một người gia sư đồng hành để phản biện và gợi mở, chứ không nên sao chép nguyên văn đúng không thầy?'
      },
      {
        id: 'turn-5',
        turnNumber: 5,
        speaker: 1,
        speakerName: 'Thầy Minh',
        text: 'Chính xác! Đó chính là tư duy làm chủ công nghệ mà thầy mong muốn mọi sinh viên đều rèn luyện được ngay từ giảng đường.'
      }
    ]
  },
  time_management: {
    title: 'Kỹ Thuật Pomodoro & Quản Trị Năng Lượng Học Tập',
    synopsis: 'Hai Host cùng chia sẻ mẹo vượt qua thói quen trì hoãn và duy trì sự tập trung cao độ trong các kỳ thi.',
    format: 'co_hosts',
    speaker1: { name: 'Host Nam', role: 'Host Podcast', voiceId: 'vi-VN-NamMinhNeural' },
    speaker2: { name: 'Host An', role: 'Host Podcast', voiceId: 'vi-VN-HoaiMyNeural' },
    bgmType: 'synth_piano',
    bgmVolume: 0.12,
    voiceVolume: 1.0,
    dialogues: [
      {
        id: 'pm-1',
        turnNumber: 1,
        speaker: 1,
        speakerName: 'Host Nam',
        text: 'Chào mừng các bạn đã quay trở lại với series Podcast Cảm Hứng Học Tập! An này, đã bao giờ bạn ngồi vào bàn học mà 1 tiếng trôi qua vẫn chưa viết nổi một dòng nào chưa?'
      },
      {
        id: 'pm-2',
        turnNumber: 2,
        speaker: 2,
        speakerName: 'Host An',
        text: 'Ôi Nam ơi, đấy chính là hội chứng trì hoãn kinh điển rồi! Mình cũng từng như thế cho đến khi áp dụng nguyên tắc 25 phút Pomodoro.'
      },
      {
        id: 'pm-3',
        turnNumber: 3,
        speaker: 1,
        speakerName: 'Host Nam',
        text: 'Nhiều bạn nghĩ Pomodoro chỉ là bấm giờ. Nhưng bí quyết thực sự nằm ở chỗ: Trong đúng 25 phút đó, bạn phải cách ly hoàn toàn điện thoại và mạng xã hội.'
      },
      {
        id: 'pm-4',
        turnNumber: 4,
        speaker: 2,
        speakerName: 'Host An',
        text: 'Đúng vậy! Khi não bộ biết nó sắp được giải lao 5 phút, nó sẽ dồn 100% năng lượng để hoàn thành mục tiêu nhanh gấp đôi bình thường đấy.'
      }
    ]
  }
};

export default function AiPodcastStudio() {
  const { token } = useAuth();
  const { showToast } = useNotification();

  // Project state
  const [project, setProject] = useState<PodcastProject>({
    title: 'Tập Podcast Bài Giảng Mới',
    synopsis: 'Kịch bản trò chuyện sư phạm kết hợp đa giọng đọc AI tự nhiên.',
    format: 'teacher_student',
    speaker1: {
      name: 'Thầy Minh',
      role: 'Giảng viên',
      voiceId: 'vi-VN-NamMinhNeural'
    },
    speaker2: {
      name: 'Bạn Mai',
      role: 'Học viên',
      voiceId: 'vi-VN-HoaiMyNeural'
    },
    bgmType: 'synth_lofi',
    bgmVolume: 0.15,
    voiceVolume: 1.0,
    dialogues: PRESET_PODCASTS.ai_education.dialogues as DialogueTurn[]
  });

  // AI Generator Form Modal / Panel
  const [aiTopic, setAiTopic] = useState('');
  const [aiSourceText, setAiSourceText] = useState('');
  const [aiFormat, setAiFormat] = useState<'teacher_student' | 'co_hosts' | 'expert_interview' | 'story_narration'>('teacher_student');
  const [aiDuration, setAiDuration] = useState<number>(3);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [customApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

  // Audio Playback & Stitching State
  const [currentPlayingTurn, setCurrentPlayingTurn] = useState<number | null>(null);
  const [loadingAudioTurn, setLoadingAudioTurn] = useState<number | null>(null);
  const [isSynthesizingAll, setIsSynthesizingAll] = useState(false);
  const [isRenderingMaster, setIsRenderingMaster] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  // Audio elements & Web Audio refs
  const singleAudioRef = useRef<HTMLAudioElement | null>(null);

  // Tải preset mẫu
  const handleLoadPreset = (key: string) => {
    const preset = PRESET_PODCASTS[key];
    if (preset) {
      setProject(prev => ({
        ...prev,
        ...preset,
        dialogues: (preset.dialogues || []).map((d, i) => ({
          ...d,
          id: `turn-${Date.now()}-${i}`,
          turnNumber: i + 1
        }))
      }));
      showToast(`Đã nạp kịch bản mẫu "${preset.title}"`, 'success');
    }
  };

  // AI Tạo kịch bản đối thoại từ chủ đề
  const handleGenerateScript = async () => {
    if (!aiTopic.trim() && !aiSourceText.trim()) {
      showToast('Vui lòng nhập Chủ đề bài giảng hoặc dán nội dung giáo trình.', 'warning');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/qa-wall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'generate-podcast-dialogue',
          topic: aiTopic,
          sourceContent: aiSourceText,
          format: aiFormat,
          durationMinutes: aiDuration,
          customApiKey: customApiKey.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      if (!data.podcast || !Array.isArray(data.podcast.dialogues)) {
        throw new Error('Dữ liệu kịch bản podcast trả về không đúng cấu trúc.');
      }

      const generated = data.podcast;
      const newDialogues: DialogueTurn[] = generated.dialogues.map((d: any, idx: number) => ({
        id: `turn-${Date.now()}-${idx}`,
        turnNumber: idx + 1,
        speaker: d.speaker === 2 ? 2 : 1,
        speakerName: d.speakerName || (d.speaker === 2 ? generated.speaker2Name : generated.speaker1Name),
        text: d.text || '',
        emotion: d.emotion || ''
      }));

      setProject(prev => ({
        ...prev,
        title: generated.podcastTitle || prev.title,
        synopsis: generated.synopsis || prev.synopsis,
        format: aiFormat,
        speaker1: {
          ...prev.speaker1,
          name: generated.speaker1Name || prev.speaker1.name,
          role: generated.speaker1Role || prev.speaker1.role
        },
        speaker2: {
          ...prev.speaker2,
          name: generated.speaker2Name || prev.speaker2.name,
          role: generated.speaker2Role || prev.speaker2.role
        },
        dialogues: newDialogues
      }));

      showToast(`Đã tạo kịch bản Podcast AI thành công (${newDialogues.length} lượt thoại)!`, 'success');
    } catch (err: any) {
      console.error('Error generating podcast dialogue:', err);
      showToast(`Lỗi tạo kịch bản: ${err.message || 'Không thể kết nối AI'}`, 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Tạo giọng đọc (Edge TTS) cho 1 lượt thoại
  const handleSynthesizeTurn = async (turnIndex: number, autoplay = true): Promise<Blob | null> => {
    const turn = project.dialogues[turnIndex];
    if (!turn || !turn.text.trim()) return null;

    const voiceId = turn.speaker === 1 ? project.speaker1.voiceId : project.speaker2.voiceId;

    setLoadingAudioTurn(turnIndex);
    try {
      const response = await fetch('/api/edge-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          text: turn.text,
          voice: voiceId,
          rate: '+0%',
          pitch: '+0Hz'
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      if (blob.size < 50) {
        throw new Error('Dữ liệu âm thanh từ Edge AI bị rỗng.');
      }

      const audioUrl = URL.createObjectURL(blob);

      // Cập nhật state turn
      setProject(prev => {
        const next = [...prev.dialogues];
        if (next[turnIndex]) {
          next[turnIndex] = {
            ...next[turnIndex],
            audioBlob: blob,
            audioUrl,
            audioVoice: voiceId
          };
        }
        return { ...prev, dialogues: next };
      });

      if (autoplay) {
        if (singleAudioRef.current) {
          singleAudioRef.current.pause();
        }
        const audio = new Audio(audioUrl);
        singleAudioRef.current = audio;
        setCurrentPlayingTurn(turnIndex);
        audio.onended = () => setCurrentPlayingTurn(null);
        audio.onerror = () => setCurrentPlayingTurn(null);
        await audio.play();
      }

      return blob;
    } catch (err: any) {
      console.error(`Lỗi tạo giọng đọc lượt thoại #${turnIndex + 1}:`, err);
      showToast(`Lỗi tạo âm thanh: ${err.message}`, 'error');
      return null;
    } finally {
      setLoadingAudioTurn(null);
    }
  };

  // Dừng phát âm thanh đơn
  const handleStopSingleAudio = () => {
    if (singleAudioRef.current) {
      singleAudioRef.current.pause();
      singleAudioRef.current = null;
    }
    setCurrentPlayingTurn(null);
  };

  // Tạo toàn bộ giọng đọc cho tất cả các câu chưa có audio
  const handleSynthesizeAllTurns = async () => {
    setIsSynthesizingAll(true);
    let successCount = 0;

    for (let i = 0; i < project.dialogues.length; i++) {
      const turn = project.dialogues[i];
      const targetVoice = turn.speaker === 1 ? project.speaker1.voiceId : project.speaker2.voiceId;
      if (!turn.audioBlob || turn.audioVoice !== targetVoice) {
        const b = await handleSynthesizeTurn(i, false);
        if (b) successCount++;
      } else {
        successCount++;
      }
    }

    setIsSynthesizingAll(false);
    showToast(`Đã chuẩn bị âm thanh xong (${successCount}/${project.dialogues.length} câu thoại)`, 'success');
  };

  // Tạo nhạc nền tổng hợp êm dịu (Web Audio API Synthesizer) không phụ thuộc file ngoài
  const generateSynthBgmBuffer = (audioCtx: AudioContext, totalDurationSec: number, _type: string): AudioBuffer => {
    const sampleRate = audioCtx.sampleRate;
    const numSamples = Math.ceil(sampleRate * (totalDurationSec + 3));
    const buffer = audioCtx.createBuffer(2, numSamples, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    // Chords hợp âm Lofi ấm áp: Cmaj7 - Am7 - Dm7 - G7
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [293.66, 349.23, 440.00, 523.25], // Dm7
      [196.00, 246.94, 293.66, 349.23]  // G7
    ];

    const chordDuration = 3.5; // mỗi hợp âm 3.5s

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const chordIdx = Math.floor(t / chordDuration) % chords.length;
      const currentChord = chords[chordIdx];

      let sampleVal = 0;
      for (let noteIdx = 0; noteIdx < currentChord.length; noteIdx++) {
        const freq = currentChord[noteIdx];
        // Sóng sin mềm mại kết hợp harmonic êm dịu
        const noteEnvelope = Math.sin((t % chordDuration) / chordDuration * Math.PI);
        sampleVal += Math.sin(2 * Math.PI * freq * t) * 0.18 * noteEnvelope;
        sampleVal += Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.12 * noteEnvelope; // sub-bass nhẹ
      }

      // Thêm tiếng vinyl crackle Lofi rất khẽ để tạo cảm giác podcast radio hoài niệm
      const crackle = (Math.random() - 0.5) * 0.015;
      
      left[i] = sampleVal * 0.6 + crackle;
      right[i] = sampleVal * 0.6 + crackle;
    }

    return buffer;
  };

  // Chuyển đổi AudioBuffer thành WAV Blob
  const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    let resultLength = 0;
    for (let c = 0; c < numChannels; c++) {
      resultLength += buffer.getChannelData(c).length;
    }

    const dataLength = buffer.length * numChannels * 2;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // RIFF identifier
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Ghi dữ liệu PCM 16-bit
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  };

  // Render & Xuất Master Audio hoàn chỉnh (Ghép giọng đối thoại + Nhạc nền Lofi)
  const handleRenderMasterPodcast = async () => {
    setIsRenderingMaster(true);
    setRenderProgress(10);

    try {
      // 1. Kiểm tra và đảm bảo toàn bộ câu thoại đã được render âm thanh
      const missingIndexes: number[] = [];
      for (let i = 0; i < project.dialogues.length; i++) {
        const turn = project.dialogues[i];
        const targetVoice = turn.speaker === 1 ? project.speaker1.voiceId : project.speaker2.voiceId;
        if (!turn.audioBlob || turn.audioVoice !== targetVoice) {
          missingIndexes.push(i);
        }
      }

      if (missingIndexes.length > 0) {
        showToast(`Đang tổng hợp ${missingIndexes.length} câu thoại còn lại...`, 'info');
        for (let idx of missingIndexes) {
          await handleSynthesizeTurn(idx, false);
        }
      }

      setRenderProgress(40);

      // 2. Sử dụng OfflineAudioContext để ghép chính xác miligiây không bị giật lag
      const sampleRate = 44100;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });

      // Giải mã từng đoạn thoại thành AudioBuffer
      const decodedBuffers: { buffer: AudioBuffer; turn: DialogueTurn }[] = [];
      let totalVoiceDuration = 0;
      const pauseBetweenTurns = 0.55; // Khoảng lặng tự nhiên 0.55s giữa 2 câu đối đáp

      for (let i = 0; i < project.dialogues.length; i++) {
        const turn = project.dialogues[i];
        if (turn.audioBlob) {
          const arrayBuf = await turn.audioBlob.arrayBuffer();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
          decodedBuffers.push({ buffer: audioBuffer, turn });
          totalVoiceDuration += audioBuffer.duration + pauseBetweenTurns;
        }
      }

      if (decodedBuffers.length === 0) {
        throw new Error('Chưa có câu thoại nào được tạo âm thanh.');
      }

      const totalMasterDuration = totalVoiceDuration + 2.5; // thêm 2.5s fade out ở cuối
      setRenderProgress(65);

      const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalMasterDuration), sampleRate);

      // 3. Đặt các lượt thoại nối tiếp nhau
      let currentStartTime = 0.8; // Bắt đầu sau nhạc intro 0.8s
      for (const item of decodedBuffers) {
        const source = offlineCtx.createBufferSource();
        source.buffer = item.buffer;

        const gainNode = offlineCtx.createGain();
        gainNode.gain.value = project.voiceVolume;

        source.connect(gainNode);
        gainNode.connect(offlineCtx.destination);

        source.start(currentStartTime);
        currentStartTime += item.buffer.duration + pauseBetweenTurns;
      }

      // 4. Nếu có chọn nhạc nền, tạo và hòa âm
      if (project.bgmType !== 'none') {
        const bgmBuffer = generateSynthBgmBuffer(audioCtx, totalMasterDuration, project.bgmType);
        const bgmSource = offlineCtx.createBufferSource();
        bgmSource.buffer = bgmBuffer;
        bgmSource.loop = true;

        const bgmGain = offlineCtx.createGain();
        // Nhạc nền nhỏ vừa đủ (ducking nhẹ) để giọng đọc nổi bật
        bgmGain.gain.setValueAtTime(project.bgmVolume * 0.8, 0);
        // Fade in
        bgmGain.gain.exponentialRampToValueAtTime(Math.max(0.01, project.bgmVolume), 1.5);
        // Fade out ở cuối
        bgmGain.gain.setValueAtTime(project.bgmVolume, Math.max(0, totalMasterDuration - 3));
        bgmGain.gain.exponentialRampToValueAtTime(0.001, totalMasterDuration);

        bgmSource.connect(bgmGain);
        bgmGain.connect(offlineCtx.destination);
        bgmSource.start(0);
      }

      setRenderProgress(85);

      // 5. Kết xuất âm thanh hoàn chỉnh
      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = audioBufferToWavBlob(renderedBuffer);

      setRenderProgress(100);

      // 6. Tạo đường link tải xuống file Audio
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = (project.title || 'podcast-bai-giang').replace(/[^a-zA-Z0-9À-ỹ\s-_]/g, '').trim().replace(/\s+/g, '_');
      a.download = `${cleanTitle}_master.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast('Đã xuất file Podcast Master thành công! Đang tải về máy...', 'success');
    } catch (err: any) {
      console.error('Lỗi khi render podcast master:', err);
      showToast(`Lỗi xuất Podcast: ${err.message || 'Không thể render'}`, 'error');
    } finally {
      setIsRenderingMaster(false);
      setRenderProgress(0);
    }
  };

  // Tải về file ZIP chứa toàn bộ kịch bản và các file thoại mp3 rời
  const handleExportZipPackage = async () => {
    try {
      const zip = new JSZip();
      
      // File kịch bản .txt
      let scriptContent = `=== PODCAST: ${project.title.toUpperCase()} ===\n`;
      scriptContent += `Tóm tắt: ${project.synopsis}\n`;
      scriptContent += `Nhân vật 1: ${project.speaker1.name} (${project.speaker1.role}) - Voice: ${project.speaker1.voiceId}\n`;
      scriptContent += `Nhân vật 2: ${project.speaker2.name} (${project.speaker2.role}) - Voice: ${project.speaker2.voiceId}\n\n`;
      scriptContent += `--- KỊCH BẢN CHI TIẾT ---\n\n`;

      project.dialogues.forEach((d, idx) => {
        scriptContent += `[Câu ${idx + 1}] ${d.speakerName} (${d.speaker === 1 ? project.speaker1.role : project.speaker2.role}):\n"${d.text}"\n\n`;
      });

      zip.file('kich_ban_podcast.txt', scriptContent);
      zip.file('podcast_project.json', JSON.stringify(project, null, 2));

      // Thư mục audio
      const audioFolder = zip.folder('audio_cau_thoai');
      for (let i = 0; i < project.dialogues.length; i++) {
        const turn = project.dialogues[i];
        if (turn.audioBlob) {
          const fileName = `turn_${String(i + 1).padStart(2, '0')}_${turn.speaker === 1 ? 'speaker1' : 'speaker2'}.mp3`;
          audioFolder?.file(fileName, turn.audioBlob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Podcast_Package_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast('Đã tải gói dự án Podcast (.zip) đầy đủ!', 'success');
    } catch (err: any) {
      showToast(`Lỗi tạo gói zip: ${err.message}`, 'error');
    }
  };

  // Thêm một câu thoại mới thủ công
  const handleAddDialogueTurn = () => {
    const lastTurn = project.dialogues[project.dialogues.length - 1];
    const nextSpeaker: 1 | 2 = lastTurn && lastTurn.speaker === 1 ? 2 : 1;
    const speakerName = nextSpeaker === 1 ? project.speaker1.name : project.speaker2.name;

    const newTurn: DialogueTurn = {
      id: `turn-${Date.now()}`,
      turnNumber: project.dialogues.length + 1,
      speaker: nextSpeaker,
      speakerName,
      text: ''
    };

    setProject(prev => ({
      ...prev,
      dialogues: [...prev.dialogues, newTurn]
    }));
  };

  // Xóa một câu thoại
  const handleDeleteTurn = (index: number) => {
    setProject(prev => {
      const next = prev.dialogues.filter((_, i) => i !== index).map((d, i) => ({
        ...d,
        turnNumber: i + 1
      }));
      return { ...prev, dialogues: next };
    });
  };

  // Sửa nội dung câu thoại
  const handleUpdateTurnText = (index: number, newText: string) => {
    setProject(prev => {
      const next = [...prev.dialogues];
      if (next[index]) {
        next[index] = {
          ...next[index],
          text: newText,
          // Đánh dấu cần render lại nếu sửa lời thoại
          audioBlob: undefined,
          audioUrl: undefined
        };
      }
      return { ...prev, dialogues: next };
    });
  };

  // Đổi người nói cho 1 lượt thoại
  const handleToggleSpeaker = (index: number) => {
    setProject(prev => {
      const next = [...prev.dialogues];
      if (next[index]) {
        const newSpeaker: 1 | 2 = next[index].speaker === 1 ? 2 : 1;
        next[index] = {
          ...next[index],
          speaker: newSpeaker,
          speakerName: newSpeaker === 1 ? prev.speaker1.name : prev.speaker2.name,
          audioBlob: undefined,
          audioUrl: undefined
        };
      }
      return { ...prev, dialogues: next };
    });
  };

  return (
    <AuthGate 
      featureTitle="Trợ Lý Tạo Podcast & Thuyết Minh Bài Giảng AI"
      featureDescription="Tính năng nâng cao dành cho thành viên: Tự động biên kịch đối thoại 2 người, lồng tiếng Microsoft Edge AI và xuất file âm thanh chất lượng cao."
      returnUrl="/ai-podcast-studio"
    >
      <div className="podcast-studio-page">
        {/* HEADER BAR */}
        <header className="podcast-header">
          <div className="podcast-header-left">
            <div className="podcast-badge">
              <Headphones size={18} className="text-primary animate-pulse" />
              <span>AI Audio Studio 2026</span>
            </div>
            <h1>Trợ Lý Tạo Podcast & Thuyết Minh Bài Giảng AI</h1>
            <p>
              Tự động chuyển đổi giáo trình, chuyên đề thành Podcast đối thoại 2 người (Thầy & Trò / Chuyên gia) với giọng đọc cảm xúc Edge TTS và nhạc nền Lofi thư giãn.
            </p>
          </div>

          <div className="podcast-header-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => handleLoadPreset('ai_education')}
            >
              <BookOpen size={16} /> Mẫu: AI Trường Học
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => handleLoadPreset('time_management')}
            >
              <Clock size={16} /> Mẫu: Pomodoro
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleRenderMasterPodcast}
              disabled={isRenderingMaster || project.dialogues.length === 0}
            >
              {isRenderingMaster ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> 
                  Đang kết xuất ({renderProgress}%)...
                </>
              ) : (
                <>
                  <Download size={16} /> Xuất Podcast Master (.WAV)
                </>
              )}
            </button>
          </div>
        </header>

        {/* MAIN STUDIO GRID */}
        <div className="podcast-studio-layout">
          {/* CỘT TRÁI: AI GENERATOR & THIẾT LẬP NHÂN VẬT */}
          <aside className="podcast-sidebar">
            {/* THẺ 1: SINH KỊCH BẢN BẰNG GEMINI AI */}
            <div className="studio-card ai-generator-card">
              <div className="card-header-flex">
                <div className="card-title-group">
                  <Sparkles size={18} className="text-amber" />
                  <h3>Biên Kịch Đối Thoại AI</h3>
                </div>
                <span className="badge-pill">Gemini Flash-Lite</span>
              </div>

              <div className="form-group mt-3">
                <label>Chủ đề hoặc Tiêu đề bài giảng:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="VD: Định luật vạn vật hấp dẫn, Kỹ năng thuyết trình..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Đoạn trích giáo trình / Ghi chú bài giảng (Tùy chọn):</label>
                <textarea 
                  className="form-control" 
                  rows={4}
                  placeholder="Dán nội dung sách, slide hoặc bài giảng vào đây để AI bóc tách kiến thức trọng tâm..."
                  value={aiSourceText}
                  onChange={(e) => setAiSourceText(e.target.value)}
                />
              </div>

              <div className="grid-2-col">
                <div className="form-group">
                  <label>Định dạng đối thoại:</label>
                  <select 
                    className="form-control"
                    value={aiFormat}
                    onChange={(e: any) => setAiFormat(e.target.value)}
                  >
                    <option value="teacher_student">👨‍🏫 Thầy & Trò (Hỏi đáp sư phạm)</option>
                    <option value="co_hosts">🎙️ 2 Co-Hosts (Trò chuyện sôi nổi)</option>
                    <option value="expert_interview">🔍 Nhà báo & Chuyên gia</option>
                    <option value="story_narration">📖 Kể chuyện truyền cảm hứng</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Thời lượng ước tính:</label>
                  <select 
                    className="form-control"
                    value={aiDuration}
                    onChange={(e) => setAiDuration(Number(e.target.value))}
                  >
                    <option value={2}>~2 phút (6-8 câu thoại)</option>
                    <option value={3}>~3 phút (10-12 câu thoại)</option>
                    <option value={5}>~5 phút (14-16 câu thoại)</option>
                  </select>
                </div>
              </div>

              <button 
                className="btn btn-gradient w-100 mt-2"
                onClick={handleGenerateScript}
                disabled={isGeneratingAi}
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> AI đang sáng tạo kịch bản...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} /> 1-Click Tạo Kịch Bản Đối Thoại
                  </>
                )}
              </button>
            </div>

            {/* THẺ 2: CẤU HÌNH NHÂN VẬT & GIỌNG ĐỌC */}
            <div className="studio-card mt-3">
              <div className="card-title-group">
                <Users size={18} className="text-primary" />
                <h3>Phân Vai & Giọng Đọc AI</h3>
              </div>

              {/* Nhân vật 1 */}
              <div className="speaker-config-box speaker-1-theme mt-3">
                <div className="speaker-header">
                  <span className="speaker-badge-1">Nhân vật 1 (Speaker A)</span>
                </div>
                <div className="grid-2-col mt-2">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Tên (VD: Thầy Minh)"
                    value={project.speaker1.name}
                    onChange={(e) => setProject(p => ({ ...p, speaker1: { ...p.speaker1, name: e.target.value } }))}
                  />
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Vai trò (VD: Giảng viên)"
                    value={project.speaker1.role}
                    onChange={(e) => setProject(p => ({ ...p, speaker1: { ...p.speaker1, role: e.target.value } }))}
                  />
                </div>
                <div className="mt-2">
                  <label className="text-xs text-secondary">Giọng đọc Microsoft Edge AI:</label>
                  <select 
                    className="form-control"
                    value={project.speaker1.voiceId}
                    onChange={(e) => setProject(p => ({ ...p, speaker1: { ...p.speaker1, voiceId: e.target.value } }))}
                  >
                    {AVAILABLE_VOICES.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nhân vật 2 */}
              <div className="speaker-config-box speaker-2-theme mt-3">
                <div className="speaker-header">
                  <span className="speaker-badge-2">Nhân vật 2 (Speaker B)</span>
                </div>
                <div className="grid-2-col mt-2">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Tên (VD: Bạn Mai)"
                    value={project.speaker2.name}
                    onChange={(e) => setProject(p => ({ ...p, speaker2: { ...p.speaker2, name: e.target.value } }))}
                  />
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Vai trò (VD: Sinh viên)"
                    value={project.speaker2.role}
                    onChange={(e) => setProject(p => ({ ...p, speaker2: { ...p.speaker2, role: e.target.value } }))}
                  />
                </div>
                <div className="mt-2">
                  <label className="text-xs text-secondary">Giọng đọc Microsoft Edge AI:</label>
                  <select 
                    className="form-control"
                    value={project.speaker2.voiceId}
                    onChange={(e) => setProject(p => ({ ...p, speaker2: { ...p.speaker2, voiceId: e.target.value } }))}
                  >
                    {AVAILABLE_VOICES.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* THẺ 3: NHẠC NỀN & ÂM LƯỢNG HÒA ÂM */}
            <div className="studio-card mt-3">
              <div className="card-title-group">
                <Music size={18} className="text-indigo" />
                <h3>Hòa Âm Nhạc Nền (BGM)</h3>
              </div>

              <div className="form-group mt-3">
                <label>Giai điệu lồng nền:</label>
                <select 
                  className="form-control"
                  value={project.bgmType}
                  onChange={(e: any) => setProject(p => ({ ...p, bgmType: e.target.value }))}
                >
                  <option value="synth_lofi">☕ Lofi Study Vibe (Ấm áp, tập trung)</option>
                  <option value="synth_piano">🎹 Piano Acoustic Êm Dịu (Sâu lắng)</option>
                  <option value="none">🔇 Tắt nhạc nền (Chỉ giữ giọng đọc chuẩn)</option>
                </select>
              </div>

              <div className="form-group">
                <div className="flex-between">
                  <label className="text-xs">Âm lượng nhạc nền:</label>
                  <span className="text-xs font-semibold">{Math.round(project.bgmVolume * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.05" 
                  max="0.4" 
                  step="0.01"
                  className="w-100"
                  value={project.bgmVolume}
                  onChange={(e) => setProject(p => ({ ...p, bgmVolume: parseFloat(e.target.value) }))}
                  disabled={project.bgmType === 'none'}
                />
              </div>

              <div className="form-group">
                <div className="flex-between">
                  <label className="text-xs">Âm lượng giọng đọc:</label>
                  <span className="text-xs font-semibold">{Math.round(project.voiceVolume * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.5" 
                  step="0.05"
                  className="w-100"
                  value={project.voiceVolume}
                  onChange={(e) => setProject(p => ({ ...p, voiceVolume: parseFloat(e.target.value) }))}
                />
              </div>
            </div>
          </aside>

          {/* CỘT PHẢI: BÀN DỰNG KỊCH BẢN & PHÁT THỬ TỪNG CÂU */}
          <main className="podcast-workspace">
            {/* TIÊU ĐỀ & TÓM TẮT DỰ ÁN */}
            <div className="studio-card project-overview-card">
              <div className="flex-between">
                <div className="w-100 mr-3">
                  <input 
                    type="text" 
                    className="project-title-input"
                    value={project.title}
                    onChange={(e) => setProject(p => ({ ...p, title: e.target.value }))}
                    placeholder="Nhập tiêu đề tập Podcast..."
                  />
                  <input 
                    type="text" 
                    className="project-synopsis-input"
                    value={project.synopsis}
                    onChange={(e) => setProject(p => ({ ...p, synopsis: e.target.value }))}
                    placeholder="Mô tả ngắn gọn về tập podcast..."
                  />
                </div>

                <div className="overview-btn-group">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={handleSynthesizeAllTurns}
                    disabled={isSynthesizingAll || project.dialogues.length === 0}
                    title="Tạo trước giọng đọc cho toàn bộ câu thoại"
                  >
                    {isSynthesizingAll ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Radio size={15} />
                    )}
                    <span>Tạo Toàn Bộ Audio</span>
                  </button>

                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={handleExportZipPackage}
                    title="Tải tệp ZIP gồm kịch bản và các file mp3"
                  >
                    <Download size={15} /> Tải Gói Dự Án (.ZIP)
                  </button>
                </div>
              </div>
            </div>

            {/* DANH SÁCH LƯỢT THOẠI ĐỐI ỨNG (TIMELINE / DIALOGUE THREAD) */}
            <div className="dialogue-thread-container mt-3">
              <div className="dialogue-thread-header">
                <div className="flex-center gap-2">
                  <FileText size={17} className="text-primary" />
                  <h4>Kịch Bản Lời Thoại Phân Đoạn ({project.dialogues.length} câu)</h4>
                </div>
                <button 
                  className="btn btn-primary btn-xs"
                  onClick={handleAddDialogueTurn}
                >
                  <Plus size={14} /> Thêm Câu Thoại
                </button>
              </div>

              {project.dialogues.length === 0 ? (
                <div className="empty-dialogue-box">
                  <Mic2 size={40} className="text-muted" />
                  <p>Chưa có câu thoại nào. Hãy sử dụng nút <strong>"1-Click Tạo Kịch Bản AI"</strong> hoặc thêm câu thoại thủ công.</p>
                </div>
              ) : (
                <div className="dialogue-turns-list">
                  {project.dialogues.map((turn, index) => {
                    const isSpeaker1 = turn.speaker === 1;
                    const speakerData = isSpeaker1 ? project.speaker1 : project.speaker2;
                    const isCurrentlyPlaying = currentPlayingTurn === index;
                    const isLoadingAudio = loadingAudioTurn === index;

                    return (
                      <div 
                        key={turn.id} 
                        className={`dialogue-turn-card ${isSpeaker1 ? 'speaker-1-turn' : 'speaker-2-turn'}`}
                      >
                        {/* Avatar & Header */}
                        <div className="turn-header">
                          <button 
                            className={`turn-speaker-pill ${isSpeaker1 ? 'pill-speaker-1' : 'pill-speaker-2'}`}
                            onClick={() => handleToggleSpeaker(index)}
                            title="Bấm để đổi sang người nói khác"
                          >
                            <User size={13} />
                            <span>{speakerData.name} ({speakerData.role})</span>
                          </button>

                          <div className="turn-actions">
                            {/* Nút nghe thử câu này */}
                            {isCurrentlyPlaying ? (
                              <button 
                                className="turn-btn turn-btn-playing"
                                onClick={handleStopSingleAudio}
                                title="Dừng phát"
                              >
                                <Square size={13} /> Dừng
                              </button>
                            ) : (
                              <button 
                                className="turn-btn"
                                onClick={() => handleSynthesizeTurn(index, true)}
                                disabled={isLoadingAudio || !turn.text.trim()}
                                title="Nghe thử câu thoại này"
                              >
                                {isLoadingAudio ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Play size={13} />
                                )}
                                <span>{turn.audioBlob ? 'Nghe lại' : 'Nghe thử'}</span>
                              </button>
                            )}

                            {/* Nút xóa */}
                            <button 
                              className="turn-btn turn-btn-del"
                              onClick={() => handleDeleteTurn(index)}
                              title="Xóa câu này"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Textarea nhập lời thoại */}
                        <div className="turn-body mt-2">
                          <textarea 
                            className="turn-textarea"
                            rows={2}
                            placeholder="Nhập lời thoại..."
                            value={turn.text}
                            onChange={(e) => handleUpdateTurnText(index, e.target.value)}
                          />
                        </div>

                        {/* Footer câu thoại */}
                        <div className="turn-footer mt-1">
                          <span className="turn-meta text-xs">
                            #{turn.turnNumber} • Giọng: {speakerData.voiceId.split('-')[2] || speakerData.voiceId}
                          </span>
                          {turn.audioBlob && (
                            <span className="turn-audio-status text-xs">
                              <CheckCircle2 size={12} className="text-success" /> Đã sẵn sàng Audio
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Nút thêm câu cuối cùng */}
              {project.dialogues.length > 0 && (
                <div className="add-turn-end mt-3 text-center">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddDialogueTurn}
                  >
                    <Plus size={14} /> Thêm lượt thoại tiếp theo
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGate>
  );
}

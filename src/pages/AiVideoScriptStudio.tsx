import React, { useState, useEffect } from 'react';
import { 
  Film, 
  Sparkles, 
  Copy, 
  Download, 
  Trash2, 
  Plus, 
  Volume2, 
  VolumeX, 
  Key, 
  Layers, 
  FileText, 
  Compass
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import AuthGate from '../components/AuthGate';

export interface VideoScene {
  sceneNumber: number;
  durationSec: number;
  title: string;
  continuityBridge: string;
  englishPrompt: string;
  vietnameseVoiceover: string;
  cameraMotion: string;
  continuityTags: string;
  audioSfx: string;
}

export interface VideoScriptProject {
  projectTitle: string;
  videoType: string;
  totalDurationSeconds: number;
  scenes: VideoScene[];
}

const PRESETS: Record<string, {
  name: string;
  topic: string;
  type: string;
  style: string;
  tool: string;
  tone: string;
  scenes: VideoScene[];
}> = {
  tutorial_crypto: {
    name: '🖥️ Mô phỏng thao tác: Thiết lập & Bảo mật Ví Web3',
    topic: 'Hướng dẫn người mới thiết lập ví lưu trữ tiền mã hóa Web3 và quy tắc sao lưu 12 cụm từ khôi phục bí mật (Seed Phrase) an toàn tuyệt đối.',
    type: 'tutorial_simulation',
    style: 'clean_screencast_ui',
    tool: 'runway_gen3',
    tone: 'clear_tutorial_guide',
    scenes: [
      {
        sceneNumber: 1,
        durationSec: 8,
        title: 'Mở ứng dụng & Khởi tạo ví mới',
        continuityBridge: 'Bắt đầu với shot góc nhìn qua vai (OTS) cố định người dùng cầm điện thoại thông minh viền titan, ánh sáng phòng làm việc tối giản.',
        englishPrompt: "Over-the-shoulder shot of clean hands holding a modern smartphone in a minimalist desk setup, warm ambient lighting. The phone screen displays a sleek Web3 wallet app with a glowing green button reading 'Create New Wallet'. Smooth slow push-in forward dolly, 4k cinematic crisp UI, photorealistic 8k.",
        vietnameseVoiceover: 'Chào bạn! Trong video này, chúng ta sẽ cùng thực hành từng bước cài đặt và bảo mật ví Web3 cá nhân an toàn nhất.',
        cameraMotion: 'Slow forward dolly push-in',
        continuityTags: 'Anchor: Hands holding smartphone, navy sleeve, warm desk lamp, matte black desk',
        audioSfx: 'Subtle tech chime, soft screen tap sound'
      },
      {
        sceneNumber: 2,
        durationSec: 8,
        title: 'Màn hình cảnh báo & Tạo cụm từ bí mật',
        continuityBridge: 'Tiếp nối chuyển động push-in từ Cảnh 1, camera chuyển sang góc cận cảnh (Macro shot) trực diện màn hình điện thoại mà ngón tay cái vừa chạm vào nút.',
        englishPrompt: 'Macro close-up shot maintaining seamless continuity from previous angle, camera transitions into screen plane. The app screen displays a safety warning shield icon animating in gold, then reveals a secure vault graphic. Seamless match-cut on thumb tap, ultra-detailed screen graphics, smooth interface animation, 60fps fluid motion.',
        vietnameseVoiceover: 'Ngay khi bấm Tạo ví, hệ thống sẽ yêu cầu bạn chuẩn bị giấy bút để ghi lại chìa khóa khôi phục. Tuyệt đối không chụp màn hình.',
        cameraMotion: 'Static macro with slight optical floating',
        continuityTags: 'Screen UI continuity, same smartphone bezel, thumb position matches previous shot',
        audioSfx: 'UI popup subtle whoosh, security lock sound'
      },
      {
        sceneNumber: 3,
        durationSec: 8,
        title: 'Ghi chép 12 từ khóa ra sổ tay',
        continuityBridge: 'Từ màn hình điện thoại ở Cảnh 2, camera thực hiện cú pan sang phải (Pan Right) mượt mà 45 độ, bắt trọn bàn tay đang cầm bút mực viết các từ khóa lên cuốn sổ kim loại.',
        englishPrompt: 'Smooth pan-right camera motion continuing from screen to the desk surface. The same hand now holds a metallic ballpoint pen, carefully writing 12 numbered English seed words onto a leather notebook beside the glowing phone. Depth of field focused on pen tip ink, warm cinematic sidelight, 8k realism.',
        vietnameseVoiceover: 'Hãy chép đủ 12 từ tiếng Anh theo đúng thứ tự đánh số. Đây là chiếc chìa khóa vạn năng duy nhất giúp bạn lấy lại tài sản nếu mất máy.',
        cameraMotion: 'Smooth Pan-right 45 degrees, shallow DOF',
        continuityTags: 'Same desk environment, phone remains visible on left edge of frame, consistent navy shirt sleeve',
        audioSfx: 'Paper scratching writing sound, gentle lo-fi synth bed'
      },
      {
        sceneNumber: 4,
        durationSec: 7,
        title: 'Xác thực trắc nghiệm thứ tự từ',
        continuityBridge: 'Tiếp nối chuyển động quay, camera pan nhẹ sang trái đưa tâm điểm về lại màn hình điện thoại, nơi ngón tay chạm chọn lần lượt các ô từ khóa để xác minh.',
        englishPrompt: 'Gentle pan-left returning focus to the phone screen. The user\'s thumb taps 3 verification word tiles in sequence, glowing teal green upon correct selection with checkmark micro-interactions. Clean tactile motion, responsive UI design, cinematic natural studio lighting.',
        vietnameseVoiceover: 'Ứng dụng sẽ yêu cầu bạn xếp lại các từ để kiểm tra. Chạm đúng thứ tự để xác nhận bạn đã lưu trữ chính xác.',
        cameraMotion: 'Subtle tilt down and slight zoom in',
        continuityTags: 'Same smartphone, identical UI typography and theme, thumb silhouette matches Scene 1 & 2',
        audioSfx: 'Three distinct success click sounds (ding-ding-ding)'
      },
      {
        sceneNumber: 5,
        durationSec: 7,
        title: 'Hoàn tất & Cất sổ vào hộp bảo mật',
        continuityBridge: 'Từ góc cận ngón tay, camera kéo lùi ra xa (Dolly out) để lộ lại toàn cảnh bàn làm việc, cuốn sổ được gập lại và cất vào ngăn kéo an toàn.',
        englishPrompt: 'Slow dolly-out pull back shot revealing the complete workspace. The hand closes the leather notebook with a satisfying click of an elastic band, sliding it into a desk safe box beside the phone displaying a green \'Wallet Secured\' checkmark. Elegant cinematic lighting, calm atmosphere, 8k resolution.',
        vietnameseVoiceover: 'Như vậy ví của bạn đã sẵn sàng! Luôn cất sổ ghi nhớ ở nơi bí mật và an toàn. Chúc bạn trải nghiệm Web3 thành công!',
        cameraMotion: 'Slow dolly-out backward reveal',
        continuityTags: 'Complete scene lock: Same desk, same lighting color temperature (3200K), notebook, safe box',
        audioSfx: 'Book closing thud, warm reassuring finale chord'
      }
    ]
  },
  lecture_ai: {
    name: '🎓 Bài giảng khoa học: Cơ chế Self-Attention trong AI Transformer',
    topic: 'Bài giảng giải thích cơ chế Self-Attention trong mô hình Transformer (nền tảng của ChatGPT và Gemini) dành cho sinh viên công nghệ thông tin.',
    type: 'educational_lecture',
    style: '3d_isometric_tech',
    tool: 'kling_ai',
    tone: 'professional_lecturer',
    scenes: [
      {
        sceneNumber: 1,
        durationSec: 8,
        title: 'Khởi nguồn câu hỏi: Máy tính đọc hiểu văn bản ra sao?',
        continuityBridge: 'Bắt đầu với một không gian số 3D tối màu vô cực, những ký tự từ ngữ tiếng Anh và tiếng Việt bay lơ lửng như những khối pha lê phát sáng.',
        englishPrompt: 'Cinematic 3D isometric dark digital space. Luminous floating glass typography cubes representing words float in zero gravity with neon cyan and amber light. Slow forward camera tracking shot moving between word nodes. Clean Octane 3D render, futuristic tech aesthetic, volumetric rays.',
        vietnameseVoiceover: 'Làm thế nào AI có thể hiểu được ý nghĩa sâu xa của một câu nói, thay vì chỉ dịch nghĩa từng từ đơn lẻ một cách máy móc?',
        cameraMotion: 'Slow forward tracking through typography nodes',
        continuityTags: 'Palette: Deep space slate (#0b0f19), cyan glow (#06b6d4), amber accents (#f59e0b)',
        audioSfx: 'Ambient digital hum, low resonant cinematic sweep'
      },
      {
        sceneNumber: 2,
        durationSec: 8,
        title: 'Vấn đề từ đồng âm và ngữ cảnh',
        continuityBridge: 'Tiếp tục luồng di chuyển từ Cảnh 1, camera dừng lại và phóng to (Dolly in) vào 2 từ giống nhau \'Bank\' trong hai ngữ cảnh: \'River Bank\' và \'Money Bank\'.',
        englishPrompt: 'Camera smoothly glides and dollies into two highlighted glowing crystal word cubes labeled \'Bank\'. Energy strands branch out: one connects to \'River\', one connects to \'Financial\'. Seamless kinetic motion, glowing fiber-optic light pulses, particle physics, 4k ultra-detailed rendering.',
        vietnameseVoiceover: 'Hãy nhìn vào từ \'Bank\': trong câu \'bờ sông\' nó mang nghĩa khác hẳn \'ngân hàng\'. Bí quyết nằm ở từ ngữ xung quanh nó.',
        cameraMotion: 'Smooth focus transition, orbit 30 degrees',
        continuityTags: 'Maintains identical 3D neon cube aesthetic, glowing fiber cords continue in next frame',
        audioSfx: 'Dual digital activation chimes, frequency pulse'
      },
      {
        sceneNumber: 3,
        durationSec: 8,
        title: 'Cơ chế tính điểm liên kết (Attention Score)',
        continuityBridge: 'Từ các sợi quang học ở Cảnh 2, camera xoay vòng (Orbit 45 độ) đưa toàn cảnh vào ma trận ma trận ánh sáng, nơi các tia laser tính điểm tương quan giữa các từ.',
        englishPrompt: 'Orbital rotating camera shot tracking glowing energy beams firing between all words in a sentence, forming an intricate glowing network grid. Numbers and attention weight heatmaps illuminate in bright gold and teal on a glass plane. High-end mathematical visualization, fluid simulation, sci-fi HUD graphics.',
        vietnameseVoiceover: 'Cơ chế Self-Attention cho phép mỗi từ tự động \'bắn tia chú ý\' tới tất cả các từ còn lại để tính toán mức độ liên quan mật thiết.',
        cameraMotion: 'Orbital rotating arc 45 degrees around center grid',
        continuityTags: 'Same typographic tokens, glowing grid matrix coordinates locked',
        audioSfx: 'High tech data processing sound, rapid electrical chirps'
      },
      {
        sceneNumber: 4,
        durationSec: 8,
        title: 'Bộ ba Query, Key và Value (Q, K, V)',
        continuityBridge: 'Dòng laser từ Cảnh 3 tách thành ba chùm tia màu đỏ (Query), xanh lục (Key) và xanh dương (Value) chiếu vào một lõi tính toán trung tâm.',
        englishPrompt: 'Camera descends vertically down into a central floating processor core. Three distinct radiant laser beams colored Red (Query), Green (Key), and Blue (Value) converge into a spinning geometric prism, creating a blinding harmonious white light explosion at contact. Geometric precision, 8k abstract 3D render.',
        vietnameseVoiceover: 'Mỗi từ được mã hóa thành 3 vectơ: Query đi hỏi, Key để đối chiếu và Value chứa thông tin thực tế cần trích xuất.',
        cameraMotion: 'Vertical pedestal crane down into prism',
        continuityTags: 'Consistent color coding: Red Query, Green Key, Blue Value throughout explanation',
        audioSfx: 'Three harmonic notes blending into a sustained resonant chord'
      },
      {
        sceneNumber: 5,
        durationSec: 8,
        title: 'Hợp nhất đa đầu chú ý (Multi-Head Attention)',
        continuityBridge: 'Từ vụ nổ ánh sáng của Cảnh 4, camera lùi nhanh (Snap pull-back) hiển thị 8 tầng ma trận song song đang xử lý đồng thời cực kỳ trơn tru.',
        englishPrompt: 'Dynamic snap pull-back shot revealing eight identical layered geometric computational planes stacked vertically, processing multidimensional context simultaneously like a supercomputer engine. Smooth holographic animation, deep depth of field, modern AI data center abstraction.',
        vietnameseVoiceover: 'Khi ghép nhiều đầu chú ý lại với nhau, mô hình nắm bắt được đồng thời ngữ pháp, đại từ thay thế và cả cảm xúc câu văn.',
        cameraMotion: 'Snap pull-back and slow upward tilt',
        continuityTags: 'Keeps the 8-layer vertical stack layout, constant color temperatures',
        audioSfx: 'Rhythmic turbine power-up hum, complex computational synth'
      },
      {
        sceneNumber: 6,
        durationSec: 8,
        title: 'Kết luận: Sức mạnh kiến tạo kỷ nguyên GenAI',
        continuityBridge: 'Từ 8 tầng ma trận, tất cả các luồng ánh sáng hội tụ phóng vút lên tạo thành một quả cầu thông thái phát sáng rực rỡ tượng trưng cho tri thức nhân loại.',
        englishPrompt: 'Final triumphant camera ascent following the converging data streams as they assemble into a luminous radiant sphere of knowledge illuminating the entire dark digital cosmos. Slow 360 panoramic spin, cinematic lighting, breathtaking tech scale, 8k wallpaper quality.',
        vietnameseVoiceover: 'Chính nhờ cơ chế kỳ diệu này, các mô hình ngôn ngữ lớn ngày nay đã có thể hiểu và trò chuyện cùng con người một cách tự nhiên.',
        cameraMotion: 'Ascending slow 360 panoramic rotation',
        continuityTags: 'Final synthesis of all scene colors: deep navy cosmos, cyan, gold, and white light',
        audioSfx: 'Inspiring orchestral swell with subtle synthesizer tail'
      }
    ]
  },
  coffee_barista: {
    name: '☕ Mô phỏng thao tác Barista: Chiết xuất Espresso Chuẩn 1:2',
    topic: 'Mô phỏng thao tác chuẩn Barista: Các bước định lượng, nén cà phê (tamping) và chiết xuất ly Espresso chuẩn tỉ lệ vàng 1:2.',
    type: 'tutorial_simulation',
    style: 'hyperrealistic_studio',
    tool: 'luma_dream_machine',
    tone: 'calm_minimalist',
    scenes: [
      {
        sceneNumber: 1,
        durationSec: 8,
        title: 'Xay hạt & Phân phối bột cà phê',
        continuityBridge: 'Mở đầu với góc quay ngang tầm mắt trong quầy bar cao cấp lát đá cẩm thạch đen, máy xay xả bột cà phê mịn vào tay pha (portafilter).',
        englishPrompt: 'Extreme close-up macro shot of freshly ground dark roast coffee powder falling like brown velvet snow into a metallic bottomless portafilter. Warm moody cafe atmosphere, natural 5000k soft sidelight, shallow depth of field, 4k 120fps slow motion, cinematic realism.',
        vietnameseVoiceover: 'Bước đầu tiên là định lượng chính xác 18 gam cà phê hạt đã rang mộc, xay mịn đều vào tay pha chuyên dụng.',
        cameraMotion: 'Slow horizontal slider right',
        continuityTags: 'Barista wearing dark apron, brushed steel portafilter, black marble counter',
        audioSfx: 'Grinder whirring sound, soft powdery thuds'
      },
      {
        sceneNumber: 2,
        durationSec: 8,
        title: 'Kỹ thuật dùng kim phân bổ (WDT tool)',
        continuityBridge: 'Tiếp tục giữ nguyên vị trí tay pha từ Cảnh 1, camera chuyển sang góc nhìn từ trên cao xuống (Top-down 90 độ), bàn tay cầm dụng cụ kim gảy đều bột.',
        englishPrompt: "Top-down 90-degree bird's eye view maintaining strict continuity of the portafilter on the black marble counter. A sleek metal WDT needle tool gently stirs the grounds in spiral circles, breaking all clumps into a silky flat surface. Tactile precision, smooth hand movement, 8k crisp details.",
        vietnameseVoiceover: 'Dùng dụng cụ kim đảo đều theo hình xoắn ốc để triệt tiêu mọi vón cục, tránh hiện tượng nước chảy rãnh khi chiết xuất.',
        cameraMotion: 'Static top-down with micro rotation',
        continuityTags: 'Identical portafilter rim, same dark counter texture, consistent barista hand/watch',
        audioSfx: 'Delicate metallic needle stirring sound'
      },
      {
        sceneNumber: 3,
        durationSec: 8,
        title: 'Nén tamper vuông góc chuẩn 15kg',
        continuityBridge: 'Từ góc top-down Cảnh 2, camera trượt xuống góc nghiêng 45 độ, ghi lại khoảnh khắc cây nén tamper đặt thẳng đứng và ấn phẳng dứt khoát.',
        englishPrompt: 'Smooth transition to a 45-degree side angle. The barista firmly places a polished wood and stainless steel calibrated tamper squarely onto the portafilter, pressing downward with level, deliberate force. The coffee cake compresses perfectly flat. Cinematic studio rim lighting, 8k photorealistic.',
        vietnameseVoiceover: 'Đặt tamper vuông góc 90 độ, dùng lực nén đều khoảng 15 ký để tạo thành một bánh cà phê phẳng mịn tuyệt đối.',
        cameraMotion: 'Smooth tilt down to 45 degree angle',
        continuityTags: 'Same portafilter, same barista sleeves, matching wood handle grain',
        audioSfx: 'Solid metallic click and heavy tactile compression thud'
      },
      {
        sceneNumber: 4,
        durationSec: 8,
        title: 'Khóa vào họng máy & Bắt đầu bơm nước',
        continuityBridge: 'Theo chuyển động đưa tay pha của barista, camera pan theo tay từ mặt bàn lên họng máy pha cà phê La Marzocco bóng bẩy.',
        englishPrompt: 'Smooth tracking shot following the hand lifting the portafilter and locking it firmly into the chrome grouphead of a luxury espresso machine with a satisfying 45-degree turn. The barista flips the vintage brass brew paddle. Reflections in chrome, warm ambient steam, 60fps cinematic fluidity.',
        vietnameseVoiceover: 'Lắp tay pha vào họng máy và bật bơm ngay lập tức để nhiệt độ nước không làm cháy bề mặt cà phê khô.',
        cameraMotion: 'Follow pan from counter to chrome grouphead',
        continuityTags: 'Continuous hand motion, matching espresso machine chrome finish',
        audioSfx: 'Portafilter locking clonk, pump hum, water pre-infusion hiss'
      },
      {
        sceneNumber: 5,
        durationSec: 8,
        title: 'Dòng chảy Crema vàng óng tỉ lệ 1:2',
        continuityBridge: 'Cắt khớp (Match cut) từ tiếng máy bơm ở Cảnh 4 sang góc siêu cận (Extreme macro) đáy tay pha không đáy, những giọt tinh chất đầu tiên hội tụ.',
        englishPrompt: 'Extreme macro slow-motion shot beneath the naked bottomless portafilter. Viscous golden hazelnut crema streams merge together in the center, dripping like warm melted honey into a clear double-walled glass cup. Steam rising, rich crema texture, warm cinematic backlighting, 8k.',
        vietnameseVoiceover: 'Sau 28 giây, ta thu được 36 gam espresso đậm đà với lớp crema vàng óng, sẵn sàng mang đến cho bạn hương vị thăng hoa.',
        cameraMotion: 'Slow pull-back reveal of the falling golden liquid',
        continuityTags: 'Transparent glass cup, bottomless portafilter flow, same cafe ambient light',
        audioSfx: 'Liquid dripping into glass, gentle cafe acoustic jazz in background'
      }
    ]
  }
};

export default function AiVideoScriptStudio() {
  const { showToast } = useNotification();

  // Project Configuration State
  const [topic, setTopic] = useState('');
  const [videoType, setVideoType] = useState('tutorial_simulation');
  const [scenePacing, setScenePacing] = useState('standard_8_10s');
  const [visualStyle, setVisualStyle] = useState('hyperrealistic_studio');
  const [aiToolTarget, setAiToolTarget] = useState('runway_gen3');
  const [sceneCount, setSceneCount] = useState(6);
  const [voiceTone, setVoiceTone] = useState('clear_tutorial_guide');
  const [matchCut, setMatchCut] = useState(true);
  const [cameraFlow, setCameraFlow] = useState(true);
  const [subjectLock, setSubjectLock] = useState(true);

  // Script Data State
  const [project, setProject] = useState<VideoScriptProject>(() => {
    const saved = localStorage.getItem('rchg_video_script_current');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      projectTitle: 'Kịch bản Video AI Mới',
      videoType: 'tutorial_simulation',
      totalDurationSeconds: 40,
      scenes: PRESETS.tutorial_crypto.scenes
    };
  });

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('rchg_gemini_api_key') || '');
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('rchg_gemini_api_key') || '');
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  // Save project to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('rchg_video_script_current', JSON.stringify(project));
    } catch {}
  }, [project]);

  // Total Duration & Words Calculation
  const totalDuration = project.scenes.reduce((acc, s) => acc + (Number(s.durationSec) || 0), 0);
  const totalWords = project.scenes.reduce((acc, s) => {
    const w = s.vietnameseVoiceover ? s.vietnameseVoiceover.trim().split(/\s+/).filter(Boolean).length : 0;
    return acc + w;
  }, 0);

  // Apply a preset
  const handleApplyPreset = (key: string) => {
    const p = PRESETS[key];
    if (!p) return;
    setTopic(p.topic);
    setVideoType(p.type);
    setVisualStyle(p.style);
    setAiToolTarget(p.tool);
    setVoiceTone(p.tone);
    setSceneCount(p.scenes.length);

    setProject({
      projectTitle: p.name,
      videoType: p.type,
      totalDurationSeconds: p.scenes.reduce((acc, s) => acc + s.durationSec, 0),
      scenes: JSON.parse(JSON.stringify(p.scenes))
    });

    setShowTemplateModal(false);
    showToast(`Đã nạp kịch bản mẫu: ${p.name}`, 'success');
  };

  // Generate Script via Backend API (with Gemini AI)
  const handleGenerateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      showToast('Vui lòng nhập chủ đề hoặc mục tiêu của video!', 'warning');
      return;
    }

    setIsGenerating(true);
    setLoadingStatus('Đang kết nối AI và phân tích cấu trúc liền mạch 6-10s...');

    try {
      const res = await fetch('/api/qa-wall?action=generate-video-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          videoType,
          scenePacing,
          visualStyle,
          aiToolTarget,
          sceneCount,
          voiceTone,
          matchCut,
          cameraFlow,
          subjectLock,
          customApiKey: customApiKey.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Không thể tạo kịch bản từ AI.');
      }

      if (data.scenes && Array.isArray(data.scenes) && data.scenes.length > 0) {
        setProject({
          projectTitle: data.projectTitle || topic.trim().substring(0, 60),
          videoType,
          totalDurationSeconds: data.scenes.reduce((acc: number, s: any) => acc + (s.durationSec || 8), 0),
          scenes: data.scenes
        });
        showToast(`Đã tạo thành công ${data.scenes.length} phân cảnh video liền mạch!`, 'success');
      } else {
        throw new Error('Dữ liệu phân cảnh trả về không hợp lệ.');
      }
    } catch (err: any) {
      console.error('Lỗi generate video script:', err);
      showToast(err.message || 'Lỗi khi tạo kịch bản video AI', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Scene Update Handlers
  const handleUpdateScene = (index: number, field: keyof VideoScene, value: any) => {
    setProject(prev => {
      const newScenes = [...prev.scenes];
      if (newScenes[index]) {
        newScenes[index] = { ...newScenes[index], [field]: value };
      }
      return {
        ...prev,
        scenes: newScenes,
        totalDurationSeconds: newScenes.reduce((acc, s) => acc + (Number(s.durationSec) || 0), 0)
      };
    });
  };

  const handleDeleteScene = (index: number) => {
    if (project.scenes.length <= 1) {
      showToast('Kịch bản cần tối thiểu 1 phân cảnh!', 'warning');
      return;
    }
    setProject(prev => {
      const filtered = prev.scenes.filter((_, i) => i !== index).map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
      return {
        ...prev,
        scenes: filtered,
        totalDurationSeconds: filtered.reduce((acc, s) => acc + (Number(s.durationSec) || 0), 0)
      };
    });
    showToast(`Đã xóa phân cảnh #${index + 1}`, 'info');
  };

  const handleAddBlankScene = () => {
    const nextNum = project.scenes.length + 1;
    const lastScene = project.scenes[project.scenes.length - 1];

    const newScene: VideoScene = {
      sceneNumber: nextNum,
      durationSec: 8,
      title: `Phân cảnh ${nextNum}`,
      continuityBridge: lastScene 
        ? `Nối tiếp mượt mà từ chuyển động góc máy của cảnh #${nextNum - 1}` 
        : 'Cảnh mở đầu tổng quan',
      englishPrompt: 'Cinematic shot continuing the seamless motion, high detail, studio lighting, photorealistic 8k.',
      vietnameseVoiceover: 'Nhập lời thuyết minh bằng tiếng Việt từ 15 đến 25 từ cho phân cảnh này...',
      cameraMotion: 'Smooth camera motion',
      continuityTags: lastScene?.continuityTags || 'Consistent lighting, matching subject and background anchor',
      audioSfx: 'Soft transition whoosh and ambient melody'
    };

    setProject(prev => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
      totalDurationSeconds: prev.totalDurationSeconds + 8
    }));
    showToast(`Đã thêm phân cảnh mới #${nextNum}`, 'success');
  };

  // Voiceover Preview (Web Speech Synthesis)
  const handlePlayVoiceover = (index: number) => {
    const scene = project.scenes[index];
    if (!scene || !scene.vietnameseVoiceover) return;

    if (!('speechSynthesis' in window)) {
      showToast('Trình duyệt của bạn không hỗ trợ bộ đọc giọng nói Web Speech.', 'warning');
      return;
    }

    if (playingIndex === index) {
      window.speechSynthesis.cancel();
      setPlayingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scene.vietnameseVoiceover);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VN'));
    if (viVoice) utterance.voice = viVoice;

    utterance.onstart = () => setPlayingIndex(index);
    utterance.onend = () => setPlayingIndex(null);
    utterance.onerror = () => setPlayingIndex(null);

    window.speechSynthesis.speak(utterance);
    showToast(`Đang đọc thuyết minh cảnh #${index + 1}...`, 'info');
  };

  // Copy helper
  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(msg, 'success');
    }).catch(() => {
      showToast('Không thể sao chép tự động', 'error');
    });
  };

  const handleCopyAllPrompts = () => {
    if (project.scenes.length === 0) return;
    const text = project.scenes.map((s, idx) => 
      `--- SCENE ${idx + 1} (${s.durationSec}s) ---\n` +
      `Title: ${s.title}\n` +
      `Camera Motion: ${s.cameraMotion || 'Smooth'}\n` +
      `Prompt: ${s.englishPrompt}\n`
    ).join('\n');
    copyToClipboard(text, `Đã sao chép toàn bộ ${project.scenes.length} Prompt tiếng Anh!`);
  };

  const handleCopyAllVoiceover = () => {
    if (project.scenes.length === 0) return;
    const text = project.scenes.map((s, idx) => 
      `[Cảnh ${idx + 1} - ${s.durationSec}s]: ${s.vietnameseVoiceover}`
    ).join('\n\n');
    copyToClipboard(text, 'Đã sao chép toàn bộ lời thuyết minh tiếng Việt!');
  };

  // Export functions
  const handleExport = (format: 'markdown' | 'json' | 'prompts_txt' | 'voiceover_txt') => {
    const title = project.projectTitle || 'kich-ban-ai-video';
    const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    if (format === 'markdown') {
      filename = `${slug}.md`;
      mimeType = 'text/markdown';
      content = `# ${project.projectTitle}\n\n`;
      content += `- **Loại video**: ${project.videoType}\n`;
      content += `- **Tổng thời lượng**: ${totalDuration}s (~${(totalDuration / 60).toFixed(1)} phút)\n`;
      content += `- **Tổng số phân cảnh**: ${project.scenes.length} cảnh\n`;
      content += `- **Ước tính từ thuyết minh**: ${totalWords} từ\n\n`;
      content += `## Chi Tiết Các Phân Cảnh Liền Mạch (6-10s)\n\n`;

      project.scenes.forEach((s, i) => {
        content += `### Phân Cảnh #${i + 1}: ${s.title} (${s.durationSec}s)\n`;
        content += `- **Mối nối liền mạch (Continuity)**: ${s.continuityBridge}\n`;
        content += `- **Chuyển động Camera**: ${s.cameraMotion || 'Smooth Camera'}\n`;
        content += `- **Khóa Anchor**: ${s.continuityTags || 'None'}\n`;
        content += `- **AI Video Prompt (English)**:\n\`\`\`text\n${s.englishPrompt}\n\`\`\`\n`;
        content += `- **Thuyết minh (Tiếng Việt)**:\n> "${s.vietnameseVoiceover}"\n`;
        content += `- **Âm thanh (SFX/BGM)**: ${s.audioSfx || 'None'}\n\n`;
      });
    } else if (format === 'json') {
      filename = `${slug}.json`;
      mimeType = 'application/json';
      content = JSON.stringify(project, null, 2);
    } else if (format === 'prompts_txt') {
      filename = `${slug}-prompts.txt`;
      content = project.scenes.map((s, i) => 
        `Scene ${i + 1} (${s.durationSec}s):\n${s.englishPrompt}\n`
      ).join('\n');
    } else if (format === 'voiceover_txt') {
      filename = `${slug}-voiceover.txt`;
      content = project.scenes.map((s, i) => 
        `[${s.durationSec}s] Cảnh ${i + 1}: ${s.vietnameseVoiceover}`
      ).join('\n\n');
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportModal(false);
    showToast(`Đã xuất và tải file "${filename}" thành công!`, 'success');
  };

  return (
    <AuthGate
      featureTitle="AI Video Script Continuity Studio"
      featureDescription="Công cụ biên kịch và tạo kịch bản video AI liền mạch phân cảnh 6-10s cho bài giảng và mô phỏng thao tác yêu cầu đăng nhập tài khoản."
      returnUrl="/kich-ban-video-ai"
    >
      <div style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '1rem 1.5rem 3rem', minHeight: 'calc(100vh - 140px)', boxSizing: 'border-box' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem', background: '#0f172a', padding: '1.25rem 1.75rem', borderRadius: '1rem', border: '1px solid #1e293b', color: '#fff', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '280px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)', flexShrink: 0 }}>
              <Film size={26} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, background: 'linear-gradient(to right, #fff, #cbd5e1, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AI Video Script Continuity Studio
              </h1>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                Biên kịch video AI liền mạch 6-10s • Match-cut & Camera Flow • Prompt tiếng Anh chuẩn Runway/Kling/Luma • Thuyết minh tiếng Việt
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowApiKeyModal(true)}
              className="btn btn-sm"
              style={{
                background: customApiKey ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.9)',
                border: customApiKey ? '1px solid #10b981' : '1px solid #475569',
                color: customApiKey ? '#34d399' : '#f1f5f9',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '0.5rem 0.9rem',
                borderRadius: '0.6rem'
              }}
              title="Cấu hình Google Gemini API Key cá nhân"
            >
              <Key size={15} color={customApiKey ? '#34d399' : '#f59e0b'} />
              <span>{customApiKey ? 'Gemini Key (Đã cấu hình)' : 'Cấu hình Gemini Key'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="btn btn-sm"
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#c7d2fe',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '0.5rem 0.9rem',
                borderRadius: '0.6rem'
              }}
            >
              <Layers size={15} color="#818cf8" />
              <span>Kịch bản mẫu</span>
            </button>

            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.6rem'
              }}
            >
              <Download size={15} />
              <span>Xuất kịch bản</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 440px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Controls & Generation Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem', padding: '1.25rem', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.85rem', marginBottom: '1rem', borderBottom: '1px solid #1e293b', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                  <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e2e8f0' }}>
                    Cấu Hình Kịch Bản Video AI
                  </h3>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(true)}
                    style={{
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#a5b4fc',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '0.4rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    title="Chọn kịch bản mẫu nhanh"
                  >
                    <Layers size={12} color="#818cf8" />
                    <span>Mẫu có sẵn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowApiKeyModal(true)}
                    style={{
                      background: customApiKey ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      border: customApiKey ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                      color: customApiKey ? '#34d399' : '#fbbf24',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '0.4rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    title="Cấu hình Google Gemini API Key"
                  >
                    <Key size={12} />
                    <span>{customApiKey ? 'Key riêng: OK' : 'Gemini Key'}</span>
                  </button>

                  <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontFamily: 'monospace' }}>
                    Gemini Flash
                  </span>
                </div>
              </div>

              <form onSubmit={handleGenerateScript} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Quick Preset Selector Buttons Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ⚡ Gợi ý:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('tutorial_crypto')}
                    style={{ background: '#020617', border: '1px solid #334155', borderRadius: '0.4rem', padding: '0.2rem 0.5rem', color: '#cbd5e1', fontSize: '0.72rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
                  >
                    🔐 Ví Web3 (Mô phỏng)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('lecture_ai')}
                    style={{ background: '#020617', border: '1px solid #334155', borderRadius: '0.4rem', padding: '0.2rem 0.5rem', color: '#cbd5e1', fontSize: '0.72rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
                  >
                    🎓 Attention AI (Bài giảng)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('product_espresso')}
                    style={{ background: '#020617', border: '1px solid #334155', borderRadius: '0.4rem', padding: '0.2rem 0.5rem', color: '#cbd5e1', fontSize: '0.72rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
                  >
                    ☕ Espresso (Cinematic)
                  </button>
                </div>

                {/* Chủ đề chính */}
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    <span>Chủ đề / Mục tiêu video <span style={{ color: '#f43f5e' }}>*</span></span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Cụ thể & chi tiết</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="VD: Hướng dẫn người mới thao tác kết nối ví Web3 & bảo mật cụm từ khóa 12 ký tự (hoặc: Bài giảng giải thích nguyên lý hoạt động của LLM & Transformer)..."
                    style={{ width: '100%', background: '#020617', border: '1px solid #334155', borderRadius: '0.65rem', padding: '0.65rem 0.85rem', color: '#f8fafc', fontSize: '0.82rem', lineHeight: 1.5, boxSizing: 'border-box' }}
                  />
                </div>

                {/* Loại video & Thời lượng */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>Loại video</label>
                    <select
                      value={videoType}
                      onChange={(e) => setVideoType(e.target.value)}
                      style={{ width: '100%', background: '#020617', border: '1px solid #334155', borderRadius: '0.65rem', padding: '0.55rem 0.65rem', color: '#f8fafc', fontSize: '0.8rem' }}
                    >
                      <option value="tutorial_simulation">🖥️ Mô phỏng thao tác / Thực hành</option>
                      <option value="educational_lecture">🎓 Video bài giảng / Giải thích</option>
                      <option value="product_demo">📱 Demo sản phẩm / Tính năng</option>
                      <option value="cinematic_story">🎬 Kể chuyện / Phim ngắn</option>
                      <option value="tiktok_reels_explainer">⚡ Short / Reels / TikTok ngắn</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>Thời lượng cảnh</label>
                    <select
                      value={scenePacing}
                      onChange={(e) => setScenePacing(e.target.value)}
                      style={{ width: '100%', background: '#020617', border: '1px solid #334155', borderRadius: '0.65rem', padding: '0.55rem 0.65rem', color: '#f8fafc', fontSize: '0.8rem' }}
                    >
                      <option value="dynamic_6_8s">6 - 8 giây (Nhịp nhanh)</option>
                      <option value="standard_8_10s">8 - 10 giây (Chuẩn thao tác)</option>
                      <option value="exact_8s">Cố định 8 giây (Chuẩn nhạc)</option>
                    </select>
                  </div>
                </div>

                {/* Phong cách hình ảnh & AI Video Tool */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>Phong cách (Style)</label>
                    <select
                      value={visualStyle}
                      onChange={(e) => setVisualStyle(e.target.value)}
                      style={{ width: '100%', background: '#020617', border: '1px solid #334155', borderRadius: '0.65rem', padding: '0.55rem 0.65rem', color: '#f8fafc', fontSize: '0.8rem' }}
                    >
                      <option value="hyperrealistic_studio">Chân thực điện ảnh (Photorealistic 8K)</option>
                      <option value="clean_screencast_ui">Mô phỏng UI/UX sạch, Macro màn hình</option>
                      <option value="3d_isometric_tech">3D Isometric hiện đại (Octane Render)</option>
                      <option value="documentary_archive">Phóng sự tài liệu (Film Grain)</option>
                      <option value="futuristic_cyber">Futuristic Sci-Fi / Hologram neon</option>
                      <option value="minimal_motion_graphics">Tối giản mượt mà (Minimalist)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>AI Video Tool</label>
                    <select
                      value={aiToolTarget}
                      onChange={(e) => setAiToolTarget(e.target.value)}
                      style={{ width: '100%', background: '#020617', border: '1px solid #334155', borderRadius: '0.65rem', padding: '0.55rem 0.65rem', color: '#f8fafc', fontSize: '0.8rem' }}
                    >
                      <option value="runway_gen3">Runway Gen-3 Alpha</option>
                      <option value="kling_ai">Kling AI 1.5 / 2.0</option>
                      <option value="luma_dream_machine">Luma Dream Machine</option>
                      <option value="sora">OpenAI Sora / Veo 2</option>
                      <option value="midjourney_pika">Midjourney + Pika/Hailuo</option>
                    </select>
                  </div>
                </div>

                {/* Số lượng phân cảnh & Tông giọng */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                      <span>Số phân cảnh:</span>
                      <span style={{ color: '#818cf8', fontWeight: 700, fontFamily: 'monospace' }}>{sceneCount} cảnh (~{sceneCount * 8}s)</span>
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={12}
                      value={sceneCount}
                      onChange={(e) => setSceneCount(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#6366f1', height: '6px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>Tông giọng thuyết minh</label>
                    <select
                      value={voiceTone}
                      onChange={(e) => setVoiceTone(e.target.value)}
                      style={{ width: '100%', background: '#020617', border: '1px solid #334155', borderRadius: '0.65rem', padding: '0.55rem 0.65rem', color: '#f8fafc', fontSize: '0.8rem' }}
                    >
                      <option value="clear_tutorial_guide">Thân thiện, mạch lạc, dễ làm theo</option>
                      <option value="professional_lecturer">Giảng viên chuyên gia, truyền cảm hứng</option>
                      <option value="dynamic_storyteller">Kịch tính, lôi cuốn kiểu phóng sự</option>
                      <option value="calm_minimalist">Điềm tĩnh, trang nhã, công nghệ cao</option>
                    </select>
                  </div>
                </div>

                {/* Quy tắc liền mạch */}
                <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '0.75rem' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                    Quy tắc liền mạch giữa các cảnh:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={matchCut} onChange={(e) => setMatchCut(e.target.checked)} style={{ accentColor: '#6366f1' }} />
                      <span>Match-Cut chuyển động (hành động cuối cảnh A nối đầu cảnh B)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={cameraFlow} onChange={(e) => setCameraFlow(e.target.checked)} style={{ accentColor: '#6366f1' }} />
                      <span>Duy trì hướng góc quay (VD: Pan phải → Tiếp tục Pan phải / Dolly)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={subjectLock} onChange={(e) => setSubjectLock(e.target.checked)} style={{ accentColor: '#6366f1' }} />
                      <span>Khóa nhân vật/vật thể/giao diện nhất quán (Trang phục, ánh sáng)</span>
                    </label>
                  </div>
                </div>

                {/* Nút hành động */}
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1, #10b981)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.4)',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    opacity: isGenerating ? 0.7 : 1
                  }}
                >
                  <Sparkles size={18} />
                  <span>{isGenerating ? 'Đang liên kết các phân cảnh...' : 'Tạo Kịch Bản Liền Mạch (AI Generator)'}</span>
                </button>
              </form>
            </div>

            {/* Quick Metrics Card */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem', padding: '1rem 1.25rem', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <div>
                <span style={{ color: '#94a3b8', display: 'block' }}>Tổng thời lượng:</span>
                <strong style={{ fontSize: '1.05rem', color: '#fff', fontFamily: 'monospace' }}>{totalDuration}s (~{(totalDuration / 60).toFixed(1)}p)</strong>
              </div>
              <div style={{ height: '28px', width: '1px', background: '#334155' }}></div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block' }}>Số phân cảnh:</span>
                <strong style={{ fontSize: '1.05rem', color: '#818cf8', fontFamily: 'monospace' }}>{project.scenes.length} cảnh</strong>
              </div>
              <div style={{ height: '28px', width: '1px', background: '#334155' }}></div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block' }}>Từ thuyết minh:</span>
                <strong style={{ fontSize: '1.05rem', color: '#34d399', fontFamily: 'monospace' }}>{totalWords} từ</strong>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Timeline & Scenes List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Action Toolbar */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', display: 'inline-block' }}></span>
                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Dòng Thời Gian Phân Cảnh (Timeline)</h3>
                <span style={{ fontSize: '0.75rem', background: '#1e293b', color: '#94a3b8', padding: '0.15rem 0.5rem', borderRadius: '0.35rem', border: '1px solid #334155' }}>
                  {project.projectTitle}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleCopyAllPrompts}
                  className="btn btn-outline btn-xs"
                  style={{ borderColor: '#334155', color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                  title="Copy toàn bộ AI Prompts tiếng Anh"
                >
                  <Copy size={13} color="#818cf8" />
                  <span>Copy All Prompts</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyAllVoiceover}
                  className="btn btn-outline btn-xs"
                  style={{ borderColor: '#334155', color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                  title="Copy toàn bộ lời thoại thuyết minh tiếng Việt"
                >
                  <FileText size={13} color="#34d399" />
                  <span>Copy Lời Thoại</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddBlankScene}
                  className="btn btn-outline btn-xs"
                  style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
                >
                  <Plus size={13} />
                  <span>Thêm cảnh</span>
                </button>
              </div>
            </div>

            {/* Loading state indicator */}
            {isGenerating && (
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '1rem', padding: '3rem 2rem', textAlign: 'center', color: '#f8fafc' }}>
                <div style={{ width: '48px', height: '48px', border: '4px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 1.25rem', animation: 'spin 1s linear infinite' }}></div>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>Đang tạo kịch bản video AI liền mạch...</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', fontFamily: 'monospace' }}>{loadingStatus}</p>
              </div>
            )}

            {/* Scenes List */}
            {!isGenerating && project.scenes.map((scene, index) => {
              const isFirst = index === 0;
              const isLast = index === project.scenes.length - 1;
              const voWords = scene.vietnameseVoiceover ? scene.vietnameseVoiceover.trim().split(/\s+/).filter(Boolean).length : 0;
              const targetWords = `${Math.round(scene.durationSec * 2.2)} - ${Math.round(scene.durationSec * 2.8)} từ`;
              const isWordCountGood = voWords >= scene.durationSec * 1.8 && voWords <= scene.durationSec * 3.2;

              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem', padding: '1.25rem', color: '#fff', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.2)' }}>
                    {/* Scene Top Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.85rem', borderBottom: '1px solid #1e293b', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#818cf8', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
                          #{scene.sceneNumber || index + 1}
                        </span>
                        <input
                          type="text"
                          value={scene.title}
                          onChange={(e) => handleUpdateScene(index, 'title', e.target.value)}
                          style={{ background: 'transparent', border: '1px solid transparent', color: '#fff', fontSize: '0.95rem', fontWeight: 700, padding: '0.2rem 0.4rem', borderRadius: '0.4rem' }}
                          placeholder="Tiêu đề phân cảnh..."
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {/* Thời lượng */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#020617', padding: '0.3rem 0.65rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>⏱️</span>
                          <select
                            value={scene.durationSec}
                            onChange={(e) => handleUpdateScene(index, 'durationSec', Number(e.target.value))}
                            style={{ background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace', cursor: 'pointer' }}
                          >
                            <option value={6} style={{ background: '#0f172a' }}>6 giây</option>
                            <option value={7} style={{ background: '#0f172a' }}>7 giây</option>
                            <option value={8} style={{ background: '#0f172a' }}>8 giây</option>
                            <option value={9} style={{ background: '#0f172a' }}>9 giây</option>
                            <option value={10} style={{ background: '#0f172a' }}>10 giây</option>
                          </select>
                        </div>

                        {/* Camera Tag */}
                        <span style={{ fontSize: '0.75rem', background: '#1e293b', color: '#cbd5e1', padding: '0.3rem 0.65rem', borderRadius: '0.5rem', border: '1px solid #334155', fontFamily: 'monospace' }}>
                          🎥 {scene.cameraMotion || 'Smooth Camera'}
                        </span>

                        {/* Delete scene */}
                        <button
                          type="button"
                          onClick={() => handleDeleteScene(index)}
                          style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.3rem' }}
                          title="Xóa phân cảnh này"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Continuity Bridge Box */}
                    <div style={{ marginTop: '0.85rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '0.75rem', padding: '0.75rem 0.95rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Compass size={13} />
                          <span>Mối nối liền mạch (Continuity Bridge):</span>
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {isFirst ? 'Cảnh Mở Màn' : `Khớp từ cảnh #${index}`}
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={scene.continuityBridge}
                        onChange={(e) => handleUpdateScene(index, 'continuityBridge', e.target.value)}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }}
                        placeholder="Mô tả cách góc máy/chuyển động tiếp nối từ cảnh trước..."
                      />
                    </div>

                    {/* 2 Sub-Columns: English Prompt vs Vietnamese Narration */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.85rem' }}>
                      {/* Left: English Prompt */}
                      <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span>🇺🇸 AI Video Prompt (English)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(scene.englishPrompt, `Đã copy Prompt cảnh #${index + 1}`)}
                            style={{ background: '#1e293b', border: 'none', color: '#94a3b8', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Copy size={11} /> Copy
                          </button>
                        </div>
                        <textarea
                          rows={4}
                          value={scene.englishPrompt}
                          onChange={(e) => handleUpdateScene(index, 'englishPrompt', e.target.value)}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '0.8rem', fontFamily: 'monospace', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }}
                          placeholder="Detailed prompt for Runway Gen-3 / Kling AI..."
                        />
                        {scene.continuityTags && (
                          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.35rem', fontSize: '0.72rem', color: '#64748b', display: 'flex', gap: '0.35rem' }}>
                            <span style={{ color: '#818cf8', fontWeight: 600 }}>Anchor:</span>
                            <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{scene.continuityTags}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Vietnamese Voiceover */}
                      <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '0.35rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>🇻🇳 Thuyết minh (Tiếng Việt)</span>
                            <span style={{ fontSize: '0.7rem', color: isWordCountGood ? '#34d399' : '#fbbf24', fontFamily: 'monospace' }}>
                              ({voWords} từ • Chuẩn: {targetWords})
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => handlePlayVoiceover(index)}
                              style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              {playingIndex === index ? <VolumeX size={11} /> : <Volume2 size={11} />}
                              <span>{playingIndex === index ? 'Dừng' : 'Nghe'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(scene.vietnameseVoiceover, `Đã copy Lời thoại cảnh #${index + 1}`)}
                              style={{ background: '#1e293b', border: 'none', color: '#94a3b8', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Copy size={11} /> Copy
                            </button>
                          </div>
                        </div>
                        <textarea
                          rows={4}
                          value={scene.vietnameseVoiceover}
                          onChange={(e) => handleUpdateScene(index, 'vietnameseVoiceover', e.target.value)}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }}
                          placeholder="Lời thuyết minh tiếng Việt chuẩn 15-25 từ cho cảnh 6-10s..."
                        />
                        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.35rem', fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ color: '#fbbf24', fontWeight: 600 }}>🔊 SFX:</span>
                          <input
                            type="text"
                            value={scene.audioSfx || ''}
                            onChange={(e) => handleUpdateScene(index, 'audioSfx', e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '0.72rem', flex: 1 }}
                            placeholder="Gợi ý âm thanh hiệu ứng..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transition Connector Indicator */}
                  {!isLast && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#0f172a', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.2rem 0.75rem', borderRadius: '9999px', fontSize: '0.72rem', color: '#818cf8', fontFamily: 'monospace' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }}></span>
                        <span>Liền mạch chuyển tiếp &gt;&gt;</span>
                        <span style={{ color: '#64748b' }}>{project.scenes[index + 1]?.cameraMotion || 'Tiếp nối chuyển động'}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Kịch bản mẫu (Presets) */}
        {showTemplateModal && (
          <div className="modal-overlay" onClick={() => setShowTemplateModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(6px)' }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '92%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem', color: '#fff', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Thư Viện Kịch Bản Mẫu Chuẩn Liền Mạch</h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Chọn kịch bản mẫu để khám phá cấu trúc prompt và mối nối chuyển cảnh 6-10s</p>
                </div>
                <button type="button" onClick={() => setShowTemplateModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {Object.entries(PRESETS).map(([key, p]) => (
                  <div
                    key={key}
                    onClick={() => handleApplyPreset(key)}
                    style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1e293b'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#818cf8' }}>{p.name}</span>
                      <span style={{ fontSize: '0.72rem', background: '#1e293b', color: '#34d399', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontFamily: 'monospace' }}>
                        {p.scenes.length} Cảnh • ~{p.scenes.length * 8}s
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>{p.topic}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Cấu hình Gemini API Key cá nhân */}
        {showApiKeyModal && (
          <div className="modal-overlay" onClick={() => setShowApiKeyModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(6px)' }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '92%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem', color: '#fff', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Key size={18} color="#6366f1" /> Cấu Hình Google Gemini API Key
                </h3>
                <button type="button" onClick={() => setShowApiKeyModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
                <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.5 }}>
                  Bạn có thể nhập API Key Google AI Studio cá nhân (miễn phí) để tăng tốc độ và không bị giới hạn số lượt tạo kịch bản. Nếu để trống, hệ thống sẽ sử dụng key mặc định của hệ thống.
                </p>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  style={{ width: '100%', background: '#020617', border: '1px solid #334155', borderRadius: '0.65rem', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #1e293b' }}>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('rchg_gemini_api_key');
                    setCustomApiKey('');
                    setApiKeyInput('');
                    setShowApiKeyModal(false);
                    showToast('Đã chuyển về sử dụng Gemini Key mặc định của hệ thống!', 'info');
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: '#334155', color: '#94a3b8' }}
                >
                  Dùng Mặc Định
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (apiKeyInput.trim()) {
                      localStorage.setItem('rchg_gemini_api_key', apiKeyInput.trim());
                      setCustomApiKey(apiKeyInput.trim());
                      showToast('Đã lưu Google Gemini API Key cá nhân thành công!', 'success');
                    }
                    setShowApiKeyModal(false);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ background: '#6366f1', borderColor: '#6366f1' }}
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Xuất Kịch Bản */}
        {showExportModal && (
          <div className="modal-overlay" onClick={() => setShowExportModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(6px)' }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem', color: '#fff', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Xuất Kịch Bản Video</h3>
                <button type="button" onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>

              <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                Chọn định dạng xuất để đưa vào các phần mềm dựng (CapCut, Premiere, DaVinci) hoặc công cụ tạo AI Video (Runway, Kling, Luma):
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem' }}>
                <button
                  type="button"
                  onClick={() => handleExport('markdown')}
                  style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '0.85rem', textAlign: 'left', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
                >
                  <strong style={{ color: '#818cf8' }}>📄 Markdown (.md)</strong>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Đầy đủ chi tiết kịch bản, thời lượng, bảng prompt & lời thoại</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '0.85rem', textAlign: 'left', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
                >
                  <strong style={{ color: '#34d399' }}>📦 JSON Data (.json)</strong>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Dữ liệu chuẩn cấu trúc cho pipeline tự động hóa</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExport('prompts_txt')}
                  style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '0.85rem', textAlign: 'left', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
                >
                  <strong style={{ color: '#fbbf24' }}>🎬 Danh sách Prompts (Text)</strong>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Chỉ gồm các câu prompt tiếng Anh kèm thời lượng</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExport('voiceover_txt')}
                  style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '0.85rem', textAlign: 'left', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
                >
                  <strong style={{ color: '#38bdf8' }}>🎙️ Lời Thuyết Minh (Text)</strong>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Chỉ gồm lời thoại tiếng Việt căn chỉnh theo từng cảnh</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGate>
  );
}

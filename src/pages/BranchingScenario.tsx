import { useState, useRef, useEffect } from 'react';
import { 
  GitFork, 
  Plus, 
  Trash2, 
  Download, 
  Code, 
  Copy, 
  Check, 
  Play, 
  Edit3, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  Trophy, 
  AlertCircle,
  Upload,
  FolderPlus,
  Loader2,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import './BranchingScenario.css';

export interface ScenarioOption {
  id: string;
  text: string;
  targetNodeId: string;
  feedback?: string;
  score?: number;
}

export interface ScenarioNode {
  id: string;
  title: string;
  story: string;
  imageUrl?: string;
  isEnd?: boolean;
  endType?: 'success' | 'failure' | 'neutral';
  options: ScenarioOption[];
}

export interface ScenarioItem {
  id: string;
  title: string;
  description: string;
  nodes: ScenarioNode[];
}

const DEFAULT_SCENARIOS: ScenarioItem[] = [
  {
    id: 'scenario-conflict-res',
    title: 'Kịch bản 1: Giải quyết mâu thuẫn làm việc nhóm',
    description: 'Rèn luyện kỹ năng sư phạm khi học sinh tranh cãi gay gắt trong giờ thảo luận nhóm.',
    nodes: [
      {
        id: 'start',
        title: 'Tình huống 1: Hai học sinh to tiếng trong giờ thảo luận',
        story: 'Trong lúc cả lớp đang làm việc nhóm, bạn An và bạn Bình bất ngờ tranh cãi gay gắt về việc ai là người trình bày slide. Bình tức giận đập bàn và từ chối tiếp tục làm việc. Bạn sẽ xử lý thế nào?',
        imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1000&q=80',
        isEnd: false,
        options: [
          {
            id: 'opt-1-1',
            text: 'Phương án A: Quát lớn yêu cầu cả hai trật tự ngay lập tức và dọa trừ điểm hạnh kiểm.',
            targetNodeId: 'node-escalate',
            feedback: 'Hành động này làm căng thẳng leo thang và khiến học sinh cảm thấy bị áp đặt, không giải quyết được gốc rễ vấn đề.',
            score: -5
          },
          {
            id: 'opt-1-2',
            text: 'Phương án B: Nhẹ nhàng bước tới, tạm thời tách hai bạn ra và đề nghị lắng nghe lý do từ từng bạn.',
            targetNodeId: 'node-listen',
            feedback: 'Rất chuẩn xác! Sự bình tĩnh của giáo viên giúp hạ nhiệt cảm xúc và tạo không gian an toàn cho đối thoại.',
            score: 10
          }
        ]
      },
      {
        id: 'node-escalate',
        title: 'Hệ quả: Căng thẳng leo thang',
        story: 'Bình cảm thấy bất công và bức xúc bỏ ra khỏi lớp học. Giờ học bị gián đoạn và không khí lớp học trở nên ngột ngạt.',
        imageUrl: 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?auto=format&fit=crop&w=1000&q=80',
        isEnd: true,
        endType: 'failure',
        options: []
      },
      {
        id: 'node-listen',
        title: 'Tình huống 2: Tìm tiếng nói chung cho nhóm',
        story: 'Khi lắng nghe, bạn phát hiện An đã chuẩn bị nội dung rất kỹ, còn Bình là người thiết kế slide chính. Cả hai đều muốn đóng góp cho nhóm nhưng thiếu sự phân công rõ ràng. Bước tiếp theo bạn chọn là gì?',
        imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80',
        isEnd: false,
        options: [
          {
            id: 'opt-2-1',
            text: 'Gợi ý chia đôi phần thuyết trình: An mở đầu & nội dung, Bình kết luận & phản biện Q&A.',
            targetNodeId: 'node-success',
            feedback: 'Tuyệt vời! Giải pháp win-win tôn trọng công sức của cả hai bạn và rèn luyện kỹ năng làm việc nhóm thực tế.',
            score: 15
          },
          {
            id: 'opt-2-2',
            text: 'Quyết định bốc thăm ngẫu nhiên để chọn ra một bạn duy nhất trình bày.',
            targetNodeId: 'node-neutral',
            feedback: 'Bốc thăm giải quyết được tranh chấp tạm thời nhưng chưa phát huy tối đa tinh thần hợp tác của cả nhóm.',
            score: 5
          }
        ]
      },
      {
        id: 'node-success',
        title: 'Kết quả: Nhóm thuyết trình xuất sắc!',
        story: 'Cả An và Bình đều hoàn thành phần việc của mình một cách tự tin. Cả lớp dành tràng pháo tay lớn, hai bạn vui vẻ bắt tay làm hòa và đạt điểm tối đa!',
        imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
        isEnd: true,
        endType: 'success',
        options: []
      },
      {
        id: 'node-neutral',
        title: 'Kết quả: Bài học kết thúc an toàn',
        story: 'Nhóm hoàn thành bài thuyết trình đúng hạn, tuy nhiên không khí giữa các thành viên vẫn còn chút gượng gạo. Bạn cần thêm thời gian để gắn kết nhóm sau giờ học.',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80',
        isEnd: true,
        endType: 'neutral',
        options: []
      }
    ]
  },
  {
    id: 'scenario-lab-safety',
    title: 'Kịch bản 2: Xử lý sự cố an toàn trong phòng thí nghiệm',
    description: 'Tình huống bất ngờ khi hóa chất bị đổ ra bàn trong giờ thực hành Hóa - Sinh.',
    nodes: [
      {
        id: 'start',
        title: 'Tình huống 1: Hóa chất bị đổ tràn trong giờ thực hành',
        story: 'Một nhóm học sinh sơ ý làm đổ lọ dung dịch axit nhẹ ra mặt bàn thực hành. Một học sinh hoảng hốt định dùng tay không lấy giẻ lau thấm ngay. Bạn sẽ chỉ dẫn thế nào?',
        imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1000&q=80',
        isEnd: false,
        options: [
          {
            id: 'opt-lab-1',
            text: 'Phương án A: Hô lớn yêu cầu học sinh lùi lại ngay, đeo găng tay bảo hộ và dùng bột trung hòa/cát thấm theo quy trình.',
            targetNodeId: 'node-lab-success',
            feedback: 'Rất chính xác! Luôn ưu tiên an toàn cá nhân và tuân thủ đúng quy trình xử lý hóa chất.',
            score: 15
          },
          {
            id: 'opt-lab-2',
            text: 'Phương án B: Lấy vòi nước xối mạnh trực tiếp lên bàn để rửa trôi axit.',
            targetNodeId: 'node-lab-danger',
            feedback: 'Nguy hiểm! Xối vòi nước mạnh có thể làm dung dịch axit bắn vào mắt hoặc da của những người xung quanh.',
            score: -10
          }
        ]
      },
      {
        id: 'node-lab-danger',
        title: 'Hệ quả: Nguy cơ bỏng hóa chất lan rộng',
        story: 'Nước xối làm dung dịch bắn tung tóe lên áo một học sinh gần đó. Bạn phải lập tức đưa học sinh đến bồn rửa mắt và sơ cứu khẩn cấp.',
        imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80',
        isEnd: true,
        endType: 'failure',
        options: []
      },
      {
        id: 'node-lab-success',
        title: 'Kết quả: Xử lý sự cố an toàn tuyệt đối',
        story: 'Axit được trung hòa an toàn, các em học sinh hiểu rõ quy trình an toàn phòng thí nghiệm và bài thực hành tiếp tục thành công tốt đẹp.',
        imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1000&q=80',
        isEnd: true,
        endType: 'success',
        options: []
      }
    ]
  },
  {
    id: 'scenario-hotel-complaint',
    title: 'Kịch bản 3 [Khách Sạn - Du Lịch]: Xử lý khách hàng VIP phàn nàn về buồng phòng',
    description: 'Rèn luyện kỹ năng giải quyết khiếu nại (Service Recovery) theo tiêu chuẩn 5 sao.',
    nodes: [
      {
        id: 'start',
        title: 'Tình huống 1: Khách hàng giận dữ tại quầy Lễ tân',
        story: 'Ông Smith (khách VIP) bước xuống sảnh với thái độ bức xúc vì phòng Deluxe vừa nhận chưa được thay ga trải giường và điều hòa phát ra tiếng ồn lớn. Bạn là Trưởng ca Lễ tân, bước đầu tiên bạn sẽ làm gì?',
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
        isEnd: false,
        options: [
          {
            id: 'opt-ht-1',
            text: 'Phương án A: Chân thành xin lỗi, mời khách vào phòng chờ VIP dùng nước quả tươi, lắng nghe ghi chép chi tiết và đề xuất nâng hạng phòng (Upgrade) miễn phí ngay lập tức.',
            targetNodeId: 'node-ht-success',
            feedback: 'Rất chuyên nghiệp! Quy tắc L-A-S-T (Listen, Apologize, Solve, Thank) được áp dụng hoàn hảo, biến khách hàng bất mãn thành khách hàng trung thành.',
            score: 20
          },
          {
            id: 'opt-ht-2',
            text: 'Phương án B: Giải thích do bộ phận Housekeeping hôm nay quá tải và yêu cầu khách quay lại phòng chờ thợ bảo trì lên sửa.',
            targetNodeId: 'node-ht-failure',
            feedback: 'Sai lầm nghiêm trọng! Khách hàng không có trách nhiệm nghe bạn đổ lỗi cho bộ phận nội bộ. Thái độ này có thể dẫn đến việc khách hủy phòng và đánh giá 1 sao.',
            score: -15
          }
        ]
      },
      {
        id: 'node-ht-failure',
        title: 'Hệ quả: Khách bỏ khách sạn & để lại đánh giá 1 sao',
        story: 'Ông Smith hủy đặt phòng cả tuần, đăng bài phản ánh gay gắt trên TripAdvisor. Khách sạn mất doanh thu và bị ảnh hưởng uy tín nghiêm trọng.',
        imageUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1000&q=80',
        isEnd: true,
        endType: 'failure',
        options: []
      },
      {
        id: 'node-ht-success',
        title: 'Kết quả: Khách hàng ấn tượng sâu sắc và khen ngợi',
        story: 'Khách vui vẻ nhận phòng Suite hướng biển, gửi thư cảm ơn Tổng quản lý vì sự phản ứng nhanh nhẹn và chu đáo của bạn.',
        imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
        isEnd: true,
        endType: 'success',
        options: []
      }
    ]
  },
  {
    id: 'scenario-childcare-fever',
    title: 'Kịch bản 4 [Nuôi Dưỡng Trẻ - Mầm Non]: Xử trí trẻ sốt cao co giật tại lớp',
    description: 'Kỹ năng sơ cấp cứu khẩn cấp cho giáo viên mầm non và bảo mẫu.',
    nodes: [
      {
        id: 'start',
        title: 'Tình huống 1: Bé 3 tuổi bất ngờ tím tái, co giật trong giờ ngủ trưa',
        story: 'Trong giờ ngủ trưa tại trường mầm non, bé Bo (3 tuổi) có biểu hiện sốt cao đột ngột, người gồng cứng, mắt trợn và bắt đầu co giật. Bạn sẽ ưu tiên làm gì đầu tiên?',
        imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1000&q=80',
        isEnd: false,
        options: [
          {
            id: 'opt-cc-1',
            text: 'Phương án A: Đặt trẻ nằm nghiêng sang một bên nơi an toàn thoáng mát, nới lỏng quần áo, tuyệt đối không chèn ép miệng/cho ngón tay vào mồm trẻ, gọi nhân viên y tế trường ngay.',
            targetNodeId: 'node-cc-success',
            feedback: 'Rất chuẩn mực y khoa! Đặt nằm nghiêng chống sặc đường thở và không chèn vật cứng vào mồm tránh làm gãy răng hay tổn thương niêm mạc của bé.',
            score: 20
          },
          {
            id: 'opt-cc-2',
            text: 'Phương án B: Ôm ghì chặt lấy bé và cố gắng cậy miệng bé để nhét khăn hoặc thìa sắt vào lưỡi vì sợ cắn vào lưỡi.',
            targetNodeId: 'node-cc-danger',
            feedback: 'Cực kỳ nguy hiểm! Nghiên cứu y học chứng minh trẻ co giật không bao giờ tự cắn đứt lưỡi, việc cố cậy miệng có thể gây tắc thở hoặc gãy răng hóc dị vật.',
            score: -20
          }
        ]
      },
      {
        id: 'node-cc-danger',
        title: 'Hệ quả: Dị vật đường thở đe dọa tính mạng',
        story: 'Thìa làm xước rách khoang miệng chảy máu, trẻ bị sặc dịch vào phế quản. Tình trạng chuyển biến nguy kịch phải gọi cấp cứu 115 khẩn cấp.',
        imageUrl: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1000&q=80',
        isEnd: true,
        endType: 'failure',
        options: []
      },
      {
        id: 'node-cc-success',
        title: 'Kết quả: Cắt cơn co giật an toàn & hạ sốt thành công',
        story: 'Sau 2 phút trẻ qua cơn giật, đường thở thông thoáng và được nhân viên y tế chườm ấm, dùng thuốc hạ sốt qua đường hậu môn an toàn.',
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80',
        isEnd: true,
        endType: 'success',
        options: []
      }
    ]
  },
  {
    id: 'scenario-mechanical-lathe',
    title: 'Kịch bản 5 [Cơ Khí Chế Tạo]: Sự cố kẹt phoi và tiếng kêu lạ trên máy tiện',
    description: 'An toàn lao động và kỹ thuật xử lý sự cố trong xưởng cơ khí thực hành.',
    nodes: [
      {
        id: 'start',
        title: 'Tình huống 1: Máy tiện CNC phát tiếng rít lớn và phoi quấn ổ dao',
        story: 'Khi sinh viên đang thực hành tiện trục chi tiết, phoi kim loại dày bị quấn thành búi lớn quanh đài gá dao và trục chính phát ra âm thanh gầm rú bất thường. Phản ứng tức thì là gì?',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80',
        isEnd: false,
        options: [
          {
            id: 'opt-mc-1',
            text: 'Phương án A: Nhấn ngay nút dừng khẩn cấp E-STOP (Emergency Stop), lùi dao và báo giảng viên xưởng.',
            targetNodeId: 'node-mc-success',
            feedback: 'Rất chính xác! Nguyên tắc số 1 trong an toàn cơ khí là ngắt nguồn máy trước khi can thiệp vào bất kỳ vùng gia công nào.',
            score: 15
          },
          {
            id: 'opt-mc-2',
            text: 'Phương án B: Vội vàng lấy móc sắt hoặc đeo găng tay thò vào gạt búi phoi khi mâm cặp vẫn đang quay.',
            targetNodeId: 'node-mc-danger',
            feedback: 'Đại kỵ trong nghề cơ khí! Phoi quấn có thể kéo cả găng tay và cánh tay vào mâm cặp quay tốc độ cao gây tai nạn lao động nghiêm trọng.',
            score: -25
          }
        ]
      },
      {
        id: 'node-mc-danger',
        title: 'Hệ quả: Tai nạn lao động chấn thương nghiêm trọng',
        story: 'Mâm cặp cuốn móc sắt văng mạnh làm vỡ kính bảo hộ xưởng, sinh viên bị thương tích nặng.',
        imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80',
        isEnd: true,
        endType: 'failure',
        options: []
      },
      {
        id: 'node-mc-success',
        title: 'Kết quả: Bảo vệ an toàn người và máy, tối ưu chế độ cắt',
        story: 'Máy dừng êm dịu, sinh viên dùng móc chuyên dụng gỡ phoi khi máy đã ngắt điện hoàn toàn. Giảng viên hướng dẫn điều chỉnh lại bước tiến dao để bẻ phoi đạt chuẩn.',
        imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1000&q=80',
        isEnd: true,
        endType: 'success',
        options: []
      }
    ]
  }
];

export default function BranchingScenario() {
  const { showToast } = useNotification();
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quản lý nhiều kịch bản (Multiple Scenarios)
  const [scenarios, setScenarios] = useState<ScenarioItem[]>(() => {
    try {
      const saved = localStorage.getItem('branching_scenarios_library');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_SCENARIOS;
  });

  const [activeScenarioId, setActiveScenarioId] = useState<string>(() => {
    return scenarios[0]?.id || 'scenario-conflict-res';
  });

  const currentScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0] || DEFAULT_SCENARIOS[0];
  const nodes = currentScenario.nodes;

  const setNodes = (action: ScenarioNode[] | ((prev: ScenarioNode[]) => ScenarioNode[])) => {
    setScenarios(prevList => {
      return prevList.map(sc => {
        if (sc.id === activeScenarioId) {
          const nextNodes = typeof action === 'function' ? action(sc.nodes) : action;
          return { ...sc, nodes: nextNodes };
        }
        return sc;
      });
    });
  };

  // Lưu scenarios vào localStorage khi có thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('branching_scenarios_library', JSON.stringify(scenarios));
    } catch {
      // ignore
    }
  }, [scenarios]);

  const [mode, setMode] = useState<'editor' | 'simulator'>('simulator');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('start');

  // Trạng thái khi người học trải nghiệm trong Simulator
  const [currentNodeId, setCurrentNodeId] = useState<string>('start');
  const [historyLog, setHistoryLog] = useState<{
    nodeTitle: string;
    chosenText: string;
    feedback?: string;
    score: number;
  }[]>([]);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  // Modal export
  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];
  const currentNode = nodes.find(n => n.id === currentNodeId) || nodes[0];

  // Xử lý khi người học chọn 1 phương án trong Simulator
  const handleSelectOption = (opt: ScenarioOption) => {
    const nextScore = currentScore + (opt.score || 0);
    setCurrentScore(nextScore);
    setLastFeedback(opt.feedback || null);

    setHistoryLog(prev => [
      ...prev,
      {
        nodeTitle: currentNode.title,
        chosenText: opt.text,
        feedback: opt.feedback,
        score: opt.score || 0
      }
    ]);

    setCurrentNodeId(opt.targetNodeId);
  };

  // Khởi động lại simulator
  const handleRestartSimulator = () => {
    setCurrentNodeId('start');
    setCurrentScore(0);
    setHistoryLog([]);
    setLastFeedback(null);
  };

  // Quản lý kịch bản: Thêm kịch bản mới
  const handleCreateScenario = () => {
    const title = window.prompt('Nhập tên kịch bản mới (ví dụ: Kịch bản 3: Sơ cứu chấn thương thể dục):');
    if (!title || !title.trim()) return;

    const newScenarioId = `scenario-${Date.now()}`;
    const newScenario: ScenarioItem = {
      id: newScenarioId,
      title: title.trim(),
      description: 'Mô tả ngắn gọn về tình huống và mục tiêu học tập...',
      nodes: [
        {
          id: 'start',
          title: 'Tình huống 1: Mở đầu câu chuyện',
          story: 'Mô tả bối cảnh tình huống thực tế mà người học phải đối mặt tại đây...',
          imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80',
          isEnd: false,
          options: [
            {
              id: `opt-${Date.now()}-1`,
              text: 'Phương án A: Cách xử lý thứ nhất...',
              targetNodeId: `node-end-${Date.now()}`,
              feedback: 'Nhận xét về lựa chọn này...',
              score: 10
            }
          ]
        },
        {
          id: `node-end-${Date.now()}`,
          title: 'Kết quả giải quyết',
          story: 'Diễn biến và kết quả của sự việc sau khi người học lựa chọn phương án trên...',
          isEnd: true,
          endType: 'success',
          options: []
        }
      ]
    };

    setScenarios(prev => [...prev, newScenario]);
    setActiveScenarioId(newScenarioId);
    setSelectedNodeId('start');
    setCurrentNodeId('start');
    setCurrentScore(0);
    setHistoryLog([]);
    setLastFeedback(null);
    showToast(`Đã tạo kịch bản mới: "${title.trim()}"!`, 'success');
  };

  // Đổi tên kịch bản hiện tại
  const handleRenameScenario = () => {
    const newTitle = window.prompt('Nhập tên mới cho kịch bản này:', currentScenario.title);
    if (!newTitle || !newTitle.trim() || newTitle.trim() === currentScenario.title) return;

    setScenarios(prev => prev.map(s => s.id === activeScenarioId ? { ...s, title: newTitle.trim() } : s));
    showToast('Đã cập nhật tên kịch bản!', 'success');
  };

  // Xóa kịch bản hiện tại
  const handleDeleteScenario = (id: string) => {
    if (scenarios.length <= 1) {
      showToast('Cần giữ lại ít nhất 1 kịch bản!', 'warning');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa kịch bản "${currentScenario.title}" không?`)) return;

    const remaining = scenarios.filter(s => s.id !== id);
    setScenarios(remaining);
    setActiveScenarioId(remaining[0].id);
    setSelectedNodeId('start');
    setCurrentNodeId('start');
    setCurrentScore(0);
    setHistoryLog([]);
    setLastFeedback(null);
    showToast('Đã xóa kịch bản.', 'info');
  };

  // Xử lý upload ảnh minh họa (lên Google Drive hoặc nạp Base64)
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Giới hạn 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.', 'warning');
      return;
    }

    setIsUploadingImage(true);

    try {
      // 1. Chuyển ảnh sang Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Thử tải lên Google Drive nếu người dùng đã đăng nhập có token
      if (token) {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              imageBase64: base64Data,
              filename: `scenario-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              handleUpdateNode({ imageUrl: data.url });
              showToast('Đã tải ảnh lên Google Drive thành công!', 'success');
              setIsUploadingImage(false);
              return;
            }
          }
        } catch (uploadErr) {
          console.warn('Lỗi khi tải ảnh lên Google Drive:', uploadErr);
        }
      }

      // 3. Fallback: Nếu chưa đăng nhập hoặc Drive chưa cấu hình / lỗi, dùng Base64 trực tiếp
      handleUpdateNode({ imageUrl: base64Data });
      if (token) {
        showToast('Google Drive chưa được cấu hình hoặc phản hồi lỗi, đã lưu ảnh dưới dạng nội bộ!', 'info');
      } else {
        showToast('Đã tải ảnh lên cục bộ (Đăng nhập để tự động lưu vào Google Drive)!', 'info');
      }
    } catch (err: any) {
      showToast('Không thể đọc file ảnh: ' + (err.message || 'Lỗi không xác định'), 'error');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Xóa ảnh của nút hiện tại
  const handleRemoveImage = () => {
    handleUpdateNode({ imageUrl: '' });
    showToast('Đã gỡ ảnh minh họa của tình huống này.', 'info');
  };

  // Thêm Node mới
  const handleAddNode = () => {
    const newId = `node-${Date.now()}`;
    const newNode: ScenarioNode = {
      id: newId,
      title: `Nút tình huống #${nodes.length + 1}`,
      story: 'Nhập nội dung câu chuyện / bối cảnh tình huống tại đây...',
      imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1000&q=80',
      isEnd: false,
      options: [
        {
          id: `opt-${Date.now()}-1`,
          text: 'Lựa chọn 1...',
          targetNodeId: 'start',
          score: 5
        }
      ]
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newId);
    showToast('Đã thêm nút tình huống mới!', 'success');
  };

  // Cập nhật node đang chọn
  const handleUpdateNode = (updated: Partial<ScenarioNode>) => {
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, ...updated } : n));
  };

  // Xóa node
  const handleDeleteNode = (id: string) => {
    if (id === 'start') {
      showToast('Không thể xóa nút khởi đầu (start)!', 'warning');
      return;
    }
    setNodes(prev => prev.filter(n => n.id !== id));
    setSelectedNodeId('start');
    showToast('Đã xóa nút tình huống.', 'info');
  };

  // Thêm phương án lựa chọn cho node đang chọn
  const handleAddOption = () => {
    const newOpt: ScenarioOption = {
      id: `opt-${Date.now()}`,
      text: 'Lựa chọn phương án mới...',
      targetNodeId: nodes.find(n => n.id !== selectedNodeId)?.id || 'start',
      score: 5,
      feedback: 'Giải thích tác động của lựa chọn này...'
    };
    handleUpdateNode({
      options: [...(selectedNode.options || []), newOpt]
    });
  };

  // Cập nhật phương án
  const handleUpdateOption = (optId: string, updated: Partial<ScenarioOption>) => {
    const newOpts = (selectedNode.options || []).map(o => o.id === optId ? { ...o, ...updated } : o);
    handleUpdateNode({ options: newOpts });
  };

  // Xóa phương án
  const handleDeleteOption = (optId: string) => {
    const newOpts = (selectedNode.options || []).filter(o => o.id !== optId);
    handleUpdateNode({ options: newOpts });
  };

  // Tạo file HTML độc lập cho LMS
  const generateStandaloneHtml = () => {
    const nodesJson = JSON.stringify(nodes);
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mô Phỏng Tình Huống Phân Nhánh (Branching Scenario)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; margin: 0; }
    .wrapper { width: 100%; max-width: 860px; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 45px rgba(0,0,0,0.6); border: 1px solid #334155; position: relative; }
    
    .sim-hero { position: relative; width: 100%; height: 260px; background: #020617; }
    .sim-hero img { width: 100%; height: 100%; object-fit: cover; opacity: 0.85; }
    .sim-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15, 23, 42, 0.1) 0%, rgba(15, 23, 42, 0.95) 100%); display: flex; flex-direction: column; justify-content: flex-end; padding: 20px; }
    .sim-badge { background: #8b5cf6; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; width: fit-content; margin-bottom: 8px; }
    .sim-title { font-size: 20px; font-weight: 700; color: #ffffff; line-height: 1.3; }
    
    .sim-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .sim-story { font-size: 16px; line-height: 1.65; color: #e2e8f0; background: #0f172a; padding: 18px 20px; border-radius: 12px; border: 1px solid #334155; white-space: pre-line; }
    
    .options-list { display: flex; flex-direction: column; gap: 12px; }
    .btn-opt { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: #0f172a; border: 1.5px solid #334155; border-radius: 10px; color: #f8fafc; font-size: 15px; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.2s; }
    .btn-opt:hover { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.15); transform: translateX(4px); }
    
    .feedback-box { padding: 14px 18px; border-radius: 10px; background: rgba(59, 130, 246, 0.12); border: 1px solid #3b82f6; color: #93c5fd; font-size: 14.5px; line-height: 1.5; display: none; }
    
    .end-screen { text-align: center; padding: 30px 20px; display: none; flex-direction: column; align-items: center; gap: 16px; }
    .trophy-icon { font-size: 54px; }
    .btn-restart { padding: 10px 24px; background: #8b5cf6; border: none; border-radius: 8px; color: #fff; font-weight: 700; font-size: 15px; cursor: pointer; }
    .btn-restart:hover { background: #7c3aed; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="sim-hero">
      <img id="sim-img" src="" alt="Scene">
      <div class="sim-overlay">
        <div id="sim-badge" class="sim-badge">TÌNH HUỐNG THỰC TẾ</div>
        <div id="sim-title" class="sim-title"></div>
      </div>
    </div>
    
    <div class="sim-body">
      <div id="sim-story" class="sim-story"></div>
      <div id="feedback-box" class="feedback-box"></div>
      <div id="options-list" class="options-list"></div>
      
      <div id="end-screen" class="end-screen">
        <div class="trophy-icon">🏆</div>
        <h2 id="end-title" style="color: #38bdf8;">Hoàn thành tình huống!</h2>
        <p id="end-desc" style="color: #cbd5e1; max-width: 500px; line-height: 1.6;"></p>
        <button class="btn-restart" onclick="restart()">Thử lại từ đầu</button>
      </div>
    </div>
  </div>

  <script>
    const NODES = ${nodesJson};
    let currentId = 'start';
    let score = 0;

    const imgEl = document.getElementById('sim-img');
    const titleEl = document.getElementById('sim-title');
    const storyEl = document.getElementById('sim-story');
    const optList = document.getElementById('options-list');
    const feedbackBox = document.getElementById('feedback-box');
    const endScreen = document.getElementById('end-screen');
    const endTitle = document.getElementById('end-title');
    const endDesc = document.getElementById('end-desc');

    function renderNode(nodeId) {
      const node = NODES.find(n => n.id === nodeId) || NODES[0];
      currentId = node.id;

      if (node.imageUrl) {
        imgEl.src = node.imageUrl;
        imgEl.style.display = 'block';
      } else {
        imgEl.style.display = 'none';
      }

      titleEl.innerText = node.title;
      storyEl.innerText = node.story;

      if (node.isEnd) {
        optList.style.display = 'none';
        endScreen.style.display = 'flex';
        endTitle.innerText = node.endType === 'success' ? '🎉 Xuất Sắc!' : (node.endType === 'failure' ? '⚠️ Chưa Tối Ưu!' : 'Đã Hoàn Thành');
        endDesc.innerText = 'Tổng điểm tích lũy: ' + score + ' điểm. Bạn đã đưa ra các quyết định xử lý tình huống thực tế.';
      } else {
        optList.style.display = 'flex';
        endScreen.style.display = 'none';
        optList.innerHTML = '';

        (node.options || []).forEach(opt => {
          const btn = document.createElement('button');
          btn.className = 'btn-opt';
          btn.innerHTML = '<span>' + opt.text + '</span> <span>→</span>';
          btn.onclick = function() {
            score += (opt.score || 0);
            if (opt.feedback) {
              feedbackBox.style.display = 'block';
              feedbackBox.innerText = '💡 Nhận xét: ' + opt.feedback;
            } else {
              feedbackBox.style.display = 'none';
            }
            renderNode(opt.targetNodeId);
          };
          optList.appendChild(btn);
        });
      }
    }

    function restart() {
      score = 0;
      feedbackBox.style.display = 'none';
      renderNode('start');
    }

    renderNode('start');
  </script>
</body>
</html>`;
  };

  const handleExportHtml = () => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tinh-huong-phan-nhanh-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file HTML Tình Huống Phân Nhánh!', 'success');
  };

  const generateIframeCode = () => {
    const html = generateStandaloneHtml();
    const utf8Bytes = new TextEncoder().encode(html);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 = btoa(binary);

    return `<!-- MA NHUNG TINH HUONG PHAN NHANH CHO LMS / E-LEARNING (CHUAN 16:9) -->
<div style="position:relative;width:100%;height:auto;aspect-ratio:16/9;padding-top:0;margin:15px auto;background:#0f172a;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.35);">
  <iframe 
    src="data:text/html;charset=utf-8;base64,${b64}" 
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;margin:0;padding:0;" 
    width="100%"
    height="100%"
    allow="fullscreen" 
    allowfullscreen="allowfullscreen">
  </iframe>
</div>
<!-- KET THUC MA NHUNG -->`;
  };

  const handleCopyIframe = async () => {
    try {
      await navigator.clipboard.writeText(generateIframeCode());
      setCopied(true);
      showToast('Đã sao chép mã nhúng Iframe!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Không thể sao chép tự động, vui lòng copy thủ công.', 'warning');
    }
  };

  return (
    <div className="scenario-container animate-fade-in">
      <header className="bs-header">
        <div className="bs-title-group">
          <div className="bs-icon">
            <GitFork size={26} />
          </div>
          <div>
            <h1 className="bs-title">Mô Phỏng Tình Huống Phân Nhánh (Branching Scenario)</h1>
            <p className="bs-subtitle">
              Thiết kế kịch bản học tập theo cây quyết định, đưa người học vào tình huống thực tế và rèn luyện kỹ năng giải quyết vấn đề.
            </p>
          </div>
        </div>

        <div className="bs-header-actions">
          <div className="bs-mode-tabs">
            <button 
              type="button" 
              className={`bs-tab-btn ${mode === 'simulator' ? 'active' : ''}`}
              onClick={() => { setMode('simulator'); handleRestartSimulator(); }}
            >
              <Play size={15} /> Người học thử nghiệm
            </button>
            <button 
              type="button" 
              className={`bs-tab-btn ${mode === 'editor' ? 'active' : ''}`}
              onClick={() => setMode('editor')}
            >
              <Edit3 size={15} /> Soạn kịch bản
            </button>
          </div>

          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
            onClick={() => setShowExportModal(true)}
          >
            <Code size={15} /> Lấy Mã Nhúng Iframe
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={handleExportHtml}
            style={{ background: '#10b981', border: 'none' }}
          >
            <Download size={15} /> Tải Tệp HTML
          </button>
        </div>
      </header>

      {/* Thanh chọn & quản lý Kịch Bản (Multiple Scenarios Switcher) */}
      <div className="bs-scenario-bar">
        <div className="bs-scenario-bar-left">
          <BookOpen size={18} className="text-primary" />
          <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Kịch bản đang chọn:
          </span>
          <select 
            className="bs-scenario-select"
            value={activeScenarioId}
            onChange={(e) => {
              setActiveScenarioId(e.target.value);
              setSelectedNodeId('start');
              handleRestartSimulator();
            }}
          >
            {scenarios.map(sc => (
              <option key={sc.id} value={sc.id}>
                {sc.title} ({sc.nodes.length} nút)
              </option>
            ))}
          </select>
        </div>

        <div className="bs-scenario-bar-actions">
          <button 
            type="button" 
            className="btn btn-primary btn-xs"
            onClick={handleCreateScenario}
          >
            <FolderPlus size={13} /> Thêm kịch bản mới
          </button>
          <button 
            type="button" 
            className="btn btn-outline btn-xs"
            onClick={handleRenameScenario}
            title="Đổi tên kịch bản hiện tại"
          >
            <Edit3 size={13} /> Đổi tên
          </button>
          {scenarios.length > 1 && (
            <button 
              type="button" 
              className="btn btn-outline btn-xs"
              style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}
              onClick={() => handleDeleteScenario(activeScenarioId)}
              title="Xóa kịch bản này"
            >
              <Trash2 size={13} /> Xóa kịch bản
            </button>
          )}
        </div>
      </div>

      {/* Chế độ Simulator (Người học trải nghiệm) */}
      {mode === 'simulator' && (
        <div className="bs-simulator-wrap animate-fade-in">
          <div className="bs-sim-hero">
            {currentNode.imageUrl ? (
              <img src={currentNode.imageUrl} alt="Scene" className="bs-sim-img" />
            ) : null}
            <div className="bs-sim-overlay">
              <span className="bs-sim-badge">
                <Sparkles size={13} /> {currentNode.isEnd ? 'KẾT THÚC KỊCH BẢN' : 'TÌNH HUỐNG THỰC TẾ'}
              </span>
              <h2 className="bs-sim-node-title">{currentNode.title}</h2>
            </div>
          </div>

          <div className="bs-sim-content">
            <div className="bs-sim-story">
              {currentNode.story}
            </div>

            {lastFeedback && (
              <div className="bs-feedback-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <AlertCircle size={16} /> Nhận xét phản hồi:
                </div>
                <div>{lastFeedback}</div>
              </div>
            )}

            {!currentNode.isEnd ? (
              <div>
                <h4 className="bs-label" style={{ marginBottom: '0.75rem' }}>
                  👉 Bạn sẽ quyết định xử lý như thế nào?
                </h4>
                <div className="bs-sim-options-list">
                  {currentNode.options.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      className="bs-sim-opt-btn"
                      onClick={() => handleSelectOption(opt)}
                    >
                      <span>{opt.text}</span>
                      <ArrowRight size={18} color="var(--primary)" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bs-end-screen animate-fade-in">
                <div 
                  className="bs-end-trophy"
                  style={{
                    background: currentNode.endType === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: currentNode.endType === 'success' ? '#10b981' : '#ef4444'
                  }}
                >
                  {currentNode.endType === 'success' ? <Trophy size={38} /> : <AlertCircle size={38} />}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                  {currentNode.endType === 'success' ? 'Chúc mừng! Bạn đã giải quyết xuất sắc' : 'Bài học chưa đạt hiệu quả tối ưu'}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.5 }}>
                  Điểm số tích lũy: <strong>{currentScore} điểm</strong> qua {historyLog.length} bước ra quyết định.
                </p>
                <button type="button" className="btn btn-primary" onClick={handleRestartSimulator}>
                  <RotateCcw size={15} /> Thử lại với phương án khác
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chế độ Editor (Soạn kịch bản) */}
      {mode === 'editor' && (
        <div className="bs-layout-grid animate-fade-in">
          {/* Cột trái: Danh sách các nút tình huống */}
          <div className="bs-panel">
            <div className="bs-panel-header">
              <h3 className="bs-label" style={{ fontSize: '1.05rem', margin: 0 }}>
                Cây tình huống ({nodes.length})
              </h3>
              <button type="button" className="btn btn-outline btn-xs" onClick={handleAddNode}>
                <Plus size={13} /> Thêm nút
              </button>
            </div>

            <div className="bs-nodes-list">
              {nodes.map(n => (
                <div 
                  key={n.id}
                  className={`bs-node-item ${selectedNodeId === n.id ? 'active' : ''}`}
                  onClick={() => setSelectedNodeId(n.id)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      ID: {n.id} • {n.isEnd ? 'Điểm kết thúc' : `${n.options.length} lựa chọn`}
                    </div>
                  </div>
                  <span className={`bs-node-tag ${n.id === 'start' ? 'bs-tag-start' : (n.isEnd ? 'bs-tag-end' : 'bs-tag-branch')}`}>
                    {n.id === 'start' ? 'Bắt đầu' : (n.isEnd ? 'Kết thúc' : 'Nhánh')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Biên tập chi tiết node đang chọn */}
          <div className="bs-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={18} color="var(--primary)" /> Chỉnh sửa: {selectedNode.title}
              </h3>
              {selectedNode.id !== 'start' && (
                <button 
                  type="button" 
                  className="btn btn-outline btn-xs" 
                  style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}
                  onClick={() => handleDeleteNode(selectedNode.id)}
                >
                  <Trash2 size={13} /> Xóa nút
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="bs-label">Tiêu đề tình huống</label>
                <input 
                  type="text" 
                  className="bs-input" 
                  value={selectedNode.title}
                  onChange={(e) => handleUpdateNode({ title: e.target.value })}
                />
              </div>

              <div>
                <label className="bs-label">Nội dung câu chuyện / Bối cảnh</label>
                <textarea 
                  className="bs-textarea" 
                  rows={4}
                  value={selectedNode.story}
                  onChange={(e) => handleUpdateNode({ story: e.target.value })}
                />
              </div>

              {/* Phần ảnh minh họa: Hỗ trợ URL & Tải ảnh lên Google Drive */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="bs-label" style={{ margin: 0 }}>
                    Ảnh minh họa tình huống
                  </label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Nhập link hoặc tải ảnh lên Google Drive
                  </span>
                </div>

                <div className="bs-image-upload-zone">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      className="bs-input" 
                      value={selectedNode.imageUrl || ''}
                      placeholder="Dán link ảnh (https://...) hoặc bấm tải lên..."
                      onChange={(e) => handleUpdateNode({ imageUrl: e.target.value })}
                    />
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                    />

                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm bs-btn-upload"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      title="Tải ảnh lên Google Drive (theo cấu hình hệ thống)"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Đang tải...
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> Tải ảnh lên
                        </>
                      )}
                    </button>
                  </div>

                  {selectedNode.imageUrl && (
                    <div className="bs-image-preview-card">
                      <img 
                        src={selectedNode.imageUrl} 
                        alt="Preview" 
                        className="bs-image-preview-thumb" 
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="bs-image-preview-info">
                        <span className="bs-image-preview-url" title={selectedNode.imageUrl}>
                          {selectedNode.imageUrl.startsWith('data:') 
                            ? 'Ảnh cục bộ (Base64 data URL)' 
                            : selectedNode.imageUrl}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          {!selectedNode.imageUrl.startsWith('data:') && (
                            <a 
                              href={selectedNode.imageUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="bs-preview-link"
                            >
                              <ExternalLink size={12} /> Xem ảnh gốc
                            </a>
                          )}
                          <button 
                            type="button" 
                            className="bs-preview-remove-btn"
                            onClick={handleRemoveImage}
                          >
                            <Trash2 size={12} /> Gỡ ảnh
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <input 
                    type="checkbox" 
                    checked={!!selectedNode.isEnd}
                    onChange={(e) => handleUpdateNode({ isEnd: e.target.checked })}
                  />
                  Đặt đây là nút kết thúc kịch bản
                </label>

                {selectedNode.isEnd && (
                  <select 
                    className="bs-select"
                    style={{ width: 'auto' }}
                    value={selectedNode.endType || 'success'}
                    onChange={(e) => handleUpdateNode({ endType: e.target.value as any })}
                  >
                    <option value="success">Kết thúc thành công (Tốt)</option>
                    <option value="failure">Kết thúc thất bại (Cần rút kinh nghiệm)</option>
                    <option value="neutral">Kết thúc trung tính</option>
                  </select>
                )}
              </div>

              {/* Danh sách lựa chọn của node */}
              {!selectedNode.isEnd && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label className="bs-label" style={{ margin: 0 }}>
                      Các phương án lựa chọn ({selectedNode.options.length})
                    </label>
                    <button type="button" className="btn btn-outline btn-xs" onClick={handleAddOption}>
                      <Plus size={13} /> Thêm phương án
                    </button>
                  </div>

                  {selectedNode.options.map((opt, idx) => (
                    <div key={opt.id} className="bs-opt-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                          Phương án #{idx + 1}
                        </span>
                        <button 
                          type="button" 
                          className="btn btn-outline btn-xs" 
                          style={{ color: 'var(--danger)', border: 'none', padding: '2px' }}
                          onClick={() => handleDeleteOption(opt.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <input 
                        type="text" 
                        className="bs-input" 
                        value={opt.text}
                        placeholder="Nội dung người học chọn..."
                        onChange={(e) => handleUpdateOption(opt.id, { text: e.target.value })}
                      />

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.5rem' }}>
                        <div>
                          <label className="bs-label" style={{ fontSize: '0.78rem' }}>Chuyển tới nút:</label>
                          <select 
                            className="bs-select"
                            value={opt.targetNodeId}
                            onChange={(e) => handleUpdateOption(opt.id, { targetNodeId: e.target.value })}
                          >
                            {nodes.map(n => (
                              <option key={n.id} value={n.id}>{n.title} ({n.id})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="bs-label" style={{ fontSize: '0.78rem' }}>Điểm cộng/trừ:</label>
                          <input 
                            type="number" 
                            className="bs-input" 
                            value={opt.score ?? 0}
                            onChange={(e) => handleUpdateOption(opt.id, { score: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      <input 
                        type="text" 
                        className="bs-input" 
                        value={opt.feedback || ''}
                        placeholder="Lời nhận xét khi học sinh chọn cách này..."
                        onChange={(e) => handleUpdateOption(opt.id, { feedback: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Lấy mã nhúng Iframe */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Code size={18} color="var(--primary)" /> Mã Nhúng LMS Cho Tình Huống Phân Nhánh</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowExportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Sao chép đoạn mã bên dưới để nhúng kịch bản mô phỏng tương tác này vào LMS của trường bạn (Canvas, Moodle, Blackboard, Google Sites...). Người học có thể tương tác và ra quyết định trực tiếp trên bài giảng!
              </p>
              <div className="export-result-box">
                <div className="export-result-header">
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Mã HTML Iframe độc lập (Tự chuyển kịch bản & tính điểm)</span>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-xs"
                    onClick={handleCopyIframe}
                    style={{ background: copied ? '#10b981' : 'var(--primary)' }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
                <pre className="export-code-block">{generateIframeCode()}</pre>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowExportModal(false)}>Đóng</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleCopyIframe}>
                {copied ? 'Đã sao chép' : 'Sao chép mã nhúng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

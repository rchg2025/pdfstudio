import { useState } from 'react';
import { Mic, FileAudio, Play, Download, Loader2, Wand2, Settings2, Trash2 } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import FileUploadZone from '../components/FileUploadZone';
import './TextToSpeech.css';

export default function TextToSpeech() {
  const [text, setText] = useState('');
  const [referenceAudio, setReferenceAudio] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultAudioUrl, setResultAudioUrl] = useState<string | null>(null);
  
  // API URL của máy chủ OmniVoice (Sẽ do người dùng tự host backend python và điền vào)
  const [apiUrl, setApiUrl] = useState('http://localhost:8000/api/tts');
  const [showSettings, setShowSettings] = useState(false);

  const { showAlert } = useDialogs();

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    const audioFiles = fileArray.filter(f => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|m4a|ogg|aac)$/i));
    if (audioFiles.length === 0) {
      showAlert('Vui lòng tải lên file âm thanh hợp lệ để làm giọng mẫu (Reference Voice).', 'Lỗi định dạng');
      return;
    }
    setReferenceAudio(audioFiles[0]);
    // Reset kết quả cũ nếu đổi giọng mẫu
    setResultAudioUrl(null);
  };

  const generateSpeech = async () => {
    if (!text.trim()) {
      showAlert('Vui lòng nhập văn bản cần đọc.', 'Thiếu thông tin');
      return;
    }
    if (!referenceAudio) {
      showAlert('Vui lòng tải lên 1 đoạn âm thanh mẫu (giọng cá nhân) để hệ thống Clone Voice.', 'Thiếu giọng mẫu');
      return;
    }

    setIsProcessing(true);
    setResultAudioUrl(null);

    try {
      // ---------------------------------------------------------------------------------
      // MÔ PHỎNG GỌI API ĐẾN BACKEND OMNIVOICE (HOẶC API BẤT KỲ)
      // Do Vercel không có GPU để chạy OmniVoice, code thực tế sẽ call sang 1 backend Python
      // ---------------------------------------------------------------------------------
      
      const formData = new FormData();
      formData.append('text', text);
      formData.append('reference_audio', referenceAudio);

      /* 
      // CODE GỌI API THỰC TẾ (Đã bị comment lại để tránh lỗi khi bạn chưa có server)
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('API xử lý thất bại: ' + response.statusText);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      setResultAudioUrl(audioUrl);
      */

      // -- MÔ PHỎNG LOGIC --
      // Giả lập thời gian server xử lý AI Voice Cloning
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Thông báo cho người dùng biết cần kết nối Backend
      showAlert('Hiện tại giao diện đã hoàn thiện, nhưng để chạy được mô hình OmniVoice (Voice Cloning), bạn cần có một Server Backend bằng Python/PyTorch hỗ trợ GPU. Hãy trỏ API URL trong mục Cài đặt tới server của bạn.', 'Yêu cầu Backend OmniVoice');
      
      // Tạo một âm thanh rỗng hoặc demo tạm để hiển thị player
      // Ở đây ta không tạo âm thanh thật mà chỉ dừng lại
      
    } catch (error: any) {
      console.error(error);
      showAlert('Lỗi khi tạo giọng nói: ' + error.message, 'Lỗi Server');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultAudioUrl) return;
    const a = document.createElement('a');
    a.href = resultAudioUrl;
    a.download = `omni_voice_cloned_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="tts-container">
      <div className="tool-header text-center mb-8">
        <h1 className="text-gradient text-3xl mb-2">Đọc Văn Bản (Voice Cloning)</h1>
        <p className="text-secondary">Sử dụng công nghệ AI (OmniVoice) để nhân bản giọng nói cá nhân của bạn và đọc bất kỳ văn bản nào.</p>
      </div>

      <div className="glass-card">
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors"
          >
            <Settings2 size={16} /> Cấu hình API Backend
          </button>
        </div>

        {showSettings && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">OmniVoice API Endpoint URL:</label>
            <input 
              type="text" 
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Ví dụ: http://127.0.0.1:8000/api/tts"
            />
            <p className="text-xs text-gray-500 mt-2">
              (Mô hình OmniVoice yêu cầu GPU. Bạn cần tải source k2-fsa/OmniVoice về server riêng, bọc FastAPI và điền link API vào đây).
            </p>
          </div>
        )}

        <div className="tts-layout">
          {/* CỘT TRÁI: NHẬP LIỆU */}
          <div className="tts-section">
            <div className="tts-input-group">
              <label><FileAudio size={18} /> 1. Tải lên giọng mẫu (Reference Voice)</label>
              {!referenceAudio ? (
                <FileUploadZone 
                  onFileSelect={handleFileUpload} 
                  accept="audio/*" 
                  hintText="Kéo thả 1 đoạn file âm thanh ngắn (3-10 giây) giọng của bạn vào đây."
                />
              ) : (
                <div className="tts-reference-card">
                  <div className="tts-reference-info">
                    <Mic className="text-blue-500" />
                    <div>
                      <div className="font-semibold text-sm">{referenceAudio.name}</div>
                      <div className="text-xs text-gray-500">Đã sẵn sàng để nhân bản (Clone)</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setReferenceAudio(null); setResultAudioUrl(null); }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Xóa giọng mẫu"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="tts-input-group">
              <label><Wand2 size={18} /> 2. Nhập văn bản cần đọc</label>
              <textarea 
                className="tts-textarea"
                placeholder="Ví dụ: Chào mọi người, tôi là phiên bản AI được nhân bản từ giọng gốc của bạn..."
                value={text}
                onChange={e => setText(e.target.value)}
              ></textarea>
            </div>

            <button 
              className="btn-primary flex items-center justify-center w-full py-3"
              onClick={generateSpeech}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <><Loader2 className="animate-spin mr-2" /> Đang tạo giọng nói AI...</>
              ) : (
                <><Play className="mr-2" /> Bắt Đầu Đọc (Tạo Giọng)</>
              )}
            </button>
          </div>

          {/* CỘT PHẢI: KẾT QUẢ */}
          <div className="tts-section">
            <div className={`tts-result ${resultAudioUrl ? 'has-audio' : ''}`}>
              {!resultAudioUrl ? (
                <div className="text-center text-gray-400 flex flex-col items-center gap-3">
                  <FileAudio size={48} className="opacity-50" />
                  <p>Bấm "Bắt Đầu Đọc" để hệ thống nhân bản giọng nói của bạn.</p>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-6">
                  <div className="text-green-500 font-bold text-lg flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    Tạo giọng nói thành công!
                  </div>
                  
                  <audio 
                    src={resultAudioUrl} 
                    controls 
                    autoPlay
                    className="tts-audio-player"
                  />

                  <button 
                    className="btn flex items-center justify-center w-full gap-2"
                    style={{ background: '#10b981', color: 'white' }}
                    onClick={downloadResult}
                  >
                    <Download size={20} /> Tải file âm thanh về máy (.wav)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

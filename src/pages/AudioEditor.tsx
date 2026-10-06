import React, { useState, useRef } from 'react';
import { Scissors, Merge, Music, Trash2, GripVertical, Download, Loader2 } from 'lucide-react';
import { useDialogs } from '../components/CustomDialogs';
import FileUploadZone from '../components/FileUploadZone';
import AuthGate from '../components/AuthGate';
import './AudioEditor.css';

// Hàm helper xuất AudioBuffer ra file WAV (chuẩn pcm 16-bit)
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let offset = 0;
  let pos = 0;

  // Header WAV
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  // Ghi dữ liệu âm thanh
  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([bufferArray], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

export default function AudioEditor() {
  const [activeTab, setActiveTab] = useState<'cut' | 'merge'>('cut');
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { showAlert } = useDialogs();
  
  // Dành cho tính năng cắt
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState({ m: 0, s: 0 });
  const [endTime, setEndTime] = useState({ m: 0, s: 0 });
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Drag and drop sắp xếp
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleFileUpload = (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;
    const fileArray = Array.from(uploadedFiles);
    const audioFiles = fileArray.filter(f => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|m4a|ogg|aac)$/i));
    if (audioFiles.length === 0) {
      showAlert('Vui lòng chọn file âm thanh (MP3, WAV, ...)', 'Lỗi định dạng');
      return;
    }
    
    if (activeTab === 'cut') {
      const file = audioFiles[0];
      setFiles([file]);
      // Load duration
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
        setEndTime({ m: Math.floor(audio.duration / 60), s: Math.floor(audio.duration % 60) });
      };
    } else {
      setFiles(prev => [...prev, ...audioFiles]);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null) return;
    const newFiles = [...files];
    const draggedFile = newFiles[draggedIdx];
    newFiles.splice(draggedIdx, 1);
    newFiles.splice(index, 0, draggedFile);
    setFiles(newFiles);
    setDraggedIdx(null);
  };

  const decodeAudio = async (file: File, ctx: AudioContext): Promise<AudioBuffer> => {
    const arrayBuffer = await file.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      showAlert('Vui lòng chọn ít nhất 2 file để ghép.', 'Thiếu File');
      return;
    }
    setIsProcessing(true);
    setProgress(0);
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let buffers: AudioBuffer[] = [];
      
      for (let i = 0; i < files.length; i++) {
        setProgress(Math.floor((i / files.length) * 50));
        buffers.push(await decodeAudio(files[i], audioCtx));
      }

      setProgress(60);
      
      let totalLength = 0;
      let numOfChannels = 1;
      let sampleRate = buffers[0].sampleRate;
      
      buffers.forEach(b => {
        totalLength += b.length;
        if (b.numberOfChannels > numOfChannels) numOfChannels = b.numberOfChannels;
      });

      const mergedBuffer = audioCtx.createBuffer(numOfChannels, totalLength, sampleRate);
      let offset = 0;

      for (let i = 0; i < buffers.length; i++) {
        setProgress(60 + Math.floor((i / files.length) * 20));
        const b = buffers[i];
        for (let channel = 0; channel < numOfChannels; channel++) {
          const actualChannel = channel < b.numberOfChannels ? channel : 0;
          const data = mergedBuffer.getChannelData(channel);
          data.set(b.getChannelData(actualChannel), offset);
        }
        offset += b.length;
      }

      setProgress(85);
      const wavBlob = audioBufferToWav(mergedBuffer);
      setProgress(100);
      
      downloadBlob(wavBlob, 'merged_audio.wav');
    } catch (e: any) {
      console.error(e);
      showAlert('Có lỗi xảy ra khi xử lý file âm thanh: ' + e.message, 'Lỗi');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleCut = async () => {
    if (files.length === 0) return;
    
    const startSec = startTime.m * 60 + startTime.s;
    const endSec = endTime.m * 60 + endTime.s;
    
    if (startSec >= endSec || endSec > duration + 1) {
      showAlert('Thời gian cắt không hợp lệ.', 'Lỗi thời gian');
      return;
    }

    setIsProcessing(true);
    setProgress(20);
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await decodeAudio(files[0], audioCtx);
      setProgress(50);

      const startSample = Math.floor(startSec * buffer.sampleRate);
      const endSample = Math.floor(endSec * buffer.sampleRate);
      const newLength = endSample - startSample;

      const cutBuffer = audioCtx.createBuffer(buffer.numberOfChannels, newLength, buffer.sampleRate);
      
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const newData = cutBuffer.getChannelData(channel);
        const oldData = buffer.getChannelData(channel);
        newData.set(oldData.subarray(startSample, endSample));
      }

      setProgress(80);
      const wavBlob = audioBufferToWav(cutBuffer);
      setProgress(100);
      
      downloadBlob(wavBlob, 'cut_audio.wav');
    } catch (e: any) {
      console.error(e);
      showAlert('Có lỗi xảy ra khi xử lý: ' + e.message, 'Lỗi');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AuthGate
      featureTitle="Cắt Ghép Âm Thanh"
      featureDescription="Tính năng Cắt & Ghép file âm thanh yêu cầu bạn đăng nhập tài khoản để xử lý âm thanh không giới hạn."
      returnUrl="/cat-ghep-am-thanh"
    >
      <div className="audio-editor-container">
        <div className="tool-header text-center mb-8">
          <h1 className="text-gradient text-3xl mb-2">Cắt Ghép Âm Thanh</h1>
          <p className="text-secondary">Chỉnh sửa file âm thanh trực tiếp trên trình duyệt, an toàn và nhanh chóng.</p>
        </div>

        <div className="glass-card">
        <div className="audio-tabs">
          <button 
            className={`audio-tab ${activeTab === 'cut' ? 'active' : ''}`}
            onClick={() => { setActiveTab('cut'); setFiles([]); }}
          >
            <Scissors size={20} /> Cắt Âm Thanh
          </button>
          <button 
            className={`audio-tab ${activeTab === 'merge' ? 'active' : ''}`}
            onClick={() => { setActiveTab('merge'); setFiles([]); }}
          >
            <Merge size={20} /> Ghép Âm Thanh
          </button>
        </div>

        <FileUploadZone 
          onFileSelect={handleFileUpload} 
          accept="audio/*"
          multiple={activeTab === 'merge'}
          hintText={activeTab === 'merge' ? "Kéo thả các file âm thanh vào đây" : "Kéo thả 1 file âm thanh vào đây"}
        />

        {files.length > 0 && (
          <div className="audio-controls">
            {activeTab === 'merge' && (
              <div className="audio-list">
                <h3 className="font-bold text-lg mb-2">Danh sách file (Kéo để sắp xếp)</h3>
                {files.map((file, idx) => (
                  <div 
                    key={idx} 
                    className={`audio-item ${draggedIdx === idx ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                  >
                    <GripVertical className="audio-item-icon" />
                    <Music className="text-blue-500" />
                    <div className="audio-item-info">
                      <div className="audio-item-name" title={file.name}>{file.name}</div>
                      <div className="audio-item-meta">{formatSize(file.size)}</div>
                    </div>
                    <button className="audio-item-remove" onClick={() => setFiles(f => f.filter((_, i) => i !== idx))}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'cut' && files[0] && (
              <div>
                <audio 
                  ref={audioRef} 
                  controls 
                  src={URL.createObjectURL(files[0])} 
                  className="audio-player-preview"
                />
                
                <div className="time-inputs mt-6">
                  <div className="time-input-group">
                    <label>BẮT ĐẦU</label>
                    <div className="time-input-row">
                      <input type="number" min="0" value={startTime.m} onChange={e => setStartTime({...startTime, m: parseInt(e.target.value)||0})} />
                      <span>:</span>
                      <input type="number" min="0" max="59" value={startTime.s} onChange={e => setStartTime({...startTime, s: parseInt(e.target.value)||0})} />
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>-</div>
                  
                  <div className="time-input-group">
                    <label>KẾT THÚC</label>
                    <div className="time-input-row">
                      <input type="number" min="0" value={endTime.m} onChange={e => setEndTime({...endTime, m: parseInt(e.target.value)||0})} />
                      <span>:</span>
                      <input type="number" min="0" max="59" value={endTime.s} onChange={e => setEndTime({...endTime, s: parseInt(e.target.value)||0})} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="action-buttons mt-4">
              <button 
                className="btn-primary" 
                onClick={activeTab === 'cut' ? handleCut : handleMerge}
                disabled={isProcessing}
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              >
                {isProcessing ? (
                  <><Loader2 className="animate-spin" /> Đang xử lý {progress}%</>
                ) : (
                  <><Download /> {activeTab === 'cut' ? 'Cắt & Tải Xuống' : 'Ghép & Tải Xuống'}</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </AuthGate>
  );
}

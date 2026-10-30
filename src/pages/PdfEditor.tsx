import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, RotateCcw, RotateCw, Trash2, Download, RefreshCw, 
  FileBox, Eye, X, Undo, Plus, PlusCircle, ArrowLeft, ArrowRight,
  MoveLeft, MoveRight, Layers, Edit3, Eraser, Type, Image as ImageIcon,
  Copy, ZoomIn, ZoomOut, MousePointer
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { useDialogs } from '../components/CustomDialogs';
import FileUploadZone from '../components/FileUploadZone';
import './PdfEditor.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface TextAnnotation {
  id: string;
  x: number; // Tỷ lệ % từ 0 đến 100
  y: number; // Tỷ lệ % từ 0 đến 100
  text: string;
  fontSize: number; // pt
  color: string; // hex
  fontFamily: string;
  isBold?: boolean;
}

export interface WhiteoutAnnotation {
  id: string;
  x: number; // %
  y: number; // %
  width: number; // %
  height: number; // %
  color: string; // Thường là '#FFFFFF'
}

export interface ImageAnnotation {
  id: string;
  x: number; // %
  y: number; // %
  width: number; // %
  height: number; // %
  dataUrl: string;
}

export interface PageItem {
  id: string;
  pageNumber: number;
  originalPdfIndex: number;
  sourceDocId: string; // ID của tài liệu gốc
  sourceDocName: string;
  dataUrl: string;
  width: number; // pt gốc của trang
  height: number;
  rotation: number;
  isDeleted: boolean;
  isCustomBlank?: boolean;
  imageBlobUrl?: string; // Nếu trang được tạo từ file ảnh
  
  // Các lớp chỉnh sửa trực tiếp trên trang
  textAnnotations: TextAnnotation[];
  whiteouts: WhiteoutAnnotation[];
  imageAnnotations: ImageAnnotation[];
}

interface LoadedDoc {
  id: string;
  name: string;
  fileBytes: ArrayBuffer;
}

export default function PdfEditor() {
  const [loadedDocs, setLoadedDocs] = useState<Map<string, LoadedDoc>>(new Map());
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'organize' | 'canvas'>('organize');
  
  // Biên tập trang đơn (Canvas Editor)
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [editorTool, setEditorTool] = useState<'select' | 'text' | 'whiteout' | 'image'>('select');
  const [textColor, setTextColor] = useState<string>('#000000');
  const [textSize, setTextSize] = useState<number>(14);
  const [whiteoutColor] = useState<string>('#FFFFFF');
  const [canvasZoom, setCanvasZoom] = useState<number>(100);

  // Kéo thả tạo hộp Whiteout
  const [isDrawingWhiteout, setIsDrawingWhiteout] = useState(false);
  const [whiteoutStart, setWhiteoutStart] = useState<{ x: number; y: number } | null>(null);
  const [currentWhiteoutBox, setCurrentWhiteoutBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Xem trước Modal phóng to
  const [previewPage, setPreviewPage] = useState<PageItem | null>(null);
  
  // Quản lý Dialog / Prompt
  const { showAlert, showPrompt, DialogsComponent } = useDialogs();

  // Hidden File Inputs
  const appendFileInputRef = useRef<HTMLInputElement>(null);
  const insertAtTargetIndexRef = useRef<number>(-1);
  const insertAtFileInputRef = useRef<HTMLInputElement>(null);
  const stampImageInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // 1. TẢI FILE PDF ĐẦU TIÊN
  const handleInitialFileSelect = (files: FileList | null) => {
    const selectedFile = files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        loadNewPdf(selectedFile, true);
      } else if (selectedFile.type.startsWith('image/')) {
        loadImagesAsPages([selectedFile], true);
      }
    }
  };

  // Nạp 1 file PDF mới (hoặc append vào danh sách)
  const loadNewPdf = async (pdfFile: File, isInitial = false, insertAtIndex = -1, password?: string) => {
    setIsLoading(true);
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const typedarray = new Uint8Array(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({ 
        data: typedarray,
        password: password,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
      });
      const pdf = await loadingTask.promise;
      
      const newPages: PageItem[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport } as any).promise;
          
          newPages.push({
            id: `p_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
            pageNumber: i,
            originalPdfIndex: i - 1,
            sourceDocId: docId,
            sourceDocName: pdfFile.name,
            dataUrl: canvas.toDataURL('image/jpeg', 0.85),
            width: viewport.width,
            height: viewport.height,
            rotation: 0,
            isDeleted: false,
            textAnnotations: [],
            whiteouts: [],
            imageAnnotations: []
          });
        }
      }

      setLoadedDocs(prev => {
        const next = new Map(prev);
        next.set(docId, { id: docId, name: pdfFile.name, fileBytes: arrayBuffer });
        return next;
      });

      if (isInitial) {
        setPages(newPages);
        setSelectedPageIndex(0);
      } else {
        setPages(prev => {
          if (insertAtIndex >= 0 && insertAtIndex <= prev.length) {
            const copy = [...prev];
            copy.splice(insertAtIndex, 0, ...newPages);
            return copy;
          }
          return [...prev, ...newPages];
        });
      }

      await loadingTask.destroy();
    } catch (error: any) {
      console.error(error);
      if (error?.name === 'PasswordException' || error?.message?.toLowerCase().includes('password')) {
        const userPwd = await showPrompt(password ? 'Mật khẩu sai! Vui lòng thử lại:' : 'File PDF này yêu cầu mật khẩu để mở:');
        if (userPwd) {
          loadNewPdf(pdfFile, isInitial, insertAtIndex, userPwd);
          return;
        }
      } else {
        showAlert(`Không thể đọc file PDF. Chi tiết: ${error?.message || error}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Nạp ảnh (JPG, PNG) và chuyển thành trang PDF
  const loadImagesAsPages = async (imageFiles: File[], isInitial = false, insertAtIndex = -1) => {
    setIsLoading(true);
    try {
      const newPages: PageItem[] = [];
      for (const imgFile of imageFiles) {
        const docId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const blobUrl = URL.createObjectURL(imgFile);
        
        // Đo kích thước ảnh
        const dims = await new Promise<{ w: number; h: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => resolve({ w: 595, h: 842 });
          img.src = blobUrl;
        });

        // Chuẩn hóa tỷ lệ phù hợp PDF A4 (595 x 842)
        let pageW = dims.w;
        let pageH = dims.h;
        if (pageW > 1200 || pageH > 1600) {
          const ratio = Math.min(1200 / pageW, 1600 / pageH);
          pageW = Math.round(pageW * ratio);
          pageH = Math.round(pageH * ratio);
        }

        const arrayBuffer = await imgFile.arrayBuffer();
        setLoadedDocs(prev => {
          const next = new Map(prev);
          next.set(docId, { id: docId, name: imgFile.name, fileBytes: arrayBuffer });
          return next;
        });

        newPages.push({
          id: `p_img_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          pageNumber: 1,
          originalPdfIndex: 0,
          sourceDocId: docId,
          sourceDocName: imgFile.name,
          dataUrl: blobUrl,
          width: pageW,
          height: pageH,
          rotation: 0,
          isDeleted: false,
          imageBlobUrl: blobUrl,
          textAnnotations: [],
          whiteouts: [],
          imageAnnotations: []
        });
      }

      if (isInitial) {
        setPages(newPages);
        setSelectedPageIndex(0);
      } else {
        setPages(prev => {
          if (insertAtIndex >= 0 && insertAtIndex <= prev.length) {
            const copy = [...prev];
            copy.splice(insertAtIndex, 0, ...newPages);
            return copy;
          }
          return [...prev, ...newPages];
        });
      }
    } catch (e: any) {
      showAlert('Lỗi khi thêm file ảnh: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. CHÈN TRANG TRẮNG (BLANK PAGE)
  const handleInsertBlankPage = (atIndex: number) => {
    const blankPage: PageItem = {
      id: `blank_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      pageNumber: 1,
      originalPdfIndex: -1,
      sourceDocId: 'blank',
      sourceDocName: 'Trang Trắng',
      dataUrl: '', // Canvas trống nền trắng
      width: 595, // Chuẩn A4
      height: 842,
      rotation: 0,
      isDeleted: false,
      isCustomBlank: true,
      textAnnotations: [],
      whiteouts: [],
      imageAnnotations: []
    };

    setPages(prev => {
      const copy = [...prev];
      copy.splice(atIndex, 0, blankPage);
      return copy;
    });
  };

  // Mở trình chọn file để chèn vào vị trí cụ thể
  const triggerInsertFileAt = (index: number) => {
    insertAtTargetIndexRef.current = index;
    insertAtFileInputRef.current?.click();
  };

  const handleInsertFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const targetIdx = insertAtTargetIndexRef.current;
    
    Array.from(files).forEach(file => {
      if (file.type === 'application/pdf') {
        loadNewPdf(file, false, targetIdx);
      } else if (file.type.startsWith('image/')) {
        loadImagesAsPages([file], false, targetIdx);
      }
    });

    e.target.value = '';
  };

  // 3. DI CHUYỂN / SẮP XẾP THỨ TỰ TRANG
  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    setPages(prev => {
      const copy = [...prev];
      const [item] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, item);
      return copy;
    });
  };

  // Nhân bản trang (Duplicate)
  const duplicatePage = (index: number) => {
    const target = pages[index];
    if (!target) return;
    const cloned: PageItem = {
      ...target,
      id: `clone_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      textAnnotations: JSON.parse(JSON.stringify(target.textAnnotations)),
      whiteouts: JSON.parse(JSON.stringify(target.whiteouts)),
      imageAnnotations: JSON.parse(JSON.stringify(target.imageAnnotations))
    };
    setPages(prev => {
      const copy = [...prev];
      copy.splice(index + 1, 0, cloned);
      return copy;
    });
  };

  // Xóa / Khôi phục trang
  const toggleDeletePage = (index: number) => {
    setPages(prev => {
      const copy = [...prev];
      copy[index].isDeleted = !copy[index].isDeleted;
      return copy;
    });
  };

  // Xoay trang
  const rotatePage = (index: number, direction: 'cw' | 'ccw') => {
    setPages(prev => {
      const copy = [...prev];
      let rot = copy[index].rotation;
      rot = direction === 'cw' ? rot + 90 : rot - 90;
      if (rot >= 360) rot = 0;
      if (rot < 0) rot = 270;
      copy[index].rotation = rot;
      return copy;
    });
  };

  const rotateAllPages = (direction: 'cw' | 'ccw') => {
    setPages(prev => prev.map(p => {
      if (p.isDeleted) return p;
      let rot = p.rotation;
      rot = direction === 'cw' ? rot + 90 : rot - 90;
      if (rot >= 360) rot = 0;
      if (rot < 0) rot = 270;
      return { ...p, rotation: rot };
    }));
  };

  // 4. CANVAS BIÊN TẬP TRỰC TIẾP TRÊN TRANG (Whiteout, Text, Image)
  const activePage = pages[selectedPageIndex] || null;

  // Bấm vào mặt trang canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activePage || activePage.isDeleted) return;
    if (editorTool === 'text') {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

      const newText: TextAnnotation = {
        id: `txt_${Date.now()}`,
        x: Math.max(2, Math.min(90, xPercent)),
        y: Math.max(2, Math.min(95, yPercent)),
        text: 'Nhập văn bản mới tại đây...',
        fontSize: textSize,
        color: textColor,
        fontFamily: 'Arial',
        isBold: false
      };

      setPages(prev => {
        const copy = [...prev];
        copy[selectedPageIndex].textAnnotations.push(newText);
        return copy;
      });
      setEditorTool('select');
    }
  };

  // Kéo chuột tạo hộp Tẩy trắng (Whiteout)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (editorTool !== 'whiteout' || !activePage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDrawingWhiteout(true);
    setWhiteoutStart({ x, y });
    setCurrentWhiteoutBox({ x, y, w: 0, h: 0 });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingWhiteout || !whiteoutStart || !activePage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const curX = ((e.clientX - rect.left) / rect.width) * 100;
    const curY = ((e.clientY - rect.top) / rect.height) * 100;

    const left = Math.min(whiteoutStart.x, curX);
    const top = Math.min(whiteoutStart.y, curY);
    const width = Math.abs(curX - whiteoutStart.x);
    const height = Math.abs(curY - whiteoutStart.y);

    setCurrentWhiteoutBox({ x: left, y: top, w: width, h: height });
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingWhiteout || !currentWhiteoutBox || !activePage) {
      setIsDrawingWhiteout(false);
      setWhiteoutStart(null);
      setCurrentWhiteoutBox(null);
      return;
    }

    if (currentWhiteoutBox.w > 1 && currentWhiteoutBox.h > 0.5) {
      const newBox: WhiteoutAnnotation = {
        id: `wo_${Date.now()}`,
        x: currentWhiteoutBox.x,
        y: currentWhiteoutBox.y,
        width: currentWhiteoutBox.w,
        height: currentWhiteoutBox.h,
        color: whiteoutColor
      };
      setPages(prev => {
        const copy = [...prev];
        copy[selectedPageIndex].whiteouts.push(newBox);
        return copy;
      });
    }

    setIsDrawingWhiteout(false);
    setWhiteoutStart(null);
    setCurrentWhiteoutBox(null);
  };

  // Cập nhật text của Text Annotation
  const updateTextAnnotation = (textId: string, newText: string) => {
    setPages(prev => {
      const copy = [...prev];
      const page = copy[selectedPageIndex];
      const target = page.textAnnotations.find(t => t.id === textId);
      if (target) {
        target.text = newText;
      }
      return copy;
    });
  };

  // Xóa annotation (Text, Whiteout, Image)
  const removeAnnotation = (type: 'text' | 'whiteout' | 'image', id: string) => {
    setPages(prev => {
      const copy = [...prev];
      const page = copy[selectedPageIndex];
      if (type === 'text') {
        page.textAnnotations = page.textAnnotations.filter(t => t.id !== id);
      } else if (type === 'whiteout') {
        page.whiteouts = page.whiteouts.filter(w => w.id !== id);
      } else if (type === 'image') {
        page.imageAnnotations = page.imageAnnotations.filter(img => img.id !== id);
      }
      return copy;
    });
  };

  // Chèn con dấu / chữ ký / hình ảnh
  const handleStampImageChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePage) return;
    const blobUrl = URL.createObjectURL(file);

    const newImg: ImageAnnotation = {
      id: `stamp_${Date.now()}`,
      x: 35,
      y: 40,
      width: 25,
      height: 15,
      dataUrl: blobUrl
    };

    setPages(prev => {
      const copy = [...prev];
      copy[selectedPageIndex].imageAnnotations.push(newImg);
      return copy;
    });

    e.target.value = '';
    setEditorTool('select');
  };

  // 5. XUẤT FILE PDF CUỐI CÙNG (ENGINE XUẤT CHUẨN VECTOR VỚI NHÚNG FONT)
  const handleExportPdf = async () => {
    const activePages = pages.filter(p => !p.isDeleted);
    if (activePages.length === 0) {
      showAlert('Tất cả các trang đều đã bị xóa. Vui lòng giữ ít nhất 1 trang để xuất PDF.');
      return;
    }

    setIsProcessing(true);
    try {
      const newPdf = await PDFDocument.create();
      newPdf.registerFontkit(fontkit);

      // Tải font tiếng Việt
      let customFont: any = null;
      try {
        const fontRes = await fetch('/fonts/Roboto-Regular.ttf');
        if (fontRes.ok) {
          const fontBytes = await fontRes.arrayBuffer();
          customFont = await newPdf.embedFont(fontBytes);
        }
      } catch (e) {
        console.warn('Không tải được Roboto font, fallback standard font.');
      }

      // Nạp các tài liệu PDF gốc đã mở
      const loadedPdfDocs = new Map<string, PDFDocument>();
      for (const [docId, docData] of loadedDocs.entries()) {
        try {
          const loadedDoc = await PDFDocument.load(docData.fileBytes);
          loadedPdfDocs.set(docId, loadedDoc);
        } catch {}
      }

      for (const p of activePages) {
        let pdfPage: any = null;

        if (p.isCustomBlank) {
          // Tạo trang trắng mới
          pdfPage = newPdf.addPage([p.width || 595, p.height || 842]);
        } else if (p.imageBlobUrl) {
          // Trang từ file ảnh
          const res = await fetch(p.imageBlobUrl);
          const imgBytes = await res.arrayBuffer();
          let embeddedImg: any;
          if (p.sourceDocName.toLowerCase().endsWith('.png')) {
            embeddedImg = await newPdf.embedPng(imgBytes);
          } else {
            embeddedImg = await newPdf.embedJpg(imgBytes);
          }
          pdfPage = newPdf.addPage([p.width, p.height]);
          pdfPage.drawImage(embeddedImg, {
            x: 0,
            y: 0,
            width: p.width,
            height: p.height
          });
        } else {
          // Trang từ PDF gốc
          const srcDoc = loadedPdfDocs.get(p.sourceDocId);
          if (srcDoc && p.originalPdfIndex >= 0) {
            const [copied] = await newPdf.copyPages(srcDoc, [p.originalPdfIndex]);
            const originalRot = copied.getRotation().angle;
            copied.setRotation(degrees(originalRot + p.rotation));
            pdfPage = newPdf.addPage(copied);
          }
        }

        if (!pdfPage) continue;

        const { width: pWidth, height: pHeight } = pdfPage.getSize();

        // 1. Vẽ các hộp Tẩy trắng (Whiteout)
        for (const wo of p.whiteouts) {
          const pdfX = (wo.x / 100) * pWidth;
          const pdfY = pHeight - ((wo.y + wo.height) / 100) * pHeight;
          const pdfW = (wo.width / 100) * pWidth;
          const pdfH = (wo.height / 100) * pHeight;

          pdfPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            color: rgb(1, 1, 1), // Màu trắng
            borderColor: rgb(1, 1, 1),
            borderWidth: 0
          });
        }

        // 2. Vẽ hình ảnh / Con dấu
        for (const imgAnno of p.imageAnnotations) {
          try {
            const res = await fetch(imgAnno.dataUrl);
            const imgBytes = await res.arrayBuffer();
            let embedded: any;
            try {
              embedded = await newPdf.embedPng(imgBytes);
            } catch {
              embedded = await newPdf.embedJpg(imgBytes);
            }

            const imgX = (imgAnno.x / 100) * pWidth;
            const imgY = pHeight - ((imgAnno.y + imgAnno.height) / 100) * pHeight;
            const imgW = (imgAnno.width / 100) * pWidth;
            const imgH = (imgAnno.height / 100) * pHeight;

            pdfPage.drawImage(embedded, {
              x: imgX,
              y: imgY,
              width: imgW,
              height: imgH
            });
          } catch (e) {
            console.error('Lỗi nhúng ảnh vào PDF:', e);
          }
        }

        // 3. Vẽ chữ (Text Annotations)
        for (const txt of p.textAnnotations) {
          if (!txt.text.trim()) continue;
          const textX = (txt.x / 100) * pWidth;
          const textY = pHeight - (txt.y / 100) * pHeight - txt.fontSize;

          // Parse hex color sang rgb 0-1
          const hex = txt.color.replace('#', '');
          const r = parseInt(hex.substring(0, 2) || '0', 16) / 255;
          const g = parseInt(hex.substring(2, 4) || '0', 16) / 255;
          const b = parseInt(hex.substring(4, 6) || '0', 16) / 255;

          try {
            pdfPage.drawText(txt.text, {
              x: textX,
              y: textY,
              size: txt.fontSize,
              font: customFont || undefined,
              color: rgb(r, g, b)
            });
          } catch (e) {
            console.warn('Lỗi vẽ text tiếng Việt:', e);
          }
        }
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `pdfstudio_pro_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      showAlert('Lỗi xuất PDF: ' + (e.message || e));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    setLoadedDocs(new Map());
    setPages([]);
    setSelectedPageIndex(0);
  };

  const activePagesCount = pages.filter(p => !p.isDeleted).length;

  return (
    <div className="pdf-pro-editor animate-fade-in">
      {/* HEADER CÔNG CỤ CHUYÊN NGHIỆP */}
      <div className="pro-header glass-card">
        <div className="header-left">
          <div className="badge-pro">PDF PRO STUDIO</div>
          <h2 className="title-text">Trình Chỉnh Sửa & Quản Lý PDF Chuyên Nghiệp</h2>
        </div>

        {pages.length > 0 && (
          <div className="header-right">
            {/* Chuyển đổi tab chế độ xem */}
            <div className="tab-pill-group">
              <button 
                className={`tab-pill ${activeTab === 'organize' ? 'active' : ''}`}
                onClick={() => setActiveTab('organize')}
              >
                <Layers size={16} /> Quản lý trang ({activePagesCount})
              </button>
              <button 
                className={`tab-pill ${activeTab === 'canvas' ? 'active' : ''}`}
                onClick={() => setActiveTab('canvas')}
              >
                <Edit3 size={16} /> Sửa trực tiếp (Trang {selectedPageIndex + 1})
              </button>
            </div>

            <button 
              className="btn btn-primary export-btn"
              onClick={handleExportPdf}
              disabled={isProcessing || activePagesCount === 0}
            >
              {isProcessing ? (
                <><RefreshCw size={16} className="spin" /> Đang tạo PDF...</>
              ) : (
                <><Download size={16} /> Xuất PDF ({activePagesCount} trang)</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* KHU VỰC TẢI FILE BAN ĐẦU NẾU CHƯA CÓ TRANG NÀO */}
      {pages.length === 0 && !isLoading && (
        <div className="empty-upload-card glass-card">
          <div className="upload-hero-icon">
            <FileBox size={48} className="text-primary" />
          </div>
          <h3>Bắt đầu chỉnh sửa tài liệu PDF của bạn</h3>
          <p className="text-secondary">
            Hỗ trợ kéo thả file PDF hoặc ảnh (PNG, JPG). Bạn có thể tự do thêm nhiều file khác nhau vào thành một tài liệu hoàn chỉnh.
          </p>
          <div style={{ maxWidth: 500, margin: '1.5rem auto 0' }}>
            <FileUploadZone 
              onFileSelect={handleInitialFileSelect} 
              accept="application/pdf,image/png,image/jpeg,image/webp" 
              hintText="Kéo thả file PDF hoặc Ảnh tại đây" 
            />
          </div>
        </div>
      )}

      {/* TRẠNG THÁI LOADING */}
      {isLoading && (
        <div className="glass-card loading-card">
          <RefreshCw size={44} className="text-primary spin" />
          <h4>Đang phân tích và xử lý trang tài liệu...</h4>
          <p className="text-secondary">Vui lòng chờ trong giây lát</p>
        </div>
      )}

      {/* GIAO DIỆN CHÍNH KHI ĐÃ CÓ TRANG */}
      {!isLoading && pages.length > 0 && (
        <div className="editor-workspace">
          {/* TAB 1: QUẢN LÝ & SẮP XẾP TRANG (ORGANIZE VIEW) */}
          {activeTab === 'organize' && (
            <div className="organize-view">
              <div className="organize-toolbar glass-card">
                <div className="organize-toolbar-left">
                  <span className="stats-pill">Tổng: {pages.length} trang ({activePagesCount} đang dùng)</span>
                  <button className="btn-tool" onClick={() => rotateAllPages('ccw')} title="Xoay trái tất cả">
                    <RotateCcw size={16} /> Xoay trái tất cả
                  </button>
                  <button className="btn-tool" onClick={() => rotateAllPages('cw')} title="Xoay phải tất cả">
                    <RotateCw size={16} /> Xoay phải tất cả
                  </button>
                </div>

                <div className="organize-toolbar-right">
                  <button className="btn btn-secondary btn-sm" onClick={() => appendFileInputRef.current?.click()}>
                    <PlusCircle size={16} /> Thêm file khác vào cuối
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleInsertBlankPage(pages.length)}>
                    <Plus size={16} /> Thêm trang trắng
                  </button>
                  <button className="btn btn-secondary btn-sm text-danger" onClick={handleClearAll} title="Đổi sang tài liệu khác">
                    <X size={16} /> Làm mới
                  </button>
                </div>
              </div>

              {/* GRID DANH SÁCH CÁC TRANG CÓ NÚT THÊM TRANG Ở TỪNG KHE */}
              <div className="pages-mosaic-grid">
                {pages.map((p, idx) => (
                  <div key={p.id} className="page-slot-container">
                    {/* Nút chèn trang ở giữa các khe */}
                    <div className="insert-slot-divider" title={`Chèn trang vào vị trí ${idx + 1}`}>
                      <button 
                        className="slot-add-btn" 
                        onClick={() => triggerInsertFileAt(idx)}
                        title="Chèn file PDF / ảnh vào vị trí này"
                      >
                        <Plus size={14} /> Chèn vào đây
                      </button>
                    </div>

                    <div className={`pro-page-card ${p.isDeleted ? 'is-deleted' : ''} ${selectedPageIndex === idx ? 'is-selected' : ''}`}>
                      <div className="page-card-top">
                        <span className="page-badge">Trang {idx + 1}</span>
                        <div className="page-mini-actions">
                          <button 
                            className="mini-btn edit" 
                            title="Sửa nội dung trực tiếp trên trang này"
                            onClick={() => {
                              setSelectedPageIndex(idx);
                              setActiveTab('canvas');
                            }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            className="mini-btn view" 
                            title="Xem trước"
                            onClick={() => setPreviewPage(p)}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>

                      <div 
                        className="page-thumbnail-wrap" 
                        onClick={() => {
                          setSelectedPageIndex(idx);
                          setActiveTab('canvas');
                        }}
                      >
                        {p.isCustomBlank ? (
                          <div className="blank-page-placeholder">
                            <FileText size={32} className="text-secondary" />
                            <span>Trang trắng</span>
                          </div>
                        ) : (
                          <div 
                            className="thumbnail-img-box" 
                            style={{ transform: `rotate(${p.rotation}deg)` }}
                          >
                            <img src={p.dataUrl} alt={`Trang ${idx + 1}`} />
                          </div>
                        )}

                        {/* Đánh dấu nếu có ghi chú hoặc tẩy xóa */}
                        {(p.whiteouts.length > 0 || p.textAnnotations.length > 0 || p.imageAnnotations.length > 0) && (
                          <div className="edits-indicator">
                            Đã chỉnh sửa ({p.whiteouts.length + p.textAnnotations.length + p.imageAnnotations.length})
                          </div>
                        )}

                        {p.isDeleted && (
                          <div className="deleted-watermark">
                            <Trash2 size={24} />
                            <span>Đã xóa</span>
                          </div>
                        )}
                      </div>

                      <div className="page-card-bottom">
                        <div className="reorder-arrows">
                          <button 
                            className="arrow-btn" 
                            disabled={idx === 0} 
                            onClick={() => movePage(idx, idx - 1)}
                            title="Di chuyển sang trái"
                          >
                            <MoveLeft size={14} />
                          </button>
                          <button 
                            className="arrow-btn" 
                            disabled={idx === pages.length - 1} 
                            onClick={() => movePage(idx, idx + 1)}
                            title="Di chuyển sang phải"
                          >
                            <MoveRight size={14} />
                          </button>
                        </div>

                        <div className="bottom-tools">
                          <button className="tool-icon-btn" onClick={() => rotatePage(idx, 'cw')} title="Xoay phải 90°">
                            <RotateCw size={15} />
                          </button>
                          <button className="tool-icon-btn" onClick={() => duplicatePage(idx)} title="Nhân đôi trang này">
                            <Copy size={15} />
                          </button>
                          <button 
                            className={`tool-icon-btn ${p.isDeleted ? 'btn-restore' : 'btn-delete'}`} 
                            onClick={() => toggleDeletePage(idx)}
                            title={p.isDeleted ? 'Khôi phục trang' : 'Xóa trang'}
                          >
                            {p.isDeleted ? <Undo size={15} /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Nút thêm trang ở vị trí cuối cùng */}
                <div className="append-last-card" onClick={() => appendFileInputRef.current?.click()}>
                  <PlusCircle size={36} className="text-primary" />
                  <span>Thêm file PDF / Ảnh vào cuối</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BIÊN TẬP NỘI DUNG TRỰC TIẾP TRÊN TRANG (CANVAS EDITOR KIỂU ABBYY) */}
          {activeTab === 'canvas' && activePage && (
            <div className="canvas-studio-layout">
              {/* THANH CÔNG CỤ SỬA NỘI DUNG */}
              <div className="canvas-action-bar glass-card">
                <div className="canvas-bar-left">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveTab('organize')}
                  >
                    <ArrowLeft size={16} /> Quay lại danh sách trang
                  </button>

                  <div className="divider-vert" />

                  {/* Chọn Tool: Con trỏ / Chèn Chữ / Tẩy Xóa / Chèn Ảnh */}
                  <div className="tool-btn-group">
                    <button 
                      className={`canvas-tool-btn ${editorTool === 'select' ? 'active' : ''}`}
                      onClick={() => setEditorTool('select')}
                      title="Chọn & Di chuyển"
                    >
                      <MousePointer size={16} /> Chọn
                    </button>
                    <button 
                      className={`canvas-tool-btn ${editorTool === 'whiteout' ? 'active' : ''}`}
                      onClick={() => setEditorTool('whiteout')}
                      title="Tẩy xóa nội dung cũ (Kéo chuột vẽ ô che chữ/hình)"
                    >
                      <Eraser size={16} /> Tẩy xóa (Whiteout)
                    </button>
                    <button 
                      className={`canvas-tool-btn ${editorTool === 'text' ? 'active' : ''}`}
                      onClick={() => setEditorTool('text')}
                      title="Bấm vào trang để chèn chữ mới"
                    >
                      <Type size={16} /> Thêm chữ mới
                    </button>
                    <button 
                      className={`canvas-tool-btn`}
                      onClick={() => stampImageInputRef.current?.click()}
                      title="Chèn ảnh / Con dấu / Chữ ký"
                    >
                      <ImageIcon size={16} /> Chèn ảnh/Dấu
                    </button>
                  </div>
                </div>

                {/* Tùy chỉnh thuộc tính (Properties) */}
                <div className="canvas-bar-right">
                  {editorTool === 'text' && (
                    <div className="tool-prop-group">
                      <span className="prop-label">Cỡ chữ:</span>
                      <select 
                        className="prop-select" 
                        value={textSize} 
                        onChange={(e) => setTextSize(Number(e.target.value))}
                      >
                        <option value={10}>10 pt</option>
                        <option value={12}>12 pt</option>
                        <option value={14}>14 pt (Chuẩn)</option>
                        <option value={16}>16 pt</option>
                        <option value={18}>18 pt</option>
                        <option value={24}>24 pt (Tiêu đề)</option>
                        <option value={32}>32 pt</option>
                      </select>

                      <span className="prop-label">Màu chữ:</span>
                      <input 
                        type="color" 
                        className="prop-color-input" 
                        value={textColor} 
                        onChange={(e) => setTextColor(e.target.value)} 
                        title="Chọn màu chữ"
                      />
                    </div>
                  )}

                  {editorTool === 'whiteout' && (
                    <div className="tool-prop-group">
                      <span className="prop-hint text-primary">
                        👉 Kéo chuột quét một vùng trên trang để xóa sạch nội dung cũ bên dưới.
                      </span>
                    </div>
                  )}

                  {/* Zoom */}
                  <div className="zoom-controls">
                    <button 
                      className="zoom-btn" 
                      onClick={() => setCanvasZoom(z => Math.max(50, z - 15))}
                      title="Thu nhỏ"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <span className="zoom-label">{canvasZoom}%</span>
                    <button 
                      className="zoom-btn" 
                      onClick={() => setCanvasZoom(z => Math.min(200, z + 15))}
                      title="Phóng to"
                    >
                      <ZoomIn size={15} />
                    </button>
                  </div>

                  {/* Nút chuyển trang trước / sau */}
                  <div className="page-switcher">
                    <button 
                      className="pager-btn" 
                      disabled={selectedPageIndex === 0}
                      onClick={() => setSelectedPageIndex(i => i - 1)}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <span>{selectedPageIndex + 1} / {pages.length}</span>
                    <button 
                      className="pager-btn" 
                      disabled={selectedPageIndex === pages.length - 1}
                      onClick={() => setSelectedPageIndex(i => i + 1)}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* VÙNG LÀM VIỆC CANVAS CHÍNH */}
              <div className="canvas-interactive-viewport" ref={canvasContainerRef}>
                <div 
                  className={`canvas-page-surface ${editorTool === 'whiteout' ? 'cursor-crosshair' : ''} ${editorTool === 'text' ? 'cursor-text' : ''}`}
                  style={{
                    width: `${activePage.width * (canvasZoom / 100)}px`,
                    height: `${activePage.height * (canvasZoom / 100)}px`,
                    transform: `rotate(${activePage.rotation}deg)`
                  }}
                  onClick={handleCanvasClick}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                >
                  {/* Ảnh nền của trang PDF gốc */}
                  {!activePage.isCustomBlank && (
                    <img 
                      src={activePage.dataUrl} 
                      alt="PDF Page" 
                      className="canvas-bg-img" 
                      draggable={false} 
                    />
                  )}

                  {/* CÁC HỘP TẨY TRẮNG (WHITEOUT) */}
                  {activePage.whiteouts.map(wo => (
                    <div 
                      key={wo.id}
                      className="canvas-whiteout-box"
                      style={{
                        left: `${wo.x}%`,
                        top: `${wo.y}%`,
                        width: `${wo.width}%`,
                        height: `${wo.height}%`,
                        backgroundColor: wo.color
                      }}
                      title="Vùng đã tẩy trắng. Bấm nút x để xóa hộp này"
                    >
                      <button 
                        className="box-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnnotation('whiteout', wo.id);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {/* HỘP WHITEOUT ĐANG KÉO CHUỘT VẼ */}
                  {currentWhiteoutBox && (
                    <div 
                      className="canvas-whiteout-drawing"
                      style={{
                        left: `${currentWhiteoutBox.x}%`,
                        top: `${currentWhiteoutBox.y}%`,
                        width: `${currentWhiteoutBox.w}%`,
                        height: `${currentWhiteoutBox.h}%`
                      }}
                    />
                  )}

                  {/* HÌNH ẢNH / CON DẤU ĐÃ CHÈN */}
                  {activePage.imageAnnotations.map(img => (
                    <div 
                      key={img.id}
                      className="canvas-stamp-box"
                      style={{
                        left: `${img.x}%`,
                        top: `${img.y}%`,
                        width: `${img.width}%`,
                        height: `${img.height}%`
                      }}
                    >
                      <img src={img.dataUrl} alt="Con dấu / Ảnh" draggable={false} />
                      <button 
                        className="box-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnnotation('image', img.id);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {/* CÁC KHỐI VĂN BẢN (TEXT ANNOTATIONS) CÓ THỂ GÕ VÀO */}
                  {activePage.textAnnotations.map(txt => (
                    <div 
                      key={txt.id}
                      className="canvas-text-box"
                      style={{
                        left: `${txt.x}%`,
                        top: `${txt.y}%`,
                        color: txt.color,
                        fontSize: `${txt.fontSize * (canvasZoom / 100)}px`
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <input 
                        type="text"
                        className="canvas-text-input"
                        value={txt.text}
                        onChange={(e) => updateTextAnnotation(txt.id, e.target.value)}
                        style={{ color: txt.color }}
                      />
                      <button 
                        className="box-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnnotation('text', txt.id);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL PHÓNG TO XEM TRƯỚC */}
      {previewPage && createPortal(
        <div className="preview-modal-overlay" onClick={() => setPreviewPage(null)}>
          <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} className="text-primary" />
                Xem trước trang
              </h3>
              <button className="icon-btn delete" onClick={() => setPreviewPage(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="preview-modal-body">
              <div className="preview-modal-img-wrapper" style={{ transform: `rotate(${previewPage.rotation}deg)` }}>
                <img src={previewPage.dataUrl} alt="Preview" />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CÁC INPUT FILE ẨN ĐỂ CHÈN FILE */}
      <input 
        type="file" 
        ref={appendFileInputRef} 
        style={{ display: 'none' }}
        accept="application/pdf,image/png,image/jpeg,image/webp" 
        multiple
        onChange={(e) => {
          if (e.target.files) {
            Array.from(e.target.files).forEach(f => {
              if (f.type === 'application/pdf') loadNewPdf(f, false);
              else if (f.type.startsWith('image/')) loadImagesAsPages([f], false);
            });
          }
          e.target.value = '';
        }}
      />

      <input 
        type="file" 
        ref={insertAtFileInputRef} 
        style={{ display: 'none' }}
        accept="application/pdf,image/png,image/jpeg,image/webp" 
        multiple
        onChange={handleInsertFileChosen}
      />

      <input 
        type="file" 
        ref={stampImageInputRef} 
        style={{ display: 'none' }}
        accept="image/png,image/jpeg,image/webp" 
        onChange={handleStampImageChosen}
      />

      <DialogsComponent />
    </div>
  );
}

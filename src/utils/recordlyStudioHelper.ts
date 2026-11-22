export interface RecordlyStudioConfig {
  enableStudioMode: boolean;
  backgroundType: 'gradient' | 'solid' | 'mesh';
  backgroundColor: string;
  backgroundGradient: string;
  padding: number; // padding viền (px: 0 - 80)
  borderRadius: number; // bo tròn góc video (px: 0 - 32)
  shadowBlur: number; // độ đổ bóng (0 - 50)
  showWindowHeader: boolean; // thanh bar kiểu macOS
  windowTitle: string;
  enableAutoZoom: boolean; // Tự động phóng to theo con trỏ chuột
  zoomScale: number; // Tỉ lệ zoom (1.1 - 2.0x)
  enableCursorHighlight: boolean; // Vòng tròn nổi bật con trỏ
  cameraBubbleShape: 'circle' | 'rounded' | 'square';
  cameraBubbleSize: number; // kích thước webcam (px)
  cameraBubblePosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const defaultRecordlyConfig: RecordlyStudioConfig = {
  enableStudioMode: true,
  backgroundType: 'gradient',
  backgroundColor: '#0f172a',
  backgroundGradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
  padding: 32,
  borderRadius: 16,
  shadowBlur: 30,
  showWindowHeader: true,
  windowTitle: 'Recordly Studio Demo - tienich.ite.id.vn',
  enableAutoZoom: true,
  zoomScale: 1.35,
  enableCursorHighlight: true,
  cameraBubbleShape: 'circle',
  cameraBubbleSize: 140,
  cameraBubblePosition: 'bottom-right'
};

export const RECORDLY_GRADIENTS = [
  { id: 'sunset', label: 'Sunset Glow', value: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)' },
  { id: 'ocean', label: 'Deep Ocean', value: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #1d4ed8 100%)' },
  { id: 'emerald', label: 'Emerald Mint', value: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)' },
  { id: 'cyber', label: 'Cyberpunk', value: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 50%, #eab308 100%)' },
  { id: 'midnight', label: 'Dark Midnight', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' },
  { id: 'lavender', label: 'Soft Lavender', value: 'linear-gradient(135deg, #c084fc 0%, #e879f9 50%, #f472b6 100%)' },
  { id: 'solid-dark', label: 'Solid Charcoal', value: '#18181b' },
  { id: 'solid-clean', label: 'Solid Slate', value: '#f1f5f9' }
];

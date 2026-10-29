import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('pptxgenjs')) return 'vendor-pptx';
            if (id.includes('heic2any')) return 'vendor-heic';
            if (id.includes('cropperjs')) return 'vendor-cropper';
            if (id.includes('jszip')) return 'vendor-zip';
            if (id.includes('pdfjs-dist')) return 'vendor-pdfjs';
            if (id.includes('@imgly')) return 'vendor-imgly';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
            if (
              id.includes('jspdf') ||
              id.includes('canvg') ||
              id.includes('core-js') ||
              id.includes('stackblur-canvas') ||
              id.includes('rgbcolor') ||
              id.includes('svg-pathdata')
            ) return 'vendor-jspdf';
            if (id.includes('pdf-lib') || id.includes('@pdfsmaller')) return 'vendor-pdf';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (
              id.includes('mammoth') ||
              id.includes('docx-preview') ||
              id.includes('bluebird') ||
              id.includes('dingbat-to-unicode')
            ) return 'vendor-docx';
            if (id.includes('html2canvas') || id.includes('html2pdf')) return 'vendor-html2canvas';
            if (id.includes('lucide-react')) return 'vendor-icons';
            return 'vendor';
          }
        }
      }
    }
  },
})

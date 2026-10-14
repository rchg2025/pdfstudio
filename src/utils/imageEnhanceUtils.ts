/**
 * Tiện ích xử lý tăng nét quang học (Unsharp Masking), khử nhiễu (Denoise)
 * và nhúng thông số 300 DPI vào file JPEG/PNG cho mục đích in ấn.
 */

// 1. Áp dụng ma trận tích chập (Convolution Kernel) trực tiếp lên ImageData
export function applyConvolution(
  pixels: ImageData,
  kernel: number[],
  kernelWidth: number,
  kernelHeight: number,
  divisor: number = 1,
  bias: number = 0
): ImageData {
  const src = pixels.data;
  const sw = pixels.width;
  const sh = pixels.height;

  const output = new ImageData(sw, sh);
  const dst = output.data;

  const halfKWidth = Math.floor(kernelWidth / 2);
  const halfKHeight = Math.floor(kernelHeight / 2);

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      let r = 0, g = 0, b = 0;
      const dstOffset = (y * sw + x) * 4;

      for (let ky = 0; ky < kernelHeight; ky++) {
        for (let kx = 0; kx < kernelWidth; kx++) {
          const px = Math.min(sw - 1, Math.max(0, x + kx - halfKWidth));
          const py = Math.min(sh - 1, Math.max(0, y + ky - halfKHeight));
          const srcOffset = (py * sw + px) * 4;
          const weight = kernel[ky * kernelWidth + kx];

          r += src[srcOffset] * weight;
          g += src[srcOffset + 1] * weight;
          b += src[srcOffset + 2] * weight;
        }
      }

      dst[dstOffset] = Math.min(255, Math.max(0, (r / divisor) + bias));
      dst[dstOffset + 1] = Math.min(255, Math.max(0, (g / divisor) + bias));
      dst[dstOffset + 2] = Math.min(255, Math.max(0, (b / divisor) + bias));
      dst[dstOffset + 3] = src[dstOffset + 3]; // Alpha giữ nguyên
    }
  }

  return output;
}

// 2. Thuật toán Unsharp Masking chuyên sâu: Làm nét viền thực sự
export function applySharpen(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  if (amount <= 0) return;
  const imgData = ctx.getImageData(0, 0, width, height);

  // Kernel làm nét Laplacian 3x3 điều chỉnh theo cường độ amount (0 -> 2)
  const a = amount;
  const kernel = [
    0, -a, 0,
    -a, 1 + 4 * a, -a,
    0, -a, 0
  ];

  const sharpened = applyConvolution(imgData, kernel, 3, 3, 1, 0);
  ctx.putImageData(sharpened, 0, 0);
}

// 3. Khử nhiễu làm mịn nhẹ (Denoise Gaussian blur nhẹ)
export function applyDenoise(ctx: CanvasRenderingContext2D, width: number, height: number, level: number) {
  if (level <= 0) return;
  const imgData = ctx.getImageData(0, 0, width, height);
  // Box blur nhẹ 3x3
  const w = level * 0.5;
  const center = 1;
  const side = w;
  const total = center + side * 4;
  const kernel = [
    0, side, 0,
    side, center, side,
    0, side, 0
  ];
  const blurred = applyConvolution(imgData, kernel, 3, 3, total, 0);
  ctx.putImageData(blurred, 0, 0);
}

// 4. Phóng to ảnh đa bước giữ độ mịn (Multi-step Lanczos/Bicubic style High-Res Scaler)
export function scaleCanvasHighQuality(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  let curCanvas = sourceCanvas;
  let curWidth = sourceCanvas.width;
  let curHeight = sourceCanvas.height;

  // Nếu phóng to hơn 2 lần, tăng theo từng bước 1.5x - 2x để nội suy mượt mà không vỡ khối
  while (curWidth * 1.5 < targetWidth || curHeight * 1.5 < targetHeight) {
    const nextW = Math.round(Math.min(targetWidth, curWidth * 1.5));
    const nextH = Math.round(Math.min(targetHeight, curHeight * 1.5));

    const stepCanvas = document.createElement('canvas');
    stepCanvas.width = nextW;
    stepCanvas.height = nextH;
    const sCtx = stepCanvas.getContext('2d');
    if (!sCtx) break;

    sCtx.imageSmoothingEnabled = true;
    sCtx.imageSmoothingQuality = 'high';
    sCtx.drawImage(curCanvas, 0, 0, nextW, nextH);

    curCanvas = stepCanvas;
    curWidth = nextW;
    curHeight = nextH;
  }

  // Bước cuối cùng đến đúng kích thước đích
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const fCtx = finalCanvas.getContext('2d');
  if (fCtx) {
    fCtx.imageSmoothingEnabled = true;
    fCtx.imageSmoothingQuality = 'high';
    fCtx.drawImage(curCanvas, 0, 0, targetWidth, targetHeight);
  }
  return finalCanvas;
}

// 5. Nhúng thông số 300 DPI (hoặc DPI tùy chọn) vào JPEG Blob (JFIF Header Density)
export async function injectDpiToJpegBlob(blob: Blob, dpi: number = 300): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Kiểm tra SOI marker (0xFF, 0xD8)
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
    return blob; // Không phải JPEG
  }

  // Tìm JFIF APP0 marker (0xFF, 0xE0)
  let pos = 2;
  while (pos < bytes.length - 4) {
    if (bytes[pos] === 0xFF && bytes[pos + 1] === 0xE0) {
      // APP0 marker tìm thấy
      // Cấu trúc JFIF:
      // pos + 2, pos + 3: Độ dài segment
      // pos + 4..8: 'JFIF\0'
      // pos + 9, 10: Version
      // pos + 11: Units (1 = dots per inch)
      // pos + 12, 13: Xdensity (16 bit big endian)
      // pos + 14, 15: Ydensity (16 bit big endian)
      if (
        bytes[pos + 4] === 0x4A &&
        bytes[pos + 5] === 0x46 &&
        bytes[pos + 6] === 0x49 &&
        bytes[pos + 7] === 0x46 &&
        bytes[pos + 8] === 0x00
      ) {
        bytes[pos + 11] = 1; // 1 = DPI
        bytes[pos + 12] = (dpi >> 8) & 0xFF;
        bytes[pos + 13] = dpi & 0xFF;
        bytes[pos + 14] = (dpi >> 8) & 0xFF;
        bytes[pos + 15] = dpi & 0xFF;
        return new Blob([bytes], { type: 'image/jpeg' });
      }
      break;
    }
    // Sang segment tiếp theo
    if (bytes[pos] === 0xFF) {
      const segLength = (bytes[pos + 2] << 8) | bytes[pos + 3];
      pos += 2 + segLength;
    } else {
      break;
    }
  }

  // Nếu chưa có APP0 JFIF, chèn header JFIF 300 DPI chuẩn vào ngay sau SOI
  const jfifHeader = new Uint8Array([
    0xFF, 0xE0, // APP0
    0x00, 0x10, // Length = 16
    0x4A, 0x46, 0x49, 0x46, 0x00, // 'JFIF\0'
    0x01, 0x01, // Version 1.1
    0x01, // Units: 1 = DPI
    (dpi >> 8) & 0xFF, dpi & 0xFF, // Xdensity
    (dpi >> 8) & 0xFF, dpi & 0xFF, // Ydensity
    0x00, 0x00 // Thumbnail 0x0
  ]);

  const newBytes = new Uint8Array(bytes.length + jfifHeader.length);
  newBytes.set(bytes.subarray(0, 2), 0); // 0xFF, 0xD8
  newBytes.set(jfifHeader, 2);
  newBytes.set(bytes.subarray(2), 2 + jfifHeader.length);

  return new Blob([newBytes], { type: 'image/jpeg' });
}

// 6. Tính kích thước in ấn thực tế chuẩn 300 DPI
export function calculatePrintDimensions(widthPx: number, heightPx: number, dpi: number = 300) {
  const widthInch = widthPx / dpi;
  const heightInch = heightPx / dpi;
  const widthCm = widthInch * 2.54;
  const heightCm = heightInch * 2.54;

  return {
    widthCm: parseFloat(widthCm.toFixed(1)),
    heightCm: parseFloat(heightCm.toFixed(1)),
    widthInch: parseFloat(widthInch.toFixed(1)),
    heightInch: parseFloat(heightInch.toFixed(1)),
    recommendation: getPrintPresetRecommendation(widthCm, heightCm)
  };
}

function getPrintPresetRecommendation(wCm: number, hCm: number): string {
  const maxD = Math.max(wCm, hCm);
  const minD = Math.min(wCm, hCm);

  if (maxD >= 40 && minD >= 28) return 'In Khổ Lớn A3 / Tranh Treo Tường (Sắc nét 300 DPI)';
  if (maxD >= 28 && minD >= 20) return 'In Khổ A4 / Tài Liệu Bìa Sách (Sắc nét 300 DPI)';
  if (maxD >= 19 && minD >= 14) return 'In Khổ A5 / Tờ Rơi / Ảnh Để Bàn (Sắc nét 300 DPI)';
  if (maxD >= 14 && minD >= 9) return 'In Ảnh Rửa Tiệm 10x15cm (Sắc nét 300 DPI)';
  return 'In Ảnh Nhỏ / Thẻ Căn Cước / Ảnh Ví (Sắc nét 300 DPI)';
}

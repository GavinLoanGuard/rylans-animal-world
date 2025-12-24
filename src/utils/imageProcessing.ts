// ============================================
// Image Processing Utilities
// For processing toy photos into stickers
// ============================================

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Load image from file or data URL
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Convert File to data URL
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Create square crop of image
export function cropImageToSquare(
  image: HTMLImageElement,
  cropArea?: CropArea
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Target size for the output
  const outputSize = 512;
  canvas.width = outputSize;
  canvas.height = outputSize;
  
  let sx: number, sy: number, sWidth: number, sHeight: number;
  
  if (cropArea) {
    // Use provided crop area
    sx = cropArea.x;
    sy = cropArea.y;
    sWidth = cropArea.width;
    sHeight = cropArea.height;
  } else {
    // Auto-crop to center square
    const minDim = Math.min(image.width, image.height);
    sx = (image.width - minDim) / 2;
    sy = (image.height - minDim) / 2;
    sWidth = minDim;
    sHeight = minDim;
  }
  
  ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, outputSize, outputSize);
  
  return canvas.toDataURL('image/png');
}

// Add sticker effect (white outline + drop shadow)
export function createStickerFromImage(imageDataUrl: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const image = await loadImage(imageDataUrl);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Add padding for outline and shadow
      const padding = 20;
      const shadowOffset = 8;
      
      canvas.width = image.width + padding * 2 + shadowOffset;
      canvas.height = image.height + padding * 2 + shadowOffset;
      
      // Draw drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = shadowOffset;
      ctx.shadowOffsetY = shadowOffset;
      
      // Draw white background/outline (rounded rectangle)
      ctx.fillStyle = 'white';
      roundRect(ctx, padding - 8, padding - 8, image.width + 16, image.height + 16, 20);
      ctx.fill();
      
      // Reset shadow for the main image
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Draw the image
      ctx.drawImage(image, padding, padding);
      
      // Add subtle white stroke around the canvas area
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      roundRect(ctx, padding - 4, padding - 4, image.width + 8, image.height + 8, 16);
      ctx.stroke();
      
      resolve(canvas.toDataURL('image/png'));
    } catch (error) {
      reject(error);
    }
  });
}

// Helper: Draw rounded rectangle
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Enhance image with simple filters (brightness, contrast, saturation)
export function enhanceImage(imageDataUrl: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const image = await loadImage(imageDataUrl);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = image.width;
      canvas.height = image.height;
      
      // Apply CSS filters for enhancement
      ctx.filter = 'brightness(1.05) contrast(1.1) saturate(1.15)';
      ctx.drawImage(image, 0, 0);
      
      resolve(canvas.toDataURL('image/png'));
    } catch (error) {
      reject(error);
    }
  });
}

// Process toy photo into a sticker
export async function processToyStickerPhoto(
  imageDataUrl: string,
  cropArea?: CropArea
): Promise<string> {
  // Load the original image
  const image = await loadImage(imageDataUrl);
  
  // Crop to square
  const cropped = cropImageToSquare(image, cropArea);
  
  // Enhance
  const enhanced = await enhanceImage(cropped);
  
  // Add sticker effect
  const sticker = await createStickerFromImage(enhanced);
  
  return sticker;
}

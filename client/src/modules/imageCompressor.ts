/**
 * Client-Side Image Compressor
 * Extracted and decoupled from E-Bot-2026 (index.php lines 3058-3088)
 * Compresses and scales image files via Canvas to keep multimodal payloads lightweight.
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
}

/**
 * Resizes and re-encodes an image File down to a maximum dimension and JPEG quality.
 * Returns a Promise resolving to a base64 Data URL (data:image/jpeg;base64,...).
 */
export function compressImageForUpload(
  file: File,
  options?: CompressionOptions
): Promise<string> {
  const maxDim = options?.maxDimension ?? 1024;
  const quality = options?.quality ?? 0.7;

  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file.'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const maxEdge = Math.max(img.width, img.height);
      const scale = maxEdge > maxDim ? maxDim / maxEdge : 1;

      const targetWidth = Math.round(img.width * scale);
      const targetHeight = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Unable to create canvas context for image processing'));
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

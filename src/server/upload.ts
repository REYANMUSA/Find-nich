import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Memory storage so we can safely verify magic bytes before writing to disk
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export function detectImageFormatFromMagicBytes(buffer: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'webp';
  }

  return null;
}

export function saveUploadedImage(buffer: Buffer): { url: string; filename: string; size: number } {
  const format = detectImageFormatFromMagicBytes(buffer);
  if (!format) {
    throw new Error('Unsupported or corrupt image format. Allowed formats: JPEG, PNG, WEBP.');
  }

  const safeId = crypto.randomUUID();
  const filename = `fn_img_${Date.now()}_${safeId}.${format}`;
  const filepath = path.join(UPLOADS_DIR, filename);

  fs.writeFileSync(filepath, buffer);

  return {
    url: `/uploads/${filename}`,
    filename,
    size: buffer.length,
  };
}

export function deleteUploadedImage(filename: string): boolean {
  // Prevent path traversal
  const safeBase = path.basename(filename);
  const filepath = path.join(UPLOADS_DIR, safeBase);

  if (fs.existsSync(filepath)) {
    try {
      fs.unlinkSync(filepath);
      return true;
    } catch (e) {
      console.error('[Upload] Failed to delete file:', e);
      return false;
    }
  }
  return false;
}

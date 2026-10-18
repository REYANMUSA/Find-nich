import multer from 'multer';
import type { VercelRequest, VercelResponse } from '../../src/server/supabaseRest.js';
import { requireAdmin } from '../../src/server/adminApi.js';
import {
  supabaseAdminReady,
  supabaseAdminStorageUpload,
  supabasePublicStorageUrl,
} from '../../src/server/supabaseRest.js';
import { randomUUID } from 'node:crypto';

const BUCKET = 'product-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 0 },
  fileFilter(_req, file, callback) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new Error('Only JPEG, PNG, and WEBP images are allowed.'));
      return;
    }
    callback(null, true);
  },
});

function fail(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ error: { message } });
}

function parseImageUpload(req: VercelRequest, res: VercelResponse): Promise<void> {
  return new Promise((resolve, reject) => {
    upload.single('image')(req as any, res as any, (error: any) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(res, 405, 'Method not allowed.');
  }

  if (!requireAdmin(req, res)) return;
  if (!supabaseAdminReady()) {
    return fail(res, 503, 'Admin database access is not configured. Set a valid SUPABASE_SERVICE_ROLE_KEY in the Vercel Preview environment.');
  }

  try {
    await parseImageUpload(req, res);
  } catch (error: any) {
    if (error?.code === 'LIMIT_FILE_SIZE') return fail(res, 413, 'Image must be 5 MB or smaller.');
    if (error?.code === 'LIMIT_FILE_COUNT' || error?.code === 'LIMIT_UNEXPECTED_FILE') {
      return fail(res, 400, 'Upload exactly one image using the image field.');
    }
    return fail(res, 400, error?.message || 'Could not read the uploaded image.');
  }

  const file = (req as any).file as { buffer?: Buffer; mimetype?: string; originalname?: string } | undefined;
  if (!file?.buffer || !file.mimetype) {
    return fail(res, 400, 'Choose a JPEG, PNG, or WEBP image first.');
  }

  const detectedMime = detectImageMime(file.buffer);
  if (!detectedMime || detectedMime !== file.mimetype) {
    return fail(res, 400, 'The selected file is not a valid JPEG, PNG, or WEBP image.');
  }

  const extension = detectedMime === 'image/jpeg' ? 'jpg' : detectedMime === 'image/png' ? 'png' : 'webp';
  const filename = `${randomUUID()}.${extension}`;
  const objectPath = `products/${filename}`;

  try {
    const response = await supabaseAdminStorageUpload(BUCKET, objectPath, file.buffer, detectedMime);
    if (!response.ok) {
      let detail = '';
      try {
        const data = await response.json();
        detail = String(data?.message || data?.error || '');
      } catch {
        // Use a safe generic message if Storage did not return JSON.
      }
      if (response.status === 404 || /bucket.*not found|not found.*bucket/i.test(detail)) {
        return fail(res, 503, 'The product-images Storage bucket is missing. Create a public Supabase Storage bucket named product-images, then retry.');
      }
      return fail(res, 502, 'Supabase Storage rejected the image upload. Check the product-images bucket configuration.');
    }

    return res.status(201).json({
      url: supabasePublicStorageUrl(BUCKET, objectPath),
      filename,
    });
  } catch {
    return fail(res, 503, 'Image storage is unavailable. Check the Supabase URL and server-only service-role key.');
  }
}

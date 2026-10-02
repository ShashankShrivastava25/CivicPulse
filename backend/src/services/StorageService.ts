import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const MAX_BYTES = 5 * 1024 * 1024;

function detectExt(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

/**
 * Local-disk image storage (development default).
 * The file type is decided by its magic bytes, never by the client's claim, and the filename is random.
 * For production, swap this class for Cloudinary/S3 keeping the same `saveBase64Image` contract.
 */
export class StorageService {
  static async saveBase64Image(input: string): Promise<{ url: string; buffer: Buffer }> {
    const raw = input.replace(/^data:image\/[a-z+]+;base64,/i, '');
    if (!/^[A-Za-z0-9+/=\s]+$/.test(raw)) throw new AppError(400, 'The image data is not valid');
    const buffer = Buffer.from(raw, 'base64');
    if (buffer.length === 0) throw new AppError(400, 'The image is empty');
    if (buffer.length > MAX_BYTES) throw new AppError(413, 'Images must be 5 MB or smaller');
    const ext = detectExt(buffer);
    if (!ext) throw new AppError(400, 'Only JPG, PNG or WEBP images are allowed');
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
    await fs.promises.writeFile(path.join(UPLOAD_DIR, name), buffer);
    return { url: `${env.API_PUBLIC_URL.replace(/\/$/, '')}/uploads/${name}`, buffer };
  }
}

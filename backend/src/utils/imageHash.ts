import sharp from 'sharp';

/** 64-bit difference hash (dHash) as 16 hex chars. Robust to resize/compression/small colour changes. */
export async function computeImageHash(buffer: Buffer): Promise<string | undefined> {
  try {
    const { data } = await sharp(buffer).grayscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
    let bits = '';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) bits += data[y * 9 + x] > data[y * 9 + x + 1] ? '1' : '0';
    }
    let hex = '';
    for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    return hex;
  } catch (e) {
    console.error('Image hash failed:', e);
    return undefined;
  }
}
import { createTrackedObjectUrl } from './media';

/**
 * Thumbnail request queue: limits concurrent thumbnail generation
 * so many large videos don't overload the main thread.
 */
const CONCURRENCY = 3;

let running = 0;
const queue: Array<() => void> = [];

function runNext(): void {
  while (running < CONCURRENCY && queue.length > 0) {
    const job = queue.shift();
    if (job) {
      running++;
      job();
    }
  }
}

export function enqueueThumbnail<T>(factory: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const job = () => {
      factory()
        .then(resolve, reject)
        .finally(() => {
          running--;
          runNext();
        });
    };
    queue.push(job);
    runNext();
  });
}

/**
 * Decode the image once via createImageBitmap, draw it straight to a canvas
 * at the target size, and free the full-resolution bitmap immediately —
 * avoids the double-decode of drawing an <img> at full size before scaling.
 */
export async function generateThumbnailBitmap(
  file: File,
  maxW: number,
  maxH: number
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const origW = bitmap.width;
  const origH = bitmap.height;

  const scale = Math.min(maxW / origW, maxH / origH, 1);
  const targetW = Math.round(origW * scale);
  const targetH = Math.round(origH * scale);

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  bitmap.close();

  const blob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: 0.75,
  });

  return createTrackedObjectUrl(blob);
}

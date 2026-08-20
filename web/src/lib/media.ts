const objectUrls = new Set<string>();

export function createTrackedObjectUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  objectUrls.add(url);
  return url;
}

export function revokeTrackedObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
  objectUrls.delete(url);
}

export function revokeAllObjectUrls(): void {
  objectUrls.forEach(url => URL.revokeObjectURL(url));
  objectUrls.clear();
}

/** Capture resolution for the small sidebar file-item thumb (displayed at 38x38, 2x+ for retina). */
const THUMB_W = 120;
const THUMB_H = 120;
/** Capture resolution for the larger main-panel preview image (displayed at 180x130). */
const PREVIEW_W = 360;
const PREVIEW_H = 260;
/** Long side max for the downscaled main-panel preview data URL. */
const PREVIEW_LONG_SIDE = 800;

/** Short side max for image sent to APIs (Everypixel uses ~300px; smaller = faster). */
const API_IMAGE_SHORT_SIDE_PX = 300;
const API_JPEG_QUALITY = 0.78;

/** Cache of file → base64 JPEG for API calls, keyed by file identity + seek time. */
const b64Cache = new Map<string, string>();
/** Cache of file → downscaled preview data URL, keyed by file identity + seek time. */
const previewCache = new Map<string, string>();

/** Clears the b64/preview caches — call when the file list is reset so stale entries don't linger. */
export function clearMediaCaches(): void {
  b64Cache.clear();
  previewCache.clear();
}

export const ALLOWED_EXTENSIONS = ['jpeg', 'jpg', 'mov', 'mp4'];

/** Middle of the clip reads more representative than the first frame (which is often black/blank). Falls back to 0.1s if duration is unknown. */
function middleFrameTime(duration: number): number {
  return Number.isFinite(duration) && duration > 0 ? duration / 2 : 0.1;
}

/** Resolve which timestamp to seek to: a user-picked override (clamped to the clip), or the auto middle-frame. */
function resolveSeekTime(duration: number, overrideSeconds?: number): number {
  if (overrideSeconds == null || !Number.isFinite(overrideSeconds)) return middleFrameTime(duration);
  if (!Number.isFinite(duration) || duration <= 0) return Math.max(0, overrideSeconds);
  return Math.min(Math.max(0, overrideSeconds), duration);
}

/** Guards against slow/mechanical disks: caps how long we wait for video metadata or a seek to resolve. */
const SEEK_TIMEOUT_MS = 15000;

export function getFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function isImage(file: File): boolean {
  return file.type.toLowerCase().startsWith('image/');
}

export function isVideo(file: File): boolean {
  return file.type.toLowerCase().startsWith('video/');
}

export function isAllowedMedia(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ALLOWED_EXTENSIONS.includes(ext);
}

/** Filter to allowed media types and sort by name — shared by the folder picker and drag-drop. */
export function sortedAllowedFiles(input: FileList | File[]): File[] {
  const list: File[] = [];
  for (let i = 0; i < input.length; i++) {
    const f = input[i];
    if (isAllowedMedia(f)) list.push(f);
  }
  list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  return list;
}

/** Resize so the short side is API_IMAGE_SHORT_SIDE_PX, return base64 JPEG for API. */
function resizeToShortSide(w: number, h: number): { w: number; h: number } {
  const short = Math.min(w, h);
  if (short <= API_IMAGE_SHORT_SIDE_PX) return { w, h };
  const scale = API_IMAGE_SHORT_SIDE_PX / short;
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

/** Resize image or video frame (short side 300px), return base64 JPEG for API. `seekTimeOverride` (seconds) picks a specific frame instead of the auto middle-frame. */
function fileToBase64JpegRaw(file: File, seekTimeOverride?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const finish = (dataUrl: string) => {
      const base64 = dataUrl.split(',')[1];
      if (!base64) reject(new Error('Invalid data URL'));
      else resolve(base64);
    };

    if (isImage(file)) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const { w, h } = resizeToShortSide(img.naturalWidth, img.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          finish(canvas.toDataURL('image/jpeg', API_JPEG_QUALITY));
        } else reject(new Error('Canvas failed'));
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Image load failed'));
      };
      img.src = url;
    } else if (isVideo(file)) {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.preload = 'metadata';

      const captureFrame = () => {
        const { w, h } = resizeToShortSide(video.videoWidth || 640, video.videoHeight || 360);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Canvas failed')); return; }
        ctx.drawImage(video, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', API_JPEG_QUALITY);
        URL.revokeObjectURL(url);
        finish(dataUrl);
      };

      const metaTimer = setTimeout(() => {
        URL.revokeObjectURL(url);
        reject(new Error('Video metadata yüklenemedi — disk çok yavaş olabilir'));
      }, SEEK_TIMEOUT_MS);

      video.onloadedmetadata = () => {
        clearTimeout(metaTimer);
        const seekTime = resolveSeekTime(video.duration, seekTimeOverride);

        // If onseeked never fires, fall back to whatever frame is currently displayed.
        const seekTimer = setTimeout(captureFrame, SEEK_TIMEOUT_MS);

        video.onseeked = () => {
          clearTimeout(seekTimer);
          captureFrame();
        };

        video.currentTime = seekTime;
      };

      video.onerror = () => {
        clearTimeout(metaTimer);
        URL.revokeObjectURL(url);
        reject(new Error('Video yüklenemedi'));
      };
    } else reject(new Error('Unsupported file type'));
  });
}

/** Cached wrapper around fileToBase64JpegRaw — avoids re-decoding/re-seeking the same file+frame. */
export async function fileToBase64Jpeg(file: File, seekTimeOverride?: number): Promise<string> {
  const cacheKey = `${file.name}-${file.size}-${file.lastModified}-${seekTimeOverride ?? 'mid'}`;
  if (b64Cache.has(cacheKey)) return b64Cache.get(cacheKey)!;
  const result = await fileToBase64JpegRaw(file, seekTimeOverride);
  b64Cache.set(cacheKey, result);
  return result;
}

/** Resize so the long side is maxLongSide (never upscale), return { w, h }. */
function resizeToLongSide(w: number, h: number, maxLongSide: number): { w: number; h: number } {
  const long = Math.max(w, h);
  if (long <= maxLongSide) return { w, h };
  const scale = maxLongSide / long;
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

/** Draw the image or video frame onto a canvas downscaled to maxLongSide, return a JPEG data URL. */
function generatePreviewDataUrl(file: File, seekTimeOverride: number | undefined, maxLongSide: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (isImage(file)) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const { w, h } = resizeToLongSide(img.naturalWidth, img.naturalHeight, maxLongSide);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', API_JPEG_QUALITY));
        } else reject(new Error('Canvas failed'));
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Image load failed'));
      };
      img.src = url;
    } else if (isVideo(file)) {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.preload = 'metadata';

      const captureFrame = () => {
        const { w, h } = resizeToLongSide(video.videoWidth || 640, video.videoHeight || 360, maxLongSide);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Canvas failed')); return; }
        ctx.drawImage(video, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', API_JPEG_QUALITY);
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      };

      const metaTimer = setTimeout(() => {
        URL.revokeObjectURL(url);
        reject(new Error('Video metadata yüklenemedi — disk çok yavaş olabilir'));
      }, SEEK_TIMEOUT_MS);

      video.onloadedmetadata = () => {
        clearTimeout(metaTimer);
        const seekTime = resolveSeekTime(video.duration, seekTimeOverride);

        // If onseeked never fires, fall back to whatever frame is currently displayed.
        const seekTimer = setTimeout(captureFrame, SEEK_TIMEOUT_MS);

        video.onseeked = () => {
          clearTimeout(seekTimer);
          captureFrame();
        };

        video.currentTime = seekTime;
      };

      video.onerror = () => {
        clearTimeout(metaTimer);
        URL.revokeObjectURL(url);
        reject(new Error('Video yüklenemedi'));
      };
    } else reject(new Error('Unsupported file type'));
  });
}

/** Cached downscaled (long side <= 800px) preview data URL for the main-panel preview. */
export async function getPreviewUrl(file: File, seekTimeOverride?: number): Promise<string> {
  const cacheKey = `preview-${file.name}-${file.size}-${file.lastModified}-${seekTimeOverride ?? 'mid'}`;
  if (previewCache.has(cacheKey)) return previewCache.get(cacheKey)!;
  const result = await generatePreviewDataUrl(file, seekTimeOverride, PREVIEW_LONG_SIDE);
  previewCache.set(cacheKey, result);
  return result;
}

/** Build a File from base64 JPEG (e.g. for Everypixel when input is video). */
export function base64JpegToFile(b64: string, name = 'frame.jpg'): File {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'image/jpeg' });
  return new File([blob], name, { type: 'image/jpeg' });
}

export function getThumbnailUrl(
  file: File,
  seekTimeOverride?: number,
  maxSize: { w: number; h: number } = { w: THUMB_W, h: THUMB_H }
): Promise<string> {
  if (isImage(file)) return Promise.resolve(URL.createObjectURL(file));
  if (isVideo(file)) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.preload = 'metadata';

      const captureFrame = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || maxSize.w, maxSize.w);
        canvas.height = Math.min(video.videoHeight || maxSize.h, maxSize.h);
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Canvas failed')); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      };

      const metaTimer = setTimeout(() => {
        URL.revokeObjectURL(url);
        reject(new Error('Video metadata yüklenemedi — disk çok yavaş olabilir'));
      }, SEEK_TIMEOUT_MS);

      video.onloadedmetadata = () => {
        clearTimeout(metaTimer);
        const seekTime = resolveSeekTime(video.duration, seekTimeOverride);

        // If onseeked never fires, fall back to whatever frame is currently displayed.
        const seekTimer = setTimeout(captureFrame, SEEK_TIMEOUT_MS);

        video.onseeked = () => {
          clearTimeout(seekTimer);
          captureFrame();
        };

        video.currentTime = seekTime;
      };

      video.onerror = () => {
        clearTimeout(metaTimer);
        URL.revokeObjectURL(url);
        reject(new Error('Video yüklenemedi'));
      };
    });
  }
  return Promise.reject(new Error('Unsupported file type'));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

export function fileFormatLabel(file: File): string {
  const ext = file.name.split('.').pop()?.toUpperCase() ?? '';
  return ext === 'JPG' ? 'JPEG' : ext;
}

export { THUMB_W, THUMB_H, PREVIEW_W, PREVIEW_H };

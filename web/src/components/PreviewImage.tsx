import { useEffect, useRef, useState } from 'react';

import { getThumbnailUrl, isVideo, PREVIEW_H, PREVIEW_W } from '../lib/media';
import { useApp } from '../state/AppContext';
import type { FileEntry } from '../types';

export function PreviewImage({ entry }: { entry: FileEntry }) {
  const { videoFrameByFileId } = useApp();
  const frameOverride = videoFrameByFileId[entry.id];
  const [url, setUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let revoked = false;
    getThumbnailUrl(entry.file, frameOverride, { w: PREVIEW_W, h: PREVIEW_H })
      .then((u) => {
        objectUrlRef.current = u;
        if (!revoked) setUrl(u);
      })
      .catch(() => {
        if (!revoked) setUrl(null);
      });
    return () => {
      revoked = true;
      const u = objectUrlRef.current;
      if (u?.startsWith('blob:')) URL.revokeObjectURL(u);
      objectUrlRef.current = null;
    };
  }, [entry.id, entry.file, frameOverride]);

  return (
    <div className="shrink-0 w-[180px]">
      <div className="w-[180px] h-[130px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#E4E9EE] to-[#CBD5DF] border border-borderSoft flex items-center justify-center text-[#93A0AC]">
        {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl" aria-hidden>{isVideo(entry.file) ? '🎬' : '🖼'}</span>
        )}
      </div>
      <p className="text-[11px] text-text3 mt-1.5 text-center truncate">{entry.name}</p>
    </div>
  );
}

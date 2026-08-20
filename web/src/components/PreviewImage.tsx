import { useEffect, useState } from 'react';

import { useT } from '../lib/useT';
import { getPreviewUrl, isVideo } from '../lib/media';
import { useApp } from '../state/AppContext';
import type { FileEntry } from '../types';

export function PreviewImage({ entry }: { entry: FileEntry }) {
  const { videoFrameByFileId, openFrameEditor } = useApp();
  const t = useT();
  const video = isVideo(entry.file);
  const frameOverride = videoFrameByFileId[entry.id];
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPreviewUrl(entry.file, frameOverride)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [entry.id, entry.file, frameOverride]);

  return (
    <div className="shrink-0 w-[180px] h-full">
      <div
        className={`group relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#E4E9EE] to-[#CBD5DF] border border-borderSoft flex items-center justify-center text-[#93A0AC] ${video ? 'cursor-pointer' : ''}`}
        onClick={video ? () => openFrameEditor(entry.id) : undefined}
      >
        {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl" aria-hidden>{video ? '🎬' : '🖼'}</span>
        )}
        {video && (
          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="rounded-full bg-black/60 text-white text-[11px] font-medium px-2.5 py-1">{t('frame_pick_overlay_label')}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-black/55 backdrop-blur-[1px] px-2 py-1">
          <p className="text-[10.5px] text-white/95 truncate leading-tight">{entry.name}</p>
        </div>
      </div>
    </div>
  );
}

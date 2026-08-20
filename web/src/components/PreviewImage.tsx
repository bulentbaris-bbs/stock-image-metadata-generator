import { useEffect, useMemo, useState } from 'react';

import { useT } from '../lib/useT';
import { getPreviewUrl, isVideo } from '../lib/media';
import { useApp } from '../state/AppContext';
import type { FileEntry } from '../types';

/** Warms the preview cache (and gets the browser to decode the frame) for a neighboring file, without displaying anything. */
function NeighborPreloader({ file, seekTimeOverride }: { file: File; seekTimeOverride?: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPreviewUrl(file, seekTimeOverride).then((u) => {
      if (!cancelled) setUrl(u);
    }, () => {});
    return () => {
      cancelled = true;
    };
  }, [file, seekTimeOverride]);

  if (!url) return null;
  return (
    <div style={{ width: 0, height: 0, overflow: 'hidden', visibility: 'hidden' }} aria-hidden>
      <img src={url} alt="" decoding="async" loading="eager" />
    </div>
  );
}

export function PreviewImage({ entry }: { entry: FileEntry }) {
  const { files, videoFrameByFileId, openFrameEditor } = useApp();
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

  // Preload the previous/next file's preview so Up/Down navigation feels instant —
  // the browser has already decoded the frame by the time the user gets there.
  const { prevEntry, nextEntry } = useMemo(() => {
    const idx = files.findIndex((f) => f.id === entry.id);
    return {
      prevEntry: idx > 0 ? files[idx - 1] : undefined,
      nextEntry: idx >= 0 && idx < files.length - 1 ? files[idx + 1] : undefined,
    };
  }, [files, entry.id]);

  return (
    <div className="shrink-0 w-[180px] h-full">
      <div
        className={`group relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#E4E9EE] to-[#CBD5DF] border border-borderSoft flex items-center justify-center text-[#93A0AC] ${video ? 'cursor-pointer' : ''}`}
        onClick={video ? () => openFrameEditor(entry.id) : undefined}
      >
        {url ? (
          <img src={url} alt="" decoding="async" loading="lazy" className="w-full h-full object-cover" />
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
      {prevEntry && <NeighborPreloader key={`prev-${prevEntry.id}`} file={prevEntry.file} seekTimeOverride={videoFrameByFileId[prevEntry.id]} />}
      {nextEntry && <NeighborPreloader key={`next-${nextEntry.id}`} file={nextEntry.file} seekTimeOverride={videoFrameByFileId[nextEntry.id]} />}
    </div>
  );
}

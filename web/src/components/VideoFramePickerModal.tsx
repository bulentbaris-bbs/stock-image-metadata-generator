import { useEffect, useRef, useState } from 'react';

import { useT } from '../lib/useT';
import { useApp } from '../state/AppContext';

function formatTime(s: number): string {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function VideoFramePickerModal() {
  const { files, videoFrameByFileId, frameEditorFileId, closeFrameEditor, setVideoFrame } = useApp();
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const entry = files.find((f) => f.id === frameEditorFileId) ?? null;
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Create the blob URL exactly once per opened file — recreating it on every
  // render (e.g. from onTimeUpdate) would reset the <video> src and block scrubbing.
  useEffect(() => {
    if (!entry) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(entry.file);
    setObjectUrl(url);
    setDuration(0);
    setCurrent(0);
    return () => URL.revokeObjectURL(url);
  }, [entry]);

  useEffect(() => {
    if (!entry) return;
    const saved = videoFrameByFileId[entry.id];
    const video = videoRef.current;
    if (video && saved != null) {
      const trySeek = () => { video.currentTime = saved; };
      if (video.readyState >= 1) trySeek();
      else video.addEventListener('loadedmetadata', trySeek, { once: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-seek when the target file (and its freshly (re)created video element) changes
  }, [entry?.id, objectUrl]);

  if (!entry) return null;

  const handleUseFrame = () => {
    setVideoFrame(entry.id, current);
    closeFrameEditor();
  };
  const handleReset = () => {
    setVideoFrame(entry.id, null);
    closeFrameEditor();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeFrameEditor}>
      <div className="bg-card rounded-xl border border-border p-6 w-[640px] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-text font-bold text-lg mb-1">{t('frame_pick_title')}</h2>
        <p className="text-text3 text-xs mb-3 truncate">{entry.name}</p>
        <div className="rounded-lg overflow-hidden bg-black flex items-center justify-center" style={{ maxHeight: 360 }}>
          <video
            ref={videoRef}
            src={objectUrl ?? undefined}
            className="max-w-full max-h-[360px]"
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onSeeked={(e) => setCurrent(e.currentTarget.currentTime)}
            controls
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-text3 text-xs w-10 shrink-0">{formatTime(current)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={current}
            onChange={(e) => {
              const t = Number(e.target.value);
              setCurrent(t);
              if (videoRef.current) videoRef.current.currentTime = t;
            }}
            className="flex-1 accent-accent"
          />
          <span className="text-text3 text-xs w-10 shrink-0 text-right">{formatTime(duration)}</span>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button type="button" onClick={handleUseFrame} className="btn-press flex-1 h-9 rounded-lg bg-accent hover:bg-accentH text-white font-semibold text-sm">{t('video_frame_use_btn')}</button>
          <button type="button" onClick={handleReset} className="btn-press h-9 px-4 rounded-lg bg-card2 hover:bg-hover text-text2 text-sm">{t('video_frame_reset_btn')}</button>
          <button type="button" onClick={closeFrameEditor} className="btn-press h-9 px-4 rounded-lg bg-card2 hover:bg-hover text-text2 text-sm">{t('video_frame_cancel_btn')}</button>
        </div>
      </div>
    </div>
  );
}

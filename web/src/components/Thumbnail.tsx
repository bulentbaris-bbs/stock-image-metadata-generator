import { memo, useEffect, useRef, useState } from 'react';

import { useT } from '../lib/useT';
import { fileFormatLabel, formatFileSize, getThumbnailUrl, isVideo, THUMB_H, THUMB_W } from '../lib/media';
import type { RingStatus } from '../lib/limits';
import { enqueueThumbnail } from '../lib/thumbnailQueue';
import { useApp } from '../state/AppContext';
import type { FileEntry } from '../types';

function StatusRing({ status, title }: { status: RingStatus; title?: string }) {
  if (status === 'done') {
    return (
      <div className="w-5 h-5 rounded-full bg-greenBg text-green flex items-center justify-center shrink-0" title={title}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 9 17 20 6" /></svg>
      </div>
    );
  }
  if (status === 'warn') {
    return (
      <div className="w-5 h-5 rounded-full bg-[#FDF1E4] text-[#B3660B] flex items-center justify-center shrink-0" title={title}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L1 21h22L12 2z" /><line x1="12" y1="9" x2="12" y2="13" /><circle cx="12" cy="16.5" r="0.4" fill="currentColor" stroke="none" /></svg>
      </div>
    );
  }
  return <div className="w-5 h-5 rounded-full border-[1.5px] border-dashed border-border shrink-0" title={title} />;
}

export const Thumbnail = memo(function Thumbnail({
  entry,
  selected,
  selectedForBatch,
  ringStatus,
  ringTitle,
  collapsed,
  onClick,
  onToggleBatch,
}: {
  entry: FileEntry;
  selected: boolean;
  selectedForBatch: boolean;
  ringStatus: RingStatus;
  ringTitle?: string;
  collapsed?: boolean;
  onClick: (id: string) => void;
  onToggleBatch: (id: string) => void;
}) {
  const { videoFrameByFileId, openFrameEditor, kbZone } = useApp();
  const t = useT();
  const frameOverride = videoFrameByFileId[entry.id];
  const [url, setUrl] = useState<string | null>(null);
  const [isInView, setIsInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setIsInView(true);
      },
      { rootMargin: '100px', threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;
    let revoked = false;
    enqueueThumbnail(() => getThumbnailUrl(entry.file, frameOverride, { w: THUMB_W, h: THUMB_H }))
      .then((u) => {
        objectUrlRef.current = u;
        if (!revoked) setUrl(u);
      })
      .catch(() => {
        if (!revoked) setUrl(null);
      });
    return () => {
      revoked = true;
    };
  }, [entry.id, isInView, frameOverride]);

  // Real DOM focus follows keyboard selection while in the sidebar zone.
  useEffect(() => {
    if (selected && kbZone === 'sidebar') itemRef.current?.focus();
  }, [selected, kbZone]);

  const video = isVideo(entry.file);

  return (
    <div ref={rootRef} className="w-full">
      <div
        ref={itemRef}
        role="button"
        tabIndex={selected ? 0 : -1}
        onClick={() => onClick(entry.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(entry.id);
          }
        }}
        className={`btn-press flex items-center gap-2.5 rounded-lg p-2 cursor-pointer border mb-0.5 ${selected ? 'bg-sel border-[#CFE3FA]' : 'border-transparent hover:bg-hover'}`}
      >
        <div
          className={`relative rounded-lg overflow-hidden bg-gradient-to-br from-[#DCE3EA] to-[#C7D0DA] flex items-center justify-center text-[#8B96A3] shrink-0 ${collapsed ? 'w-full aspect-square' : 'w-[38px] h-[38px]'}`}
        >
          {url ? (
            <img src={url} alt="" className="w-full h-full object-cover" />
          ) : video ? (
            <span className="text-base" aria-hidden>🎬</span>
          ) : (
            <span className="text-base" aria-hidden>🖼</span>
          )}
          {video && (
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-text/55 flex items-center justify-center text-white" style={{ fontSize: 6 }}>▶</span>
          )}
          {collapsed && (
            <div className="absolute top-1 right-1">
              <StatusRing status={ringStatus} title={ringTitle} />
            </div>
          )}
          <button
            type="button"
            aria-label={selectedForBatch ? t('batch_select_remove') : t('batch_select_add')}
            onClick={(e) => { e.stopPropagation(); onToggleBatch(entry.id); }}
            className="btn-press absolute -top-1 -left-1 z-10 rounded-full border border-border bg-card w-4 h-4 flex items-center justify-center text-text2 shadow"
          >
            {selectedForBatch ? <span className="text-green" style={{ fontSize: 8 }}>✓</span> : null}
          </button>
          {video && !collapsed && (
            <button
              type="button"
              aria-label={t('frame_pick_title')}
              title={frameOverride != null ? t('frame_pick_selected_title') : t('frame_pick_hint')}
              onClick={(e) => { e.stopPropagation(); openFrameEditor(entry.id); }}
              className={`btn-press absolute -top-1.5 -right-1.5 z-10 rounded-full border border-border bg-card w-5 h-5 flex items-center justify-center shadow before:absolute before:-inset-2 before:content-[''] ${frameOverride != null ? 'text-accent' : 'text-text2'}`}
            >
              <span style={{ fontSize: 8 }}>▶</span>
            </button>
          )}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-medium text-text truncate">{entry.name}</div>
              <div className="text-[11px] text-text3 mt-px">{formatFileSize(entry.file.size)} · {fileFormatLabel(entry.file)}</div>
            </div>
            <StatusRing status={ringStatus} title={ringTitle} />
          </>
        )}
      </div>
    </div>
  );
}, (prev, next) =>
  prev.selected === next.selected &&
  prev.selectedForBatch === next.selectedForBatch &&
  prev.ringStatus === next.ringStatus &&
  prev.collapsed === next.collapsed &&
  prev.entry.id === next.entry.id
);

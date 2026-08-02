import { useEffect, useRef, useState } from 'react';

import { KB_STOPS, useApp, type KbStopId } from '../state/AppContext';

export function KwBar({
  stopId,
  label,
  actionLabel,
  countText,
  countClassName = 'text-text2',
  fillPercent,
  fillColorClass = 'bg-[#E1E6EC]',
  getCopyText,
}: {
  stopId?: KbStopId;
  label: string;
  actionLabel: string;
  countText: string;
  countClassName?: string;
  fillPercent?: number;
  fillColorClass?: string;
  getCopyText: () => string;
}) {
  const { kbZone, kbStopIndex, registerKbStop, unregisterKbStop } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = () => {
    const text = getCopyText();
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 900);
  };

  useEffect(() => {
    if (!stopId) return undefined;
    registerKbStop(stopId, { focus: () => ref.current?.focus(), copy: handleCopy });
    return () => unregisterKbStop(stopId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-register whenever the copyable text changes so the keyboard shortcut always copies the latest value
  }, [stopId, getCopyText, registerKbStop, unregisterKbStop]);

  useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current); }, []);

  const isFocused = stopId != null && kbZone === 'content' && KB_STOPS[kbStopIndex] === stopId;

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={stopId ? 0 : -1}
      onClick={handleCopy}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCopy();
        }
      }}
      title="Kopyala"
      className={`relative flex items-center gap-1.5 h-8 px-3.5 rounded-t-xl overflow-hidden cursor-pointer text-[11.5px] font-semibold select-none outline-none ${copied ? 'text-green' : 'text-text2 hover:bg-[#EFEFF0]'} ${isFocused ? 'kb-focus-tabs' : ''}`}
      style={{ background: 'var(--color-kwBar)' }}
    >
      {fillPercent != null && (
        <div
          className={`absolute inset-y-0 left-0 z-0 transition-[width] ${copied ? 'bg-greenBg' : fillColorClass}`}
          style={{ width: `${Math.min(100, Math.max(0, fillPercent))}%` }}
        />
      )}
      <span className="relative z-[1] font-semibold text-text">{label}</span>
      <span className="relative z-[1] flex items-center gap-1 text-accent font-semibold">
        {copied ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 9 17 20 6" /></svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
        )}
        {actionLabel}
      </span>
      <span className={`relative z-[1] ml-auto mono opacity-90 font-medium text-[11px] ${copied ? 'text-green' : countClassName}`}>{countText}</span>
    </div>
  );
}

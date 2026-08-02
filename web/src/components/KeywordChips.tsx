import { useRef, useState } from 'react';

import type { KeywordKey, MetadataRecord } from '../types';
import { KwBar } from './KwBar';

function Chip({
  index,
  en,
  tr,
  onCommitTr,
  onRemove,
}: {
  index: number;
  en: string;
  tr: string;
  onCommitTr: (v: string) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const originalRef = useRef(tr);
  const [synced, setSynced] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <span className={`flex items-center gap-1.5 rounded-[7px] border pl-2.5 pr-1.5 py-1.5 text-[12px] transition-colors ${synced ? 'border-green bg-greenBg' : 'border-borderSoft bg-chip'}`}>
      <span className="text-text3 text-[10.5px]">{index + 1}</span>
      <span className={`font-medium ${synced ? 'text-green' : 'text-text'}`}>{en}</span>
      <span className="text-text3">·</span>
      <span
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        className={`outline-none cursor-text border-b border-dashed px-px ${synced ? 'text-green border-transparent' : 'text-text2 border-transparent hover:border-border focus:text-text focus:border-accent'}`}
        onFocus={() => { originalRef.current = ref.current?.textContent ?? ''; }}
        onBlur={() => {
          const next = (ref.current?.textContent ?? '').trim();
          if (next !== originalRef.current.trim()) {
            onCommitTr(next);
            setSynced(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setSynced(false), 1200);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            ref.current?.blur();
          }
        }}
      >
        {tr}
      </span>
      <button type="button" onClick={onRemove} aria-label="Kaldır" className="btn-press text-text3 hover:text-red shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </span>
  );
}

export function KeywordChips({
  keys,
  maxKw,
  record,
  onUpdateEn,
  onUpdateTr,
  filter,
}: {
  keys: { en: KeywordKey; tr: KeywordKey };
  maxKw: number;
  record: MetadataRecord;
  onUpdateEn: (kw: string[]) => void;
  onUpdateTr: (kw: string[]) => void;
  filter: string;
}) {
  const enList = ((record[keys.en] as string[]) ?? []).filter(Boolean);
  const trList = (record[keys.tr] as string[]) ?? [];

  const removeAt = (i: number) => {
    onUpdateEn(enList.filter((_, j) => j !== i));
    onUpdateTr(trList.filter((_, j) => j !== i));
  };
  const setTrAt = (i: number, v: string) => {
    const next = [...trList];
    while (next.length <= i) next.push('');
    next[i] = v;
    onUpdateTr(next);
  };

  const filterLower = filter.trim().toLowerCase();
  const visible = filterLower
    ? enList
        .map((en, i) => ({ en, tr: trList[i] ?? '', i }))
        .filter(({ en, tr }) => en.toLowerCase().includes(filterLower) || tr.toLowerCase().includes(filterLower))
    : enList.map((en, i) => ({ en, tr: trList[i] ?? '', i }));

  const missing = maxKw - enList.length;

  return (
    <div className="border border-borderSoft rounded-xl overflow-hidden bg-card">
      <KwBar
        stopId="keywords"
        label="Anahtar kelimeler"
        actionLabel="Tümünü kopyala"
        countText={`${enList.length}/${maxKw}`}
        countClassName={enList.length >= maxKw ? 'text-green' : 'text-text2'}
        fillPercent={(enList.length / maxKw) * 100}
        fillColorClass={enList.length >= maxKw ? 'bg-greenBg' : 'bg-[#E1E6EC]'}
        getCopyText={() => enList.join(', ')}
      />
      <div className="p-3.5 flex flex-wrap gap-1.5">
        {visible.map(({ en, tr, i }) => (
          <Chip key={i} index={i} en={en} tr={tr} onCommitTr={(v) => setTrAt(i, v)} onRemove={() => removeAt(i)} />
        ))}
        {missing > 0 && !filterLower && (
          <span className="flex items-center gap-1.5 rounded-[7px] border border-dashed border-border text-text3 px-2.5 py-1.5 text-[12px]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {missing} kelime eksik
          </span>
        )}
        {visible.length === 0 && enList.length > 0 && (
          <span className="text-text3 text-[12px] py-1.5">Filtreyle eşleşen anahtar kelime yok.</span>
        )}
      </div>
    </div>
  );
}

import { useRef, useState } from 'react';

import { apiTranslateToEnglish } from '../api/groq';
import type { UILang } from '../lib/i18n';
import { getLanguage } from '../lib/languages';
import { getActiveGroqKeys } from '../lib/storage';
import { useT } from '../lib/useT';
import { useApp, type TabId } from '../state/AppContext';
import type { KeywordKey, MetadataRecord } from '../types';
import { KwBar } from './KwBar';

function EditableSpan({
  value,
  onCommit,
  className,
  syncedClassName,
}: {
  value: string;
  onCommit: (v: string) => void;
  className: string;
  syncedClassName: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const originalRef = useRef(value);
  const [synced, setSynced] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      className={synced ? syncedClassName : className}
      onFocus={() => { originalRef.current = ref.current?.textContent ?? ''; }}
      onBlur={() => {
        const next = (ref.current?.textContent ?? '').trim();
        if (next && next !== originalRef.current.trim()) {
          onCommit(next);
          setSynced(true);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setSynced(false), 1200);
        } else if (!next) {
          if (ref.current) ref.current.textContent = originalRef.current;
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          ref.current?.blur();
        }
      }}
    >
      {value}
    </span>
  );
}

function Chip({
  index,
  en,
  tr,
  onCommitEn,
  onCommitTr,
  onRemove,
  translating,
}: {
  index: number;
  en: string;
  tr: string;
  onCommitEn: (v: string) => void;
  onCommitTr: (v: string) => void;
  onRemove: () => void;
  translating?: boolean;
}) {
  const t = useT();

  return (
    <span className="flex items-center gap-1 rounded-[7px] border border-borderSoft bg-chip px-[5px] py-[3px] text-[11px] transition-colors">
      <span className="text-text3 text-[10.5px]">{index + 1}</span>
      <span className={translating ? 'opacity-40 transition-opacity' : 'transition-opacity'}>
        <EditableSpan
          value={en}
          onCommit={onCommitEn}
          className="font-medium text-text outline-none cursor-text border-b border-dashed border-transparent hover:border-border focus:border-accent px-px"
          syncedClassName="font-medium text-green outline-none cursor-text border-b border-dashed border-transparent px-px"
        />
      </span>
      <span className="text-text3">·</span>
      <EditableSpan
        value={tr}
        onCommit={onCommitTr}
        className="outline-none cursor-text border-b border-dashed px-px text-[10px] text-text3 opacity-60 border-transparent hover:border-border hover:opacity-100 focus:text-text focus:opacity-100 focus:border-accent"
        syncedClassName="outline-none cursor-text border-b border-dashed px-px text-[10px] text-green border-transparent"
      />
      <button type="button" onClick={onRemove} aria-label={t('remove_kw_aria')} className="btn-press text-text3 hover:text-red shrink-0">
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
  onUpdateSecondary,
  filter,
  onFilterChange,
  platform,
}: {
  keys: { en: KeywordKey; secondary: KeywordKey };
  maxKw: number;
  record: MetadataRecord;
  onUpdateEn: (kw: string[]) => void;
  onUpdateSecondary: (kw: string[]) => void;
  filter: string;
  onFilterChange: (v: string) => void;
  platform: TabId;
}) {
  const t = useT();
  const { istockMap, settings } = useApp();
  const [newKw, setNewKw] = useState('');
  const [translatingIdx, setTranslatingIdx] = useState<number | null>(null);
  const enList = ((record[keys.en] as string[]) ?? []).filter(Boolean);
  const trList = (record[keys.secondary] as string[]) ?? [];

  const removeAt = (i: number) => {
    onUpdateEn(enList.filter((_, j) => j !== i));
    onUpdateSecondary(trList.filter((_, j) => j !== i));
  };
  const setTrAt = (i: number, v: string) => {
    const next = [...trList];
    while (next.length <= i) next.push('');
    next[i] = v;
    onUpdateSecondary(next);
    // A manual correction to the secondary-language keyword must also correct the English source term.
    const groqKeys = getActiveGroqKeys(settings.groq_api_keys_keywords);
    if (groqKeys.length === 0) return;
    const lang = getLanguage(record.secondary_lang ?? settings.target_language);
    setTranslatingIdx(i);
    apiTranslateToEnglish(v, { groqKeys, lang: lang.code as UILang }, lang)
      .then((newEn) => {
        const cleaned = newEn.trim();
        if (cleaned) setEnAt(i, cleaned);
      })
      .catch(() => {
        // ignore translation errors; the secondary-language edit is already saved
      })
      .finally(() => setTranslatingIdx((cur) => (cur === i ? null : cur)));
  };
  const setEnAt = (i: number, v: string) => {
    const next = [...enList];
    next[i] = v;
    onUpdateEn(next);
  };

  const addKeyword = () => {
    const raw = newKw.trim();
    if (!raw || enList.length >= maxKw) return;
    const en = platform === 'istock' ? (istockMap[raw.toLowerCase()] ?? raw) : raw;
    if (enList.some((k) => k.toLowerCase() === en.toLowerCase())) { setNewKw(''); return; }
    onUpdateEn([...enList, en]);
    onUpdateSecondary([...trList, '']);
    setNewKw('');
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
        label={
          <input
            type="text"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder={t('keyword_search_placeholder')}
            className="w-[210px] bg-transparent border-0 outline-none text-text text-[12.5px] placeholder-text3 font-normal"
          />
        }
        actionLabel={t('copy_all_action')}
        countText={`${enList.length}/${maxKw}`}
        countClassName={enList.length >= maxKw ? 'text-green' : 'text-text2'}
        fillPercent={(enList.length / maxKw) * 100}
        fillColorClass={enList.length >= maxKw ? 'bg-greenBg' : 'bg-[#E1E6EC]'}
        getCopyText={() => enList.join(', ')}
      />
      <div className="p-3.5 flex flex-wrap gap-1">
        {visible.map(({ en, tr, i }) => (
          <Chip key={i} index={i} en={en} tr={tr} onCommitEn={(v) => setEnAt(i, v)} onCommitTr={(v) => setTrAt(i, v)} onRemove={() => removeAt(i)} translating={translatingIdx === i} />
        ))}
        {enList.length < maxKw && !filterLower && (
          <span className="flex items-center gap-1 rounded-[7px] border border-dashed border-border px-2 py-1 text-[12px]">
            <input
              type="text"
              value={newKw}
              onChange={(e) => setNewKw(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
              placeholder={t('add_keyword_placeholder')}
              className="w-[110px] bg-transparent border-0 outline-none text-text placeholder-text3"
            />
            <button type="button" onClick={addKeyword} aria-label={t('add_keyword_placeholder')} className="btn-press text-accent shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          </span>
        )}
        {missing > 0 && !filterLower && (
          <span className="flex items-center text-text3 px-1 py-1.5 text-[12px]">{t('missing_keywords', { n: missing })}</span>
        )}
        {visible.length === 0 && enList.length > 0 && (
          <span className="text-text3 text-[12px] py-1.5">{t('no_filter_match')}</span>
        )}
      </div>
    </div>
  );
}

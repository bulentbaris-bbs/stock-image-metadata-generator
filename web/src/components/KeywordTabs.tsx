import { useEffect, useRef, useState } from 'react';

import { useT } from '../lib/useT';
import { getLanguage } from '../lib/languages';
import { ADOBE_MAX, ISTOCK_MAX, SHUTTER_MAX } from '../lib/limits';
import { KB_STOPS, useApp, useAppMeta, type TabId } from '../state/AppContext';
import type { KeywordKey } from '../types';
import { KeywordChips } from './KeywordChips';

const TABS: { id: TabId; label: string; maxKw: number }[] = [
  { id: 'adobe', label: 'ADOBE STOCK', maxKw: ADOBE_MAX },
  { id: 'shutterstock', label: 'SHUTTERSTOCK', maxKw: SHUTTER_MAX },
  { id: 'istock', label: 'ISTOCK', maxKw: ISTOCK_MAX },
];
const KEY_MAP: Record<TabId, { en: KeywordKey; secondary: KeywordKey }> = {
  adobe: { en: 'adobe_keywords_en', secondary: 'adobe_keywords_secondary' },
  shutterstock: { en: 'shutter_keywords_en', secondary: 'shutter_keywords_secondary' },
  istock: { en: 'istock_keywords_en', secondary: 'istock_keywords_secondary' },
};

export function KeywordTabs({ onError }: { onError?: (msg: string) => void }) {
  const [refreshingTr, setRefreshingTr] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState('');
  const [libraryAdded, setLibraryAdded] = useState<number | null>(null);
  const metadataByFileId = useAppMeta();
  const {
    currentFileId,
    updateMetadata,
    activeTab,
    setActiveTab,
    kbZone,
    kbStopIndex,
    registerKbStop,
    unregisterKbStop,
    settings,
    refreshSecondaryTitleDescription,
    refreshSecondaryAllKeywords,
    istockMap,
    setIstockMap,
    saveIstockMap,
    istockEnBaselineByFileIdRef,
  } = useApp();
  const t = useT();
  const tabsRef = useRef<HTMLDivElement>(null);
  const libraryFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    registerKbStop('tabs', { focus: () => tabsRef.current?.focus(), copy: () => {} });
    return () => unregisterKbStop('tabs');
  }, [registerKbStop, unregisterKbStop]);

  if (!currentFileId) return null;
  const record = metadataByFileId[currentFileId];
  if (!record) return null;
  const keys = KEY_MAP[activeTab];
  const enKeywords = ((record[keys.en] as string[]) ?? []).filter(Boolean);
  const lang = getLanguage(settings.target_language);

  const hasSomethingToRefresh =
    enKeywords.length > 0 || (record.title_en ?? '').trim() !== '' || (record.description_en ?? '').trim() !== '';
  const handleRefreshSecondary = async () => {
    if (!currentFileId || !hasSomethingToRefresh) return;
    setRefreshingTr(true);
    onError?.('');
    try {
      await refreshSecondaryTitleDescription(currentFileId, record);
      await refreshSecondaryAllKeywords(currentFileId);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : t('update_lang_error', { lang: lang.native }));
    } finally {
      setRefreshingTr(false);
    }
  };

  const handleAddToLibrary = () => {
    if (!currentFileId) return;
    const baseline = istockEnBaselineByFileIdRef.current[currentFileId] ?? [];
    const current = (record.istock_keywords_en ?? []).filter(Boolean);
    const additions: Record<string, string> = {};
    const len = Math.min(baseline.length, current.length);
    for (let i = 0; i < len; i++) {
      const oldWord = (baseline[i] ?? '').trim();
      const newWord = (current[i] ?? '').trim();
      if (oldWord && newWord && oldWord.toLowerCase() !== newWord.toLowerCase()) {
        additions[oldWord.toLowerCase()] = newWord;
      }
    }
    const count = Object.keys(additions).length;
    if (count > 0) {
      const nextMap = { ...istockMap, ...additions };
      setIstockMap(nextMap);
      saveIstockMap(nextMap);
    }
    setLibraryAdded(count);
    if (libraryFlashTimerRef.current) clearTimeout(libraryFlashTimerRef.current);
    libraryFlashTimerRef.current = setTimeout(() => setLibraryAdded(null), 1800);
  };

  const tabsFocused = kbZone === 'content' && KB_STOPS[kbStopIndex] === 'tabs';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        ref={tabsRef}
        tabIndex={0}
        className={`flex items-center justify-between gap-2 border-b border-borderSoft mb-2.5 outline-none ${tabsFocused ? 'kb-focus-tabs' : ''}`}
      >
        <div className="flex">
          {TABS.map((tab) => {
            const count = ((record[KEY_MAP[tab.id].en] as string[]) ?? []).filter(Boolean).length;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`btn-press relative py-1.5 mr-5 text-[12.5px] font-semibold tracking-wide flex items-center gap-1.5 ${active ? 'text-text' : 'text-text2 hover:text-text'}`}
              >
                {tab.label}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${active ? 'bg-accentSoft text-accent' : 'bg-tag text-text2'}`}>{count}</span>
                {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent rounded" />}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mb-1">
          {activeTab === 'istock' && (
            <button
              type="button"
              onClick={handleAddToLibrary}
              title={t('istock_add_to_library_title')}
              className="btn-press flex items-center gap-1.5 h-6 px-2.5 rounded-md text-text2 hover:text-text hover:bg-hover text-[11.5px] font-medium"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><line x1="10" y1="8" x2="15" y2="8" /><line x1="12.5" y1="5.5" x2="12.5" y2="10.5" /></svg>
              {libraryAdded != null ? (libraryAdded > 0 ? t('istock_added_count', { n: libraryAdded }) : t('istock_added_none')) : t('istock_add_to_library_btn')}
            </button>
          )}
          <button
            type="button"
            onClick={handleRefreshSecondary}
            disabled={!hasSomethingToRefresh || refreshingTr}
            title={t('update_lang_title', { lang: lang.native })}
            className="btn-press flex items-center gap-1.5 h-6 px-2.5 rounded-md text-text2 hover:text-text hover:bg-hover text-[11.5px] font-medium disabled:opacity-40"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a9 9 0 0 0-16-4.5M3 4v5h5" /><path d="M3 16a9 9 0 0 0 16 4.5M21 20v-5h-5" /></svg>
            {refreshingTr ? t('refreshing') : t('update_lang_btn')}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <KeywordChips
          keys={keys}
          maxKw={TABS.find((t) => t.id === activeTab)!.maxKw}
          record={record}
          onUpdateEn={(kw) => updateMetadata(currentFileId, { [keys.en]: kw })}
          onUpdateSecondary={(kw) => updateMetadata(currentFileId, { [keys.secondary]: kw })}
          filter={keywordFilter}
          onFilterChange={setKeywordFilter}
          platform={activeTab}
        />
      </div>
    </div>
  );
}

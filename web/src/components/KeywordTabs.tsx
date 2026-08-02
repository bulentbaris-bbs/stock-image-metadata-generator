import { useEffect, useRef, useState } from 'react';

import { ADOBE_MAX, ISTOCK_MAX, SHUTTER_MAX } from '../lib/limits';
import { KB_STOPS, useApp, type TabId } from '../state/AppContext';
import type { KeywordKey } from '../types';
import { KeywordChips } from './KeywordChips';

const TABS: { id: TabId; label: string; maxKw: number }[] = [
  { id: 'adobe', label: 'Adobe Stock', maxKw: ADOBE_MAX },
  { id: 'shutterstock', label: 'Shutterstock', maxKw: SHUTTER_MAX },
  { id: 'istock', label: 'iStock', maxKw: ISTOCK_MAX },
];
const KEY_MAP: Record<TabId, { en: KeywordKey; tr: KeywordKey }> = {
  adobe: { en: 'adobe_keywords_en', tr: 'adobe_keywords_tr' },
  shutterstock: { en: 'shutter_keywords_en', tr: 'shutter_keywords_tr' },
  istock: { en: 'istock_keywords_en', tr: 'istock_keywords_tr' },
};

export function KeywordTabs({ onError }: { onError?: (msg: string) => void }) {
  const [refreshingTr, setRefreshingTr] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState('');
  const {
    currentFileId,
    metadataByFileId,
    updateMetadata,
    activeTab,
    setActiveTab,
    kbZone,
    kbStopIndex,
    registerKbStop,
    unregisterKbStop,
    refreshTurkishTitleDescription,
    refreshTurkishAllKeywords,
  } = useApp();
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerKbStop('tabs', { focus: () => tabsRef.current?.focus(), copy: () => {} });
    return () => unregisterKbStop('tabs');
  }, [registerKbStop, unregisterKbStop]);

  if (!currentFileId) return null;
  const record = metadataByFileId[currentFileId];
  if (!record) return null;
  const keys = KEY_MAP[activeTab];
  const enKeywords = ((record[keys.en] as string[]) ?? []).filter(Boolean);

  const hasSomethingToRefresh =
    enKeywords.length > 0 || (record.title_en ?? '').trim() !== '' || (record.description_en ?? '').trim() !== '';
  const handleRefreshTurkish = async () => {
    if (!currentFileId || !hasSomethingToRefresh) return;
    setRefreshingTr(true);
    onError?.('');
    try {
      await refreshTurkishTitleDescription(currentFileId, record);
      await refreshTurkishAllKeywords(currentFileId);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Türkçe güncellenemedi');
    } finally {
      setRefreshingTr(false);
    }
  };

  const tabsFocused = kbZone === 'content' && KB_STOPS[kbStopIndex] === 'tabs';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        ref={tabsRef}
        tabIndex={0}
        className={`flex items-center justify-between gap-2 border-b border-borderSoft mb-[18px] outline-none ${tabsFocused ? 'kb-focus-tabs' : ''}`}
      >
        <div className="flex">
          {TABS.map((t) => {
            const count = ((record[KEY_MAP[t.id].en] as string[]) ?? []).filter(Boolean).length;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`btn-press relative py-2.5 mr-5 text-[13.5px] font-medium flex items-center gap-1.5 ${active ? 'text-text' : 'text-text2 hover:text-text'}`}
              >
                {t.label}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${active ? 'bg-accentSoft text-accent' : 'bg-tag text-text2'}`}>{count}</span>
                {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent rounded" />}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleRefreshTurkish}
          disabled={!hasSomethingToRefresh || refreshingTr}
          title="Başlık, açıklama ve anahtar kelimelerin Türkçe karşılıklarını İngilizce metne göre yeniden çevir"
          className="btn-press mb-2 flex items-center gap-1.5 h-7 px-2.5 rounded-md text-text2 hover:text-text hover:bg-hover text-[11.5px] font-medium disabled:opacity-40"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a9 9 0 0 0-16-4.5M3 4v5h5" /><path d="M3 16a9 9 0 0 0 16 4.5M21 20v-5h-5" /></svg>
          {refreshingTr ? 'Yenileniyor…' : 'Türkçeyi güncelle'}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={keywordFilter}
          onChange={(e) => setKeywordFilter(e.target.value)}
          placeholder="Anahtar kelime ara (EN/TR)..."
          className="flex-1 h-8 rounded-md bg-bgSidebar border border-border text-text text-[12.5px] px-3 outline-none focus:border-accent focus:ring-2 focus:ring-accentSoft placeholder-text3"
        />
        {keywordFilter.trim() && (
          <button type="button" onClick={() => setKeywordFilter('')} className="btn-press h-8 px-2 rounded-md text-text3 hover:text-text text-sm" title="Filtreyi temizle">✕</button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <KeywordChips
          keys={keys}
          maxKw={TABS.find((t) => t.id === activeTab)!.maxKw}
          record={record}
          onUpdateEn={(kw) => updateMetadata(currentFileId, { [keys.en]: kw })}
          onUpdateTr={(kw) => updateMetadata(currentFileId, { [keys.tr]: kw })}
          filter={keywordFilter}
        />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';

import VOCABULARY from '../data/istockVocabulary.json';
import { useT } from '../lib/useT';
import { useApp } from '../state/AppContext';

export function IStockModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { istockMap, setIstockMap, saveIstockMap, removeIstockEntry, refreshSharedIstockLibrary } = useApp();
  const t = useT();
  const [generic, setGeneric] = useState('');
  const [istock, setIstock] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState<{ added: number; skipped: number } | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // Derived straight from istockMap on every render — never goes stale, regardless of who last wrote the map (this modal, the keyword-editing bulk add, etc).
  const entries = Object.entries(istockMap).sort((a, b) => a[0].localeCompare(b[0]));
  const filteredEntries = entries.filter(([gen, ist]) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return gen.includes(q) || ist.toLowerCase().includes(q);
  });
  const genericKey = generic.trim().toLowerCase();
  const existingIstock = genericKey ? istockMap[genericKey] : undefined;
  // Existing entries whose generic word contains what's being typed — lets the user find and correct an already-saved mapping instead of only adding new ones.
  const genericSuggestions = genericKey ? entries.filter(([gen]) => gen.includes(genericKey)).slice(0, 8) : [];

  // Pull the latest shared library (other visitors' additions) whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setRefreshing(true);
      await refreshSharedIstockLibrary();
      if (!cancelled) setRefreshing(false);
    })();
    return () => { cancelled = true; };
  }, [open, refreshSharedIstockLibrary]);

  // Close the alternatives dropdown on any outside click.
  useEffect(() => {
    const handler = () => setOpenDropdown(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const handleAdd = () => {
    const g = generic.trim().toLowerCase();
    const i = istock.trim();
    if (g && i) {
      const next = { ...istockMap, [g]: i };
      setIstockMap(next);
      saveIstockMap(next);
      setGeneric('');
      setIstock('');
    }
  };
  const handleSelectSuggestion = (gen: string, ist: string) => {
    setGeneric(gen);
    setIstock(ist);
    setShowSuggestions(false);
  };
  const handleRemove = (key: string) => {
    removeIstockEntry(key);
  };
  const handleBulkImport = () => {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    let added = 0;
    let skipped = 0;
    const next = { ...istockMap };
    for (const line of lines) {
      let parts: string[] = [];
      if (line.includes('→')) parts = line.split('→').map((s) => s.trim());
      else if (line.includes(':')) parts = line.split(':').map((s) => s.trim());
      else if (line.includes(',')) parts = line.split(',').map((s) => s.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        next[parts[0].toLowerCase()] = parts[1];
        added++;
      } else {
        skipped++;
      }
    }
    if (added > 0) {
      setIstockMap(next);
      saveIstockMap(next);
      setBulkText('');
      setBulkResult({ added, skipped });
      setTimeout(() => setBulkResult(null), 3000);
    } else {
      setBulkResult({ added: 0, skipped });
    }
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={handleClose}>
      <div className="bg-card rounded-xl border border-border p-6 w-[640px] max-w-[90vw] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-text font-bold text-lg">{t('istock_modal_title')}</h2>
          {refreshing && <span className="text-text3 text-xs">{t('istock_syncing')}</span>}
        </div>
        <p className="text-text3 text-xs mb-2">{t('istock_shared_note')}</p>
        <div className="flex flex-col gap-2 mb-4 p-3 rounded-lg bg-card2 border border-border">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={generic}
                onChange={(e) => { setGeneric(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={t('generic_word_placeholder')}
                className="w-full h-9 rounded-lg bg-input border border-border text-text text-sm px-3 outline-none"
              />
              {showSuggestions && genericSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-card border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {genericSuggestions.map(([gen, ist]) => (
                    <button
                      key={gen}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectSuggestion(gen, ist)}
                      className="btn-press w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-hover"
                    >
                      <span className="text-text2 truncate">{gen}</span>
                      <span className="text-accent truncate shrink-0">→ {ist}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-text2 self-center">→</span>
            <input type="text" value={istock} onChange={(e) => setIstock(e.target.value)} placeholder={t('istock_equivalent_placeholder')} className="flex-1 h-9 rounded-lg bg-input border border-border text-text text-sm px-3 outline-none" />
            <button type="button" onClick={handleAdd} className="btn-press h-9 px-4 rounded-lg bg-accent hover:bg-accentH text-white text-sm font-medium">{t('add_btn')}</button>
          </div>
          {existingIstock !== undefined && (
            <p className="text-xs text-text3">
              {t('istock_already_note', { key: genericKey, arrow: existingIstock ? ` → ${existingIstock}.` : '.' })}
            </p>
          )}
        </div>
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setBulkOpen((v) => !v)}
            className="text-xs text-accent flex items-center gap-1"
          >
            {bulkOpen ? '▾' : '▸'} Toplu içe aktar
          </button>
          {bulkOpen && (
            <div className="mt-2 flex flex-col gap-2">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={5}
                placeholder={'Her satıra bir eşleşme:\nwoman → women\nman → men\nperson : persons'}
                className="w-full rounded-lg bg-input border border-border text-text text-xs px-3 py-2 outline-none font-mono"
              />
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="btn-press h-8 px-3 rounded-lg bg-accent hover:bg-accentH text-white text-xs font-medium"
                >
                  İçe Aktar
                </button>
                {bulkResult && (
                  <span className="text-xs text-text3">
                    ✓ {bulkResult.added} eklendi
                    {bulkResult.skipped > 0 && `, ${bulkResult.skipped} atlandı`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="relative mb-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${entries.length} eşleşme ara...`}
            className="w-full h-9 rounded-lg bg-input border border-border
                       text-text text-sm px-3 pl-8 outline-none"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-text3"
               fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16" y2="16"/>
          </svg>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {filteredEntries.map(([gen, ist]) => {
            const alternatives = (VOCABULARY as Record<string, string[]>)[gen] ?? [];
            return (
              <div key={gen} className="flex items-center justify-between rounded-lg bg-card2 border border-border px-3 py-2">
                <span className="text-text2 truncate flex-1">{gen}</span>
                <span className="text-accent truncate flex-1 text-center">→</span>
                <div className="flex-1 min-w-0">
                  <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(openDropdown === gen ? null : gen)}
                      className="flex items-center gap-1 text-sm text-accent truncate
                                 hover:text-accentH transition-colors"
                    >
                      {ist}
                      {alternatives.length > 1 && (
                        <svg width="12" height="12" viewBox="0 0 24 24"
                             fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      )}
                    </button>
                    {openDropdown === gen && alternatives.length > 1 && (
                      <div className="absolute z-50 left-0 top-full mt-1
                                      bg-card border border-border rounded-lg
                                      shadow-lg min-w-[200px] py-1">
                        {alternatives.map((alt) => (
                          <button
                            key={alt}
                            type="button"
                            onClick={() => {
                              const next = { ...istockMap, [gen]: alt };
                              setIstockMap(next);
                              saveIstockMap(next);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm
                                       hover:bg-accent hover:text-white transition-colors
                                       ${alt === ist ? 'text-accent font-medium' : 'text-text'}`}
                          >
                            {alt}
                            {alt === ist && ' ✓'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button type="button" onClick={() => handleRemove(gen)} className="btn-press text-red-400 hover:text-red-300 ml-2 px-2 py-1 rounded text-sm">✕</button>
              </div>
            );
          })}
          {filteredEntries.length === 0 && (
            <p className="text-text3 text-sm text-center py-6">
              "{search}" için eşleşme bulunamadı.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

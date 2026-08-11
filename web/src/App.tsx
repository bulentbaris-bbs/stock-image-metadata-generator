/**
 * Stock Metadata Generator — app shell.
 */
import { useCallback, useEffect, useState } from 'react';

import { apiEverypixels, everypixelToKeywordStrings } from './api/everypixels';
import {
  apiKeywordsAllPlatforms,
  apiMetadata,
  apiTranslate,
  apiTranslateUniqueKwToMap,
  applyTrMap,
  buildUniqueEnList,
  fillKeywordsToMax,
  type AiCreds,
  type GroqOnlyCreds,
} from './api/groq';
import { IStockModal } from './components/IStockModal';
import { MainForm } from './components/MainForm';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { VideoFramePickerModal } from './components/VideoFramePickerModal';
import type { UILang } from './lib/i18n';
import { useT } from './lib/useT';
import { getLanguage, isEnglishOnly } from './lib/languages';
import { ADOBE_MAX, ISTOCK_MAX, SHUTTER_MAX } from './lib/limits';
import { base64JpegToFile, fileToBase64Jpeg, isVideo } from './lib/media';
import { emptyRecord, getActiveGroqKeys } from './lib/storage';
import { AppProvider, KB_STOPS, useApp, type TabId } from './state/AppContext';
import type { MetadataRecord } from './types';

const TAB_ORDER: TabId[] = ['adobe', 'shutterstock', 'istock'];

function AppContent() {
  const {
    files, currentFileId, setCurrentFileId, selectedIds, metadataByFileId, setMetadata, updateMetadata, undo, settings, hint, istockMap, videoFrameByFileId,
    kbZone, kbStopIndex, setKbZone, setKbStopIndex, activeTab, setActiveTab, kbStopRegistryRef,
  } = useApp();
  const t = useT();
  const [generating, setGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState<{ current: number; total: number } | null>(null);
  const [refreshingTitle, setRefreshingTitle] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [iStockOpen, setIStockOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const currentEntry = files.find((f) => f.id === currentFileId);

  useEffect(() => {
    if (currentFileId && currentEntry && !metadataByFileId[currentFileId]) setMetadata(currentFileId, emptyRecord(currentEntry.name, settings.target_language));
  }, [currentFileId, currentEntry, metadataByFileId, setMetadata, settings.target_language]);

  // Key navigation logic
  useEffect(() => {
    const isFormField = () => {
      const el = document.activeElement as HTMLElement | null;
      return !!el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFormField()) return;
      const isCopy = (e.key === 'c' || e.key === 'C') && (e.metaKey || e.ctrlKey);
      const isUndo = (e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey) && !e.shiftKey;
      if (isUndo) { undo(); e.preventDefault(); return; }
      if (kbZone === 'sidebar') {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (files.length === 0) return;
          let idx = files.findIndex((f) => f.id === currentFileId);
          if (idx === -1) idx = 0;
          idx = e.key === 'ArrowDown' ? Math.min(idx + 1, files.length - 1) : Math.max(idx - 1, 0);
          setCurrentFileId(files[idx].id);
          return;
        }
        if (e.key === 'ArrowRight') { e.preventDefault(); setKbZone('content'); setKbStopIndex(0); }
        return;
      }
      const onTabs = KB_STOPS[kbStopIndex] === 'tabs';
      if (e.key === 'ArrowDown') { e.preventDefault(); setKbStopIndex(Math.min(kbStopIndex + 1, KB_STOPS.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setKbStopIndex(Math.max(kbStopIndex - 1, 0)); }
      else if (e.key === 'ArrowRight' && onTabs) { e.preventDefault(); const ti = TAB_ORDER.indexOf(activeTab); setActiveTab(TAB_ORDER[(ti + 1) % TAB_ORDER.length]); }
      else if (e.key === 'ArrowLeft' && onTabs) { e.preventDefault(); const ti = TAB_ORDER.indexOf(activeTab); setActiveTab(TAB_ORDER[(ti - 1 + TAB_ORDER.length) % TAB_ORDER.length]); }
      else if (e.key === 'ArrowLeft' && kbStopIndex === 0) { e.preventDefault(); setKbZone('sidebar'); }
      else if (e.key === 'Enter' || e.key === ' ' || isCopy) {
        e.preventDefault();
        const stopId = KB_STOPS[kbStopIndex];
        if (stopId === 'tabs') return;
        kbStopRegistryRef.current[stopId]?.copy();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [files, currentFileId, undo, kbZone, kbStopIndex, setKbZone, setKbStopIndex, activeTab, setActiveTab, kbStopRegistryRef]);

  useEffect(() => {
    if (kbZone !== 'content') return;
    const stopId = KB_STOPS[kbStopIndex];
    kbStopRegistryRef.current[stopId]?.focus();
  }, [kbZone, kbStopIndex, kbStopRegistryRef]);

  const mapIstock = useCallback((kws: string[]) => kws.map((k) => istockMap[k.toLowerCase().trim()] ?? k), [istockMap]);

  const handleGenerate = useCallback(async () => {
    const metaGroqKeys = getActiveGroqKeys(settings.groq_api_keys_meta);
    const kwGroqKeys = getActiveGroqKeys(settings.groq_api_keys_keywords);
    const openRouterKey = settings.openrouter_api_key?.trim();
    const lang = getLanguage(settings.target_language);
    const englishOnly = isEnglishOnly(lang);
    const metaCreds: GroqOnlyCreds = { groqKeys: metaGroqKeys, lang: lang.code as UILang };
    const kwCreds: AiCreds = { groqKeys: kwGroqKeys, openRouterKey, lang: lang.code as UILang };
    if (metaGroqKeys.length === 0) { setError(t('err_meta_needs_groq')); return; }
    
    const orderedEntries = files.filter((f) => selectedIds.has(f.id));
    const toProcess = orderedEntries.length > 0 ? orderedEntries : (currentEntry ? [currentEntry] : []);
    
    setError(null);
    setGenerating(true);
    setGeneratingProgress(toProcess.length > 1 ? { current: 0, total: toProcess.length } : null);
    
    // TEMİZLİK: Eski verileri sıfırla
    for (const entry of toProcess) {
      setMetadata(entry.id, emptyRecord(entry.name, settings.target_language));
    }

    try {
      const hintText = hint.trim();
      for (let i = 0; i < toProcess.length; i++) {
        const entry = toProcess[i];
        if (toProcess.length > 1) setGeneratingProgress({ current: i + 1, total: toProcess.length });
        
        const b64 = await fileToBase64Jpeg(entry.file, videoFrameByFileId[entry.id]);
        const epId = settings.everypixels_id?.trim();
        const epSecret = settings.everypixels_secret?.trim();

        let meta: { title_en: string; title_secondary: string; description_en: string; description_secondary: string };
        let adobeEn: string[]; let shutterEn: string[]; let istockEn: string[];

        // API 1 ve API 2 Paralel Çalıştırma
        if (epId && epSecret) {
          const epTask = async () => {
            const fileForEp = isVideo(entry.file) ? base64JpegToFile(b64, 'frame.jpg') : entry.file;
            const epResult = await apiEverypixels(fileForEp, epId, epSecret, {}, lang.code as UILang);
            const allKw = everypixelToKeywordStrings(epResult);
            let aEn = allKw.slice(0, ADOBE_MAX);
            let sEn = allKw.slice(0, SHUTTER_MAX);
            let iEn = mapIstock(allKw.slice(0, ISTOCK_MAX));
            if (aEn.length < ADOBE_MAX || sEn.length < SHUTTER_MAX || iEn.length < ISTOCK_MAX) {
              const groqKw = await apiKeywordsAllPlatforms(b64, kwCreds, hintText);
              aEn = fillKeywordsToMax(aEn, ADOBE_MAX, groqKw);
              sEn = fillKeywordsToMax(sEn, SHUTTER_MAX, groqKw);
              iEn = fillKeywordsToMax(iEn, ISTOCK_MAX, mapIstock(groqKw));
            }
            return { adobeEn: aEn, shutterEn: sEn, istockEn: iEn };
          };
          [meta, { adobeEn, shutterEn, istockEn }] = await Promise.all([
            apiMetadata(b64, metaCreds, hintText, lang),
            epTask().catch(async () => {
              const f = await apiKeywordsAllPlatforms(b64, kwCreds, hintText);
              return { adobeEn: f.slice(0, ADOBE_MAX), shutterEn: f.slice(0, SHUTTER_MAX), istockEn: mapIstock(f.slice(0, ISTOCK_MAX)) };
            })
          ]);
        } else {
          const [resMeta, rawKw] = await Promise.all([
            apiMetadata(b64, metaCreds, hintText, lang),
            apiKeywordsAllPlatforms(b64, kwCreds, hintText),
          ]);
          meta = resMeta;
          adobeEn = rawKw.slice(0, ADOBE_MAX);
          shutterEn = rawKw.slice(0, SHUTTER_MAX);
          istockEn = mapIstock(rawKw.slice(0, ISTOCK_MAX));
        }

        setMetadata(entry.id, {
          file_name: entry.name,
          created_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
          secondary_lang: lang.code,
          title_en: meta.title_en, title_secondary: '',
          description_en: meta.description_en, description_secondary: '',
          adobe_keywords_en: adobeEn, adobe_keywords_secondary: [],
          shutter_keywords_en: shutterEn, shutter_keywords_secondary: [],
          istock_keywords_en: istockEn, istock_keywords_secondary: [],
          translating: !englishOnly,
        });

        if (!englishOnly) {
          void (async () => {
            updateMetadata(entry.id, { translating: true });
            try {
              const uniqueEn = buildUniqueEnList(adobeEn, shutterEn, istockEn);
              const secMap = await apiTranslateUniqueKwToMap(uniqueEn, metaCreds, lang);
              updateMetadata(entry.id, {
                title_secondary: meta.title_secondary,
                description_secondary: meta.description_secondary,
                adobe_keywords_secondary: applyTrMap(adobeEn, secMap),
                shutter_keywords_secondary: applyTrMap(shutterEn, secMap),
                istock_keywords_secondary: applyTrMap(istockEn, secMap),
                translating: false
              });
            } catch { updateMetadata(entry.id, { translating: false }); }
          })();
        }
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Generation failed'); }
    finally { setGenerating(false); setGeneratingProgress(null); }
  }, [files, selectedIds, currentEntry, settings, hint, mapIstock, setMetadata, updateMetadata, setCurrentFileId, videoFrameByFileId, t]);

  const handleRefreshTitleOnly = useCallback(async () => {
    const groqKeys = getActiveGroqKeys(settings.groq_api_keys_meta);
    if (groqKeys.length === 0) { setError(t('err_meta_needs_groq')); return; }
    if (!currentEntry) { setError(t('err_select_file_first')); return; }
    
    const currentRecord = metadataByFileId[currentFileId ?? ''];
    const existingContext = currentRecord ? ` Previous title to avoid repeating: "${currentRecord.title_en}"` : '';

    setError(null);
    setRefreshingTitle(true);
    try {
      const b64 = await fileToBase64Jpeg(currentEntry.file, videoFrameByFileId[currentEntry.id]);
      const lang = getLanguage(settings.target_language);
      const meta = await apiMetadata(b64, { groqKeys, lang: lang.code as UILang }, (hint.trim() + existingContext).trim(), lang);
      
      const payload: Partial<MetadataRecord> = { title_en: meta.title_en, description_en: meta.description_en };
      
      if (isEnglishOnly(lang)) {
        updateMetadata(currentEntry.id, { ...payload, title_secondary: '', description_secondary: '' });
      } else {
        updateMetadata(currentEntry.id, { ...payload, translating: true });
        void (async () => {
          try {
            const [trTitle, trDesc] = await Promise.all([
              apiTranslate(meta.title_en, lang.code as 'tr' | 'en', { groqKeys, lang: lang.code as UILang }),
              apiTranslate(meta.description_en, lang.code as 'tr' | 'en', { groqKeys, lang: lang.code as UILang })
            ]);
            updateMetadata(currentEntry.id, { title_secondary: trTitle, description_secondary: trDesc, translating: false });
          } catch { updateMetadata(currentEntry.id, { translating: false }); }
        })();
      }
    } catch (e) { setError(e instanceof Error ? e.message : t('err_title_refresh_failed')); }
    finally { setRefreshingTitle(false); }
  }, [settings, currentEntry, hint, metadataByFileId, currentFileId, videoFrameByFileId, updateMetadata, t]);

  return (
    <div className="h-screen flex flex-col bg-bg text-text">
      <Toolbar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((c) => !c)} search={fileSearch} onSearchChange={setFileSearch} onGenerate={handleGenerate} generating={generating} generatingProgress={generatingProgress} onRefreshTitleOnly={handleRefreshTitleOnly} refreshingTitle={refreshingTitle} onOpenIStock={() => setIStockOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />
      {error && <div className="px-[22px] py-2 bg-redBg text-red text-[13px] border-b border-borderSoft">{error}</div>}
      <div className="flex-1 flex min-h-0">
        <Sidebar collapsed={sidebarCollapsed} search={fileSearch} />
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-card">
          <MainForm onError={setError} />
          <div className="shrink-0 px-[22px] py-2 border-t border-borderSoft flex justify-end">
            <span className="text-[11px] text-text3">
              <kbd>↑</kbd><kbd>↓</kbd> {t('shortcut_nav')} · <kbd>→</kbd> {t('shortcut_go_to_fields')} · {t('shortcut_in_tab')} <kbd>←</kbd><kbd>→</kbd> {t('shortcut_change_platform')} · <kbd>⌘C</kbd> {t('shortcut_copy')}
            </span>
          </div>
        </main>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <IStockModal open={iStockOpen} onClose={() => setIStockOpen(false)} />
      <VideoFramePickerModal />
    </div>
  );
}

export default function App() { return <AppProvider><AppContent /></AppProvider>; }
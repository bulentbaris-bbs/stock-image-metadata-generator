/**
 * Stock Metadata Generator — app shell.
 * Tailwind styles are in index.css (@import "tailwindcss" + @theme).
 */
import { useCallback, useEffect, useState } from 'react';

import { apiEverypixels, everypixelToKeywordStrings } from './api/everypixels';
import {
  apiKeywordsAllPlatforms,
  apiMetadata,
  apiMetadataWithKeywords,
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
import { getLanguage } from './lib/languages';
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

  // Two-zone keyboard navigation (mirrors the design mockup's kbZone/KB_STOPS system).
  // 'sidebar' zone: ↑/↓ move file selection, → enters 'content' zone.
  // 'content' zone: ↑/↓ move between bar "stops" (title/description/tabs/keywords),
  // ←/→ on the tabs stop switches platform, ← at the first stop returns to 'sidebar',
  // Enter/Space/⌘C copies the focused stop's text.
  useEffect(() => {
    const isFormField = () => {
      const el = document.activeElement as HTMLElement | null;
      return !!el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFormField()) return;

      const isCopy = (e.key === 'c' || e.key === 'C') && (e.metaKey || e.ctrlKey);
      const isPaste = (e.key === 'v' || e.key === 'V') && (e.metaKey || e.ctrlKey);
      const isUndo = (e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey) && !e.shiftKey;

      if (isUndo) {
        undo();
        e.preventDefault();
        return;
      }

      if (kbZone === 'sidebar') {
        if (isCopy && currentFileId) {
          const record = metadataByFileId[currentFileId];
          const hasMeta = record && (record.title_en || record.title_secondary || (record.adobe_keywords_en?.length ?? 0) > 0);
          if (hasMeta) {
            e.preventDefault();
            navigator.clipboard.writeText(JSON.stringify(record));
          }
          return;
        }
        if (isPaste && currentFileId && currentEntry) {
          e.preventDefault();
          navigator.clipboard.readText().then((text) => {
            try {
              const parsed = JSON.parse(text) as unknown;
              if (parsed && typeof parsed === 'object' && (Array.isArray((parsed as MetadataRecord).adobe_keywords_en) || 'title_en' in (parsed as MetadataRecord))) {
                const record = parsed as MetadataRecord;
                setMetadata(currentFileId, { ...record, file_name: currentEntry.name });
              }
            } catch {
              // ignore invalid paste
            }
          });
          return;
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (files.length === 0) return;
          let idx = files.findIndex((f) => f.id === currentFileId);
          if (idx === -1) idx = 0;
          idx = e.key === 'ArrowDown' ? Math.min(idx + 1, files.length - 1) : Math.max(idx - 1, 0);
          setCurrentFileId(files[idx].id);
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setKbZone('content');
          setKbStopIndex(0);
        }
        return;
      }

      // kbZone === 'content'
      const onTabs = KB_STOPS[kbStopIndex] === 'tabs';
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setKbStopIndex(Math.min(kbStopIndex + 1, KB_STOPS.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setKbStopIndex(Math.max(kbStopIndex - 1, 0));
      } else if (e.key === 'ArrowRight' && onTabs) {
        e.preventDefault();
        const ti = TAB_ORDER.indexOf(activeTab);
        setActiveTab(TAB_ORDER[(ti + 1) % TAB_ORDER.length]);
      } else if (e.key === 'ArrowLeft' && onTabs) {
        e.preventDefault();
        const ti = TAB_ORDER.indexOf(activeTab);
        setActiveTab(TAB_ORDER[(ti - 1 + TAB_ORDER.length) % TAB_ORDER.length]);
      } else if (e.key === 'ArrowLeft' && kbStopIndex === 0) {
        e.preventDefault();
        setKbZone('sidebar');
      } else if (e.key === 'Enter' || e.key === ' ' || isCopy) {
        e.preventDefault();
        const stopId = KB_STOPS[kbStopIndex];
        if (stopId === 'tabs') return;
        kbStopRegistryRef.current[stopId]?.copy();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    files, currentFileId, currentEntry, metadataByFileId, setMetadata, setCurrentFileId, undo,
    kbZone, kbStopIndex, setKbZone, setKbStopIndex, activeTab, setActiveTab, kbStopRegistryRef,
  ]);

  // Move real DOM focus to the active stop whenever it changes (not just a CSS class).
  useEffect(() => {
    if (kbZone !== 'content') return;
    const stopId = KB_STOPS[kbStopIndex];
    kbStopRegistryRef.current[stopId]?.focus();
  }, [kbZone, kbStopIndex, kbStopRegistryRef]);

  const mapIstock = useCallback((kws: string[]) => kws.map((k) => istockMap[k.toLowerCase().trim()] ?? k), [istockMap]);

  const handleGenerate = useCallback(async () => {
    const groqKeys = getActiveGroqKeys(settings);
    const openRouterKey = settings.openrouter_api_key?.trim();
    const lang = getLanguage(settings.target_language);
    // Başlık/açıklama/çeviri — sadece Groq (OpenRouter'a asla düşmesin).
    const metaCreds: GroqOnlyCreds = { groqKeys, lang: lang.code as UILang };
    // Keyword tamamlama — Groq önce, OpenRouter yedek.
    const kwCreds: AiCreds = { groqKeys, openRouterKey, lang: lang.code as UILang };
    if (groqKeys.length === 0 && !openRouterKey) { setError(t('err_need_key')); return; }
    if (groqKeys.length === 0) { setError(t('err_meta_needs_groq')); return; }
    const orderedEntries = files.filter((f) => selectedIds.has(f.id));
    const toProcess = orderedEntries.length > 0 ? orderedEntries : (currentEntry ? [currentEntry] : []);
    if (toProcess.length === 0) { setError(t('err_need_file')); return; }
    setError(null);
    setGenerating(true);
    setGeneratingProgress(toProcess.length > 1 ? { current: 0, total: toProcess.length } : null);
    const everypixelWarnings: string[] = [];
    try {
      const hintText = hint.trim();
      for (let i = 0; i < toProcess.length; i++) {
        const entry = toProcess[i];
        if (toProcess.length > 1) setGeneratingProgress({ current: i + 1, total: toProcess.length });
        setCurrentFileId(entry.id);
        const b64 = await fileToBase64Jpeg(entry.file, videoFrameByFileId[entry.id]);
        const epId = settings.everypixels_id?.trim();
        const epSecret = settings.everypixels_secret?.trim();

        const fromGroqList = (groqKw: string[]) => ({
          adobeEn: groqKw.slice(0, ADOBE_MAX),
          shutterEn: groqKw.slice(0, SHUTTER_MAX),
          istockEn: mapIstock(groqKw.slice(0, ISTOCK_MAX)),
        });

        let meta: { title_en: string; title_secondary: string; description_en: string; description_secondary: string };
        let adobeEn: string[];
        let shutterEn: string[];
        let istockEn: string[];

        if (epId && epSecret) {
          const getEnKeywords = async (): Promise<{ adobeEn: string[]; shutterEn: string[]; istockEn: string[] }> => {
            try {
              const fileForEp = isVideo(entry.file) ? base64JpegToFile(b64, 'frame.jpg') : entry.file;
              const epResult = await apiEverypixels(fileForEp, epId, epSecret, {}, lang.code as UILang);
              const allKw = everypixelToKeywordStrings(epResult);
              let aEn = allKw.slice(0, ADOBE_MAX);
              let sEn = allKw.slice(0, SHUTTER_MAX);
              let iEn = mapIstock(allKw.slice(0, ISTOCK_MAX));
              const needsGroq = aEn.length < ADOBE_MAX || sEn.length < SHUTTER_MAX || iEn.length < ISTOCK_MAX;
              if (needsGroq) {
                const groqKw = await apiKeywordsAllPlatforms(b64, kwCreds, hintText);
                aEn = fillKeywordsToMax(aEn, ADOBE_MAX, groqKw);
                sEn = fillKeywordsToMax(sEn, SHUTTER_MAX, groqKw);
                iEn = fillKeywordsToMax(iEn, ISTOCK_MAX, mapIstock(groqKw));
              }
              return { adobeEn: aEn, shutterEn: sEn, istockEn: iEn };
            } catch (epError) {
              everypixelWarnings.push(
                `${entry.name}: ${epError instanceof Error ? epError.message : t('err_everypixel_request_failed')}`
              );
              return fromGroqList(await apiKeywordsAllPlatforms(b64, kwCreds, hintText));
            }
          };
          // Metadata (title/description) and keywords don't depend on each other — running them
          // together instead of one-after-the-other is a large chunk of "Üret" wall-clock time back.
          [meta, { adobeEn, shutterEn, istockEn }] = await Promise.all([
            apiMetadata(b64, metaCreds, hintText, lang),
            getEnKeywords(),
          ]);
        } else {
          const combined = await apiMetadataWithKeywords(b64, metaCreds, hintText, lang);
          meta = combined;
          ({ adobeEn, shutterEn, istockEn } = fromGroqList(combined.keywords));
        }
        const uniqueEn = buildUniqueEnList(adobeEn, shutterEn, istockEn);
        const secMap = await apiTranslateUniqueKwToMap(uniqueEn, metaCreds, lang);
        const adobeSecondary = applyTrMap(adobeEn, secMap);
        const shutterSecondary = applyTrMap(shutterEn, secMap);
        const istockSecondary = applyTrMap(istockEn, secMap);
        const record: MetadataRecord = {
          file_name: entry.name,
          created_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
          secondary_lang: lang.code,
          title_en: meta.title_en ?? '', title_secondary: meta.title_secondary ?? '',
          description_en: meta.description_en ?? '', description_secondary: meta.description_secondary ?? '',
          adobe_keywords_en: adobeEn, adobe_keywords_secondary: adobeSecondary,
          shutter_keywords_en: shutterEn, shutter_keywords_secondary: shutterSecondary,
          istock_keywords_en: istockEn, istock_keywords_secondary: istockSecondary,
        };
        setMetadata(entry.id, record);
      }
      if (everypixelWarnings.length > 0) {
        setError(t('everypixel_warning', { n: everypixelWarnings.length, msg: everypixelWarnings[0] }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
      setGeneratingProgress(null);
    }
  }, [files, selectedIds, currentEntry, settings, hint, mapIstock, setMetadata, setCurrentFileId, videoFrameByFileId, t]);

  const handleRefreshTitleOnly = useCallback(async () => {
    const groqKeys = getActiveGroqKeys(settings);
    if (groqKeys.length === 0) { setError(t('err_meta_needs_groq')); return; }
    if (!currentEntry) { setError(t('err_select_file_first')); return; }
    setError(null);
    setRefreshingTitle(true);
    try {
      const b64 = await fileToBase64Jpeg(currentEntry.file, videoFrameByFileId[currentEntry.id]);
      const lang = getLanguage(settings.target_language);
      const meta = await apiMetadata(b64, { groqKeys, lang: lang.code as UILang }, hint.trim(), lang);
      updateMetadata(currentEntry.id, { title_en: meta.title_en ?? '', title_secondary: meta.title_secondary ?? '' });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('err_title_refresh_failed'));
    } finally {
      setRefreshingTitle(false);
    }
  }, [settings, currentEntry, hint, videoFrameByFileId, updateMetadata, t]);

  return (
    <div className="h-screen flex flex-col bg-bg text-text">
      <Toolbar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        search={fileSearch}
        onSearchChange={setFileSearch}
        onGenerate={handleGenerate}
        generating={generating}
        generatingProgress={generatingProgress}
        onRefreshTitleOnly={handleRefreshTitleOnly}
        refreshingTitle={refreshingTitle}
        onOpenIStock={() => setIStockOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      {error && <div className="px-[22px] py-2 bg-redBg text-red text-[13px] border-b border-borderSoft">{error}</div>}
      <div className="flex-1 flex min-h-0">
        <Sidebar collapsed={sidebarCollapsed} search={fileSearch} />
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-card">
          <MainForm onError={setError} />
          <footer className="shrink-0 px-[22px] py-2 border-t border-borderSoft flex justify-end">
            <span className="text-[11px] text-text3">
              <kbd>↑</kbd><kbd>↓</kbd> {t('shortcut_nav')} · <kbd>→</kbd> {t('shortcut_go_to_fields')} · {t('shortcut_in_tab')} <kbd>←</kbd><kbd>→</kbd> {t('shortcut_change_platform')} · <kbd>⌘C</kbd> {t('shortcut_copy')}
            </span>
          </footer>
        </main>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <IStockModal open={iStockOpen} onClose={() => setIStockOpen(false)} />
      <VideoFramePickerModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

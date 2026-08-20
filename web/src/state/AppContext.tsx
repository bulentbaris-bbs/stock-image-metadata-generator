import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';

import {
  apiTranslateKwNumbered,
  apiTranslateSecondary,
  apiTranslateUniqueKwToMap,
  applyTrMap,
  buildUniqueEnList,
} from '../api/groq';
import type { UILang } from '../lib/i18n';
import { getLanguage } from '../lib/languages';
import { clearMediaCaches, revokeAllObjectUrls } from '../lib/media';
import { deleteSharedIstockEntry, fetchSharedIstockLibrary, pushSharedIstockEntries } from '../lib/sharedIstockLibrary';
import {
  getActiveGroqKeys,
  loadIStockMap,
  loadMetadataByFileId,
  loadSettings,
  loadVideoFrameMap,
  saveIStockMap,
  saveMetadataByFileId,
  saveSettings,
  saveVideoFrameMap,
} from '../lib/storage';
import type { FileEntry, IStockMap, KeywordKey, MetadataRecord, Settings } from '../types';

export type TabId = 'adobe' | 'shutterstock' | 'istock';
export type KbZone = 'sidebar' | 'content';
/** Mirrors the design mockup's KB_STOPS: the focusable "bars" inside the content zone. */
export const KB_STOPS = ['title', 'description', 'tabs', 'keywords'] as const;
export type KbStopId = (typeof KB_STOPS)[number];

/** A stop registers its DOM node (for real focus/tabIndex) and what Enter/Space/⌘C should do. */
export interface KbStopHandle {
  focus: () => void;
  copy: () => void;
}
export type KbStopRegistry = Partial<Record<KbStopId, KbStopHandle>>;

interface AppState {
  files: FileEntry[];
  currentFileId: string | null;
  /** IDs of files selected for batch metadata generation (e.g. checkboxes). */
  selectedIds: Set<string>;
  settings: Settings;
  istockMap: IStockMap;
  hint: string;
  /** Bumps when a full metadata write resets iStock EN baseline (e.g. generate). */
  istockBaselineEpoch: number;
  istockEnBaselineByFileIdRef: MutableRefObject<Record<string, string[]>>;
  /** User-picked video frame (seconds) per file id; absent = auto middle-frame. */
  videoFrameByFileId: Record<string, number>;
  /** File id whose frame-picker modal is open, or null. */
  frameEditorFileId: string | null;
  activeTab: TabId;
  kbZone: KbZone;
  kbStopIndex: number;
  kbStopRegistryRef: MutableRefObject<KbStopRegistry>;
  theme: Theme;
}

interface AppActions {
  setFiles: (f: FileEntry[]) => void;
  addFiles: (f: File[]) => void;
  setCurrentFileId: (id: string | null) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setMetadata: (id: string, r: MetadataRecord, options?: { skipUndo?: boolean }) => void;
  updateMetadata: (id: string, patch: Partial<MetadataRecord>) => void;
  undo: () => void;
  setSettings: (s: Settings) => void;
  saveSettings: (s: Settings) => void;
  setIstockMap: (m: IStockMap) => void;
  saveIstockMap: (m: IStockMap) => void;
  removeIstockEntry: (key: string) => void;
  refreshSharedIstockLibrary: () => Promise<void>;
  setHint: (h: string) => void;
  refreshSecondaryKeywordField: (fileId: string, keys: { en: KeywordKey; secondary: KeywordKey }, enFull: string[]) => Promise<void>;
  refreshSecondaryTitleDescription: (fileId: string, record?: MetadataRecord | null) => Promise<void>;
  refreshSecondaryAllKeywords: (fileId: string) => Promise<void>;
  setVideoFrame: (fileId: string, seconds: number | null) => void;
  openFrameEditor: (fileId: string) => void;
  closeFrameEditor: () => void;
  setActiveTab: (t: TabId) => void;
  setKbZone: (z: KbZone) => void;
  setKbStopIndex: (i: number) => void;
  registerKbStop: (id: KbStopId, handle: KbStopHandle) => void;
  unregisterKbStop: (id: KbStopId) => void;
  saveTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

function getFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedSave(data: Record<string, MetadataRecord>) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveMetadataByFileId(data);
    saveTimer = null;
  }, 500);
}

export type Theme = 'light' | 'dark';
const THEME_KEY = 'theme';

/** Saved preference if present, otherwise the OS/browser color-scheme preference. */
function loadTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const AppContext = createContext<(AppState & AppActions) | null>(null);
/** Isolated from AppContext: metadataByFileId changes far more often (every keystroke/generation)
 *  than settings/istockMap/etc, so consumers that only need metadata shouldn't re-render on those
 *  changes, and vice versa. */
const AppMetaContext = createContext<Record<string, MetadataRecord> | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [files, setFilesState] = useState<FileEntry[]>([]);
  const [currentFileId, setCurrentFileIdState] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [metadataByFileId, setMetadataByFileId] = useState<Record<string, MetadataRecord>>(
    () => (typeof window !== 'undefined' ? loadMetadataByFileId() : {}),
  );
  /** Mirrors metadataByFileId for callbacks below that only need to read the latest value
   *  (e.g. inside a translate request) without being recreated on every edit. */
  const metadataByFileIdRef = useRef(metadataByFileId);
  useEffect(() => {
    metadataByFileIdRef.current = metadataByFileId;
  }, [metadataByFileId]);
  const [settings, setSettingsState] = useState<Settings>(loadSettings());
  const [istockMap, setIstockMapState] = useState<IStockMap>(loadIStockMap());
  const [videoFrameByFileId, setVideoFrameByFileId] = useState<Record<string, number>>(
    () => (typeof window !== 'undefined' ? loadVideoFrameMap() : {}),
  );
  const [frameEditorFileId, setFrameEditorFileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('adobe');
  const [kbZone, setKbZone] = useState<KbZone>('sidebar');
  const [kbStopIndex, setKbStopIndex] = useState(0);
  const kbStopRegistryRef = useRef<KbStopRegistry>({});
  const [hint, setHint] = useState('');
  const [theme, setThemeState] = useState<Theme>(() => {
    const initial = loadTheme();
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', initial === 'dark');
    return initial;
  });
  const lastUndoRef = useRef<{ fileId: string; record: MetadataRecord } | null>(null);
  /** Last full `istock_keywords_en` from `setMetadata` / undo per file — drives "Kütüphaneye Ekle" diff. */
  const istockEnBaselineByFileIdRef = useRef<Record<string, string[]>>({});
  const [istockBaselineEpoch, setIstockBaselineEpoch] = useState(0);

  const setCurrentFileId = useCallback((id: string | null) => {
    setCurrentFileIdState(id);
    setHint('');
  }, []);

  const setFiles = useCallback((f: FileEntry[]) => {
    revokeAllObjectUrls();
    clearMediaCaches();
    setFilesState(f);
  }, []);
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const selectAll = useCallback(() => {
    setFilesState((currentFiles) => {
      setSelectedIds(new Set(currentFiles.map((f) => f.id)));
      return currentFiles;
    });
  }, []);
  const deselectAll = useCallback(() => setSelectedIds(new Set()), []);

  const addFiles = useCallback((newFiles: File[]) => {
    setFilesState((prev) => {
      const existing = new Set(prev.map((x) => x.id));
      const added: FileEntry[] = [];
      for (const file of newFiles) {
        const id = getFileId(file);
        if (!existing.has(id)) {
          existing.add(id);
          added.push({ id, file, name: file.name });
        }
      }
      return [...prev, ...added];
    });
  }, []);

  const setMetadata = useCallback((id: string, record: MetadataRecord, options?: { skipUndo?: boolean }) => {
    istockEnBaselineByFileIdRef.current[id] = [...(record.istock_keywords_en ?? [])];
    setIstockBaselineEpoch((e) => e + 1);
    setMetadataByFileId((prev) => {
      if (!options?.skipUndo && prev[id]) lastUndoRef.current = { fileId: id, record: prev[id] };
      const next = { ...prev, [id]: record };
      if (typeof window !== 'undefined') debouncedSave(next);
      return next;
    });
  }, []);

  const updateMetadata = useCallback((id: string, patch: Partial<MetadataRecord>) => {
    setMetadataByFileId((prev) => {
      const current = prev[id];
      if (!current) return prev;
      if (current) lastUndoRef.current = { fileId: id, record: current };
      const next = { ...prev, [id]: { ...current, ...patch } };
      if (typeof window !== 'undefined') debouncedSave(next);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    const slot = lastUndoRef.current;
    if (!slot) return;
    istockEnBaselineByFileIdRef.current[slot.fileId] = [...(slot.record.istock_keywords_en ?? [])];
    setIstockBaselineEpoch((e) => e + 1);
    setMetadataByFileId((prev) => {
      if (prev[slot.fileId] === undefined) return prev;
      lastUndoRef.current = null;
      const next = { ...prev, [slot.fileId]: slot.record };
      if (typeof window !== 'undefined') saveMetadataByFileId(next);
      return next;
    });
  }, []);

  const saveSettingsAction = useCallback((s: Settings) => {
    setSettingsState(s);
    saveSettings(s);
  }, []);

  const saveTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, []);
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }, []);

  const saveIstockMapAction = useCallback((m: IStockMap) => {
    setIstockMapState(m);
    saveIStockMap(m);
    // Best-effort: push the same additions to the shared library so every visitor sees them.
    void pushSharedIstockEntries(m);
    // Retroactively re-apply the updated library to every already-generated file's
    // iStock keywords, so no manual "iStock Eşleştir" click is needed per file.
    setMetadataByFileId((prev) => {
      let changed = false;
      const next: Record<string, MetadataRecord> = { ...prev };
      for (const [fileId, record] of Object.entries(prev)) {
        const en = record.istock_keywords_en ?? [];
        if (en.length === 0) continue;
        const mapped = en.map((k) => m[k.toLowerCase().trim()] ?? k);
        if (mapped.some((v, i) => v !== en[i])) {
          changed = true;
          next[fileId] = { ...record, istock_keywords_en: mapped };
          istockEnBaselineByFileIdRef.current[fileId] = [...mapped];
        }
      }
      if (!changed) return prev;
      setIstockBaselineEpoch((e) => e + 1);
      if (typeof window !== 'undefined') saveMetadataByFileId(next);
      return next;
    });
  }, []);

  const removeIstockEntryAction = useCallback((key: string) => {
    setIstockMapState((prev) => {
      const next = { ...prev };
      delete next[key];
      saveIStockMap(next);
      return next;
    });
    void deleteSharedIstockEntry(key);
  }, []);

  const refreshSharedIstockLibraryAction = useCallback(async () => {
    const shared = await fetchSharedIstockLibrary();
    if (Object.keys(shared).length === 0) return;
    setIstockMapState((prev) => {
      const next = { ...shared, ...prev }; // local edits not yet pushed win over the shared copy
      saveIStockMap(next);
      return next;
    });
  }, []);

  // Pull the shared library once on startup, and backfill anything only present locally up to the server.
  useEffect(() => {
    (async () => {
      const shared = await fetchSharedIstockLibrary();
      setIstockMapState((prev) => {
        const merged = { ...shared, ...prev };
        if (Object.keys(merged).length !== Object.keys(prev).length || Object.entries(merged).some(([k, v]) => prev[k] !== v)) {
          saveIStockMap(merged);
        }
        if (Object.keys(prev).length > 0) void pushSharedIstockEntries(prev);
        return merged;
      });
    })();
  }, []);

  const setVideoFrame = useCallback((fileId: string, seconds: number | null) => {
    setVideoFrameByFileId((prev) => {
      const next = { ...prev };
      if (seconds == null) delete next[fileId];
      else next[fileId] = seconds;
      saveVideoFrameMap(next);
      return next;
    });
  }, []);
  const openFrameEditor = useCallback((fileId: string) => setFrameEditorFileId(fileId), []);
  const closeFrameEditor = useCallback(() => setFrameEditorFileId(null), []);

  const registerKbStop = useCallback((id: KbStopId, handle: KbStopHandle) => {
    kbStopRegistryRef.current[id] = handle;
  }, []);
  const unregisterKbStop = useCallback((id: KbStopId) => {
    delete kbStopRegistryRef.current[id];
  }, []);

  const refreshSecondaryKeywordField = useCallback(
    async (fileId: string, keys: { en: KeywordKey; secondary: KeywordKey }, enFull: string[]) => {
      const record = metadataByFileIdRef.current[fileId];
      if (!record) return;
      const groqKeys = getActiveGroqKeys(settings.groq_api_keys_keywords);
      if (groqKeys.length === 0) return;
      const lang = getLanguage(settings.target_language);
      const enFiltered = enFull.map((s) => (s ?? '').trim()).filter(Boolean);
      if (enFiltered.length === 0) return;
      const secFiltered = await apiTranslateKwNumbered(enFiltered, { groqKeys, lang: lang.code as UILang }, lang);
      const secFull: string[] = [];
      let j = 0;
      for (let i = 0; i < enFull.length; i++) {
        if ((enFull[i] ?? '').trim()) {
          secFull.push(secFiltered[j] ?? enFiltered[j] ?? '');
          j++;
        } else {
          secFull.push('');
        }
      }
      updateMetadata(fileId, { [keys.secondary]: secFull, secondary_lang: lang.code });
    },
    [updateMetadata, settings],
  );

  const refreshSecondaryAllKeywords = useCallback(
    async (fileId: string) => {
      const record = metadataByFileIdRef.current[fileId];
      if (!record) return;
      const groqKeys = getActiveGroqKeys(settings.groq_api_keys_keywords);
      if (groqKeys.length === 0) return;
      const lang = getLanguage(settings.target_language);
      const adobeEn = (record.adobe_keywords_en ?? []).map((k) => (k ?? '').trim()).filter(Boolean);
      const shutterEn = (record.shutter_keywords_en ?? []).map((k) => (k ?? '').trim()).filter(Boolean);
      const istockEn = (record.istock_keywords_en ?? []).map((k) => (k ?? '').trim()).filter(Boolean);
      const adobeEnFull = record.adobe_keywords_en ?? [];
      const shutterEnFull = record.shutter_keywords_en ?? [];
      const istockEnFull = record.istock_keywords_en ?? [];
      if (adobeEn.length === 0 && shutterEn.length === 0 && istockEn.length === 0) return;
      const uniqueEn = buildUniqueEnList(adobeEnFull, shutterEnFull, istockEnFull);
      const secMap = await apiTranslateUniqueKwToMap(uniqueEn, { groqKeys, lang: lang.code as UILang }, lang);
      updateMetadata(fileId, {
        adobe_keywords_secondary: applyTrMap(adobeEnFull, secMap),
        shutter_keywords_secondary: applyTrMap(shutterEnFull, secMap),
        istock_keywords_secondary: applyTrMap(istockEnFull, secMap),
        secondary_lang: lang.code,
      });
    },
    [updateMetadata, settings],
  );

  const refreshSecondaryTitleDescription = useCallback(
    async (fileId: string, recordFromCaller?: MetadataRecord | null) => {
      const record = recordFromCaller ?? metadataByFileIdRef.current[fileId];
      if (!record) return;
      const groqKeys = getActiveGroqKeys(settings.groq_api_keys_meta);
      if (groqKeys.length === 0) return;
      const lang = getLanguage(settings.target_language);
      const creds = { groqKeys, lang: lang.code as UILang };
      const patch: Partial<MetadataRecord> = { secondary_lang: lang.code };
      if ((record.title_en ?? '').trim()) {
        patch.title_secondary = await apiTranslateSecondary(record.title_en, creds, lang);
      }
      if ((record.description_en ?? '').trim()) {
        patch.description_secondary = await apiTranslateSecondary(record.description_en, creds, lang);
      }
      updateMetadata(fileId, patch);
    },
    [settings, updateMetadata],
  );

  const value = useMemo(
    () => ({
      files, currentFileId, selectedIds, settings, istockMap, hint,
      istockBaselineEpoch, istockEnBaselineByFileIdRef, videoFrameByFileId, frameEditorFileId,
      activeTab, kbZone, kbStopIndex, kbStopRegistryRef, theme,
      setFiles, addFiles, setCurrentFileId, toggleSelection, selectAll, deselectAll,
      setMetadata, updateMetadata, undo,
      setSettings: (s: Settings) => setSettingsState(s), saveSettings: saveSettingsAction,
      setIstockMap: (m: IStockMap) => setIstockMapState(m), saveIstockMap: saveIstockMapAction,
      removeIstockEntry: removeIstockEntryAction, refreshSharedIstockLibrary: refreshSharedIstockLibraryAction,
      setHint, refreshSecondaryKeywordField, refreshSecondaryTitleDescription, refreshSecondaryAllKeywords,
      setVideoFrame, openFrameEditor, closeFrameEditor,
      setActiveTab, setKbZone, setKbStopIndex, registerKbStop, unregisterKbStop,
      saveTheme, toggleTheme,
    }),
    [files, currentFileId, selectedIds, settings, istockMap, hint, istockBaselineEpoch, videoFrameByFileId, frameEditorFileId, activeTab, kbZone, kbStopIndex, theme, saveSettingsAction, saveIstockMapAction, removeIstockEntryAction, refreshSharedIstockLibraryAction, refreshSecondaryKeywordField, refreshSecondaryTitleDescription, refreshSecondaryAllKeywords, undo, setVideoFrame, openFrameEditor, closeFrameEditor, registerKbStop, unregisterKbStop, saveTheme, toggleTheme]
  );

  return (
    <AppContext.Provider value={value}>
      <AppMetaContext.Provider value={metadataByFileId}>{children}</AppMetaContext.Provider>
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook co-located with its provider is the standard pattern here.
export function useApp(): AppState & AppActions {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

/** Isolated from useApp() — only re-renders consumers when metadataByFileId itself changes. */
// eslint-disable-next-line react-refresh/only-export-components -- context hook co-located with its provider is the standard pattern here.
export function useAppMeta(): Record<string, MetadataRecord> {
  const ctx = useContext(AppMetaContext);
  if (!ctx) throw new Error('useAppMeta must be used within AppProvider');
  return ctx;
}

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
  apiTranslateToTurkish,
  apiTranslateUniqueKwToMap,
  applyTrMap,
  buildUniqueEnList,
} from '../api/groq';
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
  metadataByFileId: Record<string, MetadataRecord>;
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
  setHint: (h: string) => void;
  refreshTurkish: (fileId: string, keys: { en: KeywordKey; tr: KeywordKey }, enFull: string[]) => Promise<void>;
  refreshTurkishTitleDescription: (fileId: string, record?: MetadataRecord | null) => Promise<void>;
  refreshTurkishAllKeywords: (fileId: string) => Promise<void>;
  setVideoFrame: (fileId: string, seconds: number | null) => void;
  openFrameEditor: (fileId: string) => void;
  closeFrameEditor: () => void;
  setActiveTab: (t: TabId) => void;
  setKbZone: (z: KbZone) => void;
  setKbStopIndex: (i: number) => void;
  registerKbStop: (id: KbStopId, handle: KbStopHandle) => void;
  unregisterKbStop: (id: KbStopId) => void;
}

function getFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [files, setFilesState] = useState<FileEntry[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [metadataByFileId, setMetadataByFileId] = useState<Record<string, MetadataRecord>>(
    () => (typeof window !== 'undefined' ? loadMetadataByFileId() : {}),
  );
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
  const lastUndoRef = useRef<{ fileId: string; record: MetadataRecord } | null>(null);
  /** Last full `istock_keywords_en` from `setMetadata` / undo per file — drives "Kütüphaneye Ekle" diff. */
  const istockEnBaselineByFileIdRef = useRef<Record<string, string[]>>({});
  const [istockBaselineEpoch, setIstockBaselineEpoch] = useState(0);

  useEffect(() => {
    setHint('');
  }, [currentFileId]);

  const setFiles = useCallback((f: FileEntry[]) => setFilesState(f), []);
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
      if (typeof window !== 'undefined') saveMetadataByFileId(next);
      return next;
    });
  }, []);

  const updateMetadata = useCallback((id: string, patch: Partial<MetadataRecord>) => {
    setMetadataByFileId((prev) => {
      const current = prev[id];
      if (!current) return prev;
      if (current) lastUndoRef.current = { fileId: id, record: current };
      const next = { ...prev, [id]: { ...current, ...patch } };
      if (typeof window !== 'undefined') saveMetadataByFileId(next);
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

  const saveIstockMapAction = useCallback((m: IStockMap) => {
    setIstockMapState(m);
    saveIStockMap(m);
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

  const refreshTurkish = useCallback(
    async (fileId: string, keys: { en: KeywordKey; tr: KeywordKey }, enFull: string[]) => {
      const record = metadataByFileId[fileId];
      if (!record) return;
      const groqKeys = getActiveGroqKeys(settings);
      const geminiKey = settings.gemini_api_key?.trim();
      if (groqKeys.length === 0 && !geminiKey) return;
      const enFiltered = enFull.map((s) => (s ?? '').trim()).filter(Boolean);
      if (enFiltered.length === 0) return;
      const trFiltered = await apiTranslateKwNumbered(enFiltered, { groqKeys, geminiKey });
      const trFull: string[] = [];
      let j = 0;
      for (let i = 0; i < enFull.length; i++) {
        if ((enFull[i] ?? '').trim()) {
          trFull.push(trFiltered[j] ?? enFiltered[j] ?? '');
          j++;
        } else {
          trFull.push('');
        }
      }
      updateMetadata(fileId, { [keys.tr]: trFull });
    },
    [metadataByFileId, updateMetadata, settings],
  );

  const refreshTurkishAllKeywords = useCallback(
    async (fileId: string) => {
      const record = metadataByFileId[fileId];
      if (!record) return;
      const groqKeys = getActiveGroqKeys(settings);
      const geminiKey = settings.gemini_api_key?.trim();
      if (groqKeys.length === 0 && !geminiKey) return;
      const adobeEn = (record.adobe_keywords_en ?? []).map((k) => (k ?? '').trim()).filter(Boolean);
      const shutterEn = (record.shutter_keywords_en ?? []).map((k) => (k ?? '').trim()).filter(Boolean);
      const istockEn = (record.istock_keywords_en ?? []).map((k) => (k ?? '').trim()).filter(Boolean);
      const adobeEnFull = record.adobe_keywords_en ?? [];
      const shutterEnFull = record.shutter_keywords_en ?? [];
      const istockEnFull = record.istock_keywords_en ?? [];
      if (adobeEn.length === 0 && shutterEn.length === 0 && istockEn.length === 0) return;
      const uniqueEn = buildUniqueEnList(adobeEnFull, shutterEnFull, istockEnFull);
      const trMap = await apiTranslateUniqueKwToMap(uniqueEn, { groqKeys, geminiKey });
      updateMetadata(fileId, {
        adobe_keywords_tr: applyTrMap(adobeEnFull, trMap),
        shutter_keywords_tr: applyTrMap(shutterEnFull, trMap),
        istock_keywords_tr: applyTrMap(istockEnFull, trMap),
      });
    },
    [metadataByFileId, updateMetadata, settings],
  );

  const refreshTurkishTitleDescription = useCallback(
    async (fileId: string, recordFromCaller?: MetadataRecord | null) => {
      const record = recordFromCaller ?? metadataByFileId[fileId];
      if (!record) return;
      const groqKeys = getActiveGroqKeys(settings);
      const geminiKey = settings.gemini_api_key?.trim();
      if (groqKeys.length === 0 && !geminiKey) return;
      const creds = { groqKeys, geminiKey };
      const patch: Partial<MetadataRecord> = {};
      if ((record.title_en ?? '').trim()) {
        patch.title_tr = await apiTranslateToTurkish(record.title_en, creds);
      }
      if ((record.description_en ?? '').trim()) {
        patch.description_tr = await apiTranslateToTurkish(record.description_en, creds);
      }
      if (Object.keys(patch).length > 0) {
        updateMetadata(fileId, patch);
      }
    },
    [metadataByFileId, settings, updateMetadata],
  );

  const value = useMemo(
    () => ({
      files, currentFileId, selectedIds, metadataByFileId, settings, istockMap, hint,
      istockBaselineEpoch, istockEnBaselineByFileIdRef, videoFrameByFileId, frameEditorFileId,
      activeTab, kbZone, kbStopIndex, kbStopRegistryRef,
      setFiles, addFiles, setCurrentFileId, toggleSelection, selectAll, deselectAll,
      setMetadata, updateMetadata, undo,
      setSettings: (s: Settings) => setSettingsState(s), saveSettings: saveSettingsAction,
      setIstockMap: (m: IStockMap) => setIstockMapState(m), saveIstockMap: saveIstockMapAction,
      setHint, refreshTurkish, refreshTurkishTitleDescription, refreshTurkishAllKeywords,
      setVideoFrame, openFrameEditor, closeFrameEditor,
      setActiveTab, setKbZone, setKbStopIndex, registerKbStop, unregisterKbStop,
    }),
    [files, currentFileId, selectedIds, metadataByFileId, settings, istockMap, hint, istockBaselineEpoch, videoFrameByFileId, frameEditorFileId, activeTab, kbZone, kbStopIndex, saveSettingsAction, saveIstockMapAction, refreshTurkish, refreshTurkishTitleDescription, refreshTurkishAllKeywords, undo, setVideoFrame, openFrameEditor, closeFrameEditor, registerKbStop, unregisterKbStop]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook co-located with its provider is the standard pattern here.
export function useApp(): AppState & AppActions {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

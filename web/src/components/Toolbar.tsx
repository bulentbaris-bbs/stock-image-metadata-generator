import { useEffect, useRef } from 'react';

import { useT } from '../lib/useT';
import { SECONDARY_LANGUAGES } from '../lib/languages';
import { getFileId, sortedAllowedFiles } from '../lib/media';
import { MAX_GROQ_KEYS, getActiveGroqKeys } from '../lib/storage';
import { useApp } from '../state/AppContext';

const SIDEBAR_W = 280;
const SIDEBAR_W_COLLAPSED = 92;

export function Toolbar({
  collapsed,
  onToggleCollapse,
  search,
  onSearchChange,
  onGenerate,
  generating,
  generatingProgress,
  onRefreshTitleOnly,
  refreshingTitle,
  onOpenIStock,
  onOpenSettings,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  onGenerate: () => void;
  generating: boolean;
  generatingProgress: { current: number; total: number } | null;
  onRefreshTitleOnly: () => void;
  refreshingTitle: boolean;
  onOpenIStock: () => void;
  onOpenSettings: () => void;
}) {
  const { hint, setHint, settings, setFiles, saveSettings } = useApp();
  const t = useT();
  const folderInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = folderInputRef.current;
    if (el) { el.setAttribute('webkitdirectory', ''); el.setAttribute('directory', ''); }
  }, []);

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;
    const list = sortedAllowedFiles(selected);
    setFiles(list.map((file) => ({ id: getFileId(file), file, name: file.name })));
    e.target.value = '';
  };

  const progressLabel = generating && generatingProgress ? ` ${generatingProgress.current}/${generatingProgress.total}` : '';
  const activeKeys = getActiveGroqKeys(settings).length;
  const openRouterSet = !!settings.openrouter_api_key?.trim();
  const groqDot = activeKeys > 0 ? 'bg-green' : openRouterSet ? 'bg-[#E8A317]' : 'bg-red';
  const groqTitle = t('groq_status_title', { active: activeKeys, max: MAX_GROQ_KEYS }) + (openRouterSet ? t('openrouter_active_suffix') : '');

  return (
    <header className="bg-card border-b border-borderSoft shrink-0 flex items-stretch">
      <div
        className={`flex items-center gap-2 px-4 py-[15px] border-r border-borderSoft bg-bgSidebar shrink-0 transition-[width] duration-150 ${collapsed ? 'justify-center' : ''}`}
        style={{ width: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W }}
      >
        {!collapsed && (
          <div className="w-[34px] h-[34px] rounded-lg bg-card border border-borderSoft flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/logo.png" alt="BBS Studio" className="w-full h-full object-cover" />
          </div>
        )}
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0 h-[34px] bg-card border border-border rounded-md px-2.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text3 shrink-0"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16" y2="16" /></svg>
            <input type="text" value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder={t('search_placeholder')} className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[13px] text-text placeholder-text3" />
          </div>
        )}
        <button
          type="button"
          onClick={() => folderInputRef.current?.click()}
          title={t('folder_select_title')}
          className="btn-press w-[34px] h-[34px] rounded-lg border border-border bg-card flex items-center justify-center text-accent hover:bg-accentSoft hover:border-[#CFE3FA] shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="9.5" y1="13.5" x2="14.5" y2="13.5" /></svg>
        </button>
        <input ref={folderInputRef} type="file" multiple accept=".jpg,.jpeg,.mov,.mp4" onChange={handleFolderChange} className="hidden" />
      </div>

      <div className="relative flex items-center shrink-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          title={t('collapse_toggle_title')}
          className="btn-press w-[22px] h-[22px] rounded-full bg-card border border-border flex items-center justify-center text-text2 hover:text-accent hover:border-[#CFE3FA] -ml-[11px] z-10"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? 'scaleX(-1)' : undefined }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-between px-[22px] py-[15px] gap-3 min-w-0">
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[560px] bg-bgSidebar border border-border rounded-md px-3 h-[34px]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text3 shrink-0"><rect x="4" y="4" width="16" height="16" rx="2" /><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="13" y2="13" /></svg>
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder={t('hint_placeholder')}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[13px] text-text placeholder-text3"
          />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onRefreshTitleOnly}
            disabled={refreshingTitle || generating}
            title="⌘R"
            className="btn-press flex items-center gap-1.5 h-[34px] px-3.5 rounded-[9px] border border-border bg-card text-text text-[13px] font-medium hover:bg-bg disabled:opacity-50"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a9 9 0 0 0-16-4.5M3 4v5h5" /><path d="M3 16a9 9 0 0 0 16 4.5M21 20v-5h-5" /></svg>
            {refreshingTitle ? t('refreshing') : t('refresh_title_btn')}
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating}
            title="⌘↵"
            className="btn-press flex items-center gap-1.5 h-[34px] px-3.5 rounded-[9px] bg-accent hover:bg-accentH text-white text-[13px] font-medium disabled:opacity-50"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>
            {generating ? `${t('generating')}${progressLabel}` : t('generate_btn')}
          </button>
          <div className="relative flex items-center gap-1 h-[34px] pl-2.5 pr-6 border border-border rounded-lg bg-card text-text2 text-[12.5px] font-medium hover:bg-bg" title={t('lang_select_title')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a13 13 0 0 1 0 18a13 13 0 0 1 0-18z" /></svg>
            <select
              value={settings.target_language}
              onChange={(e) => saveSettings({ ...settings, target_language: e.target.value })}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              {SECONDARY_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.native}</option>
              ))}
            </select>
            <span className="pointer-events-none">{settings.target_language.toUpperCase()}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-2 text-text3"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
          <button
            type="button"
            onClick={onOpenIStock}
            title={t('istock_library_title')}
            className="btn-press w-[34px] h-[34px] rounded-lg border border-border bg-card flex items-center justify-center text-text2 hover:bg-bg"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            title={groqTitle}
            className="btn-press relative w-[34px] h-[34px] rounded-lg border border-border bg-card flex items-center justify-center text-text2 hover:bg-bg"
          >
            <span className={`absolute -top-0.5 -right-0.5 w-[9px] h-[9px] rounded-full border-2 border-card ${groqDot}`} />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H8a1.7 1.7 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V8a1.7 1.7 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
}

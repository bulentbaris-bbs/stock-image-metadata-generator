import { MAX_GROQ_KEYS, getActiveGroqKeys } from '../lib/storage';
import { useApp } from '../state/AppContext';

export function Toolbar({
  onGenerate,
  generating,
  generatingProgress,
  onRefreshTitleOnly,
  refreshingTitle,
  onOpenIStock,
  onOpenSettings,
}: {
  onGenerate: () => void;
  generating: boolean;
  generatingProgress: { current: number; total: number } | null;
  onRefreshTitleOnly: () => void;
  refreshingTitle: boolean;
  onOpenIStock: () => void;
  onOpenSettings: () => void;
}) {
  const { hint, setHint, settings } = useApp();
  const progressLabel = generating && generatingProgress ? ` ${generatingProgress.current}/${generatingProgress.total}` : '';
  const activeKeys = getActiveGroqKeys(settings).length;
  const geminiSet = !!settings.gemini_api_key?.trim();
  const groqDot = activeKeys > 0 ? 'bg-green' : geminiSet ? 'bg-[#E8A317]' : 'bg-red';
  const groqTitle = `Groq · anahtar ${activeKeys}/${MAX_GROQ_KEYS} aktif${geminiSet ? ' · Gemini yedek aktif' : ''}`;

  return (
    <header className="bg-card border-b border-borderSoft shrink-0 flex items-center justify-between px-[22px] py-[15px] gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[560px] bg-bgSidebar border border-border rounded-md px-3 h-[34px]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text3 shrink-0"><rect x="4" y="4" width="16" height="16" rx="2" /><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="13" y2="13" /></svg>
        <input
          type="text"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="Bu görsele özel not — sıradaki dosyada otomatik temizlenir"
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
          {refreshingTitle ? 'Yenileniyor…' : 'Sadece başlığı yenile'}
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          title="⌘↵"
          className="btn-press flex items-center gap-1.5 h-[34px] px-3.5 rounded-[9px] bg-accent hover:bg-accentH text-white text-[13px] font-medium disabled:opacity-50"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>
          {generating ? `Üretiliyor…${progressLabel}` : 'Üret'}
        </button>
        <div className="flex items-center gap-1 h-[34px] px-2.5 border border-border rounded-lg bg-card text-text2 text-[12.5px] font-medium" title="Çeviri dili">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a13 13 0 0 1 0 18a13 13 0 0 1 0-18z" /></svg>
          <span>TR</span>
        </div>
        <button
          type="button"
          onClick={onOpenIStock}
          title="iStock kütüphanesi"
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
    </header>
  );
}

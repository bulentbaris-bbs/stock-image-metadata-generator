import { useEffect, useState } from 'react';

import { useT } from '../lib/useT';
import { MAX_GROQ_KEYS } from '../lib/storage';
import { useApp } from '../state/AppContext';

function padKeys(keys: string[]): string[] {
  const next = [...keys];
  while (next.length < MAX_GROQ_KEYS) next.push('');
  return next.slice(0, MAX_GROQ_KEYS);
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, saveSettings } = useApp();
  const t = useT();
  const [groqKeys, setGroqKeys] = useState<string[]>(() => padKeys([]));
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [epId, setEpId] = useState('');
  const [epSecret, setEpSecret] = useState('');
  useEffect(() => {
    if (open) {
      setGroqKeys(padKeys(settings.groq_api_keys));
      setOpenRouterKey(settings.openrouter_api_key);
      setEpId(settings.everypixels_id);
      setEpSecret(settings.everypixels_secret);
    }
  }, [open, settings]);
  const setOneGroqKey = (i: number, v: string) => {
    const next = [...groqKeys];
    next[i] = v;
    setGroqKeys(next);
  };
  const handleSave = () => {
    saveSettings({
      ...settings,
      groq_api_keys: groqKeys.map((k) => k.trim()).filter(Boolean),
      openrouter_api_key: openRouterKey.trim(),
      everypixels_id: epId.trim(),
      everypixels_secret: epSecret.trim(),
    });
    onClose();
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border p-6 w-[560px] max-w-[90vw] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-text font-bold text-lg mb-4">{t('settings_title')}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-text2 text-sm block mb-1">
              {t('groq_keys_label')} <span className="text-text3">{t('groq_keys_hint')}</span>
            </label>
            <div className="space-y-2">
              {groqKeys.map((k, i) => (
                <input
                  key={i}
                  type="password"
                  value={k}
                  onChange={(e) => setOneGroqKey(i, e.target.value)}
                  placeholder={`${t('groq_key_placeholder', { n: i + 1 })}${i === 0 ? '' : ` ${t('optional_suffix')}`}`}
                  className="w-full h-9 rounded-lg bg-input border border-border text-text text-sm px-3 outline-none focus:ring-1 focus:ring-accent"
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-text2 w-48 text-sm shrink-0">{t('openrouter_label')} <span className="text-text3">{t('openrouter_hint')}</span></label>
            <input type="password" value={openRouterKey} onChange={(e) => setOpenRouterKey(e.target.value)} placeholder={t('openrouter_placeholder')} className="flex-1 h-9 rounded-lg bg-input border border-border text-text text-sm px-3 outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div className="flex items-center gap-3"><label className="text-text2 w-48 text-sm shrink-0">{t('ep_id_label')}</label><input type="text" value={epId} onChange={(e) => setEpId(e.target.value)} className="flex-1 h-9 rounded-lg bg-input border border-border text-text text-sm px-3 outline-none focus:ring-1 focus:ring-accent" /></div>
          <div className="flex items-center gap-3"><label className="text-text2 w-48 text-sm shrink-0">{t('ep_secret_label')}</label><input type="password" value={epSecret} onChange={(e) => setEpSecret(e.target.value)} placeholder="••••••••" className="flex-1 h-9 rounded-lg bg-input border border-border text-text text-sm px-3 outline-none focus:ring-1 focus:ring-accent" /></div>
        </div>
        <button type="button" onClick={handleSave} className="btn-press mt-4 w-full h-9 rounded-lg bg-accent hover:bg-accentH text-white font-semibold">{t('save_btn')}</button>
      </div>
    </div>
  );
}

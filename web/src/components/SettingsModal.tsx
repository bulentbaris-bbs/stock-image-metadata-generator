import { useEffect, useState } from 'react';

import { useT } from '../lib/useT';
import { MAX_GROQ_KEYS_PER_GROUP } from '../lib/storage';
import { useApp } from '../state/AppContext';

function padKeys(keys: string[]): string[] {
  const next = [...keys];
  while (next.length < MAX_GROQ_KEYS_PER_GROUP) next.push('');
  return next.slice(0, MAX_GROQ_KEYS_PER_GROUP);
}

/** Small (?) icon that reveals an explanation tooltip on hover. */
function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex items-center ml-1 align-middle">
      <span className="w-3.5 h-3.5 rounded-full border border-border text-text3 text-[9px] leading-[13px] text-center cursor-help select-none">?</span>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-56 rounded-lg bg-text text-bg text-[11px] leading-snug px-2.5 py-1.5 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-100 z-10">
        {text}
      </span>
    </span>
  );
}

function FieldLabel({ children, tip }: { children: React.ReactNode; tip: string }) {
  return (
    <span className="inline-flex items-center">
      {children}
      <InfoTip text={tip} />
    </span>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, saveSettings } = useApp();
  const t = useT();
  const [metaKeys, setMetaKeys] = useState<string[]>(() => padKeys([]));
  const [kwKeys, setKwKeys] = useState<string[]>(() => padKeys([]));
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [epId, setEpId] = useState('');
  const [epSecret, setEpSecret] = useState('');
  useEffect(() => {
    if (open) {
      setMetaKeys(padKeys(settings.groq_api_keys_meta));
      setKwKeys(padKeys(settings.groq_api_keys_keywords));
      setOpenRouterKey(settings.openrouter_api_key);
      setEpId(settings.everypixels_id);
      setEpSecret(settings.everypixels_secret);
    }
  }, [open, settings]);
  const setOneMetaKey = (i: number, v: string) => {
    const next = [...metaKeys];
    next[i] = v;
    setMetaKeys(next);
  };
  const setOneKwKey = (i: number, v: string) => {
    const next = [...kwKeys];
    next[i] = v;
    setKwKeys(next);
  };
  const handleSave = () => {
    saveSettings({
      ...settings,
      groq_api_keys_meta: metaKeys.map((k) => k.trim()).filter(Boolean),
      groq_api_keys_keywords: kwKeys.map((k) => k.trim()).filter(Boolean),
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

        <div className="space-y-4">
          <div className="border border-border rounded-lg p-3.5">
            <h3 className="text-text font-semibold text-sm mb-3">{t('settings_group_meta_title')}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-text2 text-sm block mb-1">
                  <FieldLabel tip={t('groq_primary_key_meta_tip')}>{t('groq_primary_key_label')}</FieldLabel>
                </label>
                <input
                  type="password"
                  value={metaKeys[0] ?? ''}
                  onChange={(e) => setOneMetaKey(0, e.target.value)}
                  placeholder={t('groq_primary_key_placeholder')}
                  className="w-full h-9 rounded-lg bg-input border border-border text-text text-sm px-3 outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-text2 text-sm block mb-1">
                  <FieldLabel tip={t('groq_fallback_key_tip')}>{t('groq_fallback_key_label')}</FieldLabel>
                </label>
                <input
                  type="password"
                  value={metaKeys[1] ?? ''}
                  onChange={(e) => setOneMetaKey(1, e.target.value)}
                  placeholder={t('groq_fallback_key_placeholder')}
                  className="w-full h-9 rounded-lg bg-input border border-border text-text text-sm px-3 outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-text2 text-sm block mb-1">
                  <FieldLabel tip={t('openrouter_group_tip')}>{t('openrouter_label')}</FieldLabel>
                </label>
                <input
                  type="password"
                  value={openRouterKey}
                  onChange={(e) => setOpenRouterKey(e.target.value)}
                  placeholder={t('openrouter_placeholder')}
                  className="w-full h-9 rounded-lg bg-input border border-border text-text text-sm px-3 outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          <div className="border border-border rounded-lg p-3.5">
            <h3 className="text-text font-semibold text-sm mb-3">{t('settings_group_keywords_title')}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-text2 text-sm block mb-1">
                  <FieldLabel tip={t('ep_id_tip')}>{t('ep_id_label')}</FieldLabel>
                </label>
                <input
                  type="text"
                  value={epId}
                  onChange={(e) => setEpId(e.target.value)}
                  className="w-full h-9 rounded-lg bg-input border border-border text-text text-sm px-3 outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-text2 text-sm block mb-1">
                  <FieldLabel tip={t('ep_secret_tip')}>{t('ep_secret_label')}</FieldLabel>
                </label>
                <input
                  type="password"
                  value={epSecret}
                  onChange={(e) => setEpSecret(e.target.value)}
                  placeholder={t('ep_secret_placeholder')}
                  className="w-full h-9 rounded-lg bg-input border border-border text-text text-sm px-3 outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-text2 text-sm block mb-1">
                  <FieldLabel tip={t('groq_primary_key_keywords_tip')}>{t('groq_primary_key_label')}</FieldLabel>
                </label>
                <input
                  type="password"
                  value={kwKeys[0] ?? ''}
                  onChange={(e) => setOneKwKey(0, e.target.value)}
                  placeholder={t('groq_primary_key_placeholder')}
                  className="w-full h-9 rounded-lg bg-input border border-border text-text text-sm px-3 outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-text2 text-sm block mb-1">
                  <FieldLabel tip={t('groq_fallback_key_tip')}>{t('groq_fallback_key_label')}</FieldLabel>
                </label>
                <input
                  type="password"
                  value={kwKeys[1] ?? ''}
                  onChange={(e) => setOneKwKey(1, e.target.value)}
                  placeholder={t('groq_fallback_key_placeholder')}
                  className="w-full h-9 rounded-lg bg-input border border-border text-text text-sm px-3 outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        </div>

        <button type="button" onClick={handleSave} className="btn-press mt-4 w-full h-9 rounded-lg bg-accent hover:bg-accentH text-white font-semibold">{t('save_btn')}</button>
      </div>
    </div>
  );
}

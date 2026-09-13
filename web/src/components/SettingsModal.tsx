import { useEffect, useState } from 'react';

import { useT } from '../lib/useT';
import { useApp } from '../state/AppContext';

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
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [epId, setEpId] = useState('');
  const [epSecret, setEpSecret] = useState('');
  useEffect(() => {
    if (open) {
      setGeminiKey(settings.gemini_api_key ?? '');
      setGroqKey(settings.groq_api_keys_meta?.[0] ?? '');
      setEpId(settings.everypixels_id ?? '');
      setEpSecret(settings.everypixels_secret ?? '');
    }
  }, [open, settings]);
  const handleSave = () => {
    if (!geminiKey.trim()) {
      alert(t('gemini_key_required_alert'));
      return;
    }
    saveSettings({
      ...settings,
      gemini_api_key: geminiKey.trim(),
      groq_api_keys_meta: [groqKey.trim()].filter(Boolean),
      groq_api_keys_keywords: [groqKey.trim()].filter(Boolean),
      everypixels_id: epId.trim(),
      everypixels_secret: epSecret.trim(),
      openrouter_api_key: '',
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
                  <FieldLabel tip={t('gemini_key_tip')}>{t('gemini_key_label')}</FieldLabel>
                  <span className="text-red-500"> *</span>
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder={t('gemini_key_placeholder')}
                  className="w-full h-9 rounded-lg bg-input border border-border text-text text-sm px-3 outline-none focus:ring-1 focus:ring-accent"
                />
                <p className="text-[11px] text-red-400 mt-1">{t('gemini_key_required_note')}</p>
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
            </div>
          </div>

          <div className="border border-border rounded-lg p-3.5">
            <h3 className="text-text font-semibold text-sm mb-3">{t('settings_group_translate_title')}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-text2 text-sm block mb-1">
                  <FieldLabel tip={t('groq_translate_key_tip')}>{t('groq_primary_key_label')}</FieldLabel>
                </label>
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder={t('groq_primary_key_placeholder')}
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

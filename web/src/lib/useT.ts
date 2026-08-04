import { isUILang, translate, type UILang } from './i18n';
import { useApp } from '../state/AppContext';

/** Bound to the app's current secondary/UI language (falls back to Turkish). Component-only — pulls from AppContext. */
export function useT() {
  const { settings } = useApp();
  const lang: UILang = isUILang(settings.target_language) ? settings.target_language : 'tr';
  return (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, lang, vars);
}

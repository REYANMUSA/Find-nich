import { useState, useEffect } from 'react';
import { SiteSettings, ThemeId } from '../types/index.ts';

const SETTINGS_STORAGE_KEY = 'fn_site_settings';

export const DEFAULT_SETTINGS: SiteSettings = {
  logo_name: 'Find Niche',
  tagline: 'Better Products. Smarter Choices.',
  hero_headline: 'Curated Tech Essentials. Tested Without Bias.',
  hero_subheadline: 'Handpicked EDC, minimalist desk setups, and everyday tech gear with genuine editorial notes and direct Amazon access.',
  announcement: '',
  admin_theme: 'helios',
  public_theme: 'helios',
  apply_to_public: false,
};

let cachedSettings: SiteSettings = (() => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
})();

const listeners = new Set<(settings: SiteSettings) => void>();

function notify(settings: SiteSettings) {
  cachedSettings = settings;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // fallback
  }
  listeners.forEach((fn) => fn(settings));
}

export function getCachedSettings(): SiteSettings {
  return cachedSettings;
}

export function updateCachedSettings(updates: Partial<SiteSettings>): SiteSettings {
  const next = { ...cachedSettings, ...updates };
  notify(next);
  return next;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings);

  useEffect(() => {
    listeners.add(setSettings);
    // Fetch fresh settings from server quietly on mount
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.settings) {
          updateCachedSettings(data.settings);
        }
      })
      .catch(() => {
        // use local cache
      });

    return () => {
      listeners.delete(setSettings);
    };
  }, []);

  const setLogoName = (name: string) => updateCachedSettings({ logo_name: name });
  const setTagline = (tagline: string) => updateCachedSettings({ tagline });
  const setAdminTheme = (theme: ThemeId) => updateCachedSettings({ admin_theme: theme });
  const setPublicTheme = (theme: ThemeId) => updateCachedSettings({ public_theme: theme });
  const setApplyToPublic = (apply: boolean) => updateCachedSettings({ apply_to_public: apply });

  return {
    settings,
    setLogoName,
    setTagline,
    setAdminTheme,
    setPublicTheme,
    setApplyToPublic,
  };
}

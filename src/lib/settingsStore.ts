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
  apply_to_public: true,
  owner_name: 'Rayan Musa',
  social_instagram: '',
  social_tiktok: '',
  social_youtube: '',
  social_x: '',
  social_snapchat: '',
  social_facebook: '',
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
let inflightSettingsFetch: Promise<SiteSettings | null> | null = null;
let lastFetchedAt = 0;

function notify(settings: SiteSettings) {
  if (JSON.stringify(cachedSettings) === JSON.stringify(settings)) {
    return;
  }
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

export async function refreshSettingsFromServer(force = false): Promise<SiteSettings | null> {
  const now = Date.now();
  if (!force && lastFetchedAt > 0 && now - lastFetchedAt < 15000) {
    return cachedSettings;
  }
  if (inflightSettingsFetch) {
    return inflightSettingsFetch;
  }

  inflightSettingsFetch = (async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data && data.settings) {
          lastFetchedAt = Date.now();
          return updateCachedSettings(data.settings);
        }
      }
    } catch {
      // fallback to cache
    } finally {
      inflightSettingsFetch = null;
    }
    return null;
  })();

  return inflightSettingsFetch;
}

export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'x' | 'snapchat' | 'facebook';

/**
 * Ensures any configured social handle or partial domain always resolves to a valid HTTPS external URL,
 * preventing broken relative routing if a username or domain was entered without https://.
 */
export function sanitizeSocialUrl(platform: SocialPlatform, rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const clean = trimmed.replace(/^@+/, '').trim();
  if (!clean) return '';

  switch (platform) {
    case 'instagram':
      return `https://www.instagram.com/${clean.replace(/^(www\.)?instagram\.com\//i, '')}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${clean.replace(/^(www\.)?tiktok\.com\/@?/i, '')}`;
    case 'youtube': {
      const ytClean = clean.replace(/^(www\.)?youtube\.com\//i, '');
      return `https://www.youtube.com/${ytClean.startsWith('@') ? ytClean : '@' + ytClean}`;
    }
    case 'x':
      return `https://x.com/${clean.replace(/^(www\.)?(twitter|x)\.com\//i, '')}`;
    case 'snapchat':
      return `https://www.snapchat.com/add/${clean.replace(/^(www\.)?snapchat\.com\/add\//i, '')}`;
    case 'facebook':
      return `https://www.facebook.com/${clean.replace(/^(www\.)?facebook\.com\//i, '')}`;
    default:
      return `https://${clean}`;
  }
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings);

  useEffect(() => {
    listeners.add(setSettings);
    refreshSettingsFromServer().then((fresh) => {
      if (fresh) {
        setSettings((prev) => (JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh));
      }
    });

    return () => {
      listeners.delete(setSettings);
    };
  }, []);

  const setLogoName = (name: string) => updateCachedSettings({ logo_name: name });
  const setTagline = (tagline: string) => updateCachedSettings({ tagline });
  const setAdminTheme = (theme: ThemeId) => {
    if (theme === 'manasa') {
      // Manasa is a public storefront editorial theme; keep admin UI untouched
      return updateCachedSettings({ public_theme: 'manasa' });
    }
    return updateCachedSettings({ admin_theme: theme, public_theme: theme, apply_to_public: true });
  };
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

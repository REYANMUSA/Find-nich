import { ThemeId } from '../types/index.ts';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  isDark: boolean;
  swatch: {
    bg: string;
    card: string;
    accent: string;
    border: string;
  };
  // CSS styles
  classes: {
    bgApp: string;
    bgCard: string;
    bgCardSubtle: string;
    bgCardHover: string;
    borderCard: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accentBg: string;
    accentHover: string;
    accentText: string;
    accentBorder: string;
    accentSubtleBg: string;
    accentGlow: string;
    navActive: string;
    inputBg: string;
    inputBorder: string;
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  helios: {
    id: 'helios',
    name: 'Helios Obsidian',
    tagline: 'Deep obsidian canvas with luminous violet neon glow (inspired by dashboard UI)',
    isDark: true,
    swatch: {
      bg: '#0B0D14',
      card: '#131722',
      accent: '#8B5CF6',
      border: '#272B3F',
    },
    classes: {
      bgApp: 'bg-[#0B0D14] text-zinc-100',
      bgCard: 'bg-[#131722]/90 backdrop-blur-md',
      bgCardSubtle: 'bg-[#181D2C]',
      bgCardHover: 'hover:bg-[#1C2133]',
      borderCard: 'border-[#272B3F]',
      textPrimary: 'text-white',
      textSecondary: 'text-zinc-300',
      textMuted: 'text-zinc-400',
      accentBg: 'bg-gradient-to-r from-violet-600 to-indigo-600',
      accentHover: 'hover:from-violet-500 hover:to-indigo-500',
      accentText: 'text-violet-400',
      accentBorder: 'border-violet-500/40',
      accentSubtleBg: 'bg-violet-950/40 text-violet-300 border border-violet-800/40',
      accentGlow: 'shadow-[0_0_25px_rgba(139,92,246,0.35)]',
      navActive: 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]',
      inputBg: 'bg-[#0E101A]',
      inputBorder: 'border-[#272B3F] focus:border-violet-500 focus:ring-violet-500/20',
    },
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Luxe',
    tagline: 'Signature deep night forest with vibrant mint highlights',
    isDark: true,
    swatch: {
      bg: '#08120C',
      card: '#0F2418',
      accent: '#10B981',
      border: '#1A3E2A',
    },
    classes: {
      bgApp: 'bg-[#08120C] text-zinc-100',
      bgCard: 'bg-[#0F2418]/90 backdrop-blur-md',
      bgCardSubtle: 'bg-[#143021]',
      bgCardHover: 'hover:bg-[#183928]',
      borderCard: 'border-[#1A3E2A]',
      textPrimary: 'text-white',
      textSecondary: 'text-zinc-300',
      textMuted: 'text-zinc-400',
      accentBg: 'bg-emerald-600',
      accentHover: 'hover:bg-emerald-500',
      accentText: 'text-emerald-400',
      accentBorder: 'border-emerald-500/40',
      accentSubtleBg: 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40',
      accentGlow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
      navActive: 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]',
      inputBg: 'bg-[#0B1A11]',
      inputBorder: 'border-[#1A3E2A] focus:border-emerald-500 focus:ring-emerald-500/20',
    },
  },
  cyber: {
    id: 'cyber',
    name: 'Neo-Cyber Cyan',
    tagline: 'High-tech dark terminal with electric cyan and cobalt accents',
    isDark: true,
    swatch: {
      bg: '#080C14',
      card: '#0E1726',
      accent: '#06B6D4',
      border: '#1B2C46',
    },
    classes: {
      bgApp: 'bg-[#080C14] text-zinc-100',
      bgCard: 'bg-[#0E1726]/90 backdrop-blur-md',
      bgCardSubtle: 'bg-[#132035]',
      bgCardHover: 'hover:bg-[#182740]',
      borderCard: 'border-[#1B2C46]',
      textPrimary: 'text-white',
      textSecondary: 'text-zinc-300',
      textMuted: 'text-zinc-400',
      accentBg: 'bg-cyan-500',
      accentHover: 'hover:bg-cyan-400',
      accentText: 'text-cyan-400',
      accentBorder: 'border-cyan-500/40',
      accentSubtleBg: 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/40',
      accentGlow: 'shadow-[0_0_20px_rgba(6,182,212,0.35)]',
      navActive: 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)]',
      inputBg: 'bg-[#0B1220]',
      inputBorder: 'border-[#1B2C46] focus:border-cyan-500 focus:ring-cyan-500/20',
    },
  },
  amber: {
    id: 'amber',
    name: 'Sunset Amber',
    tagline: 'Warm dark roast espresso with rich honey and copper glows',
    isDark: true,
    swatch: {
      bg: '#120D0B',
      card: '#1E1613',
      accent: '#F59E0B',
      border: '#382822',
    },
    classes: {
      bgApp: 'bg-[#120D0B] text-zinc-100',
      bgCard: 'bg-[#1E1613]/90 backdrop-blur-md',
      bgCardSubtle: 'bg-[#291F1A]',
      bgCardHover: 'hover:bg-[#332620]',
      borderCard: 'border-[#382822]',
      textPrimary: 'text-white',
      textSecondary: 'text-amber-100/90',
      textMuted: 'text-amber-200/60',
      accentBg: 'bg-amber-500',
      accentHover: 'hover:bg-amber-400',
      accentText: 'text-amber-400',
      accentBorder: 'border-amber-500/40',
      accentSubtleBg: 'bg-amber-950/40 text-amber-300 border border-amber-800/40',
      accentGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
      navActive: 'bg-amber-500 text-zinc-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)]',
      inputBg: 'bg-[#18110E]',
      inputBorder: 'border-[#382822] focus:border-amber-500 focus:ring-amber-500/20',
    },
  },
  amethyst: {
    id: 'amethyst',
    name: 'Royal Amethyst',
    tagline: 'Deep galactic velvet purple with radiant fuchsia accents',
    isDark: true,
    swatch: {
      bg: '#0E0818',
      card: '#1A112B',
      accent: '#D946EF',
      border: '#311E4E',
    },
    classes: {
      bgApp: 'bg-[#0E0818] text-zinc-100',
      bgCard: 'bg-[#1A112B]/90 backdrop-blur-md',
      bgCardSubtle: 'bg-[#24173D]',
      bgCardHover: 'hover:bg-[#2C1D4A]',
      borderCard: 'border-[#311E4E]',
      textPrimary: 'text-white',
      textSecondary: 'text-zinc-300',
      textMuted: 'text-zinc-400',
      accentBg: 'bg-fuchsia-600',
      accentHover: 'hover:bg-fuchsia-500',
      accentText: 'text-fuchsia-400',
      accentBorder: 'border-fuchsia-500/40',
      accentSubtleBg: 'bg-fuchsia-950/40 text-fuchsia-300 border border-fuchsia-800/40',
      accentGlow: 'shadow-[0_0_20px_rgba(217,70,239,0.35)]',
      navActive: 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.5)]',
      inputBg: 'bg-[#140C22]',
      inputBorder: 'border-[#311E4E] focus:border-fuchsia-500 focus:ring-fuchsia-500/20',
    },
  },
  slate: {
    id: 'slate',
    name: 'Nordic Slate',
    tagline: 'Minimalist Scandinavian matte charcoal and crisp monochrome precision',
    isDark: true,
    swatch: {
      bg: '#121316',
      card: '#1C1D22',
      accent: '#E4E4E7',
      border: '#2C2D35',
    },
    classes: {
      bgApp: 'bg-[#121316] text-zinc-100',
      bgCard: 'bg-[#1C1D22]/90 backdrop-blur-md',
      bgCardSubtle: 'bg-[#25262E]',
      bgCardHover: 'hover:bg-[#2E2F38]',
      borderCard: 'border-[#2C2D35]',
      textPrimary: 'text-white',
      textSecondary: 'text-zinc-300',
      textMuted: 'text-zinc-400',
      accentBg: 'bg-zinc-100 text-zinc-950',
      accentHover: 'hover:bg-white',
      accentText: 'text-zinc-200',
      accentBorder: 'border-zinc-500/40',
      accentSubtleBg: 'bg-zinc-800/60 text-zinc-200 border border-zinc-700/60',
      accentGlow: 'shadow-[0_0_20px_rgba(255,255,255,0.15)]',
      navActive: 'bg-white text-zinc-950 font-bold',
      inputBg: 'bg-[#17181D]',
      inputBorder: 'border-[#2C2D35] focus:border-zinc-400 focus:ring-zinc-400/20',
    },
  },
  titanium: {
    id: 'titanium',
    name: 'Titanium Light',
    tagline: 'Clean architectural snow white canvas with deep slate contrast',
    isDark: false,
    swatch: {
      bg: '#F8FAFC',
      card: '#FFFFFF',
      accent: '#2563EB',
      border: '#E2E8F0',
    },
    classes: {
      bgApp: 'bg-[#F8FAFC] text-slate-900',
      bgCard: 'bg-white',
      bgCardSubtle: 'bg-slate-50',
      bgCardHover: 'hover:bg-slate-100/70',
      borderCard: 'border-slate-200 shadow-xs',
      textPrimary: 'text-slate-950',
      textSecondary: 'text-slate-700',
      textMuted: 'text-slate-500',
      accentBg: 'bg-blue-600',
      accentHover: 'hover:bg-blue-700',
      accentText: 'text-blue-600',
      accentBorder: 'border-blue-500/40',
      accentSubtleBg: 'bg-blue-50 text-blue-700 border border-blue-200',
      accentGlow: 'shadow-[0_0_20px_rgba(37,99,235,0.2)]',
      navActive: 'bg-slate-900 text-white',
      inputBg: 'bg-white',
      inputBorder: 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20',
    },
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Stealth',
    tagline: 'Aggressive carbon black canvas with vivid ruby laser glow',
    isDark: true,
    swatch: {
      bg: '#11090A',
      card: '#1D1012',
      accent: '#EF4444',
      border: '#3A1E22',
    },
    classes: {
      bgApp: 'bg-[#11090A] text-zinc-100',
      bgCard: 'bg-[#1D1012]/90 backdrop-blur-md',
      bgCardSubtle: 'bg-[#2A1619]',
      bgCardHover: 'hover:bg-[#351C20]',
      borderCard: 'border-[#3A1E22]',
      textPrimary: 'text-white',
      textSecondary: 'text-zinc-300',
      textMuted: 'text-zinc-400',
      accentBg: 'bg-rose-600',
      accentHover: 'hover:bg-rose-500',
      accentText: 'text-rose-400',
      accentBorder: 'border-rose-500/40',
      accentSubtleBg: 'bg-rose-950/40 text-rose-300 border border-rose-800/40',
      accentGlow: 'shadow-[0_0_20px_rgba(239,68,68,0.35)]',
      navActive: 'bg-rose-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]',
      inputBg: 'bg-[#160B0D]',
      inputBorder: 'border-[#3A1E22] focus:border-rose-500 focus:ring-rose-500/20',
    },
  },
};

export const THEME_LIST = Object.values(THEMES);

export function getTheme(id?: string | null): ThemeConfig {
  if (id && id in THEMES) {
    return THEMES[id as ThemeId];
  }
  return THEMES.helios; // Default to Helios (the user's inspiration)
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';
import { Uniwind } from 'uniwind';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Semantic palette shape shared by light and dark themes. */
export interface Palette {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  muted: string;
  faint: string;
  ink: string;
  accentText: string;
  destructive: string;
  success: string;
}

/** Light theme — warm industrial minimal (TRAKL spec). */
export const LIGHT: Palette = {
  bg: '#F7F5F0',
  surface: '#FFFFFF',
  surface2: '#F0EDE8',
  border: '#E5E1DA',
  text: '#141210',
  muted: '#8A8480',
  faint: '#C5C0BA',
  ink: '#1A1A1A',
  accentText: '#F7F5F0',
  destructive: '#C0392B',
  success: '#2D7A4F',
};

/** Dark theme — near-black warm surfaces, light ink CTA. */
export const DARK: Palette = {
  bg: '#141210',
  surface: '#1E1C19',
  surface2: '#27241F',
  border: '#34302A',
  text: '#F2EFE9',
  muted: '#9A938C',
  faint: '#5C564F',
  ink: '#F2EFE9',
  accentText: '#141210',
  destructive: '#E0614F',
  success: '#4FA877',
};

/** Tracker accent colors per mode — dark mode lightens ~20% for contrast. */
export const TRACKER_ACCENTS = {
  light: {
    finance: '#B8860B',
    habits: '#2D7A4F',
    tasks: '#2C5F8A',
    goals: '#6B4C8A',
    planner: '#8A4A2F',
    sleep: '#3A5A8A',
    fitness: '#8A3A3A',
    mood: '#C77D3A',
    water: '#2F8FA8',
    weight: '#5A7A4A',
    meditation: '#7A6AA8',
    custom: '#4A4A4A',
  },
  dark: {
    finance: '#D9A93A',
    habits: '#4FA877',
    tasks: '#5A8FBE',
    goals: '#9B7CC0',
    planner: '#C0764F',
    sleep: '#6A8AC0',
    fitness: '#C06A6A',
    mood: '#E0A063',
    water: '#5AB4CC',
    weight: '#85A876',
    meditation: '#A593CC',
    custom: '#8A8A8A',
  },
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedScheme = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  /** OS-reported scheme, kept in sync via Appearance listener. */
  systemScheme: ResolvedScheme;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  setSystemScheme: (scheme: ColorSchemeName) => void;
}

const normalize = (scheme: ColorSchemeName): ResolvedScheme =>
  scheme === 'dark' ? 'dark' : 'light';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      systemScheme: normalize(Appearance.getColorScheme()),
      hydrated: false,
      setMode: (mode) => set({ mode }),
      setSystemScheme: (scheme) => set({ systemScheme: normalize(scheme) }),
    }),
    {
      name: 'trakl-theme-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ mode: s.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/** Resolve the active scheme from mode + system preference. */
export function useResolvedScheme(): ResolvedScheme {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useThemeStore((s) => s.systemScheme);
  return mode === 'system' ? systemScheme : mode;
}

/** Active semantic palette — reactive to theme mode. */
export function useColors(): Palette {
  const scheme = useResolvedScheme();
  return scheme === 'dark' ? DARK : LIGHT;
}

/** Active tracker accent map — reactive to theme mode. */
export function useTrackerAccents() {
  const scheme = useResolvedScheme();
  return TRACKER_ACCENTS[scheme];
}

/**
 * Keep Uniwind's className theme + Appearance listener in sync.
 * Mount once at the app root.
 */
export function useThemeSync() {
  const scheme = useResolvedScheme();
  const setSystemScheme = useThemeStore((s) => s.setSystemScheme);

  useEffect(() => {
    Uniwind.setTheme(scheme);
  }, [scheme]);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, [setSystemScheme]);
}

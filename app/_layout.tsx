// oxlint-disable-next-line eslint-plugin-import/no-unassigned-import
import '../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { useEffect, useState } from 'react';
import * as DevClient from 'expo-dev-client';
import { HeroUINativeProvider } from 'heroui-native';
import {
  ErrorBoundary as ExpoErrorBoundary,
  type ErrorBoundaryProps,
  SplashScreen,
  Stack,
} from 'expo-router';

import { initPostHog } from '@/lib/posthog';
import { reportErrorToParent } from '@/lib/reportPreviewError';
import { ClashDisplayFonts } from '@/lib/fonts';
import { useColors, useThemeSync } from '@/lib/theme';
import { useReminderSync } from '@/lib/useReminderSync';
import { initI18n } from '@/lib/i18n';

/**
 * Custom ErrorBoundary that reports React render errors to the parent window (Bilt preview iframe)
 * and then renders the default Expo error UI.
 */
function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    if (Platform.OS === 'web' && error) {
      const message = [error.message, error.stack].filter(Boolean).join('\n');
      reportErrorToParent(message);
    }
  }, [error]);
  return <ExpoErrorBoundary error={error} retry={retry} />;
}

export { ErrorBoundary };

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...ClashDisplayFonts,
  });

  useEffect(() => {
    void initI18n().then(() => setI18nReady(true));
  }, []);

  // Report uncaught JS errors and unhandled promise rejections to parent (Bilt preview iframe)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    const handleError = (event: ErrorEvent) => {
      const message = event.error?.stack ?? event.message ?? 'Unknown error';
      reportErrorToParent(message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      const message =
        err instanceof Error ? [err.message, err.stack].filter(Boolean).join('\n') : String(err);
      reportErrorToParent(message);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Inject Google Fonts link tag for web to ensure fonts load through proxy
  // Also register font family names as fallback if expo-font fails
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Check if link already exists
      const existingLink = document.querySelector(
        'link[href*="fonts.googleapis.com/css2?family=Inter"]',
      );

      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }

      const existingClash = document.querySelector('link[href*="api.fontshare.com"]');
      if (!existingClash) {
        const clash = document.createElement('link');
        clash.rel = 'stylesheet';
        clash.href =
          'https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap';
        document.head.appendChild(clash);
      }

      // Note: The @import in global.css and the link tag above ensure Inter font loads
      // expo-font will register the font family names (Inter_400Regular, etc.)
      // If expo-font fails due to proxy issues, the fonts should still be available
      // via the direct Google Fonts CDN link, though the specific font family names
      // might not be registered. The app should still render with Inter font.
    }
  }, []);

  useEffect(() => {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (__DEV__ && Platform.OS !== 'web' && !isExpoGo) {
      const timer = setTimeout(() => {
        DevClient.closeMenu();
        DevClient.hideMenu();
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      initPostHog();
    }
  }, []);

  useEffect(() => {
    if ((loaded || error) && i18nReady) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error, i18nReady]);

  if ((!loaded && !error) || !i18nReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <RootStack />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  useThemeSync();
  useReminderSync();
  const colors = useColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="tracker/finance" />
      <Stack.Screen name="tracker/habits" />
      <Stack.Screen name="tracker/tasks" />
      <Stack.Screen name="tracker/goals" />
      <Stack.Screen name="tracker/planner" />
      <Stack.Screen name="tracker/sleep" />
      <Stack.Screen name="tracker/fitness" />
      <Stack.Screen name="tracker/mood" />
      <Stack.Screen name="tracker/water" />
      <Stack.Screen name="tracker/weight" />
      <Stack.Screen name="tracker/meditation" />
      <Stack.Screen name="tracker/custom" />
      <Stack.Screen name="tracker/custom/[id]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="weekly-review" />
      <Stack.Screen name="search" />
      <Stack.Screen
        name="quick-add"
        options={{
          presentation: 'transparentModal',
          // Both platforms run the SAME in-route Reanimated slide + backdrop
          // fade (see app/quick-add.tsx), so the route animation is disabled on
          // both. Mixing a native modal slide on one platform and an in-route
          // slide on the other was the source of the divergent behaviour and
          // the Android close hang.
          animation: 'none',
          // CRITICAL: a transparentModal route still gets an OPAQUE WHITE scene
          // background by default on Android/web, which flashes in/out around
          // the in-route slide ("white background on open/close"). Force the
          // route's own background fully transparent so only our #000 backdrop
          // and the sheet surface are visible.
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
  );
}

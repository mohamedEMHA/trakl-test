import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  createAnimatedComponent,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { type Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Caption, ClashText, InterText } from '@/components/Typography';
import { PressableScale } from '@/components/PressableScale';
import {
  Activity,
  CheckSquare,
  Moon,
  Repeat2,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from '@/components/icons';
import type { LucideIcon } from 'lucide-react-native';
import type { ParseKeys } from 'i18next';
import { withAlpha } from '@/lib/trackers';
import { useColors, useTrackerAccents } from '@/lib/theme';

const AnimatedPressable = createAnimatedComponent(Pressable);
// Snappy open spring so Quick Add feels instant.
const OPEN_SPRING = { damping: 26, stiffness: 340, mass: 0.85 };
// Exit slide duration, used ONLY when dismissing back to the previous screen
// (cancel / backdrop / hardware back). Navigating to a tracker skips this and
// dispatches immediately so taps feel instant (see close()).
const CLOSE_DURATION = 220;
// The dark backdrop fades out FASTER than the slide so it never lingers on
// screen after the sheet has visually left — this was the "background is slow
// to close" bug.
const BACKDROP_FADE = 140;

type QuickItem = {
  key: 'expense' | 'income' | 'task' | 'habit' | 'sleep' | 'workout';
  icon: LucideIcon;
  accent: 'finance' | 'habits' | 'tasks' | 'sleep' | 'fitness';
  route: Href;
};

const ITEMS: QuickItem[] = [
  { key: 'expense', icon: TrendingDown, accent: 'finance', route: '/tracker/finance?add=expense' },
  { key: 'income', icon: TrendingUp, accent: 'habits', route: '/tracker/finance?add=income' },
  { key: 'task', icon: CheckSquare, accent: 'tasks', route: '/tracker/tasks?add=1' },
  { key: 'habit', icon: Repeat2, accent: 'habits', route: '/tracker/habits?add=1' },
  { key: 'sleep', icon: Moon, accent: 'sleep', route: '/tracker/sleep?add=1' },
  { key: 'workout', icon: Activity, accent: 'fitness', route: '/tracker/fitness?add=1' },
];

/**
 * Quick-add is itself a `transparentModal` route, so it renders its sheet
 * inline (its own backdrop + Reanimated slide) instead of opening a nested RN
 * `Modal`. A nested Modal inside a transparentModal route broke pointer events
 * on the web bundle the Bilt preview runs — the buttons stopped responding.
 */
export default function QuickAddScreen() {
  const router = useRouter();
  const colors = useColors();
  const accents = useTrackerAccents();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Every platform runs the SAME in-route slide so close behaves identically.
  // The route itself has `animation: 'none'` on both iOS and Android (see
  // app/_layout.tsx), so there's no competing native transition.
  const translateY = useSharedValue(screenHeight);
  const backdrop = useSharedValue(0);
  // Guards against double-dismiss: tapping a card + cancel (or fast double
  // taps) used to fire `close` multiple times -> multiple router.replace/back
  // calls, which makes navigation hang ("stuck on close").
  const closingRef = useRef(false);
  // Holds the pending navigation timer so it can be cleared on unmount.
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sheet has 20px horizontal padding (px-5) on each side and 12px gaps
  // between 3 columns -> compute exact column width so all 3 always fit.
  const HORIZONTAL_PADDING = 20;
  const GAP = 12;
  const COLUMNS = 3;
  const cardWidth = Math.floor(
    (screenWidth - HORIZONTAL_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS,
  );

  const close = useCallback(
    (route: Href | null) => {
      // Run exactly once — ignore any subsequent taps while dismissing so we
      // never dispatch a second navigation (the previous "stuck on close" bug
      // came from multiple dismisses racing each other).
      if (closingRef.current) return;
      closingRef.current = true;

      // CRITICAL distinction that fixes the "feels stuck on close" bug:
      //
      // - Navigating to a tracker (route != null): the user is going to ANOTHER
      //   screen, so the Quick Add sheet doesn't need to be watched sliding
      //   away. Dispatch the navigation IMMEDIATELY — waiting ~220ms for an
      //   exit slide before navigating is exactly what made every tap feel
      //   sluggish / "stuck". The destination screen covers the sheet instantly.
      //
      // - Dismissing back to the previous screen (route == null, i.e. cancel /
      //   backdrop tap / hardware back): here the user DOES see the sheet leave,
      //   so we play the slide-down + backdrop fade, then `router.back()` from a
      //   plain JS-thread timer (reliable — nothing drops it, unlike a
      //   Reanimated completion callback the unmounting route would swallow).
      if (route) {
        router.replace(route);
        return;
      }

      translateY.value = withTiming(screenHeight, {
        duration: CLOSE_DURATION,
        easing: Easing.in(Easing.cubic),
      });
      backdrop.value = withTiming(0, { duration: BACKDROP_FADE });

      dismissTimer.current = setTimeout(() => {
        router.back();
      }, CLOSE_DURATION);
    },
    [router, translateY, backdrop, screenHeight],
  );

  // Slide in on mount (identical on every platform).
  useEffect(() => {
    translateY.value = withSpring(0, OPEN_SPRING);
    backdrop.value = withTiming(1, { duration: 160 });
  }, [translateY, backdrop]);

  // Clear any pending dismiss timer if the screen unmounts first.
  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  // Android hardware back dismisses via the same close path.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close(null);
      return true;
    });
    return () => sub.remove();
  }, [close]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value * 0.4 }));
  const surfaceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const go = (route: Href) => close(route);

  return (
    <View style={styles.root}>
      <AnimatedPressable
        style={[styles.backdrop, backdropStyle]}
        onPress={() => close(null)}
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
      />
      <Animated.View style={[styles.surface, surfaceStyle]}>
        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingBottom: Math.max(insets.bottom, 12) + 24,
            width: '100%',
          }}
          className="px-5 pt-3"
        >
          <View className="items-center pb-4">
            <View
              style={{ width: 32, height: 4, borderRadius: 999, backgroundColor: colors.border }}
            />
          </View>
          <ClashText weight="medium" style={{ fontSize: 22 }}>
            {t('quickAdd.title')}
          </ClashText>
          <InterText color={colors.muted} style={{ fontSize: 14, marginTop: 2 }}>
            {t('quickAdd.subtitle')}
          </InterText>

          <View className="mt-4 flex-row flex-wrap" style={{ gap: 12 }}>
            {ITEMS.map((item) => {
              const Icon = item.icon;
              const accent = accents[item.accent];
              return (
                <PressableScale
                  feedback="card"
                  key={item.key}
                  onPress={() => go(item.route)}
                  style={{
                    width: cardWidth,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 16,
                    padding: 14,
                    gap: 12,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t(`quickAdd.${item.key}` as ParseKeys)}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: withAlpha(accent, 0.12),
                    }}
                    className="items-center justify-center"
                  >
                    <Icon size={20} color={accent} strokeWidth={1.5} />
                  </View>
                  <ClashText weight="medium" style={{ fontSize: 14 }}>
                    {t(`quickAdd.${item.key}` as ParseKeys)}
                  </ClashText>
                </PressableScale>
              );
            })}
          </View>

          <PressableScale
            feedback="card"
            onPress={() => go('/tracker/custom')}
            style={{
              marginTop: 12,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 14,
            }}
            className="flex-row items-center gap-3"
            accessibilityRole="button"
            accessibilityLabel={t('quickAdd.customEntry')}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: withAlpha(accents.custom, 0.12),
              }}
              className="items-center justify-center"
            >
              <SlidersHorizontal size={20} color={accents.custom} strokeWidth={1.5} />
            </View>
            <ClashText weight="medium" style={{ fontSize: 14 }}>
              {t('quickAdd.customEntry')}
            </ClashText>
          </PressableScale>

          <PressableScale
            feedback="chip"
            onPress={() => close(null)}
            className="mt-4 items-center py-2"
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          >
            <Caption color={colors.muted}>{t('common.cancel')}</Caption>
          </PressableScale>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 0,
  },
  surface: {
    width: '100%',
    zIndex: 1,
  },
});

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  type KeyboardEvent,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  createAnimatedComponent,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = createAnimatedComponent(Pressable);

// Keyboard lift is applied on the UI thread on BOTH iOS and Android. A React
// Native `Modal` renders into its OWN window which does NOT inherit the host
// activity's adjustResize behaviour, so the Modal window never resizes for the
// keyboard and the inputs get covered. We therefore track the keyboard height
// ourselves and drive the lift with a shared value.
//
// We use the imperative `Keyboard` event listeners (not `useAnimatedKeyboard`)
// because `useAnimatedKeyboard` attaches to the host window's inset listener,
// which is unreliable inside a separate Modal window on Android — the keyboard
// show/hide events were not being picked up consistently. `Keyboard.addListener`
// fires reliably from any window on both platforms.
const RN_KEYBOARD = Platform.OS !== 'web';
const IS_ANDROID = Platform.OS === 'android';
const IS_IOS = Platform.OS === 'ios';

/**
 * Motion variants tweak the open spring feel only.
 */
export type SheetMotion = 'spring' | 'glide' | 'pop';

type AnimatedSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Sheet body (already styled surface container). */
  children: ReactNode;
  /** Accessible label for the dismiss backdrop. */
  closeLabel?: string;
  /** Influences the open animation feel. */
  motion?: SheetMotion;
  /** Fired once the exit animation has fully completed and the sheet unmounts. */
  onClosed?: () => void;
};

// Snappy open spring per motion variant. Higher stiffness + critical-ish
// damping = fast settle with no wobble, so the sheet feels instant.
const OPEN_SPRING: Record<SheetMotion, { damping: number; stiffness: number; mass: number }> = {
  pop: { damping: 26, stiffness: 340, mass: 0.85 },
  glide: { damping: 30, stiffness: 300, mass: 0.9 },
  spring: { damping: 28, stiffness: 320, mass: 0.85 },
};

// Close is a short timing so dismissal feels immediate (no long tail).
const CLOSE_DURATION = 170;

/**
 * Hand-rolled bottom-sheet shell: a plain RN `Modal` + Reanimated slide +
 * UI-thread keyboard handling.
 *
 * Deliberately NOT `@gorhom/bottom-sheet` (it regressed on the web bundle that
 * the Bilt preview runs — inside the quick-add `transparentModal` route it
 * measured 0 height and showed a white screen).
 *
 * Keyboard handling — imperative `Keyboard` listeners, all native platforms
 * (`RN_KEYBOARD`):
 *
 *   - A React Native `Modal` renders into its own window which does NOT resize
 *     for the keyboard on either platform, so we always lift the sheet
 *     ourselves: the root container gets an animated `paddingBottom` equal to
 *     the live keyboard height AND the surface gets an animated `maxHeight` in
 *     the SAME worklet, so the sheet lifts above the keys and shrinks in the
 *     same frame (no one-frame "title pops off screen" race).
 *   - The keyboard height comes from `Keyboard.addListener` (keyboardWillShow/
 *     keyboardDidShow + Hide) mirrored into a shared value. `useAnimatedKeyboard`
 *     was unreliable inside the Modal's separate window on Android — the events
 *     never fired — so we switched to the imperative listeners which work from
 *     any window. iOS uses the `Will*` events (smooth, ahead of the keyboard),
 *     Android uses the `Did*` events (it has no `Will*` events).
 *   - On Android the reported keyboard end frame is measured from the screen
 *     bottom, so we subtract the bottom safe-area inset from the lift (the
 *     sheet's own content padding covers that gap) to avoid an oversized gap.
 *
 * The sheet body uses `flexShrink: 1` internally so when the surface maxHeight
 * shrinks on iOS, the scrollable content shrinks and the title/submit button
 * stay on screen.
 *
 * Motion:
 *   - Open uses a fast `withSpring` (snappy, settles instantly, no wobble).
 *   - Close uses a short `withTiming` so dismissal feels immediate.
 *   - `translateY` starts at the full window height (guaranteed hidden
 *     regardless of content height — no measurement race, no mid-flight jump).
 *
 * Public API is unchanged so all consumers (FormSheet, OptionSheet,
 * RowActionSheet, InfoSheet, ConfirmSheet) work untouched.
 */
export function AnimatedSheet({
  visible,
  onClose,
  children,
  closeLabel = 'Close',
  motion = 'spring',
  onClosed,
}: AnimatedSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const prevVisible = useRef(visible);

  const translateY = useSharedValue(screenHeight);
  const backdrop = useSharedValue(0);
  // Live keyboard height, mirrored from imperative Keyboard events. Animated on
  // the UI thread so the lift + shrink happen together with the keyboard.
  const kbHeight = useSharedValue(0);
  const spring = OPEN_SPRING[motion];

  const finishClose = useCallback(() => {
    setMounted(false);
    onClose();
    onClosed?.();
  }, [onClose, onClosed]);

  // Drive open/close directly off the `visible` prop transition. Opening sets
  // mounted synchronously and kicks the spring in the same commit, so there's
  // no extra render frame of lag before the slide starts.
  useEffect(() => {
    const was = prevVisible.current;
    prevVisible.current = visible;

    if (visible && !was) {
      // Open.
      setMounted(true);
      translateY.value = screenHeight;
      backdrop.value = withTiming(1, { duration: 160 });
      translateY.value = withSpring(0, spring);
    } else if (!visible && was) {
      // Close. Dismiss the keyboard and collapse the lift so the surface slides
      // straight down from its current position.
      if (RN_KEYBOARD) Keyboard.dismiss();
      kbHeight.value = withTiming(0, { duration: CLOSE_DURATION });
      backdrop.value = withTiming(0, { duration: CLOSE_DURATION });
      translateY.value = withTiming(screenHeight, { duration: CLOSE_DURATION }, (done) => {
        if (done) runOnJS(finishClose)();
      });
    } else if (visible && !mounted) {
      // Edge: became visible while still mounting (e.g. fast re-open).
      setMounted(true);
    }
  }, [visible, mounted, screenHeight, spring, translateY, backdrop, kbHeight, finishClose]);

  // Android hardware back closes the sheet.
  useEffect(() => {
    if (!mounted) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        onClose();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [mounted, visible, onClose]);

  // Track the keyboard height via imperative listeners and mirror it into the
  // shared value with a matching animation. iOS has Will* events (fire ahead of
  // the keyboard with a known duration); Android only has Did* events.
  useEffect(() => {
    if (!RN_KEYBOARD || !mounted) return undefined;

    const onShow = (e: KeyboardEvent) => {
      const h = e.endCoordinates?.height ?? 0;
      const duration = IS_IOS ? (e.duration ?? 250) : 0;
      kbHeight.value = duration > 0 ? withTiming(h, { duration }) : h;
    };
    const onHide = (e: KeyboardEvent) => {
      const duration = IS_IOS ? (e.duration ?? 250) : 0;
      kbHeight.value = duration > 0 ? withTiming(0, { duration }) : 0;
    };

    const showEvt = IS_IOS ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = IS_IOS ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, onShow);
    const hideSub = Keyboard.addListener(hideEvt, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [mounted, kbHeight]);

  // Container lifts above the keyboard via animated paddingBottom. On Android
  // the reported keyboard end frame reaches the screen bottom, so subtract the
  // bottom safe-area inset to avoid an oversized gap.
  const containerStyle = useAnimatedStyle(() => {
    if (!RN_KEYBOARD) return {};
    const kb = kbHeight.value;
    if (kb <= 0) return { paddingBottom: 0 };
    return { paddingBottom: IS_ANDROID ? Math.max(0, kb - insets.bottom) : kb };
  });
  const surfaceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    // Shrink the surface in the SAME worklet as the lift so the title/submit
    // never get pushed off-screen for a frame.
    ...(RN_KEYBOARD ? { maxHeight: screenHeight - kbHeight.value - insets.top - 8 } : {}),
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value * 0.4,
  }));

  if (!mounted) return null;

  return (
    <Modal transparent statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <AnimatedPressable
        style={[styles.backdrop, backdropStyle]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
      />
      <Animated.View style={[styles.root, containerStyle]} pointerEvents="box-none">
        <Animated.View style={[styles.surface, surfaceStyle]}>{children}</Animated.View>
      </Animated.View>
    </Modal>
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
    overflow: 'hidden',
    zIndex: 1,
  },
});

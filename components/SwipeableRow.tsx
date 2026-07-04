import { type ReactNode } from 'react';
import { Animated, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Check, Trash2 } from 'lucide-react-native';

import { useColors } from '@/lib/theme';
import { withAlpha } from '@/lib/trackers';
import { haptics } from '@/lib/haptics';
import { InterText } from './Typography';

type SwipeAction = {
  label: string;
  icon: 'trash' | 'check';
  color: string;
  onTrigger: () => void;
};

type Props = {
  children: ReactNode;
  /** Action revealed by swiping right-to-left (trailing edge). */
  right?: SwipeAction;
  /** Action revealed by swiping left-to-right (leading edge). */
  left?: SwipeAction;
};

const ICONS = { trash: Trash2, check: Check } as const;

function ActionPane({
  action,
  progress,
  align,
}: {
  action: SwipeAction;
  progress: Animated.AnimatedInterpolation<string | number>;
  align: 'left' | 'right';
}) {
  const Icon = ICONS[action.icon];
  const opacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.6, 1] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: withAlpha(action.color, 0.14),
        justifyContent: 'center',
        alignItems: align === 'left' ? 'flex-start' : 'flex-end',
        paddingHorizontal: 24,
        borderRadius: 16,
      }}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          opacity,
          transform: [{ scale }],
        }}
      >
        <Icon size={20} color={action.color} strokeWidth={2} />
        <InterText weight="semibold" color={action.color} style={{ fontSize: 14 }}>
          {action.label}
        </InterText>
      </Animated.View>
    </View>
  );
}

/**
 * Swipe-to-action wrapper. Swiping reveals a colored action pane; releasing past
 * the threshold fires the action with haptic feedback. Reuses the app theme so
 * colors and motion match every list.
 */
export function SwipeableRow({ children, right, left }: Props) {
  const colors = useColors();

  return (
    <Swipeable
      friction={2}
      rightThreshold={48}
      leftThreshold={48}
      overshootRight={false}
      overshootLeft={false}
      containerStyle={{ borderRadius: 16, backgroundColor: colors.surface }}
      renderRightActions={
        right
          ? (progress) => <ActionPane action={right} progress={progress} align="right" />
          : undefined
      }
      renderLeftActions={
        left
          ? (progress) => <ActionPane action={left} progress={progress} align="left" />
          : undefined
      }
      onSwipeableOpen={(direction) => {
        if (direction === 'right' && right) {
          if (right.icon === 'trash') haptics.notifyWarning();
          else haptics.tapMedium();
          right.onTrigger();
        }
        if (direction === 'left' && left) {
          if (left.icon === 'trash') haptics.notifyWarning();
          else haptics.tapMedium();
          left.onTrigger();
        }
      }}
    >
      {children}
    </Swipeable>
  );
}

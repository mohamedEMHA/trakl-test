import { type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useColors } from '@/lib/theme';
import { withAlpha } from '@/lib/trackers';
import { InterText } from './Typography';
import type { LucideIcon } from 'lucide-react-native';

type Props = {
  icon: LucideIcon;
  /** Accent color for the icon badge. Defaults to muted. */
  accent?: string;
  title: string;
  body?: string;
  action?: ReactNode;
};

/**
 * Friendly empty state: a soft tinted icon badge, a title, supporting copy and
 * an optional CTA. Animates in gently so empty lists never feel broken.
 */
export function EmptyState({ icon: Icon, accent, title, body, action }: Props) {
  const colors = useColors();
  const tint = accent ?? colors.muted;

  return (
    <Animated.View
      entering={FadeInDown.duration(360).springify().damping(18)}
      style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: withAlpha(tint, 0.12),
          marginBottom: 16,
        }}
      >
        <Icon size={32} color={tint} strokeWidth={1.5} />
      </View>
      <InterText weight="semibold" style={{ fontSize: 16, textAlign: 'center' }}>
        {title}
      </InterText>
      {body ? (
        <InterText
          color={colors.muted}
          style={{ fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 }}
        >
          {body}
        </InterText>
      ) : null}
      {action ? <View style={{ marginTop: 18 }}>{action}</View> : null}
    </Animated.View>
  );
}

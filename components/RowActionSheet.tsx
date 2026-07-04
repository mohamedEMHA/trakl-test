import { type ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2, X } from 'lucide-react-native';

import { useColors } from '@/lib/theme';
import { withAlpha } from '@/lib/trackers';
import { haptics } from '@/lib/haptics';
import { AnimatedSheet } from './AnimatedSheet';
import { PressableScale } from './PressableScale';
import { ClashText, InterText } from './Typography';

type Action = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Optional rich body (rows of details). */
  children?: ReactNode;
  /** The delete action label (renders a destructive button). */
  deleteLabel?: string;
  onDelete?: () => void;
  /** Extra non-destructive actions rendered above delete. */
  actions?: Action[];
  closeLabel: string;
};

/**
 * Bottom-sheet that surfaces the details of a list item (transaction, task,
 * goal, …) with quick actions — primarily delete. Reuses the app's sheet shell
 * so motion and anchoring match every other sheet.
 */
export function RowActionSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  deleteLabel,
  onDelete,
  actions,
  closeLabel,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <AnimatedSheet visible={visible} onClose={onClose} motion="spring">
      <View
        style={{
          width: '100%',
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingBottom: Math.max(insets.bottom, 12) + 8,
        }}
      >
        <View className="items-center pt-3">
          <View
            style={{ width: 32, height: 4, borderRadius: 999, backgroundColor: colors.border }}
          />
        </View>
        <View className="flex-row items-start justify-between px-5 pt-4 pb-1">
          <View className="flex-1 pr-3">
            <ClashText weight="medium" style={{ fontSize: 22 }} numberOfLines={2}>
              {title}
            </ClashText>
            {subtitle ? (
              <InterText color={colors.muted} style={{ fontSize: 14, marginTop: 2 }}>
                {subtitle}
              </InterText>
            ) : null}
          </View>
          <PressableScale
            feedback="icon"
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
          >
            <X size={22} color={colors.muted} strokeWidth={1.5} />
          </PressableScale>
        </View>

        {children ? <View className="px-5 pt-3">{children}</View> : null}

        <View className="gap-2.5 px-5 pt-5">
          {actions?.map((a) => (
            <PressableScale
              key={a.label}
              feedback="card"
              onPress={() => {
                a.onPress();
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: colors.surface2,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <InterText weight="semibold" style={{ fontSize: 15 }}>
                {a.label}
              </InterText>
            </PressableScale>
          ))}

          {onDelete && deleteLabel ? (
            <PressableScale
              feedback="card"
              onPress={() => {
                haptics.notifyWarning();
                onDelete();
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={deleteLabel}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: withAlpha(colors.destructive, 0.12),
                borderWidth: 1,
                borderColor: withAlpha(colors.destructive, 0.4),
              }}
            >
              <Trash2 size={18} color={colors.destructive} strokeWidth={1.8} />
              <InterText weight="semibold" color={colors.destructive} style={{ fontSize: 15 }}>
                {deleteLabel}
              </InterText>
            </PressableScale>
          ) : null}
        </View>
      </View>
    </AnimatedSheet>
  );
}

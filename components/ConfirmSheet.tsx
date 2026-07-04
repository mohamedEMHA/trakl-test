import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { useColors } from '@/lib/theme';
import { withAlpha } from '@/lib/trackers';
import { AnimatedSheet } from './AnimatedSheet';
import { PressableScale } from './PressableScale';
import { ClashText, InterText } from './Typography';

type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/** Confirmation bottom-sheet. Replaces multi-button `Alert.alert` (no-op on web). */
export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive = true,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const accent = destructive ? colors.destructive : colors.text;

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
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <ClashText weight="medium" style={{ fontSize: 22 }}>
            {title}
          </ClashText>
          <PressableScale
            feedback="icon"
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
          >
            <X size={22} color={colors.muted} strokeWidth={1.5} />
          </PressableScale>
        </View>

        <View className="px-5 pt-1">
          <InterText color={colors.muted} style={{ fontSize: 15, lineHeight: 22 }}>
            {body}
          </InterText>
        </View>

        <View className="gap-2.5 px-5 pt-5">
          <PressableScale
            feedback="card"
            onPress={() => {
              onConfirm();
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: destructive ? withAlpha(accent, 0.12) : accent,
              borderWidth: destructive ? 1 : 0,
              borderColor: withAlpha(accent, 0.4),
            }}
          >
            <InterText
              weight="semibold"
              color={destructive ? accent : colors.surface}
              style={{ fontSize: 15 }}
            >
              {confirmLabel}
            </InterText>
          </PressableScale>
          <PressableScale
            feedback="card"
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
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
              {cancelLabel}
            </InterText>
          </PressableScale>
        </View>
      </View>
    </AnimatedSheet>
  );
}

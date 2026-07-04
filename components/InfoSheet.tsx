import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { useColors } from '@/lib/theme';
import { AnimatedSheet } from './AnimatedSheet';
import { PressableScale } from './PressableScale';
import { ClashText, InterText } from './Typography';

export type InfoAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'plain';
};

type InfoSheetProps = {
  visible: boolean;
  title: string;
  body: string;
  actions?: InfoAction[];
  onClose: () => void;
};

/**
 * Lightweight informational bottom-sheet used for Help / About / Rate.
 * Replaces `Alert.alert`, which does not render multi-button dialogs on web.
 */
export function InfoSheet({ visible, title, body, actions, onClose }: InfoSheetProps) {
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
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <ClashText weight="medium" style={{ fontSize: 22 }}>
            {title}
          </ClashText>
          <PressableScale
            feedback="icon"
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={22} color={colors.muted} strokeWidth={1.5} />
          </PressableScale>
        </View>

        <View className="px-5 pt-1">
          <InterText color={colors.muted} style={{ fontSize: 15, lineHeight: 22 }}>
            {body}
          </InterText>
        </View>

        {actions && actions.length > 0 ? (
          <View className="gap-2.5 px-5 pt-5">
            {actions.map((a) => {
              const primary = a.variant !== 'plain';
              return (
                <PressableScale
                  feedback="card"
                  key={a.label}
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
                    backgroundColor: primary ? colors.text : colors.surface2,
                    borderWidth: primary ? 0 : 1,
                    borderColor: colors.border,
                  }}
                >
                  <InterText
                    weight="semibold"
                    color={primary ? colors.surface : colors.text}
                    style={{ fontSize: 15 }}
                  >
                    {a.label}
                  </InterText>
                </PressableScale>
              );
            })}
          </View>
        ) : null}
      </View>
    </AnimatedSheet>
  );
}

import { type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';

import { useColors } from '@/lib/theme';
import { AnimatedSheet } from './AnimatedSheet';
import { PressableScale } from './PressableScale';
import { ClashText, InterText } from './Typography';

export type SheetOption = {
  value: string;
  label: string;
  /** Secondary line (e.g. native script). */
  sub?: string;
  /** Leading glyph (e.g. flag emoji). */
  leading?: string;
};

type OptionSheetProps = {
  visible: boolean;
  title: string;
  options: SheetOption[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

/** Bottom-sheet style single-select list used for Theme + Language pickers. */
function OptionSheetBody({
  title,
  options,
  selected,
  onSelect,
  onClose,
}: Omit<OptionSheetProps, 'visible'>) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        width: '100%',
        flexShrink: 1,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: Math.max(insets.bottom, 12) + 8,
      }}
    >
      <View className="items-center pt-3">
        <View style={{ width: 32, height: 4, borderRadius: 999, backgroundColor: colors.border }} />
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
      <ScrollView
        style={{ flexShrink: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {options.map((opt) => {
          const active = opt.value === selected;
          return (
            <PressableScale
              feedback="card"
              key={opt.value}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 16,
                marginBottom: 8,
                borderRadius: 14,
                borderWidth: active ? 2 : 1,
                borderColor: active ? colors.text : colors.border,
                backgroundColor: active ? colors.surface2 : colors.surface,
              }}
            >
              <View className="flex-1 flex-row items-center gap-3">
                {opt.leading ? <InterText style={{ fontSize: 22 }}>{opt.leading}</InterText> : null}
                <View className="flex-1">
                  <InterText weight="medium" style={{ fontSize: 16 }}>
                    {opt.label}
                  </InterText>
                  {opt.sub ? (
                    <InterText color={colors.muted} style={{ fontSize: 12, marginTop: 1 }}>
                      {opt.sub}
                    </InterText>
                  ) : null}
                </View>
              </View>
              {active ? <Check size={20} color={colors.text} strokeWidth={2} /> : null}
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function OptionSheet({ visible, onClose, ...rest }: OptionSheetProps) {
  return (
    <AnimatedSheet visible={visible} onClose={onClose} motion="glide">
      <OptionSheetBody onClose={onClose} {...rest} />
    </AnimatedSheet>
  );
}

/** Convenience wrapper so callers can pass a trigger + children. */
export function SheetSection({ children }: { children: ReactNode }) {
  return <View>{children}</View>;
}

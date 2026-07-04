import { type ReactNode } from 'react';
import { Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Minus, Plus, X } from 'lucide-react-native';

import { useColors } from '@/lib/theme';
import { AnimatedSheet } from './AnimatedSheet';
import { PressableScale } from './PressableScale';
import { PrimaryButton } from './PrimaryButton';
import { ClashText, InterText } from './Typography';

type FormSheetProps = {
  visible: boolean;
  title: string;
  submitLabel: string;
  onSubmit: () => void;
  onClose: () => void;
  submitDisabled?: boolean;
  children: ReactNode;
};

/** Bottom-sheet wrapper for all "add / log" forms. Keyboard-aware + scrollable. */
function FormSheetBody({
  title,
  submitLabel,
  onSubmit,
  onClose,
  submitDisabled,
  children,
}: Omit<FormSheetProps, 'visible'>) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12) + 8;

  return (
    <View
      style={{
        width: '100%',
        flexShrink: 1,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: bottomPad,
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View className="gap-4">{children}</View>
      </ScrollView>
      <View className="px-5 pt-1">
        <PrimaryButton label={submitLabel} onPress={onSubmit} disabled={submitDisabled} />
      </View>
    </View>
  );
}

export function FormSheet({ visible, onClose, ...rest }: FormSheetProps) {
  return (
    <AnimatedSheet visible={visible} onClose={onClose} motion="pop">
      <FormSheetBody onClose={onClose} {...rest} />
    </AnimatedSheet>
  );
}

/** Labeled field wrapper. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  const colors = useColors();
  return (
    <View className="gap-1.5">
      <InterText weight="medium" color={colors.muted} style={{ fontSize: 12 }}>
        {label}
      </InterText>
      {children}
    </View>
  );
}

/** Text / numeric input row. */
export function TextField({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoFocus,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  autoFocus?: boolean;
}) {
  const colors = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.faint}
      keyboardType={keyboardType}
      autoFocus={autoFocus}
      style={{
        height: 52,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontFamily: Platform.OS === 'web' ? 'Inter' : 'Inter_400Regular',
        fontSize: 15,
        color: colors.text,
      }}
    />
  );
}

export type ChipChoice<T extends string = string> = { value: T; label: string; color?: string };

/** Horizontal single-select chips. */
export function ChipSelect<T extends string>({
  choices,
  selected,
  onSelect,
}: {
  choices: ChipChoice<T>[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  const colors = useColors();
  return (
    <View className="flex-row flex-wrap gap-2">
      {choices.map((c) => {
        const active = c.value === selected;
        const accent = c.color ?? colors.text;
        return (
          <PressableScale
            feedback="chip"
            key={c.value}
            onPress={() => onSelect(c.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 999,
              borderWidth: active ? 2 : 1,
              borderColor: active ? accent : colors.border,
              backgroundColor: active ? colors.surface2 : colors.surface,
            }}
          >
            <InterText
              weight={active ? 'semibold' : 'regular'}
              color={active ? colors.text : colors.muted}
              style={{ fontSize: 13 }}
            >
              {c.label}
            </InterText>
          </PressableScale>
        );
      })}
    </View>
  );
}

/** Numeric stepper with min/max bounds. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const colors = useColors();
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const btn = (icon: ReactNode, onPress: () => void, label: string) => (
    <PressableScale
      feedback="icon"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </PressableScale>
  );
  return (
    <View className="flex-row items-center gap-3">
      {btn(
        <Minus size={18} color={colors.text} strokeWidth={1.5} />,
        () => onChange(clamp(value - step)),
        'Decrease',
      )}
      <View className="flex-1 items-center">
        <ClashText weight="bold" style={{ fontSize: 24 }}>
          {value}
          {suffix ? <InterText style={{ fontSize: 14 }}> {suffix}</InterText> : null}
        </ClashText>
      </View>
      {btn(
        <Plus size={18} color={colors.text} strokeWidth={1.5} />,
        () => onChange(clamp(value + step)),
        'Increase',
      )}
    </View>
  );
}

import { type ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useColors } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { PressableScale } from './PressableScale';
import { InterText } from './Typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconRight?: boolean;
  fullWidth?: boolean;
  className?: string;
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon: Icon,
  iconRight,
  fullWidth = true,
  className,
}: PrimaryButtonProps) {
  const colors = useColors();

  const bg = disabled
    ? colors.surface2
    : variant === 'primary'
      ? colors.ink
      : variant === 'destructive'
        ? colors.destructive
        : variant === 'secondary'
          ? colors.surface
          : 'transparent';

  const fg = disabled
    ? colors.faint
    : variant === 'primary'
      ? colors.accentText
      : variant === 'destructive'
        ? '#FFFFFF'
        : variant === 'ghost'
          ? colors.muted
          : colors.text;

  const border = variant === 'secondary' ? colors.border : 'transparent';

  const iconNode: ReactNode = Icon ? <Icon size={18} color={fg} strokeWidth={1.5} /> : null;

  return (
    <PressableScale
      feedback="button"
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        backgroundColor: bg,
        borderColor: border,
        borderWidth: variant === 'secondary' ? 1 : 0,
      }}
      className={cn(
        'h-[52px] flex-row items-center justify-center gap-2 rounded-[14px] px-5',
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {!iconRight ? iconNode : null}
          <InterText weight="semibold" color={fg} style={{ fontSize: 15 }}>
            {label}
          </InterText>
          {iconRight ? iconNode : null}
        </>
      )}
    </PressableScale>
  );
}

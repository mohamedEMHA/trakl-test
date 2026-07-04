import { withAlpha } from '@/lib/trackers';
import { useColors } from '@/lib/theme';
import { PressableScale } from './PressableScale';
import { InterText } from './Typography';

type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  accent?: string;
};

/** Pill filter chip. Active = dark fill, white text. */
export function Chip({ label, active, onPress, accent }: ChipProps) {
  const colors = useColors();
  const bg = active ? colors.text : colors.surface2;
  const fg = active ? colors.bg : colors.muted;
  return (
    <PressableScale
      feedback="chip"
      onPress={onPress}
      accessibilityRole="button"
      style={{
        backgroundColor: bg,
        borderWidth: accent && !active ? 1 : 0,
        borderColor: accent ? withAlpha(accent, 0.3) : undefined,
      }}
      className="h-9 items-center justify-center rounded-full px-4"
    >
      <InterText weight="medium" color={fg} style={{ fontSize: 13 }}>
        {label}
      </InterText>
    </PressableScale>
  );
}

type StatusChipProps = {
  label: string;
  accent: string;
};

/** Status chip — tracker accent low-opacity bg with accent text. */
export function StatusChip({ label, accent }: StatusChipProps) {
  return (
    <InterText
      weight="medium"
      color={accent}
      style={{
        fontSize: 12,
        backgroundColor: withAlpha(accent, 0.12),
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        overflow: 'hidden',
      }}
    >
      {label}
    </InterText>
  );
}

import { type TextProps as RNTextProps, Text as RNText } from 'react-native';

import { clashFont, interFont, type ClashWeight } from '@/lib/fonts';
import { useColors } from '@/lib/theme';
import { cn } from '@/lib/utils';

type ClashProps = RNTextProps & {
  weight?: ClashWeight;
  color?: string;
};

/** Clash Display text — used for all numbers and display headings. */
export function ClashText({ weight = 'bold', color, style, className, ...rest }: ClashProps) {
  const colors = useColors();
  return (
    <RNText
      className={className}
      style={[clashFont(weight), { color: color ?? colors.text }, style]}
      {...rest}
    />
  );
}

type InterWeight = 'regular' | 'medium' | 'semibold' | 'bold';
type InterProps = RNTextProps & {
  weight?: InterWeight;
  color?: string;
};

/** Inter text — body / UI copy. */
export function InterText({ weight = 'regular', color, style, ...rest }: InterProps) {
  const colors = useColors();
  return <RNText style={[interFont(weight), { color: color ?? colors.text }, style]} {...rest} />;
}

type CaptionProps = RNTextProps & {
  color?: string;
  className?: string;
  /**
   * Keep the label on a single line and auto-shrink the font so long
   * translated labels never spill outside narrow stat cards.
   */
  fit?: boolean;
};

/** ALL-CAPS letter-spaced caption label. Inter Medium. */
export function Caption({ color, style, className, children, fit, ...rest }: CaptionProps) {
  const colors = useColors();
  const fitProps = fit
    ? ({
        numberOfLines: 1,
        adjustsFontSizeToFit: true,
        minimumFontScale: 0.6,
        // When even the smallest scale can't fit a very long translation,
        // trail off with an ellipsis instead of clipping a character mid-glyph.
        ellipsizeMode: 'tail',
      } as const)
    : null;
  return (
    <RNText
      className={cn('text-[11px]', className)}
      style={[
        interFont('medium'),
        // Tight letter-spacing reads cleaner and stops all-caps multi-word
        // labels from pushing characters past the card edge.
        { letterSpacing: 0.4, color: color ?? colors.muted },
        style,
      ]}
      {...fitProps}
      {...rest}
    >
      {typeof children === 'string' ? children.toUpperCase() : children}
    </RNText>
  );
}

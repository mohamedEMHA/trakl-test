import { type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { useColors } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { PressableScale } from './PressableScale';

type CardProps = ViewProps & {
  children: ReactNode;
  elevated?: boolean;
  onPress?: () => void;
  padded?: boolean;
};

/** White surface card with warm border + soft shadow. */
export function Card({
  children,
  elevated,
  onPress,
  padded = true,
  className,
  style,
  ...rest
}: CardProps) {
  const colors = useColors();

  const shadow = elevated
    ? {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        // Android elevation casts an opaque grey rectangle behind tinted/rounded
        // cards (the "second square" artifact). Use border + iOS shadow only.
        elevation: 0,
      }
    : {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 0,
      };

  const content = (
    <View
      className={cn('rounded-2xl', padded && 'p-4', className)}
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        shadow,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <PressableScale
        feedback="card"
        onPress={onPress}
        className={cn(className?.includes('flex-1') && 'flex-1')}
      >
        {content}
      </PressableScale>
    );
  }
  return content;
}

import { type ReactNode } from 'react';
import { View } from 'react-native';
import { Plus } from 'lucide-react-native';

import { useColors } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { PressableScale } from './PressableScale';

type ScreenProps = {
  children: ReactNode;
  className?: string;
};

/** Full-bleed warm background screen container. */
export function Screen({ children, className }: ScreenProps) {
  const colors = useColors();
  return (
    <View className={cn('flex-1', className)} style={{ backgroundColor: colors.bg }}>
      {children}
    </View>
  );
}

type FabProps = {
  onPress: () => void;
  bottom?: number;
};

/** Floating circular add button. */
export function Fab({ onPress, bottom = 24 }: FabProps) {
  const colors = useColors();
  return (
    <PressableScale
      feedback="icon"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add"
      style={{
        position: 'absolute',
        right: 20,
        bottom,
        backgroundColor: colors.ink,
        width: 56,
        height: 56,
        borderRadius: 999,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      }}
      className="items-center justify-center"
    >
      <Plus size={26} color={colors.accentText} strokeWidth={2} />
    </PressableScale>
  );
}

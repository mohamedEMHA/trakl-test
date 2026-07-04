import { type ReactNode } from 'react';
import { View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useColors } from '@/lib/theme';
import { PressableScale } from './PressableScale';
import { ClashText } from './Typography';

type ScreenHeaderProps = {
  title: string;
  back?: boolean;
  right?: ReactNode;
  subtitle?: ReactNode;
};

/** Page header with optional back button and right-side actions. */
export function ScreenHeader({ title, back, right, subtitle }: ScreenHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  return (
    <View className="px-5 pt-2 pb-2">
      <View className="min-h-[44px] flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-2">
          {back ? (
            <PressableScale
              feedback="icon"
              onPress={() => router.back()}
              hitSlop={10}
              className="-ml-2 h-11 w-11 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={24} color={colors.text} strokeWidth={1.5} />
            </PressableScale>
          ) : null}
          <ClashText weight="semibold" style={{ fontSize: 28 }} numberOfLines={1}>
            {title}
          </ClashText>
        </View>
        {right ? <View className="flex-row items-center gap-3">{right}</View> : null}
      </View>
      {subtitle}
    </View>
  );
}

import { View } from 'react-native';

import { ClashText, InterText } from '@/components/Typography';
import { useColors } from '@/lib/theme';
import { withAlpha } from '@/lib/trackers';

/**
 * Web fallback for the AdMob banner. The native ad SDK
 * (react-native-google-mobile-ads) has no web implementation, so on web we
 * render the styled "AD / SPONSORED" placeholder instead of blank space.
 */
export function AdBanner() {
  const colors = useColors();
  return (
    <View
      style={{
        backgroundColor: colors.surface2,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        height: 64,
      }}
      className="w-full items-center justify-center gap-0.5"
    >
      <ClashText
        style={{ color: withAlpha(colors.text, 0.55), letterSpacing: 2 }}
        className="text-[11px] font-semibold"
      >
        AD
      </ClashText>
      <InterText
        style={{ color: withAlpha(colors.text, 0.4), letterSpacing: 1 }}
        className="text-[10px]"
      >
        SPONSORED
      </InterText>
    </View>
  );
}

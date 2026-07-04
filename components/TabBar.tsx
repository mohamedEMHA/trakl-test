import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BarChart2, LayoutGrid, Home as HomeIcon, Plus, User } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useColors } from '@/lib/theme';
import { PressableScale } from './PressableScale';

const TAB_META: Record<
  string,
  { icon: LucideIcon; key: 'home' | 'trackers' | 'analytics' | 'profile' }
> = {
  index: { icon: HomeIcon, key: 'home' },
  trackers: { icon: LayoutGrid, key: 'trackers' },
  analytics: { icon: BarChart2, key: 'analytics' },
  profile: { icon: User, key: 'profile' },
};

/** Custom bottom nav: 4 tabs + a centered FAB that opens Quick Add. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();

  // Insert FAB between analytics (index 2) and profile (index 3)
  const routes = state.routes.filter((r) => TAB_META[r.name]);
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  const renderTab = (routeName: string, key: string) => {
    const meta = TAB_META[routeName];
    if (!meta) return null;
    const routeIndex = state.routes.findIndex((r) => r.name === routeName);
    const focused = state.index === routeIndex;
    const Icon = meta.icon;
    const color = focused ? colors.text : colors.muted;
    const label = t(`tabs.${meta.key}`);
    return (
      <PressableScale
        feedback="tab"
        key={key}
        onPress={() => {
          const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[routeIndex].key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(routeName);
          }
        }}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        className="flex-1 items-center justify-center"
        style={{ height: 56 }}
      >
        <Icon size={24} color={color} strokeWidth={1.5} />
      </PressableScale>
    );
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: insets.bottom,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: -1 },
        elevation: 8,
      }}
      className="flex-row items-center px-2"
    >
      {left.map((r) => renderTab(r.name, r.key))}

      <View className="flex-1 items-center justify-center">
        <PressableScale
          feedback="button"
          onPress={() => router.push('/quick-add')}
          accessibilityRole="button"
          accessibilityLabel={t('common.add')}
          style={{
            backgroundColor: colors.ink,
            width: 52,
            height: 52,
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
      </View>

      {right.map((r) => renderTab(r.name, r.key))}
    </View>
  );
}

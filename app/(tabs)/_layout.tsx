import { useEffect } from 'react';
import { View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { TabBar } from '@/components/TabBar';
import { useColors, useResolvedScheme } from '@/lib/theme';
import { useTrakl } from '@/lib/store';

export default function TabLayout() {
  const router = useRouter();
  const colors = useColors();
  const scheme = useResolvedScheme();
  const hydrated = useTrakl((s) => s.hydrated);
  const onboarded = useTrakl((s) => s.onboarded);
  const rehydrateFailed = useTrakl((s) => s.rehydrateFailed);

  // First-launch gate: send users to onboarding until completed. Skip the
  // redirect when rehydration failed — the in-memory state is empty defaults
  // and bouncing into onboarding would overwrite the user's real saved data.
  useEffect(() => {
    if (hydrated && !onboarded && !rehydrateFailed) {
      router.replace('/onboarding');
    }
  }, [hydrated, onboarded, rehydrateFailed, router]);

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <>
      {/* expo-status-bar StatusBar takes a string for `style`, not an object — linter false positive */}
      {/* oxlint-disable-next-line react/style-prop-object */}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="trackers" options={{ title: 'Trackers' }} />
        <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </>
  );
}

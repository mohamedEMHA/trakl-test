import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AdBanner } from '@/components/AdBanner';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Caption, InterText } from '@/components/Typography';
import { TRACKER_MAP, withAlpha } from '@/lib/trackers';
import { useFormatters } from '@/lib/format';
import { useColors } from '@/lib/theme';
import type { Palette } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
import type { AppNotification } from '@/lib/types';

function bucketOf(iso: string): 'today' | 'week' | 'earlier' {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'today';
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (diff <= 7) return 'week';
  return 'earlier';
}

/** Compact relative time, e.g. "now", "12m", "3h", "2d". */
function useRelativeTime(): (iso: string) => string {
  const fmt = useFormatters();
  const { t } = useTranslation();
  return (iso: string) => {
    const then = new Date(iso).getTime();
    const diffMin = Math.max(0, Math.round((Date.now() - then) / 60000));
    if (diffMin < 1) return t('notifications.justNow');
    if (diffMin < 60) return t('notifications.minutesAgo', { count: diffMin });
    const diffHrs = Math.round(diffMin / 60);
    if (diffHrs < 24) return t('notifications.hoursAgo', { count: diffHrs });
    const diffDays = Math.round(diffHrs / 24);
    if (diffDays <= 7) return t('notifications.daysAgo', { count: diffDays });
    return fmt.date(iso, { day: 'numeric', month: 'short' });
  };
}

function NotifRow({
  n,
  colors,
  relTime,
  index,
}: {
  n: AppNotification;
  colors: Palette;
  relTime: (iso: string) => string;
  index: number;
}) {
  const meta = TRACKER_MAP[n.tracker];
  const Icon = meta.icon;

  return (
    <Animated.View entering={FadeInDown.delay(index * 45).duration(320)}>
      <Card
        padded={false}
        className="p-4"
        style={{
          backgroundColor: n.read ? colors.surface : withAlpha(meta.color, 0.05),
          borderColor: n.read ? colors.border : withAlpha(meta.color, 0.22),
        }}
      >
        <View className="flex-row items-start">
          {/* Gradient logo badge tinted by tracker accent */}
          <LinearGradient
            colors={[withAlpha(meta.color, 0.95), withAlpha(meta.color, 0.6)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} color="#FFFFFF" strokeWidth={2} />
          </LinearGradient>

          <View className="flex-1 px-3">
            <View className="flex-row items-center gap-2">
              <InterText
                weight={n.read ? 'medium' : 'semibold'}
                style={{ fontSize: 14.5, flexShrink: 1 }}
                numberOfLines={1}
              >
                {n.title}
              </InterText>
              {n.read ? null : (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: meta.color,
                  }}
                />
              )}
            </View>
            <InterText
              color={colors.muted}
              style={{ fontSize: 13, marginTop: 3, lineHeight: 18 }}
              numberOfLines={2}
            >
              {n.message}
            </InterText>
          </View>

          <InterText color={colors.faint} style={{ fontSize: 11, marginTop: 2 }}>
            {relTime(n.time)}
          </InterText>
        </View>
      </Card>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const relTime = useRelativeTime();
  const notifications = useTrakl((s) => s.notifications);
  const markAllNotificationsRead = useTrakl((s) => s.markAllNotificationsRead);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const sectionLabels = {
    today: t('notifications.today'),
    week: t('notifications.thisWeek'),
    earlier: t('notifications.earlier'),
  } as const;

  const buckets = (['today', 'week', 'earlier'] as const).map((b) => ({
    key: b,
    items: notifications.filter((n) => bucketOf(n.time) === b),
  }));

  let rowIndex = 0;

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader
          title={t('notifications.title')}
          back
          right={
            unreadCount > 0 ? (
              <PressableScale
                feedback="icon"
                onPress={markAllNotificationsRead}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('notifications.markRead')}
              >
                <InterText weight="semibold" color={colors.text} style={{ fontSize: 13 }}>
                  {t('notifications.markRead')}
                </InterText>
              </PressableScale>
            ) : undefined
          }
        />

        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={t('notifications.emptyTitle')}
            body={t('notifications.empty')}
          />
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 28 }}
            showsVerticalScrollIndicator={false}
          >
            {unreadCount > 0 ? (
              <View className="px-5 pt-3">
                <InterText color={colors.muted} style={{ fontSize: 13 }}>
                  {t('notifications.unreadCount', { count: unreadCount })}
                </InterText>
              </View>
            ) : null}

            {buckets.map(({ key, items }) =>
              items.length === 0 ? null : (
                <View key={key} className="px-5 pt-5">
                  <View className="mb-3">
                    <Caption>{sectionLabels[key]}</Caption>
                  </View>
                  <View className="gap-3">
                    {items.map((n) => (
                      <NotifRow
                        key={n.id}
                        n={n}
                        colors={colors}
                        relTime={relTime}
                        index={rowIndex++}
                      />
                    ))}
                  </View>
                </View>
              ),
            )}
          </ScrollView>
        )}
        <AdBanner />
      </View>
    </Screen>
  );
}

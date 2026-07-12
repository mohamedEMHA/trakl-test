import { ScrollView, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MoreHorizontal, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AdBanner } from '@/components/AdBanner';
import { BarChart } from '@/components/Charts';
import { Card } from '@/components/Card';
import { CustomLogForm } from '@/components/CustomLogForm';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RowActionSheet } from '@/components/RowActionSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { SwipeableRow } from '@/components/SwipeableRow';
import { Caption, ClashText, InterText } from '@/components/Typography';
import { iconForKey } from '@/components/icons';
import { CustomEditForm } from '@/components/CustomEditForm';
import { withAlpha } from '@/lib/trackers';
import { useFormatters } from '@/lib/format';
import { formatLogValue } from '@/lib/customFormat';
import { haptics } from '@/lib/haptics';
import { useColors } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
import { dayISO } from '@/lib/seed';
import type { CustomTracker } from '@/lib/types';

const WEEKDAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function CustomDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();
  const fmt = useFormatters();
  const params = useLocalSearchParams<{ id: string; add?: string }>();

  const trackers = useTrakl((s) => s.customTrackers);
  const logCustomValue = useTrakl((s) => s.logCustomValue);
  const deleteCustomLog = useTrakl((s) => s.deleteCustomLog);
  const deleteCustomTracker = useTrakl((s) => s.deleteCustomTracker);
  const updateCustomTracker = useTrakl((s) => s.updateCustomTracker);

  const tracker = trackers.find((tr) => tr.id === params.id);

  const [logOpen, setLogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (params.add === '1') setLogOpen(true);
  }, [params.add]);

  const logs = useMemo(() => tracker?.logs ?? [], [tracker]);

  const chartData = useMemo(
    () =>
      WEEKDAY.map((label, i) => {
        const iso = dayISO(-(6 - i));
        const target = new Date(iso).toDateString();
        const dayLogs = logs.filter((l) => new Date(l.date).toDateString() === target);
        let value = 0;
        if (tracker?.type === 'yesno') value = dayLogs.length > 0 ? 1 : 0;
        else if (tracker?.type === 'counter') value = dayLogs.reduce((s, l) => s + l.value, 0);
        else if (dayLogs.length > 0)
          value = dayLogs.reduce((s, l) => s + l.value, 0) / dayLogs.length;
        return { label, value: Math.round(value * 10) / 10 };
      }),
    [logs, tracker?.type],
  );

  if (!tracker) {
    return (
      <Screen>
        <View className="pt-safe flex-1">
          <ScreenHeader title={t('custom.title')} back />
          <View className="flex-1 items-center justify-center px-8">
            <InterText color={colors.muted} style={{ fontSize: 15, textAlign: 'center' }}>
              {t('customDetail.notFound')}
            </InterText>
          </View>
        </View>
      </Screen>
    );
  }

  const Icon = iconForKey(tracker.icon);
  const last = logs[0];

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader
          title={tracker.name}
          back
          right={
            <PressableScale
              feedback="icon"
              onPress={() => setMenuOpen(true)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('customDetail.options')}
            >
              <MoreHorizontal size={22} color={colors.text} strokeWidth={1.5} />
            </PressableScale>
          }
        />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5 pt-2">
            <Card
              elevated
              className="gap-3"
              style={{ backgroundColor: withAlpha(tracker.color, 0.06) }}
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: withAlpha(tracker.color, 0.14),
                  }}
                  className="items-center justify-center"
                >
                  <Icon size={24} color={tracker.color} strokeWidth={1.6} />
                </View>
                <View className="flex-1">
                  <Caption>{t('customDetail.latest')}</Caption>
                  <ClashText weight="bold" style={{ fontSize: 30 }}>
                    {last ? formatLogValue(tracker.type, last.value, t) : '—'}
                  </ClashText>
                </View>
              </View>
              {tracker.description ? (
                <InterText color={colors.muted} style={{ fontSize: 13 }}>
                  {tracker.description}
                </InterText>
              ) : null}
            </Card>
          </View>

          {tracker.type !== 'yesno' && logs.length > 0 ? (
            <View className="px-5 pt-6">
              <SectionLabel>{t('customDetail.last7Days')}</SectionLabel>
              <Card>
                <BarChart data={chartData} color={tracker.color} showValue />
              </Card>
            </View>
          ) : null}

          <View className="px-5 pt-6">
            <SectionLabel>{t('customDetail.history')}</SectionLabel>
            {logs.length === 0 ? (
              <Card>
                <InterText color={colors.muted} style={{ fontSize: 14, textAlign: 'center' }}>
                  {t('customDetail.noLogs')}
                </InterText>
              </Card>
            ) : (
              <View className="gap-3">
                {logs.map((log) => (
                  <SwipeableRow
                    key={log.id}
                    right={{
                      label: t('common.delete'),
                      icon: 'trash',
                      color: colors.destructive,
                      onTrigger: () => deleteCustomLog(tracker.id, log.id),
                    }}
                  >
                    <Card padded={false} className="p-4">
                      <View className="flex-row items-center justify-between">
                        <InterText color={colors.muted} style={{ fontSize: 13 }}>
                          {fmt.date(log.date, {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </InterText>
                        <ClashText weight="medium" style={{ fontSize: 16 }}>
                          {formatLogValue(tracker.type, log.value, t)}
                        </ClashText>
                      </View>
                    </Card>
                  </SwipeableRow>
                ))}
              </View>
            )}
          </View>

          <View className="px-5 pt-6">
            <PrimaryButton
              label={t('customDetail.logValue')}
              icon={Plus}
              onPress={() => {
                haptics.tapMedium();
                setLogOpen(true);
              }}
            />
          </View>
        </ScrollView>
        <AdBanner />
      </View>

      {logOpen ? (
        <CustomLogForm
          tracker={tracker}
          onClose={() => setLogOpen(false)}
          onSubmit={(value) => {
            logCustomValue(tracker.id, value);
            setLogOpen(false);
          }}
        />
      ) : null}

      {editOpen ? (
        <CustomEditForm
          initial={tracker}
          onClose={() => setEditOpen(false)}
          onSubmit={(patch) => {
            updateCustomTracker(tracker.id, patch);
            setEditOpen(false);
          }}
        />
      ) : null}

      <RowActionSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={tracker.name}
        closeLabel={t('common.close')}
        actions={[{ label: t('customDetail.edit'), onPress: () => setEditOpen(true) }]}
        deleteLabel={t('customDetail.deleteTracker')}
        onDelete={() => {
          deleteCustomTracker(tracker.id);
          router.back();
        }}
      />
    </Screen>
  );
}

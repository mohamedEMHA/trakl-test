import { ScrollView, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Brain, Flame } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { AdBanner } from '@/components/AdBanner';
import { BarChart } from '@/components/Charts';
import { Card } from '@/components/Card';
import { ChipSelect, Field, FormSheet, Stepper } from '@/components/FormSheet';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RowActionSheet } from '@/components/RowActionSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { Caption, ClashText, InterText } from '@/components/Typography';
import { withAlpha } from '@/lib/trackers';
import { useFormatters } from '@/lib/format';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
import { dayISO } from '@/lib/seed';
import { meditationMinutes, meditationStreak } from '@/lib/stats';
import type { MeditationSession } from '@/lib/types';

const WEEKDAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const KIND_KEYS = ['mindfulness', 'breathing', 'bodyScan', 'sleep'] as const;
type KindKey = (typeof KIND_KEYS)[number];
const KIND_LABEL: Record<KindKey, string> = {
  mindfulness: 'Mindfulness',
  breathing: 'Breathing',
  bodyScan: 'Body scan',
  sleep: 'Sleep',
};

export default function MeditationScreen() {
  const colors = useColors();
  const accents = useTrackerAccents();
  const accent = accents.meditation;
  const { t } = useTranslation();
  const fmt = useFormatters();
  const meditation = useTrakl((s) => s.meditation);
  const addMeditation = useTrakl((s) => s.addMeditation);
  const deleteMeditation = useTrakl((s) => s.deleteMeditation);
  const [formOpen, setFormOpen] = useState(false);
  const [active, setActive] = useState<MeditationSession | null>(null);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.add === '1') setFormOpen(true);
  }, [params.add]);

  const sorted = useMemo(
    () => [...meditation].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [meditation],
  );
  const streak = meditationStreak(meditation);
  const weekMinutes = meditationMinutes(meditation, 7);

  const chartData = WEEKDAY.map((label, i) => {
    const iso = dayISO(-(6 - i));
    const target = new Date(iso).toDateString();
    const value = meditation
      .filter((m) => new Date(m.date).toDateString() === target)
      .reduce((s, m) => s + m.durationMinutes, 0);
    return { label, value };
  });

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader title={t('meditationScreen.title')} back />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5 pt-2">
            <Card elevated className="p-6">
              <View className="flex-row items-center gap-2">
                <Flame size={18} color={accent} strokeWidth={1.8} />
                <Caption>{t('meditationScreen.streak')}</Caption>
              </View>
              <ClashText weight="bold" style={{ fontSize: 48, marginTop: 4 }}>
                {t('meditationScreen.dayCount', { count: streak })}
              </ClashText>
              <InterText color={colors.muted} style={{ fontSize: 14, marginTop: 4 }}>
                {t('meditationScreen.weekMinutes', { count: weekMinutes })}
              </InterText>
            </Card>
          </View>

          <View className="px-5 pt-6">
            <SectionLabel>{t('meditationScreen.last7Days')}</SectionLabel>
            <Card>
              <BarChart data={chartData} color={accent} unit="m" showValue />
            </Card>
          </View>

          <View className="px-5 pt-6">
            <SectionLabel>{t('meditationScreen.sessions')}</SectionLabel>
            <View className="gap-3">
              {sorted.map((m) => (
                <PressableScale
                  key={m.id}
                  feedback="card"
                  onPress={() => setActive(m)}
                  accessibilityRole="button"
                  accessibilityLabel={m.kind}
                >
                  <Card padded={false} className="p-4">
                    <View className="flex-row items-center">
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: withAlpha(accent, 0.1),
                        }}
                        className="items-center justify-center"
                      >
                        <Brain size={20} color={accent} strokeWidth={1.5} />
                      </View>
                      <View className="flex-1 px-3">
                        <ClashText weight="medium" style={{ fontSize: 15 }}>
                          {m.kind}
                        </ClashText>
                        <InterText color={colors.muted} style={{ fontSize: 12, marginTop: 2 }}>
                          {fmt.date(m.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                        </InterText>
                      </View>
                      <InterText weight="medium" style={{ fontSize: 14 }}>
                        {t('meditationScreen.minutesShort', { count: m.durationMinutes })}
                      </InterText>
                    </View>
                  </Card>
                </PressableScale>
              ))}
            </View>
          </View>

          <View className="px-5 pt-6">
            <PrimaryButton
              label={t('meditationScreen.logSession')}
              onPress={() => setFormOpen(true)}
            />
          </View>
        </ScrollView>
        <AdBanner />
      </View>

      <MeditationForm
        visible={formOpen}
        t={t}
        onClose={() => setFormOpen(false)}
        onSubmit={(entry) => {
          addMeditation(entry);
          setFormOpen(false);
        }}
      />

      <RowActionSheet
        visible={active != null}
        title={active?.kind ?? ''}
        subtitle={
          active ? t('meditationScreen.minutesShort', { count: active.durationMinutes }) : undefined
        }
        deleteLabel={t('meditationScreen.delete')}
        onDelete={() => {
          if (active) deleteMeditation(active.id);
          setActive(null);
        }}
        closeLabel={t('common.close')}
        onClose={() => setActive(null)}
      />
    </Screen>
  );
}

function MeditationForm({
  visible,
  onClose,
  onSubmit,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<MeditationSession, 'id'>) => void;
  t: TFunction;
}) {
  const [duration, setDuration] = useState(10);
  const [kind, setKind] = useState<KindKey>('mindfulness');

  const reset = () => {
    setDuration(10);
    setKind('mindfulness');
  };

  const submit = () => {
    onSubmit({
      durationMinutes: duration,
      kind: KIND_LABEL[kind],
      date: new Date().toISOString(),
    });
    reset();
  };

  return (
    <FormSheet
      visible={visible}
      title={t('forms.logMeditation')}
      submitLabel={t('forms.logMeditation')}
      onSubmit={submit}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <Field label={t('forms.meditationType')}>
        <ChipSelect
          choices={KIND_KEYS.map((k) => ({ value: k, label: t(`meditationScreen.kinds.${k}`) }))}
          selected={kind}
          onSelect={setKind}
        />
      </Field>
      <Field label={t('forms.duration')}>
        <Stepper value={duration} onChange={setDuration} min={1} max={120} step={1} suffix="min" />
      </Field>
    </FormSheet>
  );
}

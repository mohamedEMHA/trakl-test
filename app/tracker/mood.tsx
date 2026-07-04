import { ScrollView, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ParseKeys } from 'i18next';
import type { TFunction } from 'i18next';

import { AdBanner } from '@/components/AdBanner';
import { BarChart } from '@/components/Charts';
import { Card } from '@/components/Card';
import { Field, FormSheet, TextField } from '@/components/FormSheet';
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
import { avgMood, todayMood } from '@/lib/stats';
import type { MoodEntry } from '@/lib/types';

const MOOD_EMOJI = ['😣', '🙁', '😐', '🙂', '😄'];
const WEEKDAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type MoodLabelKey = 'awful' | 'bad' | 'okay' | 'good' | 'great';

function moodLabelKey(value: number): MoodLabelKey {
  return (['awful', 'bad', 'okay', 'good', 'great'] as const)[Math.max(0, Math.min(4, value - 1))];
}

export default function MoodScreen() {
  const colors = useColors();
  const accents = useTrackerAccents();
  const accent = accents.mood;
  const { t } = useTranslation();
  const fmt = useFormatters();
  const mood = useTrakl((s) => s.mood);
  const addMood = useTrakl((s) => s.addMood);
  const deleteMood = useTrakl((s) => s.deleteMood);
  const [formOpen, setFormOpen] = useState(false);
  const [active, setActive] = useState<MoodEntry | null>(null);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.add === '1') setFormOpen(true);
  }, [params.add]);

  const sorted = useMemo(
    () => [...mood].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [mood],
  );
  const today = todayMood(mood);
  const avg = avgMood(mood);

  const chartData = WEEKDAY.map((label, i) => {
    const iso = dayISO(-(6 - i));
    const target = new Date(iso).toDateString();
    const day = mood.filter((m) => new Date(m.date).toDateString() === target);
    const value = day.length ? day.reduce((s, m) => s + m.mood, 0) / day.length : 0;
    return { label, value: Math.round(value * 10) / 10 };
  });

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader title={t('moodScreen.title')} back />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5 pt-2">
            <Card elevated className="items-center p-6">
              <Caption>{t('moodScreen.todayMood')}</Caption>
              <ClashText weight="bold" style={{ fontSize: 64, marginTop: 8 }}>
                {today ? MOOD_EMOJI[today.mood - 1] : '—'}
              </ClashText>
              <InterText color={colors.muted} style={{ fontSize: 14, marginTop: 4 }}>
                {today
                  ? t(`moodScreen.labels.${moodLabelKey(today.mood)}` as ParseKeys)
                  : t('moodScreen.notLogged')}
              </InterText>
            </Card>
          </View>

          <View className="px-5 pt-6">
            <View className="flex-row gap-3">
              <Card className="flex-1 gap-1">
                <Caption fit>{t('moodScreen.weekAverage')}</Caption>
                <ClashText weight="bold" style={{ fontSize: 28 }}>
                  {avg > 0 ? `${avg}/5` : '—'}
                </ClashText>
              </Card>
              <Card className="flex-1 gap-1">
                <Caption fit>{t('moodScreen.checkIns')}</Caption>
                <ClashText weight="bold" style={{ fontSize: 28 }}>
                  {mood.length}
                </ClashText>
              </Card>
            </View>
          </View>

          <View className="px-5 pt-6">
            <SectionLabel>{t('moodScreen.last7Days')}</SectionLabel>
            <Card>
              <BarChart data={chartData} color={accent} showValue />
            </Card>
          </View>

          <View className="px-5 pt-6">
            <SectionLabel>{t('moodScreen.history')}</SectionLabel>
            <View className="gap-3">
              {sorted.map((m) => (
                <PressableScale
                  key={m.id}
                  feedback="card"
                  onPress={() => setActive(m)}
                  accessibilityRole="button"
                  accessibilityLabel={t(`moodScreen.labels.${moodLabelKey(m.mood)}` as ParseKeys)}
                >
                  <Card padded={false} className="p-4">
                    <View className="flex-row items-center">
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: withAlpha(accent, 0.1),
                        }}
                        className="items-center justify-center"
                      >
                        <ClashText style={{ fontSize: 24 }}>{MOOD_EMOJI[m.mood - 1]}</ClashText>
                      </View>
                      <View className="flex-1 px-3">
                        <ClashText weight="medium" style={{ fontSize: 15 }}>
                          {t(`moodScreen.labels.${moodLabelKey(m.mood)}` as ParseKeys)}
                        </ClashText>
                        {m.note ? (
                          <InterText
                            color={colors.muted}
                            style={{ fontSize: 12, marginTop: 2 }}
                            numberOfLines={1}
                          >
                            {m.note}
                          </InterText>
                        ) : null}
                      </View>
                      <InterText color={colors.muted} style={{ fontSize: 12 }}>
                        {fmt.date(m.date, { day: 'numeric', month: 'short' })}
                      </InterText>
                    </View>
                  </Card>
                </PressableScale>
              ))}
            </View>
          </View>

          <View className="px-5 pt-6">
            <PrimaryButton label={t('moodScreen.logMood')} onPress={() => setFormOpen(true)} />
          </View>
        </ScrollView>
        <AdBanner />
      </View>

      <MoodForm
        visible={formOpen}
        t={t}
        onClose={() => setFormOpen(false)}
        onSubmit={(entry) => {
          addMood(entry);
          setFormOpen(false);
        }}
      />

      <RowActionSheet
        visible={active != null}
        title={active ? t(`moodScreen.labels.${moodLabelKey(active.mood)}` as ParseKeys) : ''}
        subtitle={active?.note || undefined}
        deleteLabel={t('moodScreen.delete')}
        onDelete={() => {
          if (active) deleteMood(active.id);
          setActive(null);
        }}
        closeLabel={t('common.close')}
        onClose={() => setActive(null)}
      />
    </Screen>
  );
}

function MoodForm({
  visible,
  onClose,
  onSubmit,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<MoodEntry, 'id'>) => void;
  t: TFunction;
}) {
  const colors = useColors();
  const accents = useTrackerAccents();
  const accent = accents.mood;
  const [value, setValue] = useState(4);
  const [note, setNote] = useState('');

  const reset = () => {
    setValue(4);
    setNote('');
  };

  const submit = () => {
    onSubmit({ mood: value, note: note.trim(), date: new Date().toISOString() });
    reset();
  };

  return (
    <FormSheet
      visible={visible}
      title={t('forms.logMood')}
      submitLabel={t('forms.logMood')}
      onSubmit={submit}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <Field label={t('forms.howFeeling')}>
        <View className="flex-row justify-between">
          {MOOD_EMOJI.map((emoji, i) => {
            const v = i + 1;
            const sel = v === value;
            return (
              <PressableScale
                key={v}
                feedback="chip"
                onPress={() => setValue(v)}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: sel ? 2 : 1,
                  borderColor: sel ? accent : colors.border,
                  backgroundColor: sel ? withAlpha(accent, 0.12) : colors.surface,
                }}
              >
                <ClashText style={{ fontSize: 26 }}>{emoji}</ClashText>
              </PressableScale>
            );
          })}
        </View>
      </Field>
      <Field label={t('forms.note')}>
        <TextField value={note} onChangeText={setNote} placeholder={t('forms.notePlaceholder')} />
      </Field>
    </FormSheet>
  );
}

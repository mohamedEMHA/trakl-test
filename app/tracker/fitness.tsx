import { ScrollView, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Activity } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { AdBanner } from '@/components/AdBanner';
import { BarChart } from '@/components/Charts';
import { Card } from '@/components/Card';
import { Field, FormSheet, Stepper, TextField } from '@/components/FormSheet';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RowActionSheet } from '@/components/RowActionSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { SwipeableRow } from '@/components/SwipeableRow';
import { Caption, ClashText, InterText } from '@/components/Typography';
import { withAlpha } from '@/lib/trackers';
import { useFormatters } from '@/lib/format';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
import { dayISO } from '@/lib/seed';
import type { Workout } from '@/lib/types';
import type { Palette } from '@/lib/theme';

const WEEKDAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function isThisWeek(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 7 && diff >= 0;
}

function WorkoutRow({
  w,
  colors,
  accent,
  t,
  fmt,
  onDelete,
  onPress,
}: {
  w: Workout;
  colors: Palette;
  accent: string;
  t: TFunction;
  fmt: ReturnType<typeof useFormatters>;
  onDelete: () => void;
  onPress: () => void;
}) {
  return (
    <SwipeableRow
      right={{
        label: t('common.delete'),
        icon: 'trash',
        color: colors.destructive,
        onTrigger: onDelete,
      }}
    >
      <PressableScale feedback="card" onPress={onPress}>
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
              <Activity size={20} color={accent} strokeWidth={1.5} />
            </View>
            <View className="flex-1 px-3">
              <ClashText weight="medium" style={{ fontSize: 15 }} numberOfLines={1}>
                {w.name}
              </ClashText>
              <InterText color={colors.muted} style={{ fontSize: 12, marginTop: 2 }}>
                {fmt.date(w.date, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </InterText>
            </View>
            <View className="items-end">
              <InterText weight="medium" style={{ fontSize: 14 }}>
                {t('fitness.minutesShort', { count: w.durationMinutes })}
              </InterText>
              <InterText color={colors.muted} style={{ fontSize: 12, marginTop: 2 }}>
                {t('fitness.kcalShort', { count: w.kcal })}
              </InterText>
            </View>
          </View>
        </Card>
      </PressableScale>
    </SwipeableRow>
  );
}

export default function FitnessScreen() {
  const colors = useColors();
  const accents = useTrackerAccents();
  const { t } = useTranslation();
  const fmt = useFormatters();
  const fitnessAccent = accents.fitness;
  const workouts = useTrakl((s) => s.workouts);
  const addWorkout = useTrakl((s) => s.addWorkout);
  const deleteWorkout = useTrakl((s) => s.deleteWorkout);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Workout | null>(null);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.add === '1') setFormOpen(true);
  }, [params.add]);

  const week = workouts.filter((w) => isThisWeek(w.date));
  const weekKcal = week.reduce((s, w) => s + w.kcal, 0);

  const chartData = WEEKDAY.map((label, i) => {
    const iso = dayISO(-(6 - i));
    const target = new Date(iso).toDateString();
    const total = workouts
      .filter((w) => new Date(w.date).toDateString() === target)
      .reduce((s, w) => s + w.durationMinutes, 0);
    return { label, value: total };
  });

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader title={t('fitness.title')} back />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5 pt-2">
            <Card elevated className="p-6">
              <Caption>{t('fitness.thisWeek')}</Caption>
              <ClashText weight="bold" style={{ fontSize: 40, marginTop: 4 }}>
                {t('fitness.workoutsCount', { count: week.length })}
              </ClashText>
              <InterText color={colors.muted} style={{ fontSize: 14, marginTop: 4 }}>
                {t('fitness.kcalGain', { kcal: fmt.number(weekKcal) })}
              </InterText>
            </Card>
          </View>

          <View className="px-5 pt-6">
            <SectionLabel>{t('fitness.weeklyActivity')}</SectionLabel>
            <Card>
              <BarChart data={chartData} color={fitnessAccent} unit="m" showValue />
            </Card>
          </View>

          <View className="px-5 pt-6">
            <SectionLabel>{t('fitness.recentWorkouts')}</SectionLabel>
            <View className="gap-3">
              {workouts.map((w) => (
                <WorkoutRow
                  key={w.id}
                  w={w}
                  colors={colors}
                  accent={fitnessAccent}
                  t={t}
                  fmt={fmt}
                  onDelete={() => deleteWorkout(w.id)}
                  onPress={() => setSelected(w)}
                />
              ))}
            </View>
          </View>

          <View className="px-5 pt-6">
            <PrimaryButton label={t('fitness.logWorkout')} onPress={() => setFormOpen(true)} />
          </View>
        </ScrollView>
        <AdBanner />
      </View>
      <WorkoutForm
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        defaultName={t('fitness.defaultWorkout')}
        t={t}
        onSubmit={(w) => {
          addWorkout(w);
          setFormOpen(false);
        }}
      />
      <RowActionSheet
        visible={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        subtitle={
          selected
            ? `${t('fitness.minutesShort', { count: selected.durationMinutes })} · ${t('fitness.kcalShort', { count: selected.kcal })}`
            : undefined
        }
        deleteLabel={t('common.delete')}
        onDelete={() => {
          if (selected) deleteWorkout(selected.id);
        }}
        closeLabel={t('common.close')}
      />
    </Screen>
  );
}

function WorkoutForm({
  visible,
  onClose,
  onSubmit,
  defaultName,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (w: Omit<Workout, 'id'>) => void;
  defaultName: string;
  t: TFunction;
}) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(35);
  const [kcal, setKcal] = useState(300);

  const reset = () => {
    setName('');
    setDuration(35);
    setKcal(300);
  };

  const submit = () => {
    onSubmit({
      name: name.trim() || defaultName,
      date: new Date().toISOString(),
      durationMinutes: duration,
      kcal,
    });
    reset();
  };

  return (
    <FormSheet
      visible={visible}
      title={t('forms.logWorkout')}
      submitLabel={t('forms.logWorkout')}
      onSubmit={submit}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <Field label={t('forms.workoutName')}>
        <TextField value={name} onChangeText={setName} placeholder={defaultName} autoFocus />
      </Field>
      <Field label={t('forms.duration')}>
        <Stepper value={duration} onChange={setDuration} min={5} max={240} step={5} suffix="min" />
      </Field>
      <Field label={t('forms.calories')}>
        <Stepper value={kcal} onChange={setKcal} min={0} max={2000} step={10} suffix="kcal" />
      </Field>
    </FormSheet>
  );
}

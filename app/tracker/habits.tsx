import { ScrollView, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AdBanner } from '@/components/AdBanner';
import { Card } from '@/components/Card';
import { Confetti } from '@/components/Confetti';
import { Field, FormSheet, TextField } from '@/components/FormSheet';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressBar } from '@/components/Progress';
import { RowActionSheet } from '@/components/RowActionSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { Caption, ClashText, InterText } from '@/components/Typography';
import { CheckCircle2, Flame, Repeat2, Zap } from '@/components/icons';
import { Circle } from 'lucide-react-native';
import { withAlpha } from '@/lib/trackers';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
import { haptics } from '@/lib/haptics';
import { WEEKLY_TARGET, bestStreak, habitStreak, habitsToday, weekCount } from '@/lib/stats';
import { dayISO } from '@/lib/seed';
import type { Habit } from '@/lib/types';

function HabitRow({
  habit,
  onToggle,
  onOpen,
}: {
  habit: Habit;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  const done = habit.completions[dayISO(0)];
  const week = weekCount(habit);
  const streak = habitStreak(habit);
  const targetHit = week >= WEEKLY_TARGET;
  const cadenceLabel = habit.cadence === 'Daily' ? t('habits.daily') : habit.cadence;
  return (
    <PressableScale
      feedback="card"
      onPress={onOpen}
      onLongPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={habit.name}
    >
      <Card padded={false} className="overflow-hidden">
        <View className="flex-row items-center">
          <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: habit.color }} />
          <View className="flex-1 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center gap-3 pr-3">
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: withAlpha(habit.color, 0.1),
                  }}
                  className="items-center justify-center"
                >
                  <Repeat2 size={18} color={habit.color} strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <ClashText weight="medium" style={{ fontSize: 15 }} numberOfLines={1}>
                    {habit.name}
                  </ClashText>
                  <View className="mt-1 flex-row items-center gap-2">
                    <InterText color={colors.muted} style={{ fontSize: 12 }}>
                      {cadenceLabel}
                    </InterText>
                    {streak > 0 ? (
                      <View className="flex-row items-center gap-0.5">
                        <Flame size={12} color={habit.color} strokeWidth={2} />
                        <InterText weight="medium" color={habit.color} style={{ fontSize: 12 }}>
                          {t('habits.streakDays', { count: streak })}
                        </InterText>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
              <PressableScale
                feedback="icon"
                onPress={onToggle}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Toggle ${habit.name}`}
              >
                {done ? (
                  <CheckCircle2 size={28} color={habit.color} strokeWidth={1.5} />
                ) : (
                  <Circle size={28} color={colors.faint} strokeWidth={1.5} />
                )}
              </PressableScale>
            </View>
            <View className="mt-3 gap-1.5">
              <View className="flex-row items-center justify-between">
                <Caption color={colors.muted}>{t('habits.weekProgress', { count: week })}</Caption>
                {targetHit ? (
                  <View
                    style={{
                      backgroundColor: withAlpha(habit.color, 0.14),
                      borderRadius: 999,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <InterText weight="semibold" color={habit.color} style={{ fontSize: 10 }}>
                      {t('habits.targetHit')}
                    </InterText>
                  </View>
                ) : null}
              </View>
              <ProgressBar progress={(week / WEEKLY_TARGET) * 100} color={habit.color} />
            </View>
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}

const DAY_LABELS: { key: string; label: string }[] = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
];

function cellColor(level: number, surface2: string, accent: string): string {
  if (level === 0) return surface2;
  if (level <= 0.34) return withAlpha(accent, 0.3);
  if (level <= 0.67) return withAlpha(accent, 0.6);
  return accent;
}

function Heatmap({ habits }: { habits: Habit[] }) {
  const colors = useColors();
  const accents = useTrackerAccents();
  // Build last 28 days as 4 weeks x 7 days (Mon-Sun)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDow = (today.getDay() + 6) % 7; // 0 = Mon

  const weeks: { iso: string; level: number; isToday: boolean }[][] = [];
  for (let w = 3; w >= 0; w--) {
    const row: { iso: string; level: number; isToday: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const offset = -(w * 7 + (todayDow - d));
      const iso = dayISO(offset);
      const completed = habits.filter((h) => h.completions[iso]).length;
      const level = habits.length ? completed / habits.length : 0;
      row.push({ iso, level, isToday: offset === 0 });
    }
    weeks.push(row);
  }

  return (
    <View className="gap-2">
      <View className="flex-row justify-between px-0.5">
        {DAY_LABELS.map((day) => (
          <View key={day.key} style={{ width: 32 }} className="items-center">
            <Caption color={colors.faint} style={{ fontSize: 10 }}>
              {day.label}
            </Caption>
          </View>
        ))}
      </View>
      {weeks.map((row) => (
        <View key={row[0]?.iso} className="flex-row justify-between">
          {row.map((cell) => (
            <View
              key={cell.iso}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: cellColor(cell.level, colors.surface2, accents.habits),
                borderWidth: cell.isToday ? 1 : 0,
                borderColor: colors.text,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function HabitsScreen() {
  const habits = useTrakl((s) => s.habits);
  const toggleHabitToday = useTrakl((s) => s.toggleHabitToday);
  const addHabit = useTrakl((s) => s.addHabit);
  const updateHabit = useTrakl((s) => s.updateHabit);
  const deleteHabit = useTrakl((s) => s.deleteHabit);
  const colors = useColors();
  const { t } = useTranslation();
  const streak = bestStreak(habits);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [actionTarget, setActionTarget] = useState<Habit | null>(null);
  const params = useLocalSearchParams();

  // Celebrate when the last remaining habit of the day is completed.
  const status = habitsToday(habits);
  const allDone = status.total > 0 && status.done === status.total;
  const [celebrate, setCelebrate] = useState(false);
  const prevAllDone = useRef(allDone);
  useEffect(() => {
    if (allDone && !prevAllDone.current) setCelebrate(true);
    prevAllDone.current = allDone;
  }, [allDone]);

  useEffect(() => {
    if (params.add === '1') setFormOpen(true);
  }, [params.add]);

  const onToggle = (id: string) => {
    haptics.tapMedium();
    toggleHabitToday(id);
  };

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader
          title={t('habits.title')}
          back
          right={
            <View
              style={{ backgroundColor: colors.ink, borderRadius: 999 }}
              className="flex-row items-center gap-1 px-3 py-1.5"
            >
              <Zap size={14} color={colors.bg} strokeWidth={2} />
              <ClashText weight="bold" color={colors.bg} style={{ fontSize: 14 }}>
                {streak}
              </ClashText>
            </View>
          }
        />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-3 px-5 pt-2">
            {habits.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                onToggle={() => onToggle(h.id)}
                onOpen={() => setActionTarget(h)}
              />
            ))}
          </View>

          <View className="px-5 pt-6">
            <SectionLabel>{t('habits.thisMonth')}</SectionLabel>
            <Card>
              <Heatmap habits={habits} />
            </Card>
          </View>

          <View className="px-5 pt-6">
            <PrimaryButton
              label={t('habits.newHabit')}
              onPress={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            />
          </View>
        </ScrollView>
        <AdBanner />
      </View>
      <HabitForm
        visible={formOpen}
        habit={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={(name, color) => {
          haptics.tapMedium();
          if (editing) updateHabit(editing.id, { name, color });
          else addHabit(name, color);
          setFormOpen(false);
          setEditing(null);
        }}
      />
      <RowActionSheet
        visible={actionTarget !== null}
        onClose={() => setActionTarget(null)}
        title={actionTarget?.name ?? ''}
        subtitle={
          actionTarget
            ? actionTarget.cadence === 'Daily'
              ? t('habits.daily')
              : actionTarget.cadence
            : undefined
        }
        actions={[
          {
            label: t('common.edit'),
            onPress: () => {
              const target = actionTarget;
              setActionTarget(null);
              setEditing(target);
              setFormOpen(true);
            },
          },
        ]}
        deleteLabel={t('common.delete')}
        onDelete={() => {
          if (actionTarget) deleteHabit(actionTarget.id);
          setActionTarget(null);
        }}
        closeLabel={t('common.close')}
      />
      <Confetti show={celebrate} onDone={() => setCelebrate(false)} />
    </Screen>
  );
}

const HABIT_COLORS = ['#2D7A4F', '#2C5F8A', '#3A5A8A', '#6B4C8A', '#B8860B', '#8A3A3A', '#8A4A2F'];

function HabitForm({
  visible,
  habit,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  habit: Habit | null;
  onClose: () => void;
  onSubmit: (name: string, color: string) => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const [name, setName] = useState('');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const valid = name.trim().length > 0;
  const isEdit = habit !== null;

  useEffect(() => {
    if (visible) {
      setName(habit?.name ?? '');
      setColor(habit?.color ?? HABIT_COLORS[0]);
    }
  }, [visible, habit]);

  const reset = () => {
    setName('');
    setColor(HABIT_COLORS[0]);
  };

  const submit = () => {
    if (!valid) return;
    onSubmit(name.trim(), color);
    reset();
  };

  return (
    <FormSheet
      visible={visible}
      title={isEdit ? t('habits.editHabit') : t('forms.newHabit')}
      submitLabel={isEdit ? t('common.save') : t('forms.addHabit')}
      submitDisabled={!valid}
      onSubmit={submit}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <Field label={t('forms.habitName')}>
        <TextField
          value={name}
          onChangeText={setName}
          placeholder={t('forms.habitName')}
          autoFocus
        />
      </Field>
      <Field label={t('forms.color')}>
        <View className="flex-row flex-wrap gap-3">
          {HABIT_COLORS.map((c) => (
            <PressableScale
              feedback="chip"
              key={c}
              onPress={() => setColor(c)}
              accessibilityRole="button"
              accessibilityLabel={`Color ${c}`}
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                backgroundColor: c,
                borderWidth: color === c ? 3 : 0,
                borderColor: colors.text,
              }}
            />
          ))}
        </View>
      </Field>
    </FormSheet>
  );
}

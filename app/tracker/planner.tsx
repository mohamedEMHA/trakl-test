import { ScrollView, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AdBanner } from '@/components/AdBanner';
import { ChipSelect, Field, FormSheet, Stepper, TextField } from '@/components/FormSheet';
import { PressableScale } from '@/components/PressableScale';
import { Fab, Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Caption, InterText } from '@/components/Typography';
import { useFormatters } from '@/lib/format';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
import type { PlannerEvent } from '@/lib/types';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const WEEK_OFFSETS = [-1, 0, 1] as const;
const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 56;

function hourLabel(h: number): string {
  const period = h < 12 ? 'am' : 'pm';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${period}`;
}

function EventBlock({ event }: { event: PlannerEvent }) {
  const top = (event.startHour - START_HOUR) * HOUR_HEIGHT;
  const height = event.durationHours * HOUR_HEIGHT - 6;
  return (
    <View
      style={{
        position: 'absolute',
        top: top + 3,
        left: 0,
        right: 0,
        height,
        backgroundColor: event.color,
        borderRadius: 12,
        opacity: 0.92,
        padding: 10,
      }}
    >
      <InterText weight="semibold" color="#FFFFFF" style={{ fontSize: 13 }} numberOfLines={1}>
        {event.title}
      </InterText>
      <InterText color="rgba(255,255,255,0.85)" style={{ fontSize: 11, marginTop: 2 }}>
        {event.durationHours}h
      </InterText>
    </View>
  );
}

function weekLabel(offset: number, fmt: ReturnType<typeof useFormatters>): string {
  const base = new Date();
  const dow = (base.getDay() + 6) % 7;
  const monday = new Date(base);
  monday.setDate(base.getDate() - dow + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const m = fmt.date(monday, { month: 'short' });
  return `${m} ${monday.getDate()}-${sunday.getDate()}`;
}

function weekChoiceLabel(offset: number, t: ReturnType<typeof useTranslation>['t']): string {
  if (offset === -1) return t('planner.lastWeek');
  if (offset === 1) return t('planner.nextWeek');
  return t('planner.thisWeek');
}

export default function PlannerScreen() {
  const colors = useColors();
  const accents = useTrackerAccents();
  const { t } = useTranslation();
  const fmt = useFormatters();
  const planner = useTrakl((s) => s.planner);
  const addPlannerEvent = useTrakl((s) => s.addPlannerEvent);
  const [selectedDay, setSelectedDay] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.add === '1') setFormOpen(true);
  }, [params.add]);

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const dayEvents = planner.filter((e) => e.day === selectedDay && e.weekOffset === weekOffset);

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader title={t('planner.title')} back />
        <View className="flex-row items-center justify-between px-5 pb-2">
          <PressableScale
            feedback="icon"
            onPress={() => setWeekOffset((w) => w - 1)}
            hitSlop={8}
            accessibilityLabel={t('planner.previousWeek')}
            accessibilityRole="button"
          >
            <ArrowLeft size={20} color={colors.text} strokeWidth={1.5} />
          </PressableScale>
          <InterText weight="medium" style={{ fontSize: 14 }}>
            {weekLabel(weekOffset, fmt)}
          </InterText>
          <PressableScale
            feedback="icon"
            onPress={() => setWeekOffset((w) => w + 1)}
            hitSlop={8}
            accessibilityLabel={t('planner.nextWeek')}
            accessibilityRole="button"
          >
            <ArrowRight size={20} color={colors.text} strokeWidth={1.5} />
          </PressableScale>
        </View>

        <View className="flex-row justify-between px-5 pb-3">
          {DAY_KEYS.map((dk, i) => {
            const active = selectedDay === i;
            return (
              <PressableScale
                feedback="chip"
                key={dk}
                onPress={() => setSelectedDay(i)}
                className="items-center"
                style={{
                  paddingBottom: 6,
                  borderBottomWidth: 2,
                  borderBottomColor: active ? accents.planner : 'transparent',
                }}
                accessibilityRole="button"
              >
                <InterText
                  weight={active ? 'semibold' : 'regular'}
                  color={active ? colors.text : colors.muted}
                  style={{ fontSize: 13 }}
                >
                  {t(`planner.${dk}`)}
                </InterText>
              </PressableScale>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row px-5 pt-2">
            <View style={{ width: 44 }}>
              {hours.map((h) => (
                <View key={h} style={{ height: HOUR_HEIGHT }}>
                  <Caption color={colors.muted} style={{ fontSize: 10 }}>
                    {hourLabel(h)}
                  </Caption>
                </View>
              ))}
            </View>
            <View className="flex-1" style={{ height: hours.length * HOUR_HEIGHT }}>
              {hours.map((h) => (
                <View
                  key={h}
                  style={{
                    height: HOUR_HEIGHT,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                />
              ))}
              {dayEvents.map((e) => (
                <EventBlock key={e.id} event={e} />
              ))}
            </View>
          </View>
        </ScrollView>

        <Fab onPress={() => setFormOpen(true)} bottom={68} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <AdBanner />
        </View>
      </View>
      <PlannerForm
        visible={formOpen}
        defaultDay={selectedDay}
        defaultWeekOffset={weekOffset}
        accentColor={accents.planner}
        onClose={() => setFormOpen(false)}
        onSubmit={(e) => {
          addPlannerEvent(e);
          setFormOpen(false);
        }}
      />
    </Screen>
  );
}

function PlannerForm({
  visible,
  defaultDay,
  defaultWeekOffset,
  accentColor,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  defaultDay: number;
  defaultWeekOffset: number;
  accentColor: string;
  onClose: () => void;
  onSubmit: (e: Omit<PlannerEvent, 'id'>) => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [day, setDay] = useState(defaultDay);
  const [weekOffset, setWeekOffset] = useState(defaultWeekOffset);
  const [startHour, setStartHour] = useState(9);
  const [durationHours, setDurationHours] = useState(1);
  const valid = title.trim().length > 0;

  useEffect(() => {
    if (visible) {
      setDay(defaultDay);
      setWeekOffset(defaultWeekOffset);
    }
  }, [visible, defaultDay, defaultWeekOffset]);

  const reset = () => {
    setTitle('');
    setDay(defaultDay);
    setWeekOffset(defaultWeekOffset);
    setStartHour(9);
    setDurationHours(1);
  };

  const submit = () => {
    if (!valid) return;
    onSubmit({
      title: title.trim(),
      day,
      weekOffset,
      startHour,
      durationHours,
      color: accentColor,
    });
    reset();
  };

  const weekChoices = WEEK_OFFSETS.map((off) => ({
    value: String(off),
    label: weekChoiceLabel(off, t),
  }));

  return (
    <FormSheet
      visible={visible}
      title={t('forms.newEvent')}
      submitLabel={t('forms.addEvent')}
      submitDisabled={!valid}
      onSubmit={submit}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <Field label={t('forms.eventTitle')}>
        <TextField
          value={title}
          onChangeText={setTitle}
          placeholder={t('forms.eventTitle')}
          autoFocus
        />
      </Field>
      <Field label={t('forms.week')}>
        <ChipSelect
          choices={weekChoices}
          selected={String(weekOffset)}
          onSelect={(v) => setWeekOffset(Number(v))}
        />
      </Field>
      <Field label={t('forms.day')}>
        <ChipSelect
          choices={DAY_KEYS.map((dk, i) => ({ value: String(i), label: t(`planner.${dk}`) }))}
          selected={String(day)}
          onSelect={(v) => setDay(Number(v))}
        />
      </Field>
      <Field label={`${t('forms.startHour')} — ${hourLabel(startHour)}`}>
        <Stepper
          value={startHour}
          onChange={setStartHour}
          min={START_HOUR}
          max={END_HOUR}
          suffix="h"
        />
      </Field>
      <Field label={t('forms.durationHours')}>
        <Stepper value={durationHours} onChange={setDurationHours} min={1} max={8} suffix="h" />
      </Field>
    </FormSheet>
  );
}

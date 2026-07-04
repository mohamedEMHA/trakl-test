import { ScrollView, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AdBanner } from '@/components/AdBanner';
import { BarChart } from '@/components/Charts';
import { Card } from '@/components/Card';
import { Field, FormSheet, Stepper, TextField } from '@/components/FormSheet';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { Caption, ClashText, InterText } from '@/components/Typography';
import { Clock } from '@/components/icons';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
import { avgSleepHours, fmtSleep } from '@/lib/stats';

const WEEKDAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function SleepScreen() {
  const colors = useColors();
  const accents = useTrackerAccents();
  const { t } = useTranslation();
  const sleep = useTrakl((s) => s.sleep);
  const addSleep = useTrakl((s) => s.addSleep);
  const [formOpen, setFormOpen] = useState(false);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.add === '1') setFormOpen(true);
  }, [params.add]);

  const sorted = [...sleep].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const last = sorted[0];

  const avg = avgSleepHours(sleep);
  const best = sorted.reduce((m, e) => Math.max(m, e.durationMinutes), 0);

  const chartData = [...sorted]
    .slice(0, 7)
    .toReversed()
    .map((e) => ({
      label: WEEKDAY[new Date(e.date).getDay() === 0 ? 6 : new Date(e.date).getDay() - 1],
      value: Math.round((e.durationMinutes / 60) * 10) / 10,
    }));

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader title={t('sleepScreen.title')} back />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5 pt-2">
            <Card elevated className="p-6">
              <Caption>{t('sleepScreen.lastNight')}</Caption>
              <ClashText weight="bold" style={{ fontSize: 48, marginTop: 4 }}>
                {last ? fmtSleep(last.durationMinutes) : '—'}
              </ClashText>
              <View className="mt-3 flex-row gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={20}
                    color={last && i <= last.quality ? colors.text : colors.border}
                    fill={last && i <= last.quality ? colors.text : 'transparent'}
                    strokeWidth={1.5}
                  />
                ))}
              </View>
            </Card>
          </View>

          <View className="px-5 pt-3">
            <Card className="gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Clock size={18} color={colors.muted} strokeWidth={1.5} />
                  <InterText style={{ fontSize: 14 }}>{t('sleepScreen.bedtime')}</InterText>
                </View>
                <InterText weight="medium" style={{ fontSize: 14 }}>
                  {last?.bedtime ?? '23:00'}
                </InterText>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Clock size={18} color={colors.muted} strokeWidth={1.5} />
                  <InterText style={{ fontSize: 14 }}>{t('sleepScreen.wakeTime')}</InterText>
                </View>
                <InterText weight="medium" style={{ fontSize: 14 }}>
                  {last?.wake ?? '06:30'}
                </InterText>
              </View>
              <PrimaryButton label={t('sleepScreen.logSleep')} onPress={() => setFormOpen(true)} />
            </Card>
          </View>

          <View className="px-5 pt-6">
            <SectionLabel>{t('sleepScreen.last7Nights')}</SectionLabel>
            <Card>
              <BarChart data={chartData} color={accents.sleep} unit="h" showValue />
            </Card>
          </View>

          <View className="px-5 pt-6">
            <View className="flex-row gap-3">
              <Card className="flex-1 gap-1">
                <Caption fit>{t('sleepScreen.average')}</Caption>
                <ClashText weight="bold" style={{ fontSize: 28 }}>
                  {avg}h
                </ClashText>
              </Card>
              <Card className="flex-1 gap-1">
                <Caption fit>{t('sleepScreen.bestNight')}</Caption>
                <ClashText weight="bold" style={{ fontSize: 28 }}>
                  {fmtSleep(best)}
                </ClashText>
              </Card>
            </View>
          </View>
        </ScrollView>
        <AdBanner />
      </View>
      <SleepForm
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(entry) => {
          addSleep(entry);
          setFormOpen(false);
        }}
      />
    </Screen>
  );
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Parse 'HH:mm' into minutes-since-midnight, or null when malformed. */
function parseTime(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Format minutes-since-midnight (wraps across 24h) back into 'HH:mm'. */
function formatTime(totalMinutes: number): string {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
}

function SleepForm({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (entry: {
    date: string;
    durationMinutes: number;
    quality: number;
    bedtime: string;
    wake: string;
  }) => void;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  const [hours, setHours] = useState(7);
  const [minutes, setMinutes] = useState(30);
  const [quality, setQuality] = useState(4);
  const [bedtime, setBedtime] = useState('23:00');
  const [wake, setWake] = useState('06:30');

  const duration = hours * 60 + minutes;

  // Keep bedtime, wake and duration consistent. Editing the duration or the
  // bedtime recomputes the wake time; editing the wake time recomputes bedtime.
  const applyDuration = (mins: number) => {
    const bed = parseTime(bedtime);
    if (bed !== null) setWake(formatTime(bed + mins));
  };

  const setHoursSync = (h: number) => {
    setHours(h);
    applyDuration(h * 60 + minutes);
  };

  const setMinutesSync = (m: number) => {
    setMinutes(m);
    applyDuration(hours * 60 + m);
  };

  const setBedtimeSync = (value: string) => {
    setBedtime(value);
    const bed = parseTime(value);
    if (bed !== null) setWake(formatTime(bed + duration));
  };

  const setWakeSync = (value: string) => {
    setWake(value);
    const w = parseTime(value);
    if (w !== null) setBedtime(formatTime(w - duration));
  };

  const reset = () => {
    setHours(7);
    setMinutes(30);
    setQuality(4);
    setBedtime('23:00');
    setWake('06:30');
  };

  const submit = () => {
    onSubmit({
      date: new Date().toISOString(),
      durationMinutes: duration,
      quality,
      bedtime,
      wake,
    });
    reset();
  };

  return (
    <FormSheet
      visible={visible}
      title={t('forms.logSleep')}
      submitLabel={t('forms.logSleep')}
      onSubmit={submit}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <Field label={`${t('forms.sleepDuration')} — ${hours}h ${pad(minutes)}m`}>
        <View className="gap-3">
          <Stepper value={hours} onChange={setHoursSync} min={0} max={14} suffix="h" />
          <Stepper value={minutes} onChange={setMinutesSync} min={0} max={55} step={5} suffix="m" />
        </View>
      </Field>
      <Field label={t('forms.quality')}>
        <View className="flex-row gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <PressableScale
              key={i}
              feedback="chip"
              onPress={() => setQuality(i)}
              accessibilityRole="button"
              accessibilityLabel={`Quality ${i}`}
            >
              <Star
                size={32}
                color={i <= quality ? colors.text : colors.border}
                fill={i <= quality ? colors.text : 'transparent'}
                strokeWidth={1.5}
              />
            </PressableScale>
          ))}
        </View>
      </Field>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label={t('forms.bedtime')}>
            <TextField value={bedtime} onChangeText={setBedtimeSync} placeholder="23:00" />
          </Field>
        </View>
        <View className="flex-1">
          <Field label={t('forms.wake')}>
            <TextField value={wake} onChangeText={setWakeSync} placeholder="06:30" />
          </Field>
        </View>
      </View>
    </FormSheet>
  );
}

import { ScrollView, View } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Droplet, Pencil, RotateCcw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AdBanner } from '@/components/AdBanner';
import { BarChart } from '@/components/Charts';
import { Card } from '@/components/Card';
import { Field, FormSheet, Stepper } from '@/components/FormSheet';
import { PressableScale } from '@/components/PressableScale';
import { ProgressRing } from '@/components/Progress';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { Caption, ClashText, InterText } from '@/components/Typography';
import { withAlpha } from '@/lib/trackers';
import { haptics } from '@/lib/haptics';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
import { dayISO } from '@/lib/seed';
import { waterToday } from '@/lib/stats';

const WEEKDAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function WaterScreen() {
  const colors = useColors();
  const accents = useTrackerAccents();
  const accent = accents.water;
  const { t } = useTranslation();
  const water = useTrakl((s) => s.water);
  const addWater = useTrakl((s) => s.addWater);
  const resetToday = useTrakl((s) => s.resetWaterToday);
  const waterGoal = useTrakl((s) => s.waterGoal);
  const setWaterGoal = useTrakl((s) => s.setWaterGoal);
  const params = useLocalSearchParams();
  const didAutoAdd = useRef(false);
  const [goalOpen, setGoalOpen] = useState(false);

  useEffect(() => {
    if (params.add === '1' && !didAutoAdd.current) {
      didAutoAdd.current = true;
      addWater(1);
    }
  }, [params.add, addWater]);

  const today = waterToday(water);
  const progress = Math.min(100, Math.round((today / waterGoal) * 100));
  const remaining = Math.max(0, waterGoal - today);

  const chartData = useMemo(
    () =>
      WEEKDAY.map((label, i) => {
        const iso = dayISO(-(6 - i));
        const target = new Date(iso).toDateString();
        const value = water
          .filter((w) => new Date(w.date).toDateString() === target)
          .reduce((s, w) => s + w.glasses, 0);
        return { label, value };
      }),
    [water],
  );

  const weekAvg = useMemo(() => {
    const total = chartData.reduce((s, d) => s + d.value, 0);
    return Math.round((total / 7) * 10) / 10;
  }, [chartData]);

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader
          title={t('waterScreen.title')}
          back
          right={
            <PressableScale
              feedback="icon"
              onPress={() => {
                haptics.tapLight();
                resetToday();
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('waterScreen.reset')}
            >
              <RotateCcw size={20} color={colors.muted} strokeWidth={1.6} />
            </PressableScale>
          }
        />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5 pt-2">
            <Card elevated className="items-center p-6">
              <ProgressRing
                size={160}
                stroke={14}
                progress={progress}
                color={accent}
                label={`${today}`}
              />
              <InterText color={colors.muted} style={{ fontSize: 14, marginTop: 12 }}>
                {t('waterScreen.ofGoal', { count: today, goal: waterGoal })}
              </InterText>
              <InterText weight="medium" color={accent} style={{ fontSize: 13, marginTop: 4 }}>
                {remaining > 0
                  ? t('waterScreen.remaining', { count: remaining })
                  : t('waterScreen.goalReached')}
              </InterText>
            </Card>
          </View>

          <View className="px-5 pt-6">
            <SectionLabel>{t('waterScreen.addWater')}</SectionLabel>
            <View className="flex-row gap-3">
              {[1, 2, 3].map((n) => (
                <PressableScale
                  key={n}
                  feedback="card"
                  onPress={() => {
                    haptics.tapMedium();
                    addWater(n);
                  }}
                  className="flex-1"
                  accessibilityRole="button"
                  accessibilityLabel={t('waterScreen.addGlasses', { count: n })}
                  style={{
                    backgroundColor: withAlpha(accent, 0.1),
                    borderWidth: 1,
                    borderColor: withAlpha(accent, 0.25),
                    borderRadius: 16,
                    paddingVertical: 18,
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Droplet
                    size={26}
                    color={accent}
                    strokeWidth={1.6}
                    fill={withAlpha(accent, 0.3)}
                  />
                  <ClashText weight="medium" style={{ fontSize: 16 }}>
                    +{n}
                  </ClashText>
                </PressableScale>
              ))}
            </View>
          </View>

          <View className="px-5 pt-6">
            <SectionLabel>{t('waterScreen.last7Days')}</SectionLabel>
            <Card>
              <BarChart data={chartData} color={accent} showValue />
            </Card>
          </View>

          <View className="px-5 pt-6">
            <View className="flex-row gap-3">
              <PressableScale
                feedback="card"
                onPress={() => setGoalOpen(true)}
                className="flex-1"
                accessibilityRole="button"
                accessibilityLabel={t('waterScreen.editGoal')}
              >
                <Card className="flex-1 justify-between gap-3" style={{ minHeight: 116 }}>
                  <View className="flex-row items-center justify-between">
                    <Caption fit style={{ flexShrink: 1 }}>
                      {t('waterScreen.dailyGoal')}
                    </Caption>
                    <Pencil size={14} color={colors.muted} strokeWidth={1.6} />
                  </View>
                  <View>
                    <ClashText weight="bold" style={{ fontSize: 34 }} numberOfLines={1}>
                      {waterGoal}
                    </ClashText>
                    <InterText color={colors.muted} style={{ fontSize: 12, marginTop: 2 }}>
                      {t('waterScreen.glassesUnit')}
                    </InterText>
                  </View>
                </Card>
              </PressableScale>
              <Card className="flex-1 justify-between gap-3" style={{ minHeight: 116 }}>
                <Caption fit>{t('waterScreen.weekAverage')}</Caption>
                <View>
                  <ClashText weight="bold" style={{ fontSize: 34 }} numberOfLines={1}>
                    {weekAvg}
                  </ClashText>
                  <InterText color={colors.muted} style={{ fontSize: 12, marginTop: 2 }}>
                    {t('waterScreen.glassesUnit')}
                  </InterText>
                </View>
              </Card>
            </View>
          </View>
        </ScrollView>
        <AdBanner />
      </View>
      <GoalForm
        visible={goalOpen}
        initial={waterGoal}
        onClose={() => setGoalOpen(false)}
        onSubmit={(g) => {
          setWaterGoal(g);
          setGoalOpen(false);
        }}
      />
    </Screen>
  );
}

function GoalForm({
  visible,
  initial,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  initial: number;
  onClose: () => void;
  onSubmit: (goal: number) => void;
}) {
  const { t } = useTranslation();
  const [goal, setGoal] = useState(initial);

  useEffect(() => {
    if (visible) setGoal(initial);
  }, [visible, initial]);

  return (
    <FormSheet
      visible={visible}
      title={t('waterScreen.editGoal')}
      submitLabel={t('common.save')}
      onSubmit={() => onSubmit(goal)}
      onClose={onClose}
    >
      <Field label={t('waterScreen.dailyGoal')}>
        <Stepper
          value={goal}
          onChange={setGoal}
          min={1}
          max={30}
          suffix={t('waterScreen.glasses')}
        />
      </Field>
    </FormSheet>
  );
}

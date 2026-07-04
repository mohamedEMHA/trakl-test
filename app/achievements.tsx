import { ScrollView, View } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Award, Check, Crown, Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { ParseKeys } from 'i18next';

import { AdBanner } from '@/components/AdBanner';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Confetti } from '@/components/Confetti';
import { PressableScale } from '@/components/PressableScale';
import { ProgressBar } from '@/components/Progress';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { Caption, InterText } from '@/components/Typography';
import { Card } from '@/components/Card';
import { Zap } from '@/components/icons';
import { useColors } from '@/lib/theme';
import type { Palette } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
import { computeAchievements } from '@/lib/achievements';
import type { ComputedAchievement } from '@/lib/achievements';
import { bestStreak } from '@/lib/stats';

type Tab = 'unlocked' | 'locked';

function Badge({ a, name, colors }: { a: ComputedAchievement; name: string; colors: Palette }) {
  return (
    <View style={{ width: '31%' }} className="items-center gap-2">
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 999,
          backgroundColor: a.unlocked ? colors.surface : colors.surface2,
          borderWidth: a.unlocked ? 2 : 1,
          borderColor: a.unlocked ? colors.text : colors.border,
        }}
        className="items-center justify-center"
      >
        {a.unlocked ? (
          <Award size={30} color={colors.text} strokeWidth={1.5} />
        ) : (
          <Lock size={26} color={colors.faint} strokeWidth={1.5} />
        )}
      </View>
      <Caption
        color={a.unlocked ? colors.muted : colors.faint}
        style={{ fontSize: 10, textAlign: 'center' }}
      >
        {name}
      </Caption>
      {!a.unlocked ? (
        <View className="w-full gap-1">
          <ProgressBar progress={a.progress * 100} height={4} />
          <Caption color={colors.faint} style={{ fontSize: 9, textAlign: 'center' }}>
            {a.value} / {a.goal}
          </Caption>
        </View>
      ) : null}
    </View>
  );
}

export default function AchievementsScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const habits = useTrakl((s) => s.habits);
  const tasks = useTrakl((s) => s.tasks);
  const transactions = useTrakl((s) => s.transactions);
  const goals = useTrakl((s) => s.goals);
  const sleep = useTrakl((s) => s.sleep);
  const workouts = useTrakl((s) => s.workouts);
  const customTrackers = useTrakl((s) => s.customTrackers);
  const [tab, setTab] = useState<Tab>('unlocked');

  const achievements = useMemo(
    () =>
      computeAchievements({
        transactions,
        habits,
        tasks,
        goals,
        sleep,
        workouts,
        customTrackers,
      }),
    [transactions, habits, tasks, goals, sleep, workouts, customTrackers],
  );

  const nameOf = (a: ComputedAchievement) => t(`achievements.defs.${a.id}.name` as ParseKeys);
  const descOf = (a: ComputedAchievement) => t(`achievements.defs.${a.id}.desc` as ParseKeys);

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);
  const shown = tab === 'unlocked' ? unlocked : locked;

  // Celebrate when the unlocked count grows while viewing the screen.
  const [celebrate, setCelebrate] = useState(false);
  const prevUnlocked = useRef(unlocked.length);
  useEffect(() => {
    if (unlocked.length > prevUnlocked.current) setCelebrate(true);
    prevUnlocked.current = unlocked.length;
  }, [unlocked.length]);

  const completedTasks = tasks.filter((task) => task.done);
  const tasksDone = completedTasks.length;
  const streak = bestStreak(habits);

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader
          title={t('achievements.title')}
          back
          right={
            <View className="flex-row items-center gap-1">
              <Crown size={16} color={colors.muted} strokeWidth={1.5} />
              <InterText color={colors.muted} style={{ fontSize: 13 }}>
                {unlocked.length} / {achievements.length}
              </InterText>
            </View>
          }
        />

        <View className="px-5 pb-2">
          <View
            style={{ backgroundColor: colors.surface2, borderRadius: 12 }}
            className="flex-row p-1"
          >
            {(['unlocked', 'locked'] as Tab[]).map((tabKey) => {
              const active = tab === tabKey;
              const count = tabKey === 'unlocked' ? unlocked.length : locked.length;
              return (
                <PressableScale
                  feedback="chip"
                  key={tabKey}
                  onPress={() => setTab(tabKey)}
                  className="flex-1 items-center justify-center rounded-[9px] py-2"
                  style={{ backgroundColor: active ? colors.surface : 'transparent' }}
                  accessibilityRole="button"
                >
                  <InterText
                    weight="medium"
                    color={active ? colors.text : colors.muted}
                    style={{ fontSize: 13 }}
                  >
                    {tabKey === 'unlocked' ? t('achievements.unlocked') : t('achievements.locked')}{' '}
                    ({count})
                  </InterText>
                </PressableScale>
              );
            })}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            className="flex-row flex-wrap px-5 pt-3"
            style={{ rowGap: 22, justifyContent: 'space-between' }}
          >
            {shown.map((a) => (
              <Badge key={a.id} a={a} name={nameOf(a)} colors={colors} />
            ))}
          </View>

          <View className="px-5 pt-8">
            <SectionLabel>{t('achievements.howTo')}</SectionLabel>
            <View className="gap-2">
              {shown.map((a) => (
                <Card key={a.id} className="flex-row items-center gap-3 py-3">
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      backgroundColor: a.unlocked ? colors.text : colors.surface2,
                    }}
                    className="items-center justify-center"
                  >
                    {a.unlocked ? (
                      <Check size={16} color={colors.bg} strokeWidth={2.5} />
                    ) : (
                      <Lock size={15} color={colors.faint} strokeWidth={1.5} />
                    )}
                  </View>
                  <View className="flex-1">
                    <InterText weight="medium" style={{ fontSize: 14 }}>
                      {nameOf(a)}
                    </InterText>
                    <Caption color={colors.muted}>{descOf(a)}</Caption>
                  </View>
                  {!a.unlocked ? (
                    <InterText color={colors.faint} style={{ fontSize: 12 }}>
                      {a.value}/{a.goal}
                    </InterText>
                  ) : null}
                </Card>
              ))}
            </View>
          </View>

          <View className="px-5 pt-8">
            <SectionLabel>{t('achievements.milestones')}</SectionLabel>
            <View className="flex-row gap-3">
              <Card className="flex-1 gap-1">
                <Zap size={20} color="#B8860B" strokeWidth={1.5} />
                <AnimatedCounter value={streak} weight="bold" style={{ fontSize: 24 }} />
                <Caption fit>{t('achievements.bestStreak')}</Caption>
              </Card>
              <Card className="flex-1 gap-1">
                <Award size={20} color={colors.text} strokeWidth={1.5} />
                <AnimatedCounter value={tasksDone} weight="bold" style={{ fontSize: 24 }} />
                <Caption fit>{t('achievements.tasksDone')}</Caption>
              </Card>
            </View>
          </View>

          <View className="px-5 pt-8">
            <SectionLabel>{t('achievements.completedTasks')}</SectionLabel>
            {completedTasks.length === 0 ? (
              <Card>
                <InterText color={colors.muted} style={{ fontSize: 14 }}>
                  {t('achievements.noCompletedTasks')}
                </InterText>
              </Card>
            ) : (
              <View className="gap-2">
                {completedTasks.map((task) => (
                  <Card key={task.id} className="flex-row items-center gap-3 py-3">
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        backgroundColor: colors.surface2,
                      }}
                      className="items-center justify-center"
                    >
                      <Check size={16} color={colors.text} strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <InterText weight="medium" style={{ fontSize: 15 }}>
                        {task.name}
                      </InterText>
                      {task.project ? <Caption color={colors.muted}>{task.project}</Caption> : null}
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        <AdBanner />
      </View>
      <Confetti show={celebrate} onDone={() => setCelebrate(false)} />
    </Screen>
  );
}

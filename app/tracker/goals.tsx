import { ScrollView, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Check, ChevronDown, ChevronUp, Target, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { AdBanner } from '@/components/AdBanner';
import { Card } from '@/components/Card';
import { Confetti } from '@/components/Confetti';
import { EmptyState } from '@/components/EmptyState';
import { ChipSelect, Field, FormSheet, TextField } from '@/components/FormSheet';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressBar } from '@/components/Progress';
import { RowActionSheet } from '@/components/RowActionSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatusChip } from '@/components/Chip';
import { ClashText, InterText } from '@/components/Typography';
import { CalendarDays } from '@/components/icons';
import { useFormatters } from '@/lib/format';
import { useColors } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
import { haptics } from '@/lib/haptics';
import type { Goal, Milestone } from '@/lib/types';

function statusFor(
  g: Goal,
  colors: ReturnType<typeof useColors>,
  t: TFunction,
): { label: string; color: string } {
  if (g.progress >= 100) return { label: t('goals.completed'), color: colors.text };
  if (g.progress >= 50) return { label: t('goals.onTrack'), color: colors.success };
  return { label: t('goals.behind'), color: colors.destructive };
}

function GoalCard({ goal, onOpen }: { goal: Goal; onOpen: () => void }) {
  const colors = useColors();
  const { t } = useTranslation();
  const fmt = useFormatters();
  const toggleMilestone = useTrakl((s) => s.toggleMilestone);
  const [open, setOpen] = useState(false);
  const status = statusFor(goal, colors, t);
  const deadline = fmt.date(goal.deadline, { day: 'numeric', month: 'short' });
  return (
    <Card className="gap-3" onPress={onOpen}>
      <View className="flex-row items-start justify-between">
        <ClashText
          weight="medium"
          style={{ fontSize: 20, flex: 1, paddingRight: 12 }}
          numberOfLines={2}
        >
          {goal.name}
        </ClashText>
        <View className="flex-row items-center gap-1">
          <CalendarDays size={14} color={colors.muted} strokeWidth={1.5} />
          <InterText color={colors.muted} style={{ fontSize: 12 }}>
            {deadline}
          </InterText>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <ProgressBar progress={goal.progress} />
        </View>
        <ClashText weight="bold" style={{ fontSize: 22 }}>
          {goal.progress}%
        </ClashText>
      </View>

      <View className="flex-row items-center justify-between">
        <StatusChip label={status.label} accent={status.color} />
        <PressableScale
          feedback="icon"
          onPress={() => setOpen((o) => !o)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={open ? 'Collapse milestones' : 'Expand milestones'}
        >
          {open ? (
            <ChevronUp size={20} color={colors.muted} strokeWidth={1.5} />
          ) : (
            <ChevronDown size={20} color={colors.muted} strokeWidth={1.5} />
          )}
        </PressableScale>
      </View>

      {open ? (
        <View className="gap-2 pt-1">
          {goal.milestones.map((m) => (
            <PressableScale
              feedback="chip"
              key={m.id}
              onPress={() => toggleMilestone(goal.id, m.id)}
              className="flex-row items-center gap-2 py-1"
              accessibilityRole="button"
              accessibilityState={{ checked: m.done }}
              accessibilityLabel={m.label}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  backgroundColor: m.done ? colors.text : 'transparent',
                  borderWidth: m.done ? 0 : 1.5,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {m.done ? <Check size={12} color={colors.bg} strokeWidth={2.5} /> : null}
              </View>
              <InterText style={{ fontSize: 13 }} color={m.done ? colors.text : colors.muted}>
                {m.label}
              </InterText>
            </PressableScale>
          ))}
        </View>
      ) : (
        <View className="flex-row gap-2 pt-1">
          {goal.milestones.map((m) => (
            <View
              key={m.id}
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                backgroundColor: m.done ? colors.text : 'transparent',
                borderWidth: m.done ? 0 : 1.5,
                borderColor: colors.border,
              }}
            />
          ))}
        </View>
      )}
    </Card>
  );
}

export default function GoalsScreen() {
  const goals = useTrakl((s) => s.goals);
  const addGoalFull = useTrakl((s) => s.addGoalFull);
  const updateGoal = useTrakl((s) => s.updateGoal);
  const deleteGoal = useTrakl((s) => s.deleteGoal);
  const { t } = useTranslation();
  const fmt = useFormatters();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.add === '1') setFormOpen(true);
  }, [params.add]);

  // Fire confetti the moment any goal reaches 100% completion.
  const completedCount = goals.filter((g) => g.progress >= 100).length;
  const [celebrate, setCelebrate] = useState(false);
  const prevCompleted = useRef(completedCount);
  useEffect(() => {
    if (completedCount > prevCompleted.current) setCelebrate(true);
    prevCompleted.current = completedCount;
  }, [completedCount]);

  const detailGoal = goals.find((g) => g.id === detailId) ?? null;

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader title={t('goals.title')} back />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {goals.length === 0 ? (
            <EmptyState
              icon={Target}
              title={t('emptyStates.goalsTitle')}
              body={t('emptyStates.goalsBody')}
            />
          ) : (
            <View className="gap-3 px-5 pt-2">
              {goals.map((g) => (
                <GoalCard key={g.id} goal={g} onOpen={() => setDetailId(g.id)} />
              ))}
            </View>
          )}
          <View className="px-5 pt-6">
            <PrimaryButton label={t('goals.newGoal')} onPress={() => setFormOpen(true)} />
          </View>
        </ScrollView>
        <AdBanner />
      </View>
      <GoalForm
        visible={formOpen}
        goal={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={(g) => {
          haptics.tapMedium();
          if (editing) updateGoal(editing.id, g);
          else addGoalFull(g);
          setFormOpen(false);
          setEditing(null);
        }}
      />
      <RowActionSheet
        visible={detailGoal !== null}
        onClose={() => setDetailId(null)}
        title={detailGoal?.name ?? ''}
        subtitle={
          detailGoal
            ? t('goalsDetail.progressLine', {
                progress: detailGoal.progress,
                date: fmt.date(detailGoal.deadline, { day: 'numeric', month: 'short' }),
              })
            : undefined
        }
        actions={[
          {
            label: t('common.edit'),
            onPress: () => {
              const target = detailGoal;
              setDetailId(null);
              setEditing(target);
              setFormOpen(true);
            },
          },
        ]}
        deleteLabel={t('goalsDetail.delete')}
        onDelete={() => {
          if (detailGoal) deleteGoal(detailGoal.id);
        }}
        closeLabel={t('common.cancel')}
      />
      <Confetti show={celebrate} onDone={() => setCelebrate(false)} />
    </Screen>
  );
}

function deadlineFromChoice(choice: string): string {
  const days = choice === '30' ? 30 : choice === '180' ? 180 : 90;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function closestDeadlineChoice(deadline: string): string {
  const days = Math.round((new Date(deadline).getTime() - Date.now()) / 86_400_000);
  const options = [30, 90, 180];
  let best = options[0];
  for (const o of options) {
    if (Math.abs(o - days) < Math.abs(best - days)) best = o;
  }
  return String(best);
}

function GoalForm({
  visible,
  goal,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
  onSubmit: (g: Omit<Goal, 'id' | 'progress'>) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [deadlineChoice, setDeadlineChoice] = useState('90');
  const [milestoneText, setMilestoneText] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const valid = name.trim().length > 0;
  const isEdit = goal !== null;

  // Track whether the user changed the deadline choice so we keep the
  // original deadline when editing and they leave it untouched.
  const [deadlineTouched, setDeadlineTouched] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (goal) {
      setName(goal.name);
      setDeadlineChoice(closestDeadlineChoice(goal.deadline));
      setMilestones(goal.milestones);
    } else {
      setName('');
      setDeadlineChoice('90');
      setMilestones([]);
    }
    setMilestoneText('');
    setDeadlineTouched(false);
  }, [visible, goal]);

  const reset = () => {
    setName('');
    setDeadlineChoice('90');
    setMilestoneText('');
    setMilestones([]);
    setDeadlineTouched(false);
  };

  const addMilestone = () => {
    const label = milestoneText.trim();
    if (!label) return;
    setMilestones((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2, 9), label, done: false },
    ]);
    setMilestoneText('');
  };

  const removeMilestone = (mid: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== mid));
  };

  const submit = () => {
    if (!valid) return;
    const deadline =
      isEdit && goal && !deadlineTouched ? goal.deadline : deadlineFromChoice(deadlineChoice);
    onSubmit({
      name: name.trim(),
      deadline,
      milestones,
    });
    reset();
  };

  return (
    <FormSheet
      visible={visible}
      title={isEdit ? t('goals.editGoal') : t('forms.newGoal')}
      submitLabel={isEdit ? t('common.save') : t('forms.addGoal')}
      submitDisabled={!valid}
      onSubmit={submit}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <Field label={t('forms.goalName')}>
        <TextField
          value={name}
          onChangeText={setName}
          placeholder={t('forms.goalName')}
          autoFocus={!isEdit}
        />
      </Field>
      <Field label={t('forms.deadline')}>
        <ChipSelect
          choices={[
            { value: '30', label: t('forms.in30') },
            { value: '90', label: t('forms.in90') },
            { value: '180', label: t('forms.in180') },
          ]}
          selected={deadlineChoice}
          onSelect={(v) => {
            setDeadlineChoice(v);
            setDeadlineTouched(true);
          }}
        />
      </Field>
      <Field label="Milestones">
        <View className="gap-2">
          {milestones.map((m) => (
            <MilestoneRow
              key={m.id}
              label={m.label}
              done={m.done}
              onRemove={() => removeMilestone(m.id)}
            />
          ))}
          <View className="flex-row gap-2">
            <View className="flex-1">
              <TextField
                value={milestoneText}
                onChangeText={setMilestoneText}
                placeholder="e.g. €1k"
              />
            </View>
            <PrimaryButton
              label="+"
              variant="secondary"
              fullWidth={false}
              onPress={addMilestone}
              className="w-[52px]"
            />
          </View>
        </View>
      </Field>
    </FormSheet>
  );
}

function MilestoneRow({
  label,
  done,
  onRemove,
}: {
  label: string;
  done?: boolean;
  onRemove?: () => void;
}) {
  const colors = useColors();
  return (
    <View className="flex-row items-center gap-2">
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 999,
          backgroundColor: done ? colors.text : 'transparent',
          borderWidth: done ? 0 : 1.5,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {done ? <Check size={9} color={colors.bg} strokeWidth={2.5} /> : null}
      </View>
      <InterText style={{ fontSize: 13, flex: 1 }} color={done ? colors.text : colors.muted}>
        {label}
      </InterText>
      {onRemove ? (
        <PressableScale
          feedback="icon"
          onPress={onRemove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
        >
          <X size={16} color={colors.muted} strokeWidth={1.5} />
        </PressableScale>
      ) : null}
    </View>
  );
}

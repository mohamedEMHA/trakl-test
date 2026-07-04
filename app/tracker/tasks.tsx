import { ScrollView, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AdBanner } from '@/components/AdBanner';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ChipSelect, Field, FormSheet, TextField } from '@/components/FormSheet';
import { PressableScale } from '@/components/PressableScale';
import { RowActionSheet } from '@/components/RowActionSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SwipeableRow } from '@/components/SwipeableRow';
import { Caption, InterText } from '@/components/Typography';
import { AlertCircle, CheckSquare, Clock } from '@/components/icons';
import { ArrowRight, Circle, CheckCircle2, Folder } from 'lucide-react-native';
import { Fab } from '@/components/Screen';
import { useFormatters } from '@/lib/format';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { withAlpha } from '@/lib/trackers';
import { useTrakl } from '@/lib/store';
import { haptics } from '@/lib/haptics';
import { type TaskGroupKey, type TaskSort, groupTasks } from '@/lib/stats';
import type { Priority, Task, TaskStatus } from '@/lib/types';

type TaskView = 'list' | 'kanban';

function dueLabel(iso: string, fmt: ReturnType<typeof useFormatters>): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return fmt.time(d);
  return fmt.date(d, { day: 'numeric', month: 'short' });
}

function TaskRow({
  task,
  onToggle,
  onOpen,
  onDelete,
  toggleLabel,
  deleteLabel,
  inProgressLabel,
}: {
  task: Task;
  onToggle: () => void;
  onOpen: () => void;
  onDelete: () => void;
  toggleLabel: string;
  deleteLabel: string;
  inProgressLabel: string;
}) {
  const colors = useColors();
  const accents = useTrackerAccents();
  const accent = accents.tasks;
  const fmt = useFormatters();
  return (
    <SwipeableRow
      left={{
        label: toggleLabel,
        icon: 'check',
        color: colors.success,
        onTrigger: onToggle,
      }}
      right={{ label: deleteLabel, icon: 'trash', color: colors.destructive, onTrigger: onDelete }}
    >
      <Card padded={false} className="p-4" onPress={onOpen}>
        <View className="flex-row items-center">
          <PressableScale
            feedback="icon"
            onPress={onToggle}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Toggle ${task.name}`}
          >
            {task.done ? (
              <CheckCircle2 size={24} color={colors.text} strokeWidth={1.5} />
            ) : (
              <Circle size={24} color={colors.faint} strokeWidth={1.5} />
            )}
          </PressableScale>
          <View className="flex-1 px-3">
            <View className="flex-row items-center gap-2">
              <InterText
                weight="medium"
                style={{
                  fontSize: 15,
                  textDecorationLine: task.done ? 'line-through' : 'none',
                }}
                color={task.done ? colors.faint : colors.text}
                numberOfLines={1}
              >
                {task.name}
              </InterText>
              {task.status === 'inprogress' && !task.done ? (
                <View
                  style={{
                    backgroundColor: withAlpha(accent, 0.14),
                    borderRadius: 999,
                  }}
                  className="flex-row items-center gap-1 px-2 py-0.5"
                >
                  <View
                    style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: accent }}
                  />
                  <InterText weight="medium" color={accent} style={{ fontSize: 10 }}>
                    {inProgressLabel}
                  </InterText>
                </View>
              ) : null}
            </View>
            <View className="mt-1 flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <Folder size={12} color={colors.muted} strokeWidth={1.5} />
                <InterText color={colors.muted} style={{ fontSize: 12 }}>
                  {task.project}
                </InterText>
              </View>
              <View className="flex-row items-center gap-1">
                <Clock size={12} color={colors.muted} strokeWidth={1.5} />
                <InterText color={colors.muted} style={{ fontSize: 12 }}>
                  {dueLabel(task.due, fmt)}
                </InterText>
              </View>
            </View>
          </View>
          <ArrowRight size={18} color={colors.faint} strokeWidth={1.5} />
        </View>
      </Card>
    </SwipeableRow>
  );
}

export default function TasksScreen() {
  const tasks = useTrakl((s) => s.tasks);
  const toggleTask = useTrakl((s) => s.toggleTask);
  const setTaskStatus = useTrakl((s) => s.setTaskStatus);
  const addTask = useTrakl((s) => s.addTask);
  const deleteTask = useTrakl((s) => s.deleteTask);
  const [view, setView] = useState<TaskView>('list');
  const [sort, setSort] = useState<TaskSort>('due');
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const colors = useColors();
  const accents = useTrackerAccents();
  const { t } = useTranslation();
  const fmt = useFormatters();
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.add === '1') setFormOpen(true);
  }, [params.add]);

  const KANBAN_COLUMNS: { status: TaskStatus; label: string }[] = [
    { status: 'todo', label: t('tasks.todo') },
    { status: 'inprogress', label: t('tasks.inProgress') },
    { status: 'done', label: t('tasks.done') },
  ];

  const GROUP_LABELS: Record<TaskGroupKey, string> = {
    overdue: t('tasks.groupOverdue'),
    today: t('tasks.groupToday'),
    tomorrow: t('tasks.groupTomorrow'),
    later: t('tasks.groupLater'),
    noDate: t('tasks.groupNoDate'),
    done: t('tasks.groupDone'),
  };

  const GROUP_COLORS: Partial<Record<TaskGroupKey, string>> = {
    overdue: colors.destructive,
    today: accents.tasks,
  };

  const groups = groupTasks(tasks, sort);

  const detailTask = tasks.find((task) => task.id === detailId) ?? null;

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader title={t('tasks.title')} back />
        <View className="px-5 pb-2">
          <View
            style={{ backgroundColor: colors.surface2, borderRadius: 12 }}
            className="flex-row p-1"
          >
            {(['list', 'kanban'] as TaskView[]).map((v) => {
              const active = view === v;
              return (
                <PressableScale
                  feedback="chip"
                  key={v}
                  onPress={() => setView(v)}
                  className="flex-1 items-center justify-center rounded-[9px] py-2"
                  style={{ backgroundColor: active ? colors.surface : 'transparent' }}
                >
                  <InterText
                    weight="medium"
                    color={active ? colors.text : colors.muted}
                    style={{ fontSize: 13 }}
                  >
                    {v === 'list' ? t('tasks.list') : t('tasks.kanban')}
                  </InterText>
                </PressableScale>
              );
            })}
          </View>
        </View>

        {view === 'list' ? (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 96 }}
            showsVerticalScrollIndicator={false}
          >
            {tasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                accent={accents.tasks}
                title={t('emptyStates.tasksTitle')}
                body={t('emptyStates.tasksBody')}
              />
            ) : (
              <>
                <View className="flex-row items-center justify-end gap-2 px-5 pt-2">
                  <InterText color={colors.muted} style={{ fontSize: 12 }}>
                    {t('tasks.sortBy')}
                  </InterText>
                  <View
                    style={{ backgroundColor: colors.surface2, borderRadius: 999 }}
                    className="flex-row p-0.5"
                  >
                    {(['due', 'priority'] as TaskSort[]).map((s) => {
                      const active = sort === s;
                      return (
                        <PressableScale
                          feedback="chip"
                          key={s}
                          onPress={() => setSort(s)}
                          className="rounded-full px-3 py-1.5"
                          style={{ backgroundColor: active ? colors.surface : 'transparent' }}
                        >
                          <InterText
                            weight="medium"
                            color={active ? colors.text : colors.muted}
                            style={{ fontSize: 12 }}
                          >
                            {s === 'due' ? t('tasks.sortDue') : t('tasks.sortPriority')}
                          </InterText>
                        </PressableScale>
                      );
                    })}
                  </View>
                </View>
                {groups.map((group) => (
                  <View key={group.key} className="px-5 pt-5">
                    <View className="mb-3 flex-row items-center gap-1.5">
                      {GROUP_COLORS[group.key] ? (
                        <AlertCircle size={14} color={GROUP_COLORS[group.key]} strokeWidth={1.5} />
                      ) : null}
                      <Caption color={GROUP_COLORS[group.key] ?? colors.muted}>
                        {GROUP_LABELS[group.key]}
                      </Caption>
                      <Caption color={colors.faint}>· {group.items.length}</Caption>
                    </View>
                    <View className="gap-3">
                      {group.items.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          toggleLabel={task.done ? t('tasksDetail.markTodo') : t('tasks.done')}
                          deleteLabel={t('common.delete')}
                          inProgressLabel={t('tasks.inProgress')}
                          onToggle={() => {
                            haptics.tapMedium();
                            toggleTask(task.id);
                          }}
                          onDelete={() => deleteTask(task.id)}
                          onOpen={() => setDetailId(task.id)}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 96, gap: 12 }}
          >
            {KANBAN_COLUMNS.map((col) => {
              const items = tasks.filter((task) => task.status === col.status);
              return (
                <View key={col.status} style={{ width: 260 }} className="pt-4">
                  <View className="mb-3 flex-row items-center justify-between">
                    <Caption>{col.label}</Caption>
                    <Caption color={colors.faint}>{items.length}</Caption>
                  </View>
                  <View className="gap-3">
                    {items.map((task) => {
                      const nextStatus: TaskStatus =
                        task.status === 'todo'
                          ? 'inprogress'
                          : task.status === 'inprogress'
                            ? 'done'
                            : 'todo';
                      return (
                        <PressableScale
                          feedback="card"
                          key={task.id}
                          onPress={() => setTaskStatus(task.id, nextStatus)}
                          accessibilityRole="button"
                          accessibilityLabel={`Move ${task.name}`}
                        >
                          <Card className="gap-2">
                            <InterText
                              weight="medium"
                              style={{ fontSize: 14 }}
                              color={task.done ? colors.faint : colors.text}
                            >
                              {task.name}
                            </InterText>
                            <View className="flex-row items-center gap-1">
                              <Folder size={12} color={colors.muted} strokeWidth={1.5} />
                              <InterText color={colors.muted} style={{ fontSize: 12 }}>
                                {task.project}
                              </InterText>
                            </View>
                          </Card>
                        </PressableScale>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        <Fab onPress={() => setFormOpen(true)} bottom={68} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <AdBanner />
        </View>
      </View>
      <TaskForm
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(task) => {
          haptics.tapMedium();
          addTask(task);
          setFormOpen(false);
        }}
      />
      <RowActionSheet
        visible={detailTask !== null}
        onClose={() => setDetailId(null)}
        title={detailTask?.name ?? ''}
        subtitle={
          detailTask
            ? `${detailTask.project} · ${fmt.date(detailTask.due, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}`
            : undefined
        }
        actions={
          detailTask
            ? [
                {
                  label: detailTask.done ? t('tasksDetail.markTodo') : t('tasksDetail.markDone'),
                  onPress: () => {
                    haptics.tapMedium();
                    toggleTask(detailTask.id);
                  },
                },
              ]
            : undefined
        }
        deleteLabel={t('tasksDetail.delete')}
        onDelete={() => {
          if (detailTask) deleteTask(detailTask.id);
        }}
        closeLabel={t('common.cancel')}
      />
    </Screen>
  );
}

function dueFromChoice(choice: string): string {
  const d = new Date();
  if (choice === 'tomorrow') d.setDate(d.getDate() + 1);
  else if (choice === 'week') d.setDate(d.getDate() + 7);
  d.setHours(17, 0, 0, 0);
  return d.toISOString();
}

function TaskForm({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'done' | 'status'>) => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const accents = useTrackerAccents();
  const [name, setName] = useState('');
  const [project, setProject] = useState('Work');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueChoice, setDueChoice] = useState('today');
  const valid = name.trim().length > 0;

  const reset = () => {
    setName('');
    setProject('Work');
    setPriority('medium');
    setDueChoice('today');
  };

  const submit = () => {
    if (!valid) return;
    onSubmit({
      name: name.trim(),
      project: project.trim() || 'Work',
      priority,
      due: dueFromChoice(dueChoice),
    });
    reset();
  };

  return (
    <FormSheet
      visible={visible}
      title={t('forms.newTask')}
      submitLabel={t('forms.addTask')}
      submitDisabled={!valid}
      onSubmit={submit}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <Field label={t('forms.taskName')}>
        <TextField
          value={name}
          onChangeText={setName}
          placeholder={t('forms.taskName')}
          autoFocus
        />
      </Field>
      <Field label={t('forms.project')}>
        <TextField value={project} onChangeText={setProject} placeholder={t('forms.project')} />
      </Field>
      <Field label={t('forms.priority')}>
        <ChipSelect
          choices={[
            { value: 'high', label: t('forms.high'), color: colors.destructive },
            { value: 'medium', label: t('forms.medium'), color: accents.finance },
            { value: 'low', label: t('forms.low') },
          ]}
          selected={priority}
          onSelect={setPriority}
        />
      </Field>
      <Field label={t('forms.due')}>
        <ChipSelect
          choices={[
            { value: 'today', label: t('forms.today') },
            { value: 'tomorrow', label: t('forms.tomorrow') },
            { value: 'week', label: t('forms.nextWeek') },
          ]}
          selected={dueChoice}
          onSelect={setDueChoice}
        />
      </Field>
    </FormSheet>
  );
}

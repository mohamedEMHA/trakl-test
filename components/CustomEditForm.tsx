import { ScrollView, View } from 'react-native';
import { useState } from 'react';
import { Switch } from 'heroui-native';
import { Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ChipSelect, Field, FormSheet, Stepper, TextField } from '@/components/FormSheet';
import { PressableScale } from '@/components/PressableScale';
import { InterText } from '@/components/Typography';
import { ICONS } from '@/components/icons';
import { useColors } from '@/lib/theme';
import type { CustomTracker, CustomType } from '@/lib/types';

const COLOR_OPTIONS = [
  '#B8860B',
  '#2D7A4F',
  '#2C5F8A',
  '#6B4C8A',
  '#8A3A3A',
  '#8A4A2F',
  '#3A5A8A',
  '#4A4A4A',
];

export type CustomPatch = Omit<CustomTracker, 'id' | 'logs'>;

function parseTime(value: string): { h: number; m: number } {
  const [h, m] = value.split(':').map((n) => Number.parseInt(n, 10));
  return { h: Number.isFinite(h) ? h : 9, m: Number.isFinite(m) ? m : 0 };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Shared editor for a custom tracker's settings. Used both for editing an
 * existing tracker (detail screen) and could back the create flow. Renders
 * inside a FormSheet so motion/anchoring match every other form.
 */
export function CustomEditForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial: CustomTracker;
  onClose: () => void;
  onSubmit: (patch: CustomPatch) => void;
}) {
  const colors = useColors();
  const { t } = useTranslation();

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [icon, setIcon] = useState(initial.icon);
  const [color, setColor] = useState(initial.color);
  const [type, setType] = useState<CustomType>(initial.type);
  const [reminder, setReminder] = useState(initial.reminder);
  const initTime = parseTime(initial.reminderTime);
  const [hour, setHour] = useState(initTime.h);
  const [minute, setMinute] = useState(initTime.m);

  const valid = name.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      type,
      reminder,
      reminderTime: `${pad(hour)}:${pad(minute)}`,
    });
  };

  const TYPE_OPTIONS: { value: CustomType; label: string }[] = [
    { value: 'number', label: t('custom.typeNumber') },
    { value: 'yesno', label: t('custom.typeYesNo') },
    { value: 'scale', label: t('custom.typeScale') },
    { value: 'duration', label: t('custom.typeDuration') },
    { value: 'counter', label: t('custom.typeCounter') },
  ];

  return (
    <FormSheet
      visible
      title={t('customDetail.editTitle')}
      submitLabel={t('common.save')}
      submitDisabled={!valid}
      onSubmit={submit}
      onClose={onClose}
    >
      <Field label={t('custom.trackerName')}>
        <TextField value={name} onChangeText={setName} placeholder={t('custom.trackerName')} />
      </Field>

      <Field label={t('custom.shortDescription')}>
        <TextField
          value={description}
          onChangeText={setDescription}
          placeholder={t('custom.shortDescription')}
        />
      </Field>

      <Field label={t('customDetail.icon')}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingVertical: 2 }}
        >
          {ICONS.map((opt) => {
            const Icon = opt.icon;
            const active = icon === opt.key;
            return (
              <PressableScale
                feedback="chip"
                key={opt.key}
                onPress={() => setIcon(opt.key)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  backgroundColor: active ? colors.text : colors.surface2,
                }}
                className="items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel={`Icon ${opt.key}`}
              >
                <Icon size={20} color={active ? colors.bg : colors.muted} strokeWidth={1.5} />
              </PressableScale>
            );
          })}
        </ScrollView>
      </Field>

      <Field label={t('customDetail.color')}>
        <View className="flex-row flex-wrap gap-3">
          {COLOR_OPTIONS.map((c) => {
            const active = color === c;
            return (
              <PressableScale
                feedback="chip"
                key={c}
                onPress={() => setColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  backgroundColor: c,
                  borderWidth: active ? 2 : 0,
                  borderColor: colors.text,
                }}
                accessibilityRole="button"
                accessibilityLabel={`Color ${c}`}
              />
            );
          })}
        </View>
      </Field>

      <Field label={t('custom.trackerType')}>
        <ChipSelect choices={TYPE_OPTIONS} selected={type} onSelect={setType} />
      </Field>

      <Field label={t('custom.reminder')}>
        <View className="gap-4">
          <View
            className="flex-row items-center justify-between rounded-2xl p-4"
            style={{ backgroundColor: colors.surface2 }}
          >
            <View className="flex-row items-center gap-2">
              <Bell size={18} color={colors.muted} strokeWidth={1.5} />
              <InterText style={{ fontSize: 14 }}>{t('custom.dailyReminder')}</InterText>
            </View>
            <Switch isSelected={reminder} onSelectedChange={setReminder} />
          </View>
          {reminder ? (
            <View className="flex-row gap-3">
              <View className="flex-1">
                <InterText color={colors.muted} style={{ fontSize: 12, marginBottom: 6 }}>
                  {t('customDetail.hour')}
                </InterText>
                <Stepper value={hour} onChange={setHour} min={0} max={23} />
              </View>
              <View className="flex-1">
                <InterText color={colors.muted} style={{ fontSize: 12, marginBottom: 6 }}>
                  {t('customDetail.minute')}
                </InterText>
                <Stepper value={minute} onChange={setMinute} min={0} max={55} step={5} />
              </View>
            </View>
          ) : null}
        </View>
      </Field>
    </FormSheet>
  );
}

import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Clock3, Hash, ListPlus, Plus, SlidersHorizontal } from 'lucide-react-native';

import { Card } from '@/components/Card';
import { ChipSelect, Field, FormSheet, Stepper, TextField } from '@/components/FormSheet';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { ClashText, InterText } from '@/components/Typography';
import { Clock, ICONS, iconForKey } from '@/components/icons';
import { Switch } from 'heroui-native';
import { withAlpha } from '@/lib/trackers';
import { formatLogValue } from '@/lib/customFormat';
import { useColors } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
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

const TYPE_OPTIONS: {
  type: CustomType;
  labelKey: 'typeNumber' | 'typeYesNo' | 'typeScale' | 'typeDuration' | 'typeCounter';
  icon: typeof Hash;
}[] = [
  { type: 'number', labelKey: 'typeNumber', icon: Hash },
  { type: 'yesno', labelKey: 'typeYesNo', icon: Check },
  { type: 'scale', labelKey: 'typeScale', icon: SlidersHorizontal },
  { type: 'duration', labelKey: 'typeDuration', icon: Clock3 },
  { type: 'counter', labelKey: 'typeCounter', icon: ListPlus },
];

export default function CustomBuilderScreen() {
  const router = useRouter();
  const addCustomTracker = useTrakl((s) => s.addCustomTracker);
  const customTrackers = useTrakl((s) => s.customTrackers);
  const logCustomValue = useTrakl((s) => s.logCustomValue);
  const colors = useColors();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('gauge');
  const [color, setColor] = useState('#B8860B');
  const [type, setType] = useState<CustomType>('number');
  const [reminder, setReminder] = useState(false);
  const [reminderHour, setReminderHour] = useState(9);
  const [reminderMinute, setReminderMinute] = useState(0);
  const reminderTime = `${String(reminderHour).padStart(2, '0')}:${String(reminderMinute).padStart(2, '0')}`;
  const [logTarget, setLogTarget] = useState<CustomTracker | null>(null);

  const valid = name.trim().length > 0;
  const PreviewIcon = iconForKey(icon);

  const save = () => {
    if (!valid) return;
    addCustomTracker({
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      type,
      reminder,
      reminderTime,
    });
    router.back();
  };
  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="pt-safe flex-1">
          <ScreenHeader
            title={t('custom.title')}
            back
            right={
              <PressableScale
                feedback="icon"
                onPress={save}
                disabled={!valid}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('custom.saveTracker')}
              >
                <InterText
                  weight="semibold"
                  color={valid ? colors.text : colors.faint}
                  style={{ fontSize: 15 }}
                >
                  {t('custom.save')}
                </InterText>
              </PressableScale>
            }
          />
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {customTrackers.length > 0 ? (
              <View className="px-5 pt-2">
                <SectionLabel>{t('forms.recentLogs')}</SectionLabel>
                <View className="gap-3">
                  {customTrackers.map((tr) => {
                    const Icon = iconForKey(tr.icon);
                    const last = tr.logs?.[0];
                    return (
                      <PressableScale
                        feedback="card"
                        key={tr.id}
                        onPress={() =>
                          router.push({ pathname: '/tracker/custom/[id]', params: { id: tr.id } })
                        }
                        accessibilityRole="button"
                        accessibilityLabel={tr.name}
                      >
                        <Card padded={false} className="p-4">
                          <View className="flex-row items-center">
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                backgroundColor: withAlpha(tr.color, 0.12),
                              }}
                              className="items-center justify-center"
                            >
                              <Icon size={20} color={tr.color} strokeWidth={1.5} />
                            </View>
                            <View className="flex-1 px-3">
                              <ClashText weight="medium" style={{ fontSize: 15 }} numberOfLines={1}>
                                {tr.name}
                              </ClashText>
                              <InterText
                                color={colors.muted}
                                style={{ fontSize: 12, marginTop: 2 }}
                              >
                                {last
                                  ? formatLogValue(tr.type, last.value, t)
                                  : t('forms.logValue')}
                              </InterText>
                            </View>
                            <PressableScale
                              feedback="icon"
                              onPress={() => setLogTarget(tr)}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel={`${t('forms.logValue')} ${tr.name}`}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 999,
                                backgroundColor: colors.ink,
                              }}
                              className="items-center justify-center"
                            >
                              <Plus size={18} color={colors.bg} strokeWidth={2} />
                            </PressableScale>
                          </View>
                        </Card>
                      </PressableScale>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View className="px-5 pt-2">
              <SectionLabel>{t('custom.details')}</SectionLabel>
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

              <View className="mt-4 gap-3">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('custom.trackerName')}
                  placeholderTextColor={colors.faint}
                  style={{
                    height: 52,
                    backgroundColor: colors.surface2,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    fontFamily: Platform.OS === 'web' ? 'Inter' : 'Inter_400Regular',
                    fontSize: 15,
                    color: colors.text,
                  }}
                />
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('custom.shortDescription')}
                  placeholderTextColor={colors.faint}
                  style={{
                    height: 52,
                    backgroundColor: colors.surface2,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    fontFamily: Platform.OS === 'web' ? 'Inter' : 'Inter_400Regular',
                    fontSize: 15,
                    color: colors.text,
                  }}
                />
              </View>

              <View className="mt-4 flex-row flex-wrap gap-3">
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
            </View>

            <View className="px-5 pt-6">
              <SectionLabel>{t('custom.trackerType')}</SectionLabel>
              <View className="flex-row flex-wrap gap-3">
                {TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = type === opt.type;
                  return (
                    <PressableScale
                      feedback="card"
                      key={opt.type}
                      onPress={() => setType(opt.type)}
                      className="items-center gap-2 rounded-2xl p-4"
                      style={{
                        width: '31%',
                        backgroundColor: colors.surface,
                        borderWidth: active ? 2 : 1,
                        borderColor: active ? colors.text : colors.border,
                      }}
                      accessibilityRole="button"
                    >
                      <Icon size={22} color={colors.text} strokeWidth={1.5} />
                      <InterText weight="medium" style={{ fontSize: 12 }} numberOfLines={1}>
                        {t(`custom.${opt.labelKey}`)}
                      </InterText>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

            <View className="px-5 pt-6">
              <SectionLabel>{t('custom.reminder')}</SectionLabel>
              <Card className="gap-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Bell size={18} color={colors.muted} strokeWidth={1.5} />
                    <InterText style={{ fontSize: 14 }}>{t('custom.dailyReminder')}</InterText>
                  </View>
                  <Switch isSelected={reminder} onSelectedChange={setReminder} />
                </View>
                {reminder ? (
                  <>
                    <View style={{ height: 1, backgroundColor: colors.border }} />
                    <View className="flex-row items-center gap-2">
                      <Clock size={18} color={colors.muted} strokeWidth={1.5} />
                      <InterText style={{ fontSize: 14 }}>{t('custom.time')}</InterText>
                      <InterText
                        weight="medium"
                        style={{ fontSize: 14, marginLeft: 'auto' }}
                        color={colors.text}
                      >
                        {reminderTime}
                      </InterText>
                    </View>
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <InterText color={colors.muted} style={{ fontSize: 12, marginBottom: 6 }}>
                          {t('customDetail.hour')}
                        </InterText>
                        <Stepper value={reminderHour} onChange={setReminderHour} min={0} max={23} />
                      </View>
                      <View className="flex-1">
                        <InterText color={colors.muted} style={{ fontSize: 12, marginBottom: 6 }}>
                          {t('customDetail.minute')}
                        </InterText>
                        <Stepper
                          value={reminderMinute}
                          onChange={setReminderMinute}
                          min={0}
                          max={55}
                          step={5}
                        />
                      </View>
                    </View>
                  </>
                ) : null}
              </Card>
            </View>

            <View className="px-5 pt-6">
              <SectionLabel>{t('custom.livePreview')}</SectionLabel>
              <Card className="gap-3" style={{ backgroundColor: withAlpha(color, 0.06) }}>
                <PreviewIcon size={22} color={color} strokeWidth={1.5} />
                <View className="gap-1">
                  <ClashText weight="medium" style={{ fontSize: 16 }}>
                    {name.trim() || t('custom.trackerName')}
                  </ClashText>
                  <InterText color={colors.muted} style={{ fontSize: 13 }}>
                    {description.trim() ||
                      t(
                        `custom.${TYPE_OPTIONS.find((o) => o.type === type)?.labelKey ?? 'typeNumber'}`,
                      )}
                  </InterText>
                </View>
              </Card>
            </View>

            <View className="px-5 pt-6">
              <PrimaryButton label={t('custom.createTracker')} onPress={save} disabled={!valid} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      {logTarget ? (
        <CustomLogForm
          tracker={logTarget}
          onClose={() => setLogTarget(null)}
          onSubmit={(value) => {
            logCustomValue(logTarget.id, value);
            setLogTarget(null);
          }}
        />
      ) : null}
    </Screen>
  );
}

function CustomLogForm({
  tracker,
  onClose,
  onSubmit,
}: {
  tracker: CustomTracker;
  onClose: () => void;
  onSubmit: (value: number) => void;
}) {
  const { t } = useTranslation();
  const [numberValue, setNumberValue] = useState('');
  const [yesNo, setYesNo] = useState('yes');
  const [scale, setScale] = useState(5);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [count, setCount] = useState(1);

  let valid = true;
  if (tracker.type === 'number') {
    const n = Number(numberValue.replace(',', '.'));
    valid = numberValue.trim().length > 0 && Number.isFinite(n);
  } else if (tracker.type === 'duration') {
    valid = hours * 60 + minutes > 0;
  }

  const submit = () => {
    let value = 0;
    if (tracker.type === 'number') value = Number(numberValue.replace(',', '.'));
    else if (tracker.type === 'yesno') value = yesNo === 'yes' ? 1 : 0;
    else if (tracker.type === 'duration') value = hours * 60 + minutes;
    else if (tracker.type === 'counter') value = count;
    else value = scale;
    if (!Number.isFinite(value)) return;
    onSubmit(value);
  };

  return (
    <FormSheet
      visible
      title={tracker.name}
      submitLabel={t('forms.logEntry')}
      submitDisabled={!valid}
      onSubmit={submit}
      onClose={onClose}
    >
      {tracker.type === 'number' ? (
        <Field label={t('forms.value')}>
          <TextField
            value={numberValue}
            onChangeText={setNumberValue}
            placeholder="0"
            keyboardType="decimal-pad"
            autoFocus
          />
        </Field>
      ) : null}
      {tracker.type === 'yesno' ? (
        <Field label={t('forms.value')}>
          <ChipSelect
            choices={[
              { value: 'yes', label: t('forms.yes') },
              { value: 'no', label: t('forms.no') },
            ]}
            selected={yesNo}
            onSelect={setYesNo}
          />
        </Field>
      ) : null}
      {tracker.type === 'scale' ? (
        <Field label={`${t('forms.value')} — ${scale}/10`}>
          <Stepper value={scale} onChange={setScale} min={1} max={10} suffix="/10" />
        </Field>
      ) : null}
      {tracker.type === 'duration' ? (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label={t('customDetail.hours')}>
              <Stepper value={hours} onChange={setHours} min={0} max={23} />
            </Field>
          </View>
          <View className="flex-1">
            <Field label={t('customDetail.minutes')}>
              <Stepper value={minutes} onChange={setMinutes} min={0} max={55} step={5} />
            </Field>
          </View>
        </View>
      ) : null}
      {tracker.type === 'counter' ? (
        <Field label={t('forms.value')}>
          <Stepper value={count} onChange={setCount} min={1} max={99} />
        </Field>
      ) : null}
    </FormSheet>
  );
}

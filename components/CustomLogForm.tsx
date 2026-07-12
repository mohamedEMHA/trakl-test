import { View } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChipSelect, Field, FormSheet, Stepper, TextField } from '@/components/FormSheet';
import type { CustomTracker } from '@/lib/types';

export function CustomLogForm({
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

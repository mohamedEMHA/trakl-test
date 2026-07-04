import { ScrollView, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { AdBanner } from '@/components/AdBanner';
import { Card } from '@/components/Card';
import { Field, FormSheet, TextField } from '@/components/FormSheet';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RowActionSheet } from '@/components/RowActionSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { Sparkline } from '@/components/Sparkline';
import { Caption, ClashText, InterText } from '@/components/Typography';
import { withAlpha } from '@/lib/trackers';
import { useFormatters } from '@/lib/format';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
import { latestWeight, weightChange, weightSeries } from '@/lib/stats';
import type { WeightEntry } from '@/lib/types';

export default function WeightScreen() {
  const colors = useColors();
  const accents = useTrackerAccents();
  const accent = accents.weight;
  const { t } = useTranslation();
  const fmt = useFormatters();
  const weight = useTrakl((s) => s.weight);
  const addWeight = useTrakl((s) => s.addWeight);
  const deleteWeight = useTrakl((s) => s.deleteWeight);
  const [formOpen, setFormOpen] = useState(false);
  const [active, setActive] = useState<WeightEntry | null>(null);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.add === '1') setFormOpen(true);
  }, [params.add]);

  const sorted = useMemo(
    () => [...weight].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [weight],
  );
  const latest = latestWeight(weight);
  const change = weightChange(weight, 30);
  const series = weightSeries(weight);
  const losing = change != null && change < 0;

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader title={t('weightScreen.title')} back />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5 pt-2">
            <Card elevated className="p-6">
              <Caption>{t('weightScreen.current')}</Caption>
              <View className="flex-row items-end gap-2" style={{ marginTop: 4 }}>
                <ClashText weight="bold" style={{ fontSize: 48 }}>
                  {latest != null ? fmt.number(latest) : '—'}
                </ClashText>
                <ClashText
                  weight="medium"
                  color={colors.muted}
                  style={{ fontSize: 20, marginBottom: 8 }}
                >
                  kg
                </ClashText>
              </View>
              {change != null ? (
                <View className="flex-row items-center gap-1.5" style={{ marginTop: 4 }}>
                  {losing ? (
                    <TrendingDown size={16} color={colors.success} strokeWidth={2} />
                  ) : (
                    <TrendingUp size={16} color={colors.destructive} strokeWidth={2} />
                  )}
                  <InterText
                    weight="medium"
                    color={losing ? colors.success : colors.destructive}
                    style={{ fontSize: 13 }}
                  >
                    {t('weightScreen.change', {
                      sign: change > 0 ? '+' : '',
                      value: fmt.number(change),
                    })}
                  </InterText>
                </View>
              ) : null}
              <View style={{ marginTop: 16 }}>
                <Sparkline data={series} color={accent} width={280} height={56} />
              </View>
            </Card>
          </View>

          <View className="px-5 pt-6">
            <SectionLabel>{t('weightScreen.history')}</SectionLabel>
            <View className="gap-3">
              {sorted.map((w, i) => {
                const prev = sorted[i + 1];
                const diff = prev ? Math.round((w.kg - prev.kg) * 10) / 10 : null;
                return (
                  <PressableScale
                    key={w.id}
                    feedback="card"
                    onPress={() => setActive(w)}
                    accessibilityRole="button"
                    accessibilityLabel={`${fmt.number(w.kg)} kg`}
                  >
                    <Card padded={false} className="p-4">
                      <View className="flex-row items-center">
                        <View className="flex-1">
                          <ClashText weight="medium" style={{ fontSize: 17 }}>
                            {fmt.number(w.kg)} kg
                          </ClashText>
                          <InterText color={colors.muted} style={{ fontSize: 12, marginTop: 2 }}>
                            {fmt.date(w.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                          </InterText>
                        </View>
                        {diff != null && diff !== 0 ? (
                          <View
                            style={{
                              backgroundColor: withAlpha(
                                diff < 0 ? colors.success : colors.destructive,
                                0.12,
                              ),
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 999,
                            }}
                          >
                            <InterText
                              weight="medium"
                              color={diff < 0 ? colors.success : colors.destructive}
                              style={{ fontSize: 12 }}
                            >
                              {diff > 0 ? '+' : ''}
                              {fmt.number(diff)}
                            </InterText>
                          </View>
                        ) : null}
                      </View>
                    </Card>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          <View className="px-5 pt-6">
            <PrimaryButton label={t('weightScreen.logWeight')} onPress={() => setFormOpen(true)} />
          </View>
        </ScrollView>
        <AdBanner />
      </View>

      <WeightForm
        visible={formOpen}
        initial={latest ?? 70}
        t={t}
        onClose={() => setFormOpen(false)}
        onSubmit={(kg) => {
          addWeight(kg);
          setFormOpen(false);
        }}
      />

      <RowActionSheet
        visible={active != null}
        title={active ? `${fmt.number(active.kg)} kg` : ''}
        subtitle={
          active
            ? fmt.date(active.date, { weekday: 'long', day: 'numeric', month: 'short' })
            : undefined
        }
        deleteLabel={t('weightScreen.delete')}
        onDelete={() => {
          if (active) deleteWeight(active.id);
          setActive(null);
        }}
        closeLabel={t('common.close')}
        onClose={() => setActive(null)}
      />
    </Screen>
  );
}

function WeightForm({
  visible,
  onClose,
  onSubmit,
  initial,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (kg: number) => void;
  initial: number;
  t: TFunction;
}) {
  const [value, setValue] = useState(String(initial));

  const numeric = parseFloat(value.replace(',', '.'));
  const valid = !Number.isNaN(numeric) && numeric > 0 && numeric < 500;

  const submit = () => {
    if (!valid) return;
    onSubmit(numeric);
    setValue(String(initial));
  };

  return (
    <FormSheet
      visible={visible}
      title={t('forms.logWeight')}
      submitLabel={t('forms.logWeight')}
      submitDisabled={!valid}
      onSubmit={submit}
      onClose={() => {
        setValue(String(initial));
        onClose();
      }}
    >
      <Field label={t('forms.weightKg')}>
        <TextField
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder="74.0"
          autoFocus
        />
      </Field>
    </FormSheet>
  );
}

import { ScrollView, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';

import { AdBanner } from '@/components/AdBanner';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ChipSelect, Field, FormSheet, TextField } from '@/components/FormSheet';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressRing } from '@/components/Progress';
import { RowActionSheet } from '@/components/RowActionSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { SwipeableRow } from '@/components/SwipeableRow';
import { Caption, ClashText, InterText } from '@/components/Typography';
import {
  FINANCE_CATEGORY_ICON,
  Repeat2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from '@/components/icons';
import { Pencil } from 'lucide-react-native';
import { withAlpha } from '@/lib/trackers';
import { useFormatters } from '@/lib/format';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
import { haptics } from '@/lib/haptics';
import {
  budgetLeft,
  expenseByCategory,
  monthComparison,
  monthElapsedFraction,
  monthExpenses,
  monthIncome,
  netBalance,
  recurringCharges,
} from '@/lib/stats';
import type { Transaction, TxKind } from '@/lib/types';

const CATEGORY_KEYS = [
  'Food',
  'Transport',
  'Home',
  'Health',
  'Entertainment',
  'Shopping',
  'Income',
] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];

function isCategoryKey(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value);
}

function Donut({
  segments,
  size = 168,
  stroke = 18,
}: {
  segments: { amount: number; color: string }[];
  size?: number;
  stroke?: number;
}) {
  const colors = useColors();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.amount, 0) || 1;

  // Pre-compute cumulative fractions so nothing is mutated during render
  const fracs = segments.map((seg) => seg.amount / total);
  const offsets = fracs.map((_, i) => fracs.slice(0, i).reduce((s, f) => s + f, 0));

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={colors.surface2}
        strokeWidth={stroke}
        fill="none"
      />
      {segments.map((seg, i) => {
        const dash = fracs[i] * c;
        const offset = -offsets[i] * c;
        return (
          <Circle
            key={seg.color}
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={seg.color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
      })}
    </Svg>
  );
}

function TxRow({
  tx,
  onPress,
  onDelete,
  deleteLabel,
}: {
  tx: Transaction;
  onPress: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  const colors = useColors();
  const accents = useTrackerAccents();
  const { t } = useTranslation();
  const fmt = useFormatters();
  const Icon = FINANCE_CATEGORY_ICON[tx.category] ?? FINANCE_CATEGORY_ICON.Shopping;
  const accent = tx.kind === 'income' ? colors.success : colors.text;
  const sign = tx.kind === 'income' ? '+' : '-';
  const categoryLabel = isCategoryKey(tx.category) ? t(`categories.${tx.category}`) : tx.category;
  return (
    <SwipeableRow
      right={{ label: deleteLabel, icon: 'trash', color: colors.destructive, onTrigger: onDelete }}
    >
      <Card padded={false} className="p-4" onPress={onPress}>
        <View className="flex-row items-center">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: withAlpha(accents.finance, 0.1),
            }}
            className="items-center justify-center"
          >
            <Icon size={20} color={accents.finance} strokeWidth={1.5} />
          </View>
          <View className="flex-1 px-3">
            <InterText weight="medium" style={{ fontSize: 15 }} numberOfLines={1}>
              {tx.merchant}
            </InterText>
            <InterText color={colors.muted} style={{ fontSize: 12, marginTop: 2 }}>
              {categoryLabel}
            </InterText>
          </View>
          <View className="items-end">
            <ClashText weight="medium" color={accent} style={{ fontSize: 16 }}>
              {sign}
              {fmt.currency(tx.amount, { cents: true })}
            </ClashText>
            <InterText color={colors.muted} style={{ fontSize: 11, marginTop: 2 }}>
              {fmt.date(tx.date, { day: 'numeric', month: 'short' })}
            </InterText>
          </View>
        </View>
      </Card>
    </SwipeableRow>
  );
}

export default function FinanceScreen() {
  const colors = useColors();
  const accents = useTrackerAccents();
  const { t } = useTranslation();
  const fmt = useFormatters();
  const transactions = useTrakl((s) => s.transactions);
  const monthlyBudget = useTrakl((s) => s.monthlyBudget);
  const setMonthlyBudget = useTrakl((s) => s.setMonthlyBudget);
  const addTransaction = useTrakl((s) => s.addTransaction);
  const deleteTransaction = useTrakl((s) => s.deleteTransaction);
  const params = useLocalSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [initialKind, setInitialKind] = useState<TxKind>('expense');
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    if (params.add === 'expense' || params.add === 'income') {
      setInitialKind(params.add);
      setFormOpen(true);
    }
  }, [params.add]);

  const income = monthIncome(transactions);
  const expenses = monthExpenses(transactions);
  const balance = netBalance(transactions);
  const categories = expenseByCategory(transactions);
  const totalExpense = categories.reduce((s, c) => s + c.amount, 0) || 1;

  // Budget pacing
  const left = budgetLeft(transactions, monthlyBudget);
  const spentPct =
    monthlyBudget > 0 ? Math.min(100, Math.round((expenses / monthlyBudget) * 100)) : 0;
  const elapsedPct = Math.round(monthElapsedFraction() * 100);
  const overPace = monthlyBudget > 0 && spentPct > elapsedPct + 5;
  const budgetColor = left <= 0 ? colors.destructive : overPace ? accents.finance : colors.success;

  // Month-over-month comparison
  const cmp = monthComparison(transactions);

  // Recurring / subscriptions
  const recurring = recurringCharges(transactions);
  const recurringTotal = recurring.reduce((s, r) => s + r.amount, 0);

  const detailTx = transactions.find((tx) => tx.id === detailId) ?? null;

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader title={t('finance.title')} back />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5 pt-2">
            <Card elevated className="p-6">
              <Caption>{t('finance.netBalance')}</Caption>
              <ClashText weight="bold" style={{ fontSize: 52, marginTop: 4 }}>
                {fmt.currency(balance)}
              </ClashText>
              <View className="mt-4 flex-row gap-5">
                <View className="flex-row items-center gap-1.5">
                  <TrendingUp size={18} color={colors.success} strokeWidth={1.5} />
                  <InterText color={colors.muted} style={{ fontSize: 13 }}>
                    {fmt.currency(income)} {t('finance.income')}
                  </InterText>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <TrendingDown size={18} color={colors.destructive} strokeWidth={1.5} />
                  <InterText color={colors.muted} style={{ fontSize: 13 }}>
                    {fmt.currency(Math.round(expenses))} {t('finance.expenses')}
                  </InterText>
                </View>
              </View>
            </Card>
          </View>

          {/* Budget ring + monthly comparison */}
          <View className="px-5 pt-3">
            <Card>
              <View className="flex-row items-center justify-between">
                <SectionLabel>{t('finance.monthlyBudget')}</SectionLabel>
                <PressableScale
                  feedback="icon"
                  onPress={() => setBudgetOpen(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t('finance.editBudget')}
                  className="flex-row items-center gap-1"
                >
                  <Pencil size={13} color={colors.muted} strokeWidth={1.5} />
                  <InterText color={colors.muted} style={{ fontSize: 12 }}>
                    {t('common.edit')}
                  </InterText>
                </PressableScale>
              </View>
              <View className="mt-1 flex-row items-center">
                <ProgressRing
                  size={92}
                  stroke={11}
                  progress={spentPct}
                  color={budgetColor}
                  label={`${spentPct}%`}
                />
                <View className="flex-1 gap-2 pl-4">
                  <View>
                    <InterText color={colors.muted} style={{ fontSize: 12 }}>
                      {t('finance.budgetLeftLabel')}
                    </InterText>
                    <ClashText weight="bold" color={budgetColor} style={{ fontSize: 26 }}>
                      {fmt.currency(left)}
                    </ClashText>
                  </View>
                  <InterText color={colors.muted} style={{ fontSize: 12 }}>
                    {t('finance.budgetOf', {
                      spent: fmt.currency(Math.round(expenses)),
                      total: fmt.currency(monthlyBudget),
                    })}
                  </InterText>
                  {monthlyBudget > 0 ? (
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: withAlpha(budgetColor, 0.12),
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <InterText weight="medium" color={budgetColor} style={{ fontSize: 11 }}>
                        {overPace ? t('finance.aheadOfPace') : t('finance.onPace')}
                      </InterText>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Month-over-month line */}
              {cmp.percent !== null ? (
                <View
                  style={{ borderTopWidth: 1, borderTopColor: colors.border }}
                  className="mt-4 flex-row items-center gap-2 pt-3"
                >
                  {cmp.delta <= 0 ? (
                    <TrendingDown size={16} color={colors.success} strokeWidth={1.8} />
                  ) : (
                    <TrendingUp size={16} color={colors.destructive} strokeWidth={1.8} />
                  )}
                  <InterText style={{ fontSize: 13, flex: 1 }} color={colors.muted}>
                    {cmp.delta <= 0
                      ? t('finance.spentLess', {
                          amount: fmt.currency(Math.abs(Math.round(cmp.delta))),
                          percent: Math.abs(cmp.percent),
                        })
                      : t('finance.spentMore', {
                          amount: fmt.currency(Math.round(cmp.delta)),
                          percent: cmp.percent,
                        })}
                  </InterText>
                </View>
              ) : null}
            </Card>
          </View>

          <View className="px-5 pt-3">
            <Card>
              <SectionLabel>{t('finance.spendingByCategory')}</SectionLabel>
              <View className="flex-row items-center">
                <Donut segments={categories} />
                <View className="flex-1 gap-2.5 pl-4">
                  {categories.map((cat) => (
                    <View key={cat.category} className="flex-row items-center">
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: cat.color,
                        }}
                      />
                      <InterText style={{ fontSize: 13, marginLeft: 8, flex: 1 }} numberOfLines={1}>
                        {isCategoryKey(cat.category)
                          ? t(`categories.${cat.category}`)
                          : cat.category}
                      </InterText>
                      <InterText color={colors.muted} style={{ fontSize: 12 }}>
                        {Math.round((cat.amount / totalExpense) * 100)}%
                      </InterText>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          </View>

          {/* Recurring / subscriptions */}
          {recurring.length > 0 ? (
            <View className="px-5 pt-6">
              <View className="mb-1 flex-row items-center justify-between">
                <SectionLabel>{t('finance.recurring')}</SectionLabel>
                <InterText color={colors.muted} style={{ fontSize: 12 }}>
                  {t('finance.recurringTotal', {
                    amount: fmt.currency(Math.round(recurringTotal)),
                  })}
                </InterText>
              </View>
              <View className="gap-3">
                {recurring.map((r) => {
                  const Icon = FINANCE_CATEGORY_ICON[r.category] ?? FINANCE_CATEGORY_ICON.Shopping;
                  return (
                    <Card key={r.merchant} padded={false} className="p-4">
                      <View className="flex-row items-center">
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: withAlpha(accents.finance, 0.1),
                          }}
                          className="items-center justify-center"
                        >
                          <Repeat2 size={18} color={accents.finance} strokeWidth={1.5} />
                        </View>
                        <View className="flex-1 px-3">
                          <InterText weight="medium" style={{ fontSize: 15 }} numberOfLines={1}>
                            {r.merchant}
                          </InterText>
                          <View className="mt-1 flex-row items-center gap-1.5">
                            <Icon size={12} color={colors.muted} strokeWidth={1.5} />
                            <InterText color={colors.muted} style={{ fontSize: 12 }}>
                              {t('finance.everyMonth')}
                            </InterText>
                          </View>
                        </View>
                        <ClashText weight="medium" style={{ fontSize: 16 }}>
                          {fmt.currency(r.amount, { cents: true })}
                        </ClashText>
                      </View>
                    </Card>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View className="px-5 pt-6">
            <SectionLabel>{t('finance.recentTransactions')}</SectionLabel>
            {transactions.length === 0 ? (
              <EmptyState
                icon={Wallet}
                accent={accents.finance}
                title={t('emptyStates.financeTitle')}
                body={t('emptyStates.financeBody')}
              />
            ) : (
              <View className="gap-3">
                {transactions.map((tx) => (
                  <TxRow
                    key={tx.id}
                    tx={tx}
                    onPress={() => setDetailId(tx.id)}
                    onDelete={() => deleteTransaction(tx.id)}
                    deleteLabel={t('common.delete')}
                  />
                ))}
              </View>
            )}
          </View>

          <View className="px-5 pt-6">
            <PrimaryButton label={t('finance.addTransaction')} onPress={() => setFormOpen(true)} />
          </View>
        </ScrollView>
        <AdBanner />
      </View>
      <TransactionForm
        visible={formOpen}
        initialKind={initialKind}
        onClose={() => setFormOpen(false)}
        onSubmit={(tx) => {
          haptics.tapMedium();
          addTransaction(tx);
          setFormOpen(false);
        }}
      />
      <BudgetForm
        visible={budgetOpen}
        current={monthlyBudget}
        onClose={() => setBudgetOpen(false)}
        onSubmit={(value) => {
          haptics.tapMedium();
          setMonthlyBudget(value);
          setBudgetOpen(false);
        }}
      />
      <RowActionSheet
        visible={detailTx !== null}
        onClose={() => setDetailId(null)}
        title={detailTx?.merchant ?? ''}
        subtitle={
          detailTx
            ? `${detailTx.kind === 'income' ? '+' : '-'}${fmt.currency(detailTx.amount, {
                cents: true,
              })} · ${fmt.date(detailTx.date, { day: 'numeric', month: 'short', year: 'numeric' })}`
            : undefined
        }
        deleteLabel={t('financeDetail.delete')}
        onDelete={() => {
          if (detailTx) deleteTransaction(detailTx.id);
        }}
        closeLabel={t('common.cancel')}
      />
    </Screen>
  );
}

const EXPENSE_CATEGORIES: CategoryKey[] = [
  'Food',
  'Transport',
  'Home',
  'Health',
  'Entertainment',
  'Shopping',
];

function TransactionForm({
  visible,
  initialKind,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  initialKind: TxKind;
  onClose: () => void;
  onSubmit: (tx: Omit<Transaction, 'id'>) => void;
}) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<TxKind>(initialKind);
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState<CategoryKey>('Food');

  useEffect(() => {
    if (visible) setKind(initialKind);
  }, [visible, initialKind]);

  const numeric = Number(amount.replace(',', '.'));
  const valid = merchant.trim().length > 0 && Number.isFinite(numeric) && numeric > 0;

  const reset = () => {
    setKind('expense');
    setAmount('');
    setMerchant('');
    setCategory('Food');
  };

  const submit = () => {
    if (!valid) return;
    onSubmit({
      kind,
      merchant: merchant.trim(),
      category: kind === 'income' ? 'Income' : category,
      amount: Math.round(numeric * 100) / 100,
      date: new Date().toISOString(),
    });
    reset();
  };

  return (
    <FormSheet
      visible={visible}
      title={kind === 'income' ? t('forms.newIncome') : t('forms.newExpense')}
      submitLabel={kind === 'income' ? t('forms.addIncome') : t('forms.addExpense')}
      submitDisabled={!valid}
      onSubmit={submit}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <Field label={t('forms.category')}>
        <ChipSelect
          choices={[
            { value: 'expense', label: t('forms.expense') },
            { value: 'income', label: t('forms.income') },
          ]}
          selected={kind}
          onSelect={setKind}
        />
      </Field>
      <Field label={t('forms.amount')}>
        <TextField
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          autoFocus
        />
      </Field>
      <Field label={t('forms.merchant')}>
        <TextField value={merchant} onChangeText={setMerchant} placeholder={t('forms.merchant')} />
      </Field>
      {kind === 'expense' ? (
        <Field label={t('forms.category')}>
          <ChipSelect
            choices={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: t(`categories.${c}`) }))}
            selected={category}
            onSelect={setCategory}
          />
        </Field>
      ) : null}
    </FormSheet>
  );
}

function BudgetForm({
  visible,
  current,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  current: number;
  onClose: () => void;
  onSubmit: (value: number) => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(String(current));

  useEffect(() => {
    if (visible) setValue(String(current));
  }, [visible, current]);

  const numeric = Number(value.replace(',', '.'));
  const valid = Number.isFinite(numeric) && numeric >= 0;

  return (
    <FormSheet
      visible={visible}
      title={t('finance.editBudget')}
      submitLabel={t('common.save')}
      submitDisabled={!valid}
      onSubmit={() => {
        if (valid) onSubmit(Math.round(numeric));
      }}
      onClose={onClose}
    >
      <Field label={t('finance.monthlyBudget')}>
        <TextField
          value={value}
          onChangeText={setValue}
          placeholder="0"
          keyboardType="numeric"
          autoFocus
        />
      </Field>
    </FormSheet>
  );
}

import { useState } from 'react';
import { Image, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import type { ParseKeys } from 'i18next';
import {
  ArrowRight,
  Camera,
  Check,
  CheckSquare,
  Globe,
  Repeat2,
  Wallet,
  Zap,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Caption, ClashText, InterText } from '@/components/Typography';
import { Chip } from '@/components/Chip';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TRACKERS, type TrackerKey } from '@/lib/trackers';
import { useColors, useResolvedScheme, useTrackerAccents } from '@/lib/theme';
import { Avatar } from '@/components/Avatar';
import { AVATAR_EMOJIS, pickAvatarImage } from '@/lib/avatar';
import { changeLanguage } from '@/lib/i18n';
import { codeToName, LANGUAGES } from '@/lib/languages';
import type { FocusKey } from '@/lib/types';
import { useTrakl } from '@/lib/store';
import { cn } from '@/lib/utils';

const hookArt = require('@/assets/onboarding/hook.png');
const previewArt = require('@/assets/onboarding/preview.png');

const FOCUS_OPTIONS: { key: FocusKey; labelKey: ParseKeys; icon: LucideIcon }[] = [
  { key: 'save', labelKey: 'onboarding.focusSave', icon: Wallet },
  { key: 'habits', labelKey: 'onboarding.focusHabits', icon: Repeat2 },
  { key: 'productive', labelKey: 'onboarding.focusProductive', icon: CheckSquare },
  { key: 'all', labelKey: 'onboarding.focusAll', icon: Zap },
];

const TOTAL_STEPS = 5;

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const scheme = useResolvedScheme();
  const { t, i18n } = useTranslation();
  const completeOnboarding = useTrakl((s) => s.completeOnboarding);

  const [step, setStep] = useState(0); // 0..4 → S-01..S-05
  const [langCode, setLangCode] = useState(i18n.language || 'en');
  const [selected, setSelected] = useState<TrackerKey[]>(TRACKERS.map((tr) => tr.key));
  const [name, setName] = useState('');
  const [avatarImage, setAvatarImage] = useState<string | undefined>(undefined);
  const [avatarEmoji, setAvatarEmoji] = useState<string>(AVATAR_EMOJIS[0]);
  const [focus, setFocus] = useState<FocusKey>('all');
  const [sampleData, setSampleData] = useState(false);

  const next = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));

  const selectLanguage = (code: string) => {
    setLangCode(code);
    void changeLanguage(code);
  };

  const finish = () => {
    // Ensure the chosen language is fully applied before sample data is built,
    // otherwise the seed strings can materialize in the previous language.
    void (async () => {
      if (sampleData) await changeLanguage(langCode);
      completeOnboarding({
        profile: {
          name: name.trim() || 'Alex',
          language: codeToName(langCode),
          focus,
          avatarEmoji,
          ...(avatarImage ? { avatarImage } : {}),
        },
        trackers: selected,
        sampleData,
      });
      router.replace('/(tabs)');
    })();
  };

  const toggleTracker = (key: TrackerKey) =>
    setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg, paddingTop: insets.top }}>
      {/* expo-status-bar StatusBar takes a string for `style`, not an object — linter false positive */}
      {/* oxlint-disable-next-line react/style-prop-object */}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {step === 0 || step === 1 ? (
        <IllustratedStep
          art={step === 0 ? hookArt : previewArt}
          step={step}
          onSkip={() => setStep(2)}
          onNext={next}
          insetBottom={insets.bottom}
        >
          {step === 0 ? (
            <>
              <ClashText weight="bold" style={{ fontSize: 30, lineHeight: 36 }}>
                {t('onboarding.hookTitle')}
              </ClashText>
              <InterText color={colors.muted} style={{ fontSize: 16, marginTop: 12 }}>
                {t('onboarding.hookBody')}
              </InterText>
            </>
          ) : (
            <>
              <ClashText weight="bold" style={{ fontSize: 30, lineHeight: 36 }}>
                {t('onboarding.previewTitle')}
              </ClashText>
              <InterText color={colors.muted} style={{ fontSize: 16, marginTop: 12 }}>
                {t('onboarding.previewBody')}
              </InterText>
              <View className="mt-5 flex-row flex-wrap gap-2">
                {(['finance', 'habits', 'goals', 'sleep', 'fitness', 'custom'] as const).map(
                  (c) => (
                    <Chip key={c} label={t(`trackerNames.${c}`)} />
                  ),
                )}
              </View>
            </>
          )}
        </IllustratedStep>
      ) : null}

      {step === 2 ? (
        <LanguageStep
          langCode={langCode}
          onSelect={selectLanguage}
          onContinue={next}
          insetBottom={insets.bottom}
        />
      ) : null}

      {step === 3 ? (
        <TrackerStep
          selected={selected}
          onToggle={toggleTracker}
          onContinue={next}
          insetBottom={insets.bottom}
        />
      ) : null}

      {step === 4 ? (
        <ProfileStep
          name={name}
          onName={setName}
          avatarImage={avatarImage}
          onPickImage={setAvatarImage}
          avatarEmoji={avatarEmoji}
          onPickEmoji={setAvatarEmoji}
          focus={focus}
          onFocus={setFocus}
          sampleData={sampleData}
          onSampleData={setSampleData}
          onFinish={finish}
          insetBottom={insets.bottom}
        />
      ) : null}
    </View>
  );
}

function ProgressDots({ active }: { active: number }) {
  const colors = useColors();
  return (
    <View className="mb-5 flex-row items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }, (_, step) => step).map((step) => (
        <View
          key={step}
          style={{
            width: step === active ? 8 : 6,
            height: step === active ? 8 : 6,
            borderRadius: 999,
            backgroundColor: step === active ? colors.text : colors.border,
          }}
        />
      ))}
    </View>
  );
}

function IllustratedStep({
  art,
  step,
  onSkip,
  onNext,
  insetBottom,
  children,
}: {
  art: number;
  step: number;
  onSkip: () => void;
  onNext: () => void;
  insetBottom: number;
  children: React.ReactNode;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  return (
    <View className="flex-1">
      <View className="h-[48%] items-center justify-center px-6">
        <Image source={art} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
      </View>
      <View
        className="flex-1 px-6 pt-7"
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <ProgressDots active={step} />
        {children}
        <View
          className="mt-auto flex-row items-center justify-between pt-6"
          style={{ paddingBottom: insetBottom + 20 }}
        >
          <PressableScale
            feedback="chip"
            hitSlop={10}
            onPress={onSkip}
            className="h-11 justify-center px-2"
          >
            <InterText weight="medium" color={colors.muted} style={{ fontSize: 15 }}>
              {t('onboarding.skip')}
            </InterText>
          </PressableScale>
          <View style={{ width: 140 }}>
            <PrimaryButton
              label={t('onboarding.next')}
              icon={ArrowRight}
              iconRight
              onPress={onNext}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function LanguageStep({
  langCode,
  onSelect,
  onContinue,
  insetBottom,
}: {
  langCode: string;
  onSelect: (code: string) => void;
  onContinue: () => void;
  insetBottom: number;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  return (
    <View className="flex-1 px-5 pt-4">
      <Globe size={24} color={colors.text} strokeWidth={1.5} />
      <ClashText weight="semibold" style={{ fontSize: 28, marginTop: 12 }}>
        {t('onboarding.languageTitle')}
      </ClashText>
      <InterText color={colors.muted} style={{ fontSize: 16, marginTop: 6 }}>
        {t('onboarding.languageBody')}
      </InterText>
      <ScrollView className="mt-5" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {LANGUAGES.map((l) => {
            const active = l.code === langCode;
            return (
              <PressableScale
                feedback="card"
                key={l.code}
                onPress={() => onSelect(l.code)}
                style={{
                  width: '48.5%',
                  backgroundColor: colors.surface,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? colors.text : colors.border,
                }}
                className="rounded-2xl p-4"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-2">
                    <InterText style={{ fontSize: 18 }}>{l.flag}</InterText>
                    <ClashText weight="medium" style={{ fontSize: 16 }}>
                      {l.name}
                    </ClashText>
                  </View>
                  {active ? <Check size={18} color={colors.text} strokeWidth={2} /> : null}
                </View>
                <InterText color={colors.muted} style={{ fontSize: 12, marginTop: 4 }}>
                  {l.native}
                </InterText>
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>
      <View style={{ paddingBottom: insetBottom + 12, paddingTop: 12 }}>
        <PrimaryButton label={t('common.continue')} onPress={onContinue} />
      </View>
    </View>
  );
}

function TrackerStep({
  selected,
  onToggle,
  onContinue,
  insetBottom,
}: {
  selected: TrackerKey[];
  onToggle: (k: TrackerKey) => void;
  onContinue: () => void;
  insetBottom: number;
}) {
  const colors = useColors();
  const accents = useTrackerAccents();
  const { t } = useTranslation();
  const [error, setError] = useState(false);
  const tryContinue = () => {
    if (selected.length === 0) {
      setError(true);
      return;
    }
    setError(false);
    onContinue();
  };
  return (
    <View className="flex-1 px-5 pt-4">
      <ClashText weight="semibold" style={{ fontSize: 28 }}>
        {t('onboarding.trackerTitle')}
      </ClashText>
      <InterText color={colors.muted} style={{ fontSize: 16, marginTop: 6 }}>
        {t('onboarding.trackerBody')}
      </InterText>
      <ScrollView className="mt-5" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {TRACKERS.map((tr) => {
            const active = selected.includes(tr.key);
            const Icon = tr.icon;
            const accent = accents[tr.key];
            return (
              <PressableScale
                feedback="card"
                key={tr.key}
                onPress={() => {
                  setError(false);
                  onToggle(tr.key);
                }}
                style={{
                  width: '48.5%',
                  backgroundColor: colors.surface,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? colors.text : colors.border,
                }}
                className="rounded-2xl p-4"
              >
                <View className="flex-row items-start justify-between">
                  <Icon size={22} color={active ? accent : colors.muted} strokeWidth={1.5} />
                  <View
                    style={{
                      width: 36,
                      height: 22,
                      borderRadius: 999,
                      backgroundColor: active ? colors.text : colors.border,
                      padding: 2,
                      alignItems: active ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        backgroundColor: colors.surface,
                      }}
                    />
                  </View>
                </View>
                <ClashText weight="medium" style={{ fontSize: 16, marginTop: 10 }}>
                  {t(`trackerNames.${tr.key}`)}
                </ClashText>
                <InterText color={colors.muted} style={{ fontSize: 12, marginTop: 2 }}>
                  {t(`trackerDescriptions.${tr.key}`)}
                </InterText>
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>
      <View style={{ paddingBottom: insetBottom + 12, paddingTop: 12 }}>
        {error ? (
          <InterText color={colors.destructive} style={{ fontSize: 13, marginBottom: 10 }}>
            {t('onboarding.selectAtLeastOne')}
          </InterText>
        ) : null}
        <PrimaryButton
          label={t('onboarding.trackerContinue', { count: selected.length })}
          onPress={tryContinue}
        />
      </View>
    </View>
  );
}

function ProfileStep({
  name,
  onName,
  avatarImage,
  onPickImage,
  avatarEmoji,
  onPickEmoji,
  focus,
  onFocus,
  sampleData,
  onSampleData,
  onFinish,
  insetBottom,
}: {
  name: string;
  onName: (n: string) => void;
  avatarImage: string | undefined;
  onPickImage: (uri: string) => void;
  avatarEmoji: string;
  onPickEmoji: (emoji: string) => void;
  focus: FocusKey;
  onFocus: (f: FocusKey) => void;
  sampleData: boolean;
  onSampleData: (v: boolean) => void;
  onFinish: () => void;
  insetBottom: number;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  const [error, setError] = useState(false);
  const choosePhoto = async () => {
    const uri = await pickAvatarImage();
    if (uri) onPickImage(uri);
  };
  const tryFinish = () => {
    if (!name.trim()) {
      setError(true);
      return;
    }
    setError(false);
    onFinish();
  };
  return (
    <ScrollView
      className="flex-1 px-5 pt-4"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ClashText weight="semibold" style={{ fontSize: 28 }}>
        {t('onboarding.profileTitle')}
      </ClashText>

      <View className="items-center py-6">
        <PressableScale
          feedback="card"
          onPress={choosePhoto}
          accessibilityRole="button"
          accessibilityLabel={t('editProfile.choosePhoto')}
          style={{ borderRadius: 999 }}
        >
          <Avatar image={avatarImage} emoji={avatarEmoji} size={84} emojiSize={40} bordered />
        </PressableScale>

        <PressableScale
          feedback="chip"
          onPress={choosePhoto}
          accessibilityRole="button"
          accessibilityLabel={t('editProfile.choosePhoto')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Camera size={16} color={colors.text} strokeWidth={1.5} />
          <InterText weight="medium" style={{ fontSize: 13 }}>
            {t('editProfile.choosePhoto')}
          </InterText>
        </PressableScale>

        <InterText color={colors.muted} style={{ fontSize: 12, marginTop: 14 }}>
          {t('onboarding.chooseEmoji')}
        </InterText>
        <View className="mt-3 flex-row flex-wrap justify-center gap-2">
          {AVATAR_EMOJIS.map((e) => {
            const active = e === avatarEmoji && !avatarImage;
            return (
              <PressableScale
                feedback="chip"
                key={e}
                onPress={() => {
                  if (avatarImage) onPickImage('');
                  onPickEmoji(e);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors.surface2 : colors.surface,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? colors.text : colors.border,
                }}
              >
                <InterText style={{ fontSize: 22 }}>{e}</InterText>
              </PressableScale>
            );
          })}
        </View>
      </View>

      <Caption>{t('onboarding.namePlaceholder')}</Caption>
      <View
        style={{
          backgroundColor: colors.surface2,
          borderWidth: 1,
          borderColor: error ? colors.destructive : colors.border,
          height: 52,
          borderRadius: 12,
          marginTop: 8,
        }}
        className="justify-center px-4"
      >
        <InputLine
          value={name}
          onChange={(v) => {
            if (error) setError(false);
            onName(v);
          }}
          placeholder={t('onboarding.namePlaceholder')}
        />
      </View>
      {error ? (
        <InterText color={colors.destructive} style={{ fontSize: 13, marginTop: 8 }}>
          {t('onboarding.nameRequired')}
        </InterText>
      ) : null}

      <ClashText weight="medium" style={{ fontSize: 20, marginTop: 24 }}>
        {t('onboarding.focusQuestion')}
      </ClashText>
      <View className="mt-3 flex-row flex-wrap justify-between gap-y-3">
        {FOCUS_OPTIONS.map((o) => {
          const active = o.key === focus;
          const Icon = o.icon;
          return (
            <PressableScale
              feedback="card"
              key={o.key}
              onPress={() => onFocus(o.key)}
              style={{
                width: '48.5%',
                backgroundColor: active ? colors.text : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.text : colors.border,
              }}
              className="flex-row items-center gap-2 rounded-2xl p-4"
            >
              <Icon size={20} color={active ? colors.bg : colors.text} strokeWidth={1.5} />
              <InterText
                weight="medium"
                color={active ? colors.bg : colors.text}
                style={{ fontSize: 14 }}
              >
                {t(o.labelKey)}
              </InterText>
            </PressableScale>
          );
        })}
      </View>

      <PressableScale
        feedback="card"
        onPress={() => onSampleData(!sampleData)}
        accessibilityRole="switch"
        accessibilityState={{ checked: sampleData }}
        style={{
          marginTop: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: sampleData ? colors.text : colors.border,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <View className="flex-1">
          <InterText weight="semibold" style={{ fontSize: 15 }}>
            {t('onboarding.sampleTitle')}
          </InterText>
          <InterText color={colors.muted} style={{ fontSize: 12, marginTop: 2 }}>
            {t('onboarding.sampleBody')}
          </InterText>
        </View>
        <View
          style={{
            width: 36,
            height: 22,
            borderRadius: 999,
            backgroundColor: sampleData ? colors.text : colors.border,
            padding: 2,
            alignItems: sampleData ? 'flex-end' : 'flex-start',
          }}
        >
          <View
            style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: colors.surface }}
          />
        </View>
      </PressableScale>

      <View style={{ paddingBottom: insetBottom + 16, paddingTop: 24 }}>
        <PrimaryButton
          label={t('onboarding.letsGo')}
          icon={ArrowRight}
          iconRight
          onPress={tryFinish}
        />
      </View>
    </ScrollView>
  );
}

// Lightweight controlled text input.
function InputLine({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const colors = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.faint}
      style={{ fontSize: 16, color: colors.text }}
      className={cn('p-0')}
    />
  );
}

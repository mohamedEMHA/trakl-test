import { useState } from 'react';
import { Image, Linking, Platform, ScrollView, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Switch } from 'heroui-native';
import { useTranslation } from 'react-i18next';
import {
  Award,
  BarChart2,
  Bell,
  ChevronRight,
  Cloud,
  Cpu,
  Crown,
  Download,
  Globe,
  HelpCircle,
  Info,
  Monitor,
  Moon,
  Share2,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Upload,
  UserPen,
  XCircle,
  Zap,
} from 'lucide-react-native';

import { AdBanner } from '@/components/AdBanner';
import { Avatar } from '@/components/Avatar';
import { BackupSheet } from '@/components/BackupSheet';
import { Card } from '@/components/Card';
import { EditProfileSheet } from '@/components/EditProfileSheet';
import { OptionSheet, type SheetOption } from '@/components/OptionSheet';
import { InfoSheet } from '@/components/InfoSheet';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { Caption, ClashText, InterText } from '@/components/Typography';
import { CheckSquare } from '@/components/icons';
import { TRACKER_MAP, TRACKERS, withAlpha } from '@/lib/trackers';
import { useColors, useTrackerAccents, useThemeStore } from '@/lib/theme';
import { useFormatters } from '@/lib/format';
import { changeLanguage } from '@/lib/i18n';
import { codeToName, LANGUAGES, nameToCode } from '@/lib/languages';
import { requestNotificationPermission } from '@/lib/notifications';
import { useTrakl } from '@/lib/store';
import { shareBackup } from '@/lib/backup';
import { bestStreak, lifeScore } from '@/lib/stats';

function StatPill({ icon: Icon, value }: { icon: typeof Zap; value: string }) {
  const colors = useColors();
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{ backgroundColor: colors.surface2 }}
    >
      <Icon size={14} color={colors.text} strokeWidth={1.5} />
      <InterText weight="medium" style={{ fontSize: 13 }}>
        {value}
      </InterText>
    </View>
  );
}

function PrefRow({
  icon: Icon,
  label,
  value,
  toggle,
  toggleValue,
  onToggle,
  onPress,
}: {
  icon: typeof Globe;
  label: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
}) {
  const colors = useColors();
  const body = (
    <View className="flex-row items-center justify-between py-3.5">
      <View className="flex-row items-center gap-3">
        <Icon size={20} color={colors.text} strokeWidth={1.5} />
        <InterText weight="medium" style={{ fontSize: 15 }}>
          {label}
        </InterText>
      </View>
      {toggle ? (
        <Switch isSelected={toggleValue} onSelectedChange={onToggle} />
      ) : (
        <View className="flex-row items-center gap-1">
          {value ? (
            <InterText color={colors.muted} style={{ fontSize: 14 }}>
              {value}
            </InterText>
          ) : null}
          <ChevronRight size={18} color={colors.faint} strokeWidth={1.5} />
        </View>
      )}
    </View>
  );
  if (onPress && !toggle) {
    return (
      <PressableScale
        feedback="card"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {body}
      </PressableScale>
    );
  }
  return body;
}

function emailSupport() {
  void Linking.openURL('mailto:info@pimora.tech?subject=TRAKL%20Support');
}

const SHARE_MESSAGE = 'TRAKL — Everything. Tracked. Track habits, tasks, sleep, finance and more.';

function onShare() {
  if (Platform.OS === 'web') {
    // navigator.share throws "Permission denied" outside a user gesture or
    // when unsupported (e.g. iframe preview). Fall back gracefully.
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav && typeof nav.share === 'function') {
      nav.share({ text: SHARE_MESSAGE }).catch(() => {
        void nav.clipboard?.writeText?.(SHARE_MESSAGE);
      });
      return;
    }
    void nav?.clipboard?.writeText?.(SHARE_MESSAGE);
    return;
  }
  void Share.share({ message: SHARE_MESSAGE });
}

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const accents = useTrackerAccents();
  const { t, i18n } = useTranslation();
  const fmt = useFormatters();

  const themeMode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const profile = useTrakl((s) => s.profile);
  const enabled = useTrakl((s) => s.enabledTrackers);
  const toggleTracker = useTrakl((s) => s.toggleTracker);
  const updateProfile = useTrakl((s) => s.updateProfile);
  const notifOn = useTrakl((s) => s.notificationsEnabled);
  const setNotifOn = useTrakl((s) => s.setNotificationsEnabled);
  const resetApp = useTrakl((s) => s.resetApp);
  const loadSampleData = useTrakl((s) => s.loadSampleData);
  const exportAppData = useTrakl((s) => s.exportAppData);
  const importAppData = useTrakl((s) => s.importAppData);
  const transactions = useTrakl((s) => s.transactions);
  const habits = useTrakl((s) => s.habits);
  const tasks = useTrakl((s) => s.tasks);
  const goals = useTrakl((s) => s.goals);
  const planner = useTrakl((s) => s.planner);
  const sleep = useTrakl((s) => s.sleep);
  const workouts = useTrakl((s) => s.workouts);
  const mood = useTrakl((s) => s.mood);
  const water = useTrakl((s) => s.water);
  const weight = useTrakl((s) => s.weight);
  const meditation = useTrakl((s) => s.meditation);
  const customTrackers = useTrakl((s) => s.customTrackers);
  const monthlyBudget = useTrakl((s) => s.monthlyBudget);

  const [themeOpen, setThemeOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [notifDeniedOpen, setNotifDeniedOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState('');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [importResultOpen, setImportResultOpen] = useState(false);

  const onToggleNotifications = (value: boolean) => {
    setNotifOn(value);
    if (!value) return;
    // Turning on: verify the OS actually grants permission. If denied, revert
    // the toggle and tell the user how to enable it — otherwise the switch
    // would read "on" while no reminder could ever fire.
    void requestNotificationPermission().then((granted) => {
      if (granted) return;
      setNotifOn(false);
      setNotifDeniedOpen(true);
    });
  };

  const onRate = () => setRateOpen(true);
  const onAbout = () => setAboutOpen(true);
  const onHelp = () => setHelpOpen(true);
  const onDeleteData = () => setDeleteOpen(true);
  const confirmDelete = () => {
    resetApp();
    router.replace('/onboarding');
  };
  const confirmLoadSample = () => {
    loadSampleData();
    setSampleOpen(false);
  };

  const onExportBackup = () => {
    const json = exportAppData();
    void shareBackup(json);
    setImportResult({ success: true, message: t('backup.exportSuccess') });
    setImportResultOpen(true);
  };

  const onSubmitImport = (json: string) => {
    setImportOpen(false);
    setPendingImport(json);
    setImportConfirmOpen(true);
  };

  const confirmImport = () => {
    const res = importAppData(pendingImport);
    setImportResult(res);
    setImportResultOpen(true);
    setImportConfirmOpen(false);
    setPendingImport('');
  };

  // True once the user has logged anything across any tracker.
  const hasAnyData =
    transactions.length > 0 ||
    habits.length > 0 ||
    tasks.length > 0 ||
    goals.length > 0 ||
    planner.length > 0 ||
    sleep.length > 0 ||
    workouts.length > 0 ||
    mood.length > 0 ||
    water.length > 0 ||
    weight.length > 0 ||
    meditation.length > 0 ||
    customTrackers.length > 0;

  const score = lifeScore({
    habits,
    tasks,
    sleep,
    goals,
    transactions,
    monthlyBudget,
    enabledTrackers: enabled,
  });
  const tasksDone = tasks.filter((tk) => tk.done).length;
  const streak = bestStreak(habits);

  const memberSince = fmt.date(profile.memberSince, {
    month: 'short',
    year: 'numeric',
  });

  const allKeys = TRACKERS.map((tr) => tr.key);

  const themeLabel =
    themeMode === 'light'
      ? t('profile.themeLight')
      : themeMode === 'dark'
        ? t('profile.themeDark')
        : t('profile.themeSystem');

  const themeOptions: SheetOption[] = [
    { value: 'light', label: t('profile.themeLight') },
    { value: 'dark', label: t('profile.themeDark') },
    { value: 'system', label: t('profile.themeSystem') },
  ];

  const langOptions: SheetOption[] = LANGUAGES.map((l) => ({
    value: l.code,
    label: l.name,
    sub: l.native,
    leading: l.flag,
  }));

  const currentLangCode = nameToCode(profile.language);
  const currentLangLabel =
    LANGUAGES.find((l) => l.code === i18n.language)?.native ?? profile.language;

  const themeIcon = themeMode === 'dark' ? Moon : themeMode === 'system' ? Monitor : Sun;

  return (
    <Screen>
      <View className="flex-1">
        <View className="pt-safe">
          <ScreenHeader title={t('profile.title')} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile card */}
          <Card elevated className="items-center gap-3 pt-6">
            <Avatar
              image={profile.avatarImage}
              emoji={profile.avatarEmoji}
              size={64}
              emojiSize={30}
            />
            <View className="items-center">
              <ClashText weight="bold" style={{ fontSize: 22 }}>
                {profile.name}
              </ClashText>
              <InterText color={colors.muted} style={{ fontSize: 13, marginTop: 2 }}>
                {t('profile.memberSince', { date: memberSince })}
              </InterText>
            </View>
            <View className="mt-1 flex-row gap-2">
              <StatPill icon={Zap} value={`${streak}`} />
              <StatPill icon={CheckSquare} value={`${tasksDone}`} />
              <StatPill icon={BarChart2} value={score === null ? '—' : `${score}`} />
            </View>
          </Card>

          {/* My trackers */}
          <View>
            <SectionLabel>{t('profile.myTrackers')}</SectionLabel>
            <Card padded={false} className="px-4">
              {allKeys.map((key, i) => {
                const meta = TRACKER_MAP[key];
                const Icon = meta.icon;
                const accent = accents[key];
                return (
                  <View
                    key={key}
                    className="flex-row items-center justify-between py-3.5"
                    style={
                      i < allKeys.length - 1
                        ? { borderBottomWidth: 1, borderBottomColor: colors.border }
                        : undefined
                    }
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: withAlpha(accent, 0.12),
                        }}
                        className="items-center justify-center"
                      >
                        <Icon size={18} color={accent} strokeWidth={1.5} />
                      </View>
                      <InterText weight="medium" style={{ fontSize: 15 }}>
                        {t(`trackerNames.${key}`)}
                      </InterText>
                    </View>
                    <Switch
                      isSelected={enabled.includes(key)}
                      onSelectedChange={() => toggleTracker(key)}
                    />
                  </View>
                );
              })}
            </Card>
          </View>

          {/* Preferences */}
          <View>
            <SectionLabel>{t('profile.preferences')}</SectionLabel>
            <Card padded={false} className="px-4">
              <PrefRow
                icon={Globe}
                label={t('profile.language')}
                value={currentLangLabel}
                onPress={() => setLangOpen(true)}
              />
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <PrefRow
                icon={themeIcon}
                label={t('profile.theme')}
                value={themeLabel}
                onPress={() => setThemeOpen(true)}
              />
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <PrefRow
                icon={Bell}
                label={t('profile.notifications')}
                toggle
                toggleValue={notifOn}
                onToggle={onToggleNotifications}
              />
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <PrefRow
                icon={UserPen}
                label={t('editProfile.title')}
                onPress={() => setEditOpen(true)}
              />
            </Card>
          </View>

          {/* Trakl Pro */}
          <View>
            <SectionLabel>{t('profile.pro')}</SectionLabel>
            <Card style={{ borderColor: colors.text, borderWidth: 1 }} className="gap-4">
              <View className="flex-row items-center gap-2">
                <Crown size={22} color={colors.text} strokeWidth={1.5} />
                <ClashText weight="medium" style={{ fontSize: 16 }}>
                  {t('profile.proTagline')}
                </ClashText>
              </View>
              <View className="gap-2.5">
                {[
                  { icon: Cloud, label: t('profile.proBackup') },
                  { icon: Cpu, label: t('profile.proAi') },
                  { icon: XCircle, label: t('profile.proNoAds') },
                ].map((f) => (
                  <View key={f.label} className="flex-row items-center gap-2.5">
                    <f.icon size={18} color={colors.muted} strokeWidth={1.5} />
                    <InterText style={{ fontSize: 14 }}>{f.label}</InterText>
                  </View>
                ))}
              </View>
              <PrimaryButton label={t('profile.comingSoon')} disabled />
            </Card>
          </View>

          {/* More */}
          <View>
            <SectionLabel>{t('profile.more')}</SectionLabel>
            <Card padded={false} className="px-4">
              <PrefRow
                icon={Award}
                label={t('profileExtra.achievements')}
                onPress={() => router.push('/achievements')}
              />
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <PrefRow icon={Star} label={t('profile.rate')} onPress={onRate} />
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <PrefRow icon={Share2} label={t('profile.share')} onPress={onShare} />
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <PrefRow icon={HelpCircle} label={t('profile.help')} onPress={onHelp} />
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <PrefRow icon={Info} label={t('profile.about')} onPress={onAbout} />
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <PrefRow icon={Download} label={t('backup.exportBackup')} onPress={onExportBackup} />
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <PrefRow icon={Upload} label={t('backup.importBackup')} onPress={() => setImportOpen(true)} />
              {!hasAnyData ? (
                <>
                  <View style={{ height: 1, backgroundColor: colors.border }} />
                  <PrefRow
                    icon={Sparkles}
                    label={t('profile.loadSample')}
                    onPress={() => setSampleOpen(true)}
                  />
                </>
              ) : null}
            </Card>
          </View>

          <View className="items-center" style={{ gap: 10, marginTop: 4 }}>
            <PressableScale
              feedback="card"
              onPress={onDeleteData}
              accessibilityRole="button"
              accessibilityLabel={t('profile.deleteData')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                alignSelf: 'stretch',
                paddingVertical: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: withAlpha(colors.destructive, 0.4),
                backgroundColor: withAlpha(colors.destructive, 0.08),
                marginBottom: 6,
              }}
            >
              <Trash2 size={18} color={colors.destructive} strokeWidth={1.75} />
              <InterText weight="semibold" color={colors.destructive} style={{ fontSize: 15 }}>
                {t('profile.deleteData')}
              </InterText>
            </PressableScale>
            <Image
              source={require('@/assets/logo.png')}
              style={{ width: 120, height: 40, borderRadius: 10 }}
              resizeMode="cover"
            />
            <Caption color={colors.faint} style={{ textAlign: 'center' }}>
              TRAKL · Everything. Tracked.
            </Caption>
            <View className="flex-row gap-2 justify-center">
              <PressableScale
                feedback="chip"
                onPress={() => void Linking.openURL(t('legal.privacyUrl'))}
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel={t('legal.privacyPolicy')}
              >
                <Caption
                  color={colors.muted}
                  style={{ fontSize: 11, textDecorationLine: 'underline' }}
                >
                  {t('legal.privacyPolicy')}
                </Caption>
              </PressableScale>
              <Caption color={colors.faint} style={{ fontSize: 11 }}>
                ·
              </Caption>
              <PressableScale
                feedback="chip"
                onPress={() => void Linking.openURL(t('legal.termsUrl'))}
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel={t('legal.termsOfService')}
              >
                <Caption
                  color={colors.muted}
                  style={{ fontSize: 11, textDecorationLine: 'underline' }}
                >
                  {t('legal.termsOfService')}
                </Caption>
              </PressableScale>
            </View>
            <PressableScale
              feedback="chip"
              onPress={() => void Linking.openURL('https://www.pimora.tech/')}
              hitSlop={8}
              accessibilityRole="link"
              accessibilityLabel="Created by Pimora"
            >
              <Caption
                color={colors.muted}
                style={{ textAlign: 'center', letterSpacing: 0.5, fontSize: 11 }}
              >
                CREATED BY PIMORA
              </Caption>
            </PressableScale>
          </View>
        </ScrollView>
        <AdBanner />
      </View>

      <OptionSheet
        visible={themeOpen}
        title={t('profile.chooseTheme')}
        options={themeOptions}
        selected={themeMode}
        onSelect={(v) => {
          if (v === 'light' || v === 'dark' || v === 'system') setMode(v);
        }}
        onClose={() => setThemeOpen(false)}
      />
      <OptionSheet
        visible={langOpen}
        title={t('profile.chooseLanguage')}
        options={langOptions}
        selected={i18n.language || currentLangCode}
        onSelect={(code) => {
          void changeLanguage(code);
          updateProfile({ language: codeToName(code) });
        }}
        onClose={() => setLangOpen(false)}
      />
      <EditProfileSheet
        visible={editOpen}
        initial={{
          name: profile.name,
          avatarEmoji: profile.avatarEmoji,
          avatarImage: profile.avatarImage,
        }}
        onClose={() => setEditOpen(false)}
        onSave={(value) => updateProfile(value)}
      />

      <InfoSheet
        visible={helpOpen}
        title={t('profile.help')}
        body={t('profileMsg.helpBody')}
        actions={[{ label: 'info@pimora.tech', onPress: emailSupport }]}
        onClose={() => setHelpOpen(false)}
      />
      <InfoSheet
        visible={aboutOpen}
        title={t('profile.about')}
        body={t('profileMsg.aboutBody')}
        actions={[{ label: 'info@pimora.tech', onPress: emailSupport, variant: 'plain' }]}
        onClose={() => setAboutOpen(false)}
      />
      <InfoSheet
        visible={rateOpen}
        title={t('profile.rate')}
        body={t('profileMsg.rateBody')}
        onClose={() => setRateOpen(false)}
      />
      <InfoSheet
        visible={notifDeniedOpen}
        title={t('notifReminders.permissionDeniedTitle')}
        body={t('notifReminders.permissionDeniedBody')}
        onClose={() => setNotifDeniedOpen(false)}
      />
      <ConfirmSheet
        visible={deleteOpen}
        title={t('profileMsg.deleteTitle')}
        body={t('profileMsg.deleteBody')}
        confirmLabel={t('profileMsg.deleteConfirm')}
        cancelLabel={t('profileMsg.cancel')}
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />
      <ConfirmSheet
        visible={sampleOpen}
        destructive={false}
        title={t('profileMsg.sampleTitle')}
        body={t('profileMsg.sampleBody')}
        confirmLabel={t('profileMsg.sampleConfirm')}
        cancelLabel={t('profileMsg.cancel')}
        onConfirm={confirmLoadSample}
        onClose={() => setSampleOpen(false)}
      />
      <BackupSheet
        visible={importOpen}
        onClose={() => setImportOpen(false)}
        onSubmit={onSubmitImport}
      />
      <ConfirmSheet
        visible={importConfirmOpen}
        destructive={false}
        title={t('backup.confirmTitle')}
        body={t('backup.confirmBody')}
        confirmLabel={t('backup.confirm')}
        cancelLabel={t('profileMsg.cancel')}
        onConfirm={confirmImport}
        onClose={() => {
          setImportConfirmOpen(false);
          setPendingImport('');
        }}
      />
      {importResult && (
        <InfoSheet
          visible={importResultOpen}
          title={importResult.success ? t('common.done') : t('common.error')}
          body={importResult.message}
          onClose={() => setImportResultOpen(false)}
        />
      )}
    </Screen>
  );
}

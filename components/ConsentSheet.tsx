import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Info, Check, X } from 'lucide-react-native';

import { useColors } from '@/lib/theme';
import { setConsentStatus } from '@/lib/consent';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';
import { InterText, ClashText, Caption } from './Typography';
import { withAlpha } from '@/lib/trackers';

interface ConsentSheetProps {
  visible: boolean;
  onClose: (granted: boolean) => void;
}

export function ConsentSheet({ visible, onClose }: ConsentSheetProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleConsent = async (granted: boolean) => {
    setLoading(true);
    try {
      await setConsentStatus(granted ? 'granted' : 'denied');
      onClose(granted);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: withAlpha(colors.text, 0.5),
        justifyContent: 'flex-end',
        zIndex: 1000,
      }}
    >
      <View
        style={{
          backgroundColor: colors.bg,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 32,
          maxHeight: '80%',
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="items-center gap-4 mb-6">
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: withAlpha(colors.text, 0.08),
              }}
              className="items-center justify-center"
            >
              <Info size={24} color={colors.text} strokeWidth={1.5} />
            </View>
            <ClashText weight="bold" style={{ fontSize: 20, textAlign: 'center' }}>
              {t('consent.title')}
            </ClashText>
          </View>

          <InterText color={colors.muted} style={{ fontSize: 14, lineHeight: 20, marginBottom: 16 }}>
            {t('consent.description')}
          </InterText>

          <Card className="gap-3 mb-6" style={{ backgroundColor: withAlpha(colors.text, 0.04) }}>
            <View className="flex-row gap-2">
              <Check size={18} color={colors.text} strokeWidth={1.5} />
              <InterText style={{ fontSize: 13, flex: 1 }}>
                {t('consent.personalized')}
              </InterText>
            </View>
            <View className="flex-row gap-2">
              <Check size={18} color={colors.text} strokeWidth={1.5} />
              <InterText style={{ fontSize: 13, flex: 1 }}>
                {t('consent.measurement')}
              </InterText>
            </View>
            <View className="flex-row gap-2">
              <X size={18} color={colors.muted} strokeWidth={1.5} />
              <InterText color={colors.muted} style={{ fontSize: 13, flex: 1 }}>
                {t('consent.noTracking')}
              </InterText>
            </View>
          </Card>

          <Caption color={colors.muted} style={{ fontSize: 12, marginBottom: 20, textAlign: 'center' }}>
            {t('consent.privacyNote')}
          </Caption>

          <View className="gap-3">
            <PrimaryButton
              label={t('consent.accept')}
              onPress={() => void handleConsent(true)}
              disabled={loading}
            />
            <PrimaryButton
              label={t('consent.reject')}
              onPress={() => void handleConsent(false)}
              disabled={loading}
              variant="secondary"
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

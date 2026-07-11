import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { ClashText, InterText } from '@/components/Typography';
import { bannerUnitId, USE_TEST_ADS } from '@/lib/admobConfig';
import { useColors } from '@/lib/theme';
import { withAlpha } from '@/lib/trackers';
import { getConsentStatus, requestAndShowConsent } from '@/lib/consent';

// Platform-correct banner unit ID (Android unit on Android, iOS unit on iOS),
// test unit in dev / production unit in release. See lib/admobConfig.ts.
const BANNER_UNIT_ID = bannerUnitId;

const LOG = '[AdMob]';

type GoogleMobileAds = typeof import('react-native-google-mobile-ads');

// The native AdMob module is only present in a dev build / TestFlight / published
// app. In Expo Go (storeClient) the TurboModule isn't registered, so even
// touching the module throws "RNGoogleMobileAdsModule could not be found".
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Styled "AD / SPONSORED" placeholder shown when the ad can't be displayed
 * (no SDK / Expo Go / web / load failure) so the dedicated ad area never
 * collapses to blank space.
 */
function PlaceholderBanner() {
  const colors = useColors();
  return (
    <View
      style={{
        backgroundColor: colors.surface2,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        height: 64,
      }}
      className="w-full items-center justify-center gap-0.5"
    >
      <ClashText
        style={{ color: withAlpha(colors.text, 0.55), letterSpacing: 2 }}
        className="text-[11px] font-semibold"
      >
        AD
      </ClashText>
      <InterText
        style={{ color: withAlpha(colors.text, 0.4), letterSpacing: 1 }}
        className="text-[10px]"
      >
        SPONSORED
      </InterText>
    </View>
  );
}

/**
 * Google AdMob banner. Loads the native ad SDK when available (dev build /
 * TestFlight / published app). In the web/Expo Go preview, when the SDK isn't
 * present, or when the ad fails to load, we fall back to the styled
 * "AD / SPONSORED" placeholder.
 */
export function AdBanner() {
  const colors = useColors();
  const [ads, setAds] = useState<GoogleMobileAds | null>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [consentStatus, setConsentStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  useEffect(() => {
    if (__DEV__) {
      console.log(`${LOG} unit in use:`, BANNER_UNIT_ID, USE_TEST_ADS ? '(TEST)' : '(PROD)');
    }
    // Check cached consent status on mount. If unknown, trigger the
    // official Google UMP SDK consent flow (which also handles ATT on iOS).
    void getConsentStatus().then((status) => {
      if (status !== 'unknown') {
        setConsentStatus(status);
        return;
      }
      // Trigger UMP consent flow — this shows the Google-rendered form.
      void requestAndShowConsent().then((resolved) => {
        setConsentStatus(resolved);
      });
    });
  }, []);

  useEffect(() => {
    // Don't load ads until consent is determined
    if (consentStatus === 'unknown') return;

    // Don't even attempt to load the native ad SDK in Expo Go — accessing the
    // module there throws a fatal "module could not be found" error.
    if (isExpoGo) {
      if (__DEV__) {
        console.warn(`${LOG} running in Expo Go — native AdMob SDK unavailable. Use a dev build.`);
      }
      setFailed(true);
      return;
    }
    let mounted = true;
    if (__DEV__) {
      console.log(`${LOG} loading native SDK module...`);
    }
    import('react-native-google-mobile-ads')
      .then((mod) => {
        if (!mounted) return;
        try {
          if (mod?.default && mod?.BannerAd) {
            if (__DEV__) {
              console.log(`${LOG} module loaded, initializing SDK...`);
            }
            mod
              .default()
              .initialize()
              .then((statuses) => {
                if (__DEV__) {
                  console.log(`${LOG} SDK initialized:`, statuses);
                }
              })
              .catch((e) => {
                if (__DEV__) {
                  console.warn(`${LOG} SDK init error:`, e);
                }
              });
            setAds(mod);
          } else {
            if (__DEV__) {
              console.warn(`${LOG} module loaded but BannerAd/default missing.`);
            }
            setFailed(true);
          }
        } catch (e) {
          if (__DEV__) {
            console.warn(`${LOG} native module not registered in this binary:`, e);
          }
          setFailed(true);
        }
      })
      .catch((e) => {
        if (__DEV__) {
          console.warn(`${LOG} failed to import native SDK:`, e);
        }
        if (mounted) setFailed(true);
      });
    // oxlint-disable-next-line typescript/consistent-return
    return () => {
      mounted = false;
    };
  }, [consentStatus]);

  // No SDK, failed import, or the ad failed to load -> styled placeholder.
  if (failed || !ads) {
    return <PlaceholderBanner />;
  }

  const { BannerAd, BannerAdSize } = ads;

  return (
    <View
      style={{
        backgroundColor: colors.surface2,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
      className="w-full items-center justify-center"
    >
      {/* Keep the styled placeholder visible until a real ad is loaded so the
          area never appears blank while the request is in flight. */}
      {!loaded && <PlaceholderBanner />}
      {consentStatus === 'granted' && (
        <BannerAd
          unitId={BANNER_UNIT_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          onAdLoaded={() => {
            if (__DEV__) {
              console.log(`${LOG} ad loaded successfully ✅ (unit ${BANNER_UNIT_ID})`);
            }
            setLoaded(true);
          }}
          onAdFailedToLoad={(error: Error & { code?: string | number }) => {
            if (__DEV__) {
              console.warn(
                `${LOG} ad FAILED to load ❌ code=${error?.code ?? 'n/a'} message=${
                  error?.message ?? 'n/a'
                }`,
              );
            }
            setLoaded(false);
            setFailed(true);
          }}
        />
      )}
    </View>
  );
}

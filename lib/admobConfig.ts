import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// AdMob configuration — separate IDs for Android and iOS.
//
// Two distinct AdMob apps are configured (one per platform). Never mix Android
// and iOS ad IDs — Google rejects requests where the App ID and Ad Unit ID
// belong to different apps/platforms. Platform.select() below guarantees the
// correct pairing at runtime.
//
// WHERE EACH ID GOES
// ------------------
//   App IDs (androidAppId / iosAppId)
//     -> ALSO paste into app.config.ts under the
//        'react-native-google-mobile-ads' plugin (androidAppId / iosAppId).
//        The App ID must live in the native config or the SDK won't initialize.
//        The copies here are the single source of truth you read from JS.
//
//   Banner Unit IDs (androidBannerUnitId / iosBannerUnitId)
//     -> used directly by components/AdBanner.tsx via `bannerUnitId` below.
//
// TEST vs PRODUCTION
// ------------------
//   USE_TEST_ADS = __DEV__  -> serve Google's official test units in dev,
//   your real production units in release builds. Switching is automatic.
//   To force real ads in dev for a quick check, set FORCE_TEST_ADS = false
//   AND remove __DEV__ from USE_TEST_ADS (or temporarily set USE_TEST_ADS=false).
// ---------------------------------------------------------------------------

// ---- Production IDs (real AdMob apps) -------------------------------------
const androidAppId = 'ca-app-pub-4918095220813645~5762692634';
const iosAppId = 'ca-app-pub-4918095220813645~1685670652';

const androidBannerUnitId = 'ca-app-pub-4918095220813645/2537763492';
const iosBannerUnitId = 'ca-app-pub-4918095220813645/6473139075';

// ---- Google official test IDs (safe, never bill, always fill) -------------
const testAndroidBannerUnitId = 'ca-app-pub-3940256099942544/6300978111';
const testIosBannerUnitId = 'ca-app-pub-3940256099942544/2934735716';

// Flip to true to force the Google test banner regardless of build type
// (useful to confirm the integration independently of AdMob review/no-fill).
const FORCE_TEST_ADS = false;

export const USE_TEST_ADS = FORCE_TEST_ADS || __DEV__;

/** Platform-correct App ID (Android App ID on Android, iOS App ID on iOS). */
export const appId = Platform.select({
  android: androidAppId,
  ios: iosAppId,
  default: androidAppId,
});

/**
 * Platform-correct banner Ad Unit ID. Serves the matching test unit in dev /
 * when forced, and the matching production unit in release builds. Never mixes
 * Android and iOS units.
 */
export const bannerUnitId = USE_TEST_ADS
  ? Platform.select({
      android: testAndroidBannerUnitId,
      ios: testIosBannerUnitId,
      default: testAndroidBannerUnitId,
    })
  : Platform.select({
      android: androidBannerUnitId,
      ios: iosBannerUnitId,
      default: androidBannerUnitId,
    });

export const admobConfig = {
  androidAppId,
  iosAppId,
  androidBannerUnitId,
  iosBannerUnitId,
  appId,
  bannerUnitId,
  useTestAds: USE_TEST_ADS,
} as const;

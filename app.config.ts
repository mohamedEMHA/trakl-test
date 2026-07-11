import type { ConfigContext, ExpoConfig } from '@expo/config';

type ExpoPlugins = NonNullable<ExpoConfig['plugins']>;

const CURRENT_VERSION_CODE = 10;

function requireEnv(name: string, fallback: string): string {
  // oxlint-disable-next-line expo/no-dynamic-env-var
  const value = process.env[name];
  if (process.env.CI === '1' || process.env.CI === 'true') {
    if (!value) {
      throw new Error(`Missing required CI environment variable: ${name}`);
    }
    return value;
  }
  return value ?? fallback;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const nativePlugins: ExpoPlugins =
    process.env.EXPO_PLATFORM === 'native'
      ? [['expo-dev-client', { launchMode: 'most-recent' }], 'react-native-maps']
      : [];

  const appVersion = requireEnv('BILT_APP_VERSION', '1.0.1');
  const androidPackage = requireEnv('BILT_ANDROID_PACKAGE', 'tech.pimora.trakl');
  const iosBundleId = requireEnv('BILT_IOS_BUNDLE_ID', 'tech.pimora.trakl');
  const androidVersionCode = Number(requireEnv('BILT_ANDROID_VERSION_CODE', String(CURRENT_VERSION_CODE)));

  if (!Number.isInteger(androidVersionCode) || androidVersionCode <= 0) {
    throw new Error(`Invalid BILT_ANDROID_VERSION_CODE: ${androidVersionCode}. Must be a positive integer.`);
  }

  return {
    ...config,
    owner: 'mopatch',
    name: 'TRAKL',
    slug: 'trakl',
    newArchEnabled: true,
    version: appVersion,
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    scheme: 'trakl',
    icon: './assets/logo.png',
    runtimeVersion: {
      policy: 'appVersion',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSUserTrackingUsageDescription: 'TRAKL uses your advertising identifier to deliver personalized ads and measure ad effectiveness. You can change this in Settings.',
      },
      supportsTablet: true,
      bundleIdentifier: iosBundleId,
    },
    android: {
      package: androidPackage,
      // Bump on every Play Console release (must be > previously uploaded versionCode).
      versionCode: androidVersionCode,
      permissions: ['com.google.android.gms.permission.AD_ID'],
    },
    extra: {
      appStoreAppId: process.env.BILT_APP_STORE_APP_ID,
      eas: {
        projectId: '926711b5-c6e0-4df2-a9d7-0258442be118',
      },
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-localization',
      [
        'expo-notifications',
        {
          icon: './assets/logo.png',
          color: '#f0c061',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'TRAKL needs access to your photos so you can set a profile picture.',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/splash.png',
          resizeMode: 'cover',
          backgroundColor: '#ffffff',
        },
      ],
      [
        'react-native-google-mobile-ads',
        {
          // TRAKL production AdMob App IDs (separate AdMob app per platform).
          // These MUST match lib/admobConfig.ts (androidAppId / iosAppId).
          // Google sample test App IDs for reference:
          //   android: ca-app-pub-3940256099942544~3347511713
          //   ios:     ca-app-pub-3940256099942544~1458002511
          androidAppId: 'ca-app-pub-4918095220813645~5762692634',
          iosAppId: 'ca-app-pub-4918095220813645~1685670652',
          // Delay app measurement until consent is obtained (required for EEA).
          delayAppMeasurementInit: true,
        },
      ],
      ...nativePlugins,
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};

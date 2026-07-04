import type { ConfigContext, ExpoConfig } from '@expo/config';

type ExpoPlugins = NonNullable<ExpoConfig['plugins']>;

export default ({ config }: ConfigContext): ExpoConfig => {
  const nativePlugins: ExpoPlugins =
    process.env.EXPO_PLATFORM === 'native'
      ? [['expo-dev-client', { launchMode: 'most-recent' }], 'react-native-maps']
      : [];

  return {
    ...config,
    owner: 'mopatch',
    name: 'TRAKL',
    slug: 'trakl',
    newArchEnabled: true,
    version: process.env.BILT_APP_VERSION ?? '1.0.0',
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
      },
      supportsTablet: true,
      bundleIdentifier: process.env.BILT_IOS_BUNDLE_ID ?? 'com.yourcompany.yourapp',
    },
    android: {
      package: process.env.BILT_ANDROID_PACKAGE ?? 'trakl.app',
      versionCode: 1,
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

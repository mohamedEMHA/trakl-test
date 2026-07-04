import { Platform } from 'react-native';

/**
 * Clash Display weights served from Fontshare CDN.
 * On web these are loaded through the @import in global.css; on native we
 * register the remote TTFs through expo-font's useFonts (URI support).
 */
export const ClashDisplayFonts =
  Platform.OS === 'web'
    ? {}
    : {
        ClashDisplay_400Regular: {
          uri: 'https://cdn.fontshare.com/wf/VFMK2COV3DN37JR7JQ4CAOJPZ7KWKNY7/ODD5YJNDLHZZB2MIT3DPVH4EIHAMZ34D/BSY64LPTT3OPLVKAZKL3AHKRWZ3D74AC.ttf',
        },
        ClashDisplay_500Medium: {
          uri: 'https://cdn.fontshare.com/wf/2GQIT54GKQY3JRFTSHS4ARTRNRQISSAA/3CIP5EBHRRHE5FVQU3VFROPUERNDSTDF/JTSL5QESUXATU47LCPUNHZQBDDIWDOSW.ttf',
        },
        ClashDisplay_600SemiBold: {
          uri: 'https://cdn.fontshare.com/wf/FPDAZ2S6SW4QMSRIIKNNGTPM6VIXYMKO/5HNPQ453FRLIQWV2FNOBUU3FKTDZQVSG/Z3MGHFHX6DCTLQ55LJYRJ5MDCZPMFZU6.ttf',
        },
        ClashDisplay_700Bold: {
          uri: 'https://cdn.fontshare.com/wf/BFBSY7LX5W2U2EROCLVVTQP4VS7S4PC3/IIUX4FGTMD2LK2VWD3RVTAS4SSMUN7B5/53RZKGODFYDW3QHTIL7IPOWTBCSUEZK7.ttf',
        },
      };

/**
 * Resolve the platform-correct font family name for a Clash Display weight.
 * On web the @font-face family is "Clash Display" with numeric weights, so we
 * return that and let `fontWeight` pick the face. On native we return the
 * registered family name.
 */
export type ClashWeight = 'regular' | 'medium' | 'semibold' | 'bold';

const NATIVE_CLASH: Record<ClashWeight, string> = {
  regular: 'ClashDisplay_400Regular',
  medium: 'ClashDisplay_500Medium',
  semibold: 'ClashDisplay_600SemiBold',
  bold: 'ClashDisplay_700Bold',
};

const WEB_WEIGHT: Record<ClashWeight, '400' | '500' | '600' | '700'> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export function clashFont(weight: ClashWeight): {
  fontFamily: string;
  fontWeight?: '400' | '500' | '600' | '700';
} {
  if (Platform.OS === 'web') {
    return { fontFamily: 'Clash Display', fontWeight: WEB_WEIGHT[weight] };
  }
  return { fontFamily: NATIVE_CLASH[weight] };
}

const NATIVE_INTER: Record<'regular' | 'medium' | 'semibold' | 'bold', string> = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

const INTER_WEB_WEIGHT: Record<
  'regular' | 'medium' | 'semibold' | 'bold',
  '400' | '500' | '600' | '700'
> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export function interFont(weight: 'regular' | 'medium' | 'semibold' | 'bold'): {
  fontFamily: string;
  fontWeight?: '400' | '500' | '600' | '700';
} {
  if (Platform.OS === 'web') {
    return { fontFamily: 'Inter', fontWeight: INTER_WEB_WEIGHT[weight] };
  }
  return { fontFamily: NATIVE_INTER[weight] };
}

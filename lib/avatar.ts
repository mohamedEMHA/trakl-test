import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/** Emoji choices offered as a lightweight avatar fallback. */
export const AVATAR_EMOJIS = [
  '🦊',
  '🐱',
  '🐼',
  '🦁',
  '🐸',
  '🐧',
  '🦄',
  '🐙',
  '🌟',
  '🔥',
  '🚀',
  '🌈',
] as const;

/**
 * Launch the system photo library and return a local image URI, or null if the
 * user cancels or denies permission. Safe across iOS / Android / web.
 */
export async function pickAvatarImage(): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo access in Settings to choose a profile picture.',
      );
      return null;
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0].uri;
}

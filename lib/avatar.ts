import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

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
 * Launch the system photo library and return a persistent local image URI, or null if the
 * user cancels or denies permission. Safe across iOS / Android / web.
 *
 * The returned URI is copied to the app's document directory to ensure it persists
 * even if the image picker's cache is cleared by the OS.
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

  const pickedUri = result.assets[0].uri;

  // On web, return the URI as-is (blob URL)
  if (Platform.OS === 'web') {
    return pickedUri;
  }

  // On native, copy to app's document directory for persistence (cache
  // directory can be cleared by the OS at any time, causing the avatar to
  // silently disappear).
  try {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const docDir = (FileSystem as { documentDirectory?: string }).documentDirectory;
    if (!docDir) return pickedUri; // Fallback if documentDirectory is unavailable
    const filename = `avatar-${Date.now()}.jpg`;
    const persistedUri = `${docDir}${filename}`;
    await FileSystem.copyAsync({
      from: pickedUri,
      to: persistedUri,
    });
    return persistedUri;
  } catch (error) {
    if (__DEV__) {
      console.warn('[Avatar] Failed to persist image, using original URI:', error);
    }
    return pickedUri; // Fallback to original URI if copy fails
  }
}

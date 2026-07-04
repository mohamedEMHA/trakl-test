import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';

import { useColors } from '@/lib/theme';
import { InterText } from './Typography';

type Props = {
  /** Optional image URI / data URL. Falls back to the emoji on error or absence. */
  image?: string;
  emoji: string;
  /** Diameter of the avatar circle, in pixels. */
  size: number;
  /** Emoji font size; defaults to roughly half the avatar size. */
  emojiSize?: number;
  /** Show a hairline border around the circle. */
  bordered?: boolean;
};

/**
 * Circular avatar that prefers a photo and gracefully falls back to the emoji
 * if no image is set or the image fails to load (e.g. a stale/invalid URI).
 */
export function Avatar({ image, emoji, size, emojiSize, bordered }: Props) {
  const colors = useColors();
  const [failed, setFailed] = useState(false);

  // Reset the error flag whenever the source changes so a new pick can render.
  useEffect(() => {
    setFailed(false);
  }, [image]);

  const showImage = Boolean(image) && !failed;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: colors.surface2,
        overflow: 'hidden',
        ...(bordered ? { borderWidth: 1, borderColor: colors.border } : null),
      }}
      className="items-center justify-center"
    >
      {showImage ? (
        <Image
          source={{ uri: image }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <InterText style={{ fontSize: emojiSize ?? Math.round(size * 0.47) }}>{emoji}</InterText>
      )}
    </View>
  );
}

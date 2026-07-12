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

/** Longest edge of the stored avatar, in pixels. Keeps the data URL small. */
const MAX_DIMENSION = 256;

/**
 * Read a File into a downscaled, square-cropped JPEG data URL.
 *
 * We deliberately re-encode through a canvas instead of returning the raw
 * FileReader result: the original file can be several megabytes, which both
 * blows past localStorage's quota (so the persisted store write fails and the
 * avatar "disappears" on reload) and produces an unwieldy in-memory string.
 * A small JPEG data URL renders reliably in react-native-web's <Image> and
 * persists cleanly.
 */
function fileToAvatarDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    img.addEventListener('load', () => {
      try {
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        const target = Math.min(size, MAX_DIMENSION);

        const canvas = document.createElement('canvas');
        canvas.width = target;
        canvas.height = target;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }
        ctx.drawImage(img, sx, sy, size, size, 0, 0, target, target);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        cleanup();
        resolve(dataUrl.startsWith('data:image') ? dataUrl : null);
      } catch {
        cleanup();
        resolve(null);
      }
    });

    img.addEventListener('error', () => {
      cleanup();
      resolve(null);
    });

    img.src = objectUrl;
  });
}

/**
 * Web image picker. Uses a native file input and returns the selected image as
 * a compact base64 JPEG data URL so the value renders reliably and survives
 * page reloads and store persistence.
 */
export async function pickAvatarImage(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    let settled = false;
    const done = (value: string | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        done(null);
        return;
      }
      fileToAvatarDataUrl(file)
        .then(done)
        .catch(() => done(null));
    });

    // If the user dismisses the picker without choosing a file, resolve null.
    input.addEventListener('cancel', () => done(null));

    input.click();
  });
}

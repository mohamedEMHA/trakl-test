import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Camera, Trash2 } from 'lucide-react-native';

import { AVATAR_EMOJIS, pickAvatarImage } from '@/lib/avatar';
import { useColors } from '@/lib/theme';
import { Avatar } from './Avatar';
import { FormSheet, Field, TextField } from './FormSheet';
import { PressableScale } from './PressableScale';
import { InterText } from './Typography';

export type EditProfileValue = {
  name: string;
  avatarEmoji: string;
  avatarImage?: string;
};

type Props = {
  visible: boolean;
  initial: EditProfileValue;
  onClose: () => void;
  onSave: (value: EditProfileValue) => void;
};

export function EditProfileSheet({ visible, initial, onClose, onSave }: Props) {
  const colors = useColors();
  const { t } = useTranslation();

  const [name, setName] = useState(initial.name);
  const [emoji, setEmoji] = useState(initial.avatarEmoji);
  const [image, setImage] = useState<string | undefined>(initial.avatarImage);

  // Re-sync local form state whenever the sheet (re)opens.
  useEffect(() => {
    if (visible) {
      setName(initial.name);
      setEmoji(initial.avatarEmoji);
      setImage(initial.avatarImage);
    }
  }, [visible, initial.name, initial.avatarEmoji, initial.avatarImage]);

  const choosePhoto = async () => {
    const uri = await pickAvatarImage();
    if (uri) setImage(uri);
  };

  const save = () => {
    onSave({
      name: name.trim() || initial.name || 'Alex',
      avatarEmoji: emoji,
      avatarImage: image,
    });
    onClose();
  };

  return (
    <FormSheet
      visible={visible}
      title={t('editProfile.title')}
      submitLabel={t('editProfile.save')}
      onSubmit={save}
      onClose={onClose}
      submitDisabled={name.trim().length === 0}
    >
      {/* Avatar preview + actions */}
      <View className="items-center gap-3">
        <Avatar image={image} emoji={emoji} size={88} emojiSize={40} bordered />
        <View className="flex-row gap-2">
          <PressableScale
            feedback="chip"
            onPress={choosePhoto}
            accessibilityRole="button"
            accessibilityLabel={t('editProfile.choosePhoto')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Camera size={16} color={colors.text} strokeWidth={1.5} />
            <InterText weight="medium" style={{ fontSize: 13 }}>
              {t('editProfile.choosePhoto')}
            </InterText>
          </PressableScale>
          {image ? (
            <PressableScale
              feedback="chip"
              onPress={() => setImage(undefined)}
              accessibilityRole="button"
              accessibilityLabel={t('editProfile.removePhoto')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: colors.surface2,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Trash2 size={16} color={colors.destructive} strokeWidth={1.5} />
              <InterText weight="medium" color={colors.destructive} style={{ fontSize: 13 }}>
                {t('editProfile.removePhoto')}
              </InterText>
            </PressableScale>
          ) : null}
        </View>
      </View>

      <Field label={t('editProfile.name')}>
        <TextField
          value={name}
          onChangeText={setName}
          placeholder={t('editProfile.namePlaceholder')}
        />
      </Field>

      <Field label={t('editProfile.emoji')}>
        <View className="flex-row flex-wrap gap-2">
          {AVATAR_EMOJIS.map((e) => {
            const active = e === emoji && !image;
            return (
              <PressableScale
                feedback="chip"
                key={e}
                onPress={() => setEmoji(e)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors.surface2 : colors.surface,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? colors.text : colors.border,
                }}
              >
                <InterText style={{ fontSize: 24 }}>{e}</InterText>
              </PressableScale>
            );
          })}
        </View>
        {image ? (
          <InterText color={colors.muted} style={{ fontSize: 12, marginTop: 4 }}>
            {t('editProfile.emojiHint')}
          </InterText>
        ) : null}
      </Field>
    </FormSheet>
  );
}

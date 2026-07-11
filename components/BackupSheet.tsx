import { useEffect, useRef, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useColors } from '@/lib/theme';
import { FormSheet, Field } from './FormSheet';
import { InterText } from './Typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (json: string) => void;
};

/**
 * Sheet for importing a JSON backup. On native the user pastes the JSON into a
 * multiline text field; on web we also accept a file upload via a hidden HTML
 * input so restoring from a downloaded file is one click. The parent is
 * responsible for confirming the import and applying the data.
 */
export function BackupSheet({ visible, onClose, onSubmit }: Props) {
  const colors = useColors();
  const { t } = useTranslation();
  const [json, setJson] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (visible) setJson('');
  }, [visible]);

  const handleSubmit = () => {
    const trimmed = json.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  const handleWebFile = (file: File) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const raw = reader.result ?? '';
      const text = typeof raw === 'string' ? raw : '';
      setJson(text);
      onSubmit(text.trim());
    });
    reader.addEventListener('error', () => {
      // The parent will surface any file-read errors through the import result.
    });
    reader.readAsText(file);
  };

  return (
    <FormSheet
      visible={visible}
      title={t('backup.importTitle')}
      submitLabel={t('backup.import')}
      onSubmit={handleSubmit}
      onClose={onClose}
      submitDisabled={json.trim().length === 0}
    >
      <Field label={t('backup.pasteJson')}>
        <TextInput
          value={json}
          onChangeText={setJson}
          placeholder={t('backup.pasteJsonPlaceholder')}
          placeholderTextColor={colors.faint}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            minHeight: 120,
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontFamily: Platform.OS === 'web' ? 'Inter' : 'Inter_400Regular',
            fontSize: 13,
            color: colors.text,
          }}
        />
      </Field>

      {Platform.OS === 'web' && (
        <View>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleWebFile(file);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />
          <InterText
            color={colors.muted}
            style={{ fontSize: 13, textAlign: 'center', textDecorationLine: 'underline' }}
            onPress={() => fileInputRef.current?.click()}
          >
            {t('backup.orChooseFile')}
          </InterText>
        </View>
      )}
    </FormSheet>
  );
}

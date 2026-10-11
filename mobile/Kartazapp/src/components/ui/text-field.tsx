import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions, type TextInputProps } from 'react-native';

import { colors } from '@/theme/colors';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Ícone à esquerda do texto. */
  icon?: ReactNode;
  multiline?: boolean;
  /** Com limite, mostra o contador "n/max" abaixo do campo. */
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
};

/** Campo de formulário do app: rótulo, caixa no mesmo estilo do SearchInput e contador opcional. */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  multiline,
  maxLength,
  keyboardType,
  autoCapitalize,
}: TextFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, multiline && styles.multilineBox]}>
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          accessibilityLabel={label}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[styles.input, multiline && styles.multilineInput]}
        />
      </View>
      {maxLength !== undefined && (
        <Text style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 10,
  },
  label: {
    color: colors.secondaryForeground,
    fontSize: 15,
    fontWeight: '700',
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multilineBox: {
    alignItems: 'flex-start',
    minHeight: 120,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    color: colors.foreground,
    fontSize: 17,
    paddingVertical: 14,
  },
  multilineInput: {
    paddingVertical: 0,
    minHeight: 90,
  },
  counter: {
    alignSelf: 'flex-end',
    color: colors.mutedForeground,
    fontSize: 13,
  },
});

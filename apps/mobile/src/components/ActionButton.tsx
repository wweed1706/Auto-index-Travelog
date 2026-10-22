import { Pressable, StyleSheet, Text } from 'react-native';

import { palette } from '../constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
};

export function ActionButton({ label, onPress, secondary = false, disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.secondary : styles.primary,
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <Text style={[styles.label, secondary ? styles.secondaryLabel : styles.primaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 12,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: palette.green,
    borderColor: palette.green,
  },
  secondary: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryLabel: {
    color: palette.green,
    fontWeight: '700',
    fontSize: 15,
  },
  label: { textAlign: 'center' },
  dimmed: { opacity: 0.6 },
});

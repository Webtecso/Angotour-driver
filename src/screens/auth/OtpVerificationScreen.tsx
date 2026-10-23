import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/types';
import { useDriverAuth } from '../../contexts/DriverAuthContext';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OtpVerificationScreen({ navigation }: Props) {
  const { pendingPhone, verifyOtp, requestOtp } = useDriverAuth();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (code.length === CODE_LENGTH) handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleVerify = async () => {
    setError(undefined);
    setIsSubmitting(true);
    try {
      const { isNewDriver } = await verifyOtp(code);
      if (isNewDriver) navigation.navigate('Register');
    } catch {
      setError('Codigo invalido. Tenta novamente.');
      setCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || !pendingPhone) return;
    setSecondsLeft(RESEND_SECONDS);
    setCode('');
    await requestOtp(pendingPhone);
  };

  const digits = Array.from({ length: CODE_LENGTH }).map((_, i) => code[i] ?? '');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <Ionicons name="chevron-back" size={26} color={colors.textPrimary} onPress={() => navigation.goBack()} />

      <View style={styles.headerArea}>
        <Text style={styles.title}>Introduz o codigo</Text>
        <Text style={styles.subtitle}>
          Enviamos um SMS de 6 digitos para <Text style={styles.phoneHighlight}>{pendingPhone}</Text>
        </Text>
      </View>

      <Pressable onPress={() => inputRef.current?.focus()} style={styles.boxesRow}>
        {digits.map((digit, i) => (
          <View key={i} style={[styles.box, digit ? styles.boxFilled : undefined, !!error && styles.boxError]}>
            <Text style={styles.boxText}>{digit}</Text>
          </View>
        ))}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH))}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        style={styles.hiddenInput}
        autoFocus
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.resendRow}>
        {secondsLeft > 0 ? (
          <Text style={styles.resendMuted}>Reenviar codigo em 0:{String(secondsLeft).padStart(2, '0')}</Text>
        ) : (
          <Text style={styles.resendActive} onPress={handleResend}>Reenviar codigo</Text>
        )}
      </View>

      <Button label="Confirmar" onPress={handleVerify} loading={isSubmitting} disabled={code.length !== CODE_LENGTH} style={styles.submitButton} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerArea: { marginTop: spacing.lg, marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary },
  phoneHighlight: { color: colors.textPrimary, fontFamily: typography.bodyMedium.fontFamily },
  boxesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  box: { width: 46, height: 56, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  boxFilled: { borderColor: colors.primary },
  boxError: { borderColor: colors.danger },
  boxText: { ...typography.h3, color: colors.textPrimary },
  hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
  resendRow: { marginTop: spacing.md, alignItems: 'center' },
  resendMuted: { ...typography.captionMedium, color: colors.textMuted },
  resendActive: { ...typography.captionMedium, color: colors.primary },
  submitButton: { marginTop: spacing.xl },
});

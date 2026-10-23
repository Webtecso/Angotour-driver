import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { AuthStackParamList } from '../../navigation/types';
import { useDriverAuth } from '../../contexts/DriverAuthContext';
import { colors, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { requestOtp } = useDriverAuth();
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isValidPhone = /^9\d{8}$/.test(phone.replace(/\s/g, ''));

  const handleContinue = async () => {
    if (!isValidPhone) {
      setError('Introduz um numero angolano valido, ex: 923 456 789');
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    try {
      await requestOtp(`+244${phone.replace(/\s/g, '')}`);
      navigation.navigate('OtpVerification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <Ionicons name="chevron-back" size={26} color={colors.textPrimary} onPress={() => navigation.goBack()} />

      <View style={styles.headerArea}>
        <Text style={styles.title}>Qual e o teu numero?</Text>
        <Text style={styles.subtitle}>Vamos enviar-te um codigo por SMS para confirmar que es tu.</Text>
      </View>

      <Input
        label="Numero de telefone"
        keyboardType="phone-pad"
        placeholder="923 456 789"
        value={phone}
        onChangeText={setPhone}
        maxLength={9}
        error={error}
        leftIcon={<Text style={styles.prefix}>+244</Text>}
        autoFocus
      />

      <Button label="Receber codigo" onPress={handleContinue} loading={isSubmitting} disabled={phone.length === 0} style={styles.submitButton} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerArea: { marginTop: spacing.lg, marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary },
  prefix: { ...typography.bodyMedium, color: colors.textSecondary },
  submitButton: { marginTop: spacing.sm },
});

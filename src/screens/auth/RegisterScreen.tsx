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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { completeRegistration } = useDriverAuth();
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const canSubmit = fullName.trim().length >= 3;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Confirma o teu nome completo.');
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    try {
      await completeRegistration({ fullName: fullName.trim() });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <Ionicons name="chevron-back" size={26} color={colors.textPrimary} onPress={() => navigation.goBack()} />

      <View style={styles.headerArea}>
        <Text style={styles.title}>Falta pouco</Text>
        <Text style={styles.subtitle}>Cria o teu perfil de motorista AngoTour.</Text>
      </View>

      <Input
        label="Nome completo"
        placeholder="Ex: Carlos Fernandes"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        error={error}
      />

      <Text style={styles.note}>
        Depois de criares o perfil, vais poder submeter os documentos do veiculo e a verificacao de identidade.
      </Text>

      <Button label="Criar conta" onPress={handleSubmit} loading={isSubmitting} disabled={!canSubmit} style={styles.submitButton} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerArea: { marginTop: spacing.lg, marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary },
  note: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.lg },
  submitButton: { marginTop: spacing.sm },
});

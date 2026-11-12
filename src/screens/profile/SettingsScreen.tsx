import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useDriver } from '../../contexts/DriverContext';
import { useDriverAuth } from '../../contexts/DriverAuthContext';
import { driversApi } from '../../services/api';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { session, signOut } = useDriverAuth();
  const { activeTrip } = useDriver();

  const confirmSignOut = () => {
    if (activeTrip) {
      Alert.alert('Viagem em curso', 'Conclui a viagem antes de terminar a sessao.');
      return;
    }
    Alert.alert('Terminar sessao', 'Vais ficar offline e deixar de receber corridas.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Terminar sessao', style: 'destructive',
        onPress: async () => {
          // Offline no servidor primeiro, para nao ficar a receber corridas sem a app aberta.
          try { await driversApi.setStatus('offline'); } catch { /* sem rede: o token e apagado na mesma */ }
          await signOut();
        },
      },
    ]);
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Configuracoes</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Telefone</Text>
        <Text style={styles.value}>{session?.phone ?? '-'}</Text>
        {session?.fullName ? (
          <>
            <Text style={[styles.label, { marginTop: spacing.sm }]}>Nome</Text>
            <Text style={styles.value}>{session.fullName}</Text>
          </>
        ) : null}
      </View>
      <TouchableOpacity style={styles.signOut} activeOpacity={0.85} onPress={confirmSignOut}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.signOutText}>Terminar sessao</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  label: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.danger, borderRadius: radius.md, paddingVertical: spacing.sm + 2 },
  signOutText: { ...typography.bodyMedium, color: colors.danger, marginLeft: spacing.xs },
});
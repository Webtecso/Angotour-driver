import React, { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useDriver } from '../../contexts/DriverContext';
import { driverWalletApi } from '../../services/api';
import { colors, radius, spacing, typography } from '../../constants/theme';

const SHORTCUTS: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
  { icon: 'add-circle-outline', label: 'Depositar' },
  { icon: 'time-outline', label: 'Historico' },
  { icon: 'pricetag-outline', label: 'Comissoes' },
  { icon: 'help-circle-outline', label: 'Ajuda' },
];

const STATUS_LABEL: Record<string, string> = {
  processing: 'a confirmar',
  confirmed: 'confirmado',
  failed: 'falhou',
  reserved: 'reservada',
  settled: 'liquidada',
  released: 'libertada',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function WalletScreen() {
  const { wallet, refreshWallet, walletAvailableKz, walletReservedKz, minimumOperatingBalanceKz } = useDriver();

  useFocusEffect(
    useCallback(() => {
      refreshWallet();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const startDeposit = async (amountKz: number) => {
    try {
      const topUp = await driverWalletApi.startTopUp(amountKz);
      let confirmed = false;
      if (__DEV__) {
        // Em desenvolvimento o backend aceita a confirmacao simulada (ALLOW_DEV_TOPUP_CONFIRM).
        try {
          await driverWalletApi.confirmTopUp(topUp.id);
          confirmed = true;
        } catch {
          confirmed = false;
        }
      }
      await refreshWallet();
      Alert.alert(
        confirmed ? 'Deposito confirmado' : 'Deposito pendente',
        confirmed
          ? 'Pagamento simulado (modo de desenvolvimento).'
          : 'Paga a referencia ' + topUp.reference + ' no Multicaixa. O saldo atualiza quando o pagamento for confirmado.'
      );
    } catch (e) {
      Alert.alert('Nao foi possivel depositar', (e as Error).message);
    }
  };

  const handleDeposit = () => {
    Alert.alert('Depositar', 'Escolhe o valor a depositar.', [
      { text: '5.000 Kz', onPress: () => startDeposit(5000) },
      { text: '10.000 Kz', onPress: () => startDeposit(10000) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const todayGross = wallet?.todayGrossKz ?? 0;
  const todayTrips = wallet?.todayTrips ?? 0;
  const commissionsToday = wallet?.commissionsTodayKz ?? 0;
  const todayNet = wallet?.todayNetKz ?? 0;
  const belowMinimum = walletAvailableKz < minimumOperatingBalanceKz;

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="wallet" size={20} color={colors.primary} />
        <Text style={styles.headerTitle}>Carteira</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo disponivel</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceValue}>{walletAvailableKz.toLocaleString('pt-AO')} Kz</Text>
          <TouchableOpacity style={styles.withdrawButton} activeOpacity={0.85} onPress={handleDeposit}>
            <Text style={styles.withdrawButtonText}>Depositar</Text>
          </TouchableOpacity>
        </View>
        {belowMinimum ? (
          <Text style={styles.belowMinimumText}>
            Minimo para receber corridas: {minimumOperatingBalanceKz.toLocaleString('pt-AO')} Kz.
          </Text>
        ) : null}
      </View>

      <View style={styles.shortcutsRow}>
        {SHORTCUTS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.shortcut}
            activeOpacity={0.8}
            onPress={item.label === 'Depositar' ? handleDeposit : undefined}
          >
            <View style={styles.shortcutIconBadge}>
              <Ionicons name={item.icon} size={18} color={colors.primary} />
            </View>
            <Text style={styles.shortcutLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.todayCard}>
          <View style={styles.todayHeaderRow}>
            <Text style={styles.todayTitle}>Hoje</Text>
          </View>

          <View style={styles.todayRow}>
            <Ionicons name="trending-up-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.todayLabel}>Ganhos do dia</Text>
            <Text style={styles.todayValue}>{todayGross.toLocaleString('pt-AO')} Kz</Text>
          </View>
          <View style={styles.todayRow}>
            <Ionicons name="car-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.todayLabel}>Corridas realizadas</Text>
            <Text style={styles.todayValue}>{todayTrips}</Text>
          </View>
          <View style={styles.todayRow}>
            <Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.todayLabel}>Comissao da plataforma</Text>
            <Text style={styles.todayValueNegative}>-{commissionsToday.toLocaleString('pt-AO')} Kz</Text>
          </View>
          <View style={styles.todayDivider} />
          <View style={styles.todayRow}>
            <Ionicons name="checkmark-done-outline" size={16} color={colors.primary} />
            <Text style={styles.todayLabelBold}>Saldo liquido</Text>
            <Text style={styles.todayValueBold}>{todayNet.toLocaleString('pt-AO')} Kz</Text>
          </View>
        </View>

        {walletReservedKz > 0 ? (
          <View style={styles.reservedCard}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.amber} />
            <Text style={styles.reservedText}>
              {walletReservedKz.toLocaleString('pt-AO')} Kz reservados para comissoes de corridas em curso.
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Movimentos recentes</Text>
        {(wallet?.entries ?? []).length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Ainda nao ha movimentos. Faz um deposito para comecar a receber corridas.</Text>
          </View>
        ) : (
          <View style={styles.entriesCard}>
            {(wallet?.entries ?? []).map((entry) => {
              const isTopUp = entry.kind === 'topup';
              const muted = entry.status === 'released' || entry.status === 'failed';
              return (
                <View key={entry.id} style={styles.entryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryLabel}>{isTopUp ? 'Deposito' : 'Comissao'} ({STATUS_LABEL[entry.status] ?? entry.status})</Text>
                    <Text style={styles.entryMeta}>
                      {formatDate(entry.createdAt)}{entry.reference ? ' - Ref. ' + entry.reference : ''}
                    </Text>
                  </View>
                  <Text style={[styles.entryAmount, isTopUp && !muted && styles.entryAmountPositive, muted && styles.entryAmountMuted]}>
                    {isTopUp ? '+' : '-'}{entry.amountKz.toLocaleString('pt-AO')} Kz
                  </Text>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  headerTitle: { ...typography.h2, color: colors.textPrimary, marginLeft: spacing.xs },
  balanceCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  balanceLabel: { ...typography.caption, color: colors.textSecondary },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  balanceValue: { ...typography.h1, color: colors.textPrimary },
  belowMinimumText: { ...typography.caption, color: colors.amber, marginTop: spacing.xs },
  withdrawButton: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  withdrawButtonText: { ...typography.captionMedium, color: colors.textInverse },
  shortcutsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  shortcut: { alignItems: 'center', flex: 1 },
  shortcutIconBadge: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxs },
  shortcutLabel: { ...typography.tiny, color: colors.textSecondary },
  todayCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  todayHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  todayTitle: { ...typography.subtitle, color: colors.textPrimary },
  todayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  todayLabel: { ...typography.body, color: colors.textSecondary, marginLeft: spacing.sm, flex: 1 },
  todayValue: { ...typography.bodyMedium, color: colors.textPrimary },
  todayValueNegative: { ...typography.bodyMedium, color: colors.danger },
  todayDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  todayLabelBold: { ...typography.bodyMedium, color: colors.textPrimary, marginLeft: spacing.sm, flex: 1 },
  todayValueBold: { ...typography.subtitle, color: colors.primary },
  reservedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.amberLight, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.lg },
  reservedText: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.xs, flex: 1 },
  sectionTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  emptyText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  entriesCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  entryLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  entryMeta: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  entryAmount: { ...typography.bodyMedium, color: colors.textPrimary, marginLeft: spacing.sm },
  entryAmountPositive: { color: colors.primary },
  entryAmountMuted: { color: colors.textMuted },
});

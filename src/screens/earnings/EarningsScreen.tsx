import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import { mockEarnings, mockWallet } from '../../services/mockData';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Period = 'hoje' | 'semana' | 'mes';

const PERIOD_LABELS: Record<Period, string> = { hoje: 'Hoje', semana: 'Semana', mes: 'Mes' };

const TRIP_ROWS = [
  { id: '#8231', gross: 8000, commission: 960 },
  { id: '#8232', gross: 10000, commission: 1200 },
  { id: '#8233', gross: 7500, commission: 900 },
];

export default function EarningsScreen() {
  const [period, setPeriod] = useState<Period>('hoje');
  const value = period === 'hoje' ? mockEarnings.todayKz : period === 'semana' ? mockEarnings.weekKz : mockEarnings.monthKz;

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Meus Ganhos</Text>

        <View style={styles.periodRow}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <TouchableOpacity key={p} style={[styles.periodChip, period === p && styles.periodChipActive]} onPress={() => setPeriod(p)}>
              <Text style={[styles.periodChipText, period === p && styles.periodChipTextActive]}>{PERIOD_LABELS[p]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>{PERIOD_LABELS[period]}</Text>
          <Text style={styles.mainValue}>{value.toLocaleString('pt-AO')} Kz</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Corridas</Text>
            <Text style={styles.statValue}>{mockEarnings.todayTrips}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Bruto</Text>
            <Text style={styles.statValue}>{(value + mockWallet.commissionsPaidTodayKz).toLocaleString('pt-AO')} Kz</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Comissao</Text>
            <Text style={styles.statValue}>{mockWallet.commissionsPaidTodayKz.toLocaleString('pt-AO')} Kz</Text>
          </View>
        </View>

        <View style={styles.walletCard}>
          <Text style={styles.walletTitle}>Carteira AngoTour</Text>
          <View style={styles.walletRow}>
            <Text style={styles.walletLabel}>Saldo disponivel</Text>
            <Text style={styles.walletValue}>{mockWallet.availableKz.toLocaleString('pt-AO')} Kz</Text>
          </View>
          <View style={styles.walletRow}>
            <Text style={styles.walletLabel}>Saldo reservado</Text>
            <Text style={styles.walletValueMuted}>{mockWallet.reservedKz.toLocaleString('pt-AO')} Kz</Text>
          </View>
          <TouchableOpacity style={styles.topUpButton} activeOpacity={0.85}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.topUpText}>Carregar carteira</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Detalhamento de hoje</Text>
        <View style={styles.tableCard}>
          {TRIP_ROWS.map((row) => (
            <View key={row.id} style={styles.tableRow}>
              <Text style={styles.tableId}>{row.id}</Text>
              <Text style={styles.tableGross}>{row.gross.toLocaleString('pt-AO')} Kz</Text>
              <Text style={styles.tableCommission}>-{row.commission.toLocaleString('pt-AO')}</Text>
              <Text style={styles.tableNet}>{(row.gross - row.commission).toLocaleString('pt-AO')}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  scroll: { paddingBottom: spacing.xxl },
  header: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.md },
  periodRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: 4, marginBottom: spacing.md },
  periodChip: { flex: 1, alignItems: 'center', paddingVertical: spacing.xs, borderRadius: radius.sm },
  periodChipActive: { backgroundColor: colors.primary },
  periodChipText: { ...typography.captionMedium, color: colors.textSecondary },
  periodChipTextActive: { color: colors.textInverse },
  mainCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  mainLabel: { ...typography.caption, color: colors.textSecondary },
  mainValue: { ...typography.h1, color: colors.textPrimary, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  statBox: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginRight: spacing.xs, alignItems: 'center' },
  statLabel: { ...typography.tiny, color: colors.textMuted },
  statValue: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
  walletCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  walletTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  walletLabel: { ...typography.body, color: colors.textSecondary },
  walletValue: { ...typography.bodyMedium, color: colors.primary },
  walletValueMuted: { ...typography.bodyMedium, color: colors.textMuted },
  topUpButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm, marginTop: spacing.sm },
  topUpText: { ...typography.bodyMedium, color: colors.primary, marginLeft: spacing.xs },
  sectionTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  tableCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableId: { ...typography.caption, color: colors.textSecondary, width: 55 },
  tableGross: { ...typography.caption, color: colors.textPrimary, flex: 1 },
  tableCommission: { ...typography.caption, color: colors.danger, width: 60, textAlign: 'right' },
  tableNet: { ...typography.captionMedium, color: colors.primary, width: 70, textAlign: 'right' },
});

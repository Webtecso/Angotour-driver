import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useDriver } from '../../contexts/DriverContext';
import { driverProfileApi, EarningsPeriod } from '../../services/api';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Period = 'today' | 'week' | 'month';
const LABELS: Record<Period, string> = { today: 'Hoje', week: 'Semana', month: 'Mes' };
const kz = (n: number) => n.toLocaleString('pt-AO') + ' Kz';

export default function EarningsScreen() {
  const { wallet, refreshWallet } = useDriver();
  const [period, setPeriod] = useState<Period>('today');
  const [data, setData] = useState<Record<Period, EarningsPeriod> | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await driverProfileApi.earnings());
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
    await refreshWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const cur = data?.[period];

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <Text style={styles.header}>Meus Ganhos</Text>

        <View style={styles.periodRow}>
          {(Object.keys(LABELS) as Period[]).map((p) => (
            <TouchableOpacity key={p} style={[styles.periodChip, period === p && styles.periodChipActive]} onPress={() => setPeriod(p)}>
              <Text style={[styles.periodChipText, period === p && styles.periodChipTextActive]}>{LABELS[p]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!data && !error ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : null}

        {cur ? (
          <>
            <View style={styles.mainCard}>
              <Text style={styles.mainLabel}>Liquido ({LABELS[period].toLowerCase()})</Text>
              <Text style={styles.mainValue}>{kz(cur.netKz)}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statBox}><Text style={styles.statLabel}>Corridas</Text><Text style={styles.statValue}>{cur.trips}</Text></View>
              <View style={styles.statBox}><Text style={styles.statLabel}>Bruto</Text><Text style={styles.statValue}>{kz(cur.grossKz)}</Text></View>
              <View style={styles.statBox}><Text style={styles.statLabel}>Comissao</Text><Text style={styles.statValue}>-{kz(cur.commissionKz)}</Text></View>
            </View>
          </>
        ) : null}

        {period === 'today' && wallet ? (
          <View style={styles.simCard}>
            <Text style={styles.simTitle}>Rendimento estimado (hoje)</Text>
            <Row label="Receita bruta" value={'+' + kz(wallet.todayGrossKz)} />
            <Row label="Comissao da plataforma" value={'-' + kz(wallet.commissionsTodayKz)} negative />
            {wallet.zoneIncentivesTodayKz > 0 ? <Row label="Incentivos de zona" value={'+' + kz(wallet.zoneIncentivesTodayKz)} /> : null}
            <Row label={'Combustivel estimado (' + wallet.todayDistanceKm.toFixed(1) + ' km)'} value={'-' + kz(wallet.estimatedFuelCostKz)} negative />
            <View style={styles.divider} />
            <Row label="Rendimento liquido estimado" value={kz(wallet.todayNetAfterFuelKz)} bold />
            <Text style={styles.note}>O combustivel e uma estimativa de referencia e nao afeta os teus pagamentos.</Text>
          </View>
        ) : null}

        {wallet ? (
          <View style={styles.walletCard}>
            <Text style={styles.walletTitle}>Carteira AngoTour</Text>
            <View style={styles.walletRow}><Text style={styles.walletLabel}>Saldo disponivel</Text><Text style={styles.walletValue}>{kz(wallet.availableKz)}</Text></View>
            <View style={styles.walletRow}><Text style={styles.walletLabel}>Saldo reservado</Text><Text style={styles.walletValueMuted}>{kz(wallet.reservedKz)}</Text></View>
            <Text style={styles.note}>Para depositar, vai ao separador Carteira.</Text>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

function Row({ label, value, negative, bold }: { label: string; value: string; negative?: boolean; bold?: boolean }) {
  return (
    <View style={styles.simRow}>
      <Text style={styles.simLabel}>{label}</Text>
      <Text style={[styles.simValue, negative && { color: colors.danger }, bold && { color: colors.primary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  scroll: { paddingBottom: spacing.xxl },
  header: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.md },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
  periodRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: 4, marginBottom: spacing.md },
  periodChip: { flex: 1, alignItems: 'center', paddingVertical: spacing.xs, borderRadius: radius.sm },
  periodChipActive: { backgroundColor: colors.primary },
  periodChipText: { ...typography.captionMedium, color: colors.textSecondary },
  periodChipTextActive: { color: colors.textInverse },
  mainCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  mainLabel: { ...typography.caption, color: colors.textSecondary },
  mainValue: { ...typography.h1, color: colors.primary, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  statBox: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginRight: spacing.xs, alignItems: 'center' },
  statLabel: { ...typography.tiny, color: colors.textMuted },
  statValue: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
  simCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  simTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  simRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  simLabel: { ...typography.caption, color: colors.textSecondary, flex: 1, marginRight: spacing.sm },
  simValue: { ...typography.captionMedium, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  note: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.sm },
  walletCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  walletTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  walletLabel: { ...typography.body, color: colors.textSecondary },
  walletValue: { ...typography.bodyMedium, color: colors.primary },
  walletValueMuted: { ...typography.bodyMedium, color: colors.textMuted },
});

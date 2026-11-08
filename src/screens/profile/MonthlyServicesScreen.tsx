import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenContainer from '../../components/common/ScreenContainer';
import { driverMonthlyApi, MonthlyExecutionView } from '../../services/api';
import { colors, radius, spacing, typography } from '../../constants/theme';

// Hoje em Luanda (UTC+1). O servidor e quem decide: so deixa iniciar no proprio dia.
const todayLuanda = () => new Date(Date.now() + 3600000).toISOString().slice(0, 10);

const dayTitle = (iso: string, today: string) => {
  if (iso === today) return 'Hoje';
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('pt-AO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
};

export default function MonthlyServicesScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState<MonthlyExecutionView[] | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const today = todayLuanda();

  const load = useCallback(async () => {
    try {
      setItems(await driverMonthlyApi.list());
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setItems((cur) => cur ?? []);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const act = async (id: string, kind: 'start' | 'complete') => {
    setBusyId(id);
    try {
      await (kind === 'start' ? driverMonthlyApi.start(id) : driverMonthlyApi.complete(id));
      await load();
    } catch (e) {
      Alert.alert('Nao foi possivel concluir', (e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  // agrupa por dia (a lista ja vem ordenada por data e hora)
  const groups: { date: string; rows: MonthlyExecutionView[] }[] = [];
  for (const it of items ?? []) {
    const last = groups[groups.length - 1];
    if (last && last.date === it.date) last.rows.push(it);
    else groups.push({ date: it.date, rows: [it] });
  }

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.canGoBack() && navigation.goBack()} />
        <Text style={styles.headerTitle}>Servicos mensais</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.intro}>Os teus servicos dos proximos 7 dias. So podes iniciar um servico no proprio dia.</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {items === null ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} /> : null}
        {items && items.length === 0 && !error ? <Text style={styles.empty}>Sem servicos mensais agendados.</Text> : null}

        {groups.map((g) => (
          <View key={g.date} style={{ marginBottom: spacing.md }}>
            <Text style={styles.dayTitle}>{dayTitle(g.date, today)}</Text>
            {g.rows.map((r) => {
              const route = r.direction === 'ida' ? `${r.originLabel} - ${r.destinationLabel}` : `${r.destinationLabel} - ${r.originLabel}`;
              const canStart = r.status === 'agendada' && r.date === today;
              const busy = busyId === r.id;
              return (
                <View key={r.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.time}>{r.scheduledTime}</Text>
                    <View style={[styles.pill, { backgroundColor: (r.status === 'em_curso' ? colors.amber : colors.primary) + '22' }]}>
                      <Text style={[styles.pillText, { color: r.status === 'em_curso' ? colors.amber : colors.primary }]}>
                        {r.status === 'em_curso' ? 'Em curso' : r.direction === 'ida' ? 'Ida' : 'Volta'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.route}>{route}</Text>
                  <Text style={styles.meta}>
                    {r.passengerFirstName ?? 'Passageiro'}{r.passengerCount > 1 ? ` (+${r.passengerCount - 1})` : ''}
                  </Text>

                  {canStart ? (
                    <TouchableOpacity style={[styles.cta, busy && { opacity: 0.6 }]} disabled={busy} onPress={() => act(r.id, 'start')} activeOpacity={0.85}>
                      <Text style={styles.ctaText}>Iniciar servico</Text>
                    </TouchableOpacity>
                  ) : null}
                  {r.status === 'em_curso' ? (
                    <TouchableOpacity style={[styles.cta, busy && { opacity: 0.6 }]} disabled={busy} onPress={() => act(r.id, 'complete')} activeOpacity={0.85}>
                      <Text style={styles.ctaText}>Concluir servico</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  scroll: { paddingBottom: spacing.xxl },
  intro: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  errorText: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  dayTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.xs, textTransform: 'capitalize' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { ...typography.h3, color: colors.textPrimary },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  pillText: { ...typography.captionMedium },
  route: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: spacing.xs },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  cta: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center', marginTop: spacing.sm },
  ctaText: { ...typography.bodyMedium, color: colors.textInverse },
});

import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AnchorTabs from '../../components/common/AnchorTabs';
import { useFocusEffect } from '@react-navigation/native';
import { driverProfileApi, driverReservationsApi, DriverHistoryItem, ScheduledTripView } from '../../services/api';
import { colors, radius, spacing, typography } from '../../constants/theme';

const TABS = [
  { id: 'agendadas', label: 'Agendadas' },
  { id: 'historico', label: 'Historico' },
];

function formatScheduled(dateIso: string) {
  return new Date(dateIso).toLocaleDateString('pt-AO', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatHistory(dateIso: string) {
  return new Date(dateIso).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function TripsScreen() {
  const [activeTab, setActiveTab] = useState('agendadas');
  const [history, setHistory] = useState<DriverHistoryItem[] | null>(null);
  const [error, setError] = useState('');
  const [scheduledTrips, setScheduledTrips] = useState<ScheduledTripView[]>([]);
  const loadScheduled = useCallback(() => {
    driverReservationsApi.list().then((s) => { setScheduledTrips(s); setError(''); }).catch((e) => setError((e as Error).message));
  }, []);
  const handleAccept = async (id: string) => {
    try {
      await driverReservationsApi.reserve(id);
    } catch (e) {
      Alert.alert('Nao foi possivel reservar', (e as Error).message);
    }
    loadScheduled();
  };
  const handleRelease = (id: string) => {
    Alert.alert('Desistir da reserva', 'A reserva volta a ficar disponivel para outros motoristas.', [
      { text: 'Manter', style: 'cancel' },
      {
        text: 'Desistir', style: 'destructive',
        onPress: async () => {
          try { await driverReservationsApi.release(id); } catch (e) { Alert.alert('Nao foi possivel desistir', (e as Error).message); }
          loadScheduled();
        },
      },
    ]);
  };
  useFocusEffect(useCallback(() => {
    driverProfileApi.history().then((h) => { setHistory(h); setError(''); }).catch((e) => setError((e as Error).message));
    loadScheduled();
  }, []));

  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.header}>Corridas</Text>
      <AnchorTabs tabs={TABS} activeId={activeTab} onPress={setActiveTab} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === 'agendadas' ? (
          scheduledTrips.length === 0 ? (
            <EmptyState icon="calendar-outline" title="Sem viagens agendadas" subtitle="Quando um passageiro agendar uma viagem, ela aparece aqui para a reservares." />
          ) : (
            scheduledTrips.map((trip) => (
              <View key={trip.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="calendar" size={16} color={colors.primary} />
                  <Text style={styles.cardDate}>{formatScheduled(trip.dateIso)}</Text>
                </View>

                <View style={styles.routeRow}>
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.routeText} numberOfLines={1}>{trip.originLabel}</Text>
                </View>
                <View style={styles.routeDivider} />
                <View style={styles.routeRow}>
                  <View style={[styles.dot, { backgroundColor: colors.danger }]} />
                  <Text style={styles.routeText} numberOfLines={1}>{trip.destinationLabel}</Text>
                </View>

                <View style={styles.cardFooterRow}>
                  <Text style={styles.cardEarnings}>{trip.estimatedEarningsKz.toLocaleString('pt-AO')} Kz - {trip.distanceKm.toFixed(1)} km</Text>
                  {trip.isAccepted ? (
                    <TouchableOpacity style={styles.acceptedBadge} activeOpacity={0.7} onPress={() => handleRelease(trip.id)}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                      <Text style={styles.acceptedText}>Reservada - tocar para desistir</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.acceptButton} activeOpacity={0.85} onPress={() => handleAccept(trip.id)}>
                      <Text style={styles.acceptButtonText}>Reservar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )
        ) : history === null ? (
          <EmptyState icon="time-outline" title={error || 'A carregar...'} subtitle="" />
        ) : history.length === 0 ? (
          <EmptyState icon="car-outline" title="O teu historico de corridas vai aparecer aqui" subtitle="Fica online para comecar a receber pedidos." />
        ) : (
          history.map((trip) => (
            <View key={trip.id} style={styles.historyCard}>
              <View style={styles.historyIconBadge}>
                <Ionicons name={trip.status === 'cancelled' ? 'close-circle-outline' : 'car-outline'} size={18} color={trip.status === 'cancelled' ? colors.danger : colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyRoute} numberOfLines={1}>{trip.originLabel ?? '-'} para {trip.destinationLabel ?? '-'}</Text>
                <Text style={styles.historyMeta}>{formatHistory(trip.completedAt ?? trip.createdAt)} - {trip.distanceKm.toFixed(1)} km</Text>
                {trip.status === 'cancelled' ? (
                  <Text style={styles.cancelledTag}>Cancelada</Text>
                ) : null}
              </View>
              <Text style={[styles.historyValue, trip.status === 'cancelled' && styles.historyValueMuted]}>
                {trip.status === 'cancelled' ? '-' : `${trip.priceKz.toLocaleString('pt-AO')} Kz`}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; subtitle: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={32} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  header: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.md },
  scroll: { paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  cardDate: { ...typography.captionMedium, color: colors.primary, marginLeft: spacing.xxs },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  routeText: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
  routeDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs, marginLeft: 15 },
  cardFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  cardEarnings: { ...typography.captionMedium, color: colors.textSecondary },
  acceptButton: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xxs },
  acceptButtonText: { ...typography.captionMedium, color: colors.textInverse },
  acceptedBadge: { flexDirection: 'row', alignItems: 'center' },
  acceptedText: { ...typography.captionMedium, color: colors.primary, marginLeft: 4 },
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.sm },
  historyIconBadge: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  historyRoute: { ...typography.bodyMedium, color: colors.textPrimary },
  historyMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  cancelledTag: { ...typography.tiny, color: colors.danger, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ratingText: { ...typography.tiny, color: colors.textSecondary, marginLeft: 3 },
  historyValue: { ...typography.bodyMedium, color: colors.primary, marginLeft: spacing.sm },
  historyValueMuted: { color: colors.textMuted },
  emptyState: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, marginTop: spacing.lg },
  emptyTitle: { ...typography.bodyMedium, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.sm },
  emptySubtitle: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxs },
});

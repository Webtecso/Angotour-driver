import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AnchorTabs from '../../components/common/AnchorTabs';
import { mockScheduledTrips, mockTripHistory } from '../../services/mockData';
import { ScheduledTrip } from '../../types';
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
  const [scheduledTrips, setScheduledTrips] = useState<ScheduledTrip[]>(mockScheduledTrips);

  const handleAccept = (id: string) => {
    setScheduledTrips((prev) => prev.map((t) => (t.id === id ? { ...t, isAccepted: true } : t)));
  };

  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.header}>Corridas</Text>
      <AnchorTabs tabs={TABS} activeId={activeTab} onPress={setActiveTab} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === 'agendadas' ? (
          scheduledTrips.length === 0 ? (
            <EmptyState icon="calendar-outline" title="Sem viagens agendadas" subtitle="As reservas atribuidas a ti vao aparecer aqui." />
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
                    <View style={styles.acceptedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                      <Text style={styles.acceptedText}>Aceite</Text>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.acceptButton} activeOpacity={0.85} onPress={() => handleAccept(trip.id)}>
                      <Text style={styles.acceptButtonText}>Aceitar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )
        ) : mockTripHistory.length === 0 ? (
          <EmptyState icon="car-outline" title="O teu historico de corridas vai aparecer aqui" subtitle="Fica online para comecar a receber pedidos." />
        ) : (
          mockTripHistory.map((trip) => (
            <View key={trip.id} style={styles.historyCard}>
              <View style={styles.historyIconBadge}>
                <Ionicons name={trip.status === 'cancelled' ? 'close-circle-outline' : 'car-outline'} size={18} color={trip.status === 'cancelled' ? colors.danger : colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyRoute} numberOfLines={1}>{trip.originLabel} para {trip.destinationLabel}</Text>
                <Text style={styles.historyMeta}>{formatHistory(trip.dateIso)} - {trip.distanceKm.toFixed(1)} km</Text>
                {trip.status === 'cancelled' ? (
                  <Text style={styles.cancelledTag}>Cancelada</Text>
                ) : trip.passengerRating ? (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={11} color={colors.amber} />
                    <Text style={styles.ratingText}>{trip.passengerRating.toFixed(1)}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.historyValue, trip.status === 'cancelled' && styles.historyValueMuted]}>
                {trip.status === 'cancelled' ? '-' : `${trip.netEarningsKz.toLocaleString('pt-AO')} Kz`}
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

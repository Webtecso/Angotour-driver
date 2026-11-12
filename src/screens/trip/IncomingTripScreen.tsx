import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useDriver } from '../../contexts/DriverContext';
import { HomeStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'IncomingTrip'>;

const RESPONSE_WINDOW_SECONDS = 15;

export default function IncomingTripScreen({ navigation }: Props) {
  const { incomingRequest, acceptIncomingTrip, declineIncomingTrip } = useDriver();
  const [secondsLeft, setSecondsLeft] = useState(RESPONSE_WINDOW_SECONDS);

  useEffect(() => {
    if (!incomingRequest) {
      navigation.goBack();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          declineIncomingTrip();
          navigation.goBack();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingRequest]);

  if (!incomingRequest) return null;

  const handleAccept = () => {
    acceptIncomingTrip();
    navigation.goBack();
  };

  const handleDecline = () => {
    declineIncomingTrip();
    navigation.goBack();
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>NOVA CORRIDA</Text>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{secondsLeft}s</Text>
        </View>
      </View>

      <View style={styles.routeCard}>
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.routeLabel}>Origem</Text>
            <Text style={styles.routeAddress}>{incomingRequest.originLabel}</Text>
          </View>
        </View>
        <View style={styles.routeDivider} />
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: colors.danger }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.routeLabel}>Zona de destino</Text>
            <Text style={styles.routeAddress}>{incomingRequest.destinationLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Distancia ate passageiro</Text>
          <Text style={styles.metricValue}>{incomingRequest.distanceToPassengerKm.toFixed(1)} km</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Viagem estimada</Text>
          <Text style={styles.metricValue}>{incomingRequest.tripDistanceKm.toFixed(1)} km - {incomingRequest.tripDurationMinutes} min</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Ganho estimado</Text>
          <Text style={[styles.metricValue, { color: colors.primary }]}>{incomingRequest.estimatedEarningsKz.toLocaleString('pt-AO')} Kz</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Comissao estimada</Text>
          <Text style={styles.metricValue}>{incomingRequest.estimatedCommissionKz.toLocaleString('pt-AO')} Kz</Text>
        </View>
        {incomingRequest.zoneIncentiveKz ? (
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Incentivo de zona</Text>
            <Text style={[styles.metricValue, { color: colors.primary }]}>+{incomingRequest.zoneIncentiveKz.toLocaleString('pt-AO')} Kz</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.paymentRow}>
        <MaterialCommunityIcons name={incomingRequest.paymentMethod === 'cash' ? 'cash' : 'credit-card-outline'} size={18} color={colors.textSecondary} />
        <Text style={styles.paymentText}>{incomingRequest.paymentMethod === 'cash' ? 'Dinheiro' : 'Digital'}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.declineButton} activeOpacity={0.85} onPress={handleDecline}>
          <Text style={styles.declineButtonText}>Recusar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} activeOpacity={0.85} onPress={handleAccept}>
          <Text style={styles.acceptButtonText}>Aceitar</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, justifyContent: 'center', flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  headerTitle: { ...typography.h3, color: colors.textPrimary, letterSpacing: 1 },
  timerBadge: { backgroundColor: colors.surfaceRaised, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  timerText: { ...typography.captionMedium, color: colors.primary },
  routeCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: spacing.sm, marginTop: 5 },
  routeLabel: { ...typography.tiny, color: colors.textMuted },
  routeAddress: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
  routeDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm, marginLeft: 17 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  metricBox: { width: '48%', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginRight: '2%', marginBottom: spacing.sm },
  metricLabel: { ...typography.tiny, color: colors.textMuted },
  metricValue: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  paymentText: { ...typography.captionMedium, color: colors.textSecondary, marginLeft: spacing.xs },
  actionsRow: { flexDirection: 'row' },
  declineButton: { flex: 1, backgroundColor: colors.dangerLight, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginRight: spacing.sm },
  declineButtonText: { ...typography.subtitle, color: colors.danger },
  acceptButton: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  acceptButtonText: { ...typography.subtitle, color: colors.textInverse },
});

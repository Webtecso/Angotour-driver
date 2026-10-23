import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/common/ScreenContainer';
import DriverMapView from '../../components/home/DriverMapView';
import { mockDemandForecast, mockDemandZones } from '../../services/mockData';
import { HomeStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'DemandMap'>;

const LEGEND: { color: string; label: string }[] = [
  { color: colors.danger, label: 'Alta procura' },
  { color: colors.amber, label: 'Media' },
  { color: colors.primary, label: 'Normal' },
];

export default function DemandMapScreen({ navigation }: Props) {
  return (
    <ScreenContainer style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} style={styles.backButton} />
        <Text style={styles.headerTitle}>Mapa de procura</Text>
      </View>

      <View style={styles.mapArea}>
        <DriverMapView center={{ latitude: -8.8983, longitude: 13.2344 }} zoom={12} zones={mockDemandZones} />
      </View>

      <View style={styles.legendRow}>
        {LEGEND.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.forecastCard}>
        <Ionicons name="trending-up-outline" size={18} color={colors.primary} />
        <Text style={styles.forecastText}>{mockDemandForecast}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backButton: { marginRight: spacing.sm },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  mapArea: { flex: 1, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.md },
  legendRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm, marginBottom: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 9, height: 9, borderRadius: 5, marginRight: spacing.xxs },
  legendLabel: { ...typography.captionMedium, color: colors.textSecondary },
  forecastCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  forecastText: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.sm, flex: 1, lineHeight: 18 },
});

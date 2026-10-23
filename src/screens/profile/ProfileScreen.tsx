import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/common/ScreenContainer';
import { mockDriverProfile, mockEarnings } from '../../services/mockData';
import { useDriver } from '../../contexts/DriverContext';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

const MENU_ITEMS: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; route?: keyof ProfileStackParamList }[] = [
  { icon: 'document-text-outline', label: 'Meus documentos', route: 'DocumentCenter' },
  { icon: 'car-outline', label: 'Meu veiculo', route: 'Vehicle' },
  { icon: 'star-outline', label: 'Avaliacoes' },
  { icon: 'trophy-outline', label: 'Incentivos', route: 'Incentives' },
  { icon: 'briefcase-outline', label: 'Objetos perdidos', route: 'LostItems' },
  { icon: 'earth-outline', label: 'Perfil Turismo', route: 'TourismProfile' },
  { icon: 'help-buoy-outline', label: 'Suporte' },
  { icon: 'settings-outline', label: 'Configuracoes' },
  { icon: 'information-circle-outline', label: 'Sobre o AngoTour' },
];

export default function ProfileScreen({ navigation }: Props) {
  const { areDocumentsApproved } = useDriver();
  const documentsBadge = areDocumentsApproved ? 'Verificado' : 'Pendente';

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{mockDriverProfile.fullName.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{mockDriverProfile.fullName}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={colors.amber} />
            <Text style={styles.ratingText}>{mockDriverProfile.rating.toFixed(1)} ({mockDriverProfile.totalTrips.toLocaleString('pt-AO')} viagens)</Text>
          </View>
          {mockDriverProfile.accountStatus === 'active' ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
              <Text style={styles.verifiedText}>Motorista verificado</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Viagens</Text>
            <Text style={styles.statValue}>{mockDriverProfile.totalTrips.toLocaleString('pt-AO')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Tempo online</Text>
            <Text style={styles.statValue}>156h</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Avaliacao</Text>
            <Text style={styles.statValue}>{mockDriverProfile.rating.toFixed(1)} *</Text>
          </View>
        </View>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, index === MENU_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
              activeOpacity={0.75}
              onPress={() => item.route && navigation.navigate(item.route)}
            >
              <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.label === 'Meus documentos' ? (
                  <Text style={[styles.menuBadge, !areDocumentsApproved && styles.menuBadgePending]}>{documentsBadge}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  scroll: { paddingBottom: spacing.xxl },
  profileHeader: { alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 76, height: 76, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarInitial: { ...typography.h1, color: colors.textInverse },
  name: { ...typography.h3, color: colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ratingText: { ...typography.caption, color: colors.textSecondary, marginLeft: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, marginTop: spacing.sm },
  verifiedText: { ...typography.tiny, color: colors.primaryDark, marginLeft: 4 },
  statsCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  statLabel: { ...typography.tiny, color: colors.textMuted },
  statValue: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
  menu: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLabel: { ...typography.body, color: colors.textPrimary },
  menuBadge: { ...typography.tiny, color: colors.primary, marginTop: 1 },
  menuBadgePending: { color: colors.amber },
});








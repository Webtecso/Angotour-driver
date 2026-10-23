import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/common/ScreenContainer';
import { mockTourismEligibility } from '../../services/mockData';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'TourismProfile'>;

export default function TourismProfileScreen({ navigation }: Props) {
  const e = mockTourismEligibility;
  const meetsRating = e.currentRating >= e.minimumRating;
  const isEligible = e.hasTrainingCompleted && e.languages.length >= 2 && meetsRating;
  const [isActive, setIsActive] = useState(e.isActive);

  const requirements = [
    { label: 'Formacao turistica concluida', met: e.hasTrainingCompleted },
    { label: `Pelo menos 2 idiomas (${e.languages.join(', ')})`, met: e.languages.length >= 2 },
    { label: `Avaliacao minima de ${e.minimumRating.toFixed(1)} (atual: ${e.currentRating.toFixed(1)})`, met: meetsRating },
  ];

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Perfil Turismo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.introCard}>
          <Ionicons name="earth-outline" size={22} color={colors.primary} />
          <Text style={styles.introText}>
            Com o Perfil Turismo ativo, o passageiro pode pedir especificamente um "Motorista Turismo" - conhecimento local, idiomas e bom historico.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Requisitos</Text>
        <View style={styles.requirementsCard}>
          {requirements.map((req) => (
            <View key={req.label} style={styles.requirementRow}>
              <Ionicons
                name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={req.met ? colors.primary : colors.textMuted}
              />
              <Text style={styles.requirementText}>{req.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.toggleCard, !isEligible && styles.toggleCardDisabled]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Perfil Turismo ativo</Text>
            <Text style={styles.toggleSubtitle}>
              {isEligible ? 'Podes receber pedidos de Motorista Turismo.' : 'Cumpre todos os requisitos para ativar.'}
            </Text>
          </View>
          <Switch
            value={isActive && isEligible}
            onValueChange={setIsActive}
            disabled={!isEligible}
            trackColor={{ false: colors.surfaceRaised, true: colors.primary }}
            thumbColor={colors.textInverse}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  scroll: { paddingBottom: spacing.xxl },
  introCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  introText: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.sm, flex: 1, lineHeight: 18 },
  sectionTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  requirementsCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  requirementRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  requirementText: { ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm, flex: 1 },
  toggleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  toggleCardDisabled: { opacity: 0.6 },
  toggleTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  toggleSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
});

import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useFocusEffect } from '@react-navigation/native';
import { driverExtrasApi, IncentivesView } from '../../services/api';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Incentives'>;

export default function IncentivesScreen({ navigation }: Props) {
  const [data, setData] = useState<IncentivesView | null>(null);
  useFocusEffect(useCallback(() => {
    driverExtrasApi.incentives().then(setData).catch(() => {});
  }, []));
  const dailyGoal = data?.dailyGoal ?? { achievedKz: 0, targetKz: 1 };
  const challenges = data?.challenges ?? [];
  const goalFraction = Math.min(1, dailyGoal.achievedKz / dailyGoal.targetKz);
  const goalRemainingKz = Math.max(0, dailyGoal.targetKz - dailyGoal.achievedKz);

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Incentivos</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>Meta diaria</Text>
          <Text style={styles.goalValue}>{dailyGoal.achievedKz.toLocaleString('pt-AO')} Kz</Text>
          <Text style={styles.goalTarget}>de {dailyGoal.targetKz.toLocaleString('pt-AO')} Kz</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${goalFraction * 100}%` }]} />
          </View>

          <View style={styles.goalFooterRow}>
            <Text style={styles.goalPercent}>{Math.round(goalFraction * 100)}%</Text>
            {goalRemainingKz > 0 ? (
              <Text style={styles.goalRemaining}>Falta {goalRemainingKz.toLocaleString('pt-AO')} Kz</Text>
            ) : (
              <Text style={styles.goalDone}>Meta atingida!</Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Desafios ativos</Text>
        {challenges.map((challenge) => {
          const fraction = Math.min(1, challenge.progressCount / challenge.targetCount);
          const isDone = challenge.progressCount >= challenge.targetCount;
          return (
            <View key={challenge.id} style={styles.challengeCard}>
              <View style={styles.challengeHeaderRow}>
                <View style={styles.challengeIconBadge}>
                  <Ionicons name={isDone ? 'trophy' : 'flag-outline'} size={16} color={isDone ? colors.amber : colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDescription}>{challenge.description}</Text>
                </View>
                {challenge.rewardKz > 0 ? <Text style={styles.challengeReward}>+{challenge.rewardKz.toLocaleString('pt-AO')} Kz</Text> : null}
              </View>

              <View style={styles.progressTrackSmall}>
                <View style={[styles.progressFillSmall, { width: `${fraction * 100}%` }, isDone && styles.progressFillDone]} />
              </View>

              <View style={styles.challengeFooterRow}>
                <Text style={styles.challengeProgressText}>{challenge.progressCount}/{challenge.targetCount}</Text>
                <Text style={styles.challengeExpiry}>
                  {challenge.expiresInDays === 0 ? 'Termina hoje' : `Termina em ${challenge.expiresInDays}d`}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  scroll: { paddingBottom: spacing.xxl },
  goalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.lg },
  goalLabel: { ...typography.caption, color: colors.textSecondary },
  goalValue: { ...typography.h1, color: colors.textPrimary, marginTop: 2 },
  goalTarget: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: colors.primary },
  goalFooterRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  goalPercent: { ...typography.captionMedium, color: colors.primary },
  goalRemaining: { ...typography.caption, color: colors.textSecondary },
  goalDone: { ...typography.captionMedium, color: colors.primary },
  sectionTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  challengeCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  challengeHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  challengeIconBadge: { width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  challengeTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  challengeDescription: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  challengeReward: { ...typography.captionMedium, color: colors.primary },
  progressTrackSmall: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised, overflow: 'hidden', marginBottom: spacing.xs },
  progressFillSmall: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  progressFillDone: { backgroundColor: colors.amber },
  challengeFooterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  challengeProgressText: { ...typography.tiny, color: colors.textMuted },
  challengeExpiry: { ...typography.tiny, color: colors.textMuted },
});

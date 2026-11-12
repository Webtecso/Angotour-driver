import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/common/ScreenContainer';
import { driverSupportApi, RatingsView } from '../../services/api';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Ratings'>;

export default function RatingsScreen({ navigation }: Props) {
  const [data, setData] = useState<RatingsView | null>(null);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    driverSupportApi.ratings().then((r) => { setData(r); setError(''); }).catch((e) => setError((e as Error).message));
  }, []));
  const max = Math.max(1, ...(data?.distribution.map((d) => d.count) ?? [1]));

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Avaliacoes</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!data && !error ? <Text style={styles.muted}>A carregar...</Text> : null}
        {data ? (
          <>
            <View style={styles.card}>
              <Text style={styles.big}>{data.count > 0 ? data.average.toFixed(2) : '-'}</Text>
              <Text style={styles.muted}>{data.count} {data.count === 1 ? 'avaliacao' : 'avaliacoes'} de passageiros</Text>
              {data.distribution.map((d) => (
                <View key={d.stars} style={styles.distRow}>
                  <Text style={styles.distLabel}>{d.stars}</Text>
                  <View style={styles.barBg}><View style={[styles.barFill, { width: `${(d.count / max) * 100}%` }]} /></View>
                  <Text style={styles.distCount}>{d.count}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.section}>Comentarios recentes</Text>
            {data.recent.filter((r) => r.comment).length === 0 ? <Text style={styles.muted}>Ainda sem comentarios.</Text> : null}
            {data.recent.filter((r) => r.comment).map((r, i) => (
              <View key={i} style={styles.comment}>
                <Text style={styles.commentStars}>{'*'.repeat(r.stars)}  <Text style={styles.muted}>{new Date(r.createdAt).toLocaleDateString('pt-AO')}</Text></Text>
                <Text style={styles.commentText}>{r.comment}</Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  scroll: { paddingBottom: spacing.xxl },
  error: { ...typography.caption, color: colors.danger },
  muted: { ...typography.caption, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  big: { ...typography.h1, color: colors.primary },
  distRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  distLabel: { ...typography.captionMedium, color: colors.textSecondary, width: 16 },
  barBg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.border, marginHorizontal: spacing.xs, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: colors.primary },
  distCount: { ...typography.caption, color: colors.textSecondary, width: 28, textAlign: 'right' },
  section: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  comment: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.xs },
  commentStars: { ...typography.captionMedium, color: colors.amber },
  commentText: { ...typography.body, color: colors.textPrimary, marginTop: 2 },
});
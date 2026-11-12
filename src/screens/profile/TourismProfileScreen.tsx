import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/common/ScreenContainer';
import { driverExtrasApi, TourismView } from '../../services/api';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'TourismProfile'>;

export default function TourismProfileScreen({ navigation }: Props) {
  const [t, setT] = useState<TourismView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    driverExtrasApi.tourism().then((r) => { setT(r); setError(''); }).catch((e) => setError((e as Error).message));
  }, []));

  const run = async (fn: () => Promise<TourismView>) => {
    if (busy) return;
    setBusy(true);
    try { setT(await fn()); } catch (e) { Alert.alert('Nao foi possivel guardar', (e as Error).message); } finally { setBusy(false); }
  };

  const toggleLanguage = (lang: string) => {
    if (!t) return;
    const next = t.languages.includes(lang) ? t.languages.filter((l) => l !== lang) : [...t.languages, lang];
    run(() => driverExtrasApi.setTourismLanguages(next));
  };

  const requirements = t ? [
    { label: 'Formacao turistica concluida pela AngoTour', met: t.hasTrainingCompleted },
    { label: `Pelo menos 2 idiomas (${t.languages.join(', ') || 'nenhum escolhido'})`, met: t.languages.length >= 2 },
    { label: `Avaliacao minima de ${t.minimumRating.toFixed(1)} (atual: ${t.currentRating.toFixed(1)})`, met: t.currentRating >= t.minimumRating },
  ] : [];

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Perfil Turismo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.introCard}>
          <Ionicons name="earth-outline" size={22} color={colors.primary} />
          <Text style={styles.introText}>
            Com o Perfil Turismo ativo, o passageiro pode pedir um "Motorista Turismo" - conhecimento local, idiomas e bom historico.
          </Text>
        </View>

        {t ? (
          <>
            <Text style={styles.sectionTitle}>Idiomas que falas</Text>
            <View style={styles.chipsRow}>
              {t.availableLanguages.map((lang) => {
                const on = t.languages.includes(lang);
                return (
                  <TouchableOpacity key={lang} style={[styles.chip, on && styles.chipActive]} activeOpacity={0.8} onPress={() => toggleLanguage(lang)} disabled={busy}>
                    <Text style={[styles.chipText, on && styles.chipTextActive]}>{lang}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Requisitos</Text>
            <View style={styles.requirementsCard}>
              {requirements.map((req) => (
                <View key={req.label} style={styles.requirementRow}>
                  <Ionicons name={req.met ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={req.met ? colors.primary : colors.textMuted} />
                  <Text style={styles.requirementText}>{req.label}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.toggleCard, !t.isEligible && styles.toggleCardDisabled]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Perfil Turismo ativo</Text>
                <Text style={styles.toggleSubtitle}>
                  {t.isEligible ? 'Podes receber pedidos de Motorista Turismo.' : 'Cumpre todos os requisitos para ativar.'}
                </Text>
              </View>
              <Switch
                value={t.isActive}
                onValueChange={(v) => run(() => driverExtrasApi.setTourismActive(v))}
                disabled={!t.isEligible || busy}
                trackColor={{ false: colors.surfaceRaised, true: colors.primary }}
                thumbColor={colors.textInverse}
              />
            </View>
          </>
        ) : !error ? <Text style={styles.toggleSubtitle}>A carregar...</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  scroll: { paddingBottom: spacing.xxl },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
  introCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  introText: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.sm, flex: 1, lineHeight: 18 },
  sectionTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  chip: { backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs, marginBottom: spacing.xs },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.captionMedium, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  requirementsCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  requirementRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  requirementText: { ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm, flex: 1 },
  toggleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  toggleCardDisabled: { opacity: 0.6 },
  toggleTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  toggleSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
});
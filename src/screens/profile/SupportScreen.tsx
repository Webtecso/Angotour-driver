import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/common/ScreenContainer';
import { driverSupportApi, SupportCaseView } from '../../services/api';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Support'>;
const SUBJECTS = ['Pagamentos', 'Carteira', 'Conta e documentos', 'Corrida', 'Outro'];
const statusLabel = (s: string) => (s === 'recebido' ? 'Recebido' : s === 'resolvido' ? 'Resolvido' : 'Em analise');

export default function SupportScreen({ navigation }: Props) {
  const [cases, setCases] = useState<SupportCaseView[] | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { driverSupportApi.list().then(setCases).catch(() => setCases([])); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const send = async () => {
    if (!subject || text.trim().length < 10 || busy) return;
    setBusy(true);
    try {
      const r = await driverSupportApi.create(subject, text.trim());
      setSubject(null); setText(''); load();
      Alert.alert('Pedido enviado', 'Caso ' + r.caseNumber + ' registado. A equipa AngoTour vai analisar.');
    } catch (e) {
      Alert.alert('Nao foi possivel enviar', (e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Suporte</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Novo pedido</Text>
        <View style={styles.chips}>
          {SUBJECTS.map((s) => (
            <TouchableOpacity key={s} style={[styles.chip, subject === s && styles.chipOn]} onPress={() => setSubject(s)}>
              <Text style={[styles.chipText, subject === s && { color: colors.textInverse }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.input} value={text} onChangeText={setText} multiline maxLength={1000}
          placeholder="Descreve o problema (minimo 10 caracteres)" placeholderTextColor={colors.textMuted} />
        <TouchableOpacity style={[styles.cta, (!subject || text.trim().length < 10 || busy) && { opacity: 0.5 }]} disabled={!subject || text.trim().length < 10 || busy} onPress={send}>
          <Text style={styles.ctaText}>{busy ? 'A enviar...' : 'Enviar pedido'}</Text>
        </TouchableOpacity>

        <Text style={[styles.section, { marginTop: spacing.lg }]}>Os meus pedidos</Text>
        {cases === null ? <Text style={styles.muted}>A carregar...</Text> : null}
        {cases && cases.length === 0 ? <Text style={styles.muted}>Ainda sem pedidos.</Text> : null}
        {(cases ?? []).map((c) => (
          <View key={c.id} style={styles.card}>
            <View style={styles.rowBetween}><Text style={styles.cardTitle}>{c.category.replace('Suporte - ', '')}</Text><Text style={styles.status}>{statusLabel(c.status)}</Text></View>
            <Text style={styles.muted}>{c.caseNumber} - {new Date(c.createdAt).toLocaleDateString('pt-AO')}</Text>
            <Text style={styles.body}>{c.description}</Text>
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
  section: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  chip: { backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs, marginBottom: spacing.xs },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.captionMedium, color: colors.textSecondary },
  input: { minHeight: 90, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, color: colors.textPrimary, ...typography.body, textAlignVertical: 'top' },
  cta: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center', marginTop: spacing.sm },
  ctaText: { ...typography.bodyMedium, color: colors.textInverse },
  muted: { ...typography.caption, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.xs },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  status: { ...typography.captionMedium, color: colors.primary },
  body: { ...typography.body, color: colors.textPrimary, marginTop: 4 },
});
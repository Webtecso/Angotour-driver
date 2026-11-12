import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, type ScrollViewInstance, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useDriver } from '../../contexts/DriverContext';
import { driverWalletApi } from '../../services/api';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Filter = 'all' | 'commission';

// Mesmos metodos digitais do passageiro, sem dinheiro vivo. Cartao entra quando houver prestador de pagamentos.
const METHODS: { id: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; available: boolean }[] = [
  { id: 'multicaixa_express', label: 'Multicaixa Express', icon: 'card-outline', available: true },
  { id: 'unitel_money', label: 'Unitel Money', icon: 'phone-portrait-outline', available: true },
  { id: 'card', label: 'Cartao (em breve)', icon: 'card', available: false },
];

const STATUS_LABEL: Record<string, string> = {
  processing: 'a confirmar', confirmed: 'confirmado', failed: 'falhou',
  reserved: 'reservada', settled: 'liquidada', released: 'libertada',
};
const KIND_LABEL: Record<string, string> = { topup: 'Deposito', commission: 'Comissao', zone_incentive: 'Incentivo de zona' };

const kz = (n: number) => n.toLocaleString('pt-AO') + ' Kz';
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function WalletScreen() {
  const { wallet, refreshWallet, walletAvailableKz, walletReservedKz, minimumOperatingBalanceKz } = useDriver();
  const [filter, setFilter] = useState<Filter>('all');
  const [depositOpen, setDepositOpen] = useState(false);
    const [custom, setCustom] = useState('');
  const [method, setMethod] = useState('multicaixa_express');
  const [paying, setPaying] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const listY = useRef(0);

  useFocusEffect(useCallback(() => { refreshWallet(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []));

  const chosenAmount = custom.trim() ? Number(custom) : 0;
  const validAmount = !!chosenAmount && chosenAmount >= 500 && chosenAmount <= 500000;

  const showList = (f: Filter) => {
    setFilter(f);
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, listY.current - 8), animated: true }), 50);
  };

  const showHelp = () => {
    Alert.alert(
      'Ajuda da carteira',
      'Saldo minimo: precisas de ' + kz(minimumOperatingBalanceKz) + ' disponiveis para ficar online.\n\n' +
        'Comissao: 12% de cada corrida e reservada quando aceitas e liquidada quando concluis. Se a corrida for cancelada, a reserva e libertada.\n\n' +
        'Depositos: ficam "a confirmar" ate o pagamento da referencia ser confirmado.'
    );
  };

  const pay = async () => {
    if (!validAmount || !chosenAmount || paying) return;
    setPaying(true);
    try {
      const topUp = await driverWalletApi.startTopUp(chosenAmount, method);
      let confirmed = false;
      if (__DEV__) {
        try { await driverWalletApi.confirmTopUp(topUp.id); confirmed = true; } catch { confirmed = false; }
      }
      await refreshWallet();
      setDepositOpen(false);
      setCustom('');
      Alert.alert(
        confirmed ? 'Deposito confirmado' : 'Deposito pendente',
        confirmed
          ? 'Pagamento simulado (modo de desenvolvimento).'
          : 'Paga a referencia ' + topUp.reference + ' por ' + (METHODS.find((m) => m.id === method)?.label ?? 'o metodo escolhido') + '. O saldo atualiza quando o pagamento for confirmado.'
      );
    } catch (e) {
      Alert.alert('Nao foi possivel depositar', (e as Error).message);
    } finally {
      setPaying(false);
    }
  };

  const todayGross = wallet?.todayGrossKz ?? 0;
  const todayTrips = wallet?.todayTrips ?? 0;
  const commissionsToday = wallet?.commissionsTodayKz ?? 0;
  const todayNet = wallet?.todayNetKz ?? 0;
  const belowMinimum = walletAvailableKz < minimumOperatingBalanceKz;
  const entries = (wallet?.entries ?? []).filter((e) => (filter === 'commission' ? e.kind === 'commission' : true));

  const shortcuts: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; active?: boolean; onPress: () => void }[] = [
    { icon: 'add-circle-outline', label: 'Depositar', onPress: () => setDepositOpen(true) },
    { icon: 'time-outline', label: 'Historico', active: filter === 'all', onPress: () => showList('all') },
    { icon: 'pricetag-outline', label: 'Comissoes', active: filter === 'commission', onPress: () => showList('commission') },
    { icon: 'help-circle-outline', label: 'Ajuda', onPress: showHelp },
  ];

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="wallet" size={20} color={colors.primary} />
        <Text style={styles.headerTitle}>Carteira</Text>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponivel</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceValue}>{kz(walletAvailableKz)}</Text>
            <TouchableOpacity style={styles.depositButton} activeOpacity={0.85} onPress={() => setDepositOpen(true)}>
              <Text style={styles.depositButtonText}>Depositar</Text>
            </TouchableOpacity>
          </View>
          {belowMinimum ? <Text style={styles.belowMinimumText}>Minimo para receber corridas: {kz(minimumOperatingBalanceKz)}.</Text> : null}
        </View>

        <View style={styles.shortcutsRow}>
          {shortcuts.map((s) => (
            <TouchableOpacity key={s.label} style={styles.shortcut} activeOpacity={0.8} onPress={s.onPress}>
              <View style={[styles.shortcutIconBadge, s.active && styles.shortcutIconBadgeActive]}>
                <Ionicons name={s.icon} size={18} color={s.active ? colors.textInverse : colors.primary} />
              </View>
              <Text style={styles.shortcutLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.todayCard}>
          <Text style={styles.todayTitle}>Hoje</Text>
          <View style={styles.todayRow}><Ionicons name="trending-up-outline" size={16} color={colors.textSecondary} /><Text style={styles.todayLabel}>Ganhos do dia</Text><Text style={styles.todayValue}>{kz(todayGross)}</Text></View>
          <View style={styles.todayRow}><Ionicons name="car-outline" size={16} color={colors.textSecondary} /><Text style={styles.todayLabel}>Corridas realizadas</Text><Text style={styles.todayValue}>{todayTrips}</Text></View>
          <View style={styles.todayRow}><Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} /><Text style={styles.todayLabel}>Comissao da plataforma</Text><Text style={styles.todayValueNegative}>-{kz(commissionsToday)}</Text></View>
          <View style={styles.todayDivider} />
          <View style={styles.todayRow}><Ionicons name="checkmark-done-outline" size={16} color={colors.primary} /><Text style={styles.todayLabelBold}>Saldo liquido</Text><Text style={styles.todayValueBold}>{kz(todayNet)}</Text></View>
        </View>

        {walletReservedKz > 0 ? (
          <View style={styles.reservedCard}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.amber} />
            <Text style={styles.reservedText}>{kz(walletReservedKz)} reservados para comissoes de corridas em curso.</Text>
          </View>
        ) : null}

        <View onLayout={(e) => { listY.current = e.nativeEvent.layout.y; }}>
          <Text style={styles.sectionTitle}>{filter === 'commission' ? 'Comissoes' : 'Historico de movimentos'}</Text>
          {entries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {filter === 'commission' ? 'Ainda nao ha comissoes.' : 'Ainda nao ha movimentos. Faz um deposito para comecar a receber corridas.'}
              </Text>
            </View>
          ) : (
            <View style={styles.entriesCard}>
              {entries.map((entry) => {
                const positive = entry.kind === 'topup' || entry.kind === 'zone_incentive';
                const muted = entry.status === 'released' || entry.status === 'failed';
                return (
                  <View key={entry.id} style={styles.entryRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryLabel}>{KIND_LABEL[entry.kind] ?? entry.kind} ({STATUS_LABEL[entry.status] ?? entry.status})</Text>
                      <Text style={styles.entryMeta}>{formatDate(entry.createdAt)}{entry.reference ? ' - Ref. ' + entry.reference : ''}</Text>
                    </View>
                    <Text style={[styles.entryAmount, positive && !muted && { color: colors.primary }, muted && { color: colors.textMuted }]}>
                      {positive ? '+' : '-'}{kz(entry.amountKz)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      <Modal visible={depositOpen} animationType="slide" onRequestClose={() => setDepositOpen(false)}>
        <SafeAreaView style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Depositar</Text>
            <TouchableOpacity onPress={() => setDepositOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalLabel}>Valor</Text>
            <TextInput
              style={styles.input}
              value={custom}
              onChangeText={(t) => setCustom(t.replace(/\D/g, ''))}
              placeholder="Valor a depositar (500 a 500.000 Kz)"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Text style={[styles.modalLabel, { marginTop: spacing.lg }]}>Forma de pagamento</Text>
            {METHODS.map((m) => {
              const on = method === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.methodRow, on && styles.methodRowActive, !m.available && { opacity: 0.45 }]}
                  activeOpacity={0.8}
                  disabled={!m.available}
                  onPress={() => setMethod(m.id)}
                >
                  <Ionicons name={m.icon} size={20} color={colors.textPrimary} />
                  <Text style={styles.methodLabel}>{m.label}</Text>
                  <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? colors.primary : colors.textMuted} />
                </TouchableOpacity>
              );
            })}

            <Text style={styles.note}>
              Vais receber uma referencia para pagar. O saldo so atualiza depois de o pagamento ser confirmado.
            </Text>

            <TouchableOpacity style={[styles.payButton, (!validAmount || paying) && { opacity: 0.5 }]} activeOpacity={0.85} disabled={!validAmount || paying} onPress={pay}>
              {paying ? <ActivityIndicator color={colors.textInverse} /> : (
                <Text style={styles.payButtonText}>{validAmount && chosenAmount ? 'Depositar ' + kz(chosenAmount) : 'Escolhe um valor'}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  headerTitle: { ...typography.h2, color: colors.textPrimary, marginLeft: spacing.xs },
  balanceCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  balanceLabel: { ...typography.caption, color: colors.textSecondary },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  balanceValue: { ...typography.h1, color: colors.textPrimary },
  belowMinimumText: { ...typography.caption, color: colors.amber, marginTop: spacing.xs },
  depositButton: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  depositButtonText: { ...typography.captionMedium, color: colors.textInverse },
  shortcutsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  shortcut: { alignItems: 'center', flex: 1 },
  shortcutIconBadge: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxs },
  shortcutIconBadgeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  shortcutLabel: { ...typography.tiny, color: colors.textSecondary },
  todayCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  todayTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  todayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  todayLabel: { ...typography.body, color: colors.textSecondary, marginLeft: spacing.sm, flex: 1 },
  todayValue: { ...typography.bodyMedium, color: colors.textPrimary },
  todayValueNegative: { ...typography.bodyMedium, color: colors.danger },
  todayDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  todayLabelBold: { ...typography.bodyMedium, color: colors.textPrimary, marginLeft: spacing.sm, flex: 1 },
  todayValueBold: { ...typography.subtitle, color: colors.primary },
  reservedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.amberLight, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.lg },
  reservedText: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.xs, flex: 1 },
  sectionTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  emptyText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  entriesCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  entryLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  entryMeta: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  entryAmount: { ...typography.bodyMedium, color: colors.textPrimary, marginLeft: spacing.sm },
  modalRoot: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { ...typography.h3, color: colors.textPrimary },
  modalLabel: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.xs },
  chip: { backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs, marginBottom: spacing.xs },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.captionMedium, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, ...typography.body, color: colors.textPrimary },
  methodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xs },
  methodRowActive: { borderColor: colors.primary },
  methodLabel: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1, marginLeft: spacing.sm },
  note: { ...typography.caption, color: colors.textMuted, marginTop: spacing.md },
  payButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  payButtonText: { ...typography.subtitle, color: colors.textInverse },
});
import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import Button from '../../components/common/Button';
import { useDriver } from '../../contexts/DriverContext';
import { driverVehicleApi, DriverVehicleView } from '../../services/api';
import { HomeStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripNavigation'>;

export default function TripNavigationScreen({ navigation }: Props) {
  const { activeTrip, markArrived, confirmBoarding, startTrip, completeTrip, clearActiveTrip } = useDriver();
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [vehicleConfirmed, setVehicleConfirmed] = useState(false);
  const [sosVisible, setSosVisible] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [vehicle, setVehicle] = useState<DriverVehicleView | null>(null);

  useEffect(() => {
    driverVehicleApi.get().then((r) => setVehicle(r.vehicle)).catch(() => {});
  }, []);

  if (!activeTrip) {
    navigation.goBack();
    return null;
  }

  const handleConfirmBoarding = async () => {
    setIsConfirming(true);
    const ok = await confirmBoarding(codeInput);
    setIsConfirming(false);
    if (!ok) {
      setCodeError(true);
      return;
    }
    setCodeError(false);
  };

  const handleFinish = () => {
    completeTrip();
  };

  const handleClose = () => {
    clearActiveTrip();
    navigation.popToTop();
  };

  const handleSos = (reason: string) => {
    setSosVisible(false);
    Alert.alert('Alerta enviado', `Localizacao enviada ao backend (${reason}) - simulacao.`);
  };

  // --- Estado: a caminho do passageiro ---
  if (activeTrip.status === 'heading_to_passenger') {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.headerRow}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={handleClose} />
          <Text style={styles.headerTitle}>Passageiro</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.mapPlaceholder}>
          <Ionicons name="navigate" size={32} color={colors.primary} />
          <Text style={styles.mapPlaceholderText}>Mapa - a caminho do passageiro</Text>
        </View>

        <View style={styles.etaCard}>
          <Text style={styles.etaMinutes}>{activeTrip.etaMinutes} min</Text>
          <Text style={styles.etaDistance}>{activeTrip.distanceKm.toFixed(1)} km ate ao destino final</Text>
        </View>

        <Button label="CHEGUEI" onPress={markArrived} style={{ marginTop: spacing.md }} />
        <Button label="SEGURANCA" variant="outline" onPress={() => setSosVisible(true)} style={{ marginTop: spacing.sm }} />

        {sosVisible ? <SosSheet onSelect={handleSos} onClose={() => setSosVisible(false)} /> : null}
      </ScreenContainer>
    );
  }

  // --- Estado: chegou, aguarda codigo + verificacao do veiculo ---
  if (activeTrip.status === 'arrived') {
    return (
      <ScreenContainer style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={32} color={colors.textInverse} />
          </View>
          <Text style={styles.centeredTitle}>Cheguei</Text>
          <Text style={styles.centeredSubtitle}>O passageiro sera notificado.</Text>

          <Text style={styles.sectionLabel}>Passageiro tem o codigo:</Text>
          <TextInput
            style={[styles.codeInput, codeError && { borderColor: colors.danger }]}
            placeholder="0000"
            placeholderTextColor={colors.textMuted}
            value={codeInput}
            onChangeText={(t) => { setCodeInput(t.replace(/[^0-9]/g, '').slice(0, 4)); setCodeError(false); }}
            keyboardType="number-pad"
            maxLength={4}
          />
          {codeError ? <Text style={styles.codeErrorText}>Codigo incorreto. Confirma com o passageiro.</Text> : null}

          <Button label="CONFIRMAR EMBARQUE" onPress={handleConfirmBoarding} loading={isConfirming} disabled={codeInput.length !== 4 || isConfirming} style={{ marginTop: spacing.md }} />
        </ScrollView>
      </ScreenContainer>
    );
  }

  // --- Estado: verificacao do veiculo antes de iniciar ---
  if (activeTrip.status === 'boarding') {
    return (
      <ScreenContainer style={styles.container}>
        <Text style={styles.headerTitle}>Verificacao do veiculo</Text>
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleIconBadge}>
            <Ionicons name="car-sport" size={28} color={colors.primary} />
          </View>
          <Text style={styles.vehicleModel}>{vehicle?.model ?? 'Veiculo'}</Text>
          <Text style={styles.vehiclePlate}>{vehicle?.plate ?? ''}</Text>
        </View>

        <TouchableOpacity style={styles.checkRow} activeOpacity={0.8} onPress={() => setVehicleConfirmed(!vehicleConfirmed)}>
          <Ionicons name={vehicleConfirmed ? 'checkbox' : 'square-outline'} size={20} color={vehicleConfirmed ? colors.primary : colors.textMuted} />
          <Text style={styles.checkText}>Veiculo correto - matricula correta - veiculo autorizado</Text>
        </TouchableOpacity>

        <Button label="Confirmar" onPress={startTrip} disabled={!vehicleConfirmed} style={{ marginTop: spacing.lg }} />
      </ScreenContainer>
    );
  }

  // --- Estado: em viagem ---
  if (activeTrip.status === 'in_progress') {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>EM VIAGEM - {activeTrip.distanceKm.toFixed(1)} km</Text>
        </View>

        <View style={styles.mapPlaceholder}>
          <Ionicons name="navigate" size={32} color={colors.primary} />
          <Text style={styles.mapPlaceholderText}>Mapa - a caminho de {activeTrip.destinationLabel}</Text>
        </View>

        <View style={styles.etaCard}>
          <Text style={styles.etaLabel}>Destino</Text>
          <Text style={styles.etaMinutes}>{activeTrip.destinationLabel}</Text>
          <Text style={styles.etaDistance}>ETA: {activeTrip.etaMinutes} min</Text>
        </View>

        <Button label="FINALIZAR VIAGEM" onPress={handleFinish} style={{ marginTop: spacing.md }} />
        <Button label="SEGURANCA" variant="outline" onPress={() => setSosVisible(true)} style={{ marginTop: spacing.sm }} />

        {sosVisible ? <SosSheet onSelect={handleSos} onClose={() => setSosVisible(false)} /> : null}
      </ScreenContainer>
    );
  }

  // --- Estado: concluida, recebimento e resumo ---
  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Viagem concluida</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Valor da viagem</Text>
            <Text style={styles.summaryValue}>{activeTrip.fareKz.toLocaleString('pt-AO')} Kz</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Comissao AngoTour</Text>
            <Text style={styles.summaryValueMuted}>-{activeTrip.commissionKz.toLocaleString('pt-AO')} Kz</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Ganho motorista</Text>
            <Text style={styles.summaryValueBold}>{activeTrip.netEarningsKz.toLocaleString('pt-AO')} Kz</Text>
          </View>
        </View>

        {activeTrip.paymentMethod === 'cash' && !paymentReceived ? (
          <>
            <Text style={styles.receiveLabel}>Receber {activeTrip.fareKz.toLocaleString('pt-AO')} Kz</Text>
            <Button label="PAGAMENTO RECEBIDO" onPress={() => setPaymentReceived(true)} style={{ marginTop: spacing.sm }} />
          </>
        ) : (
          <Button label="Concluir" onPress={handleClose} style={{ marginTop: spacing.lg }} />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function SosSheet({ onSelect, onClose }: { onSelect: (reason: string) => void; onClose: () => void }) {
  const options = ['Emergencia', 'Policia', 'Assistencia', 'Acidente', 'Situacao suspeita'];
  return (
    <View style={styles.sosSheet}>
      <View style={styles.sosSheetHeader}>
        <Ionicons name="alert-circle" size={20} color={colors.danger} />
        <Text style={styles.sosSheetTitle}>ANGOTOUR SAFE</Text>
        <Ionicons name="close" size={22} color={colors.textMuted} onPress={onClose} />
      </View>
      {options.map((opt) => (
        <TouchableOpacity key={opt} style={styles.sosOption} activeOpacity={0.8} onPress={() => onSelect(opt)}>
          <Text style={styles.sosOptionText}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  mapPlaceholder: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', minHeight: 260, marginBottom: spacing.md },
  mapPlaceholderText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  etaCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  etaLabel: { ...typography.caption, color: colors.textSecondary },
  etaMinutes: { ...typography.h2, color: colors.textPrimary },
  etaDistance: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  checkBadge: { width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: spacing.xl, marginBottom: spacing.sm },
  centeredTitle: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  centeredSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxs, marginBottom: spacing.xl },
  sectionLabel: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.sm },
  codeInput: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, padding: spacing.md, textAlign: 'center', ...typography.h1, color: colors.textPrimary, letterSpacing: 8 },
  codeErrorText: { ...typography.caption, color: colors.danger, marginTop: spacing.xs, textAlign: 'center' },
  vehicleCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  vehicleIconBadge: { width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  vehicleModel: { ...typography.h3, color: colors.textPrimary },
  vehiclePlate: { ...typography.subtitle, color: colors.textSecondary, marginTop: 2 },
  checkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  checkText: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.sm, flex: 1 },
  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xxs },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryValue: { ...typography.body, color: colors.textPrimary },
  summaryValueMuted: { ...typography.body, color: colors.textMuted },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  summaryLabelBold: { ...typography.subtitle, color: colors.textPrimary },
  summaryValueBold: { ...typography.subtitle, color: colors.primary },
  receiveLabel: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  sosSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, borderTopWidth: 1, borderColor: colors.border },
  sosSheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sosSheetTitle: { ...typography.subtitle, color: colors.textPrimary, marginLeft: spacing.xs, flex: 1 },
  sosOption: { paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.border },
  sosOptionText: { ...typography.body, color: colors.textPrimary },
});




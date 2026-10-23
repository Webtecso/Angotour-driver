import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenContainer from '../../components/common/ScreenContainer';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { driverVehicleApi, DriverVehicleView } from '../../services/api';
import { colors, radius, spacing, typography } from '../../constants/theme';

const CATEGORIES: { id: string; label: string; capacity: number }[] = [
  { id: 'ango_taxi', label: 'Taxi', capacity: 4 },
  { id: 'ango_conforto', label: 'Conforto', capacity: 4 },
  { id: 'ango_executivo', label: 'Executivo', capacity: 4 },
  { id: 'ango_family', label: 'Familia', capacity: 6 },
  { id: 'ango_moto', label: 'Moto', capacity: 1 },
];

const STATUS: Record<DriverVehicleView['status'], { label: string; color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  pending: { label: 'Em analise', color: colors.amber, icon: 'time-outline' },
  approved: { label: 'Aprovado', color: colors.primary, icon: 'checkmark-circle' },
  rejected: { label: 'Rejeitado', color: colors.danger, icon: 'close-circle' },
};

export default function VehicleScreen() {
  const navigation = useNavigation();
  const [vehicle, setVehicle] = useState<DriverVehicleView | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [categoryId, setCategoryId] = useState('ango_taxi');

  const fillForm = (v: DriverVehicleView | null) => {
    setModel(v?.model ?? '');
    setPlate(v?.plate ?? '');
    setColor(v?.color ?? '');
    setCategoryId(v?.categoryId ?? 'ango_taxi');
  };

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setLoading(true);
      driverVehicleApi
        .get()
        .then(({ vehicle: v }) => {
          if (!alive) return;
          setVehicle(v);
          fillForm(v);
          setEditing(v === null);
        })
        .catch((e) => alive && setError((e as Error).message))
        .finally(() => alive && setLoading(false));
      return () => { alive = false; };
    }, [])
  );

  const startEditing = () => {
    if (vehicle?.status === 'approved') {
      Alert.alert('Alterar veiculo', 'Alterar os dados volta a colocar o veiculo em analise.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', onPress: () => setEditing(true) },
      ]);
      return;
    }
    setEditing(true);
  };

  const handleSave = async () => {
    if (model.trim().length < 2 || plate.trim().length < 4 || color.trim().length < 2) {
      setError('Preenche modelo, matricula e cor.');
      return;
    }
    const category = CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0];
    setError(undefined);
    setSaving(true);
    try {
      const { vehicle: saved } = await driverVehicleApi.save({
        model: model.trim(), plate: plate.trim(), color: color.trim(), categoryId: category.id, capacity: category.capacity,
      });
      setVehicle(saved);
      fillForm(saved);
      setEditing(false);
      Alert.alert('Veiculo enviado', 'Fica em analise ate ser aprovado pela equipa AngoTour.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.canGoBack() && navigation.goBack()} />
        <Text style={styles.headerTitle}>Meu veiculo</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {vehicle && !editing ? (
            <>
              <View style={styles.vehicleCard}>
                <View style={styles.vehicleTop}>
                  <View style={styles.vehicleIconBadge}>
                    <Ionicons name="car-sport" size={28} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleModel}>{vehicle.model}</Text>
                    <Text style={styles.vehiclePlate}>{vehicle.plate} - {vehicle.color}</Text>
                    <Text style={styles.vehicleMeta}>{categoryLabel(vehicle.categoryId)} - {vehicle.capacity} lugar(es)</Text>
                  </View>
                </View>
                <View style={[styles.statusPill, { backgroundColor: STATUS[vehicle.status].color + '22' }]}>
                  <Ionicons name={STATUS[vehicle.status].icon} size={14} color={STATUS[vehicle.status].color} />
                  <Text style={[styles.statusText, { color: STATUS[vehicle.status].color }]}>{STATUS[vehicle.status].label}</Text>
                </View>
              </View>

              {vehicle.status === 'rejected' && vehicle.rejectionReason ? (
                <View style={styles.rejectionBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                  <Text style={styles.rejectionText}>{vehicle.rejectionReason}</Text>
                </View>
              ) : null}
              {vehicle.status === 'pending' ? (
                <Text style={styles.hint}>A equipa AngoTour esta a rever o teu veiculo.</Text>
              ) : null}

              <Button
                label={vehicle.status === 'rejected' ? 'Corrigir e reenviar' : 'Alterar dados'}
                variant="outline"
                onPress={startEditing}
                style={{ marginTop: spacing.lg }}
              />
            </>
          ) : (
            <>
              <Text style={styles.formIntro}>
                {vehicle ? 'Atualiza os dados do veiculo.' : 'Regista o veiculo com que vais trabalhar. A equipa AngoTour revê antes de poderes usá-lo.'}
              </Text>
              <Input label="Modelo" placeholder="Ex: Toyota Corolla" value={model} onChangeText={setModel} autoCapitalize="words" />
              <Input label="Matricula" placeholder="Ex: LD-23-45-GH" value={plate} onChangeText={setPlate} autoCapitalize="characters" />
              <Input label="Cor" placeholder="Ex: Branco" value={color} onChangeText={setColor} autoCapitalize="words" />

              <Text style={styles.fieldLabel}>Categoria</Text>
              <View style={styles.chipsRow}>
                {CATEGORIES.map((c) => {
                  const active = c.id === categoryId;
                  return (
                    <TouchableOpacity key={c.id} style={[styles.chip, active && styles.chipActive]} activeOpacity={0.8} onPress={() => setCategoryId(c.id)}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button label={vehicle ? 'Guardar e reenviar' : 'Enviar para analise'} onPress={handleSave} loading={saving} style={{ marginTop: spacing.md }} />
              {vehicle ? (
                <Button label="Cancelar" variant="outline" onPress={() => { fillForm(vehicle); setError(undefined); setEditing(false); }} style={{ marginTop: spacing.sm }} />
              ) : null}
            </>
          )}
          {error && !editing ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  scroll: { paddingBottom: spacing.xxl },
  vehicleCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  vehicleTop: { flexDirection: 'row', alignItems: 'center' },
  vehicleIconBadge: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  vehicleModel: { ...typography.subtitle, color: colors.textPrimary },
  vehiclePlate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  vehicleMeta: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, marginTop: spacing.sm },
  statusText: { ...typography.captionMedium, marginLeft: 4 },
  rejectionBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.dangerLight, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm },
  rejectionText: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.xs, flex: 1 },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  formIntro: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  fieldLabel: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.xs },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs, marginBottom: spacing.xs },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.captionMedium, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
});

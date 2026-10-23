import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/common/ScreenContainer';
import Button from '../../components/common/Button';
import { mockLostItems } from '../../services/mockData';
import { LostItemCategory, LostItemReport, LostItemStatus } from '../../types';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'LostItems'>;

const CATEGORIES: { id: LostItemCategory; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'phone', label: 'Telemovel', icon: 'phone-portrait-outline' },
  { id: 'wallet', label: 'Carteira', icon: 'wallet-outline' },
  { id: 'documents', label: 'Documentos', icon: 'document-text-outline' },
  { id: 'clothing', label: 'Roupa', icon: 'shirt-outline' },
  { id: 'other', label: 'Outro', icon: 'cube-outline' },
];

const STATUS_LABEL: Record<LostItemStatus, string> = {
  reported: 'Reportado',
  matched: 'Contacto feito',
  returned: 'Devolvido',
};

const STATUS_COLOR: Record<LostItemStatus, string> = {
  reported: colors.amber,
  matched: colors.teal,
  returned: colors.primary,
};

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function LostItemsScreen({ navigation }: Props) {
  const [items, setItems] = useState<LostItemReport[]>(mockLostItems);
  const [isReporting, setIsReporting] = useState(false);
  const [category, setCategory] = useState<LostItemCategory | null>(null);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!category || description.trim().length < 5) return;
    const report: LostItemReport = {
      id: 'li-' + Date.now(),
      category,
      description: description.trim(),
      dateIso: new Date().toISOString(),
      status: 'reported',
    };
    setItems((prev) => [report, ...prev]);
    setCategory(null);
    setDescription('');
    setIsReporting(false);
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Objetos perdidos</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {isReporting ? (
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Categoria</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                    activeOpacity={0.8}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Ionicons name={cat.icon} size={14} color={isSelected ? colors.textInverse : colors.textSecondary} />
                    <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.formLabel}>Descricao</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Ex: telemovel preto encontrado no banco traseiro"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.formActionsRow}>
              <Button label="Cancelar" variant="outline" onPress={() => setIsReporting(false)} style={{ flex: 1, marginRight: spacing.sm }} />
              <Button label="Reportar" onPress={handleSubmit} disabled={!category || description.trim().length < 5} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.newButton} activeOpacity={0.85} onPress={() => setIsReporting(true)}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.newButtonText}>Reportar objeto encontrado</Text>
          </TouchableOpacity>
        )}

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Sem objetos reportados</Text>
          </View>
        ) : (
          items.map((item) => {
            const cat = CATEGORIES.find((c) => c.id === item.category);
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemIconBadge}>
                  <Ionicons name={cat?.icon ?? 'cube-outline'} size={16} color={colors.textPrimary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  <Text style={styles.itemMeta}>
                    {formatDate(item.dateIso)}{item.tripRef ? ` - Viagem ${item.tripRef}` : ''}
                  </Text>
                </View>
                <Text style={[styles.itemStatus, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  scroll: { paddingBottom: spacing.xxl },
  newButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm, marginBottom: spacing.lg },
  newButtonText: { ...typography.bodyMedium, color: colors.primary, marginLeft: spacing.xs },
  formCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  formLabel: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.sm },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  categoryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, marginRight: spacing.xs, marginBottom: spacing.xs },
  categoryChipActive: { backgroundColor: colors.primary },
  categoryChipText: { ...typography.tiny, color: colors.textSecondary, marginLeft: 4 },
  categoryChipTextActive: { color: colors.textInverse },
  textArea: { backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: spacing.sm, color: colors.textPrimary, textAlignVertical: 'top', minHeight: 70, marginBottom: spacing.md, ...typography.body },
  formActionsRow: { flexDirection: 'row' },
  itemCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.sm },
  itemIconBadge: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  itemDescription: { ...typography.bodyMedium, color: colors.textPrimary },
  itemMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  itemStatus: { ...typography.tiny },
  emptyState: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl },
  emptyTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: spacing.sm },
});

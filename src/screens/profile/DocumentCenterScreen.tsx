import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useDriver } from '../../contexts/DriverContext';
import { DocumentSubmissionStatus } from '../../types';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'DocumentCenter'>;

const STATUS_CONFIG: Record<DocumentSubmissionStatus, { label: string; color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  not_submitted: { label: 'Por enviar', color: colors.textMuted, icon: 'cloud-upload-outline' },
  pending: { label: 'Em analise', color: colors.amber, icon: 'time-outline' },
  approved: { label: 'Aprovado', color: colors.primary, icon: 'checkmark-circle' },
  rejected: { label: 'Rejeitado', color: colors.danger, icon: 'close-circle' },
};

export default function DocumentCenterScreen({ navigation }: Props) {
  const { documentSlots, areDocumentsApproved, submitDocument, refreshDocuments } = useDriver();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const approvedCount = documentSlots.filter((d) => d.submissionStatus === 'approved').length;

  useFocusEffect(
    useCallback(() => {
      refreshDocuments();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const upload = async (id: string, source: 'camera' | 'library') => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permissao necessaria', 'Ativa o acesso a camara nas definicoes para fotografar o documento.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.6,
          base64: true,
          cameraType: id === 'doc-selfie' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, base64: true });
      }
      if (result.canceled) return;
      const base64 = result.assets[0]?.base64;
      if (!base64) {
        Alert.alert('Nao foi possivel ler a imagem', 'Tenta outra vez.');
        return;
      }
      setUploadingId(id);
      await submitDocument(id, base64);
      Alert.alert('Documento enviado', 'Fica em analise ate ser aprovado pela equipa AngoTour.');
    } catch (e) {
      Alert.alert('Nao foi possivel enviar', (e as Error).message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleAttach = (id: string) => {
    if (id === 'doc-selfie') {
      Alert.alert('Selfie de verificacao', 'Tira uma selfie nitida, com boa iluminacao.', [
        { text: 'Tirar selfie', onPress: () => upload(id, 'camera') },
        { text: 'Cancelar', style: 'cancel' },
      ]);
      return;
    }
    Alert.alert('Anexar documento', 'Como queres enviar?', [
      { text: 'Fotografar', onPress: () => upload(id, 'camera') },
      { text: 'Escolher da galeria', onPress: () => upload(id, 'library') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Meus documentos</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.summaryCard, areDocumentsApproved && styles.summaryCardDone]}>
        <Ionicons
          name={areDocumentsApproved ? 'shield-checkmark' : 'shield-half-outline'}
          size={22}
          color={areDocumentsApproved ? colors.primary : colors.amber}
        />
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <Text style={styles.summaryTitle}>{approvedCount} de {documentSlots.length} documentos aprovados</Text>
          <Text style={styles.summarySubtitle}>
            {areDocumentsApproved
              ? 'Tudo em ordem - podes ficar online.'
              : 'Precisas de ter todos aprovados para ficar online.'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {documentSlots.map((doc) => {
          const config = STATUS_CONFIG[doc.submissionStatus];
          const canSubmit = doc.submissionStatus === 'not_submitted' || doc.submissionStatus === 'rejected';
          const isUploading = uploadingId === doc.id;
          return (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docHeaderRow}>
                <View style={[styles.docIconBadge, { backgroundColor: `${config.color}22` }]}>
                  <Ionicons name={config.icon} size={16} color={config.color} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.docLabel}>{doc.label}</Text>
                  <Text style={styles.docDescription}>{doc.description}</Text>
                </View>
                <Text style={[styles.docStatusText, { color: config.color }]}>{config.label}</Text>
              </View>

              {doc.submissionStatus === 'rejected' && doc.rejectionReason ? (
                <View style={styles.rejectionBox}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
                  <Text style={styles.rejectionText}>{doc.rejectionReason}</Text>
                </View>
              ) : null}

              {canSubmit ? (
                <TouchableOpacity
                  style={[styles.attachButton, isUploading && { opacity: 0.6 }]}
                  activeOpacity={0.85}
                  disabled={isUploading || uploadingId !== null}
                  onPress={() => handleAttach(doc.id)}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="camera-outline" size={16} color={colors.primary} />
                  )}
                  <Text style={styles.attachButtonText}>
                    {isUploading ? 'A enviar...' : doc.submissionStatus === 'rejected' ? 'Reenviar documento' : 'Anexar documento'}
                  </Text>
                </TouchableOpacity>
              ) : null}
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
  summaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.amberLight, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  summaryCardDone: { backgroundColor: colors.primaryLight },
  summaryTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  summarySubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  scroll: { paddingBottom: spacing.xxl },
  docCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  docHeaderRow: { flexDirection: 'row', alignItems: 'flex-start' },
  docIconBadge: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  docLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  docDescription: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  docStatusText: { ...typography.tiny },
  rejectionBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.dangerLight, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm },
  rejectionText: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.xs, flex: 1 },
  attachButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.xs, marginTop: spacing.sm },
  attachButtonText: { ...typography.captionMedium, color: colors.primary, marginLeft: spacing.xxs },
});

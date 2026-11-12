import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/common/ScreenContainer';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'About'>;

export default function AboutScreen({ navigation }: Props) {
  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Sobre o AngoTour</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.card}>
        <Text style={styles.name}>AngoTour Motorista</Text>
        <Text style={styles.muted}>Versao {Constants.expoConfig?.version ?? '-'}</Text>
        <Text style={[styles.muted, { marginTop: spacing.sm }]}>Webtec Solution</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  name: { ...typography.subtitle, color: colors.textPrimary },
  muted: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
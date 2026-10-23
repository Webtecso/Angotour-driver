import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const FEATURES: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
  { icon: 'cash-outline', label: 'Ganhos transparentes, sem surpresas' },
  { icon: 'wallet-outline', label: 'Carteira AngoTour integrada' },
  { icon: 'shield-checkmark-outline', label: 'Seguranca em cada viagem' },
  { icon: 'headset-outline', label: 'Suporte 24/7' },
];

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <ImageBackground
      source={require('../../../assets/images/driver-hero.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(11,18,16,0.05)', 'rgba(11,18,16,0.55)', 'rgba(11,18,16,0.92)', colors.background]}
        locations={[0, 0.45, 0.68, 0.85]}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <View style={styles.spacer} />

          <View style={styles.contentCard}>
            <View style={styles.featureList}>
              {FEATURES.map((feature) => (
                <View key={feature.label} style={styles.featureRow}>
                  <View style={styles.featureIconBadge}>
                    <Ionicons name={feature.icon} size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.featureText}>{feature.label}</Text>
                </View>
              ))}
            </View>

            <Button label="Continuar com telefone" onPress={() => navigation.navigate('Login')} />

            <View style={styles.legalRow}>
              <MaterialCommunityIcons name="steering" size={13} color={colors.textMuted} />
              <Text style={styles.legal}>Faz parte da frota de motoristas AngoTour</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'flex-end' },
  spacer: { flex: 1 },
  contentCard: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  featureList: { marginBottom: spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm + 2 },
  featureIconBadge: {
    width: 30, height: 30, borderRadius: radius.pill,
    backgroundColor: 'rgba(15,169,104,0.16)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  featureText: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
  legalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  legal: { ...typography.tiny, color: colors.textMuted, marginLeft: spacing.xxs },
});

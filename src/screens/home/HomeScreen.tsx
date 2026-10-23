import React, { useEffect } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DriverMapView from '../../components/home/DriverMapView';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDriver } from '../../contexts/DriverContext';
import { mockEarnings, mockIncomingTrip, mockWallet } from '../../services/mockData';
import { HomeStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

const VERIFY_STEPS = ['GPS e localizacao', 'Internet', 'Carteira AngoTour', 'Documentos', 'Veiculo', 'Conta', 'Requisitos de seguranca'];

// A imagem driver-hero.png ja traz o logotipo + "ANGOTOUR DRIVER" + frase +
// skyline + carro cozidos nos pixels (composicao unica). Calculamos a altura
// pela proporcao REAL do ficheiro, em vez de um numero fixo adivinhado -
// assim nunca corta nem distorce, seja qual for o tamanho da imagem.
const HERO_SOURCE = require('../../../assets/images/driver-hero.png');
const HERO_ASSET = Image.resolveAssetSource(HERO_SOURCE);
const SCREEN_WIDTH = Dimensions.get('window').width;
// Altura da imagem NA PROPORCAO REAL do ficheiro (nunca distorce).
const HERO_FULL_HEIGHT = HERO_ASSET?.width && HERO_ASSET?.height
  ? SCREEN_WIDTH * (HERO_ASSET.height / HERO_ASSET.width)
  : SCREEN_WIDTH * 1.6;
// Corta so a parte de baixo (estrada vazia), ancorado ao topo - mostra ate
// logo abaixo do carro, sem cortar o logotipo/texto no topo nem distorcer.
const HERO_CROP_FRACTION = 0.85;
const HERO_VISIBLE_HEIGHT = HERO_FULL_HEIGHT * HERO_CROP_FRACTION;

export default function HomeScreen({ navigation }: Props) {
  const { isOnline, isVerifyingOnline, walletAvailableKz, areDocumentsApproved, incomingRequest, activeTrip, goOnline, goOffline, simulateIncomingTrip } = useDriver();

  const belowMinimum = walletAvailableKz < mockWallet.minimumOperatingBalanceKz;
  const documentsNotApproved = !areDocumentsApproved;
  const isBlocked = belowMinimum || documentsNotApproved;

  const handleOpenDocuments = () => {
    (navigation.getParent() as any)?.navigate('ProfileTab', { screen: 'DocumentCenter' });
  };

  useEffect(() => {
    if (incomingRequest) navigation.navigate('IncomingTrip');
  }, [incomingRequest, navigation]);

  useEffect(() => {
    if (activeTrip) navigation.navigate('TripNavigation');
  }, [activeTrip, navigation]);

  const handleOpenProfile = () => {
    navigation.getParent()?.navigate('ProfileTab' as never);
  };

  // --- A verificar antes de ficar online ---
  if (isVerifyingOnline) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <View style={styles.verifyContainer}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} style={styles.verifyBack} onPress={() => {}} />
          <Text style={styles.verifyTitle}>Verificacao de seguranca</Text>
          <Text style={styles.verifySubtitle}>Estamos a verificar se tudo esta correto para voce ficar online.</Text>
          <View style={styles.verifyList}>
            {VERIFY_STEPS.map((step) => (
              <View key={step} style={styles.verifyRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.verifyStepText}>{step}</Text>
              </View>
            ))}
          </View>
          <View style={styles.verifyingBar}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.verifyingText}>A verificar...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- Offline: imagem completa (logo + texto + skyline + carro, ja na propria foto) + cartao escuro ---
  if (!isOnline) {
    return (
      <View style={styles.root}>
        <View style={{ width: SCREEN_WIDTH, height: HERO_VISIBLE_HEIGHT, overflow: 'hidden' }}>
          <Image source={HERO_SOURCE} style={{ width: SCREEN_WIDTH, height: HERO_FULL_HEIGHT, top: 0 }} resizeMode="cover" />
        </View>

        <ScrollView style={styles.offlineCard} contentContainerStyle={styles.offlineCardContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity activeOpacity={0.85} onPress={goOnline} disabled={isBlocked}>
            <LinearGradient
              colors={isBlocked ? [colors.surfaceRaised, colors.surfaceRaised] : [colors.primaryDark, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.onlineToggle}
            >
              <Ionicons name="radio-button-on" size={16} color={colors.textInverse} />
              <View style={{ marginLeft: spacing.xs }}>
                <Text style={styles.onlineToggleTitle}>Online</Text>
                <Text style={styles.onlineToggleSubtitle}>
                  {belowMinimum ? 'Carteira insuficiente' : documentsNotApproved ? 'Documentos pendentes' : 'Pronto para receber corridas'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {belowMinimum ? (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.warningText}>
                Saldo atual {walletAvailableKz.toLocaleString('pt-AO')} Kz - minimo necessario {mockWallet.minimumOperatingBalanceKz.toLocaleString('pt-AO')} Kz. Carrega a carteira para continuar.
              </Text>
            </View>
          ) : null}

          {documentsNotApproved ? (
            <TouchableOpacity style={styles.warningBox} activeOpacity={0.85} onPress={handleOpenDocuments}>
              <Ionicons name="document-text-outline" size={16} color={colors.amber} />
              <Text style={styles.warningText}>
                Tens documentos pendentes ou rejeitados. Toca aqui para os rever antes de ficar online.
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Ganhos hoje</Text>
              <Text style={styles.statValue}>{mockEarnings.todayKz.toLocaleString('pt-AO')} Kz</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Corridas</Text>
              <Text style={styles.statValue}>{mockEarnings.todayTrips}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Tempo online</Text>
              <Text style={styles.statValue}>{mockEarnings.todayOnlineHours.toFixed(1)}h</Text>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.85} onPress={goOnline} disabled={isBlocked}>
            <LinearGradient
              colors={isBlocked ? [colors.surfaceRaised, colors.surfaceRaised] : [colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.receiveButton}
            >
              <View style={styles.receiveIconBadge}>
                <MaterialCommunityIcons name="steering" size={18} color={colors.textInverse} />
              </View>
              <Text style={styles.receiveButtonText}>Receber corridas</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // --- Online: barra superior, mapa, cartao de procura ---
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Ionicons name="menu-outline" size={24} color={colors.textPrimary} onPress={handleOpenProfile} />
        <View style={styles.topBarBrand}>
          <Ionicons name="navigate-circle" size={18} color={colors.primary} />
          <Text style={styles.topBarBrandText}>ANGOTOUR DRIVER</Text>
        </View>
        <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
      </View>

      <TouchableOpacity style={styles.onlinePill} activeOpacity={0.85} onPress={goOffline}>
        <View style={styles.onlineDot} />
        <Text style={styles.onlinePillText}>Online</Text>
      </TouchableOpacity>

      <View style={styles.readyCard}>
        <Ionicons name="heart-circle" size={20} color={colors.primary} />
        <View style={{ marginLeft: spacing.xs, flex: 1 }}>
          <Text style={styles.readyCardTitle}>Pronto para receber corridas</Text>
          <Text style={styles.readyCardSubtitle}>Mantenha-se online para aumentar seus ganhos.</Text>
        </View>
      </View>

      <View style={styles.mapArea}>
        <DriverMapView center={{ latitude: -8.8383, longitude: 13.2344 }} />
        <TouchableOpacity style={styles.locateButton} activeOpacity={0.8}>
          <Ionicons name="locate" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.demandButton} activeOpacity={0.8} onPress={() => navigation.navigate('DemandMap')}>
          <Ionicons name="flame-outline" size={16} color={colors.textInverse} />
          <Text style={styles.demandButtonText}>Procura</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchingCard}>
        <Ionicons name="search-circle-outline" size={20} color={colors.primary} />
        <View style={{ marginLeft: spacing.xs, flex: 1 }}>
          <Text style={styles.searchingTitle}>Procurando corridas proximas...</Text>
          <Text style={styles.searchingSubtitle}>Voce sera notificado assim que houver uma solicitacao.</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.devButton} onPress={() => simulateIncomingTrip(mockIncomingTrip)}>
        <Text style={styles.devButtonText}>Simular nova corrida (teste)</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  offlineCard: { flex: 1, backgroundColor: colors.background },
  offlineCardContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
  onlineToggle: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  onlineToggleDisabled: { backgroundColor: colors.surfaceRaised },
  onlineToggleTitle: { ...typography.subtitle, color: colors.textInverse },
  onlineToggleSubtitle: { ...typography.caption, color: 'rgba(11,18,16,0.75)', marginTop: 1 },
  warningBox: { flexDirection: 'row', backgroundColor: colors.dangerLight, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md },
  warningText: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.xs, flex: 1 },
  statsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  statBox: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, padding: spacing.md, marginRight: spacing.xs, alignItems: 'center', ...shadow.soft },
  statLabel: { ...typography.tiny, color: colors.textMuted },
  statValue: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
  receiveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, paddingVertical: spacing.md },
  receiveButtonDisabled: { backgroundColor: colors.surfaceRaised },
  receiveButtonText: { ...typography.subtitle, color: colors.textInverse, marginLeft: spacing.xs },
  receiveIconBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },

  verifyContainer: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  verifyBack: { marginBottom: spacing.md },
  verifyTitle: { ...typography.h2, color: colors.textPrimary },
  verifySubtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  verifyList: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  verifyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  verifyStepText: { ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm },
  verifyingBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md },
  verifyingText: { ...typography.subtitle, color: colors.textInverse, marginLeft: spacing.sm },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  topBarBrand: { flexDirection: 'row', alignItems: 'center' },
  topBarBrandText: { ...typography.captionMedium, color: colors.textPrimary, marginLeft: spacing.xxs, letterSpacing: 0.5 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', backgroundColor: colors.primaryLight, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6, marginTop: spacing.sm, marginRight: spacing.lg },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: spacing.xxs },
  onlinePillText: { ...typography.captionMedium, color: colors.primaryDark },
  readyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  readyCardTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  readyCardSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  mapArea: { flex: 1, margin: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  locateButton: { position: 'absolute', bottom: spacing.sm, right: spacing.sm, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  demandButton: { position: 'absolute', bottom: spacing.sm, left: spacing.sm, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.danger, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs },
  demandButtonText: { ...typography.tiny, color: colors.textInverse, marginLeft: 4 },
  searchingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.xs },
  searchingTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  searchingSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  devButton: { alignSelf: 'center', marginBottom: spacing.sm },
  devButtonText: { ...typography.tiny, color: colors.textMuted, textDecorationLine: 'underline' },
});



























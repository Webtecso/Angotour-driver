import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DriverMapView from '../../components/home/DriverMapView';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useDriver } from '../../contexts/DriverContext';
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
const SCREEN_HEIGHT = Dimensions.get('window').height;
// Enche a largura toda (como no mockup) e mostra a imagem na proporcao
// real do ficheiro. So corta o excesso de baixo (estrada vazia apos a
// onda verde), limitado a uma fracao generosa da altura do ecra.
const HERO_FULL_HEIGHT = HERO_ASSET?.width && HERO_ASSET?.height
  ? SCREEN_WIDTH * (HERO_ASSET.height / HERO_ASSET.width)
  : SCREEN_WIDTH * 1.6;
const HERO_VISIBLE_HEIGHT = Math.min(HERO_FULL_HEIGHT, SCREEN_HEIGHT * 0.56);

export default function HomeScreen({ navigation }: Props) {
  const { isOnline, isVerifyingOnline, walletAvailableKz, minimumOperatingBalanceKz, wallet, refreshWallet, areDocumentsApproved, incomingRequest, activeTrip, goOnline, goOffline } = useDriver();
  useFocusEffect(useCallback(() => {
    refreshWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));

  const belowMinimum = walletAvailableKz < minimumOperatingBalanceKz;
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
          <View style={styles.greetingCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingTitle}>Ola, Motorista!</Text>
              <Text style={styles.greetingSubtitle}>Esta pronto para receber novas corridas?</Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={goOnline} disabled={isBlocked}>
              <View style={[styles.onlinePillOffline, isBlocked && styles.onlinePillDisabled]}>
                <View style={[styles.onlineDotSmall, isBlocked && styles.onlineDotDisabled]} />
                <Text style={styles.onlinePillOfflineText}>Online</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.walletCardHome}>
            <View style={styles.walletIconBadge}>
              <Ionicons name="wallet" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.walletCardLabel}>Carteira</Text>
              <Text style={styles.walletCardValue}>{walletAvailableKz.toLocaleString('pt-AO')} Kz</Text>
              {belowMinimum ? (
                <View style={styles.walletMinRow}>
                  <Ionicons name="alert-circle" size={13} color={colors.danger} />
                  <Text style={styles.walletMinText}>Minimo necessario: {minimumOperatingBalanceKz.toLocaleString('pt-AO')} Kz</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity style={styles.topUpButtonHome} activeOpacity={0.85} onPress={() => navigation.getParent()?.navigate('WalletTab' as never)}>
              <Ionicons name="add-circle-outline" size={16} color={colors.textInverse} />
              <Text style={styles.topUpButtonHomeText}>Carregar{'\n'}Carteira</Text>
            </TouchableOpacity>
          </View>

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
              <View style={styles.statBoxHeader}>
                <Ionicons name="car-outline" size={16} color={colors.primary} />
                <Ionicons name="trending-up" size={13} color={colors.primary} />
              </View>
              <Text style={styles.statLabel}>Corridas</Text>
              <Text style={styles.statValue}>{wallet?.todayTrips ?? 0}</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statBoxHeader}>
                <Ionicons name="stats-chart" size={16} color={colors.primary} />
                <Ionicons name="trending-up" size={13} color={colors.primary} />
              </View>
              <Text style={styles.statLabel}>Ganhos hoje</Text>
              <Text style={styles.statValue}>{(wallet?.todayNetKz ?? 0).toLocaleString('pt-AO')} Kz</Text>
            </View>
          </View>

          {belowMinimum ? (
            <View style={styles.alertBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.alertBannerText}>
                Saldo atual {walletAvailableKz.toLocaleString('pt-AO')} Kz - minimo necessario {minimumOperatingBalanceKz.toLocaleString('pt-AO')} Kz. Carrega a carteira para continuar.
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          ) : null}

          <TouchableOpacity activeOpacity={0.85} onPress={goOnline} disabled={isBlocked}>
            <LinearGradient
              colors={isBlocked ? [colors.surfaceRaised, colors.surfaceRaised] : [colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.receiveButton}
            >
              <Ionicons name="play" size={18} color={colors.textInverse} />
              <Text style={styles.receiveButtonText}>Aceitar Corridas</Text>
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  offlineCard: { flex: 1, backgroundColor: colors.background },
  offlineCardContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.lg },
  greetingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.sm },
  greetingTitle: { ...typography.subtitle, color: colors.textPrimary },
  greetingSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  onlinePillOffline: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  onlinePillDisabled: { backgroundColor: colors.surfaceRaised },
  onlineDotSmall: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: spacing.xxs },
  onlineDotDisabled: { backgroundColor: colors.textMuted },
  onlinePillOfflineText: { ...typography.captionMedium, color: colors.primaryDark },
  walletCardHome: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.sm },
  walletIconBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  walletCardLabel: { ...typography.caption, color: colors.textSecondary },
  walletCardValue: { ...typography.h3, color: colors.textPrimary, marginTop: 1 },
  walletMinRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  walletMinText: { ...typography.tiny, color: colors.danger, marginLeft: 4 },
  topUpButtonHome: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  topUpButtonHomeText: { ...typography.tiny, color: colors.textInverse, textAlign: 'center' },
  statBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 4 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.dangerLight, borderRadius: radius.lg, padding: spacing.sm, marginBottom: spacing.sm },
  alertBannerText: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.xs, flex: 1, lineHeight: 18 },
  onlineToggle: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  onlineToggleDisabled: { backgroundColor: colors.surfaceRaised },
  onlineToggleTitle: { ...typography.subtitle, color: colors.textInverse },
  onlineToggleSubtitle: { ...typography.caption, color: 'rgba(11,18,16,0.75)', marginTop: 1 },
  warningBox: { flexDirection: 'row', backgroundColor: colors.dangerLight, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
  warningText: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.xs, flex: 1 },
  statsRow: { flexDirection: 'row', marginBottom: spacing.sm },
  statBox: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, padding: spacing.sm, marginRight: spacing.xs, alignItems: 'center', ...shadow.soft },
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



























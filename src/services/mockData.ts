import { ActiveDriverTrip, DriverProfile, DriverVehicle, EarningsSummary, IncomingTripRequest, WalletState } from '../types';

export const mockDriverProfile: DriverProfile = {
  id: 'driver-self',
  fullName: 'Carlos Fernandes',
  phone: '+244923000222',
  rating: 4.9,
  totalTrips: 1284,
  yearsOnPlatform: 2,
  languages: ['Portugues', 'Ingles'],
  categories: ['Conforto', 'Turismo'],
  accountStatus: 'active',
  ownershipType: 'owner',
  isOnline: false,
};

export const mockVehicle: DriverVehicle = {
  id: 'veh-driver-1',
  model: 'Toyota Corolla',
  plate: 'LD-23-GH',
  year: 2022,
  color: 'Branco',
  category: 'Economico',
  isApproved: true,
  odometerKm: 128420,
  nextMaintenanceKm: 129000,
  documents: [
    { id: 'doc-license', label: 'Carta de conducao', status: 'valid' },
    { id: 'doc-vehicle', label: 'Documento do veiculo', status: 'valid' },
    { id: 'doc-insurance', label: 'Seguro automovel', status: 'expiring_soon', expiresInDays: 7 },
    { id: 'doc-inspection', label: 'Inspecao tecnica', status: 'valid' },
  ],
};

export const mockEarnings: EarningsSummary = {
  todayKz: 28750,
  weekKz: 267800,
  monthKz: 1045000,
  todayTrips: 8,
  todayOnlineHours: 4.53,
};

export const mockWallet: WalletState = {
  availableKz: 8500,
  reservedKz: 1200,
  commissionsPaidTodayKz: 4250,
  minimumOperatingBalanceKz: 2000,
};

export const mockIncomingTrip: IncomingTripRequest = {
  id: 'req-1',
  originLabel: 'Talatona - Shopping',
  destinationLabel: 'Sambizanga, Luanda',
  distanceToPassengerKm: 2.1,
  tripDistanceKm: 14.8,
  tripDurationMinutes: 18,
  estimatedEarningsKz: 8800,
  estimatedCommissionKz: 1200,
  paymentMethod: 'cash',
  passengerCoordinates: { latitude: -8.9302, longitude: 13.1935 },
  destinationCoordinates: { latitude: -8.8137, longitude: 13.2302 },
};

export function buildActiveTripFromRequest(request: IncomingTripRequest): ActiveDriverTrip {
  return {
    id: 'trip-' + Date.now(),
    passengerName: 'Joao Manuel',
    passengerRating: 4.9,
    passengerTotalTrips: 1284,
    boardingCode: Math.floor(1000 + Math.random() * 9000).toString(),
    status: 'heading_to_passenger',
    originCoordinates: request.passengerCoordinates,
    destinationCoordinates: request.destinationCoordinates,
    destinationLabel: request.destinationLabel,
    etaMinutes: request.tripDurationMinutes,
    distanceKm: request.tripDistanceKm,
    paymentMethod: request.paymentMethod,
    fareKz: request.estimatedEarningsKz,
    commissionKz: request.estimatedCommissionKz,
    netEarningsKz: request.estimatedEarningsKz - request.estimatedCommissionKz,
  };
}

import { DriverTripHistoryEntry, ScheduledTrip } from '../types';

/** Viagens agendadas (secao 50 do documento): o motorista pode aceitar de acordo com as regras do sistema. */
export const mockScheduledTrips: ScheduledTrip[] = [
  {
    id: 'sched-1',
    dateIso: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString(),
    originLabel: 'Talatona',
    destinationLabel: 'Aeroporto 4 de Fevereiro',
    distanceKm: 12.4,
    estimatedEarningsKz: 8500,
    isAccepted: false,
  },
  {
    id: 'sched-2',
    dateIso: new Date(Date.now() + 40 * 60 * 60 * 1000).toISOString(),
    originLabel: 'Kilamba',
    destinationLabel: 'Maianga',
    distanceKm: 18.1,
    estimatedEarningsKz: 11200,
    isAccepted: false,
  },
];

export const mockTripHistory: DriverTripHistoryEntry[] = [
  { id: 'h-8233', dateIso: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), originLabel: 'Maianga', destinationLabel: 'Ilha de Luanda', distanceKm: 9.2, fareKz: 7500, netEarningsKz: 6600, passengerRating: 5, status: 'completed' },
  { id: 'h-8232', dateIso: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), originLabel: 'Talatona', destinationLabel: 'Sambizanga', distanceKm: 14.8, fareKz: 10000, netEarningsKz: 8800, passengerRating: 4.8, status: 'completed' },
  { id: 'h-8231', dateIso: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), originLabel: 'Viana', destinationLabel: 'Cazenga', distanceKm: 6.5, fareKz: 8000, netEarningsKz: 7040, passengerRating: 4.9, status: 'completed' },
  { id: 'h-8228', dateIso: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), originLabel: 'Kilamba', destinationLabel: 'Talatona', distanceKm: 5.1, fareKz: 6200, netEarningsKz: 0, status: 'cancelled' },
];

import { DriverChallenge, DriverDailyGoal } from '../types';

/** Meta diaria (secao 47): progresso sem obrigar o motorista a ficar online. */
export const mockDailyGoal: DriverDailyGoal = {
  targetKz: 50000,
  achievedKz: 41000,
};

/** Desafios ativos (secao 46): calculados automaticamente. */
export const mockChallenges: DriverChallenge[] = [
  {
    id: 'ch-1',
    title: 'Desafio da semana',
    description: 'Completa 40 corridas esta semana',
    progressCount: 27,
    targetCount: 40,
    rewardKz: 20000,
    expiresInDays: 3,
  },
  {
    id: 'ch-2',
    title: 'Madrugador',
    description: 'Faz 5 corridas antes das 8h',
    progressCount: 2,
    targetCount: 5,
    rewardKz: 5000,
    expiresInDays: 1,
  },
  {
    id: 'ch-3',
    title: 'Fim de semana forte',
    description: 'Fica online 10h no sabado e domingo',
    progressCount: 10,
    targetCount: 10,
    rewardKz: 8000,
    expiresInDays: 0,
  },
];

import { DriverDocumentSlot } from '../types';

/**
 * Documentos obrigatorios para o motorista ficar operacional (secoes 4, 5 e 60
 * do documento). Nunca auto-aprova: cada submissao fica "pending" ate revisao.
 */
export const mockDocumentSlots: DriverDocumentSlot[] = [
  { id: 'doc-bi-front', label: 'Bilhete de identidade (frente)', description: 'Foto nitida, sem reflexos, dados legiveis.', submissionStatus: 'approved' },
  { id: 'doc-bi-back', label: 'Bilhete de identidade (verso)', description: 'Foto nitida do verso do documento.', submissionStatus: 'approved' },
  { id: 'doc-selfie', label: 'Selfie de verificacao', description: 'Foto do rosto, com boa iluminacao, sem oculos escuros.', submissionStatus: 'pending' },
  { id: 'doc-license', label: 'Carta de conducao', description: 'Documento valido, sem rasuras.', submissionStatus: 'rejected', rejectionReason: 'Imagem desfocada - nao foi possivel confirmar a validade.' },
  { id: 'doc-vehicle-reg', label: 'Documento do veiculo', description: 'Livrete ou documento equivalente, atualizado.', submissionStatus: 'not_submitted' },
  { id: 'doc-insurance', label: 'Seguro automovel', description: 'Apolice valida, com data de validade visivel.', submissionStatus: 'not_submitted' },
];

import { DemandZone } from '../components/home/DriverMapView';

/** Zonas de procura (secao 48-49): media da regiao, nao posicao de nenhum motorista. */
export const mockDemandZones: DemandZone[] = [
  { latitude: -8.9302, longitude: 13.1935, radiusMeters: 1400, intensity: 'high' },
  { latitude: -8.8584, longitude: 13.2312, radiusMeters: 1200, intensity: 'high' },
  { latitude: -8.8137, longitude: 13.2302, radiusMeters: 1000, intensity: 'medium' },
  { latitude: -8.9975, longitude: 13.2564, radiusMeters: 1100, intensity: 'medium' },
  { latitude: -8.9038, longitude: 13.3703, radiusMeters: 1300, intensity: 'normal' },
];

export const mockDemandForecast = 'A procura em Talatona e no Aeroporto normalmente aumenta entre as 17h30 e as 19h30.';

import { LostItemReport, TourismEligibility } from '../types';

export const mockLostItems: LostItemReport[] = [
  { id: 'li-1', category: 'phone', description: 'Smartphone preto encontrado no banco traseiro.', tripRef: '#8232', dateIso: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), status: 'reported' },
  { id: 'li-2', category: 'documents', description: 'Carteira com bilhete de identidade.', tripRef: '#8228', dateIso: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), status: 'returned' },
];

/** Perfil Turismo (secao 52): so ativa se todos os requisitos estiverem cumpridos. */
export const mockTourismEligibility: TourismEligibility = {
  hasTrainingCompleted: true,
  languages: ['Portugues', 'Ingles'],
  minimumRating: 4.7,
  currentRating: mockDriverProfile.rating,
  isActive: mockDriverProfile.categories.includes('Turismo'),
};

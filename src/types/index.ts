export type Coordinates = { latitude: number; longitude: number };

export type DriverAccountStatus = 'active' | 'pending' | 'restricted' | 'blocked';
export type DriverOwnershipType = 'owner' | 'third_party_vehicle' | 'fleet';

export interface DriverProfile {
  id: string;
  fullName: string;
  phone: string;
  photoUrl?: string;
  rating: number;
  totalTrips: number;
  yearsOnPlatform: number;
  languages: string[];
  categories: string[];
  accountStatus: DriverAccountStatus;
  ownershipType: DriverOwnershipType;
  isOnline: boolean;
}

export type DocumentStatus = 'valid' | 'expiring_soon' | 'expired';

export interface DriverDocument {
  id: string;
  label: string;
  status: DocumentStatus;
  expiresInDays?: number;
}

export interface DriverVehicle {
  id: string;
  model: string;
  plate: string;
  year: number;
  color: string;
  category: string;
  isApproved: boolean;
  odometerKm: number;
  nextMaintenanceKm: number;
  documents: DriverDocument[];
}

export type IncomingTripPaymentMethod = 'cash' | 'digital' | 'wallet';

export interface IncomingTripRequest {
  id: string;
  originLabel: string;
  destinationLabel: string;
  distanceToPassengerKm: number;
  tripDistanceKm: number;
  tripDurationMinutes: number;
  estimatedEarningsKz: number;
  estimatedCommissionKz: number;
  paymentMethod: IncomingTripPaymentMethod;
  passengerCoordinates: Coordinates;
  destinationCoordinates: Coordinates;
}

export type DriverTripStatus =
  | 'heading_to_passenger'
  | 'arrived'
  | 'boarding'
  | 'in_progress'
  | 'completed';

export interface ActiveDriverTrip {
  id: string;
  passengerName: string;
  passengerRating: number;
  passengerTotalTrips: number;
  boardingCode: string;
  status: DriverTripStatus;
  originCoordinates: Coordinates;
  destinationCoordinates: Coordinates;
  destinationLabel: string;
  etaMinutes: number;
  distanceKm: number;
  paymentMethod: IncomingTripPaymentMethod;
  fareKz: number;
  commissionKz: number;
  netEarningsKz: number;
  tipKz?: number;
}

export interface EarningsSummary {
  todayKz: number;
  weekKz: number;
  monthKz: number;
  todayTrips: number;
  todayOnlineHours: number;
}

export interface WalletState {
  availableKz: number;
  reservedKz: number;
  commissionsPaidTodayKz: number;
  minimumOperatingBalanceKz: number;
}

export interface ScheduledTrip {
  id: string;
  dateIso: string;
  originLabel: string;
  destinationLabel: string;
  distanceKm: number;
  estimatedEarningsKz: number;
  isAccepted: boolean;
}

export type TripHistoryStatus = 'completed' | 'cancelled';

export interface DriverTripHistoryEntry {
  id: string;
  dateIso: string;
  originLabel: string;
  destinationLabel: string;
  distanceKm: number;
  fareKz: number;
  netEarningsKz: number;
  passengerRating?: number;
  status: TripHistoryStatus;
}

export interface DriverDailyGoal {
  targetKz: number;
  achievedKz: number;
}

export interface DriverChallenge {
  id: string;
  title: string;
  description: string;
  progressCount: number;
  targetCount: number;
  rewardKz: number;
  expiresInDays: number;
}

// Fluxo de submissao/aprovacao de identidade e documentos - nunca auto-aprova,
// fica "pending" ate um revisor confirmar (mesma regra aplicada no backend
// do app do passageiro para a verificacao de identidade).
export type DocumentSubmissionStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface DriverDocumentSlot {
  id: string;
  label: string;
  description: string;
  submissionStatus: DocumentSubmissionStatus;
  rejectionReason?: string;
}

// Objetos perdidos (secao 54): motorista regista o achado, ligado ou nao a uma viagem.
export type LostItemCategory = 'phone' | 'wallet' | 'documents' | 'clothing' | 'other';
export type LostItemStatus = 'reported' | 'matched' | 'returned';

export interface LostItemReport {
  id: string;
  category: LostItemCategory;
  description: string;
  tripRef?: string;
  dateIso: string;
  status: LostItemStatus;
}

// Perfil Turismo (secao 52-53): requisitos de elegibilidade.
export interface TourismEligibility {
  hasTrainingCompleted: boolean;
  languages: string[];
  minimumRating: number;
  currentRating: number;
  isActive: boolean;
}

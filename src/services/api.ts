import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/env';

const TOKEN_KEY = '@angotour_driver/access_token';

let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      'Nao foi possivel ligar ao servidor. Confirma que o backend esta a correr e que o IP em src/constants/env.ts esta correto.',
      0,
    );
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const message = data?.message ?? `Erro ${response.status}`;
    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, response.status);
  }

  return data as T;
}

// --- Driver Auth ---
export interface DriverAuthResponse {
  accessToken: string;
  isNewDriver: boolean;
  driverId?: string;
}

export const driverAuthApi = {
  requestOtp: (phone: string) => request<{ message: string }>('/driver-auth/otp/request', { method: 'POST', body: { phone } }),
  verifyOtp: (phone: string, code: string) => request<DriverAuthResponse>('/driver-auth/otp/verify', { method: 'POST', body: { phone, code } }),
  register: (data: { phone: string; fullName: string }) =>
    request<DriverAuthResponse>('/driver-auth/register', { method: 'POST', body: data }),
};

// --- Drivers (localizacao e estado online) ---
export const driversApi = {
  updateLocation: (latitude: number, longitude: number) =>
    request<void>('/drivers/me/location', { method: 'PATCH', body: { latitude, longitude }, auth: true }),
  setStatus: (status: 'online' | 'offline' | 'on_trip') =>
    request<unknown>('/drivers/me/status', { method: 'PATCH', body: { status }, auth: true }),
};

// --- Viagens do motorista: o codigo de embarque e sempre comparado no servidor ---
export interface DriverTripView {
  id: string;
  status: string;
  passengerName: string;
  origin: { label: string; address: string; latitude: number; longitude: number };
  destination: { label: string; address: string; latitude: number; longitude: number };
  distanceKm: number;
  durationMinutes: number;
  distanceToPassengerKm: number | null;
  priceKz: number;
  commissionKz: number;
  zoneIncentiveKz: number;
  netEarningsKz: number;
  paymentMethodType: string;
  boardingConfirmed: boolean;
}

export const driverTripsApi = {
  active: () => request<{ trip: DriverTripView | null }>('/driver/trips/active', { auth: true }),
  accept: (id: string) => request<{ ok: boolean; status: string }>(`/driver/trips/${id}/accept`, { method: 'PATCH', auth: true }),
  decline: (id: string) => request<{ reassigned: boolean }>(`/driver/trips/${id}/decline`, { method: 'PATCH', auth: true }),
  confirmBoarding: (id: string, code: string) =>
    request<{ ok: boolean }>(`/driver/trips/${id}/confirm-boarding`, { method: 'POST', body: { code }, auth: true }),
  start: (id: string) => request<{ ok: boolean; status: string }>(`/driver/trips/${id}/start`, { method: 'PATCH', auth: true }),
  complete: (id: string) => request<{ ok: boolean; netEarningsKz: number }>(`/driver/trips/${id}/complete`, { method: 'PATCH', auth: true }),
};


// --- Carteira do motorista (saldo, reserva e liquidacao de comissao no servidor) ---
export interface DriverWalletEntryView {
  id: string;
  kind: 'topup' | 'commission' | 'zone_incentive';
  status: string;
  amountKz: number;
  reference: string | null;
  tripId: string | null;
  createdAt: string;
}

export interface DriverWalletSummary {
  balanceKz: number;
  reservedKz: number;
  availableKz: number;
  minimumOperatingBalanceKz: number;
  todayGrossKz: number;
  todayTrips: number;
  commissionsTodayKz: number;
  todayDistanceKm: number;
  zoneIncentivesTodayKz: number;
  todayNetKz: number;
  estimatedFuelCostKz: number;
  todayNetAfterFuelKz: number;
  entries: DriverWalletEntryView[];
}

// --- Reservas: o motorista reserva com antecedencia; a atribuicao real e feita pelo servidor perto da hora ---
export interface ScheduledTripView {
  id: string;
  dateIso: string;
  originLabel: string;
  destinationLabel: string;
  estimatedEarningsKz: number;
  zoneIncentiveKz: number;
  distanceKm: number;
  isAccepted: boolean;
}

export const driverReservationsApi = {
  list: () => request<ScheduledTripView[]>('/driver/trips/scheduled', { auth: true }),
  reserve: (id: string) => request<{ ok: boolean }>(`/driver/trips/${id}/reserve`, { method: 'POST', auth: true }),
  release: (id: string) => request<{ ok: boolean }>(`/driver/trips/${id}/reserve`, { method: 'DELETE', auth: true }),
};

export const driverWalletApi = {
  summary: () => request<DriverWalletSummary>('/driver/wallet', { auth: true }),
  startTopUp: (amountKz: number, method?: string) =>
    request<{ id: string; reference: string; amountKz: number; status: string }>('/driver/wallet/topups', {
      method: 'POST', body: { amountKz, method }, auth: true,
    }),
  confirmTopUp: (id: string) => request<unknown>(`/driver/wallet/topups/${id}/confirm`, { method: 'POST', auth: true }),
};

// --- Documentos do motorista: submeter nunca aprova, so o servidor/revisor aprova ---
export type DriverDocumentServerType =
  | 'bi_front' | 'bi_back' | 'selfie' | 'license' | 'vehicle_registration' | 'insurance';

export interface DriverDocumentView {
  type: DriverDocumentServerType;
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  updatedAt: string | null;
}

export const driverDocumentsApi = {
  list: () => request<DriverDocumentView[]>('/driver/documents', { auth: true }),
  submit: (type: DriverDocumentServerType, imageBase64: string) =>
    request<DriverDocumentView>(`/driver/documents/${type}`, { method: 'POST', body: { imageBase64 }, auth: true }),
};

// --- Veiculo do motorista: cada alteracao volta a "pending" ate o admin aprovar ---
export interface DriverVehicleView {
  id: string;
  model: string;
  plate: string;
  color: string;
  categoryId: string;
  capacity: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
}

export const driverVehicleApi = {
  get: () => request<{ vehicle: DriverVehicleView | null }>('/driver/vehicle', { auth: true }),
  save: (body: { model: string; plate: string; color: string; categoryId: string; capacity: number }) =>
    request<{ vehicle: DriverVehicleView }>('/driver/vehicle', { method: 'POST', body, auth: true }),
};

// --- Seguranca do motorista: alerta com motivo, viagem e posicao ---
export const driverSafetyApi = {
  alert: (body: { category: string; tripId?: string; latitude?: number; longitude?: number }) =>
    request<{ caseNumber: string; severity: string; status: string }>('/driver/safety/alert', { method: 'POST', body, auth: true }),
};

// --- Servicos mensais do motorista (ida/volta de cada contrato AngoTour Mensal) ---
export interface MonthlyExecutionView {
  id: string;
  date: string; // AAAA-MM-DD
  direction: 'ida' | 'volta';
  scheduledTime: string;
  status: 'agendada' | 'em_curso' | 'concluida' | 'cancelada';
  startedAt: string | null;
  completedAt: string | null;
  originLabel: string;
  destinationLabel: string;
  passengerCount: number;
  passengerFirstName: string | null;
}

export const driverMonthlyApi = {
  list: () => request<MonthlyExecutionView[]>('/driver/monthly/executions', { auth: true }),
  start: (id: string) => request<unknown>(`/driver/monthly/executions/${id}/start`, { method: 'POST', auth: true }),
  complete: (id: string) => request<unknown>(`/driver/monthly/executions/${id}/complete`, { method: 'POST', auth: true }),
};

// --- Perfil, ganhos por periodo e historico (dados reais) ---
export interface DriverProfileView {
  id: string; fullName: string; phone: string; rating: number; status: string; isVerified: boolean;
  memberSince: string; tripsCompleted: number; tripsCancelled: number;
}
export interface EarningsPeriod { grossKz: number; commissionKz: number; netKz: number; trips: number }
export interface DriverHistoryItem {
  id: string; status: string; priceKz: number; distanceKm: number; createdAt: string; completedAt: string | null;
  originLabel: string | null; destinationLabel: string | null;
}
export const driverProfileApi = {
  me: () => request<DriverProfileView>('/driver/profile', { auth: true }),
  earnings: () => request<Record<'today' | 'week' | 'month', EarningsPeriod>>('/driver/profile/earnings', { auth: true }),
  history: () => request<DriverHistoryItem[]>('/driver/profile/history', { auth: true }),
};

// --- Chat motorista-passageiro (so participantes da viagem) ---
export interface ChatMessageView { id: string; senderRole: 'passenger' | 'driver'; body: string; createdAt: string; fromMe: boolean }
export interface ChatThreadView { messages: ChatMessageView[]; canSend: boolean }
export const driverChatApi = {
  list: (tripId: string) => request<ChatThreadView>(`/driver/chat/trips/${tripId}/messages`, { auth: true }),
  send: (tripId: string, body: string) =>
    request<ChatMessageView>(`/driver/chat/trips/${tripId}/messages`, { method: 'POST', body: { body }, auth: true }),
};

// --- Extras do motorista: objetos perdidos, procura, incentivos e perfil turismo ---
export interface LostItemView { id: string; category: 'phone' | 'wallet' | 'documents' | 'clothing' | 'other'; description: string; tripRef?: string; dateIso: string; status: 'reported' | 'matched' | 'returned' }
export interface DemandZoneView { latitude: number; longitude: number; radiusMeters: number; intensity: 'high' | 'medium' | 'normal' }
export interface IncentivesView {
  dailyGoal: { achievedKz: number; targetKz: number };
  challenges: { id: string; title: string; description: string; rewardKz: number; progressCount: number; targetCount: number; expiresInDays: number }[];
}
export interface TourismView {
  hasTrainingCompleted: boolean; languages: string[]; minimumRating: number; currentRating: number;
  isEligible: boolean; isActive: boolean; availableLanguages: string[];
}
export const driverExtrasApi = {
  lostItems: () => request<LostItemView[]>('/driver/extras/lost-items', { auth: true }),
  reportLostItem: (body: { category: string; description: string }) => request<{ caseNumber: string }>('/driver/extras/lost-items', { method: 'POST', body, auth: true }),
  demand: () => request<{ zones: DemandZoneView[]; forecast: string | null }>('/driver/extras/demand', { auth: true }),
  incentives: () => request<IncentivesView>('/driver/extras/incentives', { auth: true }),
  tourism: () => request<TourismView>('/driver/extras/tourism', { auth: true }),
  setTourismLanguages: (languages: string[]) => request<TourismView>('/driver/extras/tourism/languages', { method: 'POST', body: { languages }, auth: true }),
  setTourismActive: (active: boolean) => request<TourismView>('/driver/extras/tourism/active', { method: 'POST', body: { active }, auth: true }),
};

// --- Avaliacoes recebidas e suporte ---
export interface RatingsView {
  count: number; average: number;
  distribution: { stars: number; count: number }[];
  recent: { stars: number; comment: string; createdAt: string }[];
}
export interface SupportCaseView { id: string; caseNumber: string; category: string; description: string; status: string; createdAt: string }
export const driverSupportApi = {
  ratings: () => request<RatingsView>('/driver/extras/ratings', { auth: true }),
  list: () => request<SupportCaseView[]>('/driver/extras/support', { auth: true }),
  create: (subject: string, description: string) =>
    request<{ caseNumber: string }>('/driver/extras/support', { method: 'POST', body: { subject, description }, auth: true }),
};

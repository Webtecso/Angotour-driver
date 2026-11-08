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

export const driverWalletApi = {
  summary: () => request<DriverWalletSummary>('/driver/wallet', { auth: true }),
  startTopUp: (amountKz: number) =>
    request<{ id: string; reference: string; amountKz: number; status: string }>('/driver/wallet/topups', {
      method: 'POST', body: { amountKz }, auth: true,
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

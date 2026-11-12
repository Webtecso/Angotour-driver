import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { ActiveDriverTrip, DriverDocumentSlot, DriverTripStatus, IncomingTripRequest } from '../types';
import { DOCUMENT_SLOTS } from '../constants/documentSlots';
import { io, Socket } from 'socket.io-client';
import { driversApi, driverTripsApi, driverWalletApi, driverDocumentsApi, DriverDocumentServerType, DriverTripView, DriverWalletSummary } from '../services/api';
import { registerForPushNotificationsAsync } from '../services/pushNotifications';
import { API_BASE_URL } from '../constants/env';
import { useDriverAuth } from './DriverAuthContext';

interface DriverContextValue {
  isOnline: boolean;
  isVerifyingOnline: boolean;
  walletAvailableKz: number;
  walletReservedKz: number;
  minimumOperatingBalanceKz: number;
  wallet: DriverWalletSummary | null;
  refreshWallet: () => Promise<void>;
  incomingRequest: IncomingTripRequest | null;
  activeTrip: ActiveDriverTrip | null;
  goOnline: () => void;
  goOffline: () => void;
  acceptIncomingTrip: () => void;
  declineIncomingTrip: () => void;
  markArrived: () => void;
  confirmBoarding: (enteredCode: string) => Promise<{ ok: boolean; message?: string }>;
  startTrip: () => Promise<void>;
  completeTrip: () => Promise<void>;
  clearActiveTrip: () => void;
  documentSlots: DriverDocumentSlot[];
  areDocumentsApproved: boolean;
  submitDocument: (id: string, imageBase64: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

// Liga os documentos do ecra aos tipos que o servidor conhece.
const DOC_ID_TO_TYPE: Record<string, DriverDocumentServerType> = {
  'doc-bi-front': 'bi_front',
  'doc-bi-back': 'bi_back',
  'doc-selfie': 'selfie',
  'doc-license': 'license',
  'doc-vehicle-reg': 'vehicle_registration',
  'doc-insurance': 'insurance',
};

const DriverContext = createContext<DriverContextValue | undefined>(undefined);

const LOCATION_UPDATE_INTERVAL_MS = 10000;
const ACTIVE_TRIP_POLL_INTERVAL_MS = 5000;

/** Converte a vista do backend (sem boardingCode) num pedido para o ecra de "nova corrida". */
function toIncomingRequest(view: DriverTripView): IncomingTripRequest {
  return {
    id: view.id,
    originLabel: view.origin.label || view.origin.address,
    destinationLabel: view.destination.label || view.destination.address,
    distanceToPassengerKm: view.distanceToPassengerKm ?? 0,
    tripDistanceKm: view.distanceKm,
    tripDurationMinutes: view.durationMinutes,
    estimatedEarningsKz: view.priceKz,
    estimatedCommissionKz: view.commissionKz,
    zoneIncentiveKz: view.zoneIncentiveKz ?? 0,
    paymentMethod: (view.paymentMethodType as IncomingTripRequest['paymentMethod']) ?? 'wallet',
    passengerCoordinates: { latitude: view.origin.latitude, longitude: view.origin.longitude },
    destinationCoordinates: { latitude: view.destination.latitude, longitude: view.destination.longitude },
  };
}

/** Viagem ativa a partir do pedido aceite. Nada inventado: o codigo de embarque nunca chega ao motorista. */
function toActiveTrip(req: IncomingTripRequest, passengerName: string): ActiveDriverTrip {
  return {
    id: req.id,
    passengerName,
    passengerRating: 0,
    passengerTotalTrips: 0,
    boardingCode: '',
    status: 'heading_to_passenger',
    originCoordinates: req.passengerCoordinates,
    destinationCoordinates: req.destinationCoordinates,
    destinationLabel: req.destinationLabel,
    etaMinutes: req.tripDurationMinutes,
    distanceKm: req.tripDistanceKm,
    paymentMethod: req.paymentMethod,
    fareKz: req.estimatedEarningsKz,
    commissionKz: req.estimatedCommissionKz,
    netEarningsKz: req.estimatedEarningsKz - req.estimatedCommissionKz,
  };
}

/** Estado local equivalente ao estado do servidor, para retomar uma corrida depois de reabrir a app. */
function resumeStatus(view: DriverTripView): DriverTripStatus {
  if (view.status === 'in_progress') return 'in_progress';
  if (view.boardingConfirmed) return 'boarding';
  return 'heading_to_passenger';
}

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(false);
  const [isVerifyingOnline, setIsVerifyingOnline] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState<IncomingTripRequest | null>(null);
  const [activeTrip, setActiveTrip] = useState<ActiveDriverTrip | null>(null);
  const locationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeTripPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeTripRef = useRef<ActiveDriverTrip | null>(null);
  const { session } = useDriverAuth();
  const driverId = session?.driverId ?? '';

  const [wallet, setWallet] = useState<DriverWalletSummary | null>(null);
  const walletAvailableKz = wallet?.availableKz ?? 0;
  // O minimo vem do servidor (GET /driver/wallet); 0 ate carregar.
  const minimumOperatingBalanceKz = wallet?.minimumOperatingBalanceKz ?? 0;

  const refreshWallet = async () => {
    try {
      setWallet(await driverWalletApi.summary());
    } catch {
      // sem rede: mantem o ultimo valor conhecido
    }
  };

  useEffect(() => {
    if (driverId) {
      refreshWallet();
      refreshDocuments();
      registerForPushNotificationsAsync()
        .then((token) => { if (token) driversApi.setPushToken(token).catch(() => {}); })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  // Cada submissao fica "pending" ate revisao - nunca auto-aprova.
  const [documentSlots, setDocumentSlots] = useState<DriverDocumentSlot[]>(DOCUMENT_SLOTS);
  const areDocumentsApproved = documentSlots.every((d) => d.submissionStatus === 'approved');

  const refreshDocuments = async () => {
    try {
      const list = await driverDocumentsApi.list();
      setDocumentSlots((prev) =>
        prev.map((slot) => {
          const server = list.find((d) => d.type === DOC_ID_TO_TYPE[slot.id]);
          if (!server) return slot;
          return { ...slot, submissionStatus: server.status, rejectionReason: server.rejectionReason ?? undefined };
        })
      );
    } catch {
      // sem rede: mantem o ultimo estado conhecido
    }
  };

  const submitDocument = async (id: string, imageBase64: string) => {
    const type = DOC_ID_TO_TYPE[id];
    if (!type) throw new Error('Tipo de documento desconhecido.');
    const updated = await driverDocumentsApi.submit(type, imageBase64);
    setDocumentSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, submissionStatus: updated.status, rejectionReason: updated.rejectionReason ?? undefined } : s))
    );
  };

  useEffect(() => {
    activeTripRef.current = activeTrip;
  }, [activeTrip]);

  const sendLocationOnce = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        if (req.status !== 'granted') return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await driversApi.updateLocation(position.coords.latitude, position.coords.longitude);
      const activeTripId = activeTripRef.current?.id;
      if (activeTripId && socketRef.current?.connected) {
        socketRef.current.emit('driver_location', {
          tripId: activeTripId,
          driverId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      }
    } catch {
      // falha de localizacao/rede nao deve derrubar o estado online
    }
  };

  useEffect(() => {
    if (!isOnline || !driverId) return;
    const socket = io(API_BASE_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join_driver_room', driverId));
    socket.on('trip_assigned', (p: any) => {
      setIncomingRequest({
        id: p.tripId,
        originLabel: p.originLabel,
        destinationLabel: p.destinationLabel,
        distanceToPassengerKm: p.distanceToPassengerKm,
        tripDistanceKm: p.tripDistanceKm,
        tripDurationMinutes: p.tripDurationMinutes,
        estimatedEarningsKz: p.estimatedEarningsKz,
        estimatedCommissionKz: p.estimatedCommissionKz,
        zoneIncentiveKz: p.zoneIncentiveKz ?? 0,
        paymentMethod: p.paymentMethod,
        passengerCoordinates: p.passengerCoordinates,
        destinationCoordinates: p.destinationCoordinates,
      });
    });
    return () => {
      socket.emit('leave_driver_room', driverId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOnline, driverId]);

  useEffect(() => {
    if (isOnline) {
      sendLocationOnce();
      locationTimerRef.current = setInterval(sendLocationOnce, LOCATION_UPDATE_INTERVAL_MS);
    } else if (locationTimerRef.current) {
      clearInterval(locationTimerRef.current);
      locationTimerRef.current = null;
    }
    return () => {
      if (locationTimerRef.current) clearInterval(locationTimerRef.current);
    };
  }, [isOnline]);

  // Rede de seguranca: se o socket perder um "trip_assigned", esta consulta apanha o pedido.
  useEffect(() => {
    if (!isOnline) {
      if (activeTripPollRef.current) {
        clearInterval(activeTripPollRef.current);
        activeTripPollRef.current = null;
      }
      return;
    }

    const poll = async () => {
      if (incomingRequest || activeTrip) return;
      try {
        const { trip } = await driverTripsApi.active();
        if (trip && trip.status === 'driver_assigned') {
          setIncomingRequest(toIncomingRequest(trip));
        } else if (trip && (trip.status === 'driver_arriving' || trip.status === 'in_progress')) {
          // resumeActive: corrida ja aceite que a app perdeu (fecho ou reinicio)
          setActiveTrip({ ...toActiveTrip(toIncomingRequest(trip), trip.passengerName || 'Passageiro'), status: resumeStatus(trip), netEarningsKz: trip.netEarningsKz });
          driversApi.setStatus('on_trip').catch(() => {});
        }
      } catch {
        // sem rede ou sem viagem - tenta outra vez no proximo ciclo
      }
    };

    poll();
    activeTripPollRef.current = setInterval(poll, ACTIVE_TRIP_POLL_INTERVAL_MS);
    return () => {
      if (activeTripPollRef.current) clearInterval(activeTripPollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, incomingRequest, activeTrip]);

  // O servidor decide: sem saldo minimo, documentos ou veiculo aprovado, recusa e o motorista nao fica online.
  const goOnline = async () => {
    setIsVerifyingOnline(true);
    try {
      await driversApi.setStatus('online');
      setIsOnline(true);
    } catch (e) {
      refreshWallet();
      Alert.alert('Nao foi possivel ficar online', (e as Error).message);
    } finally {
      setIsVerifyingOnline(false);
    }
  };

  // Se o servidor deixar de ter esta viagem activa (cancelada pelo passageiro, ou reserva
  // reatribuida por falta), a app deixa de mostrar uma viagem que ja nao existe.
  useEffect(() => {
    const id = activeTrip?.id;
    if (!id || id.startsWith('trip-') || activeTrip?.status === 'completed') return;
    let alive = true;
    const check = async () => {
      try {
        const { trip } = await driverTripsApi.active();
        if (!alive || trip) return;
        setActiveTrip(null);
        refreshWallet();
        Alert.alert('Viagem terminada', 'Esta viagem ja nao esta atribuida a ti (foi cancelada ou reatribuida).');
      } catch {
        // sem rede: tenta no ciclo seguinte
      }
    };
    const timer = setInterval(check, 10000);
    return () => { alive = false; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrip?.id, activeTrip?.status]);

  const goOffline = () => {
    setIsOnline(false);
    setIncomingRequest(null);
    driversApi.setStatus('offline').catch(() => {});
  };

  const acceptingRef = useRef(false);
  // So abre a viagem depois de o servidor a confirmar. Se ja foi tomada ou cancelada, avisa.
  const acceptIncomingTrip = async () => {
    if (!incomingRequest || acceptingRef.current) return;
    acceptingRef.current = true;
    const req = incomingRequest;
    try {
      await driverTripsApi.accept(req.id);
      let passengerName = 'Passageiro';
      try {
        const { trip } = await driverTripsApi.active();
        if (trip?.passengerName) passengerName = trip.passengerName;
      } catch {
        // o nome e so apresentacao
      }
      setActiveTrip(toActiveTrip(req, passengerName));
      // destino real apos aceitar: antes disto o motorista so conhece a zona
      driverTripsApi.active().then(({ trip }) => {
        if (!trip || trip.id !== req.id) return;
        setActiveTrip((prev) => prev ? { ...prev, destinationLabel: trip.destination.label || trip.destination.address, destinationCoordinates: { latitude: trip.destination.latitude, longitude: trip.destination.longitude } } : prev);
      }).catch(() => {});
      setIncomingRequest(null);
      driversApi.setStatus('on_trip').catch(() => {});
      refreshWallet();
    } catch (e) {
      setIncomingRequest(null);
      Alert.alert('Corrida indisponivel', (e as Error).message);
    } finally {
      acceptingRef.current = false;
    }
  };

  const declineIncomingTrip = () => {
    if (incomingRequest) driverTripsApi.decline(incomingRequest.id).catch(() => {});
    setIncomingRequest(null);
  };

  const setTripStatus = (status: DriverTripStatus) => {
    setActiveTrip((trip) => (trip ? { ...trip, status } : trip));
  };

  const markArrived = () => setTripStatus('arrived');

  /** O codigo e sempre comparado no servidor - o motorista nunca o recebe. */
  const confirmBoarding = async (enteredCode: string): Promise<{ ok: boolean; message?: string }> => {
    if (!activeTrip) return { ok: false };
    try {
      await driverTripsApi.confirmBoarding(activeTrip.id, enteredCode);
      setTripStatus('boarding');
      return { ok: true };
    } catch (e) {
      // O servidor distingue codigo errado, limite de tentativas e distancia ao ponto de recolha.
      return { ok: false, message: (e as Error).message };
    }
  };

  const startTrip = async () => {
    if (!activeTrip) return;
    try {
      await driverTripsApi.start(activeTrip.id);
    } catch (e) {
      Alert.alert('Nao foi possivel iniciar a viagem', (e as Error).message);
      return;
    }
    setTripStatus('in_progress');
  };

  const completeTrip = async () => {
    if (!activeTrip) return;
    try {
      const result = await driverTripsApi.complete(activeTrip.id);
      setActiveTrip((trip) => (trip ? { ...trip, netEarningsKz: result.netEarningsKz } : trip));
    } catch (e) {
      Alert.alert('Nao foi possivel finalizar a viagem', (e as Error).message + '\n\nVerifica a ligacao e tenta outra vez.');
      return;
    }
    setTripStatus('completed');
    refreshWallet();
    if (isOnline) driversApi.setStatus('online').catch(() => {});
  };

  const clearActiveTrip = () => {
    setActiveTrip(null);
  };

  const value = useMemo(
    () => ({
      isOnline,
      isVerifyingOnline,
      walletAvailableKz,
      walletReservedKz: wallet?.reservedKz ?? 0,
      minimumOperatingBalanceKz,
      wallet,
      refreshWallet,
      incomingRequest,
      activeTrip,
      goOnline,
      goOffline,
      acceptIncomingTrip,
      declineIncomingTrip,
      markArrived,
      confirmBoarding,
      startTrip,
      completeTrip,
      clearActiveTrip,
      documentSlots,
      areDocumentsApproved,
      submitDocument,
      refreshDocuments,
    }),
    [isOnline, isVerifyingOnline, walletAvailableKz, wallet, incomingRequest, activeTrip, documentSlots]
  );

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}

export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error('useDriver deve ser usado dentro de um <DriverProvider>');
  return ctx;
}
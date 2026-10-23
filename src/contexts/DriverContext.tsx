import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { ActiveDriverTrip, DriverDocumentSlot, DriverTripStatus, IncomingTripRequest } from '../types';
import { buildActiveTripFromRequest, mockDocumentSlots, mockWallet } from '../services/mockData';
import { io, Socket } from 'socket.io-client';
import { driversApi, driverTripsApi, driverWalletApi, driverDocumentsApi, DriverDocumentServerType, DriverTripView, DriverWalletSummary } from '../services/api';
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
  confirmBoarding: (enteredCode: string) => Promise<boolean>;
  startTrip: () => Promise<void>;
  completeTrip: () => Promise<void>;
  clearActiveTrip: () => void;
  simulateIncomingTrip: (request: IncomingTripRequest) => void;
  documentSlots: DriverDocumentSlot[];
  areDocumentsApproved: boolean;
  submitDocument: (id: string, imageBase64: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

// Liga os documentos do ecra (ids do mock) aos tipos que o servidor conhece.
const DOC_ID_TO_TYPE: Record<string, DriverDocumentServerType> = {
  'doc-bi-front': 'bi_front',
  'doc-bi-back': 'bi_back',
  'doc-selfie': 'selfie',
  'doc-license': 'license',
  'doc-vehicle-reg': 'vehicle_registration',
  'doc-insurance': 'insurance',
};

const DriverContext = createContext<DriverContextValue | undefined>(undefined);

const VERIFY_DURATION_MS = 2200;
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
    paymentMethod: (view.paymentMethodType as IncomingTripRequest['paymentMethod']) ?? 'wallet',
    passengerCoordinates: { latitude: view.origin.latitude, longitude: view.origin.longitude },
    destinationCoordinates: { latitude: view.destination.latitude, longitude: view.destination.longitude },
  };
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
  // Viagens do botao "Simular nova corrida" nao existem no backend - por isso
  // o embarque/inicio/conclusao delas fica so local, sem chamar o servidor.
  const isSimulatedTripRef = useRef(false);
  const { session } = useDriverAuth();
  const driverId = session?.driverId ?? '';

  // Carteira: por agora local. Quando o backend tiver wallet proprio do
  // motorista, isto passa a vir de GET /driver/wallet.
  const [wallet, setWallet] = useState<DriverWalletSummary | null>(null);
  const walletAvailableKz = wallet?.availableKz ?? 0;
  const minimumOperatingBalanceKz = wallet?.minimumOperatingBalanceKz ?? mockWallet.minimumOperatingBalanceKz;

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  // Document Center (secoes 4, 5, 60): cada submissao fica "pending" ate
  // revisao - nunca auto-aprova. Por agora local; no backend passara a vir
  // de GET /driver/documents.
  const [documentSlots, setDocumentSlots] = useState<DriverDocumentSlot[]>(mockDocumentSlots.map((s) => ({ ...s, submissionStatus: 'not_submitted' as const, rejectionReason: undefined })));
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

  // Enviar nunca aprova: o servidor guarda como "pending" e so um revisor aprova.
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

  // Envia a localizacao real do telemovel ao backend enquanto estiver online -
  // e isso que alimenta GET /drivers/nearby no lado do passageiro.
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

  // Liga ao canal em tempo real enquanto online e entra na sala deste motorista.
  useEffect(() => {
    if (!isOnline || !driverId) return;
    const socket = io(API_BASE_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join_driver_room', driverId));
    socket.on('trip_assigned', (p: any) => {
      isSimulatedTripRef.current = false;
      setIncomingRequest({
        id: p.tripId,
        originLabel: p.originLabel,
        destinationLabel: p.destinationLabel,
        distanceToPassengerKm: p.distanceToPassengerKm,
        tripDistanceKm: p.tripDistanceKm,
        tripDurationMinutes: p.tripDurationMinutes,
        estimatedEarningsKz: p.estimatedEarningsKz,
        estimatedCommissionKz: p.estimatedCommissionKz,
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

  // Rede de seguranca: se o socket perder um "trip_assigned" (app em segundo
  // plano, reconexao, etc.), esta consulta periodica apanha o pedido na mesma.
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
          isSimulatedTripRef.current = false;
          setIncomingRequest(toIncomingRequest(trip));
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

  const goOnline = () => {
    setIsVerifyingOnline(true);
    setTimeout(async () => {
      try {
        // O servidor decide: sem saldo minimo responde 402 e o motorista nao fica online.
        await driversApi.setStatus('online');
        setIsVerifyingOnline(false);
        setIsOnline(true);
      } catch (e) {
        setIsVerifyingOnline(false);
        refreshWallet();
        Alert.alert('Nao foi possivel ficar online', (e as Error).message);
      }
    }, VERIFY_DURATION_MS);
  };

  const goOffline = () => {
    setIsOnline(false);
    setIncomingRequest(null);
    driversApi.setStatus('offline').catch(() => {});
  };

  const simulateIncomingTrip = (request: IncomingTripRequest) => {
    if (!isOnline || activeTrip) return;
    isSimulatedTripRef.current = true;
    setIncomingRequest(request);
  };

  const acceptIncomingTrip = () => {
    if (!incomingRequest) return;
    const simulated = isSimulatedTripRef.current;
    setActiveTrip(buildActiveTripFromRequest(incomingRequest));
    setIncomingRequest(null);
    driversApi.setStatus('on_trip').catch(() => {});
    if (!simulated) {
      driverTripsApi.accept(incomingRequest.id).then(() => refreshWallet()).catch(() => {});
    }
  };

  const declineIncomingTrip = () => {
    if (incomingRequest && !isSimulatedTripRef.current) {
      driverTripsApi.decline(incomingRequest.id).catch(() => {});
    }
    setIncomingRequest(null);
  };

  const setTripStatus = (status: DriverTripStatus) => {
    setActiveTrip((trip) => (trip ? { ...trip, status } : trip));
  };

  const markArrived = () => setTripStatus('arrived');

  /** O codigo e sempre comparado no servidor - o motorista nunca o recebe. */
  const confirmBoarding = async (enteredCode: string): Promise<boolean> => {
    if (!activeTrip) return false;
    if (isSimulatedTripRef.current) {
      if (enteredCode.length !== 4) return false;
      setTripStatus('boarding');
      return true;
    }
    try {
      await driverTripsApi.confirmBoarding(activeTrip.id, enteredCode);
      setTripStatus('boarding');
      return true;
    } catch {
      return false;
    }
  };

  const startTrip = async () => {
    if (!activeTrip) return;
    if (!isSimulatedTripRef.current) {
      try {
        await driverTripsApi.start(activeTrip.id);
      } catch {
        return;
      }
    }
    setTripStatus('in_progress');
  };

  const completeTrip = async () => {
    if (activeTrip && !isSimulatedTripRef.current) {
      try {
        const result = await driverTripsApi.complete(activeTrip.id);
        setActiveTrip((trip) => (trip ? { ...trip, netEarningsKz: result.netEarningsKz } : trip));
      } catch {
        // continua mesmo que a chamada falhe - nao bloqueia o motorista
      }
    }
    setTripStatus('completed');
    refreshWallet();
    if (isOnline) driversApi.setStatus('online').catch(() => {});
  };

  const clearActiveTrip = () => {
    setActiveTrip(null);
    isSimulatedTripRef.current = false;
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
      simulateIncomingTrip,
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





import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driverAuthApi, getToken, setToken } from '../services/api';

const STORAGE_KEY = '@angotour_driver/session';

export interface DriverSession {
  fullName: string;
  phone: string;
  driverId: string;
}

interface DriverAuthContextValue {
  session: DriverSession | null;
  isLoading: boolean;
  pendingPhone: string | null;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<{ isNewDriver: boolean }>;
  completeRegistration: (data: { fullName: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const DriverAuthContext = createContext<DriverAuthContextValue | undefined>(undefined);

export function DriverAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DriverSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (token && stored) setSession(JSON.parse(stored));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const requestOtp = async (phone: string) => {
    setPendingPhone(phone);
    await driverAuthApi.requestOtp(phone);
  };

  const verifyOtp = async (code: string): Promise<{ isNewDriver: boolean }> => {
    if (!pendingPhone) throw new Error('Nenhum numero pendente.');

    const result = await driverAuthApi.verifyOtp(pendingPhone, code);

    if (result.isNewDriver) {
      return { isNewDriver: true };
    }

    await setToken(result.accessToken);
    const minimalSession: DriverSession = {
      driverId: result.driverId ?? '',
      fullName: '',
      phone: pendingPhone,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(minimalSession));
    setSession(minimalSession);

    return { isNewDriver: false };
  };

  const completeRegistration = async (data: { fullName: string }) => {
    if (!pendingPhone) throw new Error('Nenhum numero pendente.');

    const result = await driverAuthApi.register({ phone: pendingPhone, fullName: data.fullName });
    await setToken(result.accessToken);

    const newSession: DriverSession = {
      driverId: result.driverId ?? '',
      fullName: data.fullName,
      phone: pendingPhone,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
    setPendingPhone(null);
  };

  const signOut = async () => {
    await setToken(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setPendingPhone(null);
  };

  const value = useMemo(
    () => ({ session, isLoading, pendingPhone, requestOtp, verifyOtp, completeRegistration, signOut }),
    [session, isLoading, pendingPhone]
  );

  return <DriverAuthContext.Provider value={value}>{children}</DriverAuthContext.Provider>;
}

export function useDriverAuth() {
  const ctx = useContext(DriverAuthContext);
  if (!ctx) throw new Error('useDriverAuth deve ser usado dentro de um <DriverAuthProvider>');
  return ctx;
}

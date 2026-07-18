import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface DriverSession {
  userId: number;
  role: 'driver';
  name: string;
  email: string;
}

interface AuthContextValue {
  driver: DriverSession | null;
  isLoading: boolean;
  login: (session: DriverSession) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  driver: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

const STORAGE_KEY = '@truckgo_driver_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [driver, setDriver] = useState<DriverSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setDriver(JSON.parse(raw));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (session: DriverSession) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setDriver(session);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setDriver(null);
  };

  return (
    <AuthContext.Provider value={{ driver, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

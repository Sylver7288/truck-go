import { create } from "zustand";

export type Role = "customer" | "driver";

export interface AuthUser {
  userId: number;
  role: Role;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const getStoredUser = (): AuthUser | null => {
  try {
    const stored = localStorage.getItem("truckgo-auth");
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse auth user", e);
  }
  return null;
};

export const useAuth = create<AuthState>((set) => ({
  user: getStoredUser(),
  isAuthenticated: !!getStoredUser(),
  login: (user) => {
    localStorage.setItem("truckgo-auth", JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("truckgo-auth");
    set({ user: null, isAuthenticated: false });
  },
}));

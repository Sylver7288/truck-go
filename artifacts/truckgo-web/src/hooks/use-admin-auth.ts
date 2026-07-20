import { create } from "zustand";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "";
const STORAGE_KEY = "truckgo-admin-auth";

interface AdminAuthState {
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

export const useAdminAuth = create<AdminAuthState>(() => ({
  isAuthenticated: localStorage.getItem(STORAGE_KEY) === "true",
  login: (email: string, password: string) => {
    if (ADMIN_EMAIL && ADMIN_PASSWORD && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "true");
      useAdminAuth.setState({ isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    useAdminAuth.setState({ isAuthenticated: false });
  },
}));

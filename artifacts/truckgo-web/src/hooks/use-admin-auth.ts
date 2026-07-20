import { create } from "zustand";

const STORAGE_KEY = "truckgo-admin-auth";

interface AdminAuthState {
  isAuthenticated: boolean;
  isChecking: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAdminAuth = create<AdminAuthState>((set) => ({
  isAuthenticated: localStorage.getItem(STORAGE_KEY) === "true",
  isChecking: true,
  login: async (email: string, password: string) => {
    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      localStorage.setItem(STORAGE_KEY, "true");
      set({ isAuthenticated: true, isChecking: false });
      return true;
    }

    localStorage.removeItem(STORAGE_KEY);
    set({ isAuthenticated: false, isChecking: false });
    return false;
  },
  logout: async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      set({ isAuthenticated: false, isChecking: false });
    }
  },
  checkSession: async () => {
    set({ isChecking: true });
    const response = await fetch("/api/admin/auth/me", { credentials: "same-origin" });
    if (response.ok) {
      localStorage.setItem(STORAGE_KEY, "true");
      set({ isAuthenticated: true, isChecking: false });
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    set({ isAuthenticated: false, isChecking: false });
  },
}));

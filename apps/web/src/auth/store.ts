import { create } from "zustand";

/** Lo que el servidor manda de vuelta en /auth/login, /auth/signup y /auth/me. */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  uiMode: string;
  theme: string;
  notificationsEnabled: boolean;
  dataSourceId: string | null;
};

const TOKEN_KEY = "camaleon.token";
const USER_KEY = "camaleon.user";

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
};

/**
 * Sesión del cliente. Sin auth de verdad, esto era un `userId` fijo en
 * `canvas/store.ts`; ahora vive aquí y ese store lo recibe una sola vez tras
 * el login (ver `auth-gate.tsx`).
 */
export const useAuth = create<AuthState>((set) => ({
  token: readStoredToken(),
  user: readStoredUser(),

  login: (token, user) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Sin localStorage (modo privado, etc.) la sesión no sobrevive un refresh.
    }
    set({ token, user });
  },

  logout: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // noop
    }
    set({ token: null, user: null });
  },

  setUser: (user) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // noop
    }
    set({ user });
  },
}));

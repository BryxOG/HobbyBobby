"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  userId: string | null;
  setUserId: (userId: string) => void;
  logout: () => void;
}

/** Идентификатор вошедшего пользователя — пока без JWT, только для UserService. */
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      setUserId: (userId) => set({ userId }),
      logout: () => set({ userId: null }),
    }),
    { name: "hb-auth" },
  ),
);

/** Синхронный доступ к userId вне React (HTTP-клиент). */
export function getAuthUserId(): string | null {
  return useAuth.getState().userId;
}

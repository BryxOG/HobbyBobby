"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

interface SettingsState {
  theme: Theme;
  notifications: boolean;
  geolocation: boolean;
  language: "ru";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setNotifications: (on: boolean) => void;
  setGeolocation: (on: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "light",
      notifications: true,
      geolocation: true,
      language: "ru",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      setNotifications: (notifications) => set({ notifications }),
      setGeolocation: (geolocation) => set({ geolocation }),
    }),
    { name: "hb-settings" },
  ),
);

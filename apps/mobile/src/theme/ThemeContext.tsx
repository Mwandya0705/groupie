import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkColors, lightColors, Palette } from "./index";

type Scheme = "dark" | "light";
const STORAGE_KEY = "color_scheme";

type ThemeCtx = {
  scheme: Scheme;
  colors: Palette;
  toggle: () => void;
  setScheme: (s: Scheme) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<Scheme>(
    Appearance.getColorScheme() === "light" ? "light" : "dark"
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === "light" || v === "dark") setSchemeState(v);
    });
  }, []);

  const setScheme = (s: Scheme) => {
    setSchemeState(s);
    AsyncStorage.setItem(STORAGE_KEY, s).catch(() => {});
  };

  const value = useMemo<ThemeCtx>(
    () => ({
      scheme,
      colors: scheme === "light" ? lightColors : darkColors,
      toggle: () => setScheme(scheme === "light" ? "dark" : "light"),
      setScheme,
    }),
    [scheme]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fallback so components used outside the provider still render (dark).
    return { scheme: "dark", colors: darkColors, toggle: () => {}, setScheme: () => {} };
  }
  return ctx;
}

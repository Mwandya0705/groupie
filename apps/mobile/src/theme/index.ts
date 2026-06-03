import { Platform, TextStyle } from "react-native";

/**
 * Design tokens adapted from DESIGN.md (Framer dark-canvas system) for
 * React Native. Pure-black artboard, white display type with aggressive
 * negative tracking, a single accent blue, and gradient "spotlight" cards.
 *
 * GT Walsheim / Inter Variable aren't bundled, so we use the platform
 * system font and preserve the brand voice through weight + tracking.
 */

// Colors shared by both schemes (brand accent, gradients, semantics).
const shared = {
  accent: "#0099ff",
  magenta: "#d44df0",
  violet: "#6a4cf5",
  orange: "#ff7a3d",
  coral: "#ff5577",
  success: "#22c55e",
  warning: "#f5a623",
  danger: "#ff4d4d",
};

export const darkColors = {
  ...shared,
  // brand
  primary: "#ffffff",
  onPrimary: "#000000",
  // ink
  ink: "#ffffff",
  inkMuted: "#999999",
  inkFaint: "#5c5c5c",
  // surfaces
  canvas: "#090909",
  surface1: "#141414",
  surface2: "#1c1c1c",
  surface3: "#242424",
  hairline: "#262626",
  hairlineSoft: "#1a1a1a",
};

export const lightColors: typeof darkColors = {
  ...shared,
  accent: "#007ad9",
  primary: "#0a0a0a",
  onPrimary: "#ffffff",
  ink: "#0a0a0a",
  inkMuted: "#5c636b",
  inkFaint: "#9aa0a6",
  canvas: "#f7f8fa",
  surface1: "#ffffff",
  surface2: "#f1f2f4",
  surface3: "#e8eaed",
  hairline: "#e2e5e9",
  hairlineSoft: "#eef0f3",
};

export type Palette = typeof darkColors;

/** Default palette (dark). Components should prefer useTheme() for reactivity. */
export const colors = darkColors;

export const gradients = {
  violet: ["#6a4cf5", "#9a4cf5"] as const,
  magenta: ["#d44df0", "#ff5577"] as const,
  orange: ["#ff7a3d", "#ff5577"] as const,
  ocean: ["#0099ff", "#6a4cf5"] as const,
  danger: ["#ff5577", "#ff4d4d"] as const,
};

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 15,
  xl: 20,
  xxl: 30,
  pill: 100,
  full: 9999,
} as const;

export const spacing = {
  hair: 1,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 15,
  lg: 20,
  xl: 30,
  xxl: 40,
  section: 64,
} as const;

const fontFamily = Platform.select({ ios: "System", android: "sans-serif", default: "System" });

// Typography presets. Negative letterSpacing scales with size, per DESIGN.md.
export const type = {
  displayXl: {
    fontFamily,
    fontSize: 40,
    fontWeight: "800",
    lineHeight: 40,
    letterSpacing: -1.8,
  } as TextStyle,
  displayLg: {
    fontFamily,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 34,
    letterSpacing: -1.2,
  } as TextStyle,
  displayMd: {
    fontFamily,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 27,
    letterSpacing: -0.8,
  } as TextStyle,
  headline: {
    fontFamily,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
    letterSpacing: -0.6,
  } as TextStyle,
  bodyLg: {
    fontFamily,
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 23,
    letterSpacing: -0.2,
  } as TextStyle,
  body: {
    fontFamily,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: -0.15,
  } as TextStyle,
  bodySm: {
    fontFamily,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 19,
    letterSpacing: -0.14,
  } as TextStyle,
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 15,
    letterSpacing: 0.4,
  } as TextStyle,
  // ALL-CAPS eyebrow / label
  eyebrow: {
    fontFamily,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
    letterSpacing: 1.6,
  } as TextStyle,
  button: {
    fontFamily,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 18,
    letterSpacing: -0.1,
  } as TextStyle,
} as const;

export const theme = { colors, gradients, radius, spacing, type };
export default theme;

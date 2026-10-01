/**
 * TRUEPAS PREMIUM — design tokens.
 *
 * One calm, confident system: cool white canvas, navy-ink type, the Truepas
 * sky blue reserved for brand moments (CTAs, verification glow, active
 * state), deep navy for the identity "hero" surfaces.
 */
import type { TextStyle, ViewStyle } from "react-native";

export const C = {
  // brand (from the Truepas palette)
  sky: "#08B6FC",
  skyPressed: "#0692CA",
  skyLight: "#84DBFE",
  skyWash: "#E6F8FF",
  skyMist: "#F2FBFF",
  navy: "#034965",
  navyDeep: "#022F42",
  navyNight: "#011B27",

  // neutrals
  canvas: "#F6F8FA",
  surface: "#FFFFFF",
  sunken: "#EEF2F5",
  ink: "#0A1E2A",
  ink2: "#3D505C",
  ink3: "#7A8A95",
  ink4: "#A9B5BD",
  line: "#E4EAEE",
  lineSoft: "#EEF2F4",

  // feedback
  green: "#12B76A",
  greenWash: "#E7F8F0",
  greenInk: "#067647",
  amber: "#F79009",
  amberWash: "#FEF4E6",
  amberInk: "#B54708",
  red: "#F04438",
  redWash: "#FEECEB",
  redInk: "#B42318",

  white: "#FFFFFF",
  black: "#000000",
} as const;

export const G = {
  sky: [C.sky, "#0A9BE0"] as const,
  hero: ["#045A7C", C.navy, C.navyNight] as const,
  night: ["#03344A", C.navyNight] as const,
  photoFade: ["rgba(1,27,39,0.18)", "rgba(1,27,39,0)", "rgba(1,27,39,0.9)"] as const,
  mist: [C.skyWash, C.canvas] as const,
};

export const F = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
  serif: "InstrumentSerif_400Regular",
  serifItalic: "InstrumentSerif_400Regular_Italic",
  mono: "JetBrainsMono_500Medium",
} as const;

/** Type scale — tight display, generous body. */
export const T = {
  display: { fontFamily: F.extrabold, fontSize: 38, lineHeight: 42, letterSpacing: -1.2, color: C.ink },
  title: { fontFamily: F.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.8, color: C.ink },
  h2: { fontFamily: F.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.5, color: C.ink },
  h3: { fontFamily: F.bold, fontSize: 17, lineHeight: 23, letterSpacing: -0.25, color: C.ink },
  body: { fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: C.ink2 },
  bodyStrong: { fontFamily: F.semibold, fontSize: 15, lineHeight: 22, color: C.ink },
  small: { fontFamily: F.medium, fontSize: 13, lineHeight: 18, color: C.ink3 },
  smallStrong: { fontFamily: F.semibold, fontSize: 13, lineHeight: 18, color: C.ink },
  micro: { fontFamily: F.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.1, textTransform: "uppercase", color: C.ink3 },
  serif: { fontFamily: F.serifItalic, fontWeight: "400", color: C.ink },
  mono: { fontFamily: F.mono, fontSize: 13, letterSpacing: 0.6, color: C.ink2 },
} satisfies Record<string, TextStyle>;

export const R = { xs: 8, sm: 12, md: 16, lg: 20, xl: 26, xxl: 32, full: 999 } as const;

export const S = { gutter: 20, section: 28, gap: 12 } as const;

/** Soft, low-contrast navy shadows (boxShadow works on web + new-arch native). */
export const SH = {
  sm: { boxShadow: "0px 1px 2px rgba(10,30,42,0.05), 0px 2px 8px rgba(10,30,42,0.04)" },
  md: { boxShadow: "0px 2px 4px rgba(10,30,42,0.04), 0px 10px 28px rgba(10,30,42,0.08)" },
  lg: { boxShadow: "0px 4px 10px rgba(10,30,42,0.06), 0px 24px 48px rgba(10,30,42,0.14)" },
  sky: { boxShadow: "0px 8px 24px rgba(8,182,252,0.38)" },
  navy: { boxShadow: "0px 18px 40px rgba(2,47,66,0.34)" },
} satisfies Record<string, ViewStyle>;

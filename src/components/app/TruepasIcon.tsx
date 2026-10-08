import Svg, { Path } from "react-native-svg";
import { useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";

/**
 * TruePas "TP" brand mark — the symbol from the official logo, without the
 * wordmark. viewBox 546×404; `size` is the rendered height and width follows
 * the mark's aspect (so `size={iconSize.lg}` matches the old square-icon
 * footprint). Color defaults to theme actionPrimary — pass onActionPrimary
 * when the mark sits on a filled brand surface.
 */
export function TruepasIcon({ size = iconSize.lg, color }: { size?: number; color?: string }) {
  const theme = useThemeTokens();
  const c = color ?? theme.colors.actionPrimary;
  return (
    <Svg
      width={size * (546 / 404)}
      height={size}
      viewBox="0 0 546 404"
      accessibilityLabel="TruePas"
    >
      <Path
        fill={c}
        d="M0 0h263c44 0 77 30 77 72 0 14-4 29-11 42L177 404l-76-97 106-195H86L0 0Z"
      />
      <Path
        fill={c}
        d="M420 0h93c18 0 33 15 33 32 0 6-2 12-5 18l-15 27c-12 21-39 35-66 35H360L420 0Z"
      />
    </Svg>
  );
}

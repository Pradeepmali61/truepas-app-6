import { useState } from "react";
import { Text, TextInput, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";

export interface OtpInputProps {
  /** Number of cells (default 6 — matches TruePas OTP flows) */
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  state?: "default" | "error";
  /** Render cells in the error color — equivalent to `state="error"` */
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Segmented one-time-code input — renders N cells over a single TextInput so
 * paste/autofill work. The invisible TextInput overlays the cells: it is the
 * touch target AND the accessible element (the visual cells are hidden from
 * assistive tech). Used by verify-otp flows.
 */
export function OtpInput({
  length = 6,
  value = "",
  onChange,
  onComplete,
  state = "default",
  error,
  disabled,
  autoFocus,
  accessibilityLabel = "One-time code",
  style,
}: OtpInputProps) {
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  const digits = value.slice(0, length).split("");
  const invalid = !!error || state === "error";

  const handleChange = (text: string) => {
    const clean = text.replace(/\D/g, "").slice(0, length);
    onChange?.(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  return (
    <View style={[styles.wrap, style]}>
      {/* Visual cells only — hidden from screen readers */}
      <View
        style={styles.cells}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {Array.from({ length }, (_, i) => {
          const isActive = focused && digits.length === i;
          return (
            <View
              key={i}
              style={[
                styles.cell,
                isActive && styles.cellFocused,
                invalid && styles.cellError,
                disabled && styles.cellDisabled,
              ]}
            >
              <Text style={[styles.digit, disabled && styles.digitDisabled]}>{digits[i] ?? ""}</Text>
            </View>
          );
        })}
      </View>
      {/* Invisible overlay: real input, real touch target, real a11y element */}
      <TextInput
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus={autoFocus}
        editable={!disabled}
        style={styles.hiddenInput}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !!disabled }}
        accessibilityValue={{ text: `${digits.length} of ${length} digits entered` }}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { alignSelf: "stretch" },
  cells: { flexDirection: "row", gap: t.spacing[2], justifyContent: "center" },
  cell: {
    flex: 1,
    maxWidth: t.sizes.heightLg,
    height: t.sizes.heightMd,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.border,
    borderRadius: t.radii.md,
  },
  // Same borderWidth as resting state — only the color changes, so focus
  // doesn't shift layout.
  cellFocused: { borderColor: t.colors.borderFocus },
  cellError: { borderColor: t.colors.error },
  cellDisabled: { backgroundColor: t.colors.surfaceSunken, opacity: t.opacity.disabled },
  digit: {
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.semibold,
    fontFamily: t.fontFamily.mono.semibold,
    color: t.colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  digitDisabled: { color: t.colors.textDisabled },
  hiddenInput: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0,
  },
}));

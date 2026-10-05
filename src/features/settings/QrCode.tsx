/** @jsxImportSource react */
/**
 * Real, scannable QR code: the pure-JS `qrcode` encoder builds the module
 * matrix, react-native-svg draws it as one path (works on native and web).
 * Used for the authenticator-app set-up (otpauth:// URI).
 */
import { create } from 'qrcode';
import { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

/** Standard 4-module quiet zone so phone scanners lock on reliably. */
const QUIET = 4;

export function QrCode({ value, size = 200, color = '#0A1E2A', background = '#FFFFFF' }: {
  value: string;
  size?: number;
  color?: string;
  background?: string;
}) {
  const qr = useMemo(() => {
    try {
      const { modules } = create(value, { errorCorrectionLevel: 'M' });
      const n = modules.size;
      let d = '';
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          if (modules.data[y * n + x]) d += `M${x + QUIET} ${y + QUIET}h1v1h-1z`;
        }
      }
      return { d, span: n + QUIET * 2 };
    } catch {
      return null;
    }
  }, [value]);

  if (!qr) return null;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${qr.span} ${qr.span}`} accessibilityLabel="QR code">
      <Rect x={0} y={0} width={qr.span} height={qr.span} fill={background} />
      <Path d={qr.d} fill={color} />
    </Svg>
  );
}

/** @jsxImportSource react */
import { PinView } from '@/premium/views';

/** New PIN — step 2. */
export default function ConfirmPin() {
  return <PinView topTitle="Change PIN" title="Confirm your" accent="PIN." sub="Enter the same 4 digits once more." value="2740" step={2} total={2} error="PINs don't match — try again" />;
}

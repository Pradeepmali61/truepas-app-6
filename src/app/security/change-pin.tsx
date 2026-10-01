/** @jsxImportSource react */
import { PinView } from '@/premium/views';

/** New PIN — step 1. */
export default function ChangePin() {
  return <PinView topTitle="Change PIN" title="Create a new" accent="PIN." sub="You'll use it to approve sensitive actions." value="27" step={1} total={2} />;
}

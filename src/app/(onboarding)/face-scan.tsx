/** @jsxImportSource react */
import { FaceScanView } from '@/premium/views';

/** Live enrolment — dark studio, rotating scan ring, liveness checklist. */
export default function FaceScan() {
  return <FaceScanView instruction="Slowly turn your head to the left. Keep your face inside the circle." step={2} total={3} />;
}

/** @jsxImportSource react */
import { FaceScanView } from '@/premium/views';

/** Face check-in / update — live scanner. */
export default function FaceCamera() {
  return (
    <FaceScanView
      topTitle="Face check-in"
      title="Look at the"
      accent="camera"
      instruction="Hold still for a moment. We're matching you to your Truepas."
      step={1}
      total={1}
      progress={0.78}
      checks={[
        { label: 'Face found', done: true },
        { label: 'Live', done: true },
        { label: 'Matching', done: false, active: true },
      ]}
    />
  );
}

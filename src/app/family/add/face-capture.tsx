/** @jsxImportSource react */
import { Button, go } from '@/premium/ui';
import { FaceScanView } from '@/premium/views';

/** Add member — step 4: the member's own face scan. */
export default function MemberFaceCapture() {
  return (
    <FaceScanView
      topTitle="Add member"
      title="Now scan"
      accent="Kiara"
      instruction="Hold the phone at Kiara's eye level. Ask her to look straight and blink."
      step={4}
      total={4}
      src="child"
      progress={0.8}
      checks={[
        { label: 'Look straight', done: true },
        { label: 'Blink', done: false, active: true },
      ]}
      footer={<Button label="Capture" tone="glass" onPress={go('/family/add/processing')} />}
    />
  );
}

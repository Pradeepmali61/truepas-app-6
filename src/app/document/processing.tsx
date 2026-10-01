/** @jsxImportSource react */
import { DocCard } from '@/premium/blocks';
import { DOCS } from '@/premium/data';
import { ProcessingView } from '@/premium/views';

/** Document verification in progress. */
export default function DocProcessing() {
  return (
    <ProcessingView
      topTitle="Verifying"
      title="Checking your"
      accent="passport."
      sub="Reading the chip and matching it to your face. Usually under 15 seconds."
      hero={<DocCard doc={DOCS[0]} height={180} style={{ width: 300, transform: [{ rotate: '-4deg' }] }} />}
      steps={[
        { label: 'Photo page captured', detail: 'Sharp, no glare', state: 'done' },
        { label: 'Security features', detail: 'Hologram + MRZ checksum valid', state: 'done' },
        { label: 'Face match', detail: 'Comparing with your face scan', state: 'active' },
        { label: 'Issuer verification', detail: 'Govt. of India records', state: 'todo' },
      ]}
    />
  );
}

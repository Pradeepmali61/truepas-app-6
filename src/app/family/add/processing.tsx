/** @jsxImportSource react */
import { FaceRing } from '@/premium/blocks';
import { ProcessingView } from '@/premium/views';

/** Add member — verification in progress. */
export default function MemberProcessing() {
  return (
    <ProcessingView
      topTitle="Add member"
      title="Verifying"
      accent="Kiara."
      sub="This usually takes under 10 seconds. You can leave this screen — we'll notify you."
      hero={<FaceRing size={170} src="child" progress={0.74} />}
      steps={[
        { label: 'Document read', detail: 'Birth certificate · Govt. of Maharashtra', state: 'done' },
        { label: 'Liveness confirmed', detail: 'Real person, live capture', state: 'done' },
        { label: 'Matching face to document', detail: 'Comparing 128 facial points', state: 'active' },
        { label: 'Linking to your family', state: 'todo' },
      ]}
    />
  );
}

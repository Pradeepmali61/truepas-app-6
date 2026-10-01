/** @jsxImportSource react */
import { DocScanView } from '@/premium/DocScanView';

/** Add member — step 3: capture their document. */
export default function MemberPhotoCapture() {
  return (
    <DocScanView
      topTitle="Add member"
      title="Birth certificate"
      hint="Place the document flat, inside the frame, in good light."
      step={3}
      total={4}
      next="/family/add/face-capture"
    />
  );
}

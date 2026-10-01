/** @jsxImportSource react */
import { DocScanView } from '@/premium/DocScanView';

/** Document capture — passport photo page. */
export default function Scan() {
  return (
    <DocScanView
      topTitle="Scan passport"
      title="Photo page"
      hint="Fit the page inside the frame. Avoid glare on the photo."
      next="/document/processing"
    />
  );
}

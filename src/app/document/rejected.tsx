/** @jsxImportSource react */
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { FileText, RotateCcw, ScanFace, ScanLine, TriangleAlert, UserPen, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';

import {
  DEFAULT_REJECTION_MESSAGE,
  REJECTION_ACTION_LABEL,
  rejectionAction,
  type RejectionAction,
} from '@/features/documents/verifyWithUploads';
import { DocumentCard } from '@/premium/flows/documents';
import { Button } from '@/premium/ui';
import { ResultView } from '@/premium/views';
import { flowGuards } from '@/services/flowGuards';

const ACTION_ICON: Record<RejectionAction, LucideIcon> = {
  retake: RotateCcw,
  anotherDocument: FileText,
  changeType: ScanLine,
  editProfile: UserPen,
  setupFace: ScanFace,
};

/** Document not verified (§6.3). `reasonMessage` is the text; `reasonCode`
 *  only picks the action button. Reached from document/processing. */
export default function DocumentRejectedScreen() {
  const router = useRouter();
  const { docType, docLabel, reasonCode, reasonMessage } = useLocalSearchParams<{
    docType?: string;
    docLabel?: string;
    reasonCode?: string;
    reasonMessage?: string;
  }>();
  // Result screen — a deep link with no real verification behind it is
  // bounced to the start of the flow (ADV-001).
  const [allowed] = useState(() => flowGuards.has('document:rejected'));

  useEffect(() => {
    if (allowed) flowGuards.consume('document:rejected');
  }, [allowed]);

  if (!allowed) return <Redirect href="/document/select-type" />;

  const action = rejectionAction(reasonCode);

  const onAction = () => {
    switch (action) {
      case 'retake':
        // Back to the scan screen (it sits under this one), reset to a fresh capture.
        router.dismissTo({ pathname: '/document/scan', params: { type: docType ?? 'passport', retake: String(Date.now()) } } as never);
        return;
      case 'anotherDocument':
      case 'changeType':
        router.dismissTo('/document/select-type' as never);
        return;
      case 'editProfile':
        router.push('/profile/edit' as never);
        return;
      case 'setupFace':
        router.push('/face-update/pin' as never);
        return;
    }
  };

  return (
    <ResultView
      close
      icon={TriangleAlert}
      tone="red"
      over="Not verified"
      title="We couldn't verify"
      accent="this document."
      sub={reasonMessage || DEFAULT_REJECTION_MESSAGE}
      primary={<Button label={REJECTION_ACTION_LABEL[action]} icon={ACTION_ICON[action]} onPress={onAction} />}
      secondary={<Button label="Back to wallet" tone="ghost" onPress={() => router.dismissTo('/(tabs)/documents' as never)} />}>
      <DocumentCard
        type={docType}
        label={docLabel || 'Document'}
        badge={{ label: 'Not verified', tone: 'red', dot: true }}
        height={180}
      />
    </ResultView>
  );
}

/** @jsxImportSource react */
import { useQueryClient } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { Check, Database, Image as ImageIcon, ScanFace, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { sessionEnded } from '@/features/auth/slice';
import { C } from '@/premium/theme';
import { Button, Card, Divider, Row, Txt } from '@/premium/ui';
import { ResultView } from '@/premium/views';
import { clearAllDocumentImages } from '@/services/documentImageStore';
import { flowGuards } from '@/services/flowGuards';
import { clearAllProfileImages } from '@/services/profileImageStore';
import { useAppDispatch } from '@/store';

const SYSTEMS: { icon: LucideIcon; label: string }[] = [
  { icon: Database, label: 'PostgreSQL' },
  { icon: ImageIcon, label: 'S3 Images' },
  { icon: ScanFace, label: 'Face Gallery' },
];

/** Delete account — success with all-3-systems verification (PRD). */
export default function DeleteSuccessScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();
  // Reaching this screen directly must not wipe the session — the flag only
  // exists after DELETE /user/me returned success.
  const [allowed] = useState(() => flowGuards.has('account:deleted'));

  // End the session as soon as the deletion is confirmed — the backend has
  // already revoked tokens, so keeping Redux/query state alive until the
  // button tap would let the user back into authenticated screens.
  useEffect(() => {
    if (!allowed) return;
    flowGuards.consume('account:deleted');
    queryClient.clear();
    void clearAllDocumentImages();
    void clearAllProfileImages();
    dispatch(sessionEnded());
  }, [queryClient, dispatch, allowed]);

  if (!allowed) return <Redirect href="/" />;

  return (
    <ResultView
      close
      icon={Check}
      tone="green"
      over="All done"
      title="Your account is"
      accent="deleted."
      sub="All your data has been permanently removed."
      primary={
        <Button
          label="Back to sign in"
          // Session already ended on mount — just navigate out; the entry
          // gate won't re-render so go to login explicitly.
          onPress={() => router.dismissTo('/(auth)/login' as never)}
        />
      }>
      <View style={{ gap: 10 }}>
        <Txt v="micro" style={{ marginLeft: 4 }}>
          Deletion verified
        </Txt>
        <Card pad={0} style={{ paddingHorizontal: 18 }}>
          {SYSTEMS.map((s, i) => (
            <View key={s.label}>
              {i > 0 && <Divider />}
              <Row between style={{ paddingVertical: 14 }}>
                <Row gap={10}>
                  <s.icon size={18} color={C.skyPressed} />
                  <Txt v="bodyStrong">{s.label}</Txt>
                </Row>
                <Row gap={4}>
                  <Check size={14} color={C.green} strokeWidth={3} />
                  <Txt v="smallStrong" color={C.greenInk}>
                    Deleted
                  </Txt>
                </Row>
              </Row>
            </View>
          ))}
        </Card>
      </View>
      <Txt v="small" color={C.ink4} center>
        Changed your mind? You can create a new Truepas anytime.
      </Txt>
    </ResultView>
  );
}

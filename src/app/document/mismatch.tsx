/** @jsxImportSource react */
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowDown, RotateCcw, TriangleAlert, UserPen, UserRoundCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { toApiError } from '@/api/errors';
import { useUpdateProfile } from '@/features/auth/mutations';
import { useToast } from '@/hooks/useToast';
import { C } from '@/premium/theme';
import { Badge, Button, Card, Divider, Row, Txt } from '@/premium/ui';
import { ResultView } from '@/premium/views';
import { flowGuards } from '@/services/flowGuards';

/** Normalises a date to y-m-d (ISO or US MM/DD/YYYY) so equal dates in
 *  different formats compare equal; null when unrecognised. */
function toYmd(v: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v.trim());
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v.trim());
  if (us) return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
  return null;
}

/** Match / Differs — only when both sides have a value to compare. */
function compare(a: string | undefined, b: string | undefined, kind: 'text' | 'date'): boolean | null {
  if (!a || !b) return null;
  if (kind === 'date') {
    const ya = toYmd(a);
    const yb = toYmd(b);
    if (ya && yb) return ya === yb;
  }
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return norm(a) === norm(b);
}

function Line({ k, profile, doc, same }: { k: string; profile: string; doc: string; same: boolean | null }) {
  return (
    <View style={{ gap: 8, paddingVertical: 12 }}>
      <Txt v="micro">{k}</Txt>
      <Row between>
        <Txt v="small">On your profile</Txt>
        <Txt v="bodyStrong" style={{ flexShrink: 1, textAlign: 'right' }}>
          {profile}
        </Txt>
      </Row>
      <Row between>
        <Txt v="small">On your document</Txt>
        <Row gap={8} style={{ flexShrink: 1, justifyContent: 'flex-end' }}>
          {same != null && <Badge label={same ? 'Match' : 'Differs'} tone={same ? 'green' : 'amber'} />}
          <Txt v="bodyStrong" color={same === false ? C.amberInk : C.ink} style={{ flexShrink: 1, textAlign: 'right' }}>
            {doc}
          </Txt>
        </Row>
      </Row>
    </View>
  );
}

/** PROFILE_MISMATCH (§6.3) — the details read from the document differ from
 *  the profile. "Accept" copies the document's extracted name/DOB into the
 *  profile, then the document is scanned again; "Edit profile" opens the
 *  profile form. */
export default function MismatchScreen() {
  const router = useRouter();
  const updateProfile = useUpdateProfile();
  const toast = useToast();
  const params = useLocalSearchParams<{
    docType?: string;
    profileName?: string;
    profileDob?: string;
    docName?: string;
    docDob?: string;
    reasonMessage?: string;
  }>();
  // Result screen — deep links without a real verification session are
  // bounced back to the start of the document flow (ADV-001).
  const [allowed] = useState(() => flowGuards.has('document:mismatch'));

  useEffect(() => {
    if (allowed) flowGuards.consume('document:mismatch');
  }, [allowed]);

  const profileName = params.profileName || '—';
  const docName = params.docName || '—';
  const profileDob = params.profileDob || '—';
  const docDob = params.docDob || '—';
  // Accept needs something read from the document to copy.
  const canAccept = !!(params.docName || params.docDob);

  const scanAgain = () =>
    router.dismissTo({ pathname: '/document/scan', params: { type: params.docType ?? 'passport', retake: String(Date.now()) } } as never);
  const editProfile = () => router.push('/profile/edit' as never);

  const handleAccept = async () => {
    try {
      await updateProfile.mutateAsync({
        ...(params.docName ? { fullName: params.docName } : {}),
        ...(params.docDob ? { dateOfBirth: params.docDob } : {}),
      });
      toast.show('success', 'Profile updated. Scan your document again.');
      scanAgain();
    } catch (err) {
      toast.show('error', toApiError(err).message || 'Could not update your profile. Please try again.');
    }
  };

  if (!allowed) return <Redirect href="/document/select-type" />;

  return (
    <ResultView
      icon={TriangleAlert}
      tone="amber"
      over="Needs your attention"
      title="Details don't"
      accent="match."
      sub={params.reasonMessage || "The details read from your document don't match your profile."}
      primary={
        canAccept ? (
          <Button label="Accept & update profile" icon={UserRoundCheck} loading={updateProfile.isPending} onPress={handleAccept} />
        ) : (
          <Button label="Edit profile" icon={UserPen} onPress={editProfile} />
        )
      }
      secondary={
        canAccept ? (
          <Button label="Edit profile" tone="ghost" icon={UserPen} onPress={editProfile} />
        ) : (
          <Button label="Use another document" tone="ghost" icon={RotateCcw} onPress={() => router.dismissTo('/document/select-type' as never)} />
        )
      }>
      <Card pad={0} style={{ paddingHorizontal: 18, paddingVertical: 4 }}>
        <Line k="Name" profile={profileName} doc={docName} same={compare(params.profileName, params.docName, 'text')} />
        <Divider />
        <Line k="Date of birth" profile={profileDob} doc={docDob} same={compare(params.profileDob, params.docDob, 'date')} />
      </Card>

      {canAccept ? (
        <Row gap={8} align="flex-start" style={{ paddingHorizontal: 4 }}>
          <ArrowDown size={14} color={C.ink3} style={{ marginTop: 2 }} />
          <Txt v="small" style={{ flex: 1 }}>
            Accepting copies the name and date of birth from your document into your profile.
          </Txt>
        </Row>
      ) : null}
    </ResultView>
  );
}

/** @jsxImportSource react */
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowDown, RotateCcw, TriangleAlert, UserRoundCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { toApiError } from '@/api/errors';
import { useUpdateProfile } from '@/features/auth/mutations';
import { formatCountdown, useCountdown } from '@/hooks/useCountdown';
import { useToast } from '@/hooks/useToast';
import { Banner } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Badge, Button, Card, Divider, Row, Txt } from '@/premium/ui';
import { ResultView } from '@/premium/views';
import { flowGuards } from '@/services/flowGuards';

const SESSION_TTL_SECONDS = 15 * 60;

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

/** Profile mismatch session — 15-minute TTL, accept or retry (PRD).
 *  "Accept" copies the document's extracted name/DOB into the profile so the
 *  next verification attempt matches. */
export default function MismatchScreen() {
  const router = useRouter();
  const { seconds } = useCountdown(SESSION_TTL_SECONDS);
  const updateProfile = useUpdateProfile();
  const toast = useToast();
  const params = useLocalSearchParams<{
    docId?: string;
    profileName?: string;
    profileDob?: string;
    docName?: string;
    docDob?: string;
    reason?: string;
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

  const handleAccept = async () => {
    try {
      await updateProfile.mutateAsync({
        ...(params.docName ? { fullName: params.docName } : {}),
        ...(params.docDob ? { dateOfBirth: params.docDob } : {}),
      });
      if (params.docId) {
        router.replace({ pathname: '/document/[id]', params: { id: params.docId } } as never);
      } else {
        router.dismissTo('/(tabs)');
      }
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
      sub="The details read from your document don't match your profile."
      primary={
        <Button
          label="Accept & update profile"
          icon={UserRoundCheck}
          loading={updateProfile.isPending}
          onPress={handleAccept}
        />
      }
      secondary={
        <Button
          label="Retry with a different document"
          tone="ghost"
          icon={RotateCcw}
          onPress={() => router.replace('/document/select-type')}
        />
      }>
      <Card pad={0} style={{ paddingHorizontal: 18, paddingVertical: 4 }}>
        <Line k="Name" profile={profileName} doc={docName} same={compare(params.profileName, params.docName, 'text')} />
        <Divider />
        <Line k="Date of birth" profile={profileDob} doc={docDob} same={compare(params.profileDob, params.docDob, 'date')} />
      </Card>

      {params.reason ? <Banner tone="info" title="Reason" body={params.reason} /> : null}

      <Banner
        tone="warning"
        title={seconds > 0 ? `Session expires in ${formatCountdown(seconds)}` : 'Session expired'}
        body="If the session expires, you'll need to re-verify your document."
      />

      <Row gap={8} align="flex-start" style={{ paddingHorizontal: 4 }}>
        <ArrowDown size={14} color={C.ink3} style={{ marginTop: 2 }} />
        <Txt v="small" style={{ flex: 1 }}>
          Accepting copies the name and date of birth from your document into your profile.
        </Txt>
      </Row>
    </ResultView>
  );
}

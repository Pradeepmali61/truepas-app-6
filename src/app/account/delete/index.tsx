/** @jsxImportSource react */
import { useRouter } from 'expo-router';
import { FileText, KeyRound, ScanFace, Trash2, Users } from 'lucide-react-native';
import { useState } from 'react';
import { TextInput, View, type TextStyle } from 'react-native';

import { toApiError } from '@/api/errors';
import { useDeleteAccount } from '@/features/auth/mutations';
import { useDocuments } from '@/features/documents/hooks';
import { useFamily } from '@/features/family/hooks';
import { useToast } from '@/hooks/useToast';
import { CodeInput } from '@/premium/kit';
import { C, F, R } from '@/premium/theme';
import { back, Button, Chip, Field, Group, Heading, ListRow, Row, Screen, TextLink, Tile, TopBar, Txt } from '@/premium/ui';
import { flowGuards } from '@/services/flowGuards';
import type { DeleteAccountReason } from '@/types/domain';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const REASONS: { value: DeleteAccountReason; label: string }[] = [
  { value: 'privacy', label: 'Privacy concerns' },
  { value: 'not_using', label: 'Not using it' },
  { value: 'few_venues', label: 'Too few venues' },
  { value: 'other', label: 'Other' },
];

const COMMENT_MAX = 500;

/**
 * Delete account — DELETE /user/me { confirmation: "DELETE", pin, reason?,
 * comment? } (backend Oct 2026 §11.2). The optional reason and comment are
 * stored without any link to the account. Removes face + documents before
 * tombstone. Type DELETE + enter PIN, then the destructive footer CTA
 * enables. Success routes through the guarded processing → success pipeline.
 */
export default function DeleteAccountScreen() {
  const router = useRouter();
  const toast = useToast();
  const [confirmation, setConfirmation] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [reason, setReason] = useState<DeleteAccountReason | null>(null);
  const [comment, setComment] = useState('');
  const deleteAccount = useDeleteAccount();
  const documents = useDocuments();
  const family = useFamily();

  const canDelete = confirmation.trim() === 'DELETE' && pin.length === 4;

  const handleDelete = async () => {
    if (!canDelete || deleteAccount.isPending) return;
    setPinError(null);
    const note = comment.trim().slice(0, COMMENT_MAX);
    try {
      await deleteAccount.mutateAsync({
        confirmation: confirmation.trim(),
        pin,
        ...(reason ? { reason } : {}),
        ...(note ? { comment: note } : {}),
      });
      flowGuards.grant('account:deleting');
      router.push('/account/delete/processing');
    } catch (err: unknown) {
      // The confirmation passed client-side, so a 400/422/429 is the PIN —
      // PIN_INVALID carries the tries left, PIN_LOCKED the wait. A failed
      // delete must NOT reach the success flow either way.
      const apiErr = toApiError(err);
      const pinRejected =
        apiErr.serverCode === 'PIN_INVALID' ||
        apiErr.serverCode === 'PIN_LOCKED' ||
        apiErr.status === 400 ||
        apiErr.status === 422 ||
        apiErr.status === 429;
      if (pinRejected) setPinError(apiErr.message || 'Incorrect PIN. Try again.');
      else toast.show('error', apiErr.message || 'Could not delete account. Please try again.');
      setPin('');
    }
  };

  const docCount = documents.data?.length;
  const familyCount = family.data?.length;

  return (
    <Screen
      keyboard
      header={<TopBar title="Delete account" />}
      contentStyle={{ paddingTop: 4 }}
      footer={
        <>
          <Button
            label="Permanently delete"
            tone="danger"
            icon={Trash2}
            disabled={!canDelete}
            loading={deleteAccount.isPending}
            onPress={() => void handleDelete()}
          />
          <Button label="Keep my account" tone="ghost" onPress={back} />
        </>
      }>
      <Tile icon={Trash2} tone="red" size={60} />
      <Heading
        title="We're sorry to see you"
        accent="go."
        sub="This can't be undone. Deleting your account permanently removes:"
      />

      <Group>
        <ListRow icon={ScanFace} tone="red" title="Your face templates" sub="Removed from the face gallery" chevron={false} />
        <ListRow
          icon={FileText}
          tone="red"
          title={docCount != null ? plural(docCount, 'document', 'documents') : 'Your documents'}
          sub="Removed with their images"
          chevron={false}
        />
        <ListRow
          icon={Users}
          tone="red"
          title="Family data"
          sub={familyCount != null && familyCount > 0 ? plural(familyCount, 'member', 'members') : undefined}
          chevron={false}
        />
        <ListRow icon={KeyRound} tone="red" title="Active sessions" sub="Signed out everywhere" chevron={false} />
      </Group>

      <View style={{ gap: 10 }}>
        <Txt v="smallStrong" color={C.ink2}>
          Mind telling us why? (optional)
        </Txt>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {REASONS.map((r) => (
            <Chip
              key={r.value}
              label={r.label}
              active={reason === r.value}
              onPress={() => setReason(reason === r.value ? null : r.value)}
            />
          ))}
        </Row>
        <View
          style={{
            minHeight: 96,
            borderRadius: R.md,
            backgroundColor: C.surface,
            borderWidth: 1.5,
            borderColor: C.line,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}>
          <TextInput
            value={comment}
            onChangeText={(t) => setComment(t.slice(0, COMMENT_MAX))}
            placeholder="Anything else you'd like to tell us?"
            placeholderTextColor={C.ink4}
            accessibilityLabel="Comment (optional)"
            multiline
            maxLength={COMMENT_MAX}
            textAlignVertical="top"
            style={
              { minHeight: 70, fontFamily: F.medium, fontSize: 15, lineHeight: 21, color: C.ink, outlineStyle: 'none' } as unknown as TextStyle
            }
          />
        </View>
        <Row between>
          <Txt v="small" color={C.ink4}>
            Not linked to your account.
          </Txt>
          <Txt v="small" color={comment.length >= COMMENT_MAX ? C.amberInk : C.ink4}>
            {comment.length}/{COMMENT_MAX}
          </Txt>
        </Row>
      </View>

      <View style={{ backgroundColor: C.redWash, borderRadius: R.lg, padding: 16, gap: 18 }}>
        <Field
          label='Type "DELETE" to confirm'
          value={confirmation}
          onChangeText={setConfirmation}
          placeholder="DELETE"
          inputProps={{ autoCapitalize: 'characters', autoCorrect: false, autoComplete: 'off' }}
        />
        <View style={{ gap: 8 }}>
          <Txt v="smallStrong" color={C.ink2}>
            Account PIN
          </Txt>
          <CodeInput
            length={4}
            value={pin}
            onChange={(v) => {
              setPin(v);
              setPinError(null);
            }}
            error={pinError != null}
            dots
            autoFocus={false}
            label="Account PIN"
          />
          {pinError != null && (
            <Txt v="small" color={C.redInk}>
              {pinError}
            </Txt>
          )}
          <View style={{ alignSelf: 'flex-start' }}>
            <TextLink label="Forgot PIN?" onPress={() => router.push('/security/forgot-pin' as never)} />
          </View>
        </View>
      </View>
    </Screen>
  );
}

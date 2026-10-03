/** @jsxImportSource react */
import { useRouter } from 'expo-router';
import { FileText, KeyRound, ScanFace, Trash2, Users } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { toApiError } from '@/api/errors';
import { useDeleteAccount } from '@/features/auth/mutations';
import { useDocuments } from '@/features/documents/hooks';
import { useFamily } from '@/features/family/hooks';
import { useToast } from '@/hooks/useToast';
import { CodeInput, ComingSoon } from '@/premium/kit';
import { C, R } from '@/premium/theme';
import { back, Button, Chip, Field, Group, Heading, ListRow, Row, Screen, Tile, TopBar, Txt } from '@/premium/ui';
import { flowGuards } from '@/services/flowGuards';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Delete account — DELETE /user/me { confirmation: "DELETE", pin }.
 * Removes face + documents before tombstone. Type DELETE + enter PIN, then
 * the destructive footer CTA enables. Success routes through the guarded
 * processing → success pipeline.
 */
export default function DeleteAccountScreen() {
  const router = useRouter();
  const toast = useToast();
  const [confirmation, setConfirmation] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const deleteAccount = useDeleteAccount();
  const documents = useDocuments();
  const family = useFamily();

  const canDelete = confirmation.trim() === 'DELETE' && pin.length === 4;

  const handleDelete = async () => {
    if (!canDelete || deleteAccount.isPending) return;
    setPinError(false);
    try {
      await deleteAccount.mutateAsync({ confirmation: confirmation.trim(), pin });
      flowGuards.grant('account:deleting');
      router.push('/account/delete/processing');
    } catch (err: any) {
      // A 422 here means the confirmation passed client-side but the PIN was
      // rejected — flag the PIN field and let the user retry it. A failed
      // delete must NOT reach the success flow either way.
      if (toApiError(err).status === 422) setPinError(true);
      toast.show('error', toApiError(err).message || 'Could not delete account. Please try again.');
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

      <View style={{ gap: 10 }} accessibilityState={{ disabled: true }} accessibilityHint="Coming soon">
        <Row between>
          <Txt v="smallStrong" color={C.ink2}>
            Mind telling us why? (optional)
          </Txt>
          <ComingSoon />
        </Row>
        <Row gap={8} style={{ flexWrap: 'wrap', opacity: 0.55 }}>
          <Chip label="Privacy concerns" />
          <Chip label="Not using it" />
          <Chip label="Too few venues" />
          <Chip label="Other" />
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
              setPinError(false);
            }}
            error={pinError}
            dots
            autoFocus={false}
            label="Account PIN"
          />
          {pinError && (
            <Txt v="small" color={C.redInk}>
              Incorrect PIN — try again.
            </Txt>
          )}
        </View>
      </View>
    </Screen>
  );
}

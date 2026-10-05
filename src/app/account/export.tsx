/** @jsxImportSource react */
import { useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CalendarCheck,
  Download,
  FileArchive,
  FileText,
  FolderDown,
  Hourglass,
  RefreshCw,
  Share2,
  User,
  Users,
} from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Share } from 'react-native';

import { toApiError } from '@/api/errors';
import { accountKeys, useDataExport, useRequestDataExport } from '@/features/account/hooks';
import { downloadExport, saveExportToFolder, useSavedExportId } from '@/features/settings/dataExport';
import { useToast } from '@/hooks/useToast';
import { Banner, ErrorView, LoadingView } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Button, Card, Group, Heading, ListRow, Screen, Tile, TopBar, Txt } from '@/premium/ui';
import { useAppSelector } from '@/store';

const INCLUDED = [
  { icon: User, title: 'Account', sub: 'Profile and settings' },
  { icon: Users, title: 'Family', sub: 'Members you added' },
  { icon: CalendarCheck, title: 'Bookings', sub: 'Check-ins and reservations' },
  { icon: FileText, title: 'Documents', sub: 'Details only — numbers masked, no images' },
  { icon: Bell, title: 'Notifications', sub: 'Your inbox' },
];

function fmtDay(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Download my data (backend Oct 2026 §11.1).
 * POST /user/me/export → { exportId, status: 'pending' } → GET
 * /user/me/export/{id} polled every 15 s while pending (useDataExport). The
 * exportId is remembered on this device so the user can leave and come back.
 * Ready → download with the access token (the url is a BFF path, never a
 * public link), then share (iOS) or save to a folder (Android).
 * Failed / expired → request a new file. On dev it stays pending until the
 * export worker is deployed — that's expected.
 */
export default function DataExportScreen() {
  const toast = useToast();
  const qc = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const { exportId, setExportId, loaded } = useSavedExportId(user?.id);
  const request = useRequestDataExport();
  const exp = useDataExport(exportId);
  const [downloading, setDownloading] = useState(false);
  const [fileUri, setFileUri] = useState<string | null>(null);

  // A remembered id the server no longer knows (404) means "no export".
  const lost = exp.isError && toApiError(exp.error).status === 404;
  const data = lost ? undefined : exp.data;
  const status = data?.status;

  const ask = async () => {
    if (request.isPending) return;
    try {
      const res = await request.mutateAsync();
      qc.setQueryData(accountKeys.dataExport(res.exportId), res);
      setFileUri(null);
      setExportId(res.exportId);
    } catch (err) {
      toast.show('error', toApiError(err).message || "Couldn't request your data. Please try again.");
    }
  };

  const shareOrSave = async (uri: string) => {
    try {
      if (Platform.OS === 'android') {
        if (await saveExportToFolder(uri)) toast.show('success', 'Saved');
      } else {
        await Share.share({ url: uri, title: 'Truepas data' });
      }
    } catch {
      toast.show('error', "Couldn't open the share sheet.");
    }
  };

  const download = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      // Re-check first: refreshes the access token and the file path.
      const fresh = (await exp.refetch()).data;
      if (!fresh || fresh.status !== 'ready' || !fresh.url) {
        toast.show('error', 'This file is no longer available.');
        return;
      }
      const uri = await downloadExport(fresh.url);
      if (uri) {
        setFileUri(uri);
        if (Platform.OS === 'ios') await shareOrSave(uri);
      } else {
        toast.show('success', 'Download started');
      }
    } catch {
      toast.show('error', "Couldn't download the file. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const header = <TopBar title="Download my data" />;

  if (!loaded || (exportId && !lost && exp.isPending)) {
    return (
      <Screen header={header} scroll={false}>
        <LoadingView full />
      </Screen>
    );
  }

  if (exportId && exp.isError && !lost && !exp.data) {
    return (
      <Screen header={header}>
        <ErrorView onRetry={() => void exp.refetch()} />
      </Screen>
    );
  }

  // ── pending ──
  if (status === 'pending') {
    return (
      <Screen
        header={header}
        contentStyle={{ paddingTop: 8 }}
        refreshing={exp.isRefetching}
        onRefresh={() => void exp.refetch()}
        footer={
          <Button label="Check again" tone="white" icon={RefreshCw} loading={exp.isFetching} onPress={() => void exp.refetch()} />
        }>
        <Tile icon={Hourglass} tone="sky" size={60} />
        <Heading title="Preparing your" accent="file…" sub="This can take a while. We'll notify you when it's ready." />
        <Banner tone="info" title="You can leave this screen" body="Your request is saved. Come back here any time to download the file." />
      </Screen>
    );
  }

  // ── ready ──
  if (status === 'ready') {
    const until = fmtDay(data?.expiresAt);
    return (
      <Screen
        header={header}
        contentStyle={{ paddingTop: 8 }}
        footer={
          fileUri ? (
            <Button
              label={Platform.OS === 'android' ? 'Save to a folder' : 'Share file'}
              icon={Platform.OS === 'android' ? FolderDown : Share2}
              onPress={() => void shareOrSave(fileUri)}
            />
          ) : (
            <Button label="Download" icon={Download} loading={downloading} onPress={() => void download()} />
          )
        }>
        <Tile icon={FileArchive} tone="green" size={60} />
        <Heading
          title="Your file is"
          accent="ready."
          sub={until ? `A ZIP of your data. Available until ${until}.` : 'A ZIP of your data, available for 7 days.'}
        />
        {fileUri ? (
          <Banner tone="success" title="Downloaded" body="The file is saved in Truepas on this phone." />
        ) : (
          <Txt v="small" color={C.ink3}>
            It contains personal details. Keep it somewhere safe.
          </Txt>
        )}
      </Screen>
    );
  }

  // ── nothing yet / failed / expired ──
  const failed = status === 'failed';
  const expired = status === 'expired';
  return (
    <Screen
      header={header}
      contentStyle={{ paddingTop: 8 }}
      footer={
        <Button
          label={failed ? 'Try again' : expired ? 'Request a new file' : 'Request my data'}
          icon={failed ? RefreshCw : Download}
          loading={request.isPending}
          onPress={() => void ask()}
        />
      }>
      <Tile icon={Download} tone="sky" size={60} />
      <Heading title="Download" accent="your data." sub="Get a copy of what Truepas holds about you as a ZIP file." />

      {failed ? (
        <Banner tone="error" title="We couldn't prepare your file" body={data?.error || 'Something went wrong on our side. Please try again.'} />
      ) : expired ? (
        <Banner tone="warning" title="Your last file expired" body="Files are kept for 7 days. Request a new one." />
      ) : null}

      <Group title="What's included">
        {INCLUDED.map((x) => (
          <ListRow key={x.title} icon={x.icon} tone="sky" title={x.title} sub={x.sub} chevron={false} />
        ))}
      </Group>

      <Card flat style={{ backgroundColor: C.skyMist, borderColor: C.skyWash, gap: 4 }}>
        <Txt v="smallStrong">How it works</Txt>
        <Txt v="small" style={{ lineHeight: 19 }}>
          We build the file in the background and notify you when it&apos;s ready. You then have 7 days to download it.
        </Txt>
      </Card>
    </Screen>
  );
}

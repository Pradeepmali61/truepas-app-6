/** @jsxImportSource react */
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, Info } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { DOC_META, DOC_TYPES } from '@/premium/flows/documents';
import { C, F, R, SH } from '@/premium/theme';
import { Badge, Heading, Press, Row, Screen, Steps, TopBar, Txt } from '@/premium/ui';
import type { DocumentType } from '@/types/domain';

/** Add document — step 1 of 2: pick the type, then scan.
 *  Number/label/expiry are NOT collected — server-side Regula OCR extracts
 *  them during /verify (processing screen sends 'PENDING' placeholders).
 *  Supports family mode: when `family` param is set, the scan flow is scoped
 *  to a family member (personId). Each type is a miniature card; tapping one
 *  continues straight to the scan (the original Select + Continue). */
export default function AddDocumentScreen() {
  const router = useRouter();
  const { family, personId, memberName, band } = useLocalSearchParams<{
    family?: string;
    personId?: string;
    memberName?: string;
    band?: string;
  }>();
  const isFamilyMode = family === '1';
  const firstName = memberName?.trim().split(/\s+/)[0];

  const continueToUpload = (type: DocumentType) => {
    const params: Record<string, string> = { type };
    if (isFamilyMode) {
      params.family = '1';
      params.personId = personId ?? '';
      params.name = memberName ?? '';
      params.band = band ?? '';
    }
    router.push({ pathname: '/document/scan', params });
  };

  return (
    <Screen header={<TopBar title="Add document" onBack={() => router.back()} />} contentStyle={{ paddingTop: 4 }}>
      <View style={{ gap: 18 }}>
        <Steps total={2} current={0} />
        {isFamilyMode ? (
          firstName ? (
            <Heading over="Step 1 of 2 — choose type" title="Which ID does" accent={firstName} after="have?" sub="Pick the document you'll scan next." />
          ) : (
            <Heading over="Step 1 of 2 — choose type" title="Which ID do they" accent="have?" sub="Pick the document you'll scan next." />
          )
        ) : (
          <Heading over="Step 1 of 2 — choose type" title="Which ID do you" accent="have?" sub="Pick the document you'll scan next." />
        )}
      </View>

      <View style={{ gap: 12 }} accessibilityRole="list" accessibilityLabel="Document type">
        {DOC_TYPES.map((t) => {
          const d = DOC_META[t];
          const recommended = t === 'passport' && !isFamilyMode;
          return (
            <Press key={t} onPress={() => continueToUpload(t)} label={d.label} role="button" style={[{ borderRadius: R.lg }, SH.sm]}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                  backgroundColor: C.surface,
                  borderRadius: R.lg,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: C.lineSoft,
                }}>
                <View style={{ width: 62, height: 44, borderRadius: 9, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                  <LinearGradient colors={d.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  <View>
                    <d.icon size={20} color={C.white} />
                  </View>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Row gap={8} style={{ flexWrap: 'wrap' }}>
                    <Text style={{ fontFamily: F.bold, fontSize: 15.5, color: C.ink }}>{d.label}</Text>
                    {recommended && <Badge label="Recommended" tone="sky" />}
                  </Row>
                  <Txt v="small">{d.sub}</Txt>
                </View>
                <ChevronRight size={18} color={C.ink4} />
              </View>
            </Press>
          );
        })}
      </View>

      <Row gap={10} align="flex-start" style={{ paddingHorizontal: 4 }}>
        <Info size={16} color={C.ink3} style={{ marginTop: 1 }} />
        <Txt v="small" style={{ flex: 1 }}>
          The document number and expiry are read from the scan automatically.
        </Txt>
      </Row>
    </Screen>
  );
}

/** @jsxImportSource react */
/**
 * Add family — step 2: document. 5-9/10+ → doc + liveness; 0-4 → doc + photo.
 * Hands off to /document/scan in family mode with the member basics.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Check, ScanFace, ScanLine, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { DOC_ICON } from '@/premium/flows/family';
import { Banner } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Badge, Button, Card, Heading, Steps, Tile, TopBar, Txt, Screen } from '@/premium/ui';
import type { DocumentType, FamilyAgeBand } from '@/types/domain';

type DocOption = { id: DocumentType; label: string };

// Minors can't hold a driving license.
const OPTIONS_MINOR: DocOption[] = [
  { id: 'passport', label: 'Passport' },
  { id: 'idCard', label: 'ID Card' },
  { id: 'greenCard', label: 'US Green Card' },
  { id: 'birthCertificate', label: 'Birth Certificate' },
  { id: 'usVisa', label: 'US Visa' },
];

// 10+ covers adults too — they can hold any document type, including driving license.
const OPTIONS_10_PLUS: DocOption[] = [
  { id: 'passport', label: 'Passport' },
  { id: 'drivingLicense', label: "Driver's License" },
  { id: 'idCard', label: 'ID Card' },
  { id: 'greenCard', label: 'US Green Card' },
  { id: 'usVisa', label: 'US Visa' },
];

export default function FamilyDocumentScreen() {
  const router = useRouter();
  const { name, band, dob, relationship } = useLocalSearchParams<{
    name?: string;
    band?: FamilyAgeBand;
    dob?: string;
    relationship?: string;
  }>();
  const needsFace = band !== '0-4';
  const firstName = (name ?? 'Member').split(' ')[0];

  const docOptions = band === '10+' ? OPTIONS_10_PLUS : OPTIONS_MINOR;
  const [selectedDocType, setSelectedDocType] = useState<DocOption>(docOptions[0]);
  // Flow: basics (1) → document (2) → capture (3) — three steps for every band.
  const stepDone = 2;
  const stepTotal = 3;

  const handleComplete = () => {
    if (!name || !dob || !relationship) {
      router.dismissTo('/(tabs)');
      return;
    }
    router.push({
      pathname: '/document/scan',
      params: {
        type: selectedDocType.id,
        family: '1',
        name: name,
        dob: dob,
        relationship: relationship,
        band: band ?? '',
      },
    });
  };

  return (
    <Screen
      header={
        <TopBar
          title="Add member"
          right={
            <Txt v="smallStrong" color={C.ink3}>
              {stepDone}/{stepTotal}
            </Txt>
          }
        />
      }
      contentStyle={{ paddingTop: 8 }}
      footer={
        <Button
          label={needsFace ? 'Scan document' : 'Upload document'}
          icon={needsFace ? ScanLine : Upload}
          onPress={handleComplete}
        />
      }>
      <View style={{ gap: 10 }}>
        <Steps total={stepTotal} current={stepDone - 1} />
        <Txt v="small">Step {stepDone} of {stepTotal} · Document</Txt>
      </View>

      <View style={{ gap: 14 }}>
        <Heading
          title={needsFace ? `Scan ${firstName}'s` : `Upload ${firstName}'s`}
          accent="ID."
          sub="Choose a document. Make sure all corners are visible and text is readable."
        />
        {band === '0-4' ? (
          <Badge label="Age 0-4 · Document + Photo" tone="neutral" icon={Camera} />
        ) : band === '5-9' ? (
          <Badge label="Age 5-9 · Doc + Liveness · any camera" tone="sky" icon={ScanFace} />
        ) : (
          <Badge label="Age 10+ · Doc + Liveness · front camera" tone="sky" icon={ScanFace} />
        )}
      </View>

      {!needsFace ? (
        <Banner tone="info" body="Children under 5 need a document and one photo — no liveness scan required." />
      ) : null}

      <View style={{ gap: 10 }}>
        <Txt v="micro" style={{ marginLeft: 4 }}>
          Document type
        </Txt>
        <Card pad={0} style={{ paddingHorizontal: 16 }}>
          {docOptions.map((o, i) => {
            const selected = o.id === selectedDocType.id;
            return (
              <Pressable
                key={o.id}
                accessibilityRole="radio"
                accessibilityLabel={o.label}
                accessibilityState={{ selected, checked: selected }}
                onPress={() => setSelectedDocType(o)}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    paddingVertical: 14,
                    borderTopWidth: i ? 1 : 0,
                    borderTopColor: C.lineSoft,
                  }}>
                  <Tile icon={DOC_ICON[o.id]} tone={selected ? 'sky' : 'neutral'} size={40} />
                  <Txt v="bodyStrong" color={selected ? C.ink : C.ink2} style={{ flex: 1 }}>
                    {o.label}
                  </Txt>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? C.sky : 'transparent',
                      borderWidth: selected ? 0 : 2,
                      borderColor: C.line,
                    }}>
                    {selected && <Check size={14} color={C.white} strokeWidth={3.2} />}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </Card>
      </View>
    </Screen>
  );
}

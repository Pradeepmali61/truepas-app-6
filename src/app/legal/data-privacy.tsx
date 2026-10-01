/** @jsxImportSource react */
import { Download, ScanFace, Share2 } from 'lucide-react-native';
import { View } from 'react-native';

import { Button, Group, ListRow, Toggle } from '@/premium/ui';
import { LegalView } from '@/premium/views';

/** Biometric data policy + live data controls. */
export default function DataPrivacy() {
  return (
    <LegalView
      topTitle="Your data"
      title="Your biometric"
      accent="data."
      updated="1 Oct 2026"
      intro="Your face template is the most sensitive thing you trust us with. Here's exactly how it's handled — and the controls to manage it."
      sections={[
        { h: 'Created on your device', p: 'The camera image is converted into a mathematical template on your phone. The image itself is discarded within seconds.' },
        { h: 'Encrypted and isolated', p: 'Templates are encrypted with AES-256 and stored in an isolated vault, separate from your name and documents.' },
        { h: 'Deleted on request', p: 'Turn off face check-in or delete your account and your template is erased permanently within 24 hours.' },
      ]}
      footer={
        <View style={{ gap: 18 }}>
          <Group title="Controls">
            <ListRow icon={ScanFace} tone="sky" title="Face check-in" sub="Keep my face template" trailing={<Toggle on />} />
            <ListRow icon={Share2} tone="sky" title="Share usage analytics" sub="Anonymous, helps improve accuracy" trailing={<Toggle />} />
          </Group>
          <Button label="Download my data" tone="white" icon={Download} />
        </View>
      }
    />
  );
}

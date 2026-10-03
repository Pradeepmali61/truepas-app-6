/** @jsxImportSource react */
/**
 * About Truepas — brand header (real app version from expo-constants), what
 * Truepas offers, mission, contact (support email) and legal links.
 * "Rate Truepas" has no store listing yet → Coming soon.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Lock, Mail, MapPin, QrCode, ScanFace, Shield, ShieldCheck, Star, Users, type LucideIcon } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Glow, Guilloche, Wordmark } from '@/premium/blocks';
import { APP_VERSION, emailSupport, SoonRow, SUPPORT_EMAIL } from '@/premium/flows/account';
import { C, F, G } from '@/premium/theme';
import { Card, Divider, go, Group, ListRow, Serif, Tile, TopBar, Txt } from '@/premium/ui';

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    desc: 'Your documents are encrypted and stored with the same security standards used by leading banks and financial institutions.',
  },
  {
    icon: ScanFace,
    title: 'Face Verification',
    desc: 'Biometric face enrollment ensures that only you can access and share your identity — no one else can impersonate you.',
  },
  {
    icon: FileText,
    title: 'Document Vault',
    desc: "Store passports, driver's licenses, birth certificates, visas, and more — all in one secure, organized place.",
  },
  {
    icon: Users,
    title: 'Family Sharing',
    desc: 'Add family members and manage their identity documents from a single account. Perfect for parents and dependents.',
  },
  {
    icon: QrCode,
    title: 'Instant Check-In',
    desc: 'Share your verified identity with hotels, cruises, theme parks, and more via QR code — skip the front desk queues.',
  },
  {
    icon: Lock,
    title: "You're in Control",
    desc: 'You decide what to share and with whom. Every sharing action requires your PIN and face verification.',
  },
];

export default function AboutScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ---------- brand header ---------- */}
        <View style={{ paddingBottom: 40, overflow: 'hidden' }}>
          <LinearGradient colors={G.night} style={StyleSheet.absoluteFill} />
          <Glow size={420} opacity={0.4} style={{ top: -60, left: -20 }} />
          <Guilloche size={520} style={{ left: -60, top: -120 }} />
          <SafeAreaView edges={['top']}>
            <TopBar tone="glass" />
          </SafeAreaView>
          <View style={{ alignItems: 'center', gap: 14, paddingTop: 24, paddingHorizontal: 20 }}>
            <Wordmark light size={36} />
            <Text style={{ fontFamily: F.semibold, fontSize: 17, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
              Your identity, verified <Serif size={22} color={C.skyLight}>everywhere.</Serif>
            </Text>
            <Txt v="small" color="rgba(255,255,255,0.5)">
              Version {APP_VERSION}
            </Txt>
          </View>
        </View>

        <View style={{ padding: 20, gap: 24 }}>
          <Txt v="body" center>
            Truepas is a secure digital identity platform that lets you store, verify, and share your identity
            documents with businesses in seconds — no paper, no queues, no hassle.
          </Txt>

          {/* ---------- features ---------- */}
          <View style={{ gap: 10 }}>
            <Txt v="micro" style={{ marginLeft: 4 }}>
              What Truepas offers
            </Txt>
            <Card pad={0} style={{ paddingHorizontal: 18 }}>
              {FEATURES.map((f, i) => (
                <View key={f.title}>
                  {i > 0 && <Divider inset={56} />}
                  <View style={{ flexDirection: 'row', gap: 14, paddingVertical: 16 }}>
                    <Tile icon={f.icon} tone="sky" size={42} />
                    <View style={{ flex: 1, gap: 3 }}>
                      <Txt v="bodyStrong">{f.title}</Txt>
                      <Txt v="small" style={{ lineHeight: 19 }}>
                        {f.desc}
                      </Txt>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </View>

          {/* ---------- mission ---------- */}
          <View style={{ borderRadius: 26, overflow: 'hidden', padding: 22, gap: 10 }}>
            <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Guilloche size={360} style={{ right: -180, bottom: -200 }} />
            <ShieldCheck size={22} color={C.skyLight} />
            <Text style={{ fontFamily: F.bold, fontSize: 19, letterSpacing: -0.4, color: C.white }}>
              Our <Serif size={23} color={C.skyLight}>mission</Serif>
            </Text>
            <Txt v="body" color="rgba(255,255,255,0.78)">
              To eliminate identity fraud and make identity verification effortless for everyone, everywhere. We
              believe your identity should be yours to own, control, and share — securely and instantly.
            </Txt>
          </View>

          {/* ---------- contact ---------- */}
          <Group title="Get in touch">
            <ListRow icon={Mail} tone="sky" title="Email support" sub={SUPPORT_EMAIL} onPress={emailSupport} />
            <ListRow icon={MapPin} tone="sky" title="San Francisco, California" chevron={false} />
            <SoonRow icon={Star} tone="sky" title="Rate Truepas" />
          </Group>

          {/* ---------- legal ---------- */}
          <Group title="Legal">
            <ListRow icon={FileText} title="Terms of Service" onPress={go('/legal/terms')} />
            <ListRow icon={Lock} title="Privacy Policy" onPress={go('/legal/privacy-policy')} />
            <ListRow icon={ScanFace} title="Data & privacy" onPress={go('/legal/data-privacy')} />
          </Group>

          <View style={{ alignItems: 'center', gap: 4 }}>
            <Txt v="small" color={C.ink4} center>
              © 2025 Truepas. All rights reserved.
            </Txt>
            <Txt v="small" color={C.ink4} center>
              Made with care for your privacy.
            </Txt>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** @jsxImportSource react */
/**
 * Welcome — root of the signed-out stack (no back button): cinematic brand
 * hero + the two entry points. "Create your TruePas" → register, "I already
 * have an account" → login (same targets as the original WelcomeScreen).
 * Long-press on the wordmark opens the premium /showcase — dev builds only.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, BedDouble } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Wordmark } from '@/premium/blocks';
import { IMG } from '@/premium/images';
import { useLightStatusBar } from '@/premium/statusBar';
import { C, DESCENDERS, F, R, SH } from '@/premium/theme';
import { Button, Row, Serif, VerifiedTick } from '@/premium/ui';

export default function WelcomeScreen() {
  const router = useRouter();
  useLightStatusBar();

  return (
    <View style={{ flex: 1, backgroundColor: C.navyNight }}>
      <Image source={IMG.hotelNight} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(1,27,39,0.6)', 'rgba(1,27,39,0)', 'rgba(1,27,39,0.3)', 'rgba(1,27,39,0.95)', C.navyNight]}
        locations={[0, 0.2, 0.4, 0.66, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }}>
        <Row style={{ paddingTop: 10 }}>
          <Pressable
            onLongPress={__DEV__ ? () => router.push('/showcase' as never) : undefined}
            delayLongPress={600}
            accessibilityRole="header"
            accessibilityLabel="TruePas">
            <Wordmark light size={22} />
          </Pressable>
        </Row>

        {/* Illustrative verification moment (marketing art, not account data). */}
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end', paddingTop: 30 }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <View style={[styles.glassCard, SH.lg]}>
            <View style={{ padding: 2, borderRadius: 18, borderWidth: 2, borderColor: C.sky }}>
              <Image source={IMG.user} style={{ width: 46, height: 46, borderRadius: 14 }} contentFit="cover" />
            </View>
            <View style={{ gap: 2 }}>
              <Row gap={6}>
                <Text style={styles.glassTitle}>Face verified</Text>
                <VerifiedTick size={16} />
              </Row>
              <Text style={styles.glassSub}>Matched in 0.8 seconds</Text>
            </View>
          </View>
          <View style={[styles.glassCard, { marginTop: 12, marginRight: 38 }, SH.lg]}>
            <View style={styles.glassIcon}>
              <BedDouble size={22} color={C.white} />
            </View>
            <View style={{ gap: 2 }}>
              <Text style={styles.glassTitle}>Checked in · Room 1208</Text>
              <Text style={styles.glassSub}>Marine Bay Grand, Mumbai</Text>
            </View>
          </View>
        </View>

        <View style={{ gap: 14, paddingBottom: 8 }}>
          <Text style={styles.over}>YOUR FACE IS YOUR PASS</Text>
          <Text style={styles.headline} accessibilityRole="header">
            One face.{'\n'}Every <Serif size={54} color={C.skyLight}>check-in.</Serif>
          </Text>
          <Text style={styles.sub}>
            Contactless check-in for you and your family — hotels, flights, theme parks and cruises, verified in a glance.
          </Text>
          <Button label="Create your TruePas" iconRight={ArrowRight} onPress={() => router.push('/(auth)/register')} />
          <Button label="I already have an account" tone="glass" onPress={() => router.push('/(auth)/login')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    paddingRight: 18,
    borderRadius: R.lg + 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  glassIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(8,182,252,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassTitle: { fontFamily: F.bold, fontSize: 14.5, color: C.white },
  glassSub: { fontFamily: F.medium, fontSize: 12.5, color: 'rgba(255,255,255,0.72)' },
  over: { fontFamily: F.bold, fontSize: 11.5, letterSpacing: 1.6, color: C.skyLight },
  headline: { fontFamily: F.extrabold, fontSize: 46, lineHeight: 52, letterSpacing: -1.6, color: C.white, ...DESCENDERS },
  sub: { fontFamily: F.regular, fontSize: 16, lineHeight: 24, color: 'rgba(255,255,255,0.74)', maxWidth: 330, marginBottom: 24 },
});

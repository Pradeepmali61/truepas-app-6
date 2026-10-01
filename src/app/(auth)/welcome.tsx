/** @jsxImportSource react */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, BedDouble } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Wordmark } from '@/premium/blocks';
import { IMG } from '@/premium/images';
import { C, F, R, SH } from '@/premium/theme';
import { Button, go, Row, Serif, VerifiedTick } from '@/premium/ui';

/** Cinematic welcome — full-bleed travel photography with a live verification moment. */
export default function Welcome() {
  return (
    <View style={{ flex: 1, backgroundColor: C.navyNight }}>
      <Image source={IMG.hotelNight} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(1,27,39,0.6)', 'rgba(1,27,39,0)', 'rgba(1,27,39,0.3)', 'rgba(1,27,39,0.95)', C.navyNight]}
        locations={[0, 0.2, 0.4, 0.66, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }}>
        <Row between style={{ paddingTop: 10 }}>
          <Pressable onLongPress={go('/showcase')} delayLongPress={600}>
            <Wordmark light size={22} />
          </Pressable>
          <Text style={{ fontFamily: F.semibold, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>EN</Text>
        </Row>

        {/* floating live-verification moment */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end', paddingTop: 30 }}>
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
          <Text style={styles.headline}>
            One face.{'\n'}Every <Serif size={54} color={C.skyLight}>check-in.</Serif>
          </Text>
          <Text style={styles.sub}>Hotels, flights, theme parks and cruises — verified in a glance. No queues, no paperwork.</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, marginBottom: 14 }}>
            <View style={[styles.dot, { width: 22, backgroundColor: C.sky }]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <Button label="Create your Truepas" iconRight={ArrowRight} onPress={go('/(auth)/register')} />
          <Button label="I already have an account" tone="glass" onPress={go("/(auth)/login")} />
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
  headline: { fontFamily: F.extrabold, fontSize: 46, lineHeight: 52, letterSpacing: -1.6, color: C.white },
  sub: { fontFamily: F.regular, fontSize: 16, lineHeight: 24, color: 'rgba(255,255,255,0.74)', maxWidth: 330 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
});

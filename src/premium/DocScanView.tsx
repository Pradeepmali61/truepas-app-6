/** @jsxImportSource react */
/** Dark document viewfinder — card-shaped frame, corner brackets, moving scan line. */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Images, Zap } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IMG } from './images';
import { C, F } from './theme';
import { Footer, go, IconCircle, Press, Row, Steps, TopBar, Txt } from './ui';

export function DocScanView({
  topTitle,
  title,
  hint,
  step,
  total,
  next,
}: {
  topTitle: string;
  title: string;
  hint: string;
  step?: number;
  total?: number;
  next: string;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    l.start();
    return () => l.stop();
  }, [v]);
  const W = 330;
  const H = 214;
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [8, H - 10] });
  const corner = (pos: object) => (
    <View style={[{ position: 'absolute', width: 34, height: 34, borderColor: C.sky }, pos]} />
  );
  return (
    <View style={{ flex: 1, backgroundColor: '#050B10' }}>
      {/* blurred "camera" backdrop */}
      <Image source={IMG.room} style={[StyleSheet.absoluteFill, { opacity: 0.35 }]} contentFit="cover" blurRadius={18} />
      <LinearGradient colors={['rgba(5,11,16,0.7)', 'rgba(5,11,16,0.2)', 'rgba(5,11,16,0.85)']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <TopBar tone="glass" title={topTitle} right={<IconCircle icon={Zap} tone="glass" label="Flash" />} />
        {step != null && total != null && (
          <View style={{ paddingHorizontal: 24, paddingTop: 6 }}>
            <Steps total={total} current={step - 1} light />
          </View>
        )}
        <View style={{ alignItems: 'center', paddingTop: 28, gap: 8, paddingHorizontal: 30 }}>
          <Text style={{ fontFamily: F.extrabold, fontSize: 26, letterSpacing: -0.7, color: C.white, textAlign: 'center' }}>{title}</Text>
          <Txt v="body" color="rgba(255,255,255,0.65)" center>
            {hint}
          </Txt>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: W, height: H, borderRadius: 18, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' }}>
            {/* ghost document */}
            <View style={{ position: 'absolute', left: 20, top: 26, width: 78, height: 96, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ position: 'absolute', left: 116, top: 34 + i * 22, width: 170 - i * 26, height: 9, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            ))}
            <View style={{ position: 'absolute', left: 20, right: 20, bottom: 22, height: 24, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, transform: [{ translateY: y }] }}>
              <View style={{ height: 2, backgroundColor: C.sky, boxShadow: '0px 0px 16px rgba(8,182,252,0.9)' }} />
            </Animated.View>
          </View>
          <View style={{ position: 'absolute', width: W + 16, height: H + 16 }}>
            {corner({ left: 0, top: 0, borderLeftWidth: 4, borderTopWidth: 4, borderTopLeftRadius: 20 })}
            {corner({ right: 0, top: 0, borderRightWidth: 4, borderTopWidth: 4, borderTopRightRadius: 20 })}
            {corner({ left: 0, bottom: 0, borderLeftWidth: 4, borderBottomWidth: 4, borderBottomLeftRadius: 20 })}
            {corner({ right: 0, bottom: 0, borderRightWidth: 4, borderBottomWidth: 4, borderBottomRightRadius: 20 })}
          </View>
          <View style={{ marginTop: 26, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(8,182,252,0.16)', paddingHorizontal: 14, height: 34, borderRadius: 17 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.sky }} />
            <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.white }}>Hold steady — auto-capturing</Text>
          </View>
        </View>
        <Footer>
          <Row between style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
            <IconCircle icon={Images} tone="glass" size={50} label="Upload from gallery" />
            <Press onPress={go(next)} label="Capture" style={{ width: 82, height: 82, borderRadius: 41, borderWidth: 4, borderColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.white }} />
            </Press>
            <View style={{ width: 50 }} />
          </Row>
        </Footer>
      </SafeAreaView>
    </View>
  );
}

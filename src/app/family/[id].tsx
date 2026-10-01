/** @jsxImportSource react */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { CalendarDays, FileText, History, MoreHorizontal, ScanFace, UserCheck } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FAMILY } from '@/premium/data';
import { IMG } from '@/premium/images';
import { C, F } from '@/premium/theme';
import { Badge, Button, go, Group, IconCircle, ListRow, Row, TopBar, Toggle, VerifiedTick } from '@/premium/ui';

/** Member profile — portrait header, status, permissions. */
export default function Member() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = FAMILY.find((x) => x.id === id) ?? FAMILY[0];
  const minor = m.age < 18;
  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ height: 420 }}>
          <Image source={IMG[m.image]} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['rgba(1,27,39,0.35)', 'rgba(1,27,39,0)', 'rgba(246,248,250,0.6)', C.canvas]} locations={[0, 0.3, 0.82, 1]} style={StyleSheet.absoluteFill} />
          <SafeAreaView edges={['top']}>
            <TopBar tone="glass" right={<IconCircle icon={MoreHorizontal} tone="glass" label="More" />} />
          </SafeAreaView>
        </View>
        <View style={{ paddingHorizontal: 20, marginTop: -64, gap: 26 }}>
          <View style={{ gap: 8 }}>
            <Row gap={10}>
              <Text style={{ fontFamily: F.extrabold, fontSize: 34, letterSpacing: -1.1, color: C.ink }}>{m.name}</Text>
              {m.status === 'verified' && <VerifiedTick size={24} />}
            </Row>
            <Row gap={8}>
              <Badge label={`${m.relation} · ${m.age} yrs`} tone="neutral" />
              {m.status === 'verified' ? <Badge label="Face linked" tone="green" dot /> : <Badge label="Face scan pending" tone="amber" dot />}
            </Row>
          </View>

          {m.status === 'pending' && <Button label={`Complete ${m.name.split(' ')[0]}'s face scan`} icon={ScanFace} onPress={go('/family/add/face-capture')} />}

          <Group title="Identity">
            <ListRow icon={CalendarDays} title="Date of birth" value={`${['12 Jan', '3 Mar', '9 Jun', '21 Sep'][Number(m.id.slice(1)) - 1]} ${2026 - m.age - 1}`} chevron={false} />
            <ListRow icon={FileText} tone="sky" title={minor ? 'Birth certificate' : 'Passport'} sub="Verified document" onPress={go('/document/d1')} />
            <ListRow icon={History} tone="sky" title="Check-in activity" sub="Last: Aravali Palace, 21 Sep" onPress={go(`/family/${m.id}/activity`)} />
          </Group>

          <Group title="Permissions">
            <ListRow icon={UserCheck} title="Check in independently" sub={minor ? 'Not available for members under 18' : 'Can check in without you present'} trailing={<Toggle on={!minor} />} />
            <ListRow icon={ScanFace} title="Notify me on every check-in" sub="Real-time alerts to your phone" trailing={<Toggle on />} />
          </Group>

          <Button label="Remove from family" tone="ghost" style={{ marginTop: -8 }} />
        </View>
      </ScrollView>
    </View>
  );
}

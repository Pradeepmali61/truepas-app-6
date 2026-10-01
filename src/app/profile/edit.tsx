/** @jsxImportSource react */
import { AtSign, Camera, Lock, MapPin, Phone, User } from 'lucide-react-native';
import { View } from 'react-native';

import { USER } from '@/premium/data';
import { C } from '@/premium/theme';
import { Avatar, Button, Field, Row, Screen, TextLink, TopBar, Txt } from '@/premium/ui';

/** Edit profile — verified fields are locked, contact fields editable. */
export default function EditProfile() {
  return (
    <Screen header={<TopBar title="Edit profile" right={<TextLink label="Save" />} />} contentStyle={{ paddingTop: 8 }} footer={<Button label="Save changes" />}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <View>
          <Avatar src="user" size={100} ring />
          <View style={{ position: 'absolute', right: 0, bottom: 2, width: 34, height: 34, borderRadius: 17, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.canvas }}>
            <Camera size={15} color={C.white} />
          </View>
        </View>
        <TextLink label="Change photo" />
      </View>
      <View style={{ gap: 18 }}>
        <Field label="Full name" icon={User} value={USER.name} right={<Lock size={16} color={C.ink4} />} hint="Verified from your passport — can't be edited." />
        <Field label="Email" icon={AtSign} value={USER.email} focused />
        <Field label="Mobile" icon={Phone} value="+91 98765 43210" />
        <Field label="City" icon={MapPin} value={USER.city} />
      </View>
      <Row gap={8} style={{ justifyContent: 'center' }}>
        <Lock size={13} color={C.ink4} />
        <Txt v="small" color={C.ink4}>
          Changes to contact details need a quick OTP
        </Txt>
      </Row>
    </Screen>
  );
}

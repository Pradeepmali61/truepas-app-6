/** @jsxImportSource react */
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import {
  BellRing,
  CalendarDays,
  Car,
  Coffee,
  Map,
  Share2,
  Sparkles,
  Ticket,
  Users,
  UtensilsCrossed,
  Wifi,
} from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Guilloche, KIND_ICON, PassCode } from "@/premium/blocks";
import {
  FAMILY,
  KIND_LABEL,
  PAST,
  UPCOMING,
  type TripKind,
} from "@/premium/data";
import { IMG } from "@/premium/images";
import { C, F, G, R, SH } from "@/premium/theme";
import {
  Avatar,
  Badge,
  Card,
  Divider,
  Group,
  IconCircle,
  ListRow,
  Row,
  SectionHead,
  TopBar,
  Txt,
} from "@/premium/ui";

const PASS: Record<
  TripKind,
  { label: string; big: string; sub: string; hint: string }
> = {
  hotel: {
    label: "DIGITAL KEY",
    big: "1208",
    sub: "Floor 12 · Sea-facing",
    hint: "Hold your phone near the door, or simply look at the lock camera.",
  },
  park: {
    label: "FAST LANE PASS",
    big: "Gate A",
    sub: "4 guests · Face entry from 10:00",
    hint: "Walk through the Truepas lane — no tickets, no wristbands.",
  },
  flight: {
    label: "BOARDING",
    big: "3A",
    sub: "Gate B12 · Boards 06:05",
    hint: "Look at the e-gate camera to clear security and board.",
  },
  cinema: {
    label: "YOUR SEATS",
    big: "F11–14",
    sub: "Audi 3 · Recliners",
    hint: "Face entry at the lobby — snacks are billed to your seat.",
  },
  cruise: {
    label: "CABIN",
    big: "9142",
    sub: "Deck 9 · Ocean suite",
    hint: "Your face opens your cabin and pays onboard.",
  },
  stadium: {
    label: "ENTRY",
    big: "Gate 4",
    sub: "North Stand · Row K",
    hint: "Face entry at Gate 4 turnstiles.",
  },
  concert: {
    label: "ENTRY",
    big: "Door 2",
    sub: "General admission",
    hint: "Face entry — wristband issued inside.",
  },
};

/** Stay / visit detail — Hilton-style: photo, digital key, details, services. */
export default function Booking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = [...UPCOMING, ...PAST].find((t) => t.id === id) ?? UPCOMING[0];
  const Icon = KIND_ICON[trip.kind];
  const pass = PASS[trip.kind];
  const stay = trip.kind === "hotel" || trip.kind === "cruise";
  const [day, time] = trip.when.split(" · ");
  const statusLabel =
    trip.status === "completed"
      ? "Checked in"
      : trip.status === "ready"
        ? "Face check-in open"
        : "Opens on arrival";

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* photo header */}
        <View style={{ height: 340 }}>
          <Image
            source={IMG[trip.image]}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={[
              "rgba(1,27,39,0.45)",
              "rgba(1,27,39,0)",
              "rgba(1,27,39,0.75)",
            ]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={["top"]}>
            <TopBar
              tone="glass"
              right={<IconCircle icon={Share2} tone="glass" label="Share" />}
            />
          </SafeAreaView>
          <View
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              bottom: 52,
              gap: 6,
            }}
          >
            <Row gap={8}>
              <Icon size={15} color={C.skyLight} />
              <Text
                style={{
                  fontFamily: F.semibold,
                  fontSize: 13,
                  color: C.skyLight,
                }}
              >
                {KIND_LABEL[trip.kind]}
              </Text>
            </Row>
            <Text
              style={{
                fontFamily: F.extrabold,
                fontSize: 32,
                letterSpacing: -1,
                color: C.white,
              }}
            >
              {trip.title}
            </Text>
            <Text
              style={{
                fontFamily: F.medium,
                fontSize: 14,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {trip.place}
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: -28,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: C.canvas,
            paddingHorizontal: 20,
            paddingTop: 22,
            gap: 26,
          }}
        >
          {/* digital key */}
          <View
            style={[
              { borderRadius: R.xl, overflow: "hidden", padding: 20 },
              SH.navy,
            ]}
          >
            <LinearGradient
              colors={G.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Guilloche size={380} style={{ right: -190, top: -190 }} />
            <Row between align="flex-start">
              <View style={{ gap: 4, flex: 1 }}>
                <Badge
                  label={statusLabel}
                  tone={trip.status === "upcoming" ? "glass" : "green"}
                  dot
                />
                <Text
                  style={{
                    fontFamily: F.semibold,
                    fontSize: 12,
                    letterSpacing: 1.3,
                    color: C.skyLight,
                    marginTop: 12,
                  }}
                >
                  {pass.label}
                </Text>
                <Text
                  style={{
                    fontFamily: F.extrabold,
                    fontSize: 40,
                    letterSpacing: -1.4,
                    color: C.white,
                  }}
                >
                  {pass.big}
                </Text>
                <Text
                  style={{
                    fontFamily: F.medium,
                    fontSize: 13,
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  {pass.sub}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: C.white,
                  padding: 10,
                  borderRadius: 18,
                }}
              >
                <PassCode size={112} />
              </View>
            </Row>
            <Text
              style={{
                fontFamily: F.medium,
                fontSize: 12.5,
                color: "rgba(255,255,255,0.6)",
                marginTop: 16,
              }}
            >
              {pass.hint}
            </Text>
          </View>

          {/* stay facts */}
          <Card pad={0}>
            <Row style={{ padding: 18 }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Txt v="small">{stay ? "Check-in" : "Date"}</Txt>
                <Txt v="h3">{stay ? "Thu, 2 Oct" : day}</Txt>
                <Txt v="small">
                  {stay ? "from 2:00 PM" : KIND_LABEL[trip.kind]}
                </Txt>
              </View>
              <View
                style={{
                  width: 1,
                  alignSelf: "stretch",
                  backgroundColor: C.lineSoft,
                  marginHorizontal: 16,
                }}
              />
              <View style={{ flex: 1, gap: 3 }}>
                <Txt v="small">{stay ? "Check-out" : "Time"}</Txt>
                <Txt v="h3">{stay ? "Sat, 4 Oct" : (time ?? "All day")}</Txt>
                <Txt v="small">{stay ? "until 11:00 AM" : trip.detail}</Txt>
              </View>
            </Row>
            <Divider />
            <Row between style={{ padding: 18 }}>
              <Row gap={10}>
                <CalendarDays size={18} color={C.ink3} />
                <Txt v="body">Confirmation</Txt>
              </Row>
              <Text style={{ fontFamily: F.mono, fontSize: 14, color: C.ink }}>
                MBG-82K4QZ
              </Text>
            </Row>
          </Card>

          {/* guests */}
          <View style={{ gap: 14 }}>
            <SectionHead title="Guests" action={`${trip.guests} verified`} />
            <Card pad={16}>
              <Row gap={14}>
                <Avatar src="user" size={48} status="verified" />
                {FAMILY.slice(0, Math.max(1, trip.guests - 1)).map((m) => (
                  <Avatar
                    key={m.id}
                    src={m.image}
                    size={48}
                    status="verified"
                  />
                ))}
                <View style={{ flex: 1 }} />
                <Users size={18} color={C.ink4} />
              </Row>
            </Card>
          </View>

          {stay ? (
            <Group title="Stay services">
              <ListRow
                icon={Coffee}
                tone="sky"
                title="In-room dining"
                sub="Order to room 1208 · 24h"
              />
              <ListRow
                icon={Sparkles}
                tone="sky"
                title="Spa & wellness"
                sub="Book a treatment"
              />
              <ListRow
                icon={Car}
                tone="sky"
                title="Airport transfer"
                sub="Sat 4:30 AM · Confirmed"
                value="Booked"
              />
              <ListRow
                icon={Wifi}
                tone="sky"
                title="Wi-Fi"
                sub="MarineBay-Guest · auto-connected"
              />
              <ListRow
                icon={BellRing}
                tone="sky"
                title="Request housekeeping"
              />
            </Group>
          ) : (
            <Group title="Your visit">
              <ListRow
                icon={Map}
                tone="sky"
                title="Map & directions"
                sub={trip.place}
              />
              <ListRow
                icon={UtensilsCrossed}
                tone="sky"
                title="Food & drinks"
                sub="Order ahead, pay with your face"
              />
              <ListRow icon={Ticket} tone="sky" title="Add-ons & upgrades" />
            </Group>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/** @jsxImportSource react */
/**
 * UseCaseCarousel — Home-tab hero that shows what TruePas is for: hotels,
 * theme parks, cruises, attractions and family check-ins. Each slide is a
 * real photo (CC0, see assets/images/use-cases/CREDITS.md) graded toward the
 * active palette with a violet scrim, so the set reads as one on-brand series.
 *
 * Auto-advances every few seconds; a manual swipe restarts the timer.
 */
import { LinearGradient } from "expo-linear-gradient";
import {
  FerrisWheel,
  Hotel,
  Landmark,
  ScanFace,
  Ship,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { alpha, makeStyles, mix, useThemeTokens } from "@/theme";

/** Photos are exported at 1024×597 — keep the card at the same ratio. */
const ASPECT = 597 / 1024;
const AUTOPLAY_MS = 5000;

/** Photo colour grade — the theme's primary pulled toward royal blue, plus a
 *  deep navy for the scrims. */
function grade(primary: string) {
  const tint = mix(primary, "#1d4ed8", 0.15);
  return { tint, night: mix(tint, "#040a1c", 0.3) };
}

type Slide = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  Icon: LucideIcon;
  image: ImageSourcePropType;
};

const SLIDES: Slide[] = [
  {
    key: "hotel",
    eyebrow: "Hotels",
    title: "Check in without the queue",
    body: "A quick face scan at the desk and your room is ready.",
    Icon: Hotel,
    image: require("../../../assets/images/use-cases/hotel.jpg"),
  },
  {
    key: "park",
    eyebrow: "Theme parks",
    title: "Walk straight to the rides",
    body: "Your face is your park pass. No wristbands.",
    Icon: FerrisWheel,
    image: require("../../../assets/images/use-cases/park.jpg"),
  },
  {
    key: "cruise",
    eyebrow: "Cruises",
    title: "Board in seconds",
    body: "Skip the terminal line with your verified ID.",
    Icon: Ship,
    image: require("../../../assets/images/use-cases/cruise.jpg"),
  },
  {
    key: "attraction",
    eyebrow: "Attractions",
    title: "Your face is the ticket",
    body: "Museums, landmarks and tours: just walk in.",
    Icon: Landmark,
    image: require("../../../assets/images/use-cases/attraction.jpg"),
  },
  {
    key: "family",
    eyebrow: "Family",
    title: "Everyone checks in together",
    body: "Verify the whole family once, then go anywhere.",
    Icon: Users,
    image: require("../../../assets/images/use-cases/family.jpg"),
  },
];

export function UseCaseCarousel() {
  const styles = useCarouselStyles();
  const t = useThemeTokens();
  const scroller = useRef<ScrollView>(null);
  const dragging = useRef(false);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const { tint, night } = grade(t.colors.actionPrimary);
  const onPrimary = t.colors.onActionPrimary;

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(Math.round(e.nativeEvent.layout.width));

  const goTo = (i: number) => {
    scroller.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  // Restart the timer whenever the slide changes (auto or by swipe).
  useEffect(() => {
    if (width === 0) return;
    const id = setTimeout(() => {
      if (dragging.current) return;
      const next = (index + 1) % SLIDES.length;
      scroller.current?.scrollTo({ x: next * width, animated: true });
      setIndex(next);
    }, AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [index, width]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width === 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index && i >= 0 && i < SLIDES.length) setIndex(i);
  };

  const height = Math.round(width * ASPECT);

  return (
    <View style={styles.wrap}>
      <View style={styles.shadow}>
        <View style={styles.frame} onLayout={onLayout}>
          {width > 0 && (
            <ScrollView
              ref={scroller}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={32}
              onScrollBeginDrag={() => (dragging.current = true)}
              onScrollEndDrag={() => (dragging.current = false)}
              style={{ height }}
            >
              {SLIDES.map(({ key, eyebrow, title, body, Icon, image }) => (
                <View
                  key={key}
                  style={{ width, height }}
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={`${eyebrow}. ${title}. ${body}`}
                >
                  <Image
                    source={image}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                  {/* Colour grade: a light brand wash, then violet scrims
                      from the left and bottom so the caption always reads. */}
                  <View
                    pointerEvents="none"
                    style={[styles.fill, { backgroundColor: alpha(tint, 0.2) }]}
                  />
                  <LinearGradient
                    pointerEvents="none"
                    colors={[
                      alpha(night, 0.88),
                      alpha(night, 0.45),
                      alpha(night, 0),
                    ]}
                    locations={[0, 0.45, 0.8]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.fill}
                  />
                  <LinearGradient
                    pointerEvents="none"
                    colors={[alpha(night, 0), alpha(night, 0.7)]}
                    locations={[0.45, 1]}
                    style={styles.fill}
                  />
                  <View style={styles.verified} pointerEvents="none">
                    <ScanFace size={12} color={onPrimary} />
                    <Text style={styles.verifiedText}>Face verified</Text>
                  </View>
                  <View style={styles.caption} pointerEvents="none">
                    <View style={styles.eyebrow}>
                      <Icon size={12} color={onPrimary} />
                      <Text style={styles.eyebrowText}>{eyebrow}</Text>
                    </View>
                    <View style={styles.copy}>
                      <Text style={styles.title} numberOfLines={2}>
                        {title}
                      </Text>
                      <Text style={styles.body} numberOfLines={2}>
                        {body}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <Pressable
            key={s.key}
            accessibilityRole="button"
            accessibilityLabel={`Show ${s.eyebrow}`}
            hitSlop={8}
            onPress={() => goTo(i)}
          >
            <View style={[styles.dot, i === index && styles.dotActive]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const useCarouselStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing[3] },
  /* Shadow and clipping live on separate views — iOS drops the shadow of an overflow:hidden view. */
  shadow: {
    borderRadius: t.radii.xl,
    backgroundColor: grade(t.colors.actionPrimary).night,
    ...t.shadows.lg,
  },
  frame: {
    borderRadius: t.radii.xl,
    overflow: "hidden",
    minHeight: 120,
  },
  photo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  verified: {
    position: "absolute",
    top: t.spacing[4] + 2,
    right: t.spacing[4] + 2,
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[1],
    paddingHorizontal: t.spacing[2],
    paddingVertical: t.spacing[1],
    borderRadius: t.radii.full,
    backgroundColor: alpha(t.colors.success, 0.85),
  },
  verifiedText: {
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.onActionPrimary,
  },
  caption: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "66%",
    padding: t.spacing[4] + 2,
    justifyContent: "space-between",
  },
  eyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[1.5],
    paddingHorizontal: t.spacing[2] + 2,
    paddingVertical: t.spacing[1],
    borderRadius: t.radii.full,
    backgroundColor: alpha(t.colors.onActionPrimary, 0.16),
    borderWidth: 1,
    borderColor: alpha(t.colors.onActionPrimary, 0.22),
  },
  eyebrowText: {
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.semibold,
    letterSpacing: t.letterSpacing.caps,
    textTransform: "uppercase",
    color: t.colors.onActionPrimary,
  },
  copy: { gap: t.spacing[1] },
  title: {
    fontFamily: t.fontFamily.display.semibold,
    fontSize: t.fontSize.lg,
    lineHeight: t.fontSize.lg * t.lineHeight.snug,
    color: t.colors.onActionPrimary,
  },
  body: {
    fontSize: t.fontSize.xs,
    lineHeight: t.fontSize.xs * 1.45,
    color: alpha(t.colors.onActionPrimary, 0.8),
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: t.spacing[1.5],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.borderStrong,
  },
  dotActive: { width: 20, backgroundColor: t.colors.actionPrimary },
}));

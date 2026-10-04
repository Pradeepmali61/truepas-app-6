import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { AppIcon, type IconName } from "./AppIcon";
import { getNeuBoxShadow, getNeuColors, NEU_RADIUS, useNeuBase } from "./neumorphism";
import { tapHaptic } from '@/services/haptics';

type NeuButtonType = "elevated_soft" | "elevated_flat";

interface NeuButtonProps {
  label: string;
  onPress?: () => void;
  type?: NeuButtonType;
  disabled?: boolean;
  textClassName?: string;
  icon?: IconName;
  iconColor?: string;
  baseColor?: string;
}

const SHADOW_DISTANCE = 6;
const SHADOW_BLUR = 12;

export function NeuButton({
  label,
  onPress,
  type = "elevated_soft",
  disabled = false,
  textClassName = "",
  icon,
  iconColor,
  baseColor,
}: NeuButtonProps) {
  const themeBase = useNeuBase();
  const base = baseColor ?? themeBase;
  const colors = getNeuColors(base);
  const pressed = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  const handlePressIn = () => {
    pressed.value = withTiming(0.96, { duration: 90 });
  };
  const handlePressOut = () => {
    pressed.value = withTiming(1, { duration: 120 });
  };
  const handlePress = () => {
    if (Platform.OS !== "web") {
      tapHaptic();
    }
    onPress?.();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={[
          {
            padding: 16,
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: NEU_RADIUS,
            backgroundColor: colors.base,
            opacity: disabled ? 0.5 : 1,
          },
          Platform.OS === "web" ? ({ boxShadow: getNeuBoxShadow(base) } as any) : null,
          Platform.OS === "android" ? { elevation: 6 } : null,
        ]}>
        {Platform.OS === "ios" && (
          <>
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: NEU_RADIUS,
                  backgroundColor: colors.base,
                  shadowColor: colors.dark,
                  shadowOffset: { width: SHADOW_DISTANCE, height: SHADOW_DISTANCE },
                  shadowOpacity: 0.35,
                  shadowRadius: SHADOW_BLUR,
                },
              ]}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: NEU_RADIUS,
                  backgroundColor: colors.base,
                  shadowColor: colors.light,
                  shadowOffset: { width: -SHADOW_DISTANCE, height: -SHADOW_DISTANCE },
                  shadowOpacity: 0.85,
                  shadowRadius: SHADOW_BLUR,
                },
              ]}
            />
          </>
        )}
        {Platform.OS === "android" ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: NEU_RADIUS,
                backgroundColor: type === "elevated_soft" ? colors.fillStart : colors.fillEnd,
              },
            ]}
          />
        ) : (
          <LinearGradient
            colors={
              type === "elevated_soft"
                ? [colors.fillStart, colors.fillEnd]
                : [colors.fillEnd, colors.fillStart]
            }
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 0.8, y: 0.8 }}
            style={[StyleSheet.absoluteFill, { borderRadius: NEU_RADIUS }]}
          />
        )}
        {type === "elevated_flat" && (
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              right: 8,
              bottom: 8,
              borderRadius: NEU_RADIUS - 6,
              borderWidth: 1,
              borderTopColor: colors.light,
              borderLeftColor: colors.light,
              borderBottomColor: colors.dark,
              borderRightColor: colors.dark,
              overflow: "hidden",
            }}>
            {Platform.OS === "android" ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.pressedStart }]} />
            ) : (
              <LinearGradient
                colors={[colors.pressedStart, colors.pressedEnd]}
                start={{ x: 0.2, y: 0.2 }}
                end={{ x: 0.8, y: 0.8 }}
                style={StyleSheet.absoluteFill}
              />
            )}
          </View>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, zIndex: 10 }}>
          {icon ? <AppIcon name={icon} size={20} color={iconColor ?? colors.dark} /> : null}
          <Text allowFontScaling={false} style={{ fontSize: 18, fontWeight: "700", color: "#000000" }}>
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

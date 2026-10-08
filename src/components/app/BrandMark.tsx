import { Typography } from "@/components/ui/Typography";
import { makeStyles, useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { View } from "react-native";
import { TruepasIcon } from "./TruepasIcon";

export function BrandMark({ compact }: { compact?: boolean }) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View style={styles.brand}>
      <View style={styles.brandIcon}>
        <TruepasIcon size={compact ? iconSize.md : iconSize.lg} color={theme.colors.onActionPrimary} />
      </View>
      <Typography variant={compact ? "h4" : "h3"}>TruePas</Typography>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  brand: { flexDirection: "row", alignItems: "center", gap: t.spacing[2] },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
}));

import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Radio } from "lucide-react-native";
import { Txt } from "../components";
import { radius, spacing, Palette } from "../theme";
import { useTheme } from "../theme/ThemeContext";

/**
 * Presentational radar card for the active patrol. Tracking logic lives in
 * MissionScreen; this just visualises lock state + GPS point count.
 */
export function PatrolRadar({
  active,
  points,
  status,
}: {
  active: boolean;
  points: number;
  status: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [active]);

  return (
    <View style={styles.wrap}>
      <View style={styles.radar}>
        <Animated.View
          style={[styles.pulse, { transform: [{ scale: pulse }], opacity: active ? 0.18 : 0 }]}
        />
        <View style={styles.ring2} />
        <View style={[styles.core, active && styles.coreActive]}>
          <Radio color={active ? colors.accent : colors.inkMuted} size={44} />
        </View>
      </View>

      <Txt variant="bodySm" color={colors.inkMuted} style={{ textAlign: "center" }}>
        {status}
      </Txt>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Txt variant="eyebrow" color={colors.inkMuted}>GPS POINTS</Txt>
          <Txt variant="displayMd">{points}</Txt>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Txt variant="eyebrow" color={colors.inkMuted}>LOCK STATUS</Txt>
          <Txt variant="displayMd" color={active ? colors.success : colors.warning}>
            {active ? "LOCKED" : "IDLE"}
          </Txt>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  wrap: { alignItems: "center", gap: spacing.lg, paddingVertical: spacing.md },
  radar: { width: 220, height: 200, alignItems: "center", justifyContent: "center" },
  pulse: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: colors.accent },
  ring2: { position: "absolute", width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: colors.hairline },
  core: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  coreActive: { borderColor: colors.accent, backgroundColor: colors.surface3 },
  stats: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", width: "100%" },
  stat: { alignItems: "center", gap: spacing.xxs, flex: 1 },
  divider: { width: 1, height: 40, backgroundColor: colors.hairline },
});

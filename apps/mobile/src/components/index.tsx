import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { gradients, radius, spacing, type } from "../theme";
import { useTheme } from "../theme/ThemeContext";

/* ------------------------------------------------------------------ */
/* Screen — canvas wrapper                                             */
/* ------------------------------------------------------------------ */
export function Screen({
  children,
  scroll = true,
  contentStyle,
  edges = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: edges ? insets.top + spacing.sm : spacing.sm };
  const base = { flex: 1, backgroundColor: colors.canvas } as ViewStyle;
  const content = [{ padding: spacing.lg, paddingBottom: 120, gap: spacing.md }, pad, contentStyle];
  if (!scroll) {
    return <View style={[base, pad, contentStyle]}>{children}</View>;
  }
  return (
    <View style={base}>
      <ScrollView
        contentContainerStyle={content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */
type TxtVariant = keyof typeof type;
export function Txt({
  variant = "body",
  color,
  style,
  children,
  numberOfLines,
}: {
  variant?: TxtVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
}) {
  const { colors } = useTheme();
  const muted = variant === "bodySm" || variant === "caption" || variant === "eyebrow";
  const fallback = muted ? colors.inkMuted : colors.ink;
  return (
    <Text numberOfLines={numberOfLines} style={[type[variant], { color: color ?? fallback }, style]}>
      {children}
    </Text>
  );
}

export function Eyebrow({ children, color }: { children: ReactNode; color?: string }) {
  const { colors } = useTheme();
  return <Text style={[type.eyebrow, { color: color ?? colors.accent }]}>{children}</Text>;
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */
export function Card({
  children,
  style,
  surface = 1,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  surface?: 1 | 2 | 3;
  padded?: boolean;
}) {
  const { colors } = useTheme();
  const bg = surface === 3 ? colors.surface3 : surface === 2 ? colors.surface2 : colors.surface1;
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.hairline,
          padding: padded ? spacing.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* SpotlightCard — gradient atmosphere tile                            */
/* ------------------------------------------------------------------ */
export function SpotlightCard({
  children,
  variant = "violet",
  style,
}: {
  children: ReactNode;
  variant?: keyof typeof gradients;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <LinearGradient
      colors={gradients[variant]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: radius.xxl, padding: spacing.xl }, style]}
    >
      {children}
    </LinearGradient>
  );
}

/* ------------------------------------------------------------------ */
/* Button — pill                                                       */
/* ------------------------------------------------------------------ */
export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  style,
  full,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "accent";
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
}) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const palette: Record<string, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary },
    secondary: { bg: colors.surface2, fg: colors.ink, border: colors.hairline },
    accent: { bg: colors.accent, fg: "#ffffff" },
    danger: { bg: colors.danger, fg: "#ffffff" },
    ghost: { bg: "transparent", fg: colors.inkMuted, border: colors.hairline },
  };
  const p = palette[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          minHeight: 50,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.lg,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: p.bg,
          borderColor: p.border ?? p.bg,
          borderWidth: p.border ? 1 : 0,
        },
        full && { alignSelf: "stretch" },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        isDisabled && { opacity: 0.45 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs }}>
          {icon}
          <Text style={[type.button, { color: p.fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Field                                                               */
/* ------------------------------------------------------------------ */
export function Field({ label, style, ...rest }: TextInputProps & { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text style={[type.eyebrow, { color: colors.inkMuted }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.inkFaint}
        style={[
          {
            backgroundColor: colors.surface1,
            borderWidth: 1,
            borderColor: colors.hairline,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: 14,
            color: colors.ink,
            fontSize: 15,
            letterSpacing: -0.15,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* SegTabs — pill toggle                                               */
/* ------------------------------------------------------------------ */
export function SegTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.surface1,
        borderRadius: radius.pill,
        padding: 4,
        borderWidth: 1,
        borderColor: colors.hairline,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[
              { flex: 1, paddingVertical: 11, alignItems: "center", borderRadius: radius.pill },
              active && { backgroundColor: colors.surface3 },
            ]}
          >
            <Text style={[type.button, { color: active ? colors.ink : colors.inkMuted }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Chip                                                                */
/* ------------------------------------------------------------------ */
export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.hairline,
        backgroundColor: active ? colors.primary : colors.surface1,
        borderRadius: radius.pill,
        paddingVertical: 9,
        paddingHorizontal: 14,
      }}
    >
      <Text style={[type.bodySm, { color: active ? colors.onPrimary : colors.inkMuted, fontWeight: "600" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* StatusBadge                                                         */
/* ------------------------------------------------------------------ */
export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "danger" | "warning" | "accent" | "neutral";
}) {
  const { colors } = useTheme();
  const toneColor =
    tone === "success" ? colors.success
    : tone === "danger" ? colors.danger
    : tone === "warning" ? colors.warning
    : tone === "accent" ? colors.accent
    : colors.inkMuted;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: radius.pill,
        borderWidth: 1,
        alignSelf: "flex-start",
        backgroundColor: toneColor + "1f",
        borderColor: toneColor + "55",
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: toneColor }} />
      <Text style={[type.caption, { color: toneColor, letterSpacing: 1 }]}>{label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Divider                                                             */
/* ------------------------------------------------------------------ */
export function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.hairline, marginVertical: spacing.sm }} />;
}

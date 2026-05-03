// ─────────────────────────────────────────────
//  StaySync dark theme design system
//  Import from any screen: import { colors, T } from '../theme'
// ─────────────────────────────────────────────

export const colors = {
  bg:          "#0A0A0F",
  bgSecondary: "#14141E",
  card:        "#1A1A1A",
  cardBorder:  "#2A2A2A",
  surface:     "#222222",
  input:       "#1E1E1E",
  inputBorder: "#333333",

  accent:      "#8B5CF6",
  accentGlow:  "rgba(139,92,246,0.2)",

  primary:     "#6C63FF",
  primaryLight: "#A7A0FF",
  primaryDark: "#5A52D5",
  primaryGlow: "rgba(108,99,255,0.18)",

  textPrimary:   "#FFFFFF",
  textSecondary: "#B0B0B0",
  textMuted:     "#666666",
  placeholder:   "#555555",

  success: "#10b981",
  successBg: "rgba(16,185,129,0.12)",
  successBorder: "rgba(16,185,129,0.3)",
  warning: "#f59e0b",
  warningBg: "rgba(245,158,11,0.12)",
  warningBorder: "rgba(245,158,11,0.3)",
  error:   "#ef4444",
  errorBg: "rgba(239,68,68,0.12)",
  errorBorder: "rgba(239,68,68,0.3)",
  info:    "#5bc8ff",
  infoBg:  "rgba(91,200,255,0.12)",
};

// Shared component styles
export const T = {
  // Screen container
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Page title
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },

  // Cards
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 18,
    marginBottom: 14,
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Label above input
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  // Text inputs
  input: {
    backgroundColor: colors.input,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 18,
  },

  // Primary solid button
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Ghost/outline button
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  outlineBtnText: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 16,
  },

  // Status badges
  badgePending:  { backgroundColor: "rgba(245,158,11,0.15)", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" },
  badgeApproved: { backgroundColor: "rgba(16,185,129,0.15)", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: "rgba(16,185,129,0.3)" },
  badgeRejected: { backgroundColor: "rgba(239,68,68,0.15)",  paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  badgeTextPending:  { color: "#f59e0b", fontWeight: "bold", fontSize: 11 },
  badgeTextApproved: { color: "#10b981", fontWeight: "bold", fontSize: 11 },
  badgeTextRejected: { color: "#ef4444", fontWeight: "bold", fontSize: 11 },
};

export const getStatusBadge = (status) => {
  const s = String(status || "pending").toLowerCase();
  if (s === "approved" || s === "completed" || s === "done" || s === "resolved")
    return { badge: T.badgeApproved, text: T.badgeTextApproved };
  if (s === "rejected" || s === "dismissed")
    return { badge: T.badgeRejected, text: T.badgeTextRejected };
  return { badge: T.badgePending, text: T.badgeTextPending };
};

// Animation Helpers
import { Animated } from 'react-native';

export const createFadeSlide = (fadeAnim, slideAnim, delay = 0) => {
  return Animated.sequence([
    Animated.delay(delay),
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]),
  ]);
};

export const createPressAnim = (scaleAnim, isPressed) => {
  return Animated.spring(scaleAnim, {
    toValue: isPressed ? 0.95 : 1,
    friction: 5,
    tension: 100,
    useNativeDriver: true,
  });
};

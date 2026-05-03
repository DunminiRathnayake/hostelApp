import React, { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

const { width, height } = Dimensions.get("window");

const FEATURES = [
  { icon: "wallet-outline",    label: "Payments"   },
  { icon: "chatbubble-outline", label: "Complaints" },
  { icon: "qr-code-outline",   label: "QR Access"  },
  { icon: "bed-outline",       label: "Rooms"      },
];

// Particle dots for background depth
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: Math.random() * width,
  y: Math.random() * height * 0.6,
  size: Math.random() * 3 + 1,
  delay: i * 200,
  duration: 3000 + Math.random() * 2000,
}));

function Particle({ x, y, size, delay, duration }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.6, 0] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  return (
    <Animated.View
      style={{
        position: "absolute", left: x, top: y,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: "rgba(108,99,255,0.8)",
        opacity, transform: [{ translateY }],
      }}
    />
  );
}

export default function LandingScreen() {
  const router = useRouter();

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(60)).current;
  const scaleAnim  = useRef(new Animated.Value(0.7)).current;
  const logoGlow   = useRef(new Animated.Value(0)).current;
  const btnLoginAnim    = useRef(new Animated.Value(0)).current;
  const btnRegAnim      = useRef(new Animated.Value(0)).current;
  const btnVisAnim      = useRef(new Animated.Value(0)).current;
  const headlineFade    = useRef(new Animated.Value(0)).current;
  
  // Press animations
  const loginPressScale = useRef(new Animated.Value(1)).current;
  const regPressScale   = useRef(new Animated.Value(1)).current;
  const visPressScale   = useRef(new Animated.Value(1)).current;
  const blob1Anim  = useRef(new Animated.Value(0)).current;
  const blob2Anim  = useRef(new Animated.Value(0)).current;
  const blob3Anim  = useRef(new Animated.Value(0)).current;
  const pillAnims  = FEATURES.map(() => useRef(new Animated.Value(0)).current);
  const ringAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Background blob pulses
    const makeBlobLoop = (anim, duration) =>
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
      ]));
    makeBlobLoop(blob1Anim, 3800).start();
    makeBlobLoop(blob2Anim, 4600).start();
    makeBlobLoop(blob3Anim, 5200).start();

    // Logo glow ring pulse
    const glowLoop = Animated.loop(Animated.sequence([
      Animated.timing(logoGlow,  { toValue: 1,   duration: 1800, useNativeDriver: true }),
      Animated.timing(logoGlow,  { toValue: 0.2, duration: 1800, useNativeDriver: true }),
    ]));

    // Ring scale pulse
    const ringLoop = Animated.loop(Animated.sequence([
      Animated.timing(ringAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(ringAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ]));

    // Main entrance sequence
    Animated.sequence([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 55, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(headlineFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 45, useNativeDriver: true }),
      ]),
      Animated.stagger(90, pillAnims.map(a =>
        Animated.spring(a, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true })
      )),
      Animated.stagger(80, [
        Animated.spring(btnLoginAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
        Animated.spring(btnRegAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
        Animated.spring(btnVisAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      ]),
    ]).start(() => {
      glowLoop.start();
      ringLoop.start();
    });
  }, []);

  const blob1Scale    = blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const blob2Scale    = blob2Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const blob3Scale    = blob3Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const glowOpacity   = logoGlow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.75] });
  const ringScale     = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const ringOpacity   = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const logoFloatY    = logoGlow.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#08081A", "#0D0D22", "#0A0818"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Ambient blobs */}
      <Animated.View style={[styles.blob, styles.blob1, { transform: [{ scale: blob1Scale }] }]} />
      <Animated.View style={[styles.blob, styles.blob2, { transform: [{ scale: blob2Scale }] }]} />
      <Animated.View style={[styles.blob, styles.blob3, { transform: [{ scale: blob3Scale }] }]} />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

      {/* Grid overlay for texture */}
      <View style={styles.gridOverlay} pointerEvents="none" />

      <View style={styles.content}>
        {/* Logo with rings */}
        <Animated.View style={[styles.logoWrap, {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateY: logoFloatY }],
        }]}>
          {/* Outer ping ring */}
          <Animated.View style={[styles.logoRingOuter, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
          {/* Glow halo */}
          <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
          {/* Logo circle */}
          <LinearGradient
            colors={["#7B72FF", "#6C63FF", "#5A52D5"]}
            style={styles.logoCircle}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons name="home" size={42} color="#fff" />
          </LinearGradient>
          {/* Accent dot */}
          <View style={styles.logoDot} />
        </Animated.View>

        {/* Headline */}
        <Animated.View style={[styles.headline, { opacity: headlineFade, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.appName}>Staytra</Text>
          <View style={styles.taglineRow}>
            <LinearGradient colors={["transparent", "rgba(108,99,255,0.6)", "transparent"]} style={styles.taglineLine} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Text style={styles.tagline}>HOSTEL MANAGEMENT</Text>
            <LinearGradient colors={["transparent", "rgba(108,99,255,0.6)", "transparent"]} style={styles.taglineLine} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          </View>
          <Text style={styles.description}>
            Manage your hostel life with ease.{"\n"}Payments, rooms, complaints — all in one place.
          </Text>
        </Animated.View>

        {/* Feature pills */}
        <View style={styles.pillsRow}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.label}
              style={[styles.pill, {
                opacity: pillAnims[i],
                transform: [{
                  scale: pillAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                }],
              }]}
            >
              <View style={styles.pillInner}>
                <View style={styles.pillIconDot}>
                  <Ionicons name={f.icon} size={14} color={colors.primary} />
                </View>
                <Text style={styles.pillText}>{f.label}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* CTA Buttons */}
        <View style={styles.btnGroup}>
          <Animated.View style={{
            opacity: btnLoginAnim,
            transform: [{ translateY: btnLoginAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: loginPressScale }],
          }}>
            <TouchableOpacity
              style={styles.loginBtn}
              activeOpacity={1}
              onPressIn={() => Animated.spring(loginPressScale, { toValue: 0.95, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(loginPressScale, { toValue: 1, useNativeDriver: true }).start()}
              onPress={() => router.push("/(auth)/login")}
            >
              <LinearGradient
                colors={["#7B72FF", "#6C63FF", "#5A52D5"]}
                style={styles.loginBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name="log-in-outline" size={19} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.loginBtnText}>Sign In</Text>
                <View style={styles.btnArrow}>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{
            opacity: btnRegAnim,
            transform: [{ translateY: btnRegAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: regPressScale }],
          }}>
            <TouchableOpacity
              style={styles.registerBtn}
              activeOpacity={1}
              onPressIn={() => Animated.spring(regPressScale, { toValue: 0.95, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(regPressScale, { toValue: 1, useNativeDriver: true }).start()}
              onPress={() => router.push("/(auth)/register")}
            >
              <LinearGradient
                colors={["rgba(108,99,255,0.12)", "rgba(108,99,255,0.05)"]}
                style={styles.registerBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name="person-add-outline" size={19} color={colors.primaryLight} style={{ marginRight: 10 }} />
                <Text style={styles.registerBtnText}>Create Account</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{
            opacity: btnVisAnim,
            transform: [{ translateY: btnVisAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: visPressScale }],
          }}>
            <TouchableOpacity
              style={styles.visitorBtn}
              activeOpacity={1}
              onPressIn={() => Animated.spring(visPressScale, { toValue: 0.95, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(visPressScale, { toValue: 1, useNativeDriver: true }).start()}
              onPress={() => router.push("/(visitor)/dashboard")}
            >
              <Text style={styles.visitorBtnText}>Continue as Visitor</Text>
              <Ionicons name="chevron-forward" size={14} color="#A0A0C0" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerDot} />
        <Text style={styles.footerText}>StaySync © 2025</Text>
        <View style={styles.footerDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },

  blob: { position: "absolute", borderRadius: 999 },
  blob1: {
    width: 380, height: 380,
    backgroundColor: "rgba(108,99,255,0.13)",
    top: -120, right: -130,
  },
  blob2: {
    width: 300, height: 300,
    backgroundColor: "rgba(155,143,255,0.09)",
    bottom: 60, left: -120,
  },
  blob3: {
    width: 200, height: 200,
    backgroundColor: "rgba(255,107,157,0.06)",
    top: "40%", right: -80,
  },

  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    // subtle visual texture implied via transparency
  },

  // Logo
  logoWrap: { alignItems: "center", justifyContent: "center", marginBottom: 38 },
  logoRingOuter: {
    position: "absolute", width: 150, height: 150, borderRadius: 75,
    borderWidth: 1.5, borderColor: "rgba(108,99,255,0.5)",
  },
  logoGlow: {
    position: "absolute", width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(108,99,255,0.28)",
  },
  logoCircle: {
    width: 92, height: 92, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#6C63FF", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7, shadowRadius: 22, elevation: 14,
  },
  logoDot: {
    position: "absolute", top: 6, right: 6,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#10d9a0",
    borderWidth: 2, borderColor: "#0A0A0F",
  },

  // Headline
  headline: { alignItems: "center", marginBottom: 30 },
  appName: {
    fontSize: 50, fontWeight: "900", color: "#F2F2FF",
    letterSpacing: -2, textAlign: "center",
    textShadowColor: "rgba(108,99,255,0.4)",
    textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 16,
  },
  taglineRow: { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 18, width: "100%" },
  taglineLine: { flex: 1, height: 1 },
  tagline: {
    fontSize: 10, fontWeight: "800", color: colors.primaryLight,
    letterSpacing: 3, marginHorizontal: 12,
  },
  description: { fontSize: 14.5, color: "#7878A0", textAlign: "center", lineHeight: 24 },

  // Pills
  pillsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 40 },
  pill: { borderRadius: 24 },
  pillInner: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: "rgba(108,99,255,0.1)",
    borderRadius: 24, borderWidth: 1, borderColor: "rgba(108,99,255,0.2)",
  },
  pillIconDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(108,99,255,0.18)",
    alignItems: "center", justifyContent: "center", marginRight: 7,
  },
  pillText: { fontSize: 12, color: "#C0C0E0", fontWeight: "700" },

  // Buttons
  btnGroup: { width: "100%", gap: 12 },
  loginBtn: { borderRadius: 18, overflow: "hidden" },
  loginBtnGrad: {
    paddingVertical: 17, alignItems: "center", justifyContent: "center",
    flexDirection: "row", paddingHorizontal: 24,
  },
  loginBtnText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  btnArrow: {
    position: "absolute", right: 20,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },

  registerBtn: { borderRadius: 18, overflow: "hidden", borderWidth: 1.5, borderColor: "rgba(108,99,255,0.35)" },
  registerBtnGrad: {
    paddingVertical: 16, alignItems: "center", justifyContent: "center", flexDirection: "row",
  },
  registerBtnText: { color: colors.primaryLight, fontWeight: "700", fontSize: 16 },

  visitorBtn: { paddingVertical: 10, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  visitorBtnText: { color: "#A0A0C0", fontSize: 14, letterSpacing: 0.2 },

  // Footer
  footer: {
    position: "absolute", bottom: 28, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  footerDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#2A2A40" },
  footerText: { color: "#2E2E42", fontSize: 11, letterSpacing: 0.5 },
});

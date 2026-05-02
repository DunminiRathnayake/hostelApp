import React, { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, StatusBar, ImageBackground
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

const { width, height } = Dimensions.get("window");

export default function LandingScreen() {
  const router = useRouter();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
      Animated.timing(btnAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1920&q=80' }} 
      style={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <LinearGradient
        colors={["rgba(13,13,13,0.3)", "rgba(17,13,43,0.7)", "rgba(26,16,64,0.9)"]}
        style={styles.gradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Decorative blobs */}
        <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      {/* Logo / Icon */}
      <Animated.View style={[styles.logoWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient colors={["#6C63FF", "#9c94ff"]} style={styles.logoCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="home" size={44} color="#fff" />
        </LinearGradient>
      </Animated.View>

      {/* Headline */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: "center" }}>
        <Text style={styles.appName}>Staytra</Text>
        <Text style={styles.tagline}>Hostel Management</Text>
        <Text style={styles.description}>
          Manage your hostel life easily and securely.{"\n"}Payments, rooms, complaints — all in one place.
        </Text>
      </Animated.View>

      {/* Feature pills */}
      <Animated.View style={[styles.pillsRow, { opacity: fadeAnim }]}>
        {[
          { icon: "wallet-outline", label: "Payments" },
          { icon: "chatbubble-outline", label: "Complaints" },
          { icon: "qr-code-outline", label: "QR Access" },
          { icon: "bed-outline", label: "Rooms" },
        ].map((f) => (
          <View key={f.label} style={styles.pill}>
            <Ionicons name={f.icon} size={16} color="#6C63FF" />
            <Text style={styles.pillText}>{f.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={[styles.btnGroup, { opacity: btnAnim }]}>
        <TouchableOpacity
          style={styles.loginBtn}
          activeOpacity={0.85}
          onPress={() => router.push("/(auth)/login")}
        >
          <LinearGradient colors={["#6C63FF", "#8B85FF"]} style={styles.loginBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.loginBtnText}>Login</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerBtn}
          activeOpacity={0.85}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.registerBtnText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.visitorBtn}
          activeOpacity={0.85}
          onPress={() => router.push("/(visitor)/dashboard")}
        >
          <Text style={styles.visitorBtnText}>Continue as Visitor</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.footer}>StaySync © 2025 · All rights reserved</Text>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  gradient: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },

  // Decorative circles
  blob: { position: "absolute", borderRadius: 999, opacity: 0.12 },
  blob1: { width: 280, height: 280, backgroundColor: "#6C63FF", top: -60, right: -80 },
  blob2: { width: 200, height: 200, backgroundColor: "#9c94ff", bottom: 80, left: -60 },

  // Logo
  logoWrap: { marginBottom: 30 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 28, alignItems: "center", justifyContent: "center",
    shadowColor: "#6C63FF", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8
  },

  // Text
  appName: { fontSize: 40, fontWeight: "900", color: "#fff", letterSpacing: 1, textAlign: "center" },
  tagline: { fontSize: 16, fontWeight: "600", color: "#9c94ff", marginTop: 4, marginBottom: 16, textAlign: "center" },
  description: { fontSize: 15, color: "#B0B0B0", textAlign: "center", lineHeight: 24 },

  // Feature pills
  pillsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 28, marginBottom: 40 },
  pill: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(108,99,255,0.12)",
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: "rgba(108,99,255,0.3)"
  },
  pillText: { color: "#B0B0B0", fontSize: 13, marginLeft: 6 },

  // Buttons
  btnGroup: { width: "100%", gap: 14 },
  loginBtn: { borderRadius: 16, overflow: "hidden" },
  loginBtnGrad: { paddingVertical: 16, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  loginBtnText: { color: "#fff", fontWeight: "bold", fontSize: 17 },

  registerBtn: { borderWidth: 1.5, borderColor: "rgba(108,99,255,0.5)", borderRadius: 16, paddingVertical: 15, alignItems: "center" },
  registerBtnText: { color: "#9c94ff", fontWeight: "bold", fontSize: 17 },

  visitorBtn: { paddingVertical: 8, alignItems: "center" },
  visitorBtnText: { color: "#B0B0B0", fontSize: 15, textDecorationLine: "underline" },

  footer: { position: "absolute", bottom: 24, color: "#444", fontSize: 12 },
});

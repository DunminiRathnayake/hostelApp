import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Animated, StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, T } from "../theme";
import API from "../services/api";

const MENU_ITEMS = [
  { title: "Payments",         icon: "card-outline",          route: "/(app)/payments",  color: colors.primary,  bg: "rgba(108,99,255,0.12)" },
  { title: "Complaints",       icon: "alert-circle-outline",  route: "/(app)/complaints", color: colors.error,   bg: "rgba(255,90,90,0.1)"   },
  { title: "Cleaning",         icon: "sparkles-outline",      route: "/(app)/cleaning",  color: colors.success,  bg: "rgba(16,217,160,0.1)"  },
  { title: "Check-ins",        icon: "time-outline",          route: "/(app)/history",   color: "#5BC8FF",       bg: "rgba(91,200,255,0.1)"  },
  { title: "Reviews",          icon: "star-outline",          route: "/(app)/reviews",   color: colors.warning,  bg: "rgba(245,166,35,0.1)"  },
  { title: "My Profile",       icon: "person-circle-outline", route: "/(app)/profile",   color: "#A78BFA",       bg: "rgba(167,139,250,0.1)" },
];

function AnimatedMenuCard({ item, index, onPress }) {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 350,
      delay: 300 + index * 70,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn  = () => Animated.spring(scale, { toValue: 0.94, friction: 8, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1,    friction: 6, useNativeDriver: true }).start();

  return (
    <Animated.View style={[
      styles.menuCardWrap,
      {
        opacity: anim,
        transform: [
          { scale },
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
        ],
      },
    ]}>
      <TouchableOpacity
        style={styles.menuCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
          <Ionicons name={item.icon} size={26} color={item.color} />
        </View>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Ionicons name="chevron-forward" size={13} color="#33334A" style={{ marginTop: 2 }} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function StatCard({ icon, value, label, color, delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay, friction: 6, tension: 60, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[
      styles.statCard,
      { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] },
    ]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const [user, setUser]               = useState(null);
  const [cleaningTask, setCleaningTask] = useState(undefined);
  const router                        = useRouter();

  const headerAnim    = useRef(new Animated.Value(0)).current;
  const cleaningAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadUser();
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(cleaningAnim, { toValue: 1, duration: 500, delay: 250, useNativeDriver: true }),
    ]).start();

    // Pulse the online dot
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.4, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
      const res = await API.get("/cleaning/student-tasks");
      setCleaningTask(res.data?.length > 0 ? res.data[0] : null);
    } catch {
      setCleaningTask(null);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    router.replace("/(auth)");
  };

  const initials = (user?.fullName || user?.name || "U")
    .split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SafeAreaView style={[T.screen, { flex: 1 }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        }]}>
          <LinearGradient colors={["rgba(108,99,255,0.12)", "transparent"]} style={styles.headerGradBg} />
          <View style={styles.headerContent}>
            <View>
              <View style={styles.greetingRow}>
                <Animated.View style={[styles.onlineDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.greetingText}>{greeting()}</Text>
              </View>
              <Text style={styles.userName}>{user?.fullName || user?.name || "Student"}</Text>
              {user?.roomNumber && (
                <View style={styles.roomBadge}>
                  <Ionicons name="bed-outline" size={11} color={colors.primary} />
                  <Text style={styles.roomBadgeText}>Room {user.roomNumber}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={() => router.push("/(app)/profile")}
              >
                <LinearGradient colors={["#7B72FF", "#5A52D5"]} style={styles.avatarGrad}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
                <View style={styles.avatarBadge} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ── Stat Row ── */}
        <View style={styles.statRow}>
          <StatCard icon="card-outline"       value="LKR 9,500" label="Due This Month" color={colors.warning} delay={150} />
          <StatCard icon="checkmark-circle-outline" value="12"  label="Check-Ins"      color={colors.success} delay={220} />
          <StatCard icon="star-outline"       value="4.8"       label="Your Rating"    color={colors.primary} delay={290} />
        </View>

        {/* ── Cleaning Card ── */}
        <Animated.View style={[styles.cleaningWrap, {
          opacity: cleaningAnim,
          transform: [{ translateY: cleaningAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/(app)/cleaning")}
          >
            <LinearGradient
              colors={
                cleaningTask
                  ? ["rgba(16,217,160,0.14)", "rgba(16,217,160,0.06)"]
                  : ["rgba(30,30,46,0.9)", "rgba(20,20,36,0.9)"]
              }
              style={styles.cleaningCard}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.cleaningTop}>
                <View style={styles.cleaningLabelRow}>
                  {cleaningTask && <View style={styles.liveDot} />}
                  <Text style={styles.cleaningLabel}>
                    {cleaningTask ? "TODAY'S CLEANING TASK" : "CLEANING SCHEDULE"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={cleaningTask ? colors.success : colors.textMuted} />
              </View>

              {cleaningTask === undefined ? (
                <Text style={styles.cleaningLoading}>Loading…</Text>
              ) : cleaningTask ? (
                <View>
                  <Text style={styles.cleaningArea}>{cleaningTask.area}</Text>
                  <View style={styles.cleaningMeta}>
                    <View style={styles.cleaningBadge}>
                      <Text style={styles.cleaningBadgeText}>
                        Group {new Date().getDay() === 0 ? 7 : new Date().getDay()}
                      </Text>
                    </View>
                    <Text style={styles.cleaningMetaText}>Assigned to you</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.cleaningNoTask}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.textMuted} />
                  <Text style={styles.cleaningNoText}>No cleaning task today — enjoy your day!</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Quick Access Grid ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item, index) => (
            <AnimatedMenuCard
              key={item.title}
              item={item}
              index={index}
              onPress={() => router.push(item.route)}
            />
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_W = "47%";

const styles = StyleSheet.create({
  scroll: { paddingBottom: 30 },

  // Header
  header: { position: "relative", marginBottom: 16 },
  headerGradBg: { position: "absolute", inset: 0, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerContent: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
  },
  greetingRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 7 },
  greetingText: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
  userName: { fontSize: 24, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  roomBadge: {
    flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6,
    backgroundColor: colors.primaryGlow, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, alignSelf: "flex-start",
  },
  roomBadgeText: { fontSize: 11, color: colors.primary, fontWeight: "700" },
  headerRight: { alignItems: "flex-end", gap: 10 },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.errorBg,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,90,90,0.2)",
  },
  avatarCircle: { position: "relative" },
  avatarGrad: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2.5, borderColor: "rgba(108,99,255,0.4)",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  avatarBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 13, height: 13, borderRadius: 6.5,
    backgroundColor: colors.success, borderWidth: 2, borderColor: colors.bg,
  },

  // Stats
  statRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: colors.card,
    borderRadius: 16, padding: 13, alignItems: "flex-start",
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  statIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 17, fontWeight: "800", marginBottom: 2 },
  statLabel: { fontSize: 9.5, color: colors.textMuted, fontWeight: "700", letterSpacing: 0.4 },

  // Cleaning card
  cleaningWrap: { paddingHorizontal: 20, marginBottom: 22 },
  cleaningCard: { borderRadius: 22, padding: 20, borderWidth: 1, borderColor: "rgba(16,217,160,0.18)" },
  cleaningTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cleaningLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.success },
  cleaningLabel: { fontSize: 10, fontWeight: "800", color: colors.success, letterSpacing: 1.2 },
  cleaningArea: { fontSize: 22, fontWeight: "800", color: colors.textPrimary, marginBottom: 10 },
  cleaningMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  cleaningBadge: {
    backgroundColor: "rgba(16,217,160,0.18)", paddingHorizontal: 12,
    paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: "rgba(16,217,160,0.28)",
  },
  cleaningBadgeText: { color: colors.success, fontWeight: "800", fontSize: 12 },
  cleaningMetaText: { color: colors.textSecondary, fontSize: 13 },
  cleaningLoading: { color: colors.textMuted, fontSize: 14 },
  cleaningNoTask: { flexDirection: "row", alignItems: "center", gap: 8 },
  cleaningNoText: { color: colors.textSecondary, fontSize: 14 },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 14, gap: 12 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.2 },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.cardBorder },

  // Menu grid
  menuGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10 },
  menuCardWrap: { width: CARD_W },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  menuIconWrap: {
    width: 54, height: 54, borderRadius: 17,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  menuTitle: { fontSize: 13, fontWeight: "700", color: colors.textSecondary, textAlign: "center" },
});

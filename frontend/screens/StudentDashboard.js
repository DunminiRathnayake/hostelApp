import React, { useContext, useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, Animated } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T, createFadeSlide, createPressAnim } from "../theme";
import { LinearGradient } from "expo-linear-gradient";

// ─── Defined outside the parent so React never remounts them on re-renders ───

function StatCard({ title, count, icon, color, animValue }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[styles.statCardContainer, {
      opacity: animValue,
      transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: scaleAnim }]
    }]}>
      <TouchableOpacity
        style={styles.statCard}
        activeOpacity={1}
        onPressIn={() => createPressAnim(scaleAnim, true).start()}
        onPressOut={() => createPressAnim(scaleAnim, false).start()}
      >
        <LinearGradient colors={[`${color}20`, `${color}05`]} style={StyleSheet.absoluteFill} />
        <View style={[styles.statIconContainer, { backgroundColor: `${color}30` }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.statCount}>{count}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function NavCard({ btn, animValue, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[styles.navCardContainer, {
      opacity: animValue,
      transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: scaleAnim }]
    }]}>
      <TouchableOpacity
        style={styles.navCard}
        onPress={onPress}
        activeOpacity={1}
        onPressIn={() => createPressAnim(scaleAnim, true).start()}
        onPressOut={() => createPressAnim(scaleAnim, false).start()}
      >
        <View style={[styles.navIconContainer, { backgroundColor: `${btn.color}20` }]}>
          <Ionicons name={btn.icon} size={26} color={btn.color} />
        </View>
        <Text style={styles.navText}>{btn.title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function StudentDashboard({ user }) {
  const router = useRouter();
  const { logout } = useContext(AuthContext);
  
  const [stats, setStats] = useState({ payments: 0, complaints: 0, appointments: 0 });
  const [cleaningTask, setCleaningTask] = useState(undefined);
  const [loading, setLoading] = useState(true);

  // Animations
  const headerFade  = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const cardsFade   = useRef(new Animated.Value(0)).current;
  const cardsSlide  = useRef(new Animated.Value(30)).current;

  // Fixed: store all anim values in a single ref array (no hooks-in-loop violation)
  const statAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const navAnims  = useRef([0, 1, 2, 3, 4, 5, 6].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    fetchMyStats();
    
    Animated.sequence([
      createFadeSlide(headerFade, headerSlide, 0),
      Animated.parallel([
        Animated.timing(cardsFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(cardsSlide, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
      ]),
      Animated.stagger(100, statAnims.map(anim => 
        Animated.spring(anim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true })
      )),
      Animated.stagger(50, navAnims.map(anim => 
        Animated.spring(anim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true })
      ))
    ]).start();
  }, []);

  const fetchMyStats = async () => {
    try {
      const results = await Promise.allSettled([
        API.get("/payments/my"),
        API.get("/complaints/my-complaints"),
        API.get("/cleaning/student-tasks"),
        API.get("/bookings/mybookings")
      ]);

      const paymentsRes = results[0].status === "fulfilled" ? results[0].value : null;
      const complaintsRes = results[1].status === "fulfilled" ? results[1].value : null;
      const cleaningRes = results[2].status === "fulfilled" ? results[2].value : null;
      const bookingsRes = results[3].status === "fulfilled" ? results[3].value : null;

      setStats({
        payments: paymentsRes?.data?.length || 0,
        complaints: (complaintsRes?.data?.complaints || []).length,
        appointments: (bookingsRes?.data || []).filter(b => b.status === "approved").length
      });
      setCleaningTask(cleaningRes?.data && cleaningRes.data.length > 0 ? cleaningRes.data[0] : null);
    } catch (err) {
      console.log("Failed to load metrics/cleaning:", err);
      setCleaningTask(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)");
  };

  const navButtons = [
    { title: "My QR", route: "/(app)/(tabs)/qr", icon: "qr-code", color: "#8B5CF6" },
    { title: "Profile", route: "/(app)/profile", icon: "person", color: "#EC4899" },
    { title: "Payments", route: "/(app)/payments", icon: "wallet", color: "#10B981" },
    { title: "Complaints", route: "/(app)/complaints", icon: "chatbubbles", color: "#F59E0B" },
    { title: "Cleaning", route: "/(app)/cleaning", icon: "sparkles", color: "#3B82F6" },
    { title: "Check-ins", route: "/(app)/history", icon: "log-in", color: "#06B6D4" },
    { title: "Reviews", route: "/(app)/reviews", icon: "star", color: "#F43F5E" },
  ];

  const cleaningScale = useRef(new Animated.Value(1)).current;
  const initial = (user?.name || user?.fullName || "S").charAt(0).toUpperCase();

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <Animated.View style={[styles.headerBar, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={[colors.primaryLight, colors.primaryDark]} style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
          <View>
            <Text style={styles.headerGreeting}>Welcome back,</Text>
            <Text style={styles.headerName}>{user?.name || user?.fullName || "Student"}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerLogout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: cardsFade, transform: [{ translateY: cardsSlide }] }}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 16 }} />
              <Text style={styles.loadingText}>Loading your stats...</Text>
            </View>
          ) : (
            <>
              <Animated.View style={{ transform: [{ scale: cleaningScale }] }}>
                <TouchableOpacity 
                  style={[styles.cleaningCard, cleaningTask ? styles.cleaningActive : styles.cleaningIdle]}
                  onPress={() => router.push("/(app)/cleaning")}
                  activeOpacity={1}
                  onPressIn={() => createPressAnim(cleaningScale, true).start()}
                  onPressOut={() => createPressAnim(cleaningScale, false).start()}
                >
                  <View style={styles.cleaningHeader}>
                    <View style={styles.cleaningTitleRow}>
                      <View style={[styles.cleaningIconBox, cleaningTask ? styles.cleaningIconActive : styles.cleaningIconIdle]}>
                        <Ionicons name="sparkles" size={20} color={cleaningTask ? colors.success : colors.textMuted} />
                      </View>
                      <Text style={styles.cleaningCardTitle}>Today's Cleaning</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                  
                  {cleaningTask === undefined ? (
                     <Text style={styles.cleaningStatusText}>Loading...</Text>
                  ) : cleaningTask ? (
                    <View style={styles.cleaningActiveContent}>
                      <Text style={styles.cleaningAreaText}>{cleaningTask.area}</Text>
                      <View style={styles.cleaningGroupBadge}>
                        <Text style={styles.cleaningGroupText}>Group {new Date().getDay() === 0 ? 7 : new Date().getDay()}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.cleaningIdleContent}>
                      <Text style={styles.cleaningStatusText}>No cleaning task assigned for today.</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.statsGrid}>
                <StatCard title="Payments" count={stats.payments} icon="cash" color={colors.success} animValue={statAnims[0]} />
                <StatCard title="Complaints" count={stats.complaints} icon="warning" color={colors.warning} animValue={statAnims[1]} />
                <StatCard title="Appointments" count={stats.appointments} icon="calendar" color={colors.primary} animValue={statAnims[2]} />
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Hostel Services</Text>
          <View style={styles.navGrid}>
            {navButtons.map((btn, index) => (
              <NavCard key={btn.title} btn={btn} animValue={navAnims[index]} onPress={() => router.push(btn.route)} />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
    backgroundColor: colors.bg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerGreeting: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 2,
  },
  headerName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerLogout: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary, marginBottom: 16 },
  
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  
  cleaningCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cleaningActive: {
    backgroundColor: colors.card,
    borderColor: colors.successBorder,
  },
  cleaningIdle: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
  },
  cleaningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cleaningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cleaningIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cleaningIconActive: {
    backgroundColor: colors.successBg,
  },
  cleaningIconIdle: {
    backgroundColor: colors.surface,
  },
  cleaningCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  cleaningActiveContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cleaningAreaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  cleaningGroupBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  cleaningGroupText: {
    color: colors.success,
    fontWeight: 'bold',
    fontSize: 12,
  },
  cleaningIdleContent: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cleaningStatusText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  statsGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30, gap: 12 },
  statCardContainer: { flex: 1 },
  statCard: { 
    backgroundColor: colors.card, 
    borderRadius: 18, 
    padding: 16,
    alignItems: "center",
    borderWidth: 1, 
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statCount: { fontSize: 24, fontWeight: "bold", color: colors.textPrimary, marginBottom: 4 },
  statTitle: { fontSize: 11, fontWeight: "600", color: colors.textSecondary, textAlign: 'center' },
  
  navGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  navCardContainer: { width: "31%", minWidth: 90, marginBottom: 16 },
  navCard: { 
    backgroundColor: colors.card, 
    paddingVertical: 20, 
    paddingHorizontal: 10, 
    borderRadius: 18,
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: colors.cardBorder,
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 4,
  },
  navIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  navText: { fontSize: 12, fontWeight: "600", color: colors.textPrimary, textAlign: "center" },
});

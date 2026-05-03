import React, { useState, useEffect, useContext, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, Animated } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T, createFadeSlide, createPressAnim } from "../theme";
import { LinearGradient } from "expo-linear-gradient";

// ─── Defined outside parent so React never remounts them on re-renders ─────────

function StatCard({ title, count, icon, color, maxVal = 100, animValue, loading }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fillAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.timing(fillAnim, {
        toValue: Math.min((count / maxVal) * 100, 100),
        duration: 1000, useNativeDriver: false,
      }).start();
    }
  }, [count, loading]);

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
        <LinearGradient colors={[`${color}25`, `${color}05`]} style={StyleSheet.absoluteFill} />
        <View style={styles.statCardHeader}>
          <View style={[styles.statIconBox, { backgroundColor: `${color}30` }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <Text style={[styles.statCount, { color }]}>{count}</Text>
        </View>
        <Text style={styles.statTitle}>{title}</Text>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { backgroundColor: color, width: fillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function NavCard({ item, animValue, onPress }) {
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
        <View style={[styles.navIconBox, { backgroundColor: `${item.color}20` }]}>
          <Ionicons name={item.icon} size={26} color={item.color} />
        </View>
        <Text style={styles.navText}>{item.name}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function WardenDashboard({ user }) {
  const router = useRouter();
  const { logout } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRooms: 0,
    availableRooms: 0,
    todayCheckIns: 0
  });
  const [loading, setLoading] = useState(true);

  // Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  
  // Fixed: store anim arrays in a single ref (no hooks-in-loop violation)
  const statAnims = useRef([0,1,2,3].map(() => new Animated.Value(0))).current;
  const navAnims  = useRef([0,1,2,3,4,5,6,7,8].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    fetchDashboardStats();

    Animated.sequence([
      createFadeSlide(headerFade, headerSlide, 0),
      createFadeSlide(contentFade, contentSlide, 0),
      Animated.stagger(100, statAnims.map(anim => 
        Animated.spring(anim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true })
      )),
      Animated.stagger(50, navAnims.map(anim => 
        Animated.spring(anim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true })
      ))
    ]).start();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await API.get("/dashboard/stats");
      setStats({
        totalUsers: res.data.totalUsers || 0,
        totalRooms: res.data.totalRooms || 0,
        availableRooms: res.data.availableRooms || 0,
        todayCheckIns: res.data.todayCheckIns || 0
      });
    } catch (err) {
      console.log("Failed to fetch warden stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)");
  };

  const navItems = [
    { name: "Scanner", icon: "scan", route: "/(app)/warden-scanner", color: "#8B5CF6" },
    { name: "Students", icon: "school", route: "/(app)/warden-students", color: "#3B82F6" },
    { name: "Payments", icon: "wallet", route: "/(app)/warden-payments", color: "#10B981" },
    { name: "Issues", icon: "chatbubbles", route: "/(app)/warden-complaints", color: "#F59E0B" },
    { name: "Rooms", icon: "business", route: "/(app)/warden-rooms", color: "#06B6D4" },
    { name: "Cleaning", icon: "sparkles", route: "/(app)/warden-cleaning", color: "#EC4899" },
    { name: "Check-ins", icon: "time", route: "/(app)/warden-attendance", color: "#F43F5E" },
    { name: "Reviews", icon: "star", route: "/(app)/reviews", color: "#14B8A6" },
    { name: "Bookings", icon: "calendar", route: "/(app)/warden-bookings", color: "#8B5CF6" }
  ];

  const initial = (user?.name || user?.fullName || "W").charAt(0).toUpperCase();

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <Animated.View style={[styles.headerBar, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrapper}>
            <LinearGradient colors={["#10b981", "#047857"]} style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
            <View style={styles.shieldBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#fff" />
            </View>
          </View>
          <View>
            <Text style={styles.roleText}>WARDEN</Text>
            <Text style={styles.headerName}>{user?.name || user?.fullName || "Warden"}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerLogout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentSlide }] }}>
          
          <View style={styles.banner}>
            <LinearGradient colors={["rgba(16,185,129,0.2)", "rgba(16,185,129,0.05)"]} style={StyleSheet.absoluteFill} start={{x:0, y:0}} end={{x:1, y:1}} />
            <View style={styles.bannerIcon}>
              <Ionicons name="analytics" size={24} color={colors.success} />
            </View>
            <View>
              <Text style={styles.bannerTitle}>Hostel Operations</Text>
              <Text style={styles.bannerSub}>Overview of current status</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
          ) : (
            <>
              <View style={styles.statsGrid}>
                <StatCard title="Total Students" count={stats.totalUsers} icon="people" color="#3B82F6" maxVal={500} animValue={statAnims[0]} loading={loading} />
                <StatCard title="Total Rooms" count={stats.totalRooms} icon="bed" color="#10B981" maxVal={200} animValue={statAnims[1]} loading={loading} />
                <StatCard title="Available Rooms" count={stats.availableRooms} icon="home" color="#F59E0B" maxVal={50} animValue={statAnims[2]} loading={loading} />
                <StatCard title="Today Check-ins" count={stats.todayCheckIns} icon="log-in" color="#EC4899" maxVal={100} animValue={statAnims[3]} loading={loading} />
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Management Hub</Text>
          <View style={styles.navGrid}>
            {navItems.map((item, idx) => (
              <NavCard key={item.name} item={item} animValue={navAnims[idx]} onPress={() => router.push(item.route)} />
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
    paddingBottom: 20,
    backgroundColor: colors.bg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginRight: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  shieldBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#047857',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  roleText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
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
  
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.successBorder,
    marginBottom: 24,
    overflow: 'hidden',
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(16,185,129,0.15)",
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  bannerSub: {
    color: colors.success,
    fontSize: 12,
  },

  sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary, marginBottom: 16, marginTop: 10 },
  
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 10 },
  statCardContainer: { width: "48%", marginBottom: 16 },
  statCard: { 
    backgroundColor: colors.card, 
    borderRadius: 18, 
    padding: 16,
    borderWidth: 1, 
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  navGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  navCardContainer: { flexBasis: "31%", marginBottom: 12 },
  navCard: { 
    backgroundColor: colors.card, 
    paddingVertical: 18, 
    paddingHorizontal: 8, 
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
  navIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  navText: { fontSize: 11.5, fontWeight: "600", color: colors.textPrimary, textAlign: "center" },
});

import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T } from "../theme";

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

  useEffect(() => {
    fetchDashboardStats();
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

  const StatCard = ({ title, count, icon, color }) => (
    <View style={[T.card, T.cardShadow, styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statInfo}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statCount, { color }]}>{count}</Text>
      </View>
      <Ionicons name={icon} size={32} color={color} style={{ opacity: 0.8 }} />
    </View>
  );

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={T.title}>Warden Hub</Text>
          <Text style={T.subtitle}>Overview of hostel operations</Text>
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard title="Total Students" count={stats.totalUsers} icon="people" color={colors.primary} />
            <StatCard title="Total Rooms" count={stats.totalRooms} icon="bed" color={colors.success} />
            <StatCard title="Available Rooms" count={stats.availableRooms} icon="home" color={colors.warning} />
            <StatCard title="Today Check-ins" count={stats.todayCheckIns} icon="log-in" color={colors.error} />
          </View>
        )}

        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.navGrid}>
          {[
            { name: "Scanner", icon: "scan", route: "/(app)/warden-scanner" },
            { name: "Students", icon: "school", route: "/(app)/warden-students" },
            { name: "Payments", icon: "wallet", route: "/(app)/warden-payments" },
            { name: "Issues", icon: "chatbubbles", route: "/(app)/warden-complaints" },
            { name: "Rooms", icon: "business", route: "/(app)/warden-rooms" },
            { name: "Cleaning", icon: "sparkles", route: "/(app)/warden-cleaning" },
            { name: "Check-ins", icon: "time", route: "/(app)/warden-attendance" },
            { name: "Reviews", icon: "star", route: "/(app)/reviews" },
            { name: "Bookings", icon: "calendar", route: "/(app)/warden-bookings" }
          ].map((item, idx) => (
            <TouchableOpacity key={idx} style={[T.card, T.cardShadow, styles.navCard]} onPress={() => router.push(item.route)}>
              <Ionicons name={item.icon} size={28} color={colors.textSecondary} />
              <Text style={styles.navText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 30 },
  
  header: { marginTop: 30, marginBottom: 25 },
  
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary, marginBottom: 15 },
  
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 25 },
  statCard: { 
    width: "48%", padding: 15, marginBottom: 15,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderLeftWidth: 4
  },
  statInfo: { flex: 1 },
  statTitle: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 5 },
  statCount: { fontSize: 24, fontWeight: "bold" },

  navGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 10 },
  navCard: { 
    width: "31%", paddingVertical: 15, paddingHorizontal: 5, marginBottom: 10,
    alignItems: "center", justifyContent: "center"
  },
  navText: { fontSize: 12, fontWeight: "600", color: colors.textPrimary, marginTop: 8 },

  logoutButton: { 
    marginTop: 20, padding: 15, flexDirection: "row", justifyContent: "center", alignItems: "center", 
    backgroundColor: colors.errorBg, borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" 
  },
  logoutText: { color: colors.error, fontWeight: "bold", fontSize: 16 }
});

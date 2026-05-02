import React, { useContext, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T } from "../theme";

export default function StudentDashboard({ user }) {
  const router = useRouter();
  const { logout } = useContext(AuthContext);
  
  const [stats, setStats] = useState({ payments: 0, complaints: 0, appointments: 0 });
  const [cleaningTask, setCleaningTask] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyStats();
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
    { title: "My QR", route: "/(app)/(tabs)/qr", icon: "qr-code" },
    { title: "Profile", route: "/(app)/profile", icon: "person" },
    { title: "Payments", route: "/(app)/payments", icon: "wallet" },
    { title: "Complaints", route: "/(app)/complaints", icon: "chatbubbles" },
    { title: "Cleaning", route: "/(app)/cleaning", icon: "sparkles" },
    { title: "Check-ins", route: "/(app)/history", icon: "log-in" },
    { title: "Reviews", route: "/(app)/reviews", icon: "star" },
  ];

  const StatCard = ({ title, count, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
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
          <Text style={T.title}>Welcome back!</Text>
          <Text style={styles.subtitle}>{user?.name || user?.fullName || "Student"}</Text>
        </View>

        <Text style={styles.sectionTitle}>My Summary</Text>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View>
            <TouchableOpacity 
              style={[T.card, T.cardShadow, { marginBottom: 20, backgroundColor: cleaningTask ? colors.successBg : colors.card, borderColor: cleaningTask ? colors.success : colors.cardBorder, borderWidth: 1 }]}
              onPress={() => router.push("/(app)/cleaning")}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="sparkles" size={24} color={cleaningTask ? colors.success : colors.textMuted} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textPrimary }}>Today's Cleaning</Text>
              </View>
              
              {cleaningTask === undefined ? (
                <Text style={{ color: colors.textSecondary }}>Loading...</Text>
              ) : cleaningTask ? (
                <View>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 }}>{cleaningTask.area}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Group {new Date().getDay() === 0 ? 7 : new Date().getDay()}</Text>
                    </View>
                    <Text style={{ color: colors.textSecondary, marginLeft: 10, fontSize: 13 }}>Assigned Task</Text>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.textMuted} style={{ marginRight: 6 }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 15 }}>No cleaning task today</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.statsGrid}>
              <StatCard title="Payments" count={stats.payments} icon="cash" color={colors.success} />
              <StatCard title="Complaints" count={stats.complaints} icon="warning" color={colors.warning} />
              <StatCard title="Appointments" count={stats.appointments} icon="people" color={colors.primary} />
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Hostel Services</Text>
        <View style={styles.navGrid}>
          {navButtons.map((btn, index) => (
            <TouchableOpacity key={index} style={styles.navCard} onPress={() => router.push(btn.route)}>
              <Ionicons name={btn.icon} size={28} color={colors.primary} />
              <Text style={styles.navText}>{btn.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Secure Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 30 },
  
  header: { marginTop: 30, marginBottom: 25 },
  subtitle: { fontSize: 20, color: colors.primary, marginTop: 5, fontWeight: "600" },
  
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary, marginBottom: 15 },
  
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 25 },
  statCard: { 
    width: "48%", backgroundColor: colors.card, padding: 15, borderRadius: 16, marginBottom: 15,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    borderWidth: 1, borderColor: colors.cardBorder, borderLeftWidth: 4
  },
  statInfo: { flex: 1, paddingRight: 5 },
  statTitle: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 5 },
  statCount: { fontSize: 24, fontWeight: "bold" },
  
  navGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10, marginBottom: 10 },
  navCard: { 
    flexBasis: "30%", backgroundColor: colors.card, paddingVertical: 18, paddingHorizontal: 5, borderRadius: 16, marginBottom: 10,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    borderWidth: 1, borderColor: colors.cardBorder
  },
  navText: { fontSize: 11, fontWeight: "600", color: colors.textSecondary, marginTop: 8, textAlign: "center" },

  logoutButton: { 
    marginTop: 20, padding: 15, flexDirection: "row", justifyContent: "center", alignItems: "center", 
    backgroundColor: colors.errorBg, borderRadius: 14, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" 
  },
  logoutText: { color: colors.error, fontWeight: "bold", fontSize: 16 }
});

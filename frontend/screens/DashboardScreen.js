import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, T } from "../theme";
import API from "../services/api";

export default function DashboardScreen() {
  const [user, setUser] = useState(null);
  const [cleaningTask, setCleaningTask] = useState(undefined);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
      const res = await API.get("/cleaning/student");
      setCleaningTask(res.data && res.data.length > 0 ? res.data[0] : null);
    } catch (error) {
      console.log("Error loading user/cleaning", error);
      setCleaningTask(null);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      router.replace("/(auth)");
    } catch (error) {
      console.log("Error during logout:", error);
    }
  };

  const items = [
    { title: "My QR Code", icon: "qr-code-outline", route: "/(app)/(tabs)/qr", color: colors.primary },
    { title: "My Profile", icon: "person-outline", route: "/(app)/profile", color: colors.success },
    { title: "Payments", icon: "card-outline", route: "/(app)/payments", color: colors.success },
    { title: "Complaints", icon: "alert-circle-outline", route: "/(app)/complaints", color: colors.error },
    { title: "Cleaning Schedule", icon: "calendar-outline", route: "/(app)/cleaning", color: colors.warning },
    { title: "Reviews", icon: "star-outline", route: "/(app)/reviews", color: colors.primary },
    { title: "Check-ins", icon: "time-outline", route: "/(app)/history", color: "#14b8a6" }
  ];

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={T.title}>Welcome back!</Text>
            {user && <Text style={[T.subtitle, styles.userName]}>{user.fullName || user.name || 'User'}</Text>}
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Today's Cleaning Card */}
        <TouchableOpacity 
          style={[T.card, T.cardShadow, { marginBottom: 20, backgroundColor: cleaningTask ? '#f0fdf4' : '#f8fafc', borderColor: cleaningTask ? '#bbf7d0' : '#e2e8f0', borderWidth: 1 }]}
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
        
        <View style={styles.grid}>
          {items.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[T.card, T.cardShadow, styles.card]} 
              onPress={() => router.push(item.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10
  },
  userName: { fontSize: 16, marginTop: 4 },
  logoutBtn: { 
    padding: 10,
    backgroundColor: colors.errorBg,
    borderRadius: 12
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  card: { 
    width: "48%", // 2 items per row
    padding: 20, 
    marginBottom: 16,
    alignItems: "center"
  },
  iconContainer: {
    padding: 16,
    borderRadius: 100,
    marginBottom: 12,
  },
  cardTitle: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: colors.textPrimary, 
    textAlign: "center" 
  }
});

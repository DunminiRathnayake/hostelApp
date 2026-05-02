import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator } from "react-native";
import API from "../services/api";
import { colors, T } from "../theme";
import { Ionicons } from "@expo/vector-icons";

export default function WardenAttendanceScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    
    // Auto refresh every 10 seconds
    const intervalId = setInterval(() => {
      fetchLogs(false);
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchLogs = async (showLoader = true) => {
    if (showLoader && logs.length === 0) setLoading(true);
    try {
      const res = await API.get("/checkin");
      setLogs(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => {
    const isLate = item.isLate || item.isLateCheckOut;
    
    return (
      <View style={[T.card, T.cardShadow, styles.card, isLate && styles.cardLate]}>
        <View style={styles.cardHeader}>
          <Text style={styles.studentName} numberOfLines={1}>{item.studentId?.name || item.studentId?.fullName || "Student"}</Text>
          <View style={[styles.badge, isLate ? styles.badgeLate : styles.badgeOnTime]}>
            <Ionicons name={isLate ? "warning" : "checkmark-circle"} size={12} color={isLate ? colors.error : colors.success} style={{marginRight: 4}} />
            <Text style={[styles.badgeText, { color: isLate ? colors.error : colors.success }]}>
              {isLate ? "LATE" : "ON TIME"}
            </Text>
          </View>
        </View>

        <View style={styles.timeContainer}>
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>CHECK-IN</Text>
            <View style={styles.timeValueRow}>
              <Ionicons name="log-in-outline" size={16} color={colors.primary} style={{marginRight: 6}}/>
              <Text style={styles.timeValue}>{formatTime(item.checkInTime)}</Text>
            </View>
          </View>
          
          <View style={styles.timeDivider} />
          
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>CHECK-OUT</Text>
            <View style={styles.timeValueRow}>
              <Ionicons name="log-out-outline" size={16} color={colors.warning} style={{marginRight: 6}}/>
              <Text style={[styles.timeValue, !item.checkOutTime && styles.timeValuePending]}>
                {formatTime(item.checkOutTime)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <View style={styles.container}>
        <View style={styles.headerBlock}>
          <Text style={T.title}>Check-in Updates</Text>
          <Text style={T.subtitle}>Real-time monitoring of student movements</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={logs}
            keyExtractor={(i) => i._id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No check-ins recorded yet.</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  
  headerBlock: { marginTop: 20, marginBottom: 15 },
  
  card: { padding: 18, borderLeftWidth: 4, borderLeftColor: colors.success, marginBottom: 15 },
  cardLate: { borderLeftColor: colors.error, backgroundColor: colors.errorBg },
  
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  studentName: { fontSize: 16, fontWeight: "bold", color: colors.textPrimary, flex: 1 },
  
  badge: { flexDirection: "row", alignItems: "center", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  badgeOnTime: { backgroundColor: "rgba(16, 185, 129, 0.15)" },
  badgeLate: { backgroundColor: "rgba(239, 68, 68, 0.15)" },
  badgeText: { fontSize: 11, fontWeight: "bold", letterSpacing: 0.5 },
  
  timeContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timeBox: { flex: 1 },
  timeLabel: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.5 },
  timeValueRow: { flexDirection: "row", alignItems: "center" },
  timeValue: { fontSize: 15, fontWeight: "bold", color: colors.textPrimary },
  timeValuePending: { color: colors.textMuted },
  
  timeDivider: { width: 1, height: 25, backgroundColor: colors.cardBorder, marginHorizontal: 15 },
  
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 50 },
  emptyText: { color: colors.textSecondary, marginTop: 15, fontSize: 15 }
});

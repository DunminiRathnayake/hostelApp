import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator } from "react-native";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T } from "../theme";

export default function CheckInHistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await API.get("/checkin/my");
        setHistory(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return "-- : --";
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => {
    const isLate = item.isLate || item.isLateCheckOut;
    
    return (
      <View style={[T.card, T.cardShadow, styles.card, isLate && styles.cardLate]}>
        <View style={styles.cardHeader}>
          <View style={styles.dateGroup}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} style={{marginRight: 6}} />
            <Text style={styles.dateText}>{new Date(item.date || item.checkInTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
          </View>
          
          <View style={[styles.badge, isLate ? styles.badgeLate : styles.badgeOnTime]}>
            <Ionicons name={isLate ? "warning" : "checkmark-circle"} size={12} color={isLate ? colors.error : colors.success} style={{marginRight: 4}} />
            <Text style={[styles.badgeText, isLate ? styles.badgeTextLate : styles.badgeTextOnTime]}>
              {isLate ? "LATE" : "ON TIME"}
            </Text>
          </View>
        </View>

        <View style={styles.timeContainer}>
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>CHECK-IN</Text>
            <View style={styles.timeValueRow}>
              <Ionicons name="log-in-outline" size={18} color={colors.primary} style={{marginRight: 6}}/>
              <Text style={styles.timeValue}>{formatTime(item.checkInTime)}</Text>
            </View>
          </View>
          
          <View style={styles.timeDivider} />
          
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>CHECK-OUT</Text>
            <View style={styles.timeValueRow}>
              <Ionicons name="log-out-outline" size={18} color={colors.warning} style={{marginRight: 6}}/>
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
          <Text style={[T.title, { marginBottom: 5 }]}>My Check-in History</Text>
          <Text style={T.subtitle}>Track your entrance and exit activity.</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={() => (
              <View style={[T.card, styles.emptyState]}>
                <Ionicons name="footsteps-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No check-in records found.</Text>
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
  
  headerBlock: { marginTop: 20, marginBottom: 20 },
  
  card: { padding: 18, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: colors.success },
  cardLate: { borderLeftColor: colors.error, backgroundColor: colors.errorBg },
  
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  dateGroup: { flexDirection: "row", alignItems: "center" },
  dateText: { fontSize: 15, fontWeight: "bold", color: colors.textPrimary },
  
  badge: { flexDirection: "row", alignItems: "center", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  badgeOnTime: { backgroundColor: "rgba(16, 185, 129, 0.15)" },
  badgeLate: { backgroundColor: "rgba(239, 68, 68, 0.15)" },
  badgeText: { fontSize: 11, fontWeight: "bold", letterSpacing: 0.5 },
  badgeTextOnTime: { color: colors.success },
  badgeTextLate: { color: colors.error },
  
  timeContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timeBox: { flex: 1 },
  timeLabel: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.5 },
  timeValueRow: { flexDirection: "row", alignItems: "center" },
  timeValue: { fontSize: 16, fontWeight: "bold", color: colors.textPrimary },
  timeValuePending: { color: colors.textMuted },
  
  timeDivider: { width: 1, height: 30, backgroundColor: colors.cardBorder, marginHorizontal: 15 },
  
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 50 },
  emptyText: { color: colors.textSecondary, marginTop: 15, fontSize: 15 }
});

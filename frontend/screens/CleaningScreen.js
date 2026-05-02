import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ActivityIndicator,
  ScrollView, RefreshControl, TouchableOpacity
} from "react-native";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T } from "../theme";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Day index → group number (Sun=7, Mon=1 ... Sat=6)
const getTodayGroup = () => {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
};

const GROUP_DAY_MAP = {
  1: "Monday", 2: "Tuesday", 3: "Wednesday",
  4: "Thursday", 5: "Friday", 6: "Saturday", 7: "Sunday"
};

export default function CleaningScreen() {
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);

  const today   = new Date();
  const dayName = DAY_NAMES[today.getDay()];
  const dateStr = today.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric"
  });
  const todayGroup = getTodayGroup();

  const fetchTask = async () => {
    setError(null);
    try {
      const res = await API.get("/cleaning/student-tasks");
      const fetchedTasks = res.data || [];
      setTasks(fetchedTasks);
    } catch (err) {
      console.log("[CleaningScreen]", err.message);
      setError("Could not load your task. Please try again.");
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTask(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchTask(); };

  return (
    <SafeAreaView style={[T.screen, { flex: 1 }]}>
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Header ── */}
        <View style={{ marginTop: 20, marginBottom: 24 }}>
          <Text style={T.title}>Your Cleaning Tasks Today</Text>
          <Text style={T.subtitle}>{dateStr}</Text>
        </View>

        {/* ── Today's group info chip ── */}
        <View style={styles.groupChip}>
          <Ionicons name="people-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.groupChipText}>
            Today is <Text style={{ fontWeight: "bold" }}>Group {todayGroup}</Text> cleaning day ({dayName})
          </Text>
        </View>

        {/* ── Content ── */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : error ? (
          <View style={styles.emptyCard}>
            <Ionicons name="wifi-outline" size={48} color={colors.error} />
            <Text style={[styles.emptyTitle, { color: colors.error }]}>Couldn't Load</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchTask(); }}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : tasks.length > 0 ? (
          <>
            {/* Task Card */}
            {tasks.map(task => (
              <View key={task._id} style={styles.taskCard}>
                <View style={styles.taskCardHeader}>
                  <View style={styles.taskIconWrap}>
                    <Ionicons name="sparkles" size={26} color={colors.primary} />
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: task.status === "completed" ? "#dcfce7" : "#fef9c3" }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: task.status === "completed" ? "#16a34a" : "#ca8a04" }
                    ]}>
                      {task.status === "completed" ? "✓ Done" : "⏳ Pending"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.taskAreaLabel}>Assigned Area</Text>
                <Text style={styles.taskAreaName}>{task.area}</Text>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Ionicons name="home-outline" size={17} color={colors.textSecondary} style={{ marginRight: 10 }} />
                  <Text style={styles.infoText}>Your room is responsible for this area today</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="people-outline" size={17} color={colors.textSecondary} style={{ marginRight: 10 }} />
                  <Text style={styles.infoText}>
                    Group <Text style={{ fontWeight: "bold", color: colors.primary }}>{todayGroup}</Text>
                    {" "}— {GROUP_DAY_MAP[todayGroup]} cleaning rotation
                  </Text>
                </View>
              </View>
            ))}

            {/* Tip box */}
            <View style={styles.tipBox}>
              <Ionicons
                name="information-circle-outline" size={20}
                color={colors.primary}
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <Text style={styles.tipText}>
                Please keep your assigned areas clean by end of day. The warden will mark them done once inspected.
              </Text>
            </View>
          </>
        ) : (
          /* No task today */
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle-outline" size={60} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Task Today</Text>
            <Text style={styles.emptySubtitle}>
              Your room is not on cleaning duty today.
              {"\n"}Check back on your group's assigned day!
            </Text>

            {/* weekly schedule hint */}
            <View style={styles.scheduleHint}>
              <Text style={styles.scheduleHintTitle}>Weekly Rotation</Text>
              {Object.entries(GROUP_DAY_MAP).map(([g, day]) => (
                <View key={g} style={[
                  styles.scheduleRow,
                  Number(g) === todayGroup && styles.scheduleRowToday
                ]}>
                  <Text style={[
                    styles.scheduleDay,
                    Number(g) === todayGroup && { color: colors.primary, fontWeight: "bold" }
                  ]}>{day}</Text>
                  <Text style={[
                    styles.scheduleGroup,
                    Number(g) === todayGroup && { color: colors.primary, fontWeight: "bold" }
                  ]}>Group {g}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  groupChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryGlow,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  groupChipText: { fontSize: 13, color: colors.textPrimary },

  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  taskCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  taskIconWrap: {
    width: 50,
    height: 50,
    backgroundColor: colors.primaryGlow,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 13, fontWeight: "bold" },
  taskAreaLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  taskAreaName: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  infoText: { fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 20 },

  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.primaryGlow,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  tipText: { fontSize: 14, color: colors.textPrimary, flex: 1, lineHeight: 20 },

  emptyCard: {
    alignItems: "center",
    padding: 36,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  scheduleHint: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  scheduleHintTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  scheduleRowToday: {
    backgroundColor: colors.primaryGlow,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  scheduleDay:   { fontSize: 14, color: colors.textSecondary },
  scheduleGroup: { fontSize: 14, color: colors.textSecondary },
});

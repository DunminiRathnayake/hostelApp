import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ActivityIndicator,
  ScrollView, RefreshControl, TouchableOpacity, Animated, StatusBar,
} from "react-native";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, T } from "../theme";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const getTodayGroup = () => { const d = new Date().getDay(); return d === 0 ? 7 : d; };

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: colors.warning, bg: colors.warningBg, icon: "time-outline"           },
  completed: { label: "Done",      color: colors.success, bg: colors.successBg, icon: "checkmark-circle-outline" },
  missed:    { label: "Missed",    color: colors.error,   bg: colors.errorBg,   icon: "close-circle-outline"   },
  scheduled: { label: "Scheduled", color: colors.info,    bg: colors.infoBg,    icon: "calendar-outline"       },
};

// Mini weekly calendar strip
function WeekStrip({ todayGroup }) {
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    return { date: d.getDate(), day: SHORT_DAYS[i], isToday: i === today.getDay(), group: i === 0 ? 7 : i };
  });

  return (
    <View style={cal.row}>
      {weekDays.map((d, i) => (
        <View key={i} style={[cal.cell, d.isToday && cal.cellToday]}>
          <Text style={[cal.dayLabel, d.isToday && cal.dayLabelToday]}>{d.day}</Text>
          <View style={[cal.dateCircle, d.isToday && cal.dateCircleToday]}>
            <Text style={[cal.dateNum, d.isToday && cal.dateNumToday]}>{d.date}</Text>
          </View>
          {d.isToday && <View style={cal.activeDot} />}
        </View>
      ))}
    </View>
  );
}
const cal = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 20 },
  cell: { alignItems: "center", flex: 1, paddingVertical: 10, borderRadius: 14 },
  cellToday: { backgroundColor: "rgba(108,99,255,0.12)", borderWidth: 1, borderColor: "rgba(108,99,255,0.25)" },
  dayLabel: { fontSize: 9, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.5, marginBottom: 6 },
  dayLabelToday: { color: colors.primary },
  dateCircle: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  dateCircleToday: { backgroundColor: colors.primary },
  dateNum: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  dateNumToday: { color: "#fff" },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 4 },
});

function TaskCard({ task, index }) {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 120, friction: 6, tension: 55, useNativeDriver: true }).start();
  }, []);

  const status = STATUS_CONFIG[task.status?.toLowerCase()] || STATUS_CONFIG.pending;
  const todayGroup = getTodayGroup();
  const isMyDay = task.assignedGroup === todayGroup;

  return (
    <Animated.View style={[{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale }],
    }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, friction: 8, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start()}
      >
        <LinearGradient
          colors={isMyDay
            ? ["rgba(16,217,160,0.14)", "rgba(16,217,160,0.04)"]
            : ["rgba(26,26,40,0.9)", "rgba(19,19,30,0.9)"]
          }
          style={[styles.taskCard, isMyDay && styles.taskCardActive]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          {/* My-day ribbon */}
          {isMyDay && (
            <View style={styles.todayRibbon}>
              <Text style={styles.todayRibbonText}>TODAY</Text>
            </View>
          )}

          <View style={styles.taskTop}>
            <View style={[styles.taskAreaBadge, { backgroundColor: isMyDay ? "rgba(16,217,160,0.18)" : colors.primaryGlow }]}>
              <Ionicons name="sparkles-outline" size={20} color={isMyDay ? colors.success : colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.taskArea}>{task.area}</Text>
              <Text style={styles.taskSub}>Cleaning area</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Ionicons name={status.icon} size={12} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <View style={styles.taskMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>Group {task.assignedGroup}</Text>
            </View>
            {task.scheduledDate && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{new Date(task.scheduledDate).toLocaleDateString()}</Text>
              </View>
            )}
            {task.notes && (
              <View style={styles.metaItem}>
                <Ionicons name="document-text-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>{task.notes}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CleaningScreen() {
  const [tasks,     setTasks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState(null);

  const headerAnim = useRef(new Animated.Value(0)).current;

  const today      = new Date();
  const todayGroup = getTodayGroup();
  const dayName    = DAY_NAMES[today.getDay()];
  const dateStr    = today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  useEffect(() => {
    fetchTask();
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const fetchTask = async () => {
    setError(null);
    try {
      const res = await API.get("/cleaning/student-tasks");
      setTasks(res.data || []);
    } catch (err) {
      setError("Could not load your cleaning tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const myTask = tasks.find(t => t.assignedGroup === todayGroup);

  return (
    <SafeAreaView style={[T.screen, { flex: 1 }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 44 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchTask(); }}
            tintColor={colors.primary} colors={[colors.primary]}
          />
        }
      >
        {/* ── Header ── */}
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
        }]}>
          <LinearGradient
            colors={["rgba(108,99,255,0.12)", "transparent"]}
            style={styles.headerGrad}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          />
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.pageTitle}>Cleaning Schedule</Text>
              <Text style={styles.dateStr}>{dateStr}</Text>
            </View>
            <View style={[styles.groupBubble, myTask && styles.groupBubbleActive]}>
              <Text style={[styles.groupBubbleNum, myTask && { color: colors.success }]}>{todayGroup}</Text>
              <Text style={[styles.groupBubbleLbl, myTask && { color: colors.success }]}>GROUP</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Weekly Strip ── */}
        <WeekStrip todayGroup={todayGroup} />

        {/* ── Today's Group Info ── */}
        <Animated.View style={[styles.groupBanner, { opacity: headerAnim }]}>
          <LinearGradient
            colors={myTask
              ? ["rgba(16,217,160,0.15)", "rgba(16,217,160,0.06)"]
              : ["rgba(108,99,255,0.1)", "rgba(108,99,255,0.04)"]
            }
            style={styles.groupBannerInner}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <View style={[styles.groupBannerDot, { backgroundColor: myTask ? colors.success : colors.primary }]} />
            <Text style={styles.groupBannerText}>
              Today — <Text style={{ fontWeight: "800", color: myTask ? colors.success : colors.primary }}>
                Group {todayGroup} ({dayName})
              </Text>
              {myTask ? " — You're on duty!" : " — Enjoy your free day!"}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* ── Content ── */}
        <View style={styles.tasksWrap}>
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.centerText}>Loading tasks…</Text>
            </View>
          ) : error ? (
            <View style={styles.errorCard}>
              <View style={styles.errorIcon}>
                <Ionicons name="cloud-offline-outline" size={36} color={colors.error} />
              </View>
              <Text style={styles.errorTitle}>Couldn't load tasks</Text>
              <Text style={styles.errorSub}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => { setLoading(true); fetchTask(); }}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : tasks.length > 0 ? (
            <>
              <View style={styles.listHeader}>
                <Ionicons name="list-outline" size={14} color={colors.primary} />
                <Text style={styles.listHeaderText}>All Tasks</Text>
                <View style={styles.listCount}>
                  <Text style={styles.listCountText}>{tasks.length}</Text>
                </View>
              </View>
              {tasks.map((task, i) => <TaskCard key={task._id} task={task} index={i} />)}
            </>
          ) : (
            <View style={styles.emptyCard}>
              <LinearGradient
                colors={["rgba(16,217,160,0.1)", "rgba(16,217,160,0.04)"]}
                style={styles.emptyCardInner}
              >
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="checkmark-done-circle-outline" size={44} color={colors.success} />
                </View>
                <Text style={styles.emptyTitle}>No Tasks Scheduled</Text>
                <Text style={styles.emptyText}>You have no cleaning tasks at this time. Enjoy your day!</Text>
              </LinearGradient>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { position: "relative", marginBottom: 20 },
  headerGrad: { position: "absolute", inset: 0, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20,
  },
  pageTitle: { fontSize: 26, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  dateStr: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  groupBubble: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  groupBubbleActive: { borderColor: colors.success, backgroundColor: "rgba(16,217,160,0.1)" },
  groupBubbleNum: { fontSize: 22, fontWeight: "900", color: colors.primary, lineHeight: 24 },
  groupBubbleLbl: { fontSize: 8, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },

  groupBanner: { paddingHorizontal: 20, marginBottom: 20 },
  groupBannerInner: {
    borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "rgba(108,99,255,0.2)",
  },
  groupBannerDot: { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },
  groupBannerText: { fontSize: 13.5, color: colors.textSecondary, lineHeight: 20 },

  tasksWrap: { paddingHorizontal: 20 },
  listHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  listHeaderText: { fontSize: 12, fontWeight: "800", color: colors.textPrimary, letterSpacing: 0.3 },
  listCount: { backgroundColor: colors.primaryGlow, paddingHorizontal: 9, paddingVertical: 2, borderRadius: 9 },
  listCountText: { fontSize: 11, color: colors.primary, fontWeight: "700" },

  taskCard: {
    borderRadius: 20, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: colors.cardBorder,
    position: "relative", overflow: "hidden",
  },
  taskCardActive: { borderColor: "rgba(16,217,160,0.3)" },
  todayRibbon: {
    position: "absolute", top: 14, right: -22, backgroundColor: colors.success,
    paddingHorizontal: 28, paddingVertical: 3, transform: [{ rotate: "32deg" }],
  },
  todayRibbonText: { fontSize: 9, fontWeight: "900", color: "#fff", letterSpacing: 0.8 },

  taskTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  taskAreaBadge: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  taskArea: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  taskSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  statusText: { fontSize: 11, fontWeight: "700" },

  taskMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: colors.textMuted },

  centerBox: { alignItems: "center", paddingVertical: 50 },
  centerText: { color: colors.textSecondary, marginTop: 14, fontSize: 14 },

  errorCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 28,
    alignItems: "center", borderWidth: 1, borderColor: "rgba(255,90,90,0.2)",
  },
  errorIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.errorBg, alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  errorTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 },
  errorSub: { fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 20 },
  retryBtn: {
    backgroundColor: colors.primaryGlow, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1, borderColor: "rgba(108,99,255,0.3)",
  },
  retryText: { color: colors.primary, fontWeight: "700", fontSize: 14 },

  emptyCard: { borderRadius: 20, overflow: "hidden" },
  emptyCardInner: { borderRadius: 20, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "rgba(16,217,160,0.18)" },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(16,217,160,0.15)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 21 },
});

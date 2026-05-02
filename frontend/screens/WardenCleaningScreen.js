import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  SafeAreaView, ActivityIndicator, ScrollView, RefreshControl, Modal, useWindowDimensions
} from "react-native";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T } from "../theme";

const DAY_GROUP_MAP = {
  1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday",
  5: "Friday", 6: "Saturday", 7: "Sunday",
};
const GROUPS = [1, 2, 3, 4, 5, 6, 7];

const getTodayGroup = () => {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
};

export default function WardenCleaningScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 800;

  const [rooms, setRooms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState({ week: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] } });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  const todayGroup = getTodayGroup();
  const todayName = DAY_GROUP_MAP[todayGroup];

  const fetchData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        API.get("/rooms"),
        API.get("/cleaning/tasks"),
        API.get("/cleaning/schedule"),
      ]);

      const roomsRes = results[0].status === "fulfilled" ? results[0].value : null;
      const tasksRes = results[1].status === "fulfilled" ? results[1].value : null;
      const scheduleRes = results[2].status === "fulfilled" ? results[2].value : null;

      if (roomsRes && roomsRes.data) {
        setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : (roomsRes.data.rooms || []));
      }
      if (tasksRes && tasksRes.data) {
        setTasks(tasksRes.data);
      }
      if (scheduleRes && scheduleRes.data && scheduleRes.data.week) {
        setSchedule(scheduleRes.data);
      } else {
        setSchedule({ week: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] } });
      }

      if (results[0].status === "rejected") console.error("Rooms error:", results[0].reason);
      if (results[1].status === "rejected") console.error("Tasks error:", results[1].reason);
      if (results[2].status === "rejected") console.error("Schedule error:", results[2].reason);

    } catch (e) {
      console.error("fetchData error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const [pickerState, setPickerState] = useState({ visible: false, dayGroup: null, slotIdx: null, currentRoomId: null });

  const handleSlotChange = async (oldRoomId, newRoomId, groupIndex, slotIdx) => {
    try {
      const dayName = DAY_GROUP_MAP[groupIndex];
      const updatedWeek = { ...schedule.week };
      if (!updatedWeek[dayName]) updatedWeek[dayName] = [];
      
      const currentRoomIds = updatedWeek[dayName].map(r => typeof r === 'object' ? r._id : r);
      
      while (currentRoomIds.length < 2) currentRoomIds.push(null);
      currentRoomIds[slotIdx] = newRoomId;
      
      updatedWeek[dayName] = currentRoomIds.filter(id => id !== null);

      await API.put(`/cleaning/schedule`, { week: updatedWeek });
      fetchData();
    } catch (e) {
      Alert.alert("Error", "Could not update group assignment.");
    } finally {
      setPickerState({ visible: false, dayGroup: null, slotIdx: null, currentRoomId: null });
    }
  };

  const markDone = async (taskId) => {
    setMarkingId(taskId);
    try {
      await API.put(`/cleaning/tasks/${taskId}`);
      setTasks(prev =>
        prev.map(t => t._id === taskId ? { ...t, status: "completed" } : t)
      );
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Could not mark as done.");
    } finally {
      setMarkingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[T.screen, { flex: 1, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={isLargeScreen ? styles.layoutRow : styles.layoutCol}>
          
          {/* Left Column: Weekly Schedule */}
          <View style={[styles.column, isLargeScreen && { flex: 1.5, marginRight: 24 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Weekly Schedule</Text>
            </View>
            
            <View style={styles.scheduleCard}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCol1}>DAY (GROUP)</Text>
                <Text style={styles.tableHeaderCol2}>ASSIGNED ROOMS</Text>
              </View>

              {GROUPS.map(g => {
                const dayName = DAY_GROUP_MAP[g];
                const dayRooms = schedule.week[dayName] || [];
                const slot1Room = typeof dayRooms[0] === 'object' ? dayRooms[0] : rooms.find(r => r._id === dayRooms[0]);
                const slot2Room = typeof dayRooms[1] === 'object' ? dayRooms[1] : rooms.find(r => r._id === dayRooms[1]);
                const isToday = g === todayGroup;

                return (
                  <View key={g} style={[styles.scheduleRow, isToday && styles.scheduleRowToday]}>
                    <View style={styles.dayCol}>
                      <Text style={styles.dayText}>
                        {DAY_GROUP_MAP[g]} <Text style={styles.groupText}>(G{g})</Text>
                      </Text>
                      {isToday && (
                        <View style={styles.todayPill}>
                          <Text style={styles.todayPillText}>TODAY</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.slotsCol}>
                      <TouchableOpacity
                        style={[styles.slotSelect, isToday && styles.slotSelectToday]}
                        onPress={() => setPickerState({ visible: true, dayGroup: g, slotIdx: 0, currentRoomId: slot1Room?._id })}
                      >
                        <Text style={slot1Room ? styles.slotTextFilled : styles.slotTextEmpty}>
                          {slot1Room ? `Room ${slot1Room.roomNumber}` : "Select Room..."}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.slotSelect, isToday && styles.slotSelectToday, {marginTop: 8}]}
                        onPress={() => setPickerState({ visible: true, dayGroup: g, slotIdx: 1, currentRoomId: slot2Room?._id })}
                      >
                        <Text style={slot2Room ? styles.slotTextFilled : styles.slotTextEmpty}>
                          {slot2Room ? `Room ${slot2Room.roomNumber}` : "Select Room..."}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Right Column: Today's Tasks */}
          <View style={[styles.column, isLargeScreen && { flex: 1 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Today's Tasks</Text>
              <View style={styles.groupBadge}>
                <Text style={styles.groupBadgeText}>Group {todayGroup}</Text>
              </View>
            </View>

            {tasks.length === 0 ? (
               <View style={styles.emptyCard}>
                 <Text style={styles.emptyText}>No Tasks Today</Text>
               </View>
            ) : (
              tasks.map((task) => {
                const isDone = task.status === "completed";
                const taskRooms = schedule.week[DAY_GROUP_MAP[todayGroup]] || [];
                const taskRoomsStr = taskRooms.map(r => {
                  const roomObj = typeof r === 'object' ? r : rooms.find(rm => rm._id === r);
                  return roomObj ? `Room ${roomObj.roomNumber}` : '';
                }).filter(Boolean).join(", ");
                
                return (
                  <View key={task._id} style={styles.taskCard}>
                    <View style={styles.taskHeader}>
                      <Text style={styles.taskTitle}>{task.area}</Text>
                      <View style={[styles.statusPill, isDone ? styles.statusDone : styles.statusPending]}>
                        <Text style={[styles.statusPillText, isDone ? styles.statusTextDone : styles.statusTextPending]}>
                          {isDone ? "Done" : "Pending"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.taskSubtitle}>
                      Assigned Room: <Text style={styles.taskSubtitleHighlight}>{taskRoomsStr || "None"}</Text>
                    </Text>

                    {!isDone && (
                      <TouchableOpacity
                        style={styles.markDoneBtn}
                        onPress={() => markDone(task._id)}
                        disabled={markingId === task._id}
                      >
                        {markingId === task._id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.markDoneBtnText}>Mark As Done</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>

        </View>
      </ScrollView>

      {/* Modal Dropdown */}
      {pickerState.visible && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Select Room for {DAY_GROUP_MAP[pickerState.dayGroup]}
              </Text>
              <ScrollView style={styles.modalList}>
                <TouchableOpacity 
                  style={styles.modalOption} 
                  onPress={() => handleSlotChange(pickerState.currentRoomId, null, pickerState.dayGroup, pickerState.slotIdx)}
                >
                  <Text style={[styles.modalOptionText, { color: colors.textSecondary }]}>-- Not Assigned --</Text>
                </TouchableOpacity>

                {rooms.map(r => {
                  const isSelected = r._id === pickerState.currentRoomId;
                  return (
                    <TouchableOpacity
                      key={r._id}
                      style={[styles.modalOption, isSelected && { backgroundColor: "#f1f5f9" }]}
                      onPress={() => handleSlotChange(pickerState.currentRoomId, r._id, pickerState.dayGroup, pickerState.slotIdx)}
                    >
                      <Text style={[styles.modalOptionText, isSelected && { color: colors.primary, fontWeight: 'bold' }]}>
                        Room {r.roomNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPickerState({ visible: false, dayGroup: null, slotIdx: null, currentRoomId: null })}>
                <Text style={styles.modalCloseBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: 16 },
  
  layoutRow: { flexDirection: "row", alignItems: "flex-start" },
  layoutCol: { flexDirection: "column" },
  column: { width: "100%", marginBottom: 24 },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontSize: 22, fontWeight: "bold", color: colors.textPrimary },
  
  groupBadge: { backgroundColor: colors.primaryGlow, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  groupBadgeText: { color: colors.primary, fontWeight: "bold", fontSize: 13 },

  // Weekly Schedule Table
  scheduleCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: colors.card, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  tableHeaderCol1: { flex: 1, fontSize: 12, fontWeight: "bold", color: colors.textSecondary },
  tableHeaderCol2: { flex: 1, fontSize: 12, fontWeight: "bold", color: colors.textSecondary },

  scheduleRow: { flexDirection: "row", paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, alignItems: "center" },
  scheduleRowToday: { backgroundColor: colors.card },
  
  dayCol: { flex: 1, flexDirection: "row", alignItems: "center", flexWrap: "wrap", paddingRight: 10 },
  dayText: { fontSize: 16, fontWeight: "bold", color: colors.textPrimary },
  groupText: { fontSize: 14, fontWeight: "normal", color: colors.textSecondary },
  todayPill: { backgroundColor: colors.warningBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginLeft: 8 },
  todayPillText: { fontSize: 10, fontWeight: "bold", color: colors.warning },

  slotsCol: { flex: 1 },
  slotSelect: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.input },
  slotSelectToday: { borderColor: colors.warning },
  slotTextEmpty: { fontSize: 14, color: colors.textSecondary },
  slotTextFilled: { fontSize: 14, color: colors.textPrimary },

  // Today's Tasks
  taskCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.cardBorder, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 2 },
  taskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  taskTitle: { fontSize: 20, fontWeight: "bold", color: colors.textPrimary },
  statusPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  statusPending: { backgroundColor: colors.warningBg },
  statusDone: { backgroundColor: colors.successBg },
  statusTextPending: { color: colors.warning, fontWeight: "bold", fontSize: 13 },
  statusTextDone: { color: colors.success, fontWeight: "bold", fontSize: 13 },
  
  taskSubtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  taskSubtitleHighlight: { color: colors.primary, fontWeight: "bold" },
  
  markDoneBtn: { backgroundColor: colors.success, borderRadius: 8, paddingVertical: 14, alignItems: "center", width: "100%" },
  markDoneBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

  emptyCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 30, borderWidth: 1, borderColor: colors.cardBorder, alignItems: "center" },
  emptyText: { color: colors.textSecondary, fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", backgroundColor: colors.surface, borderRadius: 16, padding: 20, maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary, marginBottom: 16, textAlign: "center" },
  modalList: { flexGrow: 0 },
  modalOption: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  modalOptionText: { fontSize: 16, color: colors.textPrimary },
  modalCloseBtn: { marginTop: 20, paddingVertical: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 8, alignItems: "center" },
  modalCloseBtnText: { fontSize: 16, fontWeight: "bold", color: colors.textSecondary },
});

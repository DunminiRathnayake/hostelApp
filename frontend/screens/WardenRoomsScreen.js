import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl, TextInput, Alert, Modal } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T } from "../theme";

export default function WardenRoomsScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newCapacity, setNewCapacity] = useState("2");
  const [newType, setNewType] = useState("Standard");
  const [suggestedRoom, setSuggestedRoom] = useState("");
  const [isCapDropdownOpen, setIsCapDropdownOpen] = useState(false);
  const CAPACITIES = ["1", "2", "3"];

  const [studentPickerVisible, setStudentPickerVisible] = useState(false);
  const [selectedRoomForAssign, setSelectedRoomForAssign] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [roomsRes, studentsRes] = await Promise.all([
        API.get("/rooms"),
        API.get("/users/students?unassigned=true")
      ]);
      const roomsData = Array.isArray(roomsRes.data) ? roomsRes.data : (roomsRes.data.rooms || []);
      setRooms(roomsData);
      setStudents(studentsRes.data || []);
      
      // Calculate suggested room number
      if (roomsData.length > 0) {
        const maxRoom = Math.max(...roomsData.map(r => parseInt(r.roomNumber) || 0));
        setSuggestedRoom((maxRoom + 1).toString());
      } else {
        setSuggestedRoom("101");
      }
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAddRoom = async () => {
    const capNum = parseInt(newCapacity);
    if (!newRoomNumber || !newCapacity) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (isNaN(capNum) || capNum < 1 || capNum > 3) {
      Alert.alert("Error", "Capacity must be between 1 and 3");
      return;
    }
    try {
      await API.post("/rooms", {
        roomNumber: newRoomNumber,
        capacity: parseInt(newCapacity),
        type: newType
      });
      setNewRoomNumber("");
      setNewCapacity("");
      fetchData();
      Alert.alert("Success", "Room added successfully");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to add room");
    }
  };

  const handleRemoveStudent = async (roomId, studentId) => {
    try {
      await API.post("/rooms/remove", { roomId, studentId });
      fetchData();
    } catch (err) {
      Alert.alert("Error", "Failed to remove student");
    }
  };

  const handleAssignStudent = async (roomId, studentId) => {
    setStudentPickerVisible(false);
    try {
      await API.post("/rooms/allocate", { roomId, studentId });
      fetchData();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to assign student");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this room? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`/rooms/${roomId}`);
              Alert.alert("Success", "Room deleted successfully");
              fetchData();
            } catch (err) {
              Alert.alert("Error", err.response?.data?.message || "Failed to delete room");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.pageTitle}>Room Management</Text>

        {/* Add New Room Section */}
        <View style={styles.addRoomCard}>
          <View style={styles.addRoomHeader}>
            <Ionicons name="add" size={24} color={colors.primary} style={{ fontWeight: "bold" }} />
            <Text style={styles.addRoomTitle}>Add New Room</Text>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputCol}>
              <TextInput
                style={styles.input}
                placeholder="Room Number (e.g. 101)"
                value={newRoomNumber}
                onChangeText={setNewRoomNumber}
                keyboardType="numeric"
              />
              {suggestedRoom ? (
                <View style={styles.suggestRow}>
                  <Ionicons name="bulb-outline" size={14} color="#ca8a04" />
                  <Text style={styles.suggestText}>Suggest: {suggestedRoom}</Text>
                </View>
              ) : null}
            </View>
            <View style={[styles.inputCol, { zIndex: 10 }]}>
              <TouchableOpacity
                style={[styles.input, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}
                onPress={() => setIsCapDropdownOpen(!isCapDropdownOpen)}
              >
                <Text style={{ color: newCapacity ? colors.textPrimary : colors.placeholder }}>
                  {newCapacity || "Capacity"}
                </Text>
                <Ionicons name={isCapDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              {isCapDropdownOpen && (
                <View style={{ position: "absolute", top: 50, left: 0, right: 0, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder, zIndex: 100 }}>
                  {CAPACITIES.map((cap) => (
                    <TouchableOpacity
                      key={cap}
                      style={{ padding: 12, borderBottomWidth: cap === "3" ? 0 : 1, borderBottomColor: colors.cardBorder }}
                      onPress={() => { setNewCapacity(cap); setIsCapDropdownOpen(false); }}
                    >
                      <Text style={{ color: newCapacity === cap ? colors.primary : colors.textPrimary }}>{cap}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.typeSelector}>
            <Text style={styles.typeText}>{newType}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleAddRoom}>
            <Text style={styles.addBtnText}>Add Room</Text>
          </TouchableOpacity>
        </View>

        {/* Current Rooms Header */}
        <View style={styles.roomsHeader}>
          <Text style={styles.roomsTitle}>Current Rooms</Text>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>Total: {rooms.length}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.roomsGrid}>
            {rooms.map(room => {
              const isFull = room.currentOccupancy >= room.capacity;
              const slotsAvailable = room.capacity - room.currentOccupancy;
              
              return (
                <View key={room._id} style={styles.roomCard}>
                  {/* Top Bar */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.roomCardTitle}>Room {room.roomNumber}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.statusBadge, isFull ? styles.statusBadgeFull : styles.statusBadgeAvail]}>
                        <Text style={[styles.statusBadgeText, isFull ? styles.statusBadgeTextFull : styles.statusBadgeTextAvail]}>
                          {isFull ? "Occupied" : `Available (${slotsAvailable} Slot${slotsAvailable !== 1 ? 's' : ''})`}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteRoom(room._id)} style={{ marginLeft: 10, padding: 4 }}>
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.occupancyRow}>
                    <Text style={styles.occupancyText}>Occupied: <Text style={[styles.occupancyVal, isFull && {color: colors.error}]}>{room.currentOccupancy}</Text></Text>
                    <Text style={styles.occupancyText}>Capacity: <Text style={styles.occupancyVal}>{room.capacity}</Text></Text>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(room.currentOccupancy / room.capacity) * 100}%`, backgroundColor: isFull ? colors.error : colors.primary }]} />
                  </View>

                  {/* Assigned Students */}
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Assigned Students:</Text>
                    <View style={styles.studentsList}>
                      {!room.students || room.students.length === 0 ? (
                        <View style={styles.noStudentsBox}>
                          <Text style={styles.noStudentsText}>No students assigned yet</Text>
                        </View>
                      ) : (
                        room.students.map(student => (
                          <View key={student._id} style={styles.studentItem}>
                            <Text style={styles.studentName} numberOfLines={1}>{student.name}</Text>
                            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveStudent(room._id, student._id)}>
                              <Text style={styles.removeBtnText}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>
                  </View>

                  {/* Assign New Student */}
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Assign New Student:</Text>
                    <TouchableOpacity 
                      style={[styles.assignSelector, isFull && styles.assignSelectorDisabled]} 
                      disabled={isFull}
                      onPress={() => {
                        setSelectedRoomForAssign(room._id);
                        setStudentPickerVisible(true);
                      }}
                    >
                      <Text style={[styles.assignSelectorText, isFull && {color: colors.textSecondary}]}>
                        {isFull ? "Room is Full" : "Select a student..."}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color={isFull ? colors.textMuted : colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.editBtn, { flex: 1 }]}
                      onPress={() => router.push({ pathname: "/(app)/warden-room-details", params: { roomId: room._id } })}
                    >
                      <Ionicons name="pencil" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.editBtnText}>Edit Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {rooms.length === 0 && !loading && (
              <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>No rooms found.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Student Picker Modal */}
      {studentPickerVisible && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select a Student</Text>
              <ScrollView style={styles.modalList}>
                {students.length === 0 ? (
                  <Text style={{textAlign: "center", color: colors.textSecondary, marginTop: 20}}>No unassigned students found.</Text>
                ) : (
                  students.map(s => (
                    <TouchableOpacity 
                      key={s._id} 
                      style={styles.modalOption}
                      onPress={() => handleAssignStudent(selectedRoomForAssign, s._id)}
                    >
                      <Text style={styles.modalOptionText}>{s.name} ({s.email})</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setStudentPickerVisible(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
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
  loader: { marginTop: 40 },

  pageTitle: { fontSize: 24, fontWeight: "bold", color: colors.textPrimary, marginTop: 24, marginBottom: 20 },

  // Add Room Card
  addRoomCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: colors.cardBorder, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 2 },
  addRoomHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  addRoomTitle: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary, marginLeft: 8 },
  inputRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  inputCol: { flex: 1 },
  input: { borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.input, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary },
  suggestRow: { flexDirection: "row", alignItems: "center", marginTop: 6, marginLeft: 4 },
  suggestText: { fontSize: 12, color: colors.warning, marginLeft: 4, fontWeight: "500" },
  typeSelector: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.input, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20 },
  typeText: { fontSize: 15, color: colors.textPrimary },
  addBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  // Rooms Header
  roomsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  roomsTitle: { fontSize: 20, fontWeight: "bold", color: colors.textPrimary },
  totalBadge: { backgroundColor: colors.primaryGlow, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  totalBadgeText: { color: colors.primary, fontWeight: "bold", fontSize: 13 },

  roomsGrid: { gap: 16 },

  // Room Card
  roomCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.cardBorder, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  roomCardTitle: { fontSize: 20, fontWeight: "bold", color: colors.textPrimary },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  statusBadgeFull: { backgroundColor: colors.errorBg },
  statusBadgeAvail: { backgroundColor: colors.successBg },
  statusBadgeText: { fontSize: 12, fontWeight: "bold" },
  statusBadgeTextFull: { color: colors.error },
  statusBadgeTextAvail: { color: colors.success },

  occupancyRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  occupancyText: { fontSize: 14, color: colors.textSecondary },
  occupancyVal: { fontWeight: "bold", color: colors.textPrimary },

  progressBarBg: { height: 6, backgroundColor: colors.input, borderRadius: 3, marginBottom: 20, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 3 },

  sectionBlock: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  
  studentsList: { gap: 8 },
  noStudentsBox: { borderWidth: 1, borderStyle: "dashed", borderColor: colors.cardBorder, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  noStudentsText: { color: colors.textMuted, fontSize: 14 },
  
  studentItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, paddingLeft: 12, paddingRight: 6, paddingVertical: 6, borderRadius: 8 },
  studentName: { fontSize: 14, color: colors.textPrimary, flex: 1, fontWeight: "500" },
  removeBtn: { backgroundColor: colors.errorBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  removeBtnText: { color: colors.error, fontSize: 12, fontWeight: "bold" },

  assignSelector: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.input, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  assignSelectorDisabled: { backgroundColor: colors.bg, opacity: 0.6 },
  assignSelectorText: { fontSize: 14, color: colors.textPrimary },

  assignSelectorText: { fontSize: 14, color: colors.textPrimary },

  actionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  editBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, borderRadius: 8, paddingVertical: 12 },
  editBtnText: { color: colors.textPrimary, fontWeight: "bold", fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", backgroundColor: colors.surface, borderRadius: 16, padding: 20, maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary, marginBottom: 16, textAlign: "center" },
  modalList: { flexGrow: 0 },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  modalOptionText: { fontSize: 16, color: colors.textPrimary },
  modalCloseBtn: { marginTop: 20, paddingVertical: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 8, alignItems: "center" },
  modalCloseText: { fontSize: 16, fontWeight: "bold", color: colors.textSecondary },
});


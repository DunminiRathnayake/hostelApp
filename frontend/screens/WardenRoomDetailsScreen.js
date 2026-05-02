import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T } from "../theme";

export default function WardenRoomDetailsScreen() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams();

  const [room, setRoom] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState("Select a Student");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [roomsRes, studentsRes] = await Promise.all([
        API.get("/rooms"),
        API.get("/users/students?unassigned=true"),
      ]);

      const foundRoom = (roomsRes.data.rooms || []).find((r) => r._id === roomId);
      setRoom(foundRoom || null);
      setStudents(studentsRes.data || []);
    } catch (err) {
      console.log("Fetch room details error:", err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleAssign = async () => {
    if (!selectedStudentId) return Alert.alert("Select a Student", "Please choose a student to assign.");
    const isFull = room?.currentOccupancy >= room?.capacity;
    if (isFull) return Alert.alert("Room Full", "This room is at full capacity. Remove a student first.");

    setAssigning(true);
    try {
      await API.post("/rooms/allocate", { studentId: selectedStudentId, roomId });
      Alert.alert("Assigned!", `${selectedStudentName} has been assigned to Room ${room?.roomNumber}.`);
      setSelectedStudentId(null);
      setSelectedStudentName("Select a Student");
      fetchData();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Could not assign student.");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (studentId, studentName) => {
    Alert.alert("Remove Student", `Remove ${studentName} from this room?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setRemoving(studentId);
          try {
            await API.post("/rooms/remove", { studentId, roomId });
            fetchData();
          } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Could not remove student.");
          } finally {
            setRemoving(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[T.screen, styles.safeArea]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView style={[T.screen, styles.safeArea]}>
        <View style={styles.container}>
          <Text style={T.title}>Room not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isFull = room.currentOccupancy >= room.capacity;

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[T.title, { marginTop: 0, marginBottom: 0 }]}>Room #{room.roomNumber}</Text>
        </View>

        {/* Room Summary */}
        <View style={[T.card, T.cardShadow, styles.summaryCard, isFull && styles.summaryCardFull]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>TYPE</Text>
              <Text style={styles.summaryValue}>{room.type || "Standard"}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>CAPACITY</Text>
              <Text style={styles.summaryValue}>{room.capacity}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>OCCUPIED</Text>
              <Text style={[styles.summaryValue, { color: isFull ? colors.error : colors.success }]}>
                {room.currentOccupancy}
              </Text>
            </View>
          </View>
          {isFull && (
            <View style={styles.fullBanner}>
              <Ionicons name="warning" size={16} color={colors.error} style={{ marginRight: 6 }} />
              <Text style={styles.fullBannerText}>This room is full. Remove a student before assigning a new one.</Text>
            </View>
          )}
        </View>

        {/* Assign Student Section */}
        {!isFull && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assign Student</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownHeader}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dropdownHeaderText, !selectedStudentId && { color: colors.placeholder }]}>
                  {selectedStudentName}
                </Text>
                <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {isDropdownOpen && (
                <View style={styles.dropdownList}>
                  {students.length === 0 ? (
                    <Text style={styles.noStudentsText}>No unassigned students left</Text>
                  ) : (
                    students.map((s, index) => {
                      const name = s.Profile?.name || s.Registration?.fullName || s.name || s.email;
                      return (
                        <TouchableOpacity
                          key={s._id}
                          style={[styles.dropdownOption, index === students.length - 1 && { borderBottomWidth: 0 }]}
                          onPress={() => {
                            setSelectedStudentId(s._id);
                            setSelectedStudentName(name);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.dropdownOptionText, selectedStudentId === s._id && styles.dropdownOptionTextActive]}>
                            {name}
                          </Text>
                          {selectedStudentId === s._id && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[T.primaryBtn, {backgroundColor: colors.success}, assigning && styles.assignBtnDisabled]}
              onPress={handleAssign}
              disabled={assigning}
            >
              {assigning ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={T.primaryBtnText}>Assign to Room</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Current Students */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Students</Text>
          {room.currentOccupancy === 0 ? (
            <View style={[T.card, styles.emptyState]}>
              <Ionicons name="people-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyText}>No students assigned yet.</Text>
            </View>
          ) : (
            <Text style={styles.occupancyNote}>
              Showing {room.currentOccupancy} student{room.currentOccupancy > 1 ? "s" : ""} in this room.
            </Text>
          )}
          {/* NOTE: Full allocation list requires a separate /api/rooms/:id/allocations endpoint.
              Display current occupancy count as the backend GET /rooms only returns aggregated counts. */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20, paddingBottom: 50 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 20, marginTop: 10 },
  backBtn: { marginRight: 14, padding: 6 },

  summaryCard: { padding: 20, marginBottom: 24 },
  summaryCardFull: { borderColor: "rgba(239,68,68,0.3)", backgroundColor: colors.errorBg },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center" },
  summaryLabel: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.5 },
  summaryValue: { fontSize: 22, fontWeight: "bold", color: colors.textPrimary },
  fullBanner: { flexDirection: "row", alignItems: "center", marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(239,68,68,0.3)" },
  fullBannerText: { color: colors.error, fontSize: 13, flex: 1 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary, marginBottom: 14 },

  dropdownContainer: { marginBottom: 14, zIndex: 10 },
  dropdownHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.input, padding: 14, borderRadius: 10 },
  dropdownHeaderText: { fontSize: 16, color: colors.textPrimary },
  dropdownList: { position: "absolute", top: 55, left: 0, right: 0, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, elevation: 10, zIndex: 999, maxHeight: 250 },
  dropdownOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  dropdownOptionText: { fontSize: 15, color: colors.textPrimary },
  dropdownOptionTextActive: { color: colors.primary, fontWeight: "bold" },
  noStudentsText: { padding: 15, color: colors.textSecondary, textAlign: "center" },

  assignBtnDisabled: { opacity: 0.7 },

  emptyState: { alignItems: "center", paddingVertical: 30 },
  emptyText: { color: colors.textSecondary, marginTop: 10, fontSize: 14 },
  occupancyNote: { color: colors.textSecondary, fontSize: 14, padding: 16, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder },
});

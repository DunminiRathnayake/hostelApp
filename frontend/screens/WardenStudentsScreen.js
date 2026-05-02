import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput, Alert, ScrollView } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T } from "../theme";

const AVATAR_COLORS = ["#7c3aed","#3b82f6","#10b981","#f59e0b","#ef4444","#ec4899","#06b6d4","#84cc16"];

const getAvatarColor = (name = "") => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

export default function WardenStudentsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await API.get("/users/students");
      setStudents(res.data);
      setFilteredStudents(res.data);
    } catch (err) {
      console.log("Students fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [fetchStudents])
  );

  const onRefresh = () => { setRefreshing(true); fetchStudents(); };

  useEffect(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      setFilteredStudents(students.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.assignedRoom && s.assignedRoom.toString().includes(q))
      ));
    } else {
      setFilteredStudents(students);
    }
  }, [searchQuery, students]);

  const handleRemove = (item) => {
    Alert.alert(
      "Remove Student",
      `Are you sure you want to remove ${item.name}? They will be deactivated and removed from their room.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            try {
              await API.put(`/users/deactivate/${item._id}`);
              fetchStudents();
            } catch(e) {
              Alert.alert("Error", e.response?.data?.message || "Failed to deactivate student.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const name = item.name || "Unknown";
    const initial = name.charAt(0).toUpperCase();
    const avatarColor = getAvatarColor(name);
    const isUnassigned = !item.assignedRoom || item.assignedRoom === "Unassigned";

    return (
      <View style={styles.tableRow}>
        {/* Student Col */}
        <View style={styles.colStudent}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.primaryText} numberOfLines={1}>{name}</Text>
            <Text style={styles.secondaryText} numberOfLines={1}>{item.email || "N/A"}</Text>
          </View>
        </View>

        {/* Campus/Contact Col */}
        <View style={styles.colContact}>
          <Text style={styles.primaryText}>{item.studentPhone || "N/A"}</Text>
          <Text style={styles.secondaryText}>{item.campus || "N/A"}</Text>
        </View>

        {/* Guardian Col */}
        <View style={styles.colGuardian}>
          <Text style={styles.primaryText} numberOfLines={1}>{item.parentName || "N/A"}</Text>
          <Text style={styles.secondaryText}>{item.parentPhone || "N/A"}</Text>
        </View>

        {/* Accommodation Col */}
        <View style={styles.colAccommodation}>
          <View style={[styles.roomBadge, isUnassigned ? styles.roomBadgeUnassigned : styles.roomBadgeAssigned]}>
            <Text style={[styles.roomBadgeText, { color: isUnassigned ? "#f59e0b" : "#16a34a" }]}>
              {isUnassigned ? "Unassigned" : `Room ${item.assignedRoom}`}
            </Text>
          </View>
        </View>

        {/* Status Col */}
        <View style={styles.colStatus}>
          <View style={styles.statusDotRow}>
            <View style={[styles.statusDot, { backgroundColor: item.isActive !== false ? '#16a34a' : '#cbd5e1' }]} />
            <Text style={styles.statusText}>{item.isActive !== false ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>

        {/* Actions Col */}
        <View style={styles.colActions}>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.removeBtn, item.isActive === false && {opacity: 0.5}]}
            disabled={item.isActive === false}
            onPress={() => handleRemove(item)}
          >
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Hostel Resident Directory</Text>

        <View style={styles.headerControls}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search residents..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>Total: {students.length}</Text>
          </View>
        </View>

        <View style={styles.tableContainer}>
          <ScrollView horizontal>
            <View>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, styles.colStudent]}>STUDENT</Text>
                <Text style={[styles.tableHeaderCell, styles.colContact]}>CAMPUS / CONTACT</Text>
                <Text style={[styles.tableHeaderCell, styles.colGuardian]}>GUARDIANS</Text>
                <Text style={[styles.tableHeaderCell, styles.colAccommodation]}>ACCOMMODATION</Text>
                <Text style={[styles.tableHeaderCell, styles.colStatus]}>STATUS</Text>
                <Text style={[styles.tableHeaderCell, styles.colActions]}>ACTIONS</Text>
              </View>

              {/* Table Body */}
              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
              ) : (
                <FlatList
                  data={filteredStudents}
                  keyExtractor={(i) => i._id}
                  renderItem={renderItem}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                      <Text style={styles.emptyText}>No students found.</Text>
                    </View>
                  }
                  contentContainerStyle={{ paddingBottom: 40 }}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },

  pageTitle: { fontSize: 24, fontWeight: "bold", color: colors.textPrimary, marginBottom: 20 },

  headerControls: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, zIndex: 10 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: colors.input, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, paddingHorizontal: 12, height: 44, flex: 1, marginRight: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: "100%", fontSize: 14, color: colors.textPrimary },
  totalBadge: { backgroundColor: colors.card, paddingHorizontal: 16, height: 44, borderRadius: 8, justifyContent: "center", borderWidth: 1, borderColor: colors.cardBorder },
  totalBadgeText: { color: colors.textPrimary, fontWeight: "600", fontSize: 14 },

  tableContainer: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, overflow: "hidden" },
  
  tableHeaderRow: { flexDirection: "row", backgroundColor: colors.card, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, paddingHorizontal: 16 },
  tableHeaderCell: { fontSize: 12, fontWeight: "bold", color: colors.textSecondary, letterSpacing: 0.5 },

  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  
  colStudent: { width: 220, flexDirection: "row", alignItems: "center" },
  colContact: { width: 160, justifyContent: "center" },
  colGuardian: { width: 160, justifyContent: "center" },
  colAccommodation: { width: 140, justifyContent: "center" },
  colStatus: { width: 100, justifyContent: "center" },
  colActions: { width: 180, flexDirection: "row", alignItems: "center", gap: 8 },

  avatar: { width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  textContainer: { flex: 1 },
  primaryText: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, marginBottom: 2 },
  secondaryText: { fontSize: 12, color: colors.textSecondary },

  roomBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, alignSelf: "flex-start" },
  roomBadgeAssigned: { backgroundColor: colors.successBg, borderColor: colors.success },
  roomBadgeUnassigned: { backgroundColor: colors.warningBg, borderColor: colors.warning },
  roomBadgeText: { fontSize: 12, fontWeight: "600" },

  statusDotRow: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, color: colors.textPrimary, fontWeight: "500" },

  editBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  editBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  removeBtn: { backgroundColor: colors.error, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  removeBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: colors.textSecondary, marginTop: 14, fontSize: 15 },
});

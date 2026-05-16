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
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

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

  const handleEdit = (item) => {
    // Show an action sheet style edit — navigate to a dedicated edit modal
    // For now, alert the warden with available contact info and let them confirm
    Alert.alert(
      `Edit: ${item.name}`,
      `Email: ${item.email}\nPhone: ${item.studentPhone || 'N/A'}\nCampus: ${item.campus || 'N/A'}\n\nTo edit, please use the full profile editor.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Student",
          style: "destructive",
          onPress: () => handleDelete(item)
        }
      ]
    );
  };

  const handleDelete = (item) => {
    Alert.alert(
      "Delete Student",
      `Are you sure you want to permanently delete ${item.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`/users/${item._id}`);
              fetchStudents();
            } catch(e) {
              Alert.alert("Error", e.response?.data?.message || "Failed to delete student.");
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

    const isExpanded = expandedId === item._id;

    return (
      <View style={[T.card, T.cardShadow, styles.card]}>
        <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(item._id)}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.primaryText} numberOfLines={1}>{name}</Text>
            <Text style={styles.secondaryText} numberOfLines={1}>{item.email || "N/A"}</Text>
          </View>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.cardExpanded}>
            <View style={styles.divider} />
            
            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{item.studentPhone || "N/A"}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Campus</Text>
                <Text style={styles.detailValue}>{item.campus || "N/A"}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Guardian</Text>
                <Text style={styles.detailValue}>{item.parentName || "N/A"}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Guardian Phone</Text>
                <Text style={styles.detailValue}>{item.parentPhone || "N/A"}</Text>
              </View>
            </View>

            <View style={styles.badgesRow}>
              <View style={[styles.roomBadge, isUnassigned ? styles.roomBadgeUnassigned : styles.roomBadgeAssigned]}>
                <Text style={[styles.roomBadgeText, { color: isUnassigned ? "#f59e0b" : "#16a34a" }]}>
                  {isUnassigned ? "Unassigned" : `Room ${item.assignedRoom}`}
                </Text>
              </View>
              <View style={styles.statusDotRow}>
                <View style={[styles.statusDot, { backgroundColor: item.isActive !== false ? '#16a34a' : '#cbd5e1' }]} />
                <Text style={styles.statusText}>{item.isActive !== false ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.editBtn, { flex: 1, marginRight: 8 }]}
                onPress={() => handleEdit(item)}
              >
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.removeBtn, { flex: 1, marginLeft: 8 }]}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.removeBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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

        <View style={styles.listContainer}>
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

  listContainer: { flex: 1 },
  
  card: { padding: 0, overflow: 'hidden', marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 16 },
  
  avatar: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 14 },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  textContainer: { flex: 1 },
  primaryText: { fontSize: 16, fontWeight: "600", color: colors.textPrimary, marginBottom: 4 },
  secondaryText: { fontSize: 13, color: colors.textSecondary },

  cardExpanded: { paddingHorizontal: 16, paddingBottom: 16 },
  divider: { height: 1, backgroundColor: colors.cardBorder, marginBottom: 16 },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  detailCol: { width: '50%', marginBottom: 12 },
  detailLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  detailValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },

  badgesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  
  roomBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1 },
  roomBadgeAssigned: { backgroundColor: colors.successBg, borderColor: colors.success },
  roomBadgeUnassigned: { backgroundColor: colors.warningBg, borderColor: colors.warning },
  roomBadgeText: { fontSize: 12, fontWeight: "600" },

  statusDotRow: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, color: colors.textPrimary, fontWeight: "500" },

  actionButtons: { flexDirection: "row", justifyContent: "space-between" },
  editBtn: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
  editBtnText: { color: colors.primary, fontSize: 13, fontWeight: "bold" },
  removeBtn: { backgroundColor: colors.errorBg, alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
  removeBtnText: { color: colors.error, fontSize: 13, fontWeight: "bold" },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: colors.textSecondary, marginTop: 14, fontSize: 15 },
});

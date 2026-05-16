import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, SafeAreaView, ActivityIndicator
} from "react-native";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T, getStatusBadge } from "../theme";

export default function WardenComplaintsScreen() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/complaints");
      setComplaints(res.data.complaints || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaints. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const markResolved = async (id) => {
    try {
      await API.put(`/complaints/${id}/status`, { status: "resolved" });
      Alert.alert("Success", "Complaint marked as resolved");
      fetchComplaints();
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.join("\n") || err.response?.data?.message || "Could not update status.";
      Alert.alert("Error", errorMsg);
    }
  };

  const deleteComplaint = async (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this complaint?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`/complaints/${id}`);
              Alert.alert("Deleted", "Complaint removed.");
              fetchComplaints();
            } catch (err) {
              const msg = err.response?.data?.message || err.message || "Unknown error";
              Alert.alert("Error", `Could not delete complaint: ${msg}`);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isPending = item.status !== "resolved";
    const { badge, text } = getStatusBadge(item.status);

    return (
      <View style={[T.card, T.cardShadow, styles.card]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={[badge]}>
              <Text style={[text]}>
                {(item.status || "PENDING").toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deleteComplaint(item._id)} style={styles.trashBtn}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Student name */}
        <View style={styles.studentRow}>
          <Ionicons name="person-outline" size={13} color={colors.textMuted} />
          <Text style={styles.studentName}>{item.studentId?.name || "Unknown Student"}</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>{item.description}</Text>

        {/* Date */}
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>

        {/* Resolve action */}
        {isPending && (
          <TouchableOpacity style={[T.primaryBtn, { marginTop: 12 }]} onPress={() => markResolved(item._id)}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={T.primaryBtnText}>Mark as Resolved</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Error state ──────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <SafeAreaView style={[T.screen, styles.safeArea]}>
        <View style={styles.errorState}>
          <Ionicons name="cloud-offline-outline" size={52} color={colors.error} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchComplaints}>
            <Ionicons name="refresh-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          style={styles.container}
          data={complaints}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={{ marginBottom: 15, marginTop: 10 }}>
              <Text style={T.title}>Issues</Text>
              <Text style={T.subtitle}>Manage student complaints</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No complaints</Text>
              <Text style={styles.emptyText}>Students haven't filed any complaints yet.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20 },

  card: { padding: 18 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6, alignItems: "center" },
  title: { fontSize: 16, fontWeight: "bold", color: colors.textPrimary, flex: 1 },
  trashBtn: { marginLeft: 10, padding: 4 },

  studentRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  studentName: { fontSize: 13, color: colors.textMuted, fontStyle: "italic" },

  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginBottom: 8 },

  dateRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dateText: { fontSize: 11, color: colors.textMuted, fontStyle: "italic" },

  // Error state
  errorState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  errorTitle: { fontSize: 20, fontWeight: "700", color: colors.textPrimary, marginTop: 16, marginBottom: 8 },
  errorMsg: { fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 21 },
  retryBtn: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, paddingVertical: 13, paddingHorizontal: 28, borderRadius: 14 },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginTop: 14, marginBottom: 6 },
  emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },
});

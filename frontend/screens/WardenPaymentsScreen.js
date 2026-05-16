import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  SafeAreaView, ActivityIndicator, Modal, Image, Pressable
} from "react-native";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T, getStatusBadge } from "../theme";

const BASE_URL = "https://hostelapp-production-3c24.up.railway.app";

export default function WardenPaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // receipt image modal

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/payments");
      setPayments(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payments. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/payments/${id}`, { status });
      Alert.alert("Success", `Payment marked as ${status}`);
      fetchPayments();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Could not update payment status.");
    }
  };

  const deletePayment = async (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this payment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`/payments/${id}`);
              Alert.alert("Deleted", "Payment removed successfully.");
              fetchPayments();
            } catch (err) {
              Alert.alert("Error", err.response?.data?.message || "Failed to delete payment");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isPending = item.status === "pending";
    const { badge, text } = getStatusBadge(item.status);
    const hasReceipt = !!item.receiptUrl;

    return (
      <View style={[T.card, T.cardShadow, styles.card]}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <Text style={styles.studentName} numberOfLines={1}>{item.studentName || "Unknown"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={[badge]}>
              <Text style={[text]}>
                {(item.status || "PENDING").replace("_", " ").toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deletePayment(item._id)} style={styles.trashBtn}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount + category */}
        <Text style={styles.amount}>LKR {item.amount?.toLocaleString()}</Text>
        {item.category && (
          <Text style={styles.category}>
            {item.category === "monthly" ? "Monthly Rent" : item.category === "key_money" ? "Key Money" : "Other"}
          </Text>
        )}

        {/* Receipt viewer button */}
        {hasReceipt && (
          <TouchableOpacity
            style={styles.receiptBtn}
            onPress={() => setPreviewUrl(`${BASE_URL}${item.receiptUrl}`)}
          >
            <Ionicons name="image-outline" size={16} color={colors.info} />
            <Text style={styles.receiptBtnText}>View Receipt</Text>
          </TouchableOpacity>
        )}

        {/* Approve / Reject actions */}
        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => updateStatus(item._id, "approved")}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.btnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => updateStatus(item._id, "rejected")}>
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ── Receipt Image Modal ──────────────────────────────────────────
  const ReceiptModal = () => (
    <Modal visible={!!previewUrl} transparent animationType="fade" onRequestClose={() => setPreviewUrl(null)}>
      <Pressable style={styles.modalOverlay} onPress={() => setPreviewUrl(null)}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Payment Receipt</Text>
          {previewUrl && (
            <Image
              source={{ uri: previewUrl }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
          )}
          <TouchableOpacity style={styles.modalClose} onPress={() => setPreviewUrl(null)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  // ── Error State ──────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <SafeAreaView style={[T.screen, styles.safeArea]}>
        <View style={styles.errorState}>
          <Ionicons name="cloud-offline-outline" size={52} color={colors.error} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPayments}>
            <Ionicons name="refresh-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <ReceiptModal />
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          style={styles.container}
          data={payments}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={{ marginBottom: 15, marginTop: 10 }}>
              <Text style={T.title}>Payments</Text>
              <Text style={T.subtitle}>Approve or reject student payments</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No payments yet</Text>
              <Text style={styles.emptyText}>Student payment submissions will appear here.</Text>
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
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, alignItems: "center" },
  studentName: { fontSize: 16, fontWeight: "bold", color: colors.textPrimary, flex: 1 },
  trashBtn: { marginLeft: 10, padding: 4 },
  amount: { fontSize: 22, color: colors.textPrimary, fontWeight: "700", marginBottom: 4 },
  category: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },

  receiptBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.infoBg, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12,
    borderWidth: 1, borderColor: "rgba(91,200,255,0.25)", alignSelf: "flex-start",
  },
  receiptBtnText: { color: colors.info, fontWeight: "600", fontSize: 13 },

  actions: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  btn: { flex: 1, padding: 12, borderRadius: 10, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  approveBtn: { backgroundColor: colors.success },
  rejectBtn: { backgroundColor: colors.error },
  btnText: { color: "#fff", fontWeight: "bold" },

  // Receipt modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalBox: { backgroundColor: colors.card, borderRadius: 24, padding: 20, width: "100%", maxWidth: 420, borderWidth: 1, borderColor: colors.cardBorder },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginBottom: 16, textAlign: "center" },
  receiptImage: { width: "100%", height: 340, borderRadius: 14, backgroundColor: colors.surface },
  modalClose: { marginTop: 16, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  modalCloseText: { color: "#fff", fontWeight: "700", fontSize: 15 },

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

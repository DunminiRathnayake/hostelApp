// BookingManagementScreen.js
import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useRouter } from "expo-router";
import { colors, T, getStatusBadge } from "../theme";
import { Ionicons } from "@expo/vector-icons";

export default function BookingManagementScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await API.get("/bookings");
      setBookings(res.data || []);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await API.put(`/bookings/${id}/status`, { status });
      Alert.alert("Success", `Booking ${status}`);
      fetchBookings();
    } catch (e) {
      console.log(e);
      Alert.alert("Error", e.response?.data?.message || e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteBooking = async (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this booking?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`/bookings/${id}`);
              Alert.alert("Success", "Booking deleted");
              fetchBookings();
            } catch (e) {
              Alert.alert("Error", e.response?.data?.message || e.message);
            }
          }
        }
      ]
    );
  };

  const renderBooking = (b) => {
    const { badge, text } = getStatusBadge(b.status);
    return (
      <View key={b._id} style={[T.card, T.cardShadow, styles.card]}>
        <View style={styles.rowHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.visitor}>Visitor: {b.visitorName}</Text>
            {b.studentName && <Text style={styles.student}>Student: {b.studentName}</Text>}
          </View>
          {user?.role === "warden" && (
            <TouchableOpacity onPress={() => deleteBooking(b._id)} style={{ padding: 4 }}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{new Date(b.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <View style={badge}>
            <Text style={text}>{(b.status || "pending").toUpperCase()}</Text>
          </View>
        </View>
        {b.status === "pending" && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => updateStatus(b._id, "approved")} disabled={updatingId === b._id}>
              {updatingId === b._id ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Approve</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => updateStatus(b._id, "rejected")} disabled={updatingId === b._id}>
              {updatingId === b._id ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Reject</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[T.title, { textAlign: "center" }]}>Booking Management</Text>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        bookings.map(renderBooking)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.bg, flexGrow: 1 },
  card: { marginBottom: 16 },
  rowHeader: { flexDirection: "column", marginBottom: 8 },
  visitor: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  student: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontWeight: "600", color: colors.textPrimary },
  value: { color: colors.textSecondary },
  actions: { flexDirection: "row", justifyContent: "space-around", marginTop: 10 },
  actionBtn: { flex: 0.45, paddingVertical: 8, borderRadius: 6, alignItems: "center" },
  approveBtn: { backgroundColor: colors.success },
  rejectBtn: { backgroundColor: colors.error },
  actionText: { color: "#fff", fontWeight: "600" },
});

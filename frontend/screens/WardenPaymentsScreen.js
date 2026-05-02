import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from "react-native";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T, getStatusBadge } from "../theme";

export default function WardenPaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await API.get("/payments");
      setPayments(res.data);
    } catch (err) {
      console.log(err);
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
      Alert.alert("Error", "Could not update payment status.");
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
              Alert.alert("Success", "Payment deleted");
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
    
    return (
      <View style={[T.card, T.cardShadow, styles.card]}>
        <View style={styles.cardHeader}>
          <Text style={styles.studentName} numberOfLines={1}>{item.studentName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[badge]}>
              <Text style={[text]}>
                {(item.status || "PENDING").replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deletePayment(item._id)} style={{ marginLeft: 10, padding: 4 }}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.amount}>LKR {item.amount.toLocaleString()}</Text>
        
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

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      {loading ? <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 40}} /> : (
        <FlatList
          style={styles.container}
          data={payments}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={{ marginBottom: 15, marginTop: 10 }}>
              <Text style={T.title}>Payments</Text>
              <Text style={T.subtitle}>Approve or reject payments</Text>
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
  card: { padding: 20 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, alignItems: "center" },
  studentName: { fontSize: 16, fontWeight: "bold", color: colors.textPrimary, flex: 1 },
  amount: { fontSize: 20, color: colors.textPrimary, fontWeight: "600", marginBottom: 15 },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  btn: { flex: 1, padding: 12, borderRadius: 8, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  approveBtn: { backgroundColor: colors.success, marginRight: 5 },
  rejectBtn: { backgroundColor: colors.error, marginLeft: 5 },
  btnText: { color: "#fff", fontWeight: "bold", marginLeft: 5 }
});

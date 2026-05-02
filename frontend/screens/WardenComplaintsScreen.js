import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from "react-native";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T, getStatusBadge } from "../theme";

export default function WardenComplaintsScreen() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await API.get("/complaints");
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.log(err);
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
      Alert.alert("Error", "Could not update status.");
    }
  };

  const renderItem = ({ item }) => {
    const isPending = item.status !== "resolved";
    const { badge, text } = getStatusBadge(item.status);
    
    return (
      <View style={[T.card, T.cardShadow, styles.card]}>
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <View style={[badge]}>
            <Text style={[text]}>
              {(item.status || "PENDING").toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.studentName}>By: {item.studentId?.name || "Unknown Student"}</Text>
        <Text style={styles.description}>{item.description}</Text>
        
        {isPending && (
          <TouchableOpacity style={T.primaryBtn} onPress={() => markResolved(item._id)}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" style={{marginRight: 8}} />
            <Text style={T.primaryBtnText}>Mark as Resolved</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      {loading ? <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 40}} /> : (
        <FlatList
          style={styles.container}
          data={complaints}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={{ marginBottom: 15, marginTop: 10 }}>
              <Text style={T.title}>Issues</Text>
              <Text style={T.subtitle}>Manage student issues</Text>
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
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5, alignItems: "center" },
  title: { fontSize: 16, fontWeight: "bold", color: colors.textPrimary, flex: 1 },
  studentName: { fontSize: 14, color: colors.textMuted, marginBottom: 10, fontStyle: "italic" },
  description: { fontSize: 15, color: colors.textSecondary, marginBottom: 15 }
});

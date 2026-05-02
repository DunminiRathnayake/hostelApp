// BookingStatusScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import API from "../services/api";
import { useRouter } from "expo-router";
import { colors, T, getStatusBadge } from "../theme";
import { Ionicons } from "@expo/vector-icons";

export default function BookingStatusScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [NIC, setNIC] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);

  const checkStatus = async () => {
    if (!phone || !NIC) {
      Alert.alert("Validation", "Phone and NIC are required");
      return;
    }
    setLoading(true);
    try {
      const res = await API.get(`/bookings/public/status?phone=${phone}&NIC=${NIC}`);
      if (res.data && res.data.length > 0) {
        // Assuming the latest booking is first
        setBooking(res.data[0]);
      } else {
        Alert.alert("Info", "No bookings found for provided details");
        setBooking(null);
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Error", e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[T.title, { textAlign: "center" }]}>Check Booking Status</Text>
      <View style={[T.card, T.cardShadow]}>
        <Text style={T.label}>Phone</Text>
        <TextInput style={T.input} placeholder="0712345678" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <Text style={T.label}>NIC</Text>
        <TextInput style={T.input} placeholder="123456789V" value={NIC} onChangeText={setNIC} />
        <TouchableOpacity style={T.primaryBtn} onPress={checkStatus} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={T.primaryBtnText}>Check Status</Text>}
        </TouchableOpacity>
      </View>
      {booking && (
        <View style={[T.card, T.cardShadow, styles.resultCard]}>
          <View style={styles.row}>
            <Text style={styles.label}>Visit Type:</Text>
            <Text style={styles.value}>{booking.type === 'student_visit' ? 'Student Visit' : 'Room Visit'}</Text>
          </View>
          {booking.type === 'student_visit' && (
            <View style={styles.row}>
              <Text style={styles.label}>Student Name:</Text>
              <Text style={styles.value}>{booking.studentName || "N/A"}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Visitor Name:</Text>
            <Text style={styles.value}>{booking.visitorName || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date & Time:</Text>
            <Text style={styles.value}>
              {new Date(booking.date).toLocaleDateString()} {booking.time ? `at ${booking.time}` : ''}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <View style={getStatusBadge(booking.status).badge}>
              <Text style={getStatusBadge(booking.status).text}>{booking.status?.toUpperCase() || "PENDING"}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.bg, flexGrow: 1 },
  resultCard: { marginTop: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label: { fontWeight: "600", color: colors.textPrimary },
  value: { color: colors.textSecondary },
});

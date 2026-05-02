import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { colors, T } from "../theme";
import { Ionicons } from "@expo/vector-icons";

export default function VisitorDashboard() {
  const router = useRouter();

  const handleGoHome = () => {
    router.replace("/(auth)");
  };

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={T.title}>Visitor Access</Text>
          <Text style={T.subtitle}>Manage your hostel visits simply and securely.</Text>
        </View>

        <View style={[T.card, T.cardShadow, styles.card]}>
          <Text style={styles.cardTitle}>Book a Visit</Text>
          <Text style={styles.cardDescription}>Schedule an appointment to visit a student or the hostel facility.</Text>
          <TouchableOpacity style={[T.primaryBtn, { marginBottom: 10 }]} onPress={() => router.push('/(visitor)/create-booking')}>
            <Text style={T.primaryBtnText}>Book a Visit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[T.card, T.cardShadow, styles.card]}>
          <Text style={styles.cardTitle}>Check Booking Status</Text>
          <Text style={styles.cardDescription}>Already booked? Track the approval status of your visit request.</Text>
          <TouchableOpacity style={[T.primaryBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary }]} onPress={() => router.push('/(visitor)/booking-status')}>
            <Text style={[T.primaryBtnText, { color: colors.primary }]}>Check Status</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
          <Ionicons name="home-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <Text style={styles.homeText}>Return to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flexGrow: 1, padding: 20, alignItems: "center" },
  header: { marginBottom: 30, alignItems: "center", width: "100%", marginTop: 20 },
  card: { padding: 20, marginBottom: 20, width: "100%" },
  cardTitle: { fontSize: 20, fontWeight: "600", marginBottom: 10, color: colors.textPrimary },
  cardDescription: { fontSize: 14, color: colors.textSecondary, marginBottom: 20, lineHeight: 20 },
  homeButton: { 
    marginTop: 20, 
    flexDirection: "row",
    padding: 15, 
    width: "100%", 
    alignItems: "center", 
    justifyContent: "center",
    borderWidth: 1, 
    borderColor: colors.inputBorder, 
    borderRadius: 12,
    backgroundColor: colors.input
  },
  homeText: { color: colors.textSecondary, fontWeight: "bold", fontSize: 16 }
});

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import API from "../services/api";
import { colors, T } from "../theme";
import { Ionicons } from "@expo/vector-icons";

export default function QRCodeScreen() {
  const router = useRouter();
  const [qrData, setQrData] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [timeLeft, setTimeLeft] = useState(45);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { logout } = React.useContext(require("../context/AuthContext").AuthContext);

  // Generate a random session/device ID on mount
  const [deviceId] = useState(Math.random().toString(36).substring(2, 15));

  const fetchQRCode = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setError(false);
      const res = await API.get(`/users/my-qr?deviceId=${deviceId}`);
      setQrData(res.data.token);
      setQrImage(res.data.qrImage);
      setTimeLeft(45);
      if (!isBackground) setLoading(false);
    } catch (error) {
      console.log("Error fetching QR code:", error);
      let msg = error.response?.data?.message || (error.message === 'Network Error' ? "Server Unreachable (Network Error)" : error.message);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        msg = "Session Expired. Please log out and log in again.";
      }
      
      setError(msg);
      if (!isBackground) setLoading(false);
    }
  };

  const handleAuthErrorLogout = async () => {
    await logout();
    router.replace("/(auth)");
  };

  useEffect(() => {
    fetchQRCode(false);
  }, []);

  // Auto refresh QR every 45 seconds smoothly
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchQRCode(true); // background refresh, no loading screen
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  if (loading) {
    return (
      <View style={[T.screen, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your QR code...</Text>
      </View>
    );
  }

  const qrValue = JSON.stringify({ token: qrData });

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[T.card, T.cardShadow, styles.card]}>
          <Text style={[T.title, { marginBottom: 8, marginTop: 0 }]}>My QR Code</Text>
          <Text style={styles.subtitle}>Show this code to enter or exit</Text>

          <View style={styles.qrWrapper}>
            {qrImage ? (
              <Image 
                source={{ uri: qrImage }} 
                style={{ width: 250, height: 250 }} 
                resizeMode="contain"
              />
            ) : qrData ? (
              <QRCode value={qrValue} size={250} backgroundColor="white" color="black" />
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name={error.includes("Session") ? "lock-closed-outline" : "cloud-offline-outline"} size={48} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                
                {error.includes("Session") ? (
                  <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.error }]} onPress={handleAuthErrorLogout}>
                    <Text style={styles.retryText}>Secure Log Out</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.retryBtn} onPress={fetchQRCode}>
                    <Text style={styles.retryText}>Retry Connection</Text>
                  </TouchableOpacity>
                )}
                
                {!error.includes("Session") && (
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: 'center' }}>Check your connection or server status</Text>
                )}
              </View>
            ) : (
              <Text style={styles.errorText}>Initializing hardware sync...</Text>
            )}
          </View>

          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>Updates automatically</Text>
            <Text style={styles.timerText}>(in {timeLeft}s)</Text>
          </View>
        </View>

        <TouchableOpacity style={T.outlineBtn} onPress={() => router.back()}>
          <Text style={T.outlineBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { 
    flexGrow: 1, 
    padding: 24, 
    justifyContent: "center" 
  },
  loadingContainer: { 
    justifyContent: "center", 
    alignItems: "center" 
  },
  loadingText: { 
    color: colors.textSecondary, 
    fontSize: 16,
    marginTop: 10
  },
  card: { 
    width: "100%", 
    alignItems: "center",
    padding: 30,
    marginBottom: 20
  },
  subtitle: { 
    fontSize: 16, 
    color: colors.textSecondary, 
    marginBottom: 32, 
    textAlign: "center"
  },
  qrWrapper: { 
    padding: 16, 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16,
    marginBottom: 32
  },
  errorContainer: {
    alignItems: "center",
    padding: 20
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600"
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  retryText: {
    color: "white",
    fontWeight: "bold"
  },
  noteContainer: { 
    alignItems: "center",
    backgroundColor: "rgba(108,99,255,0.12)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: "100%"
  },
  noteText: { 
    color: colors.primary, 
    fontSize: 14, 
    textAlign: "center",
    marginBottom: 4,
    fontWeight: "bold"
  },
  timerText: { 
    color: colors.primary, 
    fontSize: 13, 
    fontWeight: "600" 
  }
});

import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Animated, Vibration, ScrollView
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

// ── Constants ────────────────────────────────────────────────────────────────
const SCAN_COOLDOWN_MS = 3000; // prevent duplicate scans within 3s

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // { success, message, type, studentName }
  const [recentLogs, setRecentLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const lastScanRef = useRef(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Fetch recent check-in logs on mount and after each scan
  const fetchRecentLogs = async () => {
    try {
      const res = await API.get("/checkin");
      setRecentLogs((res.data || []).slice(0, 8)); // show last 8
    } catch (err) {
      console.log("[QRScanner] fetchLogs error:", err.message);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentLogs();
    // Auto-refresh logs every 10s
    const id = setInterval(fetchRecentLogs, 10000);
    return () => clearInterval(id);
  }, []);

  // Animate result card in
  const showResult = (data) => {
    setResult(data);
    setScanning(false);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true })
    ]).start();
  };

  const handleBarCodeScanned = async ({ data }) => {
    // Cooldown guard — prevent duplicate rapid scans
    const now = Date.now();
    if (!scanning || processing || now - lastScanRef.current < SCAN_COOLDOWN_MS) return;
    lastScanRef.current = now;

    setProcessing(true);

    // Parse the QR value — the student app encodes { token: "..." }
    let token = data;
    try {
      const parsed = JSON.parse(data);
      if (parsed.token) token = parsed.token;
    } catch (_) {
      // raw token string — use as-is
    }

    try {
      // In production, get stable ID from expo-application
      const scannerDeviceId = "warden_device_" + Math.random().toString(36).substring(7);
      const res = await API.post("/checkin/scan", { token, scannerDeviceId });
      const msg = res.data?.message || "Scan recorded";
      const logType = res.data?.type || (msg.toLowerCase().includes("check-out") ? "check-out" : "check-in");

      Vibration.vibrate(logType === "check-in" ? 200 : [100, 100, 200]);

      showResult({
        success: true,
        type: logType,
        message: msg,
        studentName: res.data?.log?.user?.name || res.data?.log?.studentName || "Student"
      });

      // Refresh logs list so warden dashboard updates immediately
      fetchRecentLogs();
    } catch (err) {
      Vibration.vibrate([200, 100, 200]);
      showResult({
        success: false,
        type: "error",
        message: err.response?.data?.message || "Invalid or expired QR code",
        studentName: null
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setScanning(true);
  };

  const formatTime = (d) => {
    if (!d) return "--:--";
    return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // ── Permission screen ───────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <Ionicons name="camera-outline" size={72} color={colors.primary} />
        <Text style={styles.permTitle}>Camera Permission Required</Text>
        <Text style={styles.permSubtitle}>
          This screen needs camera access to scan student QR codes.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>QR Scanner</Text>
          <Text style={styles.headerSubtitle}>Scan student QR to check in / out</Text>
        </View>

        {/* Camera View */}
        <View style={styles.cameraContainer}>
          {scanning ? (
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={processing ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            >
              {/* Scanning frame overlay */}
              <View style={styles.overlay}>
                <View style={styles.scanFrame}>
                  {/* Corner accents */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
                {processing && (
                  <View style={styles.processingBadge}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.processingText}>Processing...</Text>
                  </View>
                )}
              </View>
            </CameraView>
          ) : (
            /* Result card */
            <Animated.View
              style={[
                styles.resultCard,
                result?.success
                  ? result.type === "check-in" ? styles.resultIn : styles.resultOut
                  : styles.resultError,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
              ]}
            >
              <Ionicons
                name={result?.success
                  ? result.type === "check-in" ? "log-in" : "log-out"
                  : "close-circle"
                }
                size={64}
                color="#fff"
                style={{ marginBottom: 16 }}
              />

              {result?.success && (
                <Text style={styles.resultName}>{result.studentName}</Text>
              )}

              <Text style={styles.resultType}>
                {result?.success
                  ? result.type === "check-in" ? "✓ CHECKED IN" : "✓ CHECKED OUT"
                  : "INVALID QR"
                }
              </Text>

              <Text style={styles.resultMsg}>{result?.message}</Text>

              <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScanner}>
                <Ionicons name="scan" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.scanAgainText}>Scan Next Student</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Recent Logs */}
        <View style={styles.logsSection}>
          <View style={styles.logsSectionHeader}>
            <Ionicons name="time-outline" size={18} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.logsSectionTitle}>Today's Activity</Text>
          </View>

          {logsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : recentLogs.length === 0 ? (
            <View style={styles.emptyLogs}>
              <Ionicons name="scan-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyLogsText}>No scans recorded yet today</Text>
            </View>
          ) : (
            recentLogs.map((log) => {
              const isCheckIn = !!log.checkInTime;
              return (
                <View key={log._id} style={styles.logRow}>
                  <View style={[styles.logIcon, isCheckIn ? styles.logIconIn : styles.logIconOut]}>
                    <Ionicons
                      name={isCheckIn ? "log-in-outline" : "log-out-outline"}
                      size={16}
                      color={isCheckIn ? colors.success : colors.warning}
                    />
                  </View>
                  <View style={styles.logInfo}>
                    <Text style={styles.logName}>
                      {log.studentId?.name || log.studentId?.fullName || "Student"}
                    </Text>
                    <Text style={styles.logType}>
                      {isCheckIn ? "Check In" : "Check Out"}
                    </Text>
                  </View>
                  <Text style={styles.logTime}>
                    {formatTime(log.checkInTime || log.checkOutTime)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const FRAME_SIZE = 260;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },

  // Permission
  permissionScreen: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, backgroundColor: colors.background },
  permTitle: { fontSize: 22, fontWeight: "bold", color: colors.textPrimary, marginTop: 20, textAlign: "center" },
  permSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: "center", marginTop: 10, lineHeight: 22, marginBottom: 30 },
  permBtn: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  permBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: colors.textPrimary },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },

  // Camera
  cameraContainer: {
    marginHorizontal: 20,
    height: FRAME_SIZE + 40,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 24,
  },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "#fff",
    borderWidth: 4,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  processingBadge: {
    position: "absolute",
    bottom: -50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  processingText: { color: "#fff", marginLeft: 8, fontWeight: "600" },

  // Result
  resultCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  resultIn: { backgroundColor: colors.success },
  resultOut: { backgroundColor: colors.warning },
  resultError: { backgroundColor: colors.error },
  resultName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8, textAlign: "center" },
  resultType: { fontSize: 20, fontWeight: "900", color: "#fff", letterSpacing: 2, marginBottom: 10 },
  resultMsg: { fontSize: 14, color: "rgba(255,255,255,0.85)", textAlign: "center", marginBottom: 32, lineHeight: 20 },
  scanAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  scanAgainText: { color: colors.primary, fontWeight: "bold", fontSize: 15 },

  // Logs
  logsSection: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  logsSectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  logsSectionTitle: { fontSize: 16, fontWeight: "bold", color: colors.textPrimary },
  emptyLogs: { alignItems: "center", paddingVertical: 24 },
  emptyLogsText: { color: colors.textMuted, marginTop: 8, fontSize: 14 },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  logIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logIconIn: { backgroundColor: "rgba(16,185,129,0.12)" },
  logIconOut: { backgroundColor: "rgba(245,158,11,0.12)" },
  logInfo: { flex: 1 },
  logName: { fontSize: 14, fontWeight: "bold", color: colors.textPrimary },
  logType: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  logTime: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
});

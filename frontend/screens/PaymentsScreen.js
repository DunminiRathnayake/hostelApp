import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, Platform, SafeAreaView, Animated, StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, T, getStatusBadge } from "../theme";

const PAYMENT_TYPES = ["Monthly Rent", "Key Money", "Other"];

const STATUS_META = {
  pending:  { icon: "time-outline",             color: colors.warning, bg: colors.warningBg },
  approved: { icon: "checkmark-circle-outline", color: colors.success, bg: colors.successBg },
  rejected: { icon: "close-circle-outline",     color: colors.error,   bg: colors.errorBg   },
};

function AnimatedPaymentItem({ item, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 340, delay: index * 80, useNativeDriver: true }).start();
  }, []);

  const { badge, text } = getStatusBadge(item.status);
  const meta = STATUS_META[item.status?.toLowerCase()] || STATUS_META.pending;

  let displayCategory = "Other";
  if (item.category === "monthly")   displayCategory = "Monthly Rent";
  if (item.category === "key_money") displayCategory = "Key Money";
  if (item.category === "other" && item.description) {
    displayCategory = item.description === "fines" ? "Fines" : item.description;
  }

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
    }}>
      <View style={styles.payItem}>
        <View style={[styles.payIconWrap, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>
        <View style={styles.payInfo}>
          <Text style={styles.payCat} numberOfLines={1}>{displayCategory}</Text>
          <Text style={styles.payDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.payRight}>
          <Text style={[styles.payAmt, { color: meta.color }]}>LKR {item.amount.toLocaleString()}</Text>
          <View style={[badge, styles.badgeSmall]}>
            <Text style={[text, { fontSize: 10 }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── PaymentForm: owns all form state so typing never re-renders the parent ───
function PaymentForm({ onSubmitted }) {
  const [amount,     setAmount]     = useState("");
  const [category,   setCategory]   = useState("Monthly Rent");
  const [dropOpen,   setDropOpen]   = useState(false);
  const [slip,       setSlip]       = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled) setSlip(result.assets[0]);
  };

  const upload = async () => {
    if (!amount || !category || !slip) {
      Alert.alert("Required Fields", "Please enter the amount, select a type, and attach your receipt.");
      return;
    }
    let dbCategory = "other";
    if (category === "Monthly Rent") dbCategory = "monthly";
    if (category === "Key Money")    dbCategory = "key_money";

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("category", dbCategory);
      if (category === "Other") formData.append("description", "other payment");
      formData.append("paymentType", "bank_transfer");
      formData.append("slipImage", {
        uri: Platform.OS === "ios" ? slip.uri.replace("file://", "") : slip.uri,
        name: "slip.jpg",
        type: slip.mimeType || "image/jpeg",
      });
      await API.post("/payments", formData, { headers: { "Content-Type": "multipart/form-data" } });
      Alert.alert("Payment Submitted ✓", "Your receipt is pending warden approval.");
      setAmount(""); setCategory("Monthly Rent"); setSlip(null); setDropOpen(false);
      onSubmitted();
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.join("\n") || err.response?.data?.message || err.message;
      Alert.alert("Upload Error", errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.formCard, T.cardShadow]}>
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={16} color={colors.info} />
        <Text style={styles.infoText}>Upload a clear photo of your bank deposit slip for warden review.</Text>
      </View>

      <Text style={T.label}>AMOUNT (LKR)</Text>
      <View style={styles.inputWrap}>
        <Ionicons name="cash-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="e.g. 15000"
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      <Text style={T.label}>PAYMENT TYPE</Text>
      <View style={styles.dropWrap}>
        <TouchableOpacity style={styles.dropHeader} onPress={() => setDropOpen(o => !o)} activeOpacity={0.8}>
          <View style={styles.dropHeaderLeft}>
            <Ionicons name="receipt-outline" size={17} color={colors.textMuted} style={{ marginRight: 10 }} />
            <Text style={styles.dropHeaderText}>{category}</Text>
          </View>
          <Ionicons name={dropOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        {dropOpen && (
          <View style={styles.dropList}>
            {PAYMENT_TYPES.map((type, i) => (
              <TouchableOpacity
                key={type}
                style={[styles.dropOption, i === PAYMENT_TYPES.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => { setCategory(type); setDropOpen(false); }}
              >
                <Text style={[styles.dropOptionText, category === type && styles.dropOptionActive]}>{type}</Text>
                {category === type && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <Text style={T.label}>RECEIPT IMAGE</Text>
      <TouchableOpacity style={[styles.uploadArea, slip && styles.uploadAreaDone]} onPress={pickImage}>
        <View style={[styles.uploadIconRing, { backgroundColor: slip ? colors.successBg : colors.primaryGlow }]}>
          <Ionicons name={slip ? "checkmark-circle" : "cloud-upload-outline"} size={28} color={slip ? colors.success : colors.primary} />
        </View>
        <Text style={[styles.uploadTitle, { color: slip ? colors.success : colors.textSecondary }]}>
          {slip ? "Receipt attached!" : "Tap to upload receipt"}
        </Text>
        <Text style={styles.uploadSub}>{slip ? "Tap to replace" : "JPG, PNG accepted"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.75 }]} onPress={upload} disabled={submitting} activeOpacity={0.88}>
        <LinearGradient colors={["#6C63FF", "#9B8FFF"]} style={styles.submitBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name={submitting ? "hourglass-outline" : "send"} size={18} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.submitBtnText}>{submitting ? "Uploading…" : "Submit Payment"}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

export default function PaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [totalDue, setTotalDue] = useState(0);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchPayments();
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await API.get("/payments/my");
      setPayments(res.data);
      const due = res.data
        .filter(p => p.status === "pending" || p.status === "rejected")
        .reduce((s, p) => s + (p.amount || 0), 0);
      setTotalDue(due);
    } catch (err) {
      console.log("Fetch payments error:", err);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled) setSlip(result.assets[0]);
  };

  const uploadReceipt = async () => {
    if (!amount || !category || !slip) {
      Alert.alert("Required Fields", "Please enter the amount, select a type, and attach your receipt.");
      return;
    }
    let dbCategory = "other";
    if (category === "Monthly Rent") dbCategory = "monthly";
    if (category === "Key Money")    dbCategory = "key_money";

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("category", dbCategory);
      if (category === "Other") formData.append("description", "other payment");
      formData.append("paymentType", "bank_transfer");
      formData.append("slipImage", {
        uri: Platform.OS === "ios" ? slip.uri.replace("file://", "") : slip.uri,
        name: "slip.jpg",
        type: slip.mimeType || "image/jpeg",
      });
      await API.post("/payments", formData, { headers: { "Content-Type": "multipart/form-data" } });
      Alert.alert("Payment Submitted ✓", "Your receipt is pending warden approval.");
      setAmount(""); setCategory("Monthly Rent"); setSlip(null); setDropOpen(false);
      fetchPayments();
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.join("\n") || err.response?.data?.message || err.message;
      Alert.alert("Upload Error", errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[T.screen, { flex: 1 }]}>
      <StatusBar barStyle="light-content" />
      {/* ScrollView avoids FlatList touch-event conflicts with TextInput */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Page Header ── */}
        <Animated.View style={[styles.pageHeader, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
        }]}>
          <Text style={styles.pageTitle}>Payments</Text>
          <Text style={styles.pageSubtitle}>Track and submit your hostel payments</Text>
        </Animated.View>

        {/* ── Balance Hero Card ── */}
        <Animated.View style={[styles.balanceWrap, { opacity: headerAnim }]}>
          <LinearGradient colors={["#6C63FF", "#9B8FFF"]} style={styles.balanceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.bcCircle1} />
            <View style={styles.bcCircle2} />
            <View style={styles.bcContent}>
              <Text style={styles.bcLabel}>OUTSTANDING BALANCE</Text>
              <Text style={styles.bcAmount}>LKR {totalDue > 0 ? totalDue.toLocaleString() : "0"}</Text>
              <View style={styles.bcStatus}>
                <View style={[styles.bcDot, { backgroundColor: totalDue > 0 ? "#FFC75F" : "#10d9a0" }]} />
                <Text style={styles.bcStatusText}>
                  {totalDue > 0 ? `${payments.filter(p => p.status === "pending").length} pending review` : "All payments cleared"}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Submit Payment ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="cloud-upload-outline" size={15} color={colors.primary} />
          <Text style={styles.sectionTitle}>Submit Payment</Text>
        </View>
        {/* PaymentForm owns its own state – typing never re-renders this parent */}
        <PaymentForm onSubmitted={fetchPayments} />

        {/* ── History ── */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Ionicons name="time-outline" size={15} color={colors.primary} />
          <Text style={styles.sectionTitle}>Payment History</Text>
          {payments.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{payments.length}</Text>
            </View>
          )}
        </View>

        {!loading && payments.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="wallet-outline" size={40} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No payments yet</Text>
            <Text style={styles.emptyText}>Your submitted payments will appear here.</Text>
          </View>
        )}

        {payments.map((item, index) => (
          <View key={item._id} style={{ paddingHorizontal: 20 }}>
            <AnimatedPaymentItem item={item} index={index} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pageHeader: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 18 },
  pageTitle: { fontSize: 30, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.6 },
  pageSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 3 },

  // Balance card
  balanceWrap: { paddingHorizontal: 20, marginBottom: 22 },
  balanceCard: { borderRadius: 24, padding: 24, overflow: "hidden", position: "relative" },
  bcCircle1: {
    position: "absolute", width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.08)", top: -60, right: -50,
  },
  bcCircle2: {
    position: "absolute", width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: 10,
  },
  bcContent: { position: "relative", zIndex: 1 },
  bcLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 1.5, marginBottom: 6 },
  bcAmount: { fontSize: 34, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  bcStatus: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12 },
  bcDot: { width: 7, height: 7, borderRadius: 3.5 },
  bcStatusText: { fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "500" },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.textPrimary, letterSpacing: 0.2 },
  countBadge: { backgroundColor: colors.primaryGlow, paddingHorizontal: 9, paddingVertical: 2, borderRadius: 10 },
  countBadgeText: { fontSize: 11, color: colors.primary, fontWeight: "700" },

  // Form card
  formCard: {
    marginHorizontal: 20, marginBottom: 22,
    backgroundColor: colors.card, borderRadius: 22,
    borderWidth: 1, borderColor: colors.cardBorder, padding: 20,
  },
  infoBanner: {
    flexDirection: "row", gap: 9, alignItems: "flex-start",
    backgroundColor: colors.infoBg, borderRadius: 12, padding: 12,
    marginBottom: 20, borderWidth: 1, borderColor: "rgba(91,200,255,0.18)",
  },
  infoText: { flex: 1, fontSize: 13, color: colors.info, lineHeight: 19 },

  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.input, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.inputBorder,
    paddingHorizontal: 14, marginBottom: 18,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.textPrimary },

  dropWrap: { marginBottom: 18, zIndex: 10 },
  dropHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.input, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.inputBorder, padding: 14,
  },
  dropHeaderLeft: { flexDirection: "row", alignItems: "center" },
  dropHeaderText: { fontSize: 15, color: colors.textPrimary },
  dropList: {
    position: "absolute", top: 54, left: 0, right: 0,
    backgroundColor: colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cardBorder,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, zIndex: 999,
  },
  dropOption: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 15, borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  dropOptionText: { fontSize: 15, color: colors.textSecondary },
  dropOptionActive: { color: colors.primary, fontWeight: "700" },

  uploadArea: {
    borderWidth: 1.5, borderColor: colors.cardBorder, borderStyle: "dashed",
    borderRadius: 18, padding: 28, alignItems: "center", marginBottom: 20,
    backgroundColor: "rgba(108,99,255,0.04)",
  },
  uploadAreaDone: { borderColor: colors.success + "55", backgroundColor: "rgba(16,217,160,0.05)" },
  uploadIconRing: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  uploadTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  uploadSub: { fontSize: 12, color: colors.textMuted },

  submitBtn: { borderRadius: 16, overflow: "hidden" },
  submitBtnGrad: {
    paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "center",
  },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // Payment item
  payItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.card, borderRadius: 16, padding: 15,
    borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 10,
  },
  payIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  payInfo: { flex: 1 },
  payCat: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 3 },
  payDate: { fontSize: 12, color: colors.textMuted },
  payRight: { alignItems: "flex-end", gap: 5 },
  payAmt: { fontSize: 15, fontWeight: "800" },
  badgeSmall: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 8 },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(108,99,255,0.08)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: "center" },
});

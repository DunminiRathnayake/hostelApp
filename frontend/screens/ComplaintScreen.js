import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, SafeAreaView, ActivityIndicator, Animated, StatusBar,
} from "react-native";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, T, getStatusBadge } from "../theme";

const CATEGORIES = [
  { label: "Room Damage / Issues",     icon: "bed-outline",           color: colors.error   },
  { label: "Hostel Facility Problems", icon: "business-outline",      color: colors.warning },
  { label: "Service Complaints",       icon: "person-remove-outline", color: colors.primary },
  { label: "Cleaning Issues",          icon: "sparkles-outline",      color: colors.success },
];

// ─── Complaint history card ────────────────────────────────────────────────────
function AnimatedComplaintCard({ item, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 100, friction: 7, useNativeDriver: true }).start();
  }, []);

  const { badge, text } = getStatusBadge(item.status);
  const cat = CATEGORIES.find(c => c.label === item.title) || CATEGORIES[0];

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    }}>
      <View style={styles.complaintCard}>
        <View style={[styles.cardAccent, { backgroundColor: cat.color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.catIconWrap, { backgroundColor: cat.color + "18" }]}>
              <Ionicons name={cat.icon} size={16} color={cat.color} />
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[badge, styles.badgeCompact]}>
              <Text style={[text, { fontSize: 10 }]}>
                {(item.status || "PENDING").replace("_", " ").toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.cardFooter}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Form: defined OUTSIDE parent, owns all its local state ───────────────────
// This prevents typing from causing ComplaintScreen to re-render, which would
// previously cause FlatList to remount ListHeaderComponent and dismiss keyboard.
function ComplaintForm({ onSubmitted, formAnim }) {
  const [selCat,      setSelCat]      = useState(CATEGORIES[0]);
  const [dropOpen,    setDropOpen]    = useState(false);
  const [description, setDescription] = useState("");
  const [descFocused, setDescFocused] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  const submit = async () => {
    if (!description.trim()) {
      Alert.alert("Required Fields", "Please select a category and describe your issue.");
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/complaints", { title: selCat.label, description });
      Alert.alert("Issue Reported \u2713", "Your complaint has been submitted to the warden.");
      setDescription("");
      setSelCat(CATEGORIES[0]);
      onSubmitted();
    } catch (err) {
      Alert.alert("Submission Error", err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Animated.View style={[styles.formWrap, {
      opacity: formAnim,
      transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    }]}>
      <View style={[styles.formCard, T.cardShadow]}>

        {/* Category Picker */}
        <Text style={T.label}>ISSUE CATEGORY</Text>
        <View style={{ zIndex: 10 }}>
          <TouchableOpacity
            style={styles.dropHeader}
            onPress={() => setDropOpen(o => !o)}
            activeOpacity={0.8}
          >
            <View style={[styles.catDot, { backgroundColor: selCat.color }]} />
            <View style={[styles.catIcon, { backgroundColor: selCat.color + "18" }]}>
              <Ionicons name={selCat.icon} size={15} color={selCat.color} />
            </View>
            <Text style={styles.dropHeaderText}>{selCat.label}</Text>
            <Ionicons name={dropOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {dropOpen && (
            <View style={styles.dropList}>
              {CATEGORIES.map((cat, i) => (
                <TouchableOpacity
                  key={cat.label}
                  style={[styles.dropOption, i === CATEGORIES.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => { setSelCat(cat); setDropOpen(false); }}
                >
                  <View style={[styles.catIcon, { backgroundColor: cat.color + "18", marginRight: 10 }]}>
                    <Ionicons name={cat.icon} size={14} color={cat.color} />
                  </View>
                  <Text style={[styles.dropOptionText, selCat.label === cat.label && { color: cat.color, fontWeight: "700" }]}>
                    {cat.label}
                  </Text>
                  {selCat.label === cat.label && <Ionicons name="checkmark-circle" size={17} color={cat.color} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={[T.label, { marginTop: 18 }]}>DESCRIPTION</Text>
        <View style={[styles.descWrap, descFocused && styles.descWrapFocused]}>
          <TextInput
            style={styles.descInput}
            placeholder="Describe the issue in detail — location, severity, how long it's been happening…"
            placeholderTextColor={colors.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
            textAlignVertical="top"
          />
          <View style={styles.descFooter}>
            <Text style={styles.charCount}>{description.length} chars</Text>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.75 }]}
          onPress={submit}
          disabled={submitting}
          activeOpacity={0.88}
        >
          <LinearGradient colors={["#FF5F5F", "#FF8080"]} style={styles.submitGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : (<>
                  <Ionicons name="send" size={17} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.submitText}>Submit Report</Text>
                </>)
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ComplaintScreen() {
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchComplaints();
    Animated.stagger(120, [
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(formAnim,   { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await API.get("/complaints/my-complaints");
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[T.screen, { flex: 1 }]}>
      <StatusBar barStyle="light-content" />

      {/* ScrollView replaces FlatList — no touch-event conflict with TextInput */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Page Header ── */}
        <Animated.View style={[styles.pageHeader, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
        }]}>
          <View style={styles.pageTitleRow}>
            <View style={styles.pageTitleIcon}>
              <Ionicons name="megaphone-outline" size={20} color={colors.error} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Report an Issue</Text>
              <Text style={styles.pageSubtitle}>Let us know so we can fix it fast.</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Form ── */}
        <ComplaintForm onSubmitted={fetchComplaints} formAnim={formAnim} />

        {/* ── History ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Previous Reports</Text>
          {complaints.length > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{complaints.length}</Text>
            </View>
          )}
        </View>

        {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />}

        {!loading && complaints.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubbles-outline" size={38} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No reports yet</Text>
            <Text style={styles.emptyText}>Issues you report will appear here.</Text>
          </View>
        )}

        {complaints.map((item, index) => (
          <View key={item._id} style={{ paddingHorizontal: 20 }}>
            <AnimatedComplaintCard item={item} index={index} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 50 },

  pageHeader: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
  pageTitleRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  pageTitleIcon: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: colors.errorBg,
    borderWidth: 1, borderColor: "rgba(255,90,90,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  pageTitle:    { fontSize: 26, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  formWrap: { paddingHorizontal: 20, marginBottom: 24 },
  formCard: {
    backgroundColor: colors.card, borderRadius: 22,
    borderWidth: 1, borderColor: colors.cardBorder, padding: 20,
  },

  dropHeader: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.input, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.inputBorder, padding: 14, gap: 10,
  },
  catDot:        { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  catIcon:       { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  dropHeaderText:{ flex: 1, fontSize: 15, color: colors.textPrimary },
  dropList: {
    position: "absolute", top: 56, left: 0, right: 0,
    backgroundColor: colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cardBorder,
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 10, zIndex: 999,
  },
  dropOption: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  dropOptionText: { flex: 1, fontSize: 14, color: colors.textSecondary },

  descWrap: {
    backgroundColor: colors.input, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.inputBorder, marginBottom: 20,
  },
  descWrapFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 2,
  },
  descInput:  { padding: 14, minHeight: 110, fontSize: 15, color: colors.textPrimary, textAlignVertical: "top" },
  descFooter: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 14, paddingBottom: 10 },
  charCount:  { fontSize: 11, color: colors.textMuted },

  submitBtn:  { borderRadius: 16, overflow: "hidden" },
  submitGrad: { paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  sectionRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, marginBottom: 14, gap: 10,
  },
  sectionTitle:    { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
  countPill:       { backgroundColor: colors.primaryGlow, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  countPillText:   { fontSize: 12, color: colors.primary, fontWeight: "700" },

  complaintCard: {
    flexDirection: "row", backgroundColor: colors.card,
    borderRadius: 18, marginBottom: 12,
    borderWidth: 1, borderColor: colors.cardBorder, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  cardAccent:  { width: 4, flexShrink: 0 },
  cardBody:    { flex: 1, padding: 14 },
  cardTop:     { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  catIconWrap: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardTitle:   { flex: 1, fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  badgeCompact:{ paddingVertical: 3, paddingHorizontal: 9, borderRadius: 8 },
  cardDesc:    { fontSize: 13.5, color: colors.textSecondary, lineHeight: 20, marginBottom: 10 },
  cardFooter:  { flexDirection: "row", alignItems: "center", gap: 5 },
  cardDate:    { fontSize: 11.5, color: colors.textMuted, fontStyle: "italic" },

  emptyState:    { alignItems: "center", paddingVertical: 40 },
  emptyIconWrap: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: "rgba(108,99,255,0.08)",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 5 },
  emptyText:  { fontSize: 13, color: colors.textSecondary },
});

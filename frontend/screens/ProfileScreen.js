import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, SafeAreaView, ActivityIndicator, Animated, StatusBar,
} from "react-native";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, T } from "../theme";

const SECTIONS = [
  {
    title: "Personal Details",
    icon: "person-outline",
    color: colors.primary,
    fields: [
      { key: "fullName",     label: "FULL NAME",    icon: "person-outline",  placeholder: "John Doe",         capitalize: "words"   },
      { key: "campus",       label: "CAMPUS",       icon: "school-outline",  placeholder: "Main Campus"       },
      { key: "studentPhone", label: "PHONE NUMBER", icon: "call-outline",    placeholder: "07XXXXXXXX",       keyboard: "phone-pad"  },
    ],
  },
  {
    title: "Emergency Contact",
    icon: "shield-checkmark-outline",
    color: colors.error,
    fields: [
      { key: "emergencyContactName", label: "CONTACT NAME",  icon: "people-outline", placeholder: "Jane Doe",    capitalize: "words"  },
      { key: "emergencyPhone",       label: "CONTACT PHONE", icon: "call-outline",   placeholder: "07XXXXXXXX",  keyboard: "phone-pad" },
    ],
  },
];

function InfoRow({ label, value, icon, color }) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "Not provided"}</Text>
      </View>
    </View>
  );
}

// EditInput keeps its OWN local value state so that typing never propagates
// a re-render up to ProfileScreen. The parent callback is held in a ref so
// it never needs to be listed as a dependency and never causes re-renders.
function EditInput({ label, icon, initialValue, onChangeText, placeholder, keyboardType, autoCapitalize }) {
  const [localValue, setLocalValue] = useState(initialValue ?? "");
  const [focused, setFocused]       = useState(false);
  const cbRef = useRef(onChangeText);
  // Keep ref current without triggering re-render
  cbRef.current = onChangeText;

  const handleChange = useRef((text) => {
    setLocalValue(text);
    cbRef.current?.(text);
  }).current; // stable function reference, created once

  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      <View style={[styles.editInputWrap, focused && styles.editInputFocused]}>
        <Ionicons name={icon} size={16} color={focused ? colors.primary : colors.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.editInput}
          value={localValue}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType={keyboardType || "default"}
          autoCapitalize={autoCapitalize || "none"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const [profile,    setProfile]   = useState({});
  const [editData,   setEditData]  = useState({});
  const [isEditing,  setIsEditing] = useState(false);
  const [loading,    setLoading]   = useState(true);
  const [saving,     setSaving]    = useState(false);

  // Change password state
  const [showPwdSection, setShowPwdSection] = useState(false);
  const [currentPwd,  setCurrentPwd]  = useState("");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const avatarAnim  = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const editAnim    = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchProfile();
    Animated.sequence([
      Animated.spring(avatarAnim,  { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    Animated.spring(editAnim, { toValue: isEditing ? 1 : 0, friction: 6, useNativeDriver: true }).start();
  }, [isEditing]);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/users/profile");
      setProfile(res.data);
    } catch (err) {
      Alert.alert("Error", "Could not load profile. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await API.put("/users/profile", editData);
      setProfile(prev => ({ ...prev, ...editData }));
      Alert.alert("Profile Updated ✓", "Your details have been saved.");
      setIsEditing(false);
    } catch (err) {
      Alert.alert("Update Failed", err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert("Required", "Please fill in all password fields.");
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert("Too Short", "New password must be at least 6 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }
    setChangingPwd(true);
    try {
      await API.put("/users/change-password", { currentPassword: currentPwd, newPassword: newPwd });
      Alert.alert("Password Changed ✓", "Your password has been updated.");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setShowPwdSection(false);
    } catch (err) {
      Alert.alert("Failed", err.response?.data?.message || err.message);
    } finally {
      setChangingPwd(false);
    }
  };

  const initials = (profile.fullName || profile.name || "U")
    .split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  if (loading) {
    return (
      <SafeAreaView style={[T.screen, styles.loadingScreen]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[T.screen, { flex: 1 }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar Hero ── */}
        <LinearGradient
          colors={["rgba(108,99,255,0.15)", "rgba(108,99,255,0.04)", "transparent"]}
          style={styles.heroBg}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
        <Animated.View style={[styles.avatarSection, {
          opacity: avatarAnim,
          transform: [{ scale: avatarAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
        }]}>
          <View style={styles.avatarWrap}>
            <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]} />
            <LinearGradient
              colors={["#8B85FF", "#6C63FF", "#5A52D5"]}
              style={styles.avatarCircle}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <TouchableOpacity style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{profile.fullName || profile.name || "Student"}</Text>
          {profile.email && <Text style={styles.profileEmail}>{profile.email}</Text>}
          <View style={styles.profileBadge}>
            <View style={styles.profileDot} />
            <Text style={styles.profileBadgeText}>Student · Active Resident</Text>
          </View>
        </Animated.View>

        {/* ── Content ── */}
        <Animated.View style={{ opacity: contentAnim }}>
          {SECTIONS.map(section => (
            <View key={section.title} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: section.color + "18" }]}>
                  <Ionicons name={section.icon} size={16} color={section.color} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>

              {isEditing ? (
                section.fields.map(f => (
                  <EditInput
                    key={f.key}
                    label={f.label}
                    icon={f.icon}
                    placeholder={f.placeholder}
                    initialValue={editData[f.key] || ""}
                    onChangeText={v => setEditData(prev => ({ ...prev, [f.key]: v }))}
                    keyboardType={f.keyboard}
                    autoCapitalize={f.capitalize}
                  />
                ))
              ) : (
                section.fields.map(f => (
                  <InfoRow
                    key={f.key}
                    label={f.label}
                    icon={f.icon}
                    value={profile[f.key]}
                    color={section.color}
                  />
                ))
              )}
            </View>
          ))}

          {/* ── Action Buttons ── */}
          <View style={styles.actionArea}>
            {!isEditing ? (
              <TouchableOpacity style={styles.editBtn} onPress={() => { setEditData({...profile}); setIsEditing(true); }} activeOpacity={0.88}>
                <LinearGradient
                  colors={["#6C63FF", "#9B8FFF"]}
                  style={styles.editBtnGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="pencil" size={18} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.editBtnText}>Edit Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setIsEditing(false); }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.75 }]}
                  onPress={handleUpdate}
                  disabled={saving}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={["#6C63FF", "#9B8FFF"]}
                    style={styles.saveBtnGrad}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="save-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {/* ── Change Password Card ── */}
          <TouchableOpacity
            style={styles.pwdToggleBtn}
            onPress={() => setShowPwdSection(o => !o)}
            activeOpacity={0.8}
          >
            <View style={styles.pwdToggleLeft}>
              <View style={[styles.sectionIcon, { backgroundColor: "rgba(245,158,11,0.12)", marginRight: 10 }]}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.warning} />
              </View>
              <Text style={styles.pwdToggleText}>Change Password</Text>
            </View>
            <Ionicons name={showPwdSection ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {showPwdSection && (
            <View style={styles.pwdCard}>
              {[
                { label: "CURRENT PASSWORD", value: currentPwd, setter: setCurrentPwd, show: showCurrent, toggle: setShowCurrent },
                { label: "NEW PASSWORD",     value: newPwd,     setter: setNewPwd,     show: showNew,     toggle: setShowNew     },
                { label: "CONFIRM NEW PASSWORD", value: confirmPwd, setter: setConfirmPwd, show: showConfirm, toggle: setShowConfirm },
              ].map(({ label, value, setter, show, toggle }) => (
                <View key={label} style={styles.editField}>
                  <Text style={styles.editLabel}>{label}</Text>
                  <View style={styles.editInputWrap}>
                    <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.editInput, { flex: 1 }]}
                      value={value}
                      onChangeText={setter}
                      secureTextEntry={!show}
                      placeholder="••••••••"
                      placeholderTextColor={colors.placeholder}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => toggle(s => !s)} style={{ padding: 4 }}>
                      <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.savePwdBtn, changingPwd && { opacity: 0.75 }]}
                onPress={handleChangePassword}
                disabled={changingPwd}
                activeOpacity={0.88}
              >
                <LinearGradient colors={["#f59e0b", "#d97706"]} style={styles.savePwdGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {changingPwd
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <Ionicons name="key-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.savePwdText}>Update Password</Text>
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 20 },

  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.textSecondary, marginTop: 14, fontSize: 14 },

  // Hero / avatar
  heroBg: { position: "absolute", top: 0, left: 0, right: 0, height: 260 },
  avatarSection: { alignItems: "center", paddingTop: 40, paddingBottom: 28 },
  avatarWrap: { position: "relative", marginBottom: 16 },
  avatarRing: {
    position: "absolute", inset: -10, borderRadius: 60,
    borderWidth: 1.5, borderColor: "rgba(108,99,255,0.4)",
  },
  avatarCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "rgba(108,99,255,0.3)",
    shadowColor: "#6C63FF", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  avatarText: { fontSize: 36, fontWeight: "900", color: "#fff" },
  cameraBtn: {
    position: "absolute", bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primary, borderWidth: 2.5, borderColor: colors.bg,
    alignItems: "center", justifyContent: "center",
  },
  profileName: { fontSize: 24, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: colors.textSecondary, marginBottom: 10 },
  profileBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.primaryGlow2, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 14, borderWidth: 1, borderColor: "rgba(108,99,255,0.18)",
  },
  profileDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  profileBadgeText: { fontSize: 12, color: colors.primary, fontWeight: "600" },

  // Sections
  sectionCard: {
    marginHorizontal: 20, marginBottom: 14,
    backgroundColor: colors.card, borderRadius: 22,
    borderWidth: 1, borderColor: colors.cardBorder, padding: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  sectionIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: colors.textPrimary, letterSpacing: 0.1 },

  // Info row (view mode)
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  infoIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  infoLabel: { fontSize: 10, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, marginBottom: 3 },
  infoValue: { fontSize: 15, color: colors.textPrimary, fontWeight: "500" },

  // Edit input
  editField: { marginBottom: 14 },
  editLabel: { fontSize: 10, fontWeight: "700", color: colors.textMuted, letterSpacing: 1, marginBottom: 8 },
  editInputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.input, borderRadius: 13,
    borderWidth: 1.5, borderColor: colors.inputBorder, paddingHorizontal: 14,
  },
  editInputFocused: { borderColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 2 },
  editInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: colors.textPrimary },

  // Action buttons
  actionArea: { paddingHorizontal: 20, marginTop: 4 },
  editBtn: { borderRadius: 16, overflow: "hidden" },
  editBtnGrad: { paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  editBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  editActions: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 16, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: colors.cardBorder, borderRadius: 16,
  },
  cancelBtnText: { color: colors.textSecondary, fontWeight: "700", fontSize: 15 },
  saveBtn: { flex: 2, borderRadius: 16, overflow: "hidden" },
  saveBtnGrad: { paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // Change password section
  pwdToggleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 20, marginTop: 8, marginBottom: 2,
    backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: 16,
  },
  pwdToggleLeft: { flexDirection: "row", alignItems: "center" },
  pwdToggleText: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  pwdCard: {
    marginHorizontal: 20, marginBottom: 14,
    backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(245,158,11,0.25)",
    padding: 18,
  },
  savePwdBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  savePwdGrad: { paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  savePwdText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});

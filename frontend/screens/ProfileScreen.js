import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from "react-native";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T } from "../theme";

export default function ProfileScreen() {
  const [profile, setProfile] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/users/profile");
      setProfile(res.data);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await API.put("/users/profile", profile);
      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderField = (label, value) => (
    <View style={styles.displayField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || "Not provided"}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[T.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={T.title}>My Profile</Text>
          <Ionicons name="person-circle-outline" size={60} color={colors.primary} />
          <Text style={T.subtitle}>Manage your details</Text>
        </View>
        
        <View style={[T.card, T.cardShadow]}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          
          {isEditing ? (
            <>
              <Text style={T.label}>FULL NAME</Text>
              <TextInput style={T.input} value={profile.fullName || profile.name} onChangeText={t => setProfile({...profile, fullName: t})} placeholder="John Doe" placeholderTextColor={colors.placeholder} />
              
              <Text style={T.label}>CAMPUS</Text>
              <TextInput style={T.input} value={profile.campus} onChangeText={t => setProfile({...profile, campus: t})} placeholder="Main Campus" placeholderTextColor={colors.placeholder} />
              
              <Text style={T.label}>STUDENT PHONE</Text>
              <TextInput style={T.input} value={profile.studentPhone} onChangeText={t => setProfile({...profile, studentPhone: t})} placeholder="07xxxxxxx" keyboardType="phone-pad" placeholderTextColor={colors.placeholder} />
            </>
          ) : (
            <>
              {renderField("Full Name", profile.fullName || profile.name)}
              {renderField("Campus", profile.campus)}
              {renderField("Phone Number", profile.studentPhone)}
            </>
          )}

          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          {isEditing ? (
            <>
              <Text style={T.label}>CONTACT NAME</Text>
              <TextInput style={T.input} value={profile.emergencyContactName} onChangeText={t => setProfile({...profile, emergencyContactName: t})} placeholder="Jane Doe" placeholderTextColor={colors.placeholder} />
              
              <Text style={T.label}>CONTACT PHONE</Text>
              <TextInput style={T.input} value={profile.emergencyPhone} onChangeText={t => setProfile({...profile, emergencyPhone: t})} placeholder="07xxxxxxx" keyboardType="phone-pad" placeholderTextColor={colors.placeholder} />
            </>
          ) : (
            <>
              {renderField("Contact Name", profile.emergencyContactName)}
              {renderField("Contact Phone", profile.emergencyPhone)}
            </>
          )}
        </View>

        {!isEditing ? (
          <TouchableOpacity style={T.primaryBtn} onPress={() => setIsEditing(true)}>
            <Ionicons name="pencil" size={20} color="#fff" style={styles.btnIcon} />
            <Text style={T.primaryBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[T.outlineBtn, {flex: 1, marginRight: 10}]} onPress={() => { setIsEditing(false); fetchProfile(); }}>
              <Text style={T.outlineBtnText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[T.primaryBtn, {flex: 2}, saving && {opacity: 0.7}]} onPress={handleUpdate} disabled={saving}>
              <Ionicons name="save-outline" size={20} color="#fff" style={styles.btnIcon} />
              <Text style={T.primaryBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20, flexGrow: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: { color: colors.textSecondary, fontSize: 16, marginTop: 10 },
  header: { alignItems: "center", marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary, marginBottom: 15 },
  divider: { height: 1, backgroundColor: colors.cardBorder, marginVertical: 20 },
  displayField: { marginBottom: 15 },
  fieldLabel: { fontSize: 12, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, fontWeight: "bold" },
  fieldValue: { fontSize: 16, color: colors.textPrimary, fontWeight: "500" },
  actionRow: { flexDirection: "row", justifyContent: "space-between" },
  btnIcon: { marginRight: 8 }
});

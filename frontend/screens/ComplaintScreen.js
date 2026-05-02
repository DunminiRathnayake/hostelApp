import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from "react-native";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T, getStatusBadge } from "../theme";

export default function ComplaintScreen() {
  const [complaints, setComplaints] = useState([]);
  const [title, setTitle] = useState("Room Damage / Issues");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const CATEGORIES = [
    "Room Damage / Issues",
    "Hostel Facility Problems",
    "Service Complaints",
    "Cleaning Issues"
  ];
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await API.get("/complaints/my-complaints");
      // The backend wraps the response data inside a `complaints` object
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const submitComplaint = async () => {
    if (!title || !description) return Alert.alert("Required Fields", "Please provide a title and securely describe your issue.");
    
    setIsSubmitting(true);
    try {
      await API.post("/complaints", { title, description });
      Alert.alert("Issue Reported", "Your complaint has been submitted successfully to the warden.");
      setTitle(""); 
      setDescription("");
      fetchComplaints();
    } catch (err) {
      Alert.alert("Submission Error", err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <FlatList
        style={styles.container}
        data={complaints}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            <View style={styles.headerBlock}>
              <Text style={T.title}>Report an Issue</Text>
              <Text style={T.subtitle}>Let us know what's wrong so we can fix it.</Text>
            </View>

            <View style={[T.card, T.cardShadow]}>
              <Text style={[T.label, { zIndex: -1 }]}>ISSUE CATEGORY</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownHeader}
                  onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownHeaderText}>{title}</Text>
                  <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                {isDropdownOpen && (
                  <View style={styles.dropdownList}>
                    {CATEGORIES.map((cat, index) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.dropdownOption, index === CATEGORIES.length - 1 && { borderBottomWidth: 0 }]}
                        onPress={() => { setTitle(cat); setIsDropdownOpen(false); }}
                      >
                        <Text style={[styles.dropdownOptionText, title === cat && styles.dropdownOptionTextActive]}>{cat}</Text>
                        {title === cat && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <Text style={T.label}>DESCRIPTION</Text>
              <TextInput 
                style={[T.input, styles.textArea]} 
                placeholder="Describe your issue in detail here..." 
                placeholderTextColor={colors.placeholder}
                value={description} 
                onChangeText={setDescription} 
                multiline 
              />

              <TouchableOpacity 
                style={[T.primaryBtn, isSubmitting && styles.submitBtnDisabled]} 
                onPress={submitComplaint}
                disabled={isSubmitting}
              >
                <Ionicons name="send" size={18} color="#fff" style={{marginRight: 8}} />
                <Text style={T.primaryBtnText}>{isSubmitting ? "Submitting..." : "Submit"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Previous Reports</Text>
            </View>
            
            {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />}
            {!loading && complaints.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>You haven't reported any issues yet.</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => {
          const { badge, text } = getStatusBadge(item.status);
          return (
            <View style={[T.card, T.cardShadow, { borderLeftColor: colors.primary, borderLeftWidth: 4 }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={[badge]}>
                  <Text style={[text]}>
                    {(item.status || "PENDING").replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  
  headerBlock: { marginTop: 20, marginBottom: 10 },
  
  textArea: { height: 100, textAlignVertical: "top", zIndex: -1 },
  submitBtnDisabled: { opacity: 0.7 },

  dropdownContainer: { marginBottom: 20, zIndex: 10 },
  dropdownHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.input, padding: 14, borderRadius: 10 },
  dropdownHeaderText: { fontSize: 16, color: colors.textPrimary },
  dropdownList: { position: "absolute", top: 55, left: 0, right: 0, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, elevation: 10, zIndex: 999 },
  dropdownOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  dropdownOptionText: { fontSize: 16, color: colors.textPrimary },
  dropdownOptionTextActive: { color: colors.primary, fontWeight: "bold" },
  
  historyHeader: { marginBottom: 15 },
  historyTitle: { fontSize: 22, fontWeight: "bold", color: colors.textPrimary },
  
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyText: { color: colors.textSecondary, marginTop: 10, fontSize: 15 },
  
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  cardTitle: { fontSize: 17, fontWeight: "bold", color: colors.textPrimary, flex: 1, marginRight: 10 },
  cardDesc: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 10 },
  date: { color: colors.textMuted, fontSize: 12, fontStyle: "italic" }
});

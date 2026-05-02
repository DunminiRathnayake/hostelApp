import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Platform, SafeAreaView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T, getStatusBadge } from "../theme";

export default function PaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Monthly Rent");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [slip, setSlip] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentTypes = ["Monthly Rent", "Key Money", "Other"];

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await API.get("/payments/my");
      setPayments(res.data);
    } catch (err) {
      console.log("Fetch payments error:", err);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.7,
    });
    if (!result.canceled) setSlip(result.assets[0]);
  };

  const uploadReceipt = async () => {
    if (!amount || !category || !slip) {
      return Alert.alert("Required Fields", "Please make sure to enter the amount, select a payment type, and attach your receipt.");
    }
    
    // Map visual UI categories strictly to Mongoose enum DB formats
    let dbCategory = "other";
    if (category === "Monthly Rent") dbCategory = "monthly";
    if (category === "Key Money") dbCategory = "key_money";

    let dbDescription = "";
    if (category === "Other") dbDescription = "other payment";

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("category", dbCategory);
      if (dbDescription) formData.append("description", dbDescription);
      formData.append("paymentType", "bank"); 
      
      formData.append("slipImage", {
        uri: Platform.OS === 'ios' ? slip.uri.replace('file://', '') : slip.uri, 
        name: "slip.jpg", 
        type: slip.mimeType || "image/jpeg"
      });
      
      await API.post("/payments", formData, { headers: { "Content-Type": "multipart/form-data" } });
      Alert.alert("Payment Submitted", "Your receipt has been uploaded and is pending warden approval.");
      
      setAmount("");
      setCategory("Monthly Rent");
      setIsDropdownOpen(false);
      setSlip(null);
      fetchPayments();
    } catch (err) {
      console.error(err.response?.data);
      Alert.alert("Upload Error", err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <FlatList
        style={styles.container}
        data={payments}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            <Text style={T.title}>Payments</Text>
            
            <View style={T.card}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                 <Ionicons name="information-circle" size={24} color={colors.primary} style={{marginRight: 10}}/>
                 <Text style={[T.subtitle, {marginBottom: 0, flex: 1, color: colors.textSecondary}]}>
                   Upload clear photos of your bank deposit slips. Warden will review and approve your submission.
                 </Text>
              </View>
            </View>

            <View style={[T.card, T.cardShadow]}>
              <Text style={[T.title, {fontSize: 20, marginTop: 0, marginBottom: 20}]}>Submit Payment</Text>
              
              <Text style={T.label}>AMOUNT (LKR)</Text>
              <TextInput 
                style={T.input} 
                placeholder="e.g. 15000" 
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric" 
                value={amount} 
                onChangeText={setAmount} 
              />

              <Text style={T.label}>PAYMENT TYPE</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={[T.input, styles.dropdownHeader]} 
                  activeOpacity={0.8}
                  onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Text style={styles.dropdownHeaderText}>{category}</Text>
                  <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                {isDropdownOpen && (
                  <View style={styles.dropdownList}>
                    {paymentTypes.map((type, index) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.dropdownOption, index === paymentTypes.length - 1 && { borderBottomWidth: 0 }]}
                        onPress={() => {
                          setCategory(type);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <Text style={[styles.dropdownOptionText, category === type && styles.dropdownOptionTextActive]}>
                          {type}
                        </Text>
                        {category === type && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <Text style={T.label}>RECEIPT IMAGE</Text>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                <Ionicons name={slip ? "checkmark-circle" : "cloud-upload-outline"} size={32} color={slip ? colors.success : colors.textSecondary} />
                <Text style={styles.uploadBtnText}>
                  {slip ? "Receipt attached! Tap to change" : "Tap to upload receipt"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[T.primaryBtn, isSubmitting && styles.submitBtnDisabled]} 
                onPress={uploadReceipt} 
                disabled={isSubmitting}
              >
                <Text style={T.primaryBtnText}>{isSubmitting ? "Uploading..." : "Submit Payment"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.historyTitle}>History</Text>
            {payments.length === 0 && !loading && (
              <Text style={styles.emptyText}>No payments submitted yet.</Text>
            )}
          </>
        }
        renderItem={({ item }) => {
          const { badge, text } = getStatusBadge(item.status);
          
          let displayCategory = "Other";
          if (item.category === "monthly") displayCategory = "Monthly Rent";
          if (item.category === "key_money") displayCategory = "Key Money";
          if (item.category === "other" && item.description) {
            displayCategory = item.description === "fines" ? "Fines" : item.description;
          }

          return (
            <View style={[T.card, T.cardShadow]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTypeGroup}>
                  <Text style={styles.cardCategory} numberOfLines={1}>{displayCategory}</Text>
                  <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={[badge]}>
                  <Text style={[text]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardAmount}>LKR {item.amount.toLocaleString()}</Text>
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
  
  dropdownContainer: { marginBottom: 20, zIndex: 10 },
  dropdownHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 0 },
  dropdownHeaderText: { fontSize: 16, color: colors.textPrimary },
  dropdownList: { position: "absolute", top: 55, left: 0, right: 0, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5, zIndex: 999 },
  dropdownOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  dropdownOptionText: { fontSize: 16, color: colors.textSecondary },
  dropdownOptionTextActive: { color: colors.primary, fontWeight: "bold" },

  uploadBtn: { borderWidth: 1, borderColor: colors.cardBorder, borderStyle: "dashed", padding: 30, borderRadius: 16, alignItems: "center", marginBottom: 25, backgroundColor: colors.surface },
  uploadBtnText: { color: colors.textSecondary, fontWeight: "500", fontSize: 14, marginTop: 10 },
  
  submitBtnDisabled: { opacity: 0.7 },
  
  historyTitle: { fontSize: 22, fontWeight: "bold", color: colors.textPrimary, marginBottom: 15 },
  emptyText: { color: colors.textMuted, fontStyle: "italic" },
  
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  cardTypeGroup: { flex: 1 },
  cardCategory: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  date: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  cardAmount: { fontSize: 22, fontWeight: "bold", color: colors.textPrimary, marginTop: 5 }
});

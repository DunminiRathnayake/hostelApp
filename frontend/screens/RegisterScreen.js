import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import API from "../services/api";
import { useRouter } from "expo-router";
import { colors, T } from "../theme";

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", campus: "", studentPhone: "",
    emergencyContactName: "", emergencyPhone: "", role: "student"
  });
  const [nicFront, setNicFront] = useState(null);
  const [nicBack, setNicBack] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async (setImage) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const validateForm = () => {
    const { fullName, email, password, campus, studentPhone, emergencyContactName, emergencyPhone } = form;

    // Check for empty fields
    if (!fullName || !email || !password || !campus || !studentPhone || !emergencyContactName || !emergencyPhone) {
      Alert.alert("Validation Error", "Please fill out all mandatory text fields.");
      return false;
    }
    
    // Strict Email Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Validation Error", "Please enter a valid email address (e.g., student@example.com).");
      return false;
    }

    // Phone Validation: 10 digits starting with 0
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(studentPhone)) {
      Alert.alert("Validation Error", "Student phone number must be 10 digits starting with '0'.");
      return false;
    }
    if (!phoneRegex.test(emergencyPhone)) {
      Alert.alert("Validation Error", "Emergency contact phone must be 10 digits starting with '0'.");
      return false;
    }

    // NIC Validation: 
    // Old (9 digits + V) OR New (12 digits)
    const nicRegex = /^([0-9]{9}[vV]|[0-9]{12})$/;
    // Note: Since RegisterScreen doesn't have an NIC field in 'form', we check the uploaded images
    // The NIC text validation will be applied in CreateBookingScreen instead.

    if (!nicFront || !nicBack) {
      Alert.alert("Validation Error", "Please upload both front and back images of your NIC.");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));

      if (nicFront) {
        formData.append("nicFront", {
          uri: Platform.OS === 'ios' ? nicFront.uri.replace('file://', '') : nicFront.uri,
          name: "front.jpg", 
          type: nicFront.mimeType || "image/jpeg"
        });
      }
      if (nicBack) {
        formData.append("nicBack", {
          uri: Platform.OS === 'ios' ? nicBack.uri.replace('file://', '') : nicBack.uri,
          name: "back.jpg", 
          type: nicBack.mimeType || "image/jpeg"
        });
      }

      await API.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      Alert.alert("Success", "Account created successfully!");
      router.replace("/(auth)/login");
    } catch (err) {
      console.log(err);
      Alert.alert("Registration Error", err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[T.title, { textAlign: "center" }]}>Create Account</Text>
      <Text style={[T.subtitle, { textAlign: "center" }]}>Join the hostel management</Text>

      <View style={[T.card, T.cardShadow]}>
        <Text style={T.label}>PERSONAL DETAILS</Text>
        <TextInput style={T.input} placeholderTextColor={colors.placeholder} placeholder="Full Name" onChangeText={t => setForm({...form, fullName: t})} />
        <TextInput style={T.input} placeholderTextColor={colors.placeholder} placeholder="Email" keyboardType="email-address" onChangeText={t => setForm({...form, email: t})} autoCapitalize="none" />
        <TextInput style={T.input} placeholderTextColor={colors.placeholder} placeholder="Password" secureTextEntry onChangeText={t => setForm({...form, password: t})} />
        <TextInput style={T.input} placeholderTextColor={colors.placeholder} placeholder="Campus" onChangeText={t => setForm({...form, campus: t})} />
        <TextInput style={[T.input, { marginBottom: 5 }]} placeholderTextColor={colors.placeholder} placeholder="Student Phone" keyboardType="phone-pad" maxLength={10} onChangeText={t => setForm({...form, studentPhone: t})} />
        <Text style={styles.helperText}>Enter a valid 10-digit phone number</Text>
      </View>

      <View style={[T.card, T.cardShadow]}>
        <Text style={T.label}>EMERGENCY CONTACT</Text>
        <TextInput style={T.input} placeholderTextColor={colors.placeholder} placeholder="Emergency Contact Name" onChangeText={t => setForm({...form, emergencyContactName: t})} />
        <TextInput style={T.input} placeholderTextColor={colors.placeholder} placeholder="Emergency Phone" keyboardType="phone-pad" maxLength={10} onChangeText={t => setForm({...form, emergencyPhone: t})} />
      </View>

      <View style={[T.card, T.cardShadow]}>
        <Text style={T.label}>IDENTITY VERIFICATION</Text>
        
        <TouchableOpacity style={styles.imgBtn} onPress={() => pickImage(setNicFront)}>
          <Text style={styles.imgText}>{nicFront ? "Front Image Selected" : "Tap to upload NIC Front"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.imgBtn} onPress={() => pickImage(setNicBack)}>
          <Text style={styles.imgText}>{nicBack ? "Back Image Selected" : "Tap to upload NIC Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>Please make sure images are clear and readable.</Text>
      </View>

      <TouchableOpacity style={[T.primaryBtn, isSubmitting && styles.buttonDisabled]} onPress={handleRegister} disabled={isSubmitting}>
        <Text style={T.primaryBtnText}>{isSubmitting ? "Registering..." : "Register"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkContainer} onPress={() => router.replace("/(auth)/login")}>
        <Text style={styles.linkText}>Already have an account? Login here</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.bg, paddingBottom: 40, flexGrow: 1, paddingTop: 60 },
  helperText: { fontSize: 12, color: colors.textSecondary, marginBottom: 15, marginTop: -5 },
  imgBtn: { backgroundColor: colors.surface, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, alignItems: "center", marginBottom: 15 },
  imgText: { color: colors.primary, fontWeight: "bold" },
  buttonDisabled: { opacity: 0.7 },
  linkContainer: { marginTop: 20 },
  linkText: { color: colors.textSecondary, textAlign: "center", marginTop: 10, fontWeight: "600" }
});

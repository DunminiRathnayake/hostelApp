import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Animated, KeyboardAvoidingView, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import API from "../services/api";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, T, createFadeSlide, createPressAnim } from "../theme";

// Defined outside the parent component so React does not treat it as a new
// component type on every re-render, which would unmount/remount the TextInput
// and dismiss the keyboard after each character typed.
const InputField = ({ icon, placeholder, value, keyName, type = "default", secure = false, maxLength, focusedInput, setFocusedInput, showPassword, setShowPassword, onChangeText }) => (
  <View style={[styles.inputWrapper, focusedInput === keyName && styles.inputFocused]}>
    <Ionicons name={icon} size={20} color={focusedInput === keyName ? colors.primary : colors.textMuted} style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={colors.placeholder}
      value={value}
      onChangeText={onChangeText}
      onFocus={() => setFocusedInput(keyName)}
      onBlur={() => setFocusedInput(null)}
      keyboardType={type}
      secureTextEntry={secure && !showPassword}
      autoCapitalize={type === "email-address" ? "none" : "words"}
      maxLength={maxLength}
    />
    {secure && (
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
        <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textMuted} />
      </TouchableOpacity>
    )}
  </View>
);

export default function RegisterScreen() {
  const router = useRouter();
  
  // Form State
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", campus: "", studentPhone: "",
    emergencyContactName: "", emergencyPhone: "", role: "student"
  });
  const [nicFront, setNicFront] = useState(null);
  const [nicBack, setNicBack] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Animations
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (nextStep) => {
    const direction = nextStep > step ? -100 : 100;
    
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: direction, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(-direction);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true })
      ]).start();
    });
  };

  const pickImage = async (setImage) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const validateStep1 = () => {
    const { fullName, email, password, campus, studentPhone } = form;
    if (!fullName || !email || !password || !campus || !studentPhone) {
      Alert.alert("Missing Fields", "Please fill out all personal details.");
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return false;
    }
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(studentPhone)) {
      Alert.alert("Invalid Phone", "Phone number must be 10 digits starting with '0'.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const { emergencyContactName, emergencyPhone } = form;
    if (!emergencyContactName || !emergencyPhone) {
      Alert.alert("Missing Fields", "Please provide your emergency contact details.");
      return false;
    }
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(emergencyPhone)) {
      Alert.alert("Invalid Phone", "Emergency phone must be 10 digits starting with '0'.");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!nicFront || !nicBack) {
      Alert.alert("Missing Documents", "Please upload both front and back images of your NIC.");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step < 3) animateTransition(step + 1);
  };

  const prevStep = () => {
    if (step > 1) animateTransition(step - 1);
  };

  const handleRegister = async () => {
    if (!validateStep3()) return;

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

  // Helper to build shared props for every InputField
  const fieldProps = { focusedInput, setFocusedInput, showPassword, setShowPassword };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Step {step} of 3</Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((num) => (
            <React.Fragment key={num}>
              <View style={[styles.stepCircle, step >= num ? styles.stepActive : styles.stepInactive]}>
                {step > num ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Text style={[styles.stepText, step >= num && { color: "#fff" }]}>{num}</Text>
                )}
              </View>
              {num < 3 && (
                <View style={[styles.stepLine, step > num && styles.stepLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          {step === 1 && (
            <View style={styles.formCard}>
              <Text style={T.label}>PERSONAL DETAILS</Text>
              <InputField {...fieldProps} icon="person-outline" placeholder="Full Name" value={form.fullName} keyName="fullName" onChangeText={t => setForm(f => ({...f, fullName: t}))} />
              <InputField {...fieldProps} icon="mail-outline" placeholder="Email" value={form.email} keyName="email" type="email-address" onChangeText={t => setForm(f => ({...f, email: t}))} />
              <InputField {...fieldProps} icon="lock-closed-outline" placeholder="Password" value={form.password} keyName="password" secure={true} onChangeText={t => setForm(f => ({...f, password: t}))} />
              <InputField {...fieldProps} icon="business-outline" placeholder="Campus" value={form.campus} keyName="campus" onChangeText={t => setForm(f => ({...f, campus: t}))} />
              <InputField {...fieldProps} icon="call-outline" placeholder="Student Phone (0xxxxxxxxx)" value={form.studentPhone} keyName="studentPhone" type="phone-pad" maxLength={10} onChangeText={t => setForm(f => ({...f, studentPhone: t}))} />
            </View>
          )}

          {step === 2 && (
            <View style={styles.formCard}>
              <Text style={T.label}>EMERGENCY CONTACT</Text>
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={20} color={colors.info} />
                <Text style={styles.infoText}>This contact will only be used in case of emergencies.</Text>
              </View>
              <InputField {...fieldProps} icon="people-outline" placeholder="Emergency Contact Name" value={form.emergencyContactName} keyName="emergencyContactName" onChangeText={t => setForm(f => ({...f, emergencyContactName: t}))} />
              <InputField {...fieldProps} icon="call-outline" placeholder="Emergency Phone" value={form.emergencyPhone} keyName="emergencyPhone" type="phone-pad" maxLength={10} onChangeText={t => setForm(f => ({...f, emergencyPhone: t}))} />
            </View>
          )}

          {step === 3 && (
            <View style={styles.formCard}>
              <Text style={T.label}>IDENTITY VERIFICATION</Text>
              <View style={styles.infoBanner}>
                <Ionicons name="shield-checkmark" size={20} color={colors.info} />
                <Text style={styles.infoText}>Please upload clear images of your National Identity Card (NIC) for security purposes.</Text>
              </View>

              <TouchableOpacity 
                style={[styles.uploadBtn, nicFront && styles.uploadBtnSuccess]} 
                onPress={() => pickImage(setNicFront)}
              >
                <Ionicons name={nicFront ? "checkmark-circle" : "camera-outline"} size={28} color={nicFront ? colors.success : colors.primary} />
                <View style={styles.uploadTextContainer}>
                  <Text style={styles.uploadTitle}>{nicFront ? "Front Image Uploaded" : "Upload NIC Front"}</Text>
                  <Text style={styles.uploadSub}>{nicFront ? "Tap to change" : "Format: JPG, PNG"}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.uploadBtn, nicBack && styles.uploadBtnSuccess]} 
                onPress={() => pickImage(setNicBack)}
              >
                <Ionicons name={nicBack ? "checkmark-circle" : "camera-outline"} size={28} color={nicBack ? colors.success : colors.primary} />
                <View style={styles.uploadTextContainer}>
                  <Text style={styles.uploadTitle}>{nicBack ? "Back Image Uploaded" : "Upload NIC Back"}</Text>
                  <Text style={styles.uploadSub}>{nicBack ? "Tap to change" : "Format: JPG, PNG"}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          
          {step < 3 ? (
            <TouchableOpacity style={[styles.nextBtn, step === 1 && { flex: 1 }]} onPress={nextStep}>
              <Text style={styles.nextBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.nextBtn, isSubmitting && { opacity: 0.7 }]} 
              onPress={handleRegister} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.nextBtnText}>{isSubmitting ? "Registering..." : "Complete Registration"}</Text>
            </TouchableOpacity>
          )}
        </View>

        {step === 1 && (
          <TouchableOpacity style={styles.loginLink} onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Login here</Text></Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: 24, paddingTop: 60, paddingBottom: 40 },
  
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.primaryLight, fontWeight: '600' },
  
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 40, paddingHorizontal: 20 },
  stepCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  stepActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepInactive: { backgroundColor: colors.surface, borderColor: colors.cardBorder },
  stepText: { color: colors.textMuted, fontWeight: 'bold', fontSize: 14 },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.cardBorder, marginHorizontal: 8 },
  stepLineActive: { backgroundColor: colors.primary },
  
  formCard: { backgroundColor: colors.card, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 24 },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.input, borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 14, paddingHorizontal: 16, marginBottom: 16 },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.bgSecondary },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 15, fontSize: 15, color: colors.textPrimary },
  eyeIcon: { padding: 10 },
  
  infoBanner: { flexDirection: 'row', backgroundColor: colors.infoBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(91,200,255,0.3)", marginBottom: 20, alignItems: 'center' },
  infoText: { flex: 1, color: colors.info, fontSize: 13, marginLeft: 10, lineHeight: 18 },
  
  uploadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 16, borderStyle: 'dashed' },
  uploadBtnSuccess: { borderColor: colors.successBorder, backgroundColor: colors.successBg, borderStyle: 'solid' },
  uploadTextContainer: { marginLeft: 16 },
  uploadTitle: { color: colors.textPrimary, fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  uploadSub: { color: colors.textSecondary, fontSize: 12 },
  
  navButtons: { flexDirection: 'row', gap: 12, marginTop: 'auto' },
  backBtn: { flex: 1, flexDirection: 'row', backgroundColor: colors.surface, paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  backBtnText: { color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 },
  nextBtn: { flex: 2, flexDirection: 'row', backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  loginLink: { marginTop: 30, alignItems: 'center' },
  linkText: { color: colors.textSecondary, fontSize: 14 },
  linkTextBold: { color: colors.primaryLight, fontWeight: 'bold' }
});

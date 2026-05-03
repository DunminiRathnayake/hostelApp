import React, { useState, useContext, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from "react-native";
import API from "../services/api";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import { colors, T, createFadeSlide, createPressAnim } from "../theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  
  const router = useRouter();
  const { login } = useContext(AuthContext);

  // Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      createFadeSlide(cardFade, cardSlide, 100)
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      const { token, ...user } = res.data;
      await login(token, user);
      
      setTimeout(() => {
        router.replace("/(app)/(tabs)");
      }, 500);
    } catch (err) {
      if (err.response) {
        Alert.alert("Login Failed", err.response.data?.message || "Invalid credentials");
      } else if (err.request) {
        Alert.alert("Network Error", "Unable to reach the server. Please check your internet connection.");
      } else {
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePressIn = () => createPressAnim(btnScale, true).start();
  const handlePressOut = () => createPressAnim(btnScale, false).start();

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1920&q=80' }}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
          <LinearGradient
            colors={[colors.primaryLight, colors.primaryDark]}
            style={styles.logoCircle}
          >
            <Ionicons name="home" size={42} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.glassCard, {
          opacity: cardFade,
          transform: [{ translateY: cardSlide }]
        }]}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to continue your journey</Text>

          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputFocused]}>
              <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? colors.primary : colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputFocused]}>
              <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? colors.primary : colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.placeholder}
                value={password}
                secureTextEntry={!showPassword}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity 
              style={[T.primaryBtn, loading && { opacity: 0.7 }]} 
              onPress={handleLogin}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={loading}
              activeOpacity={1}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                  <Text style={T.primaryBtnText}>Signing in...</Text>
                </>
              ) : (
                <Text style={T.primaryBtnText}>Login</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.linkContainer} onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.registerText}>Don't have an account? <Text style={styles.registerTextBold}>Register</Text></Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 10, 15, 0.85)", // Stronger dark overlay
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: 'transparent',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  glassCard: {
    backgroundColor: "rgba(30, 30, 40, 0.6)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.bgSecondary,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    color: colors.textPrimary,
  },
  eyeIcon: {
    padding: 10,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  dividerText: {
    color: colors.textMuted,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  linkContainer: {
    alignItems: "center",
  },
  registerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  registerTextBold: {
    color: colors.primaryLight,
    fontWeight: "bold",
  }
});
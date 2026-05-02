import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  StatusBar
} from "react-native";
import API from "../services/api";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import { colors, T } from "../theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      const res = await API.post("/auth/login", {
        email,
        password,
      });

      // Backend returns a flat object: { _id, name, email, role, token }
      const { token, ...user } = res.data;

      await login(token, user);
      
      setTimeout(() => {
        router.replace("/(app)/(tabs)");
      }, 500);

    } catch (err) {
      if (err.response) {
        Alert.alert(
          "Login Failed", 
          err.response.data?.message || "Invalid credentials"
        );
      } else if (err.request) {
        Alert.alert(
          "Network Error", 
          "Unable to reach the server. Please check your internet connection."
        );
      } else {
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1920&q=80' }}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={[T.screen, styles.container]}>
        <View style={styles.glassCard}>
          <Text style={T.title}>Welcome Back</Text>
      <Text style={T.subtitle}>Login to continue</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={T.input}
          placeholder="Enter your email"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={T.input}
          placeholder="Enter your password"
          placeholderTextColor={colors.placeholder}
          value={password}
          secureTextEntry
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity style={T.primaryBtn} onPress={handleLogin}>
        <Text style={T.primaryBtnText}>Login</Text>
      </TouchableOpacity>

        <TouchableOpacity style={styles.linkContainer} onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.registerText}>Don't have an account? <Text style={styles.registerTextBold}>Register</Text></Text>
        </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  container: {
    justifyContent: "center",
    padding: 24,
    backgroundColor: 'transparent',
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
    marginTop: 20,
  },
  linkContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  registerText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  registerTextBold: {
    color: colors.primary,
    fontWeight: "bold",
  }
});
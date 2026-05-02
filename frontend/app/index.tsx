import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log("[Root] Checking AsyncStorage for existing session...");
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        console.log("[Root] Token found! Navigating to /(app)/(tabs)");
        router.replace("/(app)/(tabs)");
      } else {
        console.log("[Root] No stored session. Routing to /(auth)");
        router.replace("/(auth)");
      }
    } catch (error) {
      console.log("[Root] Error checking authentication:", error);
      router.replace("/(auth)");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D0D0D" }}>
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );
}

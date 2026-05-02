import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import StudentDashboard from "../../../screens/StudentDashboard";
import WardenDashboard from "../../../screens/WardenDashboard";
import VisitorDashboard from "../../../screens/VisitorDashboard";

export default function Home() {
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const userObj = JSON.parse(userStr);
          setUserRole(userObj.role);
          setUserData(userObj);
        } else {
          // If no user is found somehow, force clear and return to auth
          await AsyncStorage.removeItem("token");
          router.replace("/(auth)");
        }
      } catch (error) {
        console.error("Failed to load user role:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserRole();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (userRole === "student") {
    return <StudentDashboard user={userData} />;
  } else if (userRole === "warden") {
    return <WardenDashboard user={userData} />
  } else if (userRole === "visitor") {
    return <VisitorDashboard user={userData} />
  } else {
    // Fallback if role is unknown
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Unknown role: {userRole}. Please contact support.</Text>
      </View>
    );
  }
}
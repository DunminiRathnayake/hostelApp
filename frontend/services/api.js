import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

// Use the Railway production URL
const API = axios.create({
  baseURL: "https://hostelapp-production-3c24.up.railway.app/api",
  timeout: 30000, // 30s — accommodates Railway cold-starts
});

let logoutCallback = null;

export const registerLogoutCallback = (cb) => {
  logoutCallback = cb;
};

// Attach JWT token to every request
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Handle token expiry: clear storage so the root layout redirects to /(auth)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(["token", "user"]);
      if (logoutCallback) {
        logoutCallback();
      }
      router.replace("/(auth)");
    }
    return Promise.reject(error);
  }
);

export default API;
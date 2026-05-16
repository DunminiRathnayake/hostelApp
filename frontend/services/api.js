import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Use the Railway production URL
const API = axios.create({
  baseURL: "https://hostelapp-production-3c24.up.railway.app/api",
  timeout: 30000, // 30s — accommodates Railway cold-starts
});

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
    }
    return Promise.reject(error);
  }
);

export default API;
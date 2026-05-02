import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';

// Dynamically detect the debugger host's IP for local development
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const host = debuggerHost ? debuggerHost.split(':').shift() : '192.168.1.9';

const API = axios.create({
  baseURL: `http://${host}:5000/api`,
  timeout: 10000,
});

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default API;
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure base URL - change this to your backend URL
const BASE_URL = "http://localhost:3000/api";

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  refreshToken: () => api.post("/auth/refresh-token"),
};

// User API calls
export const userAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (userData) => api.put("/users/profile", userData),
  changePassword: (passwords) => api.post("/users/change-password", passwords),
  getAccounts: () => api.get("/users/accounts"),
};

// Transaction API calls
export const transactionAPI = {
  createTransaction: (transactionData) =>
    api.post("/transactions", transactionData),
  getTransactions: (params = {}) => api.get("/transactions", { params }),
  getTransactionById: (id) => api.get(`/transactions/${id}`),
  getAccountBalance: (accountId) =>
    api.get(`/transactions/balance/${accountId}`),
};

// Utility functions for local storage
export const storageUtils = {
  setToken: async (token) => {
    try {
      await AsyncStorage.setItem("userToken", token);
    } catch (error) {
      console.error("Error storing token:", error);
    }
  },

  getToken: async () => {
    try {
      return await AsyncStorage.getItem("userToken");
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  removeToken: async () => {
    try {
      await AsyncStorage.removeItem("userToken");
    } catch (error) {
      console.error("Error removing token:", error);
    }
  },

  setUserData: async (userData) => {
    try {
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
    } catch (error) {
      console.error("Error storing user data:", error);
    }
  },

  getUserData: async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  },

  removeUserData: async () => {
    try {
      await AsyncStorage.removeItem("userData");
    } catch (error) {
      console.error("Error removing user data:", error);
    }
  },

  clearAll: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  },
};

export default api;

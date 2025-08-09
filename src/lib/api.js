import axios from "axios";

// API configuration for admin portal
const API_BASE_URL = "https://payment.momentam.io/api";

console.log("🔧 API_BASE_URL:", API_BASE_URL);
console.log("🔧 NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token (but not for login)
apiClient.interceptors.request.use(
  (config) => {
    // Don't add Authorization header for login requests
    if (!config.url.includes("/auth/admin/login")) {
      const token = localStorage.getItem("admin_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    console.log("🌐 API Request Details:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
      fullUrl: `${API_BASE_URL}${config.url}`,
    });

    // Special logging for login requests
    if (config.url.includes("/auth/admin/login")) {
      console.log("🔐 LOGIN REQUEST:", {
        email: config.data?.email,
        password: config.data?.password ? "***HIDDEN***" : "MISSING",
        dataObject: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log("📥 Response status:", response.status);
    console.log("📄 Response data:", response.data);
    return response.data;
  },
  (error) => {
    console.error("❌ API request failed:", error);
    console.error("🔍 Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: error.config,
    });

    // Return a consistent error format
    throw new Error(
      error.response?.data?.error || error.message || "Network error",
    );
  },
);

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    console.log("📡 Making request to:", `${API_BASE_URL}${endpoint}`);

    const config = {
      url: endpoint,
      method: options.method || "GET",
      ...options,
    };

    if (options.body || options.data) {
      config.data = options.body || options.data;
    }

    return await apiClient(config);
  } catch (error) {
    console.error("❌ API request failed:", error);
    throw error;
  }
};

// Authentication API functions
export const authAPI = {
  // Test connection
  testConnection: async () => {
    console.log("🧪 Testing API connection...");
    return apiRequest("/test");
  },

  // Admin login
  login: async (email, password) => {
    console.log("🔐 Attempting login for:", email);
    return apiRequest("/auth/admin/login", {
      method: "POST",
      data: { email, password },
    });
  },

  // Get current admin user
  getCurrentUser: async () => {
    return apiRequest("/auth/admin/me");
  },

  // Logout (client-side only, clear token)
  logout: () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
  },
};

// Generic API functions
export const api = {
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, data) =>
    apiRequest(endpoint, {
      method: "POST",
      data,
    }),
  put: (endpoint, data) =>
    apiRequest(endpoint, {
      method: "PUT",
      data,
    }),
  delete: (endpoint) =>
    apiRequest(endpoint, {
      method: "DELETE",
    }),
};

export default api;

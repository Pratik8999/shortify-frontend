import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Global flag to prevent concurrent token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(() => {
    const saved = localStorage.getItem('shortify_tokens');
    return saved ? JSON.parse(saved) : null;
  });

  // Base API configuration
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Global axios interceptor for ngrok header
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      config.headers['ngrok-skip-browser-warning'] = '69420';
      return config;
    });

    return () => axios.interceptors.request.eject(requestInterceptor);
  }, []);

  // Axios interceptor for automatic token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Prevent infinite loops
        if (originalRequest._retry) {
          return Promise.reject(error);
        }
        
        // Get fresh tokens from localStorage to avoid stale closure
        const currentTokens = JSON.parse(localStorage.getItem('shortify_tokens') || '{}');
        
        if (error.response?.status === 401 && currentTokens?.refresh_token && !originalRequest._retry) {
          // If already refreshing, queue this request
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axios.request(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;
          
          try {
            const refreshResponse = await axios.post(`${API_BASE}/auth/refresh`, {
              refresh_token: currentTokens.refresh_token
            }, {
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            const newTokens = {
              ...currentTokens,
              access_token: refreshResponse.data.access_token,
              token_type: refreshResponse.data.token_type
            };
            
            setTokens(newTokens);
            localStorage.setItem('shortify_tokens', JSON.stringify(newTokens));
            
            // Process queued requests
            processQueue(null, refreshResponse.data.access_token);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
            return axios.request(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            if (refreshError.response?.status === 403) {
              // Refresh token expired, logout user
              logout();
            }
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Set user data on token change
  useEffect(() => {
    if (tokens) {
      setUser({ 
        id: tokens.userid,
        isAuthenticated: true 
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [tokens]);

  const register = async (userData) => {
    try {
      // CRITICAL: Don't set loading during registration attempts to avoid unmounting LandingPage
      // This prevents the modal from disappearing during registration
      
      const response = await axios.post(`${API_BASE}/auth/register`, userData, {
        headers: getHeaders(false)
      });
      
      const tokenData = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        token_type: response.data.token_type,
        userid: response.data.userid
      };
      
      setTokens(tokenData);
      localStorage.setItem('shortify_tokens', JSON.stringify(tokenData));
      
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      return { success: false, message };
    }
    // CRITICAL: No finally block with setLoading(false) to avoid re-renders
  };

  const login = async (email, password) => {
    try {
      // CRITICAL: Don't set loading during login attempts to avoid unmounting LandingPage
      // This prevents the modal from disappearing during login
      
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password
      }, {
        headers: getHeaders(false)
      });
      
      const tokenData = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        token_type: response.data.token_type,
        userid: response.data.userid
      };
      
      setTokens(tokenData);
      localStorage.setItem('shortify_tokens', JSON.stringify(tokenData));
      
      return { success: true, message: 'Login successful' };
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      return { success: false, message };
    }
    // CRITICAL: No finally block with setLoading(false) to avoid re-renders
  };

  const logout = async () => {
    try {
      // If we have tokens, try to logout via API
      if (tokens?.access_token && tokens?.refresh_token) {
        await axios.post(`${API_BASE}/auth/logout`, {
          refresh_token: tokens.refresh_token
        }, {
          headers: getHeaders(true)
        });
        // Success (200) - server logout successful
        // console.log('Server logout successful');
      }
    } catch (error) {
      // Handle both 400 (expired refresh token) and other errors
      if (error.response?.status === 400) {
        // console.log('Refresh token expired, but logging out anyway');
      } else {
        // console.log('Logout API failed, but logging out locally anyway');
      }
      // Continue with local logout regardless of API response
    } finally {
      // Always perform local logout regardless of API call result
      setTokens(null);
      setUser(null);
      localStorage.removeItem('shortify_tokens');
    }
  };

  const getAuthHeader = () => {
    return tokens ? `Bearer ${tokens.access_token}` : null;
  };

  const getHeaders = (includeAuth = true) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (includeAuth) {
      const authHeader = getAuthHeader();
      if (authHeader) {
        headers.Authorization = authHeader;
      }
    }
    
    return headers;
  };

  const fetchUrls = async (page = 1, limit = 10) => {
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        return { success: false, message: 'Not authenticated' };
      }

      const response = await axios.get(`${API_BASE}/url-shortner/`, {
        params: { page, limit },
        headers: getHeaders(true)
      });

      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {
          current_page: page,
          next_page: null,
          prev_page: null,
          total_pages: 1,
          total_items: 0
        }
      };
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch URLs';
      return { success: false, message };
    }
  };

  const getProfile = async () => {
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        return { success: false, message: 'Not authenticated' };
      }

      const response = await axios.get(`${API_BASE}/auth/profile`, {
        headers: getHeaders(true)
      });

      return {
        success: true,
        profile: response.data
      };
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch profile';
      return { success: false, message };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        return { success: false, message: 'Not authenticated' };
      }

      const response = await axios.put(`${API_BASE}/auth/profile`, profileData, {
        headers: getHeaders(true)
      });

      return {
        success: true,
        profile: response.data,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to update profile';
      return { success: false, message };
    }
  };

  const deleteUrls = async (urlCodes) => {
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        return { success: false, message: 'Not authenticated' };
      }

      const response = await axios.post(`${API_BASE}/url-shortner/delete`, {
        url_codes: urlCodes
      }, {
        headers: getHeaders(true)
      });

      return {
        success: true,
        message: response.data.message || 'URLs deleted successfully'
      };
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to delete URLs';
      return { success: false, message };
    }
  };

  const value = {
    user,
    tokens,
    loading,
    register,
    login,
    logout,
    getAuthHeader,
    getHeaders,
    fetchUrls,
    getProfile,
    updateProfile,
    deleteUrls,
    API_BASE
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

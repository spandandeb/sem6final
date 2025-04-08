import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  isAlumni: boolean;
  graduationYear?: number;
  company?: string;
  position?: string;
  bio?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  register: (userData: any) => Promise<void>;
  registerAlumni: (alumniData: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'http://localhost:5000/api/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from token
  const loadUser = async () => {
    const storedToken = localStorage.getItem('authToken');
    
    if (!storedToken) {
      setLoading(false);
      return;
    }
    
    setToken(storedToken);
    
    try {
      const res = await axios.get(`${API_URL}/me`, {
        headers: {
          'x-auth-token': storedToken
        }
      });
      
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error loading user:', err);
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    // Check if user is already logged in and load user data
    console.log('AUTH INIT - Loading user data');
    loadUser();
  }, []);

  const register = async (userData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.post(`${API_URL}/signup`, userData);
      
      localStorage.setItem('authToken', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      setIsAuthenticated(false);
    }
    
    setLoading(false);
  };

  const registerAlumni = async (alumniData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.post(`${API_URL}/alumni/signup`, alumniData);
      
      localStorage.setItem('authToken', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Alumni registration failed');
      setIsAuthenticated(false);
    }
    
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    console.log('AUTH - Login called with email:', email);
    
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      
      localStorage.setItem('authToken', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      console.log('AUTH - User is now authenticated');
    } catch (err: any) {
      console.error('AUTH - Login failed:', err);
      setError(err.response?.data?.message || 'Login failed');
      setIsAuthenticated(false);
    }
    
    setLoading(false);
  };

  const logout = () => {
    console.log('AUTH - Logout called');
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    console.log('AUTH - User is now logged out');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        token,
        loading,
        error,
        register,
        registerAlumni,
        login, 
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
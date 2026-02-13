# Frontend Integration Guide

## Authentication Flow

### 1. Axios Setup with Auto-Refresh

```typescript
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('http://localhost:3000/api/v1/auth/refresh', {
          refreshToken,
        });

        localStorage.setItem('accessToken', data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 2. Auth Service

```typescript
// src/services/auth.service.ts
import api from '../lib/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'CUSTOMER' | 'DRIVER';
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data.data;
  },

  async register(userData: RegisterData) {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data.data;
  },

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  async getMe() {
    const { data } = await api.get('/auth/me');
    return data.data;
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },
};
```

### 3. Auth Context (React)

```typescript
// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

interface User {
  id: string;
  email: string;
  role: string;
  profile: any;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Failed to get user:', error);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    setUser(data.user);
  };

  const register = async (userData: any) => {
    const data = await authService.register(userData);
    setUser(data.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 4. Protected Routes (React Router)

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

### 5. Dashboard Service

```typescript
// src/services/dashboard.service.ts
import api from '../lib/api';

export const dashboardService = {
  async getAdminDashboard() {
    const { data } = await api.get('/dashboard/admin');
    return data.data;
  },

  async getManagerDashboard() {
    const { data } = await api.get('/dashboard/manager');
    return data.data;
  },

  async getDriverDashboard() {
    const { data } = await api.get('/dashboard/driver');
    return data.data;
  },

  async getCustomerDashboard() {
    const { data } = await api.get('/dashboard/customer');
    return data.data;
  },
};
```

### 6. Shipment Service

```typescript
// src/services/shipment.service.ts
import api from '../lib/api';

export const shipmentService = {
  async createShipment(data: any) {
    const response = await api.post('/shipments', data);
    return response.data.data;
  },

  async getShipments(params?: any) {
    const response = await api.get('/shipments', { params });
    return response.data.data;
  },

  async getShipmentById(id: string) {
    const response = await api.get(`/shipments/${id}`);
    return response.data.data;
  },

  async assignDriver(shipmentId: string, driverId: string) {
    const response = await api.patch(`/shipments/${shipmentId}/assign`, { driverId });
    return response.data.data;
  },

  async updateStatus(shipmentId: string, status: string, notes?: string) {
    const response = await api.patch(`/shipments/${shipmentId}/status`, { status, notes });
    return response.data.data;
  },
};
```

## Usage Examples

### Login Page

```typescript
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
};
```

### Admin Dashboard

```typescript
import { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboard.service';

export const AdminDashboard = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const dashboardData = await dashboardService.getAdminDashboard();
      setData(dashboardData);
    };
    fetchData();
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div>Total Shipments: {data.stats.totalShipments}</div>
      <div>Active: {data.stats.activeShipments}</div>
      <div>Delivered: {data.stats.deliveredShipments}</div>
      <div>Revenue: ${data.stats.totalRevenue}</div>
    </div>
  );
};
```

## Test Credentials

```
Admin: admin@ganges.com / admin123
Manager: manager@ganges.com / manager123
Driver: driver1@ganges.com / driver123
Customer: customer1@example.com / customer123
```

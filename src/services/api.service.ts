/**
 * API Service Layer - PRODUCTION READY
 * Connected to Supabase backend
 */

import { supabase } from '../lib/supabaseClient';

// Use environment variable for Functions URL or derive it
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1';

// Helper to ensure session exists before direct DB queries
async function ensureSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('❌ API: Active session required for this operation');
  }
  return session;
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Use modular backend token if available, otherwise fallback to Supabase for migration period
  let token = localStorage.getItem('ganges_token');

  if (!token) {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token || null;
  }

  // Strict session check for protected endpoints
  const isPublic = endpoint.startsWith('/auth') || endpoint === '/coupons/validate' || endpoint.includes('/track/');
  if (!isPublic && !token) {
    throw new Error('❌ API: Authentication required for this operation');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    signal: controller.signal,
    ...options,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, defaultOptions);
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || data.message || `API Error: ${response.statusText}`;
      console.error(`🔴 API Failure [${endpoint}]:`, errorMessage);
      throw new Error(errorMessage);
    }

    // Modular backend wraps results in a 'data' property
    return data.data !== undefined ? data.data : data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const msg = `Request timeout [${endpoint}]`;
      console.error(`❌ ${msg}`);
      throw new Error(msg);
    }
    console.error(`❌ Network Error [${endpoint}]:`, error.message);
    throw error;
  }
}

// ========================================
// Authentication Services
// ========================================

export const authService = {
  /**
   * Login user
   */
  async login(email: string, password: string) {
    const response: any = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store tokens for modular backend
    localStorage.setItem('ganges_token', response.accessToken);
    localStorage.setItem('ganges_refresh_token', response.refreshToken);

    // Support existing Supabase-style session if needed
    localStorage.setItem('user', JSON.stringify(response.user));

    return {
      user: response.user,
      profile: response.user.profile,
      session: { access_token: response.accessToken },
    };
  },

  /**
   * Register new user
   */
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  }) {
    const response: any = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    return {
      user: response.user,
      session: { access_token: response.accessToken },
    };
  },

  /**
   * Logout user
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },
};

// ========================================
// User Profile Services
// ========================================

export const userService = {
  /**
   * Get user profile
   */
  async getProfile() {
    await ensureSession();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('❌ Not authenticated');

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('🔴 Error fetching profile:', error);
      throw error;
    }

    return {
      id: user.id,
      email: user.email,
      ...profile,
    };
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  }) {
    return await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Get user addresses
   */
  async getAddresses() {
    await ensureSession();
    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .order('is_default', { ascending: false });

    if (error) {
      console.error('🔴 Error fetching addresses:', error);
      throw error;
    }
    return data;
  },
};

// ========================================
// Package Services
// ========================================

export const packageService = {
  /**
   * Get all packages for current user
   */
  async getPackages() {
    await ensureSession();
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🔴 Error fetching packages:', error);
      throw error;
    }
    return data;
  },

  /**
   * Create new package/shipment
   */
  async createPackage(packageData: {
    description: string;
    weight: number;
    declaredValue: number;
    shippingMethod: 'Economy' | 'Ganges One';
    destinationAddress: string;
    packingServices?: string[];
  }) {
    return await apiRequest('/packages', {
      method: 'POST',
      body: JSON.stringify(packageData),
    });
  },

  /**
   * Track package by tracking number
   */
  async trackPackage(trackingNumber: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/packages/track/${trackingNumber}`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '❌ Package not found');

    return data;
  },
};

// ========================================
// Shipment Services
// ========================================

export const shipmentService = {
  /**
   * Create new shipment request
   */
  async createShipment(data: {
    packageIds: string[];
    destination: string;
    shippingMethod: 'Economy' | 'Ganges One';
    addressId: string;
  }) {
    await ensureSession();
    return await apiRequest('/shipments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get all shipments for current user
   */
  async getShipments() {
    await ensureSession();
    const { data, error } = await supabase
      .from('shipments')
      .select('*, packages(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🔴 Error fetching shipments:', error);
      throw error;
    }
    return data;
  },

  /**
   * Calculate shipping cost
   */
  calculateShipping(data: {
    weight: number;
    destination: string;
    method: 'Economy' | 'Ganges One';
  }) {
    const rates: Record<string, number> = {
      'Economy': 2500,
      'Ganges One': 3500,
    };

    const baseRate = rates[data.method] || 2500;
    const weightCharge = data.weight * baseRate;

    return {
      baseRate,
      weightCharge,
      total: weightCharge,
      method: data.method,
    };
  },
};

// ========================================
// Personal Shopper Services
// ========================================

export const personalShopperService = {
  /**
   * Create personal shopper request
   */
  async createRequest(requestData: {
    productUrl: string;
    productName: string;
    quantity: number;
    budget?: number;
    preferences?: string;
    notes?: string;
  }) {
    return await apiRequest('/personal-shopper/request', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  /**
   * Get all personal shopper requests for current user
   */
  async getRequests() {
    await ensureSession();
    const { data, error } = await supabase
      .from('personal_shopper_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🔴 Error fetching PS requests:', error);
      throw error;
    }
    return data;
  },
};

// ========================================
// Wallet Services
// ========================================

export const walletService = {
  /**
   * Get wallet balance
   */
  async getBalance() {
    return await apiRequest<{ balance: number }>('/wallet/balance');
  },

  /**
   * Add funds to wallet
   */
  async addFunds(amount: number, paymentMethod: string, referenceId: string) {
    return await apiRequest('/wallet/add-funds', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        paymentMethod,
        referenceId,
      }),
    });
  },

  /**
   * Get transaction history
   */
  async getTransactions() {
    await ensureSession();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🔴 Error fetching transactions:', error);
      throw error;
    }
    return data;
  },

  /**
   * Deduct from wallet
   */
  async deduct(amount: number, description: string, referenceId?: string) {
    return await apiRequest('/wallet/deduct', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        description,
        referenceId,
      }),
    });
  },
};

// ========================================
// Coupon Services
// ========================================

export const couponService = {
  /**
   * Validate coupon code
   */
  async validateCoupon(code: string, orderValue: number) {
    return await apiRequest('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, orderValue }),
    });
  },

  /**
   * Apply coupon (mark as used)
   */
  async applyCoupon(couponId: string) {
    return await apiRequest('/coupons/apply', {
      method: 'POST',
      body: JSON.stringify({ couponId }),
    });
  },

  /**
   * Get all active coupons
   */
  async getActiveCoupons() {
    const response = await fetch(`${API_URL}/coupons`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    return data.coupons || [];
  },
};

// ========================================
// Referral Services
// ========================================

export const referralService = {
  /**
   * Get user's referral code and stats
   */
  async getMyReferralCode() {
    return await apiRequest('/referrals/my-code');
  },

  /**
   * Apply referral code
   */
  async applyReferralCode(referralCode: string) {
    return await apiRequest('/referrals/apply', {
      method: 'POST',
      body: JSON.stringify({ referralCode }),
    });
  },
};

// ========================================
// Admin Services
// ========================================

export const adminService = {
  /**
   * Admin login (standardized via modular auth)
   */
  async login(email: string, password: string) {
    const response = await authService.login(email, password);

    if (response.user.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    return { success: true, user: response.user };
  },

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    return await apiRequest('/dashboard/admin');
  },

  /**
   * Get all users
   */
  async getUsers() {
    return await apiRequest('/admin/users');
  },

  /**
   * Get all shipments
   */
  async getAllShipments() {
    return await apiRequest('/admin/shipments');
  },

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, isActive: boolean) {
    return await apiRequest(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  /**
   * Get all packages
   */
  async getPackages() {
    return await apiRequest('/admin/packages');
  },

  /**
   * Get all personal shopper requests
   */
  async getPersonalShopperRequests() {
    return await apiRequest('/admin/personal-shopper');
  },

  /**
   * Update package status
   */
  async updatePackageStatus(packageId: string, status: string, location?: string, description?: string) {
    return await apiRequest(`/packages/${packageId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, location, description }),
    });
  },

  /**
   * Update personal shopper request
   */
  async updatePersonalShopperRequest(requestId: string, updates: {
    status?: string;
    quoteAmount?: number;
    serviceFee?: number;
    adminNotes?: string;
  }) {
    return await apiRequest(`/admin/personal-shopper/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Create coupon
   */
  async createCoupon(couponData: {
    code: string;
    discountType: 'Percentage' | 'Fixed';
    discountValue: number;
    maxDiscount?: number;
    minOrderValue?: number;
    validUntil?: string;
    usageLimit?: number;
  }) {
    return await apiRequest('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(couponData),
    });
  },

  /**
   * Initialize database with sample data
   */
  async initializeDatabase() {
    return await apiRequest('/admin/init-db', {
      method: 'POST',
    });
  },
};

// ========================================
// Dashboard Services
// ========================================

export const dashboardService = {
  /**
   * Get customer dashboard
   */
  async getCustomerDashboard() {
    return await apiRequest<any>('/dashboard/customer');
  },

  /**
   * Get driver dashboard
   */
  async getDriverDashboard() {
    return await apiRequest<any>('/dashboard/driver');
  },

  /**
   * Get manager dashboard
   */
  async getManagerDashboard() {
    return await apiRequest<any>('/dashboard/manager');
  },

  /**
   * Get admin dashboard
   */
  async getAdminDashboard() {
    return await apiRequest<any>('/dashboard/admin');
  },
};

// Export all services
export default {
  auth: authService,
  user: userService,
  package: packageService,
  shipment: shipmentService,
  personalShopper: personalShopperService,
  wallet: walletService,
  coupon: couponService,
  referral: referralService,
  admin: adminService,
  dashboard: dashboardService,
};

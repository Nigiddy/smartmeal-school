/**
 * API Service Layer for SmartMeal Application
 * Handles all backend communication including M-Pesa integration
 */

// Environment variables with fallbacks
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  mpesa: {
    consumerKey: import.meta.env.VITE_MPESA_CONSUMER_KEY,
    consumerSecret: import.meta.env.VITE_MPESA_CONSUMER_SECRET,
    passkey: import.meta.env.VITE_MPESA_PASSKEY,
    shortcode: import.meta.env.VITE_MPESA_SHORTCODE,
    environment: import.meta.env.VITE_MPESA_ENVIRONMENT || 'sandbox'
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'SmartMeal',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.VITE_APP_ENVIRONMENT || 'development'
  }
};

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MpesaStkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface MpesaCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  phoneNumber: string;
  transactionId?: string;
  mpesaRequestId?: string;
  checkoutRequestId?: string;
  notes?: string;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  menuItem: MenuItem;
}

export interface CreateOrderRequest {
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
  customerName: string;
  customerPhone: string;
  phoneNumber: string;
  notes?: string;
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// HTTP client with timeout and error handling
class HttpClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${config.apiBaseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.apiTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData.code
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      
      throw new ApiError(
        error.message || 'Network error',
        500
      );
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

const httpClient = new HttpClient();

// Menu Service
export class MenuService {
  static async getMenuItems(): Promise<MenuItem[]> {
    try {
      const response = await httpClient.get<ApiResponse<MenuItem[]>>('/menu');
      if (response.success && response.data) {
        return response.data;
      }
      throw new ApiError(response.error || 'Failed to fetch menu', 500);
    } catch (error) {
      console.error('Error fetching menu:', error);
      throw error;
    }
  }

  static async getMenuCategories(): Promise<string[]> {
    try {
      const response = await httpClient.get<ApiResponse<string[]>>('/menu/categories');
      if (response.success && response.data) {
        return response.data;
      }
      throw new ApiError(response.error || 'Failed to fetch categories', 500);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  static async getMenuItemById(id: string): Promise<MenuItem> {
    try {
      const response = await httpClient.get<ApiResponse<MenuItem>>(`/menu/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new ApiError(response.error || 'Failed to fetch menu item', 500);
    } catch (error) {
      console.error('Error fetching menu item:', error);
      throw error;
    }
  }

  static async createMenuItem(itemData: {
    name: string;
    description?: string;
    price: number;
    category: string;
    image?: string;
    isAvailable: boolean;
  }): Promise<MenuItem> {
    try {
      const response = await httpClient.post<ApiResponse<MenuItem>>('/admin/menu', itemData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new ApiError(response.error || 'Failed to create menu item', 500);
    } catch (error) {
      console.error('Error creating menu item:', error);
      throw error;
    }
  }

  static async updateMenuItem(
    id: string, 
    itemData: Partial<{
      name: string;
      description: string;
      price: number;
      category: string;
      image: string;
      isAvailable: boolean;
    }>
  ): Promise<MenuItem> {
    try {
      const response = await httpClient.put<ApiResponse<MenuItem>>(`/admin/menu/${id}`, itemData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new ApiError(response.error || 'Failed to update menu item', 500);
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  }

  static async deleteMenuItem(id: string): Promise<void> {
    try {
      const response = await httpClient.delete<ApiResponse<void>>(`/admin/menu/${id}`);
      if (!response.success) {
        throw new ApiError(response.error || 'Failed to delete menu item', 500);
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }
}

// Order Service
export class OrdersService {
  static async createOrder(orderData: CreateOrderRequest): Promise<OrderData> {
    try {
      const response = await httpClient.post<ApiResponse<OrderData>>('/orders', orderData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new ApiError(response.error || 'Failed to create order', 500);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  static async getOrders(page: number = 1, limit: number = 20): Promise<{
    orders: OrderData[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await httpClient.get<ApiResponse<{
        orders: OrderData[];
        total: number;
        page: number;
        totalPages: number;
      }>>(`/orders?page=${page}&limit=${limit}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      throw new ApiError(response.error || 'Failed to fetch orders', 500);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  static async getOrderById(id: string): Promise<OrderData> {
    try {
      const response = await httpClient.get<ApiResponse<OrderData>>(`/orders/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new ApiError(response.error || 'Failed to fetch order', 500);
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  static async updateOrderStatus(id: string, status: OrderData['status']): Promise<OrderData> {
    try {
      const response = await httpClient.patch<ApiResponse<OrderData>>(`/orders/${id}/status`, { status });
      if (response.success && response.data) {
        return response.data;
      }
      throw new ApiError(response.error || 'Failed to update order status', 500);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
}

// M-Pesa Service
export class MpesaService {
  static async initiatePayment(
    phoneNumber: string,
    amount: number,
    orderId: string,
    description: string
  ): Promise<MpesaStkPushResponse> {
    try {
      const response = await httpClient.post<ApiResponse<MpesaStkPushResponse>>('/mpesa/stk-push', {
        phoneNumber,
        amount,
        orderId,
        description
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      throw new ApiError(response.error || 'Failed to initiate payment', 500);
    } catch (error) {
      console.error('Error initiating payment:', error);
      throw error;
    }
  }

  static async checkPaymentStatus(checkoutRequestId: string): Promise<{
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    transactionId?: string;
    resultCode?: number;
    resultDesc?: string;
  }> {
    try {
      const response = await httpClient.get<ApiResponse<{
        status: 'PENDING' | 'COMPLETED' | 'FAILED';
        transactionId?: string;
        resultCode?: number;
        resultDesc?: string;
      }>>(`/mpesa/status/${checkoutRequestId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      throw new ApiError(response.error || 'Failed to check payment status', 500);
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  }
}

// Auth Service
export class AuthService {
  static async login(email: string, password: string): Promise<{
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: 'ADMIN' | 'STAFF';
    };
  }> {
    try {
      const response = await httpClient.post<ApiResponse<{
        token: string;
        user: {
          id: string;
          email: string;
          name: string;
          role: 'ADMIN' | 'STAFF';
        };
      }>>('/auth/login', { email, password });
      
      if (response.success && response.data) {
        // Store token in localStorage
        localStorage.setItem('authToken', response.data.token);
        return response.data;
      }
      throw new ApiError(response.error || 'Login failed', 500);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  static async logout(): Promise<void> {
    try {
      await httpClient.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('authToken');
    }
  }

  static async getProfile(): Promise<{
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'STAFF';
  }> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new ApiError('No authentication token', 401);
      }

      const response = await httpClient.get<ApiResponse<{
        id: string;
        email: string;
        name: string;
        role: 'ADMIN' | 'STAFF';
      }>>('/auth/me');
      
      if (response.success && response.data) {
        return response.data;
      }
      throw new ApiError(response.error || 'Failed to fetch profile', 500);
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  static getToken(): string | null {
    return localStorage.getItem('authToken');
  }
}

// Utility functions
export const apiUtils = {
  generateOrderId: (): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `SM${timestamp}${random}`.toUpperCase();
  },

  formatPhoneNumber: (phone: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Kenyan phone numbers
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
      // Already in correct format
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  },

  validatePhoneNumber: (phone: string): boolean => {
    const formatted = apiUtils.formatPhoneNumber(phone);
    // Kenyan phone number validation: 254 + 7 or 1 + 8 digits
    return /^254[17]\d{8}$/.test(formatted);
  },

  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  formatDate: (date: string | Date): string => {
    return new Intl.DateTimeFormat('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }
};

// All services are exported inline with their class definitions above

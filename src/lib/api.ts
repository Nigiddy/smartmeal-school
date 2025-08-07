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

export interface OrderData {
  id: string;
  customer: {
    name: string;
    phone: string;
    notes?: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentMethod: 'M-Pesa' | 'Cash';
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderTime: string;
  mpesaRequestId?: string;
  mpesaCheckoutId?: string;
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
          'X-App-Name': config.app.name,
          'X-App-Version': config.app.version,
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

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const httpClient = new HttpClient();

// M-Pesa API Service
export class MpesaService {
  /**
   * Initiate STK Push payment
   */
  static async initiatePayment(
    phoneNumber: string,
    amount: number,
    orderId: string,
    description: string
  ): Promise<MpesaStkPushResponse> {
    if (!config.mpesa.consumerKey || !config.mpesa.passkey) {
      throw new ApiError('M-Pesa configuration missing', 500);
    }

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${config.mpesa.shortcode}${config.mpesa.passkey}${timestamp}`
    ).toString('base64');

    const payload = {
      BusinessShortCode: config.mpesa.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: config.mpesa.shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: `${config.apiBaseUrl}/mpesa/callback`,
      AccountReference: orderId,
      TransactionDesc: description,
    };

    return httpClient.post<MpesaStkPushResponse>('/mpesa/stkpush', payload);
  }

  /**
   * Check payment status
   */
  static async checkPaymentStatus(checkoutRequestId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
    amount?: number;
  }> {
    return httpClient.get(`/mpesa/status/${checkoutRequestId}`);
  }

  /**
   * Process M-Pesa callback
   */
  static async processCallback(callbackData: MpesaCallbackData): Promise<void> {
    return httpClient.post('/mpesa/callback', callbackData);
  }
}

// Orders API Service
export class OrdersService {
  /**
   * Create a new order
   */
  static async createOrder(orderData: Omit<OrderData, 'id' | 'status' | 'orderTime'>): Promise<OrderData> {
    return httpClient.post<OrderData>('/orders', orderData);
  }

  /**
   * Get order by ID
   */
  static async getOrder(orderId: string): Promise<OrderData> {
    return httpClient.get<OrderData>(`/orders/${orderId}`);
  }

  /**
   * Get all orders (admin only)
   */
  static async getOrders(filters?: {
    status?: string;
    date?: string;
    limit?: number;
  }): Promise<OrderData[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    return httpClient.get<OrderData[]>(`/orders?${params.toString()}`);
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: string,
    status: OrderData['status']
  ): Promise<OrderData> {
    return httpClient.put<OrderData>(`/orders/${orderId}/status`, { status });
  }
}

// Menu API Service
export class MenuService {
  /**
   * Get all menu items
   */
  static async getMenuItems(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    available: boolean;
    image?: string;
  }>> {
    return httpClient.get('/menu');
  }

  /**
   * Create menu item (admin only)
   */
  static async createMenuItem(itemData: {
    name: string;
    description: string;
    price: number;
    category: string;
    image?: string;
  }): Promise<any> {
    return httpClient.post('/menu', itemData);
  }

  /**
   * Update menu item (admin only)
   */
  static async updateMenuItem(
    itemId: string,
    itemData: Partial<{
      name: string;
      description: string;
      price: number;
      category: string;
      available: boolean;
      image: string;
    }>
  ): Promise<any> {
    return httpClient.put(`/menu/${itemId}`, itemData);
  }

  /**
   * Delete menu item (admin only)
   */
  static async deleteMenuItem(itemId: string): Promise<void> {
    return httpClient.delete(`/menu/${itemId}`);
  }
}

// Auth Service
export class AuthService {
  /**
   * Admin login
   */
  static async login(credentials: {
    username: string;
    password: string;
  }): Promise<{
    token: string;
    user: {
      id: string;
      username: string;
      role: string;
    };
  }> {
    return httpClient.post('/auth/login', credentials);
  }

  /**
   * Verify admin token
   */
  static async verifyToken(token: string): Promise<{
    valid: boolean;
    user?: any;
  }> {
    return httpClient.post('/auth/verify', { token });
  }

  /**
   * Logout
   */
  static async logout(): Promise<void> {
    return httpClient.post('/auth/logout', {});
  }
}

// Utility functions
export const apiUtils = {
  /**
   * Generate a unique order ID
   */
  generateOrderId(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SM${timestamp}${random}`;
  },

  /**
   * Format phone number for M-Pesa
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      return `254${cleaned.slice(1)}`;
    }
    
    // If it starts with +254, remove the +
    if (cleaned.startsWith('254')) {
      return cleaned;
    }
    
    // If it's 9 digits, assume it's a Kenyan number
    if (cleaned.length === 9) {
      return `254${cleaned}`;
    }
    
    return cleaned;
  },

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    return /^254[17]\d{8}$/.test(formatted);
  },

  /**
   * Get environment-specific configuration
   */
  getConfig() {
    return config;
  }
};

export default {
  MpesaService,
  OrdersService,
  MenuService,
  AuthService,
  apiUtils,
  config
};

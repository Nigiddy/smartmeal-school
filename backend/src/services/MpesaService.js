const axios = require('axios');
const crypto = require('crypto');

class MpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.passkey = process.env.MPESA_PASSKEY;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;
    this.timeout = parseInt(process.env.MPESA_TIMEOUT) || 60000;
    this.maxRetries = parseInt(process.env.MPESA_RETRY_ATTEMPTS) || 3;
    
    // API endpoints based on environment
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
    
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get access token for M-Pesa API
   */
  async getAccessToken() {
    try {
      // Check if token is still valid
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.post(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {},
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 50 minutes (tokens usually last 1 hour)
      this.tokenExpiry = Date.now() + (50 * 60 * 1000);
      
      console.log('✅ M-Pesa access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to get M-Pesa access token:', error.message);
      throw new Error(`Failed to authenticate with M-Pesa: ${error.message}`);
    }
  }

  /**
   * Generate timestamp for M-Pesa API
   */
  generateTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  /**
   * Generate password for M-Pesa API
   */
  generatePassword() {
    const timestamp = this.generateTimestamp();
    const password = `${this.shortcode}${this.passkey}${timestamp}`;
    return Buffer.from(password).toString('base64');
  }

  /**
   * Initiate STK Push payment
   */
  async initiatePayment(phoneNumber, amount, orderId, description) {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword();
      
      // Format phone number (remove +254 prefix if present)
      const formattedPhone = phoneNumber.replace(/^\+254/, '254');
      
      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount), // M-Pesa expects whole numbers
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackUrl,
        AccountReference: orderId,
        TransactionDesc: description || 'SmartMeal Payment'
      };

      console.log('🔄 Initiating M-Pesa STK Push:', {
        phoneNumber: formattedPhone,
        amount,
        orderId,
        shortcode: this.shortcode
      });

      const response = await this.makeRequest(
        '/mpesa/stkpush/v1/processrequest',
        payload,
        accessToken
      );

      console.log('✅ M-Pesa STK Push initiated successfully:', {
        merchantRequestId: response.MerchantRequestID,
        checkoutRequestId: response.CheckoutRequestID,
        responseCode: response.ResponseCode
      });

      return response;
    } catch (error) {
      console.error('❌ M-Pesa payment initiation failed:', error.message);
      throw new Error(`Payment initiation failed: ${error.message}`);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(checkoutRequestId) {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword();
      
      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      console.log('🔄 Checking M-Pesa payment status:', { checkoutRequestId });

      const response = await this.makeRequest(
        '/mpesa/stkpushquery/v1/query',
        payload,
        accessToken
      );

      console.log('✅ M-Pesa payment status checked:', {
        checkoutRequestId,
        resultCode: response.ResultCode,
        resultDesc: response.ResultDesc
      });

      return response;
    } catch (error) {
      console.error('❌ M-Pesa payment status check failed:', error.message);
      throw new Error(`Payment status check failed: ${error.message}`);
    }
  }

  /**
   * Make HTTP request to M-Pesa API with retry logic
   */
  async makeRequest(endpoint, payload, accessToken, retryCount = 0) {
    try {
      const response = await axios.post(
        `${this.baseUrl}${endpoint}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      return response.data;
    } catch (error) {
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        console.log(`🔄 Retrying M-Pesa API request (attempt ${retryCount + 1}/${this.maxRetries})`);
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
        return this.makeRequest(endpoint, payload, accessToken, retryCount + 1);
      }
      
      throw this.handleApiError(error);
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNABORTED' ||
      (error.response && error.response.status >= 500) ||
      !error.response // Network error
    );
  }

  /**
   * Handle M-Pesa API errors
   */
  handleApiError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(`Bad request: ${data.errorMessage || data.error || 'Invalid request parameters'}`);
        case 401:
          return new Error('Authentication failed. Please check your M-Pesa credentials.');
        case 403:
          return new Error('Access denied. Insufficient permissions.');
        case 404:
          return new Error('M-Pesa API endpoint not found.');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('M-Pesa service temporarily unavailable. Please try again.');
        default:
          return new Error(`M-Pesa API error (${status}): ${data.errorMessage || data.error || 'Unknown error'}`);
      }
    } else if (error.request) {
      return new Error('No response received from M-Pesa. Please check your internet connection.');
    } else {
      return new Error(`Request setup failed: ${error.message}`);
    }
  }

  /**
   * Process M-Pesa callback data
   */
  processCallback(callbackData) {
    try {
      if (!callbackData.Body || !callbackData.Body.stkCallback) {
        throw new Error('Invalid callback data structure');
      }

      const stkCallback = callbackData.Body.stkCallback;
      const resultCode = parseInt(stkCallback.ResultCode);
      
      // Extract transaction details from callback metadata
      let transactionId = null;
      let amount = null;
      let phoneNumber = null;
      
      if (stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
        stkCallback.CallbackMetadata.Item.forEach(item => {
          switch (item.Name) {
            case 'TransactionID':
              transactionId = item.Value;
              break;
            case 'Amount':
              amount = item.Value;
              break;
            case 'PhoneNumber':
              phoneNumber = item.Value;
              break;
          }
        });
      }

      const success = resultCode === 0;
      
      return {
        success,
        resultCode,
        resultDesc: stkCallback.ResultDesc,
        merchantRequestId: stkCallback.MerchantRequestID,
        checkoutRequestId: stkCallback.CheckoutRequestID,
        transactionId,
        amount,
        phoneNumber,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error processing M-Pesa callback:', error.message);
      throw new Error(`Callback processing failed: ${error.message}`);
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber) {
    // Kenyan phone number validation
    const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number for M-Pesa
   */
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters and ensure it starts with 254
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
      // Already in correct format
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      environment: this.environment,
      shortcode: this.shortcode,
      hasCredentials: !!(this.consumerKey && this.consumerSecret && this.passkey),
      callbackUrl: this.callbackUrl,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      baseUrl: this.baseUrl,
      hasValidToken: !!(this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry)
    };
  }
}

module.exports = new MpesaService();

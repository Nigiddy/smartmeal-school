const axios = require('axios');
const crypto = require('crypto');

class MpesaService {
  constructor() {
    this.baseUrl = process.env.MPESA_ENVIRONMENT === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
    
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.passkey = process.env.MPESA_PASSKEY;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;
    
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get access token from M-Pesa API
   */
  async getAccessToken() {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.accessToken;
      }

      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      this.accessToken = response.data.access_token;
      // Set expiry to 1 hour from now (minus 5 minutes buffer)
      this.tokenExpiry = new Date(Date.now() + (55 * 60 * 1000));
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting M-Pesa access token:', error.response?.data || error.message);
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  /**
   * Format phone number to M-Pesa format (254XXXXXXXXX)
   */
  formatPhoneNumber(phoneNumber) {
    let formatted = phoneNumber.replace(/\s+/g, '');
    
    // Remove leading + if present
    if (formatted.startsWith('+')) {
      formatted = formatted.substring(1);
    }
    
    // If starts with 0, replace with 254
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    }
    
    // If starts with 254, keep as is
    if (formatted.startsWith('254')) {
      return formatted;
    }
    
    // If it's a 9-digit number, assume it's Kenyan and add 254
    if (formatted.length === 9) {
      return '254' + formatted;
    }
    
    return formatted;
  }

  /**
   * Generate password for STK push
   */
  generatePassword() {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
    return { password, timestamp };
  }

  /**
   * Initiate STK push
   */
  async initiateStkPush(phoneNumber, amount, orderId, description = 'Food Order Payment') {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount), // M-Pesa expects integer
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackUrl,
        AccountReference: orderId,
        TransactionDesc: description
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data,
        orderId,
        phoneNumber: formattedPhone,
        amount
      };
    } catch (error) {
      console.error('STK Push error:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.errorMessage || 
                          error.response?.data?.errorCode || 
                          error.message || 
                          'STK Push failed';
      
      return {
        success: false,
        error: errorMessage,
        orderId,
        phoneNumber: this.formatPhoneNumber(phoneNumber),
        amount
      };
    }
  }

  /**
   * Check STK push status
   */
  async checkStkPushStatus(checkoutRequestId) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('STK Push status check error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message || 'Status check failed'
      };
    }
  }

  /**
   * Process M-Pesa callback
   */
  processCallback(callbackData) {
    try {
      if (!callbackData.Body || !callbackData.Body.stkCallback) {
        throw new Error('Invalid callback data structure');
      }

      const { stkCallback } = callbackData.Body;
      const {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
        CallbackMetadata
      } = stkCallback;

      const result = {
        merchantRequestId: MerchantRequestID,
        checkoutRequestId: CheckoutRequestID,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        success: ResultCode === 0,
        transactionId: null,
        amount: null,
        phoneNumber: null
      };

      // Extract additional data if payment was successful
      if (ResultCode === 0 && CallbackMetadata && CallbackMetadata.Item) {
        CallbackMetadata.Item.forEach(item => {
          switch (item.Name) {
            case 'TransactionID':
              result.transactionId = item.Value;
              break;
            case 'Amount':
              result.amount = item.Value;
              break;
            case 'MpesaReceiptNumber':
              result.mpesaReceiptNumber = item.Value;
              break;
            case 'PhoneNumber':
              result.phoneNumber = item.Value;
              break;
          }
        });
      }

      return result;
    } catch (error) {
      console.error('Error processing M-Pesa callback:', error);
      throw error;
    }
  }

  /**
   * Validate M-Pesa configuration
   */
  validateConfig() {
    const required = [
      'MPESA_CONSUMER_KEY',
      'MPESA_CONSUMER_SECRET', 
      'MPESA_PASSKEY',
      'MPESA_SHORTCODE',
      'MPESA_CALLBACK_URL'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing M-Pesa configuration: ${missing.join(', ')}`);
    }

    return true;
  }
}

module.exports = new MpesaService();

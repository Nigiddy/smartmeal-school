/**
 * SmartMeal Backend Server Example
 * This is a reference implementation for the backend API
 * You should implement this with your preferred Node.js framework
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

app.use(express.json());

// Environment variables
const config = {
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    passkey: process.env.MPESA_PASSKEY,
    shortcode: process.env.MPESA_SHORTCODE,
    environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
    baseUrl: process.env.MPESA_ENVIRONMENT === 'production' 
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '24h'
  }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

// M-Pesa utility functions
class MpesaService {
  static async getAccessToken() {
    try {
      const auth = Buffer.from(`${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`).toString('base64');
      
      const response = await axios.get(`${config.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting M-Pesa access token:', error);
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  static async initiateSTKPush(phoneNumber, amount, orderId, description) {
    try {
      const accessToken = await this.getAccessToken();
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
        CallBackURL: `${process.env.BACKEND_URL}/api/mpesa/callback`,
        AccountReference: orderId,
        TransactionDesc: description,
      };

      const response = await axios.post(
        `${config.mpesa.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error initiating STK Push:', error);
      throw new Error('Failed to initiate M-Pesa payment');
    }
  }

  static async checkPaymentStatus(checkoutRequestId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(
        `${config.mpesa.baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: config.mpesa.shortcode,
          CheckoutRequestID: checkoutRequestId,
          Timestamp: new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3),
          Password: Buffer.from(
            `${config.mpesa.shortcode}${config.mpesa.passkey}${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)}`
          ).toString('base64')
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw new Error('Failed to check payment status');
    }
  }
}

// In-memory storage (replace with database in production)
let orders = [];
let menuItems = [
  {
    id: "1",
    name: "Chicken Rice Bowl",
    description: "Grilled chicken with steamed rice and vegetables",
    price: 250,
    category: "Main Course",
    available: true
  },
  {
    id: "2",
    name: "Beef Stew & Ugali",
    description: "Traditional beef stew served with fresh ugali",
    price: 300,
    category: "Main Course",
    available: true
  }
];

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Admin authentication
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // In production, validate against database
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign(
      { id: 1, username, role: 'admin' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      token,
      user: { id: 1, username, role: 'admin' }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Verify token
app.post('/api/auth/verify', (req, res) => {
  const { token } = req.body;

  jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (err) {
      return res.json({ valid: false });
    }
    res.json({ valid: true, user: decoded });
  });
});

// Menu endpoints
app.get('/api/menu', (req, res) => {
  res.json(menuItems);
});

app.post('/api/menu', authenticateAdmin, (req, res) => {
  const { name, description, price, category, image } = req.body;
  
  const newItem = {
    id: Date.now().toString(),
    name,
    description,
    price: Number(price),
    category,
    available: true,
    image
  };

  menuItems.push(newItem);
  res.json(newItem);
});

app.put('/api/menu/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const itemIndex = menuItems.findIndex(item => item.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Menu item not found' });
  }

  menuItems[itemIndex] = { ...menuItems[itemIndex], ...updates };
  res.json(menuItems[itemIndex]);
});

app.delete('/api/menu/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  
  const itemIndex = menuItems.findIndex(item => item.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Menu item not found' });
  }

  menuItems.splice(itemIndex, 1);
  res.status(204).send();
});

// Orders endpoints
app.post('/api/orders', (req, res) => {
  const orderData = req.body;
  
  const newOrder = {
    id: `SM${Date.now().toString().slice(-6)}`,
    ...orderData,
    status: 'pending',
    paymentStatus: 'pending',
    orderTime: new Date().toISOString()
  };

  orders.push(newOrder);
  res.json(newOrder);
});

app.get('/api/orders', authenticateAdmin, (req, res) => {
  const { status, date, limit } = req.query;
  
  let filteredOrders = orders;

  if (status) {
    filteredOrders = filteredOrders.filter(order => order.status === status);
  }

  if (date) {
    const targetDate = new Date(date);
    filteredOrders = filteredOrders.filter(order => 
      new Date(order.orderTime).toDateString() === targetDate.toDateString()
    );
  }

  if (limit) {
    filteredOrders = filteredOrders.slice(0, parseInt(limit));
  }

  res.json(filteredOrders);
});

app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
});

app.put('/api/orders/:id/status', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.status = status;
  res.json(order);
});

// M-Pesa endpoints
app.post('/api/mpesa/stkpush', async (req, res) => {
  try {
    const { phoneNumber, amount, orderId, description } = req.body;

    const response = await MpesaService.initiateSTKPush(
      phoneNumber,
      amount,
      orderId,
      description
    );

    res.json(response);
  } catch (error) {
    console.error('STK Push error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/mpesa/status/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    
    const response = await MpesaService.checkPaymentStatus(checkoutRequestId);
    
    // Parse the response to determine status
    let status = 'pending';
    let transactionId = null;
    let amount = null;

    if (response.ResultCode === '0') {
      status = 'completed';
      // Extract transaction details from response
      if (response.CallbackMetadata && response.CallbackMetadata.Item) {
        response.CallbackMetadata.Item.forEach(item => {
          if (item.Name === 'TransactionID') {
            transactionId = item.Value;
          }
          if (item.Name === 'Amount') {
            amount = item.Value;
          }
        });
      }
    } else if (response.ResultCode !== '1032') { // 1032 is "Request timeout"
      status = 'failed';
    }

    res.json({
      status,
      transactionId,
      amount
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// M-Pesa callback endpoint
app.post('/api/mpesa/callback', (req, res) => {
  try {
    const callbackData = req.body;
    console.log('M-Pesa callback received:', callbackData);

    // Validate callback data
    if (!callbackData.Body || !callbackData.Body.stkCallback) {
      return res.status(400).json({ error: 'Invalid callback data' });
    }

    const { stkCallback } = callbackData.Body;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    // Find the order by MerchantRequestID
    const order = orders.find(o => o.mpesaRequestId === MerchantRequestID);
    
    if (order) {
      if (ResultCode === 0) {
        order.paymentStatus = 'completed';
        order.status = 'paid';
        
        // Extract transaction ID from callback metadata
        if (stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
          const transactionItem = stkCallback.CallbackMetadata.Item.find(
            item => item.Name === 'TransactionID'
          );
          if (transactionItem) {
            order.transactionId = transactionItem.Value;
          }
        }
      } else {
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
      }
    }

    // Respond to M-Pesa
    res.json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  } catch (error) {
    console.error('Callback processing error:', error);
    res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Failed to process callback'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`SmartMeal backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`M-Pesa Environment: ${config.mpesa.environment}`);
});

module.exports = app;

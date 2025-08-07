const express = require('express');
const { body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Import controllers
const MenuController = require('../controllers/MenuController');
const OrderController = require('../controllers/OrderController');
const MpesaController = require('../controllers/MpesaController');
const AuthController = require('../controllers/AuthController');

// Import middleware
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Apply rate limiting to all routes
router.use(limiter);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SmartMeal API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Authentication routes
router.post('/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], AuthController.login);

router.get('/auth/me', authMiddleware, AuthController.getProfile);

// Menu routes
router.get('/menu', MenuController.getMenuItems);
router.get('/menu/categories', MenuController.getMenuCategories);
router.get('/menu/stats', adminMiddleware, MenuController.getMenuStats);
router.get('/menu/:id', [
  param('id').isString().notEmpty()
], MenuController.getMenuItemById);

// Admin menu routes
router.post('/admin/menu', [
  adminMiddleware,
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('price').isFloat({ min: 0 }),
  body('category').optional().trim().isLength({ max: 50 }),
  body('image').optional().isURL()
], MenuController.createMenuItem);

router.put('/admin/menu/:id', [
  adminMiddleware,
  param('id').isString().notEmpty(),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('price').optional().isFloat({ min: 0 }),
  body('category').optional().trim().isLength({ max: 50 }),
  body('image').optional().isURL(),
  body('isAvailable').optional().isBoolean()
], MenuController.updateMenuItem);

router.delete('/admin/menu/:id', [
  adminMiddleware,
  param('id').isString().notEmpty()
], MenuController.deleteMenuItem);

router.patch('/admin/menu/:id/toggle', [
  adminMiddleware,
  param('id').isString().notEmpty()
], MenuController.toggleMenuItemAvailability);

// Order routes
router.post('/orders', [
  body('items').isArray({ min: 1 }),
  body('items.*.menuItemId').isString().notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('phoneNumber').matches(/^(\+254|254|0)?[17]\d{8}$/),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('userId').optional().isString(),
  body('customerName').optional().trim().isLength({ min: 2, max: 100 }),
  body('customerPhone').optional().matches(/^(\+254|254|0)?[17]\d{8}$/)
], OrderController.createOrder);

router.get('/orders', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']),
  query('paymentStatus').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('userId').optional().isString(),
  query('search').optional().trim()
], OrderController.getOrders);

router.get('/orders/:orderId', [
  param('orderId').isString().notEmpty()
], OrderController.getOrderById);

router.post('/orders/:orderId/payment', [
  param('orderId').isString().notEmpty()
], OrderController.initiatePayment);

// Admin order routes
router.put('/admin/orders/:orderId/status', [
  adminMiddleware,
  param('orderId').isString().notEmpty(),
  body('status').isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])
], OrderController.updateOrderStatus);

router.get('/admin/orders/stats', [
  adminMiddleware,
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], OrderController.getOrderStats);

// M-Pesa routes
router.post('/mpesa/callback', MpesaController.handleCallback);

router.get('/mpesa/payment/:orderId/status', [
  param('orderId').isString().notEmpty()
], MpesaController.checkPaymentStatus);

router.get('/mpesa/payment/:orderId/transaction', [
  param('orderId').isString().notEmpty()
], MpesaController.getPaymentTransaction);

router.get('/admin/mpesa/stats', [
  adminMiddleware,
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], MpesaController.getPaymentStats);

router.get('/admin/mpesa/config/validate', [
  adminMiddleware
], MpesaController.validateConfig);

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

module.exports = router;

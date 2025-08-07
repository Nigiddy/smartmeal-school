const { PrismaClient } = require('@prisma/client');
const mpesaService = require('../services/MpesaService');
const { generateOrderNumber } = require('../utils/orderUtils');

const prisma = new PrismaClient();

class OrderController {
  /**
   * Create a new order with multiple items
   */
  async createOrder(req, res) {
    const transaction = await prisma.$transaction(async (tx) => {
      try {
        const { items, phoneNumber, notes, userId, customerName, customerPhone } = req.body;

        // Validate input
        if (!items || !Array.isArray(items) || items.length === 0) {
          throw new Error('Order must contain at least one item');
        }

        if (!phoneNumber) {
          throw new Error('Phone number is required');
        }

        // For anonymous orders, customerName and customerPhone are required
        if (!userId && (!customerName || !customerPhone)) {
          throw new Error('Customer name and phone are required for anonymous orders');
        }

        // Calculate total amount and validate items
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
          const menuItem = await tx.menuItem.findUnique({
            where: { id: item.menuItemId }
          });

          if (!menuItem) {
            throw new Error(`Menu item with ID ${item.menuItemId} not found`);
          }

          if (!menuItem.isAvailable) {
            throw new Error(`Menu item "${menuItem.name}" is not available`);
          }

          if (item.quantity <= 0) {
            throw new Error(`Invalid quantity for ${menuItem.name}`);
          }

          const itemTotal = menuItem.price * item.quantity;
          totalAmount += itemTotal;

          orderItems.push({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: menuItem.price,
            totalPrice: itemTotal
          });
        }

        // Generate unique order number
        const orderNumber = await generateOrderNumber(tx);

        // Create order - handle both authenticated and anonymous orders
        const orderData = {
          orderNumber,
          totalAmount,
          phoneNumber,
          notes,
          status: 'PENDING',
          paymentStatus: 'PENDING'
        };

        // If userId is provided (authenticated order), use it
        if (userId) {
          orderData.userId = userId;
        } else {
          // Anonymous order - use customer details
          orderData.customerName = customerName;
          orderData.customerPhone = customerPhone;
        }

        const order = await tx.order.create({
          data: orderData
        });

        // Create order items
        const createdOrderItems = await Promise.all(
          orderItems.map(item =>
            tx.orderItem.create({
              data: {
                orderId: order.id,
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice
              }
            })
          )
        );

        // Get order with items for response
        const orderWithItems = await tx.order.findUnique({
          where: { id: order.id },
          include: {
            orderItems: {
              include: {
                menuItem: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        });

        return orderWithItems;
      } catch (error) {
        throw error;
      }
    });

    try {
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: transaction
      });
    } catch (error) {
      console.error('Order creation error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create order'
      });
    }
  }

  /**
   * Initiate M-Pesa payment for an order
   */
  async initiatePayment(req, res) {
    try {
      const { orderId } = req.params;

      // Find the order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              menuItem: true
            }
          }
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (order.paymentStatus === 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'Order has already been paid'
        });
      }

      if (order.paymentStatus === 'PROCESSING') {
        return res.status(400).json({
          success: false,
          message: 'Payment is already being processed'
        });
      }

      // Update order status to processing
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'PROCESSING' }
      });

      // Initiate STK push
      const stkResult = await mpesaService.initiateStkPush(
        order.phoneNumber,
        order.totalAmount,
        order.orderNumber,
        `Payment for order ${order.orderNumber}`
      );

      if (!stkResult.success) {
        // Revert order status if STK push failed
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'PENDING' }
        });

        return res.status(400).json({
          success: false,
          message: stkResult.error || 'Failed to initiate payment'
        });
      }

      // Update order with M-Pesa request details
      await prisma.order.update({
        where: { id: orderId },
        data: {
          mpesaRequestId: stkResult.data.MerchantRequestID,
          checkoutRequestId: stkResult.data.CheckoutRequestID
        }
      });

      // Create payment transaction record
      await prisma.paymentTransaction.create({
        data: {
          orderId: orderId,
          transactionId: stkResult.data.CheckoutRequestID, // Temporary ID
          amount: order.totalAmount,
          phoneNumber: order.phoneNumber,
          status: 'PROCESSING',
          mpesaRequestId: stkResult.data.MerchantRequestID,
          checkoutRequestId: stkResult.data.CheckoutRequestID
        }
      });

      res.json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          checkoutRequestId: stkResult.data.CheckoutRequestID,
          merchantRequestId: stkResult.data.MerchantRequestID,
          orderId: orderId,
          amount: order.totalAmount
        }
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate payment'
      });
    }
  }

  /**
   * Get all orders with filtering and pagination
   */
  async getOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        paymentStatus,
        startDate,
        endDate,
        userId,
        search
      } = req.query;

      const skip = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (status) where.status = status;
      if (paymentStatus) where.paymentStatus = paymentStatus;
      if (userId) where.userId = userId;
      if (search) {
        where.OR = [
          { orderNumber: { contains: search } },
          { phoneNumber: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } }
        ];
      }

      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            orderItems: {
              include: {
                menuItem: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: parseInt(skip),
          take: parseInt(limit)
        }),
        prisma.order.count({ where })
      ]);

      res.json({
        success: true,
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders'
      });
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(req, res) {
    try {
      const { orderId } = req.params;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              menuItem: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          paymentTransaction: true
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order'
      });
    }
  }

  /**
   * Update order status (admin only)
   */
  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order status'
        });
      }

      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          orderItems: {
            include: {
              menuItem: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order
      });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order status'
      });
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const where = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        todayOrders,
        todayRevenue
      ] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.count({ where: { ...where, status: 'PENDING' } }),
        prisma.order.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.order.aggregate({
          where: { ...where, paymentStatus: 'COMPLETED' },
          _sum: { totalAmount: true }
        }),
        prisma.order.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        prisma.order.aggregate({
          where: {
            ...where,
            paymentStatus: 'COMPLETED',
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          _sum: { totalAmount: true }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalOrders,
          pendingOrders,
          completedOrders,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          todayOrders,
          todayRevenue: todayRevenue._sum.totalAmount || 0
        }
      });
    } catch (error) {
      console.error('Get order stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order statistics'
      });
    }
  }
}

module.exports = new OrderController();

const { PrismaClient } = require('@prisma/client');
const mpesaService = require('../services/MpesaService');

const prisma = new PrismaClient();

class MpesaController {
  /**
   * Handle M-Pesa STK push callback
   */
  async handleCallback(req, res) {
    try {
      console.log('M-Pesa callback received:', JSON.stringify(req.body, null, 2));

      const callbackData = req.body;

      // Validate callback data structure
      if (!callbackData.Body || !callbackData.Body.stkCallback) {
        console.error('Invalid callback data structure');
        return res.status(400).json({
          ResultCode: 1,
          ResultDesc: 'Invalid callback data structure'
        });
      }

      // Process the callback data
      const result = mpesaService.processCallback(callbackData);
      console.log('Processed callback result:', result);

      // Find the order by merchant request ID
      const order = await prisma.order.findFirst({
        where: { mpesaRequestId: result.merchantRequestId },
        include: {
          paymentTransaction: true
        }
      });

      if (!order) {
        console.error('Order not found for merchant request ID:', result.merchantRequestId);
        return res.status(404).json({
          ResultCode: 1,
          ResultDesc: 'Order not found'
        });
      }

      // Update order and payment transaction in a transaction
      await prisma.$transaction(async (tx) => {
        // Update order status
        const orderUpdateData = {
          paymentStatus: result.success ? 'COMPLETED' : 'FAILED'
        };

        if (result.success && result.transactionId) {
          orderUpdateData.transactionId = result.transactionId;
        }

        await tx.order.update({
          where: { id: order.id },
          data: orderUpdateData
        });

        // Update or create payment transaction
        if (order.paymentTransaction) {
          await tx.paymentTransaction.update({
            where: { id: order.paymentTransaction.id },
            data: {
              status: result.success ? 'COMPLETED' : 'FAILED',
              resultCode: result.resultCode,
              resultDesc: result.resultDesc,
              callbackData: callbackData,
              ...(result.success && result.transactionId && {
                transactionId: result.transactionId
              })
            }
          });
        } else {
          // Create payment transaction if it doesn't exist
          await tx.paymentTransaction.create({
            data: {
              orderId: order.id,
              transactionId: result.transactionId || result.checkoutRequestId,
              amount: order.totalAmount,
              phoneNumber: order.phoneNumber,
              status: result.success ? 'COMPLETED' : 'FAILED',
              mpesaRequestId: result.merchantRequestId,
              checkoutRequestId: result.checkoutRequestId,
              resultCode: result.resultCode,
              resultDesc: result.resultDesc,
              callbackData: callbackData
            }
          });
        }

        // Log the payment result
        console.log(`Payment ${result.success ? 'completed' : 'failed'} for order ${order.orderNumber}:`, {
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          phoneNumber: order.phoneNumber,
          transactionId: result.transactionId,
          resultCode: result.resultCode,
          resultDesc: result.resultDesc
        });
      });

      // Return success response to M-Pesa
      res.json({
        ResultCode: 0,
        ResultDesc: 'Success'
      });
    } catch (error) {
      console.error('Error processing M-Pesa callback:', error);
      res.status(500).json({
        ResultCode: 1,
        ResultDesc: 'Failed to process callback'
      });
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          paymentTransaction: true
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // If payment is already completed or failed, return current status
      if (order.paymentStatus === 'COMPLETED' || order.paymentStatus === 'FAILED') {
        return res.json({
          success: true,
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentStatus: order.paymentStatus,
            transactionId: order.transactionId,
            amount: order.totalAmount,
            phoneNumber: order.phoneNumber,
            lastUpdated: order.updatedAt
          }
        });
      }

      // If payment is processing, check with M-Pesa API
      if (order.paymentStatus === 'PROCESSING' && order.checkoutRequestId) {
        const statusResult = await mpesaService.checkStkPushStatus(order.checkoutRequestId);
        
        if (statusResult.success) {
          const statusData = statusResult.data;
          
          // Update order status based on M-Pesa response
          if (statusData.ResultCode === 0) {
            await prisma.order.update({
              where: { id: orderId },
              data: { paymentStatus: 'COMPLETED' }
            });
          } else if (statusData.ResultCode !== 1032) { // 1032 is "Request timeout"
            await prisma.order.update({
              where: { id: orderId },
              data: { paymentStatus: 'FAILED' }
            });
          }
        }
      }

      // Return updated order status
      const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          paymentTransaction: true
        }
      });

      res.json({
        success: true,
        data: {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          paymentStatus: updatedOrder.paymentStatus,
          transactionId: updatedOrder.transactionId,
          amount: updatedOrder.totalAmount,
          phoneNumber: updatedOrder.phoneNumber,
          lastUpdated: updatedOrder.updatedAt
        }
      });
    } catch (error) {
      console.error('Check payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check payment status'
      });
    }
  }

  /**
   * Get payment transaction details
   */
  async getPaymentTransaction(req, res) {
    try {
      const { orderId } = req.params;

      const paymentTransaction = await prisma.paymentTransaction.findUnique({
        where: { orderId },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              phoneNumber: true,
              status: true,
              paymentStatus: true
            }
          }
        }
      });

      if (!paymentTransaction) {
        return res.status(404).json({
          success: false,
          message: 'Payment transaction not found'
        });
      }

      res.json({
        success: true,
        data: paymentTransaction
      });
    } catch (error) {
      console.error('Get payment transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment transaction'
      });
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const where = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [
        totalTransactions,
        completedTransactions,
        failedTransactions,
        totalAmount,
        averageAmount
      ] = await Promise.all([
        prisma.paymentTransaction.count({ where }),
        prisma.paymentTransaction.count({ 
          where: { ...where, status: 'COMPLETED' } 
        }),
        prisma.paymentTransaction.count({ 
          where: { ...where, status: 'FAILED' } 
        }),
        prisma.paymentTransaction.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.paymentTransaction.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _avg: { amount: true }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalTransactions,
          completedTransactions,
          failedTransactions,
          successRate: totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0,
          totalAmount: totalAmount._sum.amount || 0,
          averageAmount: averageAmount._avg.amount || 0
        }
      });
    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment statistics'
      });
    }
  }

  /**
   * Validate M-Pesa configuration
   */
  async validateConfig(req, res) {
    try {
      mpesaService.validateConfig();
      
      // Test access token generation
      const accessToken = await mpesaService.getAccessToken();
      
      res.json({
        success: true,
        message: 'M-Pesa configuration is valid',
        data: {
          environment: process.env.MPESA_ENVIRONMENT,
          shortcode: process.env.MPESA_SHORTCODE,
          accessToken: accessToken ? 'Valid' : 'Invalid'
        }
      });
    } catch (error) {
      console.error('M-Pesa config validation error:', error);
      res.status(400).json({
        success: false,
        message: 'M-Pesa configuration is invalid',
        error: error.message
      });
    }
  }
}

module.exports = new MpesaController();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Generate a unique order number
 * Format: ORD-YYYYMMDD-XXXX (e.g., ORD-20231201-0001)
 */
async function generateOrderNumber(transaction = null) {
  const today = new Date();
  const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ORD-${dateString}-`;
  
  try {
    // Get the count of orders for today
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const count = await (transaction || prisma).order.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });
    
    // Format the sequence number with leading zeros
    const sequence = (count + 1).toString().padStart(4, '0');
    return `${prefix}${sequence}`;
  } catch (error) {
    console.error('Error generating order number:', error);
    // Fallback: use timestamp
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${timestamp}`;
  }
}

/**
 * Calculate order total from items
 */
function calculateOrderTotal(items) {
  return items.reduce((total, item) => {
    return total + (item.unitPrice * item.quantity);
  }, 0);
}

/**
 * Validate order items
 */
function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  for (const item of items) {
    if (!item.menuItemId) {
      throw new Error('Menu item ID is required for each item');
    }
    
    if (!item.quantity || item.quantity <= 0) {
      throw new Error('Valid quantity is required for each item');
    }
  }

  return true;
}

/**
 * Format order for display
 */
function formatOrderForDisplay(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    phoneNumber: order.phoneNumber,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.orderItems?.map(item => ({
      id: item.id,
      menuItem: {
        id: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        image: item.menuItem.image
      },
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    })) || [],
    user: order.user ? {
      id: order.user.id,
      name: order.user.name,
      email: order.user.email,
      phone: order.user.phone
    } : null
  };
}

/**
 * Get order status display text
 */
function getOrderStatusText(status) {
  const statusMap = {
    'PENDING': 'Pending',
    'CONFIRMED': 'Confirmed',
    'PREPARING': 'Preparing',
    'READY': 'Ready for Pickup',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled'
  };
  
  return statusMap[status] || status;
}

/**
 * Get payment status display text
 */
function getPaymentStatusText(status) {
  const statusMap = {
    'PENDING': 'Pending',
    'PROCESSING': 'Processing',
    'COMPLETED': 'Completed',
    'FAILED': 'Failed',
    'CANCELLED': 'Cancelled'
  };
  
  return statusMap[status] || status;
}

/**
 * Check if order can be cancelled
 */
function canCancelOrder(order) {
  const cancellableStatuses = ['PENDING', 'CONFIRMED'];
  return cancellableStatuses.includes(order.status) && order.paymentStatus !== 'COMPLETED';
}

/**
 * Check if order can be updated
 */
function canUpdateOrder(order) {
  const updatableStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'];
  return updatableStatuses.includes(order.status);
}

/**
 * Generate order summary for receipt
 */
function generateOrderSummary(order) {
  const items = order.orderItems?.map(item => ({
    name: item.menuItem.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice
  })) || [];

  return {
    orderNumber: order.orderNumber,
    date: order.createdAt,
    items,
    subtotal: order.totalAmount,
    total: order.totalAmount,
    status: getOrderStatusText(order.status),
    paymentStatus: getPaymentStatusText(order.paymentStatus),
    phoneNumber: order.phoneNumber,
    transactionId: order.transactionId
  };
}

module.exports = {
  generateOrderNumber,
  calculateOrderTotal,
  validateOrderItems,
  formatOrderForDisplay,
  getOrderStatusText,
  getPaymentStatusText,
  canCancelOrder,
  canUpdateOrder,
  generateOrderSummary
};

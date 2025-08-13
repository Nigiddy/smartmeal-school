const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@smartmeal.com' },
      update: {},
      create: {
        email: 'admin@smartmeal.com',
        phone: '254700000000',
        name: 'System Administrator',
        role: 'ADMIN',
        password: hashedPassword,
        isActive: true
      }
    });

    console.log('✅ Admin user created:', adminUser.email);

    // Create menu categories
    const categories = [
      'Main Course',
      'Snacks',
      'Beverages',
      'Desserts',
      'Breakfast'
    ];

    // Create menu items
    const menuItems = [
      {
        name: 'Chicken Rice Bowl',
        description: 'Grilled chicken with steamed rice and fresh vegetables',
        price: 250.00,
        category: 'Main Course',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=400&fit=crop',
        isAvailable: true
      },
      {
        name: 'Beef Stew & Ugali',
        description: 'Traditional beef stew served with fresh ugali',
        price: 300.00,
        category: 'Main Course',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
        isAvailable: true
      },
      {
        name: 'Fish Fillet',
        description: 'Grilled tilapia with chips and garden salad',
        price: 280.00,
        category: 'Main Course',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
        isAvailable: true
      },
      {
        name: 'Vegetable Samosa',
        description: 'Crispy pastry filled with spiced vegetables',
        price: 50.00,
        category: 'Snacks',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=400&fit=crop',
        isAvailable: true
      },
      {
        name: 'Fresh Juice',
        description: 'Orange, mango, or passion fruit juice',
        price: 80.00,
        category: 'Beverages',
        image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop',
        isAvailable: true
      },
      {
        name: 'Chapati & Beans',
        description: 'Soft chapati served with stewed beans',
        price: 120.00,
        category: 'Breakfast',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
        isAvailable: true
      },
      {
        name: 'Mandazi',
        description: 'Sweet coconut bread, perfect with tea',
        price: 30.00,
        category: 'Snacks',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=400&fit=crop',
        isAvailable: true
      },
      {
        name: 'Chai Tea',
        description: 'Traditional Kenyan tea with milk and spices',
        price: 40.00,
        category: 'Beverages',
        image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop',
        isAvailable: true
      }
    ];

    // Create menu items
    for (const item of menuItems) {
      const menuItem = await prisma.menuItem.upsert({
        where: { name: item.name },
        update: {},
        create: item
      });
      console.log('✅ Menu item created:', menuItem.name);
    }

    // Create sample orders for testing
    const sampleOrders = [
      {
        orderNumber: 'SM001234',
        customerName: 'John Doe',
        customerPhone: '254711111111',
        totalAmount: 330.00,
        status: 'COMPLETED',
        paymentStatus: 'COMPLETED',
        phoneNumber: '254711111111',
        transactionId: 'MPESA123456789',
        notes: 'Extra spicy please'
      },
      {
        orderNumber: 'SM001235',
        customerName: 'Jane Smith',
        customerPhone: '254722222222',
        totalAmount: 600.00,
        status: 'PREPARING',
        paymentStatus: 'COMPLETED',
        phoneNumber: '254722222222',
        transactionId: 'MPESA987654321',
        notes: 'No onions'
      },
      {
        orderNumber: 'SM001236',
        customerName: 'Mike Johnson',
        customerPhone: '254733333333',
        totalAmount: 310.00,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        phoneNumber: '254733333333'
      }
    ];

    // Create sample orders
    for (const orderData of sampleOrders) {
      const order = await prisma.order.create({
        data: orderData
      });

      // Add order items based on order
      if (order.orderNumber === 'SM001234') {
        // John's order: Chicken Rice Bowl + Fresh Juice
        await prisma.orderItem.createMany({
          data: [
            {
              orderId: order.id,
              menuItemId: (await prisma.menuItem.findFirst({ where: { name: 'Chicken Rice Bowl' } })).id,
              quantity: 1,
              unitPrice: 250.00,
              totalPrice: 250.00
            },
            {
              orderId: order.id,
              menuItemId: (await prisma.menuItem.findFirst({ where: { name: 'Fresh Juice' } })).id,
              quantity: 1,
              unitPrice: 80.00,
              totalPrice: 80.00
            }
          ]
        });
      } else if (order.orderNumber === 'SM001235') {
        // Jane's order: Beef Stew & Ugali × 2
        await prisma.orderItem.createMany({
          data: [
            {
              orderId: order.id,
              menuItemId: (await prisma.menuItem.findFirst({ where: { name: 'Beef Stew & Ugali' } })).id,
              quantity: 2,
              unitPrice: 300.00,
              totalPrice: 600.00
            }
          ]
        });
      } else if (order.orderNumber === 'SM001236') {
        // Mike's order: Vegetable Samosa × 3 + Fresh Juice × 2
        await prisma.orderItem.createMany({
          data: [
            {
              orderId: order.id,
              menuItemId: (await prisma.menuItem.findFirst({ where: { name: 'Vegetable Samosa' } })).id,
              quantity: 3,
              unitPrice: 50.00,
              totalPrice: 150.00
            },
            {
              orderId: order.id,
              menuItemId: (await prisma.menuItem.findFirst({ where: { name: 'Fresh Juice' } })).id,
              quantity: 2,
              unitPrice: 80.00,
              totalPrice: 160.00
            }
          ]
        });
      }

      console.log('✅ Sample order created:', order.orderNumber);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample Data Created:');
    console.log(`- Admin User: ${adminUser.email}`);
    console.log(`- Menu Items: ${menuItems.length} items`);
    console.log(`- Sample Orders: ${sampleOrders.length} orders`);
    console.log('\n🔑 Default Admin Credentials:');
    console.log('Email: admin@smartmeal.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  });

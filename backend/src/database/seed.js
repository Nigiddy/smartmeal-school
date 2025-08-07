const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@smartmeal.com' },
      update: {},
      create: {
        name: 'System Administrator',
        email: 'admin@smartmeal.com',
        phone: '254700000000',
        password: adminPassword,
        role: 'ADMIN',
        isActive: true
      }
    });

    console.log('✅ Admin user created:', admin.email);

    // Create sample menu items
    const menuItems = [
      {
        name: 'Chicken Biryani',
        description: 'Aromatic rice dish with tender chicken, spices, and herbs',
        price: 450.00,
        category: 'Main Course',
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4a8?w=400',
        isAvailable: true
      },
      {
        name: 'Beef Burger',
        description: 'Juicy beef patty with fresh vegetables and special sauce',
        price: 350.00,
        category: 'Fast Food',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        isAvailable: true
      },
      {
        name: 'Vegetable Pizza',
        description: 'Fresh vegetables on crispy crust with melted cheese',
        price: 400.00,
        category: 'Fast Food',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
        isAvailable: true
      },
      {
        name: 'Grilled Fish',
        description: 'Fresh fish grilled to perfection with lemon and herbs',
        price: 550.00,
        category: 'Main Course',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
        isAvailable: true
      },
      {
        name: 'Chicken Wings',
        description: 'Crispy chicken wings with your choice of sauce',
        price: 300.00,
        category: 'Appetizer',
        image: 'https://images.unsplash.com/photo-1567620832904-9bbf4c8c0c8c?w=400',
        isAvailable: true
      },
      {
        name: 'Caesar Salad',
        description: 'Fresh lettuce, croutons, parmesan cheese with caesar dressing',
        price: 250.00,
        category: 'Salad',
        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
        isAvailable: true
      },
      {
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake with chocolate ganache',
        price: 200.00,
        category: 'Dessert',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
        isAvailable: true
      },
      {
        name: 'French Fries',
        description: 'Crispy golden fries served with ketchup',
        price: 150.00,
        category: 'Side Dish',
        image: 'https://images.unsplash.com/photo-1573089026218-0c0b0b0b0b0b?w=400',
        isAvailable: true
      },
      {
        name: 'Milk Shake',
        description: 'Creamy vanilla milkshake with whipped cream',
        price: 180.00,
        category: 'Beverage',
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400',
        isAvailable: true
      },
      {
        name: 'Coffee',
        description: 'Freshly brewed coffee with cream and sugar',
        price: 120.00,
        category: 'Beverage',
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
        isAvailable: true
      }
    ];

    // Create menu items
    for (const item of menuItems) {
      await prisma.menuItem.upsert({
        where: { name: item.name },
        update: {
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          isAvailable: item.isAvailable
        },
        create: item
      });
    }

    console.log('✅ Menu items created successfully');

    // Create sample staff user
    const staffPassword = await bcrypt.hash('staff123', 12);
    
    const staff = await prisma.user.upsert({
      where: { email: 'staff@smartmeal.com' },
      update: {},
      create: {
        name: 'Jane Staff',
        email: 'staff@smartmeal.com',
        phone: '254722222222',
        password: staffPassword,
        role: 'STAFF',
        isActive: true
      }
    });

    console.log('✅ Staff user created:', staff.email);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('👨‍💼 Admin: admin@smartmeal.com / admin123');
    console.log('👩‍💼 Staff: staff@smartmeal.com / staff123');
    console.log('\n💡 Note: Students can order without logging in!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });

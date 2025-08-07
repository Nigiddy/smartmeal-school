const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrate() {
  console.log('🔄 Starting database migration...');

  try {
    // Step 1: Add new columns to Order table
    console.log('📝 Adding customerName and customerPhone columns to Order table...');
    
    // Note: This would typically be done via Prisma migrations
    // For now, we'll handle it in the schema push
    
    // Step 2: Update existing orders to have customer details if they don't
    console.log('🔄 Updating existing orders with customer details...');
    
    const ordersWithoutCustomerDetails = await prisma.order.findMany({
      where: {
        OR: [
          { customerName: null },
          { customerPhone: null }
        ]
      },
      include: {
        user: true
      }
    });

    for (const order of ordersWithoutCustomerDetails) {
      const updateData = {};
      
      if (!order.customerName && order.user) {
        updateData.customerName = order.user.name;
      }
      
      if (!order.customerPhone && order.user) {
        updateData.customerPhone = order.user.phone;
      }
      
      if (Object.keys(updateData).length > 0) {
        await prisma.order.update({
          where: { id: order.id },
          data: updateData
        });
        console.log(`✅ Updated order ${order.orderNumber}`);
      }
    }

    // Step 3: Remove STUDENT users (optional - you might want to keep them for data integrity)
    console.log('🗑️ Removing STUDENT users...');
    
    const studentUsers = await prisma.user.findMany({
      where: { role: 'STUDENT' }
    });

    if (studentUsers.length > 0) {
      console.log(`Found ${studentUsers.length} student users to remove`);
      
      for (const student of studentUsers) {
        // First, update any orders by this student to be anonymous
        await prisma.order.updateMany({
          where: { userId: student.id },
          data: {
            userId: null,
            customerName: student.name,
            customerPhone: student.phone
          }
        });
        
        // Then delete the student user
        await prisma.user.delete({
          where: { id: student.id }
        });
        
        console.log(`✅ Removed student user: ${student.email}`);
      }
    } else {
      console.log('✅ No student users found to remove');
    }

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate()
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate };

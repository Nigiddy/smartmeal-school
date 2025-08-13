# SmartMeal Backend Setup Guide

This guide will help you set up the SmartMeal backend with MySQL database and M-Pesa integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MySQL 8.0+ installed and running
- M-Pesa developer account (for payment integration)

### 1. Database Setup

#### Create MySQL Database
```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE smartmeal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional but recommended)
CREATE USER 'smartmeal_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON smartmeal_db.* TO 'smartmeal_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

#### Test Database Connection
```bash
mysql -u smartmeal_user -p smartmeal_db
```

### 2. Environment Configuration

#### Create .env file
```bash
cd backend
cp env.example .env
```

#### Update .env with your values
```env
# Database Configuration
DATABASE_URL="mysql://smartmeal_user:your_secure_password@localhost:3306/smartmeal_db"

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h

# M-Pesa Configuration (Get these from Safaricom Developer Portal)
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_PASSKEY=your_passkey_here
MPESA_SHORTCODE=your_shortcode_here
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback

# Security Configuration
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Admin Default Account
ADMIN_EMAIL=admin@smartmeal.com
ADMIN_PASSWORD=admin123
ADMIN_PHONE=254700000000
ADMIN_NAME=System Administrator
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Database Setup

#### Generate Prisma Client
```bash
npx prisma generate
```

#### Run Database Migrations
```bash
npx prisma db push
```

#### Seed Database with Sample Data
```bash
npm run db:seed
```

### 5. Start the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

## 🔧 M-Pesa Integration Setup

### 1. Get M-Pesa Developer Account
1. Visit [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create an account and verify your email
3. Create a new app for SmartMeal

### 2. Get API Credentials
- **Consumer Key**: Your app's consumer key
- **Consumer Secret**: Your app's consumer secret  
- **Passkey**: Your app's passkey
- **Shortcode**: Your business shortcode (or test shortcode for sandbox)

### 3. Configure Callback URL
- For development: `http://localhost:3001/api/mpesa/callback`
- For production: `https://your-domain.com/api/mpesa/callback`

### 4. Test M-Pesa Integration
1. Use sandbox environment for testing
2. Test with sandbox phone numbers
3. Verify callback handling

## 📊 Database Schema

The system uses the following main tables:

### Users
- Admin and staff accounts
- Authentication and authorization

### Menu Items
- Food items with categories
- Pricing and availability

### Orders
- Customer orders with status tracking
- Payment information

### Order Items
- Individual items in each order
- Quantities and pricing

### Payment Transactions
- M-Pesa payment records
- Transaction status and callback data

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get user profile
- `POST /api/auth/logout` - Logout

### Menu Management
- `GET /api/menu` - Get all menu items
- `GET /api/menu/categories` - Get menu categories
- `POST /api/admin/menu` - Create menu item (admin)
- `PUT /api/admin/menu/:id` - Update menu item (admin)
- `DELETE /api/admin/menu/:id` - Delete menu item (admin)

### Order Management
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/status` - Update order status (admin)

### M-Pesa Integration
- `POST /api/mpesa/stk-push` - Initiate payment
- `GET /api/mpesa/status/:id` - Check payment status
- `POST /api/mpesa/callback` - M-Pesa callback handler

## 🔒 Security Features

- JWT authentication for admin routes
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Helmet security headers

## 📝 Testing

### Test Admin Login
```bash
# Default credentials (after seeding)
Email: admin@smartmeal.com
Password: admin123
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3001/api/health

# Get menu items
curl http://localhost:3001/api/menu

# Admin login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartmeal.com","password":"admin123"}'
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed
- Verify MySQL is running
- Check database credentials in .env
- Ensure database exists

#### M-Pesa Integration Issues
- Verify API credentials
- Check callback URL configuration
- Ensure proper environment (sandbox/production)

#### JWT Token Issues
- Check JWT_SECRET in .env
- Verify token expiration settings
- Clear browser localStorage if needed

### Logs
Check server logs for detailed error information:
```bash
# Development logs
npm run dev

# Production logs
npm start
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [M-Pesa API Documentation](https://developer.safaricom.co.ke/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/docs/)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs for error details
3. Verify all environment variables are set correctly
4. Ensure database and dependencies are properly installed

## 🎯 Next Steps

After successful setup:
1. Test all API endpoints
2. Configure M-Pesa production credentials
3. Set up proper SSL certificates for production
4. Configure monitoring and logging
5. Set up backup and recovery procedures

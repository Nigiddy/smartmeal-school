# SmartMeal Backend API

A robust Node.js backend for the SmartMeal food ordering system with M-Pesa integration, built with Express.js, MySQL, and Prisma ORM.

## 🚀 Features

- **Menu Management**: CRUD operations for menu items with categories and availability
- **Order Management**: Create orders with multiple items, track status, and manage payments
- **M-Pesa Integration**: STK push payments with callback handling and status verification
- **User Authentication**: JWT-based authentication for admin/staff access only
- **Admin Dashboard**: Comprehensive admin interface for managing orders and menu
- **Concurrency Handling**: Database transactions for safe concurrent operations
- **Security**: Rate limiting, input validation, CORS, and security headers

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **Payment**: Safaricom M-Pesa Daraja API
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Logging**: Morgan, Winston

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- M-Pesa Daraja API credentials

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy the environment example file and configure your variables:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/smartmeal_db"

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# M-Pesa Configuration
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
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with sample data
npm run db:seed
```

### 4. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get user profile

### Menu Management
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get menu item by ID
- `GET /api/menu/categories` - Get menu categories
- `POST /api/admin/menu` - Create menu item (Admin)
- `PUT /api/admin/menu/:id` - Update menu item (Admin)
- `DELETE /api/admin/menu/:id` - Delete menu item (Admin)
- `PATCH /api/admin/menu/:id/toggle` - Toggle availability (Admin)

### Order Management
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get orders with filtering
- `GET /api/orders/:orderId` - Get order by ID
- `POST /api/orders/:orderId/payment` - Initiate payment
- `PUT /api/admin/orders/:orderId/status` - Update order status (Admin)
- `GET /api/admin/orders/stats` - Get order statistics (Admin)

### M-Pesa Integration
- `POST /api/mpesa/callback` - M-Pesa payment callback
- `GET /api/mpesa/payment/:orderId/status` - Check payment status
- `GET /api/mpesa/payment/:orderId/transaction` - Get payment transaction
- `GET /api/admin/mpesa/stats` - Get payment statistics (Admin)
- `GET /api/admin/mpesa/config/validate` - Validate M-Pesa config (Admin)

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### User Roles
- **STUDENT**: Can browse menu, place orders, make payments
- **STAFF**: Can manage orders, view statistics
- **ADMIN**: Full access to all features

## 💳 M-Pesa Integration

### Setup
1. Get your Daraja API credentials from Safaricom
2. Configure the environment variables
3. Set up your callback URL (must be publicly accessible)
4. Test with sandbox environment first

### Payment Flow
1. User places order → Order created with PENDING status
2. Initiate STK push → Order status changes to PROCESSING
3. User receives M-Pesa prompt → Enters PIN
4. M-Pesa sends callback → Order status updated to COMPLETED/FAILED
5. Frontend polls for status → Shows payment result

## 🗄 Database Schema

### Users
- `id` (String, Primary Key)
- `email` (String, Unique)
- `phone` (String, Unique)
- `name` (String)
- `role` (Enum: ADMIN, STAFF, STUDENT)
- `password` (String, Hashed)
- `isActive` (Boolean)

### Menu Items
- `id` (String, Primary Key)
- `name` (String)
- `description` (String, Optional)
- `price` (Decimal)
- `image` (String, Optional)
- `category` (String, Optional)
- `isAvailable` (Boolean)

### Orders
- `id` (String, Primary Key)
- `orderNumber` (String, Unique)
- `userId` (String, Foreign Key)
- `totalAmount` (Decimal)
- `status` (Enum: PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED)
- `paymentStatus` (Enum: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED)
- `phoneNumber` (String)
- `transactionId` (String, Optional)
- `mpesaRequestId` (String, Optional)
- `checkoutRequestId` (String, Optional)

### Order Items
- `id` (String, Primary Key)
- `orderId` (String, Foreign Key)
- `menuItemId` (String, Foreign Key)
- `quantity` (Integer)
- `unitPrice` (Decimal)
- `totalPrice` (Decimal)

### Payment Transactions
- `id` (String, Primary Key)
- `orderId` (String, Foreign Key, Unique)
- `transactionId` (String, Unique)
- `amount` (Decimal)
- `phoneNumber` (String)
- `status` (Enum: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED)
- `mpesaRequestId` (String, Optional)
- `checkoutRequestId` (String, Optional)
- `resultCode` (Integer, Optional)
- `resultDesc` (String, Optional)
- `callbackData` (JSON, Optional)

## 🧪 Testing

### Authentication Model
The system uses a simplified authentication model:

- **Anonymous Orders**: Students can place orders without creating accounts or logging in
- **Admin/Staff Access**: Only admin and staff users need to authenticate to access the dashboard

### Default Users
After seeding the database, you can use these test accounts:

- **Admin**: `admin@smartmeal.com` / `admin123`
- **Staff**: `staff@smartmeal.com` / `staff123`

### API Testing
Use tools like Postman or curl to test the endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartmeal.com","password":"admin123"}'

# Get menu items
curl http://localhost:3001/api/menu
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── AuthController.js
│   │   ├── MenuController.js
│   │   ├── OrderController.js
│   │   └── MpesaController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── admin.js
│   ├── routes/
│   │   └── index.js
│   ├── services/
│   │   └── MpesaService.js
│   ├── utils/
│   │   └── orderUtils.js
│   ├── database/
│   │   └── seed.js
│   └── server.js
├── prisma/
│   └── schema.prisma
├── uploads/
├── package.json
├── env.example
└── README.md
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secret
- [ ] Configure production database
- [ ] Set up M-Pesa production credentials
- [ ] Configure HTTPS
- [ ] Set up proper CORS origins
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Configure backup strategy

### Environment Variables
Make sure all required environment variables are set in production:

```env
DATABASE_URL=mysql://user:pass@host:port/database
JWT_SECRET=your_very_secure_jwt_secret
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_PASSKEY=your_production_passkey
MPESA_SHORTCODE=your_production_shortcode
MPESA_ENVIRONMENT=production
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
```

## 🔒 Security

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: All inputs validated with express-validator
- **SQL Injection**: Prevented by Prisma ORM
- **XSS Protection**: Helmet middleware
- **CORS**: Configured for specific origins
- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Security**: Secure tokens with expiration

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**SmartMeal Backend** - Built with ❤️ for efficient food ordering

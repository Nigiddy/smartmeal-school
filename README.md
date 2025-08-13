# 🍽️ SmartMeal - Food Ordering System for Institutions

A modern, mobile-first food ordering system designed specifically for schools and institutions, featuring M-Pesa payment integration and real-time order management.

## ✨ Features

### 🎯 Core User Features
- **Anonymous Ordering**: Students can order meals without creating accounts
- **M-Pesa Integration**: Seamless mobile money payments via STK push
- **Real-time Updates**: Live order status tracking and notifications
- **Digital Receipts**: Instant order confirmation and receipts
- **Mobile Optimized**: Responsive design for all devices

### 👨‍💼 Admin & Staff Features
- **Dashboard**: Comprehensive overview of all orders and metrics
- **Order Management**: Real-time status updates and workflow management
- **Menu Management**: Add, edit, and manage food items with categories
- **User Management**: Admin and staff account management
- **Analytics**: Sales reports and performance insights

### 🛡️ Technical Features
- **Modern Stack**: React 18, TypeScript, Tailwind CSS
- **Real-time API**: Express.js backend with Prisma ORM
- **Secure**: JWT authentication, rate limiting, input validation
- **Scalable**: MySQL database with proper indexing
- **Production Ready**: Environment configuration and deployment setup

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- M-Pesa developer account

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/smartmeal.git
cd smartmeal
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your database and M-Pesa credentials

# Set up database
npx prisma generate
npx prisma db push
npm run db:seed

# Start backend server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Admin Dashboard**: http://localhost:5173/admin/login

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_MPESA_ENVIRONMENT=sandbox
```

#### Backend (.env)
```env
DATABASE_URL="mysql://user:password@localhost:3306/smartmeal_db"
JWT_SECRET=your_jwt_secret_here
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=your_shortcode
```

### Database Setup
```sql
CREATE DATABASE smartmeal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'smartmeal_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON smartmeal_db.* TO 'smartmeal_user'@'localhost';
FLUSH PRIVILEGES;
```

## 📱 User Flow

### Student Ordering Process
1. **Browse Menu**: View available meals with categories and pricing
2. **Add to Cart**: Select items and quantities
3. **Order Details**: Provide name, phone, and special instructions
4. **Payment**: Complete payment via M-Pesa STK push
5. **Confirmation**: Receive order confirmation and tracking

### Admin Management Process
1. **Login**: Access admin dashboard with credentials
2. **Monitor Orders**: View real-time order status and updates
3. **Manage Menu**: Add, edit, and control food item availability
4. **Track Performance**: Monitor sales, revenue, and order metrics

## 🏗️ Architecture

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development and better IDE support
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **shadcn/ui**: High-quality, accessible UI components
- **React Router**: Client-side routing and navigation
- **React Query**: Server state management and caching

### Backend
- **Express.js**: Fast, unopinionated web framework
- **Prisma ORM**: Type-safe database client and migrations
- **MySQL**: Reliable relational database
- **JWT**: Secure authentication and authorization
- **M-Pesa API**: Mobile money payment integration
- **Rate Limiting**: Protection against abuse and DDoS

### Database Schema
```
users (admin/staff accounts)
├── id, email, phone, name, role, password
├── orders (relationship)

menu_items (food items)
├── id, name, description, price, category, image, isAvailable
├── order_items (relationship)

orders (customer orders)
├── id, orderNumber, customerName, customerPhone, totalAmount
├── status, paymentStatus, phoneNumber, transactionId
├── order_items (relationship)

order_items (order line items)
├── id, orderId, menuItemId, quantity, unitPrice, totalPrice
├── menu_item (relationship)

payment_transactions (M-Pesa records)
├── id, orderId, transactionId, amount, phoneNumber, status
├── mpesaRequestId, checkoutRequestId, resultCode, resultDesc
```

## 🔌 API Endpoints

### Public Endpoints
- `GET /api/menu` - Get all menu items
- `GET /api/menu/categories` - Get menu categories
- `POST /api/orders` - Create new order
- `POST /api/mpesa/stk-push` - Initiate M-Pesa payment

### Protected Endpoints (Admin)
- `POST /api/auth/login` - Admin authentication
- `GET /api/orders` - Get all orders
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/admin/menu` - Create menu item
- `PUT /api/admin/menu/:id` - Update menu item
- `DELETE /api/admin/menu/:id` - Delete menu item

## 🧪 Testing

### Default Test Accounts
After seeding the database:
- **Admin**: `admin@smartmeal.com` / `admin123`

### API Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Get menu
curl http://localhost:3001/api/menu

# Admin login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartmeal.com","password":"admin123"}'
```

## 🚀 Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to your hosting service (Vercel, Netlify, etc.)
```

### Backend Deployment
```bash
# Set production environment
NODE_ENV=production

# Use PM2 for process management
npm install -g pm2
pm2 start src/server.js --name smartmeal-backend
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up M-Pesa production credentials
- [ ] Configure SSL certificates
- [ ] Set up monitoring and logging
- [ ] Configure backup procedures

## 🚨 Troubleshooting

### Common Issues

#### Frontend Not Loading
- Check if backend is running on port 3001
- Verify API base URL in environment variables
- Check browser console for errors

#### Backend Connection Issues
- Verify MySQL service is running
- Check database credentials in .env
- Ensure database exists and is accessible

#### M-Pesa Integration Problems
- Verify API credentials are correct
- Check callback URL configuration
- Test with sandbox environment first

### Debug Mode
```bash
# Frontend debug
npm run dev

# Backend debug
npm run dev

# Database inspection
npx prisma studio
```

## 📚 Documentation

- [Backend Setup Guide](backend/SETUP_GUIDE.md)
- [API Documentation](backend/README.md)
- [Database Schema](backend/prisma/schema.prisma)
- [Frontend Components](src/components/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check the docs folder and setup guides
- **Community**: Join our discussions and Q&A

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core ordering system
- ✅ M-Pesa integration
- ✅ Admin dashboard
- ✅ Basic menu management

### Phase 2 (Next)
- 🔄 Inventory tracking
- 🔄 Advanced analytics
- 🔄 Push notifications
- 🔄 Offline support

### Phase 3 (Future)
- 📋 Multi-location support
- 📋 Advanced reporting
- 📋 Customer loyalty program
- 📋 Mobile app

---

**Built with ❤️ for educational institutions**

*SmartMeal - Making school meals accessible and convenient*

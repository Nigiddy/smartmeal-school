# SmartMeal - M-Pesa Food Ordering System

A modern, mobile-first food ordering system designed for educational institutions in Kenya, featuring secure M-Pesa payment integration.

## 🚀 Features

- **Mobile-First Design** - Optimized for smartphone users
- **M-Pesa Integration** - Secure STK Push payments
- **Real-time Order Tracking** - Live order status updates
- **Admin Dashboard** - Comprehensive order and menu management
- **Digital Receipts** - Instant payment confirmations
- **Responsive UI** - Works on all devices

<<<<<<< Updated upstream
On the backend I'm using Node.js
Database: MySQL
=======
## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **shadcn/ui** for modern UI components
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** for form handling

### Backend Requirements
- **Node.js** with Express.js
- **MongoDB/PostgreSQL** for data persistence
- **JWT** for authentication
- **M-Pesa API** integration
- **WebSocket** for real-time updates

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/            # shadcn/ui components
│   └── MobileHeader.tsx
├── hooks/              # Custom React hooks
│   ├── use-mobile.tsx
│   ├── use-toast.ts
│   └── use-mpesa-payment.ts  # M-Pesa payment logic
├── lib/                # Utility libraries
│   ├── api.ts         # API service layer
│   └── utils.ts       # General utilities
├── pages/              # Application pages
│   ├── Index.tsx      # Landing page
│   ├── StudentMenu.tsx # Menu browsing
│   ├── OrderForm.tsx  # Order details
│   ├── Payment.tsx    # M-Pesa payment
│   ├── Confirmation.tsx # Order confirmation
│   ├── AdminLogin.tsx # Admin authentication
│   ├── AdminDashboard.tsx # Admin management
│   └── NotFound.tsx   # 404 page
└── App.tsx            # Main application component
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- M-Pesa Developer Account

### 1. Clone and Install
```bash
git clone <repository-url>
cd smartmeal
npm install
```

### 2. Environment Configuration
Create a `.env` file based on `env.example`:

```bash
# M-Pesa Configuration
VITE_MPESA_CONSUMER_KEY=your_consumer_key_here
VITE_MPESA_CONSUMER_SECRET=your_consumer_secret_here
VITE_MPESA_PASSKEY=your_passkey_here
VITE_MPESA_SHORTCODE=your_shortcode_here
VITE_MPESA_ENVIRONMENT=sandbox

# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_API_TIMEOUT=30000

# Application Configuration
VITE_APP_NAME=SmartMeal
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development
```

### 3. M-Pesa Setup
1. Register at [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create an app and get your credentials
3. Configure your callback URLs
4. Test with sandbox environment first

### 4. Development
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

## 🔐 Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use different credentials for development and production
- Rotate API keys regularly

### M-Pesa Security
- Validate all callback data
- Implement proper error handling
- Use HTTPS in production
- Store sensitive data securely

### Frontend Security
- Validate all user inputs
- Implement proper CORS policies
- Use secure HTTP headers
- Sanitize data before display

## 📱 M-Pesa Integration

### Payment Flow
1. **Initiate Payment** - Send STK Push request
2. **User Confirmation** - Customer enters PIN
3. **Callback Processing** - Handle M-Pesa response
4. **Status Verification** - Confirm payment success
5. **Order Completion** - Update order status

### Error Handling
- Network timeouts
- Invalid phone numbers
- Insufficient funds
- User cancellation
- System errors

## 🗄️ Database Schema

### Orders Collection
```javascript
{
  id: String,
  customer: {
    name: String,
    studentId: String,
    class: String,
    phone: String,
    notes: String
  },
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number
  }],
  total: Number,
  status: String, // pending, paid, preparing, ready, completed, cancelled
  paymentMethod: String, // M-Pesa, Cash
  paymentStatus: String, // pending, completed, failed
  orderTime: Date,
  mpesaRequestId: String,
  mpesaCheckoutId: String,
  transactionId: String
}
```

### Menu Items Collection
```javascript
{
  id: String,
  name: String,
  description: String,
  price: Number,
  category: String,
  available: Boolean,
  image: String
}
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Heroku)
```bash
# Set environment variables
# Deploy Node.js application
```

## 📊 Monitoring & Analytics

### Key Metrics
- Order completion rate
- Payment success rate
- Average order value
- Peak ordering times
- Popular menu items

### Error Tracking
- Payment failures
- Network timeouts
- Invalid inputs
- System errors

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add JSDoc comments for complex functions

### Testing
- Unit tests for utility functions
- Integration tests for API calls
- E2E tests for payment flow
- Manual testing for M-Pesa integration

### Performance
- Lazy load components
- Optimize images
- Minimize bundle size
- Use React.memo for expensive components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 🔄 Changelog

### v1.0.0
- Initial release
- M-Pesa integration
- Admin dashboard
- Mobile-first design
- Real-time order tracking
>>>>>>> Stashed changes

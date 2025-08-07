# SmartMeal Backend Setup Guide

This guide will walk you through setting up the SmartMeal backend with MySQL, Prisma ORM, and M-Pesa integration.

## 🚀 Quick Setup Steps

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Database Setup

#### 2.1 Install MySQL
- **Windows**: Download and install MySQL from https://dev.mysql.com/downloads/
- **macOS**: `brew install mysql`
- **Linux**: `sudo apt install mysql-server`

#### 2.2 Create Database
```sql
CREATE DATABASE smartmeal_db;
CREATE USER 'smartmeal_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON smartmeal_db.* TO 'smartmeal_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 2.3 Configure Environment
```bash
cp env.example .env
```

Edit `.env` with your database credentials:
```env
DATABASE_URL="mysql://smartmeal_user:your_password@localhost:3306/smartmeal_db"
```

### Step 3: Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### Step 4: M-Pesa Setup

#### 4.1 Get Daraja API Credentials
1. Visit https://developer.safaricom.co.ke/
2. Create an account and log in
3. Create a new app for STK Push
4. Note down your credentials:
   - Consumer Key
   - Consumer Secret
   - Passkey
   - Shortcode

#### 4.2 Configure M-Pesa Environment Variables
Edit your `.env` file:
```env
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_PASSKEY=your_passkey_here
MPESA_SHORTCODE=your_shortcode_here
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
```

**Note**: For development, you can use ngrok to expose your local server:
```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3001

# Use the ngrok URL as your callback URL
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/mpesa/callback
```

### Step 5: Start the Server

```bash
# Development mode
npm run dev

# Or production mode
npm start
```

The server will start on `http://localhost:3001`

## 🔐 Authentication Model

The SmartMeal system uses a simplified authentication approach:

### For Students (Anonymous Orders)
- **No registration required**: Students can place orders without creating accounts
- **No login needed**: Orders are created with customer name and phone number
- **Direct payment**: M-Pesa STK push works without authentication

### For Admin/Staff
- **Login required**: Admin and staff must authenticate to access the dashboard
- **Role-based access**: Different permissions for admin vs staff
- **JWT tokens**: Secure session management

### Default Test Accounts
After running `npm run db:seed`, you can use:
- **Admin**: `admin@smartmeal.com` / `admin123`
- **Staff**: `staff@smartmeal.com` / `staff123`

## 🧪 Testing the Setup

### 1. Health Check
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "SmartMeal API is running",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "environment": "development"
}
```

### 2. Test Authentication
```bash
# Login with admin account
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@smartmeal.com",
    "password": "admin123"
  }'
```

### 3. Test Menu API
```bash
# Get all menu items
curl http://localhost:3001/api/menu

# Get menu categories
curl http://localhost:3001/api/menu/categories
```

### 4. Test Order Creation
```bash
# Create an order (replace TOKEN with your JWT token)
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "items": [
      {
        "menuItemId": "menu_item_id_here",
        "quantity": 2
      }
    ],
    "phoneNumber": "254700000000",
    "notes": "Extra spicy please"
  }'
```

## 🔧 Development Workflow

### Database Management
```bash
# View database in Prisma Studio
npm run db:studio

# Reset database
npm run db:push --force-reset

# Seed database
npm run db:seed
```

### API Testing with Postman
1. Import the collection from `postman_collection.json` (if available)
2. Set the base URL to `http://localhost:3001/api`
3. Use the authentication endpoints to get a token
4. Test all endpoints with the token

### M-Pesa Testing
1. Use sandbox environment for testing
2. Test with sandbox phone numbers (e.g., 254708374149)
3. Monitor callback logs in your server console
4. Use ngrok for local development callbacks

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Check MySQL service
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql

# Check connection
mysql -u smartmeal_user -p smartmeal_db
```

### Prisma Issues
```bash
# Reset Prisma
rm -rf node_modules/.prisma
npm run db:generate

# Reset database
npm run db:push --force-reset
npm run db:seed
```

### M-Pesa Issues
1. Verify all environment variables are set
2. Check callback URL is accessible
3. Test with sandbox credentials first
4. Monitor server logs for errors

### Port Issues
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process if needed
kill -9 PID
```

## 📊 Monitoring

### Logs
- Development: Logs appear in console
- Production: Configure Winston logging

### Health Checks
```bash
# API health
curl http://localhost:3001/api/health

# Database health
curl http://localhost:3001/api/health/db
```

### Performance
- Monitor response times
- Check database query performance
- Monitor M-Pesa API calls

## 🔒 Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT secret
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Use HTTPS in production
- [ ] Secure database credentials
- [ ] Validate all inputs
- [ ] Set up logging and monitoring

## 🚀 Production Deployment

### Environment Variables
```env
NODE_ENV=production
DATABASE_URL=mysql://user:pass@host:port/database
JWT_SECRET=your_very_secure_jwt_secret
MPESA_ENVIRONMENT=production
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
```

### Database
- Use production MySQL instance
- Set up regular backups
- Configure connection pooling
- Monitor performance

### Server
- Use PM2 or similar process manager
- Set up reverse proxy (nginx)
- Configure SSL certificates
- Set up monitoring (New Relic, DataDog, etc.)

## 📞 Support

If you encounter issues:
1. Check the logs for error messages
2. Verify all environment variables are set
3. Test each component individually
4. Check the troubleshooting section above
5. Create an issue on GitHub

---

**Next Steps**: After setting up the backend, you can:
1. Connect your frontend to the API
2. Test the complete payment flow
3. Set up the admin dashboard
4. Deploy to production

Happy coding! 🎉

# 🚀 SmartMeal Production Deployment Guide

## 📋 **Pre-Deployment Checklist**

### ✅ **Frontend Requirements**
- [ ] Environment variables configured for production
- [ ] API endpoints pointing to production backend
- [ ] M-Pesa credentials updated for production
- [ ] Error tracking configured (Sentry, LogRocket)
- [ ] Analytics configured (Google Analytics, Mixpanel)
- [ ] Performance monitoring enabled
- [ ] SEO meta tags optimized
- [ ] Favicon and app icons configured
- [ ] Service worker configured (if implementing PWA)

### ✅ **Backend Requirements**
- [ ] Production database configured and migrated
- [ ] Environment variables secured
- [ ] SSL certificates installed
- [ ] Domain and DNS configured
- [ ] M-Pesa production credentials active
- [ ] Callback URLs updated for production
- [ ] Rate limiting configured
- [ ] CORS settings updated for production domain
- [ ] Logging and monitoring configured
- [ ] Backup strategy implemented

### ✅ **Security Requirements**
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CSRF protection configured
- [ ] Rate limiting active
- [ ] Authentication middleware secure
- [ ] API keys and secrets rotated
- [ ] Security audit completed

## 🌐 **Domain & SSL Configuration**

### **Domain Setup**
```bash
# Example domain configuration
FRONTEND_DOMAIN=smartmeal.yourdomain.com
BACKEND_DOMAIN=api.smartmeal.yourdomain.com
MPESA_CALLBACK_URL=https://api.smartmeal.yourdomain.com/api/mpesa/callback
```

### **SSL Certificate Setup**
```bash
# Using Let's Encrypt (free)
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d smartmeal.yourdomain.com -d api.smartmeal.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🐳 **Docker Deployment (Recommended)**

### **Frontend Dockerfile**
```dockerfile
# Frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### **Backend Dockerfile**
```dockerfile
# Backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

EXPOSE 3001
CMD ["npm", "start"]
```

### **Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    environment:
      - VITE_API_BASE_URL=https://api.smartmeal.yourdomain.com/api
    volumes:
      - ./ssl:/etc/nginx/ssl:ro

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - MPESA_CONSUMER_KEY=${MPESA_CONSUMER_KEY}
      - MPESA_CONSUMER_SECRET=${MPESA_CONSUMER_SECRET}
      - MPESA_PASSKEY=${MPESA_PASSKEY}
      - MPESA_SHORTCODE=${MPESA_SHORTCODE}
      - MPESA_ENVIRONMENT=production
      - MPESA_CALLBACK_URL=${MPESA_CALLBACK_URL}
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=${MYSQL_DATABASE}
      - MYSQL_USER=${MYSQL_USER}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  mysql_data:
```

## 🚀 **Manual Deployment Steps**

### **1. Frontend Deployment (Vercel/Netlify)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
cd frontend
vercel --prod

# Or build and deploy manually
npm run build
# Upload dist/ folder to your hosting provider
```

### **2. Backend Deployment (VPS/Cloud)**
```bash
# Connect to your server
ssh user@your-server-ip

# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Clone repository
git clone https://github.com/yourusername/smartmeal.git
cd smartmeal/backend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
nano .env  # Edit with production values

# Set up database
npx prisma generate
npx prisma db push
npm run db:seed

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### **3. Database Setup**
```sql
-- Create production database
CREATE DATABASE smartmeal_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create production user
CREATE USER 'smartmeal_prod'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON smartmeal_prod.* TO 'smartmeal_prod'@'localhost';
FLUSH PRIVILEGES;

-- Run migrations
-- This will be handled by Prisma
```

## 🔧 **Nginx Configuration**

### **Frontend Nginx Config**
```nginx
# /etc/nginx/sites-available/smartmeal-frontend
server {
    listen 80;
    server_name smartmeal.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name smartmeal.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/smartmeal.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smartmeal.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    root /var/www/smartmeal-frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security
    location ~ /\. {
        deny all;
    }
}
```

### **Backend Nginx Config**
```nginx
# /etc/nginx/sites-available/smartmeal-backend
server {
    listen 80;
    server_name api.smartmeal.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.smartmeal.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.smartmeal.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.smartmeal.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Security
    location ~ /\. {
        deny all;
    }
}
```

## 📊 **Monitoring & Logging**

### **PM2 Ecosystem Config**
```javascript
// backend/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'smartmeal-backend',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### **Logging Configuration**
```javascript
// backend/src/config/logger.js
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'smartmeal-backend' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log') 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

## 🔒 **Security Configuration**

### **Environment Variables Template**
```bash
# Production .env file
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL="mysql://smartmeal_prod:password@localhost:3306/smartmeal_prod"

# JWT
JWT_SECRET=your_super_secure_jwt_secret_here_minimum_32_characters
JWT_EXPIRES_IN=24h

# M-Pesa Production
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_PASSKEY=your_production_passkey
MPESA_SHORTCODE=your_production_shortcode
MPESA_ENVIRONMENT=production
MPESA_CALLBACK_URL=https://api.smartmeal.yourdomain.com/api/mpesa/callback

# Security
CORS_ORIGIN=https://smartmeal.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
ENABLE_HEALTH_CHECKS=true
```

### **Security Headers**
```javascript
// backend/src/middleware/security.js
const helmet = require('helmet');

const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.smartmeal.yourdomain.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

module.exports = securityMiddleware;
```

## 📈 **Performance Optimization**

### **Frontend Optimization**
```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@/components/ui'],
          utils: ['@/lib/utils']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### **Backend Optimization**
```javascript
// backend/src/index.js
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);
```

## 🧪 **Testing & Quality Assurance**

### **Pre-Deployment Tests**
```bash
# Frontend tests
cd frontend
npm run test
npm run build
npm run preview  # Test production build locally

# Backend tests
cd backend
npm run test
npm run test:integration
npm run lint
npm run type-check

# Database tests
npm run db:test
npm run db:migrate:test
```

### **Load Testing**
```bash
# Install Artillery for load testing
npm install -g artillery

# Run load test
artillery run load-test.yml

# Example load-test.yml
config:
  target: 'https://api.smartmeal.yourdomain.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
scenarios:
  - name: "Order flow"
    flow:
      - get:
          url: "/api/menu"
      - post:
          url: "/api/orders"
          json:
            customerName: "Test User"
            items: [{"menuItemId": "1", "quantity": 1}]
```

## 📱 **M-Pesa Production Setup**

### **Production Credentials**
1. **Daraja API Portal**: Update to production environment
2. **Shortcode**: Use your production shortcode
3. **Passkey**: Generate production passkey
4. **Callback URLs**: Update to production domain
5. **IP Whitelist**: Add your server IP to M-Pesa whitelist

### **Callback URL Configuration**
```bash
# Production callback URL
MPESA_CALLBACK_URL=https://api.smartmeal.yourdomain.com/api/mpesa/callback

# Test callback locally
ngrok http 3001
# Use ngrok URL for testing
```

## 🚨 **Emergency Procedures**

### **Rollback Plan**
```bash
# Quick rollback to previous version
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>
npm install
pm2 restart smartmeal-backend

# Database rollback
npx prisma migrate reset
npx prisma db push
```

### **Monitoring Alerts**
```javascript
// Set up monitoring alerts for:
// - High error rates (>5%)
// - Response time >2s
// - Database connection failures
// - M-Pesa API failures
// - Disk space <20%
// - Memory usage >80%
```

## 📋 **Post-Deployment Checklist**

- [ ] All endpoints responding correctly
- [ ] M-Pesa payments working
- [ ] Database connections stable
- [ ] SSL certificates valid
- [ ] Performance metrics acceptable
- [ ] Error monitoring active
- [ ] Backup system tested
- [ ] Documentation updated
- [ ] Team trained on new system
- [ ] Support procedures in place

## 🎯 **Success Metrics**

### **Technical Metrics**
- **Uptime**: >99.9%
- **Response Time**: <200ms average
- **Error Rate**: <1%
- **Payment Success Rate**: >95%

### **Business Metrics**
- **Order Completion Rate**: >90%
- **Customer Satisfaction**: >4.5/5
- **Revenue Growth**: Track monthly trends
- **User Adoption**: Monitor daily active users

---

**🚀 Your SmartMeal system is now production-ready!**

Remember to:
1. **Test thoroughly** before going live
2. **Monitor closely** during initial deployment
3. **Have a rollback plan** ready
4. **Document everything** for your team
5. **Set up alerts** for critical issues

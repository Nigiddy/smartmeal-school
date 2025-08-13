const { PrismaClient } = require('@prisma/client');

class Database {
  constructor() {
    this.prisma = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
  }

  async connect() {
    try {
      console.log('🔄 Connecting to database...');
      
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        errorFormat: 'pretty'
      });

      // Test connection
      await this.prisma.$connect();
      
      this.isConnected = true;
      this.connectionAttempts = 0;
      
      console.log('✅ Database connected successfully');
      
      // Set up connection event handlers
      this.prisma.$on('beforeExit', async () => {
        console.log('🔄 Database connection closing...');
        await this.disconnect();
      });

      this.prisma.$on('query', (e) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`📊 Query: ${e.query}`);
          console.log(`⏱️  Duration: ${e.duration}ms`);
        }
      });

      return this.prisma;
    } catch (error) {
      this.connectionAttempts++;
      console.error(`❌ Database connection failed (attempt ${this.connectionAttempts}/${this.maxRetries}):`, error.message);
      
      if (this.connectionAttempts < this.maxRetries) {
        console.log(`🔄 Retrying in ${this.connectionAttempts * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.connectionAttempts * 1000));
        return this.connect();
      }
      
      throw new Error(`Failed to connect to database after ${this.maxRetries} attempts: ${error.message}`);
    }
  }

  async disconnect() {
    if (this.prisma) {
      try {
        await this.prisma.$disconnect();
        this.isConnected = false;
        console.log('✅ Database disconnected successfully');
      } catch (error) {
        console.error('❌ Error disconnecting from database:', error.message);
      }
    }
  }

  async healthCheck() {
    try {
      if (!this.prisma || !this.isConnected) {
        return {
          status: 'disconnected',
          message: 'Database not connected',
          timestamp: new Date().toISOString()
        };
      }

      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        message: 'Database connection is working',
        timestamp: new Date().toISOString(),
        connectionAttempts: this.connectionAttempts
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database health check failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  getClient() {
    if (!this.prisma || !this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.prisma;
  }

  isReady() {
    return this.isConnected && this.prisma !== null;
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;

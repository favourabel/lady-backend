// ============================================
// Server Bootstrap (HTTP + Socket.io + Cron)
// ============================================
require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/Db');
const logger = require('./utils/logger');
const seedAdmin = require('./utils/seedAdmin');
const { initializeSocket } = require('./sockets/socketManager');
const { initializeCronJobs } = require('./cron/cronManager');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Start server
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Seed default admin (only creates if none exists)
    await seedAdmin();

    // 3. Initialize Socket.io
    initializeSocket(server);

    // 4. Initialize cron jobs (only in production or if explicitly enabled)
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
      initializeCronJobs();
    } else {
      logger.info('⏭️  Cron jobs disabled in development (set ENABLE_CRON=true to enable)');
    }

    // 5. Start HTTP server
    server.listen(PORT, () => {
      console.log(`\n╔════════════════════════════════════════════╗`);
      console.log(`║   🌸 My-Lady Backend Server                ║`);
      console.log(`╠════════════════════════════════════════════╣`);
      console.log(`║   Mode:    ${(process.env.NODE_ENV || 'development').padEnd(30)}  ║`);
      console.log(`║   Port:    ${String(PORT).padEnd(30)}  ║`);
      console.log(`║   URL:     http://localhost:${String(PORT).padEnd(15)}║`);
      console.log(`╚════════════════════════════════════════════╝\n`);

      logger.info(`Server started on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

startServer();

// ==================== Error Handlers ====================
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  console.error(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated');
    process.exit(0);
  });
});
// ============================================
// Express App Setup
// ============================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ==================== Trust Proxy ====================
app.set('trust proxy', 1);

// ==================== Security & Middleware ====================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());
app.use(cookieParser());

// ==================== CORS (✅ UPDATED - Multiple Origins) ====================
const allowedOrigins = [
  'https://my-lady-seven.vercel.app',   // Production frontend (Vercel)
  'http://localhost:5173',               // Local development (Vite)
  'http://localhost:3000',               // Local development (alternative)
  'http://localhost:5174',               // Local development (Vite alternate port)
  'http://127.0.0.1:5173',              // Local via IP
  process.env.CLIENT_URL,                // From environment variable
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.warn(`⚠️ CORS blocked origin: ${origin}`);
    return callback(new Error(`CORS blocked: ${origin} is not allowed`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging (dev)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET',
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply strict limiter FIRST to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Then apply general limiter to the rest of /api
app.use('/api', limiter);

// ==================== Health Check ====================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🌸 My-Lady Backend API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    aiEnabled: !!process.env.GROQ_API_KEY,
  });
});

// ==================== API Routes ====================

// Auth (public + protected)
app.use('/api/auth', require('./routes/Auth'));

// User profile management (protected)
app.use('/api/user', require('./routes/userRoutes'));

// Cycle tracking (protected)
app.use('/api/cycle', require('./routes/cycleRoutes'));

// Tips (protected)
app.use('/api/tips', require('./routes/tipsRoutes'));

// Chat & AI Advice (protected) ⬅️ ✅ ADDED THIS LINE TO FIX 404
app.use('/api/chat', require('./routes/chatRoutes'));

// Notifications (protected)
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Admin Notification Routes
app.use('/api/admin/notifications', require('./routes/adminNotificationRoutes'));

// ====================== NEW ADMIN ROUTES ======================
app.use('/api/admin/users', require('./routes/adminUserRoutes'));
app.use('/api/admin/tips', require('./routes/adminTipsRoutes'));
app.use('/api/admin/conversations', require('./routes/adminChatRoutes'));
app.use('/api/wellness', require('./routes/wellness'));
// ============================================================

// ==================== Error Handling ====================
app.use(notFound);
app.use(errorHandler);

module.exports = app;
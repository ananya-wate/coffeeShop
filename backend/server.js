const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
require('dotenv').config();

console.log('🚀 Starting MsCafe Backend Server...');
console.log('📍 Environment Variables Check:');
console.log('   PORT:', process.env.PORT || 5000);
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');

// Import passport config
require('./config/passport');

// CORS Configuration - Fixed for GitHub Codespaces
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps) or any GitHub Dev domain
    if (!origin || origin.includes('app.github.dev') || origin.includes('localhost')) {
      return callback(null, true);
    }
    callback(null, true); // Permissive for development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

// Middleware
app.use(helmet({ 
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Disabled for easier dev testing
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
});

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: {
    secure: true,    // Must be true for HTTPS in Codespaces
    sameSite: 'none', // Critical for cross-domain cookies
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.set('trust proxy', 1);
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MsCafe API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎉 Server running on port ${PORT}`);
});
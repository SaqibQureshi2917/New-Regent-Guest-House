const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Use the DNS resolvers configured for this backend before resolving Atlas SRV records.
const dnsServers = (process.env.DNS_SERVERS || '')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);
if (dnsServers.length) {
  require('node:dns').setServers(dnsServers);
}

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',').map((origin) => origin.trim()).filter(Boolean),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
let dbConnection;
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (!dbConnection) {
    dbConnection = mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/guesthouse')
      .catch((error) => {
        dbConnection = undefined;
        throw error;
      });
  }
  await dbConnection;
  console.log('✅ Database connected successfully.');
};

if (process.env.VERCEL) {
  app.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (error) {
      next(error);
    }
  });
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contact', require('./routes/contact'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET must be set before starting the API server.');
    }
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Backend running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('API server startup failed:', err.message);
    process.exitCode = 1;
  }
};

if (process.env.VERCEL) {
  module.exports = app;
} else {
  startServer();
}

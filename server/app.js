const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cookieParser = require('cookie-parser');

// Initialize app
const app = express();

// ===== SECURITY MIDDLEWARE =====
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: ['http://127.0.0.1:3000', 'http://localhost:3000', 'http://127.0.0.1:5500', 'http://127.0.0.1:59606', 'http://127.0.0.1:*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===== RATE LIMITING =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});
app.use('/api/', limiter);

// Auth routes rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  }
});
app.use('/api/v1/auth/login', authLimiter);

// ===== BODY PARSING =====
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ===== COMPRESSION & LOGGING =====
app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ===== STATIC FILES =====
// Serve client files
app.use(express.static(path.join(__dirname, '../client')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== API ROUTES =====
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1/blogs', require('./routes/blogs'));
app.use('/api/v1/messages', require('./routes/messages'));
app.use('/api/v1/upload', require('./routes/upload'));
app.use('/api/v1/public', require('./routes/public'));
app.use('/api/v1/admin', require('./routes/admin'));
// Admin routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/admin/login.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/admin/login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/admin/dashboard.html'));
});

app.get('/admin/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/admin/dashboard.html'));
});

app.get('/admin/projects', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/admin/projects.html'));
});

app.get('/admin/projects.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/admin/projects.html'));
});

app.get('/admin/messages', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/admin/messages.html'));
});

app.get('/admin/messages.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/admin/messages.html'));
});

app.get('/admin/settings', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/admin/settings.html'));
});

app.get('/admin/settings.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/admin/settings.html'));
});

// Blog pages
app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/blog.html'));
});

app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/blog-detail.html'));
});

app.get('/blog.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/blog.html'));
});

app.get('/blog-detail.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/blog-detail.html'));
});
app.get('/admin/blog.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/admin/blog.html'));
});

app.get('/admin/testimonials.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/admin/testimonials.html'));
});
// ===== ERROR HANDLING =====
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API route not found'
    });
  }
  res.status(404).sendFile(path.join(__dirname, '../client/404.html'));
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
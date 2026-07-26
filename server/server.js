require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const setupSocket = require('./config/socket');

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = setupSocket(server);
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║  🚀 GEEOOH PORTFOLIO PLATFORM       ║
  ║  Server running on port ${PORT}        ║
  ║  Mode: ${process.env.NODE_ENV || 'development'}    ║
  ║  URL: http://localhost:${PORT}         ║
  ╚══════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
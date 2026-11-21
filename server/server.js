// Load .env only in development (Render injects env vars directly)
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
  } catch (e) {
    console.log('dotenv not loaded (this is fine in production)');
  }
}

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const setupSocket = require('./config/socket');

// Start Server Function
async function startServer() {
  try {
    // 1. Connect to Database First
    await connectDB();
    
    // 2. Create HTTP server
    const server = http.createServer(app);

    // 3. Setup Socket.IO
    const io = setupSocket(server);
    app.set('io', io);

    // 4. Start listening
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

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Run the server
startServer();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes
    await Promise.all([
      conn.connection.collection('projects').createIndex({ slug: 1, featured: 1 }),
      conn.connection.collection('blogs').createIndex({ slug: 1, status: 1 }),
      conn.connection.collection('messages').createIndex({ createdAt: -1, read: 1 }),
    ]);
    
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
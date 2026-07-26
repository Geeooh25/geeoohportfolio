require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define User schema inline to avoid model issues
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: { type: String, default: 'admin' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin@2026', 12);

    // Find or create admin
    const admin = await User.findOneAndUpdate(
      { email: 'ganiyuusman43@gmail.com' },
      {
        name: 'Ganiyu Usman',
        email: 'ganiyuusman43@gmail.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('✅ Admin ready!');
    console.log('   Email:', admin.email);
    console.log('   Password: Admin@2026');
    console.log('   Role:', admin.role);

    await mongoose.connection.close();
    console.log('✅ Done');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();
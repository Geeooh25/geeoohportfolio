require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: String,
  category: String,
  level: Number,
  icon: String
}, { timestamps: true });

const Skill = mongoose.model('Skill', skillSchema);

const seedSkills = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    await Skill.deleteMany({});

    const skills = [
      { name: 'HTML5', category: 'frontend', level: 95, icon: '🌐' },
      { name: 'CSS3', category: 'frontend', level: 90, icon: '🎨' },
      { name: 'JavaScript', category: 'frontend', level: 88, icon: '⚡' },
      { name: 'Bootstrap', category: 'frontend', level: 85, icon: '📱' },
      { name: 'Responsive Design', category: 'frontend', level: 90, icon: '📐' },
      { name: 'Node.js', category: 'backend', level: 88, icon: '🟢' },
      { name: 'Express.js', category: 'backend', level: 85, icon: '🚂' },
      { name: 'RESTful APIs', category: 'backend', level: 88, icon: '🔗' },
      { name: 'EJS', category: 'frontend', level: 80, icon: '📄' },
      { name: 'MongoDB', category: 'database', level: 82, icon: '🍃' },
      { name: 'SQL', category: 'database', level: 75, icon: '🗄️' },
      { name: 'PostgreSQL', category: 'database', level: 72, icon: '🐘' },
      { name: 'Git & GitHub', category: 'tools', level: 88, icon: '📦' },
      { name: 'Socket.IO', category: 'backend', level: 78, icon: '🔌' },
      { name: 'Firebase', category: 'backend', level: 75, icon: '🔥' },
    ];

    await Skill.insertMany(skills);
    console.log(`✅ ${skills.length} skills seeded!`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedSkills();
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: String, slug: String, description: String, longDescription: String,
  category: String, technologies: [String],
  images: [{ url: String, caption: String, isHero: Boolean }],
  links: { live: String, github: String },
  timeline: { status: String }, featured: Boolean, published: Boolean
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

const seedProjects = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Project.deleteMany({});

    const projects = [
      {
        title: 'Beedaht Treats',
        slug: 'beedaht-treats',
        description: 'Full-stack e-commerce platform with admin dashboard, payment integration, and real-time inventory management',
        longDescription: 'A complete e-commerce solution built with Node.js, MongoDB, and Firebase.',
        category: 'fullstack',
        technologies: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'MongoDB', 'Express.js', 'Firebase', 'Paystack'],
        images: [
          { url: '/assets/images/Screenshot%202026-03-01%20141130.png', caption: 'Dashboard', isHero: true }
        ],
        links: {
          live: 'https://beedahttreats.netlify.app/',
          github: 'https://github.com/Geeooh25/Frontend-E-commerce'
        },
        timeline: { status: 'completed' },
        featured: true, published: true
      },
      {
        title: 'Multi-Currency Bank',
        slug: 'multi-currency-bank',
        description: 'Interactive frontend banking demo with currency switching',
        longDescription: 'A responsive banking interface demonstrating currency conversion logic.',
        category: 'frontend',
        technologies: ['HTML', 'CSS', 'JavaScript'],
        images: [
          { url: '/assets/images/Screenshot%202026-03-01%20215803.png', caption: 'Bank Dashboard', isHero: true }
        ],
        links: {
          live: 'https://frontend-bank.netlify.app/',
          github: 'https://github.com/geeooh25/frontend-bank'
        },
        timeline: { status: 'completed' },
        featured: true, published: true
      },
      {
        title: 'Social Media App',
        slug: 'social-media-app',
        description: 'Social media management tool for scheduling and boosting posts',
        longDescription: 'A social media management dashboard for scheduling posts.',
        category: 'frontend',
        technologies: ['HTML', 'CSS', 'JavaScript'],
        images: [
          { url: '/assets/images/Screenshot%202026-03-31%20012545.png', caption: 'Dashboard', isHero: true }
        ],
        links: {
          live: 'https://milesexchange.netlify.app/',
          github: 'https://github.com/Geeooh25/social-media-marketplace'
        },
        timeline: { status: 'completed' },
        featured: false, published: true
      },
      {
        title: 'Hotel Management System',
        slug: 'hotel-management-system',
        description: 'Full-stack hotel booking system with Stripe payments, Google OAuth, and admin dashboard',
        longDescription: 'A comprehensive hotel management platform with room booking, Stripe payments, and Google OAuth.',
        category: 'fullstack',
        technologies: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'PostgreSQL', 'Express.js', 'EJS', 'Stripe'],
        images: [
          { url: '/assets/images/Screenshot%202026-04-11%20183700.png', caption: 'Hotel Management', isHero: true }
        ],
        links: {
          live: 'https://fullstack-hotel-management.onrender.com/',
          github: 'https://github.com/Geeooh25/fullstack-hotel-management'
        },
        timeline: { status: 'completed' },
        featured: true, published: true
      }
    ];

    await Project.insertMany(projects);
    console.log(`✅ ${projects.length} projects seeded!`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedProjects();
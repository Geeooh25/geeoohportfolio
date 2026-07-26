require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  
  // Update Beedaht Treats
  await db.collection('projects').updateOne(
    { slug: 'beedaht-treats' },
    { $set: {
      links: {
        live: 'https://beedahttreats.netlify.app/',
        github: 'https://github.com/Geeooh25/Frontend-E-commerce',
        demo: '',
        documentation: ''
      },
      credentials: {
        hasCredentials: true,
        adminUrl: 'https://beedahttreats.netlify.app/admin',
        username: 'admin@beedaht.com',
        password: 'Admin123!',
        note: 'Use these credentials to access the admin dashboard. You can manage products, orders, and users.'
      },
      research: {
        summary: 'Conducted market research on Nigerian e-commerce platforms.',
        points: ['Analyzed 10+ local e-commerce sites', 'Interviewed 5 small business owners', 'Researched Paystack API capabilities'],
        tools: ['Google Analytics', 'Hotjar', 'Notion']
      },
      designStrategy: {
        summary: 'Focused on mobile-first design with intuitive admin dashboard.',
        approach: 'The design prioritized simplicity for end users while providing powerful tools for administrators.'
      },
      processBreakdown: [
        { phase: 'Discovery', description: 'Gathered requirements', duration: '1 week', icon: '🔍' },
        { phase: 'Design', description: 'Created wireframes', duration: '2 weeks', icon: '🎨' },
        { phase: 'Development', description: 'Built frontend and backend', duration: '6 weeks', icon: '💻' },
        { phase: 'Testing', description: 'QA testing', duration: '1 week', icon: '🧪' }
      ],
      results: {
        summary: 'The platform successfully launched with all core features working.',
        metrics: [
          { label: 'Page Load Time', value: '1.2s', icon: '⚡' },
          { label: 'Products Listed', value: '50+', icon: '📦' },
          { label: 'Payment Success Rate', value: '98%', icon: '💳' }
        ]
      },
      clientFeedback: {
        quote: 'Ganiyu delivered beyond expectations.',
        name: 'Abidat Alao',
        role: 'Founder, Beedaht Treats'
      },
      lessonsLearned: [
        { title: 'Start with API documentation', description: 'Understanding Paystack API thoroughly saved debugging time.' },
        { title: 'Mobile testing is critical', description: 'Over 70% of users access via mobile.' }
      ]
    }}
  );

  // Update Hotel Management
  await db.collection('projects').updateOne(
    { slug: 'hotel-management-system' },
    { $set: {
      links: {
        live: 'https://fullstack-hotel-management.onrender.com/',
        github: 'https://github.com/Geeooh25/fullstack-hotel-management',
        demo: '',
        documentation: 'https://github.com/Geeooh25/fullstack-hotel-management#readme'
      },
      credentials: {
        hasCredentials: true,
        adminUrl: 'https://fullstack-hotel-management.onrender.com/admin',
        username: 'admin@hotel.com',
        password: 'HotelAdmin2024!',
        note: 'Admin can manage bookings, rooms, services, and view customer details.'
      },
      research: {
        summary: 'Researched hotel booking systems to understand date selection and room availability.',
        points: ['Studied 5 hotel booking platforms', 'Analyzed Stripe payment flow', 'Researched Google OAuth implementation'],
        tools: ['Postman', 'Figma', 'JIRA']
      },
      designStrategy: {
        summary: 'Created a seamless booking experience with visual date picker.',
        approach: 'Users can select dates, choose rooms, and add services in one flow without page reloads.'
      },
      processBreakdown: [
        { phase: 'Planning', description: 'Database schema design', duration: '1 week', icon: '📐' },
        { phase: 'Core Development', description: 'Booking engine and payments', duration: '8 weeks', icon: '🔧' },
        { phase: 'Admin Panel', description: 'Management dashboard', duration: '3 weeks', icon: '🖥️' }
      ],
      results: {
        summary: 'The system handles the full hotel booking lifecycle.',
        metrics: [
          { label: 'Booking Steps', value: '3', icon: '✅' },
          { label: 'Services Offered', value: '4', icon: '🛎️' },
          { label: 'Auth Methods', value: '2', icon: '🔐' }
        ]
      },
      clientFeedback: {
        quote: 'A comprehensive solution that covers everything a hotel needs.',
        name: 'Project Review',
        role: 'Fullstack Portfolio Project'
      },
      lessonsLearned: [
        { title: 'Date handling is complex', description: 'Managing date ranges and availability required careful planning.' },
        { title: 'OAuth simplifies onboarding', description: 'Google login reduced signup friction significantly.' }
      ]
    }}
  );

  // Update Multi-Currency Bank
  await db.collection('projects').updateOne(
    { slug: 'multi-currency-bank' },
    { $set: {
      links: {
        live: 'https://frontend-bank.netlify.app/',
        github: 'https://github.com/geeooh25/frontend-bank',
        demo: '',
        documentation: ''
      },
      credentials: {
        hasCredentials: false
      },
      designStrategy: {
        summary: 'Created a clean banking interface demonstrating currency conversion logic.',
        approach: 'The design mimics real banking apps with clear account views and transaction history.'
      },
      processBreakdown: [
        { phase: 'Design', description: 'UI/UX design', duration: '3 days', icon: '🎨' },
        { phase: 'Development', description: 'Built with vanilla JavaScript', duration: '1 week', icon: '💻' }
      ],
      results: {
        summary: 'A responsive banking demo showcasing frontend development skills.',
        metrics: [
          { label: 'Currencies', value: '2', icon: '💱' },
          { label: 'Mobile Score', value: '95/100', icon: '📱' }
        ]
      },
      lessonsLearned: [
        { title: 'State management matters', description: 'Managing currency state and conversions required careful JavaScript logic.' }
      ]
    }}
  );

  // Update Social Media App
  await db.collection('projects').updateOne(
    { slug: 'social-media-app' },
    { $set: {
      links: {
        live: 'https://milesexchange.netlify.app/',
        github: 'https://github.com/Geeooh25/social-media-marketplace',
        demo: '',
        documentation: ''
      },
      credentials: {
        hasCredentials: false
      },
      designStrategy: {
        summary: 'Built a social media management dashboard for scheduling and boosting posts.',
        approach: 'Focused on a clean dashboard layout that shows campaign performance at a glance.'
      },
      processBreakdown: [
        { phase: 'Planning', description: 'Feature planning', duration: '2 days', icon: '📋' },
        { phase: 'Development', description: 'Built dashboard and scheduling features', duration: '2 weeks', icon: '💻' }
      ],
      results: {
        summary: 'A functional social media management tool with campaign tracking.',
        metrics: [
          { label: 'Features', value: '4', icon: '⚙️' },
          { label: 'Pages', value: '3', icon: '📄' }
        ]
      },
      lessonsLearned: [
        { title: 'Dashboard UX is key', description: 'Users need to see campaign performance instantly.' }
      ]
    }}
  );
  
  console.log('✅ All projects updated with credentials, links, and case study data!');
  await mongoose.connection.close();
  process.exit(0);
});
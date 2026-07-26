require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  await db.collection('testimonials').deleteMany({});

  await db.collection('testimonials').insertMany([
    {
      name: 'Abidat Alao',
      role: 'Founder',
      company: 'Beedaht Treats',
      industry: 'E-commerce',
      quote: 'Ganiyu delivered beyond expectations. The platform is fast, intuitive, and exactly what we needed. Our sales increased by 40% within the first three months of launching the new site.',
      shortQuote: 'Sales increased by 40% in 3 months',
      impact: {
        summary: 'The e-commerce platform transformed the business operations.',
        metrics: [
          { label: 'Sales Increase', value: '40%' },
          { label: 'Load Time', value: '1.2s' },
          { label: 'Products', value: '50+' }
        ]
      },
      projectName: 'Beedaht Treats E-commerce',
      projectLink: 'https://beedahttreats.netlify.app/',
      featured: true,
      order: 1
    },
    {
      name: 'Project Review',
      role: 'Fullstack Portfolio',
      company: 'Hotel Management System',
      industry: 'Hospitality',
      quote: 'A comprehensive solution that covers everything a hotel needs. The booking system is smooth, the admin panel is intuitive, and the Stripe integration works flawlessly.',
      shortQuote: 'Complete hotel management solution',
      impact: {
        metrics: [
          { label: 'Services', value: '4' },
          { label: 'Booking Steps', value: '3' },
          { label: 'Auth Methods', value: '2' }
        ]
      },
      projectName: 'Hotel Management System',
      projectLink: 'https://fullstack-hotel-management.onrender.com/',
      featured: false,
      order: 2
    }
  ]);

  console.log('✅ Testimonials seeded!');
  await mongoose.connection.close();
  process.exit(0);
});
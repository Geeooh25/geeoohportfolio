require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  await db.collection('experiences').deleteMany({});

  const experiences = [
    {
      type: 'work',
      title: 'Fullstack Developer (Freelance)',
      organization: 'Self-Employed',
      location: 'Nigeria',
      startDate: new Date('2024-01-01'),
      current: true,
      description: 'Building complete web applications for clients, handling everything from database design to deployment.',
      responsibilities: [
        'Develop full-stack applications using Node.js, Express, and MongoDB',
        'Design responsive frontends with HTML, CSS, and JavaScript',
        'Integrate payment gateways and third-party APIs',
        'Deploy applications to production environments'
      ],
      achievements: [
        'Built Beedaht Treats e-commerce platform serving 50+ products',
        'Developed Hotel Management System with Stripe integration',
        'Created real-time chat system with Socket.IO'
      ],
      skills: ['Node.js', 'Express', 'MongoDB', 'JavaScript', 'HTML', 'CSS', 'REST APIs', 'Socket.IO'],
      notableProjects: [
        { name: 'Beedaht Treats', description: 'Full-stack e-commerce with admin panel and payment integration', link: 'https://beedahttreats.netlify.app/' },
        { name: 'Hotel Management System', description: 'Booking system with Stripe and Google OAuth', link: 'https://fullstack-hotel-management.onrender.com/' }
      ],
      impact: {
        summary: 'Delivered production-ready applications handling real transactions and users.',
        metrics: [
          { label: 'Projects Completed', value: '4+' },
          { label: 'Technologies Used', value: '10+' },
          { label: 'Happy Clients', value: '3+' }
        ]
      },
      color: '#FF6B00',
      order: 1,
      featured: true
    },
    {
      type: 'work',
      title: 'Frontend Developer',
      organization: 'Tech Studio',
      location: 'Nigeria',
      startDate: new Date('2022-06-01'),
      endDate: new Date('2023-12-01'),
      description: 'Built interactive frontend components and integrated REST APIs for dynamic content delivery.',
      responsibilities: [
        'Developed responsive landing pages and web applications',
        'Integrated RESTful APIs for dynamic data display',
        'Collaborated with designers to implement pixel-perfect UIs'
      ],
      achievements: [
        'Improved mobile load time by 25% through optimization',
        'Built reusable component library used across 3 projects'
      ],
      skills: ['JavaScript', 'HTML', 'CSS', 'Bootstrap', 'REST APIs'],
      impact: {
        metrics: [
          { label: 'Load Time Reduced', value: '25%' },
          { label: 'Projects Contributed', value: '5+' }
        ]
      },
      color: '#7C3AED',
      order: 2
    },
    {
      type: 'work',
      title: 'Junior Developer',
      organization: 'Owu Tech',
      location: 'Nigeria',
      startDate: new Date('2021-03-01'),
      endDate: new Date('2022-05-01'),
      description: 'Started career developing responsive landing pages and learning full-stack fundamentals.',
      responsibilities: [
        'Built responsive landing pages with HTML, CSS, and Bootstrap',
        'Learned JavaScript fundamentals and DOM manipulation',
        'Assisted in website maintenance and updates'
      ],
      achievements: [
        'Completed first paid client project',
        'Learned version control with Git and GitHub'
      ],
      skills: ['HTML', 'CSS', 'Bootstrap', 'Git', 'JavaScript Basics'],
      color: '#06B6D4',
      order: 3
    },
    {
      type: 'education',
      title: 'BSc Computer Science',
      organization: 'University of Ilorin',
      location: 'Nigeria',
      startDate: new Date('2020-09-01'),
      endDate: new Date('2024-07-01'),
      description: 'Focused on full-stack development with thesis on Cloud Computing Applications.',
      achievements: [
        'Thesis: Cloud Computing Applications in Modern Web Development',
        'Built multiple academic projects using various technologies',
        'Participated in coding competitions and hackathons'
      ],
      skills: ['Computer Science', 'Cloud Computing', 'Software Engineering', 'Database Design'],
      color: '#7C3AED',
      order: 4
    },
    {
      type: 'education',
      title: 'Diploma in Computer Science',
      organization: 'Owu Polytechnic',
      location: 'Nigeria',
      startDate: new Date('2018-09-01'),
      endDate: new Date('2021-06-01'),
      description: 'Built first web applications and graduated with Second Class Upper.',
      achievements: [
        'Graduated with Second Class Upper',
        'Built first full-stack web application as final project'
      ],
      skills: ['Web Development', 'Programming Fundamentals'],
      color: '#FF6B00',
      order: 5
    },
    {
      type: 'certification',
      title: 'Full-Stack Web Development',
      organization: 'Udemy',
      startDate: new Date('2024-01-01'),
      description: 'Comprehensive training in JavaScript, Node.js, MongoDB, and modern web development.',
      skills: ['JavaScript', 'Node.js', 'MongoDB', 'Express.js'],
      color: '#06B6D4',
      order: 6
    }
  ];

  await db.collection('experiences').insertMany(experiences);
  console.log('✅ ' + experiences.length + ' experiences seeded!');
  await mongoose.connection.close();
  process.exit(0);
});
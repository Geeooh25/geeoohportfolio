require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: String, slug: String, subtitle: String, excerpt: String, content: String,
  category: String, tags: [String], status: String, featured: Boolean,
  readTime: Number, views: Number, publishedAt: Date,
  author: mongoose.Schema.Types.ObjectId
}, { timestamps: true, strict: false });

const Blog = mongoose.model('Blog', blogSchema);

const seedBlogs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Blog.deleteMany({});
    console.log('🗑️ Old blogs cleared');

    const admin = await mongoose.connection.db.collection('users').findOne({ email: 'ganiyuusman43@gmail.com' });
    if (!admin) { console.error('❌ Admin not found'); process.exit(1); }

    const blogs = [
      {
        title: 'Building Scalable REST APIs with Node.js and Express',
        slug: 'building-scalable-apis-nodejs-express',
        subtitle: 'A complete guide to production-ready API development',
        excerpt: 'Learn how to build production-ready REST APIs that handle thousands of requests per second with proper error handling, middleware, and security best practices.',
        content: '<h2>Introduction</h2><p>Building scalable APIs is essential for modern web applications. Whether you\'re building a mobile app backend, a microservice, or a full-stack application, your API needs to be fast, secure, and maintainable.</p><h2>Setting Up the Project</h2><p>Start by initializing a new Node.js project with <code>npm init</code> and installing Express. The key to a scalable API starts with proper project structure.</p><h2>Middleware Architecture</h2><p>Middleware is the backbone of Express applications. Proper error handling middleware ensures your API never crashes silently.</p><pre><code>app.use((err, req, res, next) => {\n  console.error(err.stack);\n  res.status(500).json({ error: \'Internal Server Error\' });\n});</code></pre><h2>Authentication & Security</h2><p>JWT-based authentication with refresh tokens provides a secure and scalable auth solution. Always hash passwords with bcrypt and validate input with express-validator.</p><blockquote>Security is not a feature - it\'s a requirement. Every endpoint should be protected and every input validated.</blockquote><h2>Conclusion</h2><p>Building scalable APIs requires careful planning, proper architecture, and attention to security. By following these patterns, your APIs will be ready for production.</p>',
        category: 'Backend',
        tags: ['nodejs', 'express', 'api', 'backend', 'tutorial'],
        status: 'published',
        featured: true,
        readTime: 8,
        views: 456,
        publishedAt: new Date('2026-06-10'),
        author: admin._id
      },
      {
        title: 'Why MongoDB is Perfect for Modern Web Applications',
        slug: 'mongodb-perfect-modern-web-apps',
        subtitle: 'Flexible schemas, powerful queries, and seamless scaling',
        excerpt: 'Discover why MongoDB has become the go-to database for startups and enterprise applications alike. Flexible schemas, powerful aggregation, and horizontal scaling.',
        content: '<h2>The Rise of NoSQL</h2><p>Traditional relational databases served us well for decades, but modern applications demand more flexibility than rigid schemas can provide.</p><h2>Schema Flexibility</h2><p>MongoDB\'s document model allows you to store data in JSON-like format, making it intuitive for JavaScript developers.</p><h2>Aggregation Pipeline</h2><p>The aggregation framework is incredibly powerful for data analysis and transformation.</p><pre><code>db.orders.aggregate([\n  { $match: { status: "completed" } },\n  { $group: { _id: "$customer", total: { $sum: "$amount" } } }\n]);</code></pre><h2>Scaling Horizontally</h2><p>Unlike SQL databases, MongoDB scales out easily with sharding, distributing data across multiple servers.</p>',
        category: 'Database',
        tags: ['mongodb', 'database', 'nosql', 'tutorial'],
        status: 'published',
        featured: false,
        readTime: 6,
        views: 312,
        publishedAt: new Date('2026-06-05'),
        author: admin._id
      },
      {
        title: 'Real-Time Communication with Socket.IO - Complete Guide',
        slug: 'real-time-communication-socketio-guide',
        subtitle: 'Build chat apps, live notifications, and collaborative features',
        excerpt: 'Implement real-time communication in your web apps - chat, notifications, live updates, and collaborative features with Socket.IO and Node.js.',
        content: '<h2>What is Socket.IO?</h2><p>Socket.IO enables real-time, bidirectional communication between web clients and servers. It\'s built on WebSockets but provides fallbacks for older browsers.</p><h2>Setting Up</h2><p>Installation is straightforward with npm. The server and client libraries work together seamlessly.</p><h2>Building a Chat App</h2><p>Let\'s walk through building a complete real-time chat application with rooms, typing indicators, and message history.</p><h2>Best Practices</h2><p>Use namespaces and rooms to organize connections. Always implement reconnection logic and handle errors gracefully.</p>',
        category: 'Tutorial',
        tags: ['socketio', 'websockets', 'real-time', 'javascript'],
        status: 'published',
        featured: false,
        readTime: 10,
        views: 528,
        publishedAt: new Date('2026-05-28'),
        author: admin._id
      },
      {
        title: 'From Frontend to Fullstack - My Developer Journey',
        slug: 'frontend-to-fullstack-journey',
        subtitle: 'Lessons learned transitioning to full-stack development',
        excerpt: 'Sharing my experience transitioning from frontend development to becoming a full-stack developer. The challenges, breakthroughs, and lessons learned along the way.',
        content: '<h2>The Beginning</h2><p>I started with HTML, CSS, and JavaScript - building static websites and simple interactive pages. The frontend felt natural and visual.</p><h2>The Backend Challenge</h2><p>Learning Node.js was intimidating at first. Concepts like server-side routing, middleware, and database queries were completely new.</p><h2>Key Lessons</h2><blockquote>The biggest lesson: understanding data flow from database to UI makes you a better developer on both ends.</blockquote><h2>Where I Am Now</h2><p>Now I build complete applications - from database design to deployment. The journey was worth every challenge.</p>',
        category: 'Career',
        tags: ['career', 'fullstack', 'journey', 'advice'],
        status: 'published',
        featured: false,
        readTime: 5,
        views: 189,
        publishedAt: new Date('2026-05-20'),
        author: admin._id
      },
      {
        title: 'Mastering CSS Grid and Flexbox for Modern Layouts',
        slug: 'mastering-css-grid-flexbox',
        subtitle: 'Create complex, responsive layouts with confidence',
        excerpt: 'A comprehensive guide to creating complex, responsive layouts with CSS Grid and Flexbox. Practical examples and best practices for modern web design.',
        content: '<h2>Flexbox vs Grid</h2><p>Understanding when to use Flexbox and when to use Grid is key to efficient layout design.</p><h2>Real-World Examples</h2><p>Let\'s build common layout patterns: navigation bars, card grids, dashboard layouts, and responsive page structures.</p><h2>Common Pitfalls</h2><p>Avoid the mistakes that confuse beginners - like forgetting that Flexbox is one-dimensional while Grid is two-dimensional.</p>',
        category: 'Frontend',
        tags: ['css', 'flexbox', 'grid', 'frontend'],
        status: 'published',
        featured: false,
        readTime: 7,
        views: 267,
        publishedAt: new Date('2026-05-15'),
        author: admin._id
      },
      {
        title: 'Securing Your Node.js Applications - Best Practices',
        slug: 'securing-nodejs-applications',
        subtitle: 'Protect your apps from common vulnerabilities',
        excerpt: 'Essential security practices every Node.js developer should know. From input validation to rate limiting, protect your applications from attacks.',
        content: '<h2>Why Security Matters</h2><p>Every application is a potential target. Understanding common vulnerabilities is the first step to protecting your users.</p><h2>Input Validation</h2><p>Never trust user input. Always validate and sanitize data before processing.</p><h2>Authentication Done Right</h2><p>Use bcrypt for passwords, JWT with proper expiration, and implement rate limiting on auth routes.</p><h2>HTTPS & Headers</h2><p>Always use HTTPS in production and set security headers with Helmet.js.</p>',
        category: 'Backend',
        tags: ['nodejs', 'security', 'backend', 'best-practices'],
        status: 'published',
        featured: false,
        readTime: 6,
        views: 145,
        publishedAt: new Date('2026-05-08'),
        author: admin._id
      }
    ];

    await Blog.insertMany(blogs);
    console.log(`✅ ${blogs.length} blogs seeded successfully!`);
    console.log('   Categories:', [...new Set(blogs.map(b => b.category))].join(', '));

    await mongoose.connection.close();
    console.log('✅ Done');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedBlogs();
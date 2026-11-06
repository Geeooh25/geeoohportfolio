const mongoose = require('mongoose');
const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, default: '' },
  company: { type: String, default: '' },
  quote: { type: String, required: true },
  shortQuote: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  impact: {
    summary: String,
    metrics: [{ label: String, value: String }]
  },
  featured: { type: Boolean, default: false },
  approved: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
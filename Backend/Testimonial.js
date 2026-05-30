const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    author_name: { type: String, required: true },
    author_title: String, // e.g., "Church Member", "Visitor"
    content: { type: String, required: true },
    image_url: String,
    approved: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
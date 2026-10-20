const mongoose = require('mongoose');

const ministrySchema = new mongoose.Schema({
    name: { type: String, required: true },
    leader: String,
    description: String,
    meeting_schedule: String,
    image_url: String,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    category: { type: String, enum: ['Men', 'Women', 'Youth', 'Children', 'Worship', 'Media', 'Evangelism'] },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ministry', ministrySchema);
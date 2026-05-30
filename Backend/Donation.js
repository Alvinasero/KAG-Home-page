const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donor_name: { type: String, default: 'Anonymous' },
    email: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: 'KES' },
    payment_method: { type: String, enum: ['M-Pesa', 'PayPal', 'Card'], required: true },
    transaction_id: { type: String, unique: true },
    purpose: { type: String, enum: ['Tithe', 'Offering', 'Building Fund', 'Missions', 'Other'] },
    status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donation', donationSchema);
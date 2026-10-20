const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true }, // Link to User if they have an account
    full_name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    phone_number: String,
    address: String,
    date_of_birth: Date,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    membership_date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Pending' },
    family_members: [{
        name: String,
        relationship: String,
        date_of_birth: Date
    }],
    volunteer_interests: [String]
});

module.exports = mongoose.model('Member', memberSchema);
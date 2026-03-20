const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planType: { type: String, enum: ['Basic', 'Premium'], required: true },
    weeklyPremium: { type: Number, required: true },
    status: { type: String, enum: ['Active', 'Inactive', 'Expired'], default: 'Active' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true }
});

module.exports = mongoose.model('Policy', policySchema);

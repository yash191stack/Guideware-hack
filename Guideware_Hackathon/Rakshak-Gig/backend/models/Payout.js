const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
    policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true },
    amount: { type: Number, required: true },
    triggerReason: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Processed', 'Pending'], default: 'Processed' } // Parametric payouts process instantly
});

module.exports = mongoose.model('Payout', payoutSchema);

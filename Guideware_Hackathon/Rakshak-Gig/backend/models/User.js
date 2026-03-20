const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    platform: { type: String, enum: ['Zomato', 'Swiggy', 'Zepto', 'Amazon'], required: true },
    city: { type: String, required: true },
    walletBalance: { type: Number, default: 0 },
    location: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const { checkWeatherAndTriggerPayouts } = require('./services/weatherTrigger');

const app = express();
app.use(express.json());
app.use(cors());

// Modular Routes
const axios = require('axios');
app.get('/api/weather', async (req, res) => {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'City is required' });

    try {
        // WeatherAPI.com — append ',India' to guarantee correct Indian city resolution
        const API_KEY = '9042faf03cda40dda0f85329262003';
        const weatherRes = await axios.get(`http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(city + ',India')}&aqi=yes`);
        
        const cur = weatherRes.data.current;
        const temp = cur.temp_c;
        const feelsLike = cur.feelslike_c;
        const rainfall = cur.precip_mm || 0;
        const windSpeed = cur.wind_kph || 0;
        const windDir = cur.wind_dir || 'N';
        const humidity = cur.humidity || 0;
        const uv = cur.uv || 0;
        const visibility = cur.vis_km || 0;
        const cloud = cur.cloud || 0;
        const pressure = cur.pressure_mb || 0;
        const condition = cur.condition?.text || 'Unknown';
        const conditionIcon = cur.condition?.icon ? `https:${cur.condition.icon}` : '';
        const lastUpdated = cur.last_updated || '';
        
        // Map WeatherAPI EPA Index (1-6) to illustrative AQI
        const epaMap = { 1: 35, 2: 85, 3: 135, 4: 180, 5: 250, 6: 450 };
        const epaIndex = cur.air_quality ? cur.air_quality['us-epa-index'] : 1;
        const aqiRaw = epaMap[epaIndex] || 50;
        const isAqiCritical = epaIndex >= 5;

        let riskProfile = 'Low Risk';
        if (rainfall > 20) riskProfile = 'High Risk (Flood/Rain)';
        else if (temp > 45) riskProfile = 'High Risk (Heatwave)';
        else if (windSpeed > 60) riskProfile = 'High Risk (Storm/Cyclone)';
        else if (isAqiCritical) riskProfile = 'High Risk (AQI > 400)';
        else if (rainfall > 0 || temp > 35 || windSpeed > 40 || aqiRaw >= 150) riskProfile = 'Moderate Risk';

        res.json({ 
            city, temp, feelsLike, rainfall, windSpeed, windDir, humidity, 
            uv, visibility, cloud, pressure, condition, conditionIcon,
            aqi: aqiRaw, epaIndex, riskProfile, lastUpdated 
        });
    } catch (error) {
        console.error('Weather API Error:', error.message);
        res.status(500).json({ error: 'City not found or WeatherAPI failed.' });
    }
});

// Models for interacting with MongoDB
const User = require('./models/User');
const Policy = require('./models/Policy');
const Payout = require('./models/Payout');

// 1. Onboarding new User
app.post('/api/users/onboard', async (req, res) => {
    try {
        const { name, platform, city } = req.body;
        if (!name || !platform || !city) return res.status(400).json({ error: 'Missing required fields' });

        // Get Lat/Lon for the city
        const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
        if (!geoRes.data.results || !geoRes.data.results.length) return res.status(404).json({ error: 'City not found by Open-Meteo' });

        const location = {
            lat: geoRes.data.results[0].latitude,
            lon: geoRes.data.results[0].longitude
        };

        const user = new User({ name, platform, city, location });
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        console.error('Onboard Error:', error.message);
        res.status(500).json({ error: 'Server error during onboarding' });
    }
});

// 2. Subscribing to a Plan
app.post('/api/policies/subscribe', async (req, res) => {
    try {
        const { userId, planType, weeklyPremium } = req.body;
        if (!userId || !planType || !weeklyPremium) return res.status(400).json({ error: 'Missing required fields' });

        // Set policy end date to 7 days from now (Weekly Plan)
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);

        const policy = new Policy({
            userId,
            planType,
            weeklyPremium,
            endDate
        });
        await policy.save();
        res.status(201).json(policy);
    } catch (error) {
        console.error('Subscribe Error:', error.message);
        res.status(500).json({ error: 'Server error during policy creation' });
    }
});

// 3. Get Dashboard Details
app.get('/api/users/:id/dashboard', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const activePolicy = await Policy.findOne({ userId: user._id, status: 'Active' });
        const recentPayouts = await Payout.find({ policyId: activePolicy?._id }).sort({ date: -1 }).limit(5);

        res.json({
            user,
            activePolicy,
            recentPayouts
        });
    } catch (error) {
        console.error('Dashboard Fetch Error:', error.message);
        res.status(500).json({ error: 'Server error fetching dashboard' });
    }
});

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rakshak-gig', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Automated Cron Job for Parametric Trigger
// Runs every hour at minute 0
cron.schedule('0 * * * *', async () => {
    console.log('Running automated parametric trigger check...');
    await checkWeatherAndTriggerPayouts();
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Rakshak-Gig Server running on port ${PORT}`);
});

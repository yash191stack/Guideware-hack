const axios = require('axios');

// Mock Models to represent DB imports
const User = require('../models/User');
const Policy = require('../models/Policy');
const Payout = require('../models/Payout');


/**
 * AI Layer: Dynamic Premium AI
 * Adjusts the premium based on historical and current risk profile of the city.
 */
const calculateDynamicPremium = (city, basePremium) => {
    const currentMonth = new Date().getMonth(); // 0-11

    // Delhi: High risk in Nov/Dec due to severe AQI
    if (city.toLowerCase() === 'delhi' && (currentMonth >= 10)) {
        return basePremium * 1.5;
    }
    // Mumbai: High risk in July/August due to Monsoon flooding
    if (city.toLowerCase() === 'mumbai' && (currentMonth === 6 || currentMonth === 7)) {
        return basePremium * 1.4;
    }

    return basePremium; // Default risk
};

/**
 * AI Layer: Fraud Detection & Location Validation
 * Validates if the user's GPS is actually within the disrupted weather station's radius.
 */
const isUserInDisruptionZone = (userLocation, stationLocation, maxRadiusKm = 10) => {
    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = (stationLocation.lat - userLocation.lat) * (Math.PI / 180);
    const dLon = (stationLocation.lon - userLocation.lon) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLocation.lat * (Math.PI / 180)) * Math.cos(stationLocation.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= maxRadiusKm;
};

/**
 * Parametric Trigger Engine Logic
 * Automatically fetches weather and triggers settlements without manual claims.
 */
const checkWeatherAndTriggerPayouts = async () => {
    try {
        // 1. Fetch Active Policies
        const activePolicies = await Policy.find({ status: 'Active' }).populate('userId');
        if (!activePolicies.length) return;

        // Group by city to minimize API calls
        const cities = [...new Set(activePolicies.map(p => p.userId.city))];

        for (const city of cities) {
            // WeatherAPI Integration
            let lat, lon, rainfall = 0, temp = 30, windSpeed = 0, isAqiCritical = false;

            try {
                // WeatherAPI — append ',India' for guaranteed Indian city resolution
                const API_KEY = '9042faf03cda40dda0f85329262003';
                const weatherRes = await axios.get(`http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(city + ',India')}&aqi=yes`);
                
                lat = weatherRes.data.location.lat;
                lon = weatherRes.data.location.lon;
                rainfall = weatherRes.data.current.precip_mm || 0;
                temp = weatherRes.data.current.temp_c;
                windSpeed = weatherRes.data.current.wind_kph || 0;
                
                const epaIndex = weatherRes.data.current.air_quality ? weatherRes.data.current.air_quality['us-epa-index'] : 1;
                isAqiCritical = epaIndex >= 5;
            } catch (err) {
                console.error(`\n[Weather API Error] WeatherAPI.com failed for ${city}: ${err.message}`);
                continue; // Skip triggering payouts for this city if API fails.
            }

            // 3. Logic Gate
            let triggerReason = null;
            if (rainfall > 20) triggerReason = 'Extreme Rainfall > 20mm';
            else if (temp > 45) triggerReason = 'Extreme Heatwave > 45C';
            else if (isAqiCritical) triggerReason = 'Severe AQI Alert (EPA 5+)';
            else if (typeof windSpeed !== 'undefined' && windSpeed > 60) triggerReason = 'Severe Storm > 60km/h';

            if (triggerReason) {
                const affectedPolicies = activePolicies.filter(p => p.userId.city === city);
                const stationLoc = { lat, lon };

                for (const policy of affectedPolicies) {
                    const user = policy.userId;

                    // Fraud / Location Gate
                    if (!isUserInDisruptionZone(user.location, stationLoc)) {
                        console.log(`[Fraud Gate] User ${user.name} outside disruption zone. Flagged.`);
                        continue;
                    }

                    // 4. Automated Payout Execution
                    const payoutAmount = policy.weeklyPremium >= 50 ? 1000 : 500;
                    user.walletBalance += payoutAmount;
                    await user.save();

                    await Payout.create({
                        policyId: policy._id,
                        amount: payoutAmount,
                        triggerReason,
                        date: new Date()
                    });

                    console.log(`[Settled] ₹${payoutAmount} credited to ${user.name} for ${triggerReason}`);
                }
            }
        }
    } catch (error) {
        console.error('Error in Parametric Trigger:', error.message);
    }
};

module.exports = {
    checkWeatherAndTriggerPayouts,
    calculateDynamicPremium
};

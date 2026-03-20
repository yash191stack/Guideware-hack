import React, { useState, useEffect } from 'react';

const Dashboard = () => {
    const [step, setStep] = useState(1);
    const [userData, setUserData] = useState({ name: '', platform: '', city: '' });
    const [plan, setPlan] = useState(null);
    const [wallet, setWallet] = useState(0);
    const [liveRisk, setLiveRisk] = useState('Checking...');

    const handleInputChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const nextStep = () => setStep(step + 1);

    // Mock checking Risk Profile when reaching the plan selection
    useEffect(() => {
        if (step === 2) {
            setLiveRisk('Calculating AI Risk Pricing...');
            setTimeout(() => setLiveRisk(userData.city === 'Delhi' ? 'High Risk (AQI)' : 'Moderate'), 1500);
        }
    }, [step, userData.city]);

    const handleSubscribe = (selectedPlan) => {
        setPlan(selectedPlan);
        // Mock Payment Gateway Integration
        alert(`Redirecting to Razorpay for ₹${selectedPlan.price}/week subscription...`);
        setStep(3); // Go to Dashboard
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 font-sans selection:bg-teal-500 selection:text-white">
            <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-8 relative overflow-hidden">

                {/* Glow Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-teal-500/20 blur-3xl rounded-full pointer-events-none"></div>

                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 mb-8 text-center tracking-tight">
                    Rakshak-Gig
                </h1>

                {/* STEP 1: Fast Onboarding */}
                {step === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="e.g. Rahul Kumar"
                                className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl p-3.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Platform</label>
                            <select
                                name="platform"
                                className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl p-3.5 focus:outline-none focus:border-teal-400 text-neutral-200 transition"
                                onChange={handleInputChange}
                            >
                                <option value="">Select Platform</option>
                                <option value="Zomato">Zomato</option>
                                <option value="Swiggy">Swiggy</option>
                                <option value="Zepto">Zepto</option>
                                <option value="Amazon">Amazon</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">City / Operating Zone</label>
                            <input
                                type="text"
                                name="city"
                                placeholder="e.g. Delhi"
                                className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl p-3.5 focus:outline-none focus:border-teal-400 transition"
                                onChange={handleInputChange}
                            />
                        </div>

                        <button
                            onClick={nextStep}
                            disabled={!userData.name || !userData.platform || !userData.city}
                            className="w-full mt-8 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-neutral-950 font-bold py-3.5 px-4 rounded-xl transition shadow-[0_0_20px_rgba(20,184,166,0.2)] disabled:opacity-50 disabled:shadow-none"
                        >
                            Get Protected
                        </button>
                    </div>
                )}

                {/* STEP 2: Weekly Sachet Selector (Dynamic Pricing) */}
                {step === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                        <h2 className="text-xl font-bold mb-2">Choose Weekly Plan</h2>

                        {/* Dynamic Premium Notice */}
                        <div className="bg-teal-950/40 border border-teal-900/50 rounded-lg p-3 flex items-start gap-3">
                            <span className="text-lg">🤖</span>
                            <p className="text-xs text-teal-200/80 leading-relaxed">
                                AI has analyzed <b className="text-teal-400">{userData.city}</b>. Current weather risk is evaluating. Pricing dynamically adjusted.
                            </p>
                        </div>

                        <div
                            onClick={() => handleSubscribe({ type: 'Basic', price: 20 })}
                            className="cursor-pointer border border-neutral-700 hover:border-teal-500/50 p-5 rounded-2xl transition bg-neutral-800/30 hover:bg-neutral-800 group"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-neutral-200 group-hover:text-teal-400 transition">Basic Cover</h3>
                                <span className="bg-neutral-800 text-xs px-2 py-1 rounded text-neutral-400">₹500 Payout</span>
                            </div>
                            <p className="text-3xl font-black mt-3 text-white">₹20 <span className="text-sm font-normal text-neutral-500">/ wk</span></p>
                        </div>

                        <div
                            onClick={() => handleSubscribe({ type: 'Premium', price: 50 })}
                            className="cursor-pointer border border-emerald-500/30 hover:border-emerald-400 p-5 rounded-2xl transition bg-emerald-950/10 hover:bg-emerald-900/20 relative group"
                        >
                            <div className="absolute top-0 right-0 bg-emerald-500 text-neutral-950 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl tracking-wider">RECOMMENDED</div>
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-emerald-400">Pro Cover</h3>
                                <span className="bg-emerald-950 border border-emerald-900 text-emerald-400 text-xs px-2 py-1 rounded">₹1000 Payout</span>
                            </div>
                            <p className="text-3xl font-black mt-3 text-white">₹50 <span className="text-sm font-normal text-emerald-500">/ wk</span></p>
                        </div>
                    </div>
                )}

                {/* STEP 3: Active Dashboard */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex justify-between items-end border-b border-neutral-800 pb-5">
                            <div>
                                <p className="text-xs text-neutral-400 uppercase tracking-wide">Platform Worker</p>
                                <h2 className="text-xl font-bold mt-1 text-white">{userData.name}</h2>
                            </div>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/20 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Cover Active
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-neutral-800/40 p-4 rounded-2xl border border-neutral-800/60">
                                <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                                    Location Risk
                                </p>
                                <p className="text-lg font-bold text-neutral-200">Moderate</p>
                                <p className="text-xs text-neutral-500 mt-1">{userData.city}</p>
                            </div>
                            <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 p-4 rounded-2xl border border-neutral-700/50 shadow-inner">
                                <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Payout Wallet</p>
                                <p className="text-2xl font-black text-white">₹{wallet}</p>
                                <p className="text-[10px] text-teal-400 mt-1 mt-1 font-medium">Auto-settlement ready</p>
                            </div>
                        </div>

                        <div className="bg-teal-950/20 border border-teal-900/40 p-5 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                            <h3 className="text-teal-400 font-bold mb-2 flex items-center gap-2 text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                AI Parametric Oracle Link
                            </h3>
                            <p className="text-xs text-neutral-300 leading-relaxed">
                                We are monitoring weather and AQI in real-time. If conditions breach limits (e.g. Rainfall &gt; 20mm), payout hits wallet instantly. No claims. No waiting.
                            </p>
                        </div>

                        <button
                            className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold py-3.5 rounded-xl transition border border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => alert("Insufficient funds to withdraw.")}
                            disabled={wallet === 0}
                        >
                            Withdraw to UPI / Bank
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';

const Dashboard = () => {
    const [step, setStep] = useState(1);
    const [userData, setUserData] = useState({ name: '', platform: '', city: '' });
    const [user, setUser] = useState(null); 
    const [plan, setPlan] = useState(null);
    const [wallet, setWallet] = useState(0);
    const [policyData, setPolicyData] = useState(null);
    const [payouts, setPayouts] = useState([]);
    const [liveRisk, setLiveRisk] = useState('Evaluating AI Safety...');
    
    // Base fetched weather vs live fluctuating weather
    const [baseWeather, setBaseWeather] = useState(null);
    const [liveWeather, setLiveWeather] = useState(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [demoMode, setDemoMode] = useState(false); // Hackathon Kill-Switch

    const handleInputChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const nextStep = async () => {
        if (step === 1) {
            setIsLoading(true);
            try {
                const res = await fetch('http://localhost:5001/api/users/onboard', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setUser(data);
                setStep(step + 1);
            } catch (err) {
                alert("Error onboarding: " + err.message);
            } finally {
                setIsLoading(false);
            }
        } else {
            setStep(step + 1);
        }
    };

    // Fetch Base Weather & Risk API
    useEffect(() => {
        if (step === 2 && userData.city) {
            setLiveRisk('Calibrating Satellite Sensors...');
            fetch(`http://localhost:5001/api/weather?city=${userData.city}`)
                .then(async res => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to connect to Oracle');
                    return data;
                })
                .then(data => {
                    setLiveRisk(data.riskProfile || 'Stable Environment');
                    setBaseWeather(data);
                    setLiveWeather({ 
                        temp: data.temp, 
                        rainfall: data.rainfall, 
                        aqi: data.aqi,
                        windSpeed: data.windSpeed,
                        humidity: data.humidity,
                        uv: data.uv || 0,
                        visibility: data.visibility || 0,
                        condition: data.condition || 'Clear',
                        conditionIcon: data.conditionIcon || ''
                    });
                })
                .catch(err => {
                    console.error("API Fetch Error:", err);
                    setLiveRisk('Atmospheric Link Offline');
                    setBaseWeather({ error: err.message });
                });
        }
    }, [step, userData.city]);

    const handleSubscribe = async (selectedPlan) => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/policies/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user._id,
                    planType: selectedPlan.type,
                    weeklyPremium: selectedPlan.price
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setPlan(selectedPlan);
            setTimeout(() => setStep(3), 600);
        } catch (err) {
            alert("Error subscribing: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Dashboard Polling (DB Wallet Balance & Policies)
    useEffect(() => {
        let interval;
        if (step === 3 && user) {
            const fetchDashboard = () => {
                fetch(`http://localhost:5001/api/users/${user._id}/dashboard`)
                    .then(res => res.json())
                    .then(data => {
                        // Don't override wallet if we are in demo mode (fake payout)
                        if (!demoMode && data.user) setWallet(data.user.walletBalance);
                        if (data.activePolicy) setPolicyData(data.activePolicy);
                        if (!demoMode && data.recentPayouts) setPayouts(data.recentPayouts);
                    })
                    .catch(err => console.error("Dashboard Fetch Error", err));
            };
            fetchDashboard(); 
            interval = setInterval(fetchDashboard, 5000); 
        }
        return () => clearInterval(interval);
    }, [step, user, demoMode]);

    // Fixed Live Sub-second Weather Simulation Logic
    useEffect(() => {
        let simInterval;
        if (step === 3 && baseWeather && !baseWeather.error && !demoMode) {
            simInterval = setInterval(() => {
                setLiveWeather(prev => {
                    // Anchor all telemetry securely to the real-world base API numbers
                    const baseT = parseFloat(baseWeather.temp || 0);
                    const baseR = parseFloat(baseWeather.rainfall || 0);
                    const baseA = parseInt(baseWeather.aqi || 50);
                    const baseW = parseFloat(baseWeather.windSpeed || 0);
                    const baseH = parseInt(baseWeather.humidity || 0);
                    const baseUV = parseFloat(baseWeather.uv || 0);
                    const baseVis = parseFloat(baseWeather.visibility || 0);

                    // Add slight jitter for "live" feel
                    const jitterT = (Math.random() * 0.2 - 0.1); 
                    const jitterR = baseR > 0 ? (Math.random() * 0.4 - 0.2) : 0; 
                    const jitterA = Math.floor(Math.random() * 3) - 1;
                    const jitterW = (Math.random() * 0.6 - 0.3);
                    const jitterH = Math.floor(Math.random() * 3) - 1;
                    const jitterUV = (Math.random() * 0.2 - 0.1);
                    const jitterVis = (Math.random() * 0.4 - 0.2);

                    return {
                        ...prev,
                        temp: (baseT + jitterT).toFixed(2),
                        rainfall: baseR === 0 ? 0 : Math.max(0, baseR + jitterR).toFixed(2),
                        aqi: Math.max(0, baseA + jitterA),
                        windSpeed: Math.max(0, baseW + jitterW).toFixed(1),
                        humidity: Math.max(0, Math.min(100, baseH + jitterH)).toFixed(0),
                        uv: Math.max(0, baseUV + jitterUV).toFixed(1),
                        visibility: Math.max(0, baseVis + jitterVis).toFixed(1)
                    };
                });
            }, 800); 
        }
        return () => clearInterval(simInterval);
    }, [step, baseWeather, demoMode]);

    // HACKATHON DEMO: Trigger Extreme Storm
    const triggerStormDemo = () => {
        if(demoMode) return;
        setDemoMode(true);
        setLiveRisk('CRITICAL STORM WARNING');
        
        // Instantly force extreme weather metrics
        setLiveWeather(prev => ({
            ...prev,
            temp: '18.50',
            rainfall: '145.20',
            windSpeed: '98.5',
            uv: '0.0',
            visibility: '0.2',
            condition: 'Severe Thunderstorm',
            conditionIcon: '//cdn.weatherapi.com/weather/64x64/day/389.png'
        }));

        // Simulate Parametric Smart Contract Execution Delay
        setTimeout(() => {
            setWallet(prev => prev + 1000);
            setPayouts(prev => [{
                amount: 1000,
                triggerReason: 'Extreme Rainfall (>20mm)',
                date: new Date().toISOString()
            }, ...prev]);
        }, 1200);
    };

    return (
        <div className="relative min-h-screen bg-[#F0F4F8] text-neutral-900 flex items-center justify-center p-4 lg:p-12 font-sans overflow-hidden">
            
            {/* Absolute Wild Abstract Background */}
            <div className="absolute top-0 right-[-10%] w-[80vw] h-[80vw] bg-gradient-to-tr from-yellow-300 via-pink-400 to-purple-500 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-[80px] opacity-40 animate-[spin_20s_linear_infinite] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-br from-cyan-400 via-emerald-300 to-yellow-200 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-[100px] opacity-60 animate-[spin_15s_linear_infinite_reverse] pointer-events-none"></div>

            {/* Brutalist Main Card */}
            <div className={`max-w-[460px] w-full bg-white/60 backdrop-blur-3xl border-[3px] border-black rounded-[40px] shadow-[15px_15px_0px_#000] p-8 lg:p-10 relative z-10 transition-all duration-700 ease-[cubic-bezier(0.87,0,0.13,1)] overflow-hidden ${demoMode ? 'shadow-[15px_15px_0px_#ef4444] border-red-500 bg-red-100/80' : ''}`}>

                {/* Header Logo */}
                <div className="flex flex-col items-start mb-8 w-full relative">
                    <div className="absolute -top-3 -right-3 text-[140px] opacity-[0.03] font-black -rotate-12 pointer-events-none leading-none select-none tracking-tighter">RG</div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#FF4F00] flex items-center justify-center rounded-xl rotate-3 shadow-[4px_4px_0px_#000] border-2 border-black transition-transform hover:rotate-12">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-black uppercase">Rakshak<br/><span className="text-[#FF4F00]">Gig.</span></h1>
                    </div>
                </div>

                {/* STEP 1: Bright Abstract Onboarding */}
                {step === 1 && (
                    <div className="space-y-7 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="text-left mb-8">
                            <h2 className="text-4xl font-black text-black leading-tight tracking-tighter mix-blend-overlay">Bulletproof<br/>Your Income.</h2>
                            <p className="text-sm text-neutral-600 font-bold mt-2 border-l-4 border-[#FF4F00] pl-3 py-1">Weather crashes? You get paid instantly, no claim files needed.</p>
                        </div>
                        
                        <div className="space-y-5">
                            <div className="relative group">
                                <label className="text-xs font-black uppercase text-black mb-1 block tracking-wider">Identity</label>
                                <input type="text" name="name" placeholder="Name..." className="w-full bg-white border-2 border-black rounded-2xl p-4 text-black font-bold focus:outline-none focus:ring-4 ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_#FF4F00]" onChange={handleInputChange} />
                            </div>

                            <div className="relative group">
                                <label className="text-xs font-black uppercase text-black mb-1 block tracking-wider">Fleet Core</label>
                                <select name="platform" className="w-full bg-white appearance-none border-2 border-black rounded-2xl p-4 text-black font-bold focus:outline-none focus:ring-4 ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_#FF4F00]" onChange={handleInputChange}>
                                    <option value="">Select Fleet</option>
                                    <option value="Zomato">Zomato</option>
                                    <option value="Swiggy">Swiggy</option>
                                    <option value="Zepto">Zepto</option>
                                    <option value="Amazon">Amazon</option>
                                    <option value="Dunzo">Dunzo</option>
                                </select>
                                <svg className="absolute right-5 bottom-5 w-4 h-4 text-black pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                            </div>

                            <div className="relative group">
                                <label className="text-xs font-black uppercase text-black mb-1 block tracking-wider">Operation Zone</label>
                                <input type="text" name="city" placeholder="E.g., Bangalore..." className="w-full bg-white border-2 border-black rounded-2xl p-4 text-black font-bold focus:outline-none focus:ring-4 ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_#FF4F00]" onChange={handleInputChange} />
                            </div>
                        </div>

                        <button onClick={nextStep} disabled={!userData.name || !userData.platform || !userData.city || isLoading} className="w-full mt-8 bg-black text-white font-black uppercase tracking-widest py-5 px-4 rounded-2xl border-2 border-black hover:bg-[#FF4F00] hover:scale-[1.03] transition-all duration-300 disabled:opacity-30 flex items-center justify-center gap-3 shadow-[8px_8px_0px_rgba(0,0,0,0.2)] disabled:shadow-none hover:shadow-[10px_10px_0px_rgba(255,79,0,0.3)] group overflow-hidden relative">
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_1s_infinite]"></div>
                            {isLoading ? (
                                <><span className="w-5 h-5 rounded-full border-4 border-white border-t-transparent animate-spin"></span> SYNCING...</>
                            ) : "Initialize Oracle"}
                        </button>
                    </div>
                )}

                {/* STEP 2: Sachet Pricing Abstract */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
                        <div className="bg-white border-2 border-black rounded-3xl p-5 flex gap-4 items-center shadow-[6px_6px_0px_#000] relative overflow-hidden">
                            <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-yellow-300 blur-2xl opacity-50 rounded-full animate-pulse"></div>
                            
                            <div className="w-12 h-12 rounded-[14px] bg-[#6B21A8] flex items-center justify-center animate-bounce -rotate-6 shadow-[3px_3px_0px_#000] border-2 border-black z-10 shrink-0">
                                <span className="text-xl">📡</span>
                            </div>
                            <div className="z-10">
                                <h3 className="text-[14px] font-black text-black leading-tight">Terrain Scan Complete</h3>
                                <p className="text-[11px] font-bold text-neutral-500 uppercase mt-1">Pricing adapted for <span className="text-black bg-yellow-300 px-1 rounded-sm border border-black">{userData.city}</span></p>
                            </div>
                        </div>

                        <div className="space-y-5 pt-3">
                            <div onClick={() => !isLoading && handleSubscribe({ type: 'Basic', price: 20 })} className="cursor-pointer bg-neutral-100 border-2 border-black p-6 rounded-3xl transition-all duration-300 hover:bg-black hover:text-white group relative shadow-[6px_6px_0px_#000] hover:shadow-[10px_10px_0px_#000] hover:-translate-y-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-black tracking-tight">Lite Shield</h3>
                                    <span className="font-mono text-xs font-bold border-2 border-black px-2 py-1 rounded-lg group-hover:border-white group-hover:bg-white group-hover:text-black transition-colors">₹500 Yield</span>
                                </div>
                                <div className="mt-4 flex items-end gap-1">
                                    <span className="text-4xl font-black">₹20</span>
                                    <span className="text-sm font-bold opacity-60 mb-1 pb-1">/ week</span>
                                </div>
                            </div>

                            <div onClick={() => !isLoading && handleSubscribe({ type: 'Premium', price: 50 })} className="cursor-pointer bg-gradient-to-br from-cyan-300 to-blue-400 border-2 border-black p-6 rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:-rotate-1 relative shadow-[8px_8px_0px_#000] active:scale-95">
                                <div className="absolute -top-3 -right-3 bg-[#FF4F00] text-white border-2 border-black text-[10px] font-black uppercase px-4 py-2 rounded-2xl rotate-12 shadow-[4px_4px_0px_#000]">Maximum Impact</div>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-black tracking-tight text-white drop-shadow-[1px_1px_0_#000]">Aegis Armor</h3>
                                    <span className="font-mono text-xs font-bold border-2 border-black bg-white px-2 py-1 rounded-lg text-black mt-2 shadow-[3px_3px_0px_#000]">₹1000 Yield</span>
                                </div>
                                <div className="mt-4 flex items-end gap-1 text-black">
                                    <span className="text-4xl font-black">₹50</span>
                                    <span className="text-sm font-bold opacity-80 mb-1 pb-1">/ week</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: V3 Enhanced Pop-Art Dash */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        
                        {/* HACKATHON DEMO: KILL SWITCH */}
                        {!demoMode && (
                            <button onClick={triggerStormDemo} className="absolute -top-4 -right-4 bg-red-600 text-white border-4 border-black text-[9px] font-black uppercase px-4 py-2 rounded-2xl rotate-[15deg] shadow-[4px_4px_0px_#000] hover:scale-110 active:scale-95 transition-transform z-50">
                                🚨 Force Storm (Demo)
                            </button>
                        )}

                        {/* Profile Pill & Weather Banner */}
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between bg-white border-2 border-black p-2 pr-4 rounded-full shadow-[4px_4px_0px_#000] items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF4F00] to-yellow-400 border-2 border-black flex items-center justify-center text-white font-black text-lg">
                                        {userData.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black leading-none">{userData.name}</span>
                                        <span className="text-[10px] uppercase font-bold text-neutral-500 mt-1">{userData.city} Sector</span>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 border-2 border-black font-black text-[10px] uppercase px-3 py-1.5 rounded-full shadow-[2px_2px_0px_#000] ${demoMode ? 'bg-red-500 text-white' : 'bg-[#D1FFAA] text-black'}`}>
                                    <span className={`w-2 h-2 rounded-full border border-black animate-pulse ${demoMode ? 'bg-white' : 'bg-green-500'}`}></span> LIVE
                                </div>
                            </div>

                            {/* Weather Condition Row */}
                            {liveWeather && (
                                <div className="flex justify-between items-center bg-blue-100 border-2 border-black px-4 py-2 rounded-2xl shadow-[4px_4px_0px_#000]">
                                    <div className="flex items-center gap-2">
                                        {liveWeather.conditionIcon ? (
                                            <img src={liveWeather.conditionIcon} alt="weather" className="w-8 h-8 drop-shadow-md" />
                                        ) : <span className="text-lg">☁️</span>}
                                        <span className="text-xs font-black uppercase text-blue-900 tracking-wider text-shadow-sm">{liveWeather.condition}</span>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border-2 border-black shadow-[2px_2px_0px_#000] ${liveRisk.includes('High') || demoMode ? 'bg-red-500 text-white' : 'bg-white text-black'}`}>{liveRisk}</span>
                                </div>
                            )}
                        </div>

                        {/* Abstract Live Telemetry Container (Now 6-Grid) */}
                        <div className="bg-[#111] rounded-[32px] p-5 text-white border-2 border-black shadow-[8px_8px_0px_#000] relative overflow-hidden group">
                           
                            {/* Animated Background Mesh */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl animate-pulse Mix-blend-screen pointer-events-none delay-700"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-2xl animate-pulse Mix-blend-screen pointer-events-none"></div>

                            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-cyan-400 mb-4 border-b border-white/10 pb-2">Feed.Parametric // V3</p>

                            {/* 3x2 Grid for 6 Metrics */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                {/* Rain */}
                                <div className="bg-white/[0.05] p-3 rounded-2xl border border-white/10">
                                    <span className="text-[9px] font-black text-neutral-400 tracking-widest uppercase block mb-1">Rain 💧</span>
                                    <span className={`text-2xl font-black font-mono tracking-tighter ${liveWeather?.rainfall === 0 ? 'text-neutral-400 text-lg italic' : 'text-cyan-400'}`}>
                                        {liveWeather?.rainfall === 0 ? 'No Rain' : <>{liveWeather?.rainfall}<span className="text-[10px] text-cyan-400/50">mm</span></>}
                                    </span>
                                </div>
                                {/* Temp */}
                                <div className="bg-white/[0.05] p-3 rounded-2xl border border-white/10 text-right">
                                    <span className="text-[9px] font-black text-neutral-400 tracking-widest uppercase block mb-1">Temp 🔥</span>
                                    <span className="text-2xl font-black font-mono tracking-tighter text-yellow-400">
                                        {liveWeather?.temp}<span className="text-[10px] text-yellow-500/50">°C</span>
                                    </span>
                                </div>
                                {/* Wind */}
                                <div className="bg-white/[0.05] p-3 rounded-2xl border border-white/10">
                                    <span className="text-[9px] font-black text-neutral-400 tracking-widest uppercase block mb-1">Wind 🌪️</span>
                                    <span className="text-2xl font-black font-mono tracking-tighter text-gray-300">
                                        {liveWeather?.windSpeed}<span className="text-[10px] text-gray-500 block leading-none">km/h</span>
                                    </span>
                                </div>
                                {/* Humid */}
                                <div className="bg-white/[0.05] p-3 rounded-2xl border border-white/10 text-right">
                                    <span className="text-[9px] font-black text-neutral-400 tracking-widest uppercase block mb-1">Water 💦</span>
                                    <span className="text-2xl font-black font-mono tracking-tighter text-blue-300">
                                        {liveWeather?.humidity}<span className="text-[10px] text-blue-400/50">%</span>
                                    </span>
                                </div>
                                {/* UV */}
                                <div className="bg-white/[0.05] p-3 rounded-2xl border border-white/10">
                                    <span className="text-[9px] font-black text-neutral-400 tracking-widest uppercase block mb-1">UV ☀️</span>
                                    <span className="text-2xl font-black font-mono tracking-tighter text-pink-400">
                                        {liveWeather?.uv}
                                    </span>
                                </div>
                                {/* Vis */}
                                <div className="bg-white/[0.05] p-3 rounded-2xl border border-white/10 text-right">
                                    <span className="text-[9px] font-black text-neutral-400 tracking-widest uppercase block mb-1">Vis 🌫️</span>
                                    <span className="text-2xl font-black font-mono tracking-tighter text-emerald-300">
                                        {liveWeather?.visibility}<span className="text-[10px] text-emerald-500/50 block leading-none">km</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Policy Info Ledger */}
                            <div className="bg-purple-100 border-2 border-black p-4 rounded-[24px] shadow-[4px_4px_0px_#000]">
                                <h4 className="text-[10px] font-black uppercase text-purple-800 tracking-wider mb-2">Active Shield</h4>
                                <p className="text-sm font-black text-black">{policyData?.planType || 'Processing...'}</p>
                                <p className="text-[10px] font-bold text-neutral-600 mt-1">₹{policyData?.weeklyPremium || 0} / wk</p>
                            </div>

                            {/* AQI Mini Panel */}
                            <div className="bg-white border-2 border-black p-4 rounded-[24px] shadow-[4px_4px_0px_#000] flex flex-col items-end text-right">
                                <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider mb-2">US AQI</h4>
                                <p className={`text-2xl font-black font-mono ${liveWeather?.aqi > 150 ? 'text-red-500' : 'text-black'}`}>{liveWeather?.aqi || '...'}</p>
                            </div>
                        </div>

                        {/* Recent Payouts Ledger (Pop Art) */}
                        {payouts.length > 0 && (
                            <div className="bg-white border-2 border-dashed border-black rounded-[24px] p-4">
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-3 ml-1">Recent Executions</h4>
                                <div className="space-y-2">
                                    {payouts.map((p, i) => (
                                        <div key={i} className="flex justify-between items-center bg-green-50 border-2 border-black rounded-xl p-2 px-3 shadow-[2px_2px_0px_#000]">
                                            <div>
                                                <p className="text-xs font-black text-green-700">+₹{p.amount}</p>
                                                <p className="text-[9px] font-bold text-neutral-600 mt-0.5">{p.triggerReason}</p>
                                            </div>
                                            <span className="text-[14px]">💸</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Brutalist Payout Interface */}
                        <div className="bg-[#FF4F00] border-4 border-black p-6 rounded-[32px] shadow-[8px_8px_0px_#000] flex flex-col items-center justify-center relative overflow-hidden group">
                           <div className="absolute w-[200%] h-full bg-white/20 skew-x-12 -translate-x-[200%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                           
                           <h4 className="text-xs font-black uppercase tracking-[0.2em] text-black mb-2 mix-blend-overlay">Vault Balance</h4>
                           
                           <div className="flex items-center gap-1 justify-center relative z-10 w-full mb-6">
                               <span className="text-3xl font-black text-black opacity-80 mb-4">₹</span>
                               <span className="text-6xl font-black text-white tracking-tighter tabular-nums drop-shadow-[4px_4px_0_#000]">
                                   {wallet.toLocaleString('en-IN')}
                               </span>
                           </div>

                           <button className="w-full bg-black text-white font-black uppercase text-sm py-4 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:scale-[1.03] transition-transform flex items-center justify-center gap-2 group-hover:bg-white group-hover:text-black group-hover:shadow-[4px_4px_0px_#FF4F00]" onClick={() => alert("Withdrawal Gateway Coming Soon.")}>
                               Eject Funds <span>→</span>
                           </button>
                        </div>

                    </div>
                )}
            </div>
            
            <style jsx>{`
                @keyframes scan {
                    0% { transform: translateX(-10px) }
                    50% { transform: translateX(300px) }
                    100% { transform: translateX(-10px) }
                }
                @keyframes shimmer {
                    100% {
                        transform: translateX(200%);
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;

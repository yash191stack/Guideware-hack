import React, { useState, useEffect } from 'react';

const Dashboard = () => {
    const [step, setStep] = useState(1);
    const [userData, setUserData] = useState({ name: '', platform: '', city: '' });
    const [user, setUser] = useState(null); 
    const [plan, setPlan] = useState(null);
    const [wallet, setWallet] = useState(0);
    const [liveRisk, setLiveRisk] = useState('Evaluating AI Safety...');
    
    // Base fetched weather vs live fluctuating weather
    const [baseWeather, setBaseWeather] = useState(null);
    const [liveWeather, setLiveWeather] = useState(null);
    
    const [isLoading, setIsLoading] = useState(false);

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
                        humidity: data.humidity
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

    // Dashboard Polling (DB Wallet Balance)
    useEffect(() => {
        let interval;
        if (step === 3 && user) {
            const fetchDashboard = () => {
                fetch(`http://localhost:5001/api/users/${user._id}/dashboard`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.user) setWallet(data.user.walletBalance);
                    })
                    .catch(err => console.error("Dashboard Fetch Error", err));
            };
            fetchDashboard(); 
            interval = setInterval(fetchDashboard, 5000); 
        }
        return () => clearInterval(interval);
    }, [step, user]);

    // Fixed Live Sub-second Weather Simulation Logic
    useEffect(() => {
        let simInterval;
        if (step === 3 && baseWeather && !baseWeather.error) {
            simInterval = setInterval(() => {
                setLiveWeather(prev => {
                    // Anchor all telemetry securely to the real-world base API numbers to prevent compounding drift!
                    const baseT = parseFloat(baseWeather.temp || 0);
                    const baseR = parseFloat(baseWeather.rainfall || 0);
                    const baseA = parseInt(baseWeather.aqi || 50);
                    const baseW = parseFloat(baseWeather.windSpeed || 0);
                    const baseH = parseInt(baseWeather.humidity || 0);

                    // Add slight jitter for "live" feel, but strictly clamp it around the truth
                    const jitterT = (Math.random() * 0.2 - 0.1); 
                    const jitterR = baseR > 0 ? (Math.random() * 0.4 - 0.2) : 0; // If no rain, no fluctuation
                    const jitterA = Math.floor(Math.random() * 3) - 1;
                    const jitterW = (Math.random() * 0.6 - 0.3);
                    const jitterH = Math.floor(Math.random() * 3) - 1;

                    return {
                        temp: (baseT + jitterT).toFixed(2),
                        rainfall: baseR === 0 ? 0 : Math.max(0, baseR + jitterR).toFixed(2),
                        aqi: Math.max(0, baseA + jitterA),
                        windSpeed: Math.max(0, baseW + jitterW).toFixed(1),
                        humidity: Math.max(0, Math.min(100, baseH + jitterH)).toFixed(0)
                    };
                });
            }, 800); 
        }
        return () => clearInterval(simInterval);
    }, [step, baseWeather]);

    return (
        <div className="relative min-h-screen bg-[#F0F4F8] text-neutral-900 flex items-center justify-center p-4 lg:p-12 font-sans overflow-hidden">
            
            {/* Absolute Wild Abstract Background */}
            <div className="absolute top-0 right-[-10%] w-[80vw] h-[80vw] bg-gradient-to-tr from-yellow-300 via-pink-400 to-purple-500 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-[80px] opacity-40 animate-[spin_20s_linear_infinite] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-br from-cyan-400 via-emerald-300 to-yellow-200 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-[100px] opacity-60 animate-[spin_15s_linear_infinite_reverse] pointer-events-none"></div>

            {/* Brutalist yet Glassy Main Card */}
            <div className="max-w-[440px] w-full bg-white/60 backdrop-blur-3xl border-2 border-white/80 rounded-[40px] shadow-[20px_20px_60px_rgba(0,0,0,0.05),-20px_-20px_60px_rgba(255,255,255,0.8)] p-10 relative z-10 transition-all duration-700 ease-[cubic-bezier(0.87,0,0.13,1)] overflow-hidden">

                {/* Header Logo */}
                <div className="flex flex-col items-start mb-10 w-full relative">
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
                                <input type="text" name="name" placeholder="Name..." className="w-full bg-white/80 border-2 border-black rounded-2xl p-4 text-black font-bold focus:outline-none focus:ring-4 ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_#FF4F00]" onChange={handleInputChange} />
                            </div>

                            <div className="relative group">
                                <label className="text-xs font-black uppercase text-black mb-1 block tracking-wider">Fleet Core</label>
                                <select name="platform" className="w-full bg-white/80 appearance-none border-2 border-black rounded-2xl p-4 text-black font-bold focus:outline-none focus:ring-4 ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_#FF4F00]" onChange={handleInputChange}>
                                    <option value="">Select Fleet</option>
                                    <option value="Zomato">Zomato</option>
                                    <option value="Swiggy">Swiggy</option>
                                    <option value="Zepto">Zepto</option>
                                    <option value="Amazon">Amazon</option>
                                </select>
                                <svg className="absolute right-5 bottom-5 w-4 h-4 text-black pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                            </div>

                            <div className="relative group">
                                <label className="text-xs font-black uppercase text-black mb-1 block tracking-wider">Operation Zone</label>
                                <input type="text" name="city" placeholder="E.g., Bangalore..." className="w-full bg-white/80 border-2 border-black rounded-2xl p-4 text-black font-bold focus:outline-none focus:ring-4 ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_#FF4F00]" onChange={handleInputChange} />
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
                        <div className="bg-white border-2 border-black rounded-3xl p-5 flex gap-4 items-center shadow-[6px_6px_0px_rgba(0,0,0,0.1)] relative overflow-hidden">
                            <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-yellow-300 blur-2xl opacity-50 rounded-full animate-pulse"></div>
                            
                            <div className="w-12 h-12 rounded-[14px] bg-[#6B21A8] flex items-center justify-center animate-bounce -rotate-6 shadow-[3px_3px_0px_#000] border-2 border-black z-10 shrink-0">
                                <span className="text-xl">📡</span>
                            </div>
                            <div className="z-10">
                                <h3 className="text-[14px] font-black text-black leading-tight">AI Terrain Scan Complete</h3>
                                <p className="text-[11px] font-bold text-neutral-500 uppercase mt-1">Pricing dynamically adapted for <span className="text-black bg-yellow-300 px-1 rounded-sm">{userData.city}</span></p>
                            </div>
                        </div>

                        <div className="space-y-5 pt-3">
                            <div onClick={() => !isLoading && handleSubscribe({ type: 'Basic', price: 20 })} className="cursor-pointer bg-neutral-100 border-2 border-black p-6 rounded-3xl transition-all duration-300 hover:bg-black hover:text-white group relative shadow-[4px_4px_0px_#000] hover:shadow-[8px_8px_0px_#000] hover:-translate-y-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-black tracking-tight">Lite Shield</h3>
                                    <span className="font-mono text-xs font-bold border-2 border-black px-2 py-1 rounded-lg group-hover:border-white group-hover:bg-white group-hover:text-black transition-colors">₹500 Yield</span>
                                </div>
                                <div className="mt-4 flex items-end gap-1">
                                    <span className="text-4xl font-black">₹20</span>
                                    <span className="text-sm font-bold opacity-60 mb-1 pb-1">/ cycle</span>
                                </div>
                            </div>

                            <div onClick={() => !isLoading && handleSubscribe({ type: 'Premium', price: 50 })} className="cursor-pointer bg-gradient-to-br from-cyan-300 to-blue-400 border-2 border-black p-6 rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:-rotate-1 relative shadow-[6px_6px_0px_#000] active:scale-95">
                                <div className="absolute -top-3 -right-3 bg-[#FF4F00] text-white border-2 border-black text-[10px] font-black uppercase px-4 py-2 rounded-2xl rotate-12 shadow-[3px_3px_0px_#000]">Maximum Impact</div>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-black tracking-tight text-black">Aegis Armor</h3>
                                    <span className="font-mono text-xs font-bold border-2 border-black bg-white px-2 py-1 rounded-lg text-black mt-2 mr-16 shadow-[2px_2px_0px_#000]">₹1000 Yield</span>
                                </div>
                                <div className="mt-4 flex items-end gap-1 text-black">
                                    <span className="text-4xl font-black">₹50</span>
                                    <span className="text-sm font-bold opacity-80 mb-1 pb-1">/ cycle</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: Wild Animated Telemetry Dashboard */}
                {step === 3 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* Profile Pill */}
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
                            <div className="flex items-center gap-2 border-2 border-green-500 bg-green-100 text-green-700 font-black text-[10px] uppercase px-3 py-1.5 rounded-full shadow-[2px_2px_0px_rgba(34,197,94,0.3)]">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse border border-green-700"></span> Live
                            </div>
                        </div>

                        {/* Abstract Live Telemetry Container */}
                        <div className="bg-[#111] rounded-[32px] p-6 text-white border-2 border-black shadow-[8px_8px_0px_#000] relative overflow-hidden group">
                           
                            {/* Animated Background Mesh in Dashboard */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl animate-pulse Mix-blend-screen pointer-events-none delay-700"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-2xl animate-pulse Mix-blend-screen pointer-events-none"></div>
                            <div className="absolute top-0 right-10 w-[2px] h-[300px] bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent opacity-50 animate-[scan_3s_ease-in-out_infinite]"></div>

                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-400 mix-blend-screen">Realtime Feed // .8s</p>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded bg-white text-black border-2 ${liveRisk.includes('High') ? 'text-red-600 border-red-500' : 'text-black border-black'}`}>{liveRisk}</span>
                            </div>

                            {/* 2x2 Grid for Main Weather */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex flex-col relative bg-white/[0.03] p-3 rounded-2xl border border-white/5 shadow-inner">
                                    <span className="text-[10px] font-black text-neutral-400 tracking-widest uppercase mb-1 drop-shadow-sm flex justify-between pr-2">Rainfall <span className="text-blue-400">💧</span></span>
                                    <div className="flex items-start gap-1">
                                        <span className={`text-4xl font-black font-mono tracking-tighter text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(6,182,212,0.8)] ${liveWeather && liveWeather.rainfall === 0 ? 'bg-gradient-to-br from-neutral-300 to-neutral-500 text-2xl mt-2 italic' : 'bg-gradient-to-br from-cyan-300 to-blue-500'}`}>
                                            {liveWeather ? (liveWeather.rainfall === 0 ? 'No Rain' : liveWeather.rainfall) : '0.00'}
                                        </span>
                                        {liveWeather && liveWeather.rainfall !== 0 && (
                                            <span className="text-sm font-bold text-cyan-400/50 mt-1 block">mm</span>
                                        )}
                                    </div>
                                    <div className="w-full h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]" style={{ width: `${Math.min(100, (parseFloat(liveWeather?.rainfall || 0) / 20) * 100)}%`, transition: 'width 0.8s ease-out' }}></div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col relative text-right items-end bg-white/[0.03] p-3 rounded-2xl border border-white/5 shadow-inner">
                                    <span className="text-[10px] font-black text-neutral-400 tracking-widest uppercase mb-1 drop-shadow-sm flex justify-between w-full pl-2"><span className="text-orange-400">🔥</span> Temperature</span>
                                    <div className="flex items-start gap-1 text-right justify-end">
                                        <span className={`text-4xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-bl from-yellow-300 to-orange-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] ${liveWeather && liveWeather.temp > 45 ? 'from-red-400 to-red-600' : ''}`}>
                                            {liveWeather ? liveWeather.temp : '0.00'}
                                        </span>
                                        <span className="text-sm font-bold text-yellow-500/50 mt-1 block">°C</span>
                                    </div>
                                     <div className="w-full h-1 bg-white/10 mt-2 rounded-full overflow-hidden flex justify-end">
                                        <div className={`h-full bg-yellow-400 shadow-[0_0_5px_#facc15]`} style={{ width: `${Math.min(100, (parseFloat(liveWeather?.temp || 0) / 50) * 100)}%`, transition: 'width 0.8s ease-out' }}></div>
                                    </div>
                                </div>

                                <div className="flex flex-col relative bg-white/[0.03] p-3 rounded-2xl border border-white/5 shadow-inner">
                                    <span className="text-[10px] font-black text-neutral-400 tracking-widest uppercase mb-1 drop-shadow-sm flex justify-between pr-2">Wind <span className="text-gray-400">🌪️</span></span>
                                    <div className="flex items-start gap-1">
                                        <span className="text-3xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-gray-200 to-gray-400">
                                            {liveWeather ? liveWeather.windSpeed : '0.0'}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400/50 mt-2 block uppercase">km/h</span>
                                    </div>
                                </div>

                                <div className="flex flex-col relative text-right items-end bg-white/[0.03] p-3 rounded-2xl border border-white/5 shadow-inner">
                                    <span className="text-[10px] font-black text-neutral-400 tracking-widest uppercase mb-1 drop-shadow-sm flex justify-between w-full pl-2"><span className="text-blue-300">💦</span> Humidity</span>
                                    <div className="flex items-start gap-1 text-right justify-end">
                                        <span className="text-3xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-bl from-blue-200 to-blue-400">
                                            {liveWeather ? liveWeather.humidity : '0'}
                                        </span>
                                        <span className="text-sm font-bold text-blue-400/50 mt-1 block">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* AQI Panel */}
                            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4 flex justify-between items-center backdrop-blur-md">
                                <div>
                                    <span className="text-[10px] font-black text-purple-300 tracking-widest uppercase mix-blend-screen block mb-1">Air Quality / AQI</span>
                                    <span className={`text-2xl font-black font-mono ${liveWeather && liveWeather.aqi > 400 ? 'text-red-500 drop-shadow-[0_0_10px_red]' : 'text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.6)]'}`}>
                                        {liveWeather ? liveWeather.aqi : '0'}
                                    </span>
                                    <span className="text-[10px] font-bold text-neutral-500 ml-1">US AQI</span>
                                </div>
                                <div className="w-10 h-10 border-4 border-purple-500/30 rounded-full flex items-center justify-center">
                                   <div className="w-4 h-4 text-purple-400 animate-pulse text-xs flex items-center justify-center">☁️</div>
                                </div>
                            </div>
                        </div>

                        {/* Brutalist Payout Interface */}
                        <div className="bg-[#D1FFAA] border-4 border-black p-6 rounded-[32px] shadow-[8px_8px_0px_#000] flex flex-col items-center justify-center relative overflow-hidden group">
                           <div className="absolute w-[200%] h-full bg-white/30 skew-x-12 -translate-x-[200%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                           
                           <h4 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-800 mb-2">Vault Balance</h4>
                           
                           <div className="flex items-center gap-1 justify-center relative z-10 w-full mb-6">
                               <span className="text-2xl font-black text-green-700 opacity-50 mb-4">₹</span>
                               <span className="text-6xl font-black text-black tracking-tighter tabular-nums drop-shadow-md">
                                   {wallet.toLocaleString('en-IN')}
                               </span>
                           </div>

                           <button className="w-full bg-black text-white font-black uppercase text-sm py-4 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:scale-[1.03] transition-transform flex items-center justify-center gap-2 group-hover:bg-[#FF4F00]" onClick={() => alert("Insufficient funds.")}>
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

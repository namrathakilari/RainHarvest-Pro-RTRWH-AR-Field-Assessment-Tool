/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Building2, 
  Droplets, 
  ClipboardCheck, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Navigation,
  Info,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types for our form state
interface FormData {
  // Step 1: Location
  state: string;
  district: string;
  annualRainfall: string;
  latitude: string;
  longitude: string;
  
  // Step 2: Building
  roofLength: string;
  roofWidth: string;
  roofType: string;
  floors: string;
  occupants: string;
  usageType: string;
  
  // Step 3: Soil/Site
  soilType: string;
  waterTableDepth: string;
  spaceAvailable: string;
  officerName: string;
}

const INITIAL_DATA: FormData = {
  state: '',
  district: '',
  annualRainfall: '',
  latitude: '',
  longitude: '',
  roofLength: '',
  roofWidth: '',
  roofType: 'RCC',
  floors: '1',
  occupants: '4',
  usageType: 'Residential',
  soilType: 'Sandy',
  waterTableDepth: '',
  spaceAvailable: '',
  officerName: '',
};

const STEPS = [
  { id: 1, title: 'Location', icon: MapPin },
  { id: 2, title: 'Building', icon: Building2 },
  { id: 3, title: 'Soil/Site', icon: Droplets },
  { id: 4, title: 'Results', icon: ClipboardCheck },
];

const STATES = [
  'Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Maharashtra', 
  'Gujarat', 'Rajasthan', 'Delhi', 'West Bengal', 'Other'
];

const ROOF_TYPES = ['RCC', 'GI Sheet', 'Asbestos', 'Tiles', 'Thatch'];
const USAGE_TYPES = ['Residential', 'Commercial', 'Industrial', 'Institutional'];
const SOIL_TYPES = ['Sandy', 'Clayey', 'Loamy', 'Rocky', 'Silty'];

export default function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [isLocating, setIsLocating] = useState(false);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};
  const getGPSLocation = () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }
  setIsLocating(true);
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setFormData(prev => ({
        ...prev,
        latitude: position.coords.latitude.toFixed(6),
        longitude: position.coords.longitude.toFixed(6)
      }));
      setIsLocating(false);
    },
    () => {
      alert("Unable to retrieve your location");
      setIsLocating(false);
    }
  );
};
    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));
  // Auto-calculate roof area
 // Auto-calculate roof area
  const roofArea = useMemo(() => {
    const l = parseFloat(formData.roofLength) || 0;
    const w = parseFloat(formData.roofWidth) || 0;
    return (l * w).toFixed(2);
  }, [formData.roofLength, formData.roofWidth]);

  // Runoff coefficients
  const RUNOFF = { RCC: 0.85, 'GI Sheet': 0.90, Asbestos: 0.70, Tiles: 0.80, Thatch: 0.50 };

  // Rainfall fallback by state
  const STATE_RAINFALL: Record<string, number> = {
    'Andhra Pradesh': 993, 'Karnataka': 971, 'Kerala': 3000,
    'Tamil Nadu': 1000, 'Maharashtra': 1200, 'Gujarat': 782,
    'Rajasthan': 450, 'Delhi': 797, 'West Bengal': 1582, 'Other': 800
  };

  const results = useMemo(() => {
    const area = parseFloat(roofArea) || 0;
    const rainfall = parseFloat(formData.annualRainfall) 
      || STATE_RAINFALL[formData.state] 
      || 800;
    const rc = RUNOFF[formData.roofType as keyof typeof RUNOFF] || 0.80;
    const occupants = parseInt(formData.occupants) || 4;

    const annualYield = area * rainfall * rc * 0.85;
    const annualDemand = occupants * 135 * 365;
    const tankSize = Math.max(area * 0.5 * 1000, 5000);
    const surplus = annualYield - annualDemand;
    const savings = Math.round((annualYield / 1000) * 67);

    const permeableSoils = ['Sandy', 'Loamy'];
    const rechargeOk = surplus > 0 && permeableSoils.includes(formData.soilType);
    const rechargeStructure = surplus > 50000 ? 'Recharge Well' 
      : surplus > 10000 ? 'Recharge Pit' : 'Percolation Trench';

    const monthlyFraction = [0.02,0.01,0.01,0.03,0.05,0.12,0.22,0.20,0.14,0.10,0.06,0.04];
    const monthlyData = monthlyFraction.map(f => Math.round(annualYield * f));

    return { annualYield, annualDemand, tankSize, surplus, savings, 
             rc, rainfall, rechargeOk, rechargeStructure, monthlyData };
  }, [roofArea, formData]);

  // Chart initialization
  useEffect(() => {
  if (step === 4) {
    setTimeout(() => {
      const ctx = document.getElementById('rainfallChart') as HTMLCanvasElement;
      if (ctx) {
        // @ts-ignore
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            datasets: [{
              label: 'Monthly Potential (Liters)',
              data: results.monthlyData,
              backgroundColor: 'rgba(52, 211, 153, 0.6)',
              borderColor: 'rgba(52, 211, 153, 1)',
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' }},
              x: { grid: { display: false }, ticks: { color: '#94a3b8' }}
            },
            plugins: { legend: { display: false }}
          }
        });
      }
    }, 100);
  }
}, [step, results]);

  const downloadPDF = () => {
    // @ts-ignore - jsPDF is from CDN
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Rainwater Harvesting Assessment Report", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Officer: ${formData.officerName || 'N/A'}`, 20, 35);
    doc.text(`Location: ${formData.district}, ${formData.state}`, 20, 45);
    doc.text(`Roof Area: ${roofArea} sq.m`, 20, 55);
    doc.text(`Annual Rainfall: ${formData.annualRainfall} mm`, 20, 65);
    
    doc.text("Assessment Results:", 20, 80);
doc.text(`- Annual Harvest Potential: ${(results.annualYield/1000).toFixed(1)} kL/year`, 25, 90);
doc.text(`- Recommended Tank Size: ${(results.tankSize/1000).toFixed(1)} kL`, 25, 100);
doc.text(`- Runoff Coefficient: ${results.rc}`, 25, 110);
doc.text(`- Annual Demand: ${(results.annualDemand/1000).toFixed(1)} kL/year`, 25, 120);
doc.text(`- Surplus for Recharge: ${(results.surplus/1000).toFixed(1)} kL`, 25, 130);
doc.text(`- Recharge Feasible: ${results.rechargeOk ? 'YES' : 'NO'}`, 25, 140);
doc.text(`- Recommended Structure: ${results.rechargeStructure}`, 25, 150);
    
    doc.save(`RWH_Report_${formData.district || 'Assessment'}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Droplets className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">RainHarvest Pro</h1>
              <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-semibold">Field Assessment Tool</p>
            </div>
          </div>
          <div className="text-xs font-mono text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
            STEP {step}/4
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 pb-32">
        {/* Progress Bar */}
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
          {STEPS.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                step >= s.id ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-[#141414] border-white/10 text-slate-500'
              }`}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-tighter ${step >= s.id ? 'text-emerald-500' : 'text-slate-600'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {step === 1 && (
              <div className="space-y-6">
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                    Location Details
                  </h2>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">State</label>
                      <select 
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      >
                        <option value="">Select State</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">District</label>
                      <input 
                        type="text"
                        name="district"
                        placeholder="Enter district name"
                        value={formData.district}
                        onChange={handleInputChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Annual Rainfall (mm)</label>
                      <input 
                        type="number"
                        name="annualRainfall"
                        placeholder="e.g. 1200"
                        value={formData.annualRainfall}
                        onChange={handleInputChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">GPS Coordinates</h2>
                    <button 
                      onClick={getGPSLocation}
                      disabled={isLocating}
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-400 transition-colors disabled:opacity-50"
                    >
                      <Navigation className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} />
                      {isLocating ? 'Locating...' : 'Get GPS'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase mb-1">Latitude</p>
                      <p className="font-mono text-sm">{formData.latitude || '--.------'}</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase mb-1">Longitude</p>
                      <p className="font-mono text-sm">{formData.longitude || '--.------'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-500" />
                    Building Specifications
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Roof Length (m)</label>
                      <input 
                        type="number"
                        name="roofLength"
                        value={formData.roofLength}
                        onChange={handleInputChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Roof Width (m)</label>
                      <input 
                        type="number"
                        name="roofWidth"
                        value={formData.roofWidth}
                        onChange={handleInputChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-400">Calculated Roof Area</span>
                    <span className="text-xl font-bold text-white">{roofArea} <small className="text-xs font-normal text-slate-400">sq.m</small></span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Roof Type</label>
                      <select 
                        name="roofType"
                        value={formData.roofType}
                        onChange={handleInputChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      >
                        {ROOF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">No. of Floors</label>
                        <input 
                          type="number"
                          name="floors"
                          value={formData.floors}
                          onChange={handleInputChange}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Occupants</label>
                        <input 
                          type="number"
                          name="occupants"
                          value={formData.occupants}
                          onChange={handleInputChange}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Usage Type</label>
                      <select 
                        name="usageType"
                        value={formData.usageType}
                        onChange={handleInputChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      >
                        {USAGE_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-emerald-500" />
                    Soil & Site Conditions
                  </h2>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Soil Type</label>
                      <select 
                        name="soilType"
                        value={formData.soilType}
                        onChange={handleInputChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      >
                        {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Water Table Depth (m)</label>
                      <input 
                        type="number"
                        name="waterTableDepth"
                        placeholder="e.g. 45"
                        value={formData.waterTableDepth}
                        onChange={handleInputChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Space Available for Tank (sq.m)</label>
                      <input 
                        type="number"
                        name="spaceAvailable"
                        placeholder="e.g. 10"
                        value={formData.spaceAvailable}
                        onChange={handleInputChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <User className="w-3 h-3" />
                          Assessing Officer Name
                        </label>
                        <input 
                          type="text"
                          name="officerName"
                          placeholder="Enter your name"
                          value={formData.officerName}
                          onChange={handleInputChange}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Assessment Results</h2>
                  <button 
                    onClick={downloadPDF}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Download className="w-4 h-4" />
                    PDF Report
                  </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
  <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 space-y-1">
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Harvest Potential</p>
    <p className="text-xl font-bold text-emerald-500">{(results.annualYield/1000).toFixed(1)} <small className="text-[10px] text-slate-400">kL/yr</small></p>
  </div>
  <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 space-y-1">
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rec. Tank Size</p>
    <p className="text-xl font-bold text-blue-500">{(results.tankSize/1000).toFixed(1)} <small className="text-[10px] text-slate-400">kL</small></p>
  </div>
  <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 space-y-1">
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Runoff Coeff.</p>
    <p className="text-xl font-bold text-orange-500">{results.rc}</p>
  </div>
  <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 space-y-1">
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Water Savings</p>
    <p className="text-xl font-bold text-purple-500">₹ {results.savings.toLocaleString()} <small className="text-[10px] text-slate-400">/yr</small></p>
  </div>
</div>

                {/* Chart */}
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Monthly Potential</h3>
                    <Info className="w-4 h-4 text-slate-600" />
                  </div>
                  <div style={{ height: '250px', width: '100%', position: 'relative' }}>
                    <canvas id="rainfallChart"></canvas>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-white">Site Recommendations</h3>
                  <ul className="space-y-3">
                    {[
                      'Install a first-flush diverter for initial rainfall.',
                      'Use a leaf screen on gutters to prevent clogging.',
                      'Tank should be placed on the North-East corner if possible.',
                      'Regular cleaning of the roof surface is required.'
                    ].map((rec, i) => (
                      <li key={i} className="flex gap-3 text-xs text-slate-400">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">{i+1}</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <footer className="fixed bottom-0 left-0 w-full bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/5 p-6 z-50">
        <div className="max-w-2xl mx-auto flex gap-4">
          {step > 1 && (
            <button 
              onClick={prevStep}
              className="flex-1 bg-[#141414] hover:bg-[#1a1a1a] border border-white/10 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          )}
          {step < 4 ? (
            <button 
              onClick={nextStep}
              className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              Next Step
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={() => {
                setStep(1);
                setFormData(INITIAL_DATA);
              }}
              className="flex-[2] bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              New Assessment
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

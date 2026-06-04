'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  ArrowLeft, 
  Printer, 
  Zap, 
  Activity, 
  Cpu, 
  Sliders, 
  Wrench, 
  Layers, 
  ShieldAlert, 
  Flame, 
  Wind, 
  ClipboardList,
  RotateCcw
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { settingsService, CompanyProfile } from '@/services/settings-service';

interface CalculationEngineProps {
  role: 'admin' | 'supervisor' | 'employee';
}

interface CalculatorModule {
  id: string;
  title: string;
  description: string;
  category: 'Electrical' | 'Mechanical' | 'Systems' | 'Integrated';
  icon: React.ReactNode;
}

export function CalculationEngine({ role }: CalculationEngineProps) {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [projectRef, setProjectRef] = useState({ projectName: '', customerName: '', remarks: '' });
  const [hasCalculated, setHasCalculated] = useState(false);

  // Load company profile for print reports
  useEffect(() => {
    settingsService.getCompanyProfile()
      .then(data => setCompanyProfile(data))
      .catch(() => null);
  }, []);

  // Standard lookup ratings per specification guidelines
  const mccbRatings = [16, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600];
  const ctStandardRatios = [30, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1600, 2000, 2500, 3000];

  const copperCables = [
    { size: '1.5 sqmm', capacity: 14, res: 12.1 },
    { size: '2.5 sqmm', capacity: 21, res: 7.41 },
    { size: '4 sqmm', capacity: 28, res: 4.61 },
    { size: '6 sqmm', capacity: 36, res: 3.08 },
    { size: '10 sqmm', capacity: 50, res: 1.83 },
    { size: '16 sqmm', capacity: 66, res: 1.15 },
    { size: '25 sqmm', capacity: 88, res: 0.727 },
    { size: '35 sqmm', capacity: 109, res: 0.524 },
    { size: '50 sqmm', capacity: 131, res: 0.387 },
    { size: '70 sqmm', capacity: 167, res: 0.268 },
    { size: '95 sqmm', capacity: 202, res: 0.193 },
    { size: '120 sqmm', capacity: 234, res: 0.153 },
    { size: '150 sqmm', capacity: 263, res: 0.124 },
    { size: '185 sqmm', capacity: 300, res: 0.099 },
    { size: '240 sqmm', capacity: 351, res: 0.075 },
    { size: '300 sqmm', capacity: 402, res: 0.060 }
  ];

  const alumCables = [
    { size: '4 sqmm', capacity: 18, res: 7.61 },
    { size: '6 sqmm', capacity: 23, res: 5.08 },
    { size: '10 sqmm', capacity: 32, res: 3.02 },
    { size: '16 sqmm', capacity: 43, res: 1.91 },
    { size: '25 sqmm', capacity: 57, res: 1.20 },
    { size: '35 sqmm', capacity: 70, res: 0.86 },
    { size: '50 sqmm', capacity: 84, res: 0.64 },
    { size: '70 sqmm', capacity: 107, res: 0.44 },
    { size: '95 sqmm', capacity: 130, res: 0.32 },
    { size: '120 sqmm', capacity: 151, res: 0.25 },
    { size: '150 sqmm', capacity: 170, res: 0.21 },
    { size: '185 sqmm', capacity: 194, res: 0.16 },
    { size: '240 sqmm', capacity: 227, res: 0.12 },
    { size: '300 sqmm', capacity: 260, res: 0.10 }
  ];

  // Helper selectors
  const selectMCCB = (current: number) => {
    const target = current * 1.25;
    return (mccbRatings.find(r => r >= target) || mccbRatings[mccbRatings.length - 1]) + 'A';
  };

  const selectCT = (current: number) => {
    const target = current * 1.25;
    const ratio = ctStandardRatios.find(r => r >= target) || ctStandardRatios[ctStandardRatios.length - 1];
    return `${ratio}/5A`;
  };

  const selectCable = (current: number, material: 'Copper' | 'Aluminium') => {
    const target = current * 1.25;
    const list = material === 'Copper' ? copperCables : alumCables;
    const match = list.find(c => c.capacity >= target) || list[list.length - 1];
    return `${match.size} ${material}`;
  };

  const selectBusbar = (current: number) => {
    const cuArea = current / 1.5;
    const size = cuArea <= 60 ? '20x3' : cuArea <= 75 ? '25x3' : cuArea <= 125 ? '25x5' : cuArea <= 150 ? '30x5' : cuArea <= 200 ? '40x5' : cuArea <= 300 ? '50x6' : '100x10';
    return `${size} Cu Busbar`;
  };

  // State definitions for 13 calculators
  const [loadIn, setLoadIn] = useState({ value: 55, unit: 'kVA' as 'kW' | 'kVA', voltage: 415, pf: 0.85, phase: 'Three Phase' });
  const [dgIn, setDgIn] = useState({ load: 40, pf: 0.8, voltage: 415 });
  const [transIn, setTransIn] = useState({ kva: 500, priVolts: 11000, secVolts: 415, impedance: 5 });
  const [ctptIn, setCtptIn] = useState({ loadCurrent: 77, priVolts: 11000, secVolts: 110 });
  const [cableIn, setCableIn] = useState({ current: 63, length: 100, material: 'Copper' as 'Copper' | 'Aluminium', voltage: 415 });
  const [busbarIn, setBusbarIn] = useState({ current: 77, material: 'Copper' as 'Copper' | 'Aluminium' });
  const [mccbIn, setMccbIn] = useState({ flc: 80 });
  const [heatIn, setHeatIn] = useState({ mccb: 2, contactor: 3, relay: 0, smps: 1, plc: 0 });
  const [fanIn, setFanIn] = useState({ heat: 300, tempRise: 10 });
  const [earthIn, setEarthIn] = useState({ fault: 10, duration: 1, material: 'GI' as 'GI' | 'Copper' });
  const [scIn, setScIn] = useState({ flc: 695, impedance: 5, voltage: 415 });
  const [apfcIn, setApfcIn] = useState({ kw: 120, existPf: 0.75, targetPf: 0.98 });
  const [wizardIn, setWizardIn] = useState({ kva: 55, voltage: 415, pf: 0.85, cableLength: 80, material: 'Copper' as 'Copper' | 'Aluminium', mccbQty: 2, contactorQty: 3, smpsQty: 1, tempRise: 10, faultDuration: 1, impedance: 5 });

  // Outputs state maps
  const [loadOut, setLoadOut] = useState<any>(null);
  const [dgOut, setDgOut] = useState<any>(null);
  const [transOut, setTransOut] = useState<any>(null);
  const [ctptOut, setCtptOut] = useState<any>(null);
  const [cableOut, setCableOut] = useState<any>(null);
  const [busbarOut, setBusbarOut] = useState<any>(null);
  const [mccbOut, setMccbOut] = useState<any>(null);
  const [heatOut, setHeatOut] = useState<any>(null);
  const [fanOut, setFanOut] = useState<any>(null);
  const [earthOut, setEarthOut] = useState<any>(null);
  const [scOut, setScOut] = useState<any>(null);
  const [apfcOut, setApfcOut] = useState<any>(null);
  const [wizardOut, setWizardOut] = useState<any>(null);

  const modules: CalculatorModule[] = [
    { id: 'load', title: 'Load Calculator', description: 'Evaluate FLC, and select recommended MCCB, CT, Cables, and Busbars.', category: 'Electrical', icon: <Zap className="text-yellow-500 h-5 w-5" /> },
    { id: 'dg', title: 'DG Calculator', description: 'Determine kVA rating, FLC, MCCB frame, and output sizing requirements.', category: 'Electrical', icon: <Activity className="text-red-500 h-5 w-5" /> },
    { id: 'transformer', title: 'Transformer Calculator', description: 'Primary and secondary full load currents and fault levels.', category: 'Electrical', icon: <Cpu className="text-cyan-500 h-5 w-5" /> },
    { id: 'ctpt', title: 'CT/PT Calculator', description: 'Sizes accurate CT ratios and outputs exact PT ratios.', category: 'Electrical', icon: <Sliders className="text-green-500 h-5 w-5" /> },
    { id: 'cable', title: 'Cable Calculator', description: 'Sizes cables and computes voltage drop percentages.', category: 'Electrical', icon: <Wrench className="text-blue-500 h-5 w-5" /> },
    { id: 'busbar', title: 'Busbar Calculator', description: 'Calculate cross-sectional area and choose recommended busbar.', category: 'Electrical', icon: <Layers className="text-orange-500 h-5 w-5" /> },
    { id: 'mccb', title: 'MCCB Selector', description: 'Sizes starter protection breakers and suggests breaking capacity.', category: 'Electrical', icon: <ShieldAlert className="text-purple-500 h-5 w-5" /> },
    { id: 'heat', title: 'Heat Dissipation Calculator', description: 'Calculates total panel heat loss inside the enclosure.', category: 'Mechanical', icon: <Flame className="text-rose-500 h-5 w-5" /> },
    { id: 'fan', title: 'Fan Selector', description: 'Calculate required CFM extraction airflow parameters.', category: 'Mechanical', icon: <Wind className="text-lime-500 h-5 w-5" /> },
    { id: 'earthing', title: 'Earthing Calculator', description: 'Sizes strip size and cable size based on short circuit ratings.', category: 'Electrical', icon: <Layers className="text-emerald-500 h-5 w-5" /> },
    { id: 'short-circuit', title: 'Short Circuit Calculator', description: 'Predict short circuit currents in kA and MVA fault levels.', category: 'Electrical', icon: <Activity className="text-indigo-500 h-5 w-5" /> },
    { id: 'apfc', title: 'APFC Calculator', description: 'Size capacitor bank stages required to hit target PF.', category: 'Systems', icon: <Sliders className="text-fuchsia-500 h-5 w-5" /> },
    { id: 'complete-panel', title: 'Complete Panel Design Wizard', description: 'BOM & layout sizing wizard executing sequential calculation steps.', category: 'Integrated', icon: <ClipboardList className="text-indigo-600 h-5 w-5" /> }
  ];

  // Calculation Logic Functions triggered by button click
  const runLoadCalc = () => {
    if (!loadIn.value || !loadIn.voltage || !loadIn.pf) {
      toast.error('Please fill all parameters');
      return;
    }
    const isThree = loadIn.phase === 'Three Phase';
    const divisor = isThree ? (1.732 * loadIn.voltage) : loadIn.voltage;
    let current = 0;
    if (loadIn.unit === 'kVA') {
      current = (loadIn.value * 1000) / divisor;
    } else {
      current = (loadIn.value * 1000) / (divisor * loadIn.pf);
    }
    const roundedCurrent = parseFloat(current.toFixed(1));
    const mccb = selectMCCB(roundedCurrent);
    const ct = selectCT(roundedCurrent);
    const cable = selectCable(roundedCurrent, 'Copper');
    const busbar = selectBusbar(roundedCurrent);

    setLoadOut({ current: roundedCurrent, mccb, ct, cable, busbar });
    setHasCalculated(true);
    toast.success('Calculations updated!');
  };

  const runDgCalc = () => {
    if (!dgIn.load || !dgIn.pf || !dgIn.voltage) {
      toast.error('Please fill all parameters');
      return;
    }
    const kva = dgIn.load / dgIn.pf;
    const current = (kva * 1000) / (1.732 * dgIn.voltage);
    const roundedCurrent = parseFloat(current.toFixed(1));
    
    setDgOut({
      kva: Math.ceil(kva),
      current: roundedCurrent,
      mccb: selectMCCB(roundedCurrent),
      ct: selectCT(roundedCurrent),
      cable: selectCable(roundedCurrent, 'Aluminium')
    });
    setHasCalculated(true);
    toast.success('DG calculations completed!');
  };

  const runTransCalc = () => {
    if (!transIn.kva || !transIn.priVolts || !transIn.secVolts || !transIn.impedance) {
      toast.error('Please fill all parameters');
      return;
    }
    const priFlc = (transIn.kva * 1000) / (1.732 * transIn.priVolts);
    const secFlc = (transIn.kva * 1000) / (1.732 * transIn.secVolts);
    const fault = (secFlc * 100) / transIn.impedance;

    setTransOut({
      priFlc: parseFloat(priFlc.toFixed(1)),
      secFlc: parseFloat(secFlc.toFixed(1)),
      faultCurrent: parseFloat((fault / 1000).toFixed(1))
    });
    setHasCalculated(true);
    toast.success('Transformer calculations completed!');
  };

  const runCtptCalc = () => {
    if (!ctptIn.loadCurrent || !ctptIn.priVolts || !ctptIn.secVolts) {
      toast.error('Please fill all parameters');
      return;
    }
    const ctTarget = ctptIn.loadCurrent * 1.25;
    const ctMatch = ctStandardRatios.find(c => c >= ctTarget) || ctStandardRatios[ctStandardRatios.length - 1];
    const ptRatio = (ctptIn.priVolts / ctptIn.secVolts).toFixed(1);

    setCtptOut({
      ctRatio: `${ctMatch}/5A`,
      ptRatio: `${ptRatio}:1`
    });
    setHasCalculated(true);
    toast.success('CT/PT ratios sized!');
  };

  const runCableCalc = () => {
    if (!cableIn.current || !cableIn.length || !cableIn.voltage) {
      toast.error('Please fill all parameters');
      return;
    }
    const size = selectCable(cableIn.current, cableIn.material);
    const sizeOnly = size.split(' ')[0] + ' ' + size.split(' ')[1];
    
    // Approximate Resistance lookup
    const list = cableIn.material === 'Copper' ? copperCables : alumCables;
    const R = list.find(c => size.startsWith(c.size))?.res || 0.15;
    
    const vd = (1.732 * cableIn.current * R * cableIn.length) / 1000;
    const vdP = (vd / cableIn.voltage) * 100;

    setCableOut({
      cableSize: size,
      voltageDrop: parseFloat(vd.toFixed(1)),
      voltageDropPct: parseFloat(vdP.toFixed(2))
    });
    setHasCalculated(true);
    toast.success('Cable sizing complete!');
  };

  const runBusbarCalc = () => {
    if (!busbarIn.current) {
      toast.error('Please enter current');
      return;
    }
    const divisor = busbarIn.material === 'Copper' ? 1.5 : 1.0;
    const area = busbarIn.current / divisor;
    const width = busbarIn.current > 630 ? 50 : 25;
    const thick = busbarIn.current > 630 ? 10 : 3;

    setBusbarOut({
      area: parseFloat(area.toFixed(1)),
      recommended: `${width}x${thick} mm ${busbarIn.material} Busbar`
    });
    setHasCalculated(true);
    toast.success('Busbar area sized!');
  };

  const runMccbCalc = () => {
    if (!mccbIn.flc) {
      toast.error('Please enter FLC');
      return;
    }
    const rating = selectMCCB(mccbIn.flc);
    setMccbOut({
      rating,
      breaking: mccbIn.flc > 400 ? '50 kA' : '36 kA'
    });
    setHasCalculated(true);
    toast.success('MCCB selected!');
  };

  const runHeatCalc = () => {
    const total = (heatIn.mccb * 10) + (heatIn.contactor * 15) + (heatIn.relay * 3) + (heatIn.smps * 25) + (heatIn.plc * 15);
    setHeatOut({ totalWatts: total });
    setHasCalculated(true);
    toast.success('Heat dissipation calculated!');
  };

  const runFanCalc = () => {
    if (!fanIn.heat || !fanIn.tempRise) {
      toast.error('Please fill parameters');
      return;
    }
    const cfm = (3.16 * fanIn.heat) / fanIn.tempRise;
    setFanOut({
      cfm: Math.ceil(cfm),
      fans: Math.ceil(cfm / 60)
    });
    setHasCalculated(true);
    toast.success('Fan CFM sized!');
  };

  const runEarthCalc = () => {
    if (!earthIn.fault || !earthIn.duration) {
      toast.error('Please enter fault values');
      return;
    }
    const K = earthIn.material === 'GI' ? 80 : 135;
    const area = (earthIn.fault * 1000 * Math.sqrt(earthIn.duration)) / K;
    const stripSize = `${Math.ceil(area / 3)}x3 mm ${earthIn.material} Strip`;

    setEarthOut({
      area: Math.ceil(area),
      strip: stripSize,
      cable: `${Math.ceil(area)} sqmm ${earthIn.material} Cable`
    });
    setHasCalculated(true);
    toast.success('Earthing sizing complete!');
  };

  const runScCalc = () => {
    if (!scIn.flc || !scIn.impedance || !scIn.voltage) {
      toast.error('Please fill parameters');
      return;
    }
    const fault = (scIn.flc * 100) / scIn.impedance;
    const mva = 1.732 * scIn.voltage * (fault / 1000) / 1000;

    setScOut({
      kA: parseFloat((fault / 1000).toFixed(1)),
      mva: parseFloat(mva.toFixed(1))
    });
    setHasCalculated(true);
    toast.success('Short circuit calculations complete!');
  };

  const runApfcCalc = () => {
    if (!apfcIn.kw || !apfcIn.existPf || !apfcIn.targetPf) {
      toast.error('Please fill parameters');
      return;
    }
    const a1 = Math.acos(apfcIn.existPf);
    const a2 = Math.acos(apfcIn.targetPf);
    const kvar = apfcIn.kw * (Math.tan(a1) - Math.tan(a2));

    setApfcOut({
      kvar: Math.ceil(kvar)
    });
    setHasCalculated(true);
    toast.success('APFC capacitor bank sized!');
  };

  const runWizardCalc = () => {
    // 1. Load calculation (using kVA formula example: 55kVA)
    const current = (wizardIn.kva * 1000) / (1.732 * wizardIn.voltage);
    const flc = parseFloat(current.toFixed(1));

    // 2. MCCB
    const mccb = selectMCCB(flc);

    // 3. CT
    const ct = selectCT(flc);

    // 4. Cable
    const cable = selectCable(flc, wizardIn.material);

    // 5. Busbar
    const busbar = selectBusbar(flc);

    // 6. Fault Current
    const secFlc = flc;
    const fault = (secFlc * 100) / wizardIn.impedance;

    // 7. Heat Dissipation
    const heat = (wizardIn.mccbQty * 10) + (wizardIn.contactorQty * 15) + (wizardIn.smpsQty * 25);

    // 8. Fan Selection
    const cfm = (3.16 * heat) / wizardIn.tempRise;
    const fanQty = Math.ceil(cfm / 60);

    // 9. Earthing Sizing
    const K = wizardIn.material === 'Copper' ? 135 : 80;
    const earthArea = ((fault / 1000) * 1000 * Math.sqrt(wizardIn.faultDuration)) / K;
    const earthStrip = `${Math.ceil(earthArea / 3)}x3 mm ${wizardIn.material === 'Copper' ? 'Copper' : 'GI'} Strip`;

    setWizardOut({
      flc,
      mccb,
      ct,
      cable,
      busbar,
      faultCurrentKA: parseFloat((fault / 1000).toFixed(1)),
      heatLoss: heat,
      fanQty,
      cfm: Math.ceil(cfm),
      earthStrip
    });
    setHasCalculated(true);
    toast.success('Design Wizard processing sequence completed successfully!');
  };

  // Reset parameters mapping
  const resetForm = () => {
    setHasCalculated(false);
    if (activeModule === 'load') {
      setLoadIn({ value: 55, unit: 'kVA', voltage: 415, pf: 0.85, phase: 'Three Phase' });
      setLoadOut(null);
    } else if (activeModule === 'dg') {
      setDgIn({ load: 40, pf: 0.8, voltage: 415 });
      setDgOut(null);
    } else if (activeModule === 'transformer') {
      setTransIn({ kva: 500, priVolts: 11000, secVolts: 415, impedance: 5 });
      setTransOut(null);
    } else if (activeModule === 'ctpt') {
      setCtptIn({ loadCurrent: 77, priVolts: 11000, secVolts: 110 });
      setCtptOut(null);
    } else if (activeModule === 'cable') {
      setCableIn({ current: 63, length: 100, material: 'Copper', voltage: 415 });
      setCableOut(null);
    } else if (activeModule === 'busbar') {
      setBusbarIn({ current: 77, material: 'Copper' });
      setBusbarOut(null);
    } else if (activeModule === 'mccb') {
      setMccbIn({ flc: 80 });
      setMccbOut(null);
    } else if (activeModule === 'heat') {
      setHeatIn({ mccb: 2, contactor: 3, relay: 0, smps: 1, plc: 0 });
      setHeatOut(null);
    } else if (activeModule === 'fan') {
      setFanIn({ heat: 300, tempRise: 10 });
      setFanOut(null);
    } else if (activeModule === 'earthing') {
      setEarthIn({ fault: 10, duration: 1, material: 'GI' });
      setEarthOut(null);
    } else if (activeModule === 'short-circuit') {
      setScIn({ flc: 695, impedance: 5, voltage: 415 });
      setScOut(null);
    } else if (activeModule === 'apfc') {
      setApfcIn({ kw: 120, existPf: 0.75, targetPf: 0.98 });
      setApfcOut(null);
    } else if (activeModule === 'complete-panel') {
      setWizardIn({ kva: 55, voltage: 415, pf: 0.85, cableLength: 80, material: 'Copper', mccbQty: 2, contactorQty: 3, smpsQty: 1, tempRise: 10, faultDuration: 1, impedance: 5 });
      setWizardOut(null);
    }
  };

  // HTML print layout templates mapping
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Print popup blocked. Check browser permissions.');
      return;
    }
    const mod = modules.find(m => m.id === activeModule);
    if (!mod) return;

    let paramsHtml = '';
    let resultsHtml = '';
    let formulaStr = '';

    if (activeModule === 'load' && loadOut) {
      paramsHtml = `
        <tr><td>Load Value</td><td><strong>${loadIn.value} ${loadIn.unit}</strong></td></tr>
        <tr><td>Voltage</td><td><strong>${loadIn.voltage} V</strong></td></tr>
        <tr><td>Power Factor</td><td><strong>${loadIn.pf}</strong></td></tr>
        <tr><td>Phase</td><td><strong>${loadIn.phase}</strong></td></tr>
      `;
      resultsHtml = `
        <tr><td>Calculated FLC</td><td><strong>${loadOut.current} A</strong></td></tr>
        <tr><td>Recommended MCCB</td><td><strong>${loadOut.mccb}</strong></td></tr>
        <tr><td>Recommended CT</td><td><strong>${loadOut.ct}</strong></td></tr>
        <tr><td>Recommended Cable</td><td><strong>${loadOut.cable}</strong></td></tr>
        <tr><td>Recommended Busbar</td><td><strong>${loadOut.busbar}</strong></td></tr>
      `;
      formulaStr = loadIn.unit === 'kVA' 
        ? 'Current = (kVA × 1000) / (1.732 × Voltage)' 
        : 'Current = (kW × 1000) / (1.732 × Voltage × PF)';
    } else if (activeModule === 'dg' && dgOut) {
      paramsHtml = `
        <tr><td>Connected Load</td><td><strong>${dgIn.load} kW</strong></td></tr>
        <tr><td>Power Factor</td><td><strong>${dgIn.pf}</strong></td></tr>
        <tr><td>Voltage</td><td><strong>${dgIn.voltage} V</strong></td></tr>
      `;
      resultsHtml = `
        <tr><td>Required DG Rating</td><td><strong>${dgOut.kva} kVA</strong></td></tr>
        <tr><td>Full Load Current</td><td><strong>${dgOut.current} A</strong></td></tr>
        <tr><td>Recommended MCCB</td><td><strong>${dgOut.mccb}</strong></td></tr>
        <tr><td>Recommended CT Ratio</td><td><strong>${dgOut.ct}</strong></td></tr>
        <tr><td>Recommended Cable</td><td><strong>${dgOut.cable}</strong></td></tr>
      `;
      formulaStr = 'DG (kVA) = Load / PF; DG Current = (kVA × 1000) / (1.732 × Voltage)';
    } else if (activeModule === 'transformer' && transOut) {
      paramsHtml = `
        <tr><td>Transformer Rating</td><td><strong>${transIn.kva} kVA</strong></td></tr>
        <tr><td>Primary Voltage</td><td><strong>${transIn.priVolts} V</strong></td></tr>
        <tr><td>Secondary Voltage</td><td><strong>${transIn.secVolts} V</strong></td></tr>
        <tr><td>Impedance %</td><td><strong>${transIn.impedance} %</strong></td></tr>
      `;
      resultsHtml = `
        <tr><td>Primary FLC</td><td><strong>${transOut.priFlc} A</strong></td></tr>
        <tr><td>Secondary FLC</td><td><strong>${transOut.secFlc} A</strong></td></tr>
        <tr><td>Fault Current</td><td><strong>${transOut.faultCurrent} kA</strong></td></tr>
      `;
      formulaStr = 'Current = (kVA × 1000) / (1.732 × Voltage); Fault Current = (FLC × 100) / Impedance %';
    } else if (activeModule === 'ctpt' && ctptOut) {
      paramsHtml = `
        <tr><td>Load Current</td><td><strong>${ctptIn.loadCurrent} A</strong></td></tr>
        <tr><td>Primary Voltage</td><td><strong>${ctptIn.priVolts} V</strong></td></tr>
        <tr><td>Secondary Voltage</td><td><strong>${ctptIn.secVolts} V</strong></td></tr>
      `;
      resultsHtml = `
        <tr><td>Recommended CT Ratio</td><td><strong>${ctptOut.ctRatio}</strong></td></tr>
        <tr><td>Recommended PT Ratio</td><td><strong>${ctptOut.ptRatio}</strong></td></tr>
      `;
      formulaStr = 'CT Current = 1.25 × Load Current; PT Ratio = Primary / Secondary';
    } else if (activeModule === 'cable' && cableOut) {
      paramsHtml = `
        <tr><td>Load Current</td><td><strong>${cableIn.current} A</strong></td></tr>
        <tr><td>Length</td><td><strong>${cableIn.length} m</strong></td></tr>
        <tr><td>Cable Material</td><td><strong>${cableIn.material}</strong></td></tr>
        <tr><td>Voltage</td><td><strong>${cableIn.voltage} V</strong></td></tr>
      `;
      resultsHtml = `
        <tr><td>Recommended Cable</td><td><strong>${cableOut.cableSize}</strong></td></tr>
        <tr><td>Voltage Drop</td><td><strong>${cableOut.voltageDrop} V</strong></td></tr>
        <tr><td>Voltage Drop %</td><td><strong>${cableOut.voltageDropPct} %</strong></td></tr>
      `;
      formulaStr = 'Voltage Drop = 1.732 × I × R × L; Voltage Drop % = (VD / Voltage) × 100';
    } else if (activeModule === 'busbar' && busbarOut) {
      paramsHtml = `
        <tr><td>Load Current</td><td><strong>${busbarIn.current} A</strong></td></tr>
        <tr><td>Material</td><td><strong>${busbarIn.material}</strong></td></tr>
      `;
      resultsHtml = `
        <tr><td>Calculated Busbar Area</td><td><strong>${busbarOut.area} mm²</strong></td></tr>
        <tr><td>Recommended Busbar Size</td><td><strong>${busbarOut.recommended}</strong></td></tr>
      `;
      formulaStr = busbarIn.material === 'Copper' ? 'Copper Area = Current / 1.5' : 'Aluminium Area = Current / 1.0';
    } else if (activeModule === 'mccb' && mccbOut) {
      paramsHtml = `
        <tr><td>Load Current</td><td><strong>${mccbIn.flc} A</strong></td></tr>
      `;
      resultsHtml = `
        <tr><td>Recommended MCCB Rating</td><td><strong>${mccbOut.rating}</strong></td></tr>
        <tr><td>Breaking Capacity</td><td><strong>${mccbOut.breaking}</strong></td></tr>
      `;
      formulaStr = 'MCCB Rating = 1.25 × FLC (Sized upward to standard steps)';
    } else if (activeModule === 'heat' && heatOut) {
      paramsHtml = `
        <tr><td>MCCB Quantity</td><td><strong>${heatIn.mccb}</strong></td></tr>
        <tr><td>Contactor Quantity</td><td><strong>${heatIn.contactor}</strong></td></tr>
        <tr><td>Relay Quantity</td><td><strong>${heatIn.relay}</strong></td></tr>
        <tr><td>SMPS Quantity</td><td><strong>${heatIn.smps}</strong></td></tr>
        <tr><td>PLC Quantity</td><td><strong>${heatIn.plc}</strong></td></tr>
      `;
      resultsHtml = `
        <tr><td>Total Heat Loss</td><td><strong>${heatOut.totalWatts} W</strong></td></tr>
      `;
      formulaStr = 'Total Heat = Sum of Component Losses (MCCB=10W, Contactor=15W, Relay=3W, SMPS=25W, PLC=15W)';
    } else if (activeModule === 'fan' && fanOut) {
      paramsHtml = `
        <tr><td>Total Heat Load</td><td><strong>${fanIn.heat} W</strong></td></tr>
        <tr><td>Allowed Temperature Rise</td><td><strong>${fanIn.tempRise} °C</strong></td></tr>
      `;
      resultsHtml = `
        <tr><td>Airflow Required</td><td><strong>${fanOut.cfm} CFM</strong></td></tr>
        <tr><td>Recommended Fan quantity</td><td><strong>${fanOut.fans} Fans (60 CFM each)</strong></td></tr>
      `;
      formulaStr = 'CFM = (3.16 × Heat Load) / Temperature Rise';
    } else if (activeModule === 'earthing' && earthOut) {
      paramsHtml = `
        <tr><td>Fault Current</td><td><strong>${earthIn.fault} kA</strong></td></tr>
        <tr><td>Fault Duration</td><td><strong>${earthIn.duration} sec</strong></td></tr>
        <tr><td>Material</td><td><strong>${earthIn.material}</strong></td></tr>
      `;
      resultsHtml = `
        <tr><td>Calculated Earth Area</td><td><strong>${earthOut.area} mm²</strong></td></tr>
        <tr><td>Recommended Strip Size</td><td><strong>${earthOut.strip}</strong></td></tr>
        <tr><td>Recommended Cable Size</td><td><strong>${earthOut.cable}</strong></td></tr>
      `;
      formulaStr = 'S = (I × √t) / K (K=80 for GI, 135 for Copper)';
    } else if (activeModule === 'short-circuit' && scOut) {
      paramsHtml = `
        <tr><td>Load FLC</td><td><strong>${scIn.flc} A</strong></td></tr>
        <tr><td>Impedance %</td><td><strong>${scIn.impedance} %</strong></td></tr>
        <tr><td>Voltage</td><td><strong>${scIn.voltage} V</strong></td></tr>
      `;
      resultsHtml = `
        <tr><td>Fault Current (Isc)</td><td><strong>${scOut.kA} kA</strong></td></tr>
        <tr><td>Fault Level (MVA)</td><td><strong>${scOut.mva} MVA</strong></td></tr>
      `;
      formulaStr = 'Fault Current = (FLC × 100) / Impedance %; Fault MVA = 1.732 × V × Isc';
    } else if (activeModule === 'apfc' && apfcOut) {
      paramsHtml = `
        <tr><td>Load Value</td><td><strong>${apfcIn.kw} kW</strong></td></tr>
        <tr><td>Existing Power Factor</td><td><strong>${apfcIn.existPf}</strong></td></tr>
        <tr><td>Target Power Factor</td><td><strong>${apfcIn.targetPf}</strong></td></tr>
      `;
      resultsHtml = `
        <tr><td>Capacitor Bank Sizing</td><td><strong>${apfcOut.kvar} kVAR</strong></td></tr>
      `;
      formulaStr = 'kVAR = kW × (Tanφ1 − Tanφ2)';
    } else if (activeModule === 'complete-panel' && wizardOut) {
      paramsHtml = `
        <tr><td>DG Set Rating</td><td><strong>${wizardIn.kva} kVA</strong></td></tr>
        <tr><td>Panel System Voltage</td><td><strong>${wizardIn.voltage} V</strong></td></tr>
        <tr><td>Power Factor</td><td><strong>${wizardIn.pf}</strong></td></tr>
      `;
      resultsHtml = `
        <tr><td colspan="2" style="background:#cbd5e1; font-weight:bold;">ELECTRICAL RECOMMENDATIONS</td></tr>
        <tr><td>Calculated FLC</td><td><strong>${wizardOut.flc} A</strong></td></tr>
        <tr><td>Recommended MCCB</td><td><strong>${wizardOut.mccb}</strong></td></tr>
        <tr><td>Recommended CT</td><td><strong>${wizardOut.ct}</strong></td></tr>
        <tr><td>Recommended Cable</td><td><strong>${wizardOut.cable}</strong></td></tr>
        <tr><td>Recommended Busbar</td><td><strong>${wizardOut.busbar}</strong></td></tr>
        <tr><td>Fault Level</td><td><strong>${wizardOut.faultCurrentKA} kA</strong></td></tr>
        <tr><td colspan="2" style="background:#cbd5e1; font-weight:bold;">MECHANICAL & THERMAL RECOMMENDATIONS</td></tr>
        <tr><td>Heat Loss Dissipation</td><td><strong>${wizardOut.heatLoss} W</strong></td></tr>
        <tr><td>Required Fans Sizing</td><td><strong>${wizardOut.fanQty} Fans (${wizardOut.cfm} CFM)</strong></td></tr>
        <tr><td>Earthing Strip</td><td><strong>${wizardOut.earthStrip}</strong></td></tr>
      `;
      formulaStr = 'Integrated sequential system loop computations (Wizard Sequence)';
    }

    const logoUrl = companyProfile?.logo 
      ? (companyProfile.logo.startsWith('http') ? companyProfile.logo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${companyProfile.logo}`)
      : null;

    printWindow.document.write(`
      <html>
        <head>
          <title>${mod.title} - Design PDF Report</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #334155; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #cbd5e1; padding-bottom: 15px; margin-bottom: 25px; }
            .company { font-size: 20px; font-weight: bold; color: #1e3a8a; }
            .logo { max-height: 50px; }
            .title { font-size: 18px; font-weight: bold; color: #1e293b; text-transform: uppercase; margin-bottom: 20px; }
            .meta { margin-bottom: 25px; font-size: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; }
            .meta p { margin: 4px 0; }
            .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .table td { padding: 10px; border: 1px solid #e2e8f0; font-size: 13px; }
            .table tr:nth-child(even) { background-color: #f8fafc; }
            .formula { background: #f1f5f9; border-left: 3px solid #64748b; padding: 10px; font-size: 12px; font-family: monospace; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company">${companyProfile?.name || 'PCEPL Engineering'}</div>
              <div style="font-size: 10px; color: #64748b;">ERP Engineering Design calculation Tool</div>
            </div>
            <div>
              ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : ''}
            </div>
          </div>
          <div class="title">${mod.title} Report</div>
          
          <div class="meta">
            <p><strong>Project Name:</strong> ${projectRef.projectName || 'Internal Spec calculation'}</p>
            <p><strong>Customer Name:</strong> ${projectRef.customerName || 'N/A'}</p>
            <p><strong>Generated By:</strong> ERP User Session</p>
            <p><strong>Date & Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
            <p><strong>Remarks:</strong> ${projectRef.remarks || 'No remarks provided'}</p>
          </div>

          <div style="font-weight:bold; margin-top:20px; font-size:14px;">Input Parameters</div>
          <table class="table">
            ${paramsHtml}
          </table>

          <div style="font-weight:bold; margin-top:20px; font-size:14px;">Calculation Results</div>
          <table class="table">
            ${resultsHtml}
          </table>

          <div style="font-weight:bold; margin-top:20px; font-size:14px;">Formula Used</div>
          <div class="formula">${formulaStr}</div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getActiveCalculatorTitle = () => {
    return modules.find(m => m.id === activeModule)?.title || 'Calculator';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          {activeModule ? (
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="rounded-full text-slate-400 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
              onClick={() => {
                setActiveModule(null);
                setHasCalculated(false);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Calculator className="h-5 w-5" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeModule ? getActiveCalculatorTitle() : 'Engineering Tools'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeModule ? 'Enter parameters, execute formula calculations, and output recommended components.' : 'Electrical engineering calculations engine for ERP.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!activeModule ? (
        // Dashboard Card Grid Layout
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((m) => (
            <Card 
              key={m.id} 
              className="p-5 bg-white border border-slate-200/80 rounded-2xl hover:shadow-lg hover:border-blue-200 cursor-pointer transition-all duration-300 flex flex-col justify-between group"
              onClick={() => {
                setActiveModule(m.id);
                setHasCalculated(false);
              }}
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                  {m.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{m.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.description}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.category}</span>
                <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Launch →</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // Active Calculator Workspace Form (Top) and Output (Bottom) Layout
        <div className="space-y-6">
          {/* Project Reference Context Card */}
          <Card className="p-6 bg-white border-slate-200/80 rounded-2xl shadow-xs">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Project Context Reference</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">Project Name</label>
                <Input 
                  type="text" 
                  placeholder="e.g. Tata Power Main Panel" 
                  value={projectRef.projectName} 
                  onChange={e => setProjectRef({ ...projectRef, projectName: e.target.value })} 
                  className="h-10 text-sm" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">Customer Name</label>
                <Input 
                  type="text" 
                  placeholder="e.g. Tata Power Ltd" 
                  value={projectRef.customerName} 
                  onChange={e => setProjectRef({ ...projectRef, customerName: e.target.value })} 
                  className="h-10 text-sm" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">Engineer Remarks</label>
                <Input 
                  type="text" 
                  placeholder="e.g. Standard layout recommendations" 
                  value={projectRef.remarks} 
                  onChange={e => setProjectRef({ ...projectRef, remarks: e.target.value })} 
                  className="h-10 text-sm" 
                />
              </div>
            </div>
          </Card>

          {/* Top Form Card */}
          <Card className="p-6 bg-white border-slate-200/80 rounded-2xl shadow-xs space-y-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Input Sizing Parameters</h2>
            
            {/* Input fields selectors based on module */}
            {activeModule === 'load' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Load Value</label>
                  <Input type="number" value={loadIn.value} onChange={e => setLoadIn({ ...loadIn, value: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Load Unit</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm" value={loadIn.unit} onChange={e => setLoadIn({ ...loadIn, unit: e.target.value as any })}>
                    <option value="kVA">kVA</option>
                    <option value="kW">kW</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Voltage (V)</label>
                  <Input type="number" value={loadIn.voltage} onChange={e => setLoadIn({ ...loadIn, voltage: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Power Factor (PF)</label>
                  <Input type="number" step="0.01" value={loadIn.pf} onChange={e => setLoadIn({ ...loadIn, pf: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phase</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm" value={loadIn.phase} onChange={e => setLoadIn({ ...loadIn, phase: e.target.value })}>
                    <option value="Three Phase">Three Phase (3Ø)</option>
                    <option value="Single Phase">Single Phase (1Ø)</option>
                  </select>
                </div>
              </div>
            )}

            {activeModule === 'dg' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Connected Load (kW)</label>
                  <Input type="number" value={dgIn.load} onChange={e => setDgIn({ ...dgIn, load: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Power Factor (PF)</label>
                  <Input type="number" step="0.01" value={dgIn.pf} onChange={e => setDgIn({ ...dgIn, pf: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Voltage (V)</label>
                  <Input type="number" value={dgIn.voltage} onChange={e => setDgIn({ ...dgIn, voltage: Number(e.target.value) })} className="h-10" />
                </div>
              </div>
            )}

            {activeModule === 'transformer' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Transformer Rating (kVA)</label>
                  <Input type="number" value={transIn.kva} onChange={e => setTransIn({ ...transIn, kva: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Primary Voltage (V)</label>
                  <Input type="number" value={transIn.priVolts} onChange={e => setTransIn({ ...transIn, priVolts: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Secondary Voltage (V)</label>
                  <Input type="number" value={transIn.secVolts} onChange={e => setTransIn({ ...transIn, secVolts: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Impedance %</label>
                  <Input type="number" value={transIn.impedance} onChange={e => setTransIn({ ...transIn, impedance: Number(e.target.value) })} className="h-10" />
                </div>
              </div>
            )}

            {activeModule === 'ctpt' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Load Current (A)</label>
                  <Input type="number" value={ctptIn.loadCurrent} onChange={e => setCtptIn({ ...ctptIn, loadCurrent: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Primary Voltage (V)</label>
                  <Input type="number" value={ctptIn.priVolts} onChange={e => setCtptIn({ ...ctptIn, priVolts: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Secondary Voltage (V)</label>
                  <Input type="number" value={ctptIn.secVolts} onChange={e => setCtptIn({ ...ctptIn, secVolts: Number(e.target.value) })} className="h-10" />
                </div>
              </div>
            )}

            {activeModule === 'cable' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Load Current (A)</label>
                  <Input type="number" value={cableIn.current} onChange={e => setCableIn({ ...cableIn, current: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Cable Length (m)</label>
                  <Input type="number" value={cableIn.length} onChange={e => setCableIn({ ...cableIn, length: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Material</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm" value={cableIn.material} onChange={e => setCableIn({ ...cableIn, material: e.target.value as any })}>
                    <option value="Copper">Copper</option>
                    <option value="Aluminium">Aluminium</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Voltage (V)</label>
                  <Input type="number" value={cableIn.voltage} onChange={e => setCableIn({ ...cableIn, voltage: Number(e.target.value) })} className="h-10" />
                </div>
              </div>
            )}

            {activeModule === 'busbar' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Current (A)</label>
                  <Input type="number" value={busbarIn.current} onChange={e => setBusbarIn({ ...busbarIn, current: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Material</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm" value={busbarIn.material} onChange={e => setBusbarIn({ ...busbarIn, material: e.target.value as any })}>
                    <option value="Copper">Copper</option>
                    <option value="Aluminium">Aluminium</option>
                  </select>
                </div>
              </div>
            )}

            {activeModule === 'mccb' && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">FLC Load Current (A)</label>
                  <Input type="number" value={mccbIn.flc} onChange={e => setMccbIn({ ...mccbIn, flc: Number(e.target.value) })} className="h-10" />
                </div>
              </div>
            )}

            {activeModule === 'heat' && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">MCCB Qty</label>
                  <Input type="number" value={heatIn.mccb} onChange={e => setHeatIn({ ...heatIn, mccb: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contactor Qty</label>
                  <Input type="number" value={heatIn.contactor} onChange={e => setHeatIn({ ...heatIn, contactor: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Relay Qty</label>
                  <Input type="number" value={heatIn.relay} onChange={e => setHeatIn({ ...heatIn, relay: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">SMPS Qty</label>
                  <Input type="number" value={heatIn.smps} onChange={e => setHeatIn({ ...heatIn, smps: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">PLC Qty</label>
                  <Input type="number" value={heatIn.plc} onChange={e => setHeatIn({ ...heatIn, plc: Number(e.target.value) })} className="h-10" />
                </div>
              </div>
            )}

            {activeModule === 'fan' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Total Heat Dissipation (W)</label>
                  <Input type="number" value={fanIn.heat} onChange={e => setFanIn({ ...fanIn, heat: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Allowed Temp Rise (°C)</label>
                  <Input type="number" value={fanIn.tempRise} onChange={e => setFanIn({ ...fanIn, tempRise: Number(e.target.value) })} className="h-10" />
                </div>
              </div>
            )}

            {activeModule === 'earthing' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Fault Current (kA)</label>
                  <Input type="number" value={earthIn.fault} onChange={e => setEarthIn({ ...earthIn, fault: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Fault Duration (s)</label>
                  <Input type="number" value={earthIn.duration} onChange={e => setEarthIn({ ...earthIn, duration: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Electrode Material</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm" value={earthIn.material} onChange={e => setEarthIn({ ...earthIn, material: e.target.value as any })}>
                    <option value="GI">GI (Galvanized Iron)</option>
                    <option value="Copper">Copper</option>
                  </select>
                </div>
              </div>
            )}

            {activeModule === 'short-circuit' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Load Current (A)</label>
                  <Input type="number" value={scIn.flc} onChange={e => setScIn({ ...scIn, flc: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Impedance %</label>
                  <Input type="number" value={scIn.impedance} onChange={e => setScIn({ ...scIn, impedance: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Voltage (V)</label>
                  <Input type="number" value={scIn.voltage} onChange={e => setScIn({ ...scIn, voltage: Number(e.target.value) })} className="h-10" />
                </div>
              </div>
            )}

            {activeModule === 'apfc' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Connected Load (kW)</label>
                  <Input type="number" value={apfcIn.kw} onChange={e => setApfcIn({ ...apfcIn, kw: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Existing PF</label>
                  <Input type="number" step="0.01" value={apfcIn.existPf} onChange={e => setApfcIn({ ...apfcIn, existPf: Number(e.target.value) })} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target PF</label>
                  <Input type="number" step="0.01" value={apfcIn.targetPf} onChange={e => setApfcIn({ ...apfcIn, targetPf: Number(e.target.value) })} className="h-10" />
                </div>
              </div>
            )}

            {activeModule === 'complete-panel' && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">DG Set Rating (kVA)</label>
                  <Input type="number" value={wizardIn.kva} onChange={e => setWizardIn({ ...wizardIn, kva: Number(e.target.value) })} className="h-10 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Voltage (V)</label>
                  <Input type="number" value={wizardIn.voltage} onChange={e => setWizardIn({ ...wizardIn, voltage: Number(e.target.value) })} className="h-10 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Power Factor (PF)</label>
                  <Input type="number" step="0.01" value={wizardIn.pf} onChange={e => setWizardIn({ ...wizardIn, pf: Number(e.target.value) })} className="h-10 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Cable Length (m)</label>
                  <Input type="number" value={wizardIn.cableLength} onChange={e => setWizardIn({ ...wizardIn, cableLength: Number(e.target.value) })} className="h-10 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Cable Material</label>
                  <select className="w-full h-10 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold" value={wizardIn.material} onChange={e => setWizardIn({ ...wizardIn, material: e.target.value as any })}>
                    <option value="Copper">Copper</option>
                    <option value="Aluminium">Aluminium</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">MCCB Qty (Heat)</label>
                  <Input type="number" value={wizardIn.mccbQty} onChange={e => setWizardIn({ ...wizardIn, mccbQty: Number(e.target.value) })} className="h-10 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Contactor Qty (Heat)</label>
                  <Input type="number" value={wizardIn.contactorQty} onChange={e => setWizardIn({ ...wizardIn, contactorQty: Number(e.target.value) })} className="h-10 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Temp Rise Limit (°C)</label>
                  <Input type="number" value={wizardIn.tempRise} onChange={e => setWizardIn({ ...wizardIn, tempRise: Number(e.target.value) })} className="h-10 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Impedance %</label>
                  <Input type="number" value={wizardIn.impedance} onChange={e => setWizardIn({ ...wizardIn, impedance: Number(e.target.value) })} className="h-10 text-sm" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Fields
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (activeModule === 'load') runLoadCalc();
                  if (activeModule === 'dg') runDgCalc();
                  if (activeModule === 'transformer') runTransCalc();
                  if (activeModule === 'ctpt') runCtptCalc();
                  if (activeModule === 'cable') runCableCalc();
                  if (activeModule === 'busbar') runBusbarCalc();
                  if (activeModule === 'mccb') runMccbCalc();
                  if (activeModule === 'heat') runHeatCalc();
                  if (activeModule === 'fan') runFanCalc();
                  if (activeModule === 'earthing') runEarthCalc();
                  if (activeModule === 'short-circuit') runScCalc();
                  if (activeModule === 'apfc') runApfcCalc();
                  if (activeModule === 'complete-panel') runWizardCalc();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10"
              >
                Calculate
              </Button>
            </div>
          </Card>

          {/* Bottom Outputs Card (Shown only after Calculate button is triggered) */}
          {hasCalculated && (
            <Card className="p-6 bg-white border-slate-200/80 rounded-2xl shadow-xs space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sizing Output Calculations</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  className="border-blue-200 hover:bg-blue-50 text-blue-600 text-xs font-bold"
                >
                  <Printer className="h-4 w-4 mr-1.5" /> Export PDF Report
                </Button>
              </div>

              {activeModule === 'load' && loadOut && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Calculated Current:</div>
                      <div className="text-blue-600 font-bold">{loadOut.current} A</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Recommended MCCB:</div>
                      <div>{loadOut.mccb}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Recommended CT Ratio:</div>
                      <div>{loadOut.ct}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Recommended Cable:</div>
                      <div>{loadOut.cable}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Recommended Busbar:</div>
                      <div>{loadOut.busbar}</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Formula Used</div>
                    <div className="font-mono bg-white p-2 rounded-lg border border-slate-200">
                      {loadIn.unit === 'kVA' 
                        ? 'Current = (kVA × 1000) / (1.732 × Voltage)' 
                        : 'Current = (kW × 1000) / (1.732 × Voltage × PF)'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2">Example validation mapping: 55kVA, 415V gives 76.5A. CT ratio matched to 100/5A.</div>
                  </div>
                </div>
              )}

              {activeModule === 'dg' && dgOut && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Required DG Rating:</div>
                      <div className="text-blue-600 font-bold">{dgOut.kva} kVA</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>DG Full Load Current:</div>
                      <div>{dgOut.current} A</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Recommended MCCB:</div>
                      <div>{dgOut.mccb}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Recommended Cable:</div>
                      <div>{dgOut.cable}</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Formula Used</div>
                    <div className="font-mono bg-white p-2 rounded-lg border border-slate-200">
                      DG(kVA) = Load / PF<br />DG Current = (kVA × 1000) / (1.732 × Voltage)
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2">Example reference verification: 40kW connected load at 0.8 PF yields 50kVA rating & 69.5A FLC.</div>
                  </div>
                </div>
              )}

              {activeModule === 'transformer' && transOut && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Primary Current:</div>
                      <div>{transOut.priFlc} A</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Secondary Current:</div>
                      <div>{transOut.secFlc} A</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Secondary Fault Current:</div>
                      <div className="text-red-600 font-bold">{transOut.faultCurrent} kA</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Formula Used</div>
                    <div className="font-mono bg-white p-2 rounded-lg border border-slate-200">
                      Current = (kVA × 1000) / (1.732 × Voltage)<br />Fault Current = (FLC × 100) / Impedance %
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2">Example mapping validation: 500kVA transformer at 415V secondary & 5% Impedance yields secondary FLC of 695A and Fault current of 13.9kA.</div>
                  </div>
                </div>
              )}

              {activeModule === 'ctpt' && ctptOut && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Recommended CT Ratio:</div>
                      <div className="text-blue-600 font-bold">{ctptOut.ctRatio}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Calculated PT Ratio:</div>
                      <div>{ctptOut.ptRatio}</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Formula Used</div>
                    <div className="font-mono bg-white p-2 rounded-lg border border-slate-200">
                      CT Current = 1.25 × Load Current (standardised upwards)<br />PT Ratio = Primary Voltage / Secondary Voltage
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2">Example check: FLC of 77A matches standard CT rating 100/5A.</div>
                  </div>
                </div>
              )}

              {activeModule === 'cable' && cableOut && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Recommended Cable Size:</div>
                      <div className="text-blue-600 font-bold">{cableOut.cableSize}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Voltage Drop (VD):</div>
                      <div>{cableOut.voltageDrop} V</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Voltage Drop %:</div>
                      <div>{cableOut.voltageDropPct} %</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Formula Used</div>
                    <div className="font-mono bg-white p-2 rounded-lg border border-slate-200">
                      VD = 1.732 × I × R × L<br />VD % = (VD / System Voltage) × 100
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'busbar' && busbarOut && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Calculated Cross Section:</div>
                      <div className="text-blue-600 font-bold">{busbarOut.area} mm²</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Recommended Busbar Size:</div>
                      <div>{busbarOut.recommended}</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Formula Used</div>
                    <div className="font-mono bg-white p-2 rounded-lg border border-slate-200">
                      {busbarIn.material === 'Copper' ? 'Copper Area = Current / 1.5' : 'Aluminium Area = Current / 1.0'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2">Example logic check: 77A yields 51.3mm² area resulting in standard 25x3 Copper Busbar (75 mm²).</div>
                  </div>
                </div>
              )}

              {activeModule === 'mccb' && mccbOut && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Recommended Rating:</div>
                      <div className="text-blue-600 font-bold">{mccbOut.rating}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Breaking Capacity Class:</div>
                      <div>{mccbOut.breaking}</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Formula Used</div>
                    <div className="font-mono bg-white p-2 rounded-lg border border-slate-200">
                      MCCB Sizing = 1.25 × FLC (mapped to next higher rating in lookup list)
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'heat' && heatOut && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Total Heat Loss (W):</div>
                      <div className="text-rose-600 font-bold">{heatOut.totalWatts} W</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Formula Used</div>
                    <div className="font-mono bg-white p-2 rounded-lg border border-slate-200">
                      Total Heat = Sum of losses (MCCB=10W, Contactor=15W, Relay=3W, SMPS=25W, PLC=15W)
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2">Example check: 2 MCCBs + 3 Contactors + 1 SMPS yields 90 Watts dissipation.</div>
                  </div>
                </div>
              )}

              {activeModule === 'fan' && fanOut && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Airflow Required:</div>
                      <div className="text-lime-700 font-bold">{fanOut.cfm} CFM</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Recommended Fans:</div>
                      <div>{fanOut.fans} Fans (60 CFM capacity each)</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Formula Used</div>
                    <div className="font-mono bg-white p-2 rounded-lg border border-slate-200">
                      CFM = (3.16 × Heat Load) / Temperature Rise
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2">Example match: Heat load 300W with 10°C rise yields 95 CFM airflow.</div>
                  </div>
                </div>
              )}

              {activeModule === 'earthing' && earthOut && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Calculated Strip Area:</div>
                      <div className="text-emerald-600 font-bold">{earthOut.area} mm²</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Recommended Strip:</div>
                      <div>{earthOut.strip}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Recommended Earth Cable:</div>
                      <div>{earthOut.cable}</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Formula Used</div>
                    <div className="font-mono bg-white p-2 rounded-lg border border-slate-200">
                      S = (I × √t) / K (K=80 for GI, 135 for Copper)
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'short-circuit' && scOut && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Fault Current (Isc):</div>
                      <div className="text-red-600 font-bold">{scOut.kA} kA</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Fault MVA Level:</div>
                      <div>{scOut.mva} MVA</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Formula Used</div>
                    <div className="font-mono bg-white p-2 rounded-lg border border-slate-200">
                      Isc = (FLC × 100) / Impedance %<br />Fault MVA = 1.732 × Voltage × Isc
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'apfc' && apfcOut && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>Capacitor Bank rating:</div>
                      <div className="text-fuchsia-600 font-bold">{apfcOut.kvar} kVAR</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Formula Used</div>
                    <div className="font-mono bg-white p-2 rounded-lg border border-slate-200">
                      kVAR = kW × (Tanφ1 − Tanφ2)
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'complete-panel' && wizardOut && (
                <div className="space-y-6 text-sm text-slate-700 font-semibold">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-100 pb-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calculated Current</div>
                      <div className="text-blue-600 font-bold text-lg mt-1">{wizardOut.flc} A</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MCCB Frame</div>
                      <div className="text-slate-800 font-bold text-lg mt-1">{wizardOut.mccb}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CT Ratio Sized</div>
                      <div className="text-slate-800 font-bold text-lg mt-1">{wizardOut.ct}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-100 pb-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cable Recommended</div>
                      <div className="text-slate-800 font-bold text-md mt-1">{wizardOut.cable}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Busbar Recommended</div>
                      <div className="text-slate-800 font-bold text-md mt-1">{wizardOut.busbar}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Short Circuit Current</div>
                      <div className="text-red-600 font-bold text-md mt-1">{wizardOut.faultCurrentKA} kA</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Panel Heat Dissipation</div>
                      <div className="text-rose-600 font-bold text-md mt-1">{wizardOut.heatLoss} W</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fans Sized</div>
                      <div className="text-lime-700 font-bold text-md mt-1">{wizardOut.fanQty} Fans ({wizardOut.cfm} CFM)</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Earthing strip</div>
                      <div className="text-slate-800 font-bold text-md mt-1">{wizardOut.earthStrip}</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 mt-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Auto-Generated Bill of Materials (BOM)</h3>
                    <table className="w-full text-xs text-left border-collapse bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <th className="p-2">Item Description</th>
                          <th className="p-2">Sizing Specification</th>
                          <th className="p-2 text-right">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="p-2">Main Incomer Breaker (MCCB)</td>
                          <td className="p-2">{wizardOut.mccb} Triple Pole</td>
                          <td className="p-2 text-right">1 No.</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-2">Current Transformer (CT) Set</td>
                          <td className="p-2">{wizardOut.ct} Metering Core</td>
                          <td className="p-2 text-right">3 Nos.</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-2">LT Power Cable Run</td>
                          <td className="p-2">{wizardOut.cable} XLPE Armoured</td>
                          <td className="p-2 text-right">{wizardIn.cableLength} meters</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-2">Main Panel Phase Busbar</td>
                          <td className="p-2">{wizardOut.busbar}</td>
                          <td className="p-2 text-right">1 Set</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-2">Panel Extraction Fan unit</td>
                          <td className="p-2">120x120mm exhaust assembly (60 CFM)</td>
                          <td className="p-2 text-right">{wizardOut.fanQty} Nos.</td>
                        </tr>
                        <tr>
                          <td className="p-2">Enclosure Earthing Strip</td>
                          <td className="p-2">{wizardOut.earthStrip}</td>
                          <td className="p-2 text-right">1 Run</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

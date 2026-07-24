"use client";

import React, { useState, useMemo } from "react";
import { AlertTriangle, ShieldCheck, FileText, Upload, RefreshCw, CheckCircle, Lock, TrendingDown, BarChart3, Scan, Download, Save, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import { canAccessTool, isTrialExpired } from "@/lib/subscription";

interface MatrixItem { date: string; event: string; hospitalRecord: string; expertA: string; expertB: string; riskLevel: "LOW"|"MEDIUM"|"HIGH"; strategicAlert: string; sourcePage?: string; }

const DEMO_DATA: MatrixItem[] = [
  { date: "2024-03-15 08:45", event: "Paramedics Arrive", hospitalRecord: "GCS 15/15. Alert. No head trauma.", expertA: "(Ortho p.3) 'Head strike. GCS 12 at scene.'", expertB: "(Ind Psy p.7) 'Confused — TBI, LOC.'", riskLevel: "HIGH", strategicAlert: "CRITICAL: GCS contradiction 15/15 vs 12. Subpoena original paramedic run sheet.", sourcePage: "Hosp p.1, Ortho p.3" },
  { date: "2024-03-15 09:20", event: "ED Admission", hospitalRecord: "Priority 3. Soft tissue strain. Mybulen.", expertA: "(Ortho p.4) 'Severe pain. Missed C5-C6 herniation.'", expertB: "—", riskLevel: "HIGH", strategicAlert: "ALERT: 'Soft tissue' vs C5-C6 herniation. RAF will argue degenerative.", sourcePage: "Hosp p.2, Ortho p.4" },
  { date: "2024-03-15 14:00", event: "Discharge", hospitalRecord: "Ambulatory. GP 7 days.", expertA: "(Ortho p.5) 'Unable to walk 2 weeks.'", expertB: "—", riskLevel: "MEDIUM", strategicAlert: "14-day treatment gap. Get family affidavits.", sourcePage: "Hosp p.4, Ortho p.5" },
  { date: "2024-04-01", event: "Return to Work", hospitalRecord: "(RAF1) 'Light duties. Full by Apr 15.'", expertA: "—", expertB: "(Ind Psy p.10) 'Totally incapacitated.'", riskLevel: "HIGH", strategicAlert: "FATAL: Self-reported working vs total incapacity. Interview immediately.", sourcePage: "RAF1 p.3, Ind Psy p.10" },
  { date: "2024-06-10", event: "Surgery Scheduled", hospitalRecord: "—", expertA: "(Ortho p.6) 'C5-C6 fusion. R185k.'", expertB: "(Ind Psy p.12) '18mo incapacity.'", riskLevel: "MEDIUM", strategicAlert: "Quantum: surgery + 18mo loss of earnings. Get RAF4 post-surgery.", sourcePage: "Ortho p.6, Ind Psy p.12" },
];

const NEEDS_OCR = ['application/pdf','image/png','image/jpeg','image/jpg','image/tiff','image/webp'];

const UpgradePrompt = ({ user, onDismiss }: { user: any; onDismiss: () => void }) => {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const trialExpired = isTrialExpired(user.trialEndsAt);
  const isTrial = user.subscriptionStatus === 'trial';

  const handleUpgrade = async (tierName: string) => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firmId: user.id, email: user.email, tierName }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert(data.error || 'Payment gateway unavailable. Please try again.');
      }
    } catch {
      alert('Connection error. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CreditCard className="h-8 w-8 text-amber-600" />
      </div>
      <h2 className="text-xl font-extrabold text-slate-800 mb-2">
        {trialExpired ? 'Trial Expired' : isTrial ? 'Free Case Used' : 'Upgrade to Continue'}
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        {trialExpired
          ? 'Your 14-day trial has ended. Choose a plan to continue analysing cases.'
          : 'You\'ve used your free case. Subscribe to unlock unlimited chronologies.'}
      </p>
      <div className="space-y-3 mb-6">
        <button
          onClick={() => handleUpgrade('Professional')}
          disabled={checkoutLoading}
          className="w-full bg-amber-500 text-slate-950 font-bold py-3 rounded-xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {checkoutLoading ? 'Redirecting...' : 'Professional — R7,500/mo (5 cases)'}
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => handleUpgrade('Practice')}
          disabled={checkoutLoading}
          className="w-full border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Practice — R12,500/mo (10 cases)
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => handleUpgrade('Single Case')}
          disabled={checkoutLoading}
          className="w-full border border-slate-200 text-slate-500 font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-all text-sm disabled:opacity-50"
        >
          Single Case — R1,950 once
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Secure payment by Paystack. Cancel anytime. All prices in ZAR.
      </p>
      <button onClick={onDismiss} className="text-xs text-slate-400 hover:text-slate-600 mt-4 underline">
        {trialExpired ? 'Return to dashboard' : 'Continue with demo only'}
      </button>
    </div>
  );
};

export default function ChronolegalAnalysisTool() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1|2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [caseRef, setCaseRef] = useState("");
  const [attorney, setAttorney] = useState("");
  const [claimant, setClaimant] = useState("");
  const [accidentDate, setAccidentDate] = useState("");
  const [hospitalRecord, setHospitalRecord] = useState<File|null>(null);
  const [expertReportA, setExpertReportA] = useState<File|null>(null);
  const [expertReportB, setExpertReportB] = useState<File|null>(null);
  const [matrixData, setMatrixData] = useState<MatrixItem[]>([]);
  const [consented, setConsented] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const stats = useMemo(() => { const h=matrixData.filter(m=>m.riskLevel==="HIGH").length,m=matrixData.filter(m=>m.riskLevel==="MEDIUM").length,l=matrixData.filter(m=>m.riskLevel==="LOW").length; return {high:h,med:m,low:l,total:matrixData.length,quantumRisk:h*300000+m*80000}; },[matrixData]);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    router.push('/auth/login');
    return null;
  }

  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><RefreshCw className="animate-spin text-amber-500" size={32}/></div>;
  }

  // Check subscription access for live analysis
  const sub = {
    plan: user?.subscriptionStatus === 'active' ? 'Professional' : 'Free',
    status: (user?.subscriptionStatus || 'trial') as any,
    trialEndsAt: user?.trialEndsAt || null,
    tokens: user?.tokens || 0,
    monthlyTokens: 5,
  };
  const hasAccess = canAccessTool(sub);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, slot: string) => { if(e.target.files?.[0]){const f=e.target.files[0]; if(slot==="hospital")setHospitalRecord(f); if(slot==="expertA")setExpertReportA(f); if(slot==="expertB")setExpertReportB(f);}};

  const loadDemoCase = () => { setCaseRef("RAF/2024/008921"); setClaimant("Sipho Ndlovu"); setAccidentDate("2024-03-15"); setMatrixData(DEMO_DATA); setIsDemo(true); setReviewedCount(0); setSaved(false); setStep(2); };

  const runOCR = async (file: File, label: string): Promise<string> => { setProcessingStage(`OCR: ${label}...`); const fd=new FormData(); fd.append('file',file); const res=await fetch('/api/ocr',{method:'POST',body:fd}); const data=await res.json(); if(!res.ok)throw new Error(data.error); return data.text; };

  const executeLiveAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess && !isDemo) { setShowUpgrade(true); return; }
    setLoading(true); setError(null);
    if(!hospitalRecord||!expertReportA||!expertReportB){setError("All slots required.");setLoading(false);return;}
    try{
      const ht=NEEDS_OCR.includes(hospitalRecord.type)?await runOCR(hospitalRecord,'Hospital'):await hospitalRecord.text();
      const ea=NEEDS_OCR.includes(expertReportA.type)?await runOCR(expertReportA,'Expert A'):await expertReportA.text();
      const eb=NEEDS_OCR.includes(expertReportB.type)?await runOCR(expertReportB,'Expert B'):await expertReportB.text();
      setProcessingStage("Cross-referencing...");
      const fd=new FormData();fd.append("caseRef",caseRef);fd.append("claimant",claimant);fd.append("accidentDate",accidentDate);
      fd.append("hospitalRecord",new Blob([ht],{type:'text/plain'}),'h.txt');
      fd.append("expertReportA",new Blob([ea],{type:'text/plain'}),'a.txt');
      fd.append("expertReportB",new Blob([eb],{type:'text/plain'}),'b.txt');
      setProcessingStage("Building matrix...");
      const res=await fetch("/api/analyze",{method:"POST",body:fd});const r=await res.json();
      if(!res.ok)throw new Error(r.error);
      setMatrixData(r.data);setIsDemo(false);setReviewedCount(0);setSaved(false);setStep(2);
    }catch(err:any){setError(err.message);}
    finally{setLoading(false);setProcessingStage("");}
  };

  const handleSaveToDashboard = async () => {
    setSaving(true);
    try {
      await fetch('/api/cases', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ caseRef, claimant, attorney, accidentDate, matrixData, status: 'COMPLETED', userId: user?.id }) });
      setSaved(true);
    } catch { setSaved(false); }
    finally { setSaving(false); }
  };

  const handleExportIndex = async () => {
    const payload = { metadata: { caseNumber: caseRef||"2024/29841", division: "GAUTENG DIVISION, JOHANNESBURG", plaintiff: claimant||"PLAINTIFF", defendant: "ROAD ACCIDENT FUND" }, documents: [{id:"1",sectionCode:"A",documentName:"Summons",startPage:1,endPage:12},{id:"2",sectionCode:"B",documentName:"Hospital Records",startPage:1,endPage:45},{id:"3",sectionCode:"C",documentName:"Expert Medico-Legal Reports",startPage:1,endPage:79},{id:"4",sectionCode:"D",documentName:"ChronoLegal SA Analysis Matrix",startPage:1,endPage:matrixData.length+1}] };
    const res = await fetch('/api/export-index', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if (!res.ok) { alert('Export failed.'); return; }
    const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `CaseLines_Index_${(caseRef||'case').replace(/\//g,'_')}.docx`; a.click(); URL.revokeObjectURL(url);
  };

  const markReviewed = () => setReviewedCount(c=>Math.min(c+1,stats.total));
  const confPct = stats.total>0?Math.min(100,Math.round(((stats.total-stats.high+reviewedCount)/stats.total)*100)):0;

  // Show upgrade prompt if user clicked execute without access
  if (showUpgrade) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <header className="bg-slate-950 text-white px-8 py-4 flex justify-between items-center shadow-md">
          <Link href="/" className="flex items-center gap-3 no-underline"><div className="bg-amber-500 font-bold px-2.5 py-1 rounded text-slate-950 text-sm">CL</div><h1 className="text-xl font-bold tracking-tight">ChronoLegal <span className="text-amber-400">AI</span></h1></Link>
          <div className="flex items-center gap-4">
            <button onClick={loadDemoCase} className="text-xs text-slate-400 hover:text-amber-400 font-bold">Load Demo</button>
            <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white">Dashboard</Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-8 pt-20">
          <UpgradePrompt user={user} onDismiss={() => { setShowUpgrade(false); loadDemoCase(); }} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="bg-slate-950 text-white text-xs py-2 px-4 flex justify-center items-center gap-6 font-mono">
        <span className="flex items-center gap-1.5"><Lock size={12} className="text-emerald-400"/> {user?.subscriptionStatus === 'active' ? 'Professional Plan' : user?.subscriptionStatus === 'trial' ? `Trial · ${user?.tokens || 0} case${user?.tokens !== 1 ? 's' : ''} remaining` : 'Free Tier'}</span>
        <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-400"/> POPIA Compliant</span>
        <span className="flex items-center gap-1.5"><Scan size={12} className="text-emerald-400"/> OCR + CaseLines Ready</span>
        {!hasAccess && (
          <button onClick={() => setShowUpgrade(true)} className="flex items-center gap-1.5 bg-amber-500 text-slate-950 px-3 py-0.5 rounded-full text-xs font-bold hover:bg-amber-400">
            <CreditCard size={12} /> Upgrade
          </button>
        )}
      </div>
      <header className="bg-slate-950 text-white px-8 py-4 flex justify-between items-center shadow-md border-t border-slate-800">
        <Link href="/" className="flex items-center gap-3 no-underline"><div className="bg-amber-500 font-bold px-2.5 py-1 rounded text-slate-950 text-sm">CL</div><h1 className="text-xl font-bold tracking-tight">ChronoLegal <span className="text-amber-400">AI</span></h1></Link>
        <div className="flex items-center gap-4">
          <button onClick={loadDemoCase} className="text-xs text-slate-400 hover:text-amber-400 font-bold">Load Demo</button>
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white">Dashboard</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-center gap-12 mb-10 text-sm font-semibold text-slate-400"><div className={`flex items-center gap-2 pb-2 border-b-2 ${step===1?"text-slate-900 border-amber-500":"text-amber-600 border-transparent"}`}><span>1. Capture Bundle</span></div><div className={`flex items-center gap-2 pb-2 border-b-2 ${step===2?"text-slate-900 border-amber-500":"border-transparent"}`}><span>2. Review Matrix</span></div></div>
        {error && (<div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm"><AlertTriangle className="h-5 w-5 shrink-0"/><p>{error}</p></div>)}

        {step === 1 && (
          <form onSubmit={executeLiveAnalysis} className="space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div><h2 className="text-lg font-bold text-slate-800 border-b pb-3">Discrepancy Analysis Input</h2></div>
              <button type="button" onClick={loadDemoCase} className="text-xs text-amber-600 hover:text-amber-800 font-bold border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-50">← Try Demo First</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Case Ref / RAF Number *</label><input required type="text" value={caseRef} onChange={e=>setCaseRef(e.target.value)} placeholder="RAF/2024/008921" className="w-full px-4 py-2.5 border rounded-xl focus:outline-amber-500 text-sm bg-slate-50"/></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Claimant *</label><input required type="text" value={claimant} onChange={e=>setClaimant(e.target.value)} placeholder="Sipho Ndlovu" className="w-full px-4 py-2.5 border rounded-xl focus:outline-amber-500 text-sm bg-slate-50"/></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Instructing Attorney</label><input type="text" value={attorney} onChange={e=>setAttorney(e.target.value)} placeholder="Your Name" className="w-full px-4 py-2.5 border rounded-xl focus:outline-amber-500 text-sm bg-slate-50"/></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Date of Accident *</label><input required type="date" value={accidentDate} onChange={e=>setAccidentDate(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl focus:outline-amber-500 text-sm bg-slate-50"/></div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2">
              <Scan size={14} className="shrink-0 mt-0.5"/>
              <div>Upload hospital records and up to 2 expert reports. PDF, PNG, JPEG supported. OCR runs automatically for scanned documents. <span className="font-bold">POPIA compliant — files shredded after 24 hours.</span></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-amber-400 transition-colors">
                <Upload size={20} className="mx-auto text-slate-400 mb-2"/><h3 className="text-xs font-bold text-slate-600 mb-1">Hospital Record</h3>
                <p className="text-[10px] text-slate-400 mb-3">{hospitalRecord?.name || 'Select file...'}</p>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"><input type="file" className="hidden" onChange={e=>handleFileUpload(e,'hospital')} accept=".pdf,.png,.jpg,.jpeg,.tiff,.webp"/>Browse</label>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-amber-400 transition-colors">
                <Upload size={20} className="mx-auto text-slate-400 mb-2"/><h3 className="text-xs font-bold text-slate-600 mb-1">Expert Report A</h3>
                <p className="text-[10px] text-slate-400 mb-3">{expertReportA?.name || 'Select file...'}</p>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"><input type="file" className="hidden" onChange={e=>handleFileUpload(e,'expertA')} accept=".pdf,.png,.jpg,.jpeg,.tiff,.webp"/>Browse</label>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-amber-400 transition-colors">
                <Upload size={20} className="mx-auto text-slate-400 mb-2"/><h3 className="text-xs font-bold text-slate-600 mb-1">Expert Report B</h3>
                <p className="text-[10px] text-slate-400 mb-3">{expertReportB?.name || 'Select file...'}</p>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"><input type="file" className="hidden" onChange={e=>handleFileUpload(e,'expertB')} accept=".pdf,.png,.jpg,.jpeg,.tiff,.webp"/>Browse</label>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={consented} onChange={e=>setConsented(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"/>
                <span className="text-xs text-slate-500">I confirm consent and accept terms. Files are processed in South Africa and deleted after 24 hours per POPIA.</span>
              </label>
            </div>
            <button type="submit" disabled={loading || !consented} className="w-full bg-slate-950 text-white font-bold py-3.5 rounded-xl hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all">
              {loading ? <><RefreshCw size={16} className="animate-spin"/>{processingStage || 'Processing...'}</> : <><BarChart3 size={16}/>Execute Discrepancy Engine</>}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <span className="text-xs font-mono px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold">{isDemo?"DEMO":"LIVE MATRIX"}</span>
                  <h2 className="text-xl font-extrabold text-slate-800 mt-2">{claimant||"Claimant"}</h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">Ref: {caseRef} · {accidentDate}{isDemo?" · Sample":""}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={handleSaveToDashboard} disabled={saved||saving||isDemo} className={`border font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all ${saved?'bg-emerald-500 text-white border-emerald-500':saving?'bg-slate-100 text-slate-400':'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'}`}><Save size={14}/>{saved?'Saved to Dashboard':saving?'Saving...':'Save to Dashboard'}</button>
                  <button onClick={handleExportIndex} className="border font-bold text-xs px-4 py-2.5 rounded-xl bg-slate-950 text-white hover:bg-slate-900 flex items-center gap-2"><Download size={14}/>CaseLines .docx</button>
                  <button onClick={()=>setStep(1)} className="border font-bold text-xs px-4 py-2.5 rounded-xl bg-white text-slate-700 hover:bg-slate-50">← New</button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center"><div className="text-2xl font-extrabold text-red-700">{stats.high}</div><div className="text-[10px] font-bold text-red-600 uppercase mt-1">Critical</div></div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center"><div className="text-2xl font-extrabold text-amber-700">{stats.med}</div><div className="text-[10px] font-bold text-amber-600 uppercase mt-1">Significant</div></div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center"><div className="text-2xl font-extrabold text-blue-700">{stats.low}</div><div className="text-[10px] font-bold text-blue-600 uppercase mt-1">Minor</div></div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center"><div className="text-2xl font-extrabold text-slate-700">{confPct}%</div><div className="text-[10px] font-bold text-slate-500 uppercase mt-1">Confidence</div></div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center"><TrendingDown size={14} className="text-amber-600 inline mr-1"/><span className="text-lg font-extrabold text-amber-700">R{stats.quantumRisk.toLocaleString()}</span><div className="text-[10px] font-bold text-amber-600 uppercase mt-1">Quantum at Risk</div></div>
              </div>
              {stats.high>0&&(<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/><div><span className="font-bold">{stats.high} critical contradictions.</span> If unaddressed, RAF's team will exploit — reducing quantum by ~R{stats.quantumRisk.toLocaleString()}.</div></div>)}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-950 text-white font-mono uppercase text-xs tracking-wider">
                    <tr><th className="p-4 border-b w-28">Date</th><th className="p-4 border-b w-40">Event</th><th className="p-4 border-b">Hospital</th><th className="p-4 border-b">Expert A</th><th className="p-4 border-b">Expert B</th><th className="p-4 border-b w-24">Risk</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {matrixData.map((item,index)=>{
                      const isHigh=item.riskLevel==="HIGH";const isMed=item.riskLevel==="MEDIUM";
                      return(
                        <React.Fragment key={index}>
                          <tr className={`transition-all ${isHigh?"bg-red-50/40":isMed?"bg-amber-50/30":"hover:bg-slate-50"}`}>
                            <td className="p-4 font-mono font-bold text-slate-600 align-top text-xs">{item.date}</td>
                            <td className="p-4 font-bold text-slate-800 align-top">{item.event}</td>
                            <td className="p-4 text-slate-600 text-xs align-top">{item.hospitalRecord||"—"}</td>
                            <td className="p-4 text-slate-600 text-xs align-top">{item.expertA||"—"}</td>
                            <td className="p-4 text-slate-600 text-xs align-top">{item.expertB||"—"}</td>
                            <td className="p-4 align-top"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${isHigh?"bg-red-100 text-red-800":isMed?"bg-amber-100 text-amber-800":"bg-emerald-100 text-emerald-800"}`}>{isHigh&&<AlertTriangle className="h-3 w-3"/>}{item.riskLevel}</span></td>
                          </tr>
                          {(isHigh||isMed)&&(
                            <tr className={isHigh?"bg-red-50/40":"bg-amber-50/30"}>
                              <td colSpan={6} className="px-4 pb-4 pt-0">
                                <div className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${isHigh?"border-red-200 bg-white text-red-900":"border-amber-200 bg-white text-amber-900"}`}>
                                  <ShieldCheck className={`h-4 w-4 shrink-0 mt-0.5 ${isHigh?"text-red-600":"text-amber-600"}`}/>
                                  <div className="flex-1">
                                    <span className="font-extrabold uppercase font-mono text-[10px]">{isHigh?'STRATEGIC ALERT':'REVIEW NOTE'}:</span> {item.strategicAlert}
                                    {item.sourcePage && <div className="text-[10px] mt-1 opacity-60">Source: {item.sourcePage}</div>}
                                  </div>
                                  <button onClick={markReviewed} className="shrink-0 text-[10px] font-bold border px-2 py-1 rounded hover:bg-slate-100"><CheckCircle size={12} className="inline mr-1"/>Reviewed</button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
